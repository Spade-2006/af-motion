import React from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";
import { getAdvanced3DDiagnostics } from "../../engine/advanced-3d-engine.js";

interface Advanced3DDiagnosticsProps {
  state: Advanced3DStudioState;
}

export const Advanced3DDiagnostics: React.FC<Advanced3DDiagnosticsProps> = ({ state }) => {
  const diag = getAdvanced3DDiagnostics(state);

  const getHealthBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "optimal":
      case "good":
        return "adv3d-badge-success";
      case "warning":
      case "fair":
        return "adv3d-badge-warning";
      case "critical":
      case "poor":
        return "adv3d-badge-danger";
      default:
        return "adv3d-badge-accent";
    }
  };

  return (
    <div className="adv3d-diagnostics-bar" role="region" aria-label="3D Performance Intelligence Diagnostics">
      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">FPS</span>
        <span className="adv3d-diag-val adv3d-val-highlight">{diag.fps}</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">Frame Time</span>
        <span className="adv3d-diag-val">{diag.frameTimeMs}ms</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">Triangles</span>
        <span className="adv3d-diag-val">{diag.triangleCount.toLocaleString()}</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">Physics Step</span>
        <span className="adv3d-diag-val">{diag.physicsStepDurationMs.toFixed(2)}ms</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">Rigid Bodies</span>
        <span className="adv3d-diag-val">{diag.activeRigidBodies}</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">Soft Nodes</span>
        <span className="adv3d-diag-val">{diag.softBodyNodes}</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">Terrain Verts</span>
        <span className="adv3d-diag-val">{diag.terrainVertices.toLocaleString()}</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">World Chunks</span>
        <span className="adv3d-diag-val">{diag.activeChunks}</span>
      </div>

      <div className="adv3d-diag-item">
        <span className="adv3d-diag-label">VRAM Est.</span>
        <span className="adv3d-diag-val adv3d-val-accent">{diag.estimatedVramMb} MB</span>
      </div>

      <div className="adv3d-diag-item adv3d-diag-right">
        <span className="adv3d-diag-label">Intelligence Health</span>
        <span className={`adv3d-badge ${getHealthBadgeClass(diag.healthStatus)}`}>
          {diag.healthScore}% ({diag.healthStatus})
        </span>
      </div>
    </div>
  );
};
