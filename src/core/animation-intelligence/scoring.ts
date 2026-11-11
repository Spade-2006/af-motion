/**
 * AF Motion Deterministic Scoring & Recommendation Engine
 *
 * Evaluates candidate animations across component affinity, motion intent,
 * visual style, Motion DNA, performance constraints, and accessibility requirements.
 */

import type { AnimatableProperties } from "../animate.js";
import type {
  AccessibilityCompatibility,
  AnimationFamily,
  AnimationRecommendation,
  AnimationSelectionContext,
  AnimationTrigger,
  ComponentCategory,
  MotionIntent,
  PerformanceSuitability,
  SelectionRationale,
} from "./types.js";

interface CandidateBlueprint {
  readonly id: string;
  readonly name: string;
  readonly family: AnimationFamily;
  readonly presetId?: string;
  readonly defaultProperties: AnimatableProperties;
  readonly baseDuration: number;
  readonly defaultEasing: string;
  readonly applicableTriggers: readonly AnimationTrigger[];
  readonly primaryIntents: readonly MotionIntent[];
  readonly componentAffinities: Readonly<Partial<Record<ComponentCategory, number>>>;
  readonly styleAffinities: Readonly<Record<string, number>>;
  readonly compositeOnly: boolean;
  readonly reducedMotionFallback: string;
}

