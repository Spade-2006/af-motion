import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export interface ScrollTriggerOptions {
  /** Called when an observed element enters the configured viewport region. */
  onEnter?: (element: HTMLElement, entry: IntersectionObserverEntry) => void;
  /** Called when an element that entered leaves the configured viewport region. */
  onLeave?: (element: HTMLElement, entry: IntersectionObserverEntry) => void;
  /** IntersectionObserver root margin. Defaults to "0px". */
  rootMargin?: string;
  /** IntersectionObserver threshold (0..1 or a list). Defaults to 0. */
  threshold?: number | number[];
  /** Observe one enter/leave cycle per element. Defaults to true. */
  once?: boolean;
}

export interface ScrollTriggerControls {
  /** Stops observing all targets. Safe to call repeatedly. */
  destroy(): void;
}

function validateThreshold(threshold: number | number[]): void {
  const values = Array.isArray(threshold) ? threshold : [threshold];
  if (values.some(
    (value) => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1,
  )) {
    throw new RangeError(`threshold must be a number (or non-empty list of numbers) between 0 and 1`);
  }
}

/**
 * Calls transition callbacks as elements enter and leave an observer's viewport region.
 * In one-time mode, each element is observed through its first complete visible cycle.
 */
export function scrollTrigger(
  target: AnimateTarget,
  options: ScrollTriggerOptions = {},
): ScrollTriggerControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("scrollTrigger() options must be an object");
  }
  const {
    onEnter,
    onLeave,
    rootMargin = "0px",
    threshold = 0,
    once = true,
  } = options;

  if (onEnter !== undefined && typeof onEnter !== "function") {
    throw new TypeError("onEnter must be a function");
  }
  if (onLeave !== undefined && typeof onLeave !== "function") {
    throw new TypeError("onLeave must be a function");
  }
  if (onEnter === undefined && onLeave === undefined) {
    throw new TypeError("scrollTrigger() requires onEnter or onLeave");
  }
  validateThreshold(threshold);
  if (typeof rootMargin !== "string" || rootMargin.trim() === "") {
    throw new TypeError("rootMargin must be a non-empty string");
  }
  if (typeof once !== "boolean") {
    throw new TypeError("once must be a boolean");
  }
  if (typeof IntersectionObserver === "undefined") {
    throw new Error("scrollTrigger() requires IntersectionObserver, which is not available in this environment");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const inside = new Set<Element>();
  const observed = new Set<Element>();
  let destroyed = false;

  let observer: IntersectionObserver;
  try {
    observer = new IntersectionObserver((entries) => {
      if (destroyed) return;
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (!observed.has(element)) continue;
        if (entry.isIntersecting) {
          if (inside.has(element)) continue;
          inside.add(element);
          try {
            onEnter?.(element, entry);
          } finally {
            if (once && onLeave === undefined) {
              observer.unobserve(element);
              observed.delete(element);
            }
          }
          continue;
        }

        if (!inside.delete(element)) continue;
        try {
          onLeave?.(element, entry);
        } finally {
          if (once) {
            observer.unobserve(element);
            observed.delete(element);
          }
        }
      }
    }, { rootMargin, threshold });
  } catch (error) {
    throw new Error("scrollTrigger() could not create an IntersectionObserver", { cause: error });
  }

  for (const element of elements) {
    try {
      observer.observe(element);
      observed.add(element);
    } catch (error) {
      observer.disconnect();
      throw error;
    }
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      observed.clear();
      inside.clear();
    },
  };
}
