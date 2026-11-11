/**
 * AF Motion Environmental Simulation Engine — Fire & Smoke Subsystem
 *
 * Implements high-temperature buoyant flame particles with thermal blackbody-style
 * color ramps, upward velocity convection, and fluid/particle-coupled smoke dissipation.
 */

import {
  OFFSET_COLOR_A,
  OFFSET_COLOR_B,
  OFFSET_COLOR_G,
  OFFSET_COLOR_R,
  OFFSET_LIFE,
  OFFSET_MAX_LIFE,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_SIZE,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
} from "../particles/data-layout.js";
import { createParticleDataPool } from "../particles/data-layout.js";
import type { ParticleDataPool } from "../particles/types.js";
import type {
  EnvironmentalEffect,
  EnvironmentalEffectType,
  EnvironmentalVector3Tuple,
  EnvironmentSimulation,
  FireConfig,
} from "./types.js";

let fireIdSeq = 0;

export class FireSmokeEffectImpl implements EnvironmentalEffect {
  readonly id: string;
  readonly type: EnvironmentalEffectType = "fire";
  enabled = true;
  intensity: number;

  position: EnvironmentalVector3Tuple;
  radius: number;
  flameHeight: number;
  turbulence: number;
  smokeEnabled: boolean;
  smokeDensity: number;
  smokeColor: readonly [number, number, number];
  fluidCoupled: boolean;

  private firePool: ParticleDataPool;
  private smokePool: ParticleDataPool;
  private spawnAcc = 0;

  constructor(config: FireConfig = {}) {
    this.id = `fire-${++fireIdSeq}`;
    this.intensity = Math.max(0, config.intensity ?? 1.0);
    this.position = config.position ?? [0.5, 0.85, 0];
    this.radius = Math.max(0.01, config.radius ?? 0.06);
    this.flameHeight = Math.max(0.05, config.flameHeight ?? 0.25);
    this.turbulence = Math.max(0, config.turbulence ?? 0.5);
    this.smokeEnabled = config.smokeEnabled ?? true;
    this.smokeDensity = Math.max(0, config.smokeDensity ?? 0.6);
    this.smokeColor = config.smokeColor ?? [60, 65, 75];
    this.fluidCoupled = config.fluidCoupled ?? false;

    this.firePool = createParticleDataPool(600);
    this.smokePool = createParticleDataPool(600);
  }

  update(dt: number, time: number, env: EnvironmentSimulation): void {
    if (!this.enabled || this.intensity <= 0 || dt <= 0) return;

    const [windX] = env.wind.sampleWind(this.position[0], this.position[1], 0, time);
    const spawnRate = 250 * this.intensity * env.globalIntensity;
    this.spawnAcc += spawnRate * dt;
    const toSpawn = Math.min(Math.floor(this.spawnAcc), 30);
    this.spawnAcc -= toSpawn;

    // 1. Spawn flame particles
    for (let i = 0; i < toSpawn; i++) {
      const rOffset = (Math.random() - 0.5) * this.radius * 2;
      const upwardSpeed = (0.2 + Math.random() * 0.3) * (this.flameHeight / 0.25);
      const life = 0.4 + Math.random() * 0.3;
      const size = 4 + Math.random() * 6;

      const slot = this.firePool.spawn({
        x: this.position[0] + rOffset,
        y: this.position[1] + (Math.random() - 0.5) * 0.02,
        z: this.position[2],
        vx: (Math.random() - 0.5) * 0.05 + windX * 0.1,
        vy: -upwardSpeed,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life,
        maxLife: life,
        startSize: size,
        endSize: size * 0.5,
        startRotation: 0,
        angularVelocity: 0,
        startOpacity: 0.9,
        endOpacity: 0,
        startColor: [1.0, 0.95, 0.6, 0.9],
        endColor: [0.8, 0.2, 0.0, 0.1],
        mass: 0.1,
      });

      if (slot < 0) break;
    }

    // 2. Step fire particles
    const fireIndices = this.firePool.getActiveIndices();
    const fireBuf = this.firePool.buffer;
    const fireStride = this.firePool.stride;

    for (let i = 0; i < fireIndices.length; i++) {
      const idx = fireIndices[i]!;
      const base = idx * fireStride;

      const life = fireBuf[base + OFFSET_LIFE]! - dt;
      if (life <= 0) {
        // Spawn smoke on fire death
        if (this.smokeEnabled && Math.random() < this.smokeDensity) {
          this.spawnSmoke(
            fireBuf[base + OFFSET_POS_X]!,
            fireBuf[base + OFFSET_POS_Y]!,
            windX,
          );
        }
        this.firePool.kill(idx);
        continue;
      }
      fireBuf[base + OFFSET_LIFE] = life;

      const normLife = life / fireBuf[base + OFFSET_MAX_LIFE]!;

      // Color ramp from white-yellow -> bright orange -> dark red
      if (normLife > 0.6) {
        fireBuf[base + OFFSET_COLOR_R] = 1.0;
        fireBuf[base + OFFSET_COLOR_G] = 0.7 + (normLife - 0.6) * 0.6;
        fireBuf[base + OFFSET_COLOR_B] = (normLife - 0.6) * 1.5;
      } else {
        fireBuf[base + OFFSET_COLOR_R] = 0.8 + normLife * 0.4;
        fireBuf[base + OFFSET_COLOR_G] = normLife * 0.9;
        fireBuf[base + OFFSET_COLOR_B] = 0;
      }
      fireBuf[base + OFFSET_COLOR_A] = normLife * 0.85;

      // Turbulence jitter
      const turbX = Math.sin(time * 12 + idx) * this.turbulence * 0.05;
      fireBuf[base + OFFSET_POS_X]! += (fireBuf[base + OFFSET_VEL_X]! + turbX) * dt;
      fireBuf[base + OFFSET_POS_Y]! += fireBuf[base + OFFSET_VEL_Y]! * dt;
    }

    // 3. Step smoke particles
    if (this.smokeEnabled) {
      const smokeIndices = this.smokePool.getActiveIndices();
      const smokeBuf = this.smokePool.buffer;
      const smokeStride = this.smokePool.stride;

      for (let i = 0; i < smokeIndices.length; i++) {
        const idx = smokeIndices[i]!;
        const base = idx * smokeStride;

        const life = smokeBuf[base + OFFSET_LIFE]! - dt;
        if (life <= 0) {
          this.smokePool.kill(idx);
          continue;
        }
        smokeBuf[base + OFFSET_LIFE] = life;

        const normLife = life / smokeBuf[base + OFFSET_MAX_LIFE]!;
        smokeBuf[base + OFFSET_SIZE]! += dt * 8;
        smokeBuf[base + OFFSET_COLOR_A] = normLife * 0.35 * this.smokeDensity;

        smokeBuf[base + OFFSET_POS_X]! += smokeBuf[base + OFFSET_VEL_X]! * dt;
        smokeBuf[base + OFFSET_POS_Y]! += smokeBuf[base + OFFSET_VEL_Y]! * dt;
      }
    }
  }

