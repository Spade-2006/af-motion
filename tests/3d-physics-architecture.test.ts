/**
 * AF Motion — 3D Physics Architecture Test Suite
 *
 * Comprehensive tests covering 3D mathematics, quaternions, transforms,
 * physics materials, colliders, narrowphase, broad-phase spatial queries,
 * solvers, world lifecycle, events, metrics, and simulation coordinator integration.
 */

import { describe, it, expect, vi } from "vitest";
import {
  // Math & Transforms
  vec3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3Normalize,
  vec3SafeNormalize,
  vec3Lerp,
  vec3Min,
  vec3Max,
  vec3Equals,
  vec3Clone,
  vec3ToTuple,
  tupleToVec3,
  quat,
  quatIdentity,
  quatNormalize,
  quatSafeNormalize,
  quatMultiply,
  quatConjugate,
  quatInverse,
  quatRotateVector,
  vec3TransformQuat,
  quatFromAxisAngle,
  quatToAxisAngle,
  quatFromEuler,
  quatToEuler,
  quatSlerp,
  mat3Identity,
  mat3FromQuaternion,
  mat3Multiply,
  mat3Invert,
  mat3TransformVector,
  mat4Identity,
  mat4Compose,
  vec3TransformMat4,
  createTransform3D,
  composeTransform3D,
  invertTransform3D,
  localToWorldPoint,
  worldToLocalPoint,
  createAABB3D,
  aabb3DIntersects,
  aabb3DContainsPoint,
  aabb3DTransform,
  isFiniteVector3,
  isFiniteQuaternion,
  // Materials
  createPhysicsMaterial,
  combineFriction,
  combineRestitution,
  MATERIAL_PRESETS,
  getMaterialPreset,
  // Colliders & Narrowphase
  createSphereShape,
  createBoxShape,
  createCapsuleShape,
  createPlaneShape,
  createConvexShape,
  createCollider3D,
  computeColliderAABB,
  canCollideCollider3D,
  generateCollisionManifold,
  raycastCollider,
  // Spatial
  createSpatialQuery3D,
  SpatialHash3D,
  // Solvers
  SymplecticEulerIntegrator3D,
  ImpulseCollisionSolver3D,
  BasicConstraintSolver3D,
  // World & Adapter
  createPhysicsWorld3D,
  createPhysics3DParticipant,
} from "../src/3d/physics/index.js";
import { createSimulationCoordinator } from "../src/graphics/simulation/coordinator.js";

