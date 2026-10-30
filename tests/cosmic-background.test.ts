import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  cosmicBackground,
  registerPalette,
  removePalette,
} from "../src/index";

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
  width = 100;
  height = 100;

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  getBoundingClientRect(): DOMRect {
    return { width: this.width, height: this.height } as DOMRect;
  }
}

class FakeGradient {
  stops: Array<[number, string]> = [];
  addColorStop(offset: number, color: string): void {
    this.stops.push([offset, color]);
  }
}

class FakeContext {
  clearRect = vi.fn();
  beginPath = vi.fn();
  arc = vi.fn();
  fillRect = vi.fn();
  fill = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  setTransform = vi.fn();
  createRadialGradient = vi.fn(() => new FakeGradient());
  createLinearGradient = vi.fn(() => new FakeGradient());
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
  removePalette("cosmic-background-test");
  vi.unstubAllGlobals();
});

describe("cosmicBackground()", () => {
  it.each(["starfield", "nebula", "shooting-stars", "galaxy"] as const)(
    "renders the %s treatment",
    (effect) => {
      const element = makeElement();
      const controls = cosmicBackground(asHTMLElement(element), {
        effect,
        density: 4,
        speed: 0,
      });
      const context = canvasOf(element).context;

      expect(context.arc).toHaveBeenCalledTimes(4);
      if (effect === "nebula") {
        expect(context.createRadialGradient).toHaveBeenCalled();
        expect(context.fillRect).toHaveBeenCalled();
      }
      controls.destroy();
    },
  );

  it("uses density, depth, intensity, and colors in its star rendering", () => {
    const element = makeElement();
    const controls = cosmicBackground(asHTMLElement(element), {
      density: 3,
      depth: 0.25,
      intensity: 0.5,
      colors: ["#abcdef"],
      speed: 0,
    });
    const context = canvasOf(element).context;

    expect(context.arc).toHaveBeenCalledTimes(3);
    expect(context.fillStyle).toBe("#abcdef");
    const renderedRadii = context.arc.mock.calls.map((call) => call[2] as number);
    expect(new Set(renderedRadii).size).toBeGreaterThan(1);
    expect(context.globalAlpha).toBe(1);
    controls.destroy();
  });

  it("schedules configured shooting-star trails", () => {
    const element = makeElement();
    const controls = cosmicBackground(asHTMLElement(element), {
      effect: "shooting-stars",
      density: 1,
      speed: 1,
      shootingFrequency: 60,
      trailLength: 80,
    });
    FakeIntersectionObserver.instances[0]!.intersect(element, true);

    flushFrame(0);
    flushFrame(1000);
    expect(canvasOf(element).context.stroke).toHaveBeenCalled();
    expect(canvasOf(element).context.lineTo).toHaveBeenCalled();
    controls.destroy();
  });

  it("uses explicit and active registered palettes", () => {
    const element = makeElement();
    registerPalette({
      name: "cosmic-background-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const explicit = cosmicBackground(asHTMLElement(element), {
      palette: "cosmic-background-test",
      density: 3,
      speed: 0,
    });
    expect(canvasOf(element).context.fillStyle).toBe("#778899");
    explicit.destroy();

    const live = cosmicBackground(asHTMLElement(element), {
      palette: "active",
      density: 3,
      speed: 0,
    });
    activatePalette("cosmic-background-test");
    expect(canvasOf(element).context.fillStyle).toBe("#778899");
    live.destroy();
  });

  it("respects reduced motion, pauses when hidden, and resizes for device pixels", () => {
    const element = makeElement();
    const controls = cosmicBackground(asHTMLElement(element), { density: 2 });
    const canvas = canvasOf(element);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);

    FakeIntersectionObserver.instances[0]!.intersect(element, true);
    expect(frames.size).toBe(1);
    const visibilityHandler = [...(documentListeners.get("visibilitychange") ?? [])][0]!;
    (document as unknown as { hidden: boolean }).hidden = true;
    visibilityHandler(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    (document as unknown as { hidden: boolean }).hidden = false;
    visibilityHandler(new Event("visibilitychange"));
    expect(frames.size).toBe(1);

    FakeResizeObserver.instances[0]!.resize(element, 150, 100);
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(200);
    expect(canvas.context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    const arcsBefore = canvas.context.arc.mock.calls.length;
    flushFrame(2000);
    expect(canvas.context.arc).toHaveBeenCalledTimes(arcsBefore);
    controls.destroy();
  });

  it("cleans up observers, listeners, canvas, and original inline styles", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto", "important");
    const controls = cosmicBackground(asHTMLElement(element), { density: 2 });
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");
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

  it("rejects invalid configuration before changing the target", () => {
    const element = makeElement();
    const target = asHTMLElement(element);
    expect(() => cosmicBackground(target, { density: -1 })).toThrow(RangeError);
    expect(() => cosmicBackground(target, { depth: 1.1 })).toThrow(RangeError);
    expect(() => cosmicBackground(target, { intensity: -0.1 })).toThrow(RangeError);
    expect(() => cosmicBackground(target, { palette: "missing-cosmic-palette" })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
