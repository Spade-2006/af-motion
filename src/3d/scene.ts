/**
 * AF Motion 3D Scene Lifecycle & State Management
 *
 * Framework-independent 3D scene instance orchestrating objects, cameras,
 * lighting, environments, render loops, and performance telemetry.
 */

import { createRenderer3DAdapter } from "./adapter.js";
import { detect3DCapabilities } from "./capabilities.js";
import type {
  Camera3DConfig,
  CreateScene3DOptions,
  Environment3DConfig,
  Lighting3DConfig,
  Object3DConfig,
  Renderer3DAdapter,
  Scene3DCapabilities,
  Scene3DDefinition,
  Scene3DInstance,
  ScenePerformanceStats,
} from "./types.js";

let sceneCounter = 0;

export function createScene3D(
  definition: Scene3DDefinition,
  options?: CreateScene3DOptions
): Scene3DInstance {
  const id = definition.id || `scene-3d-${++sceneCounter}`;
  const capabilities: Scene3DCapabilities = detect3DCapabilities();

  let isRunning = false;
  let isAttached = false;
  let canvasEl: HTMLCanvasElement | null = null;
  let animationFrameId: number | null = null;
  let lastTimestamp = 0;

  // Frame timing stats
  const frameTimes: number[] = [];
  const maxStatsWindow = 30;

  // Internal mutable state
  let currentCamera: Camera3DConfig = {
    type: "perspective",
    fov: 50,
    aspect: 1,
    near: 0.1,
    far: 1000,
    position: [0, 0, 5],
    target: [0, 0, 0],
    ...definition.camera,
  };

  let currentLighting: Lighting3DConfig = {
    ambient: { color: "#ffffff", intensity: 0.5 },
    directional: [],
    point: [],
    spot: [],
    ...definition.lighting,
  };

  let currentEnvironment: Environment3DConfig = {
    background: "#000000",
    transparent: true,
    ...definition.environment,
  };

  const objectMap = new Map<string, Object3DConfig>();
  if (definition.objects) {
    for (const obj of definition.objects) {
      objectMap.set(obj.id, obj);
    }
  }

  // Adapter selection
  const adapter: Renderer3DAdapter =
    options?.adapter ?? createRenderer3DAdapter(definition.renderer, capabilities);

  // Context listener sets
  const contextLostCallbacks = new Set<() => void>();
  const contextRestoredCallbacks = new Set<() => void>();

  // Attach context listeners to adapter if supported
  adapter.onContextLost?.(() => {
    for (const cb of contextLostCallbacks) cb();
  });
  adapter.onContextRestored?.(() => {
    for (const cb of contextRestoredCallbacks) cb();
  });

  // Reduced motion preference
  const respectReducedMotion =
    options?.respectReducedMotion ?? definition.respectReducedMotion ?? true;
  const isReducedMotion = respectReducedMotion && capabilities.reducedMotion;

  function renderFrame(timestamp: number) {
    if (!isRunning) return;

    if (lastTimestamp > 0) {
      const delta = timestamp - lastTimestamp;
      frameTimes.push(delta);
      if (frameTimes.length > maxStatsWindow) frameTimes.shift();

      if (isAttached && adapter) {
        adapter.render(sceneInstance, delta);
      }
    } else {
      if (isAttached && adapter) {
        adapter.render(sceneInstance, 16.6);
      }
    }

    lastTimestamp = timestamp;

    if (isRunning && !isReducedMotion) {
      if (typeof requestAnimationFrame === "function") {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    }
  }

  function handleVisibilityChange() {
    if (typeof document === "undefined") return;
    if (document.hidden) {
      if (animationFrameId !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else if (isRunning && !isReducedMotion) {
      lastTimestamp = 0;
      if (typeof requestAnimationFrame === "function") {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    }
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  const sceneInstance: Scene3DInstance = {
    id,
    definition,
    adapter,
    capabilities,
    get isRunning() {
      return isRunning;
    },
    get isAttached() {
      return isAttached;
    },
    get camera() {
      return currentCamera;
    },
    get lighting() {
      return currentLighting;
    },
    get environment() {
      return currentEnvironment;
    },

    async attach(canvas: HTMLCanvasElement): Promise<void> {
      if (canvasEl === canvas && isAttached) return;

      canvasEl = canvas;
      isAttached = true;
      adapter.init(canvas, definition.renderer);

      const dpr =
        options?.dpr === "auto" || !options?.dpr
          ? capabilities.devicePixelRatio
          : options.dpr;
      const width = canvas.clientWidth || canvas.width || 300;
      const height = canvas.clientHeight || canvas.height || 150;
      adapter.setSize(width, height, dpr);

      if (options?.autoStart ?? definition.autoStart ?? true) {
        sceneInstance.start();
      } else {
        // Initial static frame render
        sceneInstance.requestFrame();
      }
    },

    detach(): void {
      sceneInstance.stop();
      isAttached = false;
      canvasEl = null;
    },

    start(): void {
      if (isRunning) return;
      isRunning = true;
      lastTimestamp = 0;

      if (!isReducedMotion && typeof requestAnimationFrame === "function") {
        animationFrameId = requestAnimationFrame(renderFrame);
      } else {
        // Single static render for reduced motion
        sceneInstance.requestFrame();
      }
    },

    stop(): void {
      isRunning = false;
      if (animationFrameId !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      lastTimestamp = 0;
    },

    requestFrame(): void {
      if (isAttached && adapter) {
        adapter.render(sceneInstance, 16.6);
      }
    },

    addObject(object: Object3DConfig): void {
      objectMap.set(object.id, object);
    },

    removeObject(objectId: string): boolean {
      return objectMap.delete(objectId);
    },

    getObject(objectId: string): Object3DConfig | undefined {
      return objectMap.get(objectId);
    },

    listObjects(): readonly Object3DConfig[] {
      return Array.from(objectMap.values());
    },

    updateCamera(config: Partial<Camera3DConfig>): void {
      currentCamera = { ...currentCamera, ...config };
      if (!isRunning) {
        sceneInstance.requestFrame();
      }
    },

    updateLighting(config: Partial<Lighting3DConfig>): void {
      currentLighting = { ...currentLighting, ...config };
      if (!isRunning) {
        sceneInstance.requestFrame();
      }
    },

    updateEnvironment(config: Partial<Environment3DConfig>): void {
      currentEnvironment = { ...currentEnvironment, ...config };
      if (!isRunning) {
        sceneInstance.requestFrame();
      }
    },

    resize(width?: number, height?: number, dpr?: number): void {
      if (!canvasEl) return;
      const targetW = width ?? canvasEl.clientWidth ?? canvasEl.width;
      const targetH = height ?? canvasEl.clientHeight ?? canvasEl.height;
      const targetDpr = dpr ?? capabilities.devicePixelRatio;

      adapter.setSize(targetW, targetH, targetDpr);
      if (targetH > 0) {
        currentCamera = { ...currentCamera, aspect: targetW / targetH };
      }
      if (!isRunning) {
        sceneInstance.requestFrame();
      }
    },

    getPerformanceStats(): ScenePerformanceStats {
      const avgTime =
        frameTimes.length > 0
          ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
          : 16.6;
      const fps = avgTime > 0 ? Math.round(1000 / avgTime) : 60;

      return {
        fps: Math.min(fps, 144),
        avgFrameTimeMs: Math.round(avgTime * 10) / 10,
        totalObjects: objectMap.size,
        isRunning,
        backend: adapter.backend,
      };
    },

    onContextLost(cb: () => void): () => void {
      contextLostCallbacks.add(cb);
      return () => contextLostCallbacks.delete(cb);
    },

    onContextRestored(cb: () => void): () => void {
      contextRestoredCallbacks.add(cb);
      return () => contextRestoredCallbacks.delete(cb);
    },

    destroy(): void {
      sceneInstance.stop();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      adapter.dispose();
      objectMap.clear();
      contextLostCallbacks.clear();
      contextRestoredCallbacks.clear();
      canvasEl = null;
      isAttached = false;
    },
  };

  return sceneInstance;
}
