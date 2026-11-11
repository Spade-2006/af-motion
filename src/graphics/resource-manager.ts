import type { DisposableResource, ResourceManager } from "./types.js";

interface ResourceEntry {
  readonly id: string;
  readonly resource: DisposableResource;
  ownerId?: string;
  disposed: boolean;
  readonly order: number;
}

/**
 * Creates a deterministic, idempotent Resource Manager for tracking
 * graphics assets (buffers, textures, shaders, framebuffers, timers, event unbinds).
 */
export function createResourceManager(): ResourceManager {
  const entries = new Map<string, ResourceEntry>();
  let sequence = 0;

  return {
    get size(): number {
      let count = 0;
      for (const entry of entries.values()) {
        if (!entry.disposed) count++;
      }
      return count;
    },

    register(resource: DisposableResource, ownerId?: string): string {
      if (!resource || typeof resource.dispose !== "function") {
        throw new TypeError("Cannot register invalid DisposableResource: missing dispose() method");
      }

      const id = resource.id || `res_${++sequence}_${Date.now()}`;
      const entry: ResourceEntry = {
        id,
        resource,
        ownerId,
        disposed: false,
        order: sequence++,
      };

      entries.set(id, entry);
      return id;
    },

    get(resourceId: string): DisposableResource | undefined {
      const entry = entries.get(resourceId);
      return entry && !entry.disposed ? entry.resource : undefined;
    },

    has(resourceId: string): boolean {
      const entry = entries.get(resourceId);
      return !!entry && !entry.disposed;
    },

    dispose(resourceId: string): boolean {
      const entry = entries.get(resourceId);
      if (!entry || entry.disposed) return false;

      entry.disposed = true;
      entries.delete(resourceId);

      try {
        entry.resource.dispose();
      } catch (err) {
        // Idempotent: log or ignore cleanup error during emergency disposal
        console.warn(`[AF Motion Graphics] Error disposing resource "${resourceId}":`, err);
      }
      return true;
    },

    disposeOwnedBy(ownerId: string): number {
      if (!ownerId) return 0;

      // Find all active entries owned by ownerId
      const matches: ResourceEntry[] = [];
      for (const entry of entries.values()) {
        if (!entry.disposed && entry.ownerId === ownerId) {
          matches.push(entry);
        }
      }

      // Dispose in deterministic reverse registration order
      matches.sort((a, b) => b.order - a.order);

      let count = 0;
      for (const entry of matches) {
        if (this.dispose(entry.id)) {
          count++;
        }
      }

      return count;
    },

    disposeAll(): void {
      // Collect all active entries and sort in reverse registration order
      const all: ResourceEntry[] = [];
      for (const entry of entries.values()) {
        if (!entry.disposed) {
          all.push(entry);
        }
      }

      all.sort((a, b) => b.order - a.order);

      for (const entry of all) {
        this.dispose(entry.id);
      }

      entries.clear();
    },

    trackOwner(resourceId: string, ownerId: string): void {
      const entry = entries.get(resourceId);
      if (entry && !entry.disposed) {
        entry.ownerId = ownerId;
      }
    },

    release(resourceId: string): boolean {
      const entry = entries.get(resourceId);
      if (!entry || entry.disposed) return false;

      entries.delete(resourceId);
      return true;
    },

    getResourcesOwnedBy(ownerId: string): readonly DisposableResource[] {
      const result: DisposableResource[] = [];
      for (const entry of entries.values()) {
        if (!entry.disposed && entry.ownerId === ownerId) {
          result.push(entry.resource);
        }
      }
      return Object.freeze(result);
    },
  };
}