describe("3D Physics Architecture — Mathematics & Transforms", () => {
  it("performs fundamental vector operations accurately", () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, 5, 6);

    expect(vec3Add(a, b)).toEqual({ x: 5, y: 7, z: 9 });
    expect(vec3Sub(b, a)).toEqual({ x: 3, y: 3, z: 3 });
    expect(vec3Scale(a, 2)).toEqual({ x: 2, y: 4, z: 6 });
    expect(vec3Dot(a, b)).toBe(1 * 4 + 2 * 5 + 3 * 6); // 32

    const cross = vec3Cross(vec3(1, 0, 0), vec3(0, 1, 0));
    expect(cross).toEqual({ x: 0, y: 0, z: 1 });

    expect(vec3LengthSq(vec3(3, 4, 0))).toBe(25);
    expect(vec3Length(vec3(3, 4, 0))).toBe(5);

    const norm = vec3Normalize(vec3(0, 5, 0));
    expect(norm).toEqual({ x: 0, y: 1, z: 0 });

    const safeZero = vec3SafeNormalize(vec3(0, 0, 0), vec3(0, 0, 1));
    expect(safeZero).toEqual({ x: 0, y: 0, z: 1 });

    expect(vec3Lerp(vec3(0, 0, 0), vec3(10, 20, 30), 0.5)).toEqual({ x: 5, y: 10, z: 15 });
    expect(vec3Min(a, b)).toEqual({ x: 1, y: 2, z: 3 });
    expect(vec3Max(a, b)).toEqual({ x: 4, y: 5, z: 6 });
    expect(vec3Equals(a, vec3(1, 2, 3))).toBe(true);
    expect(vec3Equals(a, b)).toBe(false);

    expect(vec3ToTuple(a)).toEqual([1, 2, 3]);
    expect(tupleToVec3([7, 8, 9])).toEqual({ x: 7, y: 8, z: 9 });
  });

  it("handles quaternion rotations, compositions, and conversions correctly", () => {
    const id = quatIdentity();
    expect(id).toEqual({ x: 0, y: 0, z: 0, w: 1 });

    // Rotate 90 deg around Y axis
    const rotY90 = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
    const rotated = vec3TransformQuat(vec3(1, 0, 0), rotY90);
    expect(Math.abs(rotated.x)).toBeLessThan(1e-5);
    expect(Math.abs(rotated.y)).toBeLessThan(1e-5);
    expect(rotated.z).toBeCloseTo(-1, 4);

    // Axis angle roundtrip
    const axisAngle = quatToAxisAngle(rotY90);
    expect(axisAngle.axis.y).toBeCloseTo(1, 4);
    expect(axisAngle.angle).toBeCloseTo(Math.PI / 2, 4);

    // Quaternion inversion and multiplication (q * q^-1 = identity)
    const inv = quatInverse(rotY90);
    const mul = quatMultiply(rotY90, inv);
    expect(mul.w).toBeCloseTo(1, 4);
    expect(mul.x).toBeCloseTo(0, 4);
    expect(mul.y).toBeCloseTo(0, 4);
    expect(mul.z).toBeCloseTo(0, 4);

    // Euler conversion
    const qEuler = quatFromEuler(0, Math.PI / 2, 0);
    const euler = quatToEuler(qEuler);
    expect(euler.y).toBeCloseTo(Math.PI / 2, 3);

    // Slerp
    const slerped = quatSlerp(quatIdentity(), rotY90, 0.5);
    const angleSlerped = quatToAxisAngle(slerped);
    expect(angleSlerped.angle).toBeCloseTo(Math.PI / 4, 3);
  });

  it("supports hierarchical transform composition and coordinate conversions", () => {
    const parent = createTransform3D(vec3(10, 0, 0), quatIdentity(), vec3(2, 2, 2));
    const child = createTransform3D(vec3(5, 0, 0), quatIdentity(), vec3(1, 1, 1));

    const composed = composeTransform3D(parent, child);
    // position = parent.pos + parent.rot * (child.pos * parent.scale) = 10 + 5 * 2 = 20
    expect(composed.position.x).toBe(20);
    expect(composed.scale.x).toBe(2);

    // Local to world and world to local point
    const localPt = vec3(2, 3, 4);
    const worldPt = localToWorldPoint(parent, localPt);
    expect(worldPt).toEqual({ x: 10 + 2 * 2, y: 3 * 2, z: 4 * 2 });

    const backLocal = worldToLocalPoint(parent, worldPt);
    expect(backLocal.x).toBeCloseTo(localPt.x, 4);
    expect(backLocal.y).toBeCloseTo(localPt.y, 4);
    expect(backLocal.z).toBeCloseTo(localPt.z, 4);
  });

  it("evaluates Matrix3 and Matrix4 operations with numerical stability", () => {
    const m3 = mat3Identity();
    expect(m3).toHaveLength(9);

    const rotQuat = quatFromAxisAngle(vec3(0, 0, 1), Math.PI / 2);
    const rotM3 = mat3FromQuaternion(rotQuat);
    const v = mat3TransformVector(rotM3, vec3(1, 0, 0));
    expect(v.x).toBeCloseTo(0, 4);
    expect(v.y).toBeCloseTo(1, 4);

    const invM3 = mat3Invert(rotM3);
    const identityCheck = mat3Multiply(rotM3, invM3);
    expect(identityCheck[0]).toBeCloseTo(1, 4);
    expect(identityCheck[4]).toBeCloseTo(1, 4);
    expect(identityCheck[8]).toBeCloseTo(1, 4);

    const m4 = mat4Compose(vec3(1, 2, 3), quatIdentity(), vec3(1, 1, 1));
    expect(m4).toHaveLength(16);
    const v4 = vec3TransformMat4(vec3(0, 0, 0), m4);
    expect(v4).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("computes AABB3D intersections, bounds transforms, and encapsulation", () => {
    const a = createAABB3D(vec3(0, 0, 0), vec3(2, 2, 2));
    const b = createAABB3D(vec3(1, 1, 1), vec3(3, 3, 3));
    const c = createAABB3D(vec3(5, 5, 5), vec3(7, 7, 7));

    expect(aabb3DIntersects(a, b)).toBe(true);
    expect(aabb3DIntersects(a, c)).toBe(false);
    expect(aabb3DContainsPoint(a, vec3(1, 1, 1))).toBe(true);
    expect(aabb3DContainsPoint(a, vec3(3, 3, 3))).toBe(false);

    const t = createTransform3D(vec3(10, 0, 0), quatIdentity(), vec3(1, 1, 1));
    const transformed = aabb3DTransform(a, t);
    expect(transformed.min.x).toBe(10);
    expect(transformed.max.x).toBe(12);
  });

  it("safeguards against non-finite floats and zero-division", () => {
    expect(isFiniteVector3(vec3(0, 0, 0))).toBe(true);
    expect(isFiniteVector3({ x: NaN, y: 0, z: 0 })).toBe(false);
    expect(isFiniteQuaternion(quatIdentity())).toBe(true);
    expect(isFiniteQuaternion({ x: 0, y: 0, z: 0, w: Infinity })).toBe(false);

    const safeQuat = quatSafeNormalize({ x: 0, y: 0, z: 0, w: 0 });
    expect(safeQuat).toEqual(quatIdentity());
  });
});

