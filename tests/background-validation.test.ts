import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  advancedGradientBackground,
  atmosphericBackground,
  cosmicBackground,
  energyBackground,
  fluidBackground,
  geometricBackground,
  particleBackground,
} from "../src/index";

const factories = {
  advancedGradientBackground,
  atmosphericBackground,
  cosmicBackground,
  energyBackground,
  fluidBackground,
  geometricBackground,
  particleBackground,
} as const;

beforeEach(() => {
  vi.stubGlobal("document", { querySelectorAll: () => [] });
});

afterEach(() => vi.unstubAllGlobals());

describe("background configuration validation without matching targets", () => {
  for (const [name, factory] of Object.entries(factories)) {
    const create = factory as (target: string, options: Record<string, unknown>) => { destroy(): void };

    it(`${name} rejects unknown palettes consistently`, () => {
      expect(() => create(".missing", { palette: "not-a-palette" })).toThrow('Unknown palette "not-a-palette"');
    });

    it(`${name} rejects invalid colors consistently`, () => {
      expect(() => create(".missing", { colors: [""] })).toThrow(TypeError);
    });

    it(`${name} still returns inert controls for valid options`, () => {
      const controls = create(".missing", {});
      expect(() => {
        controls.destroy();
        controls.destroy();
      }).not.toThrow();
    });
  }

  it("advancedGradientBackground requires at least two colors even without targets", () => {
    expect(() => advancedGradientBackground(".missing", { colors: [] })).toThrow(
      "at least two CSS colors",
    );
    expect(() => advancedGradientBackground(".missing", { colors: ["#fff"] })).toThrow(TypeError);
  });
});
