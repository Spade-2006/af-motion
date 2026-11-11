/**
 * AF Motion Environmental Simulation Engine — Rain Subsystem
 *
 * Implements high-performance rain simulation with wind drift, droplet size variation,
 * ground impact detection, and dynamic splash particles using Prompt 118 particle infrastructure.
 */

import {
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
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
  RainConfig,
} from "./types.js";

let rainIdSeq = 0;

export class RainEffectImpl implements EnvironmentalEffect {
  readonly id: string;
  readonly type: EnvironmentalEffectType = "rain";
  enabled = true;
  intensity: number;

  dropletSize: number;
  dropletLength: number;
  fallSpeed: number;
  windInfluence: number;
  splashesEnabled: boolean;
  splashCount: number;
  groundY: number;
  color: readonly [number, number, number, number];

  private rainPool: ParticleDataPool;
  private splashPool: ParticleDataPool;
  private maxDroplets: number;
  private spawnAcc = 0;

  constructor(config: RainConfig = {}) {
    this.id = `rain-${++rainIdSeq}`;
    this.intensity = Math.max(0, config.intensity ?? 1.0);
    this.dropletSize = Math.max(0.5, config.dropletSize ?? 1.5);
    this.dropletLength = Math.max(2, config.dropletLength ?? 14);
    this.fallSpeed = Math.max(100, config.fallSpeed ?? 550);
    this.windInfluence = Math.max(0, config.windInfluence ?? 1.0);
    this.splashesEnabled = config.splashesEnabled ?? true;
    this.splashCount = Math.max(1, config.splashCount ?? 3);
    this.groundY = config.groundY ?? 0.95; // 95% of screen height
    this.color = config.color ?? [180, 210, 255, 0.65];
    this.maxDroplets = Math.max(50, config.maxDroplets ?? 1500);

    this.rainPool = createParticleDataPool(this.maxDroplets);
    this.splashPool = createParticleDataPool(this.maxDroplets * 2);
  }

  update(dt: number, time: number, env: EnvironmentSimulation): void {
    if (!this.enabled || this.intensity <= 0 || dt <= 0) return;

    const effectiveIntensity = this.intensity * env.globalIntensity;
    const [windX] = env.wind.sampleWind(0.5, 0.5, 0, time);

    // 1. Spawn new rain droplets based on intensity
    const spawnRate = this.maxDroplets * 1.5 * effectiveIntensity;
    this.spawnAcc += spawnRate * dt;
    const toSpawn = Math.min(Math.floor(this.spawnAcc), 100);
    this.spawnAcc -= toSpawn;

    const colNorm = [
      this.color[0] / 255,
      this.color[1] / 255,
      this.color[2] / 255,
      this.color[3],
    ] as const;

    for (let i = 0; i < toSpawn; i++) {
      const speedVar = 0.8 + Math.random() * 0.4;
      const sizeVar = this.dropletSize * (0.8 + Math.random() * 0.4);

      const slot = this.rainPool.spawn({
        x: Math.random() * 1.4 - 0.2,
        y: -0.05 - Math.random() * 0.1,
        z: Math.random(),
        vx: windX * this.windInfluence * 0.4,
        vy: this.fallSpeed * speedVar * 0.0015,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life: 2.0,
        maxLife: 2.0,
        startSize: sizeVar,
        endSize: sizeVar,
        startRotation: 0,
        angularVelocity: 0,
        startOpacity: this.color[3],
        endOpacity: this.color[3],
        startColor: [colNorm[0], colNorm[1], colNorm[2], colNorm[3]],
        endColor: [colNorm[0], colNorm[1], colNorm[2], colNorm[3]],
        mass: 1,
      });

      if (slot < 0) break;
    }

    // 2. Step rain droplets
    const rainIndices = this.rainPool.getActiveIndices();
    const rainBuf = this.rainPool.buffer;
    const stride = this.rainPool.stride;

    for (let i = 0; i < rainIndices.length; i++) {
      const idx = rainIndices[i]!;
      const base = idx * stride;

      const px = rainBuf[base + OFFSET_POS_X]!;
      const py = rainBuf[base + OFFSET_POS_Y]!;
      const vx = rainBuf[base + OFFSET_VEL_X]!;
      const vy = rainBuf[base + OFFSET_VEL_Y]!;

      // Update position
      const npx = px + vx * dt;
      const npy = py + vy * dt;
      rainBuf[base + OFFSET_POS_X] = npx;
      rainBuf[base + OFFSET_POS_Y] = npy;

      // Ground impact check
      if (npy >= this.groundY) {
        if (this.splashesEnabled) {
          this.spawnSplash(npx, this.groundY, rainBuf[base + OFFSET_POS_Z]!);
        }
        this.rainPool.kill(idx);
      } else if (npy > 1.1 || npx < -0.3 || npx > 1.3) {
        this.rainPool.kill(idx);
      }
    }

    // 3. Step splash particles
    const splashIndices = this.splashPool.getActiveIndices();
    const splashBuf = this.splashPool.buffer;
    const splashStride = this.splashPool.stride;

    for (let i = 0; i < splashIndices.length; i++) {
      const idx = splashIndices[i]!;
      const base = idx * splashStride;

      // Gravity pulls splash down
      splashBuf[base + OFFSET_VEL_Y]! += 2.5 * dt;

      splashBuf[base + OFFSET_POS_X]! += splashBuf[base + OFFSET_VEL_X]! * dt;
      splashBuf[base + OFFSET_POS_Y]! += splashBuf[base + OFFSET_VEL_Y]! * dt;

      const py = splashBuf[base + OFFSET_POS_Y]!;
      if (py > this.groundY + 0.05) {
        this.splashPool.kill(idx);
      }
    }
  }

