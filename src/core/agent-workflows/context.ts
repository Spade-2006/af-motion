/**
 * AF Motion — Workflow Context & Audit Manager (Phase 18, Prompt 144)
 *
 * Implements workflow-scoped context stores, immutable output tracking,
 * and structured audit logs for full execution observability.
 */

import type {
  AgentWorkflowTelemetry,
  ToolCallLog,
  WorkflowAuditEntry,
  WorkflowStatus,
} from "./types.js";

export class WorkflowContext {
  public readonly workflowId: string;
  public readonly goal: string;
  private readonly store = new Map<string, unknown>();
  private readonly taskOutputs = new Map<string, unknown>();
  private readonly auditTrail: WorkflowAuditEntry[] = [];
  private readonly toolCalls: ToolCallLog[] = [];
  private readonly startTime: number;
  private endTime?: number;
  private status: WorkflowStatus = "pending";

  constructor(workflowId: string, goal: string, initialData?: Record<string, unknown>) {
    this.workflowId = workflowId;
    this.goal = goal;
    this.startTime = Date.now();

    if (initialData) {
      for (const [k, v] of Object.entries(initialData)) {
        this.store.set(k, v);
      }
    }

    this.logAudit({
      type: "workflow_started",
      message: `Workflow started with goal: "${goal}"`,
    });
  }

  public get(key: string): unknown {
    return this.store.get(key);
  }

  public set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  public getAll(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of this.store.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  public setTaskOutput(taskId: string, output: unknown): void {
    this.taskOutputs.set(taskId, output);
  }

  public getTaskOutput<T = unknown>(taskId: string): T | undefined {
    return this.taskOutputs.get(taskId) as T | undefined;
  }

  public getAllTaskOutputs(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of this.taskOutputs.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  public recordToolCall(log: ToolCallLog): void {
    this.toolCalls.push(log);
    this.logAudit({
      type: "tool_invoked",
      message: `Tool "${log.toolId}" invoked (${log.durationMs.toFixed(1)}ms, success: ${log.success})`,
      toolId: log.toolId,
    });
  }

  public logAudit(entry: Omit<WorkflowAuditEntry, "timestamp">): void {
    this.auditTrail.push({
      timestamp: Date.now(),
      ...entry,
    });
  }

  public getAuditTrail(): WorkflowAuditEntry[] {
    return [...this.auditTrail];
  }

  public setStatus(status: WorkflowStatus): void {
    this.status = status;
    if (status === "completed" || status === "failed" || status === "cancelled") {
      this.endTime = Date.now();
    }
  }

  public getStatus(): WorkflowStatus {
    return this.status;
  }

  public getTelemetry(taskCounts: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
  }): AgentWorkflowTelemetry {
    const durationMs = (this.endTime ?? Date.now()) - this.startTime;
    return {
      workflowId: this.workflowId,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs,
      totalTasks: taskCounts.total,
      completedTasks: taskCounts.completed,
      failedTasks: taskCounts.failed,
      skippedTasks: taskCounts.skipped,
      toolInvocationsCount: this.toolCalls.length,
      status: this.status,
      auditTrail: [...this.auditTrail],
    };
  }
}
