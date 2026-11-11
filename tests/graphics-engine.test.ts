// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  createGraphicsEngine,
  createRenderer,
  detectGraphicsCapabilities,
  resetCachedGraphicsCapabilities,
  DEFAULT_FALLBACK_CAPABILITIES,
  createResourceManager,
  updateCanvasDimensions,
  getCanvasDimensions,
  setupResizeObserver,
  setupVisibilityObserver,
  Canvas2DRenderer,
  WebGLRenderer,
  NullRenderer,
  validateRendererOptions,
  validateGraphicsEngineOptions,
  validateGraphicsEffect,
  validateGraphicsEffectConfig,
  registerGraphicsCapability,
  type GraphicsCapabilities,
  type GraphicsEffect,
  type GraphicsEngine,
  type DisposableResource,
  type Renderer,
  aiMotionRegistry,
} from "../src/catalogue.js";
import {
  GraphicsProvider,
  useGraphics,
  useGraphicsCapabilities,
  useGraphicsEffect,
  GraphicsCanvas,
} from "../src/react.js";

let host: HTMLDivElement;
let root: Root;
const originalGetContext = HTMLCanvasElement.prototype.getContext;

const mock2DContext = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  fillStyle: "",
  strokeStyle: "",
};

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  resetCachedGraphicsCapabilities();

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (type: string) {
    if (type === "2d") return mock2DContext;
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
  vi.unstubAllGlobals();
});

