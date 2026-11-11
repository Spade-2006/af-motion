/**
 * AF Motion — Multi-Agent Collaboration & Orchestration Types (Phase 18, Prompt 145)
 *
 * Core data contracts for coordinated multi-agent orchestration, communication protocols,
 * shared artifact stores, conflict resolution, parallel wave scheduling, and collective quality gates.
 */

import type {
  AgentCapability,
  AgentMetadata,
  AgentOutputType,
  TaskStatus,
  WorkflowStatus,
} from "./types.js";

export const ORCHESTRATION_SPEC_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// 1. Orchestration Strategies
// ---------------------------------------------------------------------------

export type OrchestrationStrategy =
  | "sequential"       // One agent's output feeds the next agent sequentially
  | "parallel"         // Independent agents execute concurrently in waves
  | "hierarchical"     // A coordinator agent delegates tasks to specialized agents
  | "pipeline"         // Streamlined linear processing through specialized agents
  | "review-and-refine"; // Generator creates an artifact; reviewer agents inspect and refine

// ---------------------------------------------------------------------------
// 2. Structured Agent Communication Protocol
// ---------------------------------------------------------------------------

export type AgentMessageType =
  | "task_assignment"
  | "task_completion"
  | "artifact_delivery"
  | "analysis_findings"
  | "recommendations"
  | "validation_results"
  | "clarification_request"
  | "failure_notification"
  | "approval_request";

export interface AgentMessage {
  readonly id: string;
  readonly workflowId: string;
  readonly senderAgentId: string;
  readonly recipientAgentId: string; // Specific agent ID, or "*" for broadcast / coordinator
  readonly type: AgentMessageType;
  readonly sequenceNumber: number;
  readonly timestamp: number;
  readonly payloadReference?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly schemaVersion: string;
}

// ---------------------------------------------------------------------------
// 3. Collaboration Plan & Tasks
// ---------------------------------------------------------------------------

export interface CollaborationTask {
  id: string;
  description: string;
  assignedAgentId: string;
  requiredCapabilities: AgentCapability[];
  inputReferences: Record<string, string>; // Maps input parameter name to an artifactKey or taskId
  inputs: Record<string, unknown>;
  expectedOutput: AgentOutputType;
  dependencies: string[];
  priority: number;
  status: TaskStatus;
  waveIndex?: number;
  optional?: boolean;
  requireApproval?: boolean;
  retryPolicy?: {
    maxRetries: number;
    retryCount: number;
  };
  validationRequirements?: string[];
  output?: unknown;
  artifactKey?: string;
  error?: string;
  executionDurationMs?: number;
}

export interface CollaborationPlan {
  readonly workflowId: string;
  readonly goal: string;
  readonly strategy: OrchestrationStrategy;
  readonly coordinatorAgentId: string;
  readonly participatingAgentIds: readonly string[];
  readonly tasks: readonly CollaborationTask[];
  readonly parallelWaves: readonly (readonly string[])[]; // Array of task ID waves
  readonly createdAt: number;
  readonly estimatedDurationMs: number;
  readonly requirePlanApproval?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// 4. Shared Artifact & Context
// ---------------------------------------------------------------------------

export interface SharedArtifact<T = unknown> {
  readonly key: string;
  readonly version: number;
  readonly type: AgentOutputType;
  readonly producerAgentId: string;
  readonly taskId: string;
  readonly createdAt: number;
  readonly immutable: boolean;
  readonly data: T;
  readonly hash: string;
  readonly tags?: readonly string[];
}

// ---------------------------------------------------------------------------
// 5. Conflict Detection & Resolution
// ---------------------------------------------------------------------------

export type ConflictType =
  | "conflicting_config"
  | "incompatible_recommendation"
  | "token_mismatch"
  | "performance_vs_quality"
  | "accessibility_violation"
  | "dependency_cycle";

export type ResolutionStrategy =
  | "priority_based"
  | "rule_based"
  | "dependency_aware"
  | "human_approval"
  | "reject_with_explanation";

export interface ConflictRecord {
  readonly id: string;
  readonly workflowId: string;
  readonly conflictType: ConflictType;
  readonly participatingAgentIds: readonly string[];
  readonly conflictingArtifactKeys: readonly string[];
  readonly details: string;
  readonly resolutionStrategy: ResolutionStrategy;
  readonly selectedResolution?: unknown;
  readonly reason: string;
  readonly approvalStatus: "pending" | "approved" | "rejected" | "auto_resolved";
  readonly resolvedAt?: number;
}

// ---------------------------------------------------------------------------
// 6. Collective Validation & Quality Gates
// ---------------------------------------------------------------------------

export type QualityGateStatus = "passed" | "failed" | "warning" | "not_evaluated";

export interface QualityGateCheck {
  readonly id: string;
  readonly name: string;
  readonly required: boolean;
  readonly status: QualityGateStatus;
  readonly summary: string;
  readonly evaluatedByAgentId?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface CollectiveValidationResult {
  readonly passed: boolean;
  readonly gates: readonly QualityGateCheck[];
  readonly overallQualityScore: number;
  readonly issues: readonly string[];
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// 7. Multi-Agent Deliverable & Orchestration Options
// ---------------------------------------------------------------------------

export interface MultiAgentDeliverable {
  readonly workflowId: string;
  readonly goal: string;
  readonly strategy: OrchestrationStrategy;
  readonly status: WorkflowStatus;
  readonly plan: CollaborationPlan;
  readonly participatingAgents: readonly AgentMetadata[];
  readonly artifacts: Readonly<Record<string, SharedArtifact>>;
  readonly consolidatedDeliverable?: unknown;
  readonly qualityValidation: CollectiveValidationResult;
  readonly conflicts: readonly ConflictRecord[];
  readonly messageAudit: readonly AgentMessage[];
  readonly telemetry: {
    readonly startTime: number;
    readonly endTime: number;
    readonly durationMs: number;
    readonly waveCount: number;
    readonly tasksCompleted: number;
    readonly tasksFailed: number;
    readonly messagesSent: number;
  };
  readonly error?: string;
}

export interface OrchestrationOptions {
  strategy?: OrchestrationStrategy;
  maxConcurrency?: number;
  requirePlanApproval?: boolean;
  requireConflictApproval?: boolean;
  approvalGranted?: boolean;
  onApprovalRequired?: (request: { scope: "plan" | "task"; workflowId: string; taskId?: string; description: string }) => boolean | Promise<boolean>;
  timeoutMs?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number, currentWave: number, activeTasks: CollaborationTask[]) => void;
  onMessage?: (message: AgentMessage) => void;
  onConflict?: (conflict: ConflictRecord) => void;
}
