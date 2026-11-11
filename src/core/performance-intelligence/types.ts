/**
 * AF Motion — Unified Performance Intelligence Engine Types
 *
 * Types, interfaces, health scoring models, decision taxonomy, conflict resolution
 * specifications, and diagnostic reporting structures for centralized performance coordination.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import type { QualityProfile, QualityPresetName } from "../adaptive-quality/types.js";
import type {
  BottleneckAnalysisReport,
  AppliedOptimizationRecord,
  PerformanceSnapshot,
  OptimizationStrategyId,
} from "../performance-optimizer/types.js";
import type {
  MemorySnapshot,
  MemoryPressureLevel,
  ResourceIntelligenceReport,
} from "../resource-intelligence/types.js";

/**
 * High-level decision categories supported by the Performance Intelligence Engine.
 */
export type PerformanceDecisionCategory =
  | "maintain"
  | "reduce_quality"
  | "increase_quality"
  | "optimize_cpu"
  | "optimize_memory"
  | "optimize_gpu"
  | "adjust_simulation"
  | "release_resources"
  | "switch_backend"
  | "user_intervention";

/**
 * Performance decision risk rating.
 */
export type DecisionRiskLevel = "low" | "medium" | "high";

/**
 * Subsystem responsible for executing a decision.
 */
export type ResponsibleSubsystem = "quality" | "optimizer" | "resource" | "runtime";

export type PerformanceQualityPreset = QualityPresetName | "low" | "medium";

/**
 * Discrete decision proposed by the decision engine.
 */
export interface PerformanceDecision {
  readonly id: string;
  readonly category: PerformanceDecisionCategory;
  readonly reason: string;
  readonly supportingSignals: readonly string[];
  readonly priority: number; // 1 (lowest) to 10 (highest/critical)
  readonly expectedBenefit: string;
  readonly riskLevel: DecisionRiskLevel;
  readonly isReversible: boolean;
  readonly confidence: number; // 0 to 1
  readonly requiredSubsystem: ResponsibleSubsystem;
  readonly strategyId?: OptimizationStrategyId | (string & {});
  readonly targetPreset?: PerformanceQualityPreset;
  readonly payload?: Readonly<Record<string, any>>;
}

/**
 * Dimensional health score with confidence and explanatory rationale.
 */
export interface DimensionHealthScore {
  readonly score: number; // 0 to 100
  readonly status: "optimal" | "acceptable" | "degraded" | "critical";
  readonly confidence: number; // 0 to 1
  readonly rationale: string;
}

/**
 * Consolidated multi-dimensional performance health scores.
 */
export interface PerformanceHealthScores {
  readonly timestamp: number;
  readonly cpuHealth: DimensionHealthScore;
  readonly gpuHealth: DimensionHealthScore;
  readonly memoryHealth: DimensionHealthScore;
  readonly renderingHealth: DimensionHealthScore;
  readonly simulationHealth: DimensionHealthScore;
  readonly resourceHealth: DimensionHealthScore;
  readonly overallHealth: DimensionHealthScore;
  readonly hardwareCapabilityVsRuntimeHealth: {
    readonly capabilityScore: number;
    readonly runtimeHealthScore: number;
    readonly divergenceRationale: string;
  };
}

/**
 * Centralized snapshot of the entire AF Motion performance state.
 */
export interface UnifiedPerformanceContext {
  readonly timestamp: number;

  // 1. Device Capabilities (Prompt 130)
  readonly deviceCategory: string;
  readonly capabilityScores: {
    cpu: number;
    memory: number;
    gpu: number;
    composite: number;
  };
  readonly activeBackend: string;
  readonly isReducedMotion: boolean;

  // 2. Adaptive Quality (Prompt 131)
  readonly activeQualityPreset: QualityPresetName;
  readonly isQualityLocked: boolean;
  readonly resolutionScale: number;
  readonly dpr: number;

  // 3. Performance Metrics (Prompt 131/132)
  readonly fps: number;
  readonly frameDurationMs: number;
  readonly frameTimeVariance: number;
  readonly frameDrops: number;
  readonly longTasksCount: number;

