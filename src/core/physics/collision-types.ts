/**
 * AF Motion — Collision & Constraint Type System
 *
 * Defines contracts for 2D/3D collision shapes, rigid bodies, contact manifolds,
 * kinematic constraints, collision filtering, and the collision world.
 */

import type { PhysicsVector, PhysicsValue, PhysicsSimulationContext } from "./types.js";

/**
 * Supported geometric collision shape types.
 */
export type CollisionShapeType = "circle" | "rectangle" | "sphere" | "box";

/**
 * 2D Circle collision geometry.
 */
export interface CircleShape {
  type: "circle";
  radius: number;
}

/**
 * 2D Axis-aligned rectangle collision geometry.
 */
export interface RectangleShape {
  type: "rectangle";
  width: number;
  height: number;
}

/**
 * 3D Sphere collision geometry.
 */
export interface SphereShape {
  type: "sphere";
  radius: number;
}

/**
 * 3D Axis-aligned bounding box collision geometry.
 */
export interface BoxShape {
  type: "box";
  sizeX: number;
  sizeY: number;
  sizeZ: number;
}

/**
 * Discriminated union of all supported collision shapes.
 */
export type CollisionShape = CircleShape | RectangleShape | SphereShape | BoxShape;

/**
 * Rigid body motion type: dynamic (mass-simulated) or static (immovable, infinite mass).
 */
export type CollisionBodyType = "dynamic" | "static";

/**
 * Configuration options for creating or updating a collision body.
 */
export interface CollisionBodyConfig {
  /**
   * Unique identifier for the body. Generated automatically if omitted.
   */
  id?: string;

  /**
   * Body dynamics type. Default: "dynamic".
   */
  type?: CollisionBodyType;

  /**
   * Collision geometry.
   */
  shape: CollisionShape;

  /**
   * Initial spatial position (2D or 3D vector). Default: { x: 0, y: 0 }.
   */
  position?: PhysicsValue;

  /**
   * Initial instantaneous velocity (2D or 3D vector). Default: { x: 0, y: 0 }.
   */
  velocity?: PhysicsValue;

  /**
   * Mass of dynamic body in kg. Must be > 0. Ignored for static bodies. Default: 1.0.
   */
  mass?: number;

  /**
   * Coefficient of restitution (bounciness) in [0, 1].
   * 0 = perfectly inelastic, 1 = perfectly elastic. Default: 0.8.
   */
  restitution?: number;

  /**
   * Surface friction coefficient in [0, 1]. Default: 0.2.
   */
  friction?: number;

  /**
   * Linear damping applied to velocity per second. Default: 0.01.
   */
  linearDamping?: number;

  /**
   * If true, generates collision contact events but exerts no physical impulse. Default: false.
   */
  isTrigger?: boolean;

  /**
   * Collision layer bitmask for filtering (0 to 32-bit int). Default: 1.
   */
  layer?: number;

  /**
   * Collision mask bitmask defining which layers this body collides with. Default: 0xFFFFFFFF.
   */
  mask?: number;

  /**
   * Custom user data attachment.
   */
  userData?: unknown;
}

/**
 * Runtime representation of a rigid body in the collision world.
 */
export interface CollisionBody {
  readonly id: string;
  type: CollisionBodyType;
  shape: CollisionShape;
  position: PhysicsVector;
  velocity: PhysicsVector;
  mass: number;
  invMass: number;
  restitution: number;
  friction: number;
  linearDamping: number;
  isTrigger: boolean;
  layer: number;
  mask: number;
  userData?: unknown;
}

/**
 * Axis-aligned bounding box for broad-phase collision detection.
 */
export interface AABB {
  min: PhysicsVector;
  max: PhysicsVector;
}

/**
 * Contact manifold containing detailed geometric collision information.
 */
export interface CollisionContact {
  /**
   * Whether a collision intersection exists between participating bodies.
   */
  collided: boolean;

  /**
   * First participating body.
   */
  bodyA: CollisionBody;

  /**
   * Second participating body.
   */
  bodyB: CollisionBody;

  /**
   * Contact point of impact in world coordinates.
   */
  contactPoint: PhysicsVector;

  /**
   * Unit collision normal pointing from body A to body B.
   */
  normal: PhysicsVector;

  /**
   * Penetration depth (overlap distance along normal).
   */
  penetration: number;
}

/**
 * Supported constraint types.
 */
export type ConstraintType =
  | "fixed"
  | "distance"
  | "spring"
  | "axis"
  | "min-max-distance"
  | "boundary";

/**
 * Configuration options for creating a physical constraint.
 */
export interface CollisionConstraintConfig {
  /**
   * Unique identifier for the constraint. Generated automatically if omitted.
   */
  id?: string;

  /**
   * Constraint type.
   */
  type: ConstraintType;

  /**
   * Primary constrained body.
   */
  bodyA: string | CollisionBody;

  /**
   * Optional secondary body for distance, spring, or min-max constraints.
   */
  bodyB?: string | CollisionBody;

