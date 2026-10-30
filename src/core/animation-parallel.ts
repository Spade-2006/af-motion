import { animate } from "./animate.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import type { AnimationControls } from "./animation.js";

export interface AnimationParallelStep {
  /** Target for this step; may be shared with other concurrently running steps. */
  target: AnimateTarget;
  /** Properties animated by this step. */
  properties: AnimatableProperties;
  /** Options passed to `animate()`; this step runs concurrently with its siblings. */
  options?: DOMAnimationOptions;
}

export interface AnimationParallelOptions {
  /** Called once when the first step begins, after its delay. */
  onStart?: () => void;
  /** Called once after all steps have completed successfully. */
  onComplete?: () => void;
  /** Called once when the group is explicitly cancelled. */
  onCancel?: () => void;
}

export interface AnimationParallelControls {
  /** Resolves after all steps complete; rejects if a step fails or the group is cancelled. */
  finished: Promise<void>;
  /** Pauses every active step. */
  pause(): void;
  /** Resumes every paused step. */
  resume(): void;
  /** Reverses playback of every active step. */
  reverse(): void;
  /** Sets the playback speed of active steps. */
  setPlaybackRate(rate: number): void;
  /** Returns the active steps' playback speed, or the configured group speed. */
  getPlaybackRate(): number;
  /** Cancels all active steps and rejects `finished` with an AbortError. Safe to call repeatedly. */
  cancel(): void;
}

function abortError(): Error {
  const error = new Error("Parallel animations were cancelled");
  error.name = "AbortError";
  return error;
}

/**
 * Runs DOM animations concurrently by delegating each step to the existing `animate()` engine.
 */
export function animateParallel(
  steps: readonly AnimationParallelStep[],
  options: AnimationParallelOptions = {},
): AnimationParallelControls {
  if (!Array.isArray(steps)) {
    throw new TypeError("steps must be an array");
  }
  if (options === null || typeof options !== "object") {
    throw new TypeError("options must be an object");
  }
  if (options.onComplete !== undefined && typeof options.onComplete !== "function") {
    throw new TypeError("onComplete must be a function");
  }
  if (options.onStart !== undefined && typeof options.onStart !== "function") {
    throw new TypeError("onStart must be a function");
  }
  if (options.onCancel !== undefined && typeof options.onCancel !== "function") {
    throw new TypeError("onCancel must be a function");
  }

  let resolveFinished: () => void = () => undefined;
  let rejectFinished: (reason: unknown) => void = () => undefined;
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });
  const active = new Set<AnimationControls>();
  const completed = new Set<number>();
  let settled = false;
  let cancelled = false;
  let paused = false;
  let playbackRate: number | null = null;
  let hasStarted = false;

  const cancelActive = (): void => {
    let firstError: unknown;
    let hasError = false;
    for (const control of active) {
      try {
        control.cancel();
      } catch (error) {
        if (!hasError) firstError = error;
        hasError = true;
      }
    }
    active.clear();
    if (hasError) throw firstError;
  };

  const fail = (error: unknown): void => {
    if (settled) return;
    settled = true;
    try {
      cancelActive();
    } finally {
      rejectFinished(error);
    }
  };

  const finishIfComplete = (): void => {
    if (settled || completed.size !== steps.length) return;
    try {
      options.onComplete?.();
      if (cancelled || settled) return;
      settled = true;
      resolveFinished();
    } catch (error) {
      fail(error);
    }
  };

  if (steps.length === 0) {
    finishIfComplete();
  } else {
    steps.forEach((step, index) => {
      if (settled || cancelled) return;
      if (!step || typeof step !== "object") {
        fail(new TypeError(`Animation parallel step ${index} must be an object`));
        return;
      }

      let child: AnimationControls;
      try {
        child = animate(step.target, step.properties, {
          ...step.options,
          ...(playbackRate === null ? {} : { playbackRate }),
          onStart: () => {
            try {
              if (!hasStarted) {
                hasStarted = true;
                options.onStart?.();
              }
              step.options?.onStart?.();
            } catch (error) {
              fail(error);
              throw error;
            }
          },
          onUpdate: (progress) => {
            try {
              step.options?.onUpdate?.(progress);
            } catch (error) {
              fail(error);
              throw error;
            }
          },
          onComplete: () => {
            if (settled || cancelled || completed.has(index)) return;
            try {
              step.options?.onComplete?.();
              completed.add(index);
              active.delete(child);
              finishIfComplete();
            } catch (error) {
              fail(error);
            }
          },
        });
      } catch (error) {
        fail(error);
        return;
      }
      active.add(child);
      if (paused) child.pause();
    });
  }

  return {
    finished,
    pause: () => {
      if (settled || paused) return;
      paused = true;
      for (const control of active) control.pause();
    },
    resume: () => {
      if (settled || !paused) return;
      paused = false;
      for (const control of active) control.resume();
    },
    reverse: () => {
      if (settled) return;
      for (const control of active) control.reverse();
    },
    setPlaybackRate: (rate) => {
      assertValidPlaybackRate(rate);
      playbackRate = rate;
      for (const control of active) control.setPlaybackRate(rate);
    },
    getPlaybackRate: () => {
      const firstActive = active.values().next().value as AnimationControls | undefined;
      return firstActive?.getPlaybackRate() ?? playbackRate ?? 1;
    },
    cancel: () => {
      if (settled || cancelled) return;
      cancelled = true;
      try {
        fail(abortError());
      } finally {
        options.onCancel?.();
      }
    },
  };
}

function assertValidPlaybackRate(rate: number): void {
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError(`playbackRate must be a finite number > 0, received ${String(rate)}`);
  }
}
