import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface KineticTypographyEditorProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const KineticTypographyEditor: React.FC<KineticTypographyEditorProps> = ({
  state,
  onChange,
}) => {
  const { typography } = state;

  const updateTypography = (updates: Partial<typeof typography>) => {
    onChange((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        ...updates,
      },
    }));
  };

  const presets = [
    "slide",
    "fade",
    "scale",
    "blur",
    "rotate",
    "wave",
    "typewriter",
    "scramble",
  ] as const;

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">Kinetic Typography Engine</h3>
        <p className="am-section-desc">
          Lexical character, word, and line segmentation with animated entrance presets and path mapping.
        </p>
      </div>

      {/* Text Content */}
      <div className="studio-form-group">
        <label className="studio-label">Typography Content</label>
        <textarea
          rows={2}
          value={typography.text}
          onChange={(e) => updateTypography({ text: e.target.value })}
          className="studio-textarea"
        />
      </div>

      {/* Segmentation Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Segmentation Granularity</label>
        <div className="studio-btn-group">
          {(["character", "word", "line"] as const).map((seg) => (
            <button
              key={seg}
              type="button"
              className={`studio-btn studio-btn-sm ${
                typography.segmentation === seg ? "active" : ""
              }`}
              onClick={() => updateTypography({ segmentation: seg })}
            >
              {seg.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Animation Preset Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Kinetic Animation Preset</label>
        <div className="am-chips-grid">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              className={`am-chip ${typography.preset === p ? "active" : ""}`}
              onClick={() => updateTypography({ preset: p })}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stagger & Duration */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Duration ({typography.duration}ms)</label>
          <input
            type="range"
            min="200"
            max="1500"
            step="25"
            value={typography.duration}
            onChange={(e) => updateTypography({ duration: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">Stagger ({typography.staggerMs}ms)</label>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={typography.staggerMs}
            onChange={(e) => updateTypography({ staggerMs: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Follow Motion Path Toggle */}
      <div className="am-toggles-grid">
        <label className="studio-toggle-label">
          <input
            type="checkbox"
            checked={typography.followMotionPath}
            onChange={(e) => updateTypography({ followMotionPath: e.target.checked })}
          />
          <span>Map Glyph Coordinates Along Motion Path</span>
        </label>
      </div>
    </div>
  );
};
