import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parallax } from "../src/effects/parallax";

class FakeStyle {
  values = new Map<string, string>();
  get transform(): string {
    return this.values.get("transform") ?? "";
  }
  setProperty = vi.fn((name: string, value: string) => {
    this.values.set(name, value);
  });
  removeProperty = vi.fn((name: string) => {
    this.values.delete(name);
  });
}

// Rect reflects the applied translate, like a real browser, so rest-position measurement is exercised.
class FakeHTMLElement {
  style = new FakeStyle();
  constructor(
    public pageLeft: number,
    public pageTop: number,
    public width = 100,
    public height = 200,
  ) {}
  getBoundingClientRect = vi.fn(() => {
    const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(this.style.transform);
    const dx = match ? Number(match[1]) : 0;
    const dy = match ? Number(match[2]) : 0;
    return {
      left: this.pageLeft - fakeWindow.scrollX + dx,
      top: this.pageTop - fakeWindow.scrollY + dy,
      width: this.width,
      height: this.height,
    };
  });
}

interface FakeWindow {
  scrollX: number;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
  listeners: Map<string, Set<() => void>>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

let fakeWindow: FakeWindow;
let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let computedTransform: string;
let changeListeners: Set<() => void>;
let cancelSpy: ReturnType<typeof vi.fn>;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(0);
}

function scrollTo(x: number, y: number): void {
  fakeWindow.scrollX = x;
  fakeWindow.scrollY = y;
  for (const listener of [...(fakeWindow.listeners.get("scroll") ?? [])]) listener();
}

function resize(width: number, height: number): void {
  fakeWindow.innerWidth = width;
  fakeWindow.innerHeight = height;
  for (const listener of [...(fakeWindow.listeners.get("resize") ?? [])]) listener();
}

function asHTML(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function transformOf(element: FakeHTMLElement): string | undefined {
  return element.style.values.get("transform");
}

// Viewport 1000x800 => centers (500, 400). Default element: center at page (150, 1100).
function makeElement(pageLeft = 100, pageTop = 1000): FakeHTMLElement {
  return new FakeHTMLElement(pageLeft, pageTop);
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  selectorResults = {};
  reducedMotion = false;
  computedTransform = "none";
  changeListeners = new Set();
  cancelSpy = vi.fn((id: number) => {
    frames.delete(id);
  });

  const listeners = new Map<string, Set<() => void>>();
  fakeWindow = {
    scrollX: 0,
    scrollY: 0,
    innerWidth: 1000,
    innerHeight: 800,
    listeners,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      listeners.get(type)?.delete(listener);
    }),
  };

  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", cancelSpy);
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
    addEventListener: (_type: string, listener: () => void) => {
      changeListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      changeListeners.delete(listener);
    },
  }));
  vi.stubGlobal("getComputedStyle", () => ({ transform: computedTransform }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parallax: offsets", () => {
  it("applies the initial offset immediately, clamped to maxOffset", () => {
    const element = makeElement();
    parallax(asHTML(element));
    // distance = 1100 - 0 - 400 = 700; raw = -210 -> clamped to -100.
    expect(transformOf(element)).toBe("translate(0px, -100px)");
  });

  it("is zero when the element is centered in the viewport and never writes then", () => {
    const element = makeElement();
    fakeWindow.scrollY = 700;
    parallax(asHTML(element));
    expect(transformOf(element)).toBeUndefined();
    expect(element.style.setProperty).not.toHaveBeenCalled();
  });

  it.each([
    [500, "translate(0px, -60px)"],
    [600, "translate(0px, -30px)"],
    [800, "translate(0px, 30px)"],
    [900, "translate(0px, 60px)"],
  ])("scrollY %s", (y, expected) => {
    const element = makeElement();
    fakeWindow.scrollY = 700;
    parallax(asHTML(element), { speed: 0.3, maxOffset: 1000 });
    scrollTo(0, y);
    flush();
    expect(transformOf(element)).toBe(expected);
  });

  it("honors speed, including negative and zero", () => {
    const fast = makeElement();
    const reversed = makeElement();
    const still = makeElement();
    fakeWindow.scrollY = 500;
    parallax(asHTML(fast), { speed: 0.5, maxOffset: 1000 });
    parallax(asHTML(reversed), { speed: -0.5, maxOffset: 1000 });
    parallax(asHTML(still), { speed: 0 });
    expect(transformOf(fast)).toBe("translate(0px, -100px)");
    expect(transformOf(reversed)).toBe("translate(0px, 100px)");
    expect(transformOf(still)).toBeUndefined();
  });

  it("uses the default speed of 0.3", () => {
    const element = makeElement();
    fakeWindow.scrollY = 500;
    parallax(asHTML(element), { maxOffset: 1000 });
    expect(transformOf(element)).toBe("translate(0px, -60px)");
  });

  it("applies easing to the normalized offset and keeps the sign", () => {
    const element = makeElement();
    fakeWindow.scrollY = 700;
    parallax(asHTML(element), { speed: 0.5, maxOffset: 100, easing: (t) => t * t });
    scrollTo(0, 500); // raw -100 => t 1 => 100*1
    flush();
    expect(transformOf(element)).toBe("translate(0px, -100px)");
    scrollTo(0, 800); // raw +50 => t 0.5 => 0.25*100
    flush();
    expect(transformOf(element)).toBe("translate(0px, 25px)");
  });

  it("maxOffset 0 never moves anything", () => {
    const element = makeElement();
    parallax(asHTML(element), { maxOffset: 0 });
    scrollTo(0, 300);
    flush();
    expect(transformOf(element)).toBeUndefined();
  });

  it("ignores non-finite easing results", () => {
    const element = makeElement();
    fakeWindow.scrollY = 700;
    parallax(asHTML(element), { easing: () => Number.NaN });
    scrollTo(0, 100);
    flush();
    expect(transformOf(element)).toBeUndefined();
  });
});

