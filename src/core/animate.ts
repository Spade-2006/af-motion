import { animateProgress } from "./animation.js";
import { prefersReducedMotion } from "./motion.js";
import type { AnimationControls, AnimationOptions, EasingFunction } from "./animation.js";
import { resolveEasing } from "../easing/easings.js";
import type { EasingOption } from "../easing/easings.js";
import { getTransformBase, setTransformBase } from "./transform.js";

/** A single element, or a CSS selector resolved with `document.querySelectorAll`. */
export type AnimateTarget = HTMLElement | SVGElement | string;

export type AnimationValue = string | number;

/**
 * Maps CSS property names (camelCase, kebab-case or `--custom`) to two or more keyframe values.
 *
 * Interpolation rules:
 * - Compatible numeric values are interpolated only when their surrounding
 *   CSS syntax and units match (e.g. `"10px"` -> `"20px"`,
 *   `"translateY(24px)"` -> `"translateY(0px)"`).
 * - Compatible `rgb()`/`rgba()` values interpolate their color channels.
 * - Otherwise (e.g. `"red"` -> `"blue"`, `"10px"` -> `"2em"`, `"none"` -> `"block"`)
 *   the value cannot be interpolated: `from` is used until the eased progress
 *   reaches 1, then `to` is applied.
 */
export type AnimatableProperties = Record<string, readonly [AnimationValue, AnimationValue, ...AnimationValue[]]>;

export interface DOMAnimationOptions extends AnimationOptions {
  /** Per-property easing overrides. Unspecified properties use the global easing. */
  propertyEasing?: Partial<Record<string, EasingOption>>;
  /** Per-property normalized offsets for its keyframes; unspecified properties are evenly spaced. */
  propertyKeyframeOffsets?: Readonly<Record<string, readonly number[]>>;
  /** Controls whether animation-applied values are applied during delay and retained after completion. Defaults to legacy behavior. */
  fill?: "none" | "forwards" | "backwards" | "both";
  /**
   * When true (default) and the user prefers reduced motion, the animation
   * jumps to its final values on the next frame, ignoring delay and duration.
   * `onComplete` still fires.
   */
  respectReducedMotion?: boolean;
}

interface PropertyAnimation {
  name: string;
  from: string;
  easing: EasingFunction;
  delay: number;
  duration: number;
  valueAt: (progress: number) => string;
}

interface ParsedValue {
  parts: string[];
  numbers: number[];
}

interface ParsedColor {
  channels: [number, number, number, number];
  hasAlpha: boolean;
  channelsAsPercent: boolean;
}

