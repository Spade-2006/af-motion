/**
 * AF Motion — 3D Terrain Biome Classification
 *
 * Deterministic multi-factor biome classification system evaluating elevation,
 * slope gradient, temperature, and moisture to synthesize realistic ecological zones.
 */

import type { HeightmapData, BiomeRule, BiomeType, BiomeWeightMap } from "./types.js";
import { createTerrainNoise } from "./noise.js";

// ============================================================================
// Default Ecological Biomes
// ============================================================================

export const DEFAULT_BIOME_RULES: BiomeRule[] = [
  {
    name: "snow",
    elevationRange: [0.82, 1.0],
    temperatureRange: [0.0, 0.25],
    moistureRange: [0.0, 1.0],
    color: [0.95, 0.96, 0.98],
    roughness: 0.6,
    metalness: 0.0,
  },
  {
    name: "alpine",
    elevationRange: [0.68, 0.88],
    temperatureRange: [0.1, 0.45],
    color: [0.58, 0.55, 0.52],
    roughness: 0.85,
    metalness: 0.05,
  },
  {
    name: "rocky",
    slopeRangeDegrees: [32, 90],
    color: [0.48, 0.46, 0.43],
    roughness: 0.9,
    metalness: 0.05,
  },
  {
    name: "tundra",
    elevationRange: [0.55, 0.75],
    temperatureRange: [0.0, 0.35],
    moistureRange: [0.0, 0.5],
    color: [0.55, 0.6, 0.48],
    roughness: 0.8,
  },
  {
    name: "forest",
    elevationRange: [0.15, 0.65],
    temperatureRange: [0.3, 0.75],
    moistureRange: [0.45, 1.0],
    color: [0.18, 0.45, 0.15],
    roughness: 0.75,
  },
  {
    name: "grassland",
    elevationRange: [0.1, 0.6],
    temperatureRange: [0.3, 0.75],
    moistureRange: [0.2, 0.6],
    color: [0.38, 0.65, 0.25],
    roughness: 0.7,
  },
  {
    name: "tropical",
    elevationRange: [0.0, 0.4],
    temperatureRange: [0.7, 1.0],
    moistureRange: [0.65, 1.0],
    color: [0.12, 0.56, 0.22],
    roughness: 0.7,
  },
  {
    name: "wetlands",
    elevationRange: [0.0, 0.22],
    slopeRangeDegrees: [0, 8],
    moistureRange: [0.75, 1.0],
    temperatureRange: [0.35, 0.8],
    color: [0.22, 0.48, 0.35],
    roughness: 0.5,
  },
  {
    name: "desert",
    elevationRange: [0.0, 0.5],
    temperatureRange: [0.6, 1.0],
    moistureRange: [0.0, 0.28],
    color: [0.86, 0.78, 0.52],
    roughness: 0.85,
  },
];

export interface BiomeClassificationOptions {
  seed?: number | string;
  moistureNoise?: (x: number, z: number) => number;
  temperatureNoise?: (x: number, z: number) => number;
}

/**
 * Computes range affinity score [0, 1] with trapezoidal smooth falloff.
 */
function computeRangeAffinity(val: number, range?: [number, number], margin = 0.05): number {
  if (!range) return 1.0;
  const [min, max] = range;
  if (val >= min && val <= max) return 1.0;
  if (val < min) {
    const dist = min - val;
    return dist >= margin ? 0.0 : 1.0 - dist / margin;
  } else {
    const dist = val - max;
    return dist >= margin ? 0.0 : 1.0 - dist / margin;
  }
}

/**
 * Classifies terrain biomes across the grid, synthesizing elevation, slope,
 * temperature, and moisture into per-vertex blend weights and dominant biome labels.
 */
