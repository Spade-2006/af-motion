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

export type ParticleBackgroundMode = "floating" | "network" | "cursor" | "constellation";

export interface ParticleBackgroundOptions {
  /** Rendering style. Defaults to "floating". */
  mode?: ParticleBackgroundMode;
  /** Fixed number of particles per target; exclusive with density. Defaults to 60. */
  count?: number;
  /** Particles per 10,000 CSS square pixels; overrides the default count. Capped at 1,000 per target. */
  density?: number;
  /** CSS colors used when no palette is selected. Defaults to violet and cyan. */
  colors?: readonly string[];
  /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
  palette?: string;
  /** Particle movement multiplier. Set to 0 for a static background. Defaults to 1. */
  speed?: number;
  /** Particle radius in CSS pixels. Defaults to 2. */
  size?: number;
  /** Particle opacity from 0 to 1. Defaults to 0.8. */
  opacity?: number;
  /** Maximum distance in CSS pixels for network and constellation connections. Defaults to 120. */
  connectionDistance?: number;
  /** Enables pointer response. Defaults to true for cursor mode and false otherwise. */
  pointerInteraction?: boolean;
  /** Pointer response radius in CSS pixels. Defaults to 120. */
  pointerRadius?: number;
  /** Pointer acceleration in CSS pixels per second squared. Defaults to 180. */
  pointerStrength?: number;
}

export interface ParticleBackgroundControls {
  /** Stops animation, removes the canvas, and releases all resources. Safe to repeat. */
  destroy(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  colorIndex: number;
}

interface CanvasState {
  readonly element: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  particles: Particle[];
  width: number;
  height: number;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4"] as const;
const DEFAULT_COUNT = 60;
const DEFAULT_SIZE = 2;
const DEFAULT_SPEED = 1;
const DEFAULT_OPACITY = 0.8;
const DEFAULT_CONNECTION_DISTANCE = 120;
const DEFAULT_POINTER_RADIUS = 120;
const DEFAULT_POINTER_STRENGTH = 180;
const MAX_PARTICLES = 1000;
const BASE_VELOCITY = 18;

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

function particleCount(
  count: number | undefined,
  density: number | undefined,
  width: number,
  height: number,
): number {
  if (density !== undefined) {
    return Math.max(1, Math.min(MAX_PARTICLES, Math.round((width * height / 10_000) * density)));
  }
  return count ?? DEFAULT_COUNT;
}

function createParticles(count: number, speed: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * 2.399963229728653;
    const x = (index * 0.61803398875 + 0.13) % 1;
    const y = (index * 0.75487766625 + 0.47) % 1;
    const velocity = BASE_VELOCITY * speed * (0.35 + ((index * 17) % 13) / 20);
    return {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      colorIndex: index,
    };
  });
}

function connectNearby(
  state: CanvasState,
  colors: readonly string[],
  distanceLimit: number,
): void {
  if (distanceLimit <= 0) return;
  const { context, particles, width, height } = state;
  const cells = new Map<string, number[]>();
  const cellKey = (x: number, y: number): string => `${x},${y}`;
  for (let index = 0; index < particles.length; index++) {
    const particle = particles[index];
    if (!particle) continue;
    const cellX = Math.floor((particle.x * width) / distanceLimit);
    const cellY = Math.floor((particle.y * height) / distanceLimit);
    const key = cellKey(cellX, cellY);
    const bucket = cells.get(key);
    if (bucket) bucket.push(index);
    else cells.set(key, [index]);
  }

  for (let index = 0; index < particles.length; index++) {
    const particle = particles[index];
    if (!particle) continue;
    const x = particle.x * width;
    const y = particle.y * height;
    const cellX = Math.floor(x / distanceLimit);
    const cellY = Math.floor(y / distanceLimit);
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        const bucket = cells.get(cellKey(cellX + offsetX, cellY + offsetY));
        if (!bucket) continue;
        for (const otherIndex of bucket) {
          if (otherIndex <= index) continue;
          const other = particles[otherIndex];
          if (!other) continue;
          const dx = (particle.x - other.x) * width;
          const dy = (particle.y - other.y) * height;
          const distance = Math.hypot(dx, dy);
          if (distance >= distanceLimit) continue;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(other.x * width, other.y * height);
          context.strokeStyle = colors[particle.colorIndex] ?? colors[0] ?? "#000";
          context.globalAlpha = (1 - distance / distanceLimit) * 0.45;
          context.lineWidth = 1;
          context.stroke();
        }
      }
    }
  }
  context.globalAlpha = 1;
}

