/**
 * AF Motion Motion Validation Schema & AI Motion Registry Integration
 *
 * Machine-readable capability definitions and discovery helpers for
 * motion validation, accessibility checking, and performance optimization.
 */

import { MOTION_VALIDATION_VERSION } from "./types.js";

export const MOTION_VALIDATION_CAPABILITY = {
  id: "motion-validation",
  name: "MotionValidation",
  category: "optimization" as const,
  description: "Unified motion validation, accessibility compliance checking, performance optimization, and cross-system consistency intelligence.",
  tags: [
    "validation",
    "optimization",
    "accessibility",
    "reduced-motion",
    "performance",
    "consistency",
    "seizure-safety",
    "linting",
  ],
  version: MOTION_VALIDATION_VERSION,
  features: [
    "Deterministic configuration validation",
    "WCAG 2.3.1 seizure risk detection",
    "Reduced-motion verification and fallbacks",
    "GPU transform optimization",
    "Safe, balanced, and aggressive optimization levels",
    "Holistic cross-component consistency analysis",
  ],
  parameters: [
    {
      name: "config",
      kind: "positional" as const,
      type: "Object",
      required: true,
      description: "Motion configuration, transition, scroll plan, microinteraction, or choreography specification",
    },
    {
      name: "options",
      kind: "optional" as const,
      type: "MotionOptimizationOptions",
      required: false,
      description: "Optimization level, device tier, and target frame rate constraints",
    },
  ],
  supportedTargets: ["Object", "Plan", "Choreography"],
  signature: {
    importStatement: 'import { validateMotionConfig, optimizeMotion, evaluateMotionConsistency } from "af-motion/catalogue";',
    invocation: "const report = validateMotionConfig(config); const optimized = optimizeMotion(config, { level: 'safe' });",
    exampleCode: "const result = optimizeMotion(config); if (result.validationAfter.valid) { apply(result.optimizedConfig); }",
  },
  controls: ["validateMotionConfig", "optimizeMotion", "evaluateMotionConsistency"],
  callbacks: [],
  reducedMotion: "static-fallback" as const,
  compatibility: { browser: true, ssr: true, requiresCanvas: false },
};

export function getMotionValidationCapability() {
  return MOTION_VALIDATION_CAPABILITY;
}

export function registerMotionValidationCapability(registry: {
  registerCapability: (cap: any, opts?: any) => void;
}): void {
  registry.registerCapability(MOTION_VALIDATION_CAPABILITY, { override: true });
}
