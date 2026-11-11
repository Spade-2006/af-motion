import React from "react";
import type { InteractionStudioState } from "../../types/interactions.js";

interface GestureRecognitionEditorProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const GestureRecognitionEditor: React.FC<GestureRecognitionEditorProps> = ({
  state,
  onChange,
}) => {
  const { gestureRecognition } = state;

  const updateGesture = (updates: Partial<typeof gestureRecognition>) => {
    onChange((prev) => ({
      ...prev,
      gestureRecognition: {
        ...prev.gestureRecognition,
        ...updates,
      },
    }));
  };

  const toggleGesture = (name: string) => {
    const active = gestureRecognition.enabledGestures.includes(name);
    const updated = active
      ? gestureRecognition.enabledGestures.filter((g) => g !== name)
      : [...gestureRecognition.enabledGestures, name];
    updateGesture({ enabledGestures: updated });
  };

  const allAvailableGestures = [
    { id: "tap", label: "Tap" },
    { id: "double-tap", label: "Double Tap" },
    { id: "long-press", label: "Long Press" },
    { id: "drag", label: "Drag" },
    { id: "pan", label: "Pan" },
    { id: "swipe", label: "Swipe" },
    { id: "pinch", label: "Pinch" },
    { id: "rotation", label: "Rotation" },
  ];

  return (
    <div className="ip-editor-panel">
      <div className="ip-panel-section">
        <h3 className="ip-section-title">Deterministic Gesture Recognition</h3>
        <p className="ip-section-desc">
          Inspect gesture classifiers, threshold parameters, confidence metrics, and conflict policies.
        </p>
      </div>

      {/* Active Recognizers */}
      <div className="studio-form-group">
        <label className="studio-label">Enabled Gesture Recognizers</label>
        <div className="ip-chips-grid">
          {allAvailableGestures.map((g) => {
            const isEnabled = gestureRecognition.enabledGestures.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                className={`ip-chip ${isEnabled ? "active" : ""}`}
                onClick={() => toggleGesture(g.id)}
              >
                {isEnabled ? "✓ " : "+ "}
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confidence & Timing Thresholds */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">
            Min Confidence Threshold ({Math.round(gestureRecognition.minConfidence * 100)}%)
          </label>
          <input
            type="range"
            min="0.3"
            max="0.95"
            step="0.05"
            value={gestureRecognition.minConfidence}
            onChange={(e) => updateGesture({ minConfidence: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">
            Long Press Hold Duration ({gestureRecognition.longPressMinDurationMs}ms)
          </label>
          <input
            type="range"
            min="250"
            max="1200"
            step="50"
            value={gestureRecognition.longPressMinDurationMs}
            onChange={(e) => updateGesture({ longPressMinDurationMs: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">
            Double Tap Max Interval ({gestureRecognition.doubleTapIntervalMs}ms)
          </label>
          <input
            type="range"
            min="150"
            max="600"
            step="25"
            value={gestureRecognition.doubleTapIntervalMs}
            onChange={(e) => updateGesture({ doubleTapIntervalMs: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">
            Swipe Velocity ({gestureRecognition.swipeMinVelocity}px/ms)
          </label>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={gestureRecognition.swipeMinVelocity}
            onChange={(e) => updateGesture({ swipeMinVelocity: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Conflict Policy */}
      <div className="studio-form-group">
        <label className="studio-label">Conflict Resolution Policy</label>
        <div className="studio-btn-group">
          {(["simultaneous", "exclusive", "require-failure"] as const).map((policy) => (
            <button
              key={policy}
              type="button"
              className={`studio-btn studio-btn-sm ${
                gestureRecognition.priorityPolicy === policy ? "active" : ""
              }`}
              onClick={() => updateGesture({ priorityPolicy: policy })}
            >
              {policy}
            </button>
          ))}
        </div>
      </div>

      {/* Recognition Telemetry readout */}
      <div className="ip-panel-subcard ip-recognition-feed">
        <span className="ip-feed-title">Active Recognizer Engine</span>
        <div className="ip-feed-stats">
          <div className="ip-feed-stat">
            <span className="ip-stat-num">{gestureRecognition.enabledGestures.length}</span>
            <span className="ip-stat-lbl">Active Classifiers</span>
          </div>
          <div className="ip-feed-stat">
            <span className="ip-stat-num">
              {gestureRecognition.priorityPolicy === "exclusive" ? "1-Winner" : "Multi"}
            </span>
            <span className="ip-stat-lbl">Resolution</span>
          </div>
          <div className="ip-feed-stat">
            <span className="ip-stat-num">0</span>
            <span className="ip-stat-lbl">Rejected Candidates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
