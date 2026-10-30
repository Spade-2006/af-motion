import { aurora } from "./aurora.js";
import type { AnimateTarget } from "../core/animate.js";
import { resolveTargets } from "../core/animate.js";
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

export type AtmosphericBackgroundEffect = "aurora" | "fog" | "rainfall" | "snowfall" | "sunbeams";
export type AtmosphericDirection = "left" | "right";

export interface AtmosphericBackgroundBaseOptions {
  /** Visual treatment. Defaults to "aurora". */
  effect?: AtmosphericBackgroundEffect;
  /** CSS colors for the effect, or palette primary/secondary/accent colors. */
  colors?: readonly string[];
  /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
  palette?: string;
  /** Animation speed multiplier. Must be greater than 0. Defaults to 1. */
  speed?: number;
  /** Overall visual intensity from 0 to 1. Defaults to 0.7. */
  intensity?: number;
}

export interface AuroraBorealisOptions extends AtmosphericBackgroundBaseOptions {
  effect?: "aurora";
  /** Number of flowing gradient ribbons from 1 to 8. Defaults to 4. */
  waveCount?: number;
  /** Gradient softness in pixels. Defaults to 60. */
  softness?: number;
}

export interface FogMistOptions extends AtmosphericBackgroundBaseOptions {
  effect: "fog";
  /** Number of drifting fog banks from 1 to 16. Defaults to 6. */
  density?: number;
  /** Fog edge softness from 0 to 1. Defaults to 0.85. */
  softness?: number;
  /** Horizontal fog drift direction. Defaults to "right". */
  direction?: AtmosphericDirection;
}

export interface RainfallOptions extends AtmosphericBackgroundBaseOptions {
  effect: "rainfall";
  /** Raindrops per 10,000 CSS square pixels. Capped at 3,000 drops per target. Defaults to 18. */
  density?: number;
  /** Rain speed in CSS pixels per second. Defaults to 560. */
  dropSpeed?: number;
  /** Rain angle in degrees from vertical, between -60 and 60. Defaults to 8. */
  angle?: number;
  /** Streak length in CSS pixels. Defaults to 16. */
  streakLength?: number;
  /** Adds a subtle glow at the lower edge. Defaults to false. */
  surfaceGlow?: boolean;
}

export interface SnowfallOptions extends AtmosphericBackgroundBaseOptions {
  effect: "snowfall";
  /** Snowflakes per 10,000 CSS square pixels. Capped at 1,800 flakes per target. Defaults to 12. */
  density?: number;
  /** Snowflake radius range in CSS pixels. Defaults to 3. */
  size?: number;
  /** Falling speed in CSS pixels per second. Defaults to 48. */
  fallSpeed?: number;
  /** Horizontal wind offset in CSS pixels per second. Defaults to 8. */
  wind?: number;
  /** Side-to-side drift amplitude in CSS pixels. Defaults to 12. */
  drift?: number;
}

export interface SunbeamsOptions extends AtmosphericBackgroundBaseOptions {
  effect: "sunbeams";
  /** Normalized light origin within the target. Defaults to { x: 0.5, y: 0.05 }. */
  origin?: Readonly<{ x: number; y: number }>;
  /** Angular spread of the light rays in degrees, from 5 to 120. Defaults to 48. */
  spread?: number;
  /** Animated sway amount in degrees, from 0 to 30. Defaults to 5. */
  movement?: number;
}

export type AtmosphericBackgroundOptions =
  | AuroraBorealisOptions
  | FogMistOptions
  | RainfallOptions
  | SnowfallOptions
  | SunbeamsOptions
  | AtmosphericBackgroundBaseOptions;

export interface AtmosphericBackgroundControls {
  /** Stops animation, removes the effect, and restores target styles. Safe to repeat. */
  destroy(): void;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
  depth: number;
}

