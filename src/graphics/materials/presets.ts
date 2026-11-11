/**
 * AF Motion Material & Lighting Presets
 *
 * Built-in presets for materials, lighting setups, and glass surfaces.
 */

import type {
  GlassMaterialOptions,
  GlassPresetName,
  LightingConfig,
  MaterialDefinition,
} from "./types.js";

// ============================================================================
// MATERIAL PRESETS
// ============================================================================

export const MATTE_MATERIAL: MaterialDefinition = {
  id: "matte",
  name: "Matte",
  type: "matte",
  version: "1.0.0",
  surface: {
    roughness: 0.9,
    smoothness: 0.1,
    opacity: 1.0,
    reflectivity: 0.05,
    baseColor: "#f8fafc",
    elevation: 1,
  },
  uniforms: {
    u_roughness: 0.9,
    u_metalness: 0.0,
    u_specular: 0.05,
  },
};

export const METALLIC_MATERIAL: MaterialDefinition = {
  id: "metallic",
  name: "Metallic",
  type: "metallic",
  version: "1.0.0",
  surface: {
    roughness: 0.2,
    smoothness: 0.8,
    opacity: 1.0,
    reflectivity: 0.85,
    baseColor: "#94a3b8",
    elevation: 3,
    highlight: {
      color: "rgba(255, 255, 255, 0.85)",
      intensity: 0.9,
      angle: 135,
    },
  },
  uniforms: {
    u_roughness: 0.2,
    u_metalness: 0.95,
    u_specular: 0.9,
  },
};

export const PLASTIC_MATERIAL: MaterialDefinition = {
  id: "plastic",
  name: "Plastic",
  type: "plastic",
  version: "1.0.0",
  surface: {
    roughness: 0.35,
    smoothness: 0.65,
    opacity: 1.0,
    reflectivity: 0.4,
    baseColor: "#e2e8f0",
    elevation: 2,
    highlight: {
      color: "rgba(255, 255, 255, 0.5)",
      intensity: 0.5,
      angle: 120,
    },
  },
  uniforms: {
    u_roughness: 0.35,
    u_metalness: 0.0,
    u_specular: 0.5,
  },
};

export const EMISSIVE_MATERIAL: MaterialDefinition = {
  id: "emissive",
  name: "Emissive",
  type: "emissive",
  version: "1.0.0",
  surface: {
    roughness: 0.1,
    smoothness: 0.9,
    opacity: 1.0,
    reflectivity: 0.2,
    baseColor: "#38bdf8",
    elevation: 4,
    border: {
      glow: "0 0 20px rgba(56, 189, 248, 0.6)",
    },
  },
  uniforms: {
    u_roughness: 0.1,
    u_metalness: 0.1,
    u_emissive_intensity: 1.0,
  },
};

export const TRANSLUCENT_MATERIAL: MaterialDefinition = {
  id: "translucent",
  name: "Translucent",
  type: "translucent",
  version: "1.0.0",
  surface: {
    roughness: 0.45,
    smoothness: 0.55,
    opacity: 0.75,
    transmission: 0.65,
    baseColor: "rgba(255, 255, 255, 0.75)",
    elevation: 2,
  },
  uniforms: {
    u_roughness: 0.45,
    u_transmission: 0.65,
    u_refractive_index: 1.33,
  },
};

export const MATERIAL_PRESETS: Readonly<Record<string, MaterialDefinition>> = {
  matte: MATTE_MATERIAL,
  metallic: METALLIC_MATERIAL,
  plastic: PLASTIC_MATERIAL,
  emissive: EMISSIVE_MATERIAL,
  translucent: TRANSLUCENT_MATERIAL,
};

export function getMaterialPreset(id: string): MaterialDefinition | undefined {
  return MATERIAL_PRESETS[id];
}

// ============================================================================
// LIGHTING PRESETS
// ============================================================================

export const STUDIO_LIGHTING: LightingConfig = {
  ambient: {
    color: "#ffffff",
    intensity: 0.6,
  },
  directional: {
    direction: [0.5, 1.0, 0.75],
    color: "#ffffff",
    intensity: 0.8,
  },
  shadows: [
    { offset: [0, 4], blur: 12, spread: 0, color: "rgba(0, 0, 0, 0.08)", opacity: 0.08 },
    { offset: [0, 1], blur: 3, spread: 0, color: "rgba(0, 0, 0, 0.04)", opacity: 0.04 },
  ],
  environment: {
    preset: "studio",
    intensity: 1.0,
  },
};

export const DRAMATIC_LIGHTING: LightingConfig = {
  ambient: {
    color: "#0f172a",
    intensity: 0.25,
  },
  directional: {
    direction: [0.8, 1.2, 0.4],
    color: "#f8fafc",
    intensity: 1.4,
  },
  point: {
    position: [-100, -100, 200],
    color: "#38bdf8",
    intensity: 0.6,
  },
  shadows: [
    { offset: [0, 16], blur: 32, spread: -4, color: "rgba(0, 0, 0, 0.35)", opacity: 0.35 },
    { offset: [0, 6], blur: 12, spread: 0, color: "rgba(0, 0, 0, 0.2)", opacity: 0.2 },
  ],
  environment: {
    preset: "dramatic",
    intensity: 1.2,
  },
};

export const AMBIENT_SOFT_LIGHTING: LightingConfig = {
  ambient: {
    color: "#f1f5f9",
    intensity: 0.85,
  },
  directional: {
    direction: [0.0, 1.0, 0.5],
    color: "#ffffff",
    intensity: 0.35,
  },
  shadows: [
    { offset: [0, 2], blur: 8, spread: 0, color: "rgba(0, 0, 0, 0.05)", opacity: 0.05 },
  ],
  environment: {
    preset: "ambient-soft",
    intensity: 0.9,
  },
};

