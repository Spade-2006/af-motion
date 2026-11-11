import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";
import { getAdvancedMotionDiagnostics } from "../../engine/advanced-motion-engine.js";

interface AdvancedMotionDiagnosticsProps {
  state: AdvancedMotionStudioState;
}

export const AdvancedMotionDiagnostics: React.FC<AdvancedMotionDiagnosticsProps> = ({
  state,
}) => {
  const diag = getAdvancedMotionDiagnostics(state);

  return (
    <footer className="am-diagnostics-bar" aria-label="Advanced Motion Diagnostics">
      <div className="am-diag-item">
        <span className="am-diag-label">FPS:</span>
        <span className="am-diag-value am-fps-good">{diag.fps}</span>
      </div>

      <div className="am-diag-item">
        <span className="am-diag-label">Active Animations:</span>
        <span className="am-diag-value">{diag.activeAnimations}</span>
      </div>

      <div className="am-diag-item">
        <span className="am-diag-label">Tracks:</span>
        <span className="am-diag-value">{diag.activeTracks}</span>
      </div>

      <div className="am-diag-item">
        <span className="am-diag-label">Path Length:</span>
        <span className="am-diag-value">{Math.round(diag.pathLength)}px</span>
      </div>

      <div className="am-diag-item">
        <span className="am-diag-label">Morph:</span>
        <span className="am-diag-value">{Math.round(diag.morphProgress * 100)}%</span>
      </div>

      <div className="am-diag-item">
        <span className="am-diag-label">ViewTransition:</span>
        <span
          className={`am-diag-value ${
            diag.viewTransitionSupported ? "am-vt-native" : "am-vt-fallback"
          }`}
        >
          {diag.viewTransitionSupported ? "Native" : "FLIP Fallback"}
        </span>
      </div>

      <div className="am-diag-item am-diag-health">
        <span className="am-diag-label">Health Score:</span>
        <span className="am-diag-badge">
          {diag.healthScore}% ({diag.healthStatus})
        </span>
      </div>
    </footer>
  );
};
