import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import * as api from "../src/index";
import type {
  AuroraControls,
  AuroraOptions,
  FloatingOrbsControls,
  FloatingOrbsOptions,
  GradientBackgroundControls,
  GradientBackgroundOptions,
  ParticleFieldControls,
  ParticleFieldOptions,
  NoiseBackgroundControls,
  NoiseBackgroundOptions,
  WaveBackgroundControls,
  WaveBackgroundOptions,
  GridBackgroundControls,
  GridBackgroundOptions,
  SpotlightBackgroundControls,
  SpotlightBackgroundOptions,
  TextScrambleControls,
  TextScrambleOptions,
  TypewriterControls,
  TypewriterOptions,
  CountUpControls,
  CountUpOptions,
  TextHighlightControls,
  TextHighlightOptions,
  SplitTextControls,
  SplitTextOptions,
  TextRevealControls,
  TextRevealOptions,
  TextMaskControls,
  TextMaskOptions,
  GradientTextControls,
  GradientTextOptions,
  GlowControls,
  GlowOptions,
  BorderBeamControls,
  BorderBeamOptions,
  ShineControls,
  ShineOptions,
  RippleControls,
  RippleOptions,
  MagneticControls,
  MagneticOptions,
  MagneticElementControls,
  MagneticElementOptions,
  HoverMotionControls,
  HoverMotionOptions,
  HoverMotionValues,
  FollowPointerControls,
  FollowPointerOptions,
  DragAxis,
  DragControls,
  DragOptions,
  DragPosition,
  SwipeControls,
  SwipeDirection,
  SwipeGesture,
  SwipeOptions,
  SpotlightControls as EffectSpotlightControls,
  SpotlightOptions as EffectSpotlightOptions,
  PointerGlowControls,
  PointerGlowOptions,
  CursorTrailControls,
  CursorTrailOptions,
  CursorTrailTarget,
  ScrollProgressControls,
  ScrollProgressOptions,
  ScrollProgressPosition,
  ScrollTriggerControls,
  ScrollTriggerOptions,
  InViewCallback,
  InViewControls,
  InViewOptions,
  ScrollVelocityControls,
  ScrollVelocityData,
  ScrollVelocityDirection,
  ScrollVelocityOptions,
  ScrollDirection,
  ScrollDirectionControls,
  ScrollDirectionOptions,
  AnimationSequenceControls,
  AnimationSequenceOptions,
  AnimationSequenceStep,
  AnimationParallelControls,
  AnimationParallelOptions,
  AnimationParallelStep,
  AnimationTimelineControls,
  AnimationTimelinePosition,
  AnimationTimelineStep,
  AnimationControls,
  AnimationOptions,
  SpringConfig,
  SpringControls,
  SpringOptions,
  SpringUpdate,
  InertiaControls,
  InertiaOptions,
  InertiaUpdate,
  AnimationPreset,
  AnimationPresetName,
  AnimationPresetOverrides,
  AnimationPresetRegistry,
  AnimationPresetRegistryApi,
  MotionDNA,
  MotionDNAOverrides,
  MotionDNARegistryApi,
  AdaptiveMotionConditions,
  AdaptiveMotionOverrides,
  AdaptiveMotionProfile,
  AdaptiveReducedMotion,
  ComposableEffect,
  MotionChoreographyAction,
  MotionChoreographyAnimation,
  MotionChoreographyControls,
  MotionChoreographyEffect,
  MotionChoreographyParallel,
  EffectCompositionControls,
  EffectCompositionEntry,
  EffectCompositionInstance,
  MotionDNACompositionEntry,
  MotionRecipe,
  MotionRecipeContext,
  MotionRecipeControls,
  MotionRecipeDefinition,
  MotionStateControls,
  MotionStateDefinition,
  MotionStateDefinitions,
  MotionStateTransitionControls,
  MotionStateTransitionOptions,
  PaletteColorOptions,
  PaletteColorsListener,
  EasingFunction,
  EasingOption,
  EasingName,
  EasingRegistry,
  EasingRegistryApi,
} from "../src/index";

const easingNames = [
  "linear",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine",
  "easeOutExpo",
  "easeOutBack",
] as const;

