/**
 * AF Motion Procedural Textures & Patterns Contracts
 *
 * Framework-independent definitions for procedural texture generation,
 * deterministic seeds, multi-backend rendering, caching, and material mapping.
 */

import type { DisposableResource } from "../types.js";

export type TextureGeneratorName =
  | "noise"
  | "paper"
  | "fabric"
  | "marble"
  | "wood"
  | "metal-brush"
  | "halftone"
  | "dots"
  | "stripes"
  | "organic-gradient"
  | "topographic"
  | "imperfections";

export type TextureQuality = "low" | "medium" | "high";

export type TextureBlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light";

export type TextureRepeatMode =
  | "repeat"
  | "no-repeat"
  | "repeat-x"
  | "repeat-y";

export interface WebGLTextureDescriptor {
  readonly width: number;
  readonly height: number;
  readonly format: "rgba8" | "rgb8" | "r8";
  readonly minFilter: "linear" | "nearest" | "linear-mipmap-linear";
  readonly magFilter: "linear" | "nearest";
  readonly wrapS: "repeat" | "clamp-to-edge" | "mirrored-repeat";
  readonly wrapT: "repeat" | "clamp-to-edge" | "mirrored-repeat";
  readonly source: HTMLCanvasElement | ImageData | Uint8Array | null;
}

export interface ProceduralTextureOptions {
  readonly seed?: number | string;
  readonly width?: number;
  readonly height?: number;
  readonly quality?: TextureQuality;
  readonly dpr?: number;
  readonly color?: string;
  readonly secondaryColor?: string;
  readonly accentColor?: string;
  readonly opacity?: number;
  readonly intensity?: number;
  readonly scale?: number | readonly [number, number];
  readonly contrast?: number;
  readonly roughness?: number;
  readonly angle?: number;
  readonly frequency?: number;
  readonly custom?: Readonly<Record<string, unknown>>;
}

export interface ProceduralTextureConfig {
  readonly generator: TextureGeneratorName;
  readonly options?: ProceduralTextureOptions;
}

export interface GeneratedTexture extends DisposableResource {
  readonly id: string;
  readonly type: "procedural-texture";
  readonly generator: TextureGeneratorName;
  readonly seed: number;
  readonly width: number;
  readonly height: number;
  readonly canvas: HTMLCanvasElement | null;
  readonly dataUrl: string;
  readonly cssBackground: string;
  readonly webglDescriptor: WebGLTextureDescriptor | null;
  readonly estimatedSizeBytes: number;
  dispose(): void;
}

export interface TextureCacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly size: number;
  readonly maxSize: number;
  readonly memoryBytes: number;
  readonly maxMemoryBytes: number;
}

export interface TextureMappingOptions {
  readonly scale?: number | readonly [number, number];
  readonly offset?: readonly [number, number];
  readonly repeat?: TextureRepeatMode;
  readonly blendMode?: TextureBlendMode;
  readonly opacity?: number;
}

export interface TextureGeneratorMetadata {
  readonly name: TextureGeneratorName;
  readonly displayName: string;
  readonly description: string;
  readonly category: "noise" | "organic" | "geometric" | "material" | "artistic";
  readonly defaultOptions: ProceduralTextureOptions;
  readonly tags: readonly string[];
}
