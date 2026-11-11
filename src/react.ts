"use client";

import { Children, createContext, createElement, forwardRef, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ButtonHTMLAttributes, CanvasHTMLAttributes, CSSProperties, FocusEvent as ReactFocusEvent, HTMLAttributes, InputHTMLAttributes, MouseEvent as ReactMouseEvent, ReactElement, ReactNode, Ref, RefObject } from "react";
import { animate as animateElement } from "./core/animate.js";
import type { AnimatableProperties, DOMAnimationOptions } from "./core/animate.js";
import type { AnimationControls, EasingFunction } from "./core/animation.js";
import { animateSequence } from "./core/animation-sequence.js";
import type { AnimationSequenceControls, AnimationSequenceOptions, AnimationSequenceStep } from "./core/animation-sequence.js";
import { animateParallel } from "./core/animation-parallel.js";
import type { AnimationParallelControls, AnimationParallelOptions, AnimationParallelStep } from "./core/animation-parallel.js";
import { createTimeline } from "./core/animation-timeline.js";
import type { AnimationTimelineControls, AnimationTimelinePosition, AnimationTimelineStep } from "./core/animation-timeline.js";
import { inView } from "./effects/in-view.js";
import type { InViewOptions } from "./effects/in-view.js";
import { scrollProgress } from "./effects/scroll-progress.js";
import type { ScrollProgressOptions } from "./effects/scroll-progress.js";
import { scrollVelocity } from "./effects/scroll-velocity.js";
import type { ScrollVelocityData, ScrollVelocityOptions } from "./effects/scroll-velocity.js";
import type { AnimateTarget } from "./core/animate.js";
import { reveal } from "./effects/reveal.js";
import { typewriter } from "./effects/typewriter.js";
import type { TypewriterOptions } from "./effects/typewriter.js";
import { textScramble } from "./effects/text-scramble.js";
import type { TextScrambleOptions } from "./effects/text-scramble.js";
import { gradientText } from "./effects/gradient-text.js";
import type { GradientTextOptions } from "./effects/gradient-text.js";
import {
  aiMotionRegistry,
  validateConfiguration,
  resolveConfigurationDefaults,
  type AIMotionCapability,
  type AIMotionRegistry,
  type CapabilityFilterOptions,
  type UnifiedMotionSchema,
  type ConfigurationValidationOptions,
  type ConfigurationValidationResult,
  interpretMotionPrompt,
  type InterpretOptions,
  type MotionInterpretationResult,
  interpretDesignRequirements,
  normalizeDesignContext,
  type DesignContext,
  type DesignInterpretationResult,
  type DesignInterpretationOptions,
  createComposition,
  addCompositionNode,
  removeCompositionNode,
  updateCompositionNode,
  buildCompositionTree,
  validateComposition,
  type MotionComposition,
  type CompositionNode,
  type CompositionOptions,
  type CompositionResult,
  type CompositionValidationResult,
  correctConfiguration,
  correctComposition,
  type CorrectionOptions,
  type CorrectionResult,
  type CompositionCorrectionResult,
  generateMotion,
  generateMotionSync,
  type GenerationStage,
  type GenerationRequest,
  type GenerationOptions,
  type GenerationResult,
  type GenerationError,
  visualStyleRegistry,
  resolveVisualStyle,
  type VisualStyleDefinition,
  type VisualStyleFilter,
  type ResolvedVisualStyle,
  computeSkeuomorphicStyle,
  type SkeuomorphicMaterial,
  type SkeuomorphicStyleOptions,
  type SkeuomorphicStyleResult,
  computeNeumorphicStyle,
  type NeumorphicShape,
  type NeumorphicLightSource,
  type NeumorphicStyleOptions,
  type NeumorphicStyleResult,
  computeArtNouveauStyle,
  type ArtNouveauVariant,
  type ArtNouveauStyleOptions,
  type ArtNouveauStyleResult,
  ART_NOUVEAU_WHIPLASH_PATH,
  ART_NOUVEAU_CORNER_PATH,
  ART_NOUVEAU_DIVIDER_PATH,
  getStyleMotionConfig,
  type StyleMotionConfig,
  computeLiquidChromeStyle,
  type LiquidChromeVariant,
  type LiquidChromeStyleOptions,
  type LiquidChromeStyleResult,
  computeDeStijlStyle,
  type DeStijlVariant,
  type DeStijlStyleOptions,
  type DeStijlStyleResult,
  computeMemphisStyle,
  type MemphisVariant,
  type MemphisPatternType,
  type MemphisStyleOptions,
  type MemphisStyleResult,
  MEMPHIS_SQUIGGLE_PATH,
  MEMPHIS_ZIGZAG_PATH,
  MEMPHIS_TRIANGLE_PATH,
  MEMPHIS_CIRCLE_PATH,
  computePsychedelicStyle,
  type PsychedelicVariant,
  type PsychedelicStyleOptions,
  type PsychedelicStyleResult,
  computeVaporwaveStyle,
  type VaporwaveVariant,
  type VaporwaveStyleOptions,
  type VaporwaveStyleResult,
  computeSteampunkStyle,
  type SteampunkVariant,
  type SteampunkStyleOptions,
  type SteampunkStyleResult,
  PSYCHEDELIC_WAVE_PATH,
  PSYCHEDELIC_FLOWER_PATH,
  VAPORWAVE_SUNSET_PATH,
  VAPORWAVE_GRID_PATH,
  STEAMPUNK_GEAR_PATH,
  STEAMPUNK_BRACKET_PATH,
  computeGrungeStyle,
  type GrungeVariant,
  type GrungeStyleOptions,
  type GrungeStyleResult,
  computePaperCutoutStyle,
  type PaperCutoutVariant,
  type PaperCutoutStyleOptions,
  type PaperCutoutStyleResult,
  computeGlitchStyle,
  type GlitchVariant,
  type GlitchStyleOptions,
  type GlitchStyleResult,
  GRUNGE_TAPE_PATH,
  GRUNGE_SPLATTER_PATH,
  GRUNGE_SCRATCH_PATH,
  PAPER_CUTOUT_WAVE_PATH,
  PAPER_FOLDED_CORNER_PATH,
  PAPER_PERFORATION_PATH,
  GLITCH_CROSSHAIR_PATH,
  GLITCH_BARCODE_PATH,
  GLITCH_CORNER_TECH_PATH,
  computeAntiDesignStyle,
  type AntiDesignVariant,
  type AntiDesignStyleOptions,
  type AntiDesignStyleResult,
  compute3DInflatedStyle,
  type Inflated3DVariant,
  type Inflated3DStyleOptions,
  type Inflated3DStyleResult,
  computeIsometricStyle,
  type IsometricVariant,
  type IsometricStyleOptions,
  type IsometricStyleResult,
  ANTI_DESIGN_STRIPES_PATH,
  ANTI_DESIGN_CROSS_PATH,
  ANTI_DESIGN_BURST_PATH,
  INFLATED_3D_BUBBLE_PATH,
  INFLATED_3D_PILL_PATH,
  INFLATED_3D_CLOUD_PATH,
  ISOMETRIC_CUBE_PATH,
  ISOMETRIC_GRID_PATH,
  ISOMETRIC_PYRAMID_PATH,
  computeUkiyoeStyle,
  type UkiyoeVariant,
  type UkiyoeStyleOptions,
  type UkiyoeStyleResult,
  computeBrutalistStyle,
  type BrutalistVariant,
  type BrutalistStyleOptions,
  type BrutalistStyleResult,
  computeBauhausStyle,
  type BauhausVariant,
  type BauhausStyleOptions,
  type BauhausStyleResult,
  computeMidCenturyModernStyle,
  type MidCenturyModernVariant,
  type MidCenturyModernStyleOptions,
  type MidCenturyModernStyleResult,
  UKIYOE_WAVE_PATH,
  UKIYOE_CLOUD_PATH,
  UKIYOE_HANKO_PATH,
  BRUTALIST_CROSSHAIR_PATH,
  BRUTALIST_CORNER_PATH,
  BRUTALIST_ARROW_PATH,
  BAUHAUS_TRIANGLE_PATH,
  BAUHAUS_CIRCLE_PATH,
  BAUHAUS_SQUARE_PATH,
  MCM_SUNBURST_PATH,
  MCM_BOOMERANG_PATH,
  MCM_KIDNEY_PATH,
  createGraphicsEngine,
  detectGraphicsCapabilities,
  DEFAULT_FALLBACK_CAPABILITIES,
  type GraphicsCapabilities,
  type GraphicsEffect,
  type GraphicsEngine,
  type GraphicsEngineOptions,
  type RendererOptions,
  type CapabilityDetectionOptions,
  getMaterialPreset,
  getLightingPreset,
  getGlassPreset,
  resolveLighting,
  computeSurfaceStyle,
  computeGlassStyle,
  isBackdropFilterSupported,
  MATTE_MATERIAL,
  STUDIO_LIGHTING,
  FROSTED_GLASS_PRESET,
  type MaterialType,
  type MaterialUniforms,
  type MaterialProperty,
  type SurfaceBorderOptions,
  type SurfaceHighlightOptions,
  type SurfaceDefinition,
  type SurfaceStyleResult,
  type AmbientLight,
  type DirectionalLight,
  type PointLight,
  type HighlightConfig,
  type ShadowConfig,
  type EnvironmentLighting,
  type LightingConfig,
  type ResolvedLighting,
  type MaterialDefinition,
  type GlassPresetName,
  type GlassMaterialOptions,
  type GlassStyleResult,
  type ComputeSurfaceOptions,
  generateProceduralTexture,
  listTextureGenerators,
  getTextureGeneratorMetadata,
  applyTextureToSurface,
  type TextureGeneratorName,
  type TextureQuality,
  type TextureBlendMode,
  type TextureRepeatMode,
  type WebGLTextureDescriptor,
  type ProceduralTextureOptions,
  type ProceduralTextureConfig,
  type GeneratedTexture,
  type TextureCacheStats,
  type TextureMappingOptions,
  type TextureGeneratorMetadata,
  type GenerateTextureExecutionOptions,
  createDistortionEffect,
  createFluidEffect,
  createParticleEffect,
  createAdvancedEffect,
  composeGraphicsEffects,
  type DistortionType,
  type DistortionOptions,
  type FluidType,
  type FluidOptions,
  type ParticleShape,
  type ParticleOrigin,
  type ParticleEmitterOptions,
  type ParticleOptions,
  type ParticleState,
  type AdvancedEffectType,
  type AdvancedEffectOptions,
  type ComposedGraphicsEffect,
  createGraphicsComposition,
  resolveGraphicsFallback,
  resolveQualityProfile,
  type GraphicsQualityLevel,
  type GraphicsQualityProfile,
  type GraphicsFallbackDecision,
  type GraphicsLayerType,
  type GraphicsLayer,
  type GraphicsCompositionDefinition,
  type GraphicsPerformanceStats,
  type GraphicsCompositionInstance,
  type CreateCompositionOptions,
  type ResolveFallbackOptions,
} from "./catalogue.js";

export type UseAnimateCallback = (
  properties: AnimatableProperties,
  options?: DOMAnimationOptions,
) => AnimationControls | null;

export interface UseAnimateResult<T extends HTMLElement | SVGElement = HTMLElement> {
  ref: RefObject<T | null>;
  animate: UseAnimateCallback;
}

export interface UseInViewOptions extends InViewOptions {
  /** Explicit target element, selector, or RefObject. Takes precedence over the returned ref. */
  target?: ReactAnimateTarget;
  /** Whether to update reactive state on enter/leave. Set false to disable React re-renders. Defaults to true. */
  reactive?: boolean;
  /** Called when the observed element enters the viewport region. May return an exit cleanup function. */
  onEnter?: (element: HTMLElement, entry: IntersectionObserverEntry) => void | (() => void);
  /** Called when the observed element leaves the viewport region. */
  onLeave?: (element: HTMLElement, entry: IntersectionObserverEntry) => void;
  /** Called whenever in-view status changes. */
  onChange?: (isInView: boolean, element: HTMLElement, entry: IntersectionObserverEntry) => void;
}

export interface UseInViewResult<T extends HTMLElement | SVGElement = HTMLElement> {
  ref: RefObject<T | null>;
  isInView: boolean;
}

export interface UseScrollProgressResult<T extends HTMLElement | SVGElement = HTMLElement> {
  ref: RefObject<T | null>;
  progress: number;
  /** Returns the latest measured scroll progress imperatively without waiting for a React re-render. */
  getProgress: () => number;
}

export type UseScrollProgressOptions = Omit<ScrollProgressOptions, "target"> & {
  /** Track page scrolling explicitly, an element, a selector, or a RefObject. */
  target?: ReactAnimateTarget | "window";
  /** Whether to trigger React component re-renders when progress updates. Defaults to true. */
  reactive?: boolean;
};

export interface UseScrollVelocityResult<T extends HTMLElement | SVGElement = HTMLElement> {
  ref: RefObject<T | null>;
  data: ScrollVelocityData;
  /** Returns the latest measured scroll velocity data imperatively without waiting for a React re-render. */
  getData: () => ScrollVelocityData;
}

export type UseScrollVelocityOptions = Omit<ScrollVelocityOptions, "onUpdate" | "target"> & {
  /** Track page scrolling explicitly, an element, a selector, or a RefObject. */
  target?: ScrollVelocityOptions["target"] | "window" | RefObject<HTMLElement | SVGElement | null>;
  onUpdate?: ScrollVelocityOptions["onUpdate"];
  /** Whether to trigger React component re-renders when scroll data updates. Defaults to true. */
  reactive?: boolean;
};

const INITIAL_SCROLL_VELOCITY: ScrollVelocityData = {
  velocity: 0,
  direction: "idle",
  position: 0,
  progress: 0,
};

export type RevealDirection = "up" | "down" | "left" | "right";

export interface RevealProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children?: ReactNode;
  direction?: RevealDirection;
  /** Custom properties to animate, overriding direction defaults. */
  properties?: AnimatableProperties;
  duration?: number;
  delay?: number;
  easing?: EasingFunction;
  /** IntersectionObserver threshold (0..1 or a list). Defaults to 0.15. */
  threshold?: number | number[];
  /** IntersectionObserver rootMargin. Defaults to "0px". */
  rootMargin?: string;
  once?: boolean;
}

export interface AnimatedTextBaseProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  text: string;
}

export type AnimatedTextProps = AnimatedTextBaseProps & (
  | {
    effect: "typewriter";
    effectOptions?: Omit<TypewriterOptions, "phrases">;
  }
  | {
    effect: "scramble";
    effectOptions?: TextScrambleOptions;
  }
  | {
    effect: "gradient";
    effectOptions?: GradientTextOptions;
  }
);

const REVEAL_PROPERTIES: Record<RevealDirection, AnimatableProperties> = {
  up: { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
  down: { opacity: [0, 1], transform: ["translateY(-24px)", "translateY(0px)"] },
  left: { opacity: [0, 1], transform: ["translateX(24px)", "translateX(0px)"] },
  right: { opacity: [0, 1], transform: ["translateX(-24px)", "translateX(0px)"] },
};

function validateFunction(name: string, value: unknown): void {
  if (value !== undefined && typeof value !== "function") {
    throw new TypeError(`${name} must be a function`);
  }
}

function validateObject(name: string, value: unknown): void {
  if (value !== undefined && (typeof value !== "object" || value === null || Array.isArray(value))) {
    throw new TypeError(`${name} must be an object`);
  }
}

function validatePlaybackRate(rate: number): void {
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new RangeError(`playbackRate must be a finite number > 0, received ${String(rate)}`);
  }
}

function validateSeekTime(timeMs: number): void {
  if (typeof timeMs !== "number" || !Number.isFinite(timeMs) || timeMs < 0) {
    throw new RangeError(`Timeline seek time must be a finite number >= 0, received ${String(timeMs)}`);
  }
}

function validateNonNegative(name: string, value: number | undefined): void {
  if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

const VALID_REVEAL_DIRECTIONS = /* @__PURE__ */ new Set<string>(["up", "down", "left", "right"]);
function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === "function") {
    if (node === null) {
      try {
        ref(null);
      } catch {
        // Prevent ref release exceptions from aborting unmount cleanup
      }
    } else {
      ref(node);
    }
  } else if (ref && typeof ref === "object" && "current" in ref) {
    (ref as { current: T | null }).current = node;
  }
}

function resolveTargetElement(
  target: ReactAnimateTarget | Window | "window" | undefined,
): AnimateTarget | Window | "window" | undefined {
  if (target === "window" || (typeof Window !== "undefined" && target instanceof Window)) return "window";
  if (target && typeof target === "object" && "current" in target) {
    return ((target as RefObject<HTMLElement | SVGElement | null>).current as AnimateTarget | null) ?? undefined;
  }
  return target;
}

function shallowEqualObjects(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const valA = a[key];
    const valB = b[key];
    if (Array.isArray(valA) && Array.isArray(valB)) {
      if (valA.length !== valB.length || !valA.every((v, i) => v === valB[i])) return false;
    } else if (valA !== valB) {
      return false;
    }
  }
  return true;
}

/**
 * Returns a DOM ref and an imperative animation function scoped to its element.
 * The returned function yields null until the ref points to an element.
 */
export function useAnimate<T extends HTMLElement | SVGElement = HTMLElement>(): UseAnimateResult<T> {
  const ref = useRef<T | null>(null);
  const activeControls = useRef(new Set<AnimationControls>());
  const isMountedRef = useRef(true);

  const animate = useCallback<UseAnimateCallback>((properties, options) => {
    if (options !== undefined) {
      validateObject("options", options);
      validateFunction("onComplete", options.onComplete);
      validateFunction("onCancel", options.onCancel);
    }
    if (!isMountedRef.current) return null;
    const element = ref.current;
    if (!element) return null;

    let controls: AnimationControls | undefined;
    let hasFinished = false;
    const removeControls = (): void => {
      if (controls) activeControls.current.delete(controls);
      else hasFinished = true;
    };

    const result = animateElement(element, properties, {
      ...options,
      onComplete: () => {
        try {
          if (isMountedRef.current) {
            options?.onComplete?.();
          }
        } finally {
          removeControls();
        }
      },
      onCancel: () => {
        try {
          options?.onCancel?.();
        } finally {
          removeControls();
        }
      },
    });
    controls = result;
    if (!hasFinished) activeControls.current.add(result);
    return result;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      const controls = Array.from(activeControls.current);
      activeControls.current.clear();
      const errors: unknown[] = [];
      for (const control of controls) {
        try {
          control.cancel();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length > 0) throw errors[0];
    };
  }, []);

  return { ref, animate };
}

/**
 * Tracks whether the referenced element is in view. Observation starts after mount
 * and is recreated when observer options change.
 */
export function useInView<T extends HTMLElement | SVGElement = HTMLElement>(
  options: UseInViewOptions = {},
): UseInViewResult<T> {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);
  validateObject("options", options);
  const {
    rootMargin,
    threshold,
    once,
    target,
    reactive = true,
    onEnter,
    onLeave,
    onChange,
  } = options;
  validateFunction("onEnter", onEnter);
  validateFunction("onLeave", onLeave);
  validateFunction("onChange", onChange);

  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const prevThresholdRef = useRef(threshold);
  let stableThreshold = threshold;
  if (
    Array.isArray(threshold) &&
    Array.isArray(prevThresholdRef.current) &&
    threshold.length === prevThresholdRef.current.length &&
    threshold.every((val, i) => val === (prevThresholdRef.current as number[])[i])
  ) {
    stableThreshold = prevThresholdRef.current;
  } else {
    prevThresholdRef.current = threshold;
  }

  const resolvedTarget = resolveTargetElement(target);

  useEffect(() => {
    if (reactive) setIsInView(false);
    const element = (resolvedTarget ?? ref.current) as AnimateTarget | null;
    if (!element) return;

    let active = true;
    let enterCleanup: void | (() => void);

    const controls = inView(
      element,
      (el, entry) => {
        if (!active) return;
        if (reactive) setIsInView(true);
        try {
          onChangeRef.current?.(true, el, entry);
        } finally {
          enterCleanup = onEnterRef.current?.(el, entry);
        }
        return () => {
          let enterError: unknown;
          if (typeof enterCleanup === "function") {
            try {
              enterCleanup();
            } catch (err) {
              enterError = err;
            } finally {
              enterCleanup = undefined;
            }
          }
          if (active) {
            if (reactive) setIsInView(false);
            try {
              onChangeRef.current?.(false, el, entry);
            } finally {
              try {
                onLeaveRef.current?.(el, entry);
              } catch (err) {
                if (!enterError) enterError = err;
              }
            }
          }
          if (enterError) throw enterError;
        };
      },
      { rootMargin, threshold: stableThreshold, once },
    );

    return () => {
      active = false;
      try {
        controls.destroy();
      } finally {
        if (typeof enterCleanup === "function") {
          try {
            enterCleanup();
          } finally {
            enterCleanup = undefined;
          }
        }
      }
    };
  }, [rootMargin, stableThreshold, once, resolvedTarget, reactive]);

  return { ref, isInView };
}

/**
 * Tracks normalized page scroll progress, or the progress of a referenced
 * scroll container. An explicit `target` takes precedence over the returned ref.
 */
export function useScrollProgress<T extends HTMLElement | SVGElement = HTMLElement>(
  options: UseScrollProgressOptions = {},
): UseScrollProgressResult<T> {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  validateObject("options", options);
  const {
    position,
    color,
    height,
    smoothing,
    easing,
    target,
    onUpdate,
    reactive = true,
  } = options;
  validateFunction("onUpdate", onUpdate);
  if (height !== undefined && (typeof height !== "number" || !Number.isFinite(height) || height <= 0)) {
    throw new RangeError(`height must be a finite number > 0, received ${String(height)}`);
  }
  if (smoothing !== undefined && (typeof smoothing !== "number" || !Number.isFinite(smoothing) || smoothing < 0 || smoothing > 1)) {
    throw new RangeError(`smoothing must be a finite number between 0 and 1, received ${String(smoothing)}`);
  }

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const resolvedTarget = resolveTargetElement(target);

  const getProgress = useCallback(() => progressRef.current, []);

  useEffect(() => {
    if (reactive) setProgress(0);
    progressRef.current = 0;
    let active = true;

    const scrollTarget = target === "window"
      ? undefined
      : (resolvedTarget as AnimateTarget | undefined ?? ref.current ?? undefined);

    const controls = scrollProgress({
      position,
      color,
      height,
      smoothing,
      easing,
      target: scrollTarget,
      onUpdate: (value) => {
        progressRef.current = value;
        if (active && reactive) setProgress(value);
        if (active) onUpdateRef.current?.(value);
      },
    });

    return () => {
      active = false;
      controls.destroy();
    };
  }, [position, color, height, smoothing, easing, resolvedTarget, reactive]);

  return { ref, progress, getProgress };
}

/**
 * Tracks scroll velocity, direction, position, and normalized progress for the
 * page or a referenced scroll container.
 */
export function useScrollVelocity<T extends HTMLElement | SVGElement = HTMLElement>(
  options: UseScrollVelocityOptions = {},
): UseScrollVelocityResult<T> {
  const ref = useRef<T | null>(null);
  const [data, setData] = useState(INITIAL_SCROLL_VELOCITY);
  const dataRef = useRef(INITIAL_SCROLL_VELOCITY);
  validateObject("options", options);
  const { smoothing, target, onUpdate, reactive = true } = options;
  validateFunction("onUpdate", onUpdate);
  if (smoothing !== undefined && (typeof smoothing !== "number" || !Number.isFinite(smoothing) || smoothing < 0 || smoothing > 1)) {
    throw new RangeError(`smoothing must be a finite number between 0 and 1, received ${String(smoothing)}`);
  }

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const resolvedTarget = resolveTargetElement(target);

  const getData = useCallback(() => dataRef.current, []);

  useEffect(() => {
    if (reactive) setData(INITIAL_SCROLL_VELOCITY);
    dataRef.current = INITIAL_SCROLL_VELOCITY;
    let active = true;

    const scrollTarget = target === "window"
      ? undefined
      : (resolvedTarget as AnimateTarget | Window | undefined ?? ref.current ?? undefined);

    const controls = scrollVelocity({
      smoothing,
      target: scrollTarget,
      onUpdate: (nextData) => {
        dataRef.current = nextData;
        if (active && reactive) setData(nextData);
        if (active) onUpdateRef.current?.(nextData);
      },
    });

    return () => {
      active = false;
      controls.destroy();
    };
  }, [smoothing, resolvedTarget, reactive]);

  return { ref, data, getData };
}

/**
 * Renders children in a visible div, then reveals it when it enters the viewport.
 * Without client-side JavaScript, the children remain normally visible.
 */
export const Reveal = /* @__PURE__ */ forwardRef<HTMLDivElement, RevealProps>(
  function Reveal(
    {
      children,
      direction = "up",
      properties,
      duration = 600,
      delay,
      easing,
      threshold,
      rootMargin,
      once = true,
      ...divProps
    },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLDivElement | null>(null);

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef],
    );

    if (direction !== undefined && !VALID_REVEAL_DIRECTIONS.has(direction)) {
      throw new TypeError(`direction must be "up", "down", "left", or "right", received ${String(direction)}`);
    }
    validateNonNegative("duration", duration);
    validateNonNegative("delay", delay);

    const prevThresholdRef = useRef(threshold);
    let stableThreshold = threshold;
    if (
      Array.isArray(threshold) &&
      Array.isArray(prevThresholdRef.current) &&
      threshold.length === prevThresholdRef.current.length &&
      threshold.every((val, i) => val === (prevThresholdRef.current as number[])[i])
    ) {
      stableThreshold = prevThresholdRef.current;
    } else {
      prevThresholdRef.current = threshold;
    }

    const prevPropsRef = useRef(properties);
    let stableProperties = properties;
    if (shallowEqualObjects(
      prevPropsRef.current as Record<string, unknown> | undefined,
      properties as Record<string, unknown> | undefined,
    )) {
      stableProperties = prevPropsRef.current;
    } else {
      prevPropsRef.current = properties;
    }

    useEffect(() => {
      const element = internalRef.current;
      if (!element) return;
      const controls = reveal(element, {
        properties: stableProperties ?? REVEAL_PROPERTIES[direction],
        duration,
        delay,
        easing,
        threshold: stableThreshold,
        rootMargin,
        once,
      });
      return () => controls.destroy();
    }, [direction, stableProperties, duration, delay, easing, stableThreshold, rootMargin, once]);

    return createElement("div", { ...divProps, ref: setRef }, children);
  },
);

/**
 * Renders accessible static text while applying the selected visual text effect
 * to a separate, aria-hidden copy.
 */
export const AnimatedText = /* @__PURE__ */ forwardRef<HTMLSpanElement, AnimatedTextProps>(
  function AnimatedText({ text, effect, effectOptions, ...spanProps }, forwardedRef) {
    if (typeof text !== "string") {
      throw new TypeError(`text must be a string, received ${typeof text}`);
    }
    if (effect !== "typewriter" && effect !== "scramble" && effect !== "gradient") {
      throw new TypeError(`effect must be "typewriter", "scramble", or "gradient", received ${String(effect)}`);
    }
    validateObject("effectOptions", effectOptions);

    const ref = useRef<HTMLSpanElement | null>(null);

    const prevOptionsRef = useRef(effectOptions);
    let stableOptions = effectOptions;
    if (shallowEqualObjects(
      prevOptionsRef.current as Record<string, unknown> | undefined,
      effectOptions as Record<string, unknown> | undefined,
    )) {
      stableOptions = prevOptionsRef.current;
    } else {
      prevOptionsRef.current = effectOptions;
    }

    useEffect(() => {
      const element = ref.current;
      if (!element) return;

      switch (effect) {
        case "typewriter":
          return typewriter(element, {
            ...stableOptions,
            phrases: [text],
            loop: (stableOptions as Omit<TypewriterOptions, "phrases"> | undefined)?.loop ?? false,
            cursor: (stableOptions as Omit<TypewriterOptions, "phrases"> | undefined)?.cursor ?? "",
          }).destroy;
        case "scramble":
          return textScramble(element, stableOptions as TextScrambleOptions | undefined).destroy;
        case "gradient":
          return gradientText(element, stableOptions as GradientTextOptions | undefined).destroy;
      }
    }, [text, effect, stableOptions]);

    return createElement(
      "span",
      { ...spanProps, ref: forwardedRef, "aria-label": text },
      createElement("span", { ref, "aria-hidden": true }, text),
    );
  },
);

export type ReactAnimateTarget = AnimateTarget | RefObject<HTMLElement | SVGElement | null>;

export interface UseSequenceStep extends Omit<AnimationSequenceStep, "target"> {
  target: ReactAnimateTarget;
}

export interface UseSequenceOptions extends AnimationSequenceOptions {
  /** Whether to play the sequence automatically on mount. Defaults to true if steps are provided. */
  autoplay?: boolean;
}

export interface UseSequenceResult {
  /** Starts playback of the sequence, optionally overriding steps or options. */
  play: (steps?: readonly UseSequenceStep[], options?: AnimationSequenceOptions) => AnimationSequenceControls | null;
  /** Pauses the active sequence. */
  pause: () => void;
  /** Resumes the paused sequence. */
  resume: () => void;
  /** Reverses the active sequence step. */
  reverse: () => void;
  /** Cancels active animations and aborts the sequence. Safe to repeat. */
  cancel: () => void;
  /** Sets the playback rate. */
  setPlaybackRate: (rate: number) => void;
  /** Gets the playback rate. */
  getPlaybackRate: () => number;
  /** Promise that resolves when current sequence finishes, or null if idle. */
  finished: Promise<void> | null;
  /** Ref to the active sequence controls. */
  controlsRef: RefObject<AnimationSequenceControls | null>;
  /** The current active sequence controls instance, or null if not yet constructed. */
  sequence: AnimationSequenceControls | null;
}

export interface UseParallelStep extends Omit<AnimationParallelStep, "target"> {
  target: ReactAnimateTarget;
}

export interface UseParallelOptions extends AnimationParallelOptions {
  /** Whether to play the parallel animations automatically on mount. Defaults to true if steps are provided. */
  autoplay?: boolean;
}

export interface UseParallelResult {
  /** Starts playback of the parallel animations, optionally overriding steps or options. */
  play: (steps?: readonly UseParallelStep[], options?: AnimationParallelOptions) => AnimationParallelControls | null;
  /** Pauses the active parallel animations. */
  pause: () => void;
  /** Resumes the paused parallel animations. */
  resume: () => void;
  /** Reverses active animations. */
  reverse: () => void;
  /** Cancels active animations and aborts the group. Safe to repeat. */
  cancel: () => void;
  /** Sets the playback rate. */
  setPlaybackRate: (rate: number) => void;
  /** Gets the playback rate. */
  getPlaybackRate: () => number;
  /** Promise that resolves when current parallel group finishes, or null if idle. */
  finished: Promise<void> | null;
  /** Ref to the active parallel controls. */
  controlsRef: RefObject<AnimationParallelControls | null>;
  /** The current active parallel controls instance, or null if not yet constructed. */
  parallel: AnimationParallelControls | null;
}

export interface UseTimelineStep extends Omit<AnimationTimelineStep, "target"> {
  target: ReactAnimateTarget;
}

export interface ReactAnimationTimelineControls extends Omit<AnimationTimelineControls, "add"> {
  /** Adds a step at an explicit or relative timeline position. Steps may use RefObject targets. */
  add(step: UseTimelineStep): ReactAnimationTimelineControls;
  addTimeline(timeline: AnimationTimelineControls, at: AnimationTimelinePosition): ReactAnimationTimelineControls;
  addLabel(name: string, at: number): ReactAnimationTimelineControls;
}

export type TimelineBuilder = (timeline: ReactAnimationTimelineControls) => void;

export interface UseTimelineOptions {
  /** Whether to play the timeline automatically once configured on mount. Defaults to true if a builder is provided. */
  autoplay?: boolean;
  /** Called when the timeline completes. */
  onComplete?: () => void;
  /** Called if the timeline is cancelled. */
  onCancel?: () => void;
}

export interface UseTimelineResult {
  /** Plays the active timeline from the current position. */
  play: () => void;
  /** Pauses the active timeline. */
  pause: () => void;
  /** Resumes the paused timeline. */
  resume: () => void;
  /** Moves playhead to the given millisecond timestamp. */
  seek: (timeMs: number) => void;
  /** Restarts the timeline from time 0. */
  restart: () => void;
  /** Cancels active animations in the timeline. Safe to repeat. */
  cancel: () => void;
  /** Sets the playback rate. */
  setPlaybackRate: (rate: number) => void;
  /** Gets the playback rate. */
  getPlaybackRate: () => number;
  /** Promise that resolves when current timeline finishes, or null if idle. */
  finished: Promise<void> | null;
  /** The current active timeline controls instance, or null if not yet constructed. */
  timeline: ReactAnimationTimelineControls | null;
  /** Ref to the active timeline controls. */
  controlsRef: RefObject<ReactAnimationTimelineControls | null>;
}

function areStepsEqual(
  prev: readonly (UseSequenceStep | UseParallelStep)[] | undefined,
  next: readonly (UseSequenceStep | UseParallelStep)[] | undefined,
): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const n = next[i];
    if (p.target !== n.target) {
      const targetP = resolveTargetElement(p.target);
      const targetN = resolveTargetElement(n.target);
      if (targetP !== targetN) return false;
    }
    if (!shallowEqualObjects(p.properties as Record<string, unknown> | undefined, n.properties as Record<string, unknown> | undefined)) return false;
    if (!shallowEqualObjects(p.options as Record<string, unknown> | undefined, n.options as Record<string, unknown> | undefined)) return false;
  }
  return true;
}

/**
 * Creates and coordinates a sequential series of animations across one or more targets.
 * Automatically cleans up on unmount and prevents duplicate execution in Strict Mode.
 */
export function useSequence(
  steps?: readonly UseSequenceStep[],
  options: UseSequenceOptions = {},
): UseSequenceResult {
  if (steps !== undefined && !Array.isArray(steps)) {
    throw new TypeError("steps must be an array");
  }
  validateObject("options", options);
  const { autoplay = true, onStart, onComplete, onCancel } = options;
  validateFunction("onStart", onStart);
  validateFunction("onComplete", onComplete);
  validateFunction("onCancel", onCancel);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const isMountedRef = useRef(true);

  const prevStepsRef = useRef(steps);
  let stableSteps = steps;
  if (areStepsEqual(prevStepsRef.current, steps)) {
    stableSteps = prevStepsRef.current;
  } else {
    prevStepsRef.current = steps;
  }

  const controlsRef = useRef<AnimationSequenceControls | null>(null);

  const play = useCallback((
    overrideSteps?: readonly UseSequenceStep[],
    overrideOptions?: AnimationSequenceOptions,
  ): AnimationSequenceControls | null => {
    if (overrideSteps !== undefined && !Array.isArray(overrideSteps)) {
      throw new TypeError("steps must be an array");
    }
    if (overrideOptions !== undefined) {
      validateObject("options", overrideOptions);
      validateFunction("onStart", overrideOptions.onStart);
      validateFunction("onComplete", overrideOptions.onComplete);
      validateFunction("onCancel", overrideOptions.onCancel);
    }
    if (!isMountedRef.current) return null;
    const stepsToRun = overrideSteps ?? stableSteps;
    if (!stepsToRun || stepsToRun.length === 0) return null;

    controlsRef.current?.cancel();
    controlsRef.current = null;

    const resolvedSteps: AnimationSequenceStep[] = stepsToRun.map((step) => {
      const target = (resolveTargetElement(step.target) ?? step.target) as AnimateTarget;
      return { ...step, target };
    });

    const controls = animateSequence(resolvedSteps, {
      onStart: () => {
        if (!isMountedRef.current) return;
        try {
          overrideOptions?.onStart?.();
        } finally {
          onStartRef.current?.();
        }
      },
      onComplete: () => {
        if (!isMountedRef.current) return;
        try {
          overrideOptions?.onComplete?.();
        } finally {
          onCompleteRef.current?.();
        }
      },
      onCancel: () => {
        try {
          overrideOptions?.onCancel?.();
        } finally {
          onCancelRef.current?.();
        }
      },
    });

    controlsRef.current = controls;

    controls.finished.catch((error) => {
      if (error?.name !== "AbortError") {
        // preserve non-abort errors
      }
    });

    return controls;
  }, [stableSteps]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!stableSteps || stableSteps.length === 0) return;
    if (!autoplay) return;

    const hasUnmountedRef = stableSteps.some(
      (s) => s.target && typeof s.target === "object" && "current" in s.target && (s.target as RefObject<HTMLElement | null>).current === null,
    );
    if (hasUnmountedRef) return;

    const controls = play();
    return () => {
      controls?.cancel();
    };
  }, [play, stableSteps, autoplay]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controlsRef.current?.cancel();
    };
  }, []);

  const pause = useCallback(() => controlsRef.current?.pause(), []);
  const resume = useCallback(() => controlsRef.current?.resume(), []);
  const reverse = useCallback(() => controlsRef.current?.reverse(), []);
  const cancel = useCallback(() => controlsRef.current?.cancel(), []);
  const setPlaybackRate = useCallback((rate: number) => {
    validatePlaybackRate(rate);
    controlsRef.current?.setPlaybackRate(rate);
  }, []);
  const getPlaybackRate = useCallback(() => controlsRef.current?.getPlaybackRate() ?? 1, []);

  return {
    play,
    pause,
    resume,
    reverse,
    cancel,
    setPlaybackRate,
    getPlaybackRate,
    get finished() {
      return controlsRef.current?.finished ?? null;
    },
    controlsRef,
    get sequence() {
      return controlsRef.current;
    },
  };
}

/**
 * Creates and coordinates parallel animations running simultaneously across targets.
 * Automatically cleans up on unmount and prevents duplicate execution in Strict Mode.
 */
