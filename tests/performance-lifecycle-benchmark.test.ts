// @vitest-environment jsdom

import { act, createElement, StrictMode, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  animate,
  animateParallel,
  animateSequence,
  createTimeline,
} from "../src/index.js";
import { magnetic } from "../src/effects/magnetic.js";
import { tilt } from "../src/effects/tilt.js";
import { drag } from "../src/effects/drag.js";
import {
  createMotionFrameScheduler,
  resizeCanvasToElement,
  releaseBackgroundCanvas,
  acquireBackgroundTarget,
  releaseBackgroundTarget,
} from "../src/backgrounds/internal/canvas-lifecycle.js";
import type { CanvasBackgroundState } from "../src/backgrounds/internal/canvas-lifecycle.js";
import {
  AnimatedText,
  Reveal,
  useAnimate,
  useInView,
  useParallel,
  useSequence,
  useTimeline,
} from "../src/react.js";

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
}

describe("Performance, Memory & Lifecycle Benchmarking", () => {
  let host: HTMLDivElement;
  let root: Root;
  let clockTime: number;
  let nextFrameId: number;
  let frames: Map<number, FrameRequestCallback>;
  let activeControls: Array<{ cancel(): void }>;

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
    clockTime = 0;
    nextFrameId = 1;
    frames = new Map();
    activeControls = [];
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
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  });

  afterEach(() => {
    for (const ctrl of activeControls) {
      try {
        ctrl.cancel();
      } catch {}
    }
    activeControls = [];
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Core Animation Shared RAF Scheduling", () => {
    it("batches 100 simultaneous animations into a single shared RAF loop", () => {
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        return el;
      });

      const animations = elements.map((el) =>
        animate(el, { opacity: [0, 1] }, { duration: 300 })
      );
      activeControls.push(...animations);

      // Even with 100 active animations, exactly 1 shared RAF should be requested
      expect(frames.size).toBe(1);

      // Frame 1: Establish baseline time
      flushFrames(0);
      expect(frames.size).toBe(1);

      // Frame 2: Mid-animation tick
      flushFrames(150);
      expect(frames.size).toBe(1);

      // Frame 3: Completion frame tick
      flushFrames(350);
      // Once all 100 animations finish, the shared RAF loop must automatically terminate
      expect(frames.size).toBe(0);

      elements.forEach((el) => el.remove());
    });

    it("immediately cancels 100 in-flight animations and tears down the shared frame loop", () => {
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        return el;
      });

      const animations = elements.map((el) =>
        animate(el, { opacity: [0, 1] }, { duration: 1000 })
      );
      activeControls.push(...animations);

      expect(frames.size).toBe(1);

      for (const anim of animations) {
        anim.cancel();
      }

      // After cancelling all animations, frame loop should be completely unscheduled
      expect(frames.size).toBe(0);

      elements.forEach((el) => el.remove());
    });

    it("executes 50-step parallel composition cleanly without lingering RAFs", () => {
      const elements = Array.from({ length: 50 }, () => document.createElement("div"));
      const steps = elements.map((el) => ({
        target: el,
        properties: { opacity: [0, 1] },
        options: { duration: 100 },
      }));

      const parallel = animateParallel(steps);
      activeControls.push(parallel);
      expect(frames.size).toBe(1);

      flushFrames(0);
      flushFrames(50);
      flushFrames(150);

      expect(frames.size).toBe(0);
    });

    it("executes 5-step sequence composition cleanly and completes on endpoint", async () => {
      const elements = Array.from({ length: 5 }, () => document.createElement("div"));
      const steps = elements.map((el) => ({
        target: el,
        properties: { opacity: [0, 1] },
        options: { duration: 10 },
      }));

      let finished = false;
      const sequence = animateSequence(steps, {
        onComplete: () => {
          finished = true;
        },
      });
      activeControls.push(sequence);

      for (let i = 0; i < 5; i++) {
        flushFrames(i * 20);
        flushFrames(i * 20 + 10);
      }

      await expect(sequence.finished).resolves.toBeUndefined();
      expect(finished).toBe(true);
      expect(frames.size).toBe(0);
    });
  });

  describe("Interactive Effects Lifecycle & Memory Release", () => {
    it("handles 50 repeated create/destroy cycles of magnetic, tilt, and drag without transform drift", () => {
      const el = document.createElement("div");
      el.style.transform = "scale(1)";
      document.body.appendChild(el);

      for (let i = 0; i < 50; i++) {
        const m = magnetic(el);
        const t = tilt(el);
        const d = drag(el);

        // Destroy in arbitrary order
        d.destroy();
        m.destroy();
        t.destroy();
      }

      // Base transform should remain exactly as initialized
      expect(el.style.transform).toBe("scale(1)");
      el.remove();
    });

    it("releases canvas buffers and target isolation cleanly across repeated cycles", () => {
      window.devicePixelRatio = 2;
      const target = document.createElement("div");
      document.body.appendChild(target);

      for (let i = 0; i < 20; i++) {
        const canvas = document.createElement("canvas");
        const ctx = {
          setTransform: vi.fn(),
        } as unknown as CanvasRenderingContext2D;

        const state: CanvasBackgroundState = {
          element: target,
          canvas,
          context: ctx,
          width: 0,
          height: 0,
        };

        acquireBackgroundTarget(target, canvas);
        resizeCanvasToElement(state, 400, 300);

        expect(canvas.width).toBe(800);
        expect(canvas.height).toBe(600);

        releaseBackgroundCanvas(canvas);
        releaseBackgroundTarget(target, canvas);

        expect(canvas.width).toBe(0);
        expect(canvas.height).toBe(0);
      }

      // Target position and isolation should be restored
      expect(target.style.position).toBe("");
      expect(target.style.isolation).toBe("");
      target.remove();
    });
  });

  describe("React Component & Hook Lifecycle Stress Testing", () => {
    it("undergoes 30 mount and unmount cycles of useAnimate without leaking frames or handlers", () => {
      function AnimateComponent({ active }: { active: boolean }) {
        const { ref, animate: doAnimate } = useAnimate<HTMLDivElement>();
        return createElement(
          "div",
          {
            ref,
            onClick: () => {
              if (active) doAnimate({ opacity: [0, 1] }, { duration: 100 });
            },
          },
          "Animate Component",
        );
      }

      for (let i = 0; i < 30; i++) {
        act(() => {
          root.render(
            createElement(
              StrictMode,
              null,
              createElement(AnimateComponent, { active: true }),
            ),
          );
        });

        // Trigger animation
        const button = host.querySelector("div");
        button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        // Unmount
        act(() => {
          root.render(null);
        });

        // Ensure no pending RAF leaked past unmount
        expect(frames.size).toBe(0);
      }
    });

    it("undergoes 30 mount and unmount cycles of AnimatedText without DOM corruption or leaked observers", () => {
      for (let i = 0; i < 30; i++) {
        act(() => {
          root.render(
            createElement(
              StrictMode,
              null,
              createElement(AnimatedText, {
                text: "Stress Testing Text",
                effect: "scramble",
              }),
            ),
          );
        });

        const span = host.querySelector("span");
        expect(span?.getAttribute("aria-label")).toBe("Stress Testing Text");

        act(() => {
          root.render(null);
        });

        expect(frames.size).toBe(0);
      }
    });

    it("undergoes 30 mount and unmount cycles of Reveal and disconnects all observers cleanly", () => {
      for (let i = 0; i < 30; i++) {
        act(() => {
          root.render(
            createElement(
              StrictMode,
              null,
              createElement(
                Reveal,
                { direction: "up", duration: 200 },
                createElement("p", null, "Revealed Content"),
              ),
            ),
          );
        });

        act(() => {
          root.render(null);
        });
      }

      // All created IntersectionObserver instances must have been disconnected
      for (const instance of FakeIntersectionObserver.instances) {
        expect(instance.disconnect).toHaveBeenCalled();
        expect(instance.observed.size).toBe(0);
      }
    });

    it("undergoes 30 mount and unmount cycles of useTimeline without leaking playback timers or RAFs", () => {
      function TimelineComponent() {
        const targetRef = useState<HTMLDivElement | null>(null);
        useTimeline((tl) => {
          if (targetRef[0]) {
            tl.add({
              target: targetRef[0],
              properties: { opacity: [0, 1] },
              options: { duration: 100 },
            });
          }
        }, { autoplay: true });

        return createElement("div", { ref: (el: HTMLDivElement | null) => targetRef[1](el) });
      }

      for (let i = 0; i < 30; i++) {
        act(() => {
          root.render(
            createElement(
              StrictMode,
              null,
              createElement(TimelineComponent),
            ),
          );
        });

        flushFrames(0);
        flushFrames(50);

        act(() => {
          root.render(null);
        });

        expect(frames.size).toBe(0);
      }
    });
  });

  describe("Memory & Allocation Stress Testing", () => {
    it("survives 500 create/cancel cycles with zero leaked frame scheduler registrations", () => {
      for (let i = 0; i < 500; i++) {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const anim = animate(el, { opacity: [0, 1] }, { duration: 1000 });
        anim.cancel();
        el.remove();
      }

      expect(frames.size).toBe(0);
    });

    it("survives 500 create/complete cycles with zero leaked frame scheduler registrations", () => {
      for (let i = 0; i < 500; i++) {
        const el = document.createElement("div");
        document.body.appendChild(el);
        animate(el, { opacity: [0, 1] }, { duration: 100 });

        // Two ticks settle each 100ms animation
        flushFrames(i * 150);
        flushFrames(i * 150 + 120);

        el.remove();
      }

      expect(frames.size).toBe(0);
    });
  });
});
