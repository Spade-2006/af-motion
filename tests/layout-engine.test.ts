// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLayoutController,
  createLayoutGroup,
  measureLayout,
  measureAbsoluteRect,
  animateLayoutChange,
  computeFLIPDelta,
  createFLIPKeyframes,
  batchLayoutUpdate,
  resolveLayoutConfig,
  areRectsEqual,
  getViewportScroll,
  LAYOUT_PRESETS,
  type LayoutRect,
  type LayoutController,
  type LayoutGroup,
} from "../src/catalogue.js";

describe("Prompt 111 — Automatic Layout Animation Engine", () => {
  let container: HTMLDivElement;
  let element1: HTMLDivElement;
  let element2: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "layout-container";
    container.style.position = "relative";
    container.style.width = "800px";
    container.style.height = "600px";
    document.body.appendChild(container);

    element1 = document.createElement("div");
    element1.id = "el-1";
    element1.style.position = "absolute";
    element1.style.left = "50px";
    element1.style.top = "100px";
    element1.style.width = "200px";
    element1.style.height = "150px";
    container.appendChild(element1);

    element2 = document.createElement("div");
    element2.id = "el-2";
    element2.style.position = "absolute";
    element2.style.left = "300px";
    element2.style.top = "100px";
    element2.style.width = "200px";
    element2.style.height = "150px";
    container.appendChild(element2);

    // Mock getBoundingClientRect for deterministic testing
    vi.spyOn(element1, "getBoundingClientRect").mockImplementation(() => ({
      left: parseFloat(element1.style.left) || 50,
      top: parseFloat(element1.style.top) || 100,
      width: parseFloat(element1.style.width) || 200,
      height: parseFloat(element1.style.height) || 150,
      right: (parseFloat(element1.style.left) || 50) + (parseFloat(element1.style.width) || 200),
      bottom: (parseFloat(element1.style.top) || 100) + (parseFloat(element1.style.height) || 150),
      x: parseFloat(element1.style.left) || 50,
      y: parseFloat(element1.style.top) || 100,
      toJSON: () => {},
    }));

    vi.spyOn(element2, "getBoundingClientRect").mockImplementation(() => ({
      left: parseFloat(element2.style.left) || 300,
      top: parseFloat(element2.style.top) || 100,
      width: parseFloat(element2.style.width) || 200,
      height: parseFloat(element2.style.height) || 150,
      right: (parseFloat(element2.style.left) || 300) + (parseFloat(element2.style.width) || 200),
      bottom: (parseFloat(element2.style.top) || 100) + (parseFloat(element2.style.height) || 150),
      x: parseFloat(element2.style.left) || 300,
      y: parseFloat(element2.style.top) || 100,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. GEOMETRIC MEASUREMENT & SCROLL AWARENESS
  // -------------------------------------------------------------------------
  describe("1. Geometric Measurement & Scroll Awareness", () => {
    it("measures element layout accurately", () => {
      const rect = measureLayout(element1);
      expect(rect.left).toBe(50);
      expect(rect.top).toBe(100);
      expect(rect.width).toBe(200);
      expect(rect.height).toBe(150);
      expect(rect.right).toBe(250);
      expect(rect.bottom).toBe(250);
    });

    it("measures absolute rect without scroll offsets", () => {
      const rect = measureAbsoluteRect(element1);
      expect(rect.left).toBe(50);
      expect(rect.top).toBe(100);
      expect(rect.width).toBe(200);
      expect(rect.height).toBe(150);
    });

    it("evaluates rect equality within tolerance threshold", () => {
      const rectA: LayoutRect = { left: 10, top: 20, width: 100, height: 100, right: 110, bottom: 120 };
      const rectB: LayoutRect = { left: 10.3, top: 20.2, width: 100.1, height: 99.8, right: 110.4, bottom: 120 };
      const rectC: LayoutRect = { left: 15, top: 20, width: 100, height: 100, right: 115, bottom: 120 };

      expect(areRectsEqual(rectA, rectB, 0.5)).toBe(true);
      expect(areRectsEqual(rectA, rectC, 0.5)).toBe(false);
      expect(areRectsEqual(null, null)).toBe(true);
      expect(areRectsEqual(rectA, null)).toBe(false);
    });

    it("safely retrieves viewport scroll in DOM environment", () => {
      const scroll = getViewportScroll();
      expect(typeof scroll.x).toBe("number");
      expect(typeof scroll.y).toBe("number");
    });
  });

  // -------------------------------------------------------------------------
  // 2. FLIP DELTA CALCULATIONS & KEYFRAMES
  // -------------------------------------------------------------------------
  describe("2. FLIP Delta Calculations & Keyframes", () => {
    const firstRect: LayoutRect = {
      left: 100,
      top: 50,
      width: 200,
      height: 100,
      right: 300,
      bottom: 150,
    };

    const lastRect: LayoutRect = {
      left: 250,
      top: 150,
      width: 400,
      height: 200,
      right: 650,
      bottom: 350,
    };

    it("computes movement and scale deltas correctly in mode 'both'", () => {
      const delta = computeFLIPDelta(firstRect, lastRect, { mode: "both" });

      // First (100) - Last (250) = -150
      expect(delta.deltaX).toBe(-150);
      // First (50) - Last (150) = -100
      expect(delta.deltaY).toBe(-100);
      // FirstWidth (200) / LastWidth (400) = 0.5
      expect(delta.scaleX).toBe(0.5);
      // FirstHeight (100) / LastHeight (200) = 0.5
      expect(delta.scaleY).toBe(0.5);
      expect(delta.hasMoved).toBe(true);
      expect(delta.hasResized).toBe(true);
    });

    it("locks scale to 1 in mode 'position'", () => {
      const delta = computeFLIPDelta(firstRect, lastRect, { mode: "position" });
      expect(delta.deltaX).toBe(-150);
      expect(delta.deltaY).toBe(-100);
      expect(delta.scaleX).toBe(1);
      expect(delta.scaleY).toBe(1);
      expect(delta.hasMoved).toBe(true);
      expect(delta.hasResized).toBe(false);
    });

    it("locks delta translation to 0 in mode 'size'", () => {
      const delta = computeFLIPDelta(firstRect, lastRect, { mode: "size" });
      expect(delta.deltaX).toBe(0);
      expect(delta.deltaY).toBe(0);
      expect(delta.scaleX).toBe(0.5);
      expect(delta.scaleY).toBe(0.5);
      expect(delta.hasMoved).toBe(false);
      expect(delta.hasResized).toBe(true);
    });

    it("locks to dominant axis when crossAxis is false", () => {
      // deltaX = -150, deltaY = -100 -> dominant is X
      const delta = computeFLIPDelta(firstRect, lastRect, { crossAxis: false });
      expect(delta.deltaX).toBe(-150);
      expect(delta.deltaY).toBe(0);
    });

    it("creates animatable keyframes for FLIP inversion", () => {
      const delta = computeFLIPDelta(firstRect, lastRect, { mode: "both" });
      const keyframes = createFLIPKeyframes(delta, { transformOrigin: "top left" });

      expect(keyframes.transform).toBeDefined();
      expect(keyframes.transform[0]).toContain("translate3d(-150px, -100px, 0px) scale(0.5, 0.5)");
      expect(keyframes.transform[1]).toBe("translate3d(0px, 0px, 0px) scale(1, 1)");
      expect(keyframes.transformOrigin).toEqual(["top left", "top left"]);
    });

    it("includes opacity dip in mode 'fade-through'", () => {
      const delta = computeFLIPDelta(firstRect, lastRect, { mode: "fade-through" });
      const keyframes = createFLIPKeyframes(delta, { mode: "fade-through" });

      expect(keyframes.opacity).toBeDefined();
      expect(keyframes.opacity![0]).toBe("0.5");
      expect(keyframes.opacity![1]).toBe("1");
    });
  });

  // -------------------------------------------------------------------------
  // 3. PRESETS & CONFIGURATION RESOLUTION
  // -------------------------------------------------------------------------
  describe("3. Presets & Configuration Resolution", () => {
    it("resolves default configuration when no options provided", () => {
      const resolved = resolveLayoutConfig();
      expect(resolved.duration).toBe(300);
      expect(resolved.mode).toBe("both");
      expect(resolved.transformOrigin).toBe("top left");
      expect(resolved.respectReducedMotion).toBe(true);
    });

    it("resolves built-in layout presets", () => {
      const gentle = resolveLayoutConfig({ preset: "gentle" });
      expect(gentle.duration).toBe(LAYOUT_PRESETS.gentle.duration);
      expect(gentle.easing).toBe(LAYOUT_PRESETS.gentle.easing);

      const snappy = resolveLayoutConfig({ preset: "snappy" });
      expect(snappy.duration).toBe(LAYOUT_PRESETS.snappy.duration);
      expect(snappy.easing).toBe(LAYOUT_PRESETS.snappy.easing);

      const bouncy = resolveLayoutConfig({ preset: "bouncy" });
      expect(bouncy.duration).toBe(LAYOUT_PRESETS.bouncy.duration);
      expect(bouncy.easing).toBe(LAYOUT_PRESETS.bouncy.easing);
    });

    it("allows user overrides over preset values", () => {
      const custom = resolveLayoutConfig({ preset: "snappy", duration: 500 });
      expect(custom.duration).toBe(500);
      expect(custom.easing).toBe(LAYOUT_PRESETS.snappy.easing);
    });
  });

  // -------------------------------------------------------------------------
  // 4. LAYOUT CONTROLLER (SINGLE ELEMENT)
  // -------------------------------------------------------------------------
  describe("4. Layout Controller Lifecycle", () => {
    let controller: LayoutController;

    afterEach(() => {
      controller?.destroy();
    });

    it("initializes and captures initial element bounds", () => {
      controller = createLayoutController(element1);
      expect(controller.id).toBeDefined();
      expect(controller.element).toBe(element1);
      expect(controller.isAnimating()).toBe(false);

      const state = controller.getState();
      expect(state.bounds).toMatchObject({
        left: 50,
        top: 100,
        width: 200,
        height: 150,
      });
    });

    it("animates layout change when element position changes", () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();
      const onLayoutChange = vi.fn();

      controller = createLayoutController(element1, {
        preset: "snappy",
        onStart,
        onComplete,
        onLayoutChange,
      });

      // Record First
      controller.record();

      // Mutate layout: move to left: 150px, top: 200px
      element1.style.left = "150px";
      element1.style.top = "200px";

      // Animate Last -> Invert -> Play
      const controls = controller.animate();
      expect(controls).toBeDefined();
      expect(onLayoutChange).toHaveBeenCalledTimes(1);

      const changeEvent = onLayoutChange.mock.calls[0][0];
      expect(changeEvent.hasMoved).toBe(true);
      expect(changeEvent.deltaX).toBe(-100);
      expect(changeEvent.deltaY).toBe(-100);
      expect(controller.isAnimating()).toBe(true);

      // Fast-forward / complete animation
      controls?.cancel();
      expect(controller.isAnimating()).toBe(false);
    });

    it("returns null if no perceptible layout change occurred", () => {
      controller = createLayoutController(element1);
      controller.record();

      // No style or position change
      const controls = controller.animate();
      expect(controls).toBeNull();
      expect(controller.isAnimating()).toBe(false);
    });

    it("supports programmatic playback controls (play, pause, cancel, finish)", () => {
      controller = createLayoutController(element1);
      controller.record();

      element1.style.left = "250px";
      const controls = controller.animate();
      expect(controls).toBeDefined();

      controller.pause();
      controller.play();
      controller.finish();
      expect(controller.isAnimating()).toBe(false);

      // Re-trigger and cancel
      element1.style.left = "300px";
      controller.animate();
      controller.cancel();
      expect(controller.isAnimating()).toBe(false);
    });

    it("retargets active layout animation cleanly without visual jumping", () => {
      controller = createLayoutController(element1);
      controller.record();

      // Change 1
      element1.style.left = "200px";
      controller.animate();
      expect(controller.isAnimating()).toBe(true);

      // Change 2 mid-flight: retarget to 350px
      element1.style.left = "350px";
      controller.retarget({
        left: 350,
        top: 100,
        width: 200,
        height: 150,
        right: 550,
        bottom: 250,
      });

      expect(controller.isAnimating()).toBe(true);
      controller.cancel();
    });
  });

  // -------------------------------------------------------------------------
  // 5. LAYOUT GROUPS & STAGGERING
  // -------------------------------------------------------------------------
  describe("5. Layout Groups & Coordinated Staggering", () => {
    let group: LayoutGroup;

    afterEach(() => {
      group?.destroy();
    });

    it("registers multiple elements and tracks members", () => {
      group = createLayoutGroup({ id: "card-grid" });

      const ctrl1 = group.add(element1);
      const ctrl2 = group.add(element2);

      expect(group.getAll().length).toBe(2);
      expect(group.get(element1)).toBe(ctrl1);
      expect(group.get(element2)).toBe(ctrl2);

      group.remove(element1);
      expect(group.getAll().length).toBe(1);
      expect(group.get(element1)).toBeUndefined();
    });

    it("batches measurements across all members in recordAll()", () => {
      group = createLayoutGroup();
      group.add(element1);
      group.add(element2);

      const measurements = group.measureAll();
      expect(measurements.size).toBe(2);

      group.recordAll();
      const ctrl1 = group.get(element1)!;
      expect(ctrl1.getBounds()?.left).toBe(50);
    });

    it("animates all changed members with configurable stagger delays", () => {
      group = createLayoutGroup({
        stagger: 50,
        staggerDirection: "forward",
      });

      group.add(element1);
      group.add(element2);

      // Record First
      group.recordAll();

      // Mutate both elements
      element1.style.left = "100px";
      element2.style.left = "400px";

      // Animate all with stagger
      const controlsList = group.animateAll();
      expect(controlsList.length).toBe(2);

      group.cancelAll();
    });

    it("supports reverse and center stagger directions", () => {
      group = createLayoutGroup({
        stagger: 40,
        staggerDirection: "reverse",
      });

      group.add(element1);
      group.add(element2);

      group.recordAll();
      element1.style.left = "120px";
      element2.style.left = "420px";

      const controlsList = group.animateAll({ staggerDirection: "center" });
      expect(controlsList.length).toBe(2);

      group.cancelAll();
    });

    it("executes batchLayoutUpdate helper in single read-mutate-animate cycle", () => {
      group = createLayoutGroup();
      group.add(element1);
      group.add(element2);

      const controls = batchLayoutUpdate(() => {
        element1.style.left = "180px";
        element2.style.left = "480px";
      }, group);

      expect(controls.length).toBe(2);
      group.cancelAll();
    });
  });

  // -------------------------------------------------------------------------
  // 6. GRID, FLEX & REORDERING SCENARIOS
  // -------------------------------------------------------------------------
  describe("6. Grid & Flex Reordering Scenarios", () => {
    it("animates position swaps between two items", () => {
      const group = createLayoutGroup({ preset: "smooth" });
      const ctrl1 = group.add(element1);
      const ctrl2 = group.add(element2);

      // Initial positions: el1 at 50px, el2 at 300px
      group.recordAll();

      // Swap positions
      element1.style.left = "300px";
      element2.style.left = "50px";

      const controls = group.animateAll();
      expect(controls.length).toBe(2);

      const delta1 = ctrl1.getState().lastDelta!;
      const delta2 = ctrl2.getState().lastDelta!;

      // el1 moved right: deltaX = 50 - 300 = -250
      expect(delta1.deltaX).toBe(-250);
      // el2 moved left: deltaX = 300 - 50 = +250
      expect(delta2.deltaX).toBe(250);

      group.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 7. PERFORMANCE, ACCESSIBILITY & OBSERVATION CLEANUP
  // -------------------------------------------------------------------------
  describe("7. Performance, Accessibility & Cleanup", () => {
    it("cleans up observers and animation frames on destroy", () => {
      const ctrl = createLayoutController(element1, { autoObserve: true });
      expect(ctrl.getState().isObserved).toBe(true);

      ctrl.destroy();
      expect(ctrl.getState().isObserved).toBe(false);
    });

    it("respects reduced-motion preference without visual distortion", () => {
      const onStart = vi.fn();
      const onComplete = vi.fn();

      const ctrl = createLayoutController(element1, {
        respectReducedMotion: true,
        onStart,
        onComplete,
      });

      ctrl.record();
      element1.style.left = "250px";

      // With reduced motion, animateLayoutChange returns completed controls immediately
      const controls = animateLayoutChange(element1, {
        left: 50,
        top: 100,
        width: 200,
        height: 150,
        right: 250,
        bottom: 250,
      }, {
        respectReducedMotion: true,
        onStart,
        onComplete,
      });

      expect(controls).toBeDefined();
      ctrl.destroy();
    });
  });
});
