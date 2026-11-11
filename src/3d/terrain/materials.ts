/**
 * AF Motion — 3D Terrain Material & Splat Generator
 *
 * Synthesizes multi-biome material blending, slope-aware rock cliffs,
 * elevation-based snow/sand transitions, and RGBA vertex color buffers.
 */

import type { HeightmapData, BiomeWeightMap, BiomeRule } from "./types.js";
import { DEFAULT_BIOME_RULES } from "./biomes.js";

export interface TerrainMaterialBuffers {
  /** RGBA vertex colors for multi-biome visual rendering [r0, g0, b0, a0, ...]. */
  colors: Float32Array;
  /** Primary 4-layer splat weights for shader texture blending [w0, w1, w2, w3, ...]. */
  splatWeights: Float32Array;
  /** Surface roughness array per vertex. */
  roughness: Float32Array;
}

/**
 * Generates vertex colors and material splat weights based on biome classification
 * and slope blending.
 */
export function generateTerrainMaterials(
  heightmap: HeightmapData,
  biomes: BiomeWeightMap,
  customRules?: BiomeRule[]
): TerrainMaterialBuffers {
  const rules = customRules && customRules.length > 0 ? customRules : DEFAULT_BIOME_RULES;
  const { cols, rows } = heightmap;
  const vertexCount = cols * rows;
  const biomeCount = rules.length;

  const colors = new Float32Array(vertexCount * 4);
  const splatWeights = new Float32Array(vertexCount * 4);
  const roughness = new Float32Array(vertexCount);

  // Map rule colors
  const biomeColors = rules.map((r) => r.color ?? [0.5, 0.5, 0.5]);
  const biomeRoughness = rules.map((r) => r.roughness ?? 0.8);

  for (let i = 0; i < vertexCount; i++) {
    const weightOffset = i * biomeCount;
    let r = 0;
    let g = 0;
    let b = 0;
    let rough = 0;

    for (let j = 0; j < biomeCount; j++) {
      const w = biomes.weights[weightOffset + j];
      if (w > 0.001) {
        const c = biomeColors[j];
        r += c[0] * w;
        g += c[1] * w;
        b += c[2] * w;
        rough += biomeRoughness[j] * w;
      }
    }

    const colorIdx = i * 4;
    colors[colorIdx] = Math.max(0, Math.min(1, r));
    colors[colorIdx + 1] = Math.max(0, Math.min(1, g));
    colors[colorIdx + 2] = Math.max(0, Math.min(1, b));
    colors[colorIdx + 3] = 1.0;

    // Splat weights for top 4 biomes
    for (let k = 0; k < 4; k++) {
      splatWeights[colorIdx + k] = k < biomeCount ? biomes.weights[weightOffset + k] : 0;
    }

    roughness[i] = Math.max(0.1, Math.min(1.0, rough));
  }

  return {
    colors,
    splatWeights,
    roughness,
  };
}
