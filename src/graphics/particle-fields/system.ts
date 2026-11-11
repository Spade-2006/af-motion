/**
 * AF Motion Interactive Particle Fields & Forces — Master System Controller
 *
 * Coordinates particle pools, composite force fields, pointer interaction,
 * gesture response, fluid/wind coupling, and hardware-accelerated rendering.
 */

import {
  OFFSET_COLOR_A,
  OFFSET_COLOR_B,
  OFFSET_COLOR_G,
  OFFSET_COLOR_R,
  OFFSET_LIFE,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_SIZE,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
} from "../particles/data-layout.js";
import { createParticleDataPool } from "../particles/data-layout.js";
import type { ParticleDataPool } from "../particles/types.js";
import { ForceFieldManager } from "./composition.js";
import {
  createAttractionField,
  createForceField,
  createRepulsionField,
  createTurbulenceField,
  createVortexField,
} from "./forces.js";
import { ParticleInteractionController } from "./interaction.js";
import type {
  AttractionForceConfig,
  ForceField,
  ForceFieldConfig,
  InteractiveParticleSystemConfig,
  ParticleFieldMetrics,
  RepulsionForceConfig,
  TurbulenceForceConfig,
  VortexForceConfig,
} from "./types.js";
import type { GestureType } from "../../core/interactions/types.js";

let systemIdSeq = 0;

export class InteractiveParticleSystem {
  readonly id: string;
  readonly pool: ParticleDataPool;
  readonly fieldManager: ForceFieldManager;
  readonly interaction: ParticleInteractionController;

  private _state: "idle" | "running" | "paused" | "disposed" = "idle";
  private canvas: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private totalTime = 0;

  constructor(config: InteractiveParticleSystemConfig = {}) {
    this.id = config.id ?? `interactive-particle-sys-${++systemIdSeq}`;
    const maxParticles = Math.max(10, config.maxParticles ?? 2000);

    this.pool = createParticleDataPool(maxParticles);
    this.fieldManager = new ForceFieldManager(config.composition);
    this.interaction = new ParticleInteractionController(
      this.fieldManager,
      config.pointerInteraction,
      config.gestureMappings,
    );

    this.canvas = config.canvas ?? null;

    // Attach initial forces
    if (config.forces) {
      for (const f of config.forces) {
        this.fieldManager.addField(f);
      }
    }

    if (config.autoStart) {
      this.start();
    }
  }

  get state(): "idle" | "running" | "paused" | "disposed" {
    return this._state;
  }

  start(): void {
    if (this._state === "running" || this._state === "disposed") return;
    this._state = "running";
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const loop = (currentTime: number) => {
      if (this._state !== "running") return;
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      this.update(dt || 1 / 60);

      if (this.canvas) {
        this.render(this.canvas);
      }

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
    this.pool.clear();
    this.totalTime = 0;
  }

  dispose(): void {
    this.pause();
    this._state = "disposed";
    this.interaction.clear();
    this.fieldManager.clear();
    this.pool.clear();
  }

  update(deltaTime?: number): void {
    if (this._state === "disposed") return;

    const dt = deltaTime ?? 1 / 60;
    this.totalTime += dt;

    // 1. Apply composite force fields to particle pool
    this.fieldManager.applyToPool(this.pool, dt, this.totalTime);

    // 2. Integrate particle velocities & positions
    const activeIndices = this.pool.getActiveIndices();
    const count = activeIndices.length;
    const buf = this.pool.buffer;
    const stride = this.pool.stride;

    for (let i = 0; i < count; i++) {
      const idx = activeIndices[i]!;
      const base = idx * stride;

      // Update velocities from accelerations
      buf[base + 4]! += buf[base + 8]! * dt; // vx += ax * dt
      buf[base + 5]! += buf[base + 9]! * dt; // vy += ay * dt
      buf[base + 6]! += buf[base + 10]! * dt; // vz += az * dt

      // Clear accelerations
      buf[base + 8] = 0;
      buf[base + 9] = 0;
      buf[base + 10] = 0;

      // Update positions from velocities
      buf[base + OFFSET_POS_X]! += buf[base + OFFSET_VEL_X]! * dt;
      buf[base + OFFSET_POS_Y]! += buf[base + OFFSET_VEL_Y]! * dt;

      // Step life
      const life = buf[base + OFFSET_LIFE]! - dt;
      if (life <= 0) {
        this.pool.kill(idx);
      } else {
        buf[base + OFFSET_LIFE] = life;
      }
    }
  }

  render(canvas?: HTMLCanvasElement): void {
    const target = canvas ?? this.canvas;
    if (!target) return;

    const ctx = target.getContext("2d");
    if (!ctx) return;

    const targetW = target.width || 800;
    const targetH = target.height || 600;

    ctx.clearRect(0, 0, targetW, targetH);

    const activeIndices = this.pool.getActiveIndices();
    const buf = this.pool.buffer;
    const stride = this.pool.stride;

    ctx.beginPath();
    for (let i = 0; i < activeIndices.length; i++) {
      const idx = activeIndices[i]!;
      const base = idx * stride;

      const px = buf[base + OFFSET_POS_X]! * targetW;
      const py = buf[base + OFFSET_POS_Y]! * targetH;
      const radius = buf[base + OFFSET_SIZE]! || 2;

      ctx.moveTo(px + radius, py);
      ctx.arc(px, py, radius, 0, Math.PI * 2);
    }

    ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
    ctx.fill();
  }

  addForce(force: ForceField | ForceFieldConfig): ForceField {
    return this.fieldManager.addField(force);
  }

  removeForce(id: string): boolean {
    return this.fieldManager.removeField(id);
  }

  getForce(id: string): ForceField | undefined {
    return this.fieldManager.getField(id);
  }

  getForces(): readonly ForceField[] {
    return this.fieldManager.getFields();
  }

  updatePointer(
    id: number | string,
    x: number,
    y: number,
    active = true,
    primaryButton = false,
    z = 0,
  ): void {
    this.interaction.updatePointer(id, x, y, active, primaryButton, z);
  }

  removePointer(id: number | string): void {
    this.interaction.removePointer(id);
  }

  handleGesture(
    gesture: GestureType,
    x: number,
    y: number,
    details?: { scale?: number; rotation?: number; velocityX?: number; velocityY?: number },
  ): void {
    this.interaction.handleGesture(gesture, x, y, details);
  }

  getMetrics(): ParticleFieldMetrics {
    return this.fieldManager.getMetrics(this.pool.count);
  }
}

export function createInteractiveParticleSystem(
  config?: InteractiveParticleSystemConfig,
): InteractiveParticleSystem {
  return new InteractiveParticleSystem(config);
}

export function createParticleField(config?: ForceFieldConfig): ForceField {
  return createForceField(
    config ?? {
      type: "attraction",
      strength: 50,
      radius: 0.5,
    },
  );
}

export function addParticleForce(
  sys: InteractiveParticleSystem,
  force: ForceField | ForceFieldConfig,
): ForceField {
  return sys.addForce(force);
}

export function removeParticleForce(sys: InteractiveParticleSystem, id: string): boolean {
  return sys.removeForce(id);
}

export function updateParticleField(sys: InteractiveParticleSystem, deltaTime?: number): void {
  sys.update(deltaTime);
}

export function disposeParticleField(sys: InteractiveParticleSystem): void {
  sys.dispose();
}

export {
  createAttractionField,
  createForceField,
  createRepulsionField,
  createTurbulenceField,
  createVortexField,
};
