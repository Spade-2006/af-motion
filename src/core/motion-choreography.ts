import { animateSequence } from "./animation-sequence.js";
import type { AnimationSequenceControls, AnimationSequenceStep } from "./animation-sequence.js";
import type { ComposableEffect, EffectCompositionControls } from "./effect-composer.js";
import { composeEffects } from "./effect-composer.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import { applyMotionDNA, resolveMotionDNA, type MotionDNA, type MotionDNAOverrides } from "./motion-dna.js";
import { adaptAnimationOptions, type AdaptiveMotionConditions } from "./adaptive-motion.js";
import { resolveDesignSystem, type DesignSystem } from "./design-system.js";
import { getPreset, resolvePresetAnimation, type MotionPresetOverrides } from "../presets.js";
import {
  registerChoreographyEngine,
  runRecipe,
  type DeclarativeMotionRecipe,
  type MotionRecipeControls,
} from "./motion-recipe.js";

export const CHOREOGRAPHY_SCHEMA_VERSION = "1.0.0";

export interface MotionChoreographyAnimation {
  type: "animation";
  target?: AnimateTarget | string;
  properties: AnimatableProperties;
  options?: DOMAnimationOptions;
  adaptive?: boolean | AdaptiveMotionConditions;
  motionDNA?: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
  designSystem?: string | DesignSystem;
  label?: string;
  delay?: number;
  offset?: number;
}

export interface MotionChoreographyEffect {
  type: "effect";
  effect: ComposableEffect;
  label?: string;
  delay?: number;
}

export interface MotionChoreographyPreset {
  type: "preset";
  preset: string;
  target?: AnimateTarget | string;
  label?: string;
  delay?: number;
  offset?: number;
  duration?: number;
  easing?: string | ((t: number) => number);
  overrides?: MotionPresetOverrides;
  adaptive?: boolean | AdaptiveMotionConditions;
  motionDNA?: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
  designSystem?: string | DesignSystem;
}

export interface MotionChoreographyRecipe {
  type: "recipe";
  recipe: string | DeclarativeMotionRecipe;
  targets?: Record<string, AnimateTarget> | AnimateTarget;
  label?: string;
  delay?: number;
  offset?: number;
  overrides?: MotionPresetOverrides;
  stepOverrides?: Record<string, MotionPresetOverrides>;
  adaptive?: boolean | AdaptiveMotionConditions;
  motionDNA?: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
  designSystem?: string | DesignSystem;
}

export interface MotionChoreographySequence {
  type: "sequence";
  actions: readonly MotionChoreographyAction[];
  label?: string;
  delay?: number;
}

export interface MotionChoreographyParallel {
  type: "parallel";
  actions: readonly MotionChoreographyAction[];
  label?: string;
  delay?: number;
}

export interface MotionChoreographyBranch {
  type: "branch";
  /** Evaluated when this action is reached; may read caller-owned state. */
  condition: () => boolean;
  then: readonly MotionChoreographyAction[];
  else?: readonly MotionChoreographyAction[];
  label?: string;
}

export type MotionChoreographyAction =
  | MotionChoreographyAnimation
  | MotionChoreographyParallel
  | MotionChoreographyBranch
  | MotionChoreographyPreset
  | MotionChoreographyRecipe
  | MotionChoreographySequence
  | MotionChoreographyEffect;

export interface MotionChoreographyControls {
  /** Resolves when all choreography actions complete; rejects on failure or cancellation. */
  readonly finished: Promise<void>;
  pause(): void;
  resume(): void;
  /** Cancels active animations and cleans up active effects. Safe to repeat. */
  cancel(): void;
  /** Alias for cancel(). Cleans up active effects and cancels animations. Safe to repeat. */
  destroy(): void;
  /** Optional play control when underlying sequence supports forward playback. */
  play?(): void;
  /** Optional reverse control when choreography is a pure reversible sequence. */
  reverse?(): void;
}

export interface ChoreographyMetadata {
  readonly version?: string;
  readonly author?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly [key: string]: unknown;
}

export type ChoreographyTargetMap = Record<string, AnimateTarget>;

export interface ChoreographyDefinition {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly targets?: readonly string[];
  readonly motionDNA?: string | { readonly name: string; readonly overrides?: MotionDNAOverrides };
  readonly adaptive?: boolean | AdaptiveMotionConditions;
  readonly designSystem?: string | DesignSystem;
  readonly actions: readonly MotionChoreographyAction[];
  readonly metadata?: ChoreographyMetadata;
}

export interface ChoreographyRunOptions {
  targets?: ChoreographyTargetMap | AnimateTarget;
  motionDNA?: string | { name: string; overrides?: MotionDNAOverrides };
  adaptive?: boolean | AdaptiveMotionConditions;
  designSystem?: string | DesignSystem;
  stepOverrides?: Record<string, DOMAnimationOptions | MotionPresetOverrides>;
}

export interface ChoreographyValidationError {
  readonly parameter?: string;
  readonly message: string;
}

export interface ChoreographyValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ChoreographyValidationError[];
}

export interface ChoreographyQuery {
  readonly text?: string;
  readonly category?: string;
  readonly tag?: string;
  readonly motionDNA?: string;
  readonly designSystem?: string;
}

