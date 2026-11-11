/**
 * AF Motion Unified Motion Optimization & Validation Contracts
 *
 * Framework-independent contracts for validating animation configurations,
 * accessibility compliance, performance profiling, and consistency analysis.
 */

export const MOTION_VALIDATION_VERSION = "1.0.0";

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssueCategory =
  | "layout-thrashing"
  | "expensive-filter"
  | "excessive-duration"
  | "excessive-intensity"
  | "reduced-motion-violation"
  | "accessibility-risk"
  | "seizure-risk"
  | "property-conflict"
  | "timing-inconsistency"
  | "dna-contradiction"
  | "unsupported-capability"
  | "lifecycle-risk";

export interface MotionValidationIssue {
  readonly id: string;
  readonly severity: ValidationSeverity;
  readonly category: ValidationIssueCategory;
  readonly property?: string;
  readonly path?: string;
  readonly message: string;
  readonly suggestedFix?: string;
  readonly autoFixable: boolean;
}

export interface MotionValidationResult {
  readonly valid: boolean;
  readonly score: number;              // 0 to 100 overall health
  readonly accessibilityScore: number; // 0 to 100
  readonly performanceScore: number;   // 0 to 100
  readonly consistencyScore: number;   // 0 to 100
  readonly issues: readonly MotionValidationIssue[];
  readonly summary: string;
}

export type OptimizationLevel = "safe" | "balanced" | "aggressive";

export interface MotionOptimizationOptions {
  readonly level?: OptimizationLevel;
  readonly deviceTier?: "low" | "medium" | "high";
  readonly reducedMotion?: boolean;
  readonly targetFPS?: 30 | 60 | 120;
}

export interface MotionOptimizationResult<T = any> {
  readonly optimizedConfig: T;
  readonly originalConfig: T;
  readonly level: OptimizationLevel;
  readonly appliedOptimizations: readonly string[];
  readonly remainingTradeoffs: readonly string[];
  readonly validationBefore: MotionValidationResult;
  readonly validationAfter: MotionValidationResult;
}

export interface MotionConsistencyReport {
  readonly consistencyScore: number; // 0 to 100
  readonly durationHarmonic: boolean;
  readonly easingAligned: boolean;
  readonly dnaAligned: boolean;
  readonly styleAligned: boolean;
  readonly issues: readonly MotionValidationIssue[];
  readonly recommendations: readonly string[];
}
