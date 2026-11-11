/**
 * AF Motion — Resource Pooling Intelligence
 *
 * Integrates directly with sharedBufferPool and TypedArrayPool to provide
 * use-after-release protection, detached buffer safety, and pool memory statistics.
 */

import { sharedBufferPool, TypedArrayPool } from "../../graphics/simulation/optimizer.js";
import type { IResourceRegistry } from "./types.js";

export interface PoolStats {
  activeAcquiredCount: number;
  totalAcquiredBytes: number;
  doubleReleaseAttempts: number;
  detachedBuffersDetected: number;
}

export class SafeBufferPoolManager {
  private readonly _pool: TypedArrayPool;
  private readonly _registry?: IResourceRegistry;
  private readonly _activeFloatBuffers = new WeakSet<Float32Array>();
  private readonly _activeUintBuffers = new WeakSet<Uint32Array>();

  private _acquiredCount = 0;
  private _acquiredBytes = 0;
  private _doubleReleaseAttempts = 0;
  private _detachedDetected = 0;

  constructor(pool: TypedArrayPool = sharedBufferPool, registry?: IResourceRegistry) {
    this._pool = pool;
    this._registry = registry;
  }

  public acquireFloat32(length: number): Float32Array {
    const arr = this._pool.acquireFloat32(length);
    this._activeFloatBuffers.add(arr);
    this._acquiredCount++;
    this._acquiredBytes += arr.byteLength;

    if (this._registry) {
      this._registry.registerResource({
        category: "typed_array",
        ownerId: "buffer_pool",
        resource: arr,
        estimatedBytes: arr.byteLength,
        disposalStrategy: "pooled",
      });
    }

    return arr;
  }

  public releaseFloat32(arr: Float32Array): boolean {
    // 1. Guard against detached transferable buffer
    if (arr.buffer.byteLength === 0) {
      this._detachedDetected++;
      return false;
    }

    // 2. Guard against double release
    if (!this._activeFloatBuffers.has(arr)) {
      this._doubleReleaseAttempts++;
      return false;
    }

    this._activeFloatBuffers.delete(arr);
    this._acquiredCount = Math.max(0, this._acquiredCount - 1);
    this._acquiredBytes = Math.max(0, this._acquiredBytes - arr.byteLength);

    this._pool.releaseFloat32(arr);
    return true;
  }

  public acquireUint32(length: number): Uint32Array {
    const arr = this._pool.acquireUint32(length);
    this._activeUintBuffers.add(arr);
    this._acquiredCount++;
    this._acquiredBytes += arr.byteLength;
    return arr;
  }

  public releaseUint32(arr: Uint32Array): boolean {
    if (arr.buffer.byteLength === 0) {
      this._detachedDetected++;
      return false;
    }

    if (!this._activeUintBuffers.has(arr)) {
      this._doubleReleaseAttempts++;
      return false;
    }

    this._activeUintBuffers.delete(arr);
    this._acquiredCount = Math.max(0, this._acquiredCount - 1);
    this._acquiredBytes = Math.max(0, this._acquiredBytes - arr.byteLength);

    this._pool.releaseUint32(arr);
    return true;
  }

  public getStats(): PoolStats {
    return {
      activeAcquiredCount: this._acquiredCount,
      totalAcquiredBytes: this._acquiredBytes,
      doubleReleaseAttempts: this._doubleReleaseAttempts,
      detachedBuffersDetected: this._detachedDetected,
    };
  }

  public clear(): void {
    this._pool.clear();
    this._acquiredCount = 0;
    this._acquiredBytes = 0;
  }
}

export const safeBufferPoolManager = new SafeBufferPoolManager();
