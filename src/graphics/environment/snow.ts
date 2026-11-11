/**
 * AF Motion Environmental Simulation Engine — Snow Subsystem
 *
 * Implements realistic snowflake simulation with wind flutter, turbulence drift,
 * size distribution, and ground accumulation visualization.
 */

import {
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_ROTATION,
  OFFSET_SIZE,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
} from "../particles/data-layout.js";
import { createParticleDataPool } from "../particles/data-layout.js";
import type { ParticleDataPool } from "../particles/types.js";
import type {
  EnvironmentalEffect,
  EnvironmentalEffectType,
  EnvironmentSimulation,
  SnowConfig,
} from "./types.js";

let snowIdSeq = 0;

export class SnowEffectImpl implements EnvironmentalEffect {
  readonly id: string;
  readonly type: EnvironmentalEffectType = "snow";
  enabled = true;
  intensity: number;

  flakeSize: number;
  fallSpeed: number;
  driftAmount: number;
  turbulence: number;
  groundY: number;
  accumulationEnabled: boolean;
  color: readonly [number, number, number, number];

  private pool: ParticleDataPool;
  private maxFlakes: number;
  private spawnAcc = 0;
  private accumulationBins = new Float32Array(64); // 64 bins across screen width

  constructor(config: SnowConfig = {}) {
    this.id = `snow-${++snowIdSeq}`;
    this.intensity = Math.max(0, config.intensity ?? 1.0);
    this.flakeSize = Math.max(1, config.flakeSize ?? 2.5);
    this.fallSpeed = Math.max(10, config.fallSpeed ?? 80);
    this.driftAmount = Math.max(0, config.driftAmount ?? 0.6);
    this.turbulence = Math.max(0, config.turbulence ?? 0.4);
    this.groundY = config.groundY ?? 0.96;
    this.accumulationEnabled = config.accumulationEnabled ?? true;
    this.color = config.color ?? [240, 245, 255, 0.85];
    this.maxFlakes = Math.max(50, config.maxFlakes ?? 1000);

    this.pool = createParticleDataPool(this.maxFlakes);
  }

  update(dt: number, time: number, env: EnvironmentSimulation): void {
    if (!this.enabled || this.intensity <= 0 || dt <= 0) return;

    const effectiveIntensity = this.intensity * env.globalIntensity;
    const [windX] = env.wind.sampleWind(0.5, 0.5, 0, time);

    // 1. Spawn flakes
    const spawnRate = this.maxFlakes * 0.5 * effectiveIntensity;
    this.spawnAcc += spawnRate * dt;
    const toSpawn = Math.min(Math.floor(this.spawnAcc), 60);
    this.spawnAcc -= toSpawn;

    const colNorm = [
      this.color[0] / 255,
      this.color[1] / 255,
      this.color[2] / 255,
      this.color[3],
    ] as const;

    for (let i = 0; i < toSpawn; i++) {
      const sizeMult = 0.5 + Math.random() * 1.0;
      const size = this.flakeSize * sizeMult;

      const slot = this.pool.spawn({
        x: Math.random() * 1.3 - 0.15,
        y: -0.05 - Math.random() * 0.05,
        z: Math.random(),
        vx: windX * this.driftAmount * 0.2,
        vy: this.fallSpeed * sizeMult * 0.0012 * (0.8 + Math.random() * 0.4),
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life: 10.0,
        maxLife: 10.0,
        startSize: size,
        endSize: size,
        startRotation: Math.random() * Math.PI * 2,
        angularVelocity: 0,
        startOpacity: this.color[3] * (0.6 + sizeMult * 0.4),
        endOpacity: this.color[3] * (0.6 + sizeMult * 0.4),
        startColor: [colNorm[0], colNorm[1], colNorm[2], colNorm[3]],
        endColor: [colNorm[0], colNorm[1], colNorm[2], colNorm[3]],
        mass: 0.2,
      });

      if (slot < 0) break;
    }

    // 2. Step flakes
    const activeIndices = this.pool.getActiveIndices();
    const buf = this.pool.buffer;
    const stride = this.pool.stride;

    for (let i = 0; i < activeIndices.length; i++) {
      const idx = activeIndices[i]!;
      const base = idx * stride;

      const px = buf[base + OFFSET_POS_X]!;
      const py = buf[base + OFFSET_POS_Y]!;
      const vy = buf[base + OFFSET_VEL_Y]!;
      const phase = buf[base + OFFSET_ROTATION]!;

      // Fluttering horizontal movement
      const flutter = Math.sin(time * 3.0 + phase) * this.driftAmount * 0.05;
      const vx = buf[base + OFFSET_VEL_X]! + flutter;

      const npx = px + vx * dt;
      const npy = py + vy * dt;
      buf[base + OFFSET_POS_X] = npx;
      buf[base + OFFSET_POS_Y] = npy;

      // Ground accumulation
      if (npy >= this.groundY) {
        if (this.accumulationEnabled && npx >= 0 && npx <= 1) {
          const binIdx = Math.min(
            this.accumulationBins.length - 1,
            Math.max(0, Math.floor(npx * this.accumulationBins.length)),
          );
          this.accumulationBins[binIdx] = Math.min(
            0.08,
            this.accumulationBins[binIdx]! + 0.0005,
          );
        }
        this.pool.kill(idx);
      } else if (npy > 1.05 || npx < -0.2 || npx > 1.2) {
        this.pool.kill(idx);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void {
    if (!this.enabled || this.intensity <= 0) return;
    if (!("beginPath" in ctx)) return;

    const c2d = ctx as CanvasRenderingContext2D;
    const [r, g, b, a] = this.color;
    c2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;

    // Draw snowflakes
    const activeIndices = this.pool.getActiveIndices();
    const buf = this.pool.buffer;
    const stride = this.pool.stride;

    c2d.beginPath();
    for (let i = 0; i < activeIndices.length; i++) {
      const idx = activeIndices[i]!;
      const base = idx * stride;

      const px = buf[base + OFFSET_POS_X]! * targetW;
      const py = buf[base + OFFSET_POS_Y]! * targetH;
      const radius = buf[base + OFFSET_SIZE]!;

      c2d.moveTo(px + radius, py);
      c2d.arc(px, py, radius, 0, Math.PI * 2);
    }
    c2d.fill();

    // Draw ground accumulation if enabled
    if (this.accumulationEnabled) {
      c2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.75})`;
      c2d.beginPath();
      const binWidth = targetW / this.accumulationBins.length;
      c2d.moveTo(0, targetH);

      for (let bIdx = 0; bIdx < this.accumulationBins.length; bIdx++) {
        const heightNorm = this.accumulationBins[bIdx]!;
        const binX = bIdx * binWidth;
        const binY = targetH - heightNorm * targetH;
        c2d.lineTo(binX, binY);
      }
      c2d.lineTo(targetW, targetH);
      c2d.closePath();
      c2d.fill();
    }
  }

  get activeFlakes(): number {
    return this.pool.count;
  }

  dispose(): void {
    this.pool.clear();
    this.accumulationBins.fill(0);
  }
}

export function createSnowEffect(config?: SnowConfig): SnowEffectImpl {
  return new SnowEffectImpl(config);
}
