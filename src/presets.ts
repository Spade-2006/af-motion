/**
 * AF Motion Machine-Readable Motion Preset System
 *
 * Provides a unified, machine-readable registry of reusable animation,
 * visual-effect, and choreography presets for developers and AI agents.
 */

import { animate } from "./core/animate.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./core/animate.js";
import type { AnimationControls } from "./core/animation.js";
import { animateSequence } from "./core/animation-sequence.js";
import type {
  AnimationSequenceControls,
  AnimationSequenceOptions,
  AnimationSequenceStep,
} from "./core/animation-sequence.js";
import { animateParallel } from "./core/animation-parallel.js";
import { resolveMotionDNA, type MotionDNA } from "./core/motion-dna.js";
import { adaptAnimationOptions, type AdaptiveMotionConditions } from "./core/adaptive-motion.js";
import { resolveDesignSystem, type DesignSystem } from "./core/design-system.js";
import type {
  AnimationParallelControls,
  AnimationParallelOptions,
  AnimationParallelStep,
} from "./core/animation-parallel.js";

export const PRESET_SCHEMA_VERSION = "1.0.0";

export type MotionPresetCategory =
  | "entrance"
  | "exit"
  | "hover"
  | "click-interaction"
  | "text"
  | "scroll"
  | "background"
  | "page-transition"
  | "choreography";

export const MOTION_PRESET_CATEGORIES: readonly MotionPresetCategory[] = [
  "entrance",
  "exit",
  "hover",
  "click-interaction",
  "text",
  "scroll",
  "background",
  "page-transition",
  "choreography",
] as const;

export type PresetTargetType =
  | "HTMLElement"
  | "SVGElement"
  | "AnimateTarget"
  | "string (CSS selector)";

export type PresetReducedMotionBehavior =
  | "skips-to-endpoint"
  | "disables-animation"
  | "static-fallback"
  | "respects-profile";

export interface PresetParameterSchema {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly required?: boolean;
  readonly default?: unknown;
  readonly range?: { readonly min?: number; readonly max?: number };
  readonly enum?: readonly (string | number)[];
}

export interface PresetUsageSignature {
  readonly importStatement: string;
  readonly invocation: string;
  readonly exampleCode: string;
}

export interface MotionPresetAnimationConfig {
  readonly properties: Readonly<AnimatableProperties>;
  readonly duration?: number;
  readonly easing?: string | ((t: number) => number);
  readonly delay?: number;
  readonly repeat?: number;
  readonly yoyo?: boolean;
  readonly playbackRate?: number;
}

export interface MotionPresetStepConfig {
  readonly preset: string;
  readonly target?: AnimateTarget;
  readonly delay?: number;
  readonly duration?: number;
  readonly overrides?: MotionPresetOverrides;
}

export interface MotionPresetChoreographyConfig {
  readonly mode: "sequence" | "parallel";
  readonly steps: readonly MotionPresetStepConfig[];
}

export interface MotionPreset {
  readonly id: string;
  readonly name: string;
  readonly category: MotionPresetCategory;
  readonly description: string;
  readonly supportedTargets: readonly PresetTargetType[];
  readonly reducedMotion: PresetReducedMotionBehavior;
  readonly tags: readonly string[];
  readonly signature: PresetUsageSignature;
  readonly configurableParameters: readonly PresetParameterSchema[];
  readonly animation?: MotionPresetAnimationConfig;
  readonly choreography?: MotionPresetChoreographyConfig;
}

export type MotionPresetOverrides = Partial<DOMAnimationOptions> & {
  readonly motionDNA?: string | MotionDNA;
  readonly adaptive?: boolean | AdaptiveMotionConditions;
  readonly designSystem?: string | DesignSystem;
};

export interface PresetValidationError {
  readonly parameter?: string;
  readonly message: string;
}

export interface PresetValidationResult {
  readonly valid: boolean;
  readonly errors: readonly PresetValidationError[];
}

export interface PresetDocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalPresets: number;
  readonly categories: readonly MotionPresetCategory[];
  readonly presets: readonly MotionPreset[];
}

const COMMON_CONFIGURABLE_PARAMS: readonly PresetParameterSchema[] = [
  { name: "duration", type: "number", description: "Animation duration in milliseconds.", range: { min: 0 } },
  { name: "delay", type: "number", description: "Delay in milliseconds before starting.", range: { min: 0 } },
  { name: "easing", type: "EasingOption", description: "Easing function or registered easing name." },
  { name: "repeat", type: "number", description: "Repeat iterations.", range: { min: 0 } },
  { name: "yoyo", type: "boolean", description: "Alternate direction on repeats." },
  { name: "playbackRate", type: "number", description: "Speed multiplier.", range: { min: 0 } },
];

function freezeDeep<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }
  for (const key of Object.keys(value)) {
    const prop = (value as Record<string, unknown>)[key];
    if (prop !== null && typeof prop === "object") {
      freezeDeep(prop);
    }
  }
  return Object.freeze(value) as Readonly<T>;
}

