import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate as createAnimation } from "../src/core/animate";
import type { AnimatableProperties, AnimateTarget } from "../src/core/animate";
import type { AnimationControls, DOMAnimationOptions } from "../src/core/animation";
import { registerEasing, removeEasing } from "../src/easing/easings";
import { removeTransformLayer, setTransformLayer } from "../src/core/transform";

class FakeStyle {
  values = new Map<string, string>([["color", "red"]]);
  priorities = new Map<string, string>();
  get transform(): string {
    return this.values.get("transform") ?? "";
  }
  setProperty = vi.fn((name: string, value: string) => {
    this.values.set(name, value);
  });
  getPropertyValue(name: string): string {
    return this.values.get(name) ?? "";
  }
  getPropertyPriority(name: string): string {
    return this.priorities.get(name) ?? "";
  }
  removeProperty(name: string): void {
    this.values.delete(name);
    this.priorities.delete(name);
  }
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}

class FakeHTMLElement {
  style = new FakeStyle();
}

class FakeSVGElement {
  attributes = new Map<string, string>();
  setAttribute = vi.fn((name: string, value: string) => {
    this.attributes.set(name, value);
  });
  removeAttribute = vi.fn((name: string) => {
    this.attributes.delete(name);
  });
  getAttribute = vi.fn((name: string) => this.attributes.get(name) ?? null);
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let clockTime: number;
let animationControls: AnimationControls[];

function animate(
  target: AnimateTarget,
  properties: AnimatableProperties,
  options: DOMAnimationOptions = {},
): AnimationControls {
  const controls = createAnimation(target, properties, options);
  animationControls.push(controls);
  return controls;
}

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function makeElement(): HTMLElement {
  return new FakeHTMLElement() as unknown as HTMLElement;
}

function makeSVGElement(): SVGElement {
  return new FakeSVGElement() as unknown as SVGElement;
}

function styleOf(element: HTMLElement): FakeStyle {
  return element.style as unknown as FakeStyle;
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  selectorResults = {};
  reducedMotion = false;
  clockTime = 0;
  animationControls = [];

  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("SVGElement", FakeSVGElement);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" && reducedMotion,
  }));
});

afterEach(() => {
  for (const controls of animationControls) controls.cancel();
  vi.unstubAllGlobals();
});

