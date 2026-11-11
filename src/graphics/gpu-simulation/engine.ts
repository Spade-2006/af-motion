/**
 * AF Motion GPU Simulation Architecture — Simulation Execution Engine
 *
 * Implements a framework-independent simulation runner with fixed/variable timestepping,
 * multi-substep execution, performance metrics accounting, and safe backend fallback.
 */

import { resolveQualityProfile } from "../composition/quality.js";
import { createComputeDevice, createComputeDeviceAsync } from "./device.js";
import type {
  ComputeBackendType,
  ComputeDevice,
  SimulationEngine,
  SimulationEngineConfig,
  SimulationMetrics,
  SimulationState,
  SimulationStepContext,
} from "./types.js";

export function createSimulationEngine(config: SimulationEngineConfig): SimulationEngine {
  const {
    kernel,
    timestepMode = "fixed",
    fixedDeltaTime = 1 / 60,
    maxDeltaTime = 0.1,
    substeps = 1,
    quality = "high",
    fallbackPolicy = "reset",
    onFallback,
  } = config;

  let state: SimulationState = "uninitialized";
  let device: ComputeDevice = config.device || createComputeDevice({
    backend: config.backend,
    canvas: config.canvas,
  });

  let time = 0;
  let frame = 0;
  let accumulator = 0;
  let lastTimestamp = 0;

  // Performance metrics tracking
  let computeTimeMs = 0;
  let frameTimeMs = 0;
  let fps = 60;
  let frameCounter = 0;
  let lastFpsCalc = Date.now();

  const qualityProfile = resolveQualityProfile(quality);

  function executeStep(dt: number, sub: number, totalSubs: number): void {
    const stepContext: SimulationStepContext = {
      time,
      deltaTime: dt,
      substep: sub,
      totalSubsteps: totalSubs,
      frame,
      backend: device.backend,
      device,
    };

    const startCompute = performance.now();
    try {
      kernel.step(stepContext);
    } catch (err) {
      console.warn(`[AF Motion Simulation] Kernel step error:`, err);
    }
    computeTimeMs = performance.now() - startCompute;
  }

  const engine: SimulationEngine = {
    get state(): SimulationState {
      return state;
    },

    get device(): ComputeDevice {
      return device;
    },

    get backend(): ComputeBackendType {
      return device.backend;
    },

    get metrics(): SimulationMetrics {
      return {
        fps: Math.round(fps),
        frameTimeMs: Math.round(frameTimeMs * 100) / 100,
        computeTimeMs: Math.round(computeTimeMs * 100) / 100,
        totalFrames: frame,
        currentBackend: device.backend,
        memoryUsage: device.resourceManager.memoryUsage,
      };
    },

    async init(): Promise<void> {
      if (state !== "uninitialized" && state !== "disposed") return;

      const initContext: SimulationStepContext = {
        time: 0,
        deltaTime: 0,
        substep: 0,
        totalSubsteps: substeps,
        frame: 0,
        backend: device.backend,
        device,
      };

      if (kernel.init) {
        await kernel.init(initContext);
      }

      state = "ready";
    },

    update(explicitDelta?: number): void {
      if (state === "disposed" || state === "paused") return;
      if (state === "uninitialized") {
        this.init();
      }

      state = "running";
      const startFrame = performance.now();

      let dt = explicitDelta;
      if (typeof dt !== "number") {
        const now = startFrame;
        dt = lastTimestamp > 0 ? (now - lastTimestamp) / 1000 : fixedDeltaTime;
        lastTimestamp = now;
      }

      // Clamp max delta-time to avoid spiral of death
      dt = Math.min(Math.max(0, dt), maxDeltaTime);

      const effectiveSubsteps = Math.max(1, Math.round(substeps * (qualityProfile.particleMultiplier >= 1 ? 1 : 1)));

      if (timestepMode === "fixed") {
        accumulator += dt;
        while (accumulator >= fixedDeltaTime) {
          const subDt = fixedDeltaTime / effectiveSubsteps;
          for (let s = 0; s < effectiveSubsteps; s++) {
            executeStep(subDt, s, effectiveSubsteps);
            time += subDt;
          }
          accumulator -= fixedDeltaTime;
          frame++;
        }
      } else {
        // Variable timestep
        const subDt = dt / effectiveSubsteps;
        for (let s = 0; s < effectiveSubsteps; s++) {
          executeStep(subDt, s, effectiveSubsteps);
          time += subDt;
        }
        frame++;
      }

      frameTimeMs = performance.now() - startFrame;
      frameCounter++;

      const now = Date.now();
      if (now - lastFpsCalc >= 1000) {
        fps = (frameCounter * 1000) / (now - lastFpsCalc);
        frameCounter = 0;
        lastFpsCalc = now;
      }
    },

    pause(): void {
      if (state === "running") {
        state = "paused";
      }
    },

    resume(): void {
      if (state === "paused") {
        lastTimestamp = performance.now();
        state = "running";
      }
    },

    reset(): void {
      time = 0;
      frame = 0;
      accumulator = 0;
      lastTimestamp = 0;
      if (kernel.reset) {
        kernel.reset();
      }
      state = "ready";
    },

    dispose(): void {
      if (state === "disposed") return;
      state = "disposed";
      if (kernel.dispose) {
        try {
          kernel.dispose();
        } catch (err) {
          console.warn("[AF Motion Simulation] Kernel dispose error:", err);
        }
      }
      device.dispose();
    },

    async switchBackend(target: ComputeBackendType): Promise<void> {
      if (device.backend === target || state === "disposed") return;

      const oldBackend = device.backend;
      try {
        const newDevice = await createComputeDeviceAsync({
          backend: target,
          canvas: config.canvas,
        });

        // Dispose old device resources
        device.dispose();
        device = newDevice;

        if (fallbackPolicy === "reset") {
          this.reset();
          if (kernel.init) {
            await kernel.init({
              time: 0,
              deltaTime: 0,
              substep: 0,
              totalSubsteps: substeps,
              frame: 0,
              backend: device.backend,
              device,
            });
          }
        }

        if (onFallback) {
          onFallback(oldBackend, device.backend, `Switched backend from ${oldBackend} to ${device.backend}`);
        }
      } catch (err) {
        console.warn(`[AF Motion Simulation] Failed to switch backend to ${target}:`, err);
      }
    },
  };

  return engine;
}
