import { resolveEasing } from "../easing/easings.js";
import type { EasingOption } from "../easing/easings.js";
import { onReducedMotionChange, prefersReducedMotion } from "./motion.js";

export type EasingFunction = (progress: number) => number;

export interface AnimationOptions {
  /** Duration in milliseconds. Defaults to 1000. */
  duration?: number;
  /** Delay in milliseconds before the animation starts. Defaults to 0. */
  delay?: number;
  /** Per-property delays in milliseconds, relative to the end of the global delay. */
  propertyDelay?: Readonly<Record<string, number>>;
  /** Per-property durations in milliseconds. Unspecified properties use `duration`. */
  propertyDuration?: Readonly<Record<string, number>>;
  /** Number of additional times to play after the initial iteration. Use Infinity to loop forever. Defaults to 0. */
  repeat?: number;
  /** Reverses direction at each repeat boundary. Defaults to false. */
  yoyo?: boolean;
  /** Playback speed multiplier. Defaults to 1. Must be finite and greater than 0. */
  playbackRate?: number;
  /** Defaults to true; completes at the current direction's endpoint when motion is reduced. */
  respectReducedMotion?: boolean;
  /** Maps linear progress (0..1) to eased progress. Defaults to linear. */
  easing?: EasingOption;
  /** Called once when the delay ends and the first update is about to run. */
  onStart?: () => void;
  /** Called for each animation frame, with eased progress. */
  onUpdate?: (progress: number) => void;
  /** Called once when playback reaches either endpoint. */
  onComplete?: () => void;
  /** Called once when an active animation is explicitly cancelled. */
  onCancel?: () => void;
}

export interface AnimationControls {
  /** Sets normalized playback progress immediately and continues toward the end. */
  seek(progress: number): void;
  /** Pauses the animation without losing its current progress. */
  pause(): void;
  /** Resumes a paused animation. */
  resume(): void;
  /** Reverses playback from the current progress. */
  reverse(): void;
  /** Changes playback speed. Must be finite and greater than 0. */
  setPlaybackRate(rate: number): void;
  /** Returns the current playback speed multiplier. */
  getPlaybackRate(): number;
  /** Stops the animation, suppresses future updates/completion, and calls `onCancel` once. */
  cancel(): void;
}

const DEFAULT_DURATION_MS = 1000;
const DEFAULT_DELAY_MS = 0;

type FrameCallback = (time: number) => void;

const frameCallbacks = new Set<FrameCallback>();
let sharedFrameId: number | null = null;
let dispatchingFrame = false;
let visibilityDocument: Document | null = null;
let lastAnimationDocument: Document | null = null;
let hiddenAt: number | null = null;
let hiddenDuration = 0;
let visibilityListener: (() => void) | null = null;
let visibilityEventsAvailable = false;

