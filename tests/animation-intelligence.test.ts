import { describe, it, expect } from "vitest";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import {
  COMPONENT_CATEGORIES,
  MOTION_INTENTS,
  ANIMATION_TRIGGERS,
  classifyMotionIntent,
  recommendAnimation,
  recommendComponentMotion,
  explainAnimationSelection,
  AnimationIntelligenceEngine,
  animationIntelligenceEngine,
  ANIMATION_INTELLIGENCE_CAPABILITY,
  getAvailableComponentCategories,
  getAvailableMotionIntents,
  registerAnimationIntelligenceCapability,
  type AnimationSelectionContext,
  type ComponentCategory,
  type MotionIntent,
} from "../src/catalogue.js";

import {
  useAnimationIntelligence,
  useRecommendedAnimation,
  useAnimationAlternatives,
} from "../src/react.js";

describe("Prompt 82 — AI-Driven Animation Selection", () => {
  describe("1. Component Category Coverage (All 12 Supported Categories)", () => {
    it("provides valid recommendations for every supported component category", () => {
      expect(COMPONENT_CATEGORIES).toHaveLength(12);

      for (const componentType of COMPONENT_CATEGORIES) {
        const result = recommendAnimation({
          componentType,
          intent: "feedback",
        });

        expect(result.selected).toBeDefined();
        expect(result.selected.componentType).toBe(componentType);
        expect(result.selected.family).toBeDefined();
        expect(result.selected.duration).toBeGreaterThan(0);
        expect(result.selected.properties).toBeDefined();
        expect(result.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(result.compatibilityScore).toBeLessThanOrEqual(100);
      }
    });

    it("generates a complete multi-trigger motion plan for components", () => {
      const plan = recommendComponentMotion("button", {
        visualStyle: "skeuomorphism",
        motionDNA: "snappy",
      });

      expect(plan.componentType).toBe("button");
      expect(plan.visualStyle).toBe("skeuomorphism");
      expect(plan.entrance).toBeDefined();
      expect(plan.exit).toBeDefined();
      expect(plan.hover).toBeDefined();
      expect(plan.focus).toBeDefined();
      expect(plan.press).toBeDefined();
      expect(plan.overallCompatibility).toBeGreaterThan(50);
    });
  });

  describe("2. Motion Intent Classification (All 12 Intents)", () => {
    it("recognizes all 12 motion intents via natural language and keywords", () => {
      const testCases: readonly { phrase: string; expectedIntent: MotionIntent }[] = [
        { phrase: "Draw urgent attention to the buy button", expectedIntent: "attention" },
        { phrase: "Tactile click press feedback response", expectedIntent: "feedback" },
        { phrase: "Slide forward to the next navigation route page", expectedIntent: "navigation" },
        { phrase: "Expand dropdown modal disclosure sheet", expectedIntent: "disclosure" },
        { phrase: "Elevate and pop featured focal card with emphasis", expectedIntent: "emphasis" },
        { phrase: "Celebrate achievement trophy burst celebration", expectedIntent: "celebration" },
        { phrase: "Waiting for data with skeleton shimmer loading", expectedIntent: "loading" },
        { phrase: "Advancing through multi-step progress meter", expectedIntent: "progress" },
        { phrase: "Inspect onboarding guide tooltip discovery hint", expectedIntent: "discovery" },
        { phrase: "Morph state change crossfade view transition", expectedIntent: "transition" },
        { phrase: "Cinematic walkthrough chapter storytelling narrative", expectedIntent: "storytelling" },
        { phrase: "Subtle background breathing ambient float aura", expectedIntent: "ambient" },
      ];

      for (const { phrase, expectedIntent } of testCases) {
        const classified = classifyMotionIntent(phrase);
        expect(classified.intent).toBe(expectedIntent);
        expect(classified.confidence).toBeGreaterThan(0.4);
      }
    });

    it("falls back to component semantic defaults when phrase is ambiguous", () => {
      const buttonDefault = classifyMotionIntent({ componentType: "button" });
      expect(buttonDefault.intent).toBe("feedback");
      expect(buttonDefault.inferredFromComponent).toBe(true);

      const navDefault = classifyMotionIntent({ componentType: "navigation" });
      expect(navDefault.intent).toBe("navigation");

      const bgDefault = classifyMotionIntent({ componentType: "background" });
      expect(bgDefault.intent).toBe("ambient");
    });
  });

  describe("3. Deterministic Scoring & Candidate Ranking", () => {
    it("generates deterministic scores and alternatives without variance across repeated calls", () => {
      const context: AnimationSelectionContext = {
        componentType: "card",
        intent: "emphasis",
        visualStyle: "minimal",
        motionDNA: "calm",
      };

      const run1 = recommendAnimation(context);
      const run2 = recommendAnimation(context);

      expect(run1.selected.id).toBe(run2.selected.id);
      expect(run1.compatibilityScore).toBe(run2.compatibilityScore);
      expect(run1.alternatives.length).toBe(run2.alternatives.length);
      expect(run1.selected.duration).toBe(run2.selected.duration);
      expect(run1.selected.easing).toBe(run2.selected.easing);
    });

    it("exposes transparent selection rationales", () => {
      const result = recommendAnimation({
        componentType: "button",
        intent: "feedback",
        visualStyle: "skeuomorphism",
      });

      const rationale = result.selected.selectionRationale;
      expect(rationale.intentMatch).toContain("feedback");
      expect(rationale.componentContext).toContain("button");
      expect(rationale.styleAlignment).toContain("skeuomorphism");
      expect(rationale.summary).toBeDefined();

      const explanation = explainAnimationSelection(result.selected);
      expect(explanation).toContain("### Rationale for");
      expect(explanation).toContain("Score");
    });
  });

  describe("4. Style & Motion DNA Compatibility", () => {
    it("adapts pacing, duration, and easing to Motion DNA personalities", () => {
      const snappyRes = recommendAnimation({
        componentType: "card",
        intent: "disclosure",
        motionDNA: "snappy",
      });

      const calmRes = recommendAnimation({
        componentType: "card",
        intent: "disclosure",
        motionDNA: "calm",
      });

      expect(snappyRes.selected.duration).toBeLessThan(calmRes.selected.duration);
      expect(snappyRes.selected.easing).toBe("easeOutQuad");
      expect(calmRes.selected.easing).toBe("easeInOutSine");
    });

    it("favors tactile elevation in skeuomorphism and bounce in memphis", () => {
      const skeuo = recommendAnimation({
        componentType: "card",
        intent: "emphasis",
        visualStyle: "skeuomorphism",
        trigger: "hover",
      });
      expect(skeuo.selected.family).toBe("lift");

      const memphis = recommendAnimation({
        componentType: "button",
        intent: "celebration",
        visualStyle: "memphis",
      });
      expect(memphis.selected.family).toBe("bounce");
    });
  });

  describe("5. Accessibility & Reduced Motion Handling", () => {
    it("penalizes large displacement and returns safe fallbacks under reduced motion", () => {
      const normal = recommendAnimation({
        componentType: "background",
        intent: "ambient",
        trigger: "continuous",
        reducedMotion: false,
      });

      const reduced = recommendAnimation({
        componentType: "background",
        intent: "ambient",
        trigger: "continuous",
        reducedMotion: true,
      });

      expect(reduced.selected.accessibilityCompatibility.supportsReducedMotion).toBe(true);
      expect(reduced.selected.accessibilityCompatibility.reducedMotionFallback).toBeDefined();
    });
  });

  describe("6. Performance Constraints & Conflict Detection", () => {
    it("penalizes non-composite animations on low hardware tiers", () => {
      const highTier = recommendAnimation({
        componentType: "button",
        intent: "feedback",
        trigger: "hover",
        deviceTier: "high",
      });

      const lowTier = recommendAnimation({
        componentType: "button",
        intent: "feedback",
        trigger: "hover",
        deviceTier: "low",
      });

      expect(highTier.selected.performanceSuitability.hardwareTier).toBe("high");
      expect(lowTier.selected.performanceSuitability.hardwareTier).toBe("low");
    });

    it("flags transform collisions when existingAnimations are provided", () => {
      const result = recommendAnimation({
        componentType: "button",
        intent: "feedback",
        trigger: "press",
        existingAnimations: ["transform: rotate(45deg)"],
      });

      expect(result.conflictWarnings.length).toBeGreaterThan(0);
      expect(result.conflictWarnings[0]).toContain("transform collision");
    });

    it("resolves overlapping property targets across recommendations", () => {
      const engine = new AnimationIntelligenceEngine();
      const rec1 = engine.recommendAnimation({ componentType: "button", intent: "feedback" }).selected;
      const rec2 = engine.recommendAnimation({ componentType: "button", intent: "feedback" }).selected;

      const resolution = engine.resolveAnimationConflicts([rec1, rec2]);
      expect(resolution.resolvedRecommendations).toHaveLength(1);
      expect(resolution.resolvedConflicts.length).toBeGreaterThan(0);
    });
  });

  describe("7. AI Registry Integration & Capability Descriptors", () => {
    it("exposes machine-readable discovery helpers and capability descriptors", () => {
      expect(getAvailableComponentCategories()).toHaveLength(12);
      expect(getAvailableMotionIntents()).toHaveLength(12);
      expect(ANIMATION_INTELLIGENCE_CAPABILITY.id).toBe("animation-intelligence");
      expect(ANIMATION_INTELLIGENCE_CAPABILITY.category).toBe("intelligence");

      const mockRegistry = {
        caps: [] as any[],
        registerCapability(cap: any) {
          this.caps.push(cap);
        },
      };

      registerAnimationIntelligenceCapability(mockRegistry);
      expect(mockRegistry.caps[0].id).toBe("animation-intelligence");
    });
  });

  describe("8. React Integrations (SSR, StrictMode & Hooks)", () => {
    function TestComponent() {
      const { recommend, explain } = useAnimationIntelligence();
      const rec = useRecommendedAnimation({
        componentType: "button",
        intent: "feedback",
      });
      const alts = useAnimationAlternatives({
        componentType: "button",
        intent: "feedback",
      });

      return createElement(
        "div",
        {
          "data-selected-family": rec.selected.family,
          "data-score": rec.compatibilityScore,
          "data-alts-count": alts.length,
        },
        explain(rec.selected)
      );
    }

    it("renders smoothly in SSR without browser globals", () => {
      const html = renderToString(createElement(TestComponent));
      expect(html).toContain('data-selected-family="scale"');
      expect(html).toContain('data-score="');
      expect(html).toContain("Rationale for");
    });

    it("renders under React StrictMode without throwing or leaking", () => {
      const html = renderToString(
        createElement(StrictMode, null, createElement(TestComponent))
      );
      expect(html).toContain('data-selected-family="scale"');
    });
  });
});
