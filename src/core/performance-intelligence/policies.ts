/**
 * AF Motion — Unified Performance Intelligence Policies
 *
 * Rule definitions and threshold criteria for generating performance decisions
 * across quality scaling, resource management, bottleneck mitigation, and simulation tuning.
 */

import type {
  UnifiedPerformanceContext,
  PerformanceHealthScores,
  PerformanceDecision,
  PerformanceDecisionCategory,
  DecisionRiskLevel,
  ResponsibleSubsystem,
  PerformanceQualityPreset,
} from "./types.js";
import type { QualityPresetName } from "../adaptive-quality/types.js";

export interface DecisionPolicy {
  readonly id: string;
  readonly category: PerformanceDecisionCategory;
  readonly name: string;
  readonly description: string;
  readonly evaluate: (
    ctx: UnifiedPerformanceContext,
    health: PerformanceHealthScores
  ) => PerformanceDecision | null;
}

/**
 * Quality preset hierarchy for progressive stepping.
 */
export const QUALITY_PRESET_LADDER: readonly PerformanceQualityPreset[] = [
  "low",
  "medium",
  "high",
  "ultra",
];

/**
 * Helper to step quality down one notch.
 */
export function getLowerQualityPreset(
  current: PerformanceQualityPreset
): PerformanceQualityPreset | null {
  const idx = QUALITY_PRESET_LADDER.indexOf(current);
  if (idx > 0) {
    return QUALITY_PRESET_LADDER[idx - 1];
  }
  return null;
}

/**
 * Helper to step quality up one notch.
 */
export function getHigherQualityPreset(
  current: PerformanceQualityPreset
): PerformanceQualityPreset | null {
  const idx = QUALITY_PRESET_LADDER.indexOf(current);
  if (idx >= 0 && idx < QUALITY_PRESET_LADDER.length - 1) {
    return QUALITY_PRESET_LADDER[idx + 1];
  }
  return null;
}

/**
 * 1. Critical Frame Drop & Rendering Policy: Degrade quality when frame health is degraded/critical.
 */
export const QualityDegradationPolicy: DecisionPolicy = {
  id: "policy_quality_degrade",
  category: "reduce_quality",
  name: "Adaptive Quality Downgrade",
  description: "Reduces visual quality when rendering health is degraded and quality is not locked.",
  evaluate: (ctx, health) => {
    if (ctx.isQualityLocked) return null;
    if (health.renderingHealth.status === "degraded" || health.renderingHealth.status === "critical") {
      const lower = getLowerQualityPreset(ctx.activeQualityPreset);
      if (lower) {
        return {
          id: `dec_quality_degrade_${Date.now()}`,
          category: "reduce_quality",
          reason: `Rendering health is ${health.renderingHealth.status} (score: ${health.renderingHealth.score.toFixed(1)}). FPS: ${ctx.fps.toFixed(1)}.`,
          supportingSignals: [
            `FPS: ${ctx.fps.toFixed(1)}`,
            `FrameDrops: ${ctx.frameDrops}`,
            `DominantBottleneck: ${ctx.dominantBottleneck}`,
          ],
          priority: health.renderingHealth.status === "critical" ? 8 : 6,
          expectedBenefit: `Recovers 15-30% frame budget by downgrading preset from ${ctx.activeQualityPreset} to ${lower}.`,
          riskLevel: "low",
          isReversible: true,
          confidence: Math.max(0.7, 1 - health.renderingHealth.score / 100),
          requiredSubsystem: "quality",
          targetPreset: lower,
        };
      }
    }
    return null;
  },
};

/**
 * 2. Quality Recovery Policy: Promotes quality when stable frame headroom exists.
 */
