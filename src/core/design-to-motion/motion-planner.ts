/**
 * AF Motion Design-to-Motion Planning Engine (Prompt 142)
 *
 * Converts design analysis, element hierarchy, and Motion DNA personality
 * into an orchestrated MotionPlan, querying Prompt 141's pattern knowledge base.
 */

import type {
  DesignAnalysisResult,
  MotionPlan,
  MotionPlanElement,
  MotionElementPhasePlan,
  MotionElementInteractionPlan,
  MotionDNAPersonalityOption,
  DesignTokenContext,
} from "./types.js";
import { queryPatternKnowledgeBase } from "../ai-motion-intelligence/knowledge-base.js";

interface DNAParameters {
  readonly durationMultiplier: number;
  readonly distancePx: number;
  readonly staggerMs: number;
  readonly easingCurve: string;
  readonly spring: {
    readonly stiffness: number;
    readonly damping: number;
    readonly mass: number;
  };
  readonly hoverScale: number;
  readonly pressScale: number;
  readonly overshootPercent: number;
}

const DNA_PRESETS: Record<MotionDNAPersonalityOption, DNAParameters> = {
  precise: {
    durationMultiplier: 0.85,
    distancePx: 12,
    staggerMs: 45,
    easingCurve: "cubic-bezier(0.16, 1, 0.3, 1)",
    spring: { stiffness: 420, damping: 32, mass: 0.8 },
    hoverScale: 1.02,
    pressScale: 0.98,
    overshootPercent: 0,
  },
  playful: {
    durationMultiplier: 1.15,
    distancePx: 22,
    staggerMs: 70,
    easingCurve: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    spring: { stiffness: 240, damping: 14, mass: 1.0 },
    hoverScale: 1.05,
    pressScale: 0.94,
    overshootPercent: 18,
  },
  elegant: {
    durationMultiplier: 1.35,
    distancePx: 10,
    staggerMs: 80,
    easingCurve: "cubic-bezier(0.25, 1, 0.5, 1)",
    spring: { stiffness: 150, damping: 25, mass: 1.2 },
    hoverScale: 1.015,
    pressScale: 0.99,
    overshootPercent: 0,
  },
  energetic: {
    durationMultiplier: 0.7,
    distancePx: 28,
    staggerMs: 35,
    easingCurve: "cubic-bezier(0.2, 0, 0, 1)",
    spring: { stiffness: 520, damping: 22, mass: 0.6 },
    hoverScale: 1.04,
    pressScale: 0.95,
    overshootPercent: 8,
  },
  "editorial-flow": {
    durationMultiplier: 1.25,
    distancePx: 16,
    staggerMs: 95,
    easingCurve: "cubic-bezier(0.33, 1, 0.68, 1)",
    spring: { stiffness: 190, damping: 28, mass: 1.1 },
    hoverScale: 1.02,
    pressScale: 0.97,
    overshootPercent: 2,
  },
};

/**
 * Plans the motion orchestration for the analyzed design elements.
 */
