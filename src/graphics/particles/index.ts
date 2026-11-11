/**
 * AF Motion Advanced Particle Engine
 *
 * High-performance, framework-independent particle system architecture
 * supporting millions-scale GPU-accelerated simulation, composable behaviors,
 * multiple geometric emitters, and deterministic CPU fallback.
 */

export * from "./types.js";
export {
  createParticlePRNG,
  parseParticleColor,
  resolveRange,
  randomDirectionInCone,
} from "./random.js";
export * from "./data-layout.js";
export * from "./emitters.js";
export * from "./behaviors.js";
export * from "./simulation.js";
export * from "./rendering.js";
export * from "./controller.js";
