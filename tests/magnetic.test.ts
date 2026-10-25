import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { magnetic } from "../src/effects/magnetic";

class FakeStyle {
  values = new Map<string, string>();
  get transform(): string {
    return this.values.get("transform") ?? "";
  }
  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
  listeners = new Map<string, Set<(event: Event) => void>>();
  getBoundingClientRect = vi.fn(() => ({ left: 100, top: 100, width: 100, height: 50 }));
  addEventListener(type: string, listener: (event: Event) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }
  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type: string, init: Record<string, unknown> = {}): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener({ type, pointerType: "mouse", ...init } as unknown as Event);
    }
  }
  listenerCount(): number {
    return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0);
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let computedTransform: string;

function flushFrame(time: number): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function transformOf(element: FakeHTMLElement): string | undefined {
  return element.style.values.get("transform");
}

// Element center is (150, 125).
function move(element: FakeHTMLElement, clientX: number, clientY: number): void {
  element.emit("pointermove", { clientX, clientY });
}

function settle(startTime = 0): void {
  flushFrame(startTime);
  flushFrame(startTime + 1000);
}

const linearOptions = { strength: 0.5, maxTranslate: 20, duration: 100, easing: (t: number) => t };

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  selectorResults = {};
  reducedMotion = false;
  computedTransform = "none";

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
  }));
  vi.stubGlobal("getComputedStyle", () => ({ transform: computedTransform }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("magnetic: movement", () => {
  it("translates toward the cursor proportionally to its offset from the center", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);

    element.emit("pointerenter", { clientX: 170, clientY: 125 });
    move(element, 170, 135);
    flushFrame(0);
    flushFrame(100);

    expect(transformOf(element)).toBe("translate(10px, 5px)");
  });

  it("tweens smoothly with the given easing and duration", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, { ...linearOptions, easing: (t) => t * t });
    move(element, 170, 125);
    flushFrame(0);
    flushFrame(50);
    expect(transformOf(element)).toBe("translate(2.5px, 0px)");
  });

  it("supports negative offsets", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 130, 115);
    settle();
    expect(transformOf(element)).toBe("translate(-10px, -5px)");
  });

  it("clamps to maxTranslate on each axis", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, { ...linearOptions, maxTranslate: 8 });
    move(element, 1000, -1000);
    settle();
    expect(transformOf(element)).toBe("translate(8px, -8px)");
  });

  it("strength 0 never moves the element", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, { ...linearOptions, strength: 0 });
    move(element, 400, 400);
    settle();
    expect(transformOf(element)).toBeUndefined();
  });

  it("starts the next tween from the in-flight offset without a jump", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    flushFrame(0);
    flushFrame(50);
    expect(transformOf(element)).toBe("translate(5px, 0px)");

    move(element, 190, 125);
    flushFrame(60);
    expect(transformOf(element)).toBe("translate(5px, 0px)");
    flushFrame(160);
    expect(transformOf(element)).toBe("translate(20px, 0px)");
    expect(frames.size).toBe(0);
  });

  it("uses defaults without throwing", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement);
    move(element, 170, 125);
    settle();
    expect(transformOf(element)).toBe("translate(5px, 0px)");
  });
});

describe("magnetic: layout reads", () => {
  it("measures once per hover, not per move or frame", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    element.emit("pointerenter", { clientX: 150, clientY: 125 });
    for (let i = 0; i < 10; i++) {
      move(element, 150 + i, 125);
      flushFrame(i * 16);
    }
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1);
  });

  it("measures the resting center when re-entering mid-return", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    flushFrame(2050);
    // Rect (as the browser would report it) is shifted by the current 5px offset.
    element.getBoundingClientRect.mockReturnValue({ left: 105, top: 100, width: 100, height: 50 });
    element.emit("pointerenter", { clientX: 150, clientY: 125 });
    move(element, 150, 125);
    flushFrame(2060);
    flushFrame(2200);
    expect(transformOf(element)).toBe("translate(0px, 0px)");
  });
});

describe("magnetic: transforms", () => {
  it("appends movement to an existing inline transform", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(10deg)");
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    expect(transformOf(element)).toBe("rotate(10deg) translate(10px, 0px)");
  });

  it("falls back to the computed transform when there is no inline transform", () => {
    computedTransform = "matrix(1, 0, 0, 1, 0, 0)";
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    expect(transformOf(element)).toBe("matrix(1, 0, 0, 1, 0, 0) translate(10px, 0px)");
  });

  it("restores an existing inline transform exactly after pointer leave", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(10deg)");
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    expect(transformOf(element)).toContain("rotate(10deg) translate(");
    flushFrame(2100);
    expect(transformOf(element)).toBe("rotate(10deg)");
    expect(frames.size).toBe(0);
  });

  it("removes the transform property entirely when there was none", () => {
    const element = makeElement();
    element.style.setProperty("color", "red");
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointerleave");
    flushFrame(3000);
    flushFrame(3100);
    expect(element.style.values.has("transform")).toBe(false);
    expect(element.style.values.get("color")).toBe("red");
  });

  it("never writes properties other than transform", () => {
    const element = makeElement();
    const spy = vi.spyOn(element.style, "setProperty");
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointerleave");
    settle(3000);
    expect(new Set(spy.mock.calls.map(([name]) => name))).toEqual(new Set(["transform"]));
  });
});

