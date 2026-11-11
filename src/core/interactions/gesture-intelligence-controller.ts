/**
 * AF Motion Gesture Intelligence Controller
 *
 * High-performance, framework-independent gesture recognition intelligence engine.
 * Connects pointer tracking, live gesture classification, candidate scoring,
 * sequence state machines, and priority resolution.
 */

import { classifyAllGestures, classifyGesture } from "./gesture-classifier.js";
import { createGestureSequence } from "./gesture-sequence.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import { PointerTracker } from "./pointer-tracker.js";
import type {
  DragBounds,
  GestureClassificationResult,
  GestureRecognitionController,
  GestureRecognitionOptions,
  GestureSample,
  GestureSequenceController,
  Point2D,
} from "./types.js";

function getElementBounds(el: HTMLElement): DragBounds {
  try {
    const rect = el.getBoundingClientRect();
    return {
      minX: rect.left,
      minY: rect.top,
      maxX: rect.right,
      maxY: rect.bottom,
    };
  } catch {
    return {
      minX: 0,
      minY: 0,
      maxX: typeof window !== "undefined" ? window.innerWidth : 1000,
      maxY: typeof window !== "undefined" ? window.innerHeight : 1000,
    };
  }
}

function calculatePathLength(history: readonly { readonly point: Point2D }[]): number {
  if (history.length < 2) return 0;
  let len = 0;
  for (let i = 1; i < history.length; i++) {
    len += Math.hypot(history[i].point.x - history[i - 1].point.x, history[i].point.y - history[i - 1].point.y);
  }
  return len;
}

