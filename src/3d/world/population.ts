/**
 * AF Motion — 3D World Population & Vegetation Clusters
 *
 * Coordinates clustered forest groves, biome-specific flora, rocks, and environmental props
 * with water exclusion and packed 4x4 matrix instancing buffers for GPU batching.
 */

import type { HeightmapData, BiomeWeightMap, VegetationInstance } from "../terrain/types.js";
import type { WorldHydrology, WorldPopulationConfig, WorldPopulation, ForestClusterConfig } from "./types.js";
import { scatterTerrainVegetation } from "../terrain/vegetation.js";
import { createPRNG } from "../../graphics/textures/prng.js";

/**
 * Generates world population including clustered forests and packed GPU instanced transform buffers.
 */
export function createWorldPopulation(
  heightmap: HeightmapData,
  biomes: BiomeWeightMap,
  hydrology: WorldHydrology,
  config: WorldPopulationConfig = {},
  seed: number | string = 1337
): WorldPopulation {
  const prng = createPRNG(seed);
  const autoClusterCount = config.autoClusterCount ?? 4;
  const maxInstances = config.maxInstances ?? 50000;

  // 1. Generate or use specified forest clusters
  const clusters: ForestClusterConfig[] = config.clusters ? [...config.clusters] : [];

  if (!config.clusters && autoClusterCount > 0) {
    const halfW = heightmap.width * 0.4;
    const halfL = heightmap.length * 0.4;

    for (let i = 0; i < autoClusterCount; i++) {
      clusters.push({
        id: `cluster-${i + 1}`,
        center: {
          x: prng.range(-halfW, halfW),
          z: prng.range(-halfL, halfL),
        },
        radius: prng.range(15, 35),
        densityMultiplier: prng.range(2.0, 3.5),
        targetBiomes: ["forest", "alpine", "grassland"],
      });
    }
  }

  // 2. Base scatter using terrain vegetation engine
  const rawInstances = scatterTerrainVegetation(
    heightmap,
    biomes,
    config.vegetationRules,
    `${seed}-pop`
  );

  // 3. Filter instances: Exclude underwater items, and multiply in clusters
  const filteredInstances: VegetationInstance[] = [];

  for (let i = 0; i < rawInstances.length && filteredInstances.length < maxInstances; i++) {
    const inst = rawInstances[i];

    // Check if underwater
    const water = hydrology.sampleWater(inst.position.x, inst.position.z);
    if (water.inWater && inst.category !== "rocks") {
      // Don't place trees/bushes/grass underwater
      continue;
    }

    filteredInstances.push(inst);

    // If inside a forest cluster matching its biome, spawn cluster siblings
    for (const cluster of clusters) {
      if (cluster.targetBiomes.includes(inst.biome)) {
        const dx = inst.position.x - cluster.center.x;
        const dz = inst.position.z - cluster.center.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < cluster.radius * cluster.radius) {
          const extraCount = Math.floor(cluster.densityMultiplier);
          for (let k = 0; k < extraCount && filteredInstances.length < maxInstances; k++) {
            const offsetX = (prng.next() - 0.5) * 4.0;
            const offsetZ = (prng.next() - 0.5) * 4.0;
            const px = inst.position.x + offsetX;
            const pz = inst.position.z + offsetZ;

            const checkWater = hydrology.sampleWater(px, pz);
            if (!checkWater.inWater) {
              const sMult = prng.range(0.8, 1.2);
              filteredInstances.push({
                id: `${inst.id}-c${k}`,
                category: inst.category,
                position: { x: px, y: inst.position.y, z: pz },
                rotation: inst.rotation,
                scale: {
                  x: inst.scale.x * sMult,
                  y: inst.scale.y * sMult,
                  z: inst.scale.z * sMult,
                },
                biome: inst.biome,
                normal: inst.normal,
              });
            }
          }
        }
      }
    }
  }

  // 4. Build packed 4x4 transform matrices for GPU instancing
  const instancedBatches = buildInstancedBatches(filteredInstances);

  return {
    instances: filteredInstances,
    clusters,
    instancedBatches,
  };
}

/**
 * Converts vegetation instances into packed Float32Array 4x4 column-major affine matrices.
 */
function buildInstancedBatches(instances: VegetationInstance[]): Map<string, Float32Array> {
  // Group instances by category
  const groups = new Map<string, VegetationInstance[]>();
  for (const inst of instances) {
    let group = groups.get(inst.category);
    if (!group) {
      group = [];
      groups.set(inst.category, group);
    }
    group.push(inst);
  }

  const batches = new Map<string, Float32Array>();

  for (const [category, items] of groups.entries()) {
    const matrixBuffer = new Float32Array(items.length * 16);

    for (let i = 0; i < items.length; i++) {
      const { position, rotation, scale } = items[i];
      const offset = i * 16;

      // Quaternion to rotation matrix elements
      const x2 = rotation.x + rotation.x;
      const y2 = rotation.y + rotation.y;
      const z2 = rotation.z + rotation.z;

      const xx = rotation.x * x2;
      const xy = rotation.x * y2;
      const xz = rotation.x * z2;
      const yy = rotation.y * y2;
      const yz = rotation.y * z2;
      const zz = rotation.z * z2;
      const wx = rotation.w * x2;
      const wy = rotation.w * y2;
      const wz = rotation.w * z2;

      const sx = scale.x;
      const sy = scale.y;
      const sz = scale.z;

      // Column 0
      matrixBuffer[offset + 0] = (1 - (yy + zz)) * sx;
      matrixBuffer[offset + 1] = (xy + wz) * sx;
      matrixBuffer[offset + 2] = (xz - wy) * sx;
      matrixBuffer[offset + 3] = 0;

      // Column 1
      matrixBuffer[offset + 4] = (xy - wz) * sy;
      matrixBuffer[offset + 5] = (1 - (xx + zz)) * sy;
      matrixBuffer[offset + 6] = (yz + wx) * sy;
      matrixBuffer[offset + 7] = 0;

      // Column 2
      matrixBuffer[offset + 8] = (xz + wy) * sz;
      matrixBuffer[offset + 9] = (yz - wx) * sz;
      matrixBuffer[offset + 10] = (1 - (xx + yy)) * sz;
      matrixBuffer[offset + 11] = 0;

      // Column 3 (Translation)
      matrixBuffer[offset + 12] = position.x;
      matrixBuffer[offset + 13] = position.y;
      matrixBuffer[offset + 14] = position.z;
      matrixBuffer[offset + 15] = 1;
    }

    batches.set(category, matrixBuffer);
  }

  return batches;
}
