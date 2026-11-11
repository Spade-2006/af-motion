/**
 * AF Motion — Resource Intelligence Diagnostics & Reporting
 *
 * Compiles comprehensive system reports covering tracked resource counts,
 * memory breakdowns, cache/pool telemetry, and actionable health recommendations.
 */

import type {
  IResourceRegistry,
  IMemoryMonitor,
  IMemoryPressureController,
  IResourceCache,
  ResourceIntelligenceReport,
  ResourceCategory,
} from "./types.js";
import { detectResourceLeaks } from "./leaks.js";
import { safeBufferPoolManager } from "./pooling.js";

export interface ResourceReportOptions {
  registry: IResourceRegistry;
  memoryMonitor?: IMemoryMonitor;
  pressureController?: IMemoryPressureController;
  cache?: IResourceCache;
}

export function getResourceReport(options: ResourceReportOptions): ResourceIntelligenceReport {
  const { registry, memoryMonitor, pressureController, cache } = options;
  const records = registry.getAllRecords();
  const timestamp = Date.now();

  const resourcesByCategory: Record<ResourceCategory, number> = {
    cpu_buffer: 0,
    typed_array: 0,
    geometry: 0,
    material: 0,
    texture: 0,
    gpu_buffer: 0,
    gpu_texture: 0,
    framebuffer: 0,
    render_target: 0,
    shader_program: 0,
    webgl_resource: 0,
    webgpu_resource: 0,
    physics_body: 0,
    simulation_resource: 0,
    animation_controller: 0,
    event_subscription: 0,
    worker: 0,
    cached_asset: 0,
  };

  let activeCount = 0;
  let idleCount = 0;
  let pooledCount = 0;
  let totalEstimatedBytes = 0;

  for (const rec of records) {
    if (rec.state === "disposed" || rec.state === "lost") continue;
    resourcesByCategory[rec.category] = (resourcesByCategory[rec.category] || 0) + 1;
    totalEstimatedBytes += rec.estimatedBytes;

    if (rec.state === "active") activeCount++;
    else if (rec.state === "idle") idleCount++;
    else if (rec.state === "pooled") pooledCount++;
  }

  const snap = memoryMonitor ? memoryMonitor.latestSnapshot : undefined;
  const budgetSummary = snap ? snap.budgetStatuses : {};
  const pressureLevel = pressureController
    ? pressureController.currentPressure
    : snap
    ? snap.memoryPressureLevel
    : "normal";

  const suspectedLeaks = detectResourceLeaks(registry);

  const poolStats = safeBufferPoolManager.getStats();

  const recommendations: string[] = [];
  if (suspectedLeaks.length > 0) {
    recommendations.push(`Detected ${suspectedLeaks.length} suspected resource leak(s). Review temporary scope lifecycles.`);
  }
  if (pressureLevel === "critical" || pressureLevel === "high") {
    recommendations.push("Memory pressure elevated. Clear non-essential caches and reduce high-resolution textures.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Resource footprint healthy; all tracked allocations within budget.");
  }

  return {
    timestamp,
    totalTrackedResources: registry.size,
    resourcesByCategory,
    activeCount,
    idleCount,
    pooledCount,
    totalEstimatedBytes,
    memoryPressureLevel: pressureLevel,
    budgetSummary,
    cacheStats: cache ? cache.getStats() : undefined,
    poolStats: {
      pooledArraysCount: poolStats.activeAcquiredCount,
      pooledBytes: poolStats.totalAcquiredBytes,
    },
    suspectedLeaks,
    recommendations,
  };
}
