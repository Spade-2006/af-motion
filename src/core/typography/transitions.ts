/**
 * AF Motion Kinetic Typography Transitions
 *
 * Implements stateful text morphing and transitions between arbitrary strings:
 * character replacement, rolling text, scramble transitions, and crossfades.
 */

import { animateProgress } from "../animation.js";
import { segmentCharacters } from "./segmenter.js";
import type {
  TypographyAnimationControls,
  TypographyTransitionOptions,
} from "./types.js";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

function resolveTargetElement(target: HTMLElement | string): HTMLElement {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error(`Cannot resolve selector "${target}": document is not available`);
    }
    const el = document.querySelector(target);
    if (!el || !(el instanceof HTMLElement)) {
      throw new Error(`Could not find HTMLElement matching selector "${target}"`);
    }
    return el;
  }
  return target;
}

/**
 * Transitions an element's text content from current to next string.
 */
export function createTextTransition(
  target: HTMLElement | string,
  nextText: string,
  options: TypographyTransitionOptions = {}
): TypographyAnimationControls {
  const element = resolveTargetElement(target);
  const currentText = element.textContent ?? "";
  const type = options.type ?? "crossfade";
  const duration = options.duration ?? 600;
  const scrambleCharset = options.scrambleCharset ?? SCRAMBLE_CHARS;

  const currentChars = segmentCharacters(currentText);
  const nextChars = segmentCharacters(nextText);
  const maxLen = Math.max(currentChars.length, nextChars.length);

  let isCancelled = false;
  let isFinished = false;

  let resolveFinished!: () => void;
  let rejectFinished!: (reason?: unknown) => void;
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  function renderTransition(progress: number): void {
    if (isCancelled) return;

    switch (type) {
      case "crossfade": {
        if (progress < 0.5) {
          element.style.opacity = (1 - progress * 2).toFixed(3);
        } else {
          if (element.textContent !== nextText) {
            element.textContent = nextText;
          }
          element.style.opacity = ((progress - 0.5) * 2).toFixed(3);
        }
        break;
      }

      case "scramble-transition": {
        const threshold = Math.floor(progress * maxLen);
        let output = "";
        for (let i = 0; i < maxLen; i++) {
          if (i < threshold) {
            output += nextChars[i] ?? "";
          } else {
            // Pseudo-random scramble character based on index and progress
            const charIdx = Math.floor(
              (Math.sin(i * 12.9898 + progress * 78.233) * 43758.5453 - Math.floor(Math.sin(i * 12.9898 + progress * 78.233) * 43758.5453)) *
                scrambleCharset.length
            );
            output += scrambleCharset[Math.abs(charIdx) % scrambleCharset.length] ?? "*";
          }
        }
        element.textContent = output;
        break;
      }

      case "character-replace":
      case "sequential-replace": {
        const threshold = Math.floor(progress * maxLen);
        let output = "";
        for (let i = 0; i < maxLen; i++) {
          if (i < threshold) {
            output += nextChars[i] ?? "";
          } else {
            output += currentChars[i] ?? "";
          }
        }
        element.textContent = output;
        break;
      }

      case "rolling-text":
      case "word-replace":
      case "line-replace": {
        if (progress >= 1) {
          element.textContent = nextText;
        } else {
          // Flip text midway through
          if (progress < 0.5) {
            element.style.transform = `translateY(${(-progress * 40).toFixed(2)}px)`;
            element.style.opacity = (1 - progress * 2).toFixed(3);
          } else {
            if (element.textContent !== nextText) element.textContent = nextText;
            element.style.transform = `translateY(${((1 - progress) * 40).toFixed(2)}px)`;
            element.style.opacity = ((progress - 0.5) * 2).toFixed(3);
          }
        }
        break;
      }
    }
  }

  const controls = animateProgress({
    duration,
    delay: options.delay ?? 0,
    easing: options.easing ?? "easeInOutCubic",
    onStart: () => {
      options.onStart?.();
    },
    onUpdate: (progress) => {
      renderTransition(progress);
    },
    onComplete: () => {
      if (isCancelled || isFinished) return;
      isFinished = true;
      element.textContent = nextText;
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      options.onComplete?.();
      resolveFinished();
    },
    onCancel: () => {
      if (isCancelled || isFinished) return;
      isCancelled = true;
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      options.onCancel?.();
      resolveFinished();
    },
  });

  return {
    seek: (progress: number) => {
      controls.seek(progress);
      renderTransition(progress);
    },
    pause: () => controls.pause(),
    resume: () => controls.resume(),
    reverse: () => controls.reverse(),
    setPlaybackRate: (rate: number) => controls.setPlaybackRate(rate),
    getPlaybackRate: () => controls.getPlaybackRate(),
    cancel: () => controls.cancel(),
    finish: () => {
      controls.cancel();
      if (!isFinished && !isCancelled) {
        isFinished = true;
        element.textContent = nextText;
        element.style.removeProperty("opacity");
        element.style.removeProperty("transform");
        options.onComplete?.();
        resolveFinished();
      }
    },
    destroy: () => {
      controls.cancel();
      element.textContent = currentText;
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
    },
    finished,
  };
}
