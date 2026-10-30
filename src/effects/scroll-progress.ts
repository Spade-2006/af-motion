import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type ScrollProgressPosition = "top" | "bottom";

export interface ScrollProgressOptions {
  /** Viewport edge for the fixed bar. Defaults to "top". */
  position?: ScrollProgressPosition;
  /** Bar color. Defaults to violet. */
  color?: string;
  /** Bar thickness in pixels. Must be > 0. Defaults to 3. */
  height?: number;
  /** CSS transition smoothing duration in seconds. Must be between 0 and 2. Defaults to 0.15. */
  smoothing?: number;
  /** Alias for smoothing, matching the original API example. */
  easing?: number;
  /** Scrollable element (or selector resolving to exactly one element) to track instead of the page. */
  target?: AnimateTarget;
  /** Called when the measured normalized scroll progress changes. */
  onUpdate?: (progress: number) => void;
}

export interface ScrollProgressControls {
  /** Returns the latest measured normalized scroll progress. */
  getProgress(): number;
  /** Cancels pending updates, removes listeners and the generated bar. Safe to repeat. */
  destroy(): void;
}

const DEFAULT_POSITION: ScrollProgressPosition = "top";
const DEFAULT_COLOR = "#8b5cf6";
const DEFAULT_HEIGHT = 3;
const DEFAULT_SMOOTHING = 0.15;

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function validatePositive(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0, received ${String(value)}`);
  }
}

function validateSmoothing(value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 2) {
    throw new RangeError(`smoothing must be a finite number between 0 and 2, received ${String(value)}`);
  }
}

function pageMetrics(): { position: number; maximum: number } {
  const root = document.documentElement;
  const body = document.body;
  const scrollTop = typeof window.scrollY === "number"
    ? window.scrollY
    : root.scrollTop || body?.scrollTop || 0;
  const scrollHeight = Math.max(root.scrollHeight, body?.scrollHeight ?? 0);
  const viewportHeight = window.innerHeight || root.clientHeight;
  return { position: scrollTop, maximum: Math.max(0, scrollHeight - viewportHeight) };
}

function elementMetrics(element: HTMLElement): { position: number; maximum: number } {
  return {
    position: element.scrollTop,
    maximum: Math.max(0, element.scrollHeight - element.clientHeight),
  };
}

/**
 * Displays page or element scroll progress in a fixed bar. Scroll/resize events are batched
 * into at most one animation frame; reduced motion updates the bar immediately.
 */
export function scrollProgress(options: ScrollProgressOptions = {}): ScrollProgressControls {
  const {
    position = DEFAULT_POSITION,
    color = DEFAULT_COLOR,
    height = DEFAULT_HEIGHT,
    smoothing: smoothingOption,
    easing,
    target,
    onUpdate,
  } = options;
  const smoothing = smoothingOption ?? easing ?? DEFAULT_SMOOTHING;

  if (onUpdate !== undefined && typeof onUpdate !== "function") {
    throw new TypeError("onUpdate must be a function");
  }
  if (position !== "top" && position !== "bottom") {
    throw new TypeError(`position must be "top" or "bottom", received ${String(position)}`);
  }
  validateColor(color);
  validatePositive("height", height);
  if (smoothingOption !== undefined) validateSmoothing(smoothingOption);
  if (easing !== undefined) validateSmoothing(easing);

  let scrollTarget: HTMLElement | null = null;
  if (target !== undefined) {
    const targets = resolveTargets(target);
    if (targets.length > 1) {
      throw new RangeError("scrollProgress() target must resolve to exactly one element");
    }
    scrollTarget = targets[0] ?? null;
    if (!scrollTarget) return { getProgress: () => 0, destroy: () => undefined };
  }

  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("scrollProgress() requires document.createElement, which is not available in this environment");
  }
  if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") {
    throw new Error("scrollProgress() requires requestAnimationFrame and cancelAnimationFrame");
  }
  if (typeof window === "undefined" && !scrollTarget) {
    throw new Error("scrollProgress() requires window when tracking page scroll");
  }

  const bar = document.createElement("div");
  bar.setAttribute("aria-hidden", "true");
  bar.style.setProperty("position", "fixed");
  bar.style.setProperty(position, "0");
  bar.style.setProperty("left", "0");
  bar.style.setProperty("right", "0");
  bar.style.setProperty("height", `${height}px`);
  bar.style.setProperty("z-index", "2147483647");
  bar.style.setProperty("pointer-events", "none");
  bar.style.setProperty("transform", "scaleX(0)");
  bar.style.setProperty("transform-origin", "left center");
  bar.style.setProperty("background-color", color);

  let reducedMotion = prefersReducedMotion();
  const updateTransition = (): void => {
    bar.style.setProperty("transition", reducedMotion || smoothing === 0
      ? "none"
      : `transform ${smoothing}s ease-out`);
  };
  updateTransition();

  const parent = document.body ?? document.documentElement;
  if (!parent) throw new Error("scrollProgress() requires a document body or document element");

  let destroyed = false;
  let frameId: number | null = null;
  let latestProgress = 0;
  let currentProgress = 0;
  let hasPublishedProgress = false;

  const readProgress = (): number => {
    const metrics = scrollTarget ? elementMetrics(scrollTarget) : pageMetrics();
    return metrics.maximum === 0 ? 0 : Math.min(Math.max(metrics.position / metrics.maximum, 0), 1);
  };
  const render = (progress: number): void => {
    if (destroyed) return;
    bar.style.setProperty("transform", `scaleX(${progress})`);
  };
  const publishProgress = (progress: number): void => {
    latestProgress = progress;
    if (hasPublishedProgress && progress === currentProgress) return;
    currentProgress = progress;
    hasPublishedProgress = true;
    render(progress);
    onUpdate?.(progress);
  };
  const updateImmediately = (): void => {
    if (destroyed) return;
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    publishProgress(readProgress());
  };
  const scheduleUpdate = (): void => {
    if (destroyed) return;
    if (reducedMotion) {
      updateImmediately();
      return;
    }
    latestProgress = readProgress();
    if (frameId !== null) return;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      publishProgress(latestProgress);
    });
  };

  parent.appendChild(bar);
  const eventTarget = scrollTarget ?? window;
  eventTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
  // Container metrics change with content or layout size, which never fires a scroll event.
  let resizeObserver: ResizeObserver | null = null;
  if (!scrollTarget) {
    window.addEventListener("resize", scheduleUpdate, { passive: true });
  } else if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(scrollTarget);
    for (const child of Array.from(scrollTarget.children ?? [])) resizeObserver.observe(child);
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    updateTransition();
    updateImmediately();
  });

  try {
    updateImmediately();
  } catch (error) {
    stopPreferenceListener();
    resizeObserver?.disconnect();
    eventTarget.removeEventListener("scroll", scheduleUpdate);
    if (!scrollTarget) window.removeEventListener("resize", scheduleUpdate);
    if (bar.parentElement === parent) parent.removeChild(bar);
    throw error;
  }

  return {
    getProgress: () => latestProgress,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      resizeObserver?.disconnect();
      eventTarget.removeEventListener("scroll", scheduleUpdate);
      if (!scrollTarget) window.removeEventListener("resize", scheduleUpdate);
      if (bar.parentElement === parent) parent.removeChild(bar);
    },
  };
}
