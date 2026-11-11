import React from "react";
import type { InteractionStudioState } from "../../types/interactions.js";

interface CursorMagneticEditorProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const CursorMagneticEditor: React.FC<CursorMagneticEditorProps> = ({
  state,
  onChange,
}) => {
  const { cursorMagnetic } = state;

  const updateCursorMagnetic = (updates: Partial<typeof cursorMagnetic>) => {
    onChange((prev) => ({
      ...prev,
      cursorMagnetic: {
        ...prev.cursorMagnetic,
        ...updates,
      },
    }));
  };

  return (
    <div className="ip-editor-panel">
      <div className="ip-panel-section">
        <h3 className="ip-section-title">Cursor & Magnetic Physics</h3>
        <p className="ip-section-desc">
          Tune cursor follower latency, attraction radii, repulsion vectors, and magnetic groups.
        </p>
      </div>

      {/* Cursor Mode */}
      <div className="studio-form-group">
        <label className="studio-label">Cursor Tracker Mode</label>
        <div className="studio-btn-group">
          {(["follower", "magnetic", "hover-reactive", "proximity", "default"] as const).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                className={`studio-btn studio-btn-sm ${
                  cursorMagnetic.cursorMode === mode ? "active" : ""
                }`}
                onClick={() => updateCursorMagnetic({ cursorMode: mode })}
              >
                {mode}
              </button>
            )
          )}
        </div>
      </div>

      {/* Smoothing & Lag */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">
            Follower Smoothing ({Math.round(cursorMagnetic.smoothing * 100)}%)
          </label>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={cursorMagnetic.smoothing}
            onChange={(e) => updateCursorMagnetic({ smoothing: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">Lag Latency ({cursorMagnetic.lagMs}ms)</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={cursorMagnetic.lagMs}
            onChange={(e) => updateCursorMagnetic({ lagMs: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Magnetic Attraction Radius & Strength */}
      <div className="ip-panel-subcard">
        <h4 className="ip-subcard-title">Magnetic Force Field</h4>

        <div className="studio-form-row">
          <div className="studio-form-group">
            <label className="studio-label">
              Attraction Radius ({cursorMagnetic.magneticRadius}px)
            </label>
            <input
              type="range"
              min="50"
              max="250"
              step="10"
              value={cursorMagnetic.magneticRadius}
              onChange={(e) => updateCursorMagnetic({ magneticRadius: Number(e.target.value) })}
              className="studio-range"
            />
          </div>

          <div className="studio-form-group">
            <label className="studio-label">
              Field Strength ({Math.round(cursorMagnetic.magneticStrength * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={cursorMagnetic.magneticStrength}
              onChange={(e) => updateCursorMagnetic({ magneticStrength: Number(e.target.value) })}
              className="studio-range"
            />
          </div>
        </div>

        <div className="studio-form-row">
          <div className="studio-form-group">
            <label className="studio-label">Force Mode</label>
            <div className="studio-btn-group">
              {(["attract", "repel"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`studio-btn studio-btn-sm ${
                    cursorMagnetic.magneticMode === m ? "active" : ""
                  }`}
                  onClick={() => updateCursorMagnetic({ magneticMode: m })}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="studio-form-group">
            <label className="studio-label">Falloff Curve</label>
            <select
              className="studio-select"
              value={cursorMagnetic.magneticFalloff}
              onChange={(e) =>
                updateCursorMagnetic({
                  magneticFalloff: e.target.value as typeof cursorMagnetic.magneticFalloff,
                })
              }
            >
              <option value="linear">Linear</option>
              <option value="smoothstep">Smoothstep (Natural)</option>
              <option value="exponential">Exponential (Fast Decay)</option>
              <option value="inverse-square">Inverse Square (Physical)</option>
            </select>
          </div>
        </div>

        {/* Magnetic Group & Reduced Motion */}
        <div className="ip-toggles-grid">
          <label className="studio-toggle-label">
            <input
              type="checkbox"
              checked={cursorMagnetic.magneticGroupEnabled}
              onChange={(e) => updateCursorMagnetic({ magneticGroupEnabled: e.target.checked })}
            />
            <span>Enable Shared Magnetic Group</span>
          </label>

          <label className="studio-toggle-label">
            <input
              type="checkbox"
              checked={cursorMagnetic.respectReducedMotion}
              onChange={(e) => updateCursorMagnetic({ respectReducedMotion: e.target.checked })}
            />
            <span>Honor Reduced-Motion Preference</span>
          </label>
        </div>
      </div>
    </div>
  );
};
