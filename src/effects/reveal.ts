import { animate, resolveTargets, toCssName } from "../core/animate.js";
import type { AnimatableProperties, AnimateTarget } from "../core/animate.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";

export interface RevealOptions {
  /** `[from, to]` pairs passed to `animate()`. Defaults to a fade-and-rise. */
  properties?: AnimatableProperties;
  /** Duration in milliseconds. Defaults to 600. */
  duration?: number;
  /** Delay in milliseconds. Defaults to 0. */
  delay?: number;
  easing?: EasingFunction;
  /** IntersectionObserver threshold (0..1 or a list). Defaults to 0.15. */
  threshold?: number | number[];
  /** IntersectionObserver rootMargin. Defaults to "0px". */
  rootMargin?: string;
  /** Animate each element only the first time it is revealed. Defaults to true. */
  once?: boolean;
}

export interface RevealControls {
  /** Disconnects the observer and cancels running animations. Safe to call repeatedly. */
  destroy(): void;
}

const DEFAULT_PROPERTIES: AnimatableProperties = {
  opacity: [0, 1],
  transform: ["translateY(24px)", "translateY(0px)"],
};
const DEFAULT_DURATION_MS = 600;
const DEFAULT_THRESHOLD = 0.15;

function validateThreshold(threshold: number | number[]): void {
  const values = Array.isArray(threshold) ? threshold : [threshold];
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new RangeError(`threshold must be a number (or numbers) between 0 and 1, received ${String(threshold)}`);
  }
}

/**
 * Animates elements the first time (or every time, with `once: false`) they scroll into view.
 *
 * - Elements are put in their `from` state immediately so they don't flash before
 *   being revealed. With reduced motion, `animate()` skips this and content stays visible,
 *   then jumps to its final state when revealed.
 * - Options and properties are validated up front; errors are thrown synchronously
 *   from `reveal()` rather than later inside an observer callback.
 * - Throws `Error` if `IntersectionObserver` is unavailable.
 * - A target matching no elements returns inert controls.
 */
export function reveal(target: AnimateTarget, options: RevealOptions = {}): RevealControls {
  if (typeof IntersectionObserver === "undefined") {
    throw new Error("reveal() requires IntersectionObserver, which is not available in this environment");
  }

  const {
    properties = DEFAULT_PROPERTIES,
    duration = DEFAULT_DURATION_MS,
    delay,
    easing,
    threshold = DEFAULT_THRESHOLD,
    rootMargin = "0px",
    once = true,
  } = options;

  const animationOptions = {
    duration,
    ...(delay === undefined ? {} : { delay }),
    ...(easing === undefined ? {} : { easing }),
  };

  validateThreshold(threshold);
  const elements = resolveTargets(target);

  // Inline values the hidden state will overwrite, so unrevealed elements can be restored.
  const names = typeof properties === "object" && properties !== null ? Object.keys(properties).map(toCssName) : [];
  const snapshots = new Map<HTMLElement, Array<[string, string]>>();
  for (const element of elements) {
    snapshots.set(
      element,
      names.map((name): [string, string] => [name, element.style.getPropertyValue(name)]),
    );
  }
  const restoreHidden = (element: HTMLElement): void => {
    for (const [name, value] of snapshots.get(element) ?? []) {
      if (value === "") element.style.removeProperty(name);
      else element.style.setProperty(name, value);
    }
  };

  const undoAll = (): void => {
    for (const element of elements) restoreHidden(element);
  };

  // Validates properties/duration/delay/selector and applies the hidden state;
  // cancelling before the first frame leaves the `from` values in place.
  try {
    animate(target, properties, animationOptions).cancel();
  } catch (error) {
    undoAll();
    throw error;
  }

  if (elements.length === 0) return { destroy: () => undefined };

  const running = new Map<Element, AnimationControls>();
  const visible = new Set<Element>();
  const revealed = new Set<Element>();
  let destroyed = false;

  const start = (element: HTMLElement): void => {
    running.get(element)?.cancel();
    const controls = animate(element, properties, {
      ...animationOptions,
      onComplete: () => {
        if (running.get(element) === controls) running.delete(element);
      },
    });
    running.set(element, controls);
  };

  let observer: IntersectionObserver;
  try {
    observer = new IntersectionObserver(
      (entries) => {
        if (destroyed) return;
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (!entry.isIntersecting) {
            visible.delete(element);
            continue;
          }
          if (visible.has(element) || (once && revealed.has(element))) continue;
          visible.add(element);
          revealed.add(element);
          if (once) observer.unobserve(element);
          start(element);
        }
      },
      { threshold, rootMargin },
    );
  } catch (error) {
    undoAll();
    throw error;
  }

  for (const element of elements) observer.observe(element);

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      for (const controls of running.values()) controls.cancel();
      running.clear();
      // Elements that never scrolled into view must not stay hidden forever.
      for (const element of elements) if (!revealed.has(element)) restoreHidden(element);
      visible.clear();
      revealed.clear();
    },
  };
}
