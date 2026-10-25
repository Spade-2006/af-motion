import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { animateProgress } from "../core/animation.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { removeTransformLayer, setTransformLayer } from "../core/transform.js";
import { easeOutCubic } from "../easing/easings.js";

export interface TiltOptions {
  /** Maximum rotation per axis in degrees, reached at the element's edge. Defaults to 10. */
  maxTilt?: number;
  /** Perspective distance in pixels. Must be > 0. Defaults to 800. */
  perspective?: number;
  /** Scale while hovered. Must be > 0. Defaults to 1.02. */
  scale?: number;
  /** Duration of each tilt/reset tween in milliseconds. Defaults to 300. */
  speed?: number;
  /** Defaults to `easings.easeOutCubic`. */
  easing?: EasingFunction;
}

export interface TiltControls {
  /** Removes listeners, cancels animations and restores original styles. Safe to call repeatedly. */
  destroy(): void;
}

interface TiltState {
  engaged: boolean;
  /** True while the element is measured and may own a transform layer; cleared by `restore`. */
  captured: boolean;
  rotateX: number;
  rotateY: number;
  scale: number;
  halfWidth: number;
  halfHeight: number;
  centerX: number;
  centerY: number;
  tween: AnimationControls | null;
  targetKey: string;
}

const DEFAULT_MAX_TILT_DEG = 10;
const DEFAULT_PERSPECTIVE_PX = 800;
const DEFAULT_SCALE = 1.02;
const DEFAULT_SPEED_MS = 300;

function assertFiniteNumber(name: string, value: number, { allowZero }: { allowZero: boolean }): void {
  const isValid = typeof value === "number" && Number.isFinite(value) && (allowZero ? value >= 0 : value > 0);
  if (!isValid) {
    throw new RangeError(
      `${name} must be a finite number ${allowZero ? ">= 0" : "> 0"}, received ${String(value)}`,
    );
  }
}

