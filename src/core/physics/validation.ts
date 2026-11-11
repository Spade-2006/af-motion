/**
 * AF Motion — Foundational Physics Validation & Error System
 *
 * Implements strict runtime validation and custom error classes for
 * configuration integrity, state stability, and lifecycle safety.
 */

import type { PhysicsConfiguration, PhysicsState } from "./types.js";
import { isFiniteNumber, isPhysicsValue } from "./math.js";

/**
 * Base error class for all physics engine exceptions.
 */
export class PhysicsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhysicsError";
  }
}

/**
 * Error thrown when a configuration parameter is invalid or out of bounds.
 */
export class PhysicsValidationError extends PhysicsError {
  constructor(message: string) {
    super(message);
    this.name = "PhysicsValidationError";
  }
}

/**
 * Error thrown when an invalid lifecycle transition or access occurs (e.g. stepping a disposed simulation).
 */
export class PhysicsLifecycleError extends PhysicsError {
  constructor(message: string) {
    super(message);
    this.name = "PhysicsLifecycleError";
  }
}

/**
 * Error thrown when numerical instability, NaN, or infinite values are detected.
 */
export class PhysicsNumericalError extends PhysicsError {
  constructor(message: string) {
    super(message);
    this.name = "PhysicsNumericalError";
  }
}

/**
 * Structured validation report for physics configuration.
 */
export interface PhysicsValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validates a physics configuration object.
 */
