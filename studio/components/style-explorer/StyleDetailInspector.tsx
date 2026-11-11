import React from "react";
import { getVisualStyleById, getStyleMotionConfig } from "../../engine/style-explorer-engine.js";

interface StyleDetailInspectorProps {
  styleId: string;
}

export const StyleDetailInspector: React.FC<StyleDetailInspectorProps> = ({
  styleId,
}) => {
  const def = getVisualStyleById(styleId);
  const motionConfig = getStyleMotionConfig(styleId);

  return (
    <div className="style-detail-inspector">
      <div className="detail-header">
        <h3 className="detail-name">{def.name}</h3>
        <span className="detail-category-badge">{def.category}</span>
      </div>

      <p className="detail-desc">{def.description}</p>

      <div className="detail-section">
        <h4 className="detail-section-title">Design Philosophy</h4>
        <p className="detail-text">{def.philosophy}</p>
      </div>

      <div className="detail-section">
        <h4 className="detail-section-title">Shape Language</h4>
        <div className="detail-grid">
          <div className="detail-prop">
            <span className="prop-label">Radius:</span>
            <span className="prop-val">{def.shapeLanguage.cornerRadius}</span>
          </div>
          <div className="detail-prop">
            <span className="prop-label">Border:</span>
            <span className="prop-val">{def.shapeLanguage.borderWidth} {def.shapeLanguage.borderStyle}</span>
          </div>
          <div className="detail-prop">
            <span className="prop-label">Tendency:</span>
            <span className="prop-val">{def.shapeLanguage.geometricTendency}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4 className="detail-section-title">Typography</h4>
        <div className="detail-grid">
          <div className="detail-prop">
            <span className="prop-label">Heading:</span>
            <span className="prop-val text-truncate">{def.typography.headingFont.split(",")[0]}</span>
          </div>
          <div className="detail-prop">
            <span className="prop-label">Body:</span>
            <span className="prop-val text-truncate">{def.typography.bodyFont.split(",")[0]}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4 className="detail-section-title">Motion Personality</h4>
        <div className="detail-grid">
          <div className="detail-prop">
            <span className="prop-label">Spring Preset:</span>
            <span className="prop-val">{motionConfig.preset}</span>
          </div>
          <div className="detail-prop">
            <span className="prop-label">Stiffness:</span>
            <span className="prop-val">{motionConfig.spring.stiffness}</span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4 className="detail-section-title">Recommended Built-in Palettes</h4>
        <div className="palette-tag-list">
          {def.recommendedPalettes.map((p) => (
            <span key={p} className="palette-tag">
              🎨 {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
