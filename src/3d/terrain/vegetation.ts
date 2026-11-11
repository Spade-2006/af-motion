/**
 * AF Motion — 3D Terrain Vegetation & Prop Scattering
 *
 * Deterministic spatial distribution of vegetation, trees, rocks, bushes,
 * and environmental props using stratified jittered sampling, biome filtering,
 * slope constraints, and surface normal alignment.
 */

import type {
  HeightmapData,
  BiomeWeightMap,
  VegetationScatterRule,
  VegetationInstance,
  BiomeType,
} from "./types.js";
import { createPRNG } from "../../graphics/textures/prng.js";
import { sampleTerrainHeightAndNormal } from "./heightmap.js";

// ============================================================================
// Default Vegetation Rules
// ============================================================================

export const DEFAULT_VEGETATION_RULES: VegetationScatterRule[] = [
  {
    id: "pine-tree",
    category: "trees",
    density: 8,
    minSpacing: 3.5,
    allowedBiomes: ["forest", "alpine", "tundra"],
    slopeRangeDegrees: [0, 30],
    scaleRange: [0.8, 1.4],
    alignToNormal: false,
  },
  {
    id: "deciduous-tree",
    category: "trees",
    density: 6,
    minSpacing: 4.0,
    allowedBiomes: ["forest", "grassland"],
    slopeRangeDegrees: [0, 25],
    scaleRange: [0.9, 1.3],
    alignToNormal: false,
  },
  {
    id: "wild-grass",
    category: "grass",
    density: 25,
    minSpacing: 1.0,
    allowedBiomes: ["grassland", "forest", "wetlands"],
    slopeRangeDegrees: [0, 35],
    scaleRange: [0.6, 1.2],
    alignToNormal: true,
  },
  {
    id: "boulder-rock",
    category: "rocks",
    density: 5,
    minSpacing: 4.5,
    allowedBiomes: ["rocky", "alpine", "desert", "tundra"],
    slopeRangeDegrees: [5, 55],
    scaleRange: [0.5, 1.8],
    alignToNormal: true,
  },
  {
    id: "desert-shrub",
    category: "bushes",
    density: 4,
    minSpacing: 3.0,
    allowedBiomes: ["desert"],
    slopeRangeDegrees: [0, 30],
    scaleRange: [0.7, 1.1],
    alignToNormal: false,
  },
];

/**
 * Creates a rotation quaternion aligning vector (0, 1, 0) with target normal
 * and applying a yaw angle.
 */
function computeOrientation(normal: { x: number; y: number; z: number }, yaw: number, alignToNormal: boolean) {
  const halfYaw = yaw * 0.5;
  const qYaw = {
    x: 0,
    y: Math.sin(halfYaw),
    z: 0,
    w: Math.cos(halfYaw),
  };

  if (!alignToNormal) {
    return qYaw;
  }

  // Quaternion from (0, 1, 0) to normal
  const up = { x: 0, y: 1, z: 0 };
  const dot = up.x * normal.x + up.y * normal.y + up.z * normal.z;

  if (dot > 0.9999) {
    return qYaw;
  }
  if (dot < -0.9999) {
    return { x: 1, y: 0, z: 0, w: 0 };
  }

  const crossX = up.y * normal.z - up.z * normal.y;
  const crossY = up.z * normal.x - up.x * normal.z;
  const crossZ = up.x * normal.y - up.y * normal.x;
  const w = 1 + dot;
  const len = Math.hypot(crossX, crossY, crossZ, w);

  const qAlign = {
    x: crossX / len,
    y: crossY / len,
    z: crossZ / len,
    w: w / len,
  };

  // Multiply qAlign * qYaw
  return {
    x: qAlign.w * qYaw.x + qAlign.x * qYaw.w + qAlign.y * qYaw.z - qAlign.z * qYaw.y,
    y: qAlign.w * qYaw.y - qAlign.x * qYaw.z + qAlign.y * qYaw.w + qAlign.z * qYaw.x,
    z: qAlign.w * qYaw.z + qAlign.x * qYaw.y - qAlign.y * qYaw.x + qAlign.z * qYaw.w,
    w: qAlign.w * qYaw.w - qAlign.x * qYaw.x - qAlign.y * qYaw.y - qAlign.z * qYaw.z,
  };
}

/**
 * Scatters vegetation instances across the terrain matching biome, slope,
 * elevation rules, and minimum proximity constraints.
 */
