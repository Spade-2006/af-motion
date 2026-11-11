/**
 * AF Motion — Advanced Spring Validation & Correction
 *
 * Enforces parameter sanity and numerical stability for spring systems.
 */

import type { AdvancedSpringConfig } from "./spring-types.js";
import type { PhysicsValidationResult } from "./validation.js";
import { isFiniteNumber, isPhysicsValue } from "./math.js";
import { PhysicsValidationError } from "./validation.js";
import { DEFAULT_SPRING_CONFIG } from "./spring-presets.js";

/**
 * Validates an AdvancedSpringConfig object.
 */
export function validateSpringConfig(config: unknown): PhysicsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["AdvancedSpringConfig must be a non-null object."],
      warnings: [],
    };
  }

  const c = config as Record<string, unknown>;

  // Stiffness validation
  if ("stiffness" in c && c.stiffness !== undefined) {
    if (!isFiniteNumber(c.stiffness)) {
      errors.push(`stiffness must be a finite number, received ${String(c.stiffness)}.`);
    } else if (c.stiffness <= 0) {
      errors.push(`stiffness must be strictly greater than zero, received ${c.stiffness}.`);
    } else if (c.stiffness > 2000) {
      warnings.push(`Extremely high stiffness (${c.stiffness}) may require smaller timesteps to prevent instability.`);
    }
  }

  // Damping validation
  if ("damping" in c && c.damping !== undefined) {
    if (!isFiniteNumber(c.damping)) {
      errors.push(`damping must be a finite number, received ${String(c.damping)}.`);
    } else if (c.damping < 0) {
      errors.push(`damping must be non-negative, received ${c.damping}.`);
    }
  }

  // Mass validation
  if ("mass" in c && c.mass !== undefined) {
    if (!isFiniteNumber(c.mass)) {
      errors.push(`mass must be a finite number, received ${String(c.mass)}.`);
    } else if (c.mass <= 0) {
      errors.push(`mass must be strictly greater than zero, received ${c.mass}.`);
    }
  }

  // From / Initial position
  if ("from" in c && c.from !== undefined) {
    if (!isPhysicsValue(c.from)) {
      errors.push(`from position must be a finite number or PhysicsVector, received ${JSON.stringify(c.from)}.`);
    }
  }

  // Target position
  if ("target" in c && c.target !== undefined) {
    if (!isPhysicsValue(c.target)) {
      errors.push(`target must be a finite number or PhysicsVector, received ${JSON.stringify(c.target)}.`);
    }
  }

  // Initial velocity
  if ("initialVelocity" in c && c.initialVelocity !== undefined) {
    if (!isPhysicsValue(c.initialVelocity)) {
      errors.push(`initialVelocity must be a finite number or PhysicsVector, received ${JSON.stringify(c.initialVelocity)}.`);
    }
  }

  // restDelta threshold
  if ("restDelta" in c && c.restDelta !== undefined) {
    if (!isFiniteNumber(c.restDelta)) {
      errors.push(`restDelta must be a finite number, received ${String(c.restDelta)}.`);
    } else if (c.restDelta <= 0) {
      errors.push(`restDelta must be strictly greater than zero, received ${c.restDelta}.`);
    }
  }

  // restSpeed threshold
  if ("restSpeed" in c && c.restSpeed !== undefined) {
    if (!isFiniteNumber(c.restSpeed)) {
      errors.push(`restSpeed must be a finite number, received ${String(c.restSpeed)}.`);
    } else if (c.restSpeed <= 0) {
      errors.push(`restSpeed must be strictly greater than zero, received ${c.restSpeed}.`);
    }
  }

  // Timestep
  if ("timestep" in c && c.timestep !== undefined) {
    if (!isFiniteNumber(c.timestep)) {
      errors.push(`timestep must be a finite number, received ${String(c.timestep)}.`);
    } else if (c.timestep <= 0) {
      errors.push(`timestep must be strictly greater than zero, received ${c.timestep}.`);
    }
  }

  // TimeScale
  if ("timeScale" in c && c.timeScale !== undefined) {
    if (!isFiniteNumber(c.timeScale)) {
      errors.push(`timeScale must be a finite number, received ${String(c.timeScale)}.`);
    } else if (c.timeScale < 0) {
      errors.push(`timeScale must be non-negative, received ${c.timeScale}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that a spring configuration is valid, throwing PhysicsValidationError if invalid.
 */
export function assertValidSpringConfig(config: unknown): asserts config is AdvancedSpringConfig {
  const result = validateSpringConfig(config);
  if (!result.valid) {
    throw new PhysicsValidationError(`Invalid AdvancedSpringConfig: ${result.errors.join("; ")}`);
  }
}

/**
 * Safely corrects an invalid spring configuration.
 */
export function correctSpringConfig(
  config: Partial<AdvancedSpringConfig> = {}
): {
  corrected: Required<AdvancedSpringConfig>;
  corrections: string[];
} {
  const corrections: string[] = [];

  let stiffness = config.stiffness ?? DEFAULT_SPRING_CONFIG.stiffness;
  if (!isFiniteNumber(stiffness) || stiffness <= 0) {
    corrections.push(`Invalid stiffness (${String(stiffness)}) reset to ${DEFAULT_SPRING_CONFIG.stiffness}.`);
    stiffness = DEFAULT_SPRING_CONFIG.stiffness;
  }

  let damping = config.damping ?? DEFAULT_SPRING_CONFIG.damping;
  if (!isFiniteNumber(damping) || damping < 0) {
    corrections.push(`Invalid damping (${String(damping)}) reset to ${DEFAULT_SPRING_CONFIG.damping}.`);
    damping = DEFAULT_SPRING_CONFIG.damping;
  }

  let mass = config.mass ?? DEFAULT_SPRING_CONFIG.mass;
  if (!isFiniteNumber(mass) || mass <= 0) {
    corrections.push(`Invalid mass (${String(mass)}) reset to ${DEFAULT_SPRING_CONFIG.mass}.`);
    mass = DEFAULT_SPRING_CONFIG.mass;
  }

  let restDelta = config.restDelta ?? DEFAULT_SPRING_CONFIG.restDelta;
  if (!isFiniteNumber(restDelta) || restDelta <= 0) {
    corrections.push(`Invalid restDelta (${String(restDelta)}) reset to ${DEFAULT_SPRING_CONFIG.restDelta}.`);
    restDelta = DEFAULT_SPRING_CONFIG.restDelta;
  }

  let restSpeed = config.restSpeed ?? DEFAULT_SPRING_CONFIG.restSpeed;
  if (!isFiniteNumber(restSpeed) || restSpeed <= 0) {
    corrections.push(`Invalid restSpeed (${String(restSpeed)}) reset to ${DEFAULT_SPRING_CONFIG.restSpeed}.`);
    restSpeed = DEFAULT_SPRING_CONFIG.restSpeed;
  }

  let timestep = config.timestep ?? DEFAULT_SPRING_CONFIG.timestep;
  if (!isFiniteNumber(timestep) || timestep <= 0) {
    corrections.push(`Invalid timestep (${String(timestep)}) reset to ${DEFAULT_SPRING_CONFIG.timestep}.`);
    timestep = DEFAULT_SPRING_CONFIG.timestep;
  }

  let timeScale = config.timeScale ?? DEFAULT_SPRING_CONFIG.timeScale;
  if (!isFiniteNumber(timeScale) || timeScale < 0) {
    corrections.push(`Invalid timeScale (${String(timeScale)}) reset to ${DEFAULT_SPRING_CONFIG.timeScale}.`);
    timeScale = DEFAULT_SPRING_CONFIG.timeScale;
  }

  const from = config.from !== undefined && isPhysicsValue(config.from) ? config.from : DEFAULT_SPRING_CONFIG.from;
  const target = config.target !== undefined && isPhysicsValue(config.target) ? config.target : DEFAULT_SPRING_CONFIG.target;
  const initialVelocity = config.initialVelocity !== undefined && isPhysicsValue(config.initialVelocity) ? config.initialVelocity : DEFAULT_SPRING_CONFIG.initialVelocity;

  return {
    corrected: {
      stiffness,
      damping,
      mass,
      from,
      target,
      initialVelocity,
      restDelta,
      restSpeed,
      timestep,
      integrator: config.integrator ?? DEFAULT_SPRING_CONFIG.integrator,
      timeScale,
      maxSubSteps: config.maxSubSteps ?? DEFAULT_SPRING_CONFIG.maxSubSteps,
      precision: config.precision ?? DEFAULT_SPRING_CONFIG.precision,
      maxDuration: config.maxDuration ?? DEFAULT_SPRING_CONFIG.maxDuration,
      autoStart: Boolean(config.autoStart ?? DEFAULT_SPRING_CONFIG.autoStart),
      respectReducedMotion: config.respectReducedMotion !== false,
    },
    corrections,
  };
}