  /**
   * Anchor point for fixed or distance constraints (world coordinates).
   */
  anchor?: PhysicsValue;

  /**
   * Target distance for distance or spring constraints.
   */
  targetDistance?: number;

  /**
   * Minimum distance for min-max distance constraint.
   */
  minDistance?: number;

  /**
   * Maximum distance for min-max distance constraint.
   */
  maxDistance?: number;

  /**
   * Locked or allowed axis: "x" | "y" | "z".
   */
  axis?: "x" | "y" | "z";

  /**
   * Spatial bounding region for boundary constraint.
   */
  bounds?: {
    min: PhysicsValue;
    max: PhysicsValue;
  };

  /**
   * Constraint stiffness factor (0 to 1 for rigid, > 0 for spring). Default: 1.0.
   */
  stiffness?: number;

  /**
   * Constraint damping factor. Default: 0.1.
   */
  damping?: number;
}

/**
 * Runtime representation of a physical constraint.
 */
export interface CollisionConstraint {
  readonly id: string;
  type: ConstraintType;
  bodyA: CollisionBody;
  bodyB?: CollisionBody;
  anchor?: PhysicsVector;
  targetDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  axis?: "x" | "y" | "z";
  bounds?: {
    min: PhysicsVector;
    max: PhysicsVector;
  };
  stiffness: number;
  damping: number;
}

/**
 * Result of a single step of the collision world simulation.
 */
export interface CollisionWorldStepResult {
  /**
   * Contacts detected and resolved during the step.
   */
  contacts: CollisionContact[];

  /**
   * Total sub-steps taken during integration.
   */
  stepsTaken: number;

  /**
   * Simulation context snapshot.
   */
  context: PhysicsSimulationContext;
}

/**
 * Configuration options for creating a CollisionWorld.
 */
export interface CollisionWorldOptions {
  /**
   * Global gravity vector applied to dynamic bodies. Default: { x: 0, y: 0 }.
   */
  gravity?: PhysicsValue;

  /**
   * Fixed simulation timestep in seconds. Default: 1/60 (~0.016667s).
   */
  timestep?: number;

  /**
   * Velocity & position impulse resolution iterations per step. Default: 8.
   */
  solverIterations?: number;

  /**
   * Positional correction slop to prevent jitter. Default: 0.01.
   */
  slop?: number;

  /**
   * Positional correction percentage (Baumgarte factor in [0, 1]). Default: 0.8.
   */
  positionalCorrectionPercent?: number;

  /**
   * Maximum sub-steps per frame to prevent spiral of death. Default: 10.
   */
  maxSubSteps?: number;

  /**
   * Spatial boundary limits for all bodies in world. Optional.
   */
  bounds?: {
    min: PhysicsValue;
    max: PhysicsValue;
  };

  /**
   * Initial rigid bodies.
   */
  bodies?: CollisionBodyConfig[];

  /**
   * Initial constraints.
   */
  constraints?: CollisionConstraintConfig[];
}

/**
 * Public interface for an independent, headless collision & constraint world.
 */
export interface CollisionWorld {
  /**
   * Adds a body to the world and returns its runtime instance.
   */
  addBody(config: CollisionBodyConfig): CollisionBody;

  /**
   * Removes a body from the world by ID.
   */
  removeBody(id: string): boolean;

  /**
   * Retrieves a body by ID.
   */
  getBody(id: string): CollisionBody | undefined;

  /**
   * Returns a copy of all active bodies in the world.
   */
  getBodies(): CollisionBody[];

  /**
   * Dynamically updates properties of an existing body.
   */
  updateBody(id: string, updates: Partial<CollisionBodyConfig>): boolean;

  /**
   * Adds a constraint to the world and returns its runtime instance.
   */
  addConstraint(config: CollisionConstraintConfig): CollisionConstraint;

  /**
   * Removes a constraint from the world by ID.
   */
  removeConstraint(id: string): boolean;

  /**
   * Returns a copy of all active constraints in the world.
   */
  getConstraints(): CollisionConstraint[];

  /**
   * Advances the world simulation forward in time.
   */
  step(deltaTime?: number): CollisionWorldStepResult;

  /**
   * Detects all active collisions in the world without resolving them.
   */
  detectCollisions(): CollisionContact[];

  /**
   * Resolves collision impulses and positional corrections for contact manifolds.
   */
  resolveCollisions(contacts?: CollisionContact[]): void;

  /**
   * Resolves all active physical constraints.
   */
  resolveConstraints(dt?: number): void;

  /**
   * Returns active contact manifolds from the most recent simulation step.
   */
  getContacts(): CollisionContact[];

  /**
   * Sets the global gravity vector.
   */
  setGravity(gravity: PhysicsValue): void;

  /**
   * Returns the current gravity vector.
   */
  getGravity(): PhysicsVector;

  /**
   * Resets world time, contacts, and velocities.
   */
  reset(): void;

  /**
   * Disposes the world and frees all resources.
   */
  dispose(): void;

  /**
   * Returns whether the world has been disposed.
   */
  isDisposed(): boolean;
}
