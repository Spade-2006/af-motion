import React, { useState } from "react";
import type { Scene3DIntelligenceReport } from "../../types/scene-3d.js";
import { parseNaturalLanguageSceneIntent } from "../../../src/3d/composition/generation.js";

interface Scene3DIntelligencePanelProps {
  report: Scene3DIntelligenceReport;
  onApplyIntent?: (prompt: string) => void;
}

export const Scene3DIntelligencePanel: React.FC<Scene3DIntelligencePanelProps> = ({
  report,
  onApplyIntent,
}) => {
  const [prompt, setPrompt] = useState("");
  const [intentSummary, setIntentSummary] = useState<string | null>(null);

  const handleInterpretIntent = () => {
    if (!prompt.trim()) return;
    try {
      const intent = parseNaturalLanguageSceneIntent(prompt);
      setIntentSummary(
        `Interpreted Intent: Style="${intent.visualStyle ?? "auto"}", Mood="${intent.mood ?? "ambient"}", Camera="${intent.cameraStaging ?? "hero"}", Lighting="${intent.lightingPreset ?? "studio"}", Material="${intent.materialPreset ?? "physical"}"`
      );
      if (onApplyIntent) {
        onApplyIntent(prompt);
      }
    } catch {
      setIntentSummary(`Interpreted prompt: "${prompt}"`);
    }
  };

  const scoreColor =
    report.score >= 85 ? "#10b981" : report.score >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <div className="scene3d-intelligence-panel">
      <div className="scene3d-panel-header">
        <h3 className="scene3d-panel-title">🧠 3D Scene Intelligence</h3>
        <span
          className="scene3d-score-badge"
          style={{ background: `${scoreColor}22`, color: scoreColor, borderColor: scoreColor }}
        >
          {report.score}% Quality Score
        </span>
      </div>

      <p className="scene3d-panel-subtitle">
        Automated architectural telemetry, natural-language scene synthesis, lighting balance, and accessibility audit.
      </p>

      {/* Natural Language Scene Generator Input */}
      <div className="scene3d-intel-card">
        <h4 className="scene3d-card-title">💬 Natural Language Scene Synthesis</h4>
        <p className="scene3d-card-desc">
          Describe desired visual atmosphere, lighting, materials, and geometry in plain English.
        </p>

        <div className="scene3d-prompt-row">
          <input
            type="text"
            className="scene3d-prompt-input"
            value={prompt}
            placeholder="e.g. Dark cinematic product showcase with neon lights and metallic torus..."
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleInterpretIntent();
            }}
          />
          <button
            type="button"
            className="scene3d-primary-btn"
            onClick={handleInterpretIntent}
          >
            Interpret
          </button>
        </div>

        {intentSummary && (
          <div className="scene3d-intent-result">
            <span>✨ {intentSummary}</span>
          </div>
        )}
      </div>

      {/* Quality Score & Rationale */}
      <div className="scene3d-intel-card">
        <div className="scene3d-score-meter-wrap">
          <div className="scene3d-score-meter-bar">
            <div
              className="scene3d-score-meter-fill"
              style={{ width: `${report.score}%`, background: scoreColor }}
            />
          </div>
          <span className="scene3d-score-label" style={{ color: scoreColor }}>
            {report.score >= 85 ? "Production Ready" : report.score >= 65 ? "Optimization Advised" : "Structural Warning"}
          </span>
        </div>
        <p className="scene3d-score-rationale">{report.rationale}</p>
      </div>

      {/* Telemetry Breakdown */}
      <div className="scene3d-intel-card">
        <h4 className="scene3d-card-title">📊 Scene Telemetry</h4>
        <div className="scene3d-telemetry-grid">
          <div className="scene3d-telemetry-pill">
            <span className="telemetry-label">Scene Objects</span>
            <span className="telemetry-val">{report.objectCount}</span>
          </div>
          <div className="scene3d-telemetry-pill">
            <span className="telemetry-label">Polygon Estimate</span>
            <span className="telemetry-val">{report.estimatedPolyCount.toLocaleString()} polys</span>
          </div>
          <div className="scene3d-telemetry-pill">
            <span className="telemetry-label">Hierarchy Integrity</span>
            <span className="telemetry-val" style={{ color: report.hierarchyValid ? "#10b981" : "#ef4444" }}>
              {report.hierarchyValid ? "✓ Valid DAG" : "⚠ Defect Detected"}
            </span>
          </div>
        </div>
        <p className="scene3d-lighting-eval">💡 {report.lightingEvaluation}</p>
      </div>

      {/* Performance Warnings */}
      {report.performanceWarnings.length > 0 && (
        <div className="scene3d-intel-card warning-card">
          <h4 className="scene3d-card-title warning-title">⚡ Performance Warnings</h4>
          <ul className="scene3d-intel-list">
            {report.performanceWarnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="scene3d-intel-card">
          <h4 className="scene3d-card-title">💡 Composition Recommendations</h4>
          <ul className="scene3d-intel-list">
            {report.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Accessibility & Reduced Motion */}
      <div className="scene3d-intel-card">
        <h4 className="scene3d-card-title">♿ Accessibility & Reduced Motion</h4>
        <ul className="scene3d-intel-list">
          {report.accessibilityNotes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
