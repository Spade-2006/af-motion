// @vitest-environment jsdom

import { StrictMode, act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "../src/react";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  observe = vi.fn((element: Element) => this.observed.add(element));
  unobserve = vi.fn((element: Element) => this.observed.delete(element));
  disconnect = vi.fn(() => this.observed.clear());

  constructor(readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  enter(element: Element): void {
    this.callback([{
      target: element,
      isIntersecting: true,
      intersectionRatio: 1,
    } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;
let clockTime: number;
let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;

function flushFrames(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((callback) => callback(time));
}

function observer(index = 0): FakeIntersectionObserver {
  return FakeIntersectionObserver.instances[index] as FakeIntersectionObserver;
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mounted = false;
  clockTime = 0;
  nextFrameId = 1;
  frames = new Map();
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
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
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("renders children and forwards ordinary div props", () => {
    const markup = renderToString(createElement(Reveal, { className: "hero", title: "Welcome" }, "Hello"));
    expect(markup).toContain("class=\"hero\"");
    expect(markup).toContain("title=\"Welcome\"");
    expect(markup).not.toContain("opacity");

    act(() => root.render(createElement(Reveal, { className: "hero", title: "Welcome" }, "Hello")));
    mounted = true;

    expect(host.innerHTML).toContain("Hello");
    expect(host.firstElementChild).toHaveProperty("className", "hero");
    expect(host.firstElementChild).toHaveProperty("title", "Welcome");
    expect((host.firstElementChild as HTMLElement).style.opacity).toBe("0");
  });

  it("activates the reveal animation when the element enters view", () => {
    act(() => root.render(createElement(Reveal, { direction: "left", duration: 200 }, "Content")));
    mounted = true;
    const element = host.firstElementChild as HTMLElement;

    expect(element.style.opacity).toBe("0");
    expect(element.style.transform).toBe("translateX(24px)");
    act(() => observer().enter(element));
    act(() => flushFrames(0));
    act(() => flushFrames(100));

    expect(element.style.opacity).toBe("0.5");
    expect(element.style.transform).toBe("translateX(12px)");
    act(() => flushFrames(200));
    expect(element.style.opacity).toBe("1");
    expect(element.style.transform).toBe("translateX(0px)");
  });

  it("supports direction, duration, delay, and once-only settings", () => {
    act(() => root.render(createElement(Reveal, {
      direction: "down",
      duration: 250,
      delay: 75,
      once: false,
    }, "Content")));
    mounted = true;
    const element = host.firstElementChild as HTMLElement;
    const currentObserver = observer();

    expect(element.style.transform).toBe("translateY(-24px)");
    act(() => currentObserver.enter(element));
    act(() => flushFrames(0));
    act(() => flushFrames(75));

    expect(element.style.opacity).toBe("0");
    act(() => flushFrames(200));
    expect(element.style.opacity).toBe("0.5");
    expect(currentObserver.observed.has(element)).toBe(true);
    expect(currentObserver.unobserve).not.toHaveBeenCalled();
  });

  it("uses once-only observation by default", () => {
    act(() => root.render(createElement(Reveal, null, "Content")));
    mounted = true;
    const element = host.firstElementChild as HTMLElement;

    act(() => observer().enter(element));

    expect(observer().unobserve).toHaveBeenCalledWith(element);
    expect(observer().observed.has(element)).toBe(false);
  });

  it("disconnects the observer and restores unrevealed content on unmount", () => {
    act(() => root.render(createElement(Reveal, null, "Content")));
    mounted = true;
    const element = host.firstElementChild as HTMLElement;
    const currentObserver = observer();

    act(() => root.unmount());
    mounted = false;

    expect(currentObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(element.style.opacity).toBe("");
    expect(element.style.transform).toBe("");
    expect(frames.size).toBe(0);
  });

  it("recreates observers when options change and remains safe in Strict Mode", () => {
    act(() => root.render(createElement(Reveal, { direction: "up" }, "Content")));
    mounted = true;
    const firstObserver = observer();

    act(() => root.render(createElement(Reveal, { direction: "right" }, "Content")));

    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(FakeIntersectionObserver.instances).toHaveLength(2);
    expect((host.firstElementChild as HTMLElement).style.transform).toBe("translateX(-24px)");

    act(() => root.render(createElement(StrictMode, null, createElement(Reveal, null, "Strict"))));
    expect(FakeIntersectionObserver.instances.at(-2)?.disconnect).toHaveBeenCalledTimes(1);
  });
});
