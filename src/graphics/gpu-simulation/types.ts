/**
 * AF Motion GPU Simulation Architecture — Type Definitions
 *
 * Framework-independent compute abstraction supporting WebGL2 texture/FBO simulation,
 * WebGPU native compute pipelines, and deterministic CPU fallback execution.
 */

export type ComputeBackendType = "webgpu" | "webgl2" | "cpu";
export type ComputeBackendPreference = "auto" | ComputeBackendType;

export type ComputeTextureFormat =
  | "rgba32float"
  | "rgba16float"
  | "r32float"
  | "rg32float"
  | "rgba8unorm";

export type ComputeBufferUsage =
  | "storage"
  | "uniform"
  | "vertex"
  | "readback"
  | "copy-src"
  | "copy-dst";

export type ComputeTextureUsage =
  | "storage"
  | "sampled"
  | "render-target"
  | "readback"
  | "copy-src"
  | "copy-dst";

export type ComputeResourceType =
  | "buffer"
  | "texture"
  | "framebuffer"
  | "shader"
  | "pipeline"
  | "bind-group"
  | "custom";

export type SimulationTimestepMode = "fixed" | "variable";
export type SimulationFallbackPolicy = "reset" | "preserve";
export type SimulationState = "uninitialized" | "ready" | "running" | "paused" | "disposed";
export type ComputeQualityTier = "ultra" | "high" | "medium" | "low";

export interface ComputeCapabilities {
  readonly backend: ComputeBackendType;
  readonly webgpu: boolean;
  readonly webgl2: boolean;
  readonly float32Textures: boolean;
  readonly float16Textures: boolean;
  readonly storageBuffers: boolean;
  readonly computeShaders: boolean;
  readonly maxTextureDimension: number;
  readonly maxBufferSize: number;
  readonly maxComputeWorkgroupSize: readonly [number, number, number];
  readonly maxComputeInvocationsPerWorkgroup: number;
  readonly maxComputeWorkgroupsPerDimension: readonly [number, number, number];
  readonly supportedFormats: readonly ComputeTextureFormat[];
  readonly deviceLossRestorationSupported: boolean;
}

export interface ComputeCapabilityOptions {
  readonly forceBackend?: ComputeBackendPreference;
  readonly testCanvas?: HTMLCanvasElement | null;
  readonly forceFallback?: boolean;
}
export type ComputeCapabilityDetectionOptions = ComputeCapabilityOptions;

export interface ComputeBufferDescriptor {
  readonly id?: string;
  readonly size: number;
  readonly usage: readonly ComputeBufferUsage[] | ComputeBufferUsage;
  readonly initialData?: ArrayBufferView | ArrayBuffer | null;
  readonly label?: string;
}

export interface ComputeBuffer {
  readonly id: string;
  readonly size: number;
  readonly usage: readonly ComputeBufferUsage[];
  readonly isDisposed: boolean;
  readonly label?: string;
  write(data: ArrayBufferView | ArrayBuffer, offset?: number): void;
  read(): Promise<ArrayBufferView> | ArrayBufferView;
  dispose(): void;
}

export interface ComputeTextureDescriptor {
  readonly id?: string;
  readonly width: number;
  readonly height: number;
  readonly depth?: number;
  readonly format?: ComputeTextureFormat;
  readonly usage?: readonly ComputeTextureUsage[] | ComputeTextureUsage;
  readonly initialData?: ArrayBufferView | null;
  readonly label?: string;
}

export interface ComputeTexture {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly format: ComputeTextureFormat;
  readonly usage: readonly ComputeTextureUsage[];
  readonly isDisposed: boolean;
  readonly label?: string;
  write(data: ArrayBufferView, offset?: { x?: number; y?: number; z?: number }): void;
  read(): Promise<ArrayBufferView> | ArrayBufferView;
  dispose(): void;
}

export interface ComputeBindingLayout {
  readonly binding: number;
  readonly type: "storage-buffer" | "uniform-buffer" | "texture-sampled" | "texture-storage";
  readonly visibility?: "compute" | "all";
}

