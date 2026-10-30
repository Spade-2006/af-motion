import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type ScrollVelocityDirection = "up" | "down" | "idle";

export interface ScrollVelocityData {
  /** Smoothed scroll velocity in pixels per second. */
  velocity: number;
  /** Direction of the latest scroll movement, or "idle" when position is unchanged. */
  direction: ScrollVelocityDirection;
  /** Current scroll position in pixels. */
  position: number;
  /** Current normalized scroll position from 0 to 1. */
  progress: number;
}

export interface ScrollVelocityOptions {
  /** Fraction of the previous velocity retained per update, from 0 (no smoothing) to 1 (maximum smoothing). Defaults to 0.2. */
  smoothing?: number;
  /** Window, an element, or a selector resolving to exactly one scrollable element. Defaults to window. */
  target?: Window | AnimateTarget;
  /** Receives scroll measurements after each scheduled update and the initial state, including decay frames after scrolling stops until velocity settles at 0. */
  onUpdate: (data: ScrollVelocityData) => void;
}

export interface ScrollVelocityControls {
  /** Cancels pending measurements and removes listeners. Safe to call repeatedly. */
  destroy(): void;
}

const DEFAULT_SMOOTHING = 0.2;
const MAX_VELOCITY_PX_PER_SECOND = 10_000;
const SETTLED_VELOCITY_PX_PER_SECOND = 0.5;

interface ScrollMetrics {
  position: number;
  maximum: number;
}

function validateSmoothing(smoothing: number): void {
  if (typeof smoothing !== "number" || !Number.isFinite(smoothing) || smoothing < 0 || smoothing > 1) {
    throw new RangeError(`smoothing must be a finite number between 0 and 1, received ${String(smoothing)}`);
  }
}

function measureWindowScroll(): ScrollMetrics {
  const root = document.documentElement;
  const body = document.body;
  const position = window.scrollY ?? window.pageYOffset ?? root.scrollTop ?? body?.scrollTop ?? 0;
  const height = Math.max(root.scrollHeight, body?.scrollHeight ?? 0);
  const viewport = window.innerHeight || root.clientHeight;
  return { position, maximum: Math.max(0, height - viewport) };
}

function measureElementScroll(element: HTMLElement): ScrollMetrics {
  return {
    position: element.scrollTop,
    maximum: Math.max(0, element.scrollHeight - element.clientHeight),
  };
}

function progressOf(metrics: ScrollMetrics): number {
  if (!Number.isFinite(metrics.position) || !Number.isFinite(metrics.maximum) || metrics.maximum <= 0) return 0;
  return Math.min(Math.max(metrics.position / metrics.maximum, 0), 1);
}

/**
 * Tracks scroll direction, normalized progress, and smoothed velocity in px/s.
 * Scroll events are passively observed and measurements are batched through requestAnimationFrame.
 */
export function scrollVelocity(options: ScrollVelocityOptions): ScrollVelocityControls {
  if (options === null || typeof options !== "object") {
    throw new TypeError("options must be an object");
  }
  const {
    smoothing = DEFAULT_SMOOTHING,
    target,
    onUpdate,
  } = options;
  validateSmoothing(smoothing);
  if (typeof onUpdate !== "function") {
    throw new TypeError("onUpdate must be a function");
  }

  let scrollElement: HTMLElement | null = null;
  let windowTarget: Window;
  if (target === undefined) {
    if (typeof window === "undefined") {
      throw new Error("scrollVelocity() requires window when no target is provided");
    }
    windowTarget = window;
  } else if (typeof Window !== "undefined" && target instanceof Window) {
    windowTarget = target;
  } else {
    const elements = resolveTargets(target as AnimateTarget);
    if (elements.length > 1) {
      throw new RangeError("scrollVelocity() target must resolve to exactly one element");
    }
    scrollElement = elements[0] ?? null;
    if (!scrollElement) return { destroy: () => undefined };
    windowTarget = typeof window === "undefined" ? ({} as Window) : window;
  }

  if (!scrollElement && (typeof document === "undefined" || !document.documentElement)) {
    throw new Error("scrollVelocity() requires document scrolling metrics");
  }
  if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") {
    throw new Error("scrollVelocity() requires requestAnimationFrame and cancelAnimationFrame");
  }

  let reducedMotion = prefersReducedMotion();
  let destroyed = false;
  let frameId: number | null = null;
  let lastPosition: number | null = null;
  let lastTime: number | null = null;
  let smoothedVelocity = 0;

  const readMetrics = (): ScrollMetrics =>
    scrollElement ? measureElementScroll(scrollElement) : measureWindowScroll();

  const update = (time: number): void => {
    frameId = null;
    if (destroyed) return;
    const measured = readMetrics();
    const metrics: ScrollMetrics = {
      position: Number.isFinite(measured.position) ? measured.position : lastPosition ?? 0,
      maximum: Number.isFinite(measured.maximum) ? Math.max(0, measured.maximum) : 0,
    };
    const direction: ScrollVelocityDirection =
      lastPosition === null || metrics.position === lastPosition
        ? "idle"
        : metrics.position > lastPosition
          ? "down"
          : "up";
    let rawVelocity = 0;
    if (lastPosition !== null && lastTime !== null && Number.isFinite(time) && time > lastTime) {
      rawVelocity = ((metrics.position - lastPosition) / (time - lastTime)) * 1000;
      rawVelocity = Math.min(Math.max(rawVelocity, -MAX_VELOCITY_PX_PER_SECOND), MAX_VELOCITY_PX_PER_SECOND);
    }
    const retention = smoothing;
    smoothedVelocity = rawVelocity * (1 - retention) + smoothedVelocity * retention;
    // Without further scroll events velocity decays frame by frame until it settles at exactly 0.
    if (Math.abs(smoothedVelocity) < SETTLED_VELOCITY_PX_PER_SECOND || (direction === "idle" && retention >= 1)) {
      smoothedVelocity = 0;
    }
    lastPosition = metrics.position;
    if (Number.isFinite(time) && (lastTime === null || time > lastTime)) lastTime = time;
    onUpdate({
      velocity: reducedMotion ? 0 : smoothedVelocity,
      direction,
      position: metrics.position,
      progress: progressOf(metrics),
    });
    if (smoothedVelocity !== 0 && !reducedMotion) scheduleUpdate();
  };

  const scheduleUpdate = (): void => {
    if (destroyed || frameId !== null) return;
    frameId = requestAnimationFrame(update);
  };
  const eventTarget: Window | HTMLElement = scrollElement ?? windowTarget;
  eventTarget.addEventListener("scroll", scheduleUpdate, { passive: true });

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    if (reduced) smoothedVelocity = 0;
    scheduleUpdate();
  });

  try {
    update(typeof performance !== "undefined" ? performance.now() : 0);
  } catch (error) {
    destroyed = true;
    stopPreferenceListener();
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    eventTarget.removeEventListener("scroll", scheduleUpdate);
    throw error;
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      eventTarget.removeEventListener("scroll", scheduleUpdate);
    },
  };
}