export const BUILT_IN_MOTION_PRESETS: readonly MotionPreset[] = [
  // --- 1. Entrance ---
  {
    id: "preset-fade-in",
    name: "fadeIn",
    category: "entrance",
    description: "Smooth linear/quadratic opacity entrance from 0 to 1.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["fade", "entrance", "opacity", "appear"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "fadeIn", overrides?)',
      exampleCode: 'applyPreset(".card", "fadeIn", { duration: 400 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1] },
      duration: 400,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-slide-up",
    name: "slideUp",
    category: "entrance",
    description: "Fade in while translating up 24px into natural position.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "entrance", "up", "rise"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideUp", overrides?)',
      exampleCode: 'applyPreset(".hero-title", "slideUp", { duration: 500 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
      duration: 500,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-slide-down",
    name: "slideDown",
    category: "entrance",
    description: "Fade in while translating down -24px into natural position.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "entrance", "down", "dropdown"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideDown", overrides?)',
      exampleCode: 'applyPreset(".dropdown-menu", "slideDown", { duration: 350 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["translateY(-24px)", "translateY(0px)"] },
      duration: 500,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-slide-in-left",
    name: "slideInLeft",
    category: "entrance",
    description: "Fade in while translating horizontally from left -32px to 0px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "entrance", "left", "horizontal"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideInLeft", overrides?)',
      exampleCode: 'applyPreset(".sidebar", "slideInLeft", { duration: 450 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["translateX(-32px)", "translateX(0px)"] },
      duration: 500,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-slide-in-right",
    name: "slideInRight",
    category: "entrance",
    description: "Fade in while translating horizontally from right 32px to 0px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "entrance", "right", "horizontal"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideInRight", overrides?)',
      exampleCode: 'applyPreset(".notification", "slideInRight", { duration: 400 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["translateX(32px)", "translateX(0px)"] },
      duration: 500,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-scale-in",
    name: "scaleIn",
    category: "entrance",
    description: "Fade in with subtle scaling from 0.9 to 1.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["scale", "entrance", "zoom", "pop"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "scaleIn", overrides?)',
      exampleCode: 'applyPreset(".dialog-box", "scaleIn", { duration: 400 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] },
      duration: 400,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-zoom-in",
    name: "zoomIn",
    category: "entrance",
    description: "Dramatic zoom entrance scaling from 0.7 to 1.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["zoom", "entrance", "pop", "modal"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "zoomIn", overrides?)',
      exampleCode: 'applyPreset(".badge", "zoomIn", { duration: 350 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["scale(0.7)", "scale(1)"] },
      duration: 450,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-flip-in-x",
    name: "flipInX",
    category: "entrance",
    description: "3D perspective flip along X axis from 90deg to 0deg.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["flip", "3d", "entrance", "rotate"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "flipInX", overrides?)',
      exampleCode: 'applyPreset(".card-face", "flipInX", { duration: 600 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["perspective(400px) rotateX(90deg)", "perspective(400px) rotateX(0deg)"] },
      duration: 600,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-bounce-in",
    name: "bounceIn",
    category: "entrance",
    description: "Elastic pop entrance scaling from 0.4 to 1.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["bounce", "elastic", "entrance", "pop"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "bounceIn", overrides?)',
      exampleCode: 'applyPreset(".avatar", "bounceIn", { duration: 550 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["scale(0.4)", "scale(1)"] },
      duration: 550,
      easing: "easeOutBack",
    },
  },

  // --- 2. Exit ---
  {
    id: "preset-fade-out",
    name: "fadeOut",
    category: "exit",
    description: "Smooth linear/quadratic opacity exit from 1 to 0.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["fade", "exit", "disappear", "opacity"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "fadeOut", overrides?)',
      exampleCode: 'applyPreset(".tooltip", "fadeOut", { duration: 250 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0] },
      duration: 300,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-slide-out-up",
    name: "slideOutUp",
    category: "exit",
    description: "Fade out while translating up from 0px to -24px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "exit", "up", "dismiss"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideOutUp", overrides?)',
      exampleCode: 'applyPreset(".banner", "slideOutUp", { duration: 350 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0], transform: ["translateY(0px)", "translateY(-24px)"] },
      duration: 400,
      easing: "easeInCubic",
    },
  },
  {
    id: "preset-slide-out-down",
    name: "slideOutDown",
    category: "exit",
    description: "Fade out while translating down from 0px to 24px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "exit", "down", "dismiss"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideOutDown", overrides?)',
      exampleCode: 'applyPreset(".bottom-sheet", "slideOutDown", { duration: 400 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0], transform: ["translateY(0px)", "translateY(24px)"] },
      duration: 400,
      easing: "easeInCubic",
    },
  },
  {
    id: "preset-slide-out-left",
    name: "slideOutLeft",
    category: "exit",
    description: "Fade out while translating left from 0px to -32px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "exit", "left", "swipe"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideOutLeft", overrides?)',
      exampleCode: 'applyPreset(".toast", "slideOutLeft", { duration: 300 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0], transform: ["translateX(0px)", "translateX(-32px)"] },
      duration: 400,
      easing: "easeInCubic",
    },
  },
  {
    id: "preset-slide-out-right",
    name: "slideOutRight",
    category: "exit",
    description: "Fade out while translating right from 0px to 32px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["slide", "exit", "right", "swipe"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "slideOutRight", overrides?)',
      exampleCode: 'applyPreset(".item", "slideOutRight", { duration: 350 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0], transform: ["translateX(0px)", "translateX(32px)"] },
      duration: 400,
      easing: "easeInCubic",
    },
  },
  {
    id: "preset-scale-out",
    name: "scaleOut",
    category: "exit",
    description: "Fade out while scaling down from 1 to 0.9.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["scale", "exit", "shrink", "dismiss"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "scaleOut", overrides?)',
      exampleCode: 'applyPreset(".modal", "scaleOut", { duration: 300 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0], transform: ["scale(1)", "scale(0.9)"] },
      duration: 300,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-zoom-out",
    name: "zoomOut",
    category: "exit",
    description: "Fade out while shrinking dramatically from 1 to 0.7.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["zoom", "exit", "shrink", "collapse"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "zoomOut", overrides?)',
      exampleCode: 'applyPreset(".popup", "zoomOut", { duration: 300 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0], transform: ["scale(1)", "scale(0.7)"] },
      duration: 350,
      easing: "easeInCubic",
    },
  },

  // --- 3. Hover ---
  {
    id: "preset-hover-lift",
    name: "hoverLift",
    category: "hover",
    description: "Subtle elevation lift translating up -4px on pointer hover.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["hover", "lift", "elevation", "card"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "hoverLift", overrides?)',
      exampleCode: 'applyPreset(".product-card", "hoverLift", { duration: 200 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["translateY(0px)", "translateY(-4px)"] },
      duration: 200,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-hover-scale",
    name: "hoverScale",
    category: "hover",
    description: "Crisp magnification scaling element up to 1.05.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["hover", "scale", "zoom", "button"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "hoverScale", overrides?)',
      exampleCode: 'applyPreset(".cta-button", "hoverScale", { duration: 180 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["scale(1)", "scale(1.05)"] },
      duration: 200,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-hover-glow",
    name: "hoverGlow",
    category: "hover",
    description: "Luminescent drop-shadow halo expansion on hover.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "static-fallback",
    tags: ["hover", "glow", "shadow", "neon"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "hoverGlow", overrides?)',
      exampleCode: 'applyPreset(".icon-box", "hoverGlow", { duration: 250 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { filter: ["drop-shadow(0 0 0px rgba(99,102,241,0))", "drop-shadow(0 0 8px rgba(99,102,241,0.5))"] },
      duration: 250,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-hover-tilt-subtle",
    name: "hoverTiltSubtle",
    category: "hover",
    description: "Subtle 3D perspective orientation shift on hover.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["hover", "tilt", "3d", "perspective"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "hoverTiltSubtle", overrides?)',
      exampleCode: 'applyPreset(".showcase-card", "hoverTiltSubtle", { duration: 250 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["perspective(600px) rotateX(0deg) rotateY(0deg)", "perspective(600px) rotateX(4deg) rotateY(-4deg)"] },
      duration: 250,
      easing: "easeOutQuad",
    },
  },

  // --- 4. Click & Interaction ---
  {
    id: "preset-click-press",
    name: "clickPress",
    category: "click-interaction",
    description: "Tactile button compression squishing scale to 0.95.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["click", "press", "squish", "feedback"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "clickPress", overrides?)',
      exampleCode: 'applyPreset(".primary-btn", "clickPress", { duration: 120 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["scale(1)", "scale(0.95)"] },
      duration: 120,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-click-bounce",
    name: "clickBounce",
    category: "click-interaction",
    description: "Depression and springy snap-back rebound on tap/click.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["click", "bounce", "rebound", "haptic"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "clickBounce", overrides?)',
      exampleCode: 'applyPreset(".action-chip", "clickBounce", { duration: 150 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["scale(1)", "scale(0.92)"] },
      duration: 150,
      repeat: 1,
      yoyo: true,
      easing: "easeOutQuad",
    },
  },
  {
    id: "preset-pulse-attention",
    name: "pulseAttention",
    category: "click-interaction",
    description: "Noticeable pulsating heartbeat animation to attract user focus.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["pulse", "attention", "alert", "heartbeat"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "pulseAttention", overrides?)',
      exampleCode: 'applyPreset(".notification-bell", "pulseAttention", { duration: 300 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["scale(1)", "scale(1.08)"] },
      duration: 300,
      repeat: 1,
      yoyo: true,
      easing: "easeInOutQuad",
    },
  },
  {
    id: "preset-shake-error",
    name: "shakeError",
    category: "click-interaction",
    description: "Horizontal high-frequency shake indicating validation failure.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "static-fallback",
    tags: ["shake", "error", "validation", "invalid"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "shakeError", overrides?)',
      exampleCode: 'applyPreset(".password-input", "shakeError", { duration: 80 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["translateX(0px)", "translateX(-8px)"] },
      duration: 80,
      repeat: 3,
      yoyo: true,
      easing: "easeInOutQuad",
    },
  },
  {
    id: "preset-flash-highlight",
    name: "flashHighlight",
    category: "click-interaction",
    description: "Brief opacity flash alerting user to updated content.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["flash", "highlight", "update", "notice"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "flashHighlight", overrides?)',
      exampleCode: 'applyPreset(".updated-row", "flashHighlight", { duration: 150 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [1, 0.4] },
      duration: 150,
      repeat: 1,
      yoyo: true,
      easing: "easeInOutQuad",
    },
  },

  // --- 5. Text ---
  {
    id: "preset-text-focus",
    name: "textFocus",
    category: "text",
    description: "Cinematic typographic unblur and opacity reveal.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["text", "focus", "blur", "cinematic"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "textFocus", overrides?)',
      exampleCode: 'applyPreset(".headline", "textFocus", { duration: 600 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], filter: ["blur(8px)", "blur(0px)"] },
      duration: 600,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-text-rise",
    name: "textRise",
    category: "text",
    description: "Typographic lift entrance translating upward 12px with fade.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["text", "rise", "entrance", "subtitle"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "textRise", overrides?)',
      exampleCode: 'applyPreset(".lead-paragraph", "textRise", { duration: 450 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0px)"] },
      duration: 450,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-text-glow",
    name: "textGlow",
    category: "text",
    description: "Radiant text bloom illumination drop-shadow effect.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "static-fallback",
    tags: ["text", "glow", "bloom", "highlight"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "textGlow", overrides?)',
      exampleCode: 'applyPreset(".key-phrase", "textGlow", { duration: 500 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { filter: ["drop-shadow(0 0 0px rgba(255,255,255,0))", "drop-shadow(0 0 10px rgba(99,102,241,0.7))"] },
      duration: 500,
      repeat: 1,
      yoyo: true,
      easing: "easeInOutQuad",
    },
  },

  // --- 6. Scroll ---
  {
    id: "preset-scroll-reveal-rise",
    name: "scrollRevealRise",
    category: "scroll",
    description: "Smooth viewport entrance translating up 36px with opacity fade.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["scroll", "reveal", "rise", "viewport"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "scrollRevealRise", overrides?)',
      exampleCode: 'applyPreset(".feature-section", "scrollRevealRise", { duration: 700 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1], transform: ["translateY(36px)", "translateY(0px)"] },
      duration: 700,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-scroll-parallax-slow",
    name: "scrollParallaxSlow",
    category: "scroll",
    description: "Gentle vertical parallax translation of -40px.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["scroll", "parallax", "background", "depth"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "scrollParallaxSlow", overrides?)',
      exampleCode: 'applyPreset(".bg-graphic", "scrollParallaxSlow", { duration: 1000 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["translateY(0px)", "translateY(-40px)"] },
      duration: 1000,
      easing: "linear",
    },
  },
  {
    id: "preset-scroll-scale-in",
    name: "scrollScaleIn",
    category: "scroll",
    description: "Viewport scroll entrance scaling from 0.85 to 1.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["scroll", "scale", "zoom", "entrance"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "scrollScaleIn", overrides?)',
      exampleCode: 'applyPreset(".media-player", "scrollScaleIn", { duration: 800 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0.2, 1], transform: ["scale(0.85)", "scale(1)"] },
      duration: 800,
      easing: "easeOutCubic",
    },
  },

  // --- 7. Background ---
  {
    id: "preset-ambient-float",
    name: "ambientFloat",
    category: "background",
    description: "Continuous subtle vertical floating drift for badges and illustrations.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["ambient", "float", "drift", "continuous"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "ambientFloat", overrides?)',
      exampleCode: 'applyPreset(".floating-orb", "ambientFloat", { duration: 2500 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["translateY(0px)", "translateY(-8px)"] },
      duration: 2500,
      repeat: Infinity,
      yoyo: true,
      easing: "easeInOutQuad",
    },
  },
  {
    id: "preset-pulse-ambient",
    name: "pulseAmbient",
    category: "background",
    description: "Gentle breathing scale and opacity fluctuation for glowing backdrops.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "disables-animation",
    tags: ["ambient", "pulse", "glow", "breathing"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "pulseAmbient", overrides?)',
      exampleCode: 'applyPreset(".ambient-light", "pulseAmbient", { duration: 3500 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0.6, 1], transform: ["scale(0.95)", "scale(1.05)"] },
      duration: 3500,
      repeat: Infinity,
      yoyo: true,
      easing: "easeInOutQuad",
    },
  },

  // --- 8. Page Transitions ---
  {
    id: "preset-page-fade",
    name: "pageFade",
    category: "page-transition",
    description: "Seamless opacity crossfade for view and route transitions.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["page", "route", "transition", "fade"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "pageFade", overrides?)',
      exampleCode: 'applyPreset(".page-container", "pageFade", { duration: 350 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { opacity: [0, 1] },
      duration: 350,
      easing: "easeInOutQuad",
    },
  },
  {
    id: "preset-page-slide-left",
    name: "pageSlideLeft",
    category: "page-transition",
    description: "Next page entrance sliding smoothly from right 100% to 0%.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["page", "slide", "forward", "navigation"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "pageSlideLeft", overrides?)',
      exampleCode: 'applyPreset(".next-page", "pageSlideLeft", { duration: 400 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["translateX(100%)", "translateX(0%)"] },
      duration: 400,
      easing: "easeOutCubic",
    },
  },
  {
    id: "preset-page-slide-right",
    name: "pageSlideRight",
    category: "page-transition",
    description: "Back navigation slide entering from left -100% to 0%.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["page", "slide", "back", "navigation"],
    signature: {
      importStatement: 'import { applyPreset } from "af-motion/presets";',
      invocation: 'applyPreset(target, "pageSlideRight", overrides?)',
      exampleCode: 'applyPreset(".prev-page", "pageSlideRight", { duration: 400 });',
    },
    configurableParameters: COMMON_CONFIGURABLE_PARAMS,
    animation: {
      properties: { transform: ["translateX(-100%)", "translateX(0%)"] },
      duration: 400,
      easing: "easeOutCubic",
    },
  },

  // --- 9. Choreography ---
  {
    id: "preset-hero-sequence",
    name: "heroSequence",
    category: "choreography",
    description: "Coordinated hero section choreography: heading rise, body fade, CTA pop.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["choreography", "hero", "sequence", "landing"],
    signature: {
      importStatement: 'import { composePresetSequence } from "af-motion/presets";',
      invocation: 'composePresetSequence(target, ["slideUp", "fadeIn", "scaleIn"])',
      exampleCode: 'composePresetSequence(".hero-container", ["slideUp", "fadeIn", "scaleIn"]);',
    },
    configurableParameters: [
      { name: "steps", type: "readonly (string | { preset: string; overrides?: MotionPresetOverrides })[]", description: "Sequence steps or preset names." },
    ],
    choreography: {
      mode: "sequence",
      steps: [
        { preset: "slideUp", duration: 500 },
        { preset: "fadeIn", duration: 400 },
        { preset: "scaleIn", duration: 350 },
      ],
    },
  },
  {
    id: "preset-modal-presentation",
    name: "modalPresentation",
    category: "choreography",
    description: "Coordinated dialog entrance: backdrop fade and dialog zoom.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["choreography", "modal", "dialog", "presentation"],
    signature: {
      importStatement: 'import { composePresetSequence } from "af-motion/presets";',
      invocation: 'composePresetSequence(target, ["fadeIn", "zoomIn"])',
      exampleCode: 'composePresetSequence(".modal-root", ["fadeIn", "zoomIn"]);',
    },
    configurableParameters: [
      { name: "steps", type: "readonly (string | { preset: string; overrides?: MotionPresetOverrides })[]", description: "Modal entrance steps." },
    ],
    choreography: {
      mode: "sequence",
      steps: [
        { preset: "fadeIn", duration: 250 },
        { preset: "zoomIn", duration: 350 },
      ],
    },
  },
  {
    id: "preset-card-deck-stagger",
    name: "cardDeckStagger",
    category: "choreography",
    description: "Sequential list or grid card entrance.",
    supportedTargets: ["HTMLElement", "SVGElement", "AnimateTarget"],
    reducedMotion: "skips-to-endpoint",
    tags: ["choreography", "cards", "stagger", "list"],
    signature: {
      importStatement: 'import { composePresetSequence } from "af-motion/presets";',
      invocation: 'composePresetSequence(target, ["slideUp", "fadeIn"])',
      exampleCode: 'composePresetSequence(".card-deck", ["slideUp", "fadeIn"]);',
    },
    configurableParameters: [
      { name: "steps", type: "readonly (string | { preset: string; overrides?: MotionPresetOverrides })[]", description: "Stagger steps." },
    ],
    choreography: {
      mode: "sequence",
      steps: [
        { preset: "slideUp", duration: 400 },
        { preset: "fadeIn", duration: 300 },
      ],
    },
  },
];

