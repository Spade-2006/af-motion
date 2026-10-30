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

export type CosmicBackgroundEffect = "starfield" | "nebula" | "shooting-stars" | "galaxy";

export interface CosmicBackgroundOptions {
  /** Visual treatment. Defaults to "starfield". */
  effect?: CosmicBackgroundEffect;
  /** Stars per 10,000 CSS square pixels. Capped at 2,400 stars per target. Defaults to 1.5. */
  density?: number;
  /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
  speed?: number;
  /** Star depth amount from 0 to 1; affects star size and parallax. Defaults to 1. */
  depth?: number;
  /** Overall visual intensity from 0 to 1. Defaults to 0.8. */
  intensity?: number;
  /** CSS colors for the stars/clouds, or a registered palette's primary, secondary, and accent colors. */
  colors?: readonly string[];
  /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
  palette?: string;
  /** Shooting-star events per minute when effect is "shooting-stars". Set to 0 to disable. Defaults to 6. */
  shootingFrequency?: number;
  /** Shooting-star trail length in CSS pixels. Defaults to 140. */
  trailLength?: number;
}

export interface CosmicBackgroundControls {
  /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
  destroy(): void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  depth: number;
  colorIndex: number;
  twinkle: number;
}

interface Cloud {
  x: number;
  y: number;
  radius: number;
  colorIndex: number;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  lifetime: number;
  colorIndex: number;
}

interface CosmicCanvasState {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  width: number;
  height: number;
  stars: Star[];
  clouds: Cloud[];
  shootingStars: ShootingStar[];
  rotation: number;
  elapsed: number;
  nextShootingTime: number | null;
}

const DEFAULT_COLORS = ["#9b8cff", "#74e6ff", "#ff9ed8"] as const;
const DEFAULT_DENSITY = 1.5;
const DEFAULT_SPEED = 1;
const DEFAULT_DEPTH = 1;
const DEFAULT_INTENSITY = 0.8;
const DEFAULT_SHOOTING_FREQUENCY = 6;
const DEFAULT_TRAIL_LENGTH = 140;
const MAX_STARS = 2400;

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

function starCount(width: number, height: number, density: number): number {
  return Math.min(MAX_STARS, Math.round((width * height / 10_000) * density));
}

function createStars(count: number, effect: CosmicBackgroundEffect): Star[] {
  return Array.from({ length: count }, (_, index) => {
    const depth = 0.15 + ((index * 37) % 86) / 100;
    if (effect === "galaxy") {
      const progress = (index + 0.5) / Math.max(count, 1);
      const arm = index % 3;
      const radius = Math.sqrt(progress) * 0.48;
      const angle = radius * 9 + (arm * Math.PI * 2) / 3;
      return {
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius * 0.72,
        size: 0.45 + depth * 1.8,
        depth,
        colorIndex: index,
        twinkle: (index * 0.37) % (Math.PI * 2),
      };
    }
    return {
      x: (index * 0.61803398875 + 0.13) % 1,
      y: (index * 0.75487766625 + 0.47) % 1,
      size: 0.4 + depth * 1.8,
      depth,
      colorIndex: index,
      twinkle: (index * 0.37) % (Math.PI * 2),
    };
  });
}

function createClouds(): Cloud[] {
  return [
    { x: 0.22, y: 0.32, radius: 0.38, colorIndex: 0, phase: 0 },
    { x: 0.72, y: 0.3, radius: 0.34, colorIndex: 1, phase: 2.1 },
    { x: 0.5, y: 0.74, radius: 0.42, colorIndex: 2, phase: 4.2 },
    { x: 0.92, y: 0.78, radius: 0.26, colorIndex: 0, phase: 5.3 },
  ];
}

