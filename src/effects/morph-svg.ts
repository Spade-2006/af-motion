import { animateProgress } from "../core/animation.js";
import type { AnimationControls, AnimationOptions } from "../core/animation.js";

export type MorphSVGTarget = SVGElement | string;

export interface MorphSVGOptions extends AnimationOptions {}

export interface MorphSVGControls extends AnimationControls {
  /** Cancels active morphs and restores each path's original `d` attribute. */
  destroy(): void;
}

interface SVGPathLike extends SVGElement {
  tagName: string;
}

interface PathToken {
  kind: "command" | "number";
  raw: string;
  start: number;
  end: number;
  value?: number;
}

const TOKEN_PATTERN = /[a-zA-Z]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/g;
const COMMANDS = new Set("MmZzLlHhVvCcSsQqTtAa".split(""));

function isPathElement(element: Element): element is SVGPathLike {
  return (
    (typeof SVGPathElement !== "undefined" && element instanceof SVGPathElement) ||
    element.tagName.toLowerCase() === "path"
  );
}

function resolvePaths(target: MorphSVGTarget): SVGPathLike[] {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error(`Cannot resolve selector "${target}": document is not available`);
    }
    let matches: NodeListOf<Element>;
    try {
      matches = document.querySelectorAll(target);
    } catch (error) {
      throw new SyntaxError(`Invalid CSS selector "${target}"`, { cause: error });
    }
    return Array.from(matches).flatMap((element) =>
      isPathElement(element)
        ? [element]
        : Array.from(element.querySelectorAll("path")).filter(isPathElement),
    );
  }

  if (typeof SVGElement !== "undefined" && !(target instanceof SVGElement)) {
    throw new TypeError("morphSVG() target must be an SVGElement or a CSS selector string");
  }
  return isPathElement(target)
    ? [target]
    : Array.from(target.querySelectorAll("path")).filter(isPathElement);
}

function tokenizePath(data: string, label: string): PathToken[] {
  const tokens: PathToken[] = [];
  let cursor = 0;
  for (const match of data.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    if (!/^[\s,]*$/.test(data.slice(cursor, start))) {
      throw new TypeError(`Invalid SVG path data in ${label}`);
    }
    const raw = match[0];
    if (COMMANDS.has(raw)) {
      tokens.push({ kind: "command", raw, start, end: start + raw.length });
    } else {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new TypeError(`Invalid SVG path number in ${label}`);
      tokens.push({ kind: "number", raw, start, end: start + raw.length, value });
    }
    cursor = start + raw.length;
  }
  if (!tokens.length || !/^[\s,]*$/.test(data.slice(cursor))) {
    throw new TypeError(`Invalid SVG path data in ${label}`);
  }
  if (tokens[0]?.kind !== "command") {
    throw new TypeError(`SVG path data in ${label} must start with a command`);
  }
  return tokens;
}

function formatNumber(value: number): string {
  const scaled = value * 1e6;
  return Number.isFinite(scaled) ? String(Math.round(scaled) / 1e6) : String(value);
}

type NormalizedType = "M" | "L" | "C" | "Q" | "A" | "Z";

interface NormalizedSegment {
  type: NormalizedType;
  values: number[];
}

const PARAMETER_COUNTS: Record<string, number> = {
  m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0,
};

/**
 * Converts path data into absolute M/L/C/Q/A/Z segments: relative commands become absolute,
 * H/V become L, S/T are expanded with their reflected control point, and implicit
 * command repetition is made explicit.
 */
