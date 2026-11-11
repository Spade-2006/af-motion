/**
 * AF Motion GPU Simulation Architecture — Deterministic CPU Compute Backend
 *
 * Implements a framework-independent, hardware-independent CPU simulation backend
 * backed by typed arrays and pure kernel functions. Ensures graceful fallback in SSR,
 * Node.js, and unsupported GPU environments.
 */

import { DEFAULT_FALLBACK_COMPUTE_CAPABILITIES } from "../capabilities.js";
import type {
  ComputeBinding,
  ComputeBindingLayout,
  ComputeBindGroup,
  ComputeBuffer,
  ComputeBufferDescriptor,
  ComputeBufferUsage,
  ComputeCapabilities,
  ComputeDispatchConfig,
  ComputePipeline,
  ComputePipelineDescriptor,
  ComputeResourceManager,
  ComputeTexture,
  ComputeTextureDescriptor,
  ComputeTextureFormat,
  ComputeTextureUsage,
  CPUComputeContext,
  CPUShaderKernel,
} from "../types.js";
import { BaseComputeBackend, getBytesPerPixel } from "./backend.js";

class CPUComputeBuffer implements ComputeBuffer {
  readonly id: string;
  readonly size: number;
  readonly usage: readonly ComputeBufferUsage[];
  readonly label?: string;
  data: Uint8Array;
  private disposed = false;

  constructor(descriptor: ComputeBufferDescriptor, id: string) {
    this.id = id;
    this.size = descriptor.size;
    this.usage = Array.isArray(descriptor.usage) ? [...descriptor.usage] : [descriptor.usage];
    this.label = descriptor.label;
    this.data = new Uint8Array(descriptor.size);

    if (descriptor.initialData) {
      const src =
        descriptor.initialData instanceof ArrayBuffer
          ? new Uint8Array(descriptor.initialData)
          : new Uint8Array(
              descriptor.initialData.buffer,
              descriptor.initialData.byteOffset,
              descriptor.initialData.byteLength,
            );
      this.data.set(src.subarray(0, this.size));
    }
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  write(data: ArrayBufferView | ArrayBuffer, offset = 0): void {
    if (this.disposed) return;
    const src =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const target = this.data.subarray(offset, offset + src.byteLength);
    target.set(src.subarray(0, target.length));
  }

  read(): ArrayBufferView {
    if (this.disposed) {
      return new Uint8Array(0);
    }
    // Return a copy of the buffer data
    return new Uint8Array(this.data.slice().buffer);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.data = new Uint8Array(0);
  }
}

class CPUComputeTexture implements ComputeTexture {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly format: ComputeTextureFormat;
  readonly usage: readonly ComputeTextureUsage[];
  readonly label?: string;
  data: Float32Array | Uint8Array;
  private disposed = false;

  constructor(descriptor: ComputeTextureDescriptor, id: string) {
    this.id = id;
    this.width = descriptor.width;
    this.height = descriptor.height;
    this.depth = descriptor.depth || 1;
    this.format = descriptor.format || "rgba32float";
    this.usage = Array.isArray(descriptor.usage) ? [...descriptor.usage] : [descriptor.usage || "storage"];
    this.label = descriptor.label;

    const bpp = getBytesPerPixel(this.format);
    const totalPixels = this.width * this.height * this.depth;

    if (this.format === "rgba8unorm") {
      this.data = new Uint8Array(totalPixels * 4);
    } else {
      // Float formats
      const floatsPerPixel = bpp / 4;
      this.data = new Float32Array(totalPixels * floatsPerPixel);
    }

    if (descriptor.initialData) {
      const src =
        descriptor.initialData instanceof Float32Array
          ? descriptor.initialData
          : new Float32Array(
              descriptor.initialData.buffer,
              descriptor.initialData.byteOffset,
              descriptor.initialData.byteLength / 4,
            );
      if (this.data instanceof Float32Array) {
        this.data.set(src.subarray(0, this.data.length));
      }
    }
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  write(data: ArrayBufferView, offset?: { x?: number; y?: number; z?: number }): void {
    if (this.disposed) return;
    // In CPU implementation, write sequentially into data array
    const offsetElements = offset ? ((offset.y || 0) * this.width + (offset.x || 0)) * 4 : 0;
    if (this.data instanceof Float32Array && data instanceof Float32Array) {
      this.data.set(data.subarray(0, this.data.length - offsetElements), offsetElements);
    } else {
      const src = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      const target = new Uint8Array(this.data.buffer, this.data.byteOffset + offsetElements);
      target.set(src.subarray(0, target.length));
    }
  }

  read(): ArrayBufferView {
    if (this.disposed) {
      return new Float32Array(0);
    }
    return this.data.slice();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.data = new Float32Array(0);
  }
}

class CPUComputePipeline implements ComputePipeline {
  readonly id: string;
  readonly descriptor: ComputePipelineDescriptor;
  private disposed = false;

