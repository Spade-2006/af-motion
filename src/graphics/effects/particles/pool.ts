/**
 * AF Motion Particle Pool
 *
 * Preallocated, bounded particle pool for zero-allocation simulation loops.
 */

import type { ParticleShape, ParticleState } from "../types.js";

function createEmptyParticle(): ParticleState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    size: 4,
    initialSize: 4,
    rotation: 0,
    rotationSpeed: 0,
    color: "#ffffff",
    opacity: 1,
    lifetime: 1,
    age: 0,
    active: false,
    shape: "circle",
  };
}

export class ParticlePool {
  private readonly pool: ParticleState[];
  readonly maxCapacity: number;
  private _activeCount = 0;

  constructor(maxCapacity = 300) {
    this.maxCapacity = Math.max(10, Math.min(2000, maxCapacity));
    this.pool = Array.from({ length: this.maxCapacity }, () => createEmptyParticle());
  }

  get activeCount(): number {
    return this._activeCount;
  }

  acquire(): ParticleState | null {
    if (this._activeCount >= this.maxCapacity) {
      return null;
    }

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.age = 0;
        this._activeCount++;
        return p;
      }
    }

    return null;
  }

  release(particle: ParticleState): void {
    if (particle.active) {
      particle.active = false;
      this._activeCount = Math.max(0, this._activeCount - 1);
    }
  }

  releaseAll(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
    this._activeCount = 0;
  }

  forEachActive(callback: (p: ParticleState) => void): void {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (p.active) {
        callback(p);
      }
    }
  }
}
