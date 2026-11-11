/**
 * AF Motion — 3D Procedural Terrain Engine
 *
 * Master Terrain3D orchestrator coordinating procedural heightmap generation,
 * hydraulic/thermal erosion, biome classification, material splatting,
 * vegetation scattering, chunking, and physics heightfield integration.
 */

import type { Vector3, AABB3D } from "../physics/types.js";
import type {
  Terrain3D,
  TerrainConfig,
  BiomeType,
} from "./types.js";
import { generateTerrainHeightmap, buildTerrainMeshBuffers } from "./heightmap.js";
import { applyHydraulicErosion, applyThermalErosion } from "./erosion.js";
import { classifyTerrainBiomes } from "./biomes.js";
import { generateTerrainMaterials } from "./materials.js";
import { scatterTerrainVegetation } from "./vegetation.js";
import { createTerrainChunks } from "./chunks.js";
import { createTerrainCollider, sampleTerrainHeight, sampleTerrainNormal, raycastTerrain } from "./physics.js";

let nextTerrainId = 1;

/**
 * Creates and initializes a complete 3D procedural terrain ecosystem.
 */
export function createTerrain3D(config: TerrainConfig = {}): Terrain3D {
  const id = config.id ?? `terrain-${nextTerrainId++}`;
  const width = config.width ?? 200;
  const length = config.length ?? 200;
  const resolutionX = config.resolutionX ?? 128;
  const resolutionZ = config.resolutionZ ?? 128;
  const origin = config.origin ?? { x: 0, y: 0, z: 0 };
  const preset = config.preset ?? "rolling-hills";
  const seed = config.seed ?? 1337;

  // 1. Generate base procedural heightmap
  const heightmap = generateTerrainHeightmap({
    width,
    length,
    resolutionX,
    resolutionZ,
    preset,
    noiseLayers: config.noiseLayers,
    seed,
  });

  // 2. Apply Hydraulic Erosion if enabled
  if (config.hydraulicErosion) {
    const hydraulicConfig = typeof config.hydraulicErosion === "object" ? config.hydraulicErosion : {};
    applyHydraulicErosion(heightmap, {
      seed: `${seed}-hydro`,
      ...hydraulicConfig,
    });
  }

  // 3. Apply Thermal Erosion if enabled
  if (config.thermalErosion) {
    const thermalConfig = typeof config.thermalErosion === "object" ? config.thermalErosion : {};
    applyThermalErosion(heightmap, thermalConfig);
  }

  // 4. Biome classification
  const biomes = classifyTerrainBiomes(heightmap, config.biomes, { seed });

  // 5. Materials & Vertex Colors
  const materials = generateTerrainMaterials(heightmap, biomes, config.biomes);

  // 6. Master mesh buffers
  const meshBuffers = buildTerrainMeshBuffers(heightmap);
  meshBuffers.colors = materials.colors;

  // 7. World Bounds AABB
  const halfW = width * 0.5;
  const halfL = length * 0.5;
  const bounds: AABB3D = {
    min: {
      x: origin.x - halfW,
      y: origin.y + heightmap.minHeight,
      z: origin.z - halfL,
    },
    max: {
      x: origin.x + halfW,
      y: origin.y + heightmap.maxHeight,
      z: origin.z + halfL,
    },
  };

  // 8. Vegetation & Prop Scattering
  const vegetation = scatterTerrainVegetation(
    heightmap,
    biomes,
    config.vegetationRules,
    `${seed}-veg`
  );

  // 9. Chunking
  const chunkCount = config.chunkCount ?? 1;
  const chunks = createTerrainChunks(heightmap, chunkCount);

  // 10. Physics Collider
  const enablePhysics = config.enablePhysics ?? true;
  const collider = enablePhysics ? createTerrainCollider(heightmap) : undefined;

  // 11. Helper methods
  const sampleHeight = (worldX: number, worldZ: number): number => {
    return origin.y + sampleTerrainHeight(heightmap, worldX - origin.x, worldZ - origin.z);
  };

  const sampleNormal = (worldX: number, worldZ: number): Vector3 => {
    return sampleTerrainNormal(heightmap, worldX - origin.x, worldZ - origin.z);
  };

  const sampleBiome = (worldX: number, worldZ: number): BiomeType => {
    const relX = worldX - origin.x;
    const relZ = worldZ - origin.z;
    const u = Math.max(0, Math.min(1, (relX + halfW) / width));
    const v = Math.max(0, Math.min(1, (relZ + halfL) / length));
    const c = Math.min(heightmap.cols - 1, Math.floor(u * (heightmap.cols - 1)));
    const r = Math.min(heightmap.rows - 1, Math.floor(v * (heightmap.rows - 1)));
    return biomes.dominantBiome[r * heightmap.cols + c];
  };

  const raycast = (
    rayOrigin: Vector3,
    rayDir: Vector3,
    maxDistance = 1000
  ): { hit: boolean; point: Vector3; normal: Vector3; distance: number } | null => {
    const localOrigin = {
      x: rayOrigin.x - origin.x,
      y: rayOrigin.y - origin.y,
      z: rayOrigin.z - origin.z,
    };
    const hit = raycastTerrain(heightmap, localOrigin, rayDir, maxDistance);
    if (!hit) return null;
    return {
      hit: true,
      point: {
        x: hit.point.x + origin.x,
        y: hit.point.y + origin.y,
        z: hit.point.z + origin.z,
      },
      normal: hit.normal,
      distance: hit.distance,
    };
  };

  const dispose = (): void => {
    for (const chunk of chunks) {
      chunk.disposed = true;
    }
    chunks.length = 0;
    vegetation.length = 0;
  };

  const fullConfig = {
    ...config,
    width,
    length,
    resolutionX,
    resolutionZ,
  };

  return {
    id,
    config: fullConfig,
    heightmap,
    meshBuffers,
    bounds,
    biomes,
    vegetation,
    chunks,
    collider,
    sampleHeight,
    sampleNormal,
    sampleBiome,
    raycast,
    dispose,
  };
}
