import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export type RippleOrigin = "pointer" | "center";

export interface RippleOptions {
  /** CSS color of the expanding wave. Defaults to translucent white. */
  color?: string;
  /** Wave animation duration in milliseconds. Must be > 0. Defaults to 600. */
  duration?: number;
  /** Final scale relative to the calculated circle size. Must be > 0. Defaults to 2. */
  scale?: number;
  /** Center the wave or use the click position. Defaults to "pointer". */
  origin?: RippleOrigin;
}

export interface RippleControls {
  /** Cancels active waves, removes click listeners, and restores target styles. Safe to repeat. */
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

interface ActiveWave {
  element: HTMLElement;
  animation: Animation;
}

interface RippleState {
  element: HTMLElement;
  waves: Set<ActiveWave>;
  acquired: boolean;
  onClick: (event: MouseEvent) => void;
}

const DEFAULT_COLOR = "rgba(255, 255, 255, 0.35)";
const DEFAULT_DURATION = 600;
const DEFAULT_SCALE = 2;
const DEFAULT_ORIGIN: RippleOrigin = "pointer";
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

function validatePositive(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number > 0, received ${String(value)}`);
  }
}

function clearWaves(state: RippleState): void {
  for (const wave of state.waves) {
    wave.animation.cancel();
    if (wave.element.parentElement === state.element) state.element.removeChild(wave.element);
  }
  state.waves.clear();
}

function makeWave(
  state: RippleState,
  event: MouseEvent,
  color: string,
  duration: number,
  scale: number,
  origin: RippleOrigin,
): void {
  const rect = state.element.getBoundingClientRect();
  const centerX = origin === "center" || event.detail === 0
    ? rect.width / 2
    : event.clientX - rect.left;
  const centerY = origin === "center" || event.detail === 0
    ? rect.height / 2
    : event.clientY - rect.top;
  const radius = Math.max(
    Math.hypot(centerX, centerY),
    Math.hypot(rect.width - centerX, centerY),
    Math.hypot(centerX, rect.height - centerY),
    Math.hypot(rect.width - centerX, rect.height - centerY),
  );
  const diameter = Math.max(1, (radius * 2) / scale);
  const wave = document.createElement("span");
  wave.setAttribute("aria-hidden", "true");
  wave.style.setProperty("position", "absolute");
  wave.style.setProperty("left", `${centerX}px`);
  wave.style.setProperty("top", `${centerY}px`);
  wave.style.setProperty("width", `${diameter}px`);
  wave.style.setProperty("height", `${diameter}px`);
  wave.style.setProperty("border-radius", "50%");
  wave.style.setProperty("pointer-events", "none");
  wave.style.setProperty("z-index", "-1");
  wave.style.setProperty("background-color", color);
  wave.style.setProperty("opacity", "0");
  wave.style.setProperty("transform", "translate(-50%, -50%) scale(0)");
  wave.style.setProperty("will-change", "transform, opacity");

  state.element.insertBefore(wave, state.element.firstChild);
  let animation: Animation;
  try {
    animation = wave.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 0.6 },
        { transform: `translate(-50%, -50%) scale(${scale})`, opacity: 0 },
      ],
      { duration, easing: "ease-out", fill: "forwards" },
    );
  } catch (error) {
    state.element.removeChild(wave);
    throw error;
  }
  const active: ActiveWave = { element: wave, animation };
  state.waves.add(active);
  animation.onfinish = () => {
    state.waves.delete(active);
    if (wave.parentElement === state.element) state.element.removeChild(wave);
  };
}

/**
 * Creates expanding, fading click waves at the pointer or target center.
 * Click events are observed without preventing default behavior or stopping propagation.
 */
export function ripple(target: AnimateTarget, options: RippleOptions = {}): RippleControls {
  const {
    color = DEFAULT_COLOR,
    duration = DEFAULT_DURATION,
    scale = DEFAULT_SCALE,
    origin = DEFAULT_ORIGIN,
  } = options;

  validateColor(color);
  validatePositive("duration", duration);
  validatePositive("scale", scale);
  if (origin !== "pointer" && origin !== "center") {
    throw new TypeError(`origin must be "pointer" or "center", received ${String(origin)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("ripple() requires document.createElement, which is not available in this environment");
  }
  if (elements.some((element) => typeof element.animate !== "function")) {
    throw new Error("ripple() requires the Web Animations API");
  }

  let reducedMotion = prefersReducedMotion();
  const states: RippleState[] = elements.map((element) => ({
    element,
    waves: new Set<ActiveWave>(),
    acquired: false,
    onClick: () => undefined,
  }));
  let destroyed = false;

  const acquire = (state: RippleState): void => {
    if (state.acquired) return;
    acquireTarget(state.element);
    state.acquired = true;
  };

  const release = (state: RippleState): void => {
    if (!state.acquired) return;
    releaseTarget(state.element);
    state.acquired = false;
  };

  for (const state of states) {
    state.onClick = (event: MouseEvent): void => {
      if (destroyed || reducedMotion) return;
      if (!state.acquired) acquire(state);
      makeWave(state, event, color, duration, scale, origin);
    };
  }

  if (!reducedMotion) {
    const acquired: RippleState[] = [];
    try {
      for (const state of states) {
        acquire(state);
        acquired.push(state);
      }
    } catch (error) {
      for (const state of acquired) release(state);
      throw error;
    }
  }

  try {
    for (const state of states) state.element.addEventListener("click", state.onClick);
  } catch (error) {
    for (const state of states) state.element.removeEventListener("click", state.onClick);
    for (const state of states) release(state);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    if (reduced) {
      for (const state of states) {
        clearWaves(state);
        release(state);
      }
    } else {
      for (const state of states) acquire(state);
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const state of states) {
        state.element.removeEventListener("click", state.onClick);
        clearWaves(state);
        release(state);
      }
    },
  };
}
