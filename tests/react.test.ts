// @vitest-environment jsdom

import { StrictMode, act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimate, type UseAnimateCallback } from "../src/react";
import type { AnimationControls } from "../src/core/animation";

let host: HTMLDivElement;
let root: Root;
let mounted: boolean;
let clockTime: number;
let nextFrameId: number;
let frames: Map<number, FrameRequestCallback>;

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  mounted = false;
  clockTime = 0;
  nextFrameId = 1;
  frames = new Map();
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(() => {
  if (mounted) act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

describe("useAnimate", () => {
  it("animates the referenced element and returns animation controls", () => {
    let animate: UseAnimateCallback | undefined;
    function Example() {
      const hook = useAnimate<HTMLDivElement>();
      animate = hook.animate;
      return createElement("div", { ref: hook.ref });
    }

    act(() => root.render(createElement(Example)));
    mounted = true;
    const controls = animate?.({ opacity: [0, 1] }, { duration: 100 });

    expect(controls).not.toBeNull();
    expect(host.firstElementChild).toHaveProperty("style.opacity", "0");
    flushFrame(0);
    flushFrame(50);
    expect((host.firstElementChild as HTMLElement).style.opacity).toBe("0.5");
    flushFrame(100);
    expect((host.firstElementChild as HTMLElement).style.opacity).toBe("1");
    expect(typeof (controls as AnimationControls).pause).toBe("function");
  });

  it("returns null when the ref has no mounted element", () => {
    let animate: UseAnimateCallback | undefined;
    function Example() {
      const hook = useAnimate();
      animate = hook.animate;
      return null;
    }

    act(() => root.render(createElement(Example)));
    mounted = true;

    expect(animate?.({ opacity: [0, 1] })).toBeNull();
    expect(frames.size).toBe(0);
  });

  it("cancels active animations on unmount", () => {
    let animate: UseAnimateCallback | undefined;
    const onCancel = vi.fn();
    function Example() {
      const hook = useAnimate<HTMLDivElement>();
      animate = hook.animate;
      return createElement("div", { ref: hook.ref });
    }

    act(() => root.render(createElement(Example)));
    mounted = true;
    const element = host.firstElementChild as HTMLElement;
    animate?.({ opacity: [0, 1] }, { duration: 100, onCancel });
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    expect(element.style.opacity).toBe("0");
  });

  it("remains safe when Strict Mode replays mount effects", () => {
    const onCancel = vi.fn();
    function Example() {
      const { ref, animate } = useAnimate<HTMLDivElement>();
      useEffect(() => {
        animate({ opacity: [0, 1] }, { duration: 100, onCancel });
      }, [animate]);
      return createElement("div", { ref });
    }

    act(() => root.render(createElement(StrictMode, null, createElement(Example))));
    mounted = true;

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;

    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
  });
});
