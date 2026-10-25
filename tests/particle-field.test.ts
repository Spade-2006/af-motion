import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { particleField } from "../src/backgrounds/particle-field";

class FakeStyle {
  values = new Map<string, string>();
  priorities = new Map<string, string>();

  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  getPropertyPriority(name: string): string {
    return this.priorities.get(name) ?? "";
  }
  setProperty(name: string, value: string, priority = ""): void {
    this.values.set(name, value);
    if (priority) this.priorities.set(name, priority);
    else this.priorities.delete(name);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
    this.priorities.delete(name);
  }
}

class FakeNode {
  parentElement: FakeNode | null = null;
  children: FakeNode[] = [];
  textContent = "";

  get firstChild(): FakeNode | null {
    return this.children[0] ?? null;
  }
  appendChild<T extends FakeNode>(node: T): T {
    return this.insertBefore(node, null);
  }
  insertBefore<T extends FakeNode>(node: T, before: FakeNode | null): T {
    node.parentElement = this;
    const index = before === null ? -1 : this.children.indexOf(before);
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    return node;
  }
  removeChild<T extends FakeNode>(node: T): T {
    this.children.splice(this.children.indexOf(node), 1);
    node.parentElement = null;
    return node;
  }
}

class FakeHTMLElement extends FakeNode {
  style = new FakeStyle();
  attributes = new Map<string, string>();
  width = 640;
  height = 360;
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  getBoundingClientRect(): DOMRect {
    return { width: this.width, height: this.height } as DOMRect;
  }
}

class FakeContext {
  clearRect = vi.fn();
  beginPath = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  setTransform = vi.fn();
  fillStyle: string | CanvasGradient | CanvasPattern = "";
  strokeStyle: string | CanvasGradient | CanvasPattern = "";
  globalAlpha = 1;
  lineWidth = 1;
}

class FakeCanvas extends FakeHTMLElement {
  width = 0;
  height = 0;
  context = new FakeContext();
  getContext(): CanvasRenderingContext2D {
    return this.context as unknown as CanvasRenderingContext2D;
  }
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;

  constructor(public callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe = (element: Element): void => {
    this.observed.add(element);
  };
  disconnect = vi.fn(() => {
    this.disconnected = true;
    this.observed.clear();
  });
  intersect(target: FakeHTMLElement, isIntersecting: boolean): void {
    this.callback(
      [{ target: target as unknown as Element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed = new Set<Element>();
  disconnected = false;

  constructor(public callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe = (element: Element): void => {
    this.observed.add(element);
  };
  disconnect = vi.fn(() => {
    this.disconnected = true;
    this.observed.clear();
  });
  resize(target: FakeHTMLElement, width: number, height: number): void {
    target.width = width;
    target.height = height;
    this.callback(
      [{
        target: target as unknown as Element,
        contentRect: { width, height } as DOMRectReadOnly,
      } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function canvasOf(element: FakeHTMLElement): FakeCanvas {
  return element.firstChild as FakeCanvas;
}

function flushFrame(time: number): void {
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(time);
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
  frames = new Map();
  nextFrameId = 1;
  FakeIntersectionObserver.instances = [];
  FakeResizeObserver.instances = [];

  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.delete(listener);
    },
  }));
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("getComputedStyle", (element: FakeHTMLElement) => ({
    position: element.style.getPropertyValue("position") || "static",
    isolation: element.style.getPropertyValue("isolation") || "auto",
  }));
  vi.stubGlobal("document", {
    createElement: (name: string) => {
      if (name === "canvas") return new FakeCanvas();
      throw new Error(`Unexpected element: ${name}`);
    },
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("particleField()", () => {
  it("creates a correctly styled canvas and draws the requested particles", () => {
    const element = makeElement();
    element.width = 100;
    element.height = 100;
    element.appendChild(new FakeHTMLElement());
    const content = element.firstChild;
    const controls = particleField(asHTMLElement(element), {
      count: 4,
      colors: ["#7c3aed", "#06b6d4"],
      size: 3,
      speed: 1,
      connections: true,
    });

    const canvas = canvasOf(element);
    expect(canvas.attributes.get("aria-hidden")).toBe("true");
    expect(canvas.style.getPropertyValue("position")).toBe("absolute");
    expect(canvas.style.getPropertyValue("inset")).toBe("0");
    expect(canvas.style.getPropertyValue("pointer-events")).toBe("none");
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);
    expect(canvas.context.arc).toHaveBeenCalledTimes(4);
    expect(canvas.context.stroke).toHaveBeenCalled();
    expect(element.children[1]).toBe(content);
    expect(element.style.getPropertyValue("position")).toBe("relative");
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(element.style.getPropertyValue("isolation")).toBe("");
    expect(FakeIntersectionObserver.instances[0]?.disconnected).toBe(true);
    expect(FakeResizeObserver.instances[0]?.disconnected).toBe(true);
  });

  it("renders multiple targets with one shared RAF loop and pauses when all leave view", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, second];
    const controls = particleField(".hero", { count: 2 });
    const observer = FakeIntersectionObserver.instances[0]!;

    observer.intersect(first, true);
    observer.intersect(second, true);
    expect(frames.size).toBe(1);
    flushFrame(10);
    expect(frames.size).toBe(1);

    observer.intersect(first, false);
    expect(frames.size).toBe(1);
    observer.intersect(second, false);
    expect(frames.size).toBe(0);

    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("resizes the backing canvas and uses static rendering for reduced motion", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = particleField(asHTMLElement(element), { count: 3 });
    const canvas = canvasOf(element);
    FakeIntersectionObserver.instances[0]!.intersect(element, true);
    expect(canvas.context.arc).toHaveBeenCalledTimes(3);
    expect(frames.size).toBe(0);

    FakeResizeObserver.instances[0]!.resize(element, 320, 180);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(360);
    expect(canvas.context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(frames.size).toBe(1);
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("cleans up overlapping instances without restoring shared target styles early", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    const first = particleField(asHTMLElement(element), { count: 1, speed: 0 });
    const second = particleField(asHTMLElement(element), { count: 1, speed: 0 });
    expect(element.children).toHaveLength(2);

    first.destroy();
    first.destroy();
    expect(element.children).toHaveLength(1);
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");
    second.destroy();
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyPriority("position")).toBe("important");
    expect(element.style.getPropertyValue("isolation")).toBe("");
  });

  it("ignores missing targets and rejects invalid selectors or options before DOM changes", () => {
    expect(() => particleField("!!bad")).toThrow(SyntaxError);
    const missing = particleField(".missing");
    expect(() => missing.destroy()).not.toThrow();

    const element = makeElement();
    expect(() => particleField(asHTMLElement(element), { count: 0 })).toThrow(RangeError);
    expect(() => particleField(asHTMLElement(element), { count: 1.5 })).toThrow(RangeError);
    expect(() => particleField(asHTMLElement(element), { count: 1001 })).toThrow(RangeError);
    expect(() => particleField(asHTMLElement(element), { colors: [""] })).toThrow(TypeError);
    expect(() => particleField(asHTMLElement(element), { size: 0 })).toThrow(RangeError);
    expect(() => particleField(asHTMLElement(element), { speed: -1 })).toThrow(RangeError);
    expect(() => particleField(asHTMLElement(element), { connections: "yes" as unknown as boolean })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
