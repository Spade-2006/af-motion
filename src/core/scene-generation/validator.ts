/**
 * AF Motion AI Scene Validation Pipeline (Prompt 143)
 *
 * Validates complete scenes, object relationships, multi-system compatibility,
 * accessibility constraints, and runs Prompt 141's quality evaluation & recommendations.
 */

import type { StructuredSceneSpecification } from "./types.js";
import type { MotionComposition } from "../composition.js";
import type {
  QualityFinding,
  IntelligentMotionRecommendation,
  MotionQualityEvaluationResult,
  MotionAnalysisInput,
} from "../ai-motion-intelligence/types.js";
import { evaluateMotionQuality } from "../ai-motion-intelligence/quality-evaluator.js";
import { generateMotionRecommendations } from "../ai-motion-intelligence/recommendation-engine.js";

export interface SceneValidationResult {
  readonly isValid: boolean;
  readonly qualityScore: number;
  readonly qualityGrade: string;
  readonly detailedScore: MotionQualityEvaluationResult;
  readonly findings: readonly QualityFinding[];
  readonly recommendations: readonly IntelligentMotionRecommendation[];
}

export function validateGeneratedScene(
  spec: StructuredSceneSpecification,
  composition: MotionComposition
): SceneValidationResult {
  const customFindings: QualityFinding[] = [];

  // 1. Scene Structure Checks
  if (!spec.id || typeof spec.id !== "string") {
    customFindings.push({
      id: "err-scene-missing-id",
      category: "composition",
      severity: "critical",
      message: "Scene specification missing required unique id.",
      explanation: "Scenes require a unique ID for identification and caching.",
      evidence: "spec.id is invalid or empty",
    });
  }

  if (spec.objects.length === 0) {
    customFindings.push({
      id: "warn-empty-scene",
      category: "composition",
      severity: "warning",
      message: "Scene contains zero registered objects.",
      explanation: "An empty scene cannot display animations or interactions.",
      evidence: "spec.objects.length === 0",
    });
  }

  // 2. Object Reference & Parent Hierarchy Checks
  const objectIds = new Set(spec.objects.map((o) => o.id));
  for (const obj of spec.objects) {
    if (obj.parentId && !objectIds.has(obj.parentId)) {
      customFindings.push({
        id: `err-broken-parent-${obj.id}`,
        category: "composition",
        severity: "critical",
        message: `Object '${obj.id}' references non-existent parent '${obj.parentId}'.`,
        explanation: "Parent-child hierarchy links must reference existing objects in the same scene.",
        evidence: `Object '${obj.id}' has unresolvable parentId '${obj.parentId}'`,
      });
    }

    // 3. GPU Simulation & Particle Count Performance Checks
    if (obj.particles && obj.particles.count > 1000) {
      customFindings.push({
        id: `warn-high-particle-count-${obj.id}`,
        category: "performance",
        severity: "warning",
        message: `Object '${obj.id}' requests ${obj.particles.count} particles, which may degrade low-end mobile performance.`,
        explanation: "Excessive particle counts increase GPU rasterization and fill-rate pressure.",
        evidence: `Particle count: ${obj.particles.count}`,
      });
    }
  }

  // 4. Accessibility Checks
  if (!spec.reducedMotion && spec.objects.some((o) => o.animation?.ambient?.speed && o.animation.ambient.speed > 2.0)) {
    customFindings.push({
      id: "warn-rapid-ambient-motion",
      category: "accessibility",
      severity: "warning",
      message: "Rapid continuous ambient motion detected; ensure vestibular trigger safety.",
      explanation: "High-speed continuous ambient animations can cause vestibular discomfort for sensitive users.",
      evidence: "Ambient speed exceeds 2.0 without reduced-motion dampening",
    });
  }

  // 5. Run Prompt 141 Multi-Dimensional Quality Evaluator
  const analysisInput: MotionAnalysisInput = {
    id: composition.id,
    name: composition.name,
    composition,
    reducedMotion: spec.reducedMotion,
  };

  const qualityScore = evaluateMotionQuality(analysisInput);
  const allFindings = [...customFindings, ...qualityScore.findings];

  // 6. Run Prompt 141 Recommendation Engine
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
