/**
 * AF Motion — Unified AI Ecosystem Types & Contracts (Phase 18, Prompt 146)
 *
 * Comprehensive data contracts for Phase 18 AI Ecosystem Integration,
 * including Unified Capability Registry, End-to-End Pipeline Coordinator,
 * Hardened Provider Architecture, Result Statuses, and Quality Gates.
 */

import type {
  MotionDNAPersonalityOption,
} from "../design-to-motion/types.js";
import type {
  OrchestrationStrategy,
  QualityGateCheck,
  CollectiveValidationResult,
  SharedArtifact,
} from "../agent-workflows/orchestration-types.js";
import type {
  MotionComposition,
} from "../composition.js";

export const AI_ECOSYSTEM_SPEC_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// 1. Unified AI Capability Registry Contracts
// ---------------------------------------------------------------------------

export type AICapabilityCategory =
  | "intelligence"
  | "generation"
  | "analysis"
  | "orchestration"
  | "export";

export type AICapabilityId =
  | "motion-analysis"
  | "quality-evaluation"
  | "motion-recommendations"
  | "design-to-motion-generation"
  | "scene-generation"
  | "performance-analysis"
  | "accessibility-analysis"
  | "composition-validation"
  | "agent-workflows"
  | "multi-agent-orchestration"
  | "conflict-resolution"
  | "export-generation";

export interface AICapabilityDescriptor {
  readonly id: AICapabilityId;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: AICapabilityCategory;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly outputSchema: Readonly<Record<string, unknown>>;
  readonly requiredDependencies: readonly string[];
  readonly executionMode: "sync" | "async" | "both";
  readonly supportedProviders: readonly string[];
}

// ---------------------------------------------------------------------------
// 2. End-to-End Pipeline Request & Result Contracts
// ---------------------------------------------------------------------------

export type AIEcosystemScenario =
  | "design-to-motion"
  | "scene-generation"
  | "multi-agent-collaboration"
  | "quality-audit";

export type AIEcosystemResultState =
  | "success"
  | "success_with_warnings"
  | "needs_approval"
  | "failed_validation"
  | "cancelled"
  | "failed_execution";

export interface AIEcosystemRequest {
  readonly scenario: AIEcosystemScenario;
  readonly goal: string;
  readonly input?: Readonly<Record<string, unknown>>;
  readonly options?: {
    readonly strategy?: OrchestrationStrategy;
    readonly requireApproval?: boolean;
    readonly timeoutMs?: number;
    readonly signal?: AbortSignal;
    readonly motionDNA?: MotionDNAPersonalityOption;
    readonly paletteId?: string;
  };
}

export interface AIEcosystemResponse<TOutput = unknown> {
  readonly executionId: string;
  readonly scenario: AIEcosystemScenario;
  readonly state: AIEcosystemResultState;
  readonly goal: string;
  readonly qualityScore: number;
  readonly qualityGrade: "A" | "B" | "C" | "D" | "F";
  readonly output: TOutput;
  readonly composition?: MotionComposition;
  readonly artifacts: Readonly<Record<string, SharedArtifact>>;
  readonly qualityGates: readonly QualityGateCheck[];
  readonly recommendations: readonly string[];
  readonly warnings: readonly string[];
  readonly telemetry: {
    readonly startTime: number;
    readonly endTime: number;
    readonly durationMs: number;
    readonly providerId: string;
    readonly memoryUsageMB?: number;
  };
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// 3. Provider Architecture Contracts
// ---------------------------------------------------------------------------

export interface IAIEcosystemProvider {
  readonly id: string;
  readonly name: string;
  readonly isLocal: boolean;
  readonly capabilities: readonly AICapabilityId[];
  executeScenario<TOutput = unknown>(
    request: AIEcosystemRequest,
    scenarioRunner?: (req: AIEcosystemRequest) => Promise<AIEcosystemResponse<TOutput>>
  ): Promise<AIEcosystemResponse<TOutput>>;
}
