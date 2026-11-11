/**
 * AF Motion 3D Camera Controls Engine
 *
 * Framework-independent Orbit, Pan, Zoom, Focus, and Damping controller
 * with reduced-motion respect and boundary enforcement.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";
import type { BoundingBox3D } from "../schemas/types.js";
import type { CameraControlsConfig, CameraControlsState } from "./types.js";

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export class CameraControls3D {
  private config: Required<CameraControlsConfig>;
  private target: [number, number, number];
  private currentAzimuth: number;
  private targetAzimuth: number;
  private currentPolar: number;
  private targetPolar: number;
  private currentDistance: number;
  private targetDistance: number;
  private isInteracting = false;

  constructor(
    initialCamera?: Camera3DConfig,
    config?: CameraControlsConfig
  ) {
    this.config = {
      mode: config?.mode ?? "combined",
      enableOrbit: config?.enableOrbit ?? true,
      enablePan: config?.enablePan ?? true,
      enableZoom: config?.enableZoom ?? true,
      enableDamping: config?.enableDamping ?? true,
      dampingFactor: config?.dampingFactor ?? 0.08,
      rotateSpeed: config?.rotateSpeed ?? 1.0,
      panSpeed: config?.panSpeed ?? 1.0,
      zoomSpeed: config?.zoomSpeed ?? 1.0,
      minDistance: config?.minDistance ?? 0.5,
      maxDistance: config?.maxDistance ?? 100,
      minPolarAngle: config?.minPolarAngle ?? 0.01,
      maxPolarAngle: config?.maxPolarAngle ?? Math.PI - 0.01,
      minAzimuthAngle: config?.minAzimuthAngle ?? -Infinity,
      maxAzimuthAngle: config?.maxAzimuthAngle ?? Infinity,
      target: config?.target ?? (initialCamera?.target ? [initialCamera.target[0], initialCamera.target[1], initialCamera.target[2]] : [0, 0, 0]),
      autoRotate: config?.autoRotate ?? false,
      autoRotateSpeed: config?.autoRotateSpeed ?? 2.0,
      reducedMotion: config?.reducedMotion ?? false,
    };

    this.target = [...this.config.target];

    // Compute initial spherical coordinates from camera position & target
    const pos = initialCamera?.position ?? [0, 0, 5];
    const dx = pos[0] - this.target[0];
    const dy = pos[1] - this.target[1];
    const dz = pos[2] - this.target[2];

    const dist = Math.hypot(dx, dy, dz) || 5;
    this.currentDistance = clamp(dist, this.config.minDistance, this.config.maxDistance);
    this.targetDistance = this.currentDistance;

    const polar = Math.acos(clamp(dy / dist, -1, 1));
    this.currentPolar = clamp(polar, this.config.minPolarAngle, this.config.maxPolarAngle);
    this.targetPolar = this.currentPolar;

    const azimuth = Math.atan2(dx, dz);
    this.currentAzimuth = azimuth;
    this.targetAzimuth = azimuth;
  }

  /**
   * Applies rotation delta in spherical coordinates (azimuth and polar angles).
   */
  public rotate(deltaAzimuth: number, deltaPolar: number): void {
    if (!this.config.enableOrbit || this.config.mode === "none") return;

    this.isInteracting = true;
    const factor = this.config.rotateSpeed;

    this.targetAzimuth += deltaAzimuth * factor;
    this.targetAzimuth = clamp(this.targetAzimuth, this.config.minAzimuthAngle, this.config.maxAzimuthAngle);

    this.targetPolar += deltaPolar * factor;
    this.targetPolar = clamp(this.targetPolar, this.config.minPolarAngle, this.config.maxPolarAngle);

    if (this.config.reducedMotion || !this.config.enableDamping) {
      this.currentAzimuth = this.targetAzimuth;
      this.currentPolar = this.targetPolar;
    }
  }

  /**
   * Pans target and camera in screen-aligned coordinates.
   */
  public pan(deltaX: number, deltaY: number): void {
    if (!this.config.enablePan || this.config.mode === "none") return;

    this.isInteracting = true;
    const factor = this.config.panSpeed * (this.currentDistance / 10);

    // Compute basis vectors for screen-space pan
    const sinA = Math.sin(this.currentAzimuth);
    const cosA = Math.cos(this.currentAzimuth);

    // Right vector in world space: [cos(azimuth), 0, -sin(azimuth)]
    const rightX = cosA;
    const rightZ = -sinA;

    // Up vector approximation: [0, 1, 0]
    this.target[0] += (rightX * deltaX) * factor;
    this.target[1] += deltaY * factor;
    this.target[2] += (rightZ * deltaX) * factor;
  }

  /**
   * Zooms by adjusting distance to target.
   */
  public zoom(delta: number): void {
    if (!this.config.enableZoom || this.config.mode === "none") return;

    this.isInteracting = true;
    const factor = this.config.zoomSpeed * 0.1;
    this.targetDistance += delta * factor;
    this.targetDistance = clamp(this.targetDistance, this.config.minDistance, this.config.maxDistance);

    if (this.config.reducedMotion || !this.config.enableDamping) {
      this.currentDistance = this.targetDistance;
    }
  }

  /**
   * Smoothly frames a 3D bounding box within the camera field of view.
   */
  public focusOn(boundingBox: BoundingBox3D, fov = 50): void {
    const center = boundingBox.center ?? [
      (boundingBox.min[0] + boundingBox.max[0]) / 2,
      (boundingBox.min[1] + boundingBox.max[1]) / 2,
      (boundingBox.min[2] + boundingBox.max[2]) / 2,
    ];

    const size = boundingBox.size ?? [
      Math.abs(boundingBox.max[0] - boundingBox.min[0]),
      Math.abs(boundingBox.max[1] - boundingBox.min[1]),
      Math.abs(boundingBox.max[2] - boundingBox.min[2]),
    ];

    const maxDim = Math.max(size[0], size[1], size[2]);
    const fovRad = (fov * Math.PI) / 180;
    const requiredDistance = (maxDim / 2) / Math.tan(fovRad / 2) * 1.5;

    this.target = [center[0], center[1], center[2]];
    this.targetDistance = clamp(requiredDistance, this.config.minDistance, this.config.maxDistance);

    if (this.config.reducedMotion) {
      this.currentDistance = this.targetDistance;
    }
  }

  /**
   * Updates look-at target.
   */
  public lookAt(target: Vector3Tuple): void {
    this.target = [target[0], target[1], target[2]];
  }

  /**
   * Sets interacting state flag.
   */
  public setInteracting(interacting: boolean): void {
    this.isInteracting = interacting;
  }

  /**
   * Updates controls by delta time (seconds), applying damping and auto-rotation.
   * Returns updated camera configuration.
   */
  public update(deltaTime = 0.016): Camera3DConfig {
    if (this.config.autoRotate && !this.isInteracting && !this.config.reducedMotion) {
      this.targetAzimuth += (this.config.autoRotateSpeed * Math.PI / 180) * deltaTime;
    }

    if (this.config.enableDamping && !this.config.reducedMotion) {
      const d = clamp(this.config.dampingFactor * (deltaTime / 0.016), 0.01, 1);
      this.currentAzimuth += (this.targetAzimuth - this.currentAzimuth) * d;
      this.currentPolar += (this.targetPolar - this.currentPolar) * d;
      this.currentDistance += (this.targetDistance - this.currentDistance) * d;
    } else {
      this.currentAzimuth = this.targetAzimuth;
      this.currentPolar = this.targetPolar;
      this.currentDistance = this.targetDistance;
    }

    // Convert spherical coordinates back to Cartesian position relative to target
    const sinP = Math.sin(this.currentPolar);
    const cosP = Math.cos(this.currentPolar);
    const sinA = Math.sin(this.currentAzimuth);
    const cosA = Math.cos(this.currentAzimuth);

    const posX = this.target[0] + this.currentDistance * sinP * sinA;
    const posY = this.target[1] + this.currentDistance * cosP;
    const posZ = this.target[2] + this.currentDistance * sinP * cosA;

    return {
      type: "perspective",
      position: [posX, posY, posZ],
      target: [this.target[0], this.target[1], this.target[2]],
    };
  }

  /**
   * Returns current internal state.
   */
  public getState(): CameraControlsState {
    const sinP = Math.sin(this.currentPolar);
    const cosP = Math.cos(this.currentPolar);
    const sinA = Math.sin(this.currentAzimuth);
    const cosA = Math.cos(this.currentAzimuth);

    return {
      azimuth: this.currentAzimuth,
      polar: this.currentPolar,
      distance: this.currentDistance,
      target: [this.target[0], this.target[1], this.target[2]],
      position: [
        this.target[0] + this.currentDistance * sinP * sinA,
        this.target[1] + this.currentDistance * cosP,
        this.target[2] + this.currentDistance * sinP * cosA,
      ],
      isInteracting: this.isInteracting,
    };
  }

  /**
   * Updates configuration dynamically.
   */
  public updateConfig(partial: Partial<CameraControlsConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}