describe("3D Physics Architecture — Materials & Presets", () => {
  it("creates validated physics materials with default properties", () => {
    const mat = createPhysicsMaterial({ friction: 0.8, restitution: 0.5 });
    expect(mat.friction).toBe(0.8);
    expect(mat.restitution).toBe(0.5);
    expect(mat.density).toBe(1000);
    expect(mat.frictionCombineRule).toBe("multiply");
  });

  it("correctly evaluates friction and restitution combination rules", () => {
    const matA = createPhysicsMaterial({ friction: 0.5, restitution: 0.2 });
    const matB = createPhysicsMaterial({ friction: 0.8, restitution: 0.6 });

    // Multiply friction
    expect(combineFriction(matA, matB)).toBeCloseTo(Math.sqrt(0.5 * 0.8), 4);

    // Average restitution
    expect(combineRestitution(matA, matB)).toBeCloseTo(0.4, 4);

    // Max restitution rule
    const bouncyA = createPhysicsMaterial({ restitution: 0.9, restitutionCombineRule: "max" });
    const normalB = createPhysicsMaterial({ restitution: 0.1 });
    expect(combineRestitution(bouncyA, normalB)).toBe(0.9);
  });

  it("provides standard validated presets separate from visual materials", () => {
    expect(MATERIAL_PRESETS.metal.friction).toBe(0.4);
    expect(MATERIAL_PRESETS.metal.density).toBe(7800);
    expect(MATERIAL_PRESETS.ice.friction).toBe(0.03);
    expect(MATERIAL_PRESETS.bouncy.restitution).toBe(0.95);

    const retrieved = getMaterialPreset("rubber");
    expect(retrieved.friction).toBe(0.9);
    expect(retrieved.restitution).toBe(0.8);

    const fallback = getMaterialPreset("unknown_key");
    expect(fallback.name).toBe("default");
  });
});

