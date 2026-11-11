/**
 * AF Motion — Accessibility Agent (Phase 18, Prompt 144)
 *
 * Specialized agent responsible for evaluating WCAG motion guidelines,
 * verifying prefers-reduced-motion fallback compatibility, detecting
 * vestibular triggers or excessive flashing, and recommending accessible alternatives.
 */

import type {
  AgentDefinition,
  AgentExecutionContext,
  AgentExecutionResult,
} from "../types.js";

export const accessibilityAgent: AgentDefinition = {
  metadata: {
    id: "agent-accessibility",
    name: "Accessibility Agent",
    description: "Evaluates animation accessibility, verifies prefers-reduced-motion fallbacks, identifies vestibular triggers, and validates WCAG 2.2.2 motion compliance.",
    version: "1.0.0",
    category: "accessibility",
    capabilities: [
      "accessibility-audit",
      "reduced-motion-adaptation",
    ],
    acceptedInputTypes: ["accessibility-spec", "motion-config", "generic-json"],
    expectedOutputTypes: ["accessibility-report"],
    icon: "♿",
    author: "AF Motion Core Team",
  },
  instructions: [
    "Receive motion configuration, duration, and accessibility attributes.",
    "Invoke inspect_accessibility tool to test against WCAG guidelines.",
    "Verify that motion has a fallback when prefers-reduced-motion is true.",
    "Check for animations exceeding 5s without pause controls or rapid luminance shifts.",
    "Generate accessible alternatives and return compliance report.",
  ],
  validateInput: (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { valid: false, errors: ["Input must be an object with motion accessibility properties"] };
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
      toolResult = await context.toolInvoker("inspect_accessibility", input as Record<string, unknown>);
    } catch (err) {
      toolSuccess = false;
      toolError = err instanceof Error ? err.message : String(err);
    } finally {
      toolCalls.push({
        toolId: "inspect_accessibility",
        timestamp: Date.now(),
        durationMs: performance.now() - toolStart,
        success: toolSuccess,
        error: toolError,
        inputPreview: JSON.stringify(input).slice(0, 80),
      });
    }

    const durationMs = performance.now() - startTime;
    const accessible = Boolean(toolResult.accessible);
    const violations = (toolResult.violations as string[]) ?? [];
    const recommendations = (toolResult.recommendations as string[]) ?? [];

    return {
      success: toolSuccess,
      agentId: "agent-accessibility",
      taskId: context.taskId,
      output: {
        type: "accessibility-report",
        accessible,
        wcagLevel: toolResult.wcagLevel ?? "AA",
        violations,
        recommendations,
      },
      toolCalls,
      durationMs,
      error: toolError,
      recommendations,
      metrics: {
        accessible,
        violationsCount: violations.length,
      },
    };
  },
};
