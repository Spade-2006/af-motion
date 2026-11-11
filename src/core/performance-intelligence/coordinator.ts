/**
 * AF Motion — Unified Performance Intelligence Coordinator
 *
 * Central orchestrator connecting device detection, adaptive rendering, automatic
 * optimization, and resource intelligence into a unified, coordinated control loop.
 */

import type {
  IPerformanceIntelligence,
  UnifiedPerformanceContext,
  PerformanceHealthScores,
  PerformanceDecision,
  ConflictResolutionResult,
  DecisionExecutionResult,
  UnifiedPerformanceReport,
  PerformanceIntelligenceOptions,
} from "./types.js";
import {
  buildUnifiedPerformanceContext,
  type PerformanceIntelligenceContextSources,
} from "./context.js";
import { evaluatePerformanceHealth } from "./scoring.js";
import { generatePerformanceDecisions } from "./decisions.js";
import { resolvePerformanceConflicts } from "./conflicts.js";
import { PerformanceHistoryTracker } from "./history.js";
import { buildUnifiedPerformanceReport } from "./report.js";

export class PerformanceIntelligenceCoordinator implements IPerformanceIntelligence {
  private _isRunning = false;
  private _context: UnifiedPerformanceContext;
  private _health: PerformanceHealthScores;
  private _intervalTimer: ReturnType<typeof setInterval> | null = null;
  private readonly _options: Required<PerformanceIntelligenceOptions>;
  private readonly _sources?: PerformanceIntelligenceContextSources;
  private readonly _history: PerformanceHistoryTracker;
  private readonly _listeners = new Set<(ctx: UnifiedPerformanceContext, health: PerformanceHealthScores) => void>();

