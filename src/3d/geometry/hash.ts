/**
 * AF Motion 3D Procedural Geometry Hashing
 *
 * Deterministic hash computation for geometry caching and reuse.
 */

import type { ProceduralGeometryDescriptor } from "./types.js";

/**
 * Computes a deterministic canonical string hash of a geometry descriptor.
 */
export function computeGeometryHash(descriptor: ProceduralGeometryDescriptor): string {
  const normalize = (obj: any): any => {
    if (obj === null || typeof obj !== "object") {
      if (typeof obj === "function") {
        return obj.toString();
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(normalize);
    }

    const sortedKeys = Object.keys(obj).sort();
    const result: Record<string, any> = {};
    for (const key of sortedKeys) {
      result[key] = normalize(obj[key]);
    }
    return result;
  };

  const canonicalObj = normalize(descriptor);
  const json = JSON.stringify(canonicalObj);

  // Simple, fast 32-bit FNV-1a hash
  let hash = 2166136261;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return `${descriptor.type}_${(hash >>> 0).toString(36)}`;
}
