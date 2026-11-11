import React, { useState } from "react";
import {
  evaluateStyleCompatibility,
  getVisualStyleById,
  queryStyleIntelligence,
} from "../../engine/style-explorer-engine.js";

interface StyleIntelligencePanelProps {
  styleId: string;
  onSelectStyle: (id: string) => void;
}

export const StyleIntelligencePanel: React.FC<StyleIntelligencePanelProps> = ({
  styleId,
  onSelectStyle,
}) => {
  const [prompt, setPrompt] = useState("high tech cyberpunk dark futuristic dashboard");
  const [intelligenceResult, setIntelligenceResult] = useState(() =>
    queryStyleIntelligence(prompt)
  );

  const activeStyle = getVisualStyleById(styleId);
  const compatibility = evaluateStyleCompatibility(styleId);

  const onRunQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const res = queryStyleIntelligence(prompt);
    setIntelligenceResult(res);
  };

  return (
    <div className="style-intelligence-container">
      {/* Search Header */}
      <div className="intelligence-search-card">
        <h3 className="card-heading">Design Intelligence Recommendation Engine</h3>
        <p className="card-subheading">
          Enter natural-language visual requirements to discover recommended styles and compatible Motion DNA.
        </p>

        <form onSubmit={onRunQuery} className="intelligence-query-form">
          <input
            type="text"
            className="query-input"
            placeholder="e.g. elegant luxury editorial showcase, playful cartoon music app..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="btn-query-submit">
            Recommend Styles
          </button>
        </form>
      </div>

      {/* Recommended Styles Output */}
      <div className="intelligence-recommendations-section">
        <h4 className="section-label">Recommended Visual Styles for Query</h4>
        <p className="rationale-text">{intelligenceResult.rationale}</p>

        <div className="recommended-styles-row">
          {intelligenceResult.recommendedStyleIds.map((id) => {
            const def = getVisualStyleById(id);
            const isCurrent = id === styleId;
            return (
              <div key={id} className={`recommended-style-pill-card ${isCurrent ? "current" : ""}`}>
                <div className="pill-card-top">
                  <span className="pill-name">{def.name}</span>
                  <span className="pill-badge">{def.category}</span>
                </div>
                <p className="pill-desc">{def.description}</p>
                <button
                  type="button"
                  className="btn-select-pill"
                  onClick={() => onSelectStyle(id)}
                >
                  {isCurrent ? "Active in Studio" : "Load in Studio"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compatibility & Motion DNA Analysis for Active Style */}
      <div className="intelligence-analysis-grid">
        {/* Active Style Compatibility */}
        <div className="analysis-card">
          <div className="card-header-bar">
            <h4>Style Compatibility: {activeStyle.name}</h4>
            <span className={`compat-score-pill ${compatibility.compatible ? "good" : "warn"}`}>
              Score: {Math.round(compatibility.score * 100)}%
            </span>
          </div>

          <div className="analysis-metrics">
            <div className="metric-row">
              <span className="metric-label">Motion Spring Preset:</span>
              <span className="metric-val">{compatibility.motionConfig.preset}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Transition Curve:</span>
              <span className="metric-val text-truncate">{compatibility.motionConfig.transition}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Spring Stiffness:</span>
              <span className="metric-val">{compatibility.motionConfig.spring.stiffness}</span>
            </div>
          </div>

          {compatibility.conflicts.length > 0 && (
            <div className="conflicts-box">
              <span className="conflicts-title">Detected Design Constraints:</span>
              <ul>
                {compatibility.conflicts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Compatible Motion DNA Profiles */}
        <div className="analysis-card">
          <h4>Compatible Motion DNA</h4>
          <p className="card-subheading">
            Motion DNA profiles aligned with {activeStyle.name}'s emotional resonance:
          </p>
          <div className="dna-tags-list">
            {intelligenceResult.compatibleMotionDNA.map((dna) => (
              <span key={dna} className="dna-badge">
                🧬 {dna}
              </span>
            ))}
          </div>

          <h4 style={{ marginTop: "16px" }}>Compatible Design Systems</h4>
          <div className="dna-tags-list">
            {intelligenceResult.compatibleDesignSystems.map((ds) => (
              <span key={ds} className="ds-badge">
                📐 {ds}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
