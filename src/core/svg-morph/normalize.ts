/**
 * AF Motion SVG Path Normalization Engine
 *
 * Converts arbitrary SVG path commands into canonical Cubic Bézier segments,
 * performs de Casteljau curve subdivision for segment-count alignment,
 * aligns subpaths, and optimizes starting points on closed loops.
 */

import { parseSVGPath } from "./parser.js";
import { arcToCubic } from "./arc-to-cubic.js";
import { svgElementToPath } from "./shapes.js";
import type {
  CanonicalSegment,
  CanonicalSubpath,
  CubicSegment,
  MoveSegment,
  NormalizedPath,
  NormalizeOptions,
  SVGPointTuple,
  SVGPathCommand,
} from "./types.js";

type Point2D = SVGPointTuple;

/**
 * Splits a single cubic Bézier curve at parameter t = 0.5 using de Casteljau's algorithm.
 */
export function splitCubicAtHalf(
  start: Point2D,
  cubic: CubicSegment
): [CubicSegment, CubicSegment] {
  const [x0, y0] = start;
  const [x1, y1] = cubic.cp1;
  const [x2, y2] = cubic.cp2;
  const [x3, y3] = cubic.end;

  // Midpoints of edges
  const x01 = (x0 + x1) / 2;
  const y01 = (y0 + y1) / 2;
  const x12 = (x1 + x2) / 2;
  const y12 = (y1 + y2) / 2;
  const x23 = (x2 + x3) / 2;
  const y23 = (y2 + y3) / 2;

  // Midpoints of midpoints
  const x012 = (x01 + x12) / 2;
  const y012 = (y01 + y12) / 2;
  const x123 = (x12 + x23) / 2;
  const y123 = (y12 + y23) / 2;

  // Midpoint on curve
  const xMid = (x012 + x123) / 2;
  const yMid = (y012 + y123) / 2;

  const seg1: CubicSegment = {
    type: "C",
    cp1: [x01, y01],
    cp2: [x012, y012],
    end: [xMid, yMid],
  };

  const seg2: CubicSegment = {
    type: "C",
    cp1: [x123, y123],
    cp2: [x23, y23],
    end: [x3, y3],
  };

  return [seg1, seg2];
}

/**
 * Converts a straight line from start to end into a cubic Bézier curve.
 */
function lineToCubic(start: Point2D, end: Point2D): CubicSegment {
  const [x0, y0] = start;
  const [x1, y1] = end;
  return {
    type: "C",
    cp1: [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3],
    cp2: [x0 + (2 * (x1 - x0)) / 3, y0 + (2 * (y1 - y0)) / 3],
    end: [x1, y1],
  };
}

/**
 * Converts quadratic Bézier curve to an exact cubic Bézier curve.
 */
function quadToCubic(start: Point2D, cp: Point2D, end: Point2D): CubicSegment {
  const [x0, y0] = start;
  const [qx, qy] = cp;
  const [x1, y1] = end;

  return {
    type: "C",
    cp1: [x0 + (2 / 3) * (qx - x0), y0 + (2 / 3) * (qy - y0)],
    cp2: [x1 + (2 / 3) * (qx - x1), y1 + (2 / 3) * (qy - y1)],
    end: [x1, y1],
  };
}

/**
 * Converts raw parsed commands into canonical subpaths of M, C, and Z segments.
 */