// Pre-freeze all built-in presets
for (const preset of BUILT_IN_MOTION_PRESETS) {
  freezeDeep(preset);
}

// Internal Lookup Stores
const PRESETS_BY_ID = new Map<string, MotionPreset>();
const PRESETS_BY_NAME = new Map<string, MotionPreset>();
const PRESETS_BY_CATEGORY = new Map<MotionPresetCategory, MotionPreset[]>();

for (const cat of MOTION_PRESET_CATEGORIES) {
  PRESETS_BY_CATEGORY.set(cat, []);
}

for (const preset of BUILT_IN_MOTION_PRESETS) {
  PRESETS_BY_ID.set(preset.id, preset);
  PRESETS_BY_NAME.set(preset.name, preset);
  PRESETS_BY_CATEGORY.get(preset.category)?.push(preset);
}

const BUILT_IN_IDS = new Set(BUILT_IN_MOTION_PRESETS.map((p) => p.id));
const BUILT_IN_NAMES = new Set(BUILT_IN_MOTION_PRESETS.map((p) => p.name));
const customPresetsById = new Map<string, MotionPreset>();
const customPresetsByName = new Map<string, MotionPreset>();

/**
 * Returns all registered motion presets (built-in and custom).
 */
export function listPresets(): readonly MotionPreset[] {
  const custom = Array.from(customPresetsById.values());
  return Object.freeze([...BUILT_IN_MOTION_PRESETS, ...custom]);
}

