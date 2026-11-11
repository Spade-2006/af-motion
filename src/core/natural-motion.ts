/**
 * AF Motion Natural-Language-to-Motion Interpretation Engine
 *
 * Framework-independent interpretation layer that parses natural-language motion prompts
 * and produces structured, validated, machine-readable AF Motion specifications.
 */

import type {
  AIMotionCapability,
  AIMotionRegistry,
} from "./ai-motion-registry.js";
import {
  validateConfiguration,
  type ConfigurationValidationResult,
  type ReducedMotionBehavior,
  type SchemaCapabilityCategory,
} from "./schema.js";

export type MotionTriggerType = "load" | "scroll" | "hover" | "click" | "inView" | "pointer";

export interface MotionTargetSpecification {
  readonly selector?: string;
  readonly semanticRole?: string;
  readonly description?: string;
  readonly isCollection: boolean;
}

export interface MotionScrollOptions {
  readonly once?: boolean;
  readonly threshold?: number | number[];
  readonly rootMargin?: string;
  readonly axis?: "y" | "x";
}

export interface MotionInteractionOptions {
  readonly strength?: number;
  readonly distance?: number;
  readonly radius?: number;
  readonly hoverScale?: number;
  readonly returnSpeed?: number;
}

export interface MotionStaggerOptions {
  readonly delay: number;
  readonly from?: "start" | "first" | "center" | "end" | "last" | "edges" | "random";
}

export interface MotionAccessibilitySpecification {
  readonly respectReducedMotion: boolean;
  readonly reducedMotion: ReducedMotionBehavior;
  readonly fallbackProperties?: Readonly<Record<string, unknown>>;
  readonly screenReaderAnnounce?: boolean;
}

export interface MotionAlternativeRecommendation {
  readonly capabilityId: string;
  readonly category: string;
  readonly name: string;
  readonly confidence: number;
  readonly reason: string;
}

export interface MotionSpecification {
  readonly id: string;
  readonly prompt: string;
  readonly capabilityId: string;
  readonly matchedCapabilities: readonly string[];
  readonly category: SchemaCapabilityCategory;
  readonly target: MotionTargetSpecification;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string;
  readonly stagger?: MotionStaggerOptions;
  readonly trigger: MotionTriggerType;
  readonly scroll?: MotionScrollOptions;
  readonly interaction?: MotionInteractionOptions;
  readonly motionDNA?: string;
  readonly designSystem?: string;
  readonly accessibility: MotionAccessibilitySpecification;
  readonly schemaId?: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly metadata: {
    readonly extractedModifiers: readonly string[];
    readonly confidenceScore: number;
    readonly intent: string;
    readonly [key: string]: unknown;
  };
}

export interface MotionInterpretationResult {
  readonly success: boolean;
  readonly confidence: number;
  readonly specification?: MotionSpecification;
  readonly alternatives: readonly MotionAlternativeRecommendation[];
  readonly validation?: ConfigurationValidationResult;
  readonly warnings: readonly string[];
  readonly intent: {
    readonly action: string;
    readonly target: string;
    readonly modifiers: readonly string[];
    readonly trigger: MotionTriggerType;
  };
}

let defaultRegistryResolver: (() => AIMotionRegistry | undefined) | undefined;

/**
 * Registers the global AI Motion Registry resolver to maintain zero circular dependencies with catalogue.
 */
export function setDefaultRegistryResolver(resolver: () => AIMotionRegistry | undefined): void {
  defaultRegistryResolver = resolver;
}

/**
 * Resolves the effective registry from options or global resolver.
 */
export function getEffectiveRegistry(options?: InterpretOptions): AIMotionRegistry | undefined {
  return options?.registry ?? defaultRegistryResolver?.();
}

export interface InterpretOptions {
  readonly registry?: AIMotionRegistry;
  readonly context?: {
    readonly defaultTarget?: string;
    readonly motionDNA?: string;
    readonly designSystem?: string;
    readonly preferredCategory?: string;
  };
  readonly validate?: boolean;
  readonly minConfidence?: number;
  readonly strictTarget?: boolean;
}