function draw(
  state: CanvasState,
  mode: ParticleBackgroundMode,
  colors: readonly string[],
  size: number,
  opacity: number,
  connectionDistance: number,
  pointerRadius: number,
  pointerInteraction: boolean,
): void {
  const { context, particles, width, height } = state;
  context.clearRect(0, 0, width, height);
  if (mode === "network" || mode === "constellation") {
    connectNearby(state, colors, connectionDistance);
  }
  context.globalAlpha = opacity;
  for (const particle of particles) {
    const x = particle.x * width;
    const y = particle.y * height;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fillStyle = colors[particle.colorIndex] ?? colors[0] ?? "#000";
    context.fill();
    if (pointerInteraction && state.pointerActive) {
      const dx = x - state.pointerX;
      const dy = y - state.pointerY;
      const distance = Math.hypot(dx, dy);
      if (distance < pointerRadius) {
        context.beginPath();
        context.moveTo(state.pointerX, state.pointerY);
        context.lineTo(x, y);
        context.strokeStyle = colors[particle.colorIndex] ?? colors[0] ?? "#000";
        context.globalAlpha = opacity * (1 - distance / pointerRadius) * 0.7;
        context.lineWidth = 1;
        context.stroke();
        context.globalAlpha = opacity;
      }
    }
  }
  context.globalAlpha = 1;
}

/**
 * Draws a Canvas 2D particle background behind one or more elements. Network and
 * constellation modes use spatially bucketed connections to avoid all-pairs scans.
 */
