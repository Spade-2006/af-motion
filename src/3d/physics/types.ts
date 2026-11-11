/**
 * AF Motion — 3D Physics Architecture Types
 *
 * Framework-independent type contracts for 3D rigid bodies, soft bodies,
 * colliders, contact manifolds, constraints, spatial queries, and physics world.
 */

/**
 * 3D vector with finite numerical components.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Readonly 3D vector tuple [x, y, z].
 */
export type Vector3Tuple = readonly [x: number, y: number, z: number];

/**
 * 3D quaternion for orientation representation [x, y, z, w].
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Readonly quaternion tuple [x, y, z, w].
 */
export type QuaternionTuple = readonly [x: number, y: number, z: number, w: number];

/**
 * 3D spatial transform encompassing position, orientation quaternion, and scale.
 */
export interface Transform3D {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

/**
 * 3x3 Matrix stored in row-major order (9 elements).
 */
export type Matrix3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number
];

/**
 * 4x4 Matrix stored in column-major or row-major order (16 elements).
 */
export type Matrix4 = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

/**
 * Axis-aligned bounding box in 3D space.
 */
export interface AABB3D {
  min: Vector3;
  max: Vector3;
}

/**
 * 3D ray specification with origin and unit direction.
 */
export interface Ray3D {
  origin: Vector3;
  direction: Vector3;
  length?: number;
}

/**
 * Raycast hit result.
 */
export interface RayHit3D {
  hit: boolean;
  point: Vector3;
  normal: Vector3;
  distance: number;
  collider?: Collider3D;
  body?: RigidBodyState;
}

/**
 * Motion classification of a rigid body.
 */
export type RigidBodyType = "dynamic" | "static" | "kinematic";

/**
 * Material combination operator for friction and restitution.
 */
export type MaterialCombineRule = "average" | "min" | "max" | "multiply";

/**
 * Physical surface properties of bodies and colliders.
 */
export interface PhysicsMaterial {
  /** Optional unique identifier. */
  id?: string;
  /** Human-readable material name. */
  name?: string;
  /** Coulomb surface friction coefficient [0, 1+]. Default: 0.5. */
  friction: number;
  /** Restitution / bounciness coefficient [0, 1]. Default: 0.2. */
  restitution: number;
  /** Material density in kg/m^3. Default: 1000 (water density). */
  density?: number;
  /** Linear motion damping rate. Default: 0.01. */
  linearDamping?: number;
  /** Rotational damping rate. Default: 0.05. */
  angularDamping?: number;
  /** Combination rule for friction when two materials collide. Default: "multiply". */
  frictionCombineRule?: MaterialCombineRule;
  /** Combination rule for restitution when two materials collide. Default: "average". */
  restitutionCombineRule?: MaterialCombineRule;
}

/**
 * Supported 3D geometric collider shape types.
 */
export type ColliderShapeType3D =
  | "sphere"
  | "box"
  | "capsule"
  | "plane"
  | "convex"
  | "heightfield";

/**
 * 3D Sphere collider shape.
 */
export interface SphereColliderShape {
  type: "sphere";
  radius: number;
}

/**
 * 3D Axis-aligned / Oriented Box collider shape.
 */
export interface BoxColliderShape {
  type: "box";
  halfExtents: Vector3;
}

/**
 * 3D Capsule collider shape defined by cylinder height and hemispherical cap radius.
 */
export interface CapsuleColliderShape {
  type: "capsule";
  radius: number;
  height: number;
  axis?: "x" | "y" | "z";
}

/**
 * Infinite 3D Plane collider shape defined by normal and plane equation constant d.
 */
export interface PlaneColliderShape {
  type: "plane";
  normal: Vector3;
  constant: number;
}

/**
 * 3D Convex Polyhedron collider shape defined by vertex points.
 */
export interface ConvexColliderShape {
  type: "convex";
  vertices: Float32Array | readonly Vector3[];
  indices?: Uint32Array | Uint16Array;
}

/**
 * 3D Heightfield / Terrain collider shape.
 */
export interface HeightfieldColliderShape {
  type: "heightfield";
  width: number;
  length: number;
  cols: number;
  rows: number;
  heights: Float32Array;
  minHeight: number;
  maxHeight: number;
}

/**
 * Union of all supported 3D collider shapes.
 */
export type ColliderShape3D =
  | SphereColliderShape
  | BoxColliderShape
  | CapsuleColliderShape
  | PlaneColliderShape
  | ConvexColliderShape
  | HeightfieldColliderShape;

