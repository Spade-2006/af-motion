/**
 * AF Motion Advanced AI Motion Intelligence Contracts
 *
 * Types for motion intent classification, multi-dimensional quality evaluation,
 * evidence-based recommendation generation, pattern knowledge bases,
 * explainability, and extensible intelligence providers.
 */

import type { MotionComposition } from "../composition.js";

export const AI_MOTION_INTELLIGENCE_VERSION = "1.0.0";

// ============================================================================
// 1. MOTION INTENT
// ============================================================================

export type AIMotionIntentType =
  | "entrance"
  | "exit"
  | "attention"
  | "emphasis"
  | "navigation"
  | "feedback"
  | "transition"
  | "loading"
  | "ambient"
  | "interaction"
  | "scroll-storytelling"
  | "spatial-movement"
  | "morphing"
  | "simulation"
  | "custom";

export interface IntentSignal {
  readonly signal: string;
  readonly weight: number;
  readonly sourceField: string;
}

export interface SecondaryIntentResult {
  readonly intent: AIMotionIntentType;
  readonly confidence: number;
  readonly reason: string;
}

export interface IntentClassificationResult {
  readonly primaryIntent: AIMotionIntentType;
  readonly confidence: number; // 0 to 1
  readonly secondaryIntents: readonly SecondaryIntentResult[];
  readonly signals: readonly IntentSignal[];
  readonly explanation: string;
}

// ============================================================================
// 2. MOTION QUALITY EVALUATION
// ============================================================================

export type QualityFindingSeverity = "critical" | "warning" | "suggestion" | "info";

export type QualityFindingCategory =
  | "timing"
  | "easing"
  | "composition"
  | "interaction"
  | "physics"
  | "performance"
  | "accessibility";

export interface QualityFinding {
  readonly id: string;
  readonly category: QualityFindingCategory;
  readonly severity: QualityFindingSeverity;
  readonly message: string;
  readonly explanation: string;
  readonly propertyRef?: string;
  readonly evidence: string;
}

export interface MotionQualityDimensions {
  readonly overall: number; // 0 to 100
  readonly timing: number;
  readonly easing: number;
  readonly composition: number;
  readonly interaction: number;
  readonly physics: number;
  readonly performance: number;
  readonly accessibility: number;
}

export type QualityGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface MotionQualityEvaluationResult {
  readonly scores: MotionQualityDimensions;
  readonly grade: QualityGrade;
  readonly findings: readonly QualityFinding[];
  readonly summary: string;
}

// ============================================================================
// 3. INTELLIGENT MOTION RECOMMENDATIONS
// ============================================================================

export type RecommendationSeverity = "critical" | "warning" | "suggestion" | "enhancement";

export type RecommendationStatus = "pending" | "accepted" | "rejected" | "applied";

export interface IntelligentMotionRecommendation {
  readonly id: string;
  readonly category: QualityFindingCategory;
  readonly severity: RecommendationSeverity;
  readonly title: string;
  readonly explanation: string;
  readonly propertyRef: string;
  readonly currentValue: unknown;
  readonly suggestedValue: unknown;
  readonly expectedBenefit: string;
  readonly confidence: number; // 0 to 1
  readonly status: RecommendationStatus;
  readonly patch?: Readonly<Record<string, unknown>>;
}

// ============================================================================
// 4. MOTION PATTERN KNOWLEDGE BASE
// ============================================================================

export interface MotionPatternDefinition {
  readonly id: string;
  readonly name: string;
  readonly intent: AIMotionIntentType;
  readonly description: string;
  readonly suitableContexts: readonly string[];
  readonly timing: {
    readonly duration: number;
    readonly delay?: number;
    readonly easing: string;
  };
  readonly performanceConsiderations: string;
  readonly accessibilityConsiderations: string;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly tags: readonly string[];
}

// ============================================================================
// 5. EXPLANATION SYSTEM
// ============================================================================

export interface IntelligenceExplanation {
  readonly summary: string;
  readonly intentRationale: readonly string[];
  readonly qualityRationale: readonly string[];
  readonly recommendationTradeOffs: readonly string[];
  readonly keySignals: readonly string[];
}

// ============================================================================
// 6. ENGINE & PROVIDER CONTRACTS
// ============================================================================

export interface MotionAnalysisInput {
  readonly id?: string;
  readonly name?: string;
  readonly configuration?: Readonly<Record<string, unknown>>;
  readonly composition?: MotionComposition;
  readonly target?: {
    readonly type?: string;
    readonly selector?: string;
  };
  readonly contextHint?: string;
  readonly reducedMotion?: boolean;
}

export interface MotionAnalysisOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly skipCache?: boolean;
  readonly targetFps?: number;
  readonly strictAccessibility?: boolean;
}

export interface MotionAnalysisResult {
  readonly targetId: string;
  readonly intents: IntentClassificationResult;
  readonly quality: MotionQualityEvaluationResult;
  readonly recommendations: readonly IntelligentMotionRecommendation[];
  readonly matchedPatterns: readonly MotionPatternDefinition[];
  readonly explanations: IntelligenceExplanation;
  readonly telemetry: {
    readonly analysisDurationMs: number;
    readonly cached: boolean;
    readonly timestamp: number;
    readonly providerId: string;
  };
}

export interface IAIMotionIntelligenceProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: readonly string[];
  analyze(
    input: MotionAnalysisInput,
    options?: MotionAnalysisOptions
  ): Promise<MotionAnalysisResult>;
}
