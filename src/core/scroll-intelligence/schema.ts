/**
 * AF Motion Scroll Intelligence Schema & AI Motion Registry Integration
 *
 * Machine-readable capability definitions and discovery helpers for
 * intelligent scroll-driven animation generation and runtime control.
 */

import {
  SCROLL_ANIMATION_TYPES,
  SCROLL_INTELLIGENCE_VERSION,
  SCROLL_PROGRESS_MODES,
  type ScrollAnimationType,
  type ScrollProgressMode,
} from "./types.js";

export const SCROLL_INTELLIGENCE_CAPABILITY = {
  id: "scroll-intelligence",
  name: "ScrollIntelligence",
  category: "scroll" as const,
  description: "Intelligent scroll animation generation supporting scroll reveals, parallax layers, sticky stories, progress indicators, and 2D-to-3D synchronization.",
  tags: [
    "scroll",
    "parallax",
    "reveal",
    "sticky",
    "scrollytelling",
    "progress",
    "3d-sync",
    "intelligence",
  ],
  version: SCROLL_INTELLIGENCE_VERSION,
  features: [
    "Scroll intent classification",
    "8 scroll animation types",
    "Deterministic offset calculations",
    "Reduced motion adaptations",
    "Passive RAF scroll runtime",
    "2D to 3D scroll synchronization",
  ],
  supportedTypes: SCROLL_ANIMATION_TYPES,
  supportedProgressModes: SCROLL_PROGRESS_MODES,
  parameters: [
    {
      name: "context",
      kind: "positional" as const,
      type: "ScrollIntelligenceContext",
      required: true,
      description: "Scroll intent, animation type, component category, offsets, and pacing constraints",
    },
  ],
  supportedTargets: ["HTMLElement", "Object"],
  signature: {
    importStatement: 'import { generateScrollPlan, scrollIntelligenceRuntime } from "af-motion/catalogue";',
    invocation: "const plan = generateScrollPlan({ type: 'reveal', startOffset: 'top 85%' });",
    exampleCode: "const controls = scrollIntelligenceRuntime.register(plan, element);",
  },
  controls: ["generateScrollPlan", "classifyScrollIntent", "register"],
  callbacks: ["onProgress", "onEnter", "onLeave"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getScrollIntelligenceCapability() {
  return SCROLL_INTELLIGENCE_CAPABILITY;
}

export function getAvailableScrollAnimationTypes(): readonly ScrollAnimationType[] {
  return SCROLL_ANIMATION_TYPES;
}

export function getAvailableScrollProgressModes(): readonly ScrollProgressMode[] {
  return SCROLL_PROGRESS_MODES;
}

export function listSupportedScrollAnimationTypes(): readonly ScrollAnimationType[] {
  return SCROLL_ANIMATION_TYPES;
}

export function listSupportedScrollProgressModes(): readonly ScrollProgressMode[] {
  return SCROLL_PROGRESS_MODES;
}

export function registerScrollIntelligenceCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(SCROLL_INTELLIGENCE_CAPABILITY, { override: true });
}
