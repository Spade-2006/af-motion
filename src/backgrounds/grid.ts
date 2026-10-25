import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export interface GridBackgroundOptions {
  /** CSS color used for the grid lines. Defaults to violet. */
  color?: string;
  /** Distance between grid lines in pixels. Must be > 0. Defaults to 40. */
  cellSize?: number;
  /** Grid line thickness in pixels. Must be > 0 and no larger than cellSize. Defaults to 1. */
  lineWidth?: number;
  /** Grid opacity between 0 and 1. Defaults to 0.25. */
  opacity?: number;
  /** Duration of one subtle animation cycle in seconds. Set to 0 for a static grid. Defaults to 0. */
  speed?: number;
}

export interface GridBackgroundControls {
  /** Removes the grid, keyframes and temporary target styles. Safe to repeat. */
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

const DEFAULT_COLOR = "#7c3aed";
const DEFAULT_CELL_SIZE_PX = 40;
const DEFAULT_LINE_WIDTH_PX = 1;
const DEFAULT_OPACITY = 0.25;
const DEFAULT_SPEED_SECONDS = 0;

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

function createStylesheet(animationName: string, cellSize: number): HTMLStyleElement {
  const styleElement = document.createElement("style");
  const shift = Math.min(cellSize / 4, 12);
  styleElement.textContent = `
@keyframes ${animationName} {
  0%, 100% { background-position: 0 0, 0 0; }
  50% { background-position: ${shift}px ${shift}px, ${-shift}px ${-shift}px; }
}`;
  const parent = document.head ?? document.documentElement;
  if (!parent) throw new Error("gridBackground() requires a document head or document element");
  parent.appendChild(styleElement);
  return styleElement;
}

/**
 * Adds a responsive CSS grid overlay behind target content. Positive speed subtly shifts
 * the grid using CSS keyframes; zero speed or reduced motion keeps it static.
 */
export function gridBackground(
  target: AnimateTarget,
  options: GridBackgroundOptions = {},
): GridBackgroundControls {
  const {
    color = DEFAULT_COLOR,
    cellSize = DEFAULT_CELL_SIZE_PX,
    lineWidth = DEFAULT_LINE_WIDTH_PX,
    opacity = DEFAULT_OPACITY,
    speed = DEFAULT_SPEED_SECONDS,
  } = options;

  validateColor(color);
  assertFinite("cellSize", cellSize, Number.MIN_VALUE);
  assertFinite("lineWidth", lineWidth, Number.MIN_VALUE);
  if (lineWidth > cellSize) {
    throw new RangeError(`lineWidth must be no larger than cellSize, received ${String(lineWidth)}`);
  }
  assertFinite("opacity", opacity, 0, 1);
  assertFinite("speed", speed, 0);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("gridBackground() requires document.createElement, which is not available in this environment");
  }

  const animationName = `af-motion-grid-${++nextAnimationId}`;
  const stylesheet = createStylesheet(animationName, cellSize);
  const mediaQuery =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const reducedMotion = mediaQuery?.matches === true;
  const layers: HTMLDivElement[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;
  const gridImage = `linear-gradient(to right, ${color} 0, ${color} ${lineWidth}px, transparent ${lineWidth}px), linear-gradient(to bottom, ${color} 0, ${color} ${lineWidth}px, transparent ${lineWidth}px)`;

  try {
    for (const element of elements) {
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("position", "absolute");
      layer.style.setProperty("inset", "0");
      layer.style.setProperty("z-index", "-1");
      layer.style.setProperty("pointer-events", "none");
      layer.style.setProperty("background-image", gridImage);
      layer.style.setProperty("background-size", `${cellSize}px ${cellSize}px`);
      layer.style.setProperty("background-repeat", "repeat");
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
      if (event.matches || speed === 0) layer.style.removeProperty("animation");
      else layer.style.setProperty("animation", `${animationName} ${speed}s ease-in-out infinite`);
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
        if (layer.parentElement === element) element.removeChild(layer);
        releaseTarget(element);
      }
      stylesheet.parentElement?.removeChild(stylesheet);
    },
  };
}
