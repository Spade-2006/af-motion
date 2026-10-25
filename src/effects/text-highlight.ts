import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type TextHighlightStyle = "marker" | "underline" | "box";
export type TextHighlightTrigger = "scroll" | "immediate";

export interface TextHighlightOptions {
  /** Highlight appearance. Defaults to "marker". */
  style?: TextHighlightStyle;
  /** CSS color for the highlight. Defaults to lime. */
  color?: string;
  /** Drawing duration in milliseconds. Must be >= 0. Defaults to 700. */
  duration?: number;
  /** Start immediately or when the target enters the viewport. Defaults to "immediate". */
  trigger?: TextHighlightTrigger;
}

export interface TextHighlightControls {
  /** Disconnects observers, cancels pending frames and restores the original child nodes. Safe to repeat. */
  destroy(): void;
}

interface HighlightState {
  element: HTMLElement;
  wrapper: HTMLSpanElement;
  originalChildren: Node[];
  started: boolean;
  frameId: number | null;
}

const DEFAULT_STYLE: TextHighlightStyle = "marker";
const DEFAULT_COLOR = "#a3e635";
const DEFAULT_DURATION_MS = 700;
const DEFAULT_TRIGGER: TextHighlightTrigger = "immediate";

function finalBackgroundSize(style: TextHighlightStyle): string {
  return style === "box" ? "100% 100%" : style === "underline" ? "100% 0.12em" : "100% 0.75em";
}

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function applyInitialHighlight(wrapper: HTMLSpanElement, style: TextHighlightStyle, color: string): void {
  wrapper.style.setProperty("box-decoration-break", "clone");
  wrapper.style.setProperty("-webkit-box-decoration-break", "clone");
  wrapper.style.setProperty("background-repeat", "no-repeat");
  wrapper.style.setProperty("background-position", style === "box" ? "left center" : "left bottom");
  if (style === "marker") {
    wrapper.style.setProperty("background-image", `linear-gradient(${color}, ${color})`);
    wrapper.style.setProperty("background-size", "0% 0.75em");
  } else if (style === "underline") {
    wrapper.style.setProperty("background-image", `linear-gradient(${color}, ${color})`);
    wrapper.style.setProperty("background-size", "0% 0.12em");
  } else {
    wrapper.style.setProperty("background-image", `linear-gradient(${color}, ${color})`);
    wrapper.style.setProperty("background-size", "0% 100%");
    wrapper.style.setProperty("padding", "0.08em 0.12em");
    wrapper.style.setProperty("border-radius", "0.12em");
  }
}

/**
 * Reveals a marker, underline, or box behind existing text without replacing its content.
 * An inline wrapper is removed on destroy, restoring the original child nodes.
 */
export function textHighlight(
  target: AnimateTarget,
  options: TextHighlightOptions = {},
): TextHighlightControls {
  const {
    style = DEFAULT_STYLE,
    color = DEFAULT_COLOR,
    duration = DEFAULT_DURATION_MS,
    trigger = DEFAULT_TRIGGER,
  } = options;

  if (style !== "marker" && style !== "underline" && style !== "box") {
    throw new TypeError(`style must be "marker", "underline", or "box", received ${String(style)}`);
  }
  validateColor(color);
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    throw new RangeError(`duration must be a finite number >= 0, received ${String(duration)}`);
  }
  if (trigger !== "scroll" && trigger !== "immediate") {
    throw new TypeError(`trigger must be "scroll" or "immediate", received ${String(trigger)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (trigger === "scroll" && typeof IntersectionObserver === "undefined") {
    throw new Error("textHighlight() with trigger 'scroll' requires IntersectionObserver");
  }

  const reducedMotion = prefersReducedMotion() || duration === 0;
  if (
    !reducedMotion &&
    (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function")
  ) {
    throw new Error("textHighlight() requires requestAnimationFrame and cancelAnimationFrame when motion is enabled");
  }

  const states: HighlightState[] = elements.map((element) => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("data-af-motion-highlight", "");
    applyInitialHighlight(wrapper, style, color);
    wrapper.style.setProperty("transition", `background-size ${duration}ms ease-out`);
    return {
      element,
      wrapper,
      originalChildren: Array.from(element.childNodes),
      started: false,
      frameId: null,
    };
  });

  let destroyed = false;
  let observer: IntersectionObserver | undefined;
  const stateByElement = new Map(states.map((state) => [state.element, state]));
  const restoreState = (state: HighlightState): void => {
    if (state.frameId !== null) {
      cancelAnimationFrame(state.frameId);
      state.frameId = null;
    }
    if (state.wrapper.parentNode !== state.element) return;
    for (const child of state.originalChildren) state.element.insertBefore(child, state.wrapper);
    state.element.removeChild(state.wrapper);
  };

  const finish = (state: HighlightState): void => {
    if (destroyed || state.started) return;
    state.started = true;
    if (reducedMotion) {
      state.wrapper.style.setProperty("background-size", finalBackgroundSize(style));
      return;
    }
    state.wrapper.getBoundingClientRect();
    state.frameId = requestAnimationFrame(() => {
      state.frameId = null;
      if (destroyed) return;
      state.wrapper.style.setProperty("background-size", finalBackgroundSize(style));
    });
  };

  const inserted: HighlightState[] = [];
  try {
    for (const state of states) {
      for (const child of state.originalChildren) state.wrapper.appendChild(child);
      state.element.insertBefore(state.wrapper, state.element.firstChild);
      inserted.push(state);
    }
    if (trigger === "scroll" && !reducedMotion) {
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
    for (const state of inserted) restoreState(state);
    throw error;
  }

  let stopPreferenceListener = (): void => undefined;
  stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (!reduced || destroyed) return;
    for (const state of states) {
      if (state.frameId !== null) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
      }
      state.started = true;
      state.wrapper.style.setProperty("background-size", finalBackgroundSize(style));
    }
    observer?.disconnect();
    stopPreferenceListener();
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      stopPreferenceListener();
      for (const state of states) restoreState(state);
    },
  };
}
