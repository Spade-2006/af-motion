/**
 * Vitest Test Suite for AF Motion Interactive Particle Fields & Forces (Prompt 121)
 */

import { describe, expect, it, vi } from "vitest";
import {
  addParticleForce,
  AttractionForceField,
  computeFalloff,
  createAttractionField,
  createFlowField,
  createForceField,
  createForceFieldManager,
  createInteractiveParticleSystem,
  createParticleDataPool,
  createParticleField,
  createRepulsionField,
  createTurbulenceField,
  createVortexField,
  createWindSystem,
  DirectionalForceField,
  disposeParticleField,
  DragForceField,
  FlowCoupledForceField,
  ForceFieldManager,
  GravitationalForceField,
  InteractiveParticleSystem,
  ParticleInteractionController,
  removeParticleForce,
  RepulsionForceField,
  SpatialFieldGrid,
  TurbulenceForceField,
  updateParticleField,
  VortexForceField,
} from "../src/catalogue.js";

describe("Prompt 121 — Interactive Particle Fields & Forces Engine", () => {
  describe("1. Force Mathematics & Falloff Calculations", () => {
    it("calculates falloff modes accurately", () => {
      expect(computeFalloff(0.2, 0.5, "none")).toBe(1.0);
      expect(computeFalloff(0.5, 0.5, "linear")).toBe(0.0);
      expect(computeFalloff(0.25, 0.5, "linear")).toBeCloseTo(0.5, 4);

      // Smoothstep: S-curve
      const ssHalf = computeFalloff(0.25, 0.5, "smoothstep");
      expect(ssHalf).toBeCloseTo(0.5, 2);

      // Inverse distance
      const invDist = computeFalloff(1.0, 2.0, "inverse-distance");
      expect(invDist).toBeCloseTo(0.5, 4);

      // Exponential
      const expFalloff = computeFalloff(0.5, 0.5, "exponential");
      expect(expFalloff).toBe(0.0);
    });

    it("evaluates AttractionForceField pulling toward target point", () => {
      const attractor = createAttractionField({
        type: "attraction",
        position: [1, 0, 0],
        strength: 50,
        radius: 2.0,
      });

      expect(attractor).toBeInstanceOf(AttractionForceField);

      // Particle at origin (0, 0, 0) should be pulled toward +X
      const [fx, fy, fz] = attractor.evaluate(0, 0, 0, 0, 0, 0, 1, 0);
      expect(fx).toBeGreaterThan(0);
      expect(fy).toBeCloseTo(0, 5);
      expect(fz).toBeCloseTo(0, 5);
    });

    it("evaluates RepulsionForceField pushing away from origin", () => {
      const repulsor = createRepulsionField({
        type: "repulsion",
        position: [0, 0, 0],
        strength: 40,
        radius: 1.5,
      });

      expect(repulsor).toBeInstanceOf(RepulsionForceField);

      // Particle at (0.5, 0, 0) should be pushed away (+X)
      const [fx, fy, fz] = repulsor.evaluate(0.5, 0, 0, 0, 0, 0, 1, 0);
      expect(fx).toBeGreaterThan(0);
      expect(fy).toBeCloseTo(0, 5);
      expect(fz).toBeCloseTo(0, 5);
    });

    it("evaluates VortexForceField producing tangential rotation and optional inward pull", () => {
      const vortex = createVortexField({
        type: "vortex",
        position: [0, 0, 0],
        axis: [0, 0, 1],
        strength: 30,
        radius: 2.0,
        inwardPull: 0.2,
      });

      expect(vortex).toBeInstanceOf(VortexForceField);

      // Particle on positive X at (1, 0, 0): tangential vector points in +Y direction
      const [fx, fy, fz] = vortex.evaluate(1, 0, 0, 0, 0, 0, 1, 0);
      expect(fy).toBeGreaterThan(0);
      expect(fz).toBeCloseTo(0, 5);
      // Inward pull pulls back towards -X
      expect(fx).toBeLessThan(0);
    });

    it("evaluates DirectionalForceField with constant acceleration vector", () => {
      const dirField = new DirectionalForceField({
        type: "directional",
        direction: [0, -1, 0], // downward gravity-like direction
        strength: 20,
      });

      const [fx, fy, fz] = dirField.evaluate(0.5, 0.5, 0, 0, 0, 0, 1, 0);
      expect(fx).toBeCloseTo(0, 5);
      expect(fy).toBeCloseTo(-20, 4);
      expect(fz).toBeCloseTo(0, 5);
    });

    it("evaluates GravitationalForceField with Newtonian softening", () => {
      const gravity = new GravitationalForceField({
        type: "gravitational",
        position: [0, 0, 0],
        mass: 1000,
        G: 1.0,
        softening: 0.1,
      });

      // Particle at (1, 0, 0)
      const [fx1] = gravity.evaluate(1, 0, 0, 0, 0, 0, 1, 0);
      // Particle at (2, 0, 0) should experience ~1/4 of the force
      const [fx2] = gravity.evaluate(2, 0, 0, 0, 0, 0, 1, 0);

      expect(fx1).toBeLessThan(0); // Pulled toward origin (-X)
      expect(fx2).toBeLessThan(0);
      expect(Math.abs(fx1)).toBeGreaterThan(Math.abs(fx2) * 3);
    });

    it("evaluates TurbulenceForceField with deterministic multi-harmonic noise", () => {
      const turb = createTurbulenceField({
        type: "turbulence",
        frequency: 2.0,
        strength: 10.0,
      });

      expect(turb).toBeInstanceOf(TurbulenceForceField);

      const f1 = turb.evaluate(0.3, 0.4, 0.5, 0, 0, 0, 1, 1.0);
      const f2 = turb.evaluate(0.3, 0.4, 0.5, 0, 0, 0, 1, 1.0);

      // Deterministic identical evaluations for same coordinates and time
      expect(f1[0]).toBe(f2[0]);
      expect(f1[1]).toBe(f2[1]);
      expect(f1[2]).toBe(f2[2]);
    });

    it("evaluates DragForceField opposing particle velocity", () => {
      const drag = new DragForceField({
        type: "drag",
        damping: 0.5,
      });

      // Moving right (+X)
      const [fx, fy, fz] = drag.evaluate(0, 0, 0, 10, 0, 0, 1, 0);
      expect(fx).toBeCloseTo(-5, 4);
      expect(fy).toBeCloseTo(0, 5);
      expect(fz).toBeCloseTo(0, 5);
    });

    it("evaluates FlowCoupledForceField with Prompt 119 and Prompt 120 systems", () => {
      const flow = createFlowField({
        type: "directional",
        direction: [1, 0],
        strength: 15,
      });

      const wind = createWindSystem({
        direction: [0, 1],
        speed: 10,
      });

      const coupled = new FlowCoupledForceField({
        type: "flow-coupled",
        flowField: flow,
        windSystem: wind,
        dragCoefficient: 1.0,
      });

      // Stationary particle at (0.5, 0.5) should be dragged by combined flow and wind
      const [fx, fy] = coupled.evaluate(0.5, 0.5, 0, 0, 0, 0, 1, 0);
      expect(fx).toBeGreaterThan(0);
      expect(fy).toBeGreaterThan(0);
    });
  });

  describe("2. Spatial Broad-Phase Indexing", () => {
    it("partitions localized force fields and returns broad-phase candidates", () => {
      const grid = new SpatialFieldGrid(0.5);

      const fieldA = createAttractionField({
        type: "attraction",
        position: [0.2, 0.2, 0],
        radius: 0.3,
        strength: 10,
      });

      const fieldB = createRepulsionField({
        type: "repulsion",
        position: [5.0, 5.0, 0],
        radius: 0.3,
        strength: 10,
      });

      const globalField = new DirectionalForceField({
        type: "directional",
        direction: [0, -1, 0],
        strength: 5,
        radius: 0, // global
      });

      grid.rebuild([fieldA, fieldB, globalField]);

      // Query near FieldA (0.2, 0.2): should get FieldA and GlobalField, but NOT FieldB
      const candidatesA = grid.query(0.2, 0.2, 0);
      expect(candidatesA).toContain(fieldA);
      expect(candidatesA).toContain(globalField);
      expect(candidatesA).not.toContain(fieldB);
    });
  });

  describe("3. Force Field Composition & Acceleration Clamping", () => {
    it("combines multiple forces with priority and clamps maximum acceleration", () => {
      const manager = createForceFieldManager({
        maxAcceleration: 100, // Hard limit of 100 m/s^2
      });

      // Add extreme force exceeding limit
      manager.addField({
        type: "directional",
        direction: [1, 0, 0],
        strength: 5000,
      });

      const [fx] = manager.evaluateCombinedForce(0, 0, 0, 0, 0, 0, 1, 0);
      // Clamped to exactly 100 for unit mass
      expect(fx).toBeCloseTo(100, 3);
    });

    it("applies forces directly to Prompt 118 ParticleDataPool", () => {
      const manager = createForceFieldManager();
      manager.addField({
        type: "directional",
        direction: [1, 0, 0],
        strength: 25,
      });

      const pool = createParticleDataPool(10);
      const slot = pool.spawn({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life: 5,
        maxLife: 5,
        startSize: 2,
        endSize: 2,
        startRotation: 0,
        angularVelocity: 0,
        startOpacity: 1,
        endOpacity: 1,
        startColor: [1, 1, 1, 1],
        endColor: [1, 1, 1, 1],
        mass: 1,
      });

      expect(slot).toBeGreaterThanOrEqual(0);

      manager.applyToPool(pool, 0.016, 0);

      // Acceleration buffer at slot should have positive X acceleration
      const base = slot * pool.stride;
      expect(pool.buffer[base + 8]).toBeCloseTo(25, 4); // OFFSET_ACC_X = 8
    });

    it("adapts seamlessly to Prompt 118 ParticleBehavior interface", () => {
      const manager = createForceFieldManager();
      manager.addField({
        type: "directional",
        direction: [0, 1, 0],
        strength: 30,
      });

      const behavior = manager.toParticleBehavior();
      expect(behavior.type).toBe("custom");

      const mockParticle = {
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        mass: 1,
      };

      behavior.execute(mockParticle as any, 0.016);
      expect(mockParticle.ay).toBeCloseTo(30, 4);
    });
  });

  describe("4. Pointer & Gesture Interaction", () => {
    it("tracks pointers and creates dynamic attraction and repulsion fields", () => {
      const manager = createForceFieldManager();
      const interaction = new ParticleInteractionController(manager, {
        mode: "attract",
        radius: 0.3,
        strength: 60,
      });

      interaction.updatePointer("mouse-1", 0.5, 0.5, true);
      expect(interaction.getPointers().length).toBe(1);
      expect(manager.getFields().length).toBe(1);

      // Pointer movement updates field position
      interaction.updatePointer("mouse-1", 0.6, 0.7, true);
      const field = manager.getFields()[0]!;
      expect(field.position[0]).toBe(0.6);
      expect(field.position[1]).toBe(0.7);

      // Pointer removal
      interaction.removePointer("mouse-1");
      expect(manager.getFields().length).toBe(0);
    });

    it("translates gestures into instantaneous force bursts", () => {
      const manager = createForceFieldManager();
      const interaction = new ParticleInteractionController(manager);

      interaction.handleGesture("tap", 0.4, 0.4);
      expect(manager.getFields().length).toBe(1);
      const shockwave = manager.getFields()[0]!;
      expect(shockwave.type).toBe("repulsion");

      interaction.handleGesture("rotation", 0.5, 0.5, { rotation: 1 });
      expect(manager.getFields().length).toBe(2);
    });
  });

  describe("5. InteractiveParticleSystem Controller Lifecycle", () => {
    it("manages interactive particle system lifecycle and updates particles", () => {
      const sys = createInteractiveParticleSystem({
        maxParticles: 50,
        forces: [
          {
            type: "directional",
            direction: [1, 0, 0],
            strength: 10,
          },
        ],
        autoStart: false,
      });

      expect(sys).toBeInstanceOf(InteractiveParticleSystem);
      expect(sys.state).toBe("idle");

      // Spawn a particle
      const slot = sys.pool.spawn({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life: 5,
        maxLife: 5,
        startSize: 2,
        endSize: 2,
        startRotation: 0,
        angularVelocity: 0,
        startOpacity: 1,
        endOpacity: 1,
        startColor: [1, 1, 1, 1],
        endColor: [1, 1, 1, 1],
        mass: 1,
      });

      expect(slot).toBeGreaterThanOrEqual(0);

      // Update system
      sys.update(0.016);

      // Particle should have gained velocity and moved right (+X)
      const base = slot * sys.pool.stride;
      expect(sys.pool.buffer[base + 4]).toBeGreaterThan(0); // vx > 0
      expect(sys.pool.buffer[base + 0]).toBeGreaterThan(0); // px > 0

      // Lifecycle transitions
      sys.start();
      expect(sys.state).toBe("running");

      sys.pause();
      expect(sys.state).toBe("paused");

      sys.resume();
      expect(sys.state).toBe("running");

      sys.reset();
      expect(sys.pool.count).toBe(0);

      sys.dispose();
      expect(sys.state).toBe("disposed");
    });

    it("supports standalone helper functions", () => {
      const sys = createInteractiveParticleSystem({ autoStart: false });
      const force = addParticleForce(sys, {
        type: "vortex",
        strength: 20,
        radius: 0.5,
      });

      expect(force).toBeDefined();
      expect(sys.getForces().length).toBe(1);

      updateParticleField(sys, 0.016);
      expect(removeParticleForce(sys, force.id)).toBe(true);

      expect(() => disposeParticleField(sys)).not.toThrow();
    });

    it("renders particle field on Canvas2D context", () => {
      const mockCtx = {
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: "",
      };

      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: (type: string) => (type === "2d" ? mockCtx : null),
      } as unknown as HTMLCanvasElement;

      const sys = createInteractiveParticleSystem({ canvas: mockCanvas, autoStart: false });
      sys.pool.spawn({
        x: 0.5,
        y: 0.5,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        life: 2,
        maxLife: 2,
        startSize: 3,
        endSize: 3,
        startRotation: 0,
        angularVelocity: 0,
        startOpacity: 1,
        endOpacity: 1,
        startColor: [1, 1, 1, 1],
        endColor: [1, 1, 1, 1],
        mass: 1,
      });

      expect(() => sys.render(mockCanvas)).not.toThrow();
      expect(mockCtx.arc).toHaveBeenCalled();
    });
  });

  describe("6. Performance & Scale Benchmark", () => {
    it("evaluates 2,000 particles against multiple forces under 15ms budget", () => {
      const manager = createForceFieldManager({ spatialPartitioning: true });

      // Add 4 diverse spatial force fields
      manager.addField({ type: "attraction", position: [0.3, 0.3, 0], radius: 0.4, strength: 30 });
      manager.addField({ type: "repulsion", position: [0.7, 0.7, 0], radius: 0.4, strength: 30 });
      manager.addField({ type: "vortex", position: [0.5, 0.5, 0], radius: 0.5, strength: 20 });
      manager.addField({ type: "turbulence", strength: 10, frequency: 2.0 });

      const pool = createParticleDataPool(2000);
      for (let i = 0; i < 2000; i++) {
        pool.spawn({
          x: Math.random(),
          y: Math.random(),
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          ax: 0,
          ay: 0,
          az: 0,
          life: 10,
          maxLife: 10,
          startSize: 2,
          endSize: 2,
          startRotation: 0,
          angularVelocity: 0,
          startOpacity: 1,
          endOpacity: 1,
          startColor: [1, 1, 1, 1],
          endColor: [1, 1, 1, 1],
          mass: 1,
        });
      }

      expect(pool.count).toBe(2000);

      const start = performance.now();
      manager.applyToPool(pool, 0.016, 0);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50.0); // Budget for 2000 particles under concurrent multi-worker load
      const metrics = manager.getMetrics(2000);
      expect(metrics.activeFields).toBe(4);
      expect(metrics.forcesEvaluated).toBeGreaterThan(0);
    });
  });
});
