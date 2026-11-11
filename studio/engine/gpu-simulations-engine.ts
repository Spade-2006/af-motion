/**
 * AF Motion Studio — GPU Particles & Simulation Engine (Prompt 138)
 *
 * Provides factory states, backend capability detection, preset management,
 * Performance Intelligence telemetry, and multi-format code generation.
 */

import { defaultPerformanceIntelligence } from "../../src/core/performance-intelligence/index.js";
import { detectComputeCapabilities } from "../../src/graphics/gpu-simulation/capabilities.js";
import type {
  GpuSimulationStudioState,
  GpuBackendStudioConfig,
  GpuSimulationPreset,
  GpuSimulationDiagnosticsData,
} from "../types/gpu-simulations.js";

/**
 * Probes GPU compute capabilities safely for the studio.
 */
export function detectGpuBackendInfo(
  preference: "auto" | "webgpu" | "webgl2" | "cpu" = "auto"
): GpuBackendStudioConfig {
  let webgpu = false;
  let webgl2 = false;
  let float32 = false;
  let float16 = false;
  let storageBuffers = false;
  let computeShaders = false;
  let maxTex = 2048;
  let maxBuf = 64 * 1024 * 1024;
  let workgroup: [number, number, number] = [256, 256, 64];
  let renderer = "Software / CPU Fallback";

  try {
    const caps = detectComputeCapabilities({ forceBackend: preference });
    webgpu = caps.webgpu;
    webgl2 = caps.webgl2;
    float32 = caps.float32Textures;
    float16 = caps.float16Textures;
    storageBuffers = caps.storageBuffers;
    computeShaders = caps.computeShaders;
    maxTex = caps.maxTextureDimension || 2048;
    maxBuf = caps.maxBufferSize || 67108864;
    workgroup = caps.maxComputeWorkgroupSize as [number, number, number] || [256, 256, 64];

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (webgpu) {
        renderer = "WebGPU Accelerated Compute Engine";
      } else if (webgl2) {
        renderer = "WebGL2 Transform-Feedback / Texture Compute Engine";
      }
    }
  } catch {
    // Graceful fallback for tests or headless environments
  }

  const activeBackend: "webgpu" | "webgl2" | "cpu" =
    preference !== "auto"
      ? preference
      : webgpu
      ? "webgpu"
      : webgl2
      ? "webgl2"
      : "cpu";

  return {
    backendPreference: preference,
    activeBackend,
    deviceInfo: {
      webgpuSupported: webgpu,
      webgl2Supported: webgl2,
      float32Textures: float32,
      float16Textures: float16,
      storageBuffers: storageBuffers,
      computeShaders: computeShaders,
      maxTextureDimension: maxTex,
      maxBufferSize: maxBuf,
      maxComputeWorkgroupSize: workgroup,
      rendererName: renderer,
    },
  };
}

/**
 * Creates the default initial state for GPU Simulation Studio.
 */