export interface ChoreographiesDocument {
  readonly $schemaVersion: string;
  readonly timestamp: string;
  readonly count: number;
  readonly choreographies: readonly ChoreographyDefinition[];
}

function deepCloneAndFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (typeof (obj as any).then === "function" && typeof (obj as any).catch === "function") {
    return obj;
  }
  if (Array.isArray(obj)) {
    const arr = obj.map((item) => deepCloneAndFreeze(item));
    return Object.freeze(arr) as unknown as T;
  }
  const cloned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    cloned[key] = deepCloneAndFreeze(value);
  }
  return Object.freeze(cloned) as T;
}

function copyAnimation(action: MotionChoreographyAnimation): MotionChoreographyAnimation {
  const properties: AnimatableProperties = {};
  for (const [property, values] of Object.entries(action.properties)) {
    properties[property] = [values[0], values[1]];
  }
  return {
    type: "animation",
    target: action.target,
    properties,
    ...(action.options ? { options: { ...action.options } } : {}),
    ...(action.adaptive !== undefined ? { adaptive: action.adaptive } : {}),
    ...(action.motionDNA
      ? {
        motionDNA: {
          name: action.motionDNA.name,
          ...(action.motionDNA.overrides ? { overrides: { ...action.motionDNA.overrides } } : {}),
        },
      }
      : {}),
    ...(action.designSystem !== undefined ? { designSystem: action.designSystem } : {}),
    ...(action.label !== undefined ? { label: action.label } : {}),
    ...(action.delay !== undefined ? { delay: action.delay } : {}),
    ...(action.offset !== undefined ? { offset: action.offset } : {}),
  };
}

function copyEffect(effect: ComposableEffect): ComposableEffect {
  if (typeof effect === "function") return effect;
  if ("motionDNA" in effect && effect.motionDNA !== undefined) {
    return {
      start: effect.start,
      motionDNA: {
        name: effect.motionDNA.name,
        ...(effect.motionDNA.overrides ? { overrides: { ...effect.motionDNA.overrides } } : {}),
      },
    };
  }
  if ("start" in effect && typeof effect.start === "function") {
    return { start: effect.start };
  }
  return effect;
}

function copyPreset(action: MotionChoreographyPreset): MotionChoreographyPreset {
  return {
    type: "preset",
    preset: action.preset,
    ...(action.target !== undefined ? { target: action.target } : {}),
    ...(action.label !== undefined ? { label: action.label } : {}),
    ...(action.delay !== undefined ? { delay: action.delay } : {}),
    ...(action.offset !== undefined ? { offset: action.offset } : {}),
    ...(action.duration !== undefined ? { duration: action.duration } : {}),
    ...(action.easing !== undefined ? { easing: action.easing } : {}),
    ...(action.overrides ? { overrides: { ...action.overrides } } : {}),
    ...(action.adaptive !== undefined ? { adaptive: action.adaptive } : {}),
    ...(action.motionDNA
      ? {
        motionDNA: {
          name: action.motionDNA.name,
          ...(action.motionDNA.overrides ? { overrides: { ...action.motionDNA.overrides } } : {}),
        },
      }
      : {}),
    ...(action.designSystem !== undefined ? { designSystem: action.designSystem } : {}),
  };
}

function copyRecipe(action: MotionChoreographyRecipe): MotionChoreographyRecipe {
  return {
    type: "recipe",
    recipe: action.recipe,
    ...(action.targets !== undefined ? { targets: action.targets } : {}),
    ...(action.label !== undefined ? { label: action.label } : {}),
    ...(action.delay !== undefined ? { delay: action.delay } : {}),
    ...(action.offset !== undefined ? { offset: action.offset } : {}),
    ...(action.overrides ? { overrides: { ...action.overrides } } : {}),
    ...(action.stepOverrides ? { stepOverrides: { ...action.stepOverrides } } : {}),
    ...(action.adaptive !== undefined ? { adaptive: action.adaptive } : {}),
    ...(action.motionDNA
      ? {
        motionDNA: {
          name: action.motionDNA.name,
          ...(action.motionDNA.overrides ? { overrides: { ...action.motionDNA.overrides } } : {}),
        },
      }
      : {}),
    ...(action.designSystem !== undefined ? { designSystem: action.designSystem } : {}),
  };
}

function hasActionDuration(action: MotionChoreographyAction): boolean {
  if (action.type === "animation" || action.type === "preset" || action.type === "recipe") {
    return true;
  }
  if (action.type === "sequence" || action.type === "parallel") {
    return action.actions.some(hasActionDuration);
  }
  if (action.type === "branch") {
    return action.then.some(hasActionDuration) || (action.else ? action.else.some(hasActionDuration) : false);
  }
  return false;
}