describe("3D Physics Architecture — Colliders & Narrowphase", () => {
  it("creates valid shapes and computes world-space AABBs", () => {
    const sphere = createCollider3D(createSphereShape(1.5));
    expect(sphere.aabb.min.x).toBe(-1.5);
    expect(sphere.aabb.max.x).toBe(1.5);

    const box = createCollider3D(createBoxShape(vec3(2, 3, 4)));
    expect(box.aabb.min).toEqual({ x: -2, y: -3, z: -4 });
    expect(box.aabb.max).toEqual({ x: 2, y: 3, z: 4 });

    const capsule = createCollider3D(createCapsuleShape(1, 4, "y"));
    expect(capsule.aabb.min.y).toBe(-3); // -halfH - r = -2 - 1 = -3
    expect(capsule.aabb.max.y).toBe(3);

    const plane = createCollider3D(createPlaneShape(vec3(0, 1, 0), 0));
    expect(plane.shape.type).toBe("plane");
  });

  it("filters collision pairs using layer and mask bitmasks", () => {
    const colA = createCollider3D(createSphereShape(1), { collisionLayer: 0b0001, collisionMask: 0b0010 });
    const colB = createCollider3D(createSphereShape(1), { collisionLayer: 0b0010, collisionMask: 0b0001 });
    const colC = createCollider3D(createSphereShape(1), { collisionLayer: 0b0100, collisionMask: 0b0100 });

    expect(canCollideCollider3D(colA, colB)).toBe(true);
    expect(canCollideCollider3D(colA, colC)).toBe(false);
  });

  it("detects Sphere vs Sphere collisions and builds manifolds", () => {
    const colA = createCollider3D(createSphereShape(1));
    const colB = createCollider3D(createSphereShape(1));

    const tA = createTransform3D(vec3(0, 0, 0));
    const tB = createTransform3D(vec3(1.5, 0, 0)); // Penetration = 2 - 1.5 = 0.5

    const manifold = generateCollisionManifold(undefined, undefined, colA, colB, tA, tB);
    expect(manifold).not.toBeNull();
    expect(manifold!.contacts).toHaveLength(1);
    expect(manifold!.penetration).toBeCloseTo(0.5, 3);
    expect(manifold!.normal.x).toBeCloseTo(1, 3);
  });

  it("detects Sphere vs Plane collisions", () => {
    const sphere = createCollider3D(createSphereShape(1));
    const plane = createCollider3D(createPlaneShape(vec3(0, 1, 0), 0));

    const tSphere = createTransform3D(vec3(0, 0.5, 0)); // Overlaps ground by 0.5
    const tPlane = createTransform3D(vec3(0, 0, 0));

    const manifold = generateCollisionManifold(undefined, undefined, sphere, plane, tSphere, tPlane);
    expect(manifold).not.toBeNull();
    expect(manifold!.penetration).toBeCloseTo(0.5, 3);
  });

  it("detects Sphere vs Box collisions", () => {
    const sphere = createCollider3D(createSphereShape(1));
    const box = createCollider3D(createBoxShape(vec3(1, 1, 1)));

    const tSphere = createTransform3D(vec3(1.5, 0, 0)); // Box extends to x=1, sphere reaches x=0.5 -> 0.5 overlap
    const tBox = createTransform3D(vec3(0, 0, 0));

    const manifold = generateCollisionManifold(undefined, undefined, sphere, box, tSphere, tBox);
    expect(manifold).not.toBeNull();
    expect(manifold!.penetration).toBeCloseTo(0.5, 3);
  });

  it("detects Box vs Box collisions", () => {
    const boxA = createCollider3D(createBoxShape(vec3(1, 1, 1)));
    const boxB = createCollider3D(createBoxShape(vec3(1, 1, 1)));

    const tA = createTransform3D(vec3(0, 0, 0));
    const tB = createTransform3D(vec3(1.8, 0, 0)); // Overlap = 2 - 1.8 = 0.2

    const manifold = generateCollisionManifold(undefined, undefined, boxA, boxB, tA, tB);
    expect(manifold).not.toBeNull();
    expect(manifold!.penetration).toBeCloseTo(0.2, 3);
  });

  it("supports accurate 3D raycasting against primitives", () => {
    const sphere = createCollider3D(createSphereShape(1));
    const hitSphere = raycastCollider(
      { origin: vec3(0, 0, -5), direction: vec3(0, 0, 1), length: 10 },
      sphere,
      createTransform3D(vec3(0, 0, 0))
    );
    expect(hitSphere).not.toBeNull();
    expect(hitSphere!.distance).toBeCloseTo(4, 3); // 5 - radius 1 = 4
    expect(hitSphere!.point.z).toBeCloseTo(-1, 3);

    const box = createCollider3D(createBoxShape(vec3(1, 1, 1)));
    const hitBox = raycastCollider(
      { origin: vec3(0, 5, 0), direction: vec3(0, -1, 0), length: 10 },
      box,
      createTransform3D(vec3(0, 0, 0))
    );
    expect(hitBox).not.toBeNull();
    expect(hitBox!.distance).toBeCloseTo(4, 3);
    expect(hitBox!.normal.y).toBeCloseTo(1, 3);

    const miss = raycastCollider(
      { origin: vec3(0, 0, -5), direction: vec3(0, 1, 0), length: 10 },
      sphere,
      createTransform3D(vec3(0, 0, 0))
    );
    expect(miss).toBeNull();
  });
});

