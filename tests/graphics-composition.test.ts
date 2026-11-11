// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // Composition
  createGraphicsComposition,
  createGraphicsInstance,
  sortCompositionLayers,
  updateCompositionLayer,
  addCompositionLayer,
  removeCompositionLayer,
  validateLayerDependencies,
  // Quality & Fallback
  QUALITY_PROFILES,
  resolveQualityProfile,
  AdaptiveQualityMonitor,
  resolveGraphicsFallback,
  // Schemas & Capabilities
  COMPOSITION_SCHEMA_VERSION,
  GRAPHICS_LAYER_SCHEMA,
  GRAPHICS_COMPOSITION_SCHEMA,
  validateGraphicsLayer,
  validateGraphicsComposition,
  correctGraphicsComposition,
  GRAPHICS_COMPOSITION_CAPABILITY,
  registerGraphicsCompositionCapability,
  aiMotionRegistry,
  // Effects from P71-P74
  createDistortionEffect,
  createParticleEffect,
  createAdvancedEffect,
  type GraphicsCompositionDefinition,
  type GraphicsLayer,
  type GraphicsQualityLevel,
} from "../src/catalogue.js";

import {
  useGraphicsComposition,
  useGraphicsQuality,
  useGraphicsFallback,
  GraphicsCompositionView,
} from "../src/react.js";