/**
 * 3D Collider definition attached to a rigid body or world space.
 */
export interface Collider3D {
  /** Unique collider identifier. */
  id: string;
  /** Geometric shape definition. */
  shape: ColliderShape3D;
  /** Local offset transform relative to parent body. */
  offset: Transform3D;
  /** Trigger mode (fires overlap events without physical forces). Default: false. */
  isTrigger: boolean;
  /** Collision layer bitmask (0 to 32-bit int). Default: 1. */
  collisionLayer: number;
  /** Collision mask bitmask defining which layers this collider interacts with. Default: 0xFFFFFFFF. */
  collisionMask: number;
  /** Overriding physics material. */
  material?: PhysicsMaterial;
  /** World-space cached bounding box. */
  aabb: AABB3D;
  /** ID of parent rigid body, if attached. */
  bodyId?: string;
  /** Custom user data. */
  userData?: unknown;
}

/**
 * Individual contact point in world coordinates.
 */
export interface ContactPoint3D {
  /** Contact position in world coordinates. */
  position: Vector3;
  /** Local contact point on body A. */
  localPositionA: Vector3;
  /** Local contact point on body B. */
  localPositionB: Vector3;
  /** Unit contact normal pointing from A to B. */
  normal: Vector3;
  /** Penetration depth along normal (positive indicates overlap). */
  penetration: number;
  /** Normal impulse applied during resolution. */
  impulse?: number;
  /** Tangential friction impulses applied. */
  tangentImpulses?: readonly [number, number];
}

/**
 * Contact manifold storing collision data between two participating bodies and colliders.
 */
export interface CollisionManifold3D {
  /** First participating rigid body ID. */
  bodyAId: string;
  /** Second participating rigid body ID. */
  bodyBId: string;
  /** First participating collider ID. */
  colliderAId: string;
  /** Second participating collider ID. */
  colliderBId: string;
  /** Contact points generated by narrowphase. */
  contacts: ContactPoint3D[];
  /** Whether this manifold represents a non-physical trigger overlap. */
  isTrigger: boolean;
  /** Primary contact normal. */
  normal: Vector3;
  /** Maximum penetration depth across contacts. */
  penetration: number;
}

/**
 * 3D Rigid Body runtime state.
 */
export interface RigidBodyState {
  /** Unique body identifier. */
  id: string;
  /** Dynamic, static, or kinematic classification. */
  type: RigidBodyType;
  /** Spatial transform (position, rotation, scale). */
  transform: Transform3D;
  /** Linear velocity in world units per second. */
  linearVelocity: Vector3;
  /** Angular velocity in radians per second. */
  angularVelocity: Vector3;
  /** Linear motion axes multiplier [1, 1, 1] for unconstrained. */
  linearFactor: Vector3;
  /** Angular motion axes multiplier [1, 1, 1] for unconstrained. */
  angularFactor: Vector3;
  /** Accumulated external force. */
  force: Vector3;
  /** Accumulated external torque. */
  torque: Vector3;
  /** Total mass in kg. 0 or Infinity for static bodies. */
  mass: number;
  /** Inverse mass (1 / mass, or 0 for static). */
  invMass: number;
  /** 3x3 rotational inertia tensor in local coordinates. */
  inertiaTensor: Matrix3;
  /** Inverse 3x3 inertia tensor. */
  invInertiaTensor: Matrix3;
  /** Default physics material. */
  material: PhysicsMaterial;
  /** List of colliders attached to this body. */
  colliders: Collider3D[];
  /** Sleeping status (inactive due to low kinetic energy). */
  isSleeping: boolean;
  /** Whether the body is allowed to enter sleep. */
  allowSleep: boolean;
  /** Elapsed seconds under sleep energy threshold. */
  sleepTime: number;
  /** Linear damping factor. */
  linearDamping: number;
  /** Angular damping factor. */
  angularDamping: number;
  /** Multiplier for global gravity. Default: 1.0. */
  gravityScale: number;
  /** User-defined metadata. */
  userData?: unknown;
}

/**
 * 3D Soft Body runtime state.
 */
export interface SoftBodyState {
  /** Unique soft body identifier. */
  id: string;
  /** Total number of simulated particle nodes. */
  particleCount: number;
  /** Flat array of particle world positions [x0, y0, z0, x1, y1, z1, ...]. */
  positions: Float32Array;
  /** Flat array of particle velocities [vx0, vy0, vz0, ...]. */
  velocities: Float32Array;
  /** Flat array of initial rest positions. */
  restPositions: Float32Array;
  /** Flat array of particle inverse masses. */
  invMasses: Float32Array;
  /** Optional surface triangle indices for rendering and collision. */
  indices?: Uint32Array | Uint16Array;
  /** Physics material. */
  material: PhysicsMaterial;
  /** Structural stiffness [0, 1]. */
  stiffness: number;
  /** Soft body internal damping [0, 1]. */
  damping: number;
  /** Optional internal air pressure for inflatable soft bodies. */
  pressure?: number;
  /** Volume conservation stiffness [0, 1]. */
  volumeStiffness?: number;
  /** Cached axis-aligned bounding box. */
  aabb: AABB3D;
  /** User data. */
  userData?: unknown;
  /** Runtime predicted positions for PBD. */
  predictedPositions?: Float32Array;
  /** Internal PBD constraints. */
  constraints?: any[];
  /** Pinned particle indices. */
  pinnedIndices?: Set<number>;
  /** Whether the soft body can tear. */
  tearable?: boolean;
  /** Strain threshold for tearing. */
  tearStrainThreshold?: number;
  /** GPU acceleration flag. */
  useGPU?: boolean;
  /** Wind interaction settings. */
  windConfig?: { enabled: boolean; dragCoefficient?: number };
  /** Rest volume. */
  restVolume?: number;
  /** Accumulated external forces per step. */
  externalForces?: Float32Array;
}

/**
 * Supported 3D physical constraint types.
 */
export type ConstraintType3D =
  | "fixed"
  | "distance"
  | "point-to-point"
  | "hinge"
  | "slider"
  | "cone-twist"
  | "generic6dof"
  | "spring";

/**
 * 3D Physical constraint binding two bodies (or one body and world space).
 */
export interface Constraint3D {
  /** Unique constraint identifier. */
  id: string;
  /** Constraint classification. */
  type: ConstraintType3D;
  /** First participating rigid body ID. */
  bodyAId: string;
  /** Second participating rigid body ID (empty for world anchor). */
  bodyBId?: string;
  /** Anchor pivot on body A in local coordinates. */
  pivotA: Vector3;
  /** Anchor pivot on body B in local coordinates. */
  pivotB: Vector3;
  /** Constraint axis on body A (for hinge, slider). */
  axisA?: Vector3;
  /** Constraint axis on body B (for hinge, slider). */
  axisB?: Vector3;
  /** Minimum allowable distance (distance constraint). */
  minDistance?: number;
  /** Maximum allowable distance (distance constraint). */
  maxDistance?: number;
  /** Lower limit for angles or translations. */
  lowerLimit?: number;
  /** Upper limit for angles or translations. */
  upperLimit?: number;
  /** Spring stiffness coefficient. */
  stiffness?: number;
  /** Damping coefficient. */
  damping?: number;
  /** Whether the constraint is actively evaluated. Default: true. */
  enabled: boolean;
  /** Breaking impulse threshold. Infinity for indestructible. */
  breakingImpulse?: number;
  /** Custom user data. */
  userData?: unknown;
  /** Whether constraint motor is enabled. */
  motorEnabled?: boolean;
  /** Target motor velocity. */
  motorTargetVelocity?: number;
  /** Maximum motor force / torque. */
  motorMaxForce?: number;
  /** Maximum cone limit angle in radians. */
  coneLimitAngle?: number;
  /** Maximum twist limit angle in radians. */
  twistLimitAngle?: number;
  /** Linear limits per axis for 6DOF. */
  linearLimits?: { min: Vector3; max: Vector3 };
  /** Angular limits per axis for 6DOF. */
  angularLimits?: { min: Vector3; max: Vector3 };
  /** Coordinate frame on body A. */
  frameA?: Transform3D;
  /** Coordinate frame on body B. */
  frameB?: Transform3D;
}

/**
 * Configuration options for creating a 3D Physics World.
 */
export interface PhysicsWorldConfig {
  /** Global gravity acceleration vector. Default: { x: 0, y: -9.81, z: 0 }. */
  gravity?: Vector3;
  /** Fixed physics simulation timestep in seconds. Default: 1/60 (0.01667s). */
  timestep?: number;
  /** Maximum internal sub-steps per external step call. Default: 5. */
  maxSubsteps?: number;
  /** Number of constraint and contact solver iterations. Default: 10. */
  solverIterations?: number;
  /** Whether rigid bodies are allowed to sleep when kinetic energy is low. Default: true. */
  enableSleeping?: boolean;
  /** Kinetic energy threshold below which a body is eligible for sleep. Default: 0.05. */
  sleepThreshold?: number;
  /** Seconds of resting energy required before a body goes to sleep. Default: 0.5. */
  timeBeforeSleep?: number;
  /** Broad-phase algorithm type. Default: "spatial-hash". */
  broadphaseType?: "spatial-hash" | "uniform-grid" | "sweep-and-prune";
  /** Grid cell size for spatial hashing in world units. Default: 2.0. */
  spatialCellSize?: number;
  /** Global simulation time scale multiplier. Default: 1.0. */
  timeScale?: number;
  /** Behavior when reduced-motion is preferred ("pause" | "scale" | "normal"). Default: "scale". */
  reducedMotionBehavior?: "pause" | "scale" | "normal";
  /** Optional ambient wind velocity vector for cloth/particles. */
  windVector?: Vector3;
  /** Ground plane height in world units. Default: 0. */
  groundY?: number;
  /** Whether ground collision boundary is active. Default: true. */
  hasGround?: boolean;
}

/**
 * Runtime metrics reported by the 3D physics engine.
 */
export interface PhysicsMetrics {
  /** Duration of the last simulation step in milliseconds. */
  stepDuration: number;
  /** Total count of dynamic bodies actively simulated. */
  activeBodyCount: number;
  /** Total count of static bodies. */
  staticBodyCount: number;
  /** Total count of sleeping bodies. */
  sleepingBodyCount: number;
  /** Total count of registered colliders. */
  colliderCount: number;
  /** Total count of contact points generated. */
  contactCount: number;
  /** Total count of active collision manifolds. */
  manifoldCount: number;
  /** Total count of active constraints. */
  constraintCount: number;
  /** Number of potential collision pairs found by broad-phase. */
  broadphasePairCount: number;
  /** Number of solver iterations executed. */
  solverIterations: number;
  /** Total accumulated simulation time in seconds. */
  simulationTime: number;
  /** Sub-steps executed in the latest frame. */
  substepsExecuted: number;
  /** Total count of active soft bodies. */
  softBodyCount?: number;
  /** Total count of soft-body particle nodes. */
  softParticleCount?: number;
  /** Total count of articulated body islands. */
  islandCount?: number;
}

/**
 * 3D Physics World state enum.
 */
export type PhysicsWorldState = "idle" | "running" | "paused" | "disposed";

/**
 * Event map for 3D physics world listeners.
 */
export interface PhysicsWorldEventMap {
  bodyAdded: { body: RigidBodyState };
  bodyRemoved: { bodyId: string };
  colliderAdded: { collider: Collider3D };
  colliderRemoved: { colliderId: string };
  collisionStart: { manifold: CollisionManifold3D };
  collisionPersist: { manifold: CollisionManifold3D };
  collisionEnd: {
    bodyAId: string;
    bodyBId: string;
    colliderAId: string;
    colliderBId: string;
  };
  triggerEnter: {
    trigger: Collider3D;
    other: Collider3D;
    bodyTrigger?: RigidBodyState;
    bodyOther?: RigidBodyState;
  };
  triggerExit: {
    trigger: Collider3D;
    other: Collider3D;
    bodyTrigger?: RigidBodyState;
    bodyOther?: RigidBodyState;
  };
  constraintEvent: { constraintId: string; type: "broken" | "limitReached" };
  stateChange: { previous: PhysicsWorldState; current: PhysicsWorldState };
  softBodyAdded: { softBody: SoftBodyState };
  softBodyRemoved: { softBodyId: string };
  clothTear: { softBodyId: string; particleA: number; particleB: number; strain: number };
  constraintBreak: { constraintId: string; constraint: Constraint3D; impulse: number };
}

/**
 * Spatial query filtering options.
 */
export interface SpatialFilter3D {
  /** Collision mask to match against collider layer. */
  mask?: number;
  /** Collision layer to match against collider mask. */
  layer?: number;
  /** Whether to include trigger colliders. Default: false. */
  includeTriggers?: boolean;
  /** Specific body IDs to ignore. */
  excludeBodyIds?: readonly string[];
  /** Specific collider IDs to ignore. */
  excludeColliderIds?: readonly string[];
}
