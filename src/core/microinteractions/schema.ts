/**
 * AF Motion Microinteraction Schema & AI Motion Registry Integration
 *
 * Machine-readable capability definitions and discovery helpers for
 * intelligent microinteraction generation and runtime control.
 */

import {
  INTERACTION_STATES,
  MICRO_COMPONENT_CATEGORIES,
  MICROINTERACTION_FEEDBACK_TYPES,
  MICROINTERACTION_TRIGGERS,
  MICROINTERACTION_VERSION,
  type InteractionState,
  type MicroComponentCategory,
  type MicrointeractionFeedbackType,
  type MicrointeractionTrigger,
} from "./types.js";

export const MICROINTERACTION_CAPABILITY = {
  id: "microinteractions",
  name: "Microinteractions",
  category: "interactive" as const,
  description: "Intelligent microinteraction generation supporting buttons, cards, form controls, toggles, accordions, and dialogs with context-aware tactile feedback.",
  tags: [
    "microinteractions",
    "interactive",
    "feedback",
    "hover",
    "press",
    "focus",
    "toggle",
    "tactile",
  ],
  version: MICROINTERACTION_VERSION,
  features: [
    "Context-aware microinteraction generation",
    "16 interaction states",
    "23 component categories",
    "Reduced motion fallbacks",
    "Spring & easing curves",
    "Framework-independent runtime controller",
  ],
  supportedCategories: MICRO_COMPONENT_CATEGORIES,
  supportedStates: INTERACTION_STATES,
  supportedTriggers: MICROINTERACTION_TRIGGERS,
  supportedFeedbackTypes: MICROINTERACTION_FEEDBACK_TYPES,
  parameters: [
    {
      name: "context",
      kind: "positional" as const,
      type: "MicrointeractionContext",
      required: true,
      description: "Microinteraction intent, category, states, visual style, and constraints",
    },
  ],
  supportedTargets: ["HTMLElement", "Object"],
  signature: {
    importStatement: 'import { generateMicrointeractionPlan, createMicrointeractionController } from "af-motion/catalogue";',
    invocation: "const plan = generateMicrointeractionPlan({ category: 'button', toState: 'press' });",
    exampleCode: "const controller = createMicrointeractionController({ category: 'button' }); controller.attach(element);",
  },
  controls: ["generateMicrointeractionPlan", "classifyMicrointeractionIntent", "createMicrointeractionController"],
  callbacks: ["onStateChange"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getMicrointeractionCapability() {
  return MICROINTERACTION_CAPABILITY;
}

export function listSupportedMicroComponentCategories(): readonly MicroComponentCategory[] {
  return MICRO_COMPONENT_CATEGORIES;
}

export function listSupportedInteractionStates(): readonly InteractionState[] {
  return INTERACTION_STATES;
}

export function listSupportedMicrointeractionTriggers(): readonly MicrointeractionTrigger[] {
  return MICROINTERACTION_TRIGGERS;
}

export function listSupportedMicrointeractionFeedbackTypes(): readonly MicrointeractionFeedbackType[] {
  return MICROINTERACTION_FEEDBACK_TYPES;
}

export function registerMicrointeractionCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(MICROINTERACTION_CAPABILITY, { override: true });
}
