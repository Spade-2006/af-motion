/**
 * AF Motion 3D Renderer Adapters
 *
 * Implements framework-independent renderer adapters, including the optional
 * Three.js adapter and the graceful fallback Null renderer adapter.
 */

import { detect3DCapabilities } from "./capabilities.js";
import type {
  Camera3DConfig,
  Environment3DConfig,
  Lighting3DConfig,
  Renderer3DAdapter,
  Renderer3DBackend,
  Renderer3DConfig,
  Scene3DCapabilities,
  Scene3DInstance,
} from "./types.js";

/**
 * Fallback Null Renderer Adapter used when WebGL or Three.js is unavailable.
 */
export function createNullRenderer3DAdapter(): Renderer3DAdapter {
  let canvasEl: HTMLCanvasElement | null = null;
  const contextLostListeners = new Set<() => void>();
  const contextRestoredListeners = new Set<() => void>();

  return {
    id: "null-3d-adapter",
    name: "Null 3D Renderer Adapter",
    backend: "null",
    isSupported(): boolean {
      return true;
    },
    init(canvas: HTMLCanvasElement): void {
      canvasEl = canvas;
    },
    render(_scene: Scene3DInstance, _deltaTimeMs: number): void {
      // No-op fallback
    },
    setSize(width: number, height: number, _dpr = 1): void {
      if (canvasEl) {
        canvasEl.width = width;
        canvasEl.height = height;
      }
    },
    dispose(): void {
      canvasEl = null;
      contextLostListeners.clear();
      contextRestoredListeners.clear();
    },
    getDomElement(): HTMLCanvasElement | null {
      return canvasEl;
    },
    onContextLost(cb: () => void): () => void {
      contextLostListeners.add(cb);
      return () => contextLostListeners.delete(cb);
    },
    onContextRestored(cb: () => void): () => void {
      contextRestoredListeners.add(cb);
      return () => contextRestoredListeners.delete(cb);
    },
  };
}

export interface ThreeAdapterOptions {
  /** Optional custom or injected THREE library namespace */
  readonly THREE?: any;
}

/**
 * Check if Three.js is available either in global scope or provided options.
 */
export function isThreeAvailable(customThree?: any): boolean {
  if (customThree && typeof customThree === "object") return true;
  if (typeof globalThis !== "undefined" && (globalThis as any).THREE) return true;
  return false;
}

/**
 * Resolve THREE instance from options or global environment.
 */
function resolveThree(customThree?: any): any | null {
  if (customThree && typeof customThree === "object") return customThree;
  if (typeof globalThis !== "undefined" && (globalThis as any).THREE) {
    return (globalThis as any).THREE;
  }
  return null;
}

/**
 * Create an optional Three.js Renderer Adapter.
 * Does not force Three.js into the core bundle. If Three.js is absent,
 * falls back gracefully.
 */
