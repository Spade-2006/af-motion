import React, { useState } from "react";
import type {
  CustomDesignSystemTokens,
  DesignTokenCategory,
} from "../../types/design-systems.js";

interface DesignSystemTokenEditorProps {
  tokens: CustomDesignSystemTokens;
  onChange: (tokens: CustomDesignSystemTokens) => void;
  onReset: () => void;
}

export const DesignSystemTokenEditor: React.FC<DesignSystemTokenEditorProps> = ({
  tokens,
  onChange,
  onReset,
}) => {
  const [activeCategory, setActiveCategory] = useState<DesignTokenCategory>("typography");

  const updateTypography = (
    key: keyof CustomDesignSystemTokens["typography"],
    val: any
  ) => {
    onChange({
      ...tokens,
      typography: {
        ...tokens.typography,
        [key]: val,
      },
    });
  };

  const updateSpacing = (
    key: keyof CustomDesignSystemTokens["spacing"],
    val: number
  ) => {
    onChange({
      ...tokens,
      spacing: {
        ...tokens.spacing,
        [key]: val,
      },
    });
  };

  const updateInteraction = (
    key: keyof CustomDesignSystemTokens["interaction"],
    val: number
  ) => {
    onChange({
      ...tokens,
      interaction: {
        ...tokens.interaction,
        [key]: val,
      },
    });
  };

  return (
    <div className="ds-token-editor-panel">
      <div className="ds-section-header">
        <h3 className="ds-section-title">📐 Design System Tokens</h3>
        <button
          type="button"
          className="ds-reset-btn"
          onClick={onReset}
          title="Reset tokens to system defaults"
        >
          Reset Tokens
        </button>
      </div>

      <p className="ds-section-subtitle">
        Configure responsive typography, proportional spacing scales, and interaction physics.
      </p>

      {/* Sub-Category Navigation */}
      <div className="ds-subnav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === "typography"}
          className={`ds-subnav-btn ${activeCategory === "typography" ? "active" : ""}`}
          onClick={() => setActiveCategory("typography")}
        >
          🔤 Typography
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === "spacing"}
          className={`ds-subnav-btn ${activeCategory === "spacing" ? "active" : ""}`}
          onClick={() => setActiveCategory("spacing")}
        >
          📏 Spacing & Layout
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === "surfaces"}
          className={`ds-subnav-btn ${activeCategory === "surfaces" ? "active" : ""}`}
          onClick={() => setActiveCategory("surfaces")}
        >
          👆 Interaction & Surfaces
        </button>
      </div>

      <div className="ds-tokens-controls">
        {/* Typography Category */}
        {activeCategory === "typography" && (
          <div className="ds-category-pane">
            <div className="ds-control-row">
              <label className="ds-label">
                <span>Sans-Serif Font Family</span>
              </label>
              <input
                type="text"
                className="ds-text-input"
                value={tokens.typography.fontFamilySans}
                onChange={(e) => updateTypography("fontFamilySans", e.target.value)}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Serif Font Family</span>
              </label>
              <input
                type="text"
                className="ds-text-input"
                value={tokens.typography.fontFamilySerif}
                onChange={(e) => updateTypography("fontFamilySerif", e.target.value)}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Monospace Font Family</span>
              </label>
              <input
                type="text"
                className="ds-text-input"
                value={tokens.typography.fontFamilyMono}
                onChange={(e) => updateTypography("fontFamilyMono", e.target.value)}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Base Font Size ({tokens.typography.fontSizeBase}px)</span>
              </label>
              <input
                type="range"
                min="12"
                max="24"
                step="1"
                value={tokens.typography.fontSizeBase}
                onChange={(e) => updateTypography("fontSizeBase", Number(e.target.value))}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Line Height ({tokens.typography.lineHeightNormal})</span>
              </label>
              <input
                type="range"
                min="1.1"
                max="2.0"
                step="0.05"
                value={tokens.typography.lineHeightNormal}
                onChange={(e) => updateTypography("lineHeightNormal", Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Spacing & Layout Category */}
        {activeCategory === "spacing" && (
          <div className="ds-category-pane">
            <div className="ds-control-row">
              <label className="ds-label">
                <span>Base Spacing Unit ({tokens.spacing.baseUnit}px)</span>
              </label>
              <input
                type="range"
                min="4"
                max="16"
                step="2"
                value={tokens.spacing.baseUnit}
                onChange={(e) => updateSpacing("baseUnit", Number(e.target.value))}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Corner Radius ({tokens.spacing.borderRadius}px)</span>
              </label>
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={tokens.spacing.borderRadius}
                onChange={(e) => updateSpacing("borderRadius", Number(e.target.value))}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Component Padding ({tokens.spacing.componentPadding}px)</span>
              </label>
              <input
                type="range"
                min="8"
                max="36"
                step="2"
                value={tokens.spacing.componentPadding}
                onChange={(e) => updateSpacing("componentPadding", Number(e.target.value))}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Layout Gap ({tokens.spacing.gap}px)</span>
              </label>
              <input
                type="range"
                min="4"
                max="32"
                step="2"
                value={tokens.spacing.gap}
                onChange={(e) => updateSpacing("gap", Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Interaction & Surfaces Category */}
        {activeCategory === "surfaces" && (
          <div className="ds-category-pane">
            <div className="ds-control-row">
              <label className="ds-label">
                <span>Hover Scale Multiplier ({tokens.interaction.hoverScale}x)</span>
              </label>
              <input
                type="range"
                min="1.0"
                max="1.15"
                step="0.01"
                value={tokens.interaction.hoverScale}
                onChange={(e) => updateInteraction("hoverScale", Number(e.target.value))}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Press Scale Multiplier ({tokens.interaction.pressScale}x)</span>
              </label>
              <input
                type="range"
                min="0.90"
                max="1.0"
                step="0.01"
                value={tokens.interaction.pressScale}
                onChange={(e) => updateInteraction("pressScale", Number(e.target.value))}
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Elevation Distance ({tokens.interaction.elevationDistance}px)</span>
              </label>
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={tokens.interaction.elevationDistance}
                onChange={(e) =>
                  updateInteraction("elevationDistance", Number(e.target.value))
                }
              />
            </div>

            <div className="ds-control-row">
              <label className="ds-label">
                <span>Transition Duration ({tokens.interaction.transitionDuration}ms)</span>
              </label>
              <input
                type="range"
                min="50"
                max="600"
                step="25"
                value={tokens.interaction.transitionDuration}
                onChange={(e) =>
                  updateInteraction("transitionDuration", Number(e.target.value))
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
