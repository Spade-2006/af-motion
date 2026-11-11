import React from "react";
import type { GpuSimulationStudioState } from "../../types/gpu-simulations.js";
import { getSimulationDiagnostics } from "../../engine/gpu-simulations-engine.js";

interface SimulationDiagnosticsProps {
  state: GpuSimulationStudioState;
}

export const SimulationDiagnostics: React.FC<SimulationDiagnosticsProps> = ({ state }) => {
  const diag = getSimulationDiagnostics(state);

  const getHealthBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "optimal":
      case "good":
        return "sim-badge-success";
      case "warning":
      case "fair":
        return "sim-badge-warning";
      case "critical":
      case "poor":
        return "sim-badge-danger";
      default:
        return "sim-badge-accent";
    }
  };

  return (
    <div className="sim-diagnostics-bar" role="region" aria-label="Performance Intelligence Diagnostics">
      <div className="sim-diag-item">
        <span className="sim-diag-label">FPS</span>
        <span className="sim-diag-val sim-val-highlight">{diag.fps}</span>
      </div>

      <div className="sim-diag-item">
        <span className="sim-diag-label">Frame Time</span>
        <span className="sim-diag-val">{diag.frameTimeMs}ms</span>
      </div>

      <div className="sim-diag-item">
        <span className="sim-diag-label">Particles</span>
        <span className="sim-diag-val">{diag.activeParticles.toLocaleString()}</span>
      </div>

      <div className="sim-diag-item">
        <span className="sim-diag-label">Eulerian Grid</span>
        <span className="sim-diag-val">{diag.fluidGridCells.toLocaleString()} cells</span>
      </div>

      <div className="sim-diag-item">
        <span className="sim-diag-label">Backend</span>
        <span className="sim-diag-val sim-val-accent">{diag.activeBackend}</span>
      </div>

      <div className="sim-diag-item">
        <span className="sim-diag-label">Memory</span>
        <span className="sim-diag-val">{diag.memoryEstimateMb} MB</span>
      </div>

      <div className="sim-diag-item sim-diag-right">
        <span className="sim-diag-label">System Health</span>
        <span className={`sim-badge ${getHealthBadgeClass(diag.healthStatus)}`}>
          {diag.healthScore}% ({diag.healthStatus})
        </span>
      </div>
    </div>
  );
};
