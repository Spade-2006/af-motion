/**
 * AF Motion — Performance Intelligence History & Analysis
 *
 * Tracks bounded temporal history of performance snapshots and decisions,
 * offering before-and-after comparison and trend analysis.
 */

import type { UnifiedPerformanceContext } from "./types.js";

export interface SnapshotComparison {
  readonly fpsDelta: number;
  readonly frameDurationDeltaMs: number;
  readonly memoryDeltaMB: number;
  readonly improved: boolean;
  readonly summary: string;
}

export class PerformanceHistoryTracker {
  private readonly capacity: number;
  private readonly snapshots: UnifiedPerformanceContext[] = [];

  constructor(capacity = 60) {
    this.capacity = Math.max(1, capacity);
  }

  /**
   * Record a context snapshot into the bounded buffer.
   */
  public push(snapshot: UnifiedPerformanceContext): void {
    if (this.snapshots.length >= this.capacity) {
      this.snapshots.shift();
    }
    this.snapshots.push(snapshot);
  }

  /**
   * Get all recorded snapshots (oldest to newest).
   */
  public getHistory(): readonly UnifiedPerformanceContext[] {
    return [...this.snapshots];
  }

  /**
   * Clear all recorded snapshots.
   */
  public clear(): void {
    this.snapshots.length = 0;
  }

  /**
   * Compare two snapshots to evaluate impact.
   */
  public compareSnapshots(
    before: UnifiedPerformanceContext,
    after: UnifiedPerformanceContext
  ): SnapshotComparison {
    const fpsDelta = Number((after.fps - before.fps).toFixed(2));
    const frameDurationDeltaMs = Number(
      (after.frameDurationMs - before.frameDurationMs).toFixed(2)
    );
    const beforeMB = before.estimatedMemoryBytes / (1024 * 1024);
    const afterMB = after.estimatedMemoryBytes / (1024 * 1024);
    const memoryDeltaMB = Number((afterMB - beforeMB).toFixed(2));

    // Improved if FPS increased or frame duration decreased without major degradation
    const improved =
      fpsDelta > 1.5 ||
      frameDurationDeltaMs < -1.0 ||
      (fpsDelta >= 0 && memoryDeltaMB < -2.0);

    const summaryParts: string[] = [];
    if (fpsDelta !== 0) {
      summaryParts.push(
        `FPS ${fpsDelta > 0 ? "+" : ""}${fpsDelta.toFixed(1)} (${before.fps.toFixed(1)} → ${after.fps.toFixed(1)})`
      );
    }
    if (frameDurationDeltaMs !== 0) {
      summaryParts.push(
        `Frame time ${frameDurationDeltaMs > 0 ? "+" : ""}${frameDurationDeltaMs.toFixed(1)}ms`
      );
    }
    if (memoryDeltaMB !== 0) {
      summaryParts.push(
        `Memory ${memoryDeltaMB > 0 ? "+" : ""}${memoryDeltaMB.toFixed(1)}MB`
      );
    }

    return {
      fpsDelta,
      frameDurationDeltaMs,
      memoryDeltaMB,
      improved,
      summary: summaryParts.length > 0 ? summaryParts.join(", ") : "No measurable delta",
    };
  }

  /**
   * Analyze recent trends over the recorded snapshot window.
   */
  public analyzeTrend(): {
    fpsTrend: "improving" | "stable" | "degrading";
    memoryTrend: "growing" | "stable" | "shrinking";
    averageFps: number;
    sampleCount: number;
  } {
    const n = this.snapshots.length;
    if (n === 0) {
      return {
        fpsTrend: "stable",
        memoryTrend: "stable",
        averageFps: 60,
        sampleCount: 0,
      };
    }

    const totalFps = this.snapshots.reduce((sum, s) => sum + s.fps, 0);
    const avgFps = totalFps / n;

    if (n < 3) {
      return {
        fpsTrend: "stable",
        memoryTrend: "stable",
        averageFps: Number(avgFps.toFixed(1)),
        sampleCount: n,
      };
    }

    const firstThird = this.snapshots.slice(0, Math.floor(n / 3));
    const lastThird = this.snapshots.slice(-Math.floor(n / 3));

    const avgFirstFps = firstThird.reduce((s, x) => s + x.fps, 0) / firstThird.length;
    const avgLastFps = lastThird.reduce((s, x) => s + x.fps, 0) / lastThird.length;

    let fpsTrend: "improving" | "stable" | "degrading" = "stable";
    if (avgLastFps - avgFirstFps > 3) fpsTrend = "improving";
    else if (avgFirstFps - avgLastFps > 3) fpsTrend = "degrading";

    const avgFirstMem = firstThird.reduce((s, x) => s + x.estimatedMemoryBytes, 0) / firstThird.length;
    const avgLastMem = lastThird.reduce((s, x) => s + x.estimatedMemoryBytes, 0) / lastThird.length;
    const memDeltaMB = (avgLastMem - avgFirstMem) / (1024 * 1024);

    let memoryTrend: "growing" | "stable" | "shrinking" = "stable";
    if (memDeltaMB > 5) memoryTrend = "growing";
    else if (memDeltaMB < -5) memoryTrend = "shrinking";

    return {
      fpsTrend,
      memoryTrend,
      averageFps: Number(avgFps.toFixed(1)),
      sampleCount: n,
    };
  }
}