// Numbers not glued to identifiers ("translate3d", "#00ff00", "--gap-1"); supports exponents.
const NUMBER_PATTERN = /(?<![\w#.])(?<!\w-)-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
const COLOR_NUMBER = "([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?%?)";
const RGB_PATTERN = new RegExp(
  `^(rgb|rgba)\\(\\s*${COLOR_NUMBER}\\s*,\\s*${COLOR_NUMBER}\\s*,\\s*${COLOR_NUMBER}(?:\\s*,\\s*${COLOR_NUMBER})?\\s*\\)$`,
  "i",
);
const DEFAULT_ANIMATION_DURATION_MS = 1000;

interface PropertyLayer {
  order: number;
  value: string;
}

interface AnimatedPropertyState {
  value: string | null;
  priority: string;
  order: number;
  layers: Map<object, PropertyLayer>;
}

const animatedProperties = new WeakMap<Element, Map<string, AnimatedPropertyState>>();
let nextAnimationOrder = 0;

// camelCase aliases for hyphenated SVG presentation attributes; other names (viewBox, etc.) are kept as-is.
const SVG_PRESENTATION_ATTRIBUTES = new Set([
  "clipRule", "fillOpacity", "fillRule", "floodColor", "floodOpacity", "fontSize", "fontWeight",
  "letterSpacing", "lightingColor", "markerEnd", "markerMid", "markerStart", "paintOrder",
  "shapeRendering", "stopColor", "stopOpacity", "strokeDasharray", "strokeDashoffset",
  "strokeLinecap", "strokeLinejoin", "strokeMiterlimit", "strokeOpacity", "strokeWidth",
  "textAnchor", "transformOrigin", "vectorEffect",
]);

function resolveAttributeName(element: HTMLElement | SVGElement, name: string): string {
  return isSVGElement(element) && SVG_PRESENTATION_ATTRIBUTES.has(name) ? toCssName(name) : name;
}

function readAnimatedProperty(element: HTMLElement | SVGElement, name: string): { value: string | null; priority: string } {
  if (isSVGElement(element)) return { value: element.getAttribute(name), priority: "" };
  const cssName = toCssName(name);
  if (cssName === "transform") return getTransformBase(element);
  return {
    value: element.style.getPropertyValue(cssName) || null,
    priority: element.style.getPropertyPriority(cssName),
  };
}

function writeAnimatedProperty(
  element: HTMLElement | SVGElement,
  name: string,
  value: string | null,
  priority: string,
): void {
  if (isSVGElement(element)) {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
    return;
  }
  const cssName = toCssName(name);
  if (cssName === "transform") {
    setTransformBase(element, value, priority);
    return;
  }
  if (value === null) element.style.removeProperty(cssName);
  else element.style.setProperty(cssName, value, priority);
}

function getAnimatedPropertyState(element: HTMLElement | SVGElement, name: string): AnimatedPropertyState {
  name = resolveAttributeName(element, name);
  let properties = animatedProperties.get(element);
  if (!properties) {
    properties = new Map();
    animatedProperties.set(element, properties);
  }
  let state = properties.get(name);
  if (!state) {
    const original = readAnimatedProperty(element, name);
    state = { ...original, order: -1, layers: new Map() };
    properties.set(name, state);
  }
  return state;
}

function renderAnimatedProperty(element: HTMLElement | SVGElement, name: string, state: AnimatedPropertyState): void {
  let winningLayer: PropertyLayer | undefined;
  for (const layer of state.layers.values()) {
    if (layer.order > state.order && (!winningLayer || layer.order > winningLayer.order)) {
      winningLayer = layer;
    }
  }
  if (winningLayer) writeAnimatedProperty(element, name, winningLayer.value, "");
  else writeAnimatedProperty(element, name, state.value, state.priority);
}

function applyAnimatedProperty(
  element: HTMLElement | SVGElement,
  name: string,
  owner: object,
  order: number,
  value: string,
): void {
  name = resolveAttributeName(element, name);
  const state = getAnimatedPropertyState(element, name);
  state.layers.set(owner, { order, value });
  renderAnimatedProperty(element, name, state);
}

function releaseAnimatedProperty(
  element: HTMLElement | SVGElement,
  name: string,
  owner: object,
  order: number,
  commit: boolean,
): void {
  name = resolveAttributeName(element, name);
  const state = animatedProperties.get(element)?.get(name);
  const layer = state?.layers.get(owner);
  if (!state || !layer) return;
  state.layers.delete(owner);
  if (commit && layer.order >= state.order) {
    state.value = layer.value;
    state.priority = "";
    state.order = order;
  }
  renderAnimatedProperty(element, name, state);
  if (state.layers.size === 0) {
    const properties = animatedProperties.get(element);
    properties?.delete(name);
    if (properties?.size === 0) animatedProperties.delete(element);
  }
}

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
  const scaled = value * 1e6;
  return Number.isFinite(scaled) ? String(Math.round(scaled) / 1e6) : String(value);
}

function parseColor(value: string): ParsedColor | null {
  const hexMatch = /^#(?:([\da-f])([\da-f])([\da-f])|([\da-f]{2})([\da-f]{2})([\da-f]{2}))$/i.exec(value);
  if (hexMatch) {
    const hexChannels = hexMatch[1] !== undefined
      ? [hexMatch[1] + hexMatch[1], hexMatch[2] + hexMatch[2], hexMatch[3] + hexMatch[3]]
      : [hexMatch[4], hexMatch[5], hexMatch[6]];
    const channels = hexChannels.map((channel) => Number.parseInt(channel as string, 16));
    return {
      channels: [channels[0] as number, channels[1] as number, channels[2] as number, 1],
      hasAlpha: false,
      channelsAsPercent: false,
    };
  }

  const match = RGB_PATTERN.exec(value);
  if (!match) return null;

  const fn = match[1]?.toLowerCase();
  const rawChannels = [match[2], match[3], match[4]];
  const rawAlpha = match[5];
  if (fn === "rgba" && rawAlpha === undefined) return null;

  const channelsAsPercent = rawChannels.every((raw) => raw?.endsWith("%"));
  const channels = rawChannels.map((raw) => {
    if (raw === undefined) return Number.NaN;
    const percentage = raw.endsWith("%");
    const numeric = Number(percentage ? raw.slice(0, -1) : raw);
    return Math.min(255, Math.max(0, percentage ? numeric * 2.55 : numeric));
  });
  const alphaValue = rawAlpha === undefined
    ? 1
    : Number(rawAlpha.endsWith("%") ? rawAlpha.slice(0, -1) : rawAlpha) /
      (rawAlpha.endsWith("%") ? 100 : 1);
  const alpha = Math.min(1, Math.max(0, alphaValue));

  if (![...channels, alpha].every(Number.isFinite)) return null;
  return {
    channels: [channels[0] as number, channels[1] as number, channels[2] as number, alpha],
    hasAlpha: rawAlpha !== undefined,
    channelsAsPercent,
  };
}

interface SvgTransformFunction {
  name: string;
  params: number[];
}

const SVG_TRANSFORM_ARITY: Record<string, number[]> = {
  translate: [1, 2],
  scale: [1, 2],
  rotate: [1, 3],
  skewX: [1],
  skewY: [1],
  matrix: [6],
};
const SVG_NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

/** Parses a unitless SVG transform list into canonical functions, or null when malformed. */
function parseSvgTransformList(value: string): SvgTransformFunction[] | null {
  const functions: SvgTransformFunction[] = [];
  const pattern = /\s*,?\s*([A-Za-z]+)\s*\(([^()]*)\)/y;
  let cursor = 0;
  while (cursor < value.length && value.slice(cursor).trim() !== "") {
    pattern.lastIndex = cursor;
    const match = pattern.exec(value);
    if (!match || (functions.length === 0 && match[0].trimStart().startsWith(","))) return null;
    const name = match[1] as string;
    const arity = SVG_TRANSFORM_ARITY[name];
    if (!arity) return null;
    const raw = (match[2] as string).trim();
    const tokens = raw === "" ? [] : raw.split(/\s*,\s*|\s+/);
    if (!arity.includes(tokens.length) || !tokens.every((token) => SVG_NUMBER.test(token))) return null;
    const params = tokens.map(Number);
    if (!params.every(Number.isFinite)) return null;
    if (name === "translate" && params.length === 1) params.push(0);
    if (name === "scale" && params.length === 1) params.push(params[0] as number);
    if (name === "rotate" && params.length === 1) params.push(0, 0);
    functions.push({ name, params });
    cursor = pattern.lastIndex;
  }
  return functions.length > 0 ? functions : null;
}

function createSvgTransformValueAt(from: string, to: string): (progress: number) => string {
  const fromList = parseSvgTransformList(from);
  const toList = parseSvgTransformList(to);
  const compatible = fromList !== null && toList !== null &&
    fromList.length === toList.length &&
    fromList.every((fn, index) => fn.name === (toList[index] as SvgTransformFunction).name);
  if (!compatible) return (progress) => (progress >= 1 ? to : from);

  return (progress) => {
    if (progress === 0) return from;
    if (progress === 1) return to;
    const parts = fromList.map((fn, index) => {
      const end = (toList[index] as SvgTransformFunction).params;
      const params = fn.params.map((start, paramIndex) => start + ((end[paramIndex] as number) - start) * progress);
      if (!params.every(Number.isFinite)) return null;
      const emitted = fn.name === "rotate" && params[1] === 0 && params[2] === 0 ? params.slice(0, 1) : params;
      return `${fn.name}(${emitted.map(formatNumber).join(" ")})`;
    });
    return parts.includes(null) ? (progress >= 1 ? to : from) : parts.join(" ");
  };
}
function createValueAt(from: string, to: string): (progress: number) => string {
  const fromParsed = parseValue(from);
  const toParsed = parseValue(to);
  const isNumericInterpolable =
    fromParsed.numbers.length > 0 &&
    fromParsed.numbers.length === toParsed.numbers.length &&
    fromParsed.numbers.every(Number.isFinite) &&
    toParsed.numbers.every(Number.isFinite) &&
    fromParsed.parts.every((part, index) => part === toParsed.parts[index]);
  const fromColor = parseColor(from);
  const toColor = parseColor(to);
  const looksLikeColor = (value: string): boolean => /^\s*(?:#|rgba?\s*\()/i.test(value);

  if ((looksLikeColor(from) || looksLikeColor(to)) && !(fromColor && toColor && isNumericInterpolable)) {
    if (!fromColor || !toColor) {
      return (progress) => (progress >= 1 ? to : from);
    }

    const hasAlpha = fromColor.hasAlpha || toColor.hasAlpha;
    const channelsAsPercent = fromColor.channelsAsPercent && toColor.channelsAsPercent;
    return (progress) => {
      if (progress === 0) return from;
      if (progress === 1) return to;
      const channels = fromColor.channels.map((start, index) => {
        const end = toColor.channels[index] as number;
        const value = start + (end - start) * progress;
        return index < 3 && channelsAsPercent ? value / 2.55 : value;
      });
      if (!channels.every(Number.isFinite)) return progress >= 1 ? to : from;
      const [red, green, blue, alpha] = channels as [number, number, number, number];
      const colorChannels = channelsAsPercent
        ? `${formatNumber(red)}%, ${formatNumber(green)}%, ${formatNumber(blue)}%`
        : `${formatNumber(red)}, ${formatNumber(green)}, ${formatNumber(blue)}`;
      return hasAlpha
        ? `rgba(${colorChannels}, ${formatNumber(alpha)})`
        : `rgb(${colorChannels})`;
    };
  }

  if (!isNumericInterpolable) {
    return (progress) => (progress >= 1 ? to : from);
  }

  return (progress) => {
    if (progress === 0) return from;
    if (progress === 1) return to;
    let result = fromParsed.parts[0] as string;
    const values: number[] = [];
    fromParsed.numbers.forEach((start, index) => {
      const end = toParsed.numbers[index] as number;
      values.push(start + (end - start) * progress);
    });
    if (!values.every(Number.isFinite)) return progress >= 1 ? to : from;
    values.forEach((value, index) => {
      result += formatNumber(value) + fromParsed.parts[index + 1];
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

function buildPropertyAnimations(
  properties: AnimatableProperties,
  propertyEasing: DOMAnimationOptions["propertyEasing"],
  propertyKeyframeOffsets: DOMAnimationOptions["propertyKeyframeOffsets"],
  defaultEasing: EasingFunction,
  propertyDelay: AnimationOptions["propertyDelay"],
  propertyDuration: AnimationOptions["propertyDuration"],
  defaultDuration: number,
  svgOnly = false,
): { animations: PropertyAnimation[]; duration: number } {
  const entries = Object.entries(properties);
  if (entries.length === 0) {
    throw new TypeError("animate() requires at least one property to animate");
  }
  if (
    propertyKeyframeOffsets !== undefined &&
    (typeof propertyKeyframeOffsets !== "object" || propertyKeyframeOffsets === null || Array.isArray(propertyKeyframeOffsets))
  ) {
    throw new TypeError("propertyKeyframeOffsets must be an object keyed by property name");
  }
  const propertyNames = new Set(entries.map(([name]) => name));
  for (const name of Object.keys(propertyKeyframeOffsets ?? {})) {
    if (!propertyNames.has(name)) {
      throw new TypeError(`propertyKeyframeOffsets["${name}"] does not match an animated property`);
    }
  }

  const animations = entries.map(([name, range]) => {
    if (!Array.isArray(range) || range.length < 2) {
      throw new TypeError(`Property "${name}" must contain at least two keyframe values`);
    }
    const keyframes = range.map((value) => toCssString(name, value));
    const offsets = propertyKeyframeOffsets?.[name] ?? keyframes.map((_, index) => index / (keyframes.length - 1));
    if (!Array.isArray(offsets) || offsets.length !== keyframes.length) {
      throw new TypeError(
        `propertyKeyframeOffsets["${name}"] must contain one offset for each of its ${keyframes.length} keyframes`,
      );
    }
    offsets.forEach((offset, index) => {
      if (typeof offset !== "number" || !Number.isFinite(offset) || offset < 0 || offset > 1) {
        throw new RangeError(`propertyKeyframeOffsets["${name}"][${index}] must be a finite number between 0 and 1`);
      }
      if (index > 0 && offset <= (offsets[index - 1] as number)) {
        throw new RangeError(`propertyKeyframeOffsets["${name}"] must be strictly increasing`);
      }
    });
    const interpolate = svgOnly && name === "transform" ? createSvgTransformValueAt : createValueAt;
    const segments = keyframes.slice(0, -1).map((from, index) =>
      interpolate(from, keyframes[index + 1] as string),
    );
    const segmentCount = segments.length;
    const delay = propertyDelay?.[name] ?? 0;
    const duration = propertyDuration?.[name] ?? defaultDuration;
    assertPropertyTiming(`propertyDelay["${name}"]`, delay);
    assertPropertyTiming(`propertyDuration["${name}"]`, duration);
    const endTime = delay + duration;
    if (!Number.isFinite(endTime)) {
      throw new RangeError(`propertyDelay["${name}"] + propertyDuration["${name}"] must be finite`);
    }
    return {
      name,
      from: keyframes[0] as string,
      easing: propertyEasing?.[name] === undefined
        ? defaultEasing
        : resolveEasing(propertyEasing[name]),
      delay,
      duration,
      valueAt: (progress: number) => {
        const firstOffset = offsets[0] as number;
        const lastOffset = offsets[segmentCount] as number;
        if (progress < firstOffset) {
          if (firstOffset > 0) return (segments[0] as (progress: number) => string)(0);
          const nextOffset = offsets[1] as number;
          return (segments[0] as (progress: number) => string)(progress / nextOffset);
        }
        if (progress > lastOffset) {
          if (lastOffset < 1) return (segments[segmentCount - 1] as (progress: number) => string)(1);
          const previousOffset = offsets[segmentCount - 1] as number;
          return (segments[segmentCount - 1] as (progress: number) => string)(
            (progress - previousOffset) / (lastOffset - previousOffset),
          );
        }
        if (progress === firstOffset) return (segments[0] as (progress: number) => string)(0);
        if (progress === lastOffset) {
          return (segments[segmentCount - 1] as (progress: number) => string)(1);
        }
        let segmentIndex = 0;
        while (segmentIndex < segmentCount - 1 && progress > (offsets[segmentIndex + 1] as number)) {
          segmentIndex += 1;
        }
        const segmentStart = offsets[segmentIndex] as number;
        const segmentEnd = offsets[segmentIndex + 1] as number;
        const segmentProgress = (progress - segmentStart) / (segmentEnd - segmentStart);
        return (segments[segmentIndex] as (progress: number) => string)(segmentProgress);
      },
    };
  });
  return {
    animations,
    duration: animations.reduce((maximum, animation) => Math.max(maximum, animation.delay + animation.duration), 0),
  };
}

function assertPropertyTiming(name: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number >= 0, received ${String(value)}`);
  }
}

function validatePropertyTimingMap(
  name: string,
  values: AnimationOptions["propertyDelay"] | AnimationOptions["propertyDuration"],
): void {
  if (values === undefined) return;
  if (typeof values !== "object" || values === null || Array.isArray(values)) {
    throw new TypeError(`${name} must be an object keyed by property name`);
  }
  for (const [property, value] of Object.entries(values)) {
    assertPropertyTiming(`${name}["${property}"]`, value);
  }
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function isSVGElement(value: unknown): value is SVGElement {
  return typeof SVGElement !== "undefined" && value instanceof SVGElement;
}

function isAnimatableElement(value: unknown): value is HTMLElement | SVGElement {
  return isHTMLElement(value) || isSVGElement(value);
}

function resolveElementTargets(
  target: AnimateTarget,
  includeSVG: boolean,
): (HTMLElement | SVGElement)[] {
  if (typeof target !== "string") {
    if (!isHTMLElement(target) && (!includeSVG || !isSVGElement(target))) {
      throw new TypeError("animate() target must be an HTMLElement, SVGElement, or a CSS selector string");
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
  return includeSVG
    ? Array.from(matches).filter(isAnimatableElement)
    : Array.from(matches).filter(isHTMLElement);
}

export function resolveTargets(target: AnimateTarget): HTMLElement[] {
  return resolveElementTargets(target, false).filter(isHTMLElement);
}

/**
 * Animates CSS properties of HTML elements and attributes of SVG elements.
 *
 * - Only the listed properties are written (via `style.setProperty`); other inline
 *   styles are untouched.
 * - With the default fill behavior, `from` values are applied synchronously and
 *   the exact `to` values remain on completion. Explicit fill modes can restore
 *   original inline styles or SVG attributes outside the active interval.
 * - With the default fill behavior, `cancel()` leaves current values in place.
 * - A selector that matches no animatable element is not an error: nothing is animated,
 *   no callbacks fire, and no-op controls are returned.
 * - `repeat` replays the animation the requested number of additional times; `Infinity` loops forever.
 * - `yoyo` reverses direction at each repeat boundary.
 * - Throws `SyntaxError` for an invalid selector, and `TypeError` for an invalid
 *   target or property definition. Invalid duration/delay throw `RangeError`.
 */
export function animate(
  target: AnimateTarget,
  properties: AnimatableProperties,
  options: DOMAnimationOptions = {},
): AnimationControls {
  const {
    respectReducedMotion = true,
    propertyEasing,
    propertyKeyframeOffsets,
    propertyDelay,
    propertyDuration,
    fill,
    ...engineOptions
  } = options;
  if (fill !== undefined && !["none", "forwards", "backwards", "both"].includes(fill)) {
    throw new TypeError(`fill must be "none", "forwards", "backwards", or "both", received ${String(fill)}`);
  }
  const onUpdate = engineOptions.onUpdate;
  const defaultEasing = resolveEasing(engineOptions.easing);
  const requestedDuration = engineOptions.duration ?? DEFAULT_ANIMATION_DURATION_MS;
  if (propertyDelay !== undefined || propertyDuration !== undefined) {
    assertPropertyTiming("duration", requestedDuration);
    validatePropertyTimingMap("propertyDelay", propertyDelay);
    validatePropertyTimingMap("propertyDuration", propertyDuration);
  }

  const elements = resolveElementTargets(target, true);
  const { animations, duration } = buildPropertyAnimations(
    properties,
    propertyEasing,
    propertyKeyframeOffsets,
    defaultEasing,
    propertyDelay,
    propertyDuration,
    requestedDuration,
    elements.length > 0 && elements.every(isSVGElement),
  );
  const animationOptions = {
    ...engineOptions,
    duration: propertyDelay === undefined && propertyDuration === undefined ? engineOptions.duration : duration,
  };

  if (elements.length === 0) {
    // Reuse the engine's duration/delay validation so errors don't depend on matches.
    const controls = animateProgress({
      ...animationOptions,
      onStart: undefined,
      onUpdate: undefined,
      onComplete: undefined,
      onCancel: undefined,
    });
    controls.cancel();
    return controls;
  }

  const owner = {};
  const ownerOrder = ++nextAnimationOrder;
  let released = false;
  const release = (commit: boolean): void => {
    if (released) return;
    released = true;
    for (const animation of animations) {
      for (const element of elements) {
        releaseAnimatedProperty(element, animation.name, owner, ownerOrder, commit);
      }
    }
  };

  const write = (valueFor: (animation: PropertyAnimation) => string | null | undefined): void => {
    for (const animation of animations) {
      const value = valueFor(animation);
      if (value === undefined) continue;
      for (const element of elements) {
        if (value === null) {
          releaseAnimatedProperty(element, animation.name, owner, ownerOrder, false);
          continue;
        }
        applyAnimatedProperty(element, animation.name, owner, ownerOrder, value);
      }
    }
  };

  const reduceMotion = respectReducedMotion && prefersReducedMotion();

  const controls = animateProgress({
    ...animationOptions,
    easing: (progress) => progress,
    respectReducedMotion,
    ...(reduceMotion ? { duration: 0, delay: 0 } : {}),
    onStart: () => {
      try {
        engineOptions.onStart?.();
      } catch (error) {
        release(fill === undefined);
        throw error;
      }
    },
    onUpdate: (progress) => {
      try {
        const globalProgress = reduceMotion ? progress : defaultEasing(progress);
        write((animation) => {
          const elapsed = progress * duration;
          const startsAt = animation.delay;
          const endsAt = animation.delay + animation.duration;
          const before = !reduceMotion && elapsed < startsAt;
          const after = !reduceMotion && elapsed > endsAt;
          if (fill !== undefined && before && fill !== "backwards" && fill !== "both") return null;
          if (fill !== undefined && after && fill !== "forwards" && fill !== "both") return null;
          if (before) return animation.from;
          if (after) return animation.valueAt(1);
          const localProgress = reduceMotion
            ? 1
            : animation.duration === 0
              // A zero-length engine (e.g. scrubbing via seek) keeps the seeked progress.
              ? duration === 0 ? progress : Number(elapsed >= animation.delay)
              : Math.min(1, Math.max(0, (elapsed - animation.delay) / animation.duration));
          const propertyProgress = reduceMotion ? localProgress : animation.easing(localProgress);
          return Number.isFinite(propertyProgress) ? animation.valueAt(propertyProgress) : undefined;
        });
        onUpdate?.(globalProgress);
      } catch (error) {
        release(fill === undefined);
        throw error;
      }
    },
    onComplete: () => {
      release(fill === undefined || fill === "forwards" || fill === "both");
      engineOptions.onComplete?.();
    },
    onCancel: () => {
      release(fill === undefined);
      engineOptions.onCancel?.();
    },
  });

  if (!reduceMotion && (fill === undefined || fill === "backwards" || fill === "both")) {
    write((animation) => animation.from);
  }

  return controls;
}