describe("3D Physics Architecture — Spatial Query System", () => {
  it("registers, updates, and queries colliders in 3D spatial hash grid", () => {
    const spatial = createSpatialQuery3D({ cellSize: 2.0 });

    const colA = createCollider3D(createSphereShape(1), { id: "colA" });
    colA.aabb = { min: vec3(0, 0, 0), max: vec3(1, 1, 1) };
    const colB = createCollider3D(createSphereShape(1), { id: "colB" });
    colB.aabb = { min: vec3(0.5, 0.5, 0.5), max: vec3(1.5, 1.5, 1.5) };
    const colC = createCollider3D(createSphereShape(1), { id: "colC" });
    colC.aabb = { min: vec3(10, 10, 10), max: vec3(11, 11, 11) };

    spatial.register(colA);
    spatial.register(colB);
    spatial.register(colC);

    expect(spatial.getColliderCount()).toBe(3);

    // Broadphase pairs
    const pairs = spatial.getPotentialPairs();
    expect(pairs.length).toBe(1);
    expect(pairs[0][0].id).toBe("colA");
    expect(pairs[0][1].id).toBe("colB");

    // AABB volume query
    const queried = spatial.queryAABB({ min: vec3(0, 0, 0), max: vec3(2, 2, 2) });
    expect(queried.map((c) => c.id)).toContain("colA");
    expect(queried.map((c) => c.id)).toContain("colB");
    expect(queried.map((c) => c.id)).not.toContain("colC");

    // Unregister
    spatial.unregister("colA");
    expect(spatial.getColliderCount()).toBe(2);
    expect(spatial.getPotentialPairs()).toHaveLength(0);
  });

  it("performs multi-object raycast queries sorted by distance", () => {
    const spatial = createSpatialQuery3D({ cellSize: 2.0 });

    const nearSphere = createCollider3D(createSphereShape(1), { id: "near" });
    nearSphere.offset.position = vec3(0, 0, 2);
    nearSphere.aabb = computeColliderAABB(nearSphere);

    const farSphere = createCollider3D(createSphereShape(1), { id: "far" });
    farSphere.offset.position = vec3(0, 0, 6);
    farSphere.aabb = computeColliderAABB(farSphere);

    spatial.register(nearSphere);
    spatial.register(farSphere);

    const hits = spatial.raycast({ origin: vec3(0, 0, -5), direction: vec3(0, 0, 1), length: 20 });
    expect(hits).toHaveLength(2);
    expect(hits[0].collider?.id).toBe("near");
    expect(hits[1].collider?.id).toBe("far");
    expect(hits[0].distance).toBeLessThan(hits[1].distance);

    expect(spatial.raycastAny({ origin: vec3(0, 0, -5), direction: vec3(0, 0, 1) })).toBe(true);
    expect(spatial.raycastAny({ origin: vec3(0, 0, -5), direction: vec3(0, 1, 0) })).toBe(false);
  });
});

