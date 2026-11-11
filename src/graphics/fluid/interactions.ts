/**
 * AF Motion Fluid & Flow Simulation Engine — Interaction & Obstacles
 *
 * Provides solid obstacle geometry (circles, boxes), obstacle rasterization,
 * pointer impulse generation, and bidirectional particle-fluid coupling.
 */

import type {
  FluidForce,
  FluidGrid,
  FluidObstacle,
  FluidObstacleShape,
  Vector2Tuple,
} from "./types.js";

let obstacleIdSeq = 0;

export class FluidObstacleImpl implements FluidObstacle {
  readonly id: string;
  readonly shape: FluidObstacleShape;
  enabled = true;

  constructor(shape: FluidObstacleShape, id?: string) {
    this.shape = shape;
    this.id = id ?? `obstacle-${++obstacleIdSeq}`;
  }

  contains(normX: number, normY: number): boolean {
    if (!this.enabled) return false;

    if (this.shape.type === "circle") {
      const dx = normX - this.shape.center[0];
      const dy = normY - this.shape.center[1];
      return dx * dx + dy * dy <= this.shape.radius * this.shape.radius;
    }

    if (this.shape.type === "box") {
      const [minX, minY] = this.shape.min;
      const [maxX, maxY] = this.shape.max;
      return normX >= minX && normX <= maxX && normY >= minY && normY <= maxY;
    }

    return false;
  }
}

export function createFluidObstacle(shape: FluidObstacleShape, id?: string): FluidObstacle {
  return new FluidObstacleImpl(shape, id);
}

/**
 * Re-rasterize all active obstacles onto the grid's obstacle buffer.
 */
export function rasterizeObstacles(grid: FluidGrid, obstacles: readonly FluidObstacle[]): void {
  grid.obstacles.fill(0);
  if (obstacles.length === 0) return;

  const w = grid.width;
  const h = grid.height;

  for (let j = 0; j < h; j++) {
    const normY = j / (h - 1);
    const row = j * w;
    for (let i = 0; i < w; i++) {
      const normX = i / (w - 1);

      for (let o = 0; o < obstacles.length; o++) {
        const obs = obstacles[o];
        if (obs.enabled && obs.contains(normX, normY)) {
          const idx = row + i;
          grid.obstacles[idx] = 1;
          grid.u[idx] = 0;
          grid.v[idx] = 0;
          break;
        }
      }
    }
  }
}

/**
 * Creates an impulse force from pointer or touch movement.
 */
export function createPointerForce(
  prevPos: Vector2Tuple,
  currPos: Vector2Tuple,
  radius = 0.05,
  strength = 10.0,
  density = 1.0,
): FluidForce {
  const dx = currPos[0] - prevPos[0];
  const dy = currPos[1] - prevPos[1];
  return {
    x: currPos[0],
    y: currPos[1],
    fx: dx * strength,
    fy: dy * strength,
    radius,
    density,
  };
}

/**
 * Interface representing particles for coupling with the fluid field.
 */
export interface CouplableParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass?: number;
}

/**
 * Coupler between particle systems and the Eulerian fluid grid.
 * - Applies fluid velocity drag to particles.
 * - Injects particle momentum back into the fluid grid.
 */
export function coupleParticlesWithFluid(
  grid: FluidGrid,
  particles: CouplableParticle[],
  drag = 0.8,
  feedback = 0.2,
  dt = 1 / 60,
): void {
  const w = grid.width;
  const h = grid.height;
  const clampedDrag = Math.max(0, Math.min(1, drag));
  const clampedFeedback = Math.max(0, Math.min(1, feedback));

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) continue;

    // 1. Fluid pushes particle
    const [fluidU, fluidV] = grid.sampleVelocity(p.x, p.y);
    const diffU = fluidU - p.vx;
    const diffV = fluidV - p.vy;

    p.vx += diffU * clampedDrag * dt * 60;
    p.vy += diffV * clampedDrag * dt * 60;

    // 2. Particle injects momentum back into fluid
    if (clampedFeedback > 0) {
      const gx = Math.min(w - 1, Math.max(0, Math.round(p.x * (w - 1))));
      const gy = Math.min(h - 1, Math.max(0, Math.round(p.y * (h - 1))));
      const idx = gy * w + gx;

      if (grid.obstacles[idx] === 0) {
        const mass = p.mass ?? 1.0;
        grid.u[idx] += p.vx * clampedFeedback * mass * dt;
        grid.v[idx] += p.vy * clampedFeedback * mass * dt;
      }
    }
  }
}
