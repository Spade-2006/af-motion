/**
 * AF Motion — 3D World 12-Stage Procedural Generation Pipeline
 *
 * Deterministic multi-stage compilation orchestrating terrain synthesis, erosion,
 * biomes, materials, hydrology, population, environment, lighting, and physics
 * with progress reporting, AbortSignal cancellation, and granular stage timing.
 */

import type { HeightmapData } from "../terrain/types.js";
import type {
  World3DConfig,
  WorldGenerationStage,
  PipelineProgressEvent,
  WorldBenchmarkResult,
  World3D,
  WorldEnvironment,
} from "./types.js";
import { generateTerrainHeightmap, buildTerrainMeshBuffers } from "../terrain/heightmap.js";
import { applyHydraulicErosion, applyThermalErosion } from "../terrain/erosion.js";
import { classifyTerrainBiomes } from "../terrain/biomes.js";
import { generateTerrainMaterials } from "../terrain/materials.js";
import { createTerrain3D } from "../terrain/terrain.js";
import { createTerrainCollider } from "../terrain/physics.js";
import { createWorldHydrology } from "./hydrology.js";
import { createWorldPopulation } from "./population.js";
import { createWorldLighting } from "./lighting.js";
import { createWorldStreamingManager } from "./streaming.js";
import { createPhysicsWorld3D } from "../physics/world.js";
import { vec3 } from "../physics/math.js";
import { createWindSystem } from "../../graphics/environment/wind.js";

export const PIPELINE_STAGES: WorldGenerationStage[] = [
  "seed-initialization",
  "terrain-generation",
  "heightmap-processing",
  "erosion-simulation",
  "biome-classification",
  "terrain-materials",
  "hydrology-simulation",
  "vegetation-population",
  "environmental-setup",
  "lighting-atmosphere",
  "physics-registration",
  "scene-composition",
];

export interface RunPipelineOptions {
  signal?: AbortSignal;
  onProgress?: (event: PipelineProgressEvent) => void;
}

/**
 * Executes the full 12-stage world generation pipeline.
 */
