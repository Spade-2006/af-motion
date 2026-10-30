import { animate } from "./animate.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import type { AnimationControls } from "./animation.js";

export type AnimationTimelinePosition =
  | number
  | string
  | { label: string; offset?: number }
  | { previous: "start" | "end"; offset?: number };

export interface AnimationTimelineStep {
  /** Absolute milliseconds, a named label, or a position relative to the previous entry. */
  at: AnimationTimelinePosition;
  /** Target for this step; may be shared with other timeline entries. */
  target: AnimateTarget;
  /** Properties animated by this step. */
  properties: AnimatableProperties;
  /** Options passed to `animate()` when this timeline entry starts. */
  options?: DOMAnimationOptions;
}

export interface AnimationTimelineControls {
  /** Resolves after every entry completes; rejects if an entry fails or the timeline is cancelled. */
  readonly finished: Promise<void>;
  /** Adds a step at an explicit or relative timeline position. Steps may overlap. */
  add(step: AnimationTimelineStep): AnimationTimelineControls;
  /** Adds a child timeline at an explicit or relative timeline position. */
  addTimeline(timeline: AnimationTimelineControls, at: AnimationTimelinePosition): AnimationTimelineControls;
  /** Defines a label at an absolute timeline position in milliseconds. */
  addLabel(name: string, at: number): AnimationTimelineControls;
  /** Starts the timeline. Calling again after playback begins has no effect. */
  play(): void;
  /** Pauses active animations and freezes pending offsets. */
  pause(): void;
  /** Resumes a paused timeline. */
  resume(): void;
  /** Moves the playhead to a finite, non-negative time in milliseconds. */
  seek(timeMs: number): void;
  /** Cancels the current run and replays the timeline from time zero. */
  restart(): void;
  /** Sets the timeline playback speed. Must be finite and greater than zero. */
  setPlaybackRate(rate: number): void;
  /** Returns the timeline playback speed. */
  getPlaybackRate(): number;
  /** Cancels active animations and rejects `finished`. Safe to repeat. */
  cancel(): void;
}

interface TimelineEntry {
  position: AnimationTimelinePosition;
  step?: AnimationTimelineStep;
  child?: TimelineState;
  startAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  started: boolean;
  done: boolean;
  control: AnimationControls | null;
  suppressCancel: boolean;
}

interface TimelineState {
  controls: AnimationTimelineControls;
  entries: TimelineEntry[];
  labels: Map<string, number>;
  parent: TimelineState | null;
  played: boolean;
  settled: boolean;
  cancelled: boolean;
  generation: number;
  duration: number;
  resolvePositions(): number;
  startNested(): void;
  pause(): void;
  resume(): void;
  cancel(): void;
  resetNested(): void;
  setPlaybackRate(rate: number): void;
}

const states = new WeakMap<AnimationTimelineControls, TimelineState>();

function abortError(): Error {
  const error = new Error("Animation timeline was cancelled");
  error.name = "AbortError";
  return error;
}

function validateLabelName(name: string): void {
  if (typeof name !== "string" || !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(name)) {
    throw new TypeError(`Invalid timeline label "${String(name)}"; use letters, numbers, "_" or "-"`);
  }
}

function validateOffset(offset: number | undefined): void {
  if (offset !== undefined && (typeof offset !== "number" || !Number.isFinite(offset))) {
    throw new RangeError(`Timeline position offset must be a finite number, received ${String(offset)}`);
  }
}

function validatePosition(position: AnimationTimelinePosition): void {
  if (typeof position === "number") {
    if (!Number.isFinite(position) || position < 0) {
      throw new RangeError(`Timeline step position must be a finite number >= 0, received ${String(position)}`);
    }
  } else if (typeof position === "string") {
    validateLabelName(position);
  } else if (position === null || typeof position !== "object" || Array.isArray(position)) {
    throw new TypeError("Timeline step position must be a number, label, or relative position");
  } else if ("label" in position) {
    validateLabelName(position.label);
    validateOffset(position.offset);
  } else if ("previous" in position) {
    if (position.previous !== "start" && position.previous !== "end") {
      throw new TypeError('Relative timeline position "previous" must be "start" or "end"');
    }
    validateOffset(position.offset);
  } else {
    throw new TypeError("Timeline step position must specify a label or previous step");
  }
}