export const QualityRecoveryPolicy: DecisionPolicy = {
  id: "policy_quality_recover",
  category: "increase_quality",
  name: "Adaptive Quality Recovery",
  description: "Promotes visual quality when runtime health is optimal and headroom is sustained.",
  evaluate: (ctx, health) => {
    if (ctx.isQualityLocked) return null;
    // Disallow quality recovery under elevated memory pressure
    if (ctx.memoryPressureLevel === "high" || ctx.memoryPressureLevel === "critical") return null;
    // Disallow if battery is low or not charging and level < 25%
    if (ctx.batteryLevel !== undefined && ctx.batteryLevel < 0.25 && !ctx.isBatteryCharging) return null;

    if (
      health.overallHealth.score >= 85 &&
      health.renderingHealth.score >= 88 &&
      ctx.fps >= 55 &&
      ctx.frameDrops === 0
    ) {
      const higher = getHigherQualityPreset(ctx.activeQualityPreset);
      if (higher) {
        return {
          id: `dec_quality_recover_${Date.now()}`,
          category: "increase_quality",
          reason: `System health is optimal (${health.overallHealth.score.toFixed(1)}/100) with stable ${ctx.fps.toFixed(1)} FPS and no frame drops.`,
          supportingSignals: [
            `FPS: ${ctx.fps.toFixed(1)}`,
            `RenderingHealth: ${health.renderingHealth.score.toFixed(1)}`,
            `MemoryPressure: ${ctx.memoryPressureLevel}`,
          ],
          priority: 3,
          expectedBenefit: `Enables richer visual fidelity by promoting preset from ${ctx.activeQualityPreset} to ${higher}.`,
          riskLevel: "medium",
          isReversible: true,
          confidence: 0.85,
          requiredSubsystem: "quality",
          targetPreset: higher,
        };
      }
    }
    return null;
  },
};

/**
 * 3. CPU Bottleneck & Animation Throttling Policy.
 */
export const CpuOptimizationPolicy: DecisionPolicy = {
  id: "policy_optimize_cpu",
  category: "optimize_cpu",
  name: "CPU Bottleneck Mitigation",
  description: "Throttles animation tick complexity or switches to tick decimation when CPU health is degraded.",
  evaluate: (ctx, health) => {
    if (
      health.cpuHealth.status === "degraded" ||
      health.cpuHealth.status === "critical" ||
      ctx.dominantBottleneck === "cpu"
    ) {
      return {
        id: `dec_cpu_opt_${Date.now()}`,
        category: "optimize_cpu",
        reason: `CPU health is ${health.cpuHealth.status} (${health.cpuHealth.score.toFixed(1)}/100) with dominant bottleneck "${ctx.dominantBottleneck}".`,
        supportingSignals: [
          `LongTasks: ${ctx.longTasksCount}`,
          `FrameTimeVariance: ${ctx.frameTimeVariance.toFixed(2)}ms`,
        ],
        priority: health.cpuHealth.status === "critical" ? 8 : 5,
        expectedBenefit: "Reduces main thread animation work by decimation or batching.",
        riskLevel: "low",
        isReversible: true,
        confidence: 0.8,
        requiredSubsystem: "optimizer",
        strategyId: "frame-rate-throttling",
      };
    }
    return null;
  },
};

/**
 * 4. Memory Pressure & Resource Pruning Policy.
 */
export const MemoryPruningPolicy: DecisionPolicy = {
  id: "policy_prune_memory",
  category: "release_resources",
  name: "Emergency Memory Pruning",
  description: "Triggers eviction of unreferenced caches and pools when memory pressure is high or critical.",
  evaluate: (ctx, health) => {
    if (ctx.memoryPressureLevel === "high" || ctx.memoryPressureLevel === "critical") {
      const isCritical = ctx.memoryPressureLevel === "critical";
      return {
        id: `dec_prune_mem_${Date.now()}`,
        category: "release_resources",
        reason: `Memory pressure is ${ctx.memoryPressureLevel.toUpperCase()} with estimated ${(ctx.estimatedMemoryBytes / (1024 * 1024)).toFixed(1)} MB active.`,
        supportingSignals: [
          `MemoryPressure: ${ctx.memoryPressureLevel}`,
          `BudgetUtilization: ${(ctx.budgetUtilizationRatio * 100).toFixed(1)}%`,
          `TrackedResources: ${ctx.totalTrackedResources}`,
        ],
        priority: isCritical ? 10 : 7,
        expectedBenefit: "Reclaims GPU/heap memory from unused textures, geometry pools, and caches.",
        riskLevel: isCritical ? "medium" : "low",
        isReversible: false,
        confidence: 0.95,
        requiredSubsystem: "resource",
        payload: {
          aggressive: isCritical,
        },
      };
    }
    return null;
  },
};

