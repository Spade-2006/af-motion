/**
 * AF Motion View Transition Presets
 *
 * Configurable presets for full-view and shared-element transitions:
 * fade, crossfade, slide, scale, zoom, reveal, clip-path, directional-nav, and SVG morph.
 */

import type {
  ViewTransitionOptions,
  ViewTransitionPresetName,
} from "./types.js";

export const VIEW_TRANSITION_PRESETS: Record<ViewTransitionPresetName, ViewTransitionOptions> = {
  fade: {
    preset: "fade",
    duration: 250,
    easing: "easeOutCubic",
  },
  crossfade: {
    preset: "crossfade",
    duration: 300,
    easing: "easeInOutCubic",
  },
  slide: {
    preset: "slide",
    direction: "left",
    duration: 350,
    easing: "easeOutCubic",
  },
  scale: {
    preset: "scale",
    duration: 300,
    easing: "easeOutCubic",
  },
  zoom: {
    preset: "zoom",
    duration: 350,
    easing: "easeInOutCubic",
  },
  "shared-element": {
    preset: "shared-element",
    duration: 380,
    easing: "easeInOutCubic",
  },
  "shared-element-crossfade": {
    preset: "shared-element-crossfade",
    duration: 400,
    easing: "easeInOutCubic",
    sharedElements: {
      crossfade: true,
      interpolateBorderRadius: true,
    },
  },
  reveal: {
    preset: "reveal",
    duration: 350,
    easing: "easeOutCubic",
  },
  "clip-path-reveal": {
    preset: "clip-path-reveal",
    duration: 400,
    easing: "easeOutCubic",
  },
  "directional-nav": {
    preset: "directional-nav",
    duration: 320,
    easing: "easeOutCubic",
  },
  morph: {
    preset: "morph",
    duration: 450,
    easing: "easeInOutCubic",
  },
};

/**
 * Returns a configured ViewTransitionOptions object from preset name with optional overrides.
 */
export function getViewTransitionPreset(
  name: ViewTransitionPresetName,
  overrides?: Partial<ViewTransitionOptions>
): ViewTransitionOptions {
  const base = VIEW_TRANSITION_PRESETS[name] ?? VIEW_TRANSITION_PRESETS.crossfade;
  return {
    ...base,
    ...overrides,
  };
}

/**
 * Lists all registered view transition preset names.
 */
export function listAvailableViewTransitionPresets(): ViewTransitionPresetName[] {
  return Object.keys(VIEW_TRANSITION_PRESETS) as ViewTransitionPresetName[];
}
