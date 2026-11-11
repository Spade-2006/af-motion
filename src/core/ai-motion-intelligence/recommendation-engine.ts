/**
 * AF Motion AI Motion Recommendation Engine
 *
 * Generates evidence-based, actionable recommendations from quality findings
 * and intent classifications, with full accept/reject lifecycle support.
 */

import type {
  IntelligentMotionRecommendation,
  MotionAnalysisInput,
  QualityFinding,
  RecommendationStatus,
} from "./types.js";

export function generateMotionRecommendations(
  input: MotionAnalysisInput,
  findings: readonly QualityFinding[]
): IntelligentMotionRecommendation[] {
  const config = input.configuration ?? {};
  const recommendations: IntelligentMotionRecommendation[] = [];

  for (const finding of findings) {
    switch (finding.id) {
      case "easing-linear-entrance":
        recommendations.push({
          id: "rec-smooth-easing",
          category: "easing",
          severity: "warning",
          title: "Switch to Natural Deceleration Curve",
          explanation: "Replacing linear easing with a smooth cubic bezier provides authentic deceleration matching real-world physics.",
          propertyRef: "easing",
          currentValue: config.easing,
          suggestedValue: "cubic-bezier(0.16, 1, 0.3, 1)",
          expectedBenefit: "Eliminates abrupt visual motion; +25% perceived smoothness.",
          confidence: 0.95,
          status: "pending",
          patch: { easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        });
        break;

      case "timing-too-long":
        recommendations.push({
          id: "rec-optimize-duration",
          category: "timing",
          severity: "warning",
          title: "Tighten Transition Duration",
          explanation: "Reducing duration from excessive values to 450ms keeps user flow responsive without losing perceptual richness.",
          propertyRef: "duration",
          currentValue: config.duration,
          suggestedValue: 450,
          expectedBenefit: "Instant UI responsiveness; reduces user interaction blocking time.",
          confidence: 0.92,
          status: "pending",
          patch: { duration: 450 },
        });
        break;

      case "timing-too-short":
        recommendations.push({
          id: "rec-extend-duration",
          category: "timing",
          severity: "warning",
          title: "Increase Duration for Visual Comprehension",
          explanation: "Increasing duration to 250ms allows the human eye to perceive the motion journey without feeling delayed.",
          propertyRef: "duration",
          currentValue: config.duration,
          suggestedValue: 250,
          expectedBenefit: "Eliminates perceptual strobe flicker; ensures animation intent is felt.",
          confidence: 0.88,
          status: "pending",
          patch: { duration: 250 },
        });
        break;

      case "a11y-reduced-motion-unhandled":
        recommendations.push({
          id: "rec-enforce-reduced-motion",
          category: "accessibility",
          severity: "critical",
          title: "Honor prefers-reduced-motion Preference",
          explanation: "Activate respectReducedMotion with a graceful fade fallback to support users with vestibular sensitivity.",
          propertyRef: "accessibility.respectReducedMotion",
          currentValue: false,
          suggestedValue: true,
          expectedBenefit: "100% WCAG 2.1 compliance; prevents vestibular discomfort.",
          confidence: 0.99,
          status: "pending",
          patch: { respectReducedMotion: true },
        });
        break;

      case "perf-particle-density-cpu":
        recommendations.push({
          id: "rec-optimize-particles",
          category: "performance",
          severity: "warning",
          title: "Switch to GPU Particle Strategy or Cap Count",
          explanation: "Limiting particle count to 2,500 on 2D Canvas or migrating to WebGL2 guarantees sustained 60 FPS across mobile devices.",
          propertyRef: "particleCount",
          currentValue: config.particleCount,
          suggestedValue: 2500,
          expectedBenefit: "Maintains 60 FPS; reduces CPU thermal throttling.",
          confidence: 0.90,
          status: "pending",
          patch: { particleCount: 2500 },
        });
        break;

      default:
        // Layout thrashing property fixes
        if (finding.id.startsWith("perf-layout-thrash-")) {
          const prop = finding.propertyRef ?? "property";
          let suggestedProp = "transform";
          let suggestedValue = "translateY(20px)";

          if (prop === "top" || prop === "marginTop") {
            suggestedProp = "translateY";
            suggestedValue = "20px";
          } else if (prop === "left" || prop === "marginLeft") {
            suggestedProp = "translateX";
            suggestedValue = "20px";
          } else if (prop === "width" || prop === "height") {
            suggestedProp = "scale";
            suggestedValue = "1.0";
          }

          recommendations.push({
            id: `rec-gpu-transform-${prop}`,
            category: "performance",
            severity: "critical",
            title: `Replace Layout Property "${prop}" with GPU Transform`,
            explanation: `Animate GPU-accelerated "${suggestedProp}" instead of "${prop}" to avoid expensive document reflows.`,
            propertyRef: prop,
            currentValue: config[prop],
            suggestedValue: suggestedValue,
            expectedBenefit: "Achieves silky 60 FPS; avoids layout thrashing completely.",
            confidence: 0.98,
            status: "pending",
            patch: { [prop]: undefined, [suggestedProp]: suggestedValue },
          });
        }
        break;
    }
  }

  return recommendations;
}

/**
 * Updates the status of a recommendation without mutating the original object.
 */
export function updateRecommendationStatus(
  recommendations: readonly IntelligentMotionRecommendation[],
  recommendationId: string,
  newStatus: RecommendationStatus
): IntelligentMotionRecommendation[] {
  return recommendations.map((rec) => {
    if (rec.id === recommendationId) {
      return { ...rec, status: newStatus };
    }
    return rec;
  });
}

/**
 * Applies all accepted recommendations to an existing configuration immutably.
 */
export function applyAcceptedRecommendations<T extends Record<string, unknown>>(
  config: T,
  recommendations: readonly IntelligentMotionRecommendation[]
): T {
  let updated = { ...config };

  for (const rec of recommendations) {
    if (rec.status === "accepted" && rec.patch) {
      for (const [key, val] of Object.entries(rec.patch)) {
        if (val === undefined) {
          delete (updated as any)[key];
        } else {
          (updated as any)[key] = val;
        }
      }
    }
  }

  return updated;
}
