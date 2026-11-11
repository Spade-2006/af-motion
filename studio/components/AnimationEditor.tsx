import React from "react";
import type { PreviewTargetKind, StudioAnimationConfig } from "../types/index.js";
import { ANIMATION_PRESETS } from "../engine/animation-engine.js";

interface AnimationEditorProps {
  config: StudioAnimationConfig;
  onChange: (newConfig: StudioAnimationConfig) => void;
  onReplay: () => void;
}

export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  config,
  onChange,
  onReplay,
}) => {
  const updateProperty = (key: keyof StudioAnimationConfig["properties"], val: number | string) => {
    onChange({
      ...config,
      preset: undefined, // manual override clears preset badge
      properties: {
        ...config.properties,
        [key]: val,
      },
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = ANIMATION_PRESETS[presetKey];
    if (!preset) return;
    onChange({
      ...config,
      preset: presetKey,
      duration: preset.config.duration ?? config.duration,
      easing: preset.config.easing ?? config.easing,
      properties: {
        ...config.properties,
        ...(preset.config.properties ?? {}),
      },
    });
    onReplay();
  };

  return (
    <div className="editor-panel animation-editor">
      <div className="panel-section">
        <h3 className="section-title">Presets</h3>
        <div className="preset-grid">
          {Object.entries(ANIMATION_PRESETS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              className={`preset-card-btn ${config.preset === key ? "active" : ""}`}
              onClick={() => applyPreset(key)}
              title={item.description}
            >
              <span className="preset-name">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Target Element</h3>
        <div className="btn-group-row">
          {(["card", "button", "badge", "icon", "text"] as PreviewTargetKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              className={`btn-pill ${config.target === kind ? "active" : ""}`}
              onClick={() => onChange({ ...config, target: kind })}
            >
              {kind.charAt(0).toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Transform & Appearance</h3>

        <div className="control-row">
          <label>Offset X ({config.properties.x}px)</label>
          <input
            type="range"
            min="-150"
            max="150"
            value={config.properties.x}
            onChange={(e) => updateProperty("x", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Offset Y ({config.properties.y}px)</label>
          <input
            type="range"
            min="-150"
            max="150"
            value={config.properties.y}
            onChange={(e) => updateProperty("y", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Scale ({config.properties.scale.toFixed(2)}x)</label>
          <input
            type="range"
            min="0.4"
            max="2.0"
            step="0.05"
            value={config.properties.scale}
            onChange={(e) => updateProperty("scale", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Rotate ({config.properties.rotate}°)</label>
          <input
            type="range"
            min="-360"
            max="360"
            value={config.properties.rotate}
            onChange={(e) => updateProperty("rotate", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Opacity ({Math.round(config.properties.opacity * 100)}%)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.properties.opacity}
            onChange={(e) => updateProperty("opacity", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Blur ({config.properties.blur}px)</label>
          <input
            type="range"
            min="0"
            max="20"
            value={config.properties.blur}
            onChange={(e) => updateProperty("blur", Number(e.target.value))}
          />
        </div>

        <div className="control-row">
          <label>Border Radius ({config.properties.borderRadius}px)</label>
          <input
            type="range"
            min="0"
            max="40"
            value={config.properties.borderRadius}
            onChange={(e) => updateProperty("borderRadius", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Timing & Easing</h3>

        <div className="control-row">
          <label>Duration ({config.duration}ms)</label>
          <input
            type="range"
            min="100"
            max="3000"
            step="50"
            value={config.duration}
            onChange={(e) => onChange({ ...config, duration: Number(e.target.value) })}
          />
        </div>

        <div className="control-row">
          <label>Delay ({config.delay}ms)</label>
          <input
            type="range"
            min="0"
            max="1500"
            step="50"
            value={config.delay}
            onChange={(e) => onChange({ ...config, delay: Number(e.target.value) })}
          />
        </div>

        <div className="control-row">
          <label>Easing Curve</label>
          <select
            className="studio-select"
            value={config.easing}
            onChange={(e) => onChange({ ...config, easing: e.target.value })}
          >
            <option value="cubic-bezier(0.16, 1, 0.3, 1)">Smooth Decel (0.16, 1, 0.3, 1)</option>
            <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">Spring Overshoot (0.34, 1.56, 0.64, 1)</option>
            <option value="cubic-bezier(0.25, 1, 0.5, 1)">Standard Ease (0.25, 1, 0.5, 1)</option>
            <option value="easeInOut">Ease In Out</option>
            <option value="easeOut">Ease Out</option>
            <option value="easeIn">Ease In</option>
            <option value="linear">Linear</option>
          </select>
        </div>

        <div className="control-row">
          <label>Iteration Count</label>
          <select
            className="studio-select"
            value={String(config.iterations)}
            onChange={(e) =>
              onChange({
                ...config,
                iterations: e.target.value === "infinite" ? "infinite" : Number(e.target.value),
              })
            }
          >
            <option value="1">1 (Once)</option>
            <option value="2">2 Times</option>
            <option value="3">3 Times</option>
            <option value="infinite">Infinite Loop</option>
          </select>
        </div>
      </div>
    </div>
  );
};
