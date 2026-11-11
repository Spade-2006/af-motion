/**
 * AF Motion 3D Lighting Presets
 *
 * Professional lighting setups: studio, cinematic, dramatic, daylight, sunset, neon, product.
 */

import type { IntelligentLightingConfig, LightingPresetName } from "./types.js";

export const LIGHTING_3D_PRESETS: Readonly<Record<LightingPresetName, IntelligentLightingConfig>> = {
  studio: {
    ambient: { color: "#ffffff", intensity: 0.4 },
    directional: [
      { color: "#ffffff", intensity: 1.2, position: [5, 8, 5], castShadow: true },
      { color: "#cce0ff", intensity: 0.5, position: [-5, 3, -3], castShadow: false },
    ],
    shadows: { enabled: true, mapSize: 2048, bias: -0.0001 },
  },
  cinematic: {
    ambient: { color: "#0d1b2a", intensity: 0.3 },
    directional: [
      { color: "#ffeedd", intensity: 2.0, position: [8, 6, 2], castShadow: true },
    ],
    point: [
      { color: "#00b4d8", intensity: 1.5, position: [-4, 2, -4], distance: 15 },
    ],
    shadows: { enabled: true, mapSize: 2048 },
  },
  dramatic: {
    ambient: { color: "#050505", intensity: 0.1 },
    spot: [
      { color: "#ffffff", intensity: 3.5, position: [0, 10, 2], angle: Math.PI / 6, penumbra: 0.3, castShadow: true },
    ],
    shadows: { enabled: true, mapSize: 2048 },
  },
  daylight: {
    hemisphere: { skyColor: "#b1e1ff", groundColor: "#b97a20", intensity: 0.6 },
    directional: [
      { color: "#fffaed", intensity: 1.5, position: [10, 15, 10], castShadow: true },
    ],
    shadows: { enabled: true, mapSize: 2048 },
  },
  sunset: {
    hemisphere: { skyColor: "#ff7b00", groundColor: "#3d0c02", intensity: 0.5 },
    directional: [
      { color: "#ff4500", intensity: 2.2, position: [15, 3, 5], castShadow: true },
    ],
    point: [
      { color: "#ffd166", intensity: 0.8, position: [0, 2, 0], distance: 20 },
    ],
  },
  neon: {
    ambient: { color: "#080114", intensity: 0.2 },
    point: [
      { color: "#ff007f", intensity: 2.5, position: [-3, 2, 2], distance: 10 },
      { color: "#00f0ff", intensity: 2.5, position: [3, 2, 2], distance: 10 },
      { color: "#7000ff", intensity: 1.5, position: [0, -1, -3], distance: 12 },
    ],
  },
  product: {
    ambient: { color: "#ffffff", intensity: 0.6 },
    directional: [
      { color: "#ffffff", intensity: 1.0, position: [0, 8, 4], castShadow: true },
      { color: "#ffffff", intensity: 0.4, position: [-4, 4, -2], castShadow: false },
      { color: "#ffffff", intensity: 0.4, position: [4, 4, -2], castShadow: false },
    ],
    shadows: { enabled: true, mapSize: 2048 },
  },
};

export function getLighting3DPreset(name: LightingPresetName): IntelligentLightingConfig {
  return LIGHTING_3D_PRESETS[name] ?? LIGHTING_3D_PRESETS.studio;
}
