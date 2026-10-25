import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { splitText } from "../src/effects/split-text";
import type { SplitTextControls, SplitTextOptions } from "../src/effects/split-text";

const linePositions = new Map<string, number>();

class FakeNode {
  parentNode: FakeNode | null = null;
  childNodes: FakeNode[] = [];
  nodeType: number;
  textContent: string | null = null;
  constructor(nodeType: number) {
    this.nodeType = nodeType;
  }
  get firstChild(): FakeNode | null {
    return this.childNodes[0] ?? null;
  }
  appendChild<T extends FakeNode>(node: T): T {
    return this.insertBefore(node, null);
  }
  insertBefore<T extends FakeNode>(node: T, before: FakeNode | null): T {
    if (node.nodeType === 11) {
      for (const child of [...node.childNodes]) this.insertBefore(child, before);
      return node;
    }
    if (node.parentNode) node.parentNode.removeChild(node);
    const index = before === null ? -1 : this.childNodes.indexOf(before);
    if (index < 0) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    return node;
  }
  removeChild<T extends FakeNode>(node: T): T {
    this.childNodes.splice(this.childNodes.indexOf(node), 1);
    node.parentNode = null;
    return node;
  }
}

class FakeDocumentFragment extends FakeNode {
  constructor() {
    super(11);
  }
}

class FakeTextNode extends FakeNode {
  data: string;
  constructor(data: string) {
    super(3);
    this.data = data;
    this.textContent = data;
  }
}

