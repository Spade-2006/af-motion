// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  interpretMotionPrompt,
  aiMotionRegistry,
  validateConfiguration,
  type MotionInterpretationResult,
} from "../src/catalogue.js";
import { useInterpretMotion } from "../src/react.js";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function testHook<T>(callback: () => T) {
  let value!: T;
  function TestComponent() {
    value = callback();
    return null;
  }
  act(() => {
    root.render(createElement(TestComponent));
  });
  return {
    get current() {
      return value;
    },
    rerender() {
      act(() => {
        root.render(createElement(TestComponent));
      });
    },
  };
}

describe("Prompt 59 — Natural-Language-to-Motion Interpretation Engine", () => {
  describe("Core Required Language Prompts", () => {
    it("1. 'Make the hero section fade in smoothly.'", () => {
      const result = interpretMotionPrompt("Make the hero section fade in smoothly.");

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.intent.action).toBe("fade-in");
      expect(result.intent.target).toBe("hero section");
      expect(result.intent.modifiers).toContain("smooth");

      const spec = result.specification!;
      expect(spec).toBeDefined();
      expect(spec.capabilityId).toBe("preset-fade-in");
      expect(spec.category).toBe("preset");
      expect(spec.target.selector).toBe("#hero");
      expect(spec.target.semanticRole).toBe("hero section");
      expect(spec.target.isCollection).toBe(false);
      expect(spec.easing).toBe("ease-out");
      expect(spec.duration).toBe(500);
      expect(spec.trigger).toBe("load");
      expect(spec.properties).toEqual({ opacity: [0, 1] });
      expect(spec.accessibility.respectReducedMotion).toBe(true);
      expect(spec.accessibility.reducedMotion).toBe("skips-to-endpoint");
      expect(spec.schemaId).toBe("af-motion:schema:capability:preset-fade-in");
      expect(spec.matchedCapabilities).toContain("preset-fade-in");
      expect(spec.matchedCapabilities.length).toBeGreaterThan(0);
      expect(result.validation?.valid).toBe(true);
    });

    it("2. 'Create a magnetic button with a subtle hover effect.'", () => {
      const result = interpretMotionPrompt("Create a magnetic button with a subtle hover effect.");

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.intent.action).toBe("magnetic");
      expect(result.intent.target).toBe("button");
      expect(result.intent.trigger).toBe("hover");
      expect(result.intent.modifiers).toContain("subtle");
      expect(result.intent.modifiers).toContain("hover");

      const spec = result.specification!;
      expect(spec.capabilityId).toBe("pointer-magnetic");
      expect(spec.category).toBe("pointer");
      expect(spec.target.selector).toBe("button");
      expect(spec.target.semanticRole).toBe("button");
      expect(spec.target.isCollection).toBe(false);
      expect(spec.interaction?.strength).toBe(0.2); // subtle reduces strength from 0.4
      expect(spec.interaction?.distance).toBe(80); // subtle reduces distance
      expect(spec.interaction?.hoverScale).toBe(1.02);
      expect(spec.accessibility.reducedMotion).toBe("disables-animation");
      expect(result.validation?.valid).toBe(true);
    });

    it("3. 'Add staggered animations to these cards.'", () => {
      const result = interpretMotionPrompt("Add staggered animations to these cards.");

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.intent.action).toBe("stagger");
      expect(result.intent.target).toBe("card");
      expect(result.intent.modifiers).toContain("staggered");

      const spec = result.specification!;
      expect(spec.capabilityId).toBe("effect-stagger");
      expect(spec.category).toBe("visual-effect");
      expect(spec.target.selector).toBe(".card");
      expect(spec.target.isCollection).toBe(true);
      expect(spec.stagger?.delay).toBe(100);
      expect(spec.stagger?.from).toBe("first");
      expect(result.alternatives.some((alt) => alt.capabilityId.includes("stagger") || alt.capabilityId.includes("hero"))).toBe(true);
      expect(result.validation?.valid).toBe(true);
    });

    it("4. 'Make the background feel futuristic and fluid.'", () => {
      const result = interpretMotionPrompt("Make the background feel futuristic and fluid.");

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.intent.action).toBe("background-fluid");
      expect(result.intent.target).toBe("background");
      expect(result.intent.modifiers).toContain("futuristic");
      expect(result.intent.modifiers).toContain("fluid");

      const spec = result.specification!;
      expect(spec.capabilityId).toBe("bg-fluid");
      expect(spec.category).toBe("background");
      expect(spec.target.selector).toBe("body");
      expect(spec.motionDNA).toBe("tech");
      expect(spec.accessibility.reducedMotion).toBe("static-fallback");
      expect(result.alternatives.some((alt) => alt.capabilityId === "bg-cosmic")).toBe(true);
      expect(result.validation?.valid).toBe(true);
    });

    it("5. 'Create a smooth scroll-driven reveal with reduced-motion support.'", () => {
      const result = interpretMotionPrompt("Create a smooth scroll-driven reveal with reduced-motion support.");

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.intent.action).toBe("reveal");
      expect(result.intent.trigger).toBe("scroll");
      expect(result.intent.modifiers).toContain("smooth");
      expect(result.intent.modifiers).toContain("scroll-driven");
      expect(result.intent.modifiers).toContain("reduced-motion");

      const spec = result.specification!;
      expect(spec.capabilityId).toBe("effect-reveal");
      expect(spec.category).toBe("visual-effect");
      expect(spec.easing).toBe("ease-out");
      expect(spec.trigger).toBe("scroll");
      expect(spec.scroll?.once).toBe(true);
      expect(spec.scroll?.axis).toBe("y");
      expect(spec.accessibility.respectReducedMotion).toBe(true);
      expect(spec.accessibility.reducedMotion).toBe("skips-to-endpoint");
      expect(spec.accessibility.screenReaderAnnounce).toBe(true);
      expect(result.validation?.valid).toBe(true);
    });
  });

  describe("Target Extraction & Selectors", () => {
    it("extracts explicit CSS ID selector", () => {
      const result = interpretMotionPrompt("Fade in #pricing-table smoothly");
      expect(result.specification?.target.selector).toBe("#pricing-table");
      expect(result.specification?.target.isCollection).toBe(false);
    });

    it("extracts explicit CSS class selector and infers collection status", () => {
      const singular = interpretMotionPrompt("Animate .feature-item on hover");
      expect(singular.specification?.target.selector).toBe(".feature-item");

      const plural = interpretMotionPrompt("Stagger .feature-cards one by one");
      expect(plural.specification?.target.selector).toBe(".feature-cards");
      expect(plural.specification?.target.isCollection).toBe(true);
    });

    it("extracts attribute selector", () => {
      const result = interpretMotionPrompt("Reveal [data-motion='main'] smoothly");
      expect(result.specification?.target.selector).toBe("[data-motion='main']");
    });

    it("uses defaultTarget from options.context when prompt has no target", () => {
      const result = interpretMotionPrompt("Fade in smoothly", {
        context: { defaultTarget: ".custom-box" },
      });
      expect(result.specification?.target.selector).toBe(".custom-box");
      expect(result.specification?.target.description).toContain(".custom-box");
    });

    it("warns when strictTarget is enabled and no selector exists", () => {
      const result = interpretMotionPrompt("Fade in smoothly", {
        strictTarget: true,
      });
      expect(result.warnings.some((w) => w.includes("Strict target mode"))).toBe(true);
    });
  });

  describe("Parameter, Timing & Modifier Extraction", () => {
    it("extracts explicit duration in milliseconds", () => {
      const result = interpretMotionPrompt("Fade in #hero over 850ms");
      expect(result.specification?.duration).toBe(850);
      expect(result.specification?.parameters.duration).toBe(850);
    });

    it("extracts explicit duration in seconds", () => {
      const result = interpretMotionPrompt("Fade in #hero over 1.2s");
      expect(result.specification?.duration).toBe(1200);
    });

    it("extracts explicit delay in milliseconds", () => {
      const result = interpretMotionPrompt("Fade in #hero delayed by 300ms");
      expect(result.specification?.delay).toBe(300);
      expect(result.specification?.parameters.delay).toBe(300);
    });

    it("extracts timing modifiers (fast/snappy, slow/gentle)", () => {
      const snappy = interpretMotionPrompt("Make #hero fade in snappy");
      expect(snappy.specification?.duration).toBe(300);
      expect(snappy.specification?.easing).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");

      const slow = interpretMotionPrompt("Make #hero fade in slow and bouncy");
      expect(slow.specification?.duration).toBe(1000);
      expect(slow.specification?.easing).toBe("spring(1, 100, 10, 0)");
    });

    it("extracts stagger parameters and direction", () => {
      const fromCenter = interpretMotionPrompt("Stagger these cards by 150ms from center");
      expect(fromCenter.specification?.stagger?.delay).toBe(150);
      expect(fromCenter.specification?.stagger?.from).toBe("center");

      const fromEnd = interpretMotionPrompt("Stagger these cards from end");
      expect(fromEnd.specification?.stagger?.from).toBe("end");
    });

    it("extracts dramatic modifier for interactions", () => {
      const dramatic = interpretMotionPrompt("Create a magnetic button with dramatic strength");
      expect(dramatic.specification?.interaction?.strength).toBe(0.7);
      expect(dramatic.specification?.interaction?.distance).toBe(150);
    });
  });

  describe("Trigger & Accessibility Detection", () => {
    it("detects inView trigger", () => {
      const result = interpretMotionPrompt("Fade in the card when visible in view");
      expect(result.specification?.trigger).toBe("inView");
    });

    it("detects click trigger", () => {
      const result = interpretMotionPrompt("Trigger magnetic ripple on click for button");
      expect(result.specification?.trigger).toBe("click");
    });

    it("detects pointer trigger", () => {
      const result = interpretMotionPrompt("Track cursor movement on button");
      expect(result.specification?.trigger).toBe("pointer");
    });

    it("respects reduced motion and maps fallback properties", () => {
      const result = interpretMotionPrompt("Make hero fade in with accessible reduced-motion");
      expect(result.specification?.accessibility.respectReducedMotion).toBe(true);
      expect(result.specification?.accessibility.screenReaderAnnounce).toBe(true);
      expect(result.specification?.accessibility.fallbackProperties).toEqual({
        opacity: 1,
        transform: "none",
      });
    });
  });

  describe("Contextual Overrides & Alternatives", () => {
    it("applies motionDNA and designSystem from context", () => {
      const result = interpretMotionPrompt("Fade in the hero section smoothly", {
        context: {
          motionDNA: "playful",
          designSystem: "zenith",
        },
      });
      expect(result.specification?.motionDNA).toBe("playful");
      expect(result.specification?.designSystem).toBe("zenith");
    });

    it("prefers candidates matching preferredCategory", () => {
      const result = interpretMotionPrompt("Create smooth entrance for hero", {
        context: {
          preferredCategory: "preset",
        },
      });
      expect(result.specification?.category).toBe("preset");
    });

    it("handles vague or unrecognized prompts gracefully", () => {
      const result = interpretMotionPrompt("Make it look nice and shiny");
      expect(result.success).toBe(false);
      expect(result.confidence).toBeLessThan(0.4);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.alternatives).toBeDefined();
    });

    it("handles empty prompt gracefully", () => {
      const result = interpretMotionPrompt("   ");
      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.warnings).toContain("Empty prompt provided");
    });
  });

  describe("Schema Validation Integration", () => {
    it("validates specification parameters against capability schema", () => {
      const result = interpretMotionPrompt("Make the hero section fade in smoothly.");
      expect(result.validation).toBeDefined();
      expect(result.validation?.valid).toBe(true);
      expect(result.specification?.schemaId).toBe("af-motion:schema:capability:preset-fade-in");

      // Verify the schema itself exists and validates the parameters
      const schema = aiMotionRegistry.getCapabilitySchema("preset-fade-in");
      expect(schema).toBeDefined();
      const directValidation = validateConfiguration(schema!, result.specification!.parameters);
      expect(directValidation.valid).toBe(true);
    });

    it("disables validation when validate: false option is set", () => {
      const result = interpretMotionPrompt("Make the hero section fade in smoothly.", {
        validate: false,
      });
      expect(result.validation).toBeUndefined();
    });
  });

  describe("React Integration (useInterpretMotion)", () => {
    it("returns interpretation result in React hook", () => {
      const hook = testHook(() =>
        useInterpretMotion("Make the hero section fade in smoothly."),
      );

      expect(hook.current.success).toBe(true);
      expect(hook.current.specification?.capabilityId).toBe("preset-fade-in");
      expect(hook.current.specification?.target.selector).toBe("#hero");
    });

    it("updates when prompt changes", () => {
      let prompt = "Make the hero section fade in smoothly.";
      const hook = testHook(() => useInterpretMotion(prompt));

      expect(hook.current.specification?.capabilityId).toBe("preset-fade-in");

      prompt = "Create a magnetic button with a subtle hover effect.";
      hook.rerender();

      expect(hook.current.specification?.capabilityId).toBe("pointer-magnetic");
    });

    it("memoizes result when inputs remain unchanged", () => {
      const hook = testHook(() =>
        useInterpretMotion("Make the hero section fade in smoothly."),
      );

      const firstResult = hook.current;
      hook.rerender();
      const secondResult = hook.current;

      expect(firstResult).toBe(secondResult);
    });

    it("renders cleanly in SSR without errors", () => {
      function TestComponent() {
        const interpretation = useInterpretMotion("Make the hero section fade in smoothly.");
        return createElement(
          "div",
          { "data-capability": interpretation.specification?.capabilityId },
          interpretation.specification?.target.selector,
        );
      }

      const html = renderToString(createElement(TestComponent));
      expect(html).toContain('data-capability="preset-fade-in"');
      expect(html).toContain("#hero");
    });
  });
});
