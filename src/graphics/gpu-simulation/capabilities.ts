/**
 * AF Motion GPU Simulation Architecture — Capability Detection
 *
 * Integrates existing device capability intelligence while probing WebGL2 and WebGPU
 * compute and texture simulation limits without throwing or triggering browser warnings.
 */

import { detectGraphicsCapabilities } from "../capabilities.js";
import type {
  ComputeBackendType,
  ComputeCapabilityOptions,
  ComputeCapabilities,
  ComputeTextureFormat,
} from "./types.js";

let cachedComputeCapabilities: ComputeCapabilities | null = null;

export const DEFAULT_FALLBACK_COMPUTE_CAPABILITIES: ComputeCapabilities = Object.freeze({
  backend: "cpu",
  webgpu: false,
  webgl2: false,
  float32Textures: false,
  float16Textures: false,
  storageBuffers: false,
  computeShaders: false,
  maxTextureDimension: 2048,
  maxBufferSize: 64 * 1024 * 1024, // 64 MB
  maxComputeWorkgroupSize: Object.freeze([256, 256, 64] as [number, number, number]),
  maxComputeInvocationsPerWorkgroup: 256,
  maxComputeWorkgroupsPerDimension: Object.freeze([65535, 65535, 65535] as [number, number, number]),
  supportedFormats: Object.freeze(["rgba8unorm"] as ComputeTextureFormat[]),
  deviceLossRestorationSupported: true,
});

/**
 * Detects GPU compute capabilities defensively across browser, node, SSR,
 * and headless test environments.
 */
export function detectComputeCapabilities(
  options: ComputeCapabilityOptions = {},
): ComputeCapabilities {
  const { forceBackend, testCanvas, forceFallback = false } = options;

  // SSR / Node guard
  if (typeof window === "undefined" || typeof document === "undefined" || forceFallback) {
    if (forceBackend && forceBackend !== "auto") {
      return Object.freeze({
        ...DEFAULT_FALLBACK_COMPUTE_CAPABILITIES,
        backend: forceBackend,
      });
    }
    return DEFAULT_FALLBACK_COMPUTE_CAPABILITIES;
  }

  if (!forceBackend && !testCanvas && cachedComputeCapabilities) {
    return cachedComputeCapabilities;
  }

  // Reuse existing graphics capability probe
  const baseCaps = detectGraphicsCapabilities({ testCanvas });

  let webgpu = false;
  let webgl2 = false;
  let float32Textures = false;
  let float16Textures = false;
  let storageBuffers = false;
  let computeShaders = false;
  let maxTextureDimension = 2048;
  let maxBufferSize = 64 * 1024 * 1024;
  let maxComputeWorkgroupSize: readonly [number, number, number] = [256, 256, 64];
  let maxComputeInvocationsPerWorkgroup = 256;
  let maxComputeWorkgroupsPerDimension: readonly [number, number, number] = [65535, 65535, 65535];
  const supportedFormats: ComputeTextureFormat[] = ["rgba8unorm"];

  // 1. Probe WebGPU
  try {
    if (typeof navigator !== "undefined" && "gpu" in navigator && (navigator as { gpu?: unknown }).gpu != null) {
      webgpu = true;
      computeShaders = true;
      storageBuffers = true;
      float32Textures = true;
      float16Textures = true;
      supportedFormats.push("rgba32float", "rgba16float", "r32float", "rg32float");
      maxTextureDimension = 8192;
      maxBufferSize = 256 * 1024 * 1024;
    }
  } catch {
    webgpu = false;
  }

  // 2. Probe WebGL2
  let canvasEl: HTMLCanvasElement | null = null;
  try {
    canvasEl = testCanvas || document.createElement("canvas");
    if (canvasEl && typeof canvasEl.getContext === "function") {
      const gl2 = canvasEl.getContext("webgl2") as WebGL2RenderingContext | null;
      if (gl2) {
        webgl2 = true;
        const maxTex = gl2.getParameter?.(gl2.MAX_TEXTURE_SIZE);
        if (typeof maxTex === "number" && maxTex > 0) {
          maxTextureDimension = Math.max(maxTextureDimension, maxTex);
        }

        // Check color buffer float extension for WebGL2 FBO simulation
        const extFloat = gl2.getExtension("EXT_color_buffer_float");
        if (extFloat) {
          float32Textures = true;
          supportedFormats.push("rgba32float", "r32float", "rg32float");
        }

        const extHalfFloat = gl2.getExtension("EXT_color_buffer_half_float");
        if (extHalfFloat || extFloat) {
          float16Textures = true;
          supportedFormats.push("rgba16float");
        }
      }
    }
  } catch {
    webgl2 = false;
  }

  // Fallback to baseCaps if available
  if (baseCaps.webgl2) {
    webgl2 = true;
    if (baseCaps.floatTextures) {
      float32Textures = true;
      if (!supportedFormats.includes("rgba32float")) supportedFormats.push("rgba32float");
    }
  }

  // Resolve target backend
  let backend: ComputeBackendType = "cpu";
  if (forceBackend && forceBackend !== "auto") {
    backend = forceBackend;
  } else if (webgpu) {
    backend = "webgpu";
  } else if (webgl2 && float32Textures) {
    backend = "webgl2";
  } else {
    backend = "cpu";
  }

  const result: ComputeCapabilities = Object.freeze({
    backend,
    webgpu,
    webgl2,
    float32Textures,
    float16Textures,
    storageBuffers,
    computeShaders,
    maxTextureDimension,
    maxBufferSize,
    maxComputeWorkgroupSize: Object.freeze(maxComputeWorkgroupSize),
    maxComputeInvocationsPerWorkgroup,
    maxComputeWorkgroupsPerDimension: Object.freeze(maxComputeWorkgroupsPerDimension),
    supportedFormats: Object.freeze([...new Set(supportedFormats)]),
    deviceLossRestorationSupported: true,
  });

  if (!forceBackend && !testCanvas) {
    cachedComputeCapabilities = result;
  }

  return result;
}

export function resetCachedComputeCapabilities(): void {
  cachedComputeCapabilities = null;
}
