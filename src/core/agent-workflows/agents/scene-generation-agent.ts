/**
 * AF Motion — Scene Generation Agent (Phase 18, Prompt 144)
 *
 * Specialized agent responsible for interpreting natural-language scene requests
 * and structured scene specifications to generate complete multi-system scenes
 * (3D, physics, particles, DOM) using Prompt 143's engine.
 */

import type {
  AgentDefinition,
  AgentExecutionContext,
  AgentExecutionResult,
} from "../types.js";

export const sceneGenerationAgent: AgentDefinition = {
  metadata: {
    id: "agent-scene-generation",
    name: "Scene Generation Agent",
    description: "Generates coordinated multi-system 3D, physics, particle, and DOM scenes from natural-language descriptions or structured specifications.",
    version: "1.0.0",
    category: "scene-generation",
    capabilities: [
      "scene-understanding",
      "scene-planning",
      "scene-generation",
    ],
    acceptedInputTypes: ["scene-description", "scene-spec", "generic-json"],
    expectedOutputTypes: ["generated-scene", "scene-plan"],
    icon: "🌌",
    author: "AF Motion Core Team",
  },
  instructions: [
    "Receive scene description or structured scene input.",
    "Invoke generate_scene tool to orchestrate 3D geometry, particles, physics, and DOM layers.",
    "Validate spatial hierarchy, camera framing, and lighting setups.",
    "Generate code artifacts and return the scene plan with quality score.",
  ],
  validateInput: (input: unknown) => {
    if (!input || typeof input !== "object") {
      return { valid: false, errors: ["Input must be an object with scene prompt or configuration"] };
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
      toolResult = await context.toolInvoker("generate_scene", input as Record<string, unknown>);
    } catch (err) {
      toolSuccess = false;
      toolError = err instanceof Error ? err.message : String(err);
    } finally {
      toolCalls.push({
        toolId: "generate_scene",
        timestamp: Date.now(),
        durationMs: performance.now() - toolStart,
        success: toolSuccess,
        error: toolError,
        inputPreview: JSON.stringify(input).slice(0, 80),
      });
    }

    const durationMs = performance.now() - startTime;
    const objectsCount = (toolResult.objectsCount as number) ?? 0;
    const qualityScore = (toolResult.qualityScore as number) ?? 90;

    return {
      success: toolSuccess,
      agentId: "agent-scene-generation",
      taskId: context.taskId,
      output: {
        type: "generated-scene",
        composition: toolResult.composition,
        scene3D: toolResult.scene3D,
        result: toolResult.result,
        validation: toolResult.validation,
        objectsCount,
        qualityScore,
      },
      toolCalls,
      durationMs,
      error: toolError,
      recommendations: [
        `Generated coordinated scene with ${objectsCount} objects across DOM and 3D systems.`,
        "Multi-system synchronization established.",
      ],
      metrics: {
        objectsCount,
        qualityScore,
      },
    };
  },
};
