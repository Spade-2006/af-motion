import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../src/core/animate";

class FakeStyle {
  values = new Map<string, string>([["color", "red"]]);
  setProperty = vi.fn((name: string, value: string) => {
    this.values.set(name, value);
  });
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

class FakeSVGElement {}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;

function flushFrame(time: number): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

function styleOf(element: HTMLElement): FakeStyle {
  return element.style as unknown as FakeStyle;
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  selectorResults = {};
  reducedMotion = false;

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("animate: single element", () => {
  it("applies from values immediately and interpolates numbers", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100 });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
  });

  it("ends on the exact `to` value and calls onComplete once", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1], width: ["10px", "20.5px"] }, { duration: 100, onComplete });

    flushFrame(0);
    flushFrame(100);
    flushFrame(200);

    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("width")).toBe("20.5px");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not touch unrelated inline styles", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 10 });
    flushFrame(0);
    flushFrame(10);

    const names = styleOf(element).setProperty.mock.calls.map(([name]) => name);
    expect(new Set(names)).toEqual(new Set(["opacity"]));
    expect(styleOf(element).get("color")).toBe("red");
  });

  it("honors delay and easing", () => {
    const element = makeElement();
    animate(
      element,
      { opacity: [0, 1] },
      { duration: 100, delay: 100, easing: (t) => t * t },
    );

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0.25");
  });
});

describe("animate: property interpolation", () => {
  it("interpolates numbers inside units and functions", () => {
    const element = makeElement();
    animate(
      element,
      {
        transform: ["translateY(24px)", "translateY(0px)"],
        margin: ["10px 0px", "20px 10px"],
        backgroundColor: ["rgb(0, 0, 0)", "rgb(100, 200, 50)"],
      },
      { duration: 100 },
    );
    flushFrame(0);
    flushFrame(50);

    const style = styleOf(element);
    expect(style.get("transform")).toBe("translateY(12px)");
    expect(style.get("margin")).toBe("15px 5px");
    expect(style.get("background-color")).toBe("rgb(50, 100, 25)");
  });

  it("converts camelCase to kebab-case and keeps custom properties", () => {
    const element = makeElement();
    animate(element, { borderRadius: ["0px", "8px"], "--gap": [0, 4] }, { duration: 100 });
    expect(styleOf(element).get("border-radius")).toBe("0px");
    expect(styleOf(element).get("--gap")).toBe("0");
  });

  it("uses a discrete fallback for non-interpolable values", () => {
    const element = makeElement();
    animate(
      element,
      { color: ["red", "blue"], width: ["10px", "2em"], display: ["none", "block"] },
      { duration: 100 },
    );
    flushFrame(0);
    flushFrame(99);

    const style = styleOf(element);
    expect(style.get("color")).toBe("red");
    expect(style.get("width")).toBe("10px");
    expect(style.get("display")).toBe("none");

    flushFrame(100);
    expect(style.get("color")).toBe("blue");
    expect(style.get("width")).toBe("2em");
    expect(style.get("display")).toBe("block");
  });

  it("does not interpolate digits inside hex colors", () => {
    const element = makeElement();
    animate(element, { color: ["#111111", "#999999"] }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("color")).toBe("#111111");
  });

  it("allows easing overshoot", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100, easing: () => 1.5 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("1.5");
  });
});

