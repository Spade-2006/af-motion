import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { acquirePointerCapture, releasePointerCapture } from "../core/pointer-capture.js";

export type SwipeDirection = "left" | "right" | "up" | "down";

export interface SwipeGesture {
  readonly direction: SwipeDirection;
  readonly distance: number;
  readonly duration: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly pointerType: string;
}

export interface SwipeOptions {
  /** Minimum pointer travel in pixels. Defaults to 50. */
  minDistance?: number;
  /** Ignore gestures taking longer than this many milliseconds. */
  maxDuration?: number;
  /** Called once for each qualifying swipe gesture. */
  onSwipe: (gesture: SwipeGesture) => void;
}

export interface SwipeControls {
  /** Removes pointer listeners and releases any active pointer capture. */
  destroy(): void;
}

interface ActiveSwipe {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  pointerType: string;
}

const DEFAULT_MIN_DISTANCE = 50;

function validateOptions(options: SwipeOptions): { minDistance: number; maxDuration: number | undefined } {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object");
  }
  const minDistance = options.minDistance ?? DEFAULT_MIN_DISTANCE;
  const { maxDuration, onSwipe } = options;
  if (typeof minDistance !== "number" || !Number.isFinite(minDistance) || minDistance < 0) {
    throw new RangeError(`minDistance must be a finite number >= 0, received ${String(minDistance)}`);
  }
  if (maxDuration !== undefined && (typeof maxDuration !== "number" || !Number.isFinite(maxDuration) || maxDuration < 0)) {
    throw new RangeError(`maxDuration must be a finite number >= 0, received ${String(maxDuration)}`);
  }
  if (typeof onSwipe !== "function") {
    throw new TypeError("onSwipe must be a function");
  }
  return { minDistance, maxDuration };
}

/**
 * Detects directional Pointer Event gestures on one or more HTML elements.
 * A gesture is recognized once on pointerup when its distance and duration qualify.
 */
export function swipe(target: AnimateTarget, options: SwipeOptions): SwipeControls {
  const { minDistance, maxDuration } = validateOptions(options);
  const elements = resolveTargets(target);
  const active = new Map<HTMLElement, ActiveSwipe>();
  const cleanups: Array<() => void> = [];
  let destroyed = false;

  const releaseCapture = releasePointerCapture;

  for (const element of elements) {
    const onPointerDown = (event: PointerEvent): void => {
      const current = active.get(element);
      if (current && current.pointerId !== event.pointerId) {
        // A second pointer makes this a multi-touch gesture, not a swipe.
        active.delete(element);
        releaseCapture(element, current.pointerId);
        return;
      }
      if (destroyed || current || !event.isPrimary || event.button !== 0) return;
      active.set(element, {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startTime: event.timeStamp,
        pointerType: event.pointerType,
      });
      acquirePointerCapture(element, event.pointerId);
    };

    const onPointerUp = (event: PointerEvent): void => {
      const start = active.get(element);
      if (!start || start.pointerId !== event.pointerId) return;
      active.delete(element);
      releaseCapture(element, event.pointerId);

      const deltaX = event.clientX - start.startX;
      const deltaY = event.clientY - start.startY;
      const distance = Math.hypot(deltaX, deltaY);
      const duration = event.timeStamp - start.startTime;
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        duration < 0 ||
        distance < minDistance ||
        (maxDuration !== undefined && duration > maxDuration)
      ) return;

      const direction: SwipeDirection = Math.abs(deltaX) >= Math.abs(deltaY)
        ? deltaX < 0 ? "left" : "right"
        : deltaY < 0 ? "up" : "down";
      options.onSwipe({
        direction,
        distance,
        duration,
        deltaX,
        deltaY,
        pointerType: start.pointerType,
      });
    };

    const onPointerCancel = (event: PointerEvent): void => {
      const start = active.get(element);
      if (!start || start.pointerId !== event.pointerId) return;
      active.delete(element);
      releaseCapture(element, event.pointerId);
    };

    const onLostPointerCapture = (event: PointerEvent): void => {
      const start = active.get(element);
      if (start?.pointerId !== event.pointerId) return;
      active.delete(element);
      releaseCapture(element, event.pointerId);
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("lostpointercapture", onLostPointerCapture);
    cleanups.push(() => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("lostpointercapture", onLostPointerCapture);
      const start = active.get(element);
      if (start) {
        active.delete(element);
        releaseCapture(element, start.pointerId);
      }
    });
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      const pending = cleanups.splice(0);
      let failure: unknown;
      let failed = false;
      for (const cleanup of pending) {
        try {
          cleanup();
        } catch (error) {
          if (!failed) failure = error;
          failed = true;
        }
      }
      active.clear();
      if (failed) throw failure;
    },
  };
}
