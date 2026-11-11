/**
 * AF Motion — Foundational Physics Math & Vector Utilities
 *
 * Framework-independent vector and numerical operations for physics simulations.
 * Guarantees numerical stability, finite float validation, and vector safety.
 */

import type { PhysicsVector, PhysicsValue } from "./types.js";

/**
 * Checks whether a given value is a strictly finite number.
 */
export function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

/**
 * Checks whether a given value is a PhysicsVector object with finite components.
 */
export function isPhysicsVector(val: unknown): val is PhysicsVector {
  if (val === null || typeof val !== "object" || Array.isArray(val)) {
    return false;
  }
  const v = val as Record<string, unknown>;
  if (!isFiniteNumber(v.x)) return false;
  if ("y" in v && v.y !== undefined && !isFiniteNumber(v.y)) return false;
  if ("z" in v && v.z !== undefined && !isFiniteNumber(v.z)) return false;
  return true;
}

/**
 * Checks whether a given value is a valid scalar or vector PhysicsValue.
 */
export function isPhysicsValue(val: unknown): val is PhysicsValue {
  return isFiniteNumber(val) || isPhysicsVector(val);
}

/**
 * Clamps a scalar number between a minimum and maximum bound.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Applies a precision threshold, snapping values close to zero to exactly 0.
 */
export function roundPrecision(val: number, precision: number): number {
  if (Math.abs(val) <= precision) return 0;
  return val;
}

/**
 * Creates a new PhysicsVector instance.
 */
export function createVector(x: number, y?: number, z?: number): PhysicsVector {
  const v: PhysicsVector = { x };
  if (y !== undefined) v.y = y;
  if (z !== undefined) v.z = z;
  return v;
}

/**
 * Creates a deep clone of a vector.
 */
export function cloneVector(v: PhysicsVector): PhysicsVector {
  return createVector(v.x, v.y, v.z);
}

/**
 * Clones a scalar or vector PhysicsValue.
 */
export function clonePhysicsValue(val: PhysicsValue): PhysicsValue {
  return typeof val === "number" ? val : cloneVector(val);
}

/**
 * Adds two vectors component-wise.
 */
export function addVectors(a: PhysicsVector, b: PhysicsVector): PhysicsVector {
  const v: PhysicsVector = { x: a.x + b.x };
  if (a.y !== undefined || b.y !== undefined) {
    v.y = (a.y ?? 0) + (b.y ?? 0);
  }
  if (a.z !== undefined || b.z !== undefined) {
    v.z = (a.z ?? 0) + (b.z ?? 0);
  }
  return v;
}

/**
 * Subtracts vector b from vector a component-wise (a - b).
 */
export function subVectors(a: PhysicsVector, b: PhysicsVector): PhysicsVector {
  const v: PhysicsVector = { x: a.x - b.x };
  if (a.y !== undefined || b.y !== undefined) {
    v.y = (a.y ?? 0) - (b.y ?? 0);
  }
  if (a.z !== undefined || b.z !== undefined) {
    v.z = (a.z ?? 0) - (b.z ?? 0);
  }
  return v;
}

/**
 * Scales a vector by a scalar factor.
 */
export function scaleVector(v: PhysicsVector, factor: number): PhysicsVector {
  const res: PhysicsVector = { x: v.x * factor };
  if (v.y !== undefined) res.y = v.y * factor;
  if (v.z !== undefined) res.z = v.z * factor;
  return res;
}

/**
 * Computes the Euclidean magnitude (length) of a vector.
 */
export function magnitude(v: PhysicsVector): number {
  const x = v.x;
  const y = v.y ?? 0;
  const z = v.z ?? 0;
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Computes the dot product of two vectors.
 */
export function dot(a: PhysicsVector, b: PhysicsVector): number {
  return a.x * b.x + (a.y ?? 0) * (b.y ?? 0) + (a.z ?? 0) * (b.z ?? 0);
}

/**
 * Computes the Euclidean distance between two vectors.
 */
export function distance(a: PhysicsVector, b: PhysicsVector): number {
  return magnitude(subVectors(a, b));
}

/**
 * Normalizes a vector to unit length. Returns a zero vector if magnitude is 0.
 */
export function normalize(v: PhysicsVector): PhysicsVector {
  const mag = magnitude(v);
  if (mag === 0) return createVector(0, v.y !== undefined ? 0 : undefined, v.z !== undefined ? 0 : undefined);
  return scaleVector(v, 1 / mag);
}

/**
 * Component-wise linear interpolation (lerp) between two vectors.
 */
export function lerpVectors(a: PhysicsVector, b: PhysicsVector, alpha: number): PhysicsVector {
  const v: PhysicsVector = { x: a.x + (b.x - a.x) * alpha };
  if (a.y !== undefined || b.y !== undefined) {
    const ay = a.y ?? 0;
    const by = b.y ?? 0;
    v.y = ay + (by - ay) * alpha;
  }
  if (a.z !== undefined || b.z !== undefined) {
    const az = a.z ?? 0;
    const bz = b.z ?? 0;
    v.z = az + (bz - az) * alpha;
  }
  return v;
}

/**
 * Adds two PhysicsValues (both scalar, both vector, or scalar-vector compatible).
 */
export function addValues(a: PhysicsValue, b: PhysicsValue): PhysicsValue {
  if (typeof a === "number" && typeof b === "number") {
    return a + b;
  }
  const va = typeof a === "number" ? createVector(a) : a;
  const vb = typeof b === "number" ? createVector(b) : b;
  return addVectors(va, vb);
}

/**
 * Subtracts PhysicsValue b from PhysicsValue a (a - b).
 */
export function subValues(a: PhysicsValue, b: PhysicsValue): PhysicsValue {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  const va = typeof a === "number" ? createVector(a) : a;
  const vb = typeof b === "number" ? createVector(b) : b;
  return subVectors(va, vb);
}

/**
 * Scales a PhysicsValue by a scalar multiplier.
 */
export function scaleValue(v: PhysicsValue, factor: number): PhysicsValue {
  if (typeof v === "number") {
    return v * factor;
  }
  return scaleVector(v, factor);
}

/**
 * Returns the Euclidean magnitude / absolute value of a PhysicsValue.
 */
export function valueMagnitude(val: PhysicsValue): number {
  if (typeof val === "number") {
    return Math.abs(val);
  }
  return magnitude(val);
}

/**
 * Snaps scalar or vector components under a precision threshold to 0.
 */
export function applyPrecision(val: PhysicsValue, precision: number): PhysicsValue {
  if (typeof val === "number") {
    return roundPrecision(val, precision);
  }
  const v: PhysicsVector = { x: roundPrecision(val.x, precision) };
  if (val.y !== undefined) v.y = roundPrecision(val.y, precision);
  if (val.z !== undefined) v.z = roundPrecision(val.z, precision);
  return v;
}

/**
 * Checks whether a PhysicsValue has settled to effectively zero within precision.
 */
export function isZeroValue(val: PhysicsValue, precision: number): boolean {
  return valueMagnitude(val) <= precision;
}

/**
 * Performs linear interpolation between two PhysicsValues.
 */
export function lerpValues(a: PhysicsValue, b: PhysicsValue, alpha: number): PhysicsValue {
  if (typeof a === "number" && typeof b === "number") {
    return a + (b - a) * alpha;
  }
  const va = typeof a === "number" ? createVector(a) : a;
  const vb = typeof b === "number" ? createVector(b) : b;
  return lerpVectors(va, vb, alpha);
}
