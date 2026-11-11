import React from "react";
import type { InteractionStudioState } from "../../types/interactions.js";

interface PointerDragEditorProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const PointerDragEditor: React.FC<PointerDragEditorProps> = ({ state, onChange }) => {
  const { pointerDrag } = state;

  const updatePointerDrag = (updates: Partial<typeof pointerDrag>) => {
    onChange((prev) => ({
      ...prev,
      pointerDrag: {
        ...prev.pointerDrag,
        ...updates,
      },
    }));
  };

  return (
    <div className="ip-editor-panel">
      <div className="ip-panel-section">
        <h3 className="ip-section-title">Pointer & Drag Physics</h3>
        <p className="ip-section-desc">
          Configure direct-manipulation dragging, axis constraints, spatial boundaries, and spring release.
        </p>
      </div>

      {/* Axis Lock */}
      <div className="studio-form-group">
        <label className="studio-label">Drag Axis Mode</label>
        <div className="studio-btn-group">
          {(["both", "x", "y", "none"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`studio-btn studio-btn-sm ${pointerDrag.axis === mode ? "active" : ""}`}
              onClick={() => updatePointerDrag({ axis: mode })}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold & Delay */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Activation Threshold ({pointerDrag.threshold}px)</label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={pointerDrag.threshold}
            onChange={(e) => updatePointerDrag({ threshold: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
        <div className="studio-form-group">
          <label className="studio-label">Activation Delay ({pointerDrag.delayMs}ms)</label>
          <input
            type="range"
            min="0"
            max="500"
            step="25"
            value={pointerDrag.delayMs}
            onChange={(e) => updatePointerDrag({ delayMs: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Boundaries */}
      <div className="ip-panel-subcard">
        <div className="studio-form-toggle">
          <label className="studio-toggle-label">
            <input
              type="checkbox"
              checked={pointerDrag.boundsEnabled}
              onChange={(e) => updatePointerDrag({ boundsEnabled: e.target.checked })}
            />
            <span>Constrain to Movement Bounds</span>
          </label>
        </div>

        {pointerDrag.boundsEnabled && (
          <div className="studio-form-grid-4">
            <div>
              <span className="ip-dim-label">Min X</span>
              <input
                type="number"
                value={pointerDrag.bounds.minX}
                onChange={(e) =>
                  updatePointerDrag({
                    bounds: { ...pointerDrag.bounds, minX: Number(e.target.value) },
                  })
                }
                className="studio-input studio-input-sm"
              />
            </div>
            <div>
              <span className="ip-dim-label">Max X</span>
              <input
                type="number"
                value={pointerDrag.bounds.maxX}
                onChange={(e) =>
                  updatePointerDrag({
                    bounds: { ...pointerDrag.bounds, maxX: Number(e.target.value) },
                  })
                }
                className="studio-input studio-input-sm"
              />
            </div>
            <div>
              <span className="ip-dim-label">Min Y</span>
              <input
                type="number"
                value={pointerDrag.bounds.minY}
                onChange={(e) =>
                  updatePointerDrag({
                    bounds: { ...pointerDrag.bounds, minY: Number(e.target.value) },
                  })
                }
                className="studio-input studio-input-sm"
              />
            </div>
            <div>
              <span className="ip-dim-label">Max Y</span>
              <input
                type="number"
                value={pointerDrag.bounds.maxY}
                onChange={(e) =>
                  updatePointerDrag({
                    bounds: { ...pointerDrag.bounds, maxY: Number(e.target.value) },
                  })
                }
                className="studio-input studio-input-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid Snapping */}
      <div className="ip-panel-subcard">
        <div className="studio-form-toggle">
          <label className="studio-toggle-label">
            <input
              type="checkbox"
              checked={pointerDrag.gridSnapping}
              onChange={(e) => updatePointerDrag({ gridSnapping: e.target.checked })}
            />
            <span>Snap to Grid ({pointerDrag.gridSize}px)</span>
          </label>
        </div>
        {pointerDrag.gridSnapping && (
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={pointerDrag.gridSize}
            onChange={(e) => updatePointerDrag({ gridSize: Number(e.target.value) })}
            className="studio-range"
          />
        )}
      </div>

      {/* Physics Toggles */}
      <div className="ip-toggles-grid">
        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={pointerDrag.rubberband}
            onChange={(e) => updatePointerDrag({ rubberband: e.target.checked })}
          />
          <span>Rubberband Resistance</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={pointerDrag.momentum}
            onChange={(e) => updatePointerDrag({ momentum: e.target.checked })}
          />
          <span>Momentum & Inertia</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={pointerDrag.springBack}
            onChange={(e) => updatePointerDrag({ springBack: e.target.checked })}
          />
          <span>Spring-Back on Release</span>
        </label>

        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={pointerDrag.keyboardEnabled}
            onChange={(e) => updatePointerDrag({ keyboardEnabled: e.target.checked })}
          />
          <span>Keyboard Dragging (Arrows)</span>
        </label>
      </div>
    </div>
  );
};
