import { composeEffects } from "./effect-composer.js";
import type { ComposableEffect, EffectCompositionControls } from "./effect-composer.js";
import { createMotionChoreography } from "./motion-choreography.js";
import type {
  MotionChoreographyAction,
  MotionChoreographyControls,
} from "./motion-choreography.js";
import { applyMotionDNA } from "./motion-dna.js";
import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";

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
}

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

/** Creates an immutable reusable recipe definition; the recipe is not started until runMotionRecipe(). */
export function createMotionRecipe<Parameters extends object>(
  definition: MotionRecipeDefinition<Parameters>,
): MotionRecipe<Parameters> {
  validateDefinition(definition);
  return Object.freeze({ definition: snapshotDefinition(definition) });
}

export function runMotionRecipe<Parameters extends object>(
  recipe: MotionRecipe<Parameters>,
  parameters: Parameters,
): MotionRecipeControls {
  if (recipe === null || typeof recipe !== "object" || recipe.definition === undefined) {
    throw new TypeError("recipe must be created with createMotionRecipe()");
  }
  if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new TypeError("Motion recipe parameters must be an object");
  }
  const definition = recipe.definition;
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
    if (actions !== undefined) choreography = createMotionChoreography(actions);
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