describe("animate: single element", () => {
  it("applies from values immediately and interpolates numbers", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100 });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
  });

  it("uses the shared frame loop for concurrent DOM animations", () => {
    const first = makeElement();
    const second = makeElement();
    animate(first, { opacity: [0, 1] }, { duration: 100 });
    animate(second, { opacity: [0, 1] }, { duration: 100 });

    expect(frames.size).toBe(1);
    flushFrame(0);
    flushFrame(50);

    expect(styleOf(first).get("opacity")).toBe("0.5");
    expect(styleOf(second).get("opacity")).toBe("0.5");
    expect(frames.size).toBe(1);
  });

  it("ends on the exact `to` value and calls onComplete once", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1], width: ["10px", "20.5px"] }, { duration: 100, onComplete });

    flushFrame(0);
    flushFrame(100);
    flushFrame(200);

    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("width")).toBe("20.5px");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("repeats DOM values through the shared animation engine", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { duration: 100, repeat: 1, onComplete });

    flushFrame(0);
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(200);

    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("keeps a newer overlapping property animation intact when the older one is cancelled", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    const older = animate(element, { opacity: [0, 1] }, { duration: 100, fill: "both" });
    flushFrame(0);
    flushFrame(25);
    const newer = animate(element, { opacity: [0.2, 0.8] }, { duration: 100, fill: "both" });
    flushFrame(50);

    const newerValue = styleOf(element).get("opacity");
    older.cancel();
    expect(styleOf(element).get("opacity")).toBe(newerValue);
    newer.cancel();
    expect(styleOf(element).get("opacity")).toBe("0.4");
  });

  it("arbitrates overlapping transform animations and reveals the prior active value", () => {
    const element = makeElement();
    const older = animate(element, {
      transform: ["translateX(0px)", "translateX(100px)"],
    }, { duration: 100, fill: "none" });
    flushFrame(0);
    flushFrame(25);
    const newer = animate(element, {
      transform: ["scale(1)", "scale(2)"],
    }, { duration: 100, fill: "both" });
    flushFrame(50);
    flushFrame(75);
    expect(styleOf(element).get("transform")).toBe("scale(1.25)");

    newer.cancel();
    expect(styleOf(element).get("transform")).toBe("translateX(75px)");
    older.cancel();
    expect(styleOf(element).get("transform")).toBeUndefined();
  });

  it("preserves transform effect layers while an animated transform is cancelled", () => {
    const element = makeElement();
    styleOf(element).setProperty("transform", "translateX(10px)");
    const effect = {};
    setTransformLayer(element, effect, "scale(2)");
    const controls = animate(element, {
      transform: ["translateX(20px)", "translateX(40px)"],
    }, { duration: 100, fill: "none" });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("transform")).toBe("translateX(30px) scale(2)");
    controls.cancel();
    expect(styleOf(element).get("transform")).toBe("translateX(10px) scale(2)");
    removeTransformLayer(element, effect);
    expect(styleOf(element).get("transform")).toBe("translateX(10px)");
  });

  it("supports infinite DOM looping without completion", () => {
    const element = makeElement();
    const onStart = vi.fn();
    const onComplete = vi.fn();
    const controls = animate(element, { opacity: [0, 1] }, {
      duration: 100,
      repeat: Infinity,
      onStart,
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    flushFrame(150);

    expect(styleOf(element).get("opacity")).toBe("0.5");
    expect(onStart).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
    controls.cancel();
  });

  it("animates SVG attributes with numeric interpolation and exact final values", () => {
    const element = makeSVGElement();
    const controls = animate(element, {
      cx: [10, 30],
      transform: ["translate(0 0)", "translate(20 10)"],
    }, { duration: 100 });

    expect(element.getAttribute("cx")).toBe("10");
    expect(element.getAttribute("transform")).toBe("translate(0 0)");
    flushFrame(0);
    flushFrame(50);
    expect(element.getAttribute("cx")).toBe("20");
    expect(element.getAttribute("transform")).toBe("translate(10 5)");
    flushFrame(100);
    expect(element.getAttribute("cx")).toBe("30");
    expect(element.getAttribute("transform")).toBe("translate(20 10)");
    controls.cancel();
  });

  it("alternates DOM values when yoyo is enabled", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, {
      duration: 100,
      repeat: 1,
      yoyo: true,
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    flushFrame(150);
    flushFrame(200);

    expect(styleOf(element).get("opacity")).toBe("0");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("does not touch unrelated inline styles", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 10 });
    flushFrame(0);
    flushFrame(10);

    const names = styleOf(element).setProperty.mock.calls.map(([name]) => name);
    expect(new Set(names)).toEqual(new Set(["opacity"]));
    expect(styleOf(element).get("color")).toBe("red");
  });

  it("honors delay and easing", () => {
    const element = makeElement();
    animate(
      element,
      { opacity: [0, 1] },
      { duration: 100, delay: 100, easing: (t) => t * t },
    );

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0.25");
  });

  it("supports fill none by restoring original inline values after completion", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, { duration: 100, fill: "none" });

    expect(styleOf(element).get("opacity")).toBe("0.4");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("0.4");
  });

  it("supports fill forwards without applying values during delay", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, { duration: 100, delay: 100, fill: "forwards" });

    expect(styleOf(element).get("opacity")).toBe("0.4");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.4");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(200);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("supports fill backwards during delay and restores original values after completion", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, { duration: 100, delay: 100, fill: "backwards" });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(100);
    flushFrame(200);
    expect(styleOf(element).get("opacity")).toBe("0.4");
  });

  it("supports fill both during delay and after completion", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, { duration: 100, delay: 100, fill: "both" });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(100);
    flushFrame(200);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("restores fill none after reduced-motion completion", () => {
    reducedMotion = true;
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { duration: 100, fill: "none", onComplete });

    flushFrame(0);

    expect(styleOf(element).get("opacity")).toBe("0.4");
    expect(onComplete).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
  });

  it("applies backwards fill through global and per-property delays", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, {
      duration: 100,
      delay: 50,
      propertyDelay: { opacity: 50 },
      fill: "backwards",
    });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(200);
    expect(styleOf(element).get("opacity")).toBe("0.4");
  });

  it("writes camelCase SVG presentation properties as hyphenated attributes", () => {
    const element = makeSVGElement();
    const fake = element as unknown as FakeSVGElement;
    fake.attributes.set("stroke-width", "2");
    fake.attributes.set("viewBox", "0 0 10 10");
    const controls = animate(element, {
      strokeWidth: [2, 10],
      fillOpacity: [0, 1],
      stroke: ["#000000", "#ffffff"],
      viewBox: ["0 0 10 10", "0 0 20 20"],
    }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(fake.attributes.get("stroke-width")).toBe("6");
    expect(fake.attributes.get("fill-opacity")).toBe("0.5");
    expect(fake.attributes.get("stroke")).toBe("rgb(127.5, 127.5, 127.5)");
    expect(fake.attributes.get("viewBox")).toBe("0 0 15 15");
    expect(fake.attributes.has("strokeWidth")).toBe(false);
    flushFrame(100);
    expect(fake.attributes.get("stroke-width")).toBe("10");
    expect(fake.attributes.get("stroke")).toBe("#ffffff");
    controls.destroy?.();
  });

  it("restores hyphenated attributes for camelCase names on cancel with fill none and shares ownership", () => {
    const element = makeSVGElement();
    const fake = element as unknown as FakeSVGElement;
    fake.attributes.set("stroke-width", "2");
    const first = animate(element, { strokeWidth: [2, 10] }, { duration: 100, fill: "none" });
    flushFrame(0);
    flushFrame(50);
    const second = animate(element, { "stroke-width": [20, 30] }, { duration: 100, fill: "none" });
    flushFrame(50);
    flushFrame(100);
    expect(fake.attributes.get("stroke-width")).toBe("25");
    second.cancel();
    expect(fake.attributes.get("stroke-width")).toBe("2");
    first.cancel();
    expect(fake.attributes.get("stroke-width")).toBe("2");
    expect(fake.attributes.has("strokeWidth")).toBe(false);
  });
  function svgTransformAt(from: string, to: string, time = 50): string | undefined {
    const element = makeSVGElement();
    const controls = animate(element, { transform: [from, to] }, { duration: 100 });
    flushFrame(0);
    flushFrame(time);
    const value = (element as unknown as FakeSVGElement).attributes.get("transform");
    controls.cancel();
    return value;
  }

  it("interpolates each SVG transform function type", () => {
    expect(svgTransformAt("translate(0, 0)", "translate(100 50)")).toBe("translate(50 25)");
    expect(svgTransformAt("scale(1)", "scale(3 5)")).toBe("scale(2 3)");
    expect(svgTransformAt("rotate(0)", "rotate(90)")).toBe("rotate(45)");
    expect(svgTransformAt("skewX(0)", "skewX(40)")).toBe("skewX(20)");
    expect(svgTransformAt("skewY(10)", "skewY(30)")).toBe("skewY(20)");
    expect(svgTransformAt("matrix(1 0 0 1 0 0)", "matrix(2,0,0,2,10,20)")).toBe("matrix(1.5 0 0 1.5 5 10)");
  });

  it("keeps rotation centers, ordering, and implicit parameters in mixed lists", () => {
    expect(svgTransformAt("translate(10) rotate(0 50 50) scale(1)", "translate(30,0),rotate(90,50,50)  scale(2)"))
      .toBe("translate(20 0) rotate(45 50 50) scale(1.5 1.5)");
    expect(svgTransformAt("rotate(0)", "rotate(90 10 20)")).toBe("rotate(45 5 10)");
  });

  it("snaps instead of generating invalid SVG for malformed or incompatible transforms", () => {
    for (const [from, to] of [
      ["translate(0)", "scale(2)"],
      ["translate(0) scale(1)", "scale(1) translate(0)"],
      ["translate(0)", "translate(0) scale(1)"],
      ["rotate(0 5)", "rotate(10 5)"],
      ["translate(0px)", "translate(10px)"],
      ["translate(0))", "translate(10)"],
      ["matrix(1 0 0 1 0)", "matrix(1 0 0 1 0 0)"],
    ] as const) {
      expect(svgTransformAt(from, to, 50)).toBe(from);
      expect(svgTransformAt(from, to, 100)).toBe(to);
    }
  });

  it("keeps ownership and restoration for overlapping SVG transform animations", () => {
    const element = makeSVGElement();
    const fake = element as unknown as FakeSVGElement;
    fake.attributes.set("transform", "translate(5 5)");
    const first = animate(element, { transform: ["translate(0)", "translate(10)"] }, { duration: 100, fill: "none" });
    flushFrame(0);
    flushFrame(50);
    const second = animate(element, { transform: ["rotate(0)", "rotate(90)"] }, { duration: 100, fill: "none" });
    flushFrame(50);
    flushFrame(100);
    expect(fake.attributes.get("transform")).toBe("rotate(45)");
    second.cancel();
    expect(fake.attributes.get("transform")).toBe("translate(5 5)");
    first.cancel();
    expect(fake.attributes.get("transform")).toBe("translate(5 5)");
  });
  it("honors seeked progress when the total duration is zero", () => {
    const element = makeElement();
    const controls = animate(element, { opacity: [0, 1] }, { duration: 0, respectReducedMotion: false });
    controls.pause();
    controls.seek(0);
    expect(styleOf(element).getPropertyValue("opacity")).toBe("0");
    controls.seek(0.25);
    expect(styleOf(element).getPropertyValue("opacity")).toBe("0.25");
    controls.cancel();
  });
  it("restores original SVG attributes for fill none", () => {
    const element = makeSVGElement();
    const fakeElement = element as unknown as FakeSVGElement;
    fakeElement.attributes.set("cx", "5");
    animate(element, { cx: [10, 30] }, { duration: 100, fill: "none" });

    flushFrame(0);
    flushFrame(100);
    expect(fakeElement.getAttribute("cx")).toBe("5");
  });

  it("restores original styles when an explicitly filled animation is cancelled", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    const onCancel = vi.fn();
    const controls = animate(element, { opacity: [0, 1] }, {
      duration: 100,
      fill: "both",
      onCancel,
    });

    flushFrame(0);
    flushFrame(50);
    controls.cancel();
    expect(styleOf(element).get("opacity")).toBe("0.4");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("restores fill-managed styles when a lifecycle callback throws", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, {
      duration: 100,
      fill: "both",
      onUpdate: () => {
        throw new Error("update failed");
      },
    });

    expect(() => flushFrame(0)).toThrow("update failed");
    expect(styleOf(element).get("opacity")).toBe("0.4");
    expect(frames.size).toBe(0);
  });

  it("preserves legacy fill behavior when fill is omitted", () => {
    const element = makeElement();
    styleOf(element).setProperty("opacity", "0.4");
    animate(element, { opacity: [0, 1] }, { duration: 100 });

    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("accepts a registered easing name", () => {
    const element = makeElement();
    registerEasing("domPowerEase", (progress) => progress ** 2);
    animate(element, { opacity: [0, 1] }, { duration: 100, easing: "domPowerEase" });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.25");
    removeEasing("domPowerEase");
  });

  it("rejects an unknown registered easing name before starting", () => {
    const element = makeElement();
    expect(() =>
      animate(element, { opacity: [0, 1] }, { easing: "unknownEase" }),
    ).toThrow(TypeError);
    expect(frames.size).toBe(0);
    expect(styleOf(element).get("opacity")).toBeUndefined();
    expect(styleOf(element).get("color")).toBe("red");
  });

  it("forwards lifecycle callbacks and onUpdate after writing the animated value", () => {
    const element = makeElement();
    const events: string[] = [];
    animate(element, { opacity: [0, 1] }, {
      duration: 10,
      onStart: () => events.push("start"),
      onUpdate: (progress) => events.push(`update:${progress}:${styleOf(element).get("opacity")}`),
      onComplete: () => events.push("complete"),
      onCancel: () => events.push("cancel"),
    });

    flushFrame(0);
    flushFrame(10);
    expect(events).toEqual(["start", "update:0:0", "update:1:1", "complete"]);
  });

  it("forwards cancellation callbacks but keeps unmatched selectors silent", () => {
    const element = makeElement();
    const onCancel = vi.fn();
    animate(element, { opacity: [0, 1] }, { onCancel }).cancel();
    expect(onCancel).toHaveBeenCalledTimes(1);

    const unmatchedCancel = vi.fn();
    animate(".missing", { opacity: [0, 1] }, { onCancel: unmatchedCancel });
    expect(unmatchedCancel).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});

describe("animate: property interpolation", () => {
  it("interpolates evenly spaced keyframes and completes at the final value", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 10, 30] }, { duration: 100, onComplete });

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("opacity")).toBe("5");
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("10");
    flushFrame(75);
    expect(styleOf(element).get("opacity")).toBe("20");
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(100);

    expect(styleOf(element).get("opacity")).toBe("30");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("preserves two-value interpolation behavior", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 8] }, { duration: 100 });

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("opacity")).toBe("2");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("8");
  });

  it("uses uneven keyframe offsets with local interpolation and exact boundaries", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, {
      width: ["0px", "20px", "100px"],
      "--glow": ["#000", "rgb(100, 100, 100)", "#ffffff"],
    }, {
      duration: 100,
      propertyKeyframeOffsets: {
        width: [0, 0.25, 1],
        "--glow": [0, 0.25, 1],
      },
      onComplete,
    });

    flushFrame(0);
    expect(styleOf(element).get("width")).toBe("0px");
    flushFrame(12.5);
    expect(styleOf(element).get("width")).toBe("10px");
    flushFrame(25);
    expect(styleOf(element).get("width")).toBe("20px");
    expect(styleOf(element).get("--glow")).toBe("rgb(100, 100, 100)");
    flushFrame(62.5);
    expect(styleOf(element).get("width")).toBe("60px");
    expect(styleOf(element).get("--glow")).toBe("rgb(177.5, 177.5, 177.5)");
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(100);
    expect(styleOf(element).get("width")).toBe("100px");
    expect(styleOf(element).get("--glow")).toBe("#ffffff");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("holds values outside an explicitly supplied offset range", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 0.5, 1] }, {
      duration: 100,
      propertyKeyframeOffsets: { opacity: [0.2, 0.5, 0.8] },
    });

    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(20);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(80);
    expect(styleOf(element).get("opacity")).toBe("1");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("rejects malformed, out-of-range, and non-increasing keyframe offsets", () => {
    const element = makeElement();
    expect(() => animate(element, { opacity: [0, 0.5, 1] }, {
      propertyKeyframeOffsets: { opacity: [0, Number.NaN, 1] },
    })).toThrow(/finite number between 0 and 1/);
    expect(() => animate(element, { opacity: [0, 0.5, 1] }, {
      propertyKeyframeOffsets: { opacity: [0, 0.8, 0.7] },
    })).toThrow(/strictly increasing/);
    expect(() => animate(element, { opacity: [0, 1] }, {
      propertyKeyframeOffsets: { opacity: [0, 0.5, 1] },
    })).toThrow(/one offset for each/);
    expect(() => animate(element, { opacity: [0, 1] }, {
      propertyKeyframeOffsets: { width: [0, 1] },
    })).toThrow(/does not match an animated property/);
    expect(frames.size).toBe(0);
  });

  it("interpolates numbers inside units and functions", () => {
    const element = makeElement();
    animate(
      element,
      {
        transform: ["translateY(24px)", "translateY(0px)"],
        margin: ["10px 0px", "20px 10px"],
        backgroundColor: ["rgb(0, 0, 0)", "rgb(100, 200, 50)"],
      },
      { duration: 100 },
    );
    flushFrame(0);
    flushFrame(50);

    const style = styleOf(element);
    expect(style.get("transform")).toBe("translateY(12px)");
    expect(style.get("margin")).toBe("15px 5px");
    expect(style.get("background-color")).toBe("rgb(50, 100, 25)");
  });

  it("converts camelCase to kebab-case and keeps custom properties", () => {
    const element = makeElement();
    animate(element, { borderRadius: ["0px", "8px"], "--gap": [0, 4] }, { duration: 100 });
    expect(styleOf(element).get("border-radius")).toBe("0px");
    expect(styleOf(element).get("--gap")).toBe("0");
  });

  it("interpolates numeric and unit-bearing custom properties through to their exact final values", () => {
    const element = makeElement();
    animate(element, {
      "--progress": [0, 1],
      "--glow": ["0px", "20px"],
    }, { duration: 100 });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("--progress")).toBe("0.5");
    expect(styleOf(element).get("--glow")).toBe("10px");
    flushFrame(100);
    expect(styleOf(element).get("--progress")).toBe("1");
    expect(styleOf(element).get("--glow")).toBe("20px");
  });

  it("interpolates color custom properties", () => {
    const element = makeElement();
    animate(element, { "--glow": ["#000000", "rgb(100, 200, 50)"] }, { duration: 100 });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("--glow")).toBe("rgb(50, 100, 25)");
    flushFrame(100);
    expect(styleOf(element).get("--glow")).toBe("rgb(100, 200, 50)");
  });

  it("interpolates custom properties across evenly distributed keyframes", () => {
    const element = makeElement();
    animate(element, { "--glow": ["0px", "10px", "30px"] }, { duration: 100 });

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("--glow")).toBe("5px");
    flushFrame(50);
    expect(styleOf(element).get("--glow")).toBe("10px");
    flushFrame(75);
    expect(styleOf(element).get("--glow")).toBe("20px");
    flushFrame(100);
    expect(styleOf(element).get("--glow")).toBe("30px");
  });

  it("uses a discrete fallback for non-interpolable values", () => {
    const element = makeElement();
    animate(
      element,
      { color: ["red", "blue"], width: ["10px", "2em"], display: ["none", "block"] },
      { duration: 100 },
    );
    flushFrame(0);
    flushFrame(99);

    const style = styleOf(element);
    expect(style.get("color")).toBe("red");
    expect(style.get("width")).toBe("10px");
    expect(style.get("display")).toBe("none");

    flushFrame(100);
    expect(style.get("color")).toBe("blue");
    expect(style.get("width")).toBe("2em");
    expect(style.get("display")).toBe("block");
  });

  it("interpolates short and long hex colors", () => {
    const element = makeElement();
    animate(element, { color: ["#000", "#ffffff"] }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("color")).toBe("rgb(127.5, 127.5, 127.5)");
    flushFrame(100);
    expect(styleOf(element).get("color")).toBe("#ffffff");
  });

  it("allows easing overshoot", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100, easing: () => 1.5 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("1.5");
  });

  it("uses independent property easings with the global easing as fallback", () => {
    const element = makeElement();
    animate(element, {
      opacity: [0, 1],
      width: ["0px", "100px"],
      height: ["0px", "100px"],
    }, {
      duration: 100,
      easing: (progress) => progress * progress,
      propertyEasing: {
        opacity: (progress) => progress,
      },
    });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    expect(styleOf(element).get("width")).toBe("25px");
    expect(styleOf(element).get("height")).toBe("25px");
  });

  it("applies property easing to normalized progress before multi-keyframe interpolation", () => {
    const element = makeElement();
    animate(element, { width: ["0px", "10px", "30px"] }, {
      duration: 100,
      propertyEasing: { width: (progress) => progress * progress },
    });

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("width")).toBe("1.25px");
    flushFrame(50);
    expect(styleOf(element).get("width")).toBe("5px");
    flushFrame(100);
    expect(styleOf(element).get("width")).toBe("30px");
  });

  it("preserves global easing behavior when no property overrides are provided", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, {
      duration: 100,
      easing: (progress) => progress * progress,
    });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.25");
  });

  it("applies property-specific delays and durations on the shared animation timeline", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, {
      opacity: [0, 1],
      width: ["0px", "100px"],
    }, {
      duration: 100,
      propertyDelay: { width: 50 },
      propertyDuration: { width: 200 },
      onComplete,
    });

    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
    expect(styleOf(element).get("width")).toBe("0px");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("width")).toBe("25px");
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(250);

    expect(styleOf(element).get("width")).toBe("100px");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("combines property timing with repeat and yoyo", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, {
      duration: 100,
      propertyDelay: { opacity: 20 },
      propertyDuration: { opacity: 80 },
      repeat: 1,
      yoyo: true,
      onComplete,
    });

    flushFrame(0);
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
    flushFrame(150);
    expect(styleOf(element).get("opacity")).toBe("0.375");
    flushFrame(200);
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("rejects invalid per-property timing values", () => {
    const element = makeElement();
    expect(() => animate(element, { opacity: [0, 1] }, { propertyDelay: { opacity: -1 } })).toThrow(RangeError);
    expect(() => animate(element, { opacity: [0, 1] }, { propertyDuration: { opacity: Number.NaN } })).toThrow(
      RangeError,
    );
    expect(frames.size).toBe(0);
  });
});

