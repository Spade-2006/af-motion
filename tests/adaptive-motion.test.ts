import { afterEach, describe, expect, it } from "vitest";
import {
  registerMotionDNA,
  removeMotionDNA,
  resolveAdaptiveMotion,
} from "../src/index";

afterEach(() => {
  removeMotionDNA("adaptiveBaseline");
});

describe("resolveAdaptiveMotion()", () => {
  it("uses explicit conditions to scale DNA timing and applies final overrides", () => {
    registerMotionDNA("adaptiveBaseline", {
      duration: 200,
      delay: 20,
      easing: "easeOutQuad",
    });

    expect(resolveAdaptiveMotion({
      motionDNA: "adaptiveBaseline",
      intensity: 0.8,
      lowPowerIntensity: 0.5,
    }, { lowPower: true })).toEqual({
      duration: 400,
      delay: 20,
      easing: "easeOutQuad",
    });

    expect(resolveAdaptiveMotion({
      motionDNA: "adaptiveBaseline",
      intensity: 0.5,
    }, { intensity: 0.25, reducedMotion: true }, {
      duration: 90,
      respectReducedMotion: false,
    })).toEqual({
      duration: 90,
      delay: 20,
      easing: "easeOutQuad",
      respectReducedMotion: false,
    });
  });

  it("preserves defaults unless a condition requires an adjustment", () => {
    expect(resolveAdaptiveMotion({ easing: "linear" })).toEqual({ easing: "linear" });
    expect(resolveAdaptiveMotion({ intensity: 0.5 }, { reducedMotion: true })).toEqual({
      duration: 2000,
      respectReducedMotion: true,
    });
    expect(resolveAdaptiveMotion(
      { reducedMotion: "ignore" },
      { reducedMotion: true },
    )).toEqual({ respectReducedMotion: false });
  });

  it("validates profile conditions and override values", () => {
    expect(() => resolveAdaptiveMotion({ intensity: 0 })).toThrow(/intensity/);
    expect(() => resolveAdaptiveMotion({}, { lowPower: "yes" as never })).toThrow(/lowPower/);
    expect(() => resolveAdaptiveMotion({}, {}, { playbackRate: 0 })).toThrow(/playbackRate/);
    expect(() => resolveAdaptiveMotion({ motionDNA: "missing" })).toThrow(/Unknown Motion DNA/);
  });
});
