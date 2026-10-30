import { animate, resolveTargets } from "./animate.js";
import type { AnimateTarget, AnimationValue, DOMAnimationOptions } from "./animate.js";
import { applyMotionDNA } from "./motion-dna.js";
import type { MotionDNAOverrides } from "./motion-dna.js";
import type { AnimationControls } from "./animation.js";

export interface MotionStateDefinition {
  /** CSS property values that define this state. */
  readonly values: Readonly<Record<string, AnimationValue>>;
  /** Per-state animation options. */
  readonly options?: DOMAnimationOptions;
  /** Optional Motion DNA identity for transitions to this state. */
  readonly motionDNA?: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
}

export type MotionStateDefinitions = Readonly<Record<string, MotionStateDefinition>>;

export interface MotionStateTransitionOptions extends DOMAnimationOptions {
  /** Optional Motion DNA identity applied to this transition. */
  motionDNA?: {
    name: string;
    overrides?: MotionDNAOverrides;
  };
}

export interface MotionStateTransitionControls {
  readonly finished: Promise<void>;
  cancel(): void;
}

export interface MotionStateControls {
  readonly currentState: string | undefined;
  /** Transitions from the currently rendered styles to a named state. */
  transitionTo(name: string, options?: MotionStateTransitionOptions): MotionStateTransitionControls;
  /** Cancels an active transition, restores styles captured at creation, and destroys the controller. */
  destroy(): void;
}

interface CapturedStyle {
  readonly value: string;
  readonly priority: string;
}