function snapshotActions(
  actions: readonly MotionChoreographyAction[],
  allowEmpty = false,
): MotionChoreographyAction[] {
  if (!Array.isArray(actions)) throw new TypeError("Choreography actions must be an array");
  if (!allowEmpty && actions.length === 0) throw new TypeError("Choreography actions must not be empty");
  return actions.map((action, index) => {
    if (action === null || typeof action !== "object" || Array.isArray(action)) {
      throw new TypeError(`Choreography action ${index} must be an object`);
    }
    if (action.type === "animation") return copyAnimation(action);
    if (action.type === "preset") return copyPreset(action);
    if (action.type === "recipe") return copyRecipe(action);
    if (action.type === "effect" && action.effect && (typeof action.effect === "object" || typeof action.effect === "function")) {
      return {
        type: "effect" as const,
        effect: copyEffect(action.effect),
        ...(action.label !== undefined ? { label: action.label } : {}),
        ...(action.delay !== undefined ? { delay: action.delay } : {}),
      };
    }
    if (action.type === "sequence") {
      if (!Array.isArray(action.actions) || action.actions.length === 0) {
        throw new TypeError(`Choreography sequence ${index} actions must be a non-empty array`);
      }
      return {
        type: "sequence",
        actions: snapshotActions(action.actions, false),
        ...(action.label !== undefined ? { label: action.label } : {}),
        ...(action.delay !== undefined ? { delay: action.delay } : {}),
      };
    }
    if (action.type === "branch") {
      if (typeof action.condition !== "function") {
        throw new TypeError(`Choreography branch ${index} condition must be a function`);
      }
      if (!Array.isArray(action.then) || (action.else !== undefined && !Array.isArray(action.else))) {
        throw new TypeError(`Choreography branch ${index} paths must be arrays`);
      }
      return {
        type: "branch",
        condition: action.condition,
        then: snapshotActions(action.then, true),
        ...(action.else === undefined ? {} : { else: snapshotActions(action.else, true) }),
        ...(action.label !== undefined ? { label: action.label } : {}),
      };
    }
    if (action.type === "parallel") {
      if (!Array.isArray(action.actions) || action.actions.length === 0) {
        throw new TypeError(`Choreography action ${index} must be an animation or non-empty parallel group`);
      }
      const children = action.actions.map((child: MotionChoreographyAction, childIndex: number) => {
        if (child === null || typeof child !== "object" || Array.isArray(child)) {
          throw new TypeError(`Parallel action ${childIndex} must be an object`);
        }
        if (child.type === "animation") return copyAnimation(child);
        if (child.type === "preset") return copyPreset(child);
        if (child.type === "recipe") return copyRecipe(child);
        if (child.type === "sequence") {
          return {
            type: "sequence" as const,
            actions: snapshotActions(child.actions, false),
            ...(child.label !== undefined ? { label: child.label } : {}),
            ...(child.delay !== undefined ? { delay: child.delay } : {}),
          };
        }
        if (child.type === "effect" && child.effect && (typeof child.effect === "object" || typeof child.effect === "function")) {
          return {
            type: "effect" as const,
            effect: copyEffect(child.effect),
            ...(child.label !== undefined ? { label: child.label } : {}),
            ...(child.delay !== undefined ? { delay: child.delay } : {}),
          };
        }
        if (child.type === "branch") {
          if (typeof child.condition !== "function") {
            throw new TypeError(`Parallel branch ${childIndex} condition must be a function`);
          }
          if (!Array.isArray(child.then) || (child.else !== undefined && !Array.isArray(child.else))) {
            throw new TypeError(`Parallel branch ${childIndex} paths must be arrays`);
          }
          return {
            type: "branch" as const,
            condition: child.condition,
            then: snapshotActions(child.then, true),
            ...(child.else === undefined ? {} : { else: snapshotActions(child.else, true) }),
            ...(child.label !== undefined ? { label: child.label } : {}),
          };
        }
        if (child.type === "parallel") {
          return {
            type: "parallel" as const,
            actions: snapshotActions(child.actions, false),
            ...(child.label !== undefined ? { label: child.label } : {}),
            ...(child.delay !== undefined ? { delay: child.delay } : {}),
          };
        }
        throw new TypeError(`Parallel action ${childIndex} must be an animation or effect`);
      });
      if (!children.some(hasActionDuration)) {
        throw new TypeError("A parallel group must include at least one animation to define its duration");
      }
      return {
        type: "parallel",
        actions: children,
        ...(action.label !== undefined ? { label: action.label } : {}),
        ...(action.delay !== undefined ? { delay: action.delay } : {}),
      };
    }
    throw new TypeError(`Choreography action ${index} must be an animation or non-empty parallel group`);
  });
}

function resolveTargetSlot(
  stepTarget: AnimateTarget | string | undefined,
  targets: ChoreographyTargetMap | AnimateTarget | undefined,
  declaredSlots?: readonly string[],
): AnimateTarget {
  if (typeof stepTarget === "string") {
    const slot = stepTarget.startsWith("$") ? stepTarget.slice(1) : stepTarget;
    if (targets && typeof targets === "object" && !("nodeType" in targets) && !("style" in targets) && !Array.isArray(targets)) {
      const map = targets as ChoreographyTargetMap;
      if (map[slot] !== undefined) return map[slot];
      if (map[`$${slot}`] !== undefined) return map[`$${slot}`];
    }
    if (stepTarget.startsWith("$") || (declaredSlots && declaredSlots.includes(slot))) {
      throw new TypeError(`Missing target binding for slot "${stepTarget}"`);
    }
    return stepTarget;
  }

  if (stepTarget !== undefined) {
    return stepTarget;
  }

  if (targets) {
    if (typeof targets !== "object" || "nodeType" in targets || "style" in targets || Array.isArray(targets) || typeof targets === "string") {
      return targets as AnimateTarget;
    }
    const map = targets as ChoreographyTargetMap;
    if (map.default !== undefined) return map.default;
    if (map.container !== undefined) return map.container;
    if (map.root !== undefined) return map.root;
  }

  throw new TypeError("Choreography step does not define a target and no default target was provided");
}

