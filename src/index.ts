export { animateProgress } from "./core/animation.js";
export { animateSpring } from "./core/spring.js";
export type { SpringConfig, SpringControls, SpringOptions, SpringUpdate } from "./core/spring.js";
export { animateInertia } from "./core/inertia.js";
export type { InertiaControls, InertiaOptions, InertiaUpdate } from "./core/inertia.js";
export { createTimeline } from "./core/animation-timeline.js";
export type {
  AnimationTimelineControls,
  AnimationTimelinePosition,
  AnimationTimelineStep,
} from "./core/animation-timeline.js";
export {
  animatePresetSequence,
  animatePreset,
  animationPresetRegistry,
  animationSequencePresetRegistry,
  getAnimationPreset,
  getAnimationSequencePreset,
  registerAnimationPreset,
  registerAnimationSequencePreset,
  removeAnimationPreset,
  removeAnimationSequencePreset,
} from "./core/animation-presets.js";
export type {
  AnimationPreset,
  AnimationPresetName,
  AnimationPresetOverrides,
  AnimationPresetRegistry,
  AnimationPresetRegistryApi,
  AnimationSequencePreset,
  AnimationSequencePresetOverrides,
  AnimationSequencePresetRegistryApi,
  AnimationSequencePresetStep,
} from "./core/animation-presets.js";
export {
  applyMotionDNA,
  getMotionDNA,
  motionDNARegistry,
  registerMotionDNA,
  removeMotionDNA,
} from "./core/motion-dna.js";
export type {
  MotionDNA,
  MotionDNAOverrides,
  MotionDNARegistryApi,
} from "./core/motion-dna.js";
export { resolveAdaptiveMotion } from "./core/adaptive-motion.js";
export type {
  AdaptiveMotionConditions,
  AdaptiveMotionOverrides,
  AdaptiveMotionProfile,
  AdaptiveReducedMotion,
} from "./core/adaptive-motion.js";
export { composeEffects } from "./core/effect-composer.js";
export type {
  ComposableEffect,
  EffectCompositionControls,
  EffectCompositionEntry,
  EffectCompositionInstance,
  MotionDNACompositionEntry,
} from "./core/effect-composer.js";
export { createMotionChoreography } from "./core/motion-choreography.js";
export type {
  MotionChoreographyAction,
  MotionChoreographyAnimation,
  MotionChoreographyBranch,
  MotionChoreographyControls,
  MotionChoreographyEffect,
  MotionChoreographyParallel,
} from "./core/motion-choreography.js";
export {
  createMotionRecipe,
  runMotionRecipe,
} from "./core/motion-recipe.js";
export type {
  MotionRecipe,
  MotionRecipeContext,
  MotionRecipeControls,
  MotionRecipeDefinition,
} from "./core/motion-recipe.js";
export { createMotionStates } from "./core/motion-states.js";
export type {
  MotionStateControls,
  MotionStateDefinition,
  MotionStateDefinitions,
  MotionStateTransitionControls,
  MotionStateTransitionOptions,
} from "./core/motion-states.js";
export { animateSequence } from "./core/animation-sequence.js";
export type {
  AnimationSequenceControls,
  AnimationSequenceOptions,
  AnimationSequenceStep,
} from "./core/animation-sequence.js";
export { animateParallel } from "./core/animation-parallel.js";
export type {
  AnimationParallelControls,
  AnimationParallelOptions,
  AnimationParallelStep,
} from "./core/animation-parallel.js";
export { animate } from "./core/animate.js";
export type {
  AnimatableProperties,
  AnimateTarget,
  AnimationValue,
  DOMAnimationOptions,
} from "./core/animate.js";
export { reveal } from "./effects/reveal.js";
export type { RevealControls, RevealOptions } from "./effects/reveal.js";
export { stagger } from "./effects/stagger.js";
export type {
  StaggerControls,
  StaggerElementAnimation,
  StaggerFrom,
  StaggerOptions,
} from "./effects/stagger.js";
export { drawSVG } from "./effects/draw-svg.js";
export type { DrawSVGControls, DrawSVGOptions } from "./effects/draw-svg.js";
export { morphSVG } from "./effects/morph-svg.js";
export type { MorphSVGControls, MorphSVGOptions, MorphSVGTarget } from "./effects/morph-svg.js";
export { magnetic } from "./effects/magnetic.js";
export { magneticElement } from "./effects/magnetic.js";
export type {
  MagneticControls,
  MagneticOptions,
  MagneticElementControls,
  MagneticElementOptions,
} from "./effects/magnetic.js";
export { hoverMotion } from "./effects/hover-motion.js";
export type { HoverMotionControls, HoverMotionOptions, HoverMotionValues } from "./effects/hover-motion.js";
export { followPointer } from "./effects/follow-pointer.js";
export type { FollowPointerControls, FollowPointerOptions } from "./effects/follow-pointer.js";
export { drag } from "./effects/drag.js";
export type { DragAxis, DragControls, DragOptions, DragPosition } from "./effects/drag.js";
export { pinch } from "./effects/pinch.js";
export type { PinchControls, PinchGesture, PinchOptions } from "./effects/pinch.js";
export { swipe } from "./effects/swipe.js";
export type { SwipeControls, SwipeDirection, SwipeGesture, SwipeOptions } from "./effects/swipe.js";
export { tilt } from "./effects/tilt.js";
export type { TiltControls, TiltOptions } from "./effects/tilt.js";
export { parallax } from "./effects/parallax.js";
export type { ParallaxAxis, ParallaxControls, ParallaxOptions } from "./effects/parallax.js";
export { aurora } from "./backgrounds/aurora.js";
export type { AuroraControls, AuroraOptions } from "./backgrounds/aurora.js";
export { advancedGradientBackground } from "./backgrounds/advanced-gradient.js";
export type {
  AdvancedGradientControls,
  AdvancedGradientOptions,
  AdvancedGradientType,
} from "./backgrounds/advanced-gradient.js";
export { floatingOrbs } from "./backgrounds/floating-orbs.js";
export type { FloatingOrbsControls, FloatingOrbsOptions } from "./backgrounds/floating-orbs.js";
export { gradientBackground } from "./backgrounds/gradient.js";
export type {
  GradientBackgroundControls,
  GradientBackgroundOptions,
} from "./backgrounds/gradient.js";
export { particleField } from "./backgrounds/particle-field.js";
export type { ParticleFieldControls, ParticleFieldOptions } from "./backgrounds/particle-field.js";
export { particleBackground } from "./backgrounds/particle-background.js";
export type {
  ParticleBackgroundControls,
  ParticleBackgroundMode,
  ParticleBackgroundOptions,
} from "./backgrounds/particle-background.js";
export { cosmicBackground } from "./backgrounds/cosmic-background.js";
export type {
  CosmicBackgroundControls,
  CosmicBackgroundEffect,
  CosmicBackgroundOptions,
} from "./backgrounds/cosmic-background.js";
export { geometricBackground } from "./backgrounds/geometric-backgrounds.js";
export type {
  GeometricBackgroundBaseOptions,
  GeometricBackgroundControls,
  GeometricBackgroundEffect,
  GeometricBackgroundOptions,
  GeometricGridOptions,
  GeometricGridShape,
  HexagonFieldOptions,
  PerspectiveFloorOptions,
  PolygonMeshOptions,
  TechCircuitOptions,
} from "./backgrounds/geometric-backgrounds.js";
export { fluidBackground } from "./backgrounds/fluid-backgrounds.js";
export type {
  FluidBackgroundBaseOptions,
  FluidBackgroundControls,
  FluidBackgroundEffect,
  FluidBackgroundOptions,
  FluidWaveDirection,
  FluidWavesOptions,
  InkFlowOptions,
  LiquidBlobsOptions,
  LiquidGradientOptions,
  MetaballsOptions,
} from "./backgrounds/fluid-backgrounds.js";
export { atmosphericBackground } from "./backgrounds/atmospheric-backgrounds.js";
export type {
  AtmosphericBackgroundBaseOptions,
  AtmosphericBackgroundControls,
  AtmosphericBackgroundEffect,
  AtmosphericBackgroundOptions,
  AtmosphericDirection,
  AuroraBorealisOptions,
  FogMistOptions,
  RainfallOptions,
  SnowfallOptions,
  SunbeamsOptions,
} from "./backgrounds/atmospheric-backgrounds.js";
export { energyBackground } from "./backgrounds/energy-effects.js";
export type {
  ElectricArcsOptions,
  EnergyBackgroundBaseOptions,
  EnergyBackgroundControls,
  EnergyBackgroundEffect,
  EnergyBackgroundOptions,
  EnergyPulseOptions,
  LaserBeamsOptions,
  LightningOptions,
  PlasmaFieldOptions,
} from "./backgrounds/energy-effects.js";
export { noiseBackground } from "./backgrounds/noise.js";
export type { NoiseBackgroundControls, NoiseBackgroundOptions } from "./backgrounds/noise.js";
export { waveBackground } from "./backgrounds/wave.js";
export type { WaveBackgroundControls, WaveBackgroundOptions } from "./backgrounds/wave.js";
export { gridBackground } from "./backgrounds/grid.js";
export type { GridBackgroundControls, GridBackgroundOptions } from "./backgrounds/grid.js";
export { spotlightBackground } from "./backgrounds/spotlight.js";
export type {
  SpotlightBackgroundControls,
  SpotlightBackgroundOptions,
} from "./backgrounds/spotlight.js";
export { textScramble } from "./effects/text-scramble.js";
export type { TextScrambleControls, TextScrambleOptions } from "./effects/text-scramble.js";
export { typewriter } from "./effects/typewriter.js";
export type { TypewriterControls, TypewriterOptions } from "./effects/typewriter.js";
export { countUp } from "./effects/count-up.js";
export type { CountUpControls, CountUpOptions } from "./effects/count-up.js";
export { textHighlight } from "./effects/text-highlight.js";
export type { TextHighlightControls, TextHighlightOptions } from "./effects/text-highlight.js";
export { splitText } from "./effects/split-text.js";
export type { SplitTextControls, SplitTextOptions } from "./effects/split-text.js";
export { textReveal } from "./effects/text-reveal.js";
export type { TextRevealControls, TextRevealOptions } from "./effects/text-reveal.js";
export { textMask } from "./effects/text-mask.js";
export type { TextMaskControls, TextMaskOptions } from "./effects/text-mask.js";
export { gradientText } from "./effects/gradient-text.js";
export type { GradientTextControls, GradientTextOptions } from "./effects/gradient-text.js";
export { glow } from "./effects/glow.js";
export type { GlowControls, GlowOptions } from "./effects/glow.js";
export { borderBeam } from "./effects/border-beam.js";
export type { BorderBeamControls, BorderBeamOptions } from "./effects/border-beam.js";
export { shine } from "./effects/shine.js";
export type { ShineControls, ShineOptions } from "./effects/shine.js";
export { ripple } from "./effects/ripple.js";
export type { RippleControls, RippleOptions } from "./effects/ripple.js";
export { spotlight } from "./effects/spotlight.js";
export { pointerGlow } from "./effects/spotlight.js";
export type {
  SpotlightControls,
  SpotlightOptions,
  PointerGlowControls,
  PointerGlowOptions,
} from "./effects/spotlight.js";
export { cursorTrail } from "./effects/cursor-trail.js";
export type { CursorTrailControls, CursorTrailOptions, CursorTrailTarget } from "./effects/cursor-trail.js";
export { scrollProgress } from "./effects/scroll-progress.js";
export type {
  ScrollProgressControls,
  ScrollProgressOptions,
  ScrollProgressPosition,
} from "./effects/scroll-progress.js";
export { scrollTrigger } from "./effects/scroll-trigger.js";
export type { ScrollTriggerControls, ScrollTriggerOptions } from "./effects/scroll-trigger.js";
export { inView } from "./effects/in-view.js";
export type { InViewCallback, InViewCleanup, InViewControls, InViewOptions } from "./effects/in-view.js";
export { scrollVelocity } from "./effects/scroll-velocity.js";
export type {
  ScrollVelocityControls,
  ScrollVelocityData,
  ScrollVelocityDirection,
  ScrollVelocityOptions,
} from "./effects/scroll-velocity.js";
export { scrollAnimate } from "./effects/scroll-animate.js";
export type { ScrollAnimateControls, ScrollAnimateOptions } from "./effects/scroll-animate.js";
export { scrollDirection } from "./effects/scroll-direction.js";
export type {
  ScrollDirection,
  ScrollDirectionControls,
  ScrollDirectionOptions,
} from "./effects/scroll-direction.js";
export type {
  AnimationControls,
  AnimationOptions,
  EasingFunction,
} from "./core/animation.js";
export {
  activatePalette,
  getActivePalette,
  getPalette,
  listPalettes,
  paletteRegistry,
  registerPalette,
  removePalette,
  subscribeToPaletteChanges,
} from "./core/palettes.js";
export {
  applyActivePalette,
  applyPalette,
  PALETTE_CSS_VARIABLES,
} from "./core/palette-styles.js";
export type {
  ColorPalette,
  PaletteColorNames,
  PaletteDefinition,
  PaletteInput,
  PaletteChangeListener,
  PaletteRegistryApi,
  SemanticColorToken,
  SemanticColorTokens,
} from "./core/palettes.js";
export type {
  ApplyActivePaletteOptions,
  PaletteStyleCleanup,
} from "./core/palette-styles.js";
export { resolvePaletteColors, subscribeToPaletteColors } from "./core/palette-colors.js";
export type { PaletteColorOptions, PaletteColorsListener } from "./core/palette-colors.js";

export {
  easings,
  easingRegistry,
  getEasing,
  registerEasing,
  removeEasing,
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
} from "./easing/easings.js";
export type {
  EasingName,
  EasingOption,
  EasingRegistry,
  EasingRegistryApi,
} from "./easing/easings.js";
