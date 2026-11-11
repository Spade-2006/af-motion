import { describe, expect, it } from "vitest";
import {
  parseAndNormalizeSceneInput,
  analyzeSceneSpecification,
  planSceneExecution,
  generateSceneComposition,
  generateScene3DSpec,
  validateGeneratedScene,
  generateSceneExportArtifacts,
  AISceneGenerationEngine,
  aiSceneGenerationEngine,
  listAIScenePresets,
  getAIScenePreset,
  type AISceneGenerationInput,
  type StructuredSceneSpecification,
} from "../src/catalogue.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";

describe("Prompt 143 — AI Scene & Animation Generation", () => {
  // ==========================================================================
  // 1. SCENE INPUT PARSING & INTENT DISCOVERY
  // ==========================================================================
  describe("1. Scene Input Parsing & Intent Discovery", () => {
    it("parses natural-language hero scene prompt and resolves category", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "Create a futuristic landing page hero with floating geometric objects and a glowing particle background.",
      };
      const normalized = parseAndNormalizeSceneInput(input);

      expect(normalized.category).toBe("hero");
      expect(normalized.paletteName).toBeDefined();
      expect(normalized.motionDNA).toBe("precise");
      expect(normalized.timingMultiplier).toBe(1.0);
    });

    it("identifies scene categories from specialized prompt keywords", () => {
      const p1 = parseAndNormalizeSceneInput({ naturalLanguage: "Spinning 3D product showcase on a pedestal" });
      expect(p1.category).toBe("product-showcase");

      const p2 = parseAndNormalizeSceneInput({ naturalLanguage: "Interactive physics playground with gravity" });
      expect(p2.category).toBe("physics-playground");

      const p3 = parseAndNormalizeSceneInput({ naturalLanguage: "Dark ambient particle nebula field" });
      expect(p3.category).toBe("particle-environment");

      const p4 = parseAndNormalizeSceneInput({ naturalLanguage: "Scroll-driven storytelling timeline" });
      expect(p4.category).toBe("scroll-storytelling");
    });

    it("respects explicit structured specifications and palette selections", () => {
      const targetPalette = BUILT_IN_PALETTE_INPUTS[5]; // e.g. Cyberpunk / Neon
      const input: AISceneGenerationInput = {
        specification: {
          category: "portfolio",
        },
        paletteName: targetPalette.name,
        motionDNA: "editorial-flow",
        timingMultiplier: 1.2,
        reducedMotion: true,
      };

      const normalized = parseAndNormalizeSceneInput(input);
      expect(normalized.category).toBe("portfolio");
      expect(normalized.paletteName).toBe(targetPalette.name);
      expect(normalized.paletteColors.primary).toBe(targetPalette.primary);
      expect(normalized.motionDNA).toBe("editorial-flow");
      expect(normalized.timingMultiplier).toBe(1.2);
      expect(normalized.reducedMotion).toBe(true);
    });
  });

  // ==========================================================================
  // 2. SCENE UNDERSTANDING ENGINE
  // ==========================================================================
  describe("2. Scene Understanding Engine", () => {
    it("identifies primary subject, supporting elements, and multi-system participation", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "Create an interactive physics playground with draggable objects and collision-triggered particle bursts.",
      };
      const normalized = parseAndNormalizeSceneInput(input);
      const understanding = analyzeSceneSpecification(normalized);

      expect(understanding.primarySubject).toContain("Rigid Body");
      expect(understanding.requiredSystems.hasPhysics).toBe(true);
      expect(understanding.requiredSystems.hasParticles).toBe(true);
      expect(understanding.requiredSystems.hasInteractions).toBe(true);
      expect(understanding.inferredIntent).toBe("simulation");
      expect(understanding.intentConfidence).toBeGreaterThanOrEqual(0.9);
      expect(understanding.evidence.length).toBeGreaterThan(0);
    });

    it("flags high multi-system density complexity warnings", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "3D world with physics gravity collisions and particle glowing nebulae",
      };
      const normalized = parseAndNormalizeSceneInput(input);
      const understanding = analyzeSceneSpecification(normalized);

      expect(understanding.spatialComplexity).toBe("rich");
      expect(understanding.warnings.some((w) => w.includes("GPU budget"))).toBe(true);
    });
  });

  // ==========================================================================
  // 3. SCENE PLANNING & MOTION DNA INTEGRATION
  // ==========================================================================
  describe("3. Scene Planning & Spatial Arrangement", () => {
    it("plans camera, lighting, environment, and layers across all 5 Motion DNA personalities", () => {
      const personalities: Array<"precise" | "playful" | "elegant" | "energetic" | "editorial-flow"> = [
        "precise",
        "playful",
        "elegant",
        "energetic",
        "editorial-flow",
      ];

      for (const dna of personalities) {
        const normalized = parseAndNormalizeSceneInput({
          naturalLanguage: "Hero showcase scene",
          motionDNA: dna,
        });
        const understanding = analyzeSceneSpecification(normalized);
        const { plan, spec } = planSceneExecution(understanding, normalized);

        expect(spec.motionDNA).toBe(dna);
        expect(spec.camera.position).toBeDefined();
        expect(spec.lighting.ambientColor).toBeDefined();
        expect(spec.environment.backgroundColor).toBeDefined();
        expect(spec.objects.length).toBeGreaterThanOrEqual(2);
        expect(plan.layers).toEqual(["background", "middleground", "foreground", "overlay"]);
      }
    });

    it("dampens particle counts and speeds when reduced motion is requested", () => {
      const normalInput = parseAndNormalizeSceneInput({
        naturalLanguage: "Glowing ambient particle field",
        reducedMotion: false,
      });
      const reducedInput = parseAndNormalizeSceneInput({
        naturalLanguage: "Glowing ambient particle field",
        reducedMotion: true,
      });

      const normalRes = planSceneExecution(analyzeSceneSpecification(normalInput), normalInput);
      const reducedRes = planSceneExecution(analyzeSceneSpecification(reducedInput), reducedInput);

      const normalParticles = normalRes.spec.environment.particleField?.count || 0;
      const reducedParticles = reducedRes.spec.environment.particleField?.count || 0;

      expect(reducedParticles).toBeLessThan(normalParticles);
    });
  });

  // ==========================================================================
  // 4. MULTI-SYSTEM SCENE GENERATION & EXPORT
  // ==========================================================================
  describe("4. Multi-System Scene Generation & Export", () => {
    it("generates both MotionComposition and Scene3DSpecification for 3D/physics scenes", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "Generate a cinematic product showcase with a rotating 3D object and staggered text reveal.",
      };
      const result = aiSceneGenerationEngine.generateSync(input);

      expect(result.composition).toBeDefined();
      expect(result.composition.version).toBe("1.0.0");
      expect(result.composition.rootNodeId).toBeDefined();

      expect(result.scene3dSpec).toBeDefined();
      expect(result.scene3dSpec?.objects.length).toBeGreaterThan(0);
      expect(result.scene3dSpec?.camera?.type).toBe("perspective");
    });

    it("generates production-ready React and Vanilla TS code artifacts", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "Interactive hero with particle background and card",
      };
      const result = aiSceneGenerationEngine.generateSync(input);

      expect(result.exportArtifacts.reactCode).toContain('"use client";');
      expect(result.exportArtifacts.reactCode).toContain("GeneratedScene");
      expect(result.exportArtifacts.reactCode).toContain("particleField");
      expect(result.exportArtifacts.reactCode).toContain("useMotionAccessibility");

      expect(result.exportArtifacts.vanillaCode).toContain("setupScene");
      expect(result.exportArtifacts.sceneJson).toContain('"version": "1.0.0"');
      expect(result.exportArtifacts.cssTokens["--af-scene-bg"]).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. SCENE VALIDATION & QUALITY INTELLIGENCE
  // ==========================================================================
  describe("5. Scene Validation & Quality Intelligence", () => {
    it("validates scene structure and computes quality scores and grades", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "Futuristic 3D hero with floating objects",
      };
      const result = aiSceneGenerationEngine.generateSync(input);

      expect(result.validation.isValid).toBe(true);
      expect(result.validation.qualityScore).toBeGreaterThanOrEqual(70);
      expect(["A+", "A", "B", "C"]).toContain(result.validation.qualityGrade);
    });

    it("catches broken parentId references and warns on extreme particle counts", () => {
      const normalized = parseAndNormalizeSceneInput({ naturalLanguage: "Test Scene" });
      const { plan, spec } = planSceneExecution(analyzeSceneSpecification(normalized), normalized);

      // Intentionally break parentId on an object
      const brokenSpec: StructuredSceneSpecification = {
        ...spec,
        objects: [
          ...spec.objects,
          {
            id: "broken-child",
            name: "Broken Child Object",
            type: "card",
            layer: "foreground",
            parentId: "non-existent-parent-id",
            transform: { position: [0, 0, 0] },
          },
          {
            id: "heavy-particles",
            name: "Extreme Particle Emitter",
            type: "particle-system",
            layer: "background",
            transform: { position: [0, 0, 0] },
            particles: { count: 5000, speed: 1, color: "#FFF", size: 2, spread: 20 },
          },
        ],
      };

      const composition = generateSceneComposition(brokenSpec, plan);
      const validation = validateGeneratedScene(brokenSpec, composition);

      expect(validation.isValid).toBe(false);
      expect(validation.findings.some((f) => f.id.includes("err-broken-parent"))).toBe(true);
      expect(validation.findings.some((f) => f.id.includes("warn-high-particle-count"))).toBe(true);
    });
  });

  // ==========================================================================
  // 6. SCENE PRESETS (10 TEMPLATES)
  // ==========================================================================
  describe("6. AI Scene Presets", () => {
    it("provides all 10 battle-tested scene presets", () => {
      const presets = listAIScenePresets();
      expect(presets.length).toBe(10);

      const categories = presets.map((p) => p.category);
      expect(categories).toContain("hero");
      expect(categories).toContain("product-showcase");
      expect(categories).toContain("physics-playground");
      expect(categories).toContain("particle-environment");
      expect(categories).toContain("portfolio");
      expect(categories).toContain("interactive-interface");
      expect(categories).toContain("scroll-storytelling");
    });

    it("executes valid scene generation for each of the 10 presets", () => {
      const presets = listAIScenePresets();
      for (const preset of presets) {
        const result = aiSceneGenerationEngine.generateSync(preset.defaultInput);
        expect(result.specification.objects.length).toBeGreaterThan(0);
        expect(result.composition.rootNodeId).toBeDefined();
        expect(result.validation.isValid).toBe(true);
        expect(result.exportArtifacts.reactCode.length).toBeGreaterThan(100);
      }
    });
  });

  // ==========================================================================
  // 7. DETERMINISM & OFFLINE SAFETY
  // ==========================================================================
  describe("7. Determinism & Offline Safety", () => {
    it("guarantees identical scene generation results for identical inputs", () => {
      const input: AISceneGenerationInput = {
        naturalLanguage: "Futuristic hero with glowing particles and 3D geometry",
        paletteName: "Cobalt Classic",
        motionDNA: "precise",
      };

      const engine = new AISceneGenerationEngine();
      const res1 = engine.generateSync(input);
      const res2 = engine.generateSync(input);

      expect(res1.plan.category).toBe(res2.plan.category);
      expect(res1.plan.objectCount).toBe(res2.plan.objectCount);
      expect(res1.specification.objects.length).toBe(res2.specification.objects.length);
      expect(res1.validation.qualityScore).toBe(res2.validation.qualityScore);
    });

    it("supports asynchronous execution with timeout and cancellation", async () => {
      const engine = new AISceneGenerationEngine();
      const input: AISceneGenerationInput = { naturalLanguage: "Quick test scene" };

      // Immediate timeout test
      await expect(engine.generate(input, { timeoutMs: 0 })).rejects.toThrow("timed out");

      // Signal cancellation test
      const controller = new AbortController();
      controller.abort();
      await expect(engine.generate(input, { signal: controller.signal })).rejects.toThrow("aborted");

      // Normal async execution
      const success = await engine.generate(input, { timeoutMs: 2000 });
      expect(success.specification).toBeDefined();
    });
  });
});