export function planMotionFromDesign(
  analysis: DesignAnalysisResult,
  tokens: Required<DesignTokenContext>
): MotionPlan {
  const dna = tokens.motionDNA;
  const dnaParams = DNA_PRESETS[dna] || DNA_PRESETS.precise;
  const timingMultiplier = tokens.timingMultiplier || 1.0;
  const isReducedMotion = tokens.reducedMotion;

  // 1. Query Prompt 141 Knowledge Base for matching patterns
  const matchedPatterns = queryPatternKnowledgeBase(analysis.inferredIntent);
  const matchedPatternIds = matchedPatterns.map((p) => p.id);

  // 2. Determine Choreography Type
  let choreographyType: MotionPlan["choreographyType"] = "staggered";
  if (analysis.hierarchy.groups.length > 0) {
    choreographyType = "staggered";
  } else if (analysis.hierarchy.depth > 2) {
    choreographyType = "parent-child";
  } else if (analysis.inferredIntent === "feedback") {
    choreographyType = "parallel";
  } else if (analysis.inferredIntent === "scroll-storytelling") {
    choreographyType = "sequential";
  }

  // 3. Plan Element Motion Phases
  const baseDuration = Math.round(360 * dnaParams.durationMultiplier * timingMultiplier);
  const staggerDelay = Math.round(dnaParams.staggerMs * timingMultiplier);

  const elementPlans: MotionPlanElement[] = analysis.analyzedElements.map((el, index) => {
    const isInteractive = el.isInteractive;
    const isGroupMember = el.isRepeated || Boolean(el.constraints.length > 0);
    const delayMs = isGroupMember ? index * staggerDelay : 0;

    // Entrance Plan
    const entrance: MotionElementPhasePlan = isReducedMotion
      ? {
          properties: ["opacity"],
          from: { opacity: 0 },
          to: { opacity: 1 },
          durationMs: Math.min(baseDuration, 250),
          delayMs: Math.min(delayMs, 100),
          easing: "ease-out",
        }
      : buildEntrancePhase(el, dnaParams, baseDuration, delayMs);

    // Interaction Plan
    let interaction: MotionElementInteractionPlan | undefined;
    if (isInteractive) {
      interaction = {
        hover: {
          properties: ["transform", "boxShadow"],
          to: {
            transform: `scale(${dnaParams.hoverScale}) translateY(-2px)`,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
          },
          durationMs: Math.round(180 * timingMultiplier),
          easing: dnaParams.easingCurve,
        },
        press: {
          properties: ["transform"],
          to: {
            transform: `scale(${dnaParams.pressScale}) translateY(0px)`,
          },
          durationMs: Math.round(100 * timingMultiplier),
          easing: dnaParams.easingCurve,
        },
      };

      if (el.suggestedInteractions.includes("magnetic")) {
        interaction = {
          ...interaction,
          magnetic: {
            radius: 80,
            intensity: 0.35,
          },
        };
      }
    }

    // Exit Plan
    const exit: MotionElementPhasePlan = {
      properties: isReducedMotion ? ["opacity"] : ["opacity", "transform"],
      from: { opacity: 1, transform: "scale(1) translateY(0px)" },
      to: isReducedMotion
        ? { opacity: 0 }
        : { opacity: 0, transform: `scale(0.96) translateY(${dnaParams.distancePx}px)` },
      durationMs: Math.round(baseDuration * 0.75),
      delayMs: 0,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
    };

    return {
      elementId: el.id,
      name: `${el.type} (${el.id})`,
      entrance,
      interaction,
      exit,
    };
  });

  const totalDuration = baseDuration + (elementPlans.length - 1) * staggerDelay;

  return {
    id: `plan-${Date.now()}`,
    name: `${analysis.inferredIntent} Motion Plan (${dna})`,
    summary: `Orchestrated ${choreographyType} motion plan targeting ${elementPlans.length} element(s) with ${dna} personality curve.`,
    intent: analysis.inferredIntent,
    matchedPatternIds,
    choreographyType,
    elementPlans,
    motionDNA: dna,
    durationMs: totalDuration,
    staggerDelayMs: staggerDelay,
    easingCurve: dnaParams.easingCurve,
    springConfig: dnaParams.spring,
  };
}

function buildEntrancePhase(
  el: { suggestedEntrance: string; visualWeight: number },
  params: DNAParameters,
  baseDuration: number,
  delayMs: number
): MotionElementPhasePlan {
  const dist = params.distancePx;

  if (el.suggestedEntrance.includes("scale")) {
    return {
      properties: ["opacity", "transform"],
      from: {
        opacity: 0,
        transform: `scale(0.92) translateY(${Math.round(dist * 0.5)}px)`,
      },
      to: {
        opacity: 1,
        transform: "scale(1) translateY(0px)",
      },
      durationMs: baseDuration,
      delayMs,
      easing: params.easingCurve,
    };
  }

  if (el.suggestedEntrance.includes("slide-down")) {
    return {
      properties: ["opacity", "transform"],
      from: {
        opacity: 0,
        transform: `translateY(-${dist}px)`,
      },
      to: {
        opacity: 1,
        transform: "translateY(0px)",
      },
      durationMs: baseDuration,
      delayMs,
      easing: params.easingCurve,
    };
  }

  // Default upward slide & fade
  return {
    properties: ["opacity", "transform"],
    from: {
      opacity: 0,
      transform: `translateY(${dist}px)`,
    },
    to: {
      opacity: 1,
      transform: "translateY(0px)",
    },
    durationMs: baseDuration,
    delayMs,
    easing: params.easingCurve,
  };
}
