/**
 * AF Motion — Performance Decision Generator
 *
 * Evaluates performance context and multi-dimensional health scores against
 * active decision policies to synthesize actionable, prioritised recommendations.
 */

import type {
  UnifiedPerformanceContext,
  PerformanceHealthScores,
  PerformanceDecision,
} from "./types.js";
import {
  DEFAULT_PERFORMANCE_POLICIES,
  type DecisionPolicy,
} from "./policies.js";

/**
 * Generate discrete performance decisions based on current context and health scores.
 *
 * @param ctx Current unified performance context snapshot
 * @param health Evaluated performance health scores
 * @param policies Optional custom or extended policies to evaluate (defaults to standard set)
 * @returns Sorted array of performance decisions ordered by priority (highest first)
 */
export function generatePerformanceDecisions(
  ctx: UnifiedPerformanceContext,
  health: PerformanceHealthScores,
  policies: readonly DecisionPolicy[] = DEFAULT_PERFORMANCE_POLICIES
): readonly PerformanceDecision[] {
  const decisions: PerformanceDecision[] = [];

  for (const policy of policies) {
    try {
      const decision = policy.evaluate(ctx, health);
      if (decision) {
        decisions.push(decision);
      }
    } catch {
      // Robust error boundary: individual policy failures do not interrupt decision pipeline
    }
  }

  // Sort by priority descending (highest priority first)
  decisions.sort((a, b) => b.priority - a.priority);

  return decisions;
}
