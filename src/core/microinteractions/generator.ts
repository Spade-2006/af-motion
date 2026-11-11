/**
 * AF Motion Microinteraction Plan Generator
 *
 * Deterministic generation of context-aware microinteraction specifications,
 * animation timing, easing, spring curves, accessibility fallbacks, and alternatives.
 */

import type { AnimatableProperties } from "../animate.js";
import { classifyMicrointeractionIntent } from "./intent.js";
import type {
  InteractionState,
  MicroComponentCategory,
  MicrointeractionConfig,
  MicrointeractionContext,
  MicrointeractionFeedbackType,
  MicrointeractionPlan,
  MicrointeractionResult,
  MicrointeractionTrigger,
} from "./types.js";

/**
 * Computes base properties and feedback pattern for a given category and target state.
 */
function resolveBaseFeedback(
  category: MicroComponentCategory,
  toState: InteractionState
): {
  feedbackType: MicrointeractionFeedbackType;
  properties: AnimatableProperties;
  duration: number;
  trigger: MicrointeractionTrigger;
} {
  switch (toState) {
    case "press":
      return {
        feedbackType: "scale-press",
        properties: {
          transform: [
            "scale(1)",
            category === "card" || category === "surface" ? "scale(0.985)" : "scale(0.96)",
          ],
        },
        duration: 120,
        trigger: "pointer",
      };

    case "hover":
      return {
        feedbackType: "hover-lift",
        properties: {
          transform: [
            "translateY(0px)",
            category === "card" || category === "surface"
              ? "translateY(-4px)"
              : "translateY(-1.5px)",
          ],
          opacity: [0.92, 1],
        },
        duration: 180,
        trigger: "pointer",
      };

    case "focus":
    case "focus-visible":
      return {
        feedbackType: "focus-ring",
        properties: {
          transform: ["scale(1)", "scale(1.01)"],
          opacity: [0.95, 1],
        },
        duration: 150,
        trigger: "focus",
      };

    case "error":
      return {
        feedbackType: "shake-error",
        properties: {
          transform: [
            "translateX(0px)",
            "translateX(-6px)",
            "translateX(6px)",
            "translateX(-3px)",
            "translateX(3px)",
            "translateX(0px)",
          ],
        },
        duration: 280,
        trigger: "state-change",
      };

    case "success":
      return {
        feedbackType: "pop-success",
        properties: {
          transform: ["scale(0.96)", "scale(1.08)", "scale(1)"],
          opacity: [0.8, 1],
        },
        duration: 260,
        trigger: "state-change",
      };

    case "expanded":
      return {
        feedbackType: "disclosure-expand",
        properties: {
          opacity: [0, 1],
          transform: ["translateY(-8px)", "translateY(0px)"],
        },
        duration: 220,
        trigger: "toggle",
      };

    case "collapsed":
      return {
        feedbackType: "disclosure-expand",
        properties: {
          opacity: [1, 0],
          transform: ["translateY(0px)", "translateY(-8px)"],
        },
        duration: 180,
        trigger: "toggle",
      };

    case "active":
    case "selected":
      if (category === "toggle" || category === "checkbox") {
        return {
          feedbackType: "toggle-slide",
          properties: {
            transform: ["translateX(0px)", "translateX(18px)"],
          },
          duration: 160,
          trigger: "toggle",
        };
      }
      return {
        feedbackType: "subtle-color",
        properties: {
          opacity: [0.85, 1],
          transform: ["scale(0.98)", "scale(1)"],
        },
        duration: 180,
        trigger: "state-change",
      };

    case "dragging":
      return {
        feedbackType: "drag-elevation",
        properties: {
          transform: ["scale(1)", "scale(1.04) translateY(-4px)"],
          opacity: [1, 0.9],
        },
        duration: 160,
        trigger: "drag",
      };

    case "loading":
      return {
        feedbackType: "glow-pulse",
        properties: {
          opacity: [1, 0.6, 1],
        },
        duration: 800,
        trigger: "programmatic",
      };

    case "disabled":
      return {
        feedbackType: "subtle-color",
        properties: {
          opacity: [1, 0.45],
        },
        duration: 140,
        trigger: "state-change",
      };

    case "idle":
    default:
      return {
        feedbackType: "subtle-color",
        properties: {
          transform: ["translateY(0px) scale(1)", "translateY(0px) scale(1)"],
          opacity: [1, 1],
        },
        duration: 160,
        trigger: "pointer",
      };
  }
}

/**
 * Generates an intelligent, deterministic microinteraction plan.
 */
