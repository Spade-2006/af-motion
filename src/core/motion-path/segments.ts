/**
 * AF Motion Path Segment Evaluators
 *
 * Analytical position, velocity (1st derivative), acceleration (2nd derivative),
 * and curvature evaluation for lines, quadratic Béziers, and cubic Béziers.
 */

import { add, cross, distance, length, normalize, scale, sub } from "./vector3.js";
import type { MotionPathSegment, PathPoint3D, PathTangent } from "./types.js";

const EPSILON = 1e-9;

export function evaluateSegmentPoint(segment: MotionPathSegment, t: number): PathPoint3D {
  const clampedT = Math.max(0, Math.min(1, t));

  switch (segment.type) {
    case "line": {
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * clampedT,
        y: segment.start.y + (segment.end.y - segment.start.y) * clampedT,
        z: segment.start.z + (segment.end.z - segment.start.z) * clampedT,
      };
    }
    case "quadratic": {
      const p0 = segment.start;
      const p1 = segment.controlPoints[0] ?? segment.start;
      const p2 = segment.end;
      const u = 1 - clampedT;
      const tt = clampedT * clampedT;
      const uu = u * u;
      const u2t = 2 * u * clampedT;

      return {
        x: uu * p0.x + u2t * p1.x + tt * p2.x,
        y: uu * p0.y + u2t * p1.y + tt * p2.y,
        z: uu * p0.z + u2t * p1.z + tt * p2.z,
      };
    }
    case "cubic": {
      const p0 = segment.start;
      const p1 = segment.controlPoints[0] ?? segment.start;
      const p2 = segment.controlPoints[1] ?? segment.end;
      const p3 = segment.end;
      const u = 1 - clampedT;
      const tt = clampedT * clampedT;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * clampedT;
      const c1 = 3 * uu * clampedT;
      const c2 = 3 * u * tt;

      return {
        x: uuu * p0.x + c1 * p1.x + c2 * p2.x + ttt * p3.x,
        y: uuu * p0.y + c1 * p1.y + c2 * p2.y + ttt * p3.y,
        z: uuu * p0.z + c1 * p1.z + c2 * p2.z + ttt * p3.z,
      };
    }
  }
}

export function evaluateSegmentVelocity(segment: MotionPathSegment, t: number): PathPoint3D {
  const clampedT = Math.max(0, Math.min(1, t));

  switch (segment.type) {
    case "line": {
      return {
        x: segment.end.x - segment.start.x,
        y: segment.end.y - segment.start.y,
        z: segment.end.z - segment.start.z,
      };
    }
    case "quadratic": {
      const p0 = segment.start;
      const p1 = segment.controlPoints[0] ?? segment.start;
      const p2 = segment.end;
      const u = 1 - clampedT;

      return {
        x: 2 * u * (p1.x - p0.x) + 2 * clampedT * (p2.x - p1.x),
        y: 2 * u * (p1.y - p0.y) + 2 * clampedT * (p2.y - p1.y),
        z: 2 * u * (p1.z - p0.z) + 2 * clampedT * (p2.z - p1.z),
      };
    }
    case "cubic": {
      const p0 = segment.start;
      const p1 = segment.controlPoints[0] ?? segment.start;
      const p2 = segment.controlPoints[1] ?? segment.end;
      const p3 = segment.end;
      const u = 1 - clampedT;
      const c0 = 3 * u * u;
      const c1 = 6 * u * clampedT;
      const c2 = 3 * clampedT * clampedT;

      return {
        x: c0 * (p1.x - p0.x) + c1 * (p2.x - p1.x) + c2 * (p3.x - p2.x),
        y: c0 * (p1.y - p0.y) + c1 * (p2.y - p1.y) + c2 * (p3.y - p2.y),
        z: c0 * (p1.z - p0.z) + c1 * (p2.z - p1.z) + c2 * (p3.z - p2.z),
      };
    }
  }
}

