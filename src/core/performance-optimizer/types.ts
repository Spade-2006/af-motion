/**
 * AF Motion — Automatic Performance Optimization Engine Types
 *
 * Interfaces, metric classifications, bottleneck taxonomy, optimization candidates,
 * worker execution contracts, and optimization history.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import type { IAdaptiveQualityController, PerformanceMetrics } from "../adaptive-quality/types.js";

/**
 * Metric measurement status.
 */
export type MetricMeasurementStatus = "measured" | "estimated" | "unsupported";

/**
 * Value tagged with measurement integrity, status, and confidence.
 */
export interface PerformanceMetricValue<T> {
  readonly value: T;
  readonly status: MetricMeasurementStatus;
  readonly confidence: number; // 0 to 1
  readonly timestamp: number;
}

/**
 * Comprehensive performance snapshot representing a point-in-time profiling capture.
 */
export interface PerformanceSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly sessionDurationMs: number;

  // Frame and Scheduling Timing
  readonly frameDurationMs: PerformanceMetricValue<number>;
  readonly fps: PerformanceMetricValue<number>;
  readonly animationUpdateMs: PerformanceMetricValue<number>;
  readonly simulationDurationMs: PerformanceMetricValue<number>;
  readonly renderSubmissionMs: PerformanceMetricValue<number>;
  readonly geometryProcessingMs: PerformanceMetricValue<number>;
  readonly modelLoadingMs: PerformanceMetricValue<number>;

  // GPU & Memory
  readonly gpuExecutionMs: PerformanceMetricValue<number>;
  readonly isGpuTimingSupported: boolean;
  readonly memoryAllocationRateKBPerFrame: PerformanceMetricValue<number>;
  readonly estimatedHeapUsedMB: PerformanceMetricValue<number>;
  readonly resourceUtilizationRatio: PerformanceMetricValue<number>; // 0 to 1

  // Workload and Event Pressure
  readonly longTasksCount: PerformanceMetricValue<number>;
  readonly eventProcessingMs: PerformanceMetricValue<number>;
  readonly repeatedCalculationsCount: PerformanceMetricValue<number>;
  readonly activeWorkloadItems: number;
}

/**
 * Bottleneck classification categories.
 */
export type BottleneckCategory = "cpu" | "gpu" | "memory" | "simulation";

/**
 * Bottleneck severity levels.
 */
export type BottleneckSeverity = "low" | "medium" | "high" | "critical";

/**
 * Identified performance bottleneck descriptor.
 */
export interface BottleneckItem {
  readonly id: string;
  readonly category: BottleneckCategory;
  readonly severity: BottleneckSeverity;
  readonly title: string;
  readonly description: string;
  readonly confidence: number; // 0 to 1
  readonly isHardwareConfirmed: boolean; // false if based on estimated values
  readonly primaryMetric: string;
  readonly metricValue: number;
  readonly threshold: number;
  readonly recommendedAction: string;
}

/**
 * Consolidated bottleneck analysis report.
 */
export interface BottleneckAnalysisReport {
  readonly timestamp: number;
  readonly bottlenecks: readonly BottleneckItem[];
  readonly dominantBottleneckCategory: BottleneckCategory | "none";
  readonly overallHealthScore: number; // 0 to 100
  readonly summary: string;
  readonly recommendations: readonly string[];
}

/**
 * Optimization operational categories.
 */
export type OptimizationCategory = "cpu" | "memory" | "gpu" | "simulation" | "worker";

/**
 * Optimization orchestration modes.
 */
export type OptimizationMode = "conservative" | "balanced" | "aggressive" | "custom";

/**
 * Unique identifier for registered optimization strategies.
 */
export type OptimizationStrategyId =
  | "cpu_batch_operations"
  | "cpu_memoize_math"
  | "cpu_spatial_query_throttle"
  | "cpu_chunk_large_workloads"
  | "mem_recycle_typed_arrays"
  | "mem_lru_cache_trimming"
  | "mem_dispose_stale_resources"
  | "gpu_recommend_instancing"
  | "gpu_shader_variant_deduplication"
  | "gpu_texture_mip_clamping"
  | "sim_adaptive_particle_batching"
  | "sim_fluid_iteration_damping"
  | "sim_physics_sleeping_enhancement"
  | "sim_visibility_culling"
  | "worker_offload_geometry";

/**
 * Candidate optimization recommended by the engine.
 */
export interface OptimizationCandidate {
  readonly id: OptimizationStrategyId;
  readonly category: OptimizationCategory;
  readonly title: string;
  readonly description: string;
  readonly targetBottleneckId: string;
  readonly safetyScore: number; // 0 to 1 (1 = 100% safe, no visual/correctness side effects)
  readonly estimatedBenefitMs: number;
  readonly minModeRequired: OptimizationMode;
  readonly isCompatible: boolean;
  readonly incompatibilities: readonly string[];
}

