import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { acquirePointerCapture, releasePointerCapture } from "../core/pointer-capture.js";

export interface PinchGesture {
  /** Current pointer distance divided by the distance when the pinch started. */
  readonly scale: number;
  readonly distance: number;
  readonly initialDistance: number;
  readonly centerX: number;
  readonly centerY: number;
  /** True when the gesture ended because the browser cancelled a pointer. */
  readonly cancelled: boolean;
}

export interface PinchOptions {
  /** Minimum distance in pixels between pointers required to start. Defaults to 10. */
  minDistance?: number;
  onStart?: (gesture: PinchGesture) => void;
  onUpdate?: (gesture: PinchGesture) => void;
  onEnd?: (gesture: PinchGesture) => void;
}

export interface PinchControls {
  /** Removes listeners, releases pointer capture, and ends any active pinch. */
  destroy(): void;
}

interface Point {
  x: number;
  y: number;
}

const DEFAULT_MIN_DISTANCE = 10;

function validateOptions(options: PinchOptions): number {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object");
  }
  const minDistance = options.minDistance ?? DEFAULT_MIN_DISTANCE;
  if (typeof minDistance !== "number" || !Number.isFinite(minDistance) || minDistance < 0) {
    throw new RangeError(`minDistance must be a finite number >= 0, received ${String(minDistance)}`);
  }
  for (const name of ["onStart", "onUpdate", "onEnd"] as const) {
    if (options[name] !== undefined && typeof options[name] !== "function") {
      throw new TypeError(`${name} must be a function`);
    }
  }
  return minDistance;
}

/**
 * Detects two-pointer pinch gestures on one or more HTML elements and reports
 * scale relative to the pointer distance when the pinch started.
 */
export function pinch(target: AnimateTarget, options: PinchOptions = {}): PinchControls {
  const minDistance = validateOptions(options);
  const elements = resolveTargets(target);
  const cleanups: Array<() => void> = [];
  let destroyed = false;

  for (const element of elements) {
    const pointers = new Map<number, Point>();
    let initialDistance: number | undefined;
    let last: PinchGesture | undefined;

    const measure = (cancelled: boolean): PinchGesture | undefined => {
      const [a, b] = [...pointers.values()];
      if (!a || !b) return undefined;
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      const base = initialDistance ?? distance;
      const scale = distance / base;
      const centerX = (a.x + b.x) / 2;
      const centerY = (a.y + b.y) / 2;
      if (![distance, base, scale, centerX, centerY].every(Number.isFinite) || base <= 0) return undefined;
      return { scale, distance, initialDistance: base, centerX, centerY, cancelled };
    };

    const release = (pointerId: number): void => releasePointerCapture(element, pointerId);

    const finish = (cancelled: boolean): void => {
      if (initialDistance === undefined) return;
      const final = last ? { ...last, cancelled } : undefined;
      initialDistance = undefined;
      last = undefined;
      if (final) options.onEnd?.(final);
    };

    const removePointer = (pointerId: number, cancelled: boolean): void => {
      if (!pointers.has(pointerId)) return;
      pointers.delete(pointerId);
      try {
        finish(cancelled);
      } finally {
        release(pointerId);
      }
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (destroyed || pointers.has(event.pointerId) || pointers.size >= 2) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      acquirePointerCapture(element, event.pointerId);
      if (pointers.size !== 2) return;

      const gesture = measure(false);
      if (!gesture || gesture.distance < minDistance) return;
      initialDistance = gesture.distance;
      last = { ...gesture, scale: 1 };
      try {
        options.onStart?.(last);
      } catch (error) {
        initialDistance = undefined;
        last = undefined;
        throw error;
      }
    };

    const onPointerMove = (event: PointerEvent): void => {
      const point = pointers.get(event.pointerId);
      if (!point) return;
      point.x = event.clientX;
      point.y = event.clientY;
      if (initialDistance === undefined) return;
      const gesture = measure(false);
      if (!gesture) return;
      last = gesture;
      options.onUpdate?.(gesture);
    };

    const onPointerUp = (event: PointerEvent): void => removePointer(event.pointerId, false);
    const onPointerCancel = (event: PointerEvent): void => removePointer(event.pointerId, true);

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("lostpointercapture", onPointerCancel);
    cleanups.push(() => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("lostpointercapture", onPointerCancel);
      const ids = [...pointers.keys()];
      pointers.clear();
      try {
        finish(true);
      } finally {
        for (const id of ids) release(id);
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
      if (failed) throw failure;
    },
  };
}
