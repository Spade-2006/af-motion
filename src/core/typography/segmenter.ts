/**
 * AF Motion Kinetic Typography Segmentation Engine
 *
 * Deterministic text segmentation into Unicode grapheme characters, words,
 * rendered lines, and paragraphs, with full emoji/combining-mark support,
 * RTL handling, and accessibility preservation.
 */

import type {
  SegmentationResult,
  SegmentTextOptions,
  TypographySegmentationMode,
  TypographyUnit,
} from "./types.js";

interface GraphemeSegment {
  segment: string;
}

interface GraphemeSegmenter {
  segment(input: string): Iterable<GraphemeSegment>;
}

interface GraphemeSegmenterConstructor {
  new (locales?: string | string[], options?: { granularity: "grapheme" | "word" }): GraphemeSegmenter;
}

const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const EMOJI_OR_COMBINING_REGEX =
  /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff][\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff][\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe2f\u20d0-\u20ff]|\ud83c[\udffb-\udfff])?))*|[\s\S])/gu;

/**
 * Segments a raw string into grapheme clusters (characters) aware of emojis and combining marks.
 */
export function segmentCharacters(text: string, locales?: string | string[]): string[] {
  if (!text) return [];

  const segmenterValue: unknown = typeof Intl !== "undefined" ? Reflect.get(Intl, "Segmenter") : null;
  if (typeof segmenterValue === "function") {
    try {
      const Segmenter = segmenterValue as GraphemeSegmenterConstructor;
      const segmenter = new Segmenter(locales, { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (part) => part.segment);
    } catch {
      // Fallback if Segmenter constructor fails with custom locale
    }
  }

  // Regex-based grapheme and surrogate pair fallback
  const matches = text.match(EMOJI_OR_COMBINING_REGEX);
  return matches ? Array.from(matches) : Array.from(text);
}

/**
 * Segments a raw string into words while preserving whitespace and punctuation.
 */
export function segmentWords(text: string): string[] {
  if (!text) return [];
  return text.match(/\s+|\S+/gu) ?? [];
}

/**
 * Segments a raw string into paragraphs.
 */
export function segmentParagraphs(text: string): string[] {
  if (!text) return [];
  return text.split(/\r?\n\s*\r?\n/);
}

/**
 * Segments raw text string into units based on mode.
 */
export function segmentTextString(
  text: string,
  options: SegmentTextOptions = {}
): TypographyUnit[] {
  const by = options.by ?? "words";
  let rawSegments: string[];

  switch (by) {
    case "characters":
      rawSegments = segmentCharacters(text, options.locales);
      break;
    case "words":
      rawSegments = segmentWords(text);
      break;
    case "paragraphs":
      rawSegments = segmentParagraphs(text);
      break;
    case "lines":
      rawSegments = text.split(/\r?\n/);
      break;
    case "custom":
      rawSegments = options.customSegmenter ? options.customSegmenter(text) : segmentWords(text);
      break;
  }

  const units: TypographyUnit[] = [];
  const total = rawSegments.length;

  for (let i = 0; i < total; i++) {
    const segment = rawSegments[i]!;
    const isWhitespace = /^\s+$/.test(segment);

    units.push({
      id: `unit_${by}_${i}`,
      text: segment,
      index: i,
      total,
      type: by,
      isWhitespace,
    });
  }

  return units;
}

/**
 * Resolves an element reference from a selector or direct HTMLElement.
 */
function resolveElement(target: HTMLElement | string): HTMLElement {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error(`Cannot resolve selector "${target}": document is not available`);
    }
    const el = document.querySelector(target);
    if (!el || !(el instanceof HTMLElement)) {
      throw new Error(`Could not find HTMLElement matching selector "${target}"`);
    }
    return el;
  }
  return target;
}

interface ParentSnapshot {
  parent: Node;
  children: Node[];
}

/**
 * Segments a DOM element or text string into kinetic typography units.
 */
export function segmentText(
  target: HTMLElement | string,
  options: SegmentTextOptions = {}
): SegmentationResult {
  const by = options.by ?? "words";
  const className = options.className ?? "af-kinetic-unit";
  const aria = options.aria ?? true;

  // Pure string target (non-DOM)
  if (typeof target === "string" && (typeof document === "undefined" || !target.startsWith("#") && !target.startsWith(".") && !target.startsWith("["))) {
    try {
      const el = resolveElement(target);
      return segmentDOMElement(el, by, className, aria, options);
    } catch {
      // Treat as raw text
      const units = segmentTextString(target, options);
      return {
        units,
        originalText: target,
        restore: () => undefined,
        destroy: () => undefined,
      };
    }
  }

  const element = resolveElement(target);
  return segmentDOMElement(element, by, className, aria, options);
}

