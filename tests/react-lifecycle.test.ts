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
  type UseAnimateCallback,
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

describe("React lifecycle hardening", () => {
  describe("useInView", () => {
    it("runs enterCleanup on unmount when the element is still in view, but suppresses stale callbacks", () => {
      const enterCleanup = vi.fn();
      const onEnter = vi.fn(() => enterCleanup);
      const onLeave = vi.fn();
      const onChange = vi.fn();

      function InViewComp() {
        const { ref, isInView } = useInView<HTMLDivElement>({
          once: false,
          onEnter,
          onLeave,
          onChange,
        });
        return createElement("div", { ref, "data-in-view": String(isInView) });
      }

      act(() => root.render(createElement(InViewComp)));
      mounted = true;

      const element = host.firstElementChild as HTMLElement;
      const obs = FakeIntersectionObserver.instances[0];

      // Element enters view
      act(() => obs.emit(element, true));
      expect(onEnter).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(true, element, expect.any(Object));
      expect(enterCleanup).not.toHaveBeenCalled();

      // Component unmounts while element is still in view
      act(() => root.unmount());
      mounted = false;

      // enterCleanup MUST have been executed to prevent memory/resource leaks
      expect(enterCleanup).toHaveBeenCalledTimes(1);
      // But onLeave and onChange(false) must NOT be invoked on unmount
      expect(onLeave).not.toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledTimes(1); // only the initial true
    });

    it("ensures onLeave runs even if onChange throws an exception during viewport exit", () => {
      const onLeave = vi.fn();
      const onChange = vi.fn((inView: boolean) => {
        if (!inView) throw new Error("onChange failure");
      });

      function InViewErrorComp() {
        const { ref } = useInView<HTMLDivElement>({
          once: false,
          onChange,
          onLeave,
        });
        return createElement("div", { ref });
      }

      act(() => root.render(createElement(InViewErrorComp)));
      mounted = true;

      const element = host.firstElementChild as HTMLElement;
      const obs = FakeIntersectionObserver.instances[0];

      act(() => obs.emit(element, true));

      expect(() => {
        act(() => obs.emit(element, false));
      }).toThrow("onChange failure");

      // onLeave was still called despite onChange error!
      expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it("cleans up previous observer and connects new observer when target changes dynamically", () => {
      function DynamicTargetComp({ targetEl }: { targetEl: HTMLElement }) {
        useInView({ target: targetEl });
        return createElement("div");
      }

      const elA = document.createElement("section");
      const elB = document.createElement("article");

      act(() => root.render(createElement(DynamicTargetComp, { targetEl: elA })));
      mounted = true;
      expect(FakeIntersectionObserver.instances).toHaveLength(1);
      expect(FakeIntersectionObserver.instances[0].observed.has(elA)).toBe(true);

      act(() => root.render(createElement(DynamicTargetComp, { targetEl: elB })));
      expect(FakeIntersectionObserver.instances).toHaveLength(2);
      expect(FakeIntersectionObserver.instances[0].disconnect).toHaveBeenCalled();
      expect(FakeIntersectionObserver.instances[1].observed.has(elB)).toBe(true);
    });
  });

  describe("useAnimate", () => {
    it("returns null when calling animate() after component unmounts", () => {
      let savedAnimate: UseAnimateCallback | undefined;

      function AnimateComp() {
        const { ref, animate } = useAnimate<HTMLDivElement>();
        savedAnimate = animate;
        return createElement("div", { ref });
      }

      act(() => root.render(createElement(AnimateComp)));
      mounted = true;
      expect(savedAnimate).toBeDefined();

      act(() => root.unmount());
      mounted = false;

      // Calling animate after unmount must safely return null
      const result = savedAnimate?.({ opacity: [0, 1] });
      expect(result).toBeNull();
      expect(frames.size).toBe(0);
    });

    it("cancels all running animations on unmount and reports errors without skipping sibling cleanups", () => {
      let savedAnimate: UseAnimateCallback | undefined;

      function MultiAnimateComp() {
        const { ref, animate } = useAnimate<HTMLDivElement>();
        savedAnimate = animate;
        return createElement("div", { ref });
      }

      act(() => root.render(createElement(MultiAnimateComp)));
      mounted = true;

      const controls1 = savedAnimate?.({ opacity: [0, 1] }, { duration: 200 });
      const controls2 = savedAnimate?.({ transform: ["scale(1)", "scale(1.2)"] }, { duration: 200 });

      expect(controls1).not.toBeNull();
      expect(controls2).not.toBeNull();

      // Spy on controls2 cancel
      const cancelSpy2 = vi.spyOn(controls2!, "cancel");

      // Make controls1 cancel throw an error
      vi.spyOn(controls1!, "cancel").mockImplementation(() => {
        throw new Error("controls1 cancel error");
      });

      expect(() => {
        act(() => root.unmount());
      }).toThrow("controls1 cancel error");
      mounted = false;

      // controls2 cancel was STILL called despite controls1 throwing!
      expect(cancelSpy2).toHaveBeenCalled();
    });
  });

  describe("useScrollProgress and useScrollVelocity", () => {
    it("suppresses onUpdate callbacks after unmount in useScrollProgress", () => {
      const onUpdate = vi.fn();
      function ScrollComp() {
        const { ref } = useScrollProgress<HTMLDivElement>({ onUpdate });
        return createElement("div", { ref, style: { height: "500px", overflow: "auto" } });
      }

      act(() => root.render(createElement(ScrollComp)));
      mounted = true;

      act(() => root.unmount());
      mounted = false;

      const callsBefore = onUpdate.mock.calls.length;
      window.dispatchEvent(new Event("scroll"));
      expect(onUpdate.mock.calls.length).toBe(callsBefore);
    });

    it("suppresses onUpdate callbacks after unmount in useScrollVelocity", () => {
      const onUpdate = vi.fn();
      function VelocityComp() {
        const { ref } = useScrollVelocity<HTMLDivElement>({ onUpdate });
        return createElement("div", { ref });
      }

      act(() => root.render(createElement(VelocityComp)));
      mounted = true;

      act(() => root.unmount());
      mounted = false;

      const callsBefore = onUpdate.mock.calls.length;
      window.dispatchEvent(new Event("scroll"));
      expect(onUpdate.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("useSequence and useParallel", () => {
    it("returns null when calling play() after sequence unmount", () => {
      let controls: ReturnType<typeof useSequence> | undefined;
      function SeqComp() {
        const boxRef = useRef<HTMLDivElement>(null);
        controls = useSequence(
          [{ target: boxRef, properties: { opacity: [0, 1] } }],
          { autoplay: false },
        );
        return createElement("div", { ref: boxRef });
      }

      act(() => root.render(createElement(SeqComp)));
      mounted = true;
      expect(controls).toBeDefined();

      act(() => root.unmount());
      mounted = false;

      expect(controls?.play()).toBeNull();
    });

    it("prevents stale onComplete callback when sequence is unmounted mid-animation", () => {
      const onComplete = vi.fn();
      function SeqComp() {
        const boxRef = useRef<HTMLDivElement>(null);
        useSequence(
          [{ target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } }],
          { onComplete, autoplay: true },
        );
        return createElement("div", { ref: boxRef });
      }

      act(() => root.render(createElement(SeqComp)));
      mounted = true;

      act(() => flushFrames(0));
      act(() => flushFrames(50));

      act(() => root.unmount());
      mounted = false;

      // Advancing time past completion should NOT trigger onComplete
      act(() => flushFrames(150));
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("returns null when calling play() after parallel unmount", () => {
      let controls: ReturnType<typeof useParallel> | undefined;
      function ParallelComp() {
        const boxRef = useRef<HTMLDivElement>(null);
        controls = useParallel(
          [{ target: boxRef, properties: { opacity: [0, 1] } }],
          { autoplay: false },
        );
        return createElement("div", { ref: boxRef });
      }

      act(() => root.render(createElement(ParallelComp)));
      mounted = true;

      act(() => root.unmount());
      mounted = false;

      expect(controls?.play()).toBeNull();
    });
  });

  describe("useTimeline", () => {
    it("initializes an imperative timeline even when builder argument is omitted", () => {
      let tlResult: ReturnType<typeof useTimeline> | undefined;
      function ImperativeTimelineComp() {
        tlResult = useTimeline();
        return createElement("div");
      }

      act(() => root.render(createElement(ImperativeTimelineComp)));
      mounted = true;

      expect(tlResult?.timeline).not.toBeNull();
      expect(typeof tlResult?.play).toBe("function");
      expect(typeof tlResult?.seek).toBe("function");

      act(() => root.unmount());
      mounted = false;
    });

    it("prevents stale onComplete and onCancel callbacks after unmount", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      function TimelineComp() {
        const boxRef = useRef<HTMLDivElement>(null);
        useTimeline((tl) => {
          tl.add({ at: 0, target: boxRef, properties: { opacity: [0, 1] }, options: { duration: 100 } });
        }, { onComplete, onCancel, autoplay: true });
        return createElement("div", { ref: boxRef });
      }

      act(() => root.render(createElement(TimelineComp)));
      mounted = true;

      act(() => flushFrames(0));
      clockTime = 50;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      // Unmount midway
      act(() => root.unmount());
      mounted = false;

      // Active timeline was cancelled on unmount, but onComplete must not be called
      expect(onCancel).toHaveBeenCalledTimes(1);

      clockTime = 200;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });
      act(() => flushFrames(200));

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Reveal and AnimatedText", () => {
    it("survives callback ref throwing during unmount without skipping internal teardown", () => {
      const errorThrowingRef = (node: HTMLDivElement | null) => {
        if (node === null) throw new Error("Faulty consumer ref");
      };

      act(() => {
        root.render(createElement(Reveal, { ref: errorThrowingRef, children: "Hello" }));
      });
      mounted = true;

      expect(FakeIntersectionObserver.instances).toHaveLength(1);
      const obs = FakeIntersectionObserver.instances[0];

      // Unmounting does not throw despite the consumer ref callback throwing
      expect(() => {
        act(() => root.unmount());
      }).not.toThrow();
      mounted = false;

      expect(obs.disconnect).toHaveBeenCalled();
    });

    it("AnimatedText cleanly tears down previous effect before mounting new effect", () => {
      function SwitcherComp({ effectType }: { effectType: "typewriter" | "gradient" }) {
        if (effectType === "typewriter") {
          return createElement(AnimatedText, { text: "Hello", effect: "typewriter" });
        }
        return createElement(AnimatedText, { text: "World", effect: "gradient" });
      }

      act(() => root.render(createElement(SwitcherComp, { effectType: "typewriter" })));
      mounted = true;

      // Switch to gradient
      act(() => root.render(createElement(SwitcherComp, { effectType: "gradient" })));

      // Outer spans should still exist
      expect(host.querySelector("[aria-label='World']")).not.toBeNull();

      act(() => root.unmount());
      mounted = false;
    });
  });
});