export interface ComputeBinding {
  readonly binding: number;
  readonly resource: ComputeBuffer | ComputeTexture | { buffer: ComputeBuffer; offset?: number; size?: number };
}

export interface ComputeBindGroup {
  readonly id: string;
  readonly bindings: readonly ComputeBinding[];
  readonly isDisposed: boolean;
  dispose(): void;
}

export interface CPUComputeContext {
  readonly invocationIndex: number;
  readonly workgroupIndex: readonly [number, number, number];
  readonly totalInvocations: number;
  readonly uniforms: Readonly<Record<string, number | readonly number[]>>;
  readonly buffers: Readonly<Record<number, ArrayBufferView>>;
  readonly textures: Readonly<Record<number, { width: number; height: number; data: Float32Array | Uint8Array }>>;
}

export type CPUShaderKernel = (context: CPUComputeContext) => void;

export type ComputeShaderLanguage = "wgsl" | "glsl" | "cpu";

export interface ComputeShaderDescriptor {
  readonly id?: string;
  readonly name?: string;
  readonly language?: ComputeShaderLanguage;
  readonly source: string | CPUShaderKernel;
  readonly entryPoint?: string;
  readonly uniforms?: Record<string, "float" | "vec2" | "vec3" | "vec4" | "int" | "uint" | "mat4">;
  readonly bindings?: readonly ComputeBindingLayout[];
  readonly workgroupSize?: readonly [number, number, number];
}

export interface ComputePipelineDescriptor {
  readonly id?: string;
  readonly shader: ComputeShaderDescriptor;
  readonly bindGroupLayout?: readonly ComputeBindingLayout[];
  readonly label?: string;
}

export interface ComputePipeline {
  readonly id: string;
  readonly descriptor: ComputePipelineDescriptor;
  readonly isDisposed: boolean;
  dispose(): void;
}

export interface ComputeDispatchConfig {
  readonly workgroupsX: number;
  readonly workgroupsY?: number;
  readonly workgroupsZ?: number;
  readonly uniforms?: Record<string, number | readonly number[]>;
}

export interface PingPongPair<T> {
  current: T;
  next: T;
  swap(): void;
}

export type PingPongTextures = PingPongPair<ComputeTexture>;

export interface PingPongFramebuffer {
  readonly fboA: unknown;
  readonly fboB: unknown;
  readonly currentFbo: unknown;
  readonly nextFbo: unknown;
  readonly isDisposed: boolean;
  swap(): void;
  dispose(): void;
}

export interface ComputeMemoryUsage {
  readonly totalBytes: number;
  readonly bufferBytes: number;
  readonly textureBytes: number;
  readonly resourceCount: number;
  readonly bufferCount: number;
  readonly textureCount: number;
  readonly pipelineCount: number;
}

export interface ComputeResourceManagerOptions {
  readonly maxMemoryBytes?: number;
  readonly maxTextureCount?: number;
  readonly maxBufferCount?: number;
}

export interface ComputeResourceManager {
  readonly size: number;
  readonly totalAllocatedBytes: number;
  readonly memoryUsage: ComputeMemoryUsage;
  register(type: ComputeResourceType, resource: { dispose(): void; id?: string }, byteSize?: number, label?: string): string;
  get<T = unknown>(resourceId: string): T | undefined;
  has(resourceId: string): boolean;
  dispose(resourceId: string): boolean;
  disposeAll(): void;
  checkLimits(): boolean;
  handleContextLost(): void;
  handleContextRestored(): void;
}

export interface ComputeDeviceOptions {
  readonly backend?: ComputeBackendPreference;
  readonly canvas?: HTMLCanvasElement | null;
  readonly gl?: WebGL2RenderingContext | null;
  readonly powerPreference?: "default" | "high-performance" | "low-power";
  readonly memoryLimitBytes?: number;
}

