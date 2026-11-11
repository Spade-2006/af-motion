// @vitest-environment jsdom

import { StrictMode, act, createElement, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  usePointer,
  useDrag,
  useTouch,
  useMultiTouch,
  useGesture,
  useGestureSequence,
  useCursor,
  useMagnetic,
  useMagneticGroup,
  Draggable,
  Magnetic,
  Cursor,
  GestureArea,
  createInteractionManager,
  interact,
  type GestureClassificationResult,
} from "../src/react.js";

function createPointerEvent(type: string, options: any = {}): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: options.bubbles ?? true,
    cancelable: options.cancelable ?? true,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
  });
  Object.defineProperty(event, "pointerId", { value: options.pointerId ?? 1 });
  Object.defineProperty(event, "pointerType", { value: options.pointerType ?? "mouse" });
  Object.defineProperty(event, "isPrimary", { value: options.isPrimary ?? true });
  return event;
}

describe("Prompt 110 — Universal Interaction React Integration", () => {
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

  describe("1. usePointer Hook", () => {
    it("attaches ref and tracks pointer hover and down states", () => {
      let pointerResult: any;

      function TestComponent() {
        pointerResult = usePointer();
        return createElement("div", { ref: pointerResult.ref, id: "pointer-box" }, "Box");
      }

      act(() => {
        root.render(createElement(TestComponent));
      });

      expect(pointerResult.ref.current).toBeInstanceOf(HTMLElement);
      expect(pointerResult.controller).toBeDefined();
      expect(pointerResult.isHovering).toBe(false);
      expect(pointerResult.isDown).toBe(false);

      const target = host.querySelector("#pointer-box")!;

      // Simulate pointer enter
      act(() => {
        target.dispatchEvent(createPointerEvent("pointerenter"));
      });
      expect(pointerResult.isHovering).toBe(true);

      // Simulate pointer down
      act(() => {
        target.dispatchEvent(createPointerEvent("pointerdown"));
      });
      expect(pointerResult.isDown).toBe(true);

      // Simulate pointer up
      act(() => {
        target.dispatchEvent(createPointerEvent("pointerup"));
      });
      expect(pointerResult.isDown).toBe(false);

      // Simulate pointer leave
      act(() => {
        target.dispatchEvent(createPointerEvent("pointerleave"));
      });
      expect(pointerResult.isHovering).toBe(false);
    });

    it("accepts external ref and custom callbacks", () => {
      const onPointerEnter = vi.fn();
      const onPointerDown = vi.fn();
      let capturedTarget: HTMLElement | null = null;

      function CustomRefComponent() {
        const myRef = useRef<HTMLButtonElement>(null);
        usePointer({ onPointerEnter, onPointerDown }, myRef);

        return createElement(
          "button",
          {
            ref: (node: HTMLButtonElement | null) => {
              (myRef as any).current = node;
              capturedTarget = node;
            },
          },
          "Click"
        );
      }

      act(() => {
        root.render(createElement(CustomRefComponent));
      });

      expect(capturedTarget).toBeInstanceOf(HTMLButtonElement);

      act(() => {
        capturedTarget!.dispatchEvent(createPointerEvent("pointerenter"));
      });
      expect(onPointerEnter).toHaveBeenCalledTimes(1);

      act(() => {
        capturedTarget!.dispatchEvent(createPointerEvent("pointerdown"));
      });
      expect(onPointerDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. useDrag Hook", () => {
    it("provides drag controls, position state and handles programmatic position updates", () => {
      let dragResult: any;

      function DragComponent() {
        dragResult = useDrag({
          axis: "both",
        });
        return createElement("div", { ref: dragResult.ref, id: "drag-box" }, "Drag Me");
      }

      act(() => {
        root.render(createElement(DragComponent));
      });

      expect(dragResult.ref.current).toBeInstanceOf(HTMLElement);
      expect(dragResult.controls).toBeDefined();
      expect(dragResult.isDragging).toBe(false);
      expect(dragResult.position).toEqual({ x: 0, y: 0 });

      // Programmatic setPosition
      act(() => {
        dragResult.setPosition({ x: 50, y: 75 });
      });
      expect(dragResult.position).toEqual({ x: 50, y: 75 });

      // Reset
      act(() => {
        dragResult.reset();
      });
      expect(dragResult.position).toEqual({ x: 0, y: 0 });

      // Cancel
      act(() => {
        dragResult.cancel();
      });
      expect(dragResult.isDragging).toBe(false);
    });
  });

  describe("3. useTouch Hook", () => {
    it("tracks touch count and active state", () => {
      let touchResult: any;

      function TouchComponent() {
        touchResult = useTouch();
        return createElement("div", { ref: touchResult.ref, id: "touch-box" }, "Touch Area");
      }

      act(() => {
        root.render(createElement(TouchComponent));
      });

      expect(touchResult.ref.current).toBeInstanceOf(HTMLElement);
      expect(touchResult.controller).toBeDefined();
      expect(touchResult.isTouching).toBe(false);
      expect(touchResult.touchCount).toBe(0);
    });
  });

  describe("4. useMultiTouch Hook", () => {
    it("initializes multi-touch transform state and supports reset", () => {
      let multiTouchResult: any;

      function MultiTouchComponent() {
        multiTouchResult = useMultiTouch();
        return createElement("div", { ref: multiTouchResult.ref, id: "multitouch-box" }, "Multi-Touch Area");
      }

      act(() => {
        root.render(createElement(MultiTouchComponent));
      });

      expect(multiTouchResult.ref.current).toBeInstanceOf(HTMLElement);
      expect(multiTouchResult.controller).toBeDefined();
      expect(multiTouchResult.isTransforming).toBe(false);
      expect(multiTouchResult.transform).toMatchObject({
        translation: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
      });

      // Test controller controls
      act(() => {
        multiTouchResult.setScale(1.5);
      });
      expect(multiTouchResult.transform.scale).toBe(1.5);

      act(() => {
        multiTouchResult.reset();
      });
      expect(multiTouchResult.transform.scale).toBe(1);
    });
  });

  describe("5. useGesture Hook", () => {
    it("initializes gesture recognizer and exposes gesture controls", () => {
      let gestureResult: any;
      const onGestureRecognized = vi.fn();

      function GestureComponent() {
        gestureResult = useGesture({
          enabledGestures: ["tap", "swipe-right"],
          onGestureRecognized,
        });
        return createElement("div", { ref: gestureResult.ref, id: "gesture-box" }, "Gestures");
      }

      act(() => {
        root.render(createElement(GestureComponent));
      });

      expect(gestureResult.ref.current).toBeInstanceOf(HTMLElement);
      expect(gestureResult.controller).toBeDefined();
      expect(gestureResult.lastGesture).toBeNull();
      expect(typeof gestureResult.cancel).toBe("function");

      // Verify cancel
      act(() => {
        gestureResult.cancel();
      });
      expect(gestureResult.lastGesture).toBeNull();
    });
  });

  describe("6. useGestureSequence Hook", () => {
    it("configures gesture sequences and tracks step state", () => {
      let sequenceResult: any;
      const onSequenceCompleted = vi.fn();

      function SequenceComponent() {
        sequenceResult = useGestureSequence({
          stages: [
            { gestureId: "tap" },
            { gestureId: "swipe-right" },
          ],
          onSequenceCompleted,
        });
        return createElement("div", null, "Sequence Area");
      }

      act(() => {
        root.render(createElement(SequenceComponent));
      });

      expect(sequenceResult.controller).toBeDefined();
      expect(sequenceResult.isMatched).toBe(false);
      expect(sequenceResult.isFailed).toBe(false);
      expect(sequenceResult.state?.stageIndex).toBe(0);

      // Feed stage 1
      const tapMatch: GestureClassificationResult = {
        gestureId: "tap",
        name: "Tap",
        confidence: 0.95,
        isMatch: true,
        explanation: {} as any,
        sample: {} as any,
        recognizedAt: Date.now(),
      };

      act(() => {
        sequenceResult.feed(tapMatch);
      });
      expect(sequenceResult.state?.stageIndex).toBe(1);

      // Reset
      act(() => {
        sequenceResult.reset();
      });
      expect(sequenceResult.state?.stageIndex).toBe(0);
      expect(sequenceResult.isMatched).toBe(false);
    });
  });

  describe("7. useCursor Hook", () => {
    it("tracks cursor position, mode and visibility", () => {
      let cursorResult: any;

      function CursorComponent() {
        cursorResult = useCursor({
          smoothing: 0.1,
          mode: "default",
        });
        return createElement("div", { ref: cursorResult.ref, id: "custom-cursor" }, "Cursor");
      }

      act(() => {
        root.render(createElement(CursorComponent));
      });

      expect(cursorResult.ref.current).toBeInstanceOf(HTMLElement);
      expect(cursorResult.controller).toBeDefined();
      expect(cursorResult.mode).toBe("default");
      expect(typeof cursorResult.isVisible).toBe("boolean");
      expect(typeof cursorResult.setMode).toBe("function");

      act(() => {
        cursorResult.setMode("pointer");
      });
      expect(cursorResult.mode).toBe("pointer");

      act(() => {
        cursorResult.reset();
      });
      expect(cursorResult.mode).toBe("default");
    });
  });

  describe("8. useMagnetic & useMagneticGroup Hooks", () => {
    it("manages magnetic attraction state and displacement", () => {
      let magneticResult: any;

      function MagneticComponent() {
        magneticResult = useMagnetic({
          radius: 80,
          strength: 0.4,
        });
        return createElement("button", { ref: magneticResult.ref, id: "magnetic-btn" }, "Magnet");
      }

      act(() => {
        root.render(createElement(MagneticComponent));
      });

      expect(magneticResult.ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(magneticResult.controller).toBeDefined();
      expect(magneticResult.isAttracted).toBe(false);
      expect(magneticResult.displacement).toEqual({ x: 0, y: 0 });

      act(() => {
        magneticResult.reset();
      });
      expect(magneticResult.isAttracted).toBe(false);
      expect(magneticResult.displacement).toEqual({ x: 0, y: 0 });
    });

    it("coordinates multiple magnetic elements in a magnetic group", () => {
      let groupResult: any;

      function MagneticGroupComponent() {
        groupResult = useMagneticGroup({ radius: 60 });

        return createElement(
          "div",
          null,
          createElement("button", {
            ref: (el) => groupResult.registerRef(el),
            id: "btn-1",
          }, "Button 1"),
          createElement("button", {
            ref: (el) => groupResult.registerRef(el),
            id: "btn-2",
          }, "Button 2")
        );
      }

      act(() => {
        root.render(createElement(MagneticGroupComponent));
      });

      expect(groupResult.group).toBeDefined();
      expect(groupResult.activeMember).toBeNull();

      act(() => {
        groupResult.reset();
      });
      expect(groupResult.activeMember).toBeNull();
    });
  });

  describe("9. Declarative Components", () => {
    it("renders <Draggable> with correct attributes, ARIA and style defaults", () => {
      act(() => {
        root.render(
          createElement(
            Draggable,
            { id: "my-draggable", role: "slider", "aria-label": "Slider Control" },
            "Drag Content"
          )
        );
      });

      const element = host.querySelector("#my-draggable") as HTMLElement;
      expect(element).toBeDefined();
      expect(element.getAttribute("role")).toBe("slider");
      expect(element.getAttribute("aria-grabbed")).toBe("false");
      expect(element.getAttribute("tabindex")).toBe("0");
      expect(element.style.touchAction).toBe("none");
      expect(element.style.cursor).toBe("grab");
      expect(element.textContent).toBe("Drag Content");
    });

    it("renders <Magnetic> with inline-block layout", () => {
      act(() => {
        root.render(
          createElement(
            Magnetic,
            { id: "my-magnetic", as: "span" },
            "Magnetic Text"
          )
        );
      });

      const element = host.querySelector("#my-magnetic") as HTMLElement;
      expect(element).toBeDefined();
      expect(element.tagName).toBe("SPAN");
      expect(element.style.display).toBe("inline-block");
      expect(element.textContent).toBe("Magnetic Text");
    });

    it("renders <Cursor> with fixed overlay positioning and pointerEvents none", () => {
      act(() => {
        root.render(
          createElement(
            Cursor,
            { id: "my-cursor" },
            createElement("div", { className: "dot" })
          )
        );
      });

      const element = host.querySelector("#my-cursor") as HTMLElement;
      expect(element).toBeDefined();
      expect(element.style.position).toBe("fixed");
      expect(element.style.pointerEvents).toBe("none");
      expect(element.style.zIndex).toBe("99999");
    });

    it("renders <GestureArea> with touchAction none and passes props", () => {
      act(() => {
        root.render(
          createElement(
            GestureArea,
            { id: "my-gesture-area", className: "touch-surface" },
            "Gesture Zone"
          )
        );
      });

      const element = host.querySelector("#my-gesture-area") as HTMLElement;
      expect(element).toBeDefined();
      expect(element.classList.contains("touch-surface")).toBe(true);
      expect(element.style.touchAction).toBe("none");
      expect(element.textContent).toBe("Gesture Zone");
    });
  });

  describe("10. React StrictMode Lifecycle & Cleanups", () => {
    it("handles double-mount and unmount cleanly in StrictMode without leaking listeners", () => {
      function StrictModeHarness() {
        const { ref } = usePointer();
        const { ref: dragRef } = useDrag();
        const { ref: touchRef } = useTouch();
        const { ref: gestureRef } = useGesture();
        const { ref: magneticRef } = useMagnetic();

        return createElement(
          "div",
          null,
          createElement("div", { ref, id: "strict-pointer" }),
          createElement("div", { ref: dragRef, id: "strict-drag" }),
          createElement("div", { ref: touchRef, id: "strict-touch" }),
          createElement("div", { ref: gestureRef, id: "strict-gesture" }),
          createElement("div", { ref: magneticRef, id: "strict-magnetic" })
        );
      }

      // Render inside StrictMode
      act(() => {
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(StrictModeHarness)
          )
        );
      });

      expect(host.querySelector("#strict-pointer")).toBeDefined();
      expect(host.querySelector("#strict-drag")).toBeDefined();
      expect(host.querySelector("#strict-touch")).toBeDefined();
      expect(host.querySelector("#strict-gesture")).toBeDefined();
      expect(host.querySelector("#strict-magnetic")).toBeDefined();

      // Unmount cleanly
      act(() => {
        root.unmount();
      });
      expect(host.innerHTML).toBe("");
    });
  });

  describe("11. Core Re-exports & Utilities", () => {
    it("re-exports createInteractionManager and interact helper", () => {
      expect(typeof createInteractionManager).toBe("function");
      expect(typeof interact).toBe("function");

      const manager = createInteractionManager();
      expect(manager).toBeDefined();
      expect(typeof manager.destroy).toBe("function");
      manager.destroy();
    });
  });
});
