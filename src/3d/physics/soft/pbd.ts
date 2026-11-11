/**
 * AF Motion — 3D Position-Based Dynamics (PBD & XPBD) Engine
 *
 * Implements numerical prediction, iterative non-linear constraint projection,
 * XPBD compliance, volume preservation, shape matching, and velocity reconstruction.
 */

import type { Vector3, AABB3D, RigidBodyState, Transform3D } from "../types.js";
import type { SoftBodyState } from "../types.js";
import type {
  PBDConstraint,
  PBDDistanceConstraint,
  PBDVolumeConstraint,
  PBDShapeMatchingConstraint,
  PBDAttachmentConstraint,
} from "./types.js";
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
  EPSILON,
} from "../math.js";

/**
 * Calculates the current closed mesh volume using the divergence theorem.
 */
export function computeMeshVolume(
  positions: Float32Array,
  indices: Uint32Array | Uint16Array | number[]
): number {
  let volume = 0;
  const numTris = indices.length / 3;

  for (let t = 0; t < numTris; t++) {
    const i0 = indices[t * 3] * 3;
    const i1 = indices[t * 3 + 1] * 3;
    const i2 = indices[t * 3 + 2] * 3;

    const x0 = positions[i0], y0 = positions[i0 + 1], z0 = positions[i0 + 2];
    const x1 = positions[i1], y1 = positions[i1 + 1], z1 = positions[i1 + 2];
    const x2 = positions[i2], y2 = positions[i2 + 1], z2 = positions[i2 + 2];

    // Scalar triple product: (p0 x p1) . p2
    const cx = y0 * z1 - z0 * y1;
    const cy = z0 * x1 - x0 * z1;
    const cz = x0 * y1 - y0 * x1;

    volume += (cx * x2 + cy * y2 + cz * z2);
  }

  return Math.abs(volume) / 6.0;
}

/**
 * Computes an updated Axis-Aligned Bounding Box (AABB) for a soft body.
 */
