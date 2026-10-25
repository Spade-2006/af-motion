import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { textReveal } from "../src/effects/text-reveal";
import type { TextRevealControls, TextRevealOptions } from "../src/effects/text-reveal";
import { easeOutCubic } from "../src/easing/easings";

class FakeStyle {
  values = new Map<string, string>();
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
}

class FakeNode {
  parentNode: FakeNode | null = null;
  childNodes: FakeNode[] = [];
  nodeType: number;
  constructor(nodeType: number) {
    this.nodeType = nodeType;
  }
  get firstChild(): FakeNode | null {
    return this.childNodes[0] ?? null;
  }
  appendChild<T extends FakeNode>(node: T): T {
    return this.insertBefore(node, null);
  }
  insertBefore<T extends FakeNode>(node: T, before: FakeNode | null): T {
    if (node.nodeType === 11) {
      for (const child of [...node.childNodes]) this.insertBefore(child, before);
      return node;
    }
    if (node.parentNode) node.parentNode.removeChild(node);
    const index = before === null ? -1 : this.childNodes.indexOf(before);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    return node;
  }
  removeChild<T extends FakeNode>(node: T): T {
    this.childNodes.splice(this.childNodes.indexOf(node), 1);
    node.parentNode = null;
    return node;
  }
}

class FakeFragment extends FakeNode {
  constructor() {
    super(11);
  }
}

class FakeText extends FakeNode {
  constructor(public data: string) {
    super(3);
  }
  get textContent(): string {
    return this.data;
  }
  set textContent(value: string | null) {
    this.data = value ?? "";
  }
}

