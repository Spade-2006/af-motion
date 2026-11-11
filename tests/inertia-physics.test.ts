// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createInertiaSimulation,
  animateAdvancedInertia,
  calculateMomentum,
  calculateKineticEnergy,
  calculateNetForce,
  calculateInertiaAcceleration,
  applyTerminalVelocity,
  isInertiaSettled,
  applyPositionBounds,
  integrateInertiaStep,
  validateInertiaConfig,
  assertValidInertiaConfig,
  correctInertiaConfig,
  getInertiaPreset,
  listInertiaPresets,
  resolveInertiaConfig,
  INERTIA_PRESETS,
  createVector,
  PhysicsLifecycleError,
  PhysicsValidationError,
  PhysicsNumericalError,
  type InertiaState,
  type PhysicsVector,
} from "../src/catalogue.js";

describe("Prompt 101 — Advanced Inertia, Momentum, Friction & Gravity Engine", () => {
  describe("1. Mathematical Foundations & Vector Mechanics", () => {
    it("calculates momentum accurately for scalar, 2D, and 3D vectors", () => {
      // p = m * v
      expect(calculateMomentum(10, 2)).toBe(20);
      expect(calculateMomentum(createVector(3, 4), 2)).toEqual(createVector(6, 8));
      expect(calculateMomentum(createVector(1, 2, 3), 5)).toEqual(createVector(5, 10, 15));
    });

    it("calculates kinetic energy accurately: E_k = 0.5 * m * v^2", () => {
      // Scalar: 0.5 * 2 * 10^2 = 100
      expect(calculateKineticEnergy(10, 2)).toBe(100);
      // Vector: 0.5 * 2 * (3^2 + 4^2) = 0.5 * 2 * 25 = 25
      expect(calculateKineticEnergy(createVector(3, 4), 2)).toBe(25);
      // 3D vector: 0.5 * 4 * (1^2 + 2^2 + 2^2) = 0.5 * 4 * 9 = 18
      expect(calculateKineticEnergy(createVector(1, 2, 2), 4)).toBe(18);
    });

    it("calculates net forces combining gravity, friction, drag, and external forces", () => {
      // Net force = F_gravity + F_viscous + F_kinetic + F_drag + F_external
      // With m = 1, g = 10, v = 10, viscous friction b = 2, linear friction mu = 1, drag cd = 0.1
      // F_gravity = 1 * 10 = 10
      // F_viscous = -1 * 2 * 10 = -20
      // F_kinetic = -1 * 1 * 1 = -1
      // F_drag = -0.1 * |10| * 10 = -10
      // F_ext = 5
      // Net force = 10 - 20 - 1 - 10 + 5 = -16
      const netForce = calculateNetForce(10, 1, 10, 2, 1, 0.1, 5);
      expect(netForce).toBeCloseTo(-16);
    });

    it("calculates acceleration using Newton's second law: a = F_net / m", () => {
      const { acceleration, netForce } = calculateInertiaAcceleration(
        10, // velocity
        2,  // mass = 2
        0,  // gravity = 0
        1,  // friction = 1 -> F_viscous = -2 * 1 * 10 = -20
        0,  // linear friction
        0,  // drag
        30  // external force = 30 -> Net force = -20 + 30 = 10
      );
      expect(netForce).toBe(10);
      expect(acceleration).toBe(5); // a = 10 / 2 = 5
    });

    it("clamps velocity at terminal velocity", () => {
      // Scalar
      expect(applyTerminalVelocity(50, 25)).toBe(25);
      expect(applyTerminalVelocity(-50, 25)).toBe(-25);
      expect(applyTerminalVelocity(10, 25)).toBe(10);

      // Vector 2D: magnitude of { x: 30, y: 40 } is 50, clamp to 25 -> { x: 15, y: 20 }
      const clamped2D = applyTerminalVelocity(createVector(30, 40), 25) as PhysicsVector;
      expect(clamped2D.x).toBeCloseTo(15);
      expect(clamped2D.y).toBeCloseTo(20);
    });

    it("identifies settled state when velocity is below minVelocity and forces are zero", () => {
      expect(isInertiaSettled(0.0001, 0, 0, 0.001)).toBe(true);
      expect(isInertiaSettled(0.01, 0, 0, 0.001)).toBe(false);
      // Even if velocity is 0, if gravity or external force is acting, it cannot be settled
      expect(isInertiaSettled(0, 9.8, 0, 0.001)).toBe(false);
      expect(isInertiaSettled(0, 0, 5, 0.001)).toBe(false);
    });

    it("clamps spatial positions to configured bounds and zeros collided velocities", () => {
      // Scalar bounds
      expect(applyPositionBounds(150, 50, 0, 100)).toEqual({ position: 100, velocity: 0 });
      expect(applyPositionBounds(-50, -30, 0, 100)).toEqual({ position: 0, velocity: 0 });
      expect(applyPositionBounds(50, 10, 0, 100)).toEqual({ position: 50, velocity: 10 });

      // Vector bounds
      const vecResult = applyPositionBounds(
        createVector(120, -10),
        createVector(50, -20),
        createVector(0, 0),
        createVector(100, 100)
      );
      expect(vecResult.position).toEqual(createVector(100, 0));
      expect(vecResult.velocity).toEqual(createVector(0, 0));
    });
  });

  describe("2. Inertia & Momentum Dynamics", () => {
    it("conserves momentum with zero friction and zero external forces", () => {
      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: 100,
        config: {
          friction: 0,
          linearFriction: 0,
          drag: 0,
          gravity: 0,
          mass: 2,
          timestep: 0.01,
        },
      });

      sim.start();
      for (let i = 0; i < 50; i++) {
        sim.step(0.01);
      }

      const state = sim.getState();
      expect(state.velocity).toBeCloseTo(100);
      expect(state.momentum).toBeCloseTo(200); // p = 2 * 100 = 200
      expect(state.position).toBeCloseTo(50);  // x = 100 * 0.5s = 50
    });

    it("exhibits mass-dependent acceleration under identical force: heavier accelerates slower", () => {
      const lightBody = createInertiaSimulation({
        from: 0,
        initialVelocity: 0,
        config: { mass: 1, friction: 0, gravity: 0, timestep: 0.01 },
      });
      const heavyBody = createInertiaSimulation({
        from: 0,
        initialVelocity: 0,
        config: { mass: 5, friction: 0, gravity: 0, timestep: 0.01 },
      });

      // Apply same force = 100
      lightBody.applyForce(100);
      heavyBody.applyForce(100);

      lightBody.start();
      heavyBody.start();

      for (let i = 0; i < 20; i++) {
        lightBody.step(0.01);
        heavyBody.step(0.01);
      }

      // Light body (a = 100) vs Heavy body (a = 20)
      const lightVel = lightBody.getState().velocity as number;
      const heavyVel = heavyBody.getState().velocity as number;

      expect(lightVel).toBeCloseTo(5 * heavyVel, 1);
      expect(lightBody.getState().position as number).toBeGreaterThan(heavyBody.getState().position as number);
    });

    it("settles naturally at rest when velocity drops below minVelocity", () => {
      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: 50,
        config: {
          friction: 5,
          minVelocity: 0.05,
          timestep: 0.01,
        },
      });

      sim.start();
      let steps = 0;
      while (!sim.isSettled() && steps < 500) {
        sim.step(0.01);
        steps++;
      }

      expect(sim.isSettled()).toBe(true);
      expect(sim.getState().velocity).toBe(0);
      expect(sim.getState().kineticEnergy).toBe(0);
    });
  });

  describe("3. Multi-Model Friction & Aerodynamic Drag", () => {
    it("decelerates exponentially under viscous friction", () => {
      // Under pure viscous friction: v(t) = v0 * exp(-b/m * t)
      const m = 1;
      const b = 2;
      const v0 = 100;
      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: v0,
        config: { mass: m, friction: b, linearFriction: 0, drag: 0, gravity: 0, timestep: 0.001 },
      });

      sim.start();
      // Step 0.5 seconds
      for (let i = 0; i < 500; i++) {
        sim.step(0.001);
      }

      // Analytical: 100 * exp(-2 * 0.5) = 100 * exp(-1) = 36.7879
      const expectedVel = v0 * Math.exp(-(b / m) * 0.5);
      const actualVel = sim.getState().velocity as number;
      expect(actualVel).toBeCloseTo(expectedVel, 0);
    });

    it("exerts quadratic drag force: quadrupling velocity increases drag 16x", () => {
      const simLow = createInertiaSimulation({
        initialVelocity: 10,
        config: { friction: 0, linearFriction: 0, drag: 0.01, gravity: 0 },
      });
      const simHigh = createInertiaSimulation({
        initialVelocity: 40,
        config: { friction: 0, linearFriction: 0, drag: 0.01, gravity: 0 },
      });

      // F_drag = -cd * v^2
      // For v = 10: 0.01 * 100 = 1
      // For v = 40: 0.01 * 1600 = 16
      const stateLow = simLow.getState();
      const stateHigh = simHigh.getState();

      const forceLow = Math.abs(stateLow.netForce as number);
      const forceHigh = Math.abs(stateHigh.netForce as number);

      expect(forceHigh / forceLow).toBeCloseTo(16, 1);
    });
  });

  describe("4. Gravity, Impulses & Force Controls", () => {
    it("accelerates under downward gravity", () => {
      const sim = createInertiaSimulation({
        from: createVector(0, 0),
        initialVelocity: createVector(0, 0),
        config: {
          gravity: createVector(0, 980), // 980 px/s^2 downwards
          friction: 0,
          drag: 0,
          timestep: 0.01,
        },
      });

      sim.start();
      for (let i = 0; i < 50; i++) {
        sim.step(0.01);
      }

      const vel = sim.getState().velocity as PhysicsVector;
      expect(vel.x).toBe(0);
      expect(vel.y).toBeCloseTo(490, 0); // v = g * t = 980 * 0.5 = 490
    });

    it("applies impulses instantaneously according to dv = J / m", () => {
      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: 0,
        config: { mass: 2, friction: 0, gravity: 0 },
      });

      // Impulse J = 20 on mass = 2 -> delta v = 10
      sim.applyImpulse(20);
      expect(sim.getState().velocity).toBe(10);

      // Vector impulse
      const sim2D = createInertiaSimulation({
        from: createVector(0, 0),
        initialVelocity: createVector(0, 0),
        config: { mass: 4, friction: 0, gravity: 0 },
      });

      sim2D.applyImpulse(createVector(40, 80));
      expect(sim2D.getState().velocity).toEqual(createVector(10, 20));
    });

    it("allows dynamic injection of velocity and force clearing", () => {
      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: 10,
        config: { friction: 0, gravity: 0 },
      });

      sim.injectVelocity(15);
      expect(sim.getState().velocity).toBe(25);

      sim.applyForce(50);
      sim.clearForce();
      sim.step(0.01);
      // Net force should be 0 because force was cleared and friction/gravity are 0
      expect(sim.getState().netForce).toBe(0);
    });

    it("reverses velocity cleanly", () => {
      const sim = createInertiaSimulation({
        from: createVector(10, 20),
        initialVelocity: createVector(5, -15),
      });

      sim.reverseVelocity();
      expect(sim.getState().velocity).toEqual(createVector(-5, 15));
    });

    it("dynamically updates gravity, friction, position, and timeScale", () => {
      const sim = createInertiaSimulation();

      sim.setGravity(9.8);
      expect(sim.getConfiguration().gravity).toBe(9.8);

      sim.setFriction(3.5);
      expect(sim.getConfiguration().friction).toBe(3.5);

      sim.setPosition(150);
      expect(sim.getState().position).toBe(150);

      sim.setTimeScale(2.0);
      expect(sim.getConfiguration().timeScale).toBe(2.0);
    });
  });

  describe("5. Spatial Clamping & 3D Simulations", () => {
    it("simulates full 3D momentum and clamps within 3D bounding box", () => {
      const sim = createInertiaSimulation({
        from: createVector(0, 0, 0),
        initialVelocity: createVector(100, 200, 300),
        config: {
          min: createVector(-50, -50, -50),
          max: createVector(50, 50, 50),
          friction: 0,
          gravity: 0,
          timestep: 0.01,
        },
      });

      sim.start();
      for (let i = 0; i < 50; i++) {
        sim.step(0.01);
      }

      const state = sim.getState();
      const pos = state.position as PhysicsVector;
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(50);
      expect(pos.z).toBe(50);
    });
  });

  describe("6. Standard Presets & Central Preset Registry", () => {
    it("registers all 9 official inertia presets", () => {
      const presets = listInertiaPresets();
      expect(presets).toHaveLength(9);

      const expectedNames = [
        "natural",
        "heavy",
        "light",
        "high-friction",
        "low-friction",
        "air-resistance",
        "gravity",
        "zero-gravity",
        "fast-deceleration",
      ];

      for (const name of expectedNames) {
        expect(INERTIA_PRESETS).toHaveProperty(name);
        const preset = getInertiaPreset(name as any);
        expect(preset.id).toBe(name);
        expect(preset.config.mass).toBeGreaterThan(0);
      }
    });

    it("resolves preset names into full configurations", () => {
      const heavyConfig = resolveInertiaConfig("heavy");
      expect(heavyConfig.mass).toBe(3);

      const lightConfig = resolveInertiaConfig("light");
      expect(lightConfig.mass).toBe(0.5);

      const customConfig = resolveInertiaConfig({
        mass: 3,
        friction: 2,
      });
      expect(customConfig.mass).toBe(3);
      expect(customConfig.friction).toBe(2);
    });
  });

  describe("7. Configuration Validation & Error Handling", () => {
    it("validates valid and invalid inertia configurations", () => {
      expect(validateInertiaConfig({ mass: 1, friction: 1 }).valid).toBe(true);

      // Mass <= 0
      const invalidMass = validateInertiaConfig({ mass: 0 });
      expect(invalidMass.valid).toBe(false);
      expect(invalidMass.errors.some((e) => e.includes("mass"))).toBe(true);

      // Negative friction
      const invalidFriction = validateInertiaConfig({ friction: -1 });
      expect(invalidFriction.valid).toBe(false);
      expect(invalidFriction.errors.some((e) => e.includes("friction"))).toBe(true);

      // Negative minVelocity
      const invalidMinVel = validateInertiaConfig({ minVelocity: -0.1 });
      expect(invalidMinVel.valid).toBe(false);

      // Inverted bounds
      const invalidBounds = validateInertiaConfig({
        min: 100,
        max: 0,
      });
      expect(invalidBounds.valid).toBe(false);
    });

    it("asserts valid configuration or throws PhysicsValidationError", () => {
      expect(() => assertValidInertiaConfig({ mass: -2 })).toThrow(PhysicsValidationError);
    });

    it("auto-corrects invalid configurations to safe defaults", () => {
      const { corrected } = correctInertiaConfig({
        mass: -5,
        friction: -2,
        drag: -0.5,
        minVelocity: -1,
      });

      expect(corrected.mass).toBe(1);
      expect(corrected.friction).toBe(4);
      expect(corrected.drag).toBe(0);
      expect(corrected.minVelocity).toBe(0.5);
    });
  });

  describe("8. Lifecycle Machine & Event Subscriptions", () => {
    it("handles start, pause, resume, stop, reset, and dispose cleanly", () => {
      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: 100,
        config: { friction: 1 },
      });

      expect(sim.isRunning()).toBe(false);
      expect(sim.isPaused()).toBe(false);

      sim.start();
      expect(sim.isRunning()).toBe(true);

      sim.pause();
      expect(sim.isPaused()).toBe(true);

      sim.resume();
      expect(sim.isRunning()).toBe(true);

      sim.stop();
      expect(sim.isRunning()).toBe(false);

      sim.reset();
      expect(sim.getState().position).toBe(0);
      expect(sim.getState().velocity).toBe(100);

      sim.dispose();
      expect(sim.isDisposed()).toBe(true);
      expect(() => sim.start()).toThrow(PhysicsLifecycleError);
    });

    it("notifies update, settle, and complete listeners", () => {
      const onUpdate = vi.fn();
      const onSettle = vi.fn();
      const onComplete = vi.fn();

      const sim = createInertiaSimulation({
        from: 0,
        initialVelocity: 5,
        config: { friction: 10, minVelocity: 0.1, timestep: 0.01 },
      });

      sim.onUpdate(onUpdate);
      sim.onSettle(onSettle);
      sim.onComplete(onComplete);

      sim.start();
      for (let i = 0; i < 50; i++) {
        sim.step(0.01);
      }

      expect(onUpdate).toHaveBeenCalled();
      expect(onSettle).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe("9. Animated Inertia & Reduced-Motion Accessibility", () => {
    it("animates via shared RAF loop and cancels on demand", () => {
      const onUpdate = vi.fn();
      const controls = animateAdvancedInertia({
        from: 0,
        initialVelocity: 50,
        config: { friction: 2 },
        onUpdate,
      });

      expect(controls.isRunning()).toBe(true);

      controls.cancel();
      expect(controls.isDisposed()).toBe(true);
    });
  });
});
