/**
 * AF Motion Environmental Simulation Engine — Fog & Atmosphere Subsystem
 *
 * Implements layered ground fog, height-based density gradients, atmospheric haze,
 * and visibility attenuation using screen-space approximations.
 */

import type {
  EnvironmentalEffect,
  EnvironmentalEffectType,
  EnvironmentalFogConfig,
  EnvironmentSimulation,
  FogEffectConfig,
} from "./types.js";

let fogIdSeq = 0;

export class FogEffectImpl implements EnvironmentalEffect {
  readonly id: string;
  readonly type: EnvironmentalEffectType = "fog";
  enabled = true;
  intensity: number;

  density: number;
  groundHeight: number;
  heightFalloff: number;
  animated: boolean;
  speed: number;
  layers: number;
  color: readonly [number, number, number];
  opacity: number;
  readonly approximationMode: "layered-screen" | "height-gradient";

  private animPhase = 0;

  constructor(config: EnvironmentalFogConfig = {}) {
    this.id = `fog-${++fogIdSeq}`;
    this.intensity = Math.max(0, config.density ?? 1.0);
    this.density = Math.max(0, config.density ?? 0.6);
    this.groundHeight = Math.max(0.1, config.groundHeight ?? 0.5); // covers bottom 50%
    this.heightFalloff = Math.max(0.1, config.heightFalloff ?? 1.8);
    this.animated = config.animated ?? true;
    this.speed = config.speed ?? 0.2;
    this.layers = Math.max(1, Math.min(5, config.layers ?? 3));
    this.color = config.color ?? [210, 220, 230];
    this.opacity = Math.max(0, Math.min(1, config.opacity ?? 0.7));
    this.approximationMode = config.approximationMode ?? "height-gradient";
  }

  update(dt: number, time: number, env: EnvironmentSimulation): void {
    if (!this.enabled || this.intensity <= 0) return;

    if (this.animated) {
      const windSpeed = env.wind.speed;
      this.animPhase += dt * this.speed * (1 + windSpeed * 0.5);
    }
  }

  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void {
    if (!this.enabled || this.intensity <= 0) return;
    if (!("createLinearGradient" in ctx)) return;

    const c2d = ctx as CanvasRenderingContext2D;
    const [r, g, b] = this.color;
    const effectiveAlpha = this.opacity * this.density;

    const startY = targetH * (1 - this.groundHeight);
    const fogHeight = targetH * this.groundHeight;

    c2d.save();

    // 1. Base height-based exponential density gradient
    const grad = c2d.createLinearGradient(0, startY, 0, targetH);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${effectiveAlpha * 0.3})`);
    grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${effectiveAlpha * 0.7})`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${effectiveAlpha})`);

    c2d.fillStyle = grad;
    c2d.fillRect(0, startY, targetW, fogHeight);

    // 2. Animated harmonic fog wave layers (screen-space volumetric approximation)
    if (this.animated && this.layers > 1) {
      for (let l = 0; l < this.layers; l++) {
        const layerAlpha = (effectiveAlpha * 0.25) / (l + 1);
        const waveFreq = (l + 1) * 2;
        const phase = this.animPhase * (1 + l * 0.4);
        const baseLayerY = startY + (l / this.layers) * fogHeight * 0.4;

        c2d.fillStyle = `rgba(${r}, ${g}, ${b}, ${layerAlpha})`;
        c2d.beginPath();
        c2d.moveTo(0, targetH);
        c2d.lineTo(0, baseLayerY);

        const steps = 24;
        const stepX = targetW / steps;
        for (let s = 0; s <= steps; s++) {
          const x = s * stepX;
          const normX = s / steps;
          const waveY =
            Math.sin(normX * waveFreq * Math.PI + phase) * (fogHeight * 0.08) +
            Math.cos(normX * (waveFreq * 1.5) * Math.PI - phase * 0.7) * (fogHeight * 0.04);
          c2d.lineTo(x, baseLayerY + waveY);
        }

        c2d.lineTo(targetW, targetH);
        c2d.closePath();
        c2d.fill();
      }
    }

    c2d.restore();
  }

  dispose(): void {
    this.animPhase = 0;
  }
}

export function createFogEffect(config?: EnvironmentalFogConfig): FogEffectImpl {
  return new FogEffectImpl(config);
}
