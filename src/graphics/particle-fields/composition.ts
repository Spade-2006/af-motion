/**
 * AF Motion Interactive Particle Fields & Forces — Field Composition
 *
 * Implements priority-based and additive force composition, maximum acceleration
 * clamping, spatial acceleration integration, and Prompt 118 behavior adaptation.
 */

import {
  OFFSET_ACC_X,
  OFFSET_ACC_Y,
  OFFSET_ACC_Z,
  OFFSET_MASS,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
  OFFSET_VEL_X,
  OFFSET_VEL_Y,
  OFFSET_VEL_Z,
} from "../particles/data-layout.js";
import type { CustomBehavior, ParticleAccessor, ParticleDataPool } from "../particles/types.js";
import { createForceField } from "./forces.js";
import { SpatialFieldGrid } from "./spatial-index.js";
import type {
  ForceField,
  ForceFieldConfig,
  ForceFieldManagerConfig,
  ForceVector3Tuple,
  ParticleFieldMetrics,
} from "./types.js";

export class ForceFieldManager {
  private readonly fields: ForceField[] = [];
  private readonly spatialGrid: SpatialFieldGrid;
  private readonly spatialEnabled: boolean;
  private readonly maxAcceleration: number;

  private totalForcesEvaluated = 0;
  private lastEvaluationTimeMs = 0;

  constructor(config: ForceFieldManagerConfig = {}) {
    this.maxAcceleration = Math.max(1, config.maxAcceleration ?? 2500);
    this.spatialEnabled = config.spatialPartitioning ?? true;
    this.spatialGrid = new SpatialFieldGrid(config.spatialCellSize ?? 0.3);
  }

  addField(field: ForceField | ForceFieldConfig): ForceField {
    const instance = "evaluate" in field && "type" in field ? (field as ForceField) : createForceField(field);
    this.fields.push(instance);
    this.sortFields();
    this.rebuildSpatial();
    return instance;
  }

  removeField(id: string): boolean {
    const idx = this.fields.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.fields.splice(idx, 1);
      this.rebuildSpatial();
      return true;
    }
    return false;
  }

  getField(id: string): ForceField | undefined {
    return this.fields.find((f) => f.id === id);
  }

  getFields(): readonly ForceField[] {
    return this.fields;
  }

  clear(): void {
    this.fields.length = 0;
    this.spatialGrid.clear();
  }

  private sortFields(): void {
    // Highest priority first
    this.fields.sort((a, b) => b.priority - a.priority);
  }

  rebuildSpatial(): void {
    if (this.spatialEnabled) {
      this.spatialGrid.rebuild(this.fields);
    }
  }

  evaluateCombinedForce(
    px: number,
    py: number,
    pz: number,
    vx: number,
    vy: number,
    vz: number,
    mass = 1,
    time = 0,
  ): ForceVector3Tuple {
    const candidates = this.spatialEnabled
      ? this.spatialGrid.query(px, py, pz)
      : this.fields;

    if (candidates.length === 0) return [0, 0, 0];

    let totalFx = 0;
    let totalFy = 0;
    let totalFz = 0;

    for (let i = 0; i < candidates.length; i++) {
      const field = candidates[i]!;
      if (!field.enabled || field.weight === 0) continue;

      const [fx, fy, fz] = field.evaluate(px, py, pz, vx, vy, vz, mass, time);
      totalFx += fx;
      totalFy += fy;
      totalFz += fz;
      this.totalForcesEvaluated++;
    }

    // Acceleration clamping: ||a|| <= maxAcceleration
    const effectiveMass = Math.max(0.0001, mass);
    let ax = totalFx / effectiveMass;
    let ay = totalFy / effectiveMass;
    let az = totalFz / effectiveMass;
    const aMag = Math.hypot(ax, ay, az);

    if (aMag > this.maxAcceleration && aMag > 0) {
      const clampScale = this.maxAcceleration / aMag;
      ax *= clampScale;
      ay *= clampScale;
      az *= clampScale;
      return [ax * effectiveMass, ay * effectiveMass, az * effectiveMass];
    }

    return [totalFx, totalFy, totalFz];
  }

  applyToPool(pool: ParticleDataPool, dt: number, time = 0): void {
    if (this.fields.length === 0 || dt <= 0) return;

    const startPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    const activeIndices = pool.getActiveIndices();
    const count = activeIndices.length;
    if (count === 0) return;

    const buf = pool.buffer;
    const stride = pool.stride;

    // Advance time on fields if supported
    for (let f = 0; f < this.fields.length; f++) {
      this.fields[f]!.update?.(dt, time);
    }

    // Rebuild spatial grid if dynamic movement occurred
    if (this.spatialEnabled) {
      this.spatialGrid.rebuild(this.fields);
    }

    for (let i = 0; i < count; i++) {
      const base = activeIndices[i]! * stride;

      const px = buf[base + OFFSET_POS_X]!;
      const py = buf[base + OFFSET_POS_Y]!;
      const pz = buf[base + OFFSET_POS_Z]!;

      const vx = buf[base + OFFSET_VEL_X]!;
      const vy = buf[base + OFFSET_VEL_Y]!;
      const vz = buf[base + OFFSET_VEL_Z]!;

      const mass = buf[base + OFFSET_MASS]! || 1;

      const [fx, fy, fz] = this.evaluateCombinedForce(px, py, pz, vx, vy, vz, mass, time);

      // Inject force into particle acceleration
      buf[base + OFFSET_ACC_X]! += fx / mass;
      buf[base + OFFSET_ACC_Y]! += fy / mass;
      buf[base + OFFSET_ACC_Z]! += fz / mass;
    }

    const endPerf = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lastEvaluationTimeMs = endPerf - startPerf;
  }

  /**
   * Adapts this ForceFieldManager into a Prompt 118 ParticleBehavior.
   */
  toParticleBehavior(): CustomBehavior {
    return {
      id: "force-field-behavior",
      type: "custom",
      execute: (p: ParticleAccessor, dt: number) => {
        const [fx, fy, fz] = this.evaluateCombinedForce(
          p.x,
          p.y,
          p.z,
          p.vx,
          p.vy,
          p.vz,
          p.mass,
          0,
        );
        p.ax += fx / (p.mass || 1);
        p.ay += fy / (p.mass || 1);
        p.az += fz / (p.mass || 1);
      },
    };
  }

  getMetrics(particleCount = 0): ParticleFieldMetrics {
    return {
      activeFields: this.fields.filter((f) => f.enabled).length,
      particleCount,
      forcesEvaluated: this.totalForcesEvaluated,
      evaluationTimeMs: this.lastEvaluationTimeMs,
      memoryBytes: this.fields.length * 128 + this.spatialGrid.cellCount * 64,
      spatialIndexEnabled: this.spatialEnabled,
    };
  }
}

export function createForceFieldManager(config?: ForceFieldManagerConfig): ForceFieldManager {
  return new ForceFieldManager(config);
}
