import React, { useState } from "react";
import type { GpuSimulationStudioState } from "../../types/gpu-simulations.js";
import { SIMULATION_PRESETS, applySimulationPreset } from "../../engine/gpu-simulations-engine.js";

interface SimulationPresetLibraryProps {
  state: GpuSimulationStudioState;
  onChange: (updater: (prev: GpuSimulationStudioState) => GpuSimulationStudioState) => void;
}

export const SimulationPresetLibrary: React.FC<SimulationPresetLibraryProps> = ({
  state,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Presets" },
    { id: "particles", label: "✨ Particles" },
    { id: "fluid", label: "💧 Fluid" },
    { id: "environment", label: "🌪️ Environment" },
    { id: "interactive", label: "🧲 Interactive" },
    { id: "composition", label: "🎬 Composition" },
  ];

  const filteredPresets = SIMULATION_PRESETS.filter((preset) => {
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
    onChange((prev) => applySimulationPreset(prev, id));
  };

  return (
    <div className="sim-preset-library" role="region" aria-label="Simulation Preset Library">
      {/* Header and Search */}
      <div className="sim-library-header">
        <div>
          <h3 className="sim-section-title">Production Simulation Presets ({SIMULATION_PRESETS.length})</h3>
          <p className="sim-section-desc">
            Instantly load production-ready particle systems, Navier-Stokes fluids, atmospheric
            weather engines, and synchronized multi-layer compositions.
          </p>
        </div>
        <div className="sim-search-bar">
          <input
            type="search"
            placeholder="Search presets, tags, physics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="studio-input sim-search-input"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="sim-category-nav">
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
      <div className="sim-presets-grid">
        {filteredPresets.map((preset) => {
          const isSelected = state.selectedPresetId === preset.id;
          return (
            <div
              key={preset.id}
              className={`sim-preset-card ${isSelected ? "selected" : ""}`}
            >
              <div className="sim-preset-card-top">
                <span className="sim-badge sim-badge-accent">{preset.category}</span>
                {isSelected && <span className="sim-badge sim-badge-success">Active</span>}
              </div>

              <h4 className="sim-preset-name">{preset.name}</h4>
              <p className="sim-preset-desc">{preset.description}</p>

              <div className="sim-preset-tags">
                {preset.tags.map((tag) => (
                  <span key={tag} className="sim-tag">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="sim-preset-card-actions">
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
