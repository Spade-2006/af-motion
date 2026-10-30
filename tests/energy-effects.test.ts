import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePalette,
  energyBackground,
  registerPalette,
  removePalette,
  subscribeToPaletteChanges,
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
  ellipse = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  stroke = vi.fn();
  setTransform = vi.fn();
  createRadialGradient = vi.fn(() => new FakeGradient());
  createLinearGradient = vi.fn(() => new FakeGradient());
  fillStyle: string | CanvasGradient | CanvasPattern = "";
  strokeStyle: string | CanvasGradient | CanvasPattern = "";
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
  removePalette("energy-effects-test");
  vi.unstubAllGlobals();
});

describe("energyBackground()", () => {
  it("renders lightning bolts with configured branch count and brightness", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), {
      effect: "lightning",
      colors: ["#abcdef"],
      branchCount: 3,
      brightness: 0.5,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.stroke).toHaveBeenCalled();
    expect(context.lineTo.mock.calls.length).toBeGreaterThan(12);
    expect(context.strokeStyle).toBe("#abcdef");
    controls.destroy();
  });

  it("uses lightning frequency to enable or disable strikes", () => {
    const disabledElement = makeElement();
    const disabled = energyBackground(asHTMLElement(disabledElement), {
      effect: "lightning",
      frequency: 0,
      speed: 0,
    });
    expect(canvasOf(disabledElement).context.stroke).not.toHaveBeenCalled();
    disabled.destroy();

    const timedElement = makeElement();
    const timed = energyBackground(asHTMLElement(timedElement), {
      effect: "lightning",
      frequency: 600,
    });
    const quietElement = makeElement();
    const quiet = energyBackground(asHTMLElement(quietElement), {
      effect: "lightning",
      frequency: 0,
    });
    FakeIntersectionObserver.instances[1]!.intersect(timedElement, true);
    FakeIntersectionObserver.instances[2]!.intersect(quietElement, true);
    flushFrame(0);
    for (let time = 50; time <= 400; time += 50) flushFrame(time);
    expect(canvasOf(timedElement).context.stroke.mock.calls.length)
      .toBeGreaterThan(canvasOf(quietElement).context.stroke.mock.calls.length);
    timed.destroy();
    quiet.destroy();
  });

  it("renders plasma with bounded gradient formations", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), {
      effect: "plasma-field",
      formationCount: 4,
      scale: 0.4,
      colors: ["#112233", "#445566"],
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.createRadialGradient).toHaveBeenCalledTimes(4);
    expect(context.ellipse).toHaveBeenCalledTimes(4);
    expect(context.fill).toHaveBeenCalledTimes(4);
    controls.destroy();
  });

  it("renders configured laser beams with glow", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), {
      effect: "laser-beams",
      count: 5,
      angle: 12,
      glow: 24,
      width: 3,
      movement: 10,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.moveTo).toHaveBeenCalledTimes(5);
    expect(context.lineTo).toHaveBeenCalledTimes(5);
    expect(context.stroke).toHaveBeenCalledTimes(10);
    controls.destroy();
  });

  it("renders energy pulse rings at the configured origin", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), {
      effect: "energy-pulse",
      origin: { x: 0.25, y: 0.75 },
      interval: 0.5,
      pulseSpeed: 180,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.arc).toHaveBeenCalled();
    expect(context.arc.mock.calls[0]?.[0]).toBe(60);
    expect(context.arc.mock.calls[0]?.[1]).toBe(120);
    controls.destroy();
  });

  it("emits additional energy pulse rings at the configured interval", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), {
      effect: "energy-pulse",
      interval: 0.1,
      pulseSpeed: 100,
    });
    FakeIntersectionObserver.instances[0]!.intersect(element, true);
    flushFrame(0);
    const arcsAfterStart = canvasOf(element).context.arc.mock.calls.length;
    flushFrame(50);
    flushFrame(100);
    expect(canvasOf(element).context.arc.mock.calls.length).toBeGreaterThan(arcsAfterStart);
    controls.destroy();
  });

  it("renders electric arcs with branching and configurable density", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), {
      effect: "electric-arcs",
      density: 4,
      branchCount: 3,
      flicker: 0.8,
      speed: 0,
    });
    const context = canvasOf(element).context;
    expect(context.stroke).toHaveBeenCalled();
    expect(context.lineTo.mock.calls.length).toBeGreaterThan(32);
    controls.destroy();
  });

  it("applies explicit and active palette colors", () => {
    const element = makeElement();
    registerPalette({
      name: "energy-effects-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    const explicit = energyBackground(asHTMLElement(element), {
      effect: "lightning",
      palette: "energy-effects-test",
      speed: 0,
    });
    expect(canvasOf(element).context.strokeStyle).toBe("#112233");
    explicit.destroy();

    const live = energyBackground(asHTMLElement(element), {
      effect: "plasma-field",
      palette: "active",
      formationCount: 3,
      speed: 0,
    });
    activatePalette("energy-effects-test");
    const stops = canvasOf(element).context.createRadialGradient.mock.results
      .flatMap((result) => result.value.stops.map((stop) => stop[1]));
    expect(stops).toContain("#112233");
    expect(stops).toContain("#445566");
    expect(stops).toContain("#778899");
    live.destroy();
  });

  it("handles device-pixel resize, hidden-page pause, and reduced motion", () => {
    const element = makeElement();
    const controls = energyBackground(asHTMLElement(element), { effect: "laser-beams" });
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
    const strokesBefore = canvas.context.stroke.mock.calls.length;
    flushFrame(2000);
    expect(canvas.context.stroke).toHaveBeenCalledTimes(strokesBefore);
    controls.destroy();
  });

  it("restores target styles and releases resources on repeated cleanup", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto", "important");
    const controls = energyBackground(asHTMLElement(element), { effect: "electric-arcs" });
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

  it("does not render a queued palette notification after destruction", () => {
    registerPalette({
      name: "energy-effects-test",
      primary: "#112233",
      secondary: "#445566",
      accent: "#778899",
    });
    let controls: ReturnType<typeof energyBackground> | undefined;
    const stopBeforeEffect = subscribeToPaletteChanges(() => controls?.destroy());
    const element = makeElement();
    controls = energyBackground(asHTMLElement(element), { palette: "active", speed: 0 });
    const canvas = canvasOf(element);
    const strokesBefore = canvas.context.stroke.mock.calls.length;

    activatePalette("energy-effects-test");

    expect(canvas.context.stroke).toHaveBeenCalledTimes(strokesBefore);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
    stopBeforeEffect();
  });

  it("releases scheduler and earlier observers when observer setup fails", () => {
    vi.stubGlobal("ResizeObserver", class {
      constructor() {
        throw new Error("resize observer setup failed");
      }
    });
    const element = makeElement();

    expect(() => energyBackground(asHTMLElement(element))).toThrow("resize observer setup failed");
    expect(FakeIntersectionObserver.instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(documentListeners.get("visibilitychange")?.size ?? 0).toBe(0);
    expect(motionListeners.size).toBe(0);
    expect(frames.size).toBe(0);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });

  it("validates effect-specific options before modifying targets", () => {
    const element = makeElement();
    const target = asHTMLElement(element);
    expect(() => energyBackground(target, { effect: "lightning", frequency: -1 })).toThrow(RangeError);
    expect(() => energyBackground(target, { effect: "plasma-field", formationCount: 1 })).toThrow(RangeError);
    expect(() => energyBackground(target, { effect: "laser-beams", count: 33 })).toThrow(RangeError);
    expect(() => energyBackground(target, { effect: "energy-pulse", origin: { x: 0, y: 2 } })).toThrow(RangeError);
    expect(() => energyBackground(target, { effect: "electric-arcs", flicker: 1.1 })).toThrow(RangeError);
    expect(() => energyBackground(target, { palette: "unknown-energy-palette" })).toThrow(TypeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });
});
