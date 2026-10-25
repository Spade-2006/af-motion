import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type ShineTrigger = "hover" | "continuous" | "click";

export interface ShineOptions {
  /** CSS color of the glossy sweep. Defaults to translucent white. */
  color?: string;
  /** Direction angle of the diagonal sweep in degrees. Defaults to 120. */
  angle?: number;
  /** Duration of a sweep in milliseconds. Must be > 0. Defaults to 1200. */
  duration?: number;
  /** Overlay opacity between 0 and 1. Defaults to 0.7. */
  intensity?: number;
  /** Sweep continuously, on hover, or on click. Defaults to "hover". */
  trigger?: ShineTrigger;
}

export interface ShineControls {
  /** Cancels animations, removes listeners/overlays, and restores target styles. Safe to repeat. */
  destroy(): void;
}

interface InlineStyleValue {
  value: string;
  priority: string;
}

interface TargetRecord {
  count: number;
  position: InlineStyleValue;
  isolation: InlineStyleValue;
  restorePosition: boolean;
  restoreIsolation: boolean;
}

interface ShineState {
  target: HTMLElement;
  overlay: HTMLDivElement;
  animation: Animation | null;
  onPointerEnter: (event: PointerEvent) => void;
  onPointerLeave: () => void;
  onClick: () => void;
}

const DEFAULT_COLOR = "rgba(255, 255, 255, 0.5)";
const DEFAULT_ANGLE = 120;
const DEFAULT_DURATION = 1200;
const DEFAULT_INTENSITY = 0.7;
const DEFAULT_TRIGGER: ShineTrigger = "hover";
const targetRecords = new WeakMap<HTMLElement, TargetRecord>();

function readInlineStyle(element: HTMLElement, property: string): InlineStyleValue {
  return {
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  };
}

function restoreInlineStyle(element: HTMLElement, property: string, original: InlineStyleValue): void {
  if (original.value === "") element.style.removeProperty(property);
  else element.style.setProperty(property, original.value, original.priority);
}

function acquireTarget(element: HTMLElement): void {
  const current = targetRecords.get(element);
  if (current) {
    current.count++;
    return;
  }

  const position = readInlineStyle(element, "position");
  const isolation = readInlineStyle(element, "isolation");
  const computed = typeof getComputedStyle === "function" ? getComputedStyle(element) : undefined;
  const restorePosition = (computed?.position ?? (position.value || "static")) === "static";
  const restoreIsolation = (computed?.isolation ?? isolation.value) !== "isolate";
  if (restorePosition) element.style.setProperty("position", "relative");
  if (restoreIsolation) element.style.setProperty("isolation", "isolate");
  targetRecords.set(element, { count: 1, position, isolation, restorePosition, restoreIsolation });
}

function releaseTarget(element: HTMLElement): void {
  const record = targetRecords.get(element);
  if (!record) return;
  record.count--;
  if (record.count > 0) return;

  targetRecords.delete(element);
  if (record.restorePosition) restoreInlineStyle(element, "position", record.position);
  if (record.restoreIsolation) restoreInlineStyle(element, "isolation", record.isolation);
}

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function validateFinite(name: string, value: number, minimum: number, maximum = Number.POSITIVE_INFINITY): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY ? `>= ${minimum}` : `between ${minimum} and ${maximum}`;
    throw new RangeError(`${name} must be a finite number ${range}, received ${String(value)}`);
  }
}

function cancelSweep(state: ShineState): void {
  state.animation?.cancel();
  state.animation = null;
  state.overlay.style.setProperty("background-position", "150% 0");
}

function startSweep(state: ShineState, duration: number): void {
  cancelSweep(state);
  state.animation = state.overlay.animate(
    [{ backgroundPosition: "150% 0" }, { backgroundPosition: "-150% 0" }],
    { duration, iterations: 1, easing: "ease-out", fill: "none" },
  );
  state.animation.onfinish = () => {
    state.animation = null;
    state.overlay.style.setProperty("background-position", "150% 0");
    state.overlay.style.setProperty("opacity", "0");
  };
}

function setStaticSheen(state: ShineState, intensity: number): void {
  cancelSweep(state);
  state.overlay.style.setProperty("opacity", String(Math.min(intensity, 0.2)));
  state.overlay.style.setProperty("background-position", "50% 0");
}

/**
 * Adds a diagonal glossy sweep using a pointer-transparent overlay.
 * Motion is driven by the Web Animations API, never a JavaScript animation loop.
 */
