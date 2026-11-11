/**
 * AF Motion Design-to-Motion Generation Types (Prompt 142)
 *
 * Core data contracts for transforming natural language descriptions,
 * structured UI specifications, and design tokens into valid, production-ready
 * AF Motion animation compositions.
 */

import type { MotionComposition } from "../composition.js";
import type {
  AIMotionIntentType,
  QualityFinding,
  IntelligentMotionRecommendation,
  MotionQualityEvaluationResult,
} from "../ai-motion-intelligence/types.js";

export const DESIGN_TO_MOTION_SPEC_VERSION = "1.0.0";

export type DesignElementType =
  | "button"
  | "card"
  | "modal"
  | "dialog"
  | "navigation"
  | "header"
  | "hero"
  | "section"
  | "badge"
  | "icon"
  | "image"
  | "input"
  | "text"
  | "tooltip"
  | "drawer"
  | "list"
  | "grid"
  | "container";

export type DesignInteractionCapability =
  | "hover"
  | "press"
  | "focus"
  | "drag"
  | "magnetic"
  | "scroll"
  | "swipe";

export type MotionDNAPersonalityOption =
  | "precise"
  | "playful"
  | "elegant"
  | "energetic"
  | "editorial-flow";

export interface DesignTransformSpec {
  readonly translate?: readonly [number, number, number?];
  readonly rotate?: number;
  readonly scale?: number | readonly [number, number];
  readonly skew?: readonly [number, number];
}

export interface DesignDimensionsSpec {
  readonly width?: number | string;
  readonly height?: number | string;
  readonly aspectRatio?: number;
}

export interface DesignPositionSpec {
  readonly x?: number;
  readonly y?: number;
  readonly z?: number;
  readonly positionType?: "relative" | "absolute" | "fixed" | "sticky";
}

export interface DesignStructuredElement {
  readonly id: string;
  readonly type: DesignElementType;
  readonly name?: string;
  readonly parentId?: string;
  readonly childrenIds?: readonly string[];
  readonly dimensions?: DesignDimensionsSpec;
  readonly position?: DesignPositionSpec;
  readonly opacity?: number;
  readonly transform?: DesignTransformSpec;
  readonly color?: {
    readonly background?: string;
    readonly text?: string;
    readonly border?: string;
    readonly accent?: string;
  };
  readonly typography?: {
    readonly fontSize?: number | string;
    readonly fontWeight?: number | string;
    readonly lineHeight?: number | string;
  };
  readonly layout?: {
    readonly display?: string;
    readonly flexDir?: "row" | "column";
    readonly gap?: number;
    readonly padding?: number | readonly [number, number];
  };
  readonly interactionCapabilities?: readonly DesignInteractionCapability[];
  readonly importance?: "high" | "medium" | "low" | "background";
  readonly semanticRole?: "trigger" | "surface" | "content" | "decorative" | "overlay";
}

export interface DesignStructuredSpecification {
  readonly id: string;
  readonly title: string;
  readonly elements: readonly DesignStructuredElement[];
  readonly rootId?: string;
  readonly viewportContext?: {
    readonly width: number;
    readonly height: number;
    readonly isMobile?: boolean;
  };
}

export interface DesignTokenContext {
  readonly paletteName?: string;
  readonly paletteColors?: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
  };
  readonly motionDNA?: MotionDNAPersonalityOption;
  readonly timingMultiplier?: number;
  readonly reducedMotion?: boolean;
  readonly styleId?: string;
}

export interface DesignNaturalLanguageInput {
  readonly prompt: string;
  readonly elementContext?: Partial<DesignStructuredElement>;
  readonly categoryHint?: string;
  readonly targetStyle?: string;
}

export interface DesignToMotionInput {
  readonly naturalLanguage?: DesignNaturalLanguageInput | string;
  readonly specification?: DesignStructuredSpecification;
  readonly tokens?: DesignTokenContext;
}

export interface AnalyzedDesignElement {
  readonly id: string;
  readonly type: DesignElementType;
  readonly role: string;
  readonly visualWeight: number;
  readonly isInteractive: boolean;
  readonly isGroupParent: boolean;
  readonly isRepeated: boolean;
  readonly suggestedEntrance: string;
  readonly suggestedExit: string;
  readonly suggestedInteractions: readonly DesignInteractionCapability[];
  readonly constraints: readonly string[];
}

