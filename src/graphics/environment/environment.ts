/**
 * AF Motion Environmental Simulation Engine — Master Controller
 *
 * Coordinates weather systems, wind forces, particle precipitation, volumetric
 * atmospheric approximations, fire/smoke fluid coupling, and adaptive hardware execution.
 */

import { resolveQualityProfile } from "../composition/quality.js";
import { selectComputeBackend } from "../gpu-simulation/backends/selection.js";
import type { ComputeBackendType } from "../gpu-simulation/types.js";
import { createCloudEffect } from "./clouds.js";
import { createFireEffect } from "./fire-smoke.js";
import { createFogEffect } from "./fog.js";
import { createLightningEffect } from "./lightning.js";
import { createRainEffect } from "./rain.js";
import { createSnowEffect } from "./snow.js";
import type {
  EnvironmentConfig,
  EnvironmentalEffect,
  EnvironmentalParameters,
  EnvironmentMetrics,
  EnvironmentSimulation,
  EnvironmentState,
  WeatherState,
  WeatherSystem,
  WindSystem,
} from "./types.js";
import { createWeatherSystem } from "./weather.js";
import { createWindSystem } from "./wind.js";

let envIdSeq = 0;

export class EnvironmentSimulationImpl implements EnvironmentSimulation {
  readonly id: string;
  readonly wind: WindSystem;
  readonly weather: WeatherSystem;
  parameters: Required<EnvironmentalParameters>;
  globalIntensity: number;

