/**
 * AF Motion — 3D Terrain Hydraulic & Thermal Erosion Engine
 *
 * Implements physical droplet hydraulic erosion (transport, erosion, deposition, evaporation)
 * and talus-angle thermal scree slope stabilization with sediment conservation.
 */

import type { HeightmapData, HydraulicErosionConfig, ThermalErosionConfig } from "./types.js";
import { createPRNG } from "../../graphics/textures/prng.js";

/**
 * Applies physical particle-based hydraulic erosion to a heightmap in-place.
 */
export function applyHydraulicErosion(
  heightmap: HeightmapData,
  config: HydraulicErosionConfig = {}
): HeightmapData {
  const { cols, rows, heights, stepX, stepZ } = heightmap;

  const dropletCount = Math.max(1, config.dropletCount ?? 20000);
  const maxLifetime = Math.max(5, config.maxLifetime ?? 30);
  const erosionSpeed = config.erosionSpeed ?? 0.3;
  const depositionSpeed = config.depositionSpeed ?? 0.3;
  const evaporationRate = config.evaporationRate ?? 0.01;
  const minSlope = config.minSlope ?? 0.01;
  const capacityCoeff = config.sedimentCapacity ?? 4.0;
  const inertia = config.inertia ?? 0.05;
  const gravity = 9.81;

  const prng = createPRNG(config.seed ?? 1337);

  // Helper for bilinear height and gradient sampling
  function sampleHeightAndGradient(x: number, z: number): { height: number; gradX: number; gradZ: number } {
    const coordX = Math.floor(x);
    const coordZ = Math.floor(z);

    const cx = Math.max(0, Math.min(cols - 2, coordX));
    const cz = Math.max(0, Math.min(rows - 2, coordZ));

    const fx = x - cx;
    const fz = z - cz;

    const h00 = heights[cz * cols + cx];
    const h10 = heights[cz * cols + cx + 1];
    const h01 = heights[(cz + 1) * cols + cx];
    const h11 = heights[(cz + 1) * cols + cx + 1];

    const gradX = (h10 - h00) * (1 - fz) + (h11 - h01) * fz;
    const gradZ = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;

    const height = h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz;

    return { height, gradX, gradZ };
  }

  function depositSediment(x: number, z: number, amount: number): void {
    const cx = Math.max(0, Math.min(cols - 2, Math.floor(x)));
    const cz = Math.max(0, Math.min(rows - 2, Math.floor(z)));

    const fx = x - cx;
    const fz = z - cz;

    heights[cz * cols + cx] += amount * (1 - fx) * (1 - fz);
    heights[cz * cols + cx + 1] += amount * fx * (1 - fz);
    heights[(cz + 1) * cols + cx] += amount * (1 - fx) * fz;
    heights[(cz + 1) * cols + cx + 1] += amount * fx * fz;
  }

  function erodeTerrain(x: number, z: number, amount: number): void {
    const cx = Math.max(0, Math.min(cols - 2, Math.floor(x)));
    const cz = Math.max(0, Math.min(rows - 2, Math.floor(z)));

    const fx = x - cx;
    const fz = z - cz;

    heights[cz * cols + cx] -= amount * (1 - fx) * (1 - fz);
    heights[cz * cols + cx + 1] -= amount * fx * (1 - fz);
    heights[(cz + 1) * cols + cx] -= amount * (1 - fx) * fz;
    heights[(cz + 1) * cols + cx + 1] -= amount * fx * fz;
  }

  // Droplet iterations
  for (let d = 0; d < dropletCount; d++) {
    let posX = prng.range(1, cols - 2);
    let posZ = prng.range(1, rows - 2);
    let dirX = 0;
    let dirZ = 0;
    let speed = config.initialSpeed ?? 1.0;
    let water = config.initialWater ?? 1.0;
    let sediment = 0;

    for (let step = 0; step < maxLifetime; step++) {
      const { height, gradX, gradZ } = sampleHeightAndGradient(posX, posZ);

      // Update flow direction via inertia and terrain gradient
      dirX = dirX * inertia - gradX * (1 - inertia);
      dirZ = dirZ * inertia - gradZ * (1 - inertia);

      const dirLen = Math.hypot(dirX, dirZ);
      if (dirLen === 0) break;

      dirX /= dirLen;
      dirZ /= dirLen;

      const newPosX = posX + dirX;
      const newPosZ = posZ + dirZ;

      // Stop if droplet flows off grid bounds
      if (newPosX < 0 || newPosX >= cols - 1 || newPosZ < 0 || newPosZ >= rows - 1) {
        // Deposit remaining sediment before exiting to maintain mass conservation
        depositSediment(posX, posZ, sediment);
        break;
      }

      const { height: newHeight } = sampleHeightAndGradient(newPosX, newPosZ);
      const deltaH = newHeight - height;

      // Sediment capacity proportional to slope, speed, and water volume
      const slope = Math.max(minSlope, -deltaH);
      const capacity = Math.max(0, slope * speed * water * capacityCoeff);

      if (sediment > capacity || deltaH > 0) {
        // Deposit sediment
        const toDeposit = deltaH > 0
          ? Math.min(sediment, deltaH)
          : (sediment - capacity) * depositionSpeed;

        sediment -= toDeposit;
        depositSediment(posX, posZ, toDeposit);
      } else {
        // Erode terrain
        const toErode = Math.min((capacity - sediment) * erosionSpeed, -deltaH);
        sediment += toErode;
        erodeTerrain(posX, posZ, toErode);
      }

      speed = Math.sqrt(Math.max(0, speed * speed + deltaH * gravity));
      water *= (1 - evaporationRate);

      posX = newPosX;
      posZ = newPosZ;

      if (water <= 0.001) {
        depositSediment(posX, posZ, sediment);
        break;
      }
    }
  }

  // Update min/max elevation bounds
  let minH = Infinity, maxH = -Infinity;
  for (let i = 0; i < heights.length; i++) {
    if (heights[i] < minH) minH = heights[i];
    if (heights[i] > maxH) maxH = heights[i];
  }
  heightmap.minHeight = minH;
  heightmap.maxHeight = maxH;

  return heightmap;
}

