// @vitest-environment jsdom

import { StrictMode, act, createElement, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useParallel, useSequence, useTimeline } from "../src/react";
import type { UseParallelStep, UseSequenceStep } from "../src/react";

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
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useSequence", () => {
  it("runs sequence on mount across multiple RefObjects and supports controls", async () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    let controls: ReturnType<typeof useSequence> | undefined;

    function SequenceComp() {
      const firstRef = useRef<HTMLDivElement>(null);
      const secondRef = useRef<HTMLDivElement>(null);

      const seq = useSequence([
        { target: firstRef, properties: { opacity: [0, 1] }, options: { duration: 100, easing: "linear" } },
        { target: secondRef, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      ], { onStart, onComplete });

      controls = seq;

      return createElement("div", null,
        createElement("div", { ref: firstRef, id: "box1" }),
        createElement("div", { ref: secondRef, id: "box2" }),
      );
    }

    act(() => root.render(createElement(SequenceComp)));
    mounted = true;

    const box1 = host.querySelector("#box1") as HTMLDivElement;
    const box2 = host.querySelector("#box2") as HTMLDivElement;

    expect(box1.style.opacity).toBe("0");

    // Frame 0 begins step 1
    act(() => flushFrames(0));
    expect(onStart).toHaveBeenCalledTimes(1);

    // Step 1 midway
    act(() => flushFrames(50));
    expect(box1.style.opacity).toBe("0.5");

    // Pause and resume
    controls?.pause();
    act(() => flushFrames(80));
    expect(box1.style.opacity).toBe("0.5");

    controls?.resume();
    // 30ms was spent paused, so step 1 finishes at clockTime = 130
    act(() => flushFrames(130));
    expect(box1.style.opacity).toBe("1");

    // Step 2 starts (first frame at 180 sets startTime = 180)
    act(() => flushFrames(180));
    expect(box2.style.opacity).toBe("0");

    // Playback rate
    expect(controls?.getPlaybackRate()).toBe(1);
    controls?.setPlaybackRate(2);
    expect(controls?.getPlaybackRate()).toBe(2);

    // Step 2 midway (50ms elapsed with 2x speed -> 100ms done = finished)
    act(() => flushFrames(230));
    expect(box2.style.opacity).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not restart running sequence when parent component re-renders with inline steps", () => {
    let renderCount = 0;
    const onStart = vi.fn();

    function ReRenderComp({ count }: { count: number }) {
      renderCount++;
      const boxRef = useRef<HTMLDivElement>(null);
      const steps: UseSequenceStep[] = [
        { target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 200 } },
      ];
      useSequence(steps, { onStart });
      return createElement("div", { ref: boxRef, "data-count": count });
    }

    act(() => root.render(createElement(ReRenderComp, { count: 1 })));
    mounted = true;
    expect(renderCount).toBe(1);

    act(() => flushFrames(0));
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => flushFrames(50));
    const box = host.firstElementChild as HTMLElement;
    expect(box.style.opacity).toBe("0.25");

    // Parent re-renders with new props, creating new steps array literal
    act(() => root.render(createElement(ReRenderComp, { count: 2 })));
    expect(renderCount).toBe(2);
    // onStart was NOT re-triggered; sequence was not restarted
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(box.style.opacity).toBe("0.25");

    act(() => flushFrames(200));
    expect(box.style.opacity).toBe("1");
  });

  it("remains safe in Strict Mode and cancels active sequence on unmount", () => {
    const onCancel = vi.fn();
    function StrictComp() {
      const boxRef = useRef<HTMLDivElement>(null);
      useSequence([
        { target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      ], { onCancel });
      return createElement("div", { ref: boxRef });
    }

    act(() => root.render(createElement(StrictMode, null, createElement(StrictComp))));
    mounted = true;

    // Strict mode remounted cleanly with 1 active animation frame
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;

    expect(frames.size).toBe(0);
    expect(onCancel).toHaveBeenCalled();
  });

  it("supports imperative play() and autoplay: false", () => {
    let hookControls: ReturnType<typeof useSequence> | undefined;
    const onComplete = vi.fn();

    function ImperativeComp() {
      const boxRef = useRef<HTMLDivElement>(null);
      const seq = useSequence(undefined, { autoplay: false });
      hookControls = seq;
      return createElement("div", { ref: boxRef, id: "target" });
    }

    act(() => root.render(createElement(ImperativeComp)));
    mounted = true;
    expect(frames.size).toBe(0);

    const target = host.querySelector("#target") as HTMLDivElement;
    act(() => {
      hookControls?.play([
        { target, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      ], { onComplete });
    });

    expect(frames.size).toBe(1);
    act(() => flushFrames(0));
    act(() => flushFrames(100));
    expect(target.style.opacity).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("useParallel", () => {
  it("runs parallel animations concurrently and supports pause/resume/cancel", () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    let controls: ReturnType<typeof useParallel> | undefined;

    function ParallelComp() {
      const firstRef = useRef<HTMLDivElement>(null);
      const secondRef = useRef<HTMLDivElement>(null);

      const par = useParallel([
        { target: firstRef, properties: { opacity: [0, 1] }, options: { duration: 100 } },
        { target: secondRef, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      ], { onStart, onComplete });

      controls = par;

      return createElement("div", null,
        createElement("div", { ref: firstRef, id: "box1" }),
        createElement("div", { ref: secondRef, id: "box2" }),
      );
    }

    act(() => root.render(createElement(ParallelComp)));
    mounted = true;

    const box1 = host.querySelector("#box1") as HTMLDivElement;
    const box2 = host.querySelector("#box2") as HTMLDivElement;

    expect(box1.style.opacity).toBe("0");
    expect(box2.style.opacity).toBe("0");

    act(() => flushFrames(0));
    expect(onStart).toHaveBeenCalledTimes(1);

    act(() => flushFrames(50));
    expect(box1.style.opacity).toBe("0.5");
    expect(box2.style.opacity).toBe("0.5");

    act(() => flushFrames(100));
    expect(box1.style.opacity).toBe("1");
    expect(box2.style.opacity).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("cancels running parallel animations on unmount and remains safe in Strict Mode", () => {
    const onCancel = vi.fn();
    function StrictParallelComp() {
      const boxRef = useRef<HTMLDivElement>(null);
      useParallel([
        { target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } },
      ], { onCancel });
      return createElement("div", { ref: boxRef });
    }

    act(() => root.render(createElement(StrictMode, null, createElement(StrictParallelComp))));
    mounted = true;
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;
    expect(frames.size).toBe(0);
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("useTimeline", () => {
  it("builds and coordinates timeline steps with labels and seek controls", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let tlControls: ReturnType<typeof useTimeline> | undefined;
    const onComplete = vi.fn();

    function TimelineComp() {
      const boxRef = useRef<HTMLDivElement>(null);

      const tl = useTimeline((timeline) => {
        timeline
          .addLabel("start", 0)
          .add({ at: "start", target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } });
      }, { onComplete, autoplay: false });

      tlControls = tl;
      return createElement("div", { ref: boxRef, id: "timeline-box" });
    }

    act(() => root.render(createElement(TimelineComp)));
    mounted = true;

    const box = host.querySelector("#timeline-box") as HTMLDivElement;

    // Autoplay was false, start timeline imperatively
    act(() => tlControls?.play());
    clockTime = 0;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(box.style.opacity).toBe("0");

    act(() => flushFrames(0));
    clockTime = 50;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    act(() => flushFrames(50));
    expect(box.style.opacity).toBe("0.5");

    // Seek control during active playback
    act(() => tlControls?.seek(25));
    expect(box.style.opacity).toBe("0.25");

    // Complete playback from seek point
    // 75ms remaining from seek point (25ms -> 100ms)
    clockTime = 125;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(75);
    });
    act(() => flushFrames(125));
    expect(box.style.opacity).toBe("1");
    await Promise.resolve();
    expect(onComplete).toHaveBeenCalled();
  });

  it("cancels running timeline on unmount and remains safe in Strict Mode", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onCancel = vi.fn();
    function StrictTimelineComp() {
      const boxRef = useRef<HTMLDivElement>(null);
      useTimeline((tl) => {
        tl.add({ at: 0, target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } });
      }, { onCancel, autoplay: true });
      return createElement("div", { ref: boxRef });
    }

    act(() => root.render(createElement(StrictMode, null, createElement(StrictTimelineComp))));
    mounted = true;
    clockTime = 0;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(frames.size).toBe(1);

    act(() => root.unmount());
    mounted = false;
    expect(frames.size).toBe(0);
  });
});

describe("SSR safety", () => {
  it("renders server-side markup without throwing for sequence, parallel, and timeline hooks", () => {
    function ServerComp() {
      const ref = useRef<HTMLDivElement>(null);
      useSequence([{ target: ref, properties: { opacity: [0, 1] } }]);
      useParallel([{ target: ref, properties: { opacity: [0, 1] } }]);
      useTimeline((tl) => {
        tl.add({ at: 0, target: ref, properties: { opacity: [0, 1] } });
      });
      return createElement("div", { ref, className: "ssr-content" }, "Hello SSR");
    }

    const html = renderToString(createElement(ServerComp));
    expect(html).toContain('class="ssr-content"');
    expect(html).toContain("Hello SSR");
  });
});