function clampUnit(value: number): number {
  return Math.min(Math.max(value, -1), 1);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Tilts elements in 3D toward the cursor while it hovers them, then settles back.
 *
 * - Rotation is proportional to the cursor's offset from the element's center, normalised by
 *   half the element's size and clamped to [-1, 1]: `rotateY = x * maxTilt`, `rotateX = -y * maxTilt`.
 *   Hovering the element's top edge therefore tilts its top away from the viewer.
 * - Perspective is applied through the transform itself (`<base> perspective(Npx) rotateX() rotateY()
 *   scale()`, composed with other effects via shared transform layers), so no parent or perspective-related style is written, and `transform-origin`,
 *   `transform-style` and every other style are left untouched.
 * - The base is the inline transform, or the computed one when no inline transform is set.
 *   When a hover ends the original inline transform is restored exactly (or removed if there was
 *   none); `destroy()` does the same immediately.
 * - The element is measured once when a hover begins (not on moves or frames, and not when
 *   re-entering while still settling back). Each element runs at most one tween at a time; a new
 *   pointer position replaces it, starting from the current values, and an unchanged target is ignored.
 * - Reduced motion (checked on every pointer event and watched via `matchMedia` change events)
 *   disables the effect and immediately restores the neutral state. Touch pointers are ignored,
 *   and `pointercancel` behaves like `pointerleave`.
 * - Throws `RangeError` for invalid numbers, `TypeError` for a non-function easing, and the same
 *   selector/target errors as `animate()`. A target matching no elements returns inert controls.
 */
export function tilt(target: AnimateTarget, options: TiltOptions = {}): TiltControls {
  const {
    maxTilt = DEFAULT_MAX_TILT_DEG,
    perspective = DEFAULT_PERSPECTIVE_PX,
    scale = DEFAULT_SCALE,
    speed = DEFAULT_SPEED_MS,
    easing = easeOutCubic,
  } = options;

  assertFiniteNumber("maxTilt", maxTilt, { allowZero: true });
  assertFiniteNumber("perspective", perspective, { allowZero: false });
  assertFiniteNumber("scale", scale, { allowZero: false });
  assertFiniteNumber("speed", speed, { allowZero: true });
  if (typeof easing !== "function") {
    throw new TypeError("easing must be a function");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const states = new Map<HTMLElement, TiltState>();
  const cleanups: Array<() => void> = [];
  let destroyed = false;

  const render = (element: HTMLElement, state: TiltState): void => {
    setTransformLayer(
      element,
      state,
      `perspective(${perspective}px) rotateX(${round(state.rotateX)}deg) rotateY(${round(state.rotateY)}deg) scale(${round(state.scale)})`,
    );
  };

  const restore = (element: HTMLElement, state: TiltState): void => {
    if (!state.captured) return;
    removeTransformLayer(element, state);
    state.captured = false;
    state.rotateX = 0;
    state.rotateY = 0;
    state.scale = 1;
  };

  const reset = (element: HTMLElement, state: TiltState): void => {
    state.tween?.cancel();
    state.tween = null;
    state.targetKey = "";
    state.engaged = false;
    restore(element, state);
  };

  const tweenTo = (
    element: HTMLElement,
    state: TiltState,
    rotateX: number,
    rotateY: number,
    toScale: number,
    settle: boolean,
  ): void => {
    const key = `${rotateX}|${rotateY}|${toScale}|${settle}`;
    if (state.tween !== null && state.targetKey === key) return;

    state.tween?.cancel();
    state.tween = null;
    state.targetKey = "";

    if (state.rotateX === rotateX && state.rotateY === rotateY && state.scale === toScale) {
      if (settle) restore(element, state);
      return;
    }

    const fromX = state.rotateX;
    const fromY = state.rotateY;
    const fromScale = state.scale;
    const tween = animateProgress({
      duration: speed,
      easing,
      onUpdate: (progress) => {
        state.rotateX = fromX + (rotateX - fromX) * progress;
        state.rotateY = fromY + (rotateY - fromY) * progress;
        state.scale = fromScale + (toScale - fromScale) * progress;
        render(element, state);
      },
      onComplete: () => {
        if (state.tween !== tween) return;
        state.tween = null;
        state.targetKey = "";
        state.rotateX = rotateX;
        state.rotateY = rotateY;
        state.scale = toScale;
        if (settle) restore(element, state);
        else render(element, state);
      },
    });
    state.tween = tween;
    state.targetKey = key;
  };

  const engage = (element: HTMLElement, state: TiltState): void => {
    if (!state.captured) {
      state.captured = true;

      const rect = element.getBoundingClientRect();
      state.halfWidth = rect.width / 2;
      state.halfHeight = rect.height / 2;
      state.centerX = rect.left + state.halfWidth;
      state.centerY = rect.top + state.halfHeight;
    }
    state.engaged = true;
  };

  const track = (element: HTMLElement, state: TiltState, event: PointerEvent): void => {
    if (!state.engaged) engage(element, state);
    const x = state.halfWidth === 0 ? 0 : clampUnit((event.clientX - state.centerX) / state.halfWidth);
    const y = state.halfHeight === 0 ? 0 : clampUnit((event.clientY - state.centerY) / state.halfHeight);
    tweenTo(element, state, round(-y * maxTilt), round(x * maxTilt), scale, false);
  };

  const leave = (element: HTMLElement, state: TiltState): void => {
    if (!state.engaged) return;
    state.engaged = false;
    tweenTo(element, state, 0, 0, 1, true);
  };

  for (const element of elements) {
    const state: TiltState = {
      engaged: false,
      captured: false,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      halfWidth: 0,
      halfHeight: 0,
      centerX: 0,
      centerY: 0,
      tween: null,
      targetKey: "",
    };
    states.set(element, state);

    const onPointer = (event: Event): void => {
      const pointer = event as PointerEvent;
      if (destroyed || pointer.pointerType === "touch") return;
      if (prefersReducedMotion()) {
        reset(element, state);
        return;
      }
      track(element, state, pointer);
    };
    const onLeave = (): void => {
      if (!destroyed) leave(element, state);
    };

    element.addEventListener("pointerenter", onPointer);
    element.addEventListener("pointermove", onPointer);
    element.addEventListener("pointerleave", onLeave);
    element.addEventListener("pointercancel", onLeave);
    cleanups.push(() => {
      element.removeEventListener("pointerenter", onPointer);
      element.removeEventListener("pointermove", onPointer);
      element.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("pointercancel", onLeave);
    });
  }

  // Restore the neutral state as soon as the preference turns on, even without pointer events.
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
