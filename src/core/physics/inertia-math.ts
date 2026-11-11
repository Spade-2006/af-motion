/**
 * AF Motion — Inertia, Momentum, Friction & Gravity Mathematical Model
 *
 * Implements force composition, multi-model friction (viscous, kinetic, quadratic drag),
 * gravitational acceleration, momentum, and terminal velocity across 1D, 2D, and 3D.
 */

import type { PhysicsValue, PhysicsVector } from "./types.js";
import {
  addValues,
  subValues,
  scaleValue,
  valueMagnitude,
  clonePhysicsValue,
  createVector,
} from "./math.js";

/**
 * Computes momentum vector or scalar: p = m * v.
 */
export function calculateMomentum(velocity: PhysicsValue, mass: number): PhysicsValue {
  return scaleValue(velocity, mass);
}

/**
 * Computes kinetic energy: E_k = 0.5 * m * |v|^2.
 */
export function calculateKineticEnergy(velocity: PhysicsValue, mass: number): number {
  const speed = valueMagnitude(velocity);
  return 0.5 * mass * speed * speed;
}

/**
 * Computes the normalized unit direction of a velocity vector.
 * Returns a zero vector if speed is zero.
 */
export function velocityDirection(velocity: PhysicsValue): PhysicsValue {
  const speed = valueMagnitude(velocity);
  if (speed === 0) {
    return typeof velocity === "number" ? 0 : createVector(0, velocity.y !== undefined ? 0 : undefined, velocity.z !== undefined ? 0 : undefined);
  }
  return scaleValue(velocity, 1 / speed);
}

/**
 * Computes total net force acting on a body from all active components:
 *   F_net = F_gravity + F_friction + F_kinetic + F_drag + F_external
 */
export function calculateNetForce(
  velocity: PhysicsValue,
  mass: number,
  gravity: PhysicsValue,
  friction: number,
  linearFriction: number,
  drag: number,
  externalForce: PhysicsValue
): PhysicsValue {
  const speed = valueMagnitude(velocity);

  // 1. Gravity force: F_g = m * g
  const fGravity = scaleValue(gravity, mass);

  // 2. Viscous friction: F_viscous = -m * friction * v
  const fViscous = scaleValue(velocity, -mass * friction);

  // 3. Kinetic friction opposing motion direction: F_kinetic = -linearFriction * m * norm(v)
  let fKinetic: PhysicsValue = 0;
  if (linearFriction > 0 && speed > 0) {
    const dir = velocityDirection(velocity);
    fKinetic = scaleValue(dir, -linearFriction * mass);
  }

  // 4. Aerodynamic quadratic drag: F_drag = -drag * |v| * v
  let fDrag: PhysicsValue = 0;
  if (drag > 0 && speed > 0) {
    fDrag = scaleValue(velocity, -drag * speed);
  }

  // Sum all force contributions
  let fTotal = addValues(fGravity, fViscous);
  if (linearFriction > 0 && speed > 0) {
    fTotal = addValues(fTotal, fKinetic);
  }
  if (drag > 0 && speed > 0) {
    fTotal = addValues(fTotal, fDrag);
  }
  fTotal = addValues(fTotal, externalForce);

  return fTotal;
}

/**
 * Computes instantaneous acceleration: a = F_net / m.
 */
export function calculateInertiaAcceleration(
  velocity: PhysicsValue,
  mass: number,
  gravity: PhysicsValue,
  friction: number,
  linearFriction: number,
  drag: number,
  externalForce: PhysicsValue
): { acceleration: PhysicsValue; netForce: PhysicsValue } {
  const netForce = calculateNetForce(
    velocity,
    mass,
    gravity,
    friction,
    linearFriction,
    drag,
    externalForce
  );
  const acceleration = scaleValue(netForce, 1 / mass);
  return { acceleration, netForce };
}

/**
 * Applies terminal velocity limit if speed exceeds maximum allowed threshold.
 */
export function applyTerminalVelocity(velocity: PhysicsValue, terminalVelocity?: number): PhysicsValue {
  if (terminalVelocity === undefined || terminalVelocity <= 0) return velocity;
  const speed = valueMagnitude(velocity);
  if (speed > terminalVelocity) {
    const factor = terminalVelocity / speed;
    return scaleValue(velocity, factor);
  }
  return velocity;
}

