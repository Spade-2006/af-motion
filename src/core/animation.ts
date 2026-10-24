export type EasingFunction = (progress: number) => number;

export interface AnimationOptions {
  /** Duration in milliseconds. Defaults to 1000. */
  duration?: number;
  /** Delay in milliseconds before the animation starts. Defaults to 0. */
  delay?: number;
  /** Maps linear progress (0..1) to eased progress. Defaults to linear. */
  easing?: EasingFunction;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface AnimationControls {
  /** Stops the animation. No further callbacks fire. Safe to call repeatedly. */
  cancel(): void;
}

const DEFAULT_DURATION_MS = 1000;
const DEFAULT_DELAY_MS = 0;

const linear: EasingFunction = (progress) => progress;

function assertValidTime(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

export function animateProgress(options: AnimationOptions = {}): AnimationControls {
  const {
    duration = DEFAULT_DURATION_MS,
    delay = DEFAULT_DELAY_MS,
    easing = linear,
    onUpdate,
    onComplete,
  } = options;

  assertValidTime("duration", duration);
  assertValidTime("delay", delay);

  let frameId: number | null = null;
  let startTime: number | null = null;
  let isActive = true;
  let cancelled = false;

  const stop = (): void => {
    isActive = false;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  const tick = (now: number): void => {
    frameId = null;
    if (!isActive) return;

    if (startTime === null) startTime = now;

    const elapsed = now - startTime - delay;
    if (elapsed < 0) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    const linearProgress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
    const isFinished = linearProgress >= 1;

    // Mark finished before invoking callbacks so re-entrant cancel() is a no-op.
    if (isFinished) isActive = false;

    onUpdate?.(isFinished ? easing(1) : easing(linearProgress));

    // onUpdate may have cancelled; completion must not fire then.
    if (isFinished) {
      if (cancelled) return;
      onComplete?.();
      return;
    }

    if (isActive) frameId = requestAnimationFrame(tick);
  };

  const cancel =  (): void => {
    cancelled = true;
    stop();
  };

  frameId = requestAnimationFrame(tick);

  return { cancel };
}
