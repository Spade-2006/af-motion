import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stagger } from "../src/effects/stagger";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
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

function makeElements(count: number): HTMLElement[] {
  return Array.from({ length: count }, () => new FakeHTMLElement() as unknown as HTMLElement);
}

function opacity(element: HTMLElement): string | undefined {
  return (element.style as unknown as FakeStyle).get("opacity");
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

const fade = { properties: { opacity: [0, 1] }, duration: 100 } as const;

describe("stagger: ordering", () => {
  it("starts each element `stagger` ms after the previous one", () => {
    const [a, b, c] = makeElements(3) as [HTMLElement, HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b, c];
    stagger(".card", { ...fade, stagger: 50 });

    flushFrame(0);
    flushFrame(50);
    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["0.5", "0", "0"]);
    flushFrame(100);
    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["1", "0.5", "0"]);
    flushFrame(150);
    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["1", "1", "0.5"]);
    flushFrame(200);
    expect(opacity(c)).toBe("1");
  });

  it("applies the base delay before the first element", () => {
    const [a, b] = makeElements(2) as [HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b];
    stagger(".card", { ...fade, delay: 100, stagger: 50 });

    flushFrame(0);
    flushFrame(100);
    expect([opacity(a), opacity(b)]).toEqual(["0", "0"]);
    flushFrame(150);
    expect([opacity(a), opacity(b)]).toEqual(["0.5", "0"]);
    flushFrame(200);
    expect([opacity(a), opacity(b)]).toEqual(["1", "0.5"]);
  });

  it("hides every element in its from state immediately", () => {
    const els = makeElements(3);
    selectorResults[".card"] = els;
    stagger(".card", fade);
    expect(els.map(opacity)).toEqual(["0", "0", "0"]);
  });

  it("applies the easing to every element", () => {
    const [a, b] = makeElements(2) as [HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b];
    stagger(".card", { ...fade, stagger: 50, easing: (t) => t * t });
    flushFrame(0);
    flushFrame(50);
    expect(opacity(a)).toBe("0.25");
  });

  it("does not use timers", () => {
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    selectorResults[".card"] = makeElements(3);
    stagger(".card", fade);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });
});

describe("stagger: direction", () => {
  it('"first" is the default and starts at the first element', () => {
    const [a, b] = makeElements(2) as [HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b];
    stagger(".card", { ...fade, stagger: 50 });
    flushFrame(0);
    flushFrame(50);
    expect([opacity(a), opacity(b)]).toEqual(["0.5", "0"]);
  });

  it('"last" starts at the last element', () => {
    const [a, b, c] = makeElements(3) as [HTMLElement, HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b, c];
    stagger(".card", { ...fade, stagger: 50, from: "last" });
    flushFrame(0);
    flushFrame(50);
    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["0", "0", "0.5"]);
    flushFrame(100);
    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["0", "0.5", "1"]);
  });

  it("stagger 0 starts every element together", () => {
    const els = makeElements(3);
    selectorResults[".card"] = els;
    stagger(".card", { ...fade, stagger: 0 });
    flushFrame(0);
    flushFrame(50);
    expect(els.map(opacity)).toEqual(["0.5", "0.5", "0.5"]);
  });
});

describe("stagger: defaults", () => {
  it("uses a 600ms fade-and-rise with a 100ms stagger", () => {
    const [a, b] = makeElements(2) as [HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b];
    stagger(".card");

    expect((a.style as unknown as FakeStyle).get("transform")).toBe("translateY(24px)");
    flushFrame(0);
    flushFrame(300);
    expect(opacity(a)).toBe("0.5");
    expect(opacity(b)).toBe("0.333333");
    flushFrame(700);
    expect(opacity(a)).toBe("1");
    expect((a.style as unknown as FakeStyle).get("transform")).toBe("translateY(0px)");
    expect(opacity(b)).toBe("1");
  });
});

describe("stagger: completion", () => {
  it("fires onComplete once, after the last element finishes", () => {
    const els = makeElements(3);
    selectorResults[".card"] = els;
    const onComplete = vi.fn();
    stagger(".card", { ...fade, stagger: 50, onComplete });

    flushFrame(0);
    flushFrame(150);
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(200);
    expect(onComplete).toHaveBeenCalledTimes(1);
    flushFrame(500);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });
});

