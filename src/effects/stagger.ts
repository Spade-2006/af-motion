import { animate, resolveTargets } from "../core/animate.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "../core/animate.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";

export type StaggerFrom = "first" | "last";

export interface StaggerElementAnimation {
  /** Element-specific property ranges; defaults to `StaggerOptions.properties`. */
  properties?: AnimatableProperties;
  /** Per-element overrides; delay is added to the stagger offset. */
  options?: DOMAnimationOptions;
}

export interface StaggerOptions {
  /** `[from, to]` pairs passed to `animate()`. Defaults to a fade-and-rise. */
  properties?: AnimatableProperties;
  /** Per-element duration in milliseconds. Defaults to 600. */
  duration?: number;
  /** Delay before the first element starts, in milliseconds. Defaults to 0. */
  delay?: number;
  /** Extra delay between consecutive elements, in milliseconds. Defaults to 100. */
  stagger?: number;
  /** Which end of the target list starts first. Defaults to "first". */
  from?: StaggerFrom;
  /** Supplies animation properties and options for each element before it starts. */
  configure?: (
    element: HTMLElement,
    index: number,
    order: number,
  ) => StaggerElementAnimation | void;
  easing?: EasingFunction;
  /** Playback speed multiplier. Defaults to 1. */
  playbackRate?: number;
  /** Fires once, after every element has finished. Never fires after `cancel()`. */
  onComplete?: () => void;
  /** Forwarded to `animate()`; reduced motion makes all elements jump to their final state. */
  respectReducedMotion?: boolean;
}

export type StaggerControls = AnimationControls;

const DEFAULT_PROPERTIES: AnimatableProperties = {
  opacity: [0, 1],
  transform: ["translateY(24px)", "translateY(0px)"],
};
const DEFAULT_DURATION_MS = 600;
const DEFAULT_STAGGER_MS = 100;

/**
 * Animates each target element with `animate()`, offsetting every element's delay by
 * `stagger` ms per position. No timers are used: the offset is the engine's own `delay`.
 *
 * - Elements are put in their `from` state immediately, so they don't flash before their turn.
 * - Validation matches `animate()`: invalid selectors, targets, properties, duration and
 *   delay throw before anything is animated. `stagger` must be a finite number >= 0 and
 *   `from` must be "first" or "last" (`RangeError` / `TypeError` respectively).
 * - A target matching no elements returns inert controls.
 * - Playback controls apply to every child animation; `cancel()` is safe to call repeatedly.
 */
export function stagger(target: AnimateTarget, options: StaggerOptions = {}): StaggerControls {
  const {
    properties = DEFAULT_PROPERTIES,
    duration = DEFAULT_DURATION_MS,
    delay = 0,
    stagger: interval = DEFAULT_STAGGER_MS,
    from = "first",
    configure,
    easing,
    playbackRate,
    onComplete,
    respectReducedMotion,
  } = options;

  if (typeof interval !== "number" || !Number.isFinite(interval) || interval < 0) {
    throw new RangeError(`stagger must be a finite number >= 0, received ${String(interval)}`);
  }
  if (from !== "first" && from !== "last") {
    throw new TypeError(`from must be "first" or "last", received ${String(from)}`);
  }
  if (configure !== undefined && typeof configure !== "function") {
    throw new TypeError("configure must be a function");
  }

  const baseOptions = {
    duration,
    delay,
    ...(easing === undefined ? {} : { easing }),
    ...(playbackRate === undefined ? {} : { playbackRate }),
    ...(respectReducedMotion === undefined ? {} : { respectReducedMotion }),
  };

  const elements = resolveTargets(target);
  if (elements.length === 0) {
    // Validates properties, duration and delay; nothing matches, so nothing runs.
    return animate(target, properties, baseOptions);
  }

  if (!Number.isFinite(delay + (elements.length - 1) * interval)) {
    throw new RangeError("delay plus stagger offsets must be finite");
  }

  let remaining = elements.length;
  const handleChildComplete = (): void => {
    remaining -= 1;
    if (remaining === 0) onComplete?.();
  };

  const children: AnimationControls[] = [];
  try {
    elements.forEach((element, index) => {
      const order = from === "first" ? index : elements.length - 1 - index;
      const elementAnimation = configure?.(element, index, order);
      if (
        elementAnimation !== undefined &&
        (elementAnimation === null || typeof elementAnimation !== "object" || Array.isArray(elementAnimation))
      ) {
        throw new TypeError(`Stagger configuration for element ${index} must be an object`);
      }
      const elementOptions = elementAnimation?.options;
      if (
        elementOptions !== undefined &&
        (elementOptions === null || typeof elementOptions !== "object" || Array.isArray(elementOptions))
      ) {
        throw new TypeError(`Stagger options for element ${index} must be an object`);
      }
      const elementDelay = elementOptions?.delay ?? 0;
      const scheduledDelay = delay + order * interval + elementDelay;
      if (typeof elementDelay !== "number" || !Number.isFinite(elementDelay) || elementDelay < 0 ||
          !Number.isFinite(scheduledDelay)) {
        throw new RangeError(`Delay for staggered element ${index} must be finite and >= 0`);
      }
      const elementProperties = elementAnimation?.properties ?? properties;
      const elementComplete = elementOptions?.onComplete;
      children.push(
        animate(element, elementProperties, {
          ...baseOptions,
          ...elementOptions,
          delay: scheduledDelay,
          onComplete: () => {
            try {
              elementComplete?.();
            } finally {
              handleChildComplete();
            }
          },
        }),
      );
    });
  } catch (error) {
    for (const child of children) child.cancel();
    throw error;
  }

  return {
    seek: (progress) => {
      for (const child of children) child.seek(progress);
    },
    pause: () => {
      for (const child of children) child.pause();
    },
    resume: () => {
      for (const child of children) child.resume();
    },
    reverse: () => {
      for (const child of children) child.reverse();
    },
    setPlaybackRate: (rate) => {
      for (const child of children) child.setPlaybackRate(rate);
    },
    getPlaybackRate: () => children[0]?.getPlaybackRate() ?? playbackRate ?? 1,
    cancel: () => {
      for (const child of children) child.cancel();
    },
  };
}
