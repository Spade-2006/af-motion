/**
 * AF Motion Advanced Particle Engine — Memory Layout & Pool
 *
 * Implements a high-performance contiguous Float32Array particle storage pool
 * with an O(1) free-list recycling queue, zero garbage collection allocations,
 * and GPU buffer mapping compatibility.
 */

import type { ParticleAccessor, ParticleDataPool, ParticleSpawnData, ParticleVector4Tuple as Vector4Tuple } from "./types.js";

export const PARTICLE_STRIDE = 24;

export const OFFSET_POS_X = 0;
export const OFFSET_POS_Y = 1;
export const OFFSET_POS_Z = 2;
export const OFFSET_LIFE = 3;

export const OFFSET_VEL_X = 4;
export const OFFSET_VEL_Y = 5;
export const OFFSET_VEL_Z = 6;
export const OFFSET_MAX_LIFE = 7;

export const OFFSET_ACC_X = 8;
export const OFFSET_ACC_Y = 9;
export const OFFSET_ACC_Z = 10;
export const OFFSET_SIZE = 11;

export const OFFSET_ROTATION = 12;
export const OFFSET_ANGULAR_VEL = 13;
export const OFFSET_OPACITY = 14;
export const OFFSET_MASS = 15;

export const OFFSET_COLOR_R = 16;
export const OFFSET_COLOR_G = 17;
export const OFFSET_COLOR_B = 18;
export const OFFSET_COLOR_A = 19;

export const OFFSET_START_SIZE = 20;
export const OFFSET_END_SIZE = 21;
export const OFFSET_START_OPACITY = 22;
export const OFFSET_END_OPACITY = 23;

export class ParticlePoolImpl implements ParticleDataPool {
  readonly capacity: number;
  readonly stride = PARTICLE_STRIDE;
  readonly buffer: Float32Array;

  // Free-list stack for O(1) slot recycling
  private freeList: Int32Array;
  private freeHead: number;

  // Dense array of active particle indices
  private activeIndices: Int32Array;
  private activeCount: number = 0;

  // Index map: slot -> position in activeIndices (for O(1) removal)
  private slotToActivePos: Int32Array;

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
    this.buffer = new Float32Array(this.capacity * this.stride);

    this.freeList = new Int32Array(this.capacity);
    this.activeIndices = new Int32Array(this.capacity);
    this.slotToActivePos = new Int32Array(this.capacity);