const BLUEPRINTS: readonly CandidateBlueprint[] = [
  // 1. Hover Lift (Elevate on interaction)
  {
    id: "rec-lift-elevation",
    name: "Tactile Hover Lift",
    family: "lift",
    presetId: "preset-hover-lift",
    defaultProperties: {
      transform: ["translateY(0px)", "translateY(-4px)"],
      boxShadow: [
        "0 1px 3px rgba(0,0,0,0.1)",
        "0 10px 20px rgba(0,0,0,0.15)",
      ],
    },
    baseDuration: 220,
    defaultEasing: "easeOutCubic",
    applicableTriggers: ["hover", "focus", "interaction"],
    primaryIntents: ["feedback", "emphasis", "attention"],
    componentAffinities: { button: 1.3, card: 1.4, navigation: 1.0, media: 1.1 },
    styleAffinities: {
      skeuomorphism: 1.4,
      neumorphism: 1.3,
      "paper-cutout": 1.4,
      brutalism: 0.8,
      "mid-century-modern": 1.1,
    },
    compositeOnly: false,
    reducedMotionFallback: "opacity-only",
  },
  // 2. Press Depress / Sink
  {
    id: "rec-press-depress",
    name: "Tactile Press Response",
    family: "scale",
    presetId: "preset-click-press",
    defaultProperties: {
      transform: ["scale(1)", "scale(0.96)"],
    },
    baseDuration: 120,
    defaultEasing: "easeOutQuad",
    applicableTriggers: ["press", "interaction"],
    primaryIntents: ["feedback", "attention"],
    componentAffinities: { button: 1.5, card: 1.2, form: 1.3, navigation: 1.1 },
    styleAffinities: {
      skeuomorphism: 1.5,
      neumorphism: 1.4,
      "3d-inflated": 1.3,
      brutalism: 1.2,
      memphis: 1.2,
    },
    compositeOnly: true,
    reducedMotionFallback: "instant",
  },
  // 3. Gentle Fade & Slide Up (Entrance)
  {
    id: "rec-fade-slide-up",
    name: "Smooth Rise Entrance",
    family: "slide",
    presetId: "preset-slide-up",
    defaultProperties: {
      opacity: [0, 1],
      transform: ["translateY(16px)", "translateY(0px)"],
    },
    baseDuration: 350,
    defaultEasing: "easeOutCubic",
    applicableTriggers: ["entrance"],
    primaryIntents: ["disclosure", "navigation", "transition", "storytelling"],
    componentAffinities: {
      card: 1.4,
      modal: 1.3,
      navigation: 1.3,
      typography: 1.4,
      chart: 1.2,
      media: 1.2,
    },
    styleAffinities: {
      minimal: 1.4,
      bauhaus: 1.3,
      "mid-century-modern": 1.3,
      brutalism: 1.0,
      cyber: 1.1,
    },
    compositeOnly: true,
    reducedMotionFallback: "fade-only",
  },
  // 4. Zoom / Scale In Entrance
  {
    id: "rec-zoom-entrance",
    name: "Focal Scale Entrance",
    family: "scale",
    presetId: "preset-scale-in",
    defaultProperties: {
      opacity: [0, 1],
      transform: ["scale(0.92)", "scale(1)"],
    },
    baseDuration: 280,
    defaultEasing: "easeOutCubic",
    applicableTriggers: ["entrance"],
    primaryIntents: ["disclosure", "emphasis", "attention"],
    componentAffinities: { modal: 1.5, menu: 1.4, card: 1.2, button: 1.1 },
    styleAffinities: {
      "3d-inflated": 1.4,
      memphis: 1.3,
      skeuomorphism: 1.2,
      glitch: 1.1,
    },
    compositeOnly: true,
    reducedMotionFallback: "fade-only",
  },
  // 5. Fade Out & Slide Down (Exit)
  {
    id: "rec-fade-slide-exit",
    name: "Graceful Exit Dissolve",
    family: "fade",
    presetId: "preset-fade-out",
    defaultProperties: {
      opacity: [1, 0],
      transform: ["translateY(0px)", "translateY(12px)"],
    },
    baseDuration: 220,
    defaultEasing: "easeInCubic",
    applicableTriggers: ["exit"],
    primaryIntents: ["transition", "disclosure"],
    componentAffinities: { modal: 1.4, menu: 1.4, card: 1.2, navigation: 1.1 },
    styleAffinities: { minimal: 1.3, bauhaus: 1.2 },
    compositeOnly: true,
    reducedMotionFallback: "instant",
  },
  // 6. Pulse Attention
  {
    id: "rec-pulse-attention",
    name: "Rhythmic Pulse Accent",
    family: "pulse",
    presetId: "preset-pulse-attention",
    defaultProperties: {
      transform: ["scale(1)", "scale(1.08)", "scale(1)"],
    },
    baseDuration: 600,
    defaultEasing: "easeInOutSine",
    applicableTriggers: ["interaction", "continuous", "hover"],
    primaryIntents: ["attention", "celebration", "emphasis"],
    componentAffinities: { button: 1.4, media: 1.2, chart: 1.3, typography: 1.1 },
    styleAffinities: {
      memphis: 1.4,
      "liquid-chrome": 1.3,
      psychedelic: 1.4,
      vaporwave: 1.3,
    },
    compositeOnly: true,
    reducedMotionFallback: "opacity-only",
  },
  // 7. Error Shake
  {
    id: "rec-shake-error",
    name: "Feedback Error Shake",
    family: "shake",
    presetId: "preset-shake-error",
    defaultProperties: {
      transform: [
        "translateX(0px)",
        "translateX(-6px)",
        "translateX(6px)",
        "translateX(-4px)",
        "translateX(4px)",
        "translateX(0px)",
      ],
    },
    baseDuration: 400,
    defaultEasing: "easeInOutQuad",
    applicableTriggers: ["interaction"],
    primaryIntents: ["feedback", "attention"],
    componentAffinities: { form: 1.6, button: 1.3, modal: 1.1 },
    styleAffinities: {
      brutalism: 1.4,
      glitch: 1.5,
      grunge: 1.4,
      "anti-design": 1.4,
    },
    compositeOnly: true,
    reducedMotionFallback: "flash-color",
  },
  // 8. Glow Focus Accent
  {
    id: "rec-glow-focus",
    name: "Luminescent Focus Ring",
    family: "glow",
    presetId: "preset-hover-glow",
    defaultProperties: {
      boxShadow: [
        "0 0 0 0px rgba(59,130,246,0)",
        "0 0 0 4px rgba(59,130,246,0.5)",
      ],
    },
    baseDuration: 180,
    defaultEasing: "easeOutQuad",
    applicableTriggers: ["focus", "hover"],
    primaryIntents: ["feedback", "emphasis", "attention"],
    componentAffinities: { form: 1.5, button: 1.3, card: 1.1 },
    styleAffinities: {
      vaporwave: 1.4,
      cyber: 1.5,
      "liquid-chrome": 1.4,
      psychedelic: 1.3,
    },
    compositeOnly: false,
    reducedMotionFallback: "high-contrast-outline",
  },
  // 9. Floating Ambient Drift
  {
    id: "rec-ambient-float",
    name: "Ambient Floating Drift",
    family: "float",
    presetId: "preset-ambient-float",
    defaultProperties: {
      transform: [
        "translateY(0px) rotate(0deg)",
        "translateY(-8px) rotate(1deg)",
        "translateY(0px) rotate(0deg)",
      ],
    },
    baseDuration: 4000,
    defaultEasing: "easeInOutSine",
    applicableTriggers: ["continuous"],
    primaryIntents: ["ambient", "storytelling", "discovery"],
    componentAffinities: {
      background: 1.6,
      "3d-object": 1.5,
      card: 1.2,
      media: 1.3,
    },
    styleAffinities: {
      "art-nouveau": 1.5,
      psychedelic: 1.4,
      vaporwave: 1.4,
      "liquid-chrome": 1.3,
      "mid-century-modern": 1.2,
    },
    compositeOnly: true,
    reducedMotionFallback: "static",
  },
  // 10. Shimmer Loading Progress
  {
    id: "rec-shimmer-progress",
    name: "Shimmer Progress Wave",
    family: "fade",
    defaultProperties: {
      opacity: [0.4, 0.9, 0.4],
    },
    baseDuration: 1200,
    defaultEasing: "easeInOutSine",
    applicableTriggers: ["continuous", "interaction"],
    primaryIntents: ["loading", "progress"],
    componentAffinities: {
      card: 1.4,
      form: 1.4,
      typography: 1.3,
      chart: 1.5,
      media: 1.3,
    },
    styleAffinities: { minimal: 1.3, skeuomorphism: 1.1 },
    compositeOnly: true,
    reducedMotionFallback: "static-pulse",
  },
  // 11. Joyful Bounce Celebration
  {
    id: "rec-celebration-bounce",
    name: "Joyful Celebration Pop",
    family: "bounce",
    presetId: "preset-click-bounce",
    defaultProperties: {
      transform: [
        "scale(1)",
        "scale(1.25)",
        "scale(0.92)",
        "scale(1.08)",
        "scale(1)",
      ],
    },
    baseDuration: 550,
    defaultEasing: "easeOutBack",
    applicableTriggers: ["interaction", "entrance"],
    primaryIntents: ["celebration", "emphasis", "attention"],
    componentAffinities: { button: 1.4, card: 1.3, media: 1.2, chart: 1.3 },
    styleAffinities: {
      memphis: 1.5,
      "3d-inflated": 1.5,
      playful: 1.4,
      psychedelic: 1.2,
    },
    compositeOnly: true,
    reducedMotionFallback: "subtle-scale",
  },
  // 12. 3D Tilt Parallax
  {
    id: "rec-tilt-perspective",
    name: "Spatial Tilt Response",
    family: "tilt",
    presetId: "preset-hover-tilt-subtle",
    defaultProperties: {
      transform: [
        "perspective(800px) rotateX(0deg) rotateY(0deg)",
        "perspective(800px) rotateX(4deg) rotateY(-4deg)",
      ],
    },
    baseDuration: 240,
    defaultEasing: "easeOutQuad",
    applicableTriggers: ["hover", "interaction"],
    primaryIntents: ["feedback", "discovery", "storytelling"],
    componentAffinities: { card: 1.5, media: 1.4, "3d-object": 1.5 },
    styleAffinities: {
      isometric: 1.5,
      "3d-inflated": 1.4,
      skeuomorphism: 1.3,
      steampunk: 1.2,
    },
    compositeOnly: true,
    reducedMotionFallback: "fade-only",
  },
];

