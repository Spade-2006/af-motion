/**
 * AF Motion Layout Measurement Utilities
 *
 * Fast, batch-safe geometric measurements with scroll awareness
 * and zero layout thrashing.
 */

import type { LayoutRect } from "./types.js";

/**
 * Computes current viewport scroll offsets safely across browser environments.
 */
export function getViewportScroll(): { x: number; y: number } {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }
  return {
    x: window.scrollX ?? window.pageXOffset ?? 0,
    y: window.scrollY ?? window.pageYOffset ?? 0,
  };
}

/**
 * Measures the bounding rectangle of an element, optionally accounting for page scroll.
 */
export function measureLayout(element: HTMLElement, includeScroll = true): LayoutRect {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      scrollX: 0,
      scrollY: 0,
    };
  }

  const domRect = element.getBoundingClientRect();
  const scroll = includeScroll ? getViewportScroll() : { x: 0, y: 0 };

  const top = domRect.top + scroll.y;
  const left = domRect.left + scroll.x;
  const width = Math.max(0, domRect.width);
  const height = Math.max(0, domRect.height);

  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    scrollX: scroll.x,
    scrollY: scroll.y,
  };
}

/**
 * Measures the viewport-relative bounding box of an element (without scroll additions).
 */
export function measureAbsoluteRect(element: HTMLElement): LayoutRect {
  return measureLayout(element, false);
}

/**
 * Compares two layout rectangles within an acceptable threshold tolerance (default 0.5px).
 */
export function areRectsEqual(
  a: LayoutRect | null | undefined,
  b: LayoutRect | null | undefined,
  tolerance = 0.5
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;

  return (
    Math.abs(a.top - b.top) <= tolerance &&
    Math.abs(a.left - b.left) <= tolerance &&
    Math.abs(a.width - b.width) <= tolerance &&
    Math.abs(a.height - b.height) <= tolerance
  );
}

/**
 * Executes a batch read across multiple elements in a single cycle, preventing layout thrashing.
 */
export function batchMeasure(
  elements: readonly HTMLElement[],
  includeScroll = true
): Map<HTMLElement, LayoutRect> {
  const rects = new Map<HTMLElement, LayoutRect>();
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el) {
      rects.set(el, measureLayout(el, includeScroll));
    }
  }
  return rects;
}
