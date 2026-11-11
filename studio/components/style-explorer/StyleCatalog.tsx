import React from "react";
import type { VisualStyleDefinition } from "../../../src/catalogue.js";

interface StyleCatalogProps {
  styles: readonly VisualStyleDefinition[];
  selectedStyleId: string;
  onSelectStyle: (styleId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
}

export const StyleCatalog: React.FC<StyleCatalogProps> = ({
  styles,
  selectedStyleId,
  onSelectStyle,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="style-catalog-panel">
      {/* Search Input */}
      <div className="catalog-search-wrap">
        <input
          type="text"
          className="catalog-search-input"
          placeholder="Search 19 styles (e.g. brutalism, neumorphism)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Category Pills */}
      <div className="catalog-categories-row" role="tablist" aria-label="Style Categories">
        <button
          type="button"
          className={`category-pill ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => onCategoryChange("all")}
        >
          All (19)
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Style Cards List */}
      <div className="catalog-styles-list" role="list">
        {styles.map((s) => {
          const isSelected = s.id === selectedStyleId;
          return (
            <button
              key={s.id}
              type="button"
              role="listitem"
              className={`style-card-item catalog-style-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectStyle(s.id)}
            >
              <div className="style-card-header">
                <span className="style-card-name">{s.name}</span>
                <span className="style-card-badge">{s.category}</span>
              </div>
              <p className="style-card-philosophy">{s.philosophy}</p>
              <div className="style-card-tags">
                {s.recommendedPalettes.slice(0, 2).map((p) => (
                  <span key={p} className="palette-mini-tag">
                    {p}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        {styles.length === 0 && (
          <div className="catalog-empty-state">
            <p>No visual styles match your query.</p>
          </div>
        )}
      </div>
    </div>
  );
};
