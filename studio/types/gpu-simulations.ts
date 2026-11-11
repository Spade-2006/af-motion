/**
 * AF Motion Studio — GPU Particles & Simulation Studio Type Definitions (Prompt 138)
 *
 * Types for GPU Simulation Backends, Advanced Particle Systems, Fluid & Flow Dynamics,
 * Environmental Effects, Interactive Spatial Forces, Simulation Composition,
 * Presets, Timeline Playback, Performance Intelligence Diagnostics, and Code Export.
 */

export type GpuSimulationViewMode =
  | "particles"
  | "fluid"
  | "environment"
  | "forces"
  | "backend"
  | "composition"
  | "presets";

export type SimulationEmitterType =
  | "point"
  | "box"
  | "sphere"
  | "circle"
  | "cone";

export type SimulationBlendMode =
  | "alpha"
  | "additive"
  | "screen"
  | "multiply";

export interface ParticleStudioConfig {
  count: number;
  emitterType: SimulationEmitterType;
  emissionRate: number;
  lifetime: number;
  speed: number;
  spread: number;
  startSize: number;
  endSize: number;
  startColor: string;
  endColor: string;
  blendMode: SimulationBlendMode;
  gravity: number;
  turbulence: number;
  drag: number;
  renderStrategy: "gpu-points" | "gpu-quads" | "canvas2d" | "auto";
}

export type FluidGridResolution = 32 | 64 | 128 | 256;

export type FluidBoundaryMode = "closed" | "open" | "periodic";

export type FluidVisualizationMode =
  | "density"
  | "smoke"
  | "ink"
  | "velocity"
  | "pressure";

export interface FluidStudioConfig {
  gridResolution: FluidGridResolution;
  viscosity: number;
  diffusion: number;
  pressureIterations: number;
  dissipation: number;
  boundaryMode: FluidBoundaryMode;
  visualizationMode: FluidVisualizationMode;
  dyeColor: string;
  vorticity: number;
  velocityDamping: number;
}

export type WeatherPresetType =
  | "clear"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "blizzard"
  | "fog"
  | "storm"
  | "firestorm"
  | "custom";

export type EnvironmentalEffectName =
  | "rain"
  | "snow"
  | "fog"
  | "clouds"
  | "fire"
  | "smoke"
  | "lightning"
  | "wind";

export interface EnvironmentStudioConfig {
  weatherPreset: WeatherPresetType;
  activeEffects: EnvironmentalEffectName[];
  density: number;
  speed: number;
  windDirection: [number, number];
  windIntensity: number;
  turbulence: number;
  precipitationRate: number;
  lightningFrequency: number;
  ambientTint: string;
}

export type ForceType =
  | "attraction"
  | "repulsion"
  | "vortex"
  | "drag"
  | "gravitational"
  | "turbulence";

export type ForceFalloffType =
  | "linear"
  | "inverse-square"
  | "smoothstep"
  | "none";

export interface ForceFieldItem {
  id: string;
  name: string;
  type: ForceType;
  strength: number;
  radius: number;
  falloff: ForceFalloffType;
  enabled: boolean;
  position: [number, number];
}

export type PointerInteractionMode =
  | "follow"
  | "push"
  | "swirl"
  | "click-burst"
  | "off";

export interface InteractiveForcesStudioConfig {
  activeForces: ForceFieldItem[];
  pointerMode: PointerInteractionMode;
  spatialGridEnabled: boolean;
  pointerStrength: number;
  pointerRadius: number;
}

export interface GpuBackendStudioConfig {
  backendPreference: "auto" | "webgpu" | "webgl2" | "cpu";
  activeBackend: "webgpu" | "webgl2" | "cpu";
  deviceInfo: {
    webgpuSupported: boolean;
    webgl2Supported: boolean;
    float32Textures: boolean;
    float16Textures: boolean;
    storageBuffers: boolean;
    computeShaders: boolean;
    maxTextureDimension: number;
    maxBufferSize: number;
    maxComputeWorkgroupSize: [number, number, number];
    rendererName: string;
  };
}

export interface SimulationCompositionLayer {
  id: string;
  name: string;
  type: "particle" | "fluid" | "environment" | "forces";
  enabled: boolean;
  opacity: number;
  blendMode: "normal" | "additive" | "screen" | "multiply";
  order: number;
}

export interface SimulationCompositionConfig {
  layers: SimulationCompositionLayer[];
  coupling: {
    fluidAdvectsParticles: boolean;
    windAffectsFluid: boolean;
    windAffectsParticles: boolean;
    pointerInfluencesAll: boolean;
  };
  timestepMode: "fixed" | "variable" | "substep";
  timeScale: number;
}

export interface GpuSimulationPreset {
  id: string;
  name: string;
  category: "particles" | "fluid" | "environment" | "interactive" | "composition";
  description: string;
  tags: string[];
  apply: (state: GpuSimulationStudioState) => GpuSimulationStudioState;
}

export interface GpuSimulationDiagnosticsData {
  fps: number;
  frameTimeMs: number;
  activeParticles: number;
  fluidGridCells: number;
  activeBackend: string;
  memoryEstimateMb: number;
  healthScore: number;
  healthStatus: string;
}

export interface GpuSimulationStudioState {
  viewMode: GpuSimulationViewMode;
  particles: ParticleStudioConfig;
  fluid: FluidStudioConfig;
  environment: EnvironmentStudioConfig;
  forces: InteractiveForcesStudioConfig;
  backend: GpuBackendStudioConfig;
  composition: SimulationCompositionConfig;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTimeMs: number;
  selectedPresetId: string | null;
  showExportModal: boolean;
  exportFormat: "react-hooks" | "react-components" | "vanilla" | "composition-json";
}