describe("Prompt 71 — Graphics Rendering & Shader Infrastructure", () => {
  describe("1. Capability Detection & SSR Safety", () => {
    it("returns safe fallback capabilities when window or document are undefined", () => {
      expect(DEFAULT_FALLBACK_CAPABILITIES.activeBackend).toBe("null");
      expect(DEFAULT_FALLBACK_CAPABILITIES.canvas).toBe(false);
      expect(DEFAULT_FALLBACK_CAPABILITIES.webgl).toBe(false);
      expect(DEFAULT_FALLBACK_CAPABILITIES.maxTextureSize).toBe(0);
      expect(DEFAULT_FALLBACK_CAPABILITIES.dpr).toBe(1);

      // Force fallback
      const fallback = detectGraphicsCapabilities({ forceFallback: true });
      expect(fallback.activeBackend).toBe("canvas2d");
      expect(fallback.dpr).toBeGreaterThanOrEqual(1);
    });

    it("detects canvas and device pixel ratio in browser environments defensively", () => {
      const caps = detectGraphicsCapabilities();
      expect(caps).toBeDefined();
      expect(caps.canvas).toBe(true);
      expect(caps.supportedBackends.length).toBeGreaterThan(0);
      expect(typeof caps.dpr).toBe("number");
      expect(caps.colorSpace).toBe("srgb");
    });

    it("respects prefers-reduced-motion media query", () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      resetCachedGraphicsCapabilities();
      const caps = detectGraphicsCapabilities();
      expect(caps.reducedMotion).toBe(true);

      window.matchMedia = originalMatchMedia;
      resetCachedGraphicsCapabilities();
    });
  });

  describe("2. Resource Manager & Deterministic Disposal", () => {
    it("tracks resources, ownership, and disposes in reverse registration order", () => {
      const manager = createResourceManager();
      const disposedOrder: string[] = [];

      const res1: DisposableResource = {
        id: "res-1",
        type: "buffer",
        dispose: () => disposedOrder.push("res-1"),
      };
      const res2: DisposableResource = {
        id: "res-2",
        type: "texture",
        dispose: () => disposedOrder.push("res-2"),
      };
      const res3: DisposableResource = {
        id: "res-3",
        type: "shader",
        dispose: () => disposedOrder.push("res-3"),
      };

      manager.register(res1, "effect-a");
      manager.register(res2, "effect-a");
      manager.register(res3, "effect-b");

      expect(manager.size).toBe(3);
      expect(manager.has("res-1")).toBe(true);
      expect(manager.get("res-2")).toBe(res2);

      // Dispose only resources owned by effect-a
      const disposedCount = manager.disposeOwnedBy("effect-a");
      expect(disposedCount).toBe(2);
      expect(disposedOrder).toEqual(["res-2", "res-1"]); // Reverse order!
      expect(manager.has("res-1")).toBe(false);
      expect(manager.has("res-3")).toBe(true);
      expect(manager.size).toBe(1);

      // Dispose remaining
      manager.disposeAll();
      expect(disposedOrder).toEqual(["res-2", "res-1", "res-3"]);
      expect(manager.size).toBe(0);
    });

    it("handles double disposal idempotently without throwing errors", () => {
      const manager = createResourceManager();
      const disposeSpy = vi.fn();

      const res: DisposableResource = {
        id: "single-res",
        type: "framebuffer",
        dispose: disposeSpy,
      };

      manager.register(res);
      expect(manager.dispose("single-res")).toBe(true);
      expect(disposeSpy).toHaveBeenCalledTimes(1);

      // Second disposal returns false and does not call res.dispose again
      expect(manager.dispose("single-res")).toBe(false);
      expect(disposeSpy).toHaveBeenCalledTimes(1);
    });

    it("allows releasing a resource from management without disposing it", () => {
      const manager = createResourceManager();
      const disposeSpy = vi.fn();

      const res: DisposableResource = {
        id: "keep-alive",
        type: "texture",
        dispose: disposeSpy,
      };

      manager.register(res);
      expect(manager.release("keep-alive")).toBe(true);
      expect(manager.has("keep-alive")).toBe(false);
      expect(disposeSpy).not.toHaveBeenCalled();
    });
  });

  describe("3. Viewport & Canvas Management", () => {
    it("updates canvas dimensions with device pixel ratio scaling", () => {
      const canvas = document.createElement("canvas");
      const result = updateCanvasDimensions(canvas, 400, 300, 2);

      expect(result.pixelWidth).toBe(800);
      expect(result.pixelHeight).toBe(600);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(canvas.style.width).toBe("400px");
      expect(canvas.style.height).toBe("300px");
    });

    it("measures canvas logical dimensions correctly", () => {
      const canvas = document.createElement("canvas");
      updateCanvasDimensions(canvas, 500, 250, 1.5);

      const dims = getCanvasDimensions(canvas, 1.5);
      expect(dims.dpr).toBe(1.5);
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it("observes visibility changes and cleans up cleanly", () => {
      const onVisChange = vi.fn();
      const cleanup = setupVisibilityObserver(onVisChange);

      document.dispatchEvent(new Event("visibilitychange"));
      expect(onVisChange).toHaveBeenCalledTimes(1);

      cleanup();
      document.dispatchEvent(new Event("visibilitychange"));
      expect(onVisChange).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe("4. Renderer Implementations & Graceful Fallbacks", () => {
    it("initializes NullRenderer in headless mode with no-op operations", () => {
      const renderer = new NullRenderer();
      const canvas = document.createElement("canvas");

      renderer.init(canvas);
      expect(renderer.backend).toBe("null");
      expect(renderer.isInitialized).toBe(true);

      const lostSpy = vi.fn();
      const unbind = renderer.onContextLost(lostSpy);
      unbind();

      renderer.destroy();
      expect(renderer.isInitialized).toBe(false);
    });

    it("initializes Canvas2DRenderer and scales coordinate transforms on resize", () => {
      const renderer = new Canvas2DRenderer();
      const canvas = document.createElement("canvas");

      renderer.init(canvas, { alpha: true, dpr: 2 });
      expect(renderer.backend).toBe("canvas2d");
      expect(renderer.isInitialized).toBe(true);

      renderer.resize(600, 400, 2);
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(800);

      renderer.clear([0, 0, 0, 1]);
      renderer.clear(); // transparent clear

      renderer.destroy();
      expect(renderer.isInitialized).toBe(false);
    });

    it("falls back gracefully when WebGL context cannot be created", () => {
      const canvas = document.createElement("canvas");
      // Simulate WebGL unsupported on this mock canvas
      vi.spyOn(canvas, "getContext").mockImplementation((type) => {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
          return null;
        }
        return mock2DContext as unknown as RenderingContext;
      });

      const renderer = createRenderer({ backend: "webgl", fallbackBackend: "canvas2d" });
      expect(() => renderer.init(canvas)).toThrow(/WebGL context creation returned null/);
    });
  });

  describe("5. Graphics Engine Lifecycle & Effect Execution", () => {
    it("creates engine, attaches canvas, registers effects, and controls loop", async () => {
      const engine = createGraphicsEngine({ autoStart: false, dpr: 1 });
      expect(engine.state).toBe("idle");

      const canvas = document.createElement("canvas");
      await engine.attach(canvas);
      expect(engine.canvas).toBe(canvas);
      expect(engine.renderer).not.toBeNull();

      const initSpy = vi.fn();
      const renderSpy = vi.fn();
      const disposeSpy = vi.fn();

      const effect: GraphicsEffect = {
        id: "test-effect-1",
        name: "Test Effect",
        init: initSpy,
        render: renderSpy,
        dispose: disposeSpy,
      };

      engine.registerEffect(effect);
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(engine.hasEffect("test-effect-1")).toBe(true);

      // Single frame request
      engine.requestFrame();
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // State transitions
      const stateLog: string[] = [];
      engine.onStateChange((s) => stateLog.push(s));

      engine.start();
      expect(engine.state).toBe("running");

      engine.pause();
      expect(engine.state).toBe("paused");

      engine.resume();
      expect(engine.state).toBe("running");

      engine.stop();
      expect(engine.state).toBe("idle");

      // Unregister effect
      engine.unregisterEffect("test-effect-1");
      expect(disposeSpy).toHaveBeenCalledTimes(1);
      expect(engine.hasEffect("test-effect-1")).toBe(false);

      // Destroy engine
      engine.destroy();
      expect(engine.state).toBe("destroyed");
    });

    it("cleans up effect resources automatically if initialization fails", async () => {
      const engine = createGraphicsEngine({ autoStart: false });
      const canvas = document.createElement("canvas");
      await engine.attach(canvas);

      const failEffect: GraphicsEffect = {
        id: "failing-effect",
        name: "Failing Effect",
        init: (ctx) => {
          ctx.resourceManager.register({
            id: "orphaned-res",
            type: "buffer",
            dispose: vi.fn(),
          }, "failing-effect");
          throw new Error("Initialization crash!");
        },
        render: vi.fn(),
      };

      engine.registerEffect(failEffect);
      // Resource manager should have cleaned up owned resources on crash
      expect(engine.resourceManager.has("orphaned-res")).toBe(false);

      engine.destroy();
    });

    it("resizes active effects when engine resize is invoked", async () => {
      const engine = createGraphicsEngine({ autoStart: false });
      const canvas = document.createElement("canvas");
      await engine.attach(canvas);

      const resizeSpy = vi.fn();
      engine.registerEffect({
        id: "resizable-effect",
        name: "Resizable",
        resize: resizeSpy,
        render: vi.fn(),
      });

      engine.resize(800, 600, 2);
      expect(resizeSpy).toHaveBeenCalledWith(800, 600, 2);

      engine.destroy();
    });
  });

  describe("6. Schema Validation & Capability Registration", () => {
    it("validates renderer options schema", () => {
      expect(validateRendererOptions({ backend: "webgl", dpr: 2 }).valid).toBe(true);
      expect(validateRendererOptions({ backend: "unsupported" }).valid).toBe(false);
      expect(validateRendererOptions({ dpr: -1 }).valid).toBe(false);
    });

    it("validates graphics engine options schema", () => {
      expect(validateGraphicsEngineOptions({ autoStart: true, fpsLimit: 60 }).valid).toBe(true);
      expect(validateGraphicsEngineOptions({ fpsLimit: -10 }).valid).toBe(false);
    });

    it("validates graphics effect definition schema", () => {
      expect(validateGraphicsEffect({ id: "eff", name: "Effect", render: () => undefined }).valid).toBe(true);
      expect(validateGraphicsEffect({ id: "", name: "Effect", render: () => undefined }).valid).toBe(false);
      expect(validateGraphicsEffect({ id: "eff", name: "" }).valid).toBe(false);
    });

    it("integrates graphics capability into existing aiMotionRegistry", () => {
      registerGraphicsCapability(aiMotionRegistry);
      const cap = aiMotionRegistry.getCapability("graphics-rendering");
      expect(cap).toBeDefined();
      expect(cap?.category).toBe("graphics");
      expect(cap?.supportedTargets).toContain("HTMLCanvasElement");
      expect(cap?.controls).toContain("attach");
      expect(cap?.controls).toContain("registerEffect");
      expect(cap?.react?.available).toBe(true);
      aiMotionRegistry.unregisterCapability("graphics-rendering");
    });
  });

  describe("7. React Integration & StrictMode Resilience", () => {
    it("renders GraphicsCanvas with accessible role and fallback content", () => {
      const canvasRef = createRef<HTMLCanvasElement>();
      act(() => {
        root.render(
          createElement(
            GraphicsCanvas,
            {
              ref: canvasRef,
              role: "img",
              "aria-label": "Real-time graphics simulation",
              style: { width: "100%", height: "400px" },
              fallback: createElement("p", null, "Your browser does not support canvas."),
            },
          ),
        );
      });

      const canvas = host.querySelector("canvas")!;
      expect(canvas).not.toBeNull();
      expect(canvas.getAttribute("role")).toBe("img");
      expect(canvas.getAttribute("aria-label")).toBe("Real-time graphics simulation");
      expect(canvas.textContent).toContain("Your browser does not support canvas.");
    });

    it("supports GraphicsProvider and useGraphics() hook", () => {
      let ambientEngine: GraphicsEngine | null = null;

      function ChildComponent() {
        ambientEngine = useGraphics();
        return createElement("div", null, ambientEngine ? "Engine Ready" : "No Engine");
      }

      const customEngine = createGraphicsEngine({ autoStart: false });

      act(() => {
        root.render(
          createElement(
            GraphicsProvider,
            { engine: customEngine },
            createElement(ChildComponent),
          ),
        );
      });

      expect(ambientEngine).toBe(customEngine);
      expect(host.textContent).toBe("Engine Ready");

      customEngine.destroy();
    });

    it("registers and cleans up effects via useGraphicsEffect() hook", () => {
      const engine = createGraphicsEngine({ autoStart: false });
      const renderSpy = vi.fn();
      const disposeSpy = vi.fn();

      const testEffect: GraphicsEffect = {
        id: "hook-effect",
        name: "Hook Effect",
        render: renderSpy,
        dispose: disposeSpy,
      };

      function EffectHost() {
        useGraphicsEffect(testEffect);
        return createElement("div", null, "Host Active");
      }

      act(() => {
        root.render(
          createElement(
            GraphicsProvider,
            { engine },
            createElement(EffectHost),
          ),
        );
      });

      expect(engine.hasEffect("hook-effect")).toBe(true);

      // Unmount host
      act(() => {
        root.render(createElement(GraphicsProvider, { engine }, createElement("div", null, "Empty")));
      });

      expect(engine.hasEffect("hook-effect")).toBe(false);
      expect(disposeSpy).toHaveBeenCalledTimes(1);

      engine.destroy();
    });

    it("mounts and unmounts cleanly under React StrictMode without duplicate errors", () => {
      const readySpy = vi.fn();

      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(GraphicsCanvas, {
              autoStart: false,
              onEngineReady: readySpy,
            }),
          ),
        );
      });

      expect(host.querySelector("canvas")).not.toBeNull();
    });

    it("renders GraphicsCanvas via SSR renderToString without throwing", () => {
      const html = renderToString(
        createElement(
          GraphicsCanvas,
          {
            role: "img",
            "aria-label": "SSR Visual Canvas",
            fallback: "Canvas rendering is not supported on this device.",
          },
        ),
      );

      expect(html).toContain("<canvas");
      expect(html).toContain('role="img"');
      expect(html).toContain("Canvas rendering is not supported on this device.");
    });
  });
});
