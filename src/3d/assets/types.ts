/**
 * AF Motion 3D Asset Management Types
 *
 * Framework-independent definitions for 3D assets, loading lifecycles,
 * scene graph inspection metadata, caching, and disposal contracts.
 */

import type { BoundingBox3D } from "../schemas/types.js";

export type Asset3DFormat =
  | "gltf"
  | "glb"
  | "obj"
  | "fbx"
  | "usdz"
  | "json"
  | "texture"
  | "custom";

export type Asset3DStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "error"
  | "disposed";

export interface AnimationClipMetadata {
  readonly name: string;
  readonly duration: number;
  readonly tracksCount: number;
}

export interface ModelInspectionMetadata {
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly meshCount: number;
  readonly materialCount: number;
  readonly nodeCount: number;
  readonly hasAnimations: boolean;
  readonly animationClips: readonly AnimationClipMetadata[];
  readonly boundingBox?: BoundingBox3D;
  readonly meshNames: readonly string[];
  readonly materialNames: readonly string[];
  readonly inspectedAt?: number;
}

export interface Asset3DDefinition {
  readonly id: string;
  readonly url: string;
  readonly format?: Asset3DFormat;
  readonly name?: string;
  readonly sizeBytes?: number;
  readonly dependencies?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface Asset3DEntry<T = unknown> {
  readonly id: string;
  readonly url: string;
  readonly format: Asset3DFormat;
  readonly status: Asset3DStatus;
  readonly data?: T;
  readonly progress: number;
  readonly error?: string;
  readonly metadata?: ModelInspectionMetadata | Record<string, unknown>;
  readonly refCount: number;
  readonly loadedAt?: number;
  readonly lastAccessedAt: number;
}

export interface Asset3DLoadOptions {
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: number) => void;
  readonly headers?: Record<string, string>;
  readonly credentials?: "omit" | "same-origin" | "include";
  readonly forceReload?: boolean;
  readonly draco?: boolean;
  readonly customLoader?: AssetLoader3D;
  readonly loaderOptions?: Record<string, unknown>;
}

export interface AssetCacheConfig {
  readonly maxEntries?: number;
  readonly maxSizeBytes?: number;
  readonly ttlMs?: number;
  readonly disposeOnEvict?: boolean;
}

export interface AssetLoader3D<T = unknown> {
  readonly name: string;
  readonly formats: readonly Asset3DFormat[];
  readonly canLoad?: (definition: Asset3DDefinition) => boolean;
  readonly load: (definition: Asset3DDefinition, options?: Asset3DLoadOptions) => Promise<T>;
  readonly inspect?: (data: T) => ModelInspectionMetadata;
  readonly dispose?: (data: T) => void;
  readonly clone?: (data: T) => T;
}

export interface AssetManagerStats {
  readonly count: number;
  readonly inFlight: number;
  readonly loaded: number;
  readonly error: number;
}