  private spawnSplash(x: number, y: number, z: number): void {
    const colNorm = [
      this.color[0] / 255,
      this.color[1] / 255,
      this.color[2] / 255,
      this.color[3] * 0.8,
    ] as const;

    for (let s = 0; s < this.splashCount; s++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 0.2 + Math.random() * 0.3;

      const slot = this.splashPool.spawn({
        x,
        y,
        z,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life: 0.25,
        maxLife: 0.25,
        startSize: this.dropletSize * 0.7,
        endSize: 0,
        startRotation: 0,
        angularVelocity: 0,
        startOpacity: this.color[3] * 0.8,
        endOpacity: 0,
        startColor: [colNorm[0], colNorm[1], colNorm[2], colNorm[3]],
        endColor: [colNorm[0], colNorm[1], colNorm[2], 0],
        mass: 0.5,
      });

      if (slot < 0) break;
    }
  }

  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void {
    if (!this.enabled || this.intensity <= 0) return;
    if (!("beginPath" in ctx)) return; // Canvas2D context check

    const c2d = ctx as CanvasRenderingContext2D;
    const [r, g, b, a] = this.color;
    c2d.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    c2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * 0.8})`;

    // Draw rain streaks
    const rainIndices = this.rainPool.getActiveIndices();
    const rainBuf = this.rainPool.buffer;
    const stride = this.rainPool.stride;

    c2d.beginPath();
    for (let i = 0; i < rainIndices.length; i++) {
      const idx = rainIndices[i]!;
      const base = idx * stride;

      const px = rainBuf[base + OFFSET_POS_X]! * targetW;
      const py = rainBuf[base + OFFSET_POS_Y]! * targetH;
      const vx = rainBuf[base + OFFSET_VEL_X]!;
      const vy = rainBuf[base + OFFSET_VEL_Y]!;

      const len = this.dropletLength;
      const speed = Math.hypot(vx, vy) || 1;
      const dx = (vx / speed) * len;
      const dy = (vy / speed) * len;

      c2d.moveTo(px, py);
      c2d.lineTo(px - dx, py - dy);
    }
    c2d.lineWidth = this.dropletSize;
    c2d.stroke();

    // Draw splash particles
    if (this.splashesEnabled) {
      const splashIndices = this.splashPool.getActiveIndices();
      const splashBuf = this.splashPool.buffer;
      const splashStride = this.splashPool.stride;

      c2d.beginPath();
      for (let i = 0; i < splashIndices.length; i++) {
        const idx = splashIndices[i]!;
        const base = idx * splashStride;

        const px = splashBuf[base + OFFSET_POS_X]! * targetW;
        const py = splashBuf[base + OFFSET_POS_Y]! * targetH;
        const radius = splashBuf[base + OFFSET_SIZE]!;

        c2d.moveTo(px + radius, py);
        c2d.arc(px, py, radius, 0, Math.PI * 2);
      }
      c2d.fill();
    }
  }

  get activeDroplets(): number {
    return this.rainPool.count;
  }

  get activeSplashes(): number {
    return this.splashPool.count;
  }

  dispose(): void {
    this.rainPool.clear();
    this.splashPool.clear();
  }
}

export function createRainEffect(config?: RainConfig): RainEffectImpl {
  return new RainEffectImpl(config);
}
