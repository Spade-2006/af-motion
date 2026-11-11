/**
 * AF Motion Fluid & Flow Simulation Engine — Navier-Stokes Solver
 *
 * Implements Stam's unconditionally stable fluid dynamics algorithm with
 * semi-Lagrangian advection, Jacobi pressure projection, viscosity diffusion,
 * obstacle masking, and configurable boundary conditions.
 */

import type {
  FluidBoundaryMode,
  FluidForce,
  FluidGrid,
  FluidSolver,
  FluidSolverConfig,
} from "./types.js";

export class FluidSolverImpl implements FluidSolver {
  readonly config: Required<FluidSolverConfig>;

  constructor(config: FluidSolverConfig = {}) {
    this.config = {
      iterations: Math.max(4, config.iterations ?? 20),
      viscosity: Math.max(0, config.viscosity ?? 0.0001),
      dissipation: Math.min(1, Math.max(0, config.dissipation ?? 0.995)),
      velocityDissipation: Math.min(1, Math.max(0, config.velocityDissipation ?? 0.998)),
      pressureRelaxation: Math.max(0.1, config.pressureRelaxation ?? 1.0),
      boundaryMode: config.boundaryMode ?? "closed",
      maxDeltaTime: Math.max(0.001, config.maxDeltaTime ?? 0.05),
    };
  }

  step(grid: FluidGrid, dt: number, forces: readonly FluidForce[], time: number): void {
    const clampedDt = Math.min(dt, this.config.maxDeltaTime);
    if (clampedDt <= 0) return;

    const w = grid.width;
    const h = grid.height;
    const { viscosity, iterations, dissipation, velocityDissipation, boundaryMode } = this.config;

    // 1. Add external forces & density sources
    this.applyForces(grid, forces, clampedDt);

    // 2. Velocity Step: Diffuse -> Project -> Advect -> Project
    if (viscosity > 0) {
      grid.swapVelocity();
      this.diffuse(1, grid.u, grid.u0, viscosity, clampedDt, iterations, w, h, boundaryMode, grid.obstacles);
      this.diffuse(2, grid.v, grid.v0, viscosity, clampedDt, iterations, w, h, boundaryMode, grid.obstacles);
      this.project(grid.u, grid.v, grid.pressure, grid.divergence, iterations, w, h, boundaryMode, grid.obstacles);
    }

    grid.swapVelocity();
    this.advect(1, grid.u, grid.u0, grid.u0, grid.v0, clampedDt, w, h, boundaryMode, grid.obstacles);
    this.advect(2, grid.v, grid.v0, grid.u0, grid.v0, clampedDt, w, h, boundaryMode, grid.obstacles);
    this.project(grid.u, grid.v, grid.pressure, grid.divergence, iterations, w, h, boundaryMode, grid.obstacles);

    // 3. Density Step: Diffuse -> Advect -> Dissipate
    if (viscosity > 0) {
      grid.swapDensity();
      this.diffuse(0, grid.density, grid.density0, viscosity, clampedDt, iterations, w, h, boundaryMode, grid.obstacles);
    }

    grid.swapDensity();
    this.advect(0, grid.density, grid.density0, grid.u, grid.v, clampedDt, w, h, boundaryMode, grid.obstacles);

    // 4. Apply dissipation decay
    const densDecay = Math.pow(dissipation, clampedDt * 60);
    const velDecay = Math.pow(velocityDissipation, clampedDt * 60);
    const len = grid.size;
    const u = grid.u;
    const v = grid.v;
    const d = grid.density;

    for (let i = 0; i < len; i++) {
      u[i] *= velDecay;
      v[i] *= velDecay;
      d[i] *= densDecay;
    }
  }

