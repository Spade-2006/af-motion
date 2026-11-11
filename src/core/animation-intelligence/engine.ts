/**
 * AF Motion Animation Intelligence Engine
 *
 * Deterministic animation decision engine that selects suitable animation families,
 * easings, durations, and alternative recommendations based on component semantics,
 * visual styles, interaction intents, Motion DNA, and user preferences.
 */

import { classifyMotionIntent } from "./intent.js";
import { detectAnimationConflicts, scoreCandidates } from "./scoring.js";
import type {
  AnimationRecommendation,
  AnimationRecommendationResult,
  AnimationSelectionContext,
  ComponentCategory,
  ComponentMotionPlan,
  MotionIntent,
} from "./types.js";

export interface ComponentMotionOptions {
  readonly visualStyle?: string;
  readonly motionDNA?: string;
  readonly reducedMotion?: boolean;
  readonly deviceTier?: "low" | "medium" | "high";
  readonly existingAnimations?: readonly string[];
}

export interface ConflictResolutionResult {
  readonly resolvedRecommendations: readonly AnimationRecommendation[];
  readonly resolvedConflicts: readonly string[];
}

export class AnimationIntelligenceEngine {
  /**
   * Recommends the optimal animation and top alternatives for a given context.
   */
  public recommendAnimation(
    context: AnimationSelectionContext
  ): AnimationRecommendationResult {
    // 1. Ensure intent is valid, classifying if missing
    let intent: MotionIntent = context.intent;
    if (!intent) {
      const classified = classifyMotionIntent({ componentType: context.componentType });
      intent = classified.intent;
    }

    const normalizedContext: AnimationSelectionContext = {
      ...context,
      intent,
    };

    // 2. Score candidates
    const scoredCandidates = scoreCandidates(normalizedContext);

    if (scoredCandidates.length === 0) {
      // Fallback default
      const fallback: AnimationRecommendation = {
        id: "fallback-fade",
        name: "Subtle Fade",
        family: "fade",
        presetId: "preset-fade-in",
        properties: { opacity: [0, 1] },
        duration: 250,
        delay: 0,
        easing: "easeOutCubic",
        trigger: normalizedContext.trigger ?? "entrance",
        intent: normalizedContext.intent,
        componentType: normalizedContext.componentType,
        compatibilityScore: 60,
        performanceSuitability: {
          hardwareTier: normalizedContext.deviceTier ?? "high",
          gpuAccelerated: true,
          compositeOnly: true,
          estimatedFpsImpact: "negligible",
        },
        accessibilityCompatibility: {
          supportsReducedMotion: true,
          reducedMotionFallback: "instant",
          screenReaderSafe: true,
          highContrastSafe: true,
        },
        selectionRationale: {
          intentMatch: "Fallback safe fade applied.",
          componentContext: `Universal baseline for ${normalizedContext.componentType}.`,
          styleAlignment: "Neutral styling.",
          dnaInfluence: "Default timing.",
          summary: "Universal safe fade transition.",
        },
      };

      return {
        selected: fallback,
        alternatives: [],
        compatibilityScore: 60,
        conflictWarnings: [],
        context: normalizedContext,
      };
    }

    const selected = scoredCandidates[0];
    const alternatives = scoredCandidates.slice(1, 4);

    // 3. Detect conflicts
    const conflictWarnings = detectAnimationConflicts(
      selected,
      normalizedContext.existingAnimations
    );

    return {
      selected,
      alternatives: Object.freeze(alternatives),
      compatibilityScore: selected.compatibilityScore,
      conflictWarnings: Object.freeze(conflictWarnings),
      context: normalizedContext,
    };
  }

