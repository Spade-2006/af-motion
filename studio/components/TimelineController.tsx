import React from "react";
import type { StudioTimelineState } from "../types/index.js";

interface TimelineControllerProps {
  timeline: StudioTimelineState;
  onScrub: (progress: number) => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onToggleReverse: () => void;
  onToggleLoop: () => void;
}

export const TimelineController: React.FC<TimelineControllerProps> = ({
  timeline,
  onScrub,
  onTogglePlay,
  onRestart,
  onToggleReverse,
  onToggleLoop,
}) => {
  const currentSeconds = (timeline.currentTimeMs / 1000).toFixed(2);
  const totalSeconds = (timeline.durationMs / 1000).toFixed(2);
  const percent = Math.round(timeline.progress * 100);

  return (
    <div className="timeline-dock">
      <div className="timeline-controls-row">
        <button
          type="button"
          className="btn-playback btn-restart"
          onClick={onRestart}
          title="Restart from beginning"
        >
          ⏮️
        </button>

        <button
          type="button"
          className="btn-playback btn-play-pause"
          onClick={onTogglePlay}
          title={timeline.isPlaying ? "Pause" : "Play"}
        >
          {timeline.isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>

        <button
          type="button"
          className={`btn-playback btn-reverse ${timeline.isReversed ? "active" : ""}`}
          onClick={onToggleReverse}
          title="Play in reverse"
        >
          🔁 Reverse
        </button>

        <button
          type="button"
          className={`btn-playback btn-loop ${timeline.isLooping ? "active" : ""}`}
          onClick={onToggleLoop}
          title="Loop playback"
        >
          🔂 Loop: {timeline.isLooping ? "ON" : "OFF"}
        </button>

        <div className="timeline-time-display">
          <span className="current-time">{currentSeconds}s</span>
          <span className="time-divider">/</span>
          <span className="total-time">{totalSeconds}s</span>
          <span className="percent-badge">{percent}%</span>
        </div>

        <div className="timeline-fps-badge">
          <span className="fps-dot" />
          <span>{timeline.fps} FPS</span>
        </div>
      </div>

      <div className="timeline-scrubber-track">
        <input
          type="range"
          className="timeline-slider"
          min="0"
          max="1"
          step="0.005"
          value={timeline.progress}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          aria-label="Timeline Scrubber"
        />
        <div
          className="timeline-progress-bar"
          style={{ width: `${timeline.progress * 100}%` }}
        />
      </div>
    </div>
  );
};
