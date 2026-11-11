/**
 * AF Motion GPU Simulation Architecture — Compute Resource Manager
 *
 * Provides lifecycle tracking, memory accounting, double-disposal protection,
 * limit validation, and context-loss recovery for GPU and CPU compute resources.
 */

import type {
  ComputeMemoryUsage,
  ComputeResourceManager,
  ComputeResourceManagerOptions,
  ComputeResourceType,
} from "./types.js";

interface ResourceEntry {
  readonly id: string;
  readonly type: ComputeResourceType;
  readonly resource: { dispose(): void; id?: string };
  readonly byteSize: number;
  readonly label?: string;
  refCount: number;
  isDisposed: boolean;
  readonly createdAt: number;
}

export function createComputeResourceManager(
  options: ComputeResourceManagerOptions = {},
): ComputeResourceManager {
  const {
    maxMemoryBytes = 256 * 1024 * 1024, // 256 MB default ceiling
    maxTextureCount = 512,
    maxBufferCount = 1024,
  } = options;

  const entries = new Map<string, ResourceEntry>();
  let sequence = 0;
  let totalAllocatedBytes = 0;
  let bufferBytes = 0;
  let textureBytes = 0;

  function recalculateMetrics(): ComputeMemoryUsage {
    let bufBytes = 0;
    let texBytes = 0;
    let totalBytes = 0;
    let bufCount = 0;
    let texCount = 0;
    let pipeCount = 0;
    let activeCount = 0;

    for (const entry of entries.values()) {
      if (entry.isDisposed) continue;
      activeCount++;
      totalBytes += entry.byteSize;
      if (entry.type === "buffer") {
        bufBytes += entry.byteSize;
        bufCount++;
      } else if (entry.type === "texture") {
        texBytes += entry.byteSize;
        texCount++;
      } else if (entry.type === "pipeline") {
        pipeCount++;
      }
    }

    totalAllocatedBytes = totalBytes;
    bufferBytes = bufBytes;
    textureBytes = texBytes;

    return {
      totalBytes,
      bufferBytes: bufBytes,
      textureBytes: texBytes,
      resourceCount: activeCount,
      bufferCount: bufCount,
      textureCount: texCount,
      pipelineCount: pipeCount,
    };
  }

  const manager: ComputeResourceManager = {
    get size(): number {
      let active = 0;
      for (const entry of entries.values()) {
        if (!entry.isDisposed) active++;
      }
      return active;
    },

    get totalAllocatedBytes(): number {
      return totalAllocatedBytes;
    },

    get memoryUsage(): ComputeMemoryUsage {
      return recalculateMetrics();
    },

    register(
      type: ComputeResourceType,
      resource: { dispose(): void; id?: string },
      byteSize = 0,
      label?: string,
    ): string {
      if (!resource || typeof resource.dispose !== "function") {
        throw new TypeError("Cannot register invalid compute resource: missing dispose() method");
      }

      const id = resource.id || `res_${type}_${++sequence}_${Date.now()}`;

      // Idempotency check: if already registered, just return existing ID
      const existing = entries.get(id);
      if (existing && !existing.isDisposed) {
        existing.refCount++;
        return id;
      }

      // Check allocation limits
      if (totalAllocatedBytes + byteSize > maxMemoryBytes) {
        console.warn(
          `[AF Motion Compute] Memory budget exceeded (${totalAllocatedBytes + byteSize} > ${maxMemoryBytes} bytes). Proceeding with soft cap.`,
        );
      }

      const entry: ResourceEntry = {
        id,
        type,
        resource,
        byteSize: Math.max(0, byteSize),
        label,
        refCount: 1,
        isDisposed: false,
        createdAt: Date.now(),
      };

      entries.set(id, entry);
      recalculateMetrics();
      return id;
    },

    get<T = unknown>(resourceId: string): T | undefined {
      const entry = entries.get(resourceId);
      return entry && !entry.isDisposed ? (entry.resource as unknown as T) : undefined;
    },

    has(resourceId: string): boolean {
      const entry = entries.get(resourceId);
      return Boolean(entry && !entry.isDisposed);
    },

    dispose(resourceId: string): boolean {
      const entry = entries.get(resourceId);
      if (!entry || entry.isDisposed) return false;

      entry.refCount--;
      if (entry.refCount > 0) {
        return false; // Still retained
      }

      entry.isDisposed = true;
      entries.delete(resourceId);

      try {
        entry.resource.dispose();
      } catch (err) {
        console.warn(`[AF Motion Compute] Error disposing resource "${resourceId}":`, err);
      }

      recalculateMetrics();
      return true;
    },

    disposeAll(): void {
      const all = Array.from(entries.values()).filter((e) => !e.isDisposed);
      // Reverse cleanup order
      all.reverse();

      for (const entry of all) {
        entry.isDisposed = true;
        try {
          entry.resource.dispose();
        } catch (err) {
          console.warn(`[AF Motion Compute] Error disposing resource "${entry.id}":`, err);
        }
      }

      entries.clear();
      recalculateMetrics();
    },

    checkLimits(): boolean {
      const usage = recalculateMetrics();
      if (usage.totalBytes > maxMemoryBytes) return false;
      if (usage.textureCount > maxTextureCount) return false;
      if (usage.bufferCount > maxBufferCount) return false;
      return true;
    },

    handleContextLost(): void {
      // Mark GPU resources invalid without crashing
      for (const entry of entries.values()) {
        if (entry.type === "buffer" || entry.type === "texture" || entry.type === "framebuffer" || entry.type === "pipeline") {
          entry.isDisposed = true;
        }
      }
      entries.clear();
      recalculateMetrics();
    },

    handleContextRestored(): void {
      // Device restoration signal hook
      recalculateMetrics();
    },
  };

  return manager;
}
