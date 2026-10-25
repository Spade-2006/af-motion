import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { waveBackground } from "../src/backgrounds/wave";
import type { WaveBackgroundControls, WaveBackgroundOptions } from "../src/backgrounds/wave";

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
    if (priority) this.priorities.set(name, priority);
    else this.priorities.delete(name);
  }
  removeProperty(name: string): void {
    this.values.delete(name);
    this.priorities.delete(name);
  }
}

class FakeNode {
  parentElement: FakeNode | null = null;
  children: FakeNode[] = [];
  attributes = new Map<string, string>();
  textContent = "";
  style = new FakeStyle();

  get firstChild(): FakeNode | null {
    return this.children[0] ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  appendChild<T extends FakeNode>(node: T): T {
    return this.insertBefore(node, null);
  }
  insertBefore<T extends FakeNode>(node: T, before: FakeNode | null): T {
    node.parentElement = this;
    const index = before === null ? -1 : this.children.indexOf(before);
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    return node;
  }
  removeChild<T extends FakeNode>(node: T): T {
    this.children.splice(this.children.indexOf(node), 1);
    node.parentElement = null;
    return node;
  }
}

class FakeHTMLElement extends FakeNode {}
class FakeSVGElement extends FakeNode {}
class FakeStyleElement extends FakeNode {}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let documentHead: FakeNode;

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function svgOf(element: FakeHTMLElement): FakeSVGElement {
  return element.firstChild as FakeSVGElement;
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
  documentHead = new FakeNode();

  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("matchMedia", () => ({
    matches: reducedMotion,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => {
      motionListeners.delete(listener);
    },
  }));
  vi.stubGlobal("getComputedStyle", (element: FakeHTMLElement) => ({
    position: element.style.getPropertyValue("position") || "static",
    isolation: element.style.getPropertyValue("isolation") || "auto",
  }));
  vi.stubGlobal("document", {
    head: documentHead,
    documentElement: documentHead,
    createElement: (name: string) => {
      if (name === "style") return new FakeStyleElement();
      throw new Error(`Unexpected HTML element: ${name}`);
    },
    createElementNS: (_namespace: string, name: string) => {
      if (name === "svg" || name === "path") return new FakeSVGElement();
      throw new Error(`Unexpected SVG element: ${name}`);
    },
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("waveBackground()", () => {
  it("renders responsive SVG waves with configured colors and animation", () => {
    const element = makeElement();
    const content = new FakeHTMLElement();
    element.appendChild(content);
    const controls = waveBackground(asHTMLElement(element), {
      colors: ["#7c3aed", "#06b6d4"],
      amplitude: 30,
      frequency: 2,
      speed: 8,
      opacity: 0.6,
    });

    const svg = svgOf(element);
    expect(svg.attributes.get("viewBox")).toBe("0 0 1000 300");
    expect(svg.attributes.get("preserveAspectRatio")).toBe("none");
    expect(svg.attributes.get("aria-hidden")).toBe("true");
    expect(svg.style.getPropertyValue("position")).toBe("absolute");
    expect(svg.style.getPropertyValue("pointer-events")).toBe("none");
    expect(svg.style.getPropertyValue("opacity")).toBe("0.6");
    expect(svg.children).toHaveLength(2);
    expect(svg.children.map((path) => path.attributes.get("fill"))).toEqual(["#7c3aed", "#06b6d4"]);
    expect(svg.children[0]?.attributes.get("d")).toContain("180.00");
    expect(svg.children[0]?.style.getPropertyValue("animation")).toContain("8s ease-in-out 0s infinite");
    expect(svg.children[1]?.style.getPropertyValue("animation")).toContain("-4s infinite");
    expect(svg.children[0]?.style.getPropertyValue("transform-origin")).toBe("center");
    expect(element.children[1]).toBe(content);
    expect(element.style.getPropertyValue("position")).toBe("relative");
    expect(documentHead.children[0]?.textContent).toContain("@keyframes af-motion-wave-");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(element.style.getPropertyValue("isolation")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("supports multiple selector targets and static speed", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, new (class {})(), second];
    const controls = waveBackground(".hero", { colors: ["tomato"], speed: 0 });

    expect(svgOf(first).children).toHaveLength(1);
    expect(svgOf(second).children).toHaveLength(1);
    expect(svgOf(first).children[0]?.style.getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("disables animation for reduced motion and toggles when preference changes", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = waveBackground(asHTMLElement(element), { speed: 3 });
    const path = svgOf(element).children[0]!;
    expect(path.style.getPropertyValue("animation")).toBe("");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(path.style.getPropertyValue("animation")).toMatch(/3s ease-in-out -?0s infinite/);
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(path.style.getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("supports overlapping instances and exact target-style restoration", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    const first = waveBackground(asHTMLElement(element), { speed: 0 });
    const second = waveBackground(asHTMLElement(element), { speed: 0 });
    expect(element.children).toHaveLength(2);
    first.destroy();
    first.destroy();
    expect(element.children).toHaveLength(1);
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");
    second.destroy();
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyPriority("position")).toBe("important");
    expect(element.style.getPropertyValue("isolation")).toBe("");
  });

  it("returns inert controls for empty matches and rejects invalid input before DOM changes", () => {
    const missing = waveBackground(".missing");
    expect(() => missing.destroy()).not.toThrow();
    expect(() => waveBackground("!!bad")).toThrow(SyntaxError);

    const element = makeElement();
    expect(() => waveBackground(asHTMLElement(element), { colors: [] })).toThrow(TypeError);
    expect(() => waveBackground(asHTMLElement(element), { colors: [""] })).toThrow(TypeError);
    expect(() => waveBackground(asHTMLElement(element), { amplitude: -1 })).toThrow(RangeError);
    expect(() => waveBackground(asHTMLElement(element), { frequency: 0 })).toThrow(RangeError);
    expect(() => waveBackground(asHTMLElement(element), { frequency: 101 })).toThrow(RangeError);
    expect(() => waveBackground(asHTMLElement(element), { speed: -1 })).toThrow(RangeError);
    expect(() => waveBackground(asHTMLElement(element), { opacity: 1.1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("exports the public option and controls types", () => {
    expectTypeOf<WaveBackgroundOptions["frequency"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<WaveBackgroundControls["destroy"]>().toBeFunction();
  });
});
