/**
 * AF Motion Multi-Touch Controller
 *
 * Framework-independent controller supporting combined pan, pinch-zoom, and rotation,
 * anti-jump baseline stabilization across changing contact counts, bounds clamping,
 * scale/rotation limits, inertia momentum, and elastic spring-back.
 */

import { animateInertia, type InertiaControls } from "../inertia.js";
import { acquirePointerCapture, releasePointerCapture } from "../pointer-capture.js";
import { animateSpring, type SpringControls } from "../spring.js";
import { removeTransformLayer, setTransformLayer } from "../transform.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import { PointerTracker } from "./pointer-tracker.js";
import type {
  MultiTouchController,
  MultiTouchControllerOptions,
  MultiTouchState,
  NormalizedInputEvent,
  PinchDirection,
  Point2D,
  TouchTransform,
  TrackedPointer,
  Velocity2D,
} from "./types.js";

const DEFAULT_PAN_THRESHOLD = 3;
const DEFAULT_PINCH_THRESHOLD = 0.02; // 2% scale delta
const DEFAULT_ROTATION_THRESHOLD = 1.0; // 1 degree
const DEFAULT_MIN_SCALE = 0.1;
const DEFAULT_MAX_SCALE = 10;

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

export class MultiTouchEngine implements MultiTouchController {
  public readonly target: HTMLElement;
  private readonly options: MultiTouchControllerOptions;
  private readonly tracker = new PointerTracker();

  private translation: Point2D = { x: 0, y: 0 };
  private scale = 1;
  private rotation = 0; // in degrees

  private deltaCentroid: Point2D = { x: 0, y: 0 };
  private deltaScale = 0;
  private deltaRotation = 0;
  private pinchDirection: PinchDirection = "none";
  private velocity: Velocity2D = { vx: 0, vy: 0, speed: 0 };
  private angularVelocity = 0;
  private scaleVelocity = 0;

  // Anti-jump stabilization baselines
  private baselineCentroid: Point2D = { x: 0, y: 0 };
  private baselineDistance = 0;
  private baselineAngle = 0; // radians
  private lastTouchCount = 0;

  private isInteracting = false;
  private inertiaPanX: InertiaControls | null = null;
  private inertiaPanY: InertiaControls | null = null;
  private inertiaRot: InertiaControls | null = null;
  private springScale: SpringControls | null = null;
  private springPanX: SpringControls | null = null;
  private springPanY: SpringControls | null = null;

  private readonly originalTouchAction: string;
  private boundListeners: Array<{ target: EventTarget; type: string; listener: EventListener; options?: any }> = [];
  private isDestroyed = false;

  constructor(target: HTMLElement, options: MultiTouchControllerOptions = {}) {
    this.target = target;
    this.options = { ...options };

    this.originalTouchAction = target.style.touchAction ?? "";
    if (this.options.touchAction !== undefined) {
      target.style.touchAction = this.options.touchAction;
    } else {
      target.style.touchAction = "none";
    }

    this.attach();
  }

  public getState(): MultiTouchState {
    const geom = this.tracker.getMultiPointerState();
    return {
      isActive: this.isInteracting,
      touchCount: geom.count,
      pointers: geom.pointers,
      centroid: geom.center,
      deltaCentroid: { ...this.deltaCentroid },
      translation: { ...this.translation },
      scale: this.scale,
      deltaScale: this.deltaScale,
      rotation: this.rotation,
      deltaRotation: this.deltaRotation,
      pinchDirection: this.pinchDirection,
      velocity: { ...this.velocity },
      angularVelocity: this.angularVelocity,
      scaleVelocity: this.scaleVelocity,
    };
  }

  public getTransform(): TouchTransform {
    const geom = this.tracker.getMultiPointerState();
    return {
      translation: { ...this.translation },
      scale: this.scale,
      rotation: this.rotation,
      rotationRad: (this.rotation * Math.PI) / 180,
      center: geom.center,
    };
  }

  public setTranslation(pos: Partial<Point2D>): void {
    this.translation = {
      x: pos.x !== undefined ? pos.x : this.translation.x,
      y: pos.y !== undefined ? pos.y : this.translation.y,
    };
    this.render();
  }

  public setScale(scale: number): void {
    this.scale = Math.max(0.01, scale);
    this.render();
  }

  public setRotation(rotation: number): void {
    this.rotation = rotation;
    this.render();
  }

  public isActive(): boolean {
    return this.isInteracting;
  }

  public cancel(): void {
    this.stopMomentum();
    this.isInteracting = false;
    this.deltaCentroid = { x: 0, y: 0 };
    this.deltaScale = 0;
    this.deltaRotation = 0;
    this.pinchDirection = "none";
    this.tracker.releaseAll();
    this.tracker.clear();
    this.lastTouchCount = 0;
    this.options.onCancel?.(this.getState());
  }

