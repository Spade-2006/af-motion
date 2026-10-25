import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { easings } from "../easing/easings.js";
import type { EasingName } from "../easing/easings.js";
import type { EasingFunction } from "../core/animation.js";

export interface CountUpOptions {
  /** Starting number. Defaults to 0. */
  from?: number;
  /** Final number. Defaults to 100. */
  to?: number;
  /** Animation duration in milliseconds. Must be >= 0. Defaults to 1000. */
  duration?: number;
  /** Number of fractional digits to display. Must be an integer from 0 to 20. Defaults to 0. */
  decimals?: number;
  /** Text prepended to the formatted number. Defaults to an empty string. */
  prefix?: string;
  /** Text appended to the formatted number. Defaults to an empty string. */
  suffix?: string;
  /** Name of an easing in the public registry, or a custom easing function. Defaults to linear. */
  easing?: EasingName | EasingFunction;
}

export interface CountUpControls {
  /** Cancels pending frames and restores each target's original text. Safe to repeat. */
  destroy(): void;
}

interface CountUpState {
  element: HTMLElement;
  original: string;
}

const DEFAULT_FROM = 0;
const DEFAULT_TO = 100;
const DEFAULT_DURATION_MS = 1000;
const DEFAULT_DECIMALS = 0;
const DEFAULT_PREFIX = "";
const DEFAULT_SUFFIX = "";
const linear: EasingFunction = (progress) => progress;

/**
 * Animates formatted numeric values for every target using one shared requestAnimationFrame
 * loop. Destroying the effect cancels the frame and restores each element's original text.
 */
export function countUp(target: AnimateTarget, options: CountUpOptions = {}): CountUpControls {
  const {
    from = DEFAULT_FROM,
    to = DEFAULT_TO,
    duration = DEFAULT_DURATION_MS,
    decimals = DEFAULT_DECIMALS,
    prefix = DEFAULT_PREFIX,
    suffix = DEFAULT_SUFFIX,
    easing = linear,
  } = options;

  if (typeof from !== "number" || !Number.isFinite(from)) {
    throw new RangeError(`from must be a finite number, received ${String(from)}`);
  }
  if (typeof to !== "number" || !Number.isFinite(to)) {
    throw new RangeError(`to must be a finite number, received ${String(to)}`);
  }
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    throw new RangeError(`duration must be a finite number >= 0, received ${String(duration)}`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 20) {
    throw new RangeError(`decimals must be an integer between 0 and 20, received ${String(decimals)}`);
  }
  if (typeof prefix !== "string") throw new TypeError("prefix must be a string");
  if (typeof suffix !== "string") throw new TypeError("suffix must be a string");

  let easingFunction: EasingFunction;
  if (typeof easing === "string") {
    const registered = Object.prototype.hasOwnProperty.call(easings, easing) ? easings[easing] : undefined;
    if (!registered) throw new TypeError(`Unknown easing "${easing}"`);
    easingFunction = registered;
  } else if (typeof easing === "function") {
    easingFunction = easing;
  } else {
    throw new TypeError("easing must be a registered easing name or a function");
  }
  if (!Number.isFinite(easingFunction(0))) {
    throw new TypeError("easing must return a finite number");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  const states: CountUpState[] = elements.map((element) => ({
    element,
    original: element.textContent ?? "",
  }));
  const format = (value: number): string => `${prefix}${value.toFixed(decimals)}${suffix}`;
  let destroyed = false;
  let frameId: number | null = null;
  let startTime: number | null = null;
  let stopPreferenceListener = (): void => undefined;

  const write = (value: number): void => {
    const text = format(value);
    for (const state of states) state.element.textContent = text;
  };

  const stop = (): void => {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  const restore = (): void => {
    for (const state of states) state.element.textContent = state.original;
  };

  if (prefersReducedMotion() || duration === 0) {
    write(to);
    return {
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        restore();
      },
    };
  }

  if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") {
    throw new Error("countUp() requires requestAnimationFrame and cancelAnimationFrame");
  }

  write(from);

  const tick = (time: number): void => {
    frameId = null;
    if (destroyed) return;
    if (startTime === null) startTime = time;
    const progress = Math.min(Math.max((time - startTime) / duration, 0), 1);
    const eased = easingFunction(progress);
    if (!Number.isFinite(eased)) {
      stop();
      destroyed = true;
      restore();
      stopPreferenceListener();
      throw new TypeError("easing must return a finite number");
    }
    write(progress === 1 ? to : from + (to - from) * eased);

    if (progress < 1) frameId = requestAnimationFrame(tick);
    else stopPreferenceListener();
  };

  stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (!reduced || destroyed) return;
    stop();
    write(to);
    stopPreferenceListener();
  });
  frameId = requestAnimationFrame(tick);

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
