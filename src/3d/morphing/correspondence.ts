/**
 * AF Motion — 3D Vertex Correspondence & Resampling
 *
 * Establishes geometric correspondence between models of differing topology,
 * handles spatial normalization, and enables deterministic resampling.
 */

import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";
import type {
  CorrespondenceConfig,
  CorrespondenceStrategy,
  VertexCorrespondenceMap,
} from "./types.js";

type AnyMesh = Mesh3DData | GeometryBufferData;

/**
 * Centers a flat positions buffer around origin [0, 0, 0].
 */
export function alignGeometryCenter(positions: Float32Array): Float32Array {
  const count = Math.floor(positions.length / 3);
  if (count === 0) return new Float32Array(0);

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;

  const result = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    result[i] = positions[i] - cx;
    result[i + 1] = positions[i + 1] - cy;
    result[i + 2] = positions[i + 2] - cz;
  }

  return result;
}

/**
 * Normalizes positions to fit within a unit or target-scaled bounding sphere/cube.
 */
export function normalizeGeometryBounds(
  positions: Float32Array,
  targetScale: number = 1.0
): { normalized: Float32Array; scale: number; center: [number, number, number] } {
  const count = Math.floor(positions.length / 3);
  if (count === 0) {
    return { normalized: new Float32Array(0), scale: 1, center: [0, 0, 0] };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const maxSpan = Math.max(spanX, spanY, spanZ) || 1.0;
  const factor = targetScale / maxSpan;

  const normalized = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    normalized[i] = (positions[i] - cx) * factor;
    normalized[i + 1] = (positions[i + 1] - cy) * factor;
    normalized[i + 2] = (positions[i + 2] - cz) * factor;
  }

  return {
    normalized,
    scale: factor,
    center: [cx, cy, cz],
  };
}

/**
 * Maps vertex correspondence from base geometry to target geometry using configurable strategies.
 */
export function mapVertexCorrespondence(
  base: AnyMesh,
  target: AnyMesh,
  config: CorrespondenceConfig = {}
): VertexCorrespondenceMap {
  const basePos = config.alignCenter ? alignGeometryCenter(base.positions) : base.positions;
  const targetPos = config.alignCenter ? alignGeometryCenter(target.positions) : target.positions;

  const baseVCount = Math.floor(basePos.length / 3);
  const targetVCount = Math.floor(targetPos.length / 3);

  const strategy: CorrespondenceStrategy =
    config.strategy ?? (baseVCount === targetVCount ? "index" : "nearest-neighbor");

  const map = new Int32Array(baseVCount);

  if (strategy === "index" && baseVCount === targetVCount) {
    for (let i = 0; i < baseVCount; i++) {
      map[i] = i;
    }
    return {
      sourceToTargetIndices: map,
      strategyUsed: "index",
      confidence: 1.0,
    };
  }

  if (strategy === "nearest-neighbor" || (strategy === "index" && baseVCount !== targetVCount)) {
    // For each vertex in base, search target for nearest spatial coordinate
    for (let b = 0; b < baseVCount; b++) {
      const bx = basePos[b * 3];
      const by = basePos[b * 3 + 1];
      const bz = basePos[b * 3 + 2];

      let closestIdx = 0;
      let closestDistSq = Infinity;

      for (let t = 0; t < targetVCount; t++) {
        const dx = targetPos[t * 3] - bx;
        const dy = targetPos[t * 3 + 1] - by;
        const dz = targetPos[t * 3 + 2] - bz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestIdx = t;
          if (distSq < 1e-8) break; // Exact match found
        }
      }

      map[b] = closestIdx;
    }

    return {
      sourceToTargetIndices: map,
      strategyUsed: "nearest-neighbor",
      confidence: 0.85,
    };
  }

  if (strategy === "polar") {
    // Project vertices to spherical angles: theta = atan2(y, x), phi = acos(z / r)
    const targetTheta = new Float32Array(targetVCount);
    const targetPhi = new Float32Array(targetVCount);

    for (let t = 0; t < targetVCount; t++) {
      const x = targetPos[t * 3], y = targetPos[t * 3 + 1], z = targetPos[t * 3 + 2];
      const r = Math.hypot(x, y, z) || 1e-5;
      targetTheta[t] = Math.atan2(y, x);
      targetPhi[t] = Math.acos(Math.max(-1, Math.min(1, z / r)));
    }

    for (let b = 0; b < baseVCount; b++) {
      const x = basePos[b * 3], y = basePos[b * 3 + 1], z = basePos[b * 3 + 2];
      const r = Math.hypot(x, y, z) || 1e-5;
      const bTheta = Math.atan2(y, x);
      const bPhi = Math.acos(Math.max(-1, Math.min(1, z / r)));

      let closestIdx = 0;
      let minAngleDist = Infinity;

      for (let t = 0; t < targetVCount; t++) {
        let dTheta = Math.abs(bTheta - targetTheta[t]);
        if (dTheta > Math.PI) dTheta = 2 * Math.PI - dTheta;
        const dPhi = Math.abs(bPhi - targetPhi[t]);
        const angleDist = dTheta * dTheta + dPhi * dPhi;

        if (angleDist < minAngleDist) {
          minAngleDist = angleDist;
          closestIdx = t;
          if (angleDist < 1e-6) break;
        }
      }

      map[b] = closestIdx;
    }

    return {
      sourceToTargetIndices: map,
      strategyUsed: "polar",
      confidence: 0.9,
    };
  }

  // Fallback: modular index mapping
  for (let b = 0; b < baseVCount; b++) {
    map[b] = b % targetVCount;
  }

  return {
    sourceToTargetIndices: map,
    strategyUsed: "resample",
    confidence: 0.7,
  };
}