export function particleBackground(
  target: AnimateTarget,
  options: ParticleBackgroundOptions = {},
): ParticleBackgroundControls {
  const {
    mode = "floating",
    count,
    density,
    colors: configuredColors = DEFAULT_COLORS,
    palette,
    speed = DEFAULT_SPEED,
    size = DEFAULT_SIZE,
    opacity = DEFAULT_OPACITY,
    connectionDistance = DEFAULT_CONNECTION_DISTANCE,
    pointerInteraction = mode === "cursor",
    pointerRadius = DEFAULT_POINTER_RADIUS,
    pointerStrength = DEFAULT_POINTER_STRENGTH,
  } = options;

  if (!["floating", "network", "cursor", "constellation"].includes(mode)) {
    throw new TypeError(`Unknown particle background mode "${String(mode)}"`);
  }
  if (count !== undefined && density !== undefined) {
    throw new TypeError("count and density cannot both be specified");
  }
  if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > MAX_PARTICLES)) {
    throw new RangeError(`count must be an integer from 1 to ${MAX_PARTICLES}, received ${String(count)}`);
  }
  if (density !== undefined) assertFinite("density", density, Number.MIN_VALUE);
  assertFinite("speed", speed, 0);
  assertFinite("size", size, Number.MIN_VALUE);
  assertFinite("opacity", opacity, 0, 1);
  assertFinite("connectionDistance", connectionDistance, 0);
  assertFinite("pointerRadius", pointerRadius, Number.MIN_VALUE);
  assertFinite("pointerStrength", pointerStrength, 0);
  if (typeof pointerInteraction !== "boolean") {
    throw new TypeError(`pointerInteraction must be a boolean, received ${String(pointerInteraction)}`);
  }
  validateColors(configuredColors);
  let currentColors = resolveColors(palette, configuredColors);
  validateColors(currentColors);

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("particleBackground() requires document.createElement");
  }
  const states: CanvasState[] = [];
  try {
    for (const element of elements) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("particleBackground() requires a canvas with a 2D rendering context");
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.setProperty("position", "absolute");
      canvas.style.setProperty("inset", "0");
      canvas.style.setProperty("width", "100%");
      canvas.style.setProperty("height", "100%");
      canvas.style.setProperty("display", "block");
      canvas.style.setProperty("z-index", "-1");
      canvas.style.setProperty("pointer-events", "none");
      const rect = element.getBoundingClientRect();
      const state: CanvasState = {
        element,
        canvas,
        context,
        particles: createParticles(
          particleCount(count, density, rect.width, rect.height),
          speed,
        ),
        width: 0,
        height: 0,
        pointerX: 0,
        pointerY: 0,
        pointerActive: false,
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

  const render = (state: CanvasState): void => {
    draw(state, mode, currentColors, size, opacity, connectionDistance, pointerRadius, pointerInteraction);
  };
  const scheduler = createMotionFrameScheduler<CanvasState>({
    speed: 1,
    animated: speed > 0,
    errorName: "particleBackground()",
    renderStatic: () => states.forEach(render),
    update: (state, elapsed) => {
      if (speed > 0) {
        const modeSpeed = mode === "constellation" ? 0.12 : 1;
        for (const particle of state.particles) {
          if (pointerInteraction && state.pointerActive) {
            const dx = particle.x * state.width - state.pointerX;
            const dy = particle.y * state.height - state.pointerY;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < pointerRadius) {
              const force = (1 - distance / pointerRadius) * pointerStrength * elapsed;
              particle.vx += (dx / distance) * force;
              particle.vy += (dy / distance) * force;
            }
          }
          particle.x = (particle.x + (particle.vx * modeSpeed * elapsed) / Math.max(state.width, 1) + 1) % 1;
          particle.y = (particle.y + (particle.vy * modeSpeed * elapsed) / Math.max(state.height, 1) + 1) % 1;
          particle.vx *= 0.995;
          particle.vy *= 0.995;
        }
      }
      render(state);
    },
  });

  const resizeState = (state: CanvasState, width: number, height: number): void => {
    setCanvasSize(state, width, height);
    const desiredCount = particleCount(count, density, state.width, state.height);
    if (state.particles.length !== desiredCount) {
      state.particles = createParticles(desiredCount, speed);
    }
    render(state);
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

  const pointerHandlers = new Map<HTMLElement, { move: EventListener; leave: EventListener }>();
  if (pointerInteraction) {
    for (const state of states) {
      const onPointerMove: EventListener = (event) => {
        if (destroyed || scheduler.isReducedMotion) return;
        const pointerEvent = event as PointerEvent;
        const rect = state.element.getBoundingClientRect();
        state.pointerX = pointerEvent.clientX - rect.left;
        state.pointerY = pointerEvent.clientY - rect.top;
        state.pointerActive = true;
        render(state);
      };
      const onPointerLeave: EventListener = () => {
        state.pointerActive = false;
        render(state);
      };
      state.element.addEventListener("pointermove", onPointerMove);
      state.element.addEventListener("pointerleave", onPointerLeave);
      pointerHandlers.set(state.element, { move: onPointerMove, leave: onPointerLeave });
    }
  }

  const acquired: HTMLElement[] = [];
  const inserted: CanvasState[] = [];
  try {
    for (const state of states) {
      acquireTarget(state.element);
      acquired.push(state.element);
      state.element.insertBefore(state.canvas, state.element.firstChild);
      inserted.push(state);
      intersectionObserver?.observe(state.element);
      resizeObserver?.observe(state.element);
      render(state);
    }
  } catch (error) {
    scheduler.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
    for (const [element, handlers] of pointerHandlers) {
      element.removeEventListener("pointermove", handlers.move);
      element.removeEventListener("pointerleave", handlers.leave);
    }
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
    for (const state of states) render(state);
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
        const handlers = pointerHandlers.get(state.element);
        if (handlers) {
          state.element.removeEventListener("pointermove", handlers.move);
          state.element.removeEventListener("pointerleave", handlers.leave);
        }
        if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
        releaseBackgroundCanvas(state.canvas);
        releaseTarget(state.element);
      }
    },
  };
}
