// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createMotionFrameScheduler, resizeCanvasToElement } from "../src/backgrounds/internal/canvas-lifecycle.js";
import type { CanvasBackgroundState } from "../src/backgrounds/internal/canvas-lifecycle.js";
import { acquirePointerCapture, releasePointerCapture } from "../src/core/pointer-capture.js";
import { animate } from "../src/core/animate.js";
import { magnetic } from "../src/effects/magnetic.js";
import { drag } from "../src/effects/drag.js";
import { drawSVG } from "../src/effects/draw-svg.js";
import { AnimatedText } from "../src/react.js";

describe("Cross-Browser, Accessibility & Device Validation", () => {
  let originalDpr: number | undefined;
  let originalHidden: boolean;

  beforeEach(() => {
    originalDpr = window.devicePixelRatio;
    originalHidden = document.hidden;
  });

  afterEach(() => {
    if (originalDpr !== undefined) {
      window.devicePixelRatio = originalDpr;
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Device & High-DPI Adaptation", () => {
    it("clamps devicePixelRatio between 1 and 2 to preserve mobile performance and memory", () => {
      window.devicePixelRatio = 3.5; // e.g. High-density Super Retina display

      const canvas = document.createElement("canvas");
      const context = {
        setTransform: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      const state: CanvasBackgroundState = {
        element: document.createElement("div"),
        canvas,
        context,
        width: 0,
        height: 0,
      };

      resizeCanvasToElement(state, 400, 300);

      // Width and height should be scaled by dpr clamped to 2 (400 * 2 = 800, 300 * 2 = 600)
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

      // When DPR is low (< 1, e.g. extreme browser zoom out)
      window.devicePixelRatio = 0.5;
      resizeCanvasToElement(state, 400, 300);
      // DPR clamped to at least 1: 400 * 1 = 400, 300 * 1 = 300
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(300);
      expect(context.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    });

    it("handles repeated resize calls without cumulative scale drift", () => {
      window.devicePixelRatio = 2;
      const canvas = document.createElement("canvas");
      const context = { setTransform: vi.fn() } as unknown as CanvasRenderingContext2D;
      const state: CanvasBackgroundState = {
        element: document.createElement("div"),
        canvas,
        context,
        width: 0,
        height: 0,
      };

      resizeCanvasToElement(state, 500, 250);
      expect(canvas.width).toBe(1000);
      expect(canvas.height).toBe(500);

      // Same dimensions should be a no-op and avoid redundant context calls
      (context.setTransform as ReturnType<typeof vi.fn>).mockClear();
      resizeCanvasToElement(state, 500, 250);
      expect(context.setTransform).not.toHaveBeenCalled();
    });
  });

  describe("Background Tab Throttling & Visibility Lifecycle", () => {
    it("pauses animation loop on visibilitychange when document is hidden and resumes when visible", () => {
      let isHidden = false;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => isHidden,
      });

      const rafCallbacks = new Map<number, FrameRequestCallback>();
      let nextRafId = 1;
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        const id = nextRafId++;
        rafCallbacks.set(id, cb);
        return id;
      });
      vi.stubGlobal("cancelAnimationFrame", (id: number) => {
        rafCallbacks.delete(id);
      });

      const update = vi.fn();
      const renderStatic = vi.fn();

      const scheduler = createMotionFrameScheduler({
        speed: 1,
        animated: true,
        errorName: "TestScheduler",
        update,
        renderStatic,
      });

      const dummyState = {};
      scheduler.setVisible(dummyState, true);

      // Scheduler should have requested a RAF
      expect(rafCallbacks.size).toBe(1);

      // Tab hidden
      isHidden = true;
      document.dispatchEvent(new Event("visibilitychange"));

      // Active RAF should be cancelled to save battery and GPU cycles
      expect(rafCallbacks.size).toBe(0);

      // Tab visible again
      isHidden = false;
      document.dispatchEvent(new Event("visibilitychange"));

      // Scheduler resumes
      expect(rafCallbacks.size).toBe(1);

      scheduler.destroy();
      expect(rafCallbacks.size).toBe(0);
    });
  });

  describe("Pointer, Touch & Defensive Fallbacks", () => {
    it("manages pointer capture safely across browser differences", () => {
      const element = document.createElement("div");
      element.setPointerCapture = vi.fn();
      element.releasePointerCapture = vi.fn();
      element.hasPointerCapture = vi.fn().mockReturnValue(true);

      acquirePointerCapture(element, 1);
      expect(element.setPointerCapture).toHaveBeenCalledWith(1);

      // Calling releasePointerCapture releases when ref count reaches 0
      releasePointerCapture(element, 1);
      expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it("survives environments where setPointerCapture throws or is unsupported", () => {
      const element = document.createElement("div");
      element.setPointerCapture = () => {
        throw new Error("InvalidPointerId");
      };

      expect(() => acquirePointerCapture(element, 99)).not.toThrow();
    });

    it("sets touch-action: none on drag elements and restores original style on destroy", () => {
      const el = document.createElement("div");
      const setPropertySpy = vi.spyOn(el.style, "setProperty");
      const removePropertySpy = vi.spyOn(el.style, "removeProperty");
      document.body.appendChild(el);

      const controls = drag(el);
      expect(setPropertySpy).toHaveBeenCalledWith("touch-action", "none");

      controls.destroy();
      expect(removePropertySpy).toHaveBeenCalledWith("touch-action");
      el.remove();
    });

    it("magnetic ignores touch pointer events to prevent mobile scrolling interference", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);

      const controls = magnetic(el, { duration: 0 });

      // Emulate touch pointer
      const touchEvent = new Event("pointermove");
      Object.assign(touchEvent, { pointerType: "touch", clientX: 100, clientY: 100 });
      el.dispatchEvent(touchEvent);

      // Transform shouldn't be touched by touch pointers
      expect(el.style.transform).toBe("");

      controls.destroy();
      el.remove();
    });
  });

  describe("Accessibility & Screen Reader Semantics", () => {
    it("renders AnimatedText with full text in aria-label and hides animated characters with aria-hidden", () => {
      const html = renderToString(
        createElement(AnimatedText, {
          text: "Accessible Motion Toolkit",
          effect: "scramble",
        }),
      );

      // Accessible container has aria-label
      expect(html).toContain('aria-label="Accessible Motion Toolkit"');
      // Inner animated container has aria-hidden="true" to prevent screen reader garbling
      expect(html).toContain('aria-hidden="true"');
    });

    it("preserves element focus outline styles during transform composition", () => {
      const el = document.createElement("button");
      el.style.outline = "2px solid blue";
      document.body.appendChild(el);

      const controls = magnetic(el);
      // Simulate pointer movement
      const moveEvent = new Event("pointermove");
      Object.assign(moveEvent, { pointerType: "mouse", clientX: 50, clientY: 50 });
      el.dispatchEvent(moveEvent);

      // Outline should be preserved intact
      expect(el.style.outline).toBe("2px solid blue");

      controls.destroy();
      expect(el.style.outline).toBe("2px solid blue");
      el.remove();
    });

    it("immediately settles animations to target values when prefersReducedMotion is true", async () => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const el = document.createElement("div");
      document.body.appendChild(el);

      await new Promise<void>((resolve) => {
        animate(el, { opacity: [0, 1] }, { duration: 1000, onComplete: resolve });
      });

      expect(el.style.opacity).toBe("1");
      el.remove();
    });

    it("settles in-flight infinite repeating animations when reduced motion preference turns on dynamically", async () => {
      let isReduced = false;
      const listeners = new Set<(event: { matches: boolean }) => void>();

      vi.stubGlobal("matchMedia", (query: string) => ({
        get matches() {
          return query.includes("prefers-reduced-motion") && isReduced;
        },
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_type: string, handler: (event: { matches: boolean }) => void) => {
          listeners.add(handler);
        },
        removeEventListener: (_type: string, handler: (event: { matches: boolean }) => void) => {
          listeners.delete(handler);
        },
        dispatchEvent: vi.fn(),
      }));

      const el = document.createElement("div");
      document.body.appendChild(el);

      let completed = false;
      const animation = animate(
        el,
        { opacity: [0, 1] },
        {
          duration: 500,
          repeat: Infinity,
          onComplete: () => {
            completed = true;
          },
        },
      );

      // Trigger reduced motion preference at runtime
      isReduced = true;
      for (const handler of listeners) {
        handler({ matches: true });
      }

      // Wait a moment for schedule to settle
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(completed).toBe(true);
      expect(el.style.opacity).toBe("1");

      animation.cancel();
      el.remove();
    });
  });

  describe("SVG & Cross-Browser Geometry Support", () => {
    it("supports SVG elements when getTotalLength is present", () => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.getTotalLength = () => 150;
      svg.appendChild(path);
      document.body.appendChild(svg);

      const controls = drawSVG(path, { duration: 100 });
      expect(controls).toBeDefined();
      expect(typeof controls.destroy).toBe("function");

      controls.destroy();
      svg.remove();
    });
  });
});
