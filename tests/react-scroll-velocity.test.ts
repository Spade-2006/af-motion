// @vitest-environment jsdom

import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollVelocity } from "../src/react";
import type { UseScrollVelocityOptions } from "../src/react";

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;
let currentOptions: UseScrollVelocityOptions;
let clockTime: number;
let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;

function Example() {
  const { ref, data } = useScrollVelocity<HTMLDivElement>(currentOptions);
  return createElement("div", {
    ref,
    "data-velocity": String(data.velocity),
    "data-direction": data.direction,
    "data-progress": String(data.progress),
    "data-position": String(data.position),
  });
}

function render(options: UseScrollVelocityOptions = {}): void {
  currentOptions = options;
  act(() => root.render(createElement(Example)));
  mounted = true;
}

function flushFrames(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(time));
}

function value(name: string): string | null {
  return host.firstElementChild?.getAttribute(`data-${name}`) ?? null;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mounted = false;
  currentOptions = {};
  clockTime = 0;
  nextFrameId = 1;
  frames = new Map();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0, writable: true });
  Object.defineProperty(window, "pageYOffset", { configurable: true, value: 0, writable: true });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1200 });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 600 });
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("useScrollVelocity", () => {
  it("reactively reports progress, position, direction, and velocity", () => {
    render({ target: "window", smoothing: 0 });
    expect(value("direction")).toBe("idle");
    expect(value("position")).toBe("0");
    expect(value("progress")).toBe("0");

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(frames.size).toBe(1);
    act(() => flushFrames(100));

    expect(value("velocity")).toBe("2000");
    expect(value("direction")).toBe("down");
    expect(value("position")).toBe("200");
    expect(value("progress")).toBe(String(1 / 3));
  });

  it("reports upward direction for decreasing window scroll position", () => {
    render({ target: "window", smoothing: 0 });
    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 300 });
      window.dispatchEvent(new Event("scroll"));
      flushFrames(100);
    });
    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
      window.dispatchEvent(new Event("scroll"));
      flushFrames(200);
    });

    expect(value("direction")).toBe("up");
    expect(value("velocity")).toBe("-2000");
  });

  it("tracks scrolling of the element attached to its ref", () => {
    render({ smoothing: 0 });
    const element = host.firstElementChild as HTMLDivElement;
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(element, "clientHeight", { configurable: true, value: 200 });
    element.scrollTop = 400;

    act(() => {
      element.dispatchEvent(new Event("scroll"));
      flushFrames(100);
    });

    expect(value("direction")).toBe("down");
    expect(value("position")).toBe("400");
    expect(value("progress")).toBe("0.5");
    expect(value("velocity")).toBe("4000");
  });

  it("removes listeners and cancels pending frames on unmount", () => {
    const onUpdate = vi.fn();
    render({ target: "window", onUpdate });
    const updatesBeforeScroll = onUpdate.mock.calls.length;
    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;
    const callsAtUnmount = onUpdate.mock.calls.length;

    expect(frames.size).toBe(0);
    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(0);
    act(() => flushFrames(100));
    expect(onUpdate).toHaveBeenCalledTimes(callsAtUnmount);
    expect(callsAtUnmount).toBe(updatesBeforeScroll);
  });

  it("recreates tracking when the target option changes", () => {
    render({ target: "window", smoothing: 0 });
    const oldTarget = window;
    const newTarget = document.createElement("div");
    Object.defineProperty(newTarget, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(newTarget, "clientHeight", { configurable: true, value: 200 });
    currentOptions = { target: newTarget, smoothing: 0 };
    act(() => root.render(createElement(Example)));

    act(() => oldTarget.dispatchEvent(new Event("scroll")));
    expect(frames.size).toBe(0);

    newTarget.scrollTop = 400;
    act(() => newTarget.dispatchEvent(new Event("scroll")));
    expect(frames.size).toBe(1);
    act(() => flushFrames(100));
    expect(value("position")).toBe("400");
  });

  it("remains safe when Strict Mode replays effects", () => {
    currentOptions = { target: "window" };
    act(() => root.render(createElement(StrictMode, null, createElement(Example))));
    mounted = true;
    expect(frames.size).toBe(0);

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(frames.size).toBe(1);
    act(() => flushFrames(100));
    expect(value("position")).toBe("100");
  });
});
