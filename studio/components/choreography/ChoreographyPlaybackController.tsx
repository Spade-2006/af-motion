import React from "react";
import type { ChoreographyTimelineState } from "../../types/choreography.js";

interface ChoreographyPlaybackControllerProps {
  timeline: ChoreographyTimelineState;
  onScrub: (timeMs: number) => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onToggleReverse: () => void;
  onToggleLoop: () => void;
  onChangeSpeed: (rate: number) => void;
  onChangeZoom: (zoom: number) => void;
}

export const ChoreographyPlaybackController: React.FC<ChoreographyPlaybackControllerProps> = ({
  timeline,
  onScrub,
  onTogglePlay,
  onRestart,
  onToggleReverse,
  onToggleLoop,
  onChangeSpeed,
  onChangeZoom,
}) => {
  const progress =
    timeline.totalDurationMs > 0
      ? timeline.currentTimeMs / timeline.totalDurationMs
      : 0;

  return (
    <div className="ch-playback-controller" role="region" aria-label="Choreography Playback">
      {/* Primary Transport Controls */}
      <div className="ch-transport-buttons">
        <button
          type="button"
          className="ch-ctrl-btn"
          onClick={onRestart}
          title="Restart timeline (seek to 0)"
        >
          ⏮️
        </button>

        <button
          type="button"
          className={`ch-ctrl-btn ch-play-btn ${timeline.isPlaying ? "active" : ""}`}
          onClick={onTogglePlay}
          title={timeline.isPlaying ? "Pause" : "Play"}
        >
          {timeline.isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </button>

        <button
          type="button"
          className={`ch-ctrl-btn ${timeline.isReversed ? "active" : ""}`}
          onClick={onToggleReverse}
          title="Toggle reverse playback"
        >
          🔄 Rev
        </button>

        <button
          type="button"
          className={`ch-ctrl-btn ${timeline.isLooping ? "active" : ""}`}
          onClick={onToggleLoop}
          title="Toggle looping"
        >
          🔁 Loop
        </button>
      </div>

      {/* Scrub Slider & Time Display */}
      <div className="ch-scrubber-wrap">
        <input
          type="range"
          className="ch-scrub-slider"
          min="0"
          max={timeline.totalDurationMs}
          step="10"
          value={timeline.currentTimeMs}
          onChange={(e) => onScrub(Number(e.target.value))}
        />
        <div className="ch-time-readout">
          <span className="ch-current-time">{Math.round(timeline.currentTimeMs)}ms</span>
          <span className="ch-divider">/</span>
          <span className="ch-total-time">{timeline.totalDurationMs}ms</span>
          <span className="ch-percent">({Math.round(progress * 100)}%)</span>
        </div>
      </div>

      {/* Rate & Zoom Controls */}
      <div className="ch-transport-secondary">
        <div className="ch-speed-pills">
          {[0.5, 1.0, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              className={`ch-pill-btn ${timeline.playbackRate === rate ? "active" : ""}`}
              onClick={() => onChangeSpeed(rate)}
            >
              {rate}x
            </button>
          ))}
        </div>

        <div className="ch-zoom-pills">
          <span className="ch-label">Zoom:</span>
          {[1.0, 1.5, 2.0].map((z) => (
            <button
              key={z}
              type="button"
              className={`ch-pill-btn ${timeline.zoom === z ? "active" : ""}`}
              onClick={() => onChangeZoom(z)}
            >
              {z}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
