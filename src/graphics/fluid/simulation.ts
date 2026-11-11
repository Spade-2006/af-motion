/**
 * AF Motion Fluid & Flow Simulation Engine — Simulation Controller
 *
 * Coordinates Eulerian fluid grid, Navier-Stokes numerical solver, flow fields,
 * obstacle collision, rendering pipeline, and hardware capability adaptation.
 */

import { resolveQualityProfile } from "../composition/quality.js";
import { selectComputeBackend } from "../gpu-simulation/backends/selection.js";
import type { ComputeBackendType } from "../gpu-simulation/types.js";
import { CompositeFlowField, createFlowField } from "./flow-field.js";
import { createFluidGrid, FluidGridImpl } from "./grid.js";
import { createFluidObstacle, rasterizeObstacles } from "./interactions.js";
import { createFluidRenderer, type FluidRenderer } from "./rendering.js";
import { createFluidSolver, FluidSolverImpl } from "./solver.js";
import type {
  FlowField,
  FlowFieldConfig,
  FluidForce,
  FluidGrid,
  FluidObstacle,
  FluidObstacleShape,
  FluidSimulation,
  FluidSimulationConfig,
  FluidSimulationMetrics,
  FluidSimulationState,
  Vector2Tuple,
} from "./types.js";

let simIdSeq = 0;

export class FluidSimulationImpl implements FluidSimulation {
  readonly id: string;
  readonly grid: FluidGrid;
  readonly backend: ComputeBackendType | "canvas2d";

  private _state: FluidSimulationState = "idle";
  private readonly solver: FluidSolverImpl;
  private readonly compositeFlowField: CompositeFlowField;
  private readonly obstacles: FluidObstacle[] = [];
  private readonly queuedForces: FluidForce[] = [];
  private renderer: FluidRenderer | null = null;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private totalSimTime = 0;
  private readonly fixedTimestep: number;

  private _metrics: FluidSimulationMetrics;

  constructor(config: FluidSimulationConfig = {}) {
    this.id = config.id ?? `fluid-sim-${++simIdSeq}`;

    // Resolve quality profile
    const qualityLevel = config.quality ?? "high";
    const profile = resolveQualityProfile(qualityLevel);

    // Resolve grid dimensions
    let width = 64;
    let height = 64;
    if (typeof config.resolution === "number") {
      width = Math.max(8, Math.floor(config.resolution));
      height = width;
    } else if (config.resolution && typeof config.resolution === "object") {
      width = Math.max(8, Math.floor(config.resolution.width));
      height = Math.max(8, Math.floor(config.resolution.height));
    } else {
      if (qualityLevel === "ultra") {
        width = 128;
        height = 128;
      } else if (qualityLevel === "high") {
        width = 96;
        height = 96;
      } else if (qualityLevel === "medium") {
        width = 64;
        height = 64;
      } else {
        width = 32;
        height = 32;
      }
    }

    this.grid = createFluidGrid(width, height);
    this.fixedTimestep = config.fixedTimestep ?? 1 / 60;

    // Solver configuration with quality-adapted iterations
    const iterations =
      config.solver?.iterations ??
      (qualityLevel === "ultra"
        ? 32
        : qualityLevel === "high"
        ? 24
        : qualityLevel === "medium"
        ? 16
        : 10);

    this.solver = new FluidSolverImpl({
      ...config.solver,
      iterations,
    });

    // Flow fields
    this.compositeFlowField = new CompositeFlowField({
      type: "composite",
      id: `${this.id}-composite-flow`,
      fields: config.flowFields ?? [],
    });

    // Obstacles
    if (config.obstacles) {
      for (const shape of config.obstacles) {
        this.obstacles.push(createFluidObstacle(shape));
      }
      rasterizeObstacles(this.grid, this.obstacles);
    }

    // Backend selection via Prompt 117
    const selection = selectComputeBackend({
      preference: config.backend || "auto",
      canvas: config.canvas || null,
    });
    if (selection.backend === "webgl2" && config.canvas) {
      this.backend = "webgl2";
    } else {
      this.backend = selection.backend === "cpu" ? "canvas2d" : selection.backend;
    }

    // Renderer setup
    if (config.canvas) {
      this.renderer = createFluidRenderer(config.canvas, config.renderOptions);
    }

    this._metrics = {
      gridWidth: width,
      gridHeight: height,
      activeCells: 0,
      fps: 60,
      stepTimeMs: 0,
      renderTimeMs: 0,
      memoryBytes: width * height * (8 * 4 + 1), // 8 float arrays + 1 uint8
      backend: this.backend,
    };

    if (config.autoStart) {
      this.start();
    }
  }

  get state(): FluidSimulationState {
    return this._state;
  }

  get metrics(): FluidSimulationMetrics {
    return this._metrics;
  }

