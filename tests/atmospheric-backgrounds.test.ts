import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  atmosphericBackground,
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
  textContent = "";
  get firstChild(): FakeNode | null { return this.children[0] ?? null; }
  appendChild<T extends FakeNode>(node: T): T { return this.insertBefore(node, null); }
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
  arc = vi.fn();
  fill = vi.fn();
  fillRect = vi.fn();
  stroke = vi.fn();
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
let documentHead: FakeNode;

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
  documentHead = new FakeNode();
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
    head: documentHead,
    documentElement: documentHead,
    createElement: (name: string) => {
      if (name === "canvas") return new FakeCanvas();
      if (name === "div") return new FakeHTMLElement();
      if (name === "style") return new FakeNode();
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
  removePalette("atmospheric-background-test");
  vi.unstubAllGlobals();
});

describe("atmosphericBackground()", () => {
  it("reuses aurora ribbons and supports wave count and explicit colors", () => {
    const element = makeElement();
    const controls = atmosphericBackground(asHTMLElement(element), {
      effect: "aurora",
      colors: ["#112233", "#445566"],
      waveCount: 6,
      speed: 4,
      intensity: 0.5,
    });
    const overlay = element.firstChild as FakeHTMLElement;
    expect(overlay.style.getPropertyValue("background").match(/radial-gradient/g)).toHaveLength(6);
    expect(overlay.style.getPropertyValue("background")).toContain("#112233");
    expect(overlay.style.getPropertyValue("background")).toContain("#445566");
    expect(overlay.style.getPropertyValue("opacity")).toBe("0.5");
    controls.destroy();
    expect(documentHead.children).toHaveLength(0);
    expect(element.children).toHaveLength(0);
  });

  it.each([
    ["fog", { density: 4, softness: 0.6, direction: "left" }],
    ["rainfall", { density: 8, angle: -12, streakLength: 20, surfaceGlow: true }],
    ["snowfall", { density: 6, size: 2, wind: -4, drift: 8 }],
    ["sunbeams", { origin: { x: 0.3, y: 0.1 }, spread: 60, movement: 8 }],
  ] as const)("renders %s with effect options", (effect, effectOptions) => {
    const element = makeElement();
    const controls = atmosphericBackground(asHTMLElement(element), {
      ...effectOptions,
      effect,
      speed: 0.5,
    });
    const context = canvasOf(element).context;
    expect(context.clearRect).toHaveBeenCalled();
    if (effect === "fog") expect(context.createRadialGradient).toHaveBeenCalledTimes(4);
    if (effect === "rainfall") expect(context.stroke).toHaveBeenCalled();
    if (effect === "snowfall") expect(context.arc).toHaveBeenCalled();
    if (effect === "sunbeams") {
      expect(context.createLinearGradient).toHaveBeenCalled();
      expect(context.fill).toHaveBeenCalled();
    }
    controls.destroy();
  });

  it("updates Canvas colors from the active registered palette", () => {
    const element = makeElement();
    registerPalette({
      name: "atmospheric-background-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const explicit = atmosphericBackground(asHTMLElement(element), {
      effect: "fog",
      palette: "atmospheric-background-test",
      density: 3,
      speed: 0.5,
    });
    const explicitStops = canvasOf(element).context.createRadialGradient.mock.results
      .flatMap((result) => result.value.stops.map((stop) => stop[1]));
    expect(explicitStops).toContain("#112233");
    expect(explicitStops).toContain("#445566");
    expect(explicitStops).toContain("#778899");
    explicit.destroy();

    const controls = atmosphericBackground(asHTMLElement(element), {
      effect: "fog",
      palette: "active",
      density: 3,
    });
    activatePalette("atmospheric-background-test");
    const stops = canvasOf(element).context.createRadialGradient.mock.results
      .flatMap((result) => result.value.stops.map((stop) => stop[1]));
    const activeContext = canvasOf(element).context;
    expect(stops).toContain("#112233");
    expect(stops).toContain("#445566");
    expect(stops).toContain("#778899");
    controls.destroy();
    const drawsAfterCleanup = activeContext.clearRect.mock.calls.length;
    removePalette("atmospheric-background-test");
    expect(activeContext.clearRect).toHaveBeenCalledTimes(drawsAfterCleanup);
  });

  it("updates aurora colors from an active palette and unsubscribes on cleanup", () => {
    const element = makeElement();
    registerPalette({
      name: "atmospheric-background-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const controls = atmosphericBackground(asHTMLElement(element), {
      effect: "aurora",
      palette: "active",
      waveCount: 3,
    });
    activatePalette("atmospheric-background-test");
    expect((element.firstChild as FakeHTMLElement).style.getPropertyValue("background")).toContain("#112233");
    expect(motionListeners.size).toBeGreaterThan(0);
    controls.destroy();
    expect(element.children).toHaveLength(0);
    expect(documentHead.children).toHaveLength(0);
  });

  it("handles Canvas resizing, hidden pages, and reduced motion", () => {
    const element = makeElement();
    const controls = atmosphericBackground(asHTMLElement(element), { effect: "snowfall" });
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
    const arcsBefore = canvas.context.arc.mock.calls.length;
    flushFrame(2000);
    expect(canvas.context.arc).toHaveBeenCalledTimes(arcsBefore);
    controls.destroy();
  });

  it("cleans up Canvas listeners, observers, frames, and original inline styles", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto", "important");
    const controls = atmosphericBackground(asHTMLElement(element), { effect: "rainfall" });
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

  it("validates effect-specific options before modifying targets", () => {
    const element = makeElement();
    const target = asHTMLElement(element);
    expect(() => atmosphericBackground(target, { effect: "fog", density: 0 })).toThrow(RangeError);
    expect(() => atmosphericBackground(target, { effect: "rainfall", angle: 90 })).toThrow(RangeError);
    expect(() => atmosphericBackground(target, { effect: "snowfall", size: 0 })).toThrow(RangeError);
    expect(() => atmosphericBackground(target, { effect: "sunbeams", origin: { x: 2, y: 0.5 } })).toThrow(RangeError);
    expect(() => atmosphericBackground(target, { effect: "aurora", waveCount: 0 })).toThrow(RangeError);
    expect(() => atmosphericBackground(target, { palette: "unknown-atmosphere" })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
