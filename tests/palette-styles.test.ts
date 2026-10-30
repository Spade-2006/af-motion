// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  activatePalette,
  applyActivePalette,
  applyPalette,
  PALETTE_CSS_VARIABLES,
  registerPalette,
  removePalette,
} from "../src/index";
import type { PaletteInput } from "../src/index";

const firstPalette: PaletteInput = {
  name: "styleFirst",
  primary: "#112233",
  secondary: "#445566",
  accent: "#778899",
};
const secondPalette: PaletteInput = {
  name: "styleSecond",
  primary: "#aabbcc",
  secondary: "#ddeeff",
  accent: "#010203",
};

function registerFixtures(): void {
  registerPalette(firstPalette);
  registerPalette(secondPalette);
}

afterEach(() => {
  removePalette(firstPalette.name);
  removePalette(secondPalette.name);
});

function makeStyleTarget(): { element: HTMLElement; getPriority(property: string): string } {
  const values = new Map<string, string>();
  const priorities = new Map<string, string>();
  const style = {
    getPropertyValue: (property: string) => values.get(property) ?? "",
    getPropertyPriority: (property: string) => priorities.get(property) ?? "",
    setProperty: (property: string, value: string, priority = "") => {
      values.set(property, value);
      priorities.set(property, priority);
    },
    removeProperty: (property: string) => {
      priorities.delete(property);
      const previous = values.get(property) ?? "";
      values.delete(property);
      return previous;
    },
  };
  const element = document.createElement("div");
  Object.defineProperty(element, "style", { configurable: true, value: style });
  return { element, getPriority: (property) => priorities.get(property) ?? "" };
}

describe("palette CSS utilities", () => {
  it("maps semantic tokens to consistently named CSS custom properties", () => {
    expect(PALETTE_CSS_VARIABLES).toEqual({
      primary: "--af-motion-color-primary",
      secondary: "--af-motion-color-secondary",
      accent: "--af-motion-color-accent",
      background: "--af-motion-color-background",
      surface: "--af-motion-color-surface",
      text: "--af-motion-color-text",
      muted: "--af-motion-color-muted",
      border: "--af-motion-color-border",
      success: "--af-motion-color-success",
      warning: "--af-motion-color-warning",
      error: "--af-motion-color-error",
      info: "--af-motion-color-info",
    });
  });

  it("applies an explicitly selected registered palette and restores inline values", () => {
    registerFixtures();
    const element = document.createElement("div");
    const primaryVariable = PALETTE_CSS_VARIABLES.primary;
    element.style.setProperty(primaryVariable, "#a0b0c0", "important");
    element.style.setProperty("--unrelated-color", "#123456");

    const cleanup = applyPalette(element, firstPalette.name);
    expect(element.style.getPropertyValue(primaryVariable)).toBe("#112233");
    expect(element.style.getPropertyPriority(primaryVariable)).toBe("");
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.success)).toBe("#778899");

    cleanup();
    expect(element.style.getPropertyValue(primaryVariable)).toBe("#a0b0c0");
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.success)).toBe("");
    expect(element.style.getPropertyValue("--unrelated-color")).toBe("#123456");
    cleanup();
  });

  it("applies the active palette and follows changes when subscribed", () => {
    registerFixtures();
    activatePalette(firstPalette.name);
    const element = document.createElement("div");
    element.style.setProperty(PALETTE_CSS_VARIABLES.primary, "#000000", "important");

    const cleanup = applyActivePalette(element, { subscribe: true });
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#112233");

    activatePalette(secondPalette.name);
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#aabbcc");
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.background)).toBe("#ddeeff");

    cleanup();
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#000000");

    activatePalette(firstPalette.name);
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#000000");
  });

  it("does not apply when no palette is active and clears on active palette removal", () => {
    registerFixtures();
    const element = document.createElement("div");
    element.style.setProperty(PALETTE_CSS_VARIABLES.primary, "#999999");
    const cleanup = applyActivePalette(element, { subscribe: true });

    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#999999");
    activatePalette(firstPalette.name);
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#112233");
    removePalette(firstPalette.name);
    expect(element.style.getPropertyValue(PALETTE_CSS_VARIABLES.primary)).toBe("#999999");
    cleanup();
  });

  it("does not restore properties the utility never applied", () => {
    const element = document.createElement("div");
    const primaryVariable = PALETTE_CSS_VARIABLES.primary;
    const cleanup = applyActivePalette(element, { subscribe: true });

    element.style.setProperty(primaryVariable, "#123456", "important");
    cleanup();

    expect(element.style.getPropertyValue(primaryVariable)).toBe("#123456");
  });

  it("restores original CSS custom-property priorities on cleanup", () => {
    registerFixtures();
    const { element, getPriority } = makeStyleTarget();
    const primaryVariable = PALETTE_CSS_VARIABLES.primary;
    element.style.setProperty(primaryVariable, "#a0b0c0", "important");

    const cleanup = applyPalette(element, firstPalette.name);
    expect(getPriority(primaryVariable)).toBe("");
    cleanup();

    expect(element.style.getPropertyValue(primaryVariable)).toBe("#a0b0c0");
    expect(getPriority(primaryVariable)).toBe("important");
  });

  it("rejects unknown palettes and invalid targets", () => {
    registerFixtures();
    const element = document.createElement("div");

    expect(() => applyPalette(element, "notRegistered")).toThrow('Unknown palette "notRegistered"');
    expect(() => applyPalette(null as never, firstPalette.name)).toThrow(/DOM element/);
    expect(() => applyActivePalette({} as HTMLElement)).toThrow(/DOM element/);
  });
});
