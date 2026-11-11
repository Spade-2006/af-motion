/**
 * AF Motion Advanced Drag Engine
 *
 * Framework-independent controller supporting element dragging, axis locking,
 * elastic boundaries, snap-to-grid, snap points, momentum continuation,
 * keyboard accessibility, nested draggable isolation, and composable transforms.
 */

import { animateInertia, type InertiaControls } from "../inertia.js";
import { acquirePointerCapture, releasePointerCapture } from "../pointer-capture.js";
import { animateSpring, type SpringControls } from "../spring.js";
import { removeTransformLayer, setTransformLayer } from "../transform.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import { PointerTracker } from "./pointer-tracker.js";
import type {
  AdvancedDragControls,
  AdvancedDragOptions,
  AdvancedDragState,
  DragAxisMode,
  DragBounds,
  DragPosition,
  NormalizedInputEvent,
  PointerType,
  SnapPoint,
  TrackedPointer,
  Velocity2D,
} from "./types.js";

const DEFAULT_THRESHOLD = 3;
const DEFAULT_SNAP_RADIUS = 20;
const DEFAULT_KEYBOARD_STEP = 10;
const DEFAULT_KEYBOARD_FAST_STEP = 50;

function resolveContainerBounds(target: HTMLElement, container: HTMLElement | string): DragBounds {
  let containerEl: HTMLElement | null = null;
  if (typeof container === "string") {
    containerEl = document.querySelector(container);
  } else if (container instanceof HTMLElement) {
    containerEl = container;
  }

  if (!containerEl || typeof target.getBoundingClientRect !== "function" || typeof containerEl.getBoundingClientRect !== "function") {
    return {};
  }

  try {
    const targetRect = target.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    return {
      minX: containerRect.left - targetRect.left,
      maxX: containerRect.right - targetRect.right,
      minY: containerRect.top - targetRect.top,
      maxY: containerRect.bottom - targetRect.bottom,
    };
  } catch {
    return {};
  }
}

function applyRubberband(value: number, min: number | undefined, max: number | undefined, factor: number): number {
  if (min !== undefined && value < min) {
    const overflow = min - value;
    return min - (overflow * factor) / (1 + overflow * 0.005);
  }
  if (max !== undefined && value > max) {
    const overflow = value - max;
    return max + (overflow * factor) / (1 + overflow * 0.005);
  }
  return value;
}

export class AdvancedDragEngine implements AdvancedDragControls {
  public readonly target: HTMLElement;
  private readonly options: AdvancedDragOptions;
  private readonly tracker = new PointerTracker();

  private position: DragPosition = { x: 0, y: 0 };
  private startPosition: DragPosition = { x: 0, y: 0 };
  private startPointerPoint: DragPosition = { x: 0, y: 0 };
  private offset: DragPosition = { x: 0, y: 0 };
  private delta: DragPosition = { x: 0, y: 0 };
  private velocity: Velocity2D = { vx: 0, vy: 0, speed: 0 };

  private isDraggingState = false;
  private isSnappingState = false;
  private activePointerId: number | null = null;
  private activePointerType: PointerType = "mouse";
  private lockedAxis: "x" | "y" | null = null;
  private delayTimer: any = null;
  private pendingPointerEvent: NormalizedInputEvent | null = null;

  private inertiaControlsX: InertiaControls | null = null;
  private inertiaControlsY: InertiaControls | null = null;
  private springControlsX: SpringControls | null = null;
  private springControlsY: SpringControls | null = null;

  private boundListeners: Array<{ target: EventTarget; type: string; listener: EventListener; options?: any }> = [];
  private isDestroyed = false;

  constructor(target: HTMLElement, options: AdvancedDragOptions = {}) {
    this.target = target;
    this.options = { ...options };

    this.attach();
  }

  public getState(): AdvancedDragState {
    return {
      isDragging: this.isDraggingState,
      isSnapping: this.isSnappingState,
      position: { ...this.position },
      offset: { ...this.offset },
      delta: { ...this.delta },
      velocity: { ...this.velocity },
      axis: this.options.axis ?? "both",
      lockedAxis: this.lockedAxis,
      pointerId: this.activePointerId,
      pointerType: this.activePointerType,
      cancelled: false,
    };
  }

