import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { shine } from "../src/effects/shine";
import type { ShineControls, ShineOptions } from "../src/effects/shine";

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
  dispatch(type: string, event: Partial<PointerEvent> = {}): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ pointerType: "mouse", ...event } as PointerEvent);
    }
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

describe("shine()", () => {
  it("creates a configurable pointer-transparent diagonal overlay", () => {
    const target = makeTarget();
    target.style.setProperty("position", "absolute", "important");
    const originalChild = target.firstChild;
    const controls = shine(asTarget(target), {
      color: "rgba(255,255,255,0.5)",
      angle: 120,
      duration: 1200,
      intensity: 0.7,
      trigger: "continuous",
    });
    const overlay = target.firstChild!;

    expect(overlay.attributes.get("aria-hidden")).toBe("true");
    expect(overlay.style.getPropertyValue("position")).toBe("absolute");
    expect(overlay.style.getPropertyValue("pointer-events")).toBe("none");
    expect(overlay.style.getPropertyValue("background-image")).toBe(
      "linear-gradient(120deg, transparent 38%, rgba(255,255,255,0.5) 50%, transparent 62%)",
    );
    expect(overlay.style.getPropertyValue("opacity")).toBe("0.7");
    expect(overlay.animations[0]?.options).toMatchObject({
      duration: 1200,
      iterations: Number.POSITIVE_INFINITY,
      easing: "linear",
    });
    expect(overlay.childNodes).toHaveLength(0);

    controls.destroy();
    expect(target.childNodes).toEqual([originalChild]);
    expect(target.style.getPropertyValue("position")).toBe("absolute");
    expect(target.style.getPropertyPriority("position")).toBe("important");
    expect(overlay.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
  });

  it("runs one sweep on hover and click", () => {
    const hoverTarget = makeTarget();
    const hoverControls = shine(asTarget(hoverTarget), { trigger: "hover" });
    const hoverOverlay = hoverTarget.firstChild!;
    expect(hoverOverlay.style.getPropertyValue("opacity")).toBe("0");
    hoverTarget.dispatch("pointerenter", { pointerType: "touch" });
    expect(hoverOverlay.animate).not.toHaveBeenCalled();
    hoverTarget.dispatch("pointerenter", { pointerType: "mouse" });
    expect(hoverOverlay.animate).toHaveBeenCalledTimes(1);
    expect(hoverOverlay.style.getPropertyValue("opacity")).toBe("0.7");
    hoverTarget.dispatch("pointerleave");
    expect(hoverOverlay.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(hoverOverlay.style.getPropertyValue("opacity")).toBe("0");
    hoverControls.destroy();
    expect(hoverTarget.listeners.get("pointerenter")?.size ?? 0).toBe(0);
    expect(hoverTarget.listeners.get("pointerleave")?.size ?? 0).toBe(0);

    const clickTarget = makeTarget();
    const clickControls = shine(asTarget(clickTarget), { trigger: "click", duration: 500 });
    const clickOverlay = clickTarget.firstChild!;
    clickTarget.dispatch("click");
    expect(clickOverlay.animate).toHaveBeenCalledTimes(1);
    expect(clickOverlay.animations[0]?.options).toMatchObject({ duration: 500, iterations: 1 });
    clickOverlay.animationInstances[0]?.finish();
    expect(clickOverlay.style.getPropertyValue("opacity")).toBe("0");
    clickControls.destroy();
    expect(clickTarget.listeners.get("click")?.size ?? 0).toBe(0);
  });

  it("supports multiple selector targets and cleans up all overlays", () => {
    const first = makeTarget();
    const second = makeTarget();
    const originalFirst = first.firstChild;
    selectorResults[".shine"] = [first, {}, second];
    const controls = shine(".shine", { trigger: "continuous" });
    const firstOverlay = first.firstChild!;
    const secondOverlay = second.firstChild!;
    expect(first.childNodes).toHaveLength(2);
    expect(second.childNodes).toHaveLength(2);
    expect(firstOverlay.animate).toHaveBeenCalledTimes(1);
    expect(secondOverlay.animate).toHaveBeenCalledTimes(1);
    controls.destroy();
    expect(first.childNodes).toEqual([originalFirst]);
    expect(second.childNodes).toHaveLength(1);
  });

  it("uses a subtle static sheen for reduced motion and reacts to preference changes", () => {
    reducedMotion = true;
    const reduced = makeTarget();
    const reducedControls = shine(asTarget(reduced), { trigger: "continuous" });
    const reducedOverlay = reduced.firstChild!;
    expect(reducedOverlay.animate).not.toHaveBeenCalled();
    expect(reducedOverlay.style.getPropertyValue("opacity")).toBe("0.2");
    expect(reducedOverlay.style.getPropertyValue("background-position")).toBe("50% 0");
    reducedControls.destroy();

    reducedMotion = false;
    const changing = makeTarget();
    const controls = shine(asTarget(changing), { trigger: "continuous" });
    const overlay = changing.firstChild!;
    expect(overlay.animate).toHaveBeenCalledTimes(1);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(overlay.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(overlay.style.getPropertyValue("opacity")).toBe("0.2");
    for (const listener of [...preferenceListeners]) listener({ matches: false });
    expect(overlay.animate).toHaveBeenCalledTimes(2);
    controls.destroy();
    expect(preferenceListeners.size).toBe(0);
  });

  it("validates options and selectors before changing targets", () => {
    const target = makeTarget();
    expect(() => shine(asTarget(target), { color: "" })).toThrow(TypeError);
    expect(() => shine(asTarget(target), { angle: Number.NaN })).toThrow(RangeError);
    expect(() => shine(asTarget(target), { duration: 0 })).toThrow(RangeError);
    expect(() => shine(asTarget(target), { intensity: -0.1 })).toThrow(RangeError);
    expect(() => shine(asTarget(target), { intensity: 1.1 })).toThrow(RangeError);
    expect(() => shine(asTarget(target), { trigger: "focus" as "hover" })).toThrow(TypeError);
    expect(() => shine("!!bad")).toThrow(SyntaxError);
    expect(target.childNodes).toHaveLength(1);
    expect(target.style.getPropertyValue("position")).toBe("");
    expectTypeOf<ShineOptions["trigger"]>().toEqualTypeOf<"hover" | "continuous" | "click" | undefined>();
    expectTypeOf<ShineControls["destroy"]>().toBeFunction();
  });
});
