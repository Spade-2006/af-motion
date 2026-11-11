import React from "react";
import type {
  GpuSimulationStudioState,
  WeatherPresetType,
  EnvironmentalEffectName,
} from "../../types/gpu-simulations.js";

interface EnvironmentalEffectsEditorProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const EnvironmentalEffectsEditor: React.FC<EnvironmentalEffectsEditorProps> = ({
  state,
  onChange,
}) => {
  const { environment } = state;

  const updateEnvironment = (updates: Partial<typeof environment>) => {
    onChange((prev) => ({
      ...prev,
      environment: {
        ...prev.environment,
        ...updates,
      },
    }));
  };

  const weatherPresets: { id: WeatherPresetType; label: string }[] = [
    { id: "rain", label: "🌧️ Rain" },
    { id: "heavy-rain", label: "⛈️ Monsoon" },
    { id: "snow", label: "❄️ Snow" },
    { id: "blizzard", label: "🌨️ Blizzard" },
    { id: "fog", label: "🌫️ Fog" },
    { id: "storm", label: "⚡ Storm" },
    { id: "firestorm", label: "🔥 Firestorm" },
    { id: "clear", label: "☀️ Clear" },
  ];

  const effectList: { id: EnvironmentalEffectName; label: string }[] = [
    { id: "rain", label: "Rain" },
    { id: "snow", label: "Snow" },
    { id: "fog", label: "Fog" },
    { id: "clouds", label: "Clouds" },
    { id: "fire", label: "Fire" },
    { id: "smoke", label: "Smoke" },
    { id: "lightning", label: "Lightning" },
    { id: "wind", label: "Wind" },
  ];

  const toggleEffect = (effect: EnvironmentalEffectName) => {
    const active = environment.activeEffects.includes(effect)
      ? environment.activeEffects.filter((e) => e !== effect)
      : [...environment.activeEffects, effect];
    updateEnvironment({ activeEffects: active });
  };

  return (
    <div className="sim-editor-panel" role="region" aria-label="Environmental Effects Editor">
      <div className="sim-panel-section">
        <h3 className="sim-section-title">Atmospheric & Environmental Simulation</h3>
        <p className="sim-section-desc">
          Combine multi-scale weather presets, precipitation systems, turbulent wind vectors,
          and electric lightning events.
        </p>
      </div>

      {/* Preset Picker */}
      <div className="studio-form-group">
        <label className="studio-label">Weather Preset</label>
        <div className="studio-btn-group sim-preset-chips">
          {weatherPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                environment.weatherPreset === preset.id ? "studio-btn-primary" : "studio-btn-outline"
              }`}
              onClick={() => updateEnvironment({ weatherPreset: preset.id })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Effect Subsystems */}
      <div className="studio-form-group">
        <label className="studio-label">Active Atmospheric Subsystems</label>
        <div className="sim-effect-chips">
          {effectList.map((effect) => {
            const isActive = environment.activeEffects.includes(effect.id);
            return (
              <button
                key={effect.id}
                type="button"
                className={`sim-chip ${isActive ? "active" : ""}`}
                onClick={() => toggleEffect(effect.id)}
              >
                {isActive ? "✓ " : "+ "}
                {effect.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Density & Speed */}
      <div className="sim-grid-two">
        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Density</label>
            <span className="studio-value-display">{(environment.density * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={environment.density}
            onChange={(e) => updateEnvironment({ density: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Speed Scale</label>
            <span className="studio-value-display">{environment.speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={environment.speed}
            onChange={(e) => updateEnvironment({ speed: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>

      {/* Wind & Precipitation */}
      <div className="sim-panel-section">
        <h4 className="sim-subsection-title">Wind & Turbulence</h4>
        <div className="sim-grid-two">
          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Wind Intensity</label>
              <span className="studio-value-display">{environment.windIntensity}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={environment.windIntensity}
              onChange={(e) => updateEnvironment({ windIntensity: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>

          <div className="studio-form-group">
            <div className="studio-field-header">
              <label className="studio-label">Precipitation Rate</label>
              <span className="studio-value-display">{environment.precipitationRate}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={environment.precipitationRate}
              onChange={(e) => updateEnvironment({ precipitationRate: Number(e.target.value) })}
              className="studio-slider"
            />
          </div>
        </div>

        <div className="studio-form-group">
          <div className="studio-field-header">
            <label className="studio-label">Lightning Frequency</label>
            <span className="studio-value-display">{(environment.lightningFrequency * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={environment.lightningFrequency}
            onChange={(e) => updateEnvironment({ lightningFrequency: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </div>
    </div>
  );
};
