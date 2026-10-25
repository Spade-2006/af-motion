import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gradientBackground } from "../src/backgrounds/gradient";

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
  textContent = "";

  get firstChild(): FakeNode | null {
    return this.children[0] ?? null;
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

class FakeHTMLElement extends FakeNode {
  style = new FakeStyle();
  attributes = new Map<string, string>();
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

class FakeStyleElement extends FakeNode {}
class FakeDivElement extends FakeHTMLElement {}

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

function styleOf(element: FakeHTMLElement): FakeStyle {
  return element.style;
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("gradientBackground()", () => {
  it("renders the configured gradient and animates it with unique CSS keyframes", () => {
    const element = makeElement();
    element.appendChild(new FakeHTMLElement());
    const content = element.firstChild;
    const controls = gradientBackground(asHTMLElement(element), {
      colors: ["#7c3aed", "#06b6d4", "#ec4899"],
      angle: 135,
      speed: 8,
      opacity: 0.8,
    });

    const layer = element.firstChild as FakeDivElement;
    expect(layer).not.toBe(content);
    expect(layer.attributes.get("aria-hidden")).toBe("true");
    expect(styleOf(layer).getPropertyValue("background-image")).toBe(
      "linear-gradient(135deg, #7c3aed, #06b6d4, #ec4899)",
    );
    expect(styleOf(layer).getPropertyValue("background-size")).toBe("200% 200%");
    expect(styleOf(layer).getPropertyValue("opacity")).toBe("0.8");
    expect(styleOf(layer).getPropertyValue("animation")).toMatch(/af-motion-gradient-\d+ 8s ease-in-out infinite/);
    expect(styleOf(layer).getPropertyValue("pointer-events")).toBe("none");
    expect(styleOf(element).getPropertyValue("position")).toBe("relative");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("isolate");
    expect(documentHead.children[0]?.textContent).toContain("@keyframes af-motion-gradient-");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(styleOf(element).getPropertyValue("position")).toBe("");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("resolves multiple HTML elements from a selector", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, new (class {})(), second];
    const controls = gradientBackground(".hero", { speed: 0 });

    expect(first.children).toHaveLength(1);
    expect(second.children).toHaveLength(1);
    expect(styleOf(first.firstChild as FakeDivElement).getPropertyValue("animation")).toBe("");
    expect(styleOf(second.firstChild as FakeDivElement).getPropertyValue("background-size")).toBe("100% 100%");
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("uses a static gradient for reduced motion and restores animation when motion is allowed", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = gradientBackground(asHTMLElement(element), { speed: 5 });
    const layer = element.firstChild as FakeDivElement;
    expect(styleOf(layer).getPropertyValue("animation")).toBe("");
    expect(styleOf(layer).getPropertyValue("background-size")).toBe("100% 100%");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(styleOf(layer).getPropertyValue("animation")).toContain("5s ease-in-out infinite");

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(styleOf(layer).getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("supports overlapping instances and restores original inline styles after the last destroy", () => {
    const element = makeElement();
    styleOf(element).setProperty("position", "absolute", "important");
    const first = gradientBackground(asHTMLElement(element), { speed: 0 });
    const second = gradientBackground(asHTMLElement(element), { speed: 0 });
    expect(element.children).toHaveLength(2);

    first.destroy();
    first.destroy();
    expect(element.children).toHaveLength(1);
    expect(styleOf(element).getPropertyValue("isolation")).toBe("isolate");
    second.destroy();
    expect(element.children).toHaveLength(0);
    expect(styleOf(element).getPropertyValue("position")).toBe("absolute");
    expect(styleOf(element).getPropertyPriority("position")).toBe("important");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("returns inert controls when a selector matches nothing", () => {
    const controls = gradientBackground(".missing");
    expect(documentHead.children).toHaveLength(0);
    expect(() => controls.destroy()).not.toThrow();
  });

  it("rejects invalid selectors and options without changing targets", () => {
    const element = makeElement();
    expect(() => gradientBackground("!!bad")).toThrow(SyntaxError);
    expect(() => gradientBackground(asHTMLElement(element), { colors: [] })).toThrow(TypeError);
    expect(() => gradientBackground(asHTMLElement(element), { colors: ["red", ""] })).toThrow(TypeError);
    expect(() => gradientBackground(asHTMLElement(element), { angle: Number.NaN })).toThrow(RangeError);
    expect(() => gradientBackground(asHTMLElement(element), { speed: -1 })).toThrow(RangeError);
    expect(() => gradientBackground(asHTMLElement(element), { speed: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => gradientBackground(asHTMLElement(element), { opacity: 1.1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(styleOf(element).getPropertyValue("position")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });
});
