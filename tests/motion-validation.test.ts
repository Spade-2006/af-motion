import { describe, it, expect, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import {
  MOTION_VALIDATION_VERSION,
  MOTION_VALIDATION_CAPABILITY,
  validateMotionConfig,
  optimizeMotion,
  evaluateMotionConsistency,
  getMotionValidationCapability,
  registerMotionValidationCapability,
} from "../src/catalogue.js";

import {
  useValidateMotion,
  useOptimizeMotion,
  useMotionAccessibility,
  useMotionConsistency,
  MotionDiagnostics,
} from "../src/react.js";

describe("Prompt 87 — Motion Optimization, Accessibility & Consistency Validation", () => {
  describe("1. Unified Motion Validation", () => {
    it("detects layout-triggering properties and recommends GPU-accelerated transforms", () => {
      const config = {
        duration: 300,
        properties: {
          top: "50px",
          left: "20px",
          width: "100%",
          padding: "10px",
        },
      };

      const result = validateMotionConfig(config);
      expect(result.valid).toBe(true); // Warnings do not invalidate configuration
      expect(result.performanceScore).toBeLessThan(100);

      const layoutIssues = result.issues.filter((i) => i.category === "layout-thrashing");
      expect(layoutIssues.length).toBeGreaterThanOrEqual(3);
      expect(layoutIssues.some((i) => i.property === "top")).toBe(true);
      expect(layoutIssues.some((i) => i.property === "left")).toBe(true);
      expect(layoutIssues.every((i) => i.autoFixable)).toBe(true);
    });

    it("detects expensive CSS blur filters exceeding mobile fill-rate thresholds", () => {
      const config = {
        duration: 400,
        properties: {
          filter: "blur(32px)",
        },
      };

      const result = validateMotionConfig(config);
      expect(result.performanceScore).toBeLessThan(100);
      const blurIssue = result.issues.find((i) => i.category === "expensive-filter");
      expect(blurIssue).toBeDefined();
      expect(blurIssue?.message).toContain("32px");
    });

    it("detects photo-epileptic seizure risks under WCAG 2.3.1 three-flashes threshold", () => {
      const flashingConfig = {
        duration: 60, // 60ms oscillation = ~16.6 flashes per second (violates 3 flashes/sec)
        repeat: 10,
        properties: {
          opacity: [0, 1],
        },
      };

      const result = validateMotionConfig(flashingConfig);
      expect(result.valid).toBe(false); // Seizure risk is a blocking error
      expect(result.accessibilityScore).toBeLessThan(80);

      const seizureIssue = result.issues.find((i) => i.category === "seizure-risk");
      expect(seizureIssue).toBeDefined();
      expect(seizureIssue?.severity).toBe("error");
      expect(seizureIssue?.suggestedFix).toContain("333ms");
    });

    it("detects reduced-motion violations and large movement displacement without fallbacks", () => {
      const invalidReduced = {
        duration: 400,
        respectReducedMotion: false,
        properties: {
          opacity: [0, 1],
        },
      };

      const res1 = validateMotionConfig(invalidReduced);
      expect(res1.valid).toBe(false);
      expect(res1.issues.some((i) => i.category === "reduced-motion-violation")).toBe(true);

      const largeDisplacement = {
        duration: 800,
        properties: {
          transform: ["translateY(600px)", "translateY(0px)"],
        },
      };

      const res2 = validateMotionConfig(largeDisplacement);
      expect(res2.issues.some((i) => i.category === "accessibility-risk")).toBe(true);
    });

    it("detects contradictions with Motion DNA timing expectations", () => {
      const snappySlow = {
        motionDNA: "snappy",
        duration: 1500, // snappy should be <= 400ms
        properties: {
          opacity: [0, 1],
        },
      };

      const result = validateMotionConfig(snappySlow);
      expect(result.consistencyScore).toBeLessThan(100);
      expect(result.issues.some((i) => i.category === "dna-contradiction")).toBe(true);
    });

    it("handles null and non-object inputs gracefully", () => {
      const nullResult = validateMotionConfig(null);
      expect(nullResult.valid).toBe(false);
      expect(nullResult.score).toBe(0);

      const strResult = validateMotionConfig("invalid" as any);
      expect(strResult.valid).toBe(false);
    });
  });

  describe("2. Motion Performance & Accessibility Optimizer", () => {
    it("safely transforms layout-triggering properties to GPU transforms without mutating original", () => {
      const original = {
        duration: 400,
        properties: {
          top: "40px",
          left: "20px",
        },
      };

      const result = optimizeMotion(original, { level: "safe" });

      // Verify immutability
      expect(original.properties.top).toBe("40px");
      expect(original.properties.left).toBe("20px");

      // Verify optimization
      expect(result.optimizedConfig.properties.top).toBeUndefined();
      expect(result.optimizedConfig.properties.left).toBeUndefined();
      expect(result.optimizedConfig.properties.transform).toBeDefined();
      expect(result.appliedOptimizations.length).toBeGreaterThan(0);
      expect(result.validationAfter.performanceScore).toBeGreaterThan(result.validationBefore.performanceScore);
    });

    it("mitigates seizure risks and ensures reduced-motion compliance in safe mode", () => {
      const hazardous = {
        duration: 50,
        repeat: 5,
        respectReducedMotion: false,
        properties: { opacity: [0, 1] },
      };

      const result = optimizeMotion(hazardous, { level: "safe" });
      expect(result.optimizedConfig.respectReducedMotion).toBe(true);
      expect(result.optimizedConfig.duration).toBeGreaterThanOrEqual(333);
      expect(result.validationAfter.valid).toBe(true);
      expect(result.validationAfter.accessibilityScore).toBe(100);
    });

    it("dampens blur filters and normalizes excessive durations in balanced mode", () => {
      const heavy = {
        duration: 4500,
        properties: {
          filter: "blur(30px)",
        },
      };

      const result = optimizeMotion(heavy, { level: "balanced" });
      expect(result.optimizedConfig.duration).toBe(1200);
      expect(result.optimizedConfig.properties.filter).toBe("blur(12px)");
      expect(result.remainingTradeoffs.length).toBeGreaterThan(0);
    });

    it("strips heavy filters and clamps duration aggressively in aggressive mode", () => {
      const aggressiveTarget = {
        duration: 1000,
        properties: {
          filter: "blur(18px)",
          transform: ["scale(0.8)", "scale(1)"],
        },
      };

      const result = optimizeMotion(aggressiveTarget, { level: "aggressive" });
      expect(result.optimizedConfig.duration).toBe(300);
      expect(result.optimizedConfig.properties.filter).toBeUndefined();
      expect(result.optimizedConfig.properties.transform).toBeDefined();
    });
  });

  describe("3. Consistency Intelligence Engine", () => {
    it("evaluates harmony across multiple disparate motion configurations", () => {
      const configs = [
        { id: "c1", duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)", motionDNA: "snappy" },
        { id: "c2", duration: 300, easing: "cubic-bezier(0.2, 0, 0, 1)", motionDNA: "snappy" },
      ];

      const report = evaluateMotionConsistency(configs);
      expect(report.consistencyScore).toBe(100);
      expect(report.easingAligned).toBe(true);
      expect(report.dnaAligned).toBe(true);
      expect(report.durationHarmonic).toBe(true);
    });

    it("identifies conflicting easings and clashing Motion DNA profiles", () => {
      const clashingConfigs = [
        { id: "c1", duration: 150, easing: "ease-out", motionDNA: "snappy" },
        { id: "c2", duration: 1200, easing: "steps(4, jump-end)", motionDNA: "calm" },
        { id: "c3", duration: 600, easing: "easeInOutCubic", motionDNA: "editorial-flow" },
      ];

      const report = evaluateMotionConsistency(clashingConfigs);
      expect(report.consistencyScore).toBeLessThan(80);
      expect(report.easingAligned).toBe(false);
      expect(report.dnaAligned).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("4. React 18/19 Integrations (SSR & StrictMode)", () => {
    it("renders <MotionDiagnostics /> under SSR with health and issue metadata", () => {
      const sampleConfig = {
        duration: 400,
        properties: { opacity: [0, 1] },
      };

      const html = renderToString(
        createElement(
          MotionDiagnostics,
          {
            config: sampleConfig,
            className: "diag-panel",
          },
          "Diagnostics Active"
        )
      );

      expect(html).toContain("diag-panel");
      expect(html).toContain("data-motion-diagnostics=\"true\"");
      expect(html).toContain("data-motion-valid=\"true\"");
      expect(html).toContain("data-motion-health=\"100\"");
      expect(html).toContain("Diagnostics Active");
    });

    it("supports child render prop in <MotionDiagnostics />", () => {
      const sampleConfig = {
        duration: 300,
        properties: { opacity: [0, 1] },
      };

      const html = renderToString(
        createElement(
          MotionDiagnostics,
          { config: sampleConfig },
          (validation) => createElement("span", null, `Health: ${validation.score}`)
        )
      );

      expect(html).toContain("Health: 100");
    });

    it("renders inside React StrictMode without throwing or leaking", () => {
      const html = renderToString(
        createElement(
          StrictMode,
          null,
          createElement(MotionDiagnostics, { config: { duration: 300 } }, "Strict Diagnostics")
        )
      );

      expect(html).toContain("Strict Diagnostics");
    });
  });

  describe("5. AI Capabilities & Registry Discovery", () => {
    it("exports version and capability specifications", () => {
      expect(MOTION_VALIDATION_VERSION).toBe("1.0.0");
      const cap = getMotionValidationCapability();
      expect(cap.id).toBe("motion-validation");
      expect(cap.category).toBe("optimization");
      expect(cap.features.length).toBeGreaterThan(0);
      expect(MOTION_VALIDATION_CAPABILITY).toEqual(cap);
    });

    it("registers capability cleanly with AI Motion Registry", () => {
      const mockRegistry = { registerCapability: vi.fn() };
      registerMotionValidationCapability(mockRegistry);
      expect(mockRegistry.registerCapability).toHaveBeenCalledWith(
        MOTION_VALIDATION_CAPABILITY,
        { override: true }
      );
    });
  });
});
