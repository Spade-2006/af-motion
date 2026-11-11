/**
 * AF Motion Path Parser & Normalizer
 *
 * Normalizes SVG path strings, 2D/3D waypoints, and segment definitions
 * into unified, continuous 2D/3D motion path segments.
 */

import { parseSVGPath } from "../svg-morph/parser.js";
import { toCanonicalSubpaths } from "../svg-morph/normalize.js";
import { distance, toPoint3D } from "./vector3.js";
import { waypointsToCubicSegments } from "./segments.js";
import type {
  MotionPathBounds,
  MotionPathDefinition,
  MotionPathOptions,
  MotionPathSegment,
  MotionPathSegmentDefinition,
  PathPoint3D,
  PathPointInput,
} from "./types.js";

/**
 * Computes axis-aligned bounding box across all segments.
 */
export function computePathBounds(segments: ReadonlyArray<MotionPathSegment>): MotionPathBounds {
  if (segments.length === 0) {
    const zero = { x: 0, y: 0, z: 0 };
    return { min: zero, max: zero };
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  function updatePoint(p: PathPoint3D): void {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
    if (p.z > maxZ) maxZ = p.z;
  }

  for (const seg of segments) {
    updatePoint(seg.start);
    updatePoint(seg.end);
    for (const cp of seg.controlPoints) {
      updatePoint(cp);
    }
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

/**
 * Parses an SVG path string into cubic and line segments.
 */
export function parseSVGPathToSegments(d: string): {
  segments: MotionPathSegment[];
  isClosed: boolean;
} {
  const commands = parseSVGPath(d);
  const subpaths = toCanonicalSubpaths(commands);

  const segments: MotionPathSegment[] = [];
  let isClosed = false;

  for (const subpath of subpaths) {
    let currentPoint: PathPoint3D = { x: 0, y: 0, z: 0 };
    let startPoint: PathPoint3D = { x: 0, y: 0, z: 0 };

    for (const seg of subpath.segments) {
      if (seg.type === "M") {
        currentPoint = { x: seg.point[0], y: seg.point[1], z: 0 };
        startPoint = { ...currentPoint };
      } else if (seg.type === "C") {
        const cp1: PathPoint3D = { x: seg.cp1[0], y: seg.cp1[1], z: 0 };
        const cp2: PathPoint3D = { x: seg.cp2[0], y: seg.cp2[1], z: 0 };
        const end: PathPoint3D = { x: seg.end[0], y: seg.end[1], z: 0 };

        segments.push({
          type: "cubic",
          start: currentPoint,
          end,
          controlPoints: [cp1, cp2],
          length: 0,
          startDistance: 0,
          endDistance: 0,
        });

        currentPoint = end;
      } else if (seg.type === "Z") {
        isClosed = true;
        if (distance(currentPoint, startPoint) > 1e-6) {
          segments.push({
            type: "line",
            start: currentPoint,
            end: { ...startPoint },
            controlPoints: [],
            length: 0,
            startDistance: 0,
            endDistance: 0,
          });
          currentPoint = { ...startPoint };
        }
      }
    }

    if (subpath.isClosed) {
      isClosed = true;
    }
  }

  return { segments, isClosed };
}

/**
 * Normalizes any MotionPathDefinition into segments and metadata.
 */
export function parseMotionPath(
  definition: MotionPathDefinition,
  options: MotionPathOptions = {}
): {
  segments: MotionPathSegment[];
  is3D: boolean;
  isClosed: boolean;
} {
  // If already a compiled MotionPath
  if (typeof definition === "object" && definition !== null && "segments" in definition && "totalLength" in definition) {
    const existing = definition as unknown as {
      segments: ReadonlyArray<MotionPathSegment>;
      is3D: boolean;
      isClosed: boolean;
    };
    return {
      segments: [...existing.segments],
      is3D: existing.is3D,
      isClosed: existing.isClosed,
    };
  }

  // If SVG path string
  if (typeof definition === "string") {
    const { segments, isClosed } = parseSVGPathToSegments(definition);
    return {
      segments,
      is3D: options.is3D ?? false,
      isClosed: options.closed ?? isClosed,
    };
  }

  // If array of segment definitions
  if (Array.isArray(definition) && definition.length > 0 && typeof definition[0] === "object" && "type" in definition[0]!) {
    const defs = definition as ReadonlyArray<MotionPathSegmentDefinition>;
    let is3D = options.is3D ?? false;
    const segments: MotionPathSegment[] = [];

    for (const def of defs) {
      const start = toPoint3D(def.start);
      const end = toPoint3D(def.end);
      const controlPoints = (def.controlPoints ?? []).map(toPoint3D);

      if (start.z !== 0 || end.z !== 0 || controlPoints.some((cp) => cp.z !== 0)) {
        is3D = true;
      }

      segments.push({
        type: def.type,
        start,
        end,
        controlPoints,
        length: 0,
        startDistance: 0,
        endDistance: 0,
      });
    }

    return {
      segments,
      is3D,
      isClosed: options.closed ?? false,
    };
  }

  // If array of waypoints / point inputs
  if (Array.isArray(definition)) {
    const pts = (definition as ReadonlyArray<PathPointInput>).map(toPoint3D);
    let is3D = options.is3D ?? false;
    for (const p of pts) {
      if (p.z !== 0) is3D = true;
    }

    const closed = options.closed ?? false;
    const segments = waypointsToCubicSegments(pts, closed, options.tension ?? 0.5);

    return {
      segments,
      is3D,
      isClosed: closed,
    };
  }

  throw new TypeError("Invalid motion path definition: expected SVG string, waypoint array, or segment array");
}
