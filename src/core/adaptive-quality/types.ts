/**
 * AF Motion — Adaptive Rendering & Quality Engine Types
 *
 * Core interfaces, presets, setting keys, metrics, system policies,
 * and controller contracts for real-time adaptive rendering and simulation.
 */

import type { DeviceCapabilityProfile } from "../device-capabilities/types.js";

/**
 * Standard named quality presets.
 */
export type QualityPresetName =
  | "ultra"
  | "high"
  | "balanced"
  | "performance"
  | "battery-saver"
  | "custom";

/**
 * Categorical quality tiers for individual subsystems and features.
 */
export type FeatureQualityTier = "low" | "medium" | "high" | "ultra";
export type ShadowQualityTier = "disabled" | "low" | "medium" | "high";
export type LightingQualityTier = "simple" | "standard" | "advanced";
export type MaterialQualityTier = "basic" | "standard" | "pbr";
export type TextureQualityTier = "low" | "medium" | "high" | "full";
export type PostProcessingQualityTier = "disabled" | "low" | "medium" | "high";
export type EnvironmentalQualityTier = "low" | "medium" | "high";
export type GpuSimulationQualityTier = "cpu" | "webgl2" | "webgpu";

/**
 * Individual quality setting descriptor containing value, bounds, priority, and override state.
 */
export interface QualitySettingDescriptor<T> {
  /** Current effective value (override if set, otherwise auto value). */
  readonly current: T;
  /** Auto-computed value derived from active preset or adaptation logic. */
  readonly autoValue: T;
  /** Minimum permitted value (for numeric dimensions). */
  readonly min?: number;
  /** Maximum permitted value (for numeric dimensions). */
  readonly max?: number;
  /** Overall quality level associated with this setting. */
  readonly qualityLevel: QualityPresetName;
  /** Adaptation priority (1 = lowest/cut first, 10 = highest/preserve longest). */
  readonly adaptationPriority: number;
  /** Estimated relative performance impact of this dimension. */
  readonly estimatedImpact: "low" | "medium" | "high";
  /** Optional user override value. */
  readonly override?: T;
  /** Mode: "auto" when driven by the engine, "manual" when user override is active. */
  readonly mode: "auto" | "manual";
  /** Whether this setting is locked against automated adaptation. */
  readonly isLocked?: boolean;
}

/**
 * Unified quality settings map containing all 15 adaptive rendering dimensions.
 */
export interface UnifiedQualitySettings {
  /** Resolution scale factor (e.g. 0.25 to 1.0). */
  resolutionScale: QualitySettingDescriptor<number>;
  /** Device pixel ratio cap (e.g. 1.0 to 3.0). */
  dpr: QualitySettingDescriptor<number>;
  /** Geometry detail tier. */
  geometryDetail: QualitySettingDescriptor<FeatureQualityTier>;
  /** Model LOD level index (0 = full detail, 1 = 50%, 2 = 25%, 3 = 10%). */
  modelLod: QualitySettingDescriptor<number>;
  /** Shadow rendering quality. */
  shadowQuality: QualitySettingDescriptor<ShadowQualityTier>;
  /** Lighting computation quality. */
  lightingQuality: QualitySettingDescriptor<LightingQualityTier>;
  /** Material rendering quality. */
  materialQuality: QualitySettingDescriptor<MaterialQualityTier>;
  /** Texture resolution tier. */
  textureResolution: QualitySettingDescriptor<TextureQualityTier>;
  /** Post-processing effects tier. */
  postProcessing: QualitySettingDescriptor<PostProcessingQualityTier>;
  /** Particle density multiplier (e.g. 0.1 to 2.0). */
  particleDensity: QualitySettingDescriptor<number>;
  /** Fluid simulation resolution multiplier (e.g. 0.25 to 1.0). */
  fluidResolution: QualitySettingDescriptor<number>;
  /** Environmental effects detail tier. */
  environmentalDetail: QualitySettingDescriptor<EnvironmentalQualityTier>;
  /** Physics simulation frequency in Hz (e.g. 30 to 120). */
  physicsFrequency: QualitySettingDescriptor<number>;
  /** Animation update quality tier. */
  animationQuality: QualitySettingDescriptor<FeatureQualityTier>;
  /** GPU simulation compute backend and precision tier. */
  gpuSimulationQuality: QualitySettingDescriptor<GpuSimulationQualityTier>;
}

export type QualitySettingKey = keyof UnifiedQualitySettings;

/**
 * Raw values of all settings in a quality profile.
 */
export type QualityValues = {
  [K in QualitySettingKey]: UnifiedQualitySettings[K]["current"];
};

/**
 * Partial overrides for quality values.
 */
export type QualityOverrides = Partial<QualityValues>;

/**
 * Unified quality profile object.
 */
export interface QualityProfile {
  /** Active preset name or "custom". */
  readonly preset: QualityPresetName;
  /** Full settings map with descriptors, limits, priorities, and override states. */
  readonly settings: UnifiedQualitySettings;
  /** Fast lookup of current values. */
  readonly values: QualityValues;
  /** Whether overall automatic adaptation is currently enabled. */
  readonly isAutoAdaptive: boolean;
  /** Whether the entire profile is locked against automated adaptation. */
  readonly isLocked: boolean;
  /** Timestamp when this profile was generated or modified. */
  readonly timestamp: number;
}

