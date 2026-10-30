import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import {
  acquireBackgroundTarget as acquireTarget,
  releaseBackgroundTarget as releaseTarget,
} from "./internal/canvas-lifecycle.js";

export interface WaveBackgroundOptions {
  /** CSS colors filled by the waves. Defaults to violet and cyan. */
  colors?: readonly string[];
  /** Vertical wave height in SVG units. Must be >= 0. Defaults to 30. */
  amplitude?: number;
  /** Number of wave cycles across the SVG width. Must be > 0 and <= 100. Defaults to 2. */
  frequency?: number;
  /** Duration of one animation cycle in seconds. Set to 0 for static waves. Defaults to 8. */
  speed?: number;
  /** Overlay opacity between 0 and 1. Defaults to 0.6. */
  opacity?: number;
}

export interface WaveBackgroundControls {
  /** Removes the waves, keyframes and temporary target styles. Safe to repeat. */
  destroy(): void;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4"] as const;
const DEFAULT_AMPLITUDE = 30;
const DEFAULT_FREQUENCY = 2;
const DEFAULT_SPEED_SECONDS = 8;
const DEFAULT_OPACITY = 0.6;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 300;

let nextAnimationId = 0;
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

function assertFinite(name: string, value: number, minimum: number, maximum = Number.POSITIVE_INFINITY): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    const range = maximum === Number.POSITIVE_INFINITY ? `>= ${minimum}` : `between ${minimum} and ${maximum}`;
    throw new RangeError(`${name} must be a finite number ${range}, received ${String(value)}`);
  }
}

function createWavePath(amplitude: number, frequency: number): string {
  const baseline = SVG_HEIGHT / 2;
  const points = Math.max(24, Math.ceil(frequency * 24));
  const segments: string[] = [`M 0 ${baseline}`];
  for (let index = 0; index <= points; index++) {
    const x = (SVG_WIDTH * index) / points;
    const y = baseline + Math.sin((Math.PI * 2 * frequency * index) / points) * amplitude;
    segments.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  segments.push(`L ${SVG_WIDTH} ${SVG_HEIGHT}`, `L 0 ${SVG_HEIGHT}`, "Z");
  return segments.join(" ");
}

function createStylesheet(animationName: string, amplitude: number): HTMLStyleElement {
  const styleElement = document.createElement("style");
  const shift = Math.max(1, amplitude);
  styleElement.textContent = `
@keyframes ${animationName} {
  0%, 100% { transform: translateY(-${shift}px); }
  50% { transform: translateY(${shift}px); }
}`;
  const parent = document.head ?? document.documentElement;
  if (!parent) throw new Error("waveBackground() requires a document head or document element");
  parent.appendChild(styleElement);
  return styleElement;
}

/**
 * Adds responsive SVG waves behind target content. Positive speed animates with CSS keyframes;
 * zero speed or a reduced-motion preference keeps the waves static.
 */
export function waveBackground(
  target: AnimateTarget,
  options: WaveBackgroundOptions = {},
): WaveBackgroundControls {
  const {
    colors = DEFAULT_COLORS,
    amplitude = DEFAULT_AMPLITUDE,
    frequency = DEFAULT_FREQUENCY,
    speed = DEFAULT_SPEED_SECONDS,
    opacity = DEFAULT_OPACITY,
  } = options;

  validateColors(colors);
  assertFinite("amplitude", amplitude, 0);
  assertFinite("frequency", frequency, Number.MIN_VALUE, 100);
  assertFinite("speed", speed, 0);
  assertFinite("opacity", opacity, 0, 1);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElementNS !== "function") {
    throw new Error("waveBackground() requires document.createElementNS, which is not available in this environment");
  }

  const animationName = `af-motion-wave-${++nextAnimationId}`;
  const stylesheet = createStylesheet(animationName, amplitude);
  const reducedMotion = prefersReducedMotion();
  const svgs: SVGSVGElement[] = [];
  const acquired: HTMLElement[] = [];
  let destroyed = false;
  const wavePath = createWavePath(amplitude, frequency);

  try {
    for (let index = 0; index < elements.length; index++) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("viewBox", `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`);
      svg.setAttribute("preserveAspectRatio", "none");
      svg.style.setProperty("position", "absolute");
      svg.style.setProperty("inset", "0");
      svg.style.setProperty("width", "100%");
      svg.style.setProperty("height", "100%");
      svg.style.setProperty("z-index", "-1");
      svg.style.setProperty("pointer-events", "none");
      svg.style.setProperty("overflow", "hidden");
      svg.style.setProperty("opacity", String(opacity));

      colors.forEach((color, waveIndex) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", wavePath);
        path.setAttribute("fill", color);
        path.style.setProperty("transform-box", "fill-box");
        path.style.setProperty("transform-origin", "center");
        if (speed > 0 && amplitude > 0 && !reducedMotion) {
          path.style.setProperty(
            "animation",
            `${animationName} ${speed}s ease-in-out ${-(speed * waveIndex) / colors.length}s infinite`,
          );
        }
        svg.appendChild(path);
      });

      const element = elements[index];
      if (!element) continue;
      acquireTarget(element);
      acquired.push(element);
      element.insertBefore(svg, element.firstChild);
      svgs.push(svg);
    }
  } catch (error) {
    for (const svg of svgs) svg.parentElement?.removeChild(svg);
    for (const element of acquired) releaseTarget(element);
    stylesheet.parentElement?.removeChild(stylesheet);
    throw error;
  }

  const stopMotionListener = onReducedMotionChange((reducedMotion) => {
    if (destroyed) return;
    for (const svg of svgs) {
      for (const path of Array.from(svg.children) as SVGPathElement[]) {
        if (reducedMotion || speed === 0 || amplitude === 0) path.style.removeProperty("animation");
        else {
          const waveIndex = Array.from(svg.children).indexOf(path);
          path.style.setProperty(
            "animation",
            `${animationName} ${speed}s ease-in-out ${-(speed * waveIndex) / colors.length}s infinite`,
          );
        }
      }
    }
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopMotionListener();
      for (let index = 0; index < svgs.length; index++) {
        const svg = svgs[index];
        const element = elements[index];
        if (!svg || !element) continue;
        if (svg.parentElement === element) element.removeChild(svg);
        releaseTarget(element);
      }
      stylesheet.parentElement?.removeChild(stylesheet);
    },
  };
}
