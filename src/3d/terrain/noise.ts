/**
 * AF Motion — 3D Procedural Terrain Noise Engine
 *
 * Implements deterministic Perlin, Simplex, Fractal Brownian Motion (FBM),
 * Ridged Multifractal, Domain Warping, and Cellular (Voronoi) noise algorithms.
 */

import type { NoiseLayerConfig, TerrainNoiseType } from "./types.js";
import { createPRNG, hashSeed } from "../../graphics/textures/prng.js";

// ============================================================================
// Permutation Table & Gradients
// ============================================================================

const GRADIENTS_2D = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

/**
 * Creates a deterministic 512-entry permutation table from a given seed.
 */
export function createPermutationTable(seedInput?: number | string): Uint8Array {
  const prng = createPRNG(seedInput);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;

  // Fisher-Yates shuffle
  for (let i = 255; i > 0; i--) {
    const j = prng.int(0, i);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }

  const table = new Uint8Array(512);
  for (let i = 0; i < 256; i++) {
    table[i] = p[i];
    table[256 + i] = p[i];
  }

  return table;
}

// Quintic interpolation polynomial: 6t^5 - 15t^4 + 10t^3
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function dot2(grad: number[], x: number, y: number): number {
  return grad[0] * x + grad[1] * y;
}

// ============================================================================
// 2D Perlin Noise
// ============================================================================

export function perlin2D(x: number, y: number, perm: Uint8Array): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const g00 = GRADIENTS_2D[perm[perm[X] + Y] & 7];
  const g10 = GRADIENTS_2D[perm[perm[X + 1] + Y] & 7];
  const g01 = GRADIENTS_2D[perm[perm[X] + Y + 1] & 7];
  const g11 = GRADIENTS_2D[perm[perm[X + 1] + Y + 1] & 7];

  const d00 = dot2(g00, xf, yf);
  const d10 = dot2(g10, xf - 1, yf);
  const d01 = dot2(g01, xf, yf - 1);
  const d11 = dot2(g11, xf - 1, yf - 1);

  const nx0 = lerp(d00, d10, u);
  const nx1 = lerp(d01, d11, u);

  return lerp(nx0, nx1, v);
}

// ============================================================================
// 2D Simplex Noise
// ============================================================================

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

export function simplex2D(x: number, y: number, perm: Uint8Array): number {
  let n0 = 0, n1 = 0, n2 = 0;

  // Skew input space to determine simplex cell
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  // Determine which simplex triangle
  let i1 = 0, j1 = 0;
  if (x0 > y0) {
    i1 = 1;
    j1 = 0;
  } else {
    i1 = 0;
    j1 = 1;
  }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const ii = i & 255;
  const jj = j & 255;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    const gi0 = perm[ii + perm[jj]] & 7;
    n0 = t0 * t0 * dot2(GRADIENTS_2D[gi0], x0, y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    const gi1 = perm[ii + i1 + perm[jj + j1]] & 7;
    n1 = t1 * t1 * dot2(GRADIENTS_2D[gi1], x1, y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    const gi2 = perm[ii + 1 + perm[jj + 1]] & 7;
    n2 = t2 * t2 * dot2(GRADIENTS_2D[gi2], x2, y2);
  }

  return 70.0 * (n0 + n1 + n2);
}

// ============================================================================
// 2D Cellular / Voronoi Noise
// ============================================================================

export function cellular2D(x: number, y: number, seed: number, jitter: number = 1.0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);

  let minDist = 1e9;

  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = xi + ox;
      const cy = yi + oy;

      // Deterministic pseudo-random point within cell (cx, cy)
      const h = hashSeed(`${seed}_${cx}_${cy}`);
      const px = cx + ((h & 0xffff) / 65536) * jitter;
      const py = cy + (((h >>> 16) & 0xffff) / 65536) * jitter;

      const dx = px - x;
      const dy = py - y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
      }
    }
  }

  return Math.min(1.0, minDist);
}

// ============================================================================
// Fractal Brownian Motion (FBM) & Ridged Noise
// ============================================================================

