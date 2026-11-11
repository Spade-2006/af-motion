/**
 * AF Motion — 3D Advanced Constraint Types
 *
 * Strongly-typed definitions for articulated rigid-body constraints:
 * Hinge, Slider, Cone-Twist, Ball-and-Socket, Generic 6DOF, Fixed, and Spring.
 */

import type { Vector3, Transform3D, Constraint3D, ConstraintType3D } from "../types.js";

export interface BaseConstraintConfig {
  id?: string;
  bodyAId: string;
  bodyBId?: string;
  pivotA?: Vector3;
  pivotB?: Vector3;
  stiffness?: number;
  damping?: number;
  enabled?: boolean;
  breakingImpulse?: number;
  userData?: unknown;
}

export interface DistanceConstraintConfig extends BaseConstraintConfig {
  minDistance?: number;
  maxDistance?: number;
  distance?: number;
}

export interface FixedConstraintConfig extends BaseConstraintConfig {}

export interface BallAndSocketConstraintConfig extends BaseConstraintConfig {}

export interface HingeConstraintConfig extends BaseConstraintConfig {
  /** Local rotation axis on body A. Default: { x: 0, y: 1, z: 0 }. */
  axisA?: Vector3;
  /** Local rotation axis on body B. Default: { x: 0, y: 1, z: 0 }. */
  axisB?: Vector3;
  /** Minimum allowable rotation angle in radians. */
  lowerLimit?: number;
  /** Maximum allowable rotation angle in radians. */
  upperLimit?: number;
  /** Whether the angular motor is active. */
  motorEnabled?: boolean;
  /** Target angular velocity in radians/sec. */
  motorTargetVelocity?: number;
  /** Maximum motor torque in N*m. */
  motorMaxForce?: number;
}

export interface SliderConstraintConfig extends BaseConstraintConfig {
  /** Local sliding axis on body A. Default: { x: 1, y: 0, z: 0 }. */
  axisA?: Vector3;
  /** Local sliding axis on body B. Default: { x: 1, y: 0, z: 0 }. */
  axisB?: Vector3;
  /** Minimum allowable linear translation in meters. */
  lowerLimit?: number;
  /** Maximum allowable linear translation in meters. */
  upperLimit?: number;
  /** Whether the linear motor is active. */
  motorEnabled?: boolean;
  /** Target linear velocity in m/s. */
  motorTargetVelocity?: number;
  /** Maximum linear motor force in N. */
  motorMaxForce?: number;
}

export interface ConeTwistConstraintConfig extends BaseConstraintConfig {
  /** Alignment axis on body A. Default: { x: 0, y: 1, z: 0 }. */
  axisA?: Vector3;
  /** Alignment axis on body B. Default: { x: 0, y: 1, z: 0 }. */
  axisB?: Vector3;
  /** Maximum cone deflection angle in radians. Default: Math.PI / 4. */
  coneLimitAngle?: number;
  /** Maximum twist angle in radians. Default: Math.PI / 6. */
  twistLimitAngle?: number;
}

export interface Generic6DOFConstraintConfig extends BaseConstraintConfig {
  /** Coordinate frame on body A. */
  frameA?: Transform3D;
  /** Coordinate frame on body B. */
  frameB?: Transform3D;
  /** Linear motion limits [min, max] per axis (X, Y, Z). */
  linearLimits?: { min: Vector3; max: Vector3 };
  /** Angular motion limits [min, max] per axis (X, Y, Z). */
  angularLimits?: { min: Vector3; max: Vector3 };
  /** Linear motor settings per axis. */
  linearMotor?: { enabled?: boolean; targetVelocity?: Vector3; maxForce?: Vector3 };
  /** Angular motor settings per axis. */
  angularMotor?: { enabled?: boolean; targetVelocity?: Vector3; maxForce?: Vector3 };
}

export interface SpringConstraintConfig extends BaseConstraintConfig {
  /** Equilibrium rest length. Default: distance between initial pivots. */
  restLength?: number;
  /** Hookean spring stiffness coefficient. Default: 100. */
  stiffness?: number;
  /** Viscous damping coefficient. Default: 5. */
  damping?: number;
}
