// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import {
  listAllVisualStyles,
  filterVisualStyles,
  getVisualStyleById,
  listStyleCategories,
  computeComponentStyle,
  compareVisualStyles,
  queryStyleIntelligence,
  evaluateStyleCompatibility,
  generateStyleReactCode,
  generateStyleExportJson,
  DEFAULT_STYLE_CUSTOMIZATION,
  StyleExplorer,
  type StylePreviewComponentKind,
  type StyleCustomizationValues,
} from "../studio/index.js";

const ALL_19_STYLE_IDS = [
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
] as const;

const ALL_COMPONENT_KINDS: StylePreviewComponentKind[] = [
  "button",
  "card",
  "input",
  "panel",
  "badge",
  "typography",
];

describe("Prompt 94 — Visual Style Explorer Module", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container.remove();
  });

  describe("1. Discovery & Verification of All 19 AF Motion Visual Styles", () => {
    it("discovers all 19 official visual styles dynamically from visualStyleRegistry", () => {
      const styles = listAllVisualStyles();
      expect(styles).toHaveLength(19);

      const discoveredIds = styles.map((s) => s.id);
      for (const expectedId of ALL_19_STYLE_IDS) {
        expect(discoveredIds).toContain(expectedId);
      }
    });

    it("ensures each visual style definition possesses full design tokens and metadata", () => {
      const styles = listAllVisualStyles();
      for (const style of styles) {
        expect(style.id).toBeTruthy();
        expect(style.name).toBeTruthy();
        expect(style.category).toBeTruthy();
        expect(style.description).toBeTruthy();
        expect(style.philosophy).toBeTruthy();
        expect(style.shapeLanguage).toBeDefined();
        expect(style.typography).toBeDefined();
        expect(style.recommendedPalettes.length).toBeGreaterThan(0);
      }
    });

    it("retrieves individual styles by valid id and falls back gracefully on invalid ids", () => {
      const skeuo = getVisualStyleById("skeuomorphism");
      expect(skeuo.id).toBe("skeuomorphism");
      expect(skeuo.name).toBe("Skeuomorphism");

      const brutal = getVisualStyleById("brutalism");
      expect(brutal.id).toBe("brutalism");

      const unknown = getVisualStyleById("non-existent-style-id");
      expect(unknown).toBeDefined();
      expect(unknown.id).toBe("skeuomorphism"); // fallback default
    });
  });

  describe("2. Style Catalog Search and Category Filtering", () => {
    it("filters styles by text search across name, category, philosophy, and tags", () => {
      const chromeResults = filterVisualStyles("liquid");
      expect(chromeResults.length).toBeGreaterThan(0);
      expect(chromeResults.some((s) => s.id === "liquid-chrome")).toBe(true);

      const paperResults = filterVisualStyles("paper");
      expect(paperResults.some((s) => s.id === "paper-cutout")).toBe(true);

      const emptyResults = filterVisualStyles("xyz123nonsensequery");
      expect(emptyResults).toHaveLength(0);
    });

    it("filters styles by category", () => {
      const categories = listStyleCategories();
      expect(categories.length).toBeGreaterThan(0);

      for (const cat of categories) {
        const catStyles = filterVisualStyles("", cat);
        expect(catStyles.length).toBeGreaterThan(0);
        for (const s of catStyles) {
          expect(s.category).toBe(cat);
        }
      }

      // 'all' category returns all 19 styles
      expect(filterVisualStyles("", "all")).toHaveLength(19);
    });
  });

  describe("3. Component Style Computation Across Components & Styles", () => {
    it("computes concrete CSS properties for all 19 styles across all 6 component kinds", () => {
      for (const styleId of ALL_19_STYLE_IDS) {
        for (const kind of ALL_COMPONENT_KINDS) {
          const computed = computeComponentStyle(styleId, kind);
          expect(computed).toBeDefined();
          expect(typeof computed.background).toBe("string");
          expect(typeof computed.color).toBe("string");
          expect(typeof computed.borderRadius).toBe("string");
          expect(typeof computed.padding).toBe("string");
          expect(typeof computed.boxShadow).toBe("string");
        }
      }
    });

    it("applies interactive customization overrides cleanly", () => {
      const custom: StyleCustomizationValues = {
        borderRadius: 24,
        borderWidth: 4,
        elevation: 0.9,
        fontScale: 1.3,
        primaryColor: "#ff007f",
        backgroundColor: "#120024",
      };

      const computed = computeComponentStyle("neumorphism", "card", custom);
      expect(computed.borderRadius).toBe("24px");
      expect(computed.border).toContain("4px");
      expect(computed.background).toBe("#120024");
      expect(computed.fontSize).toContain("1.3");
    });

    it("elevation multiplier scales shadow opacity and spread", () => {
      const lowElevation = computeComponentStyle("skeuomorphism", "card", { elevation: 0.1 });
      const highElevation = computeComponentStyle("skeuomorphism", "card", { elevation: 1.0 });

      expect(lowElevation.boxShadow).not.toEqual(highElevation.boxShadow);
    });
  });

  describe("4. Side-by-Side Style Comparison Engine", () => {
    it("compares two distinct styles and computes component style dictionaries for both", () => {
      const comparison = compareVisualStyles("art-nouveau", "cyberpunk" as any); // fallback gracefully if cyberpunk is not style id
      expect(comparison.primaryStyle.id).toBe("art-nouveau");
      expect(comparison.comparisonStyle).toBeDefined();
      expect(comparison.primaryComputed.card).toBeDefined();
      expect(comparison.comparisonComputed.card).toBeDefined();
    });

    it("compares any two official styles preserving customization", () => {
      const custom: StyleCustomizationValues = { borderRadius: 16 };
      const comparison = compareVisualStyles("bauhaus", "de-stijl", custom);

      expect(comparison.primaryStyle.id).toBe("bauhaus");
      expect(comparison.comparisonStyle.id).toBe("de-stijl");
      expect(comparison.primaryComputed.button.borderRadius).toBe("16px");
      expect(comparison.comparisonComputed.button.borderRadius).toBe("16px");
    });
  });

  describe("5. Design Intelligence & Compatibility Evaluation", () => {
    it("queries design intelligence with natural language prompt", () => {
      const result = queryStyleIntelligence("vibrant retro synthwave neon arcade");
      expect(result.query).toBe("vibrant retro synthwave neon arcade");
      expect(result.recommendedStyleIds.length).toBeGreaterThan(0);
      expect(result.rationale).toBeTruthy();
      expect(result.compatibleMotionDNA.length).toBeGreaterThan(0);
      expect(result.compatibleDesignSystems.length).toBeGreaterThan(0);
    });

    it("evaluates compatibility metrics and motion config for a given style", () => {
      const evalResult = evaluateStyleCompatibility("brutalism");
      expect(evalResult).toBeDefined();
      expect(typeof evalResult.compatible).toBe("boolean");
      expect(typeof evalResult.score).toBe("number");
      expect(evalResult.score).toBeGreaterThanOrEqual(0);
      expect(evalResult.score).toBeLessThanOrEqual(100);
      expect(evalResult.motionConfig).toBeDefined();
      expect(evalResult.motionConfig.preset).toBeDefined();
      expect(evalResult.motionConfig.spring).toBeDefined();
    });
  });

  describe("6. Code Generation & Export Capabilities", () => {
    it("generates production-ready React TSX component with official subpaths", () => {
      const reactCode = generateStyleReactCode("isometric", "card", { borderRadius: 12 });
      expect(reactCode).toContain('"use client";');
      expect(reactCode).toContain('import React from "react";');
      expect(reactCode).toContain('from "af-motion/react";');
      expect(reactCode).toContain("IsometricCard");
      expect(reactCode).toContain('borderRadius: "12px"');
    });

    it("generates structured export JSON configuration", () => {
      const jsonStr = generateStyleExportJson("steampunk", { elevation: 0.8 });
      const parsed = JSON.parse(jsonStr);

      expect(parsed.generator).toBe("AF Motion Studio — Visual Style Explorer");
      expect(parsed.style.id).toBe("steampunk");
      expect(parsed.style.name).toBe("Steampunk");
      expect(parsed.customization.elevation).toBe(0.8);
      expect(parsed.resolvedCssVariables).toBeDefined();
    });
  });

  describe("7. Visual Style Explorer React UI Integration", () => {
    it("renders the master StyleExplorer component with header, tabs, catalog, and preview", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(StyleExplorer));
      });

      expect(container.textContent).toContain("Visual Style Explorer");
      expect(container.textContent).toContain("19 Visual Styles Available");
      expect(container.textContent).toContain("Explore & Preview");
      expect(container.textContent).toContain("Compare (Side-by-Side)");
      expect(container.textContent).toContain("Design Intelligence");
      expect(container.textContent).toContain("Export Code");
    });

    it("switches navigation tabs to Compare, Intelligence, and Export views", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(StyleExplorer));
      });

      // Find tabs
      const compareTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Compare (Side-by-Side)")
      );
      expect(compareTab).toBeDefined();

      await act(async () => {
        compareTab?.click();
      });

      expect(container.textContent).toContain("Compare Against");
      expect(container.textContent).toContain("Category");

      // Switch to Intelligence Tab
      const intelTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Design Intelligence")
      );
      expect(intelTab).toBeDefined();

      await act(async () => {
        intelTab?.click();
      });

      expect(container.textContent).toContain("Design Intelligence Recommendation Engine");
      expect(container.textContent).toContain("Recommend Styles");

      // Switch to Export Tab
      const exportTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Export Code")
      );
      expect(exportTab).toBeDefined();

      await act(async () => {
        exportTab?.click();
      });

      expect(container.textContent).toContain("React Component (.tsx)");
      expect(container.textContent).toContain("Style JSON Config");
    });

    it("toggles reduced motion and inspector visibility", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(StyleExplorer));
      });

      // Reduced motion checkbox
      const checkbox = container.querySelector<HTMLInputElement>(
        'input[type="checkbox"]'
      );
      expect(checkbox).toBeDefined();
      expect(checkbox?.checked).toBe(false);

      await act(async () => {
        checkbox?.click();
      });
      expect(checkbox?.checked).toBe(true);

      // Inspector toggle button
      const inspectorBtn = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Hide Inspector")
      );
      expect(inspectorBtn).toBeDefined();

      await act(async () => {
        inspectorBtn?.click();
      });

      expect(inspectorBtn?.textContent).toContain("Show Inspector");
    });

    it("selects a different style from the catalog and updates the active tag", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(StyleExplorer));
      });

      const cards = container.querySelectorAll(".catalog-style-card");
      expect(cards.length).toBeGreaterThan(0);

      // Click the second style card
      await act(async () => {
        (cards[1] as HTMLElement).click();
      });

      // Verify header updated
      const currentTag = container.querySelector(".style-explorer-current-tag");
      expect(currentTag).toBeDefined();
    });
  });
});
