/**
 * AF Motion — 3D Soft Body Collision Resolver
 *
 * Resolves contact and impulse momentum exchange between soft body particles
 * and static geometry, ground planes, and dynamic/kinematic rigid bodies.
 */

import type { RigidBodyState, Transform3D, Vector3 } from "../types.js";
import type { SoftBodyState } from "../types.js";
import {
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  localToWorldPoint,
  worldToLocalPoint,
  quatRotateVector,
  mat3TransformVector,
  EPSILON,
  clamp,
} from "../math.js";
import { computeWorldInvInertiaTensor } from "../body/inertia.js";

/**
 * Resolves collisions for all active soft bodies against rigid bodies and ground boundaries.
 */
export function resolveSoftBodyCollisions(
  softBodies: Iterable<SoftBodyState>,
  bodies: ReadonlyMap<string, RigidBodyState>,
  dt: number,
  groundY: number = 0,
  hasGround: boolean = true
): void {
  for (const sb of softBodies) {
    const pos = sb.positions;
    const vel = sb.velocities;
    const invM = sb.invMasses;
    const n = sb.particleCount;
    const friction = sb.material.friction ?? 0.5;
    const restitution = sb.material.restitution ?? 0.0;
    const particleRadius = 0.02;

    for (let i = 0; i < n; i++) {
      if (invM[i] <= EPSILON) continue;
      const idx = i * 3;
      let px = pos[idx];
      let py = pos[idx + 1];
      let pz = pos[idx + 2];

      let vx = vel[idx];
      let vy = vel[idx + 1];
      let vz = vel[idx + 2];

      // 1. Ground Plane Collision (y = groundY)
      if (hasGround && py - particleRadius < groundY) {
        const penetration = groundY - (py - particleRadius);
        py += penetration;

        // Invert normal velocity with restitution
        if (vy < 0) {
          vy = -vy * restitution;
        }

        // Apply tangential friction
        const tangentialDamp = Math.max(0, 1 - friction * 2.0 * dt);
        vx *= tangentialDamp;
        vz *= tangentialDamp;

        pos[idx + 1] = py;
        vel[idx] = vx;
        vel[idx + 1] = vy;
        vel[idx + 2] = vz;
      }

      // 2. Rigid Body Colliders Interaction
      for (const body of bodies.values()) {
        const bPos = body.transform.position;
        const bRot = body.transform.rotation;

        for (const col of body.colliders) {
          const shape = col.shape;

          if (shape.type === "sphere") {
            const worldCenter = localToWorldPoint(body.transform, col.offset.position);
            const r = shape.radius + particleRadius;

            const dx = px - worldCenter.x;
            const dy = py - worldCenter.y;
            const dz = pz - worldCenter.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < r * r && distSq > EPSILON) {
              const dist = Math.sqrt(distSq);
              const invDist = 1 / dist;
              const nx = dx * invDist;
              const ny = dy * invDist;
              const nz = dz * invDist;

              const pen = r - dist;
              px += nx * pen;
              py += ny * pen;
              pz += nz * pen;

              pos[idx] = px;
              pos[idx + 1] = py;
              pos[idx + 2] = pz;

              // Contact velocity of the body at contact point
              const rContact = { x: px - bPos.x, y: py - bPos.y, z: pz - bPos.z };
              const vRot = vec3Cross(body.angularVelocity, rContact);
              const vBody = vec3Add(body.linearVelocity, vRot);

              // Relative velocity
              const relVx = vx - vBody.x;
              const relVy = vy - vBody.y;
              const relVz = vz - vBody.z;
              const normalVel = relVx * nx + relVy * ny + relVz * nz;

              if (normalVel < 0) {
                const pMass = 1 / invM[i];
                const deltaV = -normalVel * (1 + restitution);
                const impulseMag = deltaV * pMass;

                vx += nx * deltaV;
                vy += ny * deltaV;
                vz += nz * deltaV;

                vel[idx] = vx;
                vel[idx + 1] = vy;
                vel[idx + 2] = vz;

                // Reaction impulse on dynamic rigid body
                if (body.type === "dynamic") {
                  const jx = -nx * impulseMag;
                  const jy = -ny * impulseMag;
                  const jz = -nz * impulseMag;

                  body.linearVelocity.x += jx * body.invMass;
                  body.linearVelocity.y += jy * body.invMass;
                  body.linearVelocity.z += jz * body.invMass;

                  const torque = vec3Cross(rContact, { x: jx, y: jy, z: jz });
                  const worldInvI = computeWorldInvInertiaTensor(body.invInertiaTensor, bRot);
                  const angAcc = mat3TransformVector(worldInvI, torque);

                  body.angularVelocity.x += angAcc.x;
                  body.angularVelocity.y += angAcc.y;
                  body.angularVelocity.z += angAcc.z;
                }
              }
            }
          } else if (shape.type === "box") {
            // Box shape in local coordinates
            const localP = worldToLocalPoint(body.transform, { x: px, y: py, z: pz });
            const hx = shape.halfExtents.x + particleRadius;
            const hy = shape.halfExtents.y + particleRadius;
            const hz = shape.halfExtents.z + particleRadius;

            if (
              Math.abs(localP.x) < hx &&
              Math.abs(localP.y) < hy &&
              Math.abs(localP.z) < hz
            ) {
              // Find shallowest axis to push out
              const dx = hx - Math.abs(localP.x);
              const dy = hy - Math.abs(localP.y);
              const dz = hz - Math.abs(localP.z);

              let normLocal: Vector3;
              if (dx < dy && dx < dz) {
                normLocal = { x: localP.x >= 0 ? 1 : -1, y: 0, z: 0 };
                localP.x = localP.x >= 0 ? hx : -hx;
              } else if (dy < dz) {
                normLocal = { x: 0, y: localP.y >= 0 ? 1 : -1, z: 0 };
                localP.y = localP.y >= 0 ? hy : -hy;
              } else {
                normLocal = { x: 0, y: 0, z: localP.z >= 0 ? 1 : -1 };
                localP.z = localP.z >= 0 ? hz : -hz;
              }

              const worldP = localToWorldPoint(body.transform, localP);
              const normWorld = quatRotateVector(bRot, normLocal);

              px = worldP.x;
              py = worldP.y;
              pz = worldP.z;

              pos[idx] = px;
              pos[idx + 1] = py;
              pos[idx + 2] = pz;

              // Impulse exchange
              const rContact = { x: px - bPos.x, y: py - bPos.y, z: pz - bPos.z };
              const vRot = vec3Cross(body.angularVelocity, rContact);
              const vBody = vec3Add(body.linearVelocity, vRot);

              const relVx = vx - vBody.x;
              const relVy = vy - vBody.y;
              const relVz = vz - vBody.z;
              const normalVel = relVx * normWorld.x + relVy * normWorld.y + relVz * normWorld.z;

              if (normalVel < 0) {
                const pMass = 1 / invM[i];
                const deltaV = -normalVel * (1 + restitution);
                const impulseMag = deltaV * pMass;

                vx += normWorld.x * deltaV;
                vy += normWorld.y * deltaV;
                vz += normWorld.z * deltaV;

                vel[idx] = vx;
                vel[idx + 1] = vy;
                vel[idx + 2] = vz;

                if (body.type === "dynamic") {
                  const jx = -normWorld.x * impulseMag;
                  const jy = -normWorld.y * impulseMag;
                  const jz = -normWorld.z * impulseMag;

                  body.linearVelocity.x += jx * body.invMass;
                  body.linearVelocity.y += jy * body.invMass;
                  body.linearVelocity.z += jz * body.invMass;

                  const torque = vec3Cross(rContact, { x: jx, y: jy, z: jz });
                  const worldInvI = computeWorldInvInertiaTensor(body.invInertiaTensor, bRot);
                  const angAcc = mat3TransformVector(worldInvI, torque);

                  body.angularVelocity.x += angAcc.x;
                  body.angularVelocity.y += angAcc.y;
                  body.angularVelocity.z += angAcc.z;
                }
              }
            }
          }
        }
      }
    }
  }
}
