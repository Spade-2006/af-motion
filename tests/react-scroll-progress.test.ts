// @vitest-environment jsdom

import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollProgress } from "../src/react";
import type { UseScrollProgressOptions } from "../src/react";

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;
let currentOptions: UseScrollProgressOptions;
let clockTime: number;
let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;

function Example() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>(currentOptions);
  return createElement("div", { ref, "data-progress": String(progress) });
}

function render(options: UseScrollProgressOptions = {}): void {
  currentOptions = options;
  act(() => root.render(createElement(Example)));
  mounted = true;
}

function progress(): string | null {
  return host.firstElementChild?.getAttribute("data-progress") ?? null;
}

function flushFrames(time = 10): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(time));
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
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1200 });
  Object.defineProperty(document.documentElement, "clientHeight", { configurable: true, value: 600 });
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("useScrollProgress", () => {
  it("reactively tracks window scroll progress", () => {
    render({ target: "window" });
    expect(progress()).toBe("0");

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 300 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(frames.size).toBe(1);
    act(() => flushFrames());

    expect(progress()).toBe("0.5");
  });

  it("uses the returned ref as a custom scroll container", () => {
    render();
    const element = host.firstElementChild as HTMLDivElement;
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(element, "clientHeight", { configurable: true, value: 200 });
    element.scrollTop = 400;

    act(() => element.dispatchEvent(new Event("scroll")));
    expect(frames.size).toBe(1);
    act(() => flushFrames());

    expect(progress()).toBe("0.5");
  });

  it("cleans up listeners and pending frames on unmount", () => {
    render({ target: "window" });
    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 300 });
      window.dispatchEvent(new Event("scroll"));
    });
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;

    expect(frames.size).toBe(0);
    expect(document.body.querySelector('[aria-hidden="true"]')).toBeNull();
    window.dispatchEvent(new Event("scroll"));
    expect(frames.size).toBe(0);
  });

  it("recreates scroll tracking when options change", () => {
    render({ smoothing: 0.1 });
    const firstBar = document.body.querySelector('[aria-hidden="true"]');

    render({ smoothing: 0.3 });

    expect(firstBar?.parentElement).toBeNull();
    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it("remains safe when Strict Mode replays effects", () => {
    act(() => root.render(createElement(StrictMode, null, createElement(Example))));
    mounted = true;

    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });
});
