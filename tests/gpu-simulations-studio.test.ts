/**
 * AF Motion Studio — GPU Particles & Simulation Studio Test Suite (Prompt 138)
 *
 * Verifies GPU Simulation Studio workspace integration, backend hardware probing,
 * particle system dynamics, Eulerian fluid solver, atmospheric environmental effects,
 * interactive spatial forces, multi-system composition coupling, presets, timeline,
 * Performance Intelligence diagnostics, and multi-format code export.
 */

import { describe, it, expect, beforeEach } from "vitest";
import React, { createElement } from "react";
import { renderToString } from "react-dom/server";

import {
  createDefaultGpuSimulationStudioState,
  detectGpuBackendInfo,
  applySimulationPreset,
  getSimulationDiagnostics,
  generateSimulationExportBundle,
  SIMULATION_PRESETS,
} from "../studio/engine/gpu-simulations-engine.js";
import { GpuSimulationStudio } from "../studio/components/gpu-simulations/GpuSimulationStudio.js";
import { GpuBackendInspector } from "../studio/components/gpu-simulations/GpuBackendInspector.js";
import { ParticleSystemEditor } from "../studio/components/gpu-simulations/ParticleSystemEditor.js";
import { FluidSimulationEditor } from "../studio/components/gpu-simulations/FluidSimulationEditor.js";
import { EnvironmentalEffectsEditor } from "../studio/components/gpu-simulations/EnvironmentalEffectsEditor.js";
import { InteractiveForcesEditor } from "../studio/components/gpu-simulations/InteractiveForcesEditor.js";
import { SimulationCompositionBuilder } from "../studio/components/gpu-simulations/SimulationCompositionBuilder.js";
import { SimulationViewport } from "../studio/components/gpu-simulations/SimulationViewport.js";
import { SimulationPresetLibrary } from "../studio/components/gpu-simulations/SimulationPresetLibrary.js";
import { SimulationTimeline } from "../studio/components/gpu-simulations/SimulationTimeline.js";
import { SimulationDiagnostics } from "../studio/components/gpu-simulations/SimulationDiagnostics.js";
import { SimulationCodeExport } from "../studio/components/gpu-simulations/SimulationCodeExport.js";
import { StudioHeader } from "../studio/components/StudioHeader.js";
import type { GpuSimulationStudioState } from "../studio/types/gpu-simulations.js";

