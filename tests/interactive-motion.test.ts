import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drag } from "../src/effects/drag";
import { followPointer } from "../src/effects/follow-pointer";
import { hoverMotion } from "../src/effects/hover-motion";
import { pinch } from "../src/effects/pinch";
import { swipe } from "../src/effects/swipe";

class FakeStyle {
  values = new Map<string, string>();
  priorities = new Map<string, string>();
  get transform(): string {
    return this.values.get("transform") ?? "";
  }
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  getPropertyPriority(name: string): string {
    return this.priorities.get(name) ?? "";
  }
  setProperty(name: string, value: string, priority = ""): void {
    this.values.set(name, value);
    this.priorities.set(name, priority);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
    this.priorities.delete(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
  listeners = new Map<string, Set<(event: Event) => void>>();
  rect = { left: 0, top: 0, width: 100, height: 100 };
  capturedPointers = new Set<number>();
  setPointerCapture = vi.fn((pointerId: number) => this.capturedPointers.add(pointerId));
  hasPointerCapture = vi.fn((pointerId: number) => this.capturedPointers.has(pointerId));
  releasePointerCapture = vi.fn((pointerId: number) => this.capturedPointers.delete(pointerId));
  getBoundingClientRect = vi.fn(() => this.rect);
  addEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type: string, init: Record<string, unknown> = {}): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener({
        type,
        pointerType: "mouse",
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: 0,
        clientY: 0,
        timeStamp: 0,
        preventDefault: vi.fn(),
        ...init,
      } as unknown as Event);
    }
  }
  listenerCount(): number {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0);
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextFrameId: number;
let reducedMotion: boolean;
let selectorResults: Record<string, unknown[]>;
let preferenceListeners: Set<(event: { matches: boolean }) => void>;

function flush(time: number): void {
  const callbacks = [...frames.values()];
  frames.clear();
  for (const callback of callbacks) callback(time);
}

function settle(start = 0): void {
  flush(start);
  flush(start + 1000);
}

