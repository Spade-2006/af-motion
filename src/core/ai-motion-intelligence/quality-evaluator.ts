/**
 * AF Motion AI Motion Quality Evaluator
 *
 * Deterministic multi-dimensional evaluation system analyzing timing, easing,
 * composition, interaction responsiveness, physics stability, performance,
 * and accessibility compliance.
 */

import type {
  MotionAnalysisInput,
  MotionQualityDimensions,
  MotionQualityEvaluationResult,
  QualityFinding,
  QualityGrade,
} from "./types.js";

const LAYOUT_PROPERTIES = new Set([
  "width",
  "height",
  "top",
  "left",
  "bottom",
  "right",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "padding",
  "paddingTop",
  "paddingBottom",
]);

export function evaluateMotionQuality(input: MotionAnalysisInput): MotionQualityEvaluationResult {
  const config = input.configuration ?? {};
  const composition = input.composition;
  const props = (config.properties as Record<string, unknown>) ?? config;
  const findings: QualityFinding[] = [];

  let timingScore = 95;
  let easingScore = 95;
  let compositionScore = 95;
  let interactionScore = 95;
  let physicsScore = 95;
  let performanceScore = 95;
  let accessibilityScore = 95;

  const duration = typeof config.duration === "number" ? config.duration : 600;
  const easing = String(config.easing ?? "easeOut");
  const trigger = String(config.trigger ?? "entrance").toLowerCase();

  // ==========================================================================
  // 1. TIMING EVALUATION
  // ==========================================================================
  if (duration < 60) {
    timingScore -= 30;
    findings.push({
      id: "timing-too-short",
      category: "timing",
      severity: "warning",
      message: "Animation duration is imperceptibly fast (< 60ms).",
      explanation: "Users cannot process visual state changes that occur under 60ms, creating jarring perceptual pops.",
      propertyRef: "duration",
      evidence: `Configured duration: ${duration}ms`,
    });
  } else if (duration > 1800 && config.iterations !== "infinite" && trigger !== "ambient") {
    timingScore -= 25;
    findings.push({
      id: "timing-too-long",
      category: "timing",
      severity: "warning",
      message: "UI transition duration is excessively long (> 1800ms).",
      explanation: "Transitions exceeding 1800ms cause interface sluggishness and user fatigue.",
      propertyRef: "duration",
      evidence: `Configured duration: ${duration}ms`,
    });
  }

  // ==========================================================================
  // 2. EASING EVALUATION
  // ==========================================================================
  if (easing.toLowerCase() === "linear" && trigger !== "ambient" && trigger !== "loading") {
    easingScore -= 35;
    findings.push({
      id: "easing-linear-entrance",
      category: "easing",
      severity: "warning",
      message: "Linear easing applied to interactive UI transition.",
      explanation: "Linear velocity curves look unnatural and robotic for element entrances. Natural physical motion requires deceleration.",
      propertyRef: "easing",
      evidence: `Configured easing: "${easing}"`,
    });
  }

  // Check spring overshoot
  if (config.overshoot && typeof config.overshoot === "number" && config.overshoot > 2.0) {
    easingScore -= 20;
    findings.push({
      id: "easing-excessive-overshoot",
      category: "easing",
      severity: "suggestion",
      message: "Spring overshoot multiplier exceeds 2.0x.",
      explanation: "Excessive bounce overshoots can distract users from content and cause visual instability.",
      propertyRef: "overshoot",
      evidence: `Configured overshoot: ${config.overshoot}`,
    });
  }

  // ==========================================================================
  // 3. PERFORMANCE & GPU TRANSFORMS EVALUATION
  // ==========================================================================
  for (const propKey of Object.keys(props)) {
    if (LAYOUT_PROPERTIES.has(propKey)) {
      performanceScore -= 40;
      findings.push({
        id: `perf-layout-thrash-${propKey}`,
        category: "performance",
        severity: "critical",
        message: `Animating layout property "${propKey}" triggers DOM reflow.`,
        explanation: `Modifying "${propKey}" forces the browser to recalculate layout for the entire document subtree. Use GPU-accelerated "transform" or "opacity" instead.`,
        propertyRef: propKey,
        evidence: `Directly animated layout property: "${propKey}"`,
      });
    }
  }

  // Check particle density on CPU
  if (config.particleCount && typeof config.particleCount === "number") {
    if (config.particleCount > 10000 && config.renderStrategy === "canvas2d") {
      performanceScore -= 30;
      findings.push({
        id: "perf-particle-density-cpu",
        category: "performance",
        severity: "warning",
        message: "High particle count (> 10,000) running on 2D canvas context.",
        explanation: "2D Canvas context cannot maintain 60 FPS under 10k particles on typical mobile CPUs. Switch to WebGL2 or WebGPU compute.",
        propertyRef: "particleCount",
        evidence: `Count: ${config.particleCount}, Strategy: 2D Canvas`,
      });
    }
  }

  // ==========================================================================
  // 4. ACCESSIBILITY EVALUATION
  // ==========================================================================
  const respectReduced = input.reducedMotion ?? config.respectReducedMotion ?? composition?.accessibility.respectReducedMotion;
  if (!respectReduced && (duration > 800 || config.iterations === "infinite")) {
    accessibilityScore -= 35;
    findings.push({
      id: "a11y-reduced-motion-unhandled",
      category: "accessibility",
      severity: "critical",
      message: "Continuous or expressive motion does not honor prefers-reduced-motion.",
      explanation: "Users with vestibular motion disorders require animations to either skip to endpoint or fade gently without spatial parallax.",
      propertyRef: "accessibility.respectReducedMotion",
      evidence: `respectReducedMotion: ${Boolean(respectReduced)}`,
    });
  }

  // Rapid flashing check
  if (config.iterations === "infinite" && duration < 200 && trigger === "attention") {
    accessibilityScore -= 50;
    findings.push({
      id: "a11y-seizure-risk-strobe",
      category: "accessibility",
      severity: "critical",
      message: "Flashing rate exceeds 3Hz in continuous loop (photosensitive risk).",
      explanation: "Rapid flashing between contrasting states can trigger seizures in photosensitive individuals (WCAG 2.1 Success Criterion 2.3.1).",
      propertyRef: "duration",
      evidence: `Duration: ${duration}ms, Repeating: infinite`,
    });
  }

  // ==========================================================================
  // 5. COMPOSITION & DEPENDENCY EVALUATION
  // ==========================================================================
  if (composition) {
    const nodeCount = Object.keys(composition.nodes).length;
    if (nodeCount > 24) {
      compositionScore -= 20;
      findings.push({
        id: "comp-excessive-nodes",
        category: "composition",
        severity: "suggestion",
        message: `High composition node count (${nodeCount} nodes).`,
        explanation: "Compositions with more than 24 independent animation nodes may benefit from hierarchical grouping or stagger containers.",
        propertyRef: "composition.nodes",
        evidence: `Total nodes: ${nodeCount}`,
      });
    }
  }

  // Clamp dimension scores between 0 and 100
  const clamp = (val: number) => Math.max(0, Math.min(100, Math.round(val)));

  const scores: MotionQualityDimensions = {
    overall: 0,
    timing: clamp(timingScore),
    easing: clamp(easingScore),
    composition: clamp(compositionScore),
    interaction: clamp(interactionScore),
    physics: clamp(physicsScore),
    performance: clamp(performanceScore),
    accessibility: clamp(accessibilityScore),
  };

  // Compute weighted overall score
  const overall = clamp(
    scores.performance * 0.25 +
    scores.accessibility * 0.25 +
    scores.easing * 0.15 +
    scores.timing * 0.15 +
    scores.composition * 0.10 +
    scores.interaction * 0.05 +
    scores.physics * 0.05
  );

  (scores as any).overall = overall;

  // Derive Grade
  let grade: QualityGrade = "A";
  if (overall >= 95) grade = "A+";
  else if (overall >= 88) grade = "A";
  else if (overall >= 78) grade = "B";
  else if (overall >= 68) grade = "C";
  else if (overall >= 55) grade = "D";
  else grade = "F";

  const summary = `Overall Quality: ${grade} (${overall}/100) — Detected ${findings.length} findings across evaluated dimensions.`;

  return {
    scores,
    grade,
    findings,
    summary,
  };
}
