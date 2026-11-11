/**
 * AF Motion 3D Capability Detection
 *
 * Safe detection of WebGL, WebGL2, WebGPU, GPU limits, and display preferences.
 */

import type { Scene3DCapabilities } from "./types.js";

let cachedCapabilities: Scene3DCapabilities | null = null;

/**
 * Detect available 3D rendering capabilities in the current environment.
 * Safe for SSR, Node, and headless test runners.
 */
export function detect3DCapabilities(forceRefresh = false): Scene3DCapabilities {
  if (cachedCapabilities && !forceRefresh) {
    return cachedCapabilities;
  }

  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  if (!isBrowser) {
    cachedCapabilities = {
      webgl: false,
      webgl2: false,
      webgpu: false,
      maxTextureSize: 0,
      maxAnisotropy: 0,
      floatTextures: false,
      isSupported: false,
      reducedMotion: false,
      devicePixelRatio: 1,
    };
    return cachedCapabilities;
  }

  let webgl = false;
  let webgl2 = false;
  let webgpu = false;
  let maxTextureSize = 2048;
  let maxAnisotropy = 1;
  let floatTextures = false;

  // Check WebGPU
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    webgpu = true;
  }

  // Check WebGL and WebGL2
  try {
    const canvas = document.createElement("canvas");

    // Try WebGL2 first
    const gl2 = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (gl2) {
      webgl2 = true;
      webgl = true;
      maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE) || 2048;
      const extAniso = gl2.getExtension("EXT_texture_filter_anisotropic");
      if (extAniso) {
        maxAnisotropy = gl2.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
      }
      floatTextures = true; // Core in WebGL2
    } else {
      // Fallback to WebGL1
      const gl = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (gl) {
        webgl = true;
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
        const extAniso = gl.getExtension("EXT_texture_filter_anisotropic");
        if (extAniso) {
          maxAnisotropy = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
        }
        floatTextures = !!gl.getExtension("OES_texture_float");
      }
    }
  } catch {
    // Canvas or context not permitted in environment
  }

  // Reduced motion preference
  let reducedMotion = false;
  try {
    if (typeof window.matchMedia === "function") {
      reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  } catch {
    // Ignore matchMedia errors
  }

  const dpr = typeof window.devicePixelRatio === "number" ? Math.max(1, window.devicePixelRatio) : 1;

  cachedCapabilities = {
    webgl,
    webgl2,
    webgpu,
    maxTextureSize,
    maxAnisotropy,
    floatTextures,
    isSupported: webgl || webgl2 || webgpu,
    reducedMotion,
    devicePixelRatio: dpr,
  };

  return cachedCapabilities;
}
