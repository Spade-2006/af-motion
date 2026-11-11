/**
 * AF Motion — 3D Terrain Physics Integration
 *
 * Heightfield collider generation, bilinear height & normal sampling,
 * and swept raycasting for seamless interaction with RigidBody3D and SoftBody3D.
 */

import type { Vector3, Collider3D, AABB3D } from "../physics/types.js";
import type { HeightmapData } from "./types.js";
import { sampleTerrainHeightAndNormal } from "./heightmap.js";

/**
 * Creates a static heightfield collider compatible with AF Motion PhysicsWorld3D.
 */
export function createTerrainCollider(
  heightmap: HeightmapData,
  options?: { id?: string; friction?: number; restitution?: number; isTrigger?: boolean }
): Collider3D {
  const halfW = heightmap.width * 0.5;
  const halfL = heightmap.length * 0.5;

  return {
    id: options?.id ?? "terrain-collider",
    shape: {
      type: "heightfield",
      width: heightmap.width,
      length: heightmap.length,
      cols: heightmap.cols,
      rows: heightmap.rows,
      heights: heightmap.heights,
      minHeight: heightmap.minHeight,
      maxHeight: heightmap.maxHeight,
    },
    offset: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    aabb: {
      min: { x: -halfW, y: heightmap.minHeight, z: -halfL },
      max: { x: halfW, y: heightmap.maxHeight, z: halfL },
    },
    isTrigger: options?.isTrigger ?? false,
    collisionLayer: 1,
    collisionMask: 0xFFFFFFFF,
    material: {
      friction: options?.friction ?? 0.8,
      restitution: options?.restitution ?? 0.1,
    },
  };
}

/**
 * Samples terrain elevation at an arbitrary world position using bilinear interpolation.
 */
export function sampleTerrainHeight(heightmap: HeightmapData, worldX: number, worldZ: number): number {
  return sampleTerrainHeightAndNormal(heightmap, worldX, worldZ).height;
}

/**
 * Samples terrain surface normal at an arbitrary world position.
 */
export function sampleTerrainNormal(heightmap: HeightmapData, worldX: number, worldZ: number): Vector3 {
  return sampleTerrainHeightAndNormal(heightmap, worldX, worldZ).normal;
}

/**
 * Fast swept raycaster against terrain heightfield with linear stepping and binary search refinement.
 */
export function raycastTerrain(
  heightmap: HeightmapData,
  rayOrigin: Vector3,
  rayDir: Vector3,
  maxDistance: number = 1000
): { hit: boolean; point: Vector3; normal: Vector3; distance: number } | null {
  // Normalize ray direction
  const dirLen = Math.hypot(rayDir.x, rayDir.y, rayDir.z);
  if (dirLen < 1e-6) return null;
  const dx = rayDir.x / dirLen;
  const dy = rayDir.y / dirLen;
  const dz = rayDir.z / dirLen;

  // 1. Ray vs Terrain bounding box intersection
  const halfW = heightmap.width * 0.5;
  const halfL = heightmap.length * 0.5;
  const minX = -halfW;
  const maxX = halfW;
  const minY = heightmap.minHeight - 1.0;
  const maxY = heightmap.maxHeight + 1.0;
  const minZ = -halfL;
  const maxZ = halfL;

  let tMin = 0.0;
  let tMax = maxDistance;

  // X slab
  if (Math.abs(dx) > 1e-6) {
    let t1 = (minX - rayOrigin.x) / dx;
    let t2 = (maxX - rayOrigin.x) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  } else if (rayOrigin.x < minX || rayOrigin.x > maxX) {
    return null;
  }

  // Y slab
  if (Math.abs(dy) > 1e-6) {
    let t1 = (minY - rayOrigin.y) / dy;
    let t2 = (maxY - rayOrigin.y) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  } else if (rayOrigin.y < minY || rayOrigin.y > maxY) {
    return null;
  }

  // Z slab
  if (Math.abs(dz) > 1e-6) {
    let t1 = (minZ - rayOrigin.z) / dz;
    let t2 = (maxZ - rayOrigin.z) / dz;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
  } else if (rayOrigin.z < minZ || rayOrigin.z > maxZ) {
    return null;
  }

  if (tMin > tMax || tMax < 0) return null;

  const tStart = Math.max(0, tMin);
  const tEnd = Math.min(maxDistance, tMax);
  const stepSize = Math.max(0.5, Math.min(heightmap.stepX, heightmap.stepZ) * 0.5);

  let prevT = tStart;
  let prevDiff = (rayOrigin.y + prevT * dy) - sampleTerrainHeight(heightmap, rayOrigin.x + prevT * dx, rayOrigin.z + prevT * dz);

  // If already below surface at entry, test if origin itself is above
  if (prevDiff < 0 && tStart === 0) {
    // Starting under terrain
    const pt = { x: rayOrigin.x, y: rayOrigin.y, z: rayOrigin.z };
    const norm = sampleTerrainNormal(heightmap, pt.x, pt.z);
    return { hit: true, point: pt, normal: norm, distance: 0 };
  }

  for (let t = tStart + stepSize; t <= tEnd + stepSize; t += stepSize) {
    const curT = Math.min(t, tEnd);
    const px = rayOrigin.x + curT * dx;
    const py = rayOrigin.y + curT * dy;
    const pz = rayOrigin.z + curT * dz;
    const h = sampleTerrainHeight(heightmap, px, pz);
    const curDiff = py - h;

    if (curDiff <= 0) {
      // Intersection detected between prevT and curT! Refine with binary search
      let low = prevT;
      let high = curT;
      for (let iter = 0; iter < 10; iter++) {
        const mid = (low + high) * 0.5;
        const midX = rayOrigin.x + mid * dx;
        const midY = rayOrigin.y + mid * dy;
        const midZ = rayOrigin.z + mid * dz;
        const midH = sampleTerrainHeight(heightmap, midX, midZ);
        if (midY <= midH) {
          high = mid;
        } else {
          low = mid;
        }
      }

      const hitT = (low + high) * 0.5;
      const hitX = rayOrigin.x + hitT * dx;
      const hitY = rayOrigin.y + hitT * dy;
      const hitZ = rayOrigin.z + hitT * dz;
      const normal = sampleTerrainNormal(heightmap, hitX, hitZ);

      return {
        hit: true,
        point: { x: hitX, y: hitY, z: hitZ },
        normal,
        distance: hitT,
      };
    }

    prevT = curT;
    prevDiff = curDiff;
  }

  return null;
}