interface CapabilityPatternRule {
  readonly id: string;
  readonly category: SchemaCapabilityCategory;
  readonly actionName: string;
  readonly patterns: readonly RegExp[];
  readonly weight: number;
  readonly defaultProperties?: Record<string, unknown>;
  readonly defaultTrigger?: MotionTriggerType;
  readonly defaultDuration?: number;
  readonly defaultEasing?: string;
  readonly alternativeIds?: readonly string[];
}

const CAPABILITY_RULES: readonly CapabilityPatternRule[] = [
  {
    id: "preset-fade-in",
    category: "preset",
    actionName: "fade-in",
    patterns: [
      /\bfade[\s-]?in\b/i,
      /\bfades[\s-]?in\b/i,
      /\bfading[\s-]?in\b/i,
      /\bappear\s+smoothly\b/i,
      /\bopacity\s+from\s+0\b/i,
      /\bentrance\b/i,
      /\benter\b/i,
    ],
    weight: 1.0,
    defaultProperties: { opacity: [0, 1] },
    defaultTrigger: "load",
    defaultDuration: 500,
    defaultEasing: "ease-out",
    alternativeIds: ["core-animate", "preset-scroll-reveal-rise", "preset-page-fade"],
  },
  {
    id: "preset-fade-out",
    category: "preset",
    actionName: "fade-out",
    patterns: [/\bfade[\s-]?out\b/i, /\bfades[\s-]?out\b/i, /\bdisappear\b/i],
    weight: 1.0,
    defaultProperties: { opacity: [1, 0] },
    defaultTrigger: "load",
    defaultDuration: 400,
    defaultEasing: "ease-in",
    alternativeIds: ["core-animate"],
  },
  {
    id: "pointer-magnetic",
    category: "pointer",
    actionName: "magnetic",
    patterns: [
      /\bmagnetic\b/i,
      /\bmagnet\b/i,
      /\battract(?:s|ing)?(?:\s+to)?\s+(?:cursor|pointer)\b/i,
    ],
    weight: 1.0,
    defaultProperties: { transform: "translate(0px, 0px)" },
    defaultTrigger: "hover",
    alternativeIds: ["pointer-hover-motion", "pointer-tilt", "pointer-spotlight"],
  },
  {
    id: "effect-stagger",
    category: "visual-effect",
    actionName: "stagger",
    patterns: [
      /\bstagger(?:ed|ing)?\b/i,
      /\bone[\s-]by[\s-]one\b/i,
      /\bcascade\b/i,
      /\bcascading\b/i,
      /\bsequential(?:ly)?\b/i,
    ],
    weight: 1.0,
    defaultProperties: { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
    defaultTrigger: "load",
    defaultDuration: 600,
    alternativeIds: ["preset-card-deck-stagger", "recipe-hero-stagger", "heroEntrance"],
  },
  {
    id: "bg-fluid",
    category: "background",
    actionName: "background-fluid",
    patterns: [
      /\bfluid(?:\s+background)?\b/i,
      /\bmetaballs?\b/i,
      /\bliquid\b/i,
      /\blava[\s-]?lamp\b/i,
      /\bfluidic\b/i,
    ],
    weight: 1.0,
    defaultProperties: { effect: "metaballs" },
    defaultTrigger: "load",
    alternativeIds: ["bg-cosmic", "bg-wave", "bg-aurora"],
  },
  {
    id: "bg-cosmic",
    category: "background",
    actionName: "background-cosmic",
    patterns: [
      /\bcosmic\b/i,
      /\bspace\b/i,
      /\bnebula\b/i,
      /\bstarfield\b/i,
      /\bfuturistic\s+background\b/i,
      /\bgalaxy\b/i,
    ],
    weight: 0.95,
    defaultProperties: { effect: "nebula" },
    defaultTrigger: "load",
    alternativeIds: ["bg-fluid", "bg-particle-field", "bg-aurora"],
  },
  {
    id: "effect-reveal",
    category: "visual-effect",
    actionName: "reveal",
    patterns: [
      /\breveal\b/i,
      /\bscroll[\s-]?reveal\b/i,
      /\bscroll[\s-]?driven\s+reveal\b/i,
      /\brise[\s-]?in\b/i,
      /\bunveil\b/i,
    ],
    weight: 1.0,
    defaultProperties: { direction: "up", duration: 600, delay: 0, once: true },
    defaultTrigger: "scroll",
    defaultDuration: 600,
    defaultEasing: "ease-out",
    alternativeIds: ["scroll-animate", "preset-scroll-reveal-rise", "react-reveal"],
  },
  {
    id: "pointer-tilt",
    category: "pointer",
    actionName: "tilt",
    patterns: [/\btilt\b/i, /\b3d\s+tilt\b/i, /\bcard\s+tilt\b/i, /\bperspective\s+tilt\b/i],
    weight: 1.0,
    defaultProperties: { max: 15, perspective: 1000 },
    defaultTrigger: "hover",
    alternativeIds: ["pointer-magnetic", "pointer-hover-motion"],
  },
  {
    id: "pointer-follow",
    category: "pointer",
    actionName: "follow-pointer",
    patterns: [/\bcursor\s+movement\b/i, /\btrack\s+cursor\b/i, /\bfollow(?:\s+cursor|\s+pointer)?\b/i],
    weight: 0.9,
    defaultTrigger: "pointer",
    alternativeIds: ["pointer-magnetic", "pointer-cursor-trail"],
  },
  {
    id: "scroll-velocity",
    category: "scroll",
    actionName: "scroll-velocity",
    patterns: [/\bvelocity\b/i, /\bscroll\s+speed\b/i, /\bskew\s+on\s+scroll\b/i],
    weight: 1.0,
    defaultTrigger: "scroll",
    alternativeIds: ["scroll-progress", "scroll-animate"],
  },
  {
    id: "scroll-progress",
    category: "scroll",
    actionName: "scroll-progress",
    patterns: [/\bscroll\s+progress\b/i, /\breading\s+progress\b/i, /\bprogress\s+bar\b/i],
    weight: 1.0,
    defaultTrigger: "scroll",
    alternativeIds: ["scroll-velocity", "scroll-animate"],
  },
  {
    id: "typewriter",
    category: "text-effect",
    actionName: "typewriter",
    patterns: [/\btypewriter\b/i, /\btyping\s+effect\b/i, /\btype\s+out\b/i],
    weight: 1.0,
    defaultTrigger: "load",
    alternativeIds: ["text-scramble", "text-reveal"],
  },
  {
    id: "core-animate",
    category: "core-animation",
    actionName: "animate",
    patterns: [/\banimate\b/i, /\banimating\b/i, /\bmotion\b/i],
    weight: 0.8,
    defaultTrigger: "load",
    defaultDuration: 500,
    defaultEasing: "ease-out",
    alternativeIds: ["preset-fade-in", "heroEntrance"],
  },
];

interface SemanticTargetRule {
  readonly selector: string;
  readonly role: string;
  readonly isCollection: boolean;
  readonly patterns: readonly RegExp[];
}

const SEMANTIC_TARGET_RULES: readonly SemanticTargetRule[] = [
  {
    selector: "#hero",
    role: "hero section",
    isCollection: false,
    patterns: [/\bhero(?:\s+section|\s+banner)?\b/i, /\bhero\b/i],
  },
  {
    selector: ".card",
    role: "card",
    isCollection: true,
    patterns: [
      /\b(?:these|the|all)?\s*cards\b/i,
      /\bcard\s+grid\b/i,
      /\bcard\s+deck\b/i,
      /\bcard\b/i,
    ],
  },
  {
    selector: "button",
    role: "button",
    isCollection: false,
    patterns: [
      /\b(?:a|the)?\s*button\b/i,
      /\bcta\b/i,
      /\bbuttons\b/i,
    ],
  },
  {
    selector: "body",
    role: "background",
    isCollection: false,
    patterns: [
      /\bbackground\b/i,
      /\bbackdrop\b/i,
      /\bcanvas\b/i,
      /\bpage\s+background\b/i,
    ],
  },
  {
    selector: "nav",
    role: "navigation",
    isCollection: false,
    patterns: [/\bnav(?:bar)?\b/i, /\bnavigation\b/i, /\bheader\b/i],
  },
  {
    selector: "[data-reveal]",
    role: "reveal target",
    isCollection: false,
    patterns: [/\breveal(?:\s+target|\s+element)?\b/i, /\bsection\b/i],
  },
  {
    selector: ".modal",
    role: "dialog",
    isCollection: false,
    patterns: [/\bmodal\b/i, /\bdialog\b/i, /\bpopup\b/i],
  },
  {
    selector: "h1",
    role: "heading",
    isCollection: false,
    patterns: [/\btitle\b/i, /\bheading\b/i, /\bheadline\b/i],
  },
];

function extractExplicitSelector(input: string): { selector?: string; isCollection: boolean } {
  const idMatch = input.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return { selector: `#${idMatch[1]}`, isCollection: false };
  }

  const classMatch = input.match(/\.([a-zA-Z0-9_-]+)/);
  if (classMatch) {
    const isPlural = /s$/i.test(classMatch[1]) || /cards|items|elements|list/i.test(classMatch[1]);
    return { selector: `.${classMatch[1]}`, isCollection: isPlural };
  }

  const attrMatch = input.match(/\[([a-zA-Z0-9_-]+(?:=[^\]]+)?)\]/);
  if (attrMatch) {
    return { selector: attrMatch[0], isCollection: false };
  }

  return { selector: undefined, isCollection: false };
}