describe("animate: interpolation edge cases", () => {
  function valueAtHalf(from: string | number, to: string | number): string | undefined {
    const element = makeElement();
    animate(element, { prop: [from, to] }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    return styleOf(element).get("prop");
  }

  it("interpolates translate3d with negative numbers", () => {
    expect(valueAtHalf("translate3d(0px, 10px, -5px)", "translate3d(10px, 20px, 5px)")).toBe(
      "translate3d(5px, 15px, 0px)",
    );
  });

  it("interpolates rgba with decimals", () => {
    expect(valueAtHalf("rgba(0, 0, 0, 0)", "rgba(100, 200, 50, 1)")).toBe("rgba(50, 100, 25, 0.5)");
    expect(valueAtHalf("rgba(0,0,0,.2)", "rgba(100,0,0,1)")).toBe("rgba(50,0,0,0.6)");
  });

  it("interpolates hex and rgba colors while retaining alpha", () => {
    expect(valueAtHalf("#000", "#fff")).toBe("rgb(127.5, 127.5, 127.5)");
    expect(valueAtHalf("#123456", "#abcdef")).toBe("rgb(94.5, 128.5, 162.5)");
    expect(valueAtHalf("rgba(0, 0, 0, 0)", "#ffffff")).toBe("rgba(127.5, 127.5, 127.5, 0.5)");
  });

  it("interpolates colors across multi-keyframe animations", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { color: ["#000000", "rgb(100, 100, 100)", "rgba(0, 0, 0, 0.5)"] }, {
      duration: 100,
      onComplete,
    });

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("color")).toBe("rgb(50, 50, 50)");
    flushFrame(50);
    expect(styleOf(element).get("color")).toBe("rgb(100, 100, 100)");
    flushFrame(75);
    expect(styleOf(element).get("color")).toBe("rgba(50, 50, 50, 0.75)");
    expect(onComplete).not.toHaveBeenCalled();
    flushFrame(100);

    expect(styleOf(element).get("color")).toBe("rgba(0, 0, 0, 0.5)");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("keeps invalid or incompatible color values discrete without generating NaN", () => {
    expect(valueAtHalf("#xyz", "#ffffff")).toBe("#xyz");
    expect(valueAtHalf("rgb(invalid, 0, 0)", "rgb(100, 0, 0)")).toBe("rgb(invalid, 0, 0)");
    expect(valueAtHalf("rgba(0, 0, 0, 0)", "blue")).toBe("rgba(0, 0, 0, 0)");
  });

  it("interpolates percentages and negatives", () => {
    expect(valueAtHalf("10%", "-10%")).toBe("0%");
    expect(valueAtHalf(-4, 4)).toBe("0");
  });

  it("interpolates calc() operands but not the operators", () => {
    expect(valueAtHalf("calc(10px - 5px)", "calc(20px - 5px)")).toBe("calc(15px - 5px)");
  });

  it("interpolates exponent notation numerically", () => {
    expect(valueAtHalf("1e3px", "2e3px")).toBe("1500px");
  });

  it("does not interpolate digits inside identifiers or custom property names", () => {
    expect(valueAtHalf("var(--gap-1)", "var(--gap-2)")).toBe("var(--gap-1)");
    expect(valueAtHalf("steps(4)", "steps(8)")).toBe("steps(6)");
    expect(valueAtHalf("var(--a)", "var(--b)")).toBe("var(--a)");
  });

  it("switches predictably on unit or structure mismatch", () => {
    expect(valueAtHalf("0", "10px")).toBe("0");
    expect(valueAtHalf("10px", "50%")).toBe("10px");
    expect(valueAtHalf("rgb(0,0,0)", "red")).toBe("rgb(0,0,0)");
    expect(valueAtHalf("translateY(0px)", "translateX(10px)")).toBe("translateY(0px)");
  });

  it("interpolates common CSS units while preserving each unit", () => {
    expect(valueAtHalf("10px", "20px")).toBe("15px");
    expect(valueAtHalf("10%", "30%")).toBe("20%");
    expect(valueAtHalf("10em", "30em")).toBe("20em");
    expect(valueAtHalf("1rem", "3rem")).toBe("2rem");
    expect(valueAtHalf("10vw", "30vw")).toBe("20vw");
    expect(valueAtHalf("10vh", "30vh")).toBe("20vh");
    expect(valueAtHalf(10, 30)).toBe("20");
    expect(valueAtHalf("-90deg", "90deg")).toBe("0deg");
    expect(valueAtHalf("translate(10px, 2rem)", "translate(30px, 6rem)")).toBe(
      "translate(20px, 4rem)",
    );
  });

  it("preserves compatible units and unitless values across multi-keyframes", () => {
    const element = makeElement();
    animate(element, {
      width: ["10px", "20px", "40px"],
      opacity: [0, 0.5, 1],
    }, { duration: 100 });

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(element).get("width")).toBe("15px");
    expect(styleOf(element).get("opacity")).toBe("0.25");
    flushFrame(50);
    expect(styleOf(element).get("width")).toBe("20px");
    expect(styleOf(element).get("opacity")).toBe("0.5");
    flushFrame(75);
    expect(styleOf(element).get("width")).toBe("30px");
    expect(styleOf(element).get("opacity")).toBe("0.75");
    flushFrame(100);
    expect(styleOf(element).get("width")).toBe("40px");
    expect(styleOf(element).get("opacity")).toBe("1");
  });

  it("keeps mismatched units discrete instead of producing invalid CSS", () => {
    expect(valueAtHalf("10px", "50%")).toBe("10px");
    expect(valueAtHalf("10em", "20rem")).toBe("10em");
    expect(valueAtHalf(0, "10px")).toBe("0");
  });

  it("interpolates compatible rgb and rgba values with different formatting", () => {
    expect(valueAtHalf("rgb(0,0,0)", "rgb(100, 200, 50)")).toBe("rgb(50, 100, 25)");
    expect(valueAtHalf("rgb(0, 0, 0)", "rgba(100, 50, 25, 50%)")).toBe(
      "rgba(50, 25, 12.5, 0.75)",
    );
    expect(valueAtHalf("rgba(0,0,0,.2)", "rgba(100, 0, 0, 1)")).toBe(
      "rgba(50, 0, 0, 0.6)",
    );
    expect(valueAtHalf("rgb(0%, 0%, 0%)", "rgb(100%, 50%, 25%)")).toBe(
      "rgb(50%, 25%, 12.5%)",
    );
  });

  it("keeps malformed or overflowing numeric values discrete", () => {
    expect(valueAtHalf("1e999px", "2e999px")).toBe("1e999px");
    expect(valueAtHalf("1e308px", "1e308px")).toBe("1e+308px");
    expect(valueAtHalf("rgb(invalid, 0, 0)", "rgb(100, 0, 0)")).toBe("rgb(invalid, 0, 0)");
  });

  it("writes the exact from string on the first frame (no reformatting)", () => {
    const element = makeElement();
    animate(element, { prop: ["scale(.5)", "scale(1.5)"] }, { duration: 100 });
    flushFrame(0);
    expect(styleOf(element).get("prop")).toBe("scale(.5)");
  });

  it("skips writes when easing yields a non-finite value", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100, easing: () => Number.NaN });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
  });

  it("rejects non-finite numeric property values", () => {
    const element = makeElement();
    expect(() => animate(element, { opacity: [Number.NaN, 1] })).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0, Number.POSITIVE_INFINITY] })).toThrow(TypeError);
    expect(frames.size).toBe(0);
  });
});