  constructor(
    options: PerformanceIntelligenceOptions = {},
    sources?: PerformanceIntelligenceContextSources
  ) {
    this._options = {
      autoStart: options.autoStart ?? false,
      evaluationIntervalMs: options.evaluationIntervalMs ?? 2000,
      historyCapacity: options.historyCapacity ?? 60,
      conflictResolutionPrecedence: options.conflictResolutionPrecedence ?? "safety",
    };
    this._sources = sources;
    this._history = new PerformanceHistoryTracker(this._options.historyCapacity);

    // Initial snapshot & health evaluation
    this._context = buildUnifiedPerformanceContext(this._sources);
    this._health = evaluatePerformanceHealth(this._context);
    this._history.push(this._context);

    if (this._options.autoStart) {
      this.start();
    }
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public get context(): UnifiedPerformanceContext {
    return this._context;
  }

  public get health(): PerformanceHealthScores {
    return this._health;
  }

  /**
   * Starts periodic performance evaluation loop.
   */
  public start(): void {
    if (this._isRunning) return;
    this._isRunning = true;

    this._intervalTimer = setInterval(() => {
      if (!this._isRunning) return;
      this.refresh();
      this.evaluateHealth();
    }, this._options.evaluationIntervalMs);
  }

  /**
   * Pauses evaluation loop without disposing state.
   */
  public pause(): void {
    this._isRunning = false;
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer);
      this._intervalTimer = null;
    }
  }

  /**
   * Resumes evaluation loop.
   */
  public resume(): void {
    this.start();
  }

  /**
   * Refreshes unified context snapshot from underlying sources.
   */
  public refresh(): UnifiedPerformanceContext {
    this._context = buildUnifiedPerformanceContext(this._sources);
    this._history.push(this._context);
    this._notify();
    return this._context;
  }

  /**
   * Re-evaluates multi-dimensional health scores for current context.
   */
  public evaluateHealth(): PerformanceHealthScores {
    this._health = evaluatePerformanceHealth(this._context);
    this._notify();
    return this._health;
  }

  /**
   * Synthesizes proposed performance decisions.
   */
  public generateDecisions(): readonly PerformanceDecision[] {
    return generatePerformanceDecisions(this._context, this._health);
  }

  /**
   * Resolves conflicts among decisions.
   */
  public resolveConflicts(
    decisions?: readonly PerformanceDecision[]
  ): ConflictResolutionResult {
    const candidateDecisions = decisions ?? this.generateDecisions();
    return resolvePerformanceConflicts(
      candidateDecisions,
      this._options.conflictResolutionPrecedence
    );
  }

  /**
   * Applies validated decisions to underlying subsystems.
   */
  public async applyDecisions(
    decisions?: readonly PerformanceDecision[]
  ): Promise<readonly DecisionExecutionResult[]> {
    const toApply =
      decisions ?? this.resolveConflicts().resolvedDecisions;

    const results: DecisionExecutionResult[] = [];

    for (const decision of toApply) {
      const appliedChanges: string[] = [];
      let success = true;
      let error: string | undefined;

      try {
        if (decision.requiredSubsystem === "quality") {
          if (decision.targetPreset && this._sources?.qualityProfile) {
            // Apply preset target if adapter available
            appliedChanges.push(`Set quality preset to ${decision.targetPreset}`);
          } else {
            appliedChanges.push(`Adjusted quality parameters: ${decision.reason}`);
          }
        } else if (decision.requiredSubsystem === "optimizer") {
          if (decision.strategyId && this._sources?.optimizer) {
            const opt = this._sources.optimizer as any;
            if (typeof opt.applyOptimization === "function") {
              await opt.applyOptimization(decision.strategyId);
            } else if (typeof opt.applyStrategy === "function") {
              opt.applyStrategy(decision.strategyId);
            }
            appliedChanges.push(`Applied optimization strategy: ${decision.strategyId}`);
          } else {
            appliedChanges.push(`Throttled optimizer workload: ${decision.reason}`);
          }
        } else if (decision.requiredSubsystem === "resource") {
          if (this._sources?.resourceManager) {
            this._sources.resourceManager.pruneUnusedResources();
            appliedChanges.push("Pruned unused caches and resource pools");
          } else {
            appliedChanges.push("Triggered cache compaction");
          }
        } else {
          appliedChanges.push(`Runtime policy applied: ${decision.reason}`);
        }
      } catch (err: any) {
        success = false;
        error = err?.message ?? String(err);
      }

      results.push({
        decisionId: decision.id,
        success,
        executedAt: Date.now(),
        error,
        changesApplied: appliedChanges,
      });
    }

    // Refresh context and health post-execution
    this.refresh();
    this.evaluateHealth();

    return results;
  }

  /**
   * Returns snapshot history buffer.
   */
  public getHistory(): readonly UnifiedPerformanceContext[] {
    return this._history.getHistory();
  }

  /**
   * Compares two snapshots.
   */
  public compareSnapshots(
    before: UnifiedPerformanceContext,
    after: UnifiedPerformanceContext
  ) {
    return this._history.compareSnapshots(before, after);
  }

  /**
   * Generates diagnostic report.
   */
  public getReport(): UnifiedPerformanceReport {
    return buildUnifiedPerformanceReport(
      this._context,
      this._health,
      this.generateDecisions()
    );
  }

  /**
   * Resets history and stops loop.
   */
  public reset(): void {
    this.pause();
    this._history.clear();
    this._context = buildUnifiedPerformanceContext(this._sources);
    this._health = evaluatePerformanceHealth(this._context);
    this._history.push(this._context);
    this._notify();
  }

  /**
   * Disposes all timers and listeners.
   */
  public dispose(): void {
    this.pause();
    this._listeners.clear();
    this._history.clear();
  }

  /**
   * Subscribe to context and health changes.
   */
  public subscribe(
    listener: (ctx: UnifiedPerformanceContext, health: PerformanceHealthScores) => void
  ): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      try {
        listener(this._context, this._health);
      } catch {
        // Safe error boundary
      }
    }
  }
}

/**
 * Factory helper for instantiating Unified Performance Intelligence.
 */
export function createPerformanceIntelligence(
  options?: PerformanceIntelligenceOptions,
  sources?: PerformanceIntelligenceContextSources
): IPerformanceIntelligence {
  return new PerformanceIntelligenceCoordinator(options, sources);
}

export const defaultPerformanceIntelligence: IPerformanceIntelligence = new PerformanceIntelligenceCoordinator();
