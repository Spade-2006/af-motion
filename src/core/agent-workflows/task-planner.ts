/**
 * AF Motion — Agent Task Planner (Phase 18, Prompt 144)
 *
 * Implements dependency-aware task planning, DAG validation, circular dependency detection,
 * topological sorting, and execution plan optimization for agent workflows.
 */

import type { AgentTask, TaskPlan } from "./types.js";
import { agentRegistry, AgentRegistry } from "./agent-registry.js";

export const MAX_WORKFLOW_TASKS = 100;
export const MAX_TASK_RETRIES = 5;

export class TaskPlanValidationError extends Error {
  constructor(message: string, public readonly issues: string[]) {
    super(`TaskPlan validation failed: ${message}`);
    this.name = "TaskPlanValidationError";
  }
}

export class TaskPlanner {
  constructor(private readonly registry: AgentRegistry = agentRegistry) {}

  /**
   * Validates a TaskPlan:
   * 1. Verifies that all task IDs are unique.
   * 2. Checks that assigned agents exist in the registry.
   * 3. Confirms that all dependency references resolve to existing task IDs.
   * 4. Detects circular dependencies via topological sorting (must be a DAG).
   */
  public validatePlan(plan: TaskPlan): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      issues.push("Plan must contain at least one task");
      return { valid: false, issues };
    }
    if (plan.tasks.length > MAX_WORKFLOW_TASKS) {
      issues.push(`Plan exceeds maximum allowed task count (${plan.tasks.length} > ${MAX_WORKFLOW_TASKS})`);
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

      if (task.retryPolicy) {
        const r = task.retryPolicy.maxRetries;
        if (typeof r !== "number" || !Number.isInteger(r) || r < 0 || r > MAX_TASK_RETRIES) {
          issues.push(`Task "${task.id}" has invalid retryPolicy.maxRetries (${String(r)}): must be integer 0..${MAX_TASK_RETRIES}`);
        }
      }
      // Verify assigned agent
      if (!this.registry.has(task.assignedAgentId)) {
        issues.push(
          `Task "${task.id}" references unassigned/unknown agent ID "${task.assignedAgentId}"`
        );
      }
    }

    // Check dependency targets
    for (const task of plan.tasks) {
      if (Array.isArray(task.dependencies)) {
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            issues.push(
              `Task "${task.id}" depends on unknown task ID "${depId}"`
            );
          }
          if (depId === task.id) {
            issues.push(`Task "${task.id}" cannot depend on itself`);
          }
        }
      }
    }

    // Circular dependency check using Kahn's algorithm or DFS cycle detection
    try {
      this.getTopologicalExecutionOrder(plan);
    } catch (err) {
      issues.push(err instanceof Error ? err.message : String(err));
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Returns tasks in topological dependency order.
   * Throws TaskPlanValidationError if a cycle is detected.
   */
  public getTopologicalExecutionOrder(plan: TaskPlan): AgentTask[] {
    const taskMap = new Map<string, AgentTask>();
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const task of plan.tasks) {
      taskMap.set(task.id, task);
      inDegree.set(task.id, 0);
      adjacency.set(task.id, []);
    }

    for (const task of plan.tasks) {
      const deps = task.dependencies || [];
      inDegree.set(task.id, deps.length);
      for (const depId of deps) {
        const list = adjacency.get(depId);
        if (list) {
          list.push(task.id);
        }
      }
    }

    // Kahn's algorithm: Queue all nodes with 0 in-degree
    const queue: string[] = [];
    for (const [taskId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    // Sort initial tasks by priority descending
    queue.sort((a, b) => (taskMap.get(b)?.priority ?? 0) - (taskMap.get(a)?.priority ?? 0));

    const result: AgentTask[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentTask = taskMap.get(currentId)!;
      result.push(currentTask);

      const neighbors = adjacency.get(currentId) || [];
      for (const neighborId of neighbors) {
        const newDegree = (inDegree.get(neighborId) || 1) - 1;
        inDegree.set(neighborId, newDegree);
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    if (result.length !== plan.tasks.length) {
      const unvisited = plan.tasks
        .filter((t) => !result.some((r) => r.id === t.id))
        .map((t) => t.id);
      throw new TaskPlanValidationError(
        `Circular dependency cycle detected involving task(s): [${unvisited.join(", ")}]`,
        [`Circular dependency cycle detected involving task(s): [${unvisited.join(", ")}]`]
      );
    }

    return result;
  }

  /**
   * Creates a custom task plan from goal and ordered steps.
   */
  public createCustomPlan(
    goal: string,
    tasks: Omit<AgentTask, "status">[],
    options?: { requirePlanApproval?: boolean; tags?: string[] }
  ): TaskPlan {
    const fullTasks: AgentTask[] = tasks.map((t) => ({
      ...t,
      status: "pending",
      dependencies: t.dependencies || [],
      priority: t.priority ?? 1,
    }));

    const plan: TaskPlan = {
      workflowId: `wf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      goal,
      tasks: fullTasks,
      createdAt: Date.now(),
      estimatedDurationMs: fullTasks.length * 400,
      requirePlanApproval: options?.requirePlanApproval ?? false,
      tags: options?.tags,
    };

    const validation = this.validatePlan(plan);
    if (!validation.valid) {
      throw new TaskPlanValidationError(
        validation.issues.join("; "),
        validation.issues
      );
    }

    return plan;
  }
}

export const taskPlanner = new TaskPlanner();
