import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface AdvancedMotionTimelineProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const AdvancedMotionTimeline: React.FC<AdvancedMotionTimelineProps> = ({
  state,
  onChange,
}) => {
  const { composition } = state;

  const handleTogglePlay = () => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        isPlaying: !prev.composition.isPlaying,
      },
    }));
  };

  const handleReset = () => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        progress: 0,
        isPlaying: false,
      },
    }));
  };

  const handleScrub = (progress: number) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        progress,
      },
    }));
  };

  const handleSpeed = (speed: number) => {
    onChange((prev) => ({
      ...prev,
      composition: {
        ...prev.composition,
        speed,
      },
    }));
  };

  return (
    <div className="am-playback-bar">
      <div className="am-playback-controls">
        <button
          type="button"
          className={`studio-btn studio-btn-sm ${composition.isPlaying ? "active" : ""}`}
          onClick={handleTogglePlay}
        >
          {composition.isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-sm"
          onClick={handleReset}
        >
          ↺ Reset
        </button>
      </div>

      <div className="am-timeline-scrub-group">
        <span className="am-time-label">
          {Math.round(composition.progress * composition.duration)}ms / {composition.duration}ms
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={composition.progress}
          onChange={(e) => handleScrub(Number(e.target.value))}
          className="studio-range"
        />
      </div>

      <div className="am-speed-group">
        <span className="am-speed-label">Speed:</span>
        {([0.5, 1, 2] as const).map((spd) => (
          <button
            key={spd}
            type="button"
            className={`studio-btn studio-btn-xs ${composition.speed === spd ? "active" : ""}`}
            onClick={() => handleSpeed(spd)}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
};