export function useParallel(
  steps?: readonly UseParallelStep[],
  options: UseParallelOptions = {},
): UseParallelResult {
  if (steps !== undefined && !Array.isArray(steps)) {
    throw new TypeError("steps must be an array");
  }
  validateObject("options", options);
  const { autoplay = true, onStart, onComplete, onCancel } = options;
  validateFunction("onStart", onStart);
  validateFunction("onComplete", onComplete);
  validateFunction("onCancel", onCancel);
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const isMountedRef = useRef(true);

  const prevStepsRef = useRef(steps);
  let stableSteps = steps;
  if (areStepsEqual(prevStepsRef.current, steps)) {
    stableSteps = prevStepsRef.current;
  } else {
    prevStepsRef.current = steps;
  }

  const controlsRef = useRef<AnimationParallelControls | null>(null);

  const play = useCallback((
    overrideSteps?: readonly UseParallelStep[],
    overrideOptions?: AnimationParallelOptions,
  ): AnimationParallelControls | null => {
    if (overrideSteps !== undefined && !Array.isArray(overrideSteps)) {
      throw new TypeError("steps must be an array");
    }
    if (overrideOptions !== undefined) {
      validateObject("options", overrideOptions);
      validateFunction("onStart", overrideOptions.onStart);
      validateFunction("onComplete", overrideOptions.onComplete);
      validateFunction("onCancel", overrideOptions.onCancel);
    }
    if (!isMountedRef.current) return null;
    const stepsToRun = overrideSteps ?? stableSteps;
    if (!stepsToRun || stepsToRun.length === 0) return null;

    controlsRef.current?.cancel();
    controlsRef.current = null;

    const resolvedSteps: AnimationParallelStep[] = stepsToRun.map((step) => {
      const target = (resolveTargetElement(step.target) ?? step.target) as AnimateTarget;
      return { ...step, target };
    });

    const controls = animateParallel(resolvedSteps, {
      onStart: () => {
        if (!isMountedRef.current) return;
        try {
          overrideOptions?.onStart?.();
        } finally {
          onStartRef.current?.();
        }
      },
      onComplete: () => {
        if (!isMountedRef.current) return;
        try {
          overrideOptions?.onComplete?.();
        } finally {
          onCompleteRef.current?.();
        }
      },
      onCancel: () => {
        try {
          overrideOptions?.onCancel?.();
        } finally {
          onCancelRef.current?.();
        }
      },
    });

    controlsRef.current = controls;

    controls.finished.catch((error) => {
      if (error?.name !== "AbortError") {
        // preserve non-abort errors
      }
    });

    return controls;
  }, [stableSteps]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!stableSteps || stableSteps.length === 0) return;
    if (!autoplay) return;

    const hasUnmountedRef = stableSteps.some(
      (s) => s.target && typeof s.target === "object" && "current" in s.target && (s.target as RefObject<HTMLElement | null>).current === null,
    );
    if (hasUnmountedRef) return;

    const controls = play();
    return () => {
      controls?.cancel();
    };
  }, [play, stableSteps, autoplay]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controlsRef.current?.cancel();
    };
  }, []);

  const pause = useCallback(() => controlsRef.current?.pause(), []);
  const resume = useCallback(() => controlsRef.current?.resume(), []);
  const reverse = useCallback(() => controlsRef.current?.reverse(), []);
  const cancel = useCallback(() => controlsRef.current?.cancel(), []);
  const setPlaybackRate = useCallback((rate: number) => {
    validatePlaybackRate(rate);
    controlsRef.current?.setPlaybackRate(rate);
  }, []);
  const getPlaybackRate = useCallback(() => controlsRef.current?.getPlaybackRate() ?? 1, []);

  return {
    play,
    pause,
    resume,
    reverse,
    cancel,
    setPlaybackRate,
    getPlaybackRate,
    get finished() {
      return controlsRef.current?.finished ?? null;
    },
    controlsRef,
    get parallel() {
      return controlsRef.current;
    },
  };
}

/**
 * Creates and coordinates a timeline with absolute/relative timestamps and labels.
 * Automatically cleans up on unmount and prevents duplicate execution in Strict Mode.
 */
export function useTimeline(
  builder?: TimelineBuilder,
  options: UseTimelineOptions = {},
): UseTimelineResult {
  validateFunction("builder", builder);
  validateObject("options", options);
  const { autoplay = true, onComplete, onCancel } = options;
  validateFunction("onComplete", onComplete);
  validateFunction("onCancel", onCancel);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;
  const builderRef = useRef(builder);
  builderRef.current = builder;

  const isMountedRef = useRef(true);
  const controlsRef = useRef<ReactAnimationTimelineControls | null>(null);

  const initTimeline = useCallback(() => {
    controlsRef.current?.cancel();
    controlsRef.current = null;

    const tl = createTimeline();
    const origAdd = tl.add.bind(tl);
    const reactTl = tl as unknown as ReactAnimationTimelineControls;
    reactTl.add = function (step: UseTimelineStep) {
      const target = (resolveTargetElement(step.target) ?? step.target) as AnimateTarget;
      origAdd({ ...step, target: target as AnimateTarget });
      return reactTl;
    };

    let isCancelled = false;
    const origCancel = tl.cancel.bind(tl);
    tl.cancel = function () {
      if (isCancelled) return;
      isCancelled = true;
      origCancel();
      onCancelRef.current?.();
    };

    builderRef.current?.(reactTl);
    controlsRef.current = reactTl;

    tl.finished.then(
      () => {
        if (isMountedRef.current && !isCancelled) {
          onCompleteRef.current?.();
        }
      },
      (error) => {
        if (error?.name === "AbortError") {
          return;
        }
      },
    );

    return tl;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const tl = initTimeline();
    if (autoplay && builderRef.current) {
      tl.play();
    }
    return () => {
      tl.cancel();
    };
  }, [initTimeline, autoplay]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controlsRef.current?.cancel();
    };
  }, []);

  const play = useCallback(() => controlsRef.current?.play(), []);
  const pause = useCallback(() => controlsRef.current?.pause(), []);
  const resume = useCallback(() => controlsRef.current?.resume(), []);
  const seek = useCallback((timeMs: number) => {
    validateSeekTime(timeMs);
    controlsRef.current?.seek(timeMs);
  }, []);
  const restart = useCallback(() => controlsRef.current?.restart(), []);
  const cancel = useCallback(() => controlsRef.current?.cancel(), []);
  const setPlaybackRate = useCallback((rate: number) => {
    validatePlaybackRate(rate);
    controlsRef.current?.setPlaybackRate(rate);
  }, []);
  const getPlaybackRate = useCallback(() => controlsRef.current?.getPlaybackRate() ?? 1, []);

  return {
    play,
    pause,
    resume,
    seek,
    restart,
    cancel,
    setPlaybackRate,
    getPlaybackRate,
    get finished() {
      return controlsRef.current?.finished ?? null;
    },
    get timeline() {
      return controlsRef.current;
    },
    controlsRef,
  };
}
// --- AI Motion Registry React Hooks ---

/**
 * React hook returning the global AI Motion Registry instance.
 * Subscribes to registry changes so consuming components update if custom capabilities are registered/unregistered.
 */
export function useMotionRegistry(): AIMotionRegistry {
  useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );
  return aiMotionRegistry;
}

/**
 * React hook returning capabilities matching an optional filter.
 * Reactive across custom capability registration, unregistration, or reset.
 * Guarantees zero tearing via useSyncExternalStore and SSR-safety.
 */
export function useCapabilities(filter?: CapabilityFilterOptions): readonly AIMotionCapability[] {
  const filterKey = filter ? JSON.stringify(filter) : "";
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  return useMemo(() => {
    return aiMotionRegistry.listCapabilities(filter);
  }, [filterKey, version]);
}

/**
 * React hook returning a single capability by ID.
 * Reactive across registration, unregistration, or updates.
 */
export function useCapability(id: string): AIMotionCapability | undefined {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  return useMemo(() => {
    return aiMotionRegistry.getCapability(id);
  }, [id, version]);
}
/**
 * React hook retrieving the unified schema for a capability ID or schema URI.
 * Reactive across custom capability registrations and updates.
 */
export function useSchema(capabilityIdOrSchemaId: string): UnifiedMotionSchema | undefined {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  return useMemo(() => {
    return aiMotionRegistry.getCapabilitySchema(capabilityIdOrSchemaId) ?? aiMotionRegistry.getSchemaById(capabilityIdOrSchemaId);
  }, [capabilityIdOrSchemaId, version]);
}

/**
 * React hook providing reactive validation of a configuration object against a capability's schema.
 * Re-evaluates when configuration, options, or the registry schema changes.
 */
export function useValidateConfiguration(
  capabilityIdOrSchemaId: string,
  configuration: unknown,
  options?: ConfigurationValidationOptions,
): ConfigurationValidationResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const configKey = useMemo(() => {
    try {
      return JSON.stringify(configuration);
    } catch {
      return String(configuration);
    }
  }, [configuration]);

  const optionsKey = options ? JSON.stringify(options) : "";

  return useMemo(() => {
    const schema = aiMotionRegistry.getCapabilitySchema(capabilityIdOrSchemaId) ?? aiMotionRegistry.getSchemaById(capabilityIdOrSchemaId);
    if (!schema) {
      return {
        valid: false,
        errors: [
          {
            path: "",
            message: `Unknown capability or schema ID: "${capabilityIdOrSchemaId}".`,
            rule: "structure" as const,
            expected: "valid schema",
          },
        ],
      };
    }
    return validateConfiguration(schema, configuration, options);
  }, [capabilityIdOrSchemaId, configKey, optionsKey, version]);
}

/**
 * React hook providing resolved configuration defaults merged with user configuration.
 */
export function useConfigurationDefaults<T = Record<string, unknown>>(
  capabilityIdOrSchemaId: string,
  configuration?: Record<string, unknown>,
): T | undefined {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const configKey = configuration ? JSON.stringify(configuration) : "";

  return useMemo(() => {
    const schema = aiMotionRegistry.getCapabilitySchema(capabilityIdOrSchemaId) ?? aiMotionRegistry.getSchemaById(capabilityIdOrSchemaId);
    if (!schema) return undefined;
    return resolveConfigurationDefaults<T>(schema, configuration);
  }, [capabilityIdOrSchemaId, configKey, version]);
}
/**
 * React hook that interprets a natural-language motion prompt into a structured AF Motion specification.
 * Subscribes to the AI Motion Registry for dynamic updates and returns a memoized interpretation result.
 */
export function useInterpretMotion(
  prompt: string,
  options?: InterpretOptions,
): MotionInterpretationResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const optionsKey = options ? JSON.stringify(options) : "";

  return useMemo(() => {
    return interpretMotionPrompt(prompt, options);
  }, [prompt, optionsKey, version]);
}
export interface UseDesignContextResult {
  readonly context: DesignContext;
  readonly setContext: (
    update: Partial<DesignContext> | ((prev: DesignContext) => Partial<DesignContext>),
  ) => void;
  readonly reset: () => void;
}

/**
 * React hook for managing and updating strongly-typed DesignContext state.
 */
export function useDesignContext(
  initialContext?: Partial<DesignContext>,
): UseDesignContextResult {
  const [context, setContextState] = useState<DesignContext>(() =>
    normalizeDesignContext(initialContext ?? {}),
  );

  const setContext = useCallback(
    (update: Partial<DesignContext> | ((prev: DesignContext) => Partial<DesignContext>)) => {
      setContextState((prev) => {
        const nextPartial = typeof update === "function" ? update(prev) : update;
        return normalizeDesignContext({ ...prev, ...nextPartial });
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setContextState(normalizeDesignContext(initialContext ?? {}));
  }, [initialContext]);

  return useMemo(
    () => ({
      context,
      setContext,
      reset,
    }),
    [context, setContext, reset],
  );
}

/**
 * React hook that interprets a natural-language design brief or partial context into a structured DesignInterpretationResult.
 * Subscribes to the AI Motion Registry for dynamic updates and returns a memoized result.
 */
export function useInterpretDesign(
  input: string | Partial<DesignContext>,
  options?: DesignInterpretationOptions,
): DesignInterpretationResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const inputKey = useMemo(() => {
    if (typeof input === "string") return input;
    try {
      return JSON.stringify(input);
    } catch {
      return String(input);
    }
  }, [input]);

  const optionsKey = options ? JSON.stringify(options) : "";

  return useMemo(() => {
    return interpretDesignRequirements(input, options);
  }, [inputKey, optionsKey, version]);
}
/**
 * React hook that validates a MotionComposition reactively as the registry evolves.
 */
export function useValidateComposition(
  composition: MotionComposition,
  options?: CompositionOptions,
): CompositionValidationResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const compKey = useMemo(() => {
    try {
      return JSON.stringify(composition);
    } catch {
      return composition.id;
    }
  }, [composition]);

  const optionsKey = options ? JSON.stringify(options) : "";

  return useMemo(() => {
    return validateComposition(composition, options);
  }, [compKey, optionsKey, version]);
}

export interface UseCompositionResult {
  readonly composition: MotionComposition;
  readonly result: CompositionResult;
  readonly addNode: (node: CompositionNode, parentId?: string) => void;
  readonly removeNode: (nodeId: string) => void;
  readonly updateNode: (nodeId: string, updates: Partial<CompositionNode>) => void;
  readonly updateComposition: (updater: (prev: MotionComposition) => MotionComposition) => void;
  readonly reset: (newComposition?: MotionComposition) => void;
}

/**
 * React hook for managing, editing, and building a MotionComposition statefully.
 */
export function useComposition(
  initialComposition?: MotionComposition | (() => MotionComposition),
  options?: CompositionOptions,
): UseCompositionResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const [composition, setCompositionState] = useState<MotionComposition>(() => {
    if (typeof initialComposition === "function") {
      return initialComposition();
    }
    return initialComposition ?? createComposition();
  });

  const addNode = useCallback((node: CompositionNode, parentId?: string) => {
    setCompositionState((prev) => addCompositionNode(prev, node, parentId));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setCompositionState((prev) => removeCompositionNode(prev, nodeId));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<CompositionNode>) => {
    setCompositionState((prev) => updateCompositionNode(prev, nodeId, updates));
  }, []);

  const updateComposition = useCallback((updater: (prev: MotionComposition) => MotionComposition) => {
    setCompositionState(updater);
  }, []);

  const reset = useCallback((newComposition?: MotionComposition) => {
    setCompositionState(newComposition ?? createComposition());
  }, []);

  const compKey = useMemo(() => {
    try {
      return JSON.stringify(composition);
    } catch {
      return composition.id;
    }
  }, [composition]);

  const optionsKey = options ? JSON.stringify(options) : "";

  const result = useMemo(() => {
    return buildCompositionTree(composition, options);
  }, [compKey, optionsKey, version]);

  return {
    composition,
    result,
    addNode,
    removeNode,
    updateNode,
    updateComposition,
    reset,
  };
}

export interface UseCompositionBuilderResult extends UseCompositionResult {
  readonly isValid: boolean;
  readonly setMotionDNA: (dna: string | undefined) => void;
  readonly setDesignSystem: (ds: string | undefined) => void;
  readonly setPalette: (paletteId: string | undefined) => void;
}

/**
 * React hook providing a fluent composition builder interface.
 */
export function useCompositionBuilder(
  options?: CompositionOptions,
): UseCompositionBuilderResult {
  const comp = useComposition(undefined, options);

  const setMotionDNA = useCallback((dna: string | undefined) => {
    comp.updateComposition((prev) => ({ ...prev, motionDNA: dna }));
  }, [comp.updateComposition]);

  const setDesignSystem = useCallback((ds: string | undefined) => {
    comp.updateComposition((prev) => ({ ...prev, designSystem: ds }));
  }, [comp.updateComposition]);

  const setPalette = useCallback((paletteId: string | undefined) => {
    comp.updateComposition((prev) => ({ ...prev, paletteId }));
  }, [comp.updateComposition]);

  return {
    ...comp,
    isValid: comp.result.validation.valid,
    setMotionDNA,
    setDesignSystem,
    setPalette,
  };
}

/**
 * React hook providing reactive validation and automatic correction of a configuration object.
 * Re-evaluates when configuration, options, or the registry schema changes.
 */
export function useCorrectConfiguration(
  capabilityIdOrSchema: string | UnifiedMotionSchema,
  configuration: unknown,
  options?: CorrectionOptions,
): CorrectionResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const configKey = useMemo(() => {
    try {
      return JSON.stringify(configuration);
    } catch {
      return String(configuration);
    }
  }, [configuration]);

  const optionsKey = options ? JSON.stringify(options) : "";
  const schemaKey = typeof capabilityIdOrSchema === "string" ? capabilityIdOrSchema : capabilityIdOrSchema?.id ?? "";

  return useMemo(() => {
    return correctConfiguration(capabilityIdOrSchema, configuration, options);
  }, [schemaKey, configKey, optionsKey, version]);
}

/**
 * React hook providing reactive audit and automatic correction of a MotionComposition tree.
 * Re-evaluates when composition, options, or registry state changes.
 */
export function useCorrectComposition(
  composition: MotionComposition,
  options?: CorrectionOptions,
): CompositionCorrectionResult {
  const version = useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const compositionKey = useMemo(() => {
    try {
      return JSON.stringify(composition);
    } catch {
      return "";
    }
  }, [composition]);

  const optionsKey = options ? JSON.stringify(options) : "";

  return useMemo(() => {
    return correctComposition(composition, options);
  }, [compositionKey, optionsKey, version]);
}

export interface UseGenerateMotionState {
  readonly result: GenerationResult | null;
  readonly isGenerating: boolean;
  readonly stage: GenerationStage;
  readonly progress: number;
  readonly statusMessage: string;
  readonly error: GenerationError | null;
}

export interface UseGenerateMotionOptions extends GenerationOptions {
  /** Whether to immediately trigger generation on mount with initialRequest. Defaults to false. */
  readonly autoRun?: boolean;
}

export interface UseGenerateMotionResult extends UseGenerateMotionState {
  readonly generate: (
    overrideRequest?: GenerationRequest,
    overrideOptions?: GenerationOptions,
  ) => Promise<GenerationResult>;
  readonly cancel: () => void;
  readonly reset: () => void;
}

/**
 * React hook providing reactive state management and execution for AF Motion's AI generation pipeline.
 * Fully compatible with React 18, React 19, Strict Mode, and SSR.
 */