/**
 * Deterministically scores candidate animations for a context.
 */
export function scoreCandidates(
  context: AnimationSelectionContext
): readonly AnimationRecommendation[] {
  const trigger = context.trigger ?? inferDefaultTrigger(context.intent);
  const visualStyle = context.visualStyle ?? "minimal";

  const scored: AnimationRecommendation[] = [];

  for (const bp of BLUEPRINTS) {
    // 1. Trigger compatibility check
    if (!bp.applicableTriggers.includes(trigger)) {
      continue;
    }

    let rawScore = 50; // base score

    // 2. Intent affinity
    if (bp.primaryIntents[0] === context.intent) {
      rawScore += 35;
    } else if (bp.primaryIntents.includes(context.intent)) {
      rawScore += 20;
    } else {
      rawScore -= 10;
    }

    // 3. Component affinity
    const compMultiplier = bp.componentAffinities[context.componentType] ?? 1.0;
    rawScore *= compMultiplier;

    // 4. Visual style alignment
    const styleMultiplier = bp.styleAffinities[visualStyle] ?? 1.0;
    rawScore *= styleMultiplier;

    // 5. Motion DNA alignment
    const dnaPersonality =
      typeof context.motionDNA === "object"
        ? context.motionDNA.personality
        : (context.motionDNA as string | undefined);

    let durationMultiplier = 1.0;
    let selectedEasing = bp.defaultEasing;

    if (dnaPersonality === "snappy") {
      durationMultiplier = 0.75;
      selectedEasing = "easeOutQuad";
      if (bp.family === "scale" || bp.family === "lift") rawScore += 8;
    } else if (dnaPersonality === "energetic" || dnaPersonality === "playful") {
      durationMultiplier = 1.1;
      selectedEasing = "easeOutBack";
      if (bp.family === "bounce" || bp.family === "pulse") rawScore += 12;
    } else if (dnaPersonality === "calm") {
      durationMultiplier = 1.35;
      selectedEasing = "easeInOutSine";
      if (bp.family === "fade" || bp.family === "float") rawScore += 10;
      if (bp.family === "shake" || bp.family === "bounce") rawScore -= 15;
    } else if (dnaPersonality === "cinematic") {
      durationMultiplier = 1.6;
      selectedEasing = "easeInOutCubic";
      if (bp.family === "slide" || bp.family === "fade" || bp.family === "tilt") rawScore += 10;
    } else if (dnaPersonality === "minimal") {
      durationMultiplier = 0.85;
      selectedEasing = "easeOutCubic";
      if (bp.family === "fade" || bp.family === "slide") rawScore += 10;
      if (bp.family === "shake" || bp.family === "bounce") rawScore -= 20;
    }

    // 6. Performance suitability
    const tier = context.deviceTier ?? "high";
    const gpuAccelerated = bp.compositeOnly;
    const compositeOnly = bp.compositeOnly;

    let estimatedFpsImpact: PerformanceSuitability["estimatedFpsImpact"] = "negligible";
    if (!compositeOnly) {
      estimatedFpsImpact = "low";
      if (tier === "low") {
        rawScore -= 15;
        estimatedFpsImpact = "moderate";
      }
    }

    // 7. Reduced-Motion
    const reducedMotion = context.reducedMotion ?? false;
    if (reducedMotion) {
      if (bp.family === "shake" || bp.family === "bounce" || bp.family === "float") {
        rawScore -= 35; // Heavy penalization for vestibular disturbance
      } else if (bp.family === "fade") {
        rawScore += 15; // Prefers gentle fade
      }
    }

    // Normalized compatibility score: 0 to 100
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Rationale construction
    const rationale: SelectionRationale = {
      intentMatch: `Matched '${context.intent}' with ${bp.family} family pattern.`,
      componentContext: `Optimal for ${context.componentType} (affinity factor: ${compMultiplier}x).`,
      styleAlignment: `Aligned with '${visualStyle}' design language (${styleMultiplier}x multiplier).`,
      dnaInfluence: dnaPersonality ? `Adjusted pacing for Motion DNA personality '${dnaPersonality}'.` : "Standard timing applied.",
      summary: `Recommended ${bp.name} for ${context.componentType} under ${context.intent} intent.`,
    };

    const performanceSuitability: PerformanceSuitability = {
      hardwareTier: tier,
      gpuAccelerated,
      compositeOnly,
      estimatedFpsImpact,
    };

    const accessibilityCompatibility: AccessibilityCompatibility = {
      supportsReducedMotion: true,
      reducedMotionFallback: bp.reducedMotionFallback,
      screenReaderSafe: true,
      highContrastSafe: true,
    };

    const duration = Math.round(bp.baseDuration * durationMultiplier);

    (scored as any).push({
      _rawScore: rawScore,
      id: bp.id,
      name: bp.name,
      family: bp.family,
      presetId: bp.presetId,
      properties: bp.defaultProperties,
      duration,
      delay: 0,
      easing: selectedEasing,
      trigger,
      intent: context.intent,
      componentType: context.componentType,
      compatibilityScore: finalScore,
      performanceSuitability,
      accessibilityCompatibility,
      selectionRationale: rationale,
    });
  }

  // Sort descending by compatibility score (tie-breaking with un-clamped raw score)
  scored.sort((a, b) => {
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore;
    }
    return ((b as any)._rawScore ?? 0) - ((a as any)._rawScore ?? 0);
  });
  return scored;
}

