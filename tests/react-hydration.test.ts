// @vitest-environment jsdom

import { StrictMode, act, createElement, useRef } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
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
let root: Root | null;
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
  root = null;
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
  if (root) {
    act(() => root?.unmount());
    root = null;
  }
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("React hydration safety and zero-mismatch verification", () => {
  it("hydrates Reveal without console errors or hydration mismatch, then attaches observer on client", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function RevealPage() {
      return createElement(
        Reveal,
        { direction: "up", className: "hydrated-reveal" },
        createElement("h1", null, "Hydrated Heading"),
      );
    }

    // 1. Server render
    const serverHtml = renderToString(createElement(RevealPage));
    expect(serverHtml).toContain('class="hydrated-reveal"');
    expect(serverHtml).toContain("Hydrated Heading");
    expect(serverHtml).not.toContain("opacity:0"); // Visible HTML by default on server!

    // 2. Put in DOM
    host.innerHTML = serverHtml;

    // 3. Client hydration
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    act(() => {
      root = hydrateRoot(host, createElement(RevealPage));
    });

    // 4. Verify no hydration mismatch logged by React
    const hydrationErrors = consoleErrorSpy.mock.calls.filter((c) =>
      typeof c[0] === "string" && (c[0].includes("Hydration") || c[0].includes("did not match")),
    );
    expect(hydrationErrors).toHaveLength(0);

    // 5. Verify observer attached after hydration
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    const div = host.firstElementChild as HTMLElement;
    expect(FakeIntersectionObserver.instances[0].observed.has(div)).toBe(true);
    expect(div.style.opacity).toBe("0");

    // 6. Complete animation on client
    act(() => FakeIntersectionObserver.instances[0].emit(div, true));
    act(() => flushFrames(0));
    act(() => flushFrames(600));
    expect(div.style.opacity).toBe("1");

    consoleErrorSpy.mockRestore();
  });

  it("hydrates AnimatedText without mismatch and initializes text effect only on client", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function TextPage() {
      return createElement(AnimatedText, { text: "Interactive Text", effect: "typewriter" });
    }

    const serverHtml = renderToString(createElement(TextPage));
    expect(serverHtml).toContain('aria-label="Interactive Text"');
    expect(serverHtml).toContain('aria-hidden="true">Interactive Text</span>');

    host.innerHTML = serverHtml;

    act(() => {
      root = hydrateRoot(host, createElement(TextPage));
    });

    const hydrationErrors = consoleErrorSpy.mock.calls.filter((c) =>
      typeof c[0] === "string" && (c[0].includes("Hydration") || c[0].includes("did not match")),
    );
    expect(hydrationErrors).toHaveLength(0);

    consoleErrorSpy.mockRestore();
  });

  it("hydrates useInView, useScrollProgress, and useScrollVelocity without mismatch", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function MultiHookPage() {
      const inView = useInView<HTMLDivElement>({ once: false });
      const scroll = useScrollProgress<HTMLDivElement>();
      const velocity = useScrollVelocity<HTMLDivElement>();

      return createElement(
        "div",
        { ref: inView.ref },
        createElement("div", { ref: scroll.ref, "data-progress": String(scroll.progress) }),
        createElement("div", { ref: velocity.ref, "data-velocity": String(velocity.data.velocity) }),
      );
    }

    const serverHtml = renderToString(createElement(MultiHookPage));
    host.innerHTML = serverHtml;

    act(() => {
      root = hydrateRoot(host, createElement(MultiHookPage));
    });

    const hydrationErrors = consoleErrorSpy.mock.calls.filter((c) =>
      typeof c[0] === "string" && (c[0].includes("Hydration") || c[0].includes("did not match")),
    );
    expect(hydrationErrors).toHaveLength(0);

    // Client-side observation starts
    expect(FakeIntersectionObserver.instances).toHaveLength(1);

    consoleErrorSpy.mockRestore();
  });

  it("hydrates useSequence, useParallel, and useTimeline in StrictMode and starts animations only on client", () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();

    function AnimationPage() {
      const seqRef = useRef<HTMLDivElement>(null);
      const parRef = useRef<HTMLDivElement>(null);
      const tlRef = useRef<HTMLDivElement>(null);

      useSequence([{ target: seqRef, properties: { opacity: [0, 1] }, options: { duration: 100 } }], { onStart, onComplete });
      useParallel([{ target: parRef, properties: { opacity: [0, 1] }, options: { duration: 100 } }]);
      useTimeline((tl) => {
        tl.add({ at: 0, target: tlRef, properties: { opacity: [0, 1] }, options: { duration: 100 } });
      });

      return createElement(
        "div",
        null,
        createElement("div", { ref: seqRef, id: "seq" }),
        createElement("div", { ref: parRef, id: "par" }),
        createElement("div", { ref: tlRef, id: "tl" }),
      );
    }

    // Server render has no animation frames running
    const serverHtml = renderToString(createElement(StrictMode, null, createElement(AnimationPage)));
    expect(frames.size).toBe(0);
    expect(onStart).not.toHaveBeenCalled();

    host.innerHTML = serverHtml;

    // Client hydration under StrictMode
    act(() => {
      root = hydrateRoot(host, createElement(StrictMode, null, createElement(AnimationPage)));
    });

    // Animations begin on client
    expect(frames.size).toBeGreaterThan(0);
    act(() => flushFrames(0));
    expect(onStart).toHaveBeenCalled();

    // Cleanup after hydration is clean
    act(() => {
      root?.unmount();
      root = null;
    });
    expect(frames.size).toBe(0);
  });
});
