/**
 * AF Motion 3D Material Presets
 *
 * Professional material recipes: chrome, gold, frosted-glass, clear-glass,
 * matte-plastic, glossy-plastic, velvet, neon-glow.
 */

import type { IntelligentMaterial3DConfig, Material3DPresetName } from "./types.js";

export const MATERIAL_3D_PRESETS: Readonly<Record<Material3DPresetName, IntelligentMaterial3DConfig>> = {
  chrome: {
    type: "physical",
    color: "#ffffff",
    metalness: 1.0,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  },
  gold: {
    type: "physical",
    color: "#ffd700",
    metalness: 0.95,
    roughness: 0.15,
  },
  "frosted-glass": {
    type: "physical",
    color: "#ffffff",
    roughness: 0.35,
    metalness: 0.0,
    transmission: 0.92,
    ior: 1.52,
    thickness: 1.2,
    transparent: true,
  },
  "clear-glass": {
    type: "physical",
    color: "#ffffff",
    roughness: 0.02,
    metalness: 0.0,
    transmission: 0.98,
    ior: 1.5,
    thickness: 0.8,
    transparent: true,
  },
  "matte-plastic": {
    type: "standard",
    color: "#2b2d42",
    roughness: 0.8,
    metalness: 0.05,
  },
  "glossy-plastic": {
    type: "physical",
    color: "#e63946",
    roughness: 0.15,
    metalness: 0.0,
    clearcoat: 0.8,
  },
  velvet: {
    type: "physical",
    color: "#4a0e17",
    roughness: 0.9,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: "#8b1e2f",
  },
  "neon-glow": {
    type: "basic",
    color: "#00f0ff",
    emissive: "#00f0ff",
    emissiveIntensity: 2.5,
  },
};

export function getMaterial3DPreset(name: Material3DPresetName): IntelligentMaterial3DConfig {
  return MATERIAL_3D_PRESETS[name] ?? MATERIAL_3D_PRESETS["matte-plastic"];
}
