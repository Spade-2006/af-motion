import type { EasingFunction } from "../core/animation.js";
import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type TextMaskDirection = "up" | "down" | "left" | "right";
export type TextMaskTrigger = "scroll" | "immediate";

export interface TextMaskOptions {
  /** Reveal duration in milliseconds. Defaults to 900. */
  duration?: number;
  /** CSS timing function or progress easing function. Defaults to "ease". */
  easing?: string | EasingFunction;
  /** Direction the clipping edge moves as the text is revealed. Defaults to "up". */
  direction?: TextMaskDirection;
  /** Color of the masked overlay. Defaults to transparent. */
  color?: string;
  /** Start immediately or when each target enters the viewport. Defaults to "immediate". */
  trigger?: TextMaskTrigger;
}

export interface TextMaskControls {
  /** Cancels pending transitions, disconnects observers, and restores the original DOM. Safe to repeat. */
  destroy(): void;
}

interface MaskState {
  element: HTMLElement;
  wrapper: HTMLSpanElement;
  originalChildren: Node[];
  started: boolean;
  frameId: number | null;
}

const DEFAULT_DURATION = 900;
const DEFAULT_DIRECTION: TextMaskDirection = "up";
const DEFAULT_TRIGGER: TextMaskTrigger = "immediate";
const DEFAULT_COLOR = "currentColor";

function validateDuration(duration: number): void {
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    throw new RangeError(`duration must be a finite number >= 0, received ${String(duration)}`);
  }
}

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function cssEasing(easing: string | EasingFunction): string {
  if (typeof easing === "string") {
    const value = easing.trim();
    if (value === "") throw new TypeError("easing must be a non-empty CSS timing function or function");
    if (
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      !CSS.supports("transition-timing-function", value)
    ) {
      throw new TypeError(`Invalid CSS timing function "${value}"`);
    }
    return value;
  }
  if (typeof easing !== "function") {
    throw new TypeError("easing must be a CSS timing function or function");
  }

  const samples = Array.from({ length: 21 }, (_, index) => {
    const progress = index / 20;
    const value = easing(progress);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`easing must return finite numbers, received ${String(value)} at ${progress}`);
    }
    return `${value} ${progress * 100}%`;
  });
  return `linear(${samples.join(", ")})`;
}

function initialClip(direction: TextMaskDirection): string {
  switch (direction) {
    case "up":
      return "inset(100% 0 0 0)";
    case "down":
      return "inset(0 0 100% 0)";
    case "left":
      return "inset(0 0 0 100%)";
    case "right":
      return "inset(0 100% 0 0)";
  }
}

function restoreState(state: MaskState): void {
  const parent = state.wrapper.parentNode;
  if (parent) {
    for (const child of state.originalChildren) parent.insertBefore(child, state.wrapper);
    parent.removeChild(state.wrapper);
    return;
  }
  while (state.element.firstChild) state.element.removeChild(state.element.firstChild);
  for (const child of state.originalChildren) state.element.appendChild(child);
}

/**
 * Reveals existing text through a directional CSS clip mask without replacing its content.
 * The temporary wrapper is removed on destroy, restoring the original child nodes.
 */
export function textMask(target: AnimateTarget, options: TextMaskOptions = {}): TextMaskControls {
  const {
    duration = DEFAULT_DURATION,
    easing = "ease",
    direction = DEFAULT_DIRECTION,
    color = DEFAULT_COLOR,
    trigger = DEFAULT_TRIGGER,
  } = options;

  validateDuration(duration);
  validateColor(color);
  const timingFunction = cssEasing(easing);
  if (direction !== "up" && direction !== "down" && direction !== "left" && direction !== "right") {
    throw new TypeError(`direction must be "up", "down", "left", or "right", received ${String(direction)}`);
  }
  if (trigger !== "scroll" && trigger !== "immediate") {
    throw new TypeError(`trigger must be "scroll" or "immediate", received ${String(trigger)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  const reducedMotion = prefersReducedMotion() || duration === 0;
  if (
    !reducedMotion &&
    (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function")
  ) {
    throw new Error("textMask() requires requestAnimationFrame and cancelAnimationFrame when motion is enabled");
  }
  if (!reducedMotion && trigger === "scroll" && typeof IntersectionObserver === "undefined") {
    throw new Error("textMask() with trigger 'scroll' requires IntersectionObserver");
  }

  const states: MaskState[] = elements.map((element) => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("data-af-motion-mask", "");
    wrapper.style.setProperty("display", "inline-block");
    wrapper.style.setProperty("max-width", "100%");
    wrapper.style.setProperty("vertical-align", "bottom");
    wrapper.style.setProperty("color", color);
    wrapper.style.setProperty("clip-path", reducedMotion ? "inset(0)" : initialClip(direction));
    wrapper.style.setProperty("transition", "none");
    wrapper.style.setProperty("will-change", reducedMotion ? "auto" : "clip-path");
    return {
      element,
      wrapper,
      originalChildren: Array.from(element.childNodes),
      started: false,
      frameId: null,
    };
  });
  const stateByElement = new Map(states.map((state) => [state.element, state]));

  let destroyed = false;
  let observer: IntersectionObserver | undefined;
  let stopPreferenceListener = (): void => undefined;

  const finish = (state: MaskState): void => {
    if (destroyed || state.started) return;
    state.started = true;
    if (reducedMotion) {
      state.wrapper.style.setProperty("clip-path", "inset(0)");
      return;
    }
    state.wrapper.getBoundingClientRect();
    state.wrapper.style.setProperty("transition", `clip-path ${duration}ms ${timingFunction}`);
    state.frameId = requestAnimationFrame(() => {
      state.frameId = null;
      if (destroyed) return;
      state.wrapper.style.setProperty("clip-path", "inset(0)");
    });
  };

  const finishAllImmediately = (): void => {
    observer?.disconnect();
    for (const state of states) {
      if (state.frameId !== null) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
      }
      state.started = true;
      state.wrapper.style.setProperty("transition", "none");
      state.wrapper.style.setProperty("clip-path", "inset(0)");
    }
    stopPreferenceListener();
  };

  const inserted: MaskState[] = [];
  try {
    for (const state of states) {
      inserted.push(state);
      for (const child of state.originalChildren) state.wrapper.appendChild(child);
      state.element.insertBefore(state.wrapper, state.element.firstChild);
    }
    if (!reducedMotion && trigger === "scroll") {
      observer = new IntersectionObserver((entries) => {
        if (destroyed) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const state = stateByElement.get(entry.target as HTMLElement);
          if (!state) continue;
          finish(state);
          observer?.unobserve(state.element);
        }
      });
      for (const state of states) observer.observe(state.element);
    } else {
      for (const state of states) finish(state);
    }
  } catch (error) {
    observer?.disconnect();
    for (const state of states) {
      if (state.frameId !== null) cancelAnimationFrame(state.frameId);
    }
    for (const state of inserted) restoreState(state);
    throw error;
  }

  if (!reducedMotion) {
    stopPreferenceListener = onReducedMotionChange((reduced) => {
      if (reduced && !destroyed) finishAllImmediately();
    });
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      stopPreferenceListener();
      for (const state of states) {
        if (state.frameId !== null) {
          cancelAnimationFrame(state.frameId);
          state.frameId = null;
        }
        restoreState(state);
      }
    },
  };
}
