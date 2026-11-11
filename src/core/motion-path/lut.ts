/**
 * AF Motion Path Arc-Length & Lookup Table (LUT) Engine
 *
 * Implements high-precision numerical arc-length integration via Gauss-Legendre
 * quadrature, precomputed cumulative distance tables, and binary-search distance inversion
 * for uniform-distance, constant-speed path traversal.
 */

import { length } from "./vector3.js";
import { evaluateSegmentPoint, evaluateSegmentVelocity } from "./segments.js";
import type { MotionPathSegment } from "./types.js";

// Gauss-Legendre 5-point roots and weights on [-1, 1] mapped to [0, 1]
const GL_POINTS = [
  0.5,
  0.5 - 0.5 * 0.5384693101056831,
  0.5 + 0.5 * 0.5384693101056831,
  0.5 - 0.5 * 0.906179845938664,
  0.5 + 0.5 * 0.906179845938664,
];

const GL_WEIGHTS = [
  0.5 * 0.5688888888888889,
  0.5 * 0.4786286704993665,
  0.5 * 0.4786286704993665,
  0.5 * 0.2369268850561891,
  0.5 * 0.2369268850561891,
];

/**
 * Computes the arc length of a single path segment using 5-point Gauss-Legendre quadrature.
 */
export function computeSegmentLength(segment: MotionPathSegment): number {
  if (segment.type === "line") {
    const dx = segment.end.x - segment.start.x;
    const dy = segment.end.y - segment.start.y;
    const dz = segment.end.z - segment.start.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  let total = 0;
  for (let i = 0; i < 5; i++) {
    const t = GL_POINTS[i]!;
    const w = GL_WEIGHTS[i]!;
    const v = evaluateSegmentVelocity(segment, t);
    total += w * length(v);
  }
  return total;
}

export interface PathLUT {
  readonly totalLength: number;
  readonly sampleCount: number;
  readonly distances: Float64Array;
  readonly segmentIndices: Int32Array;
  readonly segmentTs: Float64Array;
}

/**
 * Builds an arc-length lookup table across all path segments.
 */
export function buildPathLUT(
  segments: ReadonlyArray<MotionPathSegment>,
  resolutionPerSegment = 64
): { lut: PathLUT; updatedSegments: MotionPathSegment[] } {
  const segmentCount = segments.length;
  if (segmentCount === 0) {
    return {
      lut: {
        totalLength: 0,
        sampleCount: 0,
        distances: new Float64Array(0),
        segmentIndices: new Int32Array(0),
        segmentTs: new Float64Array(0),
      },
      updatedSegments: [],
    };
  }

  // Pre-calculate lengths for each segment
  const updatedSegments: MotionPathSegment[] = [];
  let runningDistance = 0;

  for (let i = 0; i < segmentCount; i++) {
    const seg = segments[i]!;
    const segLen = computeSegmentLength(seg);
    const startDist = runningDistance;
    runningDistance += segLen;

    updatedSegments.push({
      type: seg.type,
      start: seg.start,
      end: seg.end,
      controlPoints: seg.controlPoints,
      length: segLen,
      startDistance: startDist,
      endDistance: runningDistance,
    });
  }

  const totalLength = runningDistance;

  // Build the LUT entries
  const samplesPerSeg = Math.max(8, resolutionPerSegment);
  const totalSamples = segmentCount * samplesPerSeg + 1;

  const distances = new Float64Array(totalSamples);
  const segmentIndices = new Int32Array(totalSamples);
  const segmentTs = new Float64Array(totalSamples);

  let sampleIdx = 0;
  let cumDistance = 0;

  for (let segIdx = 0; segIdx < segmentCount; segIdx++) {
    const seg = updatedSegments[segIdx]!;
    let prevPt = evaluateSegmentPoint(seg, 0);

    for (let s = 0; s < samplesPerSeg; s++) {
      const t = s / samplesPerSeg;
      if (s > 0) {
        const currPt = evaluateSegmentPoint(seg, t);
        const dx = currPt.x - prevPt.x;
        const dy = currPt.y - prevPt.y;
        const dz = currPt.z - prevPt.z;
        cumDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
        prevPt = currPt;
      }

      distances[sampleIdx] = cumDistance;
      segmentIndices[sampleIdx] = segIdx;
      segmentTs[sampleIdx] = t;
      sampleIdx++;
    }

    // Add endpoint of this segment
    const endPt = evaluateSegmentPoint(seg, 1);
    const dx = endPt.x - prevPt.x;
    const dy = endPt.y - prevPt.y;
    const dz = endPt.z - prevPt.z;
    cumDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (segIdx === segmentCount - 1) {
      distances[sampleIdx] = cumDistance;
      segmentIndices[sampleIdx] = segIdx;
      segmentTs[sampleIdx] = 1;
      sampleIdx++;
    }
  }

  // Normalize final distance to match total length if slight discrepancy
  if (sampleIdx > 0 && totalLength > 0) {
    const scaleFactor = totalLength / cumDistance;
    for (let i = 0; i < sampleIdx; i++) {
      distances[i] = distances[i]! * scaleFactor;
    }
    distances[sampleIdx - 1] = totalLength;
  }

  return {
    lut: {
      totalLength,
      sampleCount: sampleIdx,
      distances: distances.subarray(0, sampleIdx),
      segmentIndices: segmentIndices.subarray(0, sampleIdx),
      segmentTs: segmentTs.subarray(0, sampleIdx),
    },
    updatedSegments,
  };
}

/**
 * Inverts a target distance to segment index and segment parameter t using binary search.
 */
export function lookupDistanceInLUT(
  lut: PathLUT,
  targetDistance: number
): { segmentIndex: number; segmentT: number } {
  const { sampleCount, distances, segmentIndices, segmentTs, totalLength } = lut;

  if (sampleCount <= 1 || totalLength <= 0) {
    return { segmentIndex: 0, segmentT: 0 };
  }

  if (targetDistance <= 0) {
    return { segmentIndex: segmentIndices[0]!, segmentT: segmentTs[0]! };
  }

  if (targetDistance >= totalLength) {
    const last = sampleCount - 1;
    return { segmentIndex: segmentIndices[last]!, segmentT: segmentTs[last]! };
  }

  // Binary search for interval
  let low = 0;
  let high = sampleCount - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (distances[mid]! < targetDistance) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const i0 = Math.max(0, low - 1);
  const i1 = Math.min(sampleCount - 1, low);

  const d0 = distances[i0]!;
  const d1 = distances[i1]!;
  const segIdx = segmentIndices[i0]!;

  // If both samples are on the same segment, interpolate t linearly
  if (segIdx === segmentIndices[i1]!) {
    const t0 = segmentTs[i0]!;
    const t1 = segmentTs[i1]!;
    const span = d1 - d0;
    const factor = span > 1e-9 ? (targetDistance - d0) / span : 0;
    const interpT = t0 + (t1 - t0) * factor;
    return { segmentIndex: segIdx, segmentT: Math.max(0, Math.min(1, interpT)) };
  }

  // Otherwise return the closest boundary
  return {
    segmentIndex: segIdx,
    segmentT: targetDistance - d0 < d1 - targetDistance ? segmentTs[i0]! : segmentTs[i1]!,
  };
}