function resolveDNAConfig(
  actionDNA?: { name: string; overrides?: MotionDNAOverrides },
  defaultDNA?: string | { readonly name?: string; readonly overrides?: MotionDNAOverrides } | MotionDNA,
): { name: string; overrides?: MotionDNAOverrides } | undefined {
  if (actionDNA) return actionDNA;
  if (!defaultDNA) return undefined;
  if (typeof defaultDNA === "string") return { name: defaultDNA };
  if ("name" in defaultDNA && typeof defaultDNA.name === "string") {
    return { name: defaultDNA.name, overrides: (defaultDNA as any).overrides };
  }
  return undefined;
}

function isPureSequence(actions: readonly MotionChoreographyAction[]): boolean {
  for (const action of actions) {
    if (action.type !== "animation" && action.type !== "preset") {
      return false;
    }
  }
  return true;
}

function abortError(): Error {
  const error = new Error("Motion choreography was cancelled");
  error.name = "AbortError";
  return error;
}

// --- Built-in Choreographies ---

export const BUILT_IN_CHOREOGRAPHIES: readonly ChoreographyDefinition[] = [
  deepCloneAndFreeze<ChoreographyDefinition>({
    id: "heroEntrance",
    name: "Hero Entrance",
    description: "Staggered hero section reveal: headline rises, subtitle fades in, and CTA button bounces.",
    targets: ["headline", "subhead", "cta"],
    actions: [
      {
        type: "preset",
        preset: "slideUp",
        target: "$headline",
        label: "headline",
        duration: 600,
        easing: "easeOutCubic",
      },
      {
        type: "preset",
        preset: "fadeIn",
        target: "$subhead",
        label: "subhead",
        delay: 150,
        duration: 500,
      },
      {
        type: "preset",
        preset: "bounceIn",
        target: "$cta",
        label: "cta",
        delay: 100,
        duration: 400,
      },
    ],
    metadata: {
      category: "entrance",
      tags: ["hero", "landing", "entrance", "stagger"],
    },
  }),
  deepCloneAndFreeze<ChoreographyDefinition>({
    id: "pageTransition",
    name: "Page Transition",
    description: "Coordinated page transition: outgoing page fades out before incoming page slides up.",
    targets: ["outgoing", "incoming"],
    actions: [
      {
        type: "preset",
        preset: "fadeOut",
        target: "$outgoing",
        label: "outgoing",
        duration: 250,
      },
      {
        type: "preset",
        preset: "slideUp",
        target: "$incoming",
        label: "incoming",
        duration: 350,
      },
    ],
    metadata: {
      category: "page-transition",
      tags: ["page", "transition", "navigation"],
    },
  }),
  deepCloneAndFreeze<ChoreographyDefinition>({
    id: "cardReveal",
    name: "Card Reveal",
    description: "Coordinated card entrance: card container scales in while content fades and lifts.",
    targets: ["card", "content"],
    actions: [
      {
        type: "parallel",
        actions: [
          {
            type: "preset",
            preset: "scaleIn",
            target: "$card",
            label: "card-scale",
            duration: 400,
          },
          {
            type: "preset",
            preset: "slideUp",
            target: "$content",
            label: "content-slide",
            delay: 100,
            duration: 450,
          },
        ],
      },
    ],
    metadata: {
      category: "entrance",
      tags: ["card", "reveal", "container", "entrance"],
    },
  }),
];

const BUILT_IN_CHOREOGRAPHY_IDS = new Set<string>(BUILT_IN_CHOREOGRAPHIES.map((c) => c.id));
const choreographyRegistry = new Map<string, ChoreographyDefinition>();

function initRegistry(): void {
  choreographyRegistry.clear();
  for (const choreo of BUILT_IN_CHOREOGRAPHIES) {
    choreographyRegistry.set(choreo.id, choreo);
  }
}
initRegistry();

// --- Validation & Serialization ---

