import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import {
  acquireBackgroundTarget as acquireTarget,
  createMotionFrameScheduler,
  releaseBackgroundCanvas,
  releaseBackgroundTarget as releaseTarget,
  resolveBackgroundColors as resolveColors,
  resizeCanvasToElement as setCanvasSize,
  subscribeToActiveBackgroundPalette,
  validateBackgroundColors as validateColors,
} from "./internal/canvas-lifecycle.js";

export type FluidBackgroundEffect =
  | "liquid-blobs"
  | "fluid-waves"
  | "liquid-gradient"
  | "ink-flow"
  | "metaballs";

export type FluidWaveDirection = "horizontal" | "vertical";

export interface FluidBackgroundBaseOptions {
  /** Visual treatment. Defaults to "liquid-blobs". */
  effect?: FluidBackgroundEffect;
  /** CSS colors for the effect, or palette primary/secondary/accent colors. */
  colors?: readonly string[];
  /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
  palette?: string;
  /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
  speed?: number;
  /** Overall effect intensity from 0 to 1. Defaults to 0.75. */
  intensity?: number;
}

export interface LiquidBlobsOptions extends FluidBackgroundBaseOptions {
  effect?: "liquid-blobs";
  /** Number of moving blobs from 1 to 32. Defaults to 5. */
  count?: number;
  /** Average blob radius in CSS pixels. Defaults to 100. */
  size?: number;
  /** Soft edge width in CSS pixels. Defaults to 32. */
  blur?: number;
}

export interface FluidWavesOptions extends FluidBackgroundBaseOptions {
  effect: "fluid-waves";
  /** Wave height in CSS pixels. Defaults to 36. */
  amplitude?: number;
  /** Number of wave cycles across the canvas. Defaults to 2.5. */
  frequency?: number;
  /** Axis along which the wave layers travel. Defaults to "horizontal". */
  direction?: FluidWaveDirection;
  /** Number of layered wave bands from 1 to 8. Defaults to 4. */
  layers?: number;
}

export interface LiquidGradientOptions extends FluidBackgroundBaseOptions {
  effect: "liquid-gradient";
  /** Number of softly blended color fields from 2 to 12. Defaults to 5. */
  count?: number;
  /** Field radius as a fraction of the canvas's longest side, from 0.1 to 1.5. Defaults to 0.65. */
  scale?: number;
}

export interface InkFlowOptions extends FluidBackgroundBaseOptions {
  effect: "ink-flow";
  /** Number of organic ink forms from 1 to 16. Defaults to 5. */
  count?: number;
  /** Average form radius in CSS pixels. Defaults to 80. */
  size?: number;
  /** Spread of each form as a fraction of the canvas, from 0.05 to 0.75. Defaults to 0.3. */
  spread?: number;
}

export interface MetaballsOptions extends FluidBackgroundBaseOptions {
  effect: "metaballs";
  /** Number of moving blobs from 1 to 24. Defaults to 6. */
  count?: number;
  /** Average blob radius in CSS pixels. Defaults to 64. */
  radius?: number;
  /** Link proximity multiplier from 1 to 4. Defaults to 1.8. */
  threshold?: number;
  /** Motion range multiplier from 0 to 2. Defaults to 1. */
  movement?: number;
}

export type FluidBackgroundOptions =
  | LiquidBlobsOptions
  | FluidWavesOptions
  | LiquidGradientOptions
  | InkFlowOptions
  | MetaballsOptions
  | FluidBackgroundBaseOptions;

export interface FluidBackgroundControls {
  /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
  destroy(): void;
}

interface FluidShape {
  readonly x: number;
  readonly y: number;
  readonly phase: number;
  readonly scale: number;
  readonly colorIndex: number;
}