export function generateMicrointeractionPlan(
  context: MicrointeractionContext
): MicrointeractionResult {
  const intentClassified = classifyMicrointeractionIntent(context);
  const category: MicroComponentCategory = context.category ?? intentClassified.category;
  const toState: InteractionState = context.toState ?? intentClassified.targetState;
  const fromState: InteractionState = context.fromState ?? "idle";

  const base = resolveBaseFeedback(category, toState);
  const warnings: string[] = [];
  let score = 92;

  // 1. Motion DNA & Visual Style Modulation
  let easing = "cubic-bezier(0.2, 0, 0, 1)";
  let duration = base.duration;
  let springConfig: MicrointeractionConfig["spring"] = {
    stiffness: 300,
    damping: 24,
    mass: 1,
  };

  if (context.visualStyle === "editorial" || context.motionDNA === "editorial-flow") {
    easing = "cubic-bezier(0.25, 1, 0.5, 1)";
    duration = Math.round(duration * 1.2);
  } else if (context.visualStyle === "brutalist") {
    easing = "steps(2, jump-end)";
    duration = 80;
    springConfig = undefined;
  } else if (context.motionDNA === "snappy") {
    easing = "cubic-bezier(0.16, 1, 0.3, 1)";
    duration = Math.round(duration * 0.8);
    springConfig = { stiffness: 420, damping: 28, mass: 0.8 };
  } else if (context.motionDNA === "calm" || context.motionDNA === "cinematic") {
    easing = "easeInOutCubic";
    duration = Math.round(duration * 1.35);
    springConfig = { stiffness: 180, damping: 20, mass: 1.2 };
  }

  // 2. Material / Graphics Recommendation
  let materialEffect: MicrointeractionConfig["materialEffect"] = "none";
  if (context.visualStyle === "skeuomorphic") {
    materialEffect = "metallic";
  } else if (context.visualStyle === "glassmorphic") {
    materialEffect = "glass";
  } else if (category === "card" || category === "surface") {
    materialEffect = "shadow";
  }

  // 3. Performance / Device Tier Checks
  if (context.deviceTier === "low") {
    score -= 10;
    springConfig = undefined; // prefer pure CSS easing on low-tier hardware
    warnings.push("Device tier 'low' active: spring physics disabled in favor of cubic-bezier easing.");
  }

  // 4. Reduced-Motion Adaptation
  const isReduced = context.reducedMotion ?? false;
  let activeProperties = base.properties;

  const reducedMotionConfig: MicrointeractionConfig = {
    properties: {
      opacity: base.properties.opacity ?? [0.7, 1],
    },
    duration: Math.min(100, duration),
    easing: "ease-out",
    materialEffect: "none",
  };

  if (isReduced) {
    score -= 10;
    warnings.push("Reduced motion active: replaced dynamic translations/scales with opacity-only transitions.");
    activeProperties = reducedMotionConfig.properties;
    duration = reducedMotionConfig.duration;
    easing = reducedMotionConfig.easing!;
    springConfig = undefined;
  }

  const planConfig: MicrointeractionConfig = {
    properties: activeProperties,
    duration,
    easing,
    spring: springConfig,
    materialEffect,
    hapticFeedback: category === "button" || category === "toggle",
    ariaLive: toState === "error" ? "assertive" : toState === "success" ? "polite" : "off",
  };

  const plan: MicrointeractionPlan = {
    id: `micro-${category}-${toState}-${Date.now().toString(36)}`,
    name: `Microinteraction: ${category} ${toState}`,
    category,
    trigger: context.trigger ?? base.trigger,
    fromState,
    toState,
    feedbackType: base.feedbackType,
    config: planConfig,
    reducedMotionConfig,
    compatibilityScore: Math.max(0, Math.min(100, score)),
    explanation: `Selected '${base.feedbackType}' for '${category}' moving from '${fromState}' to '${toState}'.`,
    respectReducedMotion: true,
  };

  // 5. Build Alternatives
  const alternativeStates: InteractionState[] = toState === "press"
    ? ["hover", "focus"]
    : toState === "hover"
    ? ["press", "focus-visible"]
    : ["idle", "active"];

  const alternatives: MicrointeractionPlan[] = alternativeStates.map((altState) => {
    const altBase = resolveBaseFeedback(category, altState);
    return {
      id: `micro-alt-${category}-${altState}`,
      name: `Alternative: ${category} ${altState}`,
      category,
      trigger: altBase.trigger,
      fromState,
      toState: altState,
      feedbackType: altBase.feedbackType,
      config: {
        properties: altBase.properties,
        duration: altBase.duration,
        easing: "ease-out",
      },
      reducedMotionConfig,
      compatibilityScore: Math.max(0, score - 15),
      explanation: `Alternative interaction state '${altState}' for '${category}'.`,
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
