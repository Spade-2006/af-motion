// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStudio,
  createStudioShareUrl,
  generateUsageSnippet,
  readStudioSettings,
  STUDIO_PRESETS,
} from "../studio/playground";
import type { UsageSnippetSettings } from "../studio/playground";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  observe = vi.fn((element: Element) => this.observed.add(element));
  unobserve = vi.fn((element: Element) => this.observed.delete(element));
  disconnect = vi.fn(() => this.observed.clear());

  constructor(readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
}

let host: HTMLDivElement;
let destroyStudio: (() => void) | undefined;
let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;
let reducedMotion: boolean;
let motionPreferenceListeners: Set<(event: { matches: boolean }) => void>;

function setReducedMotion(matches: boolean): void {
  reducedMotion = matches;
  for (const listener of [...motionPreferenceListeners]) listener({ matches });
}

function mountStudio(search = ""): void {
  destroyStudio?.();
  window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  destroyStudio = createStudio(host).destroy;
}

function selectEffect(value: string): HTMLSelectElement {
  const select = host.querySelector<HTMLSelectElement>("#effect-select");
  if (!select) throw new Error("Effect selector was not rendered");
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return select;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  FakeIntersectionObserver.instances = [];
  nextFrameId = 1;
  frames = new Map();
  reducedMotion = false;
  motionPreferenceListeners = new Set();
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("performance", { now: () => 0 } as Performance);
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return reducedMotion; },
    addEventListener: vi.fn((_type: string, listener: (event: { matches: boolean }) => void) => {
      motionPreferenceListeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: (event: { matches: boolean }) => void) => {
      motionPreferenceListeners.delete(listener);
    }),
  }));
  vi.stubGlobal("CSS", { supports: () => true });
  vi.stubGlobal("HTMLElement", window.HTMLElement);
  Object.defineProperty(window.HTMLElement.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => ({ cancel: vi.fn() })),
  });
  mountStudio();
});

