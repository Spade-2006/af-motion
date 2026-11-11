/**
 * AF Motion Choreography Intent Classification
 *
 * Deterministic natural-language interpretation of choreography intent,
 * identifying choreography patterns, participating rendering systems, and sequencing.
 */

import type {
  ChoreographyIntelligenceContext,
  ChoreographyPattern,
  ChoreographySystemType,
  ClassifiedChoreographyIntent,
} from "./types.js";

const SYSTEM_KEYWORDS: Record<ChoreographySystemType, readonly string[]> = {
  dom: ["dom", "html", "element", "ui", "text", "card", "button", "header"],
  graphics: ["graphics", "shader", "canvas", "particles", "post-processing", "fluid", "texture"],
  "3d": ["3d", "three", "camera", "mesh", "scene", "model", "orbit", "spatial"],
  "react-state": ["react", "state", "hook", "component state"],
  custom: ["custom", "audio", "haptic", "external"],
};

const PATTERN_KEYWORDS: Record<ChoreographyPattern, readonly string[]> = {
  "full-cross-system": [
    "full cross system",
    "dom graphics and 3d",
    "dom, graphics, and 3d",
    "cross system",
    "all systems",
  ],
  "dom-3d-sync": [
    "dom 3d sync",
    "dom and 3d",
    "ui over 3d scene",
    "camera pan with text",
    "3d sync with dom",
  ],
  "dom-graphics-sync": [
    "dom graphics sync",
    "ui and canvas",
    "graphics background sync",
    "dom and shader",
  ],
  "graphics-3d-sync": [
    "graphics and 3d",
    "post processing on 3d",
    "canvas shader with 3d",
  ],
  "scroll-choreography": [
    "scroll choreography",
    "scroll driven sequence",
    "story scrub",
    "scroll timeline",
  ],
  "interaction-choreography": [
    "interaction choreography",
    "click choreography",
    "hover sequence",
    "press trigger",
  ],
  "storytelling-sequence": [
    "storytelling",
    "narrative",
    "scene stages",
    "chapter",
    "cinematic story",
  ],
  "loading-completion": [
    "loading to completion",
    "progress finish",
    "success sequence",
    "load and resolve",
  ],
  "multi-element-entrance": [
    "multi element entrance",
    "staggered entrance",
    "enter cascade",
    "page reveal",
  ],
  "multi-element-exit": [
    "multi element exit",
    "exit sequence",
    "leave sequence",
    "dismiss all",
    "fade out cascade",
  ],
  staggered: ["staggered", "cascade", "stagger", "wave", "ripple sequence"],
  sequential: ["sequential", "sequence", "step by step", "one by one", "chain"],
  parallel: ["parallel", "together", "simultaneous", "all at once", "concurrence"],
};

function matchesWord(text: string, keyword: string): boolean {
  if (keyword.includes(" ") || keyword.includes("-")) {
    return text.includes(keyword);
  }
  const regex = new RegExp(`\\b${keyword}\\b`, "i");
  return regex.test(text);
}

/**
 * Classifies choreography intent from natural language or context.
 */
export function classifyChoreographyIntent(
  input: ChoreographyIntelligenceContext | string
): ClassifiedChoreographyIntent {
  const text = (typeof input === "string" ? input : input.intent ?? "").toLowerCase();
  const matchedKeywords: string[] = [];

  // Detect participating systems
  const detectedSystems = new Set<ChoreographySystemType>();
  if (typeof input !== "string" && input.systems && input.systems.length > 0) {
    for (const sys of input.systems) detectedSystems.add(sys);
  }

  if (text) {
    for (const [sys, words] of Object.entries(SYSTEM_KEYWORDS)) {
      for (const word of words) {
        if (matchesWord(text, word)) {
          detectedSystems.add(sys as ChoreographySystemType);
          matchedKeywords.push(word);
          break;
        }
      }
    }
  }

  if (detectedSystems.size === 0) {
    detectedSystems.add("dom");
  }

  // Detect choreography pattern
  let detectedPattern: ChoreographyPattern =
    typeof input !== "string" && input.pattern ? input.pattern : "multi-element-entrance";
  let patternFound = typeof input !== "string" && Boolean(input.pattern);

  if (!patternFound && text) {
    for (const [pat, words] of Object.entries(PATTERN_KEYWORDS)) {
      for (const word of words) {
        if (matchesWord(text, word)) {
          detectedPattern = pat as ChoreographyPattern;
          matchedKeywords.push(word);
          patternFound = true;
          break;
        }
      }
      if (patternFound) break;
    }
  }

  // If both DOM and 3D are present and pattern wasn't explicitly set
  if (!patternFound) {
    if (detectedSystems.has("dom") && detectedSystems.has("3d") && detectedSystems.has("graphics")) {
      detectedPattern = "full-cross-system";
    } else if (detectedSystems.has("dom") && detectedSystems.has("3d")) {
      detectedPattern = "dom-3d-sync";
    } else if (detectedSystems.has("dom") && detectedSystems.has("graphics")) {
      detectedPattern = "dom-graphics-sync";
    }
  }

  const confidence = matchedKeywords.length > 0 ? Math.min(0.95, 0.45 + matchedKeywords.length * 0.15) : 0.4;

  return {
    pattern: detectedPattern,
    detectedSystems: Object.freeze(Array.from(detectedSystems)),
    confidence,
    matchedKeywords: Object.freeze(matchedKeywords),
  };
}