export function evaluateSegmentAcceleration(segment: MotionPathSegment, t: number): PathPoint3D {
  const clampedT = Math.max(0, Math.min(1, t));

  switch (segment.type) {
    case "line":
      return { x: 0, y: 0, z: 0 };
    case "quadratic": {
      const p0 = segment.start;
      const p1 = segment.controlPoints[0] ?? segment.start;
      const p2 = segment.end;

      return {
        x: 2 * (p2.x - 2 * p1.x + p0.x),
        y: 2 * (p2.y - 2 * p1.y + p0.y),
        z: 2 * (p2.z - 2 * p1.z + p0.z),
      };
    }
    case "cubic": {
      const p0 = segment.start;
      const p1 = segment.controlPoints[0] ?? segment.start;
      const p2 = segment.controlPoints[1] ?? segment.end;
      const p3 = segment.end;
      const u = 1 - clampedT;

      return {
        x: 6 * u * (p2.x - 2 * p1.x + p0.x) + 6 * clampedT * (p3.x - 2 * p2.x + p1.x),
        y: 6 * u * (p2.y - 2 * p1.y + p0.y) + 6 * clampedT * (p3.y - 2 * p2.y + p1.y),
        z: 6 * u * (p2.z - 2 * p1.z + p0.z) + 6 * clampedT * (p3.z - 2 * p2.z + p1.z),
      };
    }
  }
}

export function evaluateSegmentTangent(segment: MotionPathSegment, t: number): PathTangent {
  const v = evaluateSegmentVelocity(segment, t);
  if (length(v) > EPSILON) {
    return normalize(v);
  }
  // If velocity is degenerate at endpoints, sample with slight epsilon offset
  const offsetT = t < 0.5 ? Math.min(1, t + 1e-4) : Math.max(0, t - 1e-4);
  const fallbackV = evaluateSegmentVelocity(segment, offsetT);
  if (length(fallbackV) > EPSILON) {
    return normalize(fallbackV);
  }
  // Last resort fallback: chord direction from start to end
  const chord = sub(segment.end, segment.start);
  return normalize(chord, { x: 1, y: 0, z: 0 });
}

export function evaluateSegmentCurvature(segment: MotionPathSegment, t: number): number {
  if (segment.type === "line") return 0;
  const v = evaluateSegmentVelocity(segment, t);
  const speed = length(v);
  if (speed < EPSILON) return 0;

  const a = evaluateSegmentAcceleration(segment, t);
  const c = cross(v, a);
  const num = length(c);
  const den = speed * speed * speed;
  return den > EPSILON ? num / den : 0;
}

/**
 * Converts a sequence of 3D waypoints into smooth cubic Bézier segments using Catmull-Rom splines.
 */
export function waypointsToCubicSegments(
  points: ReadonlyArray<PathPoint3D>,
  closed = false,
  tension = 0.5
): MotionPathSegment[] {
  if (points.length < 2) return [];

  if (points.length === 2) {
    const p0 = points[0]!;
    const p1 = points[1]!;
    const chord = distance(p0, p1);
    return [
      {
        type: "line",
        start: { ...p0 },
        end: { ...p1 },
        controlPoints: [],
        length: chord,
        startDistance: 0,
        endDistance: chord,
      },
    ];
  }

  const segments: MotionPathSegment[] = [];
  const n = points.length;
  const count = closed ? n : n - 1;
  const alpha = 6 * (tension > 0 ? tension : 0.5);

  for (let i = 0; i < count; i++) {
    const p0 = closed
      ? points[(i - 1 + n) % n]!
      : i === 0
        ? sub(scale(points[0]!, 2), points[1]!)
        : points[i - 1]!;

    const p1 = points[i]!;
    const p2 = closed ? points[(i + 1) % n]! : points[i + 1]!;

    const p3 = closed
      ? points[(i + 2) % n]!
      : i + 2 < n
        ? points[i + 2]!
        : sub(scale(p2, 2), p1);

    const cp1: PathPoint3D = add(p1, scale(sub(p2, p0), 1 / alpha));
    const cp2: PathPoint3D = sub(p2, scale(sub(p3, p1), 1 / alpha));

    segments.push({
      type: "cubic",
      start: { ...p1 },
      end: { ...p2 },
      controlPoints: [cp1, cp2],
      length: 0, // Computed during LUT initialization
      startDistance: 0,
      endDistance: 0,
    });
  }

  return segments;
}
