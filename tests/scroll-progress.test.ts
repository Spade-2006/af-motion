import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { scrollProgress } from "../src/effects/scroll-progress";
import type {
  ScrollProgressControls,
  ScrollProgressOptions,
} from "../src/effects/scroll-progress";

class FakeStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
}

class FakeElement {
  parentElement: FakeElement | null = null;
  children: FakeElement[] = [];
  style = new FakeStyle();
  attributes = new Map<string, string>();
  listeners = new Map<string, Set<EventListener>>();
  scrollTop = 0;
  scrollHeight = 0;
  clientHeight = 0;
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  appendChild<T extends FakeElement>(child: T): T {
    return this.insertBefore(child, null);
  }
  insertBefore<T extends FakeElement>(child: T, before: FakeElement | null): T {
    if (child.parentElement) child.parentElement.removeChild(child);
    const index = before === null ? -1 : this.children.indexOf(before);
    if (index < 0) this.children.push(child);
    else this.children.splice(index, 0, child);
    child.parentElement = this;
    return child;
  }
  removeChild<T extends FakeElement>(child: T): T {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentElement = null;
    return child;
  }
  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (options?.passive) FakeElement.passiveCalls.push(type);
  }
  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener(new Event(type));
  }
  static passiveCalls: string[] = [];
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let body: FakeElement;
let root: FakeElement;
let fakeWindow: {
  scrollY: number;
  innerHeight: number;
  listeners: Map<string, Set<EventListener>>;
  addEventListener: (type: string, listener: EventListener, options?: AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  dispatch: (type: string) => void;
};

function asHTMLElement(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function bars(): FakeElement[] {
  return body.children.filter((element) => element.attributes.has("aria-hidden"));
}

function flushFrames(time = 10): void {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(time));
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
  frames = new Map();
  nextFrameId = 1;
  body = new FakeElement();
  root = new FakeElement();
  root.scrollHeight = 1200;
  root.clientHeight = 600;
  fakeWindow = {
    scrollY: 0,
    innerHeight: 600,
    listeners: new Map(),
    addEventListener(type, listener, options) {
      const listeners = this.listeners.get(type) ?? new Set<EventListener>();
      listeners.add(listener);
      this.listeners.set(type, listeners);
      if (options?.passive) FakeElement.passiveCalls.push(type);
    },
    removeEventListener(type, listener) {
      this.listeners.get(type)?.delete(listener);
    },
    dispatch(type) {
      for (const listener of this.listeners.get(type) ?? []) listener(new Event(type));
    },
  };
  FakeElement.passiveCalls = [];
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("document", {
    body,
    documentElement: root,
    createElement: () => new FakeElement(),
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
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
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});

afterEach(() => vi.unstubAllGlobals());

describe("scrollProgress()", () => {
  it("tracks page progress, batches repeated scroll events, and styles the bar", () => {
    const controls = scrollProgress({
      color: "#8b5cf6",
      height: 4,
      position: "top",
      smoothing: 0.2,
    });
    const bar = bars()[0]!;
    expect(bar.attributes.get("aria-hidden")).toBe("true");
    expect(bar.style.getPropertyValue("position")).toBe("fixed");
    expect(bar.style.getPropertyValue("top")).toBe("0");
    expect(bar.style.getPropertyValue("height")).toBe("4px");
    expect(bar.style.getPropertyValue("background-color")).toBe("#8b5cf6");
    expect(bar.style.getPropertyValue("pointer-events")).toBe("none");
    expect(bar.style.getPropertyValue("transition")).toBe("transform 0.2s ease-out");
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(0)");
    expect(FakeElement.passiveCalls).toContain("scroll");

    fakeWindow.scrollY = 300;
    fakeWindow.dispatch("scroll");
    fakeWindow.scrollY = 450;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    flushFrames();
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(0.75)");

    fakeWindow.scrollY = 900;
    fakeWindow.dispatch("scroll");
    flushFrames();
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(1)");
    controls.destroy();
    expect(body.children).toHaveLength(0);
    expect(fakeWindow.listeners.get("scroll")?.size ?? 0).toBe(0);
    expect(fakeWindow.listeners.get("resize")?.size ?? 0).toBe(0);
  });

  it("supports bottom positioning and clamps page progress", () => {
    const controls = scrollProgress({ position: "bottom", easing: 0 });
    const bar = bars()[0]!;
    expect(bar.style.getPropertyValue("bottom")).toBe("0");
    expect(bar.style.getPropertyValue("transition")).toBe("none");
    fakeWindow.scrollY = 1000;
    fakeWindow.dispatch("scroll");
    flushFrames();
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(1)");
    fakeWindow.scrollY = -10;
    fakeWindow.dispatch("scroll");
    flushFrames();
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(0)");
    controls.destroy();
  });

  it("tracks a custom scrollable target instead of the page", () => {
    const scroller = new FakeElement();
    scroller.scrollHeight = 1000;
    scroller.clientHeight = 200;
    selectorResults[".scroller"] = [scroller];
    const controls = scrollProgress({ target: ".scroller", position: "bottom" });
    const bar = bars()[0]!;
    expect(fakeWindow.listeners.get("scroll")?.size ?? 0).toBe(0);
    expect(fakeWindow.listeners.get("resize")?.size ?? 0).toBe(0);
    expect(scroller.listeners.get("scroll")?.size).toBe(1);
    scroller.scrollTop = 400;
    scroller.dispatch("scroll");
    flushFrames();
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(0.5)");
    controls.destroy();
    expect(scroller.listeners.get("scroll")?.size ?? 0).toBe(0);
  });

  it("updates immediately without smoothing for reduced motion", () => {
    reducedMotion = true;
    const controls = scrollProgress();
    const bar = bars()[0]!;
    expect(bar.style.getPropertyValue("transition")).toBe("none");
    fakeWindow.scrollY = 300;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(0);
    expect(bar.style.getPropertyValue("transform")).toBe("scaleX(0.5)");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(bar.style.getPropertyValue("transition")).toBe("transform 0.15s ease-out");
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(bar.style.getPropertyValue("transition")).toBe("none");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("cancels a pending frame and removes the bar idempotently", () => {
    const controls = scrollProgress();
    fakeWindow.scrollY = 150;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    controls.destroy();
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(bars()).toHaveLength(0);
  });

  it("validates options and target selectors before creating DOM", () => {
    expect(() => scrollProgress({ position: "middle" as "top" })).toThrow(TypeError);
    expect(() => scrollProgress({ color: "" })).toThrow(TypeError);
    expect(() => scrollProgress({ height: 0 })).toThrow(RangeError);
    expect(() => scrollProgress({ smoothing: -0.1 })).toThrow(RangeError);
    expect(() => scrollProgress({ easing: Number.NaN })).toThrow(RangeError);
    expect(() => scrollProgress({ target: "!!bad" })).toThrow(SyntaxError);
    const first = new FakeElement();
    const second = new FakeElement();
    selectorResults[".many"] = [first, second];
    expect(() => scrollProgress({ target: ".many" })).toThrow(RangeError);
    expect(body.children).toHaveLength(0);
    expect(fakeWindow.listeners.size).toBe(0);
    expectTypeOf<ScrollProgressOptions["position"]>().toEqualTypeOf<"top" | "bottom" | undefined>();
    expectTypeOf<ScrollProgressControls["destroy"]>().toBeFunction();
  });
});
