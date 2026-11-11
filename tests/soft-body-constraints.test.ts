/**
 * AF Motion — 3D Soft Body & Advanced Constraints Test Suite
 *
 * Comprehensive validation of Position-Based Dynamics (PBD/XPBD), deformable bodies,
 * cloth simulation with wind coupling and tearing, ropes and cables, articulated rigid-body
 * constraints (Hinge, Slider, Cone-Twist, Ball-and-Socket, Fixed, Spring), motors, limits,
 * connected body island sleeping, breaking thresholds, and performance benchmarks.
 */

import { describe, it, expect } from "vitest";
import {
  createPhysicsWorld3D,
  createSoftBody3D,
  createCloth3D,
  createRope3D,
  createChain3D,
  createDistanceConstraint3D,
  createHingeConstraint3D,
  createSliderConstraint3D,
  createConeTwistConstraint3D,
  createBallAndSocketConstraint3D,
  createGeneric6DOFConstraint3D,
  createFixedConstraint3D,
  createSpringConstraint3D,
  computeMeshVolume,
  computeSoftBodyAABB,
  computeConstraintIslands,
  createBoxShape,
  createSphereShape,
  createCollider3D,
  vec3,
  benchmarkRope,
  benchmarkCloth,
  benchmarkSoftBodies,
  benchmarkArticulatedChain,
} from "../src/3d/physics/index.js";

describe("3D Soft Body Physics — PBD & XPBD Deformable Bodies", () => {
  it("initializes particles with correct mass distribution, rest positions, and AABB", () => {
    const softBody = createSoftBody3D({
      particles: [
        { position: vec3(0, 0, 0), mass: 2.0 },
        { position: vec3(1, 0, 0), mass: 2.0 },
        { position: vec3(0, 1, 0), mass: 2.0 },
        { position: vec3(0, 0, 1), mass: 0, pinned: true }, // Pinned node
      ],
    });

    expect(softBody.particleCount).toBe(4);
    expect(softBody.positions).toHaveLength(12);
    expect(softBody.invMasses[0]).toBeCloseTo(0.5, 4);
    expect(softBody.invMasses[3]).toBe(0); // Pinned node has zero inverse mass
    expect(softBody.pinnedIndices?.has(3)).toBe(true);

    expect(softBody.aabb.min.x).toBeLessThan(0);
    expect(softBody.aabb.max.x).toBeGreaterThan(1);
  });

  it("predicts particle positions and reconstructs velocities under gravity", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -10, 0) });
    world.start();

    const softBody = createSoftBody3D({
      particles: [
        { position: vec3(0, 5, 0), mass: 1.0 },
      ],
    });
    world.addSoftBody(softBody);

    world.step(0.1);

    // Particle should have accelerated downwards
    expect(softBody.positions[1]).toBeLessThan(5);
    expect(softBody.velocities[1]).toBeLessThan(0);

    world.dispose();
  });

  it("enforces distance constraints via XPBD compliance without energy explosion", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -10, 0) });
    world.start();

    // Two particles connected by a distance constraint, top particle pinned at (0, 5, 0)
    const softBody = createSoftBody3D({
      particles: [
        { position: vec3(0, 5, 0), pinned: true },
        { position: vec3(0, 4, 0), mass: 1.0 },
      ],
      constraints: [
        {
          type: "distance",
          particleA: 0,
          particleB: 1,
          restLength: 1.0,
          compliance: 0, // Rigid XPBD
          stiffness: 1.0,
        },
      ],
    });
    world.addSoftBody(softBody);

    // Step for 1 second
    for (let i = 0; i < 60; i++) {
      world.step(1 / 60);
    }

    // Top particle remained pinned
    expect(softBody.positions[0]).toBe(0);
    expect(softBody.positions[1]).toBe(5);
    expect(softBody.positions[2]).toBe(0);

    // Bottom particle should hang at rest length ~1.0m below top particle
    const dy = softBody.positions[1] - softBody.positions[4];
    expect(dy).toBeCloseTo(1.0, 2);

    world.dispose();
  });

  it("conserves volume in closed 3D tetrahedral / polygonal soft body meshes", () => {
    // Regular tetrahedron vertices
    const v0 = vec3(1, 1, 1);
    const v1 = vec3(-1, -1, 1);
    const v2 = vec3(-1, 1, -1);
    const v3 = vec3(1, -1, -1);

    const positions = new Float32Array([
      v0.x, v0.y, v0.z,
      v1.x, v1.y, v1.z,
      v2.x, v2.y, v2.z,
      v3.x, v3.y, v3.z,
    ]);

    // 4 outward triangles
    const indices = new Uint32Array([
      0, 1, 2,
      0, 2, 3,
      0, 3, 1,
      1, 3, 2,
    ]);

    const initialVolume = computeMeshVolume(positions, indices);
    expect(initialVolume).toBeGreaterThan(0);

    const softBody = createSoftBody3D({
      particles: positions,
      indices,
      volumeStiffness: 0.9,
    });

    expect(softBody.restVolume).toBeCloseTo(initialVolume, 3);
  });

  it("preserves rest shape using shape-matching constraints", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    // 4 particles forming a square
    const softBody = createSoftBody3D({
      particles: [
        { position: vec3(0, 0, 0) },
        { position: vec3(1, 0, 0) },
        { position: vec3(1, 1, 0) },
        { position: vec3(0, 1, 0) },
      ],
      stiffness: 0.8,
    });
    world.addSoftBody(softBody);

    // Perturb one corner heavily
    softBody.positions[0] = 5.0;
    softBody.positions[1] = 5.0;

    for (let i = 0; i < 20; i++) {
      world.step(1 / 60);
    }

    // Shape matching must restore the square relative distances
    const d01 = Math.hypot(
      softBody.positions[3] - softBody.positions[0],
      softBody.positions[4] - softBody.positions[1],
      softBody.positions[5] - softBody.positions[2]
    );
    expect(d01).toBeCloseTo(1.0, 1);

    world.dispose();
  });
});

