/**
 * AF Motion Studio — Visual Style Explorer Engine
 *
 * Dynamically queries the official visualStyleRegistry, calculates component styles
 * for all 19 visual styles, provides side-by-side comparison, connects to Design Intelligence,
 * and generates clean React export snippets.
 */

import {
  visualStyleRegistry,
  type VisualStyleDefinition,
  type VisualStyleCategory,
  checkStyleCompatibility,
  resolveVisualStyle,
  getStyleMotionConfig,
  listDesignSystems,
  getDesignSystem,
  interpretDesignRequirements,
  BUILT_IN_MOTION_DNA,
} from "../../src/catalogue.js";

import type {
  ComputedComponentStyle,
  StyleComparisonData,
  StyleCustomizationValues,
  StyleExplorerViewMode,
  StyleIntelligenceResult,
  StylePreviewComponentKind,
} from "../types/style-explorer.js";

/**
 * Discovers all 19 registered visual styles dynamically from the registry.
 */
export { getStyleMotionConfig };

export const DEFAULT_STYLE_CUSTOMIZATION: StyleCustomizationValues = {
  borderRadius: 8,
  borderWidth: 1,
  elevation: 0.5,
  fontScale: 1.0,
};

export function listAllVisualStyles(): readonly VisualStyleDefinition[] {
  return visualStyleRegistry.listVisualStyles();
}

/**
 * Filters visual styles by search query (name, philosophy, tags) and category.
 */
