/**
 * AF Motion — 3D Procedural World & Environment Generator Types
 *
 * Strongly-typed contracts for procedural 3D worlds, unified 12-stage pipeline,
 * hydrology, clustered population, dynamic atmosphere/lighting, physics, and streaming.
 */

import type { Vector3, AABB3D, Transform3D, Collider3D } from "../physics/types.js";
import type {
  Terrain3D,
  TerrainConfig,
  HeightmapData,
  BiomeType,
  VegetationInstance,
  VegetationScatterRule,
  TerrainChunk,
} from "../terrain/types.js";
import type { WeatherState, WindSystem } from "../../graphics/environment/types.js";
import type { PhysicsWorld3D } from "../physics/world.js";

// ============================================================================
// Pipeline Stages
// ============================================================================

export type WorldGenerationStage =
  | "seed-initialization"
  | "terrain-generation"
  | "heightmap-processing"
  | "erosion-simulation"
  | "biome-classification"
  | "terrain-materials"
  | "hydrology-simulation"
  | "vegetation-population"
  | "environmental-setup"
  | "lighting-atmosphere"
  | "physics-registration"
  | "scene-composition";

export interface PipelineProgressEvent {
  stage: WorldGenerationStage;
  stageIndex: number;
  totalStages: number;
  progress: number; // 0.0 to 1.0
  message: string;
}

// ============================================================================
// Hydrology & Water Bodies
// ============================================================================

export type WaterBodyType = "ocean" | "lake" | "pond" | "river";

export interface WaterBody {
  id: string;
  type: WaterBodyType;
  surfaceElevation: number;
  bounds: AABB3D;
  flowDirection: Vector3;
  flowSpeed: number;
  color: [number, number, number];
  opacity: number;
}

export interface RiverNode {
  position: Vector3;
  width: number;
  depth: number;
}

export interface RiverPath {
  id: string;
  nodes: RiverNode[];
  flowSpeed: number;
}

