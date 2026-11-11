/**
 * AF Motion Procedural Texture Cache
 *
 * Bounded LRU cache with seed-based keys, automatic resource disposal,
 * and memory-footprint tracking.
 */

import type { GeneratedTexture, TextureCacheStats } from "./types.js";

export interface TextureCacheOptions {
  /** Maximum number of textures in cache (default: 64) */
  readonly maxSize?: number;
  /** Maximum estimated memory in bytes (default: 64 MB = 67,108,864 bytes) */
  readonly maxMemoryBytes?: number;
}

export class TextureCache {
  private readonly cache = new Map<string, GeneratedTexture>();
  private readonly maxSize: number;
  private readonly maxMemoryBytes: number;
  private currentMemoryBytes = 0;
  private hits = 0;
  private misses = 0;

  constructor(options?: TextureCacheOptions) {
    this.maxSize = options?.maxSize ?? 64;
    this.maxMemoryBytes = options?.maxMemoryBytes ?? 64 * 1024 * 1024; // 64 MB
  }

  get(key: string): GeneratedTexture | undefined {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return undefined;
    }

    this.hits++;
    // Reinsert to update LRU position
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key: string, texture: GeneratedTexture): void {
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentMemoryBytes -= existing.estimatedSizeBytes;
      this.cache.delete(key);
      existing.dispose();
    }

    // Evict oldest items if exceeding capacity
    while (
      (this.cache.size >= this.maxSize ||
        this.currentMemoryBytes + texture.estimatedSizeBytes > this.maxMemoryBytes) &&
      this.cache.size > 0
    ) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }

    this.cache.set(key, texture);
    this.currentMemoryBytes += texture.estimatedSizeBytes;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    this.currentMemoryBytes = Math.max(0, this.currentMemoryBytes - item.estimatedSizeBytes);
    this.cache.delete(key);
    item.dispose();
    return true;
  }

  clear(): void {
    for (const item of this.cache.values()) {
      item.dispose();
    }
    this.cache.clear();
    this.currentMemoryBytes = 0;
  }

  getStats(): TextureCacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryBytes: this.currentMemoryBytes,
      maxMemoryBytes: this.maxMemoryBytes,
    };
  }
}

export const defaultTextureCache = new TextureCache();
