/**
 * AF Motion Effect & Capability Catalogue
 *
 * Machine-readable registry allowing AI agents, MCP tools, and developer tools
 * to discover, inspect, configure, and compose AF Motion's public capabilities.
 */

export const SCHEMA_VERSION = "1.0.0";

import { setDefaultRegistryResolver } from "./core/natural-motion.js";
import { setDesignRegistryResolver } from "./core/design-intelligence.js";
import { setCompositionRegistryResolver } from "./core/composition.js";
import { setCorrectorRegistryResolver } from "./core/configuration-corrector.js";
import { setGenerationPipelineRegistryResolver } from "./core/generation-pipeline.js";

import {
  SCHEMA_SPEC_VERSION,
  createSchemaId,
  validateSchema,
  validateConfiguration,
  resolveConfigurationDefaults,
  createUnifiedSchema,
  type UnifiedMotionSchema,
  type SchemaPropertyDescriptor,
  type SchemaPropertyType,
  type SchemaCapabilityCategory,
  type ConfigurationValidationError,
  type ConfigurationValidationOptions,
  type ConfigurationValidationResult,
  type SchemaValidationError,
  type SchemaValidationResult,
  type SchemasDocument,
  type SchemaFilterOptions,
} from "./core/schema.js";
import {
  createAIMotionRegistry,
  validateCapability,
  deriveJsonSchemaFromParameters,
  type AIMotionCapability,
  type AIMotionCategory,
  type AIMotionRegistry,
  type CapabilityAccessibilityMetadata,
  type CapabilityConfigurationProperty,
  type CapabilityConfigurationSchema,
  type CapabilityDependencies,
  type CapabilityExample,
  type CapabilityFilterOptions,
  type CapabilityReactMetadata,
  type CapabilityRegistrationValidationError,
  type CapabilitySchemaInfo,
  type CapabilitySearchQuery,
  type CapabilityValidationResult,
  type RegistryDocument,
  type RegistryExportOptions,
} from "./core/ai-motion-registry.js";
import { BUILT_IN_MOTION_PRESETS, type MotionPreset } from "./presets.js";
import { BUILT_IN_MOTION_RECIPES, type DeclarativeMotionRecipe } from "./core/motion-recipe.js";
import { BUILT_IN_MOTION_DNA, type MotionDNA } from "./core/motion-dna.js";
import { BUILT_IN_DESIGN_SYSTEMS, type DesignSystem } from "./core/design-system.js";
import { BUILT_IN_CHOREOGRAPHIES, type ChoreographyDefinition } from "./core/motion-choreography.js";
import { listPalettes, getPalette } from "./core/palettes.js";

export type CapabilityCategory =
  | "core-animation"
  | "visual-effect"
  | "text-effect"
  | "background"
  | "pointer"
  | "scroll"
  | "svg"
  | "gesture"
  | "composition"
  | "react";

export type ReducedMotionBehavior =
  | "skips-to-endpoint"
  | "disables-animation"
  | "static-fallback"
  | "respects-profile"
  | "not-applicable";

export type ParameterKind = "positional" | "option" | "prop";

export interface ParameterMetadata {
  readonly name: string;
  readonly kind: ParameterKind;
  readonly type: string;
  readonly required: boolean;
  readonly default?: unknown;
  readonly description: string;
  readonly placeholder?: string;
  readonly range?: { readonly min?: number; readonly max?: number };
  readonly enum?: readonly (string | number)[];
  readonly itemType?: string;
  readonly dependsOn?: string;
  readonly example?: unknown;
}