/**
 * Resamples an incompatible 3D mesh to exactly match a target vertex count,
 * generating continuous surface samples using face area weighting.
 */
export function resampleGeometry(
  source: AnyMesh,
  targetVertexCount: number
): Mesh3DData {
  const srcPos = source.positions;
  const srcNorm = source.normals;
  const srcUvs = source.uvs;
  const srcIndices = source.indices;

  const currentVCount = Math.floor(srcPos.length / 3);
  if (currentVCount === targetVertexCount) {
    return {
      id: "resampled-mesh",
      positions: new Float32Array(srcPos),
      normals: srcNorm ? new Float32Array(srcNorm) : undefined,
      uvs: srcUvs ? new Float32Array(srcUvs) : undefined,
      indices: srcIndices,
    };
  }

  const outPositions = new Float32Array(targetVertexCount * 3);
  const outNormals = srcNorm ? new Float32Array(targetVertexCount * 3) : undefined;
  const outUvs = srcUvs ? new Float32Array(targetVertexCount * 2) : undefined;

  // Compute triangle list
  const triCount = srcIndices ? Math.floor(srcIndices.length / 3) : Math.floor(currentVCount / 3);

  // Compute cumulative triangle areas for uniform surface distribution
  const cumulativeAreas = new Float32Array(triCount);
  let totalArea = 0;

  for (let t = 0; t < triCount; t++) {
    const i0 = srcIndices ? srcIndices[t * 3] : t * 3;
    const i1 = srcIndices ? srcIndices[t * 3 + 1] : t * 3 + 1;
    const i2 = srcIndices ? srcIndices[t * 3 + 2] : t * 3 + 2;

    const p0x = srcPos[i0 * 3], p0y = srcPos[i0 * 3 + 1], p0z = srcPos[i0 * 3 + 2];
    const p1x = srcPos[i1 * 3], p1y = srcPos[i1 * 3 + 1], p1z = srcPos[i1 * 3 + 2];
    const p2x = srcPos[i2 * 3], p2y = srcPos[i2 * 3 + 1], p2z = srcPos[i2 * 3 + 2];

    const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
    const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

    const cx = e1y * e2z - e1z * e2y;
    const cy = e1z * e2x - e1x * e2z;
    const cz = e1x * e2y - e1y * e2x;
    const area = Math.hypot(cx, cy, cz) * 0.5;

    totalArea += Math.max(1e-6, area);
    cumulativeAreas[t] = totalArea;
  }

  // Deterministic quasi-random sequence (Fibonacci lattice / Halton)
  for (let i = 0; i < targetVertexCount; i++) {
    // If we have existing source vertices, first seed with original vertices
    if (i < currentVCount) {
      outPositions[i * 3] = srcPos[i * 3];
      outPositions[i * 3 + 1] = srcPos[i * 3 + 1];
      outPositions[i * 3 + 2] = srcPos[i * 3 + 2];
      if (outNormals && srcNorm) {
        outNormals[i * 3] = srcNorm[i * 3];
        outNormals[i * 3 + 1] = srcNorm[i * 3 + 1];
        outNormals[i * 3 + 2] = srcNorm[i * 3 + 2];
      }
      if (outUvs && srcUvs) {
        outUvs[i * 2] = srcUvs[i * 2];
        outUvs[i * 2 + 1] = srcUvs[i * 2 + 1];
      }
      continue;
    }

    // Binary search sample target triangle
    const targetArea = ((i * 0.618033988749895) % 1.0) * totalArea;
    let low = 0, high = triCount - 1, triIdx = 0;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (cumulativeAreas[mid] >= targetArea) {
        triIdx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    const i0 = srcIndices ? srcIndices[triIdx * 3] : triIdx * 3;
    const i1 = srcIndices ? srcIndices[triIdx * 3 + 1] : triIdx * 3 + 1;
    const i2 = srcIndices ? srcIndices[triIdx * 3 + 2] : triIdx * 3 + 2;

    // Barycentric coordinates
    const r1 = ((i * 0.7548776662466927) % 1.0);
    const r2 = ((i * 0.5698402909980532) % 1.0);
    const sqrtR1 = Math.sqrt(r1);
    const u = 1 - sqrtR1;
    const v = r2 * sqrtR1;
    const w = 1 - u - v;

    outPositions[i * 3] = u * srcPos[i0 * 3] + v * srcPos[i1 * 3] + w * srcPos[i2 * 3];
    outPositions[i * 3 + 1] = u * srcPos[i0 * 3 + 1] + v * srcPos[i1 * 3 + 1] + w * srcPos[i2 * 3 + 1];
    outPositions[i * 3 + 2] = u * srcPos[i0 * 3 + 2] + v * srcPos[i1 * 3 + 2] + w * srcPos[i2 * 3 + 2];

    if (outNormals && srcNorm) {
      const nx = u * srcNorm[i0 * 3] + v * srcNorm[i1 * 3] + w * srcNorm[i2 * 3];
      const ny = u * srcNorm[i0 * 3 + 1] + v * srcNorm[i1 * 3 + 1] + w * srcNorm[i2 * 3 + 1];
      const nz = u * srcNorm[i0 * 3 + 2] + v * srcNorm[i1 * 3 + 2] + w * srcNorm[i2 * 3 + 2];
      const nlen = Math.hypot(nx, ny, nz) || 1.0;
      outNormals[i * 3] = nx / nlen;
      outNormals[i * 3 + 1] = ny / nlen;
      outNormals[i * 3 + 2] = nz / nlen;
    }

    if (outUvs && srcUvs) {
      outUvs[i * 2] = u * srcUvs[i0 * 2] + v * srcUvs[i1 * 2] + w * srcUvs[i2 * 2];
      outUvs[i * 2 + 1] = u * srcUvs[i0 * 2 + 1] + v * srcUvs[i1 * 2 + 1] + w * srcUvs[i2 * 2 + 1];
    }
  }

  return {
    id: "resampled-mesh",
    positions: outPositions,
    normals: outNormals,
    uvs: outUvs,
  };
}
