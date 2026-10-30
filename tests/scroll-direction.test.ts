import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { scrollDirection } from "../src/effects/scroll-direction";
import type {
  ScrollDirection,
  ScrollDirectionControls,
  ScrollDirectionOptions,
} from "../src/effects/scroll-direction";

class FakeElement {
  listeners = new Map<string, Set<EventListener>>();
  scrollTop = 0;
  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (options?.passive) FakeElement.passiveTypes.push(type);
  }
  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener(new Event(type));
  }
  static passiveTypes: string[] = [];
}

class FakeWindow {
  listeners = new Map<string, Set<EventListener>>();
  scrollY = 0;
  pageYOffset = 0;
  addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    if (options?.passive) FakeWindow.passiveTypes.push(type);
  }
  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener(new Event(type));
  }
  static passiveTypes: string[] = [];
}

let selectorResults: Record<string, unknown[]>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let fakeWindow: FakeWindow;

function flushFrame(): void {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(16));
}

beforeEach(() => {
  selectorResults = {};
  frames = new Map();
  nextFrameId = 1;
  fakeWindow = new FakeWindow();
  FakeElement.passiveTypes = [];
  FakeWindow.passiveTypes = [];
  vi.stubGlobal("Window", FakeWindow);
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("document", {
    documentElement: { scrollTop: 0 },
    body: { scrollTop: 0 },
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});

afterEach(() => vi.unstubAllGlobals());

describe("scrollDirection()", () => {
  it("reports direction changes only after movement crosses the threshold", () => {
    const onChange = vi.fn<(direction: ScrollDirection) => void>();
    const controls = scrollDirection({ onChange, threshold: 12 });

    fakeWindow.scrollY = 8;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).not.toHaveBeenCalled();

    fakeWindow.scrollY = 13;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenLastCalledWith("down");

    fakeWindow.scrollY = 18;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenCalledTimes(1);

    fakeWindow.scrollY = 0;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenLastCalledWith("idle");

    fakeWindow.scrollY = 20;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenLastCalledWith("down");
    controls.destroy();
  });

  it("detects upward movement after the threshold is crossed", () => {
    const onChange = vi.fn<(direction: ScrollDirection) => void>();
    fakeWindow.scrollY = 100;
    const controls = scrollDirection({ onChange, threshold: 10 });

    fakeWindow.scrollY = 95;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).not.toHaveBeenCalled();

    fakeWindow.scrollY = 88;
    fakeWindow.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("up");
    controls.destroy();
  });

  it("batches repeated scroll events into a single animation frame", () => {
    const onChange = vi.fn<(direction: ScrollDirection) => void>();
    const controls = scrollDirection({ onChange, threshold: 5 });

    fakeWindow.scrollY = 2;
    fakeWindow.dispatch("scroll");
    fakeWindow.scrollY = 4;
    fakeWindow.dispatch("scroll");
    fakeWindow.scrollY = 8;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    expect(FakeWindow.passiveTypes).toEqual(["scroll"]);
    flushFrame();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("down");
    controls.destroy();
  });

  it("supports an element target and applies the top reset threshold", () => {
    const element = new FakeElement();
    element.scrollTop = 50;
    selectorResults[".scroller"] = [element];
    const onChange = vi.fn<(direction: ScrollDirection) => void>();
    const controls = scrollDirection({ onChange, threshold: 8, target: ".scroller" });

    element.scrollTop = 62;
    element.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("down");

    element.scrollTop = 8;
    element.dispatch("scroll");
    flushFrame();
    expect(onChange).toHaveBeenLastCalledWith("idle");
    expect(element.listeners.get("scroll")?.size).toBe(1);
    expect(FakeElement.passiveTypes).toEqual(["scroll"]);
    controls.destroy();
    expect(element.listeners.get("scroll")?.size ?? 0).toBe(0);
  });

  it("cancels pending frames and removes listeners idempotently", () => {
    const onChange = vi.fn<(direction: ScrollDirection) => void>();
    const controls = scrollDirection({ onChange });
    fakeWindow.scrollY = 20;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    controls.destroy();
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(fakeWindow.listeners.get("scroll")?.size ?? 0).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("validates options and targets before registering listeners", () => {
    const onChange = vi.fn<(direction: ScrollDirection) => void>();
    expect(() => scrollDirection({ onChange, threshold: -1 })).toThrow(RangeError);
    expect(() => scrollDirection({ onChange, threshold: Number.NaN })).toThrow(RangeError);
    expect(() => scrollDirection({ onChange: 3 as unknown as (direction: ScrollDirection) => void })).toThrow(TypeError);
    expect(() => scrollDirection({ onChange, target: "!!bad" })).toThrow(SyntaxError);
    selectorResults[".multiple"] = [new FakeElement(), new FakeElement()];
    expect(() => scrollDirection({ onChange, target: ".multiple" })).toThrow(RangeError);
    expect(fakeWindow.listeners.size).toBe(0);
    expectTypeOf<ScrollDirectionOptions["threshold"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ScrollDirectionOptions["onChange"]>().toBeFunction();
    expectTypeOf<ScrollDirectionControls["destroy"]>().toBeFunction();
  });
});
