import React from "react";
import type { SystemCompatibilityReport } from "../../types/design-systems.js";

interface DesignSystemCompatibilityPanelProps {
  report: SystemCompatibilityReport;
  systemName: string;
  onSelectDNA?: (dnaName: string) => void;
}

export const DesignSystemCompatibilityPanel: React.FC<DesignSystemCompatibilityPanelProps> = ({
  report,
  systemName,
  onSelectDNA,
}) => {
  const scoreColor =
    report.score >= 80 ? "#10b981" : report.score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="ds-compatibility-panel">
      <div className="ds-section-header">
        <h3 className="ds-section-title">🧠 Design Intelligence & Compatibility</h3>
        <span
          className="ds-compat-badge"
          style={{ background: `${scoreColor}22`, color: scoreColor, borderColor: scoreColor }}
        >
          {report.score}% Compatibility
        </span>
      </div>

      <p className="ds-section-subtitle">
        Automated architectural validation checking token harmonisation, motion damping, and style consistency.
      </p>

      {/* Score Meter */}
      <div className="ds-score-card">
        <div className="ds-score-meter-wrap">
          <div className="ds-score-meter-bar">
            <div
              className="ds-score-meter-fill"
              style={{ width: `${report.score}%`, background: scoreColor }}
            />
          </div>
          <span className="ds-score-label" style={{ color: scoreColor }}>
            {report.score >= 80 ? "Harmonious" : report.score >= 60 ? "Moderate Friction" : "Incompatible"}
          </span>
        </div>

        <p className="ds-score-rationale">{report.rationale}</p>
      </div>

      {/* Diagnostics & Conflicts */}
      {report.conflicts.length > 0 && (
        <div className="ds-conflicts-section">
          <h4 className="ds-group-title">⚠️ Detected Friction & Inconsistencies</h4>
          <ul className="ds-conflicts-list">
            {report.conflicts.map((c, i) => (
              <li key={i} className="ds-conflict-item">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="ds-recommendations-section">
          <h4 className="ds-group-title">💡 Actionable Intelligence Suggestions</h4>
          <ul className="ds-recommendations-list">
            {report.recommendations.map((r, i) => (
              <li key={i} className="ds-recommendation-item">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Compatible DNA Profiles */}
      <div className="ds-compatible-dna-section">
        <h4 className="ds-group-title">🧬 Aligned Motion DNA Profiles</h4>
        <div className="ds-tags-row">
          {report.compatibleDNA.map((dna) => (
            <button
              key={dna}
              type="button"
              className="ds-compatible-dna-pill"
              onClick={() => onSelectDNA?.(dna)}
              title={`Switch to ${dna} Motion DNA`}
            >
              ⚡ {dna}
            </button>
          ))}
        </div>
      </div>

      {/* Compatible Visual Styles */}
      <div className="ds-compatible-styles-section">
        <h4 className="ds-group-title">🎨 Compatible Visual Styles</h4>
        <div className="ds-tags-row">
          {report.compatibleStyles.map((styleId) => (
            <span key={styleId} className="ds-style-tag">
              🎭 {styleId}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
