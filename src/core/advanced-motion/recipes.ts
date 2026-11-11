/**
 * AF Motion Advanced Composition Recipes & Presets
 *
 * Pre-configured recipes combining SVG morphing, motion paths, kinetic typography,
 * shared elements, layout, and physics into cohesive multi-system motion experiences.
 */

import type {
  AdvancedCompositionPresetName,
  AdvancedMotionCompositionDefinition,
} from "./types.js";

export const ADVANCED_COMPOSITION_PRESETS: Record<
  AdvancedCompositionPresetName,
  (overrides?: Partial<AdvancedMotionCompositionDefinition>) => AdvancedMotionCompositionDefinition
> = {
  "svg-morph-and-path": (overrides) => ({
    id: overrides?.id ?? "svg-morph-and-path",
    name: "SVG Morph & Motion Path",
    participants: [
      {
        id: "path-motion",
        system: "motion-path",
        target: (overrides?.participants?.[0] as any)?.target ?? "#svg-actor",
        path: (overrides?.participants?.[0] as any)?.path ?? "M 0 0 C 100 0, 200 100, 300 100",
        duration: 800,
        easing: "easeInOutCubic",
      },
      {
        id: "svg-morph",
        system: "svg-morph",
        target: (overrides?.participants?.[1] as any)?.target ?? "#svg-shape",
        to: (overrides?.participants?.[1] as any)?.to ?? "M 10 10 L 90 10 L 90 90 L 10 90 Z",
        at: "<",
        duration: 800,
        easing: "easeInOutCubic",
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    duration: 800,
    ...overrides,
  }),

  "typography-and-path": (overrides) => ({
    id: overrides?.id ?? "typography-and-path",
    name: "Kinetic Typography Along Motion Path",
    participants: [
      {
        id: "text-reveal",
        system: "typography",
        target: (overrides?.participants?.[0] as any)?.target ?? "#kinetic-heading",
        options: {
          by: "words",
          preset: "fade-up",
          stagger: 40,
        },
        duration: 600,
      },
      {
        id: "path-guide",
        system: "motion-path",
        target: (overrides?.participants?.[1] as any)?.target ?? "#guide-dot",
        path: (overrides?.participants?.[1] as any)?.path ?? "M 0 0 L 400 0",
        at: 100,
        duration: 700,
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    ...overrides,
  }),

  "shared-element-and-layout": (overrides) => ({
    id: overrides?.id ?? "shared-element-and-layout",
    name: "Shared Element & Layout Continuity",
    participants: [
      {
        id: "shared-card",
        system: "shared-element",
        source: (overrides?.participants?.[0] as any)?.source ?? "#source-card",
        destination: (overrides?.participants?.[0] as any)?.destination ?? "#dest-card",
        options: {
          crossfade: true,
          interpolateBorderRadius: true,
        },
        duration: 450,
      },
      {
        id: "container-flow",
        system: "animation",
        target: (overrides?.participants?.[1] as any)?.target ?? "#content-grid",
        keyframes: { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
        at: "+=100",
        duration: 350,
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    ...overrides,
  }),

  "typography-and-shared-element": (overrides) => ({
    id: overrides?.id ?? "typography-and-shared-element",
    name: "Typography & Shared Element Co-reveal",
    participants: [
      {
        id: "hero-shared-element",
        system: "shared-element",
        source: (overrides?.participants?.[0] as any)?.source ?? "#thumb",
        destination: (overrides?.participants?.[0] as any)?.destination ?? "#hero-img",
        duration: 400,
      },
      {
        id: "hero-title-reveal",
        system: "typography",
        target: (overrides?.participants?.[1] as any)?.target ?? "#hero-title",
        options: {
          by: "characters",
          preset: "scale-reveal",
          stagger: 25,
        },
        at: "+=80",
        duration: 500,
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    ...overrides,
  }),

  "multi-element-coordinated-reveal": (overrides) => ({
    id: overrides?.id ?? "multi-element-coordinated-reveal",
    name: "Multi-Element Coordinated Reveal",
    participants: [
      {
        id: "badge-morph",
        system: "svg-morph",
        target: (overrides?.participants?.[0] as any)?.target ?? "#badge-path",
        to: (overrides?.participants?.[0] as any)?.to ?? "M 20 20 L 80 20 L 50 80 Z",
        duration: 400,
      },
      {
        id: "heading-text",
        system: "typography",
        target: (overrides?.participants?.[1] as any)?.target ?? "#title-text",
        options: { preset: "fade-up", by: "words" },
        at: "+=50",
        duration: 450,
      },
      {
        id: "card-entrance",
        system: "animation",
        target: (overrides?.participants?.[2] as any)?.target ?? "#card-body",
        keyframes: { opacity: [0, 1], transform: ["scale(0.95)", "scale(1)"] },
        at: "+=50",
        duration: 350,
      },
      ...(overrides?.participants?.slice(3) ?? []),
    ],
    ...overrides,
  }),

  "morphing-scene-transition": (overrides) => ({
    id: overrides?.id ?? "morphing-scene-transition",
    name: "Morphing Scene Transition",
    participants: [
      {
        id: "backdrop-morph",
        system: "svg-morph",
        target: (overrides?.participants?.[0] as any)?.target ?? "#scene-bg",
        to: (overrides?.participants?.[0] as any)?.to ?? "M 0 0 C 150 50, 250 50, 400 0 L 400 300 L 0 300 Z",
        duration: 600,
      },
      {
        id: "scene-content",
        system: "animation",
        target: (overrides?.participants?.[1] as any)?.target ?? "#scene-items",
        keyframes: { opacity: [0, 1] },
        at: "+=150",
        duration: 400,
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    ...overrides,
  }),

  "cinematic-page-transition": (overrides) => ({
    id: overrides?.id ?? "cinematic-page-transition",
    name: "Cinematic Page Transition",
    participants: [
      {
        id: "view-wrapper",
        system: "view-transition",
        update: (overrides?.participants?.[0] as any)?.update ?? (() => undefined),
        duration: 400,
      },
      {
        id: "hero-shared",
        system: "shared-element",
        source: (overrides?.participants?.[1] as any)?.source ?? "#thumb-page1",
        destination: (overrides?.participants?.[1] as any)?.destination ?? "#hero-page2",
        at: "<",
        duration: 450,
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    ...overrides,
  }),

  "physics-path-choreography": (overrides) => ({
    id: overrides?.id ?? "physics-path-choreography",
    name: "Physics-Driven Path Traversal",
    participants: [
      {
        id: "spring-init",
        system: "physics",
        target: (overrides?.participants?.[0] as any)?.target ?? "#actor-obj",
        type: "spring",
        options: { stiffness: 200, damping: 20 },
        duration: 350,
      },
      {
        id: "path-traverse",
        system: "motion-path",
        target: (overrides?.participants?.[1] as any)?.target ?? "#actor-obj",
        path: (overrides?.participants?.[1] as any)?.path ?? "M 0 0 C 50 100, 150 100, 200 0",
        dependsOn: ["spring-init"],
        duration: 500,
      },
      ...(overrides?.participants?.slice(2) ?? []),
    ],
    ...overrides,
  }),
};

/**
 * Returns a configured Advanced Motion Composition definition from a preset name.
 */
export function getAdvancedCompositionPreset(
  name: AdvancedCompositionPresetName,
  overrides?: Partial<AdvancedMotionCompositionDefinition>
): AdvancedMotionCompositionDefinition {
  const factory = ADVANCED_COMPOSITION_PRESETS[name];
  if (!factory) {
    throw new Error(`Unknown advanced composition preset: "${name}".`);
  }
  return factory(overrides);
}

/**
 * Lists all available preset names.
 */
export function listAdvancedCompositionPresets(): AdvancedCompositionPresetName[] {
  return Object.keys(ADVANCED_COMPOSITION_PRESETS) as AdvancedCompositionPresetName[];
}