describe("parallax: clamping", () => {
  it("clamps in both directions", () => {
    const element = makeElement();
    parallax(asHTML(element), { speed: 1, maxOffset: 50 });
    expect(transformOf(element)).toBe("translate(0px, -50px)");
    scrollTo(0, 5000);
    flush();
    expect(transformOf(element)).toBe("translate(0px, 50px)");
  });
});

describe("parallax: axes", () => {
  it("translates only along x for axis 'x', using horizontal scroll and viewport width", () => {
    const element = makeElement(1000, 0);
    fakeWindow.scrollX = 100;
    parallax(asHTML(element), { axis: "x", speed: 0.5, maxOffset: 1000 });
    // center x = 1050; distance = 1050 - 100 - 500 = 450; raw = -225.
    expect(transformOf(element)).toBe("translate(-225px, 0px)");
    scrollTo(0, 5000);
    flush();
    expect(transformOf(element)).toBe("translate(-275px, 0px)");
  });

  it("ignores vertical scroll for axis 'x'", () => {
    const element = makeElement(1000, 0);
    parallax(asHTML(element), { axis: "x", speed: 0.5, maxOffset: 1000 });
    const before = transformOf(element);
    scrollTo(0, 3000);
    flush();
    expect(transformOf(element)).toBe(before);
  });
});

describe("parallax: scheduling and layout reads", () => {
  it("shares one passive scroll listener and one pending frame across all elements", () => {
    const a = makeElement();
    const b = makeElement(100, 2000);
    selectorResults[".layer"] = [a, new (class {})(), b];
    parallax(".layer");

    const scrollCalls = fakeWindow.addEventListener.mock.calls.filter(([type]) => type === "scroll");
    expect(scrollCalls).toHaveLength(1);
    expect(scrollCalls[0]?.[2]).toEqual({ passive: true });

    scrollTo(0, 100);
    scrollTo(0, 200);
    scrollTo(0, 300);
    expect(frames.size).toBe(1);
    flush();
    expect(frames.size).toBe(0);
  });

  it("goes idle between scrolls", () => {
    parallax(asHTML(makeElement()));
    expect(frames.size).toBe(0);
  });

  it("reads layout only at start and on resize, not on scroll", () => {
    const element = makeElement();
    parallax(asHTML(element));
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1);
    for (let y = 0; y < 700; y += 100) {
      scrollTo(0, y);
      flush();
    }
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1);

    resize(1000, 600);
    flush();
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(2);
  });

  it("skips style writes when the rounded offset is unchanged", () => {
    const element = makeElement();
    parallax(asHTML(element));
    const writes = element.style.setProperty.mock.calls.length;
    scrollTo(0, 0);
    flush();
    scrollTo(0, 0);
    flush();
    expect(element.style.setProperty).toHaveBeenCalledTimes(writes);
  });

  it("measures the resting position even when a translate is already applied", () => {
    const element = makeElement();
    parallax(asHTML(element), { speed: 0.3, maxOffset: 1000 });
    expect(transformOf(element)).toBe("translate(0px, -210px)");
    resize(1000, 800);
    flush();
    expect(transformOf(element)).toBe("translate(0px, -210px)");
  });

  it("recomputes with the new viewport size after resize", () => {
    const element = makeElement();
    fakeWindow.scrollY = 700;
    parallax(asHTML(element), { maxOffset: 1000 });
    expect(transformOf(element)).toBeUndefined();
    resize(1000, 400); // viewport center 200 => distance 1100-700-200 = 200 => -60
    flush();
    expect(transformOf(element)).toBe("translate(0px, -60px)");
  });
});

