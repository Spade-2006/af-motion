// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  createComposition,
  addCompositionNode,
  removeCompositionNode,
  updateCompositionNode,
  buildCompositionTree,
  validateComposition,
  exportCompositionJson,
  importCompositionFromJson,
  composeScene,
  aiMotionRegistry,
  registerCapability,
  resetCapabilityRegistry,
  interpretDesignRequirements,
  interpretMotionPrompt,
  type MotionComposition,
  type CompositionNode,
} from "../src/catalogue.js";
import {
  useComposition,
  useCompositionBuilder,
  useValidateComposition,
} from "../src/react.js";

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
  resetCapabilityRegistry();
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

describe("Prompt 61 — Component & Scene Composition Engine", () => {
  describe("Composition Creation & Manipulation", () => {
    it("creates an empty composition with default root node and metadata", () => {
      const comp = createComposition({ name: "Landing Hero Scene" });

      expect(comp.id).toBeDefined();
      expect(comp.name).toBe("Landing Hero Scene");
      expect(comp.version).toBe("1.0.0");
      expect(comp.rootNodeId).toBe("root");
      expect(comp.nodes.root).toBeDefined();
      expect(comp.nodes.root.type).toBe("scene");
      expect(comp.accessibility.respectReducedMotion).toBe(true);
    });

    it("adds nodes and establishes parent-child relationships", () => {
      let comp = createComposition();

      const heroNode: CompositionNode = {
        id: "hero",
        name: "Hero Section",
        type: "component",
        target: { selector: "#hero" },
      };

      comp = addCompositionNode(comp, heroNode);
      expect(comp.nodes.hero).toBeDefined();
      expect(comp.nodes.hero.parentId).toBe("root");
      expect(comp.nodes.root.children).toContain("hero");

      const titleNode: CompositionNode = {
        id: "hero-title",
        name: "Hero Title",
        type: "element",
        target: { selector: "h1" },
        capabilityId: "preset-fade-in",
      };

      comp = addCompositionNode(comp, titleNode, "hero");
      expect(comp.nodes["hero-title"]).toBeDefined();
      expect(comp.nodes["hero-title"].parentId).toBe("hero");
      expect(comp.nodes.hero.children).toContain("hero-title");
    });

    it("removes nodes and cascades deletion through descendant subtrees", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, { id: "card-container", name: "Cards", type: "component" });
      comp = addCompositionNode(comp, { id: "card-1", name: "Card 1", type: "element" }, "card-container");
      comp = addCompositionNode(comp, { id: "card-1-btn", name: "Button", type: "element" }, "card-1");

      expect(comp.nodes["card-container"]).toBeDefined();
      expect(comp.nodes["card-1"]).toBeDefined();
      expect(comp.nodes["card-1-btn"]).toBeDefined();

      // Remove card-container
      comp = removeCompositionNode(comp, "card-container");

      expect(comp.nodes["card-container"]).toBeUndefined();
      expect(comp.nodes["card-1"]).toBeUndefined();
      expect(comp.nodes["card-1-btn"]).toBeUndefined();
      expect(comp.nodes.root.children).not.toContain("card-container");
    });

    it("throws error when attempting to remove the root node", () => {
      const comp = createComposition();
      expect(() => removeCompositionNode(comp, comp.rootNodeId)).toThrowError(
        "Cannot remove root node of composition.",
      );
    });

    it("updates existing node configuration while maintaining immutability of ID", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, { id: "cta-btn", name: "CTA", type: "element" });

      comp = updateCompositionNode(comp, "cta-btn", {
        name: "Primary CTA",
        capabilityId: "pointer-magnetic",
        configuration: { strength: 0.5 },
      });

      expect(comp.nodes["cta-btn"].name).toBe("Primary CTA");
      expect(comp.nodes["cta-btn"].capabilityId).toBe("pointer-magnetic");
      expect(comp.nodes["cta-btn"].configuration?.strength).toBe(0.5);
    });
  });

  describe("Composition Tree Building & Hierarchy", () => {
    it("constructs full CompositionTree with correct depth and children mappings", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, { id: "section", name: "Section", type: "component" });
      comp = addCompositionNode(comp, { id: "sub-container", name: "Container", type: "component" }, "section");
      comp = addCompositionNode(comp, { id: "element", name: "Element", type: "element" }, "sub-container");

      const result = buildCompositionTree(comp);

      expect(result.success).toBe(true);
      expect(result.tree).toBeDefined();
      expect(result.tree?.depth).toBe(4); // root (1) -> section (2) -> sub-container (3) -> element (4)
      expect(result.tree?.totalNodes).toBe(4);
      expect(result.tree?.childrenByParentId.section).toBeDefined();
      expect(result.tree?.childrenByParentId.section[0].id).toBe("sub-container");
    });
  });

  describe("Registry Integration & Schema Validation", () => {
    it("validates capabilities against AI Motion Registry", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, {
        id: "hero-fade",
        name: "Fade In",
        type: "element",
        capabilityId: "preset-fade-in",
        configuration: { duration: 500, delay: 100 },
      });

      const result = buildCompositionTree(comp);
      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.errors).toEqual([]);
    });

    it("rejects unregistered capabilities with missing_capability error", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, {
        id: "fake-node",
        name: "Unknown Effect",
        type: "element",
        capabilityId: "nonexistent-magical-effect",
      });

      const result = buildCompositionTree(comp);
      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(
        result.validation.errors.some((e) => e.rule === "missing_capability"),
      ).toBe(true);
    });

    it("validates configuration against capability schema from Prompt 58", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, {
        id: "magnetic-btn",
        name: "Magnetic Button",
        type: "element",
        capabilityId: "pointer-magnetic",
        configuration: {
          strength: "invalid-string-should-be-number" as any,
        },
      });

      const result = buildCompositionTree(comp);
      expect(result.success).toBe(false);
      expect(
        result.validation.errors.some((e) => e.rule === "schema"),
      ).toBe(true);
    });
  });

  describe("Dependency Resolution & Circular Dependency Detection", () => {
    it("orders execution topologically according to explicit node dependencies", () => {
      let comp = createComposition();
      // Add nodes where C depends on B, and B depends on A
      comp = addCompositionNode(comp, { id: "node-c", name: "Node C", type: "element", dependencies: ["node-b"] });
      comp = addCompositionNode(comp, { id: "node-b", name: "Node B", type: "element", dependencies: ["node-a"] });
      comp = addCompositionNode(comp, { id: "node-a", name: "Node A", type: "element" });

      const result = buildCompositionTree(comp);
      expect(result.success).toBe(true);

      const order = result.executionOrder;
      const idxA = order.indexOf("node-a");
      const idxB = order.indexOf("node-b");
      const idxC = order.indexOf("node-c");

      expect(idxA).toBeLessThan(idxB);
      expect(idxB).toBeLessThan(idxC);
    });

    it("detects circular dependencies and flags error with cycle path", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, { id: "loop-1", name: "Loop 1", type: "element", dependencies: ["loop-2"] });
      comp = addCompositionNode(comp, { id: "loop-2", name: "Loop 2", type: "element", dependencies: ["loop-3"] });
      comp = addCompositionNode(comp, { id: "loop-3", name: "Loop 3", type: "element", dependencies: ["loop-1"] });

      const result = buildCompositionTree(comp);
      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.some((e) => e.rule === "circular_dependency")).toBe(true);
      expect(result.conflicts.some((c) => c.type === "dependency_cycle")).toBe(true);
    });
  });

  describe("Conflict Detection", () => {
    it("flags animation collision when multiple nodes animate the exact same selector", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, {
        id: "hero-anim-1",
        name: "Fade",
        type: "element",
        target: { selector: "#hero-title" },
        capabilityId: "preset-fade-in",
      });
      comp = addCompositionNode(comp, {
        id: "hero-anim-2",
        name: "Tilt",
        type: "element",
        target: { selector: "#hero-title" },
        capabilityId: "pointer-tilt",
      });

      const result = buildCompositionTree(comp);
      const collision = result.conflicts.find((c) => c.type === "animation_collision");

      expect(collision).toBeDefined();
      expect(collision?.nodeIds).toContain("hero-anim-1");
      expect(collision?.nodeIds).toContain("hero-anim-2");
    });

    it("flags z-index conflict when multiple background nodes share the same layer", () => {
      let comp = createComposition();
      comp = addCompositionNode(comp, {
        id: "bg-1",
        name: "Cosmic",
        type: "background",
        layout: { zIndex: 0 },
      });
      comp = addCompositionNode(comp, {
        id: "bg-2",
        name: "Fluid",
        type: "background",
        layout: { zIndex: 0 },
      });

      const result = buildCompositionTree(comp);
      const zConflict = result.conflicts.find((c) => c.type === "z_index_conflict");

      expect(zConflict).toBeDefined();
      expect(zConflict?.nodeIds).toContain("bg-1");
      expect(zConflict?.nodeIds).toContain("bg-2");
    });

    it("flags accessibility conflict when expressive duration has no reduced-motion fallback", () => {
      let comp = createComposition({
        accessibility: { respectReducedMotion: true },
      });
      comp = addCompositionNode(comp, {
        id: "long-anim",
        name: "Slow Dramatic Entrance",
        type: "element",
        timing: { duration: 1500 },
      });

      const result = buildCompositionTree(comp);
      const a11yConflict = result.conflicts.find((c) => c.type === "accessibility_conflict");

      expect(a11yConflict).toBeDefined();
      expect(a11yConflict?.nodeIds).toContain("long-anim");
    });
  });

  describe("Automatic Scene Composition (composeScene)", () => {
    it("composes a complete hero scene with background, title and CTA button", () => {
      const result = composeScene({
        type: "hero",
        targetSelector: "#main-hero",
        backgroundCapability: "bg-cosmic",
      });

      expect(result.success).toBe(true);
      expect(result.composition.nodes["hero-section"]).toBeDefined();
      expect(result.composition.nodes["hero-bg"]).toBeDefined();
      expect(result.composition.nodes["hero-title"]).toBeDefined();
      expect(result.composition.nodes["hero-cta"]).toBeDefined();
      expect(result.executionOrder).toContain("hero-bg");
      expect(result.executionOrder).toContain("hero-title");
      expect(result.executionOrder).toContain("hero-cta");
    });

    it("composes a card grid with stagger controller and tilt effects", () => {
      const result = composeScene({
        type: "card-grid",
        cardCount: 4,
        targetSelector: ".features-grid",
      });

      expect(result.success).toBe(true);
      expect(result.composition.nodes["card-grid-container"]).toBeDefined();
      expect(result.composition.nodes["card-item-1"]).toBeDefined();
      expect(result.composition.nodes["card-item-4"]).toBeDefined();
      expect(result.composition.nodes["card-stagger-controller"]).toBeDefined();
    });

    it("composes an interactive button", () => {
      const result = composeScene({
        type: "interactive-button",
        targetSelector: "button.submit-btn",
      });

      expect(result.success).toBe(true);
      expect(result.composition.nodes["interactive-btn"]).toBeDefined();
      expect(result.composition.nodes["interactive-btn"].capabilityId).toBe("pointer-magnetic");
    });

    it("composes a scroll-driven reveal section", () => {
      const result = composeScene({
        type: "scroll-section",
        targetSelector: "section.about-section",
      });

      expect(result.success).toBe(true);
      expect(result.composition.nodes["scroll-reveal-section"].trigger).toBe("scroll");
    });

    it("integrates with DesignContext and MotionSpecification", () => {
      const designResult = interpretDesignRequirements("Playful dark mode ecommerce store with cards.");
      const motionResult = interpretMotionPrompt("Make the hero section fade in smoothly.");

      const result = composeScene(
        { type: "hero", targetSelector: "#store-hero" },
        {
          designContext: designResult.normalizedContext,
          motionSpecification: motionResult.specification,
        },
      );

      expect(result.success).toBe(true);
      expect(result.composition.motionDNA).toBe("dna-playful");
      expect(result.composition.nodes["hero-section"].target?.selector).toBe("#store-hero");
    });
  });

  describe("JSON Serialization & Deserialization", () => {
    it("exports to JSON and re-imports deterministically", () => {
      const initial = composeScene({ type: "hero" }).composition;
      const json = exportCompositionJson(initial, { pretty: true });

      expect(typeof json).toBe("string");
      expect(json).toContain("hero-section");

      const reimported = importCompositionFromJson(json);
      expect(reimported.success).toBe(true);
      expect(reimported.composition.id).toBe(initial.id);
      expect(reimported.executionOrder).toEqual(
        buildCompositionTree(initial).executionOrder,
      );
    });

    it("handles invalid JSON string gracefully", () => {
      const badResult = importCompositionFromJson("{ invalid json structure");
      expect(badResult.success).toBe(false);
      expect(badResult.validation.valid).toBe(false);
      expect(badResult.validation.errors[0].message).toContain("JSON parsing error");
    });
  });

  describe("React Integration (useComposition, useCompositionBuilder, useValidateComposition)", () => {
    it("manages composition statefully with useComposition", () => {
      const hook = testHook(() => {
        const comp = useComposition();
        return comp;
      });

      expect(hook.current.composition.rootNodeId).toBe("root");
      expect(hook.current.result.success).toBe(true);

      act(() => {
        hook.current.addNode({
          id: "new-card",
          name: "New Card",
          type: "element",
          target: { selector: ".card" },
        });
      });

      expect(hook.current.composition.nodes["new-card"]).toBeDefined();
      expect(hook.current.result.tree?.totalNodes).toBe(2);

      act(() => {
        hook.current.removeNode("new-card");
      });

      expect(hook.current.composition.nodes["new-card"]).toBeUndefined();
    });

    it("provides fluent composition editing via useCompositionBuilder", () => {
      const hook = testHook(() => useCompositionBuilder());

      expect(hook.current.isValid).toBe(true);

      act(() => {
        hook.current.setMotionDNA("dna-snappy");
        hook.current.setDesignSystem("ds-minimal");
      });

      expect(hook.current.composition.motionDNA).toBe("dna-snappy");
      expect(hook.current.composition.designSystem).toBe("ds-minimal");
    });

    it("validates composition reactively with useValidateComposition", () => {
      const comp = createComposition();
      const hook = testHook(() => useValidateComposition(comp));

      expect(hook.current.valid).toBe(true);
      expect(hook.current.errors).toEqual([]);
    });

    it("renders cleanly in SSR without browser DOM", () => {
      function SSRCompositionComponent() {
        const comp = createComposition({ name: "SSR Scene" });
        const validation = useValidateComposition(comp);
        return createElement(
          "div",
          { "data-valid": String(validation.valid) },
          comp.name,
        );
      }

      const html = renderToString(createElement(SSRCompositionComponent));
      expect(html).toContain('data-valid="true"');
      expect(html).toContain("SSR Scene");
    });
  });
});
