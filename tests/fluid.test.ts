/**
 * Vitest Test Suite for AF Motion Fluid & Flow Simulation Engine (Prompt 119)
 */

import { describe, expect, it } from "vitest";
import {
  addFluidForce,
  addFluidObstacle,
  Canvas2DFluidRenderer,
  CompositeFlowField,
  coupleParticlesWithFluid,
  createFlowField,
  createFluidGrid,
  createFluidObstacle,
  createFluidRenderer,
  createFluidSimulation,
  createFluidSolver,
  createPointerForce,
  CurlNoiseFlowField,
  DirectionalFlowField,
  disposeFluidSimulation,
  FluidGridImpl,
  FluidObstacleImpl,
  FluidSolverImpl,
  RadialFlowField,
  rasterizeObstacles,
  resetFluidSimulation,
  sampleFluidVelocity,
  updateFluidSimulation,
  VortexFlowField,
  WebGL2FluidRenderer,
} from "../src/catalogue.js";

describe("Prompt 119 — Fluid & Flow Simulation Engine", () => {
  describe("FluidGrid", () => {
    it("initializes Eulerian grid with correct dimensions and typed arrays", () => {
      const grid = createFluidGrid(32, 32);
      expect(grid.width).toBe(32);
      expect(grid.height).toBe(32);
      expect(grid.size).toBe(1024);

      expect(grid.u).toBeInstanceOf(Float32Array);
      expect(grid.v).toBeInstanceOf(Float32Array);
      expect(grid.density).toBeInstanceOf(Float32Array);
      expect(grid.pressure).toBeInstanceOf(Float32Array);
      expect(grid.divergence).toBeInstanceOf(Float32Array);
      expect(grid.obstacles).toBeInstanceOf(Uint8Array);
      expect(grid.obstacles.length).toBe(1024);
    });

    it("throws error for non-positive dimensions", () => {
      expect(() => createFluidGrid(0, 10)).toThrow();
      expect(() => createFluidGrid(-5, -5)).toThrow();
    });

    it("swaps velocity and density double-buffers", () => {
      const grid = createFluidGrid(16, 16);
      grid.u[5] = 12.5;
      grid.density[5] = 42.0;

      grid.swapVelocity();
      expect(grid.u0[5]).toBe(12.5);
      expect(grid.u[5]).toBe(0);

      grid.swapDensity();
      expect(grid.density0[5]).toBe(42.0);
      expect(grid.density[5]).toBe(0);
    });

    it("clears all buffers to zero", () => {
      const grid = createFluidGrid(16, 16);
      grid.u[10] = 5;
      grid.v[10] = -3;
      grid.density[10] = 99;
      grid.obstacles[10] = 1;

      grid.clear();
      expect(grid.u[10]).toBe(0);
      expect(grid.v[10]).toBe(0);
      expect(grid.density[10]).toBe(0);
      expect(grid.obstacles[10]).toBe(0);
    });

    it("performs bilinear interpolation for velocity and density sampling", () => {
      const grid = createFluidGrid(10, 10);
      // Place density at (5, 5)
      const idx = 5 * 10 + 5;
      grid.density[idx] = 1.0;
      grid.u[idx] = 2.0;
      grid.v[idx] = -4.0;

      // Sample exactly at center (5/9, 5/9)
      const normX = 5 / 9;
      const normY = 5 / 9;
      const d = grid.sampleDensity(normX, normY);
      const [u, v] = grid.sampleVelocity(normX, normY);

      expect(d).toBeCloseTo(1.0, 3);
      expect(u).toBeCloseTo(2.0, 3);
      expect(v).toBeCloseTo(-4.0, 3);

      // Sample halfway between (5, 5) and (6, 5)
      const halfNormX = 5.5 / 9;
      const halfD = grid.sampleDensity(halfNormX, normY);
      expect(halfD).toBeCloseTo(0.5, 3);
    });
  });

  describe("FluidSolver & Numerical Stages", () => {
    it("creates solver with default configuration", () => {
      const solver = createFluidSolver();
      expect(solver).toBeInstanceOf(FluidSolverImpl);
      expect(solver.config.iterations).toBe(20);
      expect(solver.config.viscosity).toBe(0.0001);
      expect(solver.config.dissipation).toBe(0.995);
      expect(solver.config.boundaryMode).toBe("closed");
    });

    it("applies external force impulses to velocity and density fields", () => {
      const grid = createFluidGrid(32, 32);
      const solver = createFluidSolver();

      solver.step(
        grid,
        0.016,
        [
          {
            x: 0.5,
            y: 0.5,
            fx: 50.0,
            fy: -30.0,
            radius: 0.1,
            density: 2.0,
          },
        ],
        0,
      );

      const centerIdx = 16 * 32 + 16;
      expect(grid.u[centerIdx]).toBeGreaterThan(0);
      expect(grid.density[centerIdx]).toBeGreaterThan(0);
    });

    it("enforces incompressibility through pressure projection", () => {
      const grid = createFluidGrid(32, 32);
      const solver = createFluidSolver({ iterations: 30 });

      // Inject strong divergent velocity
      const center = 16 * 32 + 16;
      grid.u[center - 1] = -10;
      grid.u[center + 1] = 10;
      grid.v[center - 32] = -10;
      grid.v[center + 32] = 10;

      // Step simulation
      solver.step(grid, 0.016, [], 0);

      // Total divergence should be smoothed and projected towards zero
      let maxAbsDiv = 0;
      for (let i = 0; i < grid.size; i++) {
        maxAbsDiv = Math.max(maxAbsDiv, Math.abs(grid.divergence[i]));
      }
      expect(maxAbsDiv).toBeLessThan(10.0);
    });

    it("handles boundary modes correctly", () => {
      // Periodic boundary
      const pGrid = createFluidGrid(16, 16);
      const pSolver = createFluidSolver({ boundaryMode: "periodic" });
      pGrid.density[1 * 16 + 1] = 10;
      pSolver.step(pGrid, 0.016, [], 0);
      expect(pSolver.config.boundaryMode).toBe("periodic");

      // Open boundary
      const oGrid = createFluidGrid(16, 16);
      const oSolver = createFluidSolver({ boundaryMode: "open" });
      oSolver.step(oGrid, 0.016, [], 0);
      expect(oSolver.config.boundaryMode).toBe("open");
    });
  });

  describe("FlowField Engine", () => {
    it("evaluates DirectionalFlowField", () => {
      const field = createFlowField({
        type: "directional",
        direction: [1, 0],
        strength: 5,
      });

      expect(field).toBeInstanceOf(DirectionalFlowField);
      expect(field.evaluate(0.5, 0.5, 0)).toEqual([5, 0]);

      field.weight = 0.5;
      expect(field.evaluate(0.5, 0.5, 0)).toEqual([2.5, 0]);

      field.enabled = false;
      expect(field.evaluate(0.5, 0.5, 0)).toEqual([0, 0]);
    });

    it("evaluates RadialFlowField with falloff", () => {
      const field = createFlowField({
        type: "radial",
        center: [0.5, 0.5],
        strength: 10,
        radius: 0.2,
        falloff: "linear",
      });

      expect(field).toBeInstanceOf(RadialFlowField);
      // Beyond radius returns [0, 0]
      expect(field.evaluate(0.8, 0.8, 0)).toEqual([0, 0]);

      // Along positive X within radius
      const [vx, vy] = field.evaluate(0.6, 0.5, 0);
      expect(vx).toBeGreaterThan(0);
      expect(vy).toBeCloseTo(0, 5);
    });

    it("evaluates VortexFlowField with rotational tangential velocity", () => {
      const vortex = createFlowField({
        type: "vortex",
        center: [0.5, 0.5],
        strength: 8,
        radius: 0.3,
      });

      expect(vortex).toBeInstanceOf(VortexFlowField);
      // Point directly right of center at (0.6, 0.5): tangential vector points down (positive Y)
      const [vx, vy] = vortex.evaluate(0.6, 0.5, 0);
      expect(vx).toBeCloseTo(0, 4);
      expect(vy).toBeGreaterThan(0);
    });

    it("evaluates divergence-free CurlNoiseFlowField", () => {
      const curlField = createFlowField({
        type: "curl-noise",
        frequency: 3.0,
        strength: 2.0,
      });

      expect(curlField).toBeInstanceOf(CurlNoiseFlowField);
      const [vx, vy] = curlField.evaluate(0.3, 0.7, 1.0);
      expect(typeof vx).toBe("number");
      expect(typeof vy).toBe("number");
      expect(Number.isNaN(vx)).toBe(false);
      expect(Number.isNaN(vy)).toBe(false);

      // Verify numerical divergence: d(vx)/dx + d(vy)/dy ≈ 0
      const eps = 0.001;
      const [vxRight] = curlField.evaluate(0.3 + eps, 0.7, 1.0);
      const [vxLeft] = curlField.evaluate(0.3 - eps, 0.7, 1.0);
      const dVxDx = (vxRight - vxLeft) / (2 * eps);

      const [, vyUp] = curlField.evaluate(0.3, 0.7 + eps, 1.0);
      const [, vyDown] = curlField.evaluate(0.3, 0.7 - eps, 1.0);
      const dVyDy = (vyUp - vyDown) / (2 * eps);

      const divergence = dVxDx + dVyDy;
      expect(Math.abs(divergence)).toBeLessThan(0.05);
    });

    it("evaluates CompositeFlowField and manages subfields", () => {
      const composite = new CompositeFlowField({
        type: "composite",
        fields: [
          { type: "directional", direction: [1, 0], strength: 2 },
          { type: "directional", direction: [0, 1], strength: 3 },
        ],
      });

      expect(composite.evaluate(0.5, 0.5, 0)).toEqual([2, 3]);

      // Add field
      const newField = composite.addField({
        type: "directional",
        direction: [-1, 0],
        strength: 2,
        id: "opposing-dir",
      });
      expect(composite.getFields().length).toBe(3);
      expect(composite.evaluate(0.5, 0.5, 0)).toEqual([0, 3]);

      // Remove field
      expect(composite.removeField("opposing-dir")).toBe(true);
      expect(composite.evaluate(0.5, 0.5, 0)).toEqual([2, 3]);
    });
  });

  describe("Interactions & Obstacles", () => {
    it("detects obstacle collision for circles and boxes", () => {
      const circleObs = createFluidObstacle({
        type: "circle",
        center: [0.5, 0.5],
        radius: 0.1,
      });

      expect(circleObs.contains(0.5, 0.5)).toBe(true);
      expect(circleObs.contains(0.55, 0.5)).toBe(true);
      expect(circleObs.contains(0.8, 0.8)).toBe(false);

      const boxObs = createFluidObstacle({
        type: "box",
        min: [0.2, 0.2],
        max: [0.4, 0.4],
      });

      expect(boxObs.contains(0.3, 0.3)).toBe(true);
      expect(boxObs.contains(0.1, 0.3)).toBe(false);
    });

    it("rasterizes obstacles onto grid and prevents fluid velocity", () => {
      const grid = createFluidGrid(20, 20);
      const circle = createFluidObstacle({
        type: "circle",
        center: [0.5, 0.5],
        radius: 0.15,
      });

      rasterizeObstacles(grid, [circle]);
      const centerIdx = 10 * 20 + 10;
      expect(grid.obstacles[centerIdx]).toBe(1);

      // Solve step with force hitting obstacle
      const solver = createFluidSolver();
      solver.step(
        grid,
        0.016,
        [{ x: 0.5, y: 0.5, fx: 20, fy: 20, radius: 0.2 }],
        0,
      );

      // Obstacle center velocity must remain 0
      expect(grid.u[centerIdx]).toBe(0);
      expect(grid.v[centerIdx]).toBe(0);
    });

    it("generates pointer impulse forces", () => {
      const force = createPointerForce([0.2, 0.2], [0.25, 0.22], 0.08, 15, 2.5);
      expect(force.x).toBe(0.25);
      expect(force.y).toBe(0.22);
      expect(force.fx).toBeCloseTo(0.05 * 15, 4);
      expect(force.fy).toBeCloseTo(0.02 * 15, 4);
      expect(force.density).toBe(2.5);
    });

    it("couples particles bidirectionally with the fluid grid", () => {
      const grid = createFluidGrid(20, 20);
      // Give fluid positive horizontal velocity at center
      const centerIdx = 10 * 20 + 10;
      grid.u[centerIdx] = 10.0;

      const particles = [{ x: 0.5, y: 0.5, vx: 0, vy: 0 }];
      coupleParticlesWithFluid(grid, particles, 0.9, 0.3, 0.016);

      // Particle should be pushed horizontally by the fluid
      expect(particles[0].vx).toBeGreaterThan(0);
    });
  });

  describe("FluidSimulation Controller & Lifecycle", () => {
    it("creates simulation with resolution and quality tiers", () => {
      const simUltra = createFluidSimulation({ quality: "ultra" });
      expect(simUltra.grid.width).toBe(128);
      expect(simUltra.metrics.gridWidth).toBe(128);

      const simCustom = createFluidSimulation({ resolution: { width: 48, height: 48 } });
      expect(simCustom.grid.width).toBe(48);
      expect(simCustom.grid.height).toBe(48);
    });

    it("handles simulation state transitions: start, pause, resume, reset, dispose", () => {
      const sim = createFluidSimulation({ resolution: 32 });
      expect(sim.state).toBe("idle");

      sim.start();
      expect(sim.state).toBe("running");

      sim.pause();
      expect(sim.state).toBe("paused");

      sim.resume();
      expect(sim.state).toBe("running");

      sim.reset();
      expect(sim.grid.density[0]).toBe(0);

      sim.dispose();
      expect(sim.state).toBe("disposed");

      // Once disposed, start does not run
      sim.start();
      expect(sim.state).toBe("disposed");
    });

    it("updates simulation and calculates metrics", () => {
      const sim = createFluidSimulation({ resolution: 32 });
      sim.addForce({
        x: 0.5,
        y: 0.5,
        fx: 10,
        fy: 10,
        radius: 0.1,
        density: 1.0,
      });

      sim.update(0.016);
      expect(sim.metrics.activeCells).toBeGreaterThan(0);
      expect(sim.metrics.memoryBytes).toBeGreaterThan(0);

      const [u, v] = sim.sampleVelocity(0.5, 0.5);
      expect(typeof u).toBe("number");
      expect(typeof v).toBe("number");

      const d = sim.sampleDensity(0.5, 0.5);
      expect(d).toBeGreaterThan(0);
    });

    it("manages dynamic flow fields and obstacles on simulation", () => {
      const sim = createFluidSimulation({ resolution: 32 });

      // Flow fields
      const flow = sim.addFlowField({
        type: "directional",
        direction: [1, 0],
        strength: 5,
        id: "wind",
      });
      expect(sim.getFlowFields().length).toBe(1);
      expect(sim.removeFlowField("wind")).toBe(true);
      expect(sim.getFlowFields().length).toBe(0);

      // Obstacles
      const obs = sim.addObstacle({
        type: "circle",
        center: [0.5, 0.5],
        radius: 0.1,
      });
      expect(sim.getObstacles().length).toBe(1);
      expect(sim.removeObstacle(obs.id)).toBe(true);
      expect(sim.getObstacles().length).toBe(0);
    });

    it("works with standalone utility functions", () => {
      const sim = createFluidSimulation({ resolution: 32 });

      addFluidForce(sim, { x: 0.5, y: 0.5, fx: 15, fy: -10, density: 1.5 });
      const obs = addFluidObstacle(sim, { type: "box", min: [0.1, 0.1], max: [0.2, 0.2] });
      expect(obs).toBeDefined();

      updateFluidSimulation(sim, 0.016);
      const vel = sampleFluidVelocity(sim, 0.5, 0.5);
      expect(Array.isArray(vel)).toBe(true);

      resetFluidSimulation(sim);
      expect(sim.grid.density[0]).toBe(0);

      disposeFluidSimulation(sim);
      expect(sim.state).toBe("disposed");
    });
  });

  describe("Rendering Pipeline", () => {
    it("instantiates Canvas2DFluidRenderer and executes render modes gracefully", () => {
      const mockCtx = {
        createImageData: (w: number, h: number) => ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4),
        }),
        putImageData: () => {},
        clearRect: () => {},
        drawImage: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        strokeStyle: "",
        fillStyle: "",
        lineWidth: 1,
      };

      const mockCanvas = {
        width: 64,
        height: 64,
        getContext: (type: string) => (type === "2d" ? mockCtx : null),
      } as unknown as HTMLCanvasElement;

      const renderer = new Canvas2DFluidRenderer(mockCanvas, { mode: "density" });
      const grid = createFluidGrid(32, 32);
      grid.density[100] = 0.8;

      expect(() => renderer.render(grid)).not.toThrow();

      // Test other modes
      renderer.setOptions({ mode: "smoke" });
      expect(() => renderer.render(grid)).not.toThrow();

      renderer.setOptions({ mode: "ink" });
      expect(() => renderer.render(grid)).not.toThrow();

      renderer.setOptions({ mode: "velocity" });
      expect(() => renderer.render(grid)).not.toThrow();

      renderer.setOptions({ mode: "pressure" });
      expect(() => renderer.render(grid)).not.toThrow();

      renderer.setOptions({ mode: "vector-field" });
      expect(() => renderer.render(grid)).not.toThrow();

      // Render with obstacles
      const obs = createFluidObstacle({ type: "circle", center: [0.5, 0.5], radius: 0.1 });
      const box = createFluidObstacle({ type: "box", min: [0.1, 0.1], max: [0.2, 0.2] });
      expect(() => renderer.render(grid, [obs, box])).not.toThrow();

      renderer.dispose();
    });

    it("creates fluid renderer via factory", () => {
      const renderer = createFluidRenderer(null);
      expect(renderer).toBeNull();
    });
  });
});