function validateStep(step: AnimationTimelineStep): void {
  if (step === null || typeof step !== "object" || Array.isArray(step)) {
    throw new TypeError("Animation timeline step must be an object");
  }
  validatePosition(step.at);
  if (step.options !== undefined && (step.options === null || typeof step.options !== "object")) {
    throw new TypeError("Timeline step options must be an object");
  }
}

function copyStep(step: AnimationTimelineStep): AnimationTimelineStep {
  const properties = Object.fromEntries(
    Object.entries(step.properties).map(([property, values]) => [
      property,
      [values[0], values[1]] as const,
    ]),
  );
  return {
    target: step.target,
    properties,
    at: typeof step.at === "object" ? { ...step.at } : step.at,
    ...(step.options ? { options: { ...step.options } } : {}),
  };
}

function entryDuration(entry: TimelineEntry): number {
  if (entry.child) return entry.child.duration;
  const options = entry.step?.options;
  const duration = options?.duration ?? 1000;
  const delay = options?.delay ?? 0;
  const playbackRate = options?.playbackRate ?? 1;
  return delay + duration / playbackRate;
}

function resolvePosition(
  position: AnimationTimelinePosition,
  labels: Map<string, number>,
  previous: TimelineEntry | undefined,
): number {
  let startAt: number;
  if (typeof position === "number") {
    startAt = position;
  } else if (typeof position === "string") {
    const labelPosition = labels.get(position);
    if (labelPosition === undefined) throw new ReferenceError(`Unresolved timeline label "${position}"`);
    startAt = labelPosition;
  } else if ("label" in position) {
    const labelPosition = labels.get(position.label);
    if (labelPosition === undefined) throw new ReferenceError(`Unresolved timeline label "${position.label}"`);
    startAt = labelPosition + (position.offset ?? 0);
  } else {
    if (!previous) {
      throw new RangeError("The first timeline entry cannot be positioned relative to a previous entry");
    }
    startAt =
      (position.previous === "start"
        ? previous.startAt
        : previous.startAt + entryDuration(previous)) +
      (position.offset ?? 0);
  }
  if (!Number.isFinite(startAt) || startAt < 0) {
    throw new RangeError(`Resolved timeline position must be finite and >= 0, received ${String(startAt)}`);
  }
  return startAt;
}

function reaches(start: TimelineState, target: TimelineState, visited = new Set<TimelineState>()): boolean {
  if (start === target) return true;
  if (visited.has(start)) return false;
  visited.add(start);
  return start.entries.some((entry) => entry.child !== undefined && reaches(entry.child, target, visited));
}