interface AtmosphericState {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  width: number;
  height: number;
  phase: number;
  particles: Particle[];
  clouds: Array<{ x: number; y: number; size: number; phase: number; depth: number; colorIndex: number }>;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4", "#ec4899"] as const;
const DEFAULT_SPEED = 1;
const DEFAULT_INTENSITY = 0.7;
const MAX_RAIN_DROPS = 3000;
const MAX_SNOWFLAKES = 1800;
const MAX_FOG_BANKS = 16;

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

function makeParticles(count: number, width: number, height: number, kind: "rain" | "snow"): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const depth = 0.15 + ((index * 37) % 86) / 100;
    return {
      x: (index * 0.61803398875 + 0.13) % 1 * width,
      y: (index * 0.75487766625 + 0.47) % 1 * height,
      speed: kind === "rain" ? 0.65 + depth * 0.7 : 0.35 + depth * 0.8,
      size: kind === "rain" ? 0.5 + depth * 1.2 : 0.6 + depth * 2.2,
      phase: index * 2.399963229728653,
      depth,
    };
  });
}

function makeClouds(count: number): AtmosphericState["clouds"] {
  return Array.from({ length: count }, (_, index) => ({
    x: (index * 0.61803398875 + 0.2) % 1,
    y: (index * 0.75487766625 + 0.3) % 1,
    size: 0.22 + ((index * 19) % 13) / 50,
    phase: index * 2.399963229728653,
    depth: 0.3 + ((index * 29) % 8) / 10,
    colorIndex: index,
  }));
}

function drawAuroraColors(
  target: AnimateTarget,
  colors: readonly string[],
  options: AuroraBorealisOptions,
): { destroy(): void } {
  return aurora(target, {
    colors,
    speed: options.speed ?? DEFAULT_SPEED,
    blur: options.softness ?? 60,
    opacity: options.intensity ?? DEFAULT_INTENSITY,
    waveCount: options.waveCount ?? 4,
  });
}

