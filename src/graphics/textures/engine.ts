/**
 * AF Motion Procedural Texture Engine
 *
 * Core execution engine managing deterministic generation, quality presets,
 * resolution clamping, cache lookups, and resource lifecycles.
 */

import type { ResourceManager } from "../types.js";
import { defaultTextureCache, TextureCache } from "./cache.js";
import { TEXTURE_GENERATORS, TEXTURE_GENERATORS_METADATA } from "./generators.js";
import { createPRNG, hashSeed } from "./prng.js";
import type {
  GeneratedTexture,
  ProceduralTextureConfig,
  ProceduralTextureOptions,
  TextureGeneratorMetadata,
  TextureGeneratorName,
  TextureQuality,
} from "./types.js";

export interface GenerateTextureExecutionOptions {
  /** Custom texture cache or false to disable caching (default: defaultTextureCache) */
  readonly cache?: TextureCache | boolean;
  /** Optional Prompt 71 ResourceManager to register texture lifecycle with */
  readonly resourceManager?: ResourceManager;
  /** Optional owner ID for the resource manager */
  readonly ownerId?: string;
}

const QUALITY_RESOLUTIONS: Readonly<Record<TextureQuality, number>> = {
  low: 128,
  medium: 256,
  high: 512,
};

let textureIdCounter = 0;

/**
 * Determine resolution given quality preset or width/height overrides.
 */
function resolveDimensions(options?: ProceduralTextureOptions): { width: number; height: number } {
  const quality = options?.quality ?? "medium";
  const defaultSize = QUALITY_RESOLUTIONS[quality] ?? 256;

  const rawWidth = options?.width ?? defaultSize;
  const rawHeight = options?.height ?? defaultSize;

  // Clamp resolution to safe bounded limits (8px to 2048px)
  const width = Math.max(8, Math.min(2048, Math.round(rawWidth)));
  const height = Math.max(8, Math.min(2048, Math.round(rawHeight)));

  return { width, height };
}

/**
 * Build a deterministic cache key for a texture configuration.
 */
export function buildTextureCacheKey(
  generator: TextureGeneratorName,
  seed: number,
  width: number,
  height: number,
  options?: ProceduralTextureOptions
): string {
  const cleanOptions = options ? Object.fromEntries(
    Object.entries(options).filter(([k, v]) => v !== undefined && k !== "seed")
  ) : {};
  return `${generator}:${seed}:${width}x${height}:${JSON.stringify(cleanOptions)}`;
}

/**
 * Generate a procedural texture deterministically using configurable generators,
 * seeds, quality presets, and bounded memory caching.
 */
export function generateProceduralTexture(
  config: ProceduralTextureConfig,
  execOptions?: GenerateTextureExecutionOptions
): GeneratedTexture {
  const generatorName = config.generator ?? "noise";
  const generator = TEXTURE_GENERATORS[generatorName] ?? TEXTURE_GENERATORS.noise;
  const opts = config.options ?? {};

  const { width, height } = resolveDimensions(opts);
  const seed = hashSeed(opts.seed);

  // Check cache if caching is active
  const cache = execOptions?.cache === false ? null : (execOptions?.cache instanceof TextureCache ? execOptions.cache : defaultTextureCache);
  const cacheKey = cache ? buildTextureCacheKey(generatorName, seed, width, height, opts) : null;

  if (cache && cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const prng = createPRNG(seed);
  const output = generator(opts, prng, width, height);

  const textureId = `tex-${generatorName}-${++textureIdCounter}`;
  // Estimated RGBA size: 4 bytes per pixel
  const estimatedSizeBytes = width * height * 4;

  let isDisposed = false;

  const generatedTexture: GeneratedTexture = {
    id: textureId,
    type: "procedural-texture",
    generator: generatorName,
    seed,
    width,
    height,
    canvas: output.canvas,
    dataUrl: output.dataUrl,
    cssBackground: output.cssBackground,
    webglDescriptor: output.webglDescriptor,
    estimatedSizeBytes,
    dispose(): void {
      if (isDisposed) return;
      isDisposed = true;
      if (output.canvas) {
        output.canvas.width = 0;
        output.canvas.height = 0;
      }
    },
  };

  // Register with Prompt 71 ResourceManager if provided
  if (execOptions?.resourceManager) {
    execOptions.resourceManager.register(generatedTexture, execOptions.ownerId);
  }

  // Cache result
  if (cache && cacheKey) {
    cache.set(cacheKey, generatedTexture);
  }

  return generatedTexture;
}

/**
 * Get metadata for a texture generator.
 */
export function getTextureGeneratorMetadata(
  name: TextureGeneratorName
): TextureGeneratorMetadata | undefined {
  return TEXTURE_GENERATORS_METADATA[name];
}

/**
 * List all available texture generators with their metadata.
 */
export function listTextureGenerators(): readonly TextureGeneratorMetadata[] {
  return Object.values(TEXTURE_GENERATORS_METADATA);
}
