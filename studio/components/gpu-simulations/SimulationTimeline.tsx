import React from "react";
import type { GpuSimulationStudioState } from "../../types/gpu-simulations.js";

interface SimulationTimelineProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  state,
  onChange,
}) => {
  const { isPlaying, playbackSpeed, currentTimeMs } = state;

  const togglePlay = () => {
    onChange((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleRestart = () => {
    onChange((prev) => ({
      ...prev,
      currentTimeMs: 0,
      isPlaying: true,
    }));
  };

  const handleStep = () => {
    onChange((prev) => ({
      ...prev,
      isPlaying: false,
      currentTimeMs: prev.currentTimeMs + 16.67,
    }));
  };

  const speeds = [0.25, 0.5, 1.0, 2.0];

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const mins = Math.floor(totalSeconds / 60);
    const secs = (totalSeconds % 60).toFixed(2);
    return `${mins.toString().padStart(2, "0")}:${secs.padStart(5, "0")}s`;
  };

  return (
    <div className="sim-timeline-bar" role="toolbar" aria-label="Simulation Playback Timeline">
      <div className="sim-timeline-left">
        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-primary"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause Simulation" : "Play Simulation"}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-outline"
          onClick={handleRestart}
          aria-label="Restart Simulation"
        >
          ↺ Restart
        </button>

        <button
          type="button"
          className="studio-btn studio-btn-sm studio-btn-outline"
          onClick={handleStep}
          aria-label="Step Frame Forward"
        >
          ⏯ Step
        </button>

        <span className="sim-timeline-timer">{formatTime(currentTimeMs)}</span>
      </div>

      <div className="sim-timeline-right">
        <span className="sim-timeline-label">Speed:</span>
        <div className="studio-btn-group">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              className={`studio-btn studio-btn-sm ${
                playbackSpeed === s ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => onChange((prev) => ({ ...prev, playbackSpeed: s }))}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
