import { composeEffects } from "./effect-composer.js";
import type { ComposableEffect, EffectCompositionControls } from "./effect-composer.js";
import type {
  MotionChoreographyAction,
  MotionChoreographyAnimation,
  MotionChoreographyControls,
} from "./motion-choreography.js";

var choreoEngine: ((actions: readonly MotionChoreographyAction[]) => MotionChoreographyControls) | undefined;

/** Registers the choreography engine to eliminate circular module dependencies between recipe and choreography. */
export function registerChoreographyEngine(
  engine: (actions: readonly MotionChoreographyAction[]) => MotionChoreographyControls,
): void {
  choreoEngine = engine;
}
import { applyMotionDNA, resolveMotionDNA } from "./motion-dna.js";
import { adaptAnimationOptions, type AdaptiveMotionConditions } from "./adaptive-motion.js";
import { resolveDesignSystem, type DesignSystem } from "./design-system.js";
import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import { animateSequence } from "./animation-sequence.js";
import type { AnimationSequenceControls, AnimationSequenceOptions, AnimationSequenceStep } from "./animation-sequence.js";
import { animateParallel } from "./animation-parallel.js";
import type { AnimationParallelControls, AnimationParallelOptions, AnimationParallelStep } from "./animation-parallel.js";
import { getPreset, resolvePresetAnimation } from "../presets.js";
import type { MotionPresetOverrides } from "../presets.js";

export const RECIPE_SCHEMA_VERSION = "1.0.0";

export interface MotionRecipeContext {
  /** Resolves DNA declared by the recipe with per-use overrides. */
  motionDNA(name: string, overrides?: MotionDNAOverrides): MotionDNA;
}

export interface MotionRecipeDefinition<Parameters extends object> {
  /** DNA names this recipe is allowed to resolve. */
  motionDNA?: readonly string[];
  /** Builds effect entries that run for the recipe's lifetime. */
  effects?: (
    parameters: Readonly<Parameters>,
    context: MotionRecipeContext,
  ) => readonly ComposableEffect[];
  /** Builds the ordered choreography to execute for this recipe. */
  choreography?: (
    parameters: Readonly<Parameters>,
    context: MotionRecipeContext,
  ) => readonly MotionChoreographyAction[];
}

export interface MotionRecipe<Parameters extends object> {
  readonly definition: MotionRecipeDefinition<Parameters>;
}

export interface MotionRecipeControls {
  /** Resolves when the recipe's choreography completes; undefined for effect-only recipes. */
  readonly finished?: Promise<void>;
  /** Pauses choreography animations and effects that expose pause controls. */
  pause(): void;
  /** Resumes choreography animations and effects that expose resume controls. */
  resume(): void;
  /** Stops the choreography and cleans up all recipe effects. Safe to repeat. */
  destroy(): void;
  /** Alias for destroy(). */
  cancel(): void;
  /** Optional play control when underlying engine supports forward playback. */
  play?(): void;
  /** Optional reverse control when recipe is a pure reversible sequence. */
  reverse?(): void;
  /** Optional seek control when recipe is a pure seekable sequence. */
  seek?(progress: number): void;
}

// --- Declarative Motion Recipe Specifications ---

export interface RecipeStepBase {
  readonly label?: string;
  readonly delay?: number;
}

export interface RecipePresetStep extends RecipeStepBase {
  readonly type?: "preset";
  readonly preset: string;
  readonly target?: AnimateTarget | string;
  readonly duration?: number;
  readonly easing?: string | ((t: number) => number);
  readonly overrides?: MotionPresetOverrides;
}

export interface RecipeParallelStep extends RecipeStepBase {
  readonly type: "parallel";
  readonly steps: readonly RecipeStep[];
}

export interface RecipeSequenceStep extends RecipeStepBase {
  readonly type: "sequence";
  readonly steps: readonly RecipeStep[];
}

export interface RecipeNestedStep extends RecipeStepBase {
  readonly type: "recipe";
  readonly recipe: string | DeclarativeMotionRecipe;
  readonly targets?: Record<string, AnimateTarget>;
  readonly overrides?: MotionPresetOverrides;
}

export type RecipeStep =
  | RecipePresetStep
  | RecipeParallelStep
  | RecipeSequenceStep
  | RecipeNestedStep;

export interface RecipeParameterSchema {
  readonly name: string;
  readonly type: string;
  readonly description: string;
  readonly required?: boolean;
  readonly default?: unknown;
}

export interface DeclarativeMotionRecipe {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly requiredTargets?: readonly string[];
  readonly defaultOptions?: MotionPresetOverrides;
  readonly structure?: "sequence" | "parallel";
  readonly steps: readonly RecipeStep[];
  readonly parameters?: readonly RecipeParameterSchema[];
}

export type RecipeTargetMap = Record<string, AnimateTarget>;

