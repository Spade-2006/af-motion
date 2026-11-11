/**
 * AF Motion — 3D Physics Solver & Integrator Contracts
 *
 * Interfaces for numerical time integration, impulse-based collision resolution,
 * and constraint satisfaction.
 */

import type {
  RigidBodyState,
  CollisionManifold3D,
  Constraint3D,
  Vector3,
} from "../types.js";

/**
 * Interface for time integration of velocities, positions, and orientations.
 */
export interface PhysicsIntegrator3D {
  readonly name: string;
  integrate(
    bodies: readonly RigidBodyState[],
    dt: number,
    gravity: Vector3
  ): void;
}

/**
 * Interface for collision impulse and position correction solvers.
 */
export interface CollisionSolver3D {
  readonly name: string;
  resolveCollisions(
    manifolds: readonly CollisionManifold3D[],
    bodies: ReadonlyMap<string, RigidBodyState>,
    iterations: number,
    dt: number
  ): void;
}

/**
 * Interface for physical joint and constraint solvers.
 */
export interface ConstraintSolver3D {
  readonly name: string;
  solveConstraints(
    constraints: readonly Constraint3D[],
    bodies: ReadonlyMap<string, RigidBodyState>,
    iterations: number,
    dt: number
  ): void;
}
