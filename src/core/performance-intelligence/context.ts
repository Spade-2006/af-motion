/**
 * AF Motion — Unified Performance Context Aggregator
 *
 * Synthesizes hardware capabilities, active quality profiles, runtime telemetry,
 * bottleneck diagnostics, and resource usage into a single coherent state snapshot.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import { getDeviceCapabilityProfile } from "../device-capabilities/detection.js";
import type { IAdaptiveQualityController, QualityProfile, QualityPresetName } from "../adaptive-quality/types.js";
import type {
  IPerformanceOptimizer,
  BottleneckAnalysisReport,
} from "../performance-optimizer/types.js";
import type {
  IResourceRegistry,
  IMemoryMonitor,
  MemoryPressureLevel,
  MemorySnapshot,
} from "../resource-intelligence/types.js";
import type { UnifiedPerformanceContext } from "./types.js";

export interface ContextAggregationSources {
  deviceProfile?: DeviceCapabilityProfile | any;
  qualityController?: IAdaptiveQualityController;
  qualityProfile?: Partial<QualityProfile> & { name?: QualityPresetName; isLocked?: boolean };
  optimizer?: IPerformanceOptimizer;
  registry?: IResourceRegistry;
  resourceManager?: any;
  memoryMonitor?: IMemoryMonitor;
  memorySnapshot?: Partial<MemorySnapshot>;
  memoryPressure?: MemoryPressureLevel;
  metrics?: {
    fps?: number;
    frameDurationMs?: number;
    frameTimeVariance?: number;
    frameDrops?: number;
    longTasksCount?: number;
  };
  bottlenecks?: BottleneckAnalysisReport | { dominantBottleneck?: string; dominantBottleneckCategory?: string };
  telemetry?: {
    isVisible?: boolean;
    batteryLevel?: number;
    isBatteryCharging?: boolean;
    isDataSaver?: boolean;
  };
  isVisible?: boolean;
}

export type PerformanceIntelligenceContextSources = ContextAggregationSources;

/**
 * Builds a UnifiedPerformanceContext from the given subsystems or default fallbacks.
 */