describe("3D Soft Body Physics — Cloth Simulation", () => {
  it("generates grid-based cloth meshes with structural, shear, and bending links", () => {
    const cloth = createCloth3D({
      width: 2.0,
      height: 2.0,
      segmentsX: 4,
      segmentsY: 4,
      pinTopEdge: true,
    });

    // 5x5 grid = 25 particles
    expect(cloth.particleCount).toBe(25);
    expect(cloth.indices?.length).toBe(4 * 4 * 6); // 16 quads * 2 tris * 3 indices = 96
    expect(cloth.pinnedIndices?.size).toBe(5); // 5 particles along top edge

    // Verify presence of structural, shear, and bending constraints
    const types = new Set(cloth.constraints?.map((c) => c.type));
    expect(types.has("structural")).toBe(true);
    expect(types.has("shear")).toBe(true);
    expect(types.has("bending")).toBe(true);
  });

  it("deflects cloth under aerodynamic wind coupling", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0) });
    world.start();

    // Hanging cloth pinned at top edge
    const cloth = createCloth3D({
      width: 2.0,
      height: 2.0,
      segmentsX: 4,
      segmentsY: 4,
      position: vec3(0, 5, 0),
      pinTopEdge: true,
      windInteraction: { dragCoefficient: 0.8 },
    });
    world.addSoftBody(cloth);

    // Strong wind blowing in +Z
    world.setWind(vec3(0, 0, 15));

    for (let i = 0; i < 30; i++) {
      world.step(1 / 60);
    }

    // Bottom corners must be pushed forward in +Z by wind
    const bottomZ = cloth.positions[cloth.positions.length - 1];
    expect(bottomZ).toBeGreaterThan(0.2);

    world.dispose();
  });

  it("supports tearable cloth under extreme tensile elongation", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    let tornEventReceived = false;
    world.on("clothTear", (e) => {
      tornEventReceived = true;
      expect(e.strain).toBeGreaterThan(0.5);
    });

    const cloth = createCloth3D({
      width: 1.0,
      height: 1.0,
      segmentsX: 2,
      segmentsY: 2,
      tearable: true,
      tearStrainThreshold: 0.5,
    });
    world.addSoftBody(cloth);

    // Pull bottom-right corner extremely far away to exceed 50% strain
    const lastIdx = cloth.positions.length - 3;
    cloth.positions[lastIdx] = 100.0;
    cloth.positions[lastIdx + 1] = 100.0;

    world.step(1 / 60);

    expect(tornEventReceived).toBe(true);

    world.dispose();
  });

  it("handles cloth collision with static ground and obstacles", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0), groundY: 0 });
    world.start();

    // Dropping flat cloth over ground
    const cloth = createCloth3D({
      width: 1.0,
      height: 1.0,
      segmentsX: 2,
      segmentsY: 2,
      position: vec3(0, 0.5, 0),
      orientation: "xz",
    });
    world.addSoftBody(cloth);

    for (let i = 0; i < 30; i++) {
      world.step(1 / 60);
    }

    // All particles must rest at or above ground level (y >= 0)
    for (let p = 0; p < cloth.particleCount; p++) {
      expect(cloth.positions[p * 3 + 1]).toBeGreaterThanOrEqual(-0.05);
    }

    world.dispose();
  });
});