  constructor(descriptor: ComputePipelineDescriptor, id: string) {
    this.id = id;
    this.descriptor = descriptor;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  dispose(): void {
    this.disposed = true;
  }
}

class CPUComputeBindGroup implements ComputeBindGroup {
  readonly id: string;
  readonly bindings: readonly ComputeBinding[];
  private disposed = false;

  constructor(bindings: readonly ComputeBinding[], id: string) {
    this.id = id;
    this.bindings = [...bindings];
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  dispose(): void {
    this.disposed = true;
  }
}

export class CPUComputeBackend extends BaseComputeBackend {
  readonly type = "cpu" as const;
  readonly capabilities: ComputeCapabilities = DEFAULT_FALLBACK_COMPUTE_CAPABILITIES;
  private sequence = 0;

  init(): void {
    // Synchronous deterministic init
  }

  createBuffer(descriptor: ComputeBufferDescriptor, resourceManager: ComputeResourceManager): ComputeBuffer {
    const id = descriptor.id || `cpu_buf_${++this.sequence}`;
    const buffer = new CPUComputeBuffer(descriptor, id);
    resourceManager.register("buffer", buffer, descriptor.size, descriptor.label);
    return buffer;
  }

  createTexture(descriptor: ComputeTextureDescriptor, resourceManager: ComputeResourceManager): ComputeTexture {
    const id = descriptor.id || `cpu_tex_${++this.sequence}`;
    const texture = new CPUComputeTexture(descriptor, id);
    const bpp = getBytesPerPixel(texture.format);
    const byteSize = texture.width * texture.height * texture.depth * bpp;
    resourceManager.register("texture", texture, byteSize, descriptor.label);
    return texture;
  }

  createPipeline(descriptor: ComputePipelineDescriptor, resourceManager: ComputeResourceManager): ComputePipeline {
    const id = descriptor.id || `cpu_pipe_${++this.sequence}`;
    const pipeline = new CPUComputePipeline(descriptor, id);
    resourceManager.register("pipeline", pipeline, 0, descriptor.label);
    return pipeline;
  }

  createBindGroup(
    _layout: readonly ComputeBindingLayout[],
    bindings: readonly ComputeBinding[],
    resourceManager: ComputeResourceManager,
  ): ComputeBindGroup {
    const id = `cpu_bg_${++this.sequence}`;
    const bg = new CPUComputeBindGroup(bindings, id);
    resourceManager.register("bind-group", bg, 0);
    return bg;
  }

  dispatch(pipeline: ComputePipeline, bindGroup: ComputeBindGroup, config: ComputeDispatchConfig): void {
    if (this.isLost || pipeline.isDisposed || bindGroup.isDisposed) return;

    const kernel = pipeline.descriptor.shader.source;
    if (typeof kernel !== "function") {
      // In GLSL or WGSL on CPU, if no JS kernel is provided, no-op gracefully
      return;
    }

    const workgroupsX = Math.max(1, config.workgroupsX);
    const workgroupsY = Math.max(1, config.workgroupsY || 1);
    const workgroupsZ = Math.max(1, config.workgroupsZ || 1);
    const workgroupSize = pipeline.descriptor.shader.workgroupSize || [1, 1, 1];
    const totalInvocations =
      workgroupsX * workgroupsY * workgroupsZ * workgroupSize[0] * workgroupSize[1] * workgroupSize[2];

    // Extract buffers & textures from bind group
    const buffers: Record<number, ArrayBufferView> = {};
    const textures: Record<number, { width: number; height: number; data: Float32Array | Uint8Array }> = {};

    for (const b of bindGroup.bindings) {
      if ("write" in b.resource && "width" in b.resource) {
        // Texture
        const tex = b.resource as CPUComputeTexture;
        textures[b.binding] = {
          width: tex.width,
          height: tex.height,
          data: tex.data,
        };
      } else if ("write" in b.resource && "size" in b.resource) {
        // Buffer
        const buf = b.resource as CPUComputeBuffer;
        buffers[b.binding] = buf.data;
      }
    }

    const uniforms = Object.freeze(config.uniforms || {});

    // Deterministic sequential CPU dispatch
    let invocationIndex = 0;
    for (let gz = 0; gz < workgroupsZ; gz++) {
      for (let gy = 0; gy < workgroupsY; gy++) {
        for (let gx = 0; gx < workgroupsX; gx++) {
          const context: CPUComputeContext = {
            invocationIndex,
            workgroupIndex: [gx, gy, gz],
            totalInvocations,
            uniforms,
            buffers,
            textures,
          };
          kernel(context);
          invocationIndex++;
        }
      }
    }
  }

  dispose(): void {
    this.lost = true;
    this.lostListeners.clear();
    this.restoredListeners.clear();
  }
}
