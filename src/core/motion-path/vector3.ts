/**
 * AF Motion Path Vector & Matrix Math Utilities
 *
 * High-performance, allocation-conscious 2D/3D vector math for path sampling,
 * tangent evaluation, coordinate normalization, and orientation frames.
 */

import type { PathPoint3D, PathPointInput, PathTangent } from "./types.js";

const EPSILON = 1e-9;

export function toPoint3D(input: PathPointInput): PathPoint3D {
  if (Array.isArray(input)) {
    return {
      x: input[0] ?? 0,
      y: input[1] ?? 0,
      z: input[2] ?? 0,
    };
  }
  return {
    x: (input as { x: number }).x ?? 0,
    y: (input as { y: number }).y ?? 0,
    z: (input as { z?: number }).z ?? 0,
  };
}

export function createPoint3D(x = 0, y = 0, z = 0): PathPoint3D {
  return { x, y, z };
}

export function clonePoint3D(p: PathPoint3D): PathPoint3D {
  return { x: p.x, y: p.y, z: p.z };
}

export function add(a: PathPoint3D, b: PathPoint3D): PathPoint3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: PathPoint3D, b: PathPoint3D): PathPoint3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(p: PathPoint3D, s: number): PathPoint3D {
  return { x: p.x * s, y: p.y * s, z: p.z * s };
}

export function lerp(a: PathPoint3D, b: PathPoint3D, t: number): PathPoint3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function dot(a: PathPoint3D, b: PathPoint3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: PathPoint3D, b: PathPoint3D): PathPoint3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function lengthSq(p: PathPoint3D): number {
  return p.x * p.x + p.y * p.y + p.z * p.z;
}

export function length(p: PathPoint3D): number {
  return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
}

export function distanceSq(a: PathPoint3D, b: PathPoint3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function distance(a: PathPoint3D, b: PathPoint3D): number {
  return Math.sqrt(distanceSq(a, b));
}

export function normalize(p: PathPoint3D, fallback?: PathPoint3D): PathPoint3D {
  const len = length(p);
  if (len < EPSILON) {
    return fallback ? { ...fallback } : { x: 1, y: 0, z: 0 };
  }
  const inv = 1 / len;
  return { x: p.x * inv, y: p.y * inv, z: p.z * inv };
}

/**
 * Calculates the 2D rotation angle in degrees from a tangent vector in the XY plane.
 */
export function angle2D(tangent: PathTangent): number {
  return Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);
}

/**
 * Calculates the 2D rotation angle in radians from a tangent vector in the XY plane.
 */
export function radians2D(tangent: PathTangent): number {
  return Math.atan2(tangent.y, tangent.x);
}

/**
 * Returns a 2D normal vector perpendicular to the given 2D tangent in the XY plane.
 */
export function normal2D(tangent: PathTangent): PathPoint3D {
  return normalize({ x: -tangent.y, y: tangent.x, z: 0 }, { x: 0, y: 1, z: 0 });
}

/**
 * Derives 3D Euler angles (pitch, yaw, roll in degrees) from a normalized 3D tangent vector.
 */
export function eulerFromTangent(tangent: PathTangent): { pitch: number; yaw: number; roll: number } {
  const pitch = Math.asin(Math.max(-1, Math.min(1, -tangent.y))) * (180 / Math.PI);
  const yaw = Math.atan2(tangent.x, tangent.z) * (180 / Math.PI);
  return { pitch, yaw, roll: 0 };
}

/**
 * Computes Frenet/Bishop normal and binormal for a given 3D tangent vector.
 */
export function computeOrientationFrame(
  tangent: PathTangent,
  secondDerivative?: PathPoint3D,
  previousNormal?: PathPoint3D
): { normal: PathPoint3D; binormal: PathPoint3D } {
  // If curve has a valid second derivative, use standard Frenet acceleration
  if (secondDerivative && lengthSq(secondDerivative) > EPSILON) {
    const c = cross(tangent, secondDerivative);
    if (lengthSq(c) > EPSILON) {
      const binormal = normalize(c);
      const normal = normalize(cross(binormal, tangent));
      return { normal, binormal };
    }
  }

  // If a previous normal is available (parallel transport / Bishop frame)
  if (previousNormal && lengthSq(previousNormal) > EPSILON) {
    const projectedNormal = sub(previousNormal, scale(tangent, dot(previousNormal, tangent)));
    if (lengthSq(projectedNormal) > EPSILON) {
      const normal = normalize(projectedNormal);
      const binormal = normalize(cross(tangent, normal));
      return { normal, binormal };
    }
  }

  // Fallback to reference axis
  const refAxis: PathPoint3D = Math.abs(tangent.y) > 0.99 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const binormal = normalize(cross(tangent, refAxis));
  const normal = normalize(cross(binormal, tangent));
  return { normal, binormal };
}

export {
  add as vec3Add,
  sub as vec3Sub,
  scale as vec3Scale,
  lerp as vec3Lerp,
  dot as vec3Dot,
  cross as vec3Cross,
  length as vec3Length,
  lengthSq as vec3LengthSq,
  distance as vec3Distance,
  distanceSq as vec3DistanceSq,
  normalize as vec3Normalize,
};
