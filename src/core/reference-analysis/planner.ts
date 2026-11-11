/**
 * AF Motion Reference-to-React Planning Engine
 *
 * Translates visual interpretations into structured React implementation plans:
 * - Component hierarchies with minimal AF Motion bindings
 * - Responsive layouts and breakpoint shifts
 * - Motion plans honoring Motion DNA and accessibility defaults
 * - Graphics and 3D orchestration
 * - Asset requirements and validation checklists
 */

import { interpretVisualReference } from "./interpreter.js";
import type {
  AccessibilityRequirement,
  AssetRequirement,
  PlannedComponentNode,
  PlannedGraphicsAnd3D,
  PlannedMotionItem,
  ReactImplementationPlan,
  ResponsiveStrategy,
  VisualDesignInterpretation,
  VisualReferenceInput,
} from "./types.js";

function isInterpretation(
  target: VisualReferenceInput | VisualDesignInterpretation
): target is VisualDesignInterpretation {
  return "styleClassification" in target && "designTokens" in target;
}

/**
 * Generates a planned component hierarchy matching extracted components or standard layout.
 */
function buildComponentHierarchy(
  interpretation: VisualDesignInterpretation,
  rawInput?: VisualReferenceInput
): PlannedComponentNode[] {
  const extracted = rawInput?.components;

  if (extracted && extracted.length > 0) {
    return extracted.map((comp, idx) => {
      let binding: PlannedComponentNode["afMotionBinding"];
      let category: PlannedComponentNode["category"] = "content";

      if (comp.role === "hero" || comp.role === "header") {
        category = "layout";
        binding = {
          component: "Reveal",
          subpath: "af-motion/react",
          config: {
            preset: "fadeUp",
            duration: Math.round(500 * interpretation.motionDNA.timingMultiplier),
          },
        };
      } else if (comp.role === "button" || comp.role === "input") {
        category = "interactive";
        binding = {
          hook: "useMicrointeraction",
          subpath: "af-motion/react",
          config: {
            kind: comp.role === "button" ? "button" : "input",
            dna: interpretation.motionDNA.matchedDNA,
          },
        };
      } else if (comp.role === "card") {
        category = "interactive";
        binding = {
          component: "Interactive",
          subpath: "af-motion/react",
          config: {
            hover: { scale: 1.02 },
            tap: { scale: 0.98 },
          },
        };
      } else if (comp.role === "graphic-canvas") {
        category = "canvas";
        binding = {
          hook: "aurora",
          subpath: "af-motion",
          config: {
            speed: 0.8,
            intensity: 0.6,
          },
        };
      } else if (comp.role === "viewport-3d") {
        category = "3d";
        binding = {
          component: "Scene3DView",
          subpath: "af-motion/react",
          config: {
            cameraFov: 45,
            interactive: true,
          },
        };
      }

      return {
        id: comp.id || `comp-${idx}`,
        name: comp.name,
        category,
        afMotionBinding: binding,
        props: comp.properties ?? {},
        children: comp.children?.map((child, cIdx) => ({
          id: child.id || `comp-${idx}-child-${cIdx}`,
          name: child.name,
          category: "content",
          props: child.properties ?? {},
        })),
      };
    });
  }

  // Default layout structure based on interpretation
  const nodes: PlannedComponentNode[] = [
    {
      id: "root-container",
      name: "RootContainer",
      category: "layout",
      props: {
        className: "min-h-screen w-full relative flex flex-col",
        style: {
          backgroundColor: interpretation.designTokens.colors.background,
          color: interpretation.designTokens.colors.text,
        },
      },
      children: [
        {
          id: "hero-section",
          name: "HeroSection",
          category: "layout",
          afMotionBinding: {
            component: "Reveal",
            subpath: "af-motion/react",
            config: {
              preset: "fadeUp",
              duration: Math.round(550 * interpretation.motionDNA.timingMultiplier),
            },
          },
          props: {
            className: "flex flex-col items-center justify-center py-20 px-6 text-center",
          },
          children: [
            {
              id: "hero-headline",
              name: "Headline",
              category: "content",
              props: {
                text: interpretation.referenceName,
                tag: "h1",
              },
            },
            {
              id: "hero-cta",
              name: "CallToAction",
              category: "interactive",
              afMotionBinding: {
                hook: "useMicrointeraction",
                subpath: "af-motion/react",
                config: {
                  kind: "button",
                  dna: interpretation.motionDNA.matchedDNA,
                },
              },
              props: {
                label: "Get Started",
                variant: "primary",
              },
            },
          ],
        },
      ],
    },
  ];

  // If graphics required, inject a canvas element
  if (interpretation.capabilitiesRequired.includes("aurora")) {
    nodes[0].children?.unshift({
      id: "background-canvas",
      name: "AuroraBackground",
      category: "canvas",
      afMotionBinding: {
        hook: "aurora",
        subpath: "af-motion",
        config: {
          speed: 0.7,
          opacity: 0.4,
        },
      },
      props: {
        className: "absolute inset-0 pointer-events-none z-0",
      },
    });
  }

  return nodes;
}

