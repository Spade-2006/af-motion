/**
 * AF Motion — 3D Narrowphase Collision & Raycasting
 *
 * Geometric intersection tests between 3D primitive colliders, contact manifold
 * generation, and accurate 3D raycasting against shapes.
 */

import type {
  Collider3D,
  CollisionManifold3D,
  ContactPoint3D,
  Transform3D,
  Ray3D,
  RayHit3D,
  Vector3,
  SphereColliderShape,
  BoxColliderShape,
  PlaneColliderShape,
  CapsuleColliderShape,
  HeightfieldColliderShape,
  RigidBodyState,
} from "../types.js";
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
  worldToLocalPoint,
  quatRotateVector,
  composeTransform3D,
  EPSILON,
  clamp,
} from "../math.js";

// ============================================================================
// Narrowphase Intersection & Manifolds
// ============================================================================

/**
 * Generates a collision manifold between two colliders if an intersection exists.
 */
export function generateCollisionManifold(
  bodyA: RigidBodyState | undefined,
  bodyB: RigidBodyState | undefined,
  colliderA: Collider3D,
  colliderB: Collider3D,
  bodyTransformA: Transform3D,
  bodyTransformB: Transform3D
): CollisionManifold3D | null {
  const worldTransformA = composeTransform3D(bodyTransformA, colliderA.offset);
  const worldTransformB = composeTransform3D(bodyTransformB, colliderB.offset);

  const shapeA = colliderA.shape;
  const shapeB = colliderB.shape;

  let manifold: CollisionManifold3D | null = null;

  // Dispatch based on shape pair
  if (shapeA.type === "sphere" && shapeB.type === "sphere") {
    manifold = testSphereSphere(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? ""
    );
  } else if (shapeA.type === "sphere" && shapeB.type === "plane") {
    manifold = testSpherePlane(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "plane" && shapeB.type === "sphere") {
    manifold = testSpherePlane(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  } else if (shapeA.type === "sphere" && shapeB.type === "box") {
    manifold = testSphereBox(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "box" && shapeB.type === "sphere") {
    manifold = testSphereBox(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  } else if (shapeA.type === "box" && shapeB.type === "plane") {
    manifold = testBoxPlane(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "plane" && shapeB.type === "box") {
    manifold = testBoxPlane(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  } else if (shapeA.type === "box" && shapeB.type === "box") {
    manifold = testBoxBox(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? ""
    );
  } else if (shapeA.type === "capsule" && shapeB.type === "plane") {
    manifold = testCapsulePlane(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "plane" && shapeB.type === "capsule") {
    manifold = testCapsulePlane(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  } else if (shapeA.type === "sphere" && shapeB.type === "capsule") {
    manifold = testSphereCapsule(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "capsule" && shapeB.type === "sphere") {
    manifold = testSphereCapsule(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  } else if (shapeA.type === "sphere" && shapeB.type === "heightfield") {
    manifold = testSphereHeightfield(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "heightfield" && shapeB.type === "sphere") {
    manifold = testSphereHeightfield(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  } else if (shapeA.type === "box" && shapeB.type === "heightfield") {
    manifold = testBoxHeightfield(
      shapeA,
      shapeB,
      worldTransformA,
      worldTransformB,
      colliderA.id,
      colliderB.id,
      bodyA?.id ?? "",
      bodyB?.id ?? "",
      false
    );
  } else if (shapeA.type === "heightfield" && shapeB.type === "box") {
    manifold = testBoxHeightfield(
      shapeB,
      shapeA,
      worldTransformB,
      worldTransformA,
      colliderB.id,
      colliderA.id,
      bodyB?.id ?? "",
      bodyA?.id ?? "",
      true
    );
  }

  if (manifold) {
    manifold.isTrigger = colliderA.isTrigger || colliderB.isTrigger;
  }

  return manifold;
}

// ----------------------------------------------------------------------------
// Sphere vs Sphere
// ----------------------------------------------------------------------------
function testSphereSphere(
  sA: SphereColliderShape,
  sB: SphereColliderShape,
  tA: Transform3D,
  tB: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string
): CollisionManifold3D | null {
  const rA = sA.radius * Math.max(Math.abs(tA.scale.x), Math.abs(tA.scale.y), Math.abs(tA.scale.z));
  const rB = sB.radius * Math.max(Math.abs(tB.scale.x), Math.abs(tB.scale.y), Math.abs(tB.scale.z));

  const diff = vec3Sub(tB.position, tA.position);
  const distSq = vec3LengthSq(diff);
  const radiusSum = rA + rB;

  if (distSq >= radiusSum * radiusSum) return null;

  const dist = Math.sqrt(distSq);
  const normal = dist > EPSILON ? vec3Scale(diff, 1 / dist) : { x: 0, y: 1, z: 0 };
  const penetration = radiusSum - dist;

  const contactPos = vec3Add(tA.position, vec3Scale(normal, rA - penetration * 0.5));
  const localA = worldToLocalPoint(tA, contactPos);
  const localB = worldToLocalPoint(tB, contactPos);

  const contact: ContactPoint3D = {
    position: contactPos,
    localPositionA: localA,
    localPositionB: localB,
    normal,
    penetration,
  };

  return {
    bodyAId,
    bodyBId,
    colliderAId: colAId,
    colliderBId: colBId,
    contacts: [contact],
    isTrigger: false,
    normal,
    penetration,
  };
}

// ----------------------------------------------------------------------------
// Sphere vs Plane
// ----------------------------------------------------------------------------
function testSpherePlane(
  sphere: SphereColliderShape,
  plane: PlaneColliderShape,
  tSphere: Transform3D,
  tPlane: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  flip: boolean
): CollisionManifold3D | null {
  const r = sphere.radius * Math.max(Math.abs(tSphere.scale.x), Math.abs(tSphere.scale.y), Math.abs(tSphere.scale.z));

  // Plane normal in world coordinates
  const worldPlaneNormal = quatRotateVector(tPlane.rotation, plane.normal);
  // Plane equation: dot(worldPlaneNormal, p - tPlane.position) = plane.constant
  const relCenter = vec3Sub(tSphere.position, tPlane.position);
  const distToPlane = vec3Dot(relCenter, worldPlaneNormal) - plane.constant;

  if (distToPlane >= r) return null;

  const penetration = r - distToPlane;
  const normal = flip ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1);
  const contactPos = vec3Sub(tSphere.position, vec3Scale(worldPlaneNormal, r - penetration * 0.5));

  const contact: ContactPoint3D = {
    position: contactPos,
    localPositionA: flip ? worldToLocalPoint(tPlane, contactPos) : worldToLocalPoint(tSphere, contactPos),
    localPositionB: flip ? worldToLocalPoint(tSphere, contactPos) : worldToLocalPoint(tPlane, contactPos),
    normal,
    penetration,
  };

  return {
    bodyAId: flip ? bodyBId : bodyAId,
    bodyBId: flip ? bodyAId : bodyBId,
    colliderAId: flip ? colBId : colAId,
    colliderBId: flip ? colAId : colBId,
    contacts: [contact],
    isTrigger: false,
    normal,
    penetration,
  };
}

// ----------------------------------------------------------------------------
// Sphere vs Box
// ----------------------------------------------------------------------------
function testSphereBox(
  sphere: SphereColliderShape,
  box: BoxColliderShape,
  tSphere: Transform3D,
  tBox: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  flip: boolean
): CollisionManifold3D | null {
  const r = sphere.radius * Math.max(Math.abs(tSphere.scale.x), Math.abs(tSphere.scale.y), Math.abs(tSphere.scale.z));
  const hx = box.halfExtents.x * Math.abs(tBox.scale.x);
  const hy = box.halfExtents.y * Math.abs(tBox.scale.y);
  const hz = box.halfExtents.z * Math.abs(tBox.scale.z);

  // Transform sphere center into box local space
  const sphereLocal = worldToLocalPoint(tBox, tSphere.position);

  // Closest point on box
  const closestLocal: Vector3 = {
    x: clamp(sphereLocal.x, -hx, hx),
    y: clamp(sphereLocal.y, -hy, hy),
    z: clamp(sphereLocal.z, -hz, hz),
  };

  const diffLocal = vec3Sub(sphereLocal, closestLocal);
  const distSq = vec3LengthSq(diffLocal);

  // Inside box check
  const isInside = distSq < EPSILON;
  let penetration: number;
  let normalLocal: Vector3;

  if (isInside) {
    // Find closest face to escape
    const dx = hx - Math.abs(sphereLocal.x);
    const dy = hy - Math.abs(sphereLocal.y);
    const dz = hz - Math.abs(sphereLocal.z);

    if (dx < dy && dx < dz) {
      penetration = r + dx;
      normalLocal = { x: sphereLocal.x >= 0 ? 1 : -1, y: 0, z: 0 };
    } else if (dy < dz) {
      penetration = r + dy;
      normalLocal = { x: 0, y: sphereLocal.y >= 0 ? 1 : -1, z: 0 };
    } else {
      penetration = r + dz;
      normalLocal = { x: 0, y: 0, z: sphereLocal.z >= 0 ? 1 : -1 };
    }
  } else {
    const dist = Math.sqrt(distSq);
    if (dist >= r) return null;
    penetration = r - dist;
    normalLocal = vec3Scale(diffLocal, 1 / dist);
  }

  const normalWorld = quatRotateVector(tBox.rotation, normalLocal);
  const normal = flip ? normalWorld : vec3Scale(normalWorld, -1);
  const closestWorld = localToWorldPoint(tBox, closestLocal);

  const contact: ContactPoint3D = {
    position: closestWorld,
    localPositionA: flip ? closestLocal : worldToLocalPoint(tSphere, closestWorld),
    localPositionB: flip ? worldToLocalPoint(tSphere, closestWorld) : closestLocal,
    normal,
    penetration,
  };

  return {
    bodyAId: flip ? bodyBId : bodyAId,
    bodyBId: flip ? bodyAId : bodyBId,
    colliderAId: flip ? colBId : colAId,
    colliderBId: flip ? colAId : colBId,
    contacts: [contact],
    isTrigger: false,
    normal,
    penetration,
  };
}

// ----------------------------------------------------------------------------
// Box vs Plane
// ----------------------------------------------------------------------------
function testBoxPlane(
  box: BoxColliderShape,
  plane: PlaneColliderShape,
  tBox: Transform3D,
  tPlane: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  flip: boolean
): CollisionManifold3D | null {
  const hx = box.halfExtents.x * Math.abs(tBox.scale.x);
  const hy = box.halfExtents.y * Math.abs(tBox.scale.y);
  const hz = box.halfExtents.z * Math.abs(tBox.scale.z);

  const worldPlaneNormal = quatRotateVector(tPlane.rotation, plane.normal);

  // 8 box corners
  const corners: Vector3[] = [
    { x: -hx, y: -hy, z: -hz },
    { x: -hx, y: -hy, z: hz },
    { x: -hx, y: hy, z: -hz },
    { x: -hx, y: hy, z: hz },
    { x: hx, y: -hy, z: -hz },
    { x: hx, y: -hy, z: hz },
    { x: hx, y: hy, z: -hz },
    { x: hx, y: hy, z: hz },
  ];

  const contacts: ContactPoint3D[] = [];
  let maxPenetration = 0;

  for (const corner of corners) {
    const worldPoint = localToWorldPoint(tBox, corner);
    const rel = vec3Sub(worldPoint, tPlane.position);
    const distToPlane = vec3Dot(rel, worldPlaneNormal) - plane.constant;

    if (distToPlane < 0.02) {
      const penetration = Math.max(1e-4, -distToPlane);
      if (penetration > maxPenetration) maxPenetration = penetration;

      const normal = flip ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1);
      contacts.push({
        position: worldPoint,
        localPositionA: flip ? worldToLocalPoint(tPlane, worldPoint) : corner,
        localPositionB: flip ? corner : worldToLocalPoint(tPlane, worldPoint),
        normal,
        penetration,
      });
    }
  }

  if (contacts.length === 0) return null;

  return {
    bodyAId: flip ? bodyBId : bodyAId,
    bodyBId: flip ? bodyAId : bodyBId,
    colliderAId: flip ? colBId : colAId,
    colliderBId: flip ? colAId : colBId,
    contacts,
    isTrigger: false,
    normal: flip ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1),
    penetration: maxPenetration,
  };
}

// ----------------------------------------------------------------------------
// Box vs Box
// ----------------------------------------------------------------------------
function testBoxBox(
  boxA: BoxColliderShape,
  boxB: BoxColliderShape,
  tA: Transform3D,
  tB: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string
): CollisionManifold3D | null {
  const hA = {
    x: boxA.halfExtents.x * Math.abs(tA.scale.x),
    y: boxA.halfExtents.y * Math.abs(tA.scale.y),
    z: boxA.halfExtents.z * Math.abs(tA.scale.z),
  };
  const hB = {
    x: boxB.halfExtents.x * Math.abs(tB.scale.x),
    y: boxB.halfExtents.y * Math.abs(tB.scale.y),
    z: boxB.halfExtents.z * Math.abs(tB.scale.z),
  };

  // AABB approximation for aligned or axis-dominant orientations
  const delta = vec3Sub(tB.position, tA.position);
  const overlapX = (hA.x + hB.x) - Math.abs(delta.x);
  const overlapY = (hA.y + hB.y) - Math.abs(delta.y);
  const overlapZ = (hA.z + hB.z) - Math.abs(delta.z);

  if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return null;

  // Smallest overlap is the contact axis
  let normal: Vector3;
  let penetration: number;

  if (overlapX < overlapY && overlapX < overlapZ) {
    penetration = overlapX;
    normal = { x: delta.x >= 0 ? 1 : -1, y: 0, z: 0 };
  } else if (overlapY < overlapZ) {
    penetration = overlapY;
    normal = { x: 0, y: delta.y >= 0 ? 1 : -1, z: 0 };
  } else {
    penetration = overlapZ;
    normal = { x: 0, y: 0, z: delta.z >= 0 ? 1 : -1 };
  }

  const contactPos = vec3Add(tA.position, vec3Scale(delta, 0.5));
  const contact: ContactPoint3D = {
    position: contactPos,
    localPositionA: worldToLocalPoint(tA, contactPos),
    localPositionB: worldToLocalPoint(tB, contactPos),
    normal,
    penetration,
  };

  return {
    bodyAId,
    bodyBId,
    colliderAId: colAId,
    colliderBId: colBId,
    contacts: [contact],
    isTrigger: false,
    normal,
    penetration,
  };
}

// ----------------------------------------------------------------------------
// Capsule vs Plane
// ----------------------------------------------------------------------------
function testCapsulePlane(
  capsule: CapsuleColliderShape,
  plane: PlaneColliderShape,
  tCap: Transform3D,
  tPlane: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  flip: boolean
): CollisionManifold3D | null {
  const r = capsule.radius * Math.max(Math.abs(tCap.scale.x), Math.abs(tCap.scale.y), Math.abs(tCap.scale.z));
  const halfH = capsule.height * 0.5;
  const axis = capsule.axis ?? "y";

  let p1Local: Vector3 = { x: 0, y: 0, z: 0 };
  let p2Local: Vector3 = { x: 0, y: 0, z: 0 };

  if (axis === "x") {
    p1Local = { x: -halfH, y: 0, z: 0 };
    p2Local = { x: halfH, y: 0, z: 0 };
  } else if (axis === "z") {
    p1Local = { x: 0, y: 0, z: -halfH };
    p2Local = { x: 0, y: 0, z: halfH };
  } else {
    p1Local = { x: 0, y: -halfH, z: 0 };
    p2Local = { x: 0, y: halfH, z: 0 };
  }

  const p1 = localToWorldPoint(tCap, p1Local);
  const p2 = localToWorldPoint(tCap, p2Local);

  const worldPlaneNormal = quatRotateVector(tPlane.rotation, plane.normal);
  const d1 = vec3Dot(vec3Sub(p1, tPlane.position), worldPlaneNormal) - plane.constant;
  const d2 = vec3Dot(vec3Sub(p2, tPlane.position), worldPlaneNormal) - plane.constant;

  const contacts: ContactPoint3D[] = [];
  let maxPen = 0;

  if (d1 < r) {
    const pen = r - d1;
    if (pen > maxPen) maxPen = pen;
    const pt = vec3Sub(p1, vec3Scale(worldPlaneNormal, r));
    contacts.push({
      position: pt,
      localPositionA: flip ? worldToLocalPoint(tPlane, pt) : worldToLocalPoint(tCap, pt),
      localPositionB: flip ? worldToLocalPoint(tCap, pt) : worldToLocalPoint(tPlane, pt),
      normal: flip ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1),
      penetration: pen,
    });
  }

  if (d2 < r) {
    const pen = r - d2;
    if (pen > maxPen) maxPen = pen;
    const pt = vec3Sub(p2, vec3Scale(worldPlaneNormal, r));
    contacts.push({
      position: pt,
      localPositionA: flip ? worldToLocalPoint(tPlane, pt) : worldToLocalPoint(tCap, pt),
      localPositionB: flip ? worldToLocalPoint(tCap, pt) : worldToLocalPoint(tPlane, pt),
      normal: flip ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1),
      penetration: pen,
    });
  }

  if (contacts.length === 0) return null;

  return {
    bodyAId: flip ? bodyBId : bodyAId,
    bodyBId: flip ? bodyAId : bodyBId,
    colliderAId: flip ? colBId : colAId,
    colliderBId: flip ? colAId : colBId,
    contacts,
    isTrigger: false,
    normal: flip ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1),
    penetration: maxPen,
  };
}

// ----------------------------------------------------------------------------
// Sphere vs Capsule
// ----------------------------------------------------------------------------
function testSphereCapsule(
  sphere: SphereColliderShape,
  capsule: CapsuleColliderShape,
  tSphere: Transform3D,
  tCap: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  flip: boolean
): CollisionManifold3D | null {
  const rS = sphere.radius * Math.max(Math.abs(tSphere.scale.x), Math.abs(tSphere.scale.y), Math.abs(tSphere.scale.z));
  const rC = capsule.radius * Math.max(Math.abs(tCap.scale.x), Math.abs(tCap.scale.y), Math.abs(tCap.scale.z));
  const halfH = capsule.height * 0.5;
  const axis = capsule.axis ?? "y";

  let p1Local: Vector3 = { x: 0, y: 0, z: 0 };
  let p2Local: Vector3 = { x: 0, y: 0, z: 0 };

  if (axis === "x") {
    p1Local = { x: -halfH, y: 0, z: 0 };
    p2Local = { x: halfH, y: 0, z: 0 };
  } else if (axis === "z") {
    p1Local = { x: 0, y: 0, z: -halfH };
    p2Local = { x: 0, y: 0, z: halfH };
  } else {
    p1Local = { x: 0, y: -halfH, z: 0 };
    p2Local = { x: 0, y: halfH, z: 0 };
  }

  const p1 = localToWorldPoint(tCap, p1Local);
  const p2 = localToWorldPoint(tCap, p2Local);

  // Closest point on line segment (p1, p2) to sphere center
  const seg = vec3Sub(p2, p1);
  const segLenSq = vec3LengthSq(seg);
  let t = 0;
  if (segLenSq > EPSILON) {
    t = clamp(vec3Dot(vec3Sub(tSphere.position, p1), seg) / segLenSq, 0, 1);
  }
  const closestOnCap = vec3Add(p1, vec3Scale(seg, t));

  const diff = vec3Sub(closestOnCap, tSphere.position);
  const distSq = vec3LengthSq(diff);
  const radiusSum = rS + rC;

  if (distSq >= radiusSum * radiusSum) return null;

  const dist = Math.sqrt(distSq);
  const normal = dist > EPSILON ? vec3Scale(diff, 1 / dist) : { x: 0, y: 1, z: 0 };
  const penetration = radiusSum - dist;
  const effNormal = flip ? vec3Scale(normal, -1) : normal;
  const contactPos = vec3Add(tSphere.position, vec3Scale(normal, rS - penetration * 0.5));

  const contact: ContactPoint3D = {
    position: contactPos,
    localPositionA: flip ? worldToLocalPoint(tCap, contactPos) : worldToLocalPoint(tSphere, contactPos),
    localPositionB: flip ? worldToLocalPoint(tSphere, contactPos) : worldToLocalPoint(tCap, contactPos),
    normal: effNormal,
    penetration,
  };

  return {
    bodyAId: flip ? bodyBId : bodyAId,
    bodyBId: flip ? bodyAId : bodyBId,
    colliderAId: flip ? colBId : colAId,
    colliderBId: flip ? colAId : colBId,
    contacts: [contact],
    isTrigger: false,
    normal: effNormal,
    penetration,
  };
}

// ============================================================================
// Raycasting Against 3D Colliders
// ============================================================================

/**
 * Raycasts against a 3D collider at a given world transform.
 */
export function raycastCollider(
  ray: Ray3D,
  collider: Collider3D,
  bodyTransform: Transform3D
): RayHit3D | null {
  const worldTransform = composeTransform3D(bodyTransform, collider.offset);
  const maxLen = ray.length ?? Infinity;
  const dir = vec3SafeNormalize(ray.direction);

  switch (collider.shape.type) {
    case "sphere": {
      const r = collider.shape.radius * Math.max(
        Math.abs(worldTransform.scale.x),
        Math.abs(worldTransform.scale.y),
        Math.abs(worldTransform.scale.z)
      );
      const m = vec3Sub(ray.origin, worldTransform.position);
      const b = vec3Dot(m, dir);
      const c = vec3LengthSq(m) - r * r;

      if (c > 0 && b > 0) return null;

      const discr = b * b - c;
      if (discr < 0) return null;

      let t = -b - Math.sqrt(discr);
      if (t < 0) t = -b + Math.sqrt(discr);
      if (t < 0 || t > maxLen) return null;

      const hitPoint = vec3Add(ray.origin, vec3Scale(dir, t));
      const normal = vec3SafeNormalize(vec3Sub(hitPoint, worldTransform.position));

      return {
        hit: true,
        point: hitPoint,
        normal,
        distance: t,
        collider,
      };
    }

    case "plane": {
      const worldPlaneNormal = quatRotateVector(worldTransform.rotation, collider.shape.normal);
      const denom = vec3Dot(dir, worldPlaneNormal);

      if (Math.abs(denom) < EPSILON) return null; // Parallel

      const rel = vec3Sub(worldTransform.position, ray.origin);
      const t = (vec3Dot(rel, worldPlaneNormal) + collider.shape.constant) / denom;

      if (t < 0 || t > maxLen) return null;

      const hitPoint = vec3Add(ray.origin, vec3Scale(dir, t));
      const normal = denom < 0 ? worldPlaneNormal : vec3Scale(worldPlaneNormal, -1);

      return {
        hit: true,
        point: hitPoint,
        normal,
        distance: t,
        collider,
      };
    }

    case "box": {
      // Ray in box local space
      const localOrigin = worldToLocalPoint(worldTransform, ray.origin);
      const localDir = quatRotateVector(
        worldTransform.rotation,
        dir
      );
      const hx = collider.shape.halfExtents.x * Math.abs(worldTransform.scale.x);
      const hy = collider.shape.halfExtents.y * Math.abs(worldTransform.scale.y);
      const hz = collider.shape.halfExtents.z * Math.abs(worldTransform.scale.z);

      let tMin = 0;
      let tMax = maxLen;
      let hitAxis: "x" | "y" | "z" = "x";
      let hitSign = 1;

      // X
      if (Math.abs(localDir.x) < EPSILON) {
        if (localOrigin.x < -hx || localOrigin.x > hx) return null;
      } else {
        const invD = 1 / localDir.x;
        let t1 = (-hx - localOrigin.x) * invD;
        let t2 = (hx - localOrigin.x) * invD;
        let sign = -1;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = 1; }
        if (t1 > tMin) { tMin = t1; hitAxis = "x"; hitSign = sign; }
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }

      // Y
      if (Math.abs(localDir.y) < EPSILON) {
        if (localOrigin.y < -hy || localOrigin.y > hy) return null;
      } else {
        const invD = 1 / localDir.y;
        let t1 = (-hy - localOrigin.y) * invD;
        let t2 = (hy - localOrigin.y) * invD;
        let sign = -1;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = 1; }
        if (t1 > tMin) { tMin = t1; hitAxis = "y"; hitSign = sign; }
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }

      // Z
      if (Math.abs(localDir.z) < EPSILON) {
        if (localOrigin.z < -hz || localOrigin.z > hz) return null;
      } else {
        const invD = 1 / localDir.z;
        let t1 = (-hz - localOrigin.z) * invD;
        let t2 = (hz - localOrigin.z) * invD;
        let sign = -1;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sign = 1; }
        if (t1 > tMin) { tMin = t1; hitAxis = "z"; hitSign = sign; }
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) return null;
      }

      if (tMin < 0 || tMin > maxLen) return null;

      const hitPoint = vec3Add(ray.origin, vec3Scale(dir, tMin));
      const localNormal: Vector3 = {
        x: hitAxis === "x" ? hitSign : 0,
        y: hitAxis === "y" ? hitSign : 0,
        z: hitAxis === "z" ? hitSign : 0,
      };
      const normal = quatRotateVector(worldTransform.rotation, localNormal);

      return {
        hit: true,
        point: hitPoint,
        normal,
        distance: tMin,
        collider,
      };
    }

    case "heightfield": {
      const shape = collider.shape as HeightfieldColliderShape;
      const halfW = shape.width * 0.5;
      const halfL = shape.length * 0.5;
      const stepSize = Math.max(0.5, Math.min(shape.width / shape.cols, shape.length / shape.rows) * 0.5);

      const invQuat = {
        x: -worldTransform.rotation.x,
        y: -worldTransform.rotation.y,
        z: -worldTransform.rotation.z,
        w: worldTransform.rotation.w,
      };
      const localOrigin = worldToLocalPoint(worldTransform, ray.origin);
      const localDir = quatRotateVector(invQuat, dir);

      let prevT = 0;
      let prevDiff = localOrigin.y - sampleHeightfieldSurface(shape, localOrigin.x, localOrigin.z).height;

      for (let t = stepSize; t <= maxLen; t += stepSize) {
        const curX = localOrigin.x + t * localDir.x;
        const curY = localOrigin.y + t * localDir.y;
        const curZ = localOrigin.z + t * localDir.z;

        if (curX >= -halfW && curX <= halfW && curZ >= -halfL && curZ <= halfL) {
          const surf = sampleHeightfieldSurface(shape, curX, curZ);
          const curDiff = curY - surf.height;

          if (curDiff <= 0) {
            let low = prevT;
            let high = t;
            for (let iter = 0; iter < 8; iter++) {
              const mid = (low + high) * 0.5;
              const mx = localOrigin.x + mid * localDir.x;
              const my = localOrigin.y + mid * localDir.y;
              const mz = localOrigin.z + mid * localDir.z;
              const mh = sampleHeightfieldSurface(shape, mx, mz).height;
              if (my <= mh) high = mid;
              else low = mid;
            }
            const hitT = (low + high) * 0.5;
            const hitLocal = {
              x: localOrigin.x + hitT * localDir.x,
              y: localOrigin.y + hitT * localDir.y,
              z: localOrigin.z + hitT * localDir.z,
            };
            const surfHit = sampleHeightfieldSurface(shape, hitLocal.x, hitLocal.z);
            const normal = quatRotateVector(worldTransform.rotation, surfHit.normal);

            return {
              hit: true,
              point: localToWorldPoint(worldTransform, hitLocal),
              normal,
              distance: hitT,
              collider,
            };
          }

          prevDiff = curDiff;
        }
        prevT = t;
      }
      return null;
    }

    default: {
      // General AABB fallback for complex/convex shapes
      const aabb = collider.aabb;
      let tMin = 0;
      let tMax = maxLen;

      for (const axis of ["x", "y", "z"] as const) {
        if (Math.abs(dir[axis]) < EPSILON) {
          if (ray.origin[axis] < aabb.min[axis] || ray.origin[axis] > aabb.max[axis]) {
            return null;
          }
        } else {
          const invD = 1 / dir[axis];
          let t1 = (aabb.min[axis] - ray.origin[axis]) * invD;
          let t2 = (aabb.max[axis] - ray.origin[axis]) * invD;
          if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
          tMin = Math.max(tMin, t1);
          tMax = Math.min(tMax, t2);
          if (tMin > tMax) return null;
        }
      }

      if (tMin < 0 || tMin > maxLen) return null;

      return {
        hit: true,
        point: vec3Add(ray.origin, vec3Scale(dir, tMin)),
        normal: { x: 0, y: 1, z: 0 },
        distance: tMin,
        collider,
      };
    }
  }
}


// ============================================================================
// Heightfield Surface & Narrowphase Tests
// ============================================================================

function sampleHeightfieldSurface(
  hf: HeightfieldColliderShape,
  localX: number,
  localZ: number
): { height: number; normal: Vector3 } {
  const { width, length, cols, rows, heights } = hf;
  const halfW = width * 0.5;
  const halfL = length * 0.5;

  const u = ((localX + halfW) / width) * (cols - 1);
  const v = ((localZ + halfL) / length) * (rows - 1);

  const c0 = Math.max(0, Math.min(cols - 1, Math.floor(u)));
  const c1 = Math.min(cols - 1, c0 + 1);
  const r0 = Math.max(0, Math.min(rows - 1, Math.floor(v)));
  const r1 = Math.min(rows - 1, r0 + 1);

  const fx = u - c0;
  const fz = v - r0;

  const h00 = heights[r0 * cols + c0];
  const h10 = heights[r0 * cols + c1];
  const h01 = heights[r1 * cols + c0];
  const h11 = heights[r1 * cols + c1];

  const hTop = h00 * (1 - fx) + h10 * fx;
  const hBottom = h01 * (1 - fx) + h11 * fx;
  const height = hTop * (1 - fz) + hBottom * fz;

  const stepX = width / Math.max(1, cols - 1);
  const stepZ = length / Math.max(1, rows - 1);

  const leftH = c0 > 0 ? heights[r0 * cols + (c0 - 1)] : h00;
  const rightH = c1 < cols - 1 ? heights[r0 * cols + (c1 + 1)] : h10;
  const topH = r0 > 0 ? heights[(r0 - 1) * cols + c0] : h00;
  const bottomH = r1 < rows - 1 ? heights[(r1 + 1) * cols + c0] : h01;

  const nx = (leftH - rightH) / (2 * stepX);
  const ny = 1.0;
  const nz = (topH - bottomH) / (2 * stepZ);
  const len = Math.hypot(nx, ny, nz);

  return {
    height,
    normal: { x: nx / len, y: ny / len, z: nz / len },
  };
}

function testSphereHeightfield(
  sphere: SphereColliderShape,
  hf: HeightfieldColliderShape,
  tA: Transform3D,
  tB: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  invert: boolean
): CollisionManifold3D | null {
  const maxScale = Math.max(Math.abs(tA.scale.x), Math.abs(tA.scale.y), Math.abs(tA.scale.z));
  const r = sphere.radius * maxScale;

  const localSpherePos = worldToLocalPoint(tB, tA.position);
  const halfW = hf.width * 0.5;
  const halfL = hf.length * 0.5;

  if (
    localSpherePos.x < -halfW ||
    localSpherePos.x > halfW ||
    localSpherePos.z < -halfL ||
    localSpherePos.z > halfL
  ) {
    return null;
  }

  const surface = sampleHeightfieldSurface(hf, localSpherePos.x, localSpherePos.z);
  const penetration = r - (localSpherePos.y - surface.height);

  if (penetration <= 0) return null;

  const worldNormal = quatRotateVector(tB.rotation, surface.normal);
  const localContact: Vector3 = {
    x: localSpherePos.x,
    y: surface.height,
    z: localSpherePos.z,
  };
  const worldContact = localToWorldPoint(tB, localContact);

  const normal = invert ? worldNormal : vec3Scale(worldNormal, -1);

  const contactPoint: ContactPoint3D = {
    position: worldContact,
    localPositionA: worldToLocalPoint(tA, worldContact),
    localPositionB: localContact,
    normal,
    penetration,
  };

  return {
    bodyAId: invert ? bodyBId : bodyAId,
    bodyBId: invert ? bodyAId : bodyBId,
    colliderAId: invert ? colBId : colAId,
    colliderBId: invert ? colAId : colBId,
    contacts: [contactPoint],
    isTrigger: false,
    normal,
    penetration,
  };
}

function testBoxHeightfield(
  box: BoxColliderShape,
  hf: HeightfieldColliderShape,
  tA: Transform3D,
  tB: Transform3D,
  colAId: string,
  colBId: string,
  bodyAId: string,
  bodyBId: string,
  invert: boolean
): CollisionManifold3D | null {
  const hx = box.halfExtents.x * Math.abs(tA.scale.x);
  const hy = box.halfExtents.y * Math.abs(tA.scale.y);
  const hz = box.halfExtents.z * Math.abs(tA.scale.z);

  const corners: Vector3[] = [
    { x: -hx, y: -hy, z: -hz },
    { x: -hx, y: -hy, z: hz },
    { x: -hx, y: hy, z: -hz },
    { x: -hx, y: hy, z: hz },
    { x: hx, y: -hy, z: -hz },
    { x: hx, y: -hy, z: hz },
    { x: hx, y: hy, z: -hz },
    { x: hx, y: hy, z: hz },
  ];

  const halfW = hf.width * 0.5;
  const halfL = hf.length * 0.5;

  let maxPenetration = 0;
  let deepestContact: Vector3 | null = null;
  let deepestNormal: Vector3 = { x: 0, y: 1, z: 0 };
  let deepestLocalB: Vector3 = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < 8; i++) {
    const worldCorner = localToWorldPoint(tA, corners[i]);
    const localCorner = worldToLocalPoint(tB, worldCorner);

    if (
      localCorner.x >= -halfW &&
      localCorner.x <= halfW &&
      localCorner.z >= -halfL &&
      localCorner.z <= halfL
    ) {
      const surface = sampleHeightfieldSurface(hf, localCorner.x, localCorner.z);
      const pen = surface.height - localCorner.y;
      if (pen > maxPenetration) {
        maxPenetration = pen;
        deepestContact = worldCorner;
        deepestNormal = quatRotateVector(tB.rotation, surface.normal);
        deepestLocalB = { x: localCorner.x, y: surface.height, z: localCorner.z };
      }
    }
  }

  if (maxPenetration <= 0 || !deepestContact) return null;

  const normal = invert ? deepestNormal : vec3Scale(deepestNormal, -1);

  const contactPoint: ContactPoint3D = {
    position: deepestContact,
    localPositionA: worldToLocalPoint(tA, deepestContact),
    localPositionB: deepestLocalB,
    normal,
    penetration: maxPenetration,
  };

  return {
    bodyAId: invert ? bodyBId : bodyAId,
    bodyBId: invert ? bodyAId : bodyBId,
    colliderAId: invert ? colBId : colAId,
    colliderBId: invert ? colAId : colBId,
    contacts: [contactPoint],
    isTrigger: false,
    normal,
    penetration: maxPenetration,
  };
}