export function executeWorldPipeline(
  config: World3DConfig,
  options: RunPipelineOptions = {}
): { world: World3D; benchmark: WorldBenchmarkResult } {
  const { signal, onProgress } = options;
  const stageTimesMs: Record<WorldGenerationStage, number> = {} as any;
  const startTime = performance.now();

  const checkAbort = (): void => {
    if (signal?.aborted) {
      const err = new Error("World generation pipeline cancelled");
      err.name = "AbortError";
      throw err;
    }
  };

  const reportProgress = (stage: WorldGenerationStage, index: number, progress: number, message: string): void => {
    onProgress?.({
      stage,
      stageIndex: index,
      totalStages: PIPELINE_STAGES.length,
      progress,
      message,
    });
  };

  const runStage = <T>(stage: WorldGenerationStage, index: number, fn: () => T, message: string): T => {
    checkAbort();
    reportProgress(stage, index, index / PIPELINE_STAGES.length, message);
    const t0 = performance.now();
    const result = fn();
    stageTimesMs[stage] = performance.now() - t0;
    return result;
  };

  // 1. Seed Initialization
  const seed = runStage(
    "seed-initialization",
    0,
    () => config.seed ?? 1337,
    "Initializing deterministic world seed"
  );

  const width = config.width ?? 256;
  const length = config.length ?? 256;
  const terrainCfg = config.terrain ?? {};
  const resX = terrainCfg.resolutionX ?? 64;
  const resZ = terrainCfg.resolutionZ ?? 64;
  const preset = terrainCfg.preset ?? "rolling-hills";

  // 2. Terrain Generation
  let heightmap = runStage(
    "terrain-generation",
    1,
    () =>
      generateTerrainHeightmap({
        width,
        length,
        resolutionX: resX,
        resolutionZ: resZ,
        preset,
        noiseLayers: terrainCfg.noiseLayers,
        seed,
      }),
    "Synthesizing base procedural terrain heightmap"
  );

  // 3. Heightmap Processing
  runStage(
    "heightmap-processing",
    2,
    () => {
      // Recalculate elevation bounds
      let minH = Infinity;
      let maxH = -Infinity;
      for (let i = 0; i < heightmap.heights.length; i++) {
        const h = heightmap.heights[i];
        if (h < minH) minH = h;
        if (h > maxH) maxH = h;
      }
      heightmap.minHeight = minH;
      heightmap.maxHeight = maxH;
      return true;
    },
    "Validating heightmap elevation bounds and contours"
  );

  // 4. Erosion Simulation
  runStage(
    "erosion-simulation",
    3,
    () => {
      if (terrainCfg.hydraulicErosion) {
        const hydroOpts = typeof terrainCfg.hydraulicErosion === "object" ? terrainCfg.hydraulicErosion : {};
        applyHydraulicErosion(heightmap, { seed: `${seed}-hydro`, ...hydroOpts });
      }
      if (terrainCfg.thermalErosion) {
        const thermalOpts = typeof terrainCfg.thermalErosion === "object" ? terrainCfg.thermalErosion : {};
        applyThermalErosion(heightmap, thermalOpts);
      }
      return true;
    },
    "Simulating hydraulic droplet flow and thermal slope relaxation"
  );

  // 5. Biome Classification
  const biomes = runStage(
    "biome-classification",
    4,
    () => classifyTerrainBiomes(heightmap, terrainCfg.biomes, { seed }),
    "Evaluating elevation, slope, temperature and moisture ecological zones"
  );

  // 6. Terrain Materials
  const materials = runStage(
    "terrain-materials",
    5,
    () => generateTerrainMaterials(heightmap, biomes, terrainCfg.biomes),
    "Synthesizing 4-layer splat weights and RGBA vertex colors"
  );

  // 7. Hydrology Simulation
  const hydrology = runStage(
    "hydrology-simulation",
    6,
    () => createWorldHydrology(heightmap, config.hydrology, `${seed}-hydro`),
    "Modeling oceans, lakes, river paths and shoreline boundaries"
  );

  // 8. Vegetation & Population
  const population = runStage(
    "vegetation-population",
    7,
    () =>
      createWorldPopulation(
        heightmap,
        biomes,
        hydrology,
        config.population,
        `${seed}-pop`
      ),
    "Distributing clustered forest groves, flora, and prop instances"
  );

  // 9. Environmental Setup
  const envConfig = config.environment ?? {};
  const initialWeather = envConfig.initialWeather ?? "clear";

  const environment: WorldEnvironment = runStage(
    "environmental-setup",
    8,
    () => {
      const wind = createWindSystem({
        speed: envConfig.windSpeed ?? 5,
        gustIntensity: 0.3,
      });

      let weather = initialWeather;
      let temp = envConfig.temperatureCelsius ?? 20;
      let humidity = envConfig.relativeHumidity ?? 0.5;
      let elapsedSec = 0;

      return {
        get weather() {
          return weather;
        },
        wind,
        get temperatureCelsius() {
          return temp;
        },
        get relativeHumidity() {
          return humidity;
        },
        setWeather(newWeather) {
          weather = newWeather;
        },
        update(deltaMs) {
          const dtSec = deltaMs / 1000;
          elapsedSec += dtSec;
          wind.update(dtSec, elapsedSec);
        },
      };
    },
    "Configuring atmospheric weather, wind fields, and humidity"
  );

  // 10. Lighting & Atmosphere
  const lighting = runStage(
    "lighting-atmosphere",
    9,
    () => createWorldLighting(config.lighting, initialWeather),
    "Computing diurnal solar arc, sky spectrums, and atmospheric fog"
  );

  // 11. Physics Registration
  let physicsWorld: any = undefined;
  runStage(
    "physics-registration",
    10,
    () => {
      if (config.physics) {
        if (typeof config.physics === "object" && config.physics.world) {
          physicsWorld = config.physics.world;
        } else {
          const gravity =
            typeof config.physics === "object" && config.physics.gravity
              ? config.physics.gravity
              : vec3(0, -9.81, 0);
          physicsWorld = createPhysicsWorld3D({ gravity });
        }

        // Register static terrain heightfield
        physicsWorld.addBody({
          id: "world-terrain-body",
          type: "static",
          position: vec3(0, 0, 0),
          colliders: [createTerrainCollider(heightmap)],
        });
      }
      return true;
    },
    "Registering static heightfield and environmental physics colliders"
  );

  // 12. Scene Composition & Streaming
  const terrain = createTerrain3D({
    id: `${config.id ?? "world"}-terrain`,
    width,
    length,
    resolutionX: resX,
    resolutionZ: resZ,
    preset,
    seed,
    enablePhysics: false, // Handled at world level
  });
  terrain.meshBuffers.colors = materials.colors;

  const streaming = runStage(
    "scene-composition",
    11,
    () => createWorldStreamingManager(terrain, population, config.streaming),
    "Composing spatial streaming chunks and master world controller"
  );

  reportProgress("scene-composition", 11, 1.0, "World generation complete");

  // Construct complete World3D instance
  let isPaused = false;

  const sampleHeight = (worldX: number, worldZ: number): number => {
    return terrain.sampleHeight(worldX, worldZ);
  };

  const sampleWater = (worldX: number, worldZ: number) => {
    return hydrology.sampleWater(worldX, worldZ);
  };

  const sampleBiome = (worldX: number, worldZ: number) => {
    return terrain.sampleBiome(worldX, worldZ);
  };

  const raycast = (origin: any, direction: any, maxDist = 1000) => {
    return terrain.raycast(origin, direction, maxDist);
  };

  const setWeather = (newWeather: any): void => {
    environment.setWeather(newWeather);
    lighting.setWeather(newWeather);
  };

  const setTimeOfDay = (hours: number): void => {
    lighting.setTime(hours);
  };

  const update = (deltaMs: number): void => {
    if (isPaused) return;
    environment.update(deltaMs);
    lighting.update(deltaMs);
    if (physicsWorld) {
      physicsWorld.step(deltaMs / 1000);
    }
  };

  const pause = (): void => {
    isPaused = true;
  };

  const resume = (): void => {
    isPaused = false;
  };

  const dispose = (): void => {
    streaming.clear();
    terrain.dispose();
  };

  const totalTime = performance.now() - startTime;

  const totalVertices =
    terrain.meshBuffers.positions.length / 3 + hydrology.meshBuffers.positions.length / 3;
  const totalTriangles =
    terrain.meshBuffers.indices.length / 3 + hydrology.meshBuffers.indices.length / 3;

  const benchmark: WorldBenchmarkResult = {
    totalGenerationTimeMs: totalTime,
    stageTimesMs,
    totalVertices,
    totalTriangles,
    vegetationInstancesCount: population.instances.length,
    waterBodiesCount: hydrology.waterBodies.length,
    chunksCount: streaming.loadedChunks.size,
  };

  const worldInstance: World3D = {
    id: config.id ?? "world-1",
    config: {
      ...config,
      width,
      length,
      seed,
    },
    state: "ready",
    terrain,
    hydrology,
    population,
    lighting,
    environment,
    physicsWorld,
    streaming,
    get timeOfDayHours() {
      return lighting.dayNight.timeOfDayHours;
    },
    sampleHeight,
    sampleWater,
    sampleBiome,
    raycast,
    setWeather,
    setTimeOfDay,
    update,
    pause,
    resume,
    dispose,
  };

  return {
    world: worldInstance,
    benchmark,
  };
}
