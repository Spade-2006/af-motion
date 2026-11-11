import type { CapabilityDetectionOptions, GraphicsCapabilities, RendererBackend } from "./types.js";

let cachedCapabilities: GraphicsCapabilities | null = null;

export const DEFAULT_FALLBACK_CAPABILITIES: GraphicsCapabilities = Object.freeze({
  supportedBackends: ["null"] as readonly RendererBackend[],
  activeBackend: "null",
  canvas: false,
  webgl: false,
  webgl2: false,
  webgpu: false,
  maxTextureSize: 0,
  dpr: 1,
  reducedMotion: false,
  colorSpace: "srgb",
  antialias: false,
  floatTextures: false,
  instancedArrays: false,
  powerPreference: "default",
});

/**
 * Detects graphics capabilities defensively and safely across browser,
 * node, SSR, and mock test environments without throwing or executing
 * unsupported browser APIs.
 */
export function detectGraphicsCapabilities(
  options: CapabilityDetectionOptions = {},
): GraphicsCapabilities {
  const {
    forceFallback = false,
    preferredBackend,
    targetDpr,
    testCanvas,
  } = options;

  // SSR / Node guard
  if (typeof window === "undefined" || typeof document === "undefined") {
    return DEFAULT_FALLBACK_CAPABILITIES;
  }

  // Return cached result if no custom options provided
  if (!forceFallback && !preferredBackend && !targetDpr && !testCanvas && cachedCapabilities) {
    return cachedCapabilities;
  }

  const dpr = typeof targetDpr === "number" && targetDpr > 0
    ? targetDpr
    : typeof window.devicePixelRatio === "number" && !isNaN(window.devicePixelRatio)
      ? Math.max(1, window.devicePixelRatio)
      : 1;

  let reducedMotion = false;
  try {
    if (typeof window.matchMedia === "function") {
      reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  } catch {
    reducedMotion = false;
  }

  let canvas = false;
  let webgl = false;
  let webgl2 = false;
  let webgpu = false;
  let maxTextureSize = 0;
  let antialias = true;
  let floatTextures = false;
  let instancedArrays = false;

  const supportedBackends: RendererBackend[] = [];

  // Check WebGPU availability on navigator (defensive)
  try {
    if (typeof navigator !== "undefined" && "gpu" in navigator && (navigator as { gpu?: unknown }).gpu != null) {
      webgpu = true;
      supportedBackends.push("webgpu");
    }
  } catch {
    webgpu = false;
  }

  // Test canvas and contexts
  let canvasEl: HTMLCanvasElement | null = null;
  try {
    canvasEl = testCanvas || document.createElement("canvas");
    canvas = typeof canvasEl.getContext === "function";
  } catch {
    canvas = false;
  }

  if (canvas && canvasEl) {
    // 1. Canvas2D
    try {
      const ctx2d = canvasEl.getContext("2d");
      if (ctx2d) {
        supportedBackends.push("canvas2d");
      }
    } catch {
      // In some environments, getContext("2d") may throw or be unimplemented
    }

    // Canvas2D is universally supported by the HTML5 canvas specification in browser environments
    if (!supportedBackends.includes("canvas2d")) {
      supportedBackends.push("canvas2d");
    }

    // 2. WebGL2
    let gl2: WebGL2RenderingContext | null = null;
    try {
      gl2 = canvasEl.getContext("webgl2") as WebGL2RenderingContext | null;
      if (gl2) {
        webgl2 = true;
        webgl = true;
        supportedBackends.push("webgl2");
        if (!supportedBackends.includes("webgl")) {
          supportedBackends.push("webgl");
        }
        maxTextureSize = gl2.getParameter?.(gl2.MAX_TEXTURE_SIZE) || 4096;
        floatTextures = true;
        instancedArrays = true;
      }
    } catch {
      webgl2 = false;
    }

    // 3. WebGL1
    if (!webgl2) {
      let gl: WebGLRenderingContext | null = null;
      try {
        gl = (canvasEl.getContext("webgl") ||
          canvasEl.getContext("experimental-webgl")) as WebGLRenderingContext | null;
        if (gl) {
          webgl = true;
          supportedBackends.push("webgl");
          maxTextureSize = gl.getParameter?.(gl.MAX_TEXTURE_SIZE) || 2048;
          floatTextures = !!gl.getExtension?.("OES_texture_float");
          instancedArrays = !!gl.getExtension?.("ANGLE_instanced_arrays");
        }
      } catch {
        webgl = false;
      }
    }
  }

  // If no backends available, fallback to null
  if (supportedBackends.length === 0) {
    supportedBackends.push("null");
  }

  // Resolve active backend
  let activeBackend: RendererBackend = "null";
  if (forceFallback) {
    activeBackend = supportedBackends.includes("canvas2d") ? "canvas2d" : "null";
  } else if (preferredBackend && supportedBackends.includes(preferredBackend)) {
    activeBackend = preferredBackend;
  } else if (supportedBackends.includes("webgl2")) {
    activeBackend = "webgl2";
  } else if (supportedBackends.includes("webgl")) {
    activeBackend = "webgl";
  } else if (supportedBackends.includes("canvas2d")) {
    activeBackend = "canvas2d";
  } else if (supportedBackends.includes("webgpu")) {
    activeBackend = "webgpu";
  } else {
    activeBackend = "null";
  }

  const result: GraphicsCapabilities = Object.freeze({
    supportedBackends: Object.freeze(supportedBackends),
    activeBackend,
    canvas,
    webgl,
    webgl2,
    webgpu,
    maxTextureSize: maxTextureSize || (canvas ? 4096 : 0),
    dpr,
    reducedMotion,
    colorSpace: "srgb",
    antialias,
    floatTextures,
    instancedArrays,
    powerPreference: "default",
  });

  if (!forceFallback && !preferredBackend && !targetDpr && !testCanvas) {
    cachedCapabilities = result;
  }

  return result;
}

/**
 * Resets cached capabilities. Useful for unit testing or when device context changes.
 */
export function resetCachedGraphicsCapabilities(): void {
  cachedCapabilities = null;
}
