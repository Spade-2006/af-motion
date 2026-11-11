/**
 * AF Motion GPU Simulation Architecture — Backend Interface & Helpers
 */

import type {
  ComputeBackend,
  ComputeBackendType,
  ComputeCapabilities,
  ComputeTextureFormat,
} from "../types.js";

export function getBytesPerPixel(format: ComputeTextureFormat): number {
  switch (format) {
    case "rgba32float":
      return 16;
    case "rgba16float":
    case "rg32float":
      return 8;
    case "r32float":
    case "rgba8unorm":
      return 4;
    default:
      return 4;
  }
}

export abstract class BaseComputeBackend implements ComputeBackend {
  abstract readonly type: ComputeBackendType;
  abstract readonly capabilities: ComputeCapabilities;
  protected lost = false;
  protected readonly lostListeners = new Set<(reason: string) => void>();
  protected readonly restoredListeners = new Set<() => void>();

  get isLost(): boolean {
    return this.lost;
  }

  onDeviceLost(listener: (reason: string) => void): () => void {
    this.lostListeners.add(listener);
    return () => this.lostListeners.delete(listener);
  }

  onDeviceRestored(listener: () => void): () => void {
    this.restoredListeners.add(listener);
    return () => this.restoredListeners.delete(listener);
  }

  protected notifyLost(reason: string): void {
    this.lost = true;
    for (const listener of this.lostListeners) {
      try {
        listener(reason);
      } catch (err) {
        console.warn("[AF Motion Compute] Lost listener error:", err);
      }
    }
  }

  protected notifyRestored(): void {
    this.lost = false;
    for (const listener of this.restoredListeners) {
      try {
        listener();
      } catch (err) {
        console.warn("[AF Motion Compute] Restored listener error:", err);
      }
    }
  }

  abstract init(): Promise<void> | void;
  abstract createBuffer(...args: any[]): any;
  abstract createTexture(...args: any[]): any;
  abstract createPipeline(...args: any[]): any;
  abstract createBindGroup(...args: any[]): any;
  abstract dispatch(...args: any[]): void;
  abstract dispose(): void;
}
