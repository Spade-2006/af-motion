/**
 * AF Motion — Physics Composition Validation & Safety Engine
 *
 * Enforces consistency across multi-body setups, constraints, behaviors, and timings.
 * Prevents circular dependencies, conflicting ownership, and invalid body references.
 */

import type { PhysicsCompositionConfig } from "./composition-types.js";
import type { PhysicsValidationResult } from "./validation.js";
import { isFiniteNumber, isPhysicsValue } from "./math.js";

/**
 * Thrown when a physics composition configuration is invalid.
 */
export class PhysicsCompositionValidationError extends Error {
  constructor(message: string, public readonly errors: readonly string[] = []) {
    super(message);
    this.name = "PhysicsCompositionValidationError";
  }
}

/**
 * Thrown when a composition contains conflicting systems or mutually exclusive constraints.
 */
export class PhysicsCompositionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhysicsCompositionConflictError";
  }
}

/**
 * Validates a complete PhysicsCompositionConfig object.
 */
export function validatePhysicsCompositionConfig(config: unknown): PhysicsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: ["PhysicsCompositionConfig must be a non-null object."],
      warnings: [],
    };
  }

  const c = config as Record<string, unknown>;

  // Timestep
  if ("timestep" in c && c.timestep !== undefined) {
    if (!isFiniteNumber(c.timestep)) {
      errors.push(`timestep must be a finite number, received ${String(c.timestep)}.`);
    } else if (c.timestep <= 0) {
      errors.push(`timestep must be strictly greater than zero, received ${c.timestep}.`);
    }
  }

  // MaxSubSteps
  if ("maxSubSteps" in c && c.maxSubSteps !== undefined) {
    if (!Number.isInteger(c.maxSubSteps) || (c.maxSubSteps as number) < 1) {
      errors.push(`maxSubSteps must be an integer >= 1, received ${String(c.maxSubSteps)}.`);
    }
  }

  // TimeScale
  if ("timeScale" in c && c.timeScale !== undefined) {
    if (!isFiniteNumber(c.timeScale) || (c.timeScale as number) < 0) {
      errors.push(`timeScale must be a non-negative finite number, received ${String(c.timeScale)}.`);
    }
  }

  // Gravity
  if ("gravity" in c && c.gravity !== undefined) {
    if (!isPhysicsValue(c.gravity)) {
      errors.push(`gravity must be a finite number or PhysicsVector, received ${JSON.stringify(c.gravity)}.`);
    }
  }

  // Bodies validation
  const bodyIdSet = new Set<string>();
  if ("bodies" in c && c.bodies !== undefined) {
    if (!Array.isArray(c.bodies)) {
      errors.push("bodies must be an array of CollisionBodyConfig objects.");
    } else {
      for (let i = 0; i < c.bodies.length; i++) {
        const b = c.bodies[i];
        if (!b || typeof b !== "object") {
          errors.push(`bodies[${i}] must be an object.`);
          continue;
        }
        if (!b.shape || typeof b.shape !== "object" || !b.shape.type) {
          errors.push(`bodies[${i}].shape must be a valid CollisionShape.`);
        }
        if (b.id) {
          if (bodyIdSet.has(b.id)) {
            errors.push(`Duplicate body ID detected: '${b.id}'.`);
          }
          bodyIdSet.add(b.id);
        }
        if (b.type === "dynamic" || !b.type) {
          if ("mass" in b && b.mass !== undefined && (!isFiniteNumber(b.mass) || b.mass <= 0)) {
            errors.push(`bodies[${i}].mass must be strictly greater than zero.`);
          }
        }
      }
    }
  }

  // Constraints validation
  if ("constraints" in c && c.constraints !== undefined) {
    if (!Array.isArray(c.constraints)) {
      errors.push("constraints must be an array of CollisionConstraintConfig objects.");
    } else {
      for (let i = 0; i < c.constraints.length; i++) {
        const constraint = c.constraints[i];
        if (!constraint || typeof constraint !== "object") {
          errors.push(`constraints[${i}] must be an object.`);
          continue;
        }
        if (!constraint.type) {
          errors.push(`constraints[${i}].type is required.`);
        }

        // Body references check
        const bodyAId = typeof constraint.bodyA === "string" ? constraint.bodyA : constraint.bodyA?.id;
        const bodyBId = typeof constraint.bodyB === "string" ? constraint.bodyB : constraint.bodyB?.id;

        if (bodyIdSet.size > 0 && bodyAId && !bodyIdSet.has(bodyAId)) {
          errors.push(`constraints[${i}].bodyA refers to unknown body ID: '${bodyAId}'.`);
        }
        if (bodyIdSet.size > 0 && bodyBId && !bodyIdSet.has(bodyBId)) {
          errors.push(`constraints[${i}].bodyB refers to unknown body ID: '${bodyBId}'.`);
        }

        // Circular self-constraint check
        if (bodyAId && bodyBId && bodyAId === bodyBId) {
          errors.push(`constraints[${i}] cannot bind body '${bodyAId}' to itself.`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts that a PhysicsCompositionConfig is valid or throws PhysicsCompositionValidationError.
 */
export function assertValidPhysicsCompositionConfig(
  config: unknown
): asserts config is PhysicsCompositionConfig {
  const result = validatePhysicsCompositionConfig(config);
  if (!result.valid) {
    throw new PhysicsCompositionValidationError(
      `Invalid PhysicsCompositionConfig: ${result.errors.join("; ")}`,
      result.errors
    );
  }
}

/**
 * Safely corrects an invalid or incomplete PhysicsCompositionConfig to valid defaults.
 */
export function correctPhysicsCompositionConfig(
  config: Partial<PhysicsCompositionConfig> = {}
): PhysicsCompositionConfig {
  const timestep = config.timestep && config.timestep > 0 ? config.timestep : 1 / 60;
  const maxSubSteps = config.maxSubSteps && config.maxSubSteps >= 1 ? config.maxSubSteps : 10;
  const timeScale = config.timeScale !== undefined && config.timeScale >= 0 ? config.timeScale : 1.0;

  return {
    ...config,
    timestep,
    maxSubSteps,
    timeScale,
    bodies: config.bodies ? [...config.bodies] : [],
    constraints: config.constraints ? [...config.constraints] : [],
    behaviors: config.behaviors ? [...config.behaviors] : [],
  };
}