function extractTarget(input: string, fallback?: string): MotionTargetSpecification {
  const explicit = extractExplicitSelector(input);
  if (explicit.selector) {
    return {
      selector: explicit.selector,
      semanticRole: explicit.selector,
      description: `Target element matching selector ${explicit.selector}`,
      isCollection: explicit.isCollection,
    };
  }

  for (const rule of SEMANTIC_TARGET_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        const isPluralExplicit = /\b(these|all|multiple|each|cards|items|buttons)\b/i.test(input);
        return {
          selector: rule.selector,
          semanticRole: rule.role,
          description: `Extracted semantic target for ${rule.role}`,
          isCollection: rule.isCollection || isPluralExplicit,
        };
      }
    }
  }

  if (fallback) {
    const isPlural = /cards|items|elements|list|\.[\w-]+s/i.test(fallback);
    return {
      selector: fallback,
      semanticRole: fallback,
      description: `Context default target: ${fallback}`,
      isCollection: isPlural,
    };
  }

  return {
    selector: undefined,
    semanticRole: "unspecified",
    description: "No specific target identified in prompt",
    isCollection: false,
  };
}

function extractTrigger(input: string, defaultTrigger: MotionTriggerType = "load"): MotionTriggerType {
  if (/\b(?:on\s+scroll|scroll[\s-]?driven|when\s+scrolling|scrolled)\b/i.test(input)) {
    return "scroll";
  }
  if (/\b(?:in[\s-]?view|when\s+in\s+view|enters?\s+view|visible)\b/i.test(input)) {
    return "inView";
  }
  if (/\b(?:on\s+hover|hovering|hover\s+effect|on\s+mouse\s+enter)\b/i.test(input)) {
    return "hover";
  }
  if (/\b(?:on\s+click|clicked|pressing|tap)\b/i.test(input)) {
    return "click";
  }
  if (/\b(?:pointer|cursor\s+movement|track\s+cursor|mouse\s+move)\b/i.test(input)) {
    return "pointer";
  }
  return defaultTrigger;
}

