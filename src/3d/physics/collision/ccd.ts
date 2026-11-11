/**
 * AF Motion — Continuous Collision Detection (CCD)
 *
 * Swept-volume and ray-based time-of-impact (TOI) estimation for high-velocity
 * rigid bodies, preventing tunneling through thin colliders and boundaries.
 */

import type {
  RigidBodyState,
  Transform3D,
  Collider3D,
  Vector3,
  RayHit3D,
} from "../types.js";
import {
  vec3,
  vec3Sub,
  vec3Scale,
  vec3Length,
  vec3SafeNormalize,
  vec3Add,
  localToWorldPoint,
} from "../math.js";
import type { SpatialQuery3D } from "../spatial/spatial-hash.js";

export interface CCDResult {
  hasCollision: boolean;
  timeOfImpact: number; // [0, 1] fraction of current timestep
  hitPoint?: Vector3;
  hitNormal?: Vector3;
  hitCollider?: Collider3D;
  hitBodyId?: string;
}

/**
 * Evaluates whether continuous collision detection should be evaluated for a body.
 * Activated if enableCCD is true or if displacement exceeds the body's conservative bounding radius.
 */
export function requiresCCD(
  body: RigidBodyState,
  displacement: Vector3,
  conservativeRadius: number = 0.5
): boolean {
  if (body.type !== "dynamic" || body.isSleeping) return false;

  // Custom user override
  const userData = body.userData as Record<string, unknown> | undefined;
  if (userData?.enableCCD === false) return false;
  if (userData?.enableCCD === true) return true;

  // Velocity displacement threshold
  const dispLen = vec3Length(displacement);
  return dispLen > conservativeRadius * 0.75;
}

/**
 * Performs continuous collision sweep for a dynamic rigid body between its
 * start transform and proposed end transform.
 */
export function sweepBodyCCD(
  body: RigidBodyState,
  startTransform: Transform3D,
  endTransform: Transform3D,
  spatialQuery: SpatialQuery3D,
  getBodyTransform: (bodyId?: string) => Transform3D
): CCDResult {
  const displacement = vec3Sub(endTransform.position, startTransform.position);
  const dispLen = vec3Length(displacement);

  if (dispLen < 1e-5) {
    return { hasCollision: false, timeOfImpact: 1.0 };
  }

  const dir = vec3Scale(displacement, 1 / dispLen);

  // Cast rays from each collider center along displacement direction
  let earliestTOI = 1.0;
  let bestHit: RayHit3D | null = null;
  let bestCollider: Collider3D | null = null;
  let bestBodyId: string | undefined;

  for (const col of body.colliders) {
    if (col.isTrigger) continue;

    // World start point of collider
    const localCenter = col.offset.position;
    const startPos = localToWorldPoint(startTransform, localCenter);

    const hitCandidates = spatialQuery.raycast(
      {
        origin: startPos,
        direction: dir,
        length: dispLen,
      },
      {
        excludeBodyIds: [body.id],
        includeTriggers: false,
      },
      getBodyTransform
    );

    for (const hit of hitCandidates) {
      if (!hit.hit || hit.distance > dispLen) continue;

      const toi = Math.max(0, Math.min(1, hit.distance / dispLen));
      if (toi < earliestTOI) {
        earliestTOI = toi;
        bestHit = hit;
        bestCollider = hit.collider ?? null;
        bestBodyId = hit.collider?.bodyId;
      }
    }
  }

  if (bestHit && earliestTOI < 1.0) {
    return {
      hasCollision: true,
      timeOfImpact: earliestTOI,
      hitPoint: bestHit.point,
      hitNormal: bestHit.normal,
      hitCollider: bestCollider ?? undefined,
      hitBodyId: bestBodyId,
    };
  }

  return {
    hasCollision: false,
    timeOfImpact: 1.0,
  };
}
