import { describe, it, expect } from "vitest";
import {
  interpretVisualReference,
  generateReactImplementationPlan,
  generateReactSpecification,
  type VisualReferenceInput,
  type VisualDesignInterpretation,
  type ReactImplementationPlan,
} from "../src/catalogue.js";
import { executeMCPTool, MCP_TOOLS } from "../src/mcp/tools.js";

describe("Prompt 92 - Reference-to-React Implementation & Validation", () => {
  describe("Visual Reference Interpretation (Deterministic Classification)", () => {
    it("interprets glassmorphism visual references with high confidence", () => {
      const input: VisualReferenceInput = {
        name: "Glassmorphic Finance Dashboard",
        description: "Translucent frosted glass cards with ambient aurora glow and subtle borders.",
        extractedProperties: {
          dominantColors: ["#ffffff", "#0047ab"],
          surfaces: [
            {
              name: "CardSurface",
              kind: "glass",
              blur: 16,
              opacity: 0.25,
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
          ],
          motion: {
            feel: "smooth",
            speed: "normal",
            hasSpringFeedback: true,
          },
          graphics: {
            hasBackgroundEffect: true,
            effectType: "aurora",
          },
        },
      };

      const interpretation = interpretVisualReference(input);
      expect(interpretation.referenceName).toBe("Glassmorphic Finance Dashboard");
      expect(interpretation.styleClassification.style).toBe("glassmorphism");
      expect(interpretation.styleClassification.confidence).toBeGreaterThanOrEqual(0.9);
      expect(interpretation.motionDNA.matchedDNA).toBe("elegant");
      expect(interpretation.capabilitiesRequired).toContain("GlassSurface");
      expect(interpretation.capabilitiesRequired).toContain("aurora");
      expect(interpretation.confidenceReport.overallScore).toBeGreaterThanOrEqual(0.85);
      expect(interpretation.confidenceReport.uncertaintyAreas.length).toBe(0);
    });

    it("interprets brutalist visual references with sharp borders and energetic DNA", () => {
      const input: VisualReferenceInput = {
        name: "Neobrutalist Poster",
        description: "Stark brutalist layout with heavy black borders and stark offset drop shadows.",
        extractedProperties: {
          dominantColors: ["#ffffff", "#0047ab"],
          surfaces: [
            {
              name: "BrutalistBox",
              kind: "brutalist",
              borderWidth: 4,
              borderColor: "#000000",
              boxShadow: "6px 6px 0px #000000",
            },
          ],
          motion: {
            feel: "snappy",
            speed: "fast",
            hasSpringFeedback: true,
          },
        },
      };

      const interpretation = interpretVisualReference(input);
      expect(interpretation.styleClassification.style).toBe("brutalist");
      expect(interpretation.motionDNA.matchedDNA).toBe("energetic");
      expect(interpretation.designTokens.radii.md).toBe("0px");
      expect(interpretation.designTokens.shadows.card).toContain("0px #000");
    });

    it("interprets neumorphic visual references with paired shadows and playful DNA", () => {
      const input: VisualReferenceInput = {
        name: "Neumorphic Music Player",
        description: "Soft extruded neumorphic toggle dials and tactile controls.",
        extractedProperties: {
          dominantColors: ["#ffffff", "#0047ab"],
          surfaces: [
            {
              name: "SoftDial",
              kind: "neumorphic",
            },
          ],
          motion: {
            feel: "bouncy",
            hasSpringFeedback: true,
          },
        },
      };

      const interpretation = interpretVisualReference(input);
      expect(interpretation.styleClassification.style).toBe("neumorphism");
      expect(interpretation.motionDNA.matchedDNA).toBe("playful");
      expect(interpretation.designTokens.shadows.card).toContain("rgba");
    });

    it("reports uncertainties when visual references lack key properties", () => {
      const sparseInput: VisualReferenceInput = {
        name: "Minimalist App",
      };

      const interpretation = interpretVisualReference(sparseInput);
      expect(interpretation.styleClassification.style).toBe("minimal");
      expect(interpretation.confidenceReport.overallScore).toBeLessThan(0.8);
      expect(interpretation.confidenceReport.uncertaintyAreas.length).toBeGreaterThanOrEqual(2);

      const propNames = interpretation.confidenceReport.uncertaintyAreas.map((u) => u.property);
      expect(propNames).toContain("visualStyle");
      expect(propNames).toContain("palette");
      expect(propNames).toContain("motionDNA");
    });

    it("maps color roles and built-in palettes deterministically", () => {
      const input: VisualReferenceInput = {
        name: "Cyberpunk Terminal",
        description: "Dark high-tech interface with neon magenta and cyan highlights.",
        extractedProperties: {
          dominantColors: ["#0a0a12", "#00f0ff", "#ff0055"],
          colorRoles: [
            { role: "background", value: "#0a0a12" },
            { role: "accent", value: "#00f0ff" },
            { role: "primary", value: "#ff0055" },
          ],
        },
      };

      const interpretation = interpretVisualReference(input);
      expect(interpretation.styleClassification.style).toBe("cyberpunk");
      expect(interpretation.paletteMapping.matchedPaletteId).toBe("neon-abyss");
      expect(interpretation.designTokens.colors.background).toBeDefined();
    });
  });

  describe("React Implementation Planning", () => {
    it("generates an end-to-end plan from a visual reference input", () => {
      const input: VisualReferenceInput = {
        name: "Hero Landing Experience",
        description: "Clean modern SaaS landing page with animated hero section and CTA button.",
        targetPlatform: "responsive",
        components: [
          {
            id: "hero-1",
            name: "HeroHeader",
            role: "hero",
            properties: { headline: "Next-gen Motion Engine" },
          },
          {
            id: "cta-btn",
            name: "GetStartedButton",
            role: "button",
            properties: { label: "Try Now" },
          },
          {
            id: "feature-card",
            name: "FeatureCard",
            role: "card",
            properties: { title: "Sub-millisecond Physics" },
          },
        ],
      };

      const plan: ReactImplementationPlan = generateReactImplementationPlan(input);
      expect(plan.id).toMatch(/^plan-/);
      expect(plan.title).toContain("Hero Landing Experience");
      expect(plan.componentHierarchy.length).toBe(3);

      const heroNode = plan.componentHierarchy.find((c) => c.name === "HeroHeader");
      expect(heroNode?.afMotionBinding?.component).toBe("Reveal");
      expect(heroNode?.afMotionBinding?.subpath).toBe("af-motion/react");

      const btnNode = plan.componentHierarchy.find((c) => c.name === "GetStartedButton");
      expect(btnNode?.afMotionBinding?.hook).toBe("useMicrointeraction");

      const cardNode = plan.componentHierarchy.find((c) => c.name === "FeatureCard");
      expect(cardNode?.afMotionBinding?.component).toBe("Interactive");

      expect(plan.responsiveStrategy.mobileFirst).toBe(true);
      expect(plan.responsiveStrategy.breakpoints.sm).toBe("640px");
      expect(plan.motionPlans.length).toBeGreaterThanOrEqual(2);
      expect(plan.accessibilityRequirements.length).toBeGreaterThanOrEqual(4);
      expect(plan.validationChecklist.length).toBeGreaterThanOrEqual(5);
    });

    it("accepts a pre-computed VisualDesignInterpretation directly", () => {
      const input: VisualReferenceInput = {
        name: "3D Torus Showcase",
        description: "Interactive metallic 3D torus with dynamic lighting.",
        extractedProperties: {
          scene3D: {
            has3DScene: true,
            geometryType: "torus",
            materialType: "metallic",
            interactiveControls: true,
          },
        },
      };

      const interpretation: VisualDesignInterpretation = interpretVisualReference(input);
      const plan = generateReactImplementationPlan(interpretation);

      expect(plan.visualStyleConfig.style).toBe("minimal");
      expect(plan.graphicsAnd3D.viewport3D).toBeDefined();
      expect(plan.graphicsAnd3D.viewport3D?.geometry).toBe("torus");
      expect(plan.graphicsAnd3D.viewport3D?.material).toBe("metallic");
      expect(plan.graphicsAnd3D.viewport3D?.controls).toBe(true);
    });
  });

  describe("React Specification Generation", () => {
    it("generates component specifications with strict imports and non-executable blueprints", () => {
      const input: VisualReferenceInput = {
        name: "Interactive Card Wall",
        extractedProperties: {
          layout: { type: "grid", columns: 3 },
          motion: { hasSpringFeedback: true },
        },
      };

      const plan = generateReactImplementationPlan(input);
      const spec = generateReactSpecification(plan);

      expect(spec.planId).toBe(plan.id);
      expect(spec.components.length).toBeGreaterThanOrEqual(1);

      // Verify import subpaths are strictly official
      const allowedSubpaths = new Set([
        "af-motion",
        "af-motion/react",
        "af-motion/catalogue",
        "af-motion/presets",
      ]);
      for (const imp of spec.requiredImports) {
        expect(allowedSubpaths.has(imp.subpath)).toBe(true);
      }

      // Check CSS custom properties
      expect(spec.globalCSSVariables["--af-style"]).toBe(plan.visualStyleConfig.style);
      expect(spec.globalCSSVariables["--af-motion-dna"]).toBe(plan.visualStyleConfig.motionDNA);

      // Verify code template includes client boundary and safety
      expect(spec.codeTemplate).toContain('"use client";');
      expect(spec.codeTemplate).toContain("useMotionAccessibility");
      expect(spec.codeTemplate).toContain("prefersReducedMotion");
    });
  });

  describe("MCP Tools Integration for Reference Analysis", () => {
    it("exposes all 5 new reference tools in MCP_TOOLS array", () => {
      const names = MCP_TOOLS.map((t) => t.name);
      expect(names).toContain("analyze_visual_reference");
      expect(names).toContain("map_reference_to_style");
      expect(names).toContain("generate_react_plan");
      expect(names).toContain("get_implementation_imports");
      expect(names).toContain("validate_implementation_spec");
    });

    it("executes 'analyze_visual_reference' tool via executeMCPTool", async () => {
      const result = await executeMCPTool("analyze_visual_reference", {
        name: "Cyberpunk HUD",
        description: "Dark HUD dashboard with neon accents and fast snappy animations.",
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.referenceName).toBe("Cyberpunk HUD");
      expect(parsed.styleClassification.style).toBe("cyberpunk");
      expect(parsed.motionDNA.matchedDNA).toBe("energetic");
    });

    it("executes 'map_reference_to_style' tool via executeMCPTool", async () => {
      const result = await executeMCPTool("map_reference_to_style", {
        reference: {
          name: "Frosted Glass Header",
          extractedProperties: {
            surfaces: [{ kind: "glass", blur: 12 }],
          },
        },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.style.style).toBe("glassmorphism");
      expect(parsed.tokens.colors).toBeDefined();
      expect(parsed.confidence.overallScore).toBeGreaterThanOrEqual(0.7);
    });

    it("executes 'generate_react_plan' tool via executeMCPTool", async () => {
      const result = await executeMCPTool("generate_react_plan", {
        name: "Minimalist Article",
        description: "Editorial flow with serif typography and smooth scrolling.",
      });

      expect(result.isError).toBeFalsy();
      const plan = JSON.parse(result.content[0].text);
      expect(plan.id).toMatch(/^plan-/);
      expect(plan.componentHierarchy.length).toBeGreaterThanOrEqual(1);
      expect(plan.responsiveStrategy).toBeDefined();
      expect(plan.validationChecklist.length).toBeGreaterThanOrEqual(5);
    });

    it("executes 'get_implementation_imports' tool via executeMCPTool", async () => {
      const result = await executeMCPTool("get_implementation_imports", {
        reference: {
          name: "Animated Button Grid",
        },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.requiredImports).toBeInstanceOf(Array);
      expect(parsed.requiredImports.some((i: any) => i.subpath === "af-motion/react")).toBe(true);
    });

    it("executes 'validate_implementation_spec' tool reporting valid specs and catching illegal subpaths", async () => {
      // 1. Valid plan
      const plan = generateReactImplementationPlan({ name: "Clean Hero" });
      const validResult = await executeMCPTool("validate_implementation_spec", { plan });
      expect(validResult.isError).toBeFalsy();
      const validParsed = JSON.parse(validResult.content[0].text);
      expect(validParsed.valid).toBe(true);
      expect(validParsed.issues.length).toBe(0);

      // 2. Illegal import subpath detection
      const invalidSpec = {
        planId: "test-plan",
        requiredImports: [
          { subpath: "af-motion/react", namedImports: ["Reveal"] },
          { subpath: "framer-motion", namedImports: ["motion"] }, // ILLEGAL non-official subpath
        ],
      };
      const invalidResult = await executeMCPTool("validate_implementation_spec", { spec: invalidSpec });
      expect(invalidResult.isError).toBeFalsy();
      const invalidParsed = JSON.parse(invalidResult.content[0].text);
      expect(invalidParsed.valid).toBe(false);
      expect(invalidParsed.issues[0]).toContain("Forbidden or unknown subpath import: 'framer-motion'");
    });
  });
});
