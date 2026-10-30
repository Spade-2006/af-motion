import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reveal } from "../src/effects/reveal";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  removeProperty(name: string): void {
    this.values.delete(name);
  }
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

class FakeObserver {
  static instances: FakeObserver[] = [];
  observed = new Set<Element>();
  unobserve = vi.fn((element: Element) => {
    this.observed.delete(element);
  });
  disconnect = vi.fn(() => {
    this.observed.clear();
  });
  constructor(
    public callback: (entries: Partial<IntersectionObserverEntry>[]) => void,
    public options: IntersectionObserverInit,
  ) {
    FakeObserver.instances.push(this);
  }
  observe = (element: Element): void => {
    this.observed.add(element);
  };
}

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

function observer(): FakeObserver {
  return FakeObserver.instances[0] as FakeObserver;
}

function intersect(element: HTMLElement, isIntersecting: boolean): void {
  observer().callback([{ target: element, isIntersecting }]);
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  selectorResults = {};
  reducedMotion = false;
  FakeObserver.instances = [];

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("IntersectionObserver", FakeObserver);
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

describe("reveal: setup", () => {
  it("observes the element with default options and applies the hidden state", () => {
    const element = makeElement();
    reveal(element);

    expect(observer().observed.has(element)).toBe(true);
    expect(observer().options).toEqual({ threshold: 0.15, rootMargin: "0px" });
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(styleOf(element).get("transform")).toBe("translateY(24px)");
    expect(frames.size).toBe(0);
  });

  it("passes threshold and rootMargin to IntersectionObserver", () => {
    reveal(makeElement(), { threshold: [0, 0.5], rootMargin: "10px 0px" });
    expect(observer().options).toEqual({ threshold: [0, 0.5], rootMargin: "10px 0px" });
  });

  it("observes every HTMLElement matching a selector", () => {
    const a = makeElement();
    const b = makeElement();
    selectorResults[".card"] = [a, new (class {})(), b];
    reveal(".card");
    expect([...observer().observed]).toEqual([a, b]);
    expect(FakeObserver.instances).toHaveLength(1);
  });

  it("returns inert controls and creates no observer when nothing matches", () => {
    const controls = reveal(".missing");
    expect(FakeObserver.instances).toHaveLength(0);
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("reveal: validation", () => {
  it("throws a clear error when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    expect(() => reveal(makeElement())).toThrow(/requires IntersectionObserver/);
  });

  it("throws synchronously for invalid input without creating an observer", () => {
    const element = makeElement();
    expect(() => reveal("!!bad")).toThrow(SyntaxError);
    expect(() => reveal(element, { duration: -1 })).toThrow(RangeError);
    expect(() => reveal(element, { delay: Number.NaN })).toThrow(RangeError);
    expect(() => reveal(element, { properties: {} })).toThrow(TypeError);
    expect(() => reveal({} as unknown as HTMLElement)).toThrow(TypeError);
    expect(FakeObserver.instances).toHaveLength(0);
    expect(frames.size).toBe(0);
  });
});

describe("reveal: animation", () => {
  it("animates on intersection using duration, delay and easing", () => {
    const element = makeElement();
    reveal(element, {
      properties: { opacity: [0, 1] },
      duration: 100,
      delay: 100,
      easing: (t) => t * t,
    });

    intersect(element, true);
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0.25");
    flushFrame(300);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("uses the fade-and-rise default and ends on the final state", () => {
    const element = makeElement();
    reveal(element);
    intersect(element, true);
    flushFrame(0);
    flushFrame(600);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("transform")).toBe("translateY(0px)");
  });

  it("ignores non-intersecting entries and entries before intersection", () => {
    const element = makeElement();
    reveal(element);
    intersect(element, false);
    expect(frames.size).toBe(0);
    expect(styleOf(element).get("opacity")).toBe("0");
  });

  it("animates elements independently", () => {
    const a = makeElement();
    const b = makeElement();
    selectorResults[".card"] = [a, b];
    const controls = reveal(".card", { properties: { opacity: [0, 1] }, duration: 100 });

    intersect(a, true);
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(a).get("opacity")).toBe("0.5");
    expect(styleOf(b).get("opacity")).toBe("0");
    controls.destroy();
  });

  it("jumps to the final state with reduced motion, leaving content visible beforehand", () => {
    reducedMotion = true;
    const element = makeElement();
    reveal(element);
    expect(styleOf(element).get("opacity")).toBeUndefined();

    intersect(element, true);
    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("transform")).toBe("translateY(0px)");
  });
});

describe("reveal: once", () => {
  it("stops observing an element after it is revealed and never replays", () => {
    const element = makeElement();
    reveal(element, { properties: { opacity: [0, 1] }, duration: 100 });

    intersect(element, true);
    expect(observer().unobserve).toHaveBeenCalledWith(element);
    flushFrame(0);
    flushFrame(100);

    intersect(element, false);
    intersect(element, true);
    expect(frames.size).toBe(0);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("does not restart on repeated intersecting entries while visible (once: false)", () => {
    const element = makeElement();
    const controls = reveal(element, { once: false, properties: { opacity: [0, 1] }, duration: 100 });
    intersect(element, true);
    flushFrame(0);
    flushFrame(50);
    intersect(element, true);
    flushFrame(75);
    expect(styleOf(element).get("opacity")).toBe("0.75");
    expect(observer().unobserve).not.toHaveBeenCalled();
    controls.destroy();
  });

  it("replays after leave and re-enter, cancelling the running animation first", () => {
    const element = makeElement();
    reveal(element, { once: false, properties: { opacity: [0, 1] }, duration: 100 });

    intersect(element, true);
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");

    intersect(element, false);
    intersect(element, true);
    expect(frames.size).toBe(1);
    expect(styleOf(element).get("opacity")).toBe("0");

    flushFrame(1000);
    flushFrame(1050);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(1100);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(frames.size).toBe(0);
  });
});

describe("reveal: destroy", () => {
  it("disconnects the observer and cancels running animations", () => {
    const element = makeElement();
    reveal(element, { properties: { opacity: [0, 1] }, duration: 100 }).destroy();
    expect(observer().disconnect).toHaveBeenCalledTimes(1);

    const other = makeElement();
    FakeObserver.instances = [];
    const controls = reveal(other, { properties: { opacity: [0, 1] }, duration: 100 });
    intersect(other, true);
    flushFrame(0);
    flushFrame(50);
    controls.destroy();

    flushFrame(100);
    expect(styleOf(other).get("opacity")).toBe("0.5");
    expect(frames.size).toBe(0);
  });

  it("is idempotent and ignores late observer callbacks", () => {
    const element = makeElement();
    const controls = reveal(element);
    controls.destroy();
    controls.destroy();
    expect(observer().disconnect).toHaveBeenCalledTimes(1);

    intersect(element, true);
    expect(frames.size).toBe(0);
    expect(styleOf(element).get("opacity")).toBeUndefined();
  });

  it("restores inline styles of elements that were never revealed, leaving revealed ones alone", () => {
    const pending = makeElement();
    const shown = makeElement();
    styleOf(pending).setProperty("opacity", "0.9");
    selectorResults[".card"] = [pending, shown];
    const controls = reveal(".card", {
      properties: { opacity: [0, 1], transform: ["translateY(24px)", "none"] },
      duration: 0,
    });
    expect(styleOf(pending).get("opacity")).toBe("0");

    intersect(shown, true);
    flushFrame(0);
    flushFrame(1);
    controls.destroy();

    expect(styleOf(pending).get("opacity")).toBe("0.9");
    expect(styleOf(pending).get("transform")).toBeUndefined();
    expect(styleOf(shown).get("opacity")).toBe("1");
  });
});

describe("reveal: failure leaves no hidden elements", () => {
  it("rejects an out-of-range threshold before touching styles", () => {
    const element = makeElement();
    expect(() => reveal(element, { threshold: 2 })).toThrow(RangeError);
    expect(() => reveal(element, { threshold: [0.5, Number.NaN] })).toThrow(RangeError);
    expect(styleOf(element).get("opacity")).toBeUndefined();
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it("restores styles when the observer constructor throws", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.9");
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor() {
          throw new SyntaxError("bad rootMargin");
        }
      },
    );
    expect(() => reveal(element, { rootMargin: "nope" })).toThrow(SyntaxError);
    expect(styleOf(element).get("opacity")).toBe("0.9");
    expect(styleOf(element).get("transform")).toBeUndefined();
  });
});
