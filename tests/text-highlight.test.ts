import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { textHighlight } from "../src/effects/text-highlight";
import type { TextHighlightControls, TextHighlightOptions } from "../src/effects/text-highlight";

class FakeStyle {
  values = new Map<string, string>();
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
  }
}

class FakeNode {
  parentNode: FakeNode | null = null;
  parentElement: FakeNode | null = null;
  childNodes: FakeNode[] = [];
  attributes = new Map<string, string>();
  style = new FakeStyle();
  textContent: string | null = null;

  get firstChild(): FakeNode | null {
    return this.childNodes[0] ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  appendChild<T extends FakeNode>(node: T): T {
    return this.insertBefore(node, null);
  }
  insertBefore<T extends FakeNode>(node: T, before: FakeNode | null): T {
    if (node.parentNode) node.parentNode.removeChild(node);
    const index = before === null ? -1 : this.childNodes.indexOf(before);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    node.parentElement = this;
    return node;
  }
  removeChild<T extends FakeNode>(node: T): T {
    this.childNodes.splice(this.childNodes.indexOf(node), 1);
    node.parentNode = null;
    node.parentElement = null;
    return node;
  }
  getBoundingClientRect(): DOMRect {
    return {} as DOMRect;
  }
}

class FakeHTMLElement extends FakeNode {}
class FakeSpanElement extends FakeNode {}
class FakeTextNode extends FakeNode {
  constructor(public value: string) {
    super();
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
  intersect(element: FakeHTMLElement, isIntersecting: boolean): void {
    this.callback(
      [{ target: element as unknown as Element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function makeElement(text = "Highlight me"): FakeHTMLElement {
  const element = new FakeHTMLElement();
  element.appendChild(new FakeTextNode(text));
  return element;
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function wrapperOf(element: FakeHTMLElement): FakeSpanElement {
  return element.firstChild as FakeSpanElement;
}

function flushFrame(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(16);
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
  frames = new Map();
  nextFrameId = 1;
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
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
  vi.stubGlobal("document", {
    createElement: (name: string) => {
      if (name === "span") return new FakeSpanElement();
      throw new Error(`Unexpected element: ${name}`);
    },
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("textHighlight()", () => {
  it.each([
    ["marker", "0% 0.75em"],
    ["underline", "0% 0.12em"],
    ["box", "0% 100%"],
  ] as const)("creates the %s highlight without replacing text", (style, initialSize) => {
    const element = makeElement("Keep <em>this</em>");
    const originalTextNode = element.firstChild;
    const controls = textHighlight(asHTMLElement(element), {
      style,
      color: "#a3e635",
      duration: 700,
    });
    const wrapper = wrapperOf(element);
    expect(wrapper.childNodes[0]).toBe(originalTextNode);
    expect(wrapper.style.getPropertyValue("background-image")).toBe(
      "linear-gradient(#a3e635, #a3e635)",
    );
    expect(wrapper.style.getPropertyValue("background-size")).toBe(initialSize);
    expect(wrapper.style.getPropertyValue("transition")).toBe("background-size 700ms ease-out");
    expect(wrapper.attributes.get("data-af-motion-highlight")).toBe("");

    flushFrame();
    expect(wrapper.style.getPropertyValue("background-size")).toBe(
      style === "box" ? "100% 100%" : style === "underline" ? "100% 0.12em" : "100% 0.75em",
    );
    controls.destroy();
    expect(element.childNodes).toEqual([originalTextNode]);
  });

  it("waits for each scroll target to intersect and animates each only once", () => {
    const first = makeElement("One");
    const second = makeElement("Two");
    selectorResults[".headline"] = [first, new (class {})(), second];
    const controls = textHighlight(".headline", { trigger: "scroll", duration: 100 });
    const observer = FakeIntersectionObserver.instances[0]!;
    const firstWrapper = wrapperOf(first);
    const secondWrapper = wrapperOf(second);

    expect(observer.observed.size).toBe(2);
    expect(firstWrapper.style.getPropertyValue("background-size")).toBe("0% 0.75em");
    observer.intersect(first, true);
    expect(observer.unobserve).toHaveBeenCalledWith(first);
    expect(frames.size).toBe(1);
    flushFrame();
    expect(firstWrapper.style.getPropertyValue("background-size")).toBe("100% 0.75em");
    expect(secondWrapper.style.getPropertyValue("background-size")).toBe("0% 0.75em");

    observer.intersect(first, true);
    expect(frames.size).toBe(0);
    observer.intersect(second, true);
    flushFrame();
    expect(secondWrapper.style.getPropertyValue("background-size")).toBe("100% 0.75em");
    controls.destroy();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(first.childNodes[0]).toBeInstanceOf(FakeTextNode);
    expect(second.childNodes[0]).toBeInstanceOf(FakeTextNode);
  });

  it("shows completed highlights immediately for reduced motion", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = textHighlight(asHTMLElement(element), { trigger: "scroll", style: "underline" });
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(wrapperOf(element).style.getPropertyValue("background-size")).toBe("100% 0.12em");
    expect(frames.size).toBe(0);
    controls.destroy();
  });

  it("supports multiple immediate targets and restores their original node identity", () => {
    const first = makeElement("Alpha");
    const second = makeElement("Beta");
    const firstNode = first.firstChild;
    const secondNode = second.firstChild;
    selectorResults[".multi"] = [first, second];
    const controls = textHighlight(".multi", { trigger: "immediate", duration: 0 });
    expect(wrapperOf(first).style.getPropertyValue("background-size")).toBe("100% 0.75em");
    expect(wrapperOf(second).style.getPropertyValue("background-size")).toBe("100% 0.75em");
    controls.destroy();
    expect(first.childNodes).toEqual([firstNode]);
    expect(second.childNodes).toEqual([secondNode]);
  });

  it("disconnects observers and cancels pending drawing frames on destroy", () => {
    const element = makeElement();
    const child = element.firstChild;
    const controls = textHighlight(asHTMLElement(element), { trigger: "scroll" });
    const observer = FakeIntersectionObserver.instances[0]!;
    observer.intersect(element, true);
    expect(frames.size).toBe(1);
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(element.childNodes).toEqual([child]);
  });

  it("validates options and selectors before changing the DOM", () => {
    const element = makeElement();
    const child = element.firstChild;
    expect(() => textHighlight(asHTMLElement(element), { style: "circle" as "marker" })).toThrow(TypeError);
    expect(() => textHighlight(asHTMLElement(element), { color: "" })).toThrow(TypeError);
    expect(() => textHighlight(asHTMLElement(element), { duration: -1 })).toThrow(RangeError);
    expect(() => textHighlight(asHTMLElement(element), { trigger: "hover" as "immediate" })).toThrow(TypeError);
    expect(() => textHighlight("!!bad")).toThrow(SyntaxError);
    expect(element.childNodes).toEqual([child]);
  });

  it("returns inert controls for empty selector matches and exposes public types", () => {
    const controls = textHighlight(".missing");
    expect(() => controls.destroy()).not.toThrow();
    expectTypeOf<TextHighlightOptions["style"]>().toEqualTypeOf<"marker" | "underline" | "box" | undefined>();
    expectTypeOf<TextHighlightControls["destroy"]>().toBeFunction();
  });
});
