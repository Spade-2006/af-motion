import React, { useState } from "react";
import type { StudioTab } from "../../types/index.js";
import type {
  UnifiedCompositionState,
  UnifiedPresetEntry,
  UnifiedSubsystemId,
} from "../../types/unified-playground.js";
import {
  searchUnifiedPresets,
  applyUnifiedPreset,
} from "../../engine/unified-playground-engine.js";

interface UnifiedPresetHubProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
  onNavigateModule?: (tab: StudioTab) => void;
}

const CATEGORY_CHIPS = [
  { id: "all", label: "All Presets" },
  { id: "animation", label: "Animation" },
  { id: "background", label: "Background" },
  { id: "styles", label: "Styles" },
  { id: "designSystem", label: "Design System" },
  { id: "choreography", label: "Choreography" },
  { id: "3d", label: "3D & Worlds" },
  { id: "physics", label: "Physics" },
  { id: "interactions", label: "Interactions" },
  { id: "advancedMotion", label: "Advanced Motion" },
  { id: "simulations", label: "Simulations" },
];

export const UnifiedPresetHub: React.FC<UnifiedPresetHubProps> = ({
  state,
  onChange,
  onNavigateModule,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPresets = searchUnifiedPresets(searchQuery, selectedCategory);

  const handleApply = (preset: UnifiedPresetEntry) => {
    onChange((prev) => applyUnifiedPreset(prev, preset));
  };

  const handleOpenModule = (targetTab: StudioTab) => {
    onNavigateModule?.(targetTab);
  };

  return (
    <div className="unified-preset-hub" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* 1. Search Bar */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="search"
          placeholder="Search all 60+ unified presets by name, tags, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#F8FAFC",
            fontSize: "0.85rem",
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#94A3B8",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* 2. Category Filter Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {CATEGORY_CHIPS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`unified-chip ${isSelected ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "4px 10px",
                borderRadius: "20px",
                border: isSelected ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.08)",
                background: isSelected ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: isSelected ? "#38BDF8" : "#94A3B8",
                fontSize: "0.75rem",
                fontWeight: isSelected ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 3. Preset Cards Gallery */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "10px",
          maxHeight: "480px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              gap: "8px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(56, 189, 248, 0.12)",
                    color: "#38BDF8",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {preset.subsystem}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{preset.category}</span>
              </div>

              <h5 style={{ margin: "4px 0", fontSize: "0.95rem", color: "#F8FAFC", fontWeight: 600 }}>
                {preset.name}
              </h5>
              <p style={{ margin: "0 0 6px", fontSize: "0.78rem", color: "#94A3B8", lineHeight: 1.4 }}>
                {preset.description}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                {preset.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.65rem",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#64748B",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="btn-apply-preset"
                onClick={() => handleApply(preset)}
                style={{
                  flex: 1,
                  padding: "6px",
                  borderRadius: "5px",
                  border: "none",
                  background: "#38BDF8",
                  color: "#0F172A",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Apply to Scene
              </button>
              <button
                type="button"
                className="btn-open-module"
                onClick={() => handleOpenModule(preset.targetTab)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "5px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#E2E8F0",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
                title={`Open in ${preset.targetTab} module`}
              >
                Open Studio ↗
              </button>
            </div>
          </div>
        ))}

        {filteredPresets.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#64748B" }}>
            No presets matching "{searchQuery}" in category "{selectedCategory}".
          </div>
        )}
      </div>
    </div>
  );
};
