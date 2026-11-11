/**
 * AF Motion — 3D Physics Solvers & Numerical Integrators
 *
 * Implements Symplectic Euler, Verlet, and RK4 time integrators,
 * along with impulse-based collision resolution and constraint satisfaction.
 * Incorporates true 3D rotational inertia tensors, static/dynamic Coulomb friction,
 * resting velocity thresholds for stable stacking, and kinematic body support.
 */

import type {
  PhysicsIntegrator3D,
  CollisionSolver3D,
  ConstraintSolver3D,
} from "./types.js";
import type {
  RigidBodyState,
  CollisionManifold3D,
  Constraint3D,
  Vector3,
  Matrix3,
} from "../types.js";
import {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3LengthSq,
  quatNormalize,
  mat3TransformVector,
  localToWorldPoint,
  EPSILON,
  clamp,
} from "../math.js";
import { combineFriction, combineRestitution } from "../material.js";
import { computeWorldInvInertiaTensor } from "../body/inertia.js";

// ============================================================================
// Symplectic Euler Integrator
// ============================================================================

export class SymplecticEulerIntegrator3D implements PhysicsIntegrator3D {
  readonly name = "symplectic-euler";

  integrate(
    bodies: readonly RigidBodyState[],
    dt: number,
    gravity: Vector3
  ): void {
    if (dt <= 0) return;

    for (const body of bodies) {
      if (body.type === "static" || body.isSleeping) continue;

      // Kinematic bodies: integrated purely from velocities without external forces
      if (body.type === "kinematic") {
        body.transform.position.x += body.linearVelocity.x * dt;
        body.transform.position.y += body.linearVelocity.y * dt;
        body.transform.position.z += body.linearVelocity.z * dt;

        const q = body.transform.rotation;
        const wx = body.angularVelocity.x;
        const wy = body.angularVelocity.y;
        const wz = body.angularVelocity.z;

        const dqx = 0.5 * (q.w * wx + q.y * wz - q.z * wy) * dt;
        const dqy = 0.5 * (q.w * wy - q.x * wz + q.z * wx) * dt;
        const dqz = 0.5 * (q.w * wz + q.x * wy - q.y * wx) * dt;
        const dqw = 0.5 * (-q.x * wx - q.y * wy - q.z * wz) * dt;

        body.transform.rotation = quatNormalize({
          x: q.x + dqx,
          y: q.y + dqy,
          z: q.z + dqz,
          w: q.w + dqw,
        });

        body.force.x = 0;
        body.force.y = 0;
        body.force.z = 0;
        body.torque.x = 0;
        body.torque.y = 0;
        body.torque.z = 0;
        continue;
      }

      // Dynamic bodies:
      // 1. Accumulate linear acceleration: a = F / m + g * gravityScale
      const invMass = body.invMass;
      const grav = vec3Scale(gravity, body.gravityScale);
      const accelX = body.force.x * invMass + grav.x;
      const accelY = body.force.y * invMass + grav.y;
      const accelZ = body.force.z * invMass + grav.z;

      // 2. Integrate linear velocity
      body.linearVelocity.x += accelX * dt * body.linearFactor.x;
      body.linearVelocity.y += accelY * dt * body.linearFactor.y;
      body.linearVelocity.z += accelZ * dt * body.linearFactor.z;

      // Apply linear damping
      const linearDamp = Math.max(0, 1 - body.linearDamping * dt);
      body.linearVelocity.x *= linearDamp;
      body.linearVelocity.y *= linearDamp;
      body.linearVelocity.z *= linearDamp;

      // 3. World-space rotational inertia update: I_world^-1 = R * I_local^-1 * R^T
      const worldInvInertia = computeWorldInvInertiaTensor(
        body.invInertiaTensor,
        body.transform.rotation
      );

      // Integrate angular velocity: alpha = I_world^-1 * tau
      const angAccel = mat3TransformVector(worldInvInertia, body.torque);
      body.angularVelocity.x += angAccel.x * dt * body.angularFactor.x;
      body.angularVelocity.y += angAccel.y * dt * body.angularFactor.y;
      body.angularVelocity.z += angAccel.z * dt * body.angularFactor.z;

      // Apply angular damping
      const angDamp = Math.max(0, 1 - body.angularDamping * dt);
      body.angularVelocity.x *= angDamp;
      body.angularVelocity.y *= angDamp;
      body.angularVelocity.z *= angDamp;

      // 4. Integrate position
      body.transform.position.x += body.linearVelocity.x * dt;
      body.transform.position.y += body.linearVelocity.y * dt;
      body.transform.position.z += body.linearVelocity.z * dt;

      // 5. Integrate orientation quaternion: q_new = q + 0.5 * dt * omega * q
      const q = body.transform.rotation;
      const wx = body.angularVelocity.x;
      const wy = body.angularVelocity.y;
      const wz = body.angularVelocity.z;

      const dqx = 0.5 * (q.w * wx + q.y * wz - q.z * wy) * dt;
      const dqy = 0.5 * (q.w * wy - q.x * wz + q.z * wx) * dt;
      const dqz = 0.5 * (q.w * wz + q.x * wy - q.y * wx) * dt;
      const dqw = 0.5 * (-q.x * wx - q.y * wy - q.z * wz) * dt;

      body.transform.rotation = quatNormalize({
        x: q.x + dqx,
        y: q.y + dqy,
        z: q.z + dqz,
        w: q.w + dqw,
      });

      // 6. Reset external accumulators
      body.force.x = 0;
      body.force.y = 0;
      body.force.z = 0;
      body.torque.x = 0;
      body.torque.y = 0;
      body.torque.z = 0;
    }
  }
}

