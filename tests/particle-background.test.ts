import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  particleBackground,
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
  listeners = new Map<string, Set<EventListener>>();
  width = 640;
  height = 360;

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  getBoundingClientRect(): DOMRect {
    return { width: this.width, height: this.height, left: 0, top: 0 } as DOMRect;
  }
  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type: string, event: Event): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

class FakeContext {
  clearRect = vi.fn();
  beginPath = vi.fn();
  arc = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  setTransform = vi.fn();
  fills: string[] = [];
  fillAlphas: number[] = [];
  fill = vi.fn(() => {
    this.fills.push(this.fillStyle as string);
    this.fillAlphas.push(this.globalAlpha);
  });
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
  removePalette("particle-background-test");
  vi.unstubAllGlobals();
});

describe("particleBackground()", () => {
  it.each(["floating", "network", "cursor", "constellation"] as const)(
    "renders %s mode with its mode-specific drawing",
    (mode) => {
      const element = makeElement();
      const controls = particleBackground(asHTMLElement(element), {
        mode,
        count: 6,
        connectionDistance: 1000,
        pointerRadius: 1000,
        speed: 0,
      });
      const canvas = canvasOf(element);

      expect(canvas.context.arc).toHaveBeenCalledTimes(6);
      if (mode === "network" || mode === "constellation") {
        expect(canvas.context.stroke).toHaveBeenCalled();
      }
      if (mode === "floating") expect(canvas.context.stroke).not.toHaveBeenCalled();
      if (mode === "cursor") {
        element.dispatch("pointermove", { clientX: 10, clientY: 10 } as PointerEvent);
        expect(canvas.context.stroke).toHaveBeenCalled();
      }
      controls.destroy();
    },
  );

  it("supports particle density, opacity, DPR sizing, and responsive resize", () => {
    const element = makeElement();
    element.width = 100;
    element.height = 100;
    const controls = particleBackground(asHTMLElement(element), {
      density: 2,
      opacity: 0.4,
      speed: 0,
    });
    const canvas = canvasOf(element);
    expect(canvas.context.arc).toHaveBeenCalledTimes(2);
    expect(canvas.context.fillAlphas).toEqual([0.4, 0.4]);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);

    FakeResizeObserver.instances[0]!.resize(element, 200, 100);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
    expect(canvas.context.arc).toHaveBeenCalledTimes(6);
    expect(canvas.context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
    controls.destroy();
  });

  it("uses explicit registered palettes and follows active-palette changes", () => {
    const element = makeElement();
    registerPalette({
      name: "particle-background-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const explicit = particleBackground(asHTMLElement(element), {
      palette: "particle-background-test",
      count: 3,
      speed: 0,
    });
    expect(canvasOf(element).context.fills).toEqual(["#112233", "#445566", "#778899"]);
    explicit.destroy();

    const live = particleBackground(asHTMLElement(element), { palette: "active", count: 3, speed: 0 });
    activatePalette("particle-background-test");
    expect(canvasOf(element).context.fills.slice(-3)).toEqual(["#112233", "#445566", "#778899"]);
    live.destroy();
  });

  it("respects reduced motion and pauses while the document is hidden", () => {
    const element = makeElement();
    const controls = particleBackground(asHTMLElement(element), { count: 3 });
    const observer = FakeIntersectionObserver.instances[0]!;
    observer.intersect(element, true);
    expect(frames.size).toBe(1);

    const visibilityHandler = [...(documentListeners.get("visibilitychange") ?? [])][0]!;
    (document as unknown as { hidden: boolean }).hidden = true;
    visibilityHandler(new Event("visibilitychange"));
    expect(frames.size).toBe(0);

    (document as unknown as { hidden: boolean }).hidden = false;
    visibilityHandler(new Event("visibilitychange"));
    expect(frames.size).toBe(1);
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    const arcsBefore = canvasOf(element).context.arc.mock.calls.length;
    flushFrame(100);
    expect(canvasOf(element).context.arc).toHaveBeenCalledTimes(arcsBefore);
    controls.destroy();
  });

  it("cleans up frames, observers, listeners, canvas, and original target styles", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto", "important");
    const controls = particleBackground(asHTMLElement(element), { mode: "cursor", count: 2 });
    FakeIntersectionObserver.instances[0]!.intersect(element, true);
    expect(frames.size).toBe(1);
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");
    controls.destroy();
    controls.destroy();

    expect(frames.size).toBe(0);
    expect(FakeIntersectionObserver.instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(FakeResizeObserver.instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyPriority("position")).toBe("important");
    expect(element.style.getPropertyValue("isolation")).toBe("auto");
    expect(element.style.getPropertyPriority("isolation")).toBe("important");
    expect(element.listeners.get("pointermove")?.size).toBe(0);
    expect(element.listeners.get("pointerleave")?.size).toBe(0);
    expect(documentListeners.get("visibilitychange")?.size).toBe(0);
    expect(motionListeners.size).toBe(0);
  });

  it("validates option combinations and missing palettes before changing the target", () => {
    const element = makeElement();
    const target = asHTMLElement(element);
    expect(() => particleBackground(target, { count: 2, density: 1 })).toThrow(TypeError);
    expect(() => particleBackground(target, { density: 0 })).toThrow(RangeError);
    expect(() => particleBackground(target, { opacity: 1.1 })).toThrow(RangeError);
    expect(() => particleBackground(target, { palette: "not-registered" })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
