/**
 * AF Motion Animation Intelligence Contracts
 *
 * Types for component-aware animation selection, motion intent classification,
 * deterministic scoring, accessibility/performance evaluation, and motion planning.
 */

import type { AnimatableProperties } from "../animate.js";
import type { MotionDNA, MotionDNAPersonality } from "../motion-dna.js";
import type { DesignSystem } from "../design-system.js";

export const ANIMATION_INTELLIGENCE_VERSION = "1.0.0";

export type ComponentCategory =
  | "button"
  | "card"
  | "navigation"
  | "modal"
  | "menu"
  | "form"
  | "media"
  | "typography"
  | "chart"
  | "background"
  | "3d-object"
  | "custom";

export const COMPONENT_CATEGORIES: readonly ComponentCategory[] = [
  "button",
  "card",
  "navigation",
  "modal",
  "menu",
  "form",
  "media",
  "typography",
  "chart",
  "background",
  "3d-object",
  "custom",
] as const;

export type MotionIntent =
  | "attention"
  | "feedback"
  | "navigation"
  | "disclosure"
  | "emphasis"
  | "celebration"
  | "loading"
  | "progress"
  | "discovery"
  | "transition"
  | "storytelling"
  | "ambient";

export const MOTION_INTENTS: readonly MotionIntent[] = [
  "attention",
  "feedback",
  "navigation",
  "disclosure",
  "emphasis",
  "celebration",
  "loading",
  "progress",
  "discovery",
  "transition",
  "storytelling",
  "ambient",
] as const;

export type AnimationTrigger =
  | "entrance"
  | "exit"
  | "hover"
  | "focus"
  | "press"
  | "continuous"
  | "interaction";

export const ANIMATION_TRIGGERS: readonly AnimationTrigger[] = [
  "entrance",
  "exit",
  "hover",
  "focus",
  "press",
  "continuous",
  "interaction",
] as const;

export type AnimationFamily =
  | "fade"
  | "slide"
  | "scale"
  | "lift"
  | "pulse"
  | "bounce"
  | "shake"
  | "glow"
  | "tilt"
  | "flip"
  | "morph"
  | "float";

export interface PerformanceSuitability {
  readonly hardwareTier: "low" | "medium" | "high";
  readonly gpuAccelerated: boolean;
  readonly compositeOnly: boolean;
  readonly estimatedFpsImpact: "negligible" | "low" | "moderate" | "high";
}

export interface AccessibilityCompatibility {
  readonly supportsReducedMotion: boolean;
  readonly reducedMotionFallback: string;
  readonly screenReaderSafe: boolean;
  readonly highContrastSafe: boolean;
}

export interface SelectionRationale {
  readonly intentMatch: string;
  readonly componentContext: string;
  readonly styleAlignment: string;
  readonly dnaInfluence: string;
  readonly summary: string;
}

export interface AnimationRecommendation {
  readonly id: string;
  readonly name: string;
  readonly family: AnimationFamily;
  readonly presetId?: string;
  readonly properties: Readonly<AnimatableProperties>;
  readonly duration: number; // in milliseconds
  readonly delay: number; // in milliseconds
  readonly easing: string;
  readonly trigger: AnimationTrigger;
  readonly intent: MotionIntent;
  readonly componentType: ComponentCategory;
  readonly compatibilityScore: number; // 0 to 100
  readonly performanceSuitability: PerformanceSuitability;
  readonly accessibilityCompatibility: AccessibilityCompatibility;
  readonly selectionRationale: SelectionRationale;
}

export interface AnimationSelectionContext {
  readonly componentType: ComponentCategory;
  readonly intent: MotionIntent;
  readonly trigger?: AnimationTrigger;
  readonly visualStyle?: string;
  readonly motionDNA?: MotionDNA | MotionDNAPersonality | string;
  readonly designSystem?: DesignSystem | string;
  readonly reducedMotion?: boolean;
  readonly targetAudience?: string;
  readonly deviceTier?: "low" | "medium" | "high";
  readonly existingAnimations?: readonly string[];
  readonly customRequirements?: Record<string, unknown>;
}

export interface AnimationRecommendationResult {
  readonly selected: AnimationRecommendation;
  readonly alternatives: readonly AnimationRecommendation[];
  readonly compatibilityScore: number;
  readonly conflictWarnings: readonly string[];
  readonly context: AnimationSelectionContext;
}

export interface ComponentMotionPlan {
  readonly componentType: ComponentCategory;
  readonly visualStyle?: string;
  readonly overallCompatibility: number;
  readonly entrance?: AnimationRecommendation;
  readonly exit?: AnimationRecommendation;
  readonly hover?: AnimationRecommendation;
  readonly focus?: AnimationRecommendation;
  readonly press?: AnimationRecommendation;
  readonly ambient?: AnimationRecommendation;
  readonly conflicts: readonly string[];
}

export interface ClassifiedIntentResult {
  readonly intent: MotionIntent;
  readonly confidence: number;
  readonly matchedKeywords: readonly string[];
  readonly inferredFromComponent?: boolean;
}
