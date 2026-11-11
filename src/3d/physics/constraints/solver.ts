/**
 * AF Motion — 3D Advanced Constraint Solver & Articulated Island Engine
 *
 * Implements high-stability iterative solving for Hinge, Slider, Cone-Twist,
 * Ball-and-Socket, Generic 6DOF, Fixed, and Spring constraints with angular
 * and linear limits, motors, breaking thresholds, and connected body island sleeping.
 */

import type { Constraint3D, RigidBodyState, Vector3 } from "../types.js";
import type { ConstraintSolver3D } from "../solver/types.js";
import {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3SafeNormalize,
  localToWorldPoint,
  quatRotateVector,
  quatMultiply,
  quatFromAxisAngle,
  quatInverse,
  EPSILON,
  clamp,
} from "../math.js";

export type ConstraintBreakCallback = (
  constraintId: string,
  constraint: Constraint3D,
  impulse: number
) => void;

/**
 * Articulated Constraint Graph Component (Island).
 */
export interface BodyIsland {
  id: string;
  bodyIds: Set<string>;
  constraintIds: Set<string>;
  totalKineticEnergy: number;
  isSleeping: boolean;
}

/**
 * Advanced iterative constraint solver supporting articulated multibody mechanisms.
 */
export class AdvancedConstraintSolver3D implements ConstraintSolver3D {
  readonly name = "advanced-constraint-solver";
  private onBreak?: ConstraintBreakCallback;

  constructor(onBreak?: ConstraintBreakCallback) {
    this.onBreak = onBreak;
  }

  setOnBreakCallback(cb: ConstraintBreakCallback): void {
    this.onBreak = cb;
  }

