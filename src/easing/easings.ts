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
