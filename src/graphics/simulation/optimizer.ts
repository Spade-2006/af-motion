/**
 * AF Motion Simulation Performance Optimizer & Benchmarking
 *
 * Buffer pooling, adaptive quality management, and benchmarks
 * across particle, fluid, spatial field, and multi-system workloads.
 */

import { createParticleDataPool } from "../particles/data-layout.js";
import { createFluidSolver } from "../fluid/solver.js";
import { createFluidGrid } from "../fluid/grid.js";
import { SpatialFieldGrid } from "../particle-fields/spatial-index.js";
import { AttractionForceField, VortexForceField } from "../particle-fields/forces.js";
import type { SimulationQuality } from "./types.js";

/**
 * High-performance TypedArray recycler to eliminate garbage collection
 * overhead during continuous simulation calculations.
 */
export class TypedArrayPool {
  private floatPool: Map<number, Float32Array[]> = new Map();
  private uintPool: Map<number, Uint32Array[]> = new Map();
  private maxPooledPerSize = 8;

  /**
   * Acquire a Float32Array of at least the requested length.
   */
  acquireFloat32(length: number): Float32Array {
    const bucket = this.floatPool.get(length);
    if (bucket && bucket.length > 0) {
      return bucket.pop()!;
    }
    return new Float32Array(length);
  }

  /**
   * Return a Float32Array back to the pool for reuse.
   */
  releaseFloat32(arr: Float32Array): void {
    const len = arr.length;
    let bucket = this.floatPool.get(len);
    if (!bucket) {
      bucket = [];
      this.floatPool.set(len, bucket);
    }
    if (bucket.length < this.maxPooledPerSize) {
      bucket.push(arr);
    }
  }

  /**
   * Acquire a Uint32Array of at least the requested length.
   */
  acquireUint32(length: number): Uint32Array {
    const bucket = this.uintPool.get(length);
    if (bucket && bucket.length > 0) {
      return bucket.pop()!;
    }
    return new Uint32Array(length);
  }

  /**
   * Return a Uint32Array back to the pool for reuse.
   */
  releaseUint32(arr: Uint32Array): void {
    const len = arr.length;
    let bucket = this.uintPool.get(len);
    if (!bucket) {
      bucket = [];
      this.uintPool.set(len, bucket);
    }
    if (bucket.length < this.maxPooledPerSize) {
      bucket.push(arr);
    }
  }

  /**
   * Clear all pooled buffers to free memory.
   */
  clear(): void {
    this.floatPool.clear();
    this.uintPool.clear();
  }
}

/**
 * Global shared buffer pool instance.
 */
export const sharedBufferPool = new TypedArrayPool();

/**
 * Adaptive quality controller that monitors frame times and adjusts quality levels.
 */
export class AdaptiveQualityController {
  private currentQuality: SimulationQuality;
  private frameTimes: number[] = [];
  private maxSamples = 30;
  private lastAdjustmentTime = 0;
  private cooldownMs = 1000;

  constructor(initialQuality: SimulationQuality = "high") {
    this.currentQuality = initialQuality;
  }

  get quality(): SimulationQuality {
    return this.currentQuality;
  }

  recordFrame(frameDurationMs: number): SimulationQuality {
    this.frameTimes.push(frameDurationMs);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.lastAdjustmentTime < this.cooldownMs) {
      return this.currentQuality;
    }

    if (this.frameTimes.length >= 15) {
      const sum = this.frameTimes.reduce((acc, t) => acc + t, 0);
      const avg = sum / this.frameTimes.length;

      // > 22ms (~45 FPS) -> downgrade
      if (avg > 22) {
        if (this.currentQuality === "ultra") this.currentQuality = "high";
        else if (this.currentQuality === "high") this.currentQuality = "medium";
        else if (this.currentQuality === "medium") this.currentQuality = "low";
        this.lastAdjustmentTime = now;
        this.frameTimes = [];
      }
      // < 9ms (~110 FPS) -> upgrade
      else if (avg < 9) {
        if (this.currentQuality === "low") this.currentQuality = "medium";
        else if (this.currentQuality === "medium") this.currentQuality = "high";
        else if (this.currentQuality === "high") this.currentQuality = "ultra";
        this.lastAdjustmentTime = now;
        this.frameTimes = [];
      }
    }

