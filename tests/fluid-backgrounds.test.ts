import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  fluidBackground,
  registerPalette,
  removePalette,
} from "../src/index";

class FakeStyle {
  values = new Map<string, string>();
  priorities = new Map<string, string>();
  getPropertyValue(name: string): string { return this.values.get(name) ?? ""; }
  getPropertyPriority(name: string): string { return this.priorities.get(name) ?? ""; }
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
  get firstChild(): FakeNode | null { return this.children[0] ?? null; }
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
  width = 240;
  height = 160;
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  getBoundingClientRect(): DOMRect { return { width: this.width, height: this.height } as DOMRect; }
}

class FakeGradient {
  stops: Array<[number, string]> = [];
  addColorStop(offset: number, color: string): void { this.stops.push([offset, color]); }
}

class FakeContext {
  clearRect = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  bezierCurveTo = vi.fn();
  stroke = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  fillRect = vi.fn();
  setTransform = vi.fn();
  createRadialGradient = vi.fn(() => new FakeGradient());
  createLinearGradient = vi.fn(() => new FakeGradient());
  strokeStyle: string | CanvasGradient | CanvasPattern = "";
  fillStyle: string | CanvasGradient | CanvasPattern = "";
  lineWidth = 1;
  globalAlpha = 1;
}

class FakeCanvas extends FakeHTMLElement {
  width = 0;
  height = 0;
  context = new FakeContext();
  getContext(): CanvasRenderingContext2D { return this.context as unknown as CanvasRenderingContext2D; }
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe = vi.fn();
  disconnect = vi.fn();
  intersect(target: FakeHTMLElement, isIntersecting: boolean): void {
    this.callback(
      [{ target: target as unknown as Element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe = vi.fn();
  disconnect = vi.fn();
  resize(target: FakeHTMLElement, width: number, height: number): void {
    target.width = width;
    target.height = height;
    this.callback(
      [{ target: target as unknown as Element, contentRect: { width, height } as DOMRectReadOnly } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

let reducedMotion = false;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
const documentListeners = new Map<string, Set<EventListener>>();

function makeElement(): FakeHTMLElement { return new FakeHTMLElement(); }
function asHTMLElement(element: FakeHTMLElement): HTMLElement { return element as unknown as HTMLElement; }
function canvasOf(element: FakeHTMLElement): FakeCanvas { return element.firstChild as FakeCanvas; }
function flushFrame(time: number): void {
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(time);
}

beforeEach(() => {
  reducedMotion = false;
  motionListeners = new Set();
  frames = new Map();
  nextFrameId = 1;
  documentListeners.clear();
  FakeIntersectionObserver.instances = [];
  FakeResizeObserver.instances = [];
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.delete(listener),
  }));
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("getComputedStyle", (element: FakeHTMLElement) => ({
    position: element.style.getPropertyValue("position") || "static",
    isolation: element.style.getPropertyValue("isolation") || "auto",
  }));
  vi.stubGlobal("document", {
    hidden: false,
    createElement: (name: string) => {
      if (name === "canvas") return new FakeCanvas();
      throw new Error(`Unexpected element: ${name}`);
    },
    addEventListener: (type: string, listener: EventListener) => {
      const listeners = documentListeners.get(type) ?? new Set<EventListener>();
      listeners.add(listener);
      documentListeners.set(type, listeners);
    },
    removeEventListener: (type: string, listener: EventListener) => documentListeners.get(type)?.delete(listener),
  });
});

afterEach(() => {
  removePalette("fluid-background-test");
  vi.unstubAllGlobals();
});

describe("fluidBackground()", () => {
  it.each([
    ["liquid-blobs", { count: 3, size: 40, blur: 10 }],
    ["fluid-waves", { amplitude: 24, frequency: 3, direction: "vertical", layers: 2 }],
    ["liquid-gradient", { count: 3, scale: 0.4 }],
    ["ink-flow", { count: 3, size: 36, spread: 0.2 }],
    ["metaballs", { count: 4, radius: 32, threshold: 2, movement: 0.5 }],
  ] as const)("renders %s with its configuration", (effect, effectOptions) => {
    const element = makeElement();
    const controls = fluidBackground(asHTMLElement(element), {
      ...effectOptions,
      effect,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.clearRect).toHaveBeenCalled();
    if (effect === "liquid-blobs" || effect === "metaballs") {
      expect(context.createRadialGradient).toHaveBeenCalled();
      expect(context.arc).toHaveBeenCalled();
    }
    if (effect === "fluid-waves") {
      expect(context.closePath).toHaveBeenCalled();
      expect(context.fill).toHaveBeenCalled();
    }
    if (effect === "liquid-gradient") expect(context.fillRect).toHaveBeenCalled();
    if (effect === "ink-flow") expect(context.bezierCurveTo).toHaveBeenCalled();
    controls.destroy();
  });

  it("uses configured colors and intensity", () => {
    const element = makeElement();
    const controls = fluidBackground(asHTMLElement(element), {
      effect: "liquid-blobs",
      colors: ["#abcdef"],
      count: 2,
      intensity: 0.5,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.createRadialGradient).toHaveBeenCalled();
    expect(context.fill).toHaveBeenCalled();
    expect(context.globalAlpha).toBe(1);
    controls.destroy();
  });

  it("supports explicit and active palette colors", () => {
    const element = makeElement();
    registerPalette({
      name: "fluid-background-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const explicit = fluidBackground(asHTMLElement(element), {
      effect: "liquid-blobs",
      palette: "fluid-background-test",
      count: 3,
      speed: 0,
    });
    const explicitGradients = canvasOf(element).context.createRadialGradient.mock.results
      .map((result) => result.value.stops[0]?.[1]);
    expect(explicitGradients).toContain("#112233");
    expect(explicitGradients).toContain("#445566");
    expect(explicitGradients).toContain("#778899");
    explicit.destroy();

    const live = fluidBackground(asHTMLElement(element), {
      effect: "liquid-blobs",
      palette: "active",
      count: 3,
      speed: 0,
    });
    activatePalette("fluid-background-test");
    const liveGradients = canvasOf(element).context.createRadialGradient.mock.results
      .map((result) => result.value.stops[0]?.[1]);
    expect(liveGradients.slice(-6)).toContain("#112233");
    expect(liveGradients.slice(-6)).toContain("#445566");
    expect(liveGradients.slice(-6)).toContain("#778899");
    live.destroy();
  });

  it("handles device-pixel resizing, reduced motion, and hidden-page pausing", () => {
    const element = makeElement();
    const controls = fluidBackground(asHTMLElement(element), { effect: "fluid-waves" });
    const canvas = canvasOf(element);
    expect(canvas.width).toBe(480);
    expect(canvas.height).toBe(320);
    FakeIntersectionObserver.instances[0]!.intersect(element, true);
    expect(frames.size).toBe(1);

    const visibilityHandler = [...(documentListeners.get("visibilitychange") ?? [])][0]!;
    (document as unknown as { hidden: boolean }).hidden = true;
    visibilityHandler(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    (document as unknown as { hidden: boolean }).hidden = false;
    visibilityHandler(new Event("visibilitychange"));
    expect(frames.size).toBe(1);
    FakeResizeObserver.instances[0]!.resize(element, 160, 80);
    expect(canvas.width).toBe(320);
    expect(canvas.height).toBe(160);
    expect(canvas.context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    const pathCount = canvas.context.beginPath.mock.calls.length;
    flushFrame(2000);
    expect(canvas.context.beginPath).toHaveBeenCalledTimes(pathCount);
    controls.destroy();
  });

  it("cleans up canvas, observers, listeners, frames, and original target styles", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto", "important");
    const controls = fluidBackground(asHTMLElement(element), { effect: "metaballs" });
    FakeIntersectionObserver.instances[0]!.intersect(element, true);
    expect(frames.size).toBe(1);
    controls.destroy();
    controls.destroy();
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyPriority("position")).toBe("important");
    expect(element.style.getPropertyValue("isolation")).toBe("auto");
    expect(element.style.getPropertyPriority("isolation")).toBe("important");
    expect(FakeIntersectionObserver.instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(FakeResizeObserver.instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(documentListeners.get("visibilitychange")?.size).toBe(0);
    expect(motionListeners.size).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("validates effect-specific values and unknown palettes before DOM changes", () => {
    const element = makeElement();
    const target = asHTMLElement(element);
    expect(() => fluidBackground(target, { effect: "liquid-blobs", count: 0 })).toThrow(RangeError);
    expect(() => fluidBackground(target, { effect: "fluid-waves", direction: "diagonal" as "horizontal" })).toThrow(TypeError);
    expect(() => fluidBackground(target, { effect: "liquid-gradient", scale: 2 })).toThrow(RangeError);
    expect(() => fluidBackground(target, { effect: "ink-flow", spread: 0 })).toThrow(RangeError);
    expect(() => fluidBackground(target, { effect: "metaballs", threshold: 0.5 })).toThrow(RangeError);
    expect(() => fluidBackground(target, { palette: "not-a-fluid-palette" })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
