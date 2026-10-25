import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type GlowMode = "static" | "pulse" | "hover";
export type GlowTrigger = "immediate" | "hover";

export interface GlowOptions {
  /** CSS glow color. Defaults to violet. */
  color?: string;
  /** Glow opacity between 0 and 1. Defaults to 0.7. */
  intensity?: number;
  /** Glow blur radius in pixels. Defaults to 24. */
  blur?: number;
  /** Static, pulsing, or pointer-hover glow. Defaults to "static". */
  mode?: GlowMode;
  /** Pulse period in milliseconds. Defaults to 2000. */
  duration?: number;
  /** Activate immediately or only while hovered. Defaults to "immediate". */
  trigger?: GlowTrigger;
}

export interface GlowControls {
  /** Cancels animations, removes pointer listeners, and restores original inline styles. Safe to repeat. */
  destroy(): void;
}

interface GlowState {
  element: HTMLElement;
  originalShadow: string;
  originalShadowPriority: string;
  originalTransition: string;
  originalTransitionPriority: string;
  animation: Animation | null;
  hovered: boolean;
  onPointerEnter: (event: PointerEvent) => void;
  onPointerLeave: () => void;
}

const DEFAULT_COLOR = "#8b5cf6";
const DEFAULT_INTENSITY = 0.7;
const DEFAULT_BLUR = 24;
const DEFAULT_MODE: GlowMode = "static";
const DEFAULT_DURATION = 2000;
const DEFAULT_TRIGGER: GlowTrigger = "immediate";

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function composeShadow(original: string, glow: string): string {
  return original === "" || original === "none" ? glow : `${original}, ${glow}`;
}

function makeShadow(color: string, intensity: number, blur: number): string {
  const spread = blur * intensity * 0.35;
  const colorWithIntensity = `color-mix(in srgb, ${color} ${intensity * 100}%, transparent)`;
  return `0 0 ${blur * intensity}px ${spread}px ${colorWithIntensity}`;
}

function setGlow(state: GlowState, shadow: string): void {
  state.element.style.setProperty("box-shadow", composeShadow(state.originalShadow, shadow));
}

/**
 * Adds a static, pulsing, or hover-activated glow without replacing existing content or shadows.
 */
export function glow(target: AnimateTarget, options: GlowOptions = {}): GlowControls {
  const {
    color = DEFAULT_COLOR,
    intensity = DEFAULT_INTENSITY,
    blur = DEFAULT_BLUR,
    mode = DEFAULT_MODE,
    duration = DEFAULT_DURATION,
    trigger = DEFAULT_TRIGGER,
  } = options;

  validateColor(color);
  if (typeof intensity !== "number" || !Number.isFinite(intensity) || intensity < 0 || intensity > 1) {
    throw new RangeError(`intensity must be a finite number between 0 and 1, received ${String(intensity)}`);
  }
  if (typeof blur !== "number" || !Number.isFinite(blur) || blur < 0) {
    throw new RangeError(`blur must be a finite number >= 0, received ${String(blur)}`);
  }
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    throw new RangeError(`duration must be a finite number > 0, received ${String(duration)}`);
  }
  if (mode !== "static" && mode !== "pulse" && mode !== "hover") {
    throw new TypeError(`mode must be "static", "pulse", or "hover", received ${String(mode)}`);
  }
  if (trigger !== "immediate" && trigger !== "hover") {
    throw new TypeError(`trigger must be "immediate" or "hover", received ${String(trigger)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  const reducedMotion = prefersReducedMotion();
  const hasHover = trigger === "hover" || mode === "hover";
  const hasPulse = mode === "pulse";
  if (
    !reducedMotion &&
    hasPulse &&
    (!elements.every((element) => typeof element.animate === "function"))
  ) {
    throw new Error("glow() pulse mode requires the Web Animations API when motion is enabled");
  }

  const baseShadow = makeShadow(color, intensity, blur);
  const peakShadow = makeShadow(color, intensity, blur * 1.5);
  const states: GlowState[] = elements.map((element) => ({
    element,
    originalShadow: element.style.getPropertyValue("box-shadow"),
    originalShadowPriority: element.style.getPropertyPriority("box-shadow"),
    originalTransition: element.style.getPropertyValue("transition"),
    originalTransitionPriority: element.style.getPropertyPriority("transition"),
    animation: null,
    hovered: false,
    onPointerEnter: () => undefined,
    onPointerLeave: () => undefined,
  }));
  let destroyed = false;
  let motionReduced = reducedMotion;

  const stopPulse = (state: GlowState): void => {
    state.animation?.cancel();
    state.animation = null;
  };

  const applyState = (state: GlowState): void => {
    stopPulse(state);
    const active = !hasHover || state.hovered;
    if (!active) {
      state.element.style.setProperty("box-shadow", state.originalShadow, state.originalShadowPriority);
      return;
    }

    setGlow(state, baseShadow);
    if (hasPulse && !motionReduced) {
      state.animation = state.element.animate(
        [
          { boxShadow: composeShadow(state.originalShadow, baseShadow) },
          { boxShadow: composeShadow(state.originalShadow, peakShadow) },
          { boxShadow: composeShadow(state.originalShadow, baseShadow) },
        ],
        { duration, iterations: Number.POSITIVE_INFINITY, easing: "ease-in-out" },
      );
    }
  };

  const restore = (state: GlowState): void => {
    stopPulse(state);
    state.element.removeEventListener("pointerenter", state.onPointerEnter);
    state.element.removeEventListener("pointerleave", state.onPointerLeave);
    if (state.originalShadow === "") state.element.style.removeProperty("box-shadow");
    else state.element.style.setProperty("box-shadow", state.originalShadow, state.originalShadowPriority);
    if (state.originalTransition === "") state.element.style.removeProperty("transition");
    else state.element.style.setProperty("transition", state.originalTransition, state.originalTransitionPriority);
  };

  try {
    for (const state of states) {
      if (hasHover) {
        state.element.style.setProperty(
          "transition",
          state.originalTransition === ""
            ? "box-shadow 180ms ease"
            : `${state.originalTransition}, box-shadow 180ms ease`,
        );
        state.onPointerEnter = (event: PointerEvent): void => {
          if (destroyed || (event.pointerType !== "" && event.pointerType !== "mouse" && event.pointerType !== "pen")) {
            return;
          }
          state.hovered = true;
          applyState(state);
        };
        state.onPointerLeave = (): void => {
          if (destroyed) return;
          state.hovered = false;
          applyState(state);
        };
        state.element.addEventListener("pointerenter", state.onPointerEnter);
        state.element.addEventListener("pointerleave", state.onPointerLeave);
      }
      applyState(state);
    }
  } catch (error) {
    for (const state of states) restore(state);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === motionReduced) return;
    motionReduced = reduced;
    for (const state of states) {
      if (reduced) {
        stopPulse(state);
        if (!hasHover || state.hovered) setGlow(state, baseShadow);
      } else {
        applyState(state);
      }
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const state of states) restore(state);
    },
  };
}
