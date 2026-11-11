/**
 * AF Motion Advanced Composition Validation & Dependency Analysis
 *
 * Validates composition syntax, timing constraints, dependency completeness,
 * and detects circular dependency graphs using Depth-First Search (DFS).
 */

import type {
  AdvancedMotionCompositionDefinition,
  CompositionValidationError,
  CompositionValidationResult,
  MotionParticipantConfig,
} from "./types.js";

/**
 * Validates an advanced motion composition and analyzes its dependency graph.
 */
export function validateAdvancedComposition(
  definition: AdvancedMotionCompositionDefinition
): CompositionValidationResult {
  const errors: CompositionValidationError[] = [];
  const warnings: string[] = [];

  // 1. Composition root validation
  if (!definition.id || definition.id.trim() === "") {
    errors.push({
      field: "id",
      code: "EMPTY_ID",
      message: "Composition must have a non-empty string identifier.",
    });
  }

  if (definition.duration !== undefined && definition.duration < 0) {
    errors.push({
      field: "duration",
      code: "INVALID_TIMING",
      message: "Composition duration cannot be negative.",
    });
  }

  if (definition.delay !== undefined && definition.delay < 0) {
    errors.push({
      field: "delay",
      code: "INVALID_TIMING",
      message: "Composition delay cannot be negative.",
    });
  }

  // 2. Participant validation & ID uniqueness
  const participants = definition.participants ?? [];
  const seenIds = new Set<string>();
  const participantMap = new Map<string, MotionParticipantConfig>();

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i]!;

    if (!p.id || p.id.trim() === "") {
      errors.push({
        field: `participants[${i}].id`,
        code: "EMPTY_ID",
        message: `Participant at index ${i} has an empty id.`,
      });
      continue;
    }

    if (seenIds.has(p.id)) {
      errors.push({
        participantId: p.id,
        field: "id",
        code: "DUPLICATE_ID",
        message: `Duplicate participant ID detected: "${p.id}".`,
      });
    } else {
      seenIds.add(p.id);
      participantMap.set(p.id, p);
    }

    if (!(p as any).system) {
      errors.push({
        participantId: (p as any).id,
        field: "system",
        code: "UNKNOWN_SYSTEM",
        message: `Participant "${(p as any).id}" must specify a motion system.`,
      });
    }

    if (p.duration !== undefined && p.duration < 0) {
      errors.push({
        participantId: p.id,
        field: "duration",
        code: "INVALID_TIMING",
        message: `Participant "${p.id}" duration cannot be negative.`,
      });
    }

    if (p.delay !== undefined && p.delay < 0) {
      errors.push({
        participantId: p.id,
        field: "delay",
        code: "INVALID_TIMING",
        message: `Participant "${p.id}" delay cannot be negative.`,
      });
    }
  }

  // 3. Dependency validation & cycle detection
  const graph = new Map<string, string[]>();
  for (const [id, p] of participantMap) {
    const deps = p.dependsOn ?? [];
    graph.set(id, [...deps]);

    for (const depId of deps) {
      if (!participantMap.has(depId)) {
        errors.push({
          participantId: id,
          field: "dependsOn",
          code: "MISSING_DEPENDENCY",
          message: `Participant "${id}" depends on non-existent participant "${depId}".`,
        });
      }
    }
  }

  // Detect circular dependencies via DFS (white/gray/black graph coloring)
  const visited = new Map<string, "visiting" | "visited">();

  function dfs(node: string, path: string[]): boolean {
    visited.set(node, "visiting");
    path.push(node);

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      const state = visited.get(neighbor);
      if (state === "visiting") {
        const cyclePath = [...path.slice(path.indexOf(neighbor)), neighbor].join(" -> ");
        errors.push({
          participantId: node,
          field: "dependsOn",
          code: "CIRCULAR_DEPENDENCY",
          message: `Circular dependency detected: ${cyclePath}.`,
        });
        return true;
      }
      if (!state && dfs(neighbor, path)) {
        return true;
      }
    }

    visited.set(node, "visited");
    path.pop();
    return false;
  }

  for (const id of participantMap.keys()) {
    if (!visited.has(id)) {
      dfs(id, []);
    }
  }

  if (participants.length === 0) {
    warnings.push("Composition contains no participants.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