describe("3D Soft Body Physics — Ropes & Flexible Cables", () => {
  it("creates discretized ropes with segment distance and straightness constraints", () => {
    const rope = createRope3D({
      length: 4.0,
      segments: 8,
      startPosition: vec3(0, 4, 0),
      pinnedStart: true,
      pinnedEnd: false,
    });

    expect(rope.particleCount).toBe(9);
    expect(rope.pinnedIndices?.has(0)).toBe(true);
    expect(rope.pinnedIndices?.has(8)).toBe(false);

    // 8 structural + 7 bending constraints = 15 constraints
    expect(rope.constraints?.length).toBe(15);
  });

  it("maintains rope length while swinging under gravity", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0) });
    world.start();

    const rope = createRope3D({
      length: 3.0,
      segments: 6,
      startPosition: vec3(0, 5, 0),
      direction: vec3(1, 0, 0), // Starts horizontally
      pinnedStart: true,
    });
    world.addSoftBody(rope);

    // Swing down under gravity
    for (let i = 0; i < 40; i++) {
      world.step(1 / 60);
    }

    // Tip of rope should have swung downwards
    const tipY = rope.positions[rope.positions.length - 2];
    expect(tipY).toBeLessThan(5.0);

    // Distance from start to tip cannot exceed 3.0m + small elastic tolerance
    const tipX = rope.positions[rope.positions.length - 3];
    const tipZ = rope.positions[rope.positions.length - 1];
    const totalDist = Math.hypot(tipX, tipY - 5.0, tipZ);
    expect(totalDist).toBeLessThanOrEqual(3.1);

    world.dispose();
  });

  it("attaches dynamic rope endpoints to moving rigid bodies", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    // Kinematic moving anchor body
    const movingAnchor = world.addBody({
      type: "kinematic",
      position: vec3(0, 5, 0),
      linearVelocity: vec3(2, 0, 0),
    });

    const rope = createRope3D({
      length: 2.0,
      segments: 4,
      startPosition: vec3(0, 5, 0),
      pinnedStart: false,
      attachStartToBodyId: movingAnchor.id,
      attachStartPivot: vec3(0, 0, 0),
    });
    world.addSoftBody(rope);

    for (let i = 0; i < 6; i++) {
      world.step(1 / 60);
    }

    // Anchor moved by 2 * 0.1 = 0.2m along X
    expect(movingAnchor.transform.position.x).toBeCloseTo(0.2, 2);
    // Rope start node followed the moving anchor
    expect(rope.positions[0]).toBeCloseTo(0.2, 2);

    world.dispose();
  });
});

