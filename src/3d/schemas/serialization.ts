/**
 * AF Motion 3D Scene Specification Serialization & Migration
 *
 * Deterministic JSON serialization, deserialization, round-trip fidelity,
 * and version migration infrastructure.
 */

import { correctSceneSchema } from "./correction.js";
import { parseSafeJson } from "../../core/utils/safe-json.js";
import { SCENE_SPECIFICATION_VERSION } from "./schemas.js";
import type { Scene3DSpecification } from "./types.js";

/**
 * Recursively sort keys in an object to produce deterministic JSON.
 */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object" && !(value instanceof Date) && !(value instanceof RegExp)) {
    const sortedObj: Record<string, unknown> = {};
    const keys = Object.keys(value).sort();
    for (const key of keys) {
      const val = (value as Record<string, unknown>)[key];
      // Skip non-serializable values
      if (typeof val === "function" || typeof val === "symbol" || typeof val === "undefined") {
        continue;
      }
      sortedObj[key] = sortKeys(val);
    }
    return sortedObj;
  }
  return value;
}

export interface SerializationOptions {
  readonly pretty?: boolean;
}

/**
 * Deterministically serialize a 3D Scene Specification to JSON.
 */
export function serializeSceneSchema(
  scene: Scene3DSpecification,
  options?: SerializationOptions
): string {
  const normalized = sortKeys(scene);
  return options?.pretty
    ? JSON.stringify(normalized, null, 2)
    : JSON.stringify(normalized);
}

/**
 * Migrate a scene specification across versions to the current standard.
 */
export function migrateSceneSchema(raw: unknown, fromVersion?: string): Scene3DSpecification {
  if (!raw || typeof raw !== "object") {
    return correctSceneSchema(raw);
  }

  const spec = { ...(raw as Record<string, unknown>) };
  const detectedVersion =
    fromVersion || (typeof spec.version === "string" ? spec.version : "0.9.0");

  // Migration from 0.9.0 or unversioned:
  // e.g. flat x, y, z positions converted to position tuple
  if (detectedVersion === "0.9.0") {
    if (Array.isArray(spec.objects)) {
      spec.objects = spec.objects.map((obj: any) => {
        if (obj && typeof obj === "object") {
          const res = { ...obj };
          if (res.x !== undefined || res.y !== undefined || res.z !== undefined) {
            res.transform = {
              position: [res.x ?? 0, res.y ?? 0, res.z ?? 0],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            };
            delete res.x;
            delete res.y;
            delete res.z;
          }
          return res;
        }
        return obj;
      });
    }
    spec.version = SCENE_SPECIFICATION_VERSION;
  }

  return correctSceneSchema(spec);
}

/**
 * Deserialize JSON into a validated, version-migrated Scene3DSpecification.
 */
export function deserializeSceneSchema(json: string): Scene3DSpecification {
  if (typeof json !== "string" || json.trim().length === 0) {
    throw new Error("Cannot deserialize empty JSON string");
  }

  let parsed: unknown;
  try {
    parsed = parseSafeJson(json);
  } catch (err) {
    throw new Error(
      `Failed to parse 3D scene specification JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  return migrateSceneSchema(parsed);
}