export function validateChoreography(definition: unknown): ChoreographyValidationResult {
  const errors: ChoreographyValidationError[] = [];
  if (definition === null || typeof definition !== "object" || Array.isArray(definition)) {
    return {
      valid: false,
      errors: [{ message: "Choreography definition must be an object" }],
    };
  }

  const def = definition as Partial<ChoreographyDefinition>;
  if (!def.id || typeof def.id !== "string" || def.id.trim() === "") {
    errors.push({ parameter: "id", message: 'Choreography must have a non-empty string "id"' });
  }
  if (!def.name || typeof def.name !== "string" || def.name.trim() === "") {
    errors.push({ parameter: "name", message: 'Choreography must have a non-empty string "name"' });
  }
  if (!Array.isArray(def.actions) || def.actions.length === 0) {
    errors.push({ parameter: "actions", message: 'Choreography must have a non-empty "actions" array' });
  } else {
    def.actions.forEach((action, idx) => {
      if (!action || typeof action !== "object") {
        errors.push({ parameter: `actions[${idx}]`, message: `Action ${idx} must be an object` });
        return;
      }
      const validTypes = ["animation", "preset", "recipe", "parallel", "sequence", "branch", "effect"];
      if (!validTypes.includes(action.type)) {
        errors.push({ parameter: `actions[${idx}].type`, message: `Action ${idx} has unknown type "${action.type}"` });
      }
      if (action.type === "preset" && (!("preset" in action) || typeof (action as MotionChoreographyPreset).preset !== "string")) {
        errors.push({ parameter: `actions[${idx}].preset`, message: `Preset action ${idx} must specify a preset name` });
      }
      if (action.type === "parallel" && (!Array.isArray((action as MotionChoreographyParallel).actions) || (action as MotionChoreographyParallel).actions.length === 0)) {
        errors.push({ parameter: `actions[${idx}].actions`, message: `Parallel action ${idx} must have non-empty actions array` });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function registerChoreography(definition: ChoreographyDefinition): void {
  const validation = validateChoreography(definition);
  if (!validation.valid) {
    throw new TypeError(`Invalid choreography definition: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  if (BUILT_IN_CHOREOGRAPHY_IDS.has(definition.id)) {
    throw new Error(`Cannot overwrite built-in choreography "${definition.id}"`);
  }
  choreographyRegistry.set(definition.id, deepCloneAndFreeze(definition));
}

export function getChoreography(id: string): ChoreographyDefinition | undefined {
  return choreographyRegistry.get(id);
}

export function listChoreographies(): readonly ChoreographyDefinition[] {
  return Array.from(choreographyRegistry.values());
}

export function searchChoreographies(query: ChoreographyQuery | string): readonly ChoreographyDefinition[] {
  const all = listChoreographies();
  if (typeof query === "string") {
    const q = query.trim().toLowerCase();
    if (q === "") return all;
    return all.filter((c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.metadata?.category && c.metadata.category.toLowerCase().includes(q)) ||
      (c.metadata?.tags && c.metadata.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return all.filter((c) => {
    if (query.text) {
      const q = query.text.toLowerCase();
      const matches =
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (query.category && c.metadata?.category !== query.category) {
      return false;
    }
    if (query.tag && (!c.metadata?.tags || !c.metadata.tags.includes(query.tag))) {
      return false;
    }
    if (query.motionDNA) {
      const dnaName = typeof c.motionDNA === "string" ? c.motionDNA : c.motionDNA?.name;
      if (dnaName !== query.motionDNA) return false;
    }
    if (query.designSystem) {
      const dsName = typeof c.designSystem === "string" ? c.designSystem : (c.designSystem as any)?.id;
      if (dsName !== query.designSystem) return false;
    }
    return true;
  });
}

export function removeChoreography(id: string): boolean {
  if (BUILT_IN_CHOREOGRAPHY_IDS.has(id)) {
    throw new Error(`Cannot remove built-in choreography "${id}"`);
  }
  return choreographyRegistry.delete(id);
}

export function resetChoreographyRegistry(): void {
  initRegistry();
}

export function exportChoreographyJson(definitionOrId: string | ChoreographyDefinition): string {
  const def = typeof definitionOrId === "string" ? getChoreography(definitionOrId) : definitionOrId;
  if (!def) {
    throw new TypeError(`Unknown choreography "${String(definitionOrId)}"`);
  }
  const serializable = {
    $schemaVersion: CHOREOGRAPHY_SCHEMA_VERSION,
    ...def,
  };
  return JSON.stringify(serializable, null, 2);
}

export function exportChoreographiesDocument(): string {
  const doc: ChoreographiesDocument = {
    $schemaVersion: CHOREOGRAPHY_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    count: choreographyRegistry.size,
    choreographies: listChoreographies(),
  };
  return JSON.stringify(doc, null, 2);
}

export function importChoreographyFromJson(json: string): ChoreographyDefinition {
  if (typeof json !== "string") {
    throw new TypeError("Choreography JSON must be a string");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json, (k, v) => (k === "__proto__" || k === "constructor" || k === "prototype" ? undefined : v));
  } catch (e) {
    throw new TypeError(`Invalid JSON syntax: ${(e as Error).message}`);
  }
  const validation = validateChoreography(parsed);
  if (!validation.valid) {
    throw new TypeError(`Invalid choreography JSON: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  return deepCloneAndFreeze(parsed as ChoreographyDefinition);
}

// --- Execution Engine ---

/** Runs ordered animations, conditional branches, presets, recipes, and parallel groups. */
export function createMotionChoreography(
  definition: readonly MotionChoreographyAction[] | ChoreographyDefinition | string,
  options?: ChoreographyRunOptions,
): MotionChoreographyControls {
  let rawActions: readonly MotionChoreographyAction[];
  let declaredSlots: readonly string[] | undefined;
  let choreoDef: ChoreographyDefinition | undefined;

  if (typeof definition === "string") {
    const registered = getChoreography(definition);
    if (!registered) {
      throw new TypeError(`Unknown motion choreography "${definition}"`);
    }
    choreoDef = registered;
    rawActions = choreoDef.actions;
    declaredSlots = choreoDef.targets;
  } else if (Array.isArray(definition)) {
    rawActions = definition;
    declaredSlots = undefined;
  } else if (definition !== null && typeof definition === "object" && "actions" in definition) {
    choreoDef = definition as ChoreographyDefinition;
    rawActions = choreoDef.actions;
    declaredSlots = choreoDef.targets;
  } else {
    throw new TypeError("Choreography definition must be an array of actions, a choreography definition object, or a choreography ID");
  }

  const actions = snapshotActions(rawActions);
  const targets = options?.targets;
  const stepOverridesMap = options?.stepOverrides ?? {};

  // Validate declared slots
  if (declaredSlots && declaredSlots.length > 0) {
    if (!targets) {
      throw new TypeError(`Missing required target bindings for slots: ${declaredSlots.join(", ")}`);
    }
    if (typeof targets === "object" && !("nodeType" in targets) && !("style" in targets) && !Array.isArray(targets) && typeof targets !== "string") {
      const map = targets as ChoreographyTargetMap;
      for (const slot of declaredSlots) {
        if (map[slot] === undefined && map[`$${slot}`] === undefined) {
          throw new TypeError(`Missing target binding for slot "${slot}"`);
        }
      }
    }
  }

  const defaultDS = options?.designSystem ?? choreoDef?.designSystem;
  const resolvedDS = defaultDS ? resolveDesignSystem(defaultDS) : undefined;
  const defaultDNA = options?.motionDNA ?? choreoDef?.motionDNA ?? resolvedDS?.resolvedMotionDNA;
  const defaultAdaptive = options?.adaptive ?? choreoDef?.adaptive;

  // Optimized path for pure animation/preset sequences: delegate to animateSequence
  if (isPureSequence(actions)) {
    const sequenceSteps: AnimationSequenceStep[] = actions.map((act, idx) => {
      const labelKey = act.label ?? String(idx);
      const stepOverride = stepOverridesMap[labelKey] ?? stepOverridesMap[String(idx)] ?? {};

      if (act.type === "animation") {
        const target = resolveTargetSlot(act.target, targets, declaredSlots);
        const dnaConfig = resolveDNAConfig(act.motionDNA, defaultDNA);
        const dnaOptions = dnaConfig ? applyMotionDNA(dnaConfig.name, dnaConfig.overrides) : {};
        const merged = { ...dnaOptions, ...act.options, ...stepOverride };
        if (act.delay !== undefined) {
          merged.delay = (merged.delay ?? 0) + act.delay;
        }
        if (act.offset !== undefined) {
          merged.delay = (merged.delay ?? 0) + act.offset;
        }
        const adaptiveOption = act.adaptive ?? defaultAdaptive ?? (merged as any).adaptive;
        const resolvedOptions = adaptiveOption
          ? adaptAnimationOptions(merged, typeof adaptiveOption === "object" ? adaptiveOption : undefined)
          : merged;
        return {
          target,
          properties: act.properties,
          options: resolvedOptions,
        };
      }

      // preset action
      const pAct = act as MotionChoreographyPreset;
      const target = resolveTargetSlot(pAct.target, targets, declaredSlots);
      const overrides: MotionPresetOverrides = {
        ...pAct.overrides,
        ...(pAct.duration !== undefined ? { duration: pAct.duration } : {}),
        ...(pAct.delay !== undefined ? { delay: pAct.delay } : {}),
        ...(pAct.offset !== undefined ? { delay: (pAct.delay ?? 0) + pAct.offset } : {}),
        ...(pAct.easing !== undefined ? { easing: pAct.easing as any } : {}),
        ...(pAct.overrides?.motionDNA === undefined && defaultDNA !== undefined ? { motionDNA: defaultDNA as any } : {}),
        ...(pAct.overrides?.designSystem === undefined && defaultDS !== undefined ? { designSystem: defaultDS } : {}),
        ...(pAct.overrides?.adaptive === undefined && defaultAdaptive !== undefined ? { adaptive: defaultAdaptive } : {}),
        ...stepOverride,
      };

      const { properties, options: resolvedOptions } = resolvePresetAnimation(pAct.preset, overrides);
      return {
        target,
        properties,
        options: resolvedOptions,
      };
    });

    const seqControls = animateSequence(sequenceSteps);
    const finished = seqControls.finished.catch((err) => {
      if (err instanceof Error && (err.name === "AbortError" || err.message.includes("Animation sequence was cancelled"))) {
        throw abortError();
      }
      throw err;
    });
    return {
      finished,
      pause: () => seqControls.pause(),
      resume: () => seqControls.resume(),
      cancel: () => seqControls.cancel(),
      destroy: () => seqControls.cancel(),
      play: () => seqControls.resume(),
      reverse: () => seqControls.reverse(),
    };
  }

  // General asynchronous choreography engine
  let resolveFinished: () => void = () => undefined;
  let rejectFinished: (reason: unknown) => void = () => undefined;
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  const activeSequences = new Set<AnimationSequenceControls>();
  const activeEffectGroups = new Set<EffectCompositionControls>();
  const activeRecipeControls = new Set<MotionRecipeControls>();
  let cancelled = false;
  let settled = false;
  let paused = false;

  const cleanup = (): void => {
    const errors: unknown[] = [];
    for (const sequence of activeSequences) {
      try {
        sequence.cancel();
      } catch (error) {
        errors.push(error);
      }
    }
    activeSequences.clear();

    for (const group of activeEffectGroups) {
      try {
        group.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    activeEffectGroups.clear();

    for (const recipeCtrl of activeRecipeControls) {
      try {
        recipeCtrl.cancel();
      } catch (error) {
        errors.push(error);
      }
    }
    activeRecipeControls.clear();

    if (errors.length > 0) {
      throw new AggregateError(errors, "Motion choreography cleanup failed");
    }
  };

  const runAnimation = async (action: MotionChoreographyAnimation, index: number): Promise<void> => {
    const target = resolveTargetSlot(action.target, targets, declaredSlots);
    const labelKey = action.label ?? String(index);
    const stepOverride = stepOverridesMap[labelKey] ?? stepOverridesMap[String(index)] ?? {};

    const dnaConfig = resolveDNAConfig(action.motionDNA, defaultDNA);
    const dnaOptions = dnaConfig ? applyMotionDNA(dnaConfig.name, dnaConfig.overrides) : {};
    const merged = { ...dnaOptions, ...action.options, ...stepOverride };
    if (action.delay !== undefined) {
      merged.delay = (merged.delay ?? 0) + action.delay;
    }
    if (action.offset !== undefined) {
      merged.delay = (merged.delay ?? 0) + action.offset;
    }
    const adaptiveOption = action.adaptive ?? defaultAdaptive ?? (merged as any).adaptive;
    const resolvedOptions = adaptiveOption
      ? adaptAnimationOptions(merged, typeof adaptiveOption === "object" ? adaptiveOption : undefined)
      : merged;

    const sequence = animateSequence([{ target, properties: action.properties, options: resolvedOptions }]);
    activeSequences.add(sequence);
    if (paused) sequence.pause();
    try {
      await sequence.finished;
    } finally {
      activeSequences.delete(sequence);
    }
  };

  const runPreset = async (action: MotionChoreographyPreset, index: number): Promise<void> => {
    const target = resolveTargetSlot(action.target, targets, declaredSlots);
    const labelKey = action.label ?? String(index);
    const stepOverride = stepOverridesMap[labelKey] ?? stepOverridesMap[String(index)] ?? {};

    const overrides: MotionPresetOverrides = {
      ...action.overrides,
      ...(action.duration !== undefined ? { duration: action.duration } : {}),
      ...(action.delay !== undefined ? { delay: action.delay } : {}),
      ...(action.offset !== undefined ? { delay: (action.delay ?? 0) + action.offset } : {}),
      ...(action.easing !== undefined ? { easing: action.easing as any } : {}),
      ...(action.overrides?.motionDNA === undefined && defaultDNA !== undefined ? { motionDNA: defaultDNA as any } : {}),
      ...(action.overrides?.designSystem === undefined && defaultDS !== undefined ? { designSystem: defaultDS } : {}),
      ...(action.overrides?.adaptive === undefined && defaultAdaptive !== undefined ? { adaptive: defaultAdaptive } : {}),
      ...stepOverride,
    };

    const { properties, options: resolvedOptions } = resolvePresetAnimation(action.preset, overrides);
    const sequence = animateSequence([{ target, properties, options: resolvedOptions }]);
    activeSequences.add(sequence);
    if (paused) sequence.pause();
    try {
      await sequence.finished;
    } finally {
      activeSequences.delete(sequence);
    }
  };

  const runRecipeAction = async (action: MotionChoreographyRecipe): Promise<void> => {
    const recipeTargets = typeof targets === "object" && targets !== null && !("nodeType" in targets) && !Array.isArray(targets)
      ? (typeof action.targets === "object" && action.targets !== null && !("nodeType" in action.targets) && !Array.isArray(action.targets)
        ? { ...targets, ...action.targets }
        : action.targets ?? targets)
      : (action.targets ?? targets);

    const totalDelay = (action.delay ?? 0) + (action.offset ?? 0);
    const overrides: MotionPresetOverrides = {
      ...action.overrides,
      ...(totalDelay > 0 || action.delay !== undefined || action.offset !== undefined
        ? { delay: (action.overrides?.delay ?? 0) + totalDelay }
        : {}),
      ...(action.motionDNA !== undefined
        ? { motionDNA: action.motionDNA as any }
        : (action.overrides?.motionDNA === undefined && defaultDNA !== undefined ? { motionDNA: defaultDNA as any } : {})),
      ...(action.designSystem !== undefined
        ? { designSystem: action.designSystem }
        : (action.overrides?.designSystem === undefined && defaultDS !== undefined ? { designSystem: defaultDS } : {})),
      ...(action.adaptive !== undefined
        ? { adaptive: action.adaptive }
        : (action.overrides?.adaptive === undefined && defaultAdaptive !== undefined ? { adaptive: defaultAdaptive } : {})),
    };

    const recipeCtrl = runRecipe(action.recipe, {
      targets: recipeTargets,
      overrides,
      stepOverrides: action.stepOverrides,
    });
    activeRecipeControls.add(recipeCtrl);
    if (paused) recipeCtrl.pause();
    try {
      if (recipeCtrl.finished) {
        await recipeCtrl.finished;
      }
    } finally {
      activeRecipeControls.delete(recipeCtrl);
    }
  };

  const runParallel = async (action: MotionChoreographyParallel): Promise<void> => {
    const effectEntries = action.actions
      .filter((child): child is MotionChoreographyEffect => child.type === "effect")
      .map((child) => child.effect);
    const group = effectEntries.length > 0 ? composeEffects(effectEntries) : null;
    if (group) {
      activeEffectGroups.add(group);
      if (paused) group.pause();
    }

    const nonEffectActions = action.actions.filter((child) => child.type !== "effect");
    const started: AnimationSequenceControls[] = [];
    let failure: unknown;
    let failed = false;

    try {
      const promises: Promise<void>[] = [];
      for (let i = 0; i < action.actions.length; i++) {
        const child = action.actions[i];
        if (child.type === "animation") {
          const target = resolveTargetSlot(child.target, targets, declaredSlots);
          const dnaConfig = resolveDNAConfig(child.motionDNA, defaultDNA);
          const dnaOptions = dnaConfig ? applyMotionDNA(dnaConfig.name, dnaConfig.overrides) : {};
          const merged = { ...dnaOptions, ...child.options };
          const adaptiveOption = child.adaptive ?? defaultAdaptive ?? (merged as any).adaptive;
          const options = adaptiveOption
            ? adaptAnimationOptions(merged, typeof adaptiveOption === "object" ? adaptiveOption : undefined)
            : merged;
          const sequence = animateSequence([{ target, properties: child.properties, options }]);
          started.push(sequence);
          activeSequences.add(sequence);
          if (paused) sequence.pause();
          promises.push(sequence.finished);
        } else if (child.type === "preset") {
          promises.push(runPreset(child, i));
        } else if (child.type === "recipe") {
          promises.push(runRecipeAction(child));
        } else if (child.type === "sequence") {
          promises.push(runActions(child.actions));
        } else if (child.type === "branch") {
          const selected = child.condition();
          if (typeof selected !== "boolean") {
            throw new TypeError("Motion choreography branch condition must return a boolean");
          }
          promises.push(runActions(selected ? child.then : (child.else ?? [])));
        } else if (child.type === "parallel") {
          promises.push(runParallel(child));
        }
      }
      await Promise.all(promises);
    } catch (error) {
      failed = true;
      failure = error;
    }

    const cleanupErrors: unknown[] = [];
    for (const sequence of started) {
      try {
        sequence.cancel();
      } catch (error) {
        cleanupErrors.push(error);
      } finally {
        activeSequences.delete(sequence);
      }
    }
    if (group) {
      activeEffectGroups.delete(group);
      try {
        group.destroy();
      } catch (error) {
        cleanupErrors.push(error);
      }
    }

    if (failed) {
      if (cleanupErrors.length > 0) {
        throw new AggregateError([failure, ...cleanupErrors], "Parallel choreography action failed");
      }
      throw failure;
    }
    if (cleanupErrors.length > 0) {
      throw new AggregateError(cleanupErrors, "Parallel choreography cleanup failed");
    }
  };

  const runActions = async (actionList: readonly MotionChoreographyAction[]): Promise<void> => {
    for (let i = 0; i < actionList.length; i++) {
      if (cancelled) return;
      const action = actionList[i];
      if (action.type === "animation") {
        await runAnimation(action, i);
      } else if (action.type === "preset") {
        await runPreset(action, i);
      } else if (action.type === "recipe") {
        await runRecipeAction(action);
      } else if (action.type === "sequence") {
        await runActions(action.actions);
      } else if (action.type === "parallel") {
        await runParallel(action);
      } else if (action.type === "branch") {
        const selected = action.condition();
        if (typeof selected !== "boolean") {
          throw new TypeError("Motion choreography branch condition must return a boolean");
        }
        await runActions(selected ? action.then : action.else ?? []);
      }
    }
  };

  void (async () => {
    try {
      await runActions(actions);
      if (cancelled) return;
      settled = true;
      resolveFinished();
    } catch (error) {
      if (cancelled) return;
      settled = true;
      try {
        cleanup();
      } catch (cleanupError) {
        rejectFinished(new AggregateError([error, cleanupError], "Motion choreography failed"));
        return;
      }
      rejectFinished(error);
    }
  })();

  const cancel = (): void => {
    if (cancelled || settled) return;
    cancelled = true;
    const cleanupError = (() => {
      try {
        cleanup();
        return undefined;
      } catch (error) {
        return error;
      }
    })();
    rejectFinished(
      cleanupError
        ? new AggregateError([abortError(), cleanupError], "Motion choreography was cancelled with cleanup errors")
        : abortError()
    );
  };

  return {
    finished,
    pause: () => {
      if (cancelled || settled || paused) return;
      paused = true;
      for (const sequence of activeSequences) sequence.pause();
      for (const group of activeEffectGroups) group.pause();
      for (const recipeCtrl of activeRecipeControls) recipeCtrl.pause();
    },
    resume: () => {
      if (cancelled || settled || !paused) return;
      paused = false;
      for (const sequence of activeSequences) sequence.resume();
      for (const group of activeEffectGroups) group.resume();
      for (const recipeCtrl of activeRecipeControls) recipeCtrl.resume();
    },
    play: () => {
      if (cancelled || settled) return;
      if (paused) {
        paused = false;
        for (const sequence of activeSequences) sequence.resume();
        for (const group of activeEffectGroups) group.resume();
        for (const recipeCtrl of activeRecipeControls) recipeCtrl.resume();
      }
    },
    cancel,
    destroy: cancel,
  };
}

registerChoreographyEngine(createMotionChoreography);
