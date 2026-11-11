import React from "react";
import type { ChoreographyIntelligenceReport } from "../../types/choreography.js";

interface ChoreographyIntelligencePanelProps {
  report: ChoreographyIntelligenceReport;
}

export const ChoreographyIntelligencePanel: React.FC<ChoreographyIntelligencePanelProps> = ({
  report,
}) => {
  const scoreColor =
    report.score >= 80 ? "#10b981" : report.score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="ch-intelligence-panel">
      <div className="ch-section-header">
        <h3 className="ch-section-title">🧠 Choreography Intelligence</h3>
        <span
          className="ch-score-badge"
          style={{ background: `${scoreColor}22`, color: scoreColor, borderColor: scoreColor }}
        >
          {report.score}% Quality Score
        </span>
      </div>

      <p className="ch-section-subtitle">
        Automated architectural analysis validating track staggering, multi-system performance, and accessibility.
      </p>

      {/* Quality Score Meter */}
      <div className="ch-score-card">
        <div className="ch-score-meter-wrap">
          <div className="ch-score-meter-bar">
            <div
              className="ch-score-meter-fill"
              style={{ width: `${report.score}%`, background: scoreColor }}
            />
          </div>
          <span className="ch-score-label" style={{ color: scoreColor }}>
            {report.score >= 80 ? "Harmonious" : report.score >= 60 ? "Timing Friction" : "Degraded"}
          </span>
        </div>
        <p className="ch-score-rationale">{report.rationale}</p>
      </div>

      {/* Suggested Execution Order */}
      <div className="ch-intel-section">
        <h4 className="ch-intel-title">📋 Recommended Execution Order</h4>
        <ol className="ch-order-list">
          {report.recommendedOrder.map((step, i) => (
            <li key={i} className="ch-order-item">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Timing Recommendations */}
      {report.timingRecommendations.length > 0 && (
        <div className="ch-intel-section">
          <h4 className="ch-intel-title">⏱️ Timing & Staggering Advice</h4>
          <ul className="ch-advice-list">
            {report.timingRecommendations.map((advice, i) => (
              <li key={i} className="ch-advice-item">
                {advice}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflicts & Diagnostics */}
      {report.conflicts.length > 0 && (
        <div className="ch-intel-section">
          <h4 className="ch-intel-title">⚠️ Conflicts & Overlaps</h4>
          <ul className="ch-conflict-list">
            {report.conflicts.map((conflict, i) => (
              <li key={i} className="ch-conflict-item">
                {conflict}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performance Warnings */}
      {report.performanceWarnings.length > 0 && (
        <div className="ch-intel-section">
          <h4 className="ch-intel-title">⚡ Performance & GPU Guardrails</h4>
          <ul className="ch-perf-list">
            {report.performanceWarnings.map((warning, i) => (
              <li key={i} className="ch-perf-item">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accessibility Notes */}
      <div className="ch-intel-section">
        <h4 className="ch-intel-title">♿ Accessibility & Reduced-Motion</h4>
        <ul className="ch-a11y-list">
          {report.accessibilityNotes.map((note, i) => (
            <li key={i} className="ch-a11y-item">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
