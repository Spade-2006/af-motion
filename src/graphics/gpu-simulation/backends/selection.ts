/**
 * AF Motion GPU Simulation Architecture — Backend Selection & Factory
 *
 * Implements deterministic capability-based backend selection, explicit overrides,
 * and graceful fallback resolution across WebGPU, WebGL2, and CPU execution.
 */

import { detectComputeCapabilities } from "../capabilities.js";
import type {
  BackendSelectionOptions,
  ComputeBackend,
  ComputeBackendSelectionResult,
  ComputeBackendType,
  ComputeDeviceOptions,
} from "../types.js";
import { CPUComputeBackend } from "./cpu.js";
import { WebGL2ComputeBackend } from "./webgl2.js";
import { WebGPUComputeBackend } from "./webgpu.js";

/**
 * Evaluates device capabilities, canvas context, and options to select the optimal compute backend.
 */
export function selectComputeBackend(
  options: BackendSelectionOptions = {},
): ComputeBackendSelectionResult {
  const {
    preference = "auto",
    canvas,
    capabilities: providedCaps,
    requireFloatTextures = false,
    requireStorageBuffers = false,
  } = options;

  const caps = providedCaps || detectComputeCapabilities({ testCanvas: canvas });

  // 1. Explicit CPU request
  if (preference === "cpu") {
    return {
      backend: "cpu",
      isFallback: false,
      reason: "CPU simulation backend explicitly requested.",
    };
  }

  // 2. Explicit WebGPU request
  if (preference === "webgpu") {
    if (caps.webgpu) {
      return {
        backend: "webgpu",
        isFallback: false,
        reason: "Native WebGPU compute backend active.",
      };
    }
    // Cannot satisfy explicit WebGPU request
    return {
      backend: caps.webgl2 ? "webgl2" : "cpu",
      isFallback: true,
      reason: `WebGPU was requested but is unsupported on this device. Fell back to ${caps.webgl2 ? "WebGL2" : "CPU"}.`,
    };
  }

  // 3. Explicit WebGL2 request
  if (preference === "webgl2") {
    if (caps.webgl2) {
      if (requireFloatTextures && !caps.float32Textures) {
        return {
          backend: "cpu",
          isFallback: true,
          reason: "WebGL2 is supported but lacked required float textures (EXT_color_buffer_float). Fell back to CPU.",
        };
      }
      return {
        backend: "webgl2",
        isFallback: false,
        reason: "Hardware-accelerated WebGL2 GPGPU simulation active.",
      };
    }
    return {
      backend: "cpu",
      isFallback: true,
      reason: "WebGL2 was requested but is unsupported on this device. Fell back to CPU.",
    };
  }

  // 4. Automatic Selection ("auto")
  if (requireStorageBuffers && !caps.storageBuffers && caps.webgpu) {
    return {
      backend: "webgpu",
      isFallback: false,
      reason: "Native WebGPU compute selected for storage buffer support.",
    };
  }

  if (caps.webgpu && preference === "auto") {
    return {
      backend: "webgpu",
      isFallback: false,
      reason: "Native WebGPU compute backend automatically selected.",
    };
  }

  if (caps.webgl2) {
    if (!requireFloatTextures || caps.float32Textures) {
      return {
        backend: "webgl2",
        isFallback: false,
        reason: "Hardware-accelerated WebGL2 simulation automatically selected.",
      };
    }
  }

  return {
    backend: "cpu",
    isFallback: true,
    reason: "GPU hardware acceleration unavailable or lacks required extensions; fell back gracefully to deterministic CPU simulation.",
  };
}

/**
 * Creates a concrete compute backend instance matching the requested type.
 */
export function createComputeBackend(
  type: ComputeBackendType,
  options?: ComputeDeviceOptions,
): ComputeBackend {
  switch (type) {
    case "webgpu":
      return new WebGPUComputeBackend();
    case "webgl2":
      return new WebGL2ComputeBackend(options);
    case "cpu":
    default:
      return new CPUComputeBackend();
  }
}
