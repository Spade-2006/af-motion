import { animate } from "./animate.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import type { AnimationControls } from "./animation.js";

export interface AnimationSequenceStep {
  /** Target for this step; may be the same target used by other steps. */
  target: AnimateTarget;
  /** Properties animated by this step. */
  properties: AnimatableProperties;
  /** Options passed to `animate()`. The step's onComplete runs before the next step starts. */
  options?: DOMAnimationOptions;
}

export interface AnimationSequenceOptions {
  /** Called once when the first step begins, after its delay. */
  onStart?: () => void;
  /** Called once after all steps have completed successfully. */
  onComplete?: () => void;
  /** Called once when the sequence is explicitly cancelled. */
  onCancel?: () => void;
}

export interface AnimationSequenceControls {
  /** Resolves after all steps complete; rejects if a step fails or the sequence is cancelled. */
  finished: Promise<void>;
  /** Pauses the active step and keeps subsequent steps paused until resumed. */
  pause(): void;
  /** Resumes the active step and allows subsequent steps to run. */
  resume(): void;
  /** Reverses playback of the active step; subsequent steps retain their configured direction. */
  reverse(): void;
  /** Sets the playback speed of the active and subsequent steps. */
  setPlaybackRate(rate: number): void;
  /** Returns the active step's playback speed, or the configured group speed. */
  getPlaybackRate(): number;
  /** Cancels the active step and prevents subsequent steps from starting. Safe to call repeatedly. */
  cancel(): void;
}

function abortError(): Error {
  const error = new Error("Animation sequence was cancelled");
  error.name = "AbortError";
  return error;
}

/**
 * Runs DOM animations one after another by delegating every step to the existing `animate()` engine.
 */
export function animateSequence(
  steps: readonly AnimationSequenceStep[],
  options: AnimationSequenceOptions = {},
): AnimationSequenceControls {
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
  let active: AnimationControls | null = null;
  let index = 0;
  let settled = false;
  let cancelled = false;
  let paused = false;
  let playbackRate: number | null = null;
  let hasStarted = false;

  const reject = (error: unknown): void => {
    if (settled) return;
    settled = true;
    active = null;
    rejectFinished(error);
  };

  const startNext = (): void => {
    if (cancelled || settled) return;
    if (index >= steps.length) {
      try {
        options.onComplete?.();
        if (cancelled || settled) return;
        settled = true;
        resolveFinished();
      } catch (error) {
        reject(error);
      }
      return;
    }

    const step = steps[index++];
    if (!step || typeof step !== "object") {
      reject(new TypeError(`Animation sequence step ${index - 1} must be an object`));
      return;
    }

    try {
      active = animate(step.target, step.properties, {
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
            reject(error);
            throw error;
          }
        },
        onUpdate: (progress) => {
          try {
            step.options?.onUpdate?.(progress);
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        onComplete: () => {
          active = null;
          try {
            step.options?.onComplete?.();
            if (!cancelled && !settled) startNext();
          } catch (error) {
            reject(error);
          }
        },
      });
      if (paused) active.pause();
    } catch (error) {
      reject(error);
    }
  };

  startNext();

  return {
    finished,
    pause: () => {
      if (settled || paused) return;
      paused = true;
      active?.pause();
    },
    resume: () => {
      if (settled || !paused) return;
      paused = false;
      active?.resume();
    },
    reverse: () => {
      if (settled) return;
      active?.reverse();
    },
    setPlaybackRate: (rate) => {
      assertValidPlaybackRate(rate);
      playbackRate = rate;
      active?.setPlaybackRate(rate);
    },
    getPlaybackRate: () => active?.getPlaybackRate() ?? playbackRate ?? 1,
    cancel: () => {
      if (settled || cancelled) return;
      cancelled = true;
      const current = active;
      reject(abortError());
      try {
        current?.cancel();
      } finally {
        active = null;
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
