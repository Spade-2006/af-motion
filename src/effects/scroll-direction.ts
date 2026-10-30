import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export type ScrollDirection = "up" | "down" | "idle";

export interface ScrollDirectionOptions {
  /** Minimum accumulated scroll movement in pixels before changing direction. Defaults to 12. */
  threshold?: number;
  /** Window, an element, or a selector resolving to exactly one scrollable element. Defaults to window. */
  target?: Window | AnimateTarget;
  /** Called only when the detected direction changes. */
  onChange: (direction: ScrollDirection) => void;
}

export interface ScrollDirectionControls {
  /** Cancels a pending measurement and removes the scroll listener. Safe to call repeatedly. */
  destroy(): void;
}

const DEFAULT_THRESHOLD = 12;

function validateThreshold(threshold: number): void {
  if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold < 0) {
    throw new RangeError(`threshold must be a finite number >= 0, received ${String(threshold)}`);
  }
}

function readScrollPosition(target: Window | HTMLElement): number {
  if (typeof Window !== "undefined" && target instanceof Window) {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(0, target.scrollY ?? target.pageYOffset ?? root.scrollTop ?? body?.scrollTop ?? 0);
  }
  return Math.max(0, (target as HTMLElement).scrollTop);
}

/**
 * Detects scroll direction only after movement crosses a pixel threshold.
 * Passive events are batched into one animation frame, and no animation is created.
 */
export function scrollDirection(options: ScrollDirectionOptions): ScrollDirectionControls {
  if (options === null || typeof options !== "object") {
    throw new TypeError("options must be an object");
  }
  const {
    threshold = DEFAULT_THRESHOLD,
    target,
    onChange,
  } = options;
  validateThreshold(threshold);
  if (typeof onChange !== "function") {
    throw new TypeError("onChange must be a function");
  }

  let scrollTarget: HTMLElement | null = null;
  let windowTarget: Window;
  if (target === undefined) {
    if (typeof window === "undefined") {
      throw new Error("scrollDirection() requires window when no target is provided");
    }
    windowTarget = window;
  } else if (typeof Window !== "undefined" && target instanceof Window) {
    windowTarget = target;
  } else {
    const elements = resolveTargets(target as AnimateTarget);
    if (elements.length > 1) {
      throw new RangeError("scrollDirection() target must resolve to exactly one element");
    }
    scrollTarget = elements[0] ?? null;
    if (!scrollTarget) return { destroy: () => undefined };
    windowTarget = typeof window === "undefined" ? ({} as Window) : window;
  }

  if (!scrollTarget && typeof document === "undefined") {
    throw new Error("scrollDirection() requires document scroll metrics");
  }
  if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") {
    throw new Error("scrollDirection() requires requestAnimationFrame and cancelAnimationFrame");
  }

  const eventTarget: Window | HTMLElement = scrollTarget ?? windowTarget;
  let destroyed = false;
  let frameId: number | null = null;
  let anchorPosition = readScrollPosition(eventTarget);
  let direction: ScrollDirection = "idle";

  const update = (): void => {
    frameId = null;
    if (destroyed) return;

    const position = readScrollPosition(eventTarget);
    if (position <= threshold && direction !== "idle") {
      anchorPosition = position;
      direction = "idle";
      onChange(direction);
      return;
    }

    const delta = position - anchorPosition;
    if (Math.abs(delta) < threshold || (threshold === 0 && delta === 0)) return;

    anchorPosition = position;
    const nextDirection: ScrollDirection = delta > 0 ? "down" : "up";
    if (nextDirection === direction) return;
    direction = nextDirection;
    onChange(direction);
  };

  const scheduleUpdate = (): void => {
    if (destroyed || frameId !== null) return;
    frameId = requestAnimationFrame(update);
  };

  eventTarget.addEventListener("scroll", scheduleUpdate, { passive: true });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      eventTarget.removeEventListener("scroll", scheduleUpdate);
    },
  };
}