export function createGestureRecognizer(
  target: HTMLElement,
  options: GestureRecognitionOptions = {}
): GestureRecognitionController {
  const tracker = new PointerTracker();
  const minConfidence = options.minConfidence ?? 0.65;

  const activeResults: GestureClassificationResult[] = [];
  const sequences: GestureSequenceController[] = (options.sequences ?? []).map((seqOpt) =>
    createGestureSequence({
      ...seqOpt,
      onSequenceCompleted: (results) => {
        seqOpt.onSequenceCompleted?.(results);
        options.onSequenceCompleted?.(seqOpt.id ?? "seq", results);
      },
    })
  );

  let interactionStartTime = 0;
  let maxPointersObserved = 0;
  let initialTwoFingerDistance: number | null = null;
  let initialTwoFingerAngle: number | null = null;
  let lastTwoFingerDistance: number | null = null;
  let lastTwoFingerAngle: number | null = null;
  let primaryStartPoint: Point2D = { x: 0, y: 0 };
  let primaryCurrentPoint: Point2D = { x: 0, y: 0 };
  let isDestroyed = false;
  let lastPointerTime = 0;

  function resetInteraction(): void {
    interactionStartTime = 0;
    maxPointersObserved = 0;
    initialTwoFingerDistance = null;
    initialTwoFingerAngle = null;
    lastTwoFingerDistance = null;
    lastTwoFingerAngle = null;
  }

  function handleDown(e: Event): void {
    if (isDestroyed) return;
    const norm = normalizeInputEvent(e, target);
    if (!norm.point) return;

    if (tracker.pointerCount === 0) {
      interactionStartTime = norm.timeStamp || Date.now();
      primaryStartPoint = { x: norm.point.x, y: norm.point.y };
      primaryCurrentPoint = { x: norm.point.x, y: norm.point.y };
    }

    tracker.trackDown(norm);
    maxPointersObserved = Math.max(maxPointersObserved, tracker.pointerCount);

    if (tracker.pointerCount === 2) {
      const ptrs = Array.from(tracker.activePointers.values());
      const p1 = ptrs[0].currentPoint;
      const p2 = ptrs[1].currentPoint;
      initialTwoFingerDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      initialTwoFingerAngle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      lastTwoFingerDistance = initialTwoFingerDistance;
      lastTwoFingerAngle = initialTwoFingerAngle;
    }
  }

  function handleMove(e: Event): void {
    if (isDestroyed) return;
    const norm = normalizeInputEvent(e, target);
    if (!norm.point) return;

    const tracked = tracker.trackMove(norm);
    if (!tracked) return;

    primaryCurrentPoint = { x: tracked.currentPoint.x, y: tracked.currentPoint.y };

    if (tracker.pointerCount === 2) {
      const ptrs = Array.from(tracker.activePointers.values());
      const p1 = ptrs[0].currentPoint;
      const p2 = ptrs[1].currentPoint;
      lastTwoFingerDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      lastTwoFingerAngle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    }

    // Candidate gesture evaluation during movement
    if (options.onGestureCandidate && interactionStartTime > 0) {
      const now = norm.timeStamp || Date.now();
      const dur = now - interactionStartTime;
      const dx = primaryCurrentPoint.x - primaryStartPoint.x;
      const dy = primaryCurrentPoint.y - primaryStartPoint.y;
      const dist = Math.hypot(dx, dy);

      if (dist >= 10 || dur >= 200) {
        let scaleChange: number | undefined;
        let rotationChange: number | undefined;

        if (initialTwoFingerDistance && lastTwoFingerDistance && initialTwoFingerDistance > 0) {
          scaleChange = lastTwoFingerDistance / initialTwoFingerDistance;
        }

        if (initialTwoFingerAngle !== null && lastTwoFingerAngle !== null) {
          rotationChange = lastTwoFingerAngle - initialTwoFingerAngle;
        }

        const candidateSample: GestureSample = {
          pointerCount: maxPointersObserved || 1,
          durationMs: Math.max(1, dur),
          distance: dist,
          deltaX: dx,
          deltaY: dy,
          velocityX: tracked.velocityX,
          velocityY: tracked.velocityY,
          speed: Math.hypot(tracked.velocityX, tracked.velocityY),
          accelerationX: tracked.accelerationX,
          accelerationY: tracked.accelerationY,
          startPoint: primaryStartPoint,
          currentPoint: primaryCurrentPoint,
          targetBounds: getElementBounds(target),
          scaleChange,
          rotationChange,
          pathLength: calculatePathLength(tracked.history),
          pointerType: tracked.pointerType,
        };

        const candidateResult = classifyGesture(candidateSample, undefined, minConfidence);
        options.onGestureCandidate(candidateResult);
      }
    }
  }

  function handleUp(e: Event): void {
    if (isDestroyed) return;
    const norm = normalizeInputEvent(e, target);
    const tracked = tracker.trackUp(norm);

    if (tracker.pointerCount === 0 && interactionStartTime > 0) {
      const now = norm.timeStamp || Date.now();
      const dur = Math.max(1, now - interactionStartTime);
      const endPoint = tracked?.currentPoint ?? norm.point ?? primaryCurrentPoint;
      const dx = endPoint.x - primaryStartPoint.x;
      const dy = endPoint.y - primaryStartPoint.y;
      const dist = Math.hypot(dx, dy);

      let scaleChange: number | undefined;
      let rotationChange: number | undefined;

      if (initialTwoFingerDistance && lastTwoFingerDistance && initialTwoFingerDistance > 0) {
        scaleChange = lastTwoFingerDistance / initialTwoFingerDistance;
      }

      if (initialTwoFingerAngle !== null && lastTwoFingerAngle !== null) {
        let rot = lastTwoFingerAngle - initialTwoFingerAngle;
        if (rot > 180) rot -= 360;
        if (rot < -180) rot += 360;
        rotationChange = rot;
      }

      const pathLength = tracked ? calculatePathLength(tracked.history) : dist;
      let speed = tracked ? Math.hypot(tracked.velocityX, tracked.velocityY) : 0;
      if (speed === 0 && dur > 0) {
        speed = dist / (dur / 1000);
      }

      const finalSample: GestureSample = {
        pointerCount: maxPointersObserved || 1,
        durationMs: dur,
        distance: dist,
        deltaX: dx,
        deltaY: dy,
        velocityX: tracked?.velocityX ?? 0,
        velocityY: tracked?.velocityY ?? 0,
        speed,
        accelerationX: tracked?.accelerationX ?? 0,
        accelerationY: tracked?.accelerationY ?? 0,
        startPoint: primaryStartPoint,
        currentPoint: endPoint,
        targetBounds: getElementBounds(target),
        scaleChange,
        rotationChange,
        pathLength,
        pointerType: tracked?.pointerType ?? norm.pointerType,
      };

      const result = classifyGesture(finalSample, undefined, minConfidence);

      if (result.isMatch) {
        activeResults.push(result);
        if (activeResults.length > 20) {
          activeResults.shift();
        }

        options.onGestureRecognized?.(result);

        // Feed into active sequences
        for (const seq of sequences) {
          seq.feed(result);
        }
      }

      resetInteraction();
    }
  }

  function handleCancel(e: Event): void {
    if (isDestroyed) return;
    const norm = normalizeInputEvent(e, target);
    tracker.trackCancel(norm);
    resetInteraction();
  }

  function isEmulatedMouseEvent(e: Event): boolean {
    return e.type.startsWith("mouse") && Date.now() - lastPointerTime < 300;
  }

  function onDown(e: Event): void {
    if (isDestroyed) return;
    if (isEmulatedMouseEvent(e)) return;
    if (e.type.startsWith("pointer")) {
      lastPointerTime = Date.now();
    }
    handleDown(e);
  }

  function onMove(e: Event): void {
    if (isDestroyed) return;
    if (isEmulatedMouseEvent(e)) return;
    if (e.type.startsWith("pointer")) {
      lastPointerTime = Date.now();
    }
    handleMove(e);
  }

  function onUp(e: Event): void {
    if (isDestroyed) return;
    if (isEmulatedMouseEvent(e)) return;
    if (e.type.startsWith("pointer")) {
      lastPointerTime = Date.now();
    }
    handleUp(e);
  }

  function onCancel(e: Event): void {
    if (isDestroyed) return;
    handleCancel(e);
  }

  const cleanups: (() => void)[] = [];

  const add = (targetEl: EventTarget, type: string, handler: (e: Event) => void, opts?: any) => {
    targetEl.addEventListener(type, handler, opts);
    cleanups.push(() => targetEl.removeEventListener(type, handler, opts));
  };

  if (typeof window !== "undefined") {
    add(target, "pointerdown", onDown);
    add(window, "pointermove", onMove);
    add(window, "pointerup", onUp);
    add(window, "pointercancel", onCancel);

    add(target, "touchstart", onDown, { passive: true });
    add(window, "touchmove", onMove, { passive: true });
    add(window, "touchend", onUp);
    add(window, "touchcancel", onCancel);

    add(target, "mousedown", onDown);
    add(window, "mousemove", onMove);
    add(window, "mouseup", onUp);
  }

  function cancel(): void {
    if (isDestroyed) return;
    for (const seq of sequences) {
      seq.cancel();
    }
    resetInteraction();
  }

  function destroy(): void {
    if (isDestroyed) return;
    isDestroyed = true;

    for (const cleanup of cleanups) {
      cleanup();
    }
    cleanups.length = 0;

    for (const seq of sequences) {
      seq.destroy();
    }
    tracker.clear();
    resetInteraction();
  }

  return {
    target,
    getActiveGestures: () => [...activeResults],
    getSequences: () => [...sequences],
    cancel,
    destroy,
  };
}
