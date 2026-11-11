import React from "react";
import type {
  GpuSimulationStudioState,
  FluidGridResolution,
  FluidBoundaryMode,
  FluidVisualizationMode,
} from "../../types/gpu-simulations.js";

interface FluidSimulationEditorProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const FluidSimulationEditor: React.FC<FluidSimulationEditorProps> = ({
  state,
  onChange,
}) => {
  const { fluid } = state;

  const updateFluid = (updates: Partial<typeof fluid>) => {
    onChange((prev) => ({
      ...prev,
      fluid: {
        ...prev.fluid,
        ...updates,
      },
    }));
  };

  const resolutionOptions: { id: FluidGridResolution; label: string }[] = [
    { id: 32, label: "32×32 (Fast)" },
    { id: 64, label: "64×64 (Balanced)" },
    { id: 128, label: "128×128 (Detailed)" },
    { id: 256, label: "256×256 (Ultra)" },
  ];

  const boundaryOptions: { id: FluidBoundaryMode; label: string }[] = [
    { id: "closed", label: "Closed" },
    { id: "open", label: "Open" },
    { id: "periodic", label: "Periodic" },
  ];

  const vizOptions: { id: FluidVisualizationMode; label: string }[] = [
    { id: "smoke", label: "Smoke" },
    { id: "ink", label: "Ink" },
    { id: "density", label: "Density" },
    { id: "velocity", label: "Velocity" },
    { id: "pressure", label: "Pressure" },
  ];

  return (
    <div className="sim-editor-panel" role="region" aria-label="Fluid Simulation Editor">
      <div className="sim-panel-section">
        <h3 className="sim-section-title">Eulerian Fluid Dynamics & Flow Solver</h3>
        <p className="sim-section-desc">
          Navier-Stokes velocity advection, pressure projection, vorticity confinement,
          and dye dispersion.
        </p>
      </div>

      {/* Grid Resolution */}
      <div className="studio-form-group">
        <label className="studio-label">Eulerian Grid Resolution</label>
        <div className="studio-btn-group">
          {resolutionOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                fluid.gridResolution === opt.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateFluid({ gridResolution: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Mode */}
      <div className="studio-form-group">
        <label className="studio-label">Visualization Rendering Mode</label>
        <div className="studio-btn-group">
          {vizOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                fluid.visualizationMode === opt.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateFluid({ visualizationMode: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Boundary Conditions */}
      <div className="studio-form-group">
        <label className="studio-label">Boundary Conditions</label>
        <div className="studio-btn-group">
          {boundaryOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                fluid.boundaryMode === opt.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateFluid({ boundaryMode: opt.id })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dye Color */}
      <div className="studio-form-group">
        <label className="studio-label">Dye Tint Color</label>
        <div className="sim-color-picker-row">
          <input
            type="color"
            value={fluid.dyeColor.startsWith("#") ? fluid.dyeColor : "#38bdf8"}
            onChange={(e) => updateFluid({ dyeColor: e.target.value })}
            className="sim-color-input"
          />
          <input
            type="text"
            value={fluid.dyeColor}
            onChange={(e) => updateFluid({ dyeColor: e.target.value })}
            className="studio-input"
          />
        </div>
      </div>

      {/* Solver Physical Parameters */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Solver Dynamics & Vorticity</h4>

        <div className="sim-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Viscosity</label>
              <span className="studio-value-display">{fluid.viscosity.toExponential(1)}</span>
            </div>
            <input
              type="range"
              min="0.00001"
              max="0.005"
              step="0.00005"
              value={fluid.viscosity}
              onChange={(e) => updateFluid({ viscosity: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Dissipation</label>
              <span className="studio-value-display">{fluid.dissipation.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.95"
              max="0.999"
              step="0.001"
              value={fluid.dissipation}
              onChange={(e) => updateFluid({ dissipation: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>

        <div className="sim-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Vorticity Confinement</label>
              <span className="studio-value-display">{fluid.vorticity}</span>
            </div>
            <input
              type="range"
              min="0"
              max="70"
              step="5"
              value={fluid.vorticity}
              onChange={(e) => updateFluid({ vorticity: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Pressure Iterations</label>
              <span className="studio-value-display">{fluid.pressureIterations}</span>
            </div>
            <input
              type="range"
              min="8"
              max="48"
              step="4"
              value={fluid.pressureIterations}
              onChange={(e) => updateFluid({ pressureIterations: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
