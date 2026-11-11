/**
 * AF Motion — 3D Level of Detail (LOD) Generator
 *
 * Automatic multi-tier LOD generation using geometry decimation, spatial vertex clustering,
 * distance transition thresholds, and screen-space error metrics.
 */

import type { GeometryBufferData } from "../geometry/types.js";
import type {
  Mesh3DData,
  LODConfig,
  LODLevelConfig,
  ModelLODResult,
  LODLevelData,
} from "./types.js";
import { optimizeGeometry3D } from "./geometry.js";

export const DEFAULT_LOD_LEVELS: LODLevelConfig[] = [
  { level: 0, targetTriangleRatio: 1.0, distanceThreshold: 0 },
  { level: 1, targetTriangleRatio: 0.5, distanceThreshold: 30 },
  { level: 2, targetTriangleRatio: 0.25, distanceThreshold: 80 },
  { level: 3, targetTriangleRatio: 0.1, distanceThreshold: 180 },
];

/**
 * Generates an array of simplified LOD levels from a base 3D mesh.
 */
export function generateModelLODs(
  input: Mesh3DData | GeometryBufferData,
  config: LODConfig = {}
): ModelLODResult {
  const levels = config.levels && config.levels.length > 0 ? config.levels : DEFAULT_LOD_LEVELS;

  // Optimize base geometry first
  const baseOptimized = optimizeGeometry3D(input, { deduplicateVertices: true });
  const baseMesh = baseOptimized.mesh;
  const baseTriangleCount = baseOptimized.optimizedTriangleCount;

  const lods: LODLevelData[] = [];

  // Compute AABB extent
  const pos = baseMesh.positions;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] < minX) minX = pos[i];
    if (pos[i + 1] < minY) minY = pos[i + 1];
    if (pos[i + 2] < minZ) minZ = pos[i + 2];
    if (pos[i] > maxX) maxX = pos[i];
    if (pos[i + 1] > maxY) maxY = pos[i + 1];
    if (pos[i + 2] > maxZ) maxZ = pos[i + 2];
  }

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const spanZ = maxZ - minZ || 1;
  const maxSpan = Math.max(spanX, spanY, spanZ);

  for (const lvlCfg of levels) {
    if (lvlCfg.targetTriangleRatio >= 0.99) {
      // LOD 0 (Base level)
      lods.push({
        level: lvlCfg.level,
        mesh: baseMesh,
        vertexCount: baseMesh.positions.length / 3,
        triangleCount: baseMesh.indices ? baseMesh.indices.length / 3 : baseMesh.positions.length / 9,
        reductionRatio: 1.0,
        distanceThreshold: lvlCfg.distanceThreshold,
      });
      continue;
    }

    // Decimate geometry via spatial vertex clustering
    const simplified = decimateByClustering(
      baseMesh,
      lvlCfg.targetTriangleRatio,
      maxSpan
    );

    lods.push({
      level: lvlCfg.level,
      mesh: simplified,
      vertexCount: simplified.positions.length / 3,
      triangleCount: simplified.indices ? simplified.indices.length / 3 : simplified.positions.length / 9,
      reductionRatio: lvlCfg.targetTriangleRatio,
      distanceThreshold: lvlCfg.distanceThreshold,
    });
  }

  return {
    lods,
    baseTriangleCount,
    totalLevels: lods.length,
  };
}

/**
 * Decimates a mesh using grid-based spatial vertex clustering.
 */
function decimateByClustering(
  mesh: Mesh3DData,
  targetRatio: number,
  maxSpan: number
): Mesh3DData {
  const srcPos = mesh.positions;
  const srcNorm = mesh.normals;
  const srcUv = mesh.uvs;
  const srcIndices = mesh.indices;

  const originalTriCount = srcIndices ? srcIndices.length / 3 : srcPos.length / 9;
  if (originalTriCount <= 12) {
    // Already minimal poly count
    return mesh;
  }

  // Cell size inversely proportional to desired vertex density
  // targetRatio 0.5 -> cell size scales up
  const baseCells = Math.cbrt(originalTriCount);
  const targetCells = Math.max(4, baseCells * Math.cbrt(targetRatio));
  const cellSize = maxSpan / targetCells;
  const invCell = 1.0 / cellSize;

  const clusterMap = new Map<string, number>();
  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newUvs: number[] = [];

  const vertexRemap = new Int32Array(srcPos.length / 3);

  for (let i = 0; i < srcPos.length / 3; i++) {
    const px = srcPos[i * 3];
    const py = srcPos[i * 3 + 1];
    const pz = srcPos[i * 3 + 2];

    const cx = Math.floor(px * invCell);
    const cy = Math.floor(py * invCell);
    const cz = Math.floor(pz * invCell);
    const key = `${cx}_${cy}_${cz}`;

    let clusterIdx = clusterMap.get(key);
    if (clusterIdx === undefined) {
      clusterIdx = newPositions.length / 3;
      clusterMap.set(key, clusterIdx);

      newPositions.push(px, py, pz);
      if (srcNorm && srcNorm.length >= (i + 1) * 3) {
        newNormals.push(srcNorm[i * 3], srcNorm[i * 3 + 1], srcNorm[i * 3 + 2]);
      } else {
        newNormals.push(0, 1, 0);
      }
      if (srcUv && srcUv.length >= (i + 1) * 2) {
        newUvs.push(srcUv[i * 2], srcUv[i * 2 + 1]);
      } else {
        newUvs.push(0, 0);
      }
    }

    vertexRemap[i] = clusterIdx;
  }

  // Remap triangles and discard degenerate collapsed triangles
  const newIndices: number[] = [];
  const totalTris = srcIndices ? srcIndices.length / 3 : srcPos.length / 9;

  for (let t = 0; t < totalTris; t++) {
    const s0 = srcIndices ? srcIndices[t * 3] : t * 3;
    const s1 = srcIndices ? srcIndices[t * 3 + 1] : t * 3 + 1;
    const s2 = srcIndices ? srcIndices[t * 3 + 2] : t * 3 + 2;

    const i0 = vertexRemap[s0];
    const i1 = vertexRemap[s1];
    const i2 = vertexRemap[s2];

    if (i0 !== i1 && i1 !== i2 && i0 !== i2) {
      newIndices.push(i0, i1, i2);
    }
  }

  // If clustering collapsed everything too aggressively, fallback to original
  if (newIndices.length < 3) {
    return mesh;
  }

  const outPos = new Float32Array(newPositions);
  const outNorm = new Float32Array(newNormals);
  const outUv = new Float32Array(newUvs);
  const maxIdx = Math.max(0, ...newIndices);
  const outIndices = maxIdx > 65535 ? new Uint32Array(newIndices) : new Uint16Array(newIndices);

  return {
    id: `${mesh.id ?? "mesh"}-lod-${Math.round(targetRatio * 100)}`,
    positions: outPos,
    normals: outNorm,
    uvs: outUv,
    indices: outIndices,
  };
}
