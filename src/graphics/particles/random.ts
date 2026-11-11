/**
 * AF Motion Advanced Particle Engine — Deterministic Randomness
 *
 * Provides seeded Mulberry32 pseudo-random number generation for deterministic,
 * reproducible particle simulations, random distributions, and vectors.
 */

import { createPRNG as createTexturePRNG } from "../textures/prng.js";
import type { ParticleColorInput, ParticleVector3Tuple, ParticleVector4Tuple } from "./types.js";

/**
 * Creates a deterministic PRNG returning numbers in [0, 1), reusing the textures Mulberry32 engine.
 */
export function createParticlePRNG(seed?: number | string): () => number {
  const prng = createTexturePRNG(seed);
  return () => prng.next();
}

export { createParticlePRNG as createPRNG };

/**
 * Resolves a range [min, max] or fixed number with a given PRNG.
 */
export function resolveRange(value: number | readonly [number, number] | undefined, defaultVal: number, prng: () => number): number {
  if (value === undefined) return defaultVal;
  if (typeof value === "number") return value;
  const [min, max] = value;
  return min + (max - min) * prng();
}

/**
 * Generates a random unit vector on a sphere surface or inside a cone.
 */
export function randomDirectionInCone(
  baseDirection: ParticleVector3Tuple,
  spreadAngleRad: number,
  prng: () => number,
): ParticleVector3Tuple {
  if (spreadAngleRad <= 0) {
    const len = Math.hypot(baseDirection[0], baseDirection[1], baseDirection[2]) || 1;
    return [baseDirection[0] / len, baseDirection[1] / len, baseDirection[2] / len];
  }

  // Sample uniform disk on spherical cap
  const cosTheta = Math.cos(spreadAngleRad * prng());
  const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
  const phi = 2 * Math.PI * prng();

  const x = sinTheta * Math.cos(phi);
  const y = sinTheta * Math.sin(phi);
  const z = cosTheta;

  // Align z-axis with baseDirection using Rodrigues rotation or orthonormal basis
  const [bx, by, bz] = baseDirection;
  const blen = Math.hypot(bx, by, bz) || 1;
  const target: ParticleVector3Tuple = [bx / blen, by / blen, bz / blen];

  // Up vector
  const up: ParticleVector3Tuple = Math.abs(target[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0];
  // Cross product target x up
  const rightX = target[1] * up[2] - target[2] * up[1];
  const rightY = target[2] * up[0] - target[0] * up[2];
  const rightZ = target[0] * up[1] - target[1] * up[0];
  const rlen = Math.hypot(rightX, rightY, rightZ) || 1;
  const r: ParticleVector3Tuple = [rightX / rlen, rightY / rlen, rightZ / rlen];

  // Cross product right x target
  const uX = r[1] * target[2] - r[2] * target[1];
  const uY = r[2] * target[0] - r[0] * target[2];
  const uZ = r[0] * target[1] - r[1] * target[0];

  const resX = r[0] * x + uX * y + target[0] * z;
  const resY = r[1] * x + uY * y + target[1] * z;
  const resZ = r[2] * x + uZ * y + target[2] * z;

  return [resX, resY, resZ];
}

/**
 * Parses a ParticleColorInput into an RGBA [r, g, b, a] normalized [0, 1] tuple.
 */
export function parseParticleColor(
  color: ParticleColorInput | undefined,
  defaultColor: ParticleVector4Tuple = [1, 1, 1, 1],
): ParticleVector4Tuple {
  if (!color) return defaultColor;
  if (Array.isArray(color) && color.length >= 3) {
    return [color[0], color[1], color[2], color[3] ?? 1];
  }
  if (typeof color === "object" && "r" in color) {
    return [color.r, color.g, color.b, color.a ?? 1];
  }
  if (typeof color === "string") {
    const trimmed = color.trim().toLowerCase();
    if (trimmed.startsWith("#")) {
      const hex = trimmed.slice(1);
      if (hex.length === 3) {
        const r = parseInt(hex[0]! + hex[0]!, 16) / 255;
        const g = parseInt(hex[1]! + hex[1]!, 16) / 255;
        const b = parseInt(hex[2]! + hex[2]!, 16) / 255;
        return [r, g, b, 1];
      }
      if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return [r, g, b, a];
      }
    } else if (trimmed.startsWith("rgb")) {
      const nums = trimmed.match(/[\d.]+/g)?.map(Number);
      if (nums && nums.length >= 3) {
        return [nums[0]! / 255, nums[1]! / 255, nums[2]! / 255, nums[3] ?? 1];
      }
    }
  }
  return defaultColor;
}

export { parseParticleColor as parseColor };
