/**
 * AF Motion — Performance Optimization Agent (Phase 18, Prompt 144)
 *
 * Specialized agent responsible for analyzing runtime telemetry,
 * identifying framerate drops and memory bottlenecks, and recommending
 * adaptive quality scaling and GPU optimizations.
 */

import type {
  AgentDefinition,
  AgentExecutionContext,
  AgentExecutionResult,
} from "../types.js";

export const performanceOptimizationAgent: AgentDefinition = {
  metadata: {
    id: "agent-performance-optimization",
    name: "Performance Optimization Agent",
    description: "Inspects runtime performance telemetry, identifies FPS drops and memory bottlenecks, and suggests adaptive quality optimizations.",
    version: "1.0.0",
    category: "performance",
    capabilities: [
      "telemetry-inspection",
      "bottleneck-detection",
      "performance-optimization",
    ],
    acceptedInputTypes: ["performance-telemetry", "generic-json"],
    expectedOutputTypes: ["optimization-report"],
    icon: "⚡",
    author: "AF Motion Core Team",
  },
  instructions: [
    "Receive performance telemetry containing FPS, frame duration, dropped frames, and memory metrics.",
    "Invoke analyze_performance tool to diagnose bottlenecks.",
    "Formulate optimization recommendations (particle density reduction, adaptive shadow tiering, offscreen culling).",
    "Return a structured performance optimization report with health score and recommended tier.",
  ],
  validateInput: (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { valid: false, errors: ["Input must be an object with performance metrics"] };
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
      toolResult = await context.toolInvoker("analyze_performance", input as Record<string, unknown>);
    } catch (err) {
      toolSuccess = false;
      toolError = err instanceof Error ? err.message : String(err);
    } finally {
      toolCalls.push({
        toolId: "analyze_performance",
        timestamp: Date.now(),
        durationMs: performance.now() - toolStart,
        success: toolSuccess,
        error: toolError,
        inputPreview: JSON.stringify(input).slice(0, 80),
      });
    }

    const durationMs = performance.now() - startTime;
    const healthScore = (toolResult.healthScore as number) ?? 80;
    const bottlenecks = (toolResult.bottlenecks as string[]) ?? [];
    const recommendations = (toolResult.recommendations as string[]) ?? [];

    return {
      success: toolSuccess,
      agentId: "agent-performance-optimization",
      taskId: context.taskId,
      output: {
        type: "optimization-report",
        healthScore,
        tierRecommendation: toolResult.tierRecommendation ?? "high",
        bottlenecks,
        recommendations,
      },
      toolCalls,
      durationMs,
      error: toolError,
      recommendations,
      metrics: {
        healthScore,
        bottlenecksCount: bottlenecks.length,
      },
    };
  },
};
