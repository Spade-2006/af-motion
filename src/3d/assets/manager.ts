/**
 * AF Motion 3D Asset Manager
 *
 * Central coordinator for 3D asset loading, caching, deduplication,
 * lifecycle management, progress tracking, and memory cleanup.
 */

import type {
  Asset3DDefinition,
  Asset3DEntry,
  Asset3DFormat,
  Asset3DLoadOptions,
  AssetLoader3D,
  AssetManagerStats,
} from "./types.js";
import { correctAssetDefinition, validateAssetDefinition } from "./validation.js";
import { AssetCache3D } from "./cache.js";
import { createMockAssetLoader, createThreeGLTFLoader, createThreeOBJLoader } from "./loaders.js";
import { inspectModelGraph, instantiateModel } from "./inspection.js";

export class AssetManager3D {
  private readonly cache: AssetCache3D;
  private readonly loaders: AssetLoader3D[] = [];

  constructor(options?: { cache?: AssetCache3D }) {
    this.cache = options?.cache ?? new AssetCache3D();
    // Register default mock loader as fallback
    this.registerLoader(createMockAssetLoader({ delayMs: 0 }));
  }

  /**
   * Registers a 3D asset loader. Newly registered loaders take precedence.
   */
  public registerLoader(loader: AssetLoader3D): void {
    // Insert at front so custom loaders override default fallbacks
    this.loaders.unshift(loader);
  }

  /**
   * Unregisters a loader by name.
   */
  public unregisterLoader(name: string): boolean {
    const idx = this.loaders.findIndex((l) => l.name === name);
    if (idx !== -1) {
      this.loaders.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Finds a suitable loader for the given asset definition.
   */
  public findLoader(definition: Asset3DDefinition): AssetLoader3D | undefined {
    for (const loader of this.loaders) {
      if (loader.canLoad && loader.canLoad(definition)) {
        return loader;
      }
      if (definition.format && loader.formats.includes(definition.format)) {
        return loader;
      }
    }
    return this.loaders[0]; // Fall back to first available loader
  }

  /**
   * Loads a 3D asset with caching, deduplication, and cancellation support.
   */
  public async load<T = unknown>(
    definitionOrUrl: Asset3DDefinition | string,
    options?: Asset3DLoadOptions
  ): Promise<Asset3DEntry<T>> {
    const rawDef =
      typeof definitionOrUrl === "string"
        ? { id: definitionOrUrl, url: definitionOrUrl }
        : definitionOrUrl;

    const definition = correctAssetDefinition(rawDef);
    const validation = validateAssetDefinition(definition);
    if (!validation.valid) {
      throw new Error(`Invalid asset definition: ${validation.errors.join("; ")}`);
    }

    const cacheKey = definition.id;

    // Check if force reload is requested
    if (!options?.forceReload) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached && cached.status === "loaded") {
        if (options?.onProgress) {
          options.onProgress(1);
        }
        return cached;
      }

      // Check if already in-flight (deduplication!)
      const inFlight = this.cache.getInFlight<T>(cacheKey);
      if (inFlight) {
        return inFlight;
      }
    }

    // Set initial loading entry
    const loadingEntry: Asset3DEntry<T> = {
      id: definition.id,
      url: definition.url,
      format: definition.format as Asset3DFormat,
      status: "loading",
      progress: 0,
      refCount: 1,
      lastAccessedAt: Date.now(),
    };
    this.cache.set(cacheKey, loadingEntry);

    // Create loading execution promise
    const loadPromise = (async (): Promise<Asset3DEntry<T>> => {
      try {
        if (options?.signal?.aborted) {
          throw new Error("Asset loading was aborted.");
        }

        const loader = options?.customLoader || this.findLoader(definition);
        if (!loader) {
          throw new Error(`No compatible loader found for format '${definition.format}'.`);
        }

        // Forward progress events to cache entry and user callback
        const trackedOptions: Asset3DLoadOptions = {
          ...options,
          onProgress: (p) => {
            const current = this.cache.get<T>(cacheKey);
            if (current) {
              this.cache.set(cacheKey, {
                ...current,
                progress: p,
              });
            }
            if (options?.onProgress) {
              options.onProgress(p);
            }
          },
        };

        const loadedData = (await loader.load(definition, trackedOptions)) as T;

        if (options?.signal?.aborted) {
          // Dispose freshly loaded data if aborted right at completion
          if (loader.dispose) {
            loader.dispose(loadedData);
          }
          throw new Error("Asset loading was aborted.");
        }

        // Extract metadata via loader inspect or fallback inspection
        const metadata = loader.inspect
          ? loader.inspect(loadedData)
          : inspectModelGraph(loadedData);

        const loadedEntry: Asset3DEntry<T> = {
          id: definition.id,
          url: definition.url,
          format: definition.format as Asset3DFormat,
          status: "loaded",
          data: loadedData,
          progress: 1,
          metadata: {
            ...metadata,
            ...(definition.metadata || {}),
          },
          refCount: 1,
          loadedAt: Date.now(),
          lastAccessedAt: Date.now(),
        };

        this.cache.set(cacheKey, loadedEntry);
        return loadedEntry;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const errorEntry: Asset3DEntry<T> = {
          id: definition.id,
          url: definition.url,
          format: definition.format as Asset3DFormat,
          status: "error",
          progress: 0,
          error: errorMsg,
          refCount: 0,
          lastAccessedAt: Date.now(),
        };
        this.cache.set(cacheKey, errorEntry);
        throw err;
      } finally {
        this.cache.clearInFlight(cacheKey);
      }
    })();

    this.cache.setInFlight(cacheKey, loadPromise);
    return loadPromise;
  }

