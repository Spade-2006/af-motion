/**
 * AF Motion Interactive Particle Fields & Forces — Spatial Broad-Phase Index
 *
 * Implements a uniform spatial hash grid for fast broad-phase force field culling,
 * minimizing evaluation cost when many localized force fields are active.
 */

import type { ForceField } from "./types.js";

export class SpatialFieldGrid {
  readonly cellSize: number;
  private readonly cells = new Map<string, ForceField[]>();
  private readonly globalFields: ForceField[] = [];

  constructor(cellSize = 0.25) {
    this.cellSize = Math.max(0.01, cellSize);
  }

  private hash(gx: number, gy: number, gz: number): string {
    return `${gx}:${gy}:${gz}`;
  }

  clear(): void {
    this.cells.clear();
    this.globalFields.length = 0;
  }

  insert(field: ForceField): void {
    if (!field.enabled) return;

    if (field.radius <= 0) {
      // Global force field influences everywhere
      this.globalFields.push(field);
      return;
    }

    const [px, py, pz] = field.position;
    const r = field.radius;

    const minGX = Math.floor((px - r) / this.cellSize);
    const maxGX = Math.floor((px + r) / this.cellSize);
    const minGY = Math.floor((py - r) / this.cellSize);
    const maxGY = Math.floor((py + r) / this.cellSize);
    const minGZ = Math.floor((pz - r) / this.cellSize);
    const maxGZ = Math.floor((pz + r) / this.cellSize);

    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gy = minGY; gy <= maxGY; gy++) {
        for (let gz = minGZ; gz <= maxGZ; gz++) {
          const key = this.hash(gx, gy, gz);
          let list = this.cells.get(key);
          if (!list) {
            list = [];
            this.cells.set(key, list);
          }
          list.push(field);
        }
      }
    }
  }

  rebuild(fields: readonly ForceField[]): void {
    this.clear();
    for (let i = 0; i < fields.length; i++) {
      this.insert(fields[i]!);
    }
  }

  query(px: number, py: number, pz: number): readonly ForceField[] {
    const gx = Math.floor(px / this.cellSize);
    const gy = Math.floor(py / this.cellSize);
    const gz = Math.floor(pz / this.cellSize);
    const key = this.hash(gx, gy, gz);

    const localList = this.cells.get(key);
    if (!localList || localList.length === 0) {
      return this.globalFields;
    }

    if (this.globalFields.length === 0) {
      return localList;
    }

    return [...this.globalFields, ...localList];
  }

  get cellCount(): number {
    return this.cells.size;
  }

  get globalCount(): number {
    return this.globalFields.length;
  }
}
