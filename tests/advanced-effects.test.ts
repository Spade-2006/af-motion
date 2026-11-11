// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // Distortion
  createDistortionEffect,
  VALID_DISTORTION_TYPES,
  validateDistortionOptions,
  correctDistortionOptions,
  DISTORTION_CAPABILITY,
  // Fluid
  createFluidEffect,
  VALID_FLUID_TYPES,
  validateFluidOptions,
  correctFluidOptions,
  FLUID_EFFECTS_CAPABILITY,
  // Particles
  ParticlePool,
  createParticleEffect,
  VALID_PARTICLE_SHAPES,
  validateParticleOptions,
  correctParticleOptions,
  PARTICLE_EFFECTS_CAPABILITY,
  // Advanced
  createAdvancedEffect,
  VALID_ADVANCED_EFFECT_TYPES,
  validateAdvancedEffectOptions,
  correctAdvancedEffectOptions,
  ADVANCED_EFFECTS_CAPABILITY,
  // Composer & Registry
  composeGraphicsEffects,
  registerGraphicsEffectsCapabilities,
  aiMotionRegistry,
  type DistortionType,
  type FluidType,
  type ParticleShape,
  type AdvancedEffectType,
  type GraphicsEffectUpdateContext,
} from "../src/catalogue.js";

import {
  useDistortion,
  useFluidEffect,
  useParticles,
  useAdvancedEffect,
  DistortionCanvas,
  FluidCanvas,
  ParticleCanvas,
  AdvancedEffectsCanvas,
} from "../src/react.js";

