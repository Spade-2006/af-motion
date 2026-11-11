/**
 * AF Motion — Agent Workflows & Multi-Agent Orchestration (Phase 18, Prompts 144–145)
 *
 * Deterministic, offline-capable AI Agent Workflow & Multi-Agent Orchestration ecosystem.
 */

// Types & Specifications (Prompt 144)
export {
  AGENT_WORKFLOWS_SPEC_VERSION,
  type AgentCategory,
  type AgentCapability,
  type AgentInputType,
  type AgentOutputType,
  type TaskStatus,
  type WorkflowStatus,
  type AgentMetadata,
  type ToolCallLog,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type AgentDefinition,
  type AgentTask,
  type TaskPlan,
  type ToolPermission,
  type ToolDefinition,
  type WorkflowAuditEntry,
  type AgentWorkflowTelemetry,
  type WorkflowTemplate,
  type WorkflowExecutionOptions,
  type WorkflowExecutionResult,
} from "./types.js";

// Multi-Agent Orchestration Types & Contracts (Prompt 145)
export {
  ORCHESTRATION_SPEC_VERSION,
  type OrchestrationStrategy,
  type AgentMessageType,
  type AgentMessage,
  type CollaborationTask,
  type CollaborationPlan,
  type SharedArtifact,
  type ConflictType,
  type ResolutionStrategy,
  type ConflictRecord,
  type QualityGateStatus,
  type QualityGateCheck,
  type CollectiveValidationResult,
  type MultiAgentDeliverable,
  type OrchestrationOptions,
} from "./orchestration-types.js";

// Agent Registry & Instances
export {
  AgentRegistry,
  agentRegistry,
} from "./agent-registry.js";

// Safe Tool Registry & Built-in Tools
export {
  SafeToolRegistry,
  safeToolRegistry,
  registerDefaultSafeTools,
} from "./tool-registry.js";

// Specialized Agents
export {
  STANDARD_AGENTS,
  registerDefaultAgents,
  motionIntelligenceAgent,
  designToMotionAgent,
  sceneGenerationAgent,
  performanceOptimizationAgent,
  accessibilityAgent,
  compositionAgent,
} from "./agents/index.js";

// Task Planner
export {
  TaskPlanner,
  taskPlanner,
  TaskPlanValidationError,
} from "./task-planner.js";

// Workflow Context & Shared Multi-Agent Context
export {
  WorkflowContext,
} from "./context.js";
export {
  SharedWorkflowContext,
} from "./shared-context.js";

// Execution Engine
export {
  WorkflowExecutionEngine,
  workflowExecutionEngine,
} from "./execution-engine.js";

// Workflow Templates
export {
  WORKFLOW_TEMPLATES,
  listWorkflowTemplates,
  getWorkflowTemplate,
} from "./templates.js";

// Multi-Agent Collaboration Planner & Orchestrator (Prompt 145)
export {
  CollaborationPlanner,
  collaborationPlanner,
} from "./collaboration-planner.js";

export {
  AgentMessageBus,
  agentMessageBus,
} from "./communication.js";

export {
  ConflictResolver,
  conflictResolver,
} from "./conflict-resolver.js";

export {
  MultiAgentOrchestrator,
  multiAgentOrchestrator,
} from "./orchestrator.js";

export {
  COLLABORATION_WORKFLOW_DEFINITIONS,
  listCollaborationWorkflows,
  getCollaborationWorkflow,
} from "./collaboration-workflows.js";
