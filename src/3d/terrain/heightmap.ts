import type { Vector3 } from "../physics/types.js";
/**
 * AF Motion — 3D Terrain Heightmap & Geometry Generator
 *
 * Generates discrete 2D heightfield elevation grids, macro terrain presets,
 * multi-layer noise blending, analytical surface normals, and indexed mesh buffers.
 */

import type {
  TerrainConfig,
  HeightmapData,
  TerrainMeshBuffers,
  TerrainPreset,
  NoiseLayerConfig,
} from "./types.js";
import { createTerrainNoise } from "./noise.js";
import { hashSeed } from "../../graphics/textures/prng.js";

/**
 * Returns default noise layers for a chosen terrain macro preset.
 */
export function getPresetNoiseLayers(preset: TerrainPreset, seed: number | string = 1337): NoiseLayerConfig[] {
  switch (preset) {
    case "flat":
      return [
        { type: "perlin", frequency: 0.01, amplitude: 0.5, seed },
      ];

    case "rolling-hills":
      return [
        { type: "fbm", octaves: 4, frequency: 0.004, amplitude: 25.0, persistence: 0.45, seed },
        { type: "perlin", frequency: 0.02, amplitude: 3.0, seed: `${seed}_micro` },
      ];

    case "mountain-ranges":
      return [
        { type: "ridged", octaves: 6, frequency: 0.005, amplitude: 80.0, lacunarity: 2.1, seed },
        { type: "fbm", octaves: 4, frequency: 0.01, amplitude: 15.0, seed: `${seed}_detail` },
      ];

    case "valleys":
      return [
        { type: "ridged", octaves: 5, frequency: 0.004, amplitude: 50.0, offset: 20.0, seed },
        { type: "domain-warp", octaves: 4, frequency: 0.006, amplitude: 30.0, seed: `${seed}_warp` },
      ];

    case "plateaus":
      return [
        { type: "cellular", frequency: 0.008, amplitude: 45.0, exponent: 0.5, seed },
        { type: "fbm", octaves: 3, frequency: 0.015, amplitude: 5.0, seed: `${seed}_rough` },
      ];

    case "canyons":
      return [
        { type: "domain-warp", octaves: 5, frequency: 0.005, amplitude: 60.0, warpStrength: 6.0, seed },
        { type: "ridged", octaves: 4, frequency: 0.01, amplitude: 25.0, seed: `${seed}_cuts` },
      ];

    case "islands":
    case "archipelagos":
      return [
        { type: "fbm", octaves: 5, frequency: 0.006, amplitude: 45.0, seed },
        { type: "perlin", frequency: 0.02, amplitude: 6.0, seed: `${seed}_surf` },
      ];

    case "craters":
      return [
        { type: "cellular", frequency: 0.007, amplitude: 35.0, cellularJitter: 0.8, seed },
        { type: "fbm", octaves: 3, frequency: 0.02, amplitude: 4.0, seed: `${seed}_ejecta` },
      ];

    case "custom":
    default:
      return [
        { type: "fbm", octaves: 5, frequency: 0.005, amplitude: 35.0, seed },
      ];
  }
}

/**
 * Generates heightfield elevation grid data deterministically from configurations.
 */
