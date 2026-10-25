import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

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

const targetRecords = new WeakMap<HTMLElement, TargetRecord>();

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
  if (restorePosition) element.style.setProperty("position", "relative");
  if (restoreIsolation) element.style.setProperty("isolation", "isolate");

  targetRecords.set(element, { count: 1, position, isolation, restorePosition, restoreIsolation });
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

  const mediaQuery =
    typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;
  let reducedMotion = mediaQuery?.matches === true;
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
    const dpr = typeof devicePixelRatio === "number" ? Math.max(1, Math.min(devicePixelRatio, 2)) : 1;
    state.width = Math.max(0, width);
    state.height = Math.max(0, height);
    state.canvas.width = Math.round(state.width * dpr);
    state.canvas.height = Math.round(state.height * dpr);
    drawNoise(state, intensity, scale);
  };

  for (const state of states) {
    const rect = state.element.getBoundingClientRect();
    resized(state, rect.width, rect.height);
    state.canvas.style.setProperty("opacity", String(opacity));
  }

  let destroyed = false;
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
    if (destroyed || reducedMotion || speed === 0) return;
    if (previousTime === null || time - previousTime >= interval) {
      for (const state of states) drawNoise(state, intensity, scale);
      previousTime = time;
    }
    frameId = requestAnimationFrame(tick);
  };

  const schedule = (): void => {
    if (destroyed || reducedMotion || speed === 0 || frameId !== null) return;
    frameId = requestAnimationFrame(tick);
  };

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

  const onMotionChange = (event: MediaQueryListEvent): void => {
    if (destroyed) return;
    reducedMotion = event.matches;
    if (reducedMotion) {
      stopFrame();
      for (const state of states) drawNoise(state, intensity, scale);
    } else {
      previousTime = null;
      schedule();
    }
  };

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
  } catch (error) {
    stopFrame();
    resizeObserver?.disconnect();
    for (const state of inserted) state.element.removeChild(state.canvas);
    for (const element of acquired) releaseTarget(element);
    throw error;
  }

  mediaQuery?.addEventListener?.("change", onMotionChange);
  schedule();

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopFrame();
      mediaQuery?.removeEventListener?.("change", onMotionChange);
      resizeObserver?.disconnect();
      if (hasWindowResize) window.removeEventListener("resize", onWindowResize);
      for (const state of states) {
        if (state.canvas.parentElement === state.element) state.element.removeChild(state.canvas);
        releaseTarget(state.element);
      }
    },
  };
}
