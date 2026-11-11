/**
 * AF Motion GPU Simulation Architecture — WebGL2 GPGPU Backend
 *
 * Implements GPU-accelerated simulation via WebGL2 textures, framebuffers,
 * full-screen quad fragment passes, and ping-pong state evolution.
 */

import { detectComputeCapabilities } from "../capabilities.js";
import { createWebGL2SimulationProgram } from "../shaders.js";
import type {
  ComputeBinding,
  ComputeBindingLayout,
  ComputeBindGroup,
  ComputeBuffer,
  ComputeBufferDescriptor,
  ComputeBufferUsage,
  ComputeCapabilities,
  ComputeDeviceOptions,
  ComputeDispatchConfig,
  ComputePipeline,
  ComputePipelineDescriptor,
  ComputeResourceManager,
  ComputeTexture,
  ComputeTextureDescriptor,
  ComputeTextureFormat,
  ComputeTextureUsage,
} from "../types.js";
import { BaseComputeBackend, getBytesPerPixel } from "./backend.js";

class WebGL2ComputeBuffer implements ComputeBuffer {
  readonly id: string;
  readonly size: number;
  readonly usage: readonly ComputeBufferUsage[];
  readonly label?: string;
  readonly glBuffer: WebGLBuffer | null;
  private gl: WebGL2RenderingContext | null;
  private disposed = false;

