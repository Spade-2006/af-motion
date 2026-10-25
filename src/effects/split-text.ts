import { resolveTargets } from "../core/animate.js";
import type { AnimateTarget } from "../core/animate.js";

export type SplitTextMode = "characters" | "words" | "lines";

export interface SplitTextOptions {
  /** Units to wrap. Defaults to "words". */
  by?: SplitTextMode;
  /** Base class applied to every generated span. Defaults to "af-split". */
  className?: string;
}

export interface SplitTextControls {
  /** Restores the exact original child nodes and removes resize listeners/observers. Safe to repeat. */
  destroy(): void;
}

interface ParentSnapshot {
  parent: Node;
  children: Node[];
}

interface TextSnapshot {
  node: Text;
  data: string;
}

interface TargetSnapshot {
  element: HTMLElement;
  parents: ParentSnapshot[];
  texts: TextSnapshot[];
  units: HTMLSpanElement[];
}

interface GraphemeSegment {
  segment: string;
}

interface GraphemeSegmenter {
  segment(input: string): Iterable<GraphemeSegment>;
}

interface GraphemeSegmenterConstructor {
  new (locales?: string | string[], options?: { granularity: "grapheme" }): GraphemeSegmenter;
}

const DEFAULT_BY: SplitTextMode = "words";
const DEFAULT_CLASS_NAME = "af-split";

function textSegments(text: string, by: SplitTextMode): string[] {
  if (by === "words") return text.match(/\s+|\S+/gu) ?? [];
  if (by !== "characters") return [text];

  const segmenterValue: unknown = Reflect.get(Intl, "Segmenter");
  if (typeof segmenterValue === "function") {
    const Segmenter = segmenterValue as GraphemeSegmenterConstructor;
    return Array.from(new Segmenter(undefined, { granularity: "grapheme" }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

function isWhitespace(value: string): boolean {
  return /^\s+$/u.test(value);
}

function saveTree(element: HTMLElement): { parents: ParentSnapshot[]; texts: TextSnapshot[] } {
  const parents: ParentSnapshot[] = [];
  const texts: TextSnapshot[] = [];
  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      texts.push({ node: node as Text, data: node.textContent ?? "" });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    const tagName = node.nodeType === Node.ELEMENT_NODE ? (node as Element).tagName.toLowerCase() : "";
    if (tagName === "script" || tagName === "style") return;
    const children = Array.from(node.childNodes);
    parents.push({ parent: node, children });
    for (const child of children) visit(child);
  };
  visit(element);
  return { parents, texts };
}

function wrapTextNodes(snapshot: TargetSnapshot, by: SplitTextMode, className: string): void {
  let unitIndex = 0;
  const originalTexts = [...snapshot.texts];
  for (const { node, data } of originalTexts) {
    const parent = node.parentNode;
    if (!parent || data.length === 0) continue;
    const fragment = document.createDocumentFragment();
    const segments = textSegments(data, by === "lines" ? "words" : by);
    for (const segment of segments) {
      if (isWhitespace(segment)) {
        fragment.appendChild(document.createTextNode(segment));
        continue;
      }

      const span = document.createElement("span");
      span.className = `${className} ${className}--${by}`;
      const attribute = by === "characters" ? "data-af-character" : by === "words" ? "data-af-word" : "data-af-line";
      span.setAttribute(attribute, String(unitIndex++));
      span.appendChild(document.createTextNode(segment));
      snapshot.units.push(span);
      fragment.appendChild(span);
    }
    parent.insertBefore(fragment, node);
    parent.removeChild(node);
  }
}

function assignLines(snapshot: TargetSnapshot): void {
  const lineTops: number[] = [];
  for (const unit of snapshot.units) {
    const top = unit.getBoundingClientRect().top;
    let lineIndex = lineTops.findIndex((knownTop) => Math.abs(knownTop - top) < 1);
    if (lineIndex === -1) {
      lineIndex = lineTops.length;
      lineTops.push(top);
    }
    unit.setAttribute("data-af-line", String(lineIndex));
  }
}

function restoreTree(snapshot: TargetSnapshot): void {
  for (const { parent, children } of snapshot.parents) {
    while (parent.firstChild) parent.removeChild(parent.firstChild);
    for (const child of children) parent.appendChild(child);
  }
  for (const { node, data } of snapshot.texts) node.data = data;
}

/**
 * Wraps characters, words, or rendered lines in spans while preserving the original DOM tree.
 * Line mode groups words by their rendered top coordinate and updates after target resizes.
 */
export function splitText(target: AnimateTarget, options: SplitTextOptions = {}): SplitTextControls {
  const { by = DEFAULT_BY, className = DEFAULT_CLASS_NAME } = options;
  if (by !== "characters" && by !== "words" && by !== "lines") {
    throw new TypeError(`by must be "characters", "words", or "lines", received ${String(by)}`);
  }
  if (typeof className !== "string" || className.trim() === "") {
    throw new TypeError("className must be a non-empty string");
  }

  const elements = resolveTargets(target);
  if (elements.length === 0) return { destroy: () => undefined };

  const snapshots: TargetSnapshot[] = elements.map((element) => {
    const tree = saveTree(element);
    return { element, parents: tree.parents, texts: tree.texts, units: [] };
  });
  let destroyed = false;
  let resizeObserver: ResizeObserver | undefined;
  const onWindowResize = (): void => {
    if (destroyed || by !== "lines") return;
    for (const snapshot of snapshots) assignLines(snapshot);
  };
  const hasWindowResize = by === "lines" && typeof window !== "undefined";

  try {
    for (const snapshot of snapshots) wrapTextNodes(snapshot, by, className);
    if (by === "lines") {
      for (const snapshot of snapshots) assignLines(snapshot);
      if (typeof ResizeObserver === "function") {
        resizeObserver = new ResizeObserver(() => onWindowResize());
        for (const element of elements) resizeObserver.observe(element);
      } else if (hasWindowResize) {
        window.addEventListener("resize", onWindowResize);
      }
    }
  } catch (error) {
    resizeObserver?.disconnect();
    if (hasWindowResize && typeof ResizeObserver !== "function") {
      window.removeEventListener("resize", onWindowResize);
    }
    for (const snapshot of snapshots) restoreTree(snapshot);
    throw error;
  }

  return {
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      resizeObserver?.disconnect();
      if (hasWindowResize && !resizeObserver) window.removeEventListener("resize", onWindowResize);
      for (const snapshot of snapshots) restoreTree(snapshot);
    },
  };
}