describe("parallax: style preservation", () => {
  it("composes with the inline transform and restores it exactly on destroy", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(5deg)");
    const controls = parallax(asHTML(element));
    expect(transformOf(element)).toBe("rotate(5deg) translate(0px, -100px)");
    controls.destroy();
    expect(transformOf(element)).toBe("rotate(5deg)");
  });

  it("falls back to the computed transform and removes the property on destroy", () => {
    computedTransform = "matrix(1, 0, 0, 1, 0, 0)";
    const element = makeElement();
    const controls = parallax(asHTML(element));
    expect(transformOf(element)).toBe("matrix(1, 0, 0, 1, 0, 0) translate(0px, -100px)");
    controls.destroy();
    expect(element.style.values.has("transform")).toBe(false);
  });

  it("writes only transform and leaves other styles alone", () => {
    const element = makeElement();
    element.style.values.set("color", "red");
    element.style.values.set("transform-origin", "left top");
    const controls = parallax(asHTML(element));
    scrollTo(0, 300);
    flush();
    controls.destroy();
    const names = [
      ...element.style.setProperty.mock.calls.map(([name]) => name),
      ...element.style.removeProperty.mock.calls.map(([name]) => name),
    ];
    expect(new Set(names)).toEqual(new Set(["transform"]));
    expect(element.style.values.get("color")).toBe("red");
    expect(element.style.values.get("transform-origin")).toBe("left top");
  });

  it("does not touch elements that never moved", () => {
    const element = makeElement();
    fakeWindow.scrollY = 700;
    const controls = parallax(asHTML(element));
    controls.destroy();
    expect(element.style.setProperty).not.toHaveBeenCalled();
    expect(element.style.removeProperty).not.toHaveBeenCalled();
  });

  it("keeps the original transform stable across measure cycles", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(5deg)");
    const controls = parallax(asHTML(element));
    resize(1000, 800);
    flush();
    resize(1000, 800);
    flush();
    controls.destroy();
    expect(transformOf(element)).toBe("rotate(5deg)");
  });
});

