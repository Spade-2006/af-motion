/**
 * AF Motion 3D Camera Transitions & Constraints
 *
 * Smooth interpolation, responsive adaptation, and spatial constraint enforcement.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";
import type { CameraConstraints, IntelligentCameraConfig } from "./types.js";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpVector3(a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Interpolate smoothly between two camera states.
 */
export function interpolateCamera(
  from: Camera3DConfig,
  to: Camera3DConfig,
  progress: number
): Camera3DConfig {
  const t = Math.max(0, Math.min(1, progress));
  const posFrom = from.position ?? [0, 0, 5];
  const posTo = to.position ?? [0, 0, 5];
  const targetFrom = from.target ?? [0, 0, 0];
  const targetTo = to.target ?? [0, 0, 0];

  const fov =
    from.fov !== undefined && to.fov !== undefined ? lerp(from.fov, to.fov, t) : to.fov ?? from.fov;
  const zoom =
    from.zoom !== undefined && to.zoom !== undefined ? lerp(from.zoom, to.zoom, t) : to.zoom ?? from.zoom;

  return {
    ...to,
    position: lerpVector3(posFrom, posTo, t),
    target: lerpVector3(targetFrom, targetTo, t),
    ...(fov !== undefined ? { fov } : {}),
    ...(zoom !== undefined ? { zoom } : {}),
  };
}

/**
 * Clamp camera attributes within configured constraints.
 */
export function applyCameraConstraints(
  camera: Camera3DConfig,
  constraints?: CameraConstraints
): Camera3DConfig {
  if (!constraints) return camera;

  let fov = camera.fov;
  if (fov !== undefined) {
    if (constraints.minFov !== undefined) fov = Math.max(constraints.minFov, fov);
    if (constraints.maxFov !== undefined) fov = Math.min(constraints.maxFov, fov);
  }

  const pos = camera.position ? [...camera.position] : [0, 0, 5];
  const target = camera.target ? [...camera.target] : [0, 0, 0];

  const dx = pos[0] - target[0];
  const dy = pos[1] - target[1];
  const dz = pos[2] - target[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance > 0 && (constraints.minDistance !== undefined || constraints.maxDistance !== undefined)) {
    let clampedDist = distance;
    if (constraints.minDistance !== undefined) clampedDist = Math.max(constraints.minDistance, clampedDist);
    if (constraints.maxDistance !== undefined) clampedDist = Math.min(constraints.maxDistance, clampedDist);

    const ratio = clampedDist / distance;
    pos[0] = target[0] + dx * ratio;
    pos[1] = target[1] + dy * ratio;
    pos[2] = target[2] + dz * ratio;
  }

  return {
    ...camera,
    position: [pos[0], pos[1], pos[2]],
    target: [target[0], target[1], target[2]],
    ...(fov !== undefined ? { fov } : {}),
  };
}

/**
 * Resolve responsive FOV based on viewport width.
 */
export function resolveResponsiveFov(
  config: IntelligentCameraConfig,
  viewportWidth = 1024
): number {
  if (config.responsiveFov) {
    if (viewportWidth < 640 && config.responsiveFov.mobile !== undefined) {
      return config.responsiveFov.mobile;
    }
    if (viewportWidth < 1024 && config.responsiveFov.tablet !== undefined) {
      return config.responsiveFov.tablet;
    }
    if (config.responsiveFov.desktop !== undefined) {
      return config.responsiveFov.desktop;
    }
  }
  return config.fov ?? 50;
}
