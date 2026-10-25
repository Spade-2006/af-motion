import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aurora } from "../src/backgrounds/aurora";

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

describe("aurora()", () => {
  it("creates a non-interactive gradient overlay with configured styles", () => {
    const element = makeElement();
    element.appendChild(new FakeHTMLElement());
    const content = element.firstChild;
    const controls = aurora(asHTMLElement(element), {
      colors: ["#7c3aed", "#06b6d4", "#ec4899"],
      speed: 8,
      blur: 60,
      opacity: 0.7,
      borderRadius: 24,
    });

    const overlay = element.firstChild as FakeDivElement;
    expect(overlay).not.toBe(content);
    expect(overlay.attributes.get("aria-hidden")).toBe("true");
    expect(styleOf(overlay).getPropertyValue("position")).toBe("absolute");
    expect(styleOf(overlay).getPropertyValue("inset")).toBe("-20%");
    expect(styleOf(overlay).getPropertyValue("z-index")).toBe("-1");
    expect(styleOf(overlay).getPropertyValue("pointer-events")).toBe("none");
    expect(styleOf(overlay).getPropertyValue("background")).toContain("#7c3aed");
    expect(styleOf(overlay).getPropertyValue("background")).toContain("#06b6d4");
    expect(styleOf(overlay).getPropertyValue("background")).toContain("#ec4899");
    expect(styleOf(overlay).getPropertyValue("filter")).toBe("blur(60px)");
    expect(styleOf(overlay).getPropertyValue("opacity")).toBe("0.7");
    expect(styleOf(overlay).getPropertyValue("border-radius")).toBe("24px");
    expect(styleOf(overlay).getPropertyValue("animation")).toMatch(/8s ease-in-out infinite/);
    expect(styleOf(element).getPropertyValue("position")).toBe("relative");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("isolate");
    expect(documentHead.children).toHaveLength(1);
    expect(documentHead.children[0]?.textContent).toContain("@keyframes af-motion-aurora-");

    controls.destroy();
    expect(element.children).toEqual([content]);
    expect(styleOf(element).getPropertyValue("position")).toBe("");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });

  it("resolves all matching HTML elements and creates a separate overlay for each", () => {
    const first = makeElement();
    const second = makeElement();
    selectorResults[".hero"] = [first, new (class {})(), second];

    const controls = aurora(".hero");
    expect(first.children).toHaveLength(1);
    expect(second.children).toHaveLength(1);
    controls.destroy();
    expect(first.children).toHaveLength(0);
    expect(second.children).toHaveLength(0);
  });

  it("uses a unique keyframe name for each instance and is safe to destroy repeatedly", () => {
    const first = makeElement();
    const second = makeElement();
    const a = aurora(asHTMLElement(first));
    const firstRule = documentHead.children[0]?.textContent;
    const b = aurora(asHTMLElement(second));
    const secondRule = documentHead.children[1]?.textContent;
    expect(firstRule).not.toBe(secondRule);

    a.destroy();
    a.destroy();
    expect(documentHead.children).toHaveLength(1);
    b.destroy();
    expect(documentHead.children).toHaveLength(0);
  });

  it("restores shared target styles only after the last instance is destroyed", () => {
    const element = makeElement();
    styleOf(element).setProperty("position", "absolute", "important");
    styleOf(element).setProperty("isolation", "auto");
    const a = aurora(asHTMLElement(element));
    const b = aurora(asHTMLElement(element));

    expect(styleOf(element).getPropertyValue("position")).toBe("absolute");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("isolate");
    a.destroy();
    expect(styleOf(element).getPropertyValue("isolation")).toBe("isolate");
    b.destroy();
    expect(styleOf(element).getPropertyValue("position")).toBe("absolute");
    expect(styleOf(element).getPropertyPriority("position")).toBe("important");
    expect(styleOf(element).getPropertyValue("isolation")).toBe("auto");
  });

  it("shows a static background and toggles animation with reduced-motion changes", () => {
    reducedMotion = true;
    const element = makeElement();
    const controls = aurora(asHTMLElement(element));
    const overlay = element.firstChild as FakeDivElement;
    expect(styleOf(overlay).getPropertyValue("animation")).toBe("");
    expect(styleOf(overlay).getPropertyValue("will-change")).toBe("auto");

    reducedMotion = false;
    for (const listener of motionListeners) listener({ matches: false });
    expect(styleOf(overlay).getPropertyValue("animation")).toContain("infinite");

    reducedMotion = true;
    for (const listener of motionListeners) listener({ matches: true });
    expect(styleOf(overlay).getPropertyValue("animation")).toBe("");
    controls.destroy();
    expect(motionListeners.size).toBe(0);
  });

  it("returns inert controls when the selector matches nothing", () => {
    const controls = aurora(".missing");
    expect(documentHead.children).toHaveLength(0);
    expect(() => controls.destroy()).not.toThrow();
  });

  it("rejects invalid selectors and options before changing targets", () => {
    const element = makeElement();
    expect(() => aurora("!!bad")).toThrow(SyntaxError);
    expect(() => aurora(asHTMLElement(element), { colors: [""] })).toThrow(TypeError);
    expect(() => aurora(asHTMLElement(element), { colors: ["red"] })).toThrow(TypeError);
    expect(() => aurora(asHTMLElement(element), { speed: 0 })).toThrow(RangeError);
    expect(() => aurora(asHTMLElement(element), { speed: Number.POSITIVE_INFINITY })).toThrow(RangeError);
    expect(() => aurora(asHTMLElement(element), { blur: -1 })).toThrow(RangeError);
    expect(() => aurora(asHTMLElement(element), { opacity: 1.1 })).toThrow(RangeError);
    expect(() => aurora(asHTMLElement(element), { borderRadius: -1 })).toThrow(RangeError);
    expect(element.children).toHaveLength(0);
    expect(styleOf(element).getPropertyValue("position")).toBe("");
    expect(documentHead.children).toHaveLength(0);
  });
});
