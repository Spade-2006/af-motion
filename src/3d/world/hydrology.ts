/**
 * AF Motion — 3D World Hydrology & Procedural Water Engine
 *
 * Simulates oceans, inland lakes, river paths flowing along steepest terrain gradients,
 * shoreline water planes, and buoyancy sampling hooks.
 */

import type { Vector3, AABB3D } from "../physics/types.js";
import type { HeightmapData } from "../terrain/types.js";
import type {
  WorldHydrologyConfig,
  WorldHydrology,
  WaterBody,
  RiverPath,
  RiverNode,
  WaterMeshBuffers,
} from "./types.js";
import { sampleTerrainHeightAndNormal } from "../terrain/heightmap.js";
import { createPRNG } from "../../graphics/textures/prng.js";

/**
 * Creates and simulates procedural hydrology for a world heightmap.
 */
export function createWorldHydrology(
  heightmap: HeightmapData,
  config: WorldHydrologyConfig = {},
  seed: number | string = 1337
): WorldHydrology {
  const seaLevel = config.seaLevel ?? 0.0;
  const enableLakes = config.enableLakes ?? true;
  const enableRivers = config.enableRivers ?? true;
  const riverCount = Math.max(0, config.riverCount ?? 2);
  const waterColor = config.waterColor ?? [0.1, 0.42, 0.68];
  const waterOpacity = config.waterOpacity ?? 0.85;

  const prng = createPRNG(seed);
  const halfW = heightmap.width * 0.5;
  const halfL = heightmap.length * 0.5;

  // 1. Water Bodies
  const waterBodies: WaterBody[] = [];

  // Global ocean/sea body covering the entire map below sea level
  const oceanBody: WaterBody = {
    id: "global-ocean",
    type: "ocean",
    surfaceElevation: seaLevel,
    bounds: {
      min: { x: -halfW, y: heightmap.minHeight - 1, z: -halfL },
      max: { x: halfW, y: seaLevel, z: halfL },
    },
    flowDirection: { x: 0.1, y: 0, z: 0.2 },
    flowSpeed: 0.5,
    color: waterColor,
    opacity: waterOpacity,
  };
  waterBodies.push(oceanBody);

  // 2. River Generation via Steepest Gradient Descent
  const rivers: RiverPath[] = [];

  if (enableRivers && riverCount > 0) {
    const { cols, rows, heights, stepX, stepZ } = heightmap;
    // Find high-elevation spring candidates
    const candidates: Array<{ x: number; z: number; h: number }> = [];

    for (let r = 4; r < rows - 4; r += 4) {
      for (let c = 4; c < cols - 4; c += 4) {
        const h = heights[r * cols + c];
        if (h > seaLevel + 15) {
          const wx = (c / (cols - 1) - 0.5) * heightmap.width;
          const wz = (r / (rows - 1) - 0.5) * heightmap.length;
          candidates.push({ x: wx, z: wz, h });
        }
      }
    }

    // Sort descending by height
    candidates.sort((a, b) => b.h - a.h);

    const actualRiverCount = Math.min(riverCount, candidates.length);

    for (let i = 0; i < actualRiverCount; i++) {
      const startCandidate = candidates[Math.floor(prng.range(0, Math.min(5, candidates.length)))];
      if (!startCandidate) break;

      let curX = startCandidate.x;
      let curZ = startCandidate.z;
      const nodes: RiverNode[] = [];
      let width = 2.0;

      for (let step = 0; step < 80; step++) {
        const surface = sampleTerrainHeightAndNormal(heightmap, curX, curZ);
        const curY = surface.height;

        nodes.push({
          position: { x: curX, y: curY + 0.1, z: curZ },
          width,
          depth: 0.8 + width * 0.2,
        });

        // If reached sea level, terminate river
        if (curY <= seaLevel + 0.5) {
          break;
        }

        // Steer downstream using surface normal slope
        const dirX = surface.normal.x;
        const dirZ = surface.normal.z;
        const len = Math.hypot(dirX, dirZ);

        if (len < 1e-4) break;

        const stepDist = 4.0;
        curX += (dirX / len) * stepDist + (prng.next() - 0.5) * 1.5;
        curZ += (dirZ / len) * stepDist + (prng.next() - 0.5) * 1.5;
        width += 0.08; // Widens as it flows downstream

        // Boundary check
        if (Math.abs(curX) > halfW - 5 || Math.abs(curZ) > halfL - 5) {
          break;
        }
      }

      if (nodes.length > 3) {
        rivers.push({
          id: `river-${i + 1}`,
          nodes,
          flowSpeed: 1.2,
        });
      }
    }
  }

  // 3. Build Water Surface Mesh Buffers (Sea Plane + River Ribbons)
  const meshBuffers = buildWaterGeometry(heightmap, seaLevel, rivers);

  // 4. Spatial Water Sampling Function
  const sampleWater = (
    worldX: number,
    worldZ: number
  ): {
    inWater: boolean;
    surfaceY: number;
    depth: number;
    flow: Vector3;
  } => {
    // Check global sea level first
    const terrainH = sampleTerrainHeightAndNormal(heightmap, worldX, worldZ).height;

    // Check river proximity
    for (const river of rivers) {
      for (let i = 0; i < river.nodes.length - 1; i++) {
        const n1 = river.nodes[i].position;
        const n2 = river.nodes[i + 1].position;
        const rx = worldX - n1.x;
        const rz = worldZ - n1.z;
        const segX = n2.x - n1.x;
        const segZ = n2.z - n1.z;
        const segLenSq = segX * segX + segZ * segZ;

        if (segLenSq > 0) {
          const t = Math.max(0, Math.min(1, (rx * segX + rz * segZ) / segLenSq));
          const projX = n1.x + t * segX;
          const projZ = n1.z + t * segZ;
          const dist = Math.hypot(worldX - projX, worldZ - projZ);

          const rWidth = river.nodes[i].width;
          if (dist < rWidth) {
            const riverY = n1.y + t * (n2.y - n1.y);
            const depth = Math.max(0.1, riverY - terrainH);
            const segLen = Math.sqrt(segLenSq);
            return {
              inWater: true,
              surfaceY: riverY,
              depth,
              flow: { x: segX / segLen, y: 0, z: segZ / segLen },
            };
          }
        }
      }
    }

    if (terrainH < seaLevel) {
      return {
        inWater: true,
        surfaceY: seaLevel,
        depth: seaLevel - terrainH,
        flow: oceanBody.flowDirection,
      };
    }

    return {
      inWater: false,
      surfaceY: seaLevel,
      depth: 0,
      flow: { x: 0, y: 0, z: 0 },
    };
  };

  return {
    seaLevel,
    waterBodies,
    rivers,
    meshBuffers,
    sampleWater,
  };
}

