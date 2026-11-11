/**
 * AF Motion — 3D Procedural Terrain Types & Architecture
 *
 * Strongly-typed data structures for procedural heightmaps, multi-octave noise,
 * hydraulic/thermal erosion, biomes, materials, vegetation scattering, LOD chunks,
 * and heightfield physics integration.
 */

import type { Vector3, AABB3D, Quaternion, Transform3D, Collider3D } from "../physics/types.js";

// ============================================================================
// Noise Types & Strategies
// ============================================================================

export type TerrainNoiseType =
  | "perlin"
  | "simplex"
  | "fbm"
  | "ridged"
  | "domain-warp"
  | "cellular"
  | "voronoi";

export type NoiseBlendMode = "add" | "multiply" | "max" | "min" | "lerp";

export interface NoiseLayerConfig {
  /** Noise algorithm. Default: "fbm". */
  type?: TerrainNoiseType;
  /** Octaves count for fractal noise. Default: 6. */
  octaves?: number;
  /** Base spatial frequency. Default: 0.005. */
  frequency?: number;
  /** Amplitude multiplier per octave (lacunarity persistence). Default: 0.5. */
  persistence?: number;
  /** Frequency multiplier per octave. Default: 2.0. */
  lacunarity?: number;
  /** Output height scale amplitude. Default: 50. */
  amplitude?: number;
  /** Seed value for deterministic procedural generation. */
  seed?: number | string;
  /** Domain warping distortion strength. Default: 0. */
  warpStrength?: number;
  /** Cellular noise jitter factor in [0, 1]. Default: 1.0. */
  cellularJitter?: number;
  /** Layer blending mode. Default: "add". */
  blendMode?: NoiseBlendMode;
  /** Layer blending weight in [0, 1]. Default: 1.0. */
  weight?: number;
  /** Vertical elevation offset. Default: 0. */
  offset?: number;
  /** Exponent curve applied to height output (e.g. 2.0 for mountain valleys). Default: 1.0. */
  exponent?: number;
}

// ============================================================================
// Terrain Presets
// ============================================================================

export type TerrainPreset =
  | "flat"
  | "rolling-hills"
  | "mountain-ranges"
  | "valleys"
  | "plateaus"
  | "canyons"
  | "islands"
  | "archipelagos"
  | "craters"
  | "custom";

// ============================================================================
// Heightmap & Terrain Geometry
// ============================================================================

export interface HeightmapData {
  /** Width dimension in world units (along X axis). */
  width: number;
  /** Length dimension in world units (along Z axis). */
  length: number;
  /** Number of discrete grid points along X (columns). */
  cols: number;
  /** Number of discrete grid points along Z (rows). */
  rows: number;
  /** Flat array of elevation values of size cols * rows. */
  heights: Float32Array;
  /** Minimum recorded elevation. */
  minHeight: number;
  /** Maximum recorded elevation. */
  maxHeight: number;
  /** Spacing between adjacent grid samples along X. */
  stepX: number;
  /** Spacing between adjacent grid samples along Z. */
  stepZ: number;
}

export interface TerrainMeshBuffers {
  /** Vertex positions [x0, y0, z0, x1, y1, z1, ...]. */
  positions: Float32Array;
  /** Vertex surface normals [nx0, ny0, nz0, ...]. */
  normals: Float32Array;
  /** Vertex UV texture coordinates [u0, v0, u1, v1, ...]. */
  uvs: Float32Array;
  /** Triangle indices for indexed drawing. */
  indices: Uint32Array;
  /** Optional RGBA vertex colors for multi-biome splat blending [r0, g0, b0, a0, ...]. */
  colors?: Float32Array;
}

// ============================================================================
// Erosion Configuration
// ============================================================================

export interface HydraulicErosionConfig {
  /** Number of simulated water droplets. Default: 50000. */
  dropletCount?: number;
  /** Maximum steps a droplet can survive. Default: 30. */
  maxLifetime?: number;
  /** Erosion rate coefficient. Default: 0.3. */
  erosionSpeed?: number;
  /** Deposition rate coefficient. Default: 0.3. */
  depositionSpeed?: number;
  /** Evaporation rate per step [0, 1]. Default: 0.01. */
  evaporationRate?: number;
  /** Minimum slope angle to prevent zero-capacity stalling. Default: 0.01. */
  minSlope?: number;
  /** Sediment capacity factor. Default: 4.0. */
  sedimentCapacity?: number;
  /** Inertia factor [0, 1] weighting direction continuity. Default: 0.05. */
  inertia?: number;
  /** Droplet initial water volume. Default: 1.0. */
  initialWater?: number;
  /** Droplet initial speed. Default: 1.0. */
  initialSpeed?: number;
  /** Erosion brush radius in grid cells. Default: 2. */
  radius?: number;
  /** Deterministic PRNG seed. */
  seed?: number | string;
}

export interface ThermalErosionConfig {
  /** Number of thermal relaxation iterations. Default: 5. */
  iterations?: number;
  /** Talus angle threshold in degrees (slope beyond which scree falls). Default: 35. */
  talusAngleDegrees?: number;
  /** Fraction of excess material moved per step [0, 1]. Default: 0.5. */
  displacementRate?: number;
}

// ============================================================================
// Biome System
// ============================================================================

export type BiomeType =
  | "desert"
  | "grassland"
  | "forest"
  | "tundra"
  | "snow"
  | "alpine"
  | "tropical"
  | "wetlands"
  | "rocky"
  | string;