function drawFog(
  state: AtmosphericState,
  colors: readonly string[],
  options: FogMistOptions,
): void {
  const { context, width, height, clouds, phase } = state;
  const softness = options.softness ?? 0.85;
  const direction = options.direction ?? "right";
  const sign = direction === "right" ? 1 : -1;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  context.clearRect(0, 0, width, height);
  for (const cloud of clouds) {
    const drift = ((phase * 9 * sign * cloud.depth + cloud.phase * 17) % (width + 300) + width + 300) % (width + 300) - 150;
    const x = direction === "right" ? drift : width - drift;
    const y = cloud.y * height + Math.sin(phase * 0.16 + cloud.phase) * height * 0.035;
    const radius = Math.max(width, height) * cloud.size;
    const gradient = context.createRadialGradient(x, y, radius * (1 - softness), x, y, radius);
    gradient.addColorStop(0, colors[cloud.colorIndex % colors.length] ?? colors[0] ?? "#fff");
    gradient.addColorStop(1, "transparent");
    context.globalAlpha = intensity * (0.12 + cloud.depth * 0.15);
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.globalAlpha = 1;
}

function drawRain(
  state: AtmosphericState,
  colors: readonly string[],
  options: RainfallOptions,
  elapsed: number,
): void {
  const { context, width, height, particles } = state;
  const angle = ((options.angle ?? 8) * Math.PI) / 180;
  const length = options.streakLength ?? 16;
  const fallSpeed = options.dropSpeed ?? 560;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  const color = colors[0] ?? "#fff";
  context.clearRect(0, 0, width, height);
  context.strokeStyle = color;
  context.lineWidth = 1;
  for (const drop of particles) {
    const velocity = fallSpeed * drop.speed;
    drop.y += velocity * elapsed;
    drop.x += velocity * elapsed * Math.sin(angle);
    if (drop.y - length > height) {
      drop.y = -Math.random() * Math.max(height, 1);
      drop.x = Math.random() * width;
    }
    if (drop.x < -length) drop.x = width + length;
    if (drop.x > width + length) drop.x = -length;
    context.globalAlpha = intensity * (0.25 + drop.depth * 0.65);
    context.lineWidth = 0.5 + drop.depth;
    context.beginPath();
    context.moveTo(drop.x, drop.y);
    context.lineTo(drop.x - Math.sin(angle) * length * drop.depth, drop.y - Math.cos(angle) * length * drop.depth);
    context.stroke();
  }
  if (options.surfaceGlow) {
    const glow = context.createLinearGradient(0, height * 0.72, 0, height);
    glow.addColorStop(0, "transparent");
    glow.addColorStop(1, colors[1] ?? color);
    context.globalAlpha = intensity * 0.2;
    context.fillStyle = glow;
    context.fillRect(0, height * 0.72, width, height * 0.28);
  }
  context.globalAlpha = 1;
}

function drawSnow(
  state: AtmosphericState,
  colors: readonly string[],
  options: SnowfallOptions,
  elapsed: number,
): void {
  const { context, width, height, particles, phase } = state;
  const fallSpeed = options.fallSpeed ?? 48;
  const wind = options.wind ?? 8;
  const drift = options.drift ?? 12;
  const maxSize = options.size ?? 3;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  context.clearRect(0, 0, width, height);
  for (const flake of particles) {
    flake.y += fallSpeed * flake.speed * elapsed;
    flake.x += (wind * flake.depth + Math.sin(phase * 0.8 + flake.phase) * drift) * elapsed;
    if (flake.y > height + maxSize) {
      flake.y = -maxSize;
      flake.x = Math.random() * width;
    }
    if (flake.x < -maxSize) flake.x = width + maxSize;
    if (flake.x > width + maxSize) flake.x = -maxSize;
    context.globalAlpha = intensity * (0.35 + flake.depth * 0.65);
    context.fillStyle = colors[Math.floor(flake.depth * colors.length) % colors.length] ?? colors[0] ?? "#fff";
    context.beginPath();
    context.arc(flake.x, flake.y, maxSize * flake.size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawSunbeams(state: AtmosphericState, colors: readonly string[], options: SunbeamsOptions): void {
  const { context, width, height, phase } = state;
  const origin = options.origin ?? { x: 0.5, y: 0.05 };
  const spread = options.spread ?? 48;
  const movement = options.movement ?? 5;
  const intensity = options.intensity ?? DEFAULT_INTENSITY;
  const sway = Math.sin(phase * 0.35) * movement;
  const centerAngle = Math.PI / 2 + (sway * Math.PI) / 180;
  const halfSpread = (spread * Math.PI) / 360;
  const originX = origin.x * width;
  const originY = origin.y * height;
  const rayLength = Math.hypot(width, height) * 1.25;
  context.clearRect(0, 0, width, height);
  for (let ray = 0; ray < 7; ray++) {
    const ratio = ray / 6 - 0.5;
    const angle = centerAngle + ratio * halfSpread * 2;
    const endX = originX + Math.cos(angle) * rayLength;
    const endY = originY + Math.sin(angle) * rayLength;
    const gradient = context.createLinearGradient(originX, originY, endX, endY);
    gradient.addColorStop(0, colors[ray % colors.length] ?? colors[0] ?? "#fff");
    gradient.addColorStop(1, "transparent");
    context.globalAlpha = intensity * (0.07 + (1 - Math.abs(ratio) * 2) * 0.05);
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(originX, originY);
    context.lineTo(originX + Math.cos(angle - halfSpread / 7) * rayLength, originY + Math.sin(angle - halfSpread / 7) * rayLength);
    context.lineTo(originX + Math.cos(angle + halfSpread / 7) * rayLength, originY + Math.sin(angle + halfSpread / 7) * rayLength);
    context.closePath();
    context.fill();
  }
  context.globalAlpha = 1;
}

function validateOptions(options: AtmosphericBackgroundOptions, effect: AtmosphericBackgroundEffect): void {
  assertFinite("speed", options.speed ?? DEFAULT_SPEED, Number.MIN_VALUE);
  assertFinite("intensity", options.intensity ?? DEFAULT_INTENSITY, 0, 1);
  if (effect === "aurora") {
    const auroraOptions = options as AuroraBorealisOptions;
    assertInteger("waveCount", auroraOptions.waveCount ?? 4, 1, 8);
    assertFinite("softness", auroraOptions.softness ?? 60, 0);
  } else if (effect === "fog") {
    const fog = options as FogMistOptions;
    assertInteger("density", fog.density ?? 6, 1, MAX_FOG_BANKS);
    assertFinite("softness", fog.softness ?? 0.85, 0, 1);
    if (fog.direction !== undefined && fog.direction !== "left" && fog.direction !== "right") {
      throw new TypeError(`direction must be "left" or "right", received "${String(fog.direction)}"`);
    }
  } else if (effect === "rainfall") {
    const rain = options as RainfallOptions;
    assertFinite("density", rain.density ?? 18, Number.MIN_VALUE);
    assertFinite("dropSpeed", rain.dropSpeed ?? 560, Number.MIN_VALUE);
    assertFinite("angle", rain.angle ?? 8, -60, 60);
    assertFinite("streakLength", rain.streakLength ?? 16, Number.MIN_VALUE);
    if (rain.surfaceGlow !== undefined && typeof rain.surfaceGlow !== "boolean") {
      throw new TypeError(`surfaceGlow must be a boolean, received ${String(rain.surfaceGlow)}`);
    }
  } else if (effect === "snowfall") {
    const snow = options as SnowfallOptions;
    assertFinite("density", snow.density ?? 12, Number.MIN_VALUE);
    assertFinite("size", snow.size ?? 3, Number.MIN_VALUE);
    assertFinite("fallSpeed", snow.fallSpeed ?? 48, Number.MIN_VALUE);
    assertFinite("wind", snow.wind ?? 8, Number.NEGATIVE_INFINITY);
    assertFinite("drift", snow.drift ?? 12, 0);
  } else {
    const sun = options as SunbeamsOptions;
    const origin = sun.origin ?? { x: 0.5, y: 0.05 };
    if (origin === null || typeof origin !== "object") throw new TypeError("origin must contain normalized x and y values");
    assertFinite("origin.x", origin.x, 0, 1);
    assertFinite("origin.y", origin.y, 0, 1);
    assertFinite("spread", sun.spread ?? 48, 5, 120);
    assertFinite("movement", sun.movement ?? 5, 0, 30);
  }
}

function particleCount(density: number, width: number, height: number, maximum: number): number {
  return Math.min(maximum, Math.max(1, Math.round((width * height / 10_000) * density)));
}

function drawCanvasEffect(
  state: AtmosphericState,
  effect: Exclude<AtmosphericBackgroundEffect, "aurora">,
  colors: readonly string[],
  options: AtmosphericBackgroundOptions,
  elapsed: number,
): void {
  if (effect === "fog") drawFog(state, colors, options as FogMistOptions);
  else if (effect === "rainfall") drawRain(state, colors, options as RainfallOptions, elapsed);
  else if (effect === "snowfall") drawSnow(state, colors, options as SnowfallOptions, elapsed);
  else drawSunbeams(state, colors, options as SunbeamsOptions);
}

/**
 * Adds aurora, fog, rain, snow, or sunbeam ambience. Aurora delegates to the
 * existing aurora effect; the Canvas effects share responsive motion-aware cleanup.
 */
export function atmosphericBackground(
  target: AnimateTarget,
  options: AtmosphericBackgroundOptions = {},
): AtmosphericBackgroundControls {
  const effect = options.effect ?? "aurora";
  if (!["aurora", "fog", "rainfall", "snowfall", "sunbeams"].includes(effect)) {
    throw new TypeError(`Unknown atmospheric background effect "${String(effect)}"`);
  }
  validateOptions(options, effect);
  const configuredColors = options.colors ?? DEFAULT_COLORS;
  validateColors(configuredColors);
  let currentColors = resolveColors(options.palette, configuredColors);
  validateColors(currentColors);
  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  if (effect === "aurora") {
    const auroraOptions = options as AuroraBorealisOptions;
    let auroraControls = drawAuroraColors(target, currentColors, auroraOptions);
    let destroyed = false;
    const stopPaletteListener = subscribeToActiveBackgroundPalette(options.palette, configuredColors, (nextColors) => {
      if (destroyed) return;
      validateColors(nextColors);
      const nextControls = drawAuroraColors(target, nextColors, auroraOptions);
      auroraControls.destroy();
      auroraControls = nextControls;
    });
    return {
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        stopPaletteListener();
        auroraControls.destroy();
      },
    };
  }

  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("atmosphericBackground() requires document.createElement");
  }
  const states: AtmosphericState[] = [];
  try {
    for (const element of elements) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("atmosphericBackground() requires a canvas with a 2D rendering context");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.setProperty("position", "absolute");
      canvas.style.setProperty("inset", "0");
      canvas.style.setProperty("width", "100%");
      canvas.style.setProperty("height", "100%");
      canvas.style.setProperty("display", "block");
      canvas.style.setProperty("z-index", "-1");
      canvas.style.setProperty("pointer-events", "none");
      const rect = element.getBoundingClientRect();
      const state: AtmosphericState = {
        element,
        canvas,
        context,
        width: 0,
        height: 0,
        phase: 0,
        particles: [],
        clouds: [],
      };
      setCanvasSize(state, rect.width, rect.height);
      if (effect === "fog") state.clouds = makeClouds((options as FogMistOptions).density ?? 6);
      if (effect === "rainfall" || effect === "snowfall") {
        const density = (options as RainfallOptions | SnowfallOptions).density ?? (effect === "rainfall" ? 18 : 12);
        const maximum = effect === "rainfall" ? MAX_RAIN_DROPS : MAX_SNOWFLAKES;
        state.particles = makeParticles(particleCount(density, rect.width, rect.height, maximum), rect.width, rect.height, effect === "rainfall" ? "rain" : "snow");
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

  let destroyed = false;
  const speed = options.speed ?? DEFAULT_SPEED;

  const drawScene = (state: AtmosphericState, elapsed = 0): void => {
    drawCanvasEffect(state, effect, currentColors, options, elapsed);
  };
  const scheduler = createMotionFrameScheduler<AtmosphericState>({
    speed,
    animated: true,
    errorName: "atmosphericBackground()",
    renderStatic: () => states.forEach((state) => drawScene(state)),
    update: (state, elapsed) => {
      state.phase += elapsed;
      drawScene(state, elapsed);
    },
  });
  const resizeState = (state: AtmosphericState, width: number, height: number): void => {
    setCanvasSize(state, width, height);
    if (effect === "rainfall" || effect === "snowfall") {
      const density = (options as RainfallOptions | SnowfallOptions).density ?? (effect === "rainfall" ? 18 : 12);
      const maximum = effect === "rainfall" ? MAX_RAIN_DROPS : MAX_SNOWFLAKES;
      state.particles = makeParticles(
        particleCount(density, state.width, state.height, maximum),
        state.width,
        state.height,
        effect === "rainfall" ? "rain" : "snow",
      );
    }
    drawScene(state);
  };

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
          resizeState(state, entry.contentRect.width, entry.contentRect.height);
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
      resizeState(state, rect.width, rect.height);
    }
  };
  const hasWindowResize = !resizeObserver && typeof window !== "undefined";
  if (hasWindowResize) window.addEventListener("resize", onWindowResize);
  const acquired: HTMLElement[] = [];
  const inserted: AtmosphericState[] = [];
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
