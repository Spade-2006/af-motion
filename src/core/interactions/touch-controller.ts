/**
 * AF Motion Touch Controller
 *
 * Framework-independent controller providing single and multi-touch tracking,
 * contact dimension extraction, touch-action management, and Pointer/Touch event deduplication.
 */

import { acquirePointerCapture, releasePointerCapture } from "../pointer-capture.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import { PointerTracker } from "./pointer-tracker.js";
import type {
  NormalizedInputEvent,
  Point2D,
  TouchController,
  TouchControllerOptions,
  TouchControllerState,
  TrackedPointer,
} from "./types.js";

interface DOMListener {
  target: EventTarget;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

export class TouchEngine implements TouchController {
  public readonly target: HTMLElement;
  private readonly options: TouchControllerOptions;
  private readonly tracker = new PointerTracker();
  private readonly boundListeners: DOMListener[] = [];
  private readonly originalTouchAction: string;
  private lastProcessedTimestamp = 0;
  private isDestroyed = false;

  constructor(target: HTMLElement, options: TouchControllerOptions = {}) {
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

  public getState(): TouchControllerState {
    const touches = Array.from(this.tracker.activePointers.values());
    const count = touches.length;

    let centroid: Point2D = { x: 0, y: 0 };
    if (count > 0) {
      let sumX = 0;
      let sumY = 0;
      for (const t of touches) {
        sumX += t.currentPoint.x;
        sumY += t.currentPoint.y;
      }
      centroid = { x: sumX / count, y: sumY / count };
    }

    return {
      touchCount: count,
      activeTouches: touches,
      centroid,
      isTouching: count > 0,
    };
  }

  public getActiveTouches(): readonly TrackedPointer[] {
    return Array.from(this.tracker.activePointers.values());
  }

  public cancel(): void {
    this.tracker.releaseAll();
    this.tracker.clear();
    this.options.onTouchesChange?.([]);
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.cancel();

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
    this.boundListeners.length = 0;
  }

  private attach(): void {
    if (typeof window === "undefined" || !this.target) return;

    const add = (target: EventTarget, type: string, handler: EventListener, passive = true) => {
      const options = { passive };
      target.addEventListener(type, handler, options);
      this.boundListeners.push({ target, type, listener: handler, options });
    };

    const isPassive = this.options.passive ?? false;

    // Pointer Events (primary modern touch standard)
    add(this.target, "pointerdown", this.handlePointerDown as EventListener, isPassive);
    add(this.target, "pointermove", this.handlePointerMove as EventListener, isPassive);
    add(this.target, "pointerup", this.handlePointerUp as EventListener, isPassive);
    add(this.target, "pointercancel", this.handlePointerCancel as EventListener, isPassive);
    add(this.target, "lostpointercapture", this.handlePointerCancel as EventListener, true);

    // Touch Events (fallback or for non-pointer touch browsers)
    add(this.target, "touchstart", this.handleTouchStart as EventListener, isPassive);
    add(this.target, "touchmove", this.handleTouchMove as EventListener, isPassive);
    add(this.target, "touchend", this.handleTouchEnd as EventListener, isPassive);
    add(this.target, "touchcancel", this.handleTouchCancel as EventListener, isPassive);
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

  // --- Pointer Events Handlers ---
  private handlePointerDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerType !== "touch" && normalized.source !== "touch") return;

    this.lastProcessedTimestamp = normalized.timeStamp;
    if (this.options.isolate) normalized.stopPropagation();
    this.checkPreventDefault(normalized);

    const pointer = this.tracker.trackDown(normalized);
    if (!pointer) return;

    if (normalized.pointerId !== null) {
      acquirePointerCapture(this.target, normalized.pointerId);
    }

    this.options.onTouchStart?.(normalized, pointer);
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  private handlePointerMove = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerType !== "touch" && normalized.source !== "touch") return;

    this.lastProcessedTimestamp = normalized.timeStamp;
    this.checkPreventDefault(normalized);

    const pointer = this.tracker.trackMove(normalized);
    if (!pointer) return;

    this.options.onTouchMove?.(normalized, pointer);
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  private handlePointerUp = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    if (normalized.pointerType !== "touch" && normalized.source !== "touch") return;

    this.lastProcessedTimestamp = normalized.timeStamp;
    this.checkPreventDefault(normalized);

