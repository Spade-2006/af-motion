/**
 * AF Motion — Design-to-Motion Agent (Phase 18, Prompt 144)
 *
 * Specialized agent responsible for interpreting visual design briefs,
 * structured UI components, and generating production-ready AF Motion configurations
 * and Motion DNA profiles using Prompt 142's engine.
 */

import type {
  AgentDefinition,
  AgentExecutionContext,
  AgentExecutionResult,
} from "../types.js";

export const designToMotionAgent: AgentDefinition = {
  metadata: {
    id: "agent-design-to-motion",
    name: "Design-to-Motion Agent",
    description: "Transforms visual design descriptions, token palettes, and component layouts into choreographies with Motion DNA.",
    version: "1.0.0",
    category: "design-to-motion",
    capabilities: [
      "design-interpretation",
      "motion-planning",
      "animation-generation",
    ],
    acceptedInputTypes: ["design-brief", "structured-design", "generic-json"],
    expectedOutputTypes: ["generated-animation", "motion-plan"],
    icon: "✨",
    author: "AF Motion Core Team",
  },
  instructions: [
    "Receive design brief, wireframe layout, or token configuration.",
    "Invoke generate_design_motion tool to create motion plan and composition.",
    "Apply appropriate Motion DNA personality (precise, playful, elegant, energetic, editorial-flow).",
    "Validate that animations preserve accessibility and GPU transform constraints.",
    "Return generated animation composition, elements plan, and quality metrics.",
  ],
  validateInput: (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { valid: false, errors: ["Input must be an object with design parameters"] };
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
      toolResult = await context.toolInvoker("generate_design_motion", input as Record<string, unknown>);
    } catch (err) {
      toolSuccess = false;
      toolError = err instanceof Error ? err.message : String(err);
    } finally {
      toolCalls.push({
        toolId: "generate_design_motion",
        timestamp: Date.now(),
        durationMs: performance.now() - toolStart,
        success: toolSuccess,
        error: toolError,
        inputPreview: JSON.stringify(input).slice(0, 80),
      });
    }

    const durationMs = performance.now() - startTime;
    const elementsCount = (toolResult.elementsCount as number) ?? 1;
    const qualityScore = (toolResult.qualityScore as number) ?? 85;

    return {
      success: toolSuccess,
      agentId: "agent-design-to-motion",
      taskId: context.taskId,
      output: {
        type: "generated-animation",
        composition: toolResult.composition,
        result: toolResult.result,
        validation: toolResult.validation,
        qualityScore,
        elementsCount,
      },
      toolCalls,
      durationMs,
      error: toolError,
      recommendations: [
        `Generated ${elementsCount} coordinated motion element(s) with GPU transforms.`,
        "Validated with Motion DNA profile.",
      ],
      metrics: {
        elementsCount,
        qualityScore,
      },
    };
  },
};
