import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export interface FloatingOrbsOptions {
  /** CSS colors assigned to the orbs in order. Defaults to a violet/cyan/pink palette. */
  colors?: readonly string[];
  /** Number of orbs per target. Must be an integer from 1 to 100. Defaults to 5. */
  count?: number;
  /** Smallest orb diameter in pixels. Must be > 0. Defaults to 80. */
  minSize?: number;
  /** Largest orb diameter in pixels. Must be >= minSize. Defaults to 240. */
  maxSize?: number;
  /** Blur radius in pixels. Must be >= 0. Defaults to 40. */
  blur?: number;
  /** Duration of one animation cycle, in seconds. Must be > 0. Defaults to 12. */
  speed?: number;
  /** Orb opacity between 0 and 1. Defaults to 0.6. */
  opacity?: number;
}

export interface FloatingOrbsControls {
  /** Removes the orbs, keyframes and temporary target styles. Safe to call repeatedly. */
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
const DEFAULT_COUNT = 5;
const DEFAULT_MIN_SIZE_PX = 80;
const DEFAULT_MAX_SIZE_PX = 240;
const DEFAULT_BLUR_PX = 40;
const DEFAULT_SPEED_SECONDS = 12;
const DEFAULT_OPACITY = 0.6;
const MAX_ORB_COUNT = 100;

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
  if (!Array.isArray(colors) || colors.length === 0) {
    throw new TypeError("colors must be an array containing at least one CSS color");
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
  0% { transform: translate3d(-12px, -18px, 0) scale(1); }
  33% { transform: translate3d(22px, -8px, 0) scale(1.08); }
  66% { transform: translate3d(8px, 24px, 0) scale(0.94); }
  100% { transform: translate3d(-12px, -18px, 0) scale(1); }
}`;
  const parent = document.head ?? document.documentElement;
  if (!parent) throw new Error("floatingOrbs() requires a document head or document element");
  parent.appendChild(styleElement);
  return styleElement;
}

function orbPosition(index: number, count: number): { left: number; top: number } {
  const left = ((index * 61 + 17) % 88) + 6;
  const top = ((index * 43 + 29) % 82) + 9;
  return { left: Math.min(left, 100), top: Math.min(top, 100 - 100 / count) };
}

/**
 * Adds softly glowing, CSS-animated orbs behind target content.
 * Reduced-motion preferences keep the orbs visible but disable their animation.
 */
export function floatingOrbs(
  target: AnimateTarget,
  options: FloatingOrbsOptions = {},
): FloatingOrbsControls {
  const {
    colors = DEFAULT_COLORS,
    count = DEFAULT_COUNT,
    minSize = DEFAULT_MIN_SIZE_PX,
    maxSize = DEFAULT_MAX_SIZE_PX,
    blur = DEFAULT_BLUR_PX,
    speed = DEFAULT_SPEED_SECONDS,
    opacity = DEFAULT_OPACITY,
  } = options;

  validateColors(colors);
  assertFinite("count", count, 1, MAX_ORB_COUNT);
  if (!Number.isInteger(count)) {
    throw new RangeError(`count must be an integer from 1 to ${MAX_ORB_COUNT}, received ${String(count)}`);
  }
  assertFinite("minSize", minSize, Number.MIN_VALUE);
  assertFinite("maxSize", maxSize, Number.MIN_VALUE);
  if (maxSize < minSize) {
    throw new RangeError(`maxSize must be greater than or equal to minSize, received ${String(maxSize)}`);
  }
  assertFinite("blur", blur, 0);
  assertFinite("speed", speed, Number.MIN_VALUE);
  assertFinite("opacity", opacity, 0, 1);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error(
      "floatingOrbs() requires document.createElement, which is not available in this environment",
    );
  }

  const animationName = `af-motion-floating-orbs-${++nextAnimationId}`;
  const stylesheet = createStylesheet(animationName);
  const mediaQuery =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const reducedMotion = mediaQuery?.matches === true;
  const layers: HTMLDivElement[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;

  try {
    for (const element of elements) {
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("position", "absolute");
      layer.style.setProperty("inset", "0");
      layer.style.setProperty("z-index", "-1");
      layer.style.setProperty("overflow", "hidden");
      layer.style.setProperty("pointer-events", "none");

      for (let index = 0; index < count; index++) {
        const orb = document.createElement("span");
        const size = minSize + ((maxSize - minSize) * ((index * 37) % count)) / Math.max(count - 1, 1);
        const position = orbPosition(index, count);
        orb.setAttribute("aria-hidden", "true");
        orb.style.setProperty("position", "absolute");
        orb.style.setProperty("left", `${position.left}%`);
        orb.style.setProperty("top", `${position.top}%`);
        orb.style.setProperty("width", `${size}px`);
        orb.style.setProperty("height", `${size}px`);
        orb.style.setProperty("border-radius", "50%");
        orb.style.setProperty("background", `radial-gradient(circle, ${colors[index % colors.length]} 0%, transparent 70%)`);
        orb.style.setProperty("filter", `blur(${blur}px)`);
        orb.style.setProperty("opacity", String(opacity));
        orb.style.setProperty("pointer-events", "none");
        if (reducedMotion) {
          orb.style.setProperty("will-change", "auto");
        } else {
          orb.style.setProperty("will-change", "transform");
          orb.style.setProperty("animation", `${animationName} ${speed}s ease-in-out ${-(speed * index) / count}s infinite`);
        }
        layer.appendChild(orb);
      }

      acquireTarget(element);
      acquired.push(element);
      element.insertBefore(layer, element.firstChild);
      layers.push(layer);
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
      for (const orb of Array.from(layer.children) as HTMLSpanElement[]) {
        if (event.matches) {
          orb.style.removeProperty("animation");
          orb.style.setProperty("will-change", "auto");
        } else {
          orb.style.setProperty("will-change", "transform");
          const index = Array.from(layer.children).indexOf(orb);
          orb.style.setProperty(
            "animation",
            `${animationName} ${speed}s ease-in-out ${-(speed * index) / count}s infinite`,
          );
        }
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