describe("3D Physics Architecture — Solvers & Integrators", () => {
  it("integrates velocity and position under gravity via Symplectic Euler", () => {
    const integrator = new SymplecticEulerIntegrator3D();
    const body = {
      id: "testBody",
      type: "dynamic" as const,
      transform: createTransform3D(vec3(0, 10, 0)),
      linearVelocity: vec3(0, 0, 0),
      angularVelocity: vec3(0, 0, 0),
      linearFactor: vec3(1, 1, 1),
      angularFactor: vec3(1, 1, 1),
      force: vec3(0, 0, 0),
      torque: vec3(0, 0, 0),
      mass: 1.0,
      invMass: 1.0,
      inertiaTensor: mat3Identity(),
      invInertiaTensor: mat3Identity(),
      material: createPhysicsMaterial(),
      colliders: [],
      isSleeping: false,
      allowSleep: false,
      sleepTime: 0,
      linearDamping: 0,
      angularDamping: 0,
      gravityScale: 1.0,
    };

    integrator.integrate([body], 0.1, vec3(0, -10, 0));
    // velocity = 0 + (-10) * 0.1 = -1
    expect(body.linearVelocity.y).toBeCloseTo(-1, 3);
    // position = 10 + (-1) * 0.1 = 9.9
    expect(body.transform.position.y).toBeCloseTo(9.9, 3);
  });

  it("applies collision impulses and separates overlapping bodies", () => {
    const solver = new ImpulseCollisionSolver3D();
    const bodyA = {
      id: "bA",
      type: "dynamic" as const,
      transform: createTransform3D(vec3(0, 0, 0)),
      linearVelocity: vec3(2, 0, 0),
      angularVelocity: vec3(0, 0, 0),
      linearFactor: vec3(1, 1, 1),
      angularFactor: vec3(1, 1, 1),
      force: vec3(0, 0, 0),
      torque: vec3(0, 0, 0),
      mass: 1.0,
      invMass: 1.0,
      inertiaTensor: mat3Identity(),
      invInertiaTensor: mat3Identity(),
      material: createPhysicsMaterial({ restitution: 0.5, friction: 0 }),
      colliders: [],
      isSleeping: false,
      allowSleep: false,
      sleepTime: 0,
      linearDamping: 0,
      angularDamping: 0,
      gravityScale: 0,
    };

    const bodyB = {
      id: "bB",
      type: "static" as const,
      transform: createTransform3D(vec3(1, 0, 0)),
      linearVelocity: vec3(0, 0, 0),
      angularVelocity: vec3(0, 0, 0),
      linearFactor: vec3(1, 1, 1),
      angularFactor: vec3(1, 1, 1),
      force: vec3(0, 0, 0),
      torque: vec3(0, 0, 0),
      mass: 0,
      invMass: 0,
      inertiaTensor: mat3Identity(),
      invInertiaTensor: mat3Identity(),
      material: createPhysicsMaterial({ restitution: 0.5, friction: 0 }),
      colliders: [],
      isSleeping: false,
      allowSleep: false,
      sleepTime: 0,
      linearDamping: 0,
      angularDamping: 0,
      gravityScale: 0,
    };

    const bodiesMap = new Map([["bA", bodyA], ["bB", bodyB]]);

    const manifold = {
      bodyAId: "bA",
      bodyBId: "bB",
      colliderAId: "cA",
      colliderBId: "cB",
      contacts: [
        {
          position: vec3(0.5, 0, 0),
          localPositionA: vec3(0.5, 0, 0),
          localPositionB: vec3(-0.5, 0, 0),
          normal: vec3(1, 0, 0),
          penetration: 0.05,
        },
      ],
      isTrigger: false,
      normal: vec3(1, 0, 0),
      penetration: 0.05,
    };

    solver.resolveCollisions([manifold], bodiesMap, 5, 0.016);
    // Dynamic body moving in +X into static wall in +X must bounce backwards (-X)
    expect(bodyA.linearVelocity.x).toBeLessThan(0);
  });
});