export function filterVisualStyles(
  query: string,
  categoryFilter?: string
): VisualStyleDefinition[] {
  let list = visualStyleRegistry.listVisualStyles();

  if (categoryFilter && categoryFilter !== "all") {
    list = list.filter((s) => s.category === categoryFilter);
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.philosophy.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return [...list];
}

/**
 * Retrieves a single visual style definition by its unique ID.
 */
export function getVisualStyleById(id: string): VisualStyleDefinition {
  const found = visualStyleRegistry.getVisualStyle(id);
  if (!found) {
    const all = visualStyleRegistry.listVisualStyles();
    return all[0];
  }
  return found;
}

/**
 * Retrieves all unique categories from the registered styles.
 */
export function listStyleCategories(): string[] {
  const all = visualStyleRegistry.listVisualStyles();
  const cats = new Set(all.map((s) => s.category));
  return Array.from(cats).sort();
}

/**
 * Computes live CSS styles for a specific component kind under a given visual style,
 * incorporating user customizations if provided.
 */
export function computeComponentStyle(
  styleId: string,
  kind: StylePreviewComponentKind,
  customization?: StyleCustomizationValues
): ComputedComponentStyle {
  const def = getVisualStyleById(styleId);

  // Default tokens extracted from definition
  const radiusFromDef = def.shapeLanguage.cornerRadius;
  const borderFromDef = `${def.shapeLanguage.borderWidth} ${def.shapeLanguage.borderStyle}`;
  const headingFont = def.typography.headingFont;
  const bodyFont = def.typography.bodyFont;

  // Customization overrides
  const customRadius =
    customization?.borderRadius !== undefined
      ? `${customization.borderRadius}px`
      : radiusFromDef;

  const customBorderWidth =
    customization?.borderWidth !== undefined
      ? `${customization.borderWidth}px`
      : def.shapeLanguage.borderWidth;

  const fontMultiplier = customization?.fontScale ?? 1.0;
  const elevationMultiplier = customization?.elevation ?? 1.0;

  // Style-specific aesthetic derivations
  let background = "#1e2230";
  let color = "#f3f4f6";
  let border = `${customBorderWidth} solid rgba(255, 255, 255, 0.15)`;
  let boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
  let textShadow = "none";
  let backdropFilter = "none";

  switch (styleId) {
    case "skeuomorphism":
      background =
        customization?.backgroundColor ??
        "linear-gradient(180deg, #f7f8fa 0%, #e1e5eb 48%, #caced5 52%, #bec5ce 100%)";
      color = "#1f2937";
      border = `${customBorderWidth} solid #9ea5af`;
      boxShadow = `0 ${Math.round(4 * elevationMultiplier)}px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.2)`;
      textShadow = "0 1px 0 rgba(255,255,255,0.9)";
      break;

    case "neumorphism":
      background = customization?.backgroundColor ?? "#e0e5ec";
      color = "#4a5568";
      border = customization?.borderWidth !== undefined && customization.borderWidth > 0
        ? `${customBorderWidth} solid rgba(163, 177, 198, 0.4)`
        : "none";
      const dist = Math.round(8 * elevationMultiplier);
      const blur = Math.round(16 * elevationMultiplier);
      boxShadow = `${dist}px ${dist}px ${blur}px #a3b1c6, -${dist}px -${dist}px ${blur}px #ffffff`;
      break;

    case "brutalism":
      background = customization?.backgroundColor ?? "#ffffff";
      color = "#000000";
      border = `${customBorderWidth || "3px"} solid #000000`;
      const offset = Math.round(5 * elevationMultiplier);
      boxShadow = `${offset}px ${offset}px 0px #000000`;
      break;

    case "vaporwave":
      background =
        customization?.backgroundColor ??
        "linear-gradient(135deg, #1b0f34 0%, #2f195f 50%, #732c7b 100%)";
      color = "#00f0ff";
      border = `${customBorderWidth} solid #ff007f`;
      boxShadow = `0 0 ${Math.round(15 * elevationMultiplier)}px rgba(255, 0, 127, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.3)`;
      textShadow = "0 0 8px #00f0ff";
      break;

    case "liquid-chrome":
      background =
        customization?.backgroundColor ??
        "linear-gradient(135deg, #e6edf5 0%, #8ca1ba 35%, #2a3d54 50%, #d4e3f5 65%, #182230 100%)";
      color = "#ffffff";
      border = `${customBorderWidth} solid rgba(255, 255, 255, 0.4)`;
      boxShadow = `0 ${Math.round(8 * elevationMultiplier)}px 32px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.8)`;
      backdropFilter = "blur(12px)";
      break;

    case "de-stijl":
      background = customization?.backgroundColor ?? "#ffffff";
      color = "#111111";
      border = `${customBorderWidth || "4px"} solid #000000`;
      boxShadow = `${Math.round(6 * elevationMultiplier)}px ${Math.round(6 * elevationMultiplier)}px 0px #cc0000`;
      break;

    case "memphis":
      background = customization?.backgroundColor ?? "#fff4e6";
      color = "#1a1a2e";
      border = `${customBorderWidth || "3px"} solid #1a1a2e`;
      boxShadow = `${Math.round(5 * elevationMultiplier)}px ${Math.round(5 * elevationMultiplier)}px 0px #ff6b6b`;
      break;

    case "psychedelic":
      background =
        customization?.backgroundColor ??
        "linear-gradient(135deg, #ff007f 0%, #7928ca 35%, #00dfd8 70%, #ffdf00 100%)";
      color = "#ffffff";
      border = `${customBorderWidth} solid rgba(255, 255, 255, 0.6)`;
      boxShadow = `0 ${Math.round(6 * elevationMultiplier)}px 24px rgba(121, 40, 202, 0.5)`;
      textShadow = "0 2px 4px rgba(0,0,0,0.4)";
      break;

    case "steampunk":
      background =
        customization?.backgroundColor ??
        "linear-gradient(180deg, #4a2c11 0%, #2b1808 100%)";
      color = "#e5c158";
      border = `${customBorderWidth || "2px"} solid #b8860b`;
      boxShadow = `inset 0 0 10px rgba(0,0,0,0.8), 0 ${Math.round(4 * elevationMultiplier)}px 8px rgba(0,0,0,0.6)`;
      textShadow = "0 1px 2px #000000";
      break;

    case "paper-cutout":
      background = customization?.backgroundColor ?? "#fff9f0";
      color = "#2d3748";
      border = `${customBorderWidth} solid #e2e8f0`;
      boxShadow = `0 ${Math.round(4 * elevationMultiplier)}px 6px -1px rgba(0,0,0,0.1), 0 ${Math.round(10 * elevationMultiplier)}px 15px -3px rgba(0,0,0,0.15)`;
      break;

    case "glitch":
      background = customization?.backgroundColor ?? "#0d0e15";
      color = "#00ffcc";
      border = `${customBorderWidth || "2px"} solid #ff0055`;
      boxShadow = `3px 3px 0px #00ffcc, -3px -3px 0px #ff0055`;
      textShadow = "2px 0px #ff0055, -2px 0px #00ffcc";
      break;

    case "3d-inflated":
      background =
        customization?.backgroundColor ??
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)";
      color = "#2c3e50";
      border = customization?.borderWidth !== undefined && customization.borderWidth > 0
        ? `${customBorderWidth} solid rgba(255, 255, 255, 0.5)`
        : "none";
      boxShadow = `inset 0 -6px 12px rgba(0,0,0,0.12), inset 0 6px 12px rgba(255,255,255,0.7), 0 ${Math.round(8 * elevationMultiplier)}px 20px rgba(0,0,0,0.15)`;
      break;

    case "bauhaus":
      background = customization?.backgroundColor ?? "#f7f7f7";
      color = "#111111";
      border = `${customBorderWidth || "2px"} solid #111111`;
      boxShadow = `0 ${Math.round(4 * elevationMultiplier)}px 0px #0055b8`;
      break;

    case "mid-century-modern":
      background = customization?.backgroundColor ?? "#e8dfd8";
      color = "#2b2b2b";
      border = `${customBorderWidth} solid #c2a68c`;
      boxShadow = `0 ${Math.round(4 * elevationMultiplier)}px 8px rgba(43, 43, 43, 0.15)`;
      break;

    case "art-nouveau":
      background = customization?.backgroundColor ?? "#24332c";
      color = "#dfd3c3";
      border = `${customBorderWidth || "2px"} solid #c7b198`;
      boxShadow = `0 ${Math.round(6 * elevationMultiplier)}px 16px rgba(0,0,0,0.35)`;
      break;

    case "grunge":
      background = customization?.backgroundColor ?? "#1a1818";
      color = "#dcd6cd";
      border = `${customBorderWidth || "2px"} solid #4a4441`;
      boxShadow = `0 ${Math.round(6 * elevationMultiplier)}px 12px rgba(0,0,0,0.7)`;
      break;

    case "anti-design":
      background = customization?.backgroundColor ?? "#ffff00";
      color = "#000000";
      border = `${customBorderWidth || "4px"} dashed #ff0000`;
      boxShadow = `${Math.round(8 * elevationMultiplier)}px ${Math.round(8 * elevationMultiplier)}px 0px #00ff00`;
      break;

    case "isometric":
      background =
        customization?.backgroundColor ??
        "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)";
      color = "#ffffff";
      border = `${customBorderWidth} solid rgba(255,255,255,0.2)`;
      boxShadow = `0 ${Math.round(12 * elevationMultiplier)}px 24px -4px rgba(55, 48, 163, 0.5)`;
      break;

    case "ukiyo-e":
      background = customization?.backgroundColor ?? "#f4ede2";
      color = "#203a43";
      border = `${customBorderWidth || "2px"} solid #2b580c`;
      boxShadow = `0 ${Math.round(3 * elevationMultiplier)}px 8px rgba(32, 58, 67, 0.15)`;
      break;

    default:
      background = customization?.backgroundColor ?? "#1f2937";
      color = "#f9fafb";
      border = `${customBorderWidth} solid rgba(255, 255, 255, 0.15)`;
      boxShadow = `0 ${Math.round(4 * elevationMultiplier)}px 12px rgba(0, 0, 0, 0.25)`;
      break;
  }

  // Component-specific adjustments
  let fontSize = `${(1.0 * fontMultiplier).toFixed(2)}rem`;
  let padding = "12px 24px";
  let fontFamily = bodyFont;

  if (kind === "button") {
    padding = "10px 22px";
    fontSize = `${(0.95 * fontMultiplier).toFixed(2)}rem`;
  } else if (kind === "card") {
    padding = "24px";
  } else if (kind === "input") {
    padding = "10px 16px";
    fontSize = `${(0.9 * fontMultiplier).toFixed(2)}rem`;
  } else if (kind === "badge") {
    padding = "4px 12px";
    fontSize = `${(0.75 * fontMultiplier).toFixed(2)}rem`;
  } else if (kind === "panel") {
    padding = "20px";
  } else if (kind === "typography") {
    fontFamily = headingFont;
    fontSize = `${(1.8 * fontMultiplier).toFixed(2)}rem`;
    padding = "8px 0";
  }

  return {
    background,
    color,
    border,
    borderRadius: customRadius,
    boxShadow,
    textShadow,
    fontFamily,
    fontSize,
    padding,
    backdropFilter,
    transition: "all 150ms ease",
  };
}

