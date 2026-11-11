import React, { useState, useMemo } from "react";
import {
  listAllPalettes,
  getPaletteByName,
} from "../../engine/design-system-dna-engine.js";
import type { SemanticColorTokens } from "../../../src/core/palettes.js";

interface DesignSystemPaletteSelectorProps {
  activePaletteName: string;
  onSelectPalette: (paletteName: string) => void;
  colorOverrides: Partial<SemanticColorTokens>;
  onColorChange: (key: keyof SemanticColorTokens, value: string) => void;
  onResetColors: () => void;
}

export const DesignSystemPaletteSelector: React.FC<DesignSystemPaletteSelectorProps> = ({
  activePaletteName,
  onSelectPalette,
  colorOverrides,
  onColorChange,
  onResetColors,
}) => {
  const [search, setSearch] = useState("");
  const allPalettes = useMemo(() => listAllPalettes(), []);

  const filteredPalettes = useMemo(() => {
    if (!search.trim()) return allPalettes;
    const q = search.toLowerCase();
    return allPalettes.filter((p) => p.toLowerCase().includes(q));
  }, [allPalettes, search]);

  const activePalette = useMemo(
    () => getPaletteByName(activePaletteName),
    [activePaletteName]
  );

  return (
    <div className="ds-palette-selector-panel">
      <div className="ds-section-header">
        <h3 className="ds-section-title">🎨 Built-in Color Palettes</h3>
        <span className="ds-count-badge">{allPalettes.length} Palettes</span>
      </div>

      <p className="ds-section-subtitle">
        Select from 33 immutable built-in palettes or override individual semantic tokens.
      </p>

      {/* Palette Search */}
      <div className="ds-search-box">
        <input
          type="text"
          className="ds-search-input"
          placeholder="Search 33 built-in palettes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Palette Cards Grid */}
      <div className="ds-palettes-grid" role="list">
        {filteredPalettes.map((name) => {
          const pal = getPaletteByName(name);
          const isSelected = name === activePaletteName;
          const t = pal.tokens;

          return (
            <button
              key={name}
              type="button"
              role="listitem"
              className={`ds-palette-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectPalette(name)}
            >
              <div className="ds-palette-card-header">
                <span className="ds-palette-name">{name}</span>
                {isSelected && <span className="ds-active-pill">Active</span>}
              </div>

              <div className="ds-palette-swatches">
                <div
                  className="ds-swatch"
                  style={{ background: t.primary }}
                  title={`Primary: ${t.primary}`}
                />
                <div
                  className="ds-swatch"
                  style={{ background: t.secondary }}
                  title={`Secondary: ${t.secondary}`}
                />
                <div
                  className="ds-swatch"
                  style={{ background: t.accent }}
                  title={`Accent: ${t.accent}`}
                />
                <div
                  className="ds-swatch"
                  style={{ background: t.surface }}
                  title={`Surface: ${t.surface}`}
                />
                <div
                  className="ds-swatch"
                  style={{ background: t.background }}
                  title={`Background: ${t.background}`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Token Overrides */}
      <div className="ds-token-overrides-section">
        <div className="ds-overrides-header">
          <h4 className="ds-overrides-title">
            Token Overrides for <em>{activePaletteName}</em>
          </h4>
          <button
            type="button"
            className="ds-reset-btn"
            onClick={onResetColors}
            title="Reset colors to palette defaults"
          >
            Reset Overrides
          </button>
        </div>

        <div className="ds-color-inputs-grid">
          {(
            [
              { key: "primary", label: "Primary" },
              { key: "secondary", label: "Secondary" },
              { key: "accent", label: "Accent" },
              { key: "background", label: "Background" },
              { key: "surface", label: "Surface" },
              { key: "text", label: "Text" },
              { key: "muted", label: "Muted Text" },
              { key: "border", label: "Border" },
              { key: "success", label: "Success" },
              { key: "warning", label: "Warning" },
              { key: "error", label: "Error" },
              { key: "info", label: "Info" },
            ] as const
          ).map(({ key, label }) => {
            const val =
              colorOverrides[key] ?? activePalette.tokens[key] ?? "#000000";

            return (
              <div key={key} className="ds-color-field">
                <label className="ds-color-label">{label}</label>
                <div className="ds-color-picker-wrap">
                  <input
                    type="color"
                    className="ds-color-picker"
                    value={val.startsWith("#") ? val : "#888888"}
                    onChange={(e) => onColorChange(key, e.target.value)}
                  />
                  <input
                    type="text"
                    className="ds-hex-input"
                    value={val}
                    onChange={(e) => onColorChange(key, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
