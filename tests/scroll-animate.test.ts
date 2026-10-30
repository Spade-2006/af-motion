import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrollAnimate } from "../src/effects/scroll-animate";

class FakeStyle {
  values = new Map<string, string>();
  setProperty = vi.fn((name: string, value: string) => this.values.set(name, value));
  get(name: string): string | undefined {
    return this.values.get(name);
  }
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  getPropertyPriority(): string {
    return "";
  }
  removeProperty(name: string): void {
    this.values.delete(name);
  }
}

class FakeElement {
  style = new FakeStyle();
}

class FakeWindow {
  listeners = new Set<EventListener>();
  scrollY = 0;
  innerHeight = 600;
  addEventListener = vi.fn((_type: string, listener: EventListener) => this.listeners.add(listener));
  removeEventListener = vi.fn((_type: string, listener: EventListener) => this.listeners.delete(listener));
  dispatch(): void {
    for (const listener of this.listeners) listener(new Event("scroll"));
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let clockTime: number;
let fakeWindow: FakeWindow;
let element: FakeElement;

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function opacity(): string | undefined {
  return element.style.get("opacity");
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  clockTime = 0;
  fakeWindow = new FakeWindow();
  element = new FakeElement();
  vi.stubGlobal("Window", FakeWindow);
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("document", {
    documentElement: { scrollTop: 0, scrollHeight: 1600, clientHeight: 600 },
    body: { scrollTop: 0, scrollHeight: 1600 },
    querySelectorAll: () => [],
  });
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe("scrollAnimate()", () => {
  it("scrubs properties from scroll progress through animate() interpolation", () => {
    const updates: number[] = [];
    const controls = scrollAnimate(element as unknown as HTMLElement, { opacity: [0, 1] }, {
      onUpdate: (progress) => updates.push(progress),
    });

    expect(opacity()).toBe("0");
    fakeWindow.scrollY = 500;
    fakeWindow.dispatch();
    flushFrame(100);

    expect(opacity()).toBe("0.5");
    expect(controls.getProgress()).toBe(0.5);
    expect(updates).toEqual([0, 0.5]);
    controls.destroy();
  });

  it("supports reverse mapping, pause/resume, and repeated destruction", () => {
    const controls = scrollAnimate(element as unknown as HTMLElement, { opacity: [0, 1] }, {
      reverse: true,
    });
    fakeWindow.scrollY = 500;
    fakeWindow.dispatch();
    flushFrame(100);
    expect(opacity()).toBe("0.5");

    controls.pause();
    fakeWindow.scrollY = 1000;
    fakeWindow.dispatch();
    flushFrame(200);
    expect(opacity()).toBe("0.5");

    controls.resume();
    expect(opacity()).toBe("0");
    controls.destroy();
    controls.destroy();
    expect(fakeWindow.listeners.size).toBe(0);
  });
});
