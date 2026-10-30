import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { swipe } from "../src/effects/swipe";

class FakeHTMLElement {
  listeners = new Map<string, Set<(event: Event) => void>>();
  capturedPointers = new Set<number>();
  setPointerCapture = vi.fn((pointerId: number) => this.capturedPointers.add(pointerId));
  hasPointerCapture = vi.fn((pointerId: number) => this.capturedPointers.has(pointerId));
  releasePointerCapture = vi.fn((pointerId: number) => this.capturedPointers.delete(pointerId));

  addEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, init: Record<string, unknown> = {}): void {
    const event = {
      type,
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: 0,
      clientY: 0,
      timeStamp: 0,
      ...init,
    } as unknown as Event;
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0);
  }
}

let selectorResults: Record<string, unknown[]>;

function target(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

beforeEach(() => {
  selectorResults = {};
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => selectorResults[selector] ?? [],
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("swipe()", () => {
  it.each([
    ["left", -100, 0],
    ["right", 100, 0],
    ["up", 0, -100],
    ["down", 0, 100],
  ] as const)("detects a %s swipe", (direction, deltaX, deltaY) => {
    const element = new FakeHTMLElement();
    const onSwipe = vi.fn();
    swipe(target(element), { onSwipe });

    element.emit("pointerdown", { clientX: 100, clientY: 100, timeStamp: 20 });
    element.emit("pointerup", {
      clientX: 100 + deltaX,
      clientY: 100 + deltaY,
      timeStamp: 120,
    });

    expect(onSwipe).toHaveBeenCalledOnce();
    expect(onSwipe).toHaveBeenCalledWith(expect.objectContaining({
      direction,
      distance: 100,
      duration: 100,
      deltaX,
      deltaY,
      pointerType: "touch",
    }));
    expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it("uses the minimum distance and maximum duration thresholds", () => {
    const element = new FakeHTMLElement();
    const onSwipe = vi.fn();
    swipe(target(element), { minDistance: 30, maxDuration: 100, onSwipe });

    element.emit("pointerdown", { timeStamp: 0 });
    element.emit("pointerup", { clientX: 29, timeStamp: 50 });
    expect(onSwipe).not.toHaveBeenCalled();

    element.emit("pointerdown", { timeStamp: 100 });
    element.emit("pointerup", { clientX: 30, timeStamp: 201 });
    expect(onSwipe).not.toHaveBeenCalled();

    element.emit("pointerdown", { timeStamp: 300 });
    element.emit("pointerup", { clientX: 30, timeStamp: 400 });
    expect(onSwipe).toHaveBeenCalledOnce();
  });

  it("ignores pointer cancellation, unrelated pointers, and duplicate pointer-up events", () => {
    const element = new FakeHTMLElement();
    const onSwipe = vi.fn();
    swipe(target(element), { onSwipe });

    element.emit("pointerdown", { pointerId: 1, timeStamp: 0 });
    element.emit("pointerup", { pointerId: 2, clientX: 100, timeStamp: 20 });
    element.emit("pointercancel", { pointerId: 1 });
    element.emit("pointerup", { pointerId: 1, clientX: 100, timeStamp: 30 });
    expect(onSwipe).not.toHaveBeenCalled();

    element.emit("pointerdown", { pointerId: 3, timeStamp: 40 });
    element.emit("pointerup", { pointerId: 3, clientX: 100, timeStamp: 70 });
    element.emit("pointerup", { pointerId: 3, clientX: 100, timeStamp: 80 });
    expect(onSwipe).toHaveBeenCalledOnce();
  });

  it("cleans up listeners and active pointer capture when destroyed", () => {
    const element = new FakeHTMLElement();
    const onSwipe = vi.fn();
    const controls = swipe(target(element), { onSwipe });

    element.emit("pointerdown", { timeStamp: 0 });
    expect(element.listenerCount()).toBe(4);
    controls.destroy();
    controls.destroy();
    expect(element.listenerCount()).toBe(0);
    expect(element.releasePointerCapture).toHaveBeenCalledWith(1);
    element.emit("pointerup", { clientX: 100, timeStamp: 20 });
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("validates thresholds and callback configuration", () => {
    const element = target(new FakeHTMLElement());
    expect(() => swipe(element, { minDistance: -1, onSwipe: vi.fn() })).toThrow(/minDistance/);
    expect(() => swipe(element, { maxDuration: Number.NaN, onSwipe: vi.fn() })).toThrow(/maxDuration/);
    expect(() => swipe(element, { onSwipe: undefined as never })).toThrow(/onSwipe/);
  });

  it("returns inert controls when a selector matches no elements", () => {
    const controls = swipe(".missing", { onSwipe: vi.fn() });
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("swipe() lifecycle hardening", () => {
  it("does not recognize a swipe when a second pointer joins the gesture", () => {
    const element = new FakeHTMLElement();
    const onSwipe = vi.fn();
    swipe(target(element), { onSwipe });
    element.emit("pointerdown", { pointerId: 1, timeStamp: 0 });
    element.emit("pointerdown", { pointerId: 2, isPrimary: false, timeStamp: 5 });
    element.emit("pointerup", { pointerId: 1, clientX: 100, timeStamp: 20 });
    expect(onSwipe).not.toHaveBeenCalled();
    expect(element.capturedPointers.size).toBe(0);
  });

  it("is reusable after onSwipe throws and releases capture first", () => {
    const element = new FakeHTMLElement();
    const onSwipe = vi.fn(() => { throw new Error("boom"); });
    swipe(target(element), { onSwipe });
    element.emit("pointerdown", { timeStamp: 0 });
    expect(() => element.emit("pointerup", { clientX: 100, timeStamp: 10 })).toThrow("boom");
    expect(element.capturedPointers.size).toBe(0);
    element.emit("pointerdown", { timeStamp: 20 });
    expect(() => element.emit("pointerup", { clientX: 100, timeStamp: 30 })).toThrow("boom");
    expect(onSwipe).toHaveBeenCalledTimes(2);
  });

  it("tolerates setPointerCapture throwing", () => {
    const element = new FakeHTMLElement();
    element.setPointerCapture = vi.fn(() => { throw new Error("invalid pointer"); });
    const onSwipe = vi.fn();
    swipe(target(element), { onSwipe });
    element.emit("pointerdown", { timeStamp: 0 });
    element.emit("pointerup", { clientX: 100, timeStamp: 10 });
    expect(onSwipe).toHaveBeenCalledOnce();
  });

  it("destroying one instance leaves another instance's listeners intact", () => {
    const element = new FakeHTMLElement();
    const first = vi.fn();
    const second = vi.fn();
    const a = swipe(target(element), { onSwipe: first });
    swipe(target(element), { onSwipe: second });
    a.destroy();
    element.emit("pointerdown", { timeStamp: 0 });
    element.emit("pointerup", { clientX: 100, timeStamp: 10 });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});