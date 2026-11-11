/**
 * AF Motion — 3D Soft Body & PBD Types
 *
 * Type definitions for particle-based deformable bodies, Position-Based
 * Dynamics (PBD / XPBD) constraints, cloth meshes, ropes, and flexible cables.
 */

import type { Vector3, AABB3D, Transform3D, PhysicsMaterial, Quaternion } from "../types.js";

// ============================================================================
// PBD Constraint Types
// ============================================================================

export type PBDConstraintType =
  | "distance"
  | "structural"
  | "shear"
  | "bending"
  | "volume"
  | "shape-matching"
  | "attachment"
  | "pin";

/**
 * Base distance / edge constraint between two particles.
 */
export interface PBDDistanceConstraint {
  type: "distance" | "structural" | "shear" | "bending";
  /** Index of particle A. */
  particleA: number;
  /** Index of particle B. */
  particleB: number;
  /** Rest distance in world units. */
  restLength: number;
  /** XPBD compliance (inverse stiffness alpha). Default: 0 (rigid). */
  compliance?: number;
  /** Classical stiffness [0, 1]. Default: 1.0. */
  stiffness?: number;
  /** Internal damping coefficient. Default: 0.0. */
  damping?: number;
  /** Accumulated Lagrange multiplier for XPBD. */
  multiplier?: number;
  /** Whether this constraint can tear when stretched beyond threshold. */
  tearable?: boolean;
  /** Strain threshold for tearing ((d - d0) / d0). Default: 0.8 (80%). */
  tearStrainThreshold?: number;
  /** Whether this constraint has been torn/broken. */
  torn?: boolean;
}

/**
 * Closed mesh volume conservation constraint.
 */
export interface PBDVolumeConstraint {
  type: "volume";
  /** Triangle indices forming closed surface mesh [i0, j0, k0, i1, j1, k1, ...]. */
  triangleIndices: Uint32Array | number[];
  /** Rest volume in cubic units. */
  restVolume: number;
  /** Volume stiffness coefficient [0, 1]. */
  stiffness?: number;
  /** XPBD compliance for volume. */
  compliance?: number;
  /** Accumulated Lagrange multiplier. */
  multiplier?: number;
}

/**
 * Linear shape-matching constraint against rest coordinates.
 */
export interface PBDShapeMatchingConstraint {
  type: "shape-matching";
  /** Indices of particles involved in shape matching. */
  particleIndices: number[];
  /** Rest positions for each particle relative to rest center of mass. */
  restOffsets: Float32Array;
  /** Rest center of mass. */
  restCenterOfMass: Vector3;
  /** Shape-matching stiffness [0, 1]. */
  stiffness: number;
}

/**
 * Attachment constraint pinning a soft-body particle to a world position or rigid body.
 */
export interface PBDAttachmentConstraint {
  type: "attachment";
  /** Index of the soft-body particle. */
  particleIndex: number;
  /** Optional target rigid body ID. If undefined, attached to world space. */
  targetBodyId?: string;
  /** Local anchor on the rigid body, or world coordinate if targetBodyId is undefined. */
  localPivot: Vector3;
  /** Attachment stiffness [0, 1]. Default: 1.0. */
  stiffness?: number;
}

/**
 * Fixed pin constraint locking a particle in place.
 */
export interface PBDPinConstraint {
  type: "pin";
  /** Index of the pinned particle. */
  particleIndex: number;
  /** Fixed world position. */
  position: Vector3;
}

export type PBDConstraint =
  | PBDDistanceConstraint
  | PBDVolumeConstraint
  | PBDShapeMatchingConstraint
  | PBDAttachmentConstraint
  | PBDPinConstraint;

// ============================================================================
// Particle & Soft Body Configurations
// ============================================================================

export interface ParticleConfig {
  position: Vector3;
  mass?: number;
  velocity?: Vector3;
  pinned?: boolean;
}

export interface SoftBodyConfig {
  id?: string;
  /** Initial particle definitions or raw flat array [x0, y0, z0, ...]. */
  particles: ParticleConfig[] | Float32Array;
  /** Triangle indices for surface mesh [i0, j0, k0, ...]. */
  indices?: Uint32Array | number[];
  /** Custom PBD constraints. */
  constraints?: PBDConstraint[];
  /** Structural stiffness [0, 1]. Default: 0.9. */
  stiffness?: number;
  /** Internal velocity damping [0, 1]. Default: 0.05. */
  damping?: number;
  /** Volume preservation stiffness [0, 1]. Default: 0. */
  volumeStiffness?: number;
  /** Internal pneumatic pressure. Default: 0. */
  pressure?: number;
  /** Physics material (friction, restitution). */
  material?: Partial<PhysicsMaterial>;
  /** Whether any structural link can tear under strain. */
  tearable?: boolean;
  /** Strain threshold for tearing. Default: 0.8. */
  tearStrainThreshold?: number;
  /** Whether to enable GPU compute assistance where hardware allows. */
  useGPU?: boolean;
  /** User data. */
  userData?: unknown;
}

// ============================================================================
// Cloth Simulation Types
// ============================================================================

export interface ClothConfig {
  id?: string;
  /** Total physical width in world units. Default: 2.0. */
  width?: number;
  /** Total physical height in world units. Default: 2.0. */
  height?: number;
  /** Number of grid segments along horizontal axis. Default: 10. */
  segmentsX?: number;
  /** Number of grid segments along vertical axis. Default: 10. */
  segmentsY?: number;
  /** Center position of the cloth mesh. Default: { x: 0, y: 2, z: 0 }. */
  position?: Vector3;
  /** Orientation plane or custom rotation quaternion. Default: "xy". */
  orientation?: "xy" | "xz" | "yz" | Quaternion;
  /** Total mass of the cloth in kg. Default: 1.0. */
  mass?: number;
  /** Structural spring stiffness [0, 1]. Default: 0.95. */
  stiffness?: number;
  /** Shear resistance stiffness [0, 1]. Default: 0.7. */
  shearStiffness?: number;
  /** Bending resistance stiffness [0, 1]. Default: 0.3. */
  bendingStiffness?: number;
  /** Velocity damping [0, 1]. Default: 0.02. */
  damping?: number;
  /** Array of specific particle indices to pin immovably. */
  pinnedIndices?: number[];
  /** Convenience: pin all 4 corner particles. */
  pinCorners?: boolean;
  /** Convenience: pin all particles along top edge. */
  pinTopEdge?: boolean;
  /** Wind aerodynamic forces. Default: false. */
  windInteraction?: boolean | { scale?: number; dragCoefficient?: number };
  /** Whether cloth can tear under extreme tensile strain. Default: false. */
  tearable?: boolean;
  /** Elongation strain threshold for tearing ((d - d0) / d0). Default: 1.0. */
  tearStrainThreshold?: number;
  /** Physics material. */
  material?: Partial<PhysicsMaterial>;
  /** Use GPU compute if available. */
  useGPU?: boolean;
  /** Custom user data. */
  userData?: unknown;
}

// ============================================================================
// Rope & Chain Types
// ============================================================================

export interface RopeConfig {
  id?: string;
  /** Total physical length of the rope in world units. Default: 5.0. */
  length?: number;
  /** Number of segments along the rope. Default: 20. */
  segments?: number;
  /** World start position. Default: { x: 0, y: 5, z: 0 }. */
  startPosition?: Vector3;
  /** Optional world end position. If omitted, hangs straight down along -Y. */
  endPosition?: Vector3;
  /** Direction vector if endPosition is omitted. Default: { x: 0, y: -1, z: 0 }. */
  direction?: Vector3;
  /** Total rope mass in kg. Default: 1.0. */
  mass?: number;
  /** Collision radius around particles in meters. Default: 0.05. */
  radius?: number;
  /** Stretch resistance stiffness [0, 1]. Default: 0.98. */
  stiffness?: number;
  /** Bending / straightness stiffness [0, 1]. Default: 0.4. */
  bendingStiffness?: number;
  /** Velocity damping [0, 1]. Default: 0.02. */
  damping?: number;
  /** Pin the start node in world space. Default: true. */
  pinnedStart?: boolean;
  /** Pin the end node in world space. Default: false. */
  pinnedEnd?: boolean;
  /** Attach start node to a dynamic/kinematic rigid body ID. */
  attachStartToBodyId?: string;
  /** Local attachment pivot on the start rigid body. */
  attachStartPivot?: Vector3;
  /** Attach end node to a dynamic/kinematic rigid body ID. */
  attachEndToBodyId?: string;
  /** Local attachment pivot on the end rigid body. */
  attachEndPivot?: Vector3;
  /** Physics material. */
  material?: Partial<PhysicsMaterial>;
  /** Tear threshold for breaking under extreme tension. */
  tearable?: boolean;
  tearStrainThreshold?: number;
  /** Use GPU compute if available. */
  useGPU?: boolean;
  /** Custom user data. */
  userData?: unknown;
}
