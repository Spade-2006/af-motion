/**
 * AF Motion — 3D Rigid Body Physics Engine Test Suite
 *
 * Comprehensive tests covering dynamic/static/kinematic bodies, rotational inertia,
 * compound colliders, angular dynamics, CCD, friction, stacking stability,
 * wake-on-contact, and performance benchmarks.
 */

import { describe, it, expect, vi } from "vitest";
import {
  createPhysicsWorld3D,
  createCollider3D,
  createSphereShape,
  createBoxShape,
  createCapsuleShape,
  createPlaneShape,
  vec3,
  vec3Length,
  quatIdentity,
  quatFromAxisAngle,
  createTransform3D,
  computeSphereInertia,
  computeBoxInertia,
  computeCapsuleInertia,
  applyParallelAxisTheorem,
  rotateInertiaTensor,
  computeCompoundMassProperties,
  benchmarkRigidBodies,
  benchmarkStacking,
  benchmarkCCD,
} from "../src/3d/physics/index.js";

describe("3D Rigid Body Physics Engine — Body Types & Mass Management", () => {
  it("simulates dynamic bodies under gravity and impulses", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -10, 0) });
    world.start();

    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 5, 0),
      mass: 2.0,
      colliders: [createCollider3D(createSphereShape(1))],
    });

    expect(body.type).toBe("dynamic");
    expect(body.mass).toBe(2.0);
    expect(body.invMass).toBe(0.5);

    world.step(0.1);
    expect(body.transform.position.y).toBeLessThan(5);
    expect(body.linearVelocity.y).toBeLessThan(0);

    world.dispose();
  });

  it("ensures static bodies remain completely immovable with infinite mass", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -10, 0) });
    world.start();

    const staticWall = world.addBody({
      type: "static",
      position: vec3(0, 0, 0),
      colliders: [createCollider3D(createBoxShape(vec3(5, 1, 5)))],
    });

    expect(staticWall.mass).toBe(0);
    expect(staticWall.invMass).toBe(0);

    // Apply force and impulse to static body
    world.applyForce(staticWall.id, vec3(0, 100, 0));
    world.applyImpulse(staticWall.id, vec3(10, 0, 0));
    world.step(0.1);

    expect(staticWall.transform.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(staticWall.linearVelocity).toEqual({ x: 0, y: 0, z: 0 });

    world.dispose();
  });

  it("simulates kinematic bodies that move at controlled velocity and push dynamic bodies", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    // Kinematic platform moving in +X direction at 5 m/s
    const platform = world.addBody({
      type: "kinematic",
      position: vec3(0, 0, 0),
      linearVelocity: vec3(5, 0, 0),
      colliders: [createCollider3D(createBoxShape(vec3(1, 1, 1)))],
    });

    expect(platform.invMass).toBe(0);

    // Dynamic ball standing at x = 1.5
    const ball = world.addBody({
      type: "dynamic",
      position: vec3(1.5, 0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createSphereShape(0.5))],
    });

    world.step(0.1);

    // Platform moves forward by 5 * 0.1 = 0.5m
    expect(platform.transform.position.x).toBeCloseTo(0.5, 2);
    // Dynamic ball got pushed forward by kinematic platform
    expect(ball.linearVelocity.x).toBeGreaterThan(0);
    expect(ball.transform.position.x).toBeGreaterThan(1.5);

    world.dispose();
  });

  it("updates body types and mass dynamically at runtime", () => {
    const world = createPhysicsWorld3D();
    const body = world.addBody({
      type: "dynamic",
      mass: 5.0,
      position: vec3(0, 0, 0),
      colliders: [createCollider3D(createSphereShape(1))],
    });

    expect(body.invMass).toBe(0.2);

    // Change mass
    world.setBodyMass(body.id, 10.0);
    expect(body.mass).toBe(10.0);
    expect(body.invMass).toBe(0.1);

    // Convert to static
    world.setBodyType(body.id, "static");
    expect(body.type).toBe("static");
    expect(body.invMass).toBe(0);

    // Convert back to dynamic
    world.setBodyType(body.id, "dynamic");
    expect(body.type).toBe("dynamic");
    expect(body.invMass).toBe(0.1);

    world.dispose();
  });

  it("computes body mass and inertia from material density", () => {
    const world = createPhysicsWorld3D();
    const sphereRadius = 1.0;
    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      colliders: [createCollider3D(createSphereShape(sphereRadius))],
    });

    // Set density to water (1000 kg/m^3)
    world.setBodyDensity(body.id, 1000);
    const expectedVolume = (4 / 3) * Math.PI * Math.pow(sphereRadius, 3);
    const expectedMass = expectedVolume * 1000;

    expect(body.mass).toBeCloseTo(expectedMass, 1);
    expect(body.invMass).toBeCloseTo(1 / expectedMass, 4);

    world.dispose();
  });
});

