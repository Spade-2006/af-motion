import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import { getActivePalette, getPalette, subscribeToPaletteChanges } from "../core/palettes.js";
import {
  acquireBackgroundTarget as acquireTarget,
  releaseBackgroundTarget as releaseTarget,
} from "./internal/canvas-lifecycle.js";

export type AdvancedGradientType = "mesh" | "aurora" | "radial" | "conic";

export interface AdvancedGradientOptions {
  /** Visual gradient treatment. Defaults to "mesh". */
  type?: AdvancedGradientType;
  /** CSS colors used when no palette is selected. Defaults to violet, cyan, and pink. */
  colors?: readonly string[];
  /** Registered palette name, or "active" to use and follow the current active palette. */
  palette?: string | "active";
  /** Mesh/aurora animation cycle duration in seconds. Use 0 for a static gradient. Defaults to 12. */
  speed?: number;
  /** Gradient strength from 0 to 1. Defaults to 0.65. */
  intensity?: number;
  /** Gradient direction in degrees. Defaults to 135. */
  direction?: number;
  /** Overlay opacity from 0 to 1. Defaults to 0.8. */
  opacity?: number;
  /** Optional class applied to every generated overlay. */
  className?: string;
  /** Additional inline CSS declarations applied to every generated overlay. */
  style?: Readonly<Record<string, string>>;
}

