/**
 * AF Motion — Intelligent Resource Cache
 *
 * Implements deterministic LRU eviction, TTL expiration, memory budget clamping,
 * resource pinning protection, and hit/miss observability.
 */

import type {
  IResourceCache,
  ResourceCacheStats,
  IResourceRegistry,
} from "./types.js";

interface CacheEntry<V> {
  readonly key: string;
  readonly value: V;
  readonly estimatedBytes: number;
  readonly createdAt: number;
  readonly expiresAt?: number;
  lastAccessedAt: number;
  accessSequence: number;
  isPinned: boolean;
  registryId?: string;
}

export interface ResourceCacheOptions {
  maxEntries?: number;
  maxBytes?: number;
  defaultTtlMs?: number;
  registry?: IResourceRegistry;
  ownerId?: string;
}

export class ResourceCache<K = string, V = any> implements IResourceCache<K, V> {
  private readonly _entries = new Map<string, CacheEntry<V>>();
  private readonly _maxEntries: number;
  private readonly _maxBytes: number;
  private readonly _defaultTtlMs?: number;
  private readonly _registry?: IResourceRegistry;
  private readonly _ownerId: string;

  private _accessSequence = 0;
  private _hits = 0;
  private _misses = 0;
  private _evictions = 0;
  private _totalBytes = 0;
  private _isDisposed = false;

  constructor(options: ResourceCacheOptions = {}) {
    this._maxEntries = Math.max(1, options.maxEntries ?? 500);
    this._maxBytes = Math.max(1024, options.maxBytes ?? 64 * 1024 * 1024); // 64 MB default
    this._defaultTtlMs = options.defaultTtlMs;
    this._registry = options.registry;
    this._ownerId = options.ownerId ?? "resource_cache";
  }

  public get size(): number {
    return this._entries.size;
  }

  public get(key: K): V | undefined {
    if (this._isDisposed) return undefined;
    const strKey = String(key);
    const entry = this._entries.get(strKey);

    if (!entry) {
      this._misses++;
      return undefined;
    }

    // Check TTL expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.invalidate(key);
      this._misses++;
      return undefined;
    }

    this._hits++;
    entry.lastAccessedAt = Date.now();
    entry.accessSequence = ++this._accessSequence;
    return entry.value;
  }

  public set(key: K, value: V, estimatedBytes = 1024, ttlMs?: number): void {
    if (this._isDisposed) return;
    const strKey = String(key);

    // Evict old entry if exists
    if (this._entries.has(strKey)) {
      this.invalidate(key);
    }

    const effectiveTtl = ttlMs ?? this._defaultTtlMs;
    const expiresAt = effectiveTtl ? Date.now() + effectiveTtl : undefined;

    let registryId: string | undefined = undefined;
    if (this._registry) {
      registryId = this._registry.registerResource({
        category: "cached_asset",
        ownerId: this._ownerId,
        resource: value,
        estimatedBytes,
        isPinned: false,
        metadata: { cacheKey: strKey },
      });
    }

    const entry: CacheEntry<V> = {
      key: strKey,
      value,
      estimatedBytes,
      createdAt: Date.now(),
      expiresAt,
      lastAccessedAt: Date.now(),
      accessSequence: ++this._accessSequence,
      isPinned: false,
      registryId,
    };

    this._entries.set(strKey, entry);
    this._totalBytes += estimatedBytes;

    // Enforce capacity limits via LRU eviction
    this.enforceCapacityLimits();
  }

  public has(key: K): boolean {
    const strKey = String(key);
    const entry = this._entries.get(strKey);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.invalidate(key);
      return false;
    }
    return true;
  }

  public pin(key: K): boolean {
    const entry = this._entries.get(String(key));
    if (!entry) return false;
    entry.isPinned = true;
    return true;
  }

  public unpin(key: K): boolean {
    const entry = this._entries.get(String(key));
    if (!entry) return false;
    entry.isPinned = false;
    return true;
  }

  public isPinned(key: K): boolean {
    const entry = this._entries.get(String(key));
    return entry?.isPinned ?? false;
  }

  public invalidate(key: K): boolean {
    const strKey = String(key);
    const entry = this._entries.get(strKey);
    if (!entry) return false;

    if (entry.registryId && this._registry) {
      this._registry.unregisterResource(entry.registryId, true);
    }

    this._totalBytes = Math.max(0, this._totalBytes - entry.estimatedBytes);
    this._entries.delete(strKey);
    return true;
  }

  public trimToMemoryLimit(targetBytes?: number): number {
    const target = targetBytes ?? this._maxBytes;
    let evictedCount = 0;

    if (this._totalBytes <= target) return 0;

    // Sort unpinned entries by accessSequence ascending (least recently accessed first)
    const unpinned: CacheEntry<V>[] = [];
    for (const entry of this._entries.values()) {
      if (!entry.isPinned) {
        unpinned.push(entry);
      }
    }
    unpinned.sort((a, b) => a.accessSequence - b.accessSequence);

    for (const entry of unpinned) {
      if (this._totalBytes <= target) break;
      this.invalidate(entry.key as unknown as K);
      this._evictions++;
      evictedCount++;
    }

    return evictedCount;
  }

  public clear(): void {
    const keys = Array.from(this._entries.keys());
    for (const k of keys) {
      this.invalidate(k as unknown as K);
    }
    this._totalBytes = 0;
  }

  public getStats(): ResourceCacheStats {
    const totalRequests = this._hits + this._misses;
    return {
      entryCount: this._entries.size,
      maxEntries: this._maxEntries,
      estimatedBytes: this._totalBytes,
      maxBytes: this._maxBytes,
      hits: this._hits,
      misses: this._misses,
      hitRatio: totalRequests > 0 ? Number((this._hits / totalRequests).toFixed(3)) : 1.0,
      evictions: this._evictions,
    };
  }

  public dispose(): void {
    if (this._isDisposed) return;
    this._isDisposed = true;
    this.clear();
  }

  private enforceCapacityLimits(): void {
    // 1. Evict expired entries first
    const now = Date.now();
    for (const entry of this._entries.values()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.invalidate(entry.key as unknown as K);
        this._evictions++;
      }
    }

    // 2. Evict entries exceeding max count (LRU by accessSequence)
    if (this._entries.size > this._maxEntries) {
      const unpinned = Array.from(this._entries.values())
        .filter((e) => !e.isPinned)
        .sort((a, b) => a.accessSequence - b.accessSequence);

      while (this._entries.size > this._maxEntries && unpinned.length > 0) {
        const oldest = unpinned.shift()!;
        this.invalidate(oldest.key as unknown as K);
        this._evictions++;
      }
    }

    // 3. Evict entries exceeding maxBytes
    if (this._totalBytes > this._maxBytes) {
      this.trimToMemoryLimit(this._maxBytes);
    }
  }
}

export function createResourceCache<K = string, V = any>(
  options: ResourceCacheOptions = {}
): ResourceCache<K, V> {
  return new ResourceCache<K, V>(options);
}
