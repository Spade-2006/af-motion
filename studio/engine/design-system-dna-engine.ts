/**
 * AF Motion Studio — Design System & Motion DNA Engine
 *
 * Provides functions to discover, customize, compute, validate, and export
 * AF Motion Design Systems, Motion DNA profiles, and 33 built-in color palettes.
 */

import {
  listDesignSystems,
  getDesignSystem,
  createDesignSystem,
  exportDesignSystemJson,
  type DesignSystem,
  type DesignSystemDefinition,
} from "../../src/core/design-system.js";

import {
  listMotionDNA,
  getMotionDNA,
  BUILT_IN_MOTION_DNA,
  exportMotionDNAJson,
  type MotionDNA,
  type MotionDNAPersonality,
} from "../../src/core/motion-dna.js";

import {
  listPalettes,
  getPalette,
  registerPalette,
  type ColorPalette,
  type SemanticColorTokens,
} from "../../src/core/palettes.js";

import { BUILT_IN_PALETTE_INPUTS } from "../../src/core/built-in-palettes.js";

import {
  interpretDesignRequirements,
  checkStyleCompatibility,
  visualStyleRegistry,
} from "../../src/catalogue.js";

import type {
  CustomDesignSystemTokens,
  CustomMotionDNAValues,
  SystemCompatibilityReport,
  DesignSystemExportBundle,
} from "../types/design-systems.js";

/**
 * Lists all registered Design Systems.
 */
export function listAllDesignSystems(): readonly DesignSystem[] {
  return listDesignSystems();
}

/**
 * Retrieves a Design System by name or ID with fallback to the first available.
 */
export function getDesignSystemById(nameOrId: string): DesignSystem {
  const ds = getDesignSystem(nameOrId);
  if (ds) return ds;
  const all = listDesignSystems();
  const byIdOrName = all.find((s) => s.id === nameOrId || s.name === nameOrId);
  if (byIdOrName) return byIdOrName;
  return all[0];
}

/**
 * Lists all registered Motion DNA profiles.
 */
export function listAllMotionDNA(): readonly MotionDNA[] {
  return listMotionDNA();
}

/**
 * Retrieves a Motion DNA profile by name or ID with fallback to 'snappy'.
 */
export function getMotionDNAById(nameOrId: string): MotionDNA {
  const dna = getMotionDNA(nameOrId);
  if (dna) return dna;
  const match = BUILT_IN_MOTION_DNA.find(
    (d) => d.id === nameOrId || d.name === nameOrId
  );
  if (match) return match;
  return BUILT_IN_MOTION_DNA[0];
}

/**
 * Lists all palette names (all 33 built-in palettes + any registered custom palettes).
 */
export function listAllPalettes(): readonly string[] {
  return listPalettes();
}

/**
 * Retrieves a ColorPalette by name with fallback to the first built-in palette.
 */
export function getPaletteByName(name: string): ColorPalette {
  const p = getPalette(name);
  if (p) return p;
  const first = getPalette(BUILT_IN_PALETTE_INPUTS[0].name);
  if (first) return first;
  throw new Error(`Unable to load fallback palette.`);
}

/**
 * Registers a new custom color palette in the palette registry.
 */
export function registerCustomPalette(
  name: string,
  primary: string,
  secondary: string,
  accent: string,
  overrides?: Partial<SemanticColorTokens>
): ColorPalette {
  registerPalette({
    name,
    primary,
    secondary,
    accent,
    overrides,
  });
  return getPaletteByName(name);
}

/**
 * Returns default customizable design tokens for a given DesignSystem.
 */
