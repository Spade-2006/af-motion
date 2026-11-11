// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  aiMotionRegistry,
  CORRECTION_ENGINE_VERSION,
  correctConfiguration,
  validateAndCorrectConfiguration,
  correctComposition,
  createComposition,
  addCompositionNode,
  resetCapabilityRegistry,
  type MotionComposition,
  type UnifiedMotionSchema,
} from "../src/catalogue.js";
import {
  useCorrectConfiguration,
  useCorrectComposition,
} from "../src/react.js";

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

describe("Prompt 62 — Configuration Validation & Automatic Correction", () => {
  describe("Engine Setup & Metadata", () => {
    it("exports version and core correction functions", () => {
      expect(CORRECTION_ENGINE_VERSION).toBe("1.0.0");
      expect(typeof correctConfiguration).toBe("function");
      expect(typeof validateAndCorrectConfiguration).toBe("function");
      expect(typeof correctComposition).toBe("function");
    });
  });

  describe("Single Capability Configuration Correction", () => {
    it("accepts a perfectly valid configuration with zero corrections", () => {
      const result = correctConfiguration("preset-fade-in", {
        target: ".card",
        duration: 400,
        easing: "ease-out",
      });

      expect(result.valid).toBe(true);
      expect(result.corrected).toBe(false);
      expect(result.issues.length).toBe(0);
      expect(result.appliedCorrections.length).toBe(0);
      expect(result.report.totalIssues).toBe(0);
      expect(result.correctedConfiguration).toEqual({
        target: ".card",
        duration: 400,
        easing: "ease-out",
      });
    });

    it("handles unknown capability ID safely with unresolvable issue", () => {
      const result = correctConfiguration("non-existent-capability-12345", {
        foo: "bar",
      });

      expect(result.valid).toBe(false);
      expect(result.corrected).toBe(false);
      expect(result.unresolvableIssues.length).toBeGreaterThan(0);
      expect(result.report.unresolvableCount).toBeGreaterThan(0);
    });

    it("handles non-object configuration gracefully", () => {
      const result = correctConfiguration("preset-fade-in", null as unknown as Record<string, unknown>);
      expect(result.valid).toBe(false);
      expect(result.unresolvableIssues.length).toBe(1);
      expect(result.issues[0].rule).toBe("structure");
    });

    it("clamps out-of-range numeric values on built-in capabilities", () => {
      // pointer-magnetic strength has min: 0, max: 1
      const resultMin = correctConfiguration("pointer-magnetic", {
        target: ".btn",
        strength: -0.5,
      });

      expect(resultMin.corrected).toBe(true);
      expect((resultMin.correctedConfiguration as any).strength).toBe(0);
      expect(resultMin.appliedCorrections.some((c) => c.rule === "out_of_range")).toBe(true);

      const resultMax = correctConfiguration("pointer-magnetic", {
        target: ".btn",
        strength: 3.5,
      });

      expect(resultMax.corrected).toBe(true);
      expect((resultMax.correctedConfiguration as any).strength).toBe(1);
      expect(resultMax.appliedCorrections.some((c) => c.rule === "out_of_range")).toBe(true);
    });

    it("clamps values on custom UnifiedMotionSchema objects", () => {
      const customSchema: UnifiedMotionSchema = {
        $id: "custom:schema",
        id: "custom-schema",
        capabilityId: "custom-schema",
        schemaVersion: "1.0.0",
        name: "Custom",
        category: "preset",
        type: "object",
        properties: {
          duration: {
            type: "number",
            minimum: 0,
            maximum: 5000,
          },
        },
      };

      const result = correctConfiguration(customSchema, {
        duration: 12000,
      });

      expect(result.corrected).toBe(true);
      expect((result.correctedConfiguration as any).duration).toBe(5000);
    });

    it("coerces numeric and boolean strings into native types", () => {
      const result = correctConfiguration("preset-fade-in", {
        target: ".box",
        duration: "650",
        yoyo: "true",
      });

      expect(result.corrected).toBe(true);
      expect((result.correctedConfiguration as any).duration).toBe(650);
      expect(typeof (result.correctedConfiguration as any).duration).toBe("number");
      expect((result.correctedConfiguration as any).yoyo).toBe(true);
      expect(typeof (result.correctedConfiguration as any).yoyo).toBe("boolean");
      expect(result.appliedCorrections.some((c) => c.rule === "invalid_type")).toBe(true);
    });

    it("normalizes enum values case-insensitively and delimiter-neutrally", () => {
      // bg-cosmic effect has enum ['nebula', 'starfield', 'warp']
      const result = correctConfiguration("bg-cosmic", {
        target: "#canvas",
        effect: "NEBULA",
      });

      expect(result.corrected).toBe(true);
      expect((result.correctedConfiguration as any).effect).toBe("nebula");
      expect(result.appliedCorrections.some((c) => c.safety === "safe")).toBe(true);
    });

    it("flags completely unrecognized enum values as requiring approval", () => {
      const result = correctConfiguration("bg-cosmic", {
        target: "#canvas",
        effect: "quantum-tornado",
      });

      expect(result.valid).toBe(false);
      expect(result.report.approvalRequiredCount).toBeGreaterThan(0);
      const issue = result.issues.find((i) => i.rule === "invalid_enum");
      expect(issue).toBeDefined();
      expect(issue?.suggestion?.safety).toBe("requires_approval");
    });

    it("populates missing optional/required properties with schema defaults", () => {
      const result = correctConfiguration("bg-cosmic", {
        target: "#canvas",
      });

      // 'effect' has default 'nebula' in defaultConfiguration
      expect((result.correctedConfiguration as any).effect).toBe("nebula");
      expect(result.appliedCorrections.some((c) => c.property === "effect")).toBe(true);
    });

    it("auto-resolves missing target property contextually", () => {
      const result = correctConfiguration("pointer-magnetic", {
        strength: 0.8,
      }, { target: "#hero-btn" });

      expect((result.correctedConfiguration as any).target).toBe("#hero-btn");
      expect(result.appliedCorrections.some((c) => c.property === "target")).toBe(true);
    });

    it("removes unsupported properties when allowUnsupportedRemoval is enabled", () => {
      const withRemoval = correctConfiguration("pointer-magnetic", {
        target: ".card",
        unsupportedPropX: 123,
      }, { allowUnsupportedRemoval: true });

      expect(withRemoval.corrected).toBe(true);
      expect("unsupportedPropX" in withRemoval.correctedConfiguration).toBe(false);
      expect(withRemoval.appliedCorrections.some((c) => c.rule === "unsupported_property")).toBe(true);

      const withoutRemoval = correctConfiguration("pointer-magnetic", {
        target: ".card",
        unsupportedPropX: 123,
      }, { allowUnsupportedRemoval: false });

      expect("unsupportedPropX" in withoutRemoval.correctedConfiguration).toBe(true);
    });

    it("preserves original configuration untouched when strictMode is enabled", () => {
      const original = {
        target: ".box",
        strength: -5.0, // invalid: out of range
      };

      const result = correctConfiguration("pointer-magnetic", original, { strictMode: true });

      expect(result.valid).toBe(false);
      expect(result.corrected).toBe(false);
      expect(result.correctedConfiguration).toEqual(original);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.appliedCorrections.length).toBe(0);
    });

    it("ensures validateAndCorrectConfiguration alias is functional", () => {
      const result = validateAndCorrectConfiguration("pointer-magnetic", {
        target: ".box",
        strength: -1.0,
      });

      expect(result.corrected).toBe(true);
      expect((result.correctedConfiguration as any).strength).toBe(0);
    });
  });

  describe("Composition Correction (correctComposition)", () => {
    it("audits and corrects invalid nodes across an entire MotionComposition tree", () => {
      let comp = createComposition({ name: "Invalid Composition" });
      comp = addCompositionNode(comp, {
        name: "Magnetic Button",
        capabilityId: "pointer-magnetic",
        target: { selector: ".btn" },
        configuration: {
          strength: -0.5, // out of range
        },
      });

      const audit = correctComposition(comp);
      expect(audit.corrected).toBe(true);

      const btnNode = Object.values(audit.correctedComposition.nodes).find(
        (n) => n.name === "Magnetic Button",
      );
      expect(btnNode).toBeDefined();
      expect(btnNode?.configuration?.strength).toBe(0);
      expect(btnNode?.configuration?.target).toBe(".btn");
    });

    it("heals orphaned nodes referencing non-existent parent IDs", () => {
      let comp = createComposition({ name: "Broken Hierarchy" });
      comp = addCompositionNode(comp, {
        name: "Orphan Child",
        capabilityId: "pointer-magnetic",
        target: { selector: ".child" },
        parentId: "non-existent-parent-9999",
      });

      const audit = correctComposition(comp);
      expect(audit.corrected).toBe(true);
      const childNode = Object.values(audit.correctedComposition.nodes).find(
        (n) => n.name === "Orphan Child",
      );
      expect(childNode?.parentId).toBe(comp.rootNodeId);
      expect(audit.compositionIssues.some((i) => i.rule === "missing_dependency")).toBe(true);
    });

    it("respects strictMode in composition correction", () => {
      let comp = createComposition({ name: "Strict Comp" });
      comp = addCompositionNode(comp, {
        name: "Strict Node",
        capabilityId: "pointer-magnetic",
        target: { selector: ".strict" },
        configuration: {
          strength: -9.9,
        },
      });

      const audit = correctComposition(comp, { strictMode: true });
      expect(audit.corrected).toBe(false);
      expect(audit.valid).toBe(false);
      expect(audit.correctedComposition).toEqual(comp);
      expect(audit.report.totalIssues).toBeGreaterThan(0);
    });
  });

  describe("React Integration Hooks", () => {
    it("useCorrectConfiguration reacts to configuration changes", () => {
      let currentConfig: Record<string, unknown> = { target: ".card", duration: "250" };

      const hook = testHook(() =>
        useCorrectConfiguration("preset-fade-in", currentConfig),
      );

      expect(hook.current.corrected).toBe(true);
      expect((hook.current.correctedConfiguration as any).duration).toBe(250);

      // Update to valid number
      act(() => {
        currentConfig = { target: ".card", duration: 500 };
      });
      hook.rerender();

      expect(hook.current.corrected).toBe(false);
      expect((hook.current.correctedConfiguration as any).duration).toBe(500);
    });

    it("useCorrectComposition evaluates compositions reactively", () => {
      let comp = createComposition({ name: "Live Comp" });
      comp = addCompositionNode(comp, {
        name: "Live Node",
        capabilityId: "pointer-magnetic",
        target: { selector: ".live" },
        configuration: { strength: -0.5 },
      });

      const hook = testHook(() => useCorrectComposition(comp));

      expect(hook.current.corrected).toBe(true);
      const fixedNode = Object.values(hook.current.correctedComposition.nodes).find(
        (n) => n.name === "Live Node",
      );
      expect(fixedNode?.configuration?.strength).toBe(0);
    });

    it("supports SSR rendering without errors", () => {
      function SSRComponent() {
        const result = useCorrectConfiguration("preset-fade-in", {
          target: ".ssr",
          duration: "400",
        });
        return createElement("div", { "data-testid": "ssr" }, String(result.corrected));
      }

      const html = renderToString(createElement(SSRComponent));
      expect(html).toContain('data-testid="ssr"');
      expect(html).toContain("true");
    });
  });
});
