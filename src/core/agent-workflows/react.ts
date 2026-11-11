/**
 * AF Motion — Agent Workflows & Collaboration React Integration (Phase 18, Prompts 144–145)
 *
 * Provides:
 * - `useAgentWorkflow()`: Hook for individual agent workflows (Prompt 144)
 * - `useAgentCollaboration()`: Hook for multi-agent orchestration, conflict resolution, and quality gates (Prompt 145)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  AgentMetadata,
  AgentTask,
  TaskPlan,
  WorkflowAuditEntry,
  WorkflowExecutionOptions,
  WorkflowExecutionResult,
  WorkflowStatus,
  WorkflowTemplate,
} from "./types.js";
import type {
  AgentMessage,
  CollaborationPlan,
  CollaborationTask,
  ConflictRecord,
  MultiAgentDeliverable,
  OrchestrationOptions,
  QualityGateCheck,
  ResolutionStrategy,
} from "./orchestration-types.js";
import { agentRegistry } from "./agent-registry.js";
import { safeToolRegistry } from "./tool-registry.js";
import { taskPlanner } from "./task-planner.js";
import { workflowExecutionEngine } from "./execution-engine.js";
import { listWorkflowTemplates, getWorkflowTemplate } from "./templates.js";
import { collaborationPlanner } from "./collaboration-planner.js";
import { multiAgentOrchestrator } from "./orchestrator.js";
import {
  listCollaborationWorkflows,
  getCollaborationWorkflow,
} from "./collaboration-workflows.js";
import { conflictResolver } from "./conflict-resolver.js";

// ---------------------------------------------------------------------------
// 1. Single Agent Workflow Hook (Prompt 144)
// ---------------------------------------------------------------------------

export interface UseAgentWorkflowState {
  status: WorkflowStatus;
  isExecuting: boolean;
  isWaitingForApproval: boolean;
  progress: number;
  currentTask: AgentTask | null;
  tasks: AgentTask[];
}

export interface UseAgentWorkflowReturn {
  workflowState: UseAgentWorkflowState;
  plan: TaskPlan | null;
  result: WorkflowExecutionResult | null;
  error: string | null;
  logs: WorkflowAuditEntry[];
  availableAgents: AgentMetadata[];
  availableTemplates: WorkflowTemplate[];
  availableTools: Array<{ id: string; name: string; description: string; permission: string }>;
  loadTemplate: (templateId: string, initialInputs?: Record<string, unknown>) => TaskPlan | null;
  createCustomPlan: (goal: string, tasks: Array<Omit<AgentTask, "status">>) => TaskPlan | null;
  approvePlan: () => Promise<WorkflowExecutionResult | null>;
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string, reason: string) => void;
  runWorkflow: (options?: WorkflowExecutionOptions) => Promise<WorkflowExecutionResult | null>;
  cancelWorkflow: () => void;
  reset: () => void;
}

export function useAgentWorkflow(defaultTemplateId?: string): UseAgentWorkflowReturn {
  const [plan, setPlan] = useState<TaskPlan | null>(() => {
    if (defaultTemplateId) {
      const tmpl = getWorkflowTemplate(defaultTemplateId);
      if (tmpl) return tmpl.createPlan(tmpl.defaultGoal);
    }
    return null;
  });

  const [status, setStatus] = useState<WorkflowStatus>("pending");
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [result, setResult] = useState<WorkflowExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<WorkflowAuditEntry[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const calculateProgress = useCallback((tasks: AgentTask[]): number => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === "completed" || t.status === "skipped").length;
    return Math.round((completed / tasks.length) * 100);
  }, []);

  const loadTemplate = useCallback(
    (templateId: string, initialInputs?: Record<string, unknown>): TaskPlan | null => {
      const tmpl = getWorkflowTemplate(templateId);
      if (!tmpl) {
        setError(`Workflow template "${templateId}" not found`);
        return null;
      }
      try {
        const newPlan = tmpl.createPlan(tmpl.defaultGoal, initialInputs);
        setPlan(newPlan);
        setStatus("pending");
        setCurrentTask(null);
        setResult(null);
        setError(null);
        setLogs([
          {
            timestamp: Date.now(),
            type: "workflow_started",
            message: `Loaded template "${tmpl.name}" with ${newPlan.tasks.length} task(s).`,
          },
        ]);
        return newPlan;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    []
  );

  const createCustomPlan = useCallback(
    (goal: string, tasks: Array<Omit<AgentTask, "status">>): TaskPlan | null => {
      try {
        const newPlan = taskPlanner.createCustomPlan(goal, tasks);
        setPlan(newPlan);
        setStatus("pending");
        setCurrentTask(null);
        setResult(null);
        setError(null);
        setLogs([
          {
            timestamp: Date.now(),
            type: "workflow_started",
            message: `Created custom plan for goal: "${goal}" with ${newPlan.tasks.length} task(s).`,
          },
        ]);
        return newPlan;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    []
  );

  const runWorkflow = useCallback(
    async (options?: WorkflowExecutionOptions): Promise<WorkflowExecutionResult | null> => {
      if (!plan) {
        setError("Cannot run workflow without a valid plan. Load a template or create a plan first.");
        return null;
      }

      abortControllerRef.current = new AbortController();
      setError(null);
      setStatus("running");

      try {
        const executionResult = await workflowExecutionEngine.executePlan(plan, {
          ...options,
          signal: abortControllerRef.current.signal,
          onStateChange: (newStatus, task) => {
            setStatus(newStatus);
            if (task) {
              setCurrentTask({ ...task });
              setPlan((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  tasks: prev.tasks.map((t) => (t.id === task.id ? { ...task } : t)),
                };
              });
            }
          },
        });

        setResult(executionResult);
        setStatus(executionResult.status);
        setLogs(executionResult.telemetry.auditTrail);
        if (executionResult.status === "failed") {
          setError(executionResult.error || "Workflow execution failed");
        }
        return executionResult;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("failed");
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [plan]
  );

  const approvePlan = useCallback(async (): Promise<WorkflowExecutionResult | null> => {
    return runWorkflow({ requirePlanApproval: false });
  }, [runWorkflow]);

  const approveTask = useCallback((taskId: string) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: Date.now(),
        type: "approval_granted",
        message: `Task "${taskId}" approved by user.`,
        taskId,
      },
    ]);
  }, []);

  const rejectTask = useCallback((taskId: string, reason: string) => {
    setLogs((prev) => [
      ...prev,
      {
        timestamp: Date.now(),
        type: "approval_rejected",
        message: `Task "${taskId}" rejected by user: ${reason}`,
        taskId,
      },
    ]);
    setPlan((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, status: "failed", error: `User rejected task: ${reason}` } : t
        ),
      };
    });
  }, []);

  const cancelWorkflow = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("cancelled");
    setLogs((prev) => [
      ...prev,
      {
        timestamp: Date.now(),
        type: "workflow_cancelled",
        message: "Workflow execution cancelled by user.",
      },
    ]);
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPlan(null);
    setStatus("pending");
    setCurrentTask(null);
    setResult(null);
    setError(null);
    setLogs([]);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const tasks = plan?.tasks ?? [];
  const progress = calculateProgress(tasks);

  return {
    workflowState: {
      status,
      isExecuting: status === "running" || status === "validating",
      isWaitingForApproval: status === "waiting_for_approval",
      progress,
      currentTask,
      tasks,
    },
    plan,
    result,
    error,
    logs,
    availableAgents: agentRegistry.list(),
    availableTemplates: listWorkflowTemplates(),
    availableTools: safeToolRegistry.list(),
    loadTemplate,
    createCustomPlan,
    approvePlan,
    approveTask,
    rejectTask,
    runWorkflow,
    cancelWorkflow,
    reset,
  };
}

// ---------------------------------------------------------------------------
// 2. Multi-Agent Collaboration Hook (Prompt 145)
// ---------------------------------------------------------------------------

export interface UseAgentCollaborationState {
  status: WorkflowStatus;
  isOrchestrating: boolean;
  isWaitingForApproval: boolean;
  progress: number;
  currentWave: number;
  totalWaves: number;
  activeTasks: CollaborationTask[];
  conflicts: ConflictRecord[];
  qualityGates: QualityGateCheck[];
}

export interface UseAgentCollaborationReturn {
  collaborationState: UseAgentCollaborationState;
  plan: CollaborationPlan | null;
  deliverable: MultiAgentDeliverable | null;
  messages: AgentMessage[];
  error: string | null;
  availableWorkflows: ReturnType<typeof listCollaborationWorkflows>;
  loadWorkflow: (workflowId: string, initialInputs?: Record<string, unknown>) => CollaborationPlan | null;
  createCustomCollaboration: (
    goal: string,
    tasks: Array<Omit<CollaborationTask, "status" | "waveIndex">>,
    options?: { strategy?: CollaborationPlan["strategy"]; coordinatorAgentId?: string }
  ) => CollaborationPlan | null;
  resolveConflict: (conflictId: string, strategy: ResolutionStrategy, manualSelection?: unknown) => void;
  orchestrate: (options?: OrchestrationOptions) => Promise<MultiAgentDeliverable | null>;
  cancel: () => void;
  reset: () => void;
}

export function useAgentCollaboration(defaultWorkflowId?: string): UseAgentCollaborationReturn {
  const [plan, setPlan] = useState<CollaborationPlan | null>(() => {
    if (defaultWorkflowId) {
      const wf = getCollaborationWorkflow(defaultWorkflowId);
      if (wf) return wf.createPlan(wf.defaultGoal);
    }
    return null;
  });

  const [status, setStatus] = useState<WorkflowStatus>("pending");
  const [progress, setProgress] = useState<number>(0);
  const [currentWave, setCurrentWave] = useState<number>(0);
  const [activeTasks, setActiveTasks] = useState<CollaborationTask[]>([]);
  const [deliverable, setDeliverable] = useState<MultiAgentDeliverable | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [qualityGates, setQualityGates] = useState<QualityGateCheck[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadWorkflow = useCallback(
    (workflowId: string, initialInputs?: Record<string, unknown>): CollaborationPlan | null => {
      const wf = getCollaborationWorkflow(workflowId);
      if (!wf) {
        setError(`Collaboration workflow "${workflowId}" not found`);
        return null;
      }
      try {
        const newPlan = wf.createPlan(wf.defaultGoal, initialInputs);
        setPlan(newPlan);
        setStatus("pending");
        setProgress(0);
        setCurrentWave(0);
        setActiveTasks([]);
        setDeliverable(null);
        setMessages([]);
        setConflicts([]);
        setQualityGates([]);
        setError(null);
        return newPlan;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    []
  );

  const createCustomCollaboration = useCallback(
    (
      goal: string,
      tasks: Array<Omit<CollaborationTask, "status" | "waveIndex">>,
      options?: { strategy?: CollaborationPlan["strategy"]; coordinatorAgentId?: string }
    ): CollaborationPlan | null => {
      try {
        const newPlan = collaborationPlanner.createCollaborationPlan(goal, tasks, options);
        setPlan(newPlan);
        setStatus("pending");
        setProgress(0);
        setCurrentWave(0);
        setActiveTasks([]);
        setDeliverable(null);
        setMessages([]);
        setConflicts([]);
        setQualityGates([]);
        setError(null);
        return newPlan;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    []
  );

  const resolveConflict = useCallback(
    (conflictId: string, strategy: ResolutionStrategy, manualSelection?: unknown) => {
      setConflicts((prev) =>
        prev.map((c) => {
          if (c.id === conflictId) {
            return conflictResolver.resolveConflict(c, strategy, manualSelection);
          }
          return c;
        })
      );
    },
    []
  );

  const orchestrate = useCallback(
    async (options?: OrchestrationOptions): Promise<MultiAgentDeliverable | null> => {
      if (!plan) {
        setError("Cannot orchestrate collaboration without a valid plan.");
        return null;
      }

      abortControllerRef.current = new AbortController();
      setStatus("running");
      setError(null);

      try {
        const result = await multiAgentOrchestrator.orchestrate(plan, {
          ...options,
          signal: abortControllerRef.current.signal,
          onProgress: (p, wave, tasks) => {
            setProgress(p);
            setCurrentWave(wave);
            setActiveTasks(tasks);
          },
          onMessage: (msg) => {
            setMessages((prev) => [...prev, msg]);
          },
          onConflict: (conf) => {
            setConflicts((prev) => [...prev, conf]);
          },
        });

        setDeliverable(result);
        setStatus(result.status);
        setProgress(100);
        setConflicts([...result.conflicts]);
        setQualityGates([...result.qualityValidation.gates]);
        setMessages([...result.messageAudit]);

        if (result.status === "failed") {
          setError(result.error || "Collaboration failed quality gates.");
        }
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus("failed");
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [plan]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("cancelled");
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPlan(null);
    setStatus("pending");
    setProgress(0);
    setCurrentWave(0);
    setActiveTasks([]);
    setDeliverable(null);
    setMessages([]);
    setConflicts([]);
    setQualityGates([]);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    collaborationState: {
      status,
      isOrchestrating: status === "running" || status === "validating",
      isWaitingForApproval: status === "waiting_for_approval",
      progress,
      currentWave,
      totalWaves: plan?.parallelWaves.length ?? 0,
      activeTasks,
      conflicts,
      qualityGates,
    },
    plan,
    deliverable,
    messages,
    error,
    availableWorkflows: listCollaborationWorkflows(),
    loadWorkflow,
    createCustomCollaboration,
    resolveConflict,
    orchestrate,
    cancel,
    reset,
  };
}