export function generateTerrainHeightmap(config: TerrainConfig = {}): HeightmapData {
  const width = Math.max(1, config.width ?? 200);
  const length = Math.max(1, config.length ?? 200);
  const cols = Math.max(2, config.resolutionX ?? 128);
  const rows = Math.max(2, config.resolutionZ ?? 128);
  const seed = config.seed ?? 1337;
  const preset: TerrainPreset = config.preset ?? "rolling-hills";

  const stepX = width / (cols - 1);
  const stepZ = length / (rows - 1);

  const halfW = width * 0.5;
  const halfL = length * 0.5;
  const maxR = Math.hypot(halfW, halfL);

  const layersConfig = config.noiseLayers && config.noiseLayers.length > 0
    ? config.noiseLayers
    : getPresetNoiseLayers(preset, seed);

  // Instantiate noise evaluators
  const evaluators = layersConfig.map((layer) => ({
    eval: createTerrainNoise({ ...layer, seed: layer.seed ?? seed }),
    blendMode: layer.blendMode ?? "add",
    weight: layer.weight ?? 1.0,
  }));

  const totalPoints = cols * rows;
  const heights = new Float32Array(totalPoints);

  let minH = Infinity;
  let maxH = -Infinity;

  for (let r = 0; r < rows; r++) {
    const worldZ = -halfL + r * stepZ;
    for (let c = 0; c < cols; c++) {
      const worldX = -halfW + c * stepX;
      const idx = r * cols + c;

      let h = 0;
      for (let l = 0; l < evaluators.length; l++) {
        const { eval: noiseEval, blendMode, weight } = evaluators[l];
        const sampleVal = noiseEval.sample(worldX, worldZ) * weight;

        if (l === 0) {
          h = sampleVal;
        } else {
          switch (blendMode) {
            case "add":
              h += sampleVal;
              break;
            case "multiply":
              h *= (sampleVal * 0.1);
              break;
            case "max":
              h = Math.max(h, sampleVal);
              break;
            case "min":
              h = Math.min(h, sampleVal);
              break;
            case "lerp":
              h = h + (sampleVal - h) * Math.min(1, Math.max(0, weight));
              break;
          }
        }
      }

      // Macro Preset Shaping Modifiers
      if (preset === "islands") {
        // Radial falloff: heights drop off towards borders
        const distFromCenter = Math.hypot(worldX, worldZ);
        const factor = Math.max(0, 1.0 - Math.pow(distFromCenter / (halfW * 0.85), 2));
        h = (h + 10) * factor - (1 - factor) * 15;
      } else if (preset === "plateaus") {
        // Terrace quantization
        const terraceStep = 12.0;
        h = Math.floor(h / terraceStep) * terraceStep + Math.min(terraceStep, (h % terraceStep) * 0.2);
      } else if (preset === "craters") {
        // Invert center with circular rim
        const dist = Math.hypot(worldX, worldZ);
        const rimRadius = halfW * 0.4;
        const rimDist = Math.abs(dist - rimRadius);
        const rimHeight = Math.exp(-(rimDist * rimDist) / (halfW * 2)) * 30.0;
        const bowl = dist < rimRadius ? -Math.cos((dist / rimRadius) * Math.PI * 0.5) * 20.0 : 0;
        h += rimHeight + bowl;
      }

      heights[idx] = h;
      if (h < minH) minH = h;
      if (h > maxH) maxH = h;
    }
  }

  return {
    width,
    length,
    cols,
    rows,
    heights,
    minHeight: minH,
    maxHeight: maxH,
    stepX,
    stepZ,
  };
}

/**
 * Builds standard 3D indexed vertex buffers (positions, normals, UVs, indices) from a heightmap.
 */
