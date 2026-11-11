/**
 * AF Motion — Multi-Agent Collaboration Planner (Phase 18, Prompt 145)
 *
 * Constructs validated collaboration plans, matches required capabilities to agents,
 * resolves dependency graphs, detects cycles, and calculates parallel execution waves.
 */

import type { AgentCapability, AgentMetadata } from "./types.js";
import type {
  CollaborationPlan,
  CollaborationTask,
  OrchestrationStrategy,
} from "./orchestration-types.js";
import { agentRegistry, AgentRegistry } from "./agent-registry.js";
import { MAX_TASK_RETRIES, MAX_WORKFLOW_TASKS, TaskPlanValidationError } from "./task-planner.js";

export class CollaborationPlanner {
  constructor(private readonly registry: AgentRegistry = agentRegistry) {}

  /**
   * Automatically select the best agent for a given required capability.
   */
  public selectAgentForCapability(capability: AgentCapability): AgentMetadata {
    const candidates = this.registry.findByCapability(capability);
    if (candidates.length === 0) {
      throw new Error(`No registered agent found with required capability: "${capability}"`);
    }
    return candidates[0].metadata;
  }

  /**
   * Group tasks into parallel execution waves based on dependency levels.
   */
  public computeParallelWaves(tasks: CollaborationTask[]): string[][] {
    const taskMap = new Map<string, CollaborationTask>();
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const t of tasks) {
      taskMap.set(t.id, t);
      inDegree.set(t.id, (t.dependencies || []).length);
      dependents.set(t.id, []);
    }

    for (const t of tasks) {
      for (const depId of t.dependencies || []) {
        const list = dependents.get(depId);
        if (list) {
          list.push(t.id);
        }
      }
    }

    const waves: string[][] = [];
    let currentWave: string[] = [];

    // Wave 0: All tasks with 0 in-degree
    for (const [taskId, deg] of inDegree.entries()) {
      if (deg === 0) {
        currentWave.push(taskId);
      }
    }

    // Sort wave 0 by priority descending
    currentWave.sort((a, b) => (taskMap.get(b)?.priority ?? 0) - (taskMap.get(a)?.priority ?? 0));

    let processedCount = 0;

    while (currentWave.length > 0) {
      waves.push(currentWave);
      processedCount += currentWave.length;

      const nextWave: string[] = [];
      for (const taskId of currentWave) {
        const children = dependents.get(taskId) || [];
        for (const childId of children) {
          const currentDeg = inDegree.get(childId)! - 1;
          inDegree.set(childId, currentDeg);
          if (currentDeg === 0) {
            nextWave.push(childId);
          }
        }
      }

      nextWave.sort((a, b) => (taskMap.get(b)?.priority ?? 0) - (taskMap.get(a)?.priority ?? 0));
      currentWave = nextWave;
    }

    if (processedCount !== tasks.length) {
      const unvisited = tasks
        .filter((t) => (inDegree.get(t.id) ?? 0) > 0)
        .map((t) => t.id);
      throw new TaskPlanValidationError(
        `Circular dependency cycle detected in collaboration tasks: [${unvisited.join(", ")}]`,
        [`Circular dependency cycle detected in collaboration tasks: [${unvisited.join(", ")}]`]
      );
    }

    // Assign waveIndex to each task
    waves.forEach((wave, waveIdx) => {
      wave.forEach((taskId) => {
        const t = taskMap.get(taskId);
        if (t) {
          t.waveIndex = waveIdx;
        }
      });
    });

    return waves;
  }

  /**
   * Validates a collaboration plan.
   */
  public validateCollaborationPlan(plan: CollaborationPlan): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      issues.push("Collaboration plan must contain at least one task");
      return { valid: false, issues };
    }
    if (plan.tasks.length > MAX_WORKFLOW_TASKS) {
      issues.push(`Collaboration plan exceeds maximum allowed task count (${plan.tasks.length} > ${MAX_WORKFLOW_TASKS})`);
      return { valid: false, issues };
    }

    const taskIds = new Set<string>();
    for (const task of plan.tasks) {
      if (!task.id) {
        issues.push("Encountered task without an ID");
        continue;
      }
      if (taskIds.has(task.id)) {
        issues.push(`Duplicate task ID found: "${task.id}"`);
      }
      taskIds.add(task.id);

      // Verify assigned agent and capabilities
      const agent = this.registry.get(task.assignedAgentId);
      if (!agent) {
        issues.push(`Task "${task.id}" references unregistered agent "${task.assignedAgentId}"`);
      } else if (Array.isArray(task.requiredCapabilities)) {
        for (const cap of task.requiredCapabilities) {
          if (!agent.metadata.capabilities.includes(cap)) {
            issues.push(
              `Agent "${agent.metadata.id}" lacks required capability "${cap}" for task "${task.id}"`
            );
          }
        }
      }
    }

    // Verify dependencies
    for (const task of plan.tasks) {
      for (const depId of task.dependencies || []) {
        if (!taskIds.has(depId)) {
          issues.push(`Task "${task.id}" depends on unknown task ID "${depId}"`);
        }
        if (depId === task.id) {
          issues.push(`Task "${task.id}" cannot depend on itself`);
        }
      }
    }

    // Verify DAG acyclicity
    try {
      this.computeParallelWaves([...plan.tasks]);
    } catch (err) {
      issues.push(err instanceof Error ? err.message : String(err));
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Creates a structured collaboration plan.
   */
  public createCollaborationPlan(
    goal: string,
    tasks: Omit<CollaborationTask, "status" | "waveIndex">[],
    options?: {
      strategy?: OrchestrationStrategy;
      coordinatorAgentId?: string;
      requirePlanApproval?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): CollaborationPlan {
    const fullTasks: CollaborationTask[] = tasks.map((t) => ({
      ...t,
      status: "pending",
      dependencies: t.dependencies || [],
      priority: t.priority ?? 1,
      inputReferences: t.inputReferences || {},
      inputs: t.inputs || {},
    }));

    // Compute execution waves and detect circular dependencies
    const parallelWaves = this.computeParallelWaves(fullTasks);

    const participatingAgentIds = Array.from(
      new Set(fullTasks.map((t) => t.assignedAgentId))
    );

    const coordinator =
      options?.coordinatorAgentId ||
      participatingAgentIds[0] ||
      "agent-motion-intelligence";

    const plan: CollaborationPlan = {
      workflowId: `collab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      goal,
      strategy: options?.strategy || "hierarchical",
      coordinatorAgentId: coordinator,
      participatingAgentIds,
      tasks: fullTasks,
      parallelWaves,
      createdAt: Date.now(),
      estimatedDurationMs: fullTasks.length * 450,
      requirePlanApproval: options?.requirePlanApproval ?? false,
      metadata: options?.metadata,
    };

    const validation = this.validateCollaborationPlan(plan);
    if (!validation.valid) {
      throw new TaskPlanValidationError(
        validation.issues.join("; "),
        validation.issues
      );
    }

    return plan;
  }
}

export const collaborationPlanner = new CollaborationPlanner();
