/**
 * AF Motion Lighting System
 *
 * Configurable multi-source lighting, shadow computation, and shader uniform mapping.
 */

import type {
  LightingConfig,
  MaterialUniforms,
  ResolvedLighting,
  ShadowConfig,
  SurfaceDefinition,
} from "./types.js";
import { STUDIO_LIGHTING } from "./presets.js";

/**
 * Format shadow config array into a standard CSS box-shadow string.
 */
export function formatShadowsCss(shadows?: readonly ShadowConfig[]): string {
  if (!shadows || shadows.length === 0) {
    return "none";
  }

  return shadows
    .map((s) => {
      const [x, y] = s.offset ?? [0, 2];
      const blur = s.blur ?? 4;
      const spread = s.spread ?? 0;
      const color = s.color ?? "rgba(0, 0, 0, 0.1)";
      const inset = s.inset ? "inset " : "";
      return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
    })
    .join(", ");
}

/**
 * Resolve full lighting state from partial configuration.
 */
export function resolveLighting(lighting?: LightingConfig): ResolvedLighting {
  const config = lighting ?? STUDIO_LIGHTING;
  const ambient = config.ambient ?? { color: "#ffffff", intensity: 0.5 };
  const directional = config.directional ?? {
    direction: [0.5, 1.0, 0.75] as const,
    color: "#ffffff",
    intensity: 0.8,
  };

  const shadowsCss = formatShadowsCss(config.shadows);

  let highlightCss = "none";
  if (config.highlight) {
    const color = config.highlight.color ?? "rgba(255, 255, 255, 0.6)";
    const blur = typeof config.highlight.blur === "number" ? `${config.highlight.blur}px` : (config.highlight.blur ?? "8px");
    highlightCss = `0 0 ${blur} ${color}`;
  }

  const uniforms: Record<string, number | readonly number[] | string | boolean> = {
    u_ambient_intensity: ambient.intensity ?? 0.5,
    u_light_direction: directional.direction ?? [0.5, 1.0, 0.75],
    u_light_intensity: directional.intensity ?? 0.8,
  };

  if (config.point) {
    uniforms["u_point_pos"] = config.point.position ?? [0, 0, 100];
    uniforms["u_point_intensity"] = config.point.intensity ?? 1.0;
  }

  return {
    ambientColor: ambient.color ?? "#ffffff",
    ambientIntensity: ambient.intensity ?? 0.5,
    primaryLightColor: directional.color ?? "#ffffff",
    primaryLightDirection: directional.direction ?? [0.5, 1.0, 0.75],
    shadowsCss,
    highlightCss,
    uniforms,
  };
}

/**
 * Compute the light interaction between a surface and a lighting configuration.
 */
export function computeLightInteraction(
  surface: SurfaceDefinition,
  lighting?: LightingConfig
): {
  readonly highlights: readonly string[];
  readonly shadows: readonly string[];
  readonly uniforms: MaterialUniforms;
} {
  const resolved = resolveLighting(lighting);
  const highlights: string[] = [];
  const shadows: string[] = [];

  // Edge / specular highlight from surface and lighting
  if (surface.highlight) {
    const hlColor = surface.highlight.color ?? "rgba(255, 255, 255, 0.5)";
    const intensity = surface.highlight.intensity ?? 0.6;
    const spread = surface.highlight.spread ?? 1;
    // Inset top-edge highlight based on angle/intensity
    highlights.push(`inset 0 ${Math.max(1, Math.round(intensity * 2))}px ${spread}px rgba(255, 255, 255, ${intensity * 0.4})`);
    if (resolved.highlightCss !== "none") {
      highlights.push(resolved.highlightCss);
    }
    if (hlColor.includes("rgba")) {
      highlights.push(`0 0 ${Math.round(intensity * 12)}px ${hlColor}`);
    }
  }

  if (resolved.shadowsCss !== "none") {
    shadows.push(resolved.shadowsCss);
  } else if ((surface.elevation ?? 0) > 0) {
    // Default elevation shadows if none explicitly configured
    const elev = surface.elevation ?? 1;
    shadows.push(`0 ${elev * 2}px ${elev * 6}px rgba(0, 0, 0, ${Math.min(0.3, 0.04 * elev)})`);
    shadows.push(`0 ${Math.round(elev * 0.8)}px ${elev * 2}px rgba(0, 0, 0, 0.04)`);
  }

  const uniforms: MaterialUniforms = {
    ...resolved.uniforms,
    u_roughness: surface.roughness ?? 0.5,
    u_smoothness: surface.smoothness ?? (1 - (surface.roughness ?? 0.5)),
    u_reflectivity: surface.reflectivity ?? 0.1,
    u_opacity: surface.opacity ?? 1.0,
  };

  return {
    highlights,
    shadows,
    uniforms,
  };
}