  private _state: EnvironmentState = "idle";
  private effects: EnvironmentalEffect[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private totalTime = 0;
  private backend: ComputeBackendType | "canvas2d";

  private _metrics: EnvironmentMetrics;

  constructor(config: EnvironmentConfig = {}) {
    this.id = config.id ?? `env-sim-${++envIdSeq}`;
    this.globalIntensity = Math.max(0, config.globalIntensity ?? 1.0);

    // Environmental parameters
    this.parameters = {
      temperature: config.parameters?.temperature ?? 20,
      humidity: config.parameters?.humidity ?? 0.5,
      visibility: config.parameters?.visibility ?? 1.0,
      atmosphericDensity: config.parameters?.atmosphericDensity ?? 1.0,
      ambientLight: config.parameters?.ambientLight ?? 1.0,
      skyColor: config.parameters?.skyColor ?? [135, 206, 235],
    };

    // Wind & Weather
    this.wind = createWindSystem(config.wind);
    this.weather = createWeatherSystem(config.weather ?? "clear");

    // Quality & Backend resolution
    const qualityLevel = config.quality ?? "high";
    const _profile = resolveQualityProfile(qualityLevel);
    this.canvas = config.canvas ?? null;

    const selection = selectComputeBackend({
      preference: config.backend || "auto",
      canvas: this.canvas,
    });

    if (selection.backend === "webgl2" && this.canvas) {
      this.backend = "webgl2";
    } else {
      this.backend = selection.backend === "cpu" ? "canvas2d" : selection.backend;
    }

    // Attach initial effects
    if (config.effects) {
      for (const eff of config.effects) {
        this.effects.push(eff);
      }
    }

    this._metrics = {
      activeEffects: this.effects.length,
      particleCount: 0,
      fps: 60,
      updateTimeMs: 0,
      renderTimeMs: 0,
      memoryBytes: 1024 * 64,
      backend: this.backend,
    };

    if (config.autoStart) {
      this.start();
    }
  }

  get state(): EnvironmentState {
    return this._state;
  }

  get metrics(): EnvironmentMetrics {
    return this._metrics;
  }

  start(): void {
    if (this._state === "running" || this._state === "disposed") return;
    this._state = "running";
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const loop = (currentTime: number) => {
      if (this._state !== "running") return;
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      this.update(dt || 1 / 60);

      if (this.canvas) {
        this.render(this.canvas);
      }

      if (typeof requestAnimationFrame !== "undefined") {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    if (typeof requestAnimationFrame !== "undefined") {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  pause(): void {
    if (this._state !== "running") return;
    this._state = "paused";
    if (this.animFrameId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume(): void {
    if (this._state === "paused") {
      this.start();
    }
  }

  reset(): void {
    for (const eff of this.effects) {
      eff.dispose();
    }
    this.totalTime = 0;
  }

  dispose(): void {
    this.pause();
    this._state = "disposed";
    for (const eff of this.effects) {
      eff.dispose();
    }
    this.effects.length = 0;
  }

  update(deltaTime?: number): void {
    if (this._state === "disposed") return;

    const startPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = deltaTime ?? 1 / 60;
    this.totalTime += dt;

    // 1. Update wind
    this.wind.update(dt, this.totalTime);

    // 2. Update weather state machine
    this.weather.update(dt, this);

    // 3. Update all environmental effects
    let totalParticles = 0;
    for (let i = 0; i < this.effects.length; i++) {
      const eff = this.effects[i]!;
      if (eff.enabled) {
        eff.update(dt, this.totalTime, this);
        if ("activeDroplets" in eff) {
          totalParticles += (eff as any).activeDroplets;
        } else if ("activeFlakes" in eff) {
          totalParticles += (eff as any).activeFlakes;
        } else if ("activeFireParticles" in eff) {
          totalParticles += (eff as any).activeFireParticles + (eff as any).activeSmokeParticles;
        }
      }
    }

    const endPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    const updateTimeMs = endPerf - startPerf;

    this._metrics = {
      activeEffects: this.effects.filter((e) => e.enabled).length,
      particleCount: totalParticles,
      fps: dt > 0 ? Math.min(120, Math.round(1 / dt)) : 60,
      updateTimeMs,
      renderTimeMs: this._metrics.renderTimeMs,
      memoryBytes: 1024 * 64 + totalParticles * 64,
      backend: this.backend,
    };
  }

  render(canvas?: HTMLCanvasElement): void {
    const target = canvas ?? this.canvas;
    if (!target) return;

    const startPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ctx = target.getContext("2d");
    if (!ctx) return;

    const targetW = target.width || 800;
    const targetH = target.height || 600;

    // 1. Clear / draw sky atmospheric background
    const [sr, sg, sb] = this.parameters.skyColor;
    const amb = this.parameters.ambientLight;
    ctx.fillStyle = `rgb(${Math.floor(sr * amb)}, ${Math.floor(sg * amb)}, ${Math.floor(sb * amb)})`;
    ctx.fillRect(0, 0, targetW, targetH);

    // 2. Render layered effects in depth order:
    // Clouds -> Fog -> Rain / Snow -> Fire / Smoke -> Lightning
    const order: Record<string, number> = {
      cloud: 1,
      fog: 2,
      snow: 3,
      rain: 4,
      fire: 5,
      smoke: 6,
      lightning: 7,
      wind: 8,
    };

    const sorted = [...this.effects].sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5));

    for (let i = 0; i < sorted.length; i++) {
      const eff = sorted[i]!;
      if (eff.enabled && eff.intensity > 0) {
        eff.render(ctx, targetW, targetH);
      }
    }

    const endPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    this._metrics = {
      ...this._metrics,
      renderTimeMs: endPerf - startPerf,
    };
  }

  addEffect(effect: EnvironmentalEffect): EnvironmentalEffect {
    this.effects.push(effect);
    return effect;
  }

  removeEffect(id: string): boolean {
    const idx = this.effects.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const removed = this.effects.splice(idx, 1)[0]!;
      removed.dispose();
      return true;
    }
    return false;
  }

  getEffect(id: string): EnvironmentalEffect | undefined {
    return this.effects.find((e) => e.id === id);
  }

  getEffects(): readonly EnvironmentalEffect[] {
    return this.effects;
  }

  updateParameters(params: Partial<EnvironmentalParameters>): void {
    if (params.temperature !== undefined) this.parameters.temperature = params.temperature;
    if (params.humidity !== undefined) this.parameters.humidity = params.humidity;
    if (params.visibility !== undefined) this.parameters.visibility = params.visibility;
    if (params.atmosphericDensity !== undefined)
      this.parameters.atmosphericDensity = params.atmosphericDensity;
    if (params.ambientLight !== undefined) this.parameters.ambientLight = params.ambientLight;
    if (params.skyColor !== undefined) this.parameters.skyColor = params.skyColor;
  }

  setWeather(weather: WeatherState, transitionSec?: number): void {
    this.weather.setWeather(weather, transitionSec);
  }
}

export function createEnvironment(config?: EnvironmentConfig): EnvironmentSimulation {
  return new EnvironmentSimulationImpl(config);
}

export function updateEnvironment(env: EnvironmentSimulation, deltaTime?: number): void {
  env.update(deltaTime);
}

export function disposeEnvironment(env: EnvironmentSimulation): void {
  env.dispose();
}

export {
  createCloudEffect,
  createFireEffect,
  createFogEffect,
  createLightningEffect,
  createRainEffect,
  createSnowEffect,
  createWeatherSystem,
  createWindSystem,
};
