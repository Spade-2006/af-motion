/**
 * AF Motion SVG Morph Interpolation Engine
 *
 * Deterministic, high-performance coordinate interpolation between aligned paths
 * with precision formatting and minimal allocation overhead.
 */

import { alignPaths, normalizeSVGPath } from "./normalize.js";
import type {
  CanonicalSegment,
  CubicSegment,
  Morph,
  MorphOptions,
  MoveSegment,
  NormalizedPath,
} from "./types.js";

// Cache for compiled morphs between identical input strings
const morphCache = new Map<string, Morph>();
const MAX_CACHE_ENTRIES = 200;

function formatCoord(val: number, precision: number): string {
  const factor = 10 ** precision;
  const rounded = Math.round(val * factor) / factor;
  return rounded.toString();
}

/**
 * Creates and compiles a Morph structure between two SVG paths or elements.
 */
export function createMorph(
  from: string | SVGElement,
  to: string | SVGElement,
  options: MorphOptions = {}
): Morph {
  const precision = options.precision ?? 3;
  const alignStartPoints = options.alignStartPoints !== false;

  const fromKey = typeof from === "string" ? from : (from.getAttribute("d") || from.outerHTML);
  const toKey = typeof to === "string" ? to : (to.getAttribute("d") || to.outerHTML);
  const cacheKey = `${fromKey}::${toKey}::p${precision}::a${alignStartPoints ? 1 : 0}`;

  const cached = morphCache.get(cacheKey);
  if (cached) return cached;

  const normFrom = normalizeSVGPath(from);
  const normTo = normalizeSVGPath(to);

  const [alignedFrom, alignedTo] = alignPaths(normFrom, normTo, {
    alignStartPoints,
    precision,
  });

  const morph: Morph = {
    from: alignedFrom,
    to: alignedTo,
    precision,
  };

  if (morphCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = morphCache.keys().next().value;
    if (firstKey) morphCache.delete(firstKey);
  }
  morphCache.set(cacheKey, morph);

  return morph;
}

/**
 * Formats a single NormalizedPath into an SVG path `d` string.
 */
export function formatNormalizedPath(path: NormalizedPath, precision = 3): string {
  const chunks: string[] = [];

  for (let s = 0; s < path.subpaths.length; s++) {
    const subpath = path.subpaths[s];
    for (let i = 0; i < subpath.segments.length; i++) {
      const seg = subpath.segments[i];
      if (seg.type === "M") {
        chunks.push(`M ${formatCoord(seg.point[0], precision)} ${formatCoord(seg.point[1], precision)}`);
      } else if (seg.type === "C") {
        const cp1 = `${formatCoord(seg.cp1[0], precision)} ${formatCoord(seg.cp1[1], precision)}`;
        const cp2 = `${formatCoord(seg.cp2[0], precision)} ${formatCoord(seg.cp2[1], precision)}`;
        const end = `${formatCoord(seg.end[0], precision)} ${formatCoord(seg.end[1], precision)}`;
        chunks.push(`C ${cp1} ${cp2} ${end}`);
      } else if (seg.type === "Z") {
        chunks.push("Z");
      }
    }
  }

  return chunks.join(" ");
}

/**
 * Interpolates between two aligned paths at parameter progress (0 to 1).
 */
export function interpolateMorph(morph: Morph, progress: number): string {
  const p = Math.max(0, Math.min(1, progress));
  const precision = morph.precision;

  if (p === 0) {
    return formatNormalizedPath(morph.from, precision);
  }
  if (p === 1) {
    return formatNormalizedPath(morph.to, precision);
  }

  const chunks: string[] = [];
  const fromSubs = morph.from.subpaths;
  const toSubs = morph.to.subpaths;

  for (let s = 0; s < fromSubs.length; s++) {
    const fromSub = fromSubs[s];
    const toSub = toSubs[s];
    if (!toSub) continue;

    for (let i = 0; i < fromSub.segments.length; i++) {
      const fromSeg = fromSub.segments[i];
      const toSeg = toSub.segments[i];
      if (!toSeg || fromSeg.type !== toSeg.type) continue;

      if (fromSeg.type === "M" && toSeg.type === "M") {
        const x = fromSeg.point[0] + (toSeg.point[0] - fromSeg.point[0]) * p;
        const y = fromSeg.point[1] + (toSeg.point[1] - fromSeg.point[1]) * p;
        chunks.push(`M ${formatCoord(x, precision)} ${formatCoord(y, precision)}`);
      } else if (fromSeg.type === "C" && toSeg.type === "C") {
        const cp1x = fromSeg.cp1[0] + (toSeg.cp1[0] - fromSeg.cp1[0]) * p;
        const cp1y = fromSeg.cp1[1] + (toSeg.cp1[1] - fromSeg.cp1[1]) * p;
        const cp2x = fromSeg.cp2[0] + (toSeg.cp2[0] - fromSeg.cp2[0]) * p;
        const cp2y = fromSeg.cp2[1] + (toSeg.cp2[1] - fromSeg.cp2[1]) * p;
        const endx = fromSeg.end[0] + (toSeg.end[0] - fromSeg.end[0]) * p;
        const endy = fromSeg.end[1] + (toSeg.end[1] - fromSeg.end[1]) * p;

        const cp1 = `${formatCoord(cp1x, precision)} ${formatCoord(cp1y, precision)}`;
        const cp2 = `${formatCoord(cp2x, precision)} ${formatCoord(cp2y, precision)}`;
        const end = `${formatCoord(endx, precision)} ${formatCoord(endy, precision)}`;
        chunks.push(`C ${cp1} ${cp2} ${end}`);
      } else if (fromSeg.type === "Z") {
        chunks.push("Z");
      }
    }
  }

  return chunks.join(" ");
}

/**
 * Clears the compiled morph cache.
 */
export function clearMorphCache(): void {
  morphCache.clear();
}
