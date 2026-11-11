/**
 * AF Motion 3D Material Validation & Safe Correction
 */

import { getMaterial3DPreset } from "./presets.js";
import type { IntelligentMaterial3DConfig, Material3DPresetName } from "./types.js";

const VALID_3D_MATERIAL_TYPES = new Set([
  "basic",
  "standard",
  "physical",
  "phong",
  "toon",
  "shadow",
  "custom",
]);

export function validateMaterial3D(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Material config must be an object"] };
  }

  const m = config as Record<string, unknown>;
  if (m.type !== undefined && (typeof m.type !== "string" || !VALID_3D_MATERIAL_TYPES.has(m.type))) {
    errors.push(`Invalid 3D material type: '${String(m.type)}'`);
  }

  if (m.roughness !== undefined && (typeof m.roughness !== "number" || m.roughness < 0 || m.roughness > 1)) {
    errors.push("Roughness must be a number between 0 and 1");
  }

  if (m.metalness !== undefined && (typeof m.metalness !== "number" || m.metalness < 0 || m.metalness > 1)) {
    errors.push("Metalness must be a number between 0 and 1");
  }

  return { valid: errors.length === 0, errors };
}

export function correctMaterial3D(raw: unknown): IntelligentMaterial3DConfig {
  if (!raw || typeof raw !== "object") {
    return getMaterial3DPreset("matte-plastic");
  }

  const input = raw as Partial<IntelligentMaterial3DConfig>;
  const base: Partial<IntelligentMaterial3DConfig> = input.preset
    ? getMaterial3DPreset(input.preset as Material3DPresetName)
    : {};

  const roughness =
    typeof input.roughness === "number" && input.roughness >= 0 && input.roughness <= 1
      ? input.roughness
      : base.roughness ?? 0.5;

  const metalness =
    typeof input.metalness === "number" && input.metalness >= 0 && input.metalness <= 1
      ? input.metalness
      : base.metalness ?? 0.0;

  return {
    ...base,
    ...input,
    type: input.type && VALID_3D_MATERIAL_TYPES.has(input.type) ? input.type : base.type ?? "standard",
    color: typeof input.color === "string" ? input.color : base.color ?? "#ffffff",
    roughness,
    metalness,
  };
}
