// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  createSpringSimulation,
  animateAdvancedSpring,
  calculateDampingRatio,
  calculateNaturalFrequency,
  calculateCriticalDamping,
  classifyDampingBehavior,
  calculateSpringAcceleration,
  isSpringSettled,
  validateSpringConfig,
  assertValidSpringConfig,
  correctSpringConfig,
  getSpringPreset,
  listSpringPresets,
  resolveSpringConfig,
  SPRING_PRESETS,
  createVector,
  PhysicsLifecycleError,
  PhysicsValidationError,
  PhysicsNumericalError,
  type SpringState,
  type PhysicsVector,
} from "../src/catalogue.js";

describe("Prompt 100 — Advanced Spring Physics Engine", () => {
  describe("1. Spring Mathematical Model & Damping Regimes", () => {
    it("calculates natural frequency and damping ratio accurately", () => {
      // k = 100, m = 1 -> omega0 = sqrt(100 / 1) = 10 rad/s
      const omega0 = calculateNaturalFrequency(100, 1);
      expect(omega0).toBe(10);

      // Critical damping for k = 100, m = 1 is 2 * sqrt(100 * 1) = 20
      const cCrit = calculateCriticalDamping(100, 1);
      expect(cCrit).toBe(20);

      // Underdamped: c = 10 -> zeta = 10 / 20 = 0.5
      const zetaUnder = calculateDampingRatio(100, 10, 1);
      expect(zetaUnder).toBeCloseTo(0.5);
      expect(classifyDampingBehavior(zetaUnder)).toBe("underdamped");

      // Critically damped: c = 20 -> zeta = 20 / 20 = 1.0
      const zetaCrit = calculateDampingRatio(100, 20, 1);
      expect(zetaCrit).toBeCloseTo(1.0);
      expect(classifyDampingBehavior(zetaCrit)).toBe("critically-damped");

      // Overdamped: c = 40 -> zeta = 40 / 20 = 2.0
      const zetaOver = calculateDampingRatio(100, 40, 1);
      expect(zetaOver).toBeCloseTo(2.0);
      expect(classifyDampingBehavior(zetaOver)).toBe("overdamped");
    });

    it("simulates underdamped spring with overshoot and oscillation", () => {
      // Underdamped spring from 0 to 100: bouncy preset (k = 200, c = 10, m = 1)
      const spring = createSpringSimulation({
        config: "bouncy",
        from: 0,
        target: 100,
      });

      expect(spring.getState().dampingBehavior).toBe("underdamped");
      expect(spring.getState().dampingRatio).toBeLessThan(1.0);

      let maxPosition = 0;
      let overshootDetected = false;

      // Step forward until settled or 200 steps
      for (let i = 0; i < 200; i++) {
        const res = spring.step(0.016);
        const pos = res.position as number;
        if (pos > maxPosition) maxPosition = pos;
        if (pos > 100) overshootDetected = true;
        if (res.settled) break;
      }

      // Must have experienced overshoot beyond equilibrium target 100
      expect(overshootDetected).toBe(true);
      expect(maxPosition).toBeGreaterThan(100);
      expect(spring.isSettled()).toBe(true);
      expect(spring.getState().position).toBe(100); // Snapped cleanly to target
    });

    it("simulates critically damped spring without overshoot", () => {
      // Critically damped spring (c = 2 * sqrt(k * m))
      const k = 170;
      const m = 1.0;
      const c = calculateCriticalDamping(k, m);

      const spring = createSpringSimulation({
        config: {
          stiffness: k,
          damping: c,
          mass: m,
          timestep: 0.01,
        },
        from: 0,
        target: 100,
      });

      expect(spring.getState().dampingBehavior).toBe("critically-damped");
      expect(spring.getState().dampingRatio).toBeCloseTo(1.0);

      let maxPosition = 0;

      for (let i = 0; i < 250; i++) {
        const res = spring.step(0.01);
        const pos = res.position as number;
        if (pos > maxPosition) maxPosition = pos;
        if (res.settled) break;
      }

      // Critical damping should not overshoot target 100
      expect(maxPosition).toBeLessThanOrEqual(100.01);
      expect(spring.isSettled()).toBe(true);
      expect(spring.getState().position).toBe(100);
    });

    it("simulates overdamped spring with slower monotonic convergence", () => {
      // Overdamped spring: c >> 2 * sqrt(k * m)
      const spring = createSpringSimulation({
        config: {
          stiffness: 100,
          damping: 50, // c_crit is 20 -> zeta = 2.5
          mass: 1.0,
          timestep: 0.01,
        },
        from: 0,
        target: 100,
      });

      expect(spring.getState().dampingBehavior).toBe("overdamped");
      expect(spring.getState().dampingRatio).toBeGreaterThan(1.0);

      let prevPos = 0;
      let monotonic = true;

      for (let i = 0; i < 150; i++) {
        const res = spring.step(0.01);
        const pos = res.position as number;
        if (pos < prevPos) monotonic = false;
        prevPos = pos;
        if (res.settled) break;
      }

      // Overdamped motion moves monotonically towards target without bouncing back
      expect(monotonic).toBe(true);
      expect(prevPos).toBeLessThanOrEqual(100);
    });

    it("accurately handles varying masses and inertias", () => {
      // Light mass (m = 0.5) vs Heavy mass (m = 4.0) with identical stiffness and damping
      const lightSpring = createSpringSimulation({
        config: { stiffness: 200, damping: 20, mass: 0.5, timestep: 0.01 },
        from: 0,
        target: 100,
      });

      const heavySpring = createSpringSimulation({
        config: { stiffness: 200, damping: 20, mass: 4.0, timestep: 0.01 },
        from: 0,
        target: 100,
      });

      // Natural frequency of light spring is sqrt(200/0.5) = 20 rad/s
      // Natural frequency of heavy spring is sqrt(200/4) = 7.07 rad/s
      expect(lightSpring.getState().naturalFrequency).toBeGreaterThan(heavySpring.getState().naturalFrequency);

      // Light spring should accelerate much faster in early steps
      for (let i = 0; i < 5; i++) {
        lightSpring.step(0.01);
        heavySpring.step(0.01);
      }

      expect(lightSpring.getState().position as number).toBeGreaterThan(heavySpring.getState().position as number);
    });
  });

  describe("2. Multi-Dimensional Vector Support (2D & 3D)", () => {
    it("simulates 2D vector springs with independent component dynamics", () => {
      const spring2D = createSpringSimulation({
        config: "snappy",
        from: createVector(0, 50),
        target: createVector(100, -50),
        initialVelocity: createVector(10, 0),
      });

      const initialPos = spring2D.getState().position as PhysicsVector;
      expect(initialPos).toEqual({ x: 0, y: 50 });

      // Step simulation
      for (let i = 0; i < 150; i++) {
        const res = spring2D.step(0.016);
        if (res.settled) break;
      }

      expect(spring2D.isSettled()).toBe(true);
      const finalPos = spring2D.getState().position as PhysicsVector;
      expect(finalPos.x).toBe(100);
      expect(finalPos.y).toBe(-50);
      const finalVel = spring2D.getState().velocity as PhysicsVector;
      expect(finalVel.x).toBe(0);
      expect(finalVel.y).toBe(0);
    });

    it("simulates 3D vector springs with spatial settling", () => {
      const spring3D = createSpringSimulation({
        config: "smooth",
        from: createVector(10, 20, 30),
        target: createVector(-10, 0, 100),
      });

      for (let i = 0; i < 200; i++) {
        const res = spring3D.step(0.016);
        if (res.settled) break;
      }

      expect(spring3D.isSettled()).toBe(true);
      const finalPos = spring3D.getState().position as PhysicsVector;
      expect(finalPos.x).toBe(-10);
      expect(finalPos.y).toBe(0);
      expect(finalPos.z).toBe(100);
    });
  });

  describe("3. Advanced Spring Controls & Dynamic Operations", () => {
    it("supports dynamic retargeting without position or velocity discontinuity", () => {
      const spring = createSpringSimulation({
        config: "bouncy",
        from: 0,
        target: 100,
      });

      // Advance halfway
      for (let i = 0; i < 10; i++) {
        spring.step(0.016);
      }

      const posBeforeRetarget = spring.getState().position as number;
      const velBeforeRetarget = spring.getState().velocity as number;
      expect(posBeforeRetarget).toBeGreaterThan(0);
      expect(velBeforeRetarget).toBeGreaterThan(0);

      const retargetFn = vi.fn();
      spring.onRetarget(retargetFn);

      // Dynamically retarget to 200 while in motion
      spring.retarget(200);

      expect(retargetFn).toHaveBeenCalledWith(200, 100);

      // Position and velocity must be exactly preserved (no teleportation!)
      expect(spring.getState().position).toBe(posBeforeRetarget);
      expect(spring.getState().velocity).toBe(velBeforeRetarget);
      expect(spring.getState().target).toBe(200);

      // Continue stepping to final target 200
      for (let i = 0; i < 200; i++) {
        spring.step(0.016);
        if (spring.isSettled()) break;
      }

      expect(spring.isSettled()).toBe(true);
      expect(spring.getState().position).toBe(200);
    });

    it("supports velocity injection and impulses", () => {
      const spring = createSpringSimulation({
        config: "stiff",
        from: 0,
        target: 0, // already at target
      });

      expect(spring.isSettled()).toBe(true);

      // Inject a sudden impulse velocity of 500 units/s
      spring.injectVelocity(500);

      expect(spring.isSettled()).toBe(false);
      expect(spring.getState().velocity).toBe(500);

      // Step forward — position should move outward due to injected momentum
      spring.step(0.02);
      expect(spring.getState().position as number).toBeGreaterThan(0);

      // Settle back to target 0
      for (let i = 0; i < 200; i++) {
        spring.step(0.02);
        if (spring.isSettled()) break;
      }

      expect(spring.isSettled()).toBe(true);
      expect(spring.getState().position).toBe(0);
    });

    it("reverses velocity vector correctly", () => {
      const spring = createSpringSimulation({
        config: "gentle",
        from: 0,
        target: 100,
        initialVelocity: 50,
      });

      expect(spring.getState().velocity).toBe(50);
      spring.reverseVelocity();
      expect(spring.getState().velocity).toBe(-50);

      // Vector velocity reversal
      const springVec = createSpringSimulation({
        config: "gentle",
        from: createVector(0, 0),
        target: createVector(10, 10),
        initialVelocity: createVector(20, -30),
      });

      springVec.reverseVelocity();
      const v = springVec.getState().velocity as PhysicsVector;
      expect(v.x).toBe(-20);
      expect(v.y).toBe(30);
    });

    it("pauses, resumes, stops, and resets spring simulations", () => {
      const spring = createSpringSimulation({
        config: "snappy",
        from: 0,
        target: 100,
      });

      spring.start();
      spring.step(0.05);
      const pos1 = spring.getState().position as number;

      // Pause
      spring.pause();
      expect(spring.isPaused()).toBe(true);
      spring.step(0.05);
      expect(spring.getState().position).toBe(pos1); // Frozen while paused

      // Resume
      spring.resume();
      expect(spring.isRunning()).toBe(true);
      spring.step(0.05);
      expect(spring.getState().position as number).toBeGreaterThan(pos1);

      // Reset
      spring.reset();
      expect(spring.getState().position).toBe(0);
      expect(spring.getState().velocity).toBe(0);
      expect(spring.getContext().tick).toBe(0);
      expect(spring.getContext().time).toBe(0);
    });

    it("triggers onSettle and onComplete callbacks upon equilibrium", () => {
      const settleFn = vi.fn();
      const completeFn = vi.fn();

      const spring = createSpringSimulation({
        config: "snappy",
        from: 0,
        target: 10,
        onSettle: settleFn,
        onComplete: completeFn,
      });

      for (let i = 0; i < 200; i++) {
        spring.step(0.016);
        if (spring.isSettled()) break;
      }

      expect(settleFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
      expect(spring.isCompleted()).toBe(true);
    });
  });

  describe("4. Presets & Configuration Infrastructure", () => {
    it("provides all 9 registered spring presets", () => {
      const expectedPresets = [
        "gentle",
        "smooth",
        "snappy",
        "bouncy",
        "stiff",
        "heavy",
        "soft",
        "elastic",
        "critical",
      ];

      const allPresets = listSpringPresets();
      expect(allPresets.length).toBe(9);

      for (const name of expectedPresets) {
        const preset = getSpringPreset(name);
        expect(preset).toBeDefined();
        expect(preset?.config.stiffness).toBeGreaterThan(0);
        expect(preset?.config.damping).toBeGreaterThan(0);
        expect(preset?.config.mass).toBeGreaterThan(0);
      }
    });

    it("resolves spring configurations by preset name with custom overrides", () => {
      const resolved = resolveSpringConfig("bouncy");
      expect(resolved.stiffness).toBe(200);
      expect(resolved.damping).toBe(10);

      const resolvedWithOverride = resolveSpringConfig({
        stiffness: 500,
        damping: 40,
      });
      expect(resolvedWithOverride.stiffness).toBe(500);
      expect(resolvedWithOverride.damping).toBe(40);
    });

    it("validates and corrects invalid spring configurations", () => {
      const invalid = validateSpringConfig({
        stiffness: -10,
        damping: -5,
        mass: 0,
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThanOrEqual(3);

      expect(() => assertValidSpringConfig({ stiffness: -1 })).toThrow(PhysicsValidationError);

      const corrected = correctSpringConfig({
        stiffness: -100,
        damping: -50,
        mass: -2,
      });
      expect(corrected.corrections.length).toBeGreaterThan(0);
      expect(corrected.corrected.stiffness).toBe(170);
      expect(corrected.corrected.damping).toBe(26);
      expect(corrected.corrected.mass).toBe(1.0);
    });
  });

  describe("5. Shared RAF Animation Integration (animateAdvancedSpring)", () => {
    it("animates spring on shared RAF scheduler and settles cleanly", async () => {
      let latestPos = 0;
      let completed = false;

      const anim = animateAdvancedSpring({
        config: "snappy",
        from: 0,
        target: 50,
        onUpdate: (state) => {
          latestPos = state.position as number;
        },
        onComplete: () => {
          completed = true;
        },
      });

      expect(anim.isRunning()).toBe(true);

      // Wait a moment for shared RAF ticks to advance the snappy spring
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(latestPos).toBeGreaterThan(40);
      expect(latestPos).toBeLessThanOrEqual(51);
      anim.cancel();
      expect(anim.isDisposed()).toBe(true);
    });

    it("cancels active animation cleanly without leaking callbacks", () => {
      let updateCount = 0;

      const anim = animateAdvancedSpring({
        config: "elastic",
        from: 0,
        target: 100,
        onUpdate: () => {
          updateCount++;
        },
      });

      expect(anim.isDisposed()).toBe(false);
      anim.cancel();
      expect(anim.isDisposed()).toBe(true);

      const currentCount = updateCount;
      // Disposed simulation throws PhysicsLifecycleError on step
      expect(() => anim.step(0.016)).toThrow(PhysicsLifecycleError);
      expect(updateCount).toBe(currentCount);
    });
  });

  describe("6. Numerical Stability & Edge Cases", () => {
    it("throws PhysicsNumericalError on non-finite retargets or velocities", () => {
      const spring = createSpringSimulation({ from: 0, target: 10 });

      expect(() => spring.retarget(NaN as any)).toThrow(PhysicsNumericalError);
      expect(() => spring.setVelocity(Infinity as any)).toThrow(PhysicsNumericalError);
      expect(() => spring.setPosition(-Infinity as any)).toThrow(PhysicsNumericalError);
    });

    it("enforces maxDuration timeout to guarantee bounded completion", () => {
      // Elastic spring with very low damping that would oscillate for a long time
      const spring = createSpringSimulation({
        config: {
          stiffness: 100,
          damping: 0.1, // extremely low damping
          maxDuration: 0.5, // 500ms safety cap
          timestep: 0.01,
        },
        from: 0,
        target: 100,
      });

      // Step until 0.6 seconds
      for (let i = 0; i < 60; i++) {
        spring.step(0.01);
      }

      // Must be forced to complete by maxDuration
      expect(spring.isCompleted()).toBe(true);
      expect(spring.getState().position).toBe(100);
    });

    it("prevents operations on disposed springs", () => {
      const spring = createSpringSimulation({ from: 0, target: 10 });
      spring.dispose();

      expect(spring.isDisposed()).toBe(true);
      expect(() => spring.start()).toThrow(PhysicsLifecycleError);
      expect(() => spring.pause()).toThrow(PhysicsLifecycleError);
      expect(() => spring.retarget(20)).toThrow(PhysicsLifecycleError);
      expect(() => spring.step(0.016)).toThrow(PhysicsLifecycleError);
      expect(() => spring.getState()).toThrow(PhysicsLifecycleError);
    });
  });
});
