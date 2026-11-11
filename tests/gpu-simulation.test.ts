// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createComputeDevice,
  createComputeDeviceAsync,
  createComputeBackend,
  createComputePipeline,
  createComputeResourceManager,
  createSimulationEngine,
  detectComputeCapabilities,
  resetCachedComputeCapabilities,
  selectComputeBackend,
  DEFAULT_FALLBACK_COMPUTE_CAPABILITIES,
  computeShaderCacheKey,
  validateShaderDescriptor,
  clearShaderCache,
  createPingPongPair,
  createPingPongTextures,
  createWebGL2PingPongFramebuffer,
  validatePipelineDescriptor,
  type ComputeCapabilities,
  type ComputeDevice,
  type ComputeResourceManager,
  type SimulationEngine,
  type SimulationKernel,
  type SimulationStepContext,
  type CPUComputeContext,
} from "../src/catalogue.js";

describe("Prompt 117 — GPU Simulation Architecture", () => {
  let mockCanvas: HTMLCanvasElement;
  let mockGL2: any;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    resetCachedComputeCapabilities();
    clearShaderCache();

    mockGL2 = {
      MAX_TEXTURE_SIZE: 0x0d33,
      FRAMEBUFFER: 0x8d40,
      COLOR_ATTACHMENT0: 0x8ce0,
      TEXTURE_2D: 0x0de1,
      FRAMEBUFFER_COMPLETE: 0x8cd5,
      ARRAY_BUFFER: 0x8892,
      DYNAMIC_DRAW: 0x88e8,
      STATIC_DRAW: 0x88e4,
      RGBA8: 0x8058,
      RGBA32F: 0x8814,
      RGBA16F: 0x881a,
      R32F: 0x822e,
      RG32F: 0x8230,
      RGBA: 0x1908,
      FLOAT: 0x1406,
      HALF_FLOAT: 0x140b,
      UNSIGNED_BYTE: 0x1401,
      NEAREST: 0x2600,
      TEXTURE_MIN_FILTER: 0x2801,
      TEXTURE_MAG_FILTER: 0x2800,
      TEXTURE_WRAP_S: 0x2802,
      TEXTURE_WRAP_T: 0x2803,
      CLAMP_TO_EDGE: 0x812f,
      COMPILE_STATUS: 0x8b81,
      LINK_STATUS: 0x8b82,
      VERTEX_SHADER: 0x8b31,
      FRAGMENT_SHADER: 0x8b30,
      TRIANGLE_STRIP: 0x0005,
      TEXTURE0: 0x84c0,
      activeTexture: vi.fn(),

      canvas: document.createElement("canvas"),
      getParameter: vi.fn().mockImplementation((param) => {
        if (param === 0x0d33) return 4096;
        return null;
      }),
      getExtension: vi.fn().mockImplementation((name) => {
        if (name === "EXT_color_buffer_float") return {};
        if (name === "EXT_color_buffer_half_float") return {};
        return null;
      }),
      createBuffer: vi.fn().mockReturnValue({}),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      bufferSubData: vi.fn(),
      getBufferSubData: vi.fn(),
      deleteBuffer: vi.fn(),
      createTexture: vi.fn().mockReturnValue({}),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      texSubImage2D: vi.fn(),
      deleteTexture: vi.fn(),
      createFramebuffer: vi.fn().mockReturnValue({}),
      bindFramebuffer: vi.fn(),
      framebufferTexture2D: vi.fn(),
      checkFramebufferStatus: vi.fn().mockReturnValue(0x8cd5),
      deleteFramebuffer: vi.fn(),
      createShader: vi.fn().mockReturnValue({}),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      getShaderInfoLog: vi.fn().mockReturnValue(""),
      deleteShader: vi.fn(),
      createProgram: vi.fn().mockReturnValue({}),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      getProgramInfoLog: vi.fn().mockReturnValue(""),
      useProgram: vi.fn(),
      deleteProgram: vi.fn(),
      getUniformLocation: vi.fn().mockReturnValue({}),
      uniform1i: vi.fn(),
      uniform1f: vi.fn(),
      uniform2fv: vi.fn(),
      uniform3fv: vi.fn(),
      uniform4fv: vi.fn(),
      viewport: vi.fn(),
      drawArrays: vi.fn(),
      readPixels: vi.fn(),
      createVertexArray: vi.fn().mockReturnValue({}),
      bindVertexArray: vi.fn(),
      deleteVertexArray: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (type: string) {
      if (type === "webgl2") return mockGL2;
      return null;
    }) as any;

    mockCanvas = document.createElement("canvas");
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetCachedComputeCapabilities();
  });

  describe("1. Capability Detection & SSR Readiness", () => {
    it("returns deterministic fallback capabilities when forceFallback is true", () => {
      const caps = detectComputeCapabilities({ forceFallback: true });
      expect(caps.backend).toBe("cpu");
      expect(caps.webgpu).toBe(false);
      expect(caps.webgl2).toBe(false);
      expect(caps.maxTextureDimension).toBe(2048);
      expect(caps.supportedFormats).toContain("rgba8unorm");
    });

    it("detects WebGL2 and float texture support when available", () => {
      const caps = detectComputeCapabilities({ testCanvas: mockCanvas });
      expect(caps.webgl2).toBe(true);
      expect(caps.float32Textures).toBe(true);
      expect(caps.maxTextureDimension).toBe(4096);
      expect(caps.supportedFormats).toContain("rgba32float");
    });

    it("resets cached capabilities via resetCachedComputeCapabilities", () => {
      const caps1 = detectComputeCapabilities({ testCanvas: mockCanvas });
      expect(caps1.webgl2).toBe(true);
      resetCachedComputeCapabilities();
      const caps2 = detectComputeCapabilities({ forceFallback: true });
      expect(caps2.webgl2).toBe(false);
    });

    it("detects WebGPU when navigator.gpu is defined", () => {
      vi.stubGlobal("navigator", { gpu: {} });
      const caps = detectComputeCapabilities({ forceBackend: "auto" });
      expect(caps.webgpu).toBe(true);
      expect(caps.computeShaders).toBe(true);
      expect(caps.storageBuffers).toBe(true);
    });
  });

  describe("2. Backend Selection & Fallback", () => {
    it("selects CPU when explicitly requested", () => {
      const result = selectComputeBackend({ preference: "cpu" });
      expect(result.backend).toBe("cpu");
      expect(result.isFallback).toBe(false);
      expect(result.reason).toContain("CPU simulation backend explicitly requested");
    });

    it("falls back to WebGL2 or CPU when WebGPU is requested but unsupported", () => {
      const result = selectComputeBackend({
        preference: "webgpu",
        canvas: mockCanvas,
      });
      expect(result.backend).toBe("webgl2");
      expect(result.isFallback).toBe(true);
      expect(result.reason).toContain("WebGPU was requested but is unsupported");
    });

    it("falls back to CPU when WebGL2 lacks required float textures", () => {
      const result = selectComputeBackend({
        preference: "webgl2",
        capabilities: {
          ...DEFAULT_FALLBACK_COMPUTE_CAPABILITIES,
          webgl2: true,
          float32Textures: false,
        },
        requireFloatTextures: true,
      });
      expect(result.backend).toBe("cpu");
      expect(result.isFallback).toBe(true);
      expect(result.reason).toContain("lacked required float textures");
    });

    it("creates concrete compute backend instances via createComputeBackend", () => {
      const cpu = createComputeBackend("cpu");
      expect(cpu.type).toBe("cpu");

      const gl2 = createComputeBackend("webgl2", { canvas: mockCanvas });
      expect(gl2.type).toBe("webgl2");

      const wgpu = createComputeBackend("webgpu");
      expect(wgpu.type).toBe("webgpu");
    });
  });

  describe("3. Compute Resource Manager & Memory Accounting", () => {
    let rm: ComputeResourceManager;

    beforeEach(() => {
      rm = createComputeResourceManager({ maxMemoryBytes: 1024 * 1024 });
    });

    it("registers and tracks compute buffers with byte size", () => {
      const mockBuffer = { dispose: vi.fn(), id: "buf_test" };
      const id = rm.register("buffer", mockBuffer, 1024, "Position Buffer");
      expect(id).toBe("buf_test");
      expect(rm.has(id)).toBe(true);
      expect(rm.get(id)).toBe(mockBuffer);
      expect(rm.totalAllocatedBytes).toBe(1024);
      expect(rm.memoryUsage.bufferBytes).toBe(1024);
      expect(rm.memoryUsage.bufferCount).toBe(1);
    });

    it("tracks compute textures and updates total memory usage", () => {
      const mockTex = { dispose: vi.fn(), id: "tex_state" };
      rm.register("texture", mockTex, 4096, "Velocity Texture");
      expect(rm.memoryUsage.textureBytes).toBe(4096);
      expect(rm.memoryUsage.textureCount).toBe(1);
      expect(rm.totalAllocatedBytes).toBe(4096);
    });

    it("safely handles idempotent disposal and prevents double disposal", () => {
      const disposeFn = vi.fn();
      const resource = { dispose: disposeFn, id: "res_double" };
      rm.register("custom", resource, 512);

      expect(rm.dispose("res_double")).toBe(true);
      expect(disposeFn).toHaveBeenCalledTimes(1);
      expect(rm.has("res_double")).toBe(false);

      // Second dispose call is a safe no-op
      expect(rm.dispose("res_double")).toBe(false);
      expect(disposeFn).toHaveBeenCalledTimes(1);
    });

    it("disposes all tracked resources in reverse order via disposeAll()", () => {
      const order: string[] = [];
      rm.register("buffer", { dispose: () => order.push("first"), id: "1" });
      rm.register("buffer", { dispose: () => order.push("second"), id: "2" });

      rm.disposeAll();
      expect(order).toEqual(["second", "first"]);
      expect(rm.size).toBe(0);
      expect(rm.totalAllocatedBytes).toBe(0);
    });

    it("marks resources disposed on handleContextLost()", () => {
      const mockBuf = { dispose: vi.fn(), id: "buf_lost" };
      rm.register("buffer", mockBuf, 256);
      rm.handleContextLost();
      expect(rm.has("buf_lost")).toBe(false);
      expect(rm.size).toBe(0);
    });
  });

  describe("4. Shader Infrastructure & Validation", () => {
    it("validates shader descriptor and detects missing source", () => {
      const result = validateShaderDescriptor({ source: "" } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("generates deterministic cache keys for identical shader sources", () => {
      const desc1 = { language: "glsl" as const, source: "void main() {}", entryPoint: "main" };
      const desc2 = { language: "glsl" as const, source: "void main() {}", entryPoint: "main" };
      const key1 = computeShaderCacheKey(desc1);
      const key2 = computeShaderCacheKey(desc2);
      expect(key1).toBe(key2);
    });

    it("validates pipeline descriptors and requires valid shader source", () => {
      const validDesc = {
        shader: { language: "glsl" as const, source: "void main() {}" },
      };
      expect(validatePipelineDescriptor(validDesc).valid).toBe(true);

      const invalidDesc = {
        shader: { language: "cpu" as const, source: "not-a-function" as any },
      };
      expect(validatePipelineDescriptor(invalidDesc).valid).toBe(false);
    });
  });

  describe("5. Ping-Pong Buffers & Textures", () => {
    it("creates a generic ping-pong pair and swaps correctly", () => {
      const pair = createPingPongPair("stateA", "stateB");
      expect(pair.current).toBe("stateA");
      expect(pair.next).toBe("stateB");

      pair.swap();
      expect(pair.current).toBe("stateB");
      expect(pair.next).toBe("stateA");
    });

    it("creates WebGL2 ping-pong framebuffers and performs completeness validation", () => {
      const texA = {} as WebGLTexture;
      const texB = {} as WebGLTexture;
      const pingPong = createWebGL2PingPongFramebuffer(mockGL2, texA, texB);

      expect(pingPong.isDisposed).toBe(false);
      expect(mockGL2.createFramebuffer).toHaveBeenCalledTimes(2);
      expect(mockGL2.checkFramebufferStatus).toHaveBeenCalledTimes(2);

      pingPong.swap();
      pingPong.dispose();
      expect(pingPong.isDisposed).toBe(true);
      expect(mockGL2.deleteFramebuffer).toHaveBeenCalledTimes(2);
    });
  });

  describe("6. Deterministic CPU Compute Backend Execution", () => {
    it("allocates buffers, writes, reads, and dispatches pure CPU kernels", () => {
      const device = createComputeDevice({ backend: "cpu" });
      expect(device.backend).toBe("cpu");

      // 1. Create storage buffer
      const buffer = device.createBuffer({
        size: 16,
        usage: "storage",
        initialData: new Float32Array([1, 2, 3, 4]),
      });
      expect(buffer.size).toBe(16);

      const readBack = new Float32Array(buffer.read().buffer);
      expect(readBack[0]).toBe(1);
      expect(readBack[3]).toBe(4);

      // 2. Create CPU compute pipeline
      const kernelFn = vi.fn((ctx: CPUComputeContext) => {
        const data = ctx.buffers[0] as Uint8Array;
        const floats = new Float32Array(data.buffer, data.byteOffset, 4);
        floats[ctx.invocationIndex] *= 2;
      });

      const pipeline = createComputePipeline(device, {
        shader: {
          language: "cpu",
          source: kernelFn,
          workgroupSize: [1, 1, 1],
        },
      });

      const bindGroup = device.createBindGroup(
        [{ binding: 0, type: "storage-buffer" }],
        [{ binding: 0, resource: buffer }],
      );

      // 3. Dispatch 4 workgroups
      device.dispatch(pipeline, bindGroup, { workgroupsX: 4 });
      expect(kernelFn).toHaveBeenCalledTimes(4);

      const afterCompute = new Float32Array(buffer.read().buffer);
      expect(afterCompute[0]).toBe(2);
      expect(afterCompute[1]).toBe(4);
      expect(afterCompute[2]).toBe(6);
      expect(afterCompute[3]).toBe(8);

      device.dispose();
      expect(buffer.isDisposed).toBe(true);
      expect(pipeline.isDisposed).toBe(true);
    });

    it("allocates 2D compute textures and reads back data", () => {
      const device = createComputeDevice({ backend: "cpu" });
      const texture = device.createTexture({
        width: 2,
        height: 2,
        format: "rgba32float",
        initialData: new Float32Array([
          1, 0, 0, 1,
          0, 1, 0, 1,
          0, 0, 1, 1,
          1, 1, 1, 1,
        ]),
      });

      expect(texture.width).toBe(2);
      expect(texture.height).toBe(2);

      const pixels = texture.read() as Float32Array;
      expect(pixels.length).toBe(16);
      expect(pixels[0]).toBe(1);
      expect(pixels[4 + 1]).toBe(1);

      device.dispose();
      expect(texture.isDisposed).toBe(true);
    });
  });

  describe("7. WebGL2 Hardware-Accelerated Simulation Pipeline", () => {
    it("creates WebGL2 compute device, buffers, textures, and dispatches quad passes", () => {
      const device = createComputeDevice({
        backend: "webgl2",
        canvas: mockCanvas,
      });
      expect(device.backend).toBe("webgl2");

      const buffer = device.createBuffer({
        size: 64,
        usage: "uniform",
      });
      expect(mockGL2.createBuffer).toHaveBeenCalled();

      const texture = device.createTexture({
        width: 128,
        height: 128,
        format: "rgba32float",
      });
      expect(mockGL2.createTexture).toHaveBeenCalled();

      const pipeline = createComputePipeline(device, {
        shader: {
          language: "glsl",
          source: `#version 300 es
          precision highp float;
          out vec4 fragColor;
          void main() { fragColor = vec4(1.0); }`,
        },
      });

      const bindGroup = device.createBindGroup(
        [{ binding: 0, type: "texture-sampled" }],
        [{ binding: 0, resource: texture }],
      );

      device.dispatch(pipeline, bindGroup, {
        workgroupsX: 128,
        workgroupsY: 128,
        uniforms: { u_time: 1.5 },
      });

      expect(mockGL2.useProgram).toHaveBeenCalled();
      expect(mockGL2.viewport).toHaveBeenCalledWith(0, 0, 128, 128);
      expect(mockGL2.drawArrays).toHaveBeenCalledWith(mockGL2.TRIANGLE_STRIP, 0, 4);

      device.dispose();
      expect(mockGL2.deleteBuffer).toHaveBeenCalled();
      expect(mockGL2.deleteTexture).toHaveBeenCalled();
    });
  });

  describe("8. Simulation Engine Lifecycle & Timestepping", () => {
    let mockKernel: SimulationKernel;
    let stepCount = 0;

    beforeEach(() => {
      stepCount = 0;
      mockKernel = {
        id: "particle_test_kernel",
        init: vi.fn(),
        step: vi.fn((ctx: SimulationStepContext) => {
          stepCount++;
        }),
        reset: vi.fn(),
        dispose: vi.fn(),
      };
    });

    it("runs fixed-timestep simulation updates with substeps", async () => {
      const engine = createSimulationEngine({
        kernel: mockKernel,
        backend: "cpu",
        timestepMode: "fixed",
        fixedDeltaTime: 1 / 60,
        substeps: 2,
      });

      await engine.init();
      expect(engine.state).toBe("ready");
      expect(mockKernel.init).toHaveBeenCalled();

      // Step 1 frame (1/60s) -> 2 substeps executed
      engine.update(1 / 60);
      expect(engine.state).toBe("running");
      expect(mockKernel.step).toHaveBeenCalledTimes(2);

      // Step 2 frames (2/60s) -> 4 more substeps executed
      engine.update(2 / 60);
      expect(mockKernel.step).toHaveBeenCalledTimes(6);

      const metrics = engine.metrics;
      expect(metrics.totalFrames).toBe(3);
      expect(metrics.currentBackend).toBe("cpu");

      engine.dispose();
      expect(engine.state).toBe("disposed");
      expect(mockKernel.dispose).toHaveBeenCalled();
    });

    it("supports pause, resume, and reset controls", async () => {
      const engine = createSimulationEngine({
        kernel: mockKernel,
        backend: "cpu",
        timestepMode: "fixed",
        fixedDeltaTime: 1 / 60,
      });

      await engine.init();
      engine.update(1 / 60);
      expect(mockKernel.step).toHaveBeenCalledTimes(1);

      engine.pause();
      expect(engine.state).toBe("paused");
      // While paused, update calls do not invoke kernel.step
      engine.update(1 / 60);
      expect(mockKernel.step).toHaveBeenCalledTimes(1);

      engine.resume();
      expect(engine.state).toBe("running");
      engine.update(1 / 60);
      expect(mockKernel.step).toHaveBeenCalledTimes(2);

      engine.reset();
      expect(engine.state).toBe("ready");
      expect(mockKernel.reset).toHaveBeenCalled();
      expect(engine.metrics.totalFrames).toBe(0);

      engine.dispose();
    });

    it("switches backends dynamically via switchBackend()", async () => {
      const onFallback = vi.fn();
      const engine = createSimulationEngine({
        kernel: mockKernel,
        backend: "cpu",
        onFallback,
      });

      expect(engine.backend).toBe("cpu");

      // Switch to CPU (or mock WebGL2 if available)
      await engine.switchBackend("cpu");
      expect(engine.backend).toBe("cpu");

      engine.dispose();
    });
  });

  describe("9. Device Loss and Recovery", () => {
    it("fires device lost and restored callbacks cleanly", () => {
      const device = createComputeDevice({ backend: "cpu" });
      const lostListener = vi.fn();
      const restoredListener = vi.fn();

      const unbindLost = device.onDeviceLost(lostListener);
      const unbindRestored = device.onDeviceRestored(restoredListener);

      expect(typeof unbindLost).toBe("function");
      expect(typeof unbindRestored).toBe("function");

      device.dispose();
      expect(device.isLost).toBe(true);
    });
  });
});
