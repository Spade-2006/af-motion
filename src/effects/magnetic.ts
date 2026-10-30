import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { animateProgress } from "../core/animation.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { removeTransformLayer, setTransformLayer } from "../core/transform.js";
import { easeOutCubic } from "../easing/easings.js";

export interface MagneticOptions {
  /** Fraction of the cursor's distance from the element's center to follow. Defaults to 0.25. */
  strength?: number;
  /** Maximum translation per axis, in pixels. Defaults to 12. */
  maxTranslate?: number;
  /** Maximum pointer distance from the element center to apply attraction. Defaults to unlimited. */
  distance?: number;
  /** Duration of each movement tween in milliseconds. Defaults to 200. */
  duration?: number;
  /** Defaults to `easings.easeOutCubic`. */
  easing?: EasingFunction;
}

export interface MagneticControls {
  /** Removes listeners, cancels animations and restores original transforms. Safe to call repeatedly. */
  destroy(): void;
}

interface MagneticState {
  engaged: boolean;
  /** Whether this effect currently owns a transform layer on the element. */
  applied: boolean;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  tween: AnimationControls | null;
}

const DEFAULT_STRENGTH = 0.25;
const DEFAULT_MAX_TRANSLATE_PX = 12;
const DEFAULT_DURATION_MS = 200;
function assertNonNegativeFinite(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

function clamp(value: number, limit: number): number {
  return Math.min(Math.max(value, -limit), limit);
}

/**
 * Makes elements drift toward the cursor while it hovers them, then settle back.
 *
 * - The movement is appended to the element's existing transform (`<base> translate(x, y)`).
 *   The base is the inline transform, or the computed one when no inline transform is set
 *   (read once per hover, never per frame).
 * - The element's bounding box is measured once when the pointer enters. Pointer moves only
 *   do arithmetic and start a short tween from the current offset, so there are no layout
 *   reads per move or per frame. If the page scrolls or layout changes during a hover, the
 *   center is re-measured on the next enter.
 * - On leave the element tweens back to rest, then its original inline transform is restored
 *   exactly (or removed if there was none). Other inline styles are never touched.
 * - Reduced motion (checked on every pointer event) disables the effect entirely; an element
 *   that is mid-hover when the preference turns on settles back to rest. Touch pointers are ignored.
 * - Throws `RangeError` for invalid numbers, `TypeError` for a non-function easing, and the
 *   same selector/target errors as `animate()`. A target matching no elements returns inert controls.
 */
export function magnetic(target: AnimateTarget, options: MagneticOptions = {}): MagneticControls {
  const {
    strength = DEFAULT_STRENGTH,
    maxTranslate = DEFAULT_MAX_TRANSLATE_PX,
    duration = DEFAULT_DURATION_MS,
    easing = easeOutCubic,
  } = options;
  const distance = options.distance ?? Number.POSITIVE_INFINITY;

  assertNonNegativeFinite("strength", strength);
  assertNonNegativeFinite("maxTranslate", maxTranslate);
  if (options.distance !== undefined) assertNonNegativeFinite("distance", distance);
  assertNonNegativeFinite("duration", duration);
  if (typeof easing !== "function") {
    throw new TypeError("easing must be a function");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states = new Map<HTMLElement, MagneticState>();
  const cleanups: Array<() => void> = [];
  let destroyed = false;

  const render = (element: HTMLElement, state: MagneticState): void => {
    state.applied = true;
    setTransformLayer(element, state, `translate(${state.x}px, ${state.y}px)`);
  };

  const restore = (element: HTMLElement, state: MagneticState): void => {
    if (!state.applied) return;
    removeTransformLayer(element, state);
    state.applied = false;
    state.x = 0;
    state.y = 0;
  };

  const moveTo = (element: HTMLElement, state: MagneticState, x: number, y: number, settle: boolean): void => {
    state.tween?.cancel();
    state.tween = null;

    if (state.x === x && state.y === y) {
      if (settle) restore(element, state);
      return;
    }

    const fromX = state.x;
    const fromY = state.y;
    const tween = animateProgress({
      duration,
      easing,
      onUpdate: (progress) => {
        state.x = fromX + (x - fromX) * progress;
        state.y = fromY + (y - fromY) * progress;
        render(element, state);
      },
      onComplete: () => {
        if (state.tween === tween) state.tween = null;
        if (settle) restore(element, state);
      },
    });
    state.tween = tween;
  };

  const engage = (element: HTMLElement, state: MagneticState): void => {
    const rect = element.getBoundingClientRect();
    // Remove any in-flight offset so the center is the element's resting center.
    state.centerX = rect.left + rect.width / 2 - state.x;
    state.centerY = rect.top + rect.height / 2 - state.y;
    state.engaged = true;
  };

  const disengage = (element: HTMLElement, state: MagneticState): void => {
    if (!state.engaged) return;
    state.engaged = false;
    moveTo(element, state, 0, 0, true);
  };

  const reset = (element: HTMLElement, state: MagneticState): void => {
    state.tween?.cancel();
    state.tween = null;
    state.engaged = false;
    restore(element, state);
  };

  const shouldIgnore = (event: PointerEvent): boolean => event.pointerType === "touch";

  for (const element of elements) {
    const state: MagneticState = {
      engaged: false,
      applied: false,
      x: 0,
      y: 0,
      centerX: 0,
      centerY: 0,
      tween: null,
    };
    states.set(element, state);

    const onEnter = (event: Event): void => {
      if (destroyed || shouldIgnore(event as PointerEvent) || prefersReducedMotion()) return;
      engage(element, state);
    };

    const onMove = (event: Event): void => {
      const pointer = event as PointerEvent;
      if (destroyed || shouldIgnore(pointer)) return;
      if (prefersReducedMotion()) {
        reset(element, state);
        return;
      }
      if (!state.engaged) engage(element, state);
      const offsetX = pointer.clientX - state.centerX;
      const offsetY = pointer.clientY - state.centerY;
      if (Math.hypot(offsetX, offsetY) > distance) {
        state.engaged = false;
        moveTo(element, state, 0, 0, true);
        return;
      }
      moveTo(
        element,
        state,
        clamp(offsetX * strength, maxTranslate),
        clamp(offsetY * strength, maxTranslate),
        false,
      );
    };

    const onLeave = (): void => {
      if (!destroyed) disengage(element, state);
    };

    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("pointercancel", onLeave);
    cleanups.push(() => {
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("pointercancel", onLeave);
    });
  }

  cleanups.push(
    onReducedMotionChange((reduced) => {
      if (destroyed || !reduced) return;
      for (const [element, state] of states) reset(element, state);
    }),
  );

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      for (const cleanup of cleanups) cleanup();
      for (const [element, state] of states) reset(element, state);
      states.clear();
    },
  };
}

/** Alias for `magnetic()` with the same strength, translation, and distance options. */
export const magneticElement = magnetic;
export type MagneticElementOptions = MagneticOptions;
export type MagneticElementControls = MagneticControls;
