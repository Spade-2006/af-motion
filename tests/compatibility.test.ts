import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { magnetic } from "../src/effects/magnetic";
import { parallax } from "../src/effects/parallax";
import { tilt } from "../src/effects/tilt";

class FakeStyle {
  values = new Map<string, string>();
  get transform(): string {
    return this.values.get("transform") ?? "";
  }
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
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
  // Center (200, 150) in the viewport, 200x100; page position equals viewport position at scroll 0.
  getBoundingClientRect = () => ({ left: 100, top: 100 - fakeWindow.scrollY, width: 200, height: 100 });
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
}

interface FakeWindow {
  scrollX: number;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
  listeners: Map<string, Set<() => void>>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

let fakeWindow: FakeWindow;
let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let reducedMotion: boolean;
let changeListeners: Set<(event: { matches: boolean }) => void>;

function flush(): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(0);
}

function scrollTo(y: number): void {
  fakeWindow.scrollY = y;
  for (const listener of [...(fakeWindow.listeners.get("scroll") ?? [])]) listener();
}

function transformOf(element: FakeHTMLElement): string | undefined {
  return element.style.values.get("transform");
}

function asHTML(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

type EffectName = "magnetic" | "tilt" | "parallax";

interface Effect {
  controls: { destroy(): void };
  /** Regex matching this effect's contribution to the transform. */
  marker: RegExp;
}

// Parallax: element center is 150 + 1000 = page y 1150 only if offset by scroll; see markers below.
function start(name: EffectName, element: FakeHTMLElement): Effect {
  if (name === "magnetic") {
    const controls = magnetic(asHTML(element), { strength: 0.5, maxTranslate: 20, duration: 0 });
    element.emit("pointermove", { clientX: 300, clientY: 150 });
    flush();
    return { controls, marker: /translate\(20px, 0px\)/ };
  }
  if (name === "tilt") {
    const controls = tilt(asHTML(element), { maxTilt: 10, speed: 0 });
    element.emit("pointermove", { clientX: 300, clientY: 150 });
    flush();
    return { controls, marker: /rotateY\(10deg\)/ };
  }
  const controls = parallax(asHTML(element), { speed: 0.5, maxOffset: 1000 });
  // Page center y = 150, viewport center 400 at scroll 0 => offset +125.
  return { controls, marker: /translate\(0px, 125px\)/ };
}

const names: EffectName[] = ["magnetic", "tilt", "parallax"];
const pairs = names.flatMap((a) => names.filter((b) => b !== a).map((b) => [a, b] as const));

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  reducedMotion = false;
  changeListeners = new Set();

  const listeners = new Map<string, Set<() => void>>();
  fakeWindow = {
    scrollX: 0,
    scrollY: 0,
    innerWidth: 1000,
    innerHeight: 800,
    listeners,
    addEventListener: (type, listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
  };

  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      changeListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      changeListeners.delete(listener);
    },
  }));
  vi.stubGlobal("getComputedStyle", () => ({ transform: "none" }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("transform composition across effects", () => {
  describe.each(pairs)("%s then %s on one element", (first, second) => {
    it.each(["", "rotate(5deg)"])("keeps both effects and restores original %j exactly", (original) => {
      const element = new FakeHTMLElement();
      if (original !== "") element.style.setProperty("transform", original);

      const a = start(first, element);
      const b = start(second, element);

      expect(transformOf(element)).toMatch(a.marker);
      expect(transformOf(element)).toMatch(b.marker);
      if (original !== "") expect(transformOf(element)?.split(original)).toHaveLength(2);

      // Destroying either effect must not wipe the other's contribution.
      a.controls.destroy();
      expect(transformOf(element)).toMatch(b.marker);
      expect(transformOf(element)).not.toMatch(a.marker);

      b.controls.destroy();
      expect(transformOf(element)).toBe(original === "" ? undefined : original);
    });

    it.each(["", "rotate(5deg)"])("restores original %j when destroyed in reverse order", (original) => {
      const element = new FakeHTMLElement();
      if (original !== "") element.style.setProperty("transform", original);

      const a = start(first, element);
      const b = start(second, element);

      b.controls.destroy();
      expect(transformOf(element)).toMatch(a.marker);
      expect(transformOf(element)).not.toMatch(b.marker);

      a.controls.destroy();
      expect(transformOf(element)).toBe(original === "" ? undefined : original);
    });
  });

  it("keeps parallax's offset when a pointer effect moves afterwards, and vice versa", () => {
    const element = new FakeHTMLElement();
    const p = start("parallax", element);
    const m = start("magnetic", element);
    expect(transformOf(element)).toMatch(p.marker);
    expect(transformOf(element)).toMatch(m.marker);

    scrollTo(100); // parallax offset 125 -> 175; magnetic must stay applied
    flush();
    expect(transformOf(element)).toMatch(/translate\(0px, 175px\)/);
    expect(transformOf(element)).toMatch(m.marker);

    element.emit("pointermove", { clientX: 100, clientY: 150 }); // magnetic -> -20px
    flush();
    expect(transformOf(element)).toMatch(/translate\(0px, 175px\)/);
    expect(transformOf(element)).toMatch(/translate\(-20px, 0px\)/);
    p.controls.destroy();
    m.controls.destroy();
    expect(transformOf(element)).toBeUndefined();
  });

  it("all three effects together restore the original transform in any destroy order", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(5deg)");
    const effects = names.map((name) => start(name, element));
    for (const effect of effects) expect(transformOf(element)).toMatch(effect.marker);

    effects[1]?.controls.destroy();
    effects[2]?.controls.destroy();
    expect(transformOf(element)).toMatch(effects[0]?.marker as RegExp);
    effects[0]?.controls.destroy();
    expect(transformOf(element)).toBe("rotate(5deg)");
  });
});

describe("repeated initialization and destruction", () => {
  it.each(names)("%s leaves the element unchanged after repeated create/destroy cycles", (name) => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(5deg)");
    element.style.setProperty("color", "red");

    for (let i = 0; i < 3; i++) {
      const effect = start(name, element);
      expect(transformOf(element)).toMatch(effect.marker);
      effect.controls.destroy();
      effect.controls.destroy();
      expect(transformOf(element)).toBe("rotate(5deg)");
    }
    expect(element.style.values.get("color")).toBe("red");
    expect(frames.size).toBe(0);
  });

  it("two instances of the same effect on one element do not corrupt each other", () => {
    const element = new FakeHTMLElement();
    const first = start("tilt", element);
    const second = start("tilt", element);
    first.controls.destroy();
    second.controls.destroy();
    expect(transformOf(element)).toBeUndefined();
  });
});

describe("reduced motion consistency", () => {
  it("magnetic resets immediately when the preference turns on, without a pointer event", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("transform", "rotate(5deg)");
    const effect = start("magnetic", element);
    expect(transformOf(element)).toMatch(effect.marker);

    reducedMotion = true;
    for (const listener of changeListeners) listener({ matches: true });
    expect(transformOf(element)).toBe("rotate(5deg)");
    expect(frames.size).toBe(0);
    effect.controls.destroy();
    expect(changeListeners.size).toBe(0);
  });

  it("magnetic resets without animating when reduced motion is detected on a pointer event", () => {
    const element = new FakeHTMLElement();
    const effect = start("magnetic", element);
    reducedMotion = true;
    element.emit("pointermove", { clientX: 100, clientY: 150 });
    expect(transformOf(element)).toBeUndefined();
    expect(frames.size).toBe(0);
    effect.controls.destroy();
  });

  it.each(["magnetic", "tilt", "parallax"] as const)("%s never touches styles when reduced motion is on", (name) => {
    reducedMotion = true;
    const element = new FakeHTMLElement();
    const effect = start(name, element);
    expect(transformOf(element)).toBeUndefined();
    effect.controls.destroy();
  });
});
