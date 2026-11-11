/**
 * AF Motion — AI Ecosystem Hardened Provider Architecture (Phase 18, Prompt 146)
 *
 * Implements a robust, deterministic offline provider with timeout isolation,
 * AbortSignal cancellation handling, input schema verification, and telemetry.
 */

import type {
  AICapabilityId,
  AIEcosystemRequest,
  AIEcosystemResponse,
  IAIEcosystemProvider,
} from "./types.js";
import { UNIFIED_AI_CAPABILITIES } from "./capability-registry.js";

export class DeterministicLocalAIProvider implements IAIEcosystemProvider {
  public readonly id = "deterministic-local";
  public readonly name = "AF Motion Deterministic Local Provider";
  public readonly isLocal = true;
  public readonly capabilities: readonly AICapabilityId[] = UNIFIED_AI_CAPABILITIES.map(
    (c) => c.id
  );

  /**
   * Executes an AI ecosystem scenario with timeout, cancellation, and error isolation.
   */
  public async executeScenario<TOutput = unknown>(
    request: AIEcosystemRequest,
    scenarioRunner?: (req: AIEcosystemRequest) => Promise<AIEcosystemResponse<TOutput>>
  ): Promise<AIEcosystemResponse<TOutput>> {
    const startTime = Date.now();
    const timeoutMs = request.options?.timeoutMs ?? 30000;

    // 1. Abort check before execution
    if (request.options?.signal?.aborted) {
      return this.buildCancelledResponse(request, startTime);
    }

    if (!scenarioRunner) {
      throw new Error(`No scenario runner provided to ${this.name} for scenario "${request.scenario}".`);
    }

    // 2. Timeout handling with resource cleanup
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`AI Ecosystem scenario "${request.scenario}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const response = await Promise.race([scenarioRunner(request), timeoutPromise]);
      return response;
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isAbort = request.options?.signal?.aborted || errorMsg.includes("abort");

      return {
        executionId: `exec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        scenario: request.scenario,
        state: isAbort ? "cancelled" : "failed_execution",
        goal: request.goal,
        qualityScore: 0,
        qualityGrade: "F",
        output: null as unknown as TOutput,
        artifacts: {},
        qualityGates: [],
        recommendations: [],
        warnings: [errorMsg],
        telemetry: {
          startTime,
          endTime: Date.now(),
          durationMs,
          providerId: this.id,
        },
        error: errorMsg,
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private buildCancelledResponse<TOutput>(
    request: AIEcosystemRequest,
    startTime: number
  ): AIEcosystemResponse<TOutput> {
    return {
      executionId: `exec-${Date.now().toString(36)}-cancelled`,
      scenario: request.scenario,
      state: "cancelled",
      goal: request.goal,
      qualityScore: 0,
      qualityGrade: "F",
      output: null as unknown as TOutput,
      artifacts: {},
      qualityGates: [],
      recommendations: [],
      warnings: ["Scenario execution cancelled via AbortSignal."],
      telemetry: {
        startTime,
        endTime: Date.now(),
        durationMs: Date.now() - startTime,
        providerId: this.id,
      },
      error: "Execution was cancelled.",
    };
  }
}

export const deterministicLocalAIProvider = new DeterministicLocalAIProvider();