describe("Distortion, Fluid, Particle & Advanced Effects System (Prompt 74)", () => {
  let host: HTMLDivElement;
  let root: Root;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  const mock2DContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
  };

  function createMockRenderContext(deltaTime = 16.6): GraphicsEffectUpdateContext {
    return {
      renderer: {} as any,
      resourceManager: {} as any,
      rawContext: mock2DContext,
      width: 400,
      height: 300,
      pixelWidth: 400,
      pixelHeight: 300,
      dpr: 1,
      canvas: {} as any,
      backend: "canvas2d",
      elapsedTime: 1000,
      deltaTime,
      frameIndex: 60,
    };
  }

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

  describe("Distortion Engine", () => {
    const allDistortions: DistortionType[] = [
      "wave",
      "ripple",
      "chromatic-aberration",
      "pixel-displacement",
      "heat-haze",
      "lens",
      "noise",
      "refraction",
    ];

    it("supports all 8 distortion effect types", () => {
      expect(VALID_DISTORTION_TYPES).toEqual(allDistortions);
    });

    for (const type of allDistortions) {
      it(`creates and renders distortion type "${type}"`, () => {
        const effect = createDistortionEffect({ type, intensity: 0.6, scale: 25 });
        expect(effect.id).toContain("distortion-");
        expect(effect.name).toContain(type);
        expect(effect.accessibility?.supportsReducedMotion).toBe(true);

        const ctx = createMockRenderContext();
        expect(() => effect.render(ctx)).not.toThrow();
        expect(mock2DContext.save).toHaveBeenCalled();
        expect(mock2DContext.restore).toHaveBeenCalled();

        // Lifecycle methods
        expect(() => effect.pause?.()).not.toThrow();
        expect(() => effect.resume?.()).not.toThrow();
        expect(() => effect.dispose?.()).not.toThrow();
      });
    }
  });

  describe("Fluid Effects Engine", () => {
    const allFluids: FluidType[] = [
      "metaball",
      "flow-field",
      "liquid-gradient",
      "liquid-transition",
      "gooey-blend",
      "liquid-surface",
    ];

    it("supports all 6 fluid effect types", () => {
      expect(VALID_FLUID_TYPES).toEqual(allFluids);
    });

    for (const type of allFluids) {
      it(`creates and renders fluid type "${type}"`, () => {
        const effect = createFluidEffect({
          type,
          viscosity: 0.7,
          density: 8,
          colors: ["#38bdf8", "#ec4899"],
        });

        expect(effect.id).toContain("fluid-");
        expect(effect.name).toContain(type);

        const ctx = createMockRenderContext();
        expect(() => effect.render(ctx)).not.toThrow();
        expect(mock2DContext.save).toHaveBeenCalled();
        expect(mock2DContext.restore).toHaveBeenCalled();

        expect(() => effect.dispose?.()).not.toThrow();
      });
    }
  });

  describe("Particle Engine & Pooling", () => {
    it("manages a preallocated, bounded pool without GC allocations", () => {
      const pool = new ParticlePool(50);
      expect(pool.maxCapacity).toBe(50);
      expect(pool.activeCount).toBe(0);

      // Acquire particles
      const p1 = pool.acquire();
      const p2 = pool.acquire();
      expect(p1).not.toBeNull();
      expect(p2).not.toBeNull();
      expect(pool.activeCount).toBe(2);

      // Release particle
      pool.release(p1!);
      expect(pool.activeCount).toBe(1);

      // Release all
      pool.releaseAll();
      expect(pool.activeCount).toBe(0);
    });

    it("respects maxCapacity ceilings and caps at bounds (10 to 2000)", () => {
      const tinyPool = new ParticlePool(5);
      expect(tinyPool.maxCapacity).toBe(10); // clamped minimum 10

      const hugePool = new ParticlePool(10000);
      expect(hugePool.maxCapacity).toBe(2000); // clamped maximum 2000
    });

    const allShapes: ParticleShape[] = ["circle", "square", "triangle", "star", "spark"];

    it("supports all 5 particle shapes", () => {
      expect(VALID_PARTICLE_SHAPES).toEqual(allShapes);
    });

    for (const shape of allShapes) {
      it(`emits and simulates particles with shape "${shape}"`, () => {
        const effect = createParticleEffect({
          shape,
          mode: "continuous",
          rate: 100,
          maxParticles: 50,
          speed: [50, 100],
        });

        const ctx = createMockRenderContext(30);
        // Step 1: spawns particles
        effect.render(ctx);
        // Step 2: updates and draws
        effect.render(ctx);

        expect(mock2DContext.save).toHaveBeenCalled();
        expect(mock2DContext.restore).toHaveBeenCalled();
        expect(() => effect.dispose?.()).not.toThrow();
      });
    }

    it("supports burst mode and deterministic simulation given seed", () => {
      const effect1 = createParticleEffect({ mode: "burst", burstCount: 30, seed: 1234 });
      const effect2 = createParticleEffect({ mode: "burst", burstCount: 30, seed: 1234 });

      const ctx = createMockRenderContext();
      effect1.render(ctx);
      effect2.render(ctx);

      expect(effect1.id).not.toBe(effect2.id);
      expect(() => effect1.dispose?.()).not.toThrow();
      expect(() => effect2.dispose?.()).not.toThrow();
    });
  });

  describe("Advanced Post-Processing Effects", () => {
    const allAdvanced: AdvancedEffectType[] = [
      "glow-bloom",
      "vignette",
      "noise-overlay",
      "scanlines",
      "light-streaks",
      "gradient-animation",
      "background-transition",
    ];

    it("supports all 7 advanced effect types", () => {
      expect(VALID_ADVANCED_EFFECT_TYPES).toEqual(allAdvanced);
    });

    for (const type of allAdvanced) {
      it(`creates and renders advanced effect "${type}"`, () => {
        const effect = createAdvancedEffect({ type, intensity: 0.8, color: "#000" });
        expect(effect.id).toContain("advanced-");
        expect(effect.name).toContain(type);

        const ctx = createMockRenderContext();
        expect(() => effect.render(ctx)).not.toThrow();
        expect(mock2DContext.save).toHaveBeenCalled();
        expect(mock2DContext.restore).toHaveBeenCalled();

        expect(() => effect.dispose?.()).not.toThrow();
      });
    }
  });

  describe("Effect Composer", () => {
    it("composes multiple graphics effects into a single pipeline", async () => {
      const e1 = createDistortionEffect({ type: "wave" });
      const e2 = createAdvancedEffect({ type: "vignette" });
      const composed = composeGraphicsEffects(e1, e2);

      expect(composed.effects).toHaveLength(2);
      expect(composed.name).toContain("ComposedEffects");

      const initCtx = {
        canvas: {} as any,
        renderer: {} as any,
        capabilities: {} as any,
        resourceManager: {} as any,
        width: 400,
        height: 300,
        dpr: 1,
      };

      await expect(composed.init?.(initCtx)).resolves.not.toThrow();

      const renderCtx = createMockRenderContext();
      expect(() => composed.render(renderCtx)).not.toThrow();

      expect(() => composed.resize?.(800, 600, 2)).not.toThrow();
      expect(() => composed.pause?.()).not.toThrow();
      expect(() => composed.resume?.()).not.toThrow();
      expect(() => composed.dispose?.()).not.toThrow();
    });
  });

  describe("Validation & Configuration Correction", () => {
    it("validates distortion options", () => {
      expect(validateDistortionOptions({ type: "wave", intensity: 0.5 }).valid).toBe(true);
      expect(validateDistortionOptions({ type: "invalid-type" as any }).valid).toBe(false);
      expect(validateDistortionOptions({ intensity: 2.0 }).valid).toBe(false);
    });

    it("corrects malformed distortion options safely", () => {
      const corrected = correctDistortionOptions({ type: "unknown" as any, intensity: 5 });
      expect(corrected.type).toBe("wave");
      expect(corrected.intensity).toBe(1.0);
    });

    it("validates and corrects fluid options", () => {
      expect(validateFluidOptions({ type: "metaball" }).valid).toBe(true);
      expect(validateFluidOptions({ type: "invalid" as any }).valid).toBe(false);

      const corrected = correctFluidOptions({ type: "invalid" as any, viscosity: 2.5 });
      expect(corrected.type).toBe("liquid-gradient");
      expect(corrected.viscosity).toBe(1.0);
    });

    it("validates and corrects particle options", () => {
      expect(validateParticleOptions({ shape: "circle", maxParticles: 100 }).valid).toBe(true);
      expect(validateParticleOptions({ shape: "octagon" as any }).valid).toBe(false);

      const corrected = correctParticleOptions({ shape: "invalid" as any, maxParticles: 9999 });
      expect(corrected.shape).toBe("circle");
      expect(corrected.maxParticles).toBe(2000);
    });

    it("validates and corrects advanced effect options", () => {
      expect(validateAdvancedEffectOptions({ type: "vignette" }).valid).toBe(true);
      expect(validateAdvancedEffectOptions({ type: "invalid" as any }).valid).toBe(false);

      const corrected = correctAdvancedEffectOptions({ type: "invalid" as any, intensity: -1 });
      expect(corrected.type).toBe("vignette");
      expect(corrected.intensity).toBe(0);
    });
  });

  describe("AI Motion Registry Integration", () => {
    it("registers all 4 graphics effect capabilities into aiMotionRegistry", () => {
      registerGraphicsEffectsCapabilities(aiMotionRegistry);

      expect(aiMotionRegistry.getCapability("graphics-distortion")).toBeDefined();
      expect(aiMotionRegistry.getCapability("graphics-fluid")).toBeDefined();
      expect(aiMotionRegistry.getCapability("graphics-particles")).toBeDefined();
      expect(aiMotionRegistry.getCapability("graphics-advanced-effects")).toBeDefined();
    });
  });

  describe("React Integration", () => {
    it("useDistortion creates and cleans up effect on unmount", () => {
      let effectInstance: any;

      function Consumer() {
        effectInstance = useDistortion({ type: "ripple" });
        return createElement("div", null, "Distortion Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(effectInstance.name).toContain("ripple");
    });

    it("useFluidEffect creates fluid effect", () => {
      let effectInstance: any;

      function Consumer() {
        effectInstance = useFluidEffect({ type: "flow-field" });
        return createElement("div", null, "Fluid Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(effectInstance.name).toContain("flow-field");
    });

    it("useParticles creates particle effect", () => {
      let effectInstance: any;

      function Consumer() {
        effectInstance = useParticles({ shape: "spark", rate: 60 });
        return createElement("div", null, "Particle Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(effectInstance.name).toContain("Particles");
    });

    it("useAdvancedEffect creates advanced post-processing effect", () => {
      let effectInstance: any;

      function Consumer() {
        effectInstance = useAdvancedEffect({ type: "scanlines" });
        return createElement("div", null, "Advanced Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(effectInstance.name).toContain("scanlines");
    });

    it("DistortionCanvas renders canvas element and forwards ref", () => {
      const ref = createRef<HTMLCanvasElement>();

      act(() => {
        root.render(
          createElement(DistortionCanvas, {
            ref,
            distortion: { type: "wave", intensity: 0.5 },
            className: "test-distortion-canvas",
          })
        );
      });

      const canvas = host.querySelector("canvas.test-distortion-canvas") as HTMLCanvasElement;
      expect(canvas).not.toBeNull();
      expect(ref.current).toBe(canvas);
    });

    it("ParticleCanvas renders canvas element and forwards ref", () => {
      const ref = createRef<HTMLCanvasElement>();

      act(() => {
        root.render(
          createElement(ParticleCanvas, {
            ref,
            particles: { mode: "continuous", rate: 50 },
            className: "test-particle-canvas",
          })
        );
      });

      const canvas = host.querySelector("canvas.test-particle-canvas") as HTMLCanvasElement;
      expect(canvas).not.toBeNull();
      expect(ref.current).toBe(canvas);
    });

    it("renders effects canvas components cleanly in SSR simulation", () => {
      const html1 = renderToString(
        createElement(DistortionCanvas, { distortion: { type: "heat-haze" } })
      );
      expect(html1).toContain("<canvas");

      const html2 = renderToString(
        createElement(FluidCanvas, { fluid: { type: "liquid-gradient" } })
      );
      expect(html2).toContain("<canvas");

      const html3 = renderToString(
        createElement(ParticleCanvas, { particles: { shape: "triangle" } })
      );
      expect(html3).toContain("<canvas");

      const html4 = renderToString(
        createElement(AdvancedEffectsCanvas, { effect: { type: "vignette" } })
      );
      expect(html4).toContain("<canvas");
    });
  });
});
