/**
 * AF Motion 3D Lighting Intelligence Contracts
 */

import type {
  AmbientLightConfig,
  DirectionalLightConfig,
  Lighting3DConfig,
  PointLightConfig,
  SpotLightConfig,
  Vector3Tuple,
} from "../types.js";

export type LightingPresetName =
  | "studio"
  | "cinematic"
  | "dramatic"
  | "daylight"
  | "sunset"
  | "neon"
  | "product";

export interface HemisphereLightConfig {
  readonly skyColor?: string;
  readonly groundColor?: string;
  readonly intensity?: number;
}

export interface AreaLightConfig {
  readonly color?: string;
  readonly intensity?: number;
  readonly width?: number;
  readonly height?: number;
  readonly position?: Vector3Tuple;
}

export interface Shadow3DConfig {
  readonly enabled?: boolean;
  readonly mapSize?: number;
  readonly bias?: number;
  readonly radius?: number;
}

export type ShadowConfig = Shadow3DConfig;

export interface IntelligentLightingConfig extends Lighting3DConfig {
  readonly preset?: LightingPresetName;
  readonly hemisphere?: HemisphereLightConfig;
  readonly area?: readonly AreaLightConfig[];
  readonly shadows?: Shadow3DConfig;
  readonly environmentIntensity?: number;
}
