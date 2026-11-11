/**
 * AF Motion — Unified Performance Health Scoring
 *
 * Computes individual health scores for CPU, GPU, Memory, Rendering, Simulation,
 * and Resources, clearly distinguishing inherent hardware capability from live runtime health.
 */

import type {
  UnifiedPerformanceContext,
  PerformanceHealthScores,
  DimensionHealthScore,
} from "./types.js";

export const HEALTH_SCORING_WEIGHTS = {
  rendering: 0.35,
  cpu: 0.2,
  gpu: 0.15,
  memory: 0.15,
  simulation: 0.15,
} as const;

export function determineHealthStatus(score: number): DimensionHealthScore["status"] {
  if (score >= 85) return "optimal";
  if (score >= 65) return "acceptable";
  if (score >= 45) return "degraded";
  return "critical";
}

export function evaluatePerformanceHealth(
  ctx: UnifiedPerformanceContext
): PerformanceHealthScores {
  const timestamp = Date.now();

  // 1. Rendering Health (driven by FPS, drops, and variance)
  let renderScore = 100;
  if (ctx.fps < 30) renderScore -= 50;
  else if (ctx.fps < 45) renderScore -= 30;
  else if (ctx.fps < 55) renderScore -= 15;

  if (ctx.frameDrops > 5) renderScore -= 20;
  else if (ctx.frameDrops > 0) renderScore -= 10;

  if (ctx.frameTimeVariance > 5.0) renderScore -= 15;
  renderScore = Math.max(0, Math.min(100, renderScore));

  const renderingHealth: DimensionHealthScore = {
    score: renderScore,
    status: determineHealthStatus(renderScore),
    confidence: 0.95,
    rationale: `Rendering at ${ctx.fps.toFixed(1)} FPS with ${ctx.frameDrops} frame drops and variance of ${ctx.frameTimeVariance.toFixed(1)}ms.`,
  };

  // 2. CPU Health
  let cpuScore = 100;
  if (ctx.longTasksCount > 0) cpuScore -= 25 * Math.min(3, ctx.longTasksCount);
  if (ctx.dominantBottleneck === "cpu") cpuScore -= 30;
  if (ctx.frameDurationMs > 33.3) cpuScore -= 20;
  cpuScore = Math.max(0, Math.min(100, cpuScore));

  const cpuHealth: DimensionHealthScore = {
    score: cpuScore,
    status: determineHealthStatus(cpuScore),
    confidence: 0.9,
    rationale: `CPU main-thread workload: ${ctx.longTasksCount} long tasks reported; frame duration ${ctx.frameDurationMs.toFixed(1)}ms.`,
  };

  // 3. GPU Health
  let gpuScore = 100;
  if (ctx.dominantBottleneck === "gpu") gpuScore -= 35;
  if (ctx.resolutionScale < 0.75) gpuScore -= 15;
  if (ctx.fps < 35 && ctx.dominantBottleneck !== "cpu") gpuScore -= 20;
  gpuScore = Math.max(0, Math.min(100, gpuScore));

  const gpuHealth: DimensionHealthScore = {
    score: gpuScore,
    status: determineHealthStatus(gpuScore),
    confidence: 0.9,
    rationale: `GPU backend (${ctx.activeBackend}) resolution scale is ${ctx.resolutionScale}; dominant bottleneck: ${ctx.dominantBottleneck}.`,
  };

  // 4. Memory Health
  let memScore = 100;
  if (ctx.memoryPressureLevel === "critical") memScore -= 65;
  else if (ctx.memoryPressureLevel === "high") memScore -= 35;
  else if (ctx.memoryPressureLevel === "elevated") memScore -= 15;

  if (ctx.budgetUtilizationRatio > 0.9) memScore -= 20;
  else if (ctx.budgetUtilizationRatio > 0.75) memScore -= 10;
  memScore = Math.max(0, Math.min(100, memScore));

  const memoryHealth: DimensionHealthScore = {
    score: memScore,
    status: determineHealthStatus(memScore),
    confidence: 0.9,
    rationale: `Memory pressure is ${ctx.memoryPressureLevel}; budget utilization is ${(ctx.budgetUtilizationRatio * 100).toFixed(0)}%.`,
  };

  // 5. Simulation Health
  let simScore = 100;
  if (ctx.dominantBottleneck === "simulation") simScore -= 40;
  if (ctx.activeOptimizationsCount > 0 && ctx.activeOptimizationIds.some((id) => id.startsWith("sim_"))) {
    simScore -= 15;
  }
  simScore = Math.max(0, Math.min(100, simScore));

  const simulationHealth: DimensionHealthScore = {
    score: simScore,
    status: determineHealthStatus(simScore),
    confidence: 0.85,
    rationale: ctx.dominantBottleneck === "simulation"
      ? "Particle or fluid solver workloads are exceeding target integration time."
      : "Simulation steps executing within expected frame bounds.",
  };

  // 6. Resource Health
  let resScore = 100;
  if (ctx.totalTrackedResources > 500) resScore -= 20;
  if (ctx.memoryPressureLevel === "critical") resScore -= 30;
  resScore = Math.max(0, Math.min(100, resScore));

  const resourceHealth: DimensionHealthScore = {
    score: resScore,
    status: determineHealthStatus(resScore),
    confidence: 0.9,
    rationale: `${ctx.totalTrackedResources} active resources tracked across registered scopes.`,
  };

  // 7. Overall Composite Runtime Health
  let overall = Math.round(
    renderScore * HEALTH_SCORING_WEIGHTS.rendering +
    cpuScore * HEALTH_SCORING_WEIGHTS.cpu +
    gpuScore * HEALTH_SCORING_WEIGHTS.gpu +
    memScore * HEALTH_SCORING_WEIGHTS.memory +
    simScore * HEALTH_SCORING_WEIGHTS.simulation
  );

  // Severe bottleneck or hazard penalizes systemic overall score
  if (memoryHealth.status === "critical") {
    overall = Math.min(overall, 70);
  }
  if (renderingHealth.status === "critical") {
    overall = Math.min(overall, 65);
  }

  const overallHealth: DimensionHealthScore = {
    score: overall,
    status: determineHealthStatus(overall),
    confidence: 0.9,
    rationale: `Overall runtime health is ${determineHealthStatus(overall)} (${overall}/100).`,
  };

  // Capability vs Health Divergence Rationale
  const capabilityScore = ctx.capabilityScores.composite;
  let divergenceRationale = "Hardware capability and runtime performance are well aligned.";
  if (capabilityScore >= 75 && overall < 70) {
    divergenceRationale = "Hardware capability is high, but runtime is bottlenecked under heavy workload pressure, leading to lower runtime health.";
  } else if (capabilityScore < 50 && overall >= 80) {
    divergenceRationale = "Lower-tier hardware is performing exceptionally well under lightweight scene configuration.";
  }

  return {
    timestamp,
    cpuHealth,
    gpuHealth,
    memoryHealth,
    renderingHealth,
    simulationHealth,
    resourceHealth,
    overallHealth,
    hardwareCapabilityVsRuntimeHealth: {
      capabilityScore,
      runtimeHealthScore: overall,
      divergenceRationale,
    },
  };
}
