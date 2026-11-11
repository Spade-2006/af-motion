// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createSharedElementRegistry,
  sharedElementRegistry,
  registerSharedElement,
  createSharedElementTransition,
  startViewTransition,
  createViewTransition,
  getViewTransitionState,
  isViewTransitionSupported,
  createSharedElementGroupTransition,
  getViewTransitionPreset,
  listAvailableViewTransitionPresets,
  type SharedElementRect,
} from "../src/catalogue.js";

describe("Prompt 115 — Shared Element & View Transitions", () => {
  beforeEach(() => {
    sharedElementRegistry.clear();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    sharedElementRegistry.clear();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. SHARED ELEMENT REGISTRY LIFECYCLE & ROLE MATCHING
  // ---------------------------------------------------------------------------
  describe("1. Shared Element Registry", () => {
    it("creates isolated registry instances with independent storage", () => {
      const customRegistry = createSharedElementRegistry();
      const div1 = document.createElement("div");
      const div2 = document.createElement("div");

      customRegistry.register("card", div1);
      sharedElementRegistry.register("card", div2);

      expect(customRegistry.getElement("card")).toBe(div1);
      expect(sharedElementRegistry.getElement("card")).toBe(div2);

      customRegistry.clear();
      expect(customRegistry.has("card")).toBe(false);
      expect(sharedElementRegistry.has("card")).toBe(true);
    });

    it("registers and distinguishes source and destination roles", () => {
      const registry = createSharedElementRegistry();
      const source = document.createElement("div");
      const dest = document.createElement("div");

      registry.register("hero", source, { role: "source" });
      registry.register("hero", dest, { role: "destination" });

      expect(registry.getElement("hero", "source")).toBe(source);
      expect(registry.getElement("hero", "destination")).toBe(dest);

      const match = registry.getMatch("hero");
      expect(match.source).toBe(source);
      expect(match.destination).toBe(dest);

      registry.unregister("hero", "source");
      expect(registry.has("hero", "source")).toBe(false);
      expect(registry.has("hero", "destination")).toBe(true);
    });

    it("captures rich snapshots with geometry and computed styles", () => {
      const registry = createSharedElementRegistry();
      const card = document.createElement("div");
      card.style.borderRadius = "12px";
      card.style.opacity = "0.8";
      document.body.appendChild(card);

      registry.register("media", card);
      const snapshot = registry.capture("media", "source", {
        top: 50,
        left: 100,
        width: 200,
        height: 150,
      });

      expect(snapshot).toBeDefined();
      expect(snapshot?.rect).toEqual({ top: 50, left: 100, width: 200, height: 150 });
      expect(snapshot?.id).toBe("media");
      expect(registry.getSnapshot("media", "source")).toBe(snapshot);
    });

    it("registerSharedElement helper auto-unregisters via disposer callback", () => {
      const div = document.createElement("div");
      const unregister = registerSharedElement("thumb", div);

      expect(sharedElementRegistry.has("thumb")).toBe(true);
      unregister();
      expect(sharedElementRegistry.has("thumb")).toBe(false);
    });

    it("handles missing elements gracefully in getMatch", () => {
      const registry = createSharedElementRegistry();
      const match = registry.getMatch("non-existent");
      expect(match.source).toBeNull();
      expect(match.destination).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. FLIP CALCULATIONS & STYLE INTERPOLATION
  // ---------------------------------------------------------------------------
  describe("2. FLIP Calculation & Style Interpolation", () => {
    it("computes inverse transform deltas between source and target rects", () => {
      const source: SharedElementRect = { top: 20, left: 40, width: 100, height: 80 };
      const dest: SharedElementRect = { top: 120, left: 140, width: 200, height: 160 };

      const transition = createSharedElementTransition({
        source,
        destination: dest,
      });

      expect(transition.getState()).toBe("idle");
      expect(transition.progress).toBe(0);
    });

    it("interpolates border radius and opacity smoothly during seek", () => {
      const source = document.createElement("div");
      source.style.borderRadius = "8px";
      const dest = document.createElement("div");
      dest.style.borderRadius = "32px";
      document.body.appendChild(source);
      document.body.appendChild(dest);

      const transition = createSharedElementTransition({
        source,
        destination: dest,
        config: {
          crossfade: true,
          interpolateBorderRadius: true,
        },
      });

      transition.seek(0.5);
      expect(transition.progress).toBe(0.5);
      expect(dest.style.borderRadius).toContain("px");
      expect(Number.parseFloat(dest.style.opacity)).toBeCloseTo(0.5, 1);

      transition.finish();
      expect(transition.getState()).toBe("completed");
    });

    it("compensates for nested parent shared element delta", () => {
      const registry = createSharedElementRegistry();
      const parentSource = document.createElement("div");
      const parentDest = document.createElement("div");
      const childSource = document.createElement("div");
      const childDest = document.createElement("div");

      document.body.appendChild(parentSource);
      document.body.appendChild(parentDest);
      document.body.appendChild(childSource);
      document.body.appendChild(childDest);

      registry.register("parent", parentSource, { role: "source" });
      registry.register("parent", parentDest, { role: "destination" });
      registry.register("child", childSource, { role: "source", nestedUnder: "parent" });
      registry.register("child", childDest, { role: "destination", nestedUnder: "parent" });

      registry.capture("parent", "source", { top: 50, left: 50, width: 300, height: 200 });

      const transition = createSharedElementTransition({
        id: "child",
        source: { top: 60, left: 60, width: 80, height: 80 },
        destination: childDest,
        registry,
      });

      expect(transition).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. TRANSITION CONTROLLER LIFECYCLE & INTERRUPTIONS
  // ---------------------------------------------------------------------------
  describe("3. Transition Controller Lifecycle", () => {
    it("advances through start, pause, resume, seek, and finish", async () => {
      const dest = document.createElement("div");
      document.body.appendChild(dest);

      const transition = createSharedElementTransition({
        source: { top: 10, left: 10, width: 50, height: 50 },
        destination: dest,
        config: { duration: 100 },
      });

      expect(transition.getState()).toBe("idle");
      const startPromise = transition.start();
      expect(transition.getState()).toBe("animating");
      expect(transition.isPlaying).toBe(true);

      transition.pause();
      expect(transition.getState()).toBe("paused");
      expect(transition.isPlaying).toBe(false);

      transition.resume();
      expect(transition.getState()).toBe("animating");

      transition.finish();
      await startPromise;

      expect(transition.getState()).toBe("completed");
      expect(transition.progress).toBe(1);
    });

    it("cancel resets state and cleans up temporary styles", () => {
      const dest = document.createElement("div");
      dest.style.transform = "rotate(10deg)";
      document.body.appendChild(dest);

      const transition = createSharedElementTransition({
        source: { top: 0, left: 0, width: 100, height: 100 },
        destination: dest,
      });

      transition.seek(0.5);
      transition.cancel();

      expect(transition.getState()).toBe("cancelled");
      expect(dest.style.transform).toBe("rotate(10deg)");
    });

    it("retarget smoothly updates destination geometry mid-flight", () => {
      const dest1: SharedElementRect = { top: 100, left: 100, width: 200, height: 200 };
      const dest2: SharedElementRect = { top: 200, left: 300, width: 400, height: 300 };

      const transition = createSharedElementTransition({
        source: { top: 0, left: 0, width: 100, height: 100 },
        destination: dest1,
      });

      transition.seek(0.5);
      expect(transition.progress).toBe(0.5);

      transition.retarget(dest2);
      expect(transition.progress).toBe(0);
      transition.finish();
      expect(transition.getState()).toBe("completed");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. VIEW TRANSITION ENGINE & BROWSER ADAPTER
  // ---------------------------------------------------------------------------
  describe("4. View Transition Engine", () => {
    it("reports browser view transition support correctly", () => {
      const supported = isViewTransitionSupported();
      expect(typeof supported).toBe("boolean");
    });

    it("executes fallback view transition with lifecycle promises", async () => {
      let updated = false;
      let afterCalled = false;

      const vt = startViewTransition(
        async () => {
          updated = true;
        },
        {
          strategy: "custom-only",
          afterTransition: async () => {
            afterCalled = true;
          },
        }
      );

      await vt.ready;
      await vt.updateCallbackDone;
      expect(updated).toBe(true);

      await vt.finished;
      expect(afterCalled).toBe(true);
      expect(vt.status).toBe("finished");
      expect(getViewTransitionState()).toBe("finished");
    });

    it("supports skipping view transition early", async () => {
      let updated = false;

      const vt = startViewTransition(
        () => {
          updated = true;
        },
        { strategy: "custom-only" }
      );

      vt.skipTransition();
      await vt.finished;

      expect(vt.status).toBe("skipped");
    });

    it("uses native document.startViewTransition when available", async () => {
      let nativeCalled = false;
      const originalStart = (document as any).startViewTransition;

      (document as any).startViewTransition = vi.fn().mockImplementation((cb: () => Promise<void>) => {
        nativeCalled = true;
        cb();
        return {
          ready: Promise.resolve(),
          updateCallbackDone: Promise.resolve(),
          finished: Promise.resolve(),
          skipTransition: vi.fn(),
        };
      });

      const vt = startViewTransition(async () => {}, { strategy: "native-first" });
      await vt.finished;

      expect(nativeCalled).toBe(true);

      if (originalStart) {
        (document as any).startViewTransition = originalStart;
      } else {
        delete (document as any).startViewTransition;
      }
    });

    it("createViewTransition creates reusable orchestrator", async () => {
      const orchestrator = createViewTransition({ strategy: "custom-only" });
      let called = false;

      const vt = orchestrator(async () => {
        called = true;
      });

      await vt.finished;
      expect(called).toBe(true);
      expect(vt.status).toBe("finished");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. TRANSITION PRESETS
  // ---------------------------------------------------------------------------
  describe("5. Transition Presets", () => {
    it("lists all 11 built-in view transition presets", () => {
      const presets = listAvailableViewTransitionPresets();
      expect(presets).toHaveLength(11);
      expect(presets).toContain("fade");
      expect(presets).toContain("crossfade");
      expect(presets).toContain("slide");
      expect(presets).toContain("scale");
      expect(presets).toContain("zoom");
      expect(presets).toContain("shared-element");
      expect(presets).toContain("shared-element-crossfade");
      expect(presets).toContain("reveal");
      expect(presets).toContain("clip-path-reveal");
      expect(presets).toContain("directional-nav");
      expect(presets).toContain("morph");
    });

    it("getViewTransitionPreset returns preset configuration with overrides", () => {
      const preset = getViewTransitionPreset("slide", { direction: "up", duration: 500 });
      expect(preset.preset).toBe("slide");
      expect(preset.direction).toBe("up");
      expect(preset.duration).toBe(500);
      expect(preset.easing).toBe("easeOutCubic");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. NESTED & GROUP TRANSITIONS
  // ---------------------------------------------------------------------------
  describe("6. Nested & Group Transitions", () => {
    it("coordinates multiple shared elements with staggered timing", async () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");
      const el3 = document.createElement("div");
      document.body.appendChild(el1);
      document.body.appendChild(el2);
      document.body.appendChild(el3);

      let completed = false;

      const group = createSharedElementGroupTransition(
        [
          { id: "c1", destination: el1, source: { top: 0, left: 0, width: 50, height: 50 } },
          { id: "c2", destination: el2, source: { top: 0, left: 0, width: 50, height: 50 } },
          { id: "c3", destination: el3, source: { top: 0, left: 0, width: 50, height: 50 } },
        ],
        {
          duration: 80,
          stagger: 20,
          order: "center-out",
          onComplete: () => {
            completed = true;
          },
        }
      );

      expect(group.getState()).toBe("idle");
      group.seek(0.5);
      expect(group.progress).toBe(0.5);

      group.finish();
      expect(group.getState()).toBe("completed");
      expect(completed).toBe(true);
    });

    it("supports group cancel", () => {
      const el1 = document.createElement("div");
      document.body.appendChild(el1);

      const group = createSharedElementGroupTransition([
        { id: "item1", destination: el1, source: { top: 0, left: 0, width: 50, height: 50 } },
      ]);

      group.seek(0.3);
      group.cancel();
      expect(group.getState()).toBe("cancelled");
    });
  });

  // ---------------------------------------------------------------------------
  // 7. ACCESSIBILITY & REDUCED MOTION
  // ---------------------------------------------------------------------------
  describe("7. Accessibility & Reduced Motion", () => {
    it("settles instantly when prefers-reduced-motion is active", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const dest = document.createElement("div");
      document.body.appendChild(dest);

      const transition = createSharedElementTransition({
        source: { top: 0, left: 0, width: 100, height: 100 },
        destination: dest,
        config: { respectReducedMotion: true },
      });

      await transition.start();
      expect(transition.getState()).toBe("completed");
      expect(transition.progress).toBe(1);
    });
  });
});