export function computeSoftBodyAABB(positions: Float32Array, margin: number = 0.05): AABB3D {
  const count = positions.length / 3;
  if (count === 0) {
    return { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
  }

  let minX = positions[0], minY = positions[1], minZ = positions[2];
  let maxX = positions[0], maxY = positions[1], maxZ = positions[2];

  for (let i = 1; i < count; i++) {
    const idx = i * 3;
    const x = positions[idx];
    const y = positions[idx + 1];
    const z = positions[idx + 2];

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  return {
    min: { x: minX - margin, y: minY - margin, z: minZ - margin },
    max: { x: maxX + margin, y: maxY + margin, z: maxZ + margin },
  };
}

/**
 * Solves one full Position-Based Dynamics time step for a soft body.
 */
export function stepPBD(
  softBody: SoftBodyState,
  dt: number,
  gravity: Vector3,
  iterations: number = 5,
  bodies?: ReadonlyMap<string, RigidBodyState>,
  windVector?: Vector3,
  onTear?: (softBodyId: string, pA: number, pB: number, strain: number) => void
): void {
  const n = softBody.particleCount;
  if (n === 0 || dt <= 0) return;

  const pos = softBody.positions;
  const vel = softBody.velocities;
  const invM = softBody.invMasses;
  const damping = Math.max(0, Math.min(1, softBody.damping));
  const dampFactor = Math.max(0, 1 - damping * dt);

  // Initialize predicted positions buffer if missing
  if (!softBody.predictedPositions || softBody.predictedPositions.length !== pos.length) {
    softBody.predictedPositions = new Float32Array(pos.length);
  }
  const pred = softBody.predictedPositions;
  const pinned = softBody.pinnedIndices ?? new Set<number>();
  const extForces = softBody.externalForces;

  // 1. External forces & position prediction
  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    const w = invM[i];

    if (w <= EPSILON || pinned.has(i)) {
      pred[idx] = pos[idx];
      pred[idx + 1] = pos[idx + 1];
      pred[idx + 2] = pos[idx + 2];
      vel[idx] = 0;
      vel[idx + 1] = 0;
      vel[idx + 2] = 0;
      continue;
    }

    let fx = gravity.x;
    let fy = gravity.y;
    let fz = gravity.z;

    if (extForces) {
      fx += extForces[idx] * w;
      fy += extForces[idx + 1] * w;
      fz += extForces[idx + 2] * w;
    }

    vel[idx] = vel[idx] * dampFactor + fx * dt;
    vel[idx + 1] = vel[idx + 1] * dampFactor + fy * dt;
    vel[idx + 2] = vel[idx + 2] * dampFactor + fz * dt;

    pred[idx] = pos[idx] + vel[idx] * dt;
    pred[idx + 1] = pos[idx + 1] + vel[idx + 1] * dt;
    pred[idx + 2] = pos[idx + 2] + vel[idx + 2] * dt;
  }

  // Clear accumulated external forces
  if (extForces) {
    extForces.fill(0);
  }

  // 2. Aerodynamic wind interaction on surface triangles
  if (softBody.windConfig?.enabled && windVector && softBody.indices && softBody.indices.length >= 3) {
    const indices = softBody.indices;
    const numTris = indices.length / 3;
    const dragCoeff = softBody.windConfig.dragCoefficient ?? 0.5;

    for (let t = 0; t < numTris; t++) {
      const a = indices[t * 3];
      const b = indices[t * 3 + 1];
      const c = indices[t * 3 + 2];

      const a3 = a * 3, b3 = b * 3, c3 = c * 3;

      // Triangle edge vectors
      const uX = pred[b3] - pred[a3];
      const uY = pred[b3 + 1] - pred[a3 + 1];
      const uZ = pred[b3 + 2] - pred[a3 + 2];

      const vX = pred[c3] - pred[a3];
      const vY = pred[c3 + 1] - pred[a3 + 1];
      const vZ = pred[c3 + 2] - pred[a3 + 2];

      // Normal = u x v
      const nX = uY * vZ - uZ * vY;
      const nY = uZ * vX - uX * vZ;
      const nZ = uX * vY - uY * vX;
      const normLen = Math.hypot(nX, nY, nZ);

      if (normLen < EPSILON) continue;

      const area = 0.5 * normLen;
      const invNorm = 1 / normLen;
      const normX = nX * invNorm;
      const normY = nY * invNorm;
      const normZ = nZ * invNorm;

      // Triangle average velocity
      const avgVx = (vel[a3] + vel[b3] + vel[c3]) / 3;
      const avgVy = (vel[a3 + 1] + vel[b3 + 1] + vel[c3 + 1]) / 3;
      const avgVz = (vel[a3 + 2] + vel[b3 + 2] + vel[c3 + 2]) / 3;

      // Relative wind velocity
      const relVx = windVector.x - avgVx;
      const relVy = windVector.y - avgVy;
      const relVz = windVector.z - avgVz;
      const relSpeed = Math.hypot(relVx, relVy, relVz);

      if (relSpeed < EPSILON) continue;

      const dot = relVx * normX + relVy * normY + relVz * normZ;
      const forceMag = 0.5 * dragCoeff * area * dot * relSpeed;

      const windForceX = normX * forceMag;
      const windForceY = normY * forceMag;
      const windForceZ = normZ * forceMag;

      const perVertexScalar = (1 / 3) * dt * dt;

      if (invM[a] > 0 && !pinned.has(a)) {
        pred[a3] += windForceX * invM[a] * perVertexScalar;
        pred[a3 + 1] += windForceY * invM[a] * perVertexScalar;
        pred[a3 + 2] += windForceZ * invM[a] * perVertexScalar;
      }
      if (invM[b] > 0 && !pinned.has(b)) {
        pred[b3] += windForceX * invM[b] * perVertexScalar;
        pred[b3 + 1] += windForceY * invM[b] * perVertexScalar;
        pred[b3 + 2] += windForceZ * invM[b] * perVertexScalar;
      }
      if (invM[c] > 0 && !pinned.has(c)) {
        pred[c3] += windForceX * invM[c] * perVertexScalar;
        pred[c3 + 1] += windForceY * invM[c] * perVertexScalar;
        pred[c3 + 2] += windForceZ * invM[c] * perVertexScalar;
      }
    }
  }

  // 3. Iterative constraint projection
  const constraints = softBody.constraints ?? [];
  const dtSq = dt * dt;

  // Reset XPBD multipliers at start of step
  for (const c of constraints) {
    if ("multiplier" in c) c.multiplier = 0;
  }

  for (let iter = 0; iter < iterations; iter++) {
    for (const c of constraints) {
      switch (c.type) {
        case "distance":
        case "structural":
        case "shear":
        case "bending": {
          const dc = c as PBDDistanceConstraint;
          if (dc.torn) continue;

          const pA = dc.particleA;
          const pB = dc.particleB;
          const iA = pA * 3;
          const iB = pB * 3;

          const wA = invM[pA];
          const wB = invM[pB];
          const wSum = wA + wB;
          if (wSum <= EPSILON) continue;

          const dx = pred[iA] - pred[iB];
          const dy = pred[iA + 1] - pred[iB + 1];
          const dz = pred[iA + 2] - pred[iB + 2];
          const len = Math.hypot(dx, dy, dz);
          if (len < EPSILON) continue;

          // Check tensile tearing
          if (dc.tearable) {
            const strain = (len - dc.restLength) / Math.max(EPSILON, dc.restLength);
            const threshold = dc.tearStrainThreshold ?? softBody.tearStrainThreshold ?? 0.8;
            if (strain > threshold) {
              dc.torn = true;
              if (onTear) onTear(softBody.id, pA, pB, strain);
              continue;
            }
          }

          const constraintError = len - dc.restLength;
          if (Math.abs(constraintError) < EPSILON) continue;

          // XPBD Compliance alpha_tilde = alpha / dt^2
          const alphaTilde = (dc.compliance ?? 0) / dtSq;
          const lambda = dc.multiplier ?? 0;
          const deltaLambda = (-constraintError - alphaTilde * lambda) / (wSum + alphaTilde);
          dc.multiplier = lambda + deltaLambda;

          const stiffness = dc.stiffness ?? softBody.stiffness ?? 1.0;
          const corrMag = deltaLambda * stiffness;
          const invLen = 1 / len;
          const nx = dx * invLen;
          const ny = dy * invLen;
          const nz = dz * invLen;

          if (wA > 0 && !pinned.has(pA)) {
            pred[iA] += nx * wA * corrMag;
            pred[iA + 1] += ny * wA * corrMag;
            pred[iA + 2] += nz * wA * corrMag;
          }
          if (wB > 0 && !pinned.has(pB)) {
            pred[iB] -= nx * wB * corrMag;
            pred[iB + 1] -= ny * wB * corrMag;
            pred[iB + 2] -= nz * wB * corrMag;
          }
          break;
        }

        case "volume": {
          const vc = c as PBDVolumeConstraint;
          const indices = vc.triangleIndices;
          const currentVol = computeMeshVolume(pred, indices);
          const cVol = currentVol - vc.restVolume;
          if (Math.abs(cVol) < EPSILON) continue;

          const numTris = indices.length / 3;
          let sumGradSq = 0;
          const grads = new Float32Array(n * 3);

          for (let t = 0; t < numTris; t++) {
            const t0 = indices[t * 3] * 3;
            const t1 = indices[t * 3 + 1] * 3;
            const t2 = indices[t * 3 + 2] * 3;

            // Gradient for t0 is (p1 x p2) / 6
            const gx0 = (pred[t1 + 1] * pred[t2 + 2] - pred[t1 + 2] * pred[t2 + 1]) / 6;
            const gy0 = (pred[t1 + 2] * pred[t2] - pred[t1] * pred[t2 + 2]) / 6;
            const gz0 = (pred[t1] * pred[t2 + 1] - pred[t1 + 1] * pred[t2]) / 6;

            grads[t0] += gx0;
            grads[t0 + 1] += gy0;
            grads[t0 + 2] += gz0;

            // Gradient for t1 is (p2 x p0) / 6
            const gx1 = (pred[t2 + 1] * pred[t0 + 2] - pred[t2 + 2] * pred[t0 + 1]) / 6;
            const gy1 = (pred[t2 + 2] * pred[t0] - pred[t2] * pred[t0 + 2]) / 6;
            const gz1 = (pred[t2] * pred[t0 + 1] - pred[t2 + 1] * pred[t0]) / 6;

            grads[t1] += gx1;
            grads[t1 + 1] += gy1;
            grads[t1 + 2] += gz1;

            // Gradient for t2 is (p0 x p1) / 6
            const gx2 = (pred[t0 + 1] * pred[t1 + 2] - pred[t0 + 2] * pred[t1 + 1]) / 6;
            const gy2 = (pred[t0 + 2] * pred[t1] - pred[t0] * pred[t1 + 2]) / 6;
            const gz2 = (pred[t0] * pred[t1 + 1] - pred[t0 + 1] * pred[t1]) / 6;

            grads[t2] += gx2;
            grads[t2 + 1] += gy2;
            grads[t2 + 2] += gz2;
          }

          for (let p = 0; p < n; p++) {
            if (invM[p] <= EPSILON || pinned.has(p)) continue;
            const p3 = p * 3;
            const gSq = grads[p3] * grads[p3] + grads[p3 + 1] * grads[p3 + 1] + grads[p3 + 2] * grads[p3 + 2];
            sumGradSq += invM[p] * gSq;
          }

          if (sumGradSq < EPSILON) continue;

          const alphaTilde = (vc.compliance ?? 0) / dtSq;
          const lambda = vc.multiplier ?? 0;
          const deltaLambda = (-cVol - alphaTilde * lambda) / (sumGradSq + alphaTilde);
          vc.multiplier = lambda + deltaLambda;

          const volStiffness = vc.stiffness ?? softBody.volumeStiffness ?? 0.8;
          const corr = deltaLambda * volStiffness;

          for (let p = 0; p < n; p++) {
            if (invM[p] <= EPSILON || pinned.has(p)) continue;
            const p3 = p * 3;
            pred[p3] += invM[p] * grads[p3] * corr;
            pred[p3 + 1] += invM[p] * grads[p3 + 1] * corr;
            pred[p3 + 2] += invM[p] * grads[p3 + 2] * corr;
          }
          break;
        }

        case "shape-matching": {
          const sc = c as PBDShapeMatchingConstraint;
          const indices = sc.particleIndices;
          const count = indices.length;
          if (count === 0) continue;

          // Compute current center of mass
          let cmX = 0, cmY = 0, cmZ = 0, totalM = 0;
          for (let k = 0; k < count; k++) {
            const p = indices[k];
            const m = invM[p] > EPSILON ? 1 / invM[p] : 1.0;
            totalM += m;
            cmX += pred[p * 3] * m;
            cmY += pred[p * 3 + 1] * m;
            cmZ += pred[p * 3 + 2] * m;
          }
          if (totalM < EPSILON) continue;
          cmX /= totalM;
          cmY /= totalM;
          cmZ /= totalM;

          // Shape matching stiffness projection towards rest shape offsets
          const stiffness = sc.stiffness;
          for (let k = 0; k < count; k++) {
            const p = indices[k];
            if (invM[p] <= EPSILON || pinned.has(p)) continue;
            const p3 = p * 3;
            const o3 = k * 3;

            const goalX = cmX + sc.restOffsets[o3];
            const goalY = cmY + sc.restOffsets[o3 + 1];
            const goalZ = cmZ + sc.restOffsets[o3 + 2];

            pred[p3] += (goalX - pred[p3]) * stiffness;
            pred[p3 + 1] += (goalY - pred[p3 + 1]) * stiffness;
            pred[p3 + 2] += (goalZ - pred[p3 + 2]) * stiffness;
          }
          break;
        }

        case "attachment": {
          const ac = c as PBDAttachmentConstraint;
          const p = ac.particleIndex;
          const p3 = p * 3;

          let targetWorld: Vector3;
          let targetBody: RigidBodyState | undefined;

          if (ac.targetBodyId && bodies) {
            targetBody = bodies.get(ac.targetBodyId);
            if (targetBody) {
              targetWorld = localToWorldPoint(targetBody.transform, ac.localPivot);
            } else {
              targetWorld = ac.localPivot;
            }
          } else {
            targetWorld = ac.localPivot;
          }

          const dx = targetWorld.x - pred[p3];
          const dy = targetWorld.y - pred[p3 + 1];
          const dz = targetWorld.z - pred[p3 + 2];
          const attachStiff = ac.stiffness ?? 1.0;

          if (invM[p] > 0 && !pinned.has(p)) {
            pred[p3] += dx * attachStiff;
            pred[p3 + 1] += dy * attachStiff;
            pred[p3 + 2] += dz * attachStiff;
          }

          // Dynamic body reaction impulse transfer
          if (targetBody && targetBody.type === "dynamic") {
            const particleMass = invM[p] > EPSILON ? 1 / invM[p] : 1.0;
            const reactionImpulseX = -(dx / dt) * particleMass * attachStiff * 0.5;
            const reactionImpulseY = -(dy / dt) * particleMass * attachStiff * 0.5;
            const reactionImpulseZ = -(dz / dt) * particleMass * attachStiff * 0.5;

            targetBody.linearVelocity.x += reactionImpulseX * targetBody.invMass;
            targetBody.linearVelocity.y += reactionImpulseY * targetBody.invMass;
            targetBody.linearVelocity.z += reactionImpulseZ * targetBody.invMass;
          }
          break;
        }

        case "pin": {
          const pc = c as { type: "pin"; particleIndex: number; position: Vector3 };
          const p = pc.particleIndex;
          const p3 = p * 3;
          pred[p3] = pc.position.x;
          pred[p3 + 1] = pc.position.y;
          pred[p3 + 2] = pc.position.z;
          break;
        }
      }
    }
  }

  // 4. Velocity reconstruction & final position update
  const invDt = 1 / dt;
  for (let i = 0; i < n; i++) {
    const idx = i * 3;
    if (invM[i] <= EPSILON || pinned.has(i)) {
      pos[idx] = pred[idx];
      pos[idx + 1] = pred[idx + 1];
      pos[idx + 2] = pred[idx + 2];
      vel[idx] = 0;
      vel[idx + 1] = 0;
      vel[idx + 2] = 0;
    } else {
      vel[idx] = (pred[idx] - pos[idx]) * invDt;
      vel[idx + 1] = (pred[idx + 1] - pos[idx + 1]) * invDt;
      vel[idx + 2] = (pred[idx + 2] - pos[idx + 2]) * invDt;

      pos[idx] = pred[idx];
      pos[idx + 1] = pred[idx + 1];
      pos[idx + 2] = pred[idx + 2];
    }
  }

  // 5. Update cached AABB
  softBody.aabb = computeSoftBodyAABB(pos);
}