export interface ComputeDevice {
  readonly backend: ComputeBackendType;
  readonly capabilities: ComputeCapabilities;
  readonly resourceManager: ComputeResourceManager;
  readonly isLost: boolean;
  readonly canvas: HTMLCanvasElement | null;
  createBuffer(descriptor: ComputeBufferDescriptor): ComputeBuffer;
  createTexture(descriptor: ComputeTextureDescriptor): ComputeTexture;
  createPipeline(descriptor: ComputePipelineDescriptor): ComputePipeline;
  createBindGroup(layout: readonly ComputeBindingLayout[], bindings: readonly ComputeBinding[]): ComputeBindGroup;
  dispatch(pipeline: ComputePipeline, bindGroup: ComputeBindGroup, config: ComputeDispatchConfig): void;
  onDeviceLost(listener: (reason: string) => void): () => void;
  onDeviceRestored(listener: () => void): () => void;
  dispose(): void;
}

export interface ComputeBackend {
  readonly type: ComputeBackendType;
  readonly capabilities: ComputeCapabilities;
  readonly isLost: boolean;
  init(options?: ComputeDeviceOptions): Promise<void> | void;
  createBuffer(descriptor: ComputeBufferDescriptor, resourceManager: ComputeResourceManager): ComputeBuffer;
  createTexture(descriptor: ComputeTextureDescriptor, resourceManager: ComputeResourceManager): ComputeTexture;
  createPipeline(descriptor: ComputePipelineDescriptor, resourceManager: ComputeResourceManager): ComputePipeline;
  createBindGroup(layout: readonly ComputeBindingLayout[], bindings: readonly ComputeBinding[], resourceManager: ComputeResourceManager): ComputeBindGroup;
  dispatch(pipeline: ComputePipeline, bindGroup: ComputeBindGroup, config: ComputeDispatchConfig): void;
  onDeviceLost(listener: (reason: string) => void): () => void;
  onDeviceRestored(listener: () => void): () => void;
  dispose(): void;
}

export interface BackendSelectionOptions {
  readonly preference?: ComputeBackendPreference;
  readonly canvas?: HTMLCanvasElement | null;
  readonly capabilities?: ComputeCapabilities;
  readonly requireFloatTextures?: boolean;
  readonly requireStorageBuffers?: boolean;
}

export interface ComputeBackendSelectionResult {
  readonly backend: ComputeBackendType;
  readonly isFallback: boolean;
  readonly reason: string;
}

export interface SimulationStepContext {
  readonly time: number;
  readonly deltaTime: number;
  readonly substep: number;
  readonly totalSubsteps: number;
  readonly frame: number;
  readonly backend: ComputeBackendType;
  readonly device: ComputeDevice;
}

export interface SimulationMetrics {
  readonly fps: number;
  readonly frameTimeMs: number;
  readonly computeTimeMs: number;
  readonly totalFrames: number;
  readonly currentBackend: ComputeBackendType;
  readonly memoryUsage: ComputeMemoryUsage;
}

export interface SimulationKernel {
  readonly id: string;
  readonly name?: string;
  init?(context: SimulationStepContext): void | Promise<void>;
  step(context: SimulationStepContext): void;
  reset?(): void;
  dispose?(): void;
}

export interface SimulationEngineConfig {
  readonly device?: ComputeDevice;
  readonly backend?: ComputeBackendPreference;
  readonly canvas?: HTMLCanvasElement | null;
  readonly kernel: SimulationKernel;
  readonly timestepMode?: SimulationTimestepMode;
  readonly fixedDeltaTime?: number;
  readonly maxDeltaTime?: number;
  readonly substeps?: number;
  readonly autoStart?: boolean;
  readonly quality?: ComputeQualityTier;
  readonly fallbackPolicy?: SimulationFallbackPolicy;
  readonly onFallback?: (from: ComputeBackendType, to: ComputeBackendType, reason: string) => void;
}

export interface SimulationEngine {
  readonly state: SimulationState;
  readonly device: ComputeDevice;
  readonly backend: ComputeBackendType;
  readonly metrics: SimulationMetrics;
  init(): Promise<void> | void;
  update(deltaTime?: number): void;
  pause(): void;
  resume(): void;
  reset(): void;
  dispose(): void;
  switchBackend(target: ComputeBackendType): Promise<void> | void;
}