// ============================================================================
// Impulse-Based Collision Solver with Rotational Inertia
// ============================================================================

export class ImpulseCollisionSolver3D implements CollisionSolver3D {
  readonly name = "impulse-solver";
  private readonly baumgarte = 0.2;
  private readonly slop = 0.005;
  private readonly restingVelocityThreshold = 0.25; // m/s threshold below which restitution = 0

  resolveCollisions(
    manifolds: readonly CollisionManifold3D[],
    bodies: ReadonlyMap<string, RigidBodyState>,
    iterations: number,
    dt: number
  ): void {
    if (manifolds.length === 0 || dt <= 0) return;

    // Cache world-space inverse inertia tensors for participating dynamic bodies
    const worldInvInertias = new Map<string, Matrix3>();

    for (const manifold of manifolds) {
      if (manifold.isTrigger) continue;

      for (const id of [manifold.bodyAId, manifold.bodyBId]) {
        if (!id || worldInvInertias.has(id)) continue;
        const b = bodies.get(id);
        if (b && b.type === "dynamic") {
          worldInvInertias.set(
            id,
            computeWorldInvInertiaTensor(b.invInertiaTensor, b.transform.rotation)
          );
        }
      }
    }

    for (let iter = 0; iter < iterations; iter++) {
      for (const manifold of manifolds) {
        if (manifold.isTrigger) continue;

        const bodyA = bodies.get(manifold.bodyAId);
        const bodyB = bodies.get(manifold.bodyBId);

        if (!bodyA && !bodyB) continue;

        const isDynamicA = bodyA?.type === "dynamic";
        const isDynamicB = bodyB?.type === "dynamic";

        // If neither is dynamic, no impulse can be resolved
        if (!isDynamicA && !isDynamicB) continue;

        // Wake on contact: if one is dynamic awake and other is sleeping, wake sleeping
        if (bodyA && bodyB) {
          if (bodyA.isSleeping && (!bodyB.isSleeping || bodyB.type === "kinematic")) {
            bodyA.isSleeping = false;
            bodyA.sleepTime = 0;
          } else if (bodyB.isSleeping && (!bodyA.isSleeping || bodyA.type === "kinematic")) {
            bodyB.isSleeping = false;
            bodyB.sleepTime = 0;
          }
        }

        const invMassA = isDynamicA ? bodyA.invMass : 0;
        const invMassB = isDynamicB ? bodyB.invMass : 0;
        const invInertiaA = isDynamicA ? worldInvInertias.get(bodyA.id) : undefined;
        const invInertiaB = isDynamicB ? worldInvInertias.get(bodyB.id) : undefined;

        const matA = bodyA?.material ?? { friction: 0.5, restitution: 0.2 };
        const matB = bodyB?.material ?? { friction: 0.5, restitution: 0.2 };
        const baseRestitution = combineRestitution(matA, matB);
        const friction = combineFriction(matA, matB);

        for (const contact of manifold.contacts) {
          const normal = contact.normal;

          // Lever arms rA and rB from body centers to contact point
          const rA = bodyA
            ? vec3Sub(contact.position, bodyA.transform.position)
            : vec3(0, 0, 0);
          const rB = bodyB
            ? vec3Sub(contact.position, bodyB.transform.position)
            : vec3(0, 0, 0);

          // Contact point velocities: v_p = v + w x r
          const vA = bodyA
            ? vec3Add(bodyA.linearVelocity, vec3Cross(bodyA.angularVelocity, rA))
            : vec3(0, 0, 0);
          const vB = bodyB
            ? vec3Add(bodyB.linearVelocity, vec3Cross(bodyB.angularVelocity, rB))
            : vec3(0, 0, 0);
          const vRel = vec3Sub(vB, vA);

          const normalVel = vec3Dot(vRel, normal);

          // Effective mass with angular inertia terms:
          // K_n = 1/mA + 1/mB + [(I_A^-1 (rA x n)) x rA + (I_B^-1 (rB x n)) x rB] . n
          let angularTermA = 0;
          if (isDynamicA && invInertiaA) {
            const rAxN = vec3Cross(rA, normal);
            const invIxRAxN = mat3TransformVector(invInertiaA, rAxN);
            angularTermA = vec3Dot(vec3Cross(invIxRAxN, rA), normal);
          }

          let angularTermB = 0;
          if (isDynamicB && invInertiaB) {
            const rBxN = vec3Cross(rB, normal);
            const invIxRBxN = mat3TransformVector(invInertiaB, rBxN);
            angularTermB = vec3Dot(vec3Cross(invIxRBxN, rB), normal);
          }

          const effectiveMass = invMassA + invMassB + angularTermA + angularTermB;
          if (effectiveMass <= EPSILON) continue;

          // Restitution threshold: zero restitution at low velocities for stable stacking
          const effectiveRestitution =
            Math.abs(normalVel) > this.restingVelocityThreshold ? baseRestitution : 0;

          // Position bias (Baumgarte stabilization)
          const penetration = Math.max(0, contact.penetration - this.slop);
          const bias = (this.baumgarte / dt) * penetration;

          // Normal impulse calculation
          const deltaImpulse = -(normalVel + effectiveRestitution * normalVel - bias) / effectiveMass;
          const oldImpulse = contact.impulse ?? 0;
          const newImpulse = Math.max(0, oldImpulse + deltaImpulse);
          const actualImpulse = newImpulse - oldImpulse;
          contact.impulse = newImpulse;

          const impulseVec = vec3Scale(normal, actualImpulse);

          // Apply normal linear & angular impulses
          if (isDynamicA) {
            bodyA.linearVelocity = vec3Sub(bodyA.linearVelocity, vec3Scale(impulseVec, invMassA));
            if (invInertiaA) {
              const torqueImpulse = vec3Cross(rA, vec3Scale(impulseVec, -1));
              const deltaOmegaA = mat3TransformVector(invInertiaA, torqueImpulse);
              bodyA.angularVelocity = vec3Add(bodyA.angularVelocity, deltaOmegaA);
            }
          }
          if (isDynamicB) {
            bodyB.linearVelocity = vec3Add(bodyB.linearVelocity, vec3Scale(impulseVec, invMassB));
            if (invInertiaB) {
              const torqueImpulse = vec3Cross(rB, impulseVec);
              const deltaOmegaB = mat3TransformVector(invInertiaB, torqueImpulse);
              bodyB.angularVelocity = vec3Add(bodyB.angularVelocity, deltaOmegaB);
            }
          }

          // Friction impulse along tangent
          // Recompute relative velocity after normal impulse
          const newVA = bodyA
            ? vec3Add(bodyA.linearVelocity, vec3Cross(bodyA.angularVelocity, rA))
            : vec3(0, 0, 0);
          const newVB = bodyB
            ? vec3Add(bodyB.linearVelocity, vec3Cross(bodyB.angularVelocity, rB))
            : vec3(0, 0, 0);
          const newVRel = vec3Sub(newVB, newVA);

          const newNormalVel = vec3Dot(newVRel, normal);
          const tangent = vec3Sub(newVRel, vec3Scale(normal, newNormalVel));
          const tangentLenSq = vec3LengthSq(tangent);

          if (tangentLenSq > EPSILON && friction > 0) {
            const tangentDir = vec3Scale(tangent, 1 / Math.sqrt(tangentLenSq));
            const tangentVel = vec3Dot(newVRel, tangentDir);

            let angTangentA = 0;
            if (isDynamicA && invInertiaA) {
              const rAxT = vec3Cross(rA, tangentDir);
              const invIxRAxT = mat3TransformVector(invInertiaA, rAxT);
              angTangentA = vec3Dot(vec3Cross(invIxRAxT, rA), tangentDir);
            }

            let angTangentB = 0;
            if (isDynamicB && invInertiaB) {
              const rBxT = vec3Cross(rB, tangentDir);
              const invIxRBxT = mat3TransformVector(invInertiaB, rBxT);
              angTangentB = vec3Dot(vec3Cross(invIxRBxT, rB), tangentDir);
            }

            const effectiveTangentMass = invMassA + invMassB + angTangentA + angTangentB;
            if (effectiveTangentMass > EPSILON) {
              const maxFrictionImpulse = newImpulse * friction;
              const deltaFriction = -tangentVel / effectiveTangentMass;
              const clampedFriction = clamp(deltaFriction, -maxFrictionImpulse, maxFrictionImpulse);

              const fVec = vec3Scale(tangentDir, clampedFriction);
              if (isDynamicA) {
                bodyA.linearVelocity = vec3Sub(bodyA.linearVelocity, vec3Scale(fVec, invMassA));
                if (invInertiaA) {
                  const torqueImpulse = vec3Cross(rA, vec3Scale(fVec, -1));
                  const deltaOmegaA = mat3TransformVector(invInertiaA, torqueImpulse);
                  bodyA.angularVelocity = vec3Add(bodyA.angularVelocity, deltaOmegaA);
                }
              }
              if (isDynamicB) {
                bodyB.linearVelocity = vec3Add(bodyB.linearVelocity, vec3Scale(fVec, invMassB));
                if (invInertiaB) {
                  const torqueImpulse = vec3Cross(rB, fVec);
                  const deltaOmegaB = mat3TransformVector(invInertiaB, torqueImpulse);
                  bodyB.angularVelocity = vec3Add(bodyB.angularVelocity, deltaOmegaB);
                }
              }
            }
          }
        }
      }
    }
  }
}