export function createDefaultGpuSimulationStudioState(): GpuSimulationStudioState {
  const backendConfig = detectGpuBackendInfo("auto");

  return {
    viewMode: "particles",
    particles: {
      count: 6000,
      emitterType: "point",
      emissionRate: 400,
      lifetime: 3.5,
      speed: 120,
      spread: 0.8,
      startSize: 4,
      endSize: 1,
      startColor: "rgba(59, 130, 246, 0.9)",
      endColor: "rgba(168, 85, 247, 0.1)",
      blendMode: "additive",
      gravity: 20,
      turbulence: 45,
      drag: 0.05,
      renderStrategy: "auto",
    },
    fluid: {
      gridResolution: 64,
      viscosity: 0.0001,
      diffusion: 0.00005,
      pressureIterations: 24,
      dissipation: 0.992,
      boundaryMode: "closed",
      visualizationMode: "smoke",
      dyeColor: "#38bdf8",
      vorticity: 30,
      velocityDamping: 0.985,
    },
    environment: {
      weatherPreset: "rain",
      activeEffects: ["rain", "wind", "lightning"],
      density: 0.75,
      speed: 1.2,
      windDirection: [0.85, 0.25],
      windIntensity: 40,
      turbulence: 15,
      precipitationRate: 1500,
      lightningFrequency: 0.2,
      ambientTint: "rgba(15, 23, 42, 0.4)",
    },
    forces: {
      activeForces: [
        {
          id: "force-1",
          name: "Center Vortex",
          type: "vortex",
          strength: 180,
          radius: 240,
          falloff: "smoothstep",
          enabled: true,
          position: [0.5, 0.5],
        },
        {
          id: "force-2",
          name: "Gravitational Core",
          type: "gravitational",
          strength: 90,
          radius: 180,
          falloff: "inverse-square",
          enabled: true,
          position: [0.5, 0.5],
        },
      ],
      pointerMode: "follow",
      spatialGridEnabled: true,
      pointerStrength: 150,
      pointerRadius: 160,
    },
    backend: backendConfig,
    composition: {
      layers: [
        { id: "layer-env", name: "Atmospheric Environment", type: "environment", enabled: true, opacity: 0.7, blendMode: "screen", order: 1 },
        { id: "layer-fluid", name: "Eulerian Fluid Layer", type: "fluid", enabled: true, opacity: 0.85, blendMode: "additive", order: 2 },
        { id: "layer-particles", name: "GPU Particle System", type: "particle", enabled: true, opacity: 1.0, blendMode: "additive", order: 3 },
        { id: "layer-forces", name: "Spatial Force Fields", type: "forces", enabled: true, opacity: 1.0, blendMode: "normal", order: 4 },
      ],
      coupling: {
        fluidAdvectsParticles: true,
        windAffectsFluid: true,
        windAffectsParticles: true,
        pointerInfluencesAll: true,
      },
      timestepMode: "variable",
      timeScale: 1.0,
    },
    isPlaying: true,
    playbackSpeed: 1.0,
    currentTimeMs: 0,
    selectedPresetId: null,
    showExportModal: false,
    exportFormat: "react-hooks",
  };
}

/**
 * 25 Comprehensive Simulation Presets
 */
