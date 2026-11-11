/**
 * AF Motion Intent Classification Engine
 *
 * Deterministic intent recognition mapping natural language, interaction context,
 * and component semantics to AF Motion's 12 core motion intents.
 */

import type {
  ClassifiedIntentResult,
  ComponentCategory,
  MotionIntent,
} from "./types.js";

interface IntentRule {
  readonly intent: MotionIntent;
  readonly keywords: readonly string[];
  readonly weight: number;
}

const INTENT_RULES: readonly IntentRule[] = [
  {
    intent: "attention",
    keywords: [
      "attention",
      "notice",
      "alert",
      "call to action",
      "cta",
      "look here",
      "highlight",
      "pulse",
      "wiggle",
      "badge",
      "urgent",
    ],
    weight: 1.0,
  },
  {
    intent: "feedback",
    keywords: [
      "feedback",
      "click",
      "press",
      "tap",
      "response",
      "confirm",
      "acknowledge",
      "success",
      "error",
      "shake",
      "reject",
      "action",
    ],
    weight: 1.0,
  },
  {
    intent: "navigation",
    keywords: [
      "navigation",
      "nav",
      "route",
      "page",
      "tab",
      "drawer",
      "breadcrumb",
      "forward",
      "back",
      "next",
      "menu item",
    ],
    weight: 1.0,
  },
  {
    intent: "disclosure",
    keywords: [
      "disclosure",
      "expand",
      "collapse",
      "accordion",
      "dropdown",
      "modal",
      "dialog",
      "open",
      "close",
      "reveal",
      "sheet",
    ],
    weight: 1.0,
  },
  {
    intent: "emphasis",
    keywords: [
      "emphasis",
      "focal",
      "accent",
      "pop",
      "scale up",
      "stand out",
      "elevate",
      "featured",
      "priority",
    ],
    weight: 1.0,
  },
  {
    intent: "celebration",
    keywords: [
      "celebration",
      "celebrate",
      "victory",
      "complete",
      "achievement",
      "trophy",
      "success confetti",
      "win",
      "hurray",
      "burst",
    ],
    weight: 1.2,
  },
  {
    intent: "loading",
    keywords: [
      "loading",
      "loader",
      "spinner",
      "waiting",
      "buffering",
      "skeleton",
      "shimmer",
      "placeholder",
      "fetch",
    ],
    weight: 1.0,
  },
  {
    intent: "progress",
    keywords: [
      "progress",
      "percentage",
      "step",
      "advancing",
      "meter",
      "gauge",
      "milestone",
      "completion",
      "timeline step",
    ],
    weight: 1.0,
  },
  {
    intent: "discovery",
    keywords: [
      "discovery",
      "tooltip",
      "hint",
      "peek",
      "guide",
      "onboarding",
      "tutorial",
      "help",
      "inspect",
    ],
    weight: 1.0,
  },
  {
    intent: "transition",
    keywords: [
      "transition",
      "morph",
      "crossfade",
      "dissolve",
      "swap",
      "switch",
      "state change",
      "view swap",
    ],
    weight: 1.0,
  },
  {
    intent: "storytelling",
    keywords: [
      "storytelling",
      "narrative",
      "scroll reveal",
      "sequence",
      "chapter",
      "cinematic",
      "walkthrough",
      "parallax",
    ],
    weight: 1.1,
  },
  {
    intent: "ambient",
    keywords: [
      "ambient",
      "subtle",
      "floating",
      "background",
      "breathing",
      "drift",
      "glow",
      "idle",
      "aura",
      "gentle",
    ],
    weight: 1.0,
  },
];

const COMPONENT_DEFAULT_INTENTS: Record<ComponentCategory, MotionIntent> = {
  button: "feedback",
  card: "disclosure",
  navigation: "navigation",
  modal: "disclosure",
  menu: "disclosure",
  form: "feedback",
  media: "emphasis",
  typography: "transition",
  chart: "progress",
  background: "ambient",
  "3d-object": "storytelling",
  custom: "feedback",
};

/**
 * Classifies motion intent from a string description or partial context.
 */
export function classifyMotionIntent(
  input: string | { componentType?: ComponentCategory; intent?: MotionIntent; description?: string }
): ClassifiedIntentResult {
  if (typeof input === "object" && input.intent) {
    return {
      intent: input.intent,
      confidence: 1.0,
      matchedKeywords: [input.intent],
      inferredFromComponent: false,
    };
  }

  const text =
    typeof input === "string"
      ? input.toLowerCase()
      : (input.description ?? "").toLowerCase();

  const component = typeof input === "object" ? input.componentType : undefined;

  let bestIntent: MotionIntent | null = null;
  let maxScore = 0;
  let bestKeywords: string[] = [];

  for (const rule of INTENT_RULES) {
    let score = 0;
    const matched: string[] = [];

    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += rule.weight * (kw.length > 5 ? 1.5 : 1.0);
        matched.push(kw);
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestIntent = rule.intent;
      bestKeywords = matched;
    }
  }

  if (bestIntent && maxScore > 0) {
    const confidence = Math.min(1.0, 0.4 + maxScore * 0.2);
    return {
      intent: bestIntent,
      confidence: Number(confidence.toFixed(2)),
      matchedKeywords: bestKeywords,
      inferredFromComponent: false,
    };
  }

  // Fallback to component default
  if (component && COMPONENT_DEFAULT_INTENTS[component]) {
    const defaultIntent = COMPONENT_DEFAULT_INTENTS[component];
    return {
      intent: defaultIntent,
      confidence: 0.6,
      matchedKeywords: [`component-default:${component}`],
      inferredFromComponent: true,
    };
  }

  // Global default
  return {
    intent: "feedback",
    confidence: 0.3,
    matchedKeywords: [],
    inferredFromComponent: false,
  };
}
