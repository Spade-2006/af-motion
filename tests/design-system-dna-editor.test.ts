// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import {
  listAllDesignSystems,
  getDesignSystemById,
  listAllMotionDNA,
  getMotionDNAById,
  listAllPalettes,
  getPaletteByName,
  registerCustomPalette,
  getDefaultDesignSystemTokens,
  getDefaultMotionDNAValues,
  evaluateSystemCompatibility,
  generateDesignSystemCssVariables,
  generateDesignSystemReactCode,
  generateCombinedExportJson,
  DesignSystemStudio,
  type CustomDesignSystemTokens,
  type CustomMotionDNAValues,
} from "../studio/index.js";
import { BUILT_IN_PALETTE_INPUTS } from "../src/core/built-in-palettes.js";

describe("Prompt 95 — Design System & Motion DNA Editor", () => {
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

  describe("1. Design System & Motion DNA Discovery", () => {
    it("discovers all registered Design Systems dynamically", () => {
      const systems = listAllDesignSystems();
      expect(systems.length).toBeGreaterThan(0);

      const systemIds = systems.map((s) => s.id);
      expect(systemIds).toContain("ds-default");
      expect(systemIds).toContain("ds-minimal");
      expect(systemIds).toContain("ds-expressive");

      const systemNames = systems.map((s) => s.name);
      expect(systemNames).toContain("default");
      expect(systemNames).toContain("minimal");
      expect(systemNames).toContain("expressive");
    });

    it("retrieves Design Systems by ID and falls back gracefully", () => {
      const defaultSys = getDesignSystemById("default");
      expect(defaultSys.id).toBe("ds-default");
      expect(defaultSys.name).toBeTruthy();

      const unknown = getDesignSystemById("non-existent-system-id");
      expect(unknown).toBeDefined();
      expect(unknown.id).toBe("ds-default");
    });

    it("discovers all 6 built-in Motion DNA profiles dynamically", () => {
      const dnas = listAllMotionDNA();
      expect(dnas.length).toBeGreaterThanOrEqual(6);

      const personalities = dnas.map((d) => d.personality);
      expect(personalities).toContain("snappy");
      expect(personalities).toContain("energetic");
      expect(personalities).toContain("calm");
      expect(personalities).toContain("cinematic");
      expect(personalities).toContain("minimal");
      expect(personalities).toContain("playful");
    });

    it("retrieves Motion DNA by name or ID and falls back gracefully", () => {
      const snappy = getMotionDNAById("snappy");
      expect(snappy.personality).toBe("snappy");

      const unknown = getMotionDNAById("unknown-motion-dna");
      expect(unknown).toBeDefined();
      expect(unknown.personality).toBe("snappy");
    });
  });

  describe("2. Palette Management & Built-in Protection", () => {
    it("dynamically exposes all 33 built-in palettes", () => {
      expect(BUILT_IN_PALETTE_INPUTS).toHaveLength(33);

      const paletteNames = listAllPalettes();
      expect(paletteNames.length).toBeGreaterThanOrEqual(33);

      for (const p of BUILT_IN_PALETTE_INPUTS) {
        expect(paletteNames).toContain(p.name);
      }
    });

    it("retrieves palette semantic color tokens accurately", () => {
      const palette = getPaletteByName("Platinum Mocha");
      expect(palette).toBeDefined();
      expect(palette.name).toBe("Platinum Mocha");
      expect(palette.tokens.primary).toBeTruthy();
      expect(palette.tokens.secondary).toBeTruthy();
      expect(palette.tokens.accent).toBeTruthy();
      expect(palette.tokens.background).toBeTruthy();
      expect(palette.tokens.surface).toBeTruthy();
    });

    it("allows registering custom palettes without mutating built-in palettes", () => {
      const customName = `CustomStudioPalette_${Date.now()}`;
      const customPal = registerCustomPalette(
        customName,
        "#112233",
        "#445566",
        "#778899",
        { background: "#010203" }
      );

      expect(customPal.name).toBe(customName);
      expect(customPal.tokens.primary).toBe("#112233");
      expect(customPal.tokens.background).toBe("#010203");

      // Verify built-in palettes count remains intact
      expect(BUILT_IN_PALETTE_INPUTS).toHaveLength(33);
    });
  });

  describe("3. Design Tokens & Motion DNA Customization", () => {
    it("generates default customizable tokens from a Design System", () => {
      const system = getDesignSystemById("default");
      const tokens = getDefaultDesignSystemTokens(system);

      expect(tokens.colors.primary).toBeTruthy();
      expect(tokens.typography.fontFamilySans).toBeTruthy();
      expect(tokens.typography.fontSizeBase).toBe(16);
      expect(tokens.spacing.baseUnit).toBeGreaterThan(0);
      expect(tokens.spacing.borderRadius).toBeGreaterThan(0);
      expect(tokens.interaction.hoverScale).toBeGreaterThan(1.0);
    });

    it("generates default customizable values from a Motion DNA profile", () => {
      const dna = getMotionDNAById("snappy");
      const values = getDefaultMotionDNAValues(dna);

      expect(values.personality).toBe("snappy");
      expect(values.intensity).toBeGreaterThan(0);
      expect(values.duration).toBeGreaterThan(0);
      expect(values.spring.stiffness).toBeGreaterThan(0);
      expect(values.spring.damping).toBeGreaterThan(0);
      expect(values.respectReducedMotion).toBe(true);
    });
  });

  describe("4. Design Intelligence & Compatibility Evaluation", () => {
    it("evaluates compatibility score and friction diagnostics", () => {
      const defaultSys = getDesignSystemById("default");
      const snappyDNA = getMotionDNAById("snappy");

      const report = evaluateSystemCompatibility(defaultSys, snappyDNA);
      expect(report.score).toBeGreaterThan(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(typeof report.compatible).toBe("boolean");
      expect(report.rationale).toBeTruthy();
      expect(report.compatibleDNA.length).toBeGreaterThan(0);
      expect(report.compatibleStyles.length).toBeGreaterThan(0);
    });

    it("detects aesthetic friction between incompatible personality combinations", () => {
      const expressiveSys = getDesignSystemById("expressive");
      const snappyDNA = getMotionDNAById("snappy");

      const report = evaluateSystemCompatibility(expressiveSys, snappyDNA);
      expect(report.conflicts.length).toBeGreaterThan(0);
      expect(report.conflicts.some((c) => c.toLowerCase().includes("snappy"))).toBe(true);
    });
  });

  describe("5. Code Generation & Export Capabilities", () => {
    it("generates structured CSS custom properties (:root)", () => {
      const system = getDesignSystemById("default");
      const dna = getMotionDNAById("snappy");
      const tokens = getDefaultDesignSystemTokens(system);
      const dnaValues = getDefaultMotionDNAValues(dna);

      const css = generateDesignSystemCssVariables(tokens, dnaValues);
      expect(css).toContain(":root {");
      expect(css).toContain("--af-color-primary:");
      expect(css).toContain("--af-font-sans:");
      expect(css).toContain("--af-spacing-base:");
      expect(css).toContain("--af-spring-stiffness:");
      expect(css).toContain("--af-motion-duration:");
    });

    it("generates production-ready React TSX component using official subpaths", () => {
      const system = getDesignSystemById("default");
      const dna = getMotionDNAById("snappy");
      const tokens = getDefaultDesignSystemTokens(system);
      const dnaValues = getDefaultMotionDNAValues(dna);

      const tsx = generateDesignSystemReactCode(system.name, tokens, dnaValues);
      expect(tsx).toContain('"use client";');
      expect(tsx).toContain('import React, { useState } from "react";');
      expect(tsx).toContain('from "af-motion/react";');
      expect(tsx).toContain("DefaultShowcase");
      expect(tsx).toContain("Primary Action");
    });

    it("generates valid combined export JSON", () => {
      const system = getDesignSystemById("default");
      const dna = getMotionDNAById("snappy");
      const tokens = getDefaultDesignSystemTokens(system);
      const dnaValues = getDefaultMotionDNAValues(dna);

      const jsonStr = generateCombinedExportJson(system, dna, tokens, dnaValues);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.generator).toContain("AF Motion Studio");
      expect(parsed.designSystem.name).toBe(system.name);
      expect(parsed.motionDNA.personality).toBe("snappy");
      expect(parsed.motionDNA.characteristics.spring).toBeDefined();
    });
  });

  describe("6. Design System & Motion DNA Studio React UI Integration", () => {
    it("mounts the master DesignSystemStudio into DOM with controls and preview", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(DesignSystemStudio));
      });

      expect(container.textContent).toContain("Design System & Motion DNA");
      expect(container.textContent).toContain("Colors & Palettes");
      expect(container.textContent).toContain("Design Tokens");
      expect(container.textContent).toContain("Motion DNA");
      expect(container.textContent).toContain("Compatibility");
      expect(container.textContent).toContain("Export Code");
      expect(container.textContent).toContain("Live Preview");
    });

    it("switches navigation tabs to Tokens, Motion DNA, Compatibility, and Export", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(DesignSystemStudio));
      });

      // Switch to Design Tokens Tab
      const tokensTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Design Tokens")
      );
      expect(tokensTab).toBeDefined();

      await act(async () => {
        tokensTab?.click();
      });

      expect(container.textContent).toContain("Design System Tokens");
      expect(container.textContent).toContain("Typography");
      expect(container.textContent).toContain("Spacing & Layout");

      // Switch to Motion DNA Tab
      const dnaTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Motion DNA")
      );
      expect(dnaTab).toBeDefined();

      await act(async () => {
        dnaTab?.click();
      });

      expect(container.textContent).toContain("Motion DNA Profile Editor");
      expect(container.textContent).toContain("Motion Intensity");
      expect(container.textContent).toContain("Spring Physics");

      // Switch to Compatibility Tab
      const compatTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Compatibility")
      );
      expect(compatTab).toBeDefined();

      await act(async () => {
        compatTab?.click();
      });

      expect(container.textContent).toContain("Design Intelligence & Compatibility");
      expect(container.textContent).toContain("Aligned Motion DNA Profiles");

      // Switch to Export Tab
      const exportTab = Array.from(container.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Export Code")
      );
      expect(exportTab).toBeDefined();

      await act(async () => {
        exportTab?.click();
      });

      expect(container.textContent).toContain("React Component (.tsx)");
      expect(container.textContent).toContain("CSS Variables (.css)");
      expect(container.textContent).toContain("JSON Config (.json)");
    });

    it("switches palette selection and updates active palette", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(DesignSystemStudio));
      });

      const paletteCards = container.querySelectorAll(".ds-palette-card");
      expect(paletteCards.length).toBeGreaterThan(0);

      // Click second palette
      await act(async () => {
        (paletteCards[1] as HTMLElement).click();
      });

      expect(paletteCards[1].className).toContain("selected");
    });

    it("toggles reduced motion option cleanly", async () => {
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(DesignSystemStudio));
      });

      const checkbox = container.querySelector<HTMLInputElement>(
        'input[type="checkbox"]'
      );
      expect(checkbox).toBeDefined();
      expect(checkbox?.checked).toBe(false);

      await act(async () => {
        checkbox?.click();
      });

      expect(checkbox?.checked).toBe(true);
    });
  });
});