  solveConstraints(
    constraints: readonly Constraint3D[],
    bodies: ReadonlyMap<string, RigidBodyState>,
    iterations: number,
    dt: number
  ): void {
    if (constraints.length === 0 || dt <= 0) return;

    for (let iter = 0; iter < iterations; iter++) {
      for (const c of constraints) {
        if (!c.enabled) continue;

        const bodyA = bodies.get(c.bodyAId);
        const bodyB = c.bodyBId ? bodies.get(c.bodyBId) : undefined;
        if (!bodyA) continue;

        const isDynA = bodyA.type === "dynamic";
        const isDynB = bodyB ? bodyB.type === "dynamic" : false;
        const invMA = isDynA ? bodyA.invMass : 0;
        const invMB = isDynB && bodyB ? bodyB.invMass : 0;
        const totalInvM = invMA + invMB;

        if (totalInvM <= EPSILON) continue;

        const worldPivotA = localToWorldPoint(bodyA.transform, c.pivotA);
        const worldPivotB = bodyB
          ? localToWorldPoint(bodyB.transform, c.pivotB)
          : c.pivotB;

        const delta = vec3Sub(worldPivotB, worldPivotA);
        const currentDist = Math.hypot(delta.x, delta.y, delta.z);

        // --------------------------------------------------------------------
        // 1. Pivot Translation Alignment (Point-to-Point, Fixed, Hinge, ConeTwist)
        // --------------------------------------------------------------------
        if (
          c.type === "point-to-point" ||
          c.type === "fixed" ||
          c.type === "hinge" ||
          c.type === "cone-twist"
        ) {
          if (currentDist > EPSILON) {
            const dir = vec3Scale(delta, 1 / currentDist);
            const stiffness = c.stiffness ?? 1.0;
            const corr = (currentDist * stiffness * 0.5) / totalInvM;

            // Check breaking impulse
            const approxImpulse = (corr * (1 / totalInvM)) / dt;
            if (c.breakingImpulse && approxImpulse > c.breakingImpulse) {
              c.enabled = false;
              if (this.onBreak) this.onBreak(c.id, c, approxImpulse);
              continue;
            }

            if (invMA > 0) {
              bodyA.transform.position = vec3Add(bodyA.transform.position, vec3Scale(dir, corr * invMA));
            }
            if (invMB > 0 && bodyB) {
              bodyB.transform.position = vec3Sub(bodyB.transform.position, vec3Scale(dir, corr * invMB));
            }
          }
        }

        // --------------------------------------------------------------------
        // 2. Distance Constraint
        // --------------------------------------------------------------------
        if (c.type === "distance") {
          const targetDist = c.maxDistance ?? c.minDistance ?? 0;
          const diff = currentDist - targetDist;

          if (Math.abs(diff) > EPSILON) {
            const dir = currentDist > EPSILON ? vec3Scale(delta, 1 / currentDist) : { x: 0, y: 1, z: 0 };
            const stiffness = c.stiffness ?? 1.0;
            const corr = (diff * stiffness * 0.5) / totalInvM;

            const approxImpulse = Math.abs(corr) / dt;
            if (c.breakingImpulse && approxImpulse > c.breakingImpulse) {
              c.enabled = false;
              if (this.onBreak) this.onBreak(c.id, c, approxImpulse);
              continue;
            }

            if (invMA > 0) {
              bodyA.transform.position = vec3Add(bodyA.transform.position, vec3Scale(dir, corr * invMA));
            }
            if (invMB > 0 && bodyB) {
              bodyB.transform.position = vec3Sub(bodyB.transform.position, vec3Scale(dir, corr * invMB));
            }
          }
        }

        // --------------------------------------------------------------------
        // 3. Damped Spring Constraint
        // --------------------------------------------------------------------
        if (c.type === "spring") {
          const restLen = c.minDistance ?? 1.0;
          const k = c.stiffness ?? 100;
          const dampingCoeff = c.damping ?? 5.0;

          const diff = currentDist - restLen;
          const dir = currentDist > EPSILON ? vec3Scale(delta, 1 / currentDist) : { x: 0, y: 1, z: 0 };

          const vA = bodyA.linearVelocity;
          const vB = bodyB ? bodyB.linearVelocity : { x: 0, y: 0, z: 0 };
          const relVel = vec3Sub(vB, vA);
          const vAlongDir = vec3Dot(relVel, dir);

          const forceMag = k * diff + dampingCoeff * vAlongDir;
          const impulseMag = forceMag * dt;

          if (invMA > 0) {
            bodyA.linearVelocity = vec3Add(bodyA.linearVelocity, vec3Scale(dir, impulseMag * invMA));
          }
          if (invMB > 0 && bodyB) {
            bodyB.linearVelocity = vec3Sub(bodyB.linearVelocity, vec3Scale(dir, impulseMag * invMB));
          }
        }

        // --------------------------------------------------------------------
        // 4. Fixed Constraint (Orientation Lock)
        // --------------------------------------------------------------------
        if (c.type === "fixed" && bodyB) {
          // Align bodyB rotation with bodyA
          const qA = bodyA.transform.rotation;
          const qB = bodyB.transform.rotation;
          // Relative rotation error
          const qInvA = quatInverse(qA);
          const qDiff = quatMultiply(qInvA, qB);

          if (Math.abs(qDiff.x) > 0.001 || Math.abs(qDiff.y) > 0.001 || Math.abs(qDiff.z) > 0.001) {
            const rotCorrection = 0.5 * (c.stiffness ?? 1.0);
            if (invMB > 0) {
              bodyB.transform.rotation = {
                x: qB.x - qDiff.x * rotCorrection,
                y: qB.y - qDiff.y * rotCorrection,
                z: qB.z - qDiff.z * rotCorrection,
                w: qB.w,
              };
            }
          }
        }

        // --------------------------------------------------------------------
        // 5. Hinge Constraint (Revolute Joint)
        // --------------------------------------------------------------------
        if (c.type === "hinge") {
          const axisA = c.axisA ?? { x: 0, y: 1, z: 0 };
          const axisB = c.axisB ?? { x: 0, y: 1, z: 0 };

          const worldAxisA = quatRotateVector(bodyA.transform.rotation, axisA);
          const worldAxisB = bodyB
            ? quatRotateVector(bodyB.transform.rotation, axisB)
            : axisB;

          // 5.1 Axis Alignment: cross product of axes must be zero
          const axisErr = vec3Cross(worldAxisA, worldAxisB);
          const axisErrLen = vec3Length(axisErr);

          if (axisErrLen > EPSILON && bodyB && invMB > 0) {
            const alignAxis = vec3Scale(axisErr, 1 / axisErrLen);
            const rotDelta = quatFromAxisAngle(alignAxis, -axisErrLen * 0.5);
            bodyB.transform.rotation = quatMultiply(rotDelta, bodyB.transform.rotation);
          }

          // 5.2 Angular Motor
          if (c.motorEnabled && c.motorTargetVelocity !== undefined) {
            const targetVel = c.motorTargetVelocity;
            const maxTorque = (c.motorMaxForce ?? 100) * dt;

            const angVA = vec3Dot(bodyA.angularVelocity, worldAxisA);
            const angVB = bodyB ? vec3Dot(bodyB.angularVelocity, worldAxisA) : 0;
            const currentRelAng = angVB - angVA;
            const neededTorque = clamp(targetVel - currentRelAng, -maxTorque, maxTorque);

            if (isDynA) {
              bodyA.angularVelocity = vec3Sub(bodyA.angularVelocity, vec3Scale(worldAxisA, neededTorque * 0.5));
            }
            if (isDynB && bodyB) {
              bodyB.angularVelocity = vec3Add(bodyB.angularVelocity, vec3Scale(worldAxisA, neededTorque * 0.5));
            }
          }

          // 5.3 Angular Limits
          if (c.lowerLimit !== undefined || c.upperLimit !== undefined) {
            // Find a vector orthogonal to worldAxisA
            const orthA = Math.abs(worldAxisA.x) < 0.9
              ? vec3SafeNormalize(vec3Cross(worldAxisA, { x: 1, y: 0, z: 0 }))
              : vec3SafeNormalize(vec3Cross(worldAxisA, { x: 0, y: 1, z: 0 }));

            const orthB = bodyB
              ? quatRotateVector(bodyB.transform.rotation, orthA)
              : orthA;

            const dot = clamp(vec3Dot(orthA, orthB), -1, 1);
            let angle = Math.acos(dot);
            if (vec3Dot(vec3Cross(orthA, orthB), worldAxisA) < 0) {
              angle = -angle;
            }

            if (c.lowerLimit !== undefined && angle < c.lowerLimit && bodyB && invMB > 0) {
              const diff = c.lowerLimit - angle;
              const rotFix = quatFromAxisAngle(worldAxisA, diff * 0.5);
              bodyB.transform.rotation = quatMultiply(rotFix, bodyB.transform.rotation);
            } else if (c.upperLimit !== undefined && angle > c.upperLimit && bodyB && invMB > 0) {
              const diff = c.upperLimit - angle;
              const rotFix = quatFromAxisAngle(worldAxisA, diff * 0.5);
              bodyB.transform.rotation = quatMultiply(rotFix, bodyB.transform.rotation);
            }
          }
        }

        // --------------------------------------------------------------------
        // 6. Slider Constraint (Prismatic Joint)
        // --------------------------------------------------------------------
        if (c.type === "slider") {
          const axisA = c.axisA ?? { x: 1, y: 0, z: 0 };
          const worldSliderAxis = quatRotateVector(bodyA.transform.rotation, axisA);

          // Project delta onto slider axis
          const linProj = vec3Dot(delta, worldSliderAxis);
          const orthoDelta = vec3Sub(delta, vec3Scale(worldSliderAxis, linProj));
          const orthoDist = vec3Length(orthoDelta);

          // Restrict orthogonal drift
          if (orthoDist > EPSILON) {
            const orthoDir = vec3Scale(orthoDelta, 1 / orthoDist);
            const corr = (orthoDist * 0.5) / totalInvM;

            if (invMA > 0) {
              bodyA.transform.position = vec3Add(bodyA.transform.position, vec3Scale(orthoDir, corr * invMA));
            }
            if (invMB > 0 && bodyB) {
              bodyB.transform.position = vec3Sub(bodyB.transform.position, vec3Scale(orthoDir, corr * invMB));
            }
          }

          // Linear limits along slider axis
          if (c.lowerLimit !== undefined && linProj < c.lowerLimit) {
            const err = c.lowerLimit - linProj;
            if (invMA > 0) bodyA.transform.position = vec3Sub(bodyA.transform.position, vec3Scale(worldSliderAxis, err * 0.5));
            if (invMB > 0 && bodyB) bodyB.transform.position = vec3Add(bodyB.transform.position, vec3Scale(worldSliderAxis, err * 0.5));
          } else if (c.upperLimit !== undefined && linProj > c.upperLimit) {
            const err = linProj - c.upperLimit;
            if (invMA > 0) bodyA.transform.position = vec3Add(bodyA.transform.position, vec3Scale(worldSliderAxis, err * 0.5));
            if (invMB > 0 && bodyB) bodyB.transform.position = vec3Sub(bodyB.transform.position, vec3Scale(worldSliderAxis, err * 0.5));
          }

          // Linear motor
          if (c.motorEnabled && c.motorTargetVelocity !== undefined) {
            const targetV = c.motorTargetVelocity;
            const maxF = (c.motorMaxForce ?? 100) * dt;

            const vLinA = vec3Dot(bodyA.linearVelocity, worldSliderAxis);
            const vLinB = bodyB ? vec3Dot(bodyB.linearVelocity, worldSliderAxis) : 0;
            const relV = vLinB - vLinA;
            const dv = clamp(targetV - relV, -maxF, maxF);

            if (isDynA) bodyA.linearVelocity = vec3Sub(bodyA.linearVelocity, vec3Scale(worldSliderAxis, dv * 0.5));
            if (isDynB && bodyB) bodyB.linearVelocity = vec3Add(bodyB.linearVelocity, vec3Scale(worldSliderAxis, dv * 0.5));
          }
        }

        // --------------------------------------------------------------------
        // 7. Cone-Twist Constraint (Ragdoll Joint Limits)
        // --------------------------------------------------------------------
        if (c.type === "cone-twist" && bodyB) {
          const axisA = c.axisA ?? { x: 0, y: 1, z: 0 };
          const axisB = c.axisB ?? { x: 0, y: 1, z: 0 };

          const worldAxisA = quatRotateVector(bodyA.transform.rotation, axisA);
          const worldAxisB = quatRotateVector(bodyB.transform.rotation, axisB);

          const dot = clamp(vec3Dot(worldAxisA, worldAxisB), -1, 1);
          const coneAngle = Math.acos(dot);
          const maxCone = c.coneLimitAngle ?? Math.PI / 4;

          if (coneAngle > maxCone && invMB > 0) {
            const swingAxis = vec3Cross(worldAxisA, worldAxisB);
            const swingLen = vec3Length(swingAxis);
            if (swingLen > EPSILON) {
              const normSwing = vec3Scale(swingAxis, 1 / swingLen);
              const excess = coneAngle - maxCone;
              const rotFix = quatFromAxisAngle(normSwing, -excess * 0.5);
              bodyB.transform.rotation = quatMultiply(rotFix, bodyB.transform.rotation);
            }
          }
        }

        // --------------------------------------------------------------------
        // 8. Generic 6DOF Constraint
        // --------------------------------------------------------------------
        if (c.type === "generic6dof") {
          // Linear limits on X, Y, Z
          if (c.linearLimits) {
            const min = c.linearLimits.min;
            const max = c.linearLimits.max;

            for (const axis of ["x", "y", "z"] as const) {
              const dAxis = delta[axis];
              if (dAxis < min[axis]) {
                const err = min[axis] - dAxis;
                if (invMA > 0) bodyA.transform.position[axis] -= err * 0.5;
                if (invMB > 0 && bodyB) bodyB.transform.position[axis] += err * 0.5;
              } else if (dAxis > max[axis]) {
                const err = dAxis - max[axis];
                if (invMA > 0) bodyA.transform.position[axis] += err * 0.5;
                if (invMB > 0 && bodyB) bodyB.transform.position[axis] -= err * 0.5;
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Computes connected body islands (articulated mechanisms) for group solving and sleeping.
 */
export function computeConstraintIslands(
  bodies: ReadonlyMap<string, RigidBodyState>,
  constraints: readonly Constraint3D[]
): BodyIsland[] {
  const dynamicBodyIds = new Set<string>();
  for (const b of bodies.values()) {
    if (b.type === "dynamic") dynamicBodyIds.add(b.id);
  }

  const adj = new Map<string, Set<string>>();
  const bodyConstraints = new Map<string, Set<string>>();

  for (const id of dynamicBodyIds) {
    adj.set(id, new Set());
    bodyConstraints.set(id, new Set());
  }

  for (const c of constraints) {
    if (!c.enabled) continue;
    const a = c.bodyAId;
    const b = c.bodyBId;

    if (dynamicBodyIds.has(a) && b && dynamicBodyIds.has(b)) {
      adj.get(a)?.add(b);
      adj.get(b)?.add(a);
      bodyConstraints.get(a)?.add(c.id);
      bodyConstraints.get(b)?.add(c.id);
    } else if (dynamicBodyIds.has(a)) {
      bodyConstraints.get(a)?.add(c.id);
    } else if (b && dynamicBodyIds.has(b)) {
      bodyConstraints.get(b)?.add(c.id);
    }
  }

  const visited = new Set<string>();
  const islands: BodyIsland[] = [];
  let islandCount = 0;

  for (const bodyId of dynamicBodyIds) {
    if (visited.has(bodyId)) continue;

    const islandBodies = new Set<string>();
    const islandConstraints = new Set<string>();
    const queue = [bodyId];
    visited.add(bodyId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      islandBodies.add(curr);

      const cIds = bodyConstraints.get(curr);
      if (cIds) {
        for (const cid of cIds) islandConstraints.add(cid);
      }

      const neighbors = adj.get(curr);
      if (neighbors) {
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }
    }

    let totalKineticEnergy = 0;
    let allSleeping = true;

    for (const bid of islandBodies) {
      const b = bodies.get(bid);
      if (b) {
        const linE = 0.5 * b.mass * vec3LengthSq(b.linearVelocity);
        const angE = 0.5 * vec3LengthSq(b.angularVelocity);
        totalKineticEnergy += linE + angE;
        if (!b.isSleeping) allSleeping = false;
      }
    }

    islands.push({
      id: `island_${islandCount++}`,
      bodyIds: islandBodies,
      constraintIds: islandConstraints,
      totalKineticEnergy,
      isSleeping: allSleeping,
    });
  }

  return islands;
}