function extractDuration(input: string, defaultDuration?: number): number | undefined {
  const msMatch = input.match(/\b(\d+)\s*ms\b/i);
  if (msMatch) {
    return parseInt(msMatch[1], 10);
  }
  const sMatch = input.match(/\b(\d+(?:\.\d+)?)\s*s\b/i);
  if (sMatch) {
    return Math.round(parseFloat(sMatch[1]) * 1000);
  }

  if (/\b(?:fast|snappy|quick)\b/i.test(input)) {
    return 300;
  }
  if (/\b(?:slow|leisurely|gentle)\b/i.test(input)) {
    return 1000;
  }
  return defaultDuration;
}

function extractDelay(input: string): number | undefined {
  const delayMatch = input.match(/\bdelay(?:ed)?(?:\s+by)?\s+(\d+)\s*ms\b/i);
  if (delayMatch) {
    return parseInt(delayMatch[1], 10);
  }
  const delaySecMatch = input.match(/\bdelay(?:ed)?(?:\s+by)?\s+(\d+(?:\.\d+)?)\s*s\b/i);
  if (delaySecMatch) {
    return Math.round(parseFloat(delaySecMatch[1]) * 1000);
  }
  return undefined;
}

function extractEasing(input: string, defaultEasing?: string): string | undefined {
  if (/\b(?:smooth|smoothly)\b/i.test(input)) {
    return "ease-out";
  }
  if (/\b(?:snappy|crisp|instant)\b/i.test(input)) {
    return "cubic-bezier(0.2, 0.8, 0.2, 1)";
  }
  if (/\b(?:bouncy|spring|elastic)\b/i.test(input)) {
    return "spring(1, 100, 10, 0)";
  }
  if (/\b(?:gentle|soft)\b/i.test(input)) {
    return "cubic-bezier(0.25, 0.1, 0.25, 1)";
  }
  if (/\blinear\b/i.test(input)) {
    return "linear";
  }
  return defaultEasing;
}