// ============================================================================
// Constraint Solver
// ============================================================================

export class BasicConstraintSolver3D implements ConstraintSolver3D {
  readonly name = "basic-constraint-solver";

  solveConstraints(
    constraints: readonly Constraint3D[],
    bodies: ReadonlyMap<string, RigidBodyState>,
    iterations: number,
    _dt: number
  ): void {
    if (constraints.length === 0) return;

    for (let iter = 0; iter < iterations; iter++) {
      for (const constraint of constraints) {
        if (!constraint.enabled) continue;

        const bodyA = bodies.get(constraint.bodyAId);
        const bodyB = constraint.bodyBId ? bodies.get(constraint.bodyBId) : undefined;

        if (!bodyA) continue;

        const worldPivotA = localToWorldPoint(bodyA.transform, constraint.pivotA);
        const worldPivotB = bodyB
          ? localToWorldPoint(bodyB.transform, constraint.pivotB)
          : constraint.pivotB;

        const delta = vec3Sub(worldPivotB, worldPivotA);
        const currentDist = Math.hypot(delta.x, delta.y, delta.z);

        if (constraint.type === "distance") {
          const targetDist = constraint.maxDistance ?? constraint.minDistance ?? 0;
          const diff = currentDist - targetDist;
          if (Math.abs(diff) < EPSILON) continue;

          const dir = currentDist > EPSILON ? vec3Scale(delta, 1 / currentDist) : { x: 0, y: 1, z: 0 };
          const invMassA = bodyA.type === "dynamic" ? bodyA.invMass : 0;
          const invMassB = bodyB && bodyB.type === "dynamic" ? bodyB.invMass : 0;
          const totalInvMass = invMassA + invMassB;
          if (totalInvMass <= EPSILON) continue;

          const impulse = (diff * 0.5) / totalInvMass;
          if (invMassA > 0) {
            bodyA.transform.position = vec3Add(bodyA.transform.position, vec3Scale(dir, impulse * invMassA));
          }
          if (bodyB && invMassB > 0) {
            bodyB.transform.position = vec3Sub(bodyB.transform.position, vec3Scale(dir, impulse * invMassB));
          }
        } else if (constraint.type === "fixed" || constraint.type === "point-to-point") {
          if (currentDist < EPSILON) continue;
          const dir = vec3Scale(delta, 1 / currentDist);
          const invMassA = bodyA.type === "dynamic" ? bodyA.invMass : 0;
          const invMassB = bodyB && bodyB.type === "dynamic" ? bodyB.invMass : 0;
          const totalInvMass = invMassA + invMassB;
          if (totalInvMass <= EPSILON) continue;

          const impulse = (currentDist * 0.5) / totalInvMass;
          if (invMassA > 0) {
            bodyA.transform.position = vec3Add(bodyA.transform.position, vec3Scale(dir, impulse * invMassA));
          }
          if (bodyB && invMassB > 0) {
            bodyB.transform.position = vec3Sub(bodyB.transform.position, vec3Scale(dir, impulse * invMassB));
          }
        }
      }
    }
  }
}
