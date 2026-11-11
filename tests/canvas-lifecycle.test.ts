import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireBackgroundTarget,
  createMotionFrameScheduler,
  insertBackgroundElement,
  releaseBackgroundCanvas,
  releaseBackgroundTarget,
  removeBackgroundElement,
  resizeCanvasToElement,
  resolveBackgroundColors,
  subscribeToActiveBackgroundPalette,
} from "../src/backgrounds/internal/canvas-lifecycle.js";
import { activatePalette, registerPalette, removePalette } from "../src/core/palettes.js";

class FakeStyle {
  private readonly values = new Map<string, string>();
  private readonly priorities = new Map<string, string>();

  getPropertyValue(property: string): string {
    return this.values.get(property) ?? "";
  }
  getPropertyPriority(property: string): string {
    return this.priorities.get(property) ?? "";
  }
  setProperty(property: string, value: string, priority = ""): void {
    this.values.set(property, value);
    if (priority) this.priorities.set(property, priority);
    else this.priorities.delete(property);
  }
  removeProperty(property: string): void {
    this.values.delete(property);
    this.priorities.delete(property);
  }
}

class FakeTarget {
  style = new FakeStyle();
}

class FakeElement extends FakeTarget {
  parentElement: FakeElement | null = null;
  children: FakeElement[] = [];

  get firstChild(): FakeElement | null {
    return this.children[0] ?? null;
  }
  get nextSibling(): FakeElement | null {
    if (!this.parentElement) return null;
    const index = this.parentElement.children.indexOf(this);
    return index >= 0 && index + 1 < this.parentElement.children.length
      ? this.parentElement.children[index + 1] ?? null
      : null;
  }
  insertBefore<T extends FakeElement>(node: T, before: FakeElement | null): T {
    node.parentElement = this;
    const index = before === null ? -1 : this.children.indexOf(before);
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    return node;
  }
  removeChild<T extends FakeElement>(node: T): T {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parentElement = null;
    }
    return node;
  }
}

let reducedMotion = false;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let visibilityListeners: Set<EventListener>;
const documentState = { hidden: false };

function flushFrame(time: number): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