export function toCanonicalSubpaths(commands: readonly SVGPathCommand[]): CanonicalSubpath[] {
  const subpaths: CanonicalSubpath[] = [];
  let currentSegments: CanonicalSegment[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let lastCubicCp2: Point2D | null = null;
  let lastQuadCp: Point2D | null = null;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const type = cmd.type;
    const lower = type.toLowerCase();
    const isRel = type === lower;
    const p = cmd.params;

    switch (lower) {
      case "m": {
        const x = isRel ? cx + p[0] : p[0];
        const y = isRel ? cy + p[1] : p[1];

        // Start new subpath if segments already exist
        if (currentSegments.length > 0) {
          subpaths.push({
            segments: currentSegments,
            isClosed: currentSegments[currentSegments.length - 1].type === "Z",
          });
          currentSegments = [];
        }

        const moveSeg: MoveSegment = { type: "M", point: [x, y] };
        currentSegments.push(moveSeg);
        cx = x;
        cy = y;
        sx = x;
        sy = y;
        lastCubicCp2 = null;
        lastQuadCp = null;
        break;
      }

      case "l":
      case "h":
      case "v": {
        const x = lower === "v" ? cx : isRel ? cx + p[0] : p[0];
        const y = lower === "h" ? cy : isRel ? cy + p[lower === "v" ? 0 : 1] : p[lower === "v" ? 0 : 1];
        const cubic = lineToCubic([cx, cy], [x, y]);
        currentSegments.push(cubic);
        cx = x;
        cy = y;
        lastCubicCp2 = null;
        lastQuadCp = null;
        break;
      }

      case "c": {
        const ox = isRel ? cx : 0;
        const oy = isRel ? cy : 0;
        const cubic: CubicSegment = {
          type: "C",
          cp1: [p[0] + ox, p[1] + oy],
          cp2: [p[2] + ox, p[3] + oy],
          end: [p[4] + ox, p[5] + oy],
        };
        currentSegments.push(cubic);
        lastCubicCp2 = cubic.cp2;
        cx = cubic.end[0];
        cy = cubic.end[1];
        lastQuadCp = null;
        break;
      }

      case "s": {
        const ox = isRel ? cx : 0;
        const oy = isRel ? cy : 0;
        const cp1: Point2D = lastCubicCp2
          ? [2 * cx - lastCubicCp2[0], 2 * cy - lastCubicCp2[1]]
          : [cx, cy];
        const cubic: CubicSegment = {
          type: "C",
          cp1,
          cp2: [p[0] + ox, p[1] + oy],
          end: [p[2] + ox, p[3] + oy],
        };
        currentSegments.push(cubic);
        lastCubicCp2 = cubic.cp2;
        cx = cubic.end[0];
        cy = cubic.end[1];
        lastQuadCp = null;
        break;
      }

      case "q": {
        const ox = isRel ? cx : 0;
        const oy = isRel ? cy : 0;
        const cp: Point2D = [p[0] + ox, p[1] + oy];
        const end: Point2D = [p[2] + ox, p[3] + oy];
        const cubic = quadToCubic([cx, cy], cp, end);
        currentSegments.push(cubic);
        lastQuadCp = cp;
        cx = end[0];
        cy = end[1];
        lastCubicCp2 = null;
        break;
      }

      case "t": {
        const ox = isRel ? cx : 0;
        const oy = isRel ? cy : 0;
        const cp: Point2D = lastQuadCp
          ? [2 * cx - lastQuadCp[0], 2 * cy - lastQuadCp[1]]
          : [cx, cy];
        const end: Point2D = [p[0] + ox, p[1] + oy];
        const cubic = quadToCubic([cx, cy], cp, end);
        currentSegments.push(cubic);
        lastQuadCp = cp;
        cx = end[0];
        cy = end[1];
        lastCubicCp2 = null;
        break;
      }

      case "a": {
        const ox = isRel ? cx : 0;
        const oy = isRel ? cy : 0;
        const rx = p[0];
        const ry = p[1];
        const angle = p[2];
        const largeArc = p[3];
        const sweep = p[4];
        const endX = p[5] + ox;
        const endY = p[6] + oy;

        const cubics = arcToCubic(cx, cy, rx, ry, angle, largeArc, sweep, endX, endY);
        for (const c of cubics) {
          currentSegments.push(c);
        }
        if (cubics.length > 0) {
          cx = endX;
          cy = endY;
          lastCubicCp2 = cubics[cubics.length - 1].cp2;
        }
        lastQuadCp = null;
        break;
      }

      case "z": {
        // If not at start point, insert connecting cubic
        if (Math.hypot(cx - sx, cy - sy) > 1e-4) {
          currentSegments.push(lineToCubic([cx, cy], [sx, sy]));
        }
        currentSegments.push({ type: "Z" });
        cx = sx;
        cy = sy;
        lastCubicCp2 = null;
        lastQuadCp = null;
        break;
      }
    }
  }

  if (currentSegments.length > 0) {
    subpaths.push({
      segments: currentSegments,
      isClosed: currentSegments[currentSegments.length - 1].type === "Z",
    });
  }

  return subpaths;
}

/**
 * Counts the number of cubic curve segments in a subpath.
 */
function getCubicCount(subpath: CanonicalSubpath): number {
  return subpathsCubics(subpath).length;
}

function subpathsCubics(subpath: CanonicalSubpath): CubicSegment[] {
  return subpath.segments.filter((s): s is CubicSegment => s.type === "C");
}

/**
 * Subdivides a subpath's cubic segments until it contains exactly targetCount cubics.
 */
export function subdivideSubpath(
  subpath: CanonicalSubpath,
  targetCount: number
): CanonicalSubpath {
  const cubics = subpathsCubics(subpath);
  const currentCount = cubics.length;

  if (currentCount >= targetCount || currentCount === 0) {
    return subpath;
  }

  const moveSeg = subpath.segments[0] as MoveSegment;
  const isClosed = subpath.isClosed;

  // We need to add (targetCount - currentCount) subdivisions
  const neededSplits = targetCount - currentCount;

  // Subdivide longer or earlier segments first
  const newCubics: CubicSegment[] = [...cubics];
  let splitsRemaining = neededSplits;

  while (splitsRemaining > 0) {
    // Find segment to split (e.g. longest segment)
    let longestIdx = 0;
    let maxDist = -1;
    let prevPoint = moveSeg.point;

    for (let i = 0; i < newCubics.length; i++) {
      const c = newCubics[i];
      const dist = Math.hypot(c.end[0] - prevPoint[0], c.end[1] - prevPoint[1]);
      if (dist > maxDist) {
        maxDist = dist;
        longestIdx = i;
      }
      prevPoint = c.end;
    }

    // Determine start point of target segment
    let startPt = moveSeg.point;
    for (let i = 0; i < longestIdx; i++) {
      startPt = newCubics[i].end;
    }

    const [part1, part2] = splitCubicAtHalf(startPt, newCubics[longestIdx]);
    newCubics.splice(longestIdx, 1, part1, part2);
    splitsRemaining--;
  }

  const segments: CanonicalSegment[] = [moveSeg, ...newCubics];
  if (isClosed) {
    segments.push({ type: "Z" });
  }

  return {
    segments,
    isClosed,
  };
}

