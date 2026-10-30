import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import {
  acquireBackgroundTarget as acquireTarget,
  createMotionFrameScheduler,
  releaseBackgroundCanvas,
  releaseBackgroundTarget as releaseTarget,
  resizeCanvasToElement as setCanvasSize,
} from "./internal/canvas-lifecycle.js";

export interface ParticleFieldOptions {
  /** Colors used for particles and connection lines. Defaults to violet and cyan. */
  colors?: readonly string[];
  /** Number of particles per target. Must be an integer from 1 to 1000. Defaults to 60. */
  count?: number;
  /** Particle radius in CSS pixels. Must be > 0. Defaults to 2. */
  size?: number;
  /** Particle velocity multiplier. Must be >= 0. Defaults to 1. */
  speed?: number;
  /** Whether to draw lines between nearby particles. Defaults to false. */
  connections?: boolean;
}

export interface ParticleFieldControls {
  /** Stops rendering, disconnects observers, and removes the canvases. Safe to repeat. */
  destroy(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface CanvasState {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  particles: Particle[];
  width: number;
  height: number;
}

const DEFAULT_COLORS = ["#7c3aed", "#06b6d4"] as const;
const DEFAULT_COUNT = 60;
const DEFAULT_SIZE_PX = 2;
const DEFAULT_SPEED = 1;
const MAX_PARTICLE_COUNT = 1000;
const CONNECTION_DISTANCE_PX = 120;
const BASE_VELOCITY = 18;

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

function initializeParticles(count: number, colors: readonly string[], speed: number): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const x = ((index * 0.61803398875) % 1);
    const y = ((index * 0.75487766625 + 0.5) % 1);
    const angle = ((index * 2.399963229728653) % (Math.PI * 2));
    const velocity = BASE_VELOCITY * speed * (0.35 + ((index * 17) % 13) / 20);
    return {
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: colors[index % colors.length] as string,
    };
  });
}

function createCanvasState(
  element: HTMLElement,
  colors: readonly string[],
  count: number,
  size: number,
  speed: number,
): CanvasState {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("particleField() requires a canvas with a 2D rendering context");
  }
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.setProperty("position", "absolute");
  canvas.style.setProperty("inset", "0");
  canvas.style.setProperty("width", "100%");
  canvas.style.setProperty("height", "100%");
  canvas.style.setProperty("display", "block");
  canvas.style.setProperty("z-index", "-1");
  canvas.style.setProperty("pointer-events", "none");
  return {
    element,
    canvas,
    context,
    particles: initializeParticles(count, colors, speed),
    width: 0,
    height: 0,
  };
}

function draw(state: CanvasState, size: number, connections: boolean): void {
  const { context, particles, width, height } = state;
  context.clearRect(0, 0, width, height);

  for (const particle of particles) {
    context.beginPath();
    context.arc(particle.x * width, particle.y * height, size, 0, Math.PI * 2);
    context.fillStyle = particle.color;
    context.fill();
  }

  if (!connections) return;
  for (let first = 0; first < particles.length; first++) {
    const a = particles[first];
    if (!a) continue;
    for (let second = first + 1; second < particles.length; second++) {
      const b = particles[second];
      if (!b) continue;
      const dx = (a.x - b.x) * width;
      const dy = (a.y - b.y) * height;
      const distance = Math.hypot(dx, dy);
      if (distance >= CONNECTION_DISTANCE_PX) continue;
      context.beginPath();
      context.moveTo(a.x * width, a.y * height);
      context.lineTo(b.x * width, b.y * height);
      context.strokeStyle = a.color;
      context.globalAlpha = 1 - distance / CONNECTION_DISTANCE_PX;
      context.lineWidth = 1;
      context.stroke();
    }
  }
  context.globalAlpha = 1;
}

/**
 * Draws a lightweight particle field behind target content using one shared animation frame
 * scheduler. Canvas rendering pauses when every target is outside the viewport.
 */
export function particleField(
  target: AnimateTarget,
  options: ParticleFieldOptions = {},
): ParticleFieldControls {
  const {
    count = DEFAULT_COUNT,
    colors = DEFAULT_COLORS,
    size = DEFAULT_SIZE_PX,
    speed = DEFAULT_SPEED,
    connections = false,
  } = options;

  validateColors(colors);
  if (!Number.isInteger(count) || count < 1 || count > MAX_PARTICLE_COUNT) {
    throw new RangeError(`count must be an integer from 1 to ${MAX_PARTICLE_COUNT}, received ${String(count)}`);
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    throw new RangeError(`size must be a finite number > 0, received ${String(size)}`);
  }
  if (typeof speed !== "number" || !Number.isFinite(speed) || speed < 0) {
    throw new RangeError(`speed must be a finite number >= 0, received ${String(speed)}`);
  }
  if (typeof connections !== "boolean") {
    throw new TypeError(`connections must be a boolean, received ${String(connections)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("particleField() requires document.createElement, which is not available in this environment");
  }

  // Build and validate every canvas before touching any target styles or DOM.
  const states = elements.map((element) => createCanvasState(element, colors, count, size, speed));
  const stateByElement = new Map(states.map((state) => [state.element, state]));
  let destroyed = false;

  const resize = (state: CanvasState, width: number, height: number): void => {
    setCanvasSize(state, width, height);
    draw(state, size, connections);
  };

  for (const state of states) {
    const rect = state.element.getBoundingClientRect();
    resize(state, rect.width, rect.height);
  }

  const scheduler = createMotionFrameScheduler<CanvasState>({
    speed: 1,
    animated: speed > 0,
    errorName: "particleField()",
    renderStatic: () => states.forEach((state) => draw(state, size, connections)),
    update: (state, elapsed) => {
      for (const particle of state.particles) {
        particle.x = (particle.x + particle.vx * elapsed / Math.max(state.width, 1) + 1) % 1;
        particle.y = (particle.y + particle.vy * elapsed / Math.max(state.height, 1) + 1) % 1;
      }
      draw(state, size, connections);
    },
  });

  let intersectionObserver: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  try {
    if (typeof IntersectionObserver === "function") {
      intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const state = stateByElement.get(entry.target as HTMLElement);
          if (state) scheduler.setVisible(state, entry.isIntersecting);
        }
      });
    }
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver((entries) => {
        if (destroyed) return;
        for (const entry of entries) {
          const state = stateByElement.get(entry.target as HTMLElement);
          if (state) resize(state, entry.contentRect.width, entry.contentRect.height);
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
      resize(state, rect.width, rect.height);
    }
  };
  const hasWindowResize = !resizeObserver && typeof window !== "undefined";
  if (hasWindowResize) window.addEventListener("resize", onWindowResize);

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
      if (!intersectionObserver) scheduler.setVisible(state, true);
    }
  } catch (error) {
    scheduler.destroy();
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    for (const state of inserted) {
      state.element.removeChild(state.canvas);
      releaseBackgroundCanvas(state.canvas);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      scheduler.destroy();
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