describe("parallax: multiple elements", () => {
  it("computes each element's offset from its own position", () => {
    const near = makeElement(100, 1000);
    const far = makeElement(100, 2000);
    selectorResults[".layer"] = [near, far];
    fakeWindow.scrollY = 700;
    parallax(".layer", { maxOffset: 1000 });
    expect(transformOf(near)).toBeUndefined();
    // far center 2100; distance = 2100 - 700 - 400 = 1000; raw = -300.
    expect(transformOf(far)).toBe("translate(0px, -300px)");
  });

  it("returns inert controls and attaches nothing when nothing matches", () => {
    const controls = parallax(".missing");
    expect(fakeWindow.addEventListener).not.toHaveBeenCalled();
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("parallax: destroy", () => {
  it("removes listeners, cancels the pending frame and restores every element", () => {
    const a = makeElement();
    const b = makeElement(100, 2000);
    a.style.setProperty("transform", "rotate(5deg)");
    selectorResults[".layer"] = [a, b];
    const controls = parallax(".layer");
    scrollTo(0, 100);
    expect(frames.size).toBe(1);

    controls.destroy();
    expect(frames.size).toBe(0);
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(fakeWindow.listeners.get("scroll")?.size).toBe(0);
    expect(fakeWindow.listeners.get("resize")?.size).toBe(0);
    expect(changeListeners.size).toBe(0);
    expect(transformOf(a)).toBe("rotate(5deg)");
    expect(b.style.values.has("transform")).toBe(false);

    scrollTo(0, 300);
    resize(500, 500);
    expect(frames.size).toBe(0);
  });

  it("does not run a frame that was already queued when destroyed", () => {
    const element = makeElement();
    const controls = parallax(asHTML(element));
    scrollTo(0, 300);
    const queued = [...frames.values()];
    controls.destroy();
    for (const callback of queued) callback(0);
    expect(element.style.values.has("transform")).toBe(false);
  });

  it("is idempotent", () => {
    const controls = parallax(asHTML(makeElement()));
    controls.destroy();
    expect(() => controls.destroy()).not.toThrow();
    expect(fakeWindow.removeEventListener).toHaveBeenCalledTimes(2);
  });
});

describe("parallax: reduced motion", () => {
  it("never moves anything when reduced motion is requested", () => {
    reducedMotion = true;
    const element = makeElement();
    parallax(asHTML(element));
    scrollTo(0, 300);
    flush();
    expect(transformOf(element)).toBeUndefined();
    expect(element.getBoundingClientRect).not.toHaveBeenCalled();
  });

  it("restores original transforms when the preference turns on, and resumes when it turns off", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(5deg)");
    parallax(asHTML(element));
    expect(transformOf(element)).toBe("rotate(5deg) translate(0px, -100px)");

    reducedMotion = true;
    for (const listener of changeListeners) listener();
    expect(transformOf(element)).toBe("rotate(5deg)");

    scrollTo(0, 500);
    flush();
    expect(transformOf(element)).toBe("rotate(5deg)");

    reducedMotion = false;
    for (const listener of changeListeners) listener();
    expect(transformOf(element)).toBe("rotate(5deg) translate(0px, -60px)");
  });

  it("restores on the next scroll even if no change event fires", () => {
    const element = makeElement();
    parallax(asHTML(element));
    reducedMotion = true;
    scrollTo(0, 50);
    flush();
    expect(element.style.values.has("transform")).toBe(false);
  });

  it("works when matchMedia is unavailable or has no addEventListener", () => {
    vi.stubGlobal("matchMedia", undefined);
    const a = makeElement();
    parallax(asHTML(a));
    expect(transformOf(a)).toBe("translate(0px, -100px)");

    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const b = makeElement();
    const controls = parallax(asHTML(b));
    expect(transformOf(b)).toBe("translate(0px, -100px)");
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("parallax: invalid input and environment", () => {
  const element = (): HTMLElement => asHTML(makeElement());

  it.each([Number.NaN, Number.POSITIVE_INFINITY, "1" as never])("rejects invalid speed (%s)", (value) => {
    expect(() => parallax(element(), { speed: value })).toThrow(RangeError);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid maxOffset (%s)", (value) => {
    expect(() => parallax(element(), { maxOffset: value })).toThrow(RangeError);
  });

  it("rejects an invalid axis and easing", () => {
    expect(() => parallax(element(), { axis: "z" as never })).toThrow(TypeError);
    expect(() => parallax(element(), { easing: "ease" as never })).toThrow(TypeError);
  });

  it("rejects invalid selectors and targets", () => {
    expect(() => parallax("!!bad")).toThrow(SyntaxError);
    expect(() => parallax({} as unknown as HTMLElement)).toThrow(TypeError);
  });

  it("validates options even when nothing matches", () => {
    expect(() => parallax(".missing", { maxOffset: -1 })).toThrow(RangeError);
  });

  it("attaches nothing when validation fails", () => {
    expect(() => parallax(element(), { speed: Number.NaN })).toThrow(RangeError);
    expect(fakeWindow.addEventListener).not.toHaveBeenCalled();
  });

  it("throws a clear error without window or requestAnimationFrame", () => {
    vi.stubGlobal("window", undefined);
    expect(() => parallax(element())).toThrow(/requires window and requestAnimationFrame/);
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("requestAnimationFrame", undefined);
    expect(() => parallax(element())).toThrow(/requires window and requestAnimationFrame/);
  });
});
