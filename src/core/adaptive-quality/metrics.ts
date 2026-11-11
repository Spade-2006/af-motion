/**
 * AF Motion — Real-Time Performance Monitor & Bounded Metrics Tracker
 *
 * Zero-allocation ring buffer measuring frame duration, FPS, variance,
 * long frames, drops, CPU simulation/render execution, and GPU timings.
 */

import type {
  PerformanceMetrics,
  FrameMetricsInput,
} from "./types.js";

export interface PerformanceTrackerOptions {
  windowSize?: number;
  targetFps?: number;
  isGpuTimingSupported?: boolean;
}

export class PerformanceTracker {
  private readonly windowSize: number;
  private readonly frameDurations: Float32Array;
  private head = 0;
  private count = 0;
  private totalDurationSum = 0;

  private latestDuration = 16.6;
  private latestSimTime = 0;
  private latestRenderTime = 0;
  private latestGpuTime: number | undefined = undefined;
  private latestWorkload = 0;
  private latestResourcePressure = 0;

  private targetFps: number;
  private readonly targetBudgetMs: number;
  private readonly isGpuTimingSupported: boolean;

  constructor(options: PerformanceTrackerOptions = {}) {
    this.windowSize = Math.max(10, Math.min(120, options.windowSize ?? 60));
    this.frameDurations = new Float32Array(this.windowSize);
    this.targetFps = options.targetFps ?? 60;
    this.targetBudgetMs = 1000 / this.targetFps;
    this.isGpuTimingSupported = options.isGpuTimingSupported ?? false;
  }

  public record(input: number | FrameMetricsInput): PerformanceMetrics {
    let duration: number;
    if (typeof input === "number") {
      duration = input;
    } else {
      duration = input.frameDurationMs;
      if (input.simulationTimeMs !== undefined) this.latestSimTime = input.simulationTimeMs;
      if (input.renderTimeMs !== undefined) this.latestRenderTime = input.renderTimeMs;
      if (input.gpuTimeMs !== undefined && this.isGpuTimingSupported) {
        this.latestGpuTime = input.gpuTimeMs;
      }
      if (input.workloadComplexity !== undefined) this.latestWorkload = input.workloadComplexity;
      if (input.resourcePressure !== undefined) this.latestResourcePressure = input.resourcePressure;
    }

    // Sanitize duration to prevent NaN/Infinity from corrupted inputs
    if (!Number.isFinite(duration) || duration <= 0) {
      duration = this.targetBudgetMs;
    }

    this.latestDuration = duration;

    // Ring buffer update
    if (this.count < this.windowSize) {
      this.frameDurations[this.head] = duration;
      this.totalDurationSum += duration;
      this.count++;
      this.head = (this.head + 1) % this.windowSize;
    } else {
      const oldVal = this.frameDurations[this.head];
      this.totalDurationSum += duration - oldVal;
      this.frameDurations[this.head] = duration;
      this.head = (this.head + 1) % this.windowSize;
    }

    return this.getMetrics();
  }

  public getMetrics(): PerformanceMetrics {
    const n = Math.max(1, this.count);
    const avgDuration = this.totalDurationSum / n;
    const avgFps = avgDuration > 0 ? Math.min(240, 1000 / avgDuration) : this.targetFps;

    // Variance calculation
    let varianceSum = 0;
    let drops = 0;
    let longFrames = 0;
    const dropThreshold = this.targetBudgetMs * 1.5;
    const longFrameThreshold = 33.3;

    for (let i = 0; i < n; i++) {
      const d = this.frameDurations[i];
      const diff = d - avgDuration;
      varianceSum += diff * diff;
      if (d > dropThreshold) drops++;
      if (d > longFrameThreshold) longFrames++;
    }

    const variance = Math.sqrt(varianceSum / n);

    return {
      frameDurationMs: Number(this.latestDuration.toFixed(2)),
      averageFps: Number(avgFps.toFixed(1)),
      frameTimeVariance: Number(variance.toFixed(2)),
      frameDrops: drops,
      longFrames,
      simulationTimeMs: Number(this.latestSimTime.toFixed(2)),
      renderTimeMs: Number(this.latestRenderTime.toFixed(2)),
      gpuTimeMs: this.latestGpuTime !== undefined ? Number(this.latestGpuTime.toFixed(2)) : undefined,
      isGpuTimingSupported: this.isGpuTimingSupported,
      workloadComplexity: this.latestWorkload,
      resourcePressure: Number(this.latestResourcePressure.toFixed(2)),
      timestamp: Date.now(),
    };
  }

  public reset(): void {
    this.head = 0;
    this.count = 0;
    this.totalDurationSum = 0;
    this.latestDuration = this.targetBudgetMs;
    this.latestSimTime = 0;
    this.latestRenderTime = 0;
    this.latestGpuTime = undefined;
    this.latestWorkload = 0;
    this.latestResourcePressure = 0;
    this.frameDurations.fill(0);
  }

  public setTargetFps(fps: number): void {
    this.targetFps = Math.max(15, Math.min(240, fps));
  }
}