export interface RecipeRunOptions {
  /** Named target bindings or a default fallback target. */
  readonly targets?: RecipeTargetMap | AnimateTarget;
  /** Recipe-level timing/animation option overrides. */
  readonly overrides?: MotionPresetOverrides;
  /** Step-specific overrides keyed by step label or index string. */
  readonly stepOverrides?: Record<string, MotionPresetOverrides>;
}

export interface RecipeValidationError {
  readonly parameter?: string;
  readonly message: string;
}

export interface RecipeValidationResult {
  readonly valid: boolean;
  readonly errors: readonly RecipeValidationError[];
}

export interface RecipesDocument {
  readonly $schema: string;
  readonly version: string;
  readonly totalRecipes: number;
  readonly recipes: readonly DeclarativeMotionRecipe[];
}

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

function abortError(): Error {
  const error = new Error("Motion recipe was cancelled");
  error.name = "AbortError";
  return error;
}

// --- Built-in Declarative Recipes ---

export const BUILT_IN_MOTION_RECIPES: readonly DeclarativeMotionRecipe[] = [
  {
    id: "recipe-hero-stagger",
    name: "heroStagger",
    description: "Coordinated hero section entrance with sequential presentation of badge, headline, paragraph, and CTA buttons.",
    category: "hero",
    tags: ["hero", "landing", "stagger", "entrance"],
    requiredTargets: ["container", "badge", "title", "body", "cta"],
    defaultOptions: { duration: 450 },
    structure: "sequence",
    steps: [
      { preset: "fadeIn", target: "$container", duration: 300, label: "containerFade" },
      { preset: "scaleIn", target: "$badge", duration: 350, label: "badgePop" },
      { preset: "slideUp", target: "$title", duration: 500, label: "titleRise" },
      { preset: "textRise", target: "$body", duration: 450, label: "bodyRise" },
      { preset: "bounceIn", target: "$cta", duration: 500, label: "ctaBounce" },
    ],
  },
  {
    id: "recipe-modal-dialog",
    name: "modalDialog",
    description: "Modal dialog entrance with backdrop fade in parallel with dialog zoom, followed by form field focus.",
    category: "dialog",
    tags: ["modal", "dialog", "presentation", "entrance"],
    requiredTargets: ["backdrop", "dialog", "content"],
    structure: "sequence",
    steps: [
      {
        type: "parallel",
        label: "entranceParallel",
        steps: [
          { preset: "fadeIn", target: "$backdrop", duration: 300, label: "backdropFade" },
          { preset: "zoomIn", target: "$dialog", duration: 350, label: "dialogZoom" },
        ],
      },
      { preset: "textFocus", target: "$content", duration: 400, label: "contentFocus" },
    ],
  },
  {
    id: "recipe-card-reveal",
    name: "cardReveal",
    description: "Interactive card presentation sliding into view with subsequent subtle glow illumination.",
    category: "cards",
    tags: ["card", "reveal", "glow", "showcase"],
    requiredTargets: ["card"],
    structure: "sequence",
    steps: [
      { preset: "slideUp", target: "$card", duration: 450, label: "cardSlide" },
      { preset: "hoverGlow", target: "$card", duration: 300, label: "cardGlow" },
    ],
  },
  {
    id: "recipe-form-error-feedback",
    name: "formErrorFeedback",
    description: "Form validation error feedback shaking the erroneous input field and flashing an alert banner.",
    category: "feedback",
    tags: ["form", "error", "shake", "feedback"],
    requiredTargets: ["input", "banner"],
    structure: "sequence",
    steps: [
      { preset: "shakeError", target: "$input", duration: 100, label: "inputShake" },
      { preset: "flashHighlight", target: "$banner", duration: 200, label: "bannerFlash" },
    ],
  },
  {
    id: "recipe-attention-callout",
    name: "attentionCallout",
    description: "Noticeable notification callout pulsing an icon and breathing ambient glow.",
    category: "feedback",
    tags: ["attention", "alert", "pulse", "notification"],
    requiredTargets: ["icon", "badge"],
    structure: "sequence",
    steps: [
      {
        type: "parallel",
        label: "pulseParallel",
        steps: [
          { preset: "pulseAttention", target: "$icon", duration: 350, label: "iconPulse" },
          { preset: "pulseAmbient", target: "$badge", duration: 400, label: "badgeGlow" },
        ],
      },
    ],
  },
];

for (const recipe of BUILT_IN_MOTION_RECIPES) {
  freezeDeep(recipe);
}

// Internal Recipe Stores
const RECIPES_BY_ID = new Map<string, DeclarativeMotionRecipe>();
const RECIPES_BY_NAME = new Map<string, DeclarativeMotionRecipe>();

for (const recipe of BUILT_IN_MOTION_RECIPES) {
  RECIPES_BY_ID.set(recipe.id, recipe);
  RECIPES_BY_NAME.set(recipe.name, recipe);
}