function segmentDOMElement(
  element: HTMLElement,
  by: TypographySegmentationMode,
  className: string,
  aria: boolean,
  options: SegmentTextOptions
): SegmentationResult {
  const originalText = element.textContent ?? "";
  const originalAriaLabel = element.getAttribute("aria-label");
  const isRTL = RTL_REGEX.test(originalText);

  // Snapshot original DOM structure for clean restoration
  const parentsSnapshot: ParentSnapshot[] = [];
  const textNodes: Text[] = [];

  function visit(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    const tagName = node.nodeType === Node.ELEMENT_NODE ? (node as Element).tagName.toLowerCase() : "";
    if (tagName === "script" || tagName === "style") return;

    const children = Array.from(node.childNodes);
    parentsSnapshot.push({ parent: node, children });
    for (const child of children) visit(child);
  }

  visit(element);

  const units: TypographyUnit[] = [];
  let unitIndex = 0;

  // Accessibility: annotate root with full aria-label
  if (aria && originalText) {
    element.setAttribute("aria-label", originalText);
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    const textData = textNode.data;
    if (!parent || textData.length === 0) continue;

    const fragment = document.createDocumentFragment();
    const rawSegments = segmentTextString(textData, options);

    for (const item of rawSegments) {
      if (item.isWhitespace && options.preserveWhitespace !== false) {
        // In word or character mode, preserve spaces with non-breaking span or space text
        const spaceNode = document.createTextNode(item.text);
        fragment.appendChild(spaceNode);
        continue;
      }

      const span = document.createElement("span");
      span.className = `${className} ${className}--${by}`;
      span.style.cssText = isRTL ? "display:inline-block;white-space:pre;unicode-bidi:isolate;" : "display:inline-block;white-space:pre;";
      if (isRTL) {
        span.dir = "rtl";
      }

      if (aria) {
        span.setAttribute("aria-hidden", "true");
      }

      const attrName = `data-af-${by.slice(0, -1)}`;
      span.setAttribute(attrName, String(unitIndex));
      span.textContent = item.text;

      const unit: TypographyUnit = {
        id: `unit_${by}_${unitIndex}`,
        text: item.text,
        index: unitIndex,
        total: 0, // Resolved after loop
        type: by,
        element: span,
        isWhitespace: item.isWhitespace,
      };

      units.push(unit);
      unitIndex++;
      fragment.appendChild(span);
    }

    parent.insertBefore(fragment, textNode);
    parent.removeChild(textNode);
  }

  // If by === "lines", group units by rendered getBoundingClientRect top
  if (by === "lines" && units.length > 0 && typeof window !== "undefined") {
    assignRenderedLines(units);
  }

  // Update total counts
  const totalUnits = units.length;
  for (let i = 0; i < totalUnits; i++) {
    (units[i] as { total: number }).total = totalUnits;
  }

  let isDestroyed = false;

  const restore = (): void => {
    if (isDestroyed) return;
    isDestroyed = true;

    // Restore original DOM nodes
    for (const { parent, children } of parentsSnapshot) {
      while (parent.firstChild) parent.removeChild(parent.firstChild);
      for (const child of children) parent.appendChild(child);
    }

    if (aria) {
      if (originalAriaLabel !== null) {
        element.setAttribute("aria-label", originalAriaLabel);
      } else {
        element.removeAttribute("aria-label");
      }
    }
  };

  return {
    units,
    rootElement: element,
    originalText,
    restore,
    destroy: restore,
  };
}

function assignRenderedLines(units: TypographyUnit[]): void {
  const lineTops: number[] = [];

  for (const unit of units) {
    if (!unit.element) continue;
    const rect = unit.element.getBoundingClientRect();
    const top = rect.top;

    let lineIndex = lineTops.findIndex((knownTop) => Math.abs(knownTop - top) < 2);
    if (lineIndex === -1) {
      lineIndex = lineTops.length;
      lineTops.push(top);
    }

    (unit as { parentIndex?: number }).parentIndex = lineIndex;
    unit.element.setAttribute("data-af-line", String(lineIndex));
  }
}

/**
 * Public splitText API wrapping segmentText with backward compatibility.
 */
export function splitText(
  target: HTMLElement | string,
  options: SegmentTextOptions = {}
): SegmentationResult {
  return segmentText(target, options);
}