    return this.currentQuality;
  }

  setQuality(quality: SimulationQuality): void {
    this.currentQuality = quality;
    this.frameTimes = [];
  }
}

// -----------------------------------------------------------------------------
// BENCHMARKING SUITE
// -----------------------------------------------------------------------------

export interface ParticleBenchmarkResult {
  particleCount: number;
  steps: number;
  durationMs: number;
  avgStepMs: number;
  particlesPerSec: number;
}

export interface FluidBenchmarkResult {
  gridResolution: number;
  cellCount: number;
  steps: number;
  durationMs: number;
  avgStepMs: number;
  cellsPerSec: number;
}

export interface SpatialBenchmarkResult {
  particleCount: number;
  forceFieldCount: number;
  steps: number;
  durationMs: number;
  avgStepMs: number;
  queriesPerSec: number;
}

export interface MultiSimBenchmarkResult {
  particleCount: number;
  fluidResolution: number;
  steps: number;
  durationMs: number;
  avgStepMs: number;
  fps: number;
}

/**
 * Benchmark particle buffer layout simulation at various particle counts.
 */
export function benchmarkParticleSimulation(
  particleCount: number,
  steps = 60
): ParticleBenchmarkResult {
  const pool = createParticleDataPool(particleCount);
  for (let i = 0; i < particleCount; i++) {
    pool.spawn({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      vx: Math.random() * 0.1 - 0.05,
      vy: Math.random() * 0.1 - 0.05,
      vz: Math.random() * 0.1 - 0.05,
      ax: 0,
      ay: -9.8,
      az: 0,
      life: 10.0,
      maxLife: 10.0,
      startSize: 0.01,
      endSize: 0.01,
      startRotation: 0,
      angularVelocity: 0,
      startOpacity: 1.0,
      endOpacity: 1.0,
      startColor: [1, 1, 1, 1],
      endColor: [1, 1, 1, 1],
      mass: 1.0,
    });
  }

  const dt = 1 / 60;
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let s = 0; s < steps; s++) {
    const buf = pool.buffer;
    const count = pool.count;
    const stride = pool.stride;
    for (let i = 0; i < count; i++) {
      const base = i * stride;
      // Position update
      buf[base] += buf[base + 3] * dt;
      buf[base + 1] += buf[base + 4] * dt;
      buf[base + 2] += buf[base + 5] * dt;
      // Gravity acceleration
      buf[base + 4] -= 9.8 * dt;
      // Age update
      buf[base + 10] += dt;
    }
  }

  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = Math.max(0.001, end - start);
  const avgStepMs = durationMs / steps;
  const particlesPerSec = (particleCount * steps) / (durationMs / 1000);

  return {
    particleCount,
    steps,
    durationMs,
    avgStepMs,
    particlesPerSec,
  };
}

/**
 * Benchmark Eulerian fluid grid simulation at given grid resolution.
 */
export function benchmarkFluidSimulation(
  gridResolution: number,
  steps = 30
): FluidBenchmarkResult {
  const grid = createFluidGrid(gridResolution, gridResolution);
  const solver = createFluidSolver({
    viscosity: 0.0001,
    dissipation: 0.99,
    velocityDissipation: 0.99,
    iterations: 10,
  });

  // Inject initial impulse
  const midX = Math.floor(gridResolution / 2);
  const midY = Math.floor(gridResolution / 2);
  const idx = midY * gridResolution + midX;
  grid.density[idx] = 1.0;
  grid.u[idx] = 5.0;
  grid.v[idx] = 5.0;

  const dt = 1 / 60;
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let s = 0; s < steps; s++) {
    solver.step(grid, dt, [], s * dt);
  }

  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = Math.max(0.001, end - start);
  const avgStepMs = durationMs / steps;
  const cellCount = gridResolution * gridResolution;
  const cellsPerSec = (cellCount * steps) / (durationMs / 1000);

  return {
    gridResolution,
    cellCount,
    steps,
    durationMs,
    avgStepMs,
    cellsPerSec,
  };
}