/**
 * Initial quality recommendation result based on device capabilities.
 */
export interface QualityRecommendation {
  /** Recommended preset name. */
  readonly preset: QualityPresetName;
  /** Recommended baseline values. */
  readonly values: QualityValues;
  /** Human-readable rationale explaining the recommendation. */
  readonly rationale: string[];
  /** Underlying capability scores used for the decision. */
  readonly scores: {
    cpu: number;
    memory: number;
    gpu: number;
    composite: number;
  };
  /** Device category identified during detection. */
  readonly deviceCategory: string;
  /** Confidence score (0 to 1) for the recommendation. */
  readonly confidence: number;
}

/**
 * Real-time performance metrics snapshot.
 */
export interface PerformanceMetrics {
  /** Duration of the latest measured frame in milliseconds. */
  readonly frameDurationMs: number;
  /** Rolling average frames per second. */
  readonly averageFps: number;
  /** Frame duration variance (standard deviation in ms). */
  readonly frameTimeVariance: number;
  /** Total frame drops detected within the current sampling window. */
  readonly frameDrops: number;
  /** Count of long frames (> 33.3ms) in the sampling window. */
  readonly longFrames: number;
  /** CPU execution time spent on simulation in ms (if recorded). */
  readonly simulationTimeMs: number;
  /** CPU execution time spent on render submission in ms (if recorded). */
  readonly renderTimeMs: number;
  /** GPU timing in ms (if supported by WebGL timer queries or WebGPU). */
  readonly gpuTimeMs?: number;
  /** Whether true hardware GPU timing is supported in the current environment. */
  readonly isGpuTimingSupported: boolean;
  /** Workload complexity score or item count (e.g. active particles + meshes). */
  readonly workloadComplexity: number;
  /** Resource pressure score (0 to 1, estimated memory/thermal load). */
  readonly resourcePressure: number;
  /** Timestamp of the metrics snapshot. */
  readonly timestamp: number;
}

/**
 * Real-time frame submission input for recording.
 */
export interface FrameMetricsInput {
  /** Frame duration in milliseconds (required). */
  frameDurationMs: number;
  /** Optional simulation CPU duration in ms. */
  simulationTimeMs?: number;
  /** Optional render CPU duration in ms. */
  renderTimeMs?: number;
  /** Optional hardware GPU duration in ms. */
  gpuTimeMs?: number;
  /** Optional workload item count or complexity score. */
  workloadComplexity?: number;
  /** Optional resource pressure (0 to 1). */
  resourcePressure?: number;
}

/**
 * Adaptation event record stored in bounded history.
 */
export interface QualityAdaptationEvent {
  readonly timestamp: number;
  readonly type: "degrade" | "recover" | "preset_change" | "user_override" | "power_save";
  readonly previousPreset: QualityPresetName;
  readonly newPreset: QualityPresetName;
  readonly changedSettings: Partial<Record<QualitySettingKey, { from: any; to: any }>>;
  readonly reason: string;
  readonly triggerMetric?: {
    averageFps: number;
    frameDurationMs: number;
    frameDrops: number;
  };
}

/**
 * System-specific policy configurations derived from active quality values.
 */
export interface System3DQualityPolicy {
  maxLodLevel: number;
  shadowResolution: number;
  shadowsEnabled: boolean;
  maxLights: number;
  pbrMaterials: boolean;
  antialiasing: boolean;
  maxDrawCalls: number;
}

export interface SystemParticlesQualityPolicy {
  activeCountMultiplier: number;
  maxActiveParticles: number;
  spawnRateFactor: number;
  updateFrequency: number;
  useInstancing: boolean;
}

export interface SystemFluidQualityPolicy {
  gridResolutionScale: number;
  solverIterations: number;
  updateFrequency: number;
  highPrecision: boolean;
}

export interface SystemEnvironmentQualityPolicy {
  rainSnowDensityFactor: number;
  fogQuality: EnvironmentalQualityTier;
  cloudsEnabled: boolean;
  cloudDetail: EnvironmentalQualityTier;
  fireSmokeMaxParticles: number;
}

export interface SystemGpuSimulationQualityPolicy {
  preferredBackend: GpuSimulationQualityTier;
  workgroupSize: number;
  maxComputeBufferBytes: number;
  allowCpuFallback: boolean;
}

export interface SystemPhysicsQualityPolicy {
  substeps: number;
  simulationHz: number;
  solverIterations: number;
  enableSleeping: boolean;
  throttleNonCritical: boolean;
}

export interface SystemModelLodQualityPolicy {
  distanceMultiplier: number;
  targetTriangleRatio: number;
  maxLODIndex: number;
  allowSimplification: boolean;
}

/**
 * Aggregated system-specific policies container.
 */
