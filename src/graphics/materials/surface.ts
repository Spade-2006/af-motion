/**
 * AF Motion Surface System
 *
 * Computes deterministic surface styles, depth appearance, and shader properties.
 */

import type {
  LightingConfig,
  SurfaceDefinition,
  SurfaceStyleResult,
} from "./types.js";
import { computeLightInteraction } from "./lighting.js";

export interface ComputeSurfaceOptions {
  readonly highContrast?: boolean;
}

/**
 * Compute CSS and uniform properties for a surface definition.
 */
export function computeSurfaceStyle(
  surface: SurfaceDefinition,
  lighting?: LightingConfig,
  options?: ComputeSurfaceOptions
): SurfaceStyleResult {
  const highContrast = options?.highContrast ?? false;

  const roughness = surface.roughness ?? (surface.smoothness !== undefined ? 1 - surface.smoothness : 0.5);
  const smoothness = surface.smoothness ?? (1 - roughness);
  const baseOpacity = Math.max(0, Math.min(1, surface.opacity ?? 1.0));
  const effectiveOpacity = highContrast ? Math.max(baseOpacity, 0.9) : baseOpacity;

  // Background
  const background = surface.baseColor ?? "transparent";

  // Border & radius
  const borderWidth = surface.border?.width ?? (highContrast ? "2px" : "1px");
  const borderStyle = surface.border?.style ?? "solid";
  let borderColor = surface.border?.color ?? (highContrast ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.2)");
  if (highContrast && !surface.border?.color) {
    borderColor = "#0f172a";
  }
  const border = `${borderWidth} ${borderStyle} ${borderColor}`;
  const borderRadius = typeof surface.border?.radius === "number"
    ? `${surface.border.radius}px`
    : (surface.border?.radius ?? "8px");

  // Light interaction: highlights and shadows
  const interaction = computeLightInteraction(surface, lighting);
  const shadowList: string[] = [];

  // Surface border glow if present
  if (surface.border?.glow) {
    shadowList.push(surface.border.glow);
  }

  // Highlights (inset top edge, etc.)
  if (interaction.highlights.length > 0) {
    shadowList.push(...interaction.highlights);
  }

  // Shadows
  if (interaction.shadows.length > 0) {
    shadowList.push(...interaction.shadows);
  }

  const boxShadow = shadowList.length > 0 ? shadowList.join(", ") : "none";

  // Optional 3D depth transform
  let transform: string | undefined;
  if ((surface.depth ?? 0) > 0) {
    transform = `translateZ(${surface.depth}px)`;
  }

  return {
    background,
    border,
    borderRadius,
    boxShadow,
    opacity: effectiveOpacity,
    transform,
    uniforms: {
      ...interaction.uniforms,
      u_roughness: roughness,
      u_smoothness: smoothness,
      u_refractive_index: surface.refractiveIndex ?? 1.0,
      u_blend_mode: surface.blendMode ?? "normal",
    },
  };
}
