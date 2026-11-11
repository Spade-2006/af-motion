/**
 * AF Motion Design-to-Motion Validation Pipeline (Prompt 142)
 *
 * Validates generated MotionComposition schemas, property compatibility,
 * timing constraints, accessibility, and integrates Prompt 141's quality evaluator
 * and recommendation engine.
 */

import type { MotionComposition } from "../composition.js";
import type {
  DesignToMotionValidation,
  DesignTokenContext,
} from "./types.js";
import { evaluateMotionQuality } from "../ai-motion-intelligence/quality-evaluator.js";
import { generateMotionRecommendations } from "../ai-motion-intelligence/recommendation-engine.js";
import type {
  QualityFinding,
  MotionAnalysisInput,
} from "../ai-motion-intelligence/types.js";

/**
 * Validates a generated MotionComposition and produces quality evaluation & recommendations.
 */
export function validateGeneratedMotion(
  composition: MotionComposition,
  tokens: Required<DesignTokenContext>
): DesignToMotionValidation {
  const customFindings: QualityFinding[] = [];

  // 1. Schema & Node Integrity Checks
  if (!composition.id || typeof composition.id !== "string") {
    customFindings.push({
      id: "err-missing-id",
      category: "composition",
      severity: "critical",
      message: "Composition missing required unique id.",
      explanation: "Compositions must have an explicit string ID for lifecycle tracking.",
      evidence: "composition.id is empty or undefined",
      propertyRef: "id",
    });
  }

  if (!composition.rootNodeId || !composition.nodes[composition.rootNodeId]) {
    customFindings.push({
      id: "err-missing-root",
      category: "composition",
      severity: "critical",
      message: `Root node '${composition.rootNodeId}' not found in composition nodes.`,
      explanation: "A composition requires a valid root node in its node dictionary.",
      evidence: `composition.nodes[${composition.rootNodeId}] is undefined`,
      propertyRef: "rootNodeId",
    });
  }

  // 2. Property Compatibility Checks
  const layoutThrashingProps = ["width", "height", "top", "left", "right", "bottom", "margin", "padding"];
  for (const [nodeId, node] of Object.entries(composition.nodes)) {
    const config = node.configuration as Record<string, unknown> | undefined;
    if (config) {
      const fromObj = config.from as Record<string, unknown> | undefined;
      const toObj = config.to as Record<string, unknown> | undefined;

      const animatedProps = new Set([
        ...Object.keys(fromObj || {}),
        ...Object.keys(toObj || {}),
      ]);

      for (const prop of animatedProps) {
        if (layoutThrashingProps.includes(prop)) {
          customFindings.push({
            id: `warn-layout-thrash-${nodeId}-${prop}`,
            category: "performance",
            severity: "warning",
            message: `Node '${nodeId}' animates layout property '${prop}', which triggers browser reflow.`,
            explanation: "Animating geometric layout properties causes expensive browser reflow and frame drops.",
            evidence: `Property reflow detected on node ${nodeId}`,
            propertyRef: prop,
          });
        }
      }
    }
  }

  // 3. Accessibility & Reduced Motion Validation
  if (!composition.accessibility.respectReducedMotion) {
    customFindings.push({
      id: "warn-reduced-motion-disabled",
      category: "accessibility",
      severity: "critical",
      message: "Composition does not enable respectReducedMotion.",
      explanation: "Accessible animations must honor user's prefers-reduced-motion OS preference.",
      evidence: "accessibility.respectReducedMotion is false",
      propertyRef: "accessibility.respectReducedMotion",
    });
  }

  // 4. Run Prompt 141 Multi-Dimensional Quality Evaluator
  const analysisInput: MotionAnalysisInput = {
    id: composition.id,
    name: composition.name,
    composition,
    reducedMotion: tokens.reducedMotion,
  };

  const qualityScore = evaluateMotionQuality(analysisInput);

  // Merge custom findings into quality findings
  const allFindings = [...customFindings, ...qualityScore.findings];

  // 5. Run Prompt 141 Recommendation Engine
  const recommendations = generateMotionRecommendations(
    analysisInput,
    allFindings
  );

  const isValid = !allFindings.some((f) => f.severity === "critical");

  return {
    isValid,
    qualityScore: qualityScore.scores.overall,
    qualityGrade: qualityScore.grade,
    detailedScore: qualityScore,
    findings: allFindings,
    recommendations,
  };
}
