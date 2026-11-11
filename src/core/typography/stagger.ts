/**
 * AF Motion Kinetic Typography Stagger & Choreography Engine
 *
 * Computes deterministic unit delays and ordering using forward, reverse,
 * center-out, edges-in, and seeded pseudo-random permutations.
 */

import { resolveEasing } from "../../easing/easings.js";
import type { StaggerConfig, TypographyUnit } from "./types.js";

/**
 * Deterministic 32-bit PRNG (Mulberry32) for reproducible random staggers.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an array of normalized stagger factors (0..1) for each unit.
 */
export function computeStaggerFactors(
  total: number,
  config: StaggerConfig = {}
): number[] {
  if (total <= 1) return [0];

  const from = config.from ?? "forward";
  const factors = new Array<number>(total);

  if (typeof from === "number") {
    // Distance from custom numeric index
    const center = Math.max(0, Math.min(total - 1, from));
    const maxDist = Math.max(center, total - 1 - center);
    for (let i = 0; i < total; i++) {
      factors[i] = maxDist > 0 ? Math.abs(i - center) / maxDist : 0;
    }
  } else {
    switch (from) {
      case "forward":
        for (let i = 0; i < total; i++) factors[i] = i / (total - 1);
        break;

      case "reverse":
        for (let i = 0; i < total; i++) factors[i] = (total - 1 - i) / (total - 1);
        break;

      case "center-out": {
        const center = (total - 1) / 2;
        const maxDist = center;
        for (let i = 0; i < total; i++) {
          factors[i] = maxDist > 0 ? Math.abs(i - center) / maxDist : 0;
        }
        break;
      }

      case "edges-in": {
        const center = (total - 1) / 2;
        const maxDist = center;
        for (let i = 0; i < total; i++) {
          factors[i] = maxDist > 0 ? (maxDist - Math.abs(i - center)) / maxDist : 0;
        }
        break;
      }

      case "random": {
        // Deterministic Fisher-Yates shuffle
        const rng = mulberry32(config.seed ?? 42);
        const indices = Array.from({ length: total }, (_, i) => i);
        for (let i = total - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const temp = indices[i]!;
          indices[i] = indices[j]!;
          indices[j] = temp;
        }
        for (let rank = 0; rank < total; rank++) {
          factors[indices[rank]!] = rank / (total - 1);
        }
        break;
      }
    }
  }

  // Apply easing curve across stagger distribution if specified
  if (config.ease) {
    const easingFn = resolveEasing(config.ease);
    for (let i = 0; i < total; i++) {
      factors[i] = easingFn(factors[i]!);
    }
  }

  return factors;
}

/**
 * Computes individual unit start delays in milliseconds.
 */
export function computeUnitDelays(
  units: ReadonlyArray<TypographyUnit>,
  stagger?: number | StaggerConfig
): number[] {
  const total = units.length;
  if (total === 0) return [];
  if (stagger === undefined || stagger === 0) {
    return new Array(total).fill(0);
  }

  if (typeof stagger === "number") {
    return units.map((_, i) => i * stagger);
  }

  if (stagger.custom) {
    return units.map((unit, i) => stagger.custom!(i, total, unit));
  }

  const each = stagger.each ?? 30;
  const factors = computeStaggerFactors(total, stagger);
  const totalSpan = (total - 1) * each;

  return factors.map((f) => f * totalSpan);
}
