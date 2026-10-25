import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noiseBackground } from "../src/backgrounds/noise";

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
  get firstChild(): FakeNode | null {
    return this.children[0] ?? null;
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
  width = 8;
  height = 6;
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  getBoundingClientRect(): DOMRect {
    return { width: this.width, height: this.height } as DOMRect;
  }
}

class FakeCanvas extends FakeHTMLElement {
  width = 0;
  height = 0;
  context = {
    createImageData: vi.fn((width: number, height: number) => ({
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4),
    })),
    putImageData: vi.fn(),
  };
  getContext(): CanvasRenderingContext2D {
    return this.context as unknown as CanvasRenderingContext2D;
  }
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed = new Set<Element>();
  constructor(public callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe = (element: Element): void => {
    this.observed.add(element);
  };
  disconnect = vi.fn(() => this.observed.clear());
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
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("devicePixelRatio", 1);
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

describe("noiseBackground()", () => {
  it("creates a pointer-transparent canvas and renders procedural noise", () => {
    const element = makeElement();
    element.insertBefore(new FakeHTMLElement(), null);
    const content = element.firstChild;
    const controls = noiseBackground(asHTMLElement(element), {
      intensity: 0.15,
      scale: 2,
      speed: 0,
      opacity: 0.25,
    });

    const canvas = canvasOf(element);
    expect(canvas.attributes.get("aria-hidden")).toBe("true");
    expect(canvas.style.getPropertyValue("position")).toBe("absolute");
    expect(canvas.style.getPropertyValue("z-index")).toBe("-1");
    expect(canvas.style.getPropertyValue("pointer-events")).toBe("none");
    expect(canvas.style.getPropertyValue("opacity")).toBe("0.25");
    expect(canvas.width).toBe(8);
    expect(canvas.height).toBe(6);
    expect(canvas.context.createImageData).toHaveBeenCalledWith(8, 6);
    expect(canvas.context.putImageData).toHaveBeenCalledTimes(1);
    const image = canvas.context.putImageData.mock.calls[0]?.[0];
    expect(image?.data.some((value) => value !== 0)).toBe(true);
    expect(element.children[1]).toBe(content);
    expect(element.style.getPropertyValue("position")).toBe("relative");
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");
    expect(frames.size).toBe(0);

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(element.style.getPropertyValue("isolation")).toBe("");
    expect(FakeResizeObserver.instances[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("animates noise with a single RAF loop and redraws resized canvases", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, second];
    const controls = noiseBackground(".hero", { speed: 2, scale: 1 });
    expect(frames.size).toBe(1);

    flushFrame(0);
    expect(frames.size).toBe(1);
    const firstCanvas = canvasOf(first);
    const initialDrawCount = firstCanvas.context.putImageData.mock.calls.length;
    flushFrame(500);
    expect(firstCanvas.context.putImageData).toHaveBeenCalledTimes(initialDrawCount + 1);
    expect(frames.size).toBe(1);

    FakeResizeObserver.instances[0]!.resize(first, 20, 10);
    expect(firstCanvas.width).toBe(20);
    expect(firstCanvas.height).toBe(10);
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("renders static noise with reduced motion and resumes only when preference allows", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = noiseBackground(asHTMLElement(element), { speed: 5 });
    const canvas = canvasOf(element);
    const initialDrawCount = canvas.context.putImageData.mock.calls.length;
    expect(frames.size).toBe(0);

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(frames.size).toBe(1);
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    expect(canvas.context.putImageData.mock.calls.length).toBeGreaterThan(initialDrawCount);
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("handles overlapping instances and restores original styles after the last destroy", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    const first = noiseBackground(asHTMLElement(element));
    const second = noiseBackground(asHTMLElement(element));
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

  it("returns inert controls for empty matches and validates options before changing targets", () => {
    const missing = noiseBackground(".missing");
    expect(() => missing.destroy()).not.toThrow();
    expect(() => noiseBackground("!!bad")).toThrow(SyntaxError);

    const element = makeElement();
    expect(() => noiseBackground(asHTMLElement(element), { intensity: -0.1 })).toThrow(RangeError);
    expect(() => noiseBackground(asHTMLElement(element), { intensity: 1.1 })).toThrow(RangeError);
    expect(() => noiseBackground(asHTMLElement(element), { scale: 0 })).toThrow(RangeError);
    expect(() => noiseBackground(asHTMLElement(element), { scale: Number.NaN })).toThrow(RangeError);
    expect(() => noiseBackground(asHTMLElement(element), { speed: -1 })).toThrow(RangeError);
    expect(() => noiseBackground(asHTMLElement(element), { opacity: 1.1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
