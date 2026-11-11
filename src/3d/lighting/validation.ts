/**
 * AF Motion 3D Lighting Validation & Fallback Resolution
 */

import { getLighting3DPreset } from "./presets.js";
import type {
  AmbientLightConfig,
  DirectionalLightConfig,
  PointLightConfig,
  SpotLightConfig,
} from "../types.js";
import type {
  AreaLightConfig,
  HemisphereLightConfig,
  IntelligentLightingConfig,
  LightingPresetName,
} from "./types.js";

export function validateLightingConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Lighting config must be an object"] };
  }

  const c = config as Record<string, unknown>;
  if (c.ambient && typeof c.ambient === "object") {
    const amb = c.ambient as AmbientLightConfig;
    if (amb.intensity !== undefined && (typeof amb.intensity !== "number" || amb.intensity < 0)) {
      errors.push("Ambient light intensity must be a non-negative number");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function correctLightingConfig(raw: unknown): IntelligentLightingConfig {
  if (!raw || typeof raw !== "object") {
    return getLighting3DPreset("studio");
  }

  const input = raw as Partial<IntelligentLightingConfig>;
  const base = input.preset ? getLighting3DPreset(input.preset as LightingPresetName) : {};

  return {
    ...base,
    ...input,
    ambient: input.ambient ?? base.ambient ?? { color: "#ffffff", intensity: 0.5 },
    directional: input.directional ?? base.directional ?? [],
    point: input.point ?? base.point ?? [],
    spot: input.spot ?? base.spot ?? [],
    hemisphere: input.hemisphere ?? base.hemisphere,
    area: input.area ?? base.area,
    shadows: input.shadows ?? base.shadows,
  };
}

/**
 * Gracefully fall back unsupported light types (e.g. hemisphere or area lights)
 * to standard ambient/point/directional lights.
 */
export function resolveLightingFallbacks(
  config: IntelligentLightingConfig,
  supported?: { readonly hemisphere?: boolean; readonly area?: boolean }
): IntelligentLightingConfig {
  let { ambient, directional = [], point = [], hemisphere, area, ...rest } = config;

  // Fallback hemisphere light to ambient light
  if (hemisphere && supported?.hemisphere === false) {
    const skyIntensity = hemisphere.intensity ?? 0.6;
    ambient = {
      color: hemisphere.skyColor ?? "#ffffff",
      intensity: (ambient?.intensity ?? 0) + skyIntensity * 0.7,
    };
    hemisphere = undefined;
  }

  // Fallback area lights to point lights
  if (area && area.length > 0 && supported?.area === false) {
    const fallbackPoints: PointLightConfig[] = area.map((al) => ({
      color: al.color ?? "#ffffff",
      intensity: al.intensity ?? 1,
      position: al.position ?? [0, 5, 0],
      distance: (al.width ?? 5) * 3,
    }));
    point = [...point, ...fallbackPoints];
    area = undefined;
  }

  return {
    ...rest,
    ambient,
    directional,
    point,
    ...(hemisphere ? { hemisphere } : {}),
    ...(area ? { area } : {}),
  };
}
