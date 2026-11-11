/**
 * AF Motion Choreography Intelligence Schema & AI Motion Registry Integration
 *
 * Machine-readable capability definitions and discovery helpers for
 * cross-system choreography, 2D/3D synchronization, and timeline orchestration.
 */

import {
  CHOREOGRAPHY_INTELLIGENCE_VERSION,
  CHOREOGRAPHY_PATTERNS,
  CHOREOGRAPHY_SYSTEMS,
  type ChoreographyPattern,
  type ChoreographySystemType,
} from "./types.js";

export const CHOREOGRAPHY_INTELLIGENCE_CAPABILITY = {
  id: "choreography-intelligence",
  name: "ChoreographyIntelligence",
  category: "choreography" as const,
  description: "Intelligent cross-system choreography engine coordinating synchronized animation across DOM, React, Graphics, and 3D scenes.",
  tags: [
    "choreography",
    "synchronization",
    "orchestration",
    "2d-3d-sync",
    "cross-system",
    "timeline",
    "stagger",
    "storytelling",
  ],
  version: CHOREOGRAPHY_INTELLIGENCE_VERSION,
  features: [
    "Cross-system normalized progress synchronization",
    "DOM + Graphics + 3D choreography",
    "Dependency resolution and cycle detection",
    "Error isolation and late-joining participants",
    "Playback controls (play, pause, reverse, seek, cancel)",
    "Reduced-motion adaptations",
  ],
  supportedPatterns: CHOREOGRAPHY_PATTERNS,
  supportedSystems: CHOREOGRAPHY_SYSTEMS,
  parameters: [
    {
      name: "context",
      kind: "positional" as const,
      type: "ChoreographyIntelligenceContext",
      required: true,
      description: "Choreography intent, pattern, participating systems, and timing constraints",
    },
  ],
  supportedTargets: ["HTMLElement", "Object", "Camera", "Canvas"],
  signature: {
    importStatement: 'import { generateChoreographyPlan, createCrossSystemSyncBridge } from "af-motion/catalogue";',
    invocation: "const plan = generateChoreographyPlan({ pattern: 'dom-3d-sync' });",
    exampleCode: "const bridge = createCrossSystemSyncBridge({ duration: plan.duration, participants: plan.participants }); bridge.play();",
  },
  controls: ["generateChoreographyPlan", "classifyChoreographyIntent", "createCrossSystemSyncBridge"],
  callbacks: ["onUpdate", "onComplete"],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getChoreographyIntelligenceCapability() {
  return CHOREOGRAPHY_INTELLIGENCE_CAPABILITY;
}

export function listSupportedChoreographyPatterns(): readonly ChoreographyPattern[] {
  return CHOREOGRAPHY_PATTERNS;
}

export function listSupportedChoreographySystems(): readonly ChoreographySystemType[] {
  return CHOREOGRAPHY_SYSTEMS;
}

export function registerChoreographyIntelligenceCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(CHOREOGRAPHY_INTELLIGENCE_CAPABILITY, { override: true });
}
