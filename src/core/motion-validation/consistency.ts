/**
 * AF Motion Consistency Intelligence Engine
 *
 * Evaluates motion consistency across durations, easings, Visual Style,
 * Motion DNA, and cross-system choreography.
 */

import { validateMotionConfig } from "./validator.js";
import type {
  MotionConsistencyReport,
  MotionValidationIssue,
} from "./types.js";

/**
 * Evaluates holistic motion consistency across multiple components, transitions, or scenes.
 */
export function evaluateMotionConsistency(
  configs: readonly any[] = []
): MotionConsistencyReport {
  if (!Array.isArray(configs) || configs.length === 0) {
    return {
      consistencyScore: 100,
      durationHarmonic: true,
      easingAligned: true,
      dnaAligned: true,
      styleAligned: true,
      issues: Object.freeze([]),
      recommendations: Object.freeze(["No motion configurations supplied to consistency analyzer."]),
    };
  }

  const issues: MotionValidationIssue[] = [];
  const recommendations: string[] = [];

  const durations: number[] = [];
  const easings = new Set<string>();
  const motionDNAs = new Set<string>();
  const visualStyles = new Set<string>();

  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const validation = validateMotionConfig(cfg);
    for (const issue of validation.issues) {
      if (issue.category === "dna-contradiction" || issue.category === "timing-inconsistency") {
        issues.push({ ...issue, path: `configs[${i}]` });
      }
    }

    const dur = cfg.duration ?? (cfg.config ? cfg.config.duration : undefined);
    if (typeof dur === "number") durations.push(dur);

    const easing = cfg.easing ?? (cfg.config ? cfg.config.easing : undefined);
    if (typeof easing === "string") easings.add(easing);

    const dna = cfg.motionDNA ?? (cfg.config ? cfg.config.motionDNA : undefined);
    if (typeof dna === "string") motionDNAs.add(dna);

    const style = cfg.visualStyle ?? (cfg.config ? cfg.config.visualStyle : undefined);
    if (typeof style === "string") visualStyles.add(style);
  }

  // Check easing alignment
  let easingAligned = true;
  if (easings.size > 2) {
    easingAligned = false;
    issues.push({
      id: "issue-inconsistent-easings",
      severity: "warning",
      category: "timing-inconsistency",
      message: `Scene mixes ${easings.size} disparate easing curves (${Array.from(easings).slice(0, 3).join(", ")}).`,
      suggestedFix: "Standardize on a shared easing curve from your Design System or Motion DNA.",
      autoFixable: true,
    });
    recommendations.push("Consolidate disparate easing curves into a single primary and secondary curve.");
  }

  // Check Motion DNA alignment
  let dnaAligned = true;
  if (motionDNAs.size > 1) {
    dnaAligned = false;
    issues.push({
      id: "issue-conflicting-motion-dna",
      severity: "warning",
      category: "dna-contradiction",
      message: `Multiple conflicting Motion DNA profiles active simultaneously (${Array.from(motionDNAs).join(", ")}).`,
      suggestedFix: "Select a single Motion DNA profile per view hierarchy.",
      autoFixable: true,
    });
    recommendations.push("Align all view components to a unified Motion DNA profile.");
  }

  // Check visual style alignment
  let styleAligned = true;
  if (visualStyles.size > 1) {
    styleAligned = false;
    recommendations.push("Harmonize visual styles to avoid clashing aesthetic treatments.");
  }

  // Check duration harmony
  let durationHarmonic = true;
  if (durations.length > 1) {
    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations);
    if (maxDur / Math.max(1, minDur) > 4) {
      durationHarmonic = false;
      issues.push({
        id: "issue-duration-disharmony",
        severity: "info",
        category: "timing-inconsistency",
        message: `Wide variance in animation durations detected (min ${minDur}ms vs max ${maxDur}ms).`,
        suggestedFix: "Use duration tokens based on a musical or typographic scale (e.g. 150ms, 300ms, 600ms).",
        autoFixable: true,
      });
      recommendations.push("Structure animation durations on consistent rhythm intervals.");
    }
  }

  let consistencyScore = 100;
  if (!easingAligned) consistencyScore -= 15;
  if (!dnaAligned) consistencyScore -= 15;
  if (!styleAligned) consistencyScore -= 10;
  if (!durationHarmonic) consistencyScore -= 10;
  consistencyScore = Math.max(0, consistencyScore);

  if (recommendations.length === 0) {
    recommendations.push("Motion palette is consistent, harmonious, and aligned across all systems.");
  }

  return {
    consistencyScore,
    durationHarmonic,
    easingAligned,
    dnaAligned,
    styleAligned,
    issues: Object.freeze(issues),
    recommendations: Object.freeze(recommendations),
  };
}