describe("animate: interpolation edge cases", () => {
  function valueAtHalf(from: string | number, to: string | number): string | undefined {
    const element = makeElement();
    animate(element, { prop: [from, to] }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    return styleOf(element).get("prop");
  }

  it("interpolates translate3d with negative numbers", () => {
    expect(valueAtHalf("translate3d(0px, 10px, -5px)", "translate3d(10px, 20px, 5px)")).toBe(
      "translate3d(5px, 15px, 0px)",
    );
  });

  it("interpolates rgba with decimals", () => {
    expect(valueAtHalf("rgba(0, 0, 0, 0)", "rgba(100, 200, 50, 1)")).toBe("rgba(50, 100, 25, 0.5)");
    expect(valueAtHalf("rgba(0,0,0,.2)", "rgba(100,0,0,1)")).toBe("rgba(50,0,0,0.6)");
  });

  it("interpolates percentages and negatives", () => {
    expect(valueAtHalf("10%", "-10%")).toBe("0%");
    expect(valueAtHalf(-4, 4)).toBe("0");
  });

  it("interpolates calc() operands but not the operators", () => {
    expect(valueAtHalf("calc(10px - 5px)", "calc(20px - 5px)")).toBe("calc(15px - 5px)");
  });

  it("interpolates exponent notation numerically", () => {
    expect(valueAtHalf("1e3px", "2e3px")).toBe("1500px");
  });

  it("does not interpolate digits inside identifiers or custom property names", () => {
    expect(valueAtHalf("var(--gap-1)", "var(--gap-2)")).toBe("var(--gap-1)");
    expect(valueAtHalf("steps(4)", "steps(8)")).toBe("steps(6)");
    expect(valueAtHalf("var(--a)", "var(--b)")).toBe("var(--a)");
  });

  it("switches predictably on unit or structure mismatch", () => {
    expect(valueAtHalf("0", "10px")).toBe("0");
    expect(valueAtHalf("10px", "50%")).toBe("10px");
    expect(valueAtHalf("rgb(0,0,0)", "red")).toBe("rgb(0,0,0)");
    expect(valueAtHalf("translateY(0px)", "translateX(10px)")).toBe("translateY(0px)");
  });

  it("writes the exact from string on the first frame (no reformatting)", () => {
    const element = makeElement();
    animate(element, { prop: ["scale(.5)", "scale(1.5)"] }, { duration: 100 });
    flushFrame(0);
    expect(styleOf(element).get("prop")).toBe("scale(.5)");
  });

  it("skips writes when easing yields a non-finite value", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100, easing: () => Number.NaN });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
  });
});

describe("animate: css property names", () => {
  it("maps camelCase, vendor prefixes and keeps kebab-case and custom properties", () => {
    const element = makeElement();
    animate(
      element,
      {
        backgroundColor: ["red", "blue"],
        "border-top-width": [0, 1],
        WebkitFilter: [0, 1],
        msTransform: [0, 1],
        "--Brand-Size": [0, 1],
      },
      { duration: 100 },
    );
    const names = styleOf(element).setProperty.mock.calls.map(([name]) => name);
    expect(names).toEqual([
      "background-color",
      "border-top-width",
      "-webkit-filter",
      "-ms-transform",
      "--Brand-Size",
    ]);
  });
});

describe("animate: lifecycle", () => {
  it("cancel before the first frame leaves from values and fires nothing", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { duration: 100, onComplete }).cancel();
    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(onComplete).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("cancel after completion is a safe no-op that keeps final values", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    const controls = animate(element, { opacity: [0, 1] }, { duration: 10, onComplete });
    flushFrame(0);
    flushFrame(10);
    controls.cancel();
    controls.cancel();
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("zero duration writes final values on the first frame, once", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { duration: 0, onComplete });
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("zero duration with delay waits for the delay", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 0, delay: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
  });
});

describe("animate: targets", () => {
  it("returns a no-op for an empty NodeList-like match and for only-SVG matches", () => {
    selectorResults[".svg"] = [new FakeSVGElement()];
    const controls = animate(".svg", { opacity: [0, 1] });
    expect(frames.size).toBe(0);
    expect(() => controls.cancel()).not.toThrow();
  });

  it("does not touch browser globals at import time", async () => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.stubGlobal("HTMLElement", undefined);
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("matchMedia", undefined);
    await expect(import("../src/core/animate")).resolves.toBeDefined();
  });

  it("rejects an element when HTMLElement is unavailable instead of crashing", () => {
    vi.stubGlobal("HTMLElement", undefined);
    expect(() => animate(makeElement(), { opacity: [0, 1] })).toThrow(TypeError);
  });
});

