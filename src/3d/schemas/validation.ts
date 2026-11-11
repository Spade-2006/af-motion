/**
 * AF Motion 3D Scene Specification Validation
 *
 * Structured validation, spatial transform checks, hierarchy cycle detection,
 * dangling reference detection, and interaction/timeline target verification.
 */

import type { Scene3DSpecification, SceneObjectSpec, Transform3D } from "./types.js";

export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly code: string;
  readonly severity: "error" | "warning";
}

export interface ValidationReport {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
}

function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

function isValidTuple3(val: unknown): val is readonly [number, number, number] {
  return (
    Array.isArray(val) &&
    val.length === 3 &&
    isFiniteNumber(val[0]) &&
    isFiniteNumber(val[1]) &&
    isFiniteNumber(val[2])
  );
}

function isValidTuple4(val: unknown): val is readonly [number, number, number, number] {
  return (
    Array.isArray(val) &&
    val.length === 4 &&
    isFiniteNumber(val[0]) &&
    isFiniteNumber(val[1]) &&
    isFiniteNumber(val[2]) &&
    isFiniteNumber(val[3])
  );
}

/**
 * Validate a Transform3D spatial configuration.
 */
export function validateTransform(transform: unknown, path = "transform"): ValidationError[] {
  const issues: ValidationError[] = [];
  if (!transform || typeof transform !== "object") {
    issues.push({
      path,
      message: "Transform must be an object",
      code: "INVALID_TRANSFORM",
      severity: "error",
    });
    return issues;
  }

  const t = transform as Partial<Transform3D>;

  if (t.position !== undefined) {
    if (!isValidTuple3(t.position)) {
      issues.push({
        path: `${path}.position`,
        message: "Position must be an array of 3 finite numbers [x, y, z]",
        code: "INVALID_POSITION",
        severity: "error",
      });
    }
  }

  if (t.rotation !== undefined) {
    if (!isValidTuple3(t.rotation)) {
      issues.push({
        path: `${path}.rotation`,
        message: "Rotation must be an array of 3 finite numbers [x, y, z] in radians",
        code: "INVALID_ROTATION",
        severity: "error",
      });
    }
  }

  if (t.quaternion !== undefined) {
    if (!isValidTuple4(t.quaternion)) {
      issues.push({
        path: `${path}.quaternion`,
        message: "Quaternion must be an array of 4 finite numbers [x, y, z, w]",
        code: "INVALID_QUATERNION",
        severity: "error",
      });
    } else {
      const [x, y, z, w] = t.quaternion;
      const lengthSq = x * x + y * y + z * z + w * w;
      if (lengthSq === 0) {
        issues.push({
          path: `${path}.quaternion`,
          message: "Quaternion cannot have zero length",
          code: "DEGENERATE_QUATERNION",
          severity: "error",
        });
      }
    }
  }

  if (t.scale !== undefined) {
    if (!isValidTuple3(t.scale)) {
      issues.push({
        path: `${path}.scale`,
        message: "Scale must be an array of 3 finite numbers [x, y, z]",
        code: "INVALID_SCALE",
        severity: "error",
      });
    } else if (t.scale[0] === 0 || t.scale[1] === 0 || t.scale[2] === 0) {
      issues.push({
        path: `${path}.scale`,
        message: "Scale contains zero dimension which may cause visual collapse",
        code: "ZERO_SCALE",
        severity: "warning",
      });
    }
  }

  return issues;
}

const VALID_OBJECT_TYPES = new Set([
  "group",
  "mesh",
  "primitive",
  "light",
  "camera",
  "environment",
  "model",
  "interactive",
  "custom",
]);

/**
 * Validate a single SceneObjectSpec node.
 */