/**
 * Applies physical thermal erosion to stabilize scree and cliffs exceeding the talus angle.
 */
export function applyThermalErosion(
  heightmap: HeightmapData,
  config: ThermalErosionConfig = {}
): HeightmapData {
  const { cols, rows, heights, stepX, stepZ } = heightmap;
  const iterations = Math.max(1, config.iterations ?? 5);
  const talusDegrees = config.talusAngleDegrees ?? 35;
  const talusThreshold = Math.tan((talusDegrees * Math.PI) / 180) * Math.min(stepX, stepZ);
  const displacementRate = Math.max(0, Math.min(1, config.displacementRate ?? 0.5));

  for (let iter = 0; iter < iterations; iter++) {
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const idx = r * cols + c;
        const h = heights[idx];

        // 4 orthogonal neighbors
        const nIdx = [
          idx - 1, // left
          idx + 1, // right
          idx - cols, // down
          idx + cols, // up
        ];

        let maxDiff = 0;
        let lowestIdx = idx;

        for (let i = 0; i < 4; i++) {
          const neighborH = heights[nIdx[i]];
          const diff = h - neighborH;
          if (diff > maxDiff) {
            maxDiff = diff;
            lowestIdx = nIdx[i];
          }
        }

        if (maxDiff > talusThreshold) {
          const excess = (maxDiff - talusThreshold) * displacementRate * 0.5;
          heights[idx] -= excess;
          heights[lowestIdx] += excess;
        }
      }
    }
  }

  // Update min/max elevation bounds
  let minH = Infinity, maxH = -Infinity;
  for (let i = 0; i < heights.length; i++) {
    if (heights[i] < minH) minH = heights[i];
    if (heights[i] > maxH) maxH = heights[i];
  }
  heightmap.minHeight = minH;
  heightmap.maxHeight = maxH;

  return heightmap;
}