describe("3D Rigid Body Physics Engine — Rotational Inertia Tensors", () => {
  it("calculates accurate analytical sphere inertia tensors", () => {
    const m = 10;
    const r = 2;
    const inertia = computeSphereInertia(r, m);
    const expectedDiag = (2 / 5) * m * r * r; // 0.4 * 10 * 4 = 16

    expect(inertia[0]).toBeCloseTo(expectedDiag, 4);
    expect(inertia[4]).toBeCloseTo(expectedDiag, 4);
    expect(inertia[8]).toBeCloseTo(expectedDiag, 4);
    // Off-diagonals must be zero
    expect(inertia[1]).toBe(0);
    expect(inertia[3]).toBe(0);
  });

  it("calculates accurate analytical box inertia tensors", () => {
    const m = 12;
    const halfExtents = vec3(1, 2, 3);
    const inertia = computeBoxInertia(halfExtents, m);

    // Ix = (1/3) * m * (hy^2 + hz^2) = (1/3) * 12 * (4 + 9) = 4 * 13 = 52
    expect(inertia[0]).toBeCloseTo(52, 4);
    // Iy = (1/3) * m * (hx^2 + hz^2) = 4 * (1 + 9) = 40
    expect(inertia[4]).toBeCloseTo(40, 4);
    // Iz = (1/3) * m * (hx^2 + hy^2) = 4 * (1 + 4) = 20
    expect(inertia[8]).toBeCloseTo(20, 4);
  });

  it("calculates analytical capsule inertia tensors", () => {
    const inertia = computeCapsuleInertia(1, 2, "y", 5);
    expect(inertia[0]).toBeGreaterThan(0);
    expect(inertia[4]).toBeGreaterThan(0);
    expect(inertia[8]).toBeGreaterThan(0);
    // Due to cylindrical symmetry around Y, Ix and Iz must match
    expect(inertia[0]).toBeCloseTo(inertia[8], 4);
  });

  it("shifts inertia tensor using Parallel Axis Theorem (Huygens-Steiner)", () => {
    const baseInertia = computeSphereInertia(1, 10);
    const offset = vec3(2, 0, 0); // Shifted by 2 units along X
    const shifted = applyParallelAxisTheorem(baseInertia, offset, 10);

    // Moment about X is unchanged by shift along X
    expect(shifted[0]).toBeCloseTo(baseInertia[0], 4);
    // Moments about transverse axes Y and Z increase by m * d^2 = 10 * 4 = 40
    expect(shifted[4]).toBeCloseTo(baseInertia[4] + 40, 4);
    expect(shifted[8]).toBeCloseTo(baseInertia[8] + 40, 4);
  });

  it("rotates inertia tensors by orientation quaternions", () => {
    // Non-symmetric box inertia
    const boxInertia = computeBoxInertia(vec3(1, 2, 3), 10);
    // 90 degree rotation around Z swaps X and Y axes
    const rotZ90 = quatFromAxisAngle(vec3(0, 0, 1), Math.PI / 2);
    const rotated = rotateInertiaTensor(boxInertia, rotZ90);

    expect(rotated[0]).toBeCloseTo(boxInertia[4], 3);
    expect(rotated[4]).toBeCloseTo(boxInertia[0], 3);
    expect(rotated[8]).toBeCloseTo(boxInertia[8], 3);
  });
});

describe("3D Rigid Body Physics Engine — Compound Colliders", () => {
  it("combines multiple colliders with local offsets into compound mass and inertia", () => {
    // Dumbbell: two spheres placed at x = -2 and x = +2
    const sphereA = createCollider3D(createSphereShape(1), {
      offset: createTransform3D(vec3(-2, 0, 0)),
    });
    const sphereB = createCollider3D(createSphereShape(1), {
      offset: createTransform3D(vec3(2, 0, 0)),
    });

    const compound = computeCompoundMassProperties([sphereA, sphereB], 1000, 20);

    expect(compound.mass).toBe(20);
    // Symmetrical compound has center of mass at origin
    expect(compound.centerOfMass.x).toBeCloseTo(0, 4);
    expect(compound.centerOfMass.y).toBeCloseTo(0, 4);

    // Moment about Y and Z must be much larger than moment about X axis
    expect(compound.inertiaTensor[4]).toBeGreaterThan(compound.inertiaTensor[0]);
    expect(compound.inertiaTensor[8]).toBeGreaterThan(compound.inertiaTensor[0]);
  });

  it("updates compound inertia when colliders are added or removed dynamically", () => {
    const world = createPhysicsWorld3D();
    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 5,
      colliders: [createCollider3D(createBoxShape(vec3(1, 1, 1)))],
    });

    const initialIy = body.inertiaTensor[4];

    // Add second offset collider
    const secondCol = createCollider3D(createBoxShape(vec3(1, 1, 1)), {
      offset: createTransform3D(vec3(4, 0, 0)),
    });
    world.addCollider(body.id, secondCol);

    expect(body.colliders).toHaveLength(2);
    // Inertia about Y increased due to offset
    expect(body.inertiaTensor[4]).toBeGreaterThan(initialIy);

    // Remove collider
    world.removeCollider(secondCol.id);
    expect(body.colliders).toHaveLength(1);

    world.dispose();
  });
});

