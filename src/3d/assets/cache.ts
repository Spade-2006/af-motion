/**
 * AF Motion 3D Asset Cache
 *
 * In-flight request deduplication, LRU cache eviction, reference counting,
 * and memory-conscious disposal for 3D assets.
 */

import type { Asset3DEntry, AssetCacheConfig } from "./types.js";
import { deepDisposeModel } from "./inspection.js";

export class AssetCache3D {
  private readonly entries = new Map<string, Asset3DEntry<any>>();
  private readonly inFlight = new Map<string, Promise<Asset3DEntry<any>>>();
  private readonly maxEntries: number;
  private readonly disposeOnEvict: boolean;
  private readonly ttlMs: number;

  constructor(config?: AssetCacheConfig) {
    this.maxEntries = config?.maxEntries ?? 50;
    this.disposeOnEvict = config?.disposeOnEvict ?? true;
    this.ttlMs = config?.ttlMs ?? 0;
  }

  /**
   * Checks if an asset exists in cache and is loaded.
   */
  public has(idOrUrl: string): boolean {
    const entry = this.get(idOrUrl);
    return Boolean(entry && entry.status === "loaded");
  }

  /**
   * Retrieves an asset from cache if present and not expired.
   */
  public get<T = unknown>(idOrUrl: string): Asset3DEntry<T> | undefined {
    // Search by ID first, then by URL
    let entry = this.entries.get(idOrUrl);
    if (!entry) {
      for (const val of this.entries.values()) {
        if (val.url === idOrUrl) {
          entry = val;
          break;
        }
      }
    }

    if (!entry) return undefined;

    // Check TTL expiration
    if (this.ttlMs > 0 && entry.loadedAt && Date.now() - entry.loadedAt > this.ttlMs) {
      this.evict(entry.id);
      return undefined;
    }

    // Update last accessed time for LRU
    const updated: Asset3DEntry<T> = {
      ...entry,
      lastAccessedAt: Date.now(),
    };
    this.entries.set(entry.id, updated);
    return updated;
  }

  /**
   * Checks for an active in-flight loading promise to prevent duplicate network calls.
   */
  public getInFlight<T = unknown>(idOrUrl: string): Promise<Asset3DEntry<T>> | undefined {
    return this.inFlight.get(idOrUrl) as Promise<Asset3DEntry<T>> | undefined;
  }

  /**
   * Registers an in-flight loading promise for deduplication.
   */
  public setInFlight<T = unknown>(idOrUrl: string, promise: Promise<Asset3DEntry<T>>): void {
    this.inFlight.set(idOrUrl, promise);
  }

  /**
   * Clears an in-flight loading promise once complete.
   */
  public clearInFlight(idOrUrl: string): void {
    this.inFlight.delete(idOrUrl);
  }

  /**
   * Stores a loaded or errored entry into the cache and evicts old entries if necessary.
   */
  public set<T = unknown>(id: string, entry: Asset3DEntry<T>): void {
    if (this.entries.size >= this.maxEntries && !this.entries.has(id)) {
      this.evictOldest();
    }
    this.entries.set(id, entry);
  }

  /**
   * Increments the reference count of an asset.
   */
  public retain(idOrUrl: string): number {
    const entry = this.get(idOrUrl);
    if (!entry) return 0;

    const updated: Asset3DEntry = {
      ...entry,
      refCount: entry.refCount + 1,
      lastAccessedAt: Date.now(),
    };
    this.entries.set(entry.id, updated);
    return updated.refCount;
  }

  /**
   * Decrements reference count and disposes if 0 and not cached.
   */
  public release(idOrUrl: string): number {
    const entry = this.get(idOrUrl);
    if (!entry) return 0;

    const newCount = Math.max(0, entry.refCount - 1);
    const updated: Asset3DEntry = {
      ...entry,
      refCount: newCount,
      lastAccessedAt: Date.now(),
    };
    this.entries.set(entry.id, updated);
    return newCount;
  }

  /**
   * Removes and optionally disposes an asset from the cache.
   */
  public evict(idOrUrl: string): boolean {
    const entry = this.entries.get(idOrUrl);
    if (!entry) return false;

    if (this.disposeOnEvict && entry.data) {
      deepDisposeModel(entry.data);
    }

    this.entries.delete(idOrUrl);
    return true;
  }

  /**
   * Evicts the least recently used entry that is not actively referenced.
   */
  private evictOldest(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    // Prefer evicting unreferenced entries
    for (const [id, entry] of this.entries.entries()) {
      if (entry.refCount === 0 && entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestId = id;
      }
    }

    // Fall back to any oldest entry if all are retained
    if (!oldestId) {
      for (const [id, entry] of this.entries.entries()) {
        if (entry.lastAccessedAt < oldestTime) {
          oldestTime = entry.lastAccessedAt;
          oldestId = id;
        }
      }
    }

    if (oldestId) {
      this.evict(oldestId);
    }
  }

  /**
   * Clears the entire cache and disposes loaded assets.
   */
  public clear(): void {
    for (const entry of this.entries.values()) {
      if (this.disposeOnEvict && entry.data) {
        deepDisposeModel(entry.data);
      }
    }
    this.entries.clear();
    this.inFlight.clear();
  }

  /**
   * Returns cache stats.
   */
  public getStats(): {
    size: number;
    inFlightCount: number;
    maxEntries: number;
  } {
    return {
      size: this.entries.size,
      inFlightCount: this.inFlight.size,
      maxEntries: this.maxEntries,
    };
  }

  /**
   * Returns all entries currently in cache.
   */
  public getAllEntries(): readonly Asset3DEntry[] {
    return Array.from(this.entries.values());
  }
}
