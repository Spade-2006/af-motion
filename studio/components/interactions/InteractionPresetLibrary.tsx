import React, { useState } from "react";
import type { InteractionStudioState } from "../../types/interactions.js";
import {
  listAvailableInteractionPresets,
  loadInteractionPreset,
} from "../../engine/interactions-engine.js";

interface InteractionPresetLibraryProps {
  state: InteractionStudioState;
  onChange: (updater: (prev: InteractionStudioState) => InteractionStudioState) => void;
}

export const InteractionPresetLibrary: React.FC<InteractionPresetLibraryProps> = ({
  state,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "pointer-drag" | "touch" | "gestures" | "cursor-magnetic"
  >("all");

  const presets = listAvailableInteractionPresets();

  const filteredPresets = presets.filter((p) => {
    const matchesCategory =
      activeCategory === "all" || p.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleApplyPreset = (presetId: string) => {
    onChange((prev) => loadInteractionPreset(presetId, prev));
  };

  return (
    <div className="ip-preset-library">
      <div className="ip-panel-section">
        <h3 className="ip-section-title">Interaction & Gesture Presets</h3>
        <p className="ip-section-desc">
          Production-calibrated interaction presets for drag physics, mobile touch, gesture recognition, and magnetic attraction.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="ip-preset-filter-bar">
        <input
          type="text"
          className="studio-input"
          placeholder="Search interaction presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="ip-category-tabs">
          {(
            [
              { id: "all", label: "All" },
              { id: "pointer-drag", label: "Pointer & Drag" },
              { id: "touch", label: "Touch & Multi-Touch" },
              { id: "gestures", label: "Gestures" },
              { id: "cursor-magnetic", label: "Cursor & Magnetic" },
            ] as const
          ).map((cat) => (
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
      <div className="ip-preset-grid">
        {filteredPresets.map((preset) => (
          <div key={preset.id} className="ip-preset-card">
            <div className="ip-preset-card-header">
              <span className="ip-preset-name">{preset.name}</span>
              <span className={`ip-preset-badge ip-preset-${preset.category}`}>
                {preset.category}
              </span>
            </div>
            <p className="ip-preset-desc">{preset.description}</p>
            <button
              type="button"
              className="studio-btn studio-btn-sm studio-btn-primary"
              onClick={() => handleApplyPreset(preset.id)}
            >
              Apply Preset
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
