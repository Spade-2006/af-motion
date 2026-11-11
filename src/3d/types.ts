/**
 * AF Motion 3D Scene & Rendering Contracts
 *
 * Framework-independent contracts for 3D scenes, cameras, lighting,
 * environments, object graphs, renderer adapters, and capability detection.
 */

export type CameraType = "perspective" | "orthographic";

export type Vector3Tuple = readonly [x: number, y: number, z: number];
export type EulerTuple = readonly [x: number, y: number, z: number];

export interface Camera3DConfig {
  readonly type?: CameraType;
  readonly fov?: number;
  readonly aspect?: number;
  readonly near?: number;
  readonly far?: number;
  readonly zoom?: number;
  readonly position?: Vector3Tuple;
  readonly target?: Vector3Tuple;
  readonly up?: Vector3Tuple;
}

export interface AmbientLightConfig {
  readonly color?: string;
  readonly intensity?: number;
}

export interface DirectionalLightConfig {
  readonly color?: string;
  readonly intensity?: number;
  readonly position?: Vector3Tuple;
  readonly target?: Vector3Tuple;
  readonly castShadow?: boolean;
}

export interface PointLightConfig {
  readonly color?: string;
  readonly intensity?: number;
  readonly position?: Vector3Tuple;
  readonly distance?: number;
  readonly decay?: number;
  readonly castShadow?: boolean;
}

export interface SpotLightConfig {
  readonly color?: string;
  readonly intensity?: number;
  readonly position?: Vector3Tuple;
  readonly target?: Vector3Tuple;
  readonly angle?: number;
  readonly penumbra?: number;
  readonly distance?: number;
  readonly decay?: number;
  readonly castShadow?: boolean;
}

export interface Lighting3DConfig {
  readonly ambient?: AmbientLightConfig;
  readonly directional?: readonly DirectionalLightConfig[];
  readonly point?: readonly PointLightConfig[];
  readonly spot?: readonly SpotLightConfig[];
}

export type FogType = "linear" | "exponential";

export interface FogConfig {
  readonly type?: FogType;
  readonly color?: string;
  readonly near?: number;
  readonly far?: number;
  readonly density?: number;
}

export interface Environment3DConfig {
  readonly background?: string;
  readonly transparent?: boolean;
  readonly fog?: FogConfig;
  readonly ground?: {
    readonly enabled?: boolean;
    readonly size?: number;
    readonly color?: string;
    readonly receiveShadow?: boolean;
  };
}

export type Object3DType = "mesh" | "group" | "light" | "camera" | "custom";

export interface Object3DConfig {
  readonly id: string;
  readonly name?: string;
  readonly type: Object3DType;
  readonly position?: Vector3Tuple;
  readonly rotation?: EulerTuple;
  readonly scale?: Vector3Tuple;
  readonly visible?: boolean;
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
  readonly userData?: Record<string, unknown>;
}

export type Renderer3DBackend = "three" | "webgl" | "null";

export type PowerPreference = "default" | "high-performance" | "low-power";

export interface Renderer3DConfig {
  readonly backend?: Renderer3DBackend;
  readonly powerPreference?: PowerPreference;
  readonly antialias?: boolean;
  readonly alpha?: boolean;
  readonly dpr?: number | "auto";
  readonly shadowMap?: boolean;
  readonly preserveDrawingBuffer?: boolean;
}

export interface Scene3DCapabilities {
  readonly webgl: boolean;
  readonly webgl2: boolean;
  readonly webgpu: boolean;
  readonly maxTextureSize: number;
  readonly maxAnisotropy: number;
  readonly floatTextures: boolean;
  readonly isSupported: boolean;
  readonly reducedMotion: boolean;
  readonly devicePixelRatio: number;
}

export interface Scene3DDefinition {
  readonly id: string;
  readonly name?: string;
  readonly version?: string;
  readonly camera?: Camera3DConfig;
  readonly lighting?: Lighting3DConfig;
  readonly environment?: Environment3DConfig;
  readonly objects?: readonly Object3DConfig[];
  readonly renderer?: Renderer3DConfig;
  readonly autoStart?: boolean;
  readonly respectReducedMotion?: boolean;
}

export interface ScenePerformanceStats {
  readonly fps: number;
  readonly avgFrameTimeMs: number;
  readonly totalObjects: number;
  readonly isRunning: boolean;
  readonly backend: Renderer3DBackend;
}

export interface Renderer3DAdapter {
  readonly id: string;
  readonly name: string;
  readonly backend: Renderer3DBackend;
  isSupported(): boolean;
  init(canvas: HTMLCanvasElement, config?: Renderer3DConfig): Promise<void> | void;
  render(scene: Scene3DInstance, deltaTimeMs: number): void;
  setSize(width: number, height: number, dpr?: number): void;
  dispose(): void;
  getDomElement(): HTMLCanvasElement | null;
  onContextLost?(callback: () => void): () => void;
  onContextRestored?(callback: () => void): () => void;
}

export interface CreateScene3DOptions {
  readonly autoStart?: boolean;
  readonly adapter?: Renderer3DAdapter;
  readonly dpr?: number | "auto";
  readonly respectReducedMotion?: boolean;
}

export interface Scene3DInstance {
  readonly id: string;
  readonly definition: Scene3DDefinition;
  readonly adapter: Renderer3DAdapter | null;
  readonly capabilities: Scene3DCapabilities;
  readonly isRunning: boolean;
  readonly isAttached: boolean;
  readonly camera: Camera3DConfig;
  readonly lighting: Lighting3DConfig;
  readonly environment: Environment3DConfig;
  attach(canvas: HTMLCanvasElement): Promise<void> | void;
  detach(): void;
  start(): void;
  stop(): void;
  requestFrame(): void;
  addObject(object: Object3DConfig): void;
  removeObject(objectId: string): boolean;
  getObject(objectId: string): Object3DConfig | undefined;
  listObjects(): readonly Object3DConfig[];
  updateCamera(config: Partial<Camera3DConfig>): void;
  updateLighting(config: Partial<Lighting3DConfig>): void;
  updateEnvironment(config: Partial<Environment3DConfig>): void;
  resize(width?: number, height?: number, dpr?: number): void;
  getPerformanceStats(): ScenePerformanceStats;
  onContextLost(cb: () => void): () => void;
  onContextRestored(cb: () => void): () => void;
  destroy(): void;
}