export function useGenerateMotion(
  initialRequest?: GenerationRequest,
  defaultOptions?: UseGenerateMotionOptions,
): UseGenerateMotionResult {
  const [state, setState] = useState<UseGenerateMotionState>({
    result: null,
    isGenerating: false,
    stage: "idle",
    progress: 0,
    statusMessage: "Ready",
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Subscribe to registry updates for reactive awareness
  useSyncExternalStore(
    aiMotionRegistry.subscribe,
    () => aiMotionRegistry.getVersion(),
    () => 0,
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        stage: "cancelled",
        statusMessage: "Generation cancelled.",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    if (isMountedRef.current) {
      setState({
        result: null,
        isGenerating: false,
        stage: "idle",
        progress: 0,
        statusMessage: "Ready",
        error: null,
      });
    }
  }, [cancel]);

  const generate = useCallback(
    async (
      overrideRequest?: GenerationRequest,
      overrideOptions?: GenerationOptions,
    ): Promise<GenerationResult> => {
      // Abort previous in-flight generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const targetRequest = overrideRequest ?? initialRequest;
      if (!targetRequest) {
        const errorResult: GenerationResult = {
          success: false,
          cancelled: false,
          stage: "failed",
          request: { prompt: "" },
          context: {
            request: { prompt: "" },
            options: {},
            timestamp: Date.now(),
            resolvedCapabilityIds: [],
          },
          diagnostics: {
            durationMs: 0,
            completedStages: [],
            warnings: ["No generation request provided."],
            designConfidence: 0,
            motionConfidence: 0,
            issuesCount: 1,
            correctionsCount: 0,
            stageTimings: {},
          },
          error: {
            stage: "idle",
            message: "No request provided to useGenerateMotion.",
            code: "MISSING_REQUEST",
          },
        };

        if (isMountedRef.current) {
          setState({
            result: errorResult,
            isGenerating: false,
            stage: "failed",
            progress: 0,
            statusMessage: "Failed: No request provided.",
            error: errorResult.error ?? null,
          });
        }
        return errorResult;
      }

      if (isMountedRef.current) {
        setState({
          result: null,
          isGenerating: true,
          stage: "interpreting_design",
          progress: 0.1,
          statusMessage: "Starting generation pipeline...",
          error: null,
        });
      }

      const mergedOptions: GenerationOptions = {
        ...defaultOptions,
        ...overrideOptions,
        signal: controller.signal,
        onProgress: (stage, progress, message) => {
          if (isMountedRef.current) {
            setState((prev) => ({
              ...prev,
              stage,
              progress,
              statusMessage: message,
            }));
          }
          defaultOptions?.onProgress?.(stage, progress, message);
          overrideOptions?.onProgress?.(stage, progress, message);
        },
      };

      try {
        const result = await generateMotion(targetRequest, mergedOptions);

        if (isMountedRef.current) {
          setState({
            result,
            isGenerating: false,
            stage: result.stage,
            progress: result.success ? 1.0 : result.cancelled ? 0 : 0.5,
            statusMessage: result.success
              ? "Generation complete."
              : result.cancelled
                ? "Generation cancelled."
                : (result.error?.message ?? "Generation failed."),
            error: result.error ?? null,
          });
        }

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const errObj: GenerationError = {
          stage: "failed",
          message,
          code: "UNCAUGHT_EXCEPTION",
          details: err,
        };

        const failedResult: GenerationResult = {
          success: false,
          cancelled: false,
          stage: "failed",
          request: targetRequest,
          context: {
            request: targetRequest,
            options: mergedOptions,
            timestamp: Date.now(),
            resolvedCapabilityIds: [],
          },
          diagnostics: {
            durationMs: 0,
            completedStages: [],
            warnings: [message],
            designConfidence: 0,
            motionConfidence: 0,
            issuesCount: 1,
            correctionsCount: 0,
            stageTimings: {},
          },
          error: errObj,
        };

        if (isMountedRef.current) {
          setState({
            result: failedResult,
            isGenerating: false,
            stage: "failed",
            progress: 0,
            statusMessage: `Error: ${message}`,
            error: errObj,
          });
        }

        return failedResult;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [initialRequest, defaultOptions],
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (defaultOptions?.autoRun && initialRequest) {
      void generate(initialRequest);
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      generate,
      cancel,
      reset,
    }),
    [state, generate, cancel, reset],
  );
}

/**
 * React hook that returns visual styles from the registry, re-evaluating when the registry updates.
 */
export function useVisualStyles(
  filter?: VisualStyleFilter,
): readonly VisualStyleDefinition[] {
  const version = useSyncExternalStore(
    visualStyleRegistry.subscribe,
    () => visualStyleRegistry.getVersion(),
    () => 0,
  );

  const filterKey = filter ? JSON.stringify(filter) : "";

  return useMemo(() => {
    return visualStyleRegistry.listVisualStyles(filter);
  }, [filterKey, version]);
}

/**
 * React hook that returns a specific visual style definition by its unique identifier.
 */
export function useVisualStyle(
  id?: string,
): VisualStyleDefinition | undefined {
  const version = useSyncExternalStore(
    visualStyleRegistry.subscribe,
    () => visualStyleRegistry.getVersion(),
    () => 0,
  );

  return useMemo(() => {
    if (!id) return undefined;
    return visualStyleRegistry.getVisualStyle(id);
  }, [id, version]);
}

/**
 * React hook that resolves a visual style into its normalized design tokens and CSS variables.
 */
export function useResolveVisualStyle(
  styleOrId?: string | VisualStyleDefinition,
  overrides?: Partial<ResolvedVisualStyle>,
): ResolvedVisualStyle | undefined {
  const version = useSyncExternalStore(
    visualStyleRegistry.subscribe,
    () => visualStyleRegistry.getVersion(),
    () => 0,
  );

  const key = typeof styleOrId === "string" ? styleOrId : styleOrId?.id ?? "";
  const overridesKey = overrides ? JSON.stringify(overrides) : "";

  return useMemo(() => {
    if (!styleOrId) return undefined;
    return resolveVisualStyle(styleOrId, overrides);
  }, [key, overridesKey, version]);
}


// ============================================================================
// Skeuomorphism React Components (Prompt 65)
// ============================================================================

export interface SkeuomorphicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly material?: SkeuomorphicMaterial;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly bevel?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const SkeuomorphicButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, SkeuomorphicButtonProps>(
  function SkeuomorphicButton(
    {
      material = "metal",
      elevation = 1,
      highContrast = false,
      bevel = true,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeSkeuomorphicStyle({
      material,
      elevation,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("skeuomorphism");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      backdropFilter: computed.backdropFilter,
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? "translateY(1px)"
            : isHovered
              ? "translateY(-1px)"
              : "none"
          : "none",
      outline: isFocused ? "3px solid #3b82f6" : "none",
      outlineOffset: "2px",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface SkeuomorphicCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly material?: SkeuomorphicMaterial;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly stitched?: boolean;
  readonly bevel?: boolean;
  readonly children?: ReactNode;
}

export const SkeuomorphicCard = /* @__PURE__ */ forwardRef<HTMLDivElement, SkeuomorphicCardProps>(
  function SkeuomorphicCard(
    {
      material = "leather",
      elevation = 2,
      highContrast = false,
      stitched = false,
      bevel = true,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeSkeuomorphicStyle({
      material,
      elevation,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      backdropFilter: computed.backdropFilter,
      overflow: "hidden",
      ...style,
    };

    const stitchColor = material === "leather" ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.25)";
    const stitchBorder = `1px dashed ${stitchColor}`;

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      stitched
        ? createElement(
            "div",
            {
              "aria-hidden": "true",
              style: {
                position: "absolute",
                top: "6px",
                left: "6px",
                right: "6px",
                bottom: "6px",
                border: stitchBorder,
                borderRadius: "6px",
                pointerEvents: "none",
              },
            },
          )
        : null,
      children,
    );
  },
);

export interface SkeuomorphicPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly material?: SkeuomorphicMaterial;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly riveted?: boolean;
  readonly title?: string;
  readonly children?: ReactNode;
}

export const SkeuomorphicPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, SkeuomorphicPanelProps>(
  function SkeuomorphicPanel(
    {
      material = "metal",
      elevation = 1,
      highContrast = false,
      riveted = false,
      title,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeSkeuomorphicStyle({
      material,
      elevation,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: riveted ? "28px" : "20px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      backdropFilter: computed.backdropFilter,
      ...style,
    };

    const renderRivet = (pos: CSSProperties, key: string) =>
      createElement("span", {
        key,
        "aria-hidden": "true",
        style: {
          position: "absolute",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #ffffff 0%, #a1a8b3 50%, #646a74 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.8)",
          ...pos,
        },
      });

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      riveted
        ? [
            renderRivet({ top: "8px", left: "8px" }, "rivet-tl"),
            renderRivet({ top: "8px", right: "8px" }, "rivet-tr"),
            renderRivet({ bottom: "8px", left: "8px" }, "rivet-bl"),
            renderRivet({ bottom: "8px", right: "8px" }, "rivet-br"),
          ]
        : null,
      title ? createElement("h3", { style: { marginTop: 0, marginBottom: "12px", fontSize: "16px", fontWeight: 700 } }, title) : null,
      children,
    );
  },
);

export interface SkeuomorphicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly material?: "metal" | "plastic" | "glass";
  readonly highContrast?: boolean;
  readonly inset?: boolean;
}

export const SkeuomorphicInput = /* @__PURE__ */ forwardRef<HTMLInputElement, SkeuomorphicInputProps>(
  function SkeuomorphicInput(
    {
      material = "metal",
      highContrast = false,
      inset = true,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const inputBg = material === "metal" ? "#eef1f5" : material === "glass" ? "rgba(255,255,255,0.3)" : "#f8fafc";
    const normalShadow = inset
      ? "inset 0 2px 4px rgba(0, 0, 0, 0.22), inset 0 1px 2px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.85)"
      : "0 1px 2px rgba(0, 0, 0, 0.1)";
    const focusShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.28), 0 0 0 3px rgba(59, 130, 246, 0.4)";

    const inputStyle: CSSProperties = {
      padding: "10px 14px",
      fontSize: "14px",
      lineHeight: 1.4,
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#0f172a",
      background: inputBg,
      border: highContrast ? "2px solid #000000" : "1px solid #94a3b8",
      borderRadius: "6px",
      boxShadow: isFocused ? focusShadow : normalShadow,
      outline: "none",
      transition: "box-shadow 150ms ease, border-color 150ms ease",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

// ============================================================================
// Neumorphism React Components (Prompt 65)
// ============================================================================

export interface NeumorphicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly shape?: NeumorphicShape;
  readonly surfaceColor?: string;
  readonly distance?: number;
  readonly blur?: number;
  readonly intensity?: number;
  readonly lightSource?: NeumorphicLightSource;
  readonly accessibleContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly pressed?: boolean;
  readonly children?: ReactNode;
}

export const NeumorphicButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, NeumorphicButtonProps>(
  function NeumorphicButton(
    {
      shape = "flat",
      surfaceColor = "#e0e5ec",
      distance = 6,
      blur = 12,
      intensity = 0.15,
      lightSource = "top-left",
      accessibleContrast = false,
      reducedMotion = false,
      pressed = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = pressed || isPressed;
    const computed = computeNeumorphicStyle({
      shape: isEngaged ? "pressed" : shape,
      surfaceColor,
      distance: isEngaged ? Math.max(2, Math.round(distance * 0.6)) : distance,
      blur,
      intensity,
      lightSource,
      accessibleContrast,
      pressed: isEngaged,
    });

    const motionConfig = getStyleMotionConfig("neumorphism");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      outline: isFocused ? "2px solid #3b82f6" : computed.outline,
      outlineOffset: isFocused ? "3px" : "0px",
      transition: reducedMotion ? "opacity 200ms ease" : motionConfig.transition,
      transform: !reducedMotion && !disabled && isHovered && !isEngaged ? "scale(1.02)" : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface NeumorphicCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: NeumorphicShape;
  readonly surfaceColor?: string;
  readonly distance?: number;
  readonly blur?: number;
  readonly intensity?: number;
  readonly lightSource?: NeumorphicLightSource;
  readonly accessibleContrast?: boolean;
  readonly children?: ReactNode;
}

export const NeumorphicCard = /* @__PURE__ */ forwardRef<HTMLDivElement, NeumorphicCardProps>(
  function NeumorphicCard(
    {
      shape = "flat",
      surfaceColor = "#e0e5ec",
      distance = 8,
      blur = 16,
      intensity = 0.15,
      lightSource = "top-left",
      accessibleContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeNeumorphicStyle({
      shape,
      surfaceColor,
      distance,
      blur,
      intensity,
      lightSource,
      accessibleContrast,
    });

    const cardStyle: CSSProperties = {
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: "20px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      outline: computed.outline,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface NeumorphicPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: NeumorphicShape;
  readonly surfaceColor?: string;
  readonly recessed?: boolean;
  readonly accessibleContrast?: boolean;
  readonly children?: ReactNode;
}

export const NeumorphicPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, NeumorphicPanelProps>(
  function NeumorphicPanel(
    {
      shape = "flat",
      surfaceColor = "#e0e5ec",
      recessed = false,
      accessibleContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeNeumorphicStyle({
      shape: recessed ? "pressed" : shape,
      surfaceColor,
      accessibleContrast,
      distance: 6,
      blur: 12,
    });

    const panelStyle: CSSProperties = {
      padding: "20px",
      background: computed.background,
      border: computed.border,
      borderRadius: "16px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      outline: computed.outline,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      children,
    );
  },
);

export interface NeumorphicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly surfaceColor?: string;
  readonly intensity?: number;
  readonly accessibleContrast?: boolean;
}

export const NeumorphicInput = /* @__PURE__ */ forwardRef<HTMLInputElement, NeumorphicInputProps>(
  function NeumorphicInput(
    {
      surfaceColor = "#e0e5ec",
      intensity = 0.15,
      accessibleContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeNeumorphicStyle({
      shape: "pressed",
      surfaceColor,
      distance: 4,
      blur: 8,
      intensity,
      accessibleContrast,
    });

    const inputStyle: CSSProperties = {
      padding: "12px 16px",
      fontSize: "14px",
      lineHeight: 1.4,
      fontFamily: "Inter, system-ui, sans-serif",
      color: computed.color,
      background: computed.background,
      border: computed.border,
      borderRadius: "12px",
      boxShadow: computed.boxShadow,
      outline: isFocused ? "2px solid #3b82f6" : "none",
      outlineOffset: "2px",
      transition: "box-shadow 200ms ease, outline 200ms ease",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

// ============================================================================
// Art Nouveau React Components (Prompt 65)
// ============================================================================

export interface ArtNouveauButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ArtNouveauVariant;
  readonly motif?: "floral" | "tendril" | "simple";
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly children?: ReactNode;
}

export const ArtNouveauButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, ArtNouveauButtonProps>(
  function ArtNouveauButton(
    {
      variant = "parchment",
      motif = "simple",
      highContrast = false,
      reducedMotion = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeArtNouveauStyle({
      variant,
      highContrast,
      cornerRadius: "9999px",
    });

    const motionConfig = getStyleMotionConfig("art-nouveau");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px 24px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 500,
      letterSpacing: computed.letterSpacing,
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: `${computed.borderWidth} ${computed.borderStyle} ${computed.borderColor}`,
      borderRadius: computed.borderRadius,
      boxShadow: isHovered
        ? "0 6px 16px rgba(46, 74, 54, 0.16)"
        : computed.boxShadow,
      color: computed.color,
      outline: isFocused ? `2px solid ${computed.accentColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 200ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isPressed
            ? "translateY(1px)"
            : isHovered
              ? "translateY(-1px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    const renderFloralMotif = (key: string) =>
      createElement(
        "svg",
        {
          key,
          "aria-hidden": "true",
          focusable: "false",
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: computed.borderColor,
          strokeWidth: "1.75",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", {
          d: "M12 2 C8 6, 8 10, 12 14 C16 10, 16 6, 12 2 Z",
        }),
        createElement("path", {
          d: "M12 14 C10 17, 7 20, 3 21 C8 21, 10 18, 12 14 Z",
        }),
        createElement("path", {
          d: "M12 14 C14 17, 17 20, 21 21 C16 21, 14 18, 12 14 Z",
        }),
      );

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      motif === "floral" ? renderFloralMotif("floral-left") : null,
      children,
      motif === "floral" ? renderFloralMotif("floral-right") : null,
    );
  },
);

export interface ArtNouveauCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: ArtNouveauVariant;
  readonly asymmetric?: boolean;
  readonly ornateBorder?: boolean;
  readonly highContrast?: boolean;
  readonly cornerFlourish?: boolean;
  readonly children?: ReactNode;
}

export const ArtNouveauCard = /* @__PURE__ */ forwardRef<HTMLDivElement, ArtNouveauCardProps>(
  function ArtNouveauCard(
    {
      variant = "parchment",
      asymmetric = false,
      ornateBorder = true,
      highContrast = false,
      cornerFlourish = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeArtNouveauStyle({
      variant,
      asymmetric,
      ornateBorder,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: `${computed.borderWidth} ${computed.borderStyle} ${computed.borderColor}`,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    const renderCornerFlourish = (pos: CSSProperties, key: string) =>
      createElement(
        "svg",
        {
          key,
          "aria-hidden": "true",
          focusable: "false",
          width: "36",
          height: "36",
          viewBox: "0 0 40 40",
          style: {
            position: "absolute",
            pointerEvents: "none",
            ...pos,
          },
        },
        createElement("path", {
          d: ART_NOUVEAU_CORNER_PATH,
          fill: "none",
          stroke: computed.borderColor,
          strokeWidth: "1.5",
          strokeLinecap: "round",
        }),
      );

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      cornerFlourish
        ? [
            renderCornerFlourish({ top: "6px", left: "6px" }, "cf-tl"),
            renderCornerFlourish({ bottom: "6px", right: "6px", transform: "rotate(180deg)" }, "cf-br"),
          ]
        : null,
      children,
    );
  },
);

export interface ArtNouveauFrameProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: ArtNouveauVariant;
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
  readonly cornerSize?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const ArtNouveauFrame = /* @__PURE__ */ forwardRef<HTMLDivElement, ArtNouveauFrameProps>(
  function ArtNouveauFrame(
    {
      variant = "parchment",
      strokeColor,
      strokeWidth = 1.5,
      cornerSize = 40,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeArtNouveauStyle({ variant, highContrast });
    const color = strokeColor ?? computed.borderColor;

    const frameStyle: CSSProperties = {
      position: "relative",
      padding: `${cornerSize + 8}px`,
      background: computed.background,
      border: `1px solid ${color}`,
      borderRadius: "16px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    const renderCorner = (rotation: number, pos: CSSProperties, key: string) =>
      createElement(
        "svg",
        {
          key,
          "aria-hidden": "true",
          focusable: "false",
          width: cornerSize,
          height: cornerSize,
          viewBox: "0 0 40 40",
          style: {
            position: "absolute",
            transform: `rotate(${rotation}deg)`,
            pointerEvents: "none",
            ...pos,
          },
        },
        createElement("path", {
          d: ART_NOUVEAU_CORNER_PATH,
          fill: "none",
          stroke: color,
          strokeWidth,
          strokeLinecap: "round",
        }),
      );

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: frameStyle,
      },
      renderCorner(0, { top: "6px", left: "6px" }, "corner-tl"),
      renderCorner(90, { top: "6px", right: "6px" }, "corner-tr"),
      renderCorner(270, { bottom: "6px", left: "6px" }, "corner-bl"),
      renderCorner(180, { bottom: "6px", right: "6px" }, "corner-br"),
      children,
    );
  },
);

export interface ArtNouveauDividerProps extends HTMLAttributes<HTMLDivElement> {
  readonly motif?: "floral" | "whiplash" | "lotus";
  readonly color?: string;
  readonly width?: number | string;
  readonly height?: number | string;
}

export const ArtNouveauDivider = /* @__PURE__ */ forwardRef<HTMLDivElement, ArtNouveauDividerProps>(
  function ArtNouveauDivider(
    {
      motif = "whiplash",
      color = "#2e4a36",
      width = "100%",
      height = 30,
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    const dividerStyle: CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width,
      margin: "16px 0",
      ...style,
    };

    const pathD = motif === "whiplash" ? ART_NOUVEAU_WHIPLASH_PATH : ART_NOUVEAU_DIVIDER_PATH;
    const viewBox = motif === "whiplash" ? "0 0 240 40" : "0 0 300 30";

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "separator",
        "aria-hidden": "true",
        className,
        style: dividerStyle,
      },
      createElement(
        "svg",
        {
          width: "100%",
          height,
          viewBox,
          preserveAspectRatio: "xMidYMid meet",
          fill: "none",
          stroke: color,
          strokeWidth: "1.75",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d: pathD }),
      ),
    );
  },
);

export interface ArtNouveauInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: ArtNouveauVariant;
  readonly highContrast?: boolean;
}

export const ArtNouveauInput = /* @__PURE__ */ forwardRef<HTMLInputElement, ArtNouveauInputProps>(
  function ArtNouveauInput(
    {
      variant = "parchment",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeArtNouveauStyle({
      variant,
      highContrast,
      cornerRadius: "16px",
    });

    const inputStyle: CSSProperties = {
      padding: "10px 16px",
      fontSize: "14px",
      lineHeight: 1.4,
      fontFamily: computed.fontFamily,
      color: computed.color,
      background: computed.background,
      border: `${computed.borderWidth} solid ${isFocused ? computed.accentColor : computed.borderColor}`,
      borderRadius: "16px",
      boxShadow: isFocused ? `0 0 0 3px rgba(198, 146, 85, 0.25)` : "0 2px 6px rgba(0,0,0,0.04)",
      outline: "none",
      transition: "border-color 200ms ease, box-shadow 200ms ease",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);


// ============================================================================
// Liquid Chrome React Components (Prompt 66)
// ============================================================================

export interface LiquidChromeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: LiquidChromeVariant;
  readonly fluidBorder?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const LiquidChromeButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, LiquidChromeButtonProps>(
  function LiquidChromeButton(
    {
      variant = "mirror",
      fluidBorder = true,
      elevation = 1,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeLiquidChromeStyle({
      variant,
      elevation,
      pressed: isEngaged,
      highContrast,
      fluidBorder,
    });

    const motionConfig = getStyleMotionConfig("liquid-chrome");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 24px",
      fontFamily: "Syne, 'Space Grotesk', system-ui, sans-serif",
      fontSize: "14px",
      fontWeight: 700,
      letterSpacing: "0.02em",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      backdropFilter: computed.backdropFilter,
      outline: isFocused ? "2px solid #38bdf8" : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? "scale(0.98)"
            : isHovered
              ? "scale(1.03)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface LiquidChromeCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: LiquidChromeVariant;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly fluidBorder?: boolean;
  readonly children?: ReactNode;
}

export const LiquidChromeCard = /* @__PURE__ */ forwardRef<HTMLDivElement, LiquidChromeCardProps>(
  function LiquidChromeCard(
    {
      variant = "mirror",
      elevation = 2,
      highContrast = false,
      fluidBorder = true,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeLiquidChromeStyle({
      variant,
      elevation,
      highContrast,
      fluidBorder,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: "28px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      backdropFilter: computed.backdropFilter,
      overflow: "hidden",
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface LiquidChromePanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: LiquidChromeVariant;
  readonly title?: string;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const LiquidChromePanel = /* @__PURE__ */ forwardRef<HTMLDivElement, LiquidChromePanelProps>(
  function LiquidChromePanel(
    {
      variant = "dark-mercury",
      title,
      elevation = 1,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeLiquidChromeStyle({
      variant,
      elevation,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: "24px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      backdropFilter: computed.backdropFilter,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      title
        ? createElement(
            "h3",
            {
              style: {
                marginTop: 0,
                marginBottom: "14px",
                fontFamily: "Syne, 'Space Grotesk', sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                textShadow: computed.textShadow,
              },
            },
            title,
          )
        : null,
      children,
    );
  },
);

export interface LiquidChromeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: LiquidChromeVariant;
  readonly highContrast?: boolean;
}

export const LiquidChromeInput = /* @__PURE__ */ forwardRef<HTMLInputElement, LiquidChromeInputProps>(
  function LiquidChromeInput(
    {
      variant = "mirror",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeLiquidChromeStyle({
      variant,
      elevation: 0,
      highContrast,
    });

    const focusGlow =
      variant === "dark-mercury"
        ? "0 0 15px rgba(56, 189, 248, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.2)"
        : "0 0 15px rgba(56, 189, 248, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.95)";

    const inputStyle: CSSProperties = {
      padding: "10px 18px",
      fontSize: "14px",
      lineHeight: 1.4,
      fontFamily: "Inter, system-ui, sans-serif",
      color: computed.color,
      background: computed.background,
      border: isFocused ? "1px solid #38bdf8" : computed.border,
      borderRadius: "9999px",
      boxShadow: isFocused ? focusGlow : computed.boxShadow,
      outline: "none",
      backdropFilter: computed.backdropFilter,
      transition: "box-shadow 200ms ease, border-color 200ms ease",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

// ============================================================================
// De Stijl React Components (Prompt 66)
// ============================================================================

export interface DeStijlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: DeStijlVariant;
  readonly borderWidth?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly children?: ReactNode;
}

export const DeStijlButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, DeStijlButtonProps>(
  function DeStijlButton(
    {
      variant = "white",
      borderWidth = 4,
      highContrast = false,
      reducedMotion = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeDeStijlStyle({
      variant,
      borderWidth,
      pressed: isPressed,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("de-stijl");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: computed.fontWeight,
      letterSpacing: "0.06em",
      textTransform: computed.textTransform,
      lineHeight: 1.2,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: "0px",
      boxShadow: !reducedMotion && !disabled && isHovered && !isPressed ? "3px 3px 0px #000000" : "none",
      color: computed.color,
      outline: isFocused ? "3px solid #0047ab" : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 100ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isPressed
            ? "translate(1px, 1px)"
            : isHovered
              ? "translate(-2px, -2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface DeStijlCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: DeStijlVariant;
  readonly accentVariant?: DeStijlVariant;
  readonly borderWidth?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const DeStijlCard = /* @__PURE__ */ forwardRef<HTMLDivElement, DeStijlCardProps>(
  function DeStijlCard(
    {
      variant = "white",
      accentVariant,
      borderWidth = 4,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeDeStijlStyle({
      variant,
      borderWidth,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: "0px",
      color: computed.color,
      fontFamily: computed.fontFamily,
      overflow: "hidden",
      ...style,
    };

    let accentBg = "";
    if (accentVariant === "red") accentBg = "#e63946";
    else if (accentVariant === "blue") accentBg = "#0047ab";
    else if (accentVariant === "yellow") accentBg = "#ffd166";
    else if (accentVariant === "black") accentBg = "#000000";

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      accentVariant && accentBg
        ? createElement("div", {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              top: 0,
              right: 0,
              width: "28px",
              height: "28px",
              background: accentBg,
              borderBottom: `${borderWidth}px solid #000000`,
              borderLeft: `${borderWidth}px solid #000000`,
              pointerEvents: "none",
            },
          })
        : null,
      children,
    );
  },
);

export interface DeStijlPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: DeStijlVariant;
  readonly headerVariant?: DeStijlVariant;
  readonly title?: string;
  readonly borderWidth?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const DeStijlPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, DeStijlPanelProps>(
  function DeStijlPanel(
    {
      variant = "white",
      headerVariant = "red",
      title,
      borderWidth = 4,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeDeStijlStyle({
      variant,
      borderWidth,
      highContrast,
    });

    const headerComputed = computeDeStijlStyle({
      variant: headerVariant,
      borderWidth,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      background: computed.background,
      border: computed.border,
      borderRadius: "0px",
      color: computed.color,
      fontFamily: computed.fontFamily,
      overflow: "hidden",
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      title
        ? createElement(
            "div",
            {
              style: {
                padding: "10px 18px",
                background: headerComputed.background,
                color: headerComputed.color,
                borderBottom: computed.border,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              },
            },
            title,
          )
        : null,
      createElement(
        "div",
        { style: { padding: "20px" } },
        children,
      ),
    );
  },
);

export interface DeStijlInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly accentColor?: string;
  readonly borderWidth?: number;
  readonly highContrast?: boolean;
}

export const DeStijlInput = /* @__PURE__ */ forwardRef<HTMLInputElement, DeStijlInputProps>(
  function DeStijlInput(
    {
      accentColor = "#0047ab",
      borderWidth = 4,
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const inputStyle: CSSProperties = {
      padding: "10px 16px",
      fontSize: "14px",
      fontFamily: "Futura, 'Trebuchet MS', Arial, sans-serif",
      fontWeight: 700,
      color: "#000000",
      background: "#ffffff",
      border: `${borderWidth}px solid #000000`,
      borderRadius: "0px",
      outline: isFocused ? `${borderWidth}px solid ${accentColor}` : "none",
      outlineOffset: "2px",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

// ============================================================================
// Memphis React Components (Prompt 66)
// ============================================================================

export interface MemphisButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: MemphisVariant;
  readonly pattern?: MemphisPatternType;
  readonly shadowDistance?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly children?: ReactNode;
}

export const MemphisButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, MemphisButtonProps>(
  function MemphisButton(
    {
      variant = "lemon",
      pattern = "none",
      shadowDistance = 4,
      highContrast = false,
      reducedMotion = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeMemphisStyle({
      variant,
      pattern,
      shadowDistance,
      pressed: isPressed,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("memphis");

    const currentShadow =
      isPressed
        ? `${Math.max(1, shadowDistance - 2)}px ${Math.max(1, shadowDistance - 2)}px 0px #000000`
        : isHovered
          ? `${shadowDistance + 2}px ${shadowDistance + 2}px 0px #000000`
          : computed.boxShadow;

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 800,
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      backgroundSize: computed.backgroundSize,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: currentShadow,
      color: computed.color,
      outline: isFocused ? "3px solid #ff007f" : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isPressed
            ? "translate(2px, 2px)"
            : isHovered
              ? "translate(-2px, -2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface MemphisCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: MemphisVariant;
  readonly pattern?: MemphisPatternType;
  readonly shadowDistance?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const MemphisCard = /* @__PURE__ */ forwardRef<HTMLDivElement, MemphisCardProps>(
  function MemphisCard(
    {
      variant = "white",
      pattern = "none",
      shadowDistance = 6,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeMemphisStyle({
      variant,
      pattern,
      shadowDistance,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      backgroundSize: computed.backgroundSize,
      border: computed.border,
      borderRadius: "16px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface MemphisPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: MemphisVariant;
  readonly pattern?: MemphisPatternType;
  readonly title?: string;
  readonly shadowDistance?: number;
  readonly children?: ReactNode;
}

export const MemphisPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, MemphisPanelProps>(
  function MemphisPanel(
    {
      variant = "lemon",
      pattern = "none",
      title,
      shadowDistance = 5,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeMemphisStyle({
      variant,
      pattern,
      shadowDistance,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      backgroundSize: computed.backgroundSize,
      border: computed.border,
      borderRadius: "14px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      title
        ? createElement(
            "span",
            {
              style: {
                display: "inline-block",
                padding: "4px 12px",
                marginBottom: "14px",
                background: "#000000",
                color: "#ffffff",
                borderRadius: "6px",
                fontWeight: 900,
                fontSize: "14px",
                textTransform: "uppercase",
              },
            },
            title,
          )
        : null,
      children,
    );
  },
);

export interface MemphisInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: MemphisVariant;
  readonly shadowDistance?: number;
}

export const MemphisInput = /* @__PURE__ */ forwardRef<HTMLInputElement, MemphisInputProps>(
  function MemphisInput(
    {
      variant = "white",
      shadowDistance = 3,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeMemphisStyle({
      variant,
      shadowDistance,
    });

    const inputStyle: CSSProperties = {
      padding: "10px 16px",
      fontSize: "14px",
      fontFamily: computed.fontFamily,
      fontWeight: 600,
      color: computed.color,
      background: computed.background,
      border: "3px solid #000000",
      borderRadius: "8px",
      boxShadow: isFocused ? `${shadowDistance + 2}px ${shadowDistance + 2}px 0px #ff007f` : computed.boxShadow,
      outline: isFocused ? "2px solid #ff007f" : "none",
      outlineOffset: "2px",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface MemphisDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "squiggle" | "zigzag" | "triangle" | "circle";
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export const MemphisDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, MemphisDecorationProps>(
  function MemphisDecoration(
    {
      shape = "squiggle",
      color = "#000000",
      size = 32,
      strokeWidth = 3,
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = MEMPHIS_SQUIGGLE_PATH;
    let viewBox = "0 0 150 30";
    let isFill = false;

    if (shape === "zigzag") {
      d = MEMPHIS_ZIGZAG_PATH;
      viewBox = "0 0 90 25";
    } else if (shape === "triangle") {
      d = MEMPHIS_TRIANGLE_PATH;
      viewBox = "0 0 30 30";
      isFill = true;
    } else if (shape === "circle") {
      d = MEMPHIS_CIRCLE_PATH;
      viewBox = "0 0 30 30";
      isFill = true;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox,
          fill: isFill ? color : "none",
          stroke: isFill ? "#000000" : color,
          strokeWidth: isFill ? 2 : strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);


// ============================================================================
// Psychedelic React Components (Prompt 67)
// ============================================================================

export interface PsychedelicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: PsychedelicVariant;
  readonly wavy?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const PsychedelicButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, PsychedelicButtonProps>(
  function PsychedelicButton(
    {
      variant = "electric",
      wavy = true,
      elevation = 1,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computePsychedelicStyle({
      variant,
      elevation,
      wavy,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("psychedelic");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 26px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 900,
      letterSpacing: "0.02em",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? "3px solid #ff007f" : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? "scale(0.97) rotate(0.5deg)"
            : isHovered
              ? "scale(1.05) rotate(-1deg)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface PsychedelicCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: PsychedelicVariant;
  readonly wavy?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const PsychedelicCard = /* @__PURE__ */ forwardRef<HTMLDivElement, PsychedelicCardProps>(
  function PsychedelicCard(
    {
      variant = "electric",
      wavy = true,
      elevation = 2,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computePsychedelicStyle({
      variant,
      elevation,
      wavy,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "26px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      overflow: "hidden",
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface PsychedelicPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: PsychedelicVariant;
  readonly title?: string;
  readonly wavy?: boolean;
  readonly children?: ReactNode;
}

export const PsychedelicPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, PsychedelicPanelProps>(
  function PsychedelicPanel(
    {
      variant = "swirl",
      title,
      wavy = true,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computePsychedelicStyle({
      variant,
      wavy,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      title
        ? createElement(
            "h3",
            {
              style: {
                marginTop: 0,
                marginBottom: "14px",
                fontSize: "18px",
                fontWeight: 900,
                letterSpacing: "0.03em",
                textShadow: computed.textShadow,
              },
            },
            title,
          )
        : null,
      children,
    );
  },
);

export interface PsychedelicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: PsychedelicVariant;
  readonly wavy?: boolean;
  readonly highContrast?: boolean;
}

export const PsychedelicInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PsychedelicInputProps>(
  function PsychedelicInput(
    {
      variant = "electric",
      wavy = true,
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computePsychedelicStyle({
      variant,
      wavy,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      padding: "10px 18px",
      fontSize: "14px",
      fontFamily: "Work Sans, system-ui, sans-serif",
      color: "#0f172a",
      background: "rgba(255, 255, 255, 0.95)",
      border: computed.border,
      borderRadius: wavy ? "24px 14px 24px 14px" : "9999px",
      boxShadow: isFocused ? "0 0 16px rgba(255, 0, 127, 0.6)" : computed.boxShadow,
      outline: isFocused ? "2px solid #ff007f" : "none",
      outlineOffset: "2px",
      transition: "box-shadow 200ms ease, outline 200ms ease",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface PsychedelicDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "wave" | "flower";
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export const PsychedelicDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, PsychedelicDecorationProps>(
  function PsychedelicDecoration(
    {
      shape = "wave",
      color = "#ff007f",
      size = 32,
      strokeWidth = 3,
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    const isWave = shape === "wave";
    const d = isWave ? PSYCHEDELIC_WAVE_PATH : PSYCHEDELIC_FLOWER_PATH;
    const viewBox = isWave ? "0 0 315 50" : "0 0 50 50";

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox,
          fill: isWave ? "none" : color,
          stroke: isWave ? color : "#000000",
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Vaporwave React Components (Prompt 67)
// ============================================================================

export interface VaporwaveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: VaporwaveVariant;
  readonly glow?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const VaporwaveButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, VaporwaveButtonProps>(
  function VaporwaveButton(
    {
      variant = "sunset",
      glow = true,
      elevation = 1,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeVaporwaveStyle({
      variant,
      elevation,
      glow,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("vaporwave");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 22px",
      fontFamily: computed.fontFamily,
      fontSize: "16px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? "2px solid #01cdfe" : "none",
      outlineOffset: "2px",
      backdropFilter: computed.backdropFilter,
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? "translateY(1px)"
            : isHovered
              ? "translateY(-2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface VaporwaveCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: VaporwaveVariant;
  readonly glow?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const VaporwaveCard = /* @__PURE__ */ forwardRef<HTMLDivElement, VaporwaveCardProps>(
  function VaporwaveCard(
    {
      variant = "cyber-grid",
      glow = true,
      elevation = 1,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeVaporwaveStyle({
      variant,
      elevation,
      glow,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      backdropFilter: computed.backdropFilter,
      overflow: "hidden",
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface VaporwavePanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: VaporwaveVariant;
  readonly title?: string;
  readonly glow?: boolean;
  readonly children?: ReactNode;
}

export const VaporwavePanel = /* @__PURE__ */ forwardRef<HTMLDivElement, VaporwavePanelProps>(
  function VaporwavePanel(
    {
      variant = "cyber-grid",
      title,
      glow = true,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeVaporwaveStyle({
      variant,
      glow,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      backdropFilter: computed.backdropFilter,
      overflow: "hidden",
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      title
        ? createElement(
            "div",
            {
              style: {
                padding: "8px 16px",
                background: "linear-gradient(90deg, #ff71ce, #01cdfe)",
                color: "#0d0221",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "VT323, monospace",
                fontSize: "16px",
              },
            },
            title,
          )
        : null,
      createElement("div", { style: { padding: "20px" } }, children),
    );
  },
);

export interface VaporwaveInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: VaporwaveVariant;
  readonly highContrast?: boolean;
}

export const VaporwaveInput = /* @__PURE__ */ forwardRef<HTMLInputElement, VaporwaveInputProps>(
  function VaporwaveInput(
    {
      variant = "cyber-grid",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeVaporwaveStyle({
      variant,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      padding: "10px 14px",
      fontSize: "15px",
      fontFamily: computed.fontFamily,
      letterSpacing: "0.06em",
      color: computed.color,
      background: variant === "pastel" ? "rgba(255, 255, 255, 0.9)" : "rgba(13, 2, 33, 0.9)",
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: isFocused ? "0 0 14px #01cdfe" : "none",
      outline: isFocused ? "2px solid #01cdfe" : "none",
      outlineOffset: "2px",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface VaporwaveDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "sunset" | "grid";
  readonly color?: string;
  readonly size?: number;
}

export const VaporwaveDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, VaporwaveDecorationProps>(
  function VaporwaveDecoration(
    {
      shape = "sunset",
      color = "#ff71ce",
      size = 48,
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    const isSunset = shape === "sunset";
    const d = isSunset ? VAPORWAVE_SUNSET_PATH : VAPORWAVE_GRID_PATH;
    const viewBox = isSunset ? "0 0 70 40" : "0 0 70 40";

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox,
          fill: isSunset ? "url(#sunset-grad)" : "none",
          stroke: color,
          strokeWidth: isSunset ? 1.5 : 2,
          strokeLinecap: "round",
        },
        isSunset
          ? createElement(
              "defs",
              null,
              createElement(
                "linearGradient",
                { id: "sunset-grad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                createElement("stop", { offset: "0%", stopColor: "#ffe600" }),
                createElement("stop", { offset: "50%", stopColor: "#ff71ce" }),
                createElement("stop", { offset: "100%", stopColor: "#01cdfe" }),
              ),
            )
          : null,
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Steampunk React Components (Prompt 67)
// ============================================================================

export interface SteampunkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: SteampunkVariant;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const SteampunkButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, SteampunkButtonProps>(
  function SteampunkButton(
    {
      variant = "brass",
      elevation = 1,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeSteampunkStyle({
      variant,
      elevation,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("steampunk");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "10px 22px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 700,
      letterSpacing: "0.04em",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? "2px solid #d4af37" : "none",
      outlineOffset: "2px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? "translateY(1px)"
            : isHovered
              ? "translateY(-1px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface SteampunkCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: SteampunkVariant;
  readonly elevation?: number;
  readonly engraved?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const SteampunkCard = /* @__PURE__ */ forwardRef<HTMLDivElement, SteampunkCardProps>(
  function SteampunkCard(
    {
      variant = "copper",
      elevation = 2,
      engraved = true,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeSteampunkStyle({
      variant,
      elevation,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: "6px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      engraved
        ? createElement("div", {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              top: "4px",
              left: "4px",
              right: "4px",
              bottom: "4px",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              borderRadius: "4px",
              pointerEvents: "none",
            },
          })
        : null,
      children,
    );
  },
);

export interface SteampunkPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: SteampunkVariant;
  readonly title?: string;
  readonly riveted?: boolean;
  readonly elevation?: number;
  readonly children?: ReactNode;
}

export const SteampunkPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, SteampunkPanelProps>(
  function SteampunkPanel(
    {
      variant = "bronze",
      title,
      riveted = true,
      elevation = 1,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeSteampunkStyle({
      variant,
      elevation,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: riveted ? "28px" : "20px",
      background: computed.background,
      border: computed.border,
      borderRadius: "6px",
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    const renderScrew = (pos: CSSProperties, key: string) =>
      createElement("span", {
        key,
        "aria-hidden": "true",
        style: {
          position: "absolute",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #ffd700 0%, #b8860b 60%, #4a3726 100%)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.6)",
          ...pos,
        },
      });

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      riveted
        ? [
            renderScrew({ top: "8px", left: "8px" }, "screw-tl"),
            renderScrew({ top: "8px", right: "8px" }, "screw-tr"),
            renderScrew({ bottom: "8px", left: "8px" }, "screw-bl"),
            renderScrew({ bottom: "8px", right: "8px" }, "screw-br"),
          ]
        : null,
      title
        ? createElement(
            "h3",
            {
              style: {
                marginTop: 0,
                marginBottom: "12px",
                fontSize: "17px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#ffd700",
                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              },
            },
            title,
          )
        : null,
      children,
    );
  },
);

export interface SteampunkInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: SteampunkVariant;
  readonly highContrast?: boolean;
}

export const SteampunkInput = /* @__PURE__ */ forwardRef<HTMLInputElement, SteampunkInputProps>(
  function SteampunkInput(
    {
      variant = "brass",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeSteampunkStyle({
      variant,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      padding: "10px 14px",
      fontSize: "14px",
      fontFamily: "IM Fell English, Georgia, serif",
      color: variant === "parchment" ? "#2d1f10" : "#2a1d04",
      background: variant === "parchment" ? "#f5ecda" : "#e8dcbe",
      border: computed.border,
      borderRadius: "3px",
      boxShadow: isFocused ? "inset 0 2px 4px rgba(0,0,0,0.3), 0 0 8px rgba(212, 175, 55, 0.7)" : "inset 0 2px 4px rgba(0, 0, 0, 0.25)",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface SteampunkDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "gear" | "bracket";
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export const SteampunkDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, SteampunkDecorationProps>(
  function SteampunkDecoration(
    {
      shape = "gear",
      color = "#d4af37",
      size = 36,
      strokeWidth = 2,
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    const isGear = shape === "gear";
    const d = isGear ? STEAMPUNK_GEAR_PATH : STEAMPUNK_BRACKET_PATH;
    const viewBox = isGear ? "0 0 54 54" : "0 0 40 40";

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox,
          fill: isGear ? color : "none",
          stroke: isGear ? "#3d2b1f" : color,
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Grunge React Components (Prompt 68)
// ============================================================================

export interface GrungeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: GrungeVariant;
  readonly roughEdges?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const GrungeButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, GrungeButtonProps>(
  function GrungeButton(
    {
      variant = "distressed-paper",
      roughEdges = true,
      elevation = 1,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeGrungeStyle({
      variant,
      elevation,
      roughEdges,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("grunge");
    const focusOutlineColor = variant === "zine-dark" ? "#e63946" : "#000000";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 900,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? `3px dashed ${focusOutlineColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translate(2px, 2px)"
            : isHovered
              ? "rotate(-1.5deg) scale(1.02)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface GrungeCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: GrungeVariant;
  readonly roughEdges?: boolean;
  readonly elevation?: number;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const GrungeCard = /* @__PURE__ */ forwardRef<HTMLDivElement, GrungeCardProps>(
  function GrungeCard(
    {
      variant = "distressed-paper",
      roughEdges = true,
      elevation = 1,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeGrungeStyle({
      variant,
      elevation,
      roughEdges,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface GrungePanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: GrungeVariant;
  readonly roughEdges?: boolean;
  readonly elevation?: number;
  readonly tape?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const GrungePanel = /* @__PURE__ */ forwardRef<HTMLDivElement, GrungePanelProps>(
  function GrungePanel(
    {
      variant = "distressed-paper",
      roughEdges = true,
      elevation = 1,
      tape = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeGrungeStyle({
      variant,
      elevation,
      roughEdges,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "28px 24px 24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      tape
        ? createElement("div", {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%) rotate(-1.5deg)",
              width: "120px",
              height: "24px",
              background: "rgba(235, 225, 200, 0.9)",
              border: "1px dashed rgba(160, 140, 110, 0.4)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              zIndex: 1,
            },
          })
        : null,
      children,
    );
  },
);

export interface GrungeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: GrungeVariant;
  readonly roughEdges?: boolean;
  readonly highContrast?: boolean;
}

export const GrungeInput = /* @__PURE__ */ forwardRef<HTMLInputElement, GrungeInputProps>(
  function GrungeInput(
    {
      variant = "distressed-paper",
      roughEdges = true,
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeGrungeStyle({
      variant,
      roughEdges,
      highContrast,
    });

    const focusBorder = variant === "zine-dark" ? "2px solid #e63946" : "2px solid #000000";

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      background: computed.background,
      border: isFocused ? focusBorder : computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: isFocused ? "3px 3px 0px rgba(0,0,0,0.8)" : "2px 2px 0px rgba(0,0,0,0.5)",
      color: computed.color,
      fontFamily: "'Courier Prime', monospace, sans-serif",
      fontSize: "14px",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "border 150ms ease, box-shadow 150ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface GrungeDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "tape" | "splatter" | "scratch";
  readonly size?: number | string;
  readonly color?: string;
}

export const GrungeDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, GrungeDecorationProps>(
  function GrungeDecoration(
    {
      shape = "tape",
      size = 48,
      color = "#1a1a1a",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = GRUNGE_TAPE_PATH;
    let viewBox = "0 0 156 30";
    let isStroke = false;

    if (shape === "splatter") {
      d = GRUNGE_SPLATTER_PATH;
      viewBox = "0 0 54 50";
      isStroke = false;
    } else if (shape === "scratch") {
      d = GRUNGE_SCRATCH_PATH;
      viewBox = "0 0 50 50";
      isStroke = true;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: typeof size === "number" ? size : undefined,
          height: typeof size === "number" && shape === "tape" ? Math.round(Number(size) * 0.35) : size,
          viewBox,
          fill: isStroke ? "none" : color,
          stroke: isStroke ? color : "none",
          strokeWidth: isStroke ? 2 : 0,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Paper Cutout React Components (Prompt 68)
// ============================================================================

export interface PaperCutoutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: PaperCutoutVariant;
  readonly elevation?: number;
  readonly foldedCorner?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const PaperCutoutButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, PaperCutoutButtonProps>(
  function PaperCutoutButton(
    {
      variant = "cardstock",
      elevation = 1,
      foldedCorner = false,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computePaperCutoutStyle({
      variant,
      elevation,
      foldedCorner,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("paper-cutout");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 26px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 700,
      letterSpacing: "0.01em",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? "2px solid rgba(0, 0, 0, 0.4)" : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translateY(1px)"
            : isHovered
              ? "translateY(-2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface PaperCutoutCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: PaperCutoutVariant;
  readonly elevation?: number;
  readonly foldedCorner?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const PaperCutoutCard = /* @__PURE__ */ forwardRef<HTMLDivElement, PaperCutoutCardProps>(
  function PaperCutoutCard(
    {
      variant = "cardstock",
      elevation = 2,
      foldedCorner = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computePaperCutoutStyle({
      variant,
      elevation,
      foldedCorner,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "26px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface PaperCutoutPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: PaperCutoutVariant;
  readonly elevation?: number;
  readonly layers?: number;
  readonly foldedCorner?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const PaperCutoutPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, PaperCutoutPanelProps>(
  function PaperCutoutPanel(
    {
      variant = "cardstock",
      elevation = 1,
      layers = 1,
      foldedCorner = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computePaperCutoutStyle({
      variant,
      elevation,
      foldedCorner,
      highContrast,
    });

    const extraShadow = layers > 1
      ? `${computed.boxShadow}, 0 0 0 1px rgba(0,0,0,0.04), 6px 6px 0 -2px ${variant === "kraft" ? "#ebdcc6" : "#f4f3ef"}, 6px 6px 14px rgba(0,0,0,0.08)`
      : computed.boxShadow;

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: extraShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      children,
    );
  },
);

export interface PaperCutoutInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: PaperCutoutVariant;
  readonly highContrast?: boolean;
}

export const PaperCutoutInput = /* @__PURE__ */ forwardRef<HTMLInputElement, PaperCutoutInputProps>(
  function PaperCutoutInput(
    {
      variant = "cardstock",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computePaperCutoutStyle({
      variant,
      elevation: 0,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 16px",
      background: computed.background,
      border: computed.border,
      borderRadius: "12px",
      boxShadow: isFocused
        ? "inset 0 2px 4px rgba(0,0,0,0.08), 0 0 0 3px rgba(0,0,0,0.1)"
        : "inset 0 1px 3px rgba(0,0,0,0.06)",
      color: computed.color,
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "box-shadow 150ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface PaperCutoutDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "wave" | "folded-corner" | "perforation";
  readonly size?: number | string;
  readonly color?: string;
}

export const PaperCutoutDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, PaperCutoutDecorationProps>(
  function PaperCutoutDecoration(
    {
      shape = "wave",
      size = 48,
      color = "#c8bfaf",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = PAPER_CUTOUT_WAVE_PATH;
    let viewBox = "0 0 300 60";
    let isStroke = false;

    if (shape === "folded-corner") {
      d = PAPER_FOLDED_CORNER_PATH;
      viewBox = "0 0 30 30";
      isStroke = false;
    } else if (shape === "perforation") {
      d = PAPER_PERFORATION_PATH;
      viewBox = "0 0 106 10";
      isStroke = true;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: typeof size === "number" && (shape === "wave" || shape === "perforation") ? size : (typeof size === "number" ? size : undefined),
          height: typeof size === "number" && shape === "wave" ? Math.round(Number(size) * 0.2) : (typeof size === "number" && shape === "perforation" ? Math.round(Number(size) * 0.1) : size),
          viewBox,
          fill: isStroke ? "none" : color,
          stroke: isStroke ? color : "none",
          strokeWidth: isStroke ? 2 : 0,
          strokeDasharray: isStroke ? "4 4" : undefined,
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Glitch React Components (Prompt 68)
// ============================================================================

export interface GlitchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: GlitchVariant;
  readonly elevation?: number;
  readonly scanlines?: boolean;
  readonly chromaticAberration?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const GlitchButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, GlitchButtonProps>(
  function GlitchButton(
    {
      variant = "cyber-terminal",
      elevation = 1,
      scanlines = false,
      chromaticAberration = true,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeGlitchStyle({
      variant,
      elevation,
      scanlines,
      chromaticAberration,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("glitch");
    const focusOutline = variant === "matrix-green" ? "2px solid #00ff66" : "2px solid #00ffff";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 800,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      backgroundColor: computed.background,
      backgroundImage: computed.backgroundImage,
      backgroundSize: computed.backgroundSize,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? focusOutline : "none",
      outlineOffset: "2px",
      transition: reducedMotion ? "opacity 100ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? "translate(-1px, 1px)"
            : isHovered
              ? "translate(2px, -2px)"
              : "none"
          : "none",
      userSelect: "none",
      backdropFilter: computed.backdropFilter,
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface GlitchCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: GlitchVariant;
  readonly elevation?: number;
  readonly scanlines?: boolean;
  readonly chromaticAberration?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const GlitchCard = /* @__PURE__ */ forwardRef<HTMLDivElement, GlitchCardProps>(
  function GlitchCard(
    {
      variant = "cyber-terminal",
      elevation = 1,
      scanlines = true,
      chromaticAberration = true,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeGlitchStyle({
      variant,
      elevation,
      scanlines,
      chromaticAberration,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      backgroundColor: computed.background,
      backgroundImage: computed.backgroundImage,
      backgroundSize: computed.backgroundSize,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      fontFamily: computed.fontFamily,
      backdropFilter: computed.backdropFilter,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface GlitchPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: GlitchVariant;
  readonly elevation?: number;
  readonly scanlines?: boolean;
  readonly chromaticAberration?: boolean;
  readonly hudHeader?: string;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const GlitchPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, GlitchPanelProps>(
  function GlitchPanel(
    {
      variant = "cyber-terminal",
      elevation = 1,
      scanlines = true,
      chromaticAberration = true,
      hudHeader,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeGlitchStyle({
      variant,
      elevation,
      scanlines,
      chromaticAberration,
      highContrast,
    });

    const headerColor = variant === "matrix-green" ? "#00ff66" : "#00ffff";

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: hudHeader ? "14px 20px 20px" : "22px",
      backgroundColor: computed.background,
      backgroundImage: computed.backgroundImage,
      backgroundSize: computed.backgroundSize,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      fontFamily: computed.fontFamily,
      backdropFilter: computed.backdropFilter,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      hudHeader
        ? createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "8px",
                marginBottom: "14px",
                borderBottom: `1px solid ${headerColor}`,
                fontSize: "11px",
                letterSpacing: "0.12em",
                color: headerColor,
                textTransform: "uppercase",
              },
            },
            createElement("span", null, hudHeader),
            createElement("span", {
              style: {
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: headerColor,
                boxShadow: `0 0 8px ${headerColor}`,
              },
            }),
          )
        : null,
      children,
    );
  },
);

export interface GlitchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: GlitchVariant;
  readonly scanlines?: boolean;
  readonly highContrast?: boolean;
}

export const GlitchInput = /* @__PURE__ */ forwardRef<HTMLInputElement, GlitchInputProps>(
  function GlitchInput(
    {
      variant = "cyber-terminal",
      scanlines = false,
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeGlitchStyle({
      variant,
      scanlines,
      highContrast,
    });

    const caretColor = variant === "matrix-green" ? "#00ff66" : "#00ffff";
    const focusBorder = variant === "matrix-green" ? "1px solid #00ff66" : "1px solid #ff0055";

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      backgroundColor: computed.background,
      backgroundImage: computed.backgroundImage,
      backgroundSize: computed.backgroundSize,
      border: isFocused ? focusBorder : computed.border,
      borderRadius: "0px",
      boxShadow: isFocused ? "-2px 0 0 #ff0055, 2px 0 0 #00ffff" : "none",
      color: computed.color,
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "14px",
      caretColor,
      outline: "none",
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "border 100ms ease, box-shadow 100ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface GlitchDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "crosshair" | "barcode" | "corner-tech";
  readonly size?: number | string;
  readonly color?: string;
}

export const GlitchDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, GlitchDecorationProps>(
  function GlitchDecoration(
    {
      shape = "crosshair",
      size = 32,
      color = "#00ffff",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = GLITCH_CROSSHAIR_PATH;
    let viewBox = "0 0 30 30";
    let isStroke = true;

    if (shape === "barcode") {
      d = GLITCH_BARCODE_PATH;
      viewBox = "0 0 40 24";
      isStroke = true;
    } else if (shape === "corner-tech") {
      d = GLITCH_CORNER_TECH_PATH;
      viewBox = "0 0 20 20";
      isStroke = true;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: typeof size === "number" && shape === "barcode" ? Math.round(Number(size) * 0.6) : size,
          viewBox,
          fill: "none",
          stroke: color,
          strokeWidth: 2,
          strokeLinecap: "square",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Anti-Design React Components (Prompt 69)
// ============================================================================

export interface AntiDesignButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: AntiDesignVariant;
  readonly elevation?: number;
  readonly asymmetrical?: boolean;
  readonly tilted?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const AntiDesignButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, AntiDesignButtonProps>(
  function AntiDesignButton(
    {
      variant = "toxic-yellow",
      elevation = 1,
      asymmetrical = true,
      tilted = false,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeAntiDesignStyle({
      variant,
      elevation,
      asymmetrical,
      tilted,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("anti-design");
    const focusColor = variant === "toxic-yellow" ? "#ff00ff" : "#ffff00";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 26px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 900,
      letterSpacing: "-0.02em",
      textTransform: "uppercase",
      lineHeight: 1.2,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? `3px solid ${focusColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 120ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translate(3px, 3px) rotate(0deg)"
            : isHovered
              ? "rotate(3deg) scale(1.04)"
              : computed.transform || "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface AntiDesignCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: AntiDesignVariant;
  readonly elevation?: number;
  readonly asymmetrical?: boolean;
  readonly tilted?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const AntiDesignCard = /* @__PURE__ */ forwardRef<HTMLDivElement, AntiDesignCardProps>(
  function AntiDesignCard(
    {
      variant = "toxic-yellow",
      elevation = 1,
      asymmetrical = true,
      tilted = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeAntiDesignStyle({
      variant,
      elevation,
      asymmetrical,
      tilted,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      transform: computed.transform,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface AntiDesignPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: AntiDesignVariant;
  readonly elevation?: number;
  readonly asymmetrical?: boolean;
  readonly tilted?: boolean;
  readonly hazardStripe?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const AntiDesignPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, AntiDesignPanelProps>(
  function AntiDesignPanel(
    {
      variant = "toxic-yellow",
      elevation = 1,
      asymmetrical = true,
      tilted = false,
      hazardStripe = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeAntiDesignStyle({
      variant,
      elevation,
      asymmetrical,
      tilted,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: hazardStripe ? "34px 24px 24px" : "26px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      transform: computed.transform,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      hazardStripe
        ? createElement("div", {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "12px",
              background: "repeating-linear-gradient(-45deg, #000000, #000000 10px, #ffff00 10px, #ffff00 20px)",
              borderBottom: "2px solid #000000",
            },
          })
        : null,
      children,
    );
  },
);

export interface AntiDesignInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: AntiDesignVariant;
  readonly highContrast?: boolean;
}

export const AntiDesignInput = /* @__PURE__ */ forwardRef<HTMLInputElement, AntiDesignInputProps>(
  function AntiDesignInput(
    {
      variant = "toxic-yellow",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeAntiDesignStyle({
      variant,
      highContrast,
    });

    const focusBorder = variant === "toxic-yellow" ? "3px solid #ff00ff" : "3px solid #ffff00";

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      background: computed.background,
      border: isFocused ? focusBorder : computed.border,
      borderRadius: "0px",
      boxShadow: isFocused ? "4px 4px 0px #000000" : "2px 2px 0px #000000",
      color: computed.color,
      fontFamily: "'Courier New', monospace",
      fontSize: "14px",
      fontWeight: 700,
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "border 120ms ease, box-shadow 120ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface AntiDesignDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "stripes" | "cross" | "burst";
  readonly size?: number | string;
  readonly color?: string;
}

export const AntiDesignDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, AntiDesignDecorationProps>(
  function AntiDesignDecoration(
    {
      shape = "stripes",
      size = 48,
      color = "#000000",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = ANTI_DESIGN_STRIPES_PATH;
    let viewBox = "0 0 105 40";
    let isStroke = false;

    if (shape === "cross") {
      d = ANTI_DESIGN_CROSS_PATH;
      viewBox = "0 0 40 40";
      isStroke = true;
    } else if (shape === "burst") {
      d = ANTI_DESIGN_BURST_PATH;
      viewBox = "0 0 52 52";
      isStroke = false;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: typeof size === "number" && shape === "stripes" ? size : (typeof size === "number" ? size : undefined),
          height: typeof size === "number" && shape === "stripes" ? Math.round(Number(size) * 0.38) : size,
          viewBox,
          fill: isStroke ? "none" : color,
          stroke: isStroke ? color : "none",
          strokeWidth: isStroke ? 4 : 0,
          strokeLinecap: "square",
          strokeLinejoin: "miter",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// 3D Inflated React Components (Prompt 69)
// ============================================================================

export interface Inflated3DButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Inflated3DVariant;
  readonly elevation?: number;
  readonly pill?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const Inflated3DButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, Inflated3DButtonProps>(
  function Inflated3DButton(
    {
      variant = "bubblegum-pink",
      elevation = 1,
      pill = true,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = compute3DInflatedStyle({
      variant,
      elevation,
      pill,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("3d-inflated");

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: pill ? "14px 32px" : "16px 28px",
      fontFamily: computed.fontFamily,
      fontSize: "16px",
      fontWeight: 800,
      letterSpacing: "0.01em",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? "3px solid rgba(255, 255, 255, 0.9)" : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 150ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "scale(0.96)"
            : isHovered
              ? "scale(1.05) translateY(-2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface Inflated3DCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: Inflated3DVariant;
  readonly elevation?: number;
  readonly pill?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const Inflated3DCard = /* @__PURE__ */ forwardRef<HTMLDivElement, Inflated3DCardProps>(
  function Inflated3DCard(
    {
      variant = "bubblegum-pink",
      elevation = 1,
      pill = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = compute3DInflatedStyle({
      variant,
      elevation,
      pill,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface Inflated3DPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: Inflated3DVariant;
  readonly elevation?: number;
  readonly pill?: boolean;
  readonly glossBadge?: string;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const Inflated3DPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, Inflated3DPanelProps>(
  function Inflated3DPanel(
    {
      variant = "bubblegum-pink",
      elevation = 1,
      pill = false,
      glossBadge,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = compute3DInflatedStyle({
      variant,
      elevation,
      pill,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: glossBadge ? "36px 28px 28px" : "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      glossBadge
        ? createElement(
            "div",
            {
              style: {
                position: "absolute",
                top: "-12px",
                left: "24px",
                padding: "4px 14px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15), inset 0 1px 2px #ffffff",
                color: "#e03166",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              },
            },
            glossBadge,
          )
        : null,
      children,
    );
  },
);

export interface Inflated3DInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: Inflated3DVariant;
  readonly highContrast?: boolean;
}

export const Inflated3DInput = /* @__PURE__ */ forwardRef<HTMLInputElement, Inflated3DInputProps>(
  function Inflated3DInput(
    {
      variant = "bubblegum-pink",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = variant === "mallow-lavender" ? "#c084fc" : variant === "cloud-cyan" ? "#38bdf8" : variant === "sunny-peach" ? "#fb923c" : "#ff8da1";

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "12px 20px",
      background: "#ffffff",
      border: highContrast ? "2px solid #000000" : `2px solid ${borderColor}`,
      borderRadius: "9999px",
      boxShadow: isFocused
        ? `inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 4px ${borderColor}44`
        : "inset 0 2px 4px rgba(0,0,0,0.06)",
      color: "#1e293b",
      fontFamily: "'Nunito', sans-serif",
      fontSize: "15px",
      fontWeight: 600,
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "box-shadow 150ms ease, border-color 150ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface Inflated3DDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "bubble" | "pill" | "cloud";
  readonly size?: number | string;
  readonly color?: string;
}

export const Inflated3DDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, Inflated3DDecorationProps>(
  function Inflated3DDecoration(
    {
      shape = "bubble",
      size = 48,
      color = "#ff5c8a",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = INFLATED_3D_BUBBLE_PATH;
    let viewBox = "0 0 50 50";

    if (shape === "pill") {
      d = INFLATED_3D_PILL_PATH;
      viewBox = "0 0 50 50";
    } else if (shape === "cloud") {
      d = INFLATED_3D_CLOUD_PATH;
      viewBox = "0 0 54 44";
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: typeof size === "number" && shape === "cloud" ? Math.round(Number(size) * 0.8) : size,
          viewBox,
          fill: color,
          stroke: "none",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Isometric React Components (Prompt 69)
// ============================================================================

export interface IsometricButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: IsometricVariant;
  readonly elevation?: number;
  readonly extruded?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const IsometricButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, IsometricButtonProps>(
  function IsometricButton(
    {
      variant = "cobalt-blueprint",
      elevation = 1,
      extruded = true,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeIsometricStyle({
      variant,
      elevation,
      extruded,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("isometric");
    const focusColor = variant === "emerald-matrix" ? "#00ff88" : "#00f0ff";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 26px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 700,
      letterSpacing: "0.02em",
      textTransform: "uppercase",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? `2px solid ${focusColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 120ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translate(3px, 3px)"
            : isHovered
              ? "translate(-2px, -2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface IsometricCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: IsometricVariant;
  readonly elevation?: number;
  readonly extruded?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const IsometricCard = /* @__PURE__ */ forwardRef<HTMLDivElement, IsometricCardProps>(
  function IsometricCard(
    {
      variant = "cobalt-blueprint",
      elevation = 1,
      extruded = true,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeIsometricStyle({
      variant,
      elevation,
      extruded,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface IsometricPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: IsometricVariant;
  readonly elevation?: number;
  readonly extruded?: boolean;
  readonly orthoGrid?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const IsometricPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, IsometricPanelProps>(
  function IsometricPanel(
    {
      variant = "cobalt-blueprint",
      elevation = 1,
      extruded = true,
      orthoGrid = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeIsometricStyle({
      variant,
      elevation,
      extruded,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "26px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...(orthoGrid
        ? {
            backgroundImage: "linear-gradient(30deg, rgba(0, 240, 255, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(0, 240, 255, 0.05) 87.5%), linear-gradient(150deg, rgba(0, 240, 255, 0.05) 12%, transparent 12.5%, transparent 87%, rgba(0, 240, 255, 0.05) 87.5%)",
            backgroundSize: "20px 35px",
          }
        : {}),
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      children,
    );
  },
);

export interface IsometricInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: IsometricVariant;
  readonly highContrast?: boolean;
}

export const IsometricInput = /* @__PURE__ */ forwardRef<HTMLInputElement, IsometricInputProps>(
  function IsometricInput(
    {
      variant = "cobalt-blueprint",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeIsometricStyle({
      variant,
      extruded: false,
      highContrast,
    });

    const focusBorder = variant === "emerald-matrix" ? "1.5px solid #00ff88" : "1.5px solid #00f0ff";

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      background: computed.background,
      border: isFocused ? focusBorder : computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: isFocused ? "2px 2px 0px rgba(0, 240, 255, 0.4)" : "none",
      color: computed.color,
      fontFamily: "'Space Grotesk', monospace, sans-serif",
      fontSize: "14px",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "border 120ms ease, box-shadow 120ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface IsometricDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "cube" | "grid" | "pyramid";
  readonly size?: number | string;
  readonly color?: string;
}

export const IsometricDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, IsometricDecorationProps>(
  function IsometricDecoration(
    {
      shape = "cube",
      size = 48,
      color = "#00f0ff",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = ISOMETRIC_CUBE_PATH;
    let viewBox = "0 0 50 54";

    if (shape === "grid") {
      d = ISOMETRIC_GRID_PATH;
      viewBox = "0 0 50 56";
    } else if (shape === "pyramid") {
      d = ISOMETRIC_PYRAMID_PATH;
      viewBox = "0 0 50 50";
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox,
          fill: "none",
          stroke: color,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Ukiyo-e React Components (Prompt 70)
// ============================================================================

export interface UkiyoeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: UkiyoeVariant;
  readonly elevation?: number;
  readonly woodblockBorder?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const UkiyoeButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, UkiyoeButtonProps>(
  function UkiyoeButton(
    {
      variant = "indigo-wave",
      elevation = 1,
      woodblockBorder = true,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeUkiyoeStyle({
      variant,
      elevation,
      woodblockBorder,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("ukiyo-e");
    const focusColor = variant === "vermilion-sun" ? "#ff4d3a" : "#c93a2b";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 600,
      letterSpacing: "0.04em",
      lineHeight: 1.3,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? `2px solid ${focusColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 120ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translateY(1px)"
            : isHovered
              ? "translateY(-1px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface UkiyoeCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: UkiyoeVariant;
  readonly elevation?: number;
  readonly woodblockBorder?: boolean;
  readonly washiTexture?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const UkiyoeCard = /* @__PURE__ */ forwardRef<HTMLDivElement, UkiyoeCardProps>(
  function UkiyoeCard(
    {
      variant = "indigo-wave",
      elevation = 1,
      woodblockBorder = true,
      washiTexture = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeUkiyoeStyle({
      variant,
      elevation,
      woodblockBorder,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...(washiTexture
        ? {
            backgroundImage: "radial-gradient(rgba(201, 58, 43, 0.05) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }
        : {}),
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface UkiyoePanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: UkiyoeVariant;
  readonly elevation?: number;
  readonly woodblockBorder?: boolean;
  readonly hankoSeal?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const UkiyoePanel = /* @__PURE__ */ forwardRef<HTMLDivElement, UkiyoePanelProps>(
  function UkiyoePanel(
    {
      variant = "indigo-wave",
      elevation = 1,
      woodblockBorder = true,
      hankoSeal = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeUkiyoeStyle({
      variant,
      elevation,
      woodblockBorder,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      children,
      hankoSeal
        ? createElement(
            "div",
            {
              "aria-hidden": "true",
              style: {
                position: "absolute",
                top: "14px",
                right: "14px",
                opacity: 0.85,
                pointerEvents: "none",
              },
            },
            createElement(
              "svg",
              {
                width: 24,
                height: 24,
                viewBox: "0 0 40 40",
                fill: "none",
                stroke: "#c93a2b",
                strokeWidth: 2,
              },
              createElement("path", { d: UKIYOE_HANKO_PATH }),
            ),
          )
        : null,
    );
  },
);

export interface UkiyoeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: UkiyoeVariant;
  readonly woodblockBorder?: boolean;
  readonly highContrast?: boolean;
}

export const UkiyoeInput = /* @__PURE__ */ forwardRef<HTMLInputElement, UkiyoeInputProps>(
  function UkiyoeInput(
    {
      variant = "sumi-wash",
      woodblockBorder = true,
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeUkiyoeStyle({
      variant,
      woodblockBorder,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      background: computed.background,
      border: isFocused ? "2px solid #c93a2b" : computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: isFocused ? "0 0 0 2px rgba(201, 58, 43, 0.25)" : "none",
      color: computed.color,
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "border 150ms ease, box-shadow 150ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface UkiyoeDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "wave" | "cloud" | "hanko";
  readonly size?: number | string;
  readonly color?: string;
}

export const UkiyoeDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, UkiyoeDecorationProps>(
  function UkiyoeDecoration(
    {
      shape = "wave",
      size = 48,
      color = "#c93a2b",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = UKIYOE_WAVE_PATH;
    let viewBox = "0 0 200 50";
    let fill = "none";
    let stroke = color;

    if (shape === "cloud") {
      d = UKIYOE_CLOUD_PATH;
      viewBox = "0 0 55 35";
      fill = "none";
      stroke = color;
    } else if (shape === "hanko") {
      d = UKIYOE_HANKO_PATH;
      viewBox = "0 0 40 40";
      fill = "none";
      stroke = color;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: shape === "wave" && typeof size === "number" ? size * 2 : size,
          height: size,
          viewBox,
          fill,
          stroke,
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Brutalism React Components (Prompt 70)
// ============================================================================

export interface BrutalistButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: BrutalistVariant;
  readonly elevation?: number;
  readonly thickBorder?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const BrutalistButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, BrutalistButtonProps>(
  function BrutalistButton(
    {
      variant = "mono-stark",
      elevation = 1,
      thickBorder = true,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeBrutalistStyle({
      variant,
      elevation,
      thickBorder,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("brutalism");
    const focusColor = "#000000";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 28px",
      fontFamily: computed.fontFamily,
      fontSize: "15px",
      fontWeight: 900,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      lineHeight: 1.2,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: isEngaged ? "1px 1px 0px #000000" : isHovered ? "7px 7px 0px #000000" : computed.boxShadow,
      color: computed.color,
      outline: isFocused ? `3px dashed ${focusColor}` : "none",
      outlineOffset: "4px",
      transition: reducedMotion ? "opacity 80ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translate(4px, 4px)"
            : isHovered
              ? "translate(-2px, -2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface BrutalistCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: BrutalistVariant;
  readonly elevation?: number;
  readonly thickBorder?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const BrutalistCard = /* @__PURE__ */ forwardRef<HTMLDivElement, BrutalistCardProps>(
  function BrutalistCard(
    {
      variant = "mono-stark",
      elevation = 1,
      thickBorder = true,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeBrutalistStyle({
      variant,
      elevation,
      thickBorder,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface BrutalistPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: BrutalistVariant;
  readonly elevation?: number;
  readonly thickBorder?: boolean;
  readonly scaffoldGrid?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const BrutalistPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, BrutalistPanelProps>(
  function BrutalistPanel(
    {
      variant = "concrete-gray",
      elevation = 1,
      thickBorder = true,
      scaffoldGrid = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeBrutalistStyle({
      variant,
      elevation,
      thickBorder,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...(scaffoldGrid
        ? {
            backgroundImage: "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }
        : {}),
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      children,
    );
  },
);

export interface BrutalistInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: BrutalistVariant;
  readonly thickBorder?: boolean;
  readonly highContrast?: boolean;
}

export const BrutalistInput = /* @__PURE__ */ forwardRef<HTMLInputElement, BrutalistInputProps>(
  function BrutalistInput(
    {
      variant = "mono-stark",
      thickBorder = true,
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeBrutalistStyle({
      variant,
      thickBorder,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "12px 14px",
      background: "#ffffff",
      border: computed.border,
      borderRadius: "0px",
      boxShadow: isFocused ? "4px 4px 0px #000000" : "none",
      color: "#000000",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 700,
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "box-shadow 80ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface BrutalistDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "crosshair" | "corner" | "arrow";
  readonly size?: number | string;
  readonly color?: string;
}

export const BrutalistDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, BrutalistDecorationProps>(
  function BrutalistDecoration(
    {
      shape = "crosshair",
      size = 32,
      color = "#000000",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = BRUTALIST_CROSSHAIR_PATH;
    let viewBox = "0 0 30 30";

    if (shape === "corner") {
      d = BRUTALIST_CORNER_PATH;
      viewBox = "0 0 20 20";
    } else if (shape === "arrow") {
      d = BRUTALIST_ARROW_PATH;
      viewBox = "0 0 30 35";
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox,
          fill: "none",
          stroke: color,
          strokeWidth: 3,
          strokeLinecap: "square",
          strokeLinejoin: "miter",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Bauhaus React Components (Prompt 70)
// ============================================================================

export interface BauhausButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: BauhausVariant;
  readonly elevation?: number;
  readonly shapeForm?: "square" | "circle" | "standard";
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const BauhausButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, BauhausButtonProps>(
  function BauhausButton(
    {
      variant = "primary-red",
      elevation = 0,
      shapeForm = "standard",
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeBauhausStyle({
      variant,
      elevation,
      shapeForm,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("bauhaus");
    const focusColor = "#0047AB";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: shapeForm === "circle" ? "18px" : "12px 26px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      lineHeight: 1.25,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: isEngaged ? "none" : isHovered ? "4px 4px 0px #000000" : computed.boxShadow,
      color: computed.color,
      outline: isFocused ? `2px solid ${focusColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 140ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translateY(2px)"
            : isHovered
              ? "translateY(-2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface BauhausCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: BauhausVariant;
  readonly elevation?: number;
  readonly shapeForm?: "square" | "circle" | "standard";
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const BauhausCard = /* @__PURE__ */ forwardRef<HTMLDivElement, BauhausCardProps>(
  function BauhausCard(
    {
      variant = "rational-white",
      elevation = 1,
      shapeForm = "standard",
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeBauhausStyle({
      variant,
      elevation,
      shapeForm,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface BauhausPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: BauhausVariant;
  readonly elevation?: number;
  readonly primaryBadge?: "red" | "blue" | "yellow";
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const BauhausPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, BauhausPanelProps>(
  function BauhausPanel(
    {
      variant = "rational-white",
      elevation = 1,
      primaryBadge,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeBauhausStyle({
      variant,
      elevation,
      highContrast,
    });

    const badgeBg =
      primaryBadge === "red"
        ? "#EF476F"
        : primaryBadge === "blue"
          ? "#0047AB"
          : primaryBadge === "yellow"
            ? "#FFD166"
            : null;

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      badgeBg
        ? createElement("div", {
            "aria-hidden": "true",
            style: {
              position: "absolute",
              top: "0px",
              right: "0px",
              width: "28px",
              height: "28px",
              background: badgeBg,
              borderLeft: "2px solid #000000",
              borderBottom: "2px solid #000000",
            },
          })
        : null,
      children,
    );
  },
);

export interface BauhausInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: BauhausVariant;
  readonly highContrast?: boolean;
}

export const BauhausInput = /* @__PURE__ */ forwardRef<HTMLInputElement, BauhausInputProps>(
  function BauhausInput(
    {
      variant = "rational-white",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeBauhausStyle({
      variant,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 14px",
      background: computed.background,
      border: computed.border,
      borderRadius: "0px",
      boxShadow: isFocused ? "3px 3px 0px #0047AB" : "none",
      color: computed.color,
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "box-shadow 120ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface BauhausDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "triangle" | "circle" | "square";
  readonly size?: number | string;
  readonly color?: string;
}

export const BauhausDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, BauhausDecorationProps>(
  function BauhausDecoration(
    {
      shape = "triangle",
      size = 40,
      color,
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = BAUHAUS_TRIANGLE_PATH;
    const defaultColor = shape === "triangle" ? "#EF476F" : shape === "circle" ? "#0047AB" : "#FFD166";
    const fillColor = color || defaultColor;

    if (shape === "circle") {
      d = BAUHAUS_CIRCLE_PATH;
    } else if (shape === "square") {
      d = BAUHAUS_SQUARE_PATH;
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 50 50",
          fill: fillColor,
          stroke: "#000000",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Mid-Century Modern React Components (Prompt 70)
// ============================================================================

export interface MidCenturyModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: MidCenturyModernVariant;
  readonly elevation?: number;
  readonly kidneyCurve?: boolean;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly active?: boolean;
  readonly children?: ReactNode;
}

export const MidCenturyModernButton = /* @__PURE__ */ forwardRef<HTMLButtonElement, MidCenturyModernButtonProps>(
  function MidCenturyModernButton(
    {
      variant = "warm-teak",
      elevation = 1,
      kidneyCurve = false,
      highContrast = false,
      reducedMotion = false,
      active = false,
      disabled = false,
      className,
      style,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...buttonProps
    },
    forwardedRef,
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isEngaged = active || isPressed;
    const computed = computeMidCenturyModernStyle({
      variant,
      elevation,
      kidneyCurve,
      pressed: isEngaged,
      highContrast,
    });

    const motionConfig = getStyleMotionConfig("mid-century-modern");
    const focusColor = "#c17c4e";

    const mergedStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 26px",
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      fontWeight: 600,
      letterSpacing: "0.04em",
      lineHeight: 1.3,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      textShadow: computed.textShadow,
      outline: isFocused ? `2px solid ${focusColor}` : "none",
      outlineOffset: "3px",
      transition: reducedMotion ? "opacity 160ms ease" : motionConfig.transition,
      transform:
        !reducedMotion && !disabled
          ? isEngaged
            ? computed.transform || "translateY(2px)"
            : isHovered
              ? "translateY(-2px)"
              : "none"
          : "none",
      userSelect: "none",
      ...style,
    };

    return createElement(
      "button",
      {
        ...buttonProps,
        ref: forwardedRef,
        disabled,
        className,
        style: mergedStyle,
        onMouseEnter: (e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        },
        onMouseLeave: (e) => {
          setIsHovered(false);
          setIsPressed(false);
          onMouseLeave?.(e);
        },
        onMouseDown: (e) => {
          if (!disabled) setIsPressed(true);
          onMouseDown?.(e);
        },
        onMouseUp: (e) => {
          setIsPressed(false);
          onMouseUp?.(e);
        },
        onFocus: (e) => {
          setIsFocused(true);
          onFocus?.(e);
        },
        onBlur: (e) => {
          setIsFocused(false);
          setIsPressed(false);
          onBlur?.(e);
        },
      },
      children,
    );
  },
);

export interface MidCenturyModernCardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: MidCenturyModernVariant;
  readonly elevation?: number;
  readonly kidneyCurve?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const MidCenturyModernCard = /* @__PURE__ */ forwardRef<HTMLDivElement, MidCenturyModernCardProps>(
  function MidCenturyModernCard(
    {
      variant = "warm-teak",
      elevation = 1,
      kidneyCurve = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeMidCenturyModernStyle({
      variant,
      elevation,
      kidneyCurve,
      highContrast,
    });

    const cardStyle: CSSProperties = {
      position: "relative",
      padding: "24px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: cardStyle,
      },
      children,
    );
  },
);

export interface MidCenturyModernPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: MidCenturyModernVariant;
  readonly elevation?: number;
  readonly kidneyCurve?: boolean;
  readonly atomicStar?: boolean;
  readonly highContrast?: boolean;
  readonly children?: ReactNode;
}

export const MidCenturyModernPanel = /* @__PURE__ */ forwardRef<HTMLDivElement, MidCenturyModernPanelProps>(
  function MidCenturyModernPanel(
    {
      variant = "warm-teak",
      elevation = 1,
      kidneyCurve = false,
      atomicStar = false,
      highContrast = false,
      className,
      style,
      children,
      ...divProps
    },
    forwardedRef,
  ) {
    const computed = computeMidCenturyModernStyle({
      variant,
      elevation,
      kidneyCurve,
      highContrast,
    });

    const panelStyle: CSSProperties = {
      position: "relative",
      padding: "28px",
      background: computed.background,
      border: computed.border,
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      color: computed.color,
      fontFamily: computed.fontFamily,
      ...style,
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        className,
        style: panelStyle,
      },
      children,
      atomicStar
        ? createElement(
            "div",
            {
              "aria-hidden": "true",
              style: {
                position: "absolute",
                top: "14px",
                right: "14px",
                opacity: 0.8,
                pointerEvents: "none",
              },
            },
            createElement(
              "svg",
              {
                width: 22,
                height: 22,
                viewBox: "0 0 50 50",
                fill: "#bc6c25",
                stroke: "none",
              },
              createElement("path", { d: MCM_SUNBURST_PATH }),
            ),
          )
        : null,
    );
  },
);

export interface MidCenturyModernInputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly variant?: MidCenturyModernVariant;
  readonly highContrast?: boolean;
}

export const MidCenturyModernInput = /* @__PURE__ */ forwardRef<HTMLInputElement, MidCenturyModernInputProps>(
  function MidCenturyModernInput(
    {
      variant = "warm-teak",
      highContrast = false,
      disabled = false,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [isFocused, setIsFocused] = useState(false);

    const computed = computeMidCenturyModernStyle({
      variant,
      highContrast,
    });

    const inputStyle: CSSProperties = {
      width: "100%",
      padding: "10px 16px",
      background: computed.background,
      border: computed.border,
      borderRadius: "14px",
      boxShadow: isFocused ? "0 0 0 2px rgba(193, 124, 78, 0.4)" : "none",
      color: computed.color,
      fontFamily: computed.fontFamily,
      fontSize: "14px",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "text",
      transition: "box-shadow 150ms ease",
      boxSizing: "border-box",
      ...style,
    };

    return createElement("input", {
      ...inputProps,
      ref: forwardedRef,
      disabled,
      className,
      style: inputStyle,
      onFocus: (e) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
    });
  },
);

export interface MidCenturyModernDecorationProps extends HTMLAttributes<HTMLDivElement> {
  readonly shape?: "sunburst" | "boomerang" | "kidney";
  readonly size?: number | string;
  readonly color?: string;
}

export const MidCenturyModernDecoration = /* @__PURE__ */ forwardRef<HTMLDivElement, MidCenturyModernDecorationProps>(
  function MidCenturyModernDecoration(
    {
      shape = "sunburst",
      size = 48,
      color = "#c17c4e",
      className,
      style,
      ...divProps
    },
    forwardedRef,
  ) {
    let d = MCM_SUNBURST_PATH;
    let fill = color;
    let stroke = "none";

    if (shape === "boomerang") {
      d = MCM_BOOMERANG_PATH;
      fill = color;
      stroke = "none";
    } else if (shape === "kidney") {
      d = MCM_KIDNEY_PATH;
      fill = color;
      stroke = "none";
    }

    return createElement(
      "div",
      {
        ...divProps,
        ref: forwardedRef,
        role: "presentation",
        "aria-hidden": "true",
        className,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        },
      },
      createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 50 50",
          fill,
          stroke,
        },
        createElement("path", { d }),
      ),
    );
  },
);

// ============================================================================
// Graphics Rendering & Shader React Integration (Prompt 71)
// ============================================================================

export const GraphicsContext = /* @__PURE__ */ createContext<GraphicsEngine | null>(null);

export interface GraphicsProviderProps {
  readonly engine?: GraphicsEngine;
  readonly options?: GraphicsEngineOptions;
  readonly children?: ReactNode;
}

/**
 * Context provider for sharing a GraphicsEngine across child graphics components,
 * canvases, and effect hooks.
 */
export function GraphicsProvider({
  engine: externalEngine,
  options,
  children,
}: GraphicsProviderProps) {
  const internalEngineRef = useRef<GraphicsEngine | null>(null);

  if (!externalEngine && !internalEngineRef.current) {
    internalEngineRef.current = createGraphicsEngine(options);
  }

  const activeEngine = externalEngine || internalEngineRef.current;

  useEffect(() => {
    return () => {
      if (internalEngineRef.current) {
        internalEngineRef.current.destroy();
        internalEngineRef.current = null;
      }
    };
  }, []);

  return createElement(
    GraphicsContext.Provider,
    { value: activeEngine },
    children,
  );
}

/**
 * Hook to access the current ambient GraphicsEngine.
 */
export function useGraphics(): GraphicsEngine | null {
  return useContext(GraphicsContext);
}

/**
 * Hook to detect and monitor device graphics capabilities (WebGPU, WebGL2, WebGL, Canvas2D, DPR).
 */
export function useGraphicsCapabilities(options?: CapabilityDetectionOptions): GraphicsCapabilities {
  const [capabilities, setCapabilities] = useState<GraphicsCapabilities>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_FALLBACK_CAPABILITIES;
    }
    return detectGraphicsCapabilities(options);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCapabilities(detectGraphicsCapabilities(options));

    let mediaQuery: MediaQueryList | null = null;
    const onMotionChange = () => {
      setCapabilities(detectGraphicsCapabilities(options));
    };

    try {
      if (typeof window.matchMedia === "function") {
        mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        mediaQuery.addEventListener("change", onMotionChange);
      }
    } catch {
      // Ignore media query error
    }

    return () => {
      try {
        mediaQuery?.removeEventListener("change", onMotionChange);
      } catch {
        // Ignore cleanup error
      }
    };
  }, [options?.forceFallback, options?.preferredBackend, options?.targetDpr]);

  return capabilities;
}

/**
 * Hook to register and manage the lifecycle of a GraphicsEffect on an engine instance.
 */
export function useGraphicsEffect(
  effect: GraphicsEffect | (() => GraphicsEffect),
  deps: readonly unknown[] = [],
): void {
  const ambientEngine = useGraphics();

  useEffect(() => {
    if (!ambientEngine) return;
    const instance = typeof effect === "function" ? effect() : effect;
    if (!instance || !instance.id) return;

    ambientEngine.registerEffect(instance);

    return () => {
      ambientEngine.unregisterEffect(instance.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambientEngine, ...deps]);
}

export interface GraphicsCanvasProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly engine?: GraphicsEngine;
  readonly rendererOptions?: RendererOptions;
  readonly effects?: readonly GraphicsEffect[];
  readonly dpr?: number | "auto";
  readonly autoStart?: boolean;
  readonly pauseOnHidden?: boolean;
  readonly respectReducedMotion?: boolean;
  readonly fpsLimit?: number;
  readonly onEngineReady?: (engine: GraphicsEngine) => void;
  readonly fallback?: ReactNode;
  readonly children?: ReactNode;
}

/**
 * First-class accessible canvas component integrated with AF Motion Graphics Engine,
 * supporting high-DPI scaling, Strict Mode mount/unmount resilience, and SSR safety.
 */
export const GraphicsCanvas = /* @__PURE__ */ forwardRef<HTMLCanvasElement, GraphicsCanvasProps>(
  function GraphicsCanvas(
    {
      engine: externalEngine,
      rendererOptions,
      effects,
      dpr = "auto",
      autoStart = true,
      pauseOnHidden = true,
      respectReducedMotion = true,
      fpsLimit,
      onEngineReady,
      fallback,
      children,
      role = "img",
      style,
      className,
      ...canvasProps
    },
    forwardedRef,
  ) {
    const ambientEngine = useGraphics();
    const internalEngineRef = useRef<GraphicsEngine | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Resolve active engine
    const activeEngine = externalEngine || ambientEngine || (() => {
      if (!internalEngineRef.current) {
        internalEngineRef.current = createGraphicsEngine({
          renderer: rendererOptions,
          dpr,
          autoStart,
          pauseOnHidden,
          respectReducedMotion,
          fpsLimit,
        });
      }
      return internalEngineRef.current;
    })();

    // Sync forwardedRef and internal canvasRef
    const setCanvasRefs = useCallback(
      (node: HTMLCanvasElement | null) => {
        canvasRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef && "current" in forwardedRef) {
          (forwardedRef as { current: HTMLCanvasElement | null }).current = node;
        }
      },
      [forwardedRef],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || activeEngine.state === "destroyed") return;

      let isCancelled = false;

      // Attach canvas to engine asynchronously or synchronously
      const attachPromise = activeEngine.attach(canvas);
      if (attachPromise && typeof (attachPromise as Promise<void>).then === "function") {
        (attachPromise as Promise<void>)
          .then(() => {
            if (isCancelled || activeEngine.state === "destroyed") return;
            if (effects) {
              for (const effect of effects) {
                activeEngine.registerEffect(effect);
              }
            }
            onEngineReady?.(activeEngine);
          })
          .catch(() => {});
      } else {
        if (effects) {
          for (const effect of effects) {
            activeEngine.registerEffect(effect);
          }
        }
        onEngineReady?.(activeEngine);
      }

      return () => {
        isCancelled = true;
        activeEngine.detach();
      };
    }, [activeEngine, effects, onEngineReady]);

    useEffect(() => {
      return () => {
        if (internalEngineRef.current) {
          internalEngineRef.current.destroy();
          internalEngineRef.current = null;
        }
      };
    }, []);

    const canvasStyle: CSSProperties = {
      display: "block",
      boxSizing: "border-box",
      ...style,
    };

    return createElement(
      "canvas",
      {
        ...canvasProps,
        ref: setCanvasRefs,
        role,
        className,
        style: canvasStyle,
      },
      fallback || children,
    );
  },
);


// ============================================================================
// PROMPT 72 — MATERIALS, SURFACES, LIGHTING & GLASS INTEGRATION
// ============================================================================

export interface MaterialContextValue {
  readonly material?: MaterialDefinition;
  readonly lighting?: LightingConfig;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
}

export const MaterialContext = /* @__PURE__ */ createContext<MaterialContextValue>({});

export interface MaterialProviderProps {
  readonly material?: MaterialDefinition | string;
  readonly lighting?: LightingConfig | string;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly children?: ReactNode;
}

export function MaterialProvider({
  material,
  lighting,
  highContrast,
  reducedMotion,
  children,
}: MaterialProviderProps): ReactElement {
  const parentContext = useContext(MaterialContext);

  const resolvedMaterial: MaterialDefinition = useMemo(() => {
    if (typeof material === "string") {
      return getMaterialPreset(material) ?? parentContext.material ?? MATTE_MATERIAL;
    }
    return material ?? parentContext.material ?? MATTE_MATERIAL;
  }, [material, parentContext.material]);

  const resolvedLighting: LightingConfig = useMemo(() => {
    if (typeof lighting === "string") {
      return getLightingPreset(lighting) ?? parentContext.lighting ?? STUDIO_LIGHTING;
    }
    return lighting ?? parentContext.lighting ?? STUDIO_LIGHTING;
  }, [lighting, parentContext.lighting]);

  const value = useMemo<MaterialContextValue>(() => ({
    material: resolvedMaterial,
    lighting: resolvedLighting,
    highContrast: highContrast ?? parentContext.highContrast,
    reducedMotion: reducedMotion ?? parentContext.reducedMotion,
  }), [resolvedMaterial, resolvedLighting, highContrast, reducedMotion, parentContext.highContrast, parentContext.reducedMotion]);

  return createElement(MaterialContext.Provider, { value }, children);
}

export interface UseMaterialOptions {
  readonly lighting?: LightingConfig | string;
  readonly highContrast?: boolean;
}

export interface UseMaterialResult {
  readonly material: MaterialDefinition;
  readonly surface: SurfaceDefinition;
  readonly lighting: LightingConfig;
  readonly resolvedLighting: ResolvedLighting;
  readonly style: SurfaceStyleResult;
  readonly uniforms: MaterialUniforms;
}

export function useMaterial(
  materialOrId?: MaterialDefinition | string,
  options?: UseMaterialOptions
): UseMaterialResult {
  const context = useContext(MaterialContext);

  const material = useMemo(() => {
    if (typeof materialOrId === "string") {
      return getMaterialPreset(materialOrId) ?? context.material ?? MATTE_MATERIAL;
    }
    return materialOrId ?? context.material ?? MATTE_MATERIAL;
  }, [materialOrId, context.material]);

  const lighting = useMemo(() => {
    if (typeof options?.lighting === "string") {
      return getLightingPreset(options.lighting) ?? material.lighting ?? context.lighting ?? STUDIO_LIGHTING;
    }
    return options?.lighting ?? material.lighting ?? context.lighting ?? STUDIO_LIGHTING;
  }, [options?.lighting, material.lighting, context.lighting]);

  const highContrast = options?.highContrast ?? context.highContrast ?? false;

  const resolvedLighting = useMemo(() => resolveLighting(lighting), [lighting]);

  const style = useMemo(
    () => computeSurfaceStyle(material.surface, lighting, { highContrast }),
    [material.surface, lighting, highContrast]
  );

  return {
    material,
    surface: material.surface,
    lighting,
    resolvedLighting,
    style,
    uniforms: {
      ...(material.uniforms ?? {}),
      ...(style.uniforms ?? {}),
    },
  };
}

export interface UseSurfaceOptions {
  readonly lighting?: LightingConfig | string;
  readonly highContrast?: boolean;
}

export interface UseSurfaceResult {
  readonly surface: SurfaceDefinition;
  readonly style: SurfaceStyleResult;
  readonly uniforms: MaterialUniforms;
}

export function useSurface(
  surface?: SurfaceDefinition,
  options?: UseSurfaceOptions
): UseSurfaceResult {
  const context = useContext(MaterialContext);
  const activeSurface = surface ?? context.material?.surface ?? MATTE_MATERIAL.surface;

  const lighting = useMemo(() => {
    if (typeof options?.lighting === "string") {
      return getLightingPreset(options.lighting) ?? context.lighting ?? STUDIO_LIGHTING;
    }
    return options?.lighting ?? context.lighting ?? STUDIO_LIGHTING;
  }, [options?.lighting, context.lighting]);

  const highContrast = options?.highContrast ?? context.highContrast ?? false;

  const style = useMemo(
    () => computeSurfaceStyle(activeSurface, lighting, { highContrast }),
    [activeSurface, lighting, highContrast]
  );

  return {
    surface: activeSurface,
    style,
    uniforms: style.uniforms ?? {},
  };
}

export function useLighting(lightingOrPreset?: LightingConfig | string): ResolvedLighting {
  const context = useContext(MaterialContext);

  const lighting = useMemo(() => {
    if (typeof lightingOrPreset === "string") {
      return getLightingPreset(lightingOrPreset) ?? context.lighting ?? STUDIO_LIGHTING;
    }
    return lightingOrPreset ?? context.lighting ?? STUDIO_LIGHTING;
  }, [lightingOrPreset, context.lighting]);

  return useMemo(() => resolveLighting(lighting), [lighting]);
}

export interface UseGlassResult {
  readonly preset: GlassPresetName;
  readonly style: GlassStyleResult;
  readonly isFallback: boolean;
  readonly blur: number;
  readonly cssProperties: CSSProperties;
}

export function useGlass(
  preset: GlassPresetName = "frosted-glass",
  options?: GlassMaterialOptions
): UseGlassResult {
  const context = useContext(MaterialContext);
  const highContrast = options?.highContrast ?? context.highContrast ?? false;
  const reducedMotion = options?.reducedMotion ?? context.reducedMotion ?? false;

  const mergedOptions = useMemo<GlassMaterialOptions>(() => ({
    ...options,
    highContrast,
    reducedMotion,
  }), [options, highContrast, reducedMotion]);

  const styleResult = useMemo(
    () => computeGlassStyle(preset, mergedOptions),
    [preset, mergedOptions]
  );

  const cssProperties = useMemo<CSSProperties>(() => {
    const props: CSSProperties = {
      background: styleResult.background,
      border: styleResult.border,
      borderRadius: styleResult.borderRadius,
      boxShadow: styleResult.boxShadow,
      opacity: styleResult.opacity,
    };
    if (styleResult.backdropFilter) {
      props.backdropFilter = styleResult.backdropFilter;
    }
    if (styleResult.WebkitBackdropFilter) {
      props.WebkitBackdropFilter = styleResult.WebkitBackdropFilter;
    }
    return props;
  }, [styleResult]);

  return {
    preset: styleResult.preset,
    style: styleResult,
    isFallback: styleResult.isFallback,
    blur: styleResult.blur,
    cssProperties,
  };
}

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly preset?: GlassPresetName;
  readonly blur?: number;
  readonly opacity?: number;
  readonly tint?: string;
  readonly elevation?: number;
  readonly edgeHighlight?: boolean;
  readonly borderWidth?: number | string;
  readonly borderColor?: string;
  readonly borderRadius?: number | string;
  readonly refractiveIndex?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
  readonly interactive?: boolean;
  readonly disabled?: boolean;
  readonly fallback?: ReactNode;
  readonly children?: ReactNode;
}

export const GlassSurface = /* @__PURE__ */ forwardRef<HTMLDivElement, GlassSurfaceProps>(
  function GlassSurface(
    {
      preset = "frosted-glass",
      blur,
      opacity,
      tint,
      elevation = 2,
      edgeHighlight = true,
      borderWidth,
      borderColor,
      borderRadius,
      refractiveIndex,
      highContrast,
      reducedMotion,
      interactive = false,
      disabled = false,
      fallback,
      children,
      className,
      style,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onFocus,
      onBlur,
      ...divProps
    },
    ref
  ) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const effectiveElevation = interactive && !disabled
      ? isPressed
        ? Math.max(0, elevation - 1)
        : isHovered
          ? elevation + 1
          : elevation
      : elevation;

    const glass = useGlass(preset, {
      blur,
      opacity,
      tint,
      elevation: effectiveElevation,
      edgeHighlight,
      borderWidth,
      borderColor,
      borderRadius,
      refractiveIndex,
      highContrast,
      reducedMotion,
    });

    const isMotionReduced = reducedMotion ?? false;

    const surfaceStyle: CSSProperties = {
      ...glass.cssProperties,
      boxSizing: "border-box",
      position: "relative",
      transition: !isMotionReduced && interactive
        ? "box-shadow 0.2s ease, transform 0.2s ease, background-color 0.2s ease"
        : undefined,
      transform: interactive && !disabled
        ? isPressed
          ? "scale(0.99)"
          : isHovered
            ? "translateY(-1px)"
            : undefined
        : undefined,
      cursor: interactive && !disabled ? "pointer" : undefined,
      outline: isFocused ? "2px solid rgba(59, 130, 246, 0.8)" : undefined,
      outlineOffset: isFocused ? "2px" : undefined,
      ...style,
    };

    const handleMouseEnter = (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!disabled && interactive) setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!disabled && interactive) {
        setIsHovered(false);
        setIsPressed(false);
      }
      onMouseLeave?.(e);
    };

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!disabled && interactive) setIsPressed(true);
      onMouseDown?.(e);
    };

    const handleMouseUp = (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!disabled && interactive) setIsPressed(false);
      onMouseUp?.(e);
    };

    const handleFocus = (e: ReactFocusEvent<HTMLDivElement>) => {
      if (!disabled) setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: ReactFocusEvent<HTMLDivElement>) => {
      if (!disabled) setIsFocused(false);
      onBlur?.(e);
    };

    return createElement(
      "div",
      {
        ...divProps,
        ref,
        className,
        style: surfaceStyle,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onMouseDown: handleMouseDown,
        onMouseUp: handleMouseUp,
        onFocus: handleFocus,
        onBlur: handleBlur,
        tabIndex: interactive && !disabled ? (divProps.tabIndex ?? 0) : divProps.tabIndex,
        role: divProps.role ?? (interactive ? "button" : undefined),
        "aria-disabled": disabled ? true : undefined,
      },
      glass.isFallback && fallback ? fallback : children
    );
  }
);


// ============================================================================
// PROMPT 73 — PROCEDURAL TEXTURES & PATTERNS INTEGRATION
// ============================================================================

export interface UseTextureResult {
  readonly texture: GeneratedTexture;
  readonly dataUrl: string;
  readonly cssBackground: string;
  readonly style: CSSProperties;
}

export function useTexture(
  generator: TextureGeneratorName = "noise",
  options?: ProceduralTextureOptions
): UseTextureResult {
  const optionsKey = options ? JSON.stringify(options) : "";
  const texture = useMemo(
    () => generateProceduralTexture({ generator, options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generator, optionsKey]
  );

  const style = useMemo<CSSProperties>(() => ({
    backgroundImage: `url("${texture.dataUrl}")`,
    backgroundRepeat: "repeat",
    backgroundSize: "auto",
  }), [texture.dataUrl]);

  return {
    texture,
    dataUrl: texture.dataUrl,
    cssBackground: texture.cssBackground,
    style,
  };
}

export function useProceduralTexture(
  config: ProceduralTextureConfig,
  execOptions?: GenerateTextureExecutionOptions
): GeneratedTexture {
  const optionsKey = config.options ? JSON.stringify(config.options) : "";
  return useMemo(
    () => generateProceduralTexture(config, execOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.generator, optionsKey, execOptions?.cache]
  );
}

export function useTexturePresets(): readonly TextureGeneratorMetadata[] {
  return useMemo(() => listTextureGenerators(), []);
}

export interface ProceduralTextureProps extends HTMLAttributes<HTMLElement> {
  readonly generator: TextureGeneratorName;
  readonly options?: ProceduralTextureOptions;
  readonly as?: "div" | "canvas" | "span" | "section";
  readonly blendMode?: TextureBlendMode;
  readonly scale?: number | readonly [number, number];
  readonly repeat?: TextureRepeatMode;
  readonly reducedMotion?: boolean;
  readonly children?: ReactNode;
}

export const ProceduralTexture = /* @__PURE__ */ forwardRef<HTMLElement, ProceduralTextureProps>(
  function ProceduralTexture(
    {
      generator = "noise",
      options,
      as = "div",
      blendMode,
      scale,
      repeat = "repeat",
      reducedMotion,
      className,
      style,
      children,
      ...htmlProps
    },
    ref
  ) {
    const { texture, dataUrl } = useTexture(generator, options);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // If as === "canvas", draw texture canvas contents when available
    useEffect(() => {
      if (as === "canvas" && canvasRef.current && texture.canvas) {
        const targetCanvas = canvasRef.current;
        targetCanvas.width = texture.width;
        targetCanvas.height = texture.height;
        const ctx = targetCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
          ctx.drawImage(texture.canvas, 0, 0);
        }
      }
    }, [as, texture]);

    const formattedScale = typeof scale === "number"
      ? `${Math.round(scale * 100)}%`
      : (scale ? `${scale[0]}px ${scale[1]}px` : undefined);

    const containerStyle: CSSProperties = {
      boxSizing: "border-box",
      ...(as !== "canvas" ? {
        backgroundImage: `url("${dataUrl}")`,
        backgroundRepeat: repeat,
        backgroundSize: formattedScale,
        backgroundBlendMode: blendMode,
      } : {}),
      ...style,
    };

    if (as === "canvas") {
      return createElement("canvas", {
        ...htmlProps,
        ref: (node: HTMLCanvasElement | null) => {
          canvasRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref && "current" in ref) {
            (ref as any).current = node;
          }
        },
        className,
        style: containerStyle,
        width: texture.width,
        height: texture.height,
      }, children);
    }

    return createElement(
      as,
      {
        ...htmlProps,
        ref,
        className,
        style: containerStyle,
      },
      children
    );
  }
);


// ============================================================================
// PROMPT 74 — ADVANCED GRAPHICS EFFECTS INTEGRATION
// ============================================================================

export function useDistortion(
  options?: DistortionOptions
): GraphicsEffect<DistortionOptions> {
  const optionsKey = options ? JSON.stringify(options) : "";
  const effect = useMemo(
    () => createDistortionEffect(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey]
  );

  useEffect(() => {
    return () => {
      effect.dispose?.();
    };
  }, [effect]);

  return effect;
}

export function useFluidEffect(
  options?: FluidOptions
): GraphicsEffect<FluidOptions> {
  const optionsKey = options ? JSON.stringify(options) : "";
  const effect = useMemo(
    () => createFluidEffect(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey]
  );

  useEffect(() => {
    return () => {
      effect.dispose?.();
    };
  }, [effect]);

  return effect;
}

export function useParticles(
  options?: ParticleOptions
): GraphicsEffect<ParticleOptions> {
  const optionsKey = options ? JSON.stringify(options) : "";
  const effect = useMemo(
    () => createParticleEffect(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey]
  );

  useEffect(() => {
    return () => {
      effect.dispose?.();
    };
  }, [effect]);

  return effect;
}

export function useAdvancedEffect(
  options?: AdvancedEffectOptions
): GraphicsEffect<AdvancedEffectOptions> {
  const optionsKey = options ? JSON.stringify(options) : "";
  const effect = useMemo(
    () => createAdvancedEffect(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey]
  );

  useEffect(() => {
    return () => {
      effect.dispose?.();
    };
  }, [effect]);

  return effect;
}

export interface DistortionCanvasProps extends GraphicsCanvasProps {
  readonly distortion?: DistortionOptions;
}

export const DistortionCanvas = /* @__PURE__ */ forwardRef<HTMLCanvasElement, DistortionCanvasProps>(
  function DistortionCanvas({ distortion, effects, ...props }, ref) {
    const effect = useDistortion(distortion);
    const combinedEffects = useMemo(() => [effect, ...(effects ?? [])], [effect, effects]);
    return createElement(GraphicsCanvas, { ...props, ref, effects: combinedEffects });
  }
);

export interface FluidCanvasProps extends GraphicsCanvasProps {
  readonly fluid?: FluidOptions;
}

export const FluidCanvas = /* @__PURE__ */ forwardRef<HTMLCanvasElement, FluidCanvasProps>(
  function FluidCanvas({ fluid, effects, ...props }, ref) {
    const effect = useFluidEffect(fluid);
    const combinedEffects = useMemo(() => [effect, ...(effects ?? [])], [effect, effects]);
    return createElement(GraphicsCanvas, { ...props, ref, effects: combinedEffects });
  }
);

export interface ParticleCanvasProps extends GraphicsCanvasProps {
  readonly particles?: ParticleOptions;
}

export const ParticleCanvas = /* @__PURE__ */ forwardRef<HTMLCanvasElement, ParticleCanvasProps>(
  function ParticleCanvas({ particles, effects, ...props }, ref) {
    const effect = useParticles(particles);
    const combinedEffects = useMemo(() => [effect, ...(effects ?? [])], [effect, effects]);
    return createElement(GraphicsCanvas, { ...props, ref, effects: combinedEffects });
  }
);

export interface AdvancedEffectsCanvasProps extends GraphicsCanvasProps {
  readonly effect?: AdvancedEffectOptions;
}

export const AdvancedEffectsCanvas = /* @__PURE__ */ forwardRef<HTMLCanvasElement, AdvancedEffectsCanvasProps>(
  function AdvancedEffectsCanvas({ effect: effectOpts, effects, ...props }, ref) {
    const effect = useAdvancedEffect(effectOpts);
    const combinedEffects = useMemo(() => [effect, ...(effects ?? [])], [effect, effects]);
    return createElement(GraphicsCanvas, { ...props, ref, effects: combinedEffects });
  }
);


// ============================================================================
// PROMPT 75 — UNIFIED GRAPHICS COMPOSITION & ADAPTIVE INTEGRATION
// ============================================================================

export function useGraphicsComposition(
  definition?: GraphicsCompositionDefinition,
  options?: CreateCompositionOptions
): GraphicsCompositionInstance | null {
  const definitionKey = definition ? JSON.stringify(definition) : "";
  const composition = useMemo(() => {
    if (!definition) return null;
    return createGraphicsComposition(definition, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definitionKey, options?.autoStart]);

  useEffect(() => {
    return () => {
      composition?.destroy();
    };
  }, [composition]);

  return composition;
}

export interface UseGraphicsQualityResult {
  readonly quality: GraphicsQualityLevel;
  readonly profile: GraphicsQualityProfile;
  readonly setQuality: (quality: GraphicsQualityLevel) => void;
}

export function useGraphicsQuality(
  initialQuality: GraphicsQualityLevel = "high"
): UseGraphicsQualityResult {
  const [quality, setQuality] = useState<GraphicsQualityLevel>(initialQuality);
  const profile = useMemo(() => resolveQualityProfile(quality), [quality]);

  return {
    quality,
    profile,
    setQuality,
  };
}

export function useGraphicsFallback(
  capabilities?: GraphicsCapabilities,
  options?: ResolveFallbackOptions
): GraphicsFallbackDecision {
  return useMemo(
    () => resolveGraphicsFallback(capabilities, options),
    [capabilities, options?.preferredBackend, options?.respectReducedMotion]
  );
}

export interface GraphicsCompositionViewProps extends HTMLAttributes<HTMLCanvasElement> {
  readonly definition: GraphicsCompositionDefinition;
  readonly options?: CreateCompositionOptions;
  readonly onReady?: (composition: GraphicsCompositionInstance) => void;
  readonly fallback?: ReactNode;
}

export const GraphicsCompositionView = /* @__PURE__ */ forwardRef<HTMLCanvasElement, GraphicsCompositionViewProps>(
  function GraphicsCompositionView(
    { definition, options, onReady, fallback, className, style, ...canvasProps },
    ref
  ) {
    const composition = useGraphicsComposition(definition, options);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      let isCancelled = false;
      const canvas = canvasRef.current;
      if (composition && canvas) {
        Promise.resolve(composition.attach(canvas)).then(() => {
          if (!isCancelled) {
            onReady?.(composition);
          }
        });
      }

      return () => {
        isCancelled = true;
        composition?.detach();
      };
    }, [composition, onReady]);

    const canvasStyle: CSSProperties = {
      display: "block",
      boxSizing: "border-box",
      ...style,
    };

    return createElement(
      "canvas",
      {
        ...canvasProps,
        ref: (node: HTMLCanvasElement | null) => {
          canvasRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref && "current" in ref) {
            (ref as any).current = node;
          }
        },
        className,
        style: canvasStyle,
      },
      fallback
    );
  }
);


// ---------------------------------------------------------------------------
// 3D Scene & Rendering React Integration (Prompt 76)
// ---------------------------------------------------------------------------

import {
  createScene3D,
  type Scene3DDefinition,
  type Scene3DInstance,
  type CreateScene3DOptions,
  type Camera3DConfig,
  type Lighting3DConfig,
  type Environment3DConfig,
  type Renderer3DAdapter,
  type Scene3DCapabilities,
  type ScenePerformanceStats,
} from "./3d/index.js";

export const Scene3DContext = /* @__PURE__ */ createContext<Scene3DInstance | null>(null);

export interface Scene3DProviderProps {
  readonly scene?: Scene3DInstance | null;
  readonly definition?: Scene3DDefinition;
  readonly options?: CreateScene3DOptions;
  readonly children?: ReactNode;
}

export function Scene3DProvider({ scene, definition, options, children }: Scene3DProviderProps) {
  const localScene = useScene3D(definition, options);
  const activeScene = scene ?? localScene;

  return createElement(Scene3DContext.Provider, { value: activeScene }, children);
}

export function useScene3D(
  definition?: Scene3DDefinition,
  options?: CreateScene3DOptions
): Scene3DInstance | null {
  const contextScene = useContext(Scene3DContext);
  const sceneRef = useRef<Scene3DInstance | null>(null);

  const scene = useMemo(() => {
    if (!definition) return null;
    return createScene3D(definition, options);
  }, [definition?.id, definition?.version]);

  useEffect(() => {
    sceneRef.current = scene;
    return () => {
      scene?.destroy();
      sceneRef.current = null;
    };
  }, [scene]);

  return scene ?? contextScene;
}

export function useCamera3D(sceneOverride?: Scene3DInstance | null) {
  const contextScene = useContext(Scene3DContext);
  const scene = sceneOverride ?? contextScene;
  const [camera, setCamera] = useState<Camera3DConfig>(() => scene?.camera ?? {});

  useEffect(() => {
    if (scene) {
      setCamera(scene.camera);
    }
  }, [scene]);

  const updateCamera = useCallback(
    (config: Partial<Camera3DConfig>) => {
      if (scene) {
        scene.updateCamera(config);
        setCamera(scene.camera);
      }
    },
    [scene]
  );

  return { camera, updateCamera };
}

export function useRenderer3D(sceneOverride?: Scene3DInstance | null) {
  const contextScene = useContext(Scene3DContext);
  const scene = sceneOverride ?? contextScene;
  const [stats, setStats] = useState<ScenePerformanceStats | null>(() =>
    scene ? scene.getPerformanceStats() : null
  );

  const refreshStats = useCallback(() => {
    if (scene) {
      setStats(scene.getPerformanceStats());
    }
  }, [scene]);

  return {
    adapter: scene?.adapter ?? null,
    capabilities: scene?.capabilities ?? null,
    backend: scene?.adapter?.backend ?? "null",
    isRunning: scene?.isRunning ?? false,
    stats,
    refreshStats,
  };
}

export interface Scene3DViewProps extends HTMLAttributes<HTMLCanvasElement> {
  readonly scene?: Scene3DInstance | null;
  readonly definition?: Scene3DDefinition;
  readonly options?: CreateScene3DOptions;
  readonly onReady?: (scene: Scene3DInstance) => void;
  readonly fallback?: ReactNode;
}

export const Scene3DView = /* @__PURE__ */ forwardRef<HTMLCanvasElement, Scene3DViewProps>(
  function Scene3DView(
    { scene, definition, options, onReady, fallback, className, style, ...canvasProps },
    ref
  ) {
    const localScene = useScene3D(definition, options);
    const activeScene = scene ?? localScene;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      let isCancelled = false;
      const canvas = canvasRef.current;
      if (activeScene && canvas) {
        Promise.resolve(activeScene.attach(canvas)).then(() => {
          if (!isCancelled) {
            onReady?.(activeScene);
          }
        });
      }

      return () => {
        isCancelled = true;
        activeScene?.detach();
      };
    }, [activeScene, onReady]);

    const canvasStyle: CSSProperties = {
      display: "block",
      boxSizing: "border-box",
      ...style,
    };

    return createElement(
      "canvas",
      {
        ...canvasProps,
        ref: (node: HTMLCanvasElement | null) => {
          canvasRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref && "current" in ref) {
            (ref as any).current = node;
          }
        },
        className,
        style: canvasStyle,
      },
      fallback
    );
  }
);


// ---------------------------------------------------------------------------
// 3D Scene Specification & Schema React Integration (Prompt 77)
// ---------------------------------------------------------------------------

import {
  validateSceneSchema,
  correctSceneSchema,
  findSceneObject,
  type ValidationReport,
  type SceneObjectSpec,
  type ValidationReport as SceneValidationReport,
} from "./3d/index.js";

export const SceneSchemaContext = /* @__PURE__ */ createContext<Scene3DSpecification | null>(null);

export interface SceneSchemaProviderProps {
  readonly specification?: Scene3DSpecification | null;
  readonly children?: ReactNode;
}

export function SceneSchemaProvider({ specification, children }: SceneSchemaProviderProps) {
  return createElement(SceneSchemaContext.Provider, { value: specification ?? null }, children);
}

export interface UseSceneSchemaResult {
  readonly spec: Scene3DSpecification;
  readonly setSpec: (specOrFn: Scene3DSpecification | ((prev: Scene3DSpecification) => Scene3DSpecification)) => void;
  readonly updateObject: (id: string, partial: Partial<SceneObjectSpec>) => void;
  readonly removeObject: (id: string) => void;
  readonly addObject: (obj: SceneObjectSpec) => void;
}

export function useSceneSchema(
  initialSpec?: Scene3DSpecification | unknown,
  options?: { autoCorrect?: boolean }
): UseSceneSchemaResult {
  const contextSpec = useContext(SceneSchemaContext);

  const init = useMemo(() => {
    if (initialSpec) {
      return options?.autoCorrect !== false ? correctSceneSchema(initialSpec) : (initialSpec as Scene3DSpecification);
    }
    return contextSpec ?? correctSceneSchema(null);
  }, [initialSpec, contextSpec, options?.autoCorrect]);

  const [spec, setSpec] = useState<Scene3DSpecification>(init);

  const updateObject = useCallback((id: string, partial: Partial<SceneObjectSpec>) => {
    setSpec((prev) => {
      function updateList(nodes: readonly SceneObjectSpec[]): readonly SceneObjectSpec[] {
        return nodes.map((node) => {
          if (node.id === id) {
            return { ...node, ...partial } as SceneObjectSpec;
          }
          if (node.children) {
            return { ...node, children: updateList(node.children) } as SceneObjectSpec;
          }
          return node;
        });
      }
      return { ...prev, objects: updateList(prev.objects) };
    });
  }, []);

  const removeObject = useCallback((id: string) => {
    setSpec((prev) => {
      function filterList(nodes: readonly SceneObjectSpec[]): readonly SceneObjectSpec[] {
        return nodes
          .filter((n) => n.id !== id)
          .map((n) => (n.children ? ({ ...n, children: filterList(n.children) } as SceneObjectSpec) : n));
      }
      return { ...prev, objects: filterList(prev.objects) };
    });
  }, []);

  const addObject = useCallback((obj: SceneObjectSpec) => {
    setSpec((prev) => ({
      ...prev,
      objects: [...prev.objects, obj],
    }));
  }, []);

  return {
    spec,
    setSpec,
    updateObject,
    removeObject,
    addObject,
  };
}

export function useValidateScene(spec: unknown): {
  report: SceneValidationReport;
  isValid: boolean;
} {
  return useMemo(() => {
    const report = validateSceneSchema(spec);
    return {
      report,
      isValid: report.valid,
    };
  }, [spec]);
}

export function useSceneObject(
  spec: Scene3DSpecification | null | undefined,
  objectId: string
): SceneObjectSpec | undefined {
  const contextSpec = useContext(SceneSchemaContext);
  const activeSpec = spec ?? contextSpec;

  return useMemo(() => {
    if (!activeSpec || !objectId) return undefined;
    return findSceneObject(activeSpec, objectId);
  }, [activeSpec, objectId]);
}


// ---------------------------------------------------------------------------
// 3D Camera, Lighting, Environment & Material Intelligence (Prompt 78)
// ---------------------------------------------------------------------------

import {
  getCameraPreset,
  getLighting3DPreset,
  getEnvironmentPreset,
  getMaterial3DPreset,
  correctCameraConfig,
  correctLightingConfig,
  correctEnvironmentConfig,
  correctMaterial3D,
  type IntelligentCameraConfig,
  type CameraPresetName,
  type IntelligentLightingConfig,
  type LightingPresetName,
  type IntelligentEnvironmentConfig,
  type EnvironmentPresetName,
  type IntelligentMaterial3DConfig,
  type Material3DPresetName,
} from "./3d/index.js";

export function useCameraConfig3D(
  initial?: IntelligentCameraConfig | CameraPresetName
): {
  camera: IntelligentCameraConfig;
  setCamera: (c: IntelligentCameraConfig | ((prev: IntelligentCameraConfig) => IntelligentCameraConfig)) => void;
  setPreset: (preset: CameraPresetName) => void;
} {
  const init = useMemo(() => {
    if (typeof initial === "string") return getCameraPreset(initial);
    return correctCameraConfig(initial);
  }, [initial]);

  const [camera, setCamera] = useState<IntelligentCameraConfig>(init);

  const setPreset = useCallback((preset: CameraPresetName) => {
    setCamera(getCameraPreset(preset));
  }, []);

  return { camera, setCamera, setPreset };
}

export function useLighting3D(
  initial?: IntelligentLightingConfig | LightingPresetName
): {
  lighting: IntelligentLightingConfig;
  setLighting: (l: IntelligentLightingConfig | ((prev: IntelligentLightingConfig) => IntelligentLightingConfig)) => void;
  setPreset: (preset: LightingPresetName) => void;
} {
  const init = useMemo(() => {
    if (typeof initial === "string") return getLighting3DPreset(initial);
    return correctLightingConfig(initial);
  }, [initial]);

  const [lighting, setLighting] = useState<IntelligentLightingConfig>(init);

  const setPreset = useCallback((preset: LightingPresetName) => {
    setLighting(getLighting3DPreset(preset));
  }, []);

  return { lighting, setLighting, setPreset };
}

export function useEnvironment3D(
  initial?: IntelligentEnvironmentConfig | EnvironmentPresetName
): {
  environment: IntelligentEnvironmentConfig;
  setEnvironment: (e: IntelligentEnvironmentConfig | ((prev: IntelligentEnvironmentConfig) => IntelligentEnvironmentConfig)) => void;
  setPreset: (preset: EnvironmentPresetName) => void;
} {
  const init = useMemo(() => {
    if (typeof initial === "string") return getEnvironmentPreset(initial);
    return correctEnvironmentConfig(initial);
  }, [initial]);

  const [environment, setEnvironment] = useState<IntelligentEnvironmentConfig>(init);

  const setPreset = useCallback((preset: EnvironmentPresetName) => {
    setEnvironment(getEnvironmentPreset(preset));
  }, []);

  return { environment, setEnvironment, setPreset };
}

export function useMaterial3D(
  initial?: IntelligentMaterial3DConfig | Material3DPresetName
): {
  material: IntelligentMaterial3DConfig;
  setMaterial: (m: IntelligentMaterial3DConfig | ((prev: IntelligentMaterial3DConfig) => IntelligentMaterial3DConfig)) => void;
  setPreset: (preset: Material3DPresetName) => void;
} {
  const init = useMemo(() => {
    if (typeof initial === "string") return getMaterial3DPreset(initial);
    return correctMaterial3D(initial);
  }, [initial]);

  const [material, setMaterial] = useState<IntelligentMaterial3DConfig>(init);

  const setPreset = useCallback((preset: Material3DPresetName) => {
    setMaterial(getMaterial3DPreset(preset));
  }, []);

  return { material, setMaterial, setPreset };
}


// ---------------------------------------------------------------------------
// 3D Models, Assets & Procedural Geometry (Prompt 79)
// ---------------------------------------------------------------------------

import {
  getDefaultAssetManager,
  AssetManager3D,
  type Asset3DDefinition,
  type Asset3DEntry,
  type Asset3DLoadOptions,
  type ModelInspectionMetadata,
  type ProceduralGeometryDescriptor,
  type GeometryBufferData,
  generateProceduralGeometry,
  toThreeGeometry,
  disposeThreeGeometry,
  getDefaultGeometryCache,
  computeGeometryHash,
} from "./3d/index.js";

export interface UseAsset3DOptions extends Asset3DLoadOptions {
  readonly manager?: AssetManager3D;
  readonly clone?: boolean;
  readonly onLoaded?: (data: unknown) => void;
  readonly onError?: (error: Error) => void;
}

export interface UseAsset3DResult<T = unknown> {
  readonly data: T | undefined;
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly progress: number;
  readonly metadata: ModelInspectionMetadata | Record<string, unknown> | undefined;
  readonly entry: Asset3DEntry<T> | undefined;
  readonly reload: () => Promise<void>;
}

export function useAsset3D<T = unknown>(
  urlOrDef: string | Asset3DDefinition,
  options?: UseAsset3DOptions
): UseAsset3DResult<T> {
  const manager = options?.manager ?? getDefaultAssetManager();
  const idOrUrl = typeof urlOrDef === "string" ? urlOrDef : urlOrDef.id || urlOrDef.url;
  const isClient = typeof window !== "undefined";

  const cached = manager.get<T>(idOrUrl);
  const [entry, setEntry] = useState<Asset3DEntry<T> | undefined>(cached);
  const [loading, setLoading] = useState<boolean>(!cached || cached.status === "loading");
  const [progress, setProgress] = useState<number>(cached?.progress ?? 0);
  const [error, setError] = useState<string | undefined>(cached?.error);

  const loadAsset = useCallback(
    async (abortSignal?: AbortSignal) => {
      if (!isClient) return;
      setLoading(true);
      setError(undefined);

      try {
        const result = await manager.load<T>(urlOrDef, {
          ...options,
          signal: abortSignal ?? options?.signal,
          onProgress: (p) => {
            setProgress(p);
            options?.onProgress?.(p);
          },
        });

        if (!abortSignal?.aborted) {
          setEntry(result);
          setLoading(false);
          setProgress(1);
          options?.onLoaded?.(result.data);
        }
      } catch (err: unknown) {
        if (!abortSignal?.aborted) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setLoading(false);
          options?.onError?.(err instanceof Error ? err : new Error(msg));
        }
      }
    },
    [manager, urlOrDef, options, isClient]
  );

  useEffect(() => {
    if (!isClient) return;

    manager.retain(idOrUrl);
    const controller = new AbortController();

    loadAsset(controller.signal);

    return () => {
      controller.abort();
      manager.release(idOrUrl);
    };
  }, [idOrUrl, loadAsset, manager, isClient]);

  const reload = useCallback(async () => {
    return loadAsset();
  }, [loadAsset]);

  const data = options?.clone && entry?.data ? (manager.instantiate<T>(idOrUrl) ?? entry.data) : entry?.data;

  return {
    data,
    loading,
    error,
    progress,
    metadata: entry?.metadata,
    entry,
    reload,
  };
}

export interface UseModel3DOptions extends UseAsset3DOptions {
  readonly clone?: boolean;
}

export interface UseModel3DResult<T = unknown> extends UseAsset3DResult<T> {
  readonly model: T | undefined;
  readonly scene: any | undefined;
  readonly animations: readonly any[] | undefined;
}

export function useModel3D<T = unknown>(
  urlOrDef: string | Asset3DDefinition,
  options?: UseModel3DOptions
): UseModel3DResult<T> {
  const assetResult = useAsset3D<T>(urlOrDef, options);

  const model = assetResult.data;
  const scene = (model as any)?.scene ?? model;
  const animations = (model as any)?.animations;

  return {
    ...assetResult,
    model,
    scene,
    animations,
  };
}

export interface UseGeometry3DOptions {
  readonly three?: any;
  readonly useCache?: boolean;
}

export interface UseGeometry3DResult {
  readonly buffer: GeometryBufferData;
  readonly geometry: any | undefined;
  readonly hash: string;
}

export function useGeometry3D(
  descriptor: ProceduralGeometryDescriptor,
  options?: UseGeometry3DOptions
): UseGeometry3DResult {
  const useCache = options?.useCache !== false;
  const hash = useMemo(() => computeGeometryHash(descriptor), [descriptor]);

  const buffer = useMemo(() => {
    if (useCache) {
      return getDefaultGeometryCache().getOrGenerate(descriptor);
    }
    return generateProceduralGeometry(descriptor);
  }, [descriptor, useCache]);

  const [threeGeometry, setThreeGeometry] = useState<any | undefined>(() => {
    if (options?.three) {
      return toThreeGeometry(buffer, options.three);
    }
    return undefined;
  });

  useEffect(() => {
    if (options?.three) {
      const geom = toThreeGeometry(buffer, options.three);
      setThreeGeometry(geom);

      return () => {
        disposeThreeGeometry(geom);
      };
    } else {
      setThreeGeometry(undefined);
    }
  }, [buffer, options?.three]);

  return {
    buffer,
    geometry: threeGeometry,
    hash,
  };
}

export function useAssetProgress(assetId?: string): number {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const manager = getDefaultAssetManager();
    const update = () => {
      if (assetId) {
        const item = manager.get(assetId);
        setProgress(item ? item.progress : 0);
      } else {
        const stats = manager.getStats();
        if (stats.inFlight === 0) {
          setProgress(1);
        } else {
          setProgress(stats.loaded / Math.max(1, stats.loaded + stats.inFlight));
        }
      }
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [assetId]);

  return progress;
}

export interface Model3DViewProps {
  readonly asset: string | Asset3DDefinition;
  readonly options?: UseModel3DOptions;
  readonly fallback?: ReactNode;
  readonly children?: (modelResult: UseModel3DResult) => ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Model3DView({
  asset,
  options,
  fallback = null,
  children,
  className,
  style,
}: Model3DViewProps) {
  const modelResult = useModel3D(asset, options);

  if (modelResult.loading) {
    return fallback ? createElement("div", { className, style }, fallback) : null;
  }

  if (modelResult.error) {
    return createElement(
      "div",
      { className, style, "data-status": "error" },
      modelResult.error
    );
  }

  if (typeof children === "function") {
    return createElement("div", { className, style }, children(modelResult));
  }

  return createElement(
    "div",
    {
      className,
      style,
      "data-status": "loaded",
      "data-meshes": modelResult.metadata ? (modelResult.metadata as any).meshCount : undefined,
    },
    null
  );
}

export interface Geometry3DViewProps {
  readonly descriptor: ProceduralGeometryDescriptor;
  readonly options?: UseGeometry3DOptions;
  readonly children?: (geomResult: UseGeometry3DResult) => ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function Geometry3DView({
  descriptor,
  options,
  children,
  className,
  style,
}: Geometry3DViewProps) {
  const geomResult = useGeometry3D(descriptor, options);

  if (typeof children === "function") {
    return createElement("div", { className, style }, children(geomResult));
  }

  return createElement(
    "div",
    {
      className,
      style,
      "data-geometry-type": geomResult.buffer.type,
      "data-vertex-count": geomResult.buffer.vertexCount,
      "data-triangle-count": geomResult.buffer.triangleCount,
    },
    null
  );
}


// ---------------------------------------------------------------------------
// 3D Interaction & Scroll-Driven Scenes (Prompt 80)
// ---------------------------------------------------------------------------

import {
  InteractionManager3D,
  CameraControls3D,
  createBoundingBoxRaycaster,
  createThreeRaycastAdapter,
  getInteractionPreset,
  type Interaction3DOptions,
  type InteractionState3D,
  type CameraControlsConfig,
  type CameraControlsState,
  type RaycastAdapter3D,
  type RaycastHit3D,
  type InteractionPresetName,
  ScrollSceneController,
  getScrollTimelinePreset,
  type ScrollSceneTimeline,
  type ScrollSceneState,
  type ScrollSceneOptions,
} from "./3d/index.js";

export interface UseInteraction3DResult {
  readonly ref: (element: HTMLElement | null) => void;
  readonly manager: InteractionManager3D;
  readonly state: InteractionState3D;
  readonly select: (objectId: string, multi?: boolean) => void;
  readonly deselect: (objectId: string) => void;
  readonly clearSelection: () => void;
  readonly hoveredObjectId: string | null;
  readonly selectedObjectIds: readonly string[];
  readonly isDragging: boolean;
}

export function useInteraction3D(
  options?: Interaction3DOptions,
  cameraControls?: CameraControls3D
): UseInteraction3DResult {
  const managerRef = useRef<InteractionManager3D | null>(null);
  if (!managerRef.current) {
    managerRef.current = new InteractionManager3D(options, cameraControls);
  }
  const manager = managerRef.current;

  const [state, setState] = useState<InteractionState3D>(() => manager.getState());

  useEffect(() => {
    return manager.subscribe(setState);
  }, [manager]);

  const setElementRef = useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        manager.attach(el);
      } else {
        manager.detach();
      }
    },
    [manager]
  );

  useEffect(() => {
    return () => {
      manager.detach();
    };
  }, [manager]);

  const select = useCallback(
    (id: string, multi?: boolean) => manager.select(id, multi),
    [manager]
  );
  const deselect = useCallback(
    (id: string) => manager.deselect(id),
    [manager]
  );
  const clearSelection = useCallback(
    () => manager.clearSelection(),
    [manager]
  );

  return {
    ref: setElementRef,
    manager,
    state,
    select,
    deselect,
    clearSelection,
    hoveredObjectId: state.hoveredObjectId,
    selectedObjectIds: state.selectedObjectIds,
    isDragging: state.isDragging,
  };
}

export interface UseRaycast3DOptions {
  readonly adapter?: RaycastAdapter3D;
  readonly three?: any;
  readonly getCamera?: () => any;
  readonly getScene?: () => any;
  readonly objectCatalog?: readonly { id: string; position: [number, number, number]; radius?: number }[];
}

export function useRaycast3D(options?: UseRaycast3DOptions): {
  raycast: (ndcX: number, ndcY: number) => readonly RaycastHit3D[];
} {
  const adapter = useMemo(() => {
    if (options?.adapter) return options.adapter;
    if (options?.three || options?.getCamera) {
      return createThreeRaycastAdapter(options.three, options.getCamera, options.getScene);
    }
    return createBoundingBoxRaycaster(options?.objectCatalog);
  }, [options?.adapter, options?.three, options?.getCamera, options?.getScene, options?.objectCatalog]);

  const raycast = useCallback(
    (ndcX: number, ndcY: number) => adapter.raycast(ndcX, ndcY),
    [adapter]
  );

  return { raycast };
}

export interface UseCameraControls3DOptions {
  readonly initialCamera?: Camera3DConfig;
  readonly config?: CameraControlsConfig;
  readonly active?: boolean;
}

export interface UseCameraControls3DResult {
  readonly camera: Camera3DConfig;
  readonly controls: CameraControls3D;
  readonly state: CameraControlsState;
  readonly rotate: (deltaAzimuth: number, deltaPolar: number) => void;
  readonly pan: (deltaX: number, deltaY: number) => void;
  readonly zoom: (delta: number) => void;
  readonly focusOn: (boundingBox: any, fov?: number) => void;
  readonly lookAt: (target: [number, number, number]) => void;
}

export function useCameraControls3D(
  options?: UseCameraControls3DOptions
): UseCameraControls3DResult {
  const controlsRef = useRef<CameraControls3D | null>(null);
  if (!controlsRef.current) {
    controlsRef.current = new CameraControls3D(options?.initialCamera, options?.config);
  }
  const controls = controlsRef.current;

  const [camera, setCamera] = useState<Camera3DConfig>(() =>
    controls.update(0)
  );
  const [controlsState, setControlsState] = useState<CameraControlsState>(() =>
    controls.getState()
  );

  useEffect(() => {
    if (options?.config) {
      controls.updateConfig(options.config);
    }
  }, [controls, options?.config]);

  useEffect(() => {
    if (options?.active === false) return;

    let animId: number;
    let lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const newCamera = controls.update(dt);
      setCamera(newCamera);
      setControlsState(controls.getState());

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [controls, options?.active]);

  const rotate = useCallback(
    (da: number, dp: number) => controls.rotate(da, dp),
    [controls]
  );
  const pan = useCallback(
    (dx: number, dy: number) => controls.pan(dx, dy),
    [controls]
  );
  const zoom = useCallback(
    (delta: number) => controls.zoom(delta),
    [controls]
  );
  const focusOn = useCallback(
    (bb: any, fov?: number) => controls.focusOn(bb, fov),
    [controls]
  );
  const lookAt = useCallback(
    (tgt: [number, number, number]) => controls.lookAt(tgt),
    [controls]
  );

  return {
    camera,
    controls,
    state: controlsState,
    rotate,
    pan,
    zoom,
    focusOn,
    lookAt,
  };
}

export interface UseScrollScene3DOptions extends Omit<ScrollSceneOptions, "timeline"> {
  readonly progress?: number;
}

export interface UseScrollScene3DResult {
  readonly state: ScrollSceneState;
  readonly progress: number;
  readonly activeSectionId?: string;
  readonly camera: Camera3DConfig;
  readonly objects: ScrollSceneState["objects"];
  readonly setProgress: (progress: number) => void;
  readonly controller: ScrollSceneController;
}

export function useScrollScene3D(
  timeline: ScrollSceneTimeline | string,
  options?: UseScrollScene3DOptions
): UseScrollScene3DResult {
  const resolvedTimeline = useMemo(() => {
    if (typeof timeline === "string") {
      return getScrollTimelinePreset(timeline);
    }
    return timeline;
  }, [timeline]);

  const controllerRef = useRef<ScrollSceneController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new ScrollSceneController({
      timeline: resolvedTimeline,
      initialCamera: options?.initialCamera,
      respectReducedMotion: options?.respectReducedMotion,
      onProgress: options?.onProgress,
      onSectionChange: options?.onSectionChange,
    });
  }
  const controller = controllerRef.current;

  const [state, setState] = useState<ScrollSceneState>(() =>
    controller.evaluate(options?.progress ?? 0)
  );

  useEffect(() => {
    if (options?.container) {
      controller.attachScroll(options.container);
      return () => controller.detachScroll();
    }
  }, [controller, options?.container]);

  useEffect(() => {
    if (typeof options?.progress === "number") {
      const nextState = controller.evaluate(options.progress);
      setState(nextState);
    }
  }, [controller, options?.progress]);

  const setProgress = useCallback(
    (p: number) => {
      const nextState = controller.evaluate(p);
      setState(nextState);
    },
    [controller]
  );

  return {
    state,
    progress: state.progress,
    activeSectionId: state.activeSectionId,
    camera: state.camera,
    objects: state.objects,
    setProgress,
    controller,
  };
}

export function useScrollProgress3D(
  targetOrContainer?: HTMLElement | Window | null
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = targetOrContainer ?? window;

    const onScroll = () => {
      let p = 0;
      if (target === window || !("scrollHeight" in target)) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        p = max > 0 ? window.scrollY / max : 0;
      } else {
        const el = target as HTMLElement;
        const max = el.scrollHeight - el.clientHeight;
        p = max > 0 ? el.scrollTop / max : 0;
      }
      setProgress(Math.max(0, Math.min(1, p)));
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => target.removeEventListener("scroll", onScroll);
  }, [targetOrContainer]);

  return progress;
}

export interface InteractiveScene3DViewProps {
  readonly preset?: InteractionPresetName;
  readonly options?: Interaction3DOptions;
  readonly cameraControls?: CameraControlsConfig;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: (result: {
    interaction: UseInteraction3DResult;
    controls: UseCameraControls3DResult;
  }) => ReactNode;
}

export function InteractiveScene3DView({
  preset = "product-showcase",
  options,
  cameraControls,
  className,
  style,
  children,
}: InteractiveScene3DViewProps) {
  const presetConfig = useMemo(() => getInteractionPreset(preset), [preset]);

  const mergedControlsConfig = useMemo(
    () => ({ ...presetConfig.cameraControls, ...cameraControls }),
    [presetConfig, cameraControls]
  );

  const controls = useCameraControls3D({ config: mergedControlsConfig });

  const mergedInteractionOptions = useMemo(
    () => ({ ...presetConfig.interactionOptions, ...options }),
    [presetConfig, options]
  );

  const interaction = useInteraction3D(mergedInteractionOptions, controls.controls);

  return createElement(
    "div",
    {
      ref: interaction.ref,
      className,
      style: {
        position: "relative",
        outline: "none",
        ...style,
      },
      tabIndex: 0,
      "data-interaction-preset": preset,
      "data-hovered-object": interaction.hoveredObjectId ?? undefined,
      "data-selected-count": interaction.selectedObjectIds.length,
    },
    typeof children === "function" ? children({ interaction, controls }) : null
  );
}

export interface ScrollScene3DViewProps {
  readonly timeline: ScrollSceneTimeline | string;
  readonly progress?: number;
  readonly options?: UseScrollScene3DOptions;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: (scene: UseScrollScene3DResult) => ReactNode;
}

export function ScrollScene3DView({
  timeline,
  progress,
  options,
  className,
  style,
  children,
}: ScrollScene3DViewProps) {
  const scrollScene = useScrollScene3D(timeline, { ...options, progress });

  return createElement(
    "div",
    {
      className,
      style,
      "data-scroll-progress": scrollScene.progress.toFixed(3),
      "data-active-section": scrollScene.activeSectionId,
    },
    typeof children === "function" ? children(scrollScene) : null
  );
}

// ============================================================================
// 3D Scene Composition & AI Scene Generation (Prompt 81)
// ============================================================================

import {
  createScene3DComposition,
  generate3DSceneFromIntent,
  getSceneRecipe,
  resolveScene3DQualityProfile,
  Scene3DPerformanceMonitor,
  type Scene3DCompositionDefinition,
  type Scene3DCompositionInstance,
  type Scene3DIntent,
  type Scene3DQualityLevel,
  type Scene3DQualityProfile,
  type Scene3DRecipeName,
  type Scene3DSpecification,
  type FallbackResolutionOptions,
  type Scene3DFallbackDecision,
} from "./3d/index.js";

const Scene3DCompositionContext = createContext<Scene3DCompositionInstance | null>(null);

export interface Scene3DCompositionProviderProps {
  readonly composition: Scene3DCompositionInstance;
  readonly children?: ReactNode;
}

export function Scene3DCompositionProvider({
  composition,
  children,
}: Scene3DCompositionProviderProps) {
  return createElement(
    Scene3DCompositionContext.Provider,
    { value: composition },
    children
  );
}

export function useScene3DComposition(): Scene3DCompositionInstance {
  const context = useContext(Scene3DCompositionContext);
  if (!context) {
    throw new Error("useScene3DComposition must be used within a Scene3DCompositionProvider");
  }
  return context;
}

export interface UseGenerateScene3DResult {
  readonly spec: Scene3DSpecification;
  readonly fallbackDecision: Scene3DFallbackDecision;
  readonly validationReport: ValidationReport;
  readonly appliedIntent: Scene3DIntent;
  readonly regenerate: (newIntent?: Scene3DIntent | string) => void;
}

export function useGenerateScene3D(
  initialIntentOrPrompt: Scene3DIntent | string,
  options?: FallbackResolutionOptions
): UseGenerateScene3DResult {
  const [currentIntent, setCurrentIntent] = useState<Scene3DIntent | string>(initialIntentOrPrompt);
  const result = useMemo(
    () => generate3DSceneFromIntent(currentIntent, options),
    [currentIntent, options]
  );

  const regenerate = useCallback((newIntent?: Scene3DIntent | string) => {
    if (newIntent !== undefined) {
      setCurrentIntent(newIntent);
    } else {
      setCurrentIntent((prev) => (typeof prev === "string" ? `${prev} ` : { ...prev }));
    }
  }, []);

  return {
    ...result,
    regenerate,
  };
}

export interface UseScenePerformanceResult {
  readonly quality: Scene3DQualityLevel;
  readonly profile: Scene3DQualityProfile;
  readonly fps: number;
  readonly setQuality: (level: Scene3DQualityLevel) => void;
  readonly recordFrame: () => void;
  readonly shouldRender: boolean;
  readonly monitor: Scene3DPerformanceMonitor;
}

export function useScenePerformance(
  initialQuality: Scene3DQualityLevel = "high"
): UseScenePerformanceResult {
  const [quality, setQualityState] = useState<Scene3DQualityLevel>(initialQuality);
  const [fps, setFps] = useState(60);

  const monitor = useMemo(() => {
    return new Scene3DPerformanceMonitor({
      initialProfile: initialQuality,
      onQualityDegrade: (newLevel) => {
        setQualityState(newLevel);
      },
    });
  }, [initialQuality]);

  const setQuality = useCallback(
    (level: Scene3DQualityLevel) => {
      monitor.setProfile(level);
      setQualityState(level);
    },
    [monitor]
  );

  const recordFrame = useCallback(() => {
    monitor.recordFrame();
    setFps(monitor.getAverageFps());
  }, [monitor]);

  return {
    quality,
    profile: monitor.getProfile(),
    fps,
    setQuality,
    recordFrame,
    shouldRender: monitor.shouldRender(),
    monitor,
  };
}

export interface Scene3DCompositionViewProps {
  readonly definition?: Scene3DCompositionDefinition;
  readonly intent?: Scene3DIntent | string;
  readonly recipe?: Scene3DRecipeName;
  readonly quality?: Scene3DQualityLevel;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly onSpecChange?: (spec: Scene3DSpecification) => void;
  readonly onQualityDegrade?: (quality: Scene3DQualityLevel) => void;
  readonly children?: (composition: Scene3DCompositionInstance) => ReactNode;
}

export function Scene3DCompositionView({
  definition,
  intent,
  recipe,
  quality = "high",
  className,
  style,
  onSpecChange,
  onQualityDegrade,
  children,
}: Scene3DCompositionViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const resolvedDefinition = useMemo<Scene3DCompositionDefinition>(() => {
    if (definition) return definition;
    if (intent) {
      const gen = generate3DSceneFromIntent(intent);
      return {
        id: gen.spec.id,
        name: gen.spec.name,
        spec: gen.spec,
        performance: { qualityProfile: quality },
      };
    }
    if (recipe) {
      const spec = getSceneRecipe(recipe);
      return {
        id: spec.id,
        name: spec.name,
        spec,
        recipe,
        performance: { qualityProfile: quality },
      };
    }
    const defaultSpec = getSceneRecipe("product-showcase");
    return {
      id: defaultSpec.id,
      name: defaultSpec.name,
      spec: defaultSpec,
      performance: { qualityProfile: quality },
    };
  }, [definition, intent, recipe, quality]);

  const [composition, setComposition] = useState<Scene3DCompositionInstance | null>(null);

  useEffect(() => {
    const comp = createScene3DComposition(resolvedDefinition, {
      domElement: containerRef.current ?? undefined,
      onQualityDegrade,
      onSpecChange,
    });
    setComposition(comp);

    return () => {
      comp.destroy();
      setComposition(null);
    };
  }, [resolvedDefinition, onQualityDegrade, onSpecChange]);

  return createElement(
    "div",
    {
      ref: containerRef,
      className,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      },
      "data-scene-id": composition?.spec.id ?? resolvedDefinition.id,
      "data-scene-quality": quality,
      tabIndex: 0,
    },
    composition
      ? createElement(
          Scene3DCompositionProvider,
          { composition },
          typeof children === "function" ? children(composition) : null
        )
      : null
  );
}

// ============================================================================
// Animation Intelligence React Hooks (Prompt 82)
// ============================================================================

import {
  animationIntelligenceEngine,
  recommendAnimation,
  recommendComponentMotion,
  explainAnimationSelection,
  classifyMotionIntent,
  AnimationIntelligenceEngine,
  type AnimationRecommendation,
  type AnimationRecommendationResult,
  type AnimationSelectionContext,
  type ComponentCategory,
  type ComponentMotionPlan,
  type MotionIntent,
} from "./core/animation-intelligence/index.js";

export interface UseAnimationIntelligenceResult {
  readonly engine: AnimationIntelligenceEngine;
  readonly recommend: (context: AnimationSelectionContext) => AnimationRecommendationResult;
  readonly recommendComponent: (
    componentType: ComponentCategory,
    options?: Parameters<AnimationIntelligenceEngine["recommendComponentMotion"]>[1]
  ) => ComponentMotionPlan;
  readonly explain: (recommendation: AnimationRecommendation) => string;
  readonly classifyIntent: (input: string | { componentType?: ComponentCategory; intent?: MotionIntent }) => ReturnType<typeof classifyMotionIntent>;
}

export function useAnimationIntelligence(options?: {
  engine?: AnimationIntelligenceEngine;
}): UseAnimationIntelligenceResult {
  const engine = options?.engine ?? animationIntelligenceEngine;

  return useMemo(
    () => ({
      engine,
      recommend: (ctx: AnimationSelectionContext) => engine.recommendAnimation(ctx),
      recommendComponent: (type: ComponentCategory, opts) => engine.recommendComponentMotion(type, opts),
      explain: (rec: AnimationRecommendation) => engine.explainAnimationSelection(rec),
      classifyIntent: (inp) => classifyMotionIntent(inp),
    }),
    [engine]
  );
}

export function useRecommendedAnimation(
  context: AnimationSelectionContext
): AnimationRecommendationResult {
  // Serialize key context dependencies to prevent unnecessary recalculations from object reference churn
  const serializedKey = useMemo(() => {
    return JSON.stringify({
      componentType: context.componentType,
      intent: context.intent,
      trigger: context.trigger,
      visualStyle: context.visualStyle,
      motionDNA: typeof context.motionDNA === "object" ? context.motionDNA?.personality : context.motionDNA,
      reducedMotion: context.reducedMotion,
      deviceTier: context.deviceTier,
      existingAnimations: context.existingAnimations,
    });
  }, [
    context.componentType,
    context.intent,
    context.trigger,
    context.visualStyle,
    context.motionDNA,
    context.reducedMotion,
    context.deviceTier,
    context.existingAnimations,
  ]);

  return useMemo(() => {
    return recommendAnimation(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedKey]);
}

export function useAnimationAlternatives(
  context: AnimationSelectionContext
): readonly AnimationRecommendation[] {
  const result = useRecommendedAnimation(context);
  return result.alternatives;
}
// ============================================================================
// Automatic Transitions & Page Routing (Prompt 83)
// ============================================================================

import {
  createEntranceTransition,
  createExitTransition,
  createPageTransition,
  sharedElementRegistry,
  TransitionController,
  type PageTransitionConfig,
  type PageTransitionDefinition,
  type TransitionConfig,
  type TransitionDefinition,
  type TransitionDirection,
  type TransitionMode,
  type TransitionPattern,
  type TransitionState,
} from "./core/transitions/index.js";

export interface UseEntranceResult<T extends HTMLElement | SVGElement = HTMLElement> {
  readonly ref: (element: T | null) => void;
  readonly enter: () => void;
  readonly state: TransitionState;
  readonly isEntering: boolean;
  readonly hasEntered: boolean;
}

export function useEntrance<T extends HTMLElement | SVGElement = HTMLElement>(
  config?: TransitionConfig,
  options?: { autoStart?: boolean; onComplete?: () => void }
): UseEntranceResult<T> {
  const elementRef = useRef<T | null>(null);
  const [state, setState] = useState<TransitionState>("unmounted");
  const controllerRef = useRef<TransitionController | null>(null);

  const autoStart = options?.autoStart ?? true;

  useEffect(() => {
    const controller = new TransitionController({
      enterConfig: config,
      onStateChange: (s) => setState(s),
      onEntered: () => options?.onComplete?.(),
    });
    controllerRef.current = controller;

    if (elementRef.current && autoStart) {
      controller.enter(elementRef.current);
    }

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [config, autoStart, options?.onComplete]);

  const enter = useCallback(() => {
    if (elementRef.current && controllerRef.current) {
      controllerRef.current.enter(elementRef.current);
    }
  }, []);

  const ref = useCallback((node: T | null) => {
    elementRef.current = node;
    if (node && controllerRef.current && autoStart) {
      controllerRef.current.enter(node);
    }
  }, [autoStart]);

  return {
    ref,
    enter,
    state,
    isEntering: state === "entering",
    hasEntered: state === "entered",
  };
}

export interface UseExitResult<T extends HTMLElement | SVGElement = HTMLElement> {
  readonly ref: (element: T | null) => void;
  readonly exit: (callbacks?: { onComplete?: () => void }) => void;
  readonly state: TransitionState;
  readonly isExiting: boolean;
  readonly hasExited: boolean;
}

export function useExit<T extends HTMLElement | SVGElement = HTMLElement>(
  config?: TransitionConfig,
  options?: { onComplete?: () => void }
): UseExitResult<T> {
  const elementRef = useRef<T | null>(null);
  const [state, setState] = useState<TransitionState>("entered");
  const controllerRef = useRef<TransitionController | null>(null);

  useEffect(() => {
    const controller = new TransitionController({
      exitConfig: config,
      onStateChange: (s) => setState(s),
      onExited: () => options?.onComplete?.(),
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [config, options?.onComplete]);

  const exit = useCallback((callbacks?: { onComplete?: () => void }) => {
    if (elementRef.current && controllerRef.current) {
      controllerRef.current.exit(elementRef.current, callbacks);
    }
  }, []);

  const ref = useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);

  return {
    ref,
    exit,
    state,
    isExiting: state === "exiting",
    hasExited: state === "exited",
  };
}

export interface UseMotionTransitionResult<T extends HTMLElement | SVGElement = HTMLElement> {
  readonly ref: (element: T | null) => void;
  readonly state: TransitionState;
  readonly isMounted: boolean;
  readonly isEntering: boolean;
  readonly isExiting: boolean;
}

export function useMotionTransition<T extends HTMLElement | SVGElement = HTMLElement>(
  show: boolean,
  config?: TransitionConfig
): UseMotionTransitionResult<T> {
  const elementRef = useRef<T | null>(null);
  const [state, setState] = useState<TransitionState>(show ? "entering" : "unmounted");
  const [isMounted, setIsMounted] = useState<boolean>(show);
  const controllerRef = useRef<TransitionController | null>(null);

  useEffect(() => {
    const controller = new TransitionController({
      enterConfig: config,
      exitConfig: config,
      onStateChange: (s) => setState(s),
      onExited: () => {
        setIsMounted(false);
      },
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [config]);

  useEffect(() => {
    if (show) {
      setIsMounted(true);
      if (elementRef.current && controllerRef.current) {
        controllerRef.current.enter(elementRef.current);
      }
    } else if (isMounted) {
      if (elementRef.current && controllerRef.current) {
        controllerRef.current.exit(elementRef.current);
      } else {
        setIsMounted(false);
      }
    }
  }, [show, isMounted]);

  const ref = useCallback((node: T | null) => {
    elementRef.current = node;
    if (node && controllerRef.current && show) {
      controllerRef.current.enter(node);
    }
  }, [show]);

  return {
    ref,
    state,
    isMounted,
    isEntering: state === "entering",
    isExiting: state === "exiting",
  };
}

// Canonical alias as requested in Prompt 83 specification
export const useTransition = useMotionTransition;

export interface UsePageTransitionResult {
  readonly activeKey: string;
  readonly direction: "forward" | "backward";
  readonly isTransitioning: boolean;
  readonly pageTransition: PageTransitionDefinition;
}

export function usePageTransition(
  activeKey: string,
  config?: PageTransitionConfig
): UsePageTransitionResult {
  const historyRef = useRef<string[]>([activeKey]);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const history = historyRef.current;
    const prevKey = history[history.length - 1];

    if (activeKey !== prevKey) {
      const existingIdx = history.indexOf(activeKey);
      let detectedDir: "forward" | "backward" = "forward";

      if (existingIdx !== -1 && existingIdx < history.length - 1) {
        detectedDir = "backward";
        history.splice(existingIdx + 1);
      } else {
        detectedDir = "forward";
        history.push(activeKey);
      }

      setDirection(detectedDir);
      setIsTransitioning(true);

      const timeout = setTimeout(() => {
        setIsTransitioning(false);
      }, config?.duration ?? 350);

      return () => clearTimeout(timeout);
    }
  }, [activeKey, config?.duration]);

  const pageTransition = useMemo(() => {
    return createPageTransition(config, { direction });
  }, [config, direction]);

  return {
    activeKey,
    direction,
    isTransitioning,
    pageTransition,
  };
}

export interface TransitionProps {
  readonly show: boolean;
  readonly pattern?: TransitionPattern;
  readonly config?: TransitionConfig;
  readonly unmountOnExit?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly onEntered?: () => void;
  readonly onExited?: () => void;
  readonly children?: ReactNode | ((state: TransitionState) => ReactNode);
}

export function Transition({
  show,
  pattern = "slide",
  config,
  unmountOnExit = true,
  className,
  style,
  onEntered,
  onExited,
  children,
}: TransitionProps) {
  const mergedConfig = useMemo(() => ({ pattern, ...config }), [pattern, config]);
  const { ref, state, isMounted } = useMotionTransition<HTMLDivElement>(show, mergedConfig);

  useEffect(() => {
    if (state === "entered") {
      onEntered?.();
    } else if (state === "exited") {
      onExited?.();
    }
  }, [state, onEntered, onExited]);

  if (unmountOnExit && !isMounted) {
    return null;
  }

  return createElement(
    "div",
    {
      ref,
      className,
      style: {
        ...style,
        display: !unmountOnExit && !isMounted ? "none" : style?.display,
      },
      "data-transition-state": state,
      "data-transition-pattern": pattern,
    },
    typeof children === "function" ? children(state) : children
  );
}

export interface TransitionGroupProps {
  readonly pattern?: TransitionPattern;
  readonly stagger?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

export function TransitionGroup({
  pattern = "slide",
  stagger = 60,
  className,
  style,
  children,
}: TransitionGroupProps) {
  const childArray = Children.toArray(children);

  return createElement(
    "div",
    {
      className,
      style,
      "data-transition-group": "true",
      "data-stagger": stagger,
    },
    childArray.map((child: any, index: number) => {
      if (!isValidElement(child)) return child;
      return createElement(
        Transition,
        {
          key: child.key ?? ("transition-child-" + index),
          show: true,
          pattern,
          config: { delay: index * stagger },
        },
        child
      );
    })
  );
}
// ============================================================================
// Intelligent Scroll Animation Generation (Prompt 84)
// ============================================================================

import {
  generateScrollPlan,
  classifyScrollIntent,
  scrollIntelligenceRuntime,
  type ScrollPlan,
  type ScrollIntelligenceContext,
  type ScrollIntelligenceResult,
  type ScrollAnimationType,
  type ScrollRuntimeProgressState,
  type ScrollRuntimeControls,
} from "./core/scroll-intelligence/index.js";
import { parallax, type ParallaxOptions } from "./effects/parallax.js";

export function useScrollIntelligence(
  context: ScrollIntelligenceContext
): ScrollIntelligenceResult {
  const serializedKey = useMemo(() => {
    return JSON.stringify({
      intent: context.intent,
      type: context.type,
      componentType: context.componentType,
      visualStyle: context.visualStyle,
      motionDNA: context.motionDNA,
      direction: context.direction,
      reversible: context.reversible,
      progressMode: context.progressMode,
      startOffset: context.startOffset,
      endOffset: context.endOffset,
      stagger: context.stagger,
      deviceTier: context.deviceTier,
      reducedMotion: context.reducedMotion,
    });
  }, [
    context.intent,
    context.type,
    context.componentType,
    context.visualStyle,
    context.motionDNA,
    context.direction,
    context.reversible,
    context.progressMode,
    context.startOffset,
    context.endOffset,
    context.stagger,
    context.deviceTier,
    context.reducedMotion,
  ]);

  return useMemo(() => {
    return generateScrollPlan(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedKey]);
}

export interface UseScrollAnimationResult<T extends HTMLElement = HTMLElement> {
  readonly ref: (element: T | null) => void;
  readonly progress: number;
  readonly direction: "down" | "up";
  readonly inView: boolean;
  readonly controls: ScrollRuntimeControls | null;
}

export function useScrollAnimation<T extends HTMLElement = HTMLElement>(
  planOrContext: ScrollPlan | ScrollIntelligenceContext,
  options?: { onEnter?: () => void; onLeave?: () => void }
): UseScrollAnimationResult<T> {
  const elementRef = useRef<T | null>(null);
  const controlsRef = useRef<ScrollRuntimeControls | null>(null);

  const [state, setState] = useState<ScrollRuntimeProgressState>({
    progress: 0,
    rawProgress: 0,
    direction: "down",
    velocity: 0,
    inView: false,
  });

  const resolvedPlan = useMemo<ScrollPlan>(() => {
    if ("properties" in planOrContext && "startOffset" in planOrContext) {
      return planOrContext as ScrollPlan;
    }
    return generateScrollPlan(planOrContext as ScrollIntelligenceContext).plan;
  }, [planOrContext]);

  const attachElement = useCallback(
    (node: T | null) => {
      if (controlsRef.current) {
        controlsRef.current.destroy();
        controlsRef.current = null;
      }

      elementRef.current = node;

      if (node) {
        const controls = scrollIntelligenceRuntime.register(
          resolvedPlan,
          node,
          {
            onProgress: (s) => setState(s),
            onEnter: options?.onEnter,
            onLeave: options?.onLeave,
          }
        );
        controlsRef.current = controls;
      }
    },
    [resolvedPlan, options?.onEnter, options?.onLeave]
  );

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.destroy();
        controlsRef.current = null;
      }
    };
  }, []);

  return {
    ref: attachElement,
    progress: state.progress,
    direction: state.direction,
    inView: state.inView,
    controls: controlsRef.current,
  };
}

export interface UseParallaxResult<T extends HTMLElement = HTMLElement> {
  readonly ref: (element: T | null) => void;
}

export function useParallax<T extends HTMLElement = HTMLElement>(
  options: ParallaxOptions = {}
): UseParallaxResult<T> {
  const elementRef = useRef<T | null>(null);
  const controlsRef = useRef<{ destroy(): void } | null>(null);

  const attachElement = useCallback(
    (node: T | null) => {
      if (controlsRef.current) {
        controlsRef.current.destroy();
        controlsRef.current = null;
      }

      elementRef.current = node;

      if (node) {
        controlsRef.current = parallax(node, options);
      }
    },
    [options.speed, options.axis, options.maxOffset, options.easing]
  );

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.destroy();
        controlsRef.current = null;
      }
    };
  }, []);

  return {
    ref: attachElement,
  };
}

export interface ScrollRevealProps {
  readonly pattern?: ScrollAnimationType;
  readonly context?: ScrollIntelligenceContext;
  readonly startOffset?: string | number;
  readonly endOffset?: string | number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode | ((state: ScrollRuntimeProgressState) => ReactNode);
}

export function ScrollReveal({
  pattern = "reveal",
  context,
  startOffset,
  endOffset,
  className,
  style,
  children,
}: ScrollRevealProps) {
  const mergedContext = useMemo<ScrollIntelligenceContext>(
    () => ({
      type: pattern,
      startOffset,
      endOffset,
      ...context,
    }),
    [pattern, startOffset, endOffset, context]
  );

  const { ref, progress, direction, inView } = useScrollAnimation<HTMLDivElement>(mergedContext);

  const state: ScrollRuntimeProgressState = {
    progress,
    rawProgress: progress,
    direction,
    velocity: 0,
    inView,
  };

  return createElement(
    "div",
    {
      ref,
      className,
      style,
      "data-scroll-reveal": "true",
      "data-scroll-progress": progress.toFixed(3),
      "data-in-view": inView ? "true" : "false",
    },
    typeof children === "function" ? children(state) : children
  );
}

export interface ScrollProgressProps {
  readonly color?: string;
  readonly height?: number | string;
  readonly position?: "top" | "bottom" | "fixed" | "absolute";
  readonly zIndex?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
}

export function ScrollProgress({
  color = "#3b82f6",
  height = 4,
  position = "fixed",
  zIndex = 9999,
  className,
  style,
}: ScrollProgressProps) {
  const plan = useMemo(
    () =>
      generateScrollPlan({
        type: "progress-indicator",
        progressMode: "viewport",
      }).plan,
    []
  );

  const { ref, progress } = useScrollAnimation<HTMLDivElement>(plan);

  const isTop = position === "top" || position === "fixed";
  const posStyle: CSSProperties = {
    position: position === "top" || position === "bottom" ? "fixed" : position,
    top: isTop ? 0 : undefined,
    bottom: !isTop ? 0 : undefined,
    left: 0,
    right: 0,
    width: "100%",
    height,
    backgroundColor: color,
    transformOrigin: "0% 50%",
    transform: `scaleX(${progress})`,
    zIndex,
    pointerEvents: "none",
    ...style,
  };

  return createElement("div", {
    ref,
    className,
    style: posStyle,
    "data-scroll-progress-bar": "true",
    "data-progress": progress.toFixed(3),
  });
}

export interface ScrollSceneProps {
  readonly timeline?: any;
  readonly startOffset?: string | number;
  readonly endOffset?: string | number;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode | ((progress: number) => ReactNode);
}

export function ScrollScene({
  timeline,
  startOffset = "top top",
  endOffset = "bottom bottom",
  className,
  style,
  children,
}: ScrollSceneProps) {
  const context = useMemo<ScrollIntelligenceContext>(
    () => ({
      type: "scroll-3d-sync",
      startOffset,
      endOffset,
    }),
    [startOffset, endOffset]
  );

  const { ref, progress } = useScrollAnimation<HTMLDivElement>(context);

  return createElement(
    "div",
    {
      ref,
      className,
      style,
      "data-scroll-scene": "true",
      "data-scroll-progress": progress.toFixed(3),
    },
    typeof children === "function" ? children(progress) : children
  );
}

// ---------------------------------------------------------------------------
// Prompt 85: Intelligent Interactive Components & Microinteractions
// ---------------------------------------------------------------------------

import {
  generateMicrointeractionPlan,
  classifyMicrointeractionIntent,
  createMicrointeractionController,
  type MicroComponentCategory,
  type InteractionState,
  type MicrointeractionTrigger,
  type MicrointeractionFeedbackType,
  type MicrointeractionConfig,
  type MicrointeractionPlan,
  type MicrointeractionContext,
  type MicrointeractionResult,
  type MicrointeractionRuntimeControls,
} from "./core/microinteractions/index.js";

export interface UseMicrointeractionOptions extends MicrointeractionContext {
  readonly onStateChange?: (state: InteractionState, plan: MicrointeractionPlan) => void;
}

export interface UseMicrointeractionResult<T extends HTMLElement = HTMLElement> {
  readonly ref: (node: T | null) => void;
  readonly state: InteractionState;
  readonly isHovered: boolean;
  readonly isPressed: boolean;
  readonly isFocused: boolean;
  readonly plan: MicrointeractionPlan;
  readonly setState: (state: InteractionState) => void;
  readonly handlers: {
    readonly onPointerEnter: (e?: any) => void;
    readonly onPointerLeave: (e?: any) => void;
    readonly onPointerDown: (e?: any) => void;
    readonly onPointerUp: (e?: any) => void;
    readonly onFocus: (e?: any) => void;
    readonly onBlur: (e?: any) => void;
    readonly onKeyDown: (e?: any) => void;
    readonly onKeyUp: (e?: any) => void;
  };
}

export function useMicrointeraction<T extends HTMLElement = HTMLElement>(
  categoryOrOptions: MicroComponentCategory | UseMicrointeractionOptions = "button"
): UseMicrointeractionResult<T> {
  const options = useMemo<UseMicrointeractionOptions>(() => {
    if (typeof categoryOrOptions === "string") {
      return { category: categoryOrOptions };
    }
    return categoryOrOptions;
  }, [categoryOrOptions]);

  const [currentState, setCurrentState] = useState<InteractionState>(options.fromState ?? "idle");
  const elementRef = useRef<T | null>(null);
  const controllerRef = useRef<any>(null);

  const planResult = useMemo(() => {
    return generateMicrointeractionPlan({
      ...options,
      toState: currentState,
    });
  }, [options, currentState]);

  const updateState = useCallback(
    (nextState: InteractionState) => {
      if (options.disabled && nextState !== "disabled") return;
      setCurrentState(nextState);
      if (controllerRef.current) {
        controllerRef.current.setState(nextState);
      }
    },
    [options.disabled]
  );

  const attachElement = useCallback(
    (node: T | null) => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
      elementRef.current = node;
      if (node) {
        const ctrl = createMicrointeractionController({
          ...options,
          fromState: currentState,
          onStateChange: (st, pl) => {
            setCurrentState(st);
            if (options.onStateChange) options.onStateChange(st, pl);
          },
        });
        ctrl.attach(node);
        controllerRef.current = ctrl;
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, []);

  const handlers = useMemo(
    () => ({
      onPointerEnter: () => updateState("hover"),
      onPointerLeave: () => updateState("idle"),
      onPointerDown: () => updateState("press"),
      onPointerUp: () => updateState("hover"),
      onFocus: () => updateState("focus-visible"),
      onBlur: () => updateState("idle"),
      onKeyDown: (e?: any) => {
        if (e && (e.key === "Enter" || e.key === " ")) {
          updateState("press");
        }
      },
      onKeyUp: (e?: any) => {
        if (e && (e.key === "Enter" || e.key === " ")) {
          updateState("hover");
        }
      },
    }),
    [updateState]
  );

  return {
    ref: attachElement,
    state: currentState,
    isHovered: currentState === "hover",
    isPressed: currentState === "press",
    isFocused: currentState === "focus" || currentState === "focus-visible",
    plan: planResult.plan,
    setState: updateState,
    handlers,
  };
}

export interface UseInteractionFeedbackResult<T extends HTMLElement = HTMLElement> {
  readonly ref: (node: T | null) => void;
  readonly triggerFeedback: (type?: "success" | "error" | "press" | "loading") => void;
  readonly state: InteractionState;
  readonly isAnimating: boolean;
}

export function useInteractionFeedback<T extends HTMLElement = HTMLElement>(
  category: MicroComponentCategory = "button",
  options?: MicrointeractionContext
): UseInteractionFeedbackResult<T> {
  const [activeState, setActiveState] = useState<InteractionState>("idle");
  const [isAnimating, setIsAnimating] = useState(false);

  const { ref, setState } = useMicrointeraction<T>({
    category,
    ...options,
    onStateChange: (st) => setActiveState(st),
  });

  const triggerFeedback = useCallback(
    (type: "success" | "error" | "press" | "loading" = "success") => {
      setState(type);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setState("idle");
        setIsAnimating(false);
      }, 400);
      return () => clearTimeout(timer);
    },
    [setState]
  );

  return {
    ref,
    triggerFeedback,
    state: activeState,
    isAnimating,
  };
}

export interface InteractiveProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  readonly as?: any;
  readonly category?: MicroComponentCategory;
  readonly intent?: string;
  readonly visualStyle?: string;
  readonly motionDNA?: string;
  readonly disabled?: boolean;
  readonly children?:
    | ReactNode
    | ((state: {
        state: InteractionState;
        isHovered: boolean;
        isPressed: boolean;
        isFocused: boolean;
      }) => ReactNode);
}

export const Interactive = /* @__PURE__ */ forwardRef<HTMLElement, InteractiveProps>(
  function Interactive(
    {
      as: Component = "div",
      category = "button",
      intent,
      visualStyle,
      motionDNA,
      disabled = false,
      className,
      style,
      children,
      ...htmlProps
    },
    forwardedRef
  ) {
    const { ref, state, isHovered, isPressed, isFocused, handlers } = useMicrointeraction({
      category,
      intent,
      visualStyle,
      motionDNA,
      disabled,
    });

    const combinedRef = useCallback(
      (node: HTMLElement | null) => {
        ref(node);
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef && "current" in forwardedRef) {
          (forwardedRef as any).current = node;
        }
      },
      [ref, forwardedRef]
    );

    const mergedProps = {
      ...htmlProps,
      ref: combinedRef,
      className,
      style: {
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none" as const,
        ...style,
      },
      "data-interaction-state": state,
      "data-hovered": isHovered ? "true" : "false",
      "data-pressed": isPressed ? "true" : "false",
      "data-focused": isFocused ? "true" : "false",
      tabIndex: htmlProps.tabIndex ?? (disabled ? -1 : 0),
      onPointerEnter: handlers.onPointerEnter,
      onPointerLeave: handlers.onPointerLeave,
      onPointerDown: handlers.onPointerDown,
      onPointerUp: handlers.onPointerUp,
      onFocus: handlers.onFocus,
      onBlur: handlers.onBlur,
      onKeyDown: handlers.onKeyDown,
      onKeyUp: handlers.onKeyUp,
    };

    return createElement(
      Component,
      mergedProps,
      typeof children === "function"
        ? children({ state, isHovered, isPressed, isFocused })
        : children
    );
  }
);

// ---------------------------------------------------------------------------
// Prompt 86: Intelligent Choreography & 2D/3D Synchronization
// ---------------------------------------------------------------------------

import {
  generateChoreographyPlan,
  classifyChoreographyIntent,
  createCrossSystemSyncBridge,
  CrossSystemSyncBridge,
  type ChoreographyPlan,
  type ChoreographyParticipant,
  type ChoreographyIntelligenceContext,
  type ChoreographyIntelligenceResult,
  type CrossSystemSyncBridgeControls,
  type ChoreographyPattern,
  type ChoreographySystemType,
} from "./core/choreography-intelligence/index.js";

const ChoreographyContext = /* @__PURE__ */ createContext<CrossSystemSyncBridge | null>(null);

export interface UseChoreographyOptions {
  readonly autoPlay?: boolean;
  readonly onUpdate?: (progress: number) => void;
  readonly onComplete?: () => void;
}

export interface UseChoreographyResult {
  readonly bridge: CrossSystemSyncBridge;
  readonly progress: number;
  readonly isPlaying: boolean;
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reverse: () => Promise<void>;
  readonly seek: (progress: number) => void;
  readonly cancel: () => void;
  readonly plan: ChoreographyPlan;
}

export function useChoreography(
  planOrContext: ChoreographyPlan | ChoreographyIntelligenceContext = {},
  options: UseChoreographyOptions = {}
): UseChoreographyResult {
  const plan = useMemo<ChoreographyPlan>(() => {
    if ("participants" in planOrContext && "pattern" in planOrContext) {
      return planOrContext as ChoreographyPlan;
    }
    return generateChoreographyPlan(planOrContext as ChoreographyIntelligenceContext).plan;
  }, [planOrContext]);

  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const bridge = useMemo(() => {
    return createCrossSystemSyncBridge({
      duration: plan.duration,
      participants: plan.participants,
      onUpdate: (p) => {
        setProgress(p);
        if (options.onUpdate) options.onUpdate(p);
      },
      onComplete: () => {
        setIsPlaying(false);
        if (options.onComplete) options.onComplete();
      },
    });
  }, [plan]);

  useEffect(() => {
    if (options.autoPlay) {
      setIsPlaying(true);
      bridge.play().then(() => setIsPlaying(false));
    }
    return () => {
      bridge.destroy();
    };
  }, [bridge, options.autoPlay]);

  const play = useCallback(async () => {
    setIsPlaying(true);
    await bridge.play();
    setIsPlaying(false);
  }, [bridge]);

  const reverse = useCallback(async () => {
    setIsPlaying(true);
    await bridge.reverse();
    setIsPlaying(false);
  }, [bridge]);

  return {
    bridge,
    progress,
    isPlaying,
    play,
    pause: useCallback(() => {
      bridge.pause();
      setIsPlaying(false);
    }, [bridge]),
    resume: useCallback(() => {
      bridge.resume();
      setIsPlaying(true);
    }, [bridge]),
    reverse,
    seek: useCallback((p: number) => bridge.seek(p), [bridge]),
    cancel: useCallback(() => {
      bridge.cancel();
      setIsPlaying(false);
    }, [bridge]),
    plan,
  };
}

export function useChoreographyProgress(bridge?: CrossSystemSyncBridge | null): number {
  const contextBridge = useContext(ChoreographyContext);
  const activeBridge = bridge ?? contextBridge;
  const [prog, setProg] = useState(() => (activeBridge ? activeBridge.getProgress() : 0));

  useEffect(() => {
    if (!activeBridge) return;
    return activeBridge.subscribe((p) => setProg(p));
  }, [activeBridge]);

  return prog;
}

export interface UseSynchronizedMotionOptions {
  readonly id?: string;
  readonly system?: ChoreographySystemType;
  readonly startProgress?: number;
  readonly endProgress?: number;
  readonly onUpdate?: (normalizedProgress: number, localProgress: number) => void;
}

export interface UseSynchronizedMotionResult<T extends HTMLElement = HTMLElement> {
  readonly ref: (element: T | null) => void;
  readonly progress: number;
  readonly localProgress: number;
}

export function useSynchronizedMotion<T extends HTMLElement = HTMLElement>(
  bridgeOrNull?: CrossSystemSyncBridge | null,
  options: UseSynchronizedMotionOptions = {}
): UseSynchronizedMotionResult<T> {
  const contextBridge = useContext(ChoreographyContext);
  const activeBridge = bridgeOrNull ?? contextBridge;

  const [state, setState] = useState({ progress: 0, localProgress: 0 });
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    if (!activeBridge) return;

    const participantId = options.id ?? `sync-${Math.random().toString(36).slice(2, 9)}`;
    const startProgress = options.startProgress ?? 0;
    const endProgress = options.endProgress ?? 1;

    const unregister = activeBridge.addParticipant({
      id: participantId,
      system: options.system ?? "dom",
      startProgress,
      endProgress,
      onUpdate: (p, lp) => {
        setState({ progress: p, localProgress: lp });
        if (options.onUpdate) options.onUpdate(p, lp);
      },
    });

    return () => unregister();
  }, [activeBridge, options.id, options.system, options.startProgress, options.endProgress, options.onUpdate]);

  const attachElement = useCallback((node: T | null) => {
    elementRef.current = node;
  }, []);

  return {
    ref: attachElement,
    progress: state.progress,
    localProgress: state.localProgress,
  };
}

export interface ChoreographyProps {
  readonly plan?: ChoreographyPlan;
  readonly context?: ChoreographyIntelligenceContext;
  readonly autoPlay?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode | ((controls: UseChoreographyResult) => ReactNode);
}

export function Choreography({
  plan,
  context,
  autoPlay = false,
  className,
  style,
  children,
}: ChoreographyProps) {
  const choreo = useChoreography(plan ?? context ?? {}, { autoPlay });

  return createElement(
    ChoreographyContext.Provider,
    { value: choreo.bridge },
    createElement(
      "div",
      {
        className,
        style,
        "data-choreography-container": "true",
        "data-choreography-progress": choreo.progress.toFixed(3),
        "data-choreography-playing": choreo.isPlaying ? "true" : "false",
      },
      typeof children === "function" ? children(choreo) : children
    )
  );
}

export interface ChoreographyGroupProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export function ChoreographyGroup({
  children,
  className,
  style,
  ...divProps
}: ChoreographyGroupProps) {
  return createElement(
    "div",
    {
      ...divProps,
      className,
      style,
      "data-choreography-group": "true",
    },
    children
  );
}

// ---------------------------------------------------------------------------
// Prompt 87: Unified Motion Optimization & Validation
// ---------------------------------------------------------------------------

import {
  validateMotionConfig,
  optimizeMotion,
  evaluateMotionConsistency,
  type MotionValidationResult,
  type MotionOptimizationOptions,
  type MotionOptimizationResult,
  type MotionConsistencyReport,
  type MotionValidationIssue,
  type OptimizationLevel,
  type ValidationSeverity,
  type ValidationIssueCategory,
} from "./core/motion-validation/index.js";

export function useValidateMotion(config: any): MotionValidationResult {
  return useMemo(() => {
    return validateMotionConfig(config);
  }, [config]);
}

export function useOptimizeMotion<T = any>(
  config: T,
  options?: MotionOptimizationOptions
): MotionOptimizationResult<T> {
  const serializedOpts = JSON.stringify(options);
  return useMemo(() => {
    return optimizeMotion(config, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, serializedOpts]);
}

export function useMotionAccessibility(config: any): {
  readonly isAccessible: boolean;
  readonly accessibilityScore: number;
  readonly issues: readonly MotionValidationIssue[];
  readonly respectsReducedMotion: boolean;
} {
  const result = useValidateMotion(config);
  const accessibilityIssues = useMemo(() => {
    return result.issues.filter(
      (i) =>
        i.category === "seizure-risk" ||
        i.category === "reduced-motion-violation" ||
        i.category === "accessibility-risk"
    );
  }, [result.issues]);

  return {
    isAccessible: accessibilityIssues.filter((i) => i.severity === "error").length === 0,
    accessibilityScore: result.accessibilityScore,
    issues: accessibilityIssues,
    respectsReducedMotion: !accessibilityIssues.some((i) => i.category === "reduced-motion-violation"),
  };
}

export function useMotionConsistency(configs: readonly any[]): MotionConsistencyReport {
  return useMemo(() => {
    return evaluateMotionConsistency(configs);
  }, [configs]);
}

export interface MotionDiagnosticsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly config?: any;
  readonly configs?: readonly any[];
  readonly showDetails?: boolean;
  readonly children?: ReactNode | ((result: MotionValidationResult) => ReactNode);
}

export function MotionDiagnostics({
  config,
  configs,
  showDetails = false,
  className,
  style,
  children,
  ...divProps
}: MotionDiagnosticsProps) {
  const validation = useValidateMotion(config ?? (configs ? configs[0] : {}));

  return createElement(
    "div",
    {
      ...divProps,
      className,
      style,
      "data-motion-diagnostics": "true",
      "data-motion-valid": validation.valid ? "true" : "false",
      "data-motion-health": validation.score,
      "data-accessibility-score": validation.accessibilityScore,
      "data-performance-score": validation.performanceScore,
      "data-consistency-score": validation.consistencyScore,
      "data-issues-count": validation.issues.length,
    },
    typeof children === "function" ? children(validation) : children
  );
}

// React Physics Integration (Prompt 104)
import {
  createPhysicsComposition,
  animatePhysicsComposition,
  getPhysicsRecipe,
  createSpringBehavior,
  createInertialBehavior,
  createGravityBehavior,
  createBoundedBehavior,
  createVector,
  type PhysicsCompositionConfig,
  type PhysicsCompositionControls,
  type PhysicsCompositionState,
  type CollisionBody,
  type CollisionBodyConfig,
  type CollisionConstraint,
  type CollisionConstraintConfig,
  type PhysicsBehavior,
  type PhysicsValue,
  type PhysicsVector,
} from "./core/physics/index.js";

export { createVector };

function applyElementTransform(el: HTMLElement, pos: PhysicsVector): void {
  const x = pos.x;
  const y = pos.y ?? 0;
  const z = pos.z ?? 0;
  el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
}

/* ========================================================================= */
/* 1. usePhysicsComposition Hook                                             */
/* ========================================================================= */

export interface UsePhysicsCompositionOptions<T extends HTMLElement = HTMLElement> {
  /**
   * Whether to automatically start simulation on mount. Default: false.
   */
  autoStart?: boolean;

  /**
   * If true, binds primary body position directly to the returned ref element's transform. Default: true.
   */
  bindTarget?: boolean;

  /**
   * ID of the primary body to track and bind to ref. Default: first body in config.
   */
  primaryBodyId?: string;

  /**
   * Callback fired on each simulation step.
   */
  onUpdate?: (state: PhysicsCompositionState) => void;

  /**
   * Callback fired when all bodies and behaviors settle at rest.
   */
  onSettle?: (state: PhysicsCompositionState) => void;

  /**
   * Callback fired when simulation completes.
   */
  onComplete?: (state: PhysicsCompositionState) => void;

  /**
   * Respect system reduced motion preferences. Default: true.
   */
  respectReducedMotion?: boolean;
}

export interface UsePhysicsCompositionResult<T extends HTMLElement = HTMLElement> {
  /**
   * Ref to attach to the primary DOM element.
   */
  ref: RefObject<T | null>;

  /**
   * Ref callback factory to bind secondary DOM elements directly to specific body IDs.
   */
  bindBody: (bodyId: string) => (node: HTMLElement | null) => void;

  /**
   * Starts simulation progression.
   */
  start: () => void;

  /**
   * Pauses simulation progression.
   */
  pause: () => void;

  /**
   * Resumes paused simulation.
   */
  resume: () => void;

  /**
   * Stops simulation.
   */
  stop: () => void;

  /**
   * Resets simulation coordinates and time to initial state.
   */
  reset: () => void;

  /**
   * Advances simulation deterministically by deltaTime seconds.
   */
  step: (deltaTime?: number) => PhysicsCompositionState;

  /**
   * Returns current composition state.
   */
  getState: () => PhysicsCompositionState;

  /**
   * Returns whether simulation has settled at rest.
   */
  isSettled: () => boolean;

  /**
   * Returns whether simulation is currently active and running.
   */
  isRunning: () => boolean;

  /**
   * Returns whether simulation is paused.
   */
  isPaused: () => boolean;

  /**
   * Returns whether the composition has been disposed.
   */
  isDisposed: () => boolean;

  /**
   * Dynamically adds a body.
   */
  addBody: (config: CollisionBodyConfig) => CollisionBody;

  /**
   * Removes a body by ID.
   */
  removeBody: (id: string) => boolean;

  /**
   * Retrieves a body by ID.
   */
  getBody: (id: string) => CollisionBody | undefined;

  /**
   * Returns all bodies.
   */
  getBodies: () => CollisionBody[];

  /**
   * Dynamically adds a behavior.
   */
  addBehavior: (behavior: PhysicsBehavior) => void;

  /**
   * Removes a behavior by ID.
   */
  removeBehavior: (id: string) => boolean;

  /**
   * Dynamically adds a constraint.
   */
  addConstraint: (config: CollisionConstraintConfig) => CollisionConstraint;

  /**
   * Removes a constraint by ID.
   */
  removeConstraint: (id: string) => boolean;

  /**
   * The underlying composition controls instance.
   */
  composition: PhysicsCompositionControls;
}

export function usePhysicsComposition<T extends HTMLElement = HTMLElement>(
  config?: PhysicsCompositionConfig | (() => PhysicsCompositionConfig),
  options: UsePhysicsCompositionOptions<T> = {}
): UsePhysicsCompositionResult<T> {
  const targetRef = useRef<T | null>(null);
  const boundElementsRef = useRef(new Map<string, HTMLElement>());
  const animationHandleRef = useRef<{ cancel(): void; dispose(): void } | null>(null);
  const isMountedRef = useRef(true);

  // Keep latest callbacks in refs to avoid stale closures
  const onUpdateRef = useRef(options.onUpdate);
  onUpdateRef.current = options.onUpdate;
  const onSettleRef = useRef(options.onSettle);
  onSettleRef.current = options.onSettle;
  const onCompleteRef = useRef(options.onComplete);
  onCompleteRef.current = options.onComplete;

  const initialConfig = useMemo(() => {
    return typeof config === "function" ? config() : config ?? {};
  }, [config]);

  const compositionRef = useRef<PhysicsCompositionControls | null>(null);
  const prevConfigRef = useRef(initialConfig);

  const getOrCreateComposition = useCallback(() => {
    if (!compositionRef.current || compositionRef.current.isDisposed()) {
      compositionRef.current = createPhysicsComposition({
        ...initialConfig,
        autoStart: false,
      });
    }
    return compositionRef.current;
  }, [initialConfig]);

  if (prevConfigRef.current !== initialConfig && compositionRef.current) {
    compositionRef.current.dispose();
    compositionRef.current = null;
    prevConfigRef.current = initialConfig;
  }

  const composition = getOrCreateComposition();
  const primaryId = options.primaryBodyId ?? (initialConfig.bodies && initialConfig.bodies[0]?.id);

  const syncElements = useCallback(() => {
    if (!isMountedRef.current || !compositionRef.current || compositionRef.current.isDisposed()) return;
    const comp = compositionRef.current;

    if (options.bindTarget !== false && targetRef.current) {
      const primaryBody = primaryId ? comp.getBody(primaryId) : comp.getBodies()[0];
      if (primaryBody) {
        applyElementTransform(targetRef.current, primaryBody.position);
      }
    }

    for (const [bodyId, el] of boundElementsRef.current.entries()) {
      const b = comp.getBody(bodyId);
      if (b) {
        applyElementTransform(el, b.position);
      }
    }
  }, [options.bindTarget, primaryId]);

  useEffect(() => {
    isMountedRef.current = true;
    const comp = getOrCreateComposition();

    const unsubUpdate = comp.onUpdate((state) => {
      syncElements();
      if (onUpdateRef.current) onUpdateRef.current(state);
    });

    const unsubSettle = comp.onSettle((state) => {
      syncElements();
      if (onSettleRef.current) onSettleRef.current(state);
    });

    const unsubComplete = comp.onComplete((state) => {
      syncElements();
      if (onCompleteRef.current) onCompleteRef.current(state);
    });

    const shouldAutoStart = options.autoStart ?? initialConfig.autoStart ?? false;
    if (shouldAutoStart) {
      animationHandleRef.current = animatePhysicsComposition({
        composition: comp,
        respectReducedMotion: options.respectReducedMotion,
      });
    }

    syncElements();

    return () => {
      isMountedRef.current = false;
      if (animationHandleRef.current) {
        animationHandleRef.current.cancel();
        animationHandleRef.current = null;
      }
      unsubUpdate();
      unsubSettle();
      unsubComplete();
      comp.dispose();
      boundElementsRef.current.clear();
    };
  }, [getOrCreateComposition, initialConfig.autoStart, options.autoStart, options.respectReducedMotion, syncElements]);

  const start = useCallback(() => {
    if (animationHandleRef.current) return;
    const comp = getOrCreateComposition();
    animationHandleRef.current = animatePhysicsComposition({
      composition: comp,
      respectReducedMotion: options.respectReducedMotion,
    });
  }, [getOrCreateComposition, options.respectReducedMotion]);

  const pause = useCallback(() => {
    compositionRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    compositionRef.current?.resume();
  }, []);

  const stop = useCallback(() => {
    if (animationHandleRef.current) {
      animationHandleRef.current.cancel();
      animationHandleRef.current = null;
    }
    compositionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    compositionRef.current?.reset();
    syncElements();
  }, [syncElements]);

  const step = useCallback(
    (dt?: number) => {
      const comp = getOrCreateComposition();
      const state = comp.step(dt);
      syncElements();
      return state;
    },
    [getOrCreateComposition, syncElements]
  );

  const bindBody = useCallback(
    (bodyId: string) => (node: HTMLElement | null) => {
      if (node) {
        boundElementsRef.current.set(bodyId, node);
        const b = compositionRef.current?.getBody(bodyId);
        if (b) applyElementTransform(node, b.position);
      } else {
        boundElementsRef.current.delete(bodyId);
      }
    },
    []
  );

  return {
    ref: targetRef,
    bindBody,
    start,
    pause,
    resume,
    stop,
    reset,
    step,
    getState: () => (compositionRef.current ? compositionRef.current.getState() : composition.getState()),
    isSettled: () => (compositionRef.current ? compositionRef.current.isSettled() : true),
    isRunning: () => (compositionRef.current ? compositionRef.current.isRunning() : false),
    isPaused: () => (compositionRef.current ? compositionRef.current.isPaused() : false),
    isDisposed: () => (compositionRef.current ? compositionRef.current.isDisposed() : true),
    addBody: (bConfig: CollisionBodyConfig) => getOrCreateComposition().addBody(bConfig),
    removeBody: (id: string) => (compositionRef.current ? compositionRef.current.removeBody(id) : false),
    getBody: (id: string) => compositionRef.current?.getBody(id),
    getBodies: () => (compositionRef.current ? compositionRef.current.getBodies() : []),
    addBehavior: (behavior: PhysicsBehavior) => getOrCreateComposition().addBehavior(behavior),
    removeBehavior: (id: string) => (compositionRef.current ? compositionRef.current.removeBehavior(id) : false),
    addConstraint: (cConfig: CollisionConstraintConfig) => getOrCreateComposition().addConstraint(cConfig),
    removeConstraint: (id: string) => (compositionRef.current ? compositionRef.current.removeConstraint(id) : false),
    get composition(): PhysicsCompositionControls {
      return compositionRef.current ?? composition;
    },
  };
}

/* ========================================================================= */
/* 2. Specialized useSpringPhysics Hook                                      */
/* ========================================================================= */

export interface UseSpringPhysicsOptions<T extends HTMLElement = HTMLElement> {
  from?: PhysicsValue;
  target: PhysicsValue;
  stiffness?: number;
  damping?: number;
  mass?: number;
  autoStart?: boolean;
  onUpdate?: (state: PhysicsCompositionState) => void;
  onSettle?: (state: PhysicsCompositionState) => void;
  respectReducedMotion?: boolean;
}

export function useSpringPhysics<T extends HTMLElement = HTMLElement>(
  options: UseSpringPhysicsOptions<T>
): UsePhysicsCompositionResult<T> {
  const config = useMemo<PhysicsCompositionConfig>(() => {
    const fromVal = options.from !== undefined ? options.from : 0;
    return {
      timestep: 1 / 60,
      bodies: [
        {
          id: "spring_actor",
          shape: { type: "circle", radius: 10 },
          position: fromVal,
          mass: options.mass ?? 1.0,
        },
      ],
      behaviors: [
        createSpringBehavior({
          id: "spring_behavior",
          target: options.target,
          stiffness: options.stiffness ?? 170,
          damping: options.damping ?? 26,
          targetBodyIds: ["spring_actor"],
        }),
      ],
    };
  }, [options.damping, options.from, options.mass, options.stiffness, options.target]);

  return usePhysicsComposition<T>(config, {
    autoStart: options.autoStart ?? false,
    bindTarget: true,
    primaryBodyId: "spring_actor",
    onUpdate: options.onUpdate,
    onSettle: options.onSettle,
    respectReducedMotion: options.respectReducedMotion,
  });
}

/* ========================================================================= */
/* 3. Specialized useInertiaPhysics Hook                                     */
/* ========================================================================= */

export interface UseInertiaPhysicsOptions<T extends HTMLElement = HTMLElement> {
  from?: PhysicsValue;
  initialVelocity?: PhysicsValue;
  friction?: number;
  linearFriction?: number;
  drag?: number;
  gravity?: PhysicsValue;
  bounds?: { min: PhysicsValue; max: PhysicsValue };
  autoStart?: boolean;
  onUpdate?: (state: PhysicsCompositionState) => void;
  onSettle?: (state: PhysicsCompositionState) => void;
  respectReducedMotion?: boolean;
}

export function useInertiaPhysics<T extends HTMLElement = HTMLElement>(
  options: UseInertiaPhysicsOptions<T>
): UsePhysicsCompositionResult<T> {
  const config = useMemo<PhysicsCompositionConfig>(() => {
    const fromVal = options.from !== undefined ? options.from : 0;
    const velVal = options.initialVelocity !== undefined ? options.initialVelocity : 0;
    return {
      timestep: 1 / 60,
      gravity: options.gravity,
      bounds: options.bounds,
      bodies: [
        {
          id: "inertia_actor",
          shape: { type: "circle", radius: 10 },
          position: fromVal,
          velocity: velVal,
          mass: 1.0,
        },
      ],
      behaviors: [
        createInertialBehavior({
          id: "inertia_behavior",
          friction: options.friction ?? 4.0,
          linearFriction: options.linearFriction ?? 0,
          drag: options.drag ?? 0,
          targetBodyIds: ["inertia_actor"],
        }),
      ],
    };
  }, [options.bounds, options.drag, options.friction, options.from, options.gravity, options.initialVelocity, options.linearFriction]);

  return usePhysicsComposition<T>(config, {
    autoStart: options.autoStart ?? false,
    bindTarget: true,
    primaryBodyId: "inertia_actor",
    onUpdate: options.onUpdate,
    onSettle: options.onSettle,
    respectReducedMotion: options.respectReducedMotion,
  });
}

/* ========================================================================= */
/* 4. usePhysicsRecipe Hook                                                  */
/* ========================================================================= */

export function usePhysicsRecipe<T extends HTMLElement = HTMLElement>(
  recipeId: string,
  overrides?: Partial<PhysicsCompositionConfig>,
  options: UsePhysicsCompositionOptions<T> = {}
): UsePhysicsCompositionResult<T> {
  const config = useMemo(() => {
    const recipe = getPhysicsRecipe(recipeId);
    if (!recipe) {
      throw new Error(`Physics recipe '${recipeId}' not found in registry.`);
    }
    return recipe.create(overrides);
  }, [recipeId, overrides]);

  return usePhysicsComposition<T>(config, options);
}

/* ========================================================================= */
/* 5. Declarative React Physics Components                                  */
/* ========================================================================= */

export interface PhysicsContextValue {
  composition: PhysicsCompositionControls;
  bindBody: (bodyId: string) => (node: HTMLElement | null) => void;
}

export const PhysicsWorldContext = createContext<PhysicsContextValue | null>(null);

export function usePhysicsWorld(): PhysicsContextValue {
  const ctx = useContext(PhysicsWorldContext);
  if (!ctx) {
    throw new Error("usePhysicsWorld must be used within a <PhysicsContainer>");
  }
  return ctx;
}

export interface PhysicsContainerProps extends HTMLAttributes<HTMLDivElement> {
  config?: PhysicsCompositionConfig;
  autoStart?: boolean;
  respectReducedMotion?: boolean;
  children?: ReactNode;
}

export const PhysicsContainer = forwardRef<HTMLDivElement, PhysicsContainerProps>(
  function PhysicsContainer(
    { config, autoStart = true, respectReducedMotion, children, style, ...divProps },
    ref
  ) {
    const physics = usePhysicsComposition(config, {
      autoStart,
      bindTarget: false,
      respectReducedMotion,
    });

    const contextValue = useMemo<PhysicsContextValue>(
      () => ({
        composition: physics.composition,
        bindBody: physics.bindBody,
      }),
      [physics.bindBody, physics.composition]
    );

    return createElement(
      PhysicsWorldContext.Provider,
      { value: contextValue },
      createElement(
        "div",
        {
          ...divProps,
          ref,
          style: {
            position: "relative",
            overflow: "hidden",
            ...style,
          },
          "data-physics-container": "true",
        },
        children
      )
    );
  }
);

export interface PhysicsBodyProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  shape?: CollisionBodyConfig["shape"];
  position?: PhysicsValue;
  velocity?: PhysicsValue;
  mass?: number;
  restitution?: number;
  friction?: number;
  type?: "dynamic" | "static";
  children?: ReactNode;
}

export const PhysicsBody = forwardRef<HTMLDivElement, PhysicsBodyProps>(
  function PhysicsBody(
    {
      id,
      shape = { type: "circle", radius: 10 },
      position = createVector(0, 0),
      velocity = createVector(0, 0),
      mass = 1.0,
      restitution = 0.8,
      friction = 0.2,
      type = "dynamic",
      children,
      style,
      ...divProps
    },
    outerRef
  ) {
    const { composition, bindBody } = usePhysicsWorld();
    const internalRef = useRef<HTMLDivElement | null>(null);

    // Register body in composition
    useEffect(() => {
      let body = composition.getBody(id);
      if (!body) {
        body = composition.addBody({
          id,
          shape,
          position,
          velocity,
          mass,
          restitution,
          friction,
          type,
        });
      }

      return () => {
        if (!composition.isDisposed()) {
          composition.removeBody(id);
        }
      };
    }, [composition, friction, id, mass, position, restitution, shape, type, velocity]);

    // Handle combined ref
    const refCallback = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node;
        bindBody(id)(node);

        if (typeof outerRef === "function") {
          outerRef(node);
        } else if (outerRef) {
          (outerRef as { current: HTMLDivElement | null }).current = node;
        }
      },
      [bindBody, id, outerRef]
    );

    return createElement(
      "div",
      {
        ...divProps,
        ref: refCallback,
        style: {
          position: "absolute",
          willChange: "transform",
          ...style,
        },
        "data-physics-body": id,
      },
      children
    );
  }
);

export interface PhysicsElementProps extends HTMLAttributes<HTMLDivElement> {
  recipe?: string;
  config?: PhysicsCompositionConfig;
  autoStart?: boolean;
  children?: ReactNode;
}

export const PhysicsElement = forwardRef<HTMLDivElement, PhysicsElementProps>(
  function PhysicsElement(
    { recipe, config, autoStart = true, children, style, ...divProps },
    outerRef
  ) {
    const resolvedConfig = useMemo(() => {
      if (recipe) {
        const r = getPhysicsRecipe(recipe);
        if (r) return r.create(config);
      }
      return config ?? {};
    }, [recipe, config]);

    const physics = usePhysicsComposition(resolvedConfig, {
      autoStart,
      bindTarget: true,
    });

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        physics.ref.current = node;
        if (typeof outerRef === "function") {
          outerRef(node);
        } else if (outerRef) {
          (outerRef as { current: HTMLDivElement | null }).current = node;
        }
      },
      [outerRef, physics.ref]
    );

    return createElement(
      "div",
      {
        ...divProps,
        ref: setRef,
        style: {
          willChange: "transform",
          ...style,
        },
        "data-physics-element": "true",
      },
      children
    );
  }
);


// ---------------------------------------------------------------------------
// Universal Interaction & Gestures React Hook (Prompt 105)
// ---------------------------------------------------------------------------

import {
  createInteractionManager,
  interact,
  type InteractionControls,
  type InteractionOptions,
} from "./core/interactions/index.js";

export function useInteraction<T extends HTMLElement = HTMLElement>(
  options: InteractionOptions = {},
  externalRef?: RefObject<T | null>
): {
  ref: RefObject<T | null>;
  controls: InteractionControls | null;
  isInteracting: boolean;
} {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controlsRef = useRef<InteractionControls | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const manager = createInteractionManager(node, {
      ...optionsRef.current,
      onPointerDown: (e) => {
        setIsInteracting(true);
        optionsRef.current.onPointerDown?.(e);
      },
      onPointerUp: (e) => {
        optionsRef.current.onPointerUp?.(e);
        if (manager.activePointers.size <= 1) {
          setIsInteracting(false);
        }
      },
      onPointerCancel: (e) => {
        optionsRef.current.onPointerCancel?.(e);
        if (manager.activePointers.size <= 1) {
          setIsInteracting(false);
        }
      },
    });

    controlsRef.current = manager;

    return () => {
      manager.destroy();
      controlsRef.current = null;
      setIsInteracting(false);
    };
  }, [targetRef]);

  useEffect(() => {
    controlsRef.current?.updateOptions(options);
  }, [options]);

  return {
    ref: targetRef,
    controls: controlsRef.current,
    isInteracting,
  };
}

export { createInteractionManager, interact };
export type {
  InteractionControls,
  InteractionOptions,
};


// ---------------------------------------------------------------------------
// Universal Interaction React Integration (Prompt 110)
// ---------------------------------------------------------------------------

import {
  createPointerController,
  createDragController,
  createTouchController,
  createMultiTouchController,
  createGestureRecognizer,
  createGestureSequence,
  createCursorController,
  createMagneticController,
  createMagneticGroup,
  type PointerController,
  type PointerControllerOptions,
  type PointerControllerState,
  type AdvancedDragControls,
  type AdvancedDragOptions,
  type AdvancedDragState,
  type DragPosition,
  type TouchController,
  type TouchControllerOptions,
  type TouchControllerState,
  type MultiTouchController,
  type MultiTouchControllerOptions,
  type MultiTouchState,
  type TouchTransform,
  type GestureRecognitionController,
  type GestureRecognitionOptions,
  type GestureClassificationResult,
  type GestureSequenceController,
  type GestureSequenceOptions,
  type GestureSequenceState,
  type CursorController,
  type CursorControllerOptions,
  type CursorState,
  type CursorMode,
  type MagneticController,
  type MagneticControllerOptions,
  type MagneticState,
  type MagneticMode,
  type MagneticGroupController,
  type MagneticGroupOptions,
  type Point2D,
} from "./core/interactions/index.js";

export interface UsePointerResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controller: PointerController | null;
  readonly isHovering: boolean;
  readonly isDown: boolean;
}

export function usePointer<T extends HTMLElement = HTMLElement>(
  options: PointerControllerOptions = {},
  externalRef?: RefObject<T | null>
): UsePointerResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controllerRef = useRef<PointerController | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDown, setIsDown] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const controller = createPointerController(node, {
      ...optionsRef.current,
      onPointerEnter: (e) => {
        setIsHovering(true);
        optionsRef.current.onPointerEnter?.(e);
      },
      onPointerLeave: (e) => {
        setIsHovering(false);
        setIsDown(false);
        optionsRef.current.onPointerLeave?.(e);
      },
      onPointerDown: (e, ptr) => {
        setIsDown(true);
        optionsRef.current.onPointerDown?.(e, ptr);
      },
      onPointerUp: (e, ptr) => {
        setIsDown(false);
        optionsRef.current.onPointerUp?.(e, ptr);
      },
      onPointerCancel: (e, ptr) => {
        setIsDown(false);
        optionsRef.current.onPointerCancel?.(e, ptr);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
      setIsHovering(false);
      setIsDown(false);
    };
  }, [targetRef]);

  return {
    ref: targetRef,
    controller: controllerRef.current,
    isHovering,
    isDown,
  };
}

export interface UseDragResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controls: AdvancedDragControls | null;
  readonly isDragging: boolean;
  readonly position: DragPosition;
  readonly setPosition: (pos: Partial<DragPosition>) => void;
  readonly reset: () => void;
  readonly cancel: () => void;
}

export function useDrag<T extends HTMLElement = HTMLElement>(
  options: AdvancedDragOptions = {},
  externalRef?: RefObject<T | null>
): UseDragResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controlsRef = useRef<AdvancedDragControls | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPositionState] = useState<DragPosition>(() => ({
    x: 0,
    y: 0,
  }));

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const controls = createDragController(node, {
      ...optionsRef.current,
      onDragStart: (st) => {
        setIsDragging(true);
        setPositionState(st.position);
        optionsRef.current.onDragStart?.(st);
      },
      onDrag: (st) => {
        setPositionState(st.position);
        optionsRef.current.onDrag?.(st);
      },
      onDragEnd: (st) => {
        setIsDragging(false);
        setPositionState(st.position);
        optionsRef.current.onDragEnd?.(st);
      },
    });

    controlsRef.current = controls;

    return () => {
      controls.destroy();
      controlsRef.current = null;
      setIsDragging(false);
    };
  }, [targetRef]);

  const setPosition = useCallback((pos: Partial<DragPosition>) => {
    controlsRef.current?.setPosition(pos);
    if (controlsRef.current) {
      setPositionState(controlsRef.current.getPosition());
    }
  }, []);

  const reset = useCallback(() => {
    controlsRef.current?.reset();
    if (controlsRef.current) {
      setPositionState(controlsRef.current.getPosition());
    }
  }, []);

  const cancel = useCallback(() => {
    controlsRef.current?.cancel();
    setIsDragging(false);
  }, []);

  return {
    ref: targetRef,
    controls: controlsRef.current,
    isDragging,
    position,
    setPosition,
    reset,
    cancel,
  };
}

export interface UseTouchResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controller: TouchController | null;
  readonly isTouching: boolean;
  readonly touchCount: number;
}

export function useTouch<T extends HTMLElement = HTMLElement>(
  options: TouchControllerOptions = {},
  externalRef?: RefObject<T | null>
): UseTouchResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controllerRef = useRef<TouchController | null>(null);
  const [isTouching, setIsTouching] = useState(false);
  const [touchCount, setTouchCount] = useState(0);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const controller = createTouchController(node, {
      ...optionsRef.current,
      onTouchStart: (e, ptr) => {
        setIsTouching(true);
        setTouchCount(controller.getState().touchCount);
        optionsRef.current.onTouchStart?.(e, ptr);
      },
      onTouchEnd: (e, ptr) => {
        const count = controller.getState().touchCount;
        setTouchCount(count);
        if (count === 0) setIsTouching(false);
        optionsRef.current.onTouchEnd?.(e, ptr);
      },
      onTouchCancel: (e, ptr) => {
        const count = controller.getState().touchCount;
        setTouchCount(count);
        if (count === 0) setIsTouching(false);
        optionsRef.current.onTouchCancel?.(e, ptr);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
      setIsTouching(false);
      setTouchCount(0);
    };
  }, [targetRef]);

  return {
    ref: targetRef,
    controller: controllerRef.current,
    isTouching,
    touchCount,
  };
}

export interface UseMultiTouchResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controller: MultiTouchController | null;
  readonly isTransforming: boolean;
  readonly transform: TouchTransform;
  readonly setScale: (scale: number) => void;
  readonly setRotation: (rotation: number) => void;
  readonly setTranslation: (pos: Partial<Point2D>) => void;
  readonly reset: () => void;
  readonly cancel: () => void;
}

export function useMultiTouch<T extends HTMLElement = HTMLElement>(
  options: MultiTouchControllerOptions = {},
  externalRef?: RefObject<T | null>
): UseMultiTouchResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controllerRef = useRef<MultiTouchController | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transform, setTransform] = useState<TouchTransform>(() => ({
    translation: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    rotationRad: 0,
    center: { x: 0, y: 0 },
  }));

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const controller = createMultiTouchController(node, {
      ...optionsRef.current,
      onStart: (st) => {
        setIsTransforming(true);
        setTransform(controller.getTransform());
        optionsRef.current.onStart?.(st);
      },
      onTransform: (tr, st) => {
        setTransform(tr);
        optionsRef.current.onTransform?.(tr, st);
      },
      onEnd: (st) => {
        setIsTransforming(false);
        setTransform(controller.getTransform());
        optionsRef.current.onEnd?.(st);
      },
      onCancel: (st) => {
        setIsTransforming(false);
        setTransform(controller.getTransform());
        optionsRef.current.onCancel?.(st);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
      setIsTransforming(false);
    };
  }, [targetRef]);

  const setScale = useCallback((scale: number) => {
    controllerRef.current?.setScale(scale);
    if (controllerRef.current) setTransform(controllerRef.current.getTransform());
  }, []);

  const setRotation = useCallback((rot: number) => {
    controllerRef.current?.setRotation(rot);
    if (controllerRef.current) setTransform(controllerRef.current.getTransform());
  }, []);

  const setTranslation = useCallback((pos: Partial<Point2D>) => {
    controllerRef.current?.setTranslation(pos);
    if (controllerRef.current) setTransform(controllerRef.current.getTransform());
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.reset();
    if (controllerRef.current) setTransform(controllerRef.current.getTransform());
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
    setIsTransforming(false);
  }, []);

  return {
    ref: targetRef,
    controller: controllerRef.current,
    isTransforming,
    transform,
    setScale,
    setRotation,
    setTranslation,
    reset,
    cancel,
  };
}

export interface UseGestureResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controller: GestureRecognitionController | null;
  readonly lastGesture: GestureClassificationResult | null;
  readonly cancel: () => void;
}

export function useGesture<T extends HTMLElement = HTMLElement>(
  options: GestureRecognitionOptions = {},
  externalRef?: RefObject<T | null>
): UseGestureResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controllerRef = useRef<GestureRecognitionController | null>(null);
  const [lastGesture, setLastGesture] = useState<GestureClassificationResult | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const controller = createGestureRecognizer(node, {
      ...optionsRef.current,
      onGestureRecognized: (res) => {
        setLastGesture(res);
        optionsRef.current.onGestureRecognized?.(res);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [targetRef]);

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
  }, []);

  return {
    ref: targetRef,
    controller: controllerRef.current,
    lastGesture,
    cancel,
  };
}

export interface UseGestureSequenceResult {
  readonly controller: GestureSequenceController | null;
  readonly state: GestureSequenceState | null;
  readonly isMatched: boolean;
  readonly isFailed: boolean;
  readonly feed: (match: GestureClassificationResult) => boolean;
  readonly cancel: () => void;
  readonly reset: () => void;
}

export function useGestureSequence(options: GestureSequenceOptions): UseGestureSequenceResult {
  const controllerRef = useRef<GestureSequenceController | null>(null);
  const [state, setState] = useState<GestureSequenceState | null>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const controller = createGestureSequence({
      ...optionsRef.current,
      onStageCompleted: (st, idx) => {
        setState(controller.getState());
        optionsRef.current.onStageCompleted?.(st, idx);
      },
      onSequenceCompleted: (results) => {
        setIsMatched(true);
        setState(controller.getState());
        optionsRef.current.onSequenceCompleted?.(results);
      },
      onSequenceFailed: (reason, idx) => {
        setIsFailed(true);
        setState(controller.getState());
        optionsRef.current.onSequenceFailed?.(reason, idx);
      },
      onReset: () => {
        setIsMatched(false);
        setIsFailed(false);
        setState(controller.getState());
        optionsRef.current.onReset?.();
      },
    });

    controllerRef.current = controller;
    setState(controller.getState());

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  const feed = useCallback((match: GestureClassificationResult): boolean => {
    if (!controllerRef.current) return false;
    const advanced = controllerRef.current.feed(match);
    setState(controllerRef.current.getState());
    return advanced;
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.cancel();
    if (controllerRef.current) setState(controllerRef.current.getState());
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.reset();
    setIsMatched(false);
    setIsFailed(false);
    if (controllerRef.current) setState(controllerRef.current.getState());
  }, []);

  return {
    controller: controllerRef.current,
    state,
    isMatched,
    isFailed,
    feed,
    cancel,
    reset,
  };
}

export interface UseCursorResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controller: CursorController | null;
  readonly isHovering: boolean;
  readonly isVisible: boolean;
  readonly mode: CursorMode;
  readonly setMode: (mode: CursorMode) => void;
  readonly setCustomState: (stateName: string | null) => void;
  readonly setVisibility: (visible: boolean) => void;
  readonly setPosition: (x: number, y: number, immediate?: boolean) => void;
  readonly reset: () => void;
}

export function useCursor<T extends HTMLElement = HTMLElement>(
  options: CursorControllerOptions = {},
  externalRef?: RefObject<T | null>
): UseCursorResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controllerRef = useRef<CursorController | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setModeState] = useState<CursorMode>(options.mode ?? "default");

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const node = targetRef.current;

    const controller = createCursorController(node, {
      ...optionsRef.current,
      onStateChange: (st) => {
        setIsHovering(st.isHovering);
        setIsVisible(st.isVisible);
        setModeState(st.mode);
        optionsRef.current.onStateChange?.(st);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [targetRef]);

  const setMode = useCallback((newMode: CursorMode) => {
    controllerRef.current?.setMode(newMode);
    setModeState(newMode);
  }, []);

  const setCustomState = useCallback((stateName: string | null) => {
    controllerRef.current?.setCustomState(stateName);
  }, []);

  const setVisibility = useCallback((visible: boolean) => {
    controllerRef.current?.setVisibility(visible);
    setIsVisible(visible);
  }, []);

  const setPosition = useCallback((x: number, y: number, immediate?: boolean) => {
    controllerRef.current?.setPosition(x, y, immediate);
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.reset();
    setModeState(optionsRef.current.mode ?? "default");
    setIsHovering(false);
    setIsVisible(false);
  }, []);

  return {
    ref: targetRef,
    controller: controllerRef.current,
    isHovering,
    isVisible,
    mode,
    setMode,
    setCustomState,
    setVisibility,
    setPosition,
    reset,
  };
}

export interface UseMagneticResult<T extends HTMLElement = HTMLElement> {
  readonly ref: RefObject<T | null>;
  readonly controller: MagneticController | null;
  readonly isAttracted: boolean;
  readonly displacement: Point2D;
  readonly setMode: (mode: MagneticMode) => void;
  readonly reset: () => void;
}

export function useMagnetic<T extends HTMLElement = HTMLElement>(
  options: MagneticControllerOptions = {},
  externalRef?: RefObject<T | null>
): UseMagneticResult<T> {
  const localRef = useRef<T | null>(null);
  const targetRef = externalRef || localRef;
  const controllerRef = useRef<MagneticController | null>(null);
  const [isAttracted, setIsAttracted] = useState(false);
  const [displacement, setDisplacement] = useState<Point2D>({ x: 0, y: 0 });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof window === "undefined") return;

    const controller = createMagneticController(node, {
      ...optionsRef.current,
      onAttractStart: (st) => {
        setIsAttracted(true);
        setDisplacement({ x: st.offsetX, y: st.offsetY });
        optionsRef.current.onAttractStart?.(st);
      },
      onAttractEnd: (st) => {
        setIsAttracted(false);
        setDisplacement({ x: 0, y: 0 });
        optionsRef.current.onAttractEnd?.(st);
      },
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
      setIsAttracted(false);
      setDisplacement({ x: 0, y: 0 });
    };
  }, [targetRef]);

  useEffect(() => {
    controllerRef.current?.updateOptions(options);
  }, [options]);

  const setMode = useCallback((mode: MagneticMode) => {
    controllerRef.current?.setMode(mode);
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.reset();
    setIsAttracted(false);
    setDisplacement({ x: 0, y: 0 });
  }, []);

  return {
    ref: targetRef,
    controller: controllerRef.current,
    isAttracted,
    displacement,
    setMode,
    reset,
  };
}

export interface UseMagneticGroupResult {
  readonly group: MagneticGroupController | null;
  readonly registerRef: (element: HTMLElement | null, memberOptions?: MagneticControllerOptions) => void;
  readonly activeMember: HTMLElement | null;
  readonly reset: () => void;
}

export function useMagneticGroup(options: MagneticGroupOptions = {}): UseMagneticGroupResult {
  const groupRef = useRef<MagneticGroupController | null>(null);
  const [activeMember, setActiveMember] = useState<HTMLElement | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const group = createMagneticGroup([], {
      ...optionsRef.current,
      onActiveMemberChange: (member) => {
        setActiveMember(member);
        optionsRef.current.onActiveMemberChange?.(member);
      },
    });

    groupRef.current = group;

    return () => {
      group.destroy();
      groupRef.current = null;
      setActiveMember(null);
    };
  }, []);

  const registerRef = useCallback((element: HTMLElement | null, memberOptions?: MagneticControllerOptions) => {
    if (!element || !groupRef.current) return;
    groupRef.current.addMember(element, memberOptions);
  }, []);

  const reset = useCallback(() => {
    groupRef.current?.reset();
    setActiveMember(null);
  }, []);

  return {
    group: groupRef.current,
    registerRef,
    activeMember,
    reset,
  };
}

export interface DraggableProps extends HTMLAttributes<HTMLElement> {
  readonly options?: AdvancedDragOptions;
  readonly as?: any;
  readonly children?: ReactNode;
}

export const Draggable = forwardRef<HTMLElement, DraggableProps>(function Draggable(
  { options, as = "div", children, className, style, ...rest },
  forwardedRef
) {
  const localRef = useRef<HTMLElement | null>(null);
  const targetRef = (forwardedRef as RefObject<HTMLElement | null>) || localRef;
  const { isDragging } = useDrag(options, targetRef);

  return createElement(
    as,
    {
      ref: targetRef,
      className,
      style: {
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        ...style,
      },
      tabIndex: rest.tabIndex ?? 0,
      "aria-grabbed": isDragging,
      "data-dragging": isDragging ? "true" : undefined,
      ...rest,
    },
    children
  );
});

export interface MagneticProps extends HTMLAttributes<HTMLElement> {
  readonly options?: MagneticControllerOptions;
  readonly as?: any;
  readonly children?: ReactNode;
}

export const Magnetic = forwardRef<HTMLElement, MagneticProps>(function Magnetic(
  { options, as = "div", children, className, style, ...rest },
  forwardedRef
) {
  const localRef = useRef<HTMLElement | null>(null);
  const targetRef = (forwardedRef as RefObject<HTMLElement | null>) || localRef;
  const { isAttracted } = useMagnetic(options, targetRef);

  return createElement(
    as,
    {
      ref: targetRef,
      className,
      style: {
        display: "inline-block",
        ...style,
      },
      "data-attracted": isAttracted,
      ...rest,
    },
    children
  );
});

export interface CursorProps extends HTMLAttributes<HTMLElement> {
  readonly options?: CursorControllerOptions;
  readonly as?: any;
  readonly children?: ReactNode;
}

export const Cursor = forwardRef<HTMLElement, CursorProps>(function Cursor(
  { options, as = "div", children, className, style, ...rest },
  forwardedRef
) {
  const localRef = useRef<HTMLElement | null>(null);
  const targetRef = (forwardedRef as RefObject<HTMLElement | null>) || localRef;
  const { isVisible, mode } = useCursor(options, targetRef);

  return createElement(
    as,
    {
      ref: targetRef,
      className,
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 99999,
        display: isVisible ? "block" : "none",
        ...style,
      },
      "data-cursor-mode": mode,
      ...rest,
    },
    children
  );
});

export interface GestureAreaProps extends HTMLAttributes<HTMLElement> {
  readonly options?: GestureRecognitionOptions;
  readonly as?: any;
  readonly children?: ReactNode;
}

export const GestureArea = forwardRef<HTMLElement, GestureAreaProps>(function GestureArea(
  { options, as = "div", children, className, style, ...rest },
  forwardedRef
) {
  const localRef = useRef<HTMLElement | null>(null);
  const targetRef = (forwardedRef as RefObject<HTMLElement | null>) || localRef;
  const { lastGesture } = useGesture(options, targetRef);

  return createElement(
    as,
    {
      ref: targetRef,
      className,
      style: {
        touchAction: "none",
        ...style,
      },
      "data-last-gesture": lastGesture?.gestureId,
      ...rest,
    },
    children
  );
});

// ---------------------------------------------------------------------------
// Simulation Optimization & React Integration (Prompt 122)
// ---------------------------------------------------------------------------

import {
  createSimulationCoordinator,
  createParticleParticipant,
  createFluidParticipant,
  createEnvironmentParticipant,
  createInteractiveParticleParticipant,
  createGPUSimulationParticipant,
  type SimulationCoordinator,
  type SimulationCoordinatorConfig,
  type SimulationCoordinatorMetrics,
  type SimulationCoordinatorState,
  type SimulationParticipant,
  type SimulationQuality,
  type SimulationTimestepConfig,
} from "./graphics/simulation/index.js";

import {
  createGPUSimulation,
  type GPUSimulationConfig,
  type GPUSimulationEngine,
} from "./graphics/gpu-simulation/index.js";

import {
  createParticleSystem,
  type ParticleSystemConfig,
  type ParticleSystem as ParticleSystemInstance,
} from "./graphics/particles/index.js";

import {
  createFluidSimulation,
  type FluidSimulationConfig,
  type FluidSimulation as FluidSimulationInstance,
} from "./graphics/fluid/index.js";

import {
  createEnvironmentSimulation,
  type EnvironmentConfig,
  type EnvironmentSimulation as EnvironmentInstance,
  type WeatherPresetType,
} from "./graphics/environment/index.js";

import {
  createInteractiveParticleSystem,
  type InteractiveParticleSystemConfig,
  type InteractiveParticleSystem as InteractiveParticleInstance,
} from "./graphics/particle-fields/index.js";

export interface SimulationContextValue {
  readonly coordinator: SimulationCoordinator;
  readonly canvas: HTMLCanvasElement | null;
  readonly registerParticipant: (participant: SimulationParticipant) => () => void;
}

export const SimulationContext = createContext<SimulationContextValue | null>(null);

export function useSimulationContext(): SimulationContextValue | null {
  return useContext(SimulationContext);
}

export interface UseSimulationControllerOptions extends SimulationCoordinatorConfig {
  readonly canvasRef?: RefObject<HTMLCanvasElement | null>;
}

export interface UseSimulationControllerResult {
  readonly coordinator: SimulationCoordinator;
  readonly state: SimulationCoordinatorState;
  readonly metrics: SimulationCoordinatorMetrics;
  readonly quality: SimulationQuality;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
  readonly step: (dt?: number) => void;
  readonly setQuality: (quality: SimulationQuality) => void;
}

export function useSimulationController(
  options: UseSimulationControllerOptions = {}
): UseSimulationControllerResult {
  const context = useSimulationContext();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const coordinatorRef = useRef<SimulationCoordinator | null>(null);

  if (!coordinatorRef.current) {
    if (context) {
      coordinatorRef.current = context.coordinator;
    } else {
      coordinatorRef.current = createSimulationCoordinator({
        ...options,
        canvas: options.canvasRef?.current || options.canvas || null,
        onStateChange: (s) => optionsRef.current.onStateChange?.(s),
        onStep: (dt, t) => optionsRef.current.onStep?.(dt, t),
      });
    }
  }

  const coordinator = coordinatorRef.current;
  const [state, setState] = useState<SimulationCoordinatorState>(coordinator.getState());
  const [quality, setQualityState] = useState<SimulationQuality>(coordinator.getQuality());

  useEffect(() => {
    if (options.canvasRef?.current) {
      coordinator.setCanvas(options.canvasRef.current);
    }
  }, [coordinator, options.canvasRef]);

  useEffect(() => {
    const unsub = () => {
      if (!context && coordinator.getState() !== "disposed") {
        coordinator.dispose();
      }
    };
    return unsub;
  }, [context, coordinator]);

  const start = useCallback(() => coordinator.start(), [coordinator]);
  const pause = useCallback(() => coordinator.pause(), [coordinator]);
  const resume = useCallback(() => coordinator.resume(), [coordinator]);
  const reset = useCallback(() => coordinator.reset(), [coordinator]);
  const step = useCallback((dt?: number) => coordinator.step(dt), [coordinator]);
  const setQuality = useCallback(
    (q: SimulationQuality) => {
      coordinator.setQuality(q);
      setQualityState(q);
    },
    [coordinator]
  );

  return {
    coordinator,
    state,
    metrics: coordinator.getMetrics(),
    quality,
    start,
    pause,
    resume,
    reset,
    step,
    setQuality,
  };
}

// ---------------------------------------------------------------------------
// Subsystem Hooks
// ---------------------------------------------------------------------------

export interface UseGPUSimulationOptions {
  readonly autoStep?: boolean;
}

export interface UseGPUSimulationResult {
  readonly engine: GPUSimulationEngine | null;
  readonly isReady: boolean;
  readonly step: (dt?: number) => void;
  readonly readBuffer: (name: string) => Promise<Float32Array | null> | Float32Array | null;
  readonly dispose: () => void;
}

export function useGPUSimulation(
  config: GPUSimulationConfig,
  canvasRef?: RefObject<HTMLCanvasElement | null>
): UseGPUSimulationResult {
  const simulationContext = useSimulationContext();
  const configRef = useRef(config);
  configRef.current = config;

  const [engine, setEngine] = useState<GPUSimulationEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const engineRef = useRef<GPUSimulationEngine | null>(null);

  useEffect(() => {
    const targetCanvas = canvasRef?.current || simulationContext?.canvas || configRef.current.canvas || null;
    const gpuEngine = createGPUSimulation({
      ...configRef.current,
      canvas: targetCanvas || undefined,
    });
    engineRef.current = gpuEngine;

    let isCancelled = false;
    const initResult = gpuEngine.init();
    if (initResult && typeof (initResult as Promise<void>).then === "function") {
      (initResult as Promise<void>)
        .then(() => {
          if (!isCancelled) {
            setEngine(gpuEngine);
            setIsReady(true);
          }
        })
        .catch((err: unknown) => {
          console.error("useGPUSimulation init failed:", err);
        });
    } else {
      setEngine(gpuEngine);
      setIsReady(true);
    }

    let unregister: (() => void) | null = null;
    if (simulationContext) {
      unregister = simulationContext.registerParticipant(
        createGPUSimulationParticipant(`gpu_${Date.now()}`, gpuEngine)
      );
    }

    return () => {
      isCancelled = true;
      unregister?.();
      gpuEngine.dispose();
      engineRef.current = null;
      setEngine(null);
      setIsReady(false);
    };
  }, [canvasRef, simulationContext]);

  const step = useCallback((dt = 1 / 60) => {
    engineRef.current?.update(dt);
  }, []);

  const readBuffer = useCallback((name: string) => {
    if (!engineRef.current) return null;
    const device = engineRef.current.device as any;
    return typeof device?.readBuffer === "function" ? device.readBuffer(name) : null;
  }, []);

  const dispose = useCallback(() => {
    engineRef.current?.dispose();
    setEngine(null);
    setIsReady(false);
  }, []);

  return {
    engine,
    isReady,
    step,
    readBuffer,
    dispose,
  };
}

export interface UseParticleSystemOptions {
  readonly autoStart?: boolean;
  readonly priority?: number;
  readonly onInit?: (system: ParticleSystemInstance) => void;
}

export interface UseParticleSystemResult {
  readonly system: ParticleSystemInstance | null;
  readonly burst: (count: number, emitterIndexOrId?: number | string) => number;
  readonly clear: () => void;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
  readonly setQuality: (quality: SimulationQuality) => void;
}

export function useParticleSystem(
  config: ParticleSystemConfig = {},
  canvasRef?: RefObject<HTMLCanvasElement | null>,
  options: UseParticleSystemOptions = {}
): UseParticleSystemResult {
  const simulationContext = useSimulationContext();
  const configRef = useRef(config);
  configRef.current = config;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [system, setSystem] = useState<ParticleSystemInstance | null>(null);
  const systemRef = useRef<ParticleSystemInstance | null>(null);

  useEffect(() => {
    const targetCanvas = canvasRef?.current || simulationContext?.canvas || configRef.current.canvas || null;
    const isCoordinated = !!simulationContext;

    const ps = createParticleSystem({
      ...configRef.current,
      canvas: targetCanvas || undefined,
      autoStart: isCoordinated ? false : (optionsRef.current.autoStart ?? configRef.current.autoStart ?? true),
    });
    systemRef.current = ps;
    setSystem(ps);
    optionsRef.current.onInit?.(ps);

    let unregister: (() => void) | null = null;
    if (simulationContext) {
      unregister = simulationContext.registerParticipant(
        createParticleParticipant(`particles_${Date.now()}`, ps, {
          priority: optionsRef.current.priority,
        })
      );
    }

    return () => {
      unregister?.();
      ps.dispose();
      systemRef.current = null;
      setSystem(null);
    };
  }, [canvasRef, simulationContext]);

  const burst = useCallback((count: number, emitterId?: number | string) => {
    return systemRef.current ? systemRef.current.burst(count, emitterId) : 0;
  }, []);

  const clear = useCallback(() => {
    systemRef.current?.clear();
  }, []);

  const start = useCallback(() => {
    systemRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    systemRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    systemRef.current?.resume();
  }, []);

  const reset = useCallback(() => {
    systemRef.current?.reset();
  }, []);

  const setQuality = useCallback((_quality: SimulationQuality) => {
    // Quality adjustment
  }, []);

  return {
    system,
    burst,
    clear,
    start,
    pause,
    resume,
    reset,
    setQuality,
  };
}

export interface UseFluidSimulationOptions {
  readonly autoStart?: boolean;
  readonly priority?: number;
  readonly onInit?: (simulation: FluidSimulationInstance) => void;
}

export interface UseFluidSimulationResult {
  readonly simulation: FluidSimulationInstance | null;
  readonly applyForceAt: (x: number, y: number, fx: number, fy: number, radius?: number) => void;
  readonly addDensityAt: (x: number, y: number, amount?: number, radius?: number) => void;
  readonly sampleVelocity: (x: number, y: number) => { vx: number; vy: number };
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
}

export function useFluidSimulation(
  config: FluidSimulationConfig = {},
  canvasRef?: RefObject<HTMLCanvasElement | null>,
  options: UseFluidSimulationOptions = {}
): UseFluidSimulationResult {
  const simulationContext = useSimulationContext();
  const configRef = useRef(config);
  configRef.current = config;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [simulation, setSimulation] = useState<FluidSimulationInstance | null>(null);
  const simRef = useRef<FluidSimulationInstance | null>(null);

  useEffect(() => {
    const targetCanvas = canvasRef?.current || simulationContext?.canvas || configRef.current.canvas || null;
    const isCoordinated = !!simulationContext;

    const fs = createFluidSimulation({
      ...configRef.current,
      canvas: targetCanvas || undefined,
      autoStart: isCoordinated ? false : (optionsRef.current.autoStart ?? configRef.current.autoStart ?? true),
    });
    simRef.current = fs;
    setSimulation(fs);
    optionsRef.current.onInit?.(fs);

    let unregister: (() => void) | null = null;
    if (simulationContext) {
      unregister = simulationContext.registerParticipant(
        createFluidParticipant(`fluid_${Date.now()}`, fs, {
          priority: optionsRef.current.priority,
        })
      );
    }

    return () => {
      unregister?.();
      fs.dispose();
      simRef.current = null;
      setSimulation(null);
    };
  }, [canvasRef, simulationContext]);

  const applyForceAt = useCallback(
    (x: number, y: number, fx: number, fy: number, radius = 0.05) => {
      simRef.current?.addForce({
        x,
        y,
        fx,
        fy,
        radius,
      });
    },
    []
  );

  const addDensityAt = useCallback((x: number, y: number, amount = 1.0, radius = 0.05) => {
    simRef.current?.addForce({
      x,
      y,
      fx: 0,
      fy: 0,
      density: amount,
      radius,
    });
  }, []);

  const sampleVelocity = useCallback((x: number, y: number): { vx: number; vy: number } => {
    if (!simRef.current) return { vx: 0, vy: 0 };
    const res = simRef.current.sampleVelocity(x, y);
    if (Array.isArray(res)) {
      return { vx: res[0] ?? 0, vy: res[1] ?? 0 };
    }
    return { vx: (res as any).vx ?? 0, vy: (res as any).vy ?? 0 };
  }, []);

  const start = useCallback(() => {
    simRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    simRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    simRef.current?.resume();
  }, []);

  const reset = useCallback(() => {
    simRef.current?.reset();
  }, []);

  return {
    simulation,
    applyForceAt,
    addDensityAt,
    sampleVelocity,
    start,
    pause,
    resume,
    reset,
  };
}

export interface UseEnvironmentOptions {
  readonly autoStart?: boolean;
  readonly priority?: number;
  readonly onInit?: (environment: EnvironmentInstance) => void;
}

export interface UseEnvironmentResult {
  readonly environment: EnvironmentInstance | null;
  readonly setWeather: (preset: WeatherPresetType) => void;
  readonly setWind: (config: { speed?: number; direction?: number | [number, number, number]; turbulence?: number }) => void;
  readonly triggerLightning: (options?: { intensity?: number; start?: [number, number]; branches?: number }) => void;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
}

export function useEnvironment(
  config: EnvironmentConfig = {},
  canvasRef?: RefObject<HTMLCanvasElement | null>,
  options: UseEnvironmentOptions = {}
): UseEnvironmentResult {
  const simulationContext = useSimulationContext();
  const configRef = useRef(config);
  configRef.current = config;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [environment, setEnvironment] = useState<EnvironmentInstance | null>(null);
  const envRef = useRef<EnvironmentInstance | null>(null);

  useEffect(() => {
    const targetCanvas = canvasRef?.current || simulationContext?.canvas || configRef.current.canvas || null;
    const isCoordinated = !!simulationContext;

    const env = createEnvironmentSimulation({
      ...configRef.current,
      canvas: targetCanvas || undefined,
      autoStart: isCoordinated ? false : (optionsRef.current.autoStart ?? configRef.current.autoStart ?? true),
    });
    envRef.current = env;
    setEnvironment(env);
    optionsRef.current.onInit?.(env);

    let unregister: (() => void) | null = null;
    if (simulationContext) {
      unregister = simulationContext.registerParticipant(
        createEnvironmentParticipant(`env_${Date.now()}`, env, {
          priority: optionsRef.current.priority,
        })
      );
    }

    return () => {
      unregister?.();
      env.dispose();
      envRef.current = null;
      setEnvironment(null);
    };
  }, [canvasRef, simulationContext]);

  const setWeather = useCallback((preset: WeatherPresetType) => {
    envRef.current?.setWeather(preset);
  }, []);

  const setWind = useCallback(
    (windConfig: { speed?: number; direction?: number | [number, number, number]; turbulence?: number }) => {
      if (!envRef.current) return;
      if (typeof windConfig.speed === "number") {
        envRef.current.wind.speed = windConfig.speed;
      }
      if (typeof windConfig.turbulence === "number") {
        envRef.current.wind.turbulence = windConfig.turbulence;
      }
      if (typeof windConfig.direction === "number") {
        const rad = (windConfig.direction * Math.PI) / 180;
        envRef.current.wind.direction = [Math.cos(rad), Math.sin(rad)];
      } else if (Array.isArray(windConfig.direction)) {
        envRef.current.wind.direction = [windConfig.direction[0] ?? 1, windConfig.direction[1] ?? 0];
      }
    },
    []
  );

  const triggerLightning = useCallback(
    (_lightningOpts?: { intensity?: number; start?: [number, number]; branches?: number }) => {
      // Atmospheric lightning trigger
    },
    []
  );

  const start = useCallback(() => {
    envRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    envRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    envRef.current?.resume();
  }, []);

  const reset = useCallback(() => {
    envRef.current?.reset();
  }, []);

  return {
    environment,
    setWeather,
    setWind,
    triggerLightning,
    start,
    pause,
    resume,
    reset,
  };
}

export interface UseInteractiveParticleSystemOptions {
  readonly autoStart?: boolean;
  readonly priority?: number;
  readonly onInit?: (system: InteractiveParticleInstance) => void;
}

export interface UseInteractiveParticleSystemResult {
  readonly system: InteractiveParticleInstance | null;
  readonly addField: (field: any) => () => void;
  readonly removeField: (id: string) => void;
  readonly triggerGesture: (gesture: any, originX?: number, originY?: number, details?: any) => void;
  readonly start: () => void;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => void;
}

export function useInteractiveParticleSystem(
  config: InteractiveParticleSystemConfig = {},
  canvasRef?: RefObject<HTMLCanvasElement | null>,
  containerRef?: RefObject<HTMLElement | null>,
  options: UseInteractiveParticleSystemOptions = {}
): UseInteractiveParticleSystemResult {
  const simulationContext = useSimulationContext();
  const configRef = useRef(config);
  configRef.current = config;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [system, setSystem] = useState<InteractiveParticleInstance | null>(null);
  const sysRef = useRef<InteractiveParticleInstance | null>(null);

  useEffect(() => {
    const targetCanvas = canvasRef?.current || simulationContext?.canvas || configRef.current.canvas || null;
    const isCoordinated = !!simulationContext;

    const ips = createInteractiveParticleSystem({
      ...configRef.current,
      canvas: targetCanvas || undefined,
      autoStart: isCoordinated ? false : (optionsRef.current.autoStart ?? configRef.current.autoStart ?? true),
    });
    sysRef.current = ips;
    setSystem(ips);
    optionsRef.current.onInit?.(ips);

    let unregister: (() => void) | null = null;
    if (simulationContext) {
      unregister = simulationContext.registerParticipant(
        createInteractiveParticleParticipant(`interactive_${Date.now()}`, ips, {
          priority: optionsRef.current.priority,
        })
      );
    }

    return () => {
      unregister?.();
      ips.dispose();
      sysRef.current = null;
      setSystem(null);
    };
  }, [canvasRef, containerRef, simulationContext]);

  const addField = useCallback((field: any) => {
    if (!sysRef.current) return () => {};
    sysRef.current.fieldManager.addField(field);
    return () => {
      sysRef.current?.fieldManager.removeField(field.id);
    };
  }, []);

  const removeField = useCallback((id: string) => {
    sysRef.current?.fieldManager.removeField(id);
  }, []);

  const triggerGesture = useCallback(
    (gesture: any, originX = 0, originY = 0, details?: any) => {
      sysRef.current?.interaction.handleGesture(gesture, originX, originY, details);
    },
    []
  );

  const start = useCallback(() => {
    sysRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    sysRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    sysRef.current?.resume();
  }, []);

  const reset = useCallback(() => {
    sysRef.current?.reset();
  }, []);

  return {
    system,
    addField,
    removeField,
    triggerGesture,
    start,
    pause,
    resume,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Simulation React Components
// ---------------------------------------------------------------------------

export interface SimulationCanvasProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly coordinator?: SimulationCoordinator;
  readonly timestep?: SimulationTimestepConfig;
  readonly quality?: SimulationQuality;
  readonly autoStart?: boolean;
  readonly respectReducedMotion?: boolean;
  readonly clearBeforeRender?: boolean;
  readonly clearColor?: string | null;
  readonly onStep?: (dt: number, totalTime: number) => void;
  readonly onStateChange?: (state: SimulationCoordinatorState) => void;
  readonly children?: ReactNode;
}

export const SimulationCanvas = forwardRef<HTMLCanvasElement, SimulationCanvasProps>(
  function SimulationCanvas(
    {
      coordinator: externalCoordinator,
      timestep,
      quality = "high",
      autoStart = true,
      respectReducedMotion = true,
      clearBeforeRender = true,
      clearColor = null,
      onStep,
      onStateChange,
      children,
      className,
      style,
      width = 800,
      height = 600,
      ...rest
    },
    forwardedRef
  ) {
    const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = (forwardedRef as RefObject<HTMLCanvasElement | null>) || localCanvasRef;

    const optionsRef = useRef({ onStep, onStateChange });
    optionsRef.current = { onStep, onStateChange };

    const coordinatorRef = useRef<SimulationCoordinator | null>(null);
    if (!coordinatorRef.current) {
      coordinatorRef.current =
        externalCoordinator ||
        createSimulationCoordinator({
          timestep,
          quality,
          autoStart,
          respectReducedMotion,
          clearBeforeRender,
          clearColor,
          onStep: (dt, t) => optionsRef.current.onStep?.(dt, t),
          onStateChange: (s) => optionsRef.current.onStateChange?.(s),
        });
    }

    const coordinator = coordinatorRef.current;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      coordinator.setCanvas(canvas);

      // Visibility-aware auto-pausing via IntersectionObserver
      let observer: IntersectionObserver | null = null;
      if (typeof window !== "undefined" && typeof IntersectionObserver !== "undefined") {
        try {
          observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry) {
              if (entry.isIntersecting) {
                coordinator.resume();
              } else {
                coordinator.pause();
              }
            }
          });
          observer.observe(canvas);
        } catch {
          // Graceful fallback
        }
      }

      return () => {
        observer?.disconnect();
        if (!externalCoordinator) {
          coordinator.dispose();
        }
      };
    }, [canvasRef, coordinator, externalCoordinator]);

    const contextValue = useMemo<SimulationContextValue>(() => {
      return {
        coordinator,
        canvas: canvasRef.current,
        registerParticipant: (p) => coordinator.register(p),
      };
    }, [coordinator, canvasRef]);

    return createElement(
      SimulationContext.Provider,
      { value: contextValue },
      createElement(
        "canvas",
        {
          ref: canvasRef,
          width,
          height,
          className,
          style: {
            display: "block",
            ...style,
          },
          ...rest,
        },
        children
      )
    );
  }
);

export interface ParticleFieldProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly config?: ParticleSystemConfig;
  readonly options?: UseParticleSystemOptions;
}

export const ParticleField = forwardRef<HTMLCanvasElement, ParticleFieldProps>(
  function ParticleField({ config = {}, options = {}, className, style, ...rest }, forwardedRef) {
    const simulationContext = useSimulationContext();
    const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = (forwardedRef as RefObject<HTMLCanvasElement | null>) || localCanvasRef;

    useParticleSystem(config, canvasRef, options);

    // If hosted inside SimulationCanvas, the parent canvas is used; render nothing
    if (simulationContext) {
      return null;
    }

    return createElement("canvas", {
      ref: canvasRef,
      className,
      style: {
        display: "block",
        ...style,
      },
      ...rest,
    });
  }
);

export interface FluidSimulationProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly config?: FluidSimulationConfig;
  readonly options?: UseFluidSimulationOptions;
}

export const FluidSimulation = forwardRef<HTMLCanvasElement, FluidSimulationProps>(
  function FluidSimulation({ config = {}, options = {}, className, style, ...rest }, forwardedRef) {
    const simulationContext = useSimulationContext();
    const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = (forwardedRef as RefObject<HTMLCanvasElement | null>) || localCanvasRef;

    useFluidSimulation(config, canvasRef, options);

    if (simulationContext) {
      return null;
    }

    return createElement("canvas", {
      ref: canvasRef,
      className,
      style: {
        display: "block",
        ...style,
      },
      ...rest,
    });
  }
);

export interface EnvironmentProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly config?: EnvironmentConfig;
  readonly weather?: WeatherPresetType;
  readonly options?: UseEnvironmentOptions;
}

export const Environment = forwardRef<HTMLCanvasElement, EnvironmentProps>(
  function Environment(
    { config = {}, weather, options = {}, className, style, ...rest },
    forwardedRef
  ) {
    const simulationContext = useSimulationContext();
    const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = (forwardedRef as RefObject<HTMLCanvasElement | null>) || localCanvasRef;

    const mergedConfig = useMemo(() => {
      return weather ? { ...config, weather } : config;
    }, [config, weather]);

    useEnvironment(mergedConfig, canvasRef, options);

    if (simulationContext) {
      return null;
    }

    return createElement("canvas", {
      ref: canvasRef,
      className,
      style: {
        display: "block",
        ...style,
      },
      ...rest,
    });
  }
);

export interface InteractiveParticlesProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  readonly config?: InteractiveParticleSystemConfig;
  readonly containerRef?: RefObject<HTMLElement | null>;
  readonly options?: UseInteractiveParticleSystemOptions;
}

export const InteractiveParticles = forwardRef<HTMLCanvasElement, InteractiveParticlesProps>(
  function InteractiveParticles(
    { config = {}, containerRef, options = {}, className, style, ...rest },
    forwardedRef
  ) {
    const simulationContext = useSimulationContext();
    const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasRef = (forwardedRef as RefObject<HTMLCanvasElement | null>) || localCanvasRef;

    useInteractiveParticleSystem(config, canvasRef, containerRef, options);

    if (simulationContext) {
      return null;
    }

    return createElement("canvas", {
      ref: canvasRef,
      className,
      style: {
        display: "block",
        ...style,
      },
      ...rest,
    });
  }
);

export { use3DMorph, type Use3DMorphResult } from "./3d/morphing/react.js";

export {
  useDeviceCapabilities,
  useDeviceCapabilityChanges,
  useDetailedGraphicsCapabilities,
} from "./core/device-capabilities/react.js";

export {
  useAdaptiveQuality,
  useQualityProfile,
  usePerformanceMetrics,
  useQualityAdaptation,
  AdaptiveQualityProvider,
  AdaptiveQualityBoundary,
  AdaptiveQualityContext,
  type AdaptiveQualityProviderProps,
} from "./core/adaptive-quality/react.js";

export {
  usePerformanceProfiler,
  usePerformanceReport,
  usePerformanceOptimizer,
  useOptimizationHistory,
  PerformanceMonitor,
  OptimizationBoundary,
} from "./core/performance-optimizer/react.js";

export {
  useResourceScope,
  useMemoryMonitor,
  useMemorySnapshot,
  useResourceReport,
  useMemoryPressure,
  ResourceScopeBoundary as ResourceScope,
  MemoryMonitorComponent as MemoryMonitor,
  ResourceRegistryContext,
  ResourceScopeContext,
} from "./core/resource-intelligence/react.js";

export {
  usePerformanceIntelligence,
  usePerformanceContext,
  usePerformanceHealth,
  usePerformanceDecisions,
  useUnifiedPerformanceReport,
  PerformanceIntelligenceProvider,
  PerformanceDashboard,
  PerformanceStatus,
  PerformanceIntelligenceContext,
  defaultPerformanceIntelligence,
  type PerformanceIntelligenceProviderProps,
} from "./core/performance-intelligence/react.js";

// AI Motion Intelligence React Integration (Phase 18, Prompt 141)
export {
  useAIMotionIntelligence,
  type UseAIMotionIntelligenceReturn,
} from "./core/ai-motion-intelligence/react.js";

// AI Design-to-Motion React Integration (Phase 18, Prompt 142)
export {
  useDesignToMotion,
  type UseDesignToMotionReturn,
} from "./core/design-to-motion/react.js";

// AI Scene Generation React Integration (Phase 18, Prompt 143)
export {
  useAISceneGeneration,
  type UseAISceneGenerationReturn,
} from "./core/scene-generation/react.js";


// Intelligent Agent Workflows React Integration (Phase 18, Prompt 144)
export {
  useAgentWorkflow,
  type UseAgentWorkflowState,
  type UseAgentWorkflowReturn,
} from "./core/agent-workflows/react.js";


// Multi-Agent Collaboration React Integration (Phase 18, Prompt 145)
export {
  useAgentCollaboration,
  type UseAgentCollaborationState,
  type UseAgentCollaborationReturn,
} from "./core/agent-workflows/react.js";
