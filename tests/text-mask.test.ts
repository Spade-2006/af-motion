import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { textMask } from "../src/effects/text-mask";
import type { TextMaskControls, TextMaskOptions } from "../src/effects/text-mask";
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
}

class FakeHTMLElement extends FakeNode {
  style = new FakeStyle();
  attributes = new Map<string, string>();
  constructor() {
    super(1);
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
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

function makeElement(...children: FakeNode[]): FakeHTMLElement {
  const element = new FakeHTMLElement();
  for (const child of children) element.appendChild(child);
  return element;
}

function asTarget(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
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
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("textMask()", () => {
  it.each([
    ["up", "inset(100% 0 0 0)"],
    ["down", "inset(0 0 100% 0)"],
    ["left", "inset(0 0 0 100%)"],
    ["right", "inset(0 100% 0 0)"],
  ] as const)("uses the %s clipping direction and restores nested content", (direction, initialClip) => {
    const before = new FakeText("Before ");
    const emphasized = makeElement(new FakeText("marked"));
    const after = new FakeText(" after");
    const element = makeElement(before, emphasized, after);
    const originalChildren = [...element.childNodes];
    const controls = textMask(asTarget(element), { direction, color: "#a3e635" });
    const wrapper = element.firstChild as FakeHTMLElement;

    expect(wrapper.attributes.get("data-af-motion-mask")).toBe("");
    expect(wrapper.style.getPropertyValue("clip-path")).toBe(initialClip);
    expect(wrapper.style.getPropertyValue("color")).toBe("#a3e635");
    expect(wrapper.childNodes).toEqual(originalChildren);
    expect(textOf(element)).toBe("Before marked after");

    flushFrames();
    expect(wrapper.style.getPropertyValue("clip-path")).toBe("inset(0)");
    controls.destroy();
    controls.destroy();
    expect(element.childNodes).toEqual(originalChildren);
    expect(emphasized.parentNode).toBe(element);
  });

  it("applies configured duration and custom easing", () => {
    const element = makeElement(new FakeText("Timed"));
    const controls = textMask(asTarget(element), {
      duration: 420,
      easing: easeOutCubic,
    });
    const wrapper = element.firstChild as FakeHTMLElement;

    expect(wrapper.style.getPropertyValue("transition").includes("clip-path 420ms linear(")).toBe(true);
    expect(frames.size).toBe(1);
    flushFrames();
    expect(wrapper.style.getPropertyValue("transition").includes("clip-path 420ms linear(")).toBe(true);
    expect(wrapper.style.getPropertyValue("clip-path")).toBe("inset(0)");
    controls.destroy();
  });

  it("starts scroll targets once when they intersect", () => {
    const first = makeElement(new FakeText("First"));
    const second = makeElement(new FakeText("Second"));
    selectorResults[".masked"] = [first, {}, second];
    const controls = textMask(".masked", { trigger: "scroll" });
    const observer = FakeIntersectionObserver.instances[0]!;
    const firstWrapper = first.firstChild as FakeHTMLElement;
    const secondWrapper = second.firstChild as FakeHTMLElement;

    expect(observer.observed.size).toBe(2);
    expect(frames.size).toBe(0);
    observer.intersect(first);
    expect(observer.unobserve).toHaveBeenCalledWith(first);
    expect(frames.size).toBe(1);
    observer.intersect(first);
    expect(frames.size).toBe(1);
    flushFrames();
    expect(firstWrapper.style.getPropertyValue("clip-path")).toBe("inset(0)");
    expect(secondWrapper.style.getPropertyValue("clip-path")).toBe("inset(100% 0 0 0)");

    observer.intersect(second);
    flushFrames();
    controls.destroy();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(textOf(first)).toBe("First");
    expect(textOf(second)).toBe("Second");
  });

  it("shows the completed mask immediately for reduced motion and motion changes", () => {
    reducedMotion = true;
    const reducedElement = makeElement(new FakeText("Still"));
    const reducedControls = textMask(asTarget(reducedElement), { trigger: "scroll" });
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(frames.size).toBe(0);
    expect((reducedElement.firstChild as FakeHTMLElement).style.getPropertyValue("clip-path")).toBe("inset(0)");
    reducedControls.destroy();

    reducedMotion = false;
    const changingElement = makeElement(new FakeText("Preference"));
    const changingControls = textMask(asTarget(changingElement));
    expect(frames.size).toBe(1);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    expect((changingElement.firstChild as FakeHTMLElement).style.getPropertyValue("clip-path")).toBe("inset(0)");
    changingControls.destroy();
  });

  it("supports multiple targets and cancels pending frames on destroy", () => {
    const first = makeElement(new FakeText("One"));
    const second = makeElement(new FakeText("Two"));
    const originalFirst = first.firstChild;
    selectorResults[".multiple"] = [first, second];
    const controls = textMask(".multiple");
    expect(frames.size).toBe(2);
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(first.childNodes).toEqual([originalFirst]);
    expect(textOf(second)).toBe("Two");
  });

  it("validates options and selectors before changing the DOM", () => {
    const element = makeElement(new FakeText("Unchanged"));
    const original = element.firstChild;
    expect(() => textMask(asTarget(element), { duration: -1 })).toThrow(RangeError);
    expect(() => textMask(asTarget(element), { duration: Number.NaN })).toThrow(RangeError);
    expect(() => textMask(asTarget(element), { direction: "diagonal" as "up" })).toThrow(TypeError);
    expect(() => textMask(asTarget(element), { trigger: "hover" as "immediate" })).toThrow(TypeError);
    expect(() => textMask(asTarget(element), { color: "" })).toThrow(TypeError);
    expect(() => textMask(asTarget(element), { easing: "" })).toThrow(TypeError);
    expect(() => textMask(asTarget(element), { easing: () => Number.NaN })).toThrow(TypeError);
    expect(() => textMask("!!bad")).toThrow(SyntaxError);
    expect(element.childNodes).toEqual([original]);
    expectTypeOf<TextMaskOptions["direction"]>().toEqualTypeOf<"up" | "down" | "left" | "right" | undefined>();
    expectTypeOf<TextMaskControls["destroy"]>().toBeFunction();
  });
});
