import type { EasingFunction } from "../core/animation.js";

/** Clamps progress to [0, 1]; NaN is treated as 0. */
function clampProgress(progress: number): number {
  if (Number.isNaN(progress)) return 0;
  return Math.min(Math.max(progress, 0), 1);
}

const BACK_OVERSHOOT = 1.70158;
const BACK_OVERSHOOT_PLUS_ONE = BACK_OVERSHOOT + 1;

export const linear: EasingFunction = (progress) => clampProgress(progress);

export const easeInQuad: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return t * t;
};

export const easeOutQuad: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return 1 - (1 - t) * (1 - t);
};

export const easeInOutQuad: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
};

export const easeInCubic: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return t * t * t;
};

export const easeOutCubic: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return 1 - (1 - t) ** 3;
};

export const easeInOutCubic: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};

export const easeInSine: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return t === 1 ? 1 : 1 - Math.cos((t * Math.PI) / 2);
};

export const easeOutSine: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return Math.sin((t * Math.PI) / 2);
};

export const easeInOutSine: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

export const easeOutExpo: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
};

/** Overshoots 1 mid-animation by design; only the input is clamped. */
export const easeOutBack: EasingFunction = (progress) => {
  const t = clampProgress(progress);
  if (t === 0) return 0;
  if (t === 1) return 1;
  const shifted = t - 1;
  return 1 + BACK_OVERSHOOT_PLUS_ONE * shifted ** 3 + BACK_OVERSHOOT * shifted ** 2;
};

export interface EasingRegistry {
  linear: EasingFunction;
  easeInQuad: EasingFunction;
  easeOutQuad: EasingFunction;
  easeInOutQuad: EasingFunction;
  easeInCubic: EasingFunction;
  easeOutCubic: EasingFunction;
  easeInOutCubic: EasingFunction;
  easeInSine: EasingFunction;
  easeOutSine: EasingFunction;
  easeInOutSine: EasingFunction;
  easeOutExpo: EasingFunction;
  easeOutBack: EasingFunction;
}

export type EasingName = keyof EasingRegistry;

export const easings: Readonly<EasingRegistry> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeOutExpo,
  easeOutBack,
};

export type EasingOption = EasingFunction | string;

export interface EasingRegistryApi {
  /** Registers or replaces a custom easing by name. Built-in names are reserved. */
  register(name: string, easing: EasingFunction): void;
  /** Retrieves a built-in or registered easing; returns undefined when the name is unknown. */
  get(name: string): EasingFunction | undefined;
  /** Removes a registered custom easing. Built-ins cannot be removed. */
  remove(name: string): boolean;
}

const registeredEasings = new Map<string, EasingFunction>();
const builtinNames = new Set(Object.keys(easings));

function validateName(name: string): void {
  if (typeof name !== "string" || name.trim() === "" || name !== name.trim()) {
    throw new TypeError("Easing name must be a non-empty string without surrounding whitespace");
  }
}

function validateEasing(easing: EasingFunction): void {
  if (typeof easing !== "function") {
    throw new TypeError("Easing must be a function");
  }
}

export function registerEasing(name: string, easing: EasingFunction): void {
  validateName(name);
  validateEasing(easing);
  if (builtinNames.has(name)) {
    throw new TypeError(`Cannot replace built-in easing "${name}"`);
  }
  registeredEasings.set(name, easing);
}

export function getEasing(name: string): EasingFunction | undefined {
  validateName(name);
  if (Object.prototype.hasOwnProperty.call(easings, name)) {
    return easings[name as EasingName];
  }
  return registeredEasings.get(name);
}

export function removeEasing(name: string): boolean {
  validateName(name);
  if (builtinNames.has(name)) return false;
  return registeredEasings.delete(name);
}

export const easingRegistry: Readonly<EasingRegistryApi> = Object.freeze({
  register: registerEasing,
  get: getEasing,
  remove: removeEasing,
});

export function resolveEasing(easing: EasingOption | undefined): EasingFunction {
  if (easing === undefined) return linear;
  if (typeof easing === "function") return easing;
  if (typeof easing !== "string") {
    throw new TypeError("easing must be a function or a registered easing name");
  }
  const resolved = getEasing(easing);
  if (!resolved) {
    throw new TypeError(`Unknown easing "${easing}"`);
  }
  return resolved;
}
