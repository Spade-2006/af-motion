import { animate, resolveTargets } from "../core/animate.js";
import type { AnimatableProperties, AnimateTarget } from "../core/animate.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";

export type StaggerFrom = "first" | "last";

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
  easing?: EasingFunction;
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
 * - `cancel()` cancels every child animation and is safe to call repeatedly.
 */
export function stagger(target: AnimateTarget, options: StaggerOptions = {}): StaggerControls {
  const {
    properties = DEFAULT_PROPERTIES,
    duration = DEFAULT_DURATION_MS,
    delay = 0,
    stagger: interval = DEFAULT_STAGGER_MS,
    from = "first",
    easing,
    onComplete,
    respectReducedMotion,
  } = options;

  if (typeof interval !== "number" || !Number.isFinite(interval) || interval < 0) {
    throw new RangeError(`stagger must be a finite number >= 0, received ${String(interval)}`);
  }
  if (from !== "first" && from !== "last") {
    throw new TypeError(`from must be "first" or "last", received ${String(from)}`);
  }

  const baseOptions = {
    duration,
    delay,
    ...(easing === undefined ? {} : { easing }),
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
      children.push(
        animate(element, properties, {
          ...baseOptions,
          delay: delay + order * interval,
          onComplete: handleChildComplete,
        }),
      );
    });
  } catch (error) {
    for (const child of children) child.cancel();
    throw error;
  }

  return {
    cancel: () => {
      for (const child of children) child.cancel();
    },
  };
}
