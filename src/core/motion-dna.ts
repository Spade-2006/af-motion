import type { AnimationOptions } from "./animation.js";
import { resolveEasing } from "../easing/easings.js";

export type MotionDNA = Readonly<
  Pick<AnimationOptions, "duration" | "delay" | "playbackRate" | "respectReducedMotion" | "easing">
>;

export type MotionDNAOverrides = Partial<MotionDNA>;

export interface MotionDNARegistryApi {
  /** Returns an immutable snapshot, or undefined when the name is unknown. */
  get(name: string): MotionDNA | undefined;
  /** Registers or replaces a named motion identity. */
  register(name: string, dna: MotionDNA): void;
  /** Removes a named motion identity. */
  remove(name: string): boolean;
}

const registeredDNA = new Map<string, MotionDNA>();

function validateName(name: string): void {
  if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
    throw new TypeError("Motion DNA name must be a non-empty string without surrounding whitespace");
  }
}

function validateDNA(dna: MotionDNA): void {
  if (dna === null || typeof dna !== "object" || Array.isArray(dna)) {
    throw new TypeError("Motion DNA must be an object");
  }
  for (const [name, value] of Object.entries(dna)) {
    if (!["duration", "delay", "playbackRate", "respectReducedMotion", "easing"].includes(name)) {
      throw new TypeError(`Unknown Motion DNA option "${name}"`);
    }
    if (name === "duration" || name === "delay") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
      }
    } else if (name === "playbackRate") {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        throw new RangeError(`playbackRate must be a finite number > 0, received ${String(value)}`);
      }
    } else if (name === "respectReducedMotion") {
      if (typeof value !== "boolean") {
        throw new TypeError(`respectReducedMotion must be a boolean, received ${String(value)}`);
      }
    } else if (name === "easing") {
      if (typeof value !== "string" && typeof value !== "function") {
        throw new TypeError("easing must be a function or a registered easing name");
      }
      resolveEasing(value);
    }
  }
}

function snapshot(dna: MotionDNA): MotionDNA {
  return Object.freeze({ ...dna });
}

export function getMotionDNA(name: string): MotionDNA | undefined {
  validateName(name);
  const dna = registeredDNA.get(name);
  return dna ? snapshot(dna) : undefined;
}

export function registerMotionDNA(name: string, dna: MotionDNA): void {
  validateName(name);
  validateDNA(dna);
  registeredDNA.set(name, snapshot(dna));
}

export function removeMotionDNA(name: string): boolean {
  validateName(name);
  return registeredDNA.delete(name);
}

/**
 * Resolves a registered motion identity with per-animation overrides.
 * The returned options are a fresh object and can be passed to any AF Motion API
 * accepting AnimationOptions or DOMAnimationOptions.
 */
export function applyMotionDNA(name: string, overrides: MotionDNAOverrides = {}): MotionDNA {
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Motion DNA overrides must be an object");
  }
  validateDNA(overrides);
  const dna = getMotionDNA(name);
  if (!dna) throw new TypeError(`Unknown Motion DNA "${name}"`);
  return { ...dna, ...overrides };
}

export const motionDNARegistry: Readonly<MotionDNARegistryApi> = Object.freeze({
  get: getMotionDNA,
  register: registerMotionDNA,
  remove: removeMotionDNA,
});
