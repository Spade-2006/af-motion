/**
 * AF Motion Simulation Subsystem Adapters
 *
 * Bridges individual simulation engines (Particles, Fluid, Environment,
 * Interactive Forces, GPU Compute) into the unified SimulationParticipant protocol.
 */

import type { ParticleSystem } from "../particles/types.js";
import type { FluidSimulation } from "../fluid/types.js";
import type { EnvironmentSimulation } from "../environment/types.js";
import type { InteractiveParticleSystem } from "../particle-fields/system.js";
import type { SimulationEngine } from "../gpu-simulation/types.js";
import type { SimulationParticipant, SimulationQuality } from "./types.js";

export interface ParticipantAdapterOptions {
  priority?: number;
  autoRender?: boolean;
}

/**
 * Adapt a ParticleSystem instance into a unified SimulationParticipant.
 */
export function createParticleParticipant(
  id: string,
  system: ParticleSystem,
  options: ParticipantAdapterOptions = {}
): SimulationParticipant {
  return {
    id,
    type: "particle",
    priority: options.priority ?? 10,
    instance: system,
    step(dt: number) {
      system.update(dt);
    },
    render(canvas: HTMLCanvasElement) {
      if (options.autoRender !== false) {
        system.render(canvas);
      }
    },
    pause() {
      system.pause();
    },
    resume() {
      system.resume();
    },
    reset() {
      system.reset();
    },
    setQuality(_quality: SimulationQuality) {
      // Particle quality adjustment
    },
    dispose() {
      system.dispose();
    },
  };
}

/**
 * Adapt a FluidSimulation instance into a unified SimulationParticipant.
 */
export function createFluidParticipant(
  id: string,
  fluid: FluidSimulation,
  options: ParticipantAdapterOptions = {}
): SimulationParticipant {
  return {
    id,
    type: "fluid",
    priority: options.priority ?? 5,
    instance: fluid,
    step(dt: number) {
      fluid.update(dt);
    },
    render(canvas: HTMLCanvasElement) {
      if (options.autoRender !== false) {
        fluid.render(canvas);
      }
    },
    pause() {
      fluid.pause();
    },
    resume() {
      fluid.resume();
    },
    reset() {
      fluid.reset();
    },
    dispose() {
      fluid.dispose();
    },
  };
}

/**
 * Adapt an EnvironmentSimulation instance into a unified SimulationParticipant.
 */
export function createEnvironmentParticipant(
  id: string,
  env: EnvironmentSimulation,
  options: ParticipantAdapterOptions = {}
): SimulationParticipant {
  return {
    id,
    type: "environment",
    priority: options.priority ?? 20,
    instance: env,
    step(dt: number) {
      env.update(dt);
    },
    render(canvas: HTMLCanvasElement) {
      if (options.autoRender !== false) {
        env.render(canvas);
      }
    },
    pause() {
      env.pause();
    },
    resume() {
      env.resume();
    },
    reset() {
      env.reset();
    },
    dispose() {
      env.dispose();
    },
  };
}

/**
 * Adapt an InteractiveParticleSystem instance into a unified SimulationParticipant.
 */
export function createInteractiveParticleParticipant(
  id: string,
  system: InteractiveParticleSystem,
  options: ParticipantAdapterOptions = {}
): SimulationParticipant {
  return {
    id,
    type: "particle-field",
    priority: options.priority ?? 15,
    instance: system,
    step(dt: number) {
      system.update(dt);
    },
    render(canvas: HTMLCanvasElement) {
      if (options.autoRender !== false) {
        system.render(canvas);
      }
    },
    pause() {
      system.pause();
    },
    resume() {
      system.resume();
    },
    reset() {
      system.reset();
    },
    dispose() {
      system.dispose();
    },
  };
}

/**
 * Adapt a GPU SimulationEngine instance into a unified SimulationParticipant.
 */
export function createGPUSimulationParticipant(
  id: string,
  engine: SimulationEngine,
  options: ParticipantAdapterOptions = {}
): SimulationParticipant {
  return {
    id,
    type: "gpu-compute",
    priority: options.priority ?? 1,
    instance: engine,
    step(dt: number) {
      engine.update(dt);
    },
    render() {
      // GPU compute outputs to textures/buffers; custom draw pass if configured
    },
    dispose() {
      engine.dispose();
    },
  };
}
