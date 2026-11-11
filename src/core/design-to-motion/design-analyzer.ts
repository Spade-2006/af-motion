/**
 * AF Motion Design-to-Motion Analysis Engine (Prompt 142)
 *
 * Evaluates element hierarchy, visual importance, interactive capabilities,
 * repeated groupings, accessibility constraints, and maps design characteristics
 * to semantic motion intent using Prompt 141 AI Motion Intelligence.
 */

import type {
  NormalizedDesignInput,
} from "./input-parser.js";
import type {
  DesignAnalysisResult,
  AnalyzedDesignElement,
  DesignStructuredElement,
  DesignInteractionCapability,
} from "./types.js";
import type { AIMotionIntentType } from "../ai-motion-intelligence/types.js";

/**
 * Analyzes the normalized design specification and infers motion requirements.
 */
export function analyzeDesignSpecification(normalized: NormalizedDesignInput): DesignAnalysisResult {
  const { specification, tokens, rawPrompt } = normalized;
  const elements = specification.elements;
  const evidence: string[] = [];
  const warnings: string[] = [...normalized.validationIssues];

  // 1. Build Parent-Child Hierarchy Maps
  const elementMap = new Map<string, DesignStructuredElement>();
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();

  for (const el of elements) {
    elementMap.set(el.id, el);
    childrenMap.set(el.id, []);
  }

  for (const el of elements) {
    if (el.parentId && elementMap.has(el.parentId)) {
      parentMap.set(el.id, el.parentId);
      childrenMap.get(el.parentId)?.push(el.id);
    }
  }

  const rootIds = elements.filter((el) => !el.parentId || !elementMap.has(el.parentId)).map((el) => el.id);

  // 2. Detect Groups & Repeated Components
  const typeCounts = new Map<string, number>();
  for (const el of elements) {
    typeCounts.set(el.type, (typeCounts.get(el.type) || 0) + 1);
  }

  const groups: Array<{
    parentId: string;
    childIds: string[];
    sequenceType: "stagger" | "parallel" | "sequential";
  }> = [];

  for (const [parentId, childIds] of childrenMap.entries()) {
    if (childIds.length > 1) {
      const parent = elementMap.get(parentId);
      const isGridOrList = parent?.type === "grid" || parent?.type === "list" || parent?.type === "navigation";
      groups.push({
        parentId,
        childIds,
        sequenceType: isGridOrList ? "stagger" : "sequential",
      });
      evidence.push(`Identified multi-child group under '${parentId}' with ${childIds.length} items (${isGridOrList ? "staggered" : "sequential"}).`);
    }
  }

  // Calculate maximum tree depth
  let maxDepth = 1;
  function getDepth(id: string): number {
    const parentId = parentMap.get(id);
    return parentId ? 1 + getDepth(parentId) : 1;
  }
  for (const el of elements) {
    const d = getDepth(el.id);
    if (d > maxDepth) maxDepth = d;
  }

  // 3. Analyze Each Element
  const analyzedElements: AnalyzedDesignElement[] = elements.map((el) => {
    const isInteractive = Boolean(
      (el.interactionCapabilities && el.interactionCapabilities.length > 0) ||
      el.type === "button" ||
      el.type === "input" ||
      el.semanticRole === "trigger"
    );

    const isRepeated = (typeCounts.get(el.type) || 0) > 1;
    const isGroupParent = (childrenMap.get(el.id)?.length || 0) > 0;

    let visualWeight = 0.5;
    if (el.importance === "high") visualWeight = 0.9;
    else if (el.importance === "medium") visualWeight = 0.6;
    else if (el.importance === "low") visualWeight = 0.3;
    else if (el.importance === "background") visualWeight = 0.1;

    // Inferred Suggested Entrance & Exit
    let suggestedEntrance = "fade-slide-up";
    let suggestedExit = "fade-slide-down";

    if (el.type === "modal" || el.type === "dialog") {
      suggestedEntrance = "scale-fade-decelerate";
      suggestedExit = "scale-fade-accelerate";
    } else if (el.type === "button" || el.type === "badge") {
      suggestedEntrance = "scale-pop";
      suggestedExit = "fade-out";
    } else if (el.type === "navigation" || el.type === "header") {
      suggestedEntrance = "slide-down-reveal";
      suggestedExit = "slide-up-hide";
    } else if (el.type === "hero") {
      suggestedEntrance = "cinematic-staggered-reveal";
      suggestedExit = "gentle-fade";
    }

    // Suggested Interaction Capabilities
    const suggestedInteractions: DesignInteractionCapability[] = el.interactionCapabilities
      ? [...el.interactionCapabilities]
      : [];

    if (isInteractive && suggestedInteractions.length === 0) {
      suggestedInteractions.push("hover", "press");
    }

    // Constraints
    const constraints: string[] = [];
    if (tokens.reducedMotion) {
      constraints.push("prefers-reduced-motion: replace translation/scale with subtle opacity transitions");
    }
    if (el.importance === "background") {
      constraints.push("low-priority: maintain minimal duration and non-distracting easing");
    }

    return {
      id: el.id,
      type: el.type,
      role: el.semanticRole || (isInteractive ? "trigger" : "surface"),
      visualWeight,
      isInteractive,
      isGroupParent,
      isRepeated,
      suggestedEntrance,
      suggestedExit,
      suggestedInteractions,
      constraints,
    };
  });

  // 4. Inferred Global Motion Intent
  const { intent, confidence } = inferIntentFromAnalysis(specification, analyzedElements, rawPrompt);
  evidence.push(`Inferred primary motion intent: '${intent}' with ${Math.round(confidence * 100)}% confidence.`);

  return {
    analyzedElements,
    hierarchy: {
      rootIds,
      depth: maxDepth,
      groups,
    },
    inferredIntent: intent,
    intentConfidence: confidence,
    evidence,
    warnings,
  };
}

