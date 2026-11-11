/**
 * AF Motion 3D Environment Validation & Safe Correction
 */

import { getEnvironmentPreset } from "./presets.js";
import type { EnvironmentPresetName, IntelligentEnvironmentConfig } from "./types.js";

export function validateEnvironmentConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Environment config must be an object"] };
  }

  const c = config as Record<string, unknown>;
  if (c.fog && typeof c.fog === "object") {
    const fog = c.fog as Record<string, unknown>;
    if (fog.density !== undefined && (typeof fog.density !== "number" || fog.density < 0)) {
      errors.push("Fog density must be a non-negative number");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function correctEnvironmentConfig(raw: unknown): IntelligentEnvironmentConfig {
  if (!raw || typeof raw !== "object") {
    return getEnvironmentPreset("studio-dark");
  }

  const input = raw as Partial<IntelligentEnvironmentConfig>;
  const base = input.preset ? getEnvironmentPreset(input.preset as EnvironmentPresetName) : {};

  return {
    ...base,
    ...input,
    background: input.background ?? base.background ?? "#000000",
    transparent: input.transparent ?? base.transparent ?? false,
    fog: input.fog ?? base.fog,
    ground: input.ground ?? base.ground,
    gradient: input.gradient ?? base.gradient,
    sky: input.sky ?? base.sky,
    environmentLighting: input.environmentLighting ?? base.environmentLighting,
  };
}
