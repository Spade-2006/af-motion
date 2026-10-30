import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  geometricBackground,
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

class FakeContext {
  clearRect = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  closePath = vi.fn();
  stroke = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  fillRect = vi.fn();
  setTransform = vi.fn();
  strokeStyle: string | CanvasGradient | CanvasPattern = "";
  fillStyle: string | CanvasGradient | CanvasPattern = "";
  lineWidth = 1;
  globalAlpha = 1;
  shadowColor = "";
  shadowBlur = 0;
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
  removePalette("geometric-background-test");
  vi.unstubAllGlobals();
});

describe("geometricBackground()", () => {
  it("draws square, dot, diamond, and hexagonal grid shapes", () => {
    for (const shape of ["square", "dot", "diamond", "hexagon"] as const) {
      const element = makeElement();
      const controls = geometricBackground(asHTMLElement(element), {
        effect: "grid",
        shape,
        spacing: 40,
        lineWeight: 1.5,
        opacity: 0.4,
        speed: 0,
      });
      const context = canvasOf(element).context;
      if (shape === "dot") {
        expect(context.arc).toHaveBeenCalled();
        expect(context.fill).toHaveBeenCalled();
      } else {
        expect(context.stroke).toHaveBeenCalled();
      }
      if (shape === "diamond" || shape === "hexagon") expect(context.closePath).toHaveBeenCalled();
      controls.destroy();
    }
  });

  it.each([
    ["tech-circuit", { density: 2 }],
    ["polygon-mesh", { spacing: 40, irregularity: 0.5 }],
    ["hexagon-field", { spacing: 32 }],
    ["perspective-floor", { horizon: 0.25, movement: 2 }],
  ] as const)("renders %s with its configuration", (effect, effectOptions) => {
    const element = makeElement();
    const controls = geometricBackground(asHTMLElement(element), {
      ...effectOptions,
      effect,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.stroke).toHaveBeenCalled();
    if (effect === "tech-circuit" || effect === "polygon-mesh") expect(context.arc).toHaveBeenCalled();
    if (effect === "tech-circuit") expect(context.shadowBlur).toBe(0);
    controls.destroy();
  });

  it("applies explicit and active palette colors", () => {
    const element = makeElement();
    registerPalette({
      name: "geometric-background-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const explicit = geometricBackground(asHTMLElement(element), {
      effect: "grid",
      palette: "geometric-background-test",
      speed: 0,
    });
    expect(canvasOf(element).context.strokeStyle).toBe("#112233");
    explicit.destroy();

    const live = geometricBackground(asHTMLElement(element), {
      effect: "grid",
      palette: "active",
      speed: 0,
    });
    activatePalette("geometric-background-test");
    expect(canvasOf(element).context.strokeStyle).toBe("#112233");
    live.destroy();
  });

  it("resizes backing canvases and respects reduced motion and hidden documents", () => {
    const element = makeElement();
    const controls = geometricBackground(asHTMLElement(element), { effect: "tech-circuit" });
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

    FakeResizeObserver.instances[0]!.resize(element, 300, 100);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(200);
    expect(canvas.context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    const strokesBefore = canvas.context.stroke.mock.calls.length;
    flushFrame(1000);
    expect(canvas.context.stroke).toHaveBeenCalledTimes(strokesBefore);
    controls.destroy();
  });

  it("restores target styles and releases canvas, observers, listeners, and frames", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto", "important");
    const controls = geometricBackground(asHTMLElement(element), { effect: "hexagon-field", animate: true });
    expect(frames.size).toBe(0);
    expect(element.children).toHaveLength(1);
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

  it("rejects invalid options and unknown palettes before changing the target", () => {
    const element = makeElement();
    const target = asHTMLElement(element);
    expect(() => geometricBackground(target, { effect: "grid", spacing: 0 })).toThrow(RangeError);
    expect(() => geometricBackground(target, { effect: "polygon-mesh", connectionRange: 0.5 })).toThrow(RangeError);
    expect(() => geometricBackground(target, { effect: "perspective-floor", horizon: 1 })).toThrow(RangeError);
    expect(() => geometricBackground(target, { effect: "tech-circuit", density: 4 })).toThrow(RangeError);
    expect(() => geometricBackground(target, { palette: "missing-geometric-palette" })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
