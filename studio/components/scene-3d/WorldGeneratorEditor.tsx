import React, { useState } from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";
import type { WorldPreset } from "../../../src/3d/world/types.js";

interface WorldGeneratorEditorProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const WorldGeneratorEditor: React.FC<WorldGeneratorEditorProps> = ({
  state,
  onChange,
}) => {
  const { world } = state;
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const updateWorld = (updates: Partial<typeof world>) => {
    onChange((prev) => ({
      ...prev,
      world: {
        ...prev.world,
        ...updates,
      },
    }));
  };

  const worldPresets: { id: WorldPreset; label: string }[] = [
    { id: "alpine-landscape", label: "🏔️ Alpine Landscape" },
    { id: "dense-forest", label: "🌲 Dense Forest" },
    { id: "desert-world", label: "🏜️ Desert Dunes" },
    { id: "tropical-island", label: "🏝️ Tropical Island" },
    { id: "snow-mountains", label: "❄️ Snow Mountains" },
    { id: "rolling-grasslands", label: "🌾 Grasslands" },
    { id: "volcanic-landscape", label: "🌋 Volcanic Wasteland" },
    { id: "fantasy-world", label: "✨ Fantasy Islands" },
  ];

  const handleStartGeneration = () => {
    const controller = new AbortController();
    setAbortController(controller);
    updateWorld({ isGenerating: true, generationProgress: 0.2, currentStage: "Synthesizing Hydrology..." });

    setTimeout(() => {
      if (!controller.signal.aborted) {
        updateWorld({
          isGenerating: false,
          generationProgress: 1.0,
          currentStage: "Completed (Hydrology, Biomes, Foliage)",
        });
        setAbortController(null);
      }
    }, 400);
  };

  const handleAbortGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      updateWorld({
        isGenerating: false,
        currentStage: "Generation Cancelled via AbortSignal",
      });
    }
  };

  return (
    <div className="scene3d-editor-panel adv3d-panel" role="region" aria-label="Procedural World Generator">
      <div className="adv3d-panel-header">
        <h3 className="adv3d-section-title">🌍 Procedural World Pipeline</h3>
        <p className="adv3d-section-desc">
          Generate boundless procedural multi-chunk worlds with interconnected rivers,
          lakes, oceans, procedural foliage distribution, and dynamic atmospheric lighting.
        </p>
      </div>

      {/* World Preset Selector */}
      <div className="studio-form-group">
        <label className="studio-label">World Environment Preset</label>
        <div className="studio-btn-group adv3d-chips">
          {worldPresets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                world.preset === p.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateWorld({ preset: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Status & Controls */}
      <div className="adv3d-card adv3d-card-highlight">
        <div className="adv3d-card-header">
          <span className="adv3d-card-label">Pipeline Stage</span>
          <span className="adv3d-badge adv3d-badge-accent">
            {world.isGenerating ? "In Progress" : "Ready"}
          </span>
        </div>
        <div className="adv3d-stage-status">{world.currentStage}</div>

        <div className="adv3d-progress-wrap">
          <div
            className="adv3d-progress-bar"
            style={{ width: `${(world.generationProgress * 100).toFixed(0)}%` }}
          />
        </div>

        <div className="adv3d-actions-row">
          <button
            type="button"
            className="studio-btn studio-btn-sm studio-btn-primary"
            onClick={handleStartGeneration}
            disabled={world.isGenerating}
          >
            ⚡ Generate World
          </button>
          {world.isGenerating && (
            <button
              type="button"
              className="studio-btn studio-btn-sm studio-btn-danger"
              onClick={handleAbortGeneration}
            >
              ⛔ Abort (Signal)
            </button>
          )}
        </div>
      </div>

      {/* Hydrology & Oceans */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Hydrology & Water Systems</h4>

        <div className="adv3d-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">River Systems</label>
              <span className="studio-value-display">{world.hydrology.riversCount}</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={world.hydrology.riversCount}
              onChange={(e) =>
                updateWorld({
                  hydrology: { ...world.hydrology, riversCount: Number(e.target.value) },
                })
              }
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Sea Level (m)</label>
              <span className="studio-value-display">{world.hydrology.seaLevel}m</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={world.hydrology.seaLevel}
              onChange={(e) =>
                updateWorld({
                  hydrology: { ...world.hydrology, seaLevel: Number(e.target.value) },
                })
              }
              className="studio-slider"
            />
          </div>
        </div>
      </div>

      {/* Foliage & Atmosphere */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Atmosphere & Foliage</h4>

        <div className="adv3d-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Vegetation Density</label>
              <span className="studio-value-display">{(world.vegetationDensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={world.vegetationDensity}
              onChange={(e) => updateWorld({ vegetationDensity: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Time of Day (Sun Angle)</label>
              <span className="studio-value-display">{world.atmosphere.timeOfDayHours.toFixed(1)}h</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={world.atmosphere.timeOfDayHours}
              onChange={(e) =>
                updateWorld({
                  atmosphere: { ...world.atmosphere, timeOfDayHours: Number(e.target.value) },
                })
              }
              className="studio-slider"
            />
          </div>
        </div>
      </div>

      {/* Stage Timings Breakdown */}
      <div className="adv3d-panel-section">
        <h4 className="adv3d-subsection-title">Generation Stage Timings</h4>
        <div className="adv3d-specs-grid">
          {Object.entries(world.stageTimings).map(([stage, time]) => (
            <div key={stage} className="adv3d-spec-row">
              <span>{stage} Generation</span>
              <strong>{time.toFixed(1)} ms</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
