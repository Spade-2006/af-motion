/**
 * AF Motion — Memory Pressure Controller
 *
 * Evaluates multi-level memory pressure (normal, elevated, high, critical)
 * and triggers coordinated cache trimming, pool reclamation, and quality adjustments.
 */

import type {
  IMemoryPressureController,
  MemoryPressureLevel,
  MemorySnapshot,
  IResourceCache,
} from "./types.js";
import type { IAdaptiveQualityController } from "../adaptive-quality/types.js";
import { safeBufferPoolManager } from "./pooling.js";

export interface MemoryPressureControllerOptions {
  cache?: IResourceCache;
  adaptiveQualityController?: IAdaptiveQualityController;
}

export class MemoryPressureController implements IMemoryPressureController {
  private _currentPressure: MemoryPressureLevel = "normal";
  private readonly _listeners = new Set<(level: MemoryPressureLevel) => void>();
  private readonly _cache?: IResourceCache;
  private readonly _adaptiveQualityController?: IAdaptiveQualityController;
  private _isDisposed = false;

  constructor(options: MemoryPressureControllerOptions = {}) {
    this._cache = options.cache;
    this._adaptiveQualityController = options.adaptiveQualityController;
  }

  public get currentPressure(): MemoryPressureLevel {
    return this._currentPressure;
  }

  public evaluatePressure(snapshot?: MemorySnapshot): MemoryPressureLevel {
    if (!snapshot) return this._currentPressure;

    const level = snapshot.memoryPressureLevel;
    if (level !== this._currentPressure) {
      this.setPressure(level);
    }
    return this._currentPressure;
  }

  public setPressure(level: MemoryPressureLevel): void {
    if (this._isDisposed || level === this._currentPressure) return;
    this._currentPressure = level;

    // Trigger automated pressure response
    this.respondToPressure(level);

    // Notify listeners
    for (const listener of this._listeners) {
      try {
        listener(level);
      } catch (err) {
        console.error("Error in MemoryPressureController listener:", err);
      }
    }
  }

  public onPressureChange(listener: (level: MemoryPressureLevel) => void): { unsubscribe: () => void } {
    this._listeners.add(listener);
    return {
      unsubscribe: () => {
        this._listeners.delete(listener);
      },
    };
  }

  public respondToPressure(level: MemoryPressureLevel = this._currentPressure): {
    cacheEntriesEvicted: number;
    bytesReclaimed: number;
  } {
    let evicted = 0;
    let bytes = 0;

    if (level === "elevated") {
      // Trim expired or oldest cache items
      if (this._cache) {
        evicted += this._cache.trimToMemoryLimit();
      }
    } else if (level === "high") {
      // Aggressive cache trimming + buffer pool release
      if (this._cache) {
        const stats = this._cache.getStats();
        evicted += this._cache.trimToMemoryLimit(Math.round(stats.maxBytes * 0.5));
      }
      safeBufferPoolManager.clear();
    } else if (level === "critical") {
      // Maximum cache clearance + notify quality controller to step down preset
      if (this._cache) {
        const stats = this._cache.getStats();
        evicted += this._cache.trimToMemoryLimit(Math.round(stats.maxBytes * 0.2));
      }
      safeBufferPoolManager.clear();

      if (this._adaptiveQualityController) {
        this._adaptiveQualityController.setQualityPreset("battery-saver");
      }
    }

    return {
      cacheEntriesEvicted: evicted,
      bytesReclaimed: bytes,
    };
  }

  public dispose(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    this._listeners.clear();
  }
}

export function createMemoryPressureController(
  options: MemoryPressureControllerOptions = {}
): MemoryPressureController {
  return new MemoryPressureController(options);
}
