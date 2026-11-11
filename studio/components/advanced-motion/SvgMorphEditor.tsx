import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";
import { validateSvgPath } from "../../engine/advanced-motion-engine.js";

interface SvgMorphEditorProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const SvgMorphEditor: React.FC<SvgMorphEditorProps> = ({ state, onChange }) => {
  const { svgMorph } = state;

  const updateSvgMorph = (updates: Partial<typeof svgMorph>) => {
    onChange((prev) => ({
      ...prev,
      svgMorph: {
        ...prev.svgMorph,
        ...updates,
      },
    }));
  };

  const handleSourceChange = (val: string) => {
    const valid = validateSvgPath(val);
    updateSvgMorph({
      sourcePath: val,
      isValidSource: valid.isValid,
      validationError: valid.error ?? null,
    });
  };

  const handleTargetChange = (val: string) => {
    const valid = validateSvgPath(val);
    updateSvgMorph({
      targetPath: val,
      isValidTarget: valid.isValid,
      validationError: valid.error ?? null,
    });
  };

  const shapePresets = [
    {
      name: "Circle → Square",
      source: "M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z",
      target: "M 10 10 L 90 10 L 90 90 L 10 90 Z",
    },
    {
      name: "Star → Hexagon",
      source: "M 50 5 L 61 38 L 95 38 L 68 59 L 79 92 L 50 71 L 21 92 L 32 59 L 5 38 L 39 38 Z",
      target: "M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z",
    },
    {
      name: "Menu → Close",
      source: "M 15 25 L 85 25 M 15 50 L 85 50 M 15 75 L 85 75",
      target: "M 20 20 L 80 80 M 20 80 L 80 20",
    },
  ];

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">SVG Path Morphing</h3>
        <p className="am-section-desc">
          Continuous cubic spline interpolation with arc-to-cubic conversion and winding alignment.
        </p>
      </div>

      {/* Preset Quick Selectors */}
      <div className="studio-form-group">
        <label className="studio-label">Shape Morph Presets</label>
        <div className="am-chips-grid">
          {shapePresets.map((sp) => (
            <button
              key={sp.name}
              type="button"
              className="am-chip"
              onClick={() =>
                updateSvgMorph({
                  sourcePath: sp.source,
                  targetPath: sp.target,
                  isValidSource: true,
                  isValidTarget: true,
                  validationError: null,
                })
              }
            >
              {sp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Banner if error */}
      {svgMorph.validationError && (
        <div className="am-validation-banner">
          ⚠️ {svgMorph.validationError}
        </div>
      )}

      {/* Source Path Input */}
      <div className="studio-form-group">
        <label className="studio-label">Source SVG Path (from)</label>
        <textarea
          rows={3}
          value={svgMorph.sourcePath}
          onChange={(e) => handleSourceChange(e.target.value)}
          className={`studio-textarea ${!svgMorph.isValidSource ? "error" : ""}`}
        />
      </div>

      {/* Target Path Input */}
      <div className="studio-form-group">
        <label className="studio-label">Target SVG Path (to)</label>
        <textarea
          rows={3}
          value={svgMorph.targetPath}
          onChange={(e) => handleTargetChange(e.target.value)}
          className={`studio-textarea ${!svgMorph.isValidTarget ? "error" : ""}`}
        />
      </div>

      {/* Morph Progress Scrubber */}
      <div className="studio-form-group">
        <label className="studio-label">
          Morph Progress ({Math.round(svgMorph.progress * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={svgMorph.progress}
          onChange={(e) => updateSvgMorph({ progress: Number(e.target.value) })}
          className="studio-range"
        />
      </div>

      {/* Duration & Loop */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Duration ({svgMorph.duration}ms)</label>
          <input
            type="range"
            min="200"
            max="2000"
            step="50"
            value={svgMorph.duration}
            onChange={(e) => updateSvgMorph({ duration: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-toggle" style={{ alignSelf: "center", marginTop: "12px" }}>
          <label className="studio-toggle-label">
            <input
              type="checkbox"
              checked={svgMorph.loop}
              onChange={(e) => updateSvgMorph({ loop: e.target.checked })}
            />
            <span>Loop Morphing</span>
          </label>
        </div>
      </div>
    </div>
  );
};