describe("public API", () => {
  it("exports exactly the expected runtime values", () => {
    expect(Object.keys(api).sort()).toEqual(
      ["PALETTE_CSS_VARIABLES", "activatePalette", "advancedGradientBackground", "animate", "animateParallel", "animatePreset", "animatePresetSequence", "animateProgress", "animateSequence", "animateSpring", "animateInertia", "animationPresetRegistry", "animationSequencePresetRegistry", "applyActivePalette", "applyMotionDNA", "applyPalette", "atmosphericBackground", "aurora", "borderBeam", "composeEffects", "cosmicBackground", "countUp", "createMotionChoreography", "createMotionRecipe", "createMotionStates", "createTimeline", "cursorTrail", "drag", "drawSVG", "easingRegistry", "easings", "energyBackground", "followPointer", "getActivePalette", "getAnimationPreset", "getAnimationSequencePreset", "getEasing", "getMotionDNA", "getPalette", "hoverMotion", "inView", "floatingOrbs", "fluidBackground", "glow", "geometricBackground", "gradientBackground", "gradientText", "gridBackground", "listPalettes", "magnetic", "magneticElement", "morphSVG", "motionDNARegistry", "noiseBackground", "paletteRegistry", "parallax", "particleBackground", "particleField", "pinch", "pointerGlow", "registerAnimationPreset", "registerAnimationSequencePreset", "registerEasing", "registerMotionDNA", "registerPalette", "removeAnimationPreset", "removeAnimationSequencePreset", "removeEasing", "removeMotionDNA", "removePalette", "resolveAdaptiveMotion", "resolvePaletteColors", "reveal", "ripple", "runMotionRecipe", "scrollAnimate", "scrollDirection", "scrollProgress", "scrollTrigger", "scrollVelocity", "shine", "splitText", "spotlight", "spotlightBackground", "stagger", "subscribeToPaletteChanges", "subscribeToPaletteColors", "swipe", "textHighlight", "textMask", "textReveal", "textScramble", "tilt", "typewriter", "waveBackground", ...easingNames].sort(),
    );
  });

  it("exports animateProgress as a function", () => {
    expect(typeof api.animateProgress).toBe("function");
  });

  it("exports repeat through the shared animation options", () => {
    expectTypeOf<AnimationOptions["repeat"]>().toEqualTypeOf<number | undefined>();
  });

  it("exports the interactive pointer effects and their public types", () => {
    expect(typeof api.pointerGlow).toBe("function");
    expect(api.pointerGlow).toBe(api.spotlight);
    expect(typeof api.magneticElement).toBe("function");
    expect(api.magneticElement).toBe(api.magnetic);
    expect(typeof api.hoverMotion).toBe("function");
    expect(typeof api.followPointer).toBe("function");
    expect(typeof api.drag).toBe("function");
    expect(typeof api.swipe).toBe("function");
    expect(typeof api.pinch).toBe("function");
    expectTypeOf<PinchGesture["scale"]>().toBeNumber();
    expectTypeOf<PinchOptions["onEnd"]>().toEqualTypeOf<((gesture: PinchGesture) => void) | undefined>();
    expectTypeOf<PinchControls["destroy"]>().toBeFunction();
    expectTypeOf<DragAxis>().toEqualTypeOf<"x" | "y" | "both">();
    expectTypeOf<DragOptions["onDrag"]>().toBeFunction();
    expectTypeOf<DragPosition["x"]>().toBeNumber();
    expectTypeOf<DragControls["destroy"]>().toBeFunction();
    expectTypeOf<SwipeDirection>().toEqualTypeOf<"left" | "right" | "up" | "down">();
    expectTypeOf<SwipeGesture["distance"]>().toBeNumber();
    expectTypeOf<SwipeOptions["onSwipe"]>().toBeFunction();
    expectTypeOf<SwipeControls["destroy"]>().toBeFunction();
    expectTypeOf<PointerGlowOptions["radius"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<PointerGlowControls["destroy"]>().toBeFunction();
    expectTypeOf<MagneticOptions["distance"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<MagneticElementOptions["distance"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<MagneticControls["destroy"]>().toBeFunction();
    expectTypeOf<MagneticElementControls["destroy"]>().toBeFunction();
    expectTypeOf<HoverMotionOptions["enter"]>().toEqualTypeOf<HoverMotionValues | undefined>();
    expectTypeOf<HoverMotionControls["destroy"]>().toBeFunction();
    expectTypeOf<FollowPointerOptions["container"]>().toEqualTypeOf<HTMLElement | string>();
    expectTypeOf<FollowPointerControls["destroy"]>().toBeFunction();
  });

  it("exports animateSpring and its public types", () => {
    expect(typeof api.animateSpring).toBe("function");
    expectTypeOf<SpringConfig>().toHaveProperty("stiffness");
    expectTypeOf<SpringOptions["onUpdate"]>().toBeFunction();
    expectTypeOf<SpringUpdate["position"]>().toBeNumber();
    expectTypeOf<SpringControls["cancel"]>().toBeFunction();
  });

  it("exports animateInertia and its public types", () => {
    expect(typeof api.animateInertia).toBe("function");
    expectTypeOf<InertiaOptions["onUpdate"]>().toBeFunction();
    expectTypeOf<InertiaUpdate["velocity"]>().toBeNumber();
    expectTypeOf<InertiaControls["cancel"]>().toBeFunction();
  });

  it("exports scrollTrigger and its public types", () => {
    expect(typeof api.scrollTrigger).toBe("function");
    expectTypeOf<ScrollTriggerOptions["threshold"]>().toEqualTypeOf<number | number[] | undefined>();
    expectTypeOf<ScrollTriggerControls["destroy"]>().toBeFunction();
  });

  it("exports inView and its public types", () => {
    expect(typeof api.inView).toBe("function");
    expectTypeOf<InViewCallback>().toBeFunction();
    expectTypeOf<InViewControls["destroy"]>().toBeFunction();
    expectTypeOf<InViewOptions["threshold"]>().toEqualTypeOf<number | number[] | undefined>();
  });

  it("exports the animation preset API and public types", () => {
    expect(typeof api.animatePreset).toBe("function");
    expect(typeof api.getAnimationPreset).toBe("function");
    expect(typeof api.registerAnimationPreset).toBe("function");
    expect(typeof api.removeAnimationPreset).toBe("function");
    expect(typeof api.animationPresetRegistry.get).toBe("function");
    expectTypeOf<AnimationPresetName>().toEqualTypeOf<
      "fadeIn" | "fadeOut" | "slideUp" | "slideDown" | "scaleIn" | "scaleOut"
    >();
    expectTypeOf<AnimationPreset["properties"]>().toMatchTypeOf<Record<string, readonly [string | number, string | number]>>();
    expectTypeOf<AnimationPresetOverrides["duration"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AnimationPresetRegistry>().toHaveProperty("fadeIn");
    expectTypeOf<AnimationPresetRegistryApi["register"]>().toBeFunction();
  });

  it("exports Motion DNA registration and option resolution", () => {
    expect(typeof api.registerMotionDNA).toBe("function");
    expect(typeof api.getMotionDNA).toBe("function");
    expect(typeof api.removeMotionDNA).toBe("function");
    expect(typeof api.applyMotionDNA).toBe("function");
    expect(typeof api.motionDNARegistry.register).toBe("function");
    expectTypeOf<MotionDNA["duration"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<MotionDNAOverrides["easing"]>().toEqualTypeOf<EasingOption | undefined>();
    expectTypeOf<MotionDNARegistryApi["get"]>().toBeFunction();
  });

  it("exports adaptive motion profile resolution", () => {
    expect(typeof api.resolveAdaptiveMotion).toBe("function");
    expectTypeOf<AdaptiveMotionProfile["intensity"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AdaptiveMotionConditions["reducedMotion"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<AdaptiveMotionOverrides["duration"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AdaptiveReducedMotion>().toEqualTypeOf<"respect" | "ignore">();
  });

  it("exports palette-reactive color resolution and subscription types", () => {
    expect(typeof api.resolvePaletteColors).toBe("function");
    expect(typeof api.subscribeToPaletteColors).toBe("function");
    expectTypeOf<PaletteColorOptions["palette"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<PaletteColorsListener>().toBeFunction();
  });

  it("exports reusable motion recipe APIs and types", () => {
    expect(typeof api.createMotionRecipe).toBe("function");
    expect(typeof api.runMotionRecipe).toBe("function");
    expectTypeOf<MotionRecipe<Record<string, unknown>>["definition"]>()
      .toMatchTypeOf<MotionRecipeDefinition<Record<string, unknown>>>();
    expectTypeOf<MotionRecipeContext["motionDNA"]>().toBeFunction();
    expectTypeOf<MotionRecipeControls["destroy"]>().toBeFunction();
    expectTypeOf<MotionRecipeControls["pause"]>().toBeFunction();
    expectTypeOf<MotionRecipeControls["resume"]>().toBeFunction();
  });

  it("exports named motion state controls and typed definitions", () => {
    expect(typeof api.createMotionStates).toBe("function");
    expectTypeOf<MotionStateDefinition["values"]>().toMatchTypeOf<Record<string, string | number>>();
    expectTypeOf<MotionStateDefinitions>().toMatchTypeOf<Readonly<Record<string, MotionStateDefinition>>>();
    expectTypeOf<MotionStateTransitionOptions["motionDNA"]>().toMatchTypeOf<
      { name: string; overrides?: MotionDNAOverrides } | undefined
    >();
    expectTypeOf<MotionStateControls["currentState"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<MotionStateTransitionControls["finished"]>().toEqualTypeOf<Promise<void>>();
  });

  it("exports effect composition controller and entry types", () => {
    expect(typeof api.composeEffects).toBe("function");
    expectTypeOf<EffectCompositionControls["destroy"]>().toBeFunction();
    expectTypeOf<EffectCompositionControls["pause"]>().toBeFunction();
    expectTypeOf<EffectCompositionControls["resume"]>().toBeFunction();
    expectTypeOf<EffectCompositionInstance>().toMatchTypeOf<{ destroy(): void } | { cancel(): void }>();
    expectTypeOf<ComposableEffect>().toMatchTypeOf<EffectCompositionEntry | MotionDNACompositionEntry>();
  });

  it("exports motion choreography and its typed actions", () => {
    expect(typeof api.createMotionChoreography).toBe("function");
    expectTypeOf<MotionChoreographyControls["cancel"]>().toBeFunction();
    expectTypeOf<MotionChoreographyAction>().toMatchTypeOf<
      MotionChoreographyAnimation | MotionChoreographyParallel
    >();
    expectTypeOf<MotionChoreographyEffect["effect"]>().toMatchTypeOf<ComposableEffect>();
  });

  it("exports animateSequence and its public types", () => {
    expect(typeof api.animateSequence).toBe("function");
    expectTypeOf<AnimationSequenceStep["target"]>().toEqualTypeOf<HTMLElement | string>();
    expectTypeOf<AnimationSequenceOptions["onComplete"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<AnimationSequenceControls["finished"]>().toEqualTypeOf<Promise<void>>();
  });

  it("exports animateParallel and its public types", () => {
    expect(typeof api.animateParallel).toBe("function");
    expectTypeOf<AnimationParallelStep["target"]>().toEqualTypeOf<HTMLElement | string>();
    expectTypeOf<AnimationParallelStep["options"]>().toEqualTypeOf<DOMAnimationOptions | undefined>();
    expectTypeOf<AnimationParallelOptions["onComplete"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<AnimationParallelControls["finished"]>().toEqualTypeOf<Promise<void>>();
  });

  it("exports createTimeline and its public types", () => {
    expect(typeof api.createTimeline).toBe("function");
    expectTypeOf<AnimationTimelineStep["at"]>().toEqualTypeOf<AnimationTimelinePosition>();
    expectTypeOf<AnimationTimelinePosition>().toEqualTypeOf<
      number | string | { label: string; offset?: number } | { previous: "start" | "end"; offset?: number }
    >();
    expectTypeOf<AnimationTimelineStep["target"]>().toEqualTypeOf<HTMLElement | string>();
    expectTypeOf<AnimationTimelineStep["options"]>().toEqualTypeOf<DOMAnimationOptions | undefined>();
    expectTypeOf<AnimationTimelineControls["finished"]>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<AnimationTimelineControls["play"]>().toBeFunction();
  });

  it("exports aurora and its public types", () => {
    expect(typeof api.aurora).toBe("function");
    expectTypeOf<AuroraOptions["colors"]>().toEqualTypeOf<readonly string[] | undefined>();
    expectTypeOf<AuroraControls["destroy"]>().toBeFunction();
  });

  it("exports floatingOrbs and its public types", () => {
    expect(typeof api.floatingOrbs).toBe("function");
    expectTypeOf<FloatingOrbsOptions["count"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<FloatingOrbsControls["destroy"]>().toBeFunction();
  });

  it("exports gradientBackground and its public types", () => {
    expect(typeof api.gradientBackground).toBe("function");
    expectTypeOf<GradientBackgroundOptions["angle"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<GradientBackgroundControls["destroy"]>().toBeFunction();
  });

  it("exports particleField and its public types", () => {
    expect(typeof api.particleField).toBe("function");
    expectTypeOf<ParticleFieldOptions["connections"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ParticleFieldControls["destroy"]>().toBeFunction();
  });

  it("exports noiseBackground and its public types", () => {
    expect(typeof api.noiseBackground).toBe("function");
    expectTypeOf<NoiseBackgroundOptions["intensity"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<NoiseBackgroundControls["destroy"]>().toBeFunction();
  });

  it("exports waveBackground and its public types", () => {
    expect(typeof api.waveBackground).toBe("function");
    expectTypeOf<WaveBackgroundOptions["amplitude"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<WaveBackgroundControls["destroy"]>().toBeFunction();
  });

  it("exports gridBackground and its public types", () => {
    expect(typeof api.gridBackground).toBe("function");
    expectTypeOf<GridBackgroundOptions["cellSize"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<GridBackgroundControls["destroy"]>().toBeFunction();
  });

  it("exports spotlightBackground and its public types", () => {
    expect(typeof api.spotlightBackground).toBe("function");
    expectTypeOf<SpotlightBackgroundOptions["radius"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<SpotlightBackgroundControls["destroy"]>().toBeFunction();
  });

  it("exports textScramble and its public types", () => {
    expect(typeof api.textScramble).toBe("function");
    expectTypeOf<TextScrambleOptions["characters"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<TextScrambleControls["destroy"]>().toBeFunction();
  });

  it("exports typewriter and its public types", () => {
    expect(typeof api.typewriter).toBe("function");
    expectTypeOf<TypewriterOptions["phrases"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<TypewriterControls["destroy"]>().toBeFunction();
  });

  it("exports countUp and its public types", () => {
    expect(typeof api.countUp).toBe("function");
    expectTypeOf<CountUpOptions["to"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<CountUpControls["destroy"]>().toBeFunction();
  });

  it("exports textHighlight and its public types", () => {
    expect(typeof api.textHighlight).toBe("function");
    expectTypeOf<TextHighlightOptions["trigger"]>().toEqualTypeOf<"scroll" | "immediate" | undefined>();
    expectTypeOf<TextHighlightControls["destroy"]>().toBeFunction();
  });

  it("exports splitText and its public types", () => {
    expect(typeof api.splitText).toBe("function");
    expectTypeOf<SplitTextOptions["by"]>().toEqualTypeOf<"characters" | "words" | "lines" | undefined>();
    expectTypeOf<SplitTextControls["destroy"]>().toBeFunction();
  });

  it("exports textReveal and its public types", () => {
    expect(typeof api.textReveal).toBe("function");
    expectTypeOf<TextRevealOptions["direction"]>().toEqualTypeOf<"up" | "down" | "left" | "right" | "none" | undefined>();
    expectTypeOf<TextRevealControls["destroy"]>().toBeFunction();
  });

  it("exports textMask and its public types", () => {
    expect(typeof api.textMask).toBe("function");
    expectTypeOf<TextMaskOptions["duration"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<TextMaskControls["destroy"]>().toBeFunction();
  });

  it("exports gradientText and its public types", () => {
    expect(typeof api.gradientText).toBe("function");
    expectTypeOf<GradientTextOptions["animated"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<GradientTextControls["destroy"]>().toBeFunction();
  });

  it("exports glow and its public types", () => {
    expect(typeof api.glow).toBe("function");
    expectTypeOf<GlowOptions["mode"]>().toEqualTypeOf<"static" | "pulse" | "hover" | undefined>();
    expectTypeOf<GlowControls["destroy"]>().toBeFunction();
  });

  it("exports borderBeam and its public types", () => {
    expect(typeof api.borderBeam).toBe("function");
    expectTypeOf<BorderBeamOptions["paused"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<BorderBeamControls["resume"]>().toBeFunction();
  });

  it("exports shine and its public types", () => {
    expect(typeof api.shine).toBe("function");
    expectTypeOf<ShineOptions["trigger"]>().toEqualTypeOf<"hover" | "continuous" | "click" | undefined>();
    expectTypeOf<ShineControls["destroy"]>().toBeFunction();
  });

  it("exports ripple and its public types", () => {
    expect(typeof api.ripple).toBe("function");
    expectTypeOf<RippleOptions["origin"]>().toEqualTypeOf<"pointer" | "center" | undefined>();
    expectTypeOf<RippleControls["destroy"]>().toBeFunction();
  });

  it("exports spotlight and its public types", () => {
    expect(typeof api.spotlight).toBe("function");
    expectTypeOf<EffectSpotlightOptions["radius"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<EffectSpotlightControls["destroy"]>().toBeFunction();
  });

  it("exports cursorTrail and its public types", () => {
    expect(typeof api.cursorTrail).toBe("function");
    expectTypeOf<CursorTrailOptions["target"]>().toEqualTypeOf<CursorTrailTarget | undefined>();
    expectTypeOf<CursorTrailControls["destroy"]>().toBeFunction();
  });

  it("exports scrollProgress and its public types", () => {
    expect(typeof api.scrollProgress).toBe("function");
    expectTypeOf<ScrollProgressOptions["position"]>().toEqualTypeOf<ScrollProgressPosition | undefined>();
    expectTypeOf<ScrollProgressControls["destroy"]>().toBeFunction();
    expectTypeOf<ScrollProgressOptions["onUpdate"]>().toEqualTypeOf<((progress: number) => void) | undefined>();
    expectTypeOf<ScrollProgressControls["getProgress"]>().toEqualTypeOf<() => number>();
  });

  it("exports scrollVelocity and its public types", () => {
    expect(typeof api.scrollVelocity).toBe("function");
    expectTypeOf<ScrollVelocityOptions["onUpdate"]>().toBeFunction();
    expectTypeOf<ScrollVelocityData["direction"]>().toEqualTypeOf<ScrollVelocityDirection>();
    expectTypeOf<ScrollVelocityData["position"]>().toEqualTypeOf<number>();
    expectTypeOf<ScrollVelocityControls["destroy"]>().toBeFunction();
  });

  it("exports scrollDirection and its public types", () => {
    expect(typeof api.scrollDirection).toBe("function");
    expectTypeOf<ScrollDirectionOptions["onChange"]>().toBeFunction();
    expectTypeOf<ScrollDirection>().toEqualTypeOf<"up" | "down" | "idle">();
    expectTypeOf<ScrollDirectionControls["destroy"]>().toBeFunction();
  });

  it.each(easingNames)("exports %s and registers it in easings", (name) => {
    expect(typeof api[name]).toBe("function");
    expect(api.easings[name]).toBe(api[name]);
  });

  it("exposes public types", () => {
    expectTypeOf<EasingName>().toEqualTypeOf<(typeof easingNames)[number]>();
    expectTypeOf<EasingRegistry[EasingName]>().toEqualTypeOf<EasingFunction>();
    expectTypeOf<AnimationOptions["easing"]>().toEqualTypeOf<EasingOption | undefined>();
    expectTypeOf<AnimationOptions["onStart"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<AnimationOptions["onUpdate"]>().toEqualTypeOf<((progress: number) => void) | undefined>();
    expectTypeOf<AnimationOptions["onCancel"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<EasingRegistryApi["register"]>().toBeFunction();
    expectTypeOf<AnimationControls["cancel"]>().toBeFunction();
  });

  it("exports the named easing registry API", () => {
    expect(typeof api.registerEasing).toBe("function");
    expect(typeof api.getEasing).toBe("function");
    expect(typeof api.removeEasing).toBe("function");
    expect(typeof api.easingRegistry.register).toBe("function");
    expectTypeOf<EasingOption>().toEqualTypeOf<string | EasingFunction>();
  });
});

describe("public API integration", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("animateProgress accepts a registry easing", () => {
    const onUpdate = vi.fn();
    api.animateProgress({ duration: 100, easing: api.easings.easeInQuad, onUpdate });
    const run = (t: number): void => frames.splice(0).forEach((cb) => cb(t));
    run(0);
    run(50);
    run(100);
    expect(onUpdate.mock.calls.map(([p]) => p)).toEqual([0, 0.25, 1]);
  });
});
