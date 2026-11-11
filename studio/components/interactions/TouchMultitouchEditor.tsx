import React from "react";
import type { InteractionStudioState } from "../../types/interactions.js";

interface TouchMultitouchEditorProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const TouchMultitouchEditor: React.FC<TouchMultitouchEditorProps> = ({
  state,
  onChange,
}) => {
  const { touchMultitouch } = state;

  const updateTouch = (updates: Partial<typeof touchMultitouch>) => {
    onChange((prev) => ({
      ...prev,
      touchMultitouch: {
        ...prev.touchMultitouch,
        ...updates,
      },
    }));
  };

  return (
    <div className="ip-editor-panel">
      <div className="ip-panel-section">
        <h3 className="ip-section-title">Touch & Multi-Touch Engine</h3>
        <p className="ip-section-desc">
          Two-finger pan, pinch zoom, centroid tracking, and rotational transformations.
        </p>
      </div>

      {/* Touch Action Mode */}
      <div className="studio-form-group">
        <label className="studio-label">CSS Touch Action</label>
        <div className="studio-btn-group">
          {(["none", "pan-x", "pan-y", "manipulation", "auto"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`studio-btn studio-btn-sm ${
                touchMultitouch.touchAction === mode ? "active" : ""
              }`}
              onClick={() => updateTouch({ touchAction: mode })}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="ip-toggles-grid">
        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={touchMultitouch.enablePan}
            onChange={(e) => updateTouch({ enablePan: e.target.checked })}
          />
          <span>Enable Pan Translation</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={touchMultitouch.enablePinch}
            onChange={(e) => updateTouch({ enablePinch: e.target.checked })}
          />
          <span>Enable Pinch to Zoom</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={touchMultitouch.enableRotation}
            onChange={(e) => updateTouch({ enableRotation: e.target.checked })}
          />
          <span>Enable Rotation</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={touchMultitouch.twoFingerPan}
            onChange={(e) => updateTouch({ twoFingerPan: e.target.checked })}
          />
          <span>Two-Finger Required for Pan</span>
        </label>
      </div>

      {/* Scale & Rotation Limits */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Min Scale ({touchMultitouch.minScale}x)</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={touchMultitouch.minScale}
            onChange={(e) => updateTouch({ minScale: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
        <div className="studio-form-group">
          <label className="studio-label">Max Scale ({touchMultitouch.maxScale}x)</label>
          <input
            type="range"
            min="1.5"
            max="5.0"
            step="0.1"
            value={touchMultitouch.maxScale}
            onChange={(e) => updateTouch({ maxScale: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Multitouch Simulator (Desktop Mode) */}
      <div className="ip-panel-subcard ip-simulated-box">
        <div className="ip-simulated-badge-container">
          <span className="ip-simulated-badge">Simulated Input Mode</span>
          <span className="ip-simulated-note">Emulates two touch points on hardware without touch</span>
        </div>

        <div className="studio-form-toggle">
          <label className="studio-toggle-label">
            <input
              type="checkbox"
              checked={touchMultitouch.simulatedTouchEnabled}
              onChange={(e) => updateTouch({ simulatedTouchEnabled: e.target.checked })}
            />
            <span>Enable Multi-Touch Simulator</span>
          </label>
        </div>

        {touchMultitouch.simulatedTouchEnabled && (
          <div className="ip-simulator-controls">
            <div className="studio-form-group">
              <label className="studio-label">
                Simulated Touch Distance ({Math.round(touchMultitouch.simulatedDistance)}px)
              </label>
              <input
                type="range"
                min="40"
                max="300"
                step="5"
                value={touchMultitouch.simulatedDistance}
                onChange={(e) => updateTouch({ simulatedDistance: Number(e.target.value) })}
                className="studio-range"
              />
            </div>

            <div className="studio-form-group">
              <label className="studio-label">
                Simulated Rotation Angle ({Math.round(touchMultitouch.simulatedAngle)}°)
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={touchMultitouch.simulatedAngle}
                onChange={(e) => updateTouch({ simulatedAngle: Number(e.target.value) })}
                className="studio-range"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
