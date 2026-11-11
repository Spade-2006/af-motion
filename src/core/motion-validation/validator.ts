/**
 * AF Motion Unified Motion Validator
 *
 * Deterministic validation engine detecting layout thrashing, performance bottlenecks,
 * accessibility hazards (seizures, reduced motion), and Motion DNA contradictions.
 */

import type {
  MotionValidationIssue,
  MotionValidationResult,
  ValidationIssueCategory,
  ValidationSeverity,
} from "./types.js";
import { hasCircularReference, safeJsonStringify } from "../utils/safe-json.js";

const LAYOUT_PROPERTIES = new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "borderWidth",
]);

/**
 * Validates a motion configuration object, plan, or transition specification.
 */
export function validateMotionConfig(config: any): MotionValidationResult {
  const issues: MotionValidationIssue[] = [];

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      score: 0,
      accessibilityScore: 0,
      performanceScore: 0,
      consistencyScore: 0,
      issues: [
        {
          id: "issue-invalid-config",
          severity: "error",
          category: "property-conflict",
          message: "Configuration must be a non-null object.",
          autoFixable: false,
        },
      ],
      summary: "Invalid motion configuration: not an object.",
    };
  }

  // Extract properties
  const properties =
    config.properties ??
    config.config?.properties ??
    (config.plan ? config.plan.properties : undefined) ??
    {};

  const duration =
    config.duration ??
    config.config?.duration ??
    (config.plan ? config.plan.duration : undefined);

  const repeat =
    config.repeat ??
    config.options?.repeat ??
    config.config?.repeat ??
    0;

  const motionDNA = config.motionDNA ?? config.config?.motionDNA;
  const respectReducedMotion =
    config.respectReducedMotion ?? config.plan?.respectReducedMotion ?? true;

  // 1. Layout-triggering properties check
  if (properties && typeof properties === "object") {
    for (const [prop, val] of Object.entries(properties)) {
      if (LAYOUT_PROPERTIES.has(prop)) {
        issues.push({
          id: `issue-layout-${prop}`,
          severity: "warning",
          category: "layout-thrashing",
          property: prop,
          message: `Animating layout-triggering property '${prop}' causes browser reflow and frame drops.`,
          suggestedFix: `Replace '${prop}' with GPU-accelerated 'transform' (e.g. translateY/scale).`,
          autoFixable: true,
        });
      }

      // Check expensive blur filters
      if (prop === "filter" || prop === "backdropFilter") {
        const strVal = String(val);
        if (strVal.includes("blur") && /blur\((\d+)px\)/.test(strVal)) {
          const match = strVal.match(/blur\((\d+)px\)/);
          const px = match ? parseInt(match[1], 10) : 0;
          if (px > 24) {
            issues.push({
              id: "issue-expensive-blur",
              severity: "warning",
              category: "expensive-filter",
              property: prop,
              message: `Blur radius ${px}px is computationally expensive and may degrade mobile GPU fill rate.`,
              suggestedFix: "Limit blur radius to 16px or lower for interactive motion.",
              autoFixable: true,
            });
          }
        }
      }
    }
  }

  if (typeof repeat === "number" && repeat !== Infinity && (!Number.isFinite(repeat) || repeat < 0)) {
    issues.push({
      id: "issue-invalid-repeat",
      severity: "error",
      category: "timing-inconsistency",
      property: "repeat",
      message: `Invalid repeat value (${String(repeat)}): must be Infinity or a finite non-negative number.`,
      suggestedFix: "Set repeat to a finite integer >= 0 or Infinity.",
      autoFixable: true,
    });
  }

  // 2. Duration and repetition checks
  if (typeof duration === "number") {
    if (!Number.isFinite(duration) || duration < 0) {
      issues.push({
        id: "issue-invalid-duration",
        severity: "error",
        category: "timing-inconsistency",
        property: "duration",
        message: `Invalid duration (${String(duration)}): must be a finite number >= 0.`,
        suggestedFix: "Provide a finite non-negative millisecond duration (e.g. 300).",
        autoFixable: true,
      });
    }
    if (duration > 5000) {
      issues.push({
        id: "issue-excessive-duration",
        severity: "warning",
        category: "excessive-duration",
        property: "duration",
        message: `Duration ${duration}ms is excessively slow for standard UI transitions.`,
        suggestedFix: "Cap UI transition duration between 200ms and 1200ms.",
        autoFixable: true,
      });
    }

    // Seizure Risk: Rapid repetition / flashing (WCAG 2.3.1)
    if (duration > 0 && duration <= 100 && (repeat >= 3 || repeat === Infinity)) {
      issues.push({
        id: "issue-seizure-risk",
        severity: "error",
        category: "seizure-risk",
        property: "duration",
        message: `Rapid oscillation (${duration}ms repeat) violates WCAG 2.3.1 three-flashes threshold and poses photo-epileptic seizure risks.`,
        suggestedFix: "Increase animation duration to at least 333ms or reduce repetition count to <= 2.",
        autoFixable: true,
      });
    }
  }

  // 3. Reduced Motion Compliance
  if (respectReducedMotion === false) {
    issues.push({
      id: "issue-reduced-motion-ignored",
      severity: "error",
      category: "reduced-motion-violation",
      property: "respectReducedMotion",
      message: "Configuration explicitly disables reduced-motion accessibility overrides.",
      suggestedFix: "Set respectReducedMotion to true and supply safe fallback properties.",
      autoFixable: true,
    });
  }

  if (hasCircularReference(config)) {
    issues.push({
      id: "issue-circular-config",
      severity: "error",
      category: "property-conflict",
      message: "Configuration contains circular object references.",
      autoFixable: false,
    });
  }

  // Check large translations without reduced motion handling
  if (properties && properties.transform) {
    const trStr = safeJsonStringify(properties.transform);
    if (/translate[XY3d]*\([^)]*([5-9]\d{2}|\d{4})px/.test(trStr)) {
      if (!config.reducedMotionProperties && !config.reducedMotionConfig) {
        issues.push({
          id: "issue-large-movement-without-fallback",
          severity: "warning",
          category: "accessibility-risk",
          property: "transform",
          message: "Large motion displacement (>500px) can trigger vestibular disorders without reduced-motion fallbacks.",
          suggestedFix: "Provide reducedMotion fallback with opacity transitions only.",
          autoFixable: true,
        });
      }
    }
  }

  // 4. Motion DNA Contradictions
  if (motionDNA === "snappy" && typeof duration === "number" && duration > 500) {
    issues.push({
      id: "issue-dna-contradiction-snappy",
      severity: "warning",
      category: "dna-contradiction",
      property: "duration",
      message: `Motion DNA is set to 'snappy' but duration is ${duration}ms (expected <= 400ms).`,
      suggestedFix: "Reduce duration to <= 300ms to preserve snappy personality.",
      autoFixable: true,
    });
  } else if ((motionDNA === "calm" || motionDNA === "cinematic") && typeof duration === "number" && duration < 200) {
    issues.push({
      id: "issue-dna-contradiction-calm",
      severity: "warning",
      category: "dna-contradiction",
      property: "duration",
      message: `Motion DNA is set to '${motionDNA}' but duration is ${duration}ms (expected >= 400ms).`,
      suggestedFix: "Increase duration to >= 500ms to convey relaxed cinematic motion.",
      autoFixable: true,
    });
  }

  // 5. Score calculation
  let healthScore = 100;
  let accessibilityScore = 100;
  let performanceScore = 100;
  let consistencyScore = 100;

  for (const issue of issues) {
    const penalty = issue.severity === "error" ? 25 : issue.severity === "warning" ? 10 : 3;
    healthScore -= penalty;

    if (issue.category === "seizure-risk" || issue.category === "reduced-motion-violation" || issue.category === "accessibility-risk") {
      accessibilityScore -= penalty * 1.5;
    }
    if (issue.category === "layout-thrashing" || issue.category === "expensive-filter" || issue.category === "excessive-intensity") {
      performanceScore -= penalty * 1.5;
    }
    if (issue.category === "dna-contradiction" || issue.category === "timing-inconsistency" || issue.category === "property-conflict") {
      consistencyScore -= penalty * 1.5;
    }
  }

  healthScore = Math.max(0, Math.min(100, healthScore));
  accessibilityScore = Math.max(0, Math.min(100, Math.round(accessibilityScore)));
  performanceScore = Math.max(0, Math.min(100, Math.round(performanceScore)));
  consistencyScore = Math.max(0, Math.min(100, Math.round(consistencyScore)));

  const valid = !issues.some((i) => i.severity === "error");
  const summary = valid
    ? issues.length === 0
      ? "Motion configuration is fully valid, accessible, and performant."
      : `Configuration is valid with ${issues.length} non-blocking suggestions.`
    : `Configuration contains ${issues.filter((i) => i.severity === "error").length} blocking error(s).`;

  return {
    valid,
    score: healthScore,
    accessibilityScore,
    performanceScore,
    consistencyScore,
    issues: Object.freeze(issues),
    summary,
  };
}
