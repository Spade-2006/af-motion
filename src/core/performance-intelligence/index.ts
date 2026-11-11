/**
 * AF Motion — Unified Performance Intelligence Engine
 *
 * Centralized, multi-system coordination engine harmonizing device capability detection,
 * adaptive quality control, automatic bottleneck optimization, and memory/resource intelligence.
 */

// Types & Contracts
export type {
  PerformanceDecisionCategory,
  DecisionRiskLevel,
  ResponsibleSubsystem,
  PerformanceDecision,
  DimensionHealthScore,
  PerformanceHealthScores,
  UnifiedPerformanceContext,
  ConflictResolutionResult,
  DecisionExecutionResult,
  UnifiedPerformanceReport,
  PerformanceIntelligenceOptions,
  IPerformanceIntelligence,
} from "./types.js";

// Context Aggregation
export {
  buildUnifiedPerformanceContext,
  type PerformanceIntelligenceContextSources,
} from "./context.js";

// Multi-Dimensional Health Scoring
export {
  evaluatePerformanceHealth,
  determineHealthStatus,
  HEALTH_SCORING_WEIGHTS,
} from "./scoring.js";

// Decision Policies
export {
  type DecisionPolicy,
  QUALITY_PRESET_LADDER,
  getLowerQualityPreset,
  getHigherQualityPreset,
  QualityDegradationPolicy,
  QualityRecoveryPolicy,
  CpuOptimizationPolicy,
  MemoryPruningPolicy,
  GpuOptimizationPolicy,
  SimulationAdjustmentPolicy,
  BackgroundMaintenancePolicy,
  DEFAULT_PERFORMANCE_POLICIES,
} from "./policies.js";

// Decision Generation
export { generatePerformanceDecisions } from "./decisions.js";

// Conflict Resolution
export { resolvePerformanceConflicts } from "./conflicts.js";

// History & Trend Analysis
export {
  PerformanceHistoryTracker,
  type SnapshotComparison,
} from "./history.js";

// Diagnostic Reporting
export { buildUnifiedPerformanceReport } from "./report.js";

// Coordinator & Factory
export {
  PerformanceIntelligenceCoordinator,
  createPerformanceIntelligence, defaultPerformanceIntelligence,
} from "./coordinator.js";

// React hooks/components are exposed exclusively via af-motion/react (src/react.ts).
