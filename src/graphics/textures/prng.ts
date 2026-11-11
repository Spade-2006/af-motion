/**
 * AF Motion Deterministic Pseudo-Random Number Generator (PRNG)
 *
 * Mulberry32-based deterministic random generator supporting numeric or string seeds.
 */

export interface PRNG {
  /** Return a deterministic float in [0, 1) */
  next(): number;
  /** Return a deterministic float in [min, max) */
  range(min: number, max: number): number;
  /** Return a deterministic integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** Return a deterministic boolean with true probability p (default 0.5) */
  boolean(p?: number): boolean;
  /** Return a random element from an array */
  pick<T>(array: readonly T[]): T;
  /** Seed value used by this PRNG */
  readonly seed: number;
}

/**
 * Hash an arbitrary string into a deterministic 32-bit unsigned integer.
 */
export function hashSeed(seed: number | string | undefined): number {
  if (typeof seed === "number") {
    // Ensure unsigned 32-bit integer
    return (seed >>> 0) || 1;
  }
  if (!seed || typeof seed !== "string") {
    return 1337;
  }

  // cyrb53 / FNV-1a mix for strings
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
}

/**
 * Create a Mulberry32 deterministic PRNG instance.
 */
export function createPRNG(seedInput?: number | string): PRNG {
  let s = hashSeed(seedInput);
  const initialSeed = s;

  function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min: number, max: number): number {
    return min + (max - min) * next();
  }

  function int(min: number, max: number): number {
    return Math.floor(range(min, max + 1));
  }

  function boolean(p = 0.5): boolean {
    return next() < p;
  }

  function pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from an empty array");
    }
    const index = Math.floor(next() * array.length);
    return array[index];
  }

  return {
    next,
    range,
    int,
    boolean,
    pick,
    seed: initialSeed,
  };
}