/**
 * Builds responsive strategy matching target platform and layout style.
 */
function buildResponsiveStrategy(
  rawInput?: VisualReferenceInput
): ResponsiveStrategy {
  const isMobile = rawInput?.targetPlatform === "mobile";

  return {
    mobileFirst: true,
    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    layoutShifts: {
      mobile: isMobile ? "flex-col w-full px-4" : "flex-col w-full px-4",
      tablet: "grid-cols-2 gap-4 px-6",
      desktop: "grid-cols-3 gap-6 max-w-7xl mx-auto px-8",
    },
  };
}

/**
 * Derives minimal motion items respecting style and DNA.
 */
function buildMotionPlans(
  interpretation: VisualDesignInterpretation
): PlannedMotionItem[] {
  const multiplier = interpretation.motionDNA.timingMultiplier;
  const plans: PlannedMotionItem[] = [];

  // Mount entrance
  plans.push({
    id: "motion-hero-entrance",
    targetId: "hero-section",
    trigger: "mount",
    capability: "useAnimate",
    family: "fadeUp",
    durationMs: Math.round(500 * multiplier),
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    reducedMotionFallback: "opacity",
  });

  // Microinteraction for button
  plans.push({
    id: "motion-cta-interaction",
    targetId: "hero-cta",
    trigger: "hover",
    capability: "useMicrointeraction",
    family: "spring-scale",
    durationMs: Math.round(200 * multiplier),
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    reducedMotionFallback: "disabled",
  });

  // Scroll reveal if multi-element
  if (interpretation.layout.type === "grid" || interpretation.layout.type === "sticky-story") {
    plans.push({
      id: "motion-grid-stagger",
      targetId: "content-grid",
      trigger: "scroll",
      capability: "useScrollProgress",
      family: "staggerReveal",
      durationMs: Math.round(600 * multiplier),
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      delayMs: 80,
      reducedMotionFallback: "instant",
    });
  }

  return plans;
}

/**
 * Configures graphics and 3D requirements.
 */
function buildGraphicsAnd3D(
  interpretation: VisualDesignInterpretation,
  rawInput?: VisualReferenceInput
): PlannedGraphicsAnd3D {
  const graphics = rawInput?.extractedProperties?.graphics ?? interpretation.graphics;
  const scene3D = rawInput?.extractedProperties?.scene3D ?? interpretation.scene3D;
  const result: PlannedGraphicsAnd3D = {};

  if (graphics?.hasBackgroundEffect || interpretation.capabilitiesRequired.includes("aurora")) {
    const effect = graphics?.effectType === "particles" ? "particleField" : "aurora";
    result.backgroundCanvas = {
      effect,
      subpath: "af-motion",
      interactive: graphics?.isInteractive ?? false,
    };
  }

  if (scene3D?.has3DScene || interpretation.capabilitiesRequired.includes("Scene3DView")) {
    result.viewport3D = {
      geometry: scene3D?.geometryType ?? "torus",
      material: scene3D?.materialType ?? "glass",
      lighting: "studio-three-point",
      controls: scene3D?.interactiveControls ?? true,
    };
  }

  return result;
}

