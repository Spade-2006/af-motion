/**
 * AF Motion Transitions Schema & AI Motion Registry Integration
 *
 * Machine-readable capability definitions and discovery helpers for
 * automatic entrance, exit, and page transitions.
 */

import {
  TRANSITION_DIRECTIONS,
  TRANSITION_PATTERNS,
  TRANSITION_SPEC_VERSION,
  type TransitionDirection,
  type TransitionMode,
  type TransitionPattern,
} from "./types.js";

export const AUTOMATIC_TRANSITION_CAPABILITY = {
  id: "automatic-transition",
  name: "AutomaticTransition",
  category: "transition" as const,
  description: "Automatic entrance and exit transition generation supporting fade, slide, scale, blur, clip-reveal, and shared elements.",
  tags: [
    "transition",
    "entrance",
    "exit",
    "fade",
    "slide",
    "scale",
    "blur",
    "clip-reveal",
    "shared-element",
  ],
  version: TRANSITION_SPEC_VERSION,
  parameters: [
    {
      name: "config",
      kind: "positional" as const,
      type: "TransitionConfig",
      required: false,
      description: "Transition pattern, direction, duration, distance, and pacing constraints",
    },
  ],
  supportedTargets: ["HTMLElement", "SVGElement", "Object"],
  signature: {
    importStatement: 'import { createEntranceTransition, createExitTransition } from "af-motion/catalogue";',
    invocation: "const enter = createEntranceTransition({ pattern: 'slide', direction: 'up' });",
    exampleCode: "const exit = createExitTransition({ pattern: 'fade', duration: 200 });",
  },
  controls: [
    "createEntranceTransition",
    "createExitTransition",
    "generateTransitionProperties",
  ],
  callbacks: ["onEntered", "onExited"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export const PAGE_TRANSITION_CAPABILITY = {
  id: "page-transition",
  name: "PageTransition",
  category: "transition" as const,
  description: "Direction-aware page and route transition coordination with forward/backward slide reversal and enter/exit sequencing modes.",
  tags: [
    "page",
    "route",
    "navigation",
    "transition",
    "direction-aware",
    "sequence",
  ],
  version: TRANSITION_SPEC_VERSION,
  parameters: [
    {
      name: "config",
      kind: "positional" as const,
      type: "PageTransitionConfig",
      required: false,
      description: "Page transition mode (out-in, together), pattern, and direction-aware settings",
    },
  ],
  supportedTargets: ["HTMLElement", "Object"],
  signature: {
    importStatement: 'import { createPageTransition } from "af-motion/catalogue";',
    invocation: "const pageTransition = createPageTransition({ pattern: 'slide', mode: 'out-in' });",
    exampleCode: "const backward = createPageTransition({ pattern: 'slide' }, { direction: 'backward' });",
  },
  controls: ["createPageTransition"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getAvailableTransitionPatterns(): readonly TransitionPattern[] {
  return TRANSITION_PATTERNS;
}

export function getAvailableTransitionDirections(): readonly TransitionDirection[] {
  return TRANSITION_DIRECTIONS;
}

export function getAvailableTransitionModes(): readonly TransitionMode[] {
  return ["together", "out-in", "in-out"];
}

export function registerTransitionCapabilities(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(AUTOMATIC_TRANSITION_CAPABILITY, { override: true });
  registry.registerCapability(PAGE_TRANSITION_CAPABILITY, { override: true });
}
