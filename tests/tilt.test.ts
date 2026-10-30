import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tilt } from "../src/effects/tilt";
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
  getBoundingClientRect = vi.fn(() => ({ left: 100, top: 100, width: 200, height: 100 }));
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
let changeListeners: Set<(event: { matches: boolean }) => void>;

function flushFrame(time: number): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function asHTML(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function transformOf(element: FakeHTMLElement): string | undefined {
  return element.style.values.get("transform");
}

// Element: left 100, top 100, 200x100 => center (200, 150), half-size (100, 50).
function move(element: FakeHTMLElement, clientX: number, clientY: number): void {
  element.emit("pointermove", { clientX, clientY });
}

function settle(startTime = 0): void {
  flushFrame(startTime);
  flushFrame(startTime + 1000);
}

function expected(rotateX: number, rotateY: number, scale: number): string {
  return `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
}

const linear = { maxTilt: 10, perspective: 800, scale: 1.1, speed: 100, easing: (t: number) => t };

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  selectorResults = {};
  reducedMotion = false;
  computedTransform = "none";
  changeListeners = new Set();

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
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      changeListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      changeListeners.delete(listener);
    },
  }));
  vi.stubGlobal("getComputedStyle", () => ({ transform: computedTransform }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tilt: angle calculations", () => {
  it.each([
    ["right edge", 300, 150, 0, 10],
    ["left edge", 100, 150, 0, -10],
    ["top edge", 200, 100, 10, 0],
    ["bottom edge", 200, 200, -10, 0],
    ["top-left corner", 100, 100, 10, -10],
    ["bottom-right corner", 300, 200, -10, 10],
    ["halfway right", 250, 150, 0, 5],
    ["center", 200, 150, 0, 0],
  ])("%s", (_name, clientX, clientY, rotateX, rotateY) => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, clientX, clientY);
    settle();
    expect(transformOf(element)).toBe(expected(rotateX, rotateY, 1.1));
  });

  it("clamps cursor positions outside the element", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 5000, -5000);
    settle();
    expect(transformOf(element)).toBe(expected(10, 10, 1.1));
  });

  it("scales the angles with maxTilt and uses the given perspective", () => {
    const element = makeElement();
    tilt(asHTML(element), { ...linear, maxTilt: 20, perspective: 500 });
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBe(
      "perspective(500px) rotateX(0deg) rotateY(20deg) scale(1.1)",
    );
  });

  it("maxTilt 0 only scales", () => {
    const element = makeElement();
    tilt(asHTML(element), { ...linear, maxTilt: 0 });
    move(element, 300, 100);
    settle();
    expect(transformOf(element)).toBe(expected(0, 0, 1.1));
  });

  it("treats a zero-sized element as centered", () => {
    const element = makeElement();
    element.getBoundingClientRect.mockReturnValue({ left: 0, top: 0, width: 0, height: 0 });
    tilt(asHTML(element), linear);
    move(element, 50, 50);
    settle();
    expect(transformOf(element)).toBe(expected(0, 0, 1.1));
  });
});

describe("tilt: movement", () => {
  it("tweens smoothly with the given easing and speed", () => {
    const element = makeElement();
    tilt(asHTML(element), { ...linear, easing: (t) => t * t });
    move(element, 300, 150);
    flushFrame(0);
    flushFrame(50);
    expect(transformOf(element)).toBe(expected(0, 2.5, 1.025));
    flushFrame(100);
    expect(transformOf(element)).toBe(expected(0, 10, 1.1));
  });

  it("enter alone starts the tween toward the entry position", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    element.emit("pointerenter", { clientX: 300, clientY: 150 });
    settle();
    expect(transformOf(element)).toBe(expected(0, 10, 1.1));
  });

  it("retargets from the in-flight values without a jump", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    flushFrame(0);
    flushFrame(50);
    expect(transformOf(element)).toBe(expected(0, 5, 1.05));

    move(element, 100, 150);
    flushFrame(60);
    expect(transformOf(element)).toBe(expected(0, 5, 1.05));
    flushFrame(160);
    expect(transformOf(element)).toBe(expected(0, -10, 1.1));
    expect(frames.size).toBe(0);
  });

  it("keeps a single frame loop and ignores unchanged targets", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    const pendingIds = [...frames.keys()];
    move(element, 300, 150);
    move(element, 300, 150);
    expect([...frames.keys()]).toEqual(pendingIds);

    move(element, 250, 150);
    expect(frames.size).toBe(1);
  });

  it("goes idle after settling (no perpetual frame loop)", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    expect(frames.size).toBe(0);
  });

  it("works with speed 0", () => {
    const element = makeElement();
    tilt(asHTML(element), { ...linear, speed: 0 });
    move(element, 300, 150);
    flushFrame(0);
    expect(transformOf(element)).toBe(expected(0, 10, 1.1));
  });

  it("uses defaults without throwing", () => {
    const element = makeElement();
    tilt(asHTML(element));
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBe(expected(0, 10, 1.02));
  });
});

describe("tilt: layout reads", () => {
  it("measures once per hover, not per move or frame", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    element.emit("pointerenter", { clientX: 200, clientY: 150 });
    for (let i = 0; i < 10; i++) {
      move(element, 200 + i * 10, 150);
      flushFrame(i * 16);
    }
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1);
  });

  it("does not re-measure when re-entering while still settling, but does after", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    flushFrame(2050);
    element.emit("pointerenter", { clientX: 300, clientY: 150 });
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1);

    element.emit("pointerleave");
    settle(3000);
    element.emit("pointerenter", { clientX: 300, clientY: 150 });
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(2);
  });
});

describe("tilt: reset", () => {
  it("tweens back to neutral and then removes the transform", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();

    element.emit("pointerleave");
    flushFrame(2000);
    flushFrame(2050);
    expect(transformOf(element)).toBe(expected(0, 5, 1.05));
    flushFrame(2100);
    expect(transformOf(element)).toBeUndefined();
    expect(frames.size).toBe(0);
  });

  it("treats pointercancel like leave", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    element.emit("pointercancel");
    settle(2000);
    expect(transformOf(element)).toBeUndefined();
  });

  it("leaving before the first frame restores immediately without animating", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    element.emit("pointerenter", { clientX: 300, clientY: 150 });
    element.emit("pointerleave");
    flushFrame(0);
    flushFrame(1000);
    expect(transformOf(element)).toBeUndefined();
    expect(frames.size).toBe(0);
  });

  it("ignores leave for elements that were never engaged", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    element.emit("pointerleave");
    expect(frames.size).toBe(0);
    expect(transformOf(element)).toBeUndefined();
  });
});

describe("tilt: style preservation", () => {
  it("composes with an existing inline transform and restores it exactly", () => {
    const element = makeElement();
    element.style.setProperty("transform", "translateX(10px)");
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBe(
      "translateX(10px) perspective(800px) rotateX(0deg) rotateY(10deg) scale(1.1)",
    );

    element.emit("pointerleave");
    settle(2000);
    expect(transformOf(element)).toBe("translateX(10px)");
  });

  it("falls back to the computed transform when there is no inline transform", () => {
    computedTransform = "matrix(1, 0, 0, 1, 5, 0)";
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBe(
      "matrix(1, 0, 0, 1, 5, 0) perspective(800px) rotateX(0deg) rotateY(10deg) scale(1.1)",
    );
    element.emit("pointerleave");
    settle(2000);
    expect(element.style.values.has("transform")).toBe(false);
  });

  it("writes only `transform`, leaving origin, perspective and other styles untouched", () => {
    const element = makeElement();
    element.style.setProperty("transform-origin", "left top");
    element.style.setProperty("perspective", "500px");
    element.style.setProperty("transform-style", "preserve-3d");
    element.style.setProperty("color", "red");
    const spy = vi.spyOn(element.style, "setProperty");
    const removeSpy = vi.spyOn(element.style, "removeProperty");

    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    element.emit("pointerleave");
    settle(2000);

    expect(new Set(spy.mock.calls.map(([name]) => name))).toEqual(new Set(["transform"]));
    expect(removeSpy.mock.calls.every(([name]) => name === "transform")).toBe(true);
    expect([...element.style.values.entries()]).toEqual([
      ["transform-origin", "left top"],
      ["perspective", "500px"],
      ["transform-style", "preserve-3d"],
      ["color", "red"],
    ]);
  });

  it("keeps the original inline transform when re-entering during the return", () => {
    const element = makeElement();
    element.style.setProperty("transform", "translateX(10px)");
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    flushFrame(2050);
    move(element, 100, 150);
    settle(2060);
    element.emit("pointerleave");
    settle(4000);
    expect(transformOf(element)).toBe("translateX(10px)");
  });
});

describe("transform effect composition", () => {
  it("lets magnetic and tilt coexist and clean up independently", () => {
    const element = makeElement();
    element.style.setProperty("transform", "rotate(10deg)");
    const magneticControls = magnetic(asHTML(element), {
      strength: 0.5,
      maxTranslate: 20,
      duration: 100,
      easing: (progress) => progress,
    });
    const tiltControls = tilt(asHTML(element), linear);

    move(element, 250, 150);
    settle();
    expect(transformOf(element)).toBe(
      "rotate(10deg) translate(20px, 0px) perspective(800px) rotateX(0deg) rotateY(5deg) scale(1.1)",
    );

    magneticControls.destroy();
    expect(transformOf(element)).toBe(
      "rotate(10deg) perspective(800px) rotateX(0deg) rotateY(5deg) scale(1.1)",
    );

    tiltControls.destroy();
    expect(transformOf(element)).toBe("rotate(10deg)");
  });
});

describe("tilt: multiple elements", () => {
  it("tilts each element independently using its own measurements", () => {
    const a = makeElement();
    const b = makeElement();
    b.getBoundingClientRect.mockReturnValue({ left: 500, top: 100, width: 200, height: 100 });
    selectorResults[".card"] = [a, new (class {})(), b];
    tilt(".card", linear);
    expect(a.listenerCount()).toBe(4);

    move(a, 300, 150);
    move(b, 500, 150);
    settle();
    expect(transformOf(a)).toBe(expected(0, 10, 1.1));
    expect(transformOf(b)).toBe(expected(0, -10, 1.1));

    a.emit("pointerleave");
    settle(2000);
    expect(transformOf(a)).toBeUndefined();
    expect(transformOf(b)).toBe(expected(0, -10, 1.1));
  });

  it("returns inert controls when nothing matches", () => {
    const controls = tilt(".missing");
    expect(() => controls.destroy()).not.toThrow();
    expect(changeListeners.size).toBe(0);
  });
});

describe("tilt: destroy", () => {
  it("removes every listener and ignores later events", () => {
    const element = makeElement();
    const controls = tilt(asHTML(element), linear);
    expect(element.listenerCount()).toBe(4);
    expect(changeListeners.size).toBe(1);
    controls.destroy();
    expect(element.listenerCount()).toBe(0);
    expect(changeListeners.size).toBe(0);
    move(element, 300, 150);
    expect(frames.size).toBe(0);
  });

  it("cancels pending frames and restores the original transform immediately", () => {
    const element = makeElement();
    element.style.setProperty("transform", "translateX(10px)");
    const controls = tilt(asHTML(element), linear);
    move(element, 300, 150);
    flushFrame(0);
    flushFrame(50);
    controls.destroy();
    expect(transformOf(element)).toBe("translateX(10px)");
    expect(frames.size).toBe(0);
    flushFrame(100);
    expect(transformOf(element)).toBe("translateX(10px)");
  });

  it("removes the transform when destroyed mid-return and none existed", () => {
    const element = makeElement();
    const controls = tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    element.emit("pointerleave");
    flushFrame(2000);
    controls.destroy();
    expect(element.style.values.has("transform")).toBe(false);
    expect(frames.size).toBe(0);
  });

  it("is idempotent", () => {
    const controls = tilt(asHTML(makeElement()));
    controls.destroy();
    expect(() => controls.destroy()).not.toThrow();
  });
});

describe("tilt: reduced motion and pointer types", () => {
  it("never tilts or measures when reduced motion is requested", () => {
    reducedMotion = true;
    const element = makeElement();
    tilt(asHTML(element), linear);
    element.emit("pointerenter", { clientX: 300, clientY: 150 });
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBeUndefined();
    expect(element.getBoundingClientRect).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("immediately restores neutral state if the preference is on at the next pointer event", () => {
    const element = makeElement();
    element.style.setProperty("transform", "translateX(10px)");
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    flushFrame(0);
    flushFrame(50);

    reducedMotion = true;
    move(element, 300, 150);
    expect(transformOf(element)).toBe("translateX(10px)");
    expect(frames.size).toBe(0);
  });

  it("restores neutral state when the preference changes, without pointer events", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    flushFrame(0);
    flushFrame(50);
    expect(transformOf(element)).toBe(expected(0, 5, 1.05));

    for (const listener of changeListeners) listener({ matches: false });
    expect(transformOf(element)).toBe(expected(0, 5, 1.05));

    for (const listener of changeListeners) listener({ matches: true });
    expect(transformOf(element)).toBeUndefined();
    expect(frames.size).toBe(0);
  });

  it("works when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const element = makeElement();
    tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBe(expected(0, 10, 1.1));
  });

  it("works when matchMedia lacks addEventListener", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const element = makeElement();
    const controls = tilt(asHTML(element), linear);
    move(element, 300, 150);
    settle();
    expect(transformOf(element)).toBe(expected(0, 10, 1.1));
    expect(() => controls.destroy()).not.toThrow();
  });

  it("ignores touch pointers", () => {
    const element = makeElement();
    tilt(asHTML(element), linear);
    element.emit("pointerenter", { pointerType: "touch", clientX: 300, clientY: 150 });
    element.emit("pointermove", { pointerType: "touch", clientX: 300, clientY: 150 });
    expect(frames.size).toBe(0);
    expect(transformOf(element)).toBeUndefined();
    expect(element.getBoundingClientRect).not.toHaveBeenCalled();
  });
});

describe("tilt: invalid input", () => {
  const element = (): HTMLElement => asHTML(makeElement());

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid maxTilt/speed (%s)", (value) => {
    expect(() => tilt(element(), { maxTilt: value })).toThrow(RangeError);
    expect(() => tilt(element(), { speed: value })).toThrow(RangeError);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid perspective/scale (%s)",
    (value) => {
      expect(() => tilt(element(), { perspective: value })).toThrow(RangeError);
      expect(() => tilt(element(), { scale: value })).toThrow(RangeError);
    },
  );

  it("rejects a non-function easing", () => {
    expect(() => tilt(element(), { easing: "ease" as never })).toThrow(TypeError);
  });

  it("rejects invalid selectors and targets", () => {
    expect(() => tilt("!!bad")).toThrow(SyntaxError);
    expect(() => tilt({} as unknown as HTMLElement)).toThrow(TypeError);
  });

  it("validates options even when nothing matches", () => {
    expect(() => tilt(".missing", { perspective: 0 })).toThrow(RangeError);
  });

  it("attaches nothing when validation fails", () => {
    const target = makeElement();
    expect(() => tilt(asHTML(target), { scale: 0 })).toThrow(RangeError);
    expect(target.listenerCount()).toBe(0);
    expect(changeListeners.size).toBe(0);
  });
});
