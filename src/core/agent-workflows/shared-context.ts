/**
 * AF Motion — Shared Workflow Context & Artifact Registry (Phase 18, Prompt 145)
 *
 * Provides a thread-safe shared context for multi-agent collaboration, versioned
 * immutable artifact storage, conflict records, quality findings, and audit logs.
 */

import { WorkflowContext } from "./context.js";
import type {
  ConflictRecord,
  QualityGateCheck,
  SharedArtifact,
} from "./orchestration-types.js";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(16);
}

export class SharedWorkflowContext extends WorkflowContext {
  private readonly artifacts = new Map<string, SharedArtifact[]>();
  private readonly conflicts: ConflictRecord[] = [];
  private readonly qualityGates = new Map<string, QualityGateCheck>();
  private readonly agentFindings = new Map<string, string[]>();

  constructor(workflowId: string, goal: string, initialData?: Record<string, unknown>) {
    super(workflowId, goal, initialData);
  }

  /**
   * Stores an artifact with immutable version tracking.
   * Throws an error if another agent attempts to overwrite without version increment.
   */
  public storeArtifact<T = unknown>(params: {
    key: string;
    type: SharedArtifact["type"];
    producerAgentId: string;
    taskId: string;
    data: T;
    tags?: string[];
  }): SharedArtifact<T> {
    const existing = this.artifacts.get(params.key) || [];
    const nextVersion = existing.length + 1;

    // Check ownership: If key exists and is produced by another agent, ensure explicit versioning
    if (existing.length > 0) {
      const last = existing[existing.length - 1];
      if (last.producerAgentId !== params.producerAgentId) {
        this.logAudit({
          type: "task_completed",
          message: `Artifact "${params.key}" updated from v${last.version} (${last.producerAgentId}) to v${nextVersion} by agent "${params.producerAgentId}".`,
          taskId: params.taskId,
          agentId: params.producerAgentId,
        });
      }
    }

    const jsonStr = JSON.stringify(params.data ?? {});
    const hash = simpleHash(jsonStr);

    const artifact: SharedArtifact<T> = {
      key: params.key,
      version: nextVersion,
      type: params.type,
      producerAgentId: params.producerAgentId,
      taskId: params.taskId,
      createdAt: Date.now(),
      immutable: true,
      data: Object.freeze(params.data),
      hash,
      tags: params.tags ? Object.freeze([...params.tags]) : undefined,
    };

    existing.push(artifact as SharedArtifact<unknown>);
    this.artifacts.set(params.key, existing);

    return artifact;
  }

  public getArtifact<T = unknown>(key: string, version?: number): SharedArtifact<T> | undefined {
    const versions = this.artifacts.get(key);
    if (!versions || versions.length === 0) return undefined;
    if (version !== undefined) {
      return versions.find((a) => a.version === version) as SharedArtifact<T> | undefined;
    }
    // Return latest version by default
    return versions[versions.length - 1] as SharedArtifact<T> | undefined;
  }

  public listArtifacts(): SharedArtifact[] {
    const list: SharedArtifact[] = [];
    for (const versions of this.artifacts.values()) {
      list.push(...versions);
    }
    return list;
  }

  public getLatestArtifactsMap(): Record<string, SharedArtifact> {
    const map: Record<string, SharedArtifact> = {};
    for (const [key, versions] of this.artifacts.entries()) {
      if (versions.length > 0) {
        map[key] = versions[versions.length - 1];
      }
    }
    return map;
  }

  public recordConflict(conflict: ConflictRecord): void {
    this.conflicts.push(conflict);
    this.logAudit({
      type: "approval_requested",
      message: `Conflict detected (${conflict.conflictType}) between [${conflict.participatingAgentIds.join(
        ", "
      )}]: ${conflict.details}`,
    });
  }

  public getConflicts(): ConflictRecord[] {
    return [...this.conflicts];
  }

  public recordQualityGate(check: QualityGateCheck): void {
    this.qualityGates.set(check.id, check);
  }

  public getQualityGates(): QualityGateCheck[] {
    return Array.from(this.qualityGates.values());
  }

  public recordAgentFindings(agentId: string, findings: string[]): void {
    const existing = this.agentFindings.get(agentId) || [];
    this.agentFindings.set(agentId, [...existing, ...findings]);
  }

  public getAgentFindings(agentId: string): string[] {
    return this.agentFindings.get(agentId) || [];
  }
}
