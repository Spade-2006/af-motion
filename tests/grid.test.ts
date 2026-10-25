import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { gridBackground } from "../src/backgrounds/grid";
import type { GridBackgroundControls, GridBackgroundOptions } from "../src/backgrounds/grid";

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
class FakeDivElement extends FakeHTMLElement {}
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

function layerOf(element: FakeHTMLElement): FakeDivElement {
  return element.firstChild as FakeDivElement;
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
      if (name === "div") return new FakeDivElement();
      throw new Error(`Unexpected element: ${name}`);
    },
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("gridBackground()", () => {
  it("renders the configured responsive grid and CSS animation", () => {
    const element = makeElement();
    const content = new FakeHTMLElement();
    element.appendChild(content);
    const controls = gridBackground(asHTMLElement(element), {
      color: "#7c3aed",
      cellSize: 40,
      lineWidth: 1,
      opacity: 0.25,
      speed: 8,
    });

    const layer = layerOf(element);
    expect(layer.attributes.get("aria-hidden")).toBe("true");
    expect(layer.style.getPropertyValue("position")).toBe("absolute");
    expect(layer.style.getPropertyValue("inset")).toBe("0");
    expect(layer.style.getPropertyValue("z-index")).toBe("-1");
    expect(layer.style.getPropertyValue("pointer-events")).toBe("none");
    expect(layer.style.getPropertyValue("background-image")).toBe(
      "linear-gradient(to right, #7c3aed 0, #7c3aed 1px, transparent 1px), linear-gradient(to bottom, #7c3aed 0, #7c3aed 1px, transparent 1px)",
    );
    expect(layer.style.getPropertyValue("background-size")).toBe("40px 40px");
    expect(layer.style.getPropertyValue("opacity")).toBe("0.25");
    expect(layer.style.getPropertyValue("animation")).toMatch(/af-motion-grid-\d+ 8s ease-in-out infinite/);
    expect(documentHead.children[0]?.textContent).toContain("@keyframes af-motion-grid-");
    expect(element.children[1]).toBe(content);
    expect(element.style.getPropertyValue("position")).toBe("relative");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(element.style.getPropertyValue("isolation")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("supports multiple selector targets and a static speed", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, new (class {})(), second];
    const controls = gridBackground(".hero", { cellSize: 32, lineWidth: 2, speed: 0 });

    expect(layerOf(first).style.getPropertyValue("background-size")).toBe("32px 32px");
    expect(layerOf(first).style.getPropertyValue("background-image")).toContain("#7c3aed 2px");
    expect(layerOf(first).style.getPropertyValue("animation")).toBe("");
    expect(layerOf(second).style.getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("disables and restores animation when reduced-motion preference changes", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = gridBackground(asHTMLElement(element), { speed: 4 });
    const layer = layerOf(element);
    expect(layer.style.getPropertyValue("animation")).toBe("");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(layer.style.getPropertyValue("animation")).toContain("4s ease-in-out infinite");
    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(layer.style.getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("supports overlapping instances and exact target-style restoration", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    const first = gridBackground(asHTMLElement(element), { speed: 0 });
    const second = gridBackground(asHTMLElement(element), { speed: 0 });
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

  it("validates selectors and options before changing targets", () => {
    const missing = gridBackground(".missing");
    expect(() => missing.destroy()).not.toThrow();
    expect(() => gridBackground("!!bad")).toThrow(SyntaxError);

    const element = makeElement();
    expect(() => gridBackground(asHTMLElement(element), { color: "" })).toThrow(TypeError);
    expect(() => gridBackground(asHTMLElement(element), { cellSize: 0 })).toThrow(RangeError);
    expect(() => gridBackground(asHTMLElement(element), { lineWidth: 0 })).toThrow(RangeError);
    expect(() => gridBackground(asHTMLElement(element), { lineWidth: 41, cellSize: 40 })).toThrow(RangeError);
    expect(() => gridBackground(asHTMLElement(element), { opacity: 1.1 })).toThrow(RangeError);
    expect(() => gridBackground(asHTMLElement(element), { speed: -1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("exports the option and control types", () => {
    expectTypeOf<GridBackgroundOptions["cellSize"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<GridBackgroundControls["destroy"]>().toBeFunction();
  });
});