export interface AdvancedGradientControls {
  /** Removes the overlay and releases styles, listeners, and generated keyframes. Safe to repeat. */
  destroy(): void;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4", "#ec4899"] as const;
const DEFAULT_SPEED = 12;
const DEFAULT_INTENSITY = 0.65;
const DEFAULT_DIRECTION = 135;
const DEFAULT_OPACITY = 0.8;
let nextAnimationId = 0;

function assertFinite(
  name: string,
  value: number,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY
      ? `>= ${minimum}`
      : `between ${minimum} and ${maximum}`;
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

function validateStyle(style: Readonly<Record<string, string>> | undefined): void {
  if (style === undefined) return;
  if (style === null || typeof style !== "object" || Array.isArray(style)) {
    throw new TypeError("style must be an object of CSS property/value strings");
  }
  for (const [property, value] of Object.entries(style)) {
    if (property.trim() === "" || typeof value !== "string") {
      throw new TypeError("style must contain non-empty CSS property names and string values");
    }
  }
}

function paletteColors(name: string | "active" | undefined): readonly string[] | undefined {
  if (name === undefined) return undefined;
  const palette = name === "active" ? getActivePalette() : getPalette(name);
  if (!palette && name !== "active") throw new TypeError(`Unknown palette "${name}"`);
  return palette ? [palette.tokens.primary, palette.tokens.secondary, palette.tokens.accent] : undefined;
}

function createStylesheet(name: string, intensity: number, direction: number): HTMLStyleElement {
  const radians = (direction * Math.PI) / 180;
  const x = Math.cos(radians) * intensity * 8;
  const y = Math.sin(radians) * intensity * 8;
  const style = document.createElement("style");
  style.textContent = `
@keyframes ${name} {
  0%, 100% { transform: translate3d(${-x}%, ${-y}%, 0) scale(1.04); }
  50% { transform: translate3d(${x}%, ${y}%, 0) scale(1.12); }
}`;
  const parent = document.head ?? document.documentElement;
  if (!parent) throw new Error("advancedGradientBackground() requires a document head or document element");
  parent.appendChild(style);
  return style;
}

function gradientImage(type: AdvancedGradientType, colors: readonly string[], direction: number): string {
  if (type === "mesh") {
    return [
      `radial-gradient(ellipse at 18% 24%, ${colors[0]}, transparent 52%)`,
      `radial-gradient(ellipse at 82% 28%, ${colors[1]}, transparent 50%)`,
      `radial-gradient(ellipse at 52% 82%, ${colors[2 % colors.length]}, transparent 55%)`,
      `linear-gradient(${direction}deg, ${colors.join(", ")})`,
    ].join(", ");
  }
  if (type === "aurora") {
    return [
      `radial-gradient(ellipse at 20% 25%, ${colors[0]}, transparent 60%)`,
      `radial-gradient(ellipse at 80% 30%, ${colors[1]}, transparent 55%)`,
      `radial-gradient(ellipse at 50% 85%, ${colors[2 % colors.length]}, transparent 60%)`,
    ].join(", ");
  }
  if (type === "radial") return `radial-gradient(ellipse at center, ${colors.join(", ")})`;
  return `conic-gradient(from ${direction}deg at center, ${colors.join(", ")})`;
}

/**
 * Adds a configurable animated gradient overlay behind target content.
 * Mesh and aurora types animate softly; radial and conic types use a static gradient.
 * Reduced-motion preferences disable animation while retaining the rendered background.
 */
export function advancedGradientBackground(
  target: AnimateTarget,
  options: AdvancedGradientOptions = {},
): AdvancedGradientControls {
  const {
    type = "mesh",
    colors: configuredColors = DEFAULT_COLORS,
    palette,
    speed = DEFAULT_SPEED,
    intensity = DEFAULT_INTENSITY,
    direction = DEFAULT_DIRECTION,
    opacity = DEFAULT_OPACITY,
    className,
    style,
  } = options;

  if (!["mesh", "aurora", "radial", "conic"].includes(type)) {
    throw new TypeError(`Unknown advanced gradient type "${String(type)}"`);
  }
  assertFinite("speed", speed, 0);
  assertFinite("intensity", intensity, 0, 1);
  assertFinite("direction", direction, Number.NEGATIVE_INFINITY);
  assertFinite("opacity", opacity, 0, 1);
  if (className !== undefined && typeof className !== "string") {
    throw new TypeError("className must be a string");
  }
  validateStyle(style);
  const selectedPaletteColors = paletteColors(palette);
  const initialColors = selectedPaletteColors ?? configuredColors;
  validateColors(initialColors);
  if (palette === "active") validateColors(configuredColors);
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("advancedGradientBackground() requires document.createElement");
  }

  const animationName = `af-motion-advanced-gradient-${++nextAnimationId}`;
  const stylesheet = createStylesheet(animationName, intensity, direction);
  const reducedMotion = prefersReducedMotion();
  const layers: HTMLDivElement[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;

  const render = (layer: HTMLDivElement, gradientColors: readonly string[]): void => {
    layer.style.setProperty("background-image", gradientImage(type, gradientColors, direction));
    const size = `${100 + intensity * 100}% ${100 + intensity * 100}%`;
    layer.style.setProperty("background-size", size);
  };
  const updateMotion = (reduced: boolean): void => {
    for (const layer of layers) {
      if (reduced || speed === 0 || (type !== "mesh" && type !== "aurora")) {
        layer.style.removeProperty("animation");
        layer.style.setProperty("will-change", "auto");
      } else {
        layer.style.setProperty("animation", `${animationName} ${speed}s ease-in-out infinite`);
        layer.style.setProperty("will-change", "transform");
      }
    }
  };

  try {
    for (const element of elements) {
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      if (className) layer.className = className;
      layer.style.setProperty("position", "absolute");
      layer.style.setProperty("inset", type === "aurora" ? "-20%" : "-8%");
      layer.style.setProperty("z-index", "-1");
      layer.style.setProperty("pointer-events", "none");
      layer.style.setProperty("opacity", String(opacity));
      if (type === "aurora") {
        layer.style.setProperty("filter", `blur(${Math.round(60 * intensity)}px)`);
      }
      render(layer, initialColors);
      for (const [property, value] of Object.entries(style ?? {})) {
        layer.style.setProperty(property, value);
      }
      acquireTarget(element);
      acquired.push(element);
      element.insertBefore(layer, element.firstChild);
      layers.push(layer);
    }
    updateMotion(reducedMotion);
  } catch (error) {
    for (const layer of layers) layer.parentElement?.removeChild(layer);
    for (const element of acquired) releaseTarget(element);
    stylesheet.parentElement?.removeChild(stylesheet);
    throw error;
  }

  const stopMotionListener = onReducedMotionChange(updateMotion);
  const stopPaletteListener = palette === "active"
    ? subscribeToPaletteChanges((activePalette) => {
        if (destroyed) return;
        const colors = activePalette
          ? [activePalette.tokens.primary, activePalette.tokens.secondary, activePalette.tokens.accent]
          : configuredColors;
        validateColors(colors);
        for (const layer of layers) render(layer, colors);
      })
    : () => undefined;

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopMotionListener();
      stopPaletteListener();
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
