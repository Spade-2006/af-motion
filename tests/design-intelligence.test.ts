// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  interpretDesignRequirements,
  validateDesignContext,
  normalizeDesignContext,
  createDesignContext,
  toNaturalMotionContext,
  interpretMotionPrompt,
  aiMotionRegistry,
  registerCapability,
  resetCapabilityRegistry,
  type DesignContext,
} from "../src/catalogue.js";
import { useDesignContext, useInterpretDesign } from "../src/react.js";

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
  resetCapabilityRegistry();
});

function testHook<T>(callback: () => T) {
  let value!: T;
  function TestComponent() {
    value = callback();
    return null;
  }
  act(() => {
    root.render(createElement(TestComponent));
  });
  return {
    get current() {
      return value;
    },
    rerender() {
      act(() => {
        root.render(createElement(TestComponent));
      });
    },
  };
}

describe("Prompt 60 — Design Intelligence & Context Interpretation", () => {
  describe("Website Category Detection", () => {
    it("detects dashboard and fintech context", () => {
      const result = interpretDesignRequirements(
        "Build a dark mode fintech SaaS dashboard with data density and KPI analytics tables.",
      );

      expect(result.success).toBe(true);
      expect(result.normalizedContext.category).toBe("dashboard");
      expect(result.normalizedContext.industry).toBe("fintech");
      expect(result.detectedCharacteristics.detectedCategory).toBe("dashboard");
    });

    it("detects creative agency portfolio", () => {
      const result = interpretDesignRequirements(
        "Create an agency portfolio showcase site for a creative design studio.",
      );

      expect(result.success).toBe(true);
      expect(result.normalizedContext.category).toBe("portfolio");
      expect(result.detectedCharacteristics.detectedCategory).toBe("portfolio");
    });

    it("detects ecommerce retail store", () => {
      const result = interpretDesignRequirements(
        "Design an ecommerce store with product cards, checkout buttons, and inventory carousels.",
      );

      expect(result.success).toBe(true);
      expect(result.normalizedContext.category).toBe("ecommerce");
    });

    it("detects developer documentation", () => {
      const result = interpretDesignRequirements(
        "Create developer documentation with API reference tables and clean navigation.",
      );

      expect(result.success).toBe(true);
      expect(result.normalizedContext.category).toBe("documentation");
    });
  });

  describe("Brand Personality Detection", () => {
    it("detects minimal personality", () => {
      const result = interpretDesignRequirements(
        "Clean, understated minimalist portfolio with generous whitespace.",
      );
      expect(result.normalizedContext.personality).toBe("minimal");
    });

    it("detects futuristic tech personality", () => {
      const result = interpretDesignRequirements(
        "A futuristic sci-fi cyberpunk platform with cosmic visuals and next-gen tech.",
      );
      expect(result.normalizedContext.personality).toBe("futuristic");
    });

    it("detects playful personality", () => {
      const result = interpretDesignRequirements(
        "A fun, playful, cheerful consumer app with quirky animations.",
      );
      expect(result.normalizedContext.personality).toBe("playful");
    });

    it("detects elegant luxury personality", () => {
      const result = interpretDesignRequirements(
        "A refined, elegant luxury jewelry website with sophisticated aesthetics.",
      );
      expect(result.normalizedContext.personality).toBe("elegant");
    });

    it("detects brutalist personality", () => {
      const result = interpretDesignRequirements(
        "Raw neo-brutalism design with high-contrast borders and unpolished typography.",
      );
      expect(result.normalizedContext.personality).toBe("brutalist");
    });

    it("detects editorial personality", () => {
      const result = interpretDesignRequirements(
        "An editorial literary magazine with serif typography and magazine style layout.",
      );
      expect(result.normalizedContext.personality).toBe("editorial");
    });
  });

  describe("Visual Preference & Layout Extraction", () => {
    it("extracts dark mode and neon vibrancy", () => {
      const result = interpretDesignRequirements(
        "Dark mode website with neon vibrancy and colorful accents.",
      );
      expect(result.normalizedContext.visualDirection.colorMode).toBe("dark");
      expect(result.normalizedContext.visualDirection.vibrancy).toBe("neon");
    });

    it("extracts bento grid layout", () => {
      const result = interpretDesignRequirements(
        "A SaaS product landing page featuring a bento grid modular layout with cards.",
      );
      expect(result.normalizedContext.layout).toBe("bento");
    });

    it("extracts asymmetric layout and spacious density", () => {
      const result = interpretDesignRequirements(
        "An asymmetric off-grid editorial website with spacious generous spacing.",
      );
      expect(result.normalizedContext.layout).toBe("asymmetric");
      expect(result.normalizedContext.visualDirection.density).toBe("spacious");
    });

    it("extracts compact density for high data density requirements", () => {
      const result = interpretDesignRequirements(
        "A compact data-dense analytics dashboard.",
      );
      expect(result.normalizedContext.visualDirection.density).toBe("compact");
    });
  });

  describe("Component & Interaction Requirements", () => {
    it("extracts explicit component requirements", () => {
      const result = interpretDesignRequirements(
        "Website requiring a hero section, feature cards, CTA buttons, data tables, and modal dialogs.",
      );
      expect(result.normalizedContext.components.hero).toBe(true);
      expect(result.normalizedContext.components.cards).toBe(true);
      expect(result.normalizedContext.components.buttons).toBe(true);
      expect(result.normalizedContext.components.tables).toBe(true);
      expect(result.normalizedContext.components.modals).toBe(true);
      expect(result.detectedCharacteristics.explicitComponents).toContain("hero");
      expect(result.detectedCharacteristics.explicitComponents).toContain("cards");
    });

    it("extracts magnetic and scroll-driven interaction requirements", () => {
      const result = interpretDesignRequirements(
        "Add magnetic buttons and smooth scroll-driven reveals with subtle hover effects.",
      );
      expect(result.normalizedContext.interactions.magneticElements).toBe(true);
      expect(result.normalizedContext.interactions.scrollDriven).toBe(true);
      expect(result.normalizedContext.interactions.hoverIntensity).toBe("subtle");
      expect(result.detectedCharacteristics.explicitInteractions).toContain("magneticElements");
      expect(result.detectedCharacteristics.explicitInteractions).toContain("scrollDriven");
    });
  });

  describe("Visual Style Intelligence & Capability Resolution", () => {
    it("recommends registered capabilities and never invents nonexistent style IDs", () => {
      const result = interpretDesignRequirements(
        "Futuristic tech landing page in dark mode.",
      );

      expect(result.recommendedVisualStyles.length).toBeGreaterThan(0);
      for (const rec of result.recommendedVisualStyles) {
        expect(rec.isRegistered).toBe(true);
        if (rec.capabilityId) {
          expect(aiMotionRegistry.hasCapability(rec.capabilityId)).toBe(true);
        }
      }
    });

    it("dynamically resolves custom registered visual-style capabilities", () => {
      registerCapability({
        id: "visual-style-cyber-glass",
        name: "Cyber Glass",
        category: "visual-style",
        description: "Translucent cybernetic glass panels with neon refraction.",
      });

      const result = interpretDesignRequirements("Futuristic dark cyber platform.");
      const matched = result.recommendedVisualStyles.find(
        (s) => s.styleId === "visual-style-cyber-glass",
      );

      expect(matched).toBeDefined();
      expect(matched?.category).toBe("visual-style");
      expect(matched?.isRegistered).toBe(true);
    });

    it("recommends built-in palettes based on visual preferences", () => {
      const darkResult = interpretDesignRequirements("Dark mode developer console.");
      expect(
        darkResult.recommendedVisualStyles.some(
          (s) => s.capabilityId === "palette-midnight-voltage",
        ),
      ).toBe(true);

      const elegantResult = interpretDesignRequirements("Elegant luxury portfolio.");
      expect(
        elegantResult.recommendedVisualStyles.some(
          (s) => s.capabilityId === "palette-cosmic-mocha",
        ),
      ).toBe(true);
    });
  });

  describe("Conflict Detection", () => {
    it("detects accessibility conflict when expressive motion meets reduced motion", () => {
      const context: Partial<DesignContext> = {
        motion: { intensity: "expressive" },
        accessibility: { respectReducedMotion: true },
      };

      const result = interpretDesignRequirements(context);
      const conflict = result.conflicts.find((c) => c.type === "accessibility_conflict");

      expect(conflict).toBeDefined();
      expect(conflict?.id).toBe("conflict-motion-accessibility");
      expect(conflict?.severity).toBe("warning");
      expect(conflict?.resolutionSuggestion).toContain("static-fallback");
    });

    it("detects density conflict when dashboard is configured as spacious", () => {
      const context: Partial<DesignContext> = {
        category: "dashboard",
        visualDirection: {
          colorMode: "dark",
          vibrancy: "balanced",
          density: "spacious",
          contrast: "standard",
        },
      };

      const result = interpretDesignRequirements(context);
      const conflict = result.conflicts.find((c) => c.type === "density_conflict");

      expect(conflict).toBeDefined();
      expect(conflict?.id).toBe("conflict-density-dashboard");
    });

    it("detects personality mismatch when brutalist is configured with pastel vibrancy", () => {
      const context: Partial<DesignContext> = {
        personality: "brutalist",
        visualDirection: {
          colorMode: "light",
          vibrancy: "pastel",
          density: "comfortable",
          contrast: "standard",
        },
      };

      const result = interpretDesignRequirements(context);
      const conflict = result.conflicts.find((c) => c.type === "personality_mismatch");

      expect(conflict).toBeDefined();
      expect(conflict?.id).toBe("conflict-brutalist-soft");
    });

    it("detects visual conflict when luxury aesthetic meets neon vibrancy", () => {
      const context: Partial<DesignContext> = {
        personality: "elegant",
        visualDirection: {
          colorMode: "dark",
          vibrancy: "neon",
          density: "spacious",
          contrast: "standard",
        },
      };

      const result = interpretDesignRequirements(context);
      const conflict = result.conflicts.find((c) => c.type === "visual_conflict");

      expect(conflict).toBeDefined();
      expect(conflict?.id).toBe("conflict-luxury-neon");
    });
  });

  describe("Motion Intelligence & Prompt 59 Integration", () => {
    it("derives motion recommendations tailored to the website context", () => {
      const result = interpretDesignRequirements(
        "Fintech analytics dashboard with cards and tables.",
      );

      const motion = result.motionRecommendations;
      expect(motion.intensity).toBe("subtle");
      expect(motion.motionDNA).toBe("dna-snappy");
      expect(motion.recommendedPresets).toContain("preset-fade-in");
      expect(motion.recommendedEffects).toContain("effect-count-up");
      expect(motion.defaultDuration).toBeLessThanOrEqual(300);
    });

    it("bridges design context into Prompt 59 natural motion interpreter", () => {
      const designResult = interpretDesignRequirements(
        "Minimalist architecture portfolio with hero section and feature cards.",
      );

      const motionContext = toNaturalMotionContext(designResult.normalizedContext);
      expect(motionContext.defaultTarget).toBe("#hero");
      expect(motionContext.motionDNA).toBe("minimal");
      expect(motionContext.designSystem).toBe("ds-minimal");

      // Pass directly to Prompt 59
      const motionResult = interpretMotionPrompt("Fade in smoothly", {
        context: motionContext,
      });

      expect(motionResult.success).toBe(true);
      expect(motionResult.specification?.target.selector).toBe("#hero");
      expect(motionResult.specification?.motionDNA).toBe("minimal");
      expect(motionResult.specification?.designSystem).toBe("ds-minimal");
    });
  });

  describe("Context Normalization & Validation", () => {
    it("normalizes empty object to complete default DesignContext", () => {
      const context = normalizeDesignContext({});
      expect(context.version).toBe("1.0.0");
      expect(context.category).toBe("general");
      expect(context.visualDirection.colorMode).toBe("system");
      expect(context.accessibility.respectReducedMotion).toBe(true);
    });

    it("validates valid and invalid design contexts", () => {
      const valid = createDesignContext({ category: "saas", personality: "tech" });
      const validResult = validateDesignContext(valid);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      const invalidResult = validateDesignContext({
        category: "invalid-category-xyz" as any,
        personality: "non-existent" as any,
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it("handles empty natural-language input gracefully", () => {
      const result = interpretDesignRequirements("   ");
      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.warnings).toContain("Empty design prompt provided.");
      expect(result.missingInformation).toContain("category");
    });

    it("produces deterministic output across repeated invocations", () => {
      const prompt = "Dark mode fintech dashboard with bento grid and subtle hover effects.";
      const res1 = interpretDesignRequirements(prompt);
      const res2 = interpretDesignRequirements(prompt);

      expect(res1.confidence).toBe(res2.confidence);
      expect(res1.normalizedContext).toEqual(res2.normalizedContext);
      expect(res1.detectedCharacteristics).toEqual(res2.detectedCharacteristics);
      expect(res1.motionRecommendations).toEqual(res2.motionRecommendations);
    });
  });

  describe("React Integration (useDesignContext & useInterpretDesign)", () => {
    it("provides reactive interpretation via useInterpretDesign", () => {
      const hook = testHook(() =>
        useInterpretDesign("Dark mode SaaS landing page with bento grid."),
      );

      expect(hook.current.success).toBe(true);
      expect(hook.current.normalizedContext.visualDirection.colorMode).toBe("dark");
      expect(hook.current.normalizedContext.layout).toBe("bento");
    });

    it("updates when input changes in useInterpretDesign", () => {
      let prompt = "Dark mode SaaS landing page.";
      const hook = testHook(() => useInterpretDesign(prompt));

      expect(hook.current.normalizedContext.visualDirection.colorMode).toBe("dark");

      prompt = "Light mode minimal portfolio.";
      hook.rerender();

      expect(hook.current.normalizedContext.visualDirection.colorMode).toBe("light");
      expect(hook.current.normalizedContext.personality).toBe("minimal");
    });

    it("memoizes results when input does not change", () => {
      const hook = testHook(() =>
        useInterpretDesign("Dark mode SaaS landing page with bento grid."),
      );

      const first = hook.current;
      hook.rerender();
      const second = hook.current;

      expect(first).toBe(second);
    });

    it("manages state and resets with useDesignContext", () => {
      const hook = testHook(() =>
        useDesignContext({ category: "portfolio", personality: "minimal" }),
      );

      expect(hook.current.context.category).toBe("portfolio");
      expect(hook.current.context.personality).toBe("minimal");

      act(() => {
        hook.current.setContext({ personality: "playful" });
      });

      expect(hook.current.context.personality).toBe("playful");

      act(() => {
        hook.current.reset();
      });

      expect(hook.current.context.personality).toBe("minimal");
    });

    it("renders cleanly in SSR without browser DOM", () => {
      function SSRDesignComponent() {
        const interpretation = useInterpretDesign(
          "Dark mode fintech dashboard with bento grid.",
        );
        return createElement(
          "div",
          {
            "data-category": interpretation.normalizedContext.category,
            "data-colormode": interpretation.normalizedContext.visualDirection.colorMode,
          },
          interpretation.normalizedContext.category,
        );
      }

      const html = renderToString(createElement(SSRDesignComponent));
      expect(html).toContain('data-category="dashboard"');
      expect(html).toContain('data-colormode="dark"');
    });
  });
});