describe("magnetic: pointer leave", () => {
  it("tweens back to rest and then restores", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    expect(transformOf(element)).toBe("translate(10px, 0px)");

    element.emit("pointerleave");
    flushFrame(2000);
    flushFrame(2050);
    expect(transformOf(element)).toBe("translate(5px, 0px)");
    flushFrame(2100);
    expect(transformOf(element)).toBeUndefined();
  });

  it("treats pointercancel like leave", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointercancel");
    settle(2000);
    expect(transformOf(element)).toBeUndefined();
  });

  it("leaving before any movement restores immediately and starts nothing", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    element.emit("pointerenter", { clientX: 150, clientY: 125 });
    element.emit("pointerleave");
    expect(frames.size).toBe(0);
    expect(transformOf(element)).toBeUndefined();
  });

  it("re-entering during the return keeps the original transform for restore", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(10deg)");
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    flushFrame(2050);
    element.emit("pointerenter", { clientX: 150, clientY: 125 });
    move(element, 150, 125);
    flushFrame(2060);
    flushFrame(2200);
    element.emit("pointerleave");
    settle(3000);
    expect(transformOf(element)).toBe("rotate(10deg)");
  });

  it("ignores leave events for elements that were never engaged", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    element.emit("pointerleave");
    expect(frames.size).toBe(0);
    expect(transformOf(element)).toBeUndefined();
  });
});

describe("magnetic: multiple elements", () => {
  it("moves each element independently relative to its own measurements", () => {
    const a = makeElement();
    const b = makeElement();
    b.getBoundingClientRect.mockReturnValue({ left: 300, top: 100, width: 100, height: 50 });
    selectorResults[".mag"] = [a, new (class {})(), b];
    magnetic(".mag", linearOptions);
    expect(a.listenerCount()).toBe(4);

    move(a, 170, 125);
    move(b, 340, 125);
    settle();
    expect(transformOf(a)).toBe("translate(10px, 0px)");
    expect(transformOf(b)).toBe("translate(-5px, 0px)");

    a.emit("pointerleave");
    settle(2000);
    expect(transformOf(a)).toBeUndefined();
    expect(transformOf(b)).toBe("translate(-5px, 0px)");
  });

  it("returns inert controls when nothing matches", () => {
    const controls = magnetic(".missing");
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("magnetic: destroy", () => {
  it("removes every listener and ignores later events", () => {
    const element = makeElement();
    const controls = magnetic(element as unknown as HTMLElement, linearOptions);
    expect(element.listenerCount()).toBe(4);
    controls.destroy();
    expect(element.listenerCount()).toBe(0);
    move(element, 170, 125);
    expect(frames.size).toBe(0);
  });

  it("cancels the running tween and restores the original transform", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(10deg)");
    const controls = magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    flushFrame(0);
    flushFrame(50);
    controls.destroy();
    expect(transformOf(element)).toBe("rotate(10deg)");
    flushFrame(100);
    expect(transformOf(element)).toBe("rotate(10deg)");
    expect(frames.size).toBe(0);
  });

  it("removes a pending transform when destroyed mid-return", () => {
    const element = makeElement();
    const controls = magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    controls.destroy();
    expect(element.style.values.has("transform")).toBe(false);
    expect(frames.size).toBe(0);
  });

  it("is idempotent", () => {
    const controls = magnetic(makeElement() as unknown as HTMLElement);
    controls.destroy();
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("magnetic: reduced motion and pointer types", () => {
  it("does not move or measure anything when reduced motion is requested", () => {
    reducedMotion = true;
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    element.emit("pointerenter", { clientX: 170, clientY: 125 });
    move(element, 170, 125);
    settle();
    expect(transformOf(element)).toBeUndefined();
    expect(element.getBoundingClientRect).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("settles back to rest if reduced motion turns on mid-hover", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    reducedMotion = true;
    move(element, 190, 125);
    settle(2000);
    expect(transformOf(element)).toBeUndefined();
  });

  it("works when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    move(element, 170, 125);
    settle();
    expect(transformOf(element)).toBe("translate(10px, 0px)");
  });

  it("ignores touch pointers", () => {
    const element = makeElement();
    magnetic(element as unknown as HTMLElement, linearOptions);
    element.emit("pointerenter", { pointerType: "touch", clientX: 170, clientY: 125 });
    element.emit("pointermove", { pointerType: "touch", clientX: 170, clientY: 125 });
    expect(frames.size).toBe(0);
    expect(transformOf(element)).toBeUndefined();
  });
});

describe("magnetic: invalid input", () => {
  const element = (): HTMLElement => makeElement() as unknown as HTMLElement;

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid numbers (%s)", (value) => {
    expect(() => magnetic(element(), { strength: value })).toThrow(RangeError);
    expect(() => magnetic(element(), { maxTranslate: value })).toThrow(RangeError);
    expect(() => magnetic(element(), { duration: value })).toThrow(RangeError);
  });

  it("rejects a non-function easing", () => {
    expect(() => magnetic(element(), { easing: "ease" as never })).toThrow(TypeError);
  });

  it("rejects invalid selectors and targets", () => {
    expect(() => magnetic("!!bad")).toThrow(SyntaxError);
    expect(() => magnetic({} as unknown as HTMLElement)).toThrow(TypeError);
  });

  it("validates options even when nothing matches", () => {
    expect(() => magnetic(".missing", { strength: -1 })).toThrow(RangeError);
  });

  it("attaches no listeners when validation fails", () => {
    const target = makeElement();
    expect(() => magnetic(target as unknown as HTMLElement, { duration: -1 })).toThrow(RangeError);
    expect(target.listenerCount()).toBe(0);
  });

  it("accepts zero duration", () => {
    const target = makeElement();
    magnetic(target as unknown as HTMLElement, { ...linearOptions, duration: 0 });
    move(target, 170, 125);
    settle();
    expect(transformOf(target)).toBe("translate(10px, 0px)");
  });
});
