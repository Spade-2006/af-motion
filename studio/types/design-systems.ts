/**
 * AF Motion Studio — Design System & Motion DNA Editor Type Definitions
 *
 * Types for design system tokens, Motion DNA configurations,
 * live component previews, palette management, and code exports.
 */

import type {
  DesignSystem,
  DesignSystemDefinition,
  DesignSystemTypographyTokens,
  DesignSystemSpacingTokens,
  DesignSystemMotionTimingTokens,
  DesignSystemEasingTokens,
  DesignSystemInteractionTokens,
} from "../../src/core/design-system.js";
import type {
  MotionDNA,
  MotionDNAPersonality,
  MotionDNACharacteristics,
  MotionDNASpringConfig,
} from "../../src/core/motion-dna.js";
import type { ColorPalette, SemanticColorTokens } from "../../src/core/palettes.js";

export type DesignStudioViewMode =
  | "system"
  | "dna"
  | "palettes"
  | "compatibility"
  | "export";

export type DesignTokenCategory =
  | "colors"
  | "typography"
  | "spacing"
  | "surfaces"
  | "components";

export type ComponentPreviewKind =
  | "all"
  | "buttons"
  | "cards"
  | "forms"
  | "navigation"
  | "panels"
  | "typography";

export interface CustomDesignSystemTokens {
  colors: Partial<SemanticColorTokens>;
  typography: {
    fontFamilySans: string;
    fontFamilySerif: string;
    fontFamilyMono: string;
    fontSizeBase: number; // px
    lineHeightNormal: number;
    letterSpacingNormal: string;
  };
  spacing: {
    baseUnit: number;
    borderRadius: number;
    componentPadding: number;
    gap: number;
  };
  interaction: {
    hoverScale: number;
    pressScale: number;
    focusRingWidth: number;
    elevationDistance: number;
    transitionDuration: number;
  };
}

export interface CustomMotionDNAValues {
  personality: MotionDNAPersonality;
  intensity: number;
  duration: number; // ms
  delay: number; // ms
  playbackRate: number;
  entranceDurationMultiplier: number;
  exitDurationMultiplier: number;
  hoverDurationMultiplier: number;
  pressDurationMultiplier: number;
  distanceMultiplier: number;
  entranceEasing: string;
  exitEasing: string;
  interactionEasing: string;
  spring: MotionDNASpringConfig;
  respectReducedMotion: boolean;
}

export interface SystemCompatibilityReport {
  compatible: boolean;
  score: number; // 0 to 100
  conflicts: string[];
  recommendations: string[];
  compatibleDNA: string[];
  compatibleStyles: string[];
  rationale: string;
}

export interface DesignSystemExportBundle {
  designSystem: DesignSystemDefinition;
  motionDNA: MotionDNA;
  cssVariables: string;
  reactSnippet: string;
  combinedJson: string;
}
