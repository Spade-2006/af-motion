// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import {
  mountStudio,
  getDefaultAnimationConfig,
  getDefaultBackgroundConfig,
  evaluateEasing,
  interpolateAnimationStyles,
  ANIMATION_PRESETS,
  STUDIO_PALETTES,
  getPaletteById,
  computeCSSBackground,
  renderCanvasBackground,
  generateReactComponentCode,
  generateCSSVariables,
  generateExportBundle,
  FUTURE_STUDIO_MODULES,
  type StudioAnimationConfig,
  type StudioBackgroundConfig,
} from "../studio/index.js";

describe("Prompt 93 — AF Motion Studio: Animation & Background Studio", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);

    // Mock HTMLCanvasElement.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(400 * 300 * 4) }),
      putImageData: vi.fn(),
    });
  });

  afterEach(() => {
    container.remove();
  });

  describe("1. Studio Application Initialization & Lifecycle", () => {
    it("mounts the modern React Studio into DOM container and unmounts cleanly", async () => {
      let handle: any;
      await act(async () => {
        handle = mountStudio(container);
      });
      expect(handle).toBeDefined();
      expect(typeof handle.unmount).toBe("function");

      // Verify header rendered
      expect(container.textContent).toContain("AF Motion Studio");
      expect(container.textContent).toContain("Animation");
      expect(container.textContent).toContain("Background");

      // Unmount cleanly
      await act(async () => {
        handle.unmount();
      });
      expect(container.innerHTML).toBe("");
    });
  });

  describe("2. Animation Editor State & Property Configuration", () => {
    it("initializes with valid default animation configurations", () => {
      const def = getDefaultAnimationConfig();
      expect(def.target).toBe("card");
      expect(def.duration).toBeGreaterThanOrEqual(100);
      expect(def.properties.opacity).toBe(1);
      expect(def.properties.scale).toBe(1);
      expect(def.reducedMotion).toBe(false);
    });

    it("loads all studio animation presets with distinct easing and transform curves", () => {
      const presetKeys = Object.keys(ANIMATION_PRESETS);
      expect(presetKeys).toContain("fadeUp");
      expect(presetKeys).toContain("popIn");
      expect(presetKeys).toContain("slideRight");
      expect(presetKeys).toContain("springBounce");
      expect(presetKeys).toContain("gentlePulse");
      expect(presetKeys).toContain("spin3D");

      const popIn = ANIMATION_PRESETS.popIn;
      expect(popIn.config.properties?.scale).toBeGreaterThan(1.0);
      expect(popIn.config.easing).toContain("cubic-bezier");
    });

    it("correctly evaluates linear, quad, and cubic-bezier easing curves", () => {
      expect(evaluateEasing("linear", 0)).toBe(0);
      expect(evaluateEasing("linear", 0.5)).toBe(0.5);
      expect(evaluateEasing("linear", 1)).toBe(1);

      expect(evaluateEasing("easeIn", 0.5)).toBeCloseTo(0.25, 2);
      expect(evaluateEasing("easeOut", 0.5)).toBeCloseTo(0.75, 2);

      const cubicVal = evaluateEasing("cubic-bezier(0.16, 1, 0.3, 1)", 0.5);
      expect(cubicVal).toBeGreaterThan(0.5); // Fast initial acceleration
    });

    it("interpolates animation styles at timeline progression milestones", () => {
      const anim = getDefaultAnimationConfig();
      anim.properties.y = -50;
      anim.properties.scale = 1.2;

      // At start (progress 0)
      const start = interpolateAnimationStyles(anim, 0);
      expect(start.transform).toContain("translate3d(0.00px, 0.00px, 0px)");
      expect(start.transform).toContain("scale(1.000)");

      // At end (progress 1.0)
      const end = interpolateAnimationStyles(anim, 1.0);
      expect(end.transform).toContain("translate3d(0.00px, -50.00px, 0px)");
      expect(end.transform).toContain("scale(1.200)");
      expect(end.opacity).toBe(1);
    });

    it("bypasses transforms and locks opacity when reduced motion is enabled", () => {
      const anim = getDefaultAnimationConfig();
      anim.reducedMotion = true;
      anim.properties.y = -100;
      anim.properties.scale = 2.0;

      const styles = interpolateAnimationStyles(anim, 0.3);
      expect(styles.transform).toBe("none");
      expect(styles.opacity).toBe(1);
      expect(styles.filter).toBe("none");
    });
  });

  describe("3. Background Studio & 33 Built-in Palettes Integration", () => {
    it("exposes all 33 built-in palettes in the studio palette registry", () => {
      expect(STUDIO_PALETTES.length).toBe(33);
      const names = STUDIO_PALETTES.map((p) => p.name);
      expect(names).toContain("Cobalt Classic");
      expect(names).toContain("Neon Abyss");
      expect(names).toContain("Ember Editorial");
      expect(names).toContain("Amber Frost");
      expect(names).toContain("Primary Pop");
    });

    it("retrieves palette by slugified ID or falls back safely", () => {
      const p = getPaletteById("neon-abyss");
      expect(p.name).toBe("Neon Abyss");
      expect(p.accent).toBeDefined();

      const fallback = getPaletteById("non-existent-id");
      expect(fallback.name).toBe("Cobalt Classic");
    });

    it("computes CSS background rules for gradients, grids, dots, waves, and aurora", () => {
      const bg = getDefaultBackgroundConfig();

      // 1. Gradient
      bg.type = "gradient";
      const gradCss = computeCSSBackground(bg);
      expect(gradCss).toContain("linear-gradient");
      expect(gradCss).toContain(bg.colors.primary);

      // 2. Grid pattern
      bg.type = "grid";
      const gridCss = computeCSSBackground(bg);
      expect(gridCss).toContain("rgba(255, 255, 255, 0.08) 1px");

      // 3. Dots pattern
      bg.type = "dots";
      const dotsCss = computeCSSBackground(bg);
      expect(dotsCss).toContain("radial-gradient(circle");

      // 4. Aurora
      bg.type = "aurora";
      const auroraCss = computeCSSBackground(bg);
      expect(auroraCss).toContain("radial-gradient(circle at");
    });

    it("renders canvas procedural particle and noise backgrounds without error", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;

      const bg = getDefaultBackgroundConfig();
      bg.type = "particles";
      expect(() => renderCanvasBackground(canvas, bg, 1500)).not.toThrow();

      bg.type = "noise";
      expect(() => renderCanvasBackground(canvas, bg, 1500)).not.toThrow();
    });
  });

  describe("4. Code Generation & Export Verification", () => {
    it("generates production-ready React component code using official subpaths", () => {
      const anim = getDefaultAnimationConfig();
      const bg = getDefaultBackgroundConfig();

      const code = generateReactComponentCode(anim, bg);
      expect(code).toContain('"use client";');
      expect(code).toContain('import React, { useEffect, useRef } from "react";');
      expect(code).toContain('from "af-motion/react";');
      expect(code).toContain("useMotionAccessibility");
      expect(code).toContain("export default function StudioExportedExperience()");
      expect(code).toContain("prefersReducedMotion");
    });

    it("imports aurora or particleField from 'af-motion' subpath when background effect is active", () => {
      const anim = getDefaultAnimationConfig();
      const bg = getDefaultBackgroundConfig();
      bg.type = "aurora";

      const code = generateReactComponentCode(anim, bg);
      expect(code).toContain('import { aurora } from "af-motion";');

      bg.type = "particles";
      const particleCode = generateReactComponentCode(anim, bg);
      expect(particleCode).toContain('import { particleField } from "af-motion";');
    });

    it("generates CSS custom properties dictionary", () => {
      const anim = getDefaultAnimationConfig();
      const bg = getDefaultBackgroundConfig();

      const vars = generateCSSVariables(anim, bg);
      expect(vars["--af-studio-duration"]).toBe(`${anim.duration}ms`);
      expect(vars["--af-studio-easing"]).toBe(anim.easing);
      expect(vars["--af-studio-bg-primary"]).toBe(bg.colors.primary);
      expect(vars["--af-studio-bg-accent"]).toBe(bg.colors.accent);
    });

    it("creates a complete export bundle with valid JSON config serialization", () => {
      const anim = getDefaultAnimationConfig();
      const bg = getDefaultBackgroundConfig();

      const bundle = generateExportBundle(anim, bg);
      expect(bundle.title).toContain("AF Motion Studio");
      expect(bundle.reactCode).toBeDefined();

      const parsedConfig = JSON.parse(bundle.configJson);
      expect(parsedConfig.generator).toBe("AF Motion Studio");
      expect(parsedConfig.animation.duration).toBe(anim.duration);
      expect(parsedConfig.background.paletteId).toBe(bg.paletteId);
    });
  });

  describe("5. Architecture for Future Studio Modules", () => {
    it("registers extensible slots for Prompts 94-97", () => {
      const moduleIds = FUTURE_STUDIO_MODULES.map((m) => m.id);
      expect(moduleIds).toContain("style-explorer"); // Prompt 94
      expect(moduleIds).toContain("design-systems"); // Prompt 95
      expect(moduleIds).toContain("choreography");   // Prompt 96
      expect(moduleIds).toContain("scene-3d");       // Prompt 97

      const p94 = FUTURE_STUDIO_MODULES.find((m) => m.id === "style-explorer");
      expect(p94?.prompt).toBe("Prompt 94");
    });
  });
});