  // 4. Bottlenecks & Optimization (Prompt 132)
  readonly dominantBottleneck: string;
  readonly activeOptimizationsCount: number;
  readonly activeOptimizationIds: readonly string[];

  // 5. Memory & Resources (Prompt 133)
  readonly totalTrackedResources: number;
  readonly estimatedMemoryBytes: number;
  readonly memoryPressureLevel: MemoryPressureLevel;
  readonly budgetUtilizationRatio: number;

  // 6. Runtime Environment & Telemetry
  readonly isVisible: boolean;
  readonly batteryLevel?: number;
  readonly isBatteryCharging?: boolean;
  readonly isDataSaver: boolean;
}

/**
 * Conflict detection and resolution report.
 */
export interface ConflictResolutionResult {
  readonly hasConflict: boolean;
  readonly conflictsDetected: readonly {
    readonly decisionA: PerformanceDecision;
    readonly decisionB: PerformanceDecision;
    readonly conflictType: string;
    readonly resolution: string;
  }[];
  readonly resolvedDecisions: readonly PerformanceDecision[];
}

/**
 * Execution result for an applied decision.
 */
export interface DecisionExecutionResult {
  readonly decisionId: string;
  readonly success: boolean;
  readonly executedAt: number;
  readonly error?: string;
  readonly changesApplied: readonly string[];
}

/**
 * Unified diagnostic performance report suitable for JSON export without circular references.
 */
export interface UnifiedPerformanceReport {
  readonly generatedAt: string;
  readonly timestamp: number;
  readonly device: {
    readonly category: string;
    readonly activeBackend: string;
    readonly capabilityScore: number;
  };
  readonly runtime: {
    readonly fps: number;
    readonly frameDurationMs: number;
    readonly frameTimeVariance: number;
    readonly frameDrops: number;
    readonly isVisible: boolean;
  };
  readonly memory: {
    readonly trackedResources: number;
    readonly estimatedMemoryMB: number;
    readonly pressureLevel: MemoryPressureLevel;
    readonly budgetUtilizationPct: number;
  };
  readonly optimization: {
    readonly activePreset: QualityPresetName;
    readonly dominantBottleneck: string;
    readonly activeOptimizations: readonly string[];
    readonly pendingDecisionsCount: number;
  };
  readonly health: {
    readonly overallScore: number;
    readonly status: string;
    readonly cpuScore: number;
    readonly gpuScore: number;
    readonly memoryScore: number;
    readonly renderingScore: number;
    readonly simulationScore: number;
    readonly resourceScore: number;
  };
  readonly recommendations: readonly string[];
}

/**
 * Configuration options for initializing Unified Performance Intelligence.
 */
export interface PerformanceIntelligenceOptions {
  autoStart?: boolean;
  evaluationIntervalMs?: number; // default 2000ms
  historyCapacity?: number; // default 60
  conflictResolutionPrecedence?: "safety" | "performance" | "quality";
}

/**
 * Contract for Unified Performance Intelligence Coordinator.
 */
export interface IPerformanceIntelligence {
  readonly isRunning: boolean;
  readonly context: UnifiedPerformanceContext;
  readonly health: PerformanceHealthScores;

  start(): void;
  pause(): void;
  resume(): void;
  refresh(): UnifiedPerformanceContext;

  evaluateHealth(): PerformanceHealthScores;
  generateDecisions(): readonly PerformanceDecision[];
  resolveConflicts(decisions?: readonly PerformanceDecision[]): ConflictResolutionResult;
  applyDecisions(decisions?: readonly PerformanceDecision[]): Promise<readonly DecisionExecutionResult[]>;

  getHistory(): readonly UnifiedPerformanceContext[];
  compareSnapshots(
    before: UnifiedPerformanceContext,
    after: UnifiedPerformanceContext
  ): {
    fpsDelta: number;
    frameDurationDeltaMs: number;
    memoryDeltaMB: number;
    improved: boolean;
    summary: string;
  };

  getReport(): UnifiedPerformanceReport;
  reset(): void;
  dispose(): void;
}
