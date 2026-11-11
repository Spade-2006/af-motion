import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface UnifiedCompositionBuilderProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const UnifiedCompositionBuilder: React.FC<UnifiedCompositionBuilderProps> = ({
  state,
  onChange,
}) => {
  const { composition } = state;

  const updateComposition = (updates: Partial<typeof composition>) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        ...updates,
      },
    }));
  };

  const handleTogglePlay = () => {
    updateComposition({ isPlaying: !composition.isPlaying });
  };

  const handleToggleReverse = () => {
    updateComposition({ isReversed: !composition.isReversed });
  };

  const handleStepStatus = (stepId: string) => {
    const nextSteps = composition.steps.map((st) =>
      st.id === stepId
        ? {
            ...st,
            status: (st.status === "completed"
              ? "idle"
              : st.status === "running"
              ? "completed"
              : "running") as typeof st.status,
          }
        : st
    );
    updateComposition({ steps: nextSteps });
  };

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">Unified Composition Builder</h3>
        <p className="am-section-desc">
          Multi-track dependency DAG orchestrating typography, layout FLIP, SVG morph, and motion paths.
        </p>
      </div>

      {/* Composition Header & Controls */}
      <div className="am-comp-header">
        <div className="am-comp-meta">
          <span className="am-comp-title">{composition.name}</span>
          <span className="am-comp-duration">Total: {composition.duration}ms</span>
        </div>
        <div className="am-comp-actions">
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${composition.isPlaying ? "active" : ""}`}
            onClick={handleTogglePlay}
          >
            {composition.isPlaying ? "⏸ Pause" : "▶ Play All"}
          </button>
          <button
            type="button"
            className={`studio-btn studio-btn-sm ${composition.isReversed ? "active" : ""}`}
            onClick={handleToggleReverse}
          >
            {composition.isReversed ? "⏪ Reverse" : "⏩ Forward"}
          </button>
        </div>
      </div>

      {/* Progress Timeline Scrubber */}
      <div className="studio-form-group">
        <label className="studio-label">
          Master Composition Scrub ({Math.round(composition.progress * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={composition.progress}
          onChange={(e) => updateComposition({ progress: Number(e.target.value) })}
          className="studio-range"
        />
      </div>

      {/* Track Steps List */}
      <div className="am-tracks-container">
        <span className="am-tracks-header">Choreographed Execution Tracks</span>
        <div className="am-track-list">
          {composition.steps.map((step, idx) => (
            <div
              key={step.id}
              className={`am-track-card am-track-${step.status}`}
              onClick={() => handleStepStatus(step.id)}
            >
              <div className="am-track-num">{idx + 1}</div>
              <div className="am-track-info">
                <div className="am-track-top">
                  <span className="am-track-name">{step.name}</span>
                  <span className={`am-system-pill am-sys-${step.system}`}>
                    {step.system}
                  </span>
                </div>
                <div className="am-track-meta">
                  <span>Offset: <code>{step.startOffset}</code></span>
                  <span>Duration: {step.duration}ms</span>
                  <span className="am-track-status">{step.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