export interface SystemQualityPolicies {
  scene3d: System3DQualityPolicy;
  particles: SystemParticlesQualityPolicy;
  fluid: SystemFluidQualityPolicy;
  environment: SystemEnvironmentQualityPolicy;
  gpuSimulation: SystemGpuSimulationQualityPolicy;
  physics: SystemPhysicsQualityPolicy;
  modelLod: SystemModelLodQualityPolicy;
}

/**
 * Dynamic resolution calculation result.
 */
export interface DynamicResolutionResult {
  /** Scaled width in physical canvas pixels. */
  readonly physicalWidth: number;
  /** Scaled height in physical canvas pixels. */
  readonly physicalHeight: number;
  /** Scaled width in CSS logical pixels. */
  readonly cssWidth: number;
  /** Scaled height in CSS logical pixels. */
  readonly cssHeight: number;
  /** Effective device pixel ratio applied. */
  readonly effectiveDpr: number;
  /** Resolution scale applied (e.g. 0.25 to 1.0). */
  readonly resolutionScale: number;
  /** Total physical pixels. */
  readonly totalPixels: number;
  /** Whether the resolution was capped by the maximum pixel budget. */
  readonly isPixelBudgetCapped: boolean;
}

/**
 * User quality preferences supplied during controller initialization or recommendation.
 */
export interface UserQualityPreferences {
  /** Desired target frame rate (default 60, e.g. 30, 60, 120). */
  targetFps?: number;
  /** Priority preference: "quality" favors visual fidelity, "performance" favors smooth frame rates, "power" favors battery. */
  preference?: "quality" | "performance" | "power";
  /** Maximum allowable DPR regardless of screen density. */
  maxDpr?: number;
  /** Minimum allowable resolution scale. */
  minResolutionScale?: number;
  /** Hard cap on total physical pixels (e.g. 1920 * 1080 = 2073600). */
  maxPixelBudget?: number;
  /** Initial preset choice to start with. */
  initialPreset?: QualityPresetName;
  /** Explicit per-setting overrides. */
  overrides?: QualityOverrides;
  /** Whether automated adaptation should be enabled initially (default true). */
  autoAdapt?: boolean;
}

/**
 * Configuration options for creating an Adaptive Quality Controller.
 */
export interface AdaptiveQualityControllerOptions {
  /** Optional pre-detected device capability profile (falls back to detection). */
  deviceProfile?: DeviceCapabilityProfile;
  /** User quality preferences. */
  preferences?: UserQualityPreferences;
  /** Number of frame measurements kept in sliding window (default 60, min 10, max 120). */
  samplingWindowSize?: number;
  /** FPS drop tolerance before triggering degradation (default: 8 FPS below target). */
  degradeFpsTolerance?: number;
  /** FPS recovery tolerance above target before triggering recovery (default: 2 FPS below target). */
  recoverFpsTolerance?: number;
  /** Consecutive slow frames needed to trigger degradation (default 15). */
  consecutiveSlowFramesThreshold?: number;
  /** Consecutive fast frames needed to trigger recovery (default 45). */
  consecutiveFastFramesThreshold?: number;
  /** Minimum cooldown between adaptation steps in milliseconds (default 1500). */
  adaptationCooldownMs?: number;
  /** Whether to automatically adapt to battery and power states (default true). */
  powerAware?: boolean;
}

/**
 * Listener function called when quality profile or metrics adapt.
 */
export type QualityChangeListener = (
  profile: QualityProfile,
  event?: QualityAdaptationEvent
) => void;

/**
 * Subscription handle for unsubscribing listeners.
 */
export interface QualitySubscription {
  unsubscribe: () => void;
}

/**
 * Public interface of an Adaptive Quality Controller instance.
 */
export interface IAdaptiveQualityController {
  readonly profile: QualityProfile;
  readonly metrics: PerformanceMetrics;
  readonly recommendation: QualityRecommendation;

  getCurrentQuality(): QualityPresetName;
  getQualityProfile(): QualityProfile;
  getRecommendedProfile(): QualityRecommendation;
  getPerformanceMetrics(): PerformanceMetrics;
  getEffectiveResolution(cssWidth: number, cssHeight: number): DynamicResolutionResult;
  getSystemPolicies(): SystemQualityPolicies;

  recordFrame(deltaTimeMs: number, extraMetrics?: Partial<FrameMetricsInput>): PerformanceMetrics;
  updatePerformanceMetrics(input: FrameMetricsInput): PerformanceMetrics;
  adaptQuality(): boolean;

  setQualityPreset(preset: QualityPresetName): void;
  setQualityOverride<K extends QualitySettingKey>(key: K, value: UnifiedQualitySettings[K]["current"]): void;
  clearQualityOverride(key: QualitySettingKey): void;
  clearAllQualityOverrides(): void;

  lockQualitySettings(locked: boolean): void;
  unlockQualitySettings(): void;
  resetToRecommendedQuality(): void;

  getQualityAdaptationHistory(): readonly QualityAdaptationEvent[];
  subscribe(listener: QualityChangeListener): QualitySubscription;
  dispose(): void;
}
