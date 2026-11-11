// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTouchController,
  createMultiTouchController,
  type MultiTouchController,
  type MultiTouchState,
  type TouchController,
} from "../src/catalogue.js";

describe("Prompt 107 — Touch & Multi-Touch Engine", () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

    element = document.createElement("div");
    element.style.width = "200px";
    element.style.height = "200px";
    element.style.touchAction = "pan-y"; // initial custom touch action
    document.body.appendChild(element);

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 200,
      right: 300,
      bottom: 250,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    element.remove();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. TOUCH CONTROLLER & BASIC TOUCH TRACKING
  // -------------------------------------------------------------------------
  describe("1. Touch Controller Tracking & Lifecycle", () => {
    let controller: TouchController;

    afterEach(() => {
      controller?.destroy();
    });

    it("tracks single and multiple touches via pointer events", () => {
      const onTouchStart = vi.fn();
      const onTouchMove = vi.fn();
      const onTouchEnd = vi.fn();
      const onTouchesChange = vi.fn();

      controller = createTouchController(element, {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchesChange,
      });

      // Initially zero touches
      expect(controller.getState().touchCount).toBe(0);
      expect(controller.getState().isTouching).toBe(false);

      // Touch 1 Down
      const down1 = new Event("pointerdown", { bubbles: true }) as any;
      down1.pointerId = 1;
      down1.pointerType = "touch";
      down1.clientX = 120;
      down1.clientY = 130;
      element.dispatchEvent(down1);

      expect(controller.getState().touchCount).toBe(1);
      expect(controller.getState().isTouching).toBe(true);
      expect(onTouchStart).toHaveBeenCalledTimes(1);

      // Touch 2 Down
      const down2 = new Event("pointerdown", { bubbles: true }) as any;
      down2.pointerId = 2;
      down2.pointerType = "touch";
      down2.clientX = 180;
      down2.clientY = 190;
      element.dispatchEvent(down2);

      expect(controller.getState().touchCount).toBe(2);
      expect(onTouchStart).toHaveBeenCalledTimes(2);

      // Centroid of (20, 30) and (80, 90) relative to element (100, 100) -> (50, 60)
      const state = controller.getState();
      expect(state.centroid.x).toBeCloseTo(50, 0);
      expect(state.centroid.y).toBeCloseTo(60, 0);

      // Touch 1 Up
      const up1 = new Event("pointerup", { bubbles: true }) as any;
      up1.pointerId = 1;
      up1.pointerType = "touch";
      up1.clientX = 120;
      up1.clientY = 130;
      element.dispatchEvent(up1);

      expect(controller.getState().touchCount).toBe(1);
      expect(onTouchEnd).toHaveBeenCalledTimes(1);

      // Touch 2 Up
      const up2 = new Event("pointerup", { bubbles: true }) as any;
      up2.pointerId = 2;
      up2.pointerType = "touch";
      element.dispatchEvent(up2);

      expect(controller.getState().touchCount).toBe(0);
      expect(controller.getState().isTouching).toBe(false);
    });

    it("restores original touch-action on destroy()", () => {
      expect(element.style.touchAction).toBe("pan-y");

      controller = createTouchController(element, {
        touchAction: "none",
      });
      expect(element.style.touchAction).toBe("none");

      controller.destroy();
      expect(element.style.touchAction).toBe("pan-y");
    });

    it("handles touchcancel cleanly", () => {
      const onTouchCancel = vi.fn();
      controller = createTouchController(element, {
        onTouchCancel,
      });

      const down = new Event("pointerdown", { bubbles: true }) as any;
      down.pointerId = 5;
      down.pointerType = "touch";
      down.clientX = 150;
      down.clientY = 150;
      element.dispatchEvent(down);

      expect(controller.getState().touchCount).toBe(1);

      const cancel = new Event("pointercancel", { bubbles: true }) as any;
      cancel.pointerId = 5;
      cancel.pointerType = "touch";
      element.dispatchEvent(cancel);

      expect(controller.getState().touchCount).toBe(0);
      expect(onTouchCancel).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. MULTI-TOUCH CONTROLLER & GEOMETRY
  // -------------------------------------------------------------------------
  describe("2. Multi-Touch Controller & Transformations", () => {
    let multiCtrl: MultiTouchController;

    afterEach(() => {
      multiCtrl?.destroy();
    });

    it("performs single-finger panning when singleFingerPan is enabled", () => {
      const onPan = vi.fn();
      multiCtrl = createMultiTouchController(element, {
        enablePan: true,
        singleFingerPan: true,
        panThreshold: 0,
        onPan,
      });

      // Pointer 1 Down at (100, 100)
      const down = new Event("pointerdown", { bubbles: true }) as any;
      down.pointerId = 1;
      down.pointerType = "touch";
      down.clientX = 100;
      down.clientY = 100;
      element.dispatchEvent(down);

      // Move dx=+30, dy=+40
      const move = new Event("pointermove", { bubbles: true }) as any;
      move.pointerId = 1;
      move.pointerType = "touch";
      move.clientX = 130;
      move.clientY = 140;
      element.dispatchEvent(move);

      expect(onPan).toHaveBeenCalled();
      const transform = multiCtrl.getTransform();
      expect(transform.translation.x).toBe(30);
      expect(transform.translation.y).toBe(40);
    });

    it("calculates two-finger pinch scaling and detects pinchDirection", () => {
      const onPinch = vi.fn();
      multiCtrl = createMultiTouchController(element, {
        enablePinch: true,
        pinchThreshold: 0,
        onPinch,
      });

      // Finger 1 at (100, 100), Finger 2 at (150, 100) -> initial distance = 50px
      const down1 = new Event("pointerdown", { bubbles: true }) as any;
      down1.pointerId = 1;
      down1.pointerType = "touch";
      down1.clientX = 100;
      down1.clientY = 100;
      element.dispatchEvent(down1);

      const down2 = new Event("pointerdown", { bubbles: true }) as any;
      down2.pointerId = 2;
      down2.pointerType = "touch";
      down2.clientX = 150;
      down2.clientY = 100;
      element.dispatchEvent(down2);

      // Spread fingers to distance = 100px: Finger 1 at (100, 100), Finger 2 at (200, 100)
      const move2 = new Event("pointermove", { bubbles: true }) as any;
      move2.pointerId = 2;
      move2.pointerType = "touch";
      move2.clientX = 200;
      move2.clientY = 100;
      element.dispatchEvent(move2);

      expect(onPinch).toHaveBeenCalled();
      const state = multiCtrl.getState();
      expect(state.scale).toBeCloseTo(2, 1); // 100 / 50 = 2.0
      expect(state.pinchDirection).toBe("out");
    });

    it("calculates two-finger rotation degrees", () => {
      const onRotate = vi.fn();
      multiCtrl = createMultiTouchController(element, {
        enableRotation: true,
        rotationThreshold: 0,
        onRotate,
      });

      // Finger 1 at (100, 100), Finger 2 at (150, 100) -> angle = 0 deg
      const down1 = new Event("pointerdown", { bubbles: true }) as any;
      down1.pointerId = 1;
      down1.pointerType = "touch";
      down1.clientX = 100;
      down1.clientY = 100;
      element.dispatchEvent(down1);

      const down2 = new Event("pointerdown", { bubbles: true }) as any;
      down2.pointerId = 2;
      down2.pointerType = "touch";
      down2.clientX = 150;
      down2.clientY = 100;
      element.dispatchEvent(down2);

      // Rotate 90 deg: Finger 2 moves to (100, 150)
      const move2 = new Event("pointermove", { bubbles: true }) as any;
      move2.pointerId = 2;
      move2.pointerType = "touch";
      move2.clientX = 100;
      move2.clientY = 150;
      element.dispatchEvent(move2);

      expect(onRotate).toHaveBeenCalled();
      const state = multiCtrl.getState();
      expect(state.rotation).toBeCloseTo(90, 0);
    });

    it("prevents sudden jumps when adding or removing fingers (anti-jump baseline)", () => {
      multiCtrl = createMultiTouchController(element, {
        enablePan: true,
        singleFingerPan: true,
        twoFingerPan: true,
        panThreshold: 0,
      });

      // 1 Finger Down at (100, 100)
      const down1 = new Event("pointerdown", { bubbles: true }) as any;
      down1.pointerId = 1;
      down1.pointerType = "touch";
      down1.clientX = 100;
      down1.clientY = 100;
      element.dispatchEvent(down1);

      // Move Finger 1 by (20, 20) -> translation = (20, 20)
      const move1 = new Event("pointermove", { bubbles: true }) as any;
      move1.pointerId = 1;
      move1.pointerType = "touch";
      move1.clientX = 120;
      move1.clientY = 120;
      element.dispatchEvent(move1);

      expect(multiCtrl.getTransform().translation).toEqual({ x: 20, y: 20 });

      // Add 2nd Finger at distant location (300, 300)
      // Without anti-jump, centroid would suddenly shift from (120, 120) to (210, 210), jumping 90px!
      const down2 = new Event("pointerdown", { bubbles: true }) as any;
      down2.pointerId = 2;
      down2.pointerType = "touch";
      down2.clientX = 300;
      down2.clientY = 300;
      element.dispatchEvent(down2);

      // Translation must remain stable at (20, 20) with NO sudden jump!
      expect(multiCtrl.getTransform().translation).toEqual({ x: 20, y: 20 });

      // Move both fingers together by +10px (Finger 1 to 130, Finger 2 to 310)
      const moveBoth1 = new Event("pointermove", { bubbles: true }) as any;
      moveBoth1.pointerId = 1;
      moveBoth1.pointerType = "touch";
      moveBoth1.clientX = 130;
      moveBoth1.clientY = 130;
      element.dispatchEvent(moveBoth1);

      const moveBoth2 = new Event("pointermove", { bubbles: true }) as any;
      moveBoth2.pointerId = 2;
      moveBoth2.pointerType = "touch";
      moveBoth2.clientX = 310;
      moveBoth2.clientY = 310;
      element.dispatchEvent(moveBoth2);

      // Should smoothly advance by +10px -> (30, 30)
      expect(multiCtrl.getTransform().translation.x).toBeCloseTo(30, 0);
      expect(multiCtrl.getTransform().translation.y).toBeCloseTo(30, 0);

      // Remove Finger 2
      const up2 = new Event("pointerup", { bubbles: true }) as any;
      up2.pointerId = 2;
      up2.pointerType = "touch";
      element.dispatchEvent(up2);

      // Translation must remain stable with NO jump on release of second finger!
      expect(multiCtrl.getTransform().translation.x).toBeCloseTo(30, 0);
      expect(multiCtrl.getTransform().translation.y).toBeCloseTo(30, 0);
    });

    it("enforces minimum and maximum scale constraints", () => {
      multiCtrl = createMultiTouchController(element, {
        enablePinch: true,
        minScale: 0.5,
        maxScale: 2.5,
        pinchThreshold: 0,
      });

      const down1 = new Event("pointerdown", { bubbles: true }) as any;
      down1.pointerId = 1;
      down1.pointerType = "touch";
      down1.clientX = 100;
      down1.clientY = 100;
      element.dispatchEvent(down1);

      const down2 = new Event("pointerdown", { bubbles: true }) as any;
      down2.pointerId = 2;
      down2.pointerType = "touch";
      down2.clientX = 150;
      down2.clientY = 100;
      element.dispatchEvent(down2);

      // Try scaling way past maxScale (e.g. distance = 500px -> scale 10x)
      const move2 = new Event("pointermove", { bubbles: true }) as any;
      move2.pointerId = 2;
      move2.pointerType = "touch";
      move2.clientX = 600;
      move2.clientY = 100;
      element.dispatchEvent(move2);

      expect(multiCtrl.getState().scale).toBe(2.5); // Clamped to maxScale
    });

    it("supports programmatic setter controls (setTranslation, setScale, setRotation, reset)", () => {
      multiCtrl = createMultiTouchController(element);

      multiCtrl.setTranslation({ x: 55, y: -25 });
      multiCtrl.setScale(1.75);
      multiCtrl.setRotation(45);

      const transform = multiCtrl.getTransform();
      expect(transform.translation).toEqual({ x: 55, y: -25 });
      expect(transform.scale).toBe(1.75);
      expect(transform.rotation).toBe(45);

      // Reset
      multiCtrl.reset();
      expect(multiCtrl.getTransform().translation).toEqual({ x: 0, y: 0 });
      expect(multiCtrl.getTransform().scale).toBe(1);
      expect(multiCtrl.getTransform().rotation).toBe(0);
    });
  });
});