export function createThreeRendererAdapter(options?: ThreeAdapterOptions): Renderer3DAdapter {
  const THREE = resolveThree(options?.THREE);

  if (!THREE) {
    // Return null adapter as graceful fallback
    return createNullRenderer3DAdapter();
  }

  let canvasEl: HTMLCanvasElement | null = null;
  let renderer: any = null;
  let threeScene: any = null;
  let threeCamera: any = null;
  let ambientLight: any = null;
  let directionalLights: any[] = [];
  let pointLights: any[] = [];

  const contextLostListeners = new Set<() => void>();
  const contextRestoredListeners = new Set<() => void>();

  function handleContextLost(event: Event) {
    event.preventDefault?.();
    for (const listener of contextLostListeners) {
      listener();
    }
  }

  function handleContextRestored() {
    for (const listener of contextRestoredListeners) {
      listener();
    }
  }

  return {
    id: "three-adapter",
    name: "Three.js Renderer Adapter",
    backend: "three",
    isSupported(): boolean {
      return isThreeAvailable(THREE);
    },
    init(canvas: HTMLCanvasElement, config?: Renderer3DConfig): void {
      canvasEl = canvas;

      // Listen for WebGL context events
      canvas.addEventListener("webglcontextlost", handleContextLost, false);
      canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

      // Initialize Three.js WebGLRenderer
      const dpr = config?.dpr === "auto" || !config?.dpr ? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1) : config.dpr;

      if (typeof THREE.WebGLRenderer === "function") {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: config?.antialias ?? true,
          alpha: config?.alpha ?? true,
          powerPreference: config?.powerPreference ?? "default",
          preserveDrawingBuffer: config?.preserveDrawingBuffer ?? false,
        });

        renderer.setPixelRatio?.(dpr);
        renderer.setSize?.(canvas.clientWidth || 300, canvas.clientHeight || 150, false);

        if (config?.shadowMap && renderer.shadowMap) {
          renderer.shadowMap.enabled = true;
        }
      }

      // Initialize THREE.Scene
      if (typeof THREE.Scene === "function") {
        threeScene = new THREE.Scene();
      }

      // Default perspective camera
      if (typeof THREE.PerspectiveCamera === "function") {
        const aspect = (canvas.clientWidth || 300) / (canvas.clientHeight || 150);
        threeCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        threeCamera.position?.set?.(0, 0, 5);
      }
    },
    render(scene: Scene3DInstance, _deltaTimeMs: number): void {
      if (!renderer || !threeScene || !threeCamera) return;

      // Sync camera
      syncCamera(threeCamera, scene.camera, canvasEl);

      // Sync lighting without reallocating lights every frame
      const updatedLights = syncLighting(THREE, threeScene, scene.lighting, ambientLight, directionalLights, pointLights);
      ambientLight = updatedLights.ambientLight;
      directionalLights = updatedLights.directionalLights;
      pointLights = updatedLights.pointLights;

      // Sync environment
      syncEnvironment(THREE, threeScene, scene.environment);

      // Render Three.js frame
      renderer.render?.(threeScene, threeCamera);
    },
    setSize(width: number, height: number, dpr = 1): void {
      if (renderer) {
        renderer.setPixelRatio?.(dpr);
        renderer.setSize?.(width, height, false);
      }
      if (threeCamera && width > 0 && height > 0) {
        if ("aspect" in threeCamera) {
          threeCamera.aspect = width / height;
          threeCamera.updateProjectionMatrix?.();
        }
      }
    },
    dispose(): void {
      if (canvasEl) {
        canvasEl.removeEventListener("webglcontextlost", handleContextLost);
        canvasEl.removeEventListener("webglcontextrestored", handleContextRestored);
      }

      // Dispose three scene objects
      if (threeScene && typeof threeScene.traverse === "function") {
        threeScene.traverse((obj: any) => {
          if (obj.geometry?.dispose) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: any) => m.dispose?.());
            } else if (obj.material.dispose) {
              obj.material.dispose();
            }
          }
        });
      }

      renderer?.dispose?.();
      renderer = null;
      threeScene = null;
      threeCamera = null;
      ambientLight = null;
      directionalLights = [];
      pointLights = [];
      canvasEl = null;
      contextLostListeners.clear();
      contextRestoredListeners.clear();
    },
    getDomElement(): HTMLCanvasElement | null {
      return canvasEl;
    },
    onContextLost(cb: () => void): () => void {
      contextLostListeners.add(cb);
      return () => contextLostListeners.delete(cb);
    },
    onContextRestored(cb: () => void): () => void {
      contextRestoredListeners.add(cb);
      return () => contextRestoredListeners.delete(cb);
    },
  };
}

function syncCamera(threeCamera: any, config: Camera3DConfig, canvas: HTMLCanvasElement | null) {
  if (!threeCamera) return;

  if (config.position && threeCamera.position?.set) {
    threeCamera.position.set(config.position[0], config.position[1], config.position[2]);
  }
  if (config.target && threeCamera.lookAt) {
    threeCamera.lookAt(config.target[0], config.target[1], config.target[2]);
  }
  if (config.fov && "fov" in threeCamera) {
    threeCamera.fov = config.fov;
    threeCamera.updateProjectionMatrix?.();
  }
  if (config.near !== undefined) threeCamera.near = config.near;
  if (config.far !== undefined) threeCamera.far = config.far;
  if (config.zoom !== undefined) threeCamera.zoom = config.zoom;

  if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0 && "aspect" in threeCamera) {
    threeCamera.aspect = canvas.clientWidth / canvas.clientHeight;
    threeCamera.updateProjectionMatrix?.();
  }
}