  public reset(): void {
    this.cancel();
    this.translation = { x: 0, y: 0 };
    this.scale = 1;
    this.rotation = 0;
    this.render();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.cancel();
    this.removeTransform();

    // Restore original touch-action
    if (typeof this.target.style.removeProperty === "function") {
      if (this.originalTouchAction) {
        this.target.style.touchAction = this.originalTouchAction;
      } else {
        this.target.style.removeProperty("touch-action");
      }
    }

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

    const isPassive = this.options.passive ?? false;

    // Pointer Events
    add(this.target, "pointerdown", this.handlePointerDown as EventListener, isPassive);
    add(this.target, "pointermove", this.handlePointerMove as EventListener, isPassive);
    add(this.target, "pointerup", this.handlePointerUp as EventListener, isPassive);
    add(this.target, "pointercancel", this.handlePointerCancel as EventListener, isPassive);
    add(this.target, "lostpointercapture", this.handlePointerCancel as EventListener, true);
  }

  private checkPreventDefault(normalized: NormalizedInputEvent): void {
    if (typeof this.options.preventDefault === "function") {
      if (this.options.preventDefault(normalized)) {
        normalized.preventDefault();
      }
    } else if (this.options.preventDefault === true) {
      normalized.preventDefault();
    }
  }

  private rebaseline(): void {
    const geom = this.tracker.getMultiPointerState();
    this.baselineCentroid = { ...geom.center };
    this.baselineDistance = geom.distance;
    this.baselineAngle = geom.angle;
    this.lastTouchCount = geom.count;
  }

