/**
 * AF Motion Environmental Simulation Engine
 *
 * Framework-independent architecture for rain, snow, fog, clouds, wind,
 * fire, smoke, and lightning atmospheric simulation effects.
 */

export * from "./types.js";
export * from "./wind.js";
export * from "./rain.js";
export * from "./snow.js";
export * from "./fog.js";
export * from "./clouds.js";
export * from "./fire-smoke.js";
export * from "./lightning.js";
export * from "./weather.js";
export * from "./environment.js";

// Convenience aliases for Prompt 122 unification
export { createEnvironment as createEnvironmentSimulation } from "./environment.js";
export type { WeatherState as WeatherPresetType } from "./types.js";