function toCssName(property: string): string {
  if (property.startsWith("--")) return property;
  return property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function validateDefinitions(states: MotionStateDefinitions): Map<string, MotionStateDefinition> {
  if (states === null || typeof states !== "object" || Array.isArray(states)) {
    throw new TypeError("Motion states must be an object");
  }
  const entries = new Map<string, MotionStateDefinition>();
  for (const [name, definition] of Object.entries(states)) {
    if (name.trim() === "" || name !== name.trim()) {
      throw new TypeError("Motion state names must be non-empty strings without surrounding whitespace");
    }
    if (definition === null || typeof definition !== "object" || Array.isArray(definition)) {
      throw new TypeError(`Motion state "${name}" must be an object`);
    }
    if (
      definition.values === null ||
      typeof definition.values !== "object" ||
      Array.isArray(definition.values) ||
      Object.keys(definition.values).length === 0
    ) {
      throw new TypeError(`Motion state "${name}" values must be a non-empty object`);
    }
    const values: Record<string, AnimationValue> = {};
    for (const [property, value] of Object.entries(definition.values)) {
      if (property.trim() === "") throw new TypeError(`Motion state "${name}" has an empty property name`);
      if (
        (typeof value !== "string" || value.trim() === "") &&
        (typeof value !== "number" || !Number.isFinite(value))
      ) {
        throw new TypeError(`Motion state "${name}" property "${property}" has an invalid value`);
      }
      values[property] = value;
    }
    entries.set(name, Object.freeze({
      values: Object.freeze(values),
      ...(definition.options ? { options: Object.freeze({ ...definition.options }) } : {}),
      ...(definition.motionDNA
        ? {
          motionDNA: {
            name: definition.motionDNA.name,
            ...(definition.motionDNA.overrides
              ? { overrides: Object.freeze({ ...definition.motionDNA.overrides }) }
              : {}),
          },
        }
        : {}),
    }));
  }
  if (entries.size === 0) throw new TypeError("At least one motion state is required");
  return entries;
}

function abortError(): Error {
  const error = new Error("Motion state transition was cancelled");
  error.name = "AbortError";
  return error;
}

/**
 * Creates a named visual-state controller. Each transition starts at the current rendered CSS
 * value and delegates interpolation, reduced-motion handling, and scheduling to `animate()`.
 */
export function createMotionStates(
  target: AnimateTarget,
  definitions: MotionStateDefinitions,
  options: {
    initialState?: string;
    motionDNA?: {
      name: string;
      overrides?: MotionDNAOverrides;
    };
  } = {},
): MotionStateControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Motion state controller options must be an object");
  }
  const states = validateDefinitions(definitions);
  const elements = resolveTargets(target);
  const initialState = options.initialState;
  if (initialState !== undefined && !states.has(initialState)) {
    throw new TypeError(`Unknown motion state "${initialState}"`);
  }
  const baseDNA = options.motionDNA
    ? applyMotionDNA(options.motionDNA.name, options.motionDNA.overrides)
    : {};

  const captured = new Map<HTMLElement, Map<string, CapturedStyle>>();
  for (const element of elements) {
    const styles = new Map<string, CapturedStyle>();
    for (const state of states.values()) {
      for (const property of Object.keys(state.values)) {
        const cssName = toCssName(property);
        if (!styles.has(cssName)) {
          styles.set(cssName, {
            value: element.style.getPropertyValue(cssName),
            priority: element.style.getPropertyPriority(cssName),
          });
        }
      }
    }
    captured.set(element, styles);
  }

  const restore = (): void => {
    for (const [element, styles] of captured) {
      for (const [property, original] of styles) {
        if (original.value === "") element.style.removeProperty(property);
        else element.style.setProperty(property, original.value, original.priority);
      }
    }
  };

  const applyInitialState = (stateName: string): void => {
    const state = states.get(stateName);
    if (!state) return;
    for (const element of elements) {
      for (const [property, value] of Object.entries(state.values)) {
        element.style.setProperty(toCssName(property), String(value));
      }
    }
  };

  let currentState = initialState;
  let active: { controls: AnimationControls[]; reject: (reason: unknown) => void } | null = null;
  let destroyed = false;
  if (initialState !== undefined) applyInitialState(initialState);

  const cancelActive = (reason: Error): void => {
    const transition = active;
    if (!transition) return;
    active = null;
    const errors: unknown[] = [];
    for (const control of transition.controls) {
      try {
        control.cancel();
      } catch (error) {
        errors.push(error);
      }
    }
    transition.reject(reason);
    if (errors.length > 0) {
      throw new AggregateError(errors, "Motion state transition cancellation failed");
    }
  };

  return {
    get currentState() {
      return currentState;
    },
    transitionTo: (name, transitionOptions = {}) => {
      if (destroyed) throw new Error("Motion state controller has been destroyed");
      const state = states.get(name);
      if (!state) throw new TypeError(`Unknown motion state "${name}"`);
      cancelActive(abortError());

      const {
        motionDNA,
        onComplete,
        onCancel,
        ...explicitOptions
      } = transitionOptions;
      const dnaOptions = motionDNA
        ? applyMotionDNA(motionDNA.name, motionDNA.overrides)
        : {};
      const stateDNA = state.motionDNA
        ? applyMotionDNA(state.motionDNA.name, state.motionDNA.overrides)
        : {};
      const propertyEntries = Object.entries(state.values);

      let resolveFinished: () => void = () => undefined;
      let rejectFinished: (reason: unknown) => void = () => undefined;
      const finished = new Promise<void>((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      let settled = false;
      const controls: AnimationControls[] = [];
      let remaining = elements.length;
      const settleComplete = (): void => {
        if (settled || --remaining > 0) return;
        settled = true;
        active = null;
        currentState = name;
        try {
          onComplete?.();
          resolveFinished();
        } catch (error) {
          rejectFinished(error);
        }
      };
      const handleCancel = (): void => {
        if (settled) return;
        settled = true;
        active = null;
        try {
          onCancel?.();
        } finally {
          rejectFinished(abortError());
        }
      };

      try {
        for (const [elementIndex, element] of elements.entries()) {
          const properties: Record<string, readonly [AnimationValue, AnimationValue]> = {};
          for (const [property, destination] of propertyEntries) {
            const cssName = toCssName(property);
            const inlineValue = element.style.getPropertyValue(cssName);
            const from = inlineValue || (
              typeof getComputedStyle === "function"
                ? getComputedStyle(element).getPropertyValue(cssName)
                : ""
            ) || String(destination);
            properties[property] = [from, destination];
          }

          const control = animate(element, properties, {
            ...baseDNA,
            ...stateDNA,
            ...dnaOptions,
            ...state.options,
            ...explicitOptions,
            onStart: elementIndex === 0 ? transitionOptions.onStart : undefined,
            onUpdate: elementIndex === 0 ? transitionOptions.onUpdate : undefined,
            onComplete: settleComplete,
            onCancel: handleCancel,
          });
          controls.push(control);
        }
      } catch (error) {
        settled = true;
        const cleanupErrors: unknown[] = [];
        for (const control of controls) {
          try {
            control.cancel();
          } catch (cleanupError) {
            cleanupErrors.push(cleanupError);
          }
        }
        if (cleanupErrors.length > 0) {
          throw new AggregateError([error, ...cleanupErrors], "Motion state transition failed to start cleanly");
        }
        throw error;
      }
      if (elements.length > 0) active = { controls, reject: rejectFinished };
      else {
        settled = true;
        currentState = name;
        resolveFinished();
      }
      return {
        finished,
        cancel: () => {
          if (settled) return;
          if (active?.controls === controls) cancelActive(abortError());
          else {
            settled = true;
            controls.forEach((control) => control.cancel());
            try {
              transitionOptions.onCancel?.();
            } finally {
              rejectFinished(abortError());
            }
          }
        },
      };
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      cancelActive(abortError());
      restore();
      currentState = undefined;
    },
  };
}