/**
 * Computes side-by-side comparison data between two visual styles.
 */
export function compareVisualStyles(
  primaryId: string,
  comparisonId: string,
  customization?: StyleCustomizationValues
): StyleComparisonData {
  const primaryStyle = getVisualStyleById(primaryId);
  const comparisonStyle = getVisualStyleById(comparisonId);

  const kinds: StylePreviewComponentKind[] = [
    "button",
    "card",
    "input",
    "panel",
    "badge",
    "typography",
  ];

  const primaryComputed = {} as Record<StylePreviewComponentKind, ComputedComponentStyle>;
  const comparisonComputed = {} as Record<StylePreviewComponentKind, ComputedComponentStyle>;

  for (const k of kinds) {
    primaryComputed[k] = computeComponentStyle(primaryId, k, customization);
    comparisonComputed[k] = computeComponentStyle(comparisonId, k, customization);
  }

  return {
    primaryStyle,
    comparisonStyle,
    primaryComputed,
    comparisonComputed,
  };
}

/**
 * Queries Design Intelligence for style recommendations and compatibility.
 */
export function queryStyleIntelligence(prompt: string): StyleIntelligenceResult {
  const req = interpretDesignRequirements(prompt);

  const recommendedIds = req.recommendedVisualStyles.map((s) => s.styleId);
  const safeStyles =
    recommendedIds.length > 0
      ? recommendedIds
      : ["brutalism", "skeuomorphism", "neumorphism"];

  const rationale =
    req.recommendedVisualStyles[0]?.rationale ||
    "Selected based on aesthetic density and contrast balance detected in the design query.";

  const compatibleDNA = [
    req.motionRecommendations.motionDNA,
    ...(req.motionRecommendations.motionDNA === "dna-snappy"
      ? ["energetic", "precise"]
      : ["playful", "elegant"]),
  ];

  const dsList = listDesignSystems();
  const compatibleSystems = dsList.slice(0, 3).map((ds) => ds.name);

  return {
    query: prompt,
    recommendedStyleIds: safeStyles,
    rationale,
    compatibleMotionDNA: compatibleDNA,
    compatibleDesignSystems: compatibleSystems,
    conflicts: req.conflicts.map((c) => c.description),
  };
}

