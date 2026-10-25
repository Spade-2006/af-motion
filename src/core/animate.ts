import { animateProgress } from "./animation.js";
import { prefersReducedMotion } from "./motion.js";
import type { AnimationControls, AnimationOptions } from "./animation.js";

/** A single element, or a CSS selector resolved with `document.querySelectorAll`. */
export type AnimateTarget = HTMLElement | string;

export type AnimationValue = string | number;

/**
 * Maps CSS property names (camelCase, kebab-case or `--custom`) to `[from, to]`.
 *
 * Interpolation rules:
 * - Values are split into numbers and the text around them. If `from` and `to`
 *   have the same text and the same count of numbers (e.g. `0` -> `1`,
 *   `"10px"` -> `"20px"`, `"translateY(24px)"` -> `"translateY(0px)"`), every
 *   number is interpolated and units/functions are preserved.
 * - Otherwise (e.g. `"red"` -> `"blue"`, `"10px"` -> `"2em"`, `"none"` -> `"block"`)
 *   the value cannot be interpolated: `from` is used until the eased progress
 *   reaches 1, then `to` is applied.
 */
export type AnimatableProperties = Record<string, readonly [AnimationValue, AnimationValue]>;

export interface DOMAnimationOptions extends Omit<AnimationOptions, "onUpdate"> {
  /**
   * When true (default) and the user prefers reduced motion, the animation
   * jumps to its final values on the next frame, ignoring delay and duration.
   * `onComplete` still fires.
   */
  respectReducedMotion?: boolean;
}

interface PropertyAnimation {
  cssName: string;
  from: string;
  valueAt: (progress: number) => string;
}

interface ParsedValue {
  parts: string[];
  numbers: number[];
}

// Numbers not glued to identifiers ("translate3d", "#00ff00", "--gap-1"); supports exponents.
const NUMBER_PATTERN = /(?<![\w#.])(?<!\w-)-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;

function parseValue(value: string): ParsedValue {
  const parts: string[] = [];
  const numbers: number[] = [];
  let lastIndex = 0;
  for (const match of value.matchAll(NUMBER_PATTERN)) {
    parts.push(value.slice(lastIndex, match.index));
    numbers.push(Number(match[0]));
    lastIndex = match.index + match[0].length;
  }
  parts.push(value.slice(lastIndex));
  return { parts, numbers };
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}

function createValueAt(from: string, to: string): (progress: number) => string {
  const fromParsed = parseValue(from);
  const toParsed = parseValue(to);
  const isInterpolable =
    fromParsed.numbers.length > 0 &&
    fromParsed.numbers.length === toParsed.numbers.length &&
    fromParsed.parts.every((part, index) => part === toParsed.parts[index]);

  if (!isInterpolable) {
    return (progress) => (progress >= 1 ? to : from);
  }

  return (progress) => {
    if (progress === 0) return from;
    if (progress === 1) return to;
    let result = fromParsed.parts[0] as string;
    fromParsed.numbers.forEach((start, index) => {
      const end = toParsed.numbers[index] as number;
      result += formatNumber(start + (end - start) * progress) + fromParsed.parts[index + 1];
    });
    return result;
  };
}

export function toCssName(name: string): string {
  if (name.startsWith("--")) return name;
  const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return kebab.startsWith("ms-") ? `-${kebab}` : kebab;
}

function toCssString(property: string, value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new TypeError(
    `Invalid value for "${property}": expected a finite number or non-empty string, received ${String(value)}`,
  );
}

function buildPropertyAnimations(properties: AnimatableProperties): PropertyAnimation[] {
  const entries = Object.entries(properties);
  if (entries.length === 0) {
    throw new TypeError("animate() requires at least one property to animate");
  }

  return entries.map(([name, range]) => {
    if (!Array.isArray(range) || range.length !== 2) {
      throw new TypeError(`Property "${name}" must be a [from, to] pair`);
    }
    const from = toCssString(name, range[0]);
    const to = toCssString(name, range[1]);
    return { cssName: toCssName(name), from, valueAt: createValueAt(from, to) };
  });
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

export function resolveTargets(target: AnimateTarget): HTMLElement[] {
  if (typeof target !== "string") {
    if (!isHTMLElement(target)) {
      throw new TypeError("animate() target must be an HTMLElement or a CSS selector string");
    }
    return [target];
  }

  if (typeof document === "undefined") {
    throw new Error(`Cannot resolve selector "${target}": document is not available`);
  }

  let matches: NodeListOf<Element>;
  try {
    matches = document.querySelectorAll(target);
  } catch (error) {
    throw new SyntaxError(`Invalid CSS selector "${target}"`, { cause: error });
  }
  return Array.from(matches).filter(isHTMLElement);
}

/**
 * Animates CSS properties of one element, or of every HTMLElement matching a selector.
 *
 * - Only the listed properties are written (via `style.setProperty`); other inline
 *   styles are untouched.
 * - `from` values are applied synchronously (unless reduced motion applies), so
 *   delayed animations start from the correct state.
 * - On completion the exact `to` values remain. On `cancel()` the current values stay.
 * - A selector that matches no HTMLElement is not an error: nothing is animated,
 *   no callbacks fire, and no-op controls are returned.
 * - Throws `SyntaxError` for an invalid selector, and `TypeError` for an invalid
 *   target or property definition. Invalid duration/delay throw `RangeError`.
 */
export function animate(
  target: AnimateTarget,
  properties: AnimatableProperties,
  options: DOMAnimationOptions = {},
): AnimationControls {
  const { respectReducedMotion = true, ...engineOptions } = options;

  const elements = resolveTargets(target);
  const animations = buildPropertyAnimations(properties);

  if (elements.length === 0) {
    // Reuse the engine's duration/delay validation so errors don't depend on matches.
    animateProgress({ ...engineOptions }).cancel();
    return { cancel: () => undefined };
  }

  const write = (valueFor: (animation: PropertyAnimation) => string): void => {
    for (const animation of animations) {
      const value = valueFor(animation);
      for (const element of elements) {
        element.style.setProperty(animation.cssName, value);
      }
    }
  };

  const reduceMotion = respectReducedMotion && prefersReducedMotion();

  const controls = animateProgress({
    ...engineOptions,
    ...(reduceMotion ? { duration: 0, delay: 0, easing: (progress: number) => progress } : {}),
    onUpdate: (progress) => {
      // A custom easing returning NaN/Infinity must not write invalid CSS.
      if (!Number.isFinite(progress)) return;
      write((animation) => animation.valueAt(progress));
    },
  });

  if (!reduceMotion) write((animation) => animation.from);

  return controls;
}
