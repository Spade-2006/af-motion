// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  // Presets & definitions
  MATTE_MATERIAL,
  METALLIC_MATERIAL,
  PLASTIC_MATERIAL,
  EMISSIVE_MATERIAL,
  TRANSLUCENT_MATERIAL,
  MATERIAL_PRESETS,
  getMaterialPreset,
  STUDIO_LIGHTING,
  DRAMATIC_LIGHTING,
  AMBIENT_SOFT_LIGHTING,
  NEON_LIGHTING,
  SUNSET_LIGHTING,
  LIGHTING_PRESETS,
  getLightingPreset,
  FROSTED_GLASS_PRESET,
  CLEAR_GLASS_PRESET,
  TINTED_GLASS_PRESET,
  LIQUID_GLASS_PRESET,
  ACRYLIC_PRESET,
  TRANSLUCENT_PANEL_PRESET,
  GLASS_PRESETS,
  getGlassPreset,
  // Computation & lighting
  formatShadowsCss,
  resolveLighting,
  computeLightInteraction,
  computeSurfaceStyle,
  isBackdropFilterSupported,
  computeGlassStyle,
  createGlassEffect,
  // Schemas & validators
  MATERIALS_SCHEMA_VERSION,
  SURFACE_DEFINITION_SCHEMA,
  LIGHTING_CONFIG_SCHEMA,
  MATERIAL_DEFINITION_SCHEMA,
  GLASS_OPTIONS_SCHEMA,
  validateSurfaceDefinition,
  validateLightingConfig,
  validateMaterialDefinition,
  validateGlassOptions,
  correctMaterialConfig,
  correctGlassConfig,
  MATERIALS_SYSTEM_CAPABILITY,
  registerMaterialsCapability,
  aiMotionRegistry,
} from "../src/catalogue.js";

import {
  MaterialContext,
  MaterialProvider,
  useMaterial,
  useSurface,
  useLighting,
  useGlass,
  GlassSurface,
} from "../src/react.js";

