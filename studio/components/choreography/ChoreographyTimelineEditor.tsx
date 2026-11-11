import React from "react";
import type {
  ChoreographyTrackConfig,
  ChoreographyTimelineState,
} from "../../types/choreography.js";

interface ChoreographyTimelineEditorProps {
  tracks: ChoreographyTrackConfig[];
  timeline: ChoreographyTimelineState;
  onUpdateTrack: (track: ChoreographyTrackConfig) => void;
  onRemoveTrack: (id: string) => void;
  onToggleTrack: (id: string) => void;
  onAddTrack: () => void;
}

export const ChoreographyTimelineEditor: React.FC<ChoreographyTimelineEditorProps> = ({
  tracks,
  timeline,
  onUpdateTrack,
  onRemoveTrack,
  onToggleTrack,
  onAddTrack,
}) => {
  const total = timeline.totalDurationMs;
  const zoom = timeline.zoom;

  // Ruler markers every 200ms
  const markerCount = Math.ceil(total / 200);
  const markers = Array.from({ length: markerCount + 1 }, (_, i) => i * 200);

  const playheadPercent = total > 0 ? (timeline.currentTimeMs / total) * 100 : 0;

  return (
    <div className="ch-timeline-editor">
      <div className="ch-timeline-header">
        <div className="ch-timeline-title-row">
          <h3 className="ch-section-title">⏱️ Multi-Track Animation Timeline</h3>
          <button
            type="button"
            className="ch-add-track-btn"
            onClick={onAddTrack}
            title="Add a new choreography track"
          >
            + Add Track
          </button>
        </div>
        <p className="ch-section-subtitle">
          Sequential and parallel execution tracks coordinated across DOM, Canvas, and 3D scenes.
        </p>
      </div>

      <div className="ch-timeline-scroll-area">
        <div
          className="ch-timeline-canvas"
          style={{ width: `${100 * zoom}%`, minWidth: "100%" }}
        >
          {/* Time Ruler */}
          <div className="ch-time-ruler">
            {markers.map((ms) => {
              const leftPercent = (ms / total) * 100;
              return (
                <div
                  key={ms}
                  className="ch-ruler-tick"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="ch-tick-label">{ms}ms</span>
                </div>
              );
            })}
          </div>

          {/* Current Playhead */}
          <div
            className="ch-playhead-line"
            style={{ left: `${playheadPercent}%` }}
          />

          {/* Track Lanes */}
          <div className="ch-tracks-list">
            {tracks.map((track) => {
              const leftPercent = (track.startMs / total) * 100;
              const widthPercent = Math.max(2, (track.durationMs / total) * 100);

              return (
                <div
                  key={track.id}
                  className={`ch-track-row ${!track.enabled ? "disabled" : ""}`}
                >
                  {/* Track Left Info */}
                  <div className="ch-track-info">
                    <button
                      type="button"
                      className={`ch-track-toggle-btn ${track.enabled ? "active" : ""}`}
                      onClick={() => onToggleTrack(track.id)}
                      title={track.enabled ? "Disable track" : "Enable track"}
                    >
                      {track.enabled ? "👁️" : "🚫"}
                    </button>

                    <div className="ch-track-meta">
                      <span className="ch-track-name">{track.name}</span>
                      <span
                        className="ch-system-pill"
                        style={{ borderColor: track.color, color: track.color }}
                      >
                        {track.system.toUpperCase()}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ch-remove-track-btn"
                      onClick={() => onRemoveTrack(track.id)}
                      title="Remove track"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Track Timeline Lane */}
                  <div className="ch-track-lane">
                    <div
                      className="ch-track-block"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: `${track.color}33`,
                        borderColor: track.color,
                        boxShadow: `0 0 10px ${track.color}44`,
                      }}
                      title={`${track.name} (Start: ${track.startMs}ms, Dur: ${track.durationMs}ms)`}
                    >
                      <span className="ch-block-label">{track.name}</span>
                    </div>
                  </div>

                  {/* Track Timing Inline Inputs */}
                  <div className="ch-track-timing-controls">
                    <label className="ch-inline-label">
                      <span>Start</span>
                      <input
                        type="number"
                        className="ch-mini-number-input"
                        min="0"
                        max={total}
                        step="50"
                        value={track.startMs}
                        onChange={(e) =>
                          onUpdateTrack({
                            ...track,
                            startMs: Number(e.target.value),
                          })
                        }
                      />
                    </label>

                    <label className="ch-inline-label">
                      <span>Dur</span>
                      <input
                        type="number"
                        className="ch-mini-number-input"
                        min="50"
                        max={total}
                        step="50"
                        value={track.durationMs}
                        onChange={(e) =>
                          onUpdateTrack({
                            ...track,
                            durationMs: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
