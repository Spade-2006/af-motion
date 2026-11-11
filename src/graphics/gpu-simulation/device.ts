/**
 * AF Motion GPU Simulation Architecture — Compute Device
 *
 * Implements the core ComputeDevice abstraction managing compute backends,
 * memory-budgeted resource tracking, lifecycle hooks, and safe backend fallback.
 */

import { createComputeBackend, selectComputeBackend } from "./backends/selection.js";
import { createComputeResourceManager } from "./resource-manager.js";
import type {
  ComputeBackend,
  ComputeBackendType,
  ComputeBinding,
  ComputeBindingLayout,
  ComputeBindGroup,
  ComputeBuffer,
  ComputeBufferDescriptor,
  ComputeCapabilities,
  ComputeDevice,
  ComputeDeviceOptions,
  ComputeDispatchConfig,
  ComputePipeline,
  ComputePipelineDescriptor,
  ComputeResourceManager,
  ComputeTexture,
  ComputeTextureDescriptor,
} from "./types.js";

class ComputeDeviceImpl implements ComputeDevice {
  readonly backend: ComputeBackendType;
  readonly capabilities: ComputeCapabilities;
  readonly resourceManager: ComputeResourceManager;
  readonly canvas: HTMLCanvasElement | null;
  private readonly computeBackend: ComputeBackend;
  private disposed = false;

  constructor(
    computeBackend: ComputeBackend,
    resourceManager: ComputeResourceManager,
    canvas: HTMLCanvasElement | null = null,
  ) {
    this.computeBackend = computeBackend;
    this.backend = computeBackend.type;
    this.capabilities = computeBackend.capabilities;
    this.resourceManager = resourceManager;
    this.canvas = canvas;

    // Connect backend context lost/restored to resource manager
    computeBackend.onDeviceLost(() => {
      this.resourceManager.handleContextLost();
    });
    computeBackend.onDeviceRestored(() => {
      this.resourceManager.handleContextRestored();
    });
  }

  get isLost(): boolean {
    return this.computeBackend.isLost;
  }

  createBuffer(descriptor: ComputeBufferDescriptor): ComputeBuffer {
    if (this.disposed) throw new Error("Cannot create buffer on disposed ComputeDevice");
    return this.computeBackend.createBuffer(descriptor, this.resourceManager);
  }

  createTexture(descriptor: ComputeTextureDescriptor): ComputeTexture {
    if (this.disposed) throw new Error("Cannot create texture on disposed ComputeDevice");
    return this.computeBackend.createTexture(descriptor, this.resourceManager);
  }

  createPipeline(descriptor: ComputePipelineDescriptor): ComputePipeline {
    if (this.disposed) throw new Error("Cannot create pipeline on disposed ComputeDevice");
    return this.computeBackend.createPipeline(descriptor, this.resourceManager);
  }

  createBindGroup(
    layout: readonly ComputeBindingLayout[],
    bindings: readonly ComputeBinding[],
  ): ComputeBindGroup {
    if (this.disposed) throw new Error("Cannot create bind group on disposed ComputeDevice");
    return this.computeBackend.createBindGroup(layout, bindings, this.resourceManager);
  }

  dispatch(
    pipeline: ComputePipeline,
    bindGroup: ComputeBindGroup,
    config: ComputeDispatchConfig,
  ): void {
    if (this.disposed || this.isLost) return;
    this.computeBackend.dispatch(pipeline, bindGroup, config);
  }

  onDeviceLost(listener: (reason: string) => void): () => void {
    return this.computeBackend.onDeviceLost(listener);
  }

  onDeviceRestored(listener: () => void): () => void {
    return this.computeBackend.onDeviceRestored(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resourceManager.disposeAll();
    this.computeBackend.dispose();
  }
}

/**
 * Creates and initializes a framework-independent ComputeDevice.
 * If GPU initialization fails, automatically falls back to CPU simulation.
 */
export async function createComputeDeviceAsync(
  options: ComputeDeviceOptions = {},
): Promise<ComputeDevice> {
  const selection = selectComputeBackend({
    preference: options.backend,
    canvas: options.canvas,
  });

  const resourceManager = createComputeResourceManager({
    maxMemoryBytes: options.memoryLimitBytes,
  });

  let targetBackendType: ComputeBackendType = selection.backend;
  let backend: ComputeBackend;

  try {
    backend = createComputeBackend(targetBackendType, options);
    await backend.init(options);
  } catch (err) {
    console.warn(`[AF Motion Compute] Failed to initialize ${targetBackendType} backend:`, err);
    // Graceful fallback chain: WebGPU -> WebGL2 -> CPU
    if (targetBackendType === "webgpu") {
      try {
        targetBackendType = "webgl2";
        backend = createComputeBackend("webgl2", options);
        await backend.init(options);
      } catch {
        targetBackendType = "cpu";
        backend = createComputeBackend("cpu", options);
        backend.init(options);
      }
    } else {
      targetBackendType = "cpu";
      backend = createComputeBackend("cpu", options);
      backend.init(options);
    }
  }

  return new ComputeDeviceImpl(backend, resourceManager, options.canvas || null);
}

/**
 * Synchronous variant of createComputeDevice. Uses WebGL2 or CPU backend immediately.
 * If WebGPU is requested, falls back to WebGL2 or CPU synchronously, or use createComputeDeviceAsync for native async WebGPU.
 */
export function createComputeDevice(options: ComputeDeviceOptions = {}): ComputeDevice {
  const selection = selectComputeBackend({
    preference: options.backend === "webgpu" ? "webgl2" : options.backend,
    canvas: options.canvas,
  });

  const resourceManager = createComputeResourceManager({
    maxMemoryBytes: options.memoryLimitBytes,
  });

  let targetBackendType: ComputeBackendType = selection.backend;
  let backend: ComputeBackend;

  try {
    backend = createComputeBackend(targetBackendType, options);
    backend.init(options);
  } catch (err) {
    console.warn(`[AF Motion Compute] Failed to initialize ${targetBackendType} backend:`, err);
    targetBackendType = "cpu";
    backend = createComputeBackend("cpu", options);
    backend.init(options);
  }

  return new ComputeDeviceImpl(backend, resourceManager, options.canvas || null);
}