/** Creates a timeline that schedules every step through the existing `animate()` engine. */
export function createTimeline(): AnimationTimelineControls {
  const entries: TimelineEntry[] = [];
  const labels = new Map<string, number>();
  const activeAnimations = new Set<AnimationControls>();
  const activeTimelines = new Set<AnimationTimelineControls>();
  let resolveFinished: () => void = () => undefined;
  let rejectFinished: (reason: unknown) => void = () => undefined;
  let finished: Promise<void>;
  let settled = false;
  let cancelled = false;
  let played = false;
  let paused = false;
  let elapsedBeforePause = 0;
  let playbackStartedAt = 0;
  let completed = 0;
  let duration = 0;
  let rate = 1;
  let generation = 0;
  let initialPosition = 0;

  const createFinished = (): void => {
    finished = new Promise<void>((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
  };
  createFinished();

  const now = (): number =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const elapsed = (): number =>
    elapsedBeforePause + (paused ? 0 : Math.max(0, now() - playbackStartedAt) * rate);

  const clearTimers = (): void => {
    for (const entry of entries) {
      if (entry.timer !== null) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
    }
  };

  let controls!: AnimationTimelineControls;
  let state!: TimelineState;

  const cancelEntry = (
    entry: TimelineEntry,
    resetChild = true,
    suppressCallbacks = true,
  ): void => {
    if (entry.control) {
      entry.suppressCancel = suppressCallbacks;
      activeAnimations.delete(entry.control);
      const control = entry.control;
      entry.control = null;
      control.cancel();
    }
    if (entry.child && resetChild && (entry.child.played || entry.child.settled)) {
      activeTimelines.delete(entry.child.controls);
      entry.child.resetNested();
    } else if (entry.child && !resetChild && entry.child.played && !entry.child.settled) {
      activeTimelines.delete(entry.child.controls);
      entry.child.controls.cancel();
    }
    entry.started = false;
    if (entry.done) {
      entry.done = false;
      completed--;
    }
  };

  const cancelActive = (resetChildren = false): void => {
    const errors: unknown[] = [];
    for (const entry of entries) {
      try {
        if (entry.control || (entry.child?.played && !entry.child.settled)) {
          cancelEntry(entry, resetChildren, resetChildren);
        } else if (entry.child && resetChildren && entry.child.settled) {
          entry.child.resetNested();
        }
      } catch (error) {
        errors.push(error);
      }
    }
    activeAnimations.clear();
    activeTimelines.clear();
    if (errors.length > 0) {
      throw new AggregateError(errors, "Animation timeline cleanup failed");
    }
  };

  const fail = (error: unknown, expectedGeneration = generation): void => {
    if (settled || expectedGeneration !== generation) return;
    settled = true;
    state.settled = true;
    clearTimers();
    try {
      cancelActive(false);
      rejectFinished(error);
    } catch (cleanupError) {
      rejectFinished(new AggregateError([error, cleanupError], "Animation timeline failed during cleanup"));
    }
  };

  const finishEntry = (entry: TimelineEntry): void => {
    if (settled || entry.done) return;
    entry.done = true;
    completed++;
    if (completed === entries.length) {
      settled = true;
      state.settled = true;
      resolveFinished();
    }
  };

  const launch = (entry: TimelineEntry, localElapsed = 0, force = false): void => {
    entry.timer = null;
    if (settled || cancelled || (paused && !force) || entry.started) return;
    entry.started = true;
    const entryGeneration = generation;

    if (entry.child) {
      const childControls = entry.child.controls;
      if (entry.child.settled) entry.child.resetNested();
      childControls.setPlaybackRate(rate);
      activeTimelines.add(childControls);
      const childGeneration = entry.child.generation;
      childControls.finished.then(
        () => {
          activeTimelines.delete(childControls);
          if (entryGeneration === generation && childGeneration === entry.child?.generation) finishEntry(entry);
        },
        (error: unknown) => {
          activeTimelines.delete(childControls);
          if (childGeneration === entry.child?.generation) fail(error, entryGeneration);
        },
      );
      try {
        if (localElapsed > 0) childControls.seek(localElapsed);
        entry.child.startNested();
        if (paused) childControls.pause();
      } catch (error) {
        fail(error, entryGeneration);
      }
      return;
    }

    const step = entry.step;
    if (!step) {
      fail(new Error("Timeline entry has no animation step"), entryGeneration);
      return;
    }

    const stepDelay = step.options?.delay ?? 0;
    const duration = step.options?.duration ?? 1000;
    const stepRate = step.options?.playbackRate ?? 1;
    const progressElapsed = Math.max(0, localElapsed - stepDelay);
    const initialProgress = duration === 0
      ? (localElapsed >= stepDelay ? 1 : 0)
      : Math.min(1, progressElapsed * stepRate / duration);
    const options = {
      ...step.options,
      delay: Math.max(0, stepDelay - localElapsed) / rate,
      playbackRate: stepRate * rate,
      onStart: () => {
        try {
          step.options?.onStart?.();
        } catch (error) {
          fail(error, entryGeneration);
          throw error;
        }
      },
      onUpdate: (progress: number) => {
        try {
          step.options?.onUpdate?.(progress);
        } catch (error) {
          fail(error, entryGeneration);
          throw error;
        }
      },
      onComplete: () => {
        try {
          step.options?.onComplete?.();
          if (entryGeneration !== generation) return;
          if (entry.control) activeAnimations.delete(entry.control);
          finishEntry(entry);
        } catch (error) {
          fail(error, entryGeneration);
          throw error;
        }
      },
      onCancel: () => {
        if (!entry.suppressCancel) step.options?.onCancel?.();
        entry.suppressCancel = false;
      },
    };

    try {
      entry.control = animate(step.target, step.properties, options);
      if (initialProgress > 0 || (duration === 0 && localElapsed >= stepDelay)) {
        entry.control.seek(initialProgress);
      }
      activeAnimations.add(entry.control);
      if (paused) entry.control.pause();
    } catch (error) {
      fail(error, entryGeneration);
    }
  };

  const schedulePending = (): void => {
    if (!played || paused || settled) return;
    const currentElapsed = elapsed();
    for (const entry of entries) {
      if (entry.started || entry.timer !== null) continue;
      const remaining = Math.max(0, entry.startAt - currentElapsed);
      entry.timer = setTimeout(
        () => launch(entry, Math.max(0, elapsed() - entry.startAt)),
        remaining / rate,
      );
    }
  };

  const resolvePositions = (): number => {
    duration = 0;
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      if (!entry) continue;
      if (entry.child) entry.child.resolvePositions();
      entry.startAt = resolvePosition(entry.position, labels, entries[index - 1]);
      duration = Math.max(duration, entry.startAt + entryDuration(entry));
    }
    return duration;
  };

  const resetRun = (rejectPrevious: boolean): void => {
    const previousReject = rejectFinished;
    generation++;
    clearTimers();
    cancelActive(true);
    settled = false;
    cancelled = false;
    played = false;
    paused = false;
    completed = 0;
    elapsedBeforePause = 0;
    initialPosition = 0;
    for (const entry of entries) {
      entry.started = false;
      entry.done = false;
      entry.control = null;
      entry.suppressCancel = false;
    }
    createFinished();
    state.played = false;
    state.settled = false;
    state.cancelled = false;
    state.generation = generation;
    if (rejectPrevious) previousReject(abortError());
  };

  const start = (internal: boolean): void => {
    if (!internal && state.parent) throw new Error("A nested timeline can only be played by its parent");
    if (played || settled || cancelled) return;
    played = true;
    state.played = true;
    if (entries.length === 0) {
      settled = true;
      state.settled = true;
      resolveFinished();
      return;
    }
    try {
      state.resolvePositions();
    } catch (error) {
      fail(error);
      return;
    }
    elapsedBeforePause = initialPosition;
    playbackStartedAt = now();
    schedulePending();
  };

  controls = {
    get finished() {
      return finished;
    },
    add: (step) => {
      if (played || settled || cancelled || state.parent) {
        throw new Error("Cannot add steps after timeline playback has started or nesting");
      }
      validateStep(step);
      entries.push({
        position: typeof step.at === "object" ? { ...step.at } : step.at,
        step: copyStep(step),
        startAt: 0,
        timer: null,
        started: false,
        done: false,
        control: null,
        suppressCancel: false,
      });
      return controls;
    },
    addTimeline: (childControls, position) => {
      if (played || settled || cancelled) throw new Error("Cannot add timelines after timeline playback has started");
      validatePosition(position);
      const child = states.get(childControls);
      if (!child) throw new TypeError("Nested timeline must be created by createTimeline()");
      if (child === state || reaches(child, state)) throw new TypeError("Circular timeline nesting is not allowed");
      if (state.parent) throw new Error("Cannot add timelines after timeline playback has started or nesting");
      if (child.played || child.settled || child.cancelled || child.parent) {
        throw new TypeError("A timeline can only be nested once, before playback starts");
      }
      child.parent = state;
      entries.push({
        position: typeof position === "object" ? { ...position } : position,
        child,
        startAt: 0,
        timer: null,
        started: false,
        done: false,
        control: null,
        suppressCancel: false,
      });
      return controls;
    },
    addLabel: (name, at) => {
      if (played || settled || cancelled || state.parent) {
        throw new Error("Cannot add labels after timeline playback has started or nesting");
      }
      validateLabelName(name);
      if (typeof at !== "number" || !Number.isFinite(at) || at < 0) {
        throw new RangeError(`Timeline label position must be a finite number >= 0, received ${String(at)}`);
      }
      if (labels.has(name)) throw new TypeError(`Timeline label "${name}" is already defined`);
      labels.set(name, at);
      return controls;
    },
    play: () => start(false),
    pause: () => {
      if (!played || settled || paused) return;
      elapsedBeforePause = elapsed();
      paused = true;
      clearTimers();
      for (const control of activeAnimations) control.pause();
      for (const timeline of activeTimelines) timeline.pause();
    },
    resume: () => {
      if (!paused || settled) return;
      paused = false;
      playbackStartedAt = now();
      for (const control of activeAnimations) control.resume();
      for (const timeline of activeTimelines) timeline.resume();
      schedulePending();
    },
    seek: (timeMs) => {
      if (typeof timeMs !== "number" || !Number.isFinite(timeMs) || timeMs < 0) {
        throw new RangeError(`Timeline seek time must be a finite number >= 0, received ${String(timeMs)}`);
      }
      if (settled) throw new Error("Cannot seek a completed timeline; call restart() first");
      if (cancelled) throw new Error("Cannot seek a cancelled timeline; call restart() first");
      initialPosition = timeMs;
      if (!played) {
        elapsedBeforePause = timeMs;
        return;
      }
      const wasPaused = paused;
      if (!paused) controls.pause();
      elapsedBeforePause = timeMs;
      playbackStartedAt = now();

      for (const entry of entries) {
        if (entry.timer !== null) {
          clearTimeout(entry.timer);
          entry.timer = null;
        }
        const localElapsed = timeMs - entry.startAt;
        if (entry.child) {
          if (localElapsed < 0) {
            cancelEntry(entry);
          } else {
            entry.started = false;
            if (entry.done) {
              entry.done = false;
              completed--;
            }
            if (entry.child.settled) entry.child.resetNested();
            entry.child.controls.seek(localElapsed);
            launch(entry, localElapsed, true);
          }
          continue;
        }
        const step = entry.step;
        if (!step || localElapsed < 0) {
          cancelEntry(entry);
          continue;
        }
        const delay = step.options?.delay ?? 0;
        if (localElapsed < delay && entry.control) cancelEntry(entry);
        if (entry.done) {
          entry.done = false;
          completed--;
        }
        if (entry.control && localElapsed >= delay) {
          const duration = step.options?.duration ?? 1000;
          const stepRate = step.options?.playbackRate ?? 1;
          const progress = duration === 0 ? 1 : Math.min(1, (localElapsed - delay) * stepRate / duration);
          entry.control.seek(progress);
          if (progress < 1) activeAnimations.add(entry.control);
        } else {
          entry.started = false;
          launch(entry, localElapsed, true);
        }
      }
      if (!wasPaused) {
        paused = false;
        playbackStartedAt = now();
        for (const control of activeAnimations) control.resume();
        for (const timeline of activeTimelines) timeline.resume();
        schedulePending();
      }
    },
    restart: () => {
      if (state.parent) throw new Error("A nested timeline can only be restarted by its parent");
      resetRun(true);
      start(false);
    },
    setPlaybackRate: (nextRate) => {
      if (typeof nextRate !== "number" || !Number.isFinite(nextRate) || nextRate <= 0) {
        throw new RangeError(`playbackRate must be a finite number > 0, received ${String(nextRate)}`);
      }
      if (played && !paused) {
        elapsedBeforePause = elapsed();
        playbackStartedAt = now();
      }
      rate = nextRate;
      for (const entry of entries) {
        if (entry.control && !entry.done) {
          entry.control.setPlaybackRate((entry.step?.options?.playbackRate ?? 1) * rate);
        }
        if (entry.child && entry.started) entry.child.controls.setPlaybackRate(rate);
      }
      if (played && !paused) {
        clearTimers();
        schedulePending();
      }
    },
    getPlaybackRate: () => rate,
    cancel: () => {
      if (settled || cancelled) return;
      cancelled = true;
      state.cancelled = true;
      clearTimers();
      fail(abortError());
    },
  };

  state = {
    controls,
    entries,
    labels,
    parent: null,
    played: false,
    settled: false,
    cancelled: false,
    generation,
    duration,
    resolvePositions: () => {
      const result = resolvePositions();
      state.duration = result;
      return result;
    },
    startNested: () => start(true),
    pause: () => controls.pause(),
    resume: () => controls.resume(),
    cancel: () => controls.cancel(),
    resetNested: () => resetRun(true),
    setPlaybackRate: (nextRate) => controls.setPlaybackRate(nextRate),
  };
  states.set(controls, state);
  return controls;
}
