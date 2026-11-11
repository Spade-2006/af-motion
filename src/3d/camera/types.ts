/**
 * AF Motion 3D Camera Intelligence Contracts
 *
 * Types for camera configurations, constraints, follow tracking,
 * smooth transitions, and responsive presets.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";

export type CameraPresetName =
  | "hero"
  | "isometric"
  | "portrait"
  | "wide"
  | "top-down"
  | "cinematic"
  | "macro";

export interface CameraConstraints {
  readonly minFov?: number;
  readonly maxFov?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minPitch?: number; // radians
  readonly maxPitch?: number; // radians
  readonly minYaw?: number;   // radians
  readonly maxYaw?: number;   // radians
}

export interface CameraFollowTarget {
  readonly target: Vector3Tuple;
  readonly offset?: Vector3Tuple;
  readonly stiffness?: number; // 0..1 damping/smoothing
}

export interface CameraTransitionOptions {
  readonly duration?: number; // ms
  readonly easing?: string;
}

export interface IntelligentCameraConfig extends Camera3DConfig {
  readonly preset?: CameraPresetName;
  readonly constraints?: CameraConstraints;
  readonly followTarget?: CameraFollowTarget;
  readonly responsiveFov?: {
    readonly mobile?: number;
    readonly tablet?: number;
    readonly desktop?: number;
  };
}
