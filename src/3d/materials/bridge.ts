/**
 * AF Motion 2D Surface to 3D Material Bridge
 *
 * Maps Prompt 72 2D surface concepts into 3D physically based material specifications.
 */

import type { SurfaceDefinition } from "../../graphics/materials/types.js";
import type { IntelligentMaterial3DConfig } from "./types.js";

/**
 * Convert a Prompt 72 SurfaceDefinition into a 3D material specification.
 */
export function surfaceToMaterial3D(surface: SurfaceDefinition): IntelligentMaterial3DConfig {
  const roughness = surface.roughness ?? (surface.smoothness !== undefined ? 1 - surface.smoothness : 0.5);
  const opacity = surface.opacity ?? 1.0;
  const transmission = surface.transmission ?? 0;
  const isTransparent = opacity < 1.0 || transmission > 0;

  if (transmission > 0) {
    return {
      type: "physical",
      color: surface.baseColor ?? "#ffffff",
      roughness,
      metalness: 0.0,
      transmission,
      ior: surface.refractiveIndex ?? 1.5,
      thickness: surface.depth !== undefined ? surface.depth / 10 : 1.0,
      transparent: true,
      opacity,
    };
  }

  const reflectivity = surface.reflectivity ?? 0.1;
  const metalness = reflectivity > 0.5 ? reflectivity : 0.0;

  return {
    type: reflectivity > 0.1 ? "physical" : "standard",
    color: surface.baseColor ?? "#ffffff",
    roughness,
    metalness,
    transparent: isTransparent,
    opacity,
    ...(surface.refractiveIndex ? { ior: surface.refractiveIndex } : {}),
  };
}
