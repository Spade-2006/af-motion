/**
 * AF Motion Capability-Aware Fallback Resolution
 *
 * Inspectable fallback resolution evaluating WebGL support, reduced motion,
 * shader feature flags, and environment constraints.
 */

import { DEFAULT_FALLBACK_CAPABILITIES } from "../capabilities.js";
import type { GraphicsCapabilities, RendererBackend } from "../types.js";
import type { GraphicsFallbackDecision, GraphicsQualityLevel } from "./types.js";

export interface ResolveFallbackOptions {
  readonly preferredBackend?: RendererBackend | "auto";
  readonly respectReducedMotion?: boolean;
}

export function resolveGraphicsFallback(
  capabilities?: GraphicsCapabilities,
  options?: ResolveFallbackOptions
): GraphicsFallbackDecision {
  const caps = capabilities ?? DEFAULT_FALLBACK_CAPABILITIES;
  const isReducedMotion = Boolean(options?.respectReducedMotion ?? caps.reducedMotion);

  const degradedEffects: string[] = [];

  // Check WebGL availability
  const hasWebGL = caps.webgl || caps.webgl2 || caps.supportedBackends.includes("webgl");
  const wantsWebGL = options?.preferredBackend === "webgl" || options?.preferredBackend === "webgl2" || options?.preferredBackend === "auto" || !options?.preferredBackend;

  let targetBackend: RendererBackend = "canvas2d";
  let isFallback = false;
  let reason = "Standard Canvas2D rendering pipeline active.";
  let qualityLevel: GraphicsQualityLevel = "high";

  if (wantsWebGL && hasWebGL) {
    targetBackend = caps.webgl2 ? "webgl2" : "webgl";
    isFallback = false;
    reason = `Hardware-accelerated ${targetBackend.toUpperCase()} renderer active.`;
  } else {
    targetBackend = "canvas2d";
    isFallback = true;
    degradedEffects.push("webgl-shaders", "gpu-instancing", "float-textures");
    reason = "WebGL hardware acceleration is unavailable; fell back gracefully to Canvas2D rendering.";
  }

  if (isReducedMotion) {
    qualityLevel = "low";
    degradedEffects.push("particle-motion", "fluid-turbulence", "wave-animations");
    reason += " Reduced motion preference is active: high-frequency animation loops are suspended.";
  }

  return {
    targetBackend,
    qualityLevel,
    degradedEffects: Object.freeze(degradedEffects),
    isFallback,
    reason,
  };
}