const BUILT_IN_RECIPE_IDS = new Set(BUILT_IN_MOTION_RECIPES.map((r) => r.id));
const BUILT_IN_RECIPE_NAMES = new Set(BUILT_IN_MOTION_RECIPES.map((r) => r.name));
const customRecipesById = new Map<string, DeclarativeMotionRecipe>();
const customRecipesByName = new Map<string, DeclarativeMotionRecipe>();

/**
 * Returns all registered motion recipes (built-in and custom).
 */
export function listRecipes(): readonly DeclarativeMotionRecipe[] {
  const custom = Array.from(customRecipesById.values());
  return Object.freeze([...BUILT_IN_MOTION_RECIPES, ...custom]);
}

/**
 * Looks up a recipe by its ID or friendly name.
 */
export function getRecipe(idOrName: string): DeclarativeMotionRecipe | undefined {
  if (typeof idOrName !== "string" || idOrName.trim() === "") return undefined;
  const key = idOrName.trim();
  return (
    RECIPES_BY_ID.get(key) ??
    RECIPES_BY_NAME.get(key) ??
    customRecipesById.get(key) ??
    customRecipesByName.get(key)
  );
}

/**
 * Searches recipes by keyword query matching ID, name, description, category, or tags.
 */
export function searchRecipes(query: string): readonly DeclarativeMotionRecipe[] {
  if (!query || typeof query !== "string") return [];
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return [];

  const all = listRecipes();
  return Object.freeze(
    all.filter((recipe) => {
      return (
        recipe.id.toLowerCase().includes(normalized) ||
        recipe.name.toLowerCase().includes(normalized) ||
        (recipe.category && recipe.category.toLowerCase().includes(normalized)) ||
        recipe.description.toLowerCase().includes(normalized) ||
        (recipe.tags && recipe.tags.some((tag) => tag.toLowerCase().includes(normalized)))
      );
    }),
  );
}

/**
 * Registers a new custom declarative recipe. Built-in IDs and names are reserved.
 */
