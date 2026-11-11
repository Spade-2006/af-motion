/**
 * AF Motion — Bottleneck Detection Intelligence
 *
 * Deterministically identifies CPU, GPU, Memory, and Simulation bottlenecks,
 * assigns explainable severity and confidence levels, and produces actionable recommendations.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import type {
  PerformanceSnapshot,
  BottleneckItem,
  BottleneckAnalysisReport,
  BottleneckCategory,
  BottleneckSeverity,
} from "./types.js";

export function analyzePerformanceBottlenecks(
  snapshot: PerformanceSnapshot | null,
  history: readonly PerformanceSnapshot[] = [],
  capabilities?: DeviceCapabilityProfile
): BottleneckAnalysisReport {
  const timestamp = Date.now();
  if (!snapshot) {
    return {
      timestamp,
      bottlenecks: [],
      dominantBottleneckCategory: "none",
      overallHealthScore: 100,
      summary: "No performance samples recorded yet.",
      recommendations: ["Start profiling session or capture frames to evaluate runtime bottlenecks."],
    };
  }

  const bottlenecks: BottleneckItem[] = [];
  const frameTime = snapshot.frameDurationMs.value;
  const isLowEndDevice = capabilities?.category === "low-end-mobile" || capabilities?.category === "low-end-desktop";

  // 1. CPU Bottleneck Detection
  const simMs = snapshot.simulationDurationMs.value;
  const animMs = snapshot.animationUpdateMs.value;
  const geomMs = snapshot.geometryProcessingMs.value;
  const longTasks = snapshot.longTasksCount.value;

  if (animMs > 8.0) {
    const sev: BottleneckSeverity = animMs > 14.0 ? "critical" : animMs > 10.0 ? "high" : "medium";
    bottlenecks.push({
      id: "cpu_animation_overhead",
      category: "cpu",
      severity: sev,
      title: "Animation Calculation Overhead",
      description: `Animation transform updates consuming ${animMs.toFixed(1)}ms per frame.`,
      confidence: snapshot.animationUpdateMs.confidence,
      isHardwareConfirmed: snapshot.animationUpdateMs.status === "measured",
      primaryMetric: "animationUpdateMs",
      metricValue: animMs,
      threshold: 8.0,
      recommendedAction: "Batch animation transforms and memoize interpolation calculations.",
    });
  }

  if (geomMs > 10.0) {
    bottlenecks.push({
      id: "cpu_geometry_processing",
      category: "cpu",
      severity: geomMs > 20.0 ? "critical" : "high",
      title: "Expensive Geometry Processing",
      description: `Procedural geometry or mesh updates consuming ${geomMs.toFixed(1)}ms on main thread.`,
      confidence: snapshot.geometryProcessingMs.confidence,
      isHardwareConfirmed: snapshot.geometryProcessingMs.status === "measured",
      primaryMetric: "geometryProcessingMs",
      metricValue: geomMs,
      threshold: 10.0,
      recommendedAction: "Offload geometry decimation and normal generation to worker or use LOD simplification.",
    });
  }

  if (longTasks > 0 && frameTime > 33.3) {
    bottlenecks.push({
      id: "cpu_long_task_stalls",
      category: "cpu",
      severity: "high",
      title: "Main Thread Frame Drops",
      description: `Detected synchronous blocking tasks causing frame drop (${frameTime.toFixed(1)}ms).`,
      confidence: snapshot.longTasksCount.confidence,
      isHardwareConfirmed: snapshot.longTasksCount.status === "measured",
      primaryMetric: "frameDurationMs",
      metricValue: frameTime,
      threshold: 33.3,
      recommendedAction: "Chunk synchronous workloads across multiple rAF frames.",
    });
  }

  // 2. GPU Bottleneck Detection
  const renderMs = snapshot.renderSubmissionMs.value;
  const workload = snapshot.activeWorkloadItems;

  if (renderMs > 8.0) {
    const sev: BottleneckSeverity = renderMs > 14.0 ? "critical" : "high";
    bottlenecks.push({
      id: "gpu_render_submission_delay",
      category: "gpu",
      severity: sev,
      title: "Render Submission & Draw Call Overhead",
      description: `Draw calls and GPU state changes consuming ${renderMs.toFixed(1)}ms per frame.`,
      confidence: snapshot.renderSubmissionMs.confidence,
      isHardwareConfirmed: snapshot.renderSubmissionMs.status === "measured",
      primaryMetric: "renderSubmissionMs",
      metricValue: renderMs,
      threshold: 8.0,
      recommendedAction: "Combine adjacent geometries into instanced buffers to minimize draw calls.",
    });
  }

  if (workload > 300 && isLowEndDevice) {
    bottlenecks.push({
      id: "gpu_workload_density",
      category: "gpu",
      severity: "medium",
      title: "High Visual Density on Resource-Constrained Hardware",
      description: `Active scene contains ${workload} elements on low-tier hardware profile.`,
      confidence: 0.85,
      isHardwareConfirmed: true,
      primaryMetric: "activeWorkloadItems",
      metricValue: workload,
      threshold: 300,
      recommendedAction: "Apply spatial frustum culling and clamp maximum dynamic resolution.",
    });
  }

  // 3. Memory Bottleneck Detection
  const allocRate = snapshot.memoryAllocationRateKBPerFrame.value;
  if (allocRate > 256) {
    const sev: BottleneckSeverity = allocRate > 1024 ? "critical" : allocRate > 512 ? "high" : "medium";
    bottlenecks.push({
      id: "mem_transient_allocations",
      category: "memory",
      severity: sev,
      title: "High Transient Memory Allocation Rate",
      description: `Allocating approximately ${allocRate.toFixed(0)} KB per frame, inducing garbage collection spikes.`,
      confidence: snapshot.memoryAllocationRateKBPerFrame.confidence,
      isHardwareConfirmed: snapshot.memoryAllocationRateKBPerFrame.status === "measured",
      primaryMetric: "memoryAllocationRateKBPerFrame",
      metricValue: allocRate,
      threshold: 256,
      recommendedAction: "Recycle Float32Array/Uint32Array buffers using TypedArrayPool.",
    });
  }

  // 4. Simulation Bottleneck Detection
  if (simMs > 8.0) {
    const sev: BottleneckSeverity = simMs > 14.0 ? "critical" : "high";
    bottlenecks.push({
      id: "sim_computation_load",
      category: "simulation",
      severity: sev,
      title: "Simulation Workload Overload",
      description: `Particle, fluid, or physics integration consuming ${simMs.toFixed(1)}ms per frame.`,
      confidence: snapshot.simulationDurationMs.confidence,
      isHardwareConfirmed: snapshot.simulationDurationMs.status === "measured",
      primaryMetric: "simulationDurationMs",
      metricValue: simMs,
      threshold: 8.0,
      recommendedAction: "Enable adaptive particle batching and clamp fluid solver iterations.",
    });
  }

  // Dominant category and overall health score
  const categoryCounts: Record<BottleneckCategory, number> = {
    cpu: 0,
    gpu: 0,
    memory: 0,
    simulation: 0,
  };

  let penalty = 0;
  for (const b of bottlenecks) {
    categoryCounts[b.category]++;
    if (b.severity === "critical") penalty += 35;
    else if (b.severity === "high") penalty += 20;
    else if (b.severity === "medium") penalty += 10;
    else penalty += 5;
  }

  const overallHealthScore = Math.max(0, 100 - penalty);

  let dominantCategory: BottleneckCategory | "none" = "none";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantCategory = cat as BottleneckCategory;
    }
  }

  const summary = bottlenecks.length === 0
    ? "Engine running smoothly within 60 FPS performance envelope."
    : `Identified ${bottlenecks.length} bottleneck(s), dominated by ${dominantCategory.toUpperCase()} pressure.`;

  const recommendations = bottlenecks.map((b) => b.recommendedAction);

  return {
    timestamp,
    bottlenecks,
    dominantBottleneckCategory: dominantCategory,
    overallHealthScore,
    summary,
    recommendations,
  };
}
