// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPointerController,
  createDragController,
  getDeviceCapabilities,
  PointerTracker,
  type AdvancedDragControls,
  type PointerController,
} from "../src/catalogue.js";

describe("Prompt 106 — Advanced Pointer & Drag Engine", () => {
  let element: HTMLDivElement;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement("div");
    container.style.width = "500px";
    container.style.height = "500px";
    document.body.appendChild(container);

    element = document.createElement("div");
    element.style.width = "100px";
    element.style.height = "100px";
    container.appendChild(element);

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      right: 200,
      bottom: 200,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });

    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 500,
      height: 500,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    element.remove();
    container.remove();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. DEVICE CAPABILITIES
  // -------------------------------------------------------------------------
  describe("1. Device Capabilities Detection", () => {
    it("reports environment device capabilities correctly", () => {
      const caps = getDeviceCapabilities();
      expect(caps).toBeDefined();
      expect(typeof caps.touchSupport).toBe("boolean");
      expect(typeof caps.pointerSupport).toBe("boolean");
      expect(typeof caps.maxTouchPoints).toBe("number");
      expect(["mouse", "touch", "pen"]).toContain(caps.primaryInput);
      expect(typeof caps.hoverSupport).toBe("boolean");
    });
  });

  // -------------------------------------------------------------------------
  // 2. POINTER CONTROLLER & ADVANCED TRACKING
  // -------------------------------------------------------------------------
  describe("2. Advanced Pointer Controller", () => {
    let controller: PointerController;

    afterEach(() => {
      controller?.destroy();
    });

    it("tracks hover states and fires hover change callbacks", () => {
      const onHoverChange = vi.fn();
      const onPointerEnter = vi.fn();
      const onPointerLeave = vi.fn();

      controller = createPointerController(element, {
        onHoverChange,
        onPointerEnter,
        onPointerLeave,
      });

      expect(controller.isHovered()).toBe(false);

      element.dispatchEvent(new MouseEvent("pointerenter", { bubbles: true }));
      expect(controller.isHovered()).toBe(true);
      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(true, expect.anything());

      element.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
      expect(controller.isHovered()).toBe(false);
      expect(onPointerLeave).toHaveBeenCalledTimes(1);
      expect(onHoverChange).toHaveBeenCalledWith(false, expect.anything());
    });

    it("tracks pointer down/move/up with contact dimensions, pressure, tilt, twist, and acceleration", () => {
      const onPointerDown = vi.fn();
      const onPointerMove = vi.fn();
      const onPointerUp = vi.fn();

      controller = createPointerController(element, {
        onPointerDown,
        onPointerMove,
        onPointerUp,
      });

      // Pointer Down
      const rawDown = new Event("pointerdown", { bubbles: true }) as any;
      rawDown.pointerId = 1;
      rawDown.pointerType = "pen";
      rawDown.clientX = 120;
      rawDown.clientY = 130;
      rawDown.pressure = 0.75;
      rawDown.tiltX = 25;
      rawDown.tiltY = -15;
      rawDown.twist = 90;
      rawDown.width = 12;
      rawDown.height = 16;
      element.dispatchEvent(rawDown);

      expect(onPointerDown).toHaveBeenCalledTimes(1);
      const [, pDown] = onPointerDown.mock.calls[0];
      expect(pDown.id).toBe(1);
      expect(pDown.pointerType).toBe("pen");
      expect(pDown.width).toBe(12);
      expect(pDown.height).toBe(16);

      // Pointer Move
      const rawMove = new Event("pointermove", { bubbles: true }) as any;
      rawMove.pointerId = 1;
      rawMove.pointerType = "pen";
      rawMove.clientX = 180;
      rawMove.clientY = 190;
      rawMove.width = 14;
      rawMove.height = 18;
      element.dispatchEvent(rawMove);

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      const [, pMove] = onPointerMove.mock.calls[0];
      expect(pMove.deltaX).toBe(60);
      expect(pMove.deltaY).toBe(60);
      expect(typeof pMove.accelerationX).toBe("number");
      expect(typeof pMove.accelerationY).toBe("number");

      // Pointer Up
      const rawUp = new Event("pointerup", { bubbles: true }) as any;
      rawUp.pointerId = 1;
      rawUp.clientX = 180;
      rawUp.clientY = 190;
      element.dispatchEvent(rawUp);

      expect(onPointerUp).toHaveBeenCalledTimes(1);
      expect(controller.getState().pointerCount).toBe(0);
    });

    it("tracks multiple simultaneous pointers and identifies the primary pointer", () => {
      controller = createPointerController(element);

      const makePointerDown = (id: number, isPrimary: boolean, x: number, y: number) => {
        const ev = new Event("pointerdown", { bubbles: true }) as any;
        ev.pointerId = id;
        ev.pointerType = "touch";
        ev.isPrimary = isPrimary;
        ev.clientX = x;
        ev.clientY = y;
        return ev;
      };

      element.dispatchEvent(makePointerDown(10, true, 110, 110));
      element.dispatchEvent(makePointerDown(20, false, 150, 150));

      const state = controller.getState();
      expect(state.pointerCount).toBe(2);
      expect(state.primaryPointer?.id).toBe(10);
      expect(controller.getActivePointers().has(20)).toBe(true);

      const makePointerUp = (id: number) => {
        const ev = new Event("pointerup", { bubbles: true }) as any;
        ev.pointerId = id;
        return ev;
      };

      element.dispatchEvent(makePointerUp(10));
      expect(controller.getState().pointerCount).toBe(1);

      element.dispatchEvent(makePointerUp(20));
      expect(controller.getState().pointerCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. ADVANCED DRAG ENGINE
  // -------------------------------------------------------------------------
  describe("3. Advanced Drag Engine", () => {
    let dragCtrl: AdvancedDragControls;

    afterEach(() => {
      dragCtrl?.destroy();
    });

    it("initiates dragging only after passing configurable threshold", () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      dragCtrl = createDragController(element, {
        threshold: 10,
        onDragStart,
        onDrag,
        onDragEnd,
      });

      // Down at (100, 100)
      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);
      expect(dragCtrl.isDragging()).toBe(false);

      // Move 5px (below 10px threshold)
      const move1 = new MouseEvent("pointermove", { bubbles: true, clientX: 105, clientY: 100 });
      (move1 as any).pointerId = 1;
      element.dispatchEvent(move1);
      expect(dragCtrl.isDragging()).toBe(false);
      expect(onDragStart).not.toHaveBeenCalled();

      // Move to 15px (exceeds 10px threshold)
      const move2 = new MouseEvent("pointermove", { bubbles: true, clientX: 115, clientY: 100 });
      (move2 as any).pointerId = 1;
      element.dispatchEvent(move2);
      expect(dragCtrl.isDragging()).toBe(true);
      expect(onDragStart).toHaveBeenCalledTimes(1);

      // Up
      const up = new MouseEvent("pointerup", { bubbles: true, clientX: 115, clientY: 100 });
      (up as any).pointerId = 1;
      element.dispatchEvent(up);
      expect(dragCtrl.isDragging()).toBe(false);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it("constrains movement along specified axis (x, y, both, none)", () => {
      // Axis X
      dragCtrl = createDragController(element, {
        axis: "x",
        threshold: 0,
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 150, clientY: 200 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      const pos = dragCtrl.getPosition();
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(0); // Y remains locked to 0

      dragCtrl.destroy();

      // Axis Y
      dragCtrl = createDragController(element, {
        axis: "y",
        threshold: 0,
      });

      element.dispatchEvent(down);
      element.dispatchEvent(move);

      const posY = dragCtrl.getPosition();
      expect(posY.x).toBe(0); // X locked to 0
      expect(posY.y).toBe(100);
    });

    it("locks direction automatically to dominant axis when directionLock is true", () => {
      dragCtrl = createDragController(element, {
        directionLock: true,
        threshold: 2,
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      // Move primarily horizontally (dx=20, dy=2)
      const move1 = new MouseEvent("pointermove", { bubbles: true, clientX: 120, clientY: 102 });
      (move1 as any).pointerId = 1;
      element.dispatchEvent(move1);

      expect(dragCtrl.getState().lockedAxis).toBe("x");

      // Try moving vertically afterwards
      const move2 = new MouseEvent("pointermove", { bubbles: true, clientX: 120, clientY: 180 });
      (move2 as any).pointerId = 1;
      element.dispatchEvent(move2);

      expect(dragCtrl.getPosition().y).toBe(0); // Y remained locked!
    });

    it("clamps position to explicit bounding constraints", () => {
      dragCtrl = createDragController(element, {
        threshold: 0,
        bounds: {
          minX: -50,
          maxX: 100,
          minY: -20,
          maxY: 80,
        },
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      // Try dragging far beyond bounds (dx=300, dy=-200)
      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 400, clientY: -100 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      const pos = dragCtrl.getPosition();
      expect(pos.x).toBe(100); // Clamped to maxX
      expect(pos.y).toBe(-20); // Clamped to minY
    });

    it("supports snap-to-grid configuration", () => {
      dragCtrl = createDragController(element, {
        threshold: 0,
        grid: [25, 50],
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      // Move dx=32 (snaps to 25), dy=84 (snaps to 100)
      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 132, clientY: 184 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      const pos = dragCtrl.getPosition();
      expect(pos.x).toBe(25);
      expect(pos.y).toBe(100);
    });

    it("snaps to nearest snap point and calls onSnap", () => {
      const onSnap = vi.fn();
      dragCtrl = createDragController(element, {
        threshold: 0,
        snapPoints: [
          { x: 100, y: 100 },
          { x: 200, y: 200 },
        ],
        snapRadius: 25,
        onSnap,
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      // Move close to (100, 100): dx=110, dy=105 -> distance sqrt(10^2+5^2) = 11.18 <= 25
      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 210, clientY: 205 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      expect(dragCtrl.getPosition()).toEqual({ x: 100, y: 100 });
      expect(dragCtrl.getState().isSnapping).toBe(true);
      expect(onSnap).toHaveBeenCalledWith({ x: 100, y: 100 }, expect.anything());
    });

    it("applies rubber-band elastic resistance when dragging outside bounds", () => {
      dragCtrl = createDragController(element, {
        threshold: 0,
        bounds: { maxX: 50 },
        elastic: 0.3,
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      // Drag 100px past maxX (raw dx = 150)
      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 250, clientY: 100 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      const pos = dragCtrl.getPosition();
      // Should be greater than maxX (50) due to elasticity, but less than 150
      expect(pos.x).toBeGreaterThan(50);
      expect(pos.x).toBeLessThan(100);
    });

    it("applies drag resistance scaling", () => {
      dragCtrl = createDragController(element, {
        threshold: 0,
        resistance: 0.5, // 50% resistance
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 200, clientY: 100 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      // Traveled 100px with 0.5 resistance -> effective displacement = 50px
      expect(dragCtrl.getPosition().x).toBe(50);
    });

    it("applies custom coordinate transform function", () => {
      dragCtrl = createDragController(element, {
        threshold: 0,
        transformCoordinate: (pt) => ({ x: pt.x * 2, y: pt.y * 2 }),
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 120, clientY: 130 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      expect(dragCtrl.getPosition()).toEqual({ x: 40, y: 60 });
    });

    it("reverts position on Escape cancellation", () => {
      dragCtrl = createDragController(element, {
        threshold: 0,
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      const move = new MouseEvent("pointermove", { bubbles: true, clientX: 180, clientY: 180 });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      expect(dragCtrl.getPosition()).toEqual({ x: 80, y: 80 });

      // Press Escape
      element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

      expect(dragCtrl.getPosition()).toEqual({ x: 0, y: 0 });
      expect(dragCtrl.isDragging()).toBe(false);
    });

    it("supports keyboard accessible dragging via Space/Enter and Arrow keys", () => {
      dragCtrl = createDragController(element, {
        keyboardEnabled: true,
        keyboardStep: 15,
      });

      // Press Space to initiate keyboard drag
      element.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      expect(dragCtrl.isDragging()).toBe(true);

      // Press ArrowRight (move dx=+15)
      element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      expect(dragCtrl.getPosition().x).toBe(15);

      // Press ArrowDown (move dy=+15)
      element.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      expect(dragCtrl.getPosition().y).toBe(15);

      // Press Enter to drop
      element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      expect(dragCtrl.isDragging()).toBe(false);
      expect(dragCtrl.getPosition()).toEqual({ x: 15, y: 15 });
    });

    it("respects allowed mouse buttons and canDrag predicate", () => {
      const canDrag = vi.fn().mockReturnValue(false);

      dragCtrl = createDragController(element, {
        canDrag,
        buttons: [0], // left click only
      });

      // Right click (button = 2)
      const rightClick = new MouseEvent("pointerdown", { bubbles: true, button: 2 });
      (rightClick as any).pointerId = 1;
      element.dispatchEvent(rightClick);

      expect(dragCtrl.isDragging()).toBe(false);

      // Left click with canDrag = false
      const leftClick = new MouseEvent("pointerdown", { bubbles: true, button: 0 });
      (leftClick as any).pointerId = 1;
      element.dispatchEvent(leftClick);

      expect(canDrag).toHaveBeenCalled();
      expect(dragCtrl.isDragging()).toBe(false);
    });

    it("locks axis to dominant direction when Shift is held with shiftAxisLock: true", () => {
      dragCtrl = createDragController(element, {
        shiftAxisLock: true,
        threshold: 0,
      });

      const down = new MouseEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100 });
      (down as any).pointerId = 1;
      element.dispatchEvent(down);

      // Move with Shift held: dx=50, dy=10
      const move = new MouseEvent("pointermove", {
        bubbles: true,
        clientX: 150,
        clientY: 110,
        shiftKey: true,
      });
      (move as any).pointerId = 1;
      element.dispatchEvent(move);

      const pos = dragCtrl.getPosition();
      expect(pos.x).toBe(50);
      expect(pos.y).toBe(0); // Y suppressed because X is dominant with Shift!
    });
  });
});
