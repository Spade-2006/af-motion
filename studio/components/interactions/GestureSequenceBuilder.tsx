import React from "react";
import type { InteractionStudioState } from "../../types/interactions.js";

interface GestureSequenceBuilderProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const GestureSequenceBuilder: React.FC<GestureSequenceBuilderProps> = ({
  state,
  onChange,
}) => {
  const { gestureSequences, activeSequenceIndex } = state;
  const activeSequence = gestureSequences[activeSequenceIndex] || gestureSequences[0];

  const handleSelectSequence = (index: number) => {
    onChange((prev) => ({
      ...prev,
      activeSequenceIndex: index,
    }));
  };

  const handleSimulateStage = (stageIdx: number) => {
    onChange((prev) => {
      const seq = prev.gestureSequences[prev.activeSequenceIndex];
      if (!seq) return prev;

      const nextStageIndex = stageIdx + 1;
      const isMatched = nextStageIndex >= seq.stages.length;

      const updatedSequence = {
        ...seq,
        currentStageIndex: nextStageIndex,
        matchedStages: [...seq.matchedStages, seq.stages[stageIdx].gestureId],
        isMatched,
        isFailed: false,
      };

      const updatedList = [...prev.gestureSequences];
      updatedList[prev.activeSequenceIndex] = updatedSequence;

      return {
        ...prev,
        gestureSequences: updatedList,
      };
    });
  };

  const handleResetSequence = () => {
    onChange((prev) => {
      const updatedList = prev.gestureSequences.map((seq, idx) =>
        idx === prev.activeSequenceIndex
          ? {
              ...seq,
              currentStageIndex: 0,
              matchedStages: [],
              isMatched: false,
              isFailed: false,
            }
          : seq
      );
      return {
        ...prev,
        gestureSequences: updatedList,
      };
    });
  };

  return (
    <div className="ip-editor-panel">
      <div className="ip-panel-section">
        <h3 className="ip-section-title">Gesture Sequence Engine</h3>
        <p className="ip-section-desc">
          Combine discrete gestures into ordered, stateful multi-step interaction flows.
        </p>
      </div>

      {/* Sequence Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Active Sequence Pipeline</label>
        <div className="studio-btn-group">
          {gestureSequences.map((seq, idx) => (
            <button
              key={seq.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                activeSequenceIndex === idx ? "active" : ""
              }`}
              onClick={() => handleSelectSequence(idx)}
            >
              {seq.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sequence Timeline & Stages */}
      {activeSequence && (
        <div className="ip-sequence-card">
          <div className="ip-sequence-header">
            <div>
              <span className="ip-sequence-name">{activeSequence.name}</span>
              <span className="ip-sequence-timeout">
                Timeout: {activeSequence.sequenceTimeoutMs}ms
              </span>
            </div>
            <button
              type="button"
              className="studio-btn studio-btn-xs"
              onClick={handleResetSequence}
            >
              ↺ Reset
            </button>
          </div>

          {/* Stepper Visualization */}
          <div className="ip-sequence-stages">
            {activeSequence.stages.map((stage, idx) => {
              const isCompleted = idx < activeSequence.currentStageIndex;
              const isCurrent = idx === activeSequence.currentStageIndex && !activeSequence.isMatched;

              return (
                <div
                  key={`stage-${idx}`}
                  className={`ip-stage-node ${isCompleted ? "completed" : ""} ${
                    isCurrent ? "current" : ""
                  }`}
                >
                  <div className="ip-stage-marker">
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <div className="ip-stage-info">
                    <span className="ip-stage-gesture">{stage.gestureId}</span>
                    <span className="ip-stage-timing">
                      {stage.timeoutMs ? `${stage.timeoutMs}ms limit` : "no limit"}
                      {stage.optional ? " (optional)" : ""}
                    </span>
                  </div>
                  {isCurrent && (
                    <button
                      type="button"
                      className="studio-btn studio-btn-xs ip-simulate-stage-btn"
                      onClick={() => handleSimulateStage(idx)}
                      title="Trigger and feed this gesture stage into sequence"
                    >
                      Trigger Step
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sequence Status Result */}
          <div className="ip-sequence-status-box">
            {activeSequence.isMatched ? (
              <span className="ip-status-success">
                🎉 Sequence Fully Matched & Executed!
              </span>
            ) : activeSequence.isFailed ? (
              <span className="ip-status-fail">⚠️ Sequence Expired or Failed</span>
            ) : (
              <span className="ip-status-pending">
                Waiting for stage {activeSequence.currentStageIndex + 1}:{" "}
                {activeSequence.stages[activeSequence.currentStageIndex]?.gestureId}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
