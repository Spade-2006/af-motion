/**
 * AF Motion — Device Capability Detection Types
 *
 * Strongly-typed contracts for hardware, browser, rendering, memory, and runtime profiling.
 * Every field explicitly distinguishes between detected, estimated, unsupported,
 * unavailable, and unknown status without hardware fabrication.
 */

import type { RendererBackend } from "../../graphics/types.js";

// ============================================================================
// Detection Status
// ============================================================================

export type DetectionStatus =
  | "detected"     // Directly measured / queried via standard API
  | "estimated"    // Inferred via reliable multi-signal heuristic
  | "unsupported"  // API or feature definitely not supported on this platform
  | "unavailable"  // API exists but cannot be accessed (e.g. security/permission block)
  | "unknown";     // Insufficient signals to determine state

export interface ValueWithStatus<T> {
  readonly value: T;
  readonly status: DetectionStatus;
  readonly details?: string;
}

// ============================================================================
// Classification & Environment
// ============================================================================

export type DeviceCategory =
  | "low-end-mobile"
  | "standard-mobile"
  | "high-end-mobile"
  | "low-end-desktop"
  | "standard-desktop"
  | "high-end-desktop"
  | "tablet"
  | "unknown";

export type RuntimeEnvironment =
  | "browser"
  | "worker"
  | "dedicated-worker"
  | "offscreen-canvas"
  | "node"
  | "ssr"
  | "unknown";

// ============================================================================
// Hardware & Runtime Capabilities
// ============================================================================

export interface CpuCapabilityInfo {
  readonly concurrency: ValueWithStatus<number>;
  readonly wasmSupported: ValueWithStatus<boolean>;
  readonly sharedArrayBuffer: ValueWithStatus<boolean>;
  readonly simdSupported: ValueWithStatus<boolean>;
  readonly workerAvailable: ValueWithStatus<boolean>;
}

export interface MemoryCapabilityInfo {
  readonly deviceMemoryGB: ValueWithStatus<number | null>;
  readonly jsHeapLimitMB: ValueWithStatus<number | null>;
  readonly totalJSHeapMB: ValueWithStatus<number | null>;
  readonly usedJSHeapMB: ValueWithStatus<number | null>;
}

export interface RuntimeEnvironmentInfo {
  readonly environment: ValueWithStatus<RuntimeEnvironment>;
  readonly isBrowser: boolean;
  readonly isWorker: boolean;
  readonly isNode: boolean;
  readonly isSSR: boolean;
  readonly offscreenCanvasSupported: ValueWithStatus<boolean>;
  readonly userAgent: ValueWithStatus<string>;
  readonly platform: ValueWithStatus<string>;
  readonly browserName: ValueWithStatus<string>;
}

// ============================================================================
// Graphics Capabilities
// ============================================================================

export interface WebGLCapabilitiesInfo {
  readonly webgl1: ValueWithStatus<boolean>;
  readonly webgl2: ValueWithStatus<boolean>;
  readonly maxTextureSize: ValueWithStatus<number>;
  readonly maxCubeMapSize: ValueWithStatus<number>;
  readonly maxRenderBufferSize: ValueWithStatus<number>;
  readonly maxVertexAttributes: ValueWithStatus<number>;
  readonly maxTextureUnits: ValueWithStatus<number>;
  readonly maxUniformVectors: ValueWithStatus<number>;
  readonly maxViewportDimensions: ValueWithStatus<readonly [number, number]>;
  readonly shaderPrecision: ValueWithStatus<{
    readonly highp: boolean;
    readonly mediump: boolean;
    readonly lowp: boolean;
  }>;
  readonly floatTextures: ValueWithStatus<boolean>;
  readonly halfFloatTextures: ValueWithStatus<boolean>;
  readonly instancing: ValueWithStatus<boolean>;
  readonly timerQuery: ValueWithStatus<boolean>;
  readonly maxAnisotropy: ValueWithStatus<number>;
  readonly supportedExtensions: ValueWithStatus<readonly string[]>;
  readonly unmaskedVendor: ValueWithStatus<string>;
  readonly unmaskedRenderer: ValueWithStatus<string>;
}

