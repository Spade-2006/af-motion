import { scrollTrigger } from "./scroll-trigger.js";
import type { ScrollTriggerOptions } from "./scroll-trigger.js";
import type { AnimateTarget } from "../core/animate.js";

export type InViewCleanup = () => void;

export type InViewCallback = (
  element: HTMLElement,
  entry: IntersectionObserverEntry,
) => void | InViewCleanup;

export type InViewOptions = Pick<ScrollTriggerOptions, "rootMargin" | "threshold" | "once">;

export interface InViewControls {
  /** Stops observing targets and runs cleanup for every currently visible target. */
  destroy(): void;
}

/**
 * Runs a callback when a target enters the viewport, and its optional cleanup when
 * that target leaves or the observer is destroyed.
 */
export function inView(
  target: AnimateTarget,
  callback: InViewCallback,
  options: InViewOptions = {},
): InViewControls {
  if (typeof callback !== "function") {
    throw new TypeError("inView() callback must be a function");
  }

  const cleanups = new Map<HTMLElement, InViewCleanup>();
  let destroyed = false;

  const trigger = scrollTrigger(target, {
    ...options,
    onEnter: (element, entry) => {
      if (destroyed) return;
      const cleanup = callback(element, entry);
      if (typeof cleanup === "function") cleanups.set(element, cleanup);
    },
    onLeave: (element) => {
      const cleanup = cleanups.get(element);
      cleanups.delete(element);
      cleanup?.();
    },
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      trigger.destroy();
      const pendingCleanups = [...cleanups.values()];
      cleanups.clear();
      for (const cleanup of pendingCleanups) cleanup();
    },
  };
}