export function validateSceneObject(obj: unknown, path = "object"): ValidationError[] {
  const issues: ValidationError[] = [];

  if (!obj || typeof obj !== "object") {
    issues.push({
      path,
      message: "Scene object must be an object",
      code: "INVALID_OBJECT",
      severity: "error",
    });
    return issues;
  }

  const node = obj as Record<string, unknown>;

  if (typeof node.id !== "string" || node.id.trim() === "") {
    issues.push({
      path: `${path}.id`,
      message: "Scene object requires a non-empty string 'id'",
      code: "MISSING_OBJECT_ID",
      severity: "error",
    });
  }

  if (typeof node.type !== "string" || !VALID_OBJECT_TYPES.has(node.type)) {
    issues.push({
      path: `${path}.type`,
      message: `Invalid object type: '${node.type}'. Must be one of: ${Array.from(VALID_OBJECT_TYPES).join(", ")}`,
      code: "INVALID_OBJECT_TYPE",
      severity: "error",
    });
  }

  if (node.transform !== undefined) {
    issues.push(...validateTransform(node.transform, `${path}.transform`));
  }

  // Primitive geometry validation
  if (node.type === "primitive") {
    const geo = node.geometry as Record<string, unknown> | undefined;
    if (!geo || typeof geo !== "object") {
      issues.push({
        path: `${path}.geometry`,
        message: "Primitive object requires a geometry descriptor",
        code: "MISSING_PRIMITIVE_GEOMETRY",
        severity: "error",
      });
    } else if (typeof geo.primitive !== "string") {
      issues.push({
        path: `${path}.geometry.primitive`,
        message: "Primitive geometry requires a 'primitive' type string",
        code: "INVALID_PRIMITIVE_TYPE",
        severity: "error",
      });
    }
  }

  // Model reference validation
  if (node.type === "model") {
    const model = node.model as Record<string, unknown> | undefined;
    if (!model || typeof model !== "object") {
      issues.push({
        path: `${path}.model`,
        message: "Model object requires a model descriptor",
        code: "MISSING_MODEL_SPEC",
        severity: "error",
      });
    } else if (typeof model.url !== "string" || model.url.trim() === "") {
      issues.push({
        path: `${path}.model.url`,
        message: "Model requires a non-empty 'url' string",
        code: "MISSING_MODEL_URL",
        severity: "error",
      });
    }
  }

  // Recursive validation of children
  if (Array.isArray(node.children)) {
    node.children.forEach((child, index) => {
      issues.push(...validateSceneObject(child, `${path}.children[${index}]`));
    });
  }

  return issues;
}

/**
 * Validate object hierarchy, circular relationships, and dangling parent references.
 */
export function validateSceneHierarchy(objects: readonly unknown[]): ValidationError[] {
  const issues: ValidationError[] = [];
  const knownIds = new Set<string>();
  const parentMap = new Map<string, string>(); // childId -> parentId

  function collectNodes(nodes: readonly unknown[], currentParentId?: string) {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const obj = node as Record<string, unknown>;
      const id = typeof obj.id === "string" ? obj.id : undefined;

      if (id) {
        if (knownIds.has(id)) {
          issues.push({
            path: `objects.${id}`,
            message: `Duplicate object ID detected: '${id}'`,
            code: "DUPLICATE_OBJECT_ID",
            severity: "error",
          });
        } else {
          knownIds.add(id);
        }

        const explicitParent = typeof obj.parentId === "string" ? obj.parentId : currentParentId;
        if (explicitParent) {
          parentMap.set(id, explicitParent);
        }
      }

      if (Array.isArray(obj.children)) {
        collectNodes(obj.children, id);
      }
    }
  }

  collectNodes(objects);

  // Check dangling parent references and cycles
  for (const [childId, parentId] of parentMap.entries()) {
    if (!knownIds.has(parentId)) {
      issues.push({
        path: `objects.${childId}.parentId`,
        message: `Object '${childId}' references non-existent parent '${parentId}'`,
        code: "DANGLING_PARENT_REFERENCE",
        severity: "error",
      });
      continue;
    }

    // Cycle detection via ancestor traversal
    const visited = new Set<string>([childId]);
    let curr = parentId;
    while (curr) {
      if (visited.has(curr)) {
        issues.push({
          path: `objects.${childId}`,
          message: `Circular hierarchy detected involving object '${childId}' and ancestor '${curr}'`,
          code: "CIRCULAR_HIERARCHY",
          severity: "error",
        });
        break;
      }
      visited.add(curr);
      curr = parentMap.get(curr) || "";
    }
  }

  return issues;
}