describe("3D Rigid Body Physics Engine — Forces, Torques & Angular Impulses", () => {
  it("applies central forces and torques", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 2.0,
    });

    // Central force
    world.applyForce(body.id, vec3(10, 0, 0));
    expect(body.force.x).toBe(10);
    expect(body.torque).toEqual({ x: 0, y: 0, z: 0 });

    // Direct torque
    world.applyTorque(body.id, vec3(0, 5, 0));
    expect(body.torque.y).toBe(5);

    world.step(0.1);
    // Acceleration a = 10 / 2 = 5 -> velocity = 5 * 0.1 = 0.5
    expect(body.linearVelocity.x).toBeGreaterThan(0.05);
    expect(body.angularVelocity.y).toBeGreaterThan(0);

    world.dispose();
  });

  it("applies off-center forces creating both linear acceleration and torque", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createBoxShape(vec3(1, 1, 1)))],
    });

    // Push top corner (+Y) forward (+Z) -> induces pitch torque about X axis
    world.applyForce(body.id, vec3(0, 0, 10), vec3(0, 1, 0), true);

    expect(body.force.z).toBe(10);
    // torque = r x F = (0, 1, 0) x (0, 0, 10) = (10, 0, 0)
    expect(body.torque.x).toBeCloseTo(10, 3);

    world.step(0.1);
    expect(body.linearVelocity.z).toBeGreaterThan(0);
    expect(body.angularVelocity.x).toBeGreaterThan(0);

    world.dispose();
  });

  it("applies direct angular impulses", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createSphereShape(1))],
    });

    world.applyAngularImpulse(body.id, vec3(0, 10, 0));
    expect(body.angularVelocity.y).toBeGreaterThan(0);

    world.step(0.1);
    // Orientation quaternion must have rotated
    expect(body.transform.rotation.w).not.toBe(1.0);

    world.dispose();
  });

  it("sets linear and angular velocities directly and wakes the body", () => {
    const world = createPhysicsWorld3D();
    const body = world.addBody({
      type: "dynamic",
      mass: 1.0,
      allowSleep: true,
    });

    world.sleepBody(body.id);
    expect(world.isBodySleeping(body.id)).toBe(true);

    world.setLinearVelocity(body.id, vec3(2, 0, 0));
    expect(world.isBodySleeping(body.id)).toBe(false);
    expect(body.linearVelocity.x).toBe(2);

    world.sleepBody(body.id);
    world.setAngularVelocity(body.id, vec3(0, 3, 0));
    expect(world.isBodySleeping(body.id)).toBe(false);
    expect(body.angularVelocity.y).toBe(3);

    world.dispose();
  });
});

describe("3D Rigid Body Physics Engine — Collision Response & Rotational Dynamics", () => {
  it("imparts rotational spin to a free dynamic body during an off-center collision", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    // Moving projectile in +Z
    const projectile = world.addBody({
      type: "dynamic",
      position: vec3(0.8, 0, -0.6),
      linearVelocity: vec3(0, 0, 10),
      mass: 5.0,
      colliders: [createCollider3D(createSphereShape(0.3))],
    });

    // Resting elongated box at origin
    const targetBox = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 2.0,
      colliders: [createCollider3D(createBoxShape(vec3(2, 0.5, 0.5)))],
    });

    for (let i = 0; i < 10; i++) world.step(1 / 60);

    // Target box was hit at x=0.8 (off center), so it must acquire angular velocity about Y axis
    expect(Math.abs(targetBox.angularVelocity.y)).toBeGreaterThan(0.5);

    world.dispose();
  });

  it("applies surface friction decelerating tangential sliding", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0) });
    world.start();

    // High friction ground
    world.addBody({
      type: "static",
      position: vec3(0, 0, 0),
      material: { friction: 0.8, restitution: 0 },
      colliders: [createCollider3D(createPlaneShape(vec3(0, 1, 0), 0))],
    });

    // Box sliding along X on the ground
    const slidingBox = world.addBody({
      type: "dynamic",
      position: vec3(0, 0.49, 0),
      linearVelocity: vec3(10, 0, 0),
      mass: 1.0,
      material: { friction: 0.8, restitution: 0 },
      colliders: [createCollider3D(createBoxShape(vec3(0.5, 0.5, 0.5)))],
    });

    for (let i = 0; i < 30; i++) {
      world.step(1 / 60);
    }

    // Velocity must be reduced significantly by friction
    expect(slidingBox.linearVelocity.x).toBeLessThan(8);

    world.dispose();
  });
});

