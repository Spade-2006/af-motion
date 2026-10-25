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
  SpotlightControls as EffectSpotlightControls,
  SpotlightOptions as EffectSpotlightOptions,
  CursorTrailControls,
  CursorTrailOptions,
  CursorTrailTarget,
  ScrollProgressControls,
  ScrollProgressOptions,
  ScrollProgressPosition,
  AnimationControls,
  AnimationOptions,
  EasingFunction,
  EasingName,
  EasingRegistry,
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
      ["animate", "animateProgress", "aurora", "borderBeam", "countUp", "cursorTrail", "easings", "floatingOrbs", "glow", "gradientBackground", "gradientText", "gridBackground", "magnetic", "noiseBackground", "parallax", "particleField", "reveal", "ripple", "scrollProgress", "shine", "spotlight", "spotlightBackground", "splitText", "stagger", "textHighlight", "textMask", "textReveal", "textScramble", "tilt", "typewriter", "waveBackground", ...easingNames].sort(),
    );
  });

  it("exports animateProgress as a function", () => {
    expect(typeof api.animateProgress).toBe("function");
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
  });

  it.each(easingNames)("exports %s and registers it in easings", (name) => {
    expect(typeof api[name]).toBe("function");
    expect(api.easings[name]).toBe(api[name]);
  });

  it("exposes public types", () => {
    expectTypeOf<EasingName>().toEqualTypeOf<(typeof easingNames)[number]>();
    expectTypeOf<EasingRegistry[EasingName]>().toEqualTypeOf<EasingFunction>();
    expectTypeOf<AnimationOptions["easing"]>().toEqualTypeOf<EasingFunction | undefined>();
    expectTypeOf<AnimationControls["cancel"]>().toBeFunction();
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