  start(): void {
    if (this._state === "running" || this._state === "disposed") return;
    this._state = "running";
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const loop = (currentTime: number) => {
      if (this._state !== "running") return;
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      this.update(dt || this.fixedTimestep);

      if (typeof requestAnimationFrame !== "undefined") {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    if (typeof requestAnimationFrame !== "undefined") {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  pause(): void {
    if (this._state !== "running") return;
    this._state = "paused";
    if (this.animFrameId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume(): void {
    if (this._state === "paused") {
      this.start();
    }
  }

  reset(): void {
    this.grid.clear();
    this.queuedForces.length = 0;
    rasterizeObstacles(this.grid, this.obstacles);
    this.totalSimTime = 0;
  }

  dispose(): void {
    this.pause();
    this._state = "disposed";
    this.renderer?.dispose();
    this.renderer = null;
    this.queuedForces.length = 0;
  }

  update(deltaTime?: number): void {
    if (this._state === "disposed") return;

    const startPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = deltaTime ?? this.fixedTimestep;
    this.totalSimTime += dt;

    // 1. Gather all active forces: queued impulses + flow field samples
    const activeForces: FluidForce[] = [...this.queuedForces];
    this.queuedForces.length = 0;

    // Apply composite flow fields by sampling across the grid
    if (this.compositeFlowField.enabled && this.compositeFlowField.getFields().length > 0) {
      const stepX = Math.max(1, Math.floor(this.grid.width / 16));
      const stepY = Math.max(1, Math.floor(this.grid.height / 16));
      for (let gy = 0; gy < this.grid.height; gy += stepY) {
        const ny = gy / (this.grid.height - 1);
        for (let gx = 0; gx < this.grid.width; gx += stepX) {
          const nx = gx / (this.grid.width - 1);
          const [fx, fy] = this.compositeFlowField.evaluate(nx, ny, this.totalSimTime);
          if (fx !== 0 || fy !== 0) {
            activeForces.push({
              x: nx,
              y: ny,
              fx,
              fy,
              radius: Math.max(1 / this.grid.width, 1 / this.grid.height) * 1.5,
            });
          }
        }
      }
    }

    // 2. Solve fluid step
    this.solver.step(this.grid, dt, activeForces, this.totalSimTime);

    const stepPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    const stepTimeMs = stepPerf - startPerf;

    // 3. Render if renderer is attached
    let renderTimeMs = 0;
    if (this.renderer) {
      const rStart = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.renderer.render(this.grid, this.obstacles);
      const rEnd = typeof performance !== "undefined" ? performance.now() : Date.now();
      renderTimeMs = rEnd - rStart;
    }

    // 4. Update metrics
    let activeCells = 0;
    const len = this.grid.size;
    const density = this.grid.density;
    for (let i = 0; i < len; i++) {
      if (density[i] > 0.001) activeCells++;
    }

    this._metrics = {
      gridWidth: this.grid.width,
      gridHeight: this.grid.height,
      activeCells,
      fps: dt > 0 ? Math.min(120, Math.round(1 / dt)) : 60,
      stepTimeMs,
      renderTimeMs,
      memoryBytes: this.grid.size * (8 * 4 + 1),
      backend: this.backend,
    };
  }

  render(canvas?: HTMLCanvasElement, context?: unknown): void {
    if (canvas && (!this.renderer || canvas !== (this.renderer as any).canvas)) {
      this.renderer?.dispose();
      this.renderer = createFluidRenderer(canvas);
    }
    this.renderer?.render(this.grid, this.obstacles);
  }

  addForce(force: FluidForce): void {
    if (this._state === "disposed") return;
    this.queuedForces.push(force);
  }

  addObstacle(shape: FluidObstacleShape, id?: string): FluidObstacle {
    const obstacle = createFluidObstacle(shape, id);
    this.obstacles.push(obstacle);
    rasterizeObstacles(this.grid, this.obstacles);
    return obstacle;
  }

  removeObstacle(id: string): boolean {
    const idx = this.obstacles.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.obstacles.splice(idx, 1);
      rasterizeObstacles(this.grid, this.obstacles);
      return true;
    }
    return false;
  }

  addFlowField(field: FlowField | FlowFieldConfig): FlowField {
    return this.compositeFlowField.addField(field);
  }

  removeFlowField(id: string): boolean {
    return this.compositeFlowField.removeField(id);
  }

  sampleVelocity(normX: number, normY: number): Vector2Tuple {
    return this.grid.sampleVelocity(normX, normY);
  }

  sampleDensity(normX: number, normY: number): number {
    return this.grid.sampleDensity(normX, normY);
  }

  getObstacles(): readonly FluidObstacle[] {
    return this.obstacles;
  }

  getFlowFields(): readonly FlowField[] {
    return this.compositeFlowField.getFields();
  }
}

export function createFluidSimulation(config?: FluidSimulationConfig): FluidSimulation {
  return new FluidSimulationImpl(config);
}

export function addFluidForce(sim: FluidSimulation, force: FluidForce): void {
  sim.addForce(force);
}

export function addFluidObstacle(
  sim: FluidSimulation,
  shape: FluidObstacleShape,
  id?: string,
): FluidObstacle {
  return sim.addObstacle(shape, id);
}

export function updateFluidSimulation(sim: FluidSimulation, deltaTime?: number): void {
  sim.update(deltaTime);
}

export function sampleFluidVelocity(
  sim: FluidSimulation,
  normX: number,
  normY: number,
): Vector2Tuple {
  return sim.sampleVelocity(normX, normY);
}

export function resetFluidSimulation(sim: FluidSimulation): void {
  sim.reset();
}

export function disposeFluidSimulation(sim: FluidSimulation): void {
  sim.dispose();
}