/**
 * Checks whether a body has decelerated to rest.
 */
export function isInertiaSettled(
  velocity: PhysicsValue,
  gravity: PhysicsValue,
  externalForce: PhysicsValue,
  minVelocity: number
): boolean {
  const speed = valueMagnitude(velocity);
  const gravityMag = valueMagnitude(gravity);
  const extForceMag = valueMagnitude(externalForce);

  // If there is continuous gravity or external acceleration, it is not settled
  if (gravityMag > 0.0001 || extForceMag > 0.0001) {
    return false;
  }

  return speed <= minVelocity;
}

/**
 * Clamps coordinates within optional spatial bounds [min, max], zeroing velocity on collided axes.
 */
export function applyPositionBounds(
  position: PhysicsValue,
  velocity: PhysicsValue,
  minBound?: PhysicsValue,
  maxBound?: PhysicsValue
): { position: PhysicsValue; velocity: PhysicsValue } {
  if (minBound === undefined && maxBound === undefined) {
    return { position, velocity };
  }

  let nextPos = clonePhysicsValue(position);
  let nextVel = clonePhysicsValue(velocity);

  if (typeof nextPos === "number" && typeof nextVel === "number") {
    const minVal = typeof minBound === "number" ? minBound : (minBound as PhysicsVector | undefined)?.x;
    const maxVal = typeof maxBound === "number" ? maxBound : (maxBound as PhysicsVector | undefined)?.x;

    if (minVal !== undefined && nextPos < minVal) {
      nextPos = minVal;
      if (nextVel < 0) nextVel = 0;
    }
    if (maxVal !== undefined && nextPos > maxVal) {
      nextPos = maxVal;
      if (nextVel > 0) nextVel = 0;
    }
    return { position: nextPos, velocity: nextVel };
  }

  // Vector clamping
  const p = nextPos as PhysicsVector;
  const v = nextVel as PhysicsVector;
  const minV = typeof minBound === "number" ? { x: minBound, y: minBound, z: minBound } : minBound;
  const maxV = typeof maxBound === "number" ? { x: maxBound, y: maxBound, z: maxBound } : maxBound;

  if (minV) {
    if (minV.x !== undefined && p.x < minV.x) {
      p.x = minV.x;
      if (v.x < 0) v.x = 0;
    }
    if (minV.y !== undefined && p.y !== undefined && p.y < minV.y) {
      p.y = minV.y;
      if (v.y !== undefined && v.y < 0) v.y = 0;
    }
    if (minV.z !== undefined && p.z !== undefined && p.z < minV.z) {
      p.z = minV.z;
      if (v.z !== undefined && v.z < 0) v.z = 0;
    }
  }

  if (maxV) {
    if (maxV.x !== undefined && p.x > maxV.x) {
      p.x = maxV.x;
      if (v.x > 0) v.x = 0;
    }
    if (maxV.y !== undefined && p.y !== undefined && p.y > maxV.y) {
      p.y = maxV.y;
      if (v.y !== undefined && v.y > 0) v.y = 0;
    }
    if (maxV.z !== undefined && p.z !== undefined && p.z > maxV.z) {
      p.z = maxV.z;
      if (v.z !== undefined && v.z > 0) v.z = 0;
    }
  }

  return { position: p, velocity: v };
}

/**
 * Performs a single semi-implicit Euler integration step for inertia simulation.
 */
export function integrateInertiaStep(
  pos: PhysicsValue,
  vel: PhysicsValue,
  mass: number,
  gravity: PhysicsValue,
  friction: number,
  linearFriction: number,
  drag: number,
  externalForce: PhysicsValue,
  terminalVelocity: number | undefined,
  dt: number
): { position: PhysicsValue; velocity: PhysicsValue; acceleration: PhysicsValue; netForce: PhysicsValue } {
  const { acceleration, netForce } = calculateInertiaAcceleration(
    vel,
    mass,
    gravity,
    friction,
    linearFriction,
    drag,
    externalForce
  );

  // v_next = v + a * dt
  let nextVel = addValues(vel, scaleValue(acceleration, dt));
  nextVel = applyTerminalVelocity(nextVel, terminalVelocity);

  // x_next = x + v_next * dt
  const nextPos = addValues(pos, scaleValue(nextVel, dt));

  return {
    position: nextPos,
    velocity: nextVel,
    acceleration,
    netForce,
  };
}
