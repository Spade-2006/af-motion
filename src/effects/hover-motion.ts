import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { animateProgress } from "../core/animation.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { removeTransformLayer, setTransformLayer } from "../core/transform.js";
import { easeOutCubic } from "../easing/easings.js";

export interface HoverMotionValues {
  /** Horizontal translation in pixels. Defaults to 0. */
  x?: number;
  /** Vertical translation in pixels. Defaults to 0. */
  y?: number;
  /** Scale multiplier. Defaults to 1. */
  scale?: number;
  /** Rotation in degrees. Defaults to 0. */
  rotate?: number;
}

export interface HoverMotionOptions {
  /** Transform layer applied while the pointer is over an element. */
  enter?: HoverMotionValues;
  /** Transform layer applied after leaving; a custom pose remains until re-entry or destroy. */
  leave?: HoverMotionValues;
  /** Transition duration in milliseconds. Defaults to 220. */
  duration?: number;
  /** Defaults to `easings.easeOutCubic`. */
  easing?: EasingFunction;
}

export interface HoverMotionControls {
  /** Removes listeners, cancels active transitions, and restores original transforms. */
  destroy(): void;
}

interface MotionValues {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

interface HoverState {
  current: MotionValues;
  target: MotionValues;
  applied: boolean;
  pointerActive: boolean;
  focusActive: boolean;
  tween: AnimationControls | null;
}

const NEUTRAL: MotionValues = { x: 0, y: 0, scale: 1, rotate: 0 };
const DEFAULT_DURATION = 220;

function resolveValues(values: HoverMotionValues | undefined, name: string): MotionValues {
  const result = {
    x: values?.x ?? 0,
    y: values?.y ?? 0,
    scale: values?.scale ?? 1,
    rotate: values?.rotate ?? 0,
  };
  for (const [property, value] of Object.entries(result)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new RangeError(`${name}.${property} must be a finite number, received ${String(value)}`);
    }
  }
  if (result.scale <= 0) throw new RangeError(`${name}.scale must be greater than 0`);
  return result;
}

function sameValues(left: MotionValues, right: MotionValues): boolean {
  return left.x === right.x && left.y === right.y && left.scale === right.scale && left.rotate === right.rotate;
}

function transformFor(values: MotionValues): string {
  return `translate(${values.x}px, ${values.y}px) scale(${values.scale}) rotate(${values.rotate}deg)`;
}

/**
 * Animates a composable transform layer on pointer enter/leave and keyboard focus/blur.
 * Mouse and pen pointers are supported; touch and reduced-motion preferences leave elements
 * at their resting state.
 */
export function hoverMotion(target: AnimateTarget, options: HoverMotionOptions = {}): HoverMotionControls {
  const {
    duration = DEFAULT_DURATION,
    easing = easeOutCubic,
  } = options;
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration < 0) {
    throw new RangeError(`duration must be a finite number >= 0, received ${String(duration)}`);
  }
  if (typeof easing !== "function") throw new TypeError("easing must be a function");

  const enterValues = resolveValues(options.enter, "enter");
  const leaveValues = resolveValues(options.leave, "leave");
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states = new Map<HTMLElement, HoverState>();
  const cleanups: Array<() => void> = [];
  let destroyed = false;
  let reducedMotion = prefersReducedMotion();

  const render = (element: HTMLElement, state: HoverState): void => {
    if (sameValues(state.current, NEUTRAL)) {
      if (state.applied) removeTransformLayer(element, state);
      state.applied = false;
      return;
    }
    state.applied = true;
    setTransformLayer(element, state, transformFor(state.current));
  };

  const moveTo = (element: HTMLElement, state: HoverState, targetValues: MotionValues): void => {
    if (sameValues(state.target, targetValues)) return;
    state.target = { ...targetValues };
    state.tween?.cancel();
    state.tween = null;
    if (reducedMotion || duration === 0 || sameValues(state.current, targetValues)) {
      state.current = { ...targetValues };
      render(element, state);
      return;
    }

    const from = { ...state.current };
    let tween: AnimationControls;
    tween = animateProgress({
      duration,
      easing,
      respectReducedMotion: false,
      onUpdate: (progress) => {
        state.current = {
          x: from.x + (targetValues.x - from.x) * progress,
          y: from.y + (targetValues.y - from.y) * progress,
          scale: from.scale + (targetValues.scale - from.scale) * progress,
          rotate: from.rotate + (targetValues.rotate - from.rotate) * progress,
        };
        render(element, state);
      },
      onComplete: () => {
        if (state.tween === tween) state.tween = null;
      },
    });
    state.tween = tween;
  };

  for (const element of elements) {
    const state: HoverState = {
      current: { ...NEUTRAL },
      target: { ...NEUTRAL },
      applied: false,
      pointerActive: false,
      focusActive: false,
      tween: null,
    };
    states.set(element, state);
    const updateTarget = (): void => {
      const active = state.pointerActive || state.focusActive;
      moveTo(element, state, reducedMotion ? NEUTRAL : active ? enterValues : leaveValues);
    };
    const onEnter = (event: PointerEvent): void => {
      if (destroyed || event.pointerType === "touch") return;
      state.pointerActive = true;
      updateTarget();
    };
    const onLeave = (event: PointerEvent): void => {
      if (destroyed || event.pointerType === "touch") return;
      state.pointerActive = false;
      updateTarget();
    };
    const onFocus = (): void => {
      if (destroyed) return;
      state.focusActive = true;
      updateTarget();
    };
    const onBlur = (): void => {
      if (destroyed) return;
      state.focusActive = false;
      updateTarget();
    };
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("pointercancel", onLeave);
    element.addEventListener("focus", onFocus);
    element.addEventListener("blur", onBlur);
    cleanups.push(() => {
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("pointercancel", onLeave);
      element.removeEventListener("focus", onFocus);
      element.removeEventListener("blur", onBlur);
    });
  }

  cleanups.push(onReducedMotionChange((reduced) => {
    if (reduced === reducedMotion) return;
    reducedMotion = reduced;
    if (destroyed) return;
    for (const [element, state] of states) {
      const active = state.pointerActive || state.focusActive;
      moveTo(element, state, reduced ? NEUTRAL : active ? enterValues : leaveValues);
    }
  }));

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      for (const cleanup of cleanups) cleanup();
      for (const [element, state] of states) {
        state.tween?.cancel();
        state.tween = null;
        state.current = { ...NEUTRAL };
        state.target = { ...NEUTRAL };
        render(element, state);
      }
      states.clear();
    },
  };
}
