import { animate } from "./animate.js";
import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import type { AnimationControls } from "./animation.js";
import { animateSequence } from "./animation-sequence.js";
import type {
  AnimationSequenceControls,
  AnimationSequenceOptions,
  AnimationSequenceStep,
} from "./animation-sequence.js";
import { easeOutCubic, easeOutQuad } from "../easing/easings.js";

export interface AnimationPreset {
  /** CSS properties and their starting and ending values. */
  readonly properties: Readonly<AnimatableProperties>;
  /** Default timing, easing, and lifecycle options. */
  readonly options?: Readonly<DOMAnimationOptions>;
}

export type AnimationPresetName =
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "scaleIn"
  | "scaleOut";

export type AnimationPresetRegistry = Readonly<
  Record<AnimationPresetName, AnimationPreset>
>;

export interface AnimationPresetRegistryApi {
  /** Returns an immutable snapshot, or undefined when the name is unknown. */
  get(name: string): AnimationPreset | undefined;
  /** Registers or replaces a custom preset. Built-in names are reserved. */
  register(name: string, preset: AnimationPreset): void;
  /** Removes a custom preset. Built-ins cannot be removed. */
  remove(name: string): boolean;
}

export type AnimationPresetOverrides = Partial<DOMAnimationOptions>;

export interface AnimationSequencePresetStep {
  /** Name of a registered single-animation preset. */
  readonly preset: string;
  /** Options that override the referenced animation preset. */
  readonly overrides?: AnimationPresetOverrides;
}

export interface AnimationSequencePreset {
  /** Presets to run in order against the same target. */
  readonly steps: readonly AnimationSequencePresetStep[];
  /** Default group callbacks. */
  readonly options?: AnimationSequenceOptions;
}

export interface AnimationSequencePresetRegistryApi {
  /** Returns an immutable snapshot, or undefined when the name is unknown. */
  get(name: string): AnimationSequencePreset | undefined;
  /** Registers or replaces a custom sequence preset. */
  register(name: string, preset: AnimationSequencePreset): void;
  /** Removes a custom sequence preset. */
  remove(name: string): boolean;
}

export interface AnimationSequencePresetOverrides extends AnimationSequenceOptions {
  /** Per-step animation option overrides, matched by step index. */
  readonly steps?: readonly (AnimationPresetOverrides | undefined)[];
}

const builtins: AnimationPresetRegistry = Object.freeze({
  fadeIn: freezePreset({ properties: { opacity: [0, 1] }, options: { duration: 400, easing: easeOutQuad } }),
  fadeOut: freezePreset({ properties: { opacity: [1, 0] }, options: { duration: 300, easing: easeOutQuad } }),
  slideUp: freezePreset({
    properties: { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
    options: { duration: 500, easing: easeOutCubic },
  }),
  slideDown: freezePreset({
    properties: { opacity: [0, 1], transform: ["translateY(-24px)", "translateY(0px)"] },
    options: { duration: 500, easing: easeOutCubic },
  }),
  scaleIn: freezePreset({
    properties: { opacity: [0, 1], transform: ["scale(0.9)", "scale(1)"] },
    options: { duration: 400, easing: easeOutCubic },
  }),
  scaleOut: freezePreset({
    properties: { opacity: [1, 0], transform: ["scale(1)", "scale(0.9)"] },
    options: { duration: 300, easing: easeOutQuad },
  }),
});

const builtinNames = new Set(Object.keys(builtins));
const customPresets = new Map<string, AnimationPreset>();
const customSequencePresets = new Map<string, AnimationSequencePreset>();

function validateName(name: string): void {
  if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
    throw new TypeError("Animation preset name must be a non-empty string without surrounding whitespace");
  }
}

function clonePreset(preset: AnimationPreset): AnimationPreset {
  const properties: Record<string, readonly [string | number, string | number]> = Object.create(null);
  for (const [property, values] of Object.entries(preset.properties)) {
    properties[property] = Object.freeze([values[0], values[1]]);
  }
  const options = preset.options ? { ...preset.options } : undefined;
  return Object.freeze({
    properties: Object.freeze(properties),
    ...(options ? { options: Object.freeze(options) } : {}),
  });
}

function freezePreset(preset: AnimationPreset): AnimationPreset {
  const properties: Record<string, readonly [string | number, string | number]> = Object.create(null);
  for (const [property, values] of Object.entries(preset.properties)) {
    properties[property] = Object.freeze([values[0], values[1]]);
  }
  return Object.freeze({
    properties: Object.freeze(properties),
    ...(preset.options ? { options: Object.freeze({ ...preset.options }) } : {}),
  });
}

function validatePreset(preset: AnimationPreset): void {
  if (preset === null || typeof preset !== "object" || Array.isArray(preset)) {
    throw new TypeError("Animation preset must be an object");
  }
  if (
    preset.properties === null ||
    typeof preset.properties !== "object" ||
    Array.isArray(preset.properties) ||
    Object.keys(preset.properties).length === 0
  ) {
    throw new TypeError("Animation preset properties must be a non-empty object");
  }
  for (const [property, values] of Object.entries(preset.properties)) {
    if (!Array.isArray(values) || values.length !== 2) {
      throw new TypeError(`Animation preset property "${property}" must be a [from, to] pair`);
    }
    for (const value of values) {
      if (
        (typeof value !== "string" || value.trim() === "") &&
        (typeof value !== "number" || !Number.isFinite(value))
      ) {
        throw new TypeError(`Animation preset property "${property}" contains an invalid value`);
      }
    }
  }
  if (
    preset.options !== undefined &&
    (preset.options === null || typeof preset.options !== "object" || Array.isArray(preset.options))
  ) {
    throw new TypeError("Animation preset options must be an object");
  }
}

