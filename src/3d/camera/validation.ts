/**
 * AF Motion 3D Camera Validation & Safe Correction
 */

import { getCameraPreset } from "./presets.js";
import type { CameraPresetName, IntelligentCameraConfig } from "./types.js";

export function validateCameraConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Camera config must be an object"] };
  }

  const c = config as Record<string, unknown>;
  if (c.fov !== undefined) {
    if (typeof c.fov !== "number" || !Number.isFinite(c.fov) || c.fov <= 0 || c.fov >= 180) {
      errors.push("Camera FOV must be a finite number between 1 and 179 degrees");
    }
  }

  if (c.near !== undefined) {
    if (typeof c.near !== "number" || !Number.isFinite(c.near) || c.near <= 0) {
      errors.push("Camera near clipping plane must be greater than 0");
    }
  }

  if (c.far !== undefined) {
    if (typeof c.far !== "number" || !Number.isFinite(c.far) || c.far <= 0) {
      errors.push("Camera far clipping plane must be greater than 0");
    }
  }

  if (c.near !== undefined && c.far !== undefined && typeof c.near === "number" && typeof c.far === "number") {
    if (c.near >= c.far) {
      errors.push("Camera near plane must be strictly less than far plane");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function correctCameraConfig(raw: unknown): IntelligentCameraConfig {
  if (!raw || typeof raw !== "object") {
    return getCameraPreset("hero");
  }

  const input = raw as Partial<IntelligentCameraConfig>;
  let base: IntelligentCameraConfig = input.preset ? getCameraPreset(input.preset as CameraPresetName) : {};

  const fov =
    typeof input.fov === "number" && Number.isFinite(input.fov) && input.fov > 0 && input.fov < 180
      ? input.fov
      : base.fov ?? 50;

  const near =
    typeof input.near === "number" && Number.isFinite(input.near) && input.near > 0
      ? input.near
      : base.near ?? 0.1;

  const far =
    typeof input.far === "number" && Number.isFinite(input.far) && input.far > near
      ? input.far
      : base.far ?? Math.max(1000, near + 10);

  return {
    ...base,
    ...input,
    type: input.type === "orthographic" ? "orthographic" : base.type ?? "perspective",
    fov,
    near,
    far,
    position: Array.isArray(input.position) && input.position.length === 3 ? input.position : base.position ?? [0, 0, 5],
    target: Array.isArray(input.target) && input.target.length === 3 ? input.target : base.target ?? [0, 0, 0],
  };
}