export function validatePhysicsConfig(config: unknown): PhysicsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["PhysicsConfiguration must be a non-null object."],
      warnings: [],
    };
  }

  const c = config as Record<string, unknown>;

  // Timestep validation
  if ("timestep" in c && c.timestep !== undefined) {
    if (!isFiniteNumber(c.timestep)) {
      errors.push(`timestep must be a finite number, received ${String(c.timestep)}.`);
    } else if (c.timestep <= 0) {
      errors.push(`timestep must be strictly greater than 0, received ${c.timestep}.`);
    } else if (c.timestep > 0.5) {
      warnings.push(`Large timestep (${c.timestep}s) may cause numerical instability or tunneling.`);
    } else if (c.timestep < 0.0005) {
      warnings.push(`Extremely small timestep (${c.timestep}s) may cause excessive CPU usage.`);
    }
  }

  // Time scale validation
  if ("timeScale" in c && c.timeScale !== undefined) {
    if (!isFiniteNumber(c.timeScale)) {
      errors.push(`timeScale must be a finite number, received ${String(c.timeScale)}.`);
    } else if (c.timeScale < 0) {
      errors.push(`timeScale must be non-negative, received ${c.timeScale}.`);
    } else if (c.timeScale > 10) {
      warnings.push(`High timeScale (${c.timeScale}x) may cause discrete stepping artifacts.`);
    }
  }

  // maxSubSteps validation
  if ("maxSubSteps" in c && c.maxSubSteps !== undefined) {
    if (!isFiniteNumber(c.maxSubSteps) || !Number.isInteger(c.maxSubSteps)) {
      errors.push(`maxSubSteps must be an integer, received ${String(c.maxSubSteps)}.`);
    } else if (c.maxSubSteps < 1) {
      errors.push(`maxSubSteps must be at least 1, received ${c.maxSubSteps}.`);
    } else if (c.maxSubSteps > 100) {
      warnings.push(`maxSubSteps (${c.maxSubSteps}) is very high and could freeze during frame drops.`);
    }
  }

  // Precision validation
  if ("precision" in c && c.precision !== undefined) {
    if (!isFiniteNumber(c.precision)) {
      errors.push(`precision must be a finite number, received ${String(c.precision)}.`);
    } else if (c.precision < 0) {
      errors.push(`precision must be non-negative, received ${c.precision}.`);
    }
  }

  // Integrator validation
  if ("integrator" in c && c.integrator !== undefined) {
    const validIntegrators = ["euler", "semi-implicit-euler", "verlet", "rk4"];
    if (typeof c.integrator !== "string" || !validIntegrators.includes(c.integrator)) {
      errors.push(`integrator must be one of: ${validIntegrators.join(", ")}, received ${String(c.integrator)}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that a configuration is valid, throwing PhysicsValidationError if invalid.
 */
export function assertValidPhysicsConfig(config: unknown): asserts config is PhysicsConfiguration {
  const result = validatePhysicsConfig(config);
  if (!result.valid) {
    throw new PhysicsValidationError(`Invalid PhysicsConfiguration: ${result.errors.join("; ")}`);
  }
}

/**
 * Validates a physics state object.
 */
export function validatePhysicsState(state: unknown): PhysicsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (state === null || typeof state !== "object" || Array.isArray(state)) {
    return {
      valid: false,
      errors: ["PhysicsState must be a non-null object."],
      warnings: [],
    };
  }

  const s = state as Record<string, unknown>;

  // Position validation
  if (!("position" in s) || s.position === undefined) {
    errors.push("PhysicsState must define a 'position'.");
  } else if (!isPhysicsValue(s.position)) {
    errors.push(`position must be a finite number or PhysicsVector, received ${JSON.stringify(s.position)}.`);
  }

  // Velocity validation
  if (!("velocity" in s) || s.velocity === undefined) {
    errors.push("PhysicsState must define a 'velocity'.");
  } else if (!isPhysicsValue(s.velocity)) {
    errors.push(`velocity must be a finite number or PhysicsVector, received ${JSON.stringify(s.velocity)}.`);
  }

  // Acceleration validation (optional)
  if ("acceleration" in s && s.acceleration !== undefined) {
    if (!isPhysicsValue(s.acceleration)) {
      errors.push(`acceleration must be a finite number or PhysicsVector, received ${JSON.stringify(s.acceleration)}.`);
    }
  }

  // Mass validation (optional)
  if ("mass" in s && s.mass !== undefined) {
    if (!isFiniteNumber(s.mass)) {
      errors.push(`mass must be a finite number, received ${String(s.mass)}.`);
    } else if (s.mass <= 0) {
      errors.push(`mass must be strictly greater than 0, received ${s.mass}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that a physics state is valid, throwing PhysicsValidationError if invalid.
 */
export function assertValidPhysicsState(state: unknown): asserts state is PhysicsState {
  const result = validatePhysicsState(state);
  if (!result.valid) {
    throw new PhysicsValidationError(`Invalid PhysicsState: ${result.errors.join("; ")}`);
  }
}

/**
 * Safely applies safe corrections to a partial physics configuration.
 */
export function correctPhysicsConfig(
  config: Partial<PhysicsConfiguration> = {}
): {
  corrected: Required<PhysicsConfiguration>;
  corrections: string[];
} {
  const corrections: string[] = [];

  let timestep = config.timestep ?? 1 / 60;
  if (!isFiniteNumber(timestep) || timestep <= 0) {
    corrections.push(`Invalid timestep (${String(timestep)}) reset to 1/60s.`);
    timestep = 1 / 60;
  }

  let timeScale = config.timeScale ?? 1.0;
  if (!isFiniteNumber(timeScale) || timeScale < 0) {
    corrections.push(`Invalid timeScale (${String(timeScale)}) reset to 1.0.`);
    timeScale = 1.0;
  }

  let maxSubSteps = config.maxSubSteps ?? 10;
  if (!isFiniteNumber(maxSubSteps) || maxSubSteps < 1) {
    corrections.push(`Invalid maxSubSteps (${String(maxSubSteps)}) reset to 10.`);
    maxSubSteps = 10;
  } else {
    maxSubSteps = Math.floor(maxSubSteps);
  }

  let precision = config.precision ?? 1e-5;
  if (!isFiniteNumber(precision) || precision < 0) {
    corrections.push(`Invalid precision (${String(precision)}) reset to 1e-5.`);
    precision = 1e-5;
  }

  const validIntegrators = ["euler", "semi-implicit-euler", "verlet", "rk4"] as const;
  let integrator = config.integrator ?? "semi-implicit-euler";
  if (!validIntegrators.includes(integrator as any)) {
    corrections.push(`Invalid integrator (${String(integrator)}) reset to 'semi-implicit-euler'.`);
    integrator = "semi-implicit-euler";
  }

  const autoStart = Boolean(config.autoStart ?? false);
  const respectReducedMotion = config.respectReducedMotion !== false;

  return {
    corrected: {
      timestep,
      timeScale,
      maxSubSteps,
      precision,
      integrator,
      autoStart,
      respectReducedMotion,
    },
    corrections,
  };
}
