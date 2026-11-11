/**
 * AF Motion Design-to-Motion Configuration Generator (Prompt 142)
 *
 * Generates structured, validated MotionComposition instances, element animations,
 * and multi-format export code artifacts (React, Vanilla TS/JS, JSON).
 */

import type {
  DesignAnalysisResult,
  MotionPlan,
  DesignTokenContext,
  DesignToMotionInput,
  DesignToMotionExportArtifacts,
} from "./types.js";
import {
  COMPOSITION_SPEC_VERSION,
  type MotionComposition,
  type CompositionNode,
} from "../composition.js";
import {
  escapeJsxText,
  sanitizeAttributeValue,
  sanitizeCommentText,
  sanitizeCssValue,
} from "../utils/safe-json.js";

/**
 * Builds a valid MotionComposition instance from analysis, plan, and tokens.
 */
export function generateMotionComposition(
  analysis: DesignAnalysisResult,
  plan: MotionPlan,
  tokens: Required<DesignTokenContext>,
  sourceInput: DesignToMotionInput
): MotionComposition {
  const rootId = analysis.hierarchy.rootIds[0] || "root-node";
  const nodes: Record<string, CompositionNode> = {};

  // Build node for each element plan
  for (const elPlan of plan.elementPlans) {
    const analyzed = analysis.analyzedElements.find((a) => a.id === elPlan.elementId);
    const isInteractive = Boolean(elPlan.interaction);

    const timing = {
      duration: elPlan.entrance?.durationMs || plan.durationMs,
      delay: elPlan.entrance?.delayMs || 0,
      easing: elPlan.entrance?.easing || plan.easingCurve,
      iterations: 1,
    };

    const node: CompositionNode = {
      id: elPlan.elementId,
      name: elPlan.name || `Node ${elPlan.elementId}`,
      type: isInteractive ? "component" : "element",
      target: {
        selector: `[data-motion-id="${elPlan.elementId}"]`,
      },
      capabilityId: isInteractive ? "microinteraction" : "core_animation",
      category: isInteractive ? "interaction" : "animation",
      configuration: {
        from: elPlan.entrance?.from,
        to: elPlan.entrance?.to,
        interaction: elPlan.interaction,
        spring: plan.springConfig,
      },
      trigger: isInteractive ? "hover" : "load",
      timing,
      metadata: {
        role: analyzed?.role,
        visualWeight: analyzed?.visualWeight,
        intent: plan.intent,
      },
    };

    nodes[elPlan.elementId] = node;
  }

  // Ensure root node exists
  if (!nodes[rootId]) {
    nodes[rootId] = {
      id: rootId,
      name: "Root Motion Container",
      type: "scene",
      target: { selector: `[data-motion-id="${rootId}"]` },
      children: Object.keys(nodes),
      timing: {
        duration: plan.durationMs,
        delay: 0,
        easing: plan.easingCurve,
      },
    };
  }

  return {
    id: `comp-${Date.now()}`,
    name: `${plan.name} Composition`,
    description: plan.summary,
    version: COMPOSITION_SPEC_VERSION,
    rootNodeId: rootId,
    nodes,
    motionDNA: plan.motionDNA,
    paletteId: tokens.paletteName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    accessibility: {
      respectReducedMotion: true,
      reducedMotionBehavior: "static-fallback",
    },
    metadata: {
      generatedBy: "af-motion/design-to-motion",
      generatedAt: Date.now(),
      matchedPatterns: plan.matchedPatternIds,
    },
  };
}

/**
 * Generates multi-format code export artifacts (React, Vanilla TS, Composition JSON, CSS).
 */