export const SIMULATION_PRESETS: GpuSimulationPreset[] = [
  // 1-5: Particles
  {
    id: "preset-galaxy",
    name: "Cosmic Galaxy",
    category: "particles",
    description: "Vortex-driven spiral galaxy of glowing starlight with subtle color ramps.",
    tags: ["galaxy", "space", "spiral", "vortex"],
    apply: (state) => ({
      ...state,
      viewMode: "particles",
      particles: {
        ...state.particles,
        count: 12000,
        emitterType: "sphere",
        speed: 80,
        spread: 1.2,
        startSize: 3,
        endSize: 0.5,
        startColor: "rgba(147, 51, 234, 0.95)",
        endColor: "rgba(56, 189, 248, 0.1)",
        blendMode: "additive",
        turbulence: 60,
        gravity: 0,
      },
    }),
  },
  {
    id: "preset-fireworks",
    name: "Neon Fireworks",
    category: "particles",
    description: "High-velocity explosive particle bursts with drag and gravitational descent.",
    tags: ["fireworks", "burst", "explosive", "celebration"],
    apply: (state) => ({
      ...state,
      viewMode: "particles",
      particles: {
        ...state.particles,
        count: 8000,
        emitterType: "point",
        speed: 280,
        spread: 3.14,
        startSize: 5,
        endSize: 1,
        startColor: "rgba(244, 63, 94, 0.95)",
        endColor: "rgba(251, 191, 36, 0.1)",
        blendMode: "additive",
        gravity: 120,
        drag: 0.12,
      },
    }),
  },
  {
    id: "preset-fireflies",
    name: "Firefly Swarm",
    category: "particles",
    description: "Gentle organic glowing particles wandering through low turbulence fields.",
    tags: ["organic", "nature", "glow", "gentle"],
    apply: (state) => ({
      ...state,
      viewMode: "particles",
      particles: {
        ...state.particles,
        count: 3500,
        emitterType: "box",
        speed: 25,
        spread: 1.5,
        startSize: 6,
        endSize: 2,
        startColor: "rgba(163, 230, 53, 0.9)",
        endColor: "rgba(34, 197, 94, 0.15)",
        blendMode: "additive",
        turbulence: 25,
        gravity: -5,
      },
    }),
  },
  {
    id: "preset-sparkler",
    name: "Sparkler Burst",
    category: "particles",
    description: "Rapid high-frequency sparks with short lifetimes and sharp trajectories.",
    tags: ["sparks", "rapid", "electric"],
    apply: (state) => ({
      ...state,
      viewMode: "particles",
      particles: {
        ...state.particles,
        count: 7500,
        emitterType: "cone",
        speed: 320,
        spread: 0.6,
        lifetime: 1.2,
        startSize: 3,
        endSize: 0.5,
        startColor: "rgba(254, 240, 138, 0.95)",
        endColor: "rgba(249, 115, 22, 0.1)",
        blendMode: "additive",
        gravity: 80,
      },
    }),
  },
  {
    id: "preset-stardust",
    name: "Stardust Stream",
    category: "particles",
    description: "Continuous directional cosmic slipstream with smooth velocity falloff.",
    tags: ["stardust", "stream", "flow"],
    apply: (state) => ({
      ...state,
      viewMode: "particles",
      particles: {
        ...state.particles,
        count: 10000,
        emitterType: "line" as any,
        speed: 160,
        spread: 0.3,
        lifetime: 4.0,
        startSize: 3.5,
        endSize: 0.8,
        startColor: "rgba(192, 132, 252, 0.9)",
        endColor: "rgba(96, 165, 250, 0.05)",
        blendMode: "additive",
        turbulence: 30,
        gravity: 0,
      },
    }),
  },

  // 6-10: Fluid
  {
    id: "preset-ink-drop",
    name: "Midnight Ink Drop",
    category: "fluid",
    description: "High-contrast fluid dispersion simulating dense ink expanding into water.",
    tags: ["ink", "water", "dispersion", "viscous"],
    apply: (state) => ({
      ...state,
      viewMode: "fluid",
      fluid: {
        ...state.fluid,
        gridResolution: 128,
        viscosity: 0.0003,
        diffusion: 0.0001,
        dissipation: 0.995,
        visualizationMode: "ink",
        dyeColor: "#0284c7",
        vorticity: 45,
      },
    }),
  },
  {
    id: "preset-smoke-plume",
    name: "Volcanic Smoke Plume",
    category: "fluid",
    description: "Turbulent buoyant plume with vorticity confinement and atmospheric dissipation.",
    tags: ["smoke", "volcanic", "plume", "buoyancy"],
    apply: (state) => ({
      ...state,
      viewMode: "fluid",
      fluid: {
        ...state.fluid,
        gridResolution: 64,
        viscosity: 0.00005,
        diffusion: 0.00008,
        dissipation: 0.988,
        visualizationMode: "smoke",
        dyeColor: "#94a3b8",
        vorticity: 50,
      },
    }),
  },
  {
    id: "preset-vortex-hydro",
    name: "Vortex Hydro Swirl",
    category: "fluid",
    description: "High-speed rotational fluid flow with dynamic velocity vectors.",
    tags: ["vortex", "swirl", "velocity", "hydro"],
    apply: (state) => ({
      ...state,
      viewMode: "fluid",
      fluid: {
        ...state.fluid,
        gridResolution: 64,
        viscosity: 0.00002,
        visualizationMode: "velocity",
        dyeColor: "#06b6d4",
        vorticity: 60,
      },
    }),
  },
  {
    id: "preset-viscous-amber",
    name: "Viscous Amber",
    category: "fluid",
    description: "Thick honey-like fluid with high viscosity and slow smooth diffusion.",
    tags: ["viscous", "amber", "honey", "slow"],
    apply: (state) => ({
      ...state,
      viewMode: "fluid",
      fluid: {
        ...state.fluid,
        gridResolution: 64,
        viscosity: 0.005,
        diffusion: 0.00002,
        dissipation: 0.998,
        visualizationMode: "density",
        dyeColor: "#f59e0b",
        vorticity: 15,
      },
    }),
  },
  {
    id: "preset-color-splash",
    name: "Chromatic Color Splash",
    category: "fluid",
    description: "Vibrant high-contrast pressure field with dynamic multi-spectral dye.",
    tags: ["chromatic", "color", "splash", "pressure"],
    apply: (state) => ({
      ...state,
      viewMode: "fluid",
      fluid: {
        ...state.fluid,
        gridResolution: 128,
        visualizationMode: "pressure",
        dyeColor: "#ec4899",
        vorticity: 35,
      },
    }),
  },

  // 11-15: Environment
  {
    id: "preset-blizzard",
    name: "Arctic Blizzard",
    category: "environment",
    description: "Fierce horizontal winds driving dense snowflakes and whiteout fog.",
    tags: ["snow", "blizzard", "winter", "cold"],
    apply: (state) => ({
      ...state,
      viewMode: "environment",
      environment: {
        ...state.environment,
        weatherPreset: "blizzard",
        activeEffects: ["snow", "wind", "fog"],
        density: 0.95,
        speed: 2.2,
        windDirection: [0.95, 0.15],
        windIntensity: 85,
        turbulence: 40,
        precipitationRate: 3500,
        ambientTint: "rgba(224, 242, 254, 0.4)",
      },
    }),
  },
  {
    id: "preset-monsoon",
    name: "Monsoon Downpour",
    category: "environment",
    description: "Heavy rainstorm with intense precipitation, gusts, and lightning flashes.",
    tags: ["rain", "storm", "lightning", "monsoon"],
    apply: (state) => ({
      ...state,
      viewMode: "environment",
      environment: {
        ...state.environment,
        weatherPreset: "heavy-rain",
        activeEffects: ["rain", "wind", "lightning"],
        density: 0.9,
        speed: 1.8,
        windDirection: [0.6, 0.8],
        windIntensity: 65,
        precipitationRate: 4000,
        lightningFrequency: 0.6,
        ambientTint: "rgba(15, 23, 42, 0.6)",
      },
    }),
  },
  {
    id: "preset-misty-forest",
    name: "Misty Highlands",
    category: "environment",
    description: "Low-velocity atmospheric fog and drifting clouds with gentle morning breeze.",
    tags: ["fog", "mist", "clouds", "calm"],
    apply: (state) => ({
      ...state,
      viewMode: "environment",
      environment: {
        ...state.environment,
        weatherPreset: "fog",
        activeEffects: ["fog", "clouds", "wind"],
        density: 0.6,
        speed: 0.4,
        windDirection: [0.3, 0.1],
        windIntensity: 12,
        turbulence: 8,
        ambientTint: "rgba(51, 65, 85, 0.35)",
      },
    }),
  },
  {
    id: "preset-inferno",
    name: "Inferno Wildfire",
    category: "environment",
    description: "Intense convective thermal updraft with rising embers, smoke, and flames.",
    tags: ["fire", "smoke", "embers", "inferno"],
    apply: (state) => ({
      ...state,
      viewMode: "environment",
      environment: {
        ...state.environment,
        weatherPreset: "firestorm",
        activeEffects: ["fire", "smoke", "wind"],
        density: 0.85,
        speed: 1.6,
        windDirection: [0.1, -0.9],
        windIntensity: 50,
        turbulence: 55,
        ambientTint: "rgba(127, 29, 29, 0.45)",
      },
    }),
  },
  {
    id: "preset-thunderstorm",
    name: "Severe Thunderstorm",
    category: "environment",
    description: "High-altitude storm clouds with frequent electric discharge and driving rain.",
    tags: ["thunderstorm", "electric", "dark", "dramatic"],
    apply: (state) => ({
      ...state,
      viewMode: "environment",
      environment: {
        ...state.environment,
        weatherPreset: "storm",
        activeEffects: ["rain", "lightning", "clouds", "wind"],
        density: 0.85,
        speed: 1.5,
        windDirection: [0.7, 0.4],
        windIntensity: 55,
        lightningFrequency: 0.8,
        ambientTint: "rgba(30, 27, 75, 0.55)",
      },
    }),
  },

  // 16-20: Interactive
  {
    id: "preset-magnetic-core",
    name: "Magnetic Core",
    category: "interactive",
    description: "Central dipolar attraction field pulling particles into resonant orbits.",
    tags: ["magnetic", "attraction", "orbits", "gravity"],
    apply: (state) => ({
      ...state,
      viewMode: "forces",
      forces: {
        ...state.forces,
        pointerMode: "follow",
        pointerStrength: 220,
        pointerRadius: 200,
        activeForces: [
          {
            id: "force-core",
            name: "Dipole Magnet",
            type: "attraction",
            strength: 240,
            radius: 260,
            falloff: "smoothstep",
            enabled: true,
            position: [0.5, 0.5],
          },
        ],
      },
    }),
  },
  {
    id: "preset-black-hole",
    name: "Supermassive Black Hole",
    category: "interactive",
    description: "Extreme gravitational singularity with an event horizon and vortex spiral.",
    tags: ["black-hole", "singularity", "extreme", "space"],
    apply: (state) => ({
      ...state,
      viewMode: "forces",
      forces: {
        ...state.forces,
        pointerMode: "swirl",
        pointerStrength: 300,
        pointerRadius: 280,
        activeForces: [
          {
            id: "bh-grav",
            name: "Event Horizon Pull",
            type: "gravitational",
            strength: 320,
            radius: 300,
            falloff: "inverse-square",
            enabled: true,
            position: [0.5, 0.5],
          },
          {
            id: "bh-vortex",
            name: "Accretion Disk Vortex",
            type: "vortex",
            strength: 280,
            radius: 260,
            falloff: "smoothstep",
            enabled: true,
            position: [0.5, 0.5],
          },
        ],
      },
    }),
  },
  {
    id: "preset-kinetic-repulsor",
    name: "Kinetic Repulsor",
    category: "interactive",
    description: "High-powered repulsive shockwave clearing all particles on cursor touch.",
    tags: ["repulsion", "shockwave", "interactive", "push"],
    apply: (state) => ({
      ...state,
      viewMode: "forces",
      forces: {
        ...state.forces,
        pointerMode: "push",
        pointerStrength: 350,
        pointerRadius: 240,
        activeForces: [
          {
            id: "rep-1",
            name: "Center Shield",
            type: "repulsion",
            strength: 250,
            radius: 200,
            falloff: "linear",
            enabled: true,
            position: [0.5, 0.5],
          },
        ],
      },
    }),
  },
  {
    id: "preset-vortex-portal",
    name: "Vortex Portal",
    category: "interactive",
    description: "Interdimensional swirling force corridor with drag dampening.",
    tags: ["portal", "vortex", "swirl", "magic"],
    apply: (state) => ({
      ...state,
      viewMode: "forces",
      forces: {
        ...state.forces,
        pointerMode: "swirl",
        pointerStrength: 260,
        pointerRadius: 220,
        activeForces: [
          {
            id: "portal-vortex",
            name: "Portal Core",
            type: "vortex",
            strength: 300,
            radius: 280,
            falloff: "smoothstep",
            enabled: true,
            position: [0.5, 0.5],
          },
          {
            id: "portal-drag",
            name: "Aether Drag",
            type: "drag",
            strength: 40,
            radius: 300,
            falloff: "none",
            enabled: true,
            position: [0.5, 0.5],
          },
        ],
      },
    }),
  },
  {
    id: "preset-turbulent-ether",
    name: "Turbulent Ether",
    category: "interactive",
    description: "Multi-scale curl noise turbulence field coupled to pointer impulse.",
    tags: ["turbulence", "noise", "curl", "ether"],
    apply: (state) => ({
      ...state,
      viewMode: "forces",
      forces: {
        ...state.forces,
        pointerMode: "click-burst",
        pointerStrength: 200,
        pointerRadius: 180,
        activeForces: [
          {
            id: "force-turb",
            name: "Spatial Turbulence",
            type: "turbulence",
            strength: 150,
            radius: 350,
            falloff: "smoothstep",
            enabled: true,
            position: [0.5, 0.5],
          },
        ],
      },
    }),
  },

  // 21-25: Composition
  {
    id: "preset-storm-ocean",
    name: "Tempest at Sea",
    category: "composition",
    description: "Full multi-system synchronization: heavy rain, fluid waves, spray particles, and stormy winds.",
    tags: ["composition", "tempest", "ocean", "storm", "sync"],
    apply: (state) => ({
      ...state,
      viewMode: "composition",
      composition: {
        ...state.composition,
        coupling: {
          fluidAdvectsParticles: true,
          windAffectsFluid: true,
          windAffectsParticles: true,
          pointerInfluencesAll: true,
        },
      },
      environment: {
        ...state.environment,
        weatherPreset: "storm",
        activeEffects: ["rain", "wind", "lightning"],
        density: 0.9,
      },
      fluid: {
        ...state.fluid,
        visualizationMode: "velocity",
        viscosity: 0.0001,
      },
      particles: {
        ...state.particles,
        count: 7000,
        startColor: "rgba(56, 189, 248, 0.8)",
      },
    }),
  },
  {
    id: "preset-celestial-nebula",
    name: "Celestial Nebula",
    category: "composition",
    description: "Fluid advection driving thousands of glowing star particles across an ethereal backdrop.",
    tags: ["nebula", "space", "celestial", "stars", "sync"],
    apply: (state) => ({
      ...state,
      viewMode: "composition",
      composition: {
        ...state.composition,
        coupling: {
          fluidAdvectsParticles: true,
          windAffectsFluid: false,
          windAffectsParticles: true,
          pointerInfluencesAll: true,
        },
      },
      fluid: {
        ...state.fluid,
        visualizationMode: "smoke",
        dyeColor: "#a855f7",
        viscosity: 0.00005,
      },
      particles: {
        ...state.particles,
        count: 10000,
        startColor: "rgba(236, 72, 153, 0.9)",
        endColor: "rgba(59, 130, 246, 0.1)",
      },
    }),
  },
  {
    id: "preset-arcane-ritual",
    name: "Arcane Ritual",
    category: "composition",
    description: "Interactive magic circle combining vortex forces, ink dispersion, and radiant energy sparks.",
    tags: ["magic", "arcane", "sparks", "ritual"],
    apply: (state) => ({
      ...state,
      viewMode: "composition",
      forces: {
        ...state.forces,
        pointerMode: "swirl",
      },
      particles: {
        ...state.particles,
        count: 8000,
        startColor: "rgba(234, 179, 8, 0.95)",
        endColor: "rgba(168, 85, 247, 0.1)",
      },
      fluid: {
        ...state.fluid,
        visualizationMode: "density",
        dyeColor: "#8b5cf6",
      },
    }),
  },
  {
    id: "preset-bioluminescent",
    name: "Bioluminescent Abyss",
    category: "composition",
    description: "Deep-ocean fluid currents carrying bioluminescent organisms responding to touch.",
    tags: ["ocean", "bioluminescent", "deep", "glow"],
    apply: (state) => ({
      ...state,
      viewMode: "composition",
      particles: {
        ...state.particles,
        count: 5000,
        startColor: "rgba(20, 184, 166, 0.9)",
        endColor: "rgba(6, 182, 212, 0.1)",
      },
      fluid: {
        ...state.fluid,
        visualizationMode: "ink",
        dyeColor: "#0f766e",
      },
    }),
  },
  {
    id: "preset-cyber-matrix",
    name: "Cyber Matrix Rain",
    category: "composition",
    description: "Vertical digital code streams coupled with horizontal repulsive cursor interaction.",
    tags: ["cyber", "matrix", "digital", "rain"],
    apply: (state) => ({
      ...state,
      viewMode: "composition",
      environment: {
        ...state.environment,
        weatherPreset: "rain",
        activeEffects: ["rain", "wind"],
        windDirection: [0, 1],
        ambientTint: "rgba(2, 44, 34, 0.5)",
      },
      particles: {
        ...state.particles,
        startColor: "rgba(34, 197, 94, 0.95)",
        endColor: "rgba(16, 185, 129, 0.1)",
      },
    }),
  },
];