/**
 * Cyclically rotates a closed subpath's segments to minimize distance to a reference subpath.
 */
export function alignClosedSubpathStart(
  target: CanonicalSubpath,
  reference: CanonicalSubpath
): CanonicalSubpath {
  if (!target.isClosed || !reference.isClosed) return target;

  const targetCubics = subpathsCubics(target);
  const refCubics = subpathsCubics(reference);
  const n = targetCubics.length;

  if (n !== refCubics.length || n < 2) return target;

  let bestShift = 0;
  let minCost = Infinity;

  for (let shift = 0; shift < n; shift++) {
    let cost = 0;
    for (let i = 0; i < n; i++) {
      const tSeg = targetCubics[(i + shift) % n];
      const rSeg = refCubics[i];
      cost += Math.hypot(tSeg.end[0] - rSeg.end[0], tSeg.end[1] - rSeg.end[1]);
    }
    if (cost < minCost) {
      minCost = cost;
      bestShift = shift;
    }
  }

  if (bestShift === 0) return target;

  // Reorder target cubics with bestShift
  const rotatedCubics = [
    ...targetCubics.slice(bestShift),
    ...targetCubics.slice(0, bestShift),
  ];

  // The new start point M is the endpoint of the segment right before bestShift
  const newStart = targetCubics[(bestShift - 1 + n) % n].end;

  return {
    segments: [{ type: "M", point: newStart }, ...rotatedCubics, { type: "Z" }],
    isClosed: true,
  };
}

/**
 * Fully normalizes and aligns two paths so they share identical subpath and segment structure.
 */
export function alignPaths(
  pathA: NormalizedPath,
  pathB: NormalizedPath,
  options: NormalizeOptions = {}
): [NormalizedPath, NormalizedPath] {
  const maxSubpaths = Math.max(pathA.subpaths.length, pathB.subpaths.length, 1);
  const alignedSubpathsA: CanonicalSubpath[] = [];
  const alignedSubpathsB: CanonicalSubpath[] = [];

  for (let s = 0; s < maxSubpaths; s++) {
    let subA = pathA.subpaths[s];
    let subB = pathB.subpaths[s];

    // Handle missing subpath with collapsed point
    if (!subA && subB) {
      const center = subB.segments[0].type === "M" ? subB.segments[0].point : [0, 0] as Point2D;
      const count = getCubicCount(subB);
      const cubics: CubicSegment[] = Array.from({ length: count }, () => ({
        type: "C",
        cp1: center,
        cp2: center,
        end: center,
      }));
      subA = {
        segments: [{ type: "M", point: center }, ...cubics, ...(subB.isClosed ? [{ type: "Z" as const }] : [])],
        isClosed: subB.isClosed,
      };
    } else if (!subB && subA) {
      const center = subA.segments[0].type === "M" ? subA.segments[0].point : [0, 0] as Point2D;
      const count = getCubicCount(subA);
      const cubics: CubicSegment[] = Array.from({ length: count }, () => ({
        type: "C",
        cp1: center,
        cp2: center,
        end: center,
      }));
      subB = {
        segments: [{ type: "M", point: center }, ...cubics, ...(subA.isClosed ? [{ type: "Z" as const }] : [])],
        isClosed: subA.isClosed,
      };
    }

    const countA = getCubicCount(subA);
    const countB = getCubicCount(subB);
    const targetCount = Math.max(countA, countB, 1);

    let alignedA = subdivideSubpath(subA, targetCount);
    let alignedB = subdivideSubpath(subB, targetCount);

    if (options.alignStartPoints !== false && alignedA.isClosed && alignedB.isClosed) {
      alignedB = alignClosedSubpathStart(alignedB, alignedA);
    }

    alignedSubpathsA.push(alignedA);
    alignedSubpathsB.push(alignedB);
  }

  const totalSegments = alignedSubpathsA.reduce((sum, sp) => sum + sp.segments.length, 0);

  return [
    { subpaths: alignedSubpathsA, totalSegments },
    { subpaths: alignedSubpathsB, totalSegments },
  ];
}

/**
 * Converts a raw SVG path string or SVG element into a NormalizedPath.
 */
export function normalizeSVGPath(
  input: string | SVGElement,
  options: NormalizeOptions = {}
): NormalizedPath {
  const d = typeof input === "string" ? input : svgElementToPath(input);
  const parsed = parseSVGPath(d);
  const subpaths = toCanonicalSubpaths(parsed);
  const totalSegments = subpaths.reduce((acc, sp) => acc + sp.segments.length, 0);

  return {
    subpaths,
    totalSegments,
  };
}
