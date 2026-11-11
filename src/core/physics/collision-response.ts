/**
 * AF Motion — Collision Response Engine
 *
 * Implements impulse-based velocity resolution, Coulomb surface friction,
 * mass-aware elastic/inelastic collisions, Baumgarte positional stabilization,
 * and multi-contact iterative solvers.
 */

import type { PhysicsVector } from "./types.js";
import type { CollisionContact } from "./collision-types.js";
import {
  createVector,
  dot,
  subVectors,
  addVectors,
  scaleVector,
  magnitude,
} from "./math.js";

/**
 * Resolves velocity impulses for a collision contact manifold along the normal.
 */
export function resolveCollisionImpulse(
  contact: CollisionContact,
  restitutionOverride?: number
): void {
  const { bodyA, bodyB, normal } = contact;

  // Trigger volumes do not exchange physical impulses
  if (bodyA.isTrigger || bodyB.isTrigger) return;

  const invMassA = bodyA.invMass;
  const invMassB = bodyB.invMass;
  const totalInvMass = invMassA + invMassB;

  // If both bodies are static, neither can accelerate
  if (totalInvMass === 0) return;

  // Relative velocity of B with respect to A: v_rel = v_B - v_A
  const relVel = subVectors(bodyB.velocity, bodyA.velocity);

  // Velocity component along the collision normal
  const velAlongNormal = dot(relVel, normal);

  // If bodies are already separating, do not apply impulse
  if (velAlongNormal > 0) return;

  // Calculate restitution (bounciness)
  const e = restitutionOverride !== undefined
    ? Math.max(0, Math.min(1, restitutionOverride))
    : Math.min(bodyA.restitution, bodyB.restitution);

  // Impulse scalar: J_n = -(1 + e) * (v_rel . n) / (1/mA + 1/mB)
  const impulseScalar = (-(1 + e) * velAlongNormal) / totalInvMass;
  const impulse = scaleVector(normal, impulseScalar);

  // Apply velocity adjustments according to inverse masses
  bodyA.velocity = subVectors(bodyA.velocity, scaleVector(impulse, invMassA));
  bodyB.velocity = addVectors(bodyB.velocity, scaleVector(impulse, invMassB));

  // Friction impulse resolution
  resolveFrictionImpulse(contact, impulseScalar);
}

/**
 * Resolves tangential friction impulses opposing sliding motion during contact.
 */
export function resolveFrictionImpulse(
  contact: CollisionContact,
  normalImpulseMagnitude: number
): void {
  const { bodyA, bodyB, normal } = contact;
  const invMassA = bodyA.invMass;
  const invMassB = bodyB.invMass;
  const totalInvMass = invMassA + invMassB;

  if (totalInvMass === 0 || normalImpulseMagnitude <= 0) return;

  // Relative velocity after normal impulse
  const relVel = subVectors(bodyB.velocity, bodyA.velocity);

  // Tangent component: v_t = v_rel - (v_rel . n) * n
  const normalVel = scaleVector(normal, dot(relVel, normal));
  const tangent = subVectors(relVel, normalVel);
  const tangentSpeed = magnitude(tangent);

  if (tangentSpeed < 1e-6) return;

  const tangentUnit = scaleVector(tangent, 1 / tangentSpeed);

  // Tangential impulse magnitude: J_t = -(v_rel . t) / (1/mA + 1/mB)
  const frictionImpulseScalar = -tangentSpeed / totalInvMass;

  // Combined friction coefficient (geometric mean)
  const mu = Math.sqrt(bodyA.friction * bodyB.friction);

  // Clamp friction impulse by Coulomb's law: |J_t| <= mu * J_n
  const maxFriction = mu * normalImpulseMagnitude;
  const clampedFrictionScalar = Math.max(-maxFriction, Math.min(maxFriction, frictionImpulseScalar));

  const frictionImpulse = scaleVector(tangentUnit, clampedFrictionScalar);

  bodyA.velocity = subVectors(bodyA.velocity, scaleVector(frictionImpulse, invMassA));
  bodyB.velocity = addVectors(bodyB.velocity, scaleVector(frictionImpulse, invMassB));
}

/**
 * Resolves positional penetration via Baumgarte linear projection without altering velocities.
 */
export function resolvePositionalCorrection(
  contact: CollisionContact,
  slop = 0.01,
  percent = 0.8
): void {
  const { bodyA, bodyB, normal, penetration } = contact;

  if (bodyA.isTrigger || bodyB.isTrigger) return;

  const invMassA = bodyA.invMass;
  const invMassB = bodyB.invMass;
  const totalInvMass = invMassA + invMassB;

  if (totalInvMass === 0) return;

  // Correct penetration beyond allowed slop
  const correctionMagnitude = (Math.max(penetration - slop, 0) / totalInvMass) * percent;
  if (correctionMagnitude <= 0) return;

  const correction = scaleVector(normal, correctionMagnitude);

  bodyA.position = subVectors(bodyA.position, scaleVector(correction, invMassA));
  bodyB.position = addVectors(bodyB.position, scaleVector(correction, invMassB));
}

/**
 * Solves a batch of collision contacts iteratively for numerical stability.
 */
export function resolveContactBatch(
  contacts: CollisionContact[],
  iterations = 8,
  slop = 0.01,
  percent = 0.8
): void {
  if (contacts.length === 0) return;

  // 1. Solve velocity impulses across solver iterations
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < contacts.length; i++) {
      resolveCollisionImpulse(contacts[i]);
    }
  }

  // 2. Solve positional penetration corrections
  for (let i = 0; i < contacts.length; i++) {
    resolvePositionalCorrection(contacts[i], slop, percent);
  }
}
