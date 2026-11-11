import React from "react";
import type { InteractionStudioState } from "../../types/interactions.js";
import { getInteractionDiagnostics } from "../../engine/interactions-engine.js";

interface InteractionDiagnosticsPanelProps {
  state: InteractionStudioState;
}

export const InteractionDiagnosticsPanel: React.FC<InteractionDiagnosticsPanelProps> = ({
  state,
}) => {
  const diag = getInteractionDiagnostics(state);

  return (
    <footer className="ip-diagnostics-bar" aria-label="Interaction Diagnostics">
      <div className="ip-diag-item">
        <span className="ip-diag-label">FPS:</span>
        <span className="ip-diag-value ip-fps-good">{diag.fps}</span>
      </div>

      <div className="ip-diag-item">
        <span className="ip-diag-label">Latency:</span>
        <span className="ip-diag-value">{diag.eventProcessingDurationMs}ms</span>
      </div>

      <div className="ip-diag-item">
        <span className="ip-diag-label">Active Pointers:</span>
        <span className="ip-diag-value">{diag.activePointers}</span>
      </div>

      <div className="ip-diag-item">
        <span className="ip-diag-label">Gestures:</span>
        <span className="ip-diag-value">{diag.activeGestures}</span>
      </div>

      <div className="ip-diag-item">
        <span className="ip-diag-label">History:</span>
        <span className="ip-diag-value">{diag.eventHistorySize} ev</span>
      </div>

      <div className="ip-diag-item">
        <span className="ip-diag-label">Input HW:</span>
        <span className="ip-diag-value">
          {diag.devicePrimaryInput} ({diag.hardwareTouchPoints} touch)
        </span>
      </div>

      <div className="ip-diag-item">
        <span className="ip-diag-label">Touch Simulator:</span>
        <span
          className={`ip-diag-value ${
            diag.isSimulatingTouch ? "ip-sim-active" : "ip-sim-inactive"
          }`}
        >
          {diag.isSimulatingTouch ? "Active (Emulated)" : "Off"}
        </span>
      </div>

      <div className="ip-diag-item ip-diag-health">
        <span className="ip-diag-label">Health Score:</span>
        <span className="ip-diag-badge">
          {Math.round(diag.healthScore)}% ({diag.healthStatus})
        </span>
      </div>
    </footer>
  );
};