function extractModifiers(input: string): string[] {
  const modifiers: string[] = [];
  const recognized = [
    "smooth",
    "subtle",
    "dramatic",
    "snappy",
    "bouncy",
    "futuristic",
    "fluid",
    "minimal",
    "playful",
    "hover",
    "scroll-driven",
    "reduced-motion",
    "staggered",
  ];

  const lower = input.toLowerCase();
  for (const mod of recognized) {
    const pattern = new RegExp(`\\b${mod.replace("-", "[\\s-]?")}(?:ly)?\\b`, "i");
    if (pattern.test(lower)) {
      modifiers.push(mod);
    }
  }
  return modifiers;
}

function extractInteractionOptions(
  input: string,
  modifiers: readonly string[],
  capabilityId: string,
): MotionInteractionOptions | undefined {
  if (capabilityId === "pointer-magnetic" || modifiers.includes("hover") || modifiers.includes("subtle")) {
    const isSubtle = modifiers.includes("subtle") || /\bsubtle\b/i.test(input);
    const isDramatic = modifiers.includes("dramatic") || /\b(?:strong|dramatic|heavy)\b/i.test(input);

    let strength = 0.4;
    let distance = 100;

    if (isSubtle) {
      strength = 0.2;
      distance = 80;
    } else if (isDramatic) {
      strength = 0.7;
      distance = 150;
    }

    return {
      strength,
      distance,
      radius: distance,
      hoverScale: isSubtle ? 1.02 : 1.08,
      returnSpeed: 0.1,
    };
  }
  return undefined;
}

function extractStagger(
  input: string,
  target: MotionTargetSpecification,
  capabilityId: string,
): MotionStaggerOptions | undefined {
  const isStaggerIntent = capabilityId === "effect-stagger" || /\bstagger(?:ed|ing)?\b/i.test(input);
  if (!isStaggerIntent && !target.isCollection) {
    return undefined;
  }

  let delay = 100;
  const match = input.match(/\bby\s+(\d+)\s*ms\b/i) ?? input.match(/\bstagger(?:ed)?(?:.*?by\s+)?(\d+)\s*ms\b/i);
  if (match) {
    delay = parseInt(match[1], 10);
  }

  let from: MotionStaggerOptions["from"] = "first";
  if (/\bfrom\s+center\b/i.test(input)) from = "center";
  else if (/\bfrom\s+end\b/i.test(input) || /\breverse\b/i.test(input)) from = "end";
  else if (/\brandom(?:ly)?\b/i.test(input)) from = "random";

  return { delay, from };
}