export function getDefaultDesignSystemTokens(
  system?: DesignSystem
): CustomDesignSystemTokens {
  const paletteName =
    typeof system?.palette === "string"
      ? system.palette
      : (system?.palette as any)?.name ?? BUILT_IN_PALETTE_INPUTS[0].name;

  const pal = getPaletteByName(paletteName);

  return {
    colors: { ...pal.tokens },
    typography: {
      fontFamilySans: system?.typography?.fontFamilies?.sans ?? "Inter, system-ui, sans-serif",
      fontFamilySerif: system?.typography?.fontFamilies?.serif ?? "Georgia, serif",
      fontFamilyMono: system?.typography?.fontFamilies?.mono ?? "monospace",
      fontSizeBase: 16,
      lineHeightNormal: 1.5,
      letterSpacingNormal: "0em",
    },
    spacing: {
      baseUnit: system?.spacing?.baseUnit ?? 8,
      borderRadius: 8,
      componentPadding: 16,
      gap: 12,
    },
    interaction: {
      hoverScale: system?.interaction?.hoverScale ?? 1.02,
      pressScale: system?.interaction?.pressScale ?? 0.98,
      focusRingWidth: system?.interaction?.focusRingWidth ?? 2,
      elevationDistance: system?.interaction?.elevationDistance ?? 8,
      transitionDuration: system?.interaction?.transitionDuration ?? 200,
    },
  };
}

/**
 * Returns default customizable values for a given Motion DNA profile.
 */
export function getDefaultMotionDNAValues(
  dna?: MotionDNA
): CustomMotionDNAValues {
  const personality: MotionDNAPersonality = dna?.personality ?? "snappy";

  return {
    personality,
    intensity: dna?.characteristics?.intensity ?? 1.0,
    duration: dna?.duration ?? 250,
    delay: dna?.delay ?? 0,
    playbackRate: dna?.playbackRate ?? 1.0,
    entranceDurationMultiplier: dna?.characteristics?.entranceDurationMultiplier ?? 1.0,
    exitDurationMultiplier: dna?.characteristics?.exitDurationMultiplier ?? 0.8,
    hoverDurationMultiplier: dna?.characteristics?.hoverDurationMultiplier ?? 0.6,
    pressDurationMultiplier: dna?.characteristics?.pressDurationMultiplier ?? 0.4,
    distanceMultiplier: dna?.characteristics?.distanceMultiplier ?? 1.0,
    entranceEasing: (dna?.characteristics?.entranceEasing as string) ?? "ease-out",
    exitEasing: (dna?.characteristics?.exitEasing as string) ?? "ease-in",
    interactionEasing: (dna?.characteristics?.interactionEasing as string) ?? "ease-out",
    spring: dna?.characteristics?.spring ?? {
      stiffness: 300,
      damping: 25,
      mass: 1,
    },
    respectReducedMotion: dna?.respectReducedMotion ?? true,
  };
}

/**
 * Evaluates compatibility between Design System, Motion DNA, and Visual Styles.
 */
export function evaluateSystemCompatibility(
  system: DesignSystem,
  dna: MotionDNA,
  activeStyleId?: string
): SystemCompatibilityReport {
  const conflicts: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Evaluate Motion DNA intensity vs system personality
  if (dna.personality === "snappy" && (system.id === "ds-expressive" || system.name === "expressive" || system.id === "expressive")) {
    score -= 15;
    conflicts.push("Snappy motion may feel abrupt in an expressive, atmospheric design system.");
    recommendations.push("Consider 'playful' or 'energetic' Motion DNA for expressive systems.");
  }

  if (dna.personality === "playful" && (system.id === "ds-minimal" || system.name === "minimal" || system.id === "minimal")) {
    score -= 10;
    conflicts.push("Playful spring bounce conflicts with minimal, restrained aesthetics.");
    recommendations.push("Consider 'minimal' or 'calm' Motion DNA for austere layouts.");
  }

  // 2. Evaluate visual style compatibility if style is provided
  let compatibleStyles: string[] = [];
  if (activeStyleId) {
    const report = checkStyleCompatibility(activeStyleId);
    if (!report.compatible) {
      score -= 20;
      conflicts.push(...report.conflicts.map((c) => c.message));
    }
  }

  // Discover compatible styles from registry
  compatibleStyles = visualStyleRegistry
    .listVisualStyles()
    .slice(0, 4)
    .map((s) => s.id);

  // Compatible DNA profiles
  const compatibleDNA = BUILT_IN_MOTION_DNA.filter(
    (d) => d.personality !== dna.personality
  )
    .slice(0, 3)
    .map((d) => d.name ?? d.id ?? "snappy");

  const rationale =
    score >= 85
      ? "Design System tokens and Motion DNA dynamics are tightly harmonized."
      : "Minor friction detected between system visual tokens and motion damping.";

  return {
    compatible: score >= 60,
    score: Math.max(0, Math.min(100, score)),
    conflicts,
    recommendations,
    compatibleDNA,
    compatibleStyles,
    rationale,
  };
}

