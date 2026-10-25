import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { removeTransformLayer, setTransformLayer } from "../core/transform.js";

export type ParallaxAxis = "x" | "y";

export interface ParallaxOptions {
  /**
   * Fraction of the element's distance from the viewport center that is added as a translation.
   * Positive values make the layer move slower than the page, negative values faster. May be 0.
   * Defaults to 0.3.
   */
  speed?: number;
  /** Axis to translate along. Defaults to "y". */
  axis?: ParallaxAxis;
  /** Maximum absolute translation in pixels. Must be >= 0. Defaults to 100. */
  maxOffset?: number;
  /** Shapes the clamped offset: `easing(|offset| / maxOffset)`. Defaults to linear. */
  easing?: EasingFunction;
}

export interface ParallaxControls {
  /** Removes listeners, cancels the pending frame and restores original transforms. Safe to call repeatedly. */
  destroy(): void;
}

interface ParallaxState {
  /** Element center along the axis in page coordinates, measured at rest. */
  pageCenter: number;
  written: boolean;
  offset: number;
}

const DEFAULT_SPEED = 0.3;
const DEFAULT_MAX_OFFSET_PX = 100;

const linear: EasingFunction = (progress) => progress;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Moves elements along one axis as the page scrolls, relative to the viewport center.
 *
 * - An element's offset is `-(elementCenter - viewportCenter) * speed`, clamped to `maxOffset` and
 *   shaped by `easing`. It is 0 when the element is centered in the viewport.
 * - One passive `scroll` listener and one `requestAnimationFrame` serve every element; at most one
 *   frame is pending, and nothing runs while the page is idle.
 * - Layout is read only when the effect starts, on `resize`, and when reduced motion is turned
 *   back off - never on scroll. Each element's resting position is cached in page coordinates
 *   (measured with its original transform in place), so scroll frames are pure arithmetic.
 *   Layout shifts that don't fire `resize` are not noticed until the next resize.
 * - Styles are written only when the rounded offset changes. The effect writes only `transform`,
 *   as `<original> translate(x, y)`, where the original is the inline transform, or the computed
 *   transform when no inline one is set. An element that never needs to move is never written to.
 * - Reduced motion (checked every frame and watched through `matchMedia` change events) restores
 *   every original transform and keeps the effect inactive until the preference is turned off.
 * - Throws `Error` when `window` or `requestAnimationFrame` is unavailable, `RangeError` for invalid
 *   numbers, `TypeError` for an invalid axis or easing, and the same selector/target errors as
 *   `animate()`. A target matching no elements returns inert controls.
 */
export function parallax(target: AnimateTarget, options: ParallaxOptions = {}): ParallaxControls {
  const {
    speed = DEFAULT_SPEED,
    axis = "y",
    maxOffset = DEFAULT_MAX_OFFSET_PX,
    easing = linear,
  } = options;

  if (typeof speed !== "number" || !Number.isFinite(speed)) {
    throw new RangeError(`speed must be a finite number, received ${String(speed)}`);
  }
  if (typeof maxOffset !== "number" || !Number.isFinite(maxOffset) || maxOffset < 0) {
    throw new RangeError(`maxOffset must be a finite number >= 0, received ${String(maxOffset)}`);
  }
  if (axis !== "x" && axis !== "y") {
    throw new TypeError(`axis must be "x" or "y", received ${String(axis)}`);
  }
  if (typeof easing !== "function") {
    throw new TypeError("easing must be a function");
  }

  if (typeof window === "undefined" || typeof requestAnimationFrame !== "function") {
    throw new Error("parallax() requires window and requestAnimationFrame, which are not available in this environment");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states = new Map<HTMLElement, ParallaxState>();
  for (const element of elements) {
    states.set(element, { pageCenter: 0, written: false, offset: 0 });
  }

  let frameId: number | null = null;
  let needsMeasure = true;
  let destroyed = false;

  const transformFor = (state: ParallaxState): string =>
    axis === "y" ? `translate(0px, ${state.offset}px)` : `translate(${state.offset}px, 0px)`;

  const restore = (element: HTMLElement, state: ParallaxState): void => {
    if (!state.written) return;
    removeTransformLayer(element, state);
    state.written = false;
    state.offset = 0;
  };

  const measureAll = (): void => {
    // Phase 1: clear our own layer; phase 2: read; phase 3: re-apply - one layout flush, not one per element.
    const reapply: Array<[HTMLElement, ParallaxState]> = [];
    for (const [element, state] of states) {
      if (!state.written) continue;
      setTransformLayer(element, state, "");
      reapply.push([element, state]);
    }

    const scrollX = window.scrollX ?? 0;
    const scrollY = window.scrollY ?? 0;
    for (const [element, state] of states) {
      const rect = element.getBoundingClientRect();
      state.pageCenter =
        axis === "y" ? rect.top + rect.height / 2 + scrollY : rect.left + rect.width / 2 + scrollX;
    }

    for (const [element, state] of reapply) {
      setTransformLayer(element, state, transformFor(state));
    }
    needsMeasure = false;
  };

  const offsetFor = (state: ParallaxState, scroll: number, viewportSize: number): number => {
    if (maxOffset === 0) return 0;
    const distanceFromCenter = state.pageCenter - scroll - viewportSize / 2;
    const raw = -distanceFromCenter * speed;
    const magnitude = Math.min(Math.abs(raw) / maxOffset, 1);
    const eased = easing(magnitude);
    if (!Number.isFinite(eased)) return state.offset;
    return round(Math.sign(raw) * eased * maxOffset) + 0;
  };

  const update = (): void => {
    if (destroyed) return;

    if (prefersReducedMotion()) {
      for (const [element, state] of states) restore(element, state);
      needsMeasure = true;
      return;
    }

    if (needsMeasure) measureAll();

    const scroll = axis === "y" ? (window.scrollY ?? 0) : (window.scrollX ?? 0);
    const viewportSize = (axis === "y" ? window.innerHeight : window.innerWidth) || 0;

    for (const [element, state] of states) {
      const offset = offsetFor(state, scroll, viewportSize);
      if (offset === state.offset) continue;
      state.written = true;
      state.offset = offset;
      setTransformLayer(element, state, transformFor(state));
    }
  };

  const schedule = (): void => {
    if (destroyed || frameId !== null) return;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      update();
    });
  };

  const onScroll = (): void => schedule();
  const onResize = (): void => {
    needsMeasure = true;
    schedule();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  const stopPreferenceEvents = onReducedMotionChange(() => {
    needsMeasure = true;
    update();
  });

  update();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      stopPreferenceEvents();
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      for (const [element, state] of states) restore(element, state);
      states.clear();
    },
  };
}