function freezeSequencePreset(preset: AnimationSequencePreset): AnimationSequencePreset {
  return Object.freeze({
    steps: Object.freeze(preset.steps.map((step) => Object.freeze({
      preset: step.preset,
      ...(step.overrides ? { overrides: Object.freeze({ ...step.overrides }) } : {}),
    }))),
    ...(preset.options ? { options: Object.freeze({ ...preset.options }) } : {}),
  });
}

function validateSequencePreset(preset: AnimationSequencePreset): void {
  if (preset === null || typeof preset !== "object" || Array.isArray(preset)) {
    throw new TypeError("Animation sequence preset must be an object");
  }
  if (!Array.isArray(preset.steps) || preset.steps.length === 0) {
    throw new TypeError("Animation sequence preset steps must be a non-empty array");
  }
  for (const [index, step] of preset.steps.entries()) {
    if (step === null || typeof step !== "object" || Array.isArray(step)) {
      throw new TypeError(`Animation sequence preset step ${index} must be an object`);
    }
    validateName(step.preset);
    if (!getAnimationPreset(step.preset)) {
      throw new TypeError(`Unknown animation preset "${step.preset}" in sequence preset`);
    }
    if (step.overrides !== undefined &&
      (step.overrides === null || typeof step.overrides !== "object" || Array.isArray(step.overrides))) {
      throw new TypeError(`Animation sequence preset step ${index} overrides must be an object`);
    }
  }
  if (
    preset.options !== undefined &&
    (preset.options === null || typeof preset.options !== "object" || Array.isArray(preset.options))
  ) {
    throw new TypeError("Animation sequence preset options must be an object");
  }
}

export function getAnimationPreset(name: string): AnimationPreset | undefined {
  validateName(name);
  const preset = Object.prototype.hasOwnProperty.call(builtins, name)
    ? builtins[name as AnimationPresetName]
    : customPresets.get(name);
  return preset ? clonePreset(preset) : undefined;
}

export function getAnimationSequencePreset(name: string): AnimationSequencePreset | undefined {
  validateName(name);
  const preset = customSequencePresets.get(name);
  return preset ? freezeSequencePreset(preset) : undefined;
}

export function registerAnimationPreset(name: string, preset: AnimationPreset): void {
  validateName(name);
  validatePreset(preset);
  if (builtinNames.has(name)) {
    throw new TypeError(`Cannot replace built-in animation preset "${name}"`);
  }
  customPresets.set(name, freezePreset(preset));
}

export function registerAnimationSequencePreset(name: string, preset: AnimationSequencePreset): void {
  validateName(name);
  validateSequencePreset(preset);
  customSequencePresets.set(name, freezeSequencePreset(preset));
}

export function removeAnimationPreset(name: string): boolean {
  validateName(name);
  if (builtinNames.has(name)) return false;
  return customPresets.delete(name);
}

export function removeAnimationSequencePreset(name: string): boolean {
  validateName(name);
  return customSequencePresets.delete(name);
}

export const animationPresetRegistry: Readonly<AnimationPresetRegistryApi> = Object.freeze({
  get: getAnimationPreset,
  register: registerAnimationPreset,
  remove: removeAnimationPreset,
});

export const animationSequencePresetRegistry: Readonly<AnimationSequencePresetRegistryApi> = Object.freeze({
  get: getAnimationSequencePreset,
  register: registerAnimationSequencePreset,
  remove: removeAnimationSequencePreset,
});

/** Runs a registered preset through the existing `animate()` engine. */
export function animatePreset(
  target: AnimateTarget,
  name: string,
  overrides: AnimationPresetOverrides = {},
): AnimationControls {
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Animation preset overrides must be an object");
  }
  const preset = getAnimationPreset(name);
  if (!preset) throw new TypeError(`Unknown animation preset "${name}"`);
  const properties: AnimatableProperties = {};
  for (const [property, values] of Object.entries(preset.properties)) {
    properties[property] = [values[0], values[1]];
  }
  return animate(target, properties, {
    ...preset.options,
    ...overrides,
  });
}

/** Runs a registered choreography by composing single-animation presets through `animateSequence()`. */
export function animatePresetSequence(
  target: AnimateTarget,
  name: string,
  overrides: AnimationSequencePresetOverrides = {},
): AnimationSequenceControls {
  if (overrides === null || typeof overrides !== "object" || Array.isArray(overrides)) {
    throw new TypeError("Animation sequence preset overrides must be an object");
  }
  const preset = getAnimationSequencePreset(name);
  if (!preset) throw new TypeError(`Unknown animation sequence preset "${name}"`);
  if (overrides.steps !== undefined && !Array.isArray(overrides.steps)) {
    throw new TypeError("Animation sequence preset step overrides must be an array");
  }
  if ((overrides.steps?.length ?? 0) > preset.steps.length) {
    throw new RangeError("Animation sequence preset has more step overrides than steps");
  }

  const steps: AnimationSequenceStep[] = preset.steps.map((step, index) => {
    const animationPreset = getAnimationPreset(step.preset);
    if (!animationPreset) {
      throw new TypeError(`Unknown animation preset "${step.preset}" in sequence preset "${name}"`);
    }
    const properties: AnimatableProperties = {};
    for (const [property, values] of Object.entries(animationPreset.properties)) {
      properties[property] = [values[0], values[1]];
    }
    return {
      target,
      properties,
      options: {
        ...animationPreset.options,
        ...step.overrides,
        ...overrides.steps?.[index],
      },
    };
  });

  const { steps: _stepOverrides, ...sequenceOptions } = overrides;
  return animateSequence(steps, {
    ...preset.options,
    ...sequenceOptions,
  });
}