  public getPosition(): DragPosition {
    return { ...this.position };
  }

  public setPosition(pos: Partial<DragPosition>): void {
    this.position = {
      x: pos.x !== undefined ? pos.x : this.position.x,
      y: pos.y !== undefined ? pos.y : this.position.y,
    };
    this.render();
  }

  public isDragging(): boolean {
    return this.isDraggingState;
  }

  public cancel(): void {
    this.clearTimers();
    this.stopMomentum();

    if (this.isDraggingState) {
      this.isDraggingState = false;
      this.position = { ...this.startPosition };
      this.render();

      const state: AdvancedDragState = {
        ...this.getState(),
        cancelled: true,
      };
      this.options.onDragEnd?.(state);
    }

    if (this.activePointerId !== null) {
      releasePointerCapture(this.target, this.activePointerId);
      this.activePointerId = null;
    }

    this.tracker.clear();
    this.lockedAxis = null;
  }

  public reset(): void {
    this.cancel();
    this.position = { x: 0, y: 0 };
    this.offset = { x: 0, y: 0 };
    this.delta = { x: 0, y: 0 };
    this.render();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.cancel();
    this.removeTransform();

    for (const { target, type, listener, options } of this.boundListeners) {
      try {
        target.removeEventListener(type, listener, options);
      } catch {
        // Safe disposal
      }
    }
    this.boundListeners = [];
  }

  private attach(): void {
    if (typeof window === "undefined" || !this.target) return;

    const add = (target: EventTarget, type: string, handler: EventListener, passive = true) => {
      const options = { passive };
      target.addEventListener(type, handler, options);
      this.boundListeners.push({ target, type, listener: handler, options });
    };

    add(this.target, "pointerdown", this.handlePointerDown as EventListener, false);
    add(this.target, "pointermove", this.handlePointerMove as EventListener, false);
    add(this.target, "pointerup", this.handlePointerUp as EventListener, false);
    add(this.target, "pointercancel", this.handlePointerCancel as EventListener, false);
    add(this.target, "lostpointercapture", this.handlePointerCancel as EventListener, false);

    if (this.options.keyboardEnabled !== false) {
      add(this.target, "keydown", this.handleKeyDown as EventListener, false);
    }
  }