  /**
   * Retrieves an asset from cache if available.
   */
  public get<T = unknown>(idOrUrl: string): Asset3DEntry<T> | undefined {
    return this.cache.get<T>(idOrUrl);
  }

  /**
   * Returns a clone/instance of a loaded model so scene transformations are independent.
   */
  public instantiate<T = unknown>(idOrUrl: string): T | undefined {
    const entry = this.get<T>(idOrUrl);
    if (!entry || entry.status !== "loaded" || !entry.data) {
      return undefined;
    }
    return instantiateModel(entry.data) as T;
  }

  /**
   * Increments reference count.
   */
  public retain(idOrUrl: string): number {
    return this.cache.retain(idOrUrl);
  }

  /**
   * Decrements reference count.
   */
  public release(idOrUrl: string): number {
    return this.cache.release(idOrUrl);
  }

  /**
   * Unloads and disposes a single asset.
   */
  public unload(idOrUrl: string): boolean {
    return this.cache.evict(idOrUrl);
  }

  /**
   * Clears all assets and disposers.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Returns asset manager statistics.
   */
  public getStats(): AssetManagerStats {
    const entries = this.cache.getAllEntries();
    let loaded = 0;
    let error = 0;
    let inFlight = 0;

    for (const e of entries) {
      if (e.status === "loaded") loaded++;
      else if (e.status === "error") error++;
      else if (e.status === "loading") inFlight++;
    }

    return {
      count: entries.length,
      inFlight,
      loaded,
      error,
    };
  }

  /**
   * Configures optional Three.js model loaders (GLTF and OBJ).
   */
  public enableThreeLoaders(options?: {
    threeInstance?: any;
    gltfLoaderConstructor?: any;
    objLoaderConstructor?: any;
  }): void {
    if (options?.gltfLoaderConstructor || options?.threeInstance) {
      this.registerLoader(createThreeGLTFLoader(options));
    }
    if (options?.objLoaderConstructor || options?.threeInstance) {
      this.registerLoader(createThreeOBJLoader(options));
    }
  }
}

// Lazy singleton for default usage (SSR-safe)
let defaultManagerInstance: AssetManager3D | null = null;

export function getDefaultAssetManager(): AssetManager3D {
  if (!defaultManagerInstance) {
    defaultManagerInstance = new AssetManager3D();
  }
  return defaultManagerInstance;
}

export function resetDefaultAssetManager(): void {
  if (defaultManagerInstance) {
    defaultManagerInstance.clear();
    defaultManagerInstance = null;
  }
}
