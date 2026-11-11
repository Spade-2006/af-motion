/**
 * AF Motion Intelligent Scroll Plan Generator
 *
 * Deterministic generation of scroll-driven animation specifications, offsets,
 * easing curves, parallax layers, 3D timelines, and accessibility fallbacks.
 */

import type { AnimatableProperties } from "../animate.js";
import { classifyScrollIntent } from "./intent.js";
import type {
  ScrollAnimationType,
  ScrollIntelligenceContext,
  ScrollIntelligenceResult,
  ScrollPlan,
  ScrollProgressMode,
} from "./types.js";

interface ScrollPatternBlueprint {
  readonly type: ScrollAnimationType;
  readonly defaultProgressMode: ScrollProgressMode;
  readonly defaultStartOffset: string | number;
  readonly defaultEndOffset: string | number;
  readonly defaultProperties: AnimatableProperties;
  readonly defaultEasing: string;
  readonly defaultReversible: boolean;
  readonly defaultClamp: boolean;
}

const BLUEPRINTS: Record<ScrollAnimationType, ScrollPatternBlueprint> = {
  reveal: {
    type: "reveal",
    defaultProgressMode: "element",
    defaultStartOffset: "top 85%",
    defaultEndOffset: "center center",
    defaultProperties: {
      opacity: [0, 1],
      transform: ["translateY(32px)", "translateY(0px)"],
    },
    defaultEasing: "easeOutCubic",
    defaultReversible: false,
    defaultClamp: true,
  },
  parallax: {
    type: "parallax",
    defaultProgressMode: "element",
    defaultStartOffset: "top bottom",
    defaultEndOffset: "bottom top",
    defaultProperties: {
      transform: ["translate3d(0, -60px, 0)", "translate3d(0, 60px, 0)"],
    },
    defaultEasing: "linear",
    defaultReversible: true,
    defaultClamp: false,
  },
  "sticky-story": {
    type: "sticky-story",
    defaultProgressMode: "container",
    defaultStartOffset: "top top",
    defaultEndOffset: "bottom bottom",
    defaultProperties: {
      transform: ["scale(1)", "scale(1.05)"],
      opacity: [1, 0.85],
    },
    defaultEasing: "easeInOutSine",
    defaultReversible: true,
    defaultClamp: true,
  },
  "progress-indicator": {
    type: "progress-indicator",
    defaultProgressMode: "viewport",
    defaultStartOffset: 0,
    defaultEndOffset: 1,
    defaultProperties: {
      transform: ["scaleX(0)", "scaleX(1)"],
      transformOrigin: ["0% 50%", "0% 50%"],
    },
    defaultEasing: "linear",
    defaultReversible: true,
    defaultClamp: true,
  },
  "stagger-sequence": {
    type: "stagger-sequence",
    defaultProgressMode: "element",
    defaultStartOffset: "top 80%",
    defaultEndOffset: "center center",
    defaultProperties: {
      opacity: [0, 1],
      transform: ["translateY(24px)", "translateY(0px)"],
    },
    defaultEasing: "easeOutCubic",
    defaultReversible: false,
    defaultClamp: true,
  },
  "horizontal-section": {
    type: "horizontal-section",
    defaultProgressMode: "container",
    defaultStartOffset: "top top",
    defaultEndOffset: "bottom bottom",
    defaultProperties: {
      transform: ["translateX(0%)", "translateX(-75%)"],
    },
    defaultEasing: "linear",
    defaultReversible: true,
    defaultClamp: true,
  },
  "scroll-typography": {
    type: "scroll-typography",
    defaultProgressMode: "element",
    defaultStartOffset: "center 75%",
    defaultEndOffset: "center 35%",
    defaultProperties: {
      opacity: [0.3, 1],
      transform: ["scale(0.98)", "scale(1)"],
    },
    defaultEasing: "easeInOutSine",
    defaultReversible: true,
    defaultClamp: true,
  },
  "scroll-3d-sync": {
    type: "scroll-3d-sync",
    defaultProgressMode: "container",
    defaultStartOffset: "top top",
    defaultEndOffset: "bottom bottom",
    defaultProperties: {
      opacity: [1, 1],
    },
    defaultEasing: "linear",
    defaultReversible: true,
    defaultClamp: true,
  },
};

