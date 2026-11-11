/**
 * AF Motion Animation Intelligence Schema & AI Motion Registry Integration
 *
 * Machine-readable contracts, capability descriptor, and discovery helpers
 * for AF Motion's intelligent animation selection system.
 */

import {
  COMPONENT_CATEGORIES,
  MOTION_INTENTS,
  type ComponentCategory,
  type MotionIntent,
} from "./types.js";

export const ANIMATION_INTELLIGENCE_SCHEMA_VERSION = "1.0.0";

export const ANIMATION_INTELLIGENCE_CAPABILITY = {
  id: "animation-intelligence",
  name: "AnimationIntelligence",
  category: "intelligence" as const,
  description: "Component-aware animation recommendation and decision engine evaluating interaction intent, visual style, Motion DNA, performance, and accessibility.",
  tags: [
    "intelligence",
    "animation",
    "intent",
    "decision-engine",
    "component-aware",
    "scoring",
    "conflict-resolution",
  ],
  version: ANIMATION_INTELLIGENCE_SCHEMA_VERSION,
  parameters: [
    {
      name: "context",
      kind: "positional" as const,
      type: "AnimationSelectionContext",
      required: true,
      description: "Component category, motion intent, visual style, Motion DNA, and user preference constraints",
    },
  ],
  supportedTargets: ["HTMLElement", "SVGElement", "Object"],
  signature: {
    importStatement: 'import { recommendAnimation, recommendComponentMotion } from "af-motion/catalogue";',
    invocation: "const rec = recommendAnimation({ componentType: 'button', intent: 'feedback' });",
    exampleCode: "const plan = recommendComponentMotion('card', { visualStyle: 'skeuomorphism' });",
  },
  controls: [
    "recommendAnimation",
    "recommendComponentMotion",
    "explainAnimationSelection",
    "classifyMotionIntent",
    "resolveAnimationConflicts",
  ],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getAvailableComponentCategories(): readonly ComponentCategory[] {
  return COMPONENT_CATEGORIES;
}

export function getAvailableMotionIntents(): readonly MotionIntent[] {
  return MOTION_INTENTS;
}

export function registerAnimationIntelligenceCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(ANIMATION_INTELLIGENCE_CAPABILITY, { override: true });
}