  private handlePointerDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerType !== "touch" && normalized.source !== "touch") return;

    if (this.options.isolate) normalized.stopPropagation();
    this.checkPreventDefault(normalized);
    this.stopMomentum();

    const pointer = this.tracker.trackDown(normalized);
    if (!pointer) return;

    if (normalized.pointerId !== null) {
      acquirePointerCapture(this.target, normalized.pointerId);
    }

    const geom = this.tracker.getMultiPointerState();

    if (!this.isInteracting && geom.count >= 1) {
      this.isInteracting = true;
      this.rebaseline();
      this.options.onStart?.(this.getState());
    } else {
      // Re-baseline to prevent jump when contact count changes
      this.rebaseline();
    }
  };

  private handlePointerMove = (event: Event): void => {
    if (this.isDestroyed || !this.isInteracting) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerType !== "touch" && normalized.source !== "touch") return;

    this.checkPreventDefault(normalized);
    const pointer = this.tracker.trackMove(normalized);
    if (!pointer) return;

    const geom = this.tracker.getMultiPointerState();
    const count = geom.count;

    // Detect contact count change during move
    if (count !== this.lastTouchCount) {
      this.rebaseline();
      return;
    }

    if (count === 0) return;

    let dX = 0;
    let dY = 0;
    let dScale = 0;
    let dRotation = 0;

    // 1. Pan Calculation
    const enablePan = this.options.enablePan !== false;
    const canPan =
      enablePan &&
      ((count === 1 && this.options.singleFingerPan !== false) ||
        (count >= 2 && this.options.twoFingerPan !== false));

    if (canPan) {
      const panThreshold = this.options.panThreshold ?? DEFAULT_PAN_THRESHOLD;
      const rawDx = geom.center.x - this.baselineCentroid.x;
      const rawDy = geom.center.y - this.baselineCentroid.y;

      if (Math.hypot(rawDx, rawDy) >= panThreshold || this.deltaCentroid.x !== 0 || this.deltaCentroid.y !== 0) {
        const panAxis = this.options.panAxis ?? "both";
        if (panAxis !== "none") {
          dX = rawDx;
          dY = rawDy;
          if (panAxis === "x") dY = 0;
          if (panAxis === "y") dX = 0;
        }
      }
    }

    // 2. Pinch Scale Calculation
    const enablePinch = this.options.enablePinch !== false && count >= 2;
    if (enablePinch && this.baselineDistance > 0 && geom.distance > 0) {
      const pinchThreshold = this.options.pinchThreshold ?? DEFAULT_PINCH_THRESHOLD;
      const currentScaleFactor = geom.distance / this.baselineDistance;
      const scaleDeltaFromBaseline = currentScaleFactor - 1;

      if (Math.abs(scaleDeltaFromBaseline) >= pinchThreshold || this.deltaScale !== 0) {
        dScale = currentScaleFactor;
      }
    }

    // 3. Rotation Calculation
    const enableRotation = this.options.enableRotation !== false && count >= 2;
    if (enableRotation) {
      const rotationThreshold = this.options.rotationThreshold ?? DEFAULT_ROTATION_THRESHOLD;
      let angleDiff = geom.angle - this.baselineAngle;

      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      const degDiff = (angleDiff * 180) / Math.PI;
      if (Math.abs(degDiff) >= rotationThreshold || this.deltaRotation !== 0) {
        dRotation = degDiff;
      }
    }

    // Apply Transformations
    if (dX !== 0 || dY !== 0) {
      const bounds = this.options.bounds;
      const elastic = this.options.elastic;
      const factor = typeof elastic === "number" ? elastic : elastic ? 0.25 : 0;

      let newX = this.translation.x + dX;
      let newY = this.translation.y + dY;

      if (factor > 0) {
        newX = applyRubberband(newX, bounds?.minX, bounds?.maxX, factor);
        newY = applyRubberband(newY, bounds?.minY, bounds?.maxY, factor);
      } else if (bounds) {
        if (bounds.minX !== undefined) newX = Math.max(bounds.minX, newX);
        if (bounds.maxX !== undefined) newX = Math.min(bounds.maxX, newX);
        if (bounds.minY !== undefined) newY = Math.max(bounds.minY, newY);
        if (bounds.maxY !== undefined) newY = Math.min(bounds.maxY, newY);
      }

      this.deltaCentroid = { x: newX - this.translation.x, y: newY - this.translation.y };
      this.translation = { x: newX, y: newY };
      this.options.onPan?.(this.translation, this.getState());
    }

    if (dScale !== 0) {
      const minScale = this.options.minScale ?? DEFAULT_MIN_SCALE;
      const maxScale = this.options.maxScale ?? DEFAULT_MAX_SCALE;
      let newScale = this.scale * dScale;

      const elastic = this.options.elastic;
      const factor = typeof elastic === "number" ? elastic : elastic ? 0.25 : 0;
      if (factor > 0) {
        newScale = applyRubberband(newScale, minScale, maxScale, factor);
      } else {
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
      }

      this.deltaScale = newScale - this.scale;
      this.pinchDirection = this.deltaScale > 0 ? "out" : this.deltaScale < 0 ? "in" : "none";
      this.scale = newScale;
      this.options.onPinch?.(this.scale, this.getState());
    }

    if (dRotation !== 0) {
      let newRotation = this.rotation + dRotation;
      if (this.options.minRotation !== undefined) newRotation = Math.max(this.options.minRotation, newRotation);
      if (this.options.maxRotation !== undefined) newRotation = Math.min(this.options.maxRotation, newRotation);

      this.deltaRotation = newRotation - this.rotation;
      this.rotation = newRotation;
      this.options.onRotate?.(this.rotation, this.getState());
    }

    // Velocity estimation from primary pointer
    const primary = this.tracker.getPrimaryPointer();
    if (primary) {
      this.velocity = {
        vx: primary.velocityX,
        vy: primary.velocityY,
        speed: Math.hypot(primary.velocityX, primary.velocityY),
      };
    }

    // Advance baseline after applying frame deltas
    this.baselineCentroid = { ...geom.center };
    this.baselineDistance = geom.distance;
    this.baselineAngle = geom.angle;

    this.render();
    const state = this.getState();
    this.options.onMove?.(state);
    this.options.onTransform?.(this.getTransform(), state);
  };

  private handlePointerUp = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerType !== "touch" && normalized.source !== "touch") return;

    const pointer = this.tracker.trackUp(normalized);
    if (normalized.pointerId !== null) {
      releasePointerCapture(this.target, normalized.pointerId);
    }

    const remainingCount = this.tracker.pointerCount;

    if (remainingCount > 0) {
      // Re-baseline with remaining fingers to prevent jumping
      this.rebaseline();
    } else {
      // All touches finished
      this.isInteracting = false;
      this.options.onEnd?.(this.getState());
      this.handleReleasePhysics(pointer);
    }
  };

  private handlePointerCancel = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const pointer = this.tracker.trackCancel(normalized);
    if (normalized.pointerId !== null) {
      releasePointerCapture(this.target, normalized.pointerId);
    }

    if (this.tracker.pointerCount === 0) {
      this.cancel();
    } else {
      this.rebaseline();
    }
  };

  private handleReleasePhysics(pointer: TrackedPointer | null): void {
    const minScale = this.options.minScale ?? DEFAULT_MIN_SCALE;
    const maxScale = this.options.maxScale ?? DEFAULT_MAX_SCALE;
    const bounds = this.options.bounds;

    // Check Scale Limits Spring-Back
    const outOfScale = this.scale < minScale || this.scale > maxScale;
    if (this.options.springBack !== false && outOfScale) {
      const targetScale = this.scale < minScale ? minScale : maxScale;
      this.springScale = animateSpring({
        from: this.scale,
        to: targetScale,
        config: { stiffness: 240, damping: 24 },
        onUpdate: (v) => {
          this.scale = v.position;
          this.render();
          this.options.onPinch?.(this.scale, this.getState());
        },
        onComplete: () => {
          this.springScale = null;
        },
      });
      return;
    }

    // Check Bounds Spring-Back
    if (bounds) {
      const outOfBoundsX =
        (bounds.minX !== undefined && this.translation.x < bounds.minX) ||
        (bounds.maxX !== undefined && this.translation.x > bounds.maxX);
      const outOfBoundsY =
        (bounds.minY !== undefined && this.translation.y < bounds.minY) ||
        (bounds.maxY !== undefined && this.translation.y > bounds.maxY);

      if (this.options.springBack !== false && (outOfBoundsX || outOfBoundsY)) {
        if (outOfBoundsX) {
          const targetX = bounds.minX !== undefined && this.translation.x < bounds.minX ? bounds.minX : bounds.maxX!;
          this.springPanX = animateSpring({
            from: this.translation.x,
            to: targetX,
            config: { stiffness: 240, damping: 24 },
            onUpdate: (v) => {
              this.translation = { ...this.translation, x: v.position };
              this.render();
              this.options.onPan?.(this.translation, this.getState());
            },
            onComplete: () => {
              this.springPanX = null;
            },
          });
        }

        if (outOfBoundsY) {
          const targetY = bounds.minY !== undefined && this.translation.y < bounds.minY ? bounds.minY : bounds.maxY!;
          this.springPanY = animateSpring({
            from: this.translation.y,
            to: targetY,
            config: { stiffness: 240, damping: 24 },
            onUpdate: (v) => {
              this.translation = { ...this.translation, y: v.position };
              this.render();
              this.options.onPan?.(this.translation, this.getState());
            },
            onComplete: () => {
              this.springPanY = null;
            },
          });
        }
        return;
      }
    }

    // Inertial Momentum Continuation
    if (this.options.inertia !== false && pointer && pointer.distance > 0) {
      const friction = this.options.friction ?? 8;
      const vx = pointer.velocityX;
      const vy = pointer.velocityY;

      if (Math.abs(vx) > 30) {
        this.inertiaPanX = animateInertia({
          from: this.translation.x,
          initialVelocity: vx,
          friction,
          min: bounds?.minX,
          max: bounds?.maxX,
          onUpdate: (u) => {
            this.translation = { ...this.translation, x: u.position };
            this.render();
            this.options.onPan?.(this.translation, this.getState());
          },
          onComplete: () => {
            this.inertiaPanX = null;
          },
        });
      }

      if (Math.abs(vy) > 30) {
        this.inertiaPanY = animateInertia({
          from: this.translation.y,
          initialVelocity: vy,
          friction,
          min: bounds?.minY,
          max: bounds?.maxY,
          onUpdate: (u) => {
            this.translation = { ...this.translation, y: u.position };
            this.render();
            this.options.onPan?.(this.translation, this.getState());
          },
          onComplete: () => {
            this.inertiaPanY = null;
          },
        });
      }
    }
  }

  private render(): void {
    if (this.options.applyTransform !== false) {
      setTransformLayer(
        this.target,
        this,
        `translate3d(${this.translation.x}px, ${this.translation.y}px, 0) scale(${this.scale}) rotate(${this.rotation}deg)`
      );
    }
  }

  private removeTransform(): void {
    if (this.options.applyTransform !== false) {
      removeTransformLayer(this.target, this);
    }
  }

  private stopMomentum(): void {
    if (this.inertiaPanX) {
      this.inertiaPanX.cancel();
      this.inertiaPanX = null;
    }
    if (this.inertiaPanY) {
      this.inertiaPanY.cancel();
      this.inertiaPanY = null;
    }
    if (this.inertiaRot) {
      this.inertiaRot.cancel();
      this.inertiaRot = null;
    }
    if (this.springScale) {
      this.springScale.cancel();
      this.springScale = null;
    }
    if (this.springPanX) {
      this.springPanX.cancel();
      this.springPanX = null;
    }
    if (this.springPanY) {
      this.springPanY.cancel();
      this.springPanY = null;
    }
  }
}

/**
 * Creates and attaches a Multi-Touch Controller to an element.
 */
export function createMultiTouchController(
  target: HTMLElement,
  options: MultiTouchControllerOptions = {}
): MultiTouchController {
  return new MultiTouchEngine(target, options);
}
