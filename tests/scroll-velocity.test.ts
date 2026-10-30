import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { scrollVelocity } from "../src/effects/scroll-velocity";
import type {
  ScrollVelocityControls,
  ScrollVelocityData,
  ScrollVelocityOptions,
} from "../src/effects/scroll-velocity";

class FakeElement {
  listeners = new Map<string, Set<EventListener>>();
  scrollTop = 0;
  scrollHeight = 1000;
  clientHeight = 200;
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
  innerHeight = 600;
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
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let root: { scrollTop: number; scrollHeight: number; clientHeight: number };
let body: { scrollTop: number; scrollHeight: number };
let fakeWindow: FakeWindow;
let frameTime: number;

function flushFrame(time: number): void {
  frameTime = time;
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
  frameTime = 0;
  root = { scrollTop: 0, scrollHeight: 1600, clientHeight: 600 };
  body = { scrollTop: 0, scrollHeight: 1600 };
  fakeWindow = new FakeWindow();
  FakeElement.passiveTypes = [];
  FakeWindow.passiveTypes = [];
  vi.stubGlobal("Window", FakeWindow);
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("document", {
    documentElement: root,
    body,
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("performance", { now: () => frameTime });
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

describe("scrollVelocity()", () => {
  it("reports initial and updated page progress, direction, and velocity in pixels per second", () => {
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({ onUpdate: (data) => updates.push(data), smoothing: 0 });
    expect(updates).toEqual([{ velocity: 0, direction: "idle", position: 0, progress: 0 }]);
    expect(FakeWindow.passiveTypes).toEqual(["scroll"]);

    fakeWindow.scrollY = 100;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    fakeWindow.scrollY = 200;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    flushFrame(100);
    expect(updates[1]).toEqual({ velocity: 2000, direction: "down", position: 200, progress: 0.2 });

    fakeWindow.scrollY = 100;
    fakeWindow.dispatch("scroll");
    flushFrame(200);
    expect(updates[2]).toEqual({ velocity: -1000, direction: "up", position: 100, progress: 0.1 });
    controls.destroy();
  });

  it("smooths and clamps extreme velocity spikes", () => {
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({ onUpdate: (data) => updates.push(data), smoothing: 0.5 });
    fakeWindow.scrollY = 1000;
    fakeWindow.dispatch("scroll");
    flushFrame(100);
    expect(updates[1]?.velocity).toBe(5000);

    fakeWindow.scrollY = 100000;
    fakeWindow.dispatch("scroll");
    flushFrame(110);
    expect(updates[2]?.velocity).toBe(7500);
    expect(Math.abs(updates[2]?.velocity ?? 0)).toBeLessThanOrEqual(10_000);
    controls.destroy();
  });

  it("tracks a custom element target and reports idle when position is unchanged", () => {
    const element = new FakeElement();
    selectorResults[".scroller"] = [element];
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({
      onUpdate: (data) => updates.push(data),
      target: ".scroller",
      smoothing: 0,
    });
    expect(element.listeners.get("scroll")?.size).toBe(1);
    expect(FakeWindow.passiveTypes).toEqual([]);
    element.scrollTop = 400;
    element.dispatch("scroll");
    flushFrame(100);
    expect(updates[1]).toEqual({ velocity: 4000, direction: "down", position: 400, progress: 0.5 });
    element.dispatch("scroll");
    flushFrame(200);
    expect(updates[2]).toEqual({ velocity: 0, direction: "idle", position: 400, progress: 0.5 });
    controls.destroy();
    expect(element.listeners.get("scroll")?.size ?? 0).toBe(0);
  });

  it("handles zero or invalid elapsed time and non-finite measurements safely", () => {
    const element = new FakeElement();
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({
      onUpdate: (data) => updates.push(data),
      target: element as unknown as HTMLElement,
      smoothing: 0,
    });

    element.scrollTop = 100;
    element.dispatch("scroll");
    flushFrame(0);
    expect(updates[1]).toEqual({ velocity: 0, direction: "down", position: 100, progress: 0.125 });

    element.scrollTop = 200;
    element.dispatch("scroll");
    flushFrame(Number.NaN);
    expect(updates[2]).toEqual({ velocity: 0, direction: "down", position: 200, progress: 0.25 });

    element.scrollTop = Number.NaN;
    element.dispatch("scroll");
    flushFrame(100);
    expect(updates[3]).toEqual({ velocity: 0, direction: "idle", position: 200, progress: 0.25 });
    expect(updates.every(({ velocity, progress, position }) =>
      Number.isFinite(velocity) && Number.isFinite(progress) && Number.isFinite(position),
    )).toBe(true);
    controls.destroy();
  });

  it("reports zero velocity under reduced motion but continues progress and direction", () => {
    reducedMotion = true;
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({ onUpdate: (data) => updates.push(data), smoothing: 0 });
    fakeWindow.scrollY = 500;
    fakeWindow.dispatch("scroll");
    flushFrame(100);
    expect(updates[1]).toEqual({ velocity: 0, direction: "down", position: 500, progress: 0.5 });

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    fakeWindow.scrollY = 600;
    fakeWindow.dispatch("scroll");
    flushFrame(200);
    expect(updates[2]).toEqual({ velocity: 1000, direction: "down", position: 600, progress: 0.6 });
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    fakeWindow.scrollY = 400;
    fakeWindow.dispatch("scroll");
    flushFrame(300);
    expect(updates[3]).toEqual({ velocity: 0, direction: "up", position: 400, progress: 0.4 });
    controls.destroy();
  });

  it("decays stale velocity to exactly zero after scrolling stops, then stops requesting frames", () => {
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({ onUpdate: (data) => updates.push(data), smoothing: 0.5 });
    fakeWindow.scrollY = 100;
    fakeWindow.dispatch("scroll");
    flushFrame(100);
    expect(updates[1]?.velocity).toBe(500);
    expect(frames.size).toBe(1);

    flushFrame(200);
    expect(updates[2]).toEqual({ velocity: 250, direction: "idle", position: 100, progress: 0.1 });
    let time = 200;
    for (let i = 0; i < 40 && frames.size > 0; i += 1) flushFrame(time += 16);
    expect(updates[updates.length - 1]?.velocity).toBe(0);
    expect(frames.size).toBe(0);

    const count = updates.length;
    fakeWindow.scrollY = 150;
    fakeWindow.dispatch("scroll");
    flushFrame(time + 100);
    expect(updates.length).toBe(count + 1);
    controls.destroy();
  });

  it("does not loop forever with maximum smoothing and stops decay frames on destroy", () => {
    const updates: ScrollVelocityData[] = [];
    const controls = scrollVelocity({ onUpdate: (data) => updates.push(data), smoothing: 1 });
    fakeWindow.scrollY = 100;
    fakeWindow.dispatch("scroll");
    flushFrame(100);
    flushFrame(200);
    expect(frames.size).toBe(0);

    const decaying = scrollVelocity({ onUpdate: (data) => updates.push(data), smoothing: 0.9 });
    fakeWindow.scrollY = 400;
    fakeWindow.dispatch("scroll");
    flushFrame(300);
    expect(frames.size).toBe(1);
    decaying.destroy();
    expect(frames.size).toBe(0);
    controls.destroy();
  });
  it("cancels pending frames and removes listeners idempotently", () => {
    const onUpdate = vi.fn();
    const controls = scrollVelocity({ onUpdate });
    const callsBefore = onUpdate.mock.calls.length;
    fakeWindow.scrollY = 200;
    fakeWindow.dispatch("scroll");
    expect(frames.size).toBe(1);
    controls.destroy();
    controls.destroy();
    expect(frames.size).toBe(0);
    expect(fakeWindow.listeners.get("scroll")?.size ?? 0).toBe(0);
    flushFrame(100);
    expect(onUpdate).toHaveBeenCalledTimes(callsBefore);
    expect(motionListeners.size).toBe(0);
  });

  it("releases registered resources when the initial update callback throws", () => {
    const error = new Error("initial callback failed");
    expect(() => scrollVelocity({
      onUpdate: () => { throw error; },
    })).toThrow(error);

    expect(fakeWindow.listeners.get("scroll")?.size ?? 0).toBe(0);
    expect(motionListeners.size).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("validates options and targets before registering listeners", () => {
    const onUpdate = vi.fn();
    expect(() => scrollVelocity({ onUpdate, smoothing: -0.1 })).toThrow(RangeError);
    expect(() => scrollVelocity({ onUpdate, smoothing: 1.1 })).toThrow(RangeError);
    expect(() => scrollVelocity({ onUpdate, smoothing: Number.NaN })).toThrow(RangeError);
    expect(() => scrollVelocity({ onUpdate: 1 as unknown as (data: ScrollVelocityData) => void })).toThrow(TypeError);
    expect(() => scrollVelocity({ onUpdate, target: "!!bad" })).toThrow(SyntaxError);
    selectorResults[".many"] = [new FakeElement(), new FakeElement()];
    expect(() => scrollVelocity({ onUpdate, target: ".many" })).toThrow(RangeError);
    expect(fakeWindow.listeners.size).toBe(0);
    expectTypeOf<ScrollVelocityOptions["smoothing"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ScrollVelocityControls["destroy"]>().toBeFunction();
  });
});
