/**
 * AF Motion 3D Scene Specification Auto-Correction
 *
 * Sanitizes invalid values, breaks circular hierarchies, inserts safe defaults,
 * and preserves user extension metadata.
 */

import { SCENE_SPECIFICATION_VERSION } from "./schemas.js";
import type {
  Camera3DConfig,
  EulerRotation,
  Lighting3DConfig,
  Scene3DSpecification,
  SceneObjectSpec,
  Transform3D,
  Vector3,
} from "./types.js";

function sanitizeVector3(raw: unknown, defaultVec: Vector3): Vector3 {
  if (!Array.isArray(raw)) return defaultVec;
  const x = typeof raw[0] === "number" && Number.isFinite(raw[0]) ? raw[0] : defaultVec[0];
  const y = typeof raw[1] === "number" && Number.isFinite(raw[1]) ? raw[1] : defaultVec[1];
  const z = typeof raw[2] === "number" && Number.isFinite(raw[2]) ? raw[2] : defaultVec[2];
  return [x, y, z];
}

function sanitizeEuler(raw: unknown): EulerRotation {
  return sanitizeVector3(raw, [0, 0, 0]);
}

function sanitizeTransform(raw: unknown): Transform3D {
  if (!raw || typeof raw !== "object") {
    return {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
  }

  const t = raw as Partial<Transform3D>;
  const position = sanitizeVector3(t.position, [0, 0, 0]);
  const rotation = sanitizeEuler(t.rotation);

  let scale = sanitizeVector3(t.scale, [1, 1, 1]);
  if (scale[0] === 0 && scale[1] === 0 && scale[2] === 0) {
    scale = [1, 1, 1];
  }

  return {
    position,
    rotation,
    scale,
    ...(t.quaternion ? { quaternion: t.quaternion } : {}),
  };
}

let objectCounter = 0;

function correctObjectNode(
  raw: unknown,
  ancestors: Set<string>
): SceneObjectSpec {
  if (!raw || typeof raw !== "object") {
    return {
      id: `object-${++objectCounter}`,
      type: "group",
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      visible: true,
    };
  }

  const node = { ...(raw as Record<string, unknown>) };
  const id =
    typeof node.id === "string" && node.id.trim().length > 0
      ? node.id.trim()
      : `object-${++objectCounter}`;

  const currentAncestors = new Set(ancestors);
  currentAncestors.add(id);

  // Break circular parent reference
  let parentId = typeof node.parentId === "string" ? node.parentId : undefined;
  if (parentId && ancestors.has(parentId)) {
    parentId = undefined; // Strip cyclic parent
  }

  const transform = sanitizeTransform(node.transform);
  const type = typeof node.type === "string" ? node.type : "group";

  // Recursively sanitize children while avoiding cycles
  let children: SceneObjectSpec[] | undefined = undefined;
  if (Array.isArray(node.children)) {
    children = [];
    for (const child of node.children) {
      if (child && typeof child === "object" && typeof (child as any).id === "string") {
        if (currentAncestors.has((child as any).id)) {
          continue; // Skip cyclic child to break cycle
        }
      }
      children.push(correctObjectNode(child, currentAncestors));
    }
  }

  return {
    ...node,
    id,
    type: type as any,
    transform,
    visible: node.visible !== false,
    ...(parentId ? { parentId } : {}),
    ...(children && children.length > 0 ? { children } : {}),
  } as SceneObjectSpec;
}

/**
 * Break circular parentId relationships across a list of objects.
 */
function breakParentIdCycles(objects: SceneObjectSpec[]): SceneObjectSpec[] {
  const parentMap = new Map<string, string>();
  for (const obj of objects) {
    if (obj.parentId) {
      parentMap.set(obj.id, obj.parentId);
    }
  }

  return objects.map((obj) => {
    if (!obj.parentId) return obj;

    const visited = new Set<string>([obj.id]);
    let curr: string | undefined = obj.parentId;
    let hasCycle = false;

    while (curr) {
      if (visited.has(curr)) {
        hasCycle = true;
        break;
      }
      visited.add(curr);
      curr = parentMap.get(curr);
    }

    if (hasCycle) {
      parentMap.delete(obj.id);
      const copy = { ...obj };
      delete (copy as any).parentId;
      return copy as SceneObjectSpec;
    }

    return obj;
  });
}

/**
 * Automatically sanitize, repair, and apply safe defaults to any 3D scene configuration.
 */
export function correctSceneSchema(raw: unknown): Scene3DSpecification {
  if (!raw || typeof raw !== "object") {
    return {
      id: "default-scene-3d",
      name: "Default 3D Scene",
      version: SCENE_SPECIFICATION_VERSION,
      coordinateSystem: "right-handed-y-up",
      camera: {
        type: "perspective",
        fov: 50,
        near: 0.1,
        far: 1000,
        position: [0, 0, 5],
        target: [0, 0, 0],
      },
      lighting: {
        ambient: { color: "#ffffff", intensity: 0.5 },
      },
      objects: [],
      autoStart: true,
      respectReducedMotion: true,
    };
  }

  const input = { ...(raw as Record<string, unknown>) };

  const id =
    typeof input.id === "string" && input.id.trim().length > 0
      ? input.id.trim()
      : "scene-3d";

  const version =
    typeof input.version === "string" && input.version.trim().length > 0
      ? input.version.trim()
      : SCENE_SPECIFICATION_VERSION;

  // Sanitize camera
  const rawCam = (input.camera ?? {}) as Partial<Camera3DConfig>;
  const fov =
    typeof rawCam.fov === "number" && rawCam.fov > 0 && rawCam.fov < 180
      ? rawCam.fov
      : 50;
  const near = typeof rawCam.near === "number" && rawCam.near > 0 ? rawCam.near : 0.1;
  const far =
    typeof rawCam.far === "number" && rawCam.far > near ? rawCam.far : Math.max(1000, near + 10);

  const camera: Camera3DConfig = {
    type: rawCam.type === "orthographic" ? "orthographic" : "perspective",
    fov,
    near,
    far,
    position: sanitizeVector3(rawCam.position, [0, 0, 5]),
    target: sanitizeVector3(rawCam.target, [0, 0, 0]),
  };

  // Sanitize lighting
  const rawLight = (input.lighting ?? {}) as Partial<Lighting3DConfig>;
  const lighting: Lighting3DConfig = {
    ambient: {
      color: rawLight.ambient?.color ?? "#ffffff",
      intensity:
        typeof rawLight.ambient?.intensity === "number"
          ? Math.max(0, rawLight.ambient.intensity)
          : 0.5,
    },
    directional: Array.isArray(rawLight.directional) ? rawLight.directional : [],
    point: Array.isArray(rawLight.point) ? rawLight.point : [],
    spot: Array.isArray(rawLight.spot) ? rawLight.spot : [],
  };

  // Sanitize and break cycles across objects
  const rawObjects = Array.isArray(input.objects) ? input.objects : [];
  let objects: SceneObjectSpec[] = [];
  const globalSeenIds = new Set<string>();

  for (const obj of rawObjects) {
    const corrected = correctObjectNode(obj, new Set());
    // Ensure unique top-level IDs
    if (globalSeenIds.has(corrected.id)) {
      const uniqueObj = { ...corrected, id: `${corrected.id}-${++objectCounter}` };
      globalSeenIds.add(uniqueObj.id);
      objects.push(uniqueObj);
    } else {
      globalSeenIds.add(corrected.id);
      objects.push(corrected);
    }
  }

  // Break reciprocal/cyclic parentIds
  objects = breakParentIdCycles(objects);

  return {
    ...input,
    id,
    name: typeof input.name === "string" ? input.name : id,
    version,
    coordinateSystem:
      input.coordinateSystem === "left-handed-y-up"
        ? "left-handed-y-up"
        : "right-handed-y-up",
    camera,
    lighting,
    objects,
    autoStart: input.autoStart !== false,
    respectReducedMotion: input.respectReducedMotion !== false,
  };
}