export interface DesignAnalysisResult {
  readonly analyzedElements: readonly AnalyzedDesignElement[];
  readonly hierarchy: {
    readonly rootIds: readonly string[];
    readonly depth: number;
    readonly groups: ReadonlyArray<{
      readonly parentId: string;
      readonly childIds: readonly string[];
      readonly sequenceType: "stagger" | "parallel" | "sequential";
    }>;
  };
  readonly inferredIntent: AIMotionIntentType;
  readonly intentConfidence: number;
  readonly evidence: readonly string[];
  readonly warnings: readonly string[];
}

export interface MotionElementPhasePlan {
  readonly properties: readonly string[];
  readonly from: Record<string, string | number>;
  readonly to: Record<string, string | number>;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly easing: string;
}

export interface MotionElementInteractionPlan {
  readonly hover?: {
    readonly properties: readonly string[];
    readonly to: Record<string, string | number>;
    readonly durationMs: number;
    readonly easing: string;
  };
  readonly press?: {
    readonly properties: readonly string[];
    readonly to: Record<string, string | number>;
    readonly durationMs: number;
    readonly easing: string;
  };
  readonly magnetic?: {
    readonly radius: number;
    readonly intensity: number;
  };
}

export interface MotionPlanElement {
  readonly elementId: string;
  readonly name?: string;
  readonly entrance?: MotionElementPhasePlan;
  readonly interaction?: MotionElementInteractionPlan;
  readonly exit?: MotionElementPhasePlan;
}

export interface MotionPlan {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly intent: AIMotionIntentType;
  readonly matchedPatternIds: readonly string[];
  readonly choreographyType: "sequential" | "staggered" | "parallel" | "parent-child" | "coordinated";
  readonly elementPlans: readonly MotionPlanElement[];
  readonly motionDNA: MotionDNAPersonalityOption;
  readonly durationMs: number;
  readonly staggerDelayMs: number;
  readonly easingCurve: string;
  readonly springConfig?: {
    readonly stiffness: number;
    readonly damping: number;
    readonly mass: number;
  };
}

export interface DesignToMotionValidation {
  readonly isValid: boolean;
  readonly qualityScore: number;
  readonly qualityGrade: string;
  readonly detailedScore: MotionQualityEvaluationResult;
  readonly findings: readonly QualityFinding[];
  readonly recommendations: readonly IntelligentMotionRecommendation[];
}

export interface DesignToMotionExportArtifacts {
  readonly reactCode: string;
  readonly vanillaCode: string;
  readonly compositionJson: string;
  readonly cssVariables: Record<string, string>;
}

export interface GeneratedMotionResult {
  readonly id: string;
  readonly sourceInput: DesignToMotionInput;
  readonly analysis: DesignAnalysisResult;
  readonly plan: MotionPlan;
  readonly composition: MotionComposition;
  readonly validation: DesignToMotionValidation;
  readonly exportArtifacts: DesignToMotionExportArtifacts;
  readonly generatedAt: number;
}

export interface DesignToMotionPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category:
    | "saas"
    | "portfolio"
    | "landing-page"
    | "ecommerce"
    | "dashboard"
    | "editorial"
    | "mobile"
    | "cards"
    | "navigation"
    | "hero";
  readonly defaultInput: DesignToMotionInput;
  readonly defaultDNA: MotionDNAPersonalityOption;
  readonly capabilities: readonly string[];
}

export interface DesignToMotionOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly fallbackDNA?: MotionDNAPersonalityOption;
  readonly autoApplyRecommendations?: boolean;
}

export interface IDesignToMotionProvider {
  readonly id: string;
  readonly name: string;
  generate(
    input: DesignToMotionInput,
    options?: DesignToMotionOptions
  ): Promise<GeneratedMotionResult>;
  generateSync(
    input: DesignToMotionInput,
    options?: DesignToMotionOptions
  ): GeneratedMotionResult;
}