interface FluidCanvasState {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  width: number;
  height: number;
  phase: number;
  shapes: FluidShape[];
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b"] as const;
const DEFAULT_SPEED = 1;
const DEFAULT_INTENSITY = 0.75;
const MAX_GRADIENT_FIELDS = 12;

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

function assertInteger(name: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}, received ${String(value)}`);
  }
}

function createShapes(count: number): FluidShape[] {
  return Array.from({ length: count }, (_, index) => ({
    x: (index * 0.61803398875 + 0.19) % 1,
    y: (index * 0.75487766625 + 0.31) % 1,
    phase: index * 2.399963229728653,
    scale: 0.68 + ((index * 19) % 13) / 20,
    colorIndex: index,
  }));
}

function radialField(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  softEdge: number,
): CanvasGradient {
  const gradient = context.createRadialGradient(x, y, radius * Math.max(0, 1 - softEdge), x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(Math.max(0.05, 1 - softEdge * 0.6), color);
  gradient.addColorStop(1, "transparent");
  return gradient;
}

function drawBlobs(
  state: FluidCanvasState,
  colors: readonly string[],
  options: LiquidBlobsOptions,
  phase: number,
  intensity: number,
): void {
  const { context, width, height } = state;
  const count = options.count ?? 5;
  const size = options.size ?? 100;
  const blur = options.blur ?? 32;
  for (let index = 0; index < count; index++) {
    const shape = state.shapes[index];
    if (!shape) continue;
    const x = (shape.x + Math.sin(phase * 0.27 + shape.phase) * 0.1) * width;
    const y = (shape.y + Math.cos(phase * 0.22 + shape.phase) * 0.12) * height;
    const radius = size * shape.scale * (1 + Math.sin(phase * 0.3 + shape.phase) * 0.08);
    const color = colors[shape.colorIndex % colors.length] ?? colors[0] ?? "#fff";
    context.globalAlpha = intensity * 0.85;
    context.fillStyle = radialField(context, x, y, radius + blur, color, Math.min(0.98, blur / Math.max(radius + blur, 1)));
    context.beginPath();
    context.arc(x, y, radius + blur, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = intensity * 0.45;
    context.fillStyle = radialField(context, x, y, radius, color, 0.9);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawWaves(
  state: FluidCanvasState,
  colors: readonly string[],
  options: FluidWavesOptions,
  phase: number,
  intensity: number,
): void {
  const { context, width, height } = state;
  const amplitude = options.amplitude ?? 36;
  const frequency = options.frequency ?? 2.5;
  const direction = options.direction ?? "horizontal";
  const layers = options.layers ?? 4;
  for (let layer = 0; layer < layers; layer++) {
    const color = colors[layer % colors.length] ?? colors[0] ?? "#fff";
    const offset = (layer / layers) * Math.PI * 2;
    const amplitudeScale = 1 - layer / (layers * 1.6);
    context.globalAlpha = intensity * (0.22 + (1 - layer / layers) * 0.24);
    context.fillStyle = color;
    context.beginPath();
    if (direction === "horizontal") {
      const base = height * (0.42 + layer * 0.13);
      context.moveTo(0, base);
      for (let step = 0; step <= 40; step++) {
        const x = (step / 40) * width;
        const y = base + Math.sin((step / 40) * Math.PI * 2 * frequency + phase + offset) * amplitude * amplitudeScale;
        context.lineTo(x, y);
      }
      context.lineTo(width, height);
      context.lineTo(0, height);
    } else {
      const base = width * (0.42 + layer * 0.13);
      context.moveTo(base, 0);
      for (let step = 0; step <= 40; step++) {
        const y = (step / 40) * height;
        const x = base + Math.sin((step / 40) * Math.PI * 2 * frequency + phase + offset) * amplitude * amplitudeScale;
        context.lineTo(x, y);
      }
      context.lineTo(width, height);
      context.lineTo(width, 0);
    }
    context.closePath();
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawLiquidGradient(
  state: FluidCanvasState,
  colors: readonly string[],
  options: LiquidGradientOptions,
  phase: number,
  intensity: number,
): void {
  const { context, width, height } = state;
  const count = options.count ?? 5;
  const scale = options.scale ?? 0.65;
  const radius = Math.max(width, height) * scale;
  for (let index = 0; index < count; index++) {
    const shape = state.shapes[index];
    if (!shape) continue;
    const x = (shape.x + Math.sin(phase * 0.13 + shape.phase) * 0.14) * width;
    const y = (shape.y + Math.cos(phase * 0.11 + shape.phase) * 0.14) * height;
    const color = colors[shape.colorIndex % colors.length] ?? colors[0] ?? "#fff";
    context.globalAlpha = intensity * (0.32 + shape.scale * 0.12);
    context.fillStyle = radialField(context, x, y, radius * shape.scale, color, 0.94);
    context.fillRect(0, 0, width, height);
  }
  context.globalAlpha = 1;
}

function drawInkFlow(
  state: FluidCanvasState,
  colors: readonly string[],
  options: InkFlowOptions,
  phase: number,
  intensity: number,
): void {
  const { context, width, height } = state;
  const count = options.count ?? 5;
  const size = options.size ?? 80;
  const spread = options.spread ?? 0.3;
  for (let index = 0; index < count; index++) {
    const shape = state.shapes[index];
    if (!shape) continue;
    const x = (shape.x + Math.sin(phase * 0.09 + shape.phase) * spread * 0.35) * width;
    const y = (shape.y + Math.cos(phase * 0.1 + shape.phase) * spread * 0.35) * height;
    const radius = size * shape.scale;
    const color = colors[shape.colorIndex % colors.length] ?? colors[0] ?? "#fff";
    const gradient = radialField(context, x, y, radius * (1 + spread), color, 0.86);
    context.globalAlpha = intensity * 0.62;
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(x, y - radius);
    context.bezierCurveTo(x + radius * 1.4, y - radius * 1.1, x + radius * 1.5, y + radius * 0.35, x + radius * 0.2, y + radius);
    context.bezierCurveTo(x - radius * 0.6, y + radius * 1.5, x - radius * 1.3, y + radius * 0.65, x - radius, y - radius * 0.1);
    context.bezierCurveTo(x - radius * 1.35, y - radius * 0.8, x - radius * 0.35, y - radius * 1.25, x, y - radius);
    context.closePath();
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawMetaballs(
  state: FluidCanvasState,
  colors: readonly string[],
  options: MetaballsOptions,
  phase: number,
  intensity: number,
): void {
  const { context, width, height } = state;
  const count = options.count ?? 6;
  const radius = options.radius ?? 64;
  const threshold = options.threshold ?? 1.8;
  const movement = options.movement ?? 1;
  const blobs = state.shapes.slice(0, count).map((shape) => ({
    x: (shape.x + Math.sin(phase * 0.2 + shape.phase) * 0.12 * movement) * width,
    y: (shape.y + Math.cos(phase * 0.17 + shape.phase) * 0.12 * movement) * height,
    radius: radius * shape.scale,
    shape,
  }));
  context.globalAlpha = intensity * 0.5;
  for (let first = 0; first < blobs.length; first++) {
    const a = blobs[first];
    if (!a) continue;
    for (let second = first + 1; second < blobs.length; second++) {
      const b = blobs[second];
      if (!b) continue;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const linkDistance = (a.radius + b.radius) * threshold;
      if (distance >= linkDistance || distance < 1) continue;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const offsetA = a.radius * 0.62;
      const offsetB = b.radius * 0.62;
      const nx = Math.cos(angle + Math.PI / 2);
      const ny = Math.sin(angle + Math.PI / 2);
      context.fillStyle = colors[a.shape.colorIndex % colors.length] ?? colors[0] ?? "#fff";
      context.beginPath();
      context.moveTo(a.x + nx * offsetA, a.y + ny * offsetA);
      context.bezierCurveTo(
        a.x + (b.x - a.x) * 0.35 + nx * offsetA,
        a.y + (b.y - a.y) * 0.35 + ny * offsetA,
        b.x - (b.x - a.x) * 0.35 + nx * offsetB,
        b.y - (b.y - a.y) * 0.35 + ny * offsetB,
        b.x + nx * offsetB,
        b.y + ny * offsetB,
      );
      context.lineTo(b.x - nx * offsetB, b.y - ny * offsetB);
      context.bezierCurveTo(
        b.x - (b.x - a.x) * 0.35 - nx * offsetB,
        b.y - (b.y - a.y) * 0.35 - ny * offsetB,
        a.x + (b.x - a.x) * 0.35 - nx * offsetA,
        a.y + (b.y - a.y) * 0.35 - ny * offsetA,
        a.x - nx * offsetA,
        a.y - ny * offsetA,
      );
      context.closePath();
      context.fill();
    }
  }
  for (const blob of blobs) {
    const color = colors[blob.shape.colorIndex % colors.length] ?? colors[0] ?? "#fff";
    context.globalAlpha = intensity * 0.8;
    context.fillStyle = radialField(context, blob.x, blob.y, blob.radius, color, 0.72);
    context.beginPath();
    context.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function render(
  state: FluidCanvasState,
  effect: FluidBackgroundEffect,
  colors: readonly string[],
  options: FluidBackgroundOptions,
): void {
  state.context.clearRect(0, 0, state.width, state.height);
  const phase = state.phase;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  if (effect === "liquid-blobs") {
    drawBlobs(state, colors, options as LiquidBlobsOptions, phase, intensity);
  } else if (effect === "fluid-waves") {
    drawWaves(state, colors, options as FluidWavesOptions, phase, intensity);
  } else if (effect === "liquid-gradient") {
    drawLiquidGradient(state, colors, options as LiquidGradientOptions, phase, intensity);
  } else if (effect === "ink-flow") {
    drawInkFlow(state, colors, options as InkFlowOptions, phase, intensity);
  } else {
    drawMetaballs(state, colors, options as MetaballsOptions, phase, intensity);
  }
  state.context.globalAlpha = 1;
}

function validateOptions(options: FluidBackgroundOptions, effect: FluidBackgroundEffect): void {
  assertFinite("speed", options.speed ?? DEFAULT_SPEED, 0);
  assertFinite("intensity", options.intensity ?? DEFAULT_INTENSITY, 0, 1);
  if (effect === "liquid-blobs") {
    const blobs = options as LiquidBlobsOptions;
    assertInteger("count", blobs.count ?? 5, 1, 32);
    assertFinite("size", blobs.size ?? 100, Number.MIN_VALUE);
    assertFinite("blur", blobs.blur ?? 32, 0, 160);
  } else if (effect === "fluid-waves") {
    const waves = options as FluidWavesOptions;
    assertFinite("amplitude", waves.amplitude ?? 36, 0);
    assertFinite("frequency", waves.frequency ?? 2.5, Number.MIN_VALUE, 20);
    assertInteger("layers", waves.layers ?? 4, 1, 8);
    if (waves.direction !== undefined && waves.direction !== "horizontal" && waves.direction !== "vertical") {
      throw new TypeError(`direction must be "horizontal" or "vertical", received "${String(waves.direction)}"`);
    }
  } else if (effect === "liquid-gradient") {
    const gradient = options as LiquidGradientOptions;
    assertInteger("count", gradient.count ?? 5, 2, MAX_GRADIENT_FIELDS);
    assertFinite("scale", gradient.scale ?? 0.65, 0.1, 1.5);
  } else if (effect === "ink-flow") {
    const ink = options as InkFlowOptions;
    assertInteger("count", ink.count ?? 5, 1, 16);
    assertFinite("size", ink.size ?? 80, Number.MIN_VALUE);
    assertFinite("spread", ink.spread ?? 0.3, 0.05, 0.75);
  } else {
    const metaballs = options as MetaballsOptions;
    assertInteger("count", metaballs.count ?? 6, 1, 24);
    assertFinite("radius", metaballs.radius ?? 64, Number.MIN_VALUE);
    assertFinite("threshold", metaballs.threshold ?? 1.8, 1, 4);
    assertFinite("movement", metaballs.movement ?? 1, 0, 2);
  }
}

function getShapeCount(effect: FluidBackgroundEffect, options: FluidBackgroundOptions): number {
  if (effect === "liquid-blobs" || effect === "liquid-gradient" || effect === "ink-flow" || effect === "metaballs") {
    return (options as LiquidBlobsOptions | LiquidGradientOptions | InkFlowOptions | MetaballsOptions).count
      ?? (effect === "liquid-gradient" ? 5 : effect === "metaballs" ? 6 : 5);
  }
  return 0;
}

/**
 * Draws efficient layered Canvas fluid effects without per-pixel simulation.
 * The API shares palette, resize, reduced-motion, visibility, and cleanup handling.
 */
export function fluidBackground(
  target: AnimateTarget,
  options: FluidBackgroundOptions = {},
): FluidBackgroundControls {
  const effect = options.effect ?? "liquid-blobs";
  if (!["liquid-blobs", "fluid-waves", "liquid-gradient", "ink-flow", "metaballs"].includes(effect)) {
    throw new TypeError(`Unknown fluid background effect "${String(effect)}"`);
  }
  validateOptions(options, effect);
  const configuredColors = options.colors ?? DEFAULT_COLORS;
  validateColors(configuredColors);
  let currentColors = resolveColors(options.palette, configuredColors);
  validateColors(currentColors);
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("fluidBackground() requires document.createElement");
  }
  const speed = options.speed ?? DEFAULT_SPEED;

  const states: FluidCanvasState[] = [];
  try {
    for (const element of elements) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("fluidBackground() requires a canvas with a 2D rendering context");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.setProperty("position", "absolute");
      canvas.style.setProperty("inset", "0");
      canvas.style.setProperty("width", "100%");
      canvas.style.setProperty("height", "100%");
      canvas.style.setProperty("display", "block");
      canvas.style.setProperty("z-index", "-1");
      canvas.style.setProperty("pointer-events", "none");
      const rect = element.getBoundingClientRect();
      const shapeCount = getShapeCount(effect, options);
      const state: FluidCanvasState = {
        element,
        canvas,
        context,
        width: 0,
        height: 0,
        phase: 0,
        shapes: createShapes(shapeCount),
      };
      setCanvasSize(state, rect.width, rect.height);
      states.push(state);
    }
  } catch (error) {
    for (const state of states) {
      state.canvas.parentElement?.removeChild(state.canvas);
      releaseBackgroundCanvas(state.canvas);
    }
    throw error;
  }

  let destroyed = false;
  const animated = speed > 0;

  const drawScene = (state: FluidCanvasState): void => render(state, effect, currentColors, options);
  const scheduler = createMotionFrameScheduler<FluidCanvasState>({
    speed,
    animated,
    errorName: "fluidBackground()",
    renderStatic: () => states.forEach(drawScene),
    update: (state, elapsed) => {
      state.phase += elapsed;
      drawScene(state);
    },
  });

  let intersectionObserver: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  try {
    if (typeof IntersectionObserver === "function") {
      intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const state = states.find((candidate) => candidate.element === entry.target);
          if (state) scheduler.setVisible(state, entry.isIntersecting);
        }
      });
    } else {
      for (const state of states) scheduler.setVisible(state, true);
    }
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver((entries) => {
        if (destroyed) return;
        for (const entry of entries) {
          const state = states.find((candidate) => candidate.element === entry.target);
          if (!state) continue;
          setCanvasSize(state, entry.contentRect.width, entry.contentRect.height);
          drawScene(state);
        }
      });
    }
  } catch (error) {
    scheduler.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    throw error;
  }
  const onWindowResize = (): void => {
    if (destroyed) return;
    for (const state of states) {
      const rect = state.element.getBoundingClientRect();
      setCanvasSize(state, rect.width, rect.height);
      drawScene(state);
    }
  };
  const hasWindowResize = !resizeObserver && typeof window !== "undefined";
  if (hasWindowResize) window.addEventListener("resize", onWindowResize);

  const acquired: HTMLElement[] = [];
  const inserted: FluidCanvasState[] = [];
  try {
    for (const state of states) {
      acquireTarget(state.element);
      acquired.push(state.element);
      state.element.insertBefore(state.canvas, state.element.firstChild);
      inserted.push(state);
      intersectionObserver?.observe(state.element);
      resizeObserver?.observe(state.element);
      drawScene(state);
    }
  } catch (error) {
    scheduler.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
    for (const state of inserted) {
      if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  const stopPaletteListener = subscribeToActiveBackgroundPalette(options.palette, configuredColors, (colors) => {
    if (destroyed) return;
    currentColors = colors;
    validateColors(currentColors);
    for (const state of states) drawScene(state);
  });

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      scheduler.destroy();
      stopPaletteListener();
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
      for (const state of states) {
        if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
        releaseBackgroundCanvas(state.canvas);
        releaseTarget(state.element);
      }
    },
  };
}
