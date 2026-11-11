// @vitest-environment jsdom

import { StrictMode, act, createElement, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnimatedText,
  Reveal,
  useAnimate,
  useInView,
  useParallel,
  useScrollProgress,
  useScrollVelocity,
  useSequence,
  useTimeline,
} from "../src/react";

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observed = new Set<Element>();
  observe = vi.fn((element: Element) => this.observed.add(element));
  unobserve = vi.fn((element: Element) => this.observed.delete(element));
  disconnect = vi.fn(() => this.observed.clear());

  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  emit(target: Element, isIntersecting: boolean): void {
    this.callback(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: Number(isIntersecting),
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
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
  FakeIntersectionObserver.instances = [];

  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
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

describe("React Strict Mode audit", () => {
  describe("useSequence under StrictMode", () => {
    it("autoplays without duplicate rAF loops, duplicate onStart calls, or false onCancel triggers", () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      function StrictSequenceComp() {
        const box1 = useRef<HTMLDivElement>(null);
        const box2 = useRef<HTMLDivElement>(null);

        useSequence(
          [
            { target: box1, properties: { opacity: [0, 1] }, options: { duration: 100 } },
            { target: box2, properties: { opacity: [0, 1] }, options: { duration: 100 } },
          ],
          { onStart, onComplete, onCancel, autoplay: true },
        );

        return createElement(
          "div",
          null,
          createElement("div", { ref: box1, id: "box1" }),
          createElement("div", { ref: box2, id: "box2" }),
        );
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictSequenceComp)));
      });
      mounted = true;

      // In Strict Mode, effect 1 mounted, cleaned up, then effect 2 mounted.
      // There must only be 1 active rAF frame request, not 2!
      expect(frames.size).toBe(1);
      expect(onStart).not.toHaveBeenCalled();
      // Mount 1 sequence was cancelled during Strict Mode effect replay
      expect(onCancel).toHaveBeenCalledTimes(1);

      // Flush first frame
      act(() => flushFrames(0));
      // onStart must be called exactly once
      expect(onStart).toHaveBeenCalledTimes(1);

      // Advance step 1
      act(() => flushFrames(100));
      expect(frames.size).toBe(1); // step 2 now scheduled

      // Step 2 initial frame sets its clock
      act(() => flushFrames(100));

      // Advance step 2 to finish
      act(() => flushFrames(200));
      expect(frames.size).toBe(0);
      expect(onComplete).toHaveBeenCalledTimes(1);
      // No additional cancellations occurred during active playback to finish
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("handles double cancel calls idempotently after unmount in StrictMode", () => {
      let controls: ReturnType<typeof useSequence> | undefined;

      function Comp() {
        const ref = useRef<HTMLDivElement>(null);
        controls = useSequence(
          [{ target: ref, properties: { opacity: [0, 1] }, options: { duration: 100 } }],
          { autoplay: false },
        );
        return createElement("div", { ref });
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(Comp)));
      });
      mounted = true;

      act(() => {
        controls?.play();
      });
      expect(frames.size).toBe(1);

      act(() => root.unmount());
      mounted = false;
      expect(frames.size).toBe(0);

      // Calling cancel multiple times after unmount must not throw
      expect(() => {
        controls?.cancel();
        controls?.cancel();
      }).not.toThrow();
    });
  });

  describe("useParallel under StrictMode", () => {
    it("autoplays parallel animations cleanly without duplicate rAF loops or double onStart", () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      function StrictParallelComp() {
        const box1 = useRef<HTMLDivElement>(null);
        const box2 = useRef<HTMLDivElement>(null);

        useParallel(
          [
            { target: box1, properties: { opacity: [0, 1] }, options: { duration: 100 } },
            { target: box2, properties: { transform: ["scale(0)", "scale(1)"] }, options: { duration: 100 } },
          ],
          { onStart, onComplete, onCancel, autoplay: true },
        );

        return createElement(
          "div",
          null,
          createElement("div", { ref: box1, id: "box1" }),
          createElement("div", { ref: box2, id: "box2" }),
        );
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictParallelComp)));
      });
      mounted = true;

      // Exactly 1 shared rAF frame registered across parallel animations
      expect(frames.size).toBe(1);
      expect(onStart).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);

      act(() => flushFrames(0));
      expect(onStart).toHaveBeenCalledTimes(1);

      act(() => flushFrames(100));
      expect(frames.size).toBe(0);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("useTimeline under StrictMode", () => {
    it("autoplays timeline cleanly through StrictMode mount replay with exact callback counts", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      function StrictTimelineComp() {
        const boxRef = useRef<HTMLDivElement>(null);

        useTimeline(
          (tl) => {
            tl.add({ at: 0, target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } });
          },
          { onComplete, onCancel, autoplay: true },
        );

        return createElement("div", { ref: boxRef, id: "box" });
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictTimelineComp)));
      });
      mounted = true;

      clockTime = 0;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(frames.size).toBe(1);
      // Mount 1 timeline was cancelled during Strict Mode effect replay
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();

      act(() => flushFrames(0));

      clockTime = 100;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      act(() => flushFrames(100));

      expect(frames.size).toBe(0);
      await Promise.resolve();
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("useInView under StrictMode", () => {
    it("does not leak observers and triggers onEnter/onLeave accurately", () => {
      const enterCleanup = vi.fn();
      const onEnter = vi.fn(() => enterCleanup);
      const onLeave = vi.fn();
      const onChange = vi.fn();

      function StrictInViewComp() {
        const { ref, isInView } = useInView<HTMLDivElement>({
          once: false,
          onEnter,
          onLeave,
          onChange,
        });
        return createElement("div", { ref, "data-in-view": String(isInView) });
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictInViewComp)));
      });
      mounted = true;

      // Two observer instances created in Strict Mode, but first one MUST be disconnected
      expect(FakeIntersectionObserver.instances).toHaveLength(2);
      expect(FakeIntersectionObserver.instances[0].disconnect).toHaveBeenCalledTimes(1);
      expect(FakeIntersectionObserver.instances[0].observed.size).toBe(0);

      const activeObs = FakeIntersectionObserver.instances[1];
      const element = host.firstElementChild as HTMLElement;
      expect(activeObs.observed.has(element)).toBe(true);

      // Emit enter
      act(() => activeObs.emit(element, true));
      expect(onEnter).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true, element, expect.any(Object));

      // Emit leave
      act(() => activeObs.emit(element, false));
      expect(enterCleanup).toHaveBeenCalledTimes(1);
      expect(onLeave).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(false, element, expect.any(Object));
    });

    it("handles rapid target prop changes under StrictMode without leaking observers", () => {
      function Comp({ target }: { target: HTMLElement }) {
        useInView({ target });
        return createElement("div");
      }

      const el1 = document.createElement("section");
      const el2 = document.createElement("article");

      act(() => {
        root.render(createElement(StrictMode, null, createElement(Comp, { target: el1 })));
      });
      mounted = true;

      const instancesBefore = FakeIntersectionObserver.instances.length;

      act(() => {
        root.render(createElement(StrictMode, null, createElement(Comp, { target: el2 })));
      });

      // All previous observers are disconnected
      for (let i = 0; i < instancesBefore; i++) {
        expect(FakeIntersectionObserver.instances[i].disconnect).toHaveBeenCalled();
        expect(FakeIntersectionObserver.instances[i].observed.size).toBe(0);
      }

      // Latest active observer observes el2
      const latestObs = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
      expect(latestObs.observed.has(el2)).toBe(true);
    });
  });

  describe("useScrollProgress and useScrollVelocity under StrictMode", () => {
    it("does not duplicate listeners on window under StrictMode in useScrollProgress", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      function StrictScrollComp() {
        const { progress } = useScrollProgress({ target: "window" });
        return createElement("div", { "data-progress": String(progress) });
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictScrollComp)));
      });
      mounted = true;

      // In Strict Mode: mounted, unmounted (listeners removed), then remounted (listeners added)
      // Check net active scroll listeners count
      const scrollAdds = addEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;
      const scrollRemoves = removeEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;

      expect(scrollAdds - scrollRemoves).toBe(1);

      act(() => root.unmount());
      mounted = false;

      const finalScrollAdds = addEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;
      const finalScrollRemoves = removeEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;
      expect(finalScrollAdds - finalScrollRemoves).toBe(0);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("does not duplicate listeners on window under StrictMode in useScrollVelocity", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      function StrictVelocityComp() {
        const { data } = useScrollVelocity({ target: "window" });
        return createElement("div", { "data-vel": String(data.velocity) });
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictVelocityComp)));
      });
      mounted = true;

      const scrollAdds = addEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;
      const scrollRemoves = removeEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;

      expect(scrollAdds - scrollRemoves).toBe(1);

      act(() => root.unmount());
      mounted = false;

      const finalScrollAdds = addEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;
      const finalScrollRemoves = removeEventListenerSpy.mock.calls.filter((c) => c[0] === "scroll").length;
      expect(finalScrollAdds - finalScrollRemoves).toBe(0);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("Reveal under StrictMode", () => {
    it("preserves initial hidden styles, runs reveal animation on intersection, and restores ref correctly", () => {
      const forwardedRef = { current: null as HTMLDivElement | null };

      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(Reveal, { ref: forwardedRef, direction: "up" }, "Strict Reveal Content"),
          ),
        );
      });
      mounted = true;

      // Ref is properly populated
      expect(forwardedRef.current).not.toBeNull();
      const div = forwardedRef.current!;

      // Initial hidden style from reveal: opacity 0
      expect(div.style.opacity).toBe("0");

      const activeObs = FakeIntersectionObserver.instances[FakeIntersectionObserver.instances.length - 1];
      expect(activeObs.observed.has(div)).toBe(true);

      // Trigger intersection
      act(() => activeObs.emit(div, true));
      expect(frames.size).toBe(1);

      // Frame 0 initializes animation clock
      act(() => flushFrames(0));
      // Frame 600 completes reveal animation
      act(() => flushFrames(600));
      expect(div.style.opacity).toBe("1");

      // Unmount restores ref to null
      act(() => root.unmount());
      mounted = false;
      expect(forwardedRef.current).toBeNull();
    });
  });

  describe("AnimatedText under StrictMode", () => {
    it("cleans up first effect during StrictMode replay and displays clean final state", () => {
      function StrictAnimatedTextComp() {
        return createElement(AnimatedText, { text: "Hello", effect: "typewriter" });
      }

      act(() => {
        root.render(createElement(StrictMode, null, createElement(StrictAnimatedTextComp)));
      });
      mounted = true;

      const outerSpan = host.querySelector("span[aria-label='Hello']") as HTMLSpanElement;
      expect(outerSpan).not.toBeNull();

      // Only one inner span
      const innerSpans = outerSpan.querySelectorAll("span[aria-hidden='true']");
      expect(innerSpans).toHaveLength(1);

      act(() => root.unmount());
      mounted = false;
    });
  });
});