describe("3D Physics — Advanced Rigid Body Constraints", () => {
  it("enforces Point-to-Point (Ball-and-Socket) constraint allowing 3DOF rotation", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, -9.81, 0) });
    world.start();

    const staticAnchor = world.addBody({
      type: "static",
      position: vec3(0, 5, 0),
    });

    const pendulum = world.addBody({
      type: "dynamic",
      position: vec3(2, 5, 0),
      mass: 1.0,
      colliders: [createCollider3D(createSphereShape(0.5))],
    });

    world.addConstraint(
      createBallAndSocketConstraint3D({
        bodyAId: staticAnchor.id,
        bodyBId: pendulum.id,
        pivotA: vec3(0, 0, 0),
        pivotB: vec3(-2, 0, 0),
      })
    );

    for (let i = 0; i < 30; i++) {
      world.step(1 / 60);
    }

    // Pendulum swings down in arc; distance from anchor (0, 5, 0) remains ~2m
    const dist = Math.hypot(
      pendulum.transform.position.x - 0,
      pendulum.transform.position.y - 5,
      pendulum.transform.position.z - 0
    );
    expect(dist).toBeCloseTo(2.0, 1);
    expect(pendulum.transform.position.y).toBeLessThan(5.0);

    world.dispose();
  });

  it("enforces Hinge Constraint with angular limits and motorized velocity", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    const base = world.addBody({
      type: "static",
      position: vec3(0, 0, 0),
    });

    const arm = world.addBody({
      type: "dynamic",
      position: vec3(1, 0, 0),
      mass: 1.0,
      colliders: [createCollider3D(createBoxShape(vec3(0.5, 0.1, 0.1)))],
    });

    world.addConstraint(
      createHingeConstraint3D({
        bodyAId: base.id,
        bodyBId: arm.id,
        pivotA: vec3(0, 0, 0),
        pivotB: vec3(-1, 0, 0),
        axisA: vec3(0, 0, 1),
        axisB: vec3(0, 0, 1),
        motorEnabled: true,
        motorTargetVelocity: 5.0, // 5 rad/s around Z
        motorMaxForce: 50.0,
      })
    );

    world.step(0.1);

    // Motor should have imparted angular spin around Z
    expect(Math.abs(arm.angularVelocity.z)).toBeGreaterThan(0.5);

    world.dispose();
  });

  it("enforces Slider Constraint restricting translation along single axis with limits", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    const rail = world.addBody({
      type: "static",
      position: vec3(0, 0, 0),
    });

    const carriage = world.addBody({
      type: "dynamic",
      position: vec3(0, 0, 0),
      linearVelocity: vec3(10, 5, 5), // Velocity has Y and Z components
      mass: 1.0,
      colliders: [createCollider3D(createBoxShape(vec3(0.2, 0.2, 0.2)))],
    });

    world.addConstraint(
      createSliderConstraint3D({
        bodyAId: rail.id,
        bodyBId: carriage.id,
        axisA: vec3(1, 0, 0), // Sliding along X only
        lowerLimit: -2.0,
        upperLimit: 2.0,
      })
    );

    for (let i = 0; i < 20; i++) {
      world.step(1 / 60);
    }

    // Orthogonal Y and Z drift must be restricted to ~0
    expect(Math.abs(carriage.transform.position.y)).toBeLessThan(0.05);
    expect(Math.abs(carriage.transform.position.z)).toBeLessThan(0.05);

    // Motion along X is clamped by upperLimit (2.0m)
    expect(carriage.transform.position.x).toBeLessThanOrEqual(2.05);

    world.dispose();
  });

  it("enforces Cone-Twist constraint capping deflection within cone angle", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    const anchor = world.addBody({ type: "static", position: vec3(0, 0, 0) });
    const limb = world.addBody({
      type: "dynamic",
      position: vec3(0, 1, 0),
      angularVelocity: vec3(10, 0, 0), // Deflects limb
      mass: 1.0,
    });

    world.addConstraint(
      createConeTwistConstraint3D({
        bodyAId: anchor.id,
        bodyBId: limb.id,
        axisA: vec3(0, 1, 0),
        axisB: vec3(0, 1, 0),
        coneLimitAngle: Math.PI / 6, // 30 degrees max deflection
      })
    );

    for (let i = 0; i < 15; i++) {
      world.step(1 / 60);
    }

    // Angle of limb axis must not blow past cone limit
    const q = limb.transform.rotation;
    const angle = 2 * Math.acos(Math.min(1, Math.max(-1, q.w)));
    expect(angle).toBeLessThanOrEqual(Math.PI / 6 + 0.1);

    world.dispose();
  });

  it("applies Hookean forces in Spring Constraints", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    const anchor = world.addBody({ type: "static", position: vec3(0, 0, 0) });
    // Body placed 3m away with restLength = 1m
    const bob = world.addBody({
      type: "dynamic",
      position: vec3(3, 0, 0),
      mass: 1.0,
    });

    world.addConstraint(
      createSpringConstraint3D({
        bodyAId: anchor.id,
        bodyBId: bob.id,
        restLength: 1.0,
        stiffness: 50,
        damping: 2,
      })
    );

    world.step(0.1);

    // Spring tension should accelerate bob back towards origin (-X)
    expect(bob.linearVelocity.x).toBeLessThan(0);

    world.dispose();
  });

  it("disables constraints and emits events when exceeding breaking impulse threshold", () => {
    const world = createPhysicsWorld3D({ gravity: vec3(0, 0, 0) });
    world.start();

    let breakEventFired = false;
    world.on("constraintBreak", (e) => {
      breakEventFired = true;
      expect(e.impulse).toBeGreaterThan(10);
    });

    const fixedBase = world.addBody({ type: "static", position: vec3(0, 0, 0) });
    // Heavy body pulled away with extreme force
    const child = world.addBody({
      type: "dynamic",
      position: vec3(10, 0, 0),
      mass: 100.0,
    });

    const breakable = createDistanceConstraint3D({
      bodyAId: fixedBase.id,
      bodyBId: child.id,
      distance: 1.0,
      breakingImpulse: 20, // Low breaking threshold
    });
    world.addConstraint(breakable);

    world.step(1 / 60);

    expect(breakEventFired).toBe(true);
    expect(breakable.enabled).toBe(false);

    world.dispose();
  });
});

