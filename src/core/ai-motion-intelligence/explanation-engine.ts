/**
 * AF Motion AI Motion Intelligence Explanation Engine
 *
 * Produces structured, evidence-based natural language and technical
 * rationales explaining intent classifications, quality findings, and trade-offs.
 */

import type {
  IntelligenceExplanation,
  IntentClassificationResult,
  IntelligentMotionRecommendation,
  MotionQualityEvaluationResult,
} from "./types.js";

export function generateIntelligenceExplanation(
  intents: IntentClassificationResult,
  quality: MotionQualityEvaluationResult,
  recommendations: readonly IntelligentMotionRecommendation[]
): IntelligenceExplanation {
  // 1. Intent Rationale
  const intentRationale = intents.signals.map(
    (s) => `[Signal: ${s.sourceField}] ${s.signal} (+${s.weight.toFixed(1)} confidence)`
  );

  // 2. Quality Rationale
  const qualityRationale = quality.findings.map(
    (f) => `[${f.severity.toUpperCase()} in ${f.category}] ${f.message} Evidence: ${f.evidence}`
  );

  // 3. Recommendation Trade-offs
  const recommendationTradeOffs = recommendations.map(
    (r) => `[Recommendation: ${r.title}] Changing "${r.propertyRef}" to ${JSON.stringify(r.suggestedValue)} provides: ${r.expectedBenefit}`
  );

  // 4. Key Signals
  const keySignals = [
    `Primary Intent: ${intents.primaryIntent} (${(intents.confidence * 100).toFixed(0)}% confidence)`,
    `Overall Motion Quality: Grade ${quality.grade} (${quality.scores.overall}/100)`,
    `Critical Issues: ${quality.findings.filter((f) => f.severity === "critical").length}`,
    `Actionable Recommendations: ${recommendations.length}`,
  ];

  const summary = `Motion identified as "${intents.primaryIntent}" with overall quality score ${quality.scores.overall}/100 (Grade ${quality.grade}). Found ${quality.findings.length} findings and generated ${recommendations.length} actionable improvements.`;

  return {
    summary,
    intentRationale,
    qualityRationale,
    recommendationTradeOffs,
    keySignals,
  };
}
