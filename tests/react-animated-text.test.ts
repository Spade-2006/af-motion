// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedText } from "../src/react";
import type { AnimatedTextProps } from "../src/react";

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let clockTime: number;
let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;

function render(props: AnimatedTextProps): void {
  act(() => root.render(createElement(AnimatedText, props)));
  mounted = true;
}

function visualText(): HTMLElement {
  return host.querySelector('[aria-hidden="true"]') as HTMLElement;
}

function flushFrames(time: number): void {
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
  reducedMotion = false;
  motionListeners = new Set();
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
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.delete(listener),
  }));
  vi.stubGlobal("CSS", { supports: () => true });
  vi.stubGlobal("HTMLElement", window.HTMLElement);
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AnimatedText", () => {
  it("renders accessible static text in semantic markup", () => {
    const markup = renderToString(createElement(AnimatedText, {
      effect: "typewriter",
      text: "Hello world",
    }));
    expect(markup).toContain("aria-label=\"Hello world\"");
    expect(markup).toContain("aria-hidden=\"true\"");
    expect(markup).toContain("Hello world");

    render({ effect: "typewriter", text: "Hello world", className: "heading" });
    expect(host.firstElementChild?.tagName).toBe("SPAN");
    expect(host.firstElementChild?.getAttribute("aria-label")).toBe("Hello world");
    expect(visualText().textContent).toBe("");
  });

  it("runs typewriter with its options and restores text on cleanup", () => {
    vi.useFakeTimers();
    render({
      effect: "typewriter",
      text: "Hi",
      effectOptions: { typeSpeed: 10, pause: 100, cursor: "_" },
    });
    const element = visualText();

    expect(element.textContent).toBe("_");
    act(() => vi.advanceTimersByTime(10));
    expect(element.textContent).toBe("H_");
    act(() => vi.advanceTimersByTime(10));
    expect(element.textContent).toBe("Hi_");

    act(() => root.unmount());
    mounted = false;
    expect(vi.getTimerCount()).toBe(0);
    expect(element.textContent).toBe("Hi");
    expect(element.isConnected).toBe(false);
  });

  it("runs the scramble effect and cancels its scheduled frame on unmount", () => {
    render({ effect: "scramble", text: "Motion", effectOptions: { duration: 100 } });
    expect(frames.size).toBe(1);
    act(() => flushFrames(0));
    act(() => flushFrames(50));
    expect(visualText().textContent).not.toBe("Motion");

    act(() => root.unmount());
    mounted = false;
    expect(frames.size).toBe(0);
  });

  it("applies gradient options and restores styles on unmount", () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    render({
      effect: "gradient",
      text: "Color",
      effectOptions: { colors: ["red", "blue"], angle: 45, animated: true, duration: 500 },
    });
    const element = visualText();

    expect(element.style.backgroundImage).toBe("linear-gradient(45deg, red, blue)");
    expect(animate).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ duration: 500, iterations: Number.POSITIVE_INFINITY }),
    );
    expect(motionListeners.size).toBe(1);

    act(() => root.unmount());
    mounted = false;
    expect(motionListeners.size).toBe(0);
    expect(element.style.backgroundImage).toBe("");
  });

  it("does not animate under reduced motion", () => {
    reducedMotion = true;
    vi.useFakeTimers();
    render({ effect: "typewriter", text: "Reduced", effectOptions: { typeSpeed: 1 } });
    expect(visualText().textContent).toBe("Reduced");
    expect(vi.getTimerCount()).toBe(0);

    act(() => root.render(createElement(AnimatedText, {
      effect: "scramble",
      text: "Reduced",
      effectOptions: { duration: 100 },
    })));
    expect(visualText().textContent).toBe("Reduced");
    expect(frames.size).toBe(0);

    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    act(() => root.render(createElement(AnimatedText, {
      effect: "gradient",
      text: "Reduced",
      effectOptions: { animated: true },
    })));

    expect(animate).not.toHaveBeenCalled();
    expect(visualText().style.backgroundSize).toBe("100% 100%");
  });
});