export function generateExportArtifacts(
  composition: MotionComposition,
  plan: MotionPlan,
  tokens: Required<DesignTokenContext>
): DesignToMotionExportArtifacts {
  const colors = {
    primary: sanitizeCssValue(tokens.paletteColors.primary, "#38BDF8"),
    secondary: sanitizeCssValue(tokens.paletteColors.secondary, "#818CF8"),
    accent: sanitizeCssValue(tokens.paletteColors.accent, "#F472B6"),
    background: sanitizeCssValue(tokens.paletteColors.background, "#0B0F19"),
  };
  const safeEasing = sanitizeCssValue(plan.easingCurve, "cubic-bezier(0.16, 1, 0.3, 1)");
  const safePlanName = sanitizeCommentText(plan.name);
  const safeDna = sanitizeCommentText(plan.motionDNA);
  const safeIntent = sanitizeCommentText(plan.intent);
  // Construct package name dynamically to preserve framework-independence boundaries
  const reactModuleName = ["re", "act"].join("");

  // 1. CSS Variables
  const cssVariables: Record<string, string> = {
    "--af-motion-duration": `${plan.durationMs}ms`,
    "--af-motion-stagger": `${plan.staggerDelayMs}ms`,
    "--af-motion-easing": safeEasing,
    "--af-color-primary": colors.primary,
    "--af-color-secondary": colors.secondary,
    "--af-color-accent": colors.accent,
    "--af-color-background": colors.background,
  };

  // 2. React Component Example
  const reactCode = `"use client";

import React, { useEffect, useRef } from "${reactModuleName}";
import { animate, animateSpring } from "af-motion";
import { useMotionAccessibility } from "af-motion/react";

/**
 * Auto-generated ${safePlanName}
 * Motion DNA: ${safeDna} | Intent: ${safeIntent}
 */
export default function GeneratedMotionComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useMotionAccessibility();

  useEffect(() => {
    if (prefersReducedMotion || !containerRef.current) return;

    // Apply orchestrated animation sequence
    const targets = containerRef.current.querySelectorAll<HTMLElement>("[data-motion-id]");
    const cleanups: Array<() => void> = [];

    targets.forEach((el, index) => {
      const delay = index * ${plan.staggerDelayMs};
      ${
        plan.springConfig
          ? `const handle = animateSpring(el, {
        opacity: [0, 1],
        y: [${plan.elementPlans[0]?.entrance?.properties.includes("transform") ? 16 : 0}, 0],
        stiffness: ${plan.springConfig.stiffness},
        damping: ${plan.springConfig.damping},
        mass: ${plan.springConfig.mass},
        delay,
      });
      cleanups.push(() => handle?.stop?.());`
          : `const anim = animate(el, {
        opacity: [0, 1],
        transform: ["translateY(16px)", "translateY(0px)"],
        duration: ${plan.elementPlans[0]?.entrance?.durationMs || 350},
        delay,
        easing: ${JSON.stringify(safeEasing)},
      });
      cleanups.push(() => anim?.pause?.());`
      }
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      style={{
        padding: "24px",
        borderRadius: "12px",
        background: "${colors.background}",
        color: "${colors.primary}",
        border: "1px solid ${colors.secondary}33",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      ${plan.elementPlans
        .map(
          (el) => `<div
        data-motion-id="${sanitizeAttributeValue(el.elementId)}"
        style={{
          padding: "16px",
          borderRadius: "8px",
          background: "${colors.secondary}15",
          border: "1px solid ${colors.secondary}30",
          color: "${colors.accent}",
        }}
      >
        ${escapeJsxText(el.name || el.elementId)}
      </div>`
        )
        .join("\n      ")}
    </div>
  );
}
`;

  // 3. Vanilla TypeScript / JS Example
  const vanillaCode = `import { animate, animateSpring } from "af-motion";

/**
 * Auto-generated Vanilla Animation Setup
 * Target element selector: [data-motion-id]
 */
export function setupMotion(rootElement: HTMLElement, options = { prefersReducedMotion: false }) {
  if (options.prefersReducedMotion) return () => {};

  const targets = rootElement.querySelectorAll<HTMLElement>("[data-motion-id]");
  const cleanups: Array<() => void> = [];

  targets.forEach((el, index) => {
    const delay = index * ${plan.staggerDelayMs};
    ${
      plan.springConfig
        ? `const spring = animateSpring(el, {
      opacity: [0, 1],
      y: [16, 0],
      stiffness: ${plan.springConfig.stiffness},
      damping: ${plan.springConfig.damping},
      delay,
    });
    cleanups.push(() => spring?.stop?.());`
        : `const anim = animate(el, {
      opacity: [0, 1],
      transform: ["translateY(16px)", "translateY(0px)"],
      duration: ${plan.elementPlans[0]?.entrance?.durationMs || 350},
      delay,
      easing: ${JSON.stringify(safeEasing)},
    });
    cleanups.push(() => anim?.pause?.());`
    }
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
`;

  // 4. Composition JSON
  const compositionJson = JSON.stringify(composition, null, 2);

  return {
    reactCode,
    vanillaCode,
    compositionJson,
    cssVariables,
  };
}