function syncLighting(
  THREE: any,
  threeScene: any,
  config: Lighting3DConfig,
  currentAmbient: any,
  currentDirectional: any[],
  currentPoint: any[]
): { ambientLight: any; directionalLights: any[]; pointLights: any[] } {
  if (!THREE || !threeScene) {
    return { ambientLight: currentAmbient, directionalLights: currentDirectional, pointLights: currentPoint };
  }

  // Ambient light (reuse existing instance)
  let ambientLight = currentAmbient;
  if (config.ambient && typeof THREE.AmbientLight === "function") {
    if (!ambientLight) {
      ambientLight = new THREE.AmbientLight(
        config.ambient.color ?? 0xffffff,
        config.ambient.intensity ?? 0.5
      );
      threeScene.add?.(ambientLight);
    } else {
      ambientLight.intensity = config.ambient.intensity ?? 0.5;
      if (ambientLight.color?.set && config.ambient.color !== undefined) {
        ambientLight.color.set(config.ambient.color);
      }
    }
  }

  // Directional lights (reuse instances by index, remove excess)
  const dirSpecs = Array.isArray(config.directional) ? config.directional : [];
  if (typeof THREE.DirectionalLight === "function") {
    while (currentDirectional.length > dirSpecs.length) {
      const removed = currentDirectional.pop();
      if (removed) threeScene.remove?.(removed);
    }
    dirSpecs.forEach((d, idx) => {
      let dir = currentDirectional[idx];
      if (!dir) {
        dir = new THREE.DirectionalLight(d.color ?? 0xffffff, d.intensity ?? 1);
        currentDirectional[idx] = dir;
        threeScene.add?.(dir);
      } else {
        dir.intensity = d.intensity ?? 1;
        if (dir.color?.set && d.color !== undefined) dir.color.set(d.color);
      }
      if (d.position && dir.position?.set) {
        dir.position.set(d.position[0], d.position[1], d.position[2]);
      }
      if (d.castShadow !== undefined) dir.castShadow = Boolean(d.castShadow);
    });
  }

  // Point lights (reuse instances by index, remove excess)
  const pointSpecs = Array.isArray(config.point) ? config.point : [];
  if (typeof THREE.PointLight === "function") {
    while (currentPoint.length > pointSpecs.length) {
      const removed = currentPoint.pop();
      if (removed) threeScene.remove?.(removed);
    }
    pointSpecs.forEach((p, idx) => {
      let point = currentPoint[idx];
      if (!point) {
        point = new THREE.PointLight(p.color ?? 0xffffff, p.intensity ?? 1, p.distance ?? 0, p.decay ?? 2);
        currentPoint[idx] = point;
        threeScene.add?.(point);
      } else {
        point.intensity = p.intensity ?? 1;
        if (p.distance !== undefined) point.distance = p.distance;
        if (p.decay !== undefined) point.decay = p.decay;
        if (point.color?.set && p.color !== undefined) point.color.set(p.color);
      }
      if (p.position && point.position?.set) {
        point.position.set(p.position[0], p.position[1], p.position[2]);
      }
    });
  }

  return { ambientLight, directionalLights: currentDirectional, pointLights: currentPoint };
}

function syncEnvironment(THREE: any, threeScene: any, config?: Environment3DConfig) {
  if (!THREE || !threeScene || !config) return;

  if (config.background && typeof THREE.Color === "function") {
    threeScene.background = new THREE.Color(config.background);
  }

  if (config.fog) {
    if (config.fog.type === "exponential" && typeof THREE.FogExp2 === "function") {
      threeScene.fog = new THREE.FogExp2(config.fog.color ?? 0x000000, config.fog.density ?? 0.01);
    } else if (typeof THREE.Fog === "function") {
      threeScene.fog = new THREE.Fog(config.fog.color ?? 0x000000, config.fog.near ?? 1, config.fog.far ?? 1000);
    }
  }
}

/**
 * Create a suitable 3D renderer adapter based on configuration and available capabilities.
 */
export function createRenderer3DAdapter(
  config?: Renderer3DConfig,
  capabilities?: Scene3DCapabilities
): Renderer3DAdapter {
  const caps = capabilities ?? detect3DCapabilities();
  const backend: Renderer3DBackend = config?.backend ?? "three";

  if (backend === "null" || !caps.isSupported) {
    return createNullRenderer3DAdapter();
  }

  if (backend === "three") {
    return createThreeRendererAdapter();
  }

  return createNullRenderer3DAdapter();
}