function target(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

beforeEach(() => {
  frames = new Map();
  nextFrameId = 1;
  reducedMotion = false;
  selectorResults = {};
  preferenceListeners = new Set();
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.delete(listener);
    },
  }));
  vi.stubGlobal("getComputedStyle", () => ({ transform: "none" }));
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => selectorResults[selector] ?? [],
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("drag()", () => {
  it("moves only during a pressed gesture and preserves the transform until destroyed", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(10deg)");
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controls = drag(target(element), {
      axis: "x",
      inertia: false,
      onDragStart,
      onDrag,
      onDragEnd,
    });

    element.emit("pointermove", { clientX: 20, clientY: 20, timeStamp: 10 });
    expect(element.style.transform).toBe("rotate(10deg)");
    element.emit("pointerdown", { clientX: 10, clientY: 10, timeStamp: 20 });
    element.emit("pointermove", { clientX: 30, clientY: 40, timeStamp: 40 });

    expect(element.style.transform).toBe("rotate(10deg) translate(20px, 0px)");
    expect(onDragStart).toHaveBeenCalledWith({ x: 0, y: 0 });
    expect(onDrag).toHaveBeenCalledWith({ x: 20, y: 0 });
    expect(element.setPointerCapture).toHaveBeenCalledWith(1);
    element.emit("pointerup", { clientX: 30, clientY: 40, timeStamp: 40 });
    expect(onDragEnd).toHaveBeenCalledWith({ x: 20, y: 0 }, false);
    expect(element.hasPointerCapture(1)).toBe(false);

    controls.destroy();
    expect(element.style.transform).toBe("rotate(10deg)");
    expect(element.style.getPropertyValue("touch-action")).toBe("");
    expect(element.listenerCount()).toBe(0);
  });

  it("clamps movement, reports pointer cancellation, and validates configuration", () => {
    const element = new FakeHTMLElement();
    const onDragEnd = vi.fn();
    const controls = drag(target(element), {
      bounds: { minX: -5, maxX: 15 },
      inertia: false,
      onDragEnd,
    });

    element.emit("pointerdown", { clientX: 5, clientY: 5 });
    element.emit("pointermove", { clientX: 100, clientY: 20, timeStamp: 10 });
    expect(element.style.transform).toBe("translate(15px, 15px)");
    element.emit("pointercancel");
    expect(onDragEnd).toHaveBeenCalledWith({ x: 15, y: 15 }, true);
    controls.destroy();
    expect(() => drag(target(new FakeHTMLElement()), { axis: "z" as never })).toThrow(/axis/);
    expect(() => drag(target(new FakeHTMLElement()), { bounds: { minX: 2, maxX: 1 } })).toThrow(/minX/);
  });

  it("ends a drag as cancelled when pointer capture is lost", () => {
    const element = new FakeHTMLElement();
    const onDragEnd = vi.fn();
    const controls = drag(target(element), { onDragEnd });

    element.emit("pointerdown", { clientX: 10, clientY: 20 });
    element.emit("pointermove", { clientX: 30, clientY: 40, timeStamp: 10 });
    element.capturedPointers.delete(1);
    element.emit("lostpointercapture");

    expect(onDragEnd).toHaveBeenCalledExactlyOnceWith({ x: 20, y: 20 }, true);
    expect(frames.size).toBe(0);

    element.emit("pointerdown", { pointerId: 2, clientX: 30, clientY: 40 });
    expect(element.setPointerCapture).toHaveBeenLastCalledWith(2);
    controls.destroy();
    expect(element.listenerCount()).toBe(0);
  });

  it("keeps the element inside a container and combines it with explicit bounds", () => {
    const element = new FakeHTMLElement();
    const container = new FakeHTMLElement();
    const rectOf = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height });
    container.rect = rectOf(0, 0, 200, 100) as never;
    element.rect = rectOf(10, 10, 50, 50) as never;
    const controls = drag(target(element), { container: target(container), inertia: false });

    element.emit("pointerdown", { clientX: 0, clientY: 0 });
    element.emit("pointermove", { clientX: 500, clientY: 500, timeStamp: 10 });
    expect(element.style.transform).toBe("translate(140px, 40px)");
    element.emit("pointermove", { clientX: -500, clientY: -500, timeStamp: 20 });
    expect(element.style.transform).toBe("translate(-10px, -10px)");
    element.emit("pointerup", { timeStamp: 20 });
    controls.destroy();

    const tight = new FakeHTMLElement();
    tight.rect = rectOf(10, 10, 50, 50) as never;
    const combined = drag(target(tight), { container: target(container), bounds: { maxX: 20 }, axis: "x", inertia: false });
    tight.emit("pointerdown", { clientX: 0, clientY: 0 });
    tight.emit("pointermove", { clientX: 500, clientY: 500, timeStamp: 10 });
    expect(tight.style.transform).toBe("translate(20px, 0px)");
    combined.destroy();
  });

  it("measures the container from the current position and clamps inertia to it", () => {
    const element = new FakeHTMLElement();
    const container = new FakeHTMLElement();
    container.rect = { left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 } as never;
    element.rect = { left: 0, top: 0, width: 20, height: 20, right: 20, bottom: 20 } as never;
    const controls = drag(target(element), { container: target(container), axis: "x" });
    element.emit("pointerdown", { clientX: 0, timeStamp: 0 });
    element.emit("pointermove", { clientX: 50, timeStamp: 10 });
    element.emit("pointerup", { clientX: 50, timeStamp: 10 });
    element.rect = { left: 50, top: 0, width: 20, height: 20, right: 70, bottom: 20 } as never;
    settle();
    expect(element.style.transform).toBe("translate(80px, 0px)");
    controls.destroy();
  });

  it("ignores a missing container, tolerates capture errors, and validates container", () => {
    const element = new FakeHTMLElement();
    element.setPointerCapture = vi.fn(() => { throw new Error("invalid pointer"); });
    const onDragEnd = vi.fn();
    const controls = drag(target(element), { container: ".missing", inertia: false, onDragEnd });
    element.emit("pointerdown", { clientX: 0, clientY: 0 });
    element.emit("pointermove", { clientX: 30, clientY: 0, timeStamp: 10 });
    expect(element.style.transform).toBe("translate(30px, 0px)");
    element.emit("pointerup", { timeStamp: 10 });
    expect(onDragEnd).toHaveBeenCalledWith({ x: 30, y: 0 }, false);
    controls.destroy();
    expect(() => drag(target(new FakeHTMLElement()), { container: 5 as never })).toThrow(/container/);
  });

  it("does not resume or move after cancellation", () => {
    const element = new FakeHTMLElement();
    const controls = drag(target(element));
    element.emit("pointerdown", { clientX: 0, clientY: 0, timeStamp: 0 });
    element.emit("pointermove", { clientX: 20, clientY: 0, timeStamp: 10 });
    element.emit("pointercancel", { timeStamp: 10 });
    expect(frames.size).toBe(0);
    element.emit("pointermove", { clientX: 90, clientY: 0, timeStamp: 20 });
    expect(element.style.transform).toBe("translate(20px, 0px)");
    controls.destroy();
  });
  it("starts inertia from the release velocity in the drag direction", () => {
    const element = new FakeHTMLElement();
    const onDrag = vi.fn();
    const controls = drag(target(element), { axis: "x", onDrag });
    element.emit("pointerdown", { clientX: 0, timeStamp: 0 });
    element.emit("pointermove", { clientX: -20, timeStamp: 10 });
    element.emit("pointerup", { clientX: -20, timeStamp: 10 });
    expect(frames.size).toBe(1);
    settle();
    expect(element.style.transform).toMatch(/translate\(-\d+(\.\d+)?px, 0px\)/);
    expect(Number.parseFloat(element.style.transform.slice(10))).toBeLessThan(-20);
    controls.destroy();
  });

  it("does not fling when the pointer rested before release or the drag was cancelled", () => {
    const element = new FakeHTMLElement();
    const controls = drag(target(element));
    element.emit("pointerdown", { clientX: 0, clientY: 0, timeStamp: 0 });
    element.emit("pointermove", { clientX: 40, clientY: 0, timeStamp: 10 });
    element.emit("pointerup", { clientX: 40, clientY: 0, timeStamp: 500 });
    expect(frames.size).toBe(0);

    element.emit("pointerdown", { clientX: 40, clientY: 0, timeStamp: 600 });
    element.emit("pointermove", { clientX: 80, clientY: 0, timeStamp: 610 });
    element.emit("pointercancel", { timeStamp: 610 });
    expect(frames.size).toBe(0);
    controls.destroy();
  });
  it("cancels momentum, listeners, and pointer capture on destroy", () => {
    const element = new FakeHTMLElement();
    const controls = drag(target(element));
    element.emit("pointerdown", { clientX: 0, clientY: 0, timeStamp: 1 });
    element.emit("pointermove", { clientX: 20, clientY: 10, timeStamp: 11 });
    element.emit("pointerup", { clientX: 20, clientY: 10, timeStamp: 11 });

    expect(frames.size).toBe(1);
    controls.destroy();
    expect(element.listenerCount()).toBe(0);
    expect(element.hasPointerCapture(1)).toBe(false);
    expect(element.style.transform).toBe("");
    expect(element.style.getPropertyValue("touch-action")).toBe("");
    expect(frames.size).toBe(0);
  });
});