describe("GPU Particles & Simulation Studio (Prompt 138)", () => {
  let defaultState: GpuSimulationStudioState;

  beforeEach(() => {
    defaultState = createDefaultGpuSimulationStudioState();
  });

  describe("Studio Integration & Navigation", () => {
    it("initializes default state with valid sub-system configurations", () => {
      expect(defaultState.viewMode).toBe("particles");
      expect(defaultState.particles.count).toBe(6000);
      expect(defaultState.particles.emitterType).toBe("point");
      expect(defaultState.fluid.gridResolution).toBe(64);
      expect(defaultState.environment.activeEffects).toContain("rain");
      expect(defaultState.forces.activeForces.length).toBeGreaterThanOrEqual(2);
      expect(defaultState.composition.layers.length).toBe(4);
      expect(defaultState.backend.deviceInfo.rendererName).toBeDefined();
    });

    it("renders StudioHeader with Simulations tab button active when selected", () => {
      const html = renderToString(
        createElement(StudioHeader, {
          activeTab: "simulations",
          onTabChange: () => {},
          viewport: "desktop",
          onViewportChange: () => {},
          reducedMotion: false,
          onToggleReducedMotion: () => {},
          onExportClick: () => {},
        })
      );
      expect(html).toContain("✨ Simulations");
      expect(html).toContain('studio-tab-btn active" title="GPU Particles &amp; Simulation Studio');
    });

    it("renders master GpuSimulationStudio component with all 7 sub-tabs and controls", () => {
      const html = renderToString(createElement(GpuSimulationStudio));
      expect(html).toContain("GPU Particles &amp; Simulation Studio");
      expect(html).toContain("✨ Particles");
      expect(html).toContain("💧 Fluid");
      expect(html).toContain("🌪️ Environment");
      expect(html).toContain("🧲 Interactive Forces");
      expect(html).toContain("⚡ GPU Backend");
      expect(html).toContain("🎬 Composition");
      expect(html).toContain("📚 Presets");
      expect(html).toContain("📦 Export Code");
    });
  });

  describe("GPU Backend & Hardware Probing", () => {
    it("probes hardware capabilities across backend preferences safely", () => {
      const autoCaps = detectGpuBackendInfo("auto");
      expect(autoCaps.activeBackend).toBeDefined();
      expect(autoCaps.deviceInfo.maxTextureDimension).toBeGreaterThanOrEqual(1024);

      const cpuCaps = detectGpuBackendInfo("cpu");
      expect(cpuCaps.activeBackend).toBe("cpu");
      expect(cpuCaps.backendPreference).toBe("cpu");
    });

    it("renders GpuBackendInspector with hardware specs and active pipeline", () => {
      const html = renderToString(
        createElement(GpuBackendInspector, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("GPU Compute Backend &amp; Hardware Engine");
      expect(html).toContain("Active Simulation Pipeline");
      expect(html).toContain("Hardware Capabilities");
      expect(html).toContain("WebGPU Compute Shaders");
      expect(html).toContain("WebGL2 Texture &amp; FBO Simulation");
      expect(html).toContain("32-Bit Floating Point Textures");
      expect(html).toContain("Re-Probe GPU Capabilities");
    });
  });

  describe("GPU Particle System Engine", () => {
    it("renders ParticleSystemEditor with geometric emitters, sliders, and ramps", () => {
      const html = renderToString(
        createElement(ParticleSystemEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("GPU Particle System Engine");
      expect(html).toContain("Particle Capacity");
      expect(html).toContain("Emitter Geometry");
      expect(html).toContain("Point");
      expect(html).toContain("Box");
      expect(html).toContain("Sphere");
      expect(html).toContain("Cone");
      expect(html).toContain("Color Ramp &amp; Blend Mode");
      expect(html).toContain("Additive");
      expect(html).toContain("Turbulence Intensity");
    });
  });

  describe("Eulerian Fluid Dynamics & Flow Solver", () => {
    it("renders FluidSimulationEditor with grid resolution, dye, and Navier-Stokes dynamics", () => {
      const html = renderToString(
        createElement(FluidSimulationEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Eulerian Fluid Dynamics &amp; Flow Solver");
      expect(html).toContain("Eulerian Grid Resolution");
      expect(html).toContain("32×32");
      expect(html).toContain("64×64");
      expect(html).toContain("128×128");
      expect(html).toContain("Visualization Rendering Mode");
      expect(html).toContain("Smoke");
      expect(html).toContain("Ink");
      expect(html).toContain("Velocity");
      expect(html).toContain("Dye Tint Color");
      expect(html).toContain("Vorticity Confinement");
    });
  });

  describe("Atmospheric Environmental Simulation", () => {
    it("renders EnvironmentalEffectsEditor with weather presets and active atmospheric effects", () => {
      const html = renderToString(
        createElement(EnvironmentalEffectsEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Atmospheric &amp; Environmental Simulation");
      expect(html).toContain("Weather Preset");
      expect(html).toContain("🌧️ Rain");
      expect(html).toContain("Active Atmospheric Subsystems");
      expect(html).toContain("Snow");
      expect(html).toContain("Wind");
      expect(html).toContain("Lightning");
      expect(html).toContain("Precipitation Rate");
      expect(html).toContain("Wind &amp; Turbulence");
    });
  });

  describe("Interactive Spatial Force Fields", () => {
    it("renders InteractiveForcesEditor with pointer modes, spatial grid, and force fields", () => {
      const html = renderToString(
        createElement(InteractiveForcesEditor, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Interactive Spatial Force Fields");
      expect(html).toContain("Pointer Interaction Mode");
      expect(html).toContain("🧲 Follow");
      expect(html).toContain("💥 Push");
      expect(html).toContain("🌀 Swirl");
      expect(html).toContain("Spatial Hash Grid Partitioning");
      expect(html).toContain("Active Force Fields");
      expect(html).toContain("+ Add Force");
      expect(html).toContain("Center Vortex");
    });
  });

  describe("Simulation Composition & Coupling", () => {
    it("renders SimulationCompositionBuilder with multi-system coupling and layers stack", () => {
      const html = renderToString(
        createElement(SimulationCompositionBuilder, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Simulation Orchestration &amp; Multi-System Coupling");
      expect(html).toContain("Cross-System Physics Coupling");
      expect(html).toContain("Fluid Velocity Advects GPU Particles");
      expect(html).toContain("Atmospheric Wind Injects Momentum into Fluid Grid");
      expect(html).toContain("Wind Vectors Steer Environmental &amp; GPU Particles");
      expect(html).toContain("Timestep Coordinator");
      expect(html).toContain("Composition Layers Stack");
      expect(html).toContain("GPU Particle System");
      expect(html).toContain("Eulerian Fluid Layer");
    });
  });

  describe("Live Simulation Viewport Stage", () => {
    it("renders SimulationViewport with canvas stage, HUD badges, and controls", () => {
      const html = renderToString(
        createElement(SimulationViewport, {
          state: defaultState,
        })
      );
      expect(html).toContain("Simulation Viewport Stage");
      expect(html).toContain("sim-canvas");
      expect(html).toContain("Active Particles:");
      expect(html).toContain("Eulerian Cells:");
      expect(html).toContain("Reset Simulation");
    });
  });

  describe("Preset Library (25 Presets)", () => {
    it("provides 25 diverse presets across all 5 simulation categories", () => {
      expect(SIMULATION_PRESETS.length).toBeGreaterThanOrEqual(25);
      const categories = new Set(SIMULATION_PRESETS.map((p) => p.category));
      expect(categories).toContain("particles");
      expect(categories).toContain("fluid");
      expect(categories).toContain("environment");
      expect(categories).toContain("interactive");
      expect(categories).toContain("composition");
    });

    it("applies a preset cleanly without mutating source objects", () => {
      const galaxyState = applySimulationPreset(defaultState, "preset-galaxy");
      expect(galaxyState.selectedPresetId).toBe("preset-galaxy");
      expect(galaxyState.particles.count).toBe(12000);
      expect(galaxyState.particles.emitterType).toBe("sphere");

      const blizzardState = applySimulationPreset(defaultState, "preset-blizzard");
      expect(blizzardState.selectedPresetId).toBe("preset-blizzard");
      expect(blizzardState.environment.weatherPreset).toBe("blizzard");
      expect(blizzardState.environment.activeEffects).toContain("snow");
    });

    it("renders SimulationPresetLibrary with search bar and category filters", () => {
      const html = renderToString(
        createElement(SimulationPresetLibrary, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Production Simulation Presets");
      expect(html).toContain("Search presets, tags, physics...");
      expect(html).toContain("Cosmic Galaxy");
      expect(html).toContain("Midnight Ink Drop");
      expect(html).toContain("Arctic Blizzard");
      expect(html).toContain("Magnetic Core");
      expect(html).toContain("Tempest at Sea");
    });
  });

  describe("Playback Timeline & Diagnostics", () => {
    it("renders SimulationTimeline with playback buttons and speed selectors", () => {
      const html = renderToString(
        createElement(SimulationTimeline, {
          state: defaultState,
          onChange: () => {},
        })
      );
      expect(html).toContain("Simulation Playback Timeline");
      expect(html).toContain("⏸ Pause");
      expect(html).toContain("↺ Restart");
      expect(html).toContain("⏯ Step");
      expect(html).toContain("Speed:");
      expect(html).toContain("0.25");
      expect(html).toContain("0.5");
      expect(html).toContain("1");
      expect(html).toContain("2");
    });

    it("computes live diagnostics combining simulation metrics with Performance Intelligence", () => {
      const diag = getSimulationDiagnostics(defaultState);
      expect(diag.fps).toBeGreaterThan(0);
      expect(diag.frameTimeMs).toBeGreaterThan(0);
      expect(diag.activeParticles).toBe(6000);
      expect(diag.fluidGridCells).toBe(64 * 64);
      expect(diag.memoryEstimateMb).toBeGreaterThan(0);
      expect(diag.healthScore).toBeGreaterThan(0);
      expect(diag.healthStatus).toBeDefined();
    });

    it("renders SimulationDiagnostics telemetry bar with FPS and health score", () => {
      const html = renderToString(
        createElement(SimulationDiagnostics, {
          state: defaultState,
        })
      );
      expect(html).toContain("Performance Intelligence Diagnostics");
      expect(html).toContain("FPS");
      expect(html).toContain("Frame Time");
      expect(html).toContain("Particles");
      expect(html).toContain("Eulerian Grid");
      expect(html).toContain("System Health");
    });
  });

  describe("Multi-Format Code Export", () => {
    it("generates production code for React Hooks, React Components, Vanilla TS, and Composition JSON", () => {
      const bundle = generateSimulationExportBundle(defaultState);
      expect(bundle.reactHookCode).toContain("useGPUSimulation");
      expect(bundle.reactHookCode).toContain("useParticleSystem");
      expect(bundle.reactHookCode).toContain("useFluidSimulation");

      expect(bundle.reactComponentCode).toContain("<SimulationCanvas");
      expect(bundle.reactComponentCode).toContain("<ParticleSystemLayer");
      expect(bundle.reactComponentCode).toContain("<FluidLayer");

      expect(bundle.vanillaCode).toContain("createSimulationEngine");
      expect(bundle.vanillaCode).toContain("SimulationCoordinator");

      const parsed = JSON.parse(bundle.compositionJson);
      expect(parsed.studio).toContain("GPU Particles & Simulation Studio");
      expect(parsed.particles.count).toBe(6000);
      expect(parsed.fluid.gridResolution).toBe(64);
    });

    it("renders SimulationCodeExport modal dialog with format tabs and copy button", () => {
      const html = renderToString(
        createElement(SimulationCodeExport, {
          state: defaultState,
          onClose: () => {},
        })
      );
      expect(html).toContain("Export Simulation Code");
      expect(html).toContain("React Hooks");
      expect(html).toContain("React Components");
      expect(html).toContain("Vanilla TypeScript");
      expect(html).toContain("Composition JSON");
      expect(html).toContain("Copy to Clipboard");
    });
  });
});
