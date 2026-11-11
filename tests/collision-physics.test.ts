// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  createCollisionWorld,
  pointInCircle,
  pointInRectangle,
  pointInSphere,
  pointInBox,
  intersectCircleCircle,
  intersectRectangleRectangle,
  intersectCircleRectangle,
  intersectSphereSphere,
  intersectBoxBox,
  computeBodyAABB,
  aabbOverlap,
  canCollide,
  detectBodyCollision,
  resolveCollisionImpulse,
  resolvePositionalCorrection,
  resolveContactBatch,
  resolveConstraint,
  createVector,
  PhysicsLifecycleError,
  PhysicsNumericalError,
  type CollisionBody,
  type CollisionContact,
  type CollisionConstraint,
} from "../src/catalogue.js";

describe("Prompt 102 — Collision & Constraint Engine", () => {
  describe("1. Point Containment & Geometry Tests", () => {
    it("tests point in 2D circle containment", () => {
      const center = createVector(10, 20);
      const radius = 5;

      expect(pointInCircle(createVector(10, 20), center, radius)).toBe(true);
      expect(pointInCircle(createVector(13, 24), center, radius)).toBe(true); // 3^2 + 4^2 = 25 <= 25
      expect(pointInCircle(createVector(15, 25), center, radius)).toBe(false); // 5^2 + 5^2 = 50 > 25
    });

    it("tests point in 2D rectangle containment", () => {
      const center = createVector(0, 0);
      const width = 20;
      const height = 10;

      expect(pointInRectangle(createVector(0, 0), center, width, height)).toBe(true);
      expect(pointInRectangle(createVector(9, 4), center, width, height)).toBe(true);
      expect(pointInRectangle(createVector(11, 4), center, width, height)).toBe(false);
      expect(pointInRectangle(createVector(5, 6), center, width, height)).toBe(false);
    });

    it("tests point in 3D sphere containment", () => {
      const center = createVector(0, 0, 0);
      const radius = 10;

      expect(pointInSphere(createVector(0, 0, 0), center, radius)).toBe(true);
      expect(pointInSphere(createVector(5, 5, 5), center, radius)).toBe(true); // 25 + 25 + 25 = 75 <= 100
      expect(pointInSphere(createVector(8, 8, 8), center, radius)).toBe(false); // 64 * 3 = 192 > 100
    });

    it("tests point in 3D box containment", () => {
      const center = createVector(0, 0, 0);

      expect(pointInBox(createVector(1, 2, 3), center, 10, 10, 10)).toBe(true);
      expect(pointInBox(createVector(6, 2, 3), center, 10, 10, 10)).toBe(false);
    });
  });

  describe("2. Narrow-Phase Collision Detection", () => {
    it("detects 2D circle-to-circle collision with contact point, normal, and penetration", () => {
      const posA = createVector(0, 0);
      const radiusA = 10;
      const posB = createVector(15, 0);
      const radiusB = 10;

      // Overlap: radiusA + radiusB = 20, dist = 15 -> penetration = 5
      const res = intersectCircleCircle(posA, radiusA, posB, radiusB);
      expect(res.collided).toBe(true);
      expect(res.penetration).toBeCloseTo(5);
      expect(res.normal.x).toBeCloseTo(1);
      expect(res.normal.y).toBeCloseTo(0);
      expect(res.contactPoint.x).toBeCloseTo(7.5);
    });

    it("detects non-colliding separated circles", () => {
      const res = intersectCircleCircle(createVector(0, 0), 5, createVector(20, 0), 5);
      expect(res.collided).toBe(false);
    });

    it("handles concentric circles gracefully without numerical division by zero", () => {
      const res = intersectCircleCircle(createVector(5, 5), 10, createVector(5, 5), 10);
      expect(res.collided).toBe(true);
      expect(res.penetration).toBe(20);
      expect(Number.isFinite(res.normal.x)).toBe(true);
    });

    it("detects 2D rectangle-to-rectangle collision and resolves along axis of least penetration", () => {
      const posA = createVector(0, 0);
      const posB = createVector(15, 0);

      // Width = 20, so half-widths = 10 each. Overlap = 10 + 10 - 15 = 5 along X
      const res = intersectRectangleRectangle(posA, 20, 20, posB, 20, 20);
      expect(res.collided).toBe(true);
      expect(res.penetration).toBeCloseTo(5);
      expect(res.normal.x).toBe(1);
      expect(res.normal.y).toBe(0);
    });

    it("detects 2D circle-to-rectangle collision accurately", () => {
      const posCircle = createVector(0, 12);
      const radius = 5;
      const posRect = createVector(0, 0);
      const width = 20;
      const height = 10;

      // Rect top edge is at y = 5. Circle bottom edge is at y = 7 -> no collision
      const sep = intersectCircleRectangle(posCircle, radius, posRect, width, height, true);
      expect(sep.collided).toBe(false);

      // Circle moved to y = 8. Circle bottom edge is at y = 3 -> overlaps rect top edge by 2
      const hit = intersectCircleRectangle(createVector(0, 8), radius, posRect, width, height, true);
      expect(hit.collided).toBe(true);
      expect(hit.penetration).toBeCloseTo(2);
      expect(hit.normal.y).toBeCloseTo(-1); // Points from circle to rect (downward)
    });

    it("detects 3D sphere-to-sphere collision", () => {
      const res = intersectSphereSphere(
        createVector(0, 0, 0),
        10,
        createVector(0, 0, 16),
        10
      );
      expect(res.collided).toBe(true);
      expect(res.penetration).toBeCloseTo(4);
      expect(res.normal.z).toBeCloseTo(1);
    });

    it("detects 3D box-to-box collision along minimum penetration axis", () => {
      const res = intersectBoxBox(
        createVector(0, 0, 0),
        { sizeX: 10, sizeY: 10, sizeZ: 10 },
        createVector(0, 0, 8),
        { sizeX: 10, sizeY: 10, sizeZ: 10 }
      );
      expect(res.collided).toBe(true);
      expect(res.penetration).toBeCloseTo(2);
      expect(res.normal.z).toBe(1);
    });
  });

  describe("3. Broad-Phase Filtering & AABB Mechanics", () => {
    it("computes AABBs and determines bounding box overlap", () => {
      const bodyA: CollisionBody = {
        id: "a",
        type: "dynamic",
        shape: { type: "circle", radius: 5 },
        position: createVector(10, 10),
        velocity: createVector(0, 0),
        mass: 1,
        invMass: 1,
        restitution: 0.8,
        friction: 0.2,
        linearDamping: 0,
        isTrigger: false,
        layer: 1,
        mask: 0xffffffff,
      };

      const bodyB: CollisionBody = {
        id: "b",
        type: "dynamic",
        shape: { type: "rectangle", width: 10, height: 10 },
        position: createVector(15, 10),
        velocity: createVector(0, 0),
        mass: 1,
        invMass: 1,
        restitution: 0.8,
        friction: 0.2,
        linearDamping: 0,
        isTrigger: false,
        layer: 1,
        mask: 0xffffffff,
      };

      const aabbA = computeBodyAABB(bodyA);
      const aabbB = computeBodyAABB(bodyB);

      expect(aabbA.min).toEqual(createVector(5, 5));
      expect(aabbA.max).toEqual(createVector(15, 15));
      expect(aabbOverlap(aabbA, aabbB)).toBe(true);
    });

    it("filters collisions using layer and mask bitmasks", () => {
      const makeBody = (id: string, layer: number, mask: number, type: "dynamic" | "static" = "dynamic"): CollisionBody => ({
        id,
        type,
        shape: { type: "circle", radius: 5 },
        position: createVector(0, 0),
        velocity: createVector(0, 0),
        mass: 1,
        invMass: 1,
        restitution: 0.8,
        friction: 0.2,
        linearDamping: 0,
        isTrigger: false,
        layer,
        mask,
      });

      const body1 = makeBody("1", 0b0001, 0b0010);
      const body2 = makeBody("2", 0b0010, 0b0001);
      const body3 = makeBody("3", 0b0100, 0b1000);

      expect(canCollide(body1, body2)).toBe(true);
      expect(canCollide(body1, body3)).toBe(false);

      // Static-static bodies never collide
      const staticA = makeBody("s1", 1, 1, "static");
      const staticB = makeBody("s2", 1, 1, "static");
      expect(canCollide(staticA, staticB)).toBe(false);
    });
  });

  describe("4. Collision Response & Impulse Resolution", () => {
    it("simulates perfectly elastic collision (e = 1) between identical masses: velocities exchange", () => {
      const world = createCollisionWorld({
        gravity: 0,
        timestep: 0.01,
      });

      // Body A moving right at +100 px/s, Body B moving left at -100 px/s
      const bodyA = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(0, 0),
        velocity: createVector(100, 0),
        mass: 1.0,
        restitution: 1.0,
        friction: 0,
        linearDamping: 0,
      });

      const bodyB = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(15, 0), // Overlapping by 5px
        velocity: createVector(-100, 0),
        mass: 1.0,
        restitution: 1.0,
        friction: 0,
        linearDamping: 0,
      });

      world.step(0.01);

      // Velocities should exchange: bodyA moves left, bodyB moves right
      expect(bodyA.velocity.x).toBeLessThan(0);
      expect(bodyB.velocity.x).toBeGreaterThan(0);
      expect(Math.abs(bodyA.velocity.x)).toBeCloseTo(100, 0);
      expect(Math.abs(bodyB.velocity.x)).toBeCloseTo(100, 0);
    });

    it("simulates mass-aware momentum transfer: heavy body pushes light body", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      // Heavy body (mass = 10) moving right at +50 px/s
      const heavy = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(0, 0),
        velocity: createVector(50, 0),
        mass: 10.0,
        restitution: 1.0,
      });

      // Light body (mass = 1) at rest
      const light = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(15, 0),
        velocity: createVector(0, 0),
        mass: 1.0,
        restitution: 1.0,
      });

      world.step(0.01);

      // Light body shoots forward with higher velocity than heavy body had
      expect(light.velocity.x).toBeGreaterThan(50);
      // Heavy body continues forward with only slightly decreased velocity
      expect(heavy.velocity.x).toBeGreaterThan(30);
    });

    it("bounces dynamic body off static wall without moving the static body", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const ball = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(0, 0),
        velocity: createVector(100, 0),
        mass: 1.0,
        restitution: 0.8,
      });

      const wall = world.addBody({
        type: "static",
        shape: { type: "rectangle", width: 10, height: 100 },
        position: createVector(7, 0), // Contact with ball
        velocity: createVector(0, 0),
      });

      world.step(0.01);

      // Static wall never moves
      expect(wall.velocity.x).toBe(0);
      expect(wall.position.x).toBe(7);

      // Ball reverses velocity with restitution 0.8
      expect(ball.velocity.x).toBeCloseTo(-80, 0);
    });

    it("separates overlapping bodies via Baumgarte positional correction", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const a = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(0, 0),
        velocity: createVector(0, 0),
        mass: 1.0,
      });

      const b = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(10, 0), // Overlaps by 10px (dist = 10, sum = 20)
        velocity: createVector(0, 0),
        mass: 1.0,
      });

      // Step simulation to trigger collision resolution
      world.step(0.01);

      // Distance between centers should have increased toward 20
      const dist = b.position.x - a.position.x;
      expect(dist).toBeGreaterThan(15);
    });

    it("detects triggers without applying physical impulse", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const player = world.addBody({
        shape: { type: "circle", radius: 10 },
        position: createVector(0, 0),
        velocity: createVector(100, 0),
        linearDamping: 0,
      });

      const sensor = world.addBody({
        shape: { type: "rectangle", width: 20, height: 20 },
        position: createVector(10, 0),
        isTrigger: true,
      });

      const stepRes = world.step(0.01);

      // Contact was detected
      expect(stepRes.contacts.length).toBeGreaterThan(0);
      // Player's velocity was NOT altered by trigger sensor
      expect(player.velocity.x).toBe(100);
    });
  });

  describe("5. Physical Constraints", () => {
    it("enforces fixed anchor constraint", () => {
      const world = createCollisionWorld({ gravity: createVector(0, 980), timestep: 0.01 });

      const body = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(100, 100),
      });

      world.addConstraint({
        type: "fixed",
        bodyA: body,
        anchor: createVector(100, 100),
        stiffness: 1.0,
      });

      for (let i = 0; i < 20; i++) world.step(0.01);

      // Body remains firmly anchored at (100, 100) despite downward gravity
      expect(body.position.x).toBeCloseTo(100);
      expect(body.position.y).toBeCloseTo(100);
    });

    it("enforces distance rod constraint between two bodies", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const a = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(0, 0),
      });

      const b = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(100, 0),
      });

      // Target distance is 50px (currently at 100px)
      world.addConstraint({
        type: "distance",
        bodyA: a,
        bodyB: b,
        targetDistance: 50,
        stiffness: 1.0,
      });

      world.step(0.01);

      // Distance should pull together toward 50px
      const dist = b.position.x - a.position.x;
      expect(dist).toBeCloseTo(50, 0);
    });

    it("simulates spring constraint with Hookean restoring force", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const a = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(0, 0),
      });

      // Stretched 50px beyond target distance 50px -> total 100px
      const b = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(100, 0),
      });

      world.addConstraint({
        type: "spring",
        bodyA: a,
        bodyB: b,
        targetDistance: 50,
        stiffness: 200,
        damping: 10,
      });

      world.step(0.01);

      // Spring exerts pulling force: b acquires negative X velocity, a acquires positive X velocity
      expect(b.velocity.x).toBeLessThan(0);
      expect(a.velocity.x).toBeGreaterThan(0);
    });

    it("enforces axis constraint locking motion along an axis", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const body = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(0, 0),
        velocity: createVector(100, 100),
      });

      // Lock X axis (restricts movement to Y only, fixing X at 0)
      world.addConstraint({
        type: "axis",
        bodyA: body,
        axis: "x",
        anchor: createVector(0, 0),
      });

      world.step(0.01);

      expect(body.position.x).toBe(0);
      expect(body.velocity.x).toBe(0);
    });

    it("enforces min-max distance rope constraint", () => {
      const world = createCollisionWorld({ gravity: 0, timestep: 0.01 });

      const a = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(0, 0),
      });

      // Placed at 100px, rope max length is 60px
      const b = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(100, 0),
      });

      world.addConstraint({
        type: "min-max-distance",
        bodyA: a,
        bodyB: b,
        minDistance: 20,
        maxDistance: 60,
        stiffness: 1.0,
      });

      world.step(0.01);

      // Pulled together to maxDistance 60px
      const dist = b.position.x - a.position.x;
      expect(dist).toBeCloseTo(60, 0);
    });
  });

  describe("6. World Lifecycle & Management API", () => {
    it("adds, retrieves, updates, and removes bodies dynamically", () => {
      const world = createCollisionWorld();

      const b1 = world.addBody({
        id: "hero",
        shape: { type: "circle", radius: 12 },
        position: createVector(50, 50),
      });

      expect(world.getBody("hero")).toBe(b1);
      expect(world.getBodies()).toHaveLength(1);

      world.updateBody("hero", {
        position: createVector(75, 75),
        restitution: 0.5,
      });

      expect(b1.position).toEqual(createVector(75, 75));
      expect(b1.restitution).toBe(0.5);

      const removed = world.removeBody("hero");
      expect(removed).toBe(true);
      expect(world.getBodies()).toHaveLength(0);
    });

    it("handles world gravity and boundary clamps", () => {
      const world = createCollisionWorld({
        gravity: createVector(0, 500),
        bounds: {
          min: createVector(0, 0),
          max: createVector(200, 200),
        },
      });

      const body = world.addBody({
        shape: { type: "circle", radius: 5 },
        position: createVector(100, 190),
      });

      // Step until hitting the floor (y = 200)
      for (let i = 0; i < 20; i++) world.step(0.01);

      expect(body.position.y).toBeLessThanOrEqual(200);
      expect(world.getGravity().y).toBe(500);
    });

    it("resets and disposes the world cleanly", () => {
      const world = createCollisionWorld();
      world.addBody({ shape: { type: "circle", radius: 5 } });

      world.reset();
      expect(world.isDisposed()).toBe(false);

      world.dispose();
      expect(world.isDisposed()).toBe(true);
      expect(() => world.step()).toThrow(PhysicsLifecycleError);
    });
  });
});
