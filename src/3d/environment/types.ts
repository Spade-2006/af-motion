/**
 * AF Motion 3D Environment Intelligence Contracts
 */

import type { Environment3DConfig, FogConfig, Vector3Tuple } from "../types.js";

export type EnvironmentPresetName =
  | "studio-dark"
  | "studio-light"
  | "dawn"
  | "cyberpunk"
  | "desert"
  | "void"
  | "cloudy";

export interface EnvironmentGradientConfig {
  readonly type?: "linear" | "radial";
  readonly colors: readonly string[];
  readonly angle?: number;
}

export interface SkyConfig {
  readonly sunPosition?: Vector3Tuple;
  readonly turbidity?: number;
  readonly rayleigh?: number;
  readonly mieCoefficient?: number;
}

export interface GroundConfig {
  readonly enabled?: boolean;
  readonly size?: number;
  readonly color?: string;
  readonly receiveShadow?: boolean;
  readonly roughness?: number;
  readonly metalness?: number;
}

export interface EnvironmentLightingConfig {
  readonly hdriUrl?: string;
  readonly intensity?: number;
  readonly blur?: number;
}

export interface IntelligentEnvironmentConfig extends Environment3DConfig {
  readonly preset?: EnvironmentPresetName;
  readonly gradient?: EnvironmentGradientConfig;
  readonly sky?: SkyConfig;
  readonly ground?: GroundConfig;
  readonly environmentLighting?: EnvironmentLightingConfig;
}
