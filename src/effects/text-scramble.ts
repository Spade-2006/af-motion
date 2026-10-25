import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export interface TextScrambleOptions {
  /** Animation duration in milliseconds. Must be >= 0. Defaults to 1000. */
  duration?: number;
  /** Unicode characters used for the scrambled suffix. Must not be empty. */
  characters?: string;
  /** Minimum interval between text updates, in milliseconds. Must be > 0. Defaults to 30. */
  speed?: number;
}

export interface TextScrambleControls {
  /** Stops the effect and restores each target's original text. Safe to repeat. */
  destroy(): void;
}

interface TextState {
  element: HTMLElement;
  original: string[];
}

const DEFAULT_DURATION_MS = 1000;
const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DEFAULT_SPEED_MS = 30;

function randomCharacter(characters: readonly string[]): string {
  return characters[Math.floor(Math.random() * characters.length)] ?? characters[0] ?? "";
}

function scrambledText(state: TextState, revealed: number, characters: readonly string[]): string {
  return state.original
    .map((character, index) =>
      index < revealed || /^\s+$/u.test(character) ? character : randomCharacter(characters),
    )
    .join("");
}

/**
 * Reveals each target's original text from randomized Unicode characters. The effect uses one
 * requestAnimationFrame loop for all targets and restores the exact original text on destroy.
 */
export function textScramble(target: AnimateTarget, options: TextScrambleOptions = {}): TextScrambleControls {
  const {
    duration = DEFAULT_DURATION_MS,
    characters = DEFAULT_CHARACTERS,
    speed = DEFAULT_SPEED_MS,
  } = options;

  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    throw new RangeError(`duration must be a finite number >= 0, received ${String(duration)}`);
  }
  if (typeof characters !== "string" || Array.from(characters).length === 0) {
    throw new TypeError("characters must be a non-empty string");
  }
  if (typeof speed !== "number" || !Number.isFinite(speed) || speed <= 0) {
    throw new RangeError(`speed must be a finite number > 0, received ${String(speed)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states = elements.map((element): TextState => ({
    element,
    original: Array.from(element.textContent ?? ""),
  }));
  const scrambleCharacters = Array.from(characters);
  let destroyed = false;
  let frameId: number | null = null;
  let startTime: number | null = null;
  let lastUpdateTime: number | null = null;

  const restore = (): void => {
    for (const state of states) state.element.textContent = state.original.join("");
  };

  const stop = (): void => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  };

  if (prefersReducedMotion() || duration === 0) {
    restore();
    return { destroy: () => undefined };
  }

  if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") {
    throw new Error("textScramble() requires requestAnimationFrame and cancelAnimationFrame");
  }

  for (const state of states) state.element.textContent = scrambledText(state, 0, scrambleCharacters);

  const tick = (time: number): void => {
    frameId = null;
    if (destroyed) return;
    if (startTime === null) {
      startTime = time;
      lastUpdateTime = time;
    }

    const elapsed = Math.max(0, time - startTime);
    const progress = Math.min(elapsed / duration, 1);
    if (elapsed - (lastUpdateTime ?? time) >= speed || progress === 1) {
      for (const state of states) {
        const revealed = Math.floor(progress * state.original.length);
        state.element.textContent = scrambledText(state, revealed, scrambleCharacters);
      }
      lastUpdateTime = time;
    }

    if (progress === 1) {
      restore();
      stopPreferenceListener();
      return;
    }
    frameId = requestAnimationFrame(tick);
  };

  const schedule = (): void => {
    if (!destroyed && frameId === null) frameId = requestAnimationFrame(tick);
  };

  let stopPreferenceListener = (): void => undefined;
  stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (!reduced || destroyed) return;
    stop();
    restore();
    destroyed = true;
    stopPreferenceListener();
  });

  schedule();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stop();
      stopPreferenceListener();
      restore();
    },
  };
}
