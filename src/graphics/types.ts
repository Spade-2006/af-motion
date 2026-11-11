/**
 * AF Motion Graphics Rendering Engine Contracts
 *
 * Framework-independent foundation for rendering abstractions,
 * shader infrastructure, capability detection, effect lifecycles,
 * and deterministic resource management.
 */

export type RendererBackend = "canvas2d" | "webgl" | "webgl2" | "webgpu" | "null";

export type GraphicsEngineState = "idle" | "running" | "paused" | "destroyed";

export interface GraphicsCapabilities {
  readonly supportedBackends: readonly RendererBackend[];
  readonly activeBackend: RendererBackend;
  readonly canvas: boolean;
  readonly webgl: boolean;
  readonly webgl2: boolean;
  readonly webgpu: boolean;
  readonly maxTextureSize: number;
  readonly dpr: number;
  readonly reducedMotion: boolean;
  readonly colorSpace: "srgb" | "display-p3";
  readonly antialias: boolean;
  readonly floatTextures: boolean;
  readonly instancedArrays: boolean;
  readonly powerPreference?: "default" | "high-performance" | "low-power";
}

export interface CapabilityDetectionOptions {
  readonly forceFallback?: boolean;
  readonly preferredBackend?: RendererBackend;
  readonly targetDpr?: number;
  readonly testCanvas?: HTMLCanvasElement | null;
}

export interface RendererOptions {
  readonly backend?: RendererBackend | "auto";
  readonly alpha?: boolean;
  readonly antialias?: boolean;
  readonly powerPreference?: "default" | "high-performance" | "low-power";
  readonly preserveDrawingBuffer?: boolean;
  readonly dpr?: number;
  readonly fallbackBackend?: RendererBackend;
}

export interface RenderFrameContext {
  readonly time: number;
  readonly deltaTime: number;
  readonly elapsedTime: number;
  readonly frameIndex: number;
  readonly width: number;
  readonly height: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly dpr: number;
  readonly canvas: HTMLCanvasElement;
  readonly backend: RendererBackend;
  readonly rawContext: unknown;
}

export interface Renderer {
  readonly backend: RendererBackend;
  readonly isInitialized: boolean;
  readonly canvas: HTMLCanvasElement | null;
  init(canvas: HTMLCanvasElement, options?: RendererOptions): Promise<void> | void;
  render(context: RenderFrameContext): void;
  resize(width: number, height: number, dpr: number): void;
  clear(color?: readonly [number, number, number, number]): void;
  getCapabilities(): GraphicsCapabilities;
  destroy(): void;
  onContextLost(listener: () => void): () => void;
  onContextRestored(listener: () => void): () => void;
}

export interface DisposableResource {
  readonly id: string;
  readonly type: string;
  dispose(): void;
}

export interface ResourceManager {
  readonly size: number;
  register(resource: DisposableResource, ownerId?: string): string;
  get(resourceId: string): DisposableResource | undefined;
  has(resourceId: string): boolean;
  dispose(resourceId: string): boolean;
  disposeOwnedBy(ownerId: string): number;
  disposeAll(): void;
  trackOwner(resourceId: string, ownerId: string): void;
  release(resourceId: string): boolean;
  getResourcesOwnedBy(ownerId: string): readonly DisposableResource[];
}

export interface GraphicsEffectRequirement {
  readonly backend?: RendererBackend | readonly RendererBackend[];
  readonly minTextureSize?: number;
  readonly requiresFloatTextures?: boolean;
  readonly requiresInstancing?: boolean;
}

export interface GraphicsEffectAccessibility {
  readonly supportsReducedMotion?: boolean;
  readonly respectsReducedMotion?: boolean;
  readonly staticFallback?: boolean;
}

export interface GraphicsEffectInitContext {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: Renderer;
  readonly capabilities: GraphicsCapabilities;
  readonly resourceManager: ResourceManager;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export interface GraphicsEffectUpdateContext extends RenderFrameContext {
  readonly renderer: Renderer;
  readonly resourceManager: ResourceManager;
}

export interface GraphicsEffect<TConfig = unknown> {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly config?: TConfig;
  readonly requirements?: GraphicsEffectRequirement;
  readonly accessibility?: GraphicsEffectAccessibility;
  init?(context: GraphicsEffectInitContext): Promise<void> | void;
  render(context: GraphicsEffectUpdateContext): void;
  resize?(width: number, height: number, dpr: number): void;
  pause?(): void;
  resume?(): void;
  dispose?(): void;
}

export interface GraphicsEngineOptions {
  readonly renderer?: Renderer | RendererOptions;
  readonly dpr?: number | "auto";
  readonly autoStart?: boolean;
  readonly pauseOnHidden?: boolean;
  readonly respectReducedMotion?: boolean;
  readonly fpsLimit?: number;
}

export interface GraphicsEngine {
  readonly state: GraphicsEngineState;
  readonly renderer: Renderer | null;
  readonly capabilities: GraphicsCapabilities;
  readonly canvas: HTMLCanvasElement | null;
  readonly resourceManager: ResourceManager;
  readonly effects: readonly GraphicsEffect[];
  attach(canvas: HTMLCanvasElement): Promise<void> | void;
  detach(): void;
  registerEffect(effect: GraphicsEffect): void;
  unregisterEffect(effectId: string): boolean;
  getEffect(effectId: string): GraphicsEffect | undefined;
  hasEffect(effectId: string): boolean;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  requestFrame(): void;
  resize(width?: number, height?: number, dpr?: number): void;
  onStateChange(listener: (state: GraphicsEngineState) => void): () => void;
  destroy(): void;
}