function rawClockTime(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function documentIsHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

function animationClockTime(): number {
  const now = rawClockTime();
  return now - hiddenDuration - (hiddenAt === null ? 0 : Math.max(0, now - hiddenAt));
}

function clearVisibilityTracking(): void {
  if (visibilityDocument && visibilityListener) {
    visibilityDocument.removeEventListener("visibilitychange", visibilityListener);
  }
  visibilityDocument = null;
  visibilityListener = null;
  visibilityEventsAvailable = false;
  hiddenAt = null;
  hiddenDuration = 0;
}

function handleVisibilityChange(): void {
  if (documentIsHidden()) {
    if (hiddenAt === null) hiddenAt = rawClockTime();
    if (sharedFrameId !== null) {
      cancelAnimationFrame(sharedFrameId);
      sharedFrameId = null;
    }
    return;
  }
  if (hiddenAt !== null) {
    hiddenDuration += Math.max(0, rawClockTime() - hiddenAt);
    hiddenAt = null;
  }
  requestSharedFrame();
}

function trackDocumentVisibility(): void {
  if (visibilityDocument || typeof document === "undefined") return;
  visibilityDocument = document;
  if (typeof document.addEventListener !== "function" || typeof document.removeEventListener !== "function") {
    visibilityDocument = null;
    if (documentIsHidden()) hiddenAt = rawClockTime();
    return;
  }
  visibilityEventsAvailable = true;
  visibilityListener = handleVisibilityChange;
  document.addEventListener("visibilitychange", visibilityListener);
  if (documentIsHidden()) hiddenAt = rawClockTime();
}

function requestSharedFrame(): void {
  if (
    sharedFrameId !== null ||
    dispatchingFrame ||
    frameCallbacks.size === 0 ||
    (visibilityEventsAvailable && documentIsHidden())
  ) return;
  sharedFrameId = requestAnimationFrame((time) => {
    sharedFrameId = null;
    if (documentIsHidden()) {
      if (visibilityEventsAvailable) {
        handleVisibilityChange();
      } else {
        if (hiddenAt === null) hiddenAt = rawClockTime();
        requestSharedFrame();
      }
      return;
    }
    if (!visibilityEventsAvailable && hiddenAt !== null) {
      hiddenDuration += Math.max(0, rawClockTime() - hiddenAt);
      hiddenAt = null;
    }
    dispatchingFrame = true;
    const errors: unknown[] = [];
    try {
      for (const callback of [...frameCallbacks]) {
        if (!frameCallbacks.has(callback)) continue;
        try {
          callback(time - hiddenDuration);
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      dispatchingFrame = false;
      requestSharedFrame();
    }
    if (errors.length > 0) throw errors[0];
  });
}

function subscribeToFrames(callback: FrameCallback): () => void {
  if (
    lastAnimationDocument !== null &&
    typeof document !== "undefined" &&
    lastAnimationDocument !== document
  ) {
    frameCallbacks.clear();
    if (sharedFrameId !== null) {
      cancelAnimationFrame(sharedFrameId);
      sharedFrameId = null;
    }
    clearVisibilityTracking();
  }
  if (typeof document !== "undefined") lastAnimationDocument = document;
  trackDocumentVisibility();
  frameCallbacks.add(callback);
  requestSharedFrame();
  return () => {
    frameCallbacks.delete(callback);
    if (frameCallbacks.size === 0 && sharedFrameId !== null) {
      cancelAnimationFrame(sharedFrameId);
      sharedFrameId = null;
    }
    if (frameCallbacks.size === 0) clearVisibilityTracking();
  };
}

export function subscribeAnimationFrames(callback: (time: number) => void): () => void {
  if (typeof callback !== "function") {
    throw new TypeError("Animation frame callback must be a function");
  }
  return subscribeToFrames(callback);
}

function assertValidTime(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

export function animateProgress(options: AnimationOptions = {}): AnimationControls {
  const {
    duration = DEFAULT_DURATION_MS,
    delay = DEFAULT_DELAY_MS,
    repeat = 0,
    yoyo = false,
    playbackRate = 1,
    respectReducedMotion = true,
    onStart,
    onUpdate,
    onComplete,
    onCancel,
  } = options;

  const easing = resolveEasing(options.easing);

  assertValidTime("duration", duration);
  assertValidTime("delay", delay);
  assertValidRepeat(repeat);
  assertValidYoyo(yoyo);
  assertValidPlaybackRate(playbackRate);

  let unsubscribeFromFrames: (() => void) | null = null;
  let previousTime: number | null = null;
  let frameClockOffset: number | null = null;
  let delayRemaining = delay;
  let progress = 0;
  let completedRepeats = 0;
  let direction = 1;
  let rate = playbackRate;
  let isPaused = false;
  let isActive = true;
  let cancelled = false;
  let hasStopped = false;
  let notifyingCompletion = false;
  let hasStarted = false;
  let hasCompleted = false;
  let hasCancelled = false;
  let skipToEndpoint = respectReducedMotion && prefersReducedMotion();
  let stopPreferenceListener = (): void => undefined;

  const readClock = animationClockTime;

  const advance = (elapsed: number): void => {
    if (skipToEndpoint) {
      delayRemaining = 0;
      progress = direction > 0 ? 1 : 0;
      return;
    }

    if (delayRemaining > 0) {
      const delayElapsed = Math.min(elapsed, delayRemaining);
      delayRemaining -= delayElapsed;
      elapsed -= delayElapsed;
    }
    if (delayRemaining > 0) return;

    if (duration === 0) {
      progress = direction > 0 ? 1 : 0;
    } else if (elapsed > 0) {
      progress = Math.max(0, Math.min(1, progress + direction * elapsed * rate / duration));
    }
  };

  const advanceToCurrentTime = (): void => {
    if (previousTime === null || frameClockOffset === null) return;
    const currentTime = readClock() + frameClockOffset;
    const elapsed = Math.max(0, currentTime - previousTime);
    previousTime = currentTime;
    advance(elapsed);
  };

  const schedule = (): void => {
    if (isActive && !isPaused && unsubscribeFromFrames === null) {
      unsubscribeFromFrames = subscribeToFrames(tick);
    }
  };

  const unschedule = (): void => {
    unsubscribeFromFrames?.();
    unsubscribeFromFrames = null;
  };

  const stop = (): void => {
    hasStopped = true;
    isActive = false;
    stopPreferenceListener();
    unschedule();
  };

  const tick = (now: number): void => {
    if (!isActive || isPaused) return;

    if (frameClockOffset === null) frameClockOffset = now - readClock();
    if (previousTime === null) previousTime = now;
    let elapsed = Math.max(0, now - previousTime);
    previousTime = now;
    advance(elapsed);
    if (!skipToEndpoint && delayRemaining > 0) {
      schedule();
      return;
    }

    if (!hasStarted) {
      hasStarted = true;
      try {
        onStart?.();
      } catch (error) {
        stop();
        throw error;
      }
      if (!isActive || cancelled || isPaused) return;
    }

    const isFinished = direction > 0 ? progress >= 1 : progress <= 0;
    const hasRepeatsRemaining = completedRepeats < repeat;
    if (isFinished && hasRepeatsRemaining && !skipToEndpoint) {
      completedRepeats += 1;
      try {
        onUpdate?.(easing(progress));
      } catch (error) {
        stop();
        throw error;
      }
      if (!isActive || cancelled || isPaused) return;
      if (yoyo) direction *= -1;
      progress = direction > 0 ? 0 : 1;
      previousTime = now;
      schedule();
      return;
    }

    if (isFinished) {
      hasCompleted = true;
      isActive = false;
      unschedule();
      stopPreferenceListener();
      notifyingCompletion = true;
    }

    try {
      onUpdate?.(easing(progress));
    } catch (error) {
      stop();
      throw error;
    } finally {
      if (isFinished) notifyingCompletion = false;
    }

    if (isFinished) {
      if (cancelled) return;
      try {
        onComplete?.();
      } catch (error) {
        stop();
        throw error;
      }
      return;
    }

    schedule();
  };

  const cancel = (): void => {
    if (!isActive && !notifyingCompletion) return;
    cancelled = true;
    stop();
    if (hasCancelled) return;
    hasCancelled = true;
    onCancel?.();
  };

  const seek = (nextProgress: number): void => {
    if (typeof nextProgress !== "number" || !Number.isFinite(nextProgress) || nextProgress < 0 || nextProgress > 1) {
      throw new RangeError(`progress must be a finite number between 0 and 1, received ${String(nextProgress)}`);
    }
    if (cancelled || hasStopped || hasCompleted || notifyingCompletion) return;

    if (!hasStarted) {
      hasStarted = true;
      try {
        onStart?.();
      } catch (error) {
        stop();
        throw error;
      }
      if (!isActive || cancelled) return;
    }
    delayRemaining = 0;
    direction = 1;
    progress = nextProgress;
    completedRepeats = nextProgress >= 1 ? repeat : completedRepeats;
    isActive = nextProgress < 1 || completedRepeats < repeat;
    previousTime = isActive && frameClockOffset !== null
      ? readClock() + frameClockOffset
      : null;

    if (nextProgress >= 1 && completedRepeats >= repeat) {
      isActive = false;
      unschedule();
      stopPreferenceListener();
    } else {
      schedule();
    }

    if (nextProgress >= 1 && completedRepeats >= repeat) notifyingCompletion = true;
    try {
      onUpdate?.(easing(progress));
    } catch (error) {
      stop();
      throw error;
    } finally {
      if (nextProgress >= 1) notifyingCompletion = false;
    }
    if (nextProgress >= 1 && completedRepeats >= repeat) hasCompleted = true;
    if (nextProgress >= 1 && completedRepeats >= repeat && !cancelled) {
      try {
        onComplete?.();
      } catch (error) {
        stop();
        throw error;
      }
    }
  };

  const controls: AnimationControls = {
    seek,
    pause: () => {
      if (!isActive || isPaused) return;
      advanceToCurrentTime();
      isPaused = true;
      previousTime = null;
      unschedule();
    },
    resume: () => {
      if (!isActive || !isPaused) return;
      isPaused = false;
      previousTime = frameClockOffset === null ? null : readClock() + frameClockOffset;
      schedule();
    },
    reverse: () => {
      if (!isActive) return;
      advanceToCurrentTime();
      direction *= -1;
    },
    setPlaybackRate: (nextRate) => {
      assertValidPlaybackRate(nextRate);
      if (isActive) advanceToCurrentTime();
      rate = nextRate;
    },
    getPlaybackRate: () => rate,
    cancel,
  };

  if (respectReducedMotion) {
    stopPreferenceListener = onReducedMotionChange((reduced) => {
      if (!reduced || !isActive) return;
      skipToEndpoint = true;
      delayRemaining = 0;
      schedule();
    });
  }
  schedule();
  return controls;
}

function assertValidPlaybackRate(rate: number): void {
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError(`playbackRate must be a finite number > 0, received ${String(rate)}`);
  }
}

function assertValidRepeat(repeat: number): void {
  if (
    typeof repeat !== "number" ||
    (repeat !== Number.POSITIVE_INFINITY && (!Number.isInteger(repeat) || repeat < 0))
  ) {
    throw new RangeError(`repeat must be a non-negative integer or Infinity, received ${String(repeat)}`);
  }
}

function assertValidYoyo(yoyo: boolean): void {
  if (typeof yoyo !== "boolean") {
    throw new TypeError(`yoyo must be a boolean, received ${String(yoyo)}`);
  }
}
