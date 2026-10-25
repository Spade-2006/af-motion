import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export interface GradientBackgroundOptions {
  /** CSS colors used in the gradient. Defaults to a violet/cyan/pink palette. */
  colors?: readonly string[];
  /** Gradient angle in degrees. Defaults to 135. */
  angle?: number;
  /** Duration of one animation cycle in seconds. Set to 0 for a static gradient. Defaults to 8. */
  speed?: number;
  /** Gradient opacity between 0 and 1. Defaults to 0.8. */
  opacity?: number;
}

export interface GradientBackgroundControls {
  /** Removes the gradient, keyframes and any temporary target styles. Safe to repeat. */
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

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4", "#ec4899"] as const;
const DEFAULT_ANGLE_DEG = 135;
const DEFAULT_SPEED_SECONDS = 8;
const DEFAULT_OPACITY = 0.8;

const targetRecords = new WeakMap<HTMLElement, TargetRecord>();
let nextAnimationId = 0;

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

function assertFinite(name: string, value: number, minimum: number, maximum = Number.POSITIVE_INFINITY): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY ? `>= ${minimum}` : `between ${minimum} and ${maximum}`;
    throw new RangeError(`${name} must be a finite number ${range}, received ${String(value)}`);
  }
}

function validateColors(colors: readonly string[]): void {
  if (!Array.isArray(colors) || colors.length < 2) {
    throw new TypeError("colors must be an array containing at least two CSS colors");
  }
  for (const color of colors) {
    if (typeof color !== "string" || color.trim() === "") {
      throw new TypeError("each color must be a non-empty CSS color string");
    }
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function" && !CSS.supports("color", color)) {
      throw new TypeError(`Invalid CSS color "${color}"`);
    }
  }
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

function createStylesheet(animationName: string): HTMLStyleElement {
  const styleElement = document.createElement("style");
  styleElement.textContent = `
@keyframes ${animationName} {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;
  const parent = document.head ?? document.documentElement;
  if (!parent) throw new Error("gradientBackground() requires a document head or document element");
  parent.appendChild(styleElement);
  return styleElement;
}

/**
 * Adds a smooth CSS gradient behind each target. A positive speed animates the gradient;
 * speed 0 or a reduced-motion preference displays it statically.
 */
export function gradientBackground(
  target: AnimateTarget,
  options: GradientBackgroundOptions = {},
): GradientBackgroundControls {
  const {
    colors = DEFAULT_COLORS,
    angle = DEFAULT_ANGLE_DEG,
    speed = DEFAULT_SPEED_SECONDS,
    opacity = DEFAULT_OPACITY,
  } = options;

  validateColors(colors);
  assertFinite("angle", angle, Number.NEGATIVE_INFINITY);
  assertFinite("speed", speed, 0);
  assertFinite("opacity", opacity, 0, 1);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error(
      "gradientBackground() requires document.createElement, which is not available in this environment",
    );
  }

  const animationName = `af-motion-gradient-${++nextAnimationId}`;
  const stylesheet = createStylesheet(animationName);
  const mediaQuery =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const reducedMotion = mediaQuery?.matches === true;
  const layers: HTMLDivElement[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;
  const gradient = `linear-gradient(${angle}deg, ${colors.join(", ")})`;

  try {
    for (const element of elements) {
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("position", "absolute");
      layer.style.setProperty("inset", "0");
      layer.style.setProperty("z-index", "-1");
      layer.style.setProperty("pointer-events", "none");
      layer.style.setProperty("background-image", gradient);
      layer.style.setProperty("background-size", speed > 0 && !reducedMotion ? "200% 200%" : "100% 100%");
      layer.style.setProperty("background-position", "50% 50%");
      layer.style.setProperty("opacity", String(opacity));
      if (speed > 0 && !reducedMotion) {
        layer.style.setProperty("animation", `${animationName} ${speed}s ease-in-out infinite`);
      }

      acquireTarget(element);
      acquired.push(element);
      layers.push(layer);
      element.insertBefore(layer, element.firstChild);
    }
  } catch (error) {
    for (const layer of layers) layer.parentElement?.removeChild(layer);
    for (const element of acquired) releaseTarget(element);
    stylesheet.parentElement?.removeChild(stylesheet);
    throw error;
  }

  const onMotionChange = (event: MediaQueryListEvent): void => {
    if (destroyed) return;
    for (const layer of layers) {
      if (event.matches || speed === 0) {
        layer.style.removeProperty("animation");
        layer.style.setProperty("background-size", "100% 100%");
      } else {
        layer.style.setProperty("background-size", "200% 200%");
        layer.style.setProperty("animation", `${animationName} ${speed}s ease-in-out infinite`);
      }
    }
  };
  mediaQuery?.addEventListener?.("change", onMotionChange);

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      mediaQuery?.removeEventListener?.("change", onMotionChange);
      for (let index = 0; index < layers.length; index++) {
        const layer = layers[index];
        const element = elements[index];
        if (!layer || !element) continue;
        element.removeChild(layer);
        releaseTarget(element);
      }
      stylesheet.parentElement?.removeChild(stylesheet);
    },
  };
}