/**
 * Applies a preset by ID to the studio state.
 */
export function applySimulationPreset(
  state: GpuSimulationStudioState,
  presetId: string
): GpuSimulationStudioState {
  const found = SIMULATION_PRESETS.find((p) => p.id === presetId);
  if (!found) return state;
  const updated = found.apply(state);
  return {
    ...updated,
    selectedPresetId: presetId,
  };
}

/**
 * Gathers live diagnostics combining Simulation Studio stats with
 * the unified Phase 16 Performance Intelligence telemetry.
 */
export function getSimulationDiagnostics(
  state: GpuSimulationStudioState
): GpuSimulationDiagnosticsData {
  const health = defaultPerformanceIntelligence?.health;
  const context = defaultPerformanceIntelligence?.context;

  const fps = context?.fps ?? 60;
  const frameTimeMs = fps > 0 ? Number((1000 / fps).toFixed(2)) : 16.67;
  const gridDim = state.fluid.gridResolution;
  const fluidGridCells = gridDim * gridDim;

  // Approximate memory consumption: particles (48 bytes/ptcl) + fluid grid (6 floats/cell)
  const particleBytes = state.particles.count * 48;
  const fluidBytes = fluidGridCells * 4 * 6;
  const memoryEstimateMb = Number(((particleBytes + fluidBytes) / (1024 * 1024) + 12).toFixed(2));

  return {
    fps,
    frameTimeMs,
    activeParticles: state.particles.count,
    fluidGridCells,
    activeBackend: state.backend.activeBackend.toUpperCase(),
    memoryEstimateMb,
    healthScore: health ? Math.round(health.overallHealth.score) : 98,
    healthStatus: health ? health.overallHealth.status : "optimal",
  };
}

