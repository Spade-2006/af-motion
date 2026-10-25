import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export interface BorderBeamOptions {
  /** Beam color. Defaults to violet. */
  color?: string;
  /** Angular width of the travelling beam in degrees. Must be in (0, 360]. Defaults to 120. */
  size?: number;
  /** Animation duration in milliseconds. Must be > 0. Defaults to 3000. */
  duration?: number;
  /** Border thickness in pixels. Must be > 0. Defaults to 1. */
  borderWidth?: number;
  /** Border corner radius in pixels. Must be >= 0. Defaults to 16. */
  radius?: number;
  /** Starts the beam paused. Defaults to false. */
  paused?: boolean;
}

export interface BorderBeamControls {
  /** Pauses the travelling beam. Safe to call repeatedly. */
  pause(): void;
  /** Resumes the travelling beam unless reduced motion is preferred. Safe to call repeatedly. */
  resume(): void;
  /** Removes the beam and restores target styles. Safe to call repeatedly. */
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

interface BeamState {
  element: HTMLElement;
  layer: HTMLDivElement;
  animation: Animation | null;
}

const DEFAULT_COLOR = "#8b5cf6";
const DEFAULT_SIZE = 120;
const DEFAULT_DURATION = 3000;
const DEFAULT_BORDER_WIDTH = 1;
const DEFAULT_RADIUS = 16;
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

function assertFinite(name: string, value: number, minimum: number, maximum = Number.POSITIVE_INFINITY): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY ? `>= ${minimum}` : `between ${minimum} and ${maximum}`;
    throw new RangeError(`${name} must be a finite number ${range}, received ${String(value)}`);
  }
}

function validateColor(color: string): void {
  if (typeof color !== "string" || color.trim() === "") {
    throw new TypeError("color must be a non-empty CSS color string");
  }
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
    throw new TypeError(`Invalid CSS color "${color}"`);
  }
}

function makeBeamImage(color: string, size: number): string {
  const tail = 360 - size;
  const bright = 360 - size * 0.35;
  return `conic-gradient(from 0deg, transparent 0deg ${tail}deg, ${color} ${bright}deg, transparent 360deg)`;
}

function applyStaticBorder(layer: HTMLDivElement, color: string): void {
  layer.style.setProperty("background-image", `linear-gradient(${color}, ${color})`);
  layer.style.setProperty("opacity", "0.2");
  layer.style.removeProperty("transform");
}

function startAnimation(state: BeamState, duration: number): void {
  if (state.animation) return;
  state.animation = state.layer.animate(
    [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
    { duration, iterations: Number.POSITIVE_INFINITY, easing: "linear" },
  );
}

function stopAnimation(state: BeamState): void {
  state.animation?.cancel();
  state.animation = null;
}

/**
 * Adds a glowing border beam behind target content. The beam uses the Web Animations API,
 * and falls back to a subtle static border when reduced motion is enabled.
 */
export function borderBeam(target: AnimateTarget, options: BorderBeamOptions = {}): BorderBeamControls {
  const {
    color = DEFAULT_COLOR,
    size = DEFAULT_SIZE,
    duration = DEFAULT_DURATION,
    borderWidth = DEFAULT_BORDER_WIDTH,
    radius = DEFAULT_RADIUS,
    paused = false,
  } = options;

  validateColor(color);
  assertFinite("size", size, Number.MIN_VALUE, 360);
  assertFinite("duration", duration, Number.MIN_VALUE);
  assertFinite("borderWidth", borderWidth, Number.MIN_VALUE);
  assertFinite("radius", radius, 0);
  if (typeof paused !== "boolean") throw new TypeError("paused must be a boolean");

  const elements = resolveTargets(target);
  if (elements.length === 0) return { pause: () => undefined, resume: () => undefined, destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("borderBeam() requires document.createElement, which is not available in this environment");
  }

  const reducedMotion = prefersReducedMotion();
  if (!reducedMotion && !paused && elements.some((element) => typeof element.animate !== "function")) {
    throw new Error("borderBeam() requires the Web Animations API when motion is enabled");
  }

  const beamImage = makeBeamImage(color, size);
  const states: BeamState[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;
  let isPaused = paused;

  try {
    for (const element of elements) {
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("position", "absolute");
      layer.style.setProperty("inset", "0");
      layer.style.setProperty("z-index", "-1");
      layer.style.setProperty("pointer-events", "none");
      layer.style.setProperty("box-sizing", "border-box");
      layer.style.setProperty("border-radius", `${radius}px`);
      layer.style.setProperty("padding", `${borderWidth}px`);
      layer.style.setProperty("background-image", beamImage);
      layer.style.setProperty("opacity", "1");
      layer.style.setProperty("mask", "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)");
      layer.style.setProperty("mask-composite", "exclude");
      layer.style.setProperty("-webkit-mask", "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)");
      layer.style.setProperty("-webkit-mask-composite", "xor");

      acquireTarget(element);
      acquired.push(element);
      states.push({ element, layer, animation: null });
      element.insertBefore(layer, element.firstChild);
    }

    if (reducedMotion) {
      for (const state of states) applyStaticBorder(state.layer, color);
    } else if (!isPaused) {
      for (const state of states) startAnimation(state, duration);
    }
  } catch (error) {
    for (const state of states) {
      stopAnimation(state);
      if (state.layer.parentElement === state.element) state.element.removeChild(state.layer);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed) return;
    if (reduced) {
      for (const state of states) {
        stopAnimation(state);
        applyStaticBorder(state.layer, color);
      }
    } else if (!isPaused) {
      for (const state of states) {
        state.layer.style.setProperty("background-image", beamImage);
        state.layer.style.setProperty("opacity", "1");
        startAnimation(state, duration);
      }
    }
  });

  return {
    pause: () => {
      if (destroyed || isPaused) return;
      isPaused = true;
      for (const state of states) {
        if (state.animation) state.animation.pause();
      }
    },
    resume: () => {
      if (destroyed || !isPaused) return;
      isPaused = false;
      if (prefersReducedMotion()) return;
      for (const state of states) {
        if (state.animation) state.animation.play();
        else {
          state.layer.style.setProperty("background-image", beamImage);
          state.layer.style.setProperty("opacity", "1");
          startAnimation(state, duration);
        }
      }
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const state of states) {
        stopAnimation(state);
        if (state.layer.parentElement === state.element) state.element.removeChild(state.layer);
        releaseTarget(state.element);
      }
    },
  };
}