/**
 * Checks compatibility between a given Visual Style and Design Systems.
 */
export function evaluateStyleCompatibility(styleId: string): {
  compatible: boolean;
  score: number;
  conflicts: string[];
  motionConfig: ReturnType<typeof getStyleMotionConfig>;
} {
  const report = checkStyleCompatibility(styleId);
  const motionConfig = getStyleMotionConfig(styleId);

  return {
    compatible: report.compatible,
    score: report.score,
    conflicts: report.conflicts.map((c) => c.message),
    motionConfig,
  };
}

/**
 * Generates ready-to-run React component code demonstrating the selected style.
 */
export function generateStyleReactCode(
  styleId: string,
  kind: StylePreviewComponentKind,
  customization?: StyleCustomizationValues
): string {
  const def = getVisualStyleById(styleId);
  const computed = computeComponentStyle(styleId, kind, customization);
  const componentName = `${def.name.replace(/[^a-zA-Z0-9]/g, "")}${kind.charAt(0).toUpperCase() + kind.slice(1)}`;

  return `"use client";

import React from "react";
import { resolveVisualStyle, visualStyleRegistry } from "af-motion/catalogue";
import { useMotionAccessibility, Interactive, useAnimate } from "af-motion/react";

/**
 * ${def.name} Style — ${kind.toUpperCase()}
 * Category: ${def.category}
 * Philosophy: ${def.philosophy}
 */
export function ${componentName}() {
  const { prefersReducedMotion } = useMotionAccessibility();

  const styleOverrides: React.CSSProperties = {
    background: "${computed.background}",
    color: "${computed.color}",
    border: "${computed.border ?? "none"}",
    borderRadius: "${computed.borderRadius ?? "8px"}",
    boxShadow: "${computed.boxShadow ?? "none"}",
    fontFamily: "${computed.fontFamily ?? "sans-serif"}",
    padding: "${computed.padding}",
    transition: prefersReducedMotion ? "none" : "${computed.transition}",
    backdropFilter: "${computed.backdropFilter ?? "none"}",
  };

  return (
    <Interactive hover={{ scale: prefersReducedMotion ? 1 : 1.02 }} tap={{ scale: 0.98 }}>
      <div
        className="af-${styleId}-${kind}"
        style={styleOverrides}
      >
        <span className="font-semibold">${def.name} ${kind.charAt(0).toUpperCase() + kind.slice(1)}</span>
      </div>
    </Interactive>
  );
}
`;
}

/**
 * Generates an exportable JSON configuration bundle for the style.
 */
export function generateStyleExportJson(
  styleId: string,
  customization?: StyleCustomizationValues
): string {
  const def = getVisualStyleById(styleId);
  const resolved = resolveVisualStyle(styleId);

  return JSON.stringify(
    {
      generator: "AF Motion Studio — Visual Style Explorer",
      version: "1.0.0",
      style: {
        id: def.id,
        name: def.name,
        category: def.category,
        philosophy: def.philosophy,
        recommendedPalettes: def.recommendedPalettes,
        shapeLanguage: def.shapeLanguage,
        typography: def.typography,
      },
      resolvedCssVariables: resolved?.cssVariables ?? {},
      customization: customization ?? {},
    },
    null,
    2
  );
}
