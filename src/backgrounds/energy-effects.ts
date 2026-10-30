import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import {
  acquireBackgroundTarget,
  createMotionFrameScheduler,
  releaseBackgroundTarget,
  releaseBackgroundCanvas,
  resolveBackgroundColors,
  resizeCanvasToElement,
  subscribeToActiveBackgroundPalette,
  validateBackgroundColors,
} from "./internal/canvas-lifecycle.js";
import type { CanvasBackgroundState } from "./internal/canvas-lifecycle.js";

export type EnergyBackgroundEffect = "lightning" | "plasma-field" | "laser-beams" | "energy-pulse" | "electric-arcs";

export interface EnergyBackgroundBaseOptions {
  /** Visual treatment. Defaults to "lightning". */
  effect?: EnergyBackgroundEffect;
  /** CSS colors for the effect, or palette primary/secondary/accent colors. */
  colors?: readonly string[];
  /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
  palette?: string;
  /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
  speed?: number;
  /** Overall effect intensity from 0 to 1. Defaults to 0.75. */
  intensity?: number;
}

export interface LightningOptions extends EnergyBackgroundBaseOptions {
  effect?: "lightning";
  /** Electrical strikes per minute. Defaults to 12. */
  frequency?: number;
  /** Branches per bolt from 0 to 12. Defaults to 4. */
  branchCount?: number;
  /** Bolt brightness from 0 to 1. Defaults to 1. */
  brightness?: number;
}

export interface PlasmaFieldOptions extends EnergyBackgroundBaseOptions {
  effect: "plasma-field";
  /** Number of flowing colour formations from 2 to 10. Defaults to 5. */
  formationCount?: number;
  /** Formation scale relative to the canvas from 0.1 to 1. Defaults to 0.55. */
  scale?: number;
}

export interface LaserBeamsOptions extends EnergyBackgroundBaseOptions {
  effect: "laser-beams";
  /** Number of beams from 1 to 32. Defaults to 8. */
  count?: number;
  /** Beam angle in degrees from -80 to 80. Defaults to -12. */
  angle?: number;
  /** Glow radius in CSS pixels from 0 to 80. Defaults to 18. */
  glow?: number;
  /** Beam width in CSS pixels from 0.25 to 12. Defaults to 2. */
  width?: number;
  /** Maximum beam sweep in degrees from 0 to 45. Defaults to 8. */
  movement?: number;
}

export interface EnergyPulseOptions extends EnergyBackgroundBaseOptions {
  effect: "energy-pulse";
  /** Normalized pulse origin within the target. Defaults to { x: 0.5, y: 0.5 }. */
  origin?: Readonly<{ x: number; y: number }>;
  /** Seconds between expanding pulses. Defaults to 1.8. */
  interval?: number;
  /** Ring expansion speed in CSS pixels per second. Defaults to 220. */
  pulseSpeed?: number;
  /** Ring line width in CSS pixels. Defaults to 3. */
  width?: number;
}

export interface ElectricArcsOptions extends EnergyBackgroundBaseOptions {
  effect: "electric-arcs";
  /** Arc paths per 10,000 CSS square pixels, capped at 64 per target. Defaults to 8. */
  density?: number;
  /** Arc flicker intensity from 0 to 1. Defaults to 0.65. */
  flicker?: number;
  /** Branches per arc from 0 to 8. Defaults to 2. */
  branchCount?: number;
  /** Arc stroke width in CSS pixels. Defaults to 1.5. */
  width?: number;
}

export type EnergyBackgroundOptions =
  | LightningOptions
  | PlasmaFieldOptions
  | LaserBeamsOptions
  | EnergyPulseOptions
  | ElectricArcsOptions
  | EnergyBackgroundBaseOptions;

export interface EnergyBackgroundControls {
  /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
  destroy(): void;
}

interface Point {
  x: number;
  y: number;
}

interface PulseRing {
  age: number;
}