export interface BiomeRule {
  name: BiomeType;
  /** Elevation range normalized to [0, 1]. */
  elevationRange?: [number, number];
  /** Slope range in degrees [0, 90]. */
  slopeRangeDegrees?: [number, number];
  /** Moisture range in [0, 1]. */
  moistureRange?: [number, number];
  /** Temperature range in [0, 1]. */
  temperatureRange?: [number, number];
  /** Base surface color for this biome (RGB tuple). */
  color?: [number, number, number];
  /** Surface roughness. Default: 0.8. */
  roughness?: number;
  /** Surface metalness. Default: 0.0. */
  metalness?: number;
}

export interface BiomeWeightMap {
  /** Dominant biome name per grid vertex. */
  dominantBiome: BiomeType[];
  /** Normalized biome weights per vertex of size cols * rows * activeBiomes. */
  weights: Float32Array;
  /** Active biome names ordered by index. */
  biomeNames: string[];
}

// ============================================================================
// Vegetation & Environmental Props Distribution
// ============================================================================

export type VegetationCategory =
  | "trees"
  | "grass"
  | "rocks"
  | "bushes"
  | "flowers"
  | "props"
  | string;

export interface VegetationScatterRule {
  id: string;
  category: VegetationCategory;
  /** Target density (instances per 100 square meters). Default: 5. */
  density?: number;
  /** Minimum spacing distance between instances. Default: 2.0. */
  minSpacing?: number;
  /** Allowed biomes for this prop type. If undefined, allowed everywhere. */
  allowedBiomes?: BiomeType[];
  /** Elevation range in world units [minY, maxY]. */
  elevationRange?: [number, number];
  /** Slope range in degrees [minSlope, maxSlope]. */
  slopeRangeDegrees?: [number, number];
  /** Minimum and maximum scale multipliers. Default: [0.8, 1.2]. */
  scaleRange?: [number, number];
  /** Whether to align prop orientation with the terrain surface normal. Default: false. */
  alignToNormal?: boolean;
}

export interface VegetationInstance {
  id: string;
  category: VegetationCategory;
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  biome: BiomeType;
  normal: Vector3;
}

// ============================================================================
// Chunking & Level of Detail (LOD)
// ============================================================================

export interface TerrainChunkConfig {
  chunkX: number;
  chunkZ: number;
  worldOrigin: Vector3;
  chunkWidth: number;
  chunkLength: number;
  resolution: number;
}

export interface TerrainChunk {
  id: string;
  chunkX: number;
  chunkZ: number;
  worldBounds: AABB3D;
  lodLevel: number;
  buffers: TerrainMeshBuffers;
  disposed: boolean;
}

// ============================================================================
// Master Terrain Configuration & Instance
// ============================================================================

export interface TerrainConfig {
  id?: string;
  /** Total world width along X axis. Default: 200. */
  width?: number;
  /** Total world length along Z axis. Default: 200. */
  length?: number;
  /** Discrete grid divisions along X. Default: 128. */
  resolutionX?: number;
  /** Discrete grid divisions along Z. Default: 128. */
  resolutionZ?: number;
  /** Terrain world position origin (center or min). Default: { x: 0, y: 0, z: 0 }. */
  origin?: Vector3;
  /** Macro height preset. Default: "rolling-hills". */
  preset?: TerrainPreset;
  /** Noise layer configurations composing the terrain. */
  noiseLayers?: NoiseLayerConfig[];
  /** Deterministic global PRNG seed. Default: 1337. */
  seed?: number | string;
  /** Hydraulic erosion options. If true or config object, applied after noise. */
  hydraulicErosion?: boolean | HydraulicErosionConfig;
  /** Thermal erosion options. If true or config object, applied after noise. */
  thermalErosion?: boolean | ThermalErosionConfig;
  /** Custom biome classification rules. */
  biomes?: BiomeRule[];
  /** Vegetation scattering rules. */
  vegetationRules?: VegetationScatterRule[];
  /** Chunk subdivision count along each axis (e.g. 4 for 4x4 chunks). Default: 1. */
  chunkCount?: number;
  /** Whether to compute and register a physics heightfield collider. Default: true. */
  enablePhysics?: boolean;
  /** Whether to enable GPU acceleration where hardware allows. Default: false. */
  useGPU?: boolean;
}

export interface Terrain3D {
  id: string;
  config: Required<Pick<TerrainConfig, "width" | "length" | "resolutionX" | "resolutionZ">> & TerrainConfig;
  heightmap: HeightmapData;
  meshBuffers: TerrainMeshBuffers;
  bounds: AABB3D;
  biomes: BiomeWeightMap;
  vegetation: VegetationInstance[];
  chunks: TerrainChunk[];
  collider?: Collider3D;
  /** Sample surface elevation at arbitrary world coordinate (X, Z). */
  sampleHeight(worldX: number, worldZ: number): number;
  /** Sample surface normal vector at arbitrary world coordinate (X, Z). */
  sampleNormal(worldX: number, worldZ: number): Vector3;
  /** Sample dominant biome at arbitrary world coordinate (X, Z). */
  sampleBiome(worldX: number, worldZ: number): BiomeType;
  /** Raycast against the terrain surface. */
  raycast(rayOrigin: Vector3, rayDir: Vector3, maxDistance?: number): { hit: boolean; point: Vector3; normal: Vector3; distance: number } | null;
  /** Dispose all allocated buffers and colliders. */
  dispose(): void;
}
