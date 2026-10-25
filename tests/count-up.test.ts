import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { countUp } from "../src/effects/count-up";
import type { CountUpControls, CountUpOptions } from "../src/effects/count-up";
import { easings } from "../src/easing/easings";

class FakeHTMLElement {
  textContent: string | null;
  constructor(text: string) {
    this.textContent = text;
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function flushFrame(time: number): void {
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(time);
}

beforeEach(() => {
  frames = new Map();
  nextFrameId = 1;
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.delete(listener);
    },
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe("countUp()", () => {
  it("animates from the configured start to the exact final value", () => {
    const element = new FakeHTMLElement("Original");
    const controls = countUp(asHTMLElement(element), { from: 0, to: 100, duration: 100 });
    expect(element.textContent).toBe("0");

    flushFrame(0);
    flushFrame(50);
    expect(element.textContent).toBe("50");
    flushFrame(100);
    expect(element.textContent).toBe("100");
    expect(frames.size).toBe(0);
    controls.destroy();
    expect(element.textContent).toBe("Original");
  });

  it("formats decimals consistently and handles negative values with prefix and suffix", () => {
    const element = new FakeHTMLElement("");
    countUp(asHTMLElement(element), {
      from: -10,
      to: -2,
      duration: 100,
      decimals: 2,
      prefix: "$",
      suffix: " USD",
    });

    flushFrame(0);
    expect(element.textContent).toBe("$-10.00 USD");
    flushFrame(50);
    expect(element.textContent).toBe("$-6.00 USD");
    flushFrame(100);
    expect(element.textContent).toBe("$-2.00 USD");
  });

  it("resolves multiple targets and applies named or custom easing", () => {
    const first = new FakeHTMLElement("A");
    const second = new FakeHTMLElement("B");
    selectorResults[".stat"] = [first, new (class {})(), second];
    const controls = countUp(".stat", {
      from: 0,
      to: 100,
      duration: 100,
      easing: "easeInQuad",
    });

    flushFrame(0);
    flushFrame(50);
    expect(first.textContent).toBe("25");
    expect(second.textContent).toBe("25");
    flushFrame(100);
    expect(first.textContent).toBe("100");
    controls.destroy();
    expect(first.textContent).toBe("A");
    expect(second.textContent).toBe("B");

    const custom = new FakeHTMLElement("");
    countUp(asHTMLElement(custom), {
      from: 0,
      to: 100,
      duration: 100,
      easing: (progress) => progress * progress,
    });
    flushFrame(0);
    flushFrame(50);
    expect(custom.textContent).toBe("25");
  });

  it("shows the final formatted value immediately for reduced motion", () => {
    reducedMotion = true;
    const element = new FakeHTMLElement("Original");
    const controls = countUp(asHTMLElement(element), {
      to: 12500,
      prefix: "$",
      suffix: "+",
      easing: "easeOutExpo",
    });
    expect(element.textContent).toBe("$12500+");
    expect(frames.size).toBe(0);
    controls.destroy();
    expect(element.textContent).toBe("Original");
  });

  it("restores original text and cancels pending frames when destroyed", () => {
    const element = new FakeHTMLElement("Keep this");
    const controls = countUp(asHTMLElement(element), { to: 500, duration: 1000 });
    expect(element.textContent).toBe("0");
    expect(frames.size).toBe(1);
    controls.destroy();
    controls.destroy();
    expect(element.textContent).toBe("Keep this");
    expect(frames.size).toBe(0);
  });

  it("handles reduced-motion preference changing during an animation", () => {
    const element = new FakeHTMLElement("Before");
    const controls = countUp(asHTMLElement(element), { to: 10, duration: 1000 });
    flushFrame(0);
    flushFrame(100);
    expect(element.textContent).toBe("1");

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(element.textContent).toBe("10");
    expect(frames.size).toBe(0);
    controls.destroy();
    expect(element.textContent).toBe("Before");
  });

  it("validates values and selectors before changing target text", () => {
    const element = new FakeHTMLElement("Untouched");
    expect(() => countUp(asHTMLElement(element), { from: Number.NaN })).toThrow(RangeError);
    expect(() => countUp(asHTMLElement(element), { to: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => countUp(asHTMLElement(element), { duration: -1 })).toThrow(RangeError);
    expect(() => countUp(asHTMLElement(element), { decimals: -1 })).toThrow(RangeError);
    expect(() => countUp(asHTMLElement(element), { decimals: 21 })).toThrow(RangeError);
    expect(() => countUp(asHTMLElement(element), { decimals: 1.5 })).toThrow(RangeError);
    expect(() => countUp(asHTMLElement(element), { prefix: 2 as unknown as string })).toThrow(TypeError);
    expect(() => countUp(asHTMLElement(element), { easing: "missing" as "linear" })).toThrow(TypeError);
    expect(() => countUp(asHTMLElement(element), { easing: (() => Number.NaN) as typeof easings.linear })).toThrow(TypeError);
    expect(() => countUp("!!bad")).toThrow(SyntaxError);
    expect(element.textContent).toBe("Untouched");
  });

  it("returns inert controls for empty matches and exposes public types", () => {
    const controls = countUp(".missing");
    expect(() => controls.destroy()).not.toThrow();
    expectTypeOf<CountUpOptions["easing"]>().toEqualTypeOf<keyof typeof easings | ((progress: number) => number) | undefined>();
    expectTypeOf<CountUpControls["destroy"]>().toBeFunction();
  });
});
