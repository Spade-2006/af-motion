// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCursorController,
  createMagneticController,
  createMagneticGroup,
  type CursorController,
  type CursorState,
  type MagneticController,
  type MagneticGroupController,
  type MagneticState,
} from "../src/catalogue.js";

describe("Prompt 109 — Cursor & Magnetic Interaction Engine", () => {
  let element: HTMLDivElement;
  let cursorElement: HTMLDivElement;

  beforeEach(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

    element = document.createElement("div");
    element.id = "target-btn";
    element.style.width = "100px";
    element.style.height = "50px";
    element.style.position = "absolute";
    element.style.left = "200px";
    element.style.top = "200px";
    document.body.appendChild(element);

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      left: 200,
      top: 200,
      width: 100,
      height: 50,
      right: 300,
      bottom: 250,
      x: 200,
      y: 200,
      toJSON: () => {},
    });

    cursorElement = document.createElement("div");
    cursorElement.id = "custom-cursor";
    cursorElement.style.width = "20px";
    cursorElement.style.height = "20px";
    document.body.appendChild(cursorElement);
  });

  afterEach(() => {
    if (element.parentNode) element.parentNode.removeChild(element);
    if (cursorElement.parentNode) cursorElement.parentNode.removeChild(cursorElement);
    document.documentElement.style.cursor = "";
    vi.restoreAllMocks();
  });

  describe("1. Cursor Intelligence & Tracking", () => {
    it("initializes cursor controller with correct defaults", () => {
      const cursor = createCursorController(cursorElement);
      const state = cursor.getState();

      expect(state.isVisible).toBe(false);
      expect(state.mode).toBe("default");
      expect(state.customState).toBeNull();
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);

      cursor.destroy();
    });

    it("tracks pointer position immediately when smoothing is 0", () => {
      const cursor = createCursorController(cursorElement, {
        smoothing: 0,
      });

      window.dispatchEvent(
        new MouseEvent("pointermove", {
          clientX: 150,
          clientY: 250,
        })
      );

      const state = cursor.getState();
      expect(state.isVisible).toBe(true);
      expect(state.x).toBe(150);
      expect(state.y).toBe(250);
      expect(state.targetX).toBe(150);
      expect(state.targetY).toBe(250);

      cursor.destroy();
    });

    it("updates velocity, speed, acceleration, and angle over movement", () => {
      let latestState: CursorState | null = null;
      const cursor = createCursorController(null, {
        smoothing: 0,
        onPositionChange: (st) => {
          latestState = st;
        },
      });

      // Move 1
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 100, clientY: 100 }));
      // Move 2 to the right
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 200, clientY: 100 }));

      expect(latestState).not.toBeNull();
      expect(latestState!.targetX).toBe(200);
      expect(latestState!.targetY).toBe(100);

      cursor.destroy();
    });

    it("switches modes and custom state dynamically", () => {
      const onStateChange = vi.fn();
      const cursor = createCursorController(null, {
        onStateChange,
      });

      cursor.setMode("magnetic");
      expect(cursor.getState().mode).toBe("magnetic");
      expect(onStateChange).toHaveBeenCalled();

      cursor.setCustomState("clicking");
      expect(cursor.getState().customState).toBe("clicking");

      cursor.setVisibility(true);
      expect(cursor.getState().isVisible).toBe(true);

      cursor.destroy();
    });

    it("detects hover state over interactive elements", () => {
      const onHoverStart = vi.fn();
      const onHoverEnd = vi.fn();

      const button = document.createElement("button");
      button.id = "test-button";
      document.body.appendChild(button);

      if (typeof document.elementFromPoint !== "function") {
        (document as any).elementFromPoint = () => null;
      }
      vi.spyOn(document, "elementFromPoint").mockImplementation((x, y) => {
        if (x >= 200 && x <= 300 && y >= 200 && y <= 250) {
          return button;
        }
        return document.body;
      });

      const cursor = createCursorController(null, {
        hoverSelector: "button",
        onHoverStart,
        onHoverEnd,
      });

      // Move over button
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 220, clientY: 210 }));
      expect(cursor.getState().isHovering).toBe(true);
      expect(cursor.getState().hoveredElement).toBe(button);
      expect(onHoverStart).toHaveBeenCalledWith(button, expect.any(Object));

      // Move away
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 50 }));
      expect(cursor.getState().isHovering).toBe(false);
      expect(cursor.getState().hoveredElement).toBeNull();
      expect(onHoverEnd).toHaveBeenCalledWith(button, expect.any(Object));

      button.parentNode?.removeChild(button);
      cursor.destroy();
    });

    it("senses proximity to registered proximity targets", () => {
      const onEnter = vi.fn();
      const onLeave = vi.fn();
      const onProximity = vi.fn();

      const cursor = createCursorController(null, {
        proximityTargets: [
          {
            element,
            radius: 100, // center is (250, 225)
            onEnter,
            onLeave,
            onProximity,
          },
        ],
      });

      // Position within 50px of center (250, 225) -> distance = 50 <= 100
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 250, clientY: 175 }));
      expect(onEnter).toHaveBeenCalledTimes(1);
      expect(onProximity).toHaveBeenCalledWith(element, expect.any(Number), expect.any(Number));

      // Move outside radius (>100px away)
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 50 }));
      expect(onLeave).toHaveBeenCalledTimes(1);

      cursor.destroy();
    });

    it("hides cursor on touch events when touchFallback is hide", () => {
      const cursor = createCursorController(cursorElement, {
        touchFallback: "hide",
      });

      // Pointer mouse move -> visible
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 100, clientY: 100 }));
      expect(cursor.getState().isVisible).toBe(true);

      // Touch move -> hidden
      const touchEvent = new Event("touchmove");
      (touchEvent as any).touches = [{ clientX: 120, clientY: 120 }];
      window.dispatchEvent(touchEvent);
      expect(cursor.getState().isVisible).toBe(false);

      cursor.destroy();
    });

    it("restores native cursor on destruction when hideNativeCursor is true", () => {
      const cursor = createCursorController(cursorElement, {
        hideNativeCursor: true,
      });

      expect(document.documentElement.style.cursor).toBe("none");

      cursor.destroy();
      expect(document.documentElement.style.cursor).toBe("");
    });
  });

  describe("2. Magnetic Interaction Engine", () => {
    it("initializes magnetic controller with correct defaults", () => {
      const magnetic = createMagneticController(element);
      const state = magnetic.getState();

      expect(state.isAttracted).toBe(false);
      expect(state.offsetX).toBe(0);
      expect(state.offsetY).toBe(0);
      expect(state.isRepelling).toBe(false);

      magnetic.destroy();
    });

    it("attracts element when pointer enters attraction radius", () => {
      const onAttractStart = vi.fn();
      const onAttractUpdate = vi.fn();

      const magnetic = createMagneticController(element, {
        radius: 100,
        strength: 0.5,
        maxDisplacement: 30,
        onAttractStart,
        onAttractUpdate,
      });

      // Center of element is (250, 225). Move pointer to (280, 225) (dist = 30 <= 100)
      window.dispatchEvent(
        new MouseEvent("pointermove", {
          clientX: 280,
          clientY: 225,
        })
      );

      const state = magnetic.getState();
      expect(state.isAttracted).toBe(true);
      expect(state.distance).toBe(30);
      expect(state.targetX).toBeGreaterThan(0);
      expect(state.targetY).toBe(0); // horizontal displacement only
      expect(onAttractStart).toHaveBeenCalledTimes(1);
      expect(onAttractUpdate).toHaveBeenCalled();

      magnetic.destroy();
    });

    it("releases element when pointer moves outside radius", () => {
      const onAttractEnd = vi.fn();

      const magnetic = createMagneticController(element, {
        radius: 80,
        onAttractEnd,
      });

      // Enter
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 260, clientY: 225 }));
      expect(magnetic.getState().isAttracted).toBe(true);

      // Leave
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 50 }));
      expect(magnetic.getState().isAttracted).toBe(false);
      expect(magnetic.getState().targetX).toBe(0);
      expect(magnetic.getState().targetY).toBe(0);
      expect(onAttractEnd).toHaveBeenCalledTimes(1);

      magnetic.destroy();
    });

    it("respects axis constraints ('x', 'y')", () => {
      const xMagnetic = createMagneticController(element, {
        radius: 100,
        axis: "x",
      });

      // Move at 45 degree angle
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 280, clientY: 255 }));
      expect(xMagnetic.getState().targetX).toBeGreaterThan(0);
      expect(xMagnetic.getState().targetY).toBe(0); // Y locked
      xMagnetic.destroy();

      const yMagnetic = createMagneticController(element, {
        radius: 100,
        axis: "y",
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 280, clientY: 255 }));
      expect(yMagnetic.getState().targetX).toBe(0); // X locked
      expect(yMagnetic.getState().targetY).toBeGreaterThan(0);
      yMagnetic.destroy();
    });

    it("supports repulsion mode (moves away from pointer)", () => {
      const repelMagnetic = createMagneticController(element, {
        radius: 100,
        mode: "repel",
      });

      // Center (250, 225), pointer at (270, 225) (dx = +20)
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 270, clientY: 225 }));
      const state = repelMagnetic.getState();
      expect(state.isAttracted).toBe(true);
      expect(state.isRepelling).toBe(true);
      expect(state.targetX).toBeLessThan(0); // pushed in opposite direction!

      repelMagnetic.destroy();
    });

    it("snaps to configured snap points when in proximity", () => {
      const onSnap = vi.fn();
      const magnetic = createMagneticController(element, {
        radius: 100,
        snapPoints: [{ x: 20, y: 0 }],
        snapDistance: 15,
        onSnap,
      });

      // Move so calculated target is near (20, 0)
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 280, clientY: 225 }));
      expect(magnetic.getState().targetX).toBe(20);
      expect(onSnap).toHaveBeenCalledWith({ x: 20, y: 0 }, expect.any(Object));

      magnetic.destroy();
    });

    it("applies and cleans up transform layer correctly", () => {
      element.style.transform = "scale(1.2)";

      const magnetic = createMagneticController(element, {
        radius: 100,
      });

      // Move inside
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 270, clientY: 225 }));

      // Clean destroy should restore original transform
      magnetic.destroy();
      expect(element.style.transform).toBe("scale(1.2)");
    });
  });

  describe("3. Magnetic Group Controller", () => {
    let secondElement: HTMLDivElement;

    beforeEach(() => {
      secondElement = document.createElement("div");
      secondElement.id = "second-btn";
      secondElement.style.width = "100px";
      secondElement.style.height = "50px";
      secondElement.style.position = "absolute";
      secondElement.style.left = "320px";
      secondElement.style.top = "200px";
      document.body.appendChild(secondElement);

      vi.spyOn(secondElement, "getBoundingClientRect").mockReturnValue({
        left: 320,
        top: 200,
        width: 100,
        height: 50,
        right: 420,
        bottom: 250,
        x: 320,
        y: 200,
        toJSON: () => {},
      });
    });

    afterEach(() => {
      if (secondElement.parentNode) secondElement.parentNode.removeChild(secondElement);
    });

    it("arbitrates closest element without conflicting pull", () => {
      const onActiveMemberChange = vi.fn();

      const group = createMagneticGroup([element, secondElement], {
        prioritizeClosest: true,
        sharedRadius: 100,
        onActiveMemberChange,
      });

      expect(group.members.length).toBe(2);

      // Pointer closer to element 1 (center 250, 225)
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 240, clientY: 225 }));
      expect(group.getActiveMember()).toBe(element);
      expect(onActiveMemberChange).toHaveBeenCalledWith(element);

      // Pointer closer to element 2 (center 370, 225)
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 380, clientY: 225 }));
      expect(group.getActiveMember()).toBe(secondElement);
      expect(onActiveMemberChange).toHaveBeenCalledWith(secondElement);

      group.destroy();
    });

    it("allows dynamic addition and removal of group members", () => {
      const group = createMagneticGroup([element]);
      expect(group.members.length).toBe(1);

      const ctrl2 = group.addMember(secondElement);
      expect(group.members.length).toBe(2);
      expect(ctrl2).toBeDefined();

      group.removeMember(element);
      expect(group.members.length).toBe(1);
      expect(group.members[0].element).toBe(secondElement);

      group.destroy();
    });

    it("disables and resets all group members cleanly", () => {
      const group = createMagneticGroup([element, secondElement]);

      group.disable();
      expect(group.getActiveMember()).toBeNull();

      group.enable();
      group.reset();
      group.destroy();
    });
  });
});