  private handlePointerDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);

    // Filter allowed buttons (default left-click 0)
    const allowedButtons = this.options.buttons ?? [0];
    const raw = normalized.originalEvent as MouseEvent;
    if (typeof raw.button === "number" && !allowedButtons.includes(raw.button)) {
      return;
    }

    // Custom canDrag check
    if (this.options.canDrag && !this.options.canDrag(normalized)) {
      return;
    }

    // Stop propagation for nested draggables
    if (this.options.isolate !== false) {
      normalized.stopPropagation();
    }

    this.stopMomentum();
    const pointer = this.tracker.trackDown(normalized);
    if (!pointer) return;

    this.activePointerId = pointer.id;
    this.activePointerType = pointer.pointerType;
    this.startPosition = { ...this.position };
    this.startPointerPoint = { x: pointer.currentPoint.x, y: pointer.currentPoint.y };
    this.lockedAxis = null;

    acquirePointerCapture(this.target, pointer.id);

    const delay = this.options.delayMs ?? 0;
    if (delay > 0) {
      this.pendingPointerEvent = normalized;
      this.delayTimer = setTimeout(() => {
        this.delayTimer = null;
        if (this.pendingPointerEvent) {
          this.beginDrag(this.pendingPointerEvent, pointer);
        }
      }, delay);
    }
  };

  private handlePointerMove = (event: Event): void => {
    if (this.isDestroyed || this.activePointerId === null) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerId !== this.activePointerId) return;

    const pointer = this.tracker.trackMove(normalized);
    if (!pointer) return;

    if (!this.isDraggingState) {
      const threshold = this.options.threshold ?? DEFAULT_THRESHOLD;
      if (pointer.distance >= threshold) {
        if (this.delayTimer !== null) {
          clearTimeout(this.delayTimer);
          this.delayTimer = null;
        }
        this.beginDrag(normalized, pointer);
      }
      return;
    }

    // Ongoing drag update
    this.updateDrag(pointer, normalized);
  };

  private handlePointerUp = (event: Event): void => {
    if (this.isDestroyed || this.activePointerId === null) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerId !== this.activePointerId) return;

    this.clearTimers();
    const pointer = this.tracker.trackUp(normalized);

    if (this.activePointerId !== null) {
      releasePointerCapture(this.target, this.activePointerId);
      this.activePointerId = null;
    }

    if (this.isDraggingState) {
      this.endDrag(pointer);
    }
  };

  private handlePointerCancel = (event: Event): void => {
    if (this.isDestroyed || this.activePointerId === null) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerId !== null && normalized.pointerId !== this.activePointerId) return;

    this.clearTimers();
    if (this.activePointerId !== null) {
      releasePointerCapture(this.target, this.activePointerId);
      this.activePointerId = null;
    }

    if (this.isDraggingState) {
      this.cancel();
    }
  };

  private handleKeyDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const key = normalized.key;
    if (!key) return;

    // Escape cancels ongoing drag
    if (key === "Escape") {
      if (this.isDraggingState) {
        normalized.preventDefault();
        this.cancel();
      }
      return;
    }

    // Space / Enter toggles keyboard drag
    if (key === "Enter" || key === " " || key === "Spacebar") {
      normalized.preventDefault();
      if (this.isDraggingState) {
        this.isDraggingState = false;
        this.options.onDragEnd?.(this.getState());
      } else {
        this.isDraggingState = true;
        this.startPosition = { ...this.position };
        this.options.onDragStart?.(this.getState());
      }
      return;
    }

    // Arrow keys move active keyboard drag
    if (this.isDraggingState && key.startsWith("Arrow")) {
      normalized.preventDefault();
      const step = normalized.modifiers.shift
        ? (this.options.keyboardFastStep ?? DEFAULT_KEYBOARD_FAST_STEP)
        : (this.options.keyboardStep ?? DEFAULT_KEYBOARD_STEP);

      let dx = 0;
      let dy = 0;
      if (key === "ArrowLeft") dx = -step;
      if (key === "ArrowRight") dx = step;
      if (key === "ArrowUp") dy = -step;
      if (key === "ArrowDown") dy = step;

      const targetX = this.position.x + dx;
      const targetY = this.position.y + dy;
      const computed = this.computeConstrainedPosition(targetX, targetY, null);

      this.delta = { x: computed.x - this.position.x, y: computed.y - this.position.y };
      this.position = computed;
      this.offset = { x: this.position.x - this.startPosition.x, y: this.position.y - this.startPosition.y };

      this.render();
      this.options.onDrag?.(this.getState());
    }
  };

  private beginDrag(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    this.isDraggingState = true;
    this.velocity = { vx: 0, vy: 0, speed: 0 };

    // Determine initial direction lock if configured
    if (this.options.directionLock) {
      this.lockedAxis = Math.abs(pointer.deltaX) >= Math.abs(pointer.deltaY) ? "x" : "y";
    }

    this.updateDrag(pointer, event);
    this.options.onDragStart?.(this.getState());
  }

  private updateDrag(pointer: TrackedPointer, event: NormalizedInputEvent): void {
    const resistance = this.options.resistance ?? 0;
    const factor = Math.max(0, 1 - resistance);

    let rawDx = (pointer.currentPoint.x - this.startPointerPoint.x) * factor;
    let rawDy = (pointer.currentPoint.y - this.startPointerPoint.y) * factor;

    // Modifier shiftAxisLock
    if (this.options.shiftAxisLock && event.modifiers.shift) {
      if (Math.abs(rawDx) >= Math.abs(rawDy)) {
        rawDy = 0;
      } else {
        rawDx = 0;
      }
    }

    const targetX = this.startPosition.x + rawDx;
    const targetY = this.startPosition.y + rawDy;

    const computed = this.computeConstrainedPosition(targetX, targetY, pointer);

    this.delta = { x: computed.x - this.position.x, y: computed.y - this.position.y };
    this.position = computed;
    this.offset = { x: this.position.x - this.startPosition.x, y: this.position.y - this.startPosition.y };
    this.velocity = {
      vx: pointer.velocityX,
      vy: pointer.velocityY,
      speed: Math.hypot(pointer.velocityX, pointer.velocityY),
    };

    this.render();
    this.options.onDrag?.(this.getState());
  }

  private computeConstrainedPosition(
    targetX: number,
    targetY: number,
    pointer: TrackedPointer | null
  ): DragPosition {
    let x = targetX;
    let y = targetY;

    // Axis constraint
    const axis = this.options.axis ?? "both";
    if (axis === "none") {
      return { ...this.startPosition };
    }
    if (axis === "x" || this.lockedAxis === "x") {
      y = this.startPosition.y;
    } else if (axis === "y" || this.lockedAxis === "y") {
      x = this.startPosition.x;
    }

    // Custom coordinate transform
    if (this.options.transformCoordinate) {
      const transformed = this.options.transformCoordinate({ x, y });
      x = transformed.x;
      y = transformed.y;
    }

    // Resolve Bounds
    const bounds = this.getResolvedBounds();
    const elastic = this.options.elastic;
    const elasticFactor = typeof elastic === "number" ? elastic : elastic ? 0.25 : 0;

    if (elasticFactor > 0 && pointer) {
      x = applyRubberband(x, bounds.minX, bounds.maxX, elasticFactor);
      y = applyRubberband(y, bounds.minY, bounds.maxY, elasticFactor);
    } else {
      if (bounds.minX !== undefined) x = Math.max(bounds.minX, x);
      if (bounds.maxX !== undefined) x = Math.min(bounds.maxX, x);
      if (bounds.minY !== undefined) y = Math.max(bounds.minY, y);
      if (bounds.maxY !== undefined) y = Math.min(bounds.maxY, y);
    }

    // Grid snapping
    if (this.options.grid) {
      const gridX = Array.isArray(this.options.grid) ? this.options.grid[0] : this.options.grid;
      const gridY = Array.isArray(this.options.grid) ? this.options.grid[1] : this.options.grid;
      if (gridX > 0) x = Math.round(x / gridX) * gridX;
      if (gridY > 0) y = Math.round(y / gridY) * gridY;
    }

    // Snap Points
    this.isSnappingState = false;
    if (this.options.snapPoints && this.options.snapPoints.length > 0) {
      const radius = this.options.snapRadius ?? DEFAULT_SNAP_RADIUS;
      let closestPoint: SnapPoint | null = null;
      let minDistance = Infinity;

      for (const sp of this.options.snapPoints) {
        const d = Math.hypot(sp.x - x, sp.y - y);
        if (d <= radius && d < minDistance) {
          minDistance = d;
          closestPoint = sp;
        }
      }

      if (closestPoint) {
        x = closestPoint.x;
        y = closestPoint.y;
        this.isSnappingState = true;
        this.options.onSnap?.(closestPoint, this.getState());
      }
    }

    return { x, y };
  }

  private endDrag(pointer: TrackedPointer | null): void {
    this.isDraggingState = false;
    const state = this.getState();
    this.options.onDragEnd?.(state);

    const bounds = this.getResolvedBounds();
    const isOutOfBounds =
      (bounds.minX !== undefined && this.position.x < bounds.minX) ||
      (bounds.maxX !== undefined && this.position.x > bounds.maxX) ||
      (bounds.minY !== undefined && this.position.y < bounds.minY) ||
      (bounds.maxY !== undefined && this.position.y > bounds.maxY);

    const shouldSpringBack = this.options.springBack !== false && isOutOfBounds;

    if (shouldSpringBack) {
      this.springBackToBounds(bounds);
      return;
    }

    // Momentum Continuation
    if (this.options.inertia !== false && pointer && pointer.distance > 0) {
      const maxVel = this.options.maxVelocity ?? 3000;
      let vx = Math.min(maxVel, Math.max(-maxVel, pointer.velocityX));
      let vy = Math.min(maxVel, Math.max(-maxVel, pointer.velocityY));

      const axis = this.options.axis ?? "both";
      if (axis === "x" || this.lockedAxis === "x") vy = 0;
      if (axis === "y" || this.lockedAxis === "y") vx = 0;

      const friction = this.options.friction ?? 8;

      if (Math.abs(vx) > 20) {
        this.inertiaControlsX = animateInertia({
          from: this.position.x,
          initialVelocity: vx,
          friction,
          min: bounds.minX,
          max: bounds.maxX,
          onUpdate: (u) => {
            this.position = { ...this.position, x: u.position };
            this.render();
            this.options.onDrag?.(this.getState());
          },
          onComplete: () => {
            this.inertiaControlsX = null;
          },
        });
      }

      if (Math.abs(vy) > 20) {
        this.inertiaControlsY = animateInertia({
          from: this.position.y,
          initialVelocity: vy,
          friction,
          min: bounds.minY,
          max: bounds.maxY,
          onUpdate: (u) => {
            this.position = { ...this.position, y: u.position };
            this.render();
            this.options.onDrag?.(this.getState());
          },
          onComplete: () => {
            this.inertiaControlsY = null;
          },
        });
      }
    }
  }

  private springBackToBounds(bounds: DragBounds): void {
    let targetX = this.position.x;
    let targetY = this.position.y;

    if (bounds.minX !== undefined && targetX < bounds.minX) targetX = bounds.minX;
    if (bounds.maxX !== undefined && targetX > bounds.maxX) targetX = bounds.maxX;
    if (bounds.minY !== undefined && targetY < bounds.minY) targetY = bounds.minY;
    if (bounds.maxY !== undefined && targetY > bounds.maxY) targetY = bounds.maxY;

    if (targetX !== this.position.x) {
      this.springControlsX = animateSpring({
        from: this.position.x,
        to: targetX,
        config: {
          stiffness: 250,
          damping: 25,
        },
        onUpdate: (v) => {
          this.position = { ...this.position, x: v.position };
          this.render();
          this.options.onDrag?.(this.getState());
        },
        onComplete: () => {
          this.springControlsX = null;
        },
      });
    }

    if (targetY !== this.position.y) {
      this.springControlsY = animateSpring({
        from: this.position.y,
        to: targetY,
        config: {
          stiffness: 250,
          damping: 25,
        },
        onUpdate: (v) => {
          this.position = { ...this.position, y: v.position };
          this.render();
          this.options.onDrag?.(this.getState());
        },
        onComplete: () => {
          this.springControlsY = null;
        },
      });
    }
  }

  private getResolvedBounds(): DragBounds {
    if (!this.options.bounds) return {};
    if (typeof this.options.bounds === "string" || this.options.bounds instanceof HTMLElement) {
      return resolveContainerBounds(this.target, this.options.bounds);
    }
    return this.options.bounds;
  }

  private render(): void {
    if (this.options.applyTransform !== false) {
      setTransformLayer(this.target, this, `translate3d(${this.position.x}px, ${this.position.y}px, 0)`);
    }
  }

  private removeTransform(): void {
    if (this.options.applyTransform !== false) {
      removeTransformLayer(this.target, this);
    }
  }

  private clearTimers(): void {
    if (this.delayTimer !== null) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
    this.pendingPointerEvent = null;
  }

  private stopMomentum(): void {
    if (this.inertiaControlsX) {
      this.inertiaControlsX.cancel();
      this.inertiaControlsX = null;
    }
    if (this.inertiaControlsY) {
      this.inertiaControlsY.cancel();
      this.inertiaControlsY = null;
    }
    if (this.springControlsX) {
      this.springControlsX.cancel();
      this.springControlsX = null;
    }
    if (this.springControlsY) {
      this.springControlsY.cancel();
      this.springControlsY = null;
    }
  }
}

/**
 * Creates and attaches an Advanced Drag Controller to an element.
 */
export function createDragController(
  target: HTMLElement,
  options: AdvancedDragOptions = {}
): AdvancedDragControls {
  return new AdvancedDragEngine(target, options);
}