export function scatterTerrainVegetation(
  heightmap: HeightmapData,
  biomes: BiomeWeightMap,
  rules?: VegetationScatterRule[],
  seed: number | string = 1337
): VegetationInstance[] {
  const activeRules = rules && rules.length > 0 ? rules : DEFAULT_VEGETATION_RULES;
  const rng = createPRNG(seed);
  const instances: VegetationInstance[] = [];

  const { width, length, cols, rows } = heightmap;
  const area = width * length; // in square world units

  // 2D Spatial Grid to enforce minimum distance spacing
  const cellSize = 5.0;
  const gridDimX = Math.ceil(width / cellSize);
  const gridDimZ = Math.ceil(length / cellSize);
  const spatialGrid: Map<number, VegetationInstance[]> = new Map();

  const getCellKey = (x: number, z: number): number => {
    const cx = Math.max(0, Math.min(gridDimX - 1, Math.floor((x + width * 0.5) / cellSize)));
    const cz = Math.max(0, Math.min(gridDimZ - 1, Math.floor((z + length * 0.5) / cellSize)));
    return cz * gridDimX + cx;
  };

  const isTooClose = (x: number, z: number, minDist: number): boolean => {
    const minDistSq = minDist * minDist;
    const cx = Math.floor((x + width * 0.5) / cellSize);
    const cz = Math.floor((z + length * 0.5) / cellSize);

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = (cz + dz) * gridDimX + (cx + dx);
        const cellItems = spatialGrid.get(key);
        if (cellItems) {
          for (let i = 0; i < cellItems.length; i++) {
            const item = cellItems[i];
            const distSq = (item.position.x - x) ** 2 + (item.position.z - z) ** 2;
            if (distSq < minDistSq) return true;
          }
        }
      }
    }
    return false;
  };

  for (const rule of activeRules) {
    const density = rule.density ?? 5; // count per 100 sq meters
    const totalCount = Math.floor((density * area) / 100);
    const minSpacing = rule.minSpacing ?? 2.0;
    const [minScale, maxScale] = rule.scaleRange ?? [0.8, 1.2];

    for (let i = 0; i < totalCount; i++) {
      // Stratified random point
      const worldX = (rng.next() - 0.5) * width;
      const worldZ = (rng.next() - 0.5) * length;

      // Sample terrain surface
      const surface = sampleTerrainHeightAndNormal(heightmap, worldX, worldZ);
      const elevation = surface.height;
      const normal = surface.normal;

      // Check elevation range
      if (rule.elevationRange) {
        if (elevation < rule.elevationRange[0] || elevation > rule.elevationRange[1]) {
          continue;
        }
      }

      // Check slope range
      const slopeRad = Math.acos(Math.max(-1, Math.min(1, normal.y)));
      const slopeDeg = slopeRad * (180 / Math.PI);
      if (rule.slopeRangeDegrees) {
        if (slopeDeg < rule.slopeRangeDegrees[0] || slopeDeg > rule.slopeRangeDegrees[1]) {
          continue;
        }
      }

      // Biome check: find dominant biome at nearest grid cell
      const u = Math.max(0, Math.min(1, (worldX + width * 0.5) / width));
      const v = Math.max(0, Math.min(1, (worldZ + length * 0.5) / length));
      const colIdx = Math.min(cols - 1, Math.floor(u * (cols - 1)));
      const rowIdx = Math.min(rows - 1, Math.floor(v * (rows - 1)));
      const currentBiome = biomes.dominantBiome[rowIdx * cols + colIdx];

      if (rule.allowedBiomes && rule.allowedBiomes.length > 0) {
        if (!rule.allowedBiomes.includes(currentBiome)) {
          continue;
        }
      }

      // Spacing collision check
      if (isTooClose(worldX, worldZ, minSpacing)) {
        continue;
      }

      // Orientation & Scale
      const yaw = rng.next() * Math.PI * 2;
      const rotation = computeOrientation(normal, yaw, !!rule.alignToNormal);
      const s = minScale + rng.next() * (maxScale - minScale);
      const scale = { x: s, y: s, z: s };

      const instance: VegetationInstance = {
        id: `${rule.id}-${instances.length}`,
        category: rule.category,
        position: { x: worldX, y: elevation, z: worldZ },
        rotation,
        scale,
        biome: currentBiome,
        normal,
      };

      instances.push(instance);

      const cellKey = getCellKey(worldX, worldZ);
      if (!spatialGrid.has(cellKey)) {
        spatialGrid.set(cellKey, []);
      }
      spatialGrid.get(cellKey)!.push(instance);
    }
  }

  return instances;
}
