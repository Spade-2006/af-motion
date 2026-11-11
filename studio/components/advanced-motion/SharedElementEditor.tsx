import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface SharedElementEditorProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const SharedElementEditor: React.FC<SharedElementEditorProps> = ({
  state,
  onChange,
}) => {
  const { sharedElement } = state;

  const updateShared = (updates: Partial<typeof sharedElement>) => {
    onChange((prev) => ({
      ...prev,
      sharedElement: {
        ...prev.sharedElement,
        ...updates,
      },
    }));
  };

  const handleToggleView = () => {
    updateShared({
      activeView: sharedElement.activeView === "list" ? "detail" : "list",
    });
  };

  const dx = sharedElement.targetBounds.x - sharedElement.sourceBounds.x;
  const dy = sharedElement.targetBounds.y - sharedElement.sourceBounds.y;
  const scaleX = (
    sharedElement.targetBounds.width / sharedElement.sourceBounds.width
  ).toFixed(2);
  const scaleY = (
    sharedElement.targetBounds.height / sharedElement.sourceBounds.height
  ).toFixed(2);

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">Shared-Element Transition</h3>
        <p className="am-section-desc">
          Continuous FLIP morphing between source and destination view contexts.
        </p>
      </div>

      {/* View Switcher CTA */}
      <div className="am-actions-row">
        <button
          type="button"
          className="studio-btn studio-btn-primary"
          onClick={handleToggleView}
        >
          ⇄ Transition to {sharedElement.activeView === "list" ? "Detail View" : "List View"}
        </button>
      </div>

      {/* Geometry Bounds Telemetry */}
      <div className="am-panel-subcard">
        <h4 className="am-subcard-title">Shared Element Interpolation Matrix</h4>
        <div className="am-flip-readout">
          <div className="am-flip-cell">
            <span className="am-flip-label">Source Rect</span>
            <span className="am-flip-val">
              {sharedElement.sourceBounds.width} × {sharedElement.sourceBounds.height}
            </span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Target Rect</span>
            <span className="am-flip-val">
              {sharedElement.targetBounds.width} × {sharedElement.targetBounds.height}
            </span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Δ Offset (X, Y)</span>
            <span className="am-flip-val">
              {dx}px, {dy}px
            </span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Scale Factor</span>
            <span className="am-flip-val">
              {scaleX}x, {scaleY}x
            </span>
          </div>
        </div>
      </div>

      {/* Transition Parameters */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Duration ({sharedElement.duration}ms)</label>
          <input
            type="range"
            min="200"
            max="1200"
            step="50"
            value={sharedElement.duration}
            onChange={(e) => updateShared({ duration: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">Border Radius ({sharedElement.borderRadius}px)</label>
          <input
            type="range"
            min="0"
            max="32"
            step="2"
            value={sharedElement.borderRadius}
            onChange={(e) => updateShared({ borderRadius: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Crossfade Toggle */}
      <div className="am-toggles-grid">
        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={sharedElement.crossfade}
            onChange={(e) => updateShared({ crossfade: e.target.checked })}
          />
          <span>Enable Crossfade Alpha Blending</span>
        </label>
      </div>
    </div>
  );
};
