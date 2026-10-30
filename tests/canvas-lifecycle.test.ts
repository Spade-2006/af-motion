import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireBackgroundTarget,
  createMotionFrameScheduler,
  releaseBackgroundCanvas,
  releaseBackgroundTarget,
  resizeCanvasToElement,
} from "../src/backgrounds/internal/canvas-lifecycle.js";

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
  });

  it("releases retained Canvas backing stores", () => {
    const canvas = { width: 640, height: 480 } as HTMLCanvasElement;
    releaseBackgroundCanvas(canvas);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
});