  private applyForces(grid: FluidGrid, forces: readonly FluidForce[], dt: number): void {
    if (forces.length === 0) return;

    const w = grid.width;
    const h = grid.height;

    for (let f = 0; f < forces.length; f++) {
      const force = forces[f];
      const radius = force.radius ?? 0.05;
      const rGridX = radius * w;
      const rGridY = radius * h;
      const minX = Math.max(0, Math.floor((force.x - radius) * w));
      const maxX = Math.min(w - 1, Math.ceil((force.x + radius) * w));
      const minY = Math.max(0, Math.floor((force.y - radius) * h));
      const maxY = Math.min(h - 1, Math.ceil((force.y + radius) * h));

      const cx = force.x * w;
      const cy = force.y * h;
      const maxR = Math.max(rGridX, rGridY, 1);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const idx = y * w + x;
          if (grid.obstacles[idx] === 1) continue;

          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= maxR) {
            const factor = Math.max(0, 1 - dist / maxR);
            grid.u[idx] += force.fx * factor * dt;
            grid.v[idx] += force.fy * factor * dt;

            if (force.density !== undefined && force.density > 0) {
              grid.density[idx] += force.density * factor * dt;
            }
          }
        }
      }
    }
  }

  private diffuse(
    b: number,
    x: Float32Array,
    x0: Float32Array,
    diff: number,
    dt: number,
    iterations: number,
    w: number,
    h: number,
    boundaryMode: FluidBoundaryMode,
    obstacles: Uint8Array,
  ): void {
    const a = dt * diff * (w * h);
    const denom = 1 + 4 * a;

    for (let k = 0; k < iterations; k++) {
      for (let j = 1; j < h - 1; j++) {
        const row = j * w;
        for (let i = 1; i < w - 1; i++) {
          const idx = row + i;
          if (obstacles[idx] === 1) {
            x[idx] = 0;
            continue;
          }
          x[idx] =
            (x0[idx] +
              a * (x[idx - 1] + x[idx + 1] + x[idx - w] + x[idx + w])) /
            denom;
        }
      }
      this.setBoundaries(b, x, w, h, boundaryMode, obstacles);
    }
  }

  private advect(
    b: number,
    d: Float32Array,
    d0: Float32Array,
    u: Float32Array,
    v: Float32Array,
    dt: number,
    w: number,
    h: number,
    boundaryMode: FluidBoundaryMode,
    obstacles: Uint8Array,
  ): void {
    const dtX = dt * (w - 2);
    const dtY = dt * (h - 2);

    for (let j = 1; j < h - 1; j++) {
      const row = j * w;
      for (let i = 1; i < w - 1; i++) {
        const idx = row + i;
        if (obstacles[idx] === 1) {
          d[idx] = 0;
          continue;
        }

        let x = i - dtX * u[idx];
        let y = j - dtY * v[idx];

        if (x < 0.5) x = 0.5;
        if (x > w - 1.5) x = w - 1.5;
        const i0 = Math.floor(x);
        const i1 = i0 + 1;

        if (y < 0.5) y = 0.5;
        if (y > h - 1.5) y = h - 1.5;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;

        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        const row0 = j0 * w;
        const row1 = j1 * w;

        d[idx] =
          s0 * (t0 * d0[row0 + i0] + t1 * d0[row1 + i0]) +
          s1 * (t0 * d0[row0 + i1] + t1 * d0[row1 + i1]);
      }
    }
    this.setBoundaries(b, d, w, h, boundaryMode, obstacles);
  }

  private project(
    u: Float32Array,
    v: Float32Array,
    p: Float32Array,
    div: Float32Array,
    iterations: number,
    w: number,
    h: number,
    boundaryMode: FluidBoundaryMode,
    obstacles: Uint8Array,
  ): void {
    const avgDim = (w + h) / 2;

    // 1. Calculate divergence
    for (let j = 1; j < h - 1; j++) {
      const row = j * w;
      for (let i = 1; i < w - 1; i++) {
        const idx = row + i;
        if (obstacles[idx] === 1) {
          div[idx] = 0;
          p[idx] = 0;
          continue;
        }
        div[idx] =
          (-0.5 *
            (u[idx + 1] - u[idx - 1] + v[idx + w] - v[idx - w])) /
          avgDim;
        p[idx] = 0;
      }
    }
    this.setBoundaries(0, div, w, h, boundaryMode, obstacles);
    this.setBoundaries(0, p, w, h, boundaryMode, obstacles);

    // 2. Jacobi relaxation for Poisson equation: ∇²p = div
    for (let k = 0; k < iterations; k++) {
      for (let j = 1; j < h - 1; j++) {
        const row = j * w;
        for (let i = 1; i < w - 1; i++) {
          const idx = row + i;
          if (obstacles[idx] === 1) {
            p[idx] = 0;
            continue;
          }
          p[idx] =
            (div[idx] + p[idx - 1] + p[idx + 1] + p[idx - w] + p[idx + w]) / 4;
        }
      }
      this.setBoundaries(0, p, w, h, boundaryMode, obstacles);
    }

    // 3. Subtract pressure gradient from velocity field
    for (let j = 1; j < h - 1; j++) {
      const row = j * w;
      for (let i = 1; i < w - 1; i++) {
        const idx = row + i;
        if (obstacles[idx] === 1) {
          u[idx] = 0;
          v[idx] = 0;
          continue;
        }
        u[idx] -= 0.5 * (p[idx + 1] - p[idx - 1]) * avgDim;
        v[idx] -= 0.5 * (p[idx + w] - p[idx - w]) * avgDim;
      }
    }
    this.setBoundaries(1, u, w, h, boundaryMode, obstacles);
    this.setBoundaries(2, v, w, h, boundaryMode, obstacles);
  }

  private setBoundaries(
    b: number,
    x: Float32Array,
    w: number,
    h: number,
    boundaryMode: FluidBoundaryMode,
    obstacles: Uint8Array,
  ): void {
    if (boundaryMode === "periodic") {
      // Periodic boundary conditions: wrap left/right and top/bottom
      for (let j = 1; j < h - 1; j++) {
        x[j * w] = x[j * w + (w - 2)];
        x[j * w + (w - 1)] = x[j * w + 1];
      }
      for (let i = 1; i < w - 1; i++) {
        x[i] = x[(h - 2) * w + i];
        x[(h - 1) * w + i] = x[w + i];
      }
    } else if (boundaryMode === "open") {
      // Open / Outflow boundary conditions: zero gradient
      for (let j = 1; j < h - 1; j++) {
        x[j * w] = x[j * w + 1];
        x[j * w + (w - 1)] = x[j * w + (w - 2)];
      }
      for (let i = 1; i < w - 1; i++) {
        x[i] = x[w + i];
        x[(h - 1) * w + i] = x[(h - 2) * w + i];
      }
    } else {
      // Closed / Solid walls: reflect normal velocity, copy tangential
      for (let j = 1; j < h - 1; j++) {
        x[j * w] = b === 1 ? -x[j * w + 1] : x[j * w + 1];
        x[j * w + (w - 1)] = b === 1 ? -x[j * w + (w - 2)] : x[j * w + (w - 2)];
      }
      for (let i = 1; i < w - 1; i++) {
        x[i] = b === 2 ? -x[w + i] : x[w + i];
        x[(h - 1) * w + i] = b === 2 ? -x[(h - 2) * w + i] : x[(h - 2) * w + i];
      }
    }

    // Four corners
    x[0] = 0.5 * (x[1] + x[w]);
    x[w - 1] = 0.5 * (x[w - 2] + x[2 * w - 1]);
    x[(h - 1) * w] = 0.5 * (x[(h - 2) * w] + x[(h - 1) * w + 1]);
    x[h * w - 1] = 0.5 * (x[h * w - 2] + x[(h - 1) * w - 1]);

    // Handle internal obstacles
    for (let idx = 0; idx < x.length; idx++) {
      if (obstacles[idx] === 1) {
        x[idx] = 0;
      }
    }
  }
}

export function createFluidSolver(config?: FluidSolverConfig): FluidSolver {
  return new FluidSolverImpl(config);
}