describe("Unified Graphics Composition & Optimization System (Prompt 75)", () => {
  let host: HTMLDivElement;
  let root: Root;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  const mock2DContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100), width: 10, height: 10 })),
    putImageData: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: "",
    strokeStyle: "",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
  };

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

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

  describe("Unified Composition Definition & Execution", () => {
    it("creates a unified multi-layer composition combining effects", async () => {
      const distortion = createDistortionEffect({ type: "wave", intensity: 0.5 });
      const particles = createParticleEffect({ mode: "continuous", rate: 40 });
      const postProcess = createAdvancedEffect({ type: "vignette", intensity: 0.7 });

      const definition: GraphicsCompositionDefinition = {
        id: "hero-composition",
        name: "Hero Visual Composition",
        layers: [
          {
            id: "particles-layer",
            name: "Background Particles",
            type: "particles",
            order: 1,
            effect: particles,
            opacity: 0.8,
          },
          {
            id: "distortion-layer",
            name: "Wave Distortion",
            type: "effect",
            order: 2,
            effect: distortion,
          },
          {
            id: "post-processing",
            name: "Vignette Overlay",
            type: "effect",
            order: 3,
            effect: postProcess,
            blendMode: "multiply",
          },
        ],
        quality: "high",
      };

      const composition = createGraphicsComposition(definition);
      expect(composition.id).toBe("hero-composition");
      expect(composition.layers).toHaveLength(3);
      expect(composition.fallback.targetBackend).toBeDefined();

      const canvas = document.createElement("canvas");
      await composition.attach(canvas);
      expect(composition.isAttached).toBe(true);

      // Trigger animation frame update
      composition.engine.requestFrame();
      expect(mock2DContext.save).toHaveBeenCalled();
      expect(mock2DContext.restore).toHaveBeenCalled();

      // Detach and destroy
      composition.detach();
      expect(composition.isAttached).toBe(false);
      composition.destroy();
    });

    it("skips disabled layers during rendering", async () => {
      const renderSpy = vi.fn();
      const mockEffect = {
        id: "mock-layer-effect",
        name: "MockEffect",
        render: renderSpy,
      };

      const definition: GraphicsCompositionDefinition = {
        id: "disabled-test",
        name: "Disabled Layer Test",
        layers: [
          {
            id: "disabled-layer",
            name: "Disabled",
            type: "effect",
            order: 1,
            enabled: false,
            effect: mockEffect,
          },
        ],
      };

      const composition = createGraphicsComposition(definition);
      const canvas = document.createElement("canvas");
      await composition.attach(canvas);

      composition.engine.requestFrame();
      expect(renderSpy).not.toHaveBeenCalled();

      composition.destroy();
    });
  });

  describe("Layer Ordering & Dependency Resolution", () => {
    it("sorts layers topologically based on dependsOn and order", () => {
      const layers: GraphicsLayer[] = [
        { id: "post", name: "Post Process", type: "effect", order: 10, dependsOn: ["wave"] },
        { id: "base", name: "Base Layer", type: "custom", order: 1 },
        { id: "wave", name: "Wave Layer", type: "effect", order: 5, dependsOn: ["base"] },
      ];

      const sorted = sortCompositionLayers(layers);
      const sortedIds = sorted.map((l) => l.id);
      expect(sortedIds).toEqual(["base", "wave", "post"]);
    });

    it("detects circular dependencies and throws descriptive errors", () => {
      const cyclicLayers: GraphicsLayer[] = [
        { id: "layer-a", name: "A", type: "effect", order: 1, dependsOn: ["layer-b"] },
        { id: "layer-b", name: "B", type: "effect", order: 2, dependsOn: ["layer-a"] },
      ];

      expect(() => sortCompositionLayers(cyclicLayers)).toThrow(/Circular dependency detected/);
    });

    it("validates that all dependencies exist", () => {
      const invalidLayers: GraphicsLayer[] = [
        { id: "layer-1", name: "L1", type: "effect", order: 1, dependsOn: ["non-existent-layer"] },
      ];

      const res = validateLayerDependencies(invalidLayers);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain("non-existent-layer");
    });

    it("supports immutable layer update operations", () => {
      const initial: GraphicsLayer[] = [
        { id: "l1", name: "Layer 1", type: "effect", order: 1, opacity: 0.5 },
        { id: "l2", name: "Layer 2", type: "particles", order: 2, opacity: 1.0 },
      ];

      // Update layer
      const updated = updateCompositionLayer(initial, "l1", { opacity: 0.9 });
      expect(updated[0].opacity).toBe(0.9);
      expect(initial[0].opacity).toBe(0.5); // immutable

      // Add layer
      const added = addCompositionLayer(updated, { id: "l3", name: "Layer 3", type: "custom", order: 0 });
      expect(added[0].id).toBe("l3"); // sorted to front due to order 0

      // Remove layer
      const removed = removeCompositionLayer(added, "l1");
      expect(removed.map((l) => l.id)).toEqual(["l3", "l2"]);
    });
  });

  describe("Adaptive Performance & Quality Management", () => {
    it("provides predefined quality profiles (low, medium, high, ultra)", () => {
      expect(QUALITY_PROFILES.low.dprLimit).toBe(1.0);
      expect(QUALITY_PROFILES.medium.dprLimit).toBe(1.5);
      expect(QUALITY_PROFILES.high.dprLimit).toBe(2.0);
      expect(QUALITY_PROFILES.ultra.dprLimit).toBe(3.0);
      expect(QUALITY_PROFILES.low.enablePostProcessing).toBe(false);
      expect(QUALITY_PROFILES.high.enablePostProcessing).toBe(true);
    });

    it("AdaptiveQualityMonitor steps down on sustained frame budget overruns", () => {
      const monitor = new AdaptiveQualityMonitor("high");
      expect(monitor.currentQuality).toBe("high");

      // Simulate 20 consecutive slow frames (> 16.6ms * 1.25)
      for (let i = 0; i < 20; i++) {
        monitor.recordFrame(28.0);
      }

      expect(monitor.currentQuality).toBe("medium");
    });

    it("AdaptiveQualityMonitor steps up on sustained fast frames", () => {
      const monitor = new AdaptiveQualityMonitor("low");
      expect(monitor.currentQuality).toBe("low");

      // Simulate 60 consecutive very fast frames
      for (let i = 0; i < 60; i++) {
        monitor.recordFrame(10.0);
      }

      expect(monitor.currentQuality).toBe("medium");
    });

    it("computes rolling average frame times and estimated FPS", () => {
      const monitor = new AdaptiveQualityMonitor("high");
      monitor.recordFrame(16.0);
      monitor.recordFrame(17.0);

      expect(monitor.getAverageFrameTime()).toBeCloseTo(16.5);
      expect(monitor.getEstimatedFps()).toBe(61);
    });
  });

  describe("Capability-Aware Fallback Resolution", () => {
    it("resolves WebGL hardware acceleration when available", () => {
      const decision = resolveGraphicsFallback({
        canvas: true,
        webgl: true,
        webgl2: true,
        webgpu: false,
        supportedBackends: ["canvas2d", "webgl", "webgl2"],
        activeBackend: "webgl2",
        maxTextureSize: 4096,
        dpr: 2,
        reducedMotion: false,
      });

      expect(decision.targetBackend).toBe("webgl2");
      expect(decision.isFallback).toBe(false);
      expect(decision.degradedEffects).toHaveLength(0);
      expect(decision.reason).toContain("Hardware-accelerated");
    });

    it("resolves Canvas2D fallback with inspectable reasoning when WebGL is absent", () => {
      const decision = resolveGraphicsFallback({
        canvas: true,
        webgl: false,
        webgl2: false,
        webgpu: false,
        supportedBackends: ["canvas2d"],
        activeBackend: "canvas2d",
        maxTextureSize: 2048,
        dpr: 1,
        reducedMotion: false,
      });

      expect(decision.targetBackend).toBe("canvas2d");
      expect(decision.isFallback).toBe(true);
      expect(decision.degradedEffects).toContain("webgl-shaders");
      expect(decision.reason).toContain("fell back gracefully to Canvas2D");
    });

    it("adapts quality level when reduced-motion is requested", () => {
      const decision = resolveGraphicsFallback(undefined, { respectReducedMotion: true });
      expect(decision.qualityLevel).toBe("low");
      expect(decision.degradedEffects).toContain("particle-motion");
      expect(decision.reason).toContain("Reduced motion preference is active");
    });
  });

  describe("Unified Graphics Instance Factory", () => {
    it("creates a unified graphics instance with composition", () => {
      const instance = createGraphicsInstance({
        composition: {
          id: "instance-comp",
          name: "Instance Composition",
          layers: [],
        },
        quality: "ultra",
      });

      expect(instance.engine).toBeDefined();
      expect(instance.composition).not.toBeNull();
      expect(instance.quality.level).toBe("ultra");
      expect(instance.fallback).toBeDefined();

      instance.destroy();
    });

    it("creates a standalone unified graphics instance without composition", () => {
      const instance = createGraphicsInstance({ quality: "medium" });
      expect(instance.engine).toBeDefined();
      expect(instance.composition).toBeNull();
      expect(instance.quality.level).toBe("medium");

      instance.destroy();
    });
  });

  describe("Validation & Configuration Correction", () => {
    it("validates valid composition definitions", () => {
      const res = validateGraphicsComposition({
        id: "comp-1",
        name: "Test Comp",
        layers: [
          { id: "l1", name: "Layer 1", type: "effect", order: 1 },
        ],
      });
      expect(res.valid).toBe(true);
    });

    it("rejects invalid composition definitions", () => {
      expect(validateGraphicsComposition(null).valid).toBe(false);
      expect(validateGraphicsComposition({ id: "" }).valid).toBe(false);
      expect(validateGraphicsComposition({ id: "x", name: "x", layers: "invalid" as any }).valid).toBe(false);
    });

    it("corrects malformed composition configurations safely", () => {
      const corrected = correctGraphicsComposition({
        id: "   ",
        name: "",
        quality: "invalid-quality" as any,
        layers: [
          { id: "", name: "", type: "invalid" as any },
        ],
      });

      expect(corrected.id).toBe("composition-corrected");
      expect(corrected.quality).toBe("high");
      expect(corrected.layers).toHaveLength(1);
      expect(corrected.layers[0].type).toBe("custom");
    });
  });

  describe("AI Motion Registry Integration", () => {
    it("defines valid GRAPHICS_COMPOSITION_CAPABILITY metadata", () => {
      expect(GRAPHICS_COMPOSITION_CAPABILITY.id).toBe("graphics-composition");
      expect(GRAPHICS_COMPOSITION_CAPABILITY.category).toBe("graphics");
      expect(GRAPHICS_COMPOSITION_CAPABILITY.react.componentName).toBe("GraphicsCompositionView");
      expect(GRAPHICS_COMPOSITION_CAPABILITY.react.hookName).toBe("useGraphicsComposition");
    });

    it("registers dynamically into aiMotionRegistry", () => {
      registerGraphicsCompositionCapability(aiMotionRegistry);
      const cap = aiMotionRegistry.getCapability("graphics-composition");
      expect(cap).toBeDefined();
      expect(cap?.name).toBe("createGraphicsComposition");
    });
  });

  describe("React Integration", () => {
    it("useGraphicsComposition creates, memoizes, and destroys composition", () => {
      let capturedInstance: any;

      function Consumer() {
        capturedInstance = useGraphicsComposition({
          id: "react-comp",
          name: "React Composition",
          layers: [],
        });
        return createElement("div", null, "Composition Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(capturedInstance).not.toBeNull();
      expect(capturedInstance.id).toBe("react-comp");
    });

    it("useGraphicsQuality provides quality profile and updater", () => {
      let capturedQuality: any;

      function Consumer() {
        capturedQuality = useGraphicsQuality("medium");
        return createElement("div", null, "Quality Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(capturedQuality.quality).toBe("medium");
      expect(capturedQuality.profile.dprLimit).toBe(1.5);

      act(() => {
        capturedQuality.setQuality("ultra");
      });
      expect(capturedQuality.quality).toBe("ultra");
      expect(capturedQuality.profile.dprLimit).toBe(3.0);
    });

    it("useGraphicsFallback provides inspectable fallback decisions", () => {
      let capturedFallback: any;

      function Consumer() {
        capturedFallback = useGraphicsFallback();
        return createElement("div", null, "Fallback Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(capturedFallback.targetBackend).toBeDefined();
      expect(typeof capturedFallback.isFallback).toBe("boolean");
      expect(capturedFallback.reason).toBeTruthy();
    });

    it("GraphicsCompositionView renders canvas, attaches composition, and forwards ref", async () => {
      const ref = createRef<HTMLCanvasElement>();
      const onReady = vi.fn();

      const definition: GraphicsCompositionDefinition = {
        id: "view-comp",
        name: "View Composition",
        layers: [],
      };

      await act(async () => {
        root.render(
          createElement(GraphicsCompositionView, {
            ref,
            definition,
            onReady,
            className: "composition-canvas",
            style: { width: "400px", height: "300px" },
          })
        );
      });

      const canvas = host.querySelector("canvas.composition-canvas") as HTMLCanvasElement;
      expect(canvas).not.toBeNull();
      expect(ref.current).toBe(canvas);
      expect(onReady).toHaveBeenCalled();
    });

    it("GraphicsCompositionView renders cleanly in SSR simulation", () => {
      const definition: GraphicsCompositionDefinition = {
        id: "ssr-comp",
        name: "SSR Composition",
        layers: [],
      };

      const html = renderToString(
        createElement(GraphicsCompositionView, {
          definition,
          fallback: createElement("p", null, "Fallback Content"),
        })
      );

      expect(html).toContain("<canvas");
      expect(html).toContain("Fallback Content");
    });
  });
});
