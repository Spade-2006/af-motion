/**
 * AF Motion Scroll Intent Classifier
 *
 * Deterministic natural-language and context parser mapping user descriptions,
 * component contexts, and page structure to AF Motion's 8 core scroll animation types.
 */

import type {
  ClassifiedScrollIntent,
  ScrollAnimationType,
  ScrollIntelligenceContext,
} from "./types.js";

interface ScrollIntentRule {
  readonly type: ScrollAnimationType;
  readonly keywords: readonly string[];
  readonly weight: number;
}

const SCROLL_INTENT_RULES: readonly ScrollIntentRule[] = [
  {
    type: "parallax",
    keywords: [
      "parallax",
      "depth",
      "float",
      "layers",
      "background shift",
      "foreground speed",
      "differential speed",
    ],
    weight: 1.2,
  },
  {
    type: "sticky-story",
    keywords: [
      "sticky",
      "pin",
      "pinned",
      "story",
      "chapter",
      "scrollytelling",
      "fixed section",
      "station",
      "narrative stages",
    ],
    weight: 1.2,
  },
  {
    type: "reveal",
    keywords: [
      "reveal",
      "appear",
      "fade in",
      "slide up on scroll",
      "enter view",
      "show on scroll",
      "unveil",
    ],
    weight: 1.0,
  },
  {
    type: "progress-indicator",
    keywords: [
      "progress",
      "indicator",
      "reading bar",
      "meter",
      "scroll bar",
      "scroll track",
      "gauge",
      "completion bar",
    ],
    weight: 1.2,
  },
  {
    type: "stagger-sequence",
    keywords: [
      "stagger",
      "cascade",
      "sequence",
      "sequential",
      "grid on scroll",
      "cards cascading",
      "wave on scroll",
    ],
    weight: 1.1,
  },
  {
    type: "horizontal-section",
    keywords: [
      "horizontal",
      "side scroll",
      "horizontal gallery",
      "carousel on scroll",
      "lateral scroll",
      "pan horizontal",
    ],
    weight: 1.2,
  },
  {
    type: "scroll-typography",
    keywords: [
      "typography",
      "text highlight",
      "reading text",
      "words reveal",
      "headline scroll",
      "scramble on scroll",
    ],
    weight: 1.1,
  },
  {
    type: "scroll-3d-sync",
    keywords: [
      "3d",
      "spatial",
      "camera",
      "model",
      "canvas",
      "orbit on scroll",
      "scene sync",
      "3d narrative",
    ],
    weight: 1.3,
  },
];

/**
 * Classifies scroll animation intent from a prompt or context.
 */
export function classifyScrollIntent(
  input: string | Partial<ScrollIntelligenceContext>
): ClassifiedScrollIntent {
  if (typeof input === "object" && input.type) {
    return {
      type: input.type,
      confidence: 1.0,
      matchedKeywords: [input.type],
    };
  }

  const text =
    typeof input === "string"
      ? input.toLowerCase()
      : (input.intent ?? "").toLowerCase();

  const component = typeof input === "object" ? input.componentType : undefined;

  let bestType: ScrollAnimationType | null = null;
  let maxScore = 0;
  let bestKeywords: string[] = [];

  for (const rule of SCROLL_INTENT_RULES) {
    let score = 0;
    const matched: string[] = [];

    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += rule.weight * (kw.length > 6 ? 1.5 : 1.0);
        matched.push(kw);
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestType = rule.type;
      bestKeywords = matched;
    }
  }

  if (bestType && maxScore > 0) {
    const confidence = Math.min(1.0, 0.4 + maxScore * 0.2);
    return {
      type: bestType,
      confidence: Number(confidence.toFixed(2)),
      matchedKeywords: bestKeywords,
    };
  }

  // Fallbacks by component category
  if (component === "typography") {
    return { type: "scroll-typography", confidence: 0.7, matchedKeywords: ["component:typography"] };
  }
  if (component === "3d-object") {
    return { type: "scroll-3d-sync", confidence: 0.8, matchedKeywords: ["component:3d-object"] };
  }
  if (component === "background") {
    return { type: "parallax", confidence: 0.7, matchedKeywords: ["component:background"] };
  }
  if (component === "chart") {
    return { type: "progress-indicator", confidence: 0.6, matchedKeywords: ["component:chart"] };
  }

  // Universal default
  return {
    type: "reveal",
    confidence: 0.4,
    matchedKeywords: [],
  };
}
