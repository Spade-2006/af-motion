/**
 * AF Motion — Composition Agent (Phase 18, Prompt 144)
 *
 * Specialized agent responsible for analyzing composition graphs,
 * identifying dependency conflicts, verifying track timing synchronizations,
 * and recommending sequencing improvements.
 */

import type {
  AgentDefinition,
  AgentExecutionContext,
  AgentExecutionResult,
} from "../types.js";

export const compositionAgent: AgentDefinition = {
  metadata: {
    id: "agent-composition",
    name: "Composition Agent",
    description: "Analyses motion composition graphs, inspects cross-system choreographies, detects dependency cycles, and validates timing synchronization.",
    version: "1.0.0",
    category: "composition",
    capabilities: [
      "composition-validation",
      "choreography-inspection",
    ],
    acceptedInputTypes: ["composition-graph", "generic-json"],
    expectedOutputTypes: ["composition-validation-report"],
    icon: "🎛️",
    author: "AF Motion Core Team",
  },
  instructions: [
    "Receive composition graph definition or timeline track hierarchy.",
    "Invoke validate_composition tool to detect cycles and timing inconsistencies.",
    "Inspect cross-system relationships across DOM, Canvas, and 3D layers.",
    "Recommend choreography adjustments and return structured validation report.",
  ],
  validateInput: (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { valid: false, errors: ["Input must be an object representing a composition graph"] };
    }
    return { valid: true };
  },
  execute: async (
    input: unknown,
    context: AgentExecutionContext
  ): Promise<AgentExecutionResult> => {
    const startTime = performance.now();
    const toolCalls: AgentExecutionResult["toolCalls"] = [];

    const toolStart = performance.now();
    let toolResult: Record<string, unknown> = {};
    let toolSuccess = true;
    let toolError: string | undefined;

    try {
      toolResult = await context.toolInvoker("validate_composition", input as Record<string, unknown>);
    } catch (err) {
      toolSuccess = false;
      toolError = err instanceof Error ? err.message : String(err);
    } finally {
      toolCalls.push({
        toolId: "validate_composition",
        timestamp: Date.now(),
        durationMs: performance.now() - toolStart,
        success: toolSuccess,
        error: toolError,
        inputPreview: JSON.stringify(input).slice(0, 80),
      });
    }

    const durationMs = performance.now() - startTime;
    const valid = Boolean(toolResult.valid);
    const issues = (toolResult.issues as string[]) ?? [];

    return {
      success: toolSuccess,
      agentId: "agent-composition",
      taskId: context.taskId,
      output: {
        type: "composition-validation-report",
        valid,
        issues,
        nodesCount: toolResult.nodesCount ?? 0,
        tracksCount: toolResult.tracksCount ?? 0,
      },
      toolCalls,
      durationMs,
      error: toolError,
      recommendations: valid
        ? ["Composition graph is valid and structurally sound.", "All track timings aligned."]
        : issues,
      metrics: {
        valid,
        issuesCount: issues.length,
      },
    };
  },
};
