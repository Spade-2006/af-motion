import React from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";

interface LayoutAnimationEditorProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const LayoutAnimationEditor: React.FC<LayoutAnimationEditorProps> = ({
  state,
  onChange,
}) => {
  const { layout } = state;

  const updateLayout = (updates: Partial<typeof layout>) => {
    onChange((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        ...updates,
      },
    }));
  };

  const handleShuffle = () => {
    const shuffled = [...layout.layoutItems].sort(() => Math.random() - 0.5);
    updateLayout({
      layoutItems: shuffled,
      flipData: {
        dx: Math.round((Math.random() - 0.5) * 80),
        dy: Math.round((Math.random() - 0.5) * 60),
        dw: 1,
        dh: 1,
        transform: `translate(${Math.round((Math.random() - 0.5) * 80)}px, ${Math.round(
          (Math.random() - 0.5) * 60
        )}px)`,
      },
    });
  };

  const handleToggleMode = (mode: "grid" | "list" | "masonry") => {
    updateLayout({ layoutMode: mode });
  };

  return (
    <div className="am-editor-panel">
      <div className="am-panel-section">
        <h3 className="am-section-title">Automatic Layout Animation (FLIP)</h3>
        <p className="am-section-desc">
          First-Last-Invert-Play layout transforms with coordinated stagger and scroll awareness.
        </p>
      </div>

      {/* Layout Mode Selector */}
      <div className="studio-form-group">
        <label className="studio-label">Layout Arrangement</label>
        <div className="studio-btn-group">
          {(["grid", "list", "masonry"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`studio-btn studio-btn-sm ${layout.layoutMode === mode ? "active" : ""}`}
              onClick={() => handleToggleMode(mode)}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stagger & Timing */}
      <div className="studio-form-row">
        <div className="studio-form-group">
          <label className="studio-label">Duration ({layout.duration}ms)</label>
          <input
            type="range"
            min="150"
            max="1200"
            step="25"
            value={layout.duration}
            onChange={(e) => updateLayout({ duration: Number(e.target.value) })}
            className="studio-range"
          />
        </div>

        <div className="studio-form-group">
          <label className="studio-label">Stagger ({layout.staggerMs}ms)</label>
          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={layout.staggerMs}
            onChange={(e) => updateLayout({ staggerMs: Number(e.target.value) })}
            className="studio-range"
          />
        </div>
      </div>

      {/* Stagger Direction */}
      <div className="studio-form-group">
        <label className="studio-label">Stagger Wave Direction</label>
        <div className="studio-btn-group">
          {(["forward", "reverse", "center", "random"] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              className={`studio-btn studio-btn-sm ${
                layout.staggerDirection === dir ? "active" : ""
              }`}
              onClick={() => updateLayout({ staggerDirection: dir })}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* FLIP Matrix Inspector */}
      <div className="am-panel-subcard">
        <h4 className="am-subcard-title">FLIP Geometry Matrix</h4>
        <div className="am-flip-readout">
          <div className="am-flip-cell">
            <span className="am-flip-label">ΔX Offset</span>
            <span className="am-flip-val">{layout.flipData?.dx ?? 0}px</span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">ΔY Offset</span>
            <span className="am-flip-val">{layout.flipData?.dy ?? 0}px</span>
          </div>
          <div className="am-flip-cell">
            <span className="am-flip-label">Scale Factor</span>
            <span className="am-flip-val">
              {layout.flipData?.dw ?? 1}x, {layout.flipData?.dh ?? 1}x
            </span>
          </div>
        </div>
        <div className="am-flip-transform">
          <code>transform: {layout.flipData?.transform}</code>
        </div>
      </div>

      {/* Actions */}
      <div className="am-actions-row">
        <button
          type="button"
          className="studio-btn studio-btn-primary studio-btn-sm"
          onClick={handleShuffle}
        >
          🔀 Trigger FLIP Layout Shuffle
        </button>
      </div>
    </div>
  );
};
