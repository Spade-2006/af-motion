/**
 * AF Motion — Multi-Agent Conflict Detection & Resolution (Phase 18, Prompt 145)
 *
 * Implements deterministic conflict detection across agent outputs,
 * priority/rule-based resolutions, and transparent decision audit logging.
 */

import type {
  ConflictRecord,
  ConflictType,
  ResolutionStrategy,
} from "./orchestration-types.js";

export class ConflictResolver {
  /**
   * Analyzes two or more agent outputs / recommendations for mutual contradictions.
   */
  public detectConflicts(params: {
    workflowId: string;
    agentOutputs: Array<{
      agentId: string;
      output: Record<string, unknown>;
      artifactKey?: string;
    }>;
  }): ConflictRecord[] {
    const conflicts: ConflictRecord[] = [];
    const { workflowId, agentOutputs } = params;

    const a11y = agentOutputs.find((a) => a.agentId === "agent-accessibility");
    const perf = agentOutputs.find((a) => a.agentId === "agent-performance-optimization");
    const motion = agentOutputs.find((a) => a.agentId === "agent-motion-intelligence");
    const d2m = agentOutputs.find((a) => a.agentId === "agent-design-to-motion");
    const scene = agentOutputs.find((a) => a.agentId === "agent-scene-generation");

    // 1. Accessibility vs Visual Quality Conflict: Motion duration > 5000ms or flashing
    if (a11y && a11y.output.accessible === false) {
      const violations = (a11y.output.violations as string[]) || [];
      conflicts.push({
        id: `conf-${Date.now().toString(36)}-a11y`,
        workflowId,
        conflictType: "accessibility_violation",
        participatingAgentIds: ["agent-accessibility", motion?.agentId || d2m?.agentId || "unknown"].filter(Boolean),
        conflictingArtifactKeys: [a11y.artifactKey || "a11y-report"].filter(Boolean),
        details: `Accessibility violation detected: ${violations.join("; ")}`,
        resolutionStrategy: "rule_based",
        selectedResolution: {
          enforceAccessibleFallback: true,
          capDurationMs: 4000,
        },
        reason: "WCAG 2.2.2 compliance takes absolute priority over decorative motion timing.",
        approvalStatus: "auto_resolved",
        resolvedAt: Date.now(),
      });
    }

    // 2. Performance vs Quality Conflict: Low FPS / high memory with dense scene
    if (perf && perf.output.healthScore !== undefined) {
      const score = Number(perf.output.healthScore);
      if (score < 60) {
        conflicts.push({
          id: `conf-${Date.now().toString(36)}-perf`,
          workflowId,
          conflictType: "performance_vs_quality",
          participatingAgentIds: ["agent-performance-optimization", scene?.agentId || "agent-scene-generation"],
          conflictingArtifactKeys: [perf.artifactKey || "perf-report"].filter(Boolean),
          details: `Performance bottleneck detected (health score: ${score}). Rendering load exceeds target threshold.`,
          resolutionStrategy: "priority_based",
          selectedResolution: {
            reduceParticleDensity: true,
            downgradeQualityTier: "medium",
          },
          reason: "Smooth 60 FPS runtime stability prioritizes over heavy particle simulation density.",
          approvalStatus: "auto_resolved",
          resolvedAt: Date.now(),
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolves a conflict using a specified strategy or user selection.
   */
  public resolveConflict(
    conflict: ConflictRecord,
    strategy: ResolutionStrategy,
    manualSelection?: unknown
  ): ConflictRecord {
    let selectedResolution = manualSelection;
    let reason = "Resolved via manual human approval";
    let status: ConflictRecord["approvalStatus"] = "approved";

    if (strategy === "rule_based") {
      selectedResolution = conflict.selectedResolution || { enforcedSafetyRule: true };
      reason = "Resolved via deterministic rule precedence: Accessibility > Performance > Visual Quality.";
      status = "auto_resolved";
    } else if (strategy === "priority_based") {
      selectedResolution = conflict.selectedResolution || { appliedHigherPriorityAgent: true };
      reason = "Resolved via agent domain priority ranking.";
      status = "auto_resolved";
    } else if (strategy === "reject_with_explanation") {
      selectedResolution = null;
      reason = "Conflict could not be reconciled automatically; rejected changes to preserve baseline configuration.";
      status = "rejected";
    }

    return {
      ...conflict,
      resolutionStrategy: strategy,
      selectedResolution,
      reason,
      approvalStatus: status,
      resolvedAt: Date.now(),
    };
  }
}

export const conflictResolver = new ConflictResolver();
