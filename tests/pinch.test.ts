import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pinch } from "../src/effects/pinch";
import { swipe } from "../src/effects/swipe";

class FakeHTMLElement {
  listeners = new Map<string, Set<(event: Event) => void>>();
  captured = new Set<number>();
  setPointerCapture = vi.fn((id: number) => this.captured.add(id));
  hasPointerCapture = vi.fn((id: number) => this.captured.has(id));
  releasePointerCapture = vi.fn((id: number) => this.captured.delete(id));

  addEventListener(type: string, listener: (event: Event) => void): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, init: Record<string, unknown>): void {
    const event = { type, button: 0, isPrimary: true, timeStamp: 0, pointerType: "touch", ...init } as unknown as Event;
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
  }

  count(): number {
    return [...this.listeners.values()].reduce((n, set) => n + set.size, 0);
  }
}

const asEl = (el: FakeHTMLElement): HTMLElement => el as unknown as HTMLElement;

function begin(el: FakeHTMLElement, distance = 100): void {
  el.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
  el.emit("pointerdown", { pointerId: 2, clientX: distance, clientY: 0 });
}

beforeEach(() => {
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("document", { querySelectorAll: () => [] });
});

afterEach(() => vi.unstubAllGlobals());

describe("pinch()", () => {
  it("reports pinch-out and pinch-in scale relative to the initial distance", () => {
    const el = new FakeHTMLElement();
    const onStart = vi.fn();
    const onUpdate = vi.fn();
    const onEnd = vi.fn();
    pinch(asEl(el), { onStart, onUpdate, onEnd });

    begin(el);
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ scale: 1, initialDistance: 100, centerX: 50 }));

    el.emit("pointermove", { pointerId: 2, clientX: 200, clientY: 0 });
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 2, distance: 200 }));

    el.emit("pointermove", { pointerId: 2, clientX: 50, clientY: 0 });
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 0.5 }));

    el.emit("pointerup", { pointerId: 1 });
    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ scale: 0.5, cancelled: false }));
  });

  it("does not start below the minimum distance or with a single pointer", () => {
    const el = new FakeHTMLElement();
    const onStart = vi.fn();
    pinch(asEl(el), { minDistance: 40, onStart });
    el.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
    expect(onStart).not.toHaveBeenCalled();
    el.emit("pointerdown", { pointerId: 2, clientX: 39, clientY: 0 });
    el.emit("pointermove", { pointerId: 2, clientX: 300, clientY: 0 });
    expect(onStart).not.toHaveBeenCalled();
  });

  it("ignores invalid coordinates and zero distances", () => {
    const el = new FakeHTMLElement();
    const onStart = vi.fn();
    const onUpdate = vi.fn();
    pinch(asEl(el), { minDistance: 0, onStart, onUpdate });
    begin(el, 0);
    expect(onStart).not.toHaveBeenCalled();

    const other = new FakeHTMLElement();
    pinch(asEl(other), { onStart, onUpdate });
    begin(other);
    other.emit("pointermove", { pointerId: 2, clientX: Number.NaN, clientY: 0 });
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("ends as cancelled on pointercancel and clears pointer state", () => {
    const el = new FakeHTMLElement();
    const onEnd = vi.fn();
    const onStart = vi.fn();
    pinch(asEl(el), { onStart, onEnd });
    begin(el);
    el.emit("pointercancel", { pointerId: 2 });
    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    expect(el.captured.has(2)).toBe(false);

    el.emit("pointerup", { pointerId: 2 });
    expect(onEnd).toHaveBeenCalledOnce();

    el.emit("pointerdown", { pointerId: 3, clientX: 200, clientY: 0 });
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("cleans up listeners, capture, and active gestures once", () => {
    const el = new FakeHTMLElement();
    const onEnd = vi.fn();
    const controls = pinch(asEl(el), { onEnd });
    begin(el);
    expect(el.count()).toBe(5);
    controls.destroy();
    controls.destroy();
    expect(el.count()).toBe(0);
    expect(el.captured.size).toBe(0);
    expect(onEnd).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
  });

  it("coexists with swipe listeners on the same element", () => {
    const el = new FakeHTMLElement();
    const onSwipe = vi.fn();
    const onStart = vi.fn();
    const swipeControls = swipe(asEl(el), { onSwipe });
    const pinchControls = pinch(asEl(el), { onStart });
    begin(el);
    expect(onStart).toHaveBeenCalledOnce();
    pinchControls.destroy();
    expect(el.count()).toBe(4);
    swipeControls.destroy();
    expect(el.count()).toBe(0);
  });

  it("validates configuration", () => {
    const el = asEl(new FakeHTMLElement());
    expect(() => pinch(el, { minDistance: -1 })).toThrow(/minDistance/);
    expect(() => pinch(el, { minDistance: Number.NaN })).toThrow(/minDistance/);
    expect(() => pinch(el, { onUpdate: 1 as never })).toThrow(/onUpdate/);
    expect(() => pinch(el, null as never)).toThrow(/options/);
  });
});

describe("pinch() lifecycle hardening", () => {
  it("clears pointer state and capture when onEnd throws", () => {
    const el = new FakeHTMLElement();
    const onStart = vi.fn();
    pinch(asEl(el), { onStart, onEnd: () => { throw new Error("boom"); } });
    begin(el);
    expect(() => el.emit("pointerup", { pointerId: 1 })).toThrow("boom");
    expect(el.captured.has(1)).toBe(false);
    el.emit("pointerdown", { pointerId: 3, clientX: 300, clientY: 0 });
    expect(onStart).toHaveBeenCalledTimes(2);
  });

  it("does not leave an active gesture when onStart throws", () => {
    const el = new FakeHTMLElement();
    const onUpdate = vi.fn();
    const onEnd = vi.fn();
    pinch(asEl(el), { onStart: () => { throw new Error("start"); }, onUpdate, onEnd });
    el.emit("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
    expect(() => el.emit("pointerdown", { pointerId: 2, clientX: 100, clientY: 0 })).toThrow("start");
    el.emit("pointermove", { pointerId: 2, clientX: 200, clientY: 0 });
    el.emit("pointerup", { pointerId: 2 });
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("still removes listeners and releases capture when destroy's onEnd throws", () => {
    const el = new FakeHTMLElement();
    const controls = pinch(asEl(el), { onEnd: () => { throw new Error("end"); } });
    begin(el);
    expect(() => controls.destroy()).toThrow("end");
    expect(el.count()).toBe(0);
    expect(el.captured.size).toBe(0);
    expect(() => controls.destroy()).not.toThrow();
  });

  it("ends the gesture when pointer capture is lost and ignores its own release", () => {
    const el = new FakeHTMLElement();
    const onEnd = vi.fn();
    pinch(asEl(el), { onEnd });
    begin(el);
    el.emit("lostpointercapture", { pointerId: 1 });
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ cancelled: true }));
    el.emit("lostpointercapture", { pointerId: 1 });
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("tolerates setPointerCapture throwing and ignores duplicate or third pointers", () => {
    const el = new FakeHTMLElement();
    el.setPointerCapture = vi.fn(() => { throw new Error("invalid pointer"); });
    const onStart = vi.fn();
    pinch(asEl(el), { onStart });
    begin(el);
    el.emit("pointerdown", { pointerId: 2, clientX: 500, clientY: 0 });
    el.emit("pointerdown", { pointerId: 3, clientX: 500, clientY: 0 });
    expect(onStart).toHaveBeenCalledOnce();
  });
});