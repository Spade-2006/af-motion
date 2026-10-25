import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export interface GradientTextOptions {
  /** CSS colors used for the text gradient. Defaults to a violet/cyan pair. */
  colors?: readonly string[];
  /** Gradient angle in degrees. Defaults to 90. */
  angle?: number;
  /** Animation duration in milliseconds. Defaults to 4000. */
  duration?: number;
  /** Enables gradient movement. Defaults to false. */
  animated?: boolean;
  /** Repeats the animation indefinitely. Defaults to true. */
  loop?: boolean;
}

export interface GradientTextControls {
  /** Cancels animation and restores the original inline text styles. Safe to repeat. */
  destroy(): void;
}

interface InlineStyleSnapshot {
  property: string;
  value: string;
  priority: string;
}

interface GradientTextState {
  element: HTMLElement;
  styles: InlineStyleSnapshot[];
  animation: Animation | null;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4"] as const;
const DEFAULT_ANGLE = 90;
const DEFAULT_DURATION = 4000;
const STYLE_PROPERTIES = [
  "background-image",
  "background-clip",
  "-webkit-background-clip",
  "color",
  "-webkit-text-fill-color",
  "background-size",
  "background-position",
] as const;

function validateColors(colors: readonly string[]): void {
  if (!Array.isArray(colors) || colors.length < 2) {
    throw new TypeError("colors must be an array containing at least two CSS colors");
  }
  for (const color of colors) {
    if (typeof color !== "string" || color.trim() === "") {
      throw new TypeError("colors must contain non-empty CSS color strings");
    }
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
      throw new TypeError(`Invalid CSS color "${color}"`);
    }
  }
}

function captureStyles(element: HTMLElement): InlineStyleSnapshot[] {
  return STYLE_PROPERTIES.map((property) => ({
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }));
}

function restoreStyles(state: GradientTextState): void {
  state.animation?.cancel();
  state.animation = null;
  for (const { property, value, priority } of state.styles) {
    if (value === "") state.element.style.removeProperty(property);
    else state.element.style.setProperty(property, value, priority);
  }
}

function applyGradient(state: GradientTextState, image: string, animated: boolean): void {
  const { style } = state.element;
  style.setProperty("background-image", image);
  style.setProperty("background-clip", "text");
  style.setProperty("-webkit-background-clip", "text");
  style.setProperty("color", "transparent");
  style.setProperty("-webkit-text-fill-color", "transparent");
  style.setProperty("background-size", animated ? "200% 100%" : "100% 100%");
  style.setProperty("background-position", "0% 50%");
}

/**
 * Applies a CSS text gradient and optionally moves it with the Web Animations API.
 * Original inline styles are restored when destroyed.
 */
export function gradientText(target: AnimateTarget, options: GradientTextOptions = {}): GradientTextControls {
  const {
    colors = DEFAULT_COLORS,
    angle = DEFAULT_ANGLE,
    duration = DEFAULT_DURATION,
    animated = false,
    loop = true,
  } = options;

  validateColors(colors);
  if (typeof angle !== "number" || !Number.isFinite(angle)) {
    throw new RangeError(`angle must be a finite number, received ${String(angle)}`);
  }
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    throw new RangeError(`duration must be a finite number > 0, received ${String(duration)}`);
  }
  if (typeof animated !== "boolean") throw new TypeError("animated must be a boolean");
  if (typeof loop !== "boolean") throw new TypeError("loop must be a boolean");

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const motionReduced = prefersReducedMotion();
  if (animated && !motionReduced && elements.some((element) => typeof element.animate !== "function")) {
    throw new Error("gradientText() requires the Web Animations API when animated motion is enabled");
  }

  const image = `linear-gradient(${angle}deg, ${colors.join(", ")})`;
  const states: GradientTextState[] = elements.map((element) => ({
    element,
    styles: captureStyles(element),
    animation: null,
  }));
  let destroyed = false;

  const startAnimations = (): void => {
    for (const state of states) {
      if (!animated || motionReduced || destroyed || state.animation) continue;
      state.animation = state.element.animate(
        [
          { backgroundPosition: "0% 50%" },
          { backgroundPosition: "100% 50%" },
        ],
        {
          duration,
          iterations: loop ? Number.POSITIVE_INFINITY : 1,
          fill: loop ? "none" : "forwards",
          easing: "linear",
        },
      );
    }
  };

  try {
    for (const state of states) applyGradient(state, image, animated && !motionReduced);
    startAnimations();
  } catch (error) {
    for (const state of states) restoreStyles(state);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || !animated) return;
    if (reduced) {
      for (const state of states) {
        state.animation?.cancel();
        state.animation = null;
        state.element.style.setProperty("background-size", "100% 100%");
        state.element.style.setProperty("background-position", "50% 50%");
      }
    } else {
      for (const state of states) {
        state.element.style.setProperty("background-size", "200% 100%");
        state.element.style.setProperty("background-position", "0% 50%");
      }
      startAnimations();
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const state of states) restoreStyles(state);
    },
  };
}