describe("hoverMotion()", () => {
  it("animates a composable enter transform and restores the original transform on leave", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(10deg)");
    const controls = hoverMotion(target(element), {
      enter: { x: 8, scale: 1.1 },
      duration: 100,
      easing: (progress) => progress,
    });

    element.emit("pointerenter");
    flush(0);
    flush(50);
    expect(element.style.transform).toContain("translate(4px, 0px)");

    settle(60);
    expect(element.style.transform).toContain("translate(8px, 0px)");
    element.emit("pointerleave");
    settle(2000);
    expect(element.style.transform).toBe("rotate(10deg)");
    expect(frames.size).toBe(0);
    controls.destroy();
  });

  it("ignores touch and cancels pending work on destroy", () => {
    const element = new FakeHTMLElement();
    const controls = hoverMotion(target(element), { enter: { y: -8 }, duration: 200 });
    element.emit("pointerenter", { pointerType: "touch" });
    expect(frames.size).toBe(0);
    element.emit("pointerenter");
    expect(frames.size).toBe(1);
    controls.destroy();
    expect(element.listenerCount()).toBe(0);
    expect(frames.size).toBe(0);
    expect(element.style.transform).toBe("");
  });

  it("activates on keyboard focus and keeps the active pose while pointer and focus overlap", () => {
    const element = new FakeHTMLElement();
    const controls = hoverMotion(target(element), {
      enter: { x: 10 },
      duration: 100,
      easing: (progress) => progress,
    });

    element.emit("focus");
    flush(0);
    flush(50);
    expect(element.style.transform).toBe("translate(5px, 0px) scale(1) rotate(0deg)");

    element.emit("pointerenter");
    flush(100);
    expect(element.style.transform).toBe("translate(10px, 0px) scale(1) rotate(0deg)");
    element.emit("pointerleave");
    expect(element.style.transform).toBe("translate(10px, 0px) scale(1) rotate(0deg)");

    element.emit("blur");
    settle(200);
    expect(element.style.transform).toBe("");
    controls.destroy();
  });

  it("restores the original transform and leaves unrelated inline styles intact on destroy", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(12deg)", "important");
    element.style.setProperty("color", "rebeccapurple", "important");
    const controls = hoverMotion(target(element), { enter: { y: -12 } });

    element.emit("focus");
    flush(0);
    flush(50);
    controls.destroy();

    expect(element.style.transform).toBe("rotate(12deg)");
    expect(element.style.priorities.get("transform")).toBe("important");
    expect(element.style.values.get("color")).toBe("rebeccapurple");
    expect(element.style.priorities.get("color")).toBe("important");
    expect(element.listenerCount()).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("returns to the resting transform when reduced motion is enabled", () => {
    const element = new FakeHTMLElement();
    const controls = hoverMotion(target(element), { enter: { y: -8 }, duration: 200 });
    element.emit("pointerenter");
    flush(0);
    flush(50);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(element.style.transform).toBe("");
    expect(frames.size).toBe(0);
    for (const listener of preferenceListeners) listener({ matches: false });
    settle(1000);
    expect(element.style.transform).toContain("translate(0px, -8px)");
    controls.destroy();
  });
});

