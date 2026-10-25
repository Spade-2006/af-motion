import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { borderBeam } from "../src/effects/border-beam";
import type { BorderBeamControls, BorderBeamOptions } from "../src/effects/border-beam";

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
  pause = vi.fn();
  play = vi.fn();
  cancel = vi.fn();
}

class FakeElement {
  parentElement: FakeElement | null = null;
  parentNode: FakeElement | null = null;
  childNodes: FakeElement[] = [];
  style = new FakeStyle();
  attributes = new Map<string, string>();
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
    node.parentNode = this;
    return node;
  }
  appendChild<T extends FakeElement>(node: T): T {
    return this.insertBefore(node, null);
  }
  removeChild<T extends FakeElement>(node: T): T {
    this.childNodes.splice(this.childNodes.indexOf(node), 1);
    node.parentElement = null;
    node.parentNode = null;
    return node;
  }
}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let preferenceListeners: Set<(event: { matches: boolean }) => void>;

function asTarget(element: FakeElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function makeTarget(): FakeElement {
  const element = new FakeElement();
  element.appendChild(new FakeElement());
  return element;
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

describe("borderBeam()", () => {
  it("creates a non-interactive masked beam with configured styles and animation", () => {
    const element = makeTarget();
    element.style.setProperty("position", "absolute", "important");
    element.style.setProperty("isolation", "auto");
    const originalChild = element.firstChild;
    const controls = borderBeam(asTarget(element), {
      color: "#8b5cf6",
      size: 120,
      duration: 3000,
      borderWidth: 2,
      radius: 16,
    });
    const layer = element.firstChild!;

    expect(layer.attributes.get("aria-hidden")).toBe("true");
    expect(layer.style.getPropertyValue("position")).toBe("absolute");
    expect(layer.style.getPropertyValue("inset")).toBe("0");
    expect(layer.style.getPropertyValue("z-index")).toBe("-1");
    expect(layer.style.getPropertyValue("pointer-events")).toBe("none");
    expect(layer.style.getPropertyValue("border-radius")).toBe("16px");
    expect(layer.style.getPropertyValue("padding")).toBe("2px");
    expect(layer.style.getPropertyValue("background-image")).toContain("#8b5cf6");
    expect(layer.style.getPropertyValue("mask-composite")).toBe("exclude");
    expect(layer.style.getPropertyValue("-webkit-mask-composite")).toBe("xor");
    expect(layer.animations[0]?.options).toMatchObject({
      duration: 3000,
      iterations: Number.POSITIVE_INFINITY,
      easing: "linear",
    });
    expect(element.childNodes[1]).toBe(originalChild);

    controls.destroy();
    expect(element.childNodes).toEqual([originalChild]);
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyPriority("position")).toBe("important");
    expect(element.style.getPropertyValue("isolation")).toBe("auto");
    expect(layer.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
  });

  it("supports initially paused beams and pause/resume controls", () => {
    const initial = makeTarget();
    const initialControls = borderBeam(asTarget(initial), { paused: true });
    const initialLayer = initial.firstChild!;
    expect(initialLayer.animate).not.toHaveBeenCalled();
    initialControls.resume();
    expect(initialLayer.animate).toHaveBeenCalledTimes(1);
    initialControls.pause();
    expect(initialLayer.animationInstances[0]?.pause).toHaveBeenCalledTimes(1);
    initialControls.pause();
    expect(initialLayer.animationInstances[0]?.pause).toHaveBeenCalledTimes(1);
    initialControls.resume();
    expect(initialLayer.animationInstances[0]?.play).toHaveBeenCalledTimes(1);
    initialControls.destroy();
    expect(initialLayer.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);

    const active = makeTarget();
    const activeControls = borderBeam(asTarget(active));
    const activeLayer = active.firstChild!;
    activeControls.pause();
    expect(activeLayer.animationInstances[0]?.pause).toHaveBeenCalledTimes(1);
    activeControls.resume();
    expect(activeLayer.animationInstances[0]?.play).toHaveBeenCalledTimes(1);
    activeControls.destroy();
  });

  it("supports multiple selector matches and overlapping instances", () => {
    const first = makeTarget();
    const second = makeTarget();
    selectorResults[".card"] = [first, {}, second];
    const firstOriginal = first.firstChild;
    const one = borderBeam(".card");
    const two = borderBeam(asTarget(first), { color: "cyan", paused: true });
    const firstLayer = first.childNodes[1]!;
    const secondLayer = second.childNodes[0]!;
    expect(first.childNodes).toHaveLength(3);
    expect(second.childNodes).toHaveLength(2);
    one.destroy();
    expect(first.style.getPropertyValue("position")).toBe("relative");
    expect(first.style.getPropertyValue("isolation")).toBe("isolate");
    two.destroy();
    expect(first.childNodes).toEqual([firstOriginal]);
    expect(first.style.getPropertyValue("position")).toBe("");
    expect(first.style.getPropertyValue("isolation")).toBe("");
    expect(second.childNodes).toHaveLength(1);
    expect(firstLayer.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(secondLayer.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
  });

  it("uses a static border for reduced motion and stops animation when preference changes", () => {
    reducedMotion = true;
    const reduced = makeTarget();
    const reducedControls = borderBeam(asTarget(reduced));
    const reducedLayer = reduced.firstChild!;
    expect(reduced.animate).not.toHaveBeenCalled();
    expect(reducedLayer.style.getPropertyValue("opacity")).toBe("0.2");
    expect(reducedLayer.style.getPropertyValue("background-image")).toBe("linear-gradient(#8b5cf6, #8b5cf6)");
    reducedControls.destroy();

    reducedMotion = false;
    const changing = makeTarget();
    const changingControls = borderBeam(asTarget(changing));
    const changingLayer = changing.firstChild!;
    expect(changingLayer.animate).toHaveBeenCalledTimes(1);
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(changingLayer.animationInstances[0]?.cancel).toHaveBeenCalledTimes(1);
    expect(changing.firstChild?.style.getPropertyValue("opacity")).toBe("0.2");
    for (const listener of [...preferenceListeners]) listener({ matches: false });
    expect(changingLayer.animate).toHaveBeenCalledTimes(2);
    changingControls.destroy();
    expect(preferenceListeners.size).toBe(0);
  });

  it("validates options and target selectors before DOM modification", () => {
    const target = makeTarget();
    expect(() => borderBeam(asTarget(target), { size: 0 })).toThrow(RangeError);
    expect(() => borderBeam(asTarget(target), { size: 361 })).toThrow(RangeError);
    expect(() => borderBeam(asTarget(target), { duration: Number.NaN })).toThrow(RangeError);
    expect(() => borderBeam(asTarget(target), { borderWidth: 0 })).toThrow(RangeError);
    expect(() => borderBeam(asTarget(target), { radius: -1 })).toThrow(RangeError);
    expect(() => borderBeam(asTarget(target), { color: "" })).toThrow(TypeError);
    expect(() => borderBeam(asTarget(target), { paused: "yes" as unknown as boolean })).toThrow(TypeError);
    expect(() => borderBeam("!!bad")).toThrow(SyntaxError);
    expect(target.childNodes).toHaveLength(1);
    expect(target.style.getPropertyValue("position")).toBe("");
    expectTypeOf<BorderBeamOptions["size"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<BorderBeamControls["pause"]>().toBeFunction();
  });
});
