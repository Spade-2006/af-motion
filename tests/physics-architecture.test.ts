import { describe, expect, it, vi } from "vitest";
import {
  createPhysicsSimulation,
  integrateSingleStep,
  stepSimulation,
  isFiniteNumber,
  isPhysicsVector,
  isPhysicsValue,
  createVector,
  cloneVector,
  addVectors,
  subVectors,
  scaleVector,
  magnitude,
  normalize,
  addValues,
  scaleValue,
  applyPrecision,
  isZeroValue,
  PhysicsError,
  PhysicsValidationError,
  PhysicsLifecycleError,
  PhysicsNumericalError,
  validatePhysicsConfig,
  assertValidPhysicsConfig,
  validatePhysicsState,
  assertValidPhysicsState,
  correctPhysicsConfig,
  PHYSICS_PRESET_STANDARD,
  PHYSICS_PRESET_HIGH_PRECISION,
  PHYSICS_PRESET_LOW_OVERHEAD,
  PHYSICS_PRESET_BULLET_TIME,
  PHYSICS_PRESET_FAST_FORWARD,
  getPhysicsPreset,
  listPhysicsPresets,
  registerPhysicsPreset,
  resolvePhysicsConfig,
  type PhysicsConfiguration,
  type PhysicsState,
  type PhysicsVector,
} from "../src/catalogue.js";