  private spawnSmoke(x: number, y: number, windX: number): void {
    const life = 1.2 + Math.random() * 0.8;
    const [sr, sg, sb] = this.smokeColor;

    this.smokePool.spawn({
      x,
      y,
      z: 0,
      vx: windX * 0.15 + (Math.random() - 0.5) * 0.03,
      vy: -0.08 - Math.random() * 0.05,
      vz: 0,
      ax: 0,
      ay: 0,
      az: 0,
      life,
      maxLife: life,
      startSize: 6 + Math.random() * 4,
      endSize: 18,
      startRotation: 0,
      angularVelocity: 0,
      startOpacity: 0.35,
      endOpacity: 0,
      startColor: [sr / 255, sg / 255, sb / 255, 0.35],
      endColor: [sr / 255, sg / 255, sb / 255, 0],
      mass: 0.05,
    });
  }

  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void {
    if (!this.enabled || this.intensity <= 0) return;
    if (!("beginPath" in ctx)) return;

    const c2d = ctx as CanvasRenderingContext2D;
    c2d.save();

    // 1. Draw smoke puffs (behind flames)
    if (this.smokeEnabled) {
      const smokeIndices = this.smokePool.getActiveIndices();
      const smokeBuf = this.smokePool.buffer;
      const smokeStride = this.smokePool.stride;
      const [sr, sg, sb] = this.smokeColor;

      for (let i = 0; i < smokeIndices.length; i++) {
        const idx = smokeIndices[i]!;
        const base = idx * smokeStride;

        const px = smokeBuf[base + OFFSET_POS_X]! * targetW;
        const py = smokeBuf[base + OFFSET_POS_Y]! * targetH;
        const radius = smokeBuf[base + OFFSET_SIZE]!;
        const alpha = smokeBuf[base + OFFSET_COLOR_A]!;

        c2d.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha})`;
        c2d.beginPath();
        c2d.arc(px, py, radius, 0, Math.PI * 2);
        c2d.fill();
      }
    }

    // 2. Draw fire particles with additive blending
    c2d.globalCompositeOperation = "lighter";
    const fireIndices = this.firePool.getActiveIndices();
    const fireBuf = this.firePool.buffer;
    const fireStride = this.firePool.stride;

    for (let i = 0; i < fireIndices.length; i++) {
      const idx = fireIndices[i]!;
      const base = idx * fireStride;

      const px = fireBuf[base + OFFSET_POS_X]! * targetW;
      const py = fireBuf[base + OFFSET_POS_Y]! * targetH;
      const radius = fireBuf[base + OFFSET_SIZE]!;

      const r = Math.floor(fireBuf[base + OFFSET_COLOR_R]! * 255);
      const g = Math.floor(fireBuf[base + OFFSET_COLOR_G]! * 255);
      const b = Math.floor(fireBuf[base + OFFSET_COLOR_B]! * 255);
      const a = fireBuf[base + OFFSET_COLOR_A]!;

      c2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      c2d.beginPath();
      c2d.arc(px, py, radius, 0, Math.PI * 2);
      c2d.fill();
    }

    c2d.restore();
  }

  get activeFireParticles(): number {
    return this.firePool.count;
  }

  get activeSmokeParticles(): number {
    return this.smokePool.count;
  }

  dispose(): void {
    this.firePool.clear();
    this.smokePool.clear();
  }
}

export function createFireEffect(config?: FireConfig): FireSmokeEffectImpl {
  return new FireSmokeEffectImpl(config);
}
