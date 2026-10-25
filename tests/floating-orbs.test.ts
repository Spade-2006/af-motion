import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { floatingOrbs } from "../src/backgrounds/floating-orbs";

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
class FakeSpanElement extends FakeHTMLElement {}

let selectorResults: Record<string, unknown[]>;
let reducedMotion: boolean;
let motionListeners: Set<(event: { matches: boolean }) => void>;
let documentHead: FakeNode;
let computedPosition: string;

function makeElement(): FakeHTMLElement {
  return new FakeHTMLElement();
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function styleOf(element: FakeHTMLElement): FakeStyle {
  return element.style;
}

function orbsOf(element: FakeHTMLElement): FakeSpanElement[] {
  const layer = element.firstChild as FakeDivElement;
  return layer.children as FakeSpanElement[];
}

beforeEach(() => {
  selectorResults = {};
  reducedMotion = false;
  motionListeners = new Set();
  documentHead = new FakeNode();
  computedPosition = "static";

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
    position: element.style.getPropertyValue("position") || computedPosition,
    isolation: element.style.getPropertyValue("isolation") || "auto",
  }));
  vi.stubGlobal("document", {
    head: documentHead,
    documentElement: documentHead,
    createElement: (name: string) => {
      if (name === "style") return new FakeStyleElement();
      if (name === "div") return new FakeDivElement();
      if (name === "span") return new FakeSpanElement();
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

describe("floatingOrbs()", () => {
  it("renders configured orbs with staggered CSS keyframe animation", () => {
    const element = makeElement();
    element.appendChild(new FakeHTMLElement());
    const content = element.firstChild;
    const controls = floatingOrbs(asHTMLElement(element), {
      colors: ["#7c3aed", "#06b6d4", "#ec4899"],
      count: 5,
      minSize: 80,
      maxSize: 240,
      blur: 40,
      speed: 12,
      opacity: 0.6,
    });

    const orbs = orbsOf(element);
    expect(orbs).toHaveLength(5);
    expect(orbs.map((orb) => styleOf(orb).getPropertyValue("width"))).toEqual([
      "80px",
      "160px",
      "240px",
      "120px",
      "200px",
    ]);
    expect(orbs.map((orb) => styleOf(orb).getPropertyValue("background"))).toEqual([
      "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
      "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
      "radial-gradient(circle, #ec4899 0%, transparent 70%)",
      "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
      "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
    ]);
    expect(styleOf(orbs[0]!).getPropertyValue("filter")).toBe("blur(40px)");
    expect(styleOf(orbs[0]!).getPropertyValue("opacity")).toBe("0.6");
    expect(styleOf(orbs[0]!).getPropertyValue("animation")).toContain("12s ease-in-out 0s infinite");
    expect(styleOf(orbs[1]!).getPropertyValue("animation")).toContain("12s ease-in-out -2.4s infinite");
    expect(styleOf(orbs[0]!).getPropertyValue("pointer-events")).toBe("none");
    expect((element.firstChild as FakeDivElement).attributes.get("aria-hidden")).toBe("true");
    expect(documentHead.children[0]?.textContent).toContain("@keyframes af-motion-floating-orbs-");
    expect(element.children[1]).toBe(content);
    expect(styleOf(element).getPropertyValue("position")).toBe("relative");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(styleOf(element).getPropertyValue("position")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("applies defaults and supports one color", () => {
    const element = makeElement();
    const controls = floatingOrbs(asHTMLElement(element), { count: 1, colors: ["rebeccapurple"] });
    const orb = orbsOf(element)[0]!;
    expect(orbsOf(element)).toHaveLength(1);
    expect(styleOf(orb).getPropertyValue("width")).toBe("80px");
    expect(styleOf(orb).getPropertyValue("height")).toBe("80px");
    expect(styleOf(orb).getPropertyValue("filter")).toBe("blur(40px)");
    expect(styleOf(orb).getPropertyValue("opacity")).toBe("0.6");
    expect(styleOf(orb).getPropertyValue("animation")).toContain("12s ease-in-out");
    controls.destroy();
  });

  it("resolves multiple HTML targets from selectors and ignores non-HTML matches", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, new (class {})(), second];

    const controls = floatingOrbs(".hero", { count: 2 });
    expect(orbsOf(first)).toHaveLength(2);
    expect(orbsOf(second)).toHaveLength(2);
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("uses unique keyframes and restores shared target styles after the last instance", () => {
    const element = makeElement();
    styleOf(element).setProperty("position", "absolute", "important");
    const first = floatingOrbs(asHTMLElement(element), { count: 1 });
    const firstRule = documentHead.children[0]?.textContent;
    const second = floatingOrbs(asHTMLElement(element), { count: 1 });
    expect(documentHead.children[1]?.textContent).not.toBe(firstRule);

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

  it("displays static orbs for reduced motion and toggles animation when preference changes", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = floatingOrbs(asHTMLElement(element), { count: 2 });
    const orb = orbsOf(element)[0]!;
    expect(styleOf(orb).getPropertyValue("animation")).toBe("");
    expect(styleOf(orb).getPropertyValue("will-change")).toBe("auto");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(styleOf(orb).getPropertyValue("animation")).toContain("infinite");

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(styleOf(orb).getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("returns inert controls when no selector matches", () => {
    const controls = floatingOrbs(".missing");
    expect(documentHead.children).toHaveLength(0);
    expect(() => controls.destroy()).not.toThrow();
  });

  it("rejects invalid selectors and options without modifying targets", () => {
    const element = makeElement();
    expect(() => floatingOrbs("!!bad")).toThrow(SyntaxError);
    expect(() => floatingOrbs(asHTMLElement(element), { colors: [] })).toThrow(TypeError);
    expect(() => floatingOrbs(asHTMLElement(element), { colors: [""] })).toThrow(TypeError);
    expect(() => floatingOrbs(asHTMLElement(element), { count: 0 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { count: 1.5 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { count: 101 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { minSize: 0 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { maxSize: 20, minSize: 40 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { blur: -1 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { speed: 0 })).toThrow(RangeError);
    expect(() => floatingOrbs(asHTMLElement(element), { opacity: 1.1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(styleOf(element).getPropertyValue("position")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });
});
