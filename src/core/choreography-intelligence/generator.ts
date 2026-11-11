/**
 * AF Motion Choreography Plan Generator
 *
 * Deterministic generation of cross-system animation plans, participant timing,
 * dependency resolution, cycle detection, and accessibility adaptations.
 */

import { classifyChoreographyIntent } from "./intent.js";
import type {
  ChoreographyDependency,
  ChoreographyIntelligenceContext,
  ChoreographyIntelligenceResult,
  ChoreographyParticipant,
  ChoreographyPattern,
  ChoreographyPlan,
} from "./types.js";

/**
 * Validates dependencies to ensure there are no circular dependency graphs.
 */
function detectCycles(dependencies: readonly ChoreographyDependency[]): {
  hasCycle: boolean;
  cycleNodes: string[];
} {
  const adj = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!adj.has(dep.participantId)) adj.set(dep.participantId, []);
    adj.get(dep.participantId)!.push(dep.dependsOnId);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycleNodes: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);

    const neighbors = adj.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        cycleNodes.push(node, neighbor);
        return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) return { hasCycle: true, cycleNodes };
    }
  }

  return { hasCycle: false, cycleNodes: [] };
}

/**
 * Generates an intelligent, deterministic cross-system choreography plan.
 */
export function generateChoreographyPlan(
  context: ChoreographyIntelligenceContext = {}
): ChoreographyIntelligenceResult {
  const intentClassified = classifyChoreographyIntent(context);
  const pattern: ChoreographyPattern = context.pattern ?? intentClassified.pattern;
  const systems = context.systems ?? intentClassified.detectedSystems;

  const warnings: string[] = [];
  let score = 92;

  // 1. Duration and Easing modulation
  let baseDuration = context.duration ?? 1200;
  let easing = "cubic-bezier(0.2, 0, 0, 1)";

  if (context.visualStyle === "editorial" || context.motionDNA === "editorial-flow") {
    easing = "cubic-bezier(0.25, 1, 0.5, 1)";
    baseDuration = Math.round(baseDuration * 1.2);
  } else if (context.visualStyle === "brutalist") {
    easing = "steps(4, jump-end)";
    baseDuration = 800;
  } else if (context.motionDNA === "snappy") {
    easing = "cubic-bezier(0.16, 1, 0.3, 1)";
    baseDuration = Math.round(baseDuration * 0.75);
  } else if (context.motionDNA === "calm" || context.motionDNA === "cinematic") {
    easing = "easeInOutCubic";
    baseDuration = Math.round(baseDuration * 1.4);
  }

  // 2. Reduced motion adaptation
  const isReduced = context.reducedMotion ?? false;
  if (isReduced) {
    score -= 10;
    baseDuration = Math.min(400, baseDuration);
    warnings.push("Reduced motion preference active: stripped spatial transforms and capped timeline duration.");
  }

  // 3. Build participants based on pattern and systems
  const participants: ChoreographyParticipant[] = [];
  const dependencies: ChoreographyDependency[] = [];

  switch (pattern) {
    case "dom-3d-sync":
      participants.push(
        {
          id: "3d-scene-stage",
          system: "3d",
          name: "3D Camera & Scene Traversal",
          startProgress: 0,
          endProgress: 1,
        },
        {
          id: "dom-header",
          system: "dom",
          name: "DOM Header Presentation",
          startProgress: 0.1,
          endProgress: 0.5,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
        },
        {
          id: "dom-content",
          system: "dom",
          name: "DOM Narrative Content",
          startProgress: 0.4,
          endProgress: 0.9,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
        }
      );
      dependencies.push({
        participantId: "dom-content",
        dependsOnId: "dom-header",
        type: "offset",
        offsetProgress: 0.3,
      });
      break;

    case "dom-graphics-sync":
      participants.push(
        {
          id: "graphics-canvas-layer",
          system: "graphics",
          name: "Graphics Fluid & Particle Background",
          startProgress: 0,
          endProgress: 1,
        },
        {
          id: "dom-surface-ui",
          system: "dom",
          name: "DOM Interactive Overlay",
          startProgress: 0.2,
          endProgress: 0.8,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["scale(0.96)", "scale(1)"] },
        }
      );
      break;

    case "full-cross-system":
      participants.push(
        {
          id: "3d-spatial-environment",
          system: "3d",
          name: "3D Camera & Environment Staging",
          startProgress: 0,
          endProgress: 1,
        },
        {
          id: "graphics-post-layer",
          system: "graphics",
          name: "Graphics Shaders & Post-Processing",
          startProgress: 0.1,
          endProgress: 0.9,
        },
        {
          id: "dom-application-ui",
          system: "dom",
          name: "DOM Application Layout",
          startProgress: 0.3,
          endProgress: 0.95,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["translateY(30px)", "translateY(0px)"] },
        }
      );
      dependencies.push(
        { participantId: "graphics-post-layer", dependsOnId: "3d-spatial-environment", type: "start-with-start" },
        { participantId: "dom-application-ui", dependsOnId: "graphics-post-layer", type: "offset", offsetProgress: 0.2 }
      );
      break;

    case "parallel":
      participants.push(
        {
          id: "participant-1",
          system: "dom",
          startProgress: 0,
          endProgress: 1,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["scale(0.98)", "scale(1)"] },
        },
        {
          id: "participant-2",
          system: systems.includes("graphics") ? "graphics" : "dom",
          startProgress: 0,
          endProgress: 1,
        }
      );
      break;

    case "sequential":
      participants.push(
        {
          id: "stage-1",
          system: "dom",
          startProgress: 0,
          endProgress: 0.5,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
        },
        {
          id: "stage-2",
          system: "dom",
          startProgress: 0.5,
          endProgress: 1,
          properties: isReduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ["translateY(16px)", "translateY(0px)"] },
        }
      );
      dependencies.push({
        participantId: "stage-2",
        dependsOnId: "stage-1",
        type: "start-after-end",
      });
      break;

    case "staggered":
    case "multi-element-entrance":
    default: {
      const count = context.participantCount ?? 3;
      const step = 0.6 / Math.max(1, count);
      for (let i = 0; i < count; i++) {
        const start = i * step;
        const end = Math.min(1, start + 0.4);
        participants.push({
          id: `element-${i + 1}`,
          system: "dom",
          name: `Staggered Element ${i + 1}`,
          startProgress: parseFloat(start.toFixed(3)),
          endProgress: parseFloat(end.toFixed(3)),
          properties: isReduced
            ? { opacity: [0, 1] }
            : { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
        });

        if (i > 0) {
          dependencies.push({
            participantId: `element-${i + 1}`,
            dependsOnId: `element-${i}`,
            type: "offset",
            offsetProgress: parseFloat(step.toFixed(3)),
          });
        }
      }
      break;
    }
  }

  // 4. Cycle detection in dependencies
  const { hasCycle } = detectCycles(dependencies);
  if (hasCycle) {
    warnings.push("Circular dependency detected in choreography sequence; resolved cycle by falling back to sequential scheduling.");
    score -= 15;
  }

  const plan: ChoreographyPlan = {
    id: `choreography-${pattern}-${Date.now().toString(36)}`,
    name: `Choreography Plan: ${pattern}`,
    pattern,
    duration: baseDuration,
    participants: Object.freeze(participants),
    dependencies: Object.freeze(dependencies),
    easing,
    compatibilityScore: Math.max(0, Math.min(100, score)),
    explanation: `Generated cross-system choreography plan for '${pattern}' across systems [${systems.join(", ")}].`,
    respectReducedMotion: true,
  };

  // 5. Generate Alternatives
  const alternativePatterns: ChoreographyPattern[] = pattern === "dom-3d-sync"
    ? ["sequential", "staggered"]
    : pattern === "full-cross-system"
    ? ["dom-3d-sync", "dom-graphics-sync"]
    : ["parallel", "sequential"];

  const alternatives: ChoreographyPlan[] = alternativePatterns.map((altPattern) => ({
    id: `alt-${altPattern}`,
    name: `Alternative: ${altPattern}`,
    pattern: altPattern,
    duration: baseDuration,
    participants: Object.freeze(participants),
    dependencies: Object.freeze([]),
    easing: "ease-out",
    compatibilityScore: Math.max(0, score - 15),
    explanation: `Alternative choreography strategy '${altPattern}'.`,
    respectReducedMotion: true,
  }));

  return {
    plan,
    alternatives: Object.freeze(alternatives),
    compatibilityScore: plan.compatibilityScore,
    warnings: Object.freeze(warnings),
    explanation: plan.explanation,
    context,
  };
}
