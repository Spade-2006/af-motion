/**
 * AF Motion — Physical Constraints Engine
 *
 * Implements fixed-point anchors, distance rods, Hookean spring constraints,
 * axis locks, min/max rope constraints, and bounding region constraints.
 */

import type { PhysicsVector } from "./types.js";
import type { CollisionConstraint, CollisionBody } from "./collision-types.js";
import {
  createVector,
  subVectors,
  addVectors,
  scaleVector,
  magnitude,
  dot,
} from "./math.js";

/**
 * Resolves a single physical constraint for the active frame.
 */
export function resolveConstraint(constraint: CollisionConstraint, dt: number): void {
  const { type, bodyA, bodyB, anchor, stiffness, damping } = constraint;

  switch (type) {
    case "fixed": {
      // Anchors bodyA position to fixed anchor coordinates
      const targetAnchor = anchor ?? createVector(0, 0);
      const diff = subVectors(targetAnchor, bodyA.position);
      bodyA.position = addVectors(bodyA.position, scaleVector(diff, stiffness));
      bodyA.velocity = scaleVector(bodyA.velocity, Math.max(0, 1 - damping));
      break;
    }

    case "distance": {
      // Maintains fixed distance between bodyA and bodyB (or bodyA and anchor)
      const posB = bodyB ? bodyB.position : (anchor ?? createVector(0, 0));
      const invMassA = bodyA.invMass;
      const invMassB = bodyB ? bodyB.invMass : 0;
      const totalInvMass = invMassA + invMassB;

      if (totalInvMass === 0) break;

      const delta = subVectors(posB, bodyA.position);
      const currentDist = magnitude(delta);
      const targetDist = constraint.targetDistance ?? 0;

      if (currentDist < 1e-6) break;

      const unit = scaleVector(delta, 1 / currentDist);
      const distError = currentDist - targetDist;

      // Position correction
      const correctionScalar = (distError / totalInvMass) * stiffness;
      const correction = scaleVector(unit, correctionScalar);

      bodyA.position = addVectors(bodyA.position, scaleVector(correction, invMassA));
      if (bodyB && bodyB.type === "dynamic") {
        bodyB.position = subVectors(bodyB.position, scaleVector(correction, invMassB));
      }

      // Velocity damping along constraint axis
      const velB = bodyB ? bodyB.velocity : createVector(0, 0);
      const relVel = subVectors(velB, bodyA.velocity);
      const normalVel = dot(relVel, unit);

      const dampImpulseScalar = (normalVel / totalInvMass) * damping;
      const dampImpulse = scaleVector(unit, dampImpulseScalar);

      bodyA.velocity = addVectors(bodyA.velocity, scaleVector(dampImpulse, invMassA));
      if (bodyB && bodyB.type === "dynamic") {
        bodyB.velocity = subVectors(bodyB.velocity, scaleVector(dampImpulse, invMassB));
      }
      break;
    }

    case "spring": {
      // Hooke's Law spring constraint: F = -k * (x - target) - c * v_rel
      const posB = bodyB ? bodyB.position : (anchor ?? createVector(0, 0));
      const delta = subVectors(posB, bodyA.position);
      const currentDist = magnitude(delta);
      const targetDist = constraint.targetDistance ?? 0;

      if (currentDist < 1e-6) break;

      const unit = scaleVector(delta, 1 / currentDist);
      const stretch = currentDist - targetDist;

      const velB = bodyB ? bodyB.velocity : createVector(0, 0);
      const relVel = subVectors(velB, bodyA.velocity);
      const velAlongSpring = dot(relVel, unit);

      // Spring force magnitude: F = k * stretch + c * v
      const springForceMagnitude = stretch * stiffness + velAlongSpring * damping;
      const springForce = scaleVector(unit, springForceMagnitude);

      const invMassA = bodyA.invMass;
      const invMassB = bodyB ? bodyB.invMass : 0;

      bodyA.velocity = addVectors(bodyA.velocity, scaleVector(springForce, invMassA * dt));
      if (bodyB && bodyB.type === "dynamic") {
        bodyB.velocity = subVectors(bodyB.velocity, scaleVector(springForce, invMassB * dt));
      }
      break;
    }

    case "axis": {
      // Restricts motion along a designated axis
      const lockAxis = constraint.axis ?? "x";
      if (lockAxis === "x") {
        // Lock X coordinate to anchor.x or 0
        const targetX = anchor ? anchor.x : 0;
        bodyA.position.x = targetX;
        bodyA.velocity.x = 0;
      } else if (lockAxis === "y") {
        const targetY = anchor ? (anchor.y ?? 0) : 0;
        bodyA.position.y = targetY;
        if (bodyA.velocity.y !== undefined) bodyA.velocity.y = 0;
      } else if (lockAxis === "z") {
        const targetZ = anchor ? (anchor.z ?? 0) : 0;
        bodyA.position.z = targetZ;
        if (bodyA.velocity.z !== undefined) bodyA.velocity.z = 0;
      }
      break;
    }

    case "min-max-distance": {
      // Cable / rope constraint: enforces minDistance and/or maxDistance
      const posB = bodyB ? bodyB.position : (anchor ?? createVector(0, 0));
      const invMassA = bodyA.invMass;
      const invMassB = bodyB ? bodyB.invMass : 0;
      const totalInvMass = invMassA + invMassB;

      if (totalInvMass === 0) break;

      const delta = subVectors(posB, bodyA.position);
      const currentDist = magnitude(delta);
      const minD = constraint.minDistance ?? 0;
      const maxD = constraint.maxDistance ?? Infinity;

      if (currentDist < 1e-6) break;

      let distError = 0;
      if (currentDist < minD) {
        distError = currentDist - minD; // negative: needs separation
      } else if (currentDist > maxD) {
        distError = currentDist - maxD; // positive: needs pull together
      }

      if (distError !== 0) {
        const unit = scaleVector(delta, 1 / currentDist);
        const correctionScalar = (distError / totalInvMass) * stiffness;
        const correction = scaleVector(unit, correctionScalar);

        bodyA.position = addVectors(bodyA.position, scaleVector(correction, invMassA));
        if (bodyB && bodyB.type === "dynamic") {
          bodyB.position = subVectors(bodyB.position, scaleVector(correction, invMassB));
        }
      }
      break;
    }

    case "boundary": {
      // Constrains body inside a bounding volume
      if (!constraint.bounds) break;
      const { min, max } = constraint.bounds;

      // X boundary
      if (bodyA.position.x < min.x) {
        bodyA.position.x = min.x;
        if (bodyA.velocity.x < 0) bodyA.velocity.x = -bodyA.velocity.x * bodyA.restitution;
      } else if (bodyA.position.x > max.x) {
        bodyA.position.x = max.x;
        if (bodyA.velocity.x > 0) bodyA.velocity.x = -bodyA.velocity.x * bodyA.restitution;
      }

      // Y boundary
      if (min.y !== undefined && bodyA.position.y !== undefined && bodyA.position.y < min.y) {
        bodyA.position.y = min.y;
        if (bodyA.velocity.y !== undefined && bodyA.velocity.y < 0) {
          bodyA.velocity.y = -bodyA.velocity.y * bodyA.restitution;
        }
      } else if (max.y !== undefined && bodyA.position.y !== undefined && bodyA.position.y > max.y) {
        bodyA.position.y = max.y;
        if (bodyA.velocity.y !== undefined && bodyA.velocity.y > 0) {
          bodyA.velocity.y = -bodyA.velocity.y * bodyA.restitution;
        }
      }

      // Z boundary
      if (min.z !== undefined && bodyA.position.z !== undefined && bodyA.position.z < min.z) {
        bodyA.position.z = min.z;
        if (bodyA.velocity.z !== undefined && bodyA.velocity.z < 0) {
          bodyA.velocity.z = -bodyA.velocity.z * bodyA.restitution;
        }
      } else if (max.z !== undefined && bodyA.position.z !== undefined && bodyA.position.z > max.z) {
        bodyA.position.z = max.z;
        if (bodyA.velocity.z !== undefined && bodyA.velocity.z > 0) {
          bodyA.velocity.z = -bodyA.velocity.z * bodyA.restitution;
        }
      }
      break;
    }
  }
}

/**
 * Solves a batch of constraints iteratively.
 */
export function resolveConstraintBatch(
  constraints: CollisionConstraint[],
  dt: number,
  iterations = 4
): void {
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < constraints.length; i++) {
      resolveConstraint(constraints[i], dt);
    }
  }
}