describe("Materials System (Prompt 72)", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Material Presets & Lookups", () => {
    it("provides standard material presets", () => {
      expect(MATTE_MATERIAL.id).toBe("matte");
      expect(MATTE_MATERIAL.surface.roughness).toBe(0.9);
      expect(METALLIC_MATERIAL.id).toBe("metallic");
      expect(METALLIC_MATERIAL.surface.reflectivity).toBe(0.85);
      expect(PLASTIC_MATERIAL.id).toBe("plastic");
      expect(EMISSIVE_MATERIAL.id).toBe("emissive");
      expect(TRANSLUCENT_MATERIAL.id).toBe("translucent");
      expect(TRANSLUCENT_MATERIAL.surface.transmission).toBe(0.65);
    });

    it("retrieves material presets by id", () => {
      expect(getMaterialPreset("metallic")).toBe(METALLIC_MATERIAL);
      expect(getMaterialPreset("matte")).toBe(MATTE_MATERIAL);
      expect(getMaterialPreset("unknown")).toBeUndefined();
    });

    it("contains 5 built-in material presets", () => {
      expect(Object.keys(MATERIAL_PRESETS)).toEqual([
        "matte",
        "metallic",
        "plastic",
        "emissive",
        "translucent",
      ]);
    });
  });

  describe("Lighting Presets & Resolution", () => {
    it("provides built-in lighting presets", () => {
      expect(STUDIO_LIGHTING.environment?.preset).toBe("studio");
      expect(DRAMATIC_LIGHTING.directional?.intensity).toBe(1.4);
      expect(AMBIENT_SOFT_LIGHTING.ambient?.intensity).toBe(0.85);
      expect(NEON_LIGHTING.environment?.preset).toBe("neon");
      expect(SUNSET_LIGHTING.environment?.preset).toBe("sunset");
    });

    it("retrieves lighting presets by name", () => {
      expect(getLightingPreset("dramatic")).toBe(DRAMATIC_LIGHTING);
      expect(getLightingPreset("neon")).toBe(NEON_LIGHTING);
      expect(getLightingPreset("invalid")).toBeUndefined();
    });

    it("formats shadow configurations into CSS box-shadow", () => {
      const single = formatShadowsCss([
        { offset: [0, 4], blur: 10, spread: 0, color: "rgba(0,0,0,0.1)" },
      ]);
      expect(single).toBe("0px 4px 10px 0px rgba(0,0,0,0.1)");

      const inset = formatShadowsCss([
        { offset: [0, 1], blur: 2, spread: 0, color: "#fff", inset: true },
      ]);
      expect(inset).toBe("inset 0px 1px 2px 0px #fff");

      expect(formatShadowsCss([])).toBe("none");
      expect(formatShadowsCss(undefined)).toBe("none");
    });

    it("resolves lighting into comprehensive uniform and CSS values", () => {
      const resolved = resolveLighting(DRAMATIC_LIGHTING);
      expect(resolved.ambientIntensity).toBe(0.25);
      expect(resolved.primaryLightDirection).toEqual([0.8, 1.2, 0.4]);
      expect(resolved.shadowsCss).toContain("rgba(0, 0, 0, 0.35)");
      expect(resolved.uniforms["u_light_intensity"]).toBe(1.4);
      expect(resolved.uniforms["u_point_pos"]).toEqual([-100, -100, 200]);
    });
  });

  describe("Surface Computation & Light Interaction", () => {
    it("computes surface style with roughness and smoothness relationship", () => {
      const style = computeSurfaceStyle({
        roughness: 0.3,
        baseColor: "#e2e8f0",
        border: { width: "2px", color: "rgba(0,0,0,0.1)", radius: 12 },
      });

      expect(style.background).toBe("#e2e8f0");
      expect(style.border).toBe("2px solid rgba(0,0,0,0.1)");
      expect(style.borderRadius).toBe("12px");
      expect(style.uniforms?.u_roughness).toBe(0.3);
      expect(style.uniforms?.u_smoothness).toBeCloseTo(0.7);
    });

    it("derives roughness from smoothness if only smoothness is supplied", () => {
      const style = computeSurfaceStyle({ smoothness: 0.8 });
      expect(style.uniforms?.u_smoothness).toBe(0.8);
      expect(style.uniforms?.u_roughness).toBeCloseTo(0.2);
    });

    it("computes depth transform if depth is specified", () => {
      const style = computeSurfaceStyle({ depth: 16 });
      expect(style.transform).toBe("translateZ(16px)");
    });

    it("adapts surface for high contrast accessibility", () => {
      const style = computeSurfaceStyle(
        { opacity: 0.4, border: { color: "rgba(255,255,255,0.1)" } },
        undefined,
        { highContrast: true }
      );
      expect(style.opacity).toBe(0.9);
      expect(style.border).toContain("2px solid");
    });

    it("computes interaction with surface highlights and lighting shadows", () => {
      const interaction = computeLightInteraction(
        {
          highlight: { color: "rgba(255,255,255,0.8)", intensity: 0.8 },
          elevation: 3,
        },
        STUDIO_LIGHTING
      );

      expect(interaction.highlights.length).toBeGreaterThan(0);
      expect(interaction.shadows.length).toBeGreaterThan(0);
      expect(interaction.uniforms.u_reflectivity).toBe(0.1);
    });
  });

  describe("Glass Presets & Progressive Enhancement", () => {
    it("provides all 6 distinct glass presets", () => {
      expect(FROSTED_GLASS_PRESET.preset).toBe("frosted-glass");
      expect(FROSTED_GLASS_PRESET.blur).toBe(16);

      expect(CLEAR_GLASS_PRESET.preset).toBe("clear-glass");
      expect(CLEAR_GLASS_PRESET.blur).toBe(6);

      expect(TINTED_GLASS_PRESET.preset).toBe("tinted-glass");
      expect(TINTED_GLASS_PRESET.blur).toBe(20);

      expect(LIQUID_GLASS_PRESET.preset).toBe("liquid-glass");
      expect(LIQUID_GLASS_PRESET.refractiveIndex).toBe(1.52);

      expect(ACRYLIC_PRESET.preset).toBe("acrylic");
      expect(ACRYLIC_PRESET.blur).toBe(32);

      expect(TRANSLUCENT_PANEL_PRESET.preset).toBe("translucent-panel");
      expect(TRANSLUCENT_PANEL_PRESET.opacity).toBe(0.65);
    });

    it("retrieves glass preset by name", () => {
      expect(getGlassPreset("acrylic")).toBe(ACRYLIC_PRESET);
      expect(getGlassPreset("liquid-glass")).toBe(LIQUID_GLASS_PRESET);
      expect(getGlassPreset("non-existent" as any)).toBe(FROSTED_GLASS_PRESET);
    });

    it("computes progressive glass styles in backdrop-filter supported environment", () => {
      const originalCSS = (globalThis as any).CSS;
      (globalThis as any).CSS = {
        supports: vi.fn((prop: string) => prop.includes("backdrop-filter")),
      };

      try {
        expect(isBackdropFilterSupported()).toBe(true);

        const style = computeGlassStyle("frosted-glass", { blur: 20 });
        expect(style.isFallback).toBe(false);
        expect(style.backdropFilter).toBe("blur(20px)");
        expect(style.WebkitBackdropFilter).toBe("blur(20px)");
        expect(style.background).toBe("rgba(255, 255, 255, 0.18)");
        expect(style.border).toContain("solid");
        expect(style.boxShadow).toContain("inset");
        expect(style.uniforms?.u_is_fallback).toBe(false);
      } finally {
        (globalThis as any).CSS = originalCSS;
      }
    });

    it("provides fallback style when backdrop-filter is not supported", () => {
      const originalCSS = (globalThis as any).CSS;
      (globalThis as any).CSS = {
        supports: vi.fn(() => false),
      };

      try {
        expect(isBackdropFilterSupported()).toBe(false);

        const style = computeGlassStyle("acrylic");
        expect(style.isFallback).toBe(true);
        expect(style.backdropFilter).toBeUndefined();
        expect(style.WebkitBackdropFilter).toBeUndefined();
        expect(style.background).toContain("0.92)");
        expect(style.uniforms?.u_is_fallback).toBe(true);
      } finally {
        (globalThis as any).CSS = originalCSS;
      }
    });

    it("enforces fallback with high contrast accessibility mode", () => {
      const originalCSS = (globalThis as any).CSS;
      (globalThis as any).CSS = {
        supports: vi.fn(() => true),
      };

      try {
        const style = computeGlassStyle("clear-glass", { highContrast: true });
        expect(style.isFallback).toBe(true);
        expect(style.background).toBe("#ffffff");
        expect(style.border).toContain("2px solid #0f172a");
        expect(style.backdropFilter).toBeUndefined();
      } finally {
        (globalThis as any).CSS = originalCSS;
      }
    });

    it("creates a Canvas/WebGL GraphicsEffect for glass refraction", () => {
      const effect = createGlassEffect({ preset: "liquid-glass", blur: 24 });
      expect(effect.id).toContain("glass-effect-");
      expect(effect.name).toContain("liquid-glass");
      expect(effect.accessibility?.supportsReducedMotion).toBe(true);

      const fakeCtx = {
        save: vi.fn(),
        fillStyle: "",
        fillRect: vi.fn(),
        restore: vi.fn(),
      };

      effect.render({
        renderer: {} as any,
        resourceManager: {} as any,
        rawContext: fakeCtx,
        width: 800,
        height: 600,
        pixelWidth: 800,
        pixelHeight: 600,
        dpr: 1,
        canvas: {} as any,
        backend: "canvas2d",
        elapsedTime: 100,
        frameIndex: 1,
      });

      expect(fakeCtx.save).toHaveBeenCalled();
      expect(fakeCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(fakeCtx.restore).toHaveBeenCalled();

      expect(() => effect.dispose?.()).not.toThrow();
    });
  });

  describe("Validation & Configuration Correction", () => {
    it("validates valid material definitions", () => {
      const res = validateMaterialDefinition(MATTE_MATERIAL);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("rejects invalid material definitions", () => {
      expect(validateMaterialDefinition(null).valid).toBe(false);
      expect(validateMaterialDefinition({ id: "", name: "Test" }).valid).toBe(false);
      expect(validateMaterialDefinition({ id: "x", name: "x", type: "invalid-type", surface: {} }).valid).toBe(false);
    });

    it("validates surface definitions", () => {
      expect(validateSurfaceDefinition({ roughness: 0.5, opacity: 1 }).valid).toBe(true);
      expect(validateSurfaceDefinition({ roughness: 1.5 }).valid).toBe(false);
      expect(validateSurfaceDefinition({ opacity: -0.1 }).valid).toBe(false);
    });

    it("validates lighting configurations", () => {
      expect(validateLightingConfig({ ambient: { intensity: 0.5 } }).valid).toBe(true);
      expect(validateLightingConfig({ directional: { intensity: -2 } }).valid).toBe(false);
    });

    it("validates glass options", () => {
      expect(validateGlassOptions({ blur: 10, opacity: 0.5 }).valid).toBe(true);
      expect(validateGlassOptions({ blur: -5 }).valid).toBe(false);
      expect(validateGlassOptions({ opacity: 2.0 }).valid).toBe(false);
    });

    it("corrects malformed material configurations safely", () => {
      const corrected = correctMaterialConfig({
        id: "custom",
        name: "Custom",
        type: "unknown-type" as any,
        surface: { roughness: 2.5, opacity: -1 },
      });

      expect(corrected.type).toBe("matte");
      expect(corrected.surface.roughness).toBe(1);
      expect(corrected.surface.opacity).toBe(0);
    });

    it("corrects malformed glass options safely", () => {
      const corrected = correctGlassConfig({
        preset: "invalid" as any,
        blur: -20,
        opacity: 5,
        elevation: 100,
      });

      expect(corrected.preset).toBe("frosted-glass");
      expect(corrected.blur).toBe(0);
      expect(corrected.opacity).toBe(1);
      expect(corrected.elevation).toBe(24);
    });
  });

  describe("AI Motion Registry Integration", () => {
    it("defines valid MATERIALS_SYSTEM_CAPABILITY metadata", () => {
      expect(MATERIALS_SYSTEM_CAPABILITY.id).toBe("materials-system");
      expect(MATERIALS_SYSTEM_CAPABILITY.category).toBe("graphics");
      expect(MATERIALS_SYSTEM_CAPABILITY.react.componentName).toBe("GlassSurface");
      expect(MATERIALS_SYSTEM_CAPABILITY.react.hookName).toBe("useGlass");
      expect(MATERIALS_SYSTEM_CAPABILITY.controls).toContain("computeGlassStyle");
    });

    it("can register materials capability into aiMotionRegistry dynamically", () => {
      registerMaterialsCapability(aiMotionRegistry);
      const cap = aiMotionRegistry.getCapability("materials-system");
      expect(cap).toBeDefined();
      expect(cap?.id).toBe("materials-system");
      expect(cap?.name).toBe("computeGlassStyle");
    });
  });

  describe("React Integration", () => {
    it("provides inherited material and lighting context via MaterialProvider", () => {
      let capturedMaterial: any;
      let capturedLighting: any;

      function Consumer() {
        const mat = useMaterial();
        capturedMaterial = mat.material;
        capturedLighting = mat.resolvedLighting;
        return createElement("div", null, "Context Consumer");
      }

      act(() => {
        root.render(
          createElement(
            MaterialProvider,
            { material: "metallic", lighting: "dramatic" },
            createElement(Consumer)
          )
        );
      });

      expect(capturedMaterial.id).toBe("metallic");
      expect(capturedLighting.primaryLightColor).toBe("#f8fafc");
    });

    it("useSurface computes styles based on active surface and lighting", () => {
      let capturedStyle: any;

      function Consumer() {
        const { style } = useSurface({
          roughness: 0.1,
          baseColor: "rgba(10, 20, 30, 0.9)",
          elevation: 2,
        });
        capturedStyle = style;
        return createElement("div", null, "Surface Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(capturedStyle.background).toBe("rgba(10, 20, 30, 0.9)");
      expect(capturedStyle.boxShadow).not.toBe("none");
      expect(capturedStyle.uniforms?.u_roughness).toBe(0.1);
    });

    it("useLighting resolves named lighting presets", () => {
      let capturedResolved: any;

      function Consumer() {
        capturedResolved = useLighting("sunset");
        return createElement("div", null, "Lighting Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(capturedResolved.ambientColor).toBe("#451a03");
      expect(capturedResolved.primaryLightColor).toBe("#fb923c");
    });

    it("useGlass returns preset, style result, isFallback, blur, and cssProperties", () => {
      let capturedGlass: any;

      function Consumer() {
        capturedGlass = useGlass("acrylic", { blur: 28 });
        return createElement("div", null, "Glass Consumer");
      }

      act(() => {
        root.render(createElement(Consumer));
      });

      expect(capturedGlass.preset).toBe("acrylic");
      expect(capturedGlass.blur).toBe(28);
      expect(typeof capturedGlass.isFallback).toBe("boolean");
      expect(capturedGlass.cssProperties).toBeDefined();
      expect(capturedGlass.cssProperties.borderRadius).toBe("14px");
    });

    it("GlassSurface renders container with computed glass styles and forwards ref", () => {
      const ref = createRef<HTMLDivElement>();

      act(() => {
        root.render(
          createElement(
            GlassSurface,
            {
              ref,
              preset: "clear-glass",
              className: "my-glass-panel",
              style: { padding: "20px" },
            },
            createElement("span", null, "Glass Content")
          )
        );
      });

      const panel = host.querySelector(".my-glass-panel") as HTMLDivElement;
      expect(panel).not.toBeNull();
      expect(ref.current).toBe(panel);
      expect(panel.textContent).toBe("Glass Content");
      expect(panel.style.borderRadius).toBe("12px");
      expect(panel.style.padding).toBe("20px");
    });

    it("GlassSurface supports interactive states (hover, pressed, focus)", () => {
      const onMouseEnter = vi.fn();
      const onMouseDown = vi.fn();

      act(() => {
        root.render(
          createElement(
            GlassSurface,
            {
              preset: "frosted-glass",
              className: "interactive-panel",
              interactive: true,
              elevation: 2,
              onMouseEnter,
              onMouseDown,
            },
            "Interactive Panel"
          )
        );
      });

      const panel = host.querySelector(".interactive-panel") as HTMLDivElement;
      expect(panel.style.cursor).toBe("pointer");
      expect(panel.getAttribute("role")).toBe("button");

      // Hover
      act(() => {
        panel.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        panel.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });
      expect(onMouseEnter).toHaveBeenCalledTimes(1);

      // Press
      act(() => {
        panel.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      expect(onMouseDown).toHaveBeenCalledTimes(1);

      // Release
      act(() => {
        panel.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      });

      // Focus
      act(() => {
        panel.focus();
      });
      expect(panel.style.outline).toContain("solid");

      // Blur
      act(() => {
        panel.blur();
      });
      expect(panel.style.outline).toBe("");
    });

    it("GlassSurface renders custom fallback node when isFallback is true", () => {
      const originalCSS = (globalThis as any).CSS;
      (globalThis as any).CSS = {
        supports: vi.fn(() => false),
      };

      try {
        act(() => {
          root.render(
            createElement(
              GlassSurface,
              {
                preset: "liquid-glass",
                fallback: createElement("div", { className: "custom-fallback" }, "Fallback Content"),
              },
              createElement("div", { className: "normal-content" }, "Normal Content")
            )
          );
        });

        expect(host.querySelector(".custom-fallback")).not.toBeNull();
        expect(host.querySelector(".normal-content")).toBeNull();
      } finally {
        (globalThis as any).CSS = originalCSS;
      }
    });

    it("GlassSurface renders without crashing in SSR simulation", () => {
      const html = renderToString(
        createElement(
          GlassSurface,
          { preset: "translucent-panel", elevation: 1 },
          createElement("p", null, "SSR Glass")
        )
      );

      expect(html).toContain("SSR Glass");
      expect(html).toContain("border-radius");
    });
  });
});
