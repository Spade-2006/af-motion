/**
 * AF Motion — 3D Procedural World Master Controller
 *
 * Unified public entry point for procedural 3D world creation, asynchronous streaming,
 * diurnal solar control, weather mutations, and resource lifecycle management.
 */

import type { Vector3 } from "../physics/types.js";
import type { BiomeType } from "../terrain/types.js";
import type { WeatherState } from "../../graphics/environment/types.js";
import type {
  World3DConfig,
  World3D,
  WorldChunk3D,
  WorldBenchmarkResult,
} from "./types.js";
import { executeWorldPipeline, type RunPipelineOptions } from "./pipeline.js";
import { createWorldPreset } from "./presets.js";

/**
 * Creates and initializes a procedural 3D world synchronously.
 */
export function createWorld3D(config: World3DConfig = {}): World3D {
  const resolvedConfig = config.preset
    ? createWorldPreset(config.preset, config)
    : config;
  const { world } = executeWorldPipeline(resolvedConfig);
  return world;
}

/**
 * Asynchronously generates a procedural 3D world with cancellation and progress reporting.
 */
export async function generateWorld3D(
  config: World3DConfig = {},
  options: RunPipelineOptions = {}
): Promise<World3D> {
  const resolvedConfig = config.preset
    ? createWorldPreset(config.preset, config)
    : config;
  const { world } = executeWorldPipeline(resolvedConfig, options);
  return world;
}

/**
 * Loads a world chunk at spatial grid coordinates (cx, cz).
 */
export function loadWorldChunk(world: World3D, cx: number, cz: number): WorldChunk3D {
  return world.streaming.loadChunk(cx, cz);
}

/**
 * Unloads a world chunk at spatial grid coordinates (cx, cz).
 */
export function unloadWorldChunk(world: World3D, cx: number, cz: number): void {
  world.streaming.unloadChunk(cx, cz);
}

/**
 * Updates world atmospheric, lighting, and physics simulation by deltaTime in milliseconds.
 */
export function updateWorldEnvironment(world: World3D, deltaMs: number): void {
  world.update(deltaMs);
}

/**
 * Dynamically changes the active environmental weather state.
 */
export function setWorldWeather(world: World3D, weather: WeatherState): void {
  world.setWeather(weather);
}

/**
 * Sets the world diurnal time of day in hours [0, 24).
 */
export function setWorldTime(world: World3D, timeOfDayHours: number): void {
  world.setTimeOfDay(timeOfDayHours);
}

/**
 * Samples the dominant ecological biome at world coordinates (X, Z).
 */
export function getWorldBiome(world: World3D, worldX: number, worldZ: number): BiomeType {
  return world.sampleBiome(worldX, worldZ);
}

/**
 * Samples the ground terrain elevation at world coordinates (X, Z).
 */
export function sampleWorldHeight(world: World3D, worldX: number, worldZ: number): number {
  return world.sampleHeight(worldX, worldZ);
}

/**
 * Samples water depth, surface elevation, and flow vector at world coordinates (X, Z).
 */
export function sampleWorldWater(
  world: World3D,
  worldX: number,
  worldZ: number
): {
  inWater: boolean;
  surfaceY: number;
  depth: number;
  flow: Vector3;
} {
  return world.sampleWater(worldX, worldZ);
}

/**
 * Benchmarks world generation performance across all 12 pipeline stages.
 */
export function benchmarkWorldGeneration(config: World3DConfig = {}): WorldBenchmarkResult {
  const resolvedConfig = config.preset
    ? createWorldPreset(config.preset, config)
    : config;
  const { benchmark, world } = executeWorldPipeline(resolvedConfig);
  world.dispose();
  return benchmark;
}

/**
 * Completely tears down and disposes of a world instance and all associated buffers.
 */
export function disposeWorld3D(world: World3D): void {
  world.dispose();
}
