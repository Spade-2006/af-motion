import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drawSVG } from "../src/effects/draw-svg";

class FakeStyle {
  values = new Map<string, string>();
  setProperty = vi.fn((name: string, value: string) => this.values.set(name, value));
  removeProperty = vi.fn((name: string) => this.values.delete(name));
  getPropertyValue = vi.fn((name: string) => this.values.get(name) ?? "");
}

class FakeSVGElement {
  tagName = "svg";
  style = new FakeStyle();
  attributes = new Map<string, string>();
  children: FakePath[] = [];
  setAttribute = vi.fn((name: string, value: string) => this.attributes.set(name, value));
  getAttribute = vi.fn((name: string) => this.attributes.get(name) ?? null);
  removeAttribute = vi.fn((name: string) => this.attributes.delete(name));
  querySelectorAll = vi.fn((selector: string) => selector === "path" ? this.children : []);
}

class FakePath extends FakeSVGElement {
  tagName = "path";

  constructor(private readonly length: number) {
    super();
  }

  getTotalLength(): number {
    return this.length;
  }
}

let frames: Map<number, FrameRequestCallback>;
let nextId: number;
let clockTime: number;
let selectorResults: Record<string, unknown[]>;

function flushFrame(time: number): void {
  clockTime = time;
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(time);
}

function installPath(path: FakePath): void {
  vi.stubGlobal("SVGElement", FakeSVGElement);
  vi.stubGlobal("SVGPathElement", FakePath);
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => selectorResults[selector] ?? [],
  });
  void path;
}

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  clockTime = 0;
  selectorResults = {};
  vi.stubGlobal("performance", { now: () => clockTime } as Performance);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("drawSVG", () => {
  it("draws a path from its length to zero and completes", () => {
    const path = new FakePath(100);
    path.attributes.set("stroke-dasharray", "original");
    path.attributes.set("stroke-dashoffset", "original-offset");
    path.style.values.set("stroke-dasharray", "style-original");
    installPath(path);
    const onComplete = vi.fn();
    const controls = drawSVG(path as unknown as SVGElement, { duration: 100, onComplete });

    expect(path.getAttribute("stroke-dasharray")).toBe("100");
    expect(path.getAttribute("stroke-dashoffset")).toBe("100");
    flushFrame(0);
    flushFrame(50);
    expect(path.getAttribute("stroke-dashoffset")).toBe("50");
    flushFrame(100);

    expect(path.getAttribute("stroke-dashoffset")).toBe("0");
    expect(onComplete).toHaveBeenCalledOnce();
    controls.destroy();
    expect(path.getAttribute("stroke-dasharray")).toBe("original");
    expect(path.getAttribute("stroke-dashoffset")).toBe("original-offset");
    expect(path.style.getPropertyValue("stroke-dasharray")).toBe("style-original");
  });

  it("supports reverse playback and cancellation without restoring until destroy", () => {
    const path = new FakePath(80);
    installPath(path);
    const onCancel = vi.fn();
    const controls = drawSVG(path as unknown as SVGElement, {
      duration: 100,
      reverse: true,
      onCancel,
    });

    expect(path.getAttribute("stroke-dashoffset")).toBe("0");
    flushFrame(0);
    flushFrame(50);
    expect(path.getAttribute("stroke-dashoffset")).toBe("40");
    controls.cancel();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(path.getAttribute("stroke-dashoffset")).toBe("40");
    controls.destroy();
    controls.destroy();
    expect(path.getAttribute("stroke-dashoffset")).toBeNull();
    expect(frames.size).toBe(0);
  });

  it("stagger-draws all paths in an SVG container", () => {
    const first = new FakePath(100);
    const second = new FakePath(200);
    const svg = new FakeSVGElement();
    svg.children = [first, second];
    installPath(first);
    const onComplete = vi.fn();
    const controls = drawSVG(svg as unknown as SVGElement, {
      duration: 100,
      stagger: 50,
      onComplete,
    });
    vi.stubGlobal("document", { querySelectorAll: () => [] });

    flushFrame(0);
    flushFrame(50);
    expect(first.getAttribute("stroke-dashoffset")).toBe("50");
    expect(second.getAttribute("stroke-dashoffset")).toBe("200");
    flushFrame(100);
    flushFrame(150);

    expect(second.getAttribute("stroke-dashoffset")).toBe("0");
    expect(onComplete).toHaveBeenCalledOnce();
    controls.destroy();
  });

  it("supports selectors, reduced motion, and invalid targets", () => {
    const path = new FakePath(40);
    selectorResults[".line"] = [path];
    installPath(path);
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const controls = drawSVG(".line", { duration: 100 });
    flushFrame(0);
    expect(path.getAttribute("stroke-dashoffset")).toBe("0");
    controls.destroy();

    expect(() => drawSVG({} as SVGElement)).toThrow(TypeError);
  });
});
