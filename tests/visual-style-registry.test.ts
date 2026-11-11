// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  VISUAL_STYLE_SCHEMA_SPEC_VERSION,
  visualStyleRegistry,
  createVisualStyleRegistry,
  checkStyleCompatibility,
  resolveVisualStyle,
  validateVisualStyleDefinition,
  createVisualStyleSchema,
  type VisualStyleDefinition,
} from "../src/catalogue.js";
import {
  useVisualStyles,
  useVisualStyle,
  useResolveVisualStyle,
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
  visualStyleRegistry.reset();
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

describe("Prompt 64 — Visual Style Registry & Schema Foundation", () => {
  describe("19 Foundation Visual Styles", () => {
    const EXPECTED_19_STYLES = [
      "skeuomorphism",
      "neumorphism",
      "art-nouveau",
      "liquid-chrome",
      "de-stijl",
      "memphis",
      "psychedelic",
      "vaporwave",
      "steampunk",
      "grunge",
      "paper-cutout",
      "glitch",
      "anti-design",
      "3d-inflated",
      "isometric",
      "ukiyo-e",
      "brutalism",
      "bauhaus",
      "mid-century-modern",
    ];

    it("registers exactly 19 foundation styles on initialization", () => {
      expect(visualStyleRegistry.count()).toBe(19);
      const styles = visualStyleRegistry.listVisualStyles();
      const ids = styles.map((s) => s.id);
      expect(ids.sort()).toEqual([...EXPECTED_19_STYLES].sort());
    });

    it("ensures every built-in style passes comprehensive schema validation", () => {
      const styles = visualStyleRegistry.listVisualStyles();
      for (const style of styles) {
        const val = validateVisualStyleDefinition(style);
        expect(val.valid, `Style ${style.id} failed validation: ${val.errors.join(", ")}`).toBe(true);
        expect(val.errors).toHaveLength(0);
        expect(style.recommendedPalettes.length).toBeGreaterThan(0);
        expect(style.motion.compatibleMotionDNA.length).toBeGreaterThan(0);
      }
    });

    it("validates specific architectural tenets for representative styles", () => {
      const brutalism = visualStyleRegistry.getVisualStyle("brutalism");
      expect(brutalism).toBeDefined();
      expect(brutalism?.category).toBe("modernist");
      expect(brutalism?.shapeLanguage.cornerRadius).toBe("0px");
      expect(brutalism?.lighting.shadowStyle).toBe("hard");

      const neumorphism = visualStyleRegistry.getVisualStyle("neumorphism");
      expect(neumorphism).toBeDefined();
      expect(neumorphism?.category).toBe("skeuomorphic");
      expect(neumorphism?.lighting.shadowStyle).toBe("layered");
      expect(neumorphism?.lighting.lightSource).toBe("top-left");

      const liquidChrome = visualStyleRegistry.getVisualStyle("liquid-chrome");
      expect(liquidChrome).toBeDefined();
      expect(liquidChrome?.category).toBe("dimensional");
      expect(liquidChrome?.threeDCompatibility.materialReflectivity).toBeGreaterThan(0.8);
    });
  });

  describe("Registry Operations & Queries", () => {
    it("retrieves visual style by ID", () => {
      const style = visualStyleRegistry.getVisualStyle("bauhaus");
      expect(style).toBeDefined();
      expect(style?.name).toBe("Bauhaus");
      expect(visualStyleRegistry.hasVisualStyle("bauhaus")).toBe(true);
      expect(visualStyleRegistry.hasVisualStyle("non-existent-style")).toBe(false);
    });

    it("filters styles by category", () => {
      const modernist = visualStyleRegistry.listVisualStyles({ category: "modernist" });
      const ids = modernist.map((s) => s.id);
      expect(ids).toContain("de-stijl");
      expect(ids).toContain("brutalism");
      expect(ids).toContain("bauhaus");
      expect(ids).not.toContain("memphis");
    });

    it("filters styles by Motion DNA", () => {
      const cinematicStyles = visualStyleRegistry.listVisualStyles({ motionDNA: "dna-cinematic" });
      const ids = cinematicStyles.map((s) => s.id);
      expect(ids).toContain("skeuomorphism");
      expect(ids).toContain("liquid-chrome");
      expect(ids).toContain("vaporwave");
    });

    it("searches styles across name, description, and keywords", () => {
      const neonMatches = visualStyleRegistry.searchVisualStyles("neon");
      const ids = neonMatches.map((s) => s.id);
      expect(ids).toContain("vaporwave");

      const tactileMatches = visualStyleRegistry.searchVisualStyles("tactile");
      const tactileIds = tactileMatches.map((s) => s.id);
      expect(tactileIds).toContain("skeuomorphism");
      expect(tactileIds).toContain("paper-cutout");
    });
  });

  describe("Custom Style Registration & Protection", () => {
    it("protects built-in styles against accidental deletion or overwrite", () => {
      expect(visualStyleRegistry.unregisterVisualStyle("bauhaus")).toBe(false);
      expect(visualStyleRegistry.hasVisualStyle("bauhaus")).toBe(true);

      const duplicate: VisualStyleDefinition = {
        ...visualStyleRegistry.getVisualStyle("bauhaus")!,
        name: "Fake Bauhaus",
      };

      expect(() => visualStyleRegistry.registerVisualStyle(duplicate)).toThrow(
        /is a built-in style/,
      );
    });

    it("allows registering and unregistering custom visual styles", () => {
      const customStyle: VisualStyleDefinition = {
        ...visualStyleRegistry.getVisualStyle("bauhaus")!,
        id: "custom-nordic-minimal",
        name: "Nordic Minimal",
        category: "minimal",
        personality: ["calm", "airy", "pale"],
      };

      visualStyleRegistry.registerCustomVisualStyle(customStyle);
      expect(visualStyleRegistry.hasVisualStyle("custom-nordic-minimal")).toBe(true);
      expect(visualStyleRegistry.count()).toBe(20);

      const removed = visualStyleRegistry.unregisterVisualStyle("custom-nordic-minimal");
      expect(removed).toBe(true);
      expect(visualStyleRegistry.hasVisualStyle("custom-nordic-minimal")).toBe(false);
      expect(visualStyleRegistry.count()).toBe(19);
    });
  });

  describe("Schema Infrastructure & JSON Serialization", () => {
    it("creates a unified schema definition for visual styles", () => {
      expect(VISUAL_STYLE_SCHEMA_SPEC_VERSION).toBe("1.0.0");
      const schema = createVisualStyleSchema();
      expect(schema.id).toBe("comp-visual-style");
      expect(schema.category).toBe("composition");
      expect(schema.properties.typography).toBeDefined();
      expect(schema.properties.shapeLanguage).toBeDefined();
    });

    it("exports and imports visual styles to and from JSON cleanly", () => {
      const exportedJson = visualStyleRegistry.exportVisualStylesJson({ pretty: true });
      expect(exportedJson).toContain('"id": "skeuomorphism"');

      const tempRegistry = createVisualStyleRegistry([]);
      expect(tempRegistry.count()).toBe(0);

      const importResult = tempRegistry.importVisualStylesFromJson(exportedJson, { override: true });
      expect(importResult.imported).toBe(19);
      expect(importResult.errors).toHaveLength(0);
      expect(tempRegistry.count()).toBe(19);
    });
  });

  describe("Style Compatibility Engine", () => {
    it("reports strong compatibility for harmonious pairings", () => {
      const report = checkStyleCompatibility("brutalism", {
        paletteName: "Primary Pop",
        motionDNA: "dna-snappy",
        backgroundCapability: "bg-grid",
      });

      expect(report.compatible).toBe(true);
      expect(report.score).toBeGreaterThanOrEqual(0.8);
      expect(report.conflicts.filter((c) => c.severity === "error")).toHaveLength(0);
    });

    it("detects and flags incompatible palettes and motion DNA with constructive recommendations", () => {
      const report = checkStyleCompatibility("de-stijl", {
        paletteName: "Pastel Dream Nonexistent",
        motionDNA: "dna-playful",
        backgroundCapability: "bg-cosmic",
      });

      expect(report.conflicts.length).toBeGreaterThan(0);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.suggestedPalettes).toContain("Primary Pop");
      expect(report.suggestedMotionDNA).toContain("dna-snappy");
    });

    it("handles unknown visual style gracefully in compatibility checks", () => {
      const report = checkStyleCompatibility("imaginary-style-xyz");
      expect(report.compatible).toBe(false);
      expect(report.score).toBe(0);
      expect(report.conflicts[0].severity).toBe("error");
    });
  });

  describe("Style Resolution Engine", () => {
    it("resolves a visual style into normalized tokens and CSS variables", () => {
      const resolved = resolveVisualStyle("vaporwave");
      expect(resolved).toBeDefined();
      expect(resolved?.styleName).toBe("Vaporwave");
      expect(resolved?.category).toBe("retro");
      expect(resolved?.cssVariables["--af-style-vaporwave-corner-radius"]).toBe("4px");
      expect(resolved?.cssVariables["--af-vapor-pink"]).toBe("#FF71CE");
      expect(resolved?.components.buttonTreatment.borderRadius).toBe("2px");
    });

    it("applies custom overrides when resolving visual styles", () => {
      const resolved = resolveVisualStyle("bauhaus", {
        shapeLanguage: {
          cornerRadius: "8px",
          borderWidth: "4px",
          borderStyle: "dashed",
          geometricTendency: "sharp",
        },
      });

      expect(resolved).toBeDefined();
      expect(resolved?.shapeLanguage.cornerRadius).toBe("8px");
      expect(resolved?.shapeLanguage.borderStyle).toBe("dashed");
    });
  });

  describe("React Integration Hooks", () => {
    it("useVisualStyles returns reactive list of styles", () => {
      const hook = testHook(() => useVisualStyles({ category: "modernist" }));
      expect(hook.current.length).toBeGreaterThanOrEqual(3);
      const ids = hook.current.map((s) => s.id);
      expect(ids).toContain("brutalism");
      expect(ids).toContain("bauhaus");
    });

    it("useVisualStyle retrieves single style reactively", () => {
      const hook = testHook(() => useVisualStyle("liquid-chrome"));
      expect(hook.current).toBeDefined();
      expect(hook.current?.name).toBe("Liquid Chrome");
    });

    it("useResolveVisualStyle produces normalized resolved style", () => {
      const hook = testHook(() => useResolveVisualStyle("memphis"));
      expect(hook.current).toBeDefined();
      expect(hook.current?.styleId).toBe("memphis");
      expect(hook.current?.cssVariables["--af-style-memphis-corner-radius"]).toBe("12px");
    });

    it("renders cleanly in SSR without errors", () => {
      function SSRTestComponent() {
        const styles = useVisualStyles();
        return createElement("div", { "data-testid": "styles-count" }, String(styles.length));
      }

      const html = renderToString(createElement(SSRTestComponent));
      expect(html).toContain('data-testid="styles-count"');
      expect(html).toContain("19");
    });
  });
});
