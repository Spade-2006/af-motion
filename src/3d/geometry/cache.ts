/**
 * AF Motion 3D Geometry Cache
 *
 * Bounded LRU cache for procedural geometries avoiding redundant regeneration.
 */

import type { GeometryBufferData, ProceduralGeometryDescriptor } from "./types.js";
import { computeGeometryHash } from "./hash.js";
import { generateProceduralGeometry } from "./generators.js";

interface CacheEntry {
  readonly buffer: GeometryBufferData;
  lastAccessedAt: number;
}

export class GeometryCache3D {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxEntries: number;

  constructor(options?: { maxEntries?: number }) {
    this.maxEntries = options?.maxEntries ?? 100;
  }

  /**
   * Retrieves or computes procedural geometry buffer data for a descriptor.
   */
  public getOrGenerate(descriptor: ProceduralGeometryDescriptor): GeometryBufferData {
    const hash = computeGeometryHash(descriptor);
    const existing = this.entries.get(hash);

    if (existing) {
      existing.lastAccessedAt = Date.now();
      return existing.buffer;
    }

    const buffer = generateProceduralGeometry(descriptor);

    if (this.entries.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.entries.set(hash, {
      buffer,
      lastAccessedAt: Date.now(),
    });

    return buffer;
  }

  /**
   * Checks if a geometry descriptor is already cached.
   */
  public has(descriptor: ProceduralGeometryDescriptor): boolean {
    const hash = computeGeometryHash(descriptor);
    return this.entries.has(hash);
  }

  /**
   * Clears the cache.
   */
  public clear(): void {
    this.entries.clear();
  }

  /**
   * Evicts the least recently accessed geometry.
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.entries.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }

  /**
   * Returns cache stats.
   */
  public getStats(): { size: number; maxEntries: number } {
    return {
      size: this.entries.size,
      maxEntries: this.maxEntries,
    };
  }
}

let defaultGeometryCacheInstance: GeometryCache3D | null = null;

export function getDefaultGeometryCache(): GeometryCache3D {
  if (!defaultGeometryCacheInstance) {
    defaultGeometryCacheInstance = new GeometryCache3D();
  }
  return defaultGeometryCacheInstance;
}