class FakeHTMLElement extends FakeNode {
  className = "";
  style = new FakeStyle();
  tagName = "SPAN";
  constructor() {
    super(1);
  }
  get classList(): { contains(name: string): boolean } {
    return { contains: (name) => this.className.split(/\s+/u).includes(name) };
  }
  setAttribute(): void {}
  getBoundingClientRect(): DOMRect {
    return {} as DOMRect;
  }
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  disconnect = vi.fn(() => this.observed.clear());
  unobserve = vi.fn((element: Element) => this.observed.delete(element));
  constructor(public callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe = (element: Element): void => {
    this.observed.add(element);
  };
  intersect(element: FakeHTMLElement, isIntersecting = true): void {
    this.callback(
      [{ target: element as unknown as Element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let preferenceListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;

function makeElement(text: string): FakeHTMLElement {
  const element = new FakeHTMLElement();
  element.appendChild(new FakeText(text));
  return element;
}

function asTarget(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function unitsOf(element: FakeHTMLElement): FakeHTMLElement[] {
  const found: FakeHTMLElement[] = [];
  const visit = (node: FakeNode): void => {
    for (const child of node.childNodes) {
      if (child instanceof FakeHTMLElement && child.className.includes("af-text-reveal-")) found.push(child);
      visit(child);
    }
  };
  visit(element);
  return found;
}

function textOf(node: FakeNode): string {
  if (node instanceof FakeText) return node.data;
  return node.childNodes.map(textOf).join("");
}

function flushFrames(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(16);
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  preferenceListeners = new Set();
  frames = new Map();
  nextFrame = 1;
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("Node", { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_FRAGMENT_NODE: 11 });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.delete(listener);
    },
  }));
  vi.stubGlobal("document", {
    createElement: () => new FakeHTMLElement(),
    createTextNode: (data: string) => new FakeText(data),
    createDocumentFragment: () => new FakeFragment(),
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("textReveal()", () => {
  it("reveals words and characters with configured timing and easing", () => {
    const words = makeElement("Reveal each word");
    const wordControls = textReveal(asTarget(words), {
      by: "words",
      duration: 800,
      stagger: 80,
      easing: easeOutCubic,
      direction: "up",
    });
    const wordUnits = unitsOf(words);
    expect(wordUnits.map((unit) => unit.style.getPropertyValue("opacity"))).toEqual(["0", "0", "0"]);
    expect(wordUnits[0]?.style.getPropertyValue("transform")).toBe("translateY(1em)");
    flushFrames();
    expect(wordUnits[0]?.style.getPropertyValue("opacity")).toBe("1");
    expect(wordUnits[1]?.style.getPropertyValue("transition")?.includes("800ms linear(")).toBe(true);
    expect(wordUnits[1]?.style.getPropertyValue("transition")?.includes("80ms")).toBe(true);
    wordControls.destroy();
    expect(words.childNodes).toHaveLength(1);
    expect(textOf(words)).toBe("Reveal each word");

    const chars = makeElement("Go");
    const charControls = textReveal(asTarget(chars), { by: "characters" });
    expect(unitsOf(chars)).toHaveLength(2);
    charControls.destroy();
  });

  it.each([
    ["up", "translateY(1em)"],
    ["down", "translateY(-1em)"],
    ["left", "translateX(1em)"],
    ["right", "translateX(-1em)"],
    ["none", "none"],
  ] as const)("supports the %s direction", (direction, transform) => {
    const element = makeElement("Direction");
    const controls = textReveal(asTarget(element), { direction });
    expect(unitsOf(element)[0]?.style.getPropertyValue("transform")).toBe(transform);
    controls.destroy();
  });

  it("waits for each target to intersect and reveals each only once", () => {
    const first = makeElement("First target");
    const second = makeElement("Second target");
    selectorResults[".headline"] = [first, {}, second];
    const controls = textReveal(".headline", { trigger: "scroll", stagger: 0 });
    const observer = FakeIntersectionObserver.instances[0]!;
    expect(observer.observed.size).toBe(2);
    expect(unitsOf(first)[0]?.style.getPropertyValue("opacity")).toBe("0");
    observer.intersect(first);
    expect(observer.unobserve).toHaveBeenCalledWith(first);
    expect(frames.size).toBe(1);
    flushFrames();
    expect(unitsOf(first)[0]?.style.getPropertyValue("opacity")).toBe("1");
    expect(unitsOf(second)[0]?.style.getPropertyValue("opacity")).toBe("0");
    observer.intersect(first);
    expect(frames.size).toBe(0);
    observer.intersect(second);
    flushFrames();
    controls.destroy();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(textOf(first)).toBe("First target");
    expect(textOf(second)).toBe("Second target");
  });

  it("shows all units immediately when reduced motion is preferred or becomes active", () => {
    reducedMotion = true;
    const reducedElement = makeElement("No motion");
    const reducedControls = textReveal(asTarget(reducedElement), { trigger: "scroll" });
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(frames.size).toBe(0);
    expect(unitsOf(reducedElement).every((unit) => unit.style.getPropertyValue("opacity") === "1")).toBe(true);
    reducedControls.destroy();

    reducedMotion = false;
    const changingElement = makeElement("Preference change");
    const changingControls = textReveal(asTarget(changingElement));
    expect(frames.size).toBe(1);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    expect(unitsOf(changingElement).every((unit) => unit.style.getPropertyValue("opacity") === "1")).toBe(true);
    changingControls.destroy();
  });

  it("supports multiple elements, cancels pending starts, and restores original nodes", () => {
    const first = makeElement("One");
    const second = makeElement("Two");
    const originalFirst = first.firstChild;
    selectorResults[".multi"] = [first, second];
    const controls = textReveal(".multi");
    expect(frames.size).toBe(2);
    controls.destroy();
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(first.childNodes).toEqual([originalFirst]);
    expect(textOf(second)).toBe("Two");
  });

  it("validates values before changing the target and exposes the public types", () => {
    const element = makeElement("Still intact");
    const original = element.firstChild;
    expect(() => textReveal(asTarget(element), { duration: -1 })).toThrow(RangeError);
    expect(() => textReveal(asTarget(element), { stagger: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => textReveal(asTarget(element), { direction: "diagonal" as "up" })).toThrow(TypeError);
    expect(() => textReveal(asTarget(element), { trigger: "hover" as "immediate" })).toThrow(TypeError);
    expect(() => textReveal(asTarget(element), { easing: "" })).toThrow(TypeError);
    expect(() => textReveal(asTarget(element), { easing: () => Number.NaN })).toThrow(TypeError);
    expect(() => textReveal("!!bad")).toThrow(SyntaxError);
    expect(element.childNodes).toEqual([original]);
    expectTypeOf<TextRevealOptions["by"]>().toEqualTypeOf<"characters" | "words" | undefined>();
    expectTypeOf<TextRevealControls["destroy"]>().toBeFunction();
  });
});