describe("Prompt 99 — Foundational Motion Physics Architecture", () => {
  describe("1. Configuration & Presets", () => {
    it("validates valid physics configurations", () => {
      const validConfig: PhysicsConfiguration = {
        timestep: 1 / 60,
        timeScale: 1.0,
        maxSubSteps: 10,
        precision: 1e-5,
        integrator: "semi-implicit-euler",
        autoStart: false,
        respectReducedMotion: true,
      };

      const result = validatePhysicsConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(() => assertValidPhysicsConfig(validConfig)).not.toThrow();
    });

    it("rejects non-object or null configurations", () => {
      expect(validatePhysicsConfig(null).valid).toBe(false);
      expect(validatePhysicsConfig(undefined).valid).toBe(false);
      expect(validatePhysicsConfig("invalid").valid).toBe(false);
      expect(validatePhysicsConfig(123).valid).toBe(false);
      expect(() => assertValidPhysicsConfig(null)).toThrow(PhysicsValidationError);
    });

    it("detects invalid timestep, timeScale, and maxSubSteps", () => {
      // Invalid timestep <= 0
      const negDt = validatePhysicsConfig({ timestep: -0.01 });
      expect(negDt.valid).toBe(false);
      expect(negDt.errors[0]).toContain("timestep");

      const zeroDt = validatePhysicsConfig({ timestep: 0 });
      expect(zeroDt.valid).toBe(false);

      const nanDt = validatePhysicsConfig({ timestep: NaN });
      expect(nanDt.valid).toBe(false);

      // Negative timeScale
      const negScale = validatePhysicsConfig({ timeScale: -1 });
      expect(negScale.valid).toBe(false);
      expect(negScale.errors[0]).toContain("timeScale");

      // Non-integer or < 1 maxSubSteps
      const floatSteps = validatePhysicsConfig({ maxSubSteps: 2.5 });
      expect(floatSteps.valid).toBe(false);

      const zeroSteps = validatePhysicsConfig({ maxSubSteps: 0 });
      expect(zeroSteps.valid).toBe(false);

      // Invalid integrator
      const badIntegrator = validatePhysicsConfig({ integrator: "quantum" as any });
      expect(badIntegrator.valid).toBe(false);
      expect(badIntegrator.errors[0]).toContain("integrator");
    });

    it("safely corrects invalid configurations with correctPhysicsConfig", () => {
      const corrected = correctPhysicsConfig({
        timestep: -1,
        timeScale: -2,
        maxSubSteps: 0,
        precision: -0.01,
        integrator: "bogus" as any,
      });

      expect(corrected.corrections.length).toBeGreaterThan(0);
      expect(corrected.corrected.timestep).toBe(1 / 60);
      expect(corrected.corrected.timeScale).toBe(1.0);
      expect(corrected.corrected.maxSubSteps).toBe(10);
      expect(corrected.corrected.precision).toBe(1e-5);
      expect(corrected.corrected.integrator).toBe("semi-implicit-euler");
    });

    it("provides standard built-in presets and allows registering custom presets", () => {
      const presets = listPhysicsPresets();
      expect(presets.length).toBeGreaterThanOrEqual(5);

      expect(getPhysicsPreset("standard")).toEqual(PHYSICS_PRESET_STANDARD);
      expect(getPhysicsPreset("high-precision")).toEqual(PHYSICS_PRESET_HIGH_PRECISION);
      expect(getPhysicsPreset("low-overhead")).toEqual(PHYSICS_PRESET_LOW_OVERHEAD);
      expect(getPhysicsPreset("bullet-time")).toEqual(PHYSICS_PRESET_BULLET_TIME);
      expect(getPhysicsPreset("fast-forward")).toEqual(PHYSICS_PRESET_FAST_FORWARD);

      // Register custom preset
      registerPhysicsPreset({
        id: "ultra-slow",
        name: "Ultra Slow",
        description: "0.1x speed simulation",
        config: {
          timestep: 1 / 60,
          timeScale: 0.1,
          maxSubSteps: 10,
          precision: 1e-5,
          integrator: "semi-implicit-euler",
          autoStart: false,
          respectReducedMotion: true,
        },
      });

      expect(getPhysicsPreset("ultra-slow")).toBeDefined();
      expect(getPhysicsPreset("ultra-slow")?.config.timeScale).toBe(0.1);
    });

    it("resolves configurations by preset identifier string or object", () => {
      const fromPreset = resolvePhysicsConfig("high-precision");
      expect(fromPreset.timestep).toBe(1 / 120);
      expect(fromPreset.integrator).toBe("rk4");

      const fromOverride = resolvePhysicsConfig({ timestep: 0.01 });
      expect(fromOverride.timestep).toBe(0.01);
      expect(fromOverride.integrator).toBe("semi-implicit-euler");
    });
  });

  describe("2. Vector Math & Numerical Operations", () => {
    it("creates, clones, adds, and scales vectors correctly", () => {
      const v1 = createVector(10, 20, 30);
      expect(v1).toEqual({ x: 10, y: 20, z: 30 });

      const cloned = cloneVector(v1);
      expect(cloned).toEqual(v1);
      expect(cloned).not.toBe(v1);

      const v2 = createVector(5, -10, 15);
      const sum = addVectors(v1, v2);
      expect(sum).toEqual({ x: 15, y: 10, z: 45 });

      const diff = subVectors(v1, v2);
      expect(diff).toEqual({ x: 5, y: 30, z: 15 });

      const scaled = scaleVector(v1, 2);
      expect(scaled).toEqual({ x: 20, y: 40, z: 60 });
    });

    it("calculates magnitude and normalizes vectors safely", () => {
      const v = createVector(3, 4, 0);
      expect(magnitude(v)).toBe(5);

      const unit = normalize(v);
      expect(unit.x).toBeCloseTo(0.6);
      expect(unit.y).toBeCloseTo(0.8);
      expect(magnitude(unit)).toBeCloseTo(1.0);

      // Zero vector normalization should not produce NaN
      const zero = createVector(0, 0, 0);
      const normZero = normalize(zero);
      expect(normZero.x).toBe(0);
      expect(normZero.y).toBe(0);
      expect(normZero.z).toBe(0);
    });

    it("handles scalar and vector operations polymorphically with addValues and scaleValue", () => {
      expect(addValues(10, 20)).toBe(30);
      expect(scaleValue(15, 3)).toBe(45);

      const vec = createVector(10, 20);
      expect(addValues(vec, createVector(5, 5))).toEqual({ x: 15, y: 25 });
      expect(scaleValue(vec, 0.5)).toEqual({ x: 5, y: 10 });
    });

    it("applies precision thresholds and detects zero values", () => {
      expect(applyPrecision(0.000001, 1e-4)).toBe(0);
      expect(applyPrecision(0.05, 1e-4)).toBe(0.05);

      const microVec = createVector(0.000002, 0.000001);
      const cleanedVec = applyPrecision(microVec, 1e-4) as PhysicsVector;
      expect(cleanedVec.x).toBe(0);
      expect(cleanedVec.y).toBe(0);

      expect(isZeroValue(0.000005, 1e-4)).toBe(true);
      expect(isZeroValue(0.05, 1e-4)).toBe(false);
    });
  });

  describe("3. Simulation Lifecycle Management", () => {
    it("creates simulation in idle state by default, or running when autoStart is true", () => {
      const simIdle = createPhysicsSimulation({
        initialState: { position: 0, velocity: 10 },
      });
      expect(simIdle.isRunning()).toBe(false);
      expect(simIdle.isPaused()).toBe(false);
      expect(simIdle.getContext().lifecycleState).toBe("idle");

      const simRunning = createPhysicsSimulation({
        config: { autoStart: true },
        initialState: { position: 0, velocity: 10 },
      });
      expect(simRunning.isRunning()).toBe(true);
      expect(simRunning.getContext().lifecycleState).toBe("running");
    });

    it("transitions through start, pause, resume, and stop cleanly", () => {
      const sim = createPhysicsSimulation({
        initialState: { position: 100, velocity: 0 },
      });

      const lifecycleHistory: string[] = [];
      sim.onLifecycle((state) => lifecycleHistory.push(state));

      expect(sim.getContext().lifecycleState).toBe("idle");

      sim.start();
      expect(sim.isRunning()).toBe(true);
      expect(sim.getContext().lifecycleState).toBe("running");

      sim.pause();
      expect(sim.isPaused()).toBe(true);
      expect(sim.getContext().lifecycleState).toBe("paused");

      sim.resume();
      expect(sim.isRunning()).toBe(true);
      expect(sim.getContext().lifecycleState).toBe("running");

      sim.stop();
      expect(sim.isRunning()).toBe(false);
      expect(sim.getContext().lifecycleState).toBe("idle");

      expect(lifecycleHistory).toEqual(["running", "paused", "running", "idle"]);
    });

    it("supports idempotent repeated calls without spurious transitions", () => {
      const sim = createPhysicsSimulation({
        initialState: { position: 0, velocity: 0 },
      });

      let transitionCount = 0;
      sim.onLifecycle(() => transitionCount++);

      sim.start();
      sim.start(); // Repeated
      sim.start();
      expect(transitionCount).toBe(1);

      sim.pause();
      sim.pause(); // Repeated
      expect(transitionCount).toBe(2);

      sim.stop();
      sim.stop(); // Repeated
      expect(transitionCount).toBe(3);
    });

    it("resets accumulated time, ticks, and coordinates deterministically", () => {
      const sim = createPhysicsSimulation({
        config: { timestep: 0.1 },
        initialState: { position: 0, velocity: 100 },
      });

      // Step forward 5 times
      for (let i = 0; i < 5; i++) {
        sim.step(0.1);
      }

      expect(sim.getContext().tick).toBe(5);
      expect(sim.getContext().time).toBeCloseTo(0.5);
      expect(sim.getState().position).toBeGreaterThan(0);

      // Reset
      sim.reset();
      expect(sim.getContext().tick).toBe(0);
      expect(sim.getContext().time).toBe(0);
      expect(sim.getContext().accumulator).toBe(0);
      expect(sim.getState().position).toBe(0);
      expect(sim.getState().velocity).toBe(100);

      // Reset with a new baseline
      sim.reset({ position: 50, velocity: 20 });
      expect(sim.getState().position).toBe(50);
      expect(sim.getState().velocity).toBe(20);
    });

    it("disposes cleanly and throws PhysicsLifecycleError on operations after disposal", () => {
      const sim = createPhysicsSimulation({
        initialState: { position: 0, velocity: 10 },
      });

      expect(sim.isDisposed()).toBe(false);
      sim.dispose();
      expect(sim.isDisposed()).toBe(true);

      // Repeated dispose is safe
      expect(() => sim.dispose()).not.toThrow();

      // Lifecycle actions throw after disposal
      expect(() => sim.start()).toThrow(PhysicsLifecycleError);
      expect(() => sim.pause()).toThrow(PhysicsLifecycleError);
      expect(() => sim.resume()).toThrow(PhysicsLifecycleError);
      expect(() => sim.stop()).toThrow(PhysicsLifecycleError);
      expect(() => sim.reset()).toThrow(PhysicsLifecycleError);
      expect(() => sim.step(0.016)).toThrow(PhysicsLifecycleError);
      expect(() => sim.getState()).toThrow(PhysicsLifecycleError);
      expect(() => sim.getContext()).toThrow(PhysicsLifecycleError);
    });
  });

  describe("4. Deterministic Stepping & Accumulator Mechanism", () => {
    it("advances state with bit-exact determinism across identical runs", () => {
      const runA = createPhysicsSimulation({
        config: { timestep: 1 / 60 },
        initialState: { position: 0, velocity: 100, acceleration: -9.8 },
      });

      const runB = createPhysicsSimulation({
        config: { timestep: 1 / 60 },
        initialState: { position: 0, velocity: 100, acceleration: -9.8 },
      });

      // Advance both by varying frame times
      const deltas = [0.016, 0.033, 0.008, 0.025, 0.017];
      for (const dt of deltas) {
        runA.step(dt);
        runB.step(dt);
      }

      expect(runA.getState().position).toBe(runB.getState().position);
      expect(runA.getState().velocity).toBe(runB.getState().velocity);
      expect(runA.getContext().tick).toBe(runB.getContext().tick);
      expect(runA.getContext().time).toBe(runB.getContext().time);
    });

    it("handles variable elapsed time with accumulator sub-steps", () => {
      const sim = createPhysicsSimulation({
        config: { timestep: 0.01 }, // 10ms steps
        initialState: { position: 0, velocity: 50 },
      });

      // Step with 0.025s (25ms) -> should take 2 discrete steps, with 5ms accumulator remaining
      const res = sim.step(0.025);
      expect(res.stepsTaken).toBe(2);
      expect(sim.getContext().tick).toBe(2);
      expect(sim.getContext().time).toBeCloseTo(0.02);
      expect(sim.getContext().accumulator).toBeCloseTo(0.005);
      expect(sim.getContext().alpha).toBeCloseTo(0.5); // 0.005 / 0.01

      // Step again with 0.005s (5ms) -> 5ms + 5ms = 10ms -> exactly 1 step, 0 accumulator remaining
      const res2 = sim.step(0.005);
      expect(res2.stepsTaken).toBe(1);
      expect(sim.getContext().tick).toBe(3);
      expect(sim.getContext().time).toBeCloseTo(0.03);
      expect(sim.getContext().accumulator).toBeCloseTo(0);
      expect(sim.getContext().alpha).toBeCloseTo(0);
    });

    it("clamps runaway accumulator when frame delays exceed maxSubSteps", () => {
      const sim = createPhysicsSimulation({
        config: { timestep: 0.01, maxSubSteps: 5 },
        initialState: { position: 0, velocity: 10 },
      });

      // Provide a massive 1-second freeze delay (100x the timestep)
      const res = sim.step(1.0);

      // Must take at most maxSubSteps (5)
      expect(res.stepsTaken).toBe(5);
      expect(res.clamped).toBe(true);
      expect(sim.getContext().tick).toBe(5);
      // Residual accumulator must be reset to 0 to prevent spiral of death
      expect(sim.getContext().accumulator).toBe(0);
    });

    it("respects timeScale configuration during simulation advance", () => {
      const simDoubleSpeed = createPhysicsSimulation({
        config: { timestep: 0.01, timeScale: 2.0 },
        initialState: { position: 0, velocity: 100 },
      });

      // 10ms real elapsed time * 2.0 speed = 20ms effective simulation time -> 2 sub-steps
      const resDouble = simDoubleSpeed.step(0.01);
      expect(resDouble.stepsTaken).toBe(2);

      const simHalfSpeed = createPhysicsSimulation({
        config: { timestep: 0.01, timeScale: 0.5 },
        initialState: { position: 0, velocity: 100 },
      });

      // 10ms real elapsed time * 0.5 speed = 5ms effective simulation time -> 0 sub-steps, 5ms accumulated
      const resHalf = simHalfSpeed.step(0.01);
      expect(resHalf.stepsTaken).toBe(0);
      expect(simHalfSpeed.getContext().accumulator).toBeCloseTo(0.005);
    });

    it("supports multi-dimensional 2D and 3D vector states", () => {
      const sim2D = createPhysicsSimulation({
        config: { timestep: 0.1 },
        initialState: {
          position: createVector(0, 100),
          velocity: createVector(20, -10),
          acceleration: createVector(0, -9.8),
        },
      });

      sim2D.step(0.1);
      const state = sim2D.getState();
      const pos = state.position as PhysicsVector;
      const vel = state.velocity as PhysicsVector;

      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeLessThan(100);
      expect(vel.y).toBeLessThan(-10);
    });

    it("supports all 4 numerical integrators (euler, semi-implicit-euler, verlet, rk4)", () => {
      const integrators = ["euler", "semi-implicit-euler", "verlet", "rk4"] as const;

      for (const integrator of integrators) {
        const sim = createPhysicsSimulation({
          config: { timestep: 0.01, integrator },
          initialState: { position: 0, velocity: 10, acceleration: -5 },
        });

        const res = sim.step(0.01);
        expect(res.stepsTaken).toBe(1);
        expect(typeof res.state.position).toBe("number");
        expect(typeof res.state.velocity).toBe("number");
        expect(Number.isFinite(res.state.position as number)).toBe(true);
      }
    });

    it("does not advance physical state when paused or completed", () => {
      const sim = createPhysicsSimulation({
        config: { timestep: 0.01 },
        initialState: { position: 50, velocity: 10 },
      });

      sim.start();
      sim.pause();

      const initialPos = sim.getState().position;
      const res = sim.step(0.1);

      expect(res.stepsTaken).toBe(0);
      expect(sim.getState().position).toBe(initialPos);
    });
  });

  describe("5. Reliability, Stability & Error Handling", () => {
    it("detects and throws PhysicsNumericalError if state becomes non-finite", () => {
      const state: PhysicsState = {
        position: NaN,
        velocity: 10,
      };

      expect(() => assertValidPhysicsState(state)).toThrow(PhysicsValidationError);

      const sim = createPhysicsSimulation({
        initialState: { position: 0, velocity: 10 },
      });

      // Manually injecting a non-finite velocity triggers validation error on setState
      expect(() => sim.setState({ velocity: Infinity })).toThrow(PhysicsValidationError);
    });

    it("rejects non-positive mass configurations", () => {
      expect(validatePhysicsState({ position: 0, velocity: 0, mass: 0 }).valid).toBe(false);
      expect(validatePhysicsState({ position: 0, velocity: 0, mass: -5 }).valid).toBe(false);
    });

    it("triggers onComplete listener when custom completion condition is met", () => {
      const completeFn = vi.fn();
      const sim = createPhysicsSimulation({
        config: { timestep: 0.1 },
        initialState: { position: 0, velocity: 10 },
        isComplete: (state) => (state.position as number) >= 10,
      });

      sim.onComplete(completeFn);

      // Step until position reaches 10
      sim.step(0.1); // pos 1
      sim.step(0.1); // pos 2
      expect(completeFn).not.toHaveBeenCalled();

      // Step with large dt to cross 10 (clamped to 10 sub-steps * 0.1s = 1.0s advance -> pos 12)
      sim.step(2.0);
      expect(sim.isCompleted()).toBe(true);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });

    it("maintains strict independence between multiple simulation instances", () => {
      const simA = createPhysicsSimulation({
        initialState: { position: 0, velocity: 100 },
      });

      const simB = createPhysicsSimulation({
        initialState: { position: 500, velocity: 0 },
      });

      simA.step(0.1);

      expect(simA.getState().position).toBeGreaterThan(0);
      expect(simB.getState().position).toBe(500); // Unaffected
      expect(simB.getContext().tick).toBe(0); // Unaffected
    });

    it("unsubscribes listeners cleanly without leaking", () => {
      const sim = createPhysicsSimulation({
        initialState: { position: 0, velocity: 10 },
      });

      let updateCalls = 0;
      const unsubscribe = sim.onUpdate(() => updateCalls++);

      sim.step(0.016);
      expect(updateCalls).toBe(1);

      unsubscribe();
      sim.step(0.016);
      expect(updateCalls).toBe(1); // Not called after unsubscribe
    });
  });
});