export interface CallbackParameterDescriptor {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

export interface CallbackDescriptor {
  readonly name: string;
  readonly parameters: readonly CallbackParameterDescriptor[];
  readonly returnType: string;
  readonly description: string;
}

export interface CompatibilityMetadata {
  readonly browser: boolean;
  readonly ssr: boolean;
  readonly requiresCanvas?: boolean;
  readonly requiresDom?: boolean;
}

export interface UsageSignature {
  readonly importStatement: string;
  readonly invocation: string;
  readonly exampleCode: string;
}

export interface CapabilityMetadata {
  readonly id: string;
  readonly name: string;
  readonly category: CapabilityCategory;
  readonly description: string;
  readonly supportedTargets: readonly string[];
  readonly signature: UsageSignature;
  readonly parameters: readonly ParameterMetadata[];
  readonly controls: readonly string[];
  readonly callbacks: readonly string[];
  readonly callbackDescriptors?: readonly CallbackDescriptor[];
  readonly reducedMotion: ReducedMotionBehavior;
  readonly compatibility: CompatibilityMetadata;
  readonly tags?: readonly string[];
}

export interface ValidationError {
  readonly parameter?: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

export interface CatalogueDocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalCapabilities: number;
  readonly categories: readonly CapabilityCategory[];
  readonly capabilities: readonly CapabilityMetadata[];
}

export const CAPABILITY_CATEGORIES: readonly CapabilityCategory[] = [
  "core-animation",
  "visual-effect",
  "text-effect",
  "background",
  "pointer",
  "scroll",
  "svg",
  "gesture",
  "composition",
  "react",
] as const;

// Common callbacks
const STANDARD_ANIMATION_CALLBACKS: readonly CallbackDescriptor[] = [
  {
    name: "onStart",
    parameters: [],
    returnType: "void",
    description: "Fires once when the animation starts, after any configured delay.",
  },
  {
    name: "onUpdate",
    parameters: [
      { name: "progress", type: "number", description: "Current normalized eased progress between 0 and 1." },
    ],
    returnType: "void",
    description: "Fires for each animation frame with eased progress.",
  },
  {
    name: "onComplete",
    parameters: [],
    returnType: "void",
    description: "Fires once when the animation reaches its final endpoint.",
  },
  {
    name: "onCancel",
    parameters: [],
    returnType: "void",
    description: "Fires once when an active animation is explicitly cancelled.",
  },
];

const SEQUENCE_CALLBACKS: readonly CallbackDescriptor[] = [
  {
    name: "onStart",
    parameters: [],
    returnType: "void",
    description: "Fires once when the first step starts playing.",
  },
  {
    name: "onComplete",
    parameters: [],
    returnType: "void",
    description: "Fires once when all steps in the sequence have completed successfully.",
  },
  {
    name: "onCancel",
    parameters: [],
    returnType: "void",
    description: "Fires once when the sequence is explicitly cancelled.",
  },
];

const VIEWPORT_CALLBACKS: readonly CallbackDescriptor[] = [
  {
    name: "onEnter",
    parameters: [
      { name: "element", type: "HTMLElement", description: "The DOM element that entered the viewport." },
      { name: "entry", type: "IntersectionObserverEntry", description: "The intersection observer record." },
    ],
    returnType: "void | (() => void)",
    description: "Fires when the element enters the visible region. May return an exit cleanup function.",
  },
  {
    name: "onLeave",
    parameters: [
      { name: "element", type: "HTMLElement", description: "The DOM element that left the viewport." },
      { name: "entry", type: "IntersectionObserverEntry", description: "The intersection observer record." },
    ],
    returnType: "void",
    description: "Fires when the element leaves the visible region.",
  },
  {
    name: "onChange",
    parameters: [
      { name: "isInView", type: "boolean", description: "True if element is currently inside the viewport threshold." },
      { name: "element", type: "HTMLElement", description: "The observed element." },
      { name: "entry", type: "IntersectionObserverEntry", description: "Intersection observer record." },
    ],
    returnType: "void",
    description: "Fires on any enter or leave transition with updated boolean state.",
  },
];

export const CAPABILITIES: readonly CapabilityMetadata[] = [
  // --- Core Animations ---
  {
    id: "core-animate",
    name: "animate",
    category: "core-animation",
    description: "High-performance DOM animation engine with transform decomposition, color interpolation, and conflict resolution.",
    supportedTargets: ["HTMLElement", "SVGElement", "string (CSS selector)"],
    signature: {
      importStatement: 'import { animate } from "af-motion";',
      invocation: "animate(target, properties, options?)",
      exampleCode: 'const controls = animate(".box", { opacity: [0, 1], transform: ["scale(0.8)", "scale(1)"] }, { duration: 600, easing: "easeOutCubic" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Target element, selector, or collection to animate." },
      { name: "properties", kind: "positional", type: "AnimatableProperties", required: true, description: "Keyframe property mappings (e.g. { opacity: [0, 1], transform: 'scale(1.2)' }).", example: { opacity: [0, 1] } },
      { name: "duration", kind: "option", type: "number", required: false, default: 1000, range: { min: 0 }, description: "Duration in milliseconds.", example: 800 },
      { name: "delay", kind: "option", type: "number", required: false, default: 0, range: { min: 0 }, description: "Delay in milliseconds before starting.", example: 200 },
      { name: "easing", kind: "option", type: "EasingOption", required: false, default: "linear", description: "Easing function or registered easing name.", example: "easeOutQuad" },
      { name: "repeat", kind: "option", type: "number", required: false, default: 0, range: { min: 0 }, description: "Repeat iterations (Infinity for infinite loop).", example: 2 },
      { name: "yoyo", kind: "option", type: "boolean", required: false, default: false, dependsOn: "repeat", description: "Alternate playback direction on each repeat." },
      { name: "playbackRate", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Playback speed multiplier." },
      { name: "respectReducedMotion", kind: "option", type: "boolean", required: false, default: true, description: "Whether to jump to endpoint when reduced motion is preferred." },
    ],
    controls: ["seek", "pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onStart", "onUpdate", "onComplete", "onCancel"],
    callbackDescriptors: STANDARD_ANIMATION_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["core", "tween", "dom", "keyframes"],
  },
  {
    id: "core-animate-progress",
    name: "animateProgress",
    category: "core-animation",
    description: "Normalized 0..1 timeline driver with repeats, yoyo, easing, and frame synchronization.",
    supportedTargets: ["virtual (no DOM requirement)"],
    signature: {
      importStatement: 'import { animateProgress } from "af-motion";',
      invocation: "animateProgress(options?)",
      exampleCode: 'const controls = animateProgress({ duration: 1000, onUpdate: (p) => render(p) });',
    },
    parameters: [
      { name: "duration", kind: "option", type: "number", required: false, default: 1000, range: { min: 0 }, description: "Duration in milliseconds." },
      { name: "delay", kind: "option", type: "number", required: false, default: 0, range: { min: 0 }, description: "Delay in milliseconds." },
      { name: "easing", kind: "option", type: "EasingOption", required: false, default: "linear", description: "Easing function or registered name." },
      { name: "repeat", kind: "option", type: "number", required: false, default: 0, range: { min: 0 }, description: "Repeat count." },
      { name: "yoyo", kind: "option", type: "boolean", required: false, default: false, dependsOn: "repeat", description: "Yoyo playback." },
      { name: "playbackRate", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Speed multiplier." },
    ],
    controls: ["seek", "pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onStart", "onUpdate", "onComplete", "onCancel"],
    callbackDescriptors: STANDARD_ANIMATION_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: false },
    tags: ["timeline", "driver", "progress"],
  },
  {
    id: "core-animate-spring",
    name: "animateSpring",
    category: "core-animation",
    description: "Analytical spring physics animation driver with stiffness, damping, mass, and velocity.",
    supportedTargets: ["numerical"],
    signature: {
      importStatement: 'import { animateSpring } from "af-motion";',
      invocation: "animateSpring(options)",
      exampleCode: 'const controls = animateSpring({ from: 0, to: 100, stiffness: 200, onUpdate: ({ position }) => move(position) });',
    },
    parameters: [
      { name: "from", kind: "option", type: "number", required: false, default: 0, description: "Initial numerical value." },
      { name: "to", kind: "option", type: "number", required: false, default: 1, description: "Target numerical endpoint." },
      { name: "stiffness", kind: "option", type: "number", required: false, default: 170, range: { min: 0 }, description: "Spring stiffness." },
      { name: "damping", kind: "option", type: "number", required: false, default: 26, range: { min: 0 }, description: "Damping factor." },
      { name: "mass", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Spring mass." },
      { name: "initialVelocity", kind: "option", type: "number", required: false, default: 0, description: "Initial velocity." },
    ],
    controls: ["cancel"],
    callbacks: ["onUpdate", "onComplete"],
    callbackDescriptors: [
      {
        name: "onUpdate",
        parameters: [
          { name: "update", type: "SpringUpdate", description: "Contains position, velocity, and settled boolean." },
        ],
        returnType: "void",
        description: "Called on each physics integration step.",
      },
      {
        name: "onComplete",
        parameters: [],
        returnType: "void",
        description: "Called when spring oscillations settle below resting threshold.",
      },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: false },
    tags: ["physics", "spring", "motion"],
  },
  {
    id: "core-animate-inertia",
    name: "animateInertia",
    category: "core-animation",
    description: "Friction-based momentum and deceleration physics simulator with boundary bounce.",
    supportedTargets: ["numerical"],
    signature: {
      importStatement: 'import { animateInertia } from "af-motion";',
      invocation: "animateInertia(options)",
      exampleCode: 'const controls = animateInertia({ from: 0, velocity: 800, friction: 0.92, onUpdate: ({ position }) => scroll(position) });',
    },
    parameters: [
      { name: "from", kind: "option", type: "number", required: false, default: 0, description: "Initial position." },
      { name: "velocity", kind: "option", type: "number", required: false, default: 0, description: "Initial velocity in px/s." },
      { name: "friction", kind: "option", type: "number", required: false, default: 0.95, range: { min: 0, max: 1 }, description: "Friction coefficient." },
      { name: "min", kind: "option", type: "number", required: false, description: "Lower boundary limit." },
      { name: "max", kind: "option", type: "number", required: false, description: "Upper boundary limit." },
    ],
    controls: ["cancel"],
    callbacks: ["onUpdate", "onComplete"],
    callbackDescriptors: [
      {
        name: "onUpdate",
        parameters: [
          { name: "update", type: "InertiaUpdate", description: "Contains position, velocity, and settled boolean." },
        ],
        returnType: "void",
        description: "Called on each deceleration integration frame.",
      },
      {
        name: "onComplete",
        parameters: [],
        returnType: "void",
        description: "Called when momentum decays to zero.",
      },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: false },
    tags: ["physics", "inertia", "momentum", "friction"],
  },
  {
    id: "core-animate-sequence",
    name: "animateSequence",
    category: "core-animation",
    description: "Runs an ordered sequence of animation steps across multiple targets with unified playback controls.",
    supportedTargets: ["HTMLElement", "string (CSS selector)"],
    signature: {
      importStatement: 'import { animateSequence } from "af-motion";',
      invocation: "animateSequence(steps, options?)",
      exampleCode: 'const seq = animateSequence([{ target: ".title", properties: { opacity: [0, 1] } }, { target: ".body", properties: { transform: ["translateY(20px)", "translateY(0)"] } }]);',
    },
    parameters: [
      { name: "steps", kind: "positional", type: "readonly AnimationSequenceStep[]", required: true, description: "Array of animation steps." },
      { name: "autoplay", kind: "option", type: "boolean", required: false, default: true, description: "Whether to play immediately." },
    ],
    controls: ["pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onStart", "onComplete", "onCancel"],
    callbackDescriptors: SEQUENCE_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["sequence", "orchestration", "chain"],
  },
  {
    id: "core-animate-parallel",
    name: "animateParallel",
    category: "core-animation",
    description: "Runs multiple concurrent animation tracks across different targets with synchronized lifecycle.",
    supportedTargets: ["HTMLElement", "string (CSS selector)"],
    signature: {
      importStatement: 'import { animateParallel } from "af-motion";',
      invocation: "animateParallel(steps, options?)",
      exampleCode: 'const parallel = animateParallel([{ target: ".left", properties: { opacity: [0, 1] } }, { target: ".right", properties: { opacity: [0, 1] } }]);',
    },
    parameters: [
      { name: "steps", kind: "positional", type: "readonly AnimationParallelStep[]", required: true, description: "Array of parallel animation steps." },
      { name: "autoplay", kind: "option", type: "boolean", required: false, default: true, description: "Whether to play immediately." },
    ],
    controls: ["pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onStart", "onComplete", "onCancel"],
    callbackDescriptors: SEQUENCE_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["parallel", "orchestration", "concurrent"],
  },
  {
    id: "core-create-timeline",
    name: "createTimeline",
    category: "core-animation",
    description: "Multi-track animation timeline with absolute/relative timestamps, labels, seeking, and nesting.",
    supportedTargets: ["HTMLElement", "string (CSS selector)"],
    signature: {
      importStatement: 'import { createTimeline } from "af-motion";',
      invocation: "createTimeline()",
      exampleCode: 'const tl = createTimeline().add({ target: ".hero", properties: { opacity: [0, 1] } }).addLabel("enter", 500).add({ target: ".cta", properties: { transform: ["scale(0.9)", "scale(1)"] }, at: "enter" }); tl.play();',
    },
    parameters: [],
    controls: ["add", "addTimeline", "addLabel", "play", "pause", "resume", "seek", "restart", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onComplete", "onCancel"],
    callbackDescriptors: [
      { name: "onComplete", parameters: [], returnType: "void", description: "Called when timeline reaches its duration endpoint." },
      { name: "onCancel", parameters: [], returnType: "void", description: "Called when timeline playback is cancelled." },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["timeline", "tracks", "seekable", "labels"],
  },
  {
    id: "core-animate-preset",
    name: "animatePreset",
    category: "core-animation",
    description: "Executes curated animation presets (fadeIn, fadeOut, slideUp, slideDown, scaleIn, scaleOut).",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { animatePreset } from "af-motion";',
      invocation: "animatePreset(target, name, overrides?)",
      exampleCode: 'animatePreset(".card", "slideUp", { duration: 500 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element to animate." },
      { name: "name", kind: "positional", type: "AnimationPresetName", required: true, enum: ["fadeIn", "fadeOut", "slideUp", "slideDown", "scaleIn", "scaleOut"], description: "Registered preset name." },
      { name: "duration", kind: "option", type: "number", required: false, range: { min: 0 }, description: "Duration override in milliseconds." },
      { name: "delay", kind: "option", type: "number", required: false, range: { min: 0 }, description: "Delay override in milliseconds." },
      { name: "easing", kind: "option", type: "EasingOption", required: false, description: "Easing override." },
    ],
    controls: ["seek", "pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onStart", "onUpdate", "onComplete", "onCancel"],
    callbackDescriptors: STANDARD_ANIMATION_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["preset", "fade", "slide", "scale"],
  },
  {
    id: "core-animate-preset-sequence",
    name: "animatePresetSequence",
    category: "core-animation",
    description: "Coordinates a sequence of animation presets across multiple targets.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { animatePresetSequence } from "af-motion";',
      invocation: "animatePresetSequence(steps, options?)",
      exampleCode: 'animatePresetSequence([{ target: ".header", preset: "fadeIn" }, { target: ".main", preset: "slideUp" }]);',
    },
    parameters: [
      { name: "steps", kind: "positional", type: "readonly AnimationSequencePresetStep[]", required: true, description: "Preset sequence steps." },
    ],
    controls: ["pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel"],
    callbacks: ["onStart", "onComplete", "onCancel"],
    callbackDescriptors: SEQUENCE_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["preset", "sequence"],
  },

  // --- Visual Effects ---
  {
    id: "effect-reveal",
    name: "reveal",
    category: "visual-effect",
    description: "Scroll-triggered reveal animation sliding and fading content into view.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { reveal } from "af-motion";',
      invocation: "reveal(target, options?)",
      exampleCode: 'const controls = reveal(".section-title", { direction: "up", duration: 700 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element or selector to reveal." },
      { name: "direction", kind: "option", type: "string", required: false, default: "up", enum: ["up", "down", "left", "right"], description: "Entrance direction.", example: "up" },
      { name: "duration", kind: "option", type: "number", required: false, default: 600, range: { min: 0 }, description: "Duration in milliseconds.", example: 600 },
      { name: "delay", kind: "option", type: "number", required: false, default: 0, range: { min: 0 }, description: "Delay in milliseconds.", example: 100 },
      { name: "once", kind: "option", type: "boolean", required: false, default: true, description: "Trigger only on the first viewport entrance." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["reveal", "entrance", "viewport"],
  },
  {
    id: "effect-stagger",
    name: "stagger",
    category: "visual-effect",
    description: "Offsets animations across multiple child elements with directional entrance order.",
    supportedTargets: ["AnimateTarget (multiple elements)"],
    signature: {
      importStatement: 'import { stagger } from "af-motion";',
      invocation: "stagger(target, options?)",
      exampleCode: 'const controls = stagger(".grid-item", { stagger: 100, from: "first", duration: 500 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container selector or list of elements." },
      { name: "stagger", kind: "option", type: "number", required: false, default: 100, range: { min: 0 }, description: "Interval between item starts in milliseconds.", example: 80 },
      { name: "from", kind: "option", type: "string", required: false, default: "first", enum: ["first", "last"], description: "Stagger ordering start point." },
      { name: "duration", kind: "option", type: "number", required: false, default: 600, range: { min: 0 }, description: "Duration per item in milliseconds." },
    ],
    controls: ["seek", "pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel", "destroy"],
    callbacks: ["onComplete"],
    callbackDescriptors: [
      { name: "onComplete", parameters: [], returnType: "void", description: "Called once every item in the staggered group finishes." },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["stagger", "list", "grid", "cascade"],
  },
  {
    id: "effect-glow",
    name: "glow",
    category: "visual-effect",
    description: "Configurable glowing border/box-shadow effect with pulsing and hover modes.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { glow } from "af-motion";',
      invocation: "glow(target, options?)",
      exampleCode: 'const controls = glow(".badge", { color: "#8b5cf6", mode: "pulse", radius: 25 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Target element to glow." },
      { name: "color", kind: "option", type: "string", required: false, default: "#6366f1", description: "Glow accent color." },
      { name: "radius", kind: "option", type: "number", required: false, default: 20, range: { min: 0 }, description: "Blur radius in pixels." },
      { name: "mode", kind: "option", type: "string", required: false, default: "static", enum: ["static", "pulse", "hover"], description: "Glow animation mode." },
      { name: "duration", kind: "option", type: "number", required: false, default: 2000, range: { min: 0 }, description: "Pulse duration in milliseconds." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["glow", "shadow", "ambient", "neon"],
  },
  {
    id: "effect-border-beam",
    name: "borderBeam",
    category: "visual-effect",
    description: "Travelling gradient light beam circulating along the border of an element.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { borderBeam } from "af-motion";',
      invocation: "borderBeam(target, options?)",
      exampleCode: 'const controls = borderBeam(".pricing-card", { color: "#a855f7", size: 100, duration: 4000 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element receiving the travelling border beam." },
      { name: "color", kind: "option", type: "string", required: false, default: "#8b5cf6", description: "Beam highlight color." },
      { name: "size", kind: "option", type: "number", required: false, default: 120, range: { min: 1, max: 360 }, description: "Beam width in degrees." },
      { name: "duration", kind: "option", type: "number", required: false, default: 3000, range: { min: 0 }, description: "Loop duration in milliseconds." },
      { name: "borderWidth", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Border thickness in pixels." },
      { name: "radius", kind: "option", type: "number", required: false, default: 16, range: { min: 0 }, description: "Corner radius in pixels." },
    ],
    controls: ["pause", "resume", "destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["border", "beam", "light", "gradient"],
  },
  {
    id: "effect-shine",
    name: "shine",
    category: "visual-effect",
    description: "Sweeping metallic or glass shimmer reflection across an element.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { shine } from "af-motion";',
      invocation: "shine(target, options?)",
      exampleCode: 'const controls = shine(".button-primary", { trigger: "hover", duration: 1200 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element to apply metallic shine." },
      { name: "color", kind: "option", type: "string", required: false, default: "rgba(255, 255, 255, 0.4)", description: "Shimmer light color." },
      { name: "duration", kind: "option", type: "number", required: false, default: 1500, range: { min: 0 }, description: "Sweep duration in milliseconds." },
      { name: "trigger", kind: "option", type: "string", required: false, default: "hover", enum: ["hover", "continuous", "click"], description: "Trigger mode." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["shine", "shimmer", "metallic", "glint"],
  },
  {
    id: "effect-ripple",
    name: "ripple",
    category: "visual-effect",
    description: "Material-style radiating circular wave on click or pointer tap.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { ripple } from "af-motion";',
      invocation: "ripple(target, options?)",
      exampleCode: 'const controls = ripple(".interactive-card", { color: "rgba(99, 102, 241, 0.3)" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Interactive element." },
      { name: "color", kind: "option", type: "string", required: false, default: "rgba(255, 255, 255, 0.35)", description: "Wave color." },
      { name: "duration", kind: "option", type: "number", required: false, default: 600, range: { min: 0 }, description: "Wave expansion duration." },
      { name: "origin", kind: "option", type: "string", required: false, default: "pointer", enum: ["pointer", "center"], description: "Wave origin point." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["ripple", "button", "feedback", "material"],
  },
  {
    id: "effect-count-up",
    name: "countUp",
    category: "visual-effect",
    description: "Animated numerical counter with custom formatting, decimal precision, prefix, and suffix.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { countUp } from "af-motion";',
      invocation: "countUp(target, options)",
      exampleCode: 'const controls = countUp(".stat-number", { to: 1250000, prefix: "$", duration: 2500 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element displaying the number." },
      { name: "from", kind: "option", type: "number", required: false, default: 0, description: "Starting number." },
      { name: "to", kind: "option", type: "number", required: true, description: "Target number." },
      { name: "duration", kind: "option", type: "number", required: false, default: 2000, range: { min: 0 }, description: "Count duration in milliseconds." },
      { name: "decimals", kind: "option", type: "number", required: false, default: 0, range: { min: 0 }, description: "Decimal digits." },
      { name: "prefix", kind: "option", type: "string", required: false, default: "", description: "Prefix string (e.g. '$')." },
      { name: "suffix", kind: "option", type: "string", required: false, default: "", description: "Suffix string (e.g. '%')." },
    ],
    controls: ["destroy"],
    callbacks: ["onComplete"],
    callbackDescriptors: [
      { name: "onComplete", parameters: [], returnType: "void", description: "Called when counter finishes reaching destination value." },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["counter", "number", "stats", "metrics"],
  },

  // --- Text Effects ---
  {
    id: "text-typewriter",
    name: "typewriter",
    category: "text-effect",
    description: "Sequential phrase typing and erasing animation with cursor blinking.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { typewriter } from "af-motion";',
      invocation: "typewriter(target, options)",
      exampleCode: 'const controls = typewriter(".headline", { phrases: ["Build faster", "Animate better", "Deliver sooner"], typingSpeed: 70 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element holding typewriter text." },
      { name: "phrases", kind: "option", type: "readonly string[]", required: true, description: "Phrases to type out sequentially.", example: ["Modern animation", "Performant effects"] },
      { name: "typingSpeed", kind: "option", type: "number", required: false, default: 80, range: { min: 0 }, description: "Ms per character typed." },
      { name: "deletingSpeed", kind: "option", type: "number", required: false, default: 40, range: { min: 0 }, description: "Ms per character deleted." },
      { name: "pauseFor", kind: "option", type: "number", required: false, default: 1500, range: { min: 0 }, description: "Pause before erasing phrase." },
      { name: "loop", kind: "option", type: "boolean", required: false, default: true, description: "Whether to loop phrases indefinitely." },
      { name: "cursor", kind: "option", type: "string", required: false, default: "|", description: "Cursor character." },
    ],
    controls: ["destroy"],
    callbacks: ["onComplete"],
    callbackDescriptors: [
      { name: "onComplete", parameters: [], returnType: "void", description: "Fires once after all phrases have typed (when loop is false)." },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "typing", "terminal", "typewriter"],
  },
  {
    id: "text-scramble",
    name: "textScramble",
    category: "text-effect",
    description: "Matrix-style random character glyph decryption and scramble reveal.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { textScramble } from "af-motion";',
      invocation: "textScramble(target, options?)",
      exampleCode: 'const controls = textScramble(".hero-title", { text: "CYBERNETIC MOTION", duration: 1500 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element receiving the scramble effect." },
      { name: "text", kind: "option", type: "string", required: false, description: "Target text to resolve into." },
      { name: "characters", kind: "option", type: "string", required: false, default: "!<>-_\\/[]{}—=+*^?#________", description: "Glyphs used during scramble." },
      { name: "duration", kind: "option", type: "number", required: false, default: 1200, range: { min: 0 }, description: "Scramble duration in milliseconds." },
    ],
    controls: ["destroy"],
    callbacks: ["onComplete"],
    callbackDescriptors: [
      { name: "onComplete", parameters: [], returnType: "void", description: "Fires once text resolution completes." },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "matrix", "scramble", "cyberpunk", "decrypt"],
  },
  {
    id: "text-highlight",
    name: "textHighlight",
    category: "text-effect",
    description: "Simulates an animated highlighter marker stroke expanding over text.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { textHighlight } from "af-motion";',
      invocation: "textHighlight(target, options?)",
      exampleCode: 'const controls = textHighlight(".emphasized-text", { color: "#fef08a", trigger: "scroll" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Text span element." },
      { name: "color", kind: "option", type: "string", required: false, default: "#fef08a", description: "Highlighter ink color." },
      { name: "duration", kind: "option", type: "number", required: false, default: 600, range: { min: 0 }, description: "Stroke animation duration in milliseconds." },
      { name: "trigger", kind: "option", type: "string", required: false, default: "scroll", enum: ["scroll", "immediate"], description: "When to trigger the highlight." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "highlight", "marker", "emphasis"],
  },
  {
    id: "text-split",
    name: "splitText",
    category: "text-effect",
    description: "Splits text nodes into discrete character, word, or line spans while maintaining accessibility.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { splitText } from "af-motion";',
      invocation: "splitText(target, options?)",
      exampleCode: 'const { characters, words } = splitText(".headline", { by: "characters" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container with text nodes." },
      { name: "by", kind: "option", type: "string", required: false, default: "characters", enum: ["characters", "words", "lines"], description: "Splitting granularity." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "split", "typography", "letters"],
  },
  {
    id: "text-reveal",
    name: "textReveal",
    category: "text-effect",
    description: "Smooth sliding or clip-path reveal of typography.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { textReveal } from "af-motion";',
      invocation: "textReveal(target, options?)",
      exampleCode: 'const controls = textReveal(".big-title", { direction: "up", duration: 800 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Text element to reveal." },
      { name: "direction", kind: "option", type: "string", required: false, default: "up", enum: ["up", "down", "left", "right", "none"], description: "Reveal slide direction." },
      { name: "duration", kind: "option", type: "number", required: false, default: 800, range: { min: 0 }, description: "Reveal duration in milliseconds." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "reveal", "headline"],
  },
  {
    id: "text-mask",
    name: "textMask",
    category: "text-effect",
    description: "Gradient mask sweep revealing text with smooth edge falloff.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { textMask } from "af-motion";',
      invocation: "textMask(target, options?)",
      exampleCode: 'const controls = textMask(".tagline", { duration: 1200 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Text element to mask." },
      { name: "duration", kind: "option", type: "number", required: false, default: 1000, range: { min: 0 }, description: "Mask sweep duration in milliseconds." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "mask", "sweep"],
  },
  {
    id: "text-gradient",
    name: "gradientText",
    category: "text-effect",
    description: "Vibrant multi-stop animated or static gradient typography with palette support.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { gradientText } from "af-motion";',
      invocation: "gradientText(target, options?)",
      exampleCode: 'const controls = gradientText(".gradient-headline", { animated: true, duration: 4000 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Typography element." },
      { name: "colors", kind: "option", type: "readonly string[]", required: false, description: "Custom gradient color stops." },
      { name: "animated", kind: "option", type: "boolean", required: false, default: true, description: "Whether gradient shifts position over time." },
      { name: "duration", kind: "option", type: "number", required: false, default: 4000, range: { min: 0 }, description: "Animation cycle duration in milliseconds." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["text", "gradient", "color", "typography"],
  },

  // --- Backgrounds ---
  {
    id: "bg-aurora",
    name: "aurora",
    category: "background",
    description: "Atmospheric multi-layered undulating northern lights canvas background.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { aurora } from "af-motion";',
      invocation: "aurora(target, options?)",
      exampleCode: 'const controls = aurora(".hero-container", { speed: 1.2 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element hosting the canvas." },
      { name: "colors", kind: "option", type: "readonly string[]", required: false, description: "Custom aurora color palette." },
      { name: "speed", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Wave animation speed multiplier." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "canvas", "aurora", "atmospheric"],
  },
  {
    id: "bg-advanced-gradient",
    name: "advancedGradientBackground",
    category: "background",
    description: "High-performance multi-stop radial, conic, and mesh gradient canvas generator.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { advancedGradientBackground } from "af-motion";',
      invocation: "advancedGradientBackground(target, options?)",
      exampleCode: 'const controls = advancedGradientBackground(".bg-area", { type: "mesh", speed: 0.8 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "type", kind: "option", type: "string", required: false, default: "mesh", enum: ["radial", "conic", "mesh"], description: "Gradient pattern type." },
      { name: "speed", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Animation rate." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "gradient", "mesh", "conic"],
  },
  {
    id: "bg-floating-orbs",
    name: "floatingOrbs",
    category: "background",
    description: "Ambient drifting luminous spheres with soft boundary bouncing and depth layering.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { floatingOrbs } from "af-motion";',
      invocation: "floatingOrbs(target, options?)",
      exampleCode: 'const controls = floatingOrbs(".orb-canvas", { count: 8, speed: 0.6 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "count", kind: "option", type: "number", required: false, default: 6, range: { min: 1 }, description: "Number of orbs." },
      { name: "speed", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Drift speed." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "orbs", "ambient", "light"],
  },
  {
    id: "bg-gradient",
    name: "gradientBackground",
    category: "background",
    description: "Smooth rotating and interpolating linear/radial gradient background.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { gradientBackground } from "af-motion";',
      invocation: "gradientBackground(target, options?)",
      exampleCode: 'const controls = gradientBackground(".gradient-box", { angle: 90, speed: 1.5 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "angle", kind: "option", type: "number", required: false, default: 45, description: "Initial gradient angle in degrees." },
      { name: "speed", kind: "option", type: "number", required: false, default: 1, range: { min: 0 }, description: "Rotation rate." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "gradient", "ambient"],
  },
  {
    id: "bg-particle-field",
    name: "particleField",
    category: "background",
    description: "Interactive particle constellation network connecting nearby nodes with lines.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { particleField } from "af-motion";',
      invocation: "particleField(target, options?)",
      exampleCode: 'const controls = particleField(".mesh-hero", { particleCount: 80, connections: true });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "particleCount", kind: "option", type: "number", required: false, default: 60, range: { min: 1 }, description: "Total particle density." },
      { name: "connections", kind: "option", type: "boolean", required: false, default: true, description: "Draw links between nearby particles." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "particles", "network", "constellation"],
  },
  {
    id: "bg-particle",
    name: "particleBackground",
    category: "background",
    description: "Configurable floating particle canvas with dust, stars, and embers presets.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { particleBackground } from "af-motion";',
      invocation: "particleBackground(target, options?)",
      exampleCode: 'const controls = particleBackground(".space", { mode: "stars", density: 100 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "mode", kind: "option", type: "string", required: false, default: "dust", enum: ["dust", "stars", "embers"], description: "Particle behavior mode." },
      { name: "density", kind: "option", type: "number", required: false, default: 50, range: { min: 1 }, description: "Particle count." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "particles", "dust", "stars", "embers"],
  },
  {
    id: "bg-cosmic",
    name: "cosmicBackground",
    category: "background",
    description: "Deep space celestial canvas featuring starfields, nebulae, and warp speed.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { cosmicBackground } from "af-motion";',
      invocation: "cosmicBackground(target, options?)",
      exampleCode: 'const controls = cosmicBackground(".galaxy", { effect: "nebula" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "effect", kind: "option", type: "string", required: false, default: "nebula", enum: ["nebula", "starfield", "warp"], description: "Cosmic visual style." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "cosmic", "stars", "space", "nebula"],
  },
  {
    id: "bg-geometric",
    name: "geometricBackground",
    category: "background",
    description: "Perspective grids, hexagon meshes, polygon wireframes, and tech circuit patterns.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { geometricBackground } from "af-motion";',
      invocation: "geometricBackground(target, options?)",
      exampleCode: 'const controls = geometricBackground(".tech-bg", { effect: "tech-circuits" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "effect", kind: "option", type: "string", required: false, default: "polygon-mesh", enum: ["geometric-grid", "hexagon-field", "polygon-mesh", "perspective-floor", "tech-circuits"], description: "Geometric mode." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "geometric", "wireframe", "grid", "circuit"],
  },
  {
    id: "bg-fluid",
    name: "fluidBackground",
    category: "background",
    description: "Organic fluid simulation featuring metaballs, liquid blobs, ink flow, and waves.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { fluidBackground } from "af-motion";',
      invocation: "fluidBackground(target, options?)",
      exampleCode: 'const controls = fluidBackground(".fluid-box", { effect: "metaballs" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "effect", kind: "option", type: "string", required: false, default: "metaballs", enum: ["fluid-waves", "metaballs", "liquid-blobs", "ink-flow", "liquid-gradient"], description: "Fluid style." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "fluid", "liquid", "metaballs", "ink"],
  },
  {
    id: "bg-atmospheric",
    name: "atmosphericBackground",
    category: "background",
    description: "Weather and atmospheric simulations including fog, mist, rain, snow, and sunbeams.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { atmosphericBackground } from "af-motion";',
      invocation: "atmosphericBackground(target, options?)",
      exampleCode: 'const controls = atmosphericBackground(".weather-hero", { effect: "fog-mist" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "effect", kind: "option", type: "string", required: false, default: "fog-mist", enum: ["fog-mist", "rainfall", "snowfall", "sunbeams", "aurora-borealis"], description: "Weather phenomenon." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "weather", "rain", "snow", "fog", "sunbeams"],
  },
  {
    id: "bg-energy",
    name: "energyBackground",
    category: "background",
    description: "High-voltage electric arcs, lightning flashes, laser beams, and plasma fields.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { energyBackground } from "af-motion";',
      invocation: "energyBackground(target, options?)",
      exampleCode: 'const controls = energyBackground(".portal", { effect: "plasma-field" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "effect", kind: "option", type: "string", required: false, default: "plasma-field", enum: ["electric-arcs", "plasma-field", "energy-pulse", "laser-beams", "lightning"], description: "Energy effect type." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "energy", "plasma", "lightning", "laser"],
  },
  {
    id: "bg-noise",
    name: "noiseBackground",
    category: "background",
    description: "Perlin/simplex grain noise texture simulation with animated evolution.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { noiseBackground } from "af-motion";',
      invocation: "noiseBackground(target, options?)",
      exampleCode: 'const controls = noiseBackground(".retro-hero", { intensity: 0.1 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "intensity", kind: "option", type: "number", required: false, default: 0.15, range: { min: 0, max: 1 }, description: "Noise strength." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "noise", "grain", "perlin"],
  },
  {
    id: "bg-wave",
    name: "waveBackground",
    category: "background",
    description: "Multi-layered undulating harmonic sine waves canvas background.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { waveBackground } from "af-motion";',
      invocation: "waveBackground(target, options?)",
      exampleCode: 'const controls = waveBackground(".ocean", { amplitude: 35, frequency: 0.012 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "amplitude", kind: "option", type: "number", required: false, default: 40, range: { min: 0 }, description: "Wave peak height." },
      { name: "frequency", kind: "option", type: "number", required: false, default: 0.01, range: { min: 0 }, description: "Wave frequency." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "wave", "sine", "water"],
  },
  {
    id: "bg-grid",
    name: "gridBackground",
    category: "background",
    description: "Minimalist glowing 2D coordinate grid with animated line scan.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { gridBackground } from "af-motion";',
      invocation: "gridBackground(target, options?)",
      exampleCode: 'const controls = gridBackground(".hud-panel", { cellSize: 32 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "cellSize", kind: "option", type: "number", required: false, default: 40, range: { min: 1 }, description: "Grid cell size in pixels." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "grid", "lines", "minimal"],
  },
  {
    id: "bg-spotlight",
    name: "spotlightBackground",
    category: "background",
    description: "Ambient radial background spotlight following mouse movement or auto-panning.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { spotlightBackground } from "af-motion";',
      invocation: "spotlightBackground(target, options?)",
      exampleCode: 'const controls = spotlightBackground(".spotlight-hero", { radius: 350 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Container element." },
      { name: "radius", kind: "option", type: "number", required: false, default: 300, range: { min: 0 }, description: "Spotlight radius in pixels." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "static-fallback",
    compatibility: { browser: true, ssr: false, requiresCanvas: true, requiresDom: true },
    tags: ["background", "spotlight", "pointer", "ambient"],
  },

  // --- Pointer Interactions ---
  {
    id: "pointer-magnetic",
    name: "magnetic",
    category: "pointer",
    description: "Pulls an element toward the cursor with spring physics and distance thresholding.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { magnetic } from "af-motion";',
      invocation: "magnetic(target, options?)",
      exampleCode: 'const controls = magnetic(".magnetic-button", { distance: 120, strength: 0.5 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element to attract toward pointer." },
      { name: "distance", kind: "option", type: "number", required: false, default: 100, range: { min: 0 }, description: "Maximum interaction distance in pixels." },
      { name: "strength", kind: "option", type: "number", required: false, default: 0.4, range: { min: 0, max: 1 }, description: "Pull intensity coefficient." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["pointer", "magnetic", "button", "cursor"],
  },
  {
    id: "pointer-hover-motion",
    name: "hoverMotion",
    category: "pointer",
    description: "Fluid multi-property transition on pointer enter and exit with spring return.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { hoverMotion } from "af-motion";',
      invocation: "hoverMotion(target, options?)",
      exampleCode: 'const controls = hoverMotion(".card", { enter: { scale: 1.05, translateY: -4 } });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element to animate on hover." },
      { name: "enter", kind: "option", type: "HoverMotionValues", required: false, description: "Values applied while hovering." },
      { name: "duration", kind: "option", type: "number", required: false, default: 300, range: { min: 0 }, description: "Transition duration." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["pointer", "hover", "interactive"],
  },
  {
    id: "pointer-follow",
    name: "followPointer",
    category: "pointer",
    description: "Smoothly follows cursor position with damping within a boundary container.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { followPointer } from "af-motion";',
      invocation: "followPointer(target, options)",
      exampleCode: 'const controls = followPointer(".cursor-follower", { container: ".hero-section", damping: 0.15 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element that follows cursor." },
      { name: "container", kind: "option", type: "HTMLElement | string", required: true, description: "Bounding container element or selector." },
      { name: "damping", kind: "option", type: "number", required: false, default: 0.1, range: { min: 0, max: 1 }, description: "Follow damping factor." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["pointer", "follow", "cursor", "trail"],
  },
  {
    id: "pointer-spotlight",
    name: "spotlight",
    category: "pointer",
    description: "Dynamic radial spotlight highlight tracking cursor position over a surface.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { spotlight } from "af-motion";',
      invocation: "spotlight(target, options?)",
      exampleCode: 'const controls = spotlight(".feature-card", { radius: 200 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element illuminated by spotlight." },
      { name: "color", kind: "option", type: "string", required: false, default: "rgba(255, 255, 255, 0.15)", description: "Glow illumination color." },
      { name: "radius", kind: "option", type: "number", required: false, default: 250, range: { min: 0 }, description: "Spotlight radius in pixels." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["pointer", "spotlight", "glow", "card"],
  },
  {
    id: "pointer-cursor-trail",
    name: "cursorTrail",
    category: "pointer",
    description: "Spawns a trailing particle ribbon or geometric trail behind the cursor.",
    supportedTargets: ["CursorTrailTarget (window or element)"],
    signature: {
      importStatement: 'import { cursorTrail } from "af-motion";',
      invocation: "cursorTrail(options?)",
      exampleCode: 'const controls = cursorTrail({ particleCount: 30, color: "#a855f7" });',
    },
    parameters: [
      { name: "particleCount", kind: "option", type: "number", required: false, default: 20, range: { min: 1 }, description: "Trailing nodes count." },
      { name: "color", kind: "option", type: "string", required: false, default: "#6366f1", description: "Trail color." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["pointer", "cursor", "trail", "ribbon"],
  },
  {
    id: "pointer-tilt",
    name: "tilt",
    category: "pointer",
    description: "3D perspective tilt on hover with glare reflection and gyroscope support.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { tilt } from "af-motion";',
      invocation: "tilt(target, options?)",
      exampleCode: 'const controls = tilt(".tilt-card", { max: 20, glare: true });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element to tilt in 3D." },
      { name: "max", kind: "option", type: "number", required: false, default: 15, range: { min: 0, max: 90 }, description: "Max tilt rotation in degrees." },
      { name: "perspective", kind: "option", type: "number", required: false, default: 1000, range: { min: 1 }, description: "3D CSS perspective distance." },
      { name: "glare", kind: "option", type: "boolean", required: false, default: false, description: "Whether to render a dynamic specular glare sheet." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["pointer", "tilt", "3d", "card", "glare"],
  },

  // --- Scroll Effects ---
  {
    id: "scroll-progress",
    name: "scrollProgress",
    category: "scroll",
    description: "Tracks window or container scroll progress (0..1) with optional progress indicator rendering.",
    supportedTargets: ["ScrollProgressTarget (window or element)"],
    signature: {
      importStatement: 'import { scrollProgress } from "af-motion";',
      invocation: "scrollProgress(options?)",
      exampleCode: 'const controls = scrollProgress({ position: "top", color: "#6366f1", height: 3 });',
    },
    parameters: [
      { name: "position", kind: "option", type: "string", required: false, default: "top", enum: ["top", "bottom", "left", "right"], description: "Progress bar alignment." },
      { name: "color", kind: "option", type: "string", required: false, default: "#6366f1", description: "Progress bar fill color." },
      { name: "height", kind: "option", type: "number", required: false, default: 4, range: { min: 1 }, description: "Indicator bar thickness in pixels." },
      { name: "smoothing", kind: "option", type: "number", required: false, default: 0, range: { min: 0, max: 1 }, description: "Interpolation smoothing factor." },
    ],
    controls: ["getProgress", "destroy"],
    callbacks: ["onUpdate"],
    callbackDescriptors: [
      {
        name: "onUpdate",
        parameters: [
          { name: "progress", type: "number", description: "Current scroll ratio from 0 to 1." },
        ],
        returnType: "void",
        description: "Called whenever scroll progress updates.",
      },
    ],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "progress", "reading", "indicator"],
  },
  {
    id: "scroll-trigger",
    name: "scrollTrigger",
    category: "scroll",
    description: "Dispatches callbacks and animations when an element crosses scroll thresholds.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { scrollTrigger } from "af-motion";',
      invocation: "scrollTrigger(target, options?)",
      exampleCode: 'const controls = scrollTrigger(".trigger-zone", { threshold: 0.5, onEnter: () => activate() });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Observed target element." },
      { name: "threshold", kind: "option", type: "number | number[]", required: false, default: 0, description: "Intersection ratio threshold(s)." },
      { name: "once", kind: "option", type: "boolean", required: false, default: false, description: "Trigger callbacks only once." },
    ],
    controls: ["destroy"],
    callbacks: ["onEnter", "onLeave"],
    callbackDescriptors: [
      {
        name: "onEnter",
        parameters: [
          { name: "entry", type: "IntersectionObserverEntry", description: "Viewport intersection event." },
        ],
        returnType: "void",
        description: "Called when element reaches threshold.",
      },
      {
        name: "onLeave",
        parameters: [
          { name: "entry", type: "IntersectionObserverEntry", description: "Viewport intersection event." },
        ],
        returnType: "void",
        description: "Called when element exits threshold.",
      },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "trigger", "waypoints"],
  },
  {
    id: "scroll-velocity",
    name: "scrollVelocity",
    category: "scroll",
    description: "Realtime scroll velocity and direction tracker with exponential smoothing.",
    supportedTargets: ["AnimateTarget | 'window'"],
    signature: {
      importStatement: 'import { scrollVelocity } from "af-motion";',
      invocation: "scrollVelocity(options)",
      exampleCode: 'const controls = scrollVelocity({ onUpdate: ({ velocity, direction }) => updateSpeedometer(velocity) });',
    },
    parameters: [
      { name: "smoothing", kind: "option", type: "number", required: false, default: 0.1, range: { min: 0, max: 1 }, description: "Velocity EMA smoothing coefficient." },
    ],
    controls: ["destroy"],
    callbacks: ["onUpdate"],
    callbackDescriptors: [
      {
        name: "onUpdate",
        parameters: [
          { name: "data", type: "ScrollVelocityData", description: "Contains velocity (px/s), acceleration, direction ('up'|'down'), and position." },
        ],
        returnType: "void",
        description: "Called on scroll frames with computed velocity data.",
      },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "velocity", "speed", "direction"],
  },
  {
    id: "scroll-animate",
    name: "scrollAnimate",
    category: "scroll",
    description: "Scrubs animatable CSS properties directly in lockstep with page scroll progress.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { scrollAnimate } from "af-motion";',
      invocation: "scrollAnimate(target, properties, options?)",
      exampleCode: 'const controls = scrollAnimate(".parallax-header", { transform: ["translateY(0px)", "translateY(-100px)"] });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Target element to scrub." },
      { name: "properties", kind: "positional", type: "AnimatableProperties", required: true, description: "Keyframe property ranges tied to scroll." },
    ],
    controls: ["pause", "resume", "getProgress", "destroy"],
    callbacks: ["onUpdate"],
    callbackDescriptors: [
      {
        name: "onUpdate",
        parameters: [
          { name: "progress", type: "number", description: "Current scrub progress (0..1)." },
        ],
        returnType: "void",
        description: "Called as properties update along scroll position.",
      },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "scrub", "parallax", "timeline"],
  },
  {
    id: "scroll-direction",
    name: "scrollDirection",
    category: "scroll",
    description: "Detects scroll direction changes ('up' | 'down' | 'idle') with hysteresis threshold.",
    supportedTargets: ["window or container"],
    signature: {
      importStatement: 'import { scrollDirection } from "af-motion";',
      invocation: "scrollDirection(options)",
      exampleCode: 'const controls = scrollDirection({ onChange: (dir) => setNavbarVisible(dir !== "down") });',
    },
    parameters: [
      { name: "threshold", kind: "option", type: "number", required: false, default: 10, range: { min: 0 }, description: "Minimum scroll delta before direction updates." },
    ],
    controls: ["destroy"],
    callbacks: ["onChange"],
    callbackDescriptors: [
      {
        name: "onChange",
        parameters: [
          { name: "direction", type: "ScrollDirection", description: "'up', 'down', or 'idle'." },
        ],
        returnType: "void",
        description: "Fires when scroll direction changes beyond threshold.",
      },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "direction", "header", "navbar"],
  },
  {
    id: "scroll-in-view",
    name: "inView",
    category: "scroll",
    description: "High-performance intersection observer wrapper with entrance/exit cleanup and root margins.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { inView } from "af-motion";',
      invocation: "inView(target, callback, options?)",
      exampleCode: 'const controls = inView(".lazy-section", (el) => { animate(el, { opacity: [0, 1] }); return () => cleanup(); });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Observed DOM element or selector." },
      { name: "callback", kind: "positional", type: "InViewCallback", required: true, description: "Called on entry; may return cleanup function." },
      { name: "rootMargin", kind: "option", type: "string", required: false, default: "0px", description: "Viewport bounding margin offset." },
      { name: "threshold", kind: "option", type: "number | number[]", required: false, default: 0, description: "Visibility threshold ratio." },
      { name: "once", kind: "option", type: "boolean", required: false, default: false, description: "Unobserve target after first entrance." },
    ],
    controls: ["destroy"],
    callbacks: ["onEnter", "onLeave", "onChange"],
    callbackDescriptors: VIEWPORT_CALLBACKS,
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "intersection", "viewport", "observer"],
  },
  {
    id: "scroll-parallax",
    name: "parallax",
    category: "scroll",
    description: "Calculates depth-based parallax scrolling offsets across vertical and horizontal axes.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { parallax } from "af-motion";',
      invocation: "parallax(target, options?)",
      exampleCode: 'const controls = parallax(".layer-back", { speed: 0.3, axis: "y" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element translated with parallax." },
      { name: "speed", kind: "option", type: "number", required: false, default: 0.5, description: "Parallax depth factor multiplier." },
      { name: "axis", kind: "option", type: "string", required: false, default: "y", enum: ["x", "y"], description: "Scroll axis to track." },
    ],
    controls: ["destroy"],
    callbacks: [],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["scroll", "parallax", "depth", "layers"],
  },

  // --- SVG Effects ---
  {
    id: "svg-draw",
    name: "drawSVG",
    category: "svg",
    description: "Draws SVG path strokes from 0% to 100% using stroke-dasharray calculations with easing.",
    supportedTargets: ["SVGElement", "string (CSS selector)"],
    signature: {
      importStatement: 'import { drawSVG } from "af-motion";',
      invocation: "drawSVG(target, options?)",
      exampleCode: 'const controls = drawSVG("path.signature", { duration: 2000, easing: "easeInOutCubic" });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "SVGElement | string", required: true, description: "SVG path or SVG container." },
      { name: "duration", kind: "option", type: "number", required: false, default: 1500, range: { min: 0 }, description: "Drawing duration in milliseconds." },
      { name: "reverse", kind: "option", type: "boolean", required: false, default: false, description: "Draw in reverse (un-drawing)." },
    ],
    controls: ["seek", "pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel", "destroy"],
    callbacks: ["onStart", "onUpdate", "onComplete", "onCancel"],
    callbackDescriptors: STANDARD_ANIMATION_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["svg", "draw", "stroke", "line", "path"],
  },
  {
    id: "svg-morph",
    name: "morphSVG",
    category: "svg",
    description: "Smoothly interpolates SVG path 'd' commands between differing vector contours.",
    supportedTargets: ["SVGElement", "string (CSS selector)"],
    signature: {
      importStatement: 'import { morphSVG } from "af-motion";',
      invocation: "morphSVG(target, toPath, options?)",
      exampleCode: 'const controls = morphSVG("#icon-play", "M10 20 L30 40 L50 20 Z", { duration: 800 });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "SVGElement | string", required: true, description: "SVG path to morph." },
      { name: "toPath", kind: "positional", type: "string", required: true, description: "Target SVG path string to morph into." },
      { name: "duration", kind: "option", type: "number", required: false, default: 1000, range: { min: 0 }, description: "Morph duration in milliseconds." },
    ],
    controls: ["seek", "pause", "resume", "reverse", "setPlaybackRate", "getPlaybackRate", "cancel", "destroy"],
    callbacks: ["onStart", "onUpdate", "onComplete", "onCancel"],
    callbackDescriptors: STANDARD_ANIMATION_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["svg", "morph", "path", "vector", "shape"],
  },

  // --- Gestures ---
  {
    id: "gesture-drag",
    name: "drag",
    category: "gesture",
    description: "Drags elements with multi-touch pointer capture, container boundary clamping, and momentum inertia.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { drag } from "af-motion";',
      invocation: "drag(target, options?)",
      exampleCode: 'const controls = drag(".draggable-sheet", { axis: "y", inertia: true });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element to make draggable." },
      { name: "axis", kind: "option", type: "string", required: false, default: "both", enum: ["x", "y", "both"], description: "Allowed drag axis." },
      { name: "inertia", kind: "option", type: "boolean", required: false, default: true, description: "Enable flick momentum on release." },
      { name: "friction", kind: "option", type: "number", required: false, default: 8, range: { min: 0 }, description: "Momentum decay speed." },
      { name: "container", kind: "option", type: "HTMLElement | string", required: false, description: "Boundary container element." },
    ],
    controls: ["destroy"],
    callbacks: ["onDragStart", "onDrag", "onDragEnd"],
    callbackDescriptors: [
      {
        name: "onDragStart",
        parameters: [{ name: "position", type: "DragPosition", description: "{ x, y }" }],
        returnType: "void",
        description: "Called when dragging starts.",
      },
      {
        name: "onDrag",
        parameters: [{ name: "position", type: "DragPosition", description: "{ x, y }" }],
        returnType: "void",
        description: "Called continuously as the element moves.",
      },
      {
        name: "onDragEnd",
        parameters: [
          { name: "position", type: "DragPosition", description: "{ x, y }" },
          { name: "cancelled", type: "boolean", description: "Whether gesture was cancelled." },
        ],
        returnType: "void",
        description: "Called when pointer is released or cancelled.",
      },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["gesture", "drag", "touch", "pointer", "inertia"],
  },
  {
    id: "gesture-pinch",
    name: "pinch",
    category: "gesture",
    description: "Tracks two-finger touch pinch gestures with scale, focal center, and rotation.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { pinch } from "af-motion";',
      invocation: "pinch(target, options?)",
      exampleCode: 'const controls = pinch(".photo-zoom", { minScale: 1, maxScale: 4, onUpdate: ({ scale }) => updateZoom(scale) });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element receiving pinch gestures." },
      { name: "minScale", kind: "option", type: "number", required: false, default: 0.5, range: { min: 0 }, description: "Minimum zoom scale limit." },
      { name: "maxScale", kind: "option", type: "number", required: false, default: 3, range: { min: 1 }, description: "Maximum zoom scale limit." },
    ],
    controls: ["destroy"],
    callbacks: ["onStart", "onUpdate", "onEnd"],
    callbackDescriptors: [
      { name: "onStart", parameters: [{ name: "gesture", type: "PinchGesture", description: "{ scale, center, distance }" }], returnType: "void", description: "Called on pinch start." },
      { name: "onUpdate", parameters: [{ name: "gesture", type: "PinchGesture", description: "{ scale, center, distance }" }], returnType: "void", description: "Called as pinch scale updates." },
      { name: "onEnd", parameters: [{ name: "gesture", type: "PinchGesture", description: "{ scale, center, distance }" }], returnType: "void", description: "Called on pinch release." },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["gesture", "pinch", "zoom", "touch", "multitouch"],
  },
  {
    id: "gesture-swipe",
    name: "swipe",
    category: "gesture",
    description: "Detects fast directional swipe gestures (left, right, up, down) with velocity tracking.",
    supportedTargets: ["AnimateTarget"],
    signature: {
      importStatement: 'import { swipe } from "af-motion";',
      invocation: "swipe(target, options)",
      exampleCode: 'const controls = swipe(".carousel-slide", { onSwipe: ({ direction }) => changeSlide(direction) });',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element receiving swipe gestures." },
      { name: "threshold", kind: "option", type: "number", required: false, default: 50, range: { min: 0 }, description: "Minimum swipe distance in pixels." },
      { name: "velocityThreshold", kind: "option", type: "number", required: false, default: 0.3, range: { min: 0 }, description: "Minimum flick speed in px/ms." },
    ],
    controls: ["destroy"],
    callbacks: ["onSwipe"],
    callbackDescriptors: [
      {
        name: "onSwipe",
        parameters: [
          { name: "gesture", type: "SwipeGesture", description: "Contains direction ('left'|'right'|'up'|'down'), velocity, and distance." },
        ],
        returnType: "void",
        description: "Called when a valid swipe gesture is detected.",
      },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["gesture", "swipe", "flick", "touch"],
  },

  // --- Composition Systems ---
  {
    id: "comp-effect-composer",
    name: "composeEffects",
    category: "composition",
    description: "Composes multiple concurrent effects on a single target element without transform conflicts.",
    supportedTargets: ["ComposableEffect[]"],
    signature: {
      importStatement: 'import { composeEffects, tilt, glow } from "af-motion";',
      invocation: "composeEffects(entries)",
      exampleCode: 'const comp = composeEffects([() => tilt(".card"), () => glow(".card")]);',
    },
    parameters: [
      { name: "entries", kind: "positional", type: "readonly ComposableEffect[]", required: true, description: "List of effect factories or instances to run." },
    ],
    controls: ["destroy", "cancel", "pause", "resume"],
    callbacks: [],
    reducedMotion: "respects-profile",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["composition", "composer", "transform-layers", "lifecycle"],
  },
  {
    id: "comp-motion-choreography",
    name: "createMotionChoreography",
    category: "composition",
    description: "Declarative choreography script coordinating sequential and parallel animations and effects with branching.",
    supportedTargets: ["MotionChoreographyAction[]"],
    signature: {
      importStatement: 'import { createMotionChoreography } from "af-motion";',
      invocation: "createMotionChoreography(actions)",
      exampleCode: 'const choreo = createMotionChoreography([{ type: "animation", target: ".box", properties: { opacity: [0, 1] } }]);',
    },
    parameters: [
      { name: "actions", kind: "positional", type: "readonly MotionChoreographyAction[]", required: true, description: "Choreography action graph." },
    ],
    controls: ["play", "pause", "resume", "cancel", "destroy", "reverse"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["choreography", "declarative", "script", "branching"],
  },
  {
    id: "comp-motion-recipe",
    name: "createMotionRecipe",
    category: "composition",
    description: "Defines reusable motion recipes combining animations, effects, and design tokens into single-call presets.",
    supportedTargets: ["MotionRecipeDefinition"],
    signature: {
      importStatement: 'import { createMotionRecipe, runMotionRecipe } from "af-motion";',
      invocation: "createMotionRecipe(definition)",
      exampleCode: 'const modalOpen = createMotionRecipe({ choreography: (ctx) => [{ type: "animation", target: ctx.params.target, properties: { opacity: [0, 1] } }] }); runMotionRecipe(modalOpen, { target: ".modal" });',
    },
    parameters: [
      { name: "definition", kind: "positional", type: "MotionRecipeDefinition", required: true, description: "Recipe definition template." },
    ],
    controls: ["play", "pause", "resume", "cancel", "destroy", "reverse", "seek"],
    callbacks: [],
    reducedMotion: "respects-profile",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["recipe", "template", "reusable"],
  },
  {
    id: "comp-motion-states",
    name: "createMotionStates",
    category: "composition",
    description: "Finite state machine coordinating named visual states and smooth transitions between them.",
    supportedTargets: ["AnimateTarget", "MotionStateDefinitions"],
    signature: {
      importStatement: 'import { createMotionStates } from "af-motion";',
      invocation: "createMotionStates(target, states, initial?)",
      exampleCode: 'const stateMachine = createMotionStates(".panel", { open: { values: { height: "300px" } }, closed: { values: { height: "0px" } } }, "closed"); stateMachine.transitionTo("open");',
    },
    parameters: [
      { name: "target", kind: "positional", type: "AnimateTarget", required: true, description: "Element receiving state styles." },
      { name: "states", kind: "positional", type: "MotionStateDefinitions", required: true, description: "Dictionary of named state property values." },
      { name: "initial", kind: "positional", type: "string", required: false, description: "Initial active state key." },
    ],
    controls: ["transitionTo", "destroy"],
    callbacks: [],
    reducedMotion: "respects-profile",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["state-machine", "states", "transitions"],
  },
  {
    id: "comp-motion-dna",
    name: "applyMotionDNA",
    category: "composition",
    description: "Resolves and applies cohesive brand motion DNA (durations, spring curves, easings) across animations.",
    supportedTargets: ["none"],
    signature: {
      importStatement: 'import { applyMotionDNA } from "af-motion";',
      invocation: "applyMotionDNA(name, overrides?)",
      exampleCode: 'const options = applyMotionDNA("energetic", { duration: 400 });',
    },
    parameters: [
      { name: "name", kind: "positional", type: "string", required: true, description: "Registered Motion DNA profile key." },
      { name: "overrides", kind: "positional", type: "MotionDNAOverrides", required: false, description: "Parameter overrides." },
    ],
    controls: [],
    callbacks: [],
    reducedMotion: "respects-profile",
    compatibility: { browser: true, ssr: true, requiresDom: false },
    tags: ["dna", "branding", "tokens", "consistency"],
  },
  {
    id: "comp-design-system",
    name: "createDesignSystem",
    category: "composition",
    description: "Configures theme-agnostic design system tokens (palettes, typography, motion scales, easings, interactions) and connects them to animations.",
    supportedTargets: ["none"],
    signature: {
      importStatement: 'import { createDesignSystem, resolveDesignSystem, resolveDesignToken } from "af-motion/presets";',
      invocation: "createDesignSystem(definition)",
      exampleCode: 'const ds = createDesignSystem({ id: "custom", name: "CustomBrand", palette: "ocean", motionDNA: "snappy" });',
    },
    parameters: [
      { name: "definition", kind: "positional", type: "DesignSystemDefinition", required: true, description: "Design system definition object." },
    ],
    controls: [],
    callbacks: [],
    reducedMotion: "respects-profile",
    compatibility: { browser: true, ssr: true, requiresDom: false },
    tags: ["design-system", "tokens", "branding", "palettes", "typography", "spacing"],
  },
  {
    id: "comp-adaptive-motion",
    name: "resolveAdaptiveMotion",
    category: "composition",
    description: "Adapts animation duration, complexity, and framerate based on device capabilities and motion preferences.",
    supportedTargets: ["none"],
    signature: {
      importStatement: 'import { resolveAdaptiveMotion } from "af-motion";',
      invocation: "resolveAdaptiveMotion(profile, conditions?, overrides?)",
      exampleCode: 'const adapted = resolveAdaptiveMotion({ intensity: 0.8 }, { reducedMotion: true });',
    },
    parameters: [
      { name: "profile", kind: "positional", type: "AdaptiveMotionProfile", required: true, description: "Base profile." },
      { name: "conditions", kind: "positional", type: "AdaptiveMotionConditions", required: false, description: "Environmental flags." },
    ],
    controls: [],
    callbacks: [],
    reducedMotion: "respects-profile",
    compatibility: { browser: true, ssr: true, requiresDom: false },
    tags: ["adaptive", "accessibility", "battery", "performance"],
  },

  // --- React Integrations ---
  {
    id: "react-use-animate",
    name: "useAnimate",
    category: "react",
    description: "React hook providing an element ref and an imperative animate() function tied to component lifecycle.",
    supportedTargets: ["RefObject<T extends HTMLElement | SVGElement>"],
    signature: {
      importStatement: 'import { useAnimate } from "af-motion/react";',
      invocation: "useAnimate()",
      exampleCode: 'function Comp() { const { ref, animate } = useAnimate(); return <div ref={ref} onClick={() => animate({ opacity: [0, 1] })} />; }',
    },
    parameters: [],
    controls: ["ref", "animate"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "ref", "imperative"],
  },
  {
    id: "react-use-in-view",
    name: "useInView",
    category: "react",
    description: "React hook providing element visibility tracking without unnecessary re-renders when reactive=false.",
    supportedTargets: ["RefObject<T extends HTMLElement | SVGElement>"],
    signature: {
      importStatement: 'import { useInView } from "af-motion/react";',
      invocation: "useInView(options?)",
      exampleCode: 'function Comp() { const { ref, isInView } = useInView({ once: true }); return <div ref={ref}>{isInView ? "Visible" : "Hidden"}</div>; }',
    },
    parameters: [
      { name: "threshold", kind: "option", type: "number | number[]", required: false, default: 0, description: "Intersection threshold." },
      { name: "once", kind: "option", type: "boolean", required: false, default: false, description: "Trigger only once." },
      { name: "reactive", kind: "option", type: "boolean", required: false, default: true, description: "Trigger React re-renders on status change." },
    ],
    controls: ["ref", "isInView"],
    callbacks: ["onEnter", "onLeave", "onChange"],
    callbackDescriptors: VIEWPORT_CALLBACKS,
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "viewport", "intersection"],
  },
  {
    id: "react-use-scroll-progress",
    name: "useScrollProgress",
    category: "react",
    description: "React hook tracking page or element scroll progress with optional non-rendering imperative getProgress().",
    supportedTargets: ["RefObject<T extends HTMLElement | SVGElement> | 'window'"],
    signature: {
      importStatement: 'import { useScrollProgress } from "af-motion/react";',
      invocation: "useScrollProgress(options?)",
      exampleCode: 'function ProgressBar() { const { progress } = useScrollProgress(); return <div style={{ transform: `scaleX(${progress})` }} />; }',
    },
    parameters: [
      { name: "smoothing", kind: "option", type: "number", required: false, default: 0, range: { min: 0, max: 1 }, description: "Scroll progress smoothing." },
      { name: "reactive", kind: "option", type: "boolean", required: false, default: true, description: "Trigger component renders on scroll." },
    ],
    controls: ["ref", "progress", "getProgress"],
    callbacks: ["onUpdate"],
    callbackDescriptors: [
      { name: "onUpdate", parameters: [{ name: "progress", type: "number", description: "Updated scroll ratio." }], returnType: "void", description: "Called on scroll." },
    ],
    reducedMotion: "disables-animation",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "scroll", "progress"],
  },
  {
    id: "react-use-scroll-velocity",
    name: "useScrollVelocity",
    category: "react",
    description: "React hook exposing realtime scroll velocity, acceleration, and direction data.",
    supportedTargets: ["RefObject<T extends HTMLElement | SVGElement> | 'window'"],
    signature: {
      importStatement: 'import { useScrollVelocity } from "af-motion/react";',
      invocation: "useScrollVelocity(options?)",
      exampleCode: 'function SpeedGauge() { const { data } = useScrollVelocity(); return <div>{data.velocity.toFixed(0)} px/s</div>; }',
    },
    parameters: [
      { name: "smoothing", kind: "option", type: "number", required: false, default: 0.1, range: { min: 0, max: 1 }, description: "Smoothing factor." },
      { name: "reactive", kind: "option", type: "boolean", required: false, default: true, description: "Trigger component renders on scroll." },
    ],
    controls: ["ref", "data", "getData"],
    callbacks: ["onUpdate"],
    callbackDescriptors: [
      { name: "onUpdate", parameters: [{ name: "data", type: "ScrollVelocityData", description: "Velocity metrics." }], returnType: "void", description: "Called on scroll update." },
    ],
    reducedMotion: "not-applicable",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "scroll", "velocity"],
  },
  {
    id: "react-use-sequence",
    name: "useSequence",
    category: "react",
    description: "React hook coordinating sequential animations with Strict Mode remount safety and SSR support.",
    supportedTargets: ["readonly UseSequenceStep[]"],
    signature: {
      importStatement: 'import { useSequence } from "af-motion/react";',
      invocation: "useSequence(steps?, options?)",
      exampleCode: 'function SequenceComp() { const refA = useRef(null); const refB = useRef(null); const { play } = useSequence([{ target: refA, properties: { opacity: [0, 1] } }, { target: refB, properties: { opacity: [0, 1] } }]); return <div onClick={() => play()} />; }',
    },
    parameters: [
      { name: "steps", kind: "positional", type: "readonly UseSequenceStep[]", required: false, description: "Sequence steps." },
      { name: "autoplay", kind: "option", type: "boolean", required: false, default: true, description: "Autoplay on mount." },
    ],
    controls: ["play", "pause", "resume", "reverse", "cancel", "setPlaybackRate", "getPlaybackRate", "finished", "controlsRef", "sequence"],
    callbacks: ["onStart", "onComplete", "onCancel"],
    callbackDescriptors: SEQUENCE_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "sequence", "orchestration"],
  },
  {
    id: "react-use-parallel",
    name: "useParallel",
    category: "react",
    description: "React hook coordinating concurrent parallel animations with Strict Mode remount safety.",
    supportedTargets: ["readonly UseParallelStep[]"],
    signature: {
      importStatement: 'import { useParallel } from "af-motion/react";',
      invocation: "useParallel(steps?, options?)",
      exampleCode: 'function ParallelComp() { const refA = useRef(null); const refB = useRef(null); const { pause, resume } = useParallel([{ target: refA, properties: { opacity: [0, 1] } }, { target: refB, properties: { opacity: [0, 1] } }]); return <div />; }',
    },
    parameters: [
      { name: "steps", kind: "positional", type: "readonly UseParallelStep[]", required: false, description: "Parallel steps." },
      { name: "autoplay", kind: "option", type: "boolean", required: false, default: true, description: "Autoplay on mount." },
    ],
    controls: ["play", "pause", "resume", "reverse", "cancel", "setPlaybackRate", "getPlaybackRate", "finished", "controlsRef", "parallel"],
    callbacks: ["onStart", "onComplete", "onCancel"],
    callbackDescriptors: SEQUENCE_CALLBACKS,
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "parallel", "orchestration"],
  },
  {
    id: "react-use-timeline",
    name: "useTimeline",
    category: "react",
    description: "React hook creating seekable multi-track timeline animations with Strict Mode remount safety.",
    supportedTargets: ["TimelineBuilder"],
    signature: {
      importStatement: 'import { useTimeline } from "af-motion/react";',
      invocation: "useTimeline(builder?, options?)",
      exampleCode: 'function TimelineComp() { const ref = useRef(null); const { seek, restart } = useTimeline((tl) => { tl.add({ target: ref, properties: { opacity: [0, 1] } }); }); return <div ref={ref} />; }',
    },
    parameters: [
      { name: "builder", kind: "positional", type: "TimelineBuilder", required: false, description: "Timeline construction callback." },
      { name: "autoplay", kind: "option", type: "boolean", required: false, default: true, description: "Autoplay on mount." },
    ],
    controls: ["play", "pause", "resume", "seek", "restart", "cancel", "setPlaybackRate", "getPlaybackRate", "finished", "controlsRef", "timeline"],
    callbacks: ["onComplete", "onCancel"],
    callbackDescriptors: [
      { name: "onComplete", parameters: [], returnType: "void", description: "Called when timeline completes." },
      { name: "onCancel", parameters: [], returnType: "void", description: "Called when timeline is cancelled." },
    ],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "hook", "timeline", "seek"],
  },
  {
    id: "react-reveal",
    name: "Reveal",
    category: "react",
    description: "Accessible React component that animates its children into view when scrolled into the viewport.",
    supportedTargets: ["React.ReactNode"],
    signature: {
      importStatement: 'import { Reveal } from "af-motion/react";',
      invocation: "<Reveal direction? duration? delay?>{children}</Reveal>",
      exampleCode: '<Reveal direction="up" duration={700}><h2>Hero Headline</h2></Reveal>',
    },
    parameters: [
      { name: "direction", kind: "prop", type: "string", required: false, default: "up", enum: ["up", "down", "left", "right"], description: "Slide direction.", example: "up" },
      { name: "duration", kind: "prop", type: "number", required: false, default: 600, range: { min: 0 }, description: "Duration in milliseconds.", example: 600 },
      { name: "delay", kind: "prop", type: "number", required: false, default: 0, range: { min: 0 }, description: "Delay in milliseconds.", example: 100 },
    ],
    controls: ["ref"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "component", "reveal", "viewport"],
  },
  {
    id: "react-animated-text",
    name: "AnimatedText",
    category: "react",
    description: "Accessible React component applying typewriter, scramble, or gradient text effects with aria-hidden isolation.",
    supportedTargets: ["string text"],
    signature: {
      importStatement: 'import { AnimatedText } from "af-motion/react";',
      invocation: "<AnimatedText text effect effectOptions? />",
      exampleCode: '<AnimatedText text="Frontend Magic" effect="typewriter" effectOptions={{ typingSpeed: 60 }} />',
    },
    parameters: [
      { name: "text", kind: "prop", type: "string", required: true, description: "Text content.", example: "Welcome to AF Motion" },
      { name: "effect", kind: "prop", type: "string", required: true, enum: ["typewriter", "scramble", "gradient"], description: "Visual text effect.", example: "typewriter" },
      { name: "effectOptions", kind: "prop", type: "object", required: false, description: "Effect-specific configuration options." },
    ],
    controls: ["ref"],
    callbacks: [],
    reducedMotion: "skips-to-endpoint",
    compatibility: { browser: true, ssr: true, requiresDom: true },
    tags: ["react", "component", "text", "accessibility"],
  },
] as const;

/** Map of capability IDs to metadata instances. */
const CAPABILITIES_BY_ID = new Map<string, CapabilityMetadata>(
  CAPABILITIES.map((entry) => [entry.id, entry]),
);

/** Map of categories to capability lists. */
const CAPABILITIES_BY_CATEGORY = new Map<CapabilityCategory, CapabilityMetadata[]>();
for (const category of CAPABILITY_CATEGORIES) {
  CAPABILITIES_BY_CATEGORY.set(category, []);
}
for (const entry of CAPABILITIES) {
  CAPABILITIES_BY_CATEGORY.get(entry.category)?.push(entry);
}

/**
 * Returns all registered capabilities in the catalogue.
 */
export function listCapabilities(): readonly CapabilityMetadata[] {
  return CAPABILITIES;
}

/**
 * Returns the list of standard capability categories.
 */
export function listCategories(): readonly CapabilityCategory[] {
  return CAPABILITY_CATEGORIES;
}

/**
 * Finds a single capability by its unique ID.
 */
export function getCapability(id: string): CapabilityMetadata | undefined {
  return CAPABILITIES_BY_ID.get(id);
}

/**
 * Returns all capabilities matching the specified category.
 */
export function getCapabilitiesByCategory(category: CapabilityCategory): readonly CapabilityMetadata[] {
  return CAPABILITIES_BY_CATEGORY.get(category) ?? [];
}

/**
 * Searches capabilities by keyword query matching ID, name, description, category, or tags.
 */
export function searchCapabilities(query: string): readonly CapabilityMetadata[] {
  if (!query || typeof query !== "string") return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return [];

  return CAPABILITIES.filter((entry) => {
    return (
      entry.id.toLowerCase().includes(normalized) ||
      entry.name.toLowerCase().includes(normalized) ||
      entry.category.toLowerCase().includes(normalized) ||
      entry.description.toLowerCase().includes(normalized) ||
      entry.tags?.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });
}

/**
 * Validates a capability's option/prop configuration object against its declared schema.
 * Useful for AI agents and developer tooling to check parameters before execution.
 */
export function validateCapabilityConfiguration(
  capabilityId: string,
  configuration: Record<string, unknown>,
): ValidationResult {
  const capability = getCapability(capabilityId);
  if (!capability) {
    return {
      valid: false,
      errors: [{ message: `Unknown capability ID: "${capabilityId}"` }],
    };
  }

  if (configuration === null || typeof configuration !== "object" || Array.isArray(configuration)) {
    return {
      valid: false,
      errors: [{ message: "Configuration must be a non-null object" }],
    };
  }

  const errors: ValidationError[] = [];

  // Check required parameters across all parameter kinds
  for (const param of capability.parameters) {
    if (param.required && (configuration[param.name] === undefined || configuration[param.name] === null)) {
      errors.push({
        parameter: param.name,
        message: `Missing required parameter "${param.name}"`,
      });
    }
  }

  // Check types, ranges, enums on provided parameters
  for (const [key, value] of Object.entries(configuration)) {
    if (value === undefined) continue;
    const param = capability.parameters.find((p) => p.name === key);
    if (!param) continue; // Allow extra runtime options or unknown props

    if (param.type === "number") {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors.push({
          parameter: key,
          message: `Parameter "${key}" must be a finite number, received ${String(value)}`,
        });
      } else if (param.range) {
        if (param.range.min !== undefined && value < param.range.min) {
          errors.push({
            parameter: key,
            message: `Parameter "${key}" must be >= ${param.range.min} (minimum), received ${value}`,
          });
        }
        if (param.range.max !== undefined && value > param.range.max) {
          errors.push({
            parameter: key,
            message: `Parameter "${key}" must be <= ${param.range.max} (maximum), received ${value}`,
          });
        }
      }
    } else if (param.type === "string") {
      if (typeof value !== "string") {
        errors.push({
          parameter: key,
          message: `Parameter "${key}" must be a string, received ${typeof value}`,
        });
      }
    } else if (param.type === "boolean") {
      if (typeof value !== "boolean") {
        errors.push({
          parameter: key,
          message: `Parameter "${key}" must be a boolean, received ${typeof value}`,
        });
      }
    }

    if (param.enum && !param.enum.includes(value as string | number)) {
      errors.push({
        parameter: key,
        message: `Parameter "${key}" must be one of: ${param.enum.join(", ")}, received ${String(value)}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Exports the raw catalogue capabilities array as serialized JSON.
 */
export function exportCatalogueJson(pretty = true): string {
  return JSON.stringify(CAPABILITIES, null, pretty ? 2 : 0);
}

/**
 * Exports the complete schema document with version metadata and category breakdown.
 */
export function exportCatalogueDocument(): CatalogueDocument {
  return {
    $schema: "https://af-motion.dev/schemas/catalogue-v1.json",
    version: SCHEMA_VERSION,
    totalCapabilities: CAPABILITIES.length,
    categories: CAPABILITY_CATEGORIES,
    capabilities: CAPABILITIES,
  };
}
// --- AI Motion Registry Initialization & Converters ---

function convertCatalogueCapabilityToAICapability(item: CapabilityMetadata): AIMotionCapability {
  const isReact = item.category === "react" || item.id.startsWith("react-");
  let defaultConfiguration: Record<string, unknown> | undefined;
  for (const param of item.parameters) {
    if (param.default !== undefined) {
      if (!defaultConfiguration) defaultConfiguration = {};
      defaultConfiguration[param.name] = param.default;
    }
  }

  return {
    id: item.id,
    name: item.name,
    category: item.category as AIMotionCategory,
    description: item.description,
    tags: item.tags,
    parameters: item.parameters,
    schema: deriveJsonSchemaFromParameters(item.parameters, defaultConfiguration),
    defaultConfiguration,
    supportedTargets: item.supportedTargets,
    signature: item.signature,
    controls: item.controls,
    callbacks: item.callbacks,
    callbackDescriptors: item.callbackDescriptors,
    reducedMotion: item.reducedMotion,
    compatibility: item.compatibility,
    react: {
      available: isReact || item.signature.importStatement.includes("react"),
      componentName: isReact && /^[A-Z]/.test(item.name) ? item.name : undefined,
      hookName: item.name.startsWith("use") ? item.name : undefined,
      importPath: isReact ? "af-motion/react" : "af-motion",
    },
    custom: false,
  };
}

function convertPresetToAICapability(preset: MotionPreset): AIMotionCapability {
  const parameters: ParameterMetadata[] = [];
  let defaultConfiguration: Record<string, unknown> | undefined;

  if (preset.configurableParameters) {
    for (const p of preset.configurableParameters) {
      parameters.push({
        name: p.name,
        kind: "option",
        type: p.type,
        required: Boolean(p.required),
        default: p.default,
        description: p.description,
      });
      if (p.default !== undefined) {
        if (!defaultConfiguration) defaultConfiguration = {};
        defaultConfiguration[p.name] = p.default;
      }
    }
  }

  return {
    id: preset.id,
    name: preset.name,
    category: "preset",
    description: preset.description,
    tags: [preset.category, "preset", ...(preset.tags ?? [])],
    parameters,
    schema: deriveJsonSchemaFromParameters(parameters, defaultConfiguration),
    defaultConfiguration,
    supportedTargets: preset.supportedTargets ? [...preset.supportedTargets] : ["Element", "HTMLElement", "SVGElement"],
    signature: preset.signature ? {
      importStatement: preset.signature.importStatement,
      invocation: preset.signature.invocation,
      exampleCode: preset.signature.exampleCode,
    } : {
      importStatement: 'import { animatePreset } from "af-motion";',
      invocation: `animatePreset(element, "${preset.id}", options);`,
      exampleCode: `import { animatePreset } from "af-motion";\n\nawait animatePreset(element, "${preset.id}");`,
    },
    reducedMotion: preset.reducedMotion as unknown as ReducedMotionBehavior,
    compatibility: {
      browser: true,
      ssr: false,
      requiresDom: true,
    },
    react: {
      available: true,
      hookName: "useAnimate",
      importPath: "af-motion/react",
    },
    custom: false,
  };
}

function convertRecipeToAICapability(recipe: DeclarativeMotionRecipe): AIMotionCapability {
  const parameters: ParameterMetadata[] = [];
  if (recipe.parameters) {
    for (const p of recipe.parameters) {
      parameters.push({
        name: p.name,
        kind: "option",
        type: p.type,
        required: Boolean(p.required),
        default: p.default,
        description: p.description,
      });
    }
  }

  return {
    id: recipe.id,
    name: recipe.name,
    category: "recipe",
    description: recipe.description,
    tags: ["recipe", ...(recipe.tags ?? [])],
    parameters,
    schema: deriveJsonSchemaFromParameters(parameters, recipe.defaultOptions as Record<string, unknown> | undefined),
    defaultConfiguration: recipe.defaultOptions as Record<string, unknown> | undefined,
    supportedTargets: recipe.requiredTargets ? [...recipe.requiredTargets] : ["Element", "HTMLElement", "SVGElement"],
    signature: {
      importStatement: 'import { runRecipe } from "af-motion";',
      invocation: `runRecipe("${recipe.id}", targets, options);`,
      exampleCode: `import { runRecipe } from "af-motion";\n\nawait runRecipe("${recipe.id}", { root: element });`,
    },
    reducedMotion: "skips-to-endpoint",
    compatibility: {
      browser: true,
      ssr: false,
      requiresDom: true,
    },
    custom: false,
  };
}

function convertMotionDNAToAICapability(dna: MotionDNA): AIMotionCapability {
  const id = dna.id ?? (dna.name ? `dna-${dna.name.toLowerCase()}` : "dna-profile");
  const name = dna.name ?? id;
  const parameters: ParameterMetadata[] = [];
  if (dna.configurableParameters) {
    for (const p of dna.configurableParameters) {
      parameters.push({
        name: p.name,
        kind: "option",
        type: p.type,
        required: false,
        default: p.default,
        description: p.description,
        range: p.range,
      });
    }
  }

  const defaultConfiguration: Record<string, unknown> = {
    personality: dna.personality,
    duration: dna.duration,
    delay: dna.delay,
    playbackRate: dna.playbackRate,
    easing: dna.easing,
  };

  return {
    id,
    name,
    category: "motion-dna",
    description: dna.description ?? `Motion DNA profile representing ${dna.personality ?? name} movement dynamics.`,
    tags: ["motion-dna", "profile", ...(dna.personality ? [dna.personality] : []), ...(dna.tags ?? [])],
    parameters,
    schema: deriveJsonSchemaFromParameters(parameters, defaultConfiguration),
    defaultConfiguration,
    supportedTargets: ["Element", "HTMLElement", "SVGElement"],
    signature: {
      importStatement: 'import { applyMotionDNA } from "af-motion";',
      invocation: `applyMotionDNA(element, "${id}", options);`,
      exampleCode: dna.exampleUsage ?? `import { applyMotionDNA } from "af-motion";\n\napplyMotionDNA(element, "${id}");`,
    },
    reducedMotion: dna.respectReducedMotion ? "respects-profile" : "not-applicable",
    compatibility: {
      browser: true,
      ssr: true,
      requiresDom: false,
    },
    custom: false,
  };
}

function convertDesignSystemToAICapability(ds: DesignSystem): AIMotionCapability {
  const defaultConfiguration: Record<string, unknown> = {
    intensity: ds.intensity ?? 1.0,
    timing: ds.timing,
    spacing: ds.spacing,
    easings: ds.easings,
  };

  return {
    id: ds.id,
    name: ds.name,
    category: "design-system",
    description: ds.description ?? `Design system tokens and motion choreography presets for ${ds.name}.`,
    tags: ["design-system", ...(ds.metadata?.tags ?? [])],
    defaultConfiguration,
    supportedTargets: ["Element", "HTMLElement", "SVGElement"],
    signature: {
      importStatement: 'import { resolveDesignSystem } from "af-motion/presets";',
      invocation: `resolveDesignSystem("${ds.id}");`,
      exampleCode: `import { resolveDesignSystem } from "af-motion/presets";\n\nconst ds = resolveDesignSystem("${ds.id}");`,
    },
    reducedMotion: "respects-profile",
    compatibility: {
      browser: true,
      ssr: true,
      requiresDom: false,
    },
    custom: false,
  };
}

function convertChoreographyToAICapability(ch: ChoreographyDefinition): AIMotionCapability {
  return {
    id: ch.id,
    name: ch.name,
    category: "choreography",
    description: ch.description ?? `Multi-target choreography routine for ${ch.name}.`,
    tags: ["choreography", ...(ch.metadata?.tags ?? [])],
    supportedTargets: ch.targets ? [...ch.targets] : ["Element", "HTMLElement", "SVGElement"],
    signature: {
      importStatement: 'import { createMotionChoreography } from "af-motion";',
      invocation: `createMotionChoreography({ ...choreography, targets });`,
      exampleCode: `import { createMotionChoreography, getChoreography } from "af-motion";\n\nconst ch = getChoreography("${ch.id}");\nif (ch) {\n  const ctrl = createMotionChoreography({ ...ch, targets: { root: element } });\n  await ctrl.play();\n}`,
    },
    reducedMotion: "skips-to-endpoint",
    compatibility: {
      browser: true,
      ssr: false,
      requiresDom: true,
    },
    custom: false,
  };
}

function convertPaletteToAICapability(paletteName: string): AIMotionCapability | undefined {
  const palette = getPalette(paletteName);
  if (!palette) return undefined;
  const kebab = paletteName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `palette-${kebab}`,
    name: `${palette.name} Palette`,
    category: "palette",
    description: `Color palette tokens for ${palette.name} theme.`,
    tags: ["palette", "color", "theme", palette.name.toLowerCase()],
    defaultConfiguration: palette.tokens as unknown as Record<string, unknown>,
    supportedTargets: ["Canvas", "Element", "CSS"],
    signature: {
      importStatement: 'import { getPalette } from "af-motion";',
      invocation: `getPalette("${palette.name}");`,
      exampleCode: `import { getPalette } from "af-motion";\n\nconst palette = getPalette("${palette.name}");`,
    },
    reducedMotion: "not-applicable",
    compatibility: {
      browser: true,
      ssr: true,
      requiresCanvas: false,
      requiresDom: false,
    },
    custom: false,
  };
}

/**
 * Builds the initial capability set covering all AF Motion systems.
 */
export function buildInitialRegistryCapabilities(): AIMotionCapability[] {
  const result: AIMotionCapability[] = [];

  for (const cap of CAPABILITIES) {
    result.push(convertCatalogueCapabilityToAICapability(cap));
  }

  for (const preset of BUILT_IN_MOTION_PRESETS) {
    result.push(convertPresetToAICapability(preset));
  }

  for (const recipe of BUILT_IN_MOTION_RECIPES) {
    result.push(convertRecipeToAICapability(recipe));
  }

  for (const dna of BUILT_IN_MOTION_DNA) {
    result.push(convertMotionDNAToAICapability(dna));
  }

  for (const ds of BUILT_IN_DESIGN_SYSTEMS) {
    result.push(convertDesignSystemToAICapability(ds));
  }

  for (const ch of BUILT_IN_CHOREOGRAPHIES) {
    result.push(convertChoreographyToAICapability(ch));
  }

  for (const paletteName of listPalettes()) {
    const paletteCap = convertPaletteToAICapability(paletteName);
    if (paletteCap) {
      result.push(paletteCap);
    }
  }

  return result;
}

/**
 * Default global AI Motion Registry instance containing all AF Motion capabilities.
 */
export const aiMotionRegistry: AIMotionRegistry = createAIMotionRegistry(buildInitialRegistryCapabilities());
setDefaultRegistryResolver(() => aiMotionRegistry);
setDesignRegistryResolver(() => aiMotionRegistry);
setCompositionRegistryResolver(() => aiMotionRegistry);
setCorrectorRegistryResolver(() => aiMotionRegistry);
setGenerationPipelineRegistryResolver(() => aiMotionRegistry);

/**
 * Registers a capability with the global AI Motion Registry.
 */
export function registerCapability(capability: AIMotionCapability, options?: { override?: boolean }): void {
  aiMotionRegistry.registerCapability(capability, options);
}

/**
 * Unregisters a custom capability from the global AI Motion Registry.
 */
export function unregisterCapability(id: string): boolean {
  return aiMotionRegistry.unregisterCapability(id);
}

/**
 * Retrieves schema info and defaults for a capability.
 */
export function getCapabilitySchema(id: string): UnifiedMotionSchema | undefined {
  return aiMotionRegistry.getCapabilitySchema(id);
}

/**
 * Retrieves a schema by canonical schema URI (e.g. "af-motion:schema:capability:preset-fade-in") or capability ID.
 */
export function getSchemaById(schemaId: string): UnifiedMotionSchema | undefined {
  return aiMotionRegistry.getSchemaById(schemaId);
}

/**
 * Lists all capability schemas with optional category, tag, or version filtering.
 */
export function listSchemas(filter?: SchemaFilterOptions): readonly UnifiedMotionSchema[] {
  return aiMotionRegistry.listSchemas(filter);
}

/**
 * Exports all schemas in the registry into a unified machine-readable JSON Schema document.
 */
export function exportSchemas(options?: { pretty?: boolean; category?: string }): SchemasDocument {
  return aiMotionRegistry.exportSchemas(options);
}

// Re-export unified schema validation engine and helpers
export {
  SCHEMA_SPEC_VERSION,
  createSchemaId,
  validateSchema,
  validateConfiguration,
  resolveConfigurationDefaults,
  createUnifiedSchema,
  type UnifiedMotionSchema,
  type SchemaPropertyDescriptor,
  type SchemaPropertyType,
  type SchemaCapabilityCategory,
  type ConfigurationValidationError,
  type ConfigurationValidationOptions,
  type ConfigurationValidationResult,
  type SchemaValidationError,
  type SchemaValidationResult,
  type SchemasDocument,
  type SchemaFilterOptions,
};

/**
 * Returns all distinct capability categories in the registry.
 */
export function getCapabilityCategories(): readonly string[] {
  return aiMotionRegistry.getCategories();
}

/**
 * Returns all distinct capability tags in the registry.
 */
export function getCapabilityTags(): readonly string[] {
  return aiMotionRegistry.getTags();
}

/**
 * Exports a deterministic JSON document of the AI Motion Registry.
 */
export function exportRegistry(options?: RegistryExportOptions): RegistryDocument {
  return aiMotionRegistry.exportRegistry(options);
}

/**
 * Resets the registry by removing all custom capabilities.
 */
export function resetCapabilityRegistry(): void {
  aiMotionRegistry.reset();
}

/**
 * Lists capabilities from the global AI Motion Registry with optional filtering.
 */
export function listRegistryCapabilities(filter?: CapabilityFilterOptions): readonly AIMotionCapability[] {
  return aiMotionRegistry.listCapabilities(filter);
}

/**
 * Retrieves a capability from the global AI Motion Registry by ID.
 */
export function getRegistryCapability(id: string): AIMotionCapability | undefined {
  return aiMotionRegistry.getCapability(id);
}

// --- Re-exports from AI Motion Registry Core ---
export {
  createAIMotionRegistry,
  validateCapability,
  deriveJsonSchemaFromParameters,
  type AIMotionCapability,
  type AIMotionCategory,
  type AIMotionRegistry,
  type CapabilityAccessibilityMetadata,
  type CapabilityConfigurationProperty,
  type CapabilityConfigurationSchema,
  type CapabilityDependencies,
  type CapabilityExample,
  type CapabilityFilterOptions,
  type CapabilityReactMetadata,
  type CapabilityRegistrationValidationError,
  type CapabilitySchemaInfo,
  type CapabilitySearchQuery,
  type CapabilityValidationResult,
  type RegistryDocument,
  type RegistryExportOptions,
} from "./core/ai-motion-registry.js";

// --- Re-exports from Motion Preset System ---
export {
  BUILT_IN_MOTION_PRESETS,
  MOTION_PRESET_CATEGORIES,
  PRESET_SCHEMA_VERSION,
  exportPresetDocument,
  exportPresetsJson,
  getPreset,
  getPresetsByCategory,
  listPresetCategories,
  listPresets,
  searchPresets,
  validatePreset,
  validatePresetOverrides,
  type MotionPreset,
  type MotionPresetAnimationConfig,
  type MotionPresetCategory,
  type MotionPresetChoreographyConfig,
  type MotionPresetOverrides,
  type MotionPresetStepConfig,
  type PresetDocument,
  type PresetParameterSchema,
  type PresetReducedMotionBehavior,
  type PresetTargetType,
  type PresetUsageSignature,
  type PresetValidationError,
  type PresetValidationResult,
} from "./presets.js";
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
// --- Re-exports from Motion DNA System ---
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
  applyAdaptivePreset,
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
} from "./presets.js";
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
} from "./presets.js";

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
} from "./presets.js";
// --- Natural-Language-to-Motion Interpretation Engine ---
export {
  interpretMotionPrompt,
  type InterpretOptions,
  type MotionAccessibilitySpecification,
  type MotionAlternativeRecommendation,
  type MotionInteractionOptions,
  type MotionInterpretationResult,
  type MotionScrollOptions,
  type MotionSpecification,
  type MotionStaggerOptions,
  type MotionTargetSpecification,
  type MotionTriggerType,
} from "./core/natural-motion.js";
// --- Design Intelligence & Context Interpretation Engine ---
export {
  DESIGN_CONTEXT_SPEC_VERSION,
  DEFAULT_DESIGN_CONTEXT,
  createDesignContext,
  normalizeDesignContext,
  validateDesignContext,
  interpretDesignRequirements,
  toNaturalMotionContext,
  setDesignRegistryResolver,
  getEffectiveDesignRegistry,
  type WebsiteCategory,
  type BrandPersonality,
  type ColorModePreference,
  type VisualVibrancy,
  type LayoutDensity,
  type LayoutStructure,
  type MotionIntensity,
  type TargetAudience,
  type IndustrySector,
  type ComponentRequirements,
  type InteractionRequirements,
  type ResponsivenessRequirements,
  type AccessibilityRequirements,
  type PerformanceConstraints,
  type MotionPreferences,
  type VisualDirection,
  type ContentHierarchy,
  type DesignContext,
  type DesignConflict,
  type RecommendedVisualStyle,
  type RecommendedMotion,
  type DesignDetectedCharacteristics,
  type DesignInterpretationResult,
  type DesignInterpretationOptions,
  type DesignContextValidationResult,
} from "./core/design-intelligence.js";
// --- Component & Scene Composition Engine ---
export {
  COMPOSITION_SPEC_VERSION,
  createComposition,
  addCompositionNode,
  removeCompositionNode,
  updateCompositionNode,
  buildCompositionTree,
  validateComposition,
  exportCompositionJson,
  importCompositionFromJson,
  composeScene,
  setCompositionRegistryResolver,
  getEffectiveCompositionRegistry,
  type CompositionNode,
  type CompositionNodeType,
  type NodeTargetDescriptor,
  type NodeTimingConfig,
  type NodeStaggerConfig,
  type NodeLayoutMetadata,
  type CompositionAccessibilitySettings,
  type MotionComposition,
  type CompositionTree,
  type CompositionValidationError,
  type CompositionConflict,
  type CompositionValidationResult,
  type CompositionResult,
  type CompositionOptions,
  type ComposeSceneRequest,
} from "./core/composition.js";

export {
  CORRECTION_ENGINE_VERSION,
  correctConfiguration,
  validateAndCorrectConfiguration,
  correctComposition,
  setCorrectorRegistryResolver,
  getEffectiveCorrectorRegistry,
  type CorrectionSafety,
  type CorrectionRuleType,
  type CorrectionSuggestion,
  type ConfigurationIssue,
  type CorrectionReport,
  type CorrectionOptions,
  type CorrectionResult,
  type CompositionCorrectionResult,
} from "./core/configuration-corrector.js";

export {
  PIPELINE_VERSION,
  generateMotion,
  generateMotionSync,
  setGenerationPipelineRegistryResolver,
  getEffectiveGenerationRegistry,
  type GenerationStage,
  type GenerationRequest,
  type GenerationOptions,
  type GenerationContext,
  type GenerationDiagnostics,
  type GenerationError,
  type GenerationResult,
  type ReactIntegrationOutput,
  type ReactHierarchyNode,
} from "./core/generation-pipeline.js";

export {
  VISUAL_STYLE_SCHEMA_SPEC_VERSION,
  visualStyleRegistry,
  createVisualStyleRegistry,
  checkStyleCompatibility,
  resolveVisualStyle,
  validateVisualStyleDefinition,
  createVisualStyleSchema,
  type VisualStyleCategory,
  type VisualStyleTypography,
  type VisualStyleShapeLanguage,
  type VisualStyleLayout,
  type VisualStyleGraphics,
  type VisualStyleTextures,
  type VisualStyleSurfaces,
  type VisualStyleLighting,
  type VisualStyleBackground,
  type VisualStyleComponents,
  type VisualStyleMotion,
  type VisualStyleGraphicsCompatibility,
  type VisualStyleThreeDCompatibility,
  type VisualStyleResponsive,
  type VisualStyleAccessibility,
  type VisualStyleReactMetadata,
  type VisualStyleDefinition,
  type VisualStyleFilter,
  type StyleCompatibilityContext,
  type StyleConflict,
  type StyleCompatibilityReport,
  type ResolvedVisualStyle,
  type VisualStyleRegistry,
  computeSkeuomorphicStyle,
  type SkeuomorphicMaterial,
  type SkeuomorphicStyleOptions,
  type SkeuomorphicStyleResult,
  computeNeumorphicStyle,
  type NeumorphicShape,
  type NeumorphicLightSource,
  type NeumorphicStyleOptions,
  type NeumorphicStyleResult,
  computeArtNouveauStyle,
  type ArtNouveauVariant,
  type ArtNouveauStyleOptions,
  type ArtNouveauStyleResult,
  ART_NOUVEAU_WHIPLASH_PATH,
  ART_NOUVEAU_CORNER_PATH,
  ART_NOUVEAU_DIVIDER_PATH,
  getStyleMotionConfig,
  type StyleMotionConfig,
  computeLiquidChromeStyle,
  type LiquidChromeVariant,
  type LiquidChromeStyleOptions,
  type LiquidChromeStyleResult,
  computeDeStijlStyle,
  type DeStijlVariant,
  type DeStijlStyleOptions,
  type DeStijlStyleResult,
  computeMemphisStyle,
  type MemphisVariant,
  type MemphisPatternType,
  type MemphisStyleOptions,
  type MemphisStyleResult,
  MEMPHIS_SQUIGGLE_PATH,
  MEMPHIS_ZIGZAG_PATH,
  MEMPHIS_TRIANGLE_PATH,
  MEMPHIS_CIRCLE_PATH,
  computePsychedelicStyle,
  type PsychedelicVariant,
  type PsychedelicStyleOptions,
  type PsychedelicStyleResult,
  computeVaporwaveStyle,
  type VaporwaveVariant,
  type VaporwaveStyleOptions,
  type VaporwaveStyleResult,
  computeSteampunkStyle,
  type SteampunkVariant,
  type SteampunkStyleOptions,
  type SteampunkStyleResult,
  PSYCHEDELIC_WAVE_PATH,
  PSYCHEDELIC_FLOWER_PATH,
  VAPORWAVE_SUNSET_PATH,
  VAPORWAVE_GRID_PATH,
  STEAMPUNK_GEAR_PATH,
  STEAMPUNK_BRACKET_PATH,
  computeGrungeStyle,
  type GrungeVariant,
  type GrungeStyleOptions,
  type GrungeStyleResult,
  computePaperCutoutStyle,
  type PaperCutoutVariant,
  type PaperCutoutStyleOptions,
  type PaperCutoutStyleResult,
  computeGlitchStyle,
  type GlitchVariant,
  type GlitchStyleOptions,
  type GlitchStyleResult,
  GRUNGE_TAPE_PATH,
  GRUNGE_SPLATTER_PATH,
  GRUNGE_SCRATCH_PATH,
  PAPER_CUTOUT_WAVE_PATH,
  PAPER_FOLDED_CORNER_PATH,
  PAPER_PERFORATION_PATH,
  GLITCH_CROSSHAIR_PATH,
  GLITCH_BARCODE_PATH,
  GLITCH_CORNER_TECH_PATH,
  computeAntiDesignStyle,
  type AntiDesignVariant,
  type AntiDesignStyleOptions,
  type AntiDesignStyleResult,
  compute3DInflatedStyle,
  type Inflated3DVariant,
  type Inflated3DStyleOptions,
  type Inflated3DStyleResult,
  computeIsometricStyle,
  type IsometricVariant,
  type IsometricStyleOptions,
  type IsometricStyleResult,
  ANTI_DESIGN_STRIPES_PATH,
  ANTI_DESIGN_CROSS_PATH,
  ANTI_DESIGN_BURST_PATH,
  INFLATED_3D_BUBBLE_PATH,
  INFLATED_3D_PILL_PATH,
  INFLATED_3D_CLOUD_PATH,
  ISOMETRIC_CUBE_PATH,
  ISOMETRIC_GRID_PATH,
  ISOMETRIC_PYRAMID_PATH,
  computeUkiyoeStyle,
  type UkiyoeVariant,
  type UkiyoeStyleOptions,
  type UkiyoeStyleResult,
  computeBrutalistStyle,
  type BrutalistVariant,
  type BrutalistStyleOptions,
  type BrutalistStyleResult,
  computeBauhausStyle,
  type BauhausVariant,
  type BauhausStyleOptions,
  type BauhausStyleResult,
  computeMidCenturyModernStyle,
  type MidCenturyModernVariant,
  type MidCenturyModernStyleOptions,
  type MidCenturyModernStyleResult,
  UKIYOE_WAVE_PATH,
  UKIYOE_CLOUD_PATH,
  UKIYOE_HANKO_PATH,
  BRUTALIST_CROSSHAIR_PATH,
  BRUTALIST_CORNER_PATH,
  BRUTALIST_ARROW_PATH,
  BAUHAUS_TRIANGLE_PATH,
  BAUHAUS_CIRCLE_PATH,
  BAUHAUS_SQUARE_PATH,
  MCM_SUNBURST_PATH,
  MCM_BOOMERANG_PATH,
  MCM_KIDNEY_PATH,
} from "./core/visual-style-registry.js";

// ============================================================================
// Graphics Rendering & Shader Infrastructure (Prompt 71)
// ============================================================================
export {
  type RendererBackend,
  type GraphicsEngineState,
  type GraphicsCapabilities,
  type CapabilityDetectionOptions,
  type RendererOptions,
  type RenderFrameContext,
  type Renderer,
  type DisposableResource,
  type ResourceManager,
  type GraphicsEffectRequirement,
  type GraphicsEffectAccessibility,
  type GraphicsEffectInitContext,
  type GraphicsEffectUpdateContext,
  type GraphicsEffect,
  type GraphicsEngineOptions,
  type GraphicsEngine,
  type CanvasDimensions,
  type ValidationReport,
  detectGraphicsCapabilities,
  resetCachedGraphicsCapabilities,
  DEFAULT_FALLBACK_CAPABILITIES,
  createResourceManager,
  updateCanvasDimensions,
  getCanvasDimensions,
  setupResizeObserver,
  setupVisibilityObserver,
  createRenderer,
  Canvas2DRenderer,
  WebGLRenderer,
  NullRenderer,
  createGraphicsEngine,
  GRAPHICS_SCHEMA_VERSION,
  RENDERER_OPTIONS_SCHEMA,
  GRAPHICS_ENGINE_OPTIONS_SCHEMA,
  GRAPHICS_CAPABILITIES_SCHEMA,
  validateRendererOptions,
  validateGraphicsEngineOptions,
  validateGraphicsEffect,
  validateGraphicsEffectConfig,
  GRAPHICS_RENDERING_CAPABILITY,
  registerGraphicsCapability,
  type MaterialType,
  type MaterialUniforms,
  type MaterialProperty,
  type SurfaceBorderOptions,
  type SurfaceHighlightOptions,
  type SurfaceDefinition,
  type SurfaceStyleResult,
  type AmbientLight,
  type DirectionalLight,
  type PointLight,
  type HighlightConfig,
  type ShadowConfig,
  type EnvironmentLighting,
  type LightingConfig,
  type ResolvedLighting,
  type MaterialDefinition,
  type GlassPresetName,
  type GlassMaterialOptions,
  type GlassStyleResult,
  type ComputeSurfaceOptions,
  MATTE_MATERIAL,
  METALLIC_MATERIAL,
  PLASTIC_MATERIAL,
  EMISSIVE_MATERIAL,
  TRANSLUCENT_MATERIAL,
  MATERIAL_PRESETS,
  getMaterialPreset,
  STUDIO_LIGHTING,
  DRAMATIC_LIGHTING,
  AMBIENT_SOFT_LIGHTING,
  NEON_LIGHTING,
  SUNSET_LIGHTING,
  LIGHTING_PRESETS,
  getLightingPreset,
  FROSTED_GLASS_PRESET,
  CLEAR_GLASS_PRESET,
  TINTED_GLASS_PRESET,
  LIQUID_GLASS_PRESET,
  ACRYLIC_PRESET,
  TRANSLUCENT_PANEL_PRESET,
  GLASS_PRESETS,
  getGlassPreset,
  formatShadowsCss,
  resolveLighting,
  computeLightInteraction,
  computeSurfaceStyle,
  isBackdropFilterSupported,
  computeGlassStyle,
  createGlassEffect,
  MATERIALS_SCHEMA_VERSION,
  SURFACE_DEFINITION_SCHEMA,
  LIGHTING_CONFIG_SCHEMA,
  MATERIAL_DEFINITION_SCHEMA,
  GLASS_OPTIONS_SCHEMA,
  validateSurfaceDefinition,
  validateLightingConfig,
  validateMaterialDefinition,
  validateGlassOptions,
  correctMaterialConfig,
  correctGlassConfig,
  MATERIALS_SYSTEM_CAPABILITY,
  registerMaterialsCapability,
  type TextureGeneratorName,
  type TextureQuality,
  type TextureBlendMode,
  type TextureRepeatMode,
  type WebGLTextureDescriptor,
  type ProceduralTextureOptions,
  type ProceduralTextureConfig,
  type GeneratedTexture,
  type TextureCacheStats,
  type TextureMappingOptions,
  type TextureGeneratorMetadata,
  type PRNG,
  type GeneratorOutput,
  type GeneratorFn,
  type TextureCacheOptions,
  type GenerateTextureExecutionOptions,
  hashSeed,
  createPRNG,
  parseColor,
  createSafeCanvas,
  encodeSvgDataUrl,
  generateNoise,
  generatePaper,
  generateFabric,
  generateMarble,
  generateWood,
  generateMetalBrush,
  generateHalftone,
  generateDots,
  generateStripes,
  generateOrganicGradient,
  generateTopographic,
  generateImperfections,
  TEXTURE_GENERATORS,
  TEXTURE_GENERATORS_METADATA,
  TextureCache,
  defaultTextureCache,
  buildTextureCacheKey,
  generateProceduralTexture,
  getTextureGeneratorMetadata,
  listTextureGenerators,
  resolveTextureInput,
  applyTextureToSurface,
  TEXTURE_SCHEMA_VERSION,
  VALID_TEXTURE_GENERATORS,
  TEXTURE_OPTIONS_SCHEMA,
  TEXTURE_CONFIG_SCHEMA,
  validateTextureOptions,
  validateTextureConfig,
  correctTextureConfig,
  TEXTURE_GENERATION_CAPABILITY,
  registerTextureCapability,
  type DistortionType,
  type DistortionOptions,
  type FluidType,
  type FluidOptions,
  type ParticleShape,
  type ParticleOrigin,
  type ParticleEmitterOptions,
  type ParticleOptions,
  type ParticleState,
  type AdvancedEffectType,
  type AdvancedEffectOptions,
  type ComposedGraphicsEffect,
  createDistortionEffect,
  createFluidEffect,
  ParticlePool,
  createParticleEffect,
  createAdvancedEffect,
  composeGraphicsEffects,
  EFFECTS_SCHEMA_VERSION,
  VALID_DISTORTION_TYPES,
  DISTORTION_OPTIONS_SCHEMA,
  validateDistortionOptions,
  correctDistortionOptions,
  VALID_FLUID_TYPES,
  FLUID_OPTIONS_SCHEMA,
  validateFluidOptions,
  correctFluidOptions,
  VALID_PARTICLE_SHAPES,
  PARTICLE_OPTIONS_SCHEMA,
  validateParticleOptions,
  correctParticleOptions,
  VALID_ADVANCED_EFFECT_TYPES,
  ADVANCED_EFFECT_OPTIONS_SCHEMA,
  validateAdvancedEffectOptions,
  correctAdvancedEffectOptions,
  DISTORTION_CAPABILITY,
  FLUID_EFFECTS_CAPABILITY,
  PARTICLE_EFFECTS_CAPABILITY,
  ADVANCED_EFFECTS_CAPABILITY,
  registerGraphicsEffectsCapabilities,
  type GraphicsQualityLevel,
  type GraphicsQualityProfile,
  type GraphicsFallbackDecision,
  type GraphicsLayerType,
  type GraphicsLayer,
  type GraphicsCompositionDefinition,
  type GraphicsPerformanceStats,
  type GraphicsCompositionInstance,
  type GraphicsInstanceOptions,
  type GraphicsInstance,
  type ResolveFallbackOptions,
  type CreateCompositionOptions,
  QUALITY_PROFILES,
  resolveQualityProfile,
  AdaptiveQualityMonitor,
  resolveGraphicsFallback,
  validateLayerDependencies,
  sortCompositionLayers,
  updateCompositionLayer,
  addCompositionLayer,
  removeCompositionLayer,
  createGraphicsComposition,
  createGraphicsInstance,
  COMPOSITION_SCHEMA_VERSION,
  GRAPHICS_LAYER_SCHEMA,
  GRAPHICS_COMPOSITION_SCHEMA,
  validateGraphicsLayer,
  validateGraphicsComposition,
  correctGraphicsComposition,
  GRAPHICS_COMPOSITION_CAPABILITY,
  registerGraphicsCompositionCapability,
} from "./graphics/index.js";


// 3D Scene & Rendering Infrastructure
export * from "./3d/index.js";
// Animation Intelligence & Decision Engine (Prompt 82)
export * from "./core/animation-intelligence/index.js";
// Automatic Transitions & Page Routing (Prompt 83)
export * from "./core/transitions/index.js";
// Scroll Intelligence & Adaptive Scroll Animations (Prompt 84)
export * from "./core/scroll-intelligence/index.js";

// Intelligent Microinteractions & Interactive Components (Prompt 85)
export * from "./core/microinteractions/index.js";

// Intelligent Choreography & 2D/3D Synchronization (Prompt 86)
export * from "./core/choreography-intelligence/index.js";

// Unified Motion Optimization & Validation (Prompt 87)
export * from "./core/motion-validation/index.js";

// Model Context Protocol (MCP) Integration (Prompt 88)
export * from "./mcp/index.js";

// Reference-to-React Implementation & Validation (Prompt 92)
export * from "./core/reference-analysis/index.js";

// Foundational Motion Physics Engine (Prompt 99)
export * from "./core/physics/index.js";


// Universal Interaction & Gestures Subsystem (Prompt 105)
export * from "./core/interactions/index.js";


// Automatic Layout Animation Engine (Prompt 111)
export * from "./core/layout/index.js";


// SVG Morphing Engine (Prompt 112)
export * from "./core/svg-morph/index.js";

// Motion Path Engine (Prompt 113)
export * from "./core/motion-path/index.js";

// Kinetic Typography Engine (Prompt 114)
export * from "./core/typography/index.js";

// Unified Advanced Motion Composition (Prompt 116)
export * from "./core/advanced-motion/index.js";


// GPU Simulation Architecture (Prompt 117)
export * from "./graphics/gpu-simulation/index.js";


// Advanced Particle Engine (Prompt 118)
export * from "./graphics/particles/index.js";

// Fluid & Flow Simulation (Prompt 119)
export * from "./graphics/fluid/index.js";

// Environmental Simulation Effects (Prompt 120)
export * from "./graphics/environment/index.js";

// Interactive Particle Fields & Forces (Prompt 121)
export * from "./graphics/particle-fields/index.js";


// Simulation Optimization & Lifecycle (Prompt 122)
export * from "./graphics/simulation/index.js";


// Disambiguate top-level math and collision symbols between core physics, motion path, and 3D
export {
  clamp,
  isFiniteNumber,
  roundPrecision,
  canCollide,
} from "./core/physics/index.js";

export {
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Lerp,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3Distance,
  vec3DistanceSq,
  vec3Normalize,
} from "./core/motion-path/index.js";

export {
  detectDeviceCapabilities,
  detectDeviceCapabilitiesAsync,
  detectDetailedGraphics,
  detectRuntimeEnvironment,
  detectMemoryCapabilities,
  detectCpuCapabilities,
  detectDisplayCapabilities,
  detectNetworkCapabilities,
  detectBatteryCapabilities,
  classifyDevice,
  calculateCapabilityScores,
  getDeviceCapabilityProfile,
  refreshDeviceCapabilities,
  resetCachedDeviceProfile,
  subscribeToCapabilityChanges,
  disposeCapabilityMonitor,
  isCapabilityMonitoringActive,
  type DeviceCapabilityProfile,
  type DeviceCategory,
  type RuntimeEnvironment,
  type DetectionStatus,
  type ValueWithStatus,
  type CapabilityScores,
  type DimensionScore,
  type DeviceDetectionOptions,
  type MockEnvironment,
  type CapabilityChangeListener,
  type CapabilitySubscription,
} from "./core/device-capabilities/index.js";

export {
  createAdaptiveQualityController,
  createQualityProfile,
  getRecommendedQuality,
  ORDERED_PRESETS,
  QUALITY_PRESET_VALUES,
  SETTING_ADAPTATION_PRIORITIES,
  SETTING_PERFORMANCE_IMPACT,
  NUMERIC_SETTING_BOUNDS,
  clampNumericSetting,
  buildUnifiedSettings,
  extractQualityValues,
  getLowerPreset,
  getHigherPreset,
  PerformanceTracker,
  ResolutionIntelligence,
  get3DQualityPolicy,
  getParticlesQualityPolicy,
  getFluidQualityPolicy,
  getEnvironmentQualityPolicy,
  getGpuSimulationQualityPolicy,
  getPhysicsQualityPolicy,
  getModelLodQualityPolicy,
  aggregateSystemPolicies,
  AdaptiveQualityController,
  type QualityPresetName,
  type FeatureQualityTier,
  type ShadowQualityTier,
  type LightingQualityTier,
  type MaterialQualityTier,
  type TextureQualityTier,
  type PostProcessingQualityTier,
  type EnvironmentalQualityTier,
  type GpuSimulationQualityTier,
  type QualitySettingDescriptor,
  type UnifiedQualitySettings,
  type QualitySettingKey,
  type QualityValues,
  type QualityOverrides,
  type QualityProfile,
  type QualityRecommendation,
  type PerformanceMetrics,
  type FrameMetricsInput,
  type QualityAdaptationEvent,
  type System3DQualityPolicy,
  type SystemParticlesQualityPolicy,
  type SystemFluidQualityPolicy,
  type SystemEnvironmentQualityPolicy,
  type SystemGpuSimulationQualityPolicy,
  type SystemPhysicsQualityPolicy,
  type SystemModelLodQualityPolicy,
  type SystemQualityPolicies,
  type DynamicResolutionResult,
  type UserQualityPreferences,
  type AdaptiveQualityControllerOptions,
  type QualityChangeListener,
  type QualitySubscription,
  type IAdaptiveQualityController,
} from "./core/adaptive-quality/index.js";

export {
  createPerformanceProfiler,
  PerformanceProfiler,
  analyzePerformanceBottlenecks,
  REGISTERED_STRATEGIES,
  getStrategyById,
  getCandidatesForBottlenecks,
  createWorkerTaskManager,
  WorkerTaskManager,
  createPerformanceOptimizer,
  PerformanceOptimizer,
  type MetricMeasurementStatus,
  type PerformanceMetricValue,
  type PerformanceSnapshot,
  type BottleneckCategory,
  type BottleneckSeverity,
  type BottleneckItem,
  type BottleneckAnalysisReport,
  type OptimizationCategory,
  type OptimizationMode,
  type OptimizationStrategyId,
  type OptimizationCandidate,
  type AppliedOptimizationRecord,
  type PerformanceProfilerOptions,
  type PerformanceOptimizerOptions,
  type WorkerTaskPriority,
  type WorkerTaskDefinition,
  type WorkerTaskResult,
  type IWorkerTaskManager,
  type IPerformanceProfiler,
  type IPerformanceOptimizer,
} from "./core/performance-optimizer/index.js";

export {
  createResourceRegistry,
  ResourceRegistry,
  createMemoryMonitor,
  MemoryMonitor,
  DEFAULT_MEMORY_BUDGETS,
  createResourceCache,
  ResourceCache,
  safeBufferPoolManager,
  SafeBufferPoolManager,
  detectResourceLeaks,
  GpuResourceIntelligence,
  createMemoryPressureController,
  MemoryPressureController,
  getResourceReport,
  type ResourceCategory,
  type ResourceLifecycleState,
  type DisposalStrategy,
  type MemoryPressureLevel,
  type IDisposable,
  type ResourceRegistrationOptions,
  type ResourceRecord,
  type ResourceScope as IResourceScopeRecord,
  type MemoryBudgetConfig,
  type MemoryBudgetStatus,
  type MemorySnapshot,
  type ResourceLeakItem,
  type ResourceCacheStats,
  type ResourceIntelligenceReport,
  type IResourceRegistry,
  type IMemoryMonitor,
  type IResourceCache,
  type IMemoryPressureController,
} from "./core/resource-intelligence/index.js";

export {
  createPerformanceIntelligence,
  PerformanceIntelligenceCoordinator,
  buildUnifiedPerformanceContext,
  evaluatePerformanceHealth,
  determineHealthStatus,
  HEALTH_SCORING_WEIGHTS,
  generatePerformanceDecisions,
  resolvePerformanceConflicts,
  PerformanceHistoryTracker,
  buildUnifiedPerformanceReport,
  QUALITY_PRESET_LADDER,
  getLowerQualityPreset,
  getHigherQualityPreset,
  QualityDegradationPolicy,
  QualityRecoveryPolicy,
  CpuOptimizationPolicy,
  MemoryPruningPolicy,
  GpuOptimizationPolicy,
  SimulationAdjustmentPolicy,
  BackgroundMaintenancePolicy,
  DEFAULT_PERFORMANCE_POLICIES,
  type PerformanceDecisionCategory,
  type DecisionRiskLevel,
  type ResponsibleSubsystem,
  type PerformanceDecision,
  type DimensionHealthScore,
  type PerformanceHealthScores,
  type UnifiedPerformanceContext,
  type ConflictResolutionResult,
  type DecisionExecutionResult,
  type UnifiedPerformanceReport,
  type PerformanceIntelligenceOptions,
  type IPerformanceIntelligence,
  type PerformanceIntelligenceContextSources,
  type DecisionPolicy,
  type SnapshotComparison,
} from "./core/performance-intelligence/index.js";

// AI Motion Intelligence (Phase 18, Prompt 141)
export {
  AI_MOTION_INTELLIGENCE_VERSION,
  classifyMotionIntent,
  evaluateMotionQuality,
  generateMotionRecommendations,
  updateRecommendationStatus,
  applyAcceptedRecommendations,
  BUILT_IN_MOTION_PATTERNS,
  queryPatternKnowledgeBase,
  generateIntelligenceExplanation,
  DeterministicMotionIntelligenceProvider,
  IntelligenceProviderRegistry,
  defaultIntelligenceRegistry,
  AIMotionIntelligenceEngine,
  aiMotionIntelligence,
  type AIMotionIntentType,
  type IntentSignal,
  type SecondaryIntentResult,
  type IntentClassificationResult,
  type QualityFindingSeverity,
  type QualityFindingCategory,
  type QualityFinding,
  type MotionQualityDimensions,
  type QualityGrade,
  type MotionQualityEvaluationResult,
  type RecommendationSeverity,
  type RecommendationStatus,
  type IntelligentMotionRecommendation,
  type MotionPatternDefinition,
  type IntelligenceExplanation,
  type MotionAnalysisInput,
  type MotionAnalysisOptions,
  type MotionAnalysisResult,
  type IAIMotionIntelligenceProvider,
} from "./core/ai-motion-intelligence/index.js";

// AI Design-to-Motion Generation (Phase 18, Prompt 142)
export {
  DESIGN_TO_MOTION_SPEC_VERSION,
  parseAndNormalizeDesignInput,
  analyzeDesignSpecification,
  planMotionFromDesign,
  generateMotionComposition,
  generateExportArtifacts,
  validateGeneratedMotion,
  DESIGN_TO_MOTION_PRESETS,
  listDesignToMotionPresets,
  getDesignToMotionPreset,
  DesignToMotionEngine,
  designToMotionEngine,
  type DesignElementType,
  type DesignInteractionCapability,
  type MotionDNAPersonalityOption,
  type DesignTransformSpec,
  type DesignDimensionsSpec,
  type DesignPositionSpec,
  type DesignStructuredElement,
  type DesignStructuredSpecification,
  type DesignTokenContext,
  type DesignNaturalLanguageInput,
  type DesignToMotionInput,
  type AnalyzedDesignElement,
  type DesignAnalysisResult,
  type MotionElementPhasePlan,
  type MotionElementInteractionPlan,
  type MotionPlanElement,
  type MotionPlan,
  type DesignToMotionValidation,
  type DesignToMotionExportArtifacts,
  type GeneratedMotionResult,
  type DesignToMotionPreset,
  type DesignToMotionOptions,
  type IDesignToMotionProvider,
} from "./core/design-to-motion/index.js";

// AI Scene & Animation Generation (Phase 18, Prompt 143)
export {
  SCENE_GENERATION_SPEC_VERSION,
  parseAndNormalizeSceneInput,
  analyzeSceneSpecification,
  planSceneExecution,
  generateSceneComposition,
  generateScene3DSpec,
  generateSceneExportArtifacts,
  validateGeneratedScene,
  AI_SCENE_PRESETS,
  listAIScenePresets,
  getAIScenePreset,
  AISceneGenerationEngine,
  aiSceneGenerationEngine,
  type SceneCategory,
  type SceneObjectType,
  type SceneLayerId,
  type SceneObjectTransform,
  type SceneObjectVisuals,
  type SceneObjectAnimation,
  type SceneObjectInteraction,
  type ScenePhysicsConfig,
  type SceneParticleConfig,
  type SceneObjectDefinition,
  type SceneCameraDefinition,
  type SceneLightingDefinition,
  type SceneEnvironmentDefinition,
  type StructuredSceneSpecification,
  type SceneNaturalLanguageInput,
  type AISceneGenerationInput,
  type SceneUnderstandingResult,
  type ScenePlan,
  type AISceneExportArtifacts,
  type GeneratedSceneResult,
  type AIScenePreset,
  type AISceneGenerationOptions,
  type IAISceneGenerationProvider,
  type SceneValidationResult,
} from "./core/scene-generation/index.js";


// Intelligent Agent Workflows (Phase 18, Prompt 144)
export {
  AGENT_WORKFLOWS_SPEC_VERSION,
  AgentRegistry,
  agentRegistry,
  SafeToolRegistry,
  safeToolRegistry,
  registerDefaultSafeTools,
  STANDARD_AGENTS,
  registerDefaultAgents,
  motionIntelligenceAgent,
  designToMotionAgent,
  sceneGenerationAgent,
  performanceOptimizationAgent,
  accessibilityAgent,
  compositionAgent,
  TaskPlanner,
  taskPlanner,
  TaskPlanValidationError,
  WorkflowContext,
  WorkflowExecutionEngine,
  workflowExecutionEngine,
  WORKFLOW_TEMPLATES,
  listWorkflowTemplates,
  getWorkflowTemplate,
  type AgentCategory,
  type AgentCapability,
  type AgentInputType,
  type AgentOutputType,
  type TaskStatus,
  type WorkflowStatus,
  type AgentMetadata,
  type ToolCallLog,
  type AgentExecutionContext,
  type AgentExecutionResult,
  type AgentDefinition,
  type AgentTask,
  type TaskPlan,
  type ToolPermission,
  type ToolDefinition,
  type WorkflowAuditEntry,
  type AgentWorkflowTelemetry,
  type WorkflowTemplate,
  type WorkflowExecutionOptions,
  type WorkflowExecutionResult,
} from "./core/agent-workflows/index.js";


// Multi-Agent Collaboration & Orchestration (Phase 18, Prompt 145)
export {
  ORCHESTRATION_SPEC_VERSION,
  SharedWorkflowContext,
  CollaborationPlanner,
  collaborationPlanner,
  AgentMessageBus,
  agentMessageBus,
  ConflictResolver,
  conflictResolver,
  MultiAgentOrchestrator,
  multiAgentOrchestrator,
  COLLABORATION_WORKFLOW_DEFINITIONS,
  listCollaborationWorkflows,
  getCollaborationWorkflow,
  type OrchestrationStrategy,
  type AgentMessageType,
  type AgentMessage,
  type CollaborationTask,
  type CollaborationPlan,
  type SharedArtifact,
  type ConflictType,
  type ResolutionStrategy,
  type ConflictRecord,
  type QualityGateStatus,
  type QualityGateCheck,
  type CollectiveValidationResult,
  type MultiAgentDeliverable,
  type OrchestrationOptions,
} from "./core/agent-workflows/index.js";


// Unified AI Ecosystem Integration (Phase 18, Prompt 146)
export {
  AI_ECOSYSTEM_SPEC_VERSION,
  UNIFIED_AI_CAPABILITIES,
  AIEcosystemCapabilityRegistry,
  aiEcosystemCapabilityRegistry,
  listAICapabilities,
  getAICapability,
  queryAICapabilities,
  DeterministicLocalAIProvider,
  deterministicLocalAIProvider,
  AIEcosystemPipelineCoordinator,
  aiEcosystemPipelineCoordinator,
  executeAIEcosystemPipeline,
  type AICapabilityCategory,
  type AICapabilityId,
  type AICapabilityDescriptor,
  type AIEcosystemScenario,
  type AIEcosystemResultState,
  type AIEcosystemRequest,
  type AIEcosystemResponse,
  type IAIEcosystemProvider,
} from "./core/ai-ecosystem/index.js";