describe("followPointer()", () => {
  it("follows the pointer within the container bounds and returns on exit", () => {
    const container = new FakeHTMLElement();
    container.rect = { left: 10, top: 20, width: 200, height: 120 };
    const element = new FakeHTMLElement();
    element.rect = { left: 50, top: 50, width: 20, height: 20 };
    const controls = followPointer(target(element), {
      container: target(container),
      smoothing: 0.1,
      easing: (progress) => progress,
    });

    container.emit("pointermove", { clientX: 110, clientY: 90 });
    settle(0);
    expect(element.style.transform).toBe("translate(50px, 30px)");

    container.emit("pointerleave");
    settle(2000);
    expect(element.style.transform).toBe("");
    expect(frames.size).toBe(0);
    controls.destroy();
    expect(container.listenerCount()).toBe(0);
  });

  it("supports selectors, ignores touch, and cleans up active motion", () => {
    const container = new FakeHTMLElement();
    const element = new FakeHTMLElement();
    element.rect = { left: 20, top: 20, width: 10, height: 10 };
    selectorResults[".target"] = [element];
    selectorResults[".container"] = [container];
    const controls = followPointer(".target", { container: ".container", smoothing: 0.5 });

    container.emit("pointermove", { pointerType: "touch", clientX: 70, clientY: 50 });
    expect(frames.size).toBe(0);
    container.emit("pointermove", { clientX: 70, clientY: 50 });
    expect(frames.size).toBe(1);
    controls.destroy();
    expect(container.listenerCount()).toBe(0);
    expect(frames.size).toBe(0);
    expect(element.style.transform).toBe("");
  });

  it("restores the resting transform when reduced motion is enabled", () => {
    const container = new FakeHTMLElement();
    const element = new FakeHTMLElement();
    element.rect = { left: 20, top: 20, width: 10, height: 10 };
    const controls = followPointer(target(element), { container: target(container), smoothing: 0.5 });

    container.emit("pointermove", { clientX: 80, clientY: 50 });
    flush(0);
    flush(50);
    expect(element.style.transform).not.toBe("");
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(element.style.transform).toBe("");
    expect(frames.size).toBe(0);
    controls.destroy();
  });
});

describe("interaction effects sharing one element", () => {
  it("keeps drag's pointer capture when swipe cancels on a second pointer", () => {
    const element = new FakeHTMLElement();
    const onDrag = vi.fn();
    const dragControls = drag(target(element), { inertia: false, onDrag });
    const swipeControls = swipe(target(element), { onSwipe: vi.fn() });

    element.emit("pointerdown", { pointerId: 1 });
    element.emit("pointerdown", { pointerId: 2, isPrimary: false });
    expect(element.capturedPointers.has(1)).toBe(true);

    element.emit("pointermove", { pointerId: 1, clientX: 20, timeStamp: 10 });
    expect(onDrag).toHaveBeenCalledTimes(1);

    element.emit("pointerup", { pointerId: 1, clientX: 20, timeStamp: 20 });
    expect(element.capturedPointers.size).toBe(0);
    dragControls.destroy();
    swipeControls.destroy();
  });

  it("releases capture only after every effect using the pointer has finished", () => {
    const element = new FakeHTMLElement();
    const dragControls = drag(target(element), { inertia: false });
    const swipeControls = swipe(target(element), { onSwipe: vi.fn() });
    const pinchControls = pinch(target(element), {});

    element.emit("pointerdown", { pointerId: 1 });
    swipeControls.destroy();
    expect(element.capturedPointers.has(1)).toBe(true);
    pinchControls.destroy();
    expect(element.capturedPointers.has(1)).toBe(true);
    dragControls.destroy();
    expect(element.capturedPointers.size).toBe(0);
    expect(element.listenerCount()).toBe(0);
  });

  it("still finishes cleanup and rethrows once when releasing capture fails during destroy", () => {
    const element = new FakeHTMLElement();
    const controls = drag(target(element), { inertia: false });
    element.emit("pointerdown", { pointerId: 1 });
    element.releasePointerCapture = vi.fn(() => { throw new Error("release failed"); });

    expect(() => controls.destroy()).toThrow("release failed");
    expect(element.listenerCount()).toBe(0);
    expect(element.style.getPropertyValue("touch-action")).toBe("");
    expect(() => controls.destroy()).not.toThrow();
  });
});
