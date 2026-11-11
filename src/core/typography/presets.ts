/**
 * AF Motion Kinetic Typography Presets
 *
 * Highly configurable, production-grade typography animation presets.
 */

import type {
  TypographyPresetDefinition,
  TypographyPresetName,
  TypographyPresetOptions,
  TypographyStyleState,
} from "./types.js";

const PRESET_DEFINITIONS: Record<
  TypographyPresetName,
  (opts: TypographyPresetOptions) => TypographyPresetDefinition
> = {
  "fade-in": (opts) => ({
    name: "fade-in",
    from: { opacity: 0 },
    to: { opacity: 1 },
    defaultDuration: opts.duration ?? 600,
    defaultEasing: "easeOutQuad",
    defaultBy: "characters",
    defaultStagger: { each: 25 },
  }),

  "fade-up": (opts) => {
    const dist = opts.distance ?? 24;
    return {
      name: "fade-up",
      from: { opacity: 0, translateY: dist },
      to: { opacity: 1, translateY: 0 },
      defaultDuration: opts.duration ?? 700,
      defaultEasing: "easeOutCubic",
      defaultBy: "words",
      defaultStagger: { each: 35 },
    };
  },

  "fade-down": (opts) => {
    const dist = opts.distance ?? 24;
    return {
      name: "fade-down",
      from: { opacity: 0, translateY: -dist },
      to: { opacity: 1, translateY: 0 },
      defaultDuration: opts.duration ?? 700,
      defaultEasing: "easeOutCubic",
      defaultBy: "words",
      defaultStagger: { each: 35 },
    };
  },

  "slide-in": (opts) => {
    const dist = opts.distance ?? 40;
    const dir = opts.direction ?? "left";
    let from: TypographyStyleState = { opacity: 0 };
    switch (dir) {
      case "left":
        from = { opacity: 0, translateX: -dist };
        break;
      case "right":
        from = { opacity: 0, translateX: dist };
        break;
      case "up":
        from = { opacity: 0, translateY: dist };
        break;
      case "down":
        from = { opacity: 0, translateY: -dist };
        break;
    }
    return {
      name: "slide-in",
      from,
      to: { opacity: 1, translateX: 0, translateY: 0 },
      defaultDuration: opts.duration ?? 800,
      defaultEasing: "easeOutExpo",
      defaultBy: "characters",
      defaultStagger: { each: 20 },
    };
  },

  "scale-reveal": (opts) => ({
    name: "scale-reveal",
    from: { opacity: 0, scale: 0.2 },
    to: { opacity: 1, scale: 1 },
    defaultDuration: opts.duration ?? 600,
    defaultEasing: "easeOutBack",
    defaultBy: "words",
    defaultStagger: { each: 40 },
  }),

  "blur-reveal": (opts) => ({
    name: "blur-reveal",
    from: { opacity: 0, blur: 16, translateY: 10 },
    to: { opacity: 1, blur: 0, translateY: 0 },
    defaultDuration: opts.duration ?? 800,
    defaultEasing: "easeOutCubic",
    defaultBy: "words",
    defaultStagger: { each: 45 },
  }),

  "rotate-reveal": (opts) => ({
    name: "rotate-reveal",
    from: { opacity: 0, rotateX: -90, translateY: 20, transformOrigin: "50% 0%" },
    to: { opacity: 1, rotateX: 0, translateY: 0, transformOrigin: "50% 0%" },
    defaultDuration: opts.duration ?? 750,
    defaultEasing: "easeOutCubic",
    defaultBy: "characters",
    defaultStagger: { each: 25 },
  }),

  "character-wave": (opts) => ({
    name: "character-wave",
    from: { opacity: 0, translateY: 30, rotate: -15 },
    to: { opacity: 1, translateY: 0, rotate: 0 },
    defaultDuration: opts.duration ?? 700,
    defaultEasing: "easeOutBack",
    defaultBy: "characters",
    defaultStagger: { each: 25 },
  }),

  "word-stagger": (opts) => ({
    name: "word-stagger",
    from: { opacity: 0, translateY: 16 },
    to: { opacity: 1, translateY: 0 },
    defaultDuration: opts.duration ?? 600,
    defaultEasing: "easeOutQuad",
    defaultBy: "words",
    defaultStagger: { each: 50 },
  }),

  "line-reveal": (opts) => ({
    name: "line-reveal",
    from: { opacity: 0, translateY: "100%" },
    to: { opacity: 1, translateY: "0%" },
    defaultDuration: opts.duration ?? 800,
    defaultEasing: "easeOutCubic",
    defaultBy: "lines",
    defaultStagger: { each: 100 },
  }),

  typewriter: (opts) => ({
    name: "typewriter",
    from: { opacity: 0 },
    to: { opacity: 1 },
    defaultDuration: opts.duration ?? 400,
    defaultEasing: "steps(1, end)",
    defaultBy: "characters",
    defaultStagger: { each: 40 },
  }),

  "text-scramble": (opts) => ({
    name: "text-scramble",
    from: { opacity: 0 },
    to: { opacity: 1 },
    defaultDuration: opts.duration ?? 900,
    defaultEasing: "easeInOutQuad",
    defaultBy: "characters",
    defaultStagger: { each: 15 },
  }),

  "split-reveal": (opts) => ({
    name: "split-reveal",
    from: { opacity: 0, scaleY: 0, transformOrigin: "50% 50%" },
    to: { opacity: 1, scaleY: 1, transformOrigin: "50% 50%" },
    defaultDuration: opts.duration ?? 650,
    defaultEasing: "easeOutCubic",
    defaultBy: "words",
    defaultStagger: { each: 35 },
  }),

  "bounce-characters": (opts) => ({
    name: "bounce-characters",
    from: { opacity: 0, translateY: -50, scaleY: 1.2 },
    to: { opacity: 1, translateY: 0, scaleY: 1 },
    defaultDuration: opts.duration ?? 900,
    defaultEasing: "easeOutBounce",
    defaultBy: "characters",
    defaultStagger: { each: 30 },
  }),

  "elastic-entrance": (opts) => ({
    name: "elastic-entrance",
    from: { opacity: 0, translateY: 40, scale: 0.6 },
    to: { opacity: 1, translateY: 0, scale: 1 },
    defaultDuration: opts.duration ?? 1000,
    defaultEasing: "easeOutElastic",
    defaultBy: "characters",
    defaultStagger: { each: 25 },
  }),

  "highlight-sweep": (opts) => {
    const color = opts.highlightColor ?? "rgba(59, 130, 246, 0.9)";
    return {
      name: "highlight-sweep",
      from: { opacity: 0.4, color: "inherit" },
      to: { opacity: 1, color },
      defaultDuration: opts.duration ?? 700,
      defaultEasing: "easeOutQuad",
      defaultBy: "words",
      defaultStagger: { each: 40 },
    };
  },
};

/**
 * Returns a configured typography preset definition by name.
 */
export function getTypographyPreset(
  name: TypographyPresetName,
  options: TypographyPresetOptions = {}
): TypographyPresetDefinition {
  const factory = PRESET_DEFINITIONS[name];
  if (!factory) {
    throw new Error(`Unknown typography preset: "${name}". Available: ${listTypographyPresets().join(", ")}`);
  }
  return factory(options);
}

/**
 * Lists all built-in typography preset identifiers.
 */
export function listTypographyPresets(): TypographyPresetName[] {
  return Object.keys(PRESET_DEFINITIONS) as TypographyPresetName[];
}
