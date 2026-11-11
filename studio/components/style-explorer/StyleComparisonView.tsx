import React, { useState } from "react";
import type {
  StyleCustomizationValues,
  StylePreviewComponentKind,
} from "../../types/style-explorer.js";
import {
  compareVisualStyles,
  listAllVisualStyles,
  getVisualStyleById,
} from "../../engine/style-explorer-engine.js";

interface StyleComparisonViewProps {
  primaryStyleId: string;
  customization?: StyleCustomizationValues;
}

export const StyleComparisonView: React.FC<StyleComparisonViewProps> = ({
  primaryStyleId,
  customization,
}) => {
  const allStyles = listAllVisualStyles();
  const defaultCompId =
    allStyles.find((s) => s.id !== primaryStyleId)?.id ?? allStyles[1].id;

  const [comparisonId, setComparisonId] = useState(defaultCompId);
  const [componentKind, setComponentKind] = useState<StylePreviewComponentKind>("card");

  const comparisonData = compareVisualStyles(primaryStyleId, comparisonId, customization);
  const { primaryStyle, comparisonStyle, primaryComputed, comparisonComputed } =
    comparisonData;

  const pStyle = primaryComputed[componentKind];
  const cStyle = comparisonComputed[componentKind];

  return (
    <div className="style-comparison-container">
      {/* Selector Header */}
      <div className="comparison-header-row">
        <div className="comparison-slot">
          <span className="slot-label">Primary Style:</span>
          <span className="slot-title">{primaryStyle.name}</span>
        </div>

        <div className="comparison-versus">VS</div>

        <div className="comparison-slot">
          <span className="slot-label">Compare Against:</span>
          <select
            className="comparison-style-select"
            value={comparisonId}
            onChange={(e) => setComparisonId(e.target.value)}
          >
            {allStyles
              .filter((s) => s.id !== primaryStyleId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Component Switcher */}
      <div className="comparison-component-tabs">
        {(["card", "button", "input"] as StylePreviewComponentKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`comparison-comp-btn ${componentKind === k ? "active" : ""}`}
            onClick={() => setComponentKind(k)}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Side-by-side Visual Preview */}
      <div className="comparison-stage-grid">
        {/* Left Side */}
        <div className="comparison-stage-cell">
          <div className="cell-header">
            <span className="cell-style-badge">{primaryStyle.name}</span>
            <span className="cell-category-tag">{primaryStyle.category}</span>
          </div>
          <div className="cell-preview-wrap">
            {componentKind === "button" ? (
              <button
                type="button"
                style={{
                  background: pStyle.background,
                  color: pStyle.color,
                  border: pStyle.border,
                  borderRadius: pStyle.borderRadius,
                  boxShadow: pStyle.boxShadow,
                  padding: pStyle.padding,
                  fontFamily: pStyle.fontFamily,
                  cursor: "pointer",
                }}
              >
                {primaryStyle.name} Action
              </button>
            ) : componentKind === "input" ? (
              <input
                type="text"
                readOnly
                value={`${primaryStyle.name} Input`}
                style={{
                  background: pStyle.background,
                  color: pStyle.color,
                  border: pStyle.border,
                  borderRadius: pStyle.borderRadius,
                  boxShadow: pStyle.boxShadow,
                  padding: pStyle.padding,
                  fontFamily: pStyle.fontFamily,
                  width: "240px",
                }}
              />
            ) : (
              <div
                style={{
                  background: pStyle.background,
                  color: pStyle.color,
                  border: pStyle.border,
                  borderRadius: pStyle.borderRadius,
                  boxShadow: pStyle.boxShadow,
                  padding: "20px",
                  width: "280px",
                  fontFamily: pStyle.fontFamily,
                }}
              >
                <h4 style={{ margin: "0 0 8px 0" }}>{primaryStyle.name}</h4>
                <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", opacity: 0.85 }}>
                  {primaryStyle.philosophy}
                </p>
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  Radius: {pStyle.borderRadius}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="comparison-stage-cell">
          <div className="cell-header">
            <span className="cell-style-badge">{comparisonStyle.name}</span>
            <span className="cell-category-tag">{comparisonStyle.category}</span>
          </div>
          <div className="cell-preview-wrap">
            {componentKind === "button" ? (
              <button
                type="button"
                style={{
                  background: cStyle.background,
                  color: cStyle.color,
                  border: cStyle.border,
                  borderRadius: cStyle.borderRadius,
                  boxShadow: cStyle.boxShadow,
                  padding: cStyle.padding,
                  fontFamily: cStyle.fontFamily,
                  cursor: "pointer",
                }}
              >
                {comparisonStyle.name} Action
              </button>
            ) : componentKind === "input" ? (
              <input
                type="text"
                readOnly
                value={`${comparisonStyle.name} Input`}
                style={{
                  background: cStyle.background,
                  color: cStyle.color,
                  border: cStyle.border,
                  borderRadius: cStyle.borderRadius,
                  boxShadow: cStyle.boxShadow,
                  padding: cStyle.padding,
                  fontFamily: cStyle.fontFamily,
                  width: "240px",
                }}
              />
            ) : (
              <div
                style={{
                  background: cStyle.background,
                  color: cStyle.color,
                  border: cStyle.border,
                  borderRadius: cStyle.borderRadius,
                  boxShadow: cStyle.boxShadow,
                  padding: "20px",
                  width: "280px",
                  fontFamily: cStyle.fontFamily,
                }}
              >
                <h4 style={{ margin: "0 0 8px 0" }}>{comparisonStyle.name}</h4>
                <p style={{ margin: "0 0 12px 0", fontSize: "0.85rem", opacity: 0.85 }}>
                  {comparisonStyle.philosophy}
                </p>
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  Radius: {cStyle.borderRadius}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structured Comparison Breakdown Table */}
      <div className="comparison-breakdown-card">
        <h4 className="breakdown-title">Aesthetic & Specification Comparison</h4>
        <table className="comparison-specs-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>{primaryStyle.name}</th>
              <th>{comparisonStyle.name}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Category</td>
              <td>{primaryStyle.category}</td>
              <td>{comparisonStyle.category}</td>
            </tr>
            <tr>
              <td>Corner Radius</td>
              <td>{primaryStyle.shapeLanguage.cornerRadius}</td>
              <td>{comparisonStyle.shapeLanguage.cornerRadius}</td>
            </tr>
            <tr>
              <td>Border Treatment</td>
              <td>{primaryStyle.shapeLanguage.borderWidth} {primaryStyle.shapeLanguage.borderStyle}</td>
              <td>{comparisonStyle.shapeLanguage.borderWidth} {comparisonStyle.shapeLanguage.borderStyle}</td>
            </tr>
            <tr>
              <td>Heading Font</td>
              <td>{primaryStyle.typography.headingFont}</td>
              <td>{comparisonStyle.typography.headingFont}</td>
            </tr>
            <tr>
              <td>Recommended Palettes</td>
              <td>{primaryStyle.recommendedPalettes.slice(0, 2).join(", ")}</td>
              <td>{comparisonStyle.recommendedPalettes.slice(0, 2).join(", ")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
