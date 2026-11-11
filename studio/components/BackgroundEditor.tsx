import React from "react";
import type { BackgroundType, StudioBackgroundConfig } from "../types/index.js";
import { STUDIO_PALETTES, getPaletteById } from "../engine/background-engine.js";

interface BackgroundEditorProps {
  config: StudioBackgroundConfig;
  onChange: (newConfig: StudioBackgroundConfig) => void;
}

export const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  config,
  onChange,
}) => {
  const onSelectPalette = (paletteId: string) => {
    const pal = getPaletteById(paletteId);
    onChange({
      ...config,
      paletteId: pal.id,
      paletteName: pal.name,
      colors: {
        primary: pal.primary,
        secondary: pal.secondary,
        accent: pal.accent,
        background: pal.background,
      },
    });
  };

  const updateColor = (role: keyof StudioBackgroundConfig["colors"], val: string) => {
    onChange({
      ...config,
      colors: {
        ...config.colors,
        [role]: val,
      },
    });
  };

  const backgroundTypes: { id: BackgroundType; label: string }[] = [
    { id: "gradient", label: "Gradient" },
    { id: "animated-gradient", label: "Animated" },
    { id: "particles", label: "Particles" },
    { id: "aurora", label: "Aurora Glow" },
    { id: "grid", label: "Grid Mesh" },
    { id: "dots", label: "Dot Pattern" },
    { id: "waves", label: "Waves" },
    { id: "noise", label: "Noise Grain" },
    { id: "solid", label: "Solid" },
  ];

  return (
    <div className="editor-panel background-editor">
      <div className="panel-section">
        <h3 className="section-title">Background Type</h3>
        <div className="btn-group-grid">
          {backgroundTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn-pill ${config.type === t.id ? "active" : ""}`}
              onClick={() => onChange({ ...config, type: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Built-in Palettes (33 Palettes)</h3>
        <select
          className="studio-select"
          value={config.paletteId}
          onChange={(e) => onSelectPalette(e.target.value)}
        >
          {STUDIO_PALETTES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Visual Swatch Preview */}
        <div className="palette-swatch-row">
          <span className="swatch-label">Active: {config.paletteName}</span>
          <div className="swatches">
            <span
              className="swatch"
              style={{ backgroundColor: config.colors.primary }}
              title={`Primary: ${config.colors.primary}`}
            />
            <span
              className="swatch"
              style={{ backgroundColor: config.colors.secondary }}
              title={`Secondary: ${config.colors.secondary}`}
            />
            <span
              className="swatch"
              style={{ backgroundColor: config.colors.accent }}
              title={`Accent: ${config.colors.accent}`}
            />
            <span
              className="swatch"
              style={{ backgroundColor: config.colors.background }}
              title={`Base: ${config.colors.background}`}
            />
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Color Overrides</h3>
        <div className="color-picker-grid">
          <label className="color-field">
            <span>Primary</span>
            <input
              type="color"
              value={config.colors.primary.slice(0, 7)}
              onChange={(e) => updateColor("primary", e.target.value)}
            />
          </label>
          <label className="color-field">
            <span>Secondary</span>
            <input
              type="color"
              value={config.colors.secondary.slice(0, 7)}
              onChange={(e) => updateColor("secondary", e.target.value)}
            />
          </label>
          <label className="color-field">
            <span>Accent</span>
            <input
              type="color"
              value={config.colors.accent.slice(0, 7)}
              onChange={(e) => updateColor("accent", e.target.value)}
            />
          </label>
          <label className="color-field">
            <span>Base</span>
            <input
              type="color"
              value={config.colors.background.slice(0, 7)}
              onChange={(e) => updateColor("background", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Parameters & Quality</h3>

        {(config.type === "gradient" || config.type === "animated-gradient") && (
          <div className="control-row">
            <label>Gradient Angle ({config.angle}°)</label>
            <input
              type="range"
              min="0"
              max="360"
              value={config.angle}
              onChange={(e) => onChange({ ...config, angle: Number(e.target.value) })}
            />
          </div>
        )}

        {(config.type === "particles" || config.type === "aurora" || config.type === "animated-gradient") && (
          <div className="control-row">
            <label>Speed ({config.speed.toFixed(1)}x)</label>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={config.speed}
              onChange={(e) => onChange({ ...config, speed: Number(e.target.value) })}
            />
          </div>
        )}

        {config.type === "particles" && (
          <div className="control-row">
            <label>Particle Density ({config.density})</label>
            <input
              type="range"
              min="10"
              max="100"
              value={config.density}
              onChange={(e) => onChange({ ...config, density: Number(e.target.value) })}
            />
          </div>
        )}

        {(config.type === "grid" || config.type === "dots" || config.type === "waves") && (
          <div className="control-row">
            <label>Pattern Scale ({config.scale.toFixed(1)}x)</label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={config.scale}
              onChange={(e) => onChange({ ...config, scale: Number(e.target.value) })}
            />
          </div>
        )}

        <div className="control-row">
          <label>Quality & Frame Budget</label>
          <div className="btn-group-row">
            {(["low", "medium", "high"] as const).map((q) => (
              <button
                key={q}
                type="button"
                className={`btn-pill ${config.quality === q ? "active" : ""}`}
                onClick={() => onChange({ ...config, quality: q })}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