function normalizePath(data: string, label: string): NormalizedSegment[] {
  const tokens = tokenizePath(data, label);
  const segments: NormalizedSegment[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lastCubic: [number, number] | null = null;
  let lastQuad: [number, number] | null = null;
  const malformed = (): never => {
    throw new TypeError(`Invalid SVG path data in ${label}`);
  };

  let index = 0;
  while (index < tokens.length) {
    const commandToken = tokens[index] as PathToken;
    if (commandToken.kind !== "command") malformed();
    index += 1;
    const letter = commandToken.raw;
    const lower = letter.toLowerCase();
    const relative = letter === lower;
    const count = PARAMETER_COUNTS[lower] as number;
    const numbers: number[] = [];
    while (index < tokens.length && tokens[index]?.kind === "number") {
      numbers.push((tokens[index] as PathToken).value as number);
      index += 1;
    }

    if (lower === "z") {
      if (numbers.length > 0) malformed();
      segments.push({ type: "Z", values: [] });
      cx = sx;
      cy = sy;
      lastCubic = null;
      lastQuad = null;
      continue;
    }
    if (numbers.length === 0 || numbers.length % count !== 0) malformed();

    for (let offset = 0; offset < numbers.length; offset += count) {
      const n = numbers.slice(offset, offset + count);
      const ox = relative ? cx : 0;
      const oy = relative ? cy : 0;
      let cubic: [number, number] | null = null;
      let quad: [number, number] | null = null;
      switch (lower) {
        case "m": {
          const x = (n[0] as number) + ox;
          const y = (n[1] as number) + oy;
          // Extra coordinate pairs after a moveto are implicit lineto commands.
          segments.push({ type: offset === 0 ? "M" : "L", values: [x, y] });
          cx = x;
          cy = y;
          if (offset === 0) {
            sx = x;
            sy = y;
          }
          break;
        }
        case "l":
        case "h":
        case "v": {
          const x = lower === "v" ? cx : (n[0] as number) + ox;
          const y = lower === "h" ? cy : (n[lower === "v" ? 0 : 1] as number) + oy;
          segments.push({ type: "L", values: [x, y] });
          cx = x;
          cy = y;
          break;
        }
        case "c":
        case "s": {
          let v: number[];
          if (lower === "c") {
            v = [
              (n[0] as number) + ox, (n[1] as number) + oy,
              (n[2] as number) + ox, (n[3] as number) + oy,
              (n[4] as number) + ox, (n[5] as number) + oy,
            ];
          } else {
            const [rx, ry] = lastCubic ? [2 * cx - lastCubic[0], 2 * cy - lastCubic[1]] : [cx, cy];
            v = [
              rx, ry,
              (n[0] as number) + ox, (n[1] as number) + oy,
              (n[2] as number) + ox, (n[3] as number) + oy,
            ];
          }
          segments.push({ type: "C", values: v });
          cubic = [v[2] as number, v[3] as number];
          cx = v[4] as number;
          cy = v[5] as number;
          break;
        }
        case "q":
        case "t": {
          let v: number[];
          if (lower === "q") {
            v = [
              (n[0] as number) + ox, (n[1] as number) + oy,
              (n[2] as number) + ox, (n[3] as number) + oy,
            ];
          } else {
            const [rx, ry] = lastQuad ? [2 * cx - lastQuad[0], 2 * cy - lastQuad[1]] : [cx, cy];
            v = [rx, ry, (n[0] as number) + ox, (n[1] as number) + oy];
          }
          segments.push({ type: "Q", values: v });
          quad = [v[0] as number, v[1] as number];
          cx = v[2] as number;
          cy = v[3] as number;
          break;
        }
        default: {
          const largeArc = n[3] as number;
          const sweep = n[4] as number;
          if ((largeArc !== 0 && largeArc !== 1) || (sweep !== 0 && sweep !== 1)) malformed();
          const x = (n[5] as number) + ox;
          const y = (n[6] as number) + oy;
          segments.push({ type: "A", values: [n[0] as number, n[1] as number, n[2] as number, largeArc, sweep, x, y] });
          cx = x;
          cy = y;
        }
      }
      lastCubic = cubic;
      lastQuad = quad;
    }
  }

  if (segments[0]?.type !== "M") malformed();
  if (!segments.every((segment) => segment.values.every(Number.isFinite))) malformed();
  return segments;
}

function formatSegments(segments: NormalizedSegment[], fromSegments: NormalizedSegment[], toSegments: NormalizedSegment[], progress: number): string {
  return segments.map((segment, index) => {
    if (segment.type === "Z") return "Z";
    const from = (fromSegments[index] as NormalizedSegment).values;
    const to = (toSegments[index] as NormalizedSegment).values;
    const values = from.map((start, valueIndex) => {
      const isFlag = segment.type === "A" && (valueIndex === 3 || valueIndex === 4);
      const end = to[valueIndex] as number;
      return formatNumber(isFlag ? start : start + (end - start) * progress);
    });
    return `${segment.type} ${values.join(" ")}`;
  }).join(" ");
}

function createNormalizedMorphValue(from: string, to: string): (progress: number) => string {
  const fromSegments = normalizePath(from, "source");
  const toSegments = normalizePath(to, "target");
  const compatible =
    fromSegments.length === toSegments.length &&
    fromSegments.every((segment, index) => {
      const other = toSegments[index] as NormalizedSegment;
      if (segment.type !== other.type) return false;
      return segment.type !== "A" ||
        (segment.values[3] === other.values[3] && segment.values[4] === other.values[4]);
    });
  if (!compatible) {
    throw new TypeError(
      "Incompatible SVG path data: command structure and numeric token positions must match",
    );
  }
  return (progress) => {
    if (progress === 0) return from;
    if (progress === 1) return to;
    return formatSegments(fromSegments, fromSegments, toSegments, progress);
  };
}

function createMorphValue(from: string, to: string): (progress: number) => string {
  const fromTokens = tokenizePath(from, "source");
  const toTokens = tokenizePath(to, "target");
  const hasArc = fromTokens.some((token) => token.kind === "command" && token.raw.toLowerCase() === "a");
  if (
    hasArc ||
    fromTokens.length !== toTokens.length ||
    fromTokens.some((token, index) => token.kind !== toTokens[index]?.kind ||
      (token.kind === "command" && token.raw !== toTokens[index]?.raw))
  ) {
    // Differently written but equivalent paths (relative/absolute, H/V, S/T, implicit repeats),
    // and arcs, whose 0/1 flags must never be interpolated.
    return createNormalizedMorphValue(from, to);
  }

  return (progress) => {
    if (progress === 0) return from;
    if (progress === 1) return to;
    let result = "";
    let cursor = 0;
    for (const [index, token] of fromTokens.entries()) {
      result += from.slice(cursor, token.start);
      if (token.kind === "command") {
        result += token.raw;
      } else {
        const end = toTokens[index]?.value as number;
        const start = token.value as number;
        result += formatNumber(start + (end - start) * progress);
      }
      cursor = token.end;
    }
    return result + from.slice(cursor);
  };
}
function inertControls(playbackRate: number | undefined): MorphSVGControls {
  return {
    seek: () => undefined,
    pause: () => undefined,
    resume: () => undefined,
    reverse: () => undefined,
    setPlaybackRate: () => undefined,
    getPlaybackRate: () => playbackRate ?? 1,
    cancel: () => undefined,
    destroy: () => undefined,
  };
}

/**
 * Morphs compatible SVG path data. Identical command structures interpolate token by token;
 * otherwise both paths are normalized to absolute M/L/C/Q/A/Z segments (relative commands, H/V,
 * S/T, and implicit repeats) and must then match segment by segment. Incompatible structures
 * are rejected instead of approximated.
 */
export function morphSVG(
  target: MorphSVGTarget,
  toPath: string,
  options: MorphSVGOptions = {},
): MorphSVGControls {
  if (typeof toPath !== "string" || toPath.trim() === "") {
    throw new TypeError("toPath must be a non-empty SVG path data string");
  }
  const paths = Array.from(new Set(resolvePaths(target)));
  if (paths.length === 0) {
    const validation = animateProgress({
      ...options,
      onStart: undefined,
      onUpdate: undefined,
      onComplete: undefined,
      onCancel: undefined,
    });
    validation.cancel();
    return inertControls(options.playbackRate);
  }

  const morphs = new Map<SVGPathLike, (progress: number) => string>();
  const originals = new Map<SVGPathLike, string>();
  for (const path of paths) {
    const original = path.getAttribute("d");
    if (original === null || original.trim() === "") {
      throw new TypeError("SVG path target must have a non-empty d attribute");
    }
    originals.set(path, original);
    morphs.set(path, createMorphValue(original, toPath));
  }

  const controls: AnimationControls[] = [];
  let cancelled = false;
  let destroyed = false;
  let started = false;
  let completed = 0;
  const {
    onStart,
    onUpdate,
    onComplete,
    onCancel,
    ...animationOptions
  } = options;

  for (const [path, valueAt] of morphs) {
    path.setAttribute("d", originals.get(path) as string);
    try {
      controls.push(animateProgress({
        ...animationOptions,
        onStart: () => {
          if (started) return;
          started = true;
          onStart?.();
        },
        onUpdate: (progress) => {
          if (Number.isFinite(progress)) path.setAttribute("d", valueAt(progress));
          onUpdate?.(progress);
        },
        onComplete: () => {
          completed += 1;
          if (completed === morphs.size && !cancelled && !destroyed) onComplete?.();
        },
      }));
    } catch (error) {
      for (const control of controls) control.cancel();
      for (const [originalPath, original] of originals) originalPath.setAttribute("d", original);
      throw error;
    }
  }

  const destroy = (): void => {
    if (destroyed) return;
    destroyed = true;
    cancelled = true;
    for (const control of controls) control.cancel();
    for (const [path, original] of originals) path.setAttribute("d", original);
  };

  return {
    seek: (progress) => controls.forEach((control) => control.seek(progress)),
    pause: () => controls.forEach((control) => control.pause()),
    resume: () => controls.forEach((control) => control.resume()),
    reverse: () => controls.forEach((control) => control.reverse()),
    setPlaybackRate: (rate) => controls.forEach((control) => control.setPlaybackRate(rate)),
    getPlaybackRate: () => controls[0]?.getPlaybackRate() ?? options.playbackRate ?? 1,
    cancel: () => {
      if (cancelled || destroyed || completed === morphs.size) return;
      cancelled = true;
      controls.forEach((control) => control.cancel());
      onCancel?.();
    },
    destroy,
  };
}
