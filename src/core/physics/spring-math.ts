/**
 * AF Motion — Spring Mathematics & Dynamic Calculations
 *
 * Implements the second-order mass-spring-damper equations of motion:
 *   F = -k(x - target) - c*v
 *   a = F / m
 * Supports scalars, 2D vectors, and 3D vectors polymorphically.
 */

import type { PhysicsValue } from "./types.js";
import type { SpringDampingBehavior } from "./spring-types.js";
import {
  subValues,
  scaleValue,
  valueMagnitude,
  clonePhysicsValue,
} from "./math.js";

/**
 * Computes the undamped natural frequency (omega0 = sqrt(k / m)) in radians per second.
 */
export function calculateNaturalFrequency(stiffness: number, mass: number): number {
  if (mass <= 0 || stiffness <= 0) return 0;
  return Math.sqrt(stiffness / mass);
}

/**
 * Computes the dimensionless damping ratio (zeta = c / (2 * sqrt(k * m))).
 */
export function calculateDampingRatio(stiffness: number, damping: number, mass: number): number {
  if (stiffness <= 0 || mass <= 0) return 1.0;
  const criticalDamping = 2 * Math.sqrt(stiffness * mass);
  if (criticalDamping === 0) return 1.0;
  return damping / criticalDamping;
}

/**
 * Classifies the damping behavior into underdamped, critically damped, or overdamped.
 */
export function classifyDampingBehavior(dampingRatio: number): SpringDampingBehavior {
  if (dampingRatio < 0.999) {
    return "underdamped";
  }
  if (dampingRatio > 1.001) {
    return "overdamped";
  }
  return "critically-damped";
}

/**
 * Calculates instantaneous acceleration from the mass-spring-damper equation:
 *   a = (k * (target - position) - c * velocity) / mass
 */
export function calculateSpringAcceleration(
  position: PhysicsValue,
  velocity: PhysicsValue,
  target: PhysicsValue,
  stiffness: number,
  damping: number,
  mass: number
): PhysicsValue {
  // Displacement vector towards target: (target - position)
  const displacement = subValues(target, position);

  // Hooke's spring restoring force: F_spring = k * displacement
  const springForce = scaleValue(displacement, stiffness);

  // Viscous damping force opposing velocity: F_damping = c * velocity
  const dampingForce = scaleValue(velocity, damping);

  // Net force: F_net = F_spring - F_damping
  const netForce = subValues(springForce, dampingForce);

  // Acceleration: a = F_net / mass
  return scaleValue(netForce, 1 / mass);
}

/**
 * Evaluates whether a spring has settled at equilibrium within rest thresholds.
 */
export function isSpringSettled(
  position: PhysicsValue,
  velocity: PhysicsValue,
  target: PhysicsValue,
  restDelta: number,
  restSpeed: number
): boolean {
  const displacementMag = valueMagnitude(subValues(target, position));
  const velocityMag = valueMagnitude(velocity);
  return displacementMag <= restDelta && velocityMag <= restSpeed;
}

/**
 * Performs a single semi-implicit Euler integration step for a spring.
 */
export function integrateSpringEuler(
  currentPos: PhysicsValue,
  currentVel: PhysicsValue,
  target: PhysicsValue,
  stiffness: number,
  damping: number,
  mass: number,
  dt: number
): { position: PhysicsValue; velocity: PhysicsValue; acceleration: PhysicsValue } {
  const accel = calculateSpringAcceleration(currentPos, currentVel, target, stiffness, damping, mass);
  // Semi-implicit Euler updates velocity first, then position with updated velocity
  const nextVel = subValues(currentVel, scaleValue(scaleValue(subValues(scaleValue(currentVel, damping), scaleValue(subValues(target, currentPos), stiffness)), 1 / mass), -dt));
  // More cleanly: v_next = v + a * dt
  const cleanNextVel = calculateVelocityStep(currentPos, currentVel, target, stiffness, damping, mass, dt);
  const nextPos = subValues(currentPos, scaleValue(cleanNextVel, -dt)); // currentPos + cleanNextVel * dt

  return {
    position: nextPos,
    velocity: cleanNextVel,
    acceleration: accel,
  };
}

/**
 * Helper to compute next velocity cleanly without compound sign errors.
 */
function calculateVelocityStep(
  pos: PhysicsValue,
  vel: PhysicsValue,
  target: PhysicsValue,
  k: number,
  c: number,
  m: number,
  dt: number
): PhysicsValue {
  const a = calculateSpringAcceleration(pos, vel, target, k, c, m);
  if (typeof vel === "number" && typeof a === "number") {
    return vel + a * dt;
  }
  const vVec = typeof vel === "number" ? { x: vel } : vel;
  const aVec = typeof a === "number" ? { x: a } : a;
  return {
    x: vVec.x + aVec.x * dt,
    y: vVec.y !== undefined || aVec.y !== undefined ? (vVec.y ?? 0) + (aVec.y ?? 0) * dt : undefined,
    z: vVec.z !== undefined || aVec.z !== undefined ? (vVec.z ?? 0) + (aVec.z ?? 0) * dt : undefined,
  };
}

/**
 * High-precision RK4 step for spring integration.
 */
export function integrateSpringRK4(
  pos: PhysicsValue,
  vel: PhysicsValue,
  target: PhysicsValue,
  k: number,
  c: number,
  m: number,
  dt: number
): { position: PhysicsValue; velocity: PhysicsValue; acceleration: PhysicsValue } {
  // Derivative function: f(x, v) = (v, a(x, v))
  const a1 = calculateSpringAcceleration(pos, vel, target, k, c, m);
  const v1 = vel;

  const pos2 = subValues(pos, scaleValue(v1, -0.5 * dt));
  const vel2 = subValues(vel, scaleValue(a1, -0.5 * dt));
  const a2 = calculateSpringAcceleration(pos2, vel2, target, k, c, m);
  const v2 = vel2;

  const pos3 = subValues(pos, scaleValue(v2, -0.5 * dt));
  const vel3 = subValues(vel, scaleValue(a2, -0.5 * dt));
  const a3 = calculateSpringAcceleration(pos3, vel3, target, k, c, m);
  const v3 = vel3;

  const pos4 = subValues(pos, scaleValue(v3, -dt));
  const vel4 = subValues(vel, scaleValue(a3, -dt));
  const a4 = calculateSpringAcceleration(pos4, vel4, target, k, c, m);
  const v4 = vel4;

  // Next pos = pos + (dt / 6) * (v1 + 2*v2 + 2*v3 + v4)
  const dPos = scaleValue(
    subValues(
      subValues(subValues(v1, scaleValue(v2, -2)), scaleValue(v3, -2)),
      scaleValue(v4, -1)
    ),
    dt / 6
  );

  // Next vel = vel + (dt / 6) * (a1 + 2*a2 + 2*a3 + a4)
  const dVel = scaleValue(
    subValues(
      subValues(subValues(a1, scaleValue(a2, -2)), scaleValue(a3, -2)),
      scaleValue(a4, -1)
    ),
    dt / 6
  );

  const nextPos = subValues(pos, scaleValue(dPos, -1));
  const nextVel = subValues(vel, scaleValue(dVel, -1));
  const nextAccel = calculateSpringAcceleration(nextPos, nextVel, target, k, c, m);

  return {
    position: nextPos,
    velocity: nextVel,
    acceleration: nextAccel,
  };
}
