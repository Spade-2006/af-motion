// @vitest-environment jsdom

import { StrictMode, act, createElement, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  usePhysicsComposition,
  useSpringPhysics,
  useInertiaPhysics,
  usePhysicsRecipe,
  PhysicsContainer,
  PhysicsBody,
  PhysicsElement,
  createVector,
  type PhysicsCompositionState,
} from "../src/react.js";

describe("Prompt 104 — React Physics Integration & Validation", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  describe("1. usePhysicsComposition Hook", () => {
    it("initializes with stable controls and attaches ref to target DOM element", () => {
      let controls: any;

      function TestComponent() {
        controls = usePhysicsComposition({
          bodies: [
            {
              id: "hero",
              shape: { type: "circle", radius: 10 },
              position: createVector(50, 100),
            },
          ],
        });
        return createElement("div", { ref: controls.ref, id: "test-node" });
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      expect(controls).toBeDefined();
      expect(typeof controls.start).toBe("function");
      expect(typeof controls.pause).toBe("function");
      expect(typeof controls.resume).toBe("function");
      expect(typeof controls.stop).toBe("function");
      expect(typeof controls.reset).toBe("function");
      expect(typeof controls.step).toBe("function");
      expect(controls.ref.current).toBeInstanceOf(HTMLDivElement);

      // Verify initial GPU transform is applied
      expect(controls.ref.current?.style.transform).toBe("translate3d(50px, 100px, 0px)");
    });

    it("steps simulation deterministically and updates DOM element style", () => {
      let controls: any;

      function TestComponent() {
        controls = usePhysicsComposition({
          timestep: 0.01,
          bodies: [
            {
              id: "glider",
              shape: { type: "circle", radius: 10 },
              position: createVector(0, 0),
              velocity: createVector(200, 0),
            },
          ],
        });
        return createElement("div", { ref: controls.ref });
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      act(() => {
        controls.step(0.01);
      });

      const glider = controls.getBody("glider");
      expect(glider?.position.x).toBeCloseTo(2, 0); // 200 * 0.01 = 2px
      expect(controls.ref.current?.style.transform).toContain("translate3d(");
    });

    it("binds secondary bodies to arbitrary DOM nodes via bindBody", () => {
      let controls: any;

      function TestComponent() {
        controls = usePhysicsComposition({
          bodies: [
            { id: "box1", shape: { type: "circle", radius: 10 }, position: createVector(10, 20) },
            { id: "box2", shape: { type: "circle", radius: 10 }, position: createVector(30, 40) },
          ],
        });

        return createElement(
          "div",
          null,
          createElement("div", { ref: controls.bindBody("box1"), id: "node1" }),
          createElement("div", { ref: controls.bindBody("box2"), id: "node2" })
        );
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      const n1 = host.querySelector("#node1") as HTMLElement;
      const n2 = host.querySelector("#node2") as HTMLElement;

      expect(n1.style.transform).toBe("translate3d(10px, 20px, 0px)");
      expect(n2.style.transform).toBe("translate3d(30px, 40px, 0px)");
    });

    it("notifies update, settle, and complete callbacks", () => {
      const onUpdate = vi.fn();
      const onSettle = vi.fn();
      const onComplete = vi.fn();

      let controls: any;

      function TestComponent() {
        controls = usePhysicsComposition(
          {
            timestep: 0.01,
            bodies: [
              {
                id: "ball",
                shape: { type: "circle", radius: 5 },
                position: createVector(0, 0),
                velocity: createVector(0.001, 0), // already settled speed
              },
            ],
          },
          { onUpdate, onSettle, onComplete }
        );
        return createElement("div", { ref: controls.ref });
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      act(() => {
        controls.step(0.01);
      });

      expect(onUpdate).toHaveBeenCalled();
      expect(onSettle).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
      expect(controls.isSettled()).toBe(true);
    });

    it("cleans up resources and halts simulation on unmount", () => {
      let controls: any;

      function TestComponent() {
        controls = usePhysicsComposition({
          bodies: [{ id: "b", shape: { type: "circle", radius: 5 } }],
        });
        return createElement("div", { ref: controls.ref });
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      expect(controls.composition.isDisposed()).toBe(false);

      act(() => {
        root.unmount();
      });

      expect(controls.composition.isDisposed()).toBe(true);
    });
  });

  describe("2. Specialized Hooks (useSpringPhysics, useInertiaPhysics, usePhysicsRecipe)", () => {
    it("drives target spring motion via useSpringPhysics", () => {
      let controls: any;

      function SpringComponent() {
        controls = useSpringPhysics({
          from: createVector(100, 0),
          target: createVector(0, 0),
          stiffness: 200,
          damping: 20,
        });
        return createElement("div", { ref: controls.ref });
      }

      act(() => {
        root.render(createElement(SpringComponent));
      });

      expect(controls.ref.current?.style.transform).toBe("translate3d(100px, 0px, 0px)");

      act(() => {
        for (let i = 0; i < 20; i++) controls.step(0.01);
      });

      const body = controls.getBody("spring_actor");
      expect(body?.position.x).toBeLessThan(100);
      expect(controls.ref.current?.style.transform).not.toBe("translate3d(100px, 0px, 0px)");
    });

    it("simulates inertia decay via useInertiaPhysics", () => {
      let controls: any;

      function InertiaComponent() {
        controls = useInertiaPhysics({
          from: 0,
          initialVelocity: 150,
          friction: 4.0,
        });
        return createElement("div", { ref: controls.ref });
      }

      act(() => {
        root.render(createElement(InertiaComponent));
      });

      act(() => {
        for (let i = 0; i < 30; i++) controls.step(0.01);
      });

      const body = controls.getBody("inertia_actor");
      expect(body?.position.x).toBeGreaterThan(0);
      expect(body?.velocity.x).toBeLessThan(50);
    });

    it("instantiates composition from standard recipe via usePhysicsRecipe", () => {
      let controls: any;

      function RecipeComponent() {
        controls = usePhysicsRecipe("bouncy-entrance", undefined, {
          bindTarget: true,
          primaryBodyId: "actor",
        });
        return createElement("div", { ref: controls.ref });
      }

      act(() => {
        root.render(createElement(RecipeComponent));
      });

      expect(controls.getBody("actor")).toBeDefined();
    });
  });

  describe("3. Declarative React Physics Components", () => {
    it("renders PhysicsContainer and registers child PhysicsBody instances", () => {
      function ContainerComponent() {
        return createElement(
          PhysicsContainer,
          { autoStart: false, id: "world" },
          createElement(PhysicsBody, {
            id: "ball1",
            shape: { type: "circle", radius: 10 },
            position: createVector(50, 75),
          }),
          createElement(PhysicsBody, {
            id: "ball2",
            shape: { type: "circle", radius: 15 },
            position: createVector(120, 180),
          })
        );
      }

      act(() => {
        root.render(createElement(ContainerComponent));
      });

      const container = host.querySelector("[data-physics-container]") as HTMLElement;
      expect(container).toBeDefined();

      const b1 = host.querySelector("[data-physics-body='ball1']") as HTMLElement;
      const b2 = host.querySelector("[data-physics-body='ball2']") as HTMLElement;

      expect(b1.style.transform).toBe("translate3d(50px, 75px, 0px)");
      expect(b2.style.transform).toBe("translate3d(120px, 180px, 0px)");
    });

    it("renders self-contained PhysicsElement component", () => {
      function ElementComponent() {
        return createElement(
          PhysicsElement,
          { recipe: "floating-object", autoStart: false },
          "Floating Text"
        );
      }

      act(() => {
        root.render(createElement(ElementComponent));
      });

      const el = host.querySelector("[data-physics-element]") as HTMLElement;
      expect(el).toBeDefined();
      expect(el.textContent).toBe("Floating Text");
    });
  });

  describe("4. React Strict Mode & Concurrent Lifecycle Safety", () => {
    it("safely handles Strict Mode double-mount and unmount without leaks or errors", () => {
      let controls: any;

      function StrictComponent() {
        controls = usePhysicsComposition({
          bodies: [{ id: "strict_body", shape: { type: "circle", radius: 8 }, position: createVector(10, 20) }],
        });
        return createElement("div", { ref: controls.ref }, "Strict Content");
      }

      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(StrictComponent)
          )
        );
      });

      expect(controls.getBody("strict_body")).toBeDefined();
      expect(controls.ref.current?.style.transform).toBe("translate3d(10px, 20px, 0px)");

      // Safe step under StrictMode
      act(() => {
        controls.step(0.01);
      });

      expect(controls.isDisposed()).toBe(false);

      // Unmount cleanly
      act(() => {
        root.unmount();
      });

      expect(controls.isDisposed()).toBe(true);
    });

    it("supports multiple simultaneous independent physics compositions without crosstalk", () => {
      let c1: any;
      let c2: any;

      function MultiComponent() {
        c1 = usePhysicsComposition({
          bodies: [{ id: "actor1", shape: { type: "circle", radius: 5 }, position: createVector(10, 0) }],
        });
        c2 = usePhysicsComposition({
          bodies: [{ id: "actor2", shape: { type: "circle", radius: 5 }, position: createVector(100, 0) }],
        });

        return createElement(
          "div",
          null,
          createElement("div", { ref: c1.ref, id: "el1" }),
          createElement("div", { ref: c2.ref, id: "el2" })
        );
      }

      act(() => {
        root.render(createElement(MultiComponent));
      });

      expect(c1.getBody("actor1")?.position.x).toBe(10);
      expect(c2.getBody("actor2")?.position.x).toBe(100);

      // Verify they do not share bodies
      expect(c1.getBody("actor2")).toBeUndefined();
      expect(c2.getBody("actor1")).toBeUndefined();
    });
  });
});
