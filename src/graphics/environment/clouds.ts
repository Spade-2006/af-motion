/**
 * AF Motion Environmental Simulation Engine — Cloud Subsystem
 *
 * Implements multi-layered procedural cloud formations with density thresholding,
 * wind-driven movement, noise-based structures, and atmospheric lighting.
 */

import type {
  CloudConfig,
  EnvironmentalEffect,
  EnvironmentalEffectType,
  EnvironmentSimulation,
} from "./types.js";

let cloudIdSeq = 0;

interface CloudLayer {
  altitude: number;
  speedMultiplier: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}

export class CloudEffectImpl implements EnvironmentalEffect {
  readonly id: string;
  readonly type: EnvironmentalEffectType = "cloud";
  enabled = true;
  intensity: number;

  coverage: number;
  density: number;
  layers: number;
  speed: number;
  altitude: number;
  windDriven: boolean;
  opacity: number;
  color: readonly [number, number, number];

  private cloudLayers: CloudLayer[] = [];

  constructor(config: CloudConfig = {}) {
    this.id = `cloud-${++cloudIdSeq}`;
    this.intensity = Math.max(0, config.density ?? 1.0);
    this.coverage = Math.max(0, Math.min(1, config.coverage ?? 0.6));
    this.density = Math.max(0, config.density ?? 0.8);
    this.layers = Math.max(1, Math.min(4, config.layers ?? 2));
    this.speed = config.speed ?? 0.05;
    this.altitude = Math.max(0.1, Math.min(0.8, config.altitude ?? 0.35)); // Top 35%
    this.windDriven = config.windDriven ?? true;
    this.opacity = Math.max(0, Math.min(1, config.opacity ?? 0.75));
    this.color = config.color ?? [245, 248, 255];

    this.initLayers();
  }

  private initLayers(): void {
    this.cloudLayers = [];
    for (let l = 0; l < this.layers; l++) {
      this.cloudLayers.push({
        altitude: this.altitude * (0.8 + l * 0.25),
        speedMultiplier: 0.7 + l * 0.4,
        opacity: (this.opacity / this.layers) * (0.8 + (1 - l / this.layers) * 0.4),
        offsetX: Math.random() * 10,
        offsetY: Math.random() * 10,
      });
    }
  }

  update(dt: number, time: number, env: EnvironmentSimulation): void {
    if (!this.enabled || this.intensity <= 0 || dt <= 0) return;

    let dirX = 1;
    let dirY = 0;
    let windSpeed = 1;

    if (this.windDriven) {
      const [wx, wy] = env.wind.sampleWind(0.5, 0.1, 0, time);
      const wMag = Math.hypot(wx, wy);
      if (wMag > 0.001) {
        dirX = wx / wMag;
        dirY = wy / wMag;
      }
      windSpeed = env.wind.speed;
    }

    const baseMove = dt * this.speed * (0.5 + windSpeed * 0.5);

    for (let i = 0; i < this.cloudLayers.length; i++) {
      const layer = this.cloudLayers[i]!;
      layer.offsetX += dirX * baseMove * layer.speedMultiplier;
      layer.offsetY += dirY * baseMove * layer.speedMultiplier * 0.1;
    }
  }

  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void {
    if (!this.enabled || this.intensity <= 0) return;
    if (!("beginPath" in ctx)) return;

    const c2d = ctx as CanvasRenderingContext2D;
    const [r, g, b] = this.color;

    c2d.save();

    for (let l = 0; l < this.cloudLayers.length; l++) {
      const layer = this.cloudLayers[l]!;
      const cloudAreaH = targetH * layer.altitude;
      const alpha = layer.opacity * this.density;

      c2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

      // Render procedural cumulus puffs along layer
      const puffCount = 12;
      const spacing = targetW / (puffCount - 2);

      c2d.beginPath();
      for (let p = -2; p <= puffCount + 2; p++) {
        const baseX = p * spacing + ((layer.offsetX * targetW * 0.2) % spacing);
        const puffScale =
          0.8 + 0.4 * Math.sin(p * 1.7 + layer.offsetX * 2) * Math.cos(p * 2.3);

        const cx = baseX;
        const cy =
          cloudAreaH * 0.6 +
          Math.sin(p * 0.8 + layer.offsetY) * (cloudAreaH * 0.25);
        const radius = spacing * 0.9 * puffScale * this.coverage;

        if (radius > 5) {
          c2d.moveTo(cx + radius, cy);
          c2d.arc(cx, cy, radius, 0, Math.PI * 2);
        }
      }
      c2d.fill();
    }

    c2d.restore();
  }

  dispose(): void {
    this.cloudLayers.length = 0;
  }
}

export function createCloudEffect(config?: CloudConfig): CloudEffectImpl {
  return new CloudEffectImpl(config);
}
