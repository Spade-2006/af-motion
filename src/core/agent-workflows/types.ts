/**
 * AF Motion — Intelligent Agent Workflows Type Contracts (Phase 18, Prompt 144)
 *
 * Core types and data contracts for deterministic, offline-capable AI Agent Workflows,
 * including Agent identity, capability definitions, safe tool contracts, task planning,
 * context management, approval boundaries, execution telemetry, and workflow templates.
 */

export const AGENT_WORKFLOWS_SPEC_VERSION = "1.0.0";

export type AgentCategory =
  | "motion-intelligence"
  | "design-to-motion"
  | "scene-generation"
  | "performance"
  | "accessibility"
  | "composition"
  | "custom";

export type AgentCapability =
  | "motion-analysis"
  | "quality-scoring"
  | "motion-recommendations"
  | "design-interpretation"
  | "motion-planning"
  | "animation-generation"
  | "scene-understanding"
  | "scene-planning"
  | "scene-generation"
  | "telemetry-inspection"
  | "bottleneck-detection"
  | "performance-optimization"
  | "accessibility-audit"
  | "reduced-motion-adaptation"
  | "composition-validation"
  | "choreography-inspection"
  | "artifact-export";

export type AgentInputType =
  | "motion-config"
  | "design-brief"
  | "structured-design"
  | "scene-description"
  | "scene-spec"
  | "composition-graph"
  | "performance-telemetry"
  | "accessibility-spec"
  | "generic-json";

export type AgentOutputType =
  | "motion-quality-report"
  | "motion-plan"
  | "generated-animation"
  | "scene-plan"
  | "generated-scene"
  | "optimization-report"
  | "accessibility-report"
  | "composition-validation-report"
  | "export-artifacts";

export type TaskStatus =
  | "pending"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

export type WorkflowStatus =
  | "pending"
  | "planning"
  | "waiting_for_approval"
  | "running"
  | "validating"
  | "completed"
  | "failed"
  | "cancelled";

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: AgentCategory;
  capabilities: AgentCapability[];
  acceptedInputTypes: AgentInputType[];
  expectedOutputTypes: AgentOutputType[];
  icon?: string;
  author?: string;
}

export interface ToolCallLog {
  toolId: string;
  timestamp: number;
  durationMs: number;
  success: boolean;
  error?: string;
  inputPreview?: string;
}

export interface AgentExecutionContext {
  workflowId: string;
  taskId: string;
  signal?: AbortSignal;
  toolInvoker: (toolId: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  contextStore: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    getAll: () => Record<string, unknown>;
  };
  parameters?: Record<string, unknown>;
}

export interface AgentExecutionResult<TOutput = unknown> {
  success: boolean;
  agentId: string;
  taskId: string;
  output?: TOutput;
  toolCalls: ToolCallLog[];
  durationMs: number;
  error?: string;
  recommendations?: string[];
  metrics?: Record<string, number | string | boolean>;
}

export interface AgentDefinition<TInput = unknown, TOutput = unknown> {
  metadata: AgentMetadata;
  instructions: string[];
  validateInput?: (input: unknown) => { valid: boolean; errors?: string[] };
  execute: (
    input: TInput,
    context: AgentExecutionContext
  ) => Promise<AgentExecutionResult<TOutput>> | AgentExecutionResult<TOutput>;
}

// ---------------------------------------------------------------------------
// Task Planning Contracts
// ---------------------------------------------------------------------------

export interface AgentTask {
  id: string;
  description: string;
  assignedAgentId: string;
  inputs: Record<string, unknown>;
  expectedOutput: AgentOutputType;
  dependencies: string[];
  priority: number;
  status: TaskStatus;
  optional?: boolean;
  requireApproval?: boolean;
  retryPolicy?: {
    maxRetries: number;
    retryCount: number;
  };
  validationRequirements?: string[];
  output?: unknown;
  error?: string;
  executionDurationMs?: number;
  toolCalls?: ToolCallLog[];
}

export interface TaskPlan {
  workflowId: string;
  goal: string;
  tasks: AgentTask[];
  createdAt: number;
  estimatedDurationMs: number;
  tags?: string[];
  requirePlanApproval?: boolean;
}

// ---------------------------------------------------------------------------
// Safe Tool Registry Contracts
// ---------------------------------------------------------------------------

export type ToolPermission = "read" | "generate" | "validate" | "transform";

export interface ToolDefinition<
  TInput = Record<string, unknown>,
  TOutput = Record<string, unknown>
> {
  id: string;
  name: string;
  description: string;
  permission: ToolPermission;
  inputSchemaValidator: (input: unknown) => { valid: boolean; errors?: string[] };
  execute: (input: TInput, context?: { signal?: AbortSignal }) => Promise<TOutput> | TOutput;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Observability, Audit & Telemetry Contracts
// ---------------------------------------------------------------------------

export interface WorkflowAuditEntry {
  timestamp: number;
  type:
    | "workflow_started"
    | "task_started"
    | "task_completed"
    | "task_failed"
    | "task_skipped"
    | "approval_requested"
    | "approval_granted"
    | "approval_rejected"
    | "tool_invoked"
    | "workflow_completed"
    | "workflow_failed"
    | "workflow_cancelled";
  message: string;
  taskId?: string;
  agentId?: string;
  toolId?: string;
  data?: Record<string, unknown>;
}

export interface AgentWorkflowTelemetry {
  workflowId: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  skippedTasks: number;
  toolInvocationsCount: number;
  status: WorkflowStatus;
  auditTrail: WorkflowAuditEntry[];
}

// ---------------------------------------------------------------------------
// Workflow Templates & Engine Execution Contracts
// ---------------------------------------------------------------------------

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  defaultGoal: string;
  estimatedDurationMs: number;
  createPlan: (goal: string, initialInputs?: Record<string, unknown>) => TaskPlan;
}

export interface WorkflowExecutionOptions {
  requirePlanApproval?: boolean;
  requireTaskApproval?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  approvalGranted?: boolean;
  onApprovalRequired?: (request: { scope: "plan" | "task"; workflowId: string; taskId?: string; description: string }) => boolean | Promise<boolean>;
  onStateChange?: (status: WorkflowStatus, task?: AgentTask) => void;
  onAuditEntry?: (entry: WorkflowAuditEntry) => void;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  goal: string;
  status: WorkflowStatus;
  plan: TaskPlan;
  outputs: Record<string, unknown>;
  finalOutput?: unknown;
  telemetry: AgentWorkflowTelemetry;
  error?: string;
}