function drawNebula(
  state: CosmicCanvasState,
  colors: readonly string[],
  intensity: number,
  elapsed: number,
): void {
  const { context, clouds, width, height } = state;
  for (const cloud of clouds) {
    const drift = Math.sin(elapsed * 0.12 + cloud.phase) * 0.025;
    const x = (cloud.x + drift) * width;
    const y = (cloud.y + Math.cos(elapsed * 0.1 + cloud.phase) * 0.02) * height;
    const radius = cloud.radius * Math.max(width, height);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    const color = colors[cloud.colorIndex % colors.length] ?? colors[0] ?? "#fff";
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.35, color);
    gradient.addColorStop(1, "transparent");
    context.globalAlpha = intensity * 0.34;
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.globalAlpha = 1;
}

function drawStars(
  state: CosmicCanvasState,
  colors: readonly string[],
  effect: CosmicBackgroundEffect,
  depth: number,
  intensity: number,
): void {
  const { context, stars, width, height } = state;
  const galaxy = effect === "galaxy";
  const rotation = galaxy ? state.rotation : 0;
  for (const star of stars) {
    const x = star.x - 0.5;
    const y = star.y - 0.5;
    const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation);
    const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation);
    const screenX = (0.5 + rotatedX) * width;
    const screenY = (0.5 + rotatedY) * height;
    const twinkle = 0.75 + Math.sin(state.elapsed * 1.4 + star.twinkle) * 0.2;
    const size = star.size * (0.4 + depth * 0.6);
    context.globalAlpha = intensity * twinkle * (0.35 + star.depth * 0.65);
    context.fillStyle = colors[star.colorIndex % colors.length] ?? colors[0] ?? "#fff";
    context.beginPath();
    context.arc(screenX, screenY, size, 0, Math.PI * 2);
    context.fill();
    if (star.depth > 0.88 && size > 1.5) {
      context.globalAlpha *= 0.55;
      context.fillRect(screenX - size * 2, screenY - 0.35, size * 4, 0.7);
      context.fillRect(screenX - 0.35, screenY - size * 2, 0.7, size * 4);
    }
  }
  context.globalAlpha = 1;
}

function spawnShootingStar(
  state: CosmicCanvasState,
  colors: readonly string[],
  speed: number,
): void {
  const angle = Math.PI * (0.58 + Math.random() * 0.15);
  const velocity = Math.max(state.width, state.height, 1) * 0.75 * speed;
  state.shootingStars.push({
    x: Math.random() * state.width,
    y: Math.random() * state.height * 0.65,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    age: 0,
    lifetime: 0.9,
    colorIndex: Math.floor(Math.random() * colors.length),
  });
}

function drawShootingStars(
  state: CosmicCanvasState,
  colors: readonly string[],
  intensity: number,
  trailLength: number,
): void {
  const { context } = state;
  for (const shootingStar of state.shootingStars) {
    const progress = Math.max(0, 1 - shootingStar.age / shootingStar.lifetime);
    const tailX = shootingStar.x - (shootingStar.vx / Math.max(Math.hypot(shootingStar.vx, shootingStar.vy), 1)) * trailLength;
    const tailY = shootingStar.y - (shootingStar.vy / Math.max(Math.hypot(shootingStar.vx, shootingStar.vy), 1)) * trailLength;
    const gradient = context.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, colors[shootingStar.colorIndex % colors.length] ?? colors[0] ?? "#fff");
    context.globalAlpha = intensity * progress;
    context.strokeStyle = gradient;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(tailX, tailY);
    context.lineTo(shootingStar.x, shootingStar.y);
    context.stroke();
  }
  context.globalAlpha = 1;
}

function render(
  state: CosmicCanvasState,
  effect: CosmicBackgroundEffect,
  colors: readonly string[],
  depth: number,
  intensity: number,
  trailLength: number,
): void {
  state.context.clearRect(0, 0, state.width, state.height);
  if (effect === "nebula") drawNebula(state, colors, intensity, state.elapsed);
  drawStars(state, colors, effect, depth, intensity);
  if (effect === "shooting-stars") drawShootingStars(state, colors, intensity, trailLength);
}

/**
 * Renders a Canvas-based cosmic scene behind target content. Starfield, nebula,
 * shooting-star, and spiral-galaxy treatments share responsive and motion-aware cleanup.
 */
