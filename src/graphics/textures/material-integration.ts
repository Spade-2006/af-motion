/**
 * AF Motion Material & Texture Integration
 *
 * Connects procedural textures to Prompt 72 surfaces and materials,
 * generating CSS background styles, texture mapping, and shader uniforms.
 */

import { computeSurfaceStyle } from "../materials/surface.js";
import type {
  LightingConfig,
  MaterialUniforms,
  SurfaceDefinition,
  SurfaceStyleResult,
} from "../materials/types.js";
import { generateProceduralTexture } from "./engine.js";
import { TEXTURE_GENERATORS } from "./generators.js";
import type {
  GeneratedTexture,
  ProceduralTextureConfig,
  TextureGeneratorName,
  TextureMappingOptions,
} from "./types.js";

/**
 * Format scale into a CSS background-size string.
 */
function formatBackgroundSize(scale?: number | readonly [number, number]): string | undefined {
  if (scale === undefined) return undefined;
  if (typeof scale === "number") {
    return `${Math.round(scale * 100)}%`;
  }
  return `${scale[0]}px ${scale[1]}px`;
}

/**
 * Format offset into a CSS background-position string.
 */
function formatBackgroundPosition(offset?: readonly [number, number]): string | undefined {
  if (!offset) return undefined;
  return `${offset[0]}px ${offset[1]}px`;
}

/**
 * Resolve texture input into a GeneratedTexture or image URL string.
 */
export function resolveTextureInput(
  texture: GeneratedTexture | ProceduralTextureConfig | string
): { dataUrl: string; generated?: GeneratedTexture } {
  if (typeof texture === "string") {
    if (texture in TEXTURE_GENERATORS) {
      const gen = generateProceduralTexture({ generator: texture as TextureGeneratorName });
      return { dataUrl: gen.dataUrl, generated: gen };
    }
    const dataUrl = texture.startsWith("url(") ? texture.slice(4, -1).replace(/["']/g, "") : texture;
    return { dataUrl };
  }

  if ("generator" in texture && !("estimatedSizeBytes" in texture)) {
    const gen = generateProceduralTexture(texture as ProceduralTextureConfig);
    return { dataUrl: gen.dataUrl, generated: gen };
  }

  const gen = texture as GeneratedTexture;
  return { dataUrl: gen.dataUrl, generated: gen };
}

/**
 * Connect a procedural texture to a surface definition, outputting merged CSS styles
 * and shader uniform parameters.
 */
export function applyTextureToSurface(
  surface: SurfaceDefinition,
  texture: GeneratedTexture | ProceduralTextureConfig | string,
  mapping?: TextureMappingOptions,
  lighting?: LightingConfig
): SurfaceStyleResult {
  const baseStyle = computeSurfaceStyle(surface, lighting);
  const resolved = resolveTextureInput(texture);

  const backgroundImage = `url("${resolved.dataUrl}")`;
  const backgroundRepeat = mapping?.repeat ?? surface.textureRepeat ?? "repeat";
  const backgroundSize = formatBackgroundSize(mapping?.scale ?? surface.textureScale);
  const backgroundPosition = formatBackgroundPosition(mapping?.offset ?? surface.textureOffset) ?? "center";
  const backgroundBlendMode = mapping?.blendMode ?? surface.blendMode ?? "normal";
  const opacity = mapping?.opacity ?? surface.textureOpacity ?? 1.0;

  const uniforms: Record<string, number | readonly number[] | string | boolean> = {
    ...(baseStyle.uniforms ?? {}),
    u_texture_enabled: true,
    u_texture_opacity: opacity,
    u_texture_blend_mode: backgroundBlendMode,
  };

  if (mapping?.scale !== undefined || surface.textureScale !== undefined) {
    const s = mapping?.scale ?? surface.textureScale!;
    uniforms["u_texture_scale"] = typeof s === "number" ? [s, s] : s;
  }

  if (mapping?.offset !== undefined || surface.textureOffset !== undefined) {
    const o = mapping?.offset ?? surface.textureOffset!;
    uniforms["u_texture_offset"] = o;
  }

  return {
    ...baseStyle,
    backgroundImage,
    backgroundSize,
    backgroundRepeat,
    backgroundPosition,
    backgroundBlendMode,
    uniforms,
  };
}