export const NEON_LIGHTING: LightingConfig = {
  ambient: {
    color: "#090d16",
    intensity: 0.3,
  },
  directional: {
    direction: [-0.5, 0.8, 0.6],
    color: "#a855f7",
    intensity: 1.1,
  },
  point: {
    position: [120, -80, 150],
    color: "#06b6d4",
    intensity: 1.2,
  },
  highlight: {
    color: "rgba(6, 182, 212, 0.7)",
    blur: 16,
    angle: 45,
  },
  shadows: [
    { offset: [0, 8], blur: 24, spread: -2, color: "rgba(168, 85, 247, 0.3)", opacity: 0.3 },
  ],
  environment: {
    preset: "neon",
    intensity: 1.3,
    tint: "#06b6d4",
  },
};

export const SUNSET_LIGHTING: LightingConfig = {
  ambient: {
    color: "#451a03",
    intensity: 0.45,
  },
  directional: {
    direction: [1.2, 0.3, 0.4],
    color: "#fb923c",
    intensity: 1.25,
  },
  highlight: {
    color: "rgba(254, 215, 170, 0.8)",
    blur: 12,
    angle: 160,
  },
  shadows: [
    { offset: [-6, 8], blur: 20, spread: 0, color: "rgba(69, 26, 3, 0.25)", opacity: 0.25 },
  ],
  environment: {
    preset: "sunset",
    intensity: 1.1,
    tint: "#fb923c",
  },
};

export const LIGHTING_PRESETS: Readonly<Record<string, LightingConfig>> = {
  studio: STUDIO_LIGHTING,
  dramatic: DRAMATIC_LIGHTING,
  "ambient-soft": AMBIENT_SOFT_LIGHTING,
  neon: NEON_LIGHTING,
  sunset: SUNSET_LIGHTING,
};

export function getLightingPreset(name: string): LightingConfig | undefined {
  return LIGHTING_PRESETS[name];
}

// ============================================================================
// GLASS PRESETS
// ============================================================================

export const FROSTED_GLASS_PRESET: GlassMaterialOptions = {
  preset: "frosted-glass",
  blur: 16,
  opacity: 0.22,
  tint: "rgba(255, 255, 255, 0.18)",
  elevation: 2,
  edgeHighlight: true,
  borderWidth: "1px",
  borderColor: "rgba(255, 255, 255, 0.32)",
  borderRadius: "16px",
  refractiveIndex: 1.45,
};

export const CLEAR_GLASS_PRESET: GlassMaterialOptions = {
  preset: "clear-glass",
  blur: 6,
  opacity: 0.1,
  tint: "rgba(255, 255, 255, 0.08)",
  elevation: 1,
  edgeHighlight: true,
  borderWidth: "1px",
  borderColor: "rgba(255, 255, 255, 0.24)",
  borderRadius: "12px",
  refractiveIndex: 1.5,
};

export const TINTED_GLASS_PRESET: GlassMaterialOptions = {
  preset: "tinted-glass",
  blur: 20,
  opacity: 0.38,
  tint: "rgba(15, 23, 42, 0.42)",
  elevation: 3,
  edgeHighlight: true,
  borderWidth: "1px",
  borderColor: "rgba(255, 255, 255, 0.16)",
  borderRadius: "16px",
  refractiveIndex: 1.48,
};

export const LIQUID_GLASS_PRESET: GlassMaterialOptions = {
  preset: "liquid-glass",
  blur: 24,
  opacity: 0.28,
  tint: "rgba(255, 255, 255, 0.25)",
  elevation: 4,
  edgeHighlight: true,
  borderWidth: "1.5px",
  borderColor: "rgba(255, 255, 255, 0.45)",
  borderRadius: "20px",
  refractiveIndex: 1.52,
};

export const ACRYLIC_PRESET: GlassMaterialOptions = {
  preset: "acrylic",
  blur: 32,
  opacity: 0.48,
  tint: "rgba(248, 250, 252, 0.35)",
  elevation: 3,
  edgeHighlight: true,
  borderWidth: "1px",
  borderColor: "rgba(255, 255, 255, 0.38)",
  borderRadius: "14px",
  refractiveIndex: 1.49,
};

export const TRANSLUCENT_PANEL_PRESET: GlassMaterialOptions = {
  preset: "translucent-panel",
  blur: 10,
  opacity: 0.65,
  tint: "rgba(255, 255, 255, 0.58)",
  elevation: 2,
  edgeHighlight: false,
  borderWidth: "1px",
  borderColor: "rgba(226, 232, 240, 0.8)",
  borderRadius: "12px",
  refractiveIndex: 1.4,
};

export const GLASS_PRESETS: Readonly<Record<GlassPresetName, GlassMaterialOptions>> = {
  "frosted-glass": FROSTED_GLASS_PRESET,
  "clear-glass": CLEAR_GLASS_PRESET,
  "tinted-glass": TINTED_GLASS_PRESET,
  "liquid-glass": LIQUID_GLASS_PRESET,
  acrylic: ACRYLIC_PRESET,
  "translucent-panel": TRANSLUCENT_PANEL_PRESET,
};

export function getGlassPreset(preset: GlassPresetName): GlassMaterialOptions {
  return GLASS_PRESETS[preset] ?? FROSTED_GLASS_PRESET;
}
