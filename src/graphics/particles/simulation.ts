/**
 * AF Motion Advanced Particle Engine — Simulation Stepper
 *
 * Implements deterministic physics integration, substepping, lifetime decay,
 * property interpolation (size, opacity, rotation), and dead particle recycling.
 */

import {
  OFFSET_ACC_X,
  OFFSET_ACC_Y,
  OFFSET_ACC_Z,
  OFFSET_ANGULAR_VEL,
  OFFSET_END_OPACITY,
  OFFSET_END_SIZE,
  OFFSET_LIFE,
  OFFSET_MAX_LIFE,
  OFFSET_OPACITY,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
  OFFSET_ROTATION,
  OFFSET_SIZE,
  OFFSET_START_OPACITY,
  OFFSET_START_SIZE,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
  OFFSET_VEL_Z,
} from "./data-layout.js";
import { applyParticleBehaviors } from "./behaviors.js";
import type { ParticleBehavior, ParticleDataPool, ParticleEmitter } from "./types.js";

export interface SimulationStepOptions {
  readonly pool: ParticleDataPool;
  readonly emitters: readonly ParticleEmitter[];
  readonly behaviors: readonly ParticleBehavior[];
  readonly dt: number;
  readonly substeps?: number;
  readonly prng: () => number;
}

/**
 * Performs a complete simulation update cycle (spawning, behaviors, integration, recycling).
 */
export function stepParticleSimulation(options: SimulationStepOptions): void {
  const { pool, emitters, behaviors, dt, substeps = 1, prng } = options;
  if (dt <= 0) return;

  const actualSubsteps = Math.max(1, Math.min(10, substeps));
  const subDt = dt / actualSubsteps;

  for (let s = 0; s < actualSubsteps; s++) {
    // 1. Continuous emitter spawning
    for (const emitter of emitters) {
      emitter.update(subDt, pool, prng);
    }

    // 2. Composable behaviors (gravity, attraction, drag, turbulence, etc.)
    applyParticleBehaviors(pool, behaviors, subDt);

    // 3. Physics integration, property evolution, and lifetime decay
    integrateParticles(pool, subDt);
  }
}

/**
 * Updates positions, velocities, lifetimes, sizes, opacities, and recycles dead particles.
 */
export function integrateParticles(pool: ParticleDataPool, dt: number): void {
  const activeIndices = pool.getActiveIndices();
  const count = activeIndices.length;
  if (count === 0) return;

  const buf = pool.buffer;
  const stride = pool.stride;

  // Track dead slots to recycle after integration loop to avoid mutating activeIndices mid-loop
  const toKill: number[] = [];

  for (let i = 0; i < count; i++) {
    const slot = activeIndices[i]!;
    const base = slot * stride;

    let life = buf[base + OFFSET_LIFE]! - dt;
    if (life <= 0) {
      toKill.push(slot);
      continue;
    }
    buf[base + OFFSET_LIFE] = life;

    const maxLife = buf[base + OFFSET_MAX_LIFE]! || 1;
    const age = Math.min(1, Math.max(0, 1 - life / maxLife)); // 0 = spawn, 1 = death

    // Accelerate velocities
    const ax = buf[base + OFFSET_ACC_X]!;
    const ay = buf[base + OFFSET_ACC_Y]!;
    const az = buf[base + OFFSET_ACC_Z]!;

    let vx = buf[base + OFFSET_VEL_X]! + ax * dt;
    let vy = buf[base + OFFSET_VEL_Y]! + ay * dt;
    let vz = buf[base + OFFSET_VEL_Z]! + az * dt;

    buf[base + OFFSET_VEL_X] = vx;
    buf[base + OFFSET_VEL_Y] = vy;
    buf[base + OFFSET_VEL_Z] = vz;

    // Translate positions
    buf[base + OFFSET_POS_X]! += vx * dt;
    buf[base + OFFSET_POS_Y]! += vy * dt;
    buf[base + OFFSET_POS_Z]! += vz * dt;

    // Reset accumulated acceleration
    buf[base + OFFSET_ACC_X] = 0;
    buf[base + OFFSET_ACC_Y] = 0;
    buf[base + OFFSET_ACC_Z] = 0;

    // Evolve rotation
    const angularVel = buf[base + OFFSET_ANGULAR_VEL]!;
    buf[base + OFFSET_ROTATION]! += angularVel * dt;

    // Interpolate size over lifetime
    const startSize = buf[base + OFFSET_START_SIZE]!;
    const endSize = buf[base + OFFSET_END_SIZE]!;
    buf[base + OFFSET_SIZE] = startSize + (endSize - startSize) * age;

    // Interpolate opacity over lifetime
    const startOpacity = buf[base + OFFSET_START_OPACITY]!;
    const endOpacity = buf[base + OFFSET_END_OPACITY]!;
    buf[base + OFFSET_OPACITY] = startOpacity + (endOpacity - startOpacity) * age;
  }

  // Recycle dead particles
  for (let i = 0; i < toKill.length; i++) {
    pool.kill(toKill[i]!);
  }
}
