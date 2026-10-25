import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { glow } from "../src/effects/glow";
import type { GlowControls, GlowOptions } from "../src/effects/glow";

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
}

class FakeHTMLElement {
  style = new FakeStyle();
  listeners = new Map<string, Set<EventListener>>();
  animations: Array<{ keyframes: Keyframe[] | PropertyIndexedKeyframes | null; options?: number | KeyframeAnimationOptions }> = [];
  animationInstances: FakeAnimation[] = [];
  animate = vi.fn((keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) => {
    this.animations.push({ keyframes, options });
    const animation = new FakeAnimation();
    this.animationInstances.push(animation);
    return animation as unknown as Animation;
  });
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

function asTarget(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  preferenceListeners = new Set();
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
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
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("glow()", () => {
  it("applies a configurable static shadow composed with the original shadow", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("box-shadow", "2px 3px 4px black", "important");
    const controls = glow(asTarget(element), {
      color: "#8b5cf6",
      intensity: 0.5,
      blur: 20,
      mode: "static",
    });
    const shadow = element.style.getPropertyValue("box-shadow");
    expect(shadow.startsWith("2px 3px 4px black, 0 0 10px 3.5px")).toBe(true);
    expect(shadow).toContain("color-mix(in srgb, #8b5cf6 50%, transparent)");
    expect(element.animate).not.toHaveBeenCalled();

    controls.destroy();
    expect(element.style.getPropertyValue("box-shadow")).toBe("2px 3px 4px black");
    expect(element.style.getPropertyPriority("box-shadow")).toBe("important");
  });

  it("pulses with the configured duration and cancels on destroy", () => {
    const element = new FakeHTMLElement();
    const controls = glow(asTarget(element), { mode: "pulse", duration: 1750 });
    expect(element.animate).toHaveBeenCalledTimes(1);
    expect(element.animations[0]?.options).toMatchObject({
      duration: 1750,
      iterations: Number.POSITIVE_INFINITY,
      easing: "ease-in-out",
    });
    controls.destroy();
    expect(element.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
  });

  it("activates hover mode on mouse and pen, ignores touch, and restores event state", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("box-shadow", "inset 0 0 2px black");
    element.style.setProperty("transition", "opacity 1s", "important");
    const controls = glow(asTarget(element), { mode: "hover", color: "coral", trigger: "immediate" });

    expect(element.style.getPropertyValue("box-shadow")).toBe("inset 0 0 2px black");
    expect(element.listeners.get("pointerenter")?.size).toBe(1);
    expect(element.style.getPropertyValue("transition")).toContain("opacity 1s, box-shadow 180ms ease");
    element.dispatch("pointerenter", { pointerType: "touch" });
    expect(element.style.getPropertyValue("box-shadow")).toBe("inset 0 0 2px black");
    element.dispatch("pointerenter");
    expect(element.style.getPropertyValue("box-shadow")).toContain("coral");
    element.dispatch("pointerleave");
    expect(element.style.getPropertyValue("box-shadow")).toBe("inset 0 0 2px black");

    controls.destroy();
    controls.destroy();
    expect(element.listeners.get("pointerenter")?.size ?? 0).toBe(0);
    expect(element.listeners.get("pointerleave")?.size ?? 0).toBe(0);
    expect(element.style.getPropertyValue("transition")).toBe("opacity 1s");
    expect(element.style.getPropertyPriority("transition")).toBe("important");
  });

  it("activates immediate modes only while hovered when trigger is hover", () => {
    const element = new FakeHTMLElement();
    const controls = glow(asTarget(element), { mode: "static", trigger: "hover" });
    expect(element.style.getPropertyValue("box-shadow")).toBe("");
    element.dispatch("pointerenter");
    expect(element.style.getPropertyValue("box-shadow")).toContain("#8b5cf6");
    element.dispatch("pointerleave");
    expect(element.style.getPropertyValue("box-shadow")).toBe("");
    controls.destroy();
  });

  it("supports multiple selector targets", () => {
    const first = new FakeHTMLElement();
    const second = new FakeHTMLElement();
    selectorResults[".card"] = [first, {}, second];
    const controls = glow(".card", { mode: "pulse" });
    expect(first.animate).toHaveBeenCalledTimes(1);
    expect(second.animate).toHaveBeenCalledTimes(1);
    controls.destroy();
    expect(first.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(second.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
  });

  it("downgrades pulse to static under reduced motion and tracks preference changes", () => {
    reducedMotion = true;
    const reduced = new FakeHTMLElement();
    const reducedControls = glow(asTarget(reduced), { mode: "pulse" });
    expect(reduced.animate).not.toHaveBeenCalled();
    expect(reduced.style.getPropertyValue("box-shadow")).toContain("#8b5cf6");
    reducedControls.destroy();

    reducedMotion = false;
    const changing = new FakeHTMLElement();
    const changingControls = glow(asTarget(changing), { mode: "pulse" });
    expect(changing.animate).toHaveBeenCalledTimes(1);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(changing.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(changing.style.getPropertyValue("box-shadow")).toContain("#8b5cf6");
    for (const listener of [...preferenceListeners]) listener({ matches: false });
    expect(changing.animate).toHaveBeenCalledTimes(2);
    changingControls.destroy();
    expect(preferenceListeners.size).toBe(0);
  });

  it("validates all options and targets before changing styles", () => {
    const element = new FakeHTMLElement();
    expect(() => glow(asTarget(element), { intensity: -0.1 })).toThrow(RangeError);
    expect(() => glow(asTarget(element), { intensity: 1.1 })).toThrow(RangeError);
    expect(() => glow(asTarget(element), { blur: Number.NaN })).toThrow(RangeError);
    expect(() => glow(asTarget(element), { duration: 0 })).toThrow(RangeError);
    expect(() => glow(asTarget(element), { mode: "flash" as "static" })).toThrow(TypeError);
    expect(() => glow(asTarget(element), { trigger: "focus" as "immediate" })).toThrow(TypeError);
    expect(() => glow(asTarget(element), { color: "" })).toThrow(TypeError);
    expect(() => glow("!!bad")).toThrow(SyntaxError);
    expect(element.style.values.size).toBe(0);
    expectTypeOf<GlowOptions["mode"]>().toEqualTypeOf<"static" | "pulse" | "hover" | undefined>();
    expectTypeOf<GlowControls["destroy"]>().toBeFunction();
  });
});
