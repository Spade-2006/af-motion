import React, { useState } from "react";
import type { AdvancedMotionStudioState } from "../../types/advanced-motion.js";
import {
  listAvailableAdvancedMotionPresets,
  loadAdvancedMotionPreset,
} from "../../engine/advanced-motion-engine.js";

interface AdvancedMotionPresetLibraryProps {
  state: AdvancedMotionStudioState;
  onChange: (updater: (prev: AdvancedMotionStudioState) => AdvancedMotionStudioState) => void;
}

export const AdvancedMotionPresetLibrary: React.FC<AdvancedMotionPresetLibraryProps> = ({
  state,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "layout" | "svg-morph" | "motion-path" | "typography" | "transitions" | "composition"
  >("all");

  const presets = listAvailableAdvancedMotionPresets();

  const filteredPresets = presets.filter((p) => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleApply = (id: string) => {
    onChange((prev) => loadAdvancedMotionPreset(id, prev));
  };

  const categories = [
    { id: "all", label: "All Presets" },
    { id: "layout", label: "Layout" },
    { id: "svg-morph", label: "SVG Morph" },
    { id: "motion-path", label: "Motion Paths" },
    { id: "typography", label: "Typography" },
    { id: "transitions", label: "Transitions" },
    { id: "composition", label: "Composition" },
  ] as const;

  return (
    <div className="am-preset-library">
      <div className="am-panel-section">
        <h3 className="am-section-title">Advanced Motion & Morphing Presets</h3>
        <p className="am-section-desc">
          24 verified production recipes across layout animation, spline morphing, motion paths, and multi-system composition.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="am-preset-filter-bar">
        <input
          type="text"
          className="studio-input"
          placeholder="Search advanced motion presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="am-category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`studio-btn studio-btn-sm ${
                activeCategory === cat.id ? "active" : ""
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Grid */}
      <div className="am-preset-grid">
        {filteredPresets.map((preset) => (
          <div key={preset.id} className="am-preset-card">
            <div className="am-preset-card-header">
              <span className="am-preset-name">{preset.name}</span>
              <span className={`am-preset-badge am-preset-${preset.category}`}>
                {preset.category}
              </span>
            </div>
            <p className="am-preset-desc">{preset.description}</p>
            <button
              type="button"
              className="studio-btn studio-btn-sm studio-btn-primary"
              onClick={() => handleApply(preset.id)}
            >
              Apply Preset
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