beforeEach(() => {
  reducedMotion = false;
  motionListeners = new Set();
  frames = new Map();
  nextFrameId = 1;
  visibilityListeners = new Set();
  documentState.hidden = false;

  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.add(listener),
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => motionListeners.delete(listener),
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("document", {
    get hidden() {
      return documentState.hidden;
    },
    addEventListener: (_type: string, listener: EventListener) => visibilityListeners.add(listener),
    removeEventListener: (_type: string, listener: EventListener) => visibilityListeners.delete(listener),
  });
  vi.stubGlobal("getComputedStyle", (target: FakeTarget) => ({
    position: target.style.getPropertyValue("position") || "static",
    isolation: target.style.getPropertyValue("isolation") || "auto",
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shared Canvas lifecycle utilities", () => {
  it("schedules one capped frame for visible targets and cleans up listeners", () => {
    const first = {};
    const second = {};
    const update = vi.fn();
    const renderStatic = vi.fn();
    const scheduler = createMotionFrameScheduler({
      speed: 2,
      animated: true,
      errorName: "test effect",
      update,
      renderStatic,
    });

    scheduler.setVisible(first, true);
    scheduler.setVisible(first, true);
    scheduler.setVisible(second, true);
    expect(frames.size).toBe(1);

    flushFrame(0);
    expect(update).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(1);
    flushFrame(1000);
    expect(update).toHaveBeenNthCalledWith(3, first, 0.1, 1000);
    expect(update).toHaveBeenNthCalledWith(4, second, 0.1, 1000);
    expect(frames.size).toBe(1);

    scheduler.destroy();
    scheduler.destroy();
    expect(frames.size).toBe(0);
    expect(visibilityListeners.size).toBe(0);
    expect(motionListeners.size).toBe(0);
    scheduler.setVisible(first, true);
    expect(frames.size).toBe(0);
  });

  it("pauses for hidden documents and reduced motion, then resumes safely", () => {
    const target = {};
    const update = vi.fn();
    const renderStatic = vi.fn();
    const scheduler = createMotionFrameScheduler({
      speed: 1,
      animated: true,
      errorName: "test effect",
      update,
      renderStatic,
    });
    scheduler.setVisible(target, true);
    expect(frames.size).toBe(1);

    documentState.hidden = true;
    for (const listener of visibilityListeners) listener(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    documentState.hidden = false;
    for (const listener of visibilityListeners) listener(new Event("visibilitychange"));
    expect(frames.size).toBe(1);

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(frames.size).toBe(0);
    expect(renderStatic).toHaveBeenCalledOnce();
    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(frames.size).toBe(1);
    scheduler.destroy();
  });

  it("restores shared target styles after the last owner releases them", () => {
    const target = new FakeTarget();
    target.style.setProperty("position", "absolute", "important");
    target.style.setProperty("isolation", "auto", "important");

    acquireBackgroundTarget(target as unknown as HTMLElement);
    acquireBackgroundTarget(target as unknown as HTMLElement);
    expect(target.style.getPropertyValue("position")).toBe("absolute");
    expect(target.style.getPropertyValue("isolation")).toBe("isolate");

    releaseBackgroundTarget(target as unknown as HTMLElement);
    expect(target.style.getPropertyValue("isolation")).toBe("isolate");
    releaseBackgroundTarget(target as unknown as HTMLElement);
    expect(target.style.getPropertyValue("position")).toBe("absolute");
    expect(target.style.getPropertyPriority("position")).toBe("important");
    expect(target.style.getPropertyValue("isolation")).toBe("auto");
    expect(target.style.getPropertyPriority("isolation")).toBe("important");
  });

  it("resizes backing canvases with a capped device-pixel ratio", () => {
    const canvas = { width: 0, height: 0 };
    const context = { setTransform: vi.fn() };
    vi.stubGlobal("devicePixelRatio", 3);
    const state = {
      element: {} as HTMLElement,
      canvas: canvas as HTMLCanvasElement,
      context: context as unknown as CanvasRenderingContext2D,
      width: 0,
      height: 0,
    };

    resizeCanvasToElement(state, 80.5, 40);
    expect(state.width).toBe(80.5);
    expect(state.height).toBe(40);
    expect(canvas.width).toBe(161);
    expect(canvas.height).toBe(80);
    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

    // Redundant call with same dimensions should avoid resetting transform or dimensions
    context.setTransform.mockClear();
    resizeCanvasToElement(state, 80.5, 40);
    expect(context.setTransform).not.toHaveBeenCalled();
  });

  it("releases retained Canvas backing stores", () => {
    const canvas = { width: 640, height: 480 } as HTMLCanvasElement;
    releaseBackgroundCanvas(canvas);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  describe("multiple backgrounds on one container and stacking order", () => {
    it("stacks multiple background elements in insertion order before foreground content", () => {
      const container = new FakeElement();
      const title = new FakeElement();
      const button = new FakeElement();
      container.insertBefore(title, null);
      container.insertBefore(button, null);

      const bg1 = new FakeElement();
      const bg2 = new FakeElement();
      const bg3 = new FakeElement();

      acquireBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);

      expect(container.children).toEqual([bg1, bg2, bg3, title, button]);
      expect(container.style.getPropertyValue("position")).toBe("relative");
      expect(container.style.getPropertyValue("isolation")).toBe("isolate");

      // Release in order: middle first (bg2)
      releaseBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      expect(container.children).toEqual([bg1, bg3, title, button]);
      expect(container.style.getPropertyValue("position")).toBe("relative");
      expect(container.style.getPropertyValue("isolation")).toBe("isolate");

      // Release first (bg1)
      releaseBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      expect(container.children).toEqual([bg3, title, button]);
      expect(container.style.getPropertyValue("position")).toBe("relative");
      expect(container.style.getPropertyValue("isolation")).toBe("isolate");

      // Release last (bg3) -> all backgrounds released, styles restored
      releaseBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);
      expect(container.children).toEqual([title, button]);
      expect(container.style.getPropertyValue("position")).toBe("");
      expect(container.style.getPropertyValue("isolation")).toBe("");
    });

    it("restores styles cleanly when destroying in reverse order (bg3, bg2, bg1)", () => {
      const container = new FakeElement();
      const content = new FakeElement();
      container.insertBefore(content, null);

      const bg1 = new FakeElement();
      const bg2 = new FakeElement();
      const bg3 = new FakeElement();

      acquireBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);

      expect(container.children).toEqual([bg1, bg2, bg3, content]);

      releaseBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);
      expect(container.children).toEqual([bg1, bg2, content]);
      expect(container.style.getPropertyValue("isolation")).toBe("isolate");

      releaseBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      expect(container.children).toEqual([bg1, content]);
      expect(container.style.getPropertyValue("isolation")).toBe("isolate");

      releaseBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      expect(container.children).toEqual([content]);
      expect(container.style.getPropertyValue("position")).toBe("");
      expect(container.style.getPropertyValue("isolation")).toBe("");
    });

    it("restores styles cleanly when destroying in random order (bg1, bg3, bg2)", () => {
      const container = new FakeElement();
      const content = new FakeElement();
      container.insertBefore(content, null);

      const bg1 = new FakeElement();
      const bg2 = new FakeElement();
      const bg3 = new FakeElement();

      acquireBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);

      releaseBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      expect(container.children).toEqual([bg2, bg3, content]);

      releaseBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);
      expect(container.children).toEqual([bg2, content]);

      releaseBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      expect(container.children).toEqual([content]);
      expect(container.style.getPropertyValue("position")).toBe("");
      expect(container.style.getPropertyValue("isolation")).toBe("");
    });

    it("handles detached background elements gracefully without throwing", () => {
      const container = new FakeElement();
      const bg = new FakeElement();

      acquireBackgroundTarget(container as unknown as HTMLElement, bg as unknown as HTMLElement);
      expect(container.children).toEqual([bg]);

      // Manually detach from DOM before release
      container.removeChild(bg);
      expect(container.children).toEqual([]);

      expect(() => {
        releaseBackgroundTarget(container as unknown as HTMLElement, bg as unknown as HTMLElement);
      }).not.toThrow();
      expect(container.style.getPropertyValue("position")).toBe("");
    });

    it("allows adding a new background after removing one, maintaining proper ordering", () => {
      const container = new FakeElement();
      const content = new FakeElement();
      container.insertBefore(content, null);

      const bg1 = new FakeElement();
      const bg2 = new FakeElement();
      acquireBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      acquireBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      expect(container.children).toEqual([bg1, bg2, content]);

      releaseBackgroundTarget(container as unknown as HTMLElement, bg1 as unknown as HTMLElement);
      expect(container.children).toEqual([bg2, content]);

      const bg3 = new FakeElement();
      acquireBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);
      expect(container.children).toEqual([bg2, bg3, content]);

      releaseBackgroundTarget(container as unknown as HTMLElement, bg2 as unknown as HTMLElement);
      releaseBackgroundTarget(container as unknown as HTMLElement, bg3 as unknown as HTMLElement);
      expect(container.children).toEqual([content]);
      expect(container.style.getPropertyValue("position")).toBe("");
    });
  });

  describe("palette resolution and active background subscriptions", () => {
    const customTheme1 = {
      name: "lifecycle-test-theme-1",
      primary: "#111111",
      secondary: "#222222",
      accent: "#333333",
    };
    const customTheme2 = {
      name: "lifecycle-test-theme-2",
      primary: "#444444",
      secondary: "#555555",
      accent: "#666666",
    };
    const customThemeIdentical = {
      name: "lifecycle-test-theme-identical",
      primary: "#111111",
      secondary: "#222222",
      accent: "#333333",
    };

    beforeEach(() => {
      try { registerPalette(customTheme1); } catch {}
      try { registerPalette(customTheme2); } catch {}
      try { registerPalette(customThemeIdentical); } catch {}
    });

    afterEach(() => {
      removePalette(customTheme1.name);
      removePalette(customTheme2.name);
      removePalette(customThemeIdentical.name);
    });

    it("resolves named, active, and fallback palette colors consistently", () => {
      const fallback = ["#aaaaaa", "#bbbbbb", "#cccccc"];
      expect(resolveBackgroundColors(undefined, fallback)).toBe(fallback);

      const named = resolveBackgroundColors(customTheme1.name, fallback);
      expect(named).toEqual(["#111111", "#222222", "#333333"]);

      // When "active" has no active palette, returns fallback
      expect(resolveBackgroundColors("active", fallback)).toBe(fallback);

      activatePalette(customTheme1.name);
      expect(resolveBackgroundColors("active", fallback)).toEqual(["#111111", "#222222", "#333333"]);
    });

    it("deduplicates active palette updates when colors have not changed", () => {
      const fallback = ["#aaaaaa", "#bbbbbb"];
      activatePalette(customTheme1.name);

      const onColors = vi.fn();
      const unsubscribe = subscribeToActiveBackgroundPalette("active", fallback, onColors);

      // Reactivating the same palette should NOT trigger onColors
      activatePalette(customTheme1.name);
      expect(onColors).not.toHaveBeenCalled();

      // Activating another palette with identical colors should NOT trigger onColors
      activatePalette(customThemeIdentical.name);
      expect(onColors).not.toHaveBeenCalled();

      // Activating a palette with different colors MUST trigger onColors
      activatePalette(customTheme2.name);
      expect(onColors).toHaveBeenCalledTimes(1);
      expect(onColors).toHaveBeenCalledWith(["#444444", "#555555", "#666666"]);

      // Reactivating customTheme2 again should NOT trigger
      activatePalette(customTheme2.name);
      expect(onColors).toHaveBeenCalledTimes(1);

      unsubscribe();
      activatePalette(customTheme1.name);
      expect(onColors).toHaveBeenCalledTimes(1);
    });

    it("notifies multiple backgrounds independently and allows isolated unsubscription", () => {
      const fallback1 = ["#101010"];
      const fallback2 = ["#202020"];
      activatePalette(customTheme1.name);

      const onColors1 = vi.fn();
      const onColors2 = vi.fn();

      const unsub1 = subscribeToActiveBackgroundPalette("active", fallback1, onColors1);
      const unsub2 = subscribeToActiveBackgroundPalette("active", fallback2, onColors2);

      activatePalette(customTheme2.name);
      expect(onColors1).toHaveBeenCalledTimes(1);
      expect(onColors2).toHaveBeenCalledTimes(1);

      // Unsubscribe background 1; background 2 should still receive updates
      unsub1();
      activatePalette(customTheme1.name);
      expect(onColors1).toHaveBeenCalledTimes(1);
      expect(onColors2).toHaveBeenCalledTimes(2);

      unsub2();
      activatePalette(customTheme2.name);
      expect(onColors2).toHaveBeenCalledTimes(2);
    });

    it("returns a no-op cleanup when palette is not active", () => {
      const onColors = vi.fn();
      const unsub = subscribeToActiveBackgroundPalette("customTheme1", ["#fff"], onColors);
      activatePalette(customTheme2.name);
      expect(onColors).not.toHaveBeenCalled();
      expect(() => unsub()).not.toThrow();
    });
  });
  describe("motion scheduler intensity and speed control", () => {
    it("does not schedule animation frames when speed is 0 and does not require requestAnimationFrame", () => {
      const update = vi.fn();
      const renderStatic = vi.fn();
      const scheduler = createMotionFrameScheduler({
        speed: 0,
        animated: true,
        errorName: "speed-zero test",
        update,
        renderStatic,
      });

      const target = {};
      scheduler.setVisible(target, true);
      expect(frames.size).toBe(0);
      expect(update).not.toHaveBeenCalled();

      // Calling setVisible again with speed 0 still does not schedule
      scheduler.setVisible(target, true);
      expect(frames.size).toBe(0);
      scheduler.destroy();
    });

    it("scales elapsed delta proportionally with the speed multiplier", () => {
      const update = vi.fn();
      const scheduler = createMotionFrameScheduler({
        speed: 2.5,
        animated: true,
        errorName: "speed-multiplier test",
        update,
        renderStatic: vi.fn(),
      });

      const target = {};
      scheduler.setVisible(target, true);
      expect(frames.size).toBe(1);

      flushFrame(1000);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenLastCalledWith(target, 0, 1000);

      // 20ms later: elapsed delta = 0.02s * 2.5 = 0.05s
      flushFrame(1020);
      expect(update).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenLastCalledWith(target, 0.05, 1020);
      scheduler.destroy();
    });

    it("preserves animation timing without frame spikes when toggling reduced motion", () => {
      const update = vi.fn();
      const renderStatic = vi.fn();
      const scheduler = createMotionFrameScheduler({
        speed: 1,
        animated: true,
        errorName: "reduced-motion-timing test",
        update,
        renderStatic,
      });

      const target = {};
      scheduler.setVisible(target, true);
      flushFrame(1000);
      expect(update).toHaveBeenCalledWith(target, 0, 1000);

      flushFrame(1016);
      expect(update).toHaveBeenLastCalledWith(target, 0.016, 1016);

      // Enter reduced motion: stops frame, renders static
      reducedMotion = true;
      for (const listener of motionListeners) listener({ matches: true });
      expect(frames.size).toBe(0);
      expect(renderStatic).toHaveBeenCalledOnce();

      // Exit reduced motion 5 seconds later: resumption frame must not produce a 5-second jump
      reducedMotion = false;
      for (const listener of motionListeners) listener({ matches: false });
      expect(frames.size).toBe(1);

      flushFrame(6016);
      expect(update).toHaveBeenCalledTimes(3);
      // Delta should be 0 because previousTime was reset on resume
      expect(update).toHaveBeenLastCalledWith(target, 0, 6016);
      scheduler.destroy();
    });
  });
  describe("lifecycle safety and partial-failure cleanup", () => {
    it("rolls back acquired target styles if inserting the background element throws", () => {
      const container = new FakeElement();
      const faultyBg = new FakeElement();
      // Make insertBefore throw for this container
      container.insertBefore = () => {
        throw new Error("DOM hierarchy error");
      };

      expect(() => {
        acquireBackgroundTarget(container as unknown as HTMLElement, faultyBg as unknown as HTMLElement);
      }).toThrow("DOM hierarchy error");

      // Styles should have been rolled back and not left as relative / isolate
      expect(container.style.getPropertyValue("position")).toBe("");
      expect(container.style.getPropertyValue("isolation")).toBe("");
    });

    it("ignores visibilitychange notifications after scheduler is destroyed", () => {
      const update = vi.fn();
      const scheduler = createMotionFrameScheduler({
        speed: 1,
        animated: true,
        errorName: "visibility-after-destroy test",
        update,
        renderStatic: vi.fn(),
      });

      const target = {};
      scheduler.setVisible(target, true);
      expect(frames.size).toBe(1);

      scheduler.destroy();
      expect(frames.size).toBe(0);

      // Trigger visibility change after destroy
      documentState.hidden = true;
      for (const listener of visibilityListeners) listener(new Event("visibilitychange"));
      documentState.hidden = false;
      for (const listener of visibilityListeners) listener(new Event("visibilitychange"));

      expect(frames.size).toBe(0);
      expect(update).not.toHaveBeenCalled();
    });

    it("removes background elements safely even when detached externally before destroy", () => {
      const container = new FakeElement();
      const bg = new FakeElement();

      acquireBackgroundTarget(container as unknown as HTMLElement, bg as unknown as HTMLElement);
      expect(container.children).toEqual([bg]);

      // Manually detach element from container before destroy/release
      container.removeChild(bg);
      expect(container.children).toHaveLength(0);

      // Releasing when already detached must not throw and must still clean up styles
      expect(() => {
        releaseBackgroundTarget(container as unknown as HTMLElement, bg as unknown as HTMLElement);
      }).not.toThrow();

      expect(container.style.getPropertyValue("position")).toBe("");
      expect(container.style.getPropertyValue("isolation")).toBe("");
    });
  });
});
