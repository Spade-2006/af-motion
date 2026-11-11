/**
 * AF Motion — 3D Advanced Constraint Factories
 *
 * Provides factory constructors for articulated joints: Hinge, Slider,
 * Cone-Twist, Ball-and-Socket, Generic 6DOF, Fixed, and Damped Spring.
 */

import type { Constraint3D } from "../types.js";
import type {
  DistanceConstraintConfig,
  FixedConstraintConfig,
  BallAndSocketConstraintConfig,
  HingeConstraintConfig,
  SliderConstraintConfig,
  ConeTwistConstraintConfig,
  Generic6DOFConstraintConfig,
  SpringConstraintConfig,
} from "./types.js";
import { vec3, createTransform3D } from "../math.js";

/**
 * Creates a Distance Constraint maintaining a distance between two bodies.
 */
export function createDistanceConstraint3D(config: DistanceConstraintConfig): Constraint3D {
  const dist = config.distance ?? config.maxDistance ?? config.minDistance ?? 1.0;
  return {
    id: config.id || `dist_${Math.random().toString(36).substring(2, 9)}`,
    type: "distance",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    minDistance: config.minDistance ?? dist,
    maxDistance: config.maxDistance ?? dist,
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Fixed Constraint completely locking relative position and orientation.
 */
export function createFixedConstraint3D(config: FixedConstraintConfig): Constraint3D {
  return {
    id: config.id || `fixed_${Math.random().toString(36).substring(2, 9)}`,
    type: "fixed",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Ball-and-Socket (point-to-point) joint allowing free 3DOF rotation.
 */
export function createBallAndSocketConstraint3D(config: BallAndSocketConstraintConfig): Constraint3D {
  return {
    id: config.id || `p2p_${Math.random().toString(36).substring(2, 9)}`,
    type: "point-to-point",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Hinge (revolute) constraint with angular limits and motor.
 */
export function createHingeConstraint3D(config: HingeConstraintConfig): Constraint3D {
  return {
    id: config.id || `hinge_${Math.random().toString(36).substring(2, 9)}`,
    type: "hinge",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    axisA: config.axisA ? { ...config.axisA } : vec3(0, 1, 0),
    axisB: config.axisB ? { ...config.axisB } : vec3(0, 1, 0),
    lowerLimit: config.lowerLimit,
    upperLimit: config.upperLimit,
    motorEnabled: config.motorEnabled ?? false,
    motorTargetVelocity: config.motorTargetVelocity ?? 0,
    motorMaxForce: config.motorMaxForce ?? 100,
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Slider (prismatic) constraint with linear limits and motor.
 */
export function createSliderConstraint3D(config: SliderConstraintConfig): Constraint3D {
  return {
    id: config.id || `slider_${Math.random().toString(36).substring(2, 9)}`,
    type: "slider",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    axisA: config.axisA ? { ...config.axisA } : vec3(1, 0, 0),
    axisB: config.axisB ? { ...config.axisB } : vec3(1, 0, 0),
    lowerLimit: config.lowerLimit,
    upperLimit: config.upperLimit,
    motorEnabled: config.motorEnabled ?? false,
    motorTargetVelocity: config.motorTargetVelocity ?? 0,
    motorMaxForce: config.motorMaxForce ?? 100,
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Cone-Twist constraint for universal joint / ragdoll limit behavior.
 */
export function createConeTwistConstraint3D(config: ConeTwistConstraintConfig): Constraint3D {
  return {
    id: config.id || `conetwist_${Math.random().toString(36).substring(2, 9)}`,
    type: "cone-twist",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    axisA: config.axisA ? { ...config.axisA } : vec3(0, 1, 0),
    axisB: config.axisB ? { ...config.axisB } : vec3(0, 1, 0),
    coneLimitAngle: config.coneLimitAngle ?? Math.PI / 4,
    twistLimitAngle: config.twistLimitAngle ?? Math.PI / 6,
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Generic 6DOF constraint with customizable linear and angular limits.
 */
export function createGeneric6DOFConstraint3D(config: Generic6DOFConstraintConfig): Constraint3D {
  return {
    id: config.id || `g6dof_${Math.random().toString(36).substring(2, 9)}`,
    type: "generic6dof",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    frameA: config.frameA ? { ...config.frameA } : createTransform3D(),
    frameB: config.frameB ? { ...config.frameB } : createTransform3D(),
    linearLimits: config.linearLimits,
    angularLimits: config.angularLimits,
    stiffness: config.stiffness ?? 1.0,
    damping: config.damping ?? 0.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}

/**
 * Creates a Damped Spring constraint between two bodies.
 */
export function createSpringConstraint3D(config: SpringConstraintConfig): Constraint3D {
  return {
    id: config.id || `spring_${Math.random().toString(36).substring(2, 9)}`,
    type: "spring",
    bodyAId: config.bodyAId,
    bodyBId: config.bodyBId,
    pivotA: config.pivotA ? { ...config.pivotA } : vec3(0, 0, 0),
    pivotB: config.pivotB ? { ...config.pivotB } : vec3(0, 0, 0),
    minDistance: config.restLength ?? 1.0,
    maxDistance: config.restLength ?? 1.0,
    stiffness: config.stiffness ?? 100,
    damping: config.damping ?? 5.0,
    enabled: config.enabled ?? true,
    breakingImpulse: config.breakingImpulse ?? Infinity,
    userData: config.userData,
  };
}