/**
 * Benchmark spatial hash grid queries for particles under localized force fields.
 */
export function benchmarkSpatialQueries(
  particleCount: number,
  forceFieldCount: number,
  steps = 60
): SpatialBenchmarkResult {
  const grid = new SpatialFieldGrid(0.2);
  const fields: (AttractionForceField | VortexForceField)[] = [];

  for (let i = 0; i < forceFieldCount; i++) {
    const f =
      i % 2 === 0
        ? new AttractionForceField({
            id: `attr_${i}`,
            type: "attraction",
            position: [Math.random() * 2 - 1, Math.random() * 2 - 1, 0],
            strength: 5,
            radius: 0.4,
          })
        : new VortexForceField({
            id: `vort_${i}`,
            type: "vortex",
            position: [Math.random() * 2 - 1, Math.random() * 2 - 1, 0],
            strength: 5,
            radius: 0.4,
          });
    fields.push(f);
    grid.insert(f);
  }

  // Pre-generate particle positions
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = Math.random() * 2 - 1;
  }

  const start = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < particleCount; i++) {
      const px = positions[i * 3]!;
      const py = positions[i * 3 + 1]!;
      const pz = positions[i * 3 + 2]!;
      const candidates = grid.query(px, py, pz);
      // Evaluate candidate fields
      for (const field of candidates) {
        field.evaluate(px, py, pz, 0, 0, 0, 1.0, 0);
      }
    }
  }

  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = Math.max(0.001, end - start);
  const avgStepMs = durationMs / steps;
  const queriesPerSec = (particleCount * steps) / (durationMs / 1000);

  return {
    particleCount,
    forceFieldCount,
    steps,
    durationMs,
    avgStepMs,
    queriesPerSec,
  };
}

/**
 * Benchmark multiple simultaneous simulations (particles + fluid dynamics).
 */
export function benchmarkMultiSimulation(
  particleCount: number,
  fluidResolution: number,
  steps = 30
): MultiSimBenchmarkResult {
  const pPool = createParticleDataPool(particleCount);
  for (let i = 0; i < particleCount; i++) {
    pPool.spawn({
      x: 0,
      y: 0,
      z: 0,
      vx: 0.1,
      vy: 0.1,
      vz: 0,
      ax: 0,
      ay: 0,
      az: 0,
      life: 5,
      maxLife: 5,
      startSize: 0.01,
      endSize: 0.01,
      startRotation: 0,
      angularVelocity: 0,
      startOpacity: 1,
      endOpacity: 1,
      startColor: [1, 1, 1, 1],
      endColor: [1, 1, 1, 1],
      mass: 1,
    });
  }

  const fGrid = createFluidGrid(fluidResolution, fluidResolution);
  const fSolver = createFluidSolver();

  const dt = 1 / 60;
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();

  for (let s = 0; s < steps; s++) {
    // 1. Fluid step
    fSolver.step(fGrid, dt, [], s * dt);

    // 2. Particle step
    const buf = pPool.buffer;
    const count = pPool.count;
    const stride = pPool.stride;
    for (let i = 0; i < count; i++) {
      const base = i * stride;
      buf[base]! += buf[base + 3]! * dt;
      buf[base + 1]! += buf[base + 4]! * dt;
    }
  }

  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  const durationMs = Math.max(0.001, end - start);
  const avgStepMs = durationMs / steps;
  const fps = avgStepMs > 0 ? 1000 / avgStepMs : 60;

  return {
    particleCount,
    fluidResolution,
    steps,
    durationMs,
    avgStepMs,
    fps,
  };
}
