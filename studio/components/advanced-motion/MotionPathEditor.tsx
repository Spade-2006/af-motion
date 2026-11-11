import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface MotionPathEditorProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const MotionPathEditor: React.FC<MotionPathEditorProps> = ({ state, onChange }) => {
  const { motionPath } = state;

  const updateMotionPath = (updates: Partial<typeof motionPath>) => {
    onChange((prev) => ({
      ...prev,
      motionPath: {
        ...prev.motionPath,
        ...updates,
      },
    }));
  };

  const pathPresets = [
    { name: "S-Curve", path: "M 40 160 C 140 20, 260 260, 460 120" },
    { name: "Circular Orbit", path: "M 250 80 A 100 100 0 1 0 250 280 A 100 100 0 1 0 250 80 Z" },
    { name: "Waveform", path: "M 40 150 Q 150 50, 250 150 T 460 150" },
    { name: "Loop-de-Loop", path: "M 50 180 C 150 180, 200 40, 260 40 C 320 40, 320 180, 260 180 C 200 180, 350 180, 450 180" },
  ];

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">Motion Path Engine</h3>
        <p className="am-section-desc">
          Parametric trajectory sampling with uniform arc-length parameterization and auto-orientation.
        </p>
      </div>

      {/* Trajectory Presets */}
      <div className="studio-form-group">
        <label className="studio-label">Trajectory Templates</label>
        <div className="am-chips-grid">
          {pathPresets.map((p) => (
            <button
              key={p.name}
              type="button"
              className="am-chip"
              onClick={() => updateMotionPath({ pathString: p.path })}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Path String Input */}
      <div className="studio-form-group">
        <label className="studio-label">SVG Path Trajectory Definition</label>
        <input
          type="text"
          value={motionPath.pathString}
          onChange={(e) => updateMotionPath({ pathString: e.target.value })}
          className="studio-input"
        />
      </div>

      {/* Progress Scrubber */}
      <div className="studio-form-group">
        <label className="studio-label">
          Path Progress ({Math.round(motionPath.progress * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={motionPath.progress}
          onChange={(e) => updateMotionPath({ progress: Number(e.target.value) })}
          className="studio-range"
        />
      </div>

      {/* Follower Toggles */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Duration ({motionPath.duration}ms)</label>
          <input
            type="range"
            min="300"
            max="3000"
            step="50"
            value={motionPath.duration}
            onChange={(e) => updateMotionPath({ duration: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">Traversal Mode</label>
          <div className="studio-btn-group">
            {(["constant-distance", "progress"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`studio-btn studio-btn-sm ${
                  motionPath.traversalMode === m ? "active" : ""
                }`}
                onClick={() => updateMotionPath({ traversalMode: m })}
              >
                {m === "constant-distance" ? "Constant Spd" : "Linear T"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="am-toggles-grid">
        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={motionPath.autoRotate}
            onChange={(e) => updateMotionPath({ autoRotate: e.target.checked })}
          />
          <span>Auto-Rotate Along Tangent (Orientation Banking)</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={motionPath.loop}
            onChange={(e) => updateMotionPath({ loop: e.target.checked })}
          />
          <span>Continuous Traversal Loop</span>
        </label>
      </div>

      {/* Path Geometry Telemetry */}
      <div className="am-panel-subcard">
        <h4 className="am-subcard-title">Arc-Length Telemetry</h4>
        <div className="am-flip-readout">
          <div className="am-flip-cell">
            <span className="am-flip-label">Total Arc Length</span>
            <span className="am-flip-val">{motionPath.pathLength}px</span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Current Pos (X, Y)</span>
            <span className="am-flip-val">
              {motionPath.currentCoord.x}, {motionPath.currentCoord.y}
            </span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Tangent Vector</span>
            <span className="am-flip-val">
              ({motionPath.tangent.x}, {motionPath.tangent.y})
            </span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Curvature (κ)</span>
            <span className="am-flip-val">{motionPath.curvature}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