describe("3D Physics — Articulated Structures & Islands", () => {
  it("decomposes connected mechanisms into topological constraint islands", () => {
    const world = createPhysicsWorld3D();

    const b1 = world.addBody({ type: "dynamic", position: vec3(0, 0, 0) });
    const b2 = world.addBody({ type: "dynamic", position: vec3(1, 0, 0) });
    const b3 = world.addBody({ type: "dynamic", position: vec3(2, 0, 0) });

    // Independent pair
    const b4 = world.addBody({ type: "dynamic", position: vec3(10, 0, 0) });
    const b5 = world.addBody({ type: "dynamic", position: vec3(11, 0, 0) });

    // Island 1: b1 <-> b2 <-> b3
    const c1 = createBallAndSocketConstraint3D({ bodyAId: b1.id, bodyBId: b2.id });
    const c2 = createBallAndSocketConstraint3D({ bodyAId: b2.id, bodyBId: b3.id });
    // Island 2: b4 <-> b5
    const c3 = createBallAndSocketConstraint3D({ bodyAId: b4.id, bodyBId: b5.id });

    world.addConstraint(c1);
    world.addConstraint(c2);
    world.addConstraint(c3);

    const islands = computeConstraintIslands(
      new Map([
        [b1.id, b1], [b2.id, b2], [b3.id, b3], [b4.id, b4], [b5.id, b5],
      ]),
      [c1, c2, c3]
    );

    expect(islands).toHaveLength(2);
    expect(islands[0].bodyIds.size).toBe(3);
    expect(islands[1].bodyIds.size).toBe(2);

    world.dispose();
  });

  it("synchronizes island sleeping when entire articulated mechanism comes to rest", () => {
    const world = createPhysicsWorld3D({
      gravity: vec3(0, 0, 0),
      enableSleeping: true,
      sleepThreshold: 0.1,
      timeBeforeSleep: 0.1,
    });
    world.start();

    const b1 = world.addBody({ type: "dynamic", position: vec3(0, 0, 0), linearVelocity: vec3(0.01, 0, 0) });
    const b2 = world.addBody({ type: "dynamic", position: vec3(1, 0, 0), linearVelocity: vec3(0.01, 0, 0) });

    world.addConstraint(createBallAndSocketConstraint3D({ bodyAId: b1.id, bodyBId: b2.id }));

    for (let i = 0; i < 20; i++) {
      world.step(0.02);
    }

    // Both bodies in island should sleep together
    expect(world.isBodySleeping(b1.id)).toBe(true);
    expect(world.isBodySleeping(b2.id)).toBe(true);

    world.dispose();
  });
});

describe("3D Physics — Soft Body & Constraint Benchmarks", () => {
  it("benchmarks 100-node rope simulation with high throughput", () => {
    const ropeBench = benchmarkRope(100, 20);
    expect(ropeBench.segments).toBe(100);
    expect(ropeBench.steps).toBe(20);
    expect(ropeBench.avgStepMs).toBeLessThan(10);
    expect(ropeBench.lengthMaintained).toBe(true);
  });

  it("benchmarks 20x20 cloth mesh simulation with stable frame rate", () => {
    const clothBench = benchmarkCloth(20, 20);
    expect(clothBench.resolution).toBe(20);
    expect(clothBench.particleCount).toBe(441);
    expect(clothBench.avgStepMs).toBeLessThan(15);
  });

  it("benchmarks multiple simultaneous soft bodies", () => {
    const multiBench = benchmarkSoftBodies(5, 20);
    expect(multiBench.bodyCount).toBe(5);
    expect(multiBench.totalParticles).toBe(55);
    expect(multiBench.avgStepMs).toBeLessThan(10);
  });

  it("benchmarks articulated rigid-body chain mechanism", () => {
    const chainBench = benchmarkArticulatedChain(8, 20);
    expect(chainBench.links).toBe(8);
    expect(chainBench.intact).toBe(true);
    expect(chainBench.avgStepMs).toBeLessThan(10);
  });
});
