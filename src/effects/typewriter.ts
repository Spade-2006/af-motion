import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export interface TypewriterOptions {
  /** Phrases to type in order. At least one non-empty phrase is required. */
  phrases: readonly string[];
  /** Delay between typed characters in milliseconds. Must be > 0. Defaults to 70. */
  typeSpeed?: number;
  /** Delay between deleted characters in milliseconds. Must be > 0. Defaults to 35. */
  deleteSpeed?: number;
  /** Pause after a phrase is fully typed, in milliseconds. Must be >= 0. Defaults to 1200. */
  pause?: number;
  /** Whether to restart from the first phrase after the last phrase. Defaults to true. */
  loop?: boolean;
  /** Cursor text appended while typing. Use an empty string to hide it. Defaults to "|". */
  cursor?: string;
}

export interface TypewriterControls {
  /** Cancels pending timers and restores each target's original text. Safe to repeat. */
  destroy(): void;
}

interface TargetState {
  element: HTMLElement;
  original: string;
}

type Phase = "typing" | "waiting" | "deleting" | "complete";

const DEFAULT_TYPE_SPEED_MS = 70;
const DEFAULT_DELETE_SPEED_MS = 35;
const DEFAULT_PAUSE_MS = 1200;
const DEFAULT_CURSOR = "|";

/**
 * Types and deletes phrases using one shared timer for every target. Phrase text is split into
 * Unicode code points, and destroying the effect restores each target's original text.
 */
export function typewriter(target: AnimateTarget, options: TypewriterOptions): TypewriterControls {
  if (!options || typeof options !== "object") {
    throw new TypeError("typewriter() options must be an object");
  }

  const {
    phrases,
    typeSpeed = DEFAULT_TYPE_SPEED_MS,
    deleteSpeed = DEFAULT_DELETE_SPEED_MS,
    pause = DEFAULT_PAUSE_MS,
    loop = true,
    cursor = DEFAULT_CURSOR,
  } = options;

  if (!Array.isArray(phrases) || phrases.length === 0) {
    throw new TypeError("phrases must contain at least one non-empty string");
  }
  if (phrases.some((phrase) => typeof phrase !== "string" || Array.from(phrase).length === 0)) {
    throw new TypeError("each phrase must be a non-empty string");
  }
  if (typeof typeSpeed !== "number" || !Number.isFinite(typeSpeed) || typeSpeed <= 0) {
    throw new RangeError(`typeSpeed must be a finite number > 0, received ${String(typeSpeed)}`);
  }
  if (typeof deleteSpeed !== "number" || !Number.isFinite(deleteSpeed) || deleteSpeed <= 0) {
    throw new RangeError(`deleteSpeed must be a finite number > 0, received ${String(deleteSpeed)}`);
  }
  if (typeof pause !== "number" || !Number.isFinite(pause) || pause < 0) {
    throw new RangeError(`pause must be a finite number >= 0, received ${String(pause)}`);
  }
  if (typeof loop !== "boolean") {
    throw new TypeError(`loop must be a boolean, received ${String(loop)}`);
  }
  if (typeof cursor !== "string") {
    throw new TypeError(`cursor must be a string, received ${String(cursor)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states: TargetState[] = elements.map((element) => ({
    element,
    original: element.textContent ?? "",
  }));
  const characters = phrases.map((phrase) => Array.from(phrase));
  const reducedMotion = prefersReducedMotion();
  let destroyed = false;
  let phase: Phase = "typing";
  let phraseIndex = 0;
  let characterIndex = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopPreferenceListener = (): void => undefined;

  const render = (): void => {
    const phrase = characters[phraseIndex];
    if (!phrase) return;
    const value = phrase.slice(0, characterIndex).join("") + cursor;
    for (const state of states) state.element.textContent = value;
  };

  const showFinalPhrase = (): void => {
    phraseIndex = characters.length - 1;
    characterIndex = characters[phraseIndex]?.length ?? 0;
    phase = "complete";
    render();
  };

  const clearTimer = (): void => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  };

  const schedule = (callback: () => void, delay: number): void => {
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      if (!destroyed) callback();
    }, delay);
  };

  const advance = (): void => {
    if (phase === "typing") {
      const phrase = characters[phraseIndex];
      if (!phrase) return;
      if (characterIndex < phrase.length) {
        characterIndex++;
        render();
        schedule(advance, typeSpeed);
        return;
      }
      if (!loop && phraseIndex === characters.length - 1) {
        phase = "complete";
        return;
      }
      phase = "waiting";
      schedule(advance, pause);
      return;
    }

    if (phase === "waiting") {
      phase = "deleting";
      schedule(advance, deleteSpeed);
      return;
    }

    if (phase === "deleting") {
      if (characterIndex > 0) {
        characterIndex--;
        render();
      }
      if (characterIndex > 0) {
        schedule(advance, deleteSpeed);
        return;
      }
      phraseIndex = (phraseIndex + 1) % characters.length;
      phase = "typing";
      schedule(advance, typeSpeed);
    }
  };

  if (reducedMotion) {
    showFinalPhrase();
    return {
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        for (const state of states) state.element.textContent = state.original;
      },
    };
  }

  render();
  schedule(advance, typeSpeed);

  stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (!reduced || destroyed) return;
    clearTimer();
    showFinalPhrase();
    stopPreferenceListener();
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      clearTimer();
      stopPreferenceListener();
      for (const state of states) state.element.textContent = state.original;
    },
  };
}
