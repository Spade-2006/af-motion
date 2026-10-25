import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { spotlightBackground } from "../src/backgrounds/spotlight";
import type { SpotlightBackgroundControls, SpotlightBackgroundOptions } from "../src/backgrounds/spotlight";

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
  style = new FakeStyle();
  listeners = new Map<string, Set<(event: PointerEvent) => void>>();
  rect = { left: 10, top: 20, width: 200, height: 100 };
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
  addEventListener(type: string, listener: (event: PointerEvent) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }
  removeEventListener(type: string, listener: (event: PointerEvent) => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  getBoundingClientRect(): DOMRect {
    return this.rect as DOMRect;
  }
  emit(type: string, clientX = 0, clientY = 0): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ clientX, clientY } as PointerEvent);
    }
  }
}

class FakeHTMLElement extends FakeNode {}
class FakeDivElement extends FakeNode {}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function layerOf(element: FakeHTMLElement): FakeDivElement {
  return element.firstChild as FakeDivElement;
}

function glowOf(element: FakeHTMLElement): FakeDivElement {
  return layerOf(element).firstChild as FakeDivElement;
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
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
    createElement: (name: string) => {
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

describe("spotlightBackground()", () => {
  it("renders a configured radial glow and follows pointer coordinates within target bounds", () => {
    const element = makeElement();
    const content = new FakeHTMLElement();
    element.appendChild(content);
    const controls = spotlightBackground(asHTMLElement(element), {
      color: "#7c3aed",
      radius: 300,
      intensity: 0.35,
      smoothing: 0.15,
    });

    const layer = layerOf(element);
    const glow = glowOf(element);
    expect(layer.attributes.get("aria-hidden")).toBe("true");
    expect(layer.style.getPropertyValue("position")).toBe("absolute");
    expect(layer.style.getPropertyValue("z-index")).toBe("-1");
    expect(layer.style.getPropertyValue("pointer-events")).toBe("none");
    expect(glow.style.getPropertyValue("width")).toContain("600px");
    expect(glow.style.getPropertyValue("height")).toContain("600px");
    expect(glow.style.getPropertyValue("background")).toContain("#7c3aed");
    expect(glow.style.getPropertyValue("opacity")).toContain("0.35");
    expect(glow.style.getPropertyValue("transition")).toContain("left 0.15s");
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    expect(element.children[1]).toBe(content);
    expect(element.style.getPropertyValue("position")).toBe("relative");

    element.emit("pointermove", 85, 61);
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("75px");
    expect(glow.style.getPropertyValue("--af-motion-spotlight-y")).toBe("41px");
    element.emit("pointermove", 500, 500);
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("200px");
    expect(glow.style.getPropertyValue("--af-motion-spotlight-y")).toBe("100px");
    element.emit("pointerleave");
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    expect(glow.style.getPropertyValue("--af-motion-spotlight-y")).toBe("50%");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(element.style.getPropertyValue("isolation")).toBe("");
  });

  it("supports multiple selector targets with independent pointer positions", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, new (class {})(), second];
    const controls = spotlightBackground(".hero", { color: "cyan", radius: 100 });

    first.emit("pointermove", 60, 40);
    second.emit("pointermove", 110, 70);
    expect(glowOf(first).style.getPropertyValue("--af-motion-spotlight-x")).toBe("50px");
    expect(glowOf(second).style.getPropertyValue("--af-motion-spotlight-x")).toBe("100px");
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("disables pointer-following with reduced motion and restores it when allowed", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = spotlightBackground(asHTMLElement(element));
    const glow = glowOf(element);
    element.emit("pointermove", 40, 40);
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    element.emit("pointermove", 40, 40);
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("30px");

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    element.emit("pointermove", 120, 80);
    expect(glow.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("supports overlapping instances and idempotent cleanup with exact inline-style restoration", () => {
    const element = makeElement();
    element.style.setProperty("position", "absolute", "important");
    const first = spotlightBackground(asHTMLElement(element));
    const second = spotlightBackground(asHTMLElement(element));
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

  it("validates targets and options before modifying the DOM", () => {
    const missing = spotlightBackground(".missing");
    expect(() => missing.destroy()).not.toThrow();
    expect(() => spotlightBackground("!!bad")).toThrow(SyntaxError);

    const element = makeElement();
    expect(() => spotlightBackground(asHTMLElement(element), { color: "" })).toThrow(TypeError);
    expect(() => spotlightBackground(asHTMLElement(element), { radius: 0 })).toThrow(RangeError);
    expect(() => spotlightBackground(asHTMLElement(element), { intensity: -0.1 })).toThrow(RangeError);
    expect(() => spotlightBackground(asHTMLElement(element), { intensity: 1.1 })).toThrow(RangeError);
    expect(() => spotlightBackground(asHTMLElement(element), { smoothing: -0.1 })).toThrow(RangeError);
    expect(() => spotlightBackground(asHTMLElement(element), { smoothing: 1.1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
  });

  it("exports its public option and control types", () => {
    expectTypeOf<SpotlightBackgroundOptions["radius"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<SpotlightBackgroundControls["destroy"]>().toBeFunction();
  });
});
