import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { morphSVG } from "../src/effects/morph-svg";

class FakeSVGElement {
  tagName = "path";
  private data: string | null;

  constructor(data: string) {
    this.data = data;
  }

  getAttribute(name: string): string | null {
    return name === "d" ? this.data : null;
  }

  setAttribute(name: string, value: string): void {
    if (name === "d") this.data = value;
  }

  querySelectorAll(): FakeSVGElement[] {
    return [];
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let clockTime: number;

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  clockTime = 0;
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("SVGElement", FakeSVGElement);
  vi.stubGlobal("SVGPathElement", FakeSVGElement);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("morphSVG", () => {
  it("interpolates compatible command and number tokens", () => {
    const path = new FakeSVGElement("M0 0 L100 0");
    const onComplete = vi.fn();
    const controls = morphSVG(path as unknown as SVGElement, "M0 0 L100 100", {
      duration: 100,
      onComplete,
    });

    flushFrame(0);
    flushFrame(50);
    expect(path.getAttribute("d")).toBe("M0 0 L100 50");
    flushFrame(100);

    expect(path.getAttribute("d")).toBe("M0 0 L100 100");
    expect(onComplete).toHaveBeenCalledOnce();
    controls.destroy();
  });

  it("rejects incompatible path structures before scheduling", () => {
    const path = new FakeSVGElement("M0 0 L100 0");

    expect(() => morphSVG(path as unknown as SVGElement, "M0 0 C10 10 20 20 100 100")).toThrow(
      /Incompatible SVG path data/,
    );
    expect(path.getAttribute("d")).toBe("M0 0 L100 0");
    expect(frames.size).toBe(0);
  });

  it("cancels without completing and restores the original path on destroy", () => {
    const path = new FakeSVGElement("M0 0 L100 0");
    const onCancel = vi.fn();
    const onComplete = vi.fn();
    const controls = morphSVG(path as unknown as SVGElement, "M0 0 L100 100", {
      duration: 100,
      onCancel,
      onComplete,
    });

    flushFrame(0);
    flushFrame(50);
    controls.cancel();
    controls.cancel();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
    expect(path.getAttribute("d")).toBe("M0 0 L100 50");
    controls.destroy();
    controls.destroy();

    expect(path.getAttribute("d")).toBe("M0 0 L100 0");
    expect(frames.size).toBe(0);
  });

  function runMorph(from: string, to: string, atHalf = true): { path: FakeSVGElement; controls: ReturnType<typeof morphSVG> } {
    const path = new FakeSVGElement(from);
    const controls = morphSVG(path as unknown as SVGElement, to, { duration: 100 });
    flushFrame(0);
    if (atHalf) flushFrame(50);
    return { path, controls };
  }

  it("morphs between relative and absolute equivalents", () => {
    const { path, controls } = runMorph("M0 0 l100 0", "M0 0 L100 100");
    expect(path.getAttribute("d")).toBe("M 0 0 L 100 50");
    flushFrame(100);
    expect(path.getAttribute("d")).toBe("M0 0 L100 100");
    controls.destroy();
  });

  it("normalizes H/V, implicit repeats, and closing commands", () => {
    const { path, controls } = runMorph("M0 0 H10 V10 z", "m0 0 l20 0 0 20 Z");
    expect(path.getAttribute("d")).toBe("M 0 0 L 15 0 L 15 15 Z");
    controls.destroy();
  });

  it("treats extra moveto pairs as implicit lineto and expands S and T", () => {
    const a = runMorph("M0 0 10 10 S20 20 30 30", "M0 0 L10 10 C10 10 20 20 30 30");
    expect(a.path.getAttribute("d")).toBe("M 0 0 L 10 10 C 10 10 20 20 30 30");
    a.controls.destroy();
    const b = runMorph("M0 0 Q10 10 20 0 T40 0", "M0 0 Q10 20 20 0 Q30 -20 40 0");
    expect(b.path.getAttribute("d")).toBe("M 0 0 Q 10 15 20 0 Q 30 -15 40 0");
    b.controls.destroy();
  });

  it("interpolates relative arcs but rejects differing arc flags", () => {
    const { path, controls } = runMorph("M0 0 a10 10 0 0 1 20 0", "M0 0 A20 20 0 0 1 20 0");
    expect(path.getAttribute("d")).toBe("M 0 0 A 15 15 0 0 1 20 0");
    controls.destroy();
    const other = new FakeSVGElement("M0 0 A10 10 0 0 1 20 0");
    expect(() => morphSVG(other as unknown as SVGElement, "M0 0 A10 10 0 1 1 20 0")).toThrow(/Incompatible/);
  });

  it("rejects malformed or structurally different equivalent-looking paths without touching the element", () => {
    const path = new FakeSVGElement("M0 0 l10 10");
    for (const bad of ["M0 0 L10", "M0 0 L10 10 20", "L10 10", "M0 0 Z 5 5", "M0 0 L10 10 L20 20", "M0 0 A1 1 0 2 1 5 5"]) {
      expect(() => morphSVG(path as unknown as SVGElement, bad)).toThrow(TypeError);
    }
    expect(path.getAttribute("d")).toBe("M0 0 l10 10");
    expect(frames.size).toBe(0);
  });

  it("never emits NaN and restores the original relative path on repeated destroy", () => {
    const { path, controls } = runMorph("M0 0 l100 0", "M0 0 L100 100");
    expect(path.getAttribute("d")).not.toMatch(/NaN|Infinity/);
    controls.destroy();
    controls.destroy();
    expect(path.getAttribute("d")).toBe("M0 0 l100 0");
    expect(frames.size).toBe(0);
  });});