  /**
   * Generates a complete, multi-trigger motion plan for a component
   * (e.g. coordinated entrance, exit, hover, focus, and press).
   */
  public recommendComponentMotion(
    componentType: ComponentCategory,
    options: ComponentMotionOptions = {}
  ): ComponentMotionPlan {
    const entranceRes = this.recommendAnimation({
      componentType,
      intent: "disclosure",
      trigger: "entrance",
      ...options,
    });

    const exitRes = this.recommendAnimation({
      componentType,
      intent: "transition",
      trigger: "exit",
      ...options,
    });

    const hoverRes = this.recommendAnimation({
      componentType,
      intent: "emphasis",
      trigger: "hover",
      ...options,
    });

    const focusRes = this.recommendAnimation({
      componentType,
      intent: "attention",
      trigger: "focus",
      ...options,
    });

    const pressRes = this.recommendAnimation({
      componentType,
      intent: "feedback",
      trigger: "press",
      ...options,
    });

    const allScores = [
      entranceRes.compatibilityScore,
      exitRes.compatibilityScore,
      hoverRes.compatibilityScore,
      focusRes.compatibilityScore,
      pressRes.compatibilityScore,
    ];

    const overallCompatibility = Math.round(
      allScores.reduce((a, b) => a + b, 0) / allScores.length
    );

    const conflicts: string[] = [
      ...entranceRes.conflictWarnings,
      ...exitRes.conflictWarnings,
      ...hoverRes.conflictWarnings,
      ...focusRes.conflictWarnings,
      ...pressRes.conflictWarnings,
    ];

    return {
      componentType,
      visualStyle: options.visualStyle,
      overallCompatibility,
      entrance: entranceRes.selected,
      exit: exitRes.selected,
      hover: hoverRes.selected,
      focus: focusRes.selected,
      press: pressRes.selected,
      conflicts: Object.freeze(conflicts),
    };
  }

  /**
   * Resolves conflicts across multiple proposed animations.
   */
  public resolveAnimationConflicts(
    recommendations: readonly AnimationRecommendation[]
  ): ConflictResolutionResult {
    const resolved: AnimationRecommendation[] = [];
    const resolvedConflicts: string[] = [];
    const seenProperties = new Set<string>();

    for (const rec of recommendations) {
      let isConflicting = false;
      for (const prop of Object.keys(rec.properties)) {
        if (seenProperties.has(prop)) {
          isConflicting = true;
          resolvedConflicts.push(
            `Property '${prop}' already animated by an earlier step; isolated '${rec.name}'.`
          );
          break;
        }
      }

      if (!isConflicting) {
        for (const prop of Object.keys(rec.properties)) {
          seenProperties.add(prop);
        }
        resolved.push(rec);
      }
    }

    return {
      resolvedRecommendations: Object.freeze(resolved),
      resolvedConflicts: Object.freeze(resolvedConflicts),
    };
  }

  /**
   * Produces a human- and agent-readable explanation of an animation recommendation.
   */
  public explainAnimationSelection(recommendation: AnimationRecommendation): string {
    const r = recommendation.selectionRationale;
    const p = recommendation.performanceSuitability;
    const a = recommendation.accessibilityCompatibility;

    return [
      `### Rationale for "${recommendation.name}" (${recommendation.family} family)`,
      `- **Score**: ${recommendation.compatibilityScore}/100`,
      `- **Intent**: ${r.intentMatch}`,
      `- **Component**: ${r.componentContext}`,
      `- **Style**: ${r.styleAlignment}`,
      `- **Motion DNA**: ${r.dnaInfluence}`,
      `- **Performance**: Hardware tier "${p.hardwareTier}", composite-only=${p.compositeOnly}, estimated impact: ${p.estimatedFpsImpact}`,
      `- **Accessibility**: Reduced motion fallback="${a.reducedMotionFallback}", screen reader safe=${a.screenReaderSafe}`,
      `- **Summary**: ${r.summary}`,
    ].join("\n");
  }
}

export const animationIntelligenceEngine = new AnimationIntelligenceEngine();

export function recommendAnimation(
  context: AnimationSelectionContext
): AnimationRecommendationResult {
  return animationIntelligenceEngine.recommendAnimation(context);
}

export function recommendComponentMotion(
  componentType: ComponentCategory,
  options?: ComponentMotionOptions
): ComponentMotionPlan {
  return animationIntelligenceEngine.recommendComponentMotion(componentType, options);
}

export function explainAnimationSelection(
  recommendation: AnimationRecommendation
): string {
  return animationIntelligenceEngine.explainAnimationSelection(recommendation);
}
