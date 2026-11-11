/**
 * AF Motion — 3D Spatial Hashing & Broad-Phase Query System
 *
 * High-performance 3D spatial indexing for fast collision pair pruning,
 * AABB volume queries, sphere proximity testing, and raycasting.
 */

import type {
  Collider3D,
  AABB3D,
  Ray3D,
  RayHit3D,
  SpatialFilter3D,
  Transform3D,
  Vector3,
} from "../types.js";
import {
  aabb3DIntersects,
  aabb3DContainsPoint,
  vec3DistanceSq,
  vec3SafeNormalize,
  EPSILON,
} from "../math.js";
import { canCollide } from "../collision/shapes.js";
import { raycastCollider } from "../collision/narrowphase.js";

export interface SpatialQuery3DOptions {
  cellSize?: number;
}

export interface SpatialQuery3D {
  register(collider: Collider3D): void;
  unregister(colliderId: string): void;
  update(collider: Collider3D): void;
  getPotentialPairs(): Array<[Collider3D, Collider3D]>;
  queryAABB(aabb: AABB3D, filter?: SpatialFilter3D): Collider3D[];
  querySphere(center: Vector3, radius: number, filter?: SpatialFilter3D): Collider3D[];
  raycast(
    ray: Ray3D,
    filter?: SpatialFilter3D,
    getBodyTransform?: (bodyId?: string) => Transform3D
  ): RayHit3D[];
  raycastAny(
    ray: Ray3D,
    filter?: SpatialFilter3D,
    getBodyTransform?: (bodyId?: string) => Transform3D
  ): boolean;
  clear(): void;
  getColliderCount(): number;
}

/**
 * 3D Spatial Hash Broad-phase Grid.
 */
export class SpatialHash3D implements SpatialQuery3D {
  private readonly cellSize: number;
  private readonly invCellSize: number;
  private readonly cells = new Map<string, Set<Collider3D>>();
  private readonly colliderToCells = new Map<string, string[]>();
  private readonly colliders = new Map<string, Collider3D>();
  private readonly globalColliders = new Set<Collider3D>();

  constructor(options: SpatialQuery3DOptions = {}) {
    this.cellSize = Math.max(0.1, options.cellSize ?? 2.0);
    this.invCellSize = 1 / this.cellSize;
  }