describe("stagger: cancellation", () => {
  it("cancels running and not-yet-started elements and suppresses onComplete", () => {
    const [a, b, c] = makeElements(3) as [HTMLElement, HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b, c];
    const onComplete = vi.fn();
    const controls = stagger(".card", { ...fade, stagger: 50, onComplete });

    flushFrame(0);
    flushFrame(75);
    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["0.75", "0.25", "0"]);
    controls.cancel();
    flushFrame(200);
    flushFrame(400);

    expect([opacity(a), opacity(b), opacity(c)]).toEqual(["0.75", "0.25", "0"]);
    expect(onComplete).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("is safe to call before the first frame, repeatedly and after completion", () => {
    selectorResults[".card"] = makeElements(2);
    const onComplete = vi.fn();
    const early = stagger(".card", { ...fade, onComplete });
    early.cancel();
    early.cancel();
    flushFrame(0);
    expect(onComplete).not.toHaveBeenCalled();

    const done = stagger(".card", { ...fade, stagger: 0, onComplete });
    flushFrame(1000);
    flushFrame(1100);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(() => done.cancel()).not.toThrow();
  });
});

describe("stagger: targets", () => {
  it("animates a single HTMLElement", () => {
    const [element] = makeElements(1) as [HTMLElement];
    const onComplete = vi.fn();
    stagger(element, { ...fade, onComplete });
    flushFrame(0);
    flushFrame(50);
    expect(opacity(element)).toBe("0.5");
    flushFrame(100);
    expect(opacity(element)).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("ignores non-HTML matches when counting order", () => {
    const [a, b] = makeElements(2) as [HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, new (class {})(), b];
    stagger(".card", { ...fade, stagger: 50, from: "last" });
    flushFrame(0);
    flushFrame(50);
    expect([opacity(a), opacity(b)]).toEqual(["0", "0.5"]);
  });

  it("returns inert controls when nothing matches", () => {
    const onComplete = vi.fn();
    const controls = stagger(".missing", { onComplete });
    expect(frames.size).toBe(0);
    expect(() => controls.cancel()).not.toThrow();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("stagger: invalid input", () => {
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects stagger %s", (value) => {
    selectorResults[".card"] = makeElements(2);
    expect(() => stagger(".card", { stagger: value })).toThrow(RangeError);
    expect(frames.size).toBe(0);
  });

  it("rejects an invalid from", () => {
    selectorResults[".card"] = makeElements(2);
    expect(() => stagger(".card", { from: "middle" as never })).toThrow(TypeError);
  });

  it("rejects an invalid selector, target and properties", () => {
    expect(() => stagger("!!bad")).toThrow(SyntaxError);
    expect(() => stagger({} as unknown as HTMLElement)).toThrow(TypeError);
    selectorResults[".card"] = makeElements(2);
    expect(() => stagger(".card", { properties: {} })).toThrow(TypeError);
    expect(() => stagger(".card", { properties: { opacity: [0, Number.NaN] } })).toThrow(TypeError);
  });

  it("rejects invalid duration and delay, even when nothing matches", () => {
    selectorResults[".card"] = makeElements(2);
    expect(() => stagger(".card", { duration: -1 })).toThrow(RangeError);
    expect(() => stagger(".card", { delay: Number.NaN })).toThrow(RangeError);
    expect(() => stagger(".missing", { duration: -1 })).toThrow(RangeError);
    expect(() => stagger(".missing", { properties: {} })).toThrow(TypeError);
  });

  it("rejects offsets that overflow without starting anything", () => {
    const els = makeElements(3);
    selectorResults[".card"] = els;
    expect(() => stagger(".card", { delay: Number.MAX_VALUE, stagger: Number.MAX_VALUE })).toThrow(
      RangeError,
    );
    expect(els.map(opacity)).toEqual([undefined, undefined, undefined]);
    expect(frames.size).toBe(0);
  });
});

describe("stagger: reduced motion", () => {
  it("jumps every element to its final state on the next frame and completes once", () => {
    reducedMotion = true;
    const els = makeElements(3);
    selectorResults[".card"] = els;
    const onComplete = vi.fn();
    stagger(".card", { ...fade, stagger: 200, onComplete });

    expect(els.map(opacity)).toEqual([undefined, undefined, undefined]);
    flushFrame(0);
    expect(els.map(opacity)).toEqual(["1", "1", "1"]);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("animates normally when respectReducedMotion is false", () => {
    reducedMotion = true;
    const [a, b] = makeElements(2) as [HTMLElement, HTMLElement];
    selectorResults[".card"] = [a, b];
    stagger(".card", { ...fade, stagger: 50, respectReducedMotion: false });
    flushFrame(0);
    flushFrame(50);
    expect([opacity(a), opacity(b)]).toEqual(["0.5", "0"]);
  });
});
