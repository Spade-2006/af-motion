/**
 * AF Motion 3D Camera Presets
 *
 * Deterministic camera configurations for standard staging modes.
 */

import type { CameraPresetName, IntelligentCameraConfig } from "./types.js";

export const CAMERA_PRESETS: Readonly<Record<CameraPresetName, IntelligentCameraConfig>> = {
  hero: {
    type: "perspective",
    fov: 45,
    position: [0, 1.5, 6],
    target: [0, 0, 0],
    near: 0.1,
    far: 1000,
  },
  isometric: {
    type: "orthographic",
    zoom: 80,
    position: [10, 10, 10],
    target: [0, 0, 0],
    near: 0.1,
    far: 1000,
  },
  portrait: {
    type: "perspective",
    fov: 35,
    position: [0, 1.2, 4],
    target: [0, 1, 0],
    near: 0.1,
    far: 500,
  },
  wide: {
    type: "perspective",
    fov: 75,
    position: [0, 2, 8],
    target: [0, 0, 0],
    near: 0.1,
    far: 2000,
  },
  "top-down": {
    type: "perspective",
    fov: 40,
    position: [0, 12, 0.001],
    target: [0, 0, 0],
    near: 0.1,
    far: 1000,
  },
  cinematic: {
    type: "perspective",
    fov: 28,
    position: [-3, 1, 7],
    target: [0, 0.5, 0],
    near: 0.1,
    far: 1500,
  },
  macro: {
    type: "perspective",
    fov: 20,
    position: [0, 0.5, 1.8],
    target: [0, 0.3, 0],
    near: 0.01,
    far: 100,
  },
};

export function getCameraPreset(name: CameraPresetName): IntelligentCameraConfig {
  return CAMERA_PRESETS[name] ?? CAMERA_PRESETS.hero;
}
