import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { ripple } from "../src/effects/ripple";
import type { RippleControls, RippleOptions } from "../src/effects/ripple";

class FakeStyle {
  values = new Map<string, string>();
  priorities = new Map<string, string>();
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
  removeProperty(name: string): string {
    const previous = this.getPropertyValue(name);
    this.values.delete(name);
    this.priorities.delete(name);
    return previous;
  }
}

class FakeAnimation {
  cancel = vi.fn();
  onfinish: (() => void) | null = null;
  finish(): void {
    this.onfinish?.();
  }
}

class FakeElement {
  parentElement: FakeElement | null = null;
  childNodes: FakeElement[] = [];
  style = new FakeStyle();
  attributes = new Map<string, string>();
  listeners = new Map<string, Set<EventListener>>();
  animations: Array<{ keyframes: Keyframe[] | PropertyIndexedKeyframes | null; options?: number | KeyframeAnimationOptions }> = [];
  animationInstances: FakeAnimation[] = [];
  rect = { left: 10, top: 20, width: 100, height: 60 };
  animate = vi.fn((keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) => {
    this.animations.push({ keyframes, options });
    const animation = new FakeAnimation();
    this.animationInstances.push(animation);
    return animation as unknown as Animation;
  });
  get firstChild(): FakeElement | null {
    return this.childNodes[0] ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  getBoundingClientRect(): DOMRect {
    return this.rect as DOMRect;
  }
  insertBefore<T extends FakeElement>(node: T, before: FakeElement | null): T {
    if (node.parentElement) node.parentElement.removeChild(node);
    const index = before === null ? -1 : this.childNodes.indexOf(before);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentElement = this;
    return node;
  }
  removeChild<T extends FakeElement>(node: T): T {
    this.childNodes.splice(this.childNodes.indexOf(node), 1);
    node.parentElement = null;
    return node;
  }
  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener);
  }
  click(clientX: number, clientY: number, detail = 1): { defaultPrevented: boolean } {
    const event = { clientX, clientY, detail, defaultPrevented: false } as MouseEvent;
    for (const listener of this.listeners.get("click") ?? []) listener(event);
    return event;
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let preferenceListeners: Set<(event: { matches: boolean }) => void>;

function asTarget(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function makeTarget(): FakeElement {
  const target = new FakeElement();
  target.insertBefore(new FakeElement(), null);
  return target;
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  preferenceListeners = new Set();
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("getComputedStyle", (element: FakeElement) => ({
    position: element.style.getPropertyValue("position") || "static",
    isolation: element.style.getPropertyValue("isolation"),
  }));
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      preferenceListeners.delete(listener);
    },
  }));
  vi.stubGlobal("document", {
    createElement: () => new FakeElement(),
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("ripple()", () => {
  it("places a configured pointer-origin wave relative to the target", () => {
    const target = makeTarget();
    target.style.setProperty("position", "absolute", "important");
    target.style.setProperty("isolation", "auto");
    const originalChild = target.firstChild;
    const controls = ripple(asTarget(target), {
      color: "rgba(255,255,255,0.35)",
      duration: 600,
      scale: 2,
      origin: "pointer",
    });
    const click = target.click(35, 45);
    const wave = target.firstChild!;

    expect(click.defaultPrevented).toBe(false);
    expect(wave.attributes.get("aria-hidden")).toBe("true");
    expect(wave.style.getPropertyValue("left")).toBe("25px");
    expect(wave.style.getPropertyValue("top")).toBe("25px");
    expect(wave.style.getPropertyValue("background-color")).toBe("rgba(255,255,255,0.35)");
    expect(wave.style.getPropertyValue("pointer-events")).toBe("none");
    expect(wave.animations[0]?.options).toMatchObject({ duration: 600, easing: "ease-out", fill: "forwards" });
    expect((wave.animations[0]?.keyframes as Keyframe[])[1]?.transform).toBe("translate(-50%, -50%) scale(2)");

    wave.animationInstances[0]?.finish();
    expect(target.childNodes).toEqual([originalChild]);
    controls.destroy();
    expect(target.style.getPropertyValue("position")).toBe("absolute");
    expect(target.style.getPropertyPriority("position")).toBe("important");
    expect(target.style.getPropertyValue("isolation")).toBe("auto");
    expect(target.listeners.get("click")?.size ?? 0).toBe(0);
  });

  it("uses target center when center origin is selected or click is keyboard-generated", () => {
    const centered = makeTarget();
    const controls = ripple(asTarget(centered), { origin: "center" });
    centered.click(80, 70);
    const centerWave = centered.firstChild!;
    expect(centerWave.style.getPropertyValue("left")).toBe("50px");
    expect(centerWave.style.getPropertyValue("top")).toBe("30px");
    controls.destroy();

    const keyboard = makeTarget();
    const keyboardControls = ripple(asTarget(keyboard), { origin: "pointer" });
    keyboard.click(0, 0, 0);
    expect(keyboard.firstChild?.style.getPropertyValue("left")).toBe("50px");
    expect(keyboard.firstChild?.style.getPropertyValue("top")).toBe("30px");
    keyboardControls.destroy();
  });

  it("supports multiple targets and removes all active waves on destroy", () => {
    const first = makeTarget();
    const second = makeTarget();
    const originalFirst = first.firstChild;
    selectorResults[".button"] = [first, {}, second];
    const controls = ripple(".button", { origin: "center" });
    first.click(15, 25);
    second.click(15, 25);
    const firstWave = first.firstChild!;
    const secondWave = second.firstChild!;
    expect(firstWave.style.getPropertyValue("left")).toBe("50px");
    expect(secondWave.style.getPropertyValue("top")).toBe("30px");
    controls.destroy();
    expect(first.childNodes).toEqual([originalFirst]);
    expect(second.childNodes).toHaveLength(1);
    expect(firstWave.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(secondWave.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    controls.destroy();
  });

  it("does not create waves when reduced motion is preferred", () => {
    reducedMotion = true;
    const target = makeTarget();
    const original = target.firstChild;
    const controls = ripple(asTarget(target));
    target.click(40, 40);
    expect(target.childNodes).toEqual([original]);
    expect(target.style.getPropertyValue("position")).toBe("");
    controls.destroy();
    expect(target.listeners.get("click")?.size ?? 0).toBe(0);
  });

  it("removes active waves and suppresses new ones when reduced motion activates", () => {
    const target = makeTarget();
    const controls = ripple(asTarget(target));
    target.click(40, 40);
    const wave = target.firstChild!;
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(target.childNodes).toHaveLength(1);
    expect(wave.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    target.click(40, 40);
    expect(target.childNodes).toHaveLength(1);
    controls.destroy();
    expect(preferenceListeners.size).toBe(0);
  });

  it("validates options and selectors before modifying targets", () => {
    const target = makeTarget();
    expect(() => ripple(asTarget(target), { color: "" })).toThrow(TypeError);
    expect(() => ripple(asTarget(target), { duration: 0 })).toThrow(RangeError);
    expect(() => ripple(asTarget(target), { scale: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => ripple(asTarget(target), { origin: "cursor" as "pointer" })).toThrow(TypeError);
    expect(() => ripple("!!bad")).toThrow(SyntaxError);
    expect(target.childNodes).toHaveLength(1);
    expect(target.style.getPropertyValue("position")).toBe("");
    expectTypeOf<RippleOptions["origin"]>().toEqualTypeOf<"pointer" | "center" | undefined>();
    expectTypeOf<RippleControls["destroy"]>().toBeFunction();
  });
});
