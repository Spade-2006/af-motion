/**
 * AF Motion — Motion Intelligence Agent (Phase 18, Prompt 144)
 *
 * Specialized agent responsible for analyzing motion configurations,
 * evaluating quality scores, detecting aesthetic and timing issues,
 * and recommending actionable improvements using Prompt 141's intelligence engine.
 */

import type {
  AgentDefinition,
  AgentExecutionContext,
  AgentExecutionResult,
} from "../types.js";

export const motionIntelligenceAgent: AgentDefinition = {
  metadata: {
    id: "agent-motion-intelligence",
    name: "Motion Intelligence Agent",
    description: "Evaluates animation aesthetics, spring dynamics, and timing curves to score motion quality and recommend improvements.",
    version: "1.0.0",
    category: "motion-intelligence",
    capabilities: [
      "motion-analysis",
      "quality-scoring",
      "motion-recommendations",
    ],
    acceptedInputTypes: ["motion-config", "generic-json"],
    expectedOutputTypes: ["motion-quality-report"],
    icon: "🧠",
    author: "AF Motion Core Team",
  },
  instructions: [
    "Receive motion configuration or composition JSON.",
    "Invoke the analyze_motion tool to compute quality metrics.",
    "Inspect timing curves, stiffness, and overshoot factors.",
    "Formulate actionable recommendations for smoothness and responsiveness.",
    "Return a structured motion quality report with an overall score (0-100).",
  ],
  validateInput: (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { valid: false, errors: ["Input must be a valid motion configuration object"] };
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
      toolResult = await context.toolInvoker("analyze_motion", input as Record<string, unknown>);
    } catch (err) {
      toolSuccess = false;
      toolError = err instanceof Error ? err.message : String(err);
    } finally {
      toolCalls.push({
        toolId: "analyze_motion",
        timestamp: Date.now(),
        durationMs: performance.now() - toolStart,
        success: toolSuccess,
        error: toolError,
        inputPreview: JSON.stringify(input).slice(0, 80),
      });
    }

    const durationMs = performance.now() - startTime;
    const score = (toolResult.score as number) ?? 75;
    const recommendations = (toolResult.recommendations as string[]) ?? [];

    return {
      success: toolSuccess,
      agentId: "agent-motion-intelligence",
      taskId: context.taskId,
      output: {
        type: "motion-quality-report",
        score,
        passed: score >= 70,
        qualityReport: toolResult.qualityReport,
        intentAnalysis: toolResult.intentAnalysis,
        recommendations,
      },
      toolCalls,
      durationMs,
      error: toolError,
      recommendations,
      metrics: {
        score,
        passed: score >= 70,
        recommendationCount: recommendations.length,
      },
    };
  },
};