/**
 * Validate an entire complete 3D scene specification.
 */
export function validateSceneSchema(scene: unknown): ValidationReport {
  const allIssues: ValidationError[] = [];

  if (!scene || typeof scene !== "object") {
    return {
      valid: false,
      errors: [
        {
          path: "root",
          message: "Scene specification must be an object",
          code: "INVALID_SCENE_SPEC",
          severity: "error",
        },
      ],
      warnings: [],
    };
  }

  const spec = scene as Partial<Scene3DSpecification>;

  if (typeof spec.id !== "string" || spec.id.trim() === "") {
    allIssues.push({
      path: "id",
      message: "Scene specification requires a non-empty string 'id'",
      code: "MISSING_SCENE_ID",
      severity: "error",
    });
  }

  if (typeof spec.version !== "string" || spec.version.trim() === "") {
    allIssues.push({
      path: "version",
      message: "Scene specification requires a valid 'version' string",
      code: "MISSING_SCENE_VERSION",
      severity: "error",
    });
  }

  if (!Array.isArray(spec.objects)) {
    allIssues.push({
      path: "objects",
      message: "Scene specification requires an 'objects' array",
      code: "MISSING_OBJECTS_ARRAY",
      severity: "error",
    });
  } else {
    // Validate individual objects
    spec.objects.forEach((obj, idx) => {
      allIssues.push(...validateSceneObject(obj, `objects[${idx}]`));
    });

    // Validate hierarchy & cycles
    allIssues.push(...validateSceneHierarchy(spec.objects));

    // Collect all known object IDs for interaction & timeline cross-referencing
    const knownObjectIds = new Set<string>();
    const collectIds = (nodes: readonly SceneObjectSpec[]) => {
      for (const n of nodes) {
        if (typeof n.id === "string") knownObjectIds.add(n.id);
        if (Array.isArray(n.children)) collectIds(n.children);
      }
    };
    collectIds(spec.objects);

    // Validate interaction action target references
    const checkInteraction = (obj: any, path: string) => {
      const interaction = obj.interaction;
      if (interaction && typeof interaction === "object" && interaction.targetId) {
        if (!knownObjectIds.has(interaction.targetId)) {
          allIssues.push({
            path: `${path}.interaction.targetId`,
            message: `Interaction targetId '${interaction.targetId}' does not exist in scene objects`,
            code: "INVALID_INTERACTION_TARGET",
            severity: "error",
          });
        }
      }
      if (Array.isArray(obj.children)) {
        obj.children.forEach((c: any, i: number) => checkInteraction(c, `${path}.children[${i}]`));
      }
    };
    spec.objects.forEach((obj, idx) => checkInteraction(obj, `objects[${idx}]`));

    // Validate scroll timeline object targets
    if (spec.scrollTimeline && Array.isArray(spec.scrollTimeline.keyframes)) {
      spec.scrollTimeline.keyframes.forEach((kf: any, kfIdx: number) => {
        if (kf && typeof kf === "object" && kf.objects && typeof kf.objects === "object") {
          for (const targetId of Object.keys(kf.objects)) {
            if (!knownObjectIds.has(targetId)) {
              allIssues.push({
                path: `scrollTimeline.keyframes[${kfIdx}].objects.${targetId}`,
                message: `Scroll timeline references non-existent object '${targetId}'`,
                code: "INVALID_TIMELINE_TARGET",
                severity: "warning",
              });
            }
          }
        }
      });
    }
  }

  const errors = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
