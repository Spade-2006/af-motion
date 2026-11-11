import React, { useState } from "react";
import type { Advanced3DStudioState } from "../../types/advanced-3d.js";
import { ADVANCED_3D_PRESETS, applyAdvanced3DPreset } from "../../engine/advanced-3d-engine.js";

interface Advanced3DPresetLibraryProps {
  state: Advanced3DStudioState;
  onChange: (updater: (prev: Advanced3DStudioState) => Advanced3DStudioState) => void;
}

export const Advanced3DPresetLibrary: React.FC<Advanced3DPresetLibraryProps> = ({
  state,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Presets" },
    { id: "physics", label: "⚛️ 3D Physics" },
    { id: "soft-bodies", label: "🧶 Soft Bodies" },
    { id: "terrain", label: "🏔️ Terrain" },
    { id: "world", label: "🌍 Worlds" },
    { id: "optimization", label: "🔬 Optimization" },
    { id: "morphing", label: "🌀 3D Morphing" },
  ];

  const filteredPresets = ADVANCED_3D_PRESETS.filter((preset) => {
    const matchesCategory =
      selectedCategory === "all" || preset.category === selectedCategory;
    const query = search.toLowerCase();
    const matchesSearch =
      preset.name.toLowerCase().includes(query) ||
      preset.description.toLowerCase().includes(query) ||
      preset.tags.some((t) => t.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleApply = (id: string) => {
    onChange((prev) => applyAdvanced3DPreset(prev, id));
  };

  return (
    <div className="adv3d-preset-library" role="region" aria-label="3D Preset Library">
      {/* Header & Search */}
      <div className="adv3d-library-header">
        <div>
          <h3 className="adv3d-section-title">Production 3D &amp; World Presets ({ADVANCED_3D_PRESETS.length})</h3>
          <p className="adv3d-section-desc">
            Instantly load production configurations for 3D physics worlds, cloth simulations,
            procedural eroded mountains, multi-chunk biomes, and topological morph pairings.
          </p>
        </div>
        <div className="adv3d-search-bar">
          <input
            type="search"
            placeholder="Search 3D presets, tags, physics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="studio-input adv3d-search-input"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="adv3d-category-nav">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`studio-btn studio-btn-sm ${
              selectedCategory === cat.id ? "studio-btn-primary" : "studio-btn-outline"
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Preset Cards Grid */}
      <div className="adv3d-presets-grid">
        {filteredPresets.map((preset) => {
          const isSelected = state.selectedPresetId === preset.id;
          return (
            <div
              key={preset.id}
              className={`adv3d-preset-card ${isSelected ? "selected" : ""}`}
            >
              <div className="adv3d-preset-card-top">
                <span className="adv3d-badge adv3d-badge-accent">{preset.category}</span>
                {isSelected && <span className="adv3d-badge adv3d-badge-success">Active</span>}
              </div>

              <h4 className="adv3d-preset-name">{preset.name}</h4>
              <p className="adv3d-preset-desc">{preset.description}</p>

              <div className="adv3d-preset-tags">
                {preset.tags.map((tag) => (
                  <span key={tag} className="adv3d-tag">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="adv3d-preset-card-actions">
                <button
                  type="button"
                  className={`studio-btn studio-btn-sm ${
                    isSelected ? "studio-btn-outline" : "studio-btn-primary"
                  }`}
                  onClick={() => handleApply(preset.id)}
                >
                  {isSelected ? "✓ Applied" : "Load Preset"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
