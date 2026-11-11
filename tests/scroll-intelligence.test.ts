import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import {
  SCROLL_ANIMATION_TYPES,
  SCROLL_PROGRESS_MODES,
  SCROLL_INTELLIGENCE_VERSION,
  classifyScrollIntent,
  generateScrollPlan,
  scrollIntelligenceRuntime,
  SCROLL_INTELLIGENCE_CAPABILITY,
  getScrollIntelligenceCapability,
  listSupportedScrollAnimationTypes,
  listSupportedScrollProgressModes,
  type ScrollAnimationType,
} from "../src/catalogue.js";

import { createScrollSceneController } from "../src/3d/scroll/controller.js";
import { createTimeline } from "../src/core/animation-timeline.js";

import {
  useScrollIntelligence,
  useScrollAnimation,
  useParallax,
  ScrollReveal,
  ScrollProgress,
  ScrollScene,
} from "../src/react.js";

class FakeDOMElement {
  style: Record<string, string> = {};
  getBoundingClientRect() {
    return {
      top: 200,
      bottom: 600,
      left: 0,
      right: 400,
      width: 400,
      height: 400,
      x: 0,
      y: 200,
      toJSON: () => {},
    };
  }
}

describe("Prompt 84 — Intelligent Scroll Animation Generation", () => {
  describe("1. Scroll Intent Classification", () => {
    it("recognizes explicit scroll animation intent types", () => {
      expect(SCROLL_ANIMATION_TYPES).toHaveLength(8);

      const tests: Array<{ text: string; expected: ScrollAnimationType }> = [
        { text: "reveal elements when scrolled into view", expected: "reveal" },
        { text: "create a multi-layer parallax effect with slow background", expected: "parallax" },
        { text: "pinned section storytelling with sticky cards", expected: "sticky-story" },
        { text: "reading indicator scroll progress bar across header", expected: "progress-indicator" },
        { text: "staggered list animation on scroll cascade", expected: "stagger-sequence" },
        { text: "horizontal scrolling panel carousel", expected: "horizontal-section" },
        { text: "scrub kinetic typography characters on scroll", expected: "scroll-typography" },
        { text: "synchronize 3d camera orbit with scroll position", expected: "scroll-3d-sync" },
      ];

      for (const t of tests) {
        const classified = classifyScrollIntent(t.text);
        expect(classified.type).toBe(t.expected);
        expect(classified.confidence).toBeGreaterThan(0.5);
        expect(classified.matchedKeywords.length).toBeGreaterThan(0);
      }
    });

    it("falls back gracefully when input text has no matching keywords", () => {
      const classified = classifyScrollIntent("random unrelated text with no motion instructions");
      expect(classified.type).toBe("reveal");
      expect(classified.confidence).toBe(0.4);
      expect(classified.matchedKeywords).toEqual([]);
    });
  });

  describe("2. Scroll Plan Generation", () => {
    it("generates deterministic scroll plans for all 8 animation types", () => {
      for (const type of SCROLL_ANIMATION_TYPES) {
        const result = generateScrollPlan({ type });
        expect(result.plan).toBeDefined();
        expect(result.plan.type).toBe(type);
        expect(result.plan.startOffset).toBeDefined();
        expect(result.plan.endOffset).toBeDefined();
        expect(result.plan.properties).toBeDefined();
        expect(result.plan.compatibilityScore).toBeGreaterThanOrEqual(80);
        expect(result.explanation).toContain(type);
        expect(result.alternatives.length).toBeGreaterThan(0);
      }
    });

    it("respects user intent string and automatically classifies it", () => {
      const result = generateScrollPlan({
        intent: "pin narrative cards during user scroll",
      });
      expect(result.plan.type).toBe("sticky-story");
      expect(result.plan.progressMode).toBe("container");
      expect(result.plan.clamp).toBe(true);
    });

    it("supports component category adaptations (hero, card, typography)", () => {
      const heroResult = generateScrollPlan({
        type: "parallax",
        componentType: "hero",
      });
      expect(heroResult.plan.properties.transform).toBeDefined();

      const textResult = generateScrollPlan({
        componentType: "typography",
      });
      expect(textResult.plan.type).toBe("scroll-typography");
    });

    it("adapts easing and properties according to motionDNA and visualStyle", () => {
      const editorialResult = generateScrollPlan({
        type: "reveal",
        visualStyle: "editorial",
        motionDNA: "editorial-flow",
      });
      expect(editorialResult.plan.easing).toBe("cubic-bezier(0.25, 1, 0.5, 1)");

      const brutalistResult = generateScrollPlan({
        type: "reveal",
        visualStyle: "brutalist",
      });
      expect(brutalistResult.plan.easing).toBe("steps(4, jump-end)");
    });

    it("applies reduced-motion safe properties when reducedMotion is true", () => {
      const normalResult = generateScrollPlan({
        type: "reveal",
        reducedMotion: false,
      });
      expect(normalResult.plan.properties.transform).toBeDefined();

      const safeResult = generateScrollPlan({
        type: "reveal",
        reducedMotion: true,
      });
      expect(safeResult.plan.properties.transform).toBeUndefined();
      expect(safeResult.plan.properties.opacity).toEqual([0, 1]);
      expect(safeResult.plan.reducedMotionProperties).toBeDefined();
      expect(safeResult.warnings.some((w) => w.toLowerCase().includes("reduced motion"))).toBe(true);
    });

    it("allows custom offsets, directions, and progress modes to override defaults", () => {
      const result = generateScrollPlan({
        type: "reveal",
        startOffset: "center center",
        endOffset: "top top",
        progressMode: "container",
        direction: "both",
        stagger: 0.12,
      });

      expect(result.plan.startOffset).toBe("center center");
      expect(result.plan.endOffset).toBe("top top");
      expect(result.plan.progressMode).toBe("container");
      expect(result.plan.stagger).toBe(0.12);
    });
  });

  describe("3. Scroll Runtime Engine", () => {
    let mockElement: HTMLElement;
    let listeners: Map<string, Set<Function>>;

    beforeEach(() => {
      listeners = new Map();

      const fakeWindow = {
        scrollY: 100,
        innerHeight: 800,
        addEventListener: (type: string, fn: Function) => {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type)!.add(fn);
        },
        removeEventListener: (type: string, fn: Function) => {
          listeners.get(type)?.delete(fn);
        },
      };

      const fakeDoc = {
        documentElement: { scrollHeight: 2000 },
        visibilityState: "visible",
        addEventListener: (type: string, fn: Function) => {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type)!.add(fn);
        },
        removeEventListener: (type: string, fn: Function) => {
          listeners.get(type)?.delete(fn);
        },
        dispatchEvent: (event: any) => {
          listeners.get(event.type)?.forEach((fn) => fn(event));
        },
      };

      vi.stubGlobal("window", fakeWindow);
      vi.stubGlobal("document", fakeDoc);
      vi.stubGlobal("requestAnimationFrame", (fn: Function) => {
        fn();
        return 1;
      });
      vi.stubGlobal("cancelAnimationFrame", () => {});

      mockElement = new FakeDOMElement() as unknown as HTMLElement;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("registers scroll listeners and returns controls", () => {
      const plan = generateScrollPlan({ type: "reveal" }).plan;
      const onProgress = vi.fn();
      const onEnter = vi.fn();
      const onLeave = vi.fn();

      const controls = scrollIntelligenceRuntime.register(plan, mockElement, {
        onProgress,
        onEnter,
        onLeave,
      });

      expect(controls).toBeDefined();
      expect(typeof controls.destroy).toBe("function");
      expect(typeof controls.pause).toBe("function");
      expect(typeof controls.resume).toBe("function");
      expect(typeof controls.getState).toBe("function");

      const state = controls.getState();
      expect(typeof state.progress).toBe("number");
      expect(typeof state.inView).toBe("boolean");
      expect(["down", "up"]).toContain(state.direction);

      controls.pause();
      controls.resume();
      controls.destroy();
    });

    it("cleans up listeners cleanly when destroy is called", () => {
      const plan = generateScrollPlan({ type: "parallax" }).plan;
      const controls = scrollIntelligenceRuntime.register(plan, mockElement);

      controls.destroy();
      // Repeating destroy should be idempotent and not throw
      expect(() => controls.destroy()).not.toThrow();
    });

    it("handles visibilitychange events gracefully without errors", () => {
      const plan = generateScrollPlan({ type: "sticky-story" }).plan;
      const controls = scrollIntelligenceRuntime.register(plan, mockElement);

      // Trigger document visibility change
      listeners.get("visibilitychange")?.forEach((fn) => fn({ type: "visibilitychange" }));

      controls.destroy();
    });
  });

  describe("4. 2D to 3D Synchronization Bridge", () => {
    it("coordinates scroll intelligence progress with ScrollSceneController", () => {
      const controller = createScrollSceneController({
        timeline: {
          id: "test-timeline-3d",
          keyframes: [
            { progress: 0 },
            { progress: 1 },
          ],
        },
      });

      const result = generateScrollPlan({
        type: "scroll-3d-sync",
        sync3DController: controller,
      });

      expect(result.plan.type).toBe("scroll-3d-sync");
      expect(result.plan.sync3DTimelineId).toBeDefined();
      expect(result.explanation).toContain("scroll-3d-sync");

      controller.destroy();
    });
  });

  describe("5. React Hooks & Components (SSR & StrictMode)", () => {
    it("renders <ScrollReveal /> under SSR and with child render function", () => {
      const staticHtml = renderToString(
        createElement(
          ScrollReveal,
          { pattern: "reveal", className: "reveal-box" },
          (state) => createElement("span", null, `Progress: ${state.progress}`)
        )
      );
      expect(staticHtml).toContain("reveal-box");
      expect(staticHtml).toContain("data-scroll-reveal");
    });

    it("renders <ScrollProgress /> under SSR", () => {
      const staticHtml = renderToString(
        createElement(ScrollProgress, {
          color: "#ef4444",
          height: 6,
          className: "top-progress",
        })
      );
      expect(staticHtml).toContain("top-progress");
      expect(staticHtml).toContain("data-scroll-progress-bar");
    });

    it("renders <ScrollScene /> under SSR with render prop", () => {
      const staticHtml = renderToString(
        createElement(
          ScrollScene,
          { className: "scene-3d-container" },
          (p) => createElement("div", null, `3D Progress: ${p}`)
        )
      );
      expect(staticHtml).toContain("scene-3d-container");
      expect(staticHtml).toContain("data-scroll-scene");
    });

    it("supports React StrictMode rendering without leaking or crashing", () => {
      const staticHtml = renderToString(
        createElement(
          StrictMode,
          null,
          createElement(ScrollReveal, { pattern: "stagger-sequence" }, "Item 1"),
          createElement(ScrollProgress, null),
          createElement(ScrollScene, null, "3D Viewport")
        )
      );
      expect(staticHtml).toContain("Item 1");
      expect(staticHtml).toContain("3D Viewport");
    });
  });

  describe("6. AI Capabilities and Discovery Metadata", () => {
    it("exports version, supported types, and modes", () => {
      expect(SCROLL_INTELLIGENCE_VERSION).toBe("1.0.0");
      expect(listSupportedScrollAnimationTypes()).toHaveLength(8);
      expect(listSupportedScrollProgressModes()).toHaveLength(3);
    });

    it("conforms to AI Capability Specification", () => {
      const cap = getScrollIntelligenceCapability();
      expect(cap.id).toBe("scroll-intelligence");
      expect(cap.version).toBe("1.0.0");
      expect(cap.features.length).toBeGreaterThan(0);
      expect(cap.supportedTypes).toHaveLength(8);
      expect(SCROLL_INTELLIGENCE_CAPABILITY).toEqual(cap);
    });
  });
});
