// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import {
  aiMotionIntelligence,
  AIMotionIntelligenceEngine,
  classifyMotionIntent,
  evaluateMotionQuality,
  generateMotionRecommendations,
  updateRecommendationStatus,
  applyAcceptedRecommendations,
  BUILT_IN_MOTION_PATTERNS,
  queryPatternKnowledgeBase,
  generateIntelligenceExplanation,
  DeterministicMotionIntelligenceProvider,
  IntelligenceProviderRegistry,
  defaultIntelligenceRegistry,
  AI_MOTION_INTELLIGENCE_VERSION,
} from "../src/catalogue.js";
import {
  AIMotionIntelligencePanel,
  createDefaultUnifiedCompositionState,
} from "../studio/index.js";

describe("Prompt 141 — Advanced AI Motion Intelligence", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
    aiMotionIntelligence.clearCache();
  });

  describe("1. Specification Version & Provider Architecture", () => {
    it("exports version 1.0.0 and initializes the deterministic provider", () => {
      expect(AI_MOTION_INTELLIGENCE_VERSION).toBe("1.0.0");
      const provider = defaultIntelligenceRegistry.getProvider();
      expect(provider.id).toBe("af-motion-deterministic-ai");
      expect(provider.capabilities).toContain("intent-classification");
      expect(provider.capabilities).toContain("quality-evaluation");
      expect(provider.capabilities).toContain("actionable-recommendations");
    });

    it("supports custom provider registration and listing in registry", () => {
      const registry = new IntelligenceProviderRegistry();
      const mockProvider = {
        id: "mock-custom-ai",
        name: "Mock AI Provider",
        version: "1.0.0",
        capabilities: ["custom-eval"],
        analyze: vi.fn(),
      };

      registry.registerProvider(mockProvider);
      expect(registry.listProviders()).toHaveLength(2); // default + custom
      expect(registry.getProvider("mock-custom-ai").name).toBe("Mock AI Provider");

      // Cannot remove default provider
      expect(registry.unregisterProvider("af-motion-deterministic-ai")).toBe(false);
      // Can remove custom provider
      expect(registry.unregisterProvider("mock-custom-ai")).toBe(true);
      expect(registry.listProviders()).toHaveLength(1);
    });

    it("handles cancellation via AbortSignal cleanly", async () => {
      const provider = new DeterministicMotionIntelligenceProvider();
      const ac = new AbortController();
      ac.abort();

      await expect(
        provider.analyze({ configuration: { duration: 500 } }, { signal: ac.signal })
      ).rejects.toThrow("aborted");
    });

    it("handles timeout options gracefully", async () => {
      const provider = new DeterministicMotionIntelligenceProvider();
      // Set an impossibly short timeout of 0ms with a delayed spy
      await expect(
        provider.analyze({ configuration: { duration: 500 } }, { timeoutMs: 0 })
      ).rejects.toThrow(/timed out/i);
    });
  });

  describe("2. Motion Intent Classification", () => {
    it("accurately classifies entrance animations with high confidence", () => {
      const result = classifyMotionIntent({
        configuration: {
          trigger: "entrance",
          properties: { opacity: [0, 1], translateY: [20, 0] },
          duration: 500,
        },
      });

      expect(result.primaryIntent).toBe("entrance");
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.signals.length).toBeGreaterThanOrEqual(2);
      expect(result.explanation).toContain("entrance");
    });

    it("accurately classifies departure / exit animations", () => {
      const result = classifyMotionIntent({
        configuration: {
          trigger: "exit",
          properties: { opacity: [1, 0], scale: [1, 0.9] },
          duration: 350,
        },
      });

      expect(result.primaryIntent).toBe("exit");
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it("classifies tactile feedback microinteractions (< 250ms press/click)", () => {
      const result = classifyMotionIntent({
        configuration: {
          trigger: "press",
          duration: 180,
          properties: { scale: [1, 0.96, 1] },
        },
      });

      expect(result.primaryIntent).toBe("feedback");
      expect(result.confidence).toBeGreaterThan(0.65);
    });

    it("distinguishes infinite ambient drift from rapid attention grabbers", () => {
      // Rapid attention loop
      const attention = classifyMotionIntent({
        configuration: {
          iterations: "infinite",
          duration: 400,
          properties: { scale: [1, 1.1, 1] },
        },
      });
      expect(attention.primaryIntent).toBe("attention");

      // Slow ambient loop
      const ambient = classifyMotionIntent({
        configuration: {
          iterations: "infinite",
          duration: 3000,
          properties: { opacity: [0.3, 0.7, 0.3] },
        },
      });
      expect(ambient.primaryIntent).toBe("ambient");
    });

    it("classifies GPU particle & physics simulations", () => {
      const result = classifyMotionIntent({
        configuration: {
          particleCount: 5000,
          emitter: "cone",
        },
      });

      expect(result.primaryIntent).toBe("simulation");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("classifies SVG topological path morphing", () => {
      const result = classifyMotionIntent({
        configuration: {
          morph: true,
          d: "M 0 0 L 100 100",
        },
      });

      expect(result.primaryIntent).toBe("morphing");
    });

    it("classifies continuous pointer / magnetic interactions", () => {
      const result = classifyMotionIntent({
        configuration: {
          trigger: "pointer",
          magnetic: true,
        },
      });

      expect(result.primaryIntent).toBe("interaction");
    });
  });

  describe("3. Multi-Dimensional Quality Evaluation & Anomaly Detection", () => {
    it("flags layout thrashing properties and severely penalizes performance score", () => {
      const evaluation = evaluateMotionQuality({
        configuration: {
          properties: { width: "200px", height: "100px", top: "10px" },
          duration: 500,
        },
      });

      expect(evaluation.scores.performance).toBeLessThan(70);
      const layoutFindings = evaluation.findings.filter((f) => f.category === "performance");
      expect(layoutFindings.length).toBeGreaterThanOrEqual(2);
      expect(layoutFindings.some((f) => f.id.includes("layout-thrash-top"))).toBe(true);
      expect(layoutFindings.some((f) => f.severity === "critical")).toBe(true);
    });

    it("flags unnatural linear velocity curves on UI transitions", () => {
      const evaluation = evaluateMotionQuality({
        configuration: {
          trigger: "entrance",
          easing: "linear",
          duration: 600,
        },
      });

      expect(evaluation.scores.easing).toBeLessThan(70);
      expect(evaluation.findings.some((f) => f.id === "easing-linear-entrance")).toBe(true);
    });

    it("penalizes unhandled continuous motion when reduced-motion preference is ignored", () => {
      const evaluation = evaluateMotionQuality({
        configuration: {
          iterations: "infinite",
          duration: 1200,
          respectReducedMotion: false,
        },
        reducedMotion: false,
      });

      expect(evaluation.scores.accessibility).toBeLessThan(70);
      expect(evaluation.findings.some((f) => f.id === "a11y-reduced-motion-unhandled")).toBe(true);
    });

    it("flags photosensitive seizure risk on rapid continuous flashing (> 3Hz)", () => {
      const evaluation = evaluateMotionQuality({
        configuration: {
          trigger: "attention",
          iterations: "infinite",
          duration: 120, // > 8Hz strobe
        },
      });

      expect(evaluation.scores.accessibility).toBeLessThan(50);
      expect(evaluation.findings.some((f) => f.id === "a11y-seizure-risk-strobe")).toBe(true);
      expect(evaluation.grade).toMatch(/C|D|F/);
    });

    it("rewards fully compliant, GPU-accelerated motion with A+ grade", () => {
      const evaluation = evaluateMotionQuality({
        configuration: {
          trigger: "entrance",
          properties: { opacity: [0, 1], scale: [0.95, 1] },
          duration: 400,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          respectReducedMotion: true,
        },
        reducedMotion: true,
      });

      expect(evaluation.scores.overall).toBeGreaterThanOrEqual(90);
      expect(evaluation.grade).toMatch(/A\+?|A/);
      expect(evaluation.findings).toHaveLength(0);
    });
  });

  describe("4. Intelligent Actionable Recommendations Lifecycle", () => {
    it("generates evidence-based recommendations mapping layout properties to GPU transforms", () => {
      const evaluation = evaluateMotionQuality({
        configuration: {
          top: "40px",
          easing: "linear",
          respectReducedMotion: false,
          duration: 2500,
        },
      });

      const recs = generateMotionRecommendations(
        { configuration: { top: "40px", easing: "linear", duration: 2500 } },
        evaluation.findings
      );

      expect(recs.length).toBeGreaterThanOrEqual(3);

      // Check transform recommendation
      const transformRec = recs.find((r) => r.category === "performance");
      expect(transformRec).toBeDefined();
      expect(transformRec?.title).toContain("Replace Layout Property");
      expect(transformRec?.suggestedValue).toBe("20px");
      expect(transformRec?.expectedBenefit).toContain("layout thrashing");

      // Check easing recommendation
      const easingRec = recs.find((r) => r.category === "easing");
      expect(easingRec).toBeDefined();
      expect(easingRec?.suggestedValue).toBe("cubic-bezier(0.16, 1, 0.3, 1)");

      // Check duration recommendation
      const durationRec = recs.find((r) => r.category === "timing");
      expect(durationRec).toBeDefined();
      expect(durationRec?.suggestedValue).toBe(450);
    });

    it("immutably updates recommendation status between pending, accepted, and rejected", () => {
      const evaluation = evaluateMotionQuality({
        configuration: { duration: 3000 },
      });
      const recs = generateMotionRecommendations({ configuration: { duration: 3000 } }, evaluation.findings);

      expect(recs[0].status).toBe("pending");

      const accepted = updateRecommendationStatus(recs, recs[0].id, "accepted");
      expect(accepted[0].status).toBe("accepted");
      // Original remains unmutated
      expect(recs[0].status).toBe("pending");

      const rejected = updateRecommendationStatus(recs, recs[0].id, "rejected");
      expect(rejected[0].status).toBe("rejected");
    });

    it("applies accepted patches to configuration without mutating unapproved fields", () => {
      let config = {
        name: "My Component",
        duration: 3500,
        easing: "linear",
      };

      const evaluation = evaluateMotionQuality({ configuration: config });
      let recs = generateMotionRecommendations({ configuration: config }, evaluation.findings);

      // Accept duration fix only
      const durationRecId = recs.find((r) => r.category === "timing")!.id;
      recs = updateRecommendationStatus(recs, durationRecId, "accepted");

      const patched = applyAcceptedRecommendations(config, recs);

      expect(patched.duration).toBe(450); // Patched
      expect(patched.easing).toBe("linear"); // Untouched (not accepted)
      expect(patched.name).toBe("My Component"); // Preserved
    });
  });

  describe("5. Motion Pattern Knowledge Base & Explainability", () => {
    it("provides validated patterns across modal, tactile button, scroll, cursor, and particle contexts", () => {
      expect(BUILT_IN_MOTION_PATTERNS.length).toBeGreaterThanOrEqual(6);

      const modalPattern = BUILT_IN_MOTION_PATTERNS.find((p) => p.id === "pat-premium-modal-entrance");
      expect(modalPattern).toBeDefined();
      expect(modalPattern?.intent).toBe("entrance");
      expect(modalPattern?.timing.duration).toBeLessThan(500);
      expect(modalPattern?.accessibilityConsiderations).toContain("prefers-reduced-motion");
    });

    it("queries pattern knowledge base by intent and context", () => {
      const buttonPatterns = queryPatternKnowledgeBase("feedback", "button");
      expect(buttonPatterns.length).toBeGreaterThan(0);
      expect(buttonPatterns[0].name).toContain("Button Press");
    });

    it("generates structured natural language and technical evidence explanations", () => {
      const intents = classifyMotionIntent({
        configuration: { trigger: "entrance", properties: { opacity: 0 } },
      });
      const quality = evaluateMotionQuality({
        configuration: { easing: "linear" },
      });
      const recs = generateMotionRecommendations({ configuration: { easing: "linear" } }, quality.findings);

      const explanation = generateIntelligenceExplanation(intents, quality, recs);

      expect(explanation.summary).toContain("Motion identified as");
      expect(explanation.intentRationale.length).toBeGreaterThan(0);
      expect(explanation.qualityRationale.length).toBeGreaterThan(0);
      expect(explanation.keySignals.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("6. AIMotionIntelligenceEngine Orchestration & Caching", () => {
    it("runs complete end-to-end analysis and caches subsequent identical queries", async () => {
      const engine = new AIMotionIntelligenceEngine();
      const input = {
        id: "comp-hero",
        name: "Hero Section",
        configuration: { duration: 600, easing: "easeOut" },
      };

      const result1 = await engine.analyzeMotion(input);
      expect(result1.targetId).toBe("comp-hero");
      expect(result1.telemetry.cached).toBe(false);

      const result2 = await engine.analyzeMotion(input);
      expect(result2.telemetry.cached).toBe(true);

      // Skip cache option forces fresh evaluation
      const result3 = await engine.analyzeMotion(input, { skipCache: true });
      expect(result3.telemetry.cached).toBe(false);
    });

    it("exposes synchronous helper methods on the engine singleton", async () => {
      const input = { configuration: { trigger: "press", duration: 180 } };
      const intent = await aiMotionIntelligence.classifyIntent(input);
      expect(intent.primaryIntent).toBe("feedback");

      const quality = await aiMotionIntelligence.evaluateQuality(input);
      expect(quality.scores.overall).toBeGreaterThanOrEqual(80);
    });
  });

  describe("7. Studio Unified Playground Integration", () => {
    it("renders AIMotionIntelligencePanel and displays intent, scores, and recommendations", async () => {
      const state = createDefaultUnifiedCompositionState();
      const onChange = vi.fn();
      const root = createRoot(container);

      await act(async () => {
        root.render(
          React.createElement(AIMotionIntelligencePanel, { state, onChange })
        );
      });

      // Verify header rendered
      expect(container.textContent).toContain("AI Motion Intelligence");
      expect(container.textContent).toContain("Motion Intent Classification");
      expect(container.textContent).toContain("Motion Quality Evaluation");

      // Verify Reanalyze button is present
      const reanalyzeBtn = container.querySelector("button");
      expect(reanalyzeBtn).not.toBeNull();

      act(() => {
        root.unmount();
      });
    });
  });
});
