/**
 * AF Motion — Inertia & Gravity Validation & Correction
 *
 * Enforces parameter sanity and numerical stability for momentum and force simulations.
 */

import type { AdvancedInertiaConfig } from "./inertia-types.js";
import type { PhysicsValidationResult } from "./validation.js";
import { isFiniteNumber, isPhysicsValue } from "./math.js";
import { PhysicsValidationError } from "./validation.js";
import { DEFAULT_INERTIA_CONFIG } from "./inertia-presets.js";

/**
 * Validates an AdvancedInertiaConfig object.
 */
export function validateInertiaConfig(config: unknown): PhysicsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["AdvancedInertiaConfig must be a non-null object."],
      warnings: [],
    };
  }

  const c = config as Record<string, unknown>;

  // Mass validation
  if ("mass" in c && c.mass !== undefined) {
    if (!isFiniteNumber(c.mass)) {
      errors.push(`mass must be a finite number, received ${String(c.mass)}.`);
    } else if (c.mass <= 0) {
      errors.push(`mass must be strictly greater than zero, received ${c.mass}.`);
    }
  }

  // Viscous friction validation
  if ("friction" in c && c.friction !== undefined) {
    if (!isFiniteNumber(c.friction)) {
      errors.push(`friction must be a finite number, received ${String(c.friction)}.`);
    } else if (c.friction < 0) {
      errors.push(`friction must be non-negative, received ${c.friction}.`);
    }
  }

  // Linear friction validation
  if ("linearFriction" in c && c.linearFriction !== undefined) {
    if (!isFiniteNumber(c.linearFriction)) {
      errors.push(`linearFriction must be a finite number, received ${String(c.linearFriction)}.`);
    } else if (c.linearFriction < 0) {
      errors.push(`linearFriction must be non-negative, received ${c.linearFriction}.`);
    }
  }

  // Aerodynamic drag validation
  if ("drag" in c && c.drag !== undefined) {
    if (!isFiniteNumber(c.drag)) {
      errors.push(`drag must be a finite number, received ${String(c.drag)}.`);
    } else if (c.drag < 0) {
      errors.push(`drag must be non-negative, received ${c.drag}.`);
    }
  }

  // Gravity vector/scalar validation
  if ("gravity" in c && c.gravity !== undefined) {
    if (!isPhysicsValue(c.gravity)) {
      errors.push(`gravity must be a finite number or PhysicsVector, received ${JSON.stringify(c.gravity)}.`);
    }
  }

  // Terminal velocity validation
  if ("terminalVelocity" in c && c.terminalVelocity !== undefined) {
    if (!isFiniteNumber(c.terminalVelocity)) {
      errors.push(`terminalVelocity must be a finite number, received ${String(c.terminalVelocity)}.`);
    } else if (c.terminalVelocity <= 0) {
      errors.push(`terminalVelocity must be strictly greater than zero, received ${c.terminalVelocity}.`);
    }
  }

  // Minimum velocity settling threshold
  if ("minVelocity" in c && c.minVelocity !== undefined) {
    if (!isFiniteNumber(c.minVelocity)) {
      errors.push(`minVelocity must be a finite number, received ${String(c.minVelocity)}.`);
    } else if (c.minVelocity < 0) {
      errors.push(`minVelocity must be non-negative, received ${c.minVelocity}.`);
    }
  }

  // From / Initial position
  if ("from" in c && c.from !== undefined) {
    if (!isPhysicsValue(c.from)) {
      errors.push(`from position must be a finite number or PhysicsVector, received ${JSON.stringify(c.from)}.`);
    }
  }

  // Initial velocity
  if ("initialVelocity" in c && c.initialVelocity !== undefined) {
    if (!isPhysicsValue(c.initialVelocity)) {
      errors.push(`initialVelocity must be a finite number or PhysicsVector, received ${JSON.stringify(c.initialVelocity)}.`);
    }
  }

  // Spatial bounds min / max
  if ("min" in c && c.min !== undefined) {
    if (!isPhysicsValue(c.min) && c.min !== -Infinity) {
      errors.push(`min bound must be a finite number, -Infinity, or PhysicsVector, received ${JSON.stringify(c.min)}.`);
    }
  }
  if ("max" in c && c.max !== undefined) {
    if (!isPhysicsValue(c.max) && c.max !== Infinity) {
      errors.push(`max bound must be a finite number, Infinity, or PhysicsVector, received ${JSON.stringify(c.max)}.`);
    }
  }

  // Cross-check min <= max
  if ("min" in c && "max" in c && c.min !== undefined && c.max !== undefined) {
    if (typeof c.min === "number" && typeof c.max === "number" && c.min > c.max) {
      errors.push(`min bound (${c.min}) cannot be strictly greater than max bound (${c.max}).`);
    } else if (typeof c.min === "object" && typeof c.max === "object" && c.min !== null && c.max !== null) {
      const minV = c.min as Record<string, unknown>;
      const maxV = c.max as Record<string, unknown>;
      if (typeof minV.x === "number" && typeof maxV.x === "number" && minV.x > maxV.x) {
        errors.push(`min.x (${minV.x}) cannot be strictly greater than max.x (${maxV.x}).`);
      }
      if (typeof minV.y === "number" && typeof maxV.y === "number" && minV.y > maxV.y) {
        errors.push(`min.y (${minV.y}) cannot be strictly greater than max.y (${maxV.y}).`);
      }
      if (typeof minV.z === "number" && typeof maxV.z === "number" && minV.z > maxV.z) {
        errors.push(`min.z (${minV.z}) cannot be strictly greater than max.z (${maxV.z}).`);
      }
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
 * Asserts that an inertia configuration is valid, throwing PhysicsValidationError if invalid.
 */
export function assertValidInertiaConfig(config: unknown): asserts config is AdvancedInertiaConfig {
  const result = validateInertiaConfig(config);
  if (!result.valid) {
    throw new PhysicsValidationError(`Invalid AdvancedInertiaConfig: ${result.errors.join("; ")}`);
  }
}

/**
 * Safely corrects an invalid inertia configuration.
 */
export function correctInertiaConfig(
  config: Partial<AdvancedInertiaConfig> = {}
): {
  corrected: Required<AdvancedInertiaConfig>;
  corrections: string[];
} {
  const corrections: string[] = [];

  let mass = config.mass ?? DEFAULT_INERTIA_CONFIG.mass;
  if (!isFiniteNumber(mass) || mass <= 0) {
    corrections.push(`Invalid mass (${String(mass)}) reset to ${DEFAULT_INERTIA_CONFIG.mass}.`);
    mass = DEFAULT_INERTIA_CONFIG.mass;
  }

  let friction = config.friction ?? DEFAULT_INERTIA_CONFIG.friction;
  if (!isFiniteNumber(friction) || friction < 0) {
    corrections.push(`Invalid friction (${String(friction)}) reset to ${DEFAULT_INERTIA_CONFIG.friction}.`);
    friction = DEFAULT_INERTIA_CONFIG.friction;
  }

  let linearFriction = config.linearFriction ?? DEFAULT_INERTIA_CONFIG.linearFriction;
  if (!isFiniteNumber(linearFriction) || linearFriction < 0) {
    corrections.push(`Invalid linearFriction (${String(linearFriction)}) reset to ${DEFAULT_INERTIA_CONFIG.linearFriction}.`);
    linearFriction = DEFAULT_INERTIA_CONFIG.linearFriction;
  }

  let drag = config.drag ?? DEFAULT_INERTIA_CONFIG.drag;
  if (!isFiniteNumber(drag) || drag < 0) {
    corrections.push(`Invalid drag (${String(drag)}) reset to ${DEFAULT_INERTIA_CONFIG.drag}.`);
    drag = DEFAULT_INERTIA_CONFIG.drag;
  }

  let minVelocity = config.minVelocity ?? DEFAULT_INERTIA_CONFIG.minVelocity;
  if (!isFiniteNumber(minVelocity) || minVelocity < 0) {
    corrections.push(`Invalid minVelocity (${String(minVelocity)}) reset to ${DEFAULT_INERTIA_CONFIG.minVelocity}.`);
    minVelocity = DEFAULT_INERTIA_CONFIG.minVelocity;
  }

  let terminalVelocity = config.terminalVelocity ?? DEFAULT_INERTIA_CONFIG.terminalVelocity;
  if (!isFiniteNumber(terminalVelocity) || terminalVelocity <= 0) {
    corrections.push(`Invalid terminalVelocity (${String(terminalVelocity)}) reset to ${DEFAULT_INERTIA_CONFIG.terminalVelocity}.`);
    terminalVelocity = DEFAULT_INERTIA_CONFIG.terminalVelocity;
  }

  let timestep = config.timestep ?? DEFAULT_INERTIA_CONFIG.timestep;
  if (!isFiniteNumber(timestep) || timestep <= 0) {
    corrections.push(`Invalid timestep (${String(timestep)}) reset to ${DEFAULT_INERTIA_CONFIG.timestep}.`);
    timestep = DEFAULT_INERTIA_CONFIG.timestep;
  }

  let timeScale = config.timeScale ?? DEFAULT_INERTIA_CONFIG.timeScale;
  if (!isFiniteNumber(timeScale) || timeScale < 0) {
    corrections.push(`Invalid timeScale (${String(timeScale)}) reset to ${DEFAULT_INERTIA_CONFIG.timeScale}.`);
    timeScale = DEFAULT_INERTIA_CONFIG.timeScale;
  }

  const from = config.from !== undefined && isPhysicsValue(config.from) ? config.from : DEFAULT_INERTIA_CONFIG.from;
  const initialVelocity = config.initialVelocity !== undefined && isPhysicsValue(config.initialVelocity) ? config.initialVelocity : DEFAULT_INERTIA_CONFIG.initialVelocity;
  const gravity = config.gravity !== undefined && isPhysicsValue(config.gravity) ? config.gravity : DEFAULT_INERTIA_CONFIG.gravity;
  const min = config.min !== undefined && (isPhysicsValue(config.min) || config.min === -Infinity) ? config.min : DEFAULT_INERTIA_CONFIG.min;
  const max = config.max !== undefined && (isPhysicsValue(config.max) || config.max === Infinity) ? config.max : DEFAULT_INERTIA_CONFIG.max;

  return {
    corrected: {
      mass,
      friction,
      linearFriction,
      drag,
      gravity,
      terminalVelocity,
      minVelocity,
      from,
      initialVelocity,
      min,
      max,
      timestep,
      integrator: config.integrator ?? DEFAULT_INERTIA_CONFIG.integrator,
      timeScale,
      maxSubSteps: config.maxSubSteps ?? DEFAULT_INERTIA_CONFIG.maxSubSteps,
      precision: config.precision ?? DEFAULT_INERTIA_CONFIG.precision,
      autoStart: Boolean(config.autoStart ?? DEFAULT_INERTIA_CONFIG.autoStart),
      respectReducedMotion: config.respectReducedMotion !== false,
    },
    corrections,
  };
}
