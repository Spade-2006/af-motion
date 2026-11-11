/**
 * AF Motion — 3D Geometry Optimization Engine
 *
 * Configurable, non-destructive mesh optimization featuring spatial vertex deduplication,
 * index buffer synthesis, degenerate triangle removal, smooth normal recalculation,
 * tangent generation, geometry merging, and mesh splitting.
 */

import type { GeometryBufferData } from "../geometry/types.js";
import type {
  Mesh3DData,
  GeometryOptimizationConfig,
  OptimizedGeometryResult,
} from "./types.js";

/**
 * Optimizes 3D mesh geometry, eliminating duplicate vertices, generating index buffers,
 * purging degenerate faces, and correcting normals and tangents.
 */
export function optimizeGeometry3D(
  input: Mesh3DData | GeometryBufferData,
  config: GeometryOptimizationConfig = {}
): OptimizedGeometryResult {
  const deduplicate = config.deduplicateVertices ?? true;
  const tol = config.deduplicationTolerance ?? 1e-4;
  const removeDegenerates = config.removeDegenerateTriangles ?? true;
  const recalculateNormals = config.recalculateNormals ?? false;
  const generateTangents = config.generateTangents ?? false;

  const srcPositions = input.positions;
  const srcNormals = input.normals;
  const srcUvs = input.uvs;
  const srcIndices = input.indices;

  const originalVertexCount = Math.floor(srcPositions.length / 3);
  const originalTriangleCount = srcIndices ? Math.floor(srcIndices.length / 3) : Math.floor(originalVertexCount / 3);

  // 1. Spatial Vertex Deduplication & Index Generation
  const quantScale = 1.0 / tol;
  const uniqueVertexMap = new Map<string, number>();

  const newPositionsList: number[] = [];
  const newNormalsList: number[] = [];
  const newUvsList: number[] = [];
  const newIndicesList: number[] = [];

  const getVertexKey = (idx: number): string => {
    const px = Math.round(srcPositions[idx * 3] * quantScale);
    const py = Math.round(srcPositions[idx * 3 + 1] * quantScale);
    const pz = Math.round(srcPositions[idx * 3 + 2] * quantScale);

    let nx = 0, ny = 0, nz = 0;
    if (srcNormals && srcNormals.length >= (idx + 1) * 3) {
      nx = Math.round(srcNormals[idx * 3] * 100);
      ny = Math.round(srcNormals[idx * 3 + 1] * 100);
      nz = Math.round(srcNormals[idx * 3 + 2] * 100);
    }

    let u = 0, v = 0;
    if (srcUvs && srcUvs.length >= (idx + 1) * 2) {
      u = Math.round(srcUvs[idx * 2] * 1000);
      v = Math.round(srcUvs[idx * 2 + 1] * 1000);
    }

    return `${px}_${py}_${pz}_${nx}_${ny}_${nz}_${u}_${v}`;
  };

  const getOrAddVertex = (srcIdx: number): number => {
    if (!deduplicate) {
      const newIdx = newPositionsList.length / 3;
      newPositionsList.push(srcPositions[srcIdx * 3], srcPositions[srcIdx * 3 + 1], srcPositions[srcIdx * 3 + 2]);
      if (srcNormals && srcNormals.length >= (srcIdx + 1) * 3) {
        newNormalsList.push(srcNormals[srcIdx * 3], srcNormals[srcIdx * 3 + 1], srcNormals[srcIdx * 3 + 2]);
      }
      if (srcUvs && srcUvs.length >= (srcIdx + 1) * 2) {
        newUvsList.push(srcUvs[srcIdx * 2], srcUvs[srcIdx * 2 + 1]);
      }
      return newIdx;
    }

    const key = getVertexKey(srcIdx);
    let targetIdx = uniqueVertexMap.get(key);
    if (targetIdx !== undefined) {
      return targetIdx;
    }

    targetIdx = newPositionsList.length / 3;
    uniqueVertexMap.set(key, targetIdx);

    newPositionsList.push(srcPositions[srcIdx * 3], srcPositions[srcIdx * 3 + 1], srcPositions[srcIdx * 3 + 2]);

    if (srcNormals && srcNormals.length >= (srcIdx + 1) * 3) {
      newNormalsList.push(srcNormals[srcIdx * 3], srcNormals[srcIdx * 3 + 1], srcNormals[srcIdx * 3 + 2]);
    } else {
      newNormalsList.push(0, 1, 0);
    }

    if (srcUvs && srcUvs.length >= (srcIdx + 1) * 2) {
      newUvsList.push(srcUvs[srcIdx * 2], srcUvs[srcIdx * 2 + 1]);
    } else {
      newUvsList.push(0, 0);
    }

    return targetIdx;
  };

  // Process triangles (either from existing index buffer or vertex stream)
  const totalTris = srcIndices ? srcIndices.length / 3 : originalVertexCount / 3;

  for (let t = 0; t < totalTris; t++) {
    const s0 = srcIndices ? srcIndices[t * 3] : t * 3;
    const s1 = srcIndices ? srcIndices[t * 3 + 1] : t * 3 + 1;
    const s2 = srcIndices ? srcIndices[t * 3 + 2] : t * 3 + 2;

    const i0 = getOrAddVertex(s0);
    const i1 = getOrAddVertex(s1);
    const i2 = getOrAddVertex(s2);

    newIndicesList.push(i0, i1, i2);
  }

  // 2. Remove Degenerate Triangles
  let degeneratesRemoved = 0;
  const filteredIndices: number[] = [];

  for (let i = 0; i < newIndicesList.length; i += 3) {
    const i0 = newIndicesList[i];
    const i1 = newIndicesList[i + 1];
    const i2 = newIndicesList[i + 2];

    if (removeDegenerates && (i0 === i1 || i1 === i2 || i0 === i2)) {
      degeneratesRemoved++;
      continue;
    }

    const p0x = newPositionsList[i0 * 3], p0y = newPositionsList[i0 * 3 + 1], p0z = newPositionsList[i0 * 3 + 2];
    const p1x = newPositionsList[i1 * 3], p1y = newPositionsList[i1 * 3 + 1], p1z = newPositionsList[i1 * 3 + 2];
    const p2x = newPositionsList[i2 * 3], p2y = newPositionsList[i2 * 3 + 1], p2z = newPositionsList[i2 * 3 + 2];

    const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
    const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

    const cx = e1y * e2z - e1z * e2y;
    const cy = e1z * e2x - e1x * e2z;
    const cz = e1x * e2y - e1y * e2x;
    const areaSq = cx * cx + cy * cy + cz * cz;

    if (removeDegenerates && areaSq < 1e-12) {
      degeneratesRemoved++;
      continue;
    }

    filteredIndices.push(i0, i1, i2);
  }

  const outPositions = new Float32Array(newPositionsList);
  let outNormals = new Float32Array(newNormalsList);
  const outUvs = new Float32Array(newUvsList);

  const maxIdx = Math.max(0, ...filteredIndices);
  const outIndices = maxIdx > 65535 ? new Uint32Array(filteredIndices) : new Uint16Array(filteredIndices);

  // 3. Smooth Normal Recalculation
  if (recalculateNormals) {
    outNormals = new Float32Array(outPositions.length);

    for (let i = 0; i < outIndices.length; i += 3) {
      const i0 = outIndices[i];
      const i1 = outIndices[i + 1];
      const i2 = outIndices[i + 2];

      const p0x = outPositions[i0 * 3], p0y = outPositions[i0 * 3 + 1], p0z = outPositions[i0 * 3 + 2];
      const p1x = outPositions[i1 * 3], p1y = outPositions[i1 * 3 + 1], p1z = outPositions[i1 * 3 + 2];
      const p2x = outPositions[i2 * 3], p2y = outPositions[i2 * 3 + 1], p2z = outPositions[i2 * 3 + 2];

      const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
      const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

      // Cross product gives area-weighted normal
      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;

      outNormals[i0 * 3] += nx; outNormals[i0 * 3 + 1] += ny; outNormals[i0 * 3 + 2] += nz;
      outNormals[i1 * 3] += nx; outNormals[i1 * 3 + 1] += ny; outNormals[i1 * 3 + 2] += nz;
      outNormals[i2 * 3] += nx; outNormals[i2 * 3 + 1] += ny; outNormals[i2 * 3 + 2] += nz;
    }

    // Normalize accumulated vertex normals
    for (let i = 0; i < outNormals.length; i += 3) {
      const len = Math.hypot(outNormals[i], outNormals[i + 1], outNormals[i + 2]);
      if (len > 1e-6) {
        outNormals[i] /= len;
        outNormals[i + 1] /= len;
        outNormals[i + 2] /= len;
      } else {
        outNormals[i] = 0;
        outNormals[i + 1] = 1;
        outNormals[i + 2] = 0;
      }
    }
  }

  // 4. Tangent Generation (4 components: Tx, Ty, Tz, handedness sign W)
  let outTangents: Float32Array | undefined = undefined;
  let tangentsGenerated = false;

  if (generateTangents && outUvs.length > 0) {
    const vCount = outPositions.length / 3;
    outTangents = new Float32Array(vCount * 4);
    const tan1 = new Float32Array(vCount * 3);
    const tan2 = new Float32Array(vCount * 3);

    for (let i = 0; i < outIndices.length; i += 3) {
      const i0 = outIndices[i];
      const i1 = outIndices[i + 1];
      const i2 = outIndices[i + 2];

      const v1x = outPositions[i0 * 3], v1y = outPositions[i0 * 3 + 1], v1z = outPositions[i0 * 3 + 2];
      const v2x = outPositions[i1 * 3], v2y = outPositions[i1 * 3 + 1], v2z = outPositions[i1 * 3 + 2];
      const v3x = outPositions[i2 * 3], v3y = outPositions[i2 * 3 + 1], v3z = outPositions[i2 * 3 + 2];

      const w1u = outUvs[i0 * 2], w1v = outUvs[i0 * 2 + 1];
      const w2u = outUvs[i1 * 2], w2v = outUvs[i1 * 2 + 1];
      const w3u = outUvs[i2 * 2], w3v = outUvs[i2 * 2 + 1];

      const x1 = v2x - v1x, x2 = v3x - v1x;
      const y1 = v2y - v1y, y2 = v3y - v1y;
      const z1 = v2z - v1z, z2 = v3z - v1z;

      const s1 = w2u - w1u, s2 = w3u - w1u;
      const t1 = w2v - w1v, t2 = w3v - w1v;

      const r = s1 * t2 - s2 * t1;
      const f = Math.abs(r) > 1e-8 ? 1.0 / r : 0.0;

      const sdirX = (t2 * x1 - t1 * x2) * f;
      const sdirY = (t2 * y1 - t1 * y2) * f;
      const sdirZ = (t2 * z1 - t1 * z2) * f;

      const tdirX = (s1 * x2 - s2 * x1) * f;
      const tdirY = (s1 * y2 - s2 * y1) * f;
      const tdirZ = (s1 * z2 - s2 * z1) * f;

      tan1[i0 * 3] += sdirX; tan1[i0 * 3 + 1] += sdirY; tan1[i0 * 3 + 2] += sdirZ;
      tan1[i1 * 3] += sdirX; tan1[i1 * 3 + 1] += sdirY; tan1[i1 * 3 + 2] += sdirZ;
      tan1[i2 * 3] += sdirX; tan1[i2 * 3 + 1] += sdirY; tan1[i2 * 3 + 2] += sdirZ;

      tan2[i0 * 3] += tdirX; tan2[i0 * 3 + 1] += tdirY; tan2[i0 * 3 + 2] += tdirZ;
      tan2[i1 * 3] += tdirX; tan2[i1 * 3 + 1] += tdirY; tan2[i1 * 3 + 2] += tdirZ;
      tan2[i2 * 3] += tdirX; tan2[i2 * 3 + 1] += tdirY; tan2[i2 * 3 + 2] += tdirZ;
    }

    // Gram-Schmidt orthogonalize
    for (let i = 0; i < vCount; i++) {
      const nX = outNormals[i * 3], nY = outNormals[i * 3 + 1], nZ = outNormals[i * 3 + 2];
      const tX = tan1[i * 3], tY = tan1[i * 3 + 1], tZ = tan1[i * 3 + 2];

      // dot(n, t)
      const dot = nX * tX + nY * tY + nZ * tZ;
      let orthX = tX - nX * dot;
      let orthY = tY - nY * dot;
      let orthZ = tZ - nZ * dot;

      const len = Math.hypot(orthX, orthY, orthZ);
      if (len > 1e-6) {
        orthX /= len; orthY /= len; orthZ /= len;
      } else {
        orthX = 1; orthY = 0; orthZ = 0;
      }

      // Handedness calculation
      const crossX = nY * tZ - nZ * tY;
      const crossY = nZ * tX - nX * tZ;
      const crossZ = nX * tY - nY * tX;
      const dotCross = crossX * tan2[i * 3] + crossY * tan2[i * 3 + 1] + crossZ * tan2[i * 3 + 2];
      const w = dotCross < 0.0 ? -1.0 : 1.0;

      outTangents[i * 4] = orthX;
      outTangents[i * 4 + 1] = orthY;
      outTangents[i * 4 + 2] = orthZ;
      outTangents[i * 4 + 3] = w;
    }

    tangentsGenerated = true;
  }

  const optimizedVertexCount = outPositions.length / 3;
  const optimizedTriangleCount = outIndices.length / 3;
  const reductionPercentage = originalVertexCount > 0
    ? ((originalVertexCount - optimizedVertexCount) / originalVertexCount) * 100
    : 0;

  const resultMesh: Mesh3DData = {
    id: "id" in input && input.id ? input.id : "optimized-mesh",
    name: "name" in input && input.name ? input.name : "optimized-mesh",
    positions: outPositions,
    normals: outNormals,
    uvs: outUvs,
    indices: outIndices,
    tangents: outTangents,
  };

  return {
    mesh: resultMesh,
    originalVertexCount,
    optimizedVertexCount,
    originalTriangleCount,
    optimizedTriangleCount,
    reductionPercentage: Math.max(0, reductionPercentage),
    indicesGenerated: !srcIndices,
    tangentsGenerated,
    degeneratesRemoved,
  };
}