export function buildTerrainMeshBuffers(heightmap: HeightmapData): TerrainMeshBuffers {
  const { cols, rows, width, length, heights, stepX, stepZ } = heightmap;
  const numVertices = cols * rows;

  const positions = new Float32Array(numVertices * 3);
  const normals = new Float32Array(numVertices * 3);
  const uvs = new Float32Array(numVertices * 2);

  const halfW = width * 0.5;
  const halfL = length * 0.5;

  // 1. Positions and UVs
  for (let r = 0; r < rows; r++) {
    const z = -halfL + r * stepZ;
    const v = r / (rows - 1);
    for (let c = 0; c < cols; c++) {
      const x = -halfW + c * stepX;
      const u = c / (cols - 1);
      const idx = r * cols + c;
      const idx3 = idx * 3;
      const idx2 = idx * 2;

      positions[idx3] = x;
      positions[idx3 + 1] = heights[idx];
      positions[idx3 + 2] = z;

      uvs[idx2] = u;
      uvs[idx2 + 1] = v;
    }
  }

  // 2. Central Differences Surface Normals
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const idx3 = idx * 3;

      const left = c > 0 ? heights[idx - 1] : heights[idx];
      const right = c < cols - 1 ? heights[idx + 1] : heights[idx];
      const down = r > 0 ? heights[idx - cols] : heights[idx];
      const up = r < rows - 1 ? heights[idx + cols] : heights[idx];

      const dx = (right - left) / (c > 0 && c < cols - 1 ? 2 * stepX : stepX);
      const dz = (up - down) / (r > 0 && r < rows - 1 ? 2 * stepZ : stepZ);

      // Normal is cross product of tangent and bitangent: (-dx, 1, -dz)
      const nx = -dx;
      const ny = 1.0;
      const nz = -dz;
      const len = Math.hypot(nx, ny, nz);
      const invLen = len > 0 ? 1 / len : 1;

      normals[idx3] = nx * invLen;
      normals[idx3 + 1] = ny * invLen;
      normals[idx3 + 2] = nz * invLen;
    }
  }

  // 3. Triangle Indices
  const numQuads = (cols - 1) * (rows - 1);
  const indices = new Uint32Array(numQuads * 6);
  let tri = 0;

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i0 = r * cols + c;
      const i1 = i0 + 1;
      const i2 = (r + 1) * cols + c;
      const i3 = i2 + 1;

      // Triangle 1: i0 -> i2 -> i1
      indices[tri++] = i0;
      indices[tri++] = i2;
      indices[tri++] = i1;

      // Triangle 2: i1 -> i2 -> i3
      indices[tri++] = i1;
      indices[tri++] = i2;
      indices[tri++] = i3;
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
 * Samples terrain elevation and normal at an arbitrary world position using bilinear interpolation.
 */
export function sampleTerrainHeightAndNormal(
  heightmap: HeightmapData,
  worldX: number,
  worldZ: number
): { height: number; normal: Vector3 } {
  const { width, length, cols, rows, heights, stepX, stepZ } = heightmap;
  const halfW = width * 0.5;
  const halfL = length * 0.5;

  const u = Math.max(0, Math.min(1, (worldX + halfW) / width));
  const v = Math.max(0, Math.min(1, (worldZ + halfL) / length));

  const fx = u * (cols - 1);
  const fz = v * (rows - 1);

  const c0 = Math.min(cols - 1, Math.floor(fx));
  const c1 = Math.min(cols - 1, c0 + 1);
  const r0 = Math.min(rows - 1, Math.floor(fz));
  const r1 = Math.min(rows - 1, r0 + 1);

  const tx = fx - c0;
  const tz = fz - r0;

  const h00 = heights[r0 * cols + c0];
  const h10 = heights[r0 * cols + c1];
  const h01 = heights[r1 * cols + c0];
  const h11 = heights[r1 * cols + c1];

  const hTop = h00 * (1 - tx) + h10 * tx;
  const hBottom = h01 * (1 - tx) + h11 * tx;
  const height = hTop * (1 - tz) + hBottom * tz;

  const leftH = c0 > 0 ? heights[r0 * cols + (c0 - 1)] : h00;
  const rightH = c1 < cols - 1 ? heights[r0 * cols + (c1 + 1)] : h10;
  const topH = r0 > 0 ? heights[(r0 - 1) * cols + c0] : h00;
  const bottomH = r1 < rows - 1 ? heights[(r1 + 1) * cols + c0] : h01;

  const nx = (leftH - rightH) / (2 * stepX);
  const ny = 1.0;
  const nz = (topH - bottomH) / (2 * stepZ);
  const len = Math.hypot(nx, ny, nz);

  return {
    height,
    normal: { x: nx / len, y: ny / len, z: nz / len },
  };
}
