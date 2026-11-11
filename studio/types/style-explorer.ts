/**
 * AF Motion Studio — Visual Style Explorer Type Definitions
 *
 * Types for style catalog discovery, live component preview,
 * interactive customization, side-by-side comparison, and design intelligence.
 */

import type { VisualStyleCategory, VisualStyleDefinition } from "../../src/catalogue.js";

export type StylePreviewComponentKind =
  | "button"
  | "card"
  | "input"
  | "panel"
  | "badge"
  | "typography";

export type StyleExplorerViewMode = "explore" | "compare" | "intelligence" | "export";

export interface StyleCustomizationValues {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  borderRadius?: number; // px
  borderWidth?: number; // px
  elevation?: number; // 0 to 1 multiplier for shadows/depth
  fontScale?: number; // 0.8 to 1.4 multiplier
}

export interface ComputedComponentStyle {
  background: string;
  color: string;
  border?: string;
  borderRadius?: string;
  boxShadow?: string;
  textShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  padding?: string;
  backdropFilter?: string;
  transform?: string;
  transition?: string;
}

export interface StyleComparisonData {
  primaryStyle: VisualStyleDefinition;
  comparisonStyle: VisualStyleDefinition;
  primaryComputed: Record<StylePreviewComponentKind, ComputedComponentStyle>;
  comparisonComputed: Record<StylePreviewComponentKind, ComputedComponentStyle>;
}

export interface StyleIntelligenceResult {
  query: string;
  recommendedStyleIds: string[];
  rationale: string;
  compatibleMotionDNA: string[];
  compatibleDesignSystems: string[];
  conflicts: string[];
}