export interface WaterMeshBuffers {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

export interface WorldHydrologyConfig {
  /** Global sea level in world units. Default: 0. */
  seaLevel?: number;
  /** Whether to detect and carve lakes in depression basins. Default: true. */
  enableLakes?: boolean;
  /** Minimum depression area to form a lake. Default: 20. */
  minLakeArea?: number;
  /** Whether to simulate river paths. Default: true. */
  enableRivers?: boolean;
  /** Number of river spring sources to trace. Default: 2. */
  riverCount?: number;
  /** Base water color RGB tuple. Default: [0.1, 0.4, 0.65]. */
  waterColor?: [number, number, number];
  /** Water surface opacity [0, 1]. Default: 0.85. */
  waterOpacity?: number;
}

export interface WorldHydrology {
  seaLevel: number;
  waterBodies: WaterBody[];
  rivers: RiverPath[];
  meshBuffers: WaterMeshBuffers;
  sampleWater(x: number, z: number): {
    inWater: boolean;
    surfaceY: number;
    depth: number;
    flow: Vector3;
  };
}

// ============================================================================
// Population & Vegetation Clustering
// ============================================================================

export interface ForestClusterConfig {
  id: string;
  center: { x: number; z: number };
  radius: number;
  densityMultiplier: number;
  targetBiomes: BiomeType[];
}

export interface WorldPopulationConfig {
  vegetationRules?: VegetationScatterRule[];
  clusters?: ForestClusterConfig[];
  /** Cluster generation count based on macro noise. Default: 4. */
  autoClusterCount?: number;
  /** Max instances to prevent GPU allocation overload. Default: 50000. */
  maxInstances?: number;
}

export interface WorldPopulation {
  instances: VegetationInstance[];
  clusters: ForestClusterConfig[];
  /** Instanced matrix transform arrays grouped by category for high-efficiency batch rendering. */
  instancedBatches: Map<string, Float32Array>;
}

// ============================================================================
// Lighting & Atmosphere
// ============================================================================

export interface DayNightState {
  /** Time of day in hours [0, 24). */
  timeOfDayHours: number;
  /** Solar elevation angle in degrees [-90, 90]. */
  sunElevationDegrees: number;
  /** Sun azimuth angle in degrees [0, 360). */
  sunAzimuthDegrees: number;
  /** Direction vector to the sun. */
  sunDirection: Vector3;
  /** Direction vector to the moon. */
  moonDirection: Vector3;
  /** Normalized sunlight color RGB [0, 1]. */
  sunColor: [number, number, number];
  /** Sunlight intensity factor. */
  sunIntensity: number;
  /** Normalized ambient skylight color RGB. */
  ambientColor: [number, number, number];
  /** Ambient light intensity. */
  ambientIntensity: number;
  /** Sky clear color RGB. */
  skyColor: [number, number, number];
  /** Is daylight currently active. */
  isDay: boolean;
}

export interface WorldLightingConfig {
  /** Initial time of day in hours [0, 24). Default: 11.5 (near noon). */
  initialTimeHours?: number;
  /** Day cycle progression speed multiplier (e.g. 60 for 1 minute = 1 hour). Default: 0 (paused). */
  timeScale?: number;
  /** Solar latitude in degrees affecting sun arc. Default: 45. */
  latitudeDegrees?: number;
  /** Atmospheric haze density [0, 1]. Default: 0.15. */
  hazeDensity?: number;
  /** Volumetric fog near distance in world units. Default: 50. */
  fogNear?: number;
  /** Volumetric fog far distance in world units. Default: 500. */
  fogFar?: number;
  /** Base fog color. If omitted, matches ambient skylight. */
  fogColor?: [number, number, number];
}

export interface WorldLighting {
  dayNight: DayNightState;
  hazeDensity: number;
  fogNear: number;
  fogFar: number;
  fogColor: [number, number, number];
  setTime(hours: number): void;
  setWeather(weather: WeatherState): void;
  update(deltaMs: number): void;
}

// ============================================================================
// Environment & Weather
// ============================================================================

export interface WorldEnvironmentConfig {
  initialWeather?: WeatherState;
  windSpeed?: number;
  windDirectionDegrees?: number;
  temperatureCelsius?: number;
  relativeHumidity?: number;
}

export interface WorldEnvironment {
  weather: WeatherState;
  wind: WindSystem;
  temperatureCelsius: number;
  relativeHumidity: number;
  setWeather(weather: WeatherState): void;
  update(deltaMs: number): void;
}

// ============================================================================
// Streaming & Chunks
// ============================================================================

export interface WorldStreamingConfig {
  /** Chunk dimension along X and Z. Default: 64. */
  chunkSize?: number;
  /** Radius in chunks around viewer to keep loaded. Default: 2. */
  viewRadiusChunks?: number;
  /** Max chunks cached before discarding. Default: 64. */
  maxCachedChunks?: number;
}

export interface WorldChunkKey {
  cx: number;
  cz: number;
}

export interface WorldChunk3D {
  key: string;
  cx: number;
  cz: number;
  bounds: AABB3D;
  terrainChunk: TerrainChunk;
  vegetation: VegetationInstance[];
  lodLevel: number;
  disposed: boolean;
}

export interface WorldStreamingManager {
  loadedChunks: Map<string, WorldChunk3D>;
  cachedChunks: Map<string, WorldChunk3D>;
  updateViewerPosition(viewerPos: Vector3): void;
  loadChunk(cx: number, cz: number): WorldChunk3D;
  unloadChunk(cx: number, cz: number): void;
  clear(): void;
}

// ============================================================================
// Master World Configuration & Instance
// ============================================================================

export type WorldPreset =
  | "alpine-landscape"
  | "dense-forest"
  | "desert-world"
  | "tropical-island"
  | "snow-mountains"
  | "rolling-grasslands"
  | "volcanic-landscape"
  | "fantasy-world"
  | "custom";

export interface World3DConfig {
  id?: string;
  seed?: number | string;
  preset?: WorldPreset;
  /** Total world width along X in world units. Default: 256. */
  width?: number;
  /** Total world length along Z in world units. Default: 256. */
  length?: number;
  /** Terrain generation options. */
  terrain?: TerrainConfig;
  /** Hydrology options. */
  hydrology?: WorldHydrologyConfig;
  /** Population options. */
  population?: WorldPopulationConfig;
  /** Lighting and atmospheric options. */
  lighting?: WorldLightingConfig;
  /** Environmental and weather options. */
  environment?: WorldEnvironmentConfig;
  /** Streaming options. */
  streaming?: WorldStreamingConfig;
  /** Physics world options. If true or provided, registers terrain and colliders. */
  physics?: boolean | { world?: PhysicsWorld3D; gravity?: Vector3 };
}

export type WorldLifecycleState =
  | "uninitialized"
  | "generating"
  | "ready"
  | "paused"
  | "disposed";

export interface WorldBenchmarkResult {
  totalGenerationTimeMs: number;
  stageTimesMs: Record<WorldGenerationStage, number>;
  totalVertices: number;
  totalTriangles: number;
  vegetationInstancesCount: number;
  waterBodiesCount: number;
  chunksCount: number;
}

export interface World3D {
  id: string;
  config: Required<Pick<World3DConfig, "width" | "length" | "seed">> & World3DConfig;
  state: WorldLifecycleState;
  terrain: Terrain3D;
  hydrology: WorldHydrology;
  population: WorldPopulation;
  lighting: WorldLighting;
  environment: WorldEnvironment;
  physicsWorld?: PhysicsWorld3D;
  streaming: WorldStreamingManager;
  timeOfDayHours: number;

  /** Sample elevation in world units at (X, Z). */
  sampleHeight(worldX: number, worldZ: number): number;
  /** Sample water state (surface elevation, depth, flow vector) at (X, Z). */
  sampleWater(worldX: number, worldZ: number): {
    inWater: boolean;
    surfaceY: number;
    depth: number;
    flow: Vector3;
  };
  /** Sample dominant biome at (X, Z). */
  sampleBiome(worldX: number, worldZ: number): BiomeType;
  /** Swept raycast against terrain and environment. */
  raycast(
    origin: Vector3,
    direction: Vector3,
    maxDistance?: number
  ): { hit: boolean; point: Vector3; normal: Vector3; distance: number } | null;

  /** Set environmental weather state. */
  setWeather(weather: WeatherState): void;
  /** Set time of day in hours [0, 24). */
  setTimeOfDay(hours: number): void;
  /** Update world simulation systems by deltaTime in milliseconds. */
  update(deltaTimeMs: number): void;
  /** Pause world animation and time progression. */
  pause(): void;
  /** Resume world animation and time progression. */
  resume(): void;
  /** Cleanly dispose all allocated buffers, colliders, and sub-systems. */
  dispose(): void;
}