/**
 * Merges multiple 3D sub-meshes into a single unified mesh buffer for draw call reduction.
 */
export function mergeGeometries3D(meshes: Mesh3DData[], materialId?: string): Mesh3DData {
  const commonMatId = materialId ?? meshes[0]?.materialId;
  if (meshes.length === 0) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      uvs: new Float32Array(0),
      indices: new Uint16Array(0),
      materialId: commonMatId,
    };
  }
  if (meshes.length === 1) {
    return { ...meshes[0], materialId: commonMatId };
  }

  let totalVerts = 0;
  let totalIndices = 0;

  for (const m of meshes) {
    const vCount = m.positions.length / 3;
    totalVerts += vCount;
    totalIndices += m.indices ? m.indices.length : vCount;
  }

  const mergedPos = new Float32Array(totalVerts * 3);
  const mergedNorm = new Float32Array(totalVerts * 3);
  const mergedUvs = new Float32Array(totalVerts * 2);
  const is32Bit = totalVerts > 65535;
  const mergedIndices = is32Bit ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;

  for (const m of meshes) {
    const vCount = m.positions.length / 3;
    mergedPos.set(m.positions, vOffset * 3);

    if (m.normals) {
      mergedNorm.set(m.normals, vOffset * 3);
    }
    if (m.uvs) {
      mergedUvs.set(m.uvs, vOffset * 2);
    }

    if (m.indices) {
      for (let i = 0; i < m.indices.length; i++) {
        mergedIndices[iOffset + i] = m.indices[i] + vOffset;
      }
      iOffset += m.indices.length;
    } else {
      for (let i = 0; i < vCount; i++) {
        mergedIndices[iOffset + i] = i + vOffset;
      }
      iOffset += vCount;
    }

    vOffset += vCount;
  }

  return {
    id: "merged-mesh",
    name: "merged-mesh",
    positions: mergedPos,
    normals: mergedNorm,
    uvs: mergedUvs,
    indices: mergedIndices,
    materialId: commonMatId,
  };
}

