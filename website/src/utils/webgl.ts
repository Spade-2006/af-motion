/**
 * WebGL and Canvas 3D Environment Detection Utility
 */

export interface WebGLSupportInfo {
  readonly supported: boolean;
  readonly isWebGL2: boolean;
  readonly renderer?: string;
  readonly vendor?: string;
}

export function detectWebGLSupport(): WebGLSupportInfo {
  if (typeof window === "undefined" || !window.document) {
    return { supported: false, isWebGL2: false };
  }

  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    if (gl2) {
      const debugInfo = gl2.getExtension("WEBGL_debug_renderer_info");
      const info: WebGLSupportInfo = {
        supported: true,
        isWebGL2: true,
        renderer: debugInfo ? gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "WebGL 2.0",
        vendor: debugInfo ? gl2.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : "Hardware",
      };
      gl2.getExtension("WEBGL_lose_context")?.loseContext();
      return info;
    }

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      (gl as WebGLRenderingContext).getExtension?.("WEBGL_lose_context")?.loseContext();
      return {
        supported: true,
        isWebGL2: false,
        renderer: "WebGL 1.0",
        vendor: "Hardware",
      };
    }
  } catch {
    // Canvas context creation blocked or unsupported
  }

  return { supported: false, isWebGL2: false };
}
