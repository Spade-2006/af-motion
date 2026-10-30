import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";
import { onReducedMotionChange, prefersReducedMotion } from "../core/motion.js";
import {
  acquireBackgroundTarget as acquireTarget,
  releaseBackgroundCanvas,
  releaseBackgroundTarget as releaseTarget,
  resizeCanvasToElement as setCanvasSize,
} from "./internal/canvas-lifecycle.js";

export interface NoiseBackgroundOptions {
  /** Noise alpha amplitude between 0 and 1. Defaults to 0.15. */
  intensity?: number;
  /** Noise grain size in CSS pixels. Must be > 0. Defaults to 1. */
  scale?: number;
  /** Texture refreshes per second. Set to 0 for static noise. Defaults to 0. */
  speed?: number;
  /** Overlay opacity between 0 and 1. Defaults to 0.25. */
  opacity?: number;
}

export interface NoiseBackgroundControls {
  /** Stops rendering, disconnects resize observation, and removes the overlay. Safe to repeat. */
  destroy(): void;
}

interface CanvasState {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

const DEFAULT_INTENSITY = 0.15;
const DEFAULT_SCALE = 1;
const DEFAULT_SPEED = 0;
const DEFAULT_OPACITY = 0.25;

function validateUnitInterval(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be a finite number between 0 and 1, received ${String(value)}`);
  }
}

function createCanvasState(element: HTMLElement): CanvasState {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("noiseBackground() requires a canvas with a 2D rendering context");
  }
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.setProperty("position", "absolute");
  canvas.style.setProperty("inset", "0");
  canvas.style.setProperty("width", "100%");
  canvas.style.setProperty("height", "100%");
  canvas.style.setProperty("display", "block");
  canvas.style.setProperty("z-index", "-1");
  canvas.style.setProperty("pointer-events", "none");
  return { element, canvas, context, width: 0, height: 0 };
}

function drawNoise(state: CanvasState, intensity: number, scale: number): void {
  const { context, canvas, width, height } = state;
  if (canvas.width === 0 || canvas.height === 0) return;
  const image = context.createImageData(canvas.width, canvas.height);
  const data = image.data;
  const dpr = width > 0 ? canvas.width / width : 1;
  const blockSize = Math.max(1, Math.round(scale * dpr));
  const sampleAlpha = Math.round(intensity * 255);

  for (let y = 0; y < canvas.height; y += blockSize) {
    for (let x = 0; x < canvas.width; x += blockSize) {
      const isLight = Math.random() >= 0.5;
      const color = isLight ? 255 : 0;
      const alpha = Math.round(Math.random() * sampleAlpha);
      const endY = Math.min(y + blockSize, canvas.height);
      const endX = Math.min(x + blockSize, canvas.width);
      for (let blockY = y; blockY < endY; blockY++) {
        for (let blockX = x; blockX < endX; blockX++) {
          const pixel = (blockY * canvas.width + blockX) * 4;
          data[pixel] = color;
          data[pixel + 1] = color;
          data[pixel + 2] = color;
          data[pixel + 3] = alpha;
        }
      }
    }
  }

  context.putImageData(image, 0, 0);
}

/**
 * Adds a procedural canvas noise overlay behind target content. `speed` controls texture
 * refreshes per second; zero or reduced motion keeps the initial texture static.
 */
export function noiseBackground(
  target: AnimateTarget,
  options: NoiseBackgroundOptions = {},
): NoiseBackgroundControls {
  const {
    intensity = DEFAULT_INTENSITY,
    scale = DEFAULT_SCALE,
    speed = DEFAULT_SPEED,
    opacity = DEFAULT_OPACITY,
  } = options;

  validateUnitInterval("intensity", intensity);
  validateUnitInterval("opacity", opacity);
  if (typeof scale !== "number" || !Number.isFinite(scale) || scale <= 0) {
    throw new RangeError(`scale must be a finite number > 0, received ${String(scale)}`);
  }
  if (typeof speed !== "number" || !Number.isFinite(speed) || speed < 0) {
    throw new RangeError(`speed must be a finite number >= 0, received ${String(speed)}`);
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };
  if (typeof document === "undefined" || typeof document.createElement !== "function") {
    throw new Error("noiseBackground() requires document.createElement, which is not available in this environment");
  }

  let reducedMotion = prefersReducedMotion();
  if (
    speed > 0 &&
    (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function")
  ) {
    throw new Error("noiseBackground() requires requestAnimationFrame and cancelAnimationFrame when speed is positive");
  }

  // Create all canvases before changing the target DOM or inline styles.
  const states = elements.map(createCanvasState);
  const stateByElement = new Map(states.map((state) => [state.element, state]));
  const resized = (state: CanvasState, width: number, height: number): void => {
    setCanvasSize(state, width, height);
    drawNoise(state, intensity, scale);
  };

  for (const state of states) {
    const rect = state.element.getBoundingClientRect();
    resized(state, rect.width, rect.height);
    state.canvas.style.setProperty("opacity", String(opacity));
  }

  let destroyed = false;
  let documentVisible = typeof document === "undefined" || !document.hidden;
  let frameId: number | null = null;
  let previousTime: number | null = null;
  const interval = speed > 0 ? 1000 / speed : Number.POSITIVE_INFINITY;

  const stopFrame = (): void => {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
  };

  const tick = (time: number): void => {
    frameId = null;
    if (destroyed || reducedMotion || !documentVisible || speed === 0) return;
    if (previousTime === null || time - previousTime >= interval) {
      for (const state of states) drawNoise(state, intensity, scale);
      previousTime = time;
    }
    frameId = requestAnimationFrame(tick);
  };

  const schedule = (): void => {
    if (destroyed || reducedMotion || !documentVisible || speed === 0 || frameId !== null) return;
    frameId = requestAnimationFrame(tick);
  };

  const onVisibilityChange = (): void => {
    documentVisible = !document.hidden;
    if (documentVisible) {
      previousTime = null;
      schedule();
    } else {
      stopFrame();
    }
  };
  const hasVisibilityListener =
    typeof document !== "undefined" &&
    typeof document.addEventListener === "function" &&
    typeof document.removeEventListener === "function";

  let resizeObserver: ResizeObserver | undefined;
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver((entries) => {
      if (destroyed) return;
      for (const entry of entries) {
        const state = stateByElement.get(entry.target as HTMLElement);
        if (state) resized(state, entry.contentRect.width, entry.contentRect.height);
      }
    });
  }
  const onWindowResize = (): void => {
    if (destroyed) return;
    for (const state of states) {
      const rect = state.element.getBoundingClientRect();
      resized(state, rect.width, rect.height);
    }
  };
  const hasWindowResize = !resizeObserver && typeof window !== "undefined";

  const onMotionChange = (preference: boolean): void => {
    if (destroyed) return;
    reducedMotion = preference;
    if (reducedMotion) {
      stopFrame();
      for (const state of states) drawNoise(state, intensity, scale);
    } else {
      previousTime = null;
      schedule();
    }
  };
  let stopMotionListener = (): void => undefined;

  const acquired: HTMLElement[] = [];
  const inserted: CanvasState[] = [];
  try {
    for (const state of states) {
      acquireTarget(state.element);
      acquired.push(state.element);
      state.element.insertBefore(state.canvas, state.element.firstChild);
      inserted.push(state);
      resizeObserver?.observe(state.element);
    }
    if (hasWindowResize) window.addEventListener("resize", onWindowResize);
    if (hasVisibilityListener) document.addEventListener("visibilitychange", onVisibilityChange);
  } catch (error) {
    stopFrame();
    resizeObserver?.disconnect();
    if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
    if (hasVisibilityListener) document.removeEventListener("visibilitychange", onVisibilityChange);
    for (const state of inserted) {
      state.element.removeChild(state.canvas);
      releaseBackgroundCanvas(state.canvas);
    }
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  stopMotionListener = onReducedMotionChange(onMotionChange);
  schedule();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopFrame();
      stopMotionListener();
      resizeObserver?.disconnect();
      if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
      if (hasVisibilityListener) document.removeEventListener("visibilitychange", onVisibilityChange);
      for (const state of states) {
        if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
        releaseBackgroundCanvas(state.canvas);
        releaseTarget(state.element);
      }
    },
  };
}
