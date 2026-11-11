/**
 * AF Motion GPU Simulation Architecture
 *
 * Framework-independent foundation for GPU-accelerated particles, fluid simulations,
 * environmental effects, and interactive simulation systems across WebGL2, WebGPU,
 * and deterministic CPU execution.
 */

export * from "./types.js";
export * from "./capabilities.js";
export * from "./resource-manager.js";
export * from "./shaders.js";
export * from "./ping-pong.js";
export * from "./backends/backend.js";
export * from "./backends/cpu.js";
export * from "./backends/webgl2.js";
export * from "./backends/webgpu.js";
export * from "./backends/selection.js";
export * from "./pipeline.js";
export * from "./device.js";
export * from "./engine.js";

// Convenience aliases for Prompt 122 unification
export { createSimulationEngine as createGPUSimulation } from "./engine.js";
export type {
  SimulationEngineConfig as GPUSimulationConfig,
  SimulationEngine as GPUSimulationEngine,
} from "./types.js";
