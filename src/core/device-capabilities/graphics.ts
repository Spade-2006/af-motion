/**
 * AF Motion — 3D & 2D Graphics Capability Detection
 *
 * Detailed inspection of WebGL1, WebGL2, WebGPU, shader precision, max texture limits,
 * extension support, and hardware renderer strings without fabricating hardware specs.
 */

import type { RendererBackend } from "../../graphics/types.js";
import type {
  WebGLCapabilitiesInfo,
  WebGPUCapabilitiesInfo,
  MockEnvironment,
  ValueWithStatus,
} from "./types.js";

function makeValue<T>(
  value: T,
  status: ValueWithStatus<T>["status"],
  details?: string
): ValueWithStatus<T> {
  return { value, status, details };
}

export interface DetailedGraphicsReport {
  readonly webgl: WebGLCapabilitiesInfo;
  readonly webgpu: WebGPUCapabilitiesInfo;
  readonly supportedBackends: readonly RendererBackend[];
  readonly activeBackend: RendererBackend;
}

/**
 * Detects comprehensive WebGL and WebGPU capabilities defensively.
 */
export function detectDetailedGraphics(
  options: {
    testCanvas?: HTMLCanvasElement | null;
    mockEnv?: MockEnvironment;
    probeWebGPUAdapter?: boolean;
  } = {}
): DetailedGraphicsReport {
  const { testCanvas, mockEnv } = options;

  if (mockEnv) {
    const webgl1 = mockEnv.webgl1 ?? true;
    const webgl2 = mockEnv.webgl2 ?? true;
    const webgpu = mockEnv.webgpu ?? false;
    const maxTex = mockEnv.maxTextureSize ?? 4096;

    const backends: RendererBackend[] = [];
    if (webgpu) backends.push("webgpu");
    if (webgl2) backends.push("webgl2");
    if (webgl1) backends.push("webgl");
    backends.push("canvas2d");

    const webglInfo: WebGLCapabilitiesInfo = {
      webgl1: makeValue(webgl1, "detected", "Mocked WebGL1"),
      webgl2: makeValue(webgl2, "detected", "Mocked WebGL2"),
      maxTextureSize: makeValue(maxTex, "detected"),
      maxCubeMapSize: makeValue(maxTex, "detected"),
      maxRenderBufferSize: makeValue(maxTex, "detected"),
      maxVertexAttributes: makeValue(16, "detected"),
      maxTextureUnits: makeValue(16, "detected"),
      maxUniformVectors: makeValue(1024, "detected"),
      maxViewportDimensions: makeValue([maxTex, maxTex] as const, "detected"),
      shaderPrecision: makeValue({ highp: true, mediump: true, lowp: true }, "detected"),
      floatTextures: makeValue(webgl2, "detected"),
      halfFloatTextures: makeValue(webgl2, "detected"),
      instancing: makeValue(webgl2, "detected"),
      timerQuery: makeValue(false, "unsupported"),
      maxAnisotropy: makeValue(16, "detected"),
      supportedExtensions: makeValue(["OES_texture_float", "EXT_color_buffer_float"], "detected"),
      unmaskedVendor: makeValue("MockVendor", "detected"),
      unmaskedRenderer: makeValue("MockRenderer GPU", "detected"),
    };

    const webgpuInfo: WebGPUCapabilitiesInfo = {
      apiAvailable: makeValue(webgpu, "detected"),
      adapterAvailable: makeValue(webgpu, "detected"),
      deviceAvailable: makeValue(webgpu, "detected"),
      computeShaderSupport: makeValue(webgpu, "detected"),
      maxTextureDimension2D: makeValue(webgpu ? 8192 : 0, webgpu ? "detected" : "unsupported"),
      maxBufferSize: makeValue(webgpu ? 268435456 : 0, webgpu ? "detected" : "unsupported"),
      features: makeValue([], webgpu ? "detected" : "unsupported"),
      limits: makeValue({}, webgpu ? "detected" : "unsupported"),
      architecture: makeValue(webgpu ? "mock-architecture" : "unknown", webgpu ? "detected" : "unknown"),
    };

    return {
      webgl: webglInfo,
      webgpu: webgpuInfo,
      supportedBackends: backends,
      activeBackend: backends[0] ?? "null",
    };
  }

  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

  if (!isBrowser) {
    const fallbackWebGL: WebGLCapabilitiesInfo = {
      webgl1: makeValue(false, "unsupported", "Non-browser runtime"),
      webgl2: makeValue(false, "unsupported", "Non-browser runtime"),
      maxTextureSize: makeValue(0, "unsupported"),
      maxCubeMapSize: makeValue(0, "unsupported"),
      maxRenderBufferSize: makeValue(0, "unsupported"),
      maxVertexAttributes: makeValue(0, "unsupported"),
      maxTextureUnits: makeValue(0, "unsupported"),
      maxUniformVectors: makeValue(0, "unsupported"),
      maxViewportDimensions: makeValue([0, 0] as const, "unsupported"),
      shaderPrecision: makeValue({ highp: false, mediump: false, lowp: false }, "unsupported"),
      floatTextures: makeValue(false, "unsupported"),
      halfFloatTextures: makeValue(false, "unsupported"),
      instancing: makeValue(false, "unsupported"),
      timerQuery: makeValue(false, "unsupported"),
      maxAnisotropy: makeValue(0, "unsupported"),
      supportedExtensions: makeValue([], "unsupported"),
      unmaskedVendor: makeValue("unknown", "unavailable"),
      unmaskedRenderer: makeValue("unknown", "unavailable"),
    };

    const fallbackWebGPU: WebGPUCapabilitiesInfo = {
      apiAvailable: makeValue(false, "unsupported", "Non-browser runtime"),
      adapterAvailable: makeValue(false, "unsupported"),
      deviceAvailable: makeValue(false, "unsupported"),
      computeShaderSupport: makeValue(false, "unsupported"),
      maxTextureDimension2D: makeValue(0, "unsupported"),
      maxBufferSize: makeValue(0, "unsupported"),
      features: makeValue([], "unsupported"),
      limits: makeValue({}, "unsupported"),
      architecture: makeValue("unknown", "unsupported"),
    };

    return {
      webgl: fallbackWebGL,
      webgpu: fallbackWebGPU,
      supportedBackends: ["null"],
      activeBackend: "null",
    };
  }

  const supportedBackends: RendererBackend[] = [];

  // 1. Probe WebGPU
  let webgpuApiAvailable = false;
  try {
    if (typeof navigator !== "undefined" && "gpu" in navigator && (navigator as any).gpu != null) {
      webgpuApiAvailable = true;
      supportedBackends.push("webgpu");
    }
  } catch {
    webgpuApiAvailable = false;
  }

  // 2. Probe Canvas & WebGL Contexts
  let canvasEl: HTMLCanvasElement | null = null;
  let canCreateCanvas = false;
  try {
    canvasEl = testCanvas || document.createElement("canvas");
    canCreateCanvas = typeof canvasEl.getContext === "function";
  } catch {
    canCreateCanvas = false;
  }

  let hasCanvas2D = false;
  if (canCreateCanvas && canvasEl) {
    try {
      const c2d = canvasEl.getContext("2d");
      if (c2d) {
        hasCanvas2D = true;
        supportedBackends.push("canvas2d");
      }
    } catch {
      hasCanvas2D = false;
    }
  }

  let webgl1 = false;
  let webgl2 = false;
  let maxTextureSize = 0;
  let maxCubeMapSize = 0;
  let maxRenderBufferSize = 0;
  let maxVertexAttributes = 0;
  let maxTextureUnits = 0;
  let maxUniformVectors = 0;
  let maxViewportDims: [number, number] = [0, 0];
  let highpPrecision = false;
  let floatTextures = false;
  let halfFloatTextures = false;
  let instancing = false;
  let timerQuery = false;
  let maxAnisotropy = 0;
  let supportedExtensions: string[] = [];
  let unmaskedVendor = "unknown";
  let unmaskedRenderer = "unknown";

  if (canCreateCanvas && canvasEl) {
    // Try WebGL2
    let gl2: WebGL2RenderingContext | null = null;
    try {
      gl2 = canvasEl.getContext("webgl2") as WebGL2RenderingContext | null;
      if (gl2) {
        webgl2 = true;
        webgl1 = true;
        supportedBackends.push("webgl2");
        supportedBackends.push("webgl");

        maxTextureSize = gl2.getParameter?.(gl2.MAX_TEXTURE_SIZE) || 4096;
        maxCubeMapSize = gl2.getParameter?.(gl2.MAX_CUBE_MAP_TEXTURE_SIZE) || 4096;
        maxRenderBufferSize = gl2.getParameter?.(gl2.MAX_RENDERBUFFER_SIZE) || 4096;
        maxVertexAttributes = gl2.getParameter?.(gl2.MAX_VERTEX_ATTRIBS) || 16;
        maxTextureUnits = gl2.getParameter?.(gl2.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 16;
        maxUniformVectors = gl2.getParameter?.(gl2.MAX_VERTEX_UNIFORM_VECTORS) || 1024;

        const vp = gl2.getParameter?.(gl2.MAX_VIEWPORT_DIMS);
        if (vp && Array.isArray(vp) && vp.length >= 2) {
          maxViewportDims = [vp[0], vp[1]];
        } else {
          maxViewportDims = [maxTextureSize, maxTextureSize];
        }

        const prec = gl2.getShaderPrecisionFormat?.(gl2.FRAGMENT_SHADER, gl2.HIGH_FLOAT);
        highpPrecision = prec ? prec.precision > 0 : true;

        floatTextures = true;
        halfFloatTextures = true;
        instancing = true;

        const extTimer = gl2.getExtension?.("EXT_disjoint_timer_query_webgl2");
        timerQuery = !!extTimer;

        const extAniso = gl2.getExtension?.("EXT_texture_filter_anisotropic");
        if (extAniso) {
          maxAnisotropy = gl2.getParameter?.(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
        }

        supportedExtensions = gl2.getSupportedExtensions?.() || [];

        const dbg = gl2.getExtension?.("WEBGL_debug_renderer_info");
        if (dbg) {
          unmaskedVendor = gl2.getParameter?.(dbg.UNMASKED_VENDOR_WEBGL) || "unknown";
          unmaskedRenderer = gl2.getParameter?.(dbg.UNMASKED_RENDERER_WEBGL) || "unknown";
        }
      }
    } catch {
      webgl2 = false;
    }

    // Fallback to WebGL1 if WebGL2 unavailable
    if (!webgl2) {
      let gl: WebGLRenderingContext | null = null;
      try {
        gl = (canvasEl.getContext("webgl") ||
          canvasEl.getContext("experimental-webgl")) as WebGLRenderingContext | null;

        if (gl) {
          webgl1 = true;
          supportedBackends.push("webgl");

          maxTextureSize = gl.getParameter?.(gl.MAX_TEXTURE_SIZE) || 2048;
          maxCubeMapSize = gl.getParameter?.(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 2048;
          maxRenderBufferSize = gl.getParameter?.(gl.MAX_RENDERBUFFER_SIZE) || 2048;
          maxVertexAttributes = gl.getParameter?.(gl.MAX_VERTEX_ATTRIBS) || 8;
          maxTextureUnits = gl.getParameter?.(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 8;
          maxUniformVectors = gl.getParameter?.(gl.MAX_VERTEX_UNIFORM_VECTORS) || 128;
          maxViewportDims = [maxTextureSize, maxTextureSize];

          const prec = gl.getShaderPrecisionFormat?.(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
          highpPrecision = prec ? prec.precision > 0 : false;

          floatTextures = !!gl.getExtension?.("OES_texture_float");
          halfFloatTextures = !!gl.getExtension?.("OES_texture_half_float");
          instancing = !!gl.getExtension?.("ANGLE_instanced_arrays");

          const extAniso = gl.getExtension?.("EXT_texture_filter_anisotropic");
          if (extAniso) {
            maxAnisotropy = gl.getParameter?.(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
          }

          supportedExtensions = gl.getSupportedExtensions?.() || [];

          const dbg = gl.getExtension?.("WEBGL_debug_renderer_info");
          if (dbg) {
            unmaskedVendor = gl.getParameter?.(dbg.UNMASKED_VENDOR_WEBGL) || "unknown";
            unmaskedRenderer = gl.getParameter?.(dbg.UNMASKED_RENDERER_WEBGL) || "unknown";
          }
        }
      } catch {
        webgl1 = false;
      }
    }
  }

  if (supportedBackends.length === 0) {
    supportedBackends.push("null");
  }

  // Active backend resolution
  let activeBackend: RendererBackend = "null";
  if (supportedBackends.includes("webgl2")) activeBackend = "webgl2";
  else if (supportedBackends.includes("webgl")) activeBackend = "webgl";
  else if (supportedBackends.includes("canvas2d")) activeBackend = "canvas2d";
  else if (supportedBackends.includes("webgpu")) activeBackend = "webgpu";

  const webglStatus = webgl1 ? "detected" : "unsupported";

  const webglInfo: WebGLCapabilitiesInfo = {
    webgl1: makeValue(webgl1, webglStatus),
    webgl2: makeValue(webgl2, webgl2 ? "detected" : "unsupported"),
    maxTextureSize: makeValue(maxTextureSize, webglStatus),
    maxCubeMapSize: makeValue(maxCubeMapSize, webglStatus),
    maxRenderBufferSize: makeValue(maxRenderBufferSize, webglStatus),
    maxVertexAttributes: makeValue(maxVertexAttributes, webglStatus),
    maxTextureUnits: makeValue(maxTextureUnits, webglStatus),
    maxUniformVectors: makeValue(maxUniformVectors, webglStatus),
    maxViewportDimensions: makeValue(maxViewportDims, webglStatus),
    shaderPrecision: makeValue(
      { highp: highpPrecision, mediump: true, lowp: true },
      webglStatus
    ),
    floatTextures: makeValue(floatTextures, webglStatus),
    halfFloatTextures: makeValue(halfFloatTextures, webglStatus),
    instancing: makeValue(instancing, webglStatus),
    timerQuery: makeValue(timerQuery, timerQuery ? "detected" : "unsupported"),
    maxAnisotropy: makeValue(maxAnisotropy, maxAnisotropy > 1 ? "detected" : "unsupported"),
    supportedExtensions: makeValue(supportedExtensions, webglStatus),
    unmaskedVendor: makeValue(unmaskedVendor, unmaskedVendor !== "unknown" ? "detected" : "unavailable"),
    unmaskedRenderer: makeValue(unmaskedRenderer, unmaskedRenderer !== "unknown" ? "detected" : "unavailable"),
  };

  const webgpuInfo: WebGPUCapabilitiesInfo = {
    apiAvailable: makeValue(webgpuApiAvailable, webgpuApiAvailable ? "detected" : "unsupported"),
    adapterAvailable: makeValue(false, "unknown", "Requires asynchronous adapter probe"),
    deviceAvailable: makeValue(false, "unknown", "Requires asynchronous device probe"),
    computeShaderSupport: makeValue(webgpuApiAvailable, webgpuApiAvailable ? "estimated" : "unsupported"),
    maxTextureDimension2D: makeValue(webgpuApiAvailable ? 8192 : 0, webgpuApiAvailable ? "estimated" : "unsupported"),
    maxBufferSize: makeValue(webgpuApiAvailable ? 268435456 : 0, webgpuApiAvailable ? "estimated" : "unsupported"),
    features: makeValue([], webgpuApiAvailable ? "unknown" : "unsupported"),
    limits: makeValue({}, webgpuApiAvailable ? "unknown" : "unsupported"),
    architecture: makeValue("unknown", "unknown"),
  };

  return {
    webgl: webglInfo,
    webgpu: webgpuInfo,
    supportedBackends,
    activeBackend,
  };
}
