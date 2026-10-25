import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";

export interface SpotlightOptions {
  /** CSS color for the radial light. Defaults to translucent white. */
  color?: string;
  /** Spotlight radius in pixels. Must be > 0. Defaults to 180. */
  radius?: number;
  /** Glow opacity between 0 and 1. Defaults to 0.6. */
  intensity?: number;
  /** CSS transition smoothing in seconds. Must be between 0 and 1. Defaults to 0.12. */
  smoothing?: number;
}

export interface SpotlightControls {
  /** Removes pointer listeners and overlays and restores target styles. Safe to repeat. */
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

interface SpotlightState {
  element: HTMLElement;
  overlay: HTMLDivElement;
  onPointerMove: (event: PointerEvent) => void;
  onPointerLeave: () => void;
  listening: boolean;
}

const DEFAULT_COLOR = "rgba(255, 255, 255, 0.18)";
const DEFAULT_RADIUS = 180;
const DEFAULT_INTENSITY = 0.6;
const DEFAULT_SMOOTHING = 0.12;
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
  const record = targetRecords.get(element);
  if (record) {
    record.count++;
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

function setPosition(state: SpotlightState, x: string, y: string): void {
  state.overlay.style.setProperty("--af-motion-spotlight-x", x);
  state.overlay.style.setProperty("--af-motion-spotlight-y", y);
}

function setListening(state: SpotlightState, enabled: boolean): void {
  if (state.listening === enabled) return;
  state.listening = enabled;
  if (enabled) {
    state.element.addEventListener("pointermove", state.onPointerMove);
    state.element.addEventListener("pointerleave", state.onPointerLeave);
  } else {
    state.element.removeEventListener("pointermove", state.onPointerMove);
    state.element.removeEventListener("pointerleave", state.onPointerLeave);
    setPosition(state, "50%", "50%");
  }
}

function createState(
  element: HTMLElement,
  color: string,
  radius: number,
  intensity: number,
  smoothing: number,
  reducedMotion: boolean,
): SpotlightState {
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.setProperty("position", "absolute");
  overlay.style.setProperty("inset", "0");
  overlay.style.setProperty("z-index", "-1");
  overlay.style.setProperty("overflow", "hidden");
  overlay.style.setProperty("pointer-events", "none");
  overlay.style.setProperty(
    "background",
    `radial-gradient(circle ${radius}px at var(--af-motion-spotlight-x, 50%) var(--af-motion-spotlight-y, 50%), ${color} 0%, transparent 70%)`,
  );
  overlay.style.setProperty("opacity", String(reducedMotion ? Math.min(intensity, 0.2) : intensity));
  overlay.style.setProperty("transition", `background-position ${smoothing}s ease-out`);
  overlay.style.setProperty("--af-motion-spotlight-x", "50%");
  overlay.style.setProperty("--af-motion-spotlight-y", "50%");

  const state: SpotlightState = {
    element,
    overlay,
    onPointerMove: () => undefined,
    onPointerLeave: () => undefined,
    listening: false,
  };
  state.onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === "touch") return;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    setPosition(state, `${x}px`, `${y}px`);
  };
  state.onPointerLeave = (): void => setPosition(state, "50%", "50%");
  return state;
}

/**
 * Adds a radial spotlight that follows pointer movement via CSS variables, without a JS animation loop.
 * Reduced motion disables tracking and displays a subtle centered glow.
 */
export function spotlight(target: AnimateTarget, options: SpotlightOptions = {}): SpotlightControls {
  const {
    color = DEFAULT_COLOR,
    radius = DEFAULT_RADIUS,
    intensity = DEFAULT_INTENSITY,
    smoothing = DEFAULT_SMOOTHING,
  } = options;

  validateColor(color);
  validateFinite("radius", radius, Number.MIN_VALUE);
  validateFinite("intensity", intensity, 0, 1);
  validateFinite("smoothing", smoothing, 0, 1);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("spotlight() requires document.createElement, which is not available in this environment");
  }

  let reducedMotion = prefersReducedMotion();
  const states = elements.map((element) =>
    createState(element, color, radius, intensity, smoothing, reducedMotion),
  );
  let destroyed = false;
  const inserted: SpotlightState[] = [];
  const acquired: HTMLElement[] = [];

  try {
    for (const state of states) {
      acquireTarget(state.element);
      acquired.push(state.element);
      state.element.insertBefore(state.overlay, state.element.firstChild);
      inserted.push(state);
      setListening(state, !reducedMotion);
    }
  } catch (error) {
    for (const state of inserted) {
      setListening(state, false);
      if (state.overlay.parentElement === state.element) state.element.removeChild(state.overlay);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  const stopPreferenceListener = onReducedMotionChange((reduced) => {
    if (destroyed || reduced === reducedMotion) return;
    reducedMotion = reduced;
    for (const state of states) {
      state.overlay.style.setProperty("opacity", String(reduced ? Math.min(intensity, 0.2) : intensity));
      setListening(state, !reduced);
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopPreferenceListener();
      for (const state of states) {
        setListening(state, false);
        if (state.overlay.parentElement === state.element) state.element.removeChild(state.overlay);
        releaseTarget(state.element);
      }
    },
  };
}
