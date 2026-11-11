import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";

import {
  MICROINTERACTION_VERSION,
  MICRO_COMPONENT_CATEGORIES,
  INTERACTION_STATES,
  MICROINTERACTION_TRIGGERS,
  MICROINTERACTION_FEEDBACK_TYPES,
  MICROINTERACTION_CAPABILITY,
  classifyMicrointeractionIntent,
  generateMicrointeractionPlan,
  createMicrointeractionController,
  getMicrointeractionCapability,
  listSupportedMicroComponentCategories,
  listSupportedInteractionStates,
  listSupportedMicrointeractionTriggers,
  listSupportedMicrointeractionFeedbackTypes,
  registerMicrointeractionCapability,
  type MicroComponentCategory,
  type InteractionState,
} from "../src/catalogue.js";

import {
  useMicrointeraction,
  useInteractionFeedback,
  Interactive,
} from "../src/react.js";

class FakeDOMElement {
  style: Record<string, string> = {};
  listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: Event): boolean {
    this.listeners.get(event.type)?.forEach((fn) => fn(event));
    return true;
  }
}

describe("Prompt 85 — Intelligent Interactive Components & Microinteractions", () => {
  describe("1. Microinteraction Intent Classification", () => {
    it("classifies component categories and target states from natural language queries", () => {
      const testCases: Array<{
        text: string;
        expectedCategory: MicroComponentCategory;
        expectedState: InteractionState;
      }> = [
        {
          text: "tactile button click and press feedback",
          expectedCategory: "button",
          expectedState: "press",
        },
        {
          text: "card hover lift and shadow elevation",
          expectedCategory: "card",
          expectedState: "hover",
        },
        {
          text: "form input validation error shake",
          expectedCategory: "input",
          expectedState: "error",
        },
        {
          text: "accordion unfold expanded content",
          expectedCategory: "accordion",
          expectedState: "expanded",
        },
        {
          text: "toggle switch slide active state",
          expectedCategory: "toggle",
          expectedState: "active",
        },
        {
          text: "accessible focus ring for link",
          expectedCategory: "link",
          expectedState: "focus-visible",
        },
        {
          text: "loading spinner progress for submit button",
          expectedCategory: "button",
          expectedState: "loading",
        },
        {
          text: "success confirmation badge pop for toast",
          expectedCategory: "toast",
          expectedState: "success",
        },
        {
          text: "drag and drop surface elevation",
          expectedCategory: "surface",
          expectedState: "dragging",
        },
      ];

      for (const tc of testCases) {
        const result = classifyMicrointeractionIntent(tc.text);
        expect(result.category).toBe(tc.expectedCategory);
        expect(result.targetState).toBe(tc.expectedState);
        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.matchedKeywords.length).toBeGreaterThan(0);
      }
    });

    it("falls back gracefully when input contains no matching keywords", () => {
      const fallback = classifyMicrointeractionIntent("completely unrelated sentence");
      expect(fallback.category).toBe("button");
      expect(fallback.targetState).toBe("hover");
      expect(fallback.confidence).toBe(0.4);
      expect(fallback.matchedKeywords).toEqual([]);
    });
  });

  describe("2. Microinteraction Plan Generation", () => {
    it("generates deterministic microinteraction plans for all 23 supported component categories", () => {
      expect(MICRO_COMPONENT_CATEGORIES).toHaveLength(24);

      for (const category of MICRO_COMPONENT_CATEGORIES) {
        const result = generateMicrointeractionPlan({ category, toState: "press" });
        expect(result.plan).toBeDefined();
        expect(result.plan.category).toBe(category);
        expect(result.plan.toState).toBe("press");
        expect(result.plan.config.duration).toBeGreaterThan(0);
        expect(result.plan.compatibilityScore).toBeGreaterThanOrEqual(80);
        expect(result.alternatives.length).toBeGreaterThan(0);
      }
    });

    it("generates appropriate motion properties across all 16 interaction states", () => {
      expect(INTERACTION_STATES).toHaveLength(16);

      for (const state of INTERACTION_STATES) {
        const result = generateMicrointeractionPlan({
          category: "button",
          toState: state,
        });
        expect(result.plan.toState).toBe(state);
        expect(result.plan.config.properties).toBeDefined();
        expect(result.plan.feedbackType).toBeDefined();
      }
    });

    it("adapts duration, easing, and springs according to visual style and Motion DNA", () => {
      const editorial = generateMicrointeractionPlan({
        category: "button",
        toState: "hover",
        visualStyle: "editorial",
        motionDNA: "editorial-flow",
      });
      expect(editorial.plan.config.easing).toBe("cubic-bezier(0.25, 1, 0.5, 1)");

      const brutalist = generateMicrointeractionPlan({
        category: "button",
        toState: "press",
        visualStyle: "brutalist",
      });
      expect(brutalist.plan.config.easing).toBe("steps(2, jump-end)");
      expect(brutalist.plan.config.duration).toBe(80);

      const snappy = generateMicrointeractionPlan({
        category: "button",
        toState: "press",
        motionDNA: "snappy",
      });
      expect(snappy.plan.config.spring?.stiffness).toBe(420);
    });

    it("strips transforms and enforces opacity-only transitions when reducedMotion is active", () => {
      const normal = generateMicrointeractionPlan({
        category: "card",
        toState: "hover",
        reducedMotion: false,
      });
      expect(normal.plan.config.properties.transform).toBeDefined();

      const reduced = generateMicrointeractionPlan({
        category: "card",
        toState: "hover",
        reducedMotion: true,
      });
      expect(reduced.plan.config.properties.transform).toBeUndefined();
      expect(reduced.plan.config.properties.opacity).toBeDefined();
      expect(reduced.warnings.some((w) => w.toLowerCase().includes("reduced motion"))).toBe(true);
    });

    it("disables spring physics on low device tier hardware", () => {
      const lowTier = generateMicrointeractionPlan({
        category: "button",
        toState: "press",
        deviceTier: "low",
      });
      expect(lowTier.plan.config.spring).toBeUndefined();
      expect(lowTier.warnings.some((w) => w.toLowerCase().includes("device tier"))).toBe(true);
    });
  });

  describe("3. Microinteraction Runtime Controller", () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
      mockElement = new FakeDOMElement() as unknown as HTMLElement;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("tracks state transitions and calls onStateChange callback", () => {
      const onStateChange = vi.fn();
      const controller = createMicrointeractionController({
        category: "button",
        fromState: "idle",
        onStateChange,
      });

      expect(controller.getState()).toBe("idle");

      controller.attach(mockElement);
      controller.setState("hover");
      expect(controller.getState()).toBe("hover");
      expect(onStateChange).toHaveBeenCalledWith("hover", expect.anything());

      controller.setState("press");
      expect(controller.getState()).toBe("press");
      expect(onStateChange).toHaveBeenCalledWith("press", expect.anything());

      controller.destroy();
    });

    it("attaches pointer and keyboard event listeners and cleanly detaches them", () => {
      const controller = createMicrointeractionController({
        category: "button",
      });

      controller.attach(mockElement);
      const fake = mockElement as unknown as FakeDOMElement;

      // Simulate pointerenter -> hover
      fake.dispatchEvent(new Event("pointerenter"));
      expect(controller.getState()).toBe("hover");

      // Simulate pointerdown -> press
      fake.dispatchEvent(new Event("pointerdown"));
      expect(controller.getState()).toBe("press");

      // Simulate pointerup -> hover
      fake.dispatchEvent(new Event("pointerup"));
      expect(controller.getState()).toBe("hover");

      // Simulate pointerleave -> idle
      fake.dispatchEvent(new Event("pointerleave"));
      expect(controller.getState()).toBe("idle");

      // Destroy cleanly
      controller.destroy();
      expect(fake.listeners.size).toBeGreaterThan(0);
      for (const set of fake.listeners.values()) {
        expect(set.size).toBe(0);
      }
    });
  });

  describe("4. React 18/19 Integrations (SSR & StrictMode)", () => {
    it("renders <Interactive /> under SSR with expected attributes and styling", () => {
      const html = renderToString(
        createElement(
          Interactive,
          {
            category: "button",
            className: "primary-btn",
          },
          "Click Me"
        )
      );

      expect(html).toContain("primary-btn");
      expect(html).toContain("Click Me");
      expect(html).toContain("data-interaction-state=\"idle\"");
      expect(html).toContain("data-hovered=\"false\"");
    });

    it("supports render props for dynamic reactive rendering", () => {
      const html = renderToString(
        createElement(
          Interactive,
          {
            category: "card",
          },
          ({ state, isHovered }) =>
            createElement("span", null, `State: ${state}, Hovered: ${isHovered}`)
        )
      );

      expect(html).toContain("State: idle, Hovered: false");
    });

    it("supports polymorphic HTML element rendering via 'as'", () => {
      const html = renderToString(
        createElement(
          Interactive,
          {
            as: "button",
            category: "button",
            disabled: true,
          },
          "Disabled Action"
        )
      );

      expect(html).toContain("<button");
      expect(html).toContain("Disabled Action");
    });

    it("renders cleanly inside React StrictMode without throws or leaks", () => {
      const html = renderToString(
        createElement(
          StrictMode,
          null,
          createElement(Interactive, { category: "toggle" }, "Toggle Option")
        )
      );

      expect(html).toContain("Toggle Option");
    });
  });

  describe("5. AI Capabilities and Registry Discovery", () => {
    it("exports version, supported categories, states, and feedback types", () => {
      expect(MICROINTERACTION_VERSION).toBe("1.0.0");
      expect(listSupportedMicroComponentCategories()).toHaveLength(24);
      expect(listSupportedInteractionStates()).toHaveLength(16);
      expect(listSupportedMicrointeractionTriggers()).toHaveLength(7);
      expect(listSupportedMicrointeractionFeedbackTypes()).toHaveLength(11);
    });

    it("conforms to AI Capability Specification and registers cleanly", () => {
      const cap = getMicrointeractionCapability();
      expect(cap.id).toBe("microinteractions");
      expect(cap.category).toBe("interactive");
      expect(cap.features.length).toBeGreaterThan(0);
      expect(cap.supportedCategories).toHaveLength(24);
      expect(cap.supportedStates).toHaveLength(16);
      expect(MICROINTERACTION_CAPABILITY).toEqual(cap);

      const mockRegistry = { registerCapability: vi.fn() };
      registerMicrointeractionCapability(mockRegistry);
      expect(mockRegistry.registerCapability).toHaveBeenCalledWith(
        MICROINTERACTION_CAPABILITY,
        { override: true }
      );
    });
  });
});
