import { describe, it, expect, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import {
  TRANSITION_PATTERNS,
  TRANSITION_DIRECTIONS,
  createEntranceTransition,
  createExitTransition,
  createPageTransition,
  generateTransitionProperties,
  sharedElementRegistry,
  TransitionController,
  AUTOMATIC_TRANSITION_CAPABILITY,
  PAGE_TRANSITION_CAPABILITY,
  getAvailableTransitionPatterns,
  getAvailableTransitionDirections,
  getAvailableTransitionModes,
  registerTransitionCapabilities,
  type TransitionPattern,
  type TransitionDirection,
} from "../src/catalogue.js";

import {
  useEntrance,
  useExit,
  useMotionTransition,
  usePageTransition,
  useTransition,
  Transition,
  TransitionGroup,
} from "../src/react.js";

describe("Prompt 83 — Automatic Entrance, Exit & Page Transitions", () => {
  describe("1. Transition Pattern Generation", () => {
    it("generates entrance and exit definitions for all supported patterns", () => {
      expect(TRANSITION_PATTERNS).toHaveLength(8);

      for (const pattern of TRANSITION_PATTERNS) {
        const enter = createEntranceTransition({ pattern });
        expect(enter.pattern).toBe(pattern);
        expect(enter.duration).toBeGreaterThan(0);
        expect(enter.properties).toBeDefined();

        const exit = createExitTransition({ pattern });
        expect(exit.pattern).toBe(pattern);
        expect(exit.duration).toBeGreaterThan(0);
        expect(exit.properties).toBeDefined();
      }
    });

    it("generates direction-aware slide transformations", () => {
      const enterUp = generateTransitionProperties("slide", "enter", { direction: "up", distance: 30 });
      expect(enterUp.transform?.[0]).toContain("translateY(30px)");
      expect(enterUp.transform?.[1]).toContain("translateY(0px)");

      const enterDown = generateTransitionProperties("slide", "enter", { direction: "down", distance: 40 });
      expect(enterDown.transform?.[0]).toContain("translateY(-40px)");
      expect(enterDown.transform?.[1]).toContain("translateY(0px)");

      const enterLeft = generateTransitionProperties("slide", "enter", { direction: "left", distance: 50 });
      expect(enterLeft.transform?.[0]).toContain("translateX(50px)");
      expect(enterLeft.transform?.[1]).toContain("translateX(0px)");

      const exitLeft = generateTransitionProperties("slide", "exit", { direction: "left", distance: 50 });
      expect(exitLeft.transform?.[0]).toContain("translateX(0px)");
      expect(exitLeft.transform?.[1]).toContain("translateX(-50px)");
    });

    it("supports directional clip-reveal patterns", () => {
      const clipTop = generateTransitionProperties("clip-reveal", "enter", { clipDirection: "top" });
      expect(clipTop.clipPath?.[0]).toBe("inset(0 0 100% 0)");
      expect(clipTop.clipPath?.[1]).toBe("inset(0 0 0 0)");

      const clipCenter = generateTransitionProperties("clip-reveal", "enter", { clipDirection: "center" });
      expect(clipCenter.clipPath?.[0]).toContain("circle(0%");
      expect(clipCenter.clipPath?.[1]).toContain("circle(100%");
    });
  });

  describe("2. Intelligent Pacing & Motion DNA Integration", () => {
    it("adapts transition pacing and easing based on Motion DNA personality", () => {
      const snappy = createEntranceTransition({ motionDNA: "snappy" });
      const calm = createEntranceTransition({ motionDNA: "calm" });

      expect(snappy.duration).toBeLessThan(calm.duration);
      expect(snappy.easing).toBe("easeOutQuad");
      expect(calm.easing).toBe("easeInOutSine");
    });

    it("integrates with Animation Intelligence for component-aware timing", () => {
      const modalEnter = createEntranceTransition({
        componentType: "modal",
        pattern: "scale",
      });
      expect(modalEnter.duration).toBeGreaterThan(0);
      expect(modalEnter.properties.transform).toBeDefined();
    });

    it("provides safe fallback properties when reduced motion is preferred", () => {
      const enter = createEntranceTransition({
        pattern: "slide",
        respectReducedMotion: true,
      });

      expect(enter.respectReducedMotion).toBe(true);
      expect(enter.reducedMotionProperties).toEqual({ opacity: [0, 1] });
    });
  });

  describe("3. Page Transition Sequencing & Direction Inversion", () => {
    it("inverts slide direction for backward navigation", () => {
      const forward = createPageTransition(
        { pattern: "slide", directionAware: true },
        { direction: "forward" }
      );
      expect(forward.enter.properties.transform?.[0]).toContain("translateX(24px)");
      expect(forward.exit.properties.transform?.[1]).toContain("translateX(-24px)");

      const backward = createPageTransition(
        { pattern: "slide", directionAware: true },
        { direction: "backward" }
      );
      expect(backward.enter.properties.transform?.[0]).toContain("translateX(-24px)");
      expect(backward.exit.properties.transform?.[1]).toContain("translateX(24px)");
    });

    it("configures out-in, together, and in-out transition modes", () => {
      const outIn = createPageTransition({ mode: "out-in" });
      expect(outIn.mode).toBe("out-in");

      const together = createPageTransition({ mode: "together" });
      expect(together.mode).toBe("together");
    });
  });

  describe("4. Shared Element FLIP Motion", () => {
    it("computes inverse transform deltas between source and target rects", () => {
      const source = { top: 100, left: 50, width: 200, height: 100 };
      const target = { top: 200, left: 150, width: 400, height: 200 };

      const props = sharedElementRegistry.computeTransform(source, target);
      expect(props.transform).toBeDefined();

      const fromTransform = props.transform?.[0] as string;
      expect(fromTransform).toContain("translate3d(-100px, -100px, 0px)");
      expect(fromTransform).toContain("scale(0.5, 0.5)");

      const toTransform = props.transform?.[1] as string;
      expect(toTransform).toBe("translate3d(0px, 0px, 0px) scale(1, 1)");
    });

    it("registers and captures bounding geometry cleanly", () => {
      sharedElementRegistry.clear();
      sharedElementRegistry.captureRect("hero-img", {
        top: 20,
        left: 30,
        width: 100,
        height: 80,
      });

      const retrieved = sharedElementRegistry.getCapturedRect("hero-img");
      expect(retrieved).toEqual({ top: 20, left: 30, width: 100, height: 80 });

      sharedElementRegistry.unregister("hero-img");
      expect(sharedElementRegistry.getCapturedRect("hero-img")).toBeNull();
    });
  });

  describe("5. Transition Controller Lifecycle & Interruption", () => {
    it("manages transition state progression and handles cancel/destroy", () => {
      let currentState = "";
      const controller = new TransitionController({
        onStateChange: (s) => {
          currentState = s;
        },
      });

      expect(controller.getState()).toBe("unmounted");

      class FakeStyle {
        values = new Map<string, string>();
        setProperty(k: string, v: string) { this.values.set(k, v); }
        getPropertyValue(k: string) { return this.values.get(k) ?? ""; }
        removeProperty(k: string) { this.values.delete(k); }
      }
      class FakeEl {
        style = new FakeStyle();
      }
      vi.stubGlobal("HTMLElement", FakeEl);
      vi.stubGlobal("requestAnimationFrame", (cb: Function) => setTimeout(cb, 16));
      vi.stubGlobal("cancelAnimationFrame", (id: any) => clearTimeout(id));

      const mockTarget = new FakeEl() as unknown as HTMLElement;

      controller.enter(mockTarget);
      expect(controller.getState()).toBe("entering");

      controller.cancel();
      controller.destroy();
      expect(controller.getState()).toBe("unmounted");

      vi.unstubAllGlobals();
    });
  });

  describe("6. AI Registry Integration & Capability Descriptors", () => {
    it("exposes machine-readable discovery helpers and capability descriptors", () => {
      expect(getAvailableTransitionPatterns()).toHaveLength(8);
      expect(getAvailableTransitionDirections()).toHaveLength(8);
      expect(getAvailableTransitionModes()).toContain("out-in");

      expect(AUTOMATIC_TRANSITION_CAPABILITY.id).toBe("automatic-transition");
      expect(PAGE_TRANSITION_CAPABILITY.id).toBe("page-transition");

      const mockRegistry = {
        caps: [] as any[],
        registerCapability(c: any) {
          this.caps.push(c);
        },
      };

      registerTransitionCapabilities(mockRegistry);
      expect(mockRegistry.caps).toHaveLength(2);
    });
  });

  describe("7. React Integrations (Hooks & Components)", () => {
    function TransitionTestView({ show = true }: { show?: boolean }) {
      return createElement(
        Transition,
        {
          show,
          pattern: "scale",
          className: "test-transition-box",
        },
        (state) => createElement("span", null, `Current: ${state}`)
      );
    }

    it("renders Transition component in SSR without errors", () => {
      const html = renderToString(createElement(TransitionTestView, { show: true }));
      expect(html).toContain('data-transition-pattern="scale"');
      expect(html).toContain("Current: entering");
    });

    it("renders TransitionGroup with coordinated stagger in SSR", () => {
      const html = renderToString(
        createElement(
          TransitionGroup,
          { pattern: "slide", stagger: 80 },
          createElement("div", { key: "item-1" }, "Item 1"),
          createElement("div", { key: "item-2" }, "Item 2")
        )
      );

      expect(html).toContain('data-transition-group="true"');
      expect(html).toContain('data-stagger="80"');
      expect(html).toContain("Item 1");
      expect(html).toContain("Item 2");
    });

    it("renders under React StrictMode without throwing", () => {
      const html = renderToString(
        createElement(StrictMode, null, createElement(TransitionTestView))
      );
      expect(html).toContain("Current: entering");
    });
  });
});
