/**
 * AF Motion Advanced Particle Engine — System Controller
 *
 * Implements the master ParticleSystem controller managing multi-emitter simulation,
 * composable physics behaviors, GPU/CPU rendering, adaptive quality scaling,
 * and performance metrics tracking.
 */

import { AdaptiveQualityMonitor, resolveQualityProfile } from "../composition/quality.js";
import { createComputeDevice } from "../gpu-simulation/device.js";
import { selectComputeBackend } from "../gpu-simulation/backends/selection.js";
import type { ComputeBackendType, ComputeDevice } from "../gpu-simulation/types.js";
import { createParticleDataPool } from "./data-layout.js";
import { createParticleEmitter, ParticleEmitterImpl } from "./emitters.js";
import { createPRNG } from "./random.js";
import { createWebGL2ParticleRenderer, renderParticlesCanvas2D, type WebGL2ParticleRenderer } from "./rendering.js";
import { stepParticleSimulation } from "./simulation.js";
import type {
  ParticleBehavior,
  ParticleDataPool,
  ParticleEmitter,
  ParticleEmitterConfig,
  ParticleRenderOptions,
  ParticleSystem,
  ParticleSystemConfig,
  ParticleSystemMetrics,
  ParticleSystemState,
} from "./types.js";

let systemSeq = 0;

export class ParticleSystemImpl implements ParticleSystem {
  readonly id: string;
  readonly maxParticles: number;
  private pool: ParticleDataPool;
  private emitters: ParticleEmitter[] = [];
  private behaviors: ParticleBehavior[] = [];
  private renderOptions: ParticleRenderOptions;
  private device: ComputeDevice | null = null;
  private qualityMonitor: AdaptiveQualityMonitor;
  private prng: () => number;
  private canvas: HTMLCanvasElement | null = null;
  private gl2Renderer: WebGL2ParticleRenderer | null = null;

  private sysState: ParticleSystemState = "idle";
  private activeBackend: ComputeBackendType | "canvas2d" = "canvas2d";

  private fixedTimestep: number;
  private substeps: number;
  private timeAccumulator = 0;
  private lastTime = 0;

  // Performance metrics
  private stepTimeMs = 0;
  private renderTimeMs = 0;
  private fps = 60;
  private frameCount = 0;
  private lastFpsTime = Date.now();

  constructor(config: ParticleSystemConfig = {}) {
    this.id = config.id || `particle_system_${++systemSeq}`;

    // Resolve quality profile
    const qualityLevel = config.quality || "high";
    const profile = resolveQualityProfile(qualityLevel);
    this.qualityMonitor = new AdaptiveQualityMonitor(qualityLevel);

    // Dynamic capacity scaled by quality profile
    const requestedMax = config.maxParticles ?? 10000;
    this.maxParticles = Math.max(10, Math.round(requestedMax * profile.particleMultiplier));
    this.pool = createParticleDataPool(this.maxParticles);

    this.renderOptions = config.renderOptions || {};
    this.fixedTimestep = config.fixedTimestep || 1 / 60;
    this.substeps = Math.max(1, config.substeps || 1);
    this.prng = createPRNG(config.seed ?? Date.now());
    this.canvas = config.canvas || null;

    // Resolve backend via Prompt 117
    const selection = selectComputeBackend({
      preference: config.backend || "auto",
      canvas: this.canvas,
    });

    if (selection.backend === "webgl2" && this.canvas) {
      try {
        const gl = this.canvas.getContext("webgl2");
        if (gl) {
          this.activeBackend = "webgl2";
          this.gl2Renderer = createWebGL2ParticleRenderer(gl);
        } else {
          this.activeBackend = "canvas2d";
        }
      } catch {
        this.activeBackend = "canvas2d";
      }
    } else {
      this.activeBackend = selection.backend === "cpu" ? "canvas2d" : selection.backend;
    }

    if (config.device) {
      this.device = config.device;
    }

    // Add initial emitters
    if (config.emitters) {
      for (const e of config.emitters) {
        this.addEmitter(e);
      }
    }

    // Add initial behaviors
    if (config.behaviors) {
      for (const b of config.behaviors) {
        this.addBehavior(b);
      }
    }

    if (config.autoStart) {
      this.start();
    }
  }

  get state(): ParticleSystemState {
    return this.sysState;
  }

  get particleCount(): number {
    return this.pool.count;
  }

  get backend(): ComputeBackendType | "canvas2d" {
    return this.activeBackend;
  }

  get metrics(): ParticleSystemMetrics {
    const memoryBytes = this.pool.buffer.byteLength;
    return {
      particleCount: this.pool.count,
      maxParticles: this.maxParticles,
      emitterCount: this.emitters.length,
      behaviorCount: this.behaviors.length,
      fps: Math.round(this.fps),
      stepTimeMs: Math.round(this.stepTimeMs * 100) / 100,
      renderTimeMs: Math.round(this.renderTimeMs * 100) / 100,
      memoryBytes,
      backend: this.activeBackend,
    };
  }

  start(): void {
    if (this.sysState === "disposed") return;
    this.sysState = "running";
    this.lastTime = performance.now();
  }

  pause(): void {
    if (this.sysState === "running") {
      this.sysState = "paused";
    }
  }

  resume(): void {
    if (this.sysState === "paused") {
      this.sysState = "running";
      this.lastTime = performance.now();
    }
  }

  stop(): void {
    if (this.sysState !== "disposed") {
      this.sysState = "stopped";
    }
  }