/**
 * Generates ready-to-use production code across 4 formats:
 * React Hooks, React Components, Vanilla API, and Composition JSON.
 */
export function generateSimulationExportBundle(state: GpuSimulationStudioState) {
  const { particles, fluid, environment, forces, composition, backend } = state;

  const reactHookCode = `import React, { useRef, useEffect } from "react";
import {
  useGPUSimulation,
  useParticleSystem,
  useFluidSimulation,
  useEnvironmentSimulation,
  useInteractiveForces,
} from "af-motion/react";

export function SimulationShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Initialize GPU Simulation Engine
  const { isReady, activeBackend, fps } = useGPUSimulation({
    canvas: canvasRef,
    preference: "${backend.backendPreference}",
    timestepMode: "${composition.timestepMode}",
    timeScale: ${composition.timeScale},
  });

  // 2. High-Performance Particle Engine
  const { emitBurst } = useParticleSystem({
    count: ${particles.count},
    emitter: {
      type: "${particles.emitterType}",
      emissionRate: ${particles.emissionRate},
    },
    lifetime: ${particles.lifetime},
    speed: ${particles.speed},
    spread: ${particles.spread},
    startColor: "${particles.startColor}",
    endColor: "${particles.endColor}",
    blendMode: "${particles.blendMode}",
    gravity: ${particles.gravity},
    turbulence: ${particles.turbulence},
    drag: ${particles.drag},
  });

  // 3. Eulerian Fluid Dynamic Solver
  const { addImpulse, addDye } = useFluidSimulation({
    gridResolution: ${fluid.gridResolution},
    viscosity: ${fluid.viscosity},
    diffusion: ${fluid.diffusion},
    dissipation: ${fluid.dissipation},
    vorticity: ${fluid.vorticity},
    visualizationMode: "${fluid.visualizationMode}",
    dyeColor: "${fluid.dyeColor}",
  });

  // 4. Atmospheric Environmental Simulation
  useEnvironmentSimulation({
    preset: "${environment.weatherPreset}",
    effects: ${JSON.stringify(environment.activeEffects)},
    density: ${environment.density},
    speed: ${environment.speed},
    windDirection: [${environment.windDirection[0]}, ${environment.windDirection[1]}],
    windIntensity: ${environment.windIntensity},
    lightningFrequency: ${environment.lightningFrequency},
  });

  // 5. Interactive Spatial Force Field
  const { triggerImpulse } = useInteractiveForces({
    pointerMode: "${forces.pointerMode}",
    pointerStrength: ${forces.pointerStrength},
    pointerRadius: ${forces.pointerRadius},
    spatialGrid: ${forces.spatialGridEnabled},
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          triggerImpulse(e.clientX - rect.left, e.clientY - rect.top, 250);
          emitBurst(100);
        }}
      />
    </div>
  );
}`;

  const reactComponentCode = `import React from "react";
import {
  SimulationCanvas,
  ParticleSystemLayer,
  FluidLayer,
  EnvironmentLayer,
  ForceFieldLayer,
} from "af-motion/react";

export function ComposedSimulationApp() {
  return (
    <SimulationCanvas
      backend="${backend.backendPreference}"
      timestepMode="${composition.timestepMode}"
      coupling={{
        fluidAdvectsParticles: ${composition.coupling.fluidAdvectsParticles},
        windAffectsFluid: ${composition.coupling.windAffectsFluid},
        windAffectsParticles: ${composition.coupling.windAffectsParticles},
        pointerInfluencesAll: ${composition.coupling.pointerInfluencesAll},
      }}
      style={{ width: "100%", height: "600px", borderRadius: "12px" }}
    >
      <EnvironmentLayer
        preset="${environment.weatherPreset}"
        density={${environment.density}}
        speed={${environment.speed}}
        windDirection={[${environment.windDirection[0]}, ${environment.windDirection[1]}]}
        windIntensity={${environment.windIntensity}}
        opacity={0.7}
      />
      <FluidLayer
        resolution={${fluid.gridResolution}}
        viscosity={${fluid.viscosity}}
        visualization="${fluid.visualizationMode}"
        dyeColor="${fluid.dyeColor}"
        opacity={0.85}
      />
      <ParticleSystemLayer
        count={${particles.count}}
        emitterType="${particles.emitterType}"
        speed={${particles.speed}}
        startColor="${particles.startColor}"
        endColor="${particles.endColor}"
        blendMode="${particles.blendMode}"
        gravity={${particles.gravity}}
        turbulence={${particles.turbulence}}
        opacity={1.0}
      />
      <ForceFieldLayer
        pointerMode="${forces.pointerMode}"
        pointerStrength={${forces.pointerStrength}}
        pointerRadius={${forces.pointerRadius}}
      />
    </SimulationCanvas>
  );
}`;

  const vanillaCode = `import {
  createSimulationEngine,
  createParticleSystem,
  createFluidSimulation,
  createEnvironment,
  SimulationCoordinator,
} from "af-motion";

// 1. Create Core Simulation Canvas & Master Engine
const canvas = document.getElementById("sim-canvas") as HTMLCanvasElement;
const engine = await createSimulationEngine({
  canvas,
  preference: "${backend.backendPreference}",
});

// 2. Instantiate Coordinated Subsystems
const particles = createParticleSystem({
  count: ${particles.count},
  emitterType: "${particles.emitterType}",
  speed: ${particles.speed},
  startColor: "${particles.startColor}",
  endColor: "${particles.endColor}",
  blendMode: "${particles.blendMode}",
  gravity: ${particles.gravity},
  turbulence: ${particles.turbulence},
});

const fluid = createFluidSimulation({
  gridResolution: ${fluid.gridResolution},
  viscosity: ${fluid.viscosity},
  dissipation: ${fluid.dissipation},
  visualizationMode: "${fluid.visualizationMode}",
  dyeColor: "${fluid.dyeColor}",
});

const environment = createEnvironment({
  weatherPreset: "${environment.weatherPreset}",
  density: ${environment.density},
  windDirection: [${environment.windDirection[0]}, ${environment.windDirection[1]}],
  windIntensity: ${environment.windIntensity},
});

// 3. Assemble Unified Coordinator
const coordinator = new SimulationCoordinator({
  engine,
  timestepMode: "${composition.timestepMode}",
  coupling: {
    fluidAdvectsParticles: ${composition.coupling.fluidAdvectsParticles},
    windAffectsFluid: ${composition.coupling.windAffectsFluid},
    windAffectsParticles: ${composition.coupling.windAffectsParticles},
  },
});

coordinator.register("particles", particles, { priority: 2 });
coordinator.register("fluid", fluid, { priority: 1 });
coordinator.register("environment", environment, { priority: 0 });

// 4. Start Real-Time Simulation Loop
coordinator.start();`;

  const compositionJson = JSON.stringify(
    {
      version: "1.0.0",
      studio: "AF Motion GPU Particles & Simulation Studio",
      backend: {
        preference: backend.backendPreference,
        active: backend.activeBackend,
      },
      particles,
      fluid,
      environment,
      forces,
      composition,
    },
    null,
    2
  );

  return {
    reactHookCode,
    reactComponentCode,
    vanillaCode,
    compositionJson,
  };
}
