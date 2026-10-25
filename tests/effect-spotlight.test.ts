import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { spotlight } from "../src/effects/spotlight";
import type { SpotlightControls, SpotlightOptions } from "../src/effects/spotlight";

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
    if (node.parentElement) node.parentElement.removeChild(node);
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
  emit(type: string, clientX = 0, clientY = 0, pointerType = "mouse"): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ clientX, clientY, pointerType } as PointerEvent);
    }
  }
}

class FakeHTMLElement extends FakeNode {}
class FakeDivElement extends FakeNode {}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let preferenceListeners: Set<(event: { matches: boolean }) => void>;

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function overlayOf(element: FakeHTMLElement): FakeDivElement {
  return element.firstChild as FakeDivElement;
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

describe("spotlight()", () => {
  it("applies configured styles and follows pointer coordinates within target bounds", () => {
    const element = makeElement();
    const content = new FakeHTMLElement();
    element.appendChild(content);
    element.style.setProperty("position", "absolute", "important");
    const controls = spotlight(asHTMLElement(element), {
      color: "rgba(255,255,255,0.18)",
      radius: 180,
      intensity: 0.6,
      smoothing: 0.12,
    });
    const overlay = overlayOf(element);
    expect(overlay.attributes.get("aria-hidden")).toBe("true");
    expect(overlay.style.getPropertyValue("position")).toBe("absolute");
    expect(overlay.style.getPropertyValue("z-index")).toBe("-1");
    expect(overlay.style.getPropertyValue("pointer-events")).toBe("none");
    expect(overlay.style.getPropertyValue("background")).toContain("circle 180px");
    expect(overlay.style.getPropertyValue("background")).toContain("rgba(255,255,255,0.18)");
    expect(overlay.style.getPropertyValue("opacity")).toBe("0.6");
    expect(overlay.style.getPropertyValue("transition")).toBe("background-position 0.12s ease-out");
    expect(element.children[1]).toBe(content);
    expect(element.style.getPropertyValue("position")).toBe("absolute");

    element.emit("pointermove", 85, 61);
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("75px");
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-y")).toBe("41px");
    element.emit("pointermove", 500, 500);
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("200px");
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-y")).toBe("100px");
    element.emit("pointermove", 90, 80, "touch");
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("200px");
    element.emit("pointerleave");
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-y")).toBe("50%");

    controls.destroy();
    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(element.style.getPropertyValue("position")).toBe("absolute");
    expect(element.style.getPropertyPriority("position")).toBe("important");
    expect(element.style.getPropertyValue("isolation")).toBe("");
    expect(element.listeners.get("pointermove")?.size ?? 0).toBe(0);
    expect(element.listeners.get("pointerleave")?.size ?? 0).toBe(0);
  });

  it("supports multiple selector targets with independent pointer positions", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".card"] = [first, {}, second];
    const controls = spotlight(".card", { radius: 100, smoothing: 0.2 });
    first.emit("pointermove", 60, 40);
    second.emit("pointermove", 110, 70);
    expect(overlayOf(first).style.getPropertyValue("--af-motion-spotlight-x")).toBe("50px");
    expect(overlayOf(second).style.getPropertyValue("--af-motion-spotlight-x")).toBe("100px");
    expect(overlayOf(first).style.getPropertyValue("background")).toContain("100px");
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("disables tracking with reduced motion, uses a subtle static glow, and restores tracking later", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = spotlight(asHTMLElement(element), { intensity: 0.8 });
    const overlay = overlayOf(element);
    expect(element.listeners.get("pointermove")?.size ?? 0).toBe(0);
    expect(overlay.style.getPropertyValue("opacity")).toBe("0.2");
    element.emit("pointermove", 40, 40);
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");

    reducedMotion = false;
    for (const listener of preferenceListeners) listener({ matches: false });
    expect(element.listeners.get("pointermove")?.size).toBe(1);
    element.emit("pointermove", 40, 40);
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("30px");

    reducedMotion = true;
    for (const listener of preferenceListeners) listener({ matches: true });
    expect(overlay.style.getPropertyValue("opacity")).toBe("0.2");
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    element.emit("pointermove", 120, 80);
    expect(overlay.style.getPropertyValue("--af-motion-spotlight-x")).toBe("50%");
    controls.destroy();
    expect(preferenceListeners.size).toBe(0);
  });

  it("supports overlapping instances without premature target-style restoration", () => {
    const element = makeElement();
    const first = spotlight(asHTMLElement(element), { color: "red" });
    const second = spotlight(asHTMLElement(element), { color: "blue" });
    expect(element.children).toHaveLength(2);
    first.destroy();
    expect(element.style.getPropertyValue("position")).toBe("relative");
    expect(element.style.getPropertyValue("isolation")).toBe("isolate");
    second.destroy();
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
    expect(element.style.getPropertyValue("isolation")).toBe("");
  });

  it("validates options and selectors before modifying targets", () => {
    const element = makeElement();
    expect(() => spotlight(asHTMLElement(element), { color: "" })).toThrow(TypeError);
    expect(() => spotlight(asHTMLElement(element), { radius: 0 })).toThrow(RangeError);
    expect(() => spotlight(asHTMLElement(element), { intensity: 1.1 })).toThrow(RangeError);
    expect(() => spotlight(asHTMLElement(element), { smoothing: -0.1 })).toThrow(RangeError);
    expect(() => spotlight(asHTMLElement(element), { smoothing: 1.1 })).toThrow(RangeError);
    expect(() => spotlight("!!bad")).toThrow(SyntaxError);
    expect(element.children).toHaveLength(0);
    expect(element.style.getPropertyValue("position")).toBe("");
    expectTypeOf<SpotlightOptions["radius"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<SpotlightControls["destroy"]>().toBeFunction();
  });
});
