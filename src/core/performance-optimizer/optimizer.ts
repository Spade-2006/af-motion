/**
 * AF Motion — Automatic Performance Optimizer
 *
 * Central orchestrator connecting real-time profiling, bottleneck detection,
 * strategy execution, verification measurement, and automatic rollback safeguards.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";
import type { IAdaptiveQualityController } from "../adaptive-quality/types.js";
import type {
  IPerformanceOptimizer,
  PerformanceOptimizerOptions,
  OptimizationMode,
  OptimizationCategory,
  OptimizationStrategyId,
  OptimizationCandidate,
  AppliedOptimizationRecord,
  BottleneckAnalysisReport,
  IPerformanceProfiler,
  PerformanceSnapshot,
} from "./types.js";
import { PerformanceProfiler, createPerformanceProfiler } from "./profiler.js";
import { analyzePerformanceBottlenecks } from "./bottlenecks.js";
import {
  getStrategyById,
  getCandidatesForBottlenecks,
} from "./strategies.js";

export class PerformanceOptimizer implements IPerformanceOptimizer {
  private _mode: OptimizationMode;
  private readonly _enabledCategories: Set<OptimizationCategory>;
  private readonly _deviceProfile?: DeviceCapabilityProfile;
  private readonly _adaptiveQualityController?: IAdaptiveQualityController;
  private readonly _profiler: IPerformanceProfiler;
  private readonly _autoRollbackHarmful: boolean;
  private readonly _maxActiveOptimizations: number;

  private readonly _activeOptimizations = new Map<OptimizationStrategyId, AppliedOptimizationRecord>();
  private readonly _history: AppliedOptimizationRecord[] = [];
  private readonly _maxHistory = 50;
  private _isDisposed = false;

  constructor(options: PerformanceOptimizerOptions = {}) {
    this._mode = options.mode ?? "balanced";
    this._deviceProfile = options.deviceProfile;
    this._adaptiveQualityController = options.adaptiveQualityController;
    this._autoRollbackHarmful = options.autoRollbackHarmful ?? true;
    this._maxActiveOptimizations = options.maxActiveOptimizations ?? 10;

    const initialCategories: OptimizationCategory[] = options.enabledCategories
      ? Array.from(options.enabledCategories)
      : ["cpu", "memory", "gpu", "simulation", "worker"];
    this._enabledCategories = new Set<OptimizationCategory>(initialCategories);

    this._profiler = createPerformanceProfiler(options.profilerOptions);
  }

  public get mode(): OptimizationMode {
    return this._mode;
  }

  public get profiler(): IPerformanceProfiler {
    return this._profiler;
  }

  public get activeOptimizations(): readonly AppliedOptimizationRecord[] {
    return Array.from(this._activeOptimizations.values());
  }

  public get bottleneckReport(): BottleneckAnalysisReport {
    return this.analyzeBottlenecks();
  }

  public setMode(mode: OptimizationMode): void {
    if (this._isDisposed) return;
    this._mode = mode;
  }

  public setCategoryEnabled(category: OptimizationCategory, enabled: boolean): void {
    if (this._isDisposed) return;
    if (enabled) {
      this._enabledCategories.add(category);
    } else {
      this._enabledCategories.delete(category);
      // Rollback any active optimizations in this disabled category
      for (const [stratId, record] of this._activeOptimizations) {
        if (record.category === category) {
          this.rollbackOptimization(stratId, `Category '${category}' was disabled.`);
        }
      }
    }
  }

  public isCategoryEnabled(category: OptimizationCategory): boolean {
    return this._enabledCategories.has(category);
  }

  public analyzeBottlenecks(): BottleneckAnalysisReport {
    const snapshot = this._profiler.latestSnapshot ?? this._profiler.captureSnapshot();
    const history = this._profiler.getHistoricalSnapshots();
    return analyzePerformanceBottlenecks(snapshot, history, this._deviceProfile);
  }

  public recommendOptimizations(): readonly OptimizationCandidate[] {
    const report = this.analyzeBottlenecks();
    const candidates = getCandidatesForBottlenecks(report.bottlenecks, this._mode, this._enabledCategories);

    // Filter out already applied optimizations
    return candidates.filter((c) => !this._activeOptimizations.has(c.id));
  }

  public async applyOptimization(strategyId: OptimizationStrategyId): Promise<AppliedOptimizationRecord> {
    if (this._isDisposed) {
      throw new Error("PerformanceOptimizer is disposed");
    }

    const existing = this._activeOptimizations.get(strategyId);
    if (existing) {
      return existing;
    }

    const strategy = getStrategyById(strategyId);
    if (!strategy) {
      throw new Error(`Unknown optimization strategy '${strategyId}'`);
    }

    if (!this._enabledCategories.has(strategy.category)) {
      throw new Error(`Category '${strategy.category}' is disabled`);
    }

    // Baseline snapshot
    const baseline = this._profiler.latestSnapshot ?? this._profiler.captureSnapshot();
    const baselineFps = baseline.fps.value;
    const baselineFrameDuration = baseline.frameDurationMs.value;

    const record: AppliedOptimizationRecord = {
      id: `opt_${strategyId}_${Date.now()}`,
      strategyId,
      category: strategy.category,
      appliedAt: Date.now(),
      baselineFps,
      baselineFrameDurationMs: baselineFrameDuration,
      status: "applied",
    };

    try {
      await Promise.resolve(strategy.apply());
      this._activeOptimizations.set(strategyId, record);
      this.pushHistory(record);
      return record;
    } catch (err: any) {
      const failedRecord: AppliedOptimizationRecord = {
        ...record,
        status: "failed",
        rollbackReason: `Apply failed: ${err?.message ?? String(err)}`,
      };
      this.pushHistory(failedRecord);
      throw err;
    }
  }

  public rollbackOptimization(strategyId: OptimizationStrategyId, reason = "User requested rollback"): boolean {
    if (this._isDisposed) return false;

    const record = this._activeOptimizations.get(strategyId);
    if (!record) return false;

    const strategy = getStrategyById(strategyId);
    if (strategy) {
      try {
        strategy.rollback();
      } catch (err) {
        console.error(`Error rolling back optimization '${strategyId}':`, err);
      }
    }

    this._activeOptimizations.delete(strategyId);

    const rollbackRecord: AppliedOptimizationRecord = {
      ...record,
      status: "rolled_back",
      rollbackReason: reason,
    };

    this.pushHistory(rollbackRecord);
    return true;
  }

  public rollbackAllOptimizations(reason = "Rollback all active optimizations"): void {
    const keys = Array.from(this._activeOptimizations.keys());
    for (const key of keys) {
      this.rollbackOptimization(key, reason);
    }
  }

  public getOptimizationHistory(): readonly AppliedOptimizationRecord[] {
    return this._history;
  }

  public getPerformanceReport(): {
    bottlenecks: BottleneckAnalysisReport;
    activeOptimizations: readonly AppliedOptimizationRecord[];
    latestSnapshot: PerformanceSnapshot | null;
    recommendations: readonly OptimizationCandidate[];
  } {
    return {
      bottlenecks: this.analyzeBottlenecks(),
      activeOptimizations: this.activeOptimizations,
      latestSnapshot: this._profiler.latestSnapshot,
      recommendations: this.recommendOptimizations(),
    };
  }

  public dispose(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    this.rollbackAllOptimizations("Optimizer disposed");
    this._activeOptimizations.clear();
    this._history.length = 0;
    this._profiler.dispose();
  }

  private pushHistory(record: AppliedOptimizationRecord): void {
    this._history.push(record);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }
}

export function createPerformanceOptimizer(
  options: PerformanceOptimizerOptions = {}
): PerformanceOptimizer {
  return new PerformanceOptimizer(options);
}