export function buildUnifiedPerformanceContext(
  sources: ContextAggregationSources = {}
): UnifiedPerformanceContext {
  const timestamp = Date.now();

  // 1. Device Capabilities
  const dev = sources.deviceProfile ?? getDeviceCapabilityProfile();
  let rawCategory = dev.category ?? dev.classification?.category;
  if (!rawCategory || rawCategory === "unknown") {
    rawCategory = "desktop";
  }
  const deviceCategory = rawCategory;

  const scoresObj = dev.scores ?? {};
  const capabilityScores = {
    cpu: scoresObj.cpu?.score ?? dev.cpu?.benchmarkScore ?? 75,
    memory: scoresObj.memory?.score ?? dev.memory?.benchmarkScore ?? 75,
    gpu: scoresObj.gpu?.score ?? dev.gpu?.benchmarkScore ?? 75,
    composite: scoresObj.overallScore ?? dev.overallScore ?? 75,
  };

  let rawBackend = dev.activeGraphicsBackend ?? dev.activeBackend;
  if (!rawBackend || rawBackend === "null") {
    rawBackend = "webgl2";
  }
  const activeBackend = rawBackend;

  const isReducedMotion =
    (dev.display?.reducedMotion?.status === "detected" && dev.display?.reducedMotion?.value === true) ||
    dev.features?.prefersReducedMotion === true;

  const isDataSaver =
    sources.telemetry?.isDataSaver ??
    (dev.network?.saveData?.status === "detected" && dev.network?.saveData?.value === true);

  const battery = dev.battery;
  const batteryLevel =
    sources.telemetry?.batteryLevel ??
    (battery && battery.level?.status === "detected" && battery.level?.value !== null
      ? battery.level.value
      : undefined);

  const isBatteryCharging =
    sources.telemetry?.isBatteryCharging ??
    (battery && battery.charging?.status === "detected" && battery.charging?.value !== null
      ? battery.charging.value
      : undefined);

  // 2. Adaptive Quality
  const qCtrl = sources.qualityController;
  const qProf = sources.qualityProfile as any;
  const activeQualityPreset: QualityPresetName = qCtrl
    ? qCtrl.getCurrentQuality()
    : qProf?.name ?? "high";
  const isQualityLocked = qCtrl ? qCtrl.profile.isLocked : (qProf?.isLocked ?? false);
  const resolutionScale = qCtrl ? qCtrl.profile.values.resolutionScale : (qProf?.values?.resolutionScale ?? qProf?.resolutionScale ?? 1.0);
  const dpr = qCtrl ? qCtrl.profile.values.dpr : (qProf?.values?.dpr ?? qProf?.dpr ?? 2.0);

  // 3. Performance Metrics
  let fps = sources.metrics?.fps ?? 60;
  let frameDurationMs = sources.metrics?.frameDurationMs ?? 16.66;
  let frameTimeVariance = sources.metrics?.frameTimeVariance ?? 0.5;
  let frameDrops = sources.metrics?.frameDrops ?? 0;
  let longTasksCount = sources.metrics?.longTasksCount ?? 0;

  if (qCtrl) {
    const qm = qCtrl.getPerformanceMetrics();
    fps = qm.averageFps;
    frameDurationMs = qm.frameDurationMs;
    frameTimeVariance = qm.frameTimeVariance;
    frameDrops = qm.frameDrops;
    longTasksCount = qm.longFrames;
  } else if (sources.optimizer?.profiler?.latestSnapshot) {
    const snap = sources.optimizer.profiler.latestSnapshot;
    fps = snap.fps.value;
    frameDurationMs = snap.frameDurationMs.value;
    longTasksCount = snap.longTasksCount?.value ?? 0;
  }

  // 4. Bottlenecks & Optimization
  const bAny = sources.bottlenecks as any;
  let dominantBottleneck =
    bAny?.dominantBottleneck ??
    bAny?.dominantBottleneckCategory ??
    "none";
  let activeOptimizationsCount = 0;
  let activeOptimizationIds: readonly string[] = [];

  if (sources.optimizer) {
    if (sources.optimizer.bottleneckReport) {
      dominantBottleneck = sources.optimizer.bottleneckReport.dominantBottleneckCategory;
    }
    if (sources.optimizer.activeOptimizations) {
      activeOptimizationsCount = sources.optimizer.activeOptimizations.length;
      activeOptimizationIds = sources.optimizer.activeOptimizations.map((o: any) => o.strategyId);
    }
  }

  // 5. Memory & Resources
  let totalTrackedResources = 0;
  let estimatedMemoryBytes = 50 * 1024 * 1024;
  let memoryPressureLevel: MemoryPressureLevel = sources.memoryPressure ?? "normal";
  let budgetUtilizationRatio = 0.45;

  if (sources.memorySnapshot) {
    const s = sources.memorySnapshot as any;
    estimatedMemoryBytes =
      s.totalEstimatedBytes ??
      ((s.jsHeapUsedBytes ?? 0) + (s.estimatedGpuBytes ?? 0) + (s.trackedResourceBytes ?? 0) || (50 * 1024 * 1024));
    totalTrackedResources = s.totalTrackedResources ?? s.trackedResourceCount ?? s.activeResourceCount ?? 0;
    if (s.memoryPressureLevel ?? s.pressureLevel) {
      memoryPressureLevel = s.memoryPressureLevel ?? s.pressureLevel;
    }
  }

  if (sources.registry) {
    totalTrackedResources = sources.registry.size;
  }

  if (sources.memoryMonitor) {
    const snap = sources.memoryMonitor.captureSnapshot();
    estimatedMemoryBytes = snap.totalEstimatedBytes;
    totalTrackedResources = snap.totalTrackedResources;
    memoryPressureLevel = snap.memoryPressureLevel;
  }

  // 6. Runtime Environment & Telemetry
  const isVisible = sources.telemetry?.isVisible ?? sources.isVisible ?? true;

  return {
    timestamp,
    deviceCategory,
    capabilityScores,
    activeBackend,
    isReducedMotion,
    activeQualityPreset,
    isQualityLocked,
    resolutionScale,
    dpr,
    fps,
    frameDurationMs,
    frameTimeVariance,
    frameDrops,
    longTasksCount,
    dominantBottleneck,
    activeOptimizationsCount,
    activeOptimizationIds,
    totalTrackedResources,
    estimatedMemoryBytes,
    memoryPressureLevel,
    budgetUtilizationRatio,
    isVisible,
    batteryLevel,
    isBatteryCharging,
    isDataSaver,
  };
}