/**
 * 5. GPU Shading & Resolution Scaling Policy.
 */
export const GpuOptimizationPolicy: DecisionPolicy = {
  id: "policy_optimize_gpu",
  category: "optimize_gpu",
  name: "GPU Workload Reduction",
  description: "Scales down render resolution or simplifies shader passes when GPU is the primary bottleneck.",
  evaluate: (ctx, health) => {
    if (
      (health.gpuHealth.status === "degraded" || health.gpuHealth.status === "critical") &&
      ctx.dominantBottleneck === "gpu"
    ) {
      return {
        id: `dec_gpu_opt_${Date.now()}`,
        category: "optimize_gpu",
        reason: `GPU health is ${health.gpuHealth.status} (${health.gpuHealth.score.toFixed(1)}/100) under GPU bottleneck.`,
        supportingSignals: [
          `ResolutionScale: ${ctx.resolutionScale}`,
          `ActiveBackend: ${ctx.activeBackend}`,
        ],
        priority: 7,
        expectedBenefit: "Relieves fill rate and fragment shader pressure by capping dynamic resolution.",
        riskLevel: "low",
        isReversible: true,
        confidence: 0.85,
        requiredSubsystem: "quality",
        strategyId: "resolution-scaling",
      };
    }
    return null;
  },
};

/**
 * 6. Simulation Fidelity Adjustment Policy.
 * Note: Simulation throttling MUST NOT compromise simulation correctness invariants.
 */
export const SimulationAdjustmentPolicy: DecisionPolicy = {
  id: "policy_adjust_sim",
  category: "adjust_simulation",
  name: "Simulation Sub-step Moderation",
  description: "Moderates simulation sub-steps or particle collision queries while maintaining physics stability.",
  evaluate: (ctx, health) => {
    if (health.simulationHealth.status === "degraded" || health.simulationHealth.status === "critical") {
      return {
        id: `dec_sim_adj_${Date.now()}`,
        category: "adjust_simulation",
        reason: `Simulation health is ${health.simulationHealth.status} (${health.simulationHealth.score.toFixed(1)}/100).`,
        supportingSignals: [
          `DominantBottleneck: ${ctx.dominantBottleneck}`,
          `SimulationScore: ${health.simulationHealth.score.toFixed(1)}`,
        ],
        priority: 6,
        expectedBenefit: "Balances physics solver sub-steps without violating solver convergence.",
        riskLevel: "medium",
        isReversible: true,
        confidence: 0.75,
        requiredSubsystem: "optimizer",
        strategyId: "physics-substepping",
      };
    }
    return null;
  },
};

/**
 * 7. Background Visibility Maintenance Policy.
 */
export const BackgroundMaintenancePolicy: DecisionPolicy = {
  id: "policy_bg_maintain",
  category: "maintain",
  name: "Hidden Tab Idle Maintenance",
  description: "Freezes or throttles background animations when tab is hidden.",
  evaluate: (ctx) => {
    if (!ctx.isVisible) {
      return {
        id: `dec_bg_idle_${Date.now()}`,
        category: "maintain",
        reason: "Document is currently hidden. Throttling execution loop to minimum idle rate.",
        supportingSignals: ["isVisible: false"],
        priority: 9,
        expectedBenefit: "Conserves 95% CPU/GPU and battery power while tab is inactive.",
        riskLevel: "low",
        isReversible: true,
        confidence: 1.0,
        requiredSubsystem: "runtime",
        payload: { idle: true },
      };
    }
    return null;
  },
};

/**
 * Default standard decision policy set.
 */
export const DEFAULT_PERFORMANCE_POLICIES: readonly DecisionPolicy[] = [
  BackgroundMaintenancePolicy,
  MemoryPruningPolicy,
  QualityDegradationPolicy,
  GpuOptimizationPolicy,
  CpuOptimizationPolicy,
  SimulationAdjustmentPolicy,
  QualityRecoveryPolicy,
];
