import { describe, expect, it } from "vitest";
import {
  parseAndNormalizeDesignInput,
  analyzeDesignSpecification,
  planMotionFromDesign,
  generateMotionComposition,
  validateGeneratedMotion,
  generateExportArtifacts,
  DesignToMotionEngine,
  designToMotionEngine,
  listDesignToMotionPresets,
  getDesignToMotionPreset,
  type DesignToMotionInput,
  type DesignStructuredSpecification,
} from "../src/catalogue.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";

describe("Prompt 142 — AI Design-to-Motion Generation", () => {
  // ==========================================================================
  // 1. DESIGN INPUT PARSING & NORMALIZATION
  // ==========================================================================
  describe("1. Input Parsing & Token Integration", () => {
    it("synthesizes structured elements from natural-language modal prompt", () => {
      const input: DesignToMotionInput = {
        naturalLanguage: "Create a premium modal entrance with a subtle scale and fade.",
      };
      const normalized = parseAndNormalizeDesignInput(input);

      expect(normalized.specification.elements.length).toBeGreaterThanOrEqual(2);
      expect(normalized.specification.elements.some((e) => e.type === "modal")).toBe(true);
      expect(normalized.tokens.motionDNA).toBe("precise");
      expect(normalized.validationIssues.length).toBe(0);
    });

    it("parses and validates structured specifications, catching missing properties gracefully", () => {
      const spec: DesignStructuredSpecification = {
        id: "spec-test-1",
        title: "Test Specification",
        elements: [
          {
            id: "btn-submit",
            type: "button",
            name: "Submit Button",
            interactionCapabilities: ["hover", "press"],
          },
          // Element with missing id should be filtered out
          {
            id: "",
            type: "card",
          } as any,
        ],
      };

      const normalized = parseAndNormalizeDesignInput({ specification: spec });
      expect(normalized.specification.elements.length).toBe(1);
      expect(normalized.specification.elements[0].id).toBe("btn-submit");
      expect(normalized.validationIssues.some((issue) => issue.includes("missing required id"))).toBe(true);
    });

    it("integrates built-in palettes and respects custom palette colors", () => {
      const targetPalette = BUILT_IN_PALETTE_INPUTS[3]; // e.g. Cyberpunk / Sunset Glow
      const input: DesignToMotionInput = {
        naturalLanguage: "Playful e-commerce card with bounce",
        tokens: {
          paletteName: targetPalette.name,
          motionDNA: "playful",
          timingMultiplier: 1.25,
          reducedMotion: true,
        },
      };

      const normalized = parseAndNormalizeDesignInput(input);
      expect(normalized.tokens.paletteName).toBe(targetPalette.name);
      expect(normalized.tokens.paletteColors.primary).toBe(targetPalette.primary);
      expect(normalized.tokens.motionDNA).toBe("playful");
      expect(normalized.tokens.timingMultiplier).toBe(1.25);
      expect(normalized.tokens.reducedMotion).toBe(true);
    });

    it("infers Motion DNA personality from natural language keywords when unspecified", () => {
      const input1 = parseAndNormalizeDesignInput({ naturalLanguage: "Make this bounce playfully with joyful springs" });
      expect(input1.tokens.motionDNA).toBe("playful");

      const input2 = parseAndNormalizeDesignInput({ naturalLanguage: "Stately elegant luxury transition" });
      expect(input2.tokens.motionDNA).toBe("elegant");

      const input3 = parseAndNormalizeDesignInput({ naturalLanguage: "Energetic fast punchy entrance" });
      expect(input3.tokens.motionDNA).toBe("energetic");

      const input4 = parseAndNormalizeDesignInput({ naturalLanguage: "Editorial narrative story pacing" });
      expect(input4.tokens.motionDNA).toBe("editorial-flow");
    });
  });

  // ==========================================================================
  // 2. DESIGN ANALYSIS ENGINE
  // ==========================================================================
  describe("2. Design Analysis Engine", () => {
    it("detects element hierarchy, groups, and multi-child group staggering", () => {
      const input: DesignToMotionInput = {
        specification: {
          id: "spec-grid",
          title: "Product Grid",
          elements: [
            { id: "grid-root", type: "grid", name: "Grid Container" },
            { id: "item-1", type: "card", parentId: "grid-root", name: "Card 1" },
            { id: "item-2", type: "card", parentId: "grid-root", name: "Card 2" },
            { id: "item-3", type: "card", parentId: "grid-root", name: "Card 3" },
          ],
        },
      };

      const normalized = parseAndNormalizeDesignInput(input);
      const analysis = analyzeDesignSpecification(normalized);

      expect(analysis.hierarchy.rootIds).toContain("grid-root");
      expect(analysis.hierarchy.depth).toBe(2);
      expect(analysis.hierarchy.groups.length).toBe(1);
      expect(analysis.hierarchy.groups[0].sequenceType).toBe("stagger");
      expect(analysis.hierarchy.groups[0].childIds.length).toBe(3);
      expect(analysis.evidence.some((e) => e.includes("staggered"))).toBe(true);
    });

    it("identifies interactive elements and assigns proper visual weight", () => {
      const input: DesignToMotionInput = {
        specification: {
          id: "spec-interactive",
          title: "Interactive Surface",
          elements: [
            {
              id: "hero-cta",
              type: "button",
              importance: "high",
              semanticRole: "trigger",
              interactionCapabilities: ["hover", "press"],
            },
            {
              id: "bg-surface",
              type: "container",
              importance: "background",
              semanticRole: "overlay",
            },
          ],
        },
      };

      const normalized = parseAndNormalizeDesignInput(input);
      const analysis = analyzeDesignSpecification(normalized);

      const cta = analysis.analyzedElements.find((e) => e.id === "hero-cta");
      const bg = analysis.analyzedElements.find((e) => e.id === "bg-surface");

      expect(cta?.isInteractive).toBe(true);
      expect(cta?.visualWeight).toBe(0.9);
      expect(bg?.isInteractive).toBe(false);
      expect(bg?.visualWeight).toBe(0.1);
      expect(bg?.constraints).toContain("low-priority: maintain minimal duration and non-distracting easing");
    });
  });

  // ==========================================================================
  // 3. MOTION PLANNING & DNA INFLUENCE
  // ==========================================================================
  describe("3. Motion Planning & Motion DNA Integration", () => {
    it("applies Motion DNA personality curves across all 5 profiles", () => {
      const personalities: Array<"precise" | "playful" | "elegant" | "energetic" | "editorial-flow"> = [
        "precise",
        "playful",
        "elegant",
        "energetic",
        "editorial-flow",
      ];

      for (const dna of personalities) {
        const input: DesignToMotionInput = {
          naturalLanguage: "Interactive feature card",
          tokens: { motionDNA: dna },
        };
        const normalized = parseAndNormalizeDesignInput(input);
        const analysis = analyzeDesignSpecification(normalized);
        const plan = planMotionFromDesign(analysis, normalized.tokens);

        expect(plan.motionDNA).toBe(dna);
        expect(plan.durationMs).toBeGreaterThan(100);
        expect(plan.easingCurve).toBeDefined();

        if (dna === "playful") {
          expect(plan.springConfig?.damping).toBeLessThan(20); // Bouncy spring
        } else if (dna === "precise") {
          expect(plan.springConfig?.stiffness).toBeGreaterThan(350); // Crisp spring
        } else if (dna === "energetic") {
          expect(plan.staggerDelayMs).toBeLessThan(40); // Fast stagger
        } else if (dna === "editorial-flow") {
          expect(plan.staggerDelayMs).toBeGreaterThan(80); // Stately narrative stagger
        }
      }
    });

    it("queries Prompt 141 knowledge base and matches registered pattern IDs", () => {
      const input: DesignToMotionInput = {
        naturalLanguage: "Create a premium modal entrance with subtle scale and fade.",
        tokens: { motionDNA: "precise" },
      };
      const normalized = parseAndNormalizeDesignInput(input);
      const analysis = analyzeDesignSpecification(normalized);
      const plan = planMotionFromDesign(analysis, normalized.tokens);

      expect(plan.matchedPatternIds.length).toBeGreaterThan(0);
      expect(plan.matchedPatternIds).toContain("pat-premium-modal-entrance");
    });

    it("enforces reduced-motion accessibility in motion plans", () => {
      const input: DesignToMotionInput = {
        naturalLanguage: "Bouncy button animation",
        tokens: { motionDNA: "playful", reducedMotion: true },
      };
      const normalized = parseAndNormalizeDesignInput(input);
      const analysis = analyzeDesignSpecification(normalized);
      const plan = planMotionFromDesign(analysis, normalized.tokens);

      for (const ep of plan.elementPlans) {
        // Reduced motion plan should only animate opacity and avoid translation/scale transforms
        expect(ep.entrance?.properties).toEqual(["opacity"]);
        expect(ep.exit?.properties).toEqual(["opacity"]);
      }
    });
  });

  // ==========================================================================
  // 4. CONFIGURATION GENERATION & VALIDATION
  // ==========================================================================
  describe("4. Configuration Generation & Quality Validation", () => {
    it("generates valid MotionComposition with valid node hierarchy", () => {
      const input: DesignToMotionInput = {
        naturalLanguage: "Create a staggered card reveal with hover interactions.",
      };
      const result = designToMotionEngine.generateSync(input);

      expect(result.composition).toBeDefined();
      expect(result.composition.version).toBe("1.0.0");
      expect(result.composition.rootNodeId).toBeDefined();
      expect(result.composition.nodes[result.composition.rootNodeId]).toBeDefined();
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.qualityScore).toBeGreaterThanOrEqual(70);
    });

    it("detects layout thrashing properties and produces actionable warnings", () => {
      // Craft a composition with width/height layout thrashing
      const input: DesignToMotionInput = {
        naturalLanguage: "Hero section",
      };
      const normalized = parseAndNormalizeDesignInput(input);
      const analysis = analyzeDesignSpecification(normalized);
      const plan = planMotionFromDesign(analysis, normalized.tokens);
      const composition = generateMotionComposition(analysis, plan, normalized.tokens, input);

      // Inject a layout thrashing property
      (composition.nodes as any)["injected-node"] = {
        id: "injected-node",
        name: "Injected Bad Node",
        type: "element",
        configuration: {
          from: { width: 100 },
          to: { width: 200 },
        },
      };

      const validation = validateGeneratedMotion(composition, normalized.tokens);
      expect(validation.findings.some((f) => f.category === "performance" && f.message.includes("width"))).toBe(true);
    });

    it("generates React and Vanilla TS code export artifacts with valid syntax", () => {
      const input: DesignToMotionInput = {
        naturalLanguage: "Tactile button press feedback",
      };
      const result = designToMotionEngine.generateSync(input);

      expect(result.exportArtifacts.reactCode).toContain('"use client";');
      expect(result.exportArtifacts.reactCode).toContain('import { animate, animateSpring } from "af-motion";');
      expect(result.exportArtifacts.reactCode).toContain("GeneratedMotionComponent");

      expect(result.exportArtifacts.vanillaCode).toContain('import { animate, animateSpring } from "af-motion";');
      expect(result.exportArtifacts.vanillaCode).toContain("setupMotion");

      expect(result.exportArtifacts.cssVariables["--af-motion-duration"]).toBeDefined();
      expect(result.exportArtifacts.compositionJson).toContain('"version": "1.0.0"');
    });
  });

  // ==========================================================================
  // 5. DESIGN-TO-MOTION PRESETS (10 TEMPLATES)
  // ==========================================================================
  describe("5. Design-to-Motion Presets", () => {
    it("provides all 10 battle-tested presets specified in Prompt 142", () => {
      const presets = listDesignToMotionPresets();
      expect(presets.length).toBe(10);

      const categories = presets.map((p) => p.category);
      expect(categories).toContain("saas");
      expect(categories).toContain("portfolio");
      expect(categories).toContain("landing-page");
      expect(categories).toContain("ecommerce");
      expect(categories).toContain("dashboard");
      expect(categories).toContain("editorial");
      expect(categories).toContain("mobile");
      expect(categories).toContain("cards");
      expect(categories).toContain("navigation");
      expect(categories).toContain("hero");
    });

    it("successfully generates valid motion for each preset template", () => {
      const presets = listDesignToMotionPresets();
      for (const preset of presets) {
        const result = designToMotionEngine.generateSync(preset.defaultInput);
        expect(result.composition).toBeDefined();
        expect(result.validation.isValid).toBe(true);
        expect(result.exportArtifacts.reactCode.length).toBeGreaterThan(100);
      }
    });
  });

  // ==========================================================================
  // 6. ENGINE DETERMINISM & CACHING
  // ==========================================================================
  describe("6. Engine Determinism & Offline Safety", () => {
    it("guarantees identical outputs for identical inputs (zero stochastic drift)", () => {
      const input: DesignToMotionInput = {
        naturalLanguage: "Create a high-impact SaaS dashboard entrance",
        tokens: { motionDNA: "precise", timingMultiplier: 1.0 },
      };

      const engine = new DesignToMotionEngine();
      const res1 = engine.generateSync(input);
      const res2 = engine.generateSync(input);

      expect(res1.plan.choreographyType).toBe(res2.plan.choreographyType);
      expect(res1.plan.durationMs).toBe(res2.plan.durationMs);
      expect(res1.plan.easingCurve).toBe(res2.plan.easingCurve);
      expect(res1.validation.qualityScore).toBe(res2.validation.qualityScore);
    });

    it("supports asynchronous generation with timeout and AbortSignal cancellation", async () => {
      const engine = new DesignToMotionEngine();
      const input: DesignToMotionInput = { naturalLanguage: "Quick test" };

      // Immediate timeout
      await expect(engine.generate(input, { timeoutMs: 0 })).rejects.toThrow("timed out");

      // Aborted signal
      const controller = new AbortController();
      controller.abort();
      await expect(engine.generate(input, { signal: controller.signal })).rejects.toThrow("aborted");

      // Successful async execution
      const successRes = await engine.generate(input, { timeoutMs: 2000 });
      expect(successRes).toBeDefined();
    });
  });
});