/**
 * Record of an applied optimization action and its verification outcome.
 */
export interface AppliedOptimizationRecord {
  readonly id: string;
  readonly strategyId: OptimizationStrategyId;
  readonly category: OptimizationCategory;
  readonly appliedAt: number;
  readonly baselineFps: number;
  readonly baselineFrameDurationMs: number;
  readonly postFps?: number;
  readonly postFrameDurationMs?: number;
  readonly status: "applied" | "verified_improved" | "verified_neutral" | "rolled_back" | "failed";
  readonly deltaFrameDurationMs?: number;
  readonly rollbackReason?: string;
}

/**
 * Configuration options for the Performance Profiler.
 */
export interface PerformanceProfilerOptions {
  samplingWindowSize?: number; // default 60
  enableDetailedTimers?: boolean;
  isGpuTimingSupported?: boolean;
  onSnapshot?: (snapshot: PerformanceSnapshot) => void;
}

/**
 * Configuration options for the Automatic Performance Optimizer.
 */
export interface PerformanceOptimizerOptions {
  mode?: OptimizationMode;
  enabledCategories?: ReadonlySet<OptimizationCategory> | readonly OptimizationCategory[];
  deviceProfile?: DeviceCapabilityProfile;
  adaptiveQualityController?: IAdaptiveQualityController;
  verificationWindowFrames?: number; // default 30
  autoRollbackHarmful?: boolean; // default true
  maxActiveOptimizations?: number; // default 10
  profilerOptions?: PerformanceProfilerOptions;
}

/**
 * Worker task execution priority.
 */
export type WorkerTaskPriority = "low" | "medium" | "high" | "critical";

/**
 * Task definition submitted to WorkerTaskManager.
 */
export interface WorkerTaskDefinition<TInput = any, TOutput = any> {
  readonly id: string;
  readonly type: string;
  readonly priority?: WorkerTaskPriority;
  readonly payload: TInput;
  readonly transferables?: readonly Transferable[];
  readonly signal?: AbortSignal;
  readonly computeFallback?: (payload: TInput) => Promise<TOutput> | TOutput;
}

/**
 * Result returned from WorkerTaskManager.
 */
export interface WorkerTaskResult<TOutput = any> {
  readonly taskId: string;
  readonly success: boolean;
  readonly data?: TOutput;
  readonly error?: string;
  readonly executionTimeMs: number;
  readonly executedInWorker: boolean;
}

/**
 * Contract for worker task scheduler.
 */
export interface IWorkerTaskManager {
  readonly isWorkerSupported: boolean;
  readonly activeWorkerCount: number;
  readonly queuedTaskCount: number;
  executeTask<TInput, TOutput>(task: WorkerTaskDefinition<TInput, TOutput>): Promise<WorkerTaskResult<TOutput>>;
  cancelTask(taskId: string): boolean;
  dispose(): void;
}

/**
 * Public interface of Performance Profiler.
 */
export interface IPerformanceProfiler {
  readonly isProfilingActive: boolean;
  readonly latestSnapshot: PerformanceSnapshot | null;
  startSession(label?: string): void;
  stopSession(): PerformanceSnapshot | null;
  captureSnapshot(manualInputs?: Partial<PerformanceSnapshot>): PerformanceSnapshot;
  getHistoricalSnapshots(): readonly PerformanceSnapshot[];
  getAverageMetrics(): {
    avgFps: number;
    avgFrameDurationMs: number;
    avgSimMs: number;
    avgRenderMs: number;
  };
  reset(): void;
  dispose(): void;
}

/**
 * Public interface of Automatic Performance Optimizer.
 */
export interface IPerformanceOptimizer {
  readonly mode: OptimizationMode;
  readonly profiler: IPerformanceProfiler;
  readonly activeOptimizations: readonly AppliedOptimizationRecord[];
  readonly bottleneckReport: BottleneckAnalysisReport;

  setMode(mode: OptimizationMode): void;
  setCategoryEnabled(category: OptimizationCategory, enabled: boolean): void;
  isCategoryEnabled(category: OptimizationCategory): boolean;

  analyzeBottlenecks(): BottleneckAnalysisReport;
  recommendOptimizations(): readonly OptimizationCandidate[];
  applyOptimization(strategyId: OptimizationStrategyId): Promise<AppliedOptimizationRecord>;
  rollbackOptimization(strategyId: OptimizationStrategyId, reason?: string): boolean;
  rollbackAllOptimizations(reason?: string): void;

  getOptimizationHistory(): readonly AppliedOptimizationRecord[];
  getPerformanceReport(): {
    bottlenecks: BottleneckAnalysisReport;
    activeOptimizations: readonly AppliedOptimizationRecord[];
    latestSnapshot: PerformanceSnapshot | null;
    recommendations: readonly OptimizationCandidate[];
  };

  dispose(): void;
}