describe("animate: multiple elements", () => {
  it("animates every HTMLElement matching a selector with one frame loop", () => {
    const a = makeElement();
    const b = makeElement();
    selectorResults[".card"] = [a, new FakeSVGElement(), b];

    animate(".card", { opacity: [0, 1] }, { duration: 100 });
    expect(frames.size).toBe(1);

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(a).get("opacity")).toBe("0.25");
    expect(styleOf(b).get("opacity")).toBe("0.25");
    expect(styleOf(a).setProperty).toHaveBeenCalledTimes(styleOf(b).setProperty.mock.calls.length);
  });

  it("calls onComplete once for the whole group", () => {
    selectorResults[".card"] = [makeElement(), makeElement()];
    const onComplete = vi.fn();
    animate(".card", { opacity: [0, 1] }, { duration: 10, onComplete });
    flushFrame(0);
    flushFrame(10);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("animate: cancellation", () => {
  it("stops updates and completion for all elements, keeping current values", () => {
    const a = makeElement();
    const b = makeElement();
    selectorResults[".card"] = [a, b];
    const onComplete = vi.fn();
    const controls = animate(".card", { opacity: [0, 1] }, { duration: 100, onComplete });

    flushFrame(0);
    flushFrame(50);
    controls.cancel();
    flushFrame(100);

    expect(styleOf(a).get("opacity")).toBe("0.5");
    expect(styleOf(b).get("opacity")).toBe("0.5");
    expect(onComplete).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});

describe("animate: invalid and missing targets", () => {
  it("throws SyntaxError with the selector for an invalid selector", () => {
    expect(() => animate("!!bad", { opacity: [0, 1] })).toThrow(SyntaxError);
    expect(() => animate("!!bad", { opacity: [0, 1] })).toThrow('Invalid CSS selector "!!bad"');
  });

  it("returns safe no-op controls when nothing matches", () => {
    const onComplete = vi.fn();
    const controls = animate(".missing", { opacity: [0, 1] }, { onComplete });
    expect(frames.size).toBe(0);
    expect(() => controls.cancel()).not.toThrow();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("still validates duration when nothing matches", () => {
    expect(() => animate(".missing", { opacity: [0, 1] }, { duration: -1 })).toThrow(RangeError);
  });

  it("rejects non-element targets", () => {
    expect(() => animate({} as unknown as HTMLElement, { opacity: [0, 1] })).toThrow(TypeError);
    expect(() => animate(null as unknown as HTMLElement, { opacity: [0, 1] })).toThrow(TypeError);
  });

  it("throws when a selector is used without a document", () => {
    vi.stubGlobal("document", undefined);
    expect(() => animate(".card", { opacity: [0, 1] })).toThrow("document is not available");
  });

  it("rejects invalid properties without touching the element", () => {
    const element = makeElement();
    expect(() => animate(element, {})).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0] as never })).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0, Number.NaN] })).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0, ""] })).toThrow(TypeError);
    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
  });

  it("propagates engine RangeError without applying styles", () => {
    const element = makeElement();
    expect(() => animate(element, { opacity: [0, 1] }, { duration: -5 })).toThrow(RangeError);
    expect(() => animate(element, { opacity: [0, 1] }, { delay: Number.NaN })).toThrow(RangeError);
    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});

describe("animate: reduced motion", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("jumps to final values on the next frame, ignoring duration and delay", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(
      element,
      { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
      { duration: 600, delay: 500, easing: () => 0.5, onComplete },
    );

    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
    flushFrame(0);

    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("transform")).toBe("translateY(0px)");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled before it applies", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { onComplete }).cancel();
    flushFrame(0);
    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("animates normally when respectReducedMotion is false", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100, respectReducedMotion: false });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
  });

  it("animates normally when matchMedia is unavailable", () => {
    reducedMotion = false;
    vi.stubGlobal("matchMedia", undefined);
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
  });
});