function extractAccessibility(
  input: string,
  capability?: AIMotionCapability,
): MotionAccessibilitySpecification {
  const explicitlyMentionsReducedMotion =
    /\breduced[\s-]?motion\b/i.test(input) ||
    /\bprefers[\s-]?reduced[\s-]?motion\b/i.test(input) ||
    /\baccessible\b/i.test(input) ||
    /\ba11y\b/i.test(input);

  const capabilityReducedMotion = capability?.reducedMotion ?? "skips-to-endpoint";

  return {
    respectReducedMotion: true,
    reducedMotion: explicitlyMentionsReducedMotion
      ? capabilityReducedMotion === "static-fallback"
        ? "static-fallback"
        : "skips-to-endpoint"
      : capabilityReducedMotion,
    fallbackProperties: { opacity: 1, transform: "none" },
    screenReaderAnnounce: explicitlyMentionsReducedMotion,
  };
}

/**
 * Interprets a natural-language motion request into a structured AF Motion specification.
 */
export function interpretMotionPrompt(
  prompt: string,
  options: InterpretOptions = {},
): MotionInterpretationResult {
  const trimmed = prompt.trim();
  const warnings: string[] = [];

  if (!trimmed) {
    return {
      success: false,
      confidence: 0,
      alternatives: [],
      warnings: ["Empty prompt provided"],
      intent: { action: "unknown", target: "unspecified", modifiers: [], trigger: "load" },
    };
  }

  // 1. Extract modifiers & target early
  const modifiers = extractModifiers(trimmed);
  const target = extractTarget(trimmed, options.context?.defaultTarget);
  if (options.strictTarget && !target.selector) {
    warnings.push("Strict target mode enabled, but no valid target selector was found in prompt.");
  }

  // 2. Identify candidate capabilities
  interface ScoredCandidate {
    rule: CapabilityPatternRule;
    score: number;
    matchedPatternCount: number;
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const rule of CAPABILITY_RULES) {
    let matches = 0;
    for (const pat of rule.patterns) {
      if (pat.test(trimmed)) {
        matches++;
      }
    }

    if (matches > 0) {
      let score = rule.weight * (matches * 0.5 + 0.5);

      // Boost score if options.context.preferredCategory matches
      if (options.context?.preferredCategory === rule.category) {
        score += 0.5;
      }

      scoredCandidates.push({ rule, score, matchedPatternCount: matches });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);

  const registry = getEffectiveRegistry(options);
  const primaryCandidate = scoredCandidates[0];

  if (!primaryCandidate) {
    // Fallback: try keyword matching against the AI Motion Registry
    const registryMatches = registry ? registry.searchCapabilities(trimmed) : [];
    const alternatives: MotionAlternativeRecommendation[] = registryMatches.slice(0, 3).map((cap) => ({
      capabilityId: cap.id,
      category: cap.category,
      name: cap.name,
      confidence: 0.4,
      reason: `Matched capability tags or description in registry for "${cap.name}".`,
    }));

    return {
      success: false,
      confidence: 0.2,
      alternatives,
      warnings: ["No recognized animation or effect action found in prompt."],
      intent: {
        action: "unknown",
        target: target.semanticRole || "unspecified",
        modifiers,
        trigger: extractTrigger(trimmed),
      },
    };
  }

  const primaryRule = primaryCandidate.rule;
  const capability = registry?.getCapability(primaryRule.id);
  const trigger = extractTrigger(trimmed, primaryRule.defaultTrigger ?? "load");
  const duration = extractDuration(trimmed, primaryRule.defaultDuration);
  const delay = extractDelay(trimmed);
  const easing = extractEasing(trimmed, primaryRule.defaultEasing);
  const stagger = extractStagger(trimmed, target, primaryRule.id);
  const interaction = extractInteractionOptions(trimmed, modifiers, primaryRule.id);
  const accessibility = extractAccessibility(trimmed, capability);

  // Build parameters dictionary
  const parameters: Record<string, unknown> = {};
  if (primaryRule.defaultProperties) {
    Object.assign(parameters, primaryRule.defaultProperties);
  }
  if (target.selector) {
    parameters.target = target.selector;
  }
  if (duration !== undefined) {
    parameters.duration = duration;
  }
  if (delay !== undefined) {
    parameters.delay = delay;
  }
  if (easing !== undefined) {
    parameters.easing = easing;
  }
  if (stagger) {
    parameters.stagger = stagger.delay;
    parameters.from = stagger.from;
  }
  if (interaction) {
    if (interaction.strength !== undefined) parameters.strength = interaction.strength;
    if (interaction.distance !== undefined) parameters.distance = interaction.distance;
  }

  // Build alternatives list
  const matchedCapabilityIds = [primaryRule.id];
  const alternatives: MotionAlternativeRecommendation[] = [];

  for (let i = 1; i < scoredCandidates.length; i++) {
    const candidate = scoredCandidates[i];
    matchedCapabilityIds.push(candidate.rule.id);
    const cap = registry?.getCapability(candidate.rule.id);
    alternatives.push({
      capabilityId: candidate.rule.id,
      category: candidate.rule.category,
      name: cap?.name ?? candidate.rule.id,
      confidence: Math.min(0.85, Math.round((candidate.score / primaryCandidate.score) * 100) / 100),
      reason: `Matched related intent for "${candidate.rule.actionName}".`,
    });
  }

  if (primaryRule.alternativeIds) {
    for (const altId of primaryRule.alternativeIds) {
      if (!matchedCapabilityIds.includes(altId)) {
        const altCap = registry?.getCapability(altId);
        if (altCap) {
          alternatives.push({
            capabilityId: altCap.id,
            category: altCap.category,
            name: altCap.name,
            confidence: 0.65,
            reason: `Complementary capability for ${primaryRule.actionName}.`,
          });
        }
      }
    }
  }

  // Calculate confidence score
  let confidence = 0.45;
  if (primaryCandidate.matchedPatternCount >= 1) confidence += 0.25;
  if (target.selector) confidence += 0.15;
  if (modifiers.length > 0) confidence += 0.05;
  if (duration !== undefined || easing !== undefined) confidence += 0.05;
  confidence = Math.min(0.98, Math.max(0.1, Math.round(confidence * 100) / 100));

  // Validate configuration against capability schema if requested (defaults to true)
  let validationResult: ConfigurationValidationResult | undefined;
  const schema = registry?.getCapabilitySchema(primaryRule.id);

  if (options.validate !== false && schema) {
    const validParams: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(parameters)) {
      if (schema.properties && key in schema.properties) {
        validParams[key] = val;
      }
    }
    validationResult = validateConfiguration(schema, validParams, {
      allowUnknown: false,
    });
  }

  // Motion DNA & Design System contextual overrides
  const motionDNA = options.context?.motionDNA ?? (modifiers.includes("futuristic") ? "tech" : undefined);
  const designSystem = options.context?.designSystem;

  const specId = `spec_${primaryRule.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const specification: MotionSpecification = {
    id: specId,
    prompt: trimmed,
    capabilityId: primaryRule.id,
    matchedCapabilities: matchedCapabilityIds,
    category: primaryRule.category,
    target,
    properties: primaryRule.defaultProperties ?? {},
    duration,
    delay,
    easing,
    stagger,
    trigger,
    scroll:
      trigger === "scroll" || trigger === "inView"
        ? { once: true, axis: "y" }
        : undefined,
    interaction,
    motionDNA,
    designSystem,
    accessibility,
    schemaId: schema?.$id ?? `https://af-motion.dev/schemas/${primaryRule.id}.json`,
    parameters,
    metadata: {
      extractedModifiers: modifiers,
      confidenceScore: confidence,
      intent: primaryRule.actionName,
    },
  };

  const minConfidence = options.minConfidence ?? 0.3;
  const success = confidence >= minConfidence;

  return {
    success,
    confidence,
    specification,
    alternatives,
    validation: validationResult,
    warnings,
    intent: {
      action: primaryRule.actionName,
      target: target.semanticRole || "unspecified",
      modifiers,
      trigger,
    },
  };
}
