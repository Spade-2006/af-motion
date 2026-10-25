import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { typewriter } from "../src/effects/typewriter";
import type { TypewriterControls, TypewriterOptions } from "../src/effects/typewriter";

class FakeHTMLElement {
  textContent: string | null;
  constructor(text: string) {
    this.textContent = text;
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("typewriter()", () => {
  it("types characters, pauses, deletes, then types the next phrase", () => {
    const element = new FakeHTMLElement("Original");
    const controls = typewriter(asHTMLElement(element), {
      phrases: ["AB", "CD"],
      typeSpeed: 10,
      deleteSpeed: 5,
      pause: 20,
      cursor: "|",
    });

    expect(element.textContent).toBe("|");
    vi.advanceTimersByTime(10);
    expect(element.textContent).toBe("A|");
    vi.advanceTimersByTime(10);
    expect(element.textContent).toBe("AB|");
    vi.advanceTimersByTime(30);
    expect(element.textContent).toBe("AB|");
    vi.advanceTimersByTime(5);
    expect(element.textContent).toBe("A|");
    vi.advanceTimersByTime(5);
    expect(element.textContent).toBe("|");
    vi.advanceTimersByTime(10);
    expect(element.textContent).toBe("C|");
    vi.advanceTimersByTime(10);
    expect(element.textContent).toBe("CD|");
    controls.destroy();
  });

  it("supports non-looping completion and preserves the configured cursor", () => {
    const element = new FakeHTMLElement("Before");
    const controls = typewriter(asHTMLElement(element), {
      phrases: ["End"],
      typeSpeed: 10,
      loop: false,
      cursor: "_",
    });
    vi.advanceTimersByTime(40);
    expect(element.textContent).toBe("End_");
    expect(vi.getTimerCount()).toBe(0);
    controls.destroy();
    expect(element.textContent).toBe("Before");
  });

  it("uses Unicode code points when typing and deleting", () => {
    const element = new FakeHTMLElement("Old");
    typewriter(asHTMLElement(element), {
      phrases: ["A😀B"],
      typeSpeed: 10,
      deleteSpeed: 5,
      pause: 10,
      loop: false,
    });
    vi.advanceTimersByTime(10);
    expect(element.textContent).toBe("A|");
    vi.advanceTimersByTime(20);
    expect(element.textContent).toBe("A😀B|");
    expect(Array.from(element.textContent ?? "")).toEqual(["A", "😀", "B", "|"]);
  });

  it("updates every matching target with the same phrase", () => {
    const first = new FakeHTMLElement("First");
    const second = new FakeHTMLElement("Second");
    selectorResults[".title"] = [first, new (class {})(), second];
    const controls = typewriter(".title", {
      phrases: ["Hi"],
      typeSpeed: 10,
      loop: false,
    });

    vi.advanceTimersByTime(20);
    expect(first.textContent).toBe("Hi|");
    expect(second.textContent).toBe("Hi|");
    controls.destroy();
    expect(first.textContent).toBe("First");
    expect(second.textContent).toBe("Second");
  });

  it("shows the final phrase immediately for reduced motion and handles changes mid-run", () => {
    reducedMotion = true;
    const immediate = new FakeHTMLElement("Old");
    const immediateControls = typewriter(asHTMLElement(immediate), { phrases: ["One", "Last"] });
    expect(immediate.textContent).toBe("Last|");
    expect(vi.getTimerCount()).toBe(0);
    immediateControls.destroy();
    expect(immediate.textContent).toBe("Old");

    reducedMotion = false;
    const active = new FakeHTMLElement("Start");
    const controls = typewriter(asHTMLElement(active), {
      phrases: ["First", "Final"],
      typeSpeed: 10,
    });
    vi.advanceTimersByTime(20);
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(active.textContent).toBe("Final|");
    expect(vi.getTimerCount()).toBe(0);
    expect(motionListeners.size).toBe(0);
    controls.destroy();
    expect(active.textContent).toBe("Start");
  });

  it("restores original text and clears pending timers on destroy", () => {
    const element = new FakeHTMLElement("Original text");
    const controls = typewriter(asHTMLElement(element), { phrases: ["Animated text"] });
    expect(element.textContent).toBe("|");
    expect(vi.getTimerCount()).toBe(1);
    controls.destroy();
    controls.destroy();
    expect(element.textContent).toBe("Original text");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("validates phrases, timing, cursor and selector before changing text", () => {
    const element = new FakeHTMLElement("Untouched");
    expect(() => typewriter(asHTMLElement(element), { phrases: [] })).toThrow(TypeError);
    expect(() => typewriter(asHTMLElement(element), { phrases: [""] })).toThrow(TypeError);
    expect(() => typewriter(asHTMLElement(element), { phrases: ["A"], typeSpeed: 0 })).toThrow(RangeError);
    expect(() => typewriter(asHTMLElement(element), { phrases: ["A"], deleteSpeed: -1 })).toThrow(RangeError);
    expect(() => typewriter(asHTMLElement(element), { phrases: ["A"], pause: -1 })).toThrow(RangeError);
    expect(() => typewriter(asHTMLElement(element), { phrases: ["A"], cursor: 1 as unknown as string })).toThrow(TypeError);
    expect(() => typewriter("!!bad", { phrases: ["A"] })).toThrow(SyntaxError);
    expect(element.textContent).toBe("Untouched");
  });

  it("returns inert controls for empty matches and exposes the public types", () => {
    const controls = typewriter(".missing", { phrases: ["A"] });
    expect(() => controls.destroy()).not.toThrow();
    expectTypeOf<TypewriterOptions["phrases"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<TypewriterControls["destroy"]>().toBeFunction();
  });
});