export function cosmicBackground(
  target: AnimateTarget,
  options: CosmicBackgroundOptions = {},
): CosmicBackgroundControls {
  const {
    effect = "starfield",
    density = DEFAULT_DENSITY,
    speed = DEFAULT_SPEED,
    depth = DEFAULT_DEPTH,
    intensity = DEFAULT_INTENSITY,
    colors: configuredColors = DEFAULT_COLORS,
    palette,
    shootingFrequency = DEFAULT_SHOOTING_FREQUENCY,
    trailLength = DEFAULT_TRAIL_LENGTH,
  } = options;

  if (!["starfield", "nebula", "shooting-stars", "galaxy"].includes(effect)) {
    throw new TypeError(`Unknown cosmic background effect "${String(effect)}"`);
  }
  assertFinite("density", density, 0);
  assertFinite("speed", speed, 0);
  assertFinite("depth", depth, 0, 1);
  assertFinite("intensity", intensity, 0, 1);
  assertFinite("shootingFrequency", shootingFrequency, 0);
  assertFinite("trailLength", trailLength, 0);
  validateColors(configuredColors);
  let currentColors = resolveColors(palette, configuredColors);
  validateColors(currentColors);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("cosmicBackground() requires document.createElement");
  }

  const states: CosmicCanvasState[] = [];
  try {
    for (const element of elements) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("cosmicBackground() requires a canvas with a 2D rendering context");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.setProperty("position", "absolute");
      canvas.style.setProperty("inset", "0");
      canvas.style.setProperty("width", "100%");
      canvas.style.setProperty("height", "100%");
      canvas.style.setProperty("display", "block");
      canvas.style.setProperty("z-index", "-1");
      canvas.style.setProperty("pointer-events", "none");
      const rect = element.getBoundingClientRect();
      const state: CosmicCanvasState = {
        element,
        canvas,
        context,
        width: 0,
        height: 0,
        stars: createStars(starCount(rect.width, rect.height, density), effect),
        clouds: createClouds(),
        shootingStars: [],
        rotation: 0,
        elapsed: 0,
        nextShootingTime: null,
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

  const drawScene = (state: CosmicCanvasState): void => {
    render(state, effect, currentColors, depth, intensity, trailLength);
  };
  const scheduler = createMotionFrameScheduler<CosmicCanvasState>({
    speed,
    animated,
    errorName: "cosmicBackground()",
    renderStatic: () => states.forEach(drawScene),
    update: (state, elapsed, time) => {
      state.elapsed += elapsed;
      if (effect === "starfield") {
        for (const star of state.stars) {
          star.y += (elapsed * (0.012 + star.depth * 0.045) * depth) % 1;
          if (star.y > 1) star.y -= 1;
        }
      } else if (effect === "galaxy") {
        state.rotation += elapsed * 0.025 * depth;
      } else if (effect === "shooting-stars") {
        if (shootingFrequency > 0) {
          const interval = 60 / shootingFrequency;
          if (state.nextShootingTime === null) state.nextShootingTime = time + interval * 1000;
          else if (time >= state.nextShootingTime) {
            spawnShootingStar(state, currentColors, speed);
            state.nextShootingTime = time + interval * 1000;
          }
        }
        for (const shootingStar of state.shootingStars) {
          shootingStar.age += elapsed;
          shootingStar.x += shootingStar.vx * elapsed;
          shootingStar.y += shootingStar.vy * elapsed;
        }
        state.shootingStars = state.shootingStars.filter(
          (star) => star.age < star.lifetime && star.x > -trailLength && star.y < state.height + trailLength,
        );
      }
      drawScene(state);
    },
  });

  const resizeState = (state: CosmicCanvasState, width: number, height: number): void => {
    setCanvasSize(state, width, height);
    state.stars = createStars(starCount(state.width, state.height, density), effect);
    state.shootingStars = [];
    state.nextShootingTime = null;
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
          if (state) resizeState(state, entry.contentRect.width, entry.contentRect.height);
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
  const inserted: CosmicCanvasState[] = [];
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

  const stopPaletteListener = subscribeToActiveBackgroundPalette(palette, configuredColors, (colors) => {
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