/**
 * Returns all valid motion preset categories.
 */
export function listPresetCategories(): readonly MotionPresetCategory[] {
  return MOTION_PRESET_CATEGORIES;
}

/**
 * Looks up a preset by its ID or friendly name.
 */
export function getPreset(idOrName: string): MotionPreset | undefined {
  if (typeof idOrName !== "string" || idOrName.trim() === "") return undefined;
  const key = idOrName.trim();
  return (
    PRESETS_BY_ID.get(key) ??
    PRESETS_BY_NAME.get(key) ??
    customPresetsById.get(key) ??
    customPresetsByName.get(key)
  );
}

/**
 * Returns all presets registered under a specific category.
 */
export function getPresetsByCategory(category: MotionPresetCategory): readonly MotionPreset[] {
  const builtIn = PRESETS_BY_CATEGORY.get(category) ?? [];
  const custom = Array.from(customPresetsById.values()).filter((p) => p.category === category);
  return Object.freeze([...builtIn, ...custom]);
}

/**
 * Searches presets by keyword query matching ID, name, description, category, or tags.
 */
export function searchPresets(query: string): readonly MotionPreset[] {
  if (!query || typeof query !== "string") return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return [];

  const all = listPresets();
  return Object.freeze(
    all.filter((preset) => {
      return (
        preset.id.toLowerCase().includes(normalized) ||
        preset.name.toLowerCase().includes(normalized) ||
        preset.category.toLowerCase().includes(normalized) ||
        preset.description.toLowerCase().includes(normalized) ||
        preset.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    }),
  );
}

/**
 * Registers a new custom motion preset. Built-in IDs and names are reserved.
 */
export function registerPreset(preset: MotionPreset): void {
  const validation = validatePreset(preset);
  if (!validation.valid) {
    throw new TypeError(`Cannot register invalid preset: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  if (BUILT_IN_IDS.has(preset.id) || BUILT_IN_NAMES.has(preset.name)) {
    throw new TypeError(`Cannot overwrite built-in preset "${preset.id}" ("${preset.name}")`);
  }

  const frozen = freezeDeep({ ...preset });
  customPresetsById.set(frozen.id, frozen);
  customPresetsByName.set(frozen.name, frozen);
}

/**
 * Removes a custom motion preset. Built-in presets cannot be removed.
 */
export function removePreset(idOrName: string): boolean {
  if (typeof idOrName !== "string" || idOrName.trim() === "") return false;
  const key = idOrName.trim();
  if (BUILT_IN_IDS.has(key) || BUILT_IN_NAMES.has(key)) return false;

  const preset = customPresetsById.get(key) ?? customPresetsByName.get(key);
  if (!preset) return false;

  customPresetsById.delete(preset.id);
  customPresetsByName.delete(preset.name);
  return true;
}

/**
 * Validates a preset definition against required fields and constraints.
 */
export function validatePreset(preset: unknown): PresetValidationResult {
  const errors: PresetValidationError[] = [];
  if (preset === null || typeof preset !== "object" || Array.isArray(preset)) {
    return { valid: false, errors: [{ message: "Preset must be a non-null object" }] };
  }

  const p = preset as Partial<MotionPreset>;

  if (typeof p.id !== "string" || p.id.trim() === "") {
    errors.push({ parameter: "id", message: "Preset id must be a non-empty string" });
  }
  if (typeof p.name !== "string" || p.name.trim() === "") {
    errors.push({ parameter: "name", message: "Preset name must be a non-empty string" });
  }
  if (!p.category || !MOTION_PRESET_CATEGORIES.includes(p.category)) {
    errors.push({
      parameter: "category",
      message: `Preset category must be one of: ${MOTION_PRESET_CATEGORIES.join(", ")}`,
    });
  }
  if (typeof p.description !== "string" || p.description.trim().length < 5) {
    errors.push({ parameter: "description", message: "Preset description must be at least 5 characters" });
  }
  if (!Array.isArray(p.supportedTargets) || p.supportedTargets.length === 0) {
    errors.push({ parameter: "supportedTargets", message: "Preset supportedTargets must be a non-empty array" });
  }
  if (!p.animation && !p.choreography) {
    errors.push({ parameter: "animation", message: "Preset must define either 'animation' or 'choreography'" });
  }

  if (p.animation) {
    if (!p.animation.properties || typeof p.animation.properties !== "object" || Object.keys(p.animation.properties).length === 0) {
      errors.push({ parameter: "animation.properties", message: "Animation properties must be a non-empty object" });
    } else {
      for (const [propName, values] of Object.entries(p.animation.properties)) {
        if (!Array.isArray(values) || values.length < 2) {
          errors.push({
            parameter: `animation.properties.${propName}`,
            message: `Keyframe property "${propName}" must be a [from, to, ...] array with at least 2 values`,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates options overrides before applying a preset.
 */
export function validatePresetOverrides(
  presetIdOrName: string,
  overrides: unknown,
): PresetValidationResult {
  const errors: PresetValidationError[] = [];
  const preset = getPreset(presetIdOrName);
  if (!preset) {
    return {
      valid: false,
      errors: [{ message: `Unknown preset "${presetIdOrName}"` }],
    };
  }

  if (overrides === undefined || overrides === null) {
    return { valid: true, errors: [] };
  }

  if (typeof overrides !== "object" || Array.isArray(overrides)) {
    return {
      valid: false,
      errors: [{ message: "Overrides must be an object" }],
    };
  }

  const o = overrides as Record<string, unknown>;

  if (o.designSystem !== undefined) {
    if (typeof o.designSystem !== "string" && (typeof o.designSystem !== "object" || o.designSystem === null)) {
      errors.push({ parameter: "designSystem", message: "designSystem must be a string name or DesignSystem object" });
    }
  }

  if (o.adaptive !== undefined) {
    if (typeof o.adaptive !== "boolean" && (typeof o.adaptive !== "object" || o.adaptive === null)) {
      errors.push({ parameter: "adaptive", message: "adaptive must be a boolean or AdaptiveMotionConditions object" });
    }
  }

  if (o.motionDNA !== undefined) {
    if (typeof o.motionDNA !== "string" && (typeof o.motionDNA !== "object" || o.motionDNA === null)) {
      errors.push({ parameter: "motionDNA", message: "motionDNA must be a string name or MotionDNA object" });
    }
  }

  if (o.duration !== undefined) {
    if (typeof o.duration !== "number" || !Number.isFinite(o.duration) || o.duration < 0) {
      errors.push({ parameter: "duration", message: "duration must be a finite number >= 0" });
    }
  }
  if (o.delay !== undefined) {
    if (typeof o.delay !== "number" || !Number.isFinite(o.delay) || o.delay < 0) {
      errors.push({ parameter: "delay", message: "delay must be a finite number >= 0" });
    }
  }
  if (o.repeat !== undefined) {
    if (typeof o.repeat !== "number" || o.repeat < 0) {
      errors.push({ parameter: "repeat", message: "repeat must be a number >= 0" });
    }
  }
  if (o.playbackRate !== undefined) {
    if (typeof o.playbackRate !== "number" || !Number.isFinite(o.playbackRate) || o.playbackRate <= 0) {
      errors.push({ parameter: "playbackRate", message: "playbackRate must be a finite number > 0" });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Resolves a preset's animation properties and merged options without mutating the registered preset.
 */
export function resolvePresetAnimation(
  presetIdOrName: string,
  overrides?: MotionPresetOverrides,
): { properties: AnimatableProperties; options: DOMAnimationOptions } {
  const preset = getPreset(presetIdOrName);
  if (!preset) {
    throw new TypeError(`Unknown motion preset "${presetIdOrName}"`);
  }
  if (!preset.animation) {
    throw new TypeError(`Preset "${presetIdOrName}" is a choreography preset and does not have direct animation properties`);
  }

  const validation = validatePresetOverrides(presetIdOrName, overrides);
  if (!validation.valid) {
    throw new TypeError(`Invalid preset overrides: ${validation.errors.map((e) => e.message).join(", ")}`);
  }

  // Deep clone properties
  const clonedProperties: AnimatableProperties = {};
  for (const [key, values] of Object.entries(preset.animation.properties)) {
    clonedProperties[key] = [...values] as unknown as (typeof clonedProperties)[string];
  }

  // Resolve Design System & Motion DNA if provided
  const ds = overrides?.designSystem ? resolveDesignSystem(overrides.designSystem) : undefined;
  const dna = overrides?.motionDNA
    ? resolveMotionDNA(overrides.motionDNA)
    : ds?.resolvedMotionDNA;

  // Category-aware easing resolution from Motion DNA and Design System
  let dnaEasing = dna?.easing;
  if (preset.category === "entrance" && dna?.characteristics?.entranceEasing) {
    dnaEasing = dna.characteristics.entranceEasing;
  } else if (preset.category === "exit" && dna?.characteristics?.exitEasing) {
    dnaEasing = dna.characteristics.exitEasing;
  } else if ((preset.category === "hover" || preset.category === "click-interaction") && dna?.characteristics?.interactionEasing) {
    dnaEasing = dna.characteristics.interactionEasing;
  }

  // Design system easing preferences take precedence over raw DNA
  let dsEasing = ds?.easings?.standard;
  if (preset.category === "entrance" && ds?.easings?.entrance) {
    dsEasing = ds.easings.entrance;
  } else if (preset.category === "exit" && ds?.easings?.exit) {
    dsEasing = ds.easings.exit;
  }

  // Category-aware duration resolution with multipliers
  let dnaDuration = dna?.duration;
  if (dnaDuration !== undefined && dna?.characteristics) {
    if (preset.category === "exit" && dna.characteristics.exitDurationMultiplier) {
      dnaDuration = Math.round(dnaDuration * dna.characteristics.exitDurationMultiplier);
    } else if (preset.category === "hover" && dna.characteristics.hoverDurationMultiplier) {
      dnaDuration = Math.round(dnaDuration * dna.characteristics.hoverDurationMultiplier);
    } else if (preset.category === "click-interaction" && dna.characteristics.pressDurationMultiplier) {
      dnaDuration = Math.round(dnaDuration * dna.characteristics.pressDurationMultiplier);
    }
  }

  // Design system timing scale takes precedence over raw DNA
  let dsDuration: number | undefined;
  if (ds?.timing) {
    if (preset.category === "exit" && ds.timing.fast !== undefined) {
      dsDuration = ds.timing.fast;
    } else if ((preset.category === "hover" || preset.category === "click-interaction") && ds.timing.fastest !== undefined) {
      dsDuration = ds.timing.fastest;
    } else if (ds.timing.normal !== undefined) {
      dsDuration = ds.timing.normal;
    } else if (ds.timing.standard !== undefined) {
      dsDuration = ds.timing.standard;
    }
  }

  // Precedence: Preset defaults < Motion DNA defaults < Design System < Runtime overrides
  const mergedOptions: DOMAnimationOptions = {
    duration: overrides?.duration ?? dsDuration ?? dnaDuration ?? preset.animation.duration,
    easing: (overrides?.easing ?? dsEasing ?? dnaEasing ?? preset.animation.easing) as DOMAnimationOptions["easing"],
    delay: overrides?.delay ?? dna?.delay ?? preset.animation.delay,
    repeat: overrides?.repeat ?? preset.animation.repeat,
    yoyo: overrides?.yoyo ?? preset.animation.yoyo,
    playbackRate: overrides?.playbackRate ?? dna?.playbackRate ?? preset.animation.playbackRate,
    respectReducedMotion: overrides?.respectReducedMotion !== undefined ? overrides.respectReducedMotion : true,
    ...(overrides?.propertyEasing ? { propertyEasing: overrides.propertyEasing } : {}),
    ...(overrides?.propertyKeyframeOffsets ? { propertyKeyframeOffsets: overrides.propertyKeyframeOffsets } : {}),
    ...(overrides?.fill ? { fill: overrides.fill } : {}),
  };

  let finalOptions: DOMAnimationOptions = mergedOptions;
  if (overrides?.adaptive) {
    const adaptiveConditions = typeof overrides.adaptive === "object" ? overrides.adaptive : undefined;
    finalOptions = adaptAnimationOptions(mergedOptions, adaptiveConditions);
  }

  return {
    properties: clonedProperties,
    options: finalOptions,
  };
}

/**
 * Applies a registered preset to a target element through the core animate engine.
 */

/**
 * Applies a registered preset to a target element adapting timing according to runtime context.
 */
export function applyAdaptivePreset(
  target: AnimateTarget,
  presetIdOrName: string,
  conditions?: AdaptiveMotionConditions,
  overrides?: MotionPresetOverrides,
): AnimationControls {
  const mergedOverrides: MotionPresetOverrides = {
    ...overrides,
    adaptive: conditions ?? true,
  };
  return applyPreset(target, presetIdOrName, mergedOverrides);
}

export function applyPreset(
  target: AnimateTarget,
  presetIdOrName: string,
  overrides?: MotionPresetOverrides,
): AnimationControls {
  const { properties, options } = resolvePresetAnimation(presetIdOrName, overrides);
  return animate(target, properties, options);
}

/**
 * Converts a preset into an AnimationSequenceStep for composition.
 */
export function presetToSequenceStep(
  target: AnimateTarget,
  presetIdOrName: string,
  overrides?: MotionPresetOverrides,
): AnimationSequenceStep {
  const { properties, options } = resolvePresetAnimation(presetIdOrName, overrides);
  return {
    target,
    properties,
    options,
  };
}

/**
 * Converts a preset into an AnimationParallelStep for composition.
 */
export function presetToParallelStep(
  target: AnimateTarget,
  presetIdOrName: string,
  overrides?: MotionPresetOverrides,
): AnimationParallelStep {
  const { properties, options } = resolvePresetAnimation(presetIdOrName, overrides);
  return {
    target,
    properties,
    options,
  };
}

/**
 * Composes multiple presets to run in sequence against a target.
 */
export function composePresetSequence(
  target: AnimateTarget,
  steps: readonly (string | { preset: string; overrides?: MotionPresetOverrides })[],
  options?: AnimationSequenceOptions,
): AnimationSequenceControls {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new TypeError("composePresetSequence requires a non-empty array of steps");
  }

  const sequenceSteps: AnimationSequenceStep[] = steps.map((item) => {
    if (typeof item === "string") {
      return presetToSequenceStep(target, item);
    }
    return presetToSequenceStep(target, item.preset, item.overrides);
  });

  return animateSequence(sequenceSteps, options);
}

/**
 * Composes multiple presets to run in parallel against individual targets.
 */
export function composePresetParallel(
  steps: readonly { target: AnimateTarget; preset: string; overrides?: MotionPresetOverrides }[],
  options?: AnimationParallelOptions,
): AnimationParallelControls {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new TypeError("composePresetParallel requires a non-empty array of steps");
  }

  const parallelSteps: AnimationParallelStep[] = steps.map((step) => {
    return presetToParallelStep(step.target, step.preset, step.overrides);
  });

  return animateParallel(parallelSteps, options);
}

/**
 * Exports all presets as a serialized JSON string.
 */
export function exportPresetsJson(pretty = true): string {
  return JSON.stringify(listPresets(), null, pretty ? 2 : 0);
}

/**
 * Exports a versioned preset document object for AI agents and developer tooling.
 */
export function exportPresetDocument(): PresetDocument {
  const all = listPresets();
  return {
    $schema: "https://af-motion.dev/schemas/presets-v1.json",
    version: PRESET_SCHEMA_VERSION,
    totalPresets: all.length,
    categories: MOTION_PRESET_CATEGORIES,
    presets: all,
  };
}
export {
  BUILT_IN_MOTION_DNA,
  MOTION_DNA_SCHEMA_VERSION,
  applyMotionDNA,
  cloneMotionDNA,
  exportMotionDNADocument,
  exportMotionDNAJson,
  getMotionDNA,
  importMotionDNAFromJson,
  listMotionDNA,
  motionDNARegistry,
  registerMotionDNA,
  removeMotionDNA,
  resolveMotionDNA,
  searchMotionDNA,
  validateMotionDNA,
  type MotionDNA,
  type MotionDNACharacteristics,
  type MotionDNAConfigurableParameter,
  type MotionDNADocument,
  type MotionDNAOverrides,
  type MotionDNAPersonality,
  type MotionDNAProfileMetadata,
  type MotionDNARegistryApi,
  type MotionDNASpringConfig,
  type MotionDNAValidationError,
  type MotionDNAValidationResult,
} from "./core/motion-dna.js";

// --- Re-exports from Adaptive Motion System ---
export {
  ADAPTIVE_MOTION_SCHEMA_VERSION,
  adaptAnimationOptions,
  detectRuntimeContext,
  disableAdaptiveMotion,
  enableAdaptiveMotion,
  getAdaptiveMotionConfig,
  inspectAdaptiveMotion,
  isAdaptiveMotionEnabled,
  resetAdaptiveMotionConfig,
  resolveAdaptiveMotion,
  setAdaptiveMotionConfig,
  setAdaptiveMotionEnabled,
  subscribeAdaptiveMotion,
  type AdaptiveMotionConditions,
  type AdaptiveMotionConfig,
  type AdaptiveMotionOverrides,
  type AdaptiveMotionProfile,
  type AdaptiveMotionState,
  type AdaptiveReducedMotion,
  type RuntimeContext,
} from "./core/adaptive-motion.js";

// --- Re-exports from Design System ---
export {
  BUILT_IN_DESIGN_SYSTEMS,
  DESIGN_SYSTEM_SCHEMA_VERSION,
  cloneDesignSystem,
  createDesignSystem,
  exportDesignSystemJson,
  exportDesignSystemsDocument,
  getActiveDesignSystem,
  getDesignSystem,
  importDesignSystemFromJson,
  listDesignSystems,
  registerDesignSystem,
  removeDesignSystem,
  resetDesignSystemRegistry,
  resolveDesignSystem,
  resolveDesignToken,
  resolveMotionTiming,
  resolveMovementDistance,
  searchDesignSystems,
  setActiveDesignSystem,
  subscribeToDesignSystem,
  validateDesignSystem,
  type DesignSystem,
  type DesignSystemDefinition,
  type DesignSystemEasingTokens,
  type DesignSystemInteractionTokens,
  type DesignSystemMetadata,
  type DesignSystemMotionTimingTokens,
  type DesignSystemSpacingTokens,
  type DesignSystemsDocument,
  type DesignSystemTypographyTokens,
  type DesignSystemValidationError,
  type DesignSystemValidationResult,
} from "./core/design-system.js";

// --- Re-exports from Motion Choreography ---
export {
  BUILT_IN_CHOREOGRAPHIES,
  CHOREOGRAPHY_SCHEMA_VERSION,
  createMotionChoreography,
  exportChoreographiesDocument,
  exportChoreographyJson,
  getChoreography,
  importChoreographyFromJson,
  listChoreographies,
  registerChoreography,
  removeChoreography,
  resetChoreographyRegistry,
  searchChoreographies,
  validateChoreography,
  type ChoreographiesDocument,
  type ChoreographyDefinition,
  type ChoreographyMetadata,
  type ChoreographyQuery,
  type ChoreographyRunOptions,
  type ChoreographyTargetMap,
  type ChoreographyValidationError,
  type ChoreographyValidationResult,
  type MotionChoreographyAction,
  type MotionChoreographyAnimation,
  type MotionChoreographyBranch,
  type MotionChoreographyControls,
  type MotionChoreographyEffect,
  type MotionChoreographyParallel,
  type MotionChoreographyPreset,
  type MotionChoreographyRecipe,
  type MotionChoreographySequence,
} from "./core/motion-choreography.js";

// --- Re-exports from Motion Recipe System ---
export {
  BUILT_IN_MOTION_RECIPES,
  RECIPE_SCHEMA_VERSION,
  composeRecipe,
  runRecipe,
  registerRecipe,
  getRecipe,
  listRecipes,
  searchRecipes,
  removeRecipe,
  validateRecipe,
  validateRecipeRunOptions,
  exportRecipeJson,
  exportRecipesDocument,
  importRecipeFromJson,
  type DeclarativeMotionRecipe,
  type RecipeStep,
  type RecipePresetStep,
  type RecipeParallelStep,
  type RecipeSequenceStep,
  type RecipeNestedStep,
  type RecipeParameterSchema,
  type RecipeTargetMap,
  type RecipeRunOptions,
  type RecipeValidationError,
  type RecipeValidationResult,
  type RecipesDocument,
} from "./core/motion-recipe.js";
