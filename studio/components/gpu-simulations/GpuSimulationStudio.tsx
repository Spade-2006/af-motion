import React, { useState } from "react";
import type {
  GpuSimulationStudioState,
  GpuSimulationViewMode,
} from "../../types/gpu-simulations.js";
import { createDefaultGpuSimulationStudioState } from "../../engine/gpu-simulations-engine.js";
import { ParticleSystemEditor } from "./ParticleSystemEditor.js";
import { FluidSimulationEditor } from "./FluidSimulationEditor.js";
import { EnvironmentalEffectsEditor } from "./EnvironmentalEffectsEditor.js";
import { InteractiveForcesEditor } from "./InteractiveForcesEditor.js";
import { GpuBackendInspector } from "./GpuBackendInspector.js";
import { SimulationCompositionBuilder } from "./SimulationCompositionBuilder.js";
import { SimulationViewport } from "./SimulationViewport.js";
import { SimulationPresetLibrary } from "./SimulationPresetLibrary.js";
import { SimulationTimeline } from "./SimulationTimeline.js";
import { SimulationDiagnostics } from "./SimulationDiagnostics.js";
import { SimulationCodeExport } from "./SimulationCodeExport.js";

export const GpuSimulationStudio: React.FC = () => {
  const [state, setState] = useState<GpuSimulationStudioState>(
    createDefaultGpuSimulationStudioState
  );

  const setViewMode = (mode: GpuSimulationViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  };

  const handleOpenExport = () => {
    setState((prev) => ({ ...prev, showExportModal: true }));
  };

  const handleCloseExport = () => {
    setState((prev) => ({ ...prev, showExportModal: false }));
  };

  const navItems: { id: GpuSimulationViewMode; label: string }[] = [
    { id: "particles", label: "✨ Particles" },
    { id: "fluid", label: "💧 Fluid" },
    { id: "environment", label: "🌪️ Environment" },
    { id: "forces", label: "🧲 Interactive Forces" },
    { id: "backend", label: "⚡ GPU Backend" },
    { id: "composition", label: "🎬 Composition" },
    { id: "presets", label: "📚 Presets" },
  ];

  return (
    <div className="sim-workspace" role="region" aria-label="GPU Particles & Simulation Studio">
      {/* Studio Header Toolbar */}
      <div className="sim-toolbar">
        {/* Navigation Tabs */}
        <div className="sim-nav-tabs">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`studio-tab-btn ${state.viewMode === item.id ? "active" : ""}`}
              onClick={() => setViewMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="sim-toolbar-actions">
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-primary"
            onClick={handleOpenExport}
          >
            📦 Export Code
          </button>
        </div>
      </div>

      {/* Main Modular Workspace */}
      <div className="sim-main-grid">
        {state.viewMode === "presets" ? (
          <div className="sim-full-panel">
            <SimulationPresetLibrary state={state} onChange={setState} />
          </div>
        ) : (
          <>
            {/* Left Column: Contextual Config Editor */}
            <aside className="sim-left-panel">
              {state.viewMode === "particles" && (
                <ParticleSystemEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "fluid" && (
                <FluidSimulationEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "environment" && (
                <EnvironmentalEffectsEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "forces" && (
                <InteractiveForcesEditor state={state} onChange={setState} />
              )}
              {state.viewMode === "backend" && (
                <GpuBackendInspector state={state} onChange={setState} />
              )}
              {state.viewMode === "composition" && (
                <SimulationCompositionBuilder state={state} onChange={setState} />
              )}
            </aside>

            {/* Right Column: Live Viewport & Timeline */}
            <main className="sim-right-stage">
              <SimulationViewport state={state} />
              <SimulationTimeline state={state} onChange={setState} />
            </main>
          </>
        )}
      </div>

      {/* Bottom Diagnostics HUD Bar */}
      <footer className="sim-footer">
        <SimulationDiagnostics state={state} />
      </footer>

      {/* Export Code Modal Dialog */}
      {state.showExportModal && (
        <SimulationCodeExport state={state} onClose={handleCloseExport} />
      )}
    </div>
  );
};