/**
 * Deterministically infers motion intent from structured characteristics & prompt.
 */
function inferIntentFromAnalysis(
  spec: { title: string; elements: readonly DesignStructuredElement[] },
  analyzed: readonly AnalyzedDesignElement[],
  rawPrompt?: string
): { intent: AIMotionIntentType; confidence: number } {
  const p = (rawPrompt || "").toLowerCase();
  const title = spec.title.toLowerCase();

  if (p.includes("tactile") || p.includes("click") || p.includes("press") || p.includes("feedback")) {
    return { intent: "feedback", confidence: 0.94 };
  }
  if (p.includes("modal") || p.includes("dialog") || p.includes("entrance") || p.includes("reveal")) {
    return { intent: "entrance", confidence: 0.92 };
  }
  if (p.includes("scroll") || p.includes("storytelling") || p.includes("section")) {
    return { intent: "scroll-storytelling", confidence: 0.88 };
  }
  if (p.includes("ambient") || p.includes("particle") || p.includes("background")) {
    return { intent: "ambient", confidence: 0.9 };
  }
  if (p.includes("morph") || p.includes("svg") || p.includes("shape")) {
    return { intent: "morphing", confidence: 0.89 };
  }
  if (p.includes("nav") || p.includes("drawer") || p.includes("menu")) {
    return { intent: "navigation", confidence: 0.91 };
  }

  // Structural inference
  const hasModal = analyzed.some((a) => a.type === "modal" || a.type === "dialog");
  if (hasModal) return { intent: "entrance", confidence: 0.85 };

  const onlyInteractiveButtons = analyzed.every((a) => a.type === "button") && analyzed.length > 0;
  if (onlyInteractiveButtons) return { intent: "feedback", confidence: 0.86 };

  const hasRepeatedCards = analyzed.some((a) => a.isRepeated && (a.type === "card" || a.type === "grid"));
  if (hasRepeatedCards) return { intent: "entrance", confidence: 0.84 };

  if (title.includes("hero") || title.includes("landing")) {
    return { intent: "entrance", confidence: 0.82 };
  }

  return { intent: "entrance", confidence: 0.75 };
}
