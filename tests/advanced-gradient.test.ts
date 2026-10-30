// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  advancedGradientBackground,
  registerPalette,
  removePalette,
} from "../src/index";
import type { PaletteInput } from "../src/index";

const firstPalette: PaletteInput = {
  name: "advancedGradientTestA",
  primary: "#112233",
  secondary: "#445566",
  accent: "#778899",
};
const secondPalette: PaletteInput = {
  name: "advancedGradientTestB",
  primary: "#aabbcc",
  secondary: "#ddeeff",
  accent: "#010203",
};

let reducedMotion = false;
let motionListeners: Set<(event: { matches: boolean }) => void>;

function changeMotionPreference(matches: boolean): void {
  reducedMotion = matches;
  for (const listener of [...motionListeners]) listener({ matches });
}

beforeEach(() => {
  reducedMotion = false;
  motionListeners = new Set();
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reducedMotion; },
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.delete(listener);
    },
  }));
  vi.stubGlobal("CSS", { supports: () => true });
  vi.stubGlobal("getComputedStyle", (element: HTMLElement) => ({
    position: element.style.position || "static",
    isolation: element.style.isolation || "auto",
  }));
  registerPalette(firstPalette);
  registerPalette(secondPalette);
});

afterEach(() => {
  removePalette(firstPalette.name);
  removePalette(secondPalette.name);
  vi.unstubAllGlobals();
  document.head.replaceChildren();
});

describe("advancedGradientBackground()", () => {
  it.each([
    ["mesh", "radial-gradient", "linear-gradient"],
    ["aurora", "radial-gradient", "#abcdef"],
    ["radial", "radial-gradient", "ellipse at center"],
    ["conic", "conic-gradient", "from 225deg"],
  ] as const)("renders %s with configurable direction and colours", (type, imagePart, detail) => {
    const target = document.createElement("section");
    const controls = advancedGradientBackground(target, {
      type,
      colors: ["#123456", "#abcdef", "#fedcba"],
      direction: 225,
      speed: 5,
      intensity: 0.4,
      opacity: 0.55,
      className: "custom-gradient",
      style: { "mix-blend-mode": "screen" },
    });
    const overlay = target.firstElementChild as HTMLElement;

    expect(overlay.getAttribute("aria-hidden")).toBe("true");
    expect(overlay.classList.contains("custom-gradient")).toBe(true);
    expect(overlay.style.backgroundImage).toContain(imagePart);
    expect(overlay.style.backgroundImage).toContain(detail);
    expect(overlay.style.backgroundImage).toContain("#123456");
    if (type === "aurora") expect(overlay.style.filter).toBe("blur(24px)");
    expect(overlay.style.opacity).toBe("0.55");
    expect(overlay.style.backgroundSize).toBe("140% 140%");
    expect(overlay.style.getPropertyValue("mix-blend-mode")).toBe("screen");
    if (type === "mesh" || type === "aurora") {
      expect(overlay.style.animation).toContain("5s ease-in-out infinite");
    } else {
      expect(overlay.style.animation).toBe("");
    }

    controls.destroy();
    expect(target.children).toHaveLength(0);
    expect(document.head.querySelectorAll("style")).toHaveLength(0);
  });

  it("uses explicit and active registered palettes and follows active changes", () => {
    const explicitTarget = document.createElement("div");
    const explicitControls = advancedGradientBackground(explicitTarget, { palette: firstPalette.name });
    expect((explicitTarget.firstElementChild as HTMLElement).style.backgroundImage).toContain("#112233");
    explicitControls.destroy();

    activatePalette(firstPalette.name);
    const activeTarget = document.createElement("div");
    const activeControls = advancedGradientBackground(activeTarget, {
      palette: "active",
      colors: ["#123456", "#abcdef"],
    });
    const overlay = activeTarget.firstElementChild as HTMLElement;
    expect(overlay.style.backgroundImage).toContain("#112233");

    activatePalette(secondPalette.name);
    expect(overlay.style.backgroundImage).toContain("#aabbcc");
    expect(overlay.style.backgroundImage).toContain("#ddeeff");
    activeControls.destroy();
    activatePalette(firstPalette.name);
    expect(overlay.style.backgroundImage).toContain("#aabbcc");
  });

  it("restores temporary target styles and removes listeners and overlays on cleanup", () => {
    const target = document.createElement("div");
    target.style.setProperty("position", "absolute", "important");
    target.style.setProperty("isolation", "auto");
    const controls = advancedGradientBackground(target, { type: "mesh" });
    expect(target.style.position).toBe("absolute");
    expect(target.style.isolation).toBe("isolate");
    expect(motionListeners.size).toBe(1);

    controls.destroy();
    controls.destroy();
    expect(target.children).toHaveLength(0);
    expect(target.style.getPropertyValue("position")).toBe("absolute");
    expect(target.style.getPropertyPriority("position")).toBe("important");
    expect(target.style.getPropertyValue("isolation")).toBe("auto");
    expect(motionListeners.size).toBe(0);
  });

  it("keeps a stable background with reduced motion and responds to preference changes", () => {
    const target = document.createElement("div");
    const controls = advancedGradientBackground(target, { type: "aurora", speed: 7 });
    const overlay = target.firstElementChild as HTMLElement;
    expect(overlay.style.animation).toContain("7s");

    changeMotionPreference(true);
    expect(overlay.style.animation).toBe("");
    expect(overlay.style.backgroundImage).toContain("radial-gradient");
    expect(overlay.style.getPropertyValue("will-change")).toBe("auto");

    changeMotionPreference(false);
    expect(overlay.style.animation).toContain("7s");
    controls.destroy();
  });

  it("does not animate static configurations and rejects invalid palettes, colours, or targets", () => {
    const target = document.createElement("div");
    const controls = advancedGradientBackground(target, { speed: 0 });
    expect((target.firstElementChild as HTMLElement).style.animation).toBe("");
    controls.destroy();

    expect(() => advancedGradientBackground(target, { palette: "unknownPalette" })).toThrow(
      'Unknown palette "unknownPalette"',
    );
    expect(() => advancedGradientBackground(target, { colors: ["red"] })).toThrow(/at least two/);
    expect(() => advancedGradientBackground(null as never)).toThrow();
  });
});