describe("3D Physics Architecture — Physics World & Simulation", () => {
  it("creates independent physics worlds with isolated bodies and configurations", () => {
    const worldA = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0) });
    const worldB = createPhysicsWorld3D({ gravity: vec3(0, -1.62, 0) }); // Moon gravity

    expect(worldA.getGravity().y).toBeCloseTo(-9.81, 2);
    expect(worldB.getGravity().y).toBeCloseTo(-1.62, 2);

    const bodyA = worldA.addBody({ mass: 5 });
    expect(worldA.getAllBodies()).toHaveLength(1);
    expect(worldB.getAllBodies()).toHaveLength(0);

    worldA.dispose();
    worldB.dispose();
  });

  it("manages full lifecycle: start, pause, resume, step, reset, dispose", () => {
    const world = createPhysicsWorld3D();
    expect(world.getState()).toBe("idle");

    world.start();
    expect(world.getState()).toBe("running");

    world.pause();
    expect(world.getState()).toBe("paused");
    expect(world.isPaused()).toBe(true);

    world.resume();
    expect(world.getState()).toBe("running");

    const ball = world.addBody({
      type: "dynamic",
      position: vec3(0, 10, 0),
      mass: 1,
    });

    world.step(0.1);
    expect(ball.transform.position.y).toBeLessThan(10);
    expect(world.getSimulationTime()).toBeGreaterThan(0);

    world.reset();
    expect(world.getSimulationTime()).toBe(0);
    expect(ball.linearVelocity).toEqual({ x: 0, y: 0, z: 0 });

    world.dispose();
    expect(world.getState()).toBe("disposed");
    expect(world.getAllBodies()).toHaveLength(0);
  });

  it("handles forces, torques, impulses, and waking sleeping bodies", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), enableSleeping: true });
    world.start();

    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 2.0,
      allowSleep: true,
    });

    body.isSleeping = true;
    expect(body.isSleeping).toBe(true);

    // Applying impulse should wake the body
    world.applyImpulse(body.id, vec3(10, 0, 0));
    expect(body.isSleeping).toBe(false);
    expect(body.linearVelocity.x).toBe(5); // 10 impulse / 2 kg = 5 m/s

    world.applyForce(body.id, vec3(0, 4, 0));
    expect(body.force.y).toBe(4);

    world.applyTorque(body.id, vec3(0, 1, 0));
    expect(body.torque.y).toBe(1);

    world.dispose();
  });

  it("dispatches typed lifecycle, collision, and trigger events with listener cleanup", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    const onCollisionStart = vi.fn();
    const onTriggerEnter = vi.fn();
    const onBodyAdded = vi.fn();

    const unsubCol = world.on("collisionStart", onCollisionStart);
    world.on("triggerEnter", onTriggerEnter);
    world.on("bodyAdded", onBodyAdded);

    const b1 = world.addBody({
      position: vec3(0, 0, 0),
      colliders: [createCollider3D(createSphereShape(1), { id: "col1" })],
    });
    expect(onBodyAdded).toHaveBeenCalledTimes(1);

    // Add overlapping body
    const b2 = world.addBody({
      position: vec3(1, 0, 0),
      colliders: [createCollider3D(createSphereShape(1), { id: "col2" })],
    });

    world.step(0.016);
    expect(onCollisionStart).toHaveBeenCalledTimes(1);

    // Unsubscribe collision listener and verify no duplicate calls
    unsubCol();
    world.step(0.016);
    expect(onCollisionStart).toHaveBeenCalledTimes(1);

    // Add trigger volume
    world.addBody({
      position: vec3(0, 0, 0),
      colliders: [createCollider3D(createSphereShape(2), { id: "trig", isTrigger: true })],
    });

    world.step(0.016);
    expect(onTriggerEnter).toHaveBeenCalled();

    world.dispose();
  });

  it("reports detailed runtime physics metrics", () => {
    const world = createPhysicsWorld3D();
    world.start();

    world.addBody({ type: "dynamic", mass: 1 });
    world.addBody({ type: "static" });

    world.step(0.016);
    const metrics = world.getMetrics();

    expect(metrics.activeBodyCount).toBe(1);
    expect(metrics.staticBodyCount).toBe(1);
    expect(metrics.substepsExecuted).toBeGreaterThan(0);
    expect(metrics.solverIterations).toBeGreaterThan(0);

    world.dispose();
  });
});

describe("3D Physics Architecture — Simulation Coordinator Integration", () => {
  it("adapts PhysicsWorld3D as a SimulationParticipant in the Unified Coordinator", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -10, 0) });
    const ball = world.addBody({ type: "dynamic", position: vec3(0, 10, 0), mass: 1 });

    const participant = world.asParticipant("physics-main", 2);
    expect(participant.id).toBe("physics-main");
    expect(participant.type).toBe("physics-3d");
    expect(participant.priority).toBe(2);

    const coordinator = createSimulationCoordinator({
      autoStart: false,
      timestep: { mode: "fixed", fixedDelta: 0.016 },
    });

    coordinator.register(participant);
    expect(coordinator.listParticipants().length).toBe(1);

    // Step coordinator
    coordinator.step(0.032);
    expect(ball.transform.position.y).toBeLessThan(10);

    coordinator.dispose();
    expect(coordinator.listParticipants().length).toBe(0);
  });
});
