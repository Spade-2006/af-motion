import { applyMotionDNA } from "./motion-dna.js";
import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";
import { resolveEasing } from "../easing/easings.js";

export type AdaptiveReducedMotion = "respect" | "ignore";

export interface AdaptiveMotionProfile extends MotionDNAOverrides {
  /** Optional Motion DNA identity used as the timing/easing baseline. */
  motionDNA?: string;
  /** Motion intensity from above zero to 1; lower values lengthen animation duration. Defaults to 1. */
  intensity?: number;
  /** Intensity used when `conditions.lowPower` is true. Defaults to `intensity`. */
  lowPowerIntensity?: number;
  /** How an explicitly reduced-motion condition affects compatible animation options. Defaults to "respect". */
  reducedMotion?: AdaptiveReducedMotion;
}

export interface AdaptiveMotionConditions {
  /** Explicit reduced-motion condition supplied by the caller. */
  reducedMotion?: boolean;
  /** Explicit low-power condition supplied by the caller. */
  lowPower?: boolean;
  /** Per-resolution intensity override. Takes precedence over profile intensity values. */
  intensity?: number;
}

export type AdaptiveMotionOverrides = MotionDNAOverrides;

function validateIntensity(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 1) {
    throw new RangeError(`${name} must be a finite number > 0 and <= 1, received ${String(value)}`);
  }
}

function validateMotionOptions(options: MotionDNAOverrides): void {
  for (const [name, value] of Object.entries(options)) {
    if (!["duration", "delay", "playbackRate", "respectReducedMotion", "easing"].includes(name)) {
      throw new TypeError(`Unknown animation option "${name}"`);
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
      if (typeof value !== "boolean") throw new TypeError("respectReducedMotion must be a boolean");
    } else if (name === "easing") {
      if (typeof value !== "string" && typeof value !== "function") {
        throw new TypeError("easing must be a function or a registered easing name");
      }
      resolveEasing(value);
    }
  }
}

function validateProfile(profile: AdaptiveMotionProfile): void {
  if (profile === null || typeof profile !== "object" || Array.isArray(profile)) {
    throw new TypeError("Adaptive motion profile must be an object");
  }
  if (profile.intensity !== undefined) validateIntensity("intensity", profile.intensity);
  if (profile.lowPowerIntensity !== undefined) {
    validateIntensity("lowPowerIntensity", profile.lowPowerIntensity);
  }
  if (
    profile.reducedMotion !== undefined &&
    profile.reducedMotion !== "respect" &&
    profile.reducedMotion !== "ignore"
  ) {
    throw new TypeError('reducedMotion must be "respect" or "ignore"');
  }
  const { motionDNA: _motionDNA, intensity: _intensity, lowPowerIntensity: _lowPowerIntensity,
    reducedMotion: _reducedMotion, ...motionOptions } = profile;
  validateMotionOptions(motionOptions);
  if (profile.motionDNA !== undefined) applyMotionDNA(profile.motionDNA, motionOptions);
}

function validateConditions(conditions: AdaptiveMotionConditions): void {
  if (conditions === null || typeof conditions !== "object" || Array.isArray(conditions)) {
    throw new TypeError("Adaptive motion conditions must be an object");
  }
  for (const name of ["reducedMotion", "lowPower"] as const) {
    if (conditions[name] !== undefined && typeof conditions[name] !== "boolean") {
      throw new TypeError(`${name} condition must be a boolean`);
    }
  }
  if (conditions.intensity !== undefined) validateIntensity("condition intensity", conditions.intensity);
}

/**
 * Resolves a deterministic animation-option snapshot from a profile and caller-supplied conditions.
 * The returned options are suitable for existing animation APIs; no media queries or monitoring are created.
 */
export function resolveAdaptiveMotion(
  profile: AdaptiveMotionProfile,
  conditions: AdaptiveMotionConditions = {},
  overrides: AdaptiveMotionOverrides = {},
): MotionDNA {
  validateProfile(profile);
  validateConditions(conditions);
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Adaptive motion overrides must be an object");
  }
  validateMotionOptions(overrides);

  const { motionDNA, intensity, lowPowerIntensity, reducedMotion, ...profileOptions } = profile;
  const baseline: MotionDNA = motionDNA
    ? applyMotionDNA(motionDNA, profileOptions)
    : profileOptions;
  const effectiveIntensity = conditions.intensity ??
    (conditions.lowPower ? lowPowerIntensity ?? intensity : intensity) ??
    1;
  const resolved: MotionDNA = {
    ...baseline,
    ...(effectiveIntensity === 1 && baseline.duration === undefined
      ? {}
      : { duration: (baseline.duration ?? 1000) / effectiveIntensity }),
    ...(conditions.reducedMotion !== true
      ? {}
      : { respectReducedMotion: (reducedMotion ?? "respect") === "respect" }),
  };
  return { ...resolved, ...overrides };
}
