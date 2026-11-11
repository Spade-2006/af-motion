import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createScene3DComposition,
  generate3DSceneFromIntent,
  parseNaturalLanguageSceneIntent,
  getSceneRecipe,
  listSceneRecipes,
  resolve3DSceneFallbacks,
  resolveScene3DQualityProfile,
  Scene3DPerformanceMonitor,
  SCENE_3D_QUALITY_PROFILES,
  SCENE_3D_COMPOSITION_CAPABILITY,
  SCENE_3D_GENERATION_CAPABILITY,
  getAvailableSceneRecipes,
  register3DIntelligenceCapabilities,
  type Scene3DCompositionDefinition,
  type Scene3DIntent,
  type Scene3DRecipeName,
} from "../src/3d/index.js";

import {
  Scene3DCompositionProvider,
  Scene3DCompositionView,
  useGenerateScene3D,
  useScene3DComposition,
  useScenePerformance,
} from "../src/react.js";

describe("Prompt 81 — 3D Scene Composition & AI Generation Pipeline", () => {
  describe("1. Scene Recipes", () => {
    it("lists all 8 production-grade recipes with complete metadata", () => {
      const recipes = listSceneRecipes();
      expect(recipes).toHaveLength(8);

      const names = recipes.map((r) => r.name);
      expect(names).toContain("product-showcase");
      expect(names).toContain("cinematic-hero");
      expect(names).toContain("abstract-environment");
      expect(names).toContain("interactive-portfolio");
      expect(names).toContain("spatial-storytelling");
      expect(names).toContain("architectural-viz");
      expect(names).toContain("floating-object");
      expect(names).toContain("scroll-product-narrative");
    });

    it("generates valid specifications for all 8 recipes", () => {
      const recipes: Scene3DRecipeName[] = [
        "product-showcase",
        "cinematic-hero",
        "abstract-environment",
        "interactive-portfolio",
        "spatial-storytelling",
        "architectural-viz",
        "floating-object",
        "scroll-product-narrative",
      ];

      for (const recipe of recipes) {
        const spec = getSceneRecipe(recipe);
        expect(spec.id).toBeDefined();
        expect(spec.version).toBe("1.0.0");
        expect(spec.camera).toBeDefined();
        expect(spec.lighting).toBeDefined();
        expect(spec.objects.length).toBeGreaterThan(0);
      }
    });

    it("applies recipe customization options (color, modelUrl, fov)", () => {
      const spec = getSceneRecipe("product-showcase", {
        primaryColor: "#ff0077",
        modelUrl: "https://example.com/asset.glb",
        fov: 55,
      });

      expect(spec.camera?.fov).toBe(55);
      const hero = spec.objects.find((o) => o.id === "hero-product");
      expect(hero).toBeDefined();
      expect(hero?.type).toBe("model");
    });
  });

  describe("2. AI Scene Generation & Intent Interpretation", () => {
    it("parses natural language keywords into structured intent", () => {
      const intent1 = parseNaturalLanguageSceneIntent("Create a cinematic dark moody film scene with chrome materials");
      expect(intent1.visualStyle).toBe("cinematic-hero");
      expect(intent1.lightingPreset).toBe("cinematic");
      expect(intent1.materialPreset).toBe("chrome");

      const intent2 = parseNaturalLanguageSceneIntent("Abstract neon cyber glow with floating geometry and reduced motion");
      expect(intent2.visualStyle).toBe("abstract-environment");
      expect(intent2.lightingPreset).toBe("neon");
      expect(intent2.reducedMotion).toBe(true);

      const intent3 = parseNaturalLanguageSceneIntent("Clean architectural room with isometric view and daylight");
      expect(intent3.visualStyle).toBe("architectural-viz");
      expect(intent3.cameraStaging).toBe("isometric");
      expect(intent3.lightingPreset).toBe("daylight");
    });

    it("generates a validated, complete 3D scene specification from a prompt", () => {
      const result = generate3DSceneFromIntent("Futuristic golden wristwatch product showcase", {
        capabilities: { isSupported: true, webgl: true },
      });
      expect(result.spec).toBeDefined();
      expect(result.spec.objects.length).toBeGreaterThan(0);
      expect(result.validationReport.valid).toBe(true);
      expect(result.fallbackDecision.canRender).toBe(true);
    });

    it("generates a custom scene with multiple specified objects from structured intent", () => {
      const customIntent: Scene3DIntent = {
        description: "Three floating shapes",
        visualStyle: "abstract-environment",
        materialPreset: "gold",
        objects: [
          { id: "obj-1", primitive: "sphere", position: [0, 1, 0], scale: [1, 1, 1] },
          { id: "obj-2", primitive: "box", position: [2, 0, 0], scale: [0.5, 0.5, 0.5] },
        ],
      };

      const result = generate3DSceneFromIntent(customIntent);
      expect(result.spec.objects).toHaveLength(2);
      expect(result.spec.objects[0].id).toBe("obj-1");
      expect(result.spec.objects[1].id).toBe("obj-2");
      expect(result.validationReport.valid).toBe(true);
    });
  });

  describe("3. Capability-Aware Fallback Resolution", () => {
    it("replaces unsupported models with fallback primitives", () => {
      const spec = getSceneRecipe("product-showcase", {
        modelUrl: "https://example.com/asset.glb",
      });

      const decision = resolve3DSceneFallbacks(spec, {
        allowModels: false,
      });

      expect(decision.degradedFeatures).toContain("model-to-primitive");
      const hero = decision.resolvedSpec.objects.find((o) => o.id === "hero-product");
      expect(hero?.type).toBe("primitive");
      expect((hero as any)?.geometry?.primitive).toBe("box");
    });

    it("downgrades physical transmission materials when floatTextures/WebGL2 unsupported", () => {
      const spec = getSceneRecipe("abstract-environment");
      const decision = resolve3DSceneFallbacks(spec, {
        capabilities: { webgl2: false, floatTextures: false },
      });

      expect(decision.degradedFeatures).toContain("transmission-to-standard");
      const octa = decision.resolvedSpec.objects.find((o) => o.id === "floating-octa");
      expect((octa as any)?.material?.type).toBe("standard");
    });

    it("disables autoPlay animations and dampens controls when reduced-motion is requested", () => {
      const spec = getSceneRecipe("floating-object");
      const decision = resolve3DSceneFallbacks(spec, {
        forceReducedMotion: true,
      });

      expect(decision.degradedFeatures).toContain("reduced-motion-applied");
      expect(decision.resolvedSpec.animations?.[0].autoPlay).toBe(false);
    });

    it("truncates objects exceeding max threshold", () => {
      const spec = getSceneRecipe("interactive-portfolio");
      const decision = resolve3DSceneFallbacks(spec, {
        maxObjects: 2,
      });

      expect(decision.degradedFeatures).toContain("object-count-truncated");
      expect(decision.resolvedSpec.objects).toHaveLength(2);
    });
  });

  describe("4. Adaptive Quality & Performance Monitoring", () => {
    it("resolves default quality profiles accurately", () => {
      expect(resolveScene3DQualityProfile("low").maxDpr).toBe(1.0);
      expect(resolveScene3DQualityProfile("high").shadows).toBe(true);
      expect(resolveScene3DQualityProfile("ultra").maxObjects).toBe(500);
    });

    it("tracks rolling average FPS and automatically degrades profile under strain", () => {
      let degradedLevel = "";
      const monitor = new Scene3DPerformanceMonitor({
        initialProfile: "high",
        onQualityDegrade: (lvl) => {
          degradedLevel = lvl;
        },
      });

      expect(monitor.getProfile().level).toBe("high");

      // Simulate heavy frame drops: 50ms per frame = 20 FPS
      let mockTime = 1000;
      for (let i = 0; i < 35; i++) {
        monitor.recordFrame(mockTime);
        mockTime += 50; // 20 FPS
      }

      expect(monitor.getAverageFps()).toBeLessThan(25);
      expect(degradedLevel).toBe("medium");
      expect(monitor.getProfile().level).toBe("medium");
    });

    it("handles visibility suspension", () => {
      const monitor = new Scene3DPerformanceMonitor();
      expect(monitor.shouldRender()).toBe(true);
      monitor.setVisibility(false);
      expect(monitor.shouldRender()).toBe(false);
    });
  });

  describe("5. Unified Scene Composition Engine", () => {
    it("creates, updates, and disposes scene composition instance immutably", () => {
      const spec = getSceneRecipe("product-showcase");
      const definition: Scene3DCompositionDefinition = {
        id: "test-composition",
        spec,
      };

      let specChangeCount = 0;
      const comp = createScene3DComposition(definition, {
        onSpecChange: () => {
          specChangeCount++;
        },
      });

      expect(comp.id).toBe("test-composition");
      expect(comp.spec.objects.length).toBeGreaterThan(0);

      // Mutate object
      comp.updateObject("hero-product", { visible: false });
      expect(comp.spec.objects.find((o) => o.id === "hero-product")?.visible).toBe(false);
      expect(specChangeCount).toBe(1);

      // Change quality
      comp.setQuality("low");
      expect(specChangeCount).toBe(2);

      // Cleanup
      comp.destroy();
    });
  });

  describe("6. AI Motion Registry Discovery", () => {
    it("provides discovery helpers and registers capabilities dynamically", () => {
      const recipes = getAvailableSceneRecipes();
      expect(recipes).toHaveLength(8);

      const registry = {
        capabilities: [] as any[],
        registerCapability(cap: any) {
          this.capabilities.push(cap);
        },
      };

      register3DIntelligenceCapabilities(registry);
      const capIds = registry.capabilities.map((c) => c.id);
      expect(capIds).toContain(SCENE_3D_COMPOSITION_CAPABILITY.id);
      expect(capIds).toContain(SCENE_3D_GENERATION_CAPABILITY.id);
    });
  });

  describe("7. React Integrations (SSR & Component Rendering)", () => {
    it("renders Scene3DCompositionView with recipe in SSR environment", () => {
      const html = renderToString(
        createElement(Scene3DCompositionView, {
          recipe: "product-showcase",
          quality: "high",
        })
      );

      expect(html).toContain('data-scene-quality="high"');
      expect(html).toContain("product-showcase-scene");
    });

    it("renders Scene3DCompositionView with natural-language intent in SSR environment", () => {
      const html = renderToString(
        createElement(Scene3DCompositionView, {
          intent: "Cinematic dark watch hero showcase",
          quality: "ultra",
        })
      );

      expect(html).toContain('data-scene-quality="ultra"');
      expect(html).toContain("generated-scene");
    });
  });
});
