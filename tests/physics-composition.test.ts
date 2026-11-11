// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  createPhysicsComposition,
  createSpringBehavior,
  createInertialBehavior,
  createGravityBehavior,
  createBoundedBehavior,
  createCollisionBehavior,
  createConstrainedBehavior,
  createSpringInertiaBehavior,
  createMultiForceBehavior,
  getPhysicsRecipe,
  listPhysicsRecipes,
  asChoreographyParticipant,
  validatePhysicsCompositionConfig,
  correctPhysicsCompositionConfig,
  PhysicsCompositionValidationError,
  PhysicsLifecycleError,
  createVector,
  type PhysicsCompositionState,
} from "../src/catalogue.js";

describe("Prompt 103 — Physics-Based Motion Composition", () => {
  describe("1. Modular Motion Behaviors", () => {
    it("simulates spring-driven motion pulling body toward equilibrium target", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "ball",
            shape: { type: "circle", radius: 10 },
            position: createVector(100, 0),
            velocity: createVector(0, 0),
            mass: 1.0,
          },
        ],
        behaviors: [
          createSpringBehavior({
            target: createVector(0, 0),
            stiffness: 150,
            damping: 10,
            targetBodyIds: ["ball"],
          }),
        ],
      });

      comp.start();
      for (let i = 0; i < 20; i++) comp.step(0.01);

      const ball = comp.getBody("ball")!;
      // Ball has moved left towards target 0
      expect(ball.position.x).toBeLessThan(100);
      expect(ball.velocity.x).toBeLessThan(0);
    });

    it("simulates inertial decay under viscous friction", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "glider",
            shape: { type: "circle", radius: 10 },
            position: createVector(0, 0),
            velocity: createVector(200, 0),
            mass: 1.0,
          },
        ],
        behaviors: [
          createInertialBehavior({
            friction: 5.0,
            targetBodyIds: ["glider"],
          }),
        ],
      });

      comp.start();
      for (let i = 0; i < 30; i++) comp.step(0.01);

      const glider = comp.getBody("glider")!;
      // Velocity has significantly decayed from 200
      expect(glider.velocity.x).toBeLessThan(50);
      expect(glider.position.x).toBeGreaterThan(0);
    });

    it("simulates directional gravity behavior", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "dropper",
            shape: { type: "circle", radius: 10 },
            position: createVector(0, 0),
            velocity: createVector(0, 0),
          },
        ],
        behaviors: [
          createGravityBehavior({
            gravity: createVector(0, 500),
            targetBodyIds: ["dropper"],
          }),
        ],
      });

      comp.start();
      for (let i = 0; i < 20; i++) comp.step(0.01);

      const dropper = comp.getBody("dropper")!;
      expect(dropper.velocity.y).toBeCloseTo(100, 0); // v = g * t = 500 * 0.2 = 100
      expect(dropper.position.y).toBeGreaterThan(0);
    });

    it("simulates bounded confinement behavior reflecting on boundaries", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "bouncer",
            shape: { type: "circle", radius: 10 },
            position: createVector(95, 0),
            velocity: createVector(100, 0),
            restitution: 0.8,
          },
        ],
        behaviors: [
          createBoundedBehavior({
            bounds: {
              min: createVector(0, 0),
              max: createVector(100, 100),
            },
            targetBodyIds: ["bouncer"],
          }),
        ],
      });

      comp.start();
      for (let i = 0; i < 15; i++) comp.step(0.01);

      const bouncer = comp.getBody("bouncer")!;
      // Reached x = 100 and bounced backwards
      expect(bouncer.position.x).toBeLessThanOrEqual(100);
      expect(bouncer.velocity.x).toBeLessThan(0);
    });

    it("simulates hybrid spring + inertia behavior", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "hybrid_body",
            shape: { type: "circle", radius: 10 },
            position: createVector(50, 50),
            velocity: createVector(0, 0),
            mass: 1.0,
          },
        ],
        behaviors: [
          createSpringInertiaBehavior({
            target: createVector(0, 0),
            stiffness: 100,
            damping: 10,
            friction: 2.0,
          }),
        ],
      });

      comp.start();
      for (let i = 0; i < 50; i++) comp.step(0.01);

      const body = comp.getBody("hybrid_body")!;
      expect(body.position.x).toBeLessThan(50);
      expect(body.position.y).toBeLessThan(50);
    });

    it("simulates multi-force dynamic field behavior", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "particle",
            shape: { type: "circle", radius: 5 },
            position: createVector(0, 0),
            velocity: createVector(0, 0),
            mass: 1.0,
          },
        ],
        behaviors: [
          createMultiForceBehavior({
            forces: [
              () => createVector(50, 0),  // Constant wind along X
              () => createVector(0, 100), // Constant force along Y
            ],
            targetBodyIds: ["particle"],
          }),
        ],
      });

      comp.start();
      for (let i = 0; i < 10; i++) comp.step(0.01);

      const p = comp.getBody("particle")!;
      expect(p.velocity.x).toBeCloseTo(5, 0); // 50 * 0.1s = 5
      expect(p.velocity.y).toBeCloseTo(10, 0); // 100 * 0.1s = 10
    });
  });

  describe("2. Multi-Body System & Interaction", () => {
    it("coordinates multiple dynamic bodies in a shared collision composition", () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "bodyA",
            shape: { type: "circle", radius: 10 },
            position: createVector(0, 0),
            velocity: createVector(100, 0),
            mass: 1.0,
            restitution: 1.0,
          },
          {
            id: "bodyB",
            shape: { type: "circle", radius: 10 },
            position: createVector(15, 0),
            velocity: createVector(-100, 0),
            mass: 1.0,
            restitution: 1.0,
          },
        ],
        behaviors: [createCollisionBehavior()],
      });

      comp.start();
      comp.step(0.01);

      const a = comp.getBody("bodyA")!;
      const b = comp.getBody("bodyB")!;

      // Collided elastically: velocities exchanged
      expect(a.velocity.x).toBeLessThan(0);
      expect(b.velocity.x).toBeGreaterThan(0);
    });

    it("supports dynamic addition, inspection, and removal of bodies and constraints", () => {
      const comp = createPhysicsComposition();

      const b1 = comp.addBody({
        id: "hero",
        shape: { type: "circle", radius: 10 },
        position: createVector(10, 20),
      });

      expect(comp.getBody("hero")).toBe(b1);
      expect(comp.getBodies()).toHaveLength(1);

      const constraint = comp.addConstraint({
        id: "hero_anchor",
        type: "fixed",
        bodyA: b1,
        anchor: createVector(10, 20),
      });

      expect(comp.getConstraints()).toHaveLength(1);
      expect(comp.removeConstraint("hero_anchor")).toBe(true);
      expect(comp.getConstraints()).toHaveLength(0);

      expect(comp.removeBody("hero")).toBe(true);
      expect(comp.getBodies()).toHaveLength(0);
    });
  });

  describe("3. Unified Lifecycle Controls & Event Dispatching", () => {
    it("handles start, pause, resume, stop, reset, and dispose cleanly", () => {
      const comp = createPhysicsComposition({
        bodies: [
          {
            id: "box",
            shape: { type: "rectangle", width: 20, height: 20 },
            position: createVector(0, 0),
            velocity: createVector(10, 0),
          },
        ],
      });

      expect(comp.isRunning()).toBe(false);
      expect(comp.isPaused()).toBe(false);

      comp.start();
      expect(comp.isRunning()).toBe(true);

      comp.pause();
      expect(comp.isPaused()).toBe(true);

      comp.resume();
      expect(comp.isRunning()).toBe(true);

      comp.stop();
      expect(comp.isRunning()).toBe(false);

      comp.reset();
      expect(comp.getState().time).toBe(0);

      comp.dispose();
      expect(comp.isDisposed()).toBe(true);
      expect(() => comp.step()).toThrow(PhysicsLifecycleError);
    });

    it("notifies update, settle, and complete listeners when simulation settles", () => {
      const onUpdate = vi.fn();
      const onSettle = vi.fn();
      const onComplete = vi.fn();

      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "slow_ball",
            shape: { type: "circle", radius: 5 },
            position: createVector(0, 0),
            velocity: createVector(0.01, 0), // Extremely low velocity below settling threshold
          },
        ],
        behaviors: [
          createInertialBehavior({ friction: 10, minVelocity: 0.05 }),
        ],
      });

      comp.onUpdate(onUpdate);
      comp.onSettle(onSettle);
      comp.onComplete(onComplete);

      comp.start();
      comp.step(0.01);

      expect(onUpdate).toHaveBeenCalled();
      expect(onSettle).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
      expect(comp.isSettled()).toBe(true);
    });
  });

  describe("4. Composition Recipes", () => {
    it("registers and retrieves all 8 standard physics composition recipes", () => {
      const recipes = listPhysicsRecipes();
      expect(recipes).toHaveLength(8);

      const expected = [
        "bouncy-entrance",
        "heavy-object-drop",
        "floating-object",
        "inertial-drag",
        "spring-return",
        "constrained-bouncing",
        "gravity-driven-interaction",
        "elastic-multi-body-motion",
      ];

      for (const id of expected) {
        const recipe = getPhysicsRecipe(id);
        expect(recipe).toBeDefined();
        expect(recipe?.id).toBe(id);

        const config = recipe?.create();
        expect(config?.bodies?.length).toBeGreaterThan(0);
      }
    });

    it("instantiates a working composition from bouncy-entrance recipe", () => {
      const recipe = getPhysicsRecipe("bouncy-entrance")!;
      const config = recipe.create();
      const comp = createPhysicsComposition(config);

      expect(comp.getBody("actor")).toBeDefined();
      comp.start();

      for (let i = 0; i < 30; i++) comp.step(0.01);

      const actor = comp.getBody("actor")!;
      expect(actor.position.y).toBeGreaterThan(-100);
    });
  });

  describe("5. Choreography Integration", () => {
    it("adapts a physics composition into a choreography participant", async () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "p_body",
            shape: { type: "circle", radius: 10 },
            position: createVector(0, 0),
            velocity: createVector(0.01, 0),
          },
        ],
      });

      const participant = asChoreographyParticipant(comp, {
        label: "physics-drop",
        timeout: 50,
      });

      expect(participant.finished).toBeInstanceOf(Promise);

      // Participant resolves cleanly
      await expect(participant.finished).resolves.toBeUndefined();
    });

    it("cancels choreography participant and cleans up cleanly", async () => {
      const comp = createPhysicsComposition({
        timestep: 0.01,
        bodies: [
          {
            id: "p_body",
            shape: { type: "circle", radius: 10 },
            position: createVector(0, 0),
            velocity: createVector(100, 0),
          },
        ],
      });

      const participant = asChoreographyParticipant(comp);
      participant.cancel();

      await expect(participant.finished).rejects.toThrow("canceled");
    });
  });

  describe("6. Validation & Error Handling", () => {
    it("validates valid and invalid composition configurations", () => {
      expect(validatePhysicsCompositionConfig({ timestep: 0.01 }).valid).toBe(true);

      // Timestep <= 0
      const invalidTimestep = validatePhysicsCompositionConfig({ timestep: -0.01 });
      expect(invalidTimestep.valid).toBe(false);

      // MaxSubSteps < 1
      const invalidSubSteps = validatePhysicsCompositionConfig({ maxSubSteps: 0 });
      expect(invalidSubSteps.valid).toBe(false);

      // Duplicate body ID
      const duplicateBodies = validatePhysicsCompositionConfig({
        bodies: [
          { id: "same", shape: { type: "circle", radius: 10 } },
          { id: "same", shape: { type: "circle", radius: 10 } },
        ],
      });
      expect(duplicateBodies.valid).toBe(false);

      // Constraint referencing non-existent body
      const invalidConstraint = validatePhysicsCompositionConfig({
        bodies: [{ id: "b1", shape: { type: "circle", radius: 10 } }],
        constraints: [
          { type: "distance", bodyA: "b1", bodyB: "unknown_body" },
        ],
      });
      expect(invalidConstraint.valid).toBe(false);

      // Circular self-constraint
      const circularConstraint = validatePhysicsCompositionConfig({
        bodies: [{ id: "b1", shape: { type: "circle", radius: 10 } }],
        constraints: [
          { type: "distance", bodyA: "b1", bodyB: "b1" },
        ],
      });
      expect(circularConstraint.valid).toBe(false);
    });

    it("corrects invalid or incomplete configuration to safe defaults", () => {
      const corrected = correctPhysicsCompositionConfig({
        timestep: -1,
        maxSubSteps: -5,
      });

      expect(corrected.timestep).toBe(1 / 60);
      expect(corrected.maxSubSteps).toBe(10);
      expect(corrected.timeScale).toBe(1.0);
    });
  });
});
