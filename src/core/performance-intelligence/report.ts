/**
 * AF Motion — Unified Performance Diagnostic Report
 *
 * Formulates clean, circular-reference-free diagnostic performance reports
 * suitable for structured logging, telemetry exports, and debugging dashboards.
 */

import type {
  UnifiedPerformanceContext,
  PerformanceHealthScores,
  PerformanceDecision,
  UnifiedPerformanceReport,
} from "./types.js";

/**
 * Generate a comprehensive, JSON-serializable performance diagnostic report.
 *
 * @param ctx Current unified performance context
 * @param health Evaluated performance health scores
 * @param decisions Currently pending or proposed decisions
 * @returns Clean, structured report
 */
export function buildUnifiedPerformanceReport(
  ctx: UnifiedPerformanceContext,
  health: PerformanceHealthScores,
  decisions: readonly PerformanceDecision[] = []
): UnifiedPerformanceReport {
  const recommendations = decisions.map(
    (d) => `[${d.category.toUpperCase()}] ${d.reason} (Benefit: ${d.expectedBenefit})`
  );

  return {
    generatedAt: new Date(ctx.timestamp).toISOString(),
    timestamp: ctx.timestamp,
    device: {
      category: ctx.deviceCategory,
      activeBackend: ctx.activeBackend,
      capabilityScore: ctx.capabilityScores.composite,
    },
    runtime: {
      fps: Number(ctx.fps.toFixed(1)),
      frameDurationMs: Number(ctx.frameDurationMs.toFixed(2)),
      frameTimeVariance: Number(ctx.frameTimeVariance.toFixed(2)),
      frameDrops: ctx.frameDrops,
      isVisible: ctx.isVisible,
    },
    memory: {
      trackedResources: ctx.totalTrackedResources,
      estimatedMemoryMB: Number(
        (ctx.estimatedMemoryBytes / (1024 * 1024)).toFixed(2)
      ),
      pressureLevel: ctx.memoryPressureLevel,
      budgetUtilizationPct: Number(
        (ctx.budgetUtilizationRatio * 100).toFixed(1)
      ),
    },
    optimization: {
      activePreset: ctx.activeQualityPreset,
      dominantBottleneck: ctx.dominantBottleneck,
      activeOptimizations: [...ctx.activeOptimizationIds],
      pendingDecisionsCount: decisions.length,
    },
    health: {
      overallScore: Number(health.overallHealth.score.toFixed(1)),
      status: health.overallHealth.status,
      cpuScore: Number(health.cpuHealth.score.toFixed(1)),
      gpuScore: Number(health.gpuHealth.score.toFixed(1)),
      memoryScore: Number(health.memoryHealth.score.toFixed(1)),
      renderingScore: Number(health.renderingHealth.score.toFixed(1)),
      simulationScore: Number(health.simulationHealth.score.toFixed(1)),
      resourceScore: Number(health.resourceHealth.score.toFixed(1)),
    },
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["System operating within optimal performance and memory envelope."],
  };
}