    const pointer = this.tracker.trackUp(normalized);
    if (normalized.pointerId !== null) {
      releasePointerCapture(this.target, normalized.pointerId);
    }

    if (pointer) {
      this.options.onTouchEnd?.(normalized, pointer);
    }
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  private handlePointerCancel = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);

    const pointer = this.tracker.trackCancel(normalized);
    if (normalized.pointerId !== null) {
      releasePointerCapture(this.target, normalized.pointerId);
    }

    this.options.onTouchCancel?.(normalized, pointer);
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  // --- Touch Events Fallback Handlers (Deduplicated) ---
  private handleTouchStart = (event: Event): void => {
    if (this.isDestroyed) return;
    const raw = event as TouchEvent;
    // If PointerEvent already processed this event within 50ms, skip duplicate
    if (Math.abs(event.timeStamp - this.lastProcessedTimestamp) < 50 && this.tracker.pointerCount > 0) {
      return;
    }

    const normalized = normalizeInputEvent(event, this.target);
    if (this.options.isolate) normalized.stopPropagation();
    this.checkPreventDefault(normalized);

    if (raw.changedTouches) {
      for (let i = 0; i < raw.changedTouches.length; i++) {
        const touch = raw.changedTouches[i];
        const singleNorm = normalizeInputEvent({
          type: "touchstart",
          touches: raw.touches,
          changedTouches: [touch],
          timeStamp: event.timeStamp,
          target: event.target,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
        } as any, this.target);

        const pointer = this.tracker.trackDown(singleNorm);
        if (pointer) {
          this.options.onTouchStart?.(singleNorm, pointer);
        }
      }
    }
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  private handleTouchMove = (event: Event): void => {
    if (this.isDestroyed) return;
    if (Math.abs(event.timeStamp - this.lastProcessedTimestamp) < 50 && this.tracker.pointerCount > 0) {
      return;
    }

    const raw = event as TouchEvent;
    const normalized = normalizeInputEvent(event, this.target);
    this.checkPreventDefault(normalized);

    if (raw.changedTouches) {
      for (let i = 0; i < raw.changedTouches.length; i++) {
        const touch = raw.changedTouches[i];
        const singleNorm = normalizeInputEvent({
          type: "touchmove",
          touches: raw.touches,
          changedTouches: [touch],
          timeStamp: event.timeStamp,
          target: event.target,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
        } as any, this.target);

        const pointer = this.tracker.trackMove(singleNorm);
        if (pointer) {
          this.options.onTouchMove?.(singleNorm, pointer);
        }
      }
    }
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  private handleTouchEnd = (event: Event): void => {
    if (this.isDestroyed) return;
    if (Math.abs(event.timeStamp - this.lastProcessedTimestamp) < 50) return;

    const raw = event as TouchEvent;
    if (raw.changedTouches) {
      for (let i = 0; i < raw.changedTouches.length; i++) {
        const touch = raw.changedTouches[i];
        const singleNorm = normalizeInputEvent({
          type: "touchend",
          touches: raw.touches,
          changedTouches: [touch],
          timeStamp: event.timeStamp,
          target: event.target,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
        } as any, this.target);

        const pointer = this.tracker.trackUp(singleNorm);
        if (pointer) {
          this.options.onTouchEnd?.(singleNorm, pointer);
        }
      }
    }
    this.options.onTouchesChange?.(this.getActiveTouches());
  };

  private handleTouchCancel = (event: Event): void => {
    if (this.isDestroyed) return;
    const raw = event as TouchEvent;
    if (raw.changedTouches) {
      for (let i = 0; i < raw.changedTouches.length; i++) {
        const touch = raw.changedTouches[i];
        const singleNorm = normalizeInputEvent({
          type: "touchcancel",
          touches: raw.touches,
          changedTouches: [touch],
          timeStamp: event.timeStamp,
          target: event.target,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
        } as any, this.target);

        const pointer = this.tracker.trackCancel(singleNorm);
        this.options.onTouchCancel?.(singleNorm, pointer);
      }
    }
    this.options.onTouchesChange?.(this.getActiveTouches());
  };
}

/**
 * Creates and attaches a Touch Controller to an element.
 */
export function createTouchController(
  target: HTMLElement,
  options: TouchControllerOptions = {}
): TouchController {
  return new TouchEngine(target, options);
}
