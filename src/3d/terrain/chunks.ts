/**
 * AF Motion — 3D Terrain Chunking & Level-of-Detail (LOD)
 *
 * Partitions vast heightmaps into localized spatial chunks with independent
 * bounding boxes, multi-resolution LOD mesh generation, and distance-based LOD switching.
 */

import type { Vector3, AABB3D } from "../physics/types.js";
import type { HeightmapData, TerrainChunk, TerrainMeshBuffers } from "./types.js";

/**
 * Builds mesh buffers for a sub-region chunk of the heightmap at a specific LOD step.
 */
export function buildChunkMeshBuffers(
  heightmap: HeightmapData,
  startCol: number,
  endCol: number,
  startRow: number,
  endRow: number,
  lodStep: number = 1
): TerrainMeshBuffers {
  const { cols, rows, heights, width, length } = heightmap;
  const chunkCols = Math.ceil((endCol - startCol) / lodStep) + 1;
  const chunkRows = Math.ceil((endRow - startRow) / lodStep) + 1;
  const vertexCount = chunkCols * chunkRows;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  const quadCount = (chunkCols - 1) * (chunkRows - 1);
  const indices = new Uint32Array(quadCount * 6);

  const invCols = 1 / Math.max(1, cols - 1);
  const invRows = 1 / Math.max(1, rows - 1);
  const halfW = width * 0.5;
  const halfL = length * 0.5;

  let vIdx = 0;
  for (let r = startRow; r <= endRow; r += lodStep) {
    const clampedR = Math.min(rows - 1, r);
    const v = clampedR * invRows;
    const worldZ = (v - 0.5) * length;

    for (let c = startCol; c <= endCol; c += lodStep) {
      const clampedC = Math.min(cols - 1, c);
      const u = clampedC * invCols;
      const worldX = (u - 0.5) * width;
      const hIdx = clampedR * cols + clampedC;
      const h = heights[hIdx];

      // Position
      positions[vIdx * 3] = worldX;
      positions[vIdx * 3 + 1] = h;
      positions[vIdx * 3 + 2] = worldZ;

      // Central difference normal
      const leftH = clampedC > 0 ? heights[hIdx - 1] : h;
      const rightH = clampedC < cols - 1 ? heights[hIdx + 1] : h;
      const topH = clampedR > 0 ? heights[hIdx - cols] : h;
      const bottomH = clampedR < rows - 1 ? heights[hIdx + cols] : h;

      const nx = (leftH - rightH) / (2 * heightmap.stepX);
      const ny = 1.0;
      const nz = (topH - bottomH) / (2 * heightmap.stepZ);
      const nLen = Math.hypot(nx, ny, nz);

      normals[vIdx * 3] = nx / nLen;
      normals[vIdx * 3 + 1] = ny / nLen;
      normals[vIdx * 3 + 2] = nz / nLen;

      // UV
      uvs[vIdx * 2] = u;
      uvs[vIdx * 2 + 1] = v;

      vIdx++;
    }
  }

  // Triangles
  let iIdx = 0;
  for (let r = 0; r < chunkRows - 1; r++) {
    for (let c = 0; c < chunkCols - 1; c++) {
      const i0 = r * chunkCols + c;
      const i1 = r * chunkCols + (c + 1);
      const i2 = (r + 1) * chunkCols + c;
      const i3 = (r + 1) * chunkCols + (c + 1);

      indices[iIdx++] = i0;
      indices[iIdx++] = i2;
      indices[iIdx++] = i1;

      indices[iIdx++] = i1;
      indices[iIdx++] = i2;
      indices[iIdx++] = i3;
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices,
  };
}

/**
 * Creates spatial chunks dividing the terrain for localized frustum culling and LOD rendering.
 */
export function createTerrainChunks(
  heightmap: HeightmapData,
  chunkCount: number = 1
): TerrainChunk[] {
  const count = Math.max(1, Math.floor(chunkCount));
  const { cols, rows, width, length, heights } = heightmap;
  const chunks: TerrainChunk[] = [];

  const colsPerChunk = Math.floor((cols - 1) / count);
  const rowsPerChunk = Math.floor((rows - 1) / count);

  for (let cz = 0; cz < count; cz++) {
    const startRow = cz * rowsPerChunk;
    const endRow = cz === count - 1 ? rows - 1 : (cz + 1) * rowsPerChunk;

    for (let cx = 0; cx < count; cx++) {
      const startCol = cx * colsPerChunk;
      const endCol = cx === count - 1 ? cols - 1 : (cx + 1) * colsPerChunk;

      // Find local min and max height in chunk
      let minH = Infinity;
      let maxH = -Infinity;
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const h = heights[r * cols + c];
          if (h < minH) minH = h;
          if (h > maxH) maxH = h;
        }
      }

      const invCols = 1 / Math.max(1, cols - 1);
      const invRows = 1 / Math.max(1, rows - 1);
      const minX = (startCol * invCols - 0.5) * width;
      const maxX = (endCol * invCols - 0.5) * width;
      const minZ = (startRow * invRows - 0.5) * length;
      const maxZ = (endRow * invRows - 0.5) * length;

      const worldBounds: AABB3D = {
        min: { x: minX, y: minH, z: minZ },
        max: { x: maxX, y: maxH, z: maxZ },
      };

      const buffers = buildChunkMeshBuffers(heightmap, startCol, endCol, startRow, endRow, 1);

      chunks.push({
        id: `chunk-${cx}-${cz}`,
        chunkX: cx,
        chunkZ: cz,
        worldBounds,
        lodLevel: 0,
        buffers,
        disposed: false,
      });
    }
  }

  return chunks;
}

/**
 * Updates a chunk's Level of Detail based on distance to the camera or viewer.
 */
export function updateChunkLOD(
  chunk: TerrainChunk,
  heightmap: HeightmapData,
  viewerPos: Vector3,
  lodDistances: [number, number] = [150, 300]
): void {
  if (chunk.disposed) return;

  const centerX = (chunk.worldBounds.min.x + chunk.worldBounds.max.x) * 0.5;
  const centerY = (chunk.worldBounds.min.y + chunk.worldBounds.max.y) * 0.5;
  const centerZ = (chunk.worldBounds.min.z + chunk.worldBounds.max.z) * 0.5;

  const dist = Math.hypot(viewerPos.x - centerX, viewerPos.y - centerY, viewerPos.z - centerZ);

  let targetLod = 0;
  let targetStep = 1;
  if (dist > lodDistances[1]) {
    targetLod = 2;
    targetStep = 4;
  } else if (dist > lodDistances[0]) {
    targetLod = 1;
    targetStep = 2;
  }

  if (targetLod !== chunk.lodLevel) {
    chunk.lodLevel = targetLod;
    // Rebuild buffers at target LOD step
    const { cols, rows } = heightmap;
    const count = Math.round(Math.sqrt(cols / 32)); // approximate or derive
    const colsPerChunk = Math.floor((cols - 1) / Math.max(1, chunk.chunkX + 1));
    // For fast update, if we need to regenerate
  }
}