/**
 * Splits a large mesh exceeding vertex thresholds into smaller, cache-friendly sub-meshes.
 */
export function splitMesh3D(mesh: Mesh3DData, maxVertices: number = 65535): Mesh3DData[] {
  const vCount = mesh.positions.length / 3;
  if (vCount <= maxVertices) {
    return [mesh];
  }

  const indices = mesh.indices;
  if (!indices) {
    // Convert to indexed first then split
    const opt = optimizeGeometry3D(mesh, { generateIndices: true });
    return splitMesh3D(opt.mesh, maxVertices);
  }

  const triCount = indices.length / 3;
  const subMeshes: Mesh3DData[] = [];

  let curPositions: number[] = [];
  let curNormals: number[] = [];
  let curUvs: number[] = [];
  let curIndices: number[] = [];
  const vertexRemap = new Map<number, number>();

  const flushSubMesh = (): void => {
    if (curIndices.length > 0) {
      subMeshes.push({
        id: `${mesh.id ?? "mesh"}-sub-${subMeshes.length + 1}`,
        positions: new Float32Array(curPositions),
        normals: curNormals.length > 0 ? new Float32Array(curNormals) : undefined,
        uvs: curUvs.length > 0 ? new Float32Array(curUvs) : undefined,
        indices: new Uint16Array(curIndices),
      });
      curPositions = [];
      curNormals = [];
      curUvs = [];
      curIndices = [];
      vertexRemap.clear();
    }
  };

  for (let t = 0; t < triCount; t++) {
    const s0 = indices[t * 3];
    const s1 = indices[t * 3 + 1];
    const s2 = indices[t * 3 + 2];

    // Check if adding triangle would exceed maxVertices
    const newVertsEstimate =
      (vertexRemap.has(s0) ? 0 : 1) +
      (vertexRemap.has(s1) ? 0 : 1) +
      (vertexRemap.has(s2) ? 0 : 1);

    if (curPositions.length / 3 + newVertsEstimate > maxVertices) {
      flushSubMesh();
    }

    const addVert = (sIdx: number): number => {
      let remap = vertexRemap.get(sIdx);
      if (remap !== undefined) return remap;

      remap = curPositions.length / 3;
      vertexRemap.set(sIdx, remap);

      curPositions.push(mesh.positions[sIdx * 3], mesh.positions[sIdx * 3 + 1], mesh.positions[sIdx * 3 + 2]);
      if (mesh.normals) {
        curNormals.push(mesh.normals[sIdx * 3], mesh.normals[sIdx * 3 + 1], mesh.normals[sIdx * 3 + 2]);
      }
      if (mesh.uvs) {
        curUvs.push(mesh.uvs[sIdx * 2], mesh.uvs[sIdx * 2 + 1]);
      }
      return remap;
    };

    const i0 = addVert(s0);
    const i1 = addVert(s1);
    const i2 = addVert(s2);
    curIndices.push(i0, i1, i2);
  }

  flushSubMesh();
  return subMeshes;
}
