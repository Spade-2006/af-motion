/**
 * AF Motion React Three Fiber (R3F) Bridge Helpers
 *
 * Framework-independent helpers for mapping AF Motion 3D scene definitions
 * into React Three Fiber properties and canvas options.
 */

import type { Camera3DConfig, Lighting3DConfig, Scene3DDefinition } from "./types.js";

/**
 * Check if React Three Fiber is present in the runtime environment.
 */
export function isR3FAvailable(): boolean {
  if (typeof globalThis !== "undefined") {
    const g = globalThis as any;
    if (g.__R3F__ || g.ReactThreeFiber) return true;
  }
  return false;
}

/**
 * Convert Camera3DConfig into R3F camera property bag.
 */
export function toR3FCameraProps(config?: Camera3DConfig): Record<string, unknown> {
  if (!config) {
    return {
      fov: 50,
      near: 0.1,
      far: 1000,
      position: [0, 0, 5],
    };
  }

  const props: Record<string, unknown> = {};
  if (config.fov !== undefined) props.fov = config.fov;
  if (config.near !== undefined) props.near = config.near;
  if (config.far !== undefined) props.far = config.far;
  if (config.position) props.position = [...config.position];
  if (config.zoom !== undefined) props.zoom = config.zoom;

  return props;
}

/**
 * Convert Lighting3DConfig into R3F light property descriptor.
 */
export function toR3FLightingProps(config?: Lighting3DConfig): {
  ambient?: { color: string; intensity: number };
  directional: Array<{ color: string; intensity: number; position?: readonly [number, number, number]; castShadow?: boolean }>;
} {
  return {
    ambient: config?.ambient
      ? {
          color: config.ambient.color ?? "#ffffff",
          intensity: config.ambient.intensity ?? 0.5,
        }
      : undefined,
    directional: (config?.directional ?? []).map((d) => ({
      color: d.color ?? "#ffffff",
      intensity: d.intensity ?? 1,
      position: d.position,
      castShadow: d.castShadow,
    })),
  };
}

/**
 * Convert Scene3DDefinition into R3F Canvas configuration options.
 */
export function toR3FCanvasProps(definition?: Scene3DDefinition): Record<string, unknown> {
  const dpr = definition?.renderer?.dpr ?? "auto";
  const gl = {
    antialias: definition?.renderer?.antialias ?? true,
    alpha: definition?.renderer?.alpha ?? true,
    powerPreference: definition?.renderer?.powerPreference ?? "default",
  };

  return {
    camera: toR3FCameraProps(definition?.camera),
    dpr: dpr === "auto" ? [1, 2] : dpr,
    gl,
    shadows: !!definition?.renderer?.shadowMap,
  };
}
