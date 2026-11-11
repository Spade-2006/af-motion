/**
 * AF Motion Glass Effects System
 *
 * Configurable glass material presets with progressive enhancement,
 * backdrop-filter detection, accessible fallbacks, and graphics effect integration.
 */

import type { GraphicsEffect, GraphicsEffectUpdateContext } from "../types.js";
import { getGlassPreset } from "./presets.js";
import type {
  GlassMaterialOptions,
  GlassPresetName,
  GlassStyleResult,
  MaterialUniforms,
} from "./types.js";

/**
 * Check whether backdrop-filter is supported in the current environment.
 * Safe for SSR and Node.js test environments.
 */
export function isBackdropFilterSupported(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false;
  }
  return (
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)")
  );
}

/**
 * Compute inline CSS styles and shader uniforms for glass surfaces.
 * Supports progressive enhancement with accessible high-contrast/no-blur fallbacks.
 */
export function computeGlassStyle(
  preset: GlassPresetName = "frosted-glass",
  options?: GlassMaterialOptions
): GlassStyleResult {
  const basePreset = getGlassPreset(preset);
  const cleanOptions = options
    ? Object.fromEntries(Object.entries(options).filter(([_, v]) => v !== undefined))
    : {};
  const merged: GlassMaterialOptions = {
    ...basePreset,
    ...cleanOptions,
  };

  const presetName = merged.preset ?? preset;
  const blur = merged.blur ?? 16;
  const opacity = merged.opacity ?? 0.25;
  const tint = merged.tint ?? "rgba(255, 255, 255, 0.2)";
  const elevation = merged.elevation ?? 2;
  const edgeHighlight = merged.edgeHighlight !== false;
  const borderWidth = merged.borderWidth ?? "1px";
  const borderColor = merged.borderColor ?? "rgba(255, 255, 255, 0.3)";
  const borderRadius = typeof merged.borderRadius === "number" ? `${merged.borderRadius}px` : (merged.borderRadius ?? "16px");
  const refractiveIndex = merged.refractiveIndex ?? 1.45;
  const highContrast = merged.highContrast ?? false;

  const supportsBackdrop = isBackdropFilterSupported();
  // Fallback triggers if backdrop-filter is not supported or if highContrast is requested
  const isFallback = !supportsBackdrop || highContrast;

  // Compute background and backdrop filter
  let background: string;
  let backdropFilter: string | undefined;
  let webkitBackdropFilter: string | undefined;

  if (isFallback) {
    // Accessible fallback: higher opacity or solid tinted background
    if (highContrast) {
      background = "#ffffff";
    } else {
      // Semi-solid fallback for non-backdrop environments
      background = tint.startsWith("rgba")
        ? tint.replace(/[\d.]+\)$/, "0.92)")
        : "rgba(255, 255, 255, 0.92)";
    }
    backdropFilter = undefined;
    webkitBackdropFilter = undefined;
  } else {
    background = tint;
    backdropFilter = `blur(${blur}px)`;
    webkitBackdropFilter = `blur(${blur}px)`;
  }

  // Border
  const effectiveBorderColor = highContrast ? "#0f172a" : borderColor;
  const effectiveBorderWidth = highContrast ? "2px" : borderWidth;
  const border = `${effectiveBorderWidth} solid ${effectiveBorderColor}`;

  // Shadows and highlights
  const shadowList: string[] = [];
  if (edgeHighlight && !isFallback) {
    shadowList.push("inset 0 1px 1px 0 rgba(255, 255, 255, 0.55)");
    shadowList.push("inset 0 -1px 1px 0 rgba(0, 0, 0, 0.05)");
  }

  if (elevation > 0) {
    const yOffset = elevation * 3;
    const blurRadius = elevation * 8;
    const alpha = highContrast ? 0.25 : Math.min(0.25, 0.04 * elevation + 0.04);
    shadowList.push(`0 ${yOffset}px ${blurRadius}px rgba(0, 0, 0, ${alpha.toFixed(3)})`);
    shadowList.push(`0 ${Math.max(1, Math.round(elevation * 0.75))}px 3px rgba(0, 0, 0, 0.04)`);
  }

  const boxShadow = shadowList.length > 0 ? shadowList.join(", ") : "none";

  const uniforms: MaterialUniforms = {
    u_blur: blur,
    u_refractive_index: refractiveIndex,
    u_opacity: isFallback ? 0.95 : opacity,
    u_is_fallback: isFallback,
    u_elevation: elevation,
  };

  return {
    preset: presetName,
    blur,
    isFallback,
    background,
    backdropFilter,
    WebkitBackdropFilter: webkitBackdropFilter,
    border,
    borderRadius,
    boxShadow,
    opacity: isFallback ? 1.0 : 1.0, // Element container stays 1.0; background color holds transparency
    uniforms,
  };
}

let glassEffectCounter = 0;

/**
 * Creates a GraphicsEffect that renders refraction / glass wash on a Canvas or WebGL context.
 */
export function createGlassEffect(options?: GlassMaterialOptions): GraphicsEffect<GlassMaterialOptions> {
  const id = `glass-effect-${++glassEffectCounter}`;
  const preset = options?.preset ?? "frosted-glass";
  const blur = options?.blur ?? 16;
  const refractiveIndex = options?.refractiveIndex ?? 1.45;

  return {
    id,
    name: `GlassEffect (${preset})`,
    version: "1.0.0",
    config: options,
    accessibility: {
      supportsReducedMotion: true,
      respectsReducedMotion: true,
      staticFallback: true,
    },
    render(context: GraphicsEffectUpdateContext): void {
      const ctx = context.rawContext;
      if (!ctx) return;

      // When rendering on Canvas2D context, apply a soft glass refraction tint
      if (typeof ctx === "object" && "fillStyle" in ctx) {
        const c2d = ctx as CanvasRenderingContext2D;
        const tint = options?.tint ?? "rgba(255, 255, 255, 0.15)";
        c2d.save();
        c2d.fillStyle = tint;
        c2d.fillRect(0, 0, context.width, context.height);
        c2d.restore();
      }
    },
    dispose(): void {
      // Cleanup effect resources
    },
  };
}
