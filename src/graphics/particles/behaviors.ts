/**
 * AF Motion Advanced Particle Engine — Behaviors
 *
 * Implements composable physical behaviors including gravity, attraction,
 * repulsion, drag, friction, turbulence noise, velocity limits, and boundary constraints.
 */

import {
  OFFSET_ACC_X,
  OFFSET_ACC_Y,
  OFFSET_ACC_Z,
  OFFSET_LIFE,
  OFFSET_MASS,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
  OFFSET_VEL_Z,
} from "./data-layout.js";
import type { ParticleBehavior, ParticleDataPool } from "./types.js";

/**
 * Applies all active behaviors to the particle pool in-place.
 */
export function applyParticleBehaviors(
  pool: ParticleDataPool,
  behaviors: readonly ParticleBehavior[],
  dt: number,
): void {
  if (dt <= 0 || behaviors.length === 0) return;

  const activeIndices = pool.getActiveIndices();
  const count = activeIndices.length;
  if (count === 0) return;

  const buf = pool.buffer;
  const stride = pool.stride;

  for (const b of behaviors) {
    switch (b.type) {
      case "gravity": {
        const [gx, gy, gz] = b.force || [0, -9.8, 0];
        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          buf[base + OFFSET_ACC_X]! += gx;
          buf[base + OFFSET_ACC_Y]! += gy;
          buf[base + OFFSET_ACC_Z]! += gz;
        }
        break;
      }

      case "directional-force": {
        const [fx, fy, fz] = b.force;
        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          const mass = buf[base + OFFSET_MASS]! || 1;
          buf[base + OFFSET_ACC_X]! += fx / mass;
          buf[base + OFFSET_ACC_Y]! += fy / mass;
          buf[base + OFFSET_ACC_Z]! += fz / mass;
        }
        break;
      }

      case "radial-force": {
        const [cx, cy, cz] = b.center;
        const strength = b.strength;
        const maxDist = b.radius || Infinity;

        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          const dx = buf[base + OFFSET_POS_X]! - cx;
          const dy = buf[base + OFFSET_POS_Y]! - cy;
          const dz = buf[base + OFFSET_POS_Z]! - cz;
          const dist = Math.hypot(dx, dy, dz);

          if (dist > 0 && dist < maxDist) {
            const factor = (strength / dist) * (1 - dist / maxDist);
            buf[base + OFFSET_ACC_X]! += dx * factor;
            buf[base + OFFSET_ACC_Y]! += dy * factor;
            buf[base + OFFSET_ACC_Z]! += dz * factor;
          }
        }
        break;
      }

      case "attraction": {
        const [tx, ty, tz] = b.target;
        const strength = b.strength;
        const maxDist = b.radius || Infinity;
        const isInverseSquare = b.falloff === "inverse-square";

        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          const dx = tx - buf[base + OFFSET_POS_X]!;
          const dy = ty - buf[base + OFFSET_POS_Y]!;
          const dz = tz - buf[base + OFFSET_POS_Z]!;
          const distSq = dx * dx + dy * dy + dz * dz;
          const dist = Math.sqrt(distSq);

          if (dist > 0.001 && dist < maxDist) {
            const mag = isInverseSquare ? strength / Math.max(1, distSq) : strength * (1 - dist / maxDist);
            buf[base + OFFSET_ACC_X]! += (dx / dist) * mag;
            buf[base + OFFSET_ACC_Y]! += (dy / dist) * mag;
            buf[base + OFFSET_ACC_Z]! += (dz / dist) * mag;
          }
        }
        break;
      }

      case "repulsion": {
        const [cx, cy, cz] = b.center;
        const strength = b.strength;
        const maxDist = b.radius || Infinity;

        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          const dx = buf[base + OFFSET_POS_X]! - cx;
          const dy = buf[base + OFFSET_POS_Y]! - cy;
          const dz = buf[base + OFFSET_POS_Z]! - cz;
          const distSq = dx * dx + dy * dy + dz * dz;
          const dist = Math.sqrt(distSq);

          if (dist > 0.001 && dist < maxDist) {
            const mag = (strength / dist) * (1 - dist / maxDist);
            buf[base + OFFSET_ACC_X]! += dx * mag;
            buf[base + OFFSET_ACC_Y]! += dy * mag;
            buf[base + OFFSET_ACC_Z]! += dz * mag;
          }
        }
        break;
      }

      case "drag": {
        const factor = Math.max(0, 1 - b.coefficient * dt);
        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          buf[base + OFFSET_VEL_X]! *= factor;
          buf[base + OFFSET_VEL_Y]! *= factor;
          buf[base + OFFSET_VEL_Z]! *= factor;
        }
        break;
      }

      case "friction": {
        const factor = Math.max(0, 1 - b.coefficient * dt);
        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          buf[base + OFFSET_VEL_X]! *= factor;
          buf[base + OFFSET_VEL_Y]! *= factor;
          buf[base + OFFSET_VEL_Z]! *= factor;
        }
        break;
      }

      case "turbulence": {
        const freq = b.frequency || 0.1;
        const strength = b.strength || 10;
        for (let i = 0; i < count; i++) {
          const base = activeIndices[i]! * stride;
          const px = buf[base + OFFSET_POS_X]!;
          const py = buf[base + OFFSET_POS_Y]!;
          const pz = buf[base + OFFSET_POS_Z]!;

          // Fast deterministic sinusoidal pseudo-curl noise
          const nx = Math.sin(py * freq) * Math.cos(pz * freq) * strength;
          const ny = Math.sin(pz * freq) * Math.cos(px * freq) * strength;
          const nz = Math.sin(px * freq) * Math.cos(py * freq) * strength;

          buf[base + OFFSET_ACC_X]! += nx;
          buf[base + OFFSET_ACC_Y]! += ny;
          buf[base + OFFSET_ACC_Z]! += nz;
        }
        break;
      }

      case "velocity-limits": {
        const minSpd = b.minSpeed;
        const maxSpd = b.maxSpeed;
        if (minSpd !== undefined || maxSpd !== undefined) {
          for (let i = 0; i < count; i++) {
            const base = activeIndices[i]! * stride;
            const vx = buf[base + OFFSET_VEL_X]!;
            const vy = buf[base + OFFSET_VEL_Y]!;
            const vz = buf[base + OFFSET_VEL_Z]!;
            const spd = Math.hypot(vx, vy, vz);

            if (spd > 0) {
              let newSpd = spd;
              if (maxSpd !== undefined && spd > maxSpd) newSpd = maxSpd;
              if (minSpd !== undefined && spd < minSpd) newSpd = minSpd;
              if (newSpd !== spd) {
                const ratio = newSpd / spd;
                buf[base + OFFSET_VEL_X] = vx * ratio;
                buf[base + OFFSET_VEL_Y] = vy * ratio;
                buf[base + OFFSET_VEL_Z] = vz * ratio;
              }
            }
          }
        }
        break;
      }

      case "boundary-constraints": {
        const [minX, maxX, minY, maxY, minZ, maxZ] = b.bounds;
        const action = b.action || "bounce";
        const restitution = b.restitution ?? 0.8;

        for (let i = 0; i < count; i++) {
          const slot = activeIndices[i]!;
          const base = slot * stride;
          let px = buf[base + OFFSET_POS_X]!;
          let py = buf[base + OFFSET_POS_Y]!;
          let pz = buf[base + OFFSET_POS_Z]!;
          let vx = buf[base + OFFSET_VEL_X]!;
          let vy = buf[base + OFFSET_VEL_Y]!;
          let vz = buf[base + OFFSET_VEL_Z]!;

          let outOfBounds = false;

          // X
          if (px < minX) {
            outOfBounds = true;
            if (action === "bounce") {
              px = minX;
              vx = -vx * restitution;
            } else if (action === "wrap") {
              px = maxX;
            }
          } else if (px > maxX) {
            outOfBounds = true;
            if (action === "bounce") {
              px = maxX;
              vx = -vx * restitution;
            } else if (action === "wrap") {
              px = minX;
            }
          }

          // Y
          if (py < minY) {
            outOfBounds = true;
            if (action === "bounce") {
              py = minY;
              vy = -vy * restitution;
            } else if (action === "wrap") {
              py = maxY;
            }
          } else if (py > maxY) {
            outOfBounds = true;
            if (action === "bounce") {
              py = maxY;
              vy = -vy * restitution;
            } else if (action === "wrap") {
              py = minY;
            }
          }

          // Z
          if (pz < minZ) {
            outOfBounds = true;
            if (action === "bounce") {
              pz = minZ;
              vz = -vz * restitution;
            } else if (action === "wrap") {
              pz = maxZ;
            }
          } else if (pz > maxZ) {
            outOfBounds = true;
            if (action === "bounce") {
              pz = maxZ;
              vz = -vz * restitution;
            } else if (action === "wrap") {
              pz = minZ;
            }
          }

          if (outOfBounds && action === "kill") {
            buf[base + OFFSET_LIFE] = 0;
            pool.kill(slot);
          } else {
            buf[base + OFFSET_POS_X] = px;
            buf[base + OFFSET_POS_Y] = py;
            buf[base + OFFSET_POS_Z] = pz;
            buf[base + OFFSET_VEL_X] = vx;
            buf[base + OFFSET_VEL_Y] = vy;
            buf[base + OFFSET_VEL_Z] = vz;
          }
        }
        break;
      }

      case "custom": {
        for (let i = 0; i < count; i++) {
          const slot = activeIndices[i]!;
          const accessor = pool.getAccessor(slot);
          b.execute(accessor, dt);
        }
        break;
      }
    }
  }
}