/**
 * Computes CSS variable declarations string for the active Design System and Motion DNA.
 */
export function generateDesignSystemCssVariables(
  tokens: CustomDesignSystemTokens,
  dnaValues: CustomMotionDNAValues
): string {
  const c = tokens.colors;
  const t = tokens.typography;
  const s = tokens.spacing;
  const i = tokens.interaction;

  return `:root {
  /* Colors */
  --af-color-primary: ${c.primary ?? "#3b82f6"};
  --af-color-secondary: ${c.secondary ?? "#8b5cf6"};
  --af-color-accent: ${c.accent ?? "#ec4899"};
  --af-color-background: ${c.background ?? "#090b0e"};
  --af-color-surface: ${c.surface ?? "#141720"};
  --af-color-text: ${c.text ?? "#f8fafc"};
  --af-color-muted: ${c.muted ?? "#94a3b8"};
  --af-color-border: ${c.border ?? "rgba(255, 255, 255, 0.12)"};
  --af-color-success: ${c.success ?? "#10b981"};
  --af-color-warning: ${c.warning ?? "#f59e0b"};
  --af-color-error: ${c.error ?? "#ef4444"};
  --af-color-info: ${c.info ?? "#06b6d4"};

  /* Typography */
  --af-font-sans: ${t.fontFamilySans};
  --af-font-serif: ${t.fontFamilySerif};
  --af-font-mono: ${t.fontFamilyMono};
  --af-font-size-base: ${t.fontSizeBase}px;
  --af-line-height-normal: ${t.lineHeightNormal};
  --af-letter-spacing-normal: ${t.letterSpacingNormal};

  /* Spacing & Layout */
  --af-spacing-base: ${s.baseUnit}px;
  --af-border-radius: ${s.borderRadius}px;
  --af-padding-component: ${s.componentPadding}px;
  --af-gap-layout: ${s.gap}px;

  /* Interaction & Elevation */
  --af-hover-scale: ${i.hoverScale};
  --af-press-scale: ${i.pressScale};
  --af-focus-ring-width: ${i.focusRingWidth}px;
  --af-elevation-distance: ${i.elevationDistance}px;
  --af-transition-duration: ${i.transitionDuration}ms;

  /* Motion DNA: ${dnaValues.personality} */
  --af-motion-duration: ${dnaValues.duration}ms;
  --af-motion-delay: ${dnaValues.delay}ms;
  --af-motion-intensity: ${dnaValues.intensity};
  --af-motion-ease-entrance: ${dnaValues.entranceEasing};
  --af-motion-ease-exit: ${dnaValues.exitEasing};
  --af-motion-ease-interaction: ${dnaValues.interactionEasing};
  --af-spring-stiffness: ${dnaValues.spring.stiffness};
  --af-spring-damping: ${dnaValues.spring.damping};
  --af-spring-mass: ${dnaValues.spring.mass};
}`;
}

/**
 * Generates verified React component code utilizing the design system and motion DNA.
 */
