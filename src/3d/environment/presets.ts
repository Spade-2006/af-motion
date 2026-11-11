/**
 * AF Motion 3D Environment Presets
 *
 * Professional staging backdrops and atmospheric effects.
 */

import type { EnvironmentPresetName, IntelligentEnvironmentConfig } from "./types.js";

export const ENVIRONMENT_PRESETS: Readonly<Record<EnvironmentPresetName, IntelligentEnvironmentConfig>> = {
  "studio-dark": {
    background: "#0a0a0c",
    transparent: false,
    ground: { enabled: true, size: 50, color: "#141418", receiveShadow: true, roughness: 0.8 },
  },
  "studio-light": {
    background: "#f0f2f5",
    transparent: false,
    ground: { enabled: true, size: 50, color: "#e4e7eb", receiveShadow: true, roughness: 0.9 },
  },
  dawn: {
    background: "#ffeedd",
    gradient: { type: "linear", colors: ["#2c3e50", "#fd746c"], angle: 90 },
    fog: { type: "linear", color: "#fd746c", near: 10, far: 80 },
    ground: { enabled: true, size: 100, color: "#2c3e50", receiveShadow: true },
  },
  cyberpunk: {
    background: "#050014",
    fog: { type: "exponential", color: "#12002b", density: 0.02 },
    ground: { enabled: true, size: 60, color: "#08001a", receiveShadow: true, roughness: 0.3, metalness: 0.7 },
  },
  desert: {
    background: "#f4a261",
    fog: { type: "linear", color: "#e76f51", near: 15, far: 120 },
    ground: { enabled: true, size: 120, color: "#e9c46a", receiveShadow: true, roughness: 0.95 },
  },
  void: {
    background: "#000000",
    transparent: true,
  },
  cloudy: {
    background: "#b8c6db",
    gradient: { type: "linear", colors: ["#b8c6db", "#f5f7fa"], angle: 0 },
    fog: { type: "linear", color: "#b8c6db", near: 5, far: 60 },
    ground: { enabled: true, size: 80, color: "#a0aec0", receiveShadow: true },
  },
};

export function getEnvironmentPreset(name: EnvironmentPresetName): IntelligentEnvironmentConfig {
  return ENVIRONMENT_PRESETS[name] ?? ENVIRONMENT_PRESETS["studio-dark"];
}
