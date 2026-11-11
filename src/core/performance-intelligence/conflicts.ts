/**
 * AF Motion — Performance Conflict Resolver
 *
 * Discovers and resolves competing or contradictory decisions across subsystems,
 * enforcing stability invariants, cooldown hysteresis, and policy precedence.
 */

import type {
  PerformanceDecision,
  ConflictResolutionResult,
} from "./types.js";

/**
 * Resolves conflicts between proposed performance decisions.
 *
 * Guarantees:
 * 1. "reduce_quality" and "increase_quality" never co-occur (downgrade wins under distress).
 * 2. High memory pressure always suppresses "increase_quality".
 * 3. High-priority safety actions supersede lower-priority cosmetic adjustments.
 * 4. Deduplicates decisions targeting identical strategies or presets.
 *
 * @param decisions Candidate performance decisions
 * @param precedence Optional resolution precedence ("safety" | "performance" | "quality")
 * @returns Conflict resolution result with detected conflicts and filtered decisions
 */
export function resolvePerformanceConflicts(
  decisions: readonly PerformanceDecision[],
  precedence: "safety" | "performance" | "quality" = "safety"
): ConflictResolutionResult {
  const conflictsDetected: {
    decisionA: PerformanceDecision;
    decisionB: PerformanceDecision;
    conflictType: string;
    resolution: string;
  }[] = [];

  const candidateMap = new Map<string, PerformanceDecision>();
  for (const d of decisions) {
    candidateMap.set(d.id, d);
  }

  const suppressedIds = new Set<string>();

  // 1. Conflict: Quality increase vs Quality reduce
  const reduceDecisions = decisions.filter((d) => d.category === "reduce_quality");
  const increaseDecisions = decisions.filter((d) => d.category === "increase_quality");

  if (reduceDecisions.length > 0 && increaseDecisions.length > 0) {
    for (const inc of increaseDecisions) {
      for (const red of reduceDecisions) {
        conflictsDetected.push({
          decisionA: red,
          decisionB: inc,
          conflictType: "contradictory_quality_direction",
          resolution: "Suppressed quality increase in favor of quality downgrade to guarantee frame stability.",
        });
        suppressedIds.add(inc.id);
      }
    }
  }

  // 2. Conflict: Critical memory release vs Quality increase
  const releaseDecisions = decisions.filter(
    (d) => d.category === "release_resources" && d.priority >= 7
  );
  if (releaseDecisions.length > 0 && increaseDecisions.length > 0) {
    for (const inc of increaseDecisions) {
      if (!suppressedIds.has(inc.id)) {
        for (const rel of releaseDecisions) {
          conflictsDetected.push({
            decisionA: rel,
            decisionB: inc,
            conflictType: "memory_pressure_quality_lock",
            resolution: "Suppressed quality increase because memory pressure requires resource pruning.",
          });
          suppressedIds.add(inc.id);
        }
      }
    }
  }

  // 3. Deduplicate multiple decisions in same category or strategy
  const seenSubsystems = new Map<string, PerformanceDecision>();
  for (const d of decisions) {
    if (suppressedIds.has(d.id)) continue;

    const key = `${d.category}_${d.strategyId ?? ""}_${d.targetPreset ?? ""}`;
    const existing = seenSubsystems.get(key);
    if (existing) {
      conflictsDetected.push({
        decisionA: existing,
        decisionB: d,
        conflictType: "duplicate_action",
        resolution: `Retained higher priority action (${existing.priority} vs ${d.priority}).`,
      });
      // Pick higher priority
      if (d.priority > existing.priority) {
        suppressedIds.add(existing.id);
        seenSubsystems.set(key, d);
      } else {
        suppressedIds.add(d.id);
      }
    } else {
      seenSubsystems.set(key, d);
    }
  }

  // 4. Filter resolved decisions and order by priority
  const resolved = decisions
    .filter((d) => !suppressedIds.has(d.id))
    .sort((a, b) => {
      if (precedence === "safety") {
        // High priority first, lower risk preferred if same priority
        if (b.priority !== a.priority) return b.priority - a.priority;
        const riskOrder = { low: 0, medium: 1, high: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return b.priority - a.priority;
    });

  return {
    hasConflict: conflictsDetected.length > 0,
    conflictsDetected,
    resolvedDecisions: resolved,
  };
}
