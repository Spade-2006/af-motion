import React, { useState, useEffect, useCallback } from "react";
import type { UnifiedCompositionState } from "../../types/unified-playground.js";
import {
  aiMotionIntelligence,
  type MotionAnalysisResult,
  type IntelligentMotionRecommendation,
} from "../../../src/catalogue.js";

interface AIMotionIntelligencePanelProps {
  state: UnifiedCompositionState;
  onChange: (updater: (prev: UnifiedCompositionState) => UnifiedCompositionState) => void;
}

export const AIMotionIntelligencePanel: React.FC<AIMotionIntelligencePanelProps> = ({
  state,
  onChange,
}) => {
  const [analysisResult, setAnalysisResult] = useState<MotionAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const result = await aiMotionIntelligence.analyzeMotion({
        id: state.id,
        name: state.name,
        configuration: {
          duration: state.playback.durationMs,
          timingMultiplier: state.designBridge.timingMultiplier,
          reducedMotion: state.designBridge.reducedMotion,
          systems: state.systems,
          layers: state.layers,
          crossCoupling: state.crossCoupling,
        },
        contextHint: "studio-composition",
        reducedMotion: state.designBridge.reducedMotion,
      }, { skipCache: true });

      setAnalysisResult(result);
    } catch {
      // Offline fallback
    } finally {
      setAnalyzing(false);
    }
  }, [state]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleAcceptRecommendation = (rec: IntelligentMotionRecommendation) => {
    if (!rec.patch) return;

    // Apply patch directly to composition state
    onChange((prev) => {
      let nextState = { ...prev };
      if (rec.patch?.duration) {
        nextState = {
          ...nextState,
          playback: { ...nextState.playback, durationMs: rec.patch.duration as number },
        };
      }
      if (rec.patch?.respectReducedMotion !== undefined) {
        nextState = {
          ...nextState,
          designBridge: {
            ...nextState.designBridge,
            reducedMotion: rec.patch.respectReducedMotion as boolean,
          },
        };
      }
      return nextState;
    });

    if (analysisResult) {
      setAnalysisResult(aiMotionIntelligence.acceptRecommendation(analysisResult, rec.id));
    }
  };

  const handleRejectRecommendation = (recId: string) => {
    if (analysisResult) {
      setAnalysisResult(aiMotionIntelligence.rejectRecommendation(analysisResult, recId));
    }
  };

  if (!analysisResult) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8" }}>
        <span>Analyzing composition with deterministic AI Motion Intelligence...</span>
      </div>
    );
  }

  const { intents, quality, recommendations, matchedPatterns, explanations, telemetry } = analysisResult;

  return (
    <div className="ai-motion-intelligence-panel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* 1. Header & Reanalyze Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#F8FAFC", fontWeight: 700 }}>
            🧠 AI Motion Intelligence
          </h4>
          <span style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
            Deterministic rule-based analysis • {telemetry.analysisDurationMs}ms
          </span>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={analyzing}
          style={{
            padding: "4px 10px",
            borderRadius: "5px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            background: "rgba(255, 255, 255, 0.04)",
            color: "#38BDF8",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {analyzing ? "Analyzing..." : "🔄 Reanalyze"}
        </button>
      </div>

      {/* 2. Motion Intent Classification */}
      <section className="unified-panel-section">
        <h5 style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Motion Intent Classification
        </h5>
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "4px",
                background: "#38BDF8",
                color: "#0F172A",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {intents.primaryIntent}
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#F8FAFC" }}>
              {(intents.confidence * 100).toFixed(0)}% Confidence
            </span>
          </div>

          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#CBD5E1", lineHeight: 1.4 }}>
            {intents.explanation}
          </p>

          {intents.secondaryIntents.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B", alignSelf: "center" }}>Secondary:</span>
              {intents.secondaryIntents.map((sec) => (
                <span
                  key={sec.intent}
                  style={{
                    fontSize: "0.68rem",
                    padding: "1px 6px",
                    borderRadius: "3px",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#94A3B8",
                  }}
                >
                  {sec.intent} ({(sec.confidence * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Multi-Dimensional Quality Evaluation */}
      <section className="unified-panel-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h5 style={{ margin: 0, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
            Motion Quality Evaluation
          </h5>
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              background: quality.scores.overall >= 80 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
              color: quality.scores.overall >= 80 ? "#10B981" : "#F59E0B",
            }}
          >
            Grade {quality.grade} ({quality.scores.overall}/100)
          </span>
        </div>

        {/* Quality Dimensions Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {Object.entries(quality.scores)
            .filter(([k]) => k !== "overall")
            .map(([dimension, score]) => (
              <div
                key={dimension}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.02)",
                  fontSize: "0.75rem",
                }}
              >
                <span style={{ color: "#94A3B8", textTransform: "capitalize" }}>{dimension}:</span>
                <strong style={{ color: score >= 80 ? "#10B981" : score >= 65 ? "#F59E0B" : "#EF4444" }}>
                  {score}%
                </strong>
              </div>
            ))}
        </div>
      </section>

      {/* 4. Actionable Recommendations */}
      <section className="unified-panel-section">
        <h5 style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
          Actionable Recommendations ({recommendations.filter((r) => r.status === "pending").length})
        </h5>
        {recommendations.length === 0 ? (
          <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.08)", color: "#10B981", fontSize: "0.78rem" }}>
            ✓ No critical motion quality or accessibility issues detected!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recommendations.map((rec) => {
              const isPending = rec.status === "pending";
              const isAccepted = rec.status === "accepted";
              return (
                <div
                  key={rec.id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: isAccepted ? "rgba(16, 185, 129, 0.06)" : "rgba(255, 255, 255, 0.03)",
                    border: isAccepted ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                    opacity: rec.status === "rejected" ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.82rem", color: isAccepted ? "#10B981" : "#F8FAFC" }}>
                      {rec.title}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "1px 5px",
                        borderRadius: "3px",
                        background: rec.severity === "critical" ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.2)",
                        color: rec.severity === "critical" ? "#EF4444" : "#F59E0B",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {rec.severity}
                    </span>
                  </div>

                  <p style={{ margin: "4px 0", fontSize: "0.75rem", color: "#94A3B8", lineHeight: 1.35 }}>
                    {rec.explanation}
                  </p>

                  <div style={{ fontSize: "0.7rem", color: "#38BDF8", marginBottom: "6px" }}>
                    ✨ Benefit: {rec.expectedBenefit}
                  </div>

                  {isPending && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleAcceptRecommendation(rec)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: "none",
                          background: "#10B981",
                          color: "#0F172A",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          cursor: "pointer",
                        }}
                      >
                        ✓ Accept & Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRecommendation(rec.id)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          background: "transparent",
                          color: "#94A3B8",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {isAccepted && (
                    <span style={{ fontSize: "0.7rem", color: "#10B981", fontWeight: 600 }}>
                      ✓ Applied to composition
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Matched Motion Patterns */}
      {matchedPatterns.length > 0 && (
        <section className="unified-panel-section">
          <h5 style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8" }}>
            Matched Knowledge Base Patterns
          </h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {matchedPatterns.slice(0, 3).map((pat) => (
              <div
                key={pat.id}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  fontSize: "0.75rem",
                }}
              >
                <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{pat.name}</div>
                <div style={{ color: "#64748B", fontSize: "0.7rem", marginTop: "2px" }}>
                  {pat.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
