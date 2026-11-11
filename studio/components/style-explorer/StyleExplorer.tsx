import React, { useState, useMemo } from "react";
import type {
  StyleExplorerViewMode,
  StylePreviewComponentKind,
  StyleCustomizationValues,
} from "../../types/index.js";
import {
  listAllVisualStyles,
  filterVisualStyles,
  getVisualStyleById,
  listStyleCategories,
  DEFAULT_STYLE_CUSTOMIZATION,
} from "../../engine/style-explorer-engine.js";
import { StyleCatalog } from "./StyleCatalog.js";
import { StyleCustomizer } from "./StyleCustomizer.js";
import { StyleComponentPreview } from "./StyleComponentPreview.js";
import { StyleComparisonView } from "./StyleComparisonView.js";
import { StyleIntelligencePanel } from "./StyleIntelligencePanel.js";
import { StyleDetailInspector } from "./StyleDetailInspector.js";
import { StyleCodeExport } from "./StyleCodeExport.js";

export const StyleExplorer: React.FC = () => {
  const allStyles = useMemo(() => listAllVisualStyles(), []);
  const categories = useMemo(() => ["all", ...listStyleCategories()], []);

  // View mode
  const [viewMode, setViewMode] = useState<StyleExplorerViewMode>("explore");

  // Selection
  const [selectedStyleId, setSelectedStyleId] = useState<string>("skeuomorphism");

  // Filtering
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Preview options
  const [componentKind, setComponentKind] = useState<StylePreviewComponentKind>("card");
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Customization
  const [customization, setCustomization] = useState<StyleCustomizationValues>(
    DEFAULT_STYLE_CUSTOMIZATION
  );

  // Inspector visibility
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // Filtered styles for catalog
  const filteredStyles = useMemo(
    () => filterVisualStyles(searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  const selectedStyle = useMemo(
    () => getVisualStyleById(selectedStyleId) || allStyles[0],
    [selectedStyleId, allStyles]
  );

  const handleSelectStyle = (id: string) => {
    setSelectedStyleId(id);
  };

  return (
    <div className="style-explorer-container">
      {/* Top Header & Navigation bar */}
      <header className="style-explorer-header">
        <div className="style-explorer-header-info">
          <h2 className="style-explorer-title">Visual Style Explorer</h2>
          <span className="style-explorer-count-badge">
            {allStyles.length} Visual Styles Available
          </span>
          <span className="style-explorer-current-tag">
            Active: <strong>{selectedStyle.name}</strong> ({selectedStyle.category})
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="style-explorer-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "explore"}
            className={`style-nav-tab ${viewMode === "explore" ? "active" : ""}`}
            onClick={() => setViewMode("explore")}
          >
            🎨 Explore & Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "compare"}
            className={`style-nav-tab ${viewMode === "compare" ? "active" : ""}`}
            onClick={() => setViewMode("compare")}
          >
            ⚖️ Compare (Side-by-Side)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "intelligence"}
            className={`style-nav-tab ${viewMode === "intelligence" ? "active" : ""}`}
            onClick={() => setViewMode("intelligence")}
          >
            🧠 Design Intelligence
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "export"}
            className={`style-nav-tab ${viewMode === "export" ? "active" : ""}`}
            onClick={() => setViewMode("export")}
          >
            💻 Export Code
          </button>
        </div>

        {/* Global Controls & Inspector Toggle */}
        <div className="style-explorer-header-actions">
          <label className="style-reduced-motion-toggle">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            <span>Reduced Motion</span>
          </label>
          <button
            type="button"
            className="style-inspector-toggle-btn"
            onClick={() => setShowInspector(!showInspector)}
            title="Toggle Style Inspector"
          >
            {showInspector ? "Hide Inspector" : "Show Inspector"}
          </button>
        </div>
      </header>

      {/* Main Multi-Pane Content Layout */}
      <div className="style-explorer-body">
        {/* Left Sidebar: Catalog + Customizer */}
        <aside className="style-explorer-sidebar">
          <div className="sidebar-section">
            <StyleCatalog
              styles={filteredStyles}
              selectedStyleId={selectedStyleId}
              onSelectStyle={handleSelectStyle}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />
          </div>

          <div className="sidebar-section">
            <StyleCustomizer
              customization={customization}
              onChange={setCustomization}
              onReset={() => setCustomization(DEFAULT_STYLE_CUSTOMIZATION)}
            />
          </div>
        </aside>

        {/* Center Workspace: Dynamic view based on viewMode */}
        <main className="style-explorer-main">
          {viewMode === "explore" && (
            <StyleComponentPreview
              styleId={selectedStyleId}
              customization={customization}
              reducedMotion={reducedMotion}
            />
          )}

          {viewMode === "compare" && (
            <StyleComparisonView
              primaryStyleId={selectedStyleId}
              customization={customization}
            />
          )}

          {viewMode === "intelligence" && (
            <StyleIntelligencePanel
              styleId={selectedStyleId}
              onSelectStyle={handleSelectStyle}
            />
          )}

          {viewMode === "export" && (
            <StyleCodeExport
              styleId={selectedStyleId}
              componentKind={componentKind}
              customization={customization}
            />
          )}
        </main>

        {/* Right Inspector: Details & Meta */}
        {showInspector && (
          <aside className="style-explorer-inspector">
            <StyleDetailInspector styleId={selectedStyleId} />
          </aside>
        )}
      </div>
    </div>
  );
};
