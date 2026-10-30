import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { textScramble } from "../src/effects/text-scramble";
import type { TextScrambleControls, TextScrambleOptions } from "../src/effects/text-scramble";

class FakeText {
  readonly nodeType = 3;
  constructor(public data: string) {}
}

class FakeHTMLElement {
  readonly nodeType = 1;
  readonly tagName = "DIV";
  childNodes: (FakeText | FakeHTMLElement)[] = [];

  constructor(text: string) {
    if (text !== "") this.childNodes.push(new FakeText(text));
  }

  get textContent(): string {
    return this.childNodes.map((child) =>
      child instanceof FakeText ? child.data : child.textContent,
    ).join("");
  }

  set textContent(value: string | null) {
    this.childNodes = value ? [new FakeText(value)] : [];
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;

function flushFrame(time: number): void {
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(time);
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("textScramble()", () => {
  it("scrambles text and reveals the original over the configured duration", () => {
    const element = new FakeHTMLElement("HELLO");
    const controls = textScramble(asHTMLElement(element), {
      duration: 100,
      characters: "XYZ",
      speed: 20,
    });

    expect(element.textContent).toMatch(/^[XYZ]{5}$/);
    flushFrame(0);
    flushFrame(20);
    expect(element.textContent?.slice(0, 1)).toBe("H");
    expect(element.textContent).toMatch(/^H[XYZ]{4}$/);
    flushFrame(60);
    expect(element.textContent?.slice(0, 3)).toBe("HEL");
    flushFrame(100);
    expect(element.textContent).toBe("HELLO");
    expect(frames.size).toBe(0);
    controls.destroy();
    expect(element.textContent).toBe("HELLO");
  });

  it("supports multiple selector targets and preserves spaces during scrambling", () => {
    const first = new FakeHTMLElement("A B");
    const second = new FakeHTMLElement("C D");
    selectorResults[".title"] = [first, new (class {})(), second];
    const controls = textScramble(".title", { duration: 100, characters: "Q", speed: 10 });

    expect(first.textContent).toBe("Q Q");
    expect(second.textContent).toBe("Q Q");
    flushFrame(0);
    flushFrame(100);
    expect(first.textContent).toBe("A B");
    expect(second.textContent).toBe("C D");
    controls.destroy();
  });

  it("preserves nested markup and original text nodes while scrambling", () => {
    const leadingText = new FakeText("Hello ");
    const emphasized = new FakeHTMLElement("world");
    const emphasizedText = emphasized.childNodes[0]!;
    const trailingText = new FakeText("!");
    const element = new FakeHTMLElement("");
    element.childNodes = [leadingText, emphasized, trailingText];
    const controls = textScramble(asHTMLElement(element), {
      duration: 100,
      characters: "X",
      speed: 10,
    });

    expect(element.childNodes).toEqual([leadingText, emphasized, trailingText]);
    expect(emphasized.childNodes).toEqual([emphasizedText]);
    expect(element.textContent).toBe("XXXXX XXXXXX");
    flushFrame(0);
    flushFrame(100);
    expect(element.textContent).toBe("Hello world!");
    expect(element.childNodes).toEqual([leadingText, emphasized, trailingText]);
    expect(emphasized.childNodes).toEqual([emphasizedText]);
    controls.destroy();
  });

  it("handles supplementary Unicode characters without splitting them", () => {
    const element = new FakeHTMLElement("A😀B");
    const controls = textScramble(asHTMLElement(element), {
      duration: 100,
      characters: "🌀",
      speed: 10,
    });

    expect(Array.from(element.textContent ?? "")).toEqual(["🌀", "🌀", "🌀"]);
    flushFrame(0);
    flushFrame(70);
    expect(Array.from(element.textContent ?? "")).toEqual(["A", "😀", "🌀"]);
    flushFrame(100);
    expect(element.textContent).toBe("A😀B");
    controls.destroy();
  });

  it("shows final text immediately when reduced motion is preferred", () => {
    reducedMotion = true;
    const element = new FakeHTMLElement("Motion");
    const controls = textScramble(asHTMLElement(element));
    expect(element.textContent).toBe("Motion");
    expect(frames.size).toBe(0);
    controls.destroy();
  });

  it("restores all original text and cancels the pending frame on destroy", () => {
    const first = new FakeHTMLElement("First");
    const second = new FakeHTMLElement("Second");
    selectorResults[".title"] = [first, second];
    const controls = textScramble(".title");
    expect(first.textContent).not.toBe("First");
    expect(second.textContent).not.toBe("Second");
    expect(frames.size).toBe(1);

    controls.destroy();
    controls.destroy();
    expect(first.textContent).toBe("First");
    expect(second.textContent).toBe("Second");
    expect(frames.size).toBe(0);
  });

  it("finishes immediately for zero duration and honors a reduced-motion change mid-animation", () => {
    const immediate = new FakeHTMLElement("Done");
    const immediateControls = textScramble(asHTMLElement(immediate), { duration: 0 });
    expect(immediate.textContent).toBe("Done");
    expect(frames.size).toBe(0);
    immediateControls.destroy();

    const active = new FakeHTMLElement("Reduced");
    const controls = textScramble(asHTMLElement(active), { duration: 500 });
    expect(frames.size).toBe(1);
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(active.textContent).toBe("Reduced");
    expect(frames.size).toBe(0);
    expect(motionListeners.size).toBe(0);
    controls.destroy();
  });

  it("validates options and selectors before modifying text", () => {
    const element = new FakeHTMLElement("Original");
    expect(() => textScramble(asHTMLElement(element), { duration: -1 })).toThrow(RangeError);
    expect(() => textScramble(asHTMLElement(element), { duration: Number.NaN })).toThrow(RangeError);
    expect(() => textScramble(asHTMLElement(element), { speed: 0 })).toThrow(RangeError);
    expect(() => textScramble(asHTMLElement(element), { speed: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => textScramble(asHTMLElement(element), { characters: "" })).toThrow(TypeError);
    expect(() => textScramble("!!bad")).toThrow(SyntaxError);
    expect(element.textContent).toBe("Original");
  });

  it("returns inert controls when no selector matches and exports its public types", () => {
    const controls = textScramble(".missing");
    expect(() => controls.destroy()).not.toThrow();
    expectTypeOf<TextScrambleOptions["duration"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<TextScrambleControls["destroy"]>().toBeFunction();
  });
});
