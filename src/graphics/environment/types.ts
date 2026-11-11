/**
 * AF Motion Environmental Simulation Engine — Type Definitions
 *
 * Framework-independent architecture for realistic atmospheric simulations
 * including rain, snow, fog, clouds, wind, fire, smoke, and lightning.
 * Coordinates Prompt 117 GPU compute, Prompt 118 particles, and Prompt 119 fluids.
 */

import type { ComputeBackendType } from "../gpu-simulation/types.js";
import type { GraphicsQualityLevel } from "../composition/types.js";
import type { FlowField } from "../fluid/types.js";
import type { ParticleVector3Tuple } from "../particles/types.js";

export type EnvironmentalVector2Tuple = readonly [number, number];
export type EnvironmentalVector3Tuple = ParticleVector3Tuple;

export type WeatherState =
  | "clear"
  | "cloudy"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "blizzard"
  | "fog"
  | "storm"
  | "firestorm"
  | "custom";

export type EnvironmentalEffectType =
  | "rain"
  | "snow"
  | "fog"
  | "cloud"
  | "wind"
  | "fire"
  | "smoke"
  | "lightning";

export interface WindConfig {
  readonly direction?: EnvironmentalVector2Tuple;
  readonly speed?: number;
  readonly gustIntensity?: number;
  readonly gustFrequency?: number;
  readonly turbulence?: number;
  readonly spatialScale?: number;
}

export interface WindSystem {
  direction: EnvironmentalVector2Tuple;
  speed: number;
  gustIntensity: number;
  gustFrequency: number;
  turbulence: number;
  spatialScale: number;
  sampleWind(x: number, y: number, z: number, time: number): EnvironmentalVector3Tuple;
  toFlowField(): FlowField;
  update(dt: number, time: number): void;
}

export interface RainConfig {
  readonly intensity?: number;
  readonly dropletSize?: number;
  readonly dropletLength?: number;
  readonly fallSpeed?: number;
  readonly windInfluence?: number;
  readonly splashesEnabled?: boolean;
  readonly splashCount?: number;
  readonly groundY?: number;
  readonly color?: readonly [number, number, number, number];
  readonly maxDroplets?: number;
}

export interface SnowConfig {
  readonly intensity?: number;
  readonly flakeSize?: number;
  readonly fallSpeed?: number;
  readonly driftAmount?: number;
  readonly turbulence?: number;
  readonly groundY?: number;
  readonly accumulationEnabled?: boolean;
  readonly color?: readonly [number, number, number, number];
  readonly maxFlakes?: number;
}

export interface EnvironmentalFogConfig {
  readonly density?: number;
  readonly groundHeight?: number;
  readonly heightFalloff?: number;
  readonly animated?: boolean;
  readonly speed?: number;
  readonly layers?: number;
  readonly color?: readonly [number, number, number];
  readonly opacity?: number;
  readonly approximationMode?: "layered-screen" | "height-gradient";
}

export type FogEffectConfig = EnvironmentalFogConfig;

export interface CloudConfig {
  readonly coverage?: number;
  readonly density?: number;
  readonly layers?: number;
  readonly speed?: number;
  readonly altitude?: number;
  readonly windDriven?: boolean;
  readonly opacity?: number;
  readonly color?: readonly [number, number, number];
}

export interface FireConfig {
  readonly position?: EnvironmentalVector3Tuple;
  readonly intensity?: number;
  readonly radius?: number;
  readonly flameHeight?: number;
  readonly turbulence?: number;
  readonly smokeEnabled?: boolean;
  readonly smokeDensity?: number;
  readonly smokeColor?: readonly [number, number, number];
  readonly fluidCoupled?: boolean;
}

export interface LightningStrike {
  readonly id: string;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly branches: ReadonlyArray<ReadonlyArray<EnvironmentalVector2Tuple>>;
  readonly intensity: number;
  readonly progress: number;
  readonly durationMs: number;
}

export interface LightningConfig {
  readonly frequency?: number;
  readonly maxFlashes?: number;
  readonly flashDurationMs?: number;
  readonly branchCount?: number;
  readonly stormCoordination?: boolean;
  readonly onThunder?: (delayMs: number, strike: LightningStrike) => void;
  readonly flashColor?: readonly [number, number, number];
}

export interface EnvironmentalParameters {
  temperature?: number; // Celsius
  humidity?: number; // 0 to 1
  visibility?: number; // 0 to 1
  atmosphericDensity?: number; // 0 to 2
  ambientLight?: number; // 0 to 1
  skyColor?: readonly [number, number, number];
}

export interface EnvironmentalEffect {
  readonly id: string;
  readonly type: EnvironmentalEffectType;
  enabled: boolean;
  intensity: number;
  update(dt: number, time: number, env: EnvironmentSimulation): void;
  render(ctx: CanvasRenderingContext2D | WebGL2RenderingContext, targetW: number, targetH: number): void;
  dispose(): void;
}

export interface EnvironmentMetrics {
  readonly activeEffects: number;
  readonly particleCount: number;
  readonly fps: number;
  readonly updateTimeMs: number;
  readonly renderTimeMs: number;
  readonly memoryBytes: number;
  readonly backend: ComputeBackendType | "canvas2d";
}

export type EnvironmentState = "idle" | "running" | "paused" | "disposed";

export interface EnvironmentConfig {
  readonly id?: string;
  readonly weather?: WeatherState;
  readonly globalIntensity?: number;
  readonly parameters?: EnvironmentalParameters;
  readonly wind?: WindConfig;
  readonly effects?: readonly EnvironmentalEffect[];
  readonly quality?: GraphicsQualityLevel;
  readonly backend?: "auto" | ComputeBackendType;
  readonly canvas?: HTMLCanvasElement | null;
  readonly autoStart?: boolean;
}

export interface WeatherTransition {
  readonly from: WeatherState;
  readonly to: WeatherState;
  readonly duration: number;
  progress: number;
}

export interface WeatherSystem {
  currentWeather: WeatherState;
  targetWeather: WeatherState | null;
  transitionProgress: number;
  setWeather(weather: WeatherState, durationSec?: number): void;
  update(dt: number, env: EnvironmentSimulation): void;
}

export interface EnvironmentSimulation {
  readonly id: string;
  readonly state: EnvironmentState;
  readonly metrics: EnvironmentMetrics;
  readonly wind: WindSystem;
  readonly weather: WeatherSystem;
  parameters: Required<EnvironmentalParameters>;
  globalIntensity: number;

  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  dispose(): void;

  update(deltaTime?: number): void;
  render(canvas?: HTMLCanvasElement): void;

  addEffect(effect: EnvironmentalEffect): EnvironmentalEffect;
  removeEffect(id: string): boolean;
  getEffect(id: string): EnvironmentalEffect | undefined;
  getEffects(): readonly EnvironmentalEffect[];

  updateParameters(params: Partial<EnvironmentalParameters>): void;
  setWeather(weather: WeatherState, transitionSec?: number): void;
}
