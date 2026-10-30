import { describe, expect, it } from "vitest";
import {
  easeOutBack,
  easeInQuad,
  easings,
  easingRegistry,
  getEasing,
  registerEasing,
  removeEasing,
} from "../src/easing/easings";
import type { EasingName } from "../src/easing/easings";

const names = Object.keys(easings) as EasingName[];

const midpoints: Record<EasingName, number> = {
  linear: 0.5,
  easeInQuad: 0.25,
  easeOutQuad: 0.75,
  easeInOutQuad: 0.5,
  easeInCubic: 0.125,
  easeOutCubic: 0.875,
  easeInOutCubic: 0.5,
  easeInSine: 1 - Math.SQRT1_2,
  easeOutSine: Math.SQRT1_2,
  easeInOutSine: 0.5,
  easeOutExpo: 1 - 2 ** -5,
  easeOutBack: 1 + 2.70158 * -0.125 + 1.70158 * 0.25,
};

describe("easings registry", () => {
  it("contains all twelve easings", () => {
    expect(names).toHaveLength(12);
  });

  describe.each(names)("%s", (name) => {
    const ease = easings[name];

    it("returns exactly 0 at 0 and exactly 1 at 1", () => {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
    });

    it("returns the expected midpoint", () => {
      expect(ease(0.5)).toBeCloseTo(midpoints[name], 10);
    });

    it("clamps out-of-range input", () => {
      expect(ease(-0.5)).toBe(ease(0));
      expect(ease(-100)).toBe(0);
      expect(ease(1.5)).toBe(ease(1));
      expect(ease(100)).toBe(1);
      expect(ease(Number.POSITIVE_INFINITY)).toBe(1);
      expect(ease(Number.NEGATIVE_INFINITY)).toBe(0);
    });

    it("treats NaN as 0", () => {
      expect(ease(Number.NaN)).toBe(0);
    });
  });

  it("registry entries are the exported functions", () => {
    expect(easings.easeOutBack).toBe(easeOutBack);
  });

  it("retrieves built-ins without allowing them to be overwritten or removed", () => {
    expect(getEasing("easeInQuad")).toBe(easeInQuad);
    expect(removeEasing("easeInQuad")).toBe(false);
    expect(() => registerEasing("easeInQuad", (progress) => progress)).toThrow(TypeError);
    expect(getEasing("easeInQuad")).toBe(easeInQuad);
  });

  it("registers, replaces, retrieves, and removes custom easings", () => {
    const custom = (progress: number) => progress ** 3;
    const replacement = (progress: number) => progress ** 2;

    easingRegistry.register("customEase", custom);
    expect(getEasing("customEase")).toBe(custom);
    easingRegistry.register("customEase", replacement);
    expect(easingRegistry.get("customEase")).toBe(replacement);
    expect(easingRegistry.remove("customEase")).toBe(true);
    expect(getEasing("customEase")).toBeUndefined();
    expect(removeEasing("customEase")).toBe(false);
  });

  it("rejects invalid names and easing values", () => {
    const invalidName = "" as string;
    expect(() => registerEasing(invalidName, (progress) => progress)).toThrow(TypeError);
    expect(() => registerEasing(" padded ", (progress) => progress)).toThrow(TypeError);
    expect(() => registerEasing("broken", null as never)).toThrow(TypeError);
    expect(() => getEasing("" as string)).toThrow(TypeError);
    expect(() => removeEasing(" ")).toThrow(TypeError);
    expect(() => getEasing(null as never)).toThrow(TypeError);
  });
});

describe("easeOutBack overshoot", () => {
  it("exceeds 1 for inputs inside (0, 1)", () => {
    expect(easeOutBack(0.5)).toBeGreaterThan(1);
    expect(easeOutBack(0.7)).toBeGreaterThan(1);
  });

  it("peaks near 1.1 and does not clamp its output", () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => easeOutBack(i / 100)));
    expect(peak).toBeGreaterThan(1.09);
    expect(peak).toBeLessThan(1.11);
  });

  it("settles back to exactly 1", () => {
    expect(easeOutBack(0.99)).toBeLessThan(easeOutBack(0.7));
    expect(easeOutBack(1)).toBe(1);
  });
});