    for (let i = 0; i < this.capacity; i++) {
      this.freeList[i] = i;
      this.slotToActivePos[i] = -1;
    }
    this.freeHead = this.capacity; // Points to top of stack
  }

  get count(): number {
    return this.activeCount;
  }

  spawn(data: ParticleSpawnData): number {
    if (this.freeHead <= 0) {
      // Pool full: recycling oldest or drop
      return -1;
    }

    const slot = this.freeList[--this.freeHead]!;
    const base = slot * this.stride;
    const buf = this.buffer;

    buf[base + OFFSET_POS_X] = data.x;
    buf[base + OFFSET_POS_Y] = data.y;
    buf[base + OFFSET_POS_Z] = data.z;
    buf[base + OFFSET_LIFE] = data.life;

    buf[base + OFFSET_VEL_X] = data.vx;
    buf[base + OFFSET_VEL_Y] = data.vy;
    buf[base + OFFSET_VEL_Z] = data.vz;
    buf[base + OFFSET_MAX_LIFE] = data.maxLife;

    buf[base + OFFSET_ACC_X] = data.ax;
    buf[base + OFFSET_ACC_Y] = data.ay;
    buf[base + OFFSET_ACC_Z] = data.az;
    buf[base + OFFSET_SIZE] = data.startSize;

    buf[base + OFFSET_ROTATION] = data.startRotation;
    buf[base + OFFSET_ANGULAR_VEL] = data.angularVelocity;
    buf[base + OFFSET_OPACITY] = data.startOpacity;
    buf[base + OFFSET_MASS] = data.mass;

    buf[base + OFFSET_COLOR_R] = data.startColor[0];
    buf[base + OFFSET_COLOR_G] = data.startColor[1];
    buf[base + OFFSET_COLOR_B] = data.startColor[2];
    buf[base + OFFSET_COLOR_A] = data.startColor[3];

    buf[base + OFFSET_START_SIZE] = data.startSize;
    buf[base + OFFSET_END_SIZE] = data.endSize;
    buf[base + OFFSET_START_OPACITY] = data.startOpacity;
    buf[base + OFFSET_END_OPACITY] = data.endOpacity;

    // Track active index
    const activePos = this.activeCount++;
    this.activeIndices[activePos] = slot;
    this.slotToActivePos[slot] = activePos;

    return slot;
  }

  kill(slot: number): void {
    const activePos = this.slotToActivePos[slot];
    if (activePos === undefined || activePos < 0) return; // Already inactive

    // Swap-with-last in activeIndices for O(1) removal
    const lastActivePos = --this.activeCount;
    const lastSlot = this.activeIndices[lastActivePos]!;

    this.activeIndices[activePos] = lastSlot;
    this.slotToActivePos[lastSlot] = activePos;
    this.slotToActivePos[slot] = -1;

    // Mark life zero in buffer
    this.buffer[slot * this.stride + OFFSET_LIFE] = 0;

    // Push slot back to free list
    this.freeList[this.freeHead++] = slot;
  }

  getAccessor(slot: number): ParticleAccessor {
    const base = slot * this.stride;
    const buf = this.buffer;

    return {
      get index(): number {
        return slot;
      },
      get x(): number {
        return buf[base + OFFSET_POS_X]!;
      },
      set x(v: number) {
        buf[base + OFFSET_POS_X] = v;
      },
      get y(): number {
        return buf[base + OFFSET_POS_Y]!;
      },
      set y(v: number) {
        buf[base + OFFSET_POS_Y] = v;
      },
      get z(): number {
        return buf[base + OFFSET_POS_Z]!;
      },
      set z(v: number) {
        buf[base + OFFSET_POS_Z] = v;
      },
      get vx(): number {
        return buf[base + OFFSET_VEL_X]!;
      },
      set vx(v: number) {
        buf[base + OFFSET_VEL_X] = v;
      },
      get vy(): number {
        return buf[base + OFFSET_VEL_Y]!;
      },
      set vy(v: number) {
        buf[base + OFFSET_VEL_Y] = v;
      },
      get vz(): number {
        return buf[base + OFFSET_VEL_Z]!;
      },
      set vz(v: number) {
        buf[base + OFFSET_VEL_Z] = v;
      },
      get ax(): number {
        return buf[base + OFFSET_ACC_X]!;
      },
      set ax(v: number) {
        buf[base + OFFSET_ACC_X] = v;
      },
      get ay(): number {
        return buf[base + OFFSET_ACC_Y]!;
      },
      set ay(v: number) {
        buf[base + OFFSET_ACC_Y] = v;
      },
      get az(): number {
        return buf[base + OFFSET_ACC_Z]!;
      },
      set az(v: number) {
        buf[base + OFFSET_ACC_Z] = v;
      },
      get life(): number {
        return buf[base + OFFSET_LIFE]!;
      },
      set life(v: number) {
        buf[base + OFFSET_LIFE] = v;
      },
      get maxLife(): number {
        return buf[base + OFFSET_MAX_LIFE]!;
      },
      set maxLife(v: number) {
        buf[base + OFFSET_MAX_LIFE] = v;
      },
      get size(): number {
        return buf[base + OFFSET_SIZE]!;
      },
      set size(v: number) {
        buf[base + OFFSET_SIZE] = v;
      },
      get rotation(): number {
        return buf[base + OFFSET_ROTATION]!;
      },
      set rotation(v: number) {
        buf[base + OFFSET_ROTATION] = v;
      },
      get angularVelocity(): number {
        return buf[base + OFFSET_ANGULAR_VEL]!;
      },
      set angularVelocity(v: number) {
        buf[base + OFFSET_ANGULAR_VEL] = v;
      },
      get opacity(): number {
        return buf[base + OFFSET_OPACITY]!;
      },
      set opacity(v: number) {
        buf[base + OFFSET_OPACITY] = v;
      },
      get mass(): number {
        return buf[base + OFFSET_MASS]!;
      },
      set mass(v: number) {
        buf[base + OFFSET_MASS] = v;
      },
      get color(): Vector4Tuple {
        return [
          buf[base + OFFSET_COLOR_R]!,
          buf[base + OFFSET_COLOR_G]!,
          buf[base + OFFSET_COLOR_B]!,
          buf[base + OFFSET_COLOR_A]!,
        ];
      },
      set color(c: Vector4Tuple) {
        buf[base + OFFSET_COLOR_R] = c[0];
        buf[base + OFFSET_COLOR_G] = c[1];
        buf[base + OFFSET_COLOR_B] = c[2];
        buf[base + OFFSET_COLOR_A] = c[3];
      },
    };
  }

  getActiveIndices(): Int32Array {
    return this.activeIndices.subarray(0, this.activeCount);
  }

  clear(): void {
    this.activeCount = 0;
    this.freeHead = this.capacity;
    for (let i = 0; i < this.capacity; i++) {
      this.freeList[i] = i;
      this.slotToActivePos[i] = -1;
    }
    this.buffer.fill(0);
  }
}

export function createParticleDataPool(capacity: number): ParticleDataPool {
  return new ParticlePoolImpl(capacity);
}
