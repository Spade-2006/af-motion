import { animateSequence } from "./animation-sequence.js";
import type { AnimationSequenceControls, AnimationSequenceStep } from "./animation-sequence.js";
import type { ComposableEffect, EffectCompositionControls } from "./effect-composer.js";
import { composeEffects } from "./effect-composer.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import { applyMotionDNA } from "./motion-dna.js";
import type { MotionDNAOverrides } from "./motion-dna.js";

export interface MotionChoreographyAnimation {
  type: "animation";
  target: AnimateTarget;
  properties: AnimatableProperties;
  options?: DOMAnimationOptions;
  motionDNA?: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
}

export interface MotionChoreographyEffect {
  type: "effect";
  effect: ComposableEffect;
}

export interface MotionChoreographyParallel {
  type: "parallel";
  actions: readonly (MotionChoreographyAnimation | MotionChoreographyEffect)[];
}

export interface MotionChoreographyBranch {
  type: "branch";
  /** Evaluated when this action is reached; may read caller-owned state. */
  condition: () => boolean;
  then: readonly MotionChoreographyAction[];
  else?: readonly MotionChoreographyAction[];
}

export type MotionChoreographyAction =
  | MotionChoreographyAnimation
  | MotionChoreographyParallel
  | MotionChoreographyBranch;

export interface MotionChoreographyControls {
  /** Resolves when all choreography actions complete; rejects on failure or cancellation. */
  readonly finished: Promise<void>;
  pause(): void;
  resume(): void;
  /** Cancels active animations and cleans up active effects. Safe to repeat. */
  cancel(): void;
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
    ...(action.motionDNA
      ? {
        motionDNA: {
          name: action.motionDNA.name,
          ...(action.motionDNA.overrides ? { overrides: { ...action.motionDNA.overrides } } : {}),
        },
      }
      : {}),
  };
}

function copyEffect(effect: ComposableEffect): ComposableEffect {
  if ("motionDNA" in effect && effect.motionDNA !== undefined) {
    return {
      start: effect.start,
      motionDNA: {
        name: effect.motionDNA.name,
        ...(effect.motionDNA.overrides ? { overrides: { ...effect.motionDNA.overrides } } : {}),
      },
    };
  }
  return { start: effect.start };
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
      };
    }
    if (action.type !== "parallel" || !Array.isArray(action.actions) || action.actions.length === 0) {
      throw new TypeError(`Choreography action ${index} must be an animation or non-empty parallel group`);
    }
    const parallelAction = action as MotionChoreographyParallel;
    const children = parallelAction.actions.map((child: MotionChoreographyAnimation | MotionChoreographyEffect, childIndex: number) => {
      if (child === null || typeof child !== "object" || Array.isArray(child)) {
        throw new TypeError(`Parallel action ${childIndex} must be an object`);
      }
      if (child.type === "animation") return copyAnimation(child);
      if (child.type === "effect" && child.effect && typeof child.effect === "object") {
        return { type: "effect" as const, effect: copyEffect(child.effect) };
      }
      throw new TypeError(`Parallel action ${childIndex} must be an animation or effect`);
    });
    if (!children.some((child) => child.type === "animation")) {
      throw new TypeError("A parallel group must include at least one animation to define its duration");
    }
    return { type: "parallel", actions: children };
  });
}

function animationStep(action: MotionChoreographyAnimation): AnimationSequenceStep {
  const dnaOptions = action.motionDNA
    ? applyMotionDNA(action.motionDNA.name, action.motionDNA.overrides)
    : {};
  return {
    target: action.target,
    properties: action.properties,
    options: { ...dnaOptions, ...action.options },
  };
}

function abortError(): Error {
  const error = new Error("Motion choreography was cancelled");
  error.name = "AbortError";
  return error;
}

/** Runs ordered animations, conditional branches, and effect/animation parallel groups. */
export function createMotionChoreography(
  definition: readonly MotionChoreographyAction[],
): MotionChoreographyControls {
  const actions = snapshotActions(definition);
  let resolveFinished: () => void = () => undefined;
  let rejectFinished: (reason: unknown) => void = () => undefined;
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });
  const animations = new Set<AnimationSequenceControls>();
  const effectGroups = new Set<EffectCompositionControls>();
  let cancelled = false;
  let settled = false;
  let paused = false;

  const cleanup = (): void => {
    const errors: unknown[] = [];
    for (const animation of animations) {
      try {
        animation.cancel();
      } catch (error) {
        errors.push(error);
      }
    }
    animations.clear();
    for (const group of effectGroups) {
      try {
        group.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    effectGroups.clear();
    if (errors.length > 0) {
      throw new AggregateError(errors, "Motion choreography cleanup failed");
    }
  };

  const runAnimation = async (action: MotionChoreographyAnimation): Promise<void> => {
    const sequence = animateSequence([animationStep(action)]);
    animations.add(sequence);
    if (paused) sequence.pause();
    try {
      await sequence.finished;
    } finally {
      animations.delete(sequence);
    }
  };

  const runParallel = async (action: MotionChoreographyParallel): Promise<void> => {
    const effectEntries = action.actions
      .filter((child): child is MotionChoreographyEffect => child.type === "effect")
      .map((child) => child.effect);
    const group = effectEntries.length > 0 ? composeEffects(effectEntries) : null;
    if (group) effectGroups.add(group);
    const started: AnimationSequenceControls[] = [];
    let failure: unknown;
    let failed = false;
    try {
      for (const child of action.actions) {
        if (child.type !== "animation") continue;
        const sequence = animateSequence([animationStep(child)]);
        started.push(sequence);
        animations.add(sequence);
        if (paused) sequence.pause();
      }
      await Promise.all(started.map((sequence) => sequence.finished));
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
        animations.delete(sequence);
      }
    }
    if (group) {
      effectGroups.delete(group);
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

  const runActions = async (sequence: readonly MotionChoreographyAction[]): Promise<void> => {
    for (const action of sequence) {
      if (cancelled) return;
      if (action.type === "animation") await runAnimation(action);
      else if (action.type === "parallel") await runParallel(action);
      else {
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

  return {
    finished,
    pause: () => {
      if (cancelled || settled || paused) return;
      paused = true;
      for (const animation of animations) animation.pause();
      for (const group of effectGroups) group.pause();
    },
    resume: () => {
      if (cancelled || settled || !paused) return;
      paused = false;
      for (const animation of animations) animation.resume();
      for (const group of effectGroups) group.resume();
    },
    cancel: () => {
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
      rejectFinished(cleanupError
        ? new AggregateError([abortError(), cleanupError], "Motion choreography was cancelled with cleanup errors")
        : abortError());
    },
  };
}