export function classifyTerrainBiomes(
  heightmap: HeightmapData,
  customRules?: BiomeRule[],
  options?: BiomeClassificationOptions
): BiomeWeightMap {
  const rules = customRules && customRules.length > 0 ? customRules : DEFAULT_BIOME_RULES;
  const { cols, rows, heights, stepX, stepZ, minHeight, maxHeight } = heightmap;
  const vertexCount = cols * rows;
  const biomeCount = rules.length;
  const biomeNames = rules.map((r) => r.name);

  const dominantBiome: BiomeType[] = new Array(vertexCount);
  const weights = new Float32Array(vertexCount * biomeCount);

  // Default environmental noise generators if none provided
  const seed = options?.seed ?? 1337;
  const defaultMoistureNoise = options?.moistureNoise ?? createTerrainNoise({
    type: "simplex",
    frequency: 0.003,
    octaves: 3,
    seed: `${seed}-moisture`,
  });

  const defaultTempNoise = options?.temperatureNoise ?? createTerrainNoise({
    type: "perlin",
    frequency: 0.002,
    octaves: 3,
    seed: `${seed}-temp`,
  });

  const heightSpan = maxHeight - minHeight > 1e-4 ? maxHeight - minHeight : 1.0;
  const invCols = 1 / Math.max(1, cols - 1);
  const invRows = 1 / Math.max(1, rows - 1);

  for (let r = 0; r < rows; r++) {
    const worldZ = (r * invRows - 0.5) * heightmap.length;
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const h = heights[idx];
      const worldX = (c * invCols - 0.5) * heightmap.width;

      // 1. Normalized Elevation [0, 1]
      const normH = Math.max(0, Math.min(1, (h - minHeight) / heightSpan));

      // 2. Slope in degrees calculated from central differences
      const leftH = c > 0 ? heights[idx - 1] : h;
      const rightH = c < cols - 1 ? heights[idx + 1] : h;
      const topH = r > 0 ? heights[idx - cols] : h;
      const bottomH = r < rows - 1 ? heights[idx + cols] : h;

      const dhX = (rightH - leftH) / (2 * stepX);
      const dhZ = (bottomH - topH) / (2 * stepZ);
      const slopeRad = Math.atan(Math.sqrt(dhX * dhX + dhZ * dhZ));
      const slopeDeg = slopeRad * (180 / Math.PI);

      // 3. Environmental temperature: macro noise - elevation lapse rate (altitude decreases temp)
      const rawTemp = (typeof defaultTempNoise === "function" ? defaultTempNoise(worldX, worldZ) : defaultTempNoise.sample(worldX, worldZ)) * 0.5 + 0.5;
      const temp = Math.max(0, Math.min(1, rawTemp - normH * 0.55 + 0.2));

      // 4. Moisture: macro noise with slight valley condensation
      const rawMoisture = (typeof defaultMoistureNoise === "function" ? defaultMoistureNoise(worldX, worldZ) : defaultMoistureNoise.sample(worldX, worldZ)) * 0.5 + 0.5;
      const moisture = Math.max(0, Math.min(1, rawMoisture + (1.0 - normH) * 0.2));

      // 5. Evaluate affinity score for each biome rule
      let totalAffinity = 0.0;
      let maxAffinity = -1.0;
      let dominantIndex = 0;

      const vertexOffset = idx * biomeCount;

      for (let b = 0; b < biomeCount; b++) {
        const rule = rules[b];
        const elevAff = computeRangeAffinity(normH, rule.elevationRange, 0.08);
        const slopeAff = computeRangeAffinity(slopeDeg, rule.slopeRangeDegrees, 4.0);
        const tempAff = computeRangeAffinity(temp, rule.temperatureRange, 0.08);
        const moistAff = computeRangeAffinity(moisture, rule.moistureRange, 0.08);

        // Product affinity combines all factor constraints
        const affinity = elevAff * slopeAff * tempAff * moistAff;
        weights[vertexOffset + b] = affinity;
        totalAffinity += affinity;

        if (affinity > maxAffinity) {
          maxAffinity = affinity;
          dominantIndex = b;
        }
      }

      // 6. Normalize weights across all biomes
      if (totalAffinity > 1e-5) {
        const invTotal = 1.0 / totalAffinity;
        for (let b = 0; b < biomeCount; b++) {
          weights[vertexOffset + b] *= invTotal;
        }
      } else {
        // Fallback to dominant biome with 100% weight
        weights[vertexOffset + dominantIndex] = 1.0;
      }

      dominantBiome[idx] = rules[dominantIndex].name;
    }
  }

  return {
    dominantBiome,
    weights,
    biomeNames,
  };
}