describe("3D Rigid Body Physics Engine — Continuous Collision Detection (CCD)", () => {
  it("prevents tunneling through thin static obstacles at high speeds", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    // Thin barrier at z = 0 (thickness 0.1)
    world.addBody({
      type: "static",
      position: vec3(0, 0, 0),
      colliders: [createCollider3D(createBoxShape(vec3(10, 10, 0.05)))],
    });

    // High velocity sphere bullet approaching at 120 m/s from z = -2
    // With dt = 1/60, displacement is 2.0m! Without CCD, it jumps to z = 0.0 or beyond!
    const bullet = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, -2),
      linearVelocity: vec3(0, 0, 120),
      mass: 0.2,
      enableCCD: true,
      colliders: [createCollider3D(createSphereShape(0.2))],
    });

    world.step(1 / 60);

    // With CCD, the bullet must be clamped before crossing through the obstacle
    expect(bullet.transform.position.z).toBeLessThanOrEqual(0.1);

    world.dispose();
  });
});

describe("3D Rigid Body Physics Engine — Sleeping & Wake-on-Contact", () => {
  it("puts a body to sleep after remaining under kinetic energy threshold", () => {
    const world = createPhysicsWorld3D({
      gravity: vec3(0, 0, 0),
      enableSleeping: true,
      sleepThreshold: 0.1,
      timeBeforeSleep: 0.2,
    });
    world.start();

    const body = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      mass: 1.0,
      linearVelocity: vec3(0.01, 0, 0), // Very low energy
      allowSleep: true,
    });

    expect(world.isBodySleeping(body.id)).toBe(false);

    // Step past sleep duration
    for (let i = 0; i < 20; i++) {
      world.step(0.02);
    }

    expect(world.isBodySleeping(body.id)).toBe(true);
    expect(body.linearVelocity).toEqual({ x: 0, y: 0, z: 0 });

    world.dispose();
  });

  it("wakes sleeping bodies upon collision contact with active bodies", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0), maxSubsteps: 10 });
    world.start();

    // Sleeping body resting at x = 2
    const sleepingBody = world.addBody({
      type: "dynamic",
      position: vec3(2, 0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createSphereShape(1))],
    });
    world.sleepBody(sleepingBody.id);
    expect(world.isBodySleeping(sleepingBody.id)).toBe(true);

    // Incoming awake body moving at 10 m/s towards x = 2
    const awakeBody = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      linearVelocity: vec3(10, 0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createSphereShape(1))],
    });

    world.step(0.1);

    // Wake-on-contact: sleeping body must now be awake and moving!
    expect(world.isBodySleeping(sleepingBody.id)).toBe(false);
    expect(sleepingBody.linearVelocity.x).toBeGreaterThan(0);

    world.dispose();
  });
});

describe("3D Rigid Body Physics Engine — Stacking Stability & Benchmarks", () => {
  it("maintains stable vertical box stacking without jitter or explosions", () => {
    const stacking = benchmarkStacking(1, 4, 40);
    expect(stacking.bodyCount).toBe(4);
    expect(stacking.stable).toBe(true);
    expect(stacking.avgStepMs).toBeLessThan(10);
  });

  it("runs 100-body multi-rigid-body simulation benchmark with high throughput", () => {
    const bench100 = benchmarkRigidBodies(100, 20);
    expect(bench100.bodyCount).toBe(100);
    expect(bench100.steps).toBe(20);
    expect(bench100.avgStepMs).toBeGreaterThan(0);
    expect(bench100.fpsEquivalent).toBeGreaterThan(30);
  });

  it("verifies CCD benchmark preventing tunneling under extreme speeds", () => {
    const ccdBench = benchmarkCCD(100);
    expect(ccdBench.tunneled).toBe(false);
    expect(ccdBench.finalPositionZ).toBeLessThanOrEqual(0.1);
  });
});