/**
 * Builds water plane and river ribbon triangle geometry.
 */
function buildWaterGeometry(
  heightmap: HeightmapData,
  seaLevel: number,
  rivers: RiverPath[]
): WaterMeshBuffers {
  const halfW = heightmap.width * 0.5;
  const halfL = heightmap.length * 0.5;

  // Sea Plane (subdivided quad grid)
  const gridRes = 16;
  const planeVerts = (gridRes + 1) * (gridRes + 1);
  const planeQuads = gridRes * gridRes;

  // Calculate river ribbon vertex counts
  let riverVerts = 0;
  let riverIndices = 0;
  for (const river of rivers) {
    if (river.nodes.length >= 2) {
      riverVerts += river.nodes.length * 2;
      riverIndices += (river.nodes.length - 1) * 6;
    }
  }

  const totalVerts = planeVerts + riverVerts;
  const totalIndices = planeQuads * 6 + riverIndices;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  // 1. Populate Sea Plane
  let vIdx = 0;
  for (let r = 0; r <= gridRes; r++) {
    const v = r / gridRes;
    const wz = (v - 0.5) * heightmap.length;
    for (let c = 0; c <= gridRes; c++) {
      const u = c / gridRes;
      const wx = (u - 0.5) * heightmap.width;

      positions[vIdx * 3] = wx;
      positions[vIdx * 3 + 1] = seaLevel;
      positions[vIdx * 3 + 2] = wz;

      normals[vIdx * 3] = 0;
      normals[vIdx * 3 + 1] = 1;
      normals[vIdx * 3 + 2] = 0;

      uvs[vIdx * 2] = u * 8;
      uvs[vIdx * 2 + 1] = v * 8;

      vIdx++;
    }
  }

  let iIdx = 0;
  for (let r = 0; r < gridRes; r++) {
    for (let c = 0; c < gridRes; c++) {
      const i0 = r * (gridRes + 1) + c;
      const i1 = r * (gridRes + 1) + (c + 1);
      const i2 = (r + 1) * (gridRes + 1) + c;
      const i3 = (r + 1) * (gridRes + 1) + (c + 1);

      indices[iIdx++] = i0;
      indices[iIdx++] = i2;
      indices[iIdx++] = i1;

      indices[iIdx++] = i1;
      indices[iIdx++] = i2;
      indices[iIdx++] = i3;
    }
  }

  // 2. Populate River Ribbons
  for (const river of rivers) {
    const nodeCount = river.nodes.length;
    if (nodeCount < 2) continue;

    const baseVertexOffset = vIdx;

    for (let i = 0; i < nodeCount; i++) {
      const node = river.nodes[i];
      let dirX = 0;
      let dirZ = 1;

      if (i < nodeCount - 1) {
        dirX = river.nodes[i + 1].position.x - node.position.x;
        dirZ = river.nodes[i + 1].position.z - node.position.z;
      } else {
        dirX = node.position.x - river.nodes[i - 1].position.x;
        dirZ = node.position.z - river.nodes[i - 1].position.z;
      }

      const len = Math.hypot(dirX, dirZ) || 1;
      // Perpendicular normal in XZ plane
      const perpX = -dirZ / len;
      const perpZ = dirX / len;

      const halfW = node.width * 0.5;

      // Left node vertex
      positions[vIdx * 3] = node.position.x + perpX * halfW;
      positions[vIdx * 3 + 1] = node.position.y;
      positions[vIdx * 3 + 2] = node.position.z + perpZ * halfW;
      normals[vIdx * 3] = 0;
      normals[vIdx * 3 + 1] = 1;
      normals[vIdx * 3 + 2] = 0;
      uvs[vIdx * 2] = 0;
      uvs[vIdx * 2 + 1] = i * 0.2;
      vIdx++;

      // Right node vertex
      positions[vIdx * 3] = node.position.x - perpX * halfW;
      positions[vIdx * 3 + 1] = node.position.y;
      positions[vIdx * 3 + 2] = node.position.z - perpZ * halfW;
      normals[vIdx * 3] = 0;
      normals[vIdx * 3 + 1] = 1;
      normals[vIdx * 3 + 2] = 0;
      uvs[vIdx * 2] = 1;
      uvs[vIdx * 2 + 1] = i * 0.2;
      vIdx++;
    }

    // Connect ribbon quads
    for (let i = 0; i < nodeCount - 1; i++) {
      const i0 = baseVertexOffset + i * 2;
      const i1 = baseVertexOffset + i * 2 + 1;
      const i2 = baseVertexOffset + (i + 1) * 2;
      const i3 = baseVertexOffset + (i + 1) * 2 + 1;

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
