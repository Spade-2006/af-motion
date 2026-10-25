import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { gradientText } from "../src/effects/gradient-text";
import type { GradientTextControls, GradientTextOptions } from "../src/effects/gradient-text";

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
  animations: Array<{ keyframes: Keyframe[] | PropertyIndexedKeyframes | null; options?: number | KeyframeAnimationOptions }> = [];
  animationInstances: FakeAnimation[] = [];
  animate = vi.fn((keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) => {
    this.animations.push({ keyframes, options });
    const animation = new FakeAnimation();
    this.animationInstances.push(animation);
    return animation as unknown as Animation;
  });
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

describe("gradientText()", () => {
  it("applies the configured clipped text gradient and restores inline styles exactly", () => {
    const element = new FakeHTMLElement();
    element.style.setProperty("background-image", "url(original.png)", "important");
    element.style.setProperty("color", "navy");
    element.style.setProperty("background-position", "12% 30%");
    const controls = gradientText(asTarget(element), {
      colors: ["#ff4d6d", "#7c3aed", "#22d3ee"],
      angle: 90,
    });

    expect(element.style.getPropertyValue("background-image")).toBe(
      "linear-gradient(90deg, #ff4d6d, #7c3aed, #22d3ee)",
    );
    expect(element.style.getPropertyValue("background-clip")).toBe("text");
    expect(element.style.getPropertyValue("-webkit-background-clip")).toBe("text");
    expect(element.style.getPropertyValue("-webkit-text-fill-color")).toBe("transparent");
    expect(element.style.getPropertyValue("color")).toBe("transparent");

    controls.destroy();
    controls.destroy();
    expect(element.style.getPropertyValue("background-image")).toBe("url(original.png)");
    expect(element.style.getPropertyPriority("background-image")).toBe("important");
    expect(element.style.getPropertyValue("color")).toBe("navy");
    expect(element.style.getPropertyValue("background-position")).toBe("12% 30%");
    expect(element.style.getPropertyValue("background-clip")).toBe("");
  });

  it("animates the gradient with the configured duration and loop behavior", () => {
    const looping = new FakeHTMLElement();
    const controls = gradientText(asTarget(looping), { animated: true, duration: 4000 });
    expect(looping.style.getPropertyValue("background-size")).toBe("200% 100%");
    expect(looping.animate).toHaveBeenCalledTimes(1);
    expect(looping.animations[0]?.options).toMatchObject({
      duration: 4000,
      iterations: Number.POSITIVE_INFINITY,
      easing: "linear",
    });
    controls.destroy();
    expect((looping.animations[0]?.options as KeyframeAnimationOptions).fill).toBe("none");
    expect(looping.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);

    const once = new FakeHTMLElement();
    const onceControls = gradientText(asTarget(once), { animated: true, loop: false, duration: 750 });
    expect(once.animations[0]?.options).toMatchObject({ duration: 750, iterations: 1, fill: "forwards" });
    onceControls.destroy();
  });

  it("supports multiple selector targets and restores all elements", () => {
    const first = new FakeHTMLElement();
    const second = new FakeHTMLElement();
    selectorResults[".title"] = [first, {}, second];
    const controls = gradientText(".title", { colors: ["red", "blue"], animated: true });
    expect(first.style.getPropertyValue("background-clip")).toBe("text");
    expect(second.style.getPropertyValue("background-clip")).toBe("text");
    expect(first.animate).toHaveBeenCalledTimes(1);
    expect(second.animate).toHaveBeenCalledTimes(1);
    controls.destroy();
    expect(first.style.getPropertyValue("background-clip")).toBe("");
    expect(second.style.getPropertyValue("background-clip")).toBe("");
  });

  it("keeps the gradient static for reduced motion and stops when preference changes", () => {
    reducedMotion = true;
    const reduced = new FakeHTMLElement();
    const reducedControls = gradientText(asTarget(reduced), { animated: true });
    expect(reduced.animate).not.toHaveBeenCalled();
    expect(reduced.style.getPropertyValue("background-size")).toBe("100% 100%");
    reducedControls.destroy();

    reducedMotion = false;
    const changing = new FakeHTMLElement();
    const changingControls = gradientText(asTarget(changing), { animated: true });
    expect(changing.animate).toHaveBeenCalledTimes(1);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(changing.animations).toHaveLength(1);
    expect(changing.style.getPropertyValue("background-size")).toBe("100% 100%");
    for (const listener of [...preferenceListeners]) listener({ matches: false });
    expect(changing.animate).toHaveBeenCalledTimes(2);
    changingControls.destroy();
    expect(preferenceListeners.size).toBe(0);
  });

  it("validates colors, angle, duration, and loop options before applying styles", () => {
    const element = new FakeHTMLElement();
    expect(() => gradientText(asTarget(element), { colors: ["#fff"] })).toThrow(TypeError);
    expect(() => gradientText(asTarget(element), { colors: ["", "blue"] })).toThrow(TypeError);
    expect(() => gradientText(asTarget(element), { angle: Number.NaN })).toThrow(RangeError);
    expect(() => gradientText(asTarget(element), { duration: 0 })).toThrow(RangeError);
    expect(() => gradientText(asTarget(element), { duration: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => gradientText(asTarget(element), { loop: "yes" as unknown as boolean })).toThrow(TypeError);
    expect(() => gradientText("!!bad")).toThrow(SyntaxError);
    expect(element.style.values.size).toBe(0);
    expectTypeOf<GradientTextOptions["colors"]>().toEqualTypeOf<readonly string[] | undefined>();
    expectTypeOf<GradientTextControls["destroy"]>().toBeFunction();
  });
});