/**
 * Derives asset requirements from visual properties and typography.
 */
function buildAssetRequirements(
  interpretation: VisualDesignInterpretation,
  rawInput?: VisualReferenceInput
): AssetRequirement[] {
  const assets: AssetRequirement[] = [];
  const typo = rawInput?.extractedProperties?.typography;

  if (typo?.headingFont && typo.headingFont !== "Inter" && typo.headingFont !== "system-ui") {
    assets.push({
      id: "font-heading",
      type: "font",
      description: `Custom typography font family: ${typo.headingFont}`,
      fallback: "sans-serif",
    });
  }

  if (rawInput?.extractedProperties?.scene3D?.geometryType === "custom-model") {
    assets.push({
      id: "model-3d",
      type: "3d-model",
      description: "GLTF/GLB custom 3D asset model file",
      fallback: "torusGeometry primitive",
    });
  }

  return assets;
}

/**
 * Establishes strict accessibility constraints.
 */
function buildAccessibilityRequirements(): AccessibilityRequirement[] {
  return [
    {
      rule: "prefers-reduced-motion",
      strategy: "Use useMotionAccessibility hook or reducedMotion fallback config (opacity or instant)",
      verified: true,
    },
    {
      rule: "wcag-contrast-ratio",
      strategy: "Ensure minimum 4.5:1 text-to-surface contrast across dark/light mode tokens",
      verified: true,
    },
    {
      rule: "keyboard-navigation",
      strategy: "Ensure interactive surfaces provide visible focus-visible ring offsets",
      verified: true,
    },
    {
      rule: "gpu-compositing",
      strategy: "Animate strictly transform and opacity; zero layout property animations (width/height/margin)",
      verified: true,
    },
  ];
}

/**
 * Produces validation checklist for agents and developers.
 */
function buildValidationChecklist(
  interpretation: VisualDesignInterpretation
): string[] {
  return [
    "Verify 'use client'; directive is present in interactive React components",
    `Confirm visual style tokens adhere to '${interpretation.styleClassification.style}'`,
    `Ensure palette matches built-in palette '${interpretation.paletteMapping.matchedPaletteId}'`,
    `Check Motion DNA personality '${interpretation.motionDNA.matchedDNA}' timing multipliers`,
    "Verify all animated elements include prefers-reduced-motion safety bypasses",
    "Confirm no layout-triggering properties (width, height, top, left, margin) are animated directly",
  ];
}

/**
 * Generates an end-to-end React implementation plan from a visual reference or interpretation.
 */
export function generateReactImplementationPlan(
  inputOrInterpretation: VisualReferenceInput | VisualDesignInterpretation
): ReactImplementationPlan {
  const interpretation = isInterpretation(inputOrInterpretation)
    ? inputOrInterpretation
    : interpretVisualReference(inputOrInterpretation);

  const rawInput = isInterpretation(inputOrInterpretation)
    ? undefined
    : inputOrInterpretation;

  const planId = `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const title = `React Implementation: ${interpretation.referenceName}`;

  return {
    id: planId,
    title,
    componentHierarchy: buildComponentHierarchy(interpretation, rawInput),
    responsiveStrategy: buildResponsiveStrategy(rawInput),
    visualStyleConfig: {
      style: interpretation.styleClassification.style,
      palette: interpretation.paletteMapping.matchedPaletteId,
      motionDNA: interpretation.motionDNA.matchedDNA,
    },
    motionPlans: buildMotionPlans(interpretation),
    graphicsAnd3D: buildGraphicsAnd3D(interpretation, rawInput),
    assetRequirements: buildAssetRequirements(interpretation, rawInput),
    accessibilityRequirements: buildAccessibilityRequirements(),
    validationChecklist: buildValidationChecklist(interpretation),
  };
}
