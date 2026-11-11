/**
 * AF Motion Fluid & Flow Simulation Engine — Eulerian Grid
 *
 * Provides a 2D staggered/collocated Eulerian grid with double-buffered
 * velocity and density fields, pressure, divergence, and obstacle masks.
 */

import type { FluidGrid, Vector2Tuple } from "./types.js";

export class FluidGridImpl implements FluidGrid {
  readonly width: number;
  readonly height: number;
  readonly size: number;

  private _u: Float32Array;
  private _v: Float32Array;
  private _u0: Float32Array;
  private _v0: Float32Array;
  private _density: Float32Array;
  private _density0: Float32Array;
  private readonly _pressure: Float32Array;
  private readonly _divergence: Float32Array;
  private readonly _obstacles: Uint8Array;

  constructor(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      throw new Error(`Fluid grid dimensions must be positive integers, got ${width}x${height}`);
    }
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    this.size = this.width * this.height;

    this._u = new Float32Array(this.size);
    this._v = new Float32Array(this.size);
    this._u0 = new Float32Array(this.size);
    this._v0 = new Float32Array(this.size);
    this._density = new Float32Array(this.size);
    this._density0 = new Float32Array(this.size);
    this._pressure = new Float32Array(this.size);
    this._divergence = new Float32Array(this.size);
    this._obstacles = new Uint8Array(this.size);
  }

  get u(): Float32Array {
    return this._u;
  }

  get v(): Float32Array {
    return this._v;
  }

  get u0(): Float32Array {
    return this._u0;
  }

  get v0(): Float32Array {
    return this._v0;
  }

  get density(): Float32Array {
    return this._density;
  }

  get density0(): Float32Array {
    return this._density0;
  }

  get pressure(): Float32Array {
    return this._pressure;
  }

  get divergence(): Float32Array {
    return this._divergence;
  }

  get obstacles(): Uint8Array {
    return this._obstacles;
  }

  swapVelocity(): void {
    const tmpU = this._u;
    this._u = this._u0;
    this._u0 = tmpU;

    const tmpV = this._v;
    this._v = this._v0;
    this._v0 = tmpV;
  }

  swapDensity(): void {
    const tmpD = this._density;
    this._density = this._density0;
    this._density0 = tmpD;
  }

  clear(): void {
    this._u.fill(0);
    this._v.fill(0);
    this._u0.fill(0);
    this._v0.fill(0);
    this._density.fill(0);
    this._density0.fill(0);
    this._pressure.fill(0);
    this._divergence.fill(0);
    this._obstacles.fill(0);
  }

  /**
   * Sample bilinear velocity at normalized [0, 1] coordinates.
   */
  sampleVelocity(normX: number, normY: number): Vector2Tuple {
    const gx = Math.max(0, Math.min(1, normX)) * (this.width - 1);
    const gy = Math.max(0, Math.min(1, normY)) * (this.height - 1);

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = Math.min(this.width - 1, x0 + 1);
    const y1 = Math.min(this.height - 1, y0 + 1);

    const fx = gx - x0;
    const fy = gy - y0;

    const idx00 = y0 * this.width + x0;
    const idx10 = y0 * this.width + x1;
    const idx01 = y1 * this.width + x0;
    const idx11 = y1 * this.width + x1;

    const u0 = this._u[idx00] * (1 - fx) + this._u[idx10] * fx;
    const u1 = this._u[idx01] * (1 - fx) + this._u[idx11] * fx;
    const u = u0 * (1 - fy) + u1 * fy;

    const v0 = this._v[idx00] * (1 - fx) + this._v[idx10] * fx;
    const v1 = this._v[idx01] * (1 - fx) + this._v[idx11] * fx;
    const v = v0 * (1 - fy) + v1 * fy;

    return [u, v];
  }

  /**
   * Sample bilinear scalar density at normalized [0, 1] coordinates.
   */
  sampleDensity(normX: number, normY: number): number {
    const gx = Math.max(0, Math.min(1, normX)) * (this.width - 1);
    const gy = Math.max(0, Math.min(1, normY)) * (this.height - 1);

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = Math.min(this.width - 1, x0 + 1);
    const y1 = Math.min(this.height - 1, y0 + 1);

    const fx = gx - x0;
    const fy = gy - y0;

    const idx00 = y0 * this.width + x0;
    const idx10 = y0 * this.width + x1;
    const idx01 = y1 * this.width + x0;
    const idx11 = y1 * this.width + x1;

    const d0 = this._density[idx00] * (1 - fx) + this._density[idx10] * fx;
    const d1 = this._density[idx01] * (1 - fx) + this._density[idx11] * fx;

    return d0 * (1 - fy) + d1 * fy;
  }
}

export function createFluidGrid(width: number, height: number): FluidGrid {
  return new FluidGridImpl(width, height);
}
