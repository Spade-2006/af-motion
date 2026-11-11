import React, { useState, useCallback } from "react";
import {
  evaluateMotionQuality,
  generateMotionRecommendations,
  designToMotionEngine,
} from "../../../src/catalogue.js";
import { DocsPlaygroundContainer } from "./DocsPlaygroundContainer.js";

type AIDemoTab = "quality-audit" | "design-to-motion";

export const AIDemonstrationPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AIDemoTab>("quality-audit");

  // Quality audit inputs
  const [intent, setIntent] = useState("button-click");
  const [durationMs, setDurationMs] = useState(250);
  const [easingType, setEasingType] = useState("cubic-bezier(0.16, 1, 0.3, 1)");

  // Quality audit outputs
  const [auditResult, setAuditResult] = useState<any>(() => {
    try {
      const analysisInput = {
        configuration: { duration: 250, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        contextHint: "button-click",
      };
      const report = evaluateMotionQuality(analysisInput);
      const recs = generateMotionRecommendations(analysisInput, report.findings);
      return { report, recs };
    } catch {
      return null;
    }
  });

  // Design-to-Motion state
  const [promptText, setPromptText] = useState("Create an elegant modal dialog entrance with smooth scale bounce");
  const [d2mDna, setD2mDna] = useState("elegant");
  const [isGenerating, setIsGenerating] = useState(false);
  const [d2mResult, setD2mResult] = useState<any>(null);

  const runQualityAudit = useCallback(() => {
    try {
      const analysisInput = {
        configuration: { duration: durationMs, easing: easingType },
        contextHint: intent,
      };
      const report = evaluateMotionQuality(analysisInput);
      const recs = generateMotionRecommendations(analysisInput, report.findings);
      setAuditResult({ report, recs });
    } catch (err) {
      console.error(err);
    }
  }, [durationMs, easingType, intent]);

  const runDesignToMotion = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await designToMotionEngine.generate({
        naturalLanguage: promptText,
        tokens: { motionDNA: d2mDna as any },
      });
      setD2mResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [promptText, d2mDna]);

  const generatedCode =
    activeTab === "quality-audit"
      ? `import { evaluateMotionQuality, generateMotionRecommendations } from "af-motion/catalogue";

// 1. Deterministic Motion Quality Audit
const input = {
  configuration: {
    duration: ${durationMs},
    easing: "${easingType}",
  },
  contextHint: "${intent}",
};
const report = evaluateMotionQuality(input);

console.log("Overall Score:", report.scores.overall); // e.g. 92/100
console.log("Grade:", report.grade); // "A" | "B" | "C" | "D" | "F"

// 2. Actionable Recommendations
const recs = generateMotionRecommendations(input, report.findings);`
      : `import { designToMotionEngine } from "af-motion/catalogue";

// Deterministic Design-to-Motion Generation
const result = await designToMotionEngine.generate({
  naturalLanguage: "${promptText}",
  tokens: { motionDNA: "${d2mDna}" },
});

console.log("Synthesized Elements:", result.plan.elementPlans.length);
console.log("Quality Score:", result.validation.qualityScore);`;

  return (
    <DocsPlaygroundContainer
      title="Deterministic AI Intelligence & Synthesis"
      badge="Offline Local Intelligence"
      description="Evaluate animation quality against motion design heuristics or synthesize design-to-motion plans without external APIs."
      onRun={activeTab === "quality-audit" ? runQualityAudit : runDesignToMotion}
      isRunning={isGenerating}
      code={generatedCode}
      preview={
        <div className="preview-canvas-box" style={{ minHeight: "240px", textAlign: "left", padding: "16px" }}>
          {activeTab === "quality-audit" && auditResult && (
            <div className="ai-audit-output">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h4 style={{ margin: 0, color: "#38bdf8" }}>Quality Evaluation Report</h4>
                  <small style={{ opacity: 0.8 }}>Intent: {intent}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: auditResult.report.scores.overall >= 80 ? "#4ade80" : "#facc15" }}>
                    {auditResult.report.scores.overall}/100
                  </div>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                    Grade: {auditResult.report.grade}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px", fontSize: "0.8rem" }}>
                <div>Smoothness: <strong>{auditResult.report.scores.smoothness}/100</strong></div>
                <div>Responsiveness: <strong>{auditResult.report.scores.responsiveness}/100</strong></div>
                <div>Aesthetic: <strong>{auditResult.report.scores.aesthetic}/100</strong></div>
                <div>Naturalness: <strong>{auditResult.report.scores.naturalness}/100</strong></div>
              </div>

              <h5 style={{ margin: "8px 0 4px 0", fontSize: "0.85rem" }}>Actionable Recommendations:</h5>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.8rem", opacity: 0.9 }}>
                {auditResult.recs.length > 0 ? (
                  auditResult.recs.slice(0, 3).map((r: any, idx: number) => (
                    <li key={idx} style={{ marginBottom: "3px" }}>
                      <strong>{r.title || r.category}:</strong> {r.summary || String(r)}
                    </li>
                  ))
                ) : (
                  <li>Configuration adheres to ideal motion heuristics.</li>
                )}
              </ul>
            </div>
          )}

          {activeTab === "design-to-motion" && (
            <div className="d2m-output">
              <h4 style={{ margin: "0 0 8px 0", color: "#38bdf8" }}>Synthesized Motion Plan</h4>
              {d2mResult ? (
                <div>
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
                    Choreography: <strong>{d2mResult.plan.choreographyType}</strong> | DNA: <strong>{d2mResult.plan.motionDNA}</strong> | Score: <strong>{d2mResult.validation.qualityScore}/100</strong>
                  </p>
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem" }}>
                    <strong>Generated Elements:</strong>
                    <ul style={{ margin: "4px 0 0 0", paddingLeft: "18px" }}>
                      {d2mResult.plan.elementPlans.map((el: any) => (
                        <li key={el.elementId}>{el.elementId} (duration: {el.entrance?.durationMs || 300}ms)</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                  Click "Run" to synthesize a complete motion plan from the prompt.
                </p>
              )}
            </div>
          )}
        </div>
      }
      controls={
        <div className="controls-form">
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            <button
              type="button"
              className={`docs-sub-tab ${activeTab === "quality-audit" ? "active" : ""}`}
              onClick={() => setActiveTab("quality-audit")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--docs-border)",
                background: activeTab === "quality-audit" ? "var(--docs-accent)" : "transparent",
                color: activeTab === "quality-audit" ? "#090b0e" : "var(--docs-text)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Quality Evaluation
            </button>
            <button
              type="button"
              className={`docs-sub-tab ${activeTab === "design-to-motion" ? "active" : ""}`}
              onClick={() => setActiveTab("design-to-motion")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--docs-border)",
                background: activeTab === "design-to-motion" ? "var(--docs-accent)" : "transparent",
                color: activeTab === "design-to-motion" ? "#090b0e" : "var(--docs-text)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Design-to-Motion
            </button>
          </div>

          {activeTab === "quality-audit" ? (
            <>
              <div className="control-row">
                <label>Animation Intent</label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="docs-select-input"
                >
                  <option value="button-click">Button Microinteraction</option>
                  <option value="modal-entrance">Modal Dialog Entrance</option>
                  <option value="card-hover">Card Hover State</option>
                  <option value="page-transition">Full Page Transition</option>
                </select>
              </div>

              <div className="control-row">
                <label>Duration: {durationMs}ms</label>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={durationMs}
                  onChange={(e) => setDurationMs(Number(e.target.value))}
                />
              </div>

              <div className="control-row">
                <label>Easing Curve</label>
                <select
                  value={easingType}
                  onChange={(e) => setEasingType(e.target.value)}
                  className="docs-select-input"
                >
                  <option value="cubic-bezier(0.16, 1, 0.3, 1)">easeOutExpo (Calibrated)</option>
                  <option value="linear">linear (Suboptimal for UI)</option>
                  <option value="cubic-bezier(0.34, 1.56, 0.64, 1)">easeOutBack (Playful)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="control-row">
                <label>Natural Language Brief</label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="docs-text-input"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--docs-border)", color: "#fff" }}
                />
              </div>

              <div className="control-row">
                <label>Target Motion DNA</label>
                <select
                  value={d2mDna}
                  onChange={(e) => setD2mDna(e.target.value)}
                  className="docs-select-input"
                >
                  <option value="elegant">Elegant</option>
                  <option value="playful">Playful</option>
                  <option value="precise">Precise</option>
                  <option value="energetic">Energetic</option>
                  <option value="editorial-flow">Editorial Flow</option>
                </select>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