/**
 * Detects potential conflicts with existing animations.
 */
export function detectAnimationConflicts(
  candidate: AnimationRecommendation,
  existingAnimations?: readonly string[]
): readonly string[] {
  const warnings: string[] = [];
  if (!existingAnimations || existingAnimations.length === 0) {
    return warnings;
  }

  const candidateProps = Object.keys(candidate.properties);

  for (const existing of existingAnimations) {
    const existingLower = existing.toLowerCase();
    if (candidateProps.includes("transform") && existingLower.includes("transform")) {
      warnings.push(
        `Potential transform collision: candidate overrides active '${existing}' transform matrix.`
      );
    }
    if (candidate.family === "float" && existingLower.includes("pulse")) {
      warnings.push("Simultaneous continuous animations (float + pulse) may cause visual jitter.");
    }
    if (candidate.trigger === "press" && existingLower.includes("hover")) {
      warnings.push("Hover elevation may conflict with press sink if not coordinated.");
    }
  }

  return warnings;
}

function inferDefaultTrigger(intent: MotionIntent): AnimationTrigger {
  switch (intent) {
    case "feedback":
      return "interaction";
    case "attention":
      return "interaction";
    case "disclosure":
    case "navigation":
    case "transition":
      return "entrance";
    case "ambient":
    case "loading":
    case "progress":
      return "continuous";
    case "emphasis":
    case "discovery":
      return "hover";
    case "celebration":
      return "interaction";
    case "storytelling":
      return "entrance";
    default:
      return "interaction";
  }
}