export function fbm2D(
  x: number,
  y: number,
  perm: Uint8Array,
  octaves: number = 6,
  lacunarity: number = 2.0,
  persistence: number = 0.5,
  useSimplex: boolean = false
): number {
  let total = 0;
  let frequency = 1.0;
  let amplitude = 1.0;
  let maxValue = 0;

  for (let o = 0; o < octaves; o++) {
    const val = useSimplex
      ? simplex2D(x * frequency, y * frequency, perm)
      : perlin2D(x * frequency, y * frequency, perm);

    total += val * amplitude;
    maxValue += amplitude;

    frequency *= lacunarity;
    amplitude *= persistence;
  }

  return total / maxValue;
}

export function ridgedMultifractal2D(
  x: number,
  y: number,
  perm: Uint8Array,
  octaves: number = 6,
  lacunarity: number = 2.0,
  persistence: number = 0.5
): number {
  let total = 0;
  let frequency = 1.0;
  let amplitude = 1.0;
  let weight = 1.0;

  for (let o = 0; o < octaves; o++) {
    let signal = perlin2D(x * frequency, y * frequency, perm);
    signal = Math.abs(signal);
    signal = 1.0 - signal;
    signal *= signal;
    signal *= weight;

    weight = signal * 2.0;
    if (weight > 1.0) weight = 1.0;
    if (weight < 0.0) weight = 0.0;

    total += signal * amplitude;

    frequency *= lacunarity;
    amplitude *= persistence;
  }

  return total * 1.25 - 0.5;
}

// ============================================================================
// Domain Warping
// ============================================================================

export function domainWarp2D(
  x: number,
  y: number,
  perm: Uint8Array,
  strength: number = 4.0,
  octaves: number = 4
): number {
  const qx = fbm2D(x, y, perm, octaves);
  const qy = fbm2D(x + 5.2, y + 1.3, perm, octaves);

  const rx = fbm2D(x + strength * qx + 1.7, y + strength * qy + 9.2, perm, octaves);
  const ry = fbm2D(x + strength * qx + 8.3, y + strength * qy + 2.8, perm, octaves);

  return fbm2D(x + strength * rx, y + strength * ry, perm, octaves);
}

// ============================================================================
// Terrain Noise Evaluator
// ============================================================================

export interface TerrainNoiseEvaluator {
  sample(x: number, y: number): number;
  sampleNormalized(x: number, y: number): number;
}

/**
 * Creates an extensible, multi-octave deterministic procedural terrain noise evaluator.
 */
export function createTerrainNoise(config: NoiseLayerConfig = {}): TerrainNoiseEvaluator {
  const type: TerrainNoiseType = config.type ?? "fbm";
  const seedNum = hashSeed(config.seed ?? 1337);
  const perm = createPermutationTable(seedNum);

  const octaves = Math.max(1, config.octaves ?? 6);
  const freq = config.frequency ?? 0.005;
  const persistence = config.persistence ?? 0.5;
  const lacunarity = config.lacunarity ?? 2.0;
  const amplitude = config.amplitude ?? 50.0;
  const offset = config.offset ?? 0;
  const exponent = config.exponent ?? 1.0;
  const warpStrength = config.warpStrength ?? 4.0;
  const cellularJitter = config.cellularJitter ?? 1.0;

  function rawSample(x: number, y: number): number {
    const sx = x * freq;
    const sy = y * freq;

    let val = 0;
    switch (type) {
      case "perlin":
        val = perlin2D(sx, sy, perm);
        break;
      case "simplex":
        val = simplex2D(sx, sy, perm);
        break;
      case "fbm":
        val = fbm2D(sx, sy, perm, octaves, lacunarity, persistence, false);
        break;
      case "ridged":
        val = ridgedMultifractal2D(sx, sy, perm, octaves, lacunarity, persistence);
        break;
      case "domain-warp":
        val = domainWarp2D(sx, sy, perm, warpStrength, octaves);
        break;
      case "cellular":
      case "voronoi":
        val = cellular2D(sx, sy, seedNum, cellularJitter) * 2.0 - 1.0;
        break;
      default:
        val = fbm2D(sx, sy, perm, octaves, lacunarity, persistence, false);
        break;
    }

    if (exponent !== 1.0) {
      const sign = val >= 0 ? 1 : -1;
      val = sign * Math.pow(Math.abs(val), exponent);
    }

    return val * amplitude + offset;
  }

  return {
    sample: (x, y) => rawSample(x, y),
    sampleNormalized: (x, y) => {
      const raw = rawSample(x, y);
      return Math.max(0, Math.min(1, (raw - offset + amplitude) / (amplitude * 2 || 1)));
    },
  };
}