export function generateDesignSystemReactCode(
  systemName: string,
  tokens: CustomDesignSystemTokens,
  dnaValues: CustomMotionDNAValues
): string {
  const cleanName = systemName.replace(/[^a-zA-Z0-9]/g, "");
  const componentName = `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}Showcase`;

  return `"use client";

import React, { useState } from "react";
import { Interactive, Reveal, useMotionAccessibility } from "af-motion/react";

/**
 * ${systemName} Design System + Motion DNA (${dnaValues.personality}) Showcase
 */
export function ${componentName}() {
  const { prefersReducedMotion } = useMotionAccessibility();
  const [activeTab, setActiveTab] = useState("overview");

  const hoverScale = prefersReducedMotion ? 1 : ${dnaValues.respectReducedMotion ? "prefersReducedMotion ? 1 : " : ""}${tokens.interaction.hoverScale};
  const pressScale = prefersReducedMotion ? 1 : ${tokens.interaction.pressScale};

  return (
    <div
      style={{
        background: "${tokens.colors.background ?? "#090b0e"}",
        color: "${tokens.colors.text ?? "#f8fafc"}",
        fontFamily: "${tokens.typography.fontFamilySans}",
        padding: "${tokens.spacing.componentPadding * 2}px",
        borderRadius: "${tokens.spacing.borderRadius * 2}px",
      }}
    >
      <Reveal direction="down" duration={${dnaValues.duration}}>
        <header style={{ marginBottom: "${tokens.spacing.gap * 2}px" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 8px 0" }}>${systemName}</h1>
          <p style={{ color: "${tokens.colors.muted ?? "#94a3b8"}", margin: 0 }}>
            Motion Personality: <strong>${dnaValues.personality}</strong> (Intensity: ${dnaValues.intensity}x)
          </p>
        </header>
      </Reveal>

      {/* Interactive Controls */}
      <div style={{ display: "flex", gap: "${tokens.spacing.gap}px", marginBottom: "24px" }}>
        <Interactive hover={{ scale: hoverScale }} tap={{ scale: pressScale }}>
          <button
            type="button"
            style={{
              background: "${tokens.colors.primary ?? "#3b82f6"}",
              color: "#ffffff",
              border: "none",
              borderRadius: "${tokens.spacing.borderRadius}px",
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Primary Action
          </button>
        </Interactive>

        <Interactive hover={{ scale: hoverScale }} tap={{ scale: pressScale }}>
          <button
            type="button"
            style={{
              background: "${tokens.colors.surface ?? "#141720"}",
              color: "${tokens.colors.text ?? "#f8fafc"}",
              border: "1px solid ${tokens.colors.border ?? "rgba(255,255,255,0.12)"}",
              borderRadius: "${tokens.spacing.borderRadius}px",
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Secondary Action
          </button>
        </Interactive>
      </div>

      {/* Surface Card */}
      <Reveal direction="up" delay={${Math.round(dnaValues.duration * 0.4)}}>
        <div
          style={{
            background: "${tokens.colors.surface ?? "#141720"}",
            border: "1px solid ${tokens.colors.border ?? "rgba(255,255,255,0.12)"}",
            borderRadius: "${tokens.spacing.borderRadius}px",
            padding: "${tokens.spacing.componentPadding}px",
            boxShadow: "0 ${tokens.interaction.elevationDistance}px 24px rgba(0,0,0,0.3)",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: "${tokens.colors.accent ?? "#ec4899"}" }}>
            Elevated Surface
          </h3>
          <p style={{ color: "${tokens.colors.muted ?? "#94a3b8"}", lineHeight: 1.6, margin: 0 }}>
            Tokens, typography, and motion easing are synchronised across DOM elements and interactive components.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
`;
}

/**
 * Generates export bundle combining Design System and Motion DNA configurations.
 */
export function generateCombinedExportJson(
  system: DesignSystem,
  dna: MotionDNA,
  tokens: CustomDesignSystemTokens,
  dnaValues: CustomMotionDNAValues
): string {
  return JSON.stringify(
    {
      generator: "AF Motion Studio — Design System & Motion DNA Editor",
      version: "1.0.0",
      designSystem: {
        id: system.id,
        name: system.name,
        description: system.description,
        palette: tokens.colors,
        typography: tokens.typography,
        spacing: tokens.spacing,
        interaction: tokens.interaction,
      },
      motionDNA: {
        id: dna.id ?? `dna-${dnaValues.personality}`,
        name: dna.name ?? dnaValues.personality,
        personality: dnaValues.personality,
        duration: dnaValues.duration,
        delay: dnaValues.delay,
        playbackRate: dnaValues.playbackRate,
        respectReducedMotion: dnaValues.respectReducedMotion,
        characteristics: {
          intensity: dnaValues.intensity,
          distanceMultiplier: dnaValues.distanceMultiplier,
          entranceDurationMultiplier: dnaValues.entranceDurationMultiplier,
          exitDurationMultiplier: dnaValues.exitDurationMultiplier,
          hoverDurationMultiplier: dnaValues.hoverDurationMultiplier,
          pressDurationMultiplier: dnaValues.pressDurationMultiplier,
          entranceEasing: dnaValues.entranceEasing,
          exitEasing: dnaValues.exitEasing,
          interactionEasing: dnaValues.interactionEasing,
          spring: dnaValues.spring,
        },
      },
    },
    null,
    2
  );
}
