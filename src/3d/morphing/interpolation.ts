/**
 * AF Motion — 3D Morph Interpolation Engine
 *
 * High-performance, allocation-free mathematical interpolation for 3D vertex positions,
 * surface normals, UV maps, vertex colors, and multi-target blend weights.
 */

import type { MorphInterpolationMode } from "./types.js";

/**
 * Standard linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothstep Hermite curve interpolation.
 */
export function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Cubic ease-in-out curve.
 */
export function cubicEaseInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Resolves normalized interpolation factor according to selected interpolation mode.
 */
export function resolveInterpolationFactor(
  progress: number,
  mode: MorphInterpolationMode = "linear"
): number {
  switch (mode) {
    case "smoothstep":
      return smoothstep(progress);
    case "cubic":
      return cubicEaseInOut(progress);
    case "spring": {
      // Damped harmonic oscillator approximation
      const p = Math.max(0, Math.min(1, progress));
      return 1 - Math.exp(-6 * p) * Math.cos(7 * p);
    }
    case "linear":
    default:
      return progress;
  }
}

/**
 * Interpolates two Float32Array buffers in-place into an output buffer.
 */
export function interpolateBuffer(
  base: Float32Array,
  target: Float32Array,
  progress: number,
  out: Float32Array,
  options: { isNormal?: boolean; clampProgress?: boolean } = {}
): void {
  const len = Math.min(base.length, target.length, out.length);
  const t = options.clampProgress ? Math.max(0, Math.min(1, progress)) : progress;
  const isNorm = options.isNormal ?? false;

  if (isNorm) {
    for (let i = 0; i < len; i += 3) {
      const bx = base[i], by = base[i + 1], bz = base[i + 2];
      const tx = target[i], ty = target[i + 1], tz = target[i + 2];

      let nx = bx + (tx - bx) * t;
      let ny = by + (ty - by) * t;
      let nz = bz + (tz - bz) * t;

      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
        nx = 0; ny = 1; nz = 0;
      }

      const invLen = 1.0 / (Math.hypot(nx, ny, nz) || 1.0);
      out[i] = nx * invLen;
      out[i + 1] = ny * invLen;
      out[i + 2] = nz * invLen;
    }
  } else {
    for (let i = 0; i < len; i++) {
      const b = base[i];
      const val = b + (target[i] - b) * t;
      out[i] = Number.isFinite(val) ? val : b;
    }
  }
}

/**
 * Blends multiple target buffers against a base buffer using arbitrary weights.
 *
 * Supports additive relative targets:
 *   P = P_base + sum(w_i * delta_i)
 * as well as absolute targets:
 *   P = P_base + sum(w_i * (P_i - P_base))
 */
export function blendMultipleBuffers(
  base: Float32Array,
  targets: Array<{ buffer: Float32Array; weight: number; relative?: boolean }>,
  out: Float32Array,
  options: { isNormal?: boolean } = {}
): void {
  const len = Math.min(base.length, out.length);
  const isNorm = options.isNormal ?? false;

  // First copy base buffer
  for (let i = 0; i < len; i++) {
    out[i] = base[i];
  }

  // Accumulate targets
  for (let tgtIdx = 0; tgtIdx < targets.length; tgtIdx++) {
    const tgt = targets[tgtIdx];
    const w = tgt.weight;
    if (Math.abs(w) < 1e-6) continue;

    const tBuf = tgt.buffer;
    const tLen = Math.min(len, tBuf.length);
    const isRel = tgt.relative ?? false;

    if (isRel) {
      for (let i = 0; i < tLen; i++) {
        out[i] += tBuf[i] * w;
      }
    } else {
      for (let i = 0; i < tLen; i++) {
        out[i] += (tBuf[i] - base[i]) * w;
      }
    }
  }

  // Sanitize non-finite values and renormalize normals
  if (isNorm) {
    for (let i = 0; i < len; i += 3) {
      let nx = out[i];
      let ny = out[i + 1];
      let nz = out[i + 2];

      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) {
        nx = base[i];
        ny = base[i + 1];
        nz = base[i + 2];
      }

      const invLen = 1.0 / (Math.hypot(nx, ny, nz) || 1.0);
      out[i] = nx * invLen;
      out[i + 1] = ny * invLen;
      out[i + 2] = nz * invLen;
    }
  } else {
    for (let i = 0; i < len; i++) {
      if (!Number.isFinite(out[i])) {
        out[i] = base[i];
      }
    }
  }
}