export interface WebGPUCapabilitiesInfo {
  readonly apiAvailable: ValueWithStatus<boolean>;
  readonly adapterAvailable: ValueWithStatus<boolean>;
  readonly deviceAvailable: ValueWithStatus<boolean>;
  readonly computeShaderSupport: ValueWithStatus<boolean>;
  readonly maxTextureDimension2D: ValueWithStatus<number>;
  readonly maxBufferSize: ValueWithStatus<number>;
  readonly features: ValueWithStatus<readonly string[]>;
  readonly limits: ValueWithStatus<Readonly<Record<string, number>>>;
  readonly architecture: ValueWithStatus<string>;
}

export interface DisplayCapabilityInfo {
  readonly dpr: ValueWithStatus<number>;
  readonly viewportWidth: ValueWithStatus<number>;
  readonly viewportHeight: ValueWithStatus<number>;
  readonly screenWidth: ValueWithStatus<number>;
  readonly screenHeight: ValueWithStatus<number>;
  readonly colorDepth: ValueWithStatus<number>;
  readonly colorSpace: ValueWithStatus<"srgb" | "display-p3">;
  readonly reducedMotion: ValueWithStatus<boolean>;
  readonly reducedTransparency: ValueWithStatus<boolean>;
  readonly highContrast: ValueWithStatus<boolean>;
  readonly colorScheme: ValueWithStatus<"light" | "dark" | "unknown">;
}

export interface NetworkCapabilityInfo {
  readonly online: ValueWithStatus<boolean>;
  readonly effectiveType: ValueWithStatus<string>;
  readonly downlinkMbps: ValueWithStatus<number | null>;
  readonly rttMs: ValueWithStatus<number | null>;
  readonly saveData: ValueWithStatus<boolean>;
}

export interface BatteryCapabilityInfo {
  readonly charging: ValueWithStatus<boolean | null>;
  readonly level: ValueWithStatus<number | null>;
  readonly chargingTime: ValueWithStatus<number | null>;
  readonly dischargingTime: ValueWithStatus<number | null>;
}

// ============================================================================
// Capability Scoring
// ============================================================================

export interface DimensionScore {
  readonly score: number; // 0 to 100
  readonly confidence: "high" | "medium" | "low";
  readonly supportingSignals: readonly string[];
  readonly missingInformation: readonly string[];
  readonly rationale: string;
}

export interface CapabilityScores {
  readonly cpu: DimensionScore;
  readonly memory: DimensionScore;
  readonly gpu: DimensionScore;
  readonly graphicsFeatures: DimensionScore;
  readonly worker: DimensionScore;
  readonly rendering: DimensionScore;
  readonly overallScore: number; // Weighted composite
}

// ============================================================================
// Consolidated Device Capability Profile
// ============================================================================

export interface DeviceCapabilityProfile {
  readonly version: string;
  readonly category: DeviceCategory;
  readonly categoryRationale: string;
  readonly scores: CapabilityScores;
  readonly runtime: RuntimeEnvironmentInfo;
  readonly cpu: CpuCapabilityInfo;
  readonly memory: MemoryCapabilityInfo;
  readonly webgl: WebGLCapabilitiesInfo;
  readonly webgpu: WebGPUCapabilitiesInfo;
  readonly supportedGraphicsBackends: readonly RendererBackend[];
  readonly activeGraphicsBackend: RendererBackend;
  readonly display: DisplayCapabilityInfo;
  readonly network: NetworkCapabilityInfo;
  readonly battery: BatteryCapabilityInfo;
  readonly detectedAt: number;
}

// ============================================================================
// Options & Testing Mocks
// ============================================================================

export interface MockEnvironment {
  isBrowser?: boolean;
  isWorker?: boolean;
  isNode?: boolean;
  isSSR?: boolean;
  userAgent?: string;
  platform?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  webgl1?: boolean;
  webgl2?: boolean;
  webgpu?: boolean;
  maxTextureSize?: number;
  dpr?: number;
  reducedMotion?: boolean;
  online?: boolean;
  effectiveType?: string;
  saveData?: boolean;
  batteryCharging?: boolean;
  batteryLevel?: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  sharedArrayBuffer?: boolean;
}

export interface DeviceDetectionOptions {
  readonly forceRefresh?: boolean;
  readonly mockEnvironment?: MockEnvironment;
  readonly testCanvas?: HTMLCanvasElement | null;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly asyncProbes?: boolean;
}

export type CapabilityChangeListener = (
  profile: DeviceCapabilityProfile,
  changedKeys: readonly string[]
) => void;

export interface CapabilitySubscription {
  unsubscribe(): void;
}
