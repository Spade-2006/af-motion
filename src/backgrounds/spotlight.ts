import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export interface SpotlightBackgroundOptions {
  /** CSS color of the glow. Defaults to violet. */
  color?: string;
  /** Radius of the glow in pixels. Must be > 0. Defaults to 300. */
  radius?: number;
  /** Glow opacity between 0 and 1. Defaults to 0.35. */
  intensity?: number;
  /** Pointer-position transition duration in seconds, between 0 and 1. Defaults to 0.15. */
  smoothing?: number;
}

export interface SpotlightBackgroundControls {
  /** Removes pointer listeners and the glow layer, restoring temporary target styles. Safe to repeat. */
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
  layer: HTMLDivElement;
  glow: HTMLDivElement;
  onPointerMove: (event: PointerEvent) => void;
  onPointerLeave: () => void;
}

const DEFAULT_COLOR = "#7c3aed";
const DEFAULT_RADIUS_PX = 300;
const DEFAULT_INTENSITY = 0.35;
const DEFAULT_SMOOTHING_SECONDS = 0.15;

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
  let record = targetRecords.get(element);
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

function assertFinite(name: string, value: number, minimum: number, maximum = Number.POSITIVE_INFINITY): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY ? `>= ${minimum}` : `between ${minimum} and ${maximum}`;
    throw new RangeError(`${name} must be a finite number ${range}, received ${String(value)}`);
  }
}

function createState(
  element: HTMLElement,
  color: string,
  radius: number,
  intensity: number,
  smoothing: number,
): SpotlightState {
  const layer = document.createElement("div");
  const glow = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.setProperty("position", "absolute");
  layer.style.setProperty("inset", "0");
  layer.style.setProperty("z-index", "-1");
  layer.style.setProperty("overflow", "hidden");
  layer.style.setProperty("pointer-events", "none");

  glow.style.setProperty("position", "absolute");
  glow.style.setProperty("left", "var(--af-motion-spotlight-x, 50%)");
  glow.style.setProperty("top", "var(--af-motion-spotlight-y, 50%)");
  glow.style.setProperty("width", `var(--af-motion-spotlight-diameter, ${radius * 2}px)`);
  glow.style.setProperty("height", `var(--af-motion-spotlight-diameter, ${radius * 2}px)`);
  glow.style.setProperty("transform", "translate(-50%, -50%)");
  glow.style.setProperty("border-radius", "50%");
  glow.style.setProperty(
    "background",
    `radial-gradient(circle, var(--af-motion-spotlight-color, ${color}) 0%, transparent 70%)`,
  );
  glow.style.setProperty("opacity", `var(--af-motion-spotlight-intensity, ${intensity})`);
  glow.style.setProperty("transition", `left ${smoothing}s ease-out, top ${smoothing}s ease-out`);
  glow.style.setProperty("pointer-events", "none");
  glow.style.setProperty("--af-motion-spotlight-x", "50%");
  glow.style.setProperty("--af-motion-spotlight-y", "50%");
  glow.style.setProperty("--af-motion-spotlight-diameter", `${radius * 2}px`);
  glow.style.setProperty("--af-motion-spotlight-color", color);
  glow.style.setProperty("--af-motion-spotlight-intensity", String(intensity));

  layer.appendChild(glow);

  const onPointerMove = (event: PointerEvent): void => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    glow.style.setProperty("--af-motion-spotlight-x", `${x}px`);
    glow.style.setProperty("--af-motion-spotlight-y", `${y}px`);
  };
  const onPointerLeave = (): void => {
    glow.style.setProperty("--af-motion-spotlight-x", "50%");
    glow.style.setProperty("--af-motion-spotlight-y", "50%");
  };

  return { element, layer, glow, onPointerMove, onPointerLeave };
}

/**
 * Adds a radial glow that follows the pointer within each target. CSS transitions smooth
 * pointer changes without a JavaScript animation loop; reduced motion keeps it centered.
 */
export function spotlightBackground(
  target: AnimateTarget,
  options: SpotlightBackgroundOptions = {},
): SpotlightBackgroundControls {
  const {
    color = DEFAULT_COLOR,
    radius = DEFAULT_RADIUS_PX,
    intensity = DEFAULT_INTENSITY,
    smoothing = DEFAULT_SMOOTHING_SECONDS,
  } = options;

  validateColor(color);
  assertFinite("radius", radius, Number.MIN_VALUE);
  assertFinite("intensity", intensity, 0, 1);
  assertFinite("smoothing", smoothing, 0, 1);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error(
      "spotlightBackground() requires document.createElement, which is not available in this environment",
    );
  }

  const mediaQuery =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  let reducedMotion = mediaQuery?.matches === true;
  const states = elements.map((element) => createState(element, color, radius, intensity, smoothing));
  const inserted: SpotlightState[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;

  try {
    for (const state of states) {
      acquireTarget(state.element);
      acquired.push(state.element);
      state.element.insertBefore(state.layer, state.element.firstChild);
      inserted.push(state);
      if (!reducedMotion) {
        state.element.addEventListener("pointermove", state.onPointerMove);
        state.element.addEventListener("pointerleave", state.onPointerLeave);
        state.element.addEventListener("pointercancel", state.onPointerLeave);
      }
    }
  } catch (error) {
    for (const state of inserted) {
      state.element.removeEventListener("pointermove", state.onPointerMove);
      state.element.removeEventListener("pointerleave", state.onPointerLeave);
      state.element.removeEventListener("pointercancel", state.onPointerLeave);
      if (state.layer.parentElement === state.element) state.element.removeChild(state.layer);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  const onMotionChange = (event: MediaQueryListEvent): void => {
    if (destroyed) return;
    reducedMotion = event.matches;
    for (const state of states) {
      if (reducedMotion) {
        state.element.removeEventListener("pointermove", state.onPointerMove);
        state.element.removeEventListener("pointerleave", state.onPointerLeave);
        state.element.removeEventListener("pointercancel", state.onPointerLeave);
        state.onPointerLeave();
      } else {
        state.element.addEventListener("pointermove", state.onPointerMove);
        state.element.addEventListener("pointerleave", state.onPointerLeave);
        state.element.addEventListener("pointercancel", state.onPointerLeave);
      }
    }
  };
  mediaQuery?.addEventListener?.("change", onMotionChange);

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      mediaQuery?.removeEventListener?.("change", onMotionChange);
      for (const state of states) {
        state.element.removeEventListener("pointermove", state.onPointerMove);
        state.element.removeEventListener("pointerleave", state.onPointerLeave);
        state.element.removeEventListener("pointercancel", state.onPointerLeave);
        if (state.layer.parentElement === state.element) state.element.removeChild(state.layer);
        releaseTarget(state.element);
      }
    },
  };
}