interface EnergyState extends CanvasBackgroundState {
  elapsed: number;
  particles: Point[];
  rings: PulseRing[];
  lightningAge: number;
  nextLightning: number;
  nextPulse: number;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4", "#ec4899"] as const;
const DEFAULT_SPEED = 1;
const DEFAULT_INTENSITY = 0.75;
const MAX_ARCS = 64;

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

function seeded(index: number, salt: number): number {
  const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function createPoints(count: number, width: number, height: number): Point[] {
  return Array.from({ length: count }, (_, index) => ({
    x: seeded(index, 1) * width,
    y: seeded(index, 2) * height,
  }));
}

function createBolt(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  endX: number,
  endY: number,
  segments: number,
  displacement: number,
  seed: number,
): Point[] {
  const points: Point[] = [{ x, y }];
  const dx = (endX - x) / segments;
  const dy = (endY - y) / segments;
  for (let index = 1; index < segments; index++) {
    const jitter = (seeded(seed + index, 7) - 0.5) * 2 * displacement;
    points.push({ x: x + dx * index + jitter, y: y + dy * index });
  }
  points.push({ x: endX, y: endY });
  return points;
}

function drawLightning(
  state: EnergyState,
  color: string,
  options: LightningOptions,
): void {
  const { context, width, height, elapsed } = state;
  const age = state.lightningAge;
  if (age < 0 || age > 0.32) return;
  const brightness = (options.brightness ?? 1) * (1 - age / 0.32);
  const branchCount = options.branchCount ?? 4;
  const startX = width * (0.25 + seeded(Math.floor(elapsed * 4), 3) * 0.5);
  const endY = height * (0.65 + seeded(Math.floor(elapsed * 4), 4) * 0.3);
  const bolt = createBolt(context, startX, 0, startX + (seeded(Math.floor(elapsed * 4), 5) - 0.5) * width * 0.35, endY, 12, Math.min(width, height) * 0.09, Math.floor(elapsed * 4));
  context.globalAlpha = brightness * (options.intensity ?? DEFAULT_INTENSITY);
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.shadowColor = color;
  context.shadowBlur = 18 * brightness;
  context.beginPath();
  context.moveTo(bolt[0]?.x ?? 0, bolt[0]?.y ?? 0);
  for (const point of bolt.slice(1)) context.lineTo(point.x, point.y);
  context.stroke();
  for (let branch = 0; branch < branchCount; branch++) {
    const start = bolt[2 + (branch * 2) % Math.max(1, bolt.length - 3)];
    if (!start) continue;
    const branchEnd = {
      x: start.x + (seeded(branch, Math.floor(elapsed * 4) + 10) - 0.5) * width * 0.28,
      y: start.y + height * (0.08 + seeded(branch, 11) * 0.2),
    };
    const branchPoints = createBolt(context, start.x, start.y, branchEnd.x, branchEnd.y, 5, Math.min(width, height) * 0.035, branch);
    context.beginPath();
    context.moveTo(branchPoints[0]?.x ?? start.x, branchPoints[0]?.y ?? start.y);
    for (const point of branchPoints.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
  }
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function drawPlasma(
  state: EnergyState,
  colors: readonly string[],
  options: PlasmaFieldOptions,
): void {
  const { context, width, height, elapsed } = state;
  const count = options.formationCount ?? 5;
  const radius = Math.max(width, height) * (options.scale ?? 0.55);
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  context.clearRect(0, 0, width, height);
  for (let index = 0; index < count; index++) {
    const x = (0.5 + Math.sin(elapsed * 0.25 + index * 2.3) * 0.38) * width;
    const y = (0.5 + Math.cos(elapsed * 0.21 + index * 1.7) * 0.38) * height;
    const gradient = context.createRadialGradient(x, y, radius * 0.05, x, y, radius);
    const color = colors[index % colors.length] ?? colors[0] ?? "#fff";
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.35, color);
    gradient.addColorStop(1, "transparent");
    context.globalAlpha = intensity * 0.38;
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, radius * (0.7 + 0.1 * Math.sin(elapsed + index)), radius * 0.34, elapsed * 0.12 + index, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawLaserBeams(
  state: EnergyState,
  colors: readonly string[],
  options: LaserBeamsOptions,
): void {
  const { context, width, height, elapsed } = state;
  const count = options.count ?? 8;
  const baseAngle = ((options.angle ?? -12) * Math.PI) / 180;
  const movement = options.movement ?? 8;
  const glow = options.glow ?? 18;
  const lineWidth = options.width ?? 2;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  context.clearRect(0, 0, width, height);
  for (let index = 0; index < count; index++) {
    const beamAngle = baseAngle + Math.sin(elapsed * 0.35 + index * 1.7) * (movement * Math.PI / 180);
    const centerY = (index + 1) / (count + 1) * height;
    const x1 = width * 0.08;
    const y1 = centerY - Math.tan(beamAngle) * width * 0.08;
    const x2 = width * 0.92;
    const y2 = centerY + Math.tan(beamAngle) * width * 0.82;
    const color = colors[index % colors.length] ?? colors[0] ?? "#fff";
    context.globalAlpha = intensity * 0.28;
    context.strokeStyle = color;
    context.lineWidth = lineWidth + glow * 0.35;
    context.shadowColor = color;
    context.shadowBlur = glow;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.globalAlpha = intensity;
    context.lineWidth = lineWidth;
    context.shadowBlur = glow * 0.35;
    context.stroke();
  }
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function drawPulse(
  state: EnergyState,
  color: string,
  options: EnergyPulseOptions,
): void {
  const { context, width, height, rings } = state;
  const origin = options.origin ?? { x: 0.5, y: 0.5 };
  const pulseSpeed = options.pulseSpeed ?? 220;
  const lineWidth = options.width ?? 3;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  const x = origin.x * width;
  const y = origin.y * height;
  const maxRadius = Math.hypot(width, height);
  context.clearRect(0, 0, width, height);
  context.strokeStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 14;
  for (const ring of rings) {
    const radius = ring.age * pulseSpeed;
    if (radius > maxRadius) continue;
    context.globalAlpha = intensity * Math.max(0, 1 - radius / maxRadius);
    context.lineWidth = lineWidth * Math.max(0.4, 1 - radius / maxRadius * 0.6);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function drawElectricArcs(
  state: EnergyState,
  colors: readonly string[],
  options: ElectricArcsOptions,
): void {
  const { context, width, height, particles, elapsed } = state;
  const density = options.density ?? 8;
  const flicker = options.flicker ?? 0.65;
  const branchCount = options.branchCount ?? 2;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  const lineWidth = options.width ?? 1.5;
  context.clearRect(0, 0, width, height);
  context.shadowBlur = 8;
  for (let index = 0; index < density; index++) {
    const a = particles[index * 2];
    const b = particles[index * 2 + 1];
    if (!a || !b) continue;
    const pulse = 1 - flicker * (0.5 + 0.5 * Math.sin(elapsed * 18 + index * 2.1));
    const color = colors[index % colors.length] ?? colors[0] ?? "#fff";
    const segments = 8;
    const points = createBolt(
      context,
      a.x + Math.sin(elapsed * 0.4 + index) * 14,
      a.y + Math.cos(elapsed * 0.35 + index) * 14,
      b.x + Math.cos(elapsed * 0.3 + index) * 14,
      b.y + Math.sin(elapsed * 0.45 + index) * 14,
      segments,
      Math.min(width, height) * (0.018 + flicker * pulse * 0.03),
      index + Math.floor(elapsed * 8),
    );
    context.globalAlpha = intensity * pulse;
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.shadowColor = color;
    context.beginPath();
    context.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.stroke();
    for (let branch = 0; branch < branchCount; branch++) {
      const start = points[2 + branch * 2];
      if (!start) continue;
      const endX = start.x + (seeded(index, branch + Math.floor(elapsed * 8)) - 0.5) * width * 0.22;
      const endY = start.y + (seeded(branch, index + 29) - 0.5) * height * 0.24;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(endX, endY);
      context.stroke();
    }
  }
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function render(state: EnergyState, effect: EnergyBackgroundEffect, colors: readonly string[], options: EnergyBackgroundOptions): void {
  const color = colors[0] ?? "#fff";
  if (effect === "lightning") drawLightning(state, color, options as LightningOptions);
  else if (effect === "plasma-field") drawPlasma(state, colors, options as PlasmaFieldOptions);
  else if (effect === "laser-beams") drawLaserBeams(state, colors, options as LaserBeamsOptions);
  else if (effect === "energy-pulse") drawPulse(state, color, options as EnergyPulseOptions);
  else drawElectricArcs(state, colors, options as ElectricArcsOptions);
}

function validateOptions(options: EnergyBackgroundOptions, effect: EnergyBackgroundEffect): void {
  assertFinite("speed", options.speed ?? DEFAULT_SPEED, 0);
  assertFinite("intensity", options.intensity ?? DEFAULT_INTENSITY, 0, 1);
  if (effect === "lightning") {
    const lightning = options as LightningOptions;
    assertFinite("frequency", lightning.frequency ?? 12, 0);
    assertInteger("branchCount", lightning.branchCount ?? 4, 0, 12);
    assertFinite("brightness", lightning.brightness ?? 1, 0, 1);
  } else if (effect === "plasma-field") {
    const plasma = options as PlasmaFieldOptions;
    assertInteger("formationCount", plasma.formationCount ?? 5, 2, 10);
    assertFinite("scale", plasma.scale ?? 0.55, 0.1, 1);
  } else if (effect === "laser-beams") {
    const lasers = options as LaserBeamsOptions;
    assertInteger("count", lasers.count ?? 8, 1, 32);
    assertFinite("angle", lasers.angle ?? -12, -80, 80);
    assertFinite("glow", lasers.glow ?? 18, 0, 80);
    assertFinite("width", lasers.width ?? 2, 0.25, 12);
    assertFinite("movement", lasers.movement ?? 8, 0, 45);
  } else if (effect === "energy-pulse") {
    const pulse = options as EnergyPulseOptions;
    const origin = pulse.origin ?? { x: 0.5, y: 0.5 };
    if (origin === null || typeof origin !== "object") throw new TypeError("origin must contain normalized x and y values");
    assertFinite("origin.x", origin.x, 0, 1);
    assertFinite("origin.y", origin.y, 0, 1);
    assertFinite("interval", pulse.interval ?? 1.8, Number.MIN_VALUE);
    assertFinite("pulseSpeed", pulse.pulseSpeed ?? 220, Number.MIN_VALUE);
    assertFinite("width", pulse.width ?? 3, 0.25, 16);
  } else {
    const arcs = options as ElectricArcsOptions;
    assertFinite("density", arcs.density ?? 8, Number.MIN_VALUE, MAX_ARCS);
    assertFinite("flicker", arcs.flicker ?? 0.65, 0, 1);
    assertInteger("branchCount", arcs.branchCount ?? 2, 0, 8);
    assertFinite("width", arcs.width ?? 1.5, 0.25, 12);
  }
}

function particleCount(density: number, width: number, height: number): number {
  return Math.min(MAX_ARCS * 2, Math.max(2, Math.round(width * height / 10_000 * density) * 2));
}

function eventInterval(effect: EnergyBackgroundEffect, options: EnergyBackgroundOptions): number {
  if (effect === "lightning") {
    const frequency = (options as LightningOptions).frequency ?? 12;
    return frequency === 0 ? Number.POSITIVE_INFINITY : 60 / frequency;
  }
  if (effect === "energy-pulse") return (options as EnergyPulseOptions).interval ?? 1.8;
  return Number.POSITIVE_INFINITY;
}

/**
 * Renders Canvas energy effects with bounded path/gradient work and shared
 * palette-aware, responsive, reduced-motion-safe lifecycle management.
 */
export function energyBackground(
  target: AnimateTarget,
  options: EnergyBackgroundOptions = {},
): EnergyBackgroundControls {
  const effect = options.effect ?? "lightning";
  if (!["lightning", "plasma-field", "laser-beams", "energy-pulse", "electric-arcs"].includes(effect)) {
    throw new TypeError(`Unknown energy background effect "${String(effect)}"`);
  }
  validateOptions(options, effect);
  const configuredColors = options.colors ?? DEFAULT_COLORS;
  validateBackgroundColors(configuredColors);
  let currentColors = resolveBackgroundColors(options.palette, configuredColors);
  validateBackgroundColors(currentColors);
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("energyBackground() requires document.createElement");
  }

  const states: EnergyState[] = [];
  try {
    for (const element of elements) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("energyBackground() requires a canvas with a 2D rendering context");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.setProperty("position", "absolute");
      canvas.style.setProperty("inset", "0");
      canvas.style.setProperty("width", "100%");
      canvas.style.setProperty("height", "100%");
      canvas.style.setProperty("display", "block");
      canvas.style.setProperty("z-index", "-1");
      canvas.style.setProperty("pointer-events", "none");
      const rect = element.getBoundingClientRect();
      const state: EnergyState = {
        element,
        canvas,
        context,
        width: 0,
        height: 0,
        elapsed: 0,
        particles: [],
        rings: effect === "energy-pulse" ? [{ age: 0.35 }] : [],
        lightningAge: effect === "lightning" && (options as LightningOptions).frequency !== 0 ? 0 : -1,
        nextLightning: eventInterval(effect, options),
        nextPulse: (options as EnergyPulseOptions).interval ?? 1.8,
      };
      resizeCanvasToElement(state, rect.width, rect.height);
      if (effect === "electric-arcs") {
        state.particles = createPoints(particleCount((options as ElectricArcsOptions).density ?? 8, rect.width, rect.height), rect.width, rect.height);
      }
      states.push(state);
    }
  } catch (error) {
    for (const state of states) {
      state.canvas.parentElement?.removeChild(state.canvas);
      releaseBackgroundCanvas(state.canvas);
    }
    throw error;
  }

  const speed = options.speed ?? DEFAULT_SPEED;
  const interval = eventInterval(effect, options);
  const drawScene = (state: EnergyState): void => render(state, effect, currentColors, options);
  const scheduler = createMotionFrameScheduler<EnergyState>({
    speed,
    animated: true,
    errorName: "energyBackground()",
    renderStatic: () => states.forEach(drawScene),
    update: (state, elapsed) => {
      state.elapsed += elapsed;
      if (effect === "lightning") {
        state.lightningAge += elapsed;
        if (state.elapsed >= state.nextLightning && interval !== Number.POSITIVE_INFINITY) {
          state.lightningAge = 0;
          state.nextLightning = state.elapsed + interval;
        }
      } else if (effect === "energy-pulse") {
        for (const ring of state.rings) ring.age += elapsed;
        if (state.elapsed >= state.nextPulse) {
          state.rings.push({ age: 0 });
          state.nextPulse = state.elapsed + interval;
        }
        state.rings = state.rings.filter((ring) => ring.age * ((options as EnergyPulseOptions).pulseSpeed ?? 220) <= Math.hypot(state.width, state.height));
      }
      drawScene(state);
    },
  });

  let destroyed = false;
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
          resizeCanvasToElement(state, entry.contentRect.width, entry.contentRect.height);
          if (effect === "electric-arcs") {
            state.particles = createPoints(particleCount((options as ElectricArcsOptions).density ?? 8, state.width, state.height), state.width, state.height);
          }
          state.rings = effect === "energy-pulse" ? [{ age: 0.35 }] : [];
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
      resizeCanvasToElement(state, rect.width, rect.height);
      if (effect === "electric-arcs") {
        state.particles = createPoints(particleCount((options as ElectricArcsOptions).density ?? 8, state.width, state.height), state.width, state.height);
      }
      state.rings = effect === "energy-pulse" ? [{ age: 0.35 }] : [];
      drawScene(state);
    }
  };
  const hasWindowResize = !resizeObserver && typeof window !== "undefined";
  if (hasWindowResize) window.addEventListener("resize", onWindowResize);

  const acquired: HTMLElement[] = [];
  const inserted: EnergyState[] = [];
  try {
    for (const state of states) {
      acquireBackgroundTarget(state.element);
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
    for (const element of acquired) releaseBackgroundTarget(element);
    throw error;
  }

  const stopPaletteListener = subscribeToActiveBackgroundPalette(options.palette, configuredColors, (colors) => {
    if (destroyed) return;
    currentColors = colors;
    validateBackgroundColors(currentColors);
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
        releaseBackgroundTarget(state.element);
      }
    },
  };
}