  private hashCoords(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private getCellsForAABB(aabb: AABB3D): string[] {
    // Clamp extreme bounds (like infinite planes) to practical bounds
    const minX = Math.floor(Math.max(-500, aabb.min.x) * this.invCellSize);
    const minY = Math.floor(Math.max(-500, aabb.min.y) * this.invCellSize);
    const minZ = Math.floor(Math.max(-500, aabb.min.z) * this.invCellSize);

    const maxX = Math.floor(Math.min(500, aabb.max.x) * this.invCellSize);
    const maxY = Math.floor(Math.min(500, aabb.max.y) * this.invCellSize);
    const maxZ = Math.floor(Math.min(500, aabb.max.z) * this.invCellSize);

    // Limit maximum cell span to avoid runaway memory on giant bounds
    const spanX = Math.min(20, maxX - minX);
    const spanY = Math.min(20, maxY - minY);
    const spanZ = Math.min(20, maxZ - minZ);

    const keys: string[] = [];
    for (let x = minX; x <= minX + spanX; x++) {
      for (let y = minY; y <= minY + spanY; y++) {
        for (let z = minZ; z <= minZ + spanZ; z++) {
          keys.push(this.hashCoords(x, y, z));
        }
      }
    }
    return keys;
  }

  register(collider: Collider3D): void {
    if (this.colliders.has(collider.id)) {
      this.unregister(collider.id);
    }

    this.colliders.set(collider.id, collider);
    if (collider.shape.type === "plane" || collider.shape.type === "heightfield") {
      this.globalColliders.add(collider);
      return;
    }
    const cellKeys = this.getCellsForAABB(collider.aabb);
    this.colliderToCells.set(collider.id, cellKeys);

    for (const key of cellKeys) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Set();
        this.cells.set(key, cell);
      }
      cell.add(collider);
    }
  }

  unregister(colliderId: string): void {
    this.colliders.delete(colliderId);
    for (const col of this.globalColliders) {
      if (col.id === colliderId) {
        this.globalColliders.delete(col);
        break;
      }
    }
    const cellKeys = this.colliderToCells.get(colliderId);
    if (!cellKeys) return;

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        // Remove matching collider
        for (const col of cell) {
          if (col.id === colliderId) {
            cell.delete(col);
            break;
          }
        }
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }

    this.colliderToCells.delete(colliderId);
  }

  update(collider: Collider3D): void {
    this.unregister(collider.id);
    this.register(collider);
  }

  getPotentialPairs(): Array<[Collider3D, Collider3D]> {
    const pairs: Array<[Collider3D, Collider3D]> = [];
    const checkedPairs = new Set<string>();

    for (const cell of this.cells.values()) {
      if (cell.size < 2) continue;
      const cellColliders = Array.from(cell);

      for (let i = 0; i < cellColliders.length; i++) {
        const colA = cellColliders[i];
        for (let j = i + 1; j < cellColliders.length; j++) {
          const colB = cellColliders[j];

          // Same body colliders cannot collide
          if (colA.bodyId && colB.bodyId && colA.bodyId === colB.bodyId) {
            continue;
          }

          const pairKey = colA.id < colB.id ? `${colA.id}:${colB.id}` : `${colB.id}:${colA.id}`;
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);

          // Layer / Mask filtering
          if (!canCollide(colA, colB)) continue;

          // AABB overlap test
          if (aabb3DIntersects(colA.aabb, colB.aabb)) {
            pairs.push([colA, colB]);
          }
        }
      }
    }

    // Global infinite colliders (e.g. infinite planes) tested against bounded colliders
    if (this.globalColliders.size > 0) {
      for (const globalCol of this.globalColliders) {
        for (const col of this.colliders.values()) {
          if (col === globalCol) continue;
          if (this.globalColliders.has(col)) continue;
          if (col.bodyId && globalCol.bodyId && col.bodyId === globalCol.bodyId) continue;

          const pairKey = col.id < globalCol.id ? `${col.id}:${globalCol.id}` : `${globalCol.id}:${col.id}`;
          if (checkedPairs.has(pairKey)) continue;
          checkedPairs.add(pairKey);

          if (!canCollide(col, globalCol)) continue;

          if (aabb3DIntersects(col.aabb, globalCol.aabb)) {
            pairs.push([globalCol, col]);
          }
        }
      }
    }

    return pairs;
  }

  queryAABB(aabb: AABB3D, filter?: SpatialFilter3D): Collider3D[] {
    const cellKeys = this.getCellsForAABB(aabb);
    const visited = new Set<string>();
    const results: Collider3D[] = [];

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (!cell) continue;

      for (const col of cell) {
        if (visited.has(col.id)) continue;
        visited.add(col.id);

        if (!this.matchesFilter(col, filter)) continue;
        if (aabb3DIntersects(aabb, col.aabb)) {
          results.push(col);
        }
      }
    }

    if (this.globalColliders.size > 0) {
      for (const col of this.globalColliders) {
        if (visited.has(col.id)) continue;
        visited.add(col.id);
        if (!this.matchesFilter(col, filter)) continue;
        if (aabb3DIntersects(aabb, col.aabb)) {
          results.push(col);
        }
      }
    }

    return results;
  }

  querySphere(center: Vector3, radius: number, filter?: SpatialFilter3D): Collider3D[] {
    const sphereAABB: AABB3D = {
      min: { x: center.x - radius, y: center.y - radius, z: center.z - radius },
      max: { x: center.x + radius, y: center.y + radius, z: center.z + radius },
    };

    const candidates = this.queryAABB(sphereAABB, filter);
    const rSq = radius * radius;
    const results: Collider3D[] = [];

    for (const col of candidates) {
      // Approximate center distance
      const colCenter = {
        x: 0.5 * (col.aabb.min.x + col.aabb.max.x),
        y: 0.5 * (col.aabb.min.y + col.aabb.max.y),
        z: 0.5 * (col.aabb.min.z + col.aabb.max.z),
      };
      if (vec3DistanceSq(center, colCenter) <= rSq * 2.0) {
        results.push(col);
      }
    }

    return results;
  }

  raycast(
    ray: Ray3D,
    filter?: SpatialFilter3D,
    getBodyTransform?: (bodyId?: string) => Transform3D
  ): RayHit3D[] {
    const hits: RayHit3D[] = [];
    const maxLen = ray.length ?? 1000;
    const dir = vec3SafeNormalize(ray.direction);

    // Collect all colliders intersecting ray AABB bounds
    const rayEnd = {
      x: ray.origin.x + dir.x * maxLen,
      y: ray.origin.y + dir.y * maxLen,
      z: ray.origin.z + dir.z * maxLen,
    };
    const rayAABB: AABB3D = {
      min: {
        x: Math.min(ray.origin.x, rayEnd.x),
        y: Math.min(ray.origin.y, rayEnd.y),
        z: Math.min(ray.origin.z, rayEnd.z),
      },
      max: {
        x: Math.max(ray.origin.x, rayEnd.x),
        y: Math.max(ray.origin.y, rayEnd.y),
        z: Math.max(ray.origin.z, rayEnd.z),
      },
    };

    const candidates = this.queryAABB(rayAABB, filter);

    for (const col of candidates) {
      const bodyTransform = getBodyTransform ? getBodyTransform(col.bodyId) : {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      };

      const hit = raycastCollider(ray, col, bodyTransform);
      if (hit && hit.distance <= maxLen) {
        hits.push(hit);
      }
    }

    return hits.sort((a, b) => a.distance - b.distance);
  }

  raycastAny(
    ray: Ray3D,
    filter?: SpatialFilter3D,
    getBodyTransform?: (bodyId?: string) => Transform3D
  ): boolean {
    const hits = this.raycast(ray, filter, getBodyTransform);
    return hits.length > 0;
  }

  private matchesFilter(col: Collider3D, filter?: SpatialFilter3D): boolean {
    if (!filter) return true;

    if (!filter.includeTriggers && col.isTrigger) return false;
    if (filter.mask !== undefined && (col.collisionLayer & filter.mask) === 0) return false;
    if (filter.layer !== undefined && (col.collisionMask & filter.layer) === 0) return false;
    if (filter.excludeColliderIds && filter.excludeColliderIds.includes(col.id)) return false;
    if (filter.excludeBodyIds && col.bodyId && filter.excludeBodyIds.includes(col.bodyId)) return false;

    return true;
  }

  clear(): void {
    this.cells.clear();
    this.colliderToCells.clear();
    this.colliders.clear();
    this.globalColliders.clear();
  }

  getColliderCount(): number {
    return this.colliders.size;
  }
}

/**
 * Creates an extensible 3D spatial query / broad-phase acceleration structure.
 */
export function createSpatialQuery3D(options: SpatialQuery3DOptions = {}): SpatialQuery3D {
  return new SpatialHash3D(options);
}
