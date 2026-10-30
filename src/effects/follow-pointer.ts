import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { animateProgress } from "../core/animation.js";
import type { AnimationControls, EasingFunction } from "../core/animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { removeTransformLayer, setTransformLayer } from "../core/transform.js";
import { easeOutCubic } from "../easing/easings.js";

export interface FollowPointerOptions {
  /** Element or selector whose bounds constrain pointer-following movement. */
  container: AnimateTarget;
  /** Transition duration in seconds, from 0 (immediate) to 1. Defaults to 0.12. */
  smoothing?: number;
  /** Defaults to `easings.easeOutCubic`. */
  easing?: EasingFunction;
}

export interface FollowPointerControls {
  /** Removes listeners, cancels active transitions, and restores original transforms. */
  destroy(): void;
}

interface FollowState {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  x: number;
  y: number;
  applied: boolean;
  tween: AnimationControls | null;
}

const DEFAULT_SMOOTHING_SECONDS = 0.12;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Moves target elements to follow mouse or pen movement inside one container, constrained
 * so each target stays within the container. Transform contributions compose with other effects.
 */
export function followPointer(target: AnimateTarget, options: FollowPointerOptions): FollowPointerControls {
  if (!options || typeof options !== "object") throw new TypeError("options must include a container");
  const {
    container: containerTarget,
    smoothing = DEFAULT_SMOOTHING_SECONDS,
    easing = easeOutCubic,
  } = options;
  if (containerTarget === undefined) throw new TypeError("container is required");
  if (typeof smoothing !== "number" || !Number.isFinite(smoothing) || smoothing < 0 || smoothing > 1) {
    throw new RangeError(`smoothing must be a finite number between 0 and 1, received ${String(smoothing)}`);
  }
  if (typeof easing !== "function") throw new TypeError("easing must be a function");

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  const containers = resolveTargets(containerTarget);
  if (containers.length !== 1) {
    throw new RangeError(`container must resolve to exactly one HTMLElement, received ${containers.length}`);
  }
  const container = containers[0] as HTMLElement;

  const reducedInitially = prefersReducedMotion();
  const states = new Map<HTMLElement, FollowState>();
  if (!reducedInitially) {
    const containerRect = container.getBoundingClientRect();
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      states.set(element, {
        centerX: rect.left + rect.width / 2 - containerRect.left,
        centerY: rect.top + rect.height / 2 - containerRect.top,
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        applied: false,
        tween: null,
      });
    }
  } else {
    for (const element of elements) {
      states.set(element, {
        centerX: 0,
        centerY: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        applied: false,
        tween: null,
      });
    }
  }

  let reducedMotion = reducedInitially;
  let destroyed = false;
  const render = (element: HTMLElement, state: FollowState): void => {
    if (state.x === 0 && state.y === 0) {
      if (state.applied) removeTransformLayer(element, state);
      state.applied = false;
      return;
    }
    state.applied = true;
    setTransformLayer(element, state, `translate(${state.x}px, ${state.y}px)`);
  };

  const moveTo = (element: HTMLElement, state: FollowState, x: number, y: number): void => {
    state.tween?.cancel();
    state.tween = null;
    const duration = smoothing * 1000;
    if (reducedMotion || duration === 0 || (state.x === x && state.y === y)) {
      state.x = x;
      state.y = y;
      render(element, state);
      return;
    }
    const fromX = state.x;
    const fromY = state.y;
    let tween: AnimationControls;
    tween = animateProgress({
      duration,
      easing,
      respectReducedMotion: false,
      onUpdate: (progress) => {
        state.x = fromX + (x - fromX) * progress;
        state.y = fromY + (y - fromY) * progress;
        render(element, state);
      },
      onComplete: () => {
        if (state.tween === tween) state.tween = null;
      },
    });
    state.tween = tween;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (destroyed || reducedMotion || event.pointerType === "touch") return;
    const rect = container.getBoundingClientRect();
    for (const [element, state] of states) {
      const pointerX = clamp(event.clientX - rect.left, state.width / 2, Math.max(state.width / 2, rect.width - state.width / 2));
      const pointerY = clamp(event.clientY - rect.top, state.height / 2, Math.max(state.height / 2, rect.height - state.height / 2));
      moveTo(element, state, pointerX - state.centerX, pointerY - state.centerY);
    }
  };
  const onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === "touch") return;
    for (const [element, state] of states) moveTo(element, state, 0, 0);
  };

  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerleave", onPointerLeave);
  container.addEventListener("pointercancel", onPointerLeave);

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    if (reduced) {
      for (const [element, state] of states) {
        state.tween?.cancel();
        state.tween = null;
        state.x = 0;
        state.y = 0;
        render(element, state);
      }
      return;
    }
    const containerRect = container.getBoundingClientRect();
    for (const [element, state] of states) {
      const rect = element.getBoundingClientRect();
      state.centerX = rect.left + rect.width / 2 - containerRect.left;
      state.centerY = rect.top + rect.height / 2 - containerRect.top;
      state.width = rect.width;
      state.height = rect.height;
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      container.removeEventListener("pointercancel", onPointerLeave);
      stopPreferenceListener();
      for (const [element, state] of states) {
        state.tween?.cancel();
        state.tween = null;
        state.x = 0;
        state.y = 0;
        render(element, state);
      }
      states.clear();
    },
  };
}