describe("animate: css property names", () => {
  it("maps camelCase, vendor prefixes and keeps kebab-case and custom properties", () => {
    const element = makeElement();
    animate(
      element,
      {
        backgroundColor: ["red", "blue"],
        "border-top-width": [0, 1],
        WebkitFilter: [0, 1],
        msTransform: [0, 1],
        "--Brand-Size": [0, 1],
      },
      { duration: 100 },
    );
    const names = styleOf(element).setProperty.mock.calls.map(([name]) => name);
    expect(names).toEqual([
      "background-color",
      "border-top-width",
      "-webkit-filter",
      "-ms-transform",
      "--Brand-Size",
    ]);
  });
});

describe("animate: lifecycle", () => {
  it("cancel before the first frame leaves from values and fires nothing", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { duration: 100, onComplete }).cancel();
    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("0");
    expect(onComplete).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("cancel after completion is a safe no-op that keeps final values", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    const controls = animate(element, { opacity: [0, 1] }, { duration: 10, onComplete });
    flushFrame(0);
    flushFrame(10);
    controls.cancel();
    controls.cancel();
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("zero duration writes final values on the first frame, once", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { duration: 0, onComplete });
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(0);
    expect(styleOf(element).get("opacity")).toBe("1");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it("zero duration with delay waits for the delay", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 0, delay: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0");
    flushFrame(100);
    expect(styleOf(element).get("opacity")).toBe("1");
  });
});