class FakeHTMLElement extends FakeNode {
  tagName: string;
  className = "";
  attributes = new Map<string, string>();
  constructor(tagName = "div") {
    super(1);
    this.tagName = tagName.toUpperCase();
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  getBoundingClientRect(): DOMRect {
    const text = this.childNodes.map((child) => child.textContent ?? "").join("");
    return { top: linePositions.get(text) ?? 0 } as DOMRect;
  }
}

class FakeSpanElement extends FakeHTMLElement {
  constructor() {
    super("span");
  }
}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed = new Set<Element>();
  disconnect = vi.fn(() => this.observed.clear());
  constructor(public callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe = (element: Element): void => {
    this.observed.add(element);
  };
  resize(element: FakeHTMLElement): void {
    this.callback(
      [{ target: element as unknown as Element } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

let selectorResults: Record<string, unknown[]>;

function textNode(value: string): FakeTextNode {
  return new FakeTextNode(value);
}

function makeElement(...children: FakeNode[]): FakeHTMLElement {
  const element = new FakeHTMLElement();
  for (const child of children) element.appendChild(child);
  return element;
}

function asHTMLElement(element: FakeHTMLElement): HTMLElement {
  return element as unknown as HTMLElement;
}

function spansOf(element: FakeHTMLElement): FakeSpanElement[] {
  const spans: FakeSpanElement[] = [];
  const visit = (node: FakeNode): void => {
    for (const child of node.childNodes) {
      if (child instanceof FakeSpanElement) spans.push(child);
      visit(child);
    }
  };
  visit(element);
  return spans;
}

function textOf(node: FakeNode): string {
  if (node instanceof FakeTextNode) return node.data;
  return node.childNodes.map(textOf).join("");
}

beforeEach(() => {
  selectorResults = {};
  linePositions.clear();
  FakeResizeObserver.instances = [];
  vi.stubGlobal("Node", { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_FRAGMENT_NODE: 11 });
  vi.stubGlobal("HTMLElement", FakeHTMLElement);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("document", {
    createElement: (name: string) => {
      if (name === "span") return new FakeSpanElement();
      return new FakeHTMLElement(name);
    },
    createTextNode: (value: string) => new FakeTextNode(value),
    createDocumentFragment: () => new FakeDocumentFragment(),
    querySelectorAll: (selector: string) => {
      if (selector === "!!bad") throw new DOMException("bad selector", "SyntaxError");
      return selectorResults[selector] ?? [];
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("splitText()", () => {
  it("wraps Unicode characters while preserving whitespace and restores the exact original nodes", () => {
    const original = textNode("A😀 e\u0301");
    const element = makeElement(original);
    const controls = splitText(asHTMLElement(element), { by: "characters", className: "glyph" });
    const spans = spansOf(element);

    expect(spans.map(textOf)).toEqual(["A", "😀", "e\u0301"]);
    expect(spans.every((span) => span.className === "glyph glyph--characters")).toBe(true);
    expect(spans.map((span) => span.attributes.get("data-af-character"))).toEqual(["0", "1", "2"]);
    expect(textOf(element)).toBe("A😀 e\u0301");

    controls.destroy();
    expect(element.childNodes).toEqual([original]);
    expect(original.data).toBe("A😀 e\u0301");
  });

  it("wraps words without changing repeated whitespace", () => {
    const original = textNode("Keep   these\twords\n");
    const element = makeElement(original);
    const controls = splitText(asHTMLElement(element), { by: "words", className: "af-word" });

    expect(spansOf(element).map(textOf)).toEqual(["Keep", "these", "words"]);
    expect(spansOf(element).map((span) => span.attributes.get("data-af-word"))).toEqual(["0", "1", "2"]);
    expect(textOf(element)).toBe("Keep   these\twords\n");
    controls.destroy();
    expect(element.childNodes).toEqual([original]);
  });

  it("preserves nested inline formatting and restores original elements and text nodes", () => {
    const lead = textNode("Hello ");
    const emphText = textNode("beautiful");
    const emphasis = new FakeHTMLElement("em");
    emphasis.appendChild(emphText);
    const trailing = textNode(" world");
    const element = makeElement(lead, emphasis, trailing);
    const controls = splitText(asHTMLElement(element), { by: "words" });

    expect(textOf(element)).toBe("Hello beautiful world");
    expect(spansOf(element).map(textOf)).toEqual(["Hello", "beautiful", "world"]);
    controls.destroy();
    expect(element.childNodes).toEqual([lead, emphasis, trailing]);
    expect(emphasis.childNodes).toEqual([emphText]);
  });

  it("groups words by rendered lines and recalculates groups after resize", () => {
    const element = makeElement(textNode("one two three"));
    linePositions.set("one", 10);
    linePositions.set("two", 10);
    linePositions.set("three", 30);
    const controls = splitText(asHTMLElement(element), { by: "lines", className: "line-word" });
    let spans = spansOf(element);
    expect(spans.map((span) => span.attributes.get("data-af-line"))).toEqual(["0", "0", "1"]);
    expect(spans.every((span) => span.className === "line-word line-word--lines")).toBe(true);

    linePositions.set("one", 5);
    linePositions.set("two", 25);
    linePositions.set("three", 25);
    const observer = FakeResizeObserver.instances[0]!;
    observer.resize(element);
    spans = spansOf(element);
    expect(spans.map((span) => span.attributes.get("data-af-line"))).toEqual(["0", "1", "1"]);

    controls.destroy();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(textOf(element)).toBe("one two three");
  });

  it("supports multiple selector targets", () => {
    const first = makeElement(textNode("one two"));
    const second = makeElement(textNode("three four"));
    selectorResults[".headline"] = [first, new (class {})(), second];
    const controls = splitText(".headline", { by: "words" });
    expect(spansOf(first).map(textOf)).toEqual(["one", "two"]);
    expect(spansOf(second).map(textOf)).toEqual(["three", "four"]);
    controls.destroy();
    expect(textOf(first)).toBe("one two");
    expect(textOf(second)).toBe("three four");
  });

  it("validates options and selectors before modifying the DOM", () => {
    const original = textNode("Untouched text");
    const element = makeElement(original);
    expect(() => splitText(asHTMLElement(element), { by: "sentences" as "words" })).toThrow(TypeError);
    expect(() => splitText(asHTMLElement(element), { className: "  " })).toThrow(TypeError);
    expect(() => splitText("!!bad")).toThrow(SyntaxError);
    expect(element.childNodes).toEqual([original]);
    expect(original.data).toBe("Untouched text");
  });

  it("returns inert controls for empty matches and exposes the public types", () => {
    const controls = splitText(".missing");
    expect(() => controls.destroy()).not.toThrow();
    expectTypeOf<SplitTextOptions["by"]>().toEqualTypeOf<"characters" | "words" | "lines" | undefined>();
    expectTypeOf<SplitTextControls["destroy"]>().toBeFunction();
  });
});