  reset(): void {
    this.pool.clear();
    this.timeAccumulator = 0;
    this.lastTime = performance.now();
    this.sysState = "idle";
  }

  clear(): void {
    this.pool.clear();
  }

  burst(count: number, emitterIndexOrId: number | string = 0): number {
    if (this.sysState === "disposed" || this.emitters.length === 0) return 0;

    let targetEmitter: ParticleEmitter | undefined;
    if (typeof emitterIndexOrId === "number") {
      targetEmitter = this.emitters[emitterIndexOrId];
    } else {
      targetEmitter = this.emitters.find((e) => e.id === emitterIndexOrId);
    }

    if (!targetEmitter) {
      targetEmitter = this.emitters[0];
    }

    return targetEmitter ? targetEmitter.burst(count, this.pool, this.prng) : 0;
  }

  update(explicitDelta?: number): void {
    if (this.sysState !== "running" && explicitDelta === undefined) return;
    if (this.sysState === "paused" || this.sysState === "disposed") return;

    const startStep = performance.now();

    let dt = explicitDelta;
    if (typeof dt !== "number") {
      const now = startStep;
      dt = this.lastTime > 0 ? (now - this.lastTime) / 1000 : this.fixedTimestep;
      this.lastTime = now;
    }

    // Clamp dt to avoid huge jumps on tab switch
    dt = Math.min(Math.max(0, dt), 0.1);

    // Fixed timestep execution
    this.timeAccumulator += dt;
    while (this.timeAccumulator >= this.fixedTimestep) {
      stepParticleSimulation({
        pool: this.pool,
        emitters: this.emitters,
        behaviors: this.behaviors,
        dt: this.fixedTimestep,
        substeps: this.substeps,
        prng: this.prng,
      });
      this.timeAccumulator -= this.fixedTimestep;
    }

    this.stepTimeMs = performance.now() - startStep;

    // Track FPS
    this.frameCount++;
    const nowMs = Date.now();
    if (nowMs - this.lastFpsTime >= 1000) {
      this.fps = (this.frameCount * 1000) / (nowMs - this.lastFpsTime);
      this.frameCount = 0;
      this.lastFpsTime = nowMs;
    }
  }

  render(canvas?: HTMLCanvasElement, context?: unknown): void {
    if (this.sysState === "disposed") return;
    const targetCanvas = canvas || this.canvas;
    if (!targetCanvas) return;

    const startRender = performance.now();

    if (this.activeBackend === "webgl2" && this.gl2Renderer) {
      this.gl2Renderer.render(this.pool, this.renderOptions);
    } else {
      renderParticlesCanvas2D(this.pool, targetCanvas, this.renderOptions);
    }

    this.renderTimeMs = performance.now() - startRender;
  }

  addEmitter(emitter: ParticleEmitter | ParticleEmitterConfig): ParticleEmitter {
    const inst = "update" in emitter ? emitter : createParticleEmitter(emitter);
    this.emitters.push(inst);
    return inst;
  }

  removeEmitter(emitterId: string): boolean {
    const idx = this.emitters.findIndex((e) => e.id === emitterId);
    if (idx >= 0) {
      this.emitters.splice(idx, 1);
      return true;
    }
    return false;
  }

  addBehavior(behavior: ParticleBehavior): void {
    this.behaviors.push(behavior);
  }

  removeBehavior(behaviorId: string): boolean {
    const idx = this.behaviors.findIndex((b) => (b.id || b.type) === behaviorId);
    if (idx >= 0) {
      this.behaviors.splice(idx, 1);
      return true;
    }
    return false;
  }

  getEmitters(): readonly ParticleEmitter[] {
    return [...this.emitters];
  }

  getBehaviors(): readonly ParticleBehavior[] {
    return [...this.behaviors];
  }

  dispose(): void {
    if (this.sysState === "disposed") return;
    this.sysState = "disposed";
    this.pool.clear();
    this.emitters = [];
    this.behaviors = [];
    if (this.gl2Renderer) {
      this.gl2Renderer.dispose();
      this.gl2Renderer = null;
    }
    if (this.device) {
      this.device.dispose();
      this.device = null;
    }
    this.canvas = null;
  }
}

/**
 * Creates and initializes a complete ParticleSystem instance.
 */
export function createParticleSystem(config: ParticleSystemConfig = {}): ParticleSystem {
  return new ParticleSystemImpl(config);
}

/**
 * Appends a physical behavior to a ParticleSystem.
 */
export function addParticleBehavior(system: ParticleSystem, behavior: ParticleBehavior): void {
  system.addBehavior(behavior);
}

/**
 * Removes a behavior by ID from a ParticleSystem.
 */
export function removeParticleBehavior(system: ParticleSystem, behaviorId: string): boolean {
  return system.removeBehavior(behaviorId);
}

/**
 * Triggers an immediate burst of particles.
 */
export function emitParticles(system: ParticleSystem, count: number, emitterIndex = 0): void {
  system.burst(count, emitterIndex);
}

/**
 * Manually advances a ParticleSystem simulation by a delta time.
 */
export function updateParticleSystem(system: ParticleSystem, deltaTime?: number): void {
  system.update(deltaTime);
}

/**
 * Resets a ParticleSystem back to its initial zero-particle state.
 */
export function resetParticleSystem(system: ParticleSystem): void {
  system.reset();
}

/**
 * Disposes of all resources allocated by a ParticleSystem.
 */
export function disposeParticleSystem(system: ParticleSystem): void {
  system.dispose();
}