export function registerRecipe(recipe: DeclarativeMotionRecipe): void {
  const validation = validateRecipe(recipe);
  if (!validation.valid) {
    throw new TypeError(`Cannot register invalid recipe: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  if (BUILT_IN_RECIPE_IDS.has(recipe.id) || BUILT_IN_RECIPE_NAMES.has(recipe.name)) {
    throw new TypeError(`Cannot overwrite built-in recipe "${recipe.id}" ("${recipe.name}")`);
  }

  const frozen = freezeDeep({ ...recipe });
  customRecipesById.set(frozen.id, frozen);
  customRecipesByName.set(frozen.name, frozen);
}

/**
 * Removes a custom motion recipe. Built-in recipes cannot be removed.
 */
export function removeRecipe(idOrName: string): boolean {
  if (typeof idOrName !== "string" || idOrName.trim() === "") return false;
  const key = idOrName.trim();
  if (BUILT_IN_RECIPE_IDS.has(key) || BUILT_IN_RECIPE_NAMES.has(key)) return false;

  const recipe = customRecipesById.get(key) ?? customRecipesByName.get(key);
  if (!recipe) return false;

  customRecipesById.delete(recipe.id);
  customRecipesByName.delete(recipe.name);
  return true;
}

/**
 * Validates a declarative recipe definition against structure, preset existence, and circular references.
 */
export function validateRecipe(
  recipe: unknown,
  visitedRecipeIds: Set<string> = new Set(),
): RecipeValidationResult {
  const errors: RecipeValidationError[] = [];
  if (recipe === null || typeof recipe !== "object" || Array.isArray(recipe)) {
    return { valid: false, errors: [{ message: "Recipe must be a non-null object" }] };
  }

  const r = recipe as Partial<DeclarativeMotionRecipe>;

  if (typeof r.id !== "string" || r.id.trim() === "") {
    errors.push({ parameter: "id", message: "Recipe id must be a non-empty string" });
  } else {
    if (visitedRecipeIds.has(r.id)) {
      return {
        valid: false,
        errors: [{ parameter: "id", message: `Circular recipe reference detected involving "${r.id}"` }],
      };
    }
    visitedRecipeIds.add(r.id);
  }

  if (typeof r.name !== "string" || r.name.trim() === "") {
    errors.push({ parameter: "name", message: "Recipe name must be a non-empty string" });
  }
  if (typeof r.description !== "string" || r.description.trim().length < 5) {
    errors.push({ parameter: "description", message: "Recipe description must be at least 5 characters" });
  }
  if (!Array.isArray(r.steps) || r.steps.length === 0) {
    errors.push({ parameter: "steps", message: "Recipe steps must be a non-empty array" });
  } else {
    const seenLabels = new Set<string>();

    function validateStepList(steps: readonly RecipeStep[], pathPrefix: string): void {
      for (const [idx, step] of steps.entries()) {
        const stepPath = `${pathPrefix}[${idx}]`;
        if (step === null || typeof step !== "object" || Array.isArray(step)) {
          errors.push({ parameter: stepPath, message: "Step must be an object" });
          continue;
        }

        if (step.label) {
          if (seenLabels.has(step.label)) {
            errors.push({ parameter: `${stepPath}.label`, message: `Duplicate step label "${step.label}"` });
          }
          seenLabels.add(step.label);
        }

        if (step.delay !== undefined && (typeof step.delay !== "number" || step.delay < 0)) {
          errors.push({ parameter: `${stepPath}.delay`, message: "Step delay must be a number >= 0" });
        }

        if (step.type === "parallel" || step.type === "sequence") {
          const group = step as RecipeParallelStep | RecipeSequenceStep;
          if (!Array.isArray(group.steps) || group.steps.length === 0) {
            errors.push({ parameter: `${stepPath}.steps`, message: `${step.type} step must contain a non-empty array of steps` });
          } else {
            validateStepList(group.steps, `${stepPath}.steps`);
          }
        } else if (step.type === "recipe") {
          const nested = step as RecipeNestedStep;
          if (!nested.recipe) {
            errors.push({ parameter: `${stepPath}.recipe`, message: "Nested recipe step must specify a recipe" });
          } else if (typeof nested.recipe === "string") {
            const resolved = getRecipe(nested.recipe);
            if (!resolved) {
              errors.push({ parameter: `${stepPath}.recipe`, message: `Unknown nested recipe "${nested.recipe}"` });
            } else {
              const nestedValidation = validateRecipe(resolved, new Set(visitedRecipeIds));
              if (!nestedValidation.valid) {
                errors.push(...nestedValidation.errors.map((e) => ({
                  parameter: `${stepPath}.${e.parameter ?? "nested"}`,
                  message: e.message,
                })));
              }
            }
          } else {
            const nestedValidation = validateRecipe(nested.recipe, new Set(visitedRecipeIds));
            if (!nestedValidation.valid) {
              errors.push(...nestedValidation.errors.map((e) => ({
                parameter: `${stepPath}.${e.parameter ?? "nested"}`,
                message: e.message,
              })));
            }
          }
        } else {
          // Preset step (default)
          const pStep = step as RecipePresetStep;
          if (typeof pStep.preset !== "string" || pStep.preset.trim() === "") {
            errors.push({ parameter: `${stepPath}.preset`, message: "Preset step must specify a preset name or id" });
          } else if (!getPreset(pStep.preset)) {
            errors.push({ parameter: `${stepPath}.preset`, message: `Unknown preset "${pStep.preset}"` });
          }
        }
      }
    }

    validateStepList(r.steps, "steps");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates run options against recipe requirements (e.g. required targets).
 */
export function validateRecipeRunOptions(
  recipeIdOrRecipe: string | DeclarativeMotionRecipe,
  options: unknown,
): RecipeValidationResult {
  const errors: RecipeValidationError[] = [];
  const recipe = typeof recipeIdOrRecipe === "string" ? getRecipe(recipeIdOrRecipe) : recipeIdOrRecipe;
  if (!recipe) {
    return {
      valid: false,
      errors: [{ message: `Unknown recipe "${String(recipeIdOrRecipe)}"` }],
    };
  }

  if (options === undefined || options === null) {
    if (recipe.requiredTargets && recipe.requiredTargets.length > 0) {
      return {
        valid: false,
        errors: [{ parameter: "targets", message: `Missing required targets: ${recipe.requiredTargets.join(", ")}` }],
      };
    }
    return { valid: true, errors: [] };
  }

  if (typeof options !== "object" || Array.isArray(options)) {
    return {
      valid: false,
      errors: [{ message: "Recipe run options must be an object" }],
    };
  }

  const opts = options as RecipeRunOptions;

  // Validate required targets
  if (recipe.requiredTargets && recipe.requiredTargets.length > 0) {
    if (!opts.targets) {
      errors.push({
        parameter: "targets",
        message: `Missing required targets: ${recipe.requiredTargets.join(", ")}`,
      });
    } else if (isTargetMap(opts.targets)) {
      const map = opts.targets as RecipeTargetMap;
      for (const requiredSlot of recipe.requiredTargets) {
        const raw = requiredSlot.startsWith("$") ? requiredSlot.slice(1) : requiredSlot;
        if (map[raw] === undefined && map[`$${raw}`] === undefined) {
          errors.push({
            parameter: `targets.${raw}`,
            message: `Missing binding for required target slot "${raw}"`,
          });
        }
      }
    }
  }

  // Validate overrides if present
  if (opts.overrides) {
    if (opts.overrides.duration !== undefined && (typeof opts.overrides.duration !== "number" || opts.overrides.duration < 0)) {
      errors.push({ parameter: "overrides.duration", message: "duration must be a number >= 0" });
    }
    if (opts.overrides.delay !== undefined && (typeof opts.overrides.delay !== "number" || opts.overrides.delay < 0)) {
      errors.push({ parameter: "overrides.delay", message: "delay must be a number >= 0" });
    }
    if (opts.overrides.playbackRate !== undefined && (typeof opts.overrides.playbackRate !== "number" || opts.overrides.playbackRate <= 0)) {
      errors.push({ parameter: "overrides.playbackRate", message: "playbackRate must be a number > 0" });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isTargetMap(targets: unknown): targets is RecipeTargetMap {
  if (targets === null || typeof targets !== "object") return false;
  if ("nodeType" in targets || "style" in targets || typeof (targets as any).addEventListener === "function") {
    return false;
  }
  return true;
}

/**
 * Resolves a target reference against provided target map or fallback.
 */
function resolveTargetSlot(
  stepTarget: AnimateTarget | string | undefined,
  targets: RecipeTargetMap | AnimateTarget | undefined,
  requiredTargets?: readonly string[],
): AnimateTarget {
  if (typeof stepTarget === "string") {
    const slot = stepTarget.startsWith("$") ? stepTarget.slice(1) : stepTarget;
    if (targets && isTargetMap(targets)) {
      if (targets[slot] !== undefined) return targets[slot];
      if (targets[`$${slot}`] !== undefined) return targets[`$${slot}`];
    }
    if (stepTarget.startsWith("$") || (requiredTargets && requiredTargets.includes(slot))) {
      throw new TypeError(`Missing target binding for slot "${stepTarget}"`);
    }
    return stepTarget; // CSS selector
  }

  if (stepTarget !== undefined) {
    return stepTarget;
  }

  if (targets) {
    if (!isTargetMap(targets) || typeof targets === "string") {
      return targets as AnimateTarget;
    }
    if (targets.default !== undefined) return targets.default;
    if (targets.container !== undefined) return targets.container;
    if (targets.root !== undefined) return targets.root;
  }

  throw new TypeError("Recipe step does not define a target and no default target was provided");
}

/**
 * Checks whether all steps in the recipe are flat sequential preset steps.
 */
function isFlatSequence(steps: readonly RecipeStep[]): boolean {
  for (const step of steps) {
    if (step.type === "parallel" || step.type === "sequence" || step.type === "recipe") {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether all steps in the recipe are flat parallel preset steps.
 */
function isFlatParallel(steps: readonly RecipeStep[]): boolean {
  for (const step of steps) {
    if (step.type === "parallel" || step.type === "sequence" || step.type === "recipe") {
      return false;
    }
  }
  return true;
}

function mergeStepOptions(
  recipeDefaults: MotionPresetOverrides | undefined,
  stepDuration: number | undefined,
  stepDelay: number | undefined,
  stepEasing: string | ((t: number) => number) | undefined,
  stepOverrides: MotionPresetOverrides | undefined,
  globalOverrides: MotionPresetOverrides,
  labelOverride: MotionPresetOverrides,
): MotionPresetOverrides {
  return {
    ...recipeDefaults,
    ...(stepDuration !== undefined ? { duration: stepDuration } : {}),
    ...(stepDelay !== undefined ? { delay: stepDelay } : {}),
    ...(stepEasing !== undefined ? { easing: stepEasing as any } : {}),
    ...stepOverrides,
    ...globalOverrides,
    ...labelOverride,
  };
}

/**
 * Runs a declarative recipe against target bindings and optional overrides.
 */
export function runRecipe(
  recipeIdOrRecipe: string | DeclarativeMotionRecipe,
  options: RecipeRunOptions = {},
): MotionRecipeControls {
  const resolvedRecipe = typeof recipeIdOrRecipe === "string" ? getRecipe(recipeIdOrRecipe) : recipeIdOrRecipe;
  if (!resolvedRecipe) {
    throw new TypeError(`Unknown motion recipe "${String(recipeIdOrRecipe)}"`);
  }
  const recipe: DeclarativeMotionRecipe = resolvedRecipe;

  const validation = validateRecipeRunOptions(recipe, options);
  if (!validation.valid) {
    throw new TypeError(`Invalid recipe options: ${validation.errors.map((e) => e.message).join(", ")}`);
  }

  const targets = options.targets;
  const globalOverrides = options.overrides ?? {};
  const stepOverridesMap = options.stepOverrides ?? {};

  // Fast path 1: Flat sequential recipe -> animateSequence() with play(), reverse(), and seek()!
  if (recipe.structure !== "parallel" && isFlatSequence(recipe.steps)) {
    const sequenceSteps: AnimationSequenceStep[] = recipe.steps.map((step, idx) => {
      const pStep = step as RecipePresetStep;
      const target = resolveTargetSlot(pStep.target, targets, recipe.requiredTargets);
      const labelKey = pStep.label ?? String(idx);
      const stepOverride = stepOverridesMap[labelKey] ?? stepOverridesMap[String(idx)] ?? {};

      const mergedOptions = mergeStepOptions(
        recipe.defaultOptions,
        pStep.duration,
        pStep.delay,
        pStep.easing,
        pStep.overrides,
        globalOverrides,
        stepOverride,
      );

      const { properties, options: resolvedOptions } = resolvePresetAnimation(pStep.preset, mergedOptions);
      return {
        target,
        properties,
        options: resolvedOptions,
      };
    });

    const seqControls = animateSequence(sequenceSteps);
    return {
      finished: seqControls.finished,
      pause: () => seqControls.pause(),
      resume: () => seqControls.resume(),
      reverse: () => seqControls.reverse(),
      cancel: () => seqControls.cancel(),
      destroy: () => seqControls.cancel(),
    };
  }

  // Fast path 2: Flat parallel recipe -> animateParallel()!
  if (recipe.structure === "parallel" && isFlatParallel(recipe.steps)) {
    const parallelSteps: AnimationParallelStep[] = recipe.steps.map((step, idx) => {
      const pStep = step as RecipePresetStep;
      const target = resolveTargetSlot(pStep.target, targets, recipe.requiredTargets);
      const labelKey = pStep.label ?? String(idx);
      const stepOverride = stepOverridesMap[labelKey] ?? stepOverridesMap[String(idx)] ?? {};

      const mergedOptions = mergeStepOptions(
        recipe.defaultOptions,
        pStep.duration,
        pStep.delay,
        pStep.easing,
        pStep.overrides,
        globalOverrides,
        stepOverride,
      );

      const { properties, options: resolvedOptions } = resolvePresetAnimation(pStep.preset, mergedOptions);
      return {
        target,
        properties,
        options: resolvedOptions,
      };
    });

    const parControls = animateParallel(parallelSteps);
    return {
      finished: parControls.finished,
      pause: () => parControls.pause(),
      resume: () => parControls.resume(),
      cancel: () => parControls.cancel(),
      destroy: () => parControls.cancel(),
    };
  }

  // General phased execution path for mixed/nested sequential and parallel steps
  let activeControls: { pause(): void; resume(): void; cancel(): void } | null = null;
  let paused = false;
  let cancelled = false;
  let finishedResolve: () => void = () => undefined;
  let finishedReject: (err: any) => void = () => undefined;

  const finishedPromise = new Promise<void>((resolve, reject) => {
    finishedResolve = resolve;
    finishedReject = reject;
  });

  function compileSinglePresetStep(step: RecipePresetStep, index: number): AnimationParallelStep {
    const target = resolveTargetSlot(step.target, targets, recipe?.requiredTargets);
    const labelKey = step.label ?? String(index);
    const stepOverride = stepOverridesMap[labelKey] ?? stepOverridesMap[String(index)] ?? {};

    const mergedOptions = mergeStepOptions(
      recipe?.defaultOptions,
      step.duration,
      step.delay,
      step.easing,
      step.overrides,
      globalOverrides,
      stepOverride,
    );

    const { properties, options: resolvedOptions } = resolvePresetAnimation(step.preset, mergedOptions);
    return {
      target,
      properties,
      options: resolvedOptions,
    };
  }

  async function runNestedRecipe(rStep: RecipeNestedStep): Promise<void> {
    const nestedRecipe = typeof rStep.recipe === "string" ? getRecipe(rStep.recipe) : rStep.recipe;
    if (!nestedRecipe) throw new TypeError(`Unknown nested recipe "${String(rStep.recipe)}"`);
    const nestedTargets = isTargetMap(targets)
      ? { ...targets, ...rStep.targets }
      : (rStep.targets ?? targets);

    const controls = runRecipe(nestedRecipe, {
      targets: nestedTargets,
      overrides: { ...globalOverrides, ...rStep.overrides },
      stepOverrides: stepOverridesMap,
    });
    activeControls = controls;
    if (paused) controls.pause();
    if (controls.finished) await controls.finished;
  }

  async function runStep(step: RecipeStep, index: number): Promise<void> {
    if (step.type === "parallel") {
      const pStep = step as RecipeParallelStep;
      const isAllPresets = pStep.steps.every((c) => !c.type || c.type === "preset");
      if (isAllPresets) {
        const parSteps: AnimationParallelStep[] = pStep.steps.map((child, cIdx) => {
          return compileSinglePresetStep(child as RecipePresetStep, cIdx);
        });
        const controls = animateParallel(parSteps);
        activeControls = controls;
        if (paused) controls.pause();
        await controls.finished;
      } else {
        const childControls: { pause(): void; resume(): void; cancel(): void }[] = [];
        activeControls = {
          pause: () => childControls.forEach((c) => c.pause()),
          resume: () => childControls.forEach((c) => c.resume()),
          cancel: () => childControls.forEach((c) => c.cancel()),
        };
        await Promise.all(
          pStep.steps.map(async (child, cIdx) => {
            if (child.type === "sequence") {
              const sStep = child as RecipeSequenceStep;
              for (let scIdx = 0; scIdx < sStep.steps.length; scIdx++) {
                if (cancelled) return;
                await runStep(sStep.steps[scIdx], scIdx);
              }
            } else if (child.type === "recipe") {
              await runNestedRecipe(child as RecipeNestedStep);
            } else {
              const singleStep = compileSinglePresetStep(child as RecipePresetStep, cIdx);
              const ctrl = animateParallel([singleStep]);
              childControls.push(ctrl);
              if (paused) ctrl.pause();
              await ctrl.finished;
            }
          })
        );
      }
    } else if (step.type === "sequence") {
      const sStep = step as RecipeSequenceStep;
      for (let cIdx = 0; cIdx < sStep.steps.length; cIdx++) {
        if (cancelled) return;
        await runStep(sStep.steps[cIdx], cIdx);
      }
    } else if (step.type === "recipe") {
      await runNestedRecipe(step as RecipeNestedStep);
    } else {
      const singleStep = compileSinglePresetStep(step as RecipePresetStep, index);
      const controls = animateParallel([singleStep]);
      activeControls = controls;
      if (paused) controls.pause();
      await controls.finished;
    }
  }

  async function executePhases(): Promise<void> {
    try {
      const activeRecipe: DeclarativeMotionRecipe = recipe;
      for (const [idx, step] of activeRecipe.steps.entries()) {
        if (cancelled) return;
        await runStep(step, idx);
      }

      if (!cancelled) {
        finishedResolve();
      }
    } catch (err) {
      if (!cancelled) {
        finishedReject(err);
      }
    }
  }

  // Start execution asynchronously
  executePhases();

  return {
    finished: finishedPromise,
    pause: () => {
      if (cancelled) return;
      paused = true;
      activeControls?.pause();
    },
    resume: () => {
      if (cancelled) return;
      paused = false;
      activeControls?.resume();
    },
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      activeControls?.cancel();
      finishedReject(abortError());
    },
    destroy: () => {
      if (cancelled) return;
      cancelled = true;
      activeControls?.cancel();
      finishedReject(abortError());
    },
  };
}

/**
 * Creates and registers or freezes a declarative motion recipe.
 */
export function composeRecipe(recipe: DeclarativeMotionRecipe): DeclarativeMotionRecipe {
  const validation = validateRecipe(recipe);
  if (!validation.valid) {
    throw new TypeError(`Cannot compose invalid recipe: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  return freezeDeep({ ...recipe });
}

/**
 * Exports a recipe definition as a JSON string.
 */
export function exportRecipeJson(
  recipeIdOrRecipe: string | DeclarativeMotionRecipe,
  pretty = true,
): string {
  const recipe = typeof recipeIdOrRecipe === "string" ? getRecipe(recipeIdOrRecipe) : recipeIdOrRecipe;
  if (!recipe) {
    throw new TypeError(`Unknown motion recipe "${String(recipeIdOrRecipe)}"`);
  }
  return JSON.stringify(recipe, null, pretty ? 2 : 0);
}

/**
 * Exports all registered recipes as a versioned document.
 */
export function exportRecipesDocument(): RecipesDocument {
  const all = listRecipes();
  return {
    $schema: "https://af-motion.dev/schemas/recipes-v1.json",
    version: RECIPE_SCHEMA_VERSION,
    totalRecipes: all.length,
    recipes: all,
  };
}

/**
 * Imports and validates a recipe definition from a JSON string.
 */
export function importRecipeFromJson(json: string): DeclarativeMotionRecipe {
  if (typeof json !== "string" || json.trim() === "") {
    throw new TypeError("Recipe JSON must be a non-empty string");
  }
  const parsed = JSON.parse(json);
  const validation = validateRecipe(parsed);
  if (!validation.valid) {
    throw new TypeError(`Invalid recipe JSON: ${validation.errors.map((e) => e.message).join(", ")}`);
  }
  return freezeDeep(parsed as DeclarativeMotionRecipe);
}

// --- Low-Level Programmatic Recipe Builder (Preserved for 100% Backward Compatibility) ---

function validateDefinition<Parameters extends object>(
  definition: MotionRecipeDefinition<Parameters>,
): void {
  if (definition === null || typeof definition !== "object" || Array.isArray(definition)) {
    throw new TypeError("Motion recipe definition must be an object");
  }
  if (definition.effects !== undefined && typeof definition.effects !== "function") {
    throw new TypeError("Motion recipe effects must be a function");
  }
  if (definition.choreography !== undefined && typeof definition.choreography !== "function") {
    throw new TypeError("Motion recipe choreography must be a function");
  }
  if (definition.effects === undefined && definition.choreography === undefined) {
    throw new TypeError("Motion recipe must define effects or choreography");
  }
  if (definition.motionDNA !== undefined && !Array.isArray(definition.motionDNA)) {
    throw new TypeError("Motion recipe motionDNA must be an array of names");
  }
  const names = new Set<string>();
  for (const name of definition.motionDNA ?? []) {
    if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
      throw new TypeError("Motion recipe DNA names must be non-empty strings without surrounding whitespace");
    }
    if (names.has(name)) throw new TypeError(`Motion recipe declares duplicate DNA "${name}"`);
    names.add(name);
  }
}

function snapshotDefinition<Parameters extends object>(
  definition: MotionRecipeDefinition<Parameters>,
): MotionRecipeDefinition<Parameters> {
  return Object.freeze({
    ...(definition.motionDNA ? { motionDNA: Object.freeze([...definition.motionDNA]) } : {}),
    ...(definition.effects ? { effects: definition.effects } : {}),
    ...(definition.choreography ? { choreography: definition.choreography } : {}),
  });
}

/**
 * Overload 1: Programmatic builder recipe with effects/choreography callbacks.
 * Overload 2: Declarative motion recipe definition.
 */
export function createMotionRecipe<Parameters extends object>(
  definition: MotionRecipeDefinition<Parameters>,
): MotionRecipe<Parameters>;
export function createMotionRecipe(
  definition: DeclarativeMotionRecipe,
): DeclarativeMotionRecipe;
export function createMotionRecipe(
  definition: any,
): any {
  if (definition && Array.isArray(definition.steps)) {
    return composeRecipe(definition);
  }
  validateDefinition(definition);
  return Object.freeze({ definition: snapshotDefinition(definition) });
}

/**
 * Overload 1: Runs a programmatic recipe with parameter object.
 * Overload 2: Runs a declarative recipe with target bindings and overrides.
 */
export function runMotionRecipe<Parameters extends object>(
  recipe: MotionRecipe<Parameters>,
  parameters: Parameters,
): MotionRecipeControls;
export function runMotionRecipe(
  recipe: DeclarativeMotionRecipe | string,
  options?: RecipeRunOptions,
): MotionRecipeControls;
export function runMotionRecipe(
  recipe: any,
  parameters: any = {},
): MotionRecipeControls {
  // If string or declarative recipe
  if (typeof recipe === "string" || (recipe && Array.isArray(recipe.steps))) {
    return runRecipe(recipe, parameters);
  }

  // Programmatic recipe
  if (recipe === null || typeof recipe !== "object" || recipe.definition === undefined) {
    throw new TypeError("recipe must be created with createMotionRecipe()");
  }
  if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new TypeError("Motion recipe parameters must be an object");
  }
  const definition = recipe.definition;

  // Check if declarative definition wrapped inside recipe.definition
  if (Array.isArray(definition.steps)) {
    return runRecipe(definition, parameters);
  }

  const declaredDNA = new Set(definition.motionDNA ?? []);
  const context: MotionRecipeContext = Object.freeze({
    motionDNA: (name: string, overrides: MotionDNAOverrides = {}): MotionDNA => {
      if (!declaredDNA.has(name)) {
        throw new TypeError(`Motion DNA "${name}" is not declared by this recipe`);
      }
      return applyMotionDNA(name, overrides);
    },
  });
  const parameterSnapshot = Object.freeze({ ...parameters });
  let effects: EffectCompositionControls | null = null;
  let choreography: MotionChoreographyControls | null = null;
  let destroyed = false;

  try {
    const effectEntries = definition.effects?.(parameterSnapshot, context);
    if (effectEntries !== undefined) effects = composeEffects(effectEntries);

    const actions = definition.choreography?.(parameterSnapshot, context);
    if (actions !== undefined) {
      if (!choreoEngine) {
        throw new Error("Motion choreography engine is not registered");
      }
      choreography = choreoEngine(actions);
    }
  } catch (error) {
    try {
      effects?.destroy();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Motion recipe failed to start and clean up");
    }
    throw error;
  }

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    const errors: unknown[] = [];
    try {
      choreography?.cancel();
    } catch (error) {
      errors.push(error);
    }
    try {
      effects?.destroy();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length > 0) throw new AggregateError(errors, "Motion recipe cleanup failed");
  };

  const pause = (): void => {
    if (destroyed) return;
    const errors: unknown[] = [];
    try {
      choreography?.pause();
    } catch (error) {
      errors.push(error);
    }
    try {
      effects?.pause();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length > 0) throw new AggregateError(errors, "Motion recipe pause failed");
  };

  const resume = (): void => {
    if (destroyed) return;
    const errors: unknown[] = [];
    try {
      choreography?.resume();
    } catch (error) {
      errors.push(error);
    }
    try {
      effects?.resume();
    } catch (error) {
      errors.push(error);
    }
    if (errors.length > 0) throw new AggregateError(errors, "Motion recipe resume failed");
  };

  const finished = choreography
    ? choreography.finished.catch((error: unknown) => {
      try {
        effects?.destroy();
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "Motion recipe choreography failed to clean up");
      }
      throw error;
    })
    : undefined;

  return {
    ...(finished ? { finished } : {}),
    pause,
    resume,
    destroy,
    cancel: destroy,
  };
}