  constructor(
    gl: WebGL2RenderingContext,
    descriptor: ComputeBufferDescriptor,
    id: string,
  ) {
    this.gl = gl;
    this.id = id;
    this.size = descriptor.size;
    this.usage = Array.isArray(descriptor.usage) ? [...descriptor.usage] : [descriptor.usage];
    this.label = descriptor.label;
    this.glBuffer = gl.createBuffer();

    if (this.glBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
      if (descriptor.initialData) {
        gl.bufferData(gl.ARRAY_BUFFER, descriptor.initialData, gl.DYNAMIC_DRAW);
      } else {
        gl.bufferData(gl.ARRAY_BUFFER, descriptor.size, gl.DYNAMIC_DRAW);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  write(data: ArrayBufferView | ArrayBuffer, offset = 0): void {
    if (this.disposed || !this.gl || !this.glBuffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
    if (data instanceof ArrayBuffer) {
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset, new Uint8Array(data));
    } else {
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset, data);
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  read(): ArrayBufferView {
    if (this.disposed || !this.gl || !this.glBuffer) {
      return new Uint8Array(0);
    }
    const out = new Uint8Array(this.size);
    try {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
      this.gl.getBufferSubData(this.gl.ARRAY_BUFFER, 0, out);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    } catch {
      // In WebGL2 without readback support or mock
    }
    return out;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.gl && this.glBuffer) {
      try {
        this.gl.deleteBuffer(this.glBuffer);
      } catch {
        // Safe context loss
      }
    }
    this.gl = null;
  }
}

class WebGL2ComputeTexture implements ComputeTexture {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly format: ComputeTextureFormat;
  readonly usage: readonly ComputeTextureUsage[];
  readonly label?: string;
  readonly glTex: WebGLTexture | null;
  private gl: WebGL2RenderingContext | null;
  private disposed = false;

  constructor(
    gl: WebGL2RenderingContext,
    descriptor: ComputeTextureDescriptor,
    id: string,
  ) {
    this.gl = gl;
    this.id = id;
    this.width = descriptor.width;
    this.height = descriptor.height;
    this.depth = descriptor.depth || 1;
    this.format = descriptor.format || "rgba32float";
    this.usage = Array.isArray(descriptor.usage) ? [...descriptor.usage] : [descriptor.usage || "storage"];
    this.label = descriptor.label;
    this.glTex = gl.createTexture();

    if (this.glTex) {
      gl.bindTexture(gl.TEXTURE_2D, this.glTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      let internalFormat: number = gl.RGBA8;
      let format: number = gl.RGBA;
      let type: number = gl.UNSIGNED_BYTE;

      if (this.format === "rgba32float") {
        internalFormat = gl.RGBA32F;
        format = gl.RGBA;
        type = gl.FLOAT;
      } else if (this.format === "rgba16float") {
        internalFormat = gl.RGBA16F;
        format = gl.RGBA;
        type = gl.HALF_FLOAT;
      } else if (this.format === "r32float") {
        internalFormat = gl.R32F;
        format = gl.RED;
        type = gl.FLOAT;
      } else if (this.format === "rg32float") {
        internalFormat = gl.RG32F;
        format = gl.RG;
        type = gl.FLOAT;
      }

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        this.width,
        this.height,
        0,
        format,
        type,
        descriptor.initialData || null,
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  write(data: ArrayBufferView, offset?: { x?: number; y?: number; z?: number }): void {
    if (this.disposed || !this.gl || !this.glTex) return;
    this.gl.bindTexture(gl2(this.gl).TEXTURE_2D, this.glTex);
    const x = offset?.x || 0;
    const y = offset?.y || 0;

    let format: number = this.gl.RGBA;
    let type: number = this.gl.FLOAT;
    if (this.format === "rgba8unorm") {
      type = this.gl.UNSIGNED_BYTE;
    } else if (this.format === "r32float") {
      format = this.gl.RED;
    }

    try {
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        x,
        y,
        this.width,
        this.height,
        format,
        type,
        data,
      );
    } catch {
      // Ignore in mock environment
    }
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  read(): ArrayBufferView {
    if (this.disposed || !this.gl || !this.glTex) {
      return new Float32Array(0);
    }
    const fbo = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.glTex,
      0,
    );

    const bpp = getBytesPerPixel(this.format);
    const totalBytes = this.width * this.height * bpp;
    const out = this.format === "rgba8unorm" ? new Uint8Array(totalBytes) : new Float32Array(totalBytes / 4);

    try {
      this.gl.readPixels(
        0,
        0,
        this.width,
        this.height,
        this.gl.RGBA,
        this.format === "rgba8unorm" ? this.gl.UNSIGNED_BYTE : this.gl.FLOAT,
        out,
      );
    } catch {
      // ReadPixels fallback in mock/headless
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.deleteFramebuffer(fbo);
    return out;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.gl && this.glTex) {
      try {
        this.gl.deleteTexture(this.glTex);
      } catch {
        // Safe context loss
      }
    }
    this.gl = null;
  }
}

function gl2(gl: WebGL2RenderingContext): WebGL2RenderingContext {
  return gl;
}

class WebGL2ComputePipeline implements ComputePipeline {
  readonly id: string;
  readonly descriptor: ComputePipelineDescriptor;
  readonly program: WebGLProgram | null;
  private gl: WebGL2RenderingContext | null;
  private disposed = false;

  constructor(
    gl: WebGL2RenderingContext,
    descriptor: ComputePipelineDescriptor,
    program: WebGLProgram | null,
    id: string,
  ) {
    this.gl = gl;
    this.descriptor = descriptor;
    this.program = program;
    this.id = id;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.gl && this.program) {
      try {
        this.gl.deleteProgram(this.program);
      } catch {
        // Safe context loss
      }
    }
    this.gl = null;
  }
}

class WebGL2ComputeBindGroup implements ComputeBindGroup {
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

export class WebGL2ComputeBackend extends BaseComputeBackend {
  readonly type = "webgl2" as const;
  capabilities: ComputeCapabilities;
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private sequence = 0;
  private quadVao: WebGLVertexArrayObject | null = null;
  private quadVbo: WebGLBuffer | null = null;
  private unbindLost: (() => void) | null = null;
  private unbindRestored: (() => void) | null = null;

  constructor(options?: ComputeDeviceOptions) {
    super();
    this.capabilities = detectComputeCapabilities({
      forceBackend: "webgl2",
      testCanvas: options?.canvas,
    });
  }

  init(options: ComputeDeviceOptions = {}): void {
    if (options.gl) {
      this.gl = options.gl;
      this.canvas = options.gl.canvas as HTMLCanvasElement;
    } else {
      let canvas = options.canvas;
      if (!canvas && typeof document !== "undefined") {
        canvas = document.createElement("canvas");
      }
      this.canvas = canvas || null;

      if (canvas && typeof canvas.getContext === "function") {
        try {
          this.gl = canvas.getContext("webgl2", {
            alpha: true,
            antialias: false,
            powerPreference: options.powerPreference || "default",
          }) as WebGL2RenderingContext | null;
        } catch {
          this.gl = null;
        }
      }
    }

    if (!this.gl) {
      throw new Error("Failed to initialize WebGL2ComputeBackend: WebGL2 context creation failed");
    }

    // Set up full-screen quad VAO & VBO for simulation passes
    this.initQuad();

    // Hook native context loss
    if (this.canvas) {
      const onLost = (e: Event) => {
        e.preventDefault();
        this.notifyLost("WebGL2 context lost");
      };
      const onRestored = () => {
        this.initQuad();
        this.notifyRestored();
      };
      this.canvas.addEventListener("webglcontextlost", onLost, false);
      this.canvas.addEventListener("webglcontextrestored", onRestored, false);
      this.unbindLost = () => this.canvas?.removeEventListener("webglcontextlost", onLost);
      this.unbindRestored = () => this.canvas?.removeEventListener("webglcontextrestored", onRestored);
    }
  }

  private initQuad(): void {
    if (!this.gl) return;
    try {
      this.quadVao = this.gl.createVertexArray?.() || null;
      this.quadVbo = this.gl.createBuffer();
      if (this.quadVao) {
        this.gl.bindVertexArray?.(this.quadVao);
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadVbo);
      const quadVertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
      ]);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);
      this.gl.enableVertexAttribArray(0);
      this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
      if (this.quadVao) {
        this.gl.bindVertexArray?.(null);
      }
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    } catch {
      // Mock environment protection
    }
  }

  createBuffer(descriptor: ComputeBufferDescriptor, resourceManager: ComputeResourceManager): ComputeBuffer {
    if (!this.gl) throw new Error("WebGL2ComputeBackend not initialized");
    const id = descriptor.id || `gl2_buf_${++this.sequence}`;
    const buffer = new WebGL2ComputeBuffer(this.gl, descriptor, id);
    resourceManager.register("buffer", buffer, descriptor.size, descriptor.label);
    return buffer;
  }

  createTexture(descriptor: ComputeTextureDescriptor, resourceManager: ComputeResourceManager): ComputeTexture {
    if (!this.gl) throw new Error("WebGL2ComputeBackend not initialized");
    const id = descriptor.id || `gl2_tex_${++this.sequence}`;
    const texture = new WebGL2ComputeTexture(this.gl, descriptor, id);
    const bpp = getBytesPerPixel(texture.format);
    const byteSize = texture.width * texture.height * texture.depth * bpp;
    resourceManager.register("texture", texture, byteSize, descriptor.label);
    return texture;
  }

  createPipeline(descriptor: ComputePipelineDescriptor, resourceManager: ComputeResourceManager): ComputePipeline {
    if (!this.gl) throw new Error("WebGL2ComputeBackend not initialized");
    const id = descriptor.id || `gl2_pipe_${++this.sequence}`;

    const source = typeof descriptor.shader.source === "string" ? descriptor.shader.source : "";
    const { program, errors } = createWebGL2SimulationProgram(this.gl, source);

    if (!program || errors.length > 0) {
      throw new Error(`Failed to compile WebGL2 simulation pipeline: ${errors.join(", ")}`);
    }

    const pipeline = new WebGL2ComputePipeline(this.gl, descriptor, program, id);
    resourceManager.register("pipeline", pipeline, 0, descriptor.label);
    return pipeline;
  }

  createBindGroup(
    _layout: readonly ComputeBindingLayout[],
    bindings: readonly ComputeBinding[],
    resourceManager: ComputeResourceManager,
  ): ComputeBindGroup {
    const id = `gl2_bg_${++this.sequence}`;
    const bg = new WebGL2ComputeBindGroup(bindings, id);
    resourceManager.register("bind-group", bg, 0);
    return bg;
  }

  dispatch(pipeline: ComputePipeline, bindGroup: ComputeBindGroup, config: ComputeDispatchConfig): void {
    if (this.isLost || !this.gl || pipeline.isDisposed || bindGroup.isDisposed) return;
    const gl = this.gl;
    const glPipe = pipeline as WebGL2ComputePipeline;
    if (!glPipe.program) return;

    gl.useProgram(glPipe.program);

    // Bind textures and uniforms from bind group
    let textureUnit = 0;
    for (const b of bindGroup.bindings) {
      if ("glTex" in b.resource) {
        const tex = b.resource as WebGL2ComputeTexture;
        if (tex.glTex) {
          gl.activeTexture(gl.TEXTURE0 + textureUnit);
          gl.bindTexture(gl.TEXTURE_2D, tex.glTex);
          // Set sampler uniform to this texture unit
          const loc = gl.getUniformLocation(glPipe.program, `u_texture${b.binding}`);
          if (loc) {
            gl.uniform1i(loc, textureUnit);
          }
          textureUnit++;
        }
      }
    }

    // Set custom uniforms if specified
    if (config.uniforms) {
      for (const [name, val] of Object.entries(config.uniforms)) {
        const loc = gl.getUniformLocation(glPipe.program, name);
        if (!loc) continue;
        if (typeof val === "number") {
          gl.uniform1f(loc, val);
        } else if (Array.isArray(val)) {
          if (val.length === 2) gl.uniform2fv(loc, val);
          else if (val.length === 3) gl.uniform3fv(loc, val);
          else if (val.length === 4) gl.uniform4fv(loc, val);
        }
      }
    }

    // Set viewport dimensions
    const width = config.workgroupsX || 512;
    const height = config.workgroupsY || 512;
    gl.viewport(0, 0, width, height);

    // Draw full-screen quad pass
    if (this.quadVao) {
      gl.bindVertexArray?.(this.quadVao);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (this.quadVao) {
      gl.bindVertexArray?.(null);
    }
  }

  dispose(): void {
    this.lost = true;
    if (this.unbindLost) this.unbindLost();
    if (this.unbindRestored) this.unbindRestored();
    if (this.gl) {
      if (this.quadVbo) this.gl.deleteBuffer(this.quadVbo);
      if (this.quadVao) this.gl.deleteVertexArray?.(this.quadVao);
    }
    this.gl = null;
    this.canvas = null;
    this.lostListeners.clear();
    this.restoredListeners.clear();
  }
}