export function shine(target: AnimateTarget, options: ShineOptions = {}): ShineControls {
  const {
    color = DEFAULT_COLOR,
    angle = DEFAULT_ANGLE,
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
    trigger = DEFAULT_TRIGGER,
  } = options;

  validateColor(color);
  validateFinite("angle", angle, Number.NEGATIVE_INFINITY);
  validateFinite("duration", duration, Number.MIN_VALUE);
  validateFinite("intensity", intensity, 0, 1);
  if (trigger !== "hover" && trigger !== "continuous" && trigger !== "click") {
    throw new TypeError(`trigger must be "hover", "continuous", or "click", received ${String(trigger)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  const reducedInitially = prefersReducedMotion();
  if (!reducedInitially && elements.some((element) => typeof element.animate !== "function")) {
    throw new Error("shine() requires the Web Animations API when motion is enabled");
  }
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("shine() requires document.createElement, which is not available in this environment");
  }

  const gradient = `linear-gradient(${angle}deg, transparent 38%, ${color} 50%, transparent 62%)`;
  const states: ShineState[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;
  let reducedMotion = reducedInitially;

  const applyMode = (state: ShineState): void => {
    if (reducedMotion) {
      setStaticSheen(state, intensity);
      return;
    }
    if (trigger === "continuous") {
      state.overlay.style.setProperty("opacity", String(intensity));
      state.animation = state.overlay.animate(
        [{ backgroundPosition: "150% 0" }, { backgroundPosition: "-150% 0" }],
        { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
      );
    } else {
      state.overlay.style.setProperty("opacity", "0");
    }
  };

  try {
    for (const element of elements) {
      const overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.setProperty("position", "absolute");
      overlay.style.setProperty("inset", "-1px");
      overlay.style.setProperty("z-index", "1");
      overlay.style.setProperty("pointer-events", "none");
      overlay.style.setProperty("overflow", "hidden");
      overlay.style.setProperty("border-radius", "inherit");
      overlay.style.setProperty("background-image", gradient);
      overlay.style.setProperty("background-size", "250% 100%");
      overlay.style.setProperty("background-position", "150% 0");
      overlay.style.setProperty("opacity", "0");

      const state: ShineState = {
        target: element,
        overlay,
        animation: null,
        onPointerEnter: () => undefined,
        onPointerLeave: () => undefined,
        onClick: () => undefined,
      };
      if (trigger === "hover") {
        state.onPointerEnter = (event: PointerEvent): void => {
          if (destroyed || reducedMotion ||
            (event.pointerType !== "" && event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
          overlay.style.setProperty("opacity", String(intensity));
          startSweep(state, duration);
        };
        state.onPointerLeave = (): void => {
          if (destroyed || reducedMotion) return;
          cancelSweep(state);
          overlay.style.setProperty("opacity", "0");
        };
      } else if (trigger === "click") {
        state.onClick = (): void => {
          if (destroyed || reducedMotion) return;
          overlay.style.setProperty("opacity", String(intensity));
          startSweep(state, duration);
        };
      }

      acquireTarget(element);
      acquired.push(element);
      states.push(state);
      element.insertBefore(overlay, element.firstChild);
      if (trigger === "hover") {
        element.addEventListener("pointerenter", state.onPointerEnter);
        element.addEventListener("pointerleave", state.onPointerLeave);
      } else if (trigger === "click") {
        element.addEventListener("click", state.onClick);
      }
      applyMode(state);
    }
  } catch (error) {
    for (const state of states) {
      cancelSweep(state);
      state.target.removeEventListener("pointerenter", state.onPointerEnter);
      state.target.removeEventListener("pointerleave", state.onPointerLeave);
      state.target.removeEventListener("click", state.onClick);
      if (state.overlay.parentElement === state.target) state.target.removeChild(state.overlay);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    for (const state of states) {
      if (reduced) {
        setStaticSheen(state, intensity);
      } else {
        cancelSweep(state);
        state.overlay.style.setProperty("opacity", trigger === "continuous" ? String(intensity) : "0");
        if (trigger === "continuous") {
          state.animation = state.overlay.animate(
            [{ backgroundPosition: "150% 0" }, { backgroundPosition: "-150% 0" }],
            { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
          );
        }
      }
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const state of states) {
        cancelSweep(state);
        state.target.removeEventListener("pointerenter", state.onPointerEnter);
        state.target.removeEventListener("pointerleave", state.onPointerLeave);
        state.target.removeEventListener("click", state.onClick);
        if (state.overlay.parentElement === state.target) state.target.removeChild(state.overlay);
        releaseTarget(state.target);
      }
    },
  };
}