afterEach(() => {
  destroyStudio?.();
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AF Studio playground", () => {
  it("encodes and decodes shareable effect settings", () => {
    const settings: UsageSnippetSettings = {
      effect: "typewriter",
      duration: 1400,
      delay: 300,
      intensity: 0.8,
      once: false,
      text: "Hello & motion",
    };
    const url = createStudioShareUrl("https://studio.example/play?keep=1", settings);

    expect(new URL(url).searchParams.get("keep")).toBe("1");
    expect(readStudioSettings(new URL(url).search).text).toBe("Hello & motion");
    expect(readStudioSettings(new URL(url).search)).toEqual(settings);
  });

  it("restores valid URL settings into controls, preview, and generated code", () => {
    mountStudio("?effect=gradient&duration=1800&delay=250&intensity=85&once=false&text=URL%20headline");

    expect(host.querySelector<HTMLSelectElement>("#effect-select")?.value).toBe("gradient");
    expect(host.querySelector<HTMLInputElement>("#duration-range")?.value).toBe("1800");
    expect(host.querySelector<HTMLInputElement>("#delay-range")?.value).toBe("250");
    expect(host.querySelector<HTMLInputElement>("#intensity-range")?.value).toBe("85");
    expect(host.querySelector<HTMLInputElement>("#once-toggle")?.checked).toBe(false);
    expect(host.querySelector<HTMLInputElement>("#sample-input")?.value).toBe("URL headline");
    expect(host.querySelector("#sample-card")?.getAttribute("data-effect")).toBe("gradient");
    expect(host.querySelector("#usage-snippet")?.textContent).toContain("duration: 1800");
    expect(host.querySelector("#usage-snippet")?.textContent).toContain("loop: true");
    expect(host.querySelector("#usage-snippet")?.textContent).toContain("URL headline");
    expect(new URLSearchParams(window.location.search).get("effect")).toBe("gradient");
    expect(new URLSearchParams(window.location.search).get("text")).toBe("URL headline");
  });

  it("ignores invalid URL values and falls back safely for missing values", () => {
    mountStudio("?effect=unknown&duration=99999&delay=-1&intensity=12&once=maybe&text=");

    expect(host.querySelector<HTMLSelectElement>("#effect-select")?.value).toBe("reveal");
    expect(host.querySelector<HTMLInputElement>("#duration-range")?.value).toBe("900");
    expect(host.querySelector<HTMLInputElement>("#delay-range")?.value).toBe("0");
    expect(host.querySelector<HTMLInputElement>("#intensity-range")?.value).toBe("65");
    expect(host.querySelector<HTMLInputElement>("#once-toggle")?.checked).toBe(true);
    expect(host.querySelector<HTMLInputElement>("#sample-input")?.value).toBe("Make motion feel effortless.");

    mountStudio("?effect=magnetic&duration=700");
    expect(host.querySelector<HTMLSelectElement>("#effect-select")?.value).toBe("magnetic");
    expect(host.querySelector<HTMLInputElement>("#duration-range")?.value).toBe("700");
    expect(host.querySelector<HTMLInputElement>("#intensity-range")?.value).toBe("65");
  });

  it("shares the current configuration URL with a manual-copy fallback", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const selectFallback = vi.spyOn(HTMLInputElement.prototype, "select");
    Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn(() => false) });
    selectEffect("magnetic");
    const sample = host.querySelector<HTMLInputElement>("#sample-input");
    if (!sample) throw new Error("Sample input was not rendered");
    sample.value = "Link me";
    sample.dispatchEvent(new Event("input", { bubbles: true }));

    host.querySelector<HTMLButtonElement>("#share-button")?.click();
    await Promise.resolve();

    const fallback = host.querySelector<HTMLInputElement>("#share-fallback");
    expect(fallback?.hidden).toBe(false);
    expect(fallback?.value).toContain("effect=magnetic");
    expect(fallback?.value).toContain("text=Link+me");
    expect(selectFallback).toHaveBeenCalled();
    expect(host.querySelector("#preview-status")?.textContent).toContain("copy it manually");
  });

  it("generates effect-specific TypeScript snippets with matching options and cleanup", () => {
    const defaults: UsageSnippetSettings = {
      effect: "reveal",
      duration: 1200,
      delay: 250,
      intensity: 0.5,
      once: false,
      text: "Hello",
    };
    const revealSnippet = generateUsageSnippet(defaults);
    expect(revealSnippet).toContain('import { reveal } from "af-motion"');
    expect(revealSnippet).toContain('document.querySelector<HTMLElement>("#sample-card")');
    expect(revealSnippet).toContain("duration: 1200");
    expect(revealSnippet).toContain("delay: 250");
    expect(revealSnippet).toContain("once: false");
    expect(revealSnippet).toContain("controls.destroy()");

    const typewriterSnippet = generateUsageSnippet({ ...defaults, effect: "typewriter", delay: 100 });
    expect(typewriterSnippet).toContain("typewriter(element");
    expect(typewriterSnippet).toContain('phrases: ["Hello"]');
    expect(typewriterSnippet).toContain("loop: true");
    expect(typewriterSnippet).toContain("window.setTimeout");
    expect(typewriterSnippet).toContain("window.clearTimeout(timer)");
    expect(typewriterSnippet).toContain("controls?.destroy()");

    const glowSnippet = generateUsageSnippet({ ...defaults, effect: "glow" });
    expect(glowSnippet).toContain("glow(element");
    expect(glowSnippet).toContain("intensity: 0.5");
    expect(glowSnippet).toContain('mode: "pulse"');
  });

  it("renders a selectable effect catalog and matching preview description", () => {
    const select = host.querySelector<HTMLSelectElement>("#effect-select");
    expect(select?.options).toHaveLength(8);
    expect(select?.value).toBe("reveal");
    expect(host.querySelector("#effect-title")?.textContent).toBe("Scroll reveal");

    selectEffect("tilt");
    expect(host.querySelector("#effect-title")?.textContent).toBe("3D tilt");
    expect(host.querySelector("#sample-card")?.getAttribute("data-effect")).toBe("tilt");
    expect(host.querySelector("#preview-status")?.textContent).toContain("3D tilt is ready");
  });

  it("provides accessible names, keyboard focus, and polite status announcements", () => {
    const labeledControls = [
      "#effect-select",
      "#duration-range",
      "#delay-range",
      "#intensity-range",
      "#once-toggle",
      "#sample-input",
      "#comparison-toggle",
    ];
    for (const selector of labeledControls) {
      const control = host.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
      expect(control, `${selector} exists`).not.toBeNull();
      expect(control?.labels?.length, `${selector} has a label`).toBeGreaterThan(0);
    }

    const secondEffect = host.querySelector<HTMLSelectElement>("#comparison-effect");
    expect(secondEffect?.getAttribute("aria-label")).toBe("Choose second effect");
    expect(host.querySelector("#preview-status")?.getAttribute("role")).toBe("status");
    expect(host.querySelector("#preview-status")?.getAttribute("aria-live")).toBe("polite");

    const replay = host.querySelector<HTMLButtonElement>("#replay-button");
    replay?.focus();
    expect(document.activeElement).toBe(replay);
    expect(replay?.tabIndex).toBe(0);
  });

  it("enables and disables side-by-side comparison", () => {
    const toggle = host.querySelector<HTMLInputElement>("#comparison-toggle");
    const comparisonStage = host.querySelector<HTMLElement>("#comparison-stage");
    const comparisonControls = host.querySelector<HTMLElement>("#comparison-controls");
    if (!toggle || !comparisonStage || !comparisonControls) throw new Error("Comparison controls were not rendered");

    expect(comparisonStage.hidden).toBe(true);
    expect(comparisonControls.hidden).toBe(true);

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    expect(comparisonStage.hidden).toBe(false);
    expect(comparisonControls.hidden).toBe(false);
    expect(host.querySelector("#preview-comparison")?.classList.contains("is-comparing")).toBe(true);
    expect(host.querySelector("#comparison-card")?.getAttribute("data-effect")).toBe("scramble");
    expect(host.querySelector("#preview-status")?.textContent).toContain("Comparison enabled");

    toggle.checked = false;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    expect(comparisonStage.hidden).toBe(true);
    expect(comparisonControls.hidden).toBe(true);
    expect(host.querySelector("#preview-comparison")?.classList.contains("is-comparing")).toBe(false);
    expect(host.querySelector("#preview-status")?.textContent).toBe("Comparison disabled.");
  });

  it("runs the selected second effect independently of the primary effect", () => {
    const toggle = host.querySelector<HTMLInputElement>("#comparison-toggle");
    const secondEffect = host.querySelector<HTMLSelectElement>("#comparison-effect");
    if (!toggle || !secondEffect) throw new Error("Comparison controls were not rendered");

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    secondEffect.value = "gradient";
    secondEffect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(host.querySelector("#sample-card")?.getAttribute("data-effect")).toBe("reveal");
    expect(host.querySelector("#comparison-card")?.getAttribute("data-effect")).toBe("gradient");
    expect(host.querySelector("#comparison-title")?.textContent).toBe("Make motion feel effortless.");
  });

  it("replays and cleans up effects on both comparison previews", () => {
    const toggle = host.querySelector<HTMLInputElement>("#comparison-toggle");
    const secondEffect = host.querySelector<HTMLSelectElement>("#comparison-effect");
    if (!toggle || !secondEffect) throw new Error("Comparison controls were not rendered");

    secondEffect.value = "reveal";
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    let activeObservers = FakeIntersectionObserver.instances.slice(-2);
    expect(activeObservers).toHaveLength(2);
    expect(activeObservers.every((observer) => observer.observed.size === 1)).toBe(true);

    host.querySelector<HTMLButtonElement>("#replay-button")?.click();
    expect(activeObservers.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(true);
    activeObservers = FakeIntersectionObserver.instances.slice(-2);
    expect(activeObservers.every((observer) => observer.observed.size === 1)).toBe(true);

    destroyStudio?.();
    destroyStudio = undefined;
    expect(activeObservers.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(true);
    expect(frames.size).toBe(0);
  });

  it("renders six useful preset choices", () => {
    expect(host.querySelectorAll("[data-preset]")).toHaveLength(6);
    expect(STUDIO_PRESETS.map(({ id }) => id)).toEqual([
      "subtle-reveal",
      "dramatic-reveal",
      "typewriter-intro",
      "gradient-headline",
      "glowing-card",
      "magnetic-interaction",
    ]);
  });

  it.each(STUDIO_PRESETS)("applies the $name preset to controls, preview, and code", (preset) => {
    const button = host.querySelector<HTMLButtonElement>(`[data-preset="${preset.id}"]`);
    if (!button) throw new Error(`Preset "${preset.id}" was not rendered`);
    button.click();

    expect(host.querySelector<HTMLSelectElement>("#effect-select")?.value).toBe(preset.settings.effect);
    expect(host.querySelector<HTMLInputElement>("#duration-range")?.value).toBe(String(preset.settings.duration));
    expect(host.querySelector<HTMLInputElement>("#delay-range")?.value).toBe(String(preset.settings.delay));
    expect(host.querySelector<HTMLInputElement>("#intensity-range")?.value).toBe(
      String(Math.round(preset.settings.intensity * 100)),
    );
    expect(host.querySelector<HTMLInputElement>("#once-toggle")?.checked).toBe(preset.settings.once);
    expect(host.querySelector<HTMLInputElement>("#sample-input")?.value).toBe(preset.settings.text);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector("#sample-card")?.getAttribute("data-effect")).toBe(preset.settings.effect);
    const importName = {
      scramble: "textScramble",
      gradient: "gradientText",
      "count-up": "countUp",
    }[preset.settings.effect] ?? preset.settings.effect;
    expect(host.querySelector("#usage-snippet")?.textContent).toContain(
      `import { ${importName} }`,
    );
  });

  it("clears the active preset indication when a setting is manually edited", () => {
    host.querySelector<HTMLButtonElement>('[data-preset="subtle-reveal"]')?.click();
    const duration = host.querySelector<HTMLInputElement>("#duration-range");
    if (!duration) throw new Error("Duration control was not rendered");
    duration.value = "1100";
    duration.dispatchEvent(new Event("input", { bubbles: true }));

    expect(host.querySelector('[data-preset="subtle-reveal"]')?.getAttribute("aria-pressed")).toBe("false");
  });

  it("replays the selected effect with updated sample and parameters", () => {
    selectEffect("typewriter");
    const sample = host.querySelector<HTMLInputElement>("#sample-input");
    const duration = host.querySelector<HTMLInputElement>("#duration-range");
    if (!sample || !duration) throw new Error("Studio controls were not rendered");

    sample.value = "Hello AF";
    sample.dispatchEvent(new Event("input", { bubbles: true }));
    duration.value = "1400";
    duration.dispatchEvent(new Event("input", { bubbles: true }));
    host.querySelector<HTMLButtonElement>("#replay-button")?.click();

    expect(host.querySelector("#sample-title")?.textContent).toContain("_");
    expect(host.querySelector("#duration-value")?.textContent).toBe("1400 ms");
  });

  it("keeps both previews static and cancels work when reduced motion is enabled", () => {
    selectEffect("typewriter");
    const toggle = host.querySelector<HTMLInputElement>("#comparison-toggle");
    const secondEffect = host.querySelector<HTMLSelectElement>("#comparison-effect");
    if (!toggle || !secondEffect) throw new Error("Comparison controls were not rendered");

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    secondEffect.value = "scramble";
    secondEffect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(frames.size).toBeGreaterThan(0);

    setReducedMotion(true);
    expect(frames.size).toBe(0);
    expect(host.querySelector("#sample-title")?.textContent).toBe("Make motion feel effortless.");
    expect(host.querySelector("#comparison-title")?.textContent).toBe("Make motion feel effortless.");
    expect(host.querySelector("#preview-status")?.textContent).toContain("previews are static");

    selectEffect("magnetic");
    expect(frames.size).toBe(0);
    expect(host.querySelector("#preview-status")?.textContent).toContain("previews are static");

    setReducedMotion(false);
    expect(host.querySelector("#preview-status")?.textContent).toContain("Replay an effect");
    expect(frames.size).toBe(0);
  });

  it("updates the generated snippet whenever effect settings change", () => {
    selectEffect("gradient");
    const duration = host.querySelector<HTMLInputElement>("#duration-range");
    const delay = host.querySelector<HTMLInputElement>("#delay-range");
    const sample = host.querySelector<HTMLInputElement>("#sample-input");
    const once = host.querySelector<HTMLInputElement>("#once-toggle");
    if (!duration || !delay || !sample || !once) throw new Error("Studio controls were not rendered");

    duration.value = "1500";
    duration.dispatchEvent(new Event("input", { bubbles: true }));
    delay.value = "300";
    delay.dispatchEvent(new Event("input", { bubbles: true }));
    sample.value = "Studio copy";
    sample.dispatchEvent(new Event("input", { bubbles: true }));
    once.checked = false;
    once.dispatchEvent(new Event("change", { bubbles: true }));

    const snippet = host.querySelector("#usage-snippet")?.textContent ?? "";
    expect(snippet).toContain("duration: 1500");
    expect(snippet).toContain("loop: true");
    expect(snippet).toContain("window.setTimeout");
    expect(snippet).toContain("Studio copy");
    expect(new URLSearchParams(window.location.search).get("duration")).toBe("1500");
    expect(new URLSearchParams(window.location.search).get("text")).toBe("Studio copy");
  });

  it("resets selection and controls to their initial values", () => {
    selectEffect("scramble");
    const sample = host.querySelector<HTMLInputElement>("#sample-input");
    if (!sample) throw new Error("Sample input was not rendered");
    sample.value = "Another phrase";
    sample.dispatchEvent(new Event("input", { bubbles: true }));

    host.querySelector<HTMLButtonElement>("#reset-button")?.click();

    expect(host.querySelector<HTMLSelectElement>("#effect-select")?.value).toBe("reveal");
    expect(host.querySelector<HTMLInputElement>("#sample-input")?.value).toBe("Make motion feel effortless.");
    expect(host.querySelector<HTMLInputElement>("#duration-range")?.value).toBe("900");
    expect(host.querySelector("#sample-card")?.getAttribute("data-effect")).toBe("reveal");
  });

  it("cleans up active observers and scheduled work when destroyed", () => {
    selectEffect("reveal");
    const currentObserver = FakeIntersectionObserver.instances.at(-1);
    expect(currentObserver?.observed.size).toBe(1);

    destroyStudio?.();
    destroyStudio = undefined;

    expect(currentObserver?.disconnect).toHaveBeenCalledTimes(1);
    selectEffect("scramble");
    expect(frames.size).toBe(0);
  });

  it("cancels a delayed effect start when the playground is destroyed", () => {
    vi.useFakeTimers();
    selectEffect("scramble");
    const delay = host.querySelector<HTMLInputElement>("#delay-range");
    if (!delay) throw new Error("Delay control was not rendered");
    delay.value = "500";
    delay.dispatchEvent(new Event("input", { bubbles: true }));

    expect(vi.getTimerCount()).toBe(1);
    destroyStudio?.();
    destroyStudio = undefined;

    expect(vi.getTimerCount()).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("selects the snippet for manual copying when clipboard APIs are unavailable", () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn(() => false) });

    host.querySelector<HTMLButtonElement>("#copy-button")?.click();

    expect(document.getSelection()?.toString()).toContain("import { reveal } from");
    expect(host.querySelector("#preview-status")?.textContent).toContain("copy it manually");
  });
});
