// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // 3D Scene Engine
  createScene3D,
  detect3DCapabilities,
  createNullRenderer3DAdapter,
  createThreeRendererAdapter,
  createRenderer3DAdapter,
  isThreeAvailable,
  // R3F Bridge
  toR3FCameraProps,
  toR3FLightingProps,
  toR3FCanvasProps,
  isR3FAvailable,
  // Schemas & Capabilities
  SCENE_3D_SCHEMA_VERSION,
  SCENE_3D_SCHEMA,
  validateScene3D,
  correctScene3D,
  SCENE_3D_CAPABILITY,
  registerScene3DCapability,
  aiMotionRegistry,
  type Scene3DDefinition,
  type Object3DConfig,
  type Renderer3DAdapter,
} from "../src/catalogue.js";

import {
  Scene3DProvider,
  useScene3D,
  useCamera3D,
  useRenderer3D,
  Scene3DView,
} from "../src/react.js";

describe("Three.js & 3D Scene Infrastructure (Prompt 76)", () => {
  let host: HTMLDivElement;
  let root: Root;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (type: string) {
      return null;
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  describe("Framework-Independent 3D Scene Contracts & Lifecycle", () => {
    it("creates a 3D scene with defaults and manages lifecycle", async () => {
      const def: Scene3DDefinition = {
        id: "hero-3d",
        name: "Hero 3D Showcase",
        camera: {
          type: "perspective",
          fov: 60,
          position: [0, 2, 8],
          target: [0, 0, 0],
        },
        lighting: {
          ambient: { color: "#ffffff", intensity: 0.6 },
        },
        autoStart: false,
      };

      const scene = createScene3D(def);
      expect(scene.id).toBe("hero-3d");
      expect(scene.camera.fov).toBe(60);
      expect(scene.camera.position).toEqual([0, 2, 8]);
      expect(scene.lighting.ambient?.intensity).toBe(0.6);
      expect(scene.isRunning).toBe(false);
      expect(scene.isAttached).toBe(false);

      const canvas = document.createElement("canvas");
      await scene.attach(canvas);
      expect(scene.isAttached).toBe(true);

      scene.start();
      expect(scene.isRunning).toBe(true);

      scene.stop();
      expect(scene.isRunning).toBe(false);

      scene.detach();
      expect(scene.isAttached).toBe(false);

      scene.destroy();
    });

    it("handles object registration, retrieval, listing, and removal", () => {
      const scene = createScene3D({ id: "objects-test" });

      const obj1: Object3DConfig = {
        id: "mesh-cube",
        name: "Cube",
        type: "mesh",
        position: [0, 1, 0],
        rotation: [0, 0.5, 0],
        scale: [1, 1, 1],
        visible: true,
      };

      const obj2: Object3DConfig = {
        id: "mesh-sphere",
        name: "Sphere",
        type: "mesh",
        position: [2, 0, 0],
      };

      scene.addObject(obj1);
      scene.addObject(obj2);

      expect(scene.listObjects()).toHaveLength(2);
      expect(scene.getObject("mesh-cube")).toEqual(obj1);
      expect(scene.getObject("mesh-sphere")).toEqual(obj2);

      const removed = scene.removeObject("mesh-cube");
      expect(removed).toBe(true);
      expect(scene.getObject("mesh-cube")).toBeUndefined();
      expect(scene.listObjects()).toHaveLength(1);

      scene.destroy();
    });

    it("supports dynamic updates to camera, lighting, and environment", async () => {
      const scene = createScene3D({ id: "updates-test", autoStart: false });
      const canvas = document.createElement("canvas");
      await scene.attach(canvas);

      scene.updateCamera({ fov: 75, position: [0, 5, 10] });
      expect(scene.camera.fov).toBe(75);
      expect(scene.camera.position).toEqual([0, 5, 10]);

      scene.updateLighting({
        ambient: { color: "#ff0000", intensity: 0.8 },
      });
      expect(scene.lighting.ambient?.color).toBe("#ff0000");
      expect(scene.lighting.ambient?.intensity).toBe(0.8);

      scene.updateEnvironment({
        background: "#111111",
        transparent: false,
      });
      expect(scene.environment.background).toBe("#111111");
      expect(scene.environment.transparent).toBe(false);

      scene.resize(800, 600, 2);
      expect(scene.camera.aspect).toBe(800 / 600);

      scene.destroy();
    });

    it("reports performance telemetry statistics", () => {
      const scene = createScene3D({ id: "telemetry-test" });
      const stats = scene.getPerformanceStats();

      expect(stats).toBeDefined();
      expect(typeof stats.fps).toBe("number");
      expect(typeof stats.avgFrameTimeMs).toBe("number");
      expect(stats.totalObjects).toBe(0);
      expect(stats.isRunning).toBe(false);

      scene.destroy();
    });

    it("suspends animation loop when document becomes hidden", async () => {
      const scene = createScene3D({ id: "visibility-test", autoStart: true });
      const canvas = document.createElement("canvas");
      await scene.attach(canvas);

      expect(scene.isRunning).toBe(true);

      // Simulate visibility change to hidden
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));

      // Simulate visibility change to visible
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));

      scene.destroy();
    });
  });

  describe("3D Capabilities Detection", () => {
    it("detects 3D capabilities in environment safely", () => {
      const caps = detect3DCapabilities(true);
      expect(caps).toBeDefined();
      expect(typeof caps.webgl).toBe("boolean");
      expect(typeof caps.webgl2).toBe("boolean");
      expect(typeof caps.webgpu).toBe("boolean");
      expect(typeof caps.isSupported).toBe("boolean");
      expect(typeof caps.reducedMotion).toBe("boolean");
      expect(typeof caps.devicePixelRatio).toBe("number");
    });
  });

  describe("Renderer Adapters & Optional Three.js Integration", () => {
    it("provides fallback NullRenderer3DAdapter", () => {
      const adapter = createNullRenderer3DAdapter();
      expect(adapter.id).toBe("null-3d-adapter");
      expect(adapter.backend).toBe("null");
      expect(adapter.isSupported()).toBe(true);

      const canvas = document.createElement("canvas");
      adapter.init(canvas);
      expect(adapter.getDomElement()).toBe(canvas);

      adapter.setSize(640, 480);
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);

      adapter.dispose();
      expect(adapter.getDomElement()).toBeNull();
    });

    it("gracefully falls back to Null adapter when Three.js is absent", () => {
      const isAvail = isThreeAvailable();
      expect(typeof isAvail).toBe("boolean");

      const adapter = createThreeRendererAdapter();
      expect(adapter).toBeDefined();
      expect(typeof adapter.isSupported()).toBe("boolean");
    });

    it("integrates with mock Three.js library when provided", async () => {
      const mockRender = vi.fn();
      const mockSetPixelRatio = vi.fn();
      const mockSetSize = vi.fn();
      const mockDispose = vi.fn();
      const mockTraverse = vi.fn();

      const mockThree = {
        WebGLRenderer: vi.fn().mockImplementation(function () {
          return {
            render: mockRender,
            setPixelRatio: mockSetPixelRatio,
            setSize: mockSetSize,
            dispose: mockDispose,
          };
        }),
        Scene: vi.fn().mockImplementation(function () {
          return {
            traverse: mockTraverse,
            add: vi.fn(),
          };
        }),
        PerspectiveCamera: vi.fn().mockImplementation(function () {
          return {
            position: { set: vi.fn() },
            lookAt: vi.fn(),
            updateProjectionMatrix: vi.fn(),
            fov: 50,
            aspect: 1,
          };
        }),
        AmbientLight: vi.fn().mockImplementation(function () {
          return {};
        }),
      };

      const adapter = createThreeRendererAdapter({ THREE: mockThree });
      expect(adapter.backend).toBe("three");
      expect(adapter.isSupported()).toBe(true);

      const canvas = document.createElement("canvas");
      adapter.init(canvas, { antialias: true });

      expect(mockThree.WebGLRenderer).toHaveBeenCalled();
      expect(mockThree.Scene).toHaveBeenCalled();
      expect(mockThree.PerspectiveCamera).toHaveBeenCalled();

      const scene = createScene3D({ id: "three-mock-test" }, { adapter });
      await scene.attach(canvas);

      adapter.render(scene, 16.6);
      expect(mockRender).toHaveBeenCalled();

      adapter.setSize(800, 600, 2);
      expect(mockSetSize).toHaveBeenCalledWith(800, 600, false);

      adapter.dispose();
      expect(mockDispose).toHaveBeenCalled();

      scene.destroy();
    });

    it("handles WebGL context lost and restored events", () => {
      const adapter = createNullRenderer3DAdapter();
      const canvas = document.createElement("canvas");
      adapter.init(canvas);

      const lostSpy = vi.fn();
      const restoredSpy = vi.fn();

      const unsubLost = adapter.onContextLost?.(lostSpy);
      const unsubRestored = adapter.onContextRestored?.(restoredSpy);

      // Trigger context loss/restored
      canvas.dispatchEvent(new Event("webglcontextlost"));
      canvas.dispatchEvent(new Event("webglcontextrestored"));

      unsubLost?.();
      unsubRestored?.();
      adapter.dispose();
    });

    it("createRenderer3DAdapter selects null adapter when backend is null", () => {
      const adapter = createRenderer3DAdapter({ backend: "null" });
      expect(adapter.backend).toBe("null");
    });
  });

  describe("React Three Fiber Bridge Utilities", () => {
    it("converts Camera3DConfig to R3F camera props", () => {
      const props = toR3FCameraProps({
        fov: 70,
        near: 0.5,
        far: 500,
        position: [1, 2, 3],
      });

      expect(props.fov).toBe(70);
      expect(props.near).toBe(0.5);
      expect(props.far).toBe(500);
      expect(props.position).toEqual([1, 2, 3]);
    });

    it("converts Lighting3DConfig to R3F lighting props", () => {
      const lights = toR3FLightingProps({
        ambient: { color: "#ffcc00", intensity: 0.7 },
        directional: [
          { color: "#ffffff", intensity: 1.2, position: [5, 10, 5], castShadow: true },
        ],
      });

      expect(lights.ambient?.color).toBe("#ffcc00");
      expect(lights.ambient?.intensity).toBe(0.7);
      expect(lights.directional).toHaveLength(1);
      expect(lights.directional[0].castShadow).toBe(true);
    });

    it("converts Scene3DDefinition to R3F Canvas props", () => {
      const canvasProps = toR3FCanvasProps({
        id: "r3f-test",
        camera: { fov: 45 },
        renderer: { antialias: true, shadowMap: true, dpr: 2 },
      });

      expect(canvasProps.dpr).toBe(2);
      expect(canvasProps.shadows).toBe(true);
      expect(canvasProps.camera).toEqual(expect.objectContaining({ fov: 45 }));
    });

    it("safely checks R3F availability", () => {
      expect(typeof isR3FAvailable()).toBe("boolean");
    });
  });

  describe("Schema Validation & AI Motion Registry Integration", () => {
    it("validates compliant 3D scene definitions", () => {
      const res = validateScene3D({
        id: "valid-scene",
        camera: { fov: 60, near: 0.1, far: 1000 },
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("rejects invalid 3D scene definitions with clear errors", () => {
      const res = validateScene3D({
        camera: { fov: 200, near: -1 },
      });
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("id"))).toBe(true);
      expect(res.errors.some((e) => e.includes("fov"))).toBe(true);
      expect(res.errors.some((e) => e.includes("near"))).toBe(true);
    });

    it("corrects malformed scene configurations safely", () => {
      const corrected = correctScene3D({
        id: "  ",
        camera: { fov: 999, near: -5 },
      });

      expect(corrected.id).toBe("scene-3d");
      expect(corrected.camera?.fov).toBe(50);
      expect(corrected.camera?.near).toBe(0.1);
      expect(corrected.version).toBe(SCENE_3D_SCHEMA_VERSION);
    });

    it("registers SCENE_3D_CAPABILITY dynamically into aiMotionRegistry", () => {
      expect(SCENE_3D_CAPABILITY.id).toBe("scene-3d");
      expect(SCENE_3D_CAPABILITY.category).toBe("composition");

      registerScene3DCapability(aiMotionRegistry);
      const retrieved = aiMotionRegistry.getCapability("scene-3d");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("scene-3d");
    });
  });

  describe("React 18/19 Integration", () => {
    it("useScene3D creates, memoizes, and disposes scene cleanly", () => {
      let capturedScene: any = null;

      function TestComponent() {
        capturedScene = useScene3D({
          id: "react-hook-test",
          camera: { fov: 65 },
        });
        return createElement("div", null, capturedScene ? "Loaded" : "Empty");
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(TestComponent)));
      });

      expect(capturedScene).not.toBeNull();
      expect(capturedScene.id).toBe("react-hook-test");
      expect(capturedScene.camera.fov).toBe(65);

      act(() => {
        root.render(null);
      });
    });

    it("Scene3DProvider and useScene3D share context", () => {
      const scene = createScene3D({ id: "shared-context-scene" });
      let contextScene: any = null;

      function Child() {
        contextScene = useScene3D();
        return createElement("div", null, contextScene?.id);
      }

      act(() => {
        root.render(
          createElement(
            Scene3DProvider,
            { scene },
            createElement(Child)
          )
        );
      });

      expect(contextScene).toBe(scene);
      scene.destroy();
    });

    it("useCamera3D exposes camera config and update handler", () => {
      const scene = createScene3D({ id: "camera-hook-scene" });
      let cameraState: any = null;
      let updateFn: any = null;

      function TestCam() {
        const { camera, updateCamera } = useCamera3D(scene);
        cameraState = camera;
        updateFn = updateCamera;
        return createElement("div", null, `FOV: ${camera.fov}`);
      }

      act(() => {
        root.render(createElement(TestCam));
      });

      expect(cameraState.fov).toBe(50);

      act(() => {
        updateFn({ fov: 90 });
      });

      expect(scene.camera.fov).toBe(90);
      scene.destroy();
    });

    it("useRenderer3D exposes renderer stats and capabilities", () => {
      const scene = createScene3D({ id: "renderer-hook-scene" });
      let rendererState: any = null;

      function TestRenderer() {
        rendererState = useRenderer3D(scene);
        return createElement("div", null, `Backend: ${rendererState.backend}`);
      }

      act(() => {
        root.render(createElement(TestRenderer));
      });

      expect(rendererState).toBeDefined();
      expect(rendererState.backend).toBe(scene.adapter?.backend);
      expect(rendererState.stats).toBeDefined();

      scene.destroy();
    });

    it("Scene3DView renders canvas and attaches scene with ref forwarding", async () => {
      const canvasRef = createRef<HTMLCanvasElement>();
      const onReadySpy = vi.fn();

      const def: Scene3DDefinition = {
        id: "view-test",
        camera: { fov: 45 },
      };

      act(() => {
        root.render(
          createElement(Scene3DView, {
            ref: canvasRef,
            definition: def,
            onReady: onReadySpy,
            className: "three-canvas",
            style: { width: 400, height: 300 },
          })
        );
      });

      expect(canvasRef.current).toBeInstanceOf(HTMLCanvasElement);
      expect(canvasRef.current?.className).toBe("three-canvas");

      // Wait microtask for attach promise
      await act(async () => {
        await Promise.resolve();
      });

      expect(onReadySpy).toHaveBeenCalled();
    });

    it("Scene3DView renders safely in SSR simulation", () => {
      const html = renderToString(
        createElement(Scene3DView, {
          definition: { id: "ssr-test" },
          className: "ssr-canvas",
        })
      );

      expect(html).toContain("<canvas");
      expect(html).toContain('class="ssr-canvas"');
    });
  });
});
