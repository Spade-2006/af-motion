/**
 * AF Motion Layout Transition Presets
 */

import type { LayoutPreset, LayoutTransitionOptions } from "./types.js";

export interface ResolvedLayoutConfig {
  readonly duration: number; // in milliseconds
  readonly easing: string;
  readonly mode: "position" | "size" | "both" | "scale" | "fade-through" | "none";
  readonly transformOrigin: string;
  readonly respectReducedMotion: boolean;
  readonly crossAxis: boolean;
}

export const LAYOUT_PRESETS: Readonly<Record<LayoutPreset, { duration: number; easing: string }>> = {
  gentle: {
    duration: 350,
    easing: "easeOutCubic",
  },
  snappy: {
    duration: 220,
    easing: "easeOutQuad",
  },
  bouncy: {
    duration: 450,
    easing: "easeOutBack",
  },
  smooth: {
    duration: 300,
    easing: "easeInOutCubic",
  },
  subtle: {
    duration: 200,
    easing: "easeOutSine",
  },
};

/**
 * Normalizes duration (seconds vs milliseconds).
 */
export function normalizeDuration(val?: number, fallback = 300): number {
  if (typeof val !== "number" || isNaN(val)) return fallback;
  // If <= 10, assume seconds; else ms
  return val <= 10 ? val * 1000 : val;
}

/**
 * Resolves full layout transition parameters combining presets and custom options.
 */
export function resolveLayoutConfig(options: LayoutTransitionOptions = {}): ResolvedLayoutConfig {
  const presetConfig = options.preset ? LAYOUT_PRESETS[options.preset] : undefined;

  const duration = options.duration !== undefined
    ? normalizeDuration(options.duration)
    : presetConfig?.duration ?? 300;

  const easing = (options.easing as string | undefined) ?? presetConfig?.easing ?? "easeOutCubic";
  const mode = options.mode ?? "both";
  const transformOrigin = options.transformOrigin ?? "top left";
  const respectReducedMotion = options.respectReducedMotion !== false;
  const crossAxis = options.crossAxis !== false;

  return {
    duration,
    easing,
    mode,
    transformOrigin,
    respectReducedMotion,
    crossAxis,
  };
}