describe("animate: targets", () => {
  it("animates SVG-only selector matches", () => {
    const element = makeSVGElement();
    selectorResults[".svg"] = [element];
    const controls = animate(".svg", { opacity: [0, 1] });
    expect(frames.size).toBe(1);
    flushFrame(0);
    flushFrame(1000);
    expect(element.getAttribute("opacity")).toBe("1");
    controls.cancel();
  });

  it("does not touch browser globals at import time", async () => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.stubGlobal("HTMLElement", undefined);
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("matchMedia", undefined);
    await expect(import("../src/core/animate")).resolves.toBeDefined();
  });

  it("rejects an element when HTMLElement is unavailable instead of crashing", () => {
    vi.stubGlobal("HTMLElement", undefined);
    expect(() => animate(makeElement(), { opacity: [0, 1] })).toThrow(TypeError);
  });
});

describe("animate: multiple elements", () => {
  it("animates every HTMLElement matching a selector with one frame loop", () => {
    const a = makeElement();
    const svg = makeSVGElement();
    const b = makeElement();
    selectorResults[".card"] = [a, svg, b];

    animate(".card", { opacity: [0, 1] }, { duration: 100 });
    expect(frames.size).toBe(1);

    flushFrame(0);
    flushFrame(25);
    expect(styleOf(a).get("opacity")).toBe("0.25");
    expect(styleOf(b).get("opacity")).toBe("0.25");
    expect(svg.getAttribute("opacity")).toBe("0.25");
    expect(styleOf(a).setProperty).toHaveBeenCalledTimes(styleOf(b).setProperty.mock.calls.length);
  });

  it("calls onComplete once for the whole group", () => {
    selectorResults[".card"] = [makeElement(), makeElement()];
    const onComplete = vi.fn();
    animate(".card", { opacity: [0, 1] }, { duration: 10, onComplete });
    flushFrame(0);
    flushFrame(10);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("animate: cancellation", () => {
  it("stops updates and completion for all elements, keeping current values", () => {
    const a = makeElement();
    const b = makeElement();
    selectorResults[".card"] = [a, b];
    const onComplete = vi.fn();
    const controls = animate(".card", { opacity: [0, 1] }, { duration: 100, onComplete });

    flushFrame(0);
    flushFrame(50);
    controls.cancel();
    flushFrame(100);

    expect(styleOf(a).get("opacity")).toBe("0.5");
    expect(styleOf(b).get("opacity")).toBe("0.5");
    expect(onComplete).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});

describe("animate: invalid and missing targets", () => {
  it("throws SyntaxError with the selector for an invalid selector", () => {
    expect(() => animate("!!bad", { opacity: [0, 1] })).toThrow(SyntaxError);
    expect(() => animate("!!bad", { opacity: [0, 1] })).toThrow('Invalid CSS selector "!!bad"');
  });

  it("returns safe no-op controls when nothing matches", () => {
    const onComplete = vi.fn();
    const controls = animate(".missing", { opacity: [0, 1] }, { onComplete });
    expect(frames.size).toBe(0);
    expect(() => controls.cancel()).not.toThrow();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("still validates duration when nothing matches", () => {
    expect(() => animate(".missing", { opacity: [0, 1] }, { duration: -1 })).toThrow(RangeError);
  });

  it("rejects non-element targets", () => {
    expect(() => animate({} as unknown as HTMLElement, { opacity: [0, 1] })).toThrow(TypeError);
    expect(() => animate(null as unknown as HTMLElement, { opacity: [0, 1] })).toThrow(TypeError);
  });

  it("throws when a selector is used without a document", () => {
    vi.stubGlobal("document", undefined);
    expect(() => animate(".card", { opacity: [0, 1] })).toThrow("document is not available");
  });

  it("rejects invalid properties without touching the element", () => {
    const element = makeElement();
    expect(() => animate(element, {})).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0] as never })).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0, Number.NaN] })).toThrow(TypeError);
    expect(() => animate(element, { opacity: [0, ""] })).toThrow(TypeError);
    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
  });

  it("propagates engine RangeError without applying styles", () => {
    const element = makeElement();
    expect(() => animate(element, { opacity: [0, 1] }, { duration: -5 })).toThrow(RangeError);
    expect(() => animate(element, { opacity: [0, 1] }, { delay: Number.NaN })).toThrow(RangeError);
    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});

describe("animate: reduced motion", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("jumps to final values on the next frame, ignoring duration and delay", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(
      element,
      { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
      { duration: 600, delay: 500, easing: () => 0.5, onComplete },
    );

    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
    flushFrame(0);

    expect(styleOf(element).get("opacity")).toBe("1");
    expect(styleOf(element).get("transform")).toBe("translateY(0px)");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("can be cancelled before it applies", () => {
    const element = makeElement();
    const onComplete = vi.fn();
    animate(element, { opacity: [0, 1] }, { onComplete }).cancel();
    flushFrame(0);
    expect(styleOf(element).setProperty).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("animates normally when respectReducedMotion is false", () => {
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100, respectReducedMotion: false });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
  });

  it("animates normally when matchMedia is unavailable", () => {
    reducedMotion = false;
    vi.stubGlobal("matchMedia", undefined);
    const element = makeElement();
    animate(element, { opacity: [0, 1] }, { duration: 100 });
    flushFrame(0);
    flushFrame(50);
    expect(styleOf(element).get("opacity")).toBe("0.5");
  });
});
