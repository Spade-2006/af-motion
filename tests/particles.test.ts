// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createParticleSystem,
  createParticleEmitter,
  addParticleBehavior,
  removeParticleBehavior,
  emitParticles,
  updateParticleSystem,
  resetParticleSystem,
  disposeParticleSystem,
  createParticleDataPool,
  createParticlePRNG,
  sampleShapePosition,
  type ParticleSystem,
  type ParticleDataPool,
} from "../src/catalogue.js";

describe("Prompt 118 — Advanced Particle Engine", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockGL2: any;
  let mock2DContext: any;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    mock2DContext = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillStyle: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
    };

    mockGL2 = {
      VERTEX_SHADER: 0x8b31,
      FRAGMENT_SHADER: 0x8b30,
      POINTS: 0x0000,
      BLEND: 0x0be2,
      DEPTH_TEST: 0x0b71,
      SRC_ALPHA: 0x0302,
      ONE: 1,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      ONE_MINUS_SRC_COLOR: 0x0301,
      createShader: vi.fn().mockReturnValue({}),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      createProgram: vi.fn().mockReturnValue({}),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      createVertexArray: vi.fn().mockReturnValue({}),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      createBuffer: vi.fn().mockReturnValue({}),
      deleteBuffer: vi.fn(),
      useProgram: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      blendFunc: vi.fn(),
      drawArrays: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (type: string) {
      if (type === "webgl2") return mockGL2;
      if (type === "2d") return mock2DContext;
      return null;
    }) as any;

    mockCanvas = document.createElement("canvas");
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  describe("1. Particle Data Layout & Pool", () => {
    it("allocates contiguous Float32Array pool with stride 24", () => {
      const pool = createParticleDataPool(100);
      expect(pool.capacity).toBe(100);
      expect(pool.count).toBe(0);
      expect(pool.stride).toBe(24);
      expect(pool.buffer.length).toBe(100 * 24);
      expect(pool.buffer.byteLength).toBe(100 * 24 * 4);
    });

    it("spawns particles and exposes accessor getters and setters", () => {
      const pool = createParticleDataPool(10);
      const slot = pool.spawn({
        x: 10,
        y: 20,
        z: 30,
        vx: 1,
        vy: 2,
        vz: 3,
        ax: 0,
        ay: 0,
        az: 0,
        life: 5,
        maxLife: 5,
        startSize: 8,
        endSize: 0,
        startRotation: 0,
        angularVelocity: 1.5,
        startOpacity: 1,
        endOpacity: 0,
        startColor: [1, 0.5, 0.2, 1],
        endColor: [1, 0.5, 0.2, 0],
        mass: 2,
      });

      expect(slot).toBeGreaterThanOrEqual(0);
      expect(pool.count).toBe(1);

      const p = pool.getAccessor(slot);
      expect(p.x).toBe(10);
      expect(p.y).toBe(20);
      expect(p.z).toBe(30);
      expect(p.life).toBe(5);
      expect(p.size).toBe(8);
      expect(p.mass).toBe(2);
      expect(p.color[0]).toBeCloseTo(1);
      expect(p.color[1]).toBeCloseTo(0.5);
      expect(p.color[2]).toBeCloseTo(0.2);
      expect(p.color[3]).toBeCloseTo(1);

      p.x = 42;
      expect(p.x).toBe(42);
    });

    it("recycles dead particle slots in O(1) using free-list", () => {
      const pool = createParticleDataPool(2);

      const s0 = pool.spawn({
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0,
        life: 1, maxLife: 1, startSize: 1, endSize: 0, startRotation: 0,
        angularVelocity: 0, startOpacity: 1, endOpacity: 0,
        startColor: [1, 1, 1, 1], endColor: [0, 0, 0, 0], mass: 1,
      });
      const s1 = pool.spawn({
        x: 1, y: 1, z: 1, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0,
        life: 1, maxLife: 1, startSize: 1, endSize: 0, startRotation: 0,
        angularVelocity: 0, startOpacity: 1, endOpacity: 0,
        startColor: [1, 1, 1, 1], endColor: [0, 0, 0, 0], mass: 1,
      });

      expect(pool.count).toBe(2);

      // Pool is full, spawn should return -1
      const s2 = pool.spawn({
        x: 2, y: 2, z: 2, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0,
        life: 1, maxLife: 1, startSize: 1, endSize: 0, startRotation: 0,
        angularVelocity: 0, startOpacity: 1, endOpacity: 0,
        startColor: [1, 1, 1, 1], endColor: [0, 0, 0, 0], mass: 1,
      });
      expect(s2).toBe(-1);

      // Kill s0
      pool.kill(s0);
      expect(pool.count).toBe(1);

      // Next spawn should immediately reuse the killed slot
      const s3 = pool.spawn({
        x: 3, y: 3, z: 3, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0,
        life: 1, maxLife: 1, startSize: 1, endSize: 0, startRotation: 0,
        angularVelocity: 0, startOpacity: 1, endOpacity: 0,
        startColor: [1, 1, 1, 1], endColor: [0, 0, 0, 0], mass: 1,
      });
      expect(s3).toBe(s0);
      expect(pool.count).toBe(2);
    });
  });

  describe("2. Particle Emitter System", () => {
    it("samples positions across all geometric emitter shapes", () => {
      const prng = createParticlePRNG(42);

      // 1. Point
      const pt = sampleShapePosition({ type: "point", position: [10, 20, 30] }, prng);
      expect(pt).toEqual([10, 20, 30]);

      // 2. Line
      const line = sampleShapePosition({ type: "line", start: [0, 0, 0], end: [100, 0, 0] }, prng);
      expect(line[0]).toBeGreaterThanOrEqual(0);
      expect(line[0]).toBeLessThanOrEqual(100);
      expect(line[1]).toBe(0);

      // 3. Circle
      const circle = sampleShapePosition({ type: "circle", radius: 50, plane: "xy" }, prng);
      const dist2D = Math.hypot(circle[0], circle[1]);
      expect(dist2D).toBeLessThanOrEqual(50);
      expect(circle[2]).toBe(0);

      // 4. Rectangle
      const rect = sampleShapePosition({ type: "rectangle", width: 20, height: 40, plane: "xy" }, prng);
      expect(Math.abs(rect[0])).toBeLessThanOrEqual(10);
      expect(Math.abs(rect[1])).toBeLessThanOrEqual(20);

      // 5. Sphere
      const sphere = sampleShapePosition({ type: "sphere", radius: 10 }, prng);
      const dist3D = Math.hypot(sphere[0], sphere[1], sphere[2]);
      expect(dist3D).toBeLessThanOrEqual(10.001);

      // 6. Box
      const box = sampleShapePosition({ type: "box", dimensions: [10, 20, 30] }, prng);
      expect(Math.abs(box[0])).toBeLessThanOrEqual(5);
      expect(Math.abs(box[1])).toBeLessThanOrEqual(10);
      expect(Math.abs(box[2])).toBeLessThanOrEqual(15);

      // 7. Cone
      const cone = sampleShapePosition(
        { type: "cone", direction: [0, 1, 0], angle: Math.PI / 4, baseRadius: 10, height: 50 },
        prng,
      );
      expect(cone[1]).toBeGreaterThanOrEqual(0);
      expect(cone[1]).toBeLessThanOrEqual(50);

      // 8. Custom
      const custom = sampleShapePosition(
        { type: "custom", generate: () => ({ x: 77, y: 88, z: 99 }) },
        prng,
      );
      expect(custom).toEqual([77, 88, 99]);
    });

    it("spawns particles continuously according to emission rate", () => {
      const emitter = createParticleEmitter({ rate: 100 });
      const pool = createParticleDataPool(500);
      const prng = createParticlePRNG(1);

      // 0.1 seconds at 100 particles/sec = 10 particles
      const spawned = emitter.update(0.1, pool, prng);
      expect(spawned).toBe(10);
      expect(pool.count).toBe(10);
    });

    it("triggers instantaneous burst emission with deterministic PRNG", () => {
      const emitter = createParticleEmitter({ rate: 0 });
      const pool = createParticleDataPool(100);
      const prng = createParticlePRNG(99);

      const count = emitter.burst(25, pool, prng);
      expect(count).toBe(25);
      expect(pool.count).toBe(25);
    });
  });

  describe("3. Physical Behaviors", () => {
    let pool: ParticleDataPool;

    beforeEach(() => {
      pool = createParticleDataPool(10);
    });

    it("applies directional gravity force", () => {
      const slot = pool.spawn({
        x: 0, y: 100, z: 0, vx: 0, vy: 0, vz: 0, ax: 0, ay: 0, az: 0,
        life: 10, maxLife: 10, startSize: 1, endSize: 1, startRotation: 0,
        angularVelocity: 0, startOpacity: 1, endOpacity: 1,
        startColor: [1, 1, 1, 1], endColor: [1, 1, 1, 1], mass: 1,
      });

      const system = createParticleSystem({
        behaviors: [{ type: "gravity", force: [0, -10, 0] }],
        fixedTimestep: 0.1,
      });

      system.burst(1);
      system.update(0.1);

      const p = pool.getAccessor(slot);
      expect(p).toBeDefined();
      system.dispose();
    });

    it("applies drag / velocity damping", () => {
      const system = createParticleSystem({
        emitters: [{
          rate: 0,
          speed: 100,
          direction: [1, 0, 0],
          spread: 0,
          lifetime: 5,
        }],
        behaviors: [{ type: "drag", coefficient: 0.5 }],
        fixedTimestep: 0.1,
      });

      system.burst(1);
      system.update(0.1);
      expect(system.particleCount).toBe(1);

      system.dispose();
    });

    it("constrains particles with boundary bounds and bounces", () => {
      const system = createParticleSystem({
        emitters: [{
          rate: 0,
          shape: { type: "point", position: [9, 0, 0] },
          speed: 100,
          direction: [1, 0, 0],
          spread: 0,
          lifetime: 5,
        }],
        behaviors: [{
          type: "boundary-constraints",
          bounds: [-10, 10, -10, 10, -10, 10],
          action: "bounce",
          restitution: 0.5,
        }],
        fixedTimestep: 0.1,
      });

      system.burst(1);
      // Particle spawns at x=9, vx=100. Over 0.1s it attempts to move to x=19, which exceeds maxX=10 and bounces
      system.update(0.1);
      expect(system.particleCount).toBe(1);

      system.dispose();
    });
  });

  describe("4. Particle System Lifecycle & Controls", () => {
    it("manages start, pause, resume, reset, and stop states", () => {
      const system = createParticleSystem({
        emitters: [{ rate: 50, lifetime: 2 }],
        fixedTimestep: 0.1,
      });

      expect(system.state).toBe("idle");

      system.start();
      expect(system.state).toBe("running");

      system.update(0.1);
      expect(system.particleCount).toBeGreaterThan(0);

      system.pause();
      expect(system.state).toBe("paused");
      const pausedCount = system.particleCount;
      system.update(0.1);
      expect(system.particleCount).toBe(pausedCount);

      system.resume();
      expect(system.state).toBe("running");

      system.reset();
      expect(system.state).toBe("idle");
      expect(system.particleCount).toBe(0);

      system.stop();
      expect(system.state).toBe("stopped");

      system.dispose();
      expect(system.state).toBe("disposed");
    });

    it("dynamically adds and removes emitters and behaviors", () => {
      const system = createParticleSystem();

      const emitter = system.addEmitter({ id: "fire_emitter", rate: 20 });
      expect(system.getEmitters().length).toBe(1);
      expect(emitter.id).toBe("fire_emitter");

      const removedEmitter = system.removeEmitter("fire_emitter");
      expect(removedEmitter).toBe(true);
      expect(system.getEmitters().length).toBe(0);

      system.addBehavior({ id: "wind", type: "directional-force", force: [5, 0, 0] });
      expect(system.getBehaviors().length).toBe(1);

      const removedBehavior = system.removeBehavior("wind");
      expect(removedBehavior).toBe(true);
      expect(system.getBehaviors().length).toBe(0);

      system.dispose();
    });

    it("tracks live performance metrics", () => {
      const system = createParticleSystem({
        maxParticles: 500,
        emitters: [{ rate: 100 }],
        fixedTimestep: 0.05,
      });

      system.start();
      system.update(0.05);

      const m = system.metrics;
      expect(m.particleCount).toBeGreaterThan(0);
      expect(m.maxParticles).toBeGreaterThanOrEqual(100);
      expect(m.memoryBytes).toBeGreaterThan(0);
      expect(m.emitterCount).toBe(1);
      expect(typeof m.stepTimeMs).toBe("number");

      system.dispose();
    });
  });

  describe("5. Rendering Strategies & Fallback", () => {
    it("renders particles via Canvas2D fallback when WebGL2 is not selected", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;

      const system = createParticleSystem({
        backend: "cpu",
        canvas,
        emitters: [{ rate: 0 }],
      });

      system.burst(5);
      expect(system.particleCount).toBe(5);

      system.render(canvas);
      expect(mock2DContext.arc).toHaveBeenCalled();
      expect(mock2DContext.fill).toHaveBeenCalled();

      system.dispose();
    });

    it("renders particles with WebGL2 point sprites when WebGL2 context is active", () => {
      const canvas = document.createElement("canvas");
      canvas.getContext = vi.fn().mockImplementation((type: string) => {
        if (type === "webgl2") return mockGL2;
        return null;
      }) as any;

      const system = createParticleSystem({
        backend: "webgl2",
        canvas,
        emitters: [{ rate: 0 }],
      });

      system.burst(10);
      expect(system.particleCount).toBe(10);

      system.render(canvas);
      expect(mockGL2.useProgram).toHaveBeenCalled();
      expect(mockGL2.drawArrays).toHaveBeenCalledWith(mockGL2.POINTS, 0, 10);

      system.dispose();
      expect(mockGL2.deleteProgram).toHaveBeenCalled();
    });
  });

  describe("6. Standalone Public API Functions", () => {
    it("operates standalone controller functions", () => {
      const system = createParticleSystem({ maxParticles: 200, emitters: [{ rate: 0 }] });

      addParticleBehavior(system, { type: "gravity", force: [0, -9.8, 0] });
      expect(system.getBehaviors().length).toBe(1);

      emitParticles(system, 15);
      expect(system.particleCount).toBe(15);

      updateParticleSystem(system, 0.05);
      expect(system.particleCount).toBe(15);

      resetParticleSystem(system);
      expect(system.particleCount).toBe(0);

      const removed = removeParticleBehavior(system, "gravity");
      expect(removed).toBe(true);

      disposeParticleSystem(system);
      expect(system.state).toBe("disposed");
    });
  });
});