/**
 * Generates an intelligent, deterministic scroll animation plan.
 */
export function generateScrollPlan(
  context: ScrollIntelligenceContext
): ScrollIntelligenceResult {
  const intentClassified = classifyScrollIntent(context);
  const type: ScrollAnimationType = context.type ?? intentClassified.type;
  const bp = BLUEPRINTS[type] ?? BLUEPRINTS.reveal;

  const warnings: string[] = [];
  let score = 90;

  // 1. Reduced Motion Adjustments
  const reducedMotion = context.reducedMotion ?? false;
  let finalProperties = bp.defaultProperties;
  let reducedProperties: AnimatableProperties | undefined = undefined;

  if (reducedMotion) {
    score -= 10;
    warnings.push(`Reduced motion active: replaced dynamic translations with opacity-only transitions.`);
    finalProperties = { opacity: [0, 1] };
    reducedProperties = { opacity: [0, 1] };
  }

  // 2. Performance Tier Check
  if (context.deviceTier === "low") {
    if (type === "horizontal-section" || type === "scroll-3d-sync") {
      warnings.push(`Device tier 'low' may experience frame drops with ${type}; consider static or 2D reveal.`);
      score -= 20;
    }
  }

  // 3. Motion DNA & Visual Style Pacing
  let easing = bp.defaultEasing;
  if (context.visualStyle === "editorial" || context.motionDNA === "editorial-flow") {
    easing = "cubic-bezier(0.25, 1, 0.5, 1)";
  } else if (context.visualStyle === "brutalist") {
    easing = "steps(4, jump-end)";
  } else if (context.motionDNA === "snappy") {
    easing = "easeOutQuad";
  } else if (context.motionDNA === "calm" || context.motionDNA === "cinematic") {
    easing = "easeInOutCubic";
  }

  const plan: ScrollPlan = {
    id: `scroll-plan-${type}-${Date.now().toString(36)}`,
    name: `Scroll Plan: ${type}`,
    type,
    progressMode: context.progressMode ?? bp.defaultProgressMode,
    startOffset: context.startOffset ?? bp.defaultStartOffset,
    endOffset: context.endOffset ?? bp.defaultEndOffset,
    properties: finalProperties,
    easing,
    reversible: context.reversible ?? bp.defaultReversible,
    clamp: bp.defaultClamp,
    stagger: context.stagger ?? (type === "stagger-sequence" ? 80 : undefined),
    sync3DTimelineId: context.sync3DController ? "scroll-3d-timeline-sync" : undefined,
    compatibilityScore: Math.max(0, Math.min(100, score)),
    explanation: `Selected '${type}' based on intent '${context.intent ?? type}' and component '${context.componentType ?? "generic"}'.`,
    respectReducedMotion: true,
    reducedMotionProperties: reducedProperties,
  };

  // 4. Generate Alternative Plans
  const alternativeTypes = (Object.keys(BLUEPRINTS) as ScrollAnimationType[])
    .filter((t) => t !== type)
    .slice(0, 2);

  const alternatives: ScrollPlan[] = alternativeTypes.map((altType) => {
    const altBp = BLUEPRINTS[altType];
    return {
      id: `scroll-plan-alt-${altType}`,
      name: `Alternative: ${altType}`,
      type: altType,
      progressMode: altBp.defaultProgressMode,
      startOffset: altBp.defaultStartOffset,
      endOffset: altBp.defaultEndOffset,
      properties: altBp.defaultProperties,
      easing: altBp.defaultEasing,
      reversible: altBp.defaultReversible,
      clamp: altBp.defaultClamp,
      compatibilityScore: Math.max(0, score - 15),
      explanation: `Alternative scroll pattern '${altType}'.`,
      respectReducedMotion: true,
    };
  });

  return {
    plan,
    alternatives: Object.freeze(alternatives),
    compatibilityScore: plan.compatibilityScore,
    warnings: Object.freeze(warnings),
    explanation: plan.explanation,
    context,
  };
}
