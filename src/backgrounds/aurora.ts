import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export interface AuroraOptions {
  /** CSS colors used to create the aurora gradient. Defaults to a violet/cyan/pink palette. */
  colors?: readonly string[];
  /** Duration of one animation cycle, in seconds. Must be > 0. Defaults to 8. */
  speed?: number;
  /** Blur radius in pixels. Must be >= 0. Defaults to 60. */
  blur?: number;
  /** Overlay opacity between 0 and 1. Defaults to 0.7. */
  opacity?: number;
  /** Overlay corner radius in pixels. Must be >= 0. Defaults to 24. */
  borderRadius?: number;
}

export interface AuroraControls {
  /** Removes the background, injected keyframes and any temporary target styles. Safe to repeat. */
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
const DEFAULT_SPEED_SECONDS = 8;
const DEFAULT_BLUR_PX = 60;
const DEFAULT_OPACITY = 0.7;
const DEFAULT_BORDER_RADIUS_PX = 24;

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
  if (restorePosition) {
    element.style.setProperty("position", "relative");
  }
  if (restoreIsolation) {
    element.style.setProperty("isolation", "isolate");
  }
  record = { count: 1, position, isolation, restorePosition, restoreIsolation };
  targetRecords.set(element, record);
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
  0% { transform: translate3d(-4%, -3%, 0) scale(1); }
  50% { transform: translate3d(4%, 3%, 0) scale(1.08); }
  100% { transform: translate3d(-4%, -3%, 0) scale(1); }
}`;
  const parent = document.head ?? document.documentElement;
  if (!parent) throw new Error("aurora() requires a document head or document element");
  parent.appendChild(styleElement);
  return styleElement;
}

/**
 * Adds a softly blurred, animated gradient behind each target's content.
 * Reduced-motion preferences disable the keyframe animation while keeping the static gradient.
 */
export function aurora(target: AnimateTarget, options: AuroraOptions = {}): AuroraControls {
  const {
    colors = DEFAULT_COLORS,
    speed = DEFAULT_SPEED_SECONDS,
    blur = DEFAULT_BLUR_PX,
    opacity = DEFAULT_OPACITY,
    borderRadius = DEFAULT_BORDER_RADIUS_PX,
  } = options;

  validateColors(colors);
  assertFinite("speed", speed, Number.MIN_VALUE);
  assertFinite("blur", blur, 0);
  assertFinite("opacity", opacity, 0, 1);
  assertFinite("borderRadius", borderRadius, 0);
  if (speed === 0) throw new RangeError("speed must be greater than 0");

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("aurora() requires document.createElement, which is not available in this environment");
  }

  const animationName = `af-motion-aurora-${++nextAnimationId}`;
  const stylesheet = createStylesheet(animationName);
  const mediaQuery =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  const reducedMotion = mediaQuery?.matches === true;
  const overlays: HTMLDivElement[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;

  try {
    for (const element of elements) {
      const overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.setProperty("position", "absolute");
      overlay.style.setProperty("inset", "-20%");
      overlay.style.setProperty("z-index", "-1");
      overlay.style.setProperty("pointer-events", "none");
      overlay.style.setProperty("background", [
        `radial-gradient(ellipse at 20% 20%, ${colors[0]}, transparent 60%)`,
        `radial-gradient(ellipse at 80% 30%, ${colors[1]}, transparent 55%)`,
        `radial-gradient(ellipse at 50% 85%, ${colors[2 % colors.length]}, transparent 60%)`,
      ].join(", "));
      overlay.style.setProperty("filter", `blur(${blur}px)`);
      overlay.style.setProperty("opacity", String(opacity));
      overlay.style.setProperty("border-radius", `${borderRadius}px`);
      overlay.style.setProperty("will-change", reducedMotion ? "auto" : "transform");
      if (!reducedMotion) {
        overlay.style.setProperty("animation", `${animationName} ${speed}s ease-in-out infinite`);
      }
      acquireTarget(element);
      acquired.push(element);
      element.insertBefore(overlay, element.firstChild);
      overlays.push(overlay);
    }
  } catch (error) {
    for (const overlay of overlays) {
      overlay.parentElement?.removeChild(overlay);
    }
    for (const element of acquired) releaseTarget(element);
    stylesheet.parentElement?.removeChild(stylesheet);
    throw error;
  }

  const onMotionChange = (event: MediaQueryListEvent): void => {
    if (destroyed) return;
    for (const overlay of overlays) {
      if (event.matches) {
        overlay.style.removeProperty("animation");
        overlay.style.setProperty("will-change", "auto");
      } else {
        overlay.style.setProperty("will-change", "transform");
        overlay.style.setProperty("animation", `${animationName} ${speed}s ease-in-out infinite`);
      }
    }
  };
  mediaQuery?.addEventListener?.("change", onMotionChange);

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      mediaQuery?.removeEventListener?.("change", onMotionChange);
      for (let index = 0; index < overlays.length; index++) {
        const overlay = overlays[index];
        const element = elements[index];
        if (!overlay || !element) continue;
        element.removeChild(overlay);
        releaseTarget(element);
      }
      stylesheet.parentElement?.removeChild(stylesheet);
    },
  };
}
