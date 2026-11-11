/**
 * AF Motion Path Sampling & Evaluation Engine
 *
 * Core engine providing compilation of motion paths, constant-speed uniform arc-length
 * sampling, tangent/normal evaluation, curvature estimation, and orientation computation.
 */

import { buildPathLUT, lookupDistanceInLUT, type PathLUT } from "./lut.js";
import { computePathBounds, parseMotionPath } from "./parser.js";
import {
  evaluateSegmentAcceleration,
  evaluateSegmentCurvature,
  evaluateSegmentPoint,
  evaluateSegmentTangent,
} from "./segments.js";
import { angle2D, computeOrientationFrame, eulerFromTangent, normal2D, radians2D } from "./vector3.js";
import type {
  MotionPath,
  MotionPathBounds,
  MotionPathDefinition,
  MotionPathOptions,
  MotionPathSegment,
  PathPoint3D,
  PathSample,
  PathTangent,
  SampleOptions,
} from "./types.js";

let nextPathId = 1;

/**
 * Normalizes progress according to overflow policy.
 */
function resolveProgress(progress: number, overflow: "clamp" | "loop" | "pingpong" = "clamp"): number {
  if (Number.isNaN(progress)) return 0;

  switch (overflow) {
    case "clamp":
      return Math.max(0, Math.min(1, progress));
    case "loop": {
      const mod = progress % 1;
      return mod < 0 ? mod + 1 : mod;
    }
    case "pingpong": {
      const full = Math.abs(progress) % 2;
      return full > 1 ? 2 - full : full;
    }
  }
}

class MotionPathImpl implements MotionPath {
  readonly id: string;
  readonly is3D: boolean;
  readonly isClosed: boolean;
  readonly totalLength: number;
  readonly segments: ReadonlyArray<MotionPathSegment>;
  readonly bounds: MotionPathBounds;
  private readonly lut: PathLUT;

  constructor(
    segments: ReadonlyArray<MotionPathSegment>,
    is3D: boolean,
    isClosed: boolean,
    lutResolution = 64
  ) {
    this.id = `path_${nextPathId++}`;
    this.is3D = is3D;
    this.isClosed = isClosed;

    const { lut, updatedSegments } = buildPathLUT(segments, lutResolution);
    this.lut = lut;
    this.totalLength = lut.totalLength;
    this.segments = updatedSegments;
    this.bounds = computePathBounds(updatedSegments);
  }

  sample(progress: number, options: SampleOptions = {}): PathSample {
    const overflow = options.overflow ?? (this.isClosed ? "loop" : "clamp");
    const p = resolveProgress(progress, overflow);
    const constantSpeed = options.constantSpeed ?? true;

    if (this.segments.length === 0) {
      const zero = { x: 0, y: 0, z: 0 };
      const defaultTan = { x: 1, y: 0, z: 0 };
      return {
        position: zero,
        tangent: defaultTan,
        normal: { x: 0, y: 1, z: 0 },
        binormal: { x: 0, y: 0, z: 1 },
        angle: 0,
        radians: 0,
        pitch: 0,
        yaw: 0,
        roll: 0,
        curvature: 0,
        distance: 0,
        progress: p,
        segmentIndex: 0,
        segmentProgress: 0,
      };
    }

    let segIdx = 0;
    let segT = 0;
    let dist = p * this.totalLength;

    if (constantSpeed && this.totalLength > 0) {
      const lookup = lookupDistanceInLUT(this.lut, dist);
      segIdx = lookup.segmentIndex;
      segT = lookup.segmentT;
    } else {
      // Linear distribution by segment count
      const scaled = p * this.segments.length;
      segIdx = Math.min(this.segments.length - 1, Math.floor(scaled));
      segT = scaled - segIdx;
      if (p >= 1) {
        segIdx = this.segments.length - 1;
        segT = 1;
      }
      const seg = this.segments[segIdx]!;
      dist = seg.startDistance + segT * seg.length;
    }

    const currentSeg = this.segments[segIdx]!;
    const position = evaluateSegmentPoint(currentSeg, segT);
    const tangent = evaluateSegmentTangent(currentSeg, segT);
    const acceleration = evaluateSegmentAcceleration(currentSeg, segT);
    const curvature = evaluateSegmentCurvature(currentSeg, segT);

    const angle = angle2D(tangent);
    const radians = radians2D(tangent);
    const euler = eulerFromTangent(tangent);

    let normal: PathPoint3D;
    let binormal: PathPoint3D;

    if (!this.is3D) {
      normal = normal2D(tangent);
      binormal = { x: 0, y: 0, z: 1 };
    } else {
      const frame = computeOrientationFrame(tangent, acceleration);
      normal = frame.normal;
      binormal = frame.binormal;
    }

    return {
      position,
      tangent,
      normal,
      binormal,
      angle,
      radians,
      pitch: euler.pitch,
      yaw: euler.yaw,
      roll: euler.roll,
      curvature,
      distance: dist,
      progress: p,
      segmentIndex: segIdx,
      segmentProgress: segT,
    };
  }

  sampleAtDistance(distance: number, options: SampleOptions = {}): PathSample {
    if (this.totalLength <= 0) {
      return this.sample(0, options);
    }
    const progress = distance / this.totalLength;
    return this.sample(progress, { ...options, constantSpeed: true });
  }

  getPoint(progress: number, options: SampleOptions = {}): PathPoint3D {
    return this.sample(progress, options).position;
  }

  getTangent(progress: number, options: SampleOptions = {}): PathTangent {
    return this.sample(progress, options).tangent;
  }
}

/**
 * Compiles an SVG path, waypoint array, or segment list into an optimized MotionPath.
 */
export function createMotionPath(
  definition: MotionPathDefinition,
  options: MotionPathOptions = {}
): MotionPath {
  if (definition instanceof MotionPathImpl) {
    return definition;
  }

  const { segments, is3D, isClosed } = parseMotionPath(definition, options);
  return new MotionPathImpl(segments, is3D, isClosed, options.lutResolution ?? 64);
}

/**
 * Returns the total arc-length of a motion path.
 */
export function getMotionPathLength(definition: MotionPathDefinition): number {
  const path = createMotionPath(definition);
  return path.totalLength;
}

/**
 * Samples position along a motion path at normalized progress (0..1).
 */
export function getMotionPathPoint(
  definition: MotionPathDefinition,
  progress: number,
  options?: SampleOptions
): PathPoint3D {
  const path = createMotionPath(definition);
  return path.getPoint(progress, options);
}

/**
 * Samples tangent vector along a motion path at normalized progress (0..1).
 */
export function getMotionPathTangent(
  definition: MotionPathDefinition,
  progress: number,
  options?: SampleOptions
): PathTangent {
  const path = createMotionPath(definition);
  return path.getTangent(progress, options);
}

/**
 * Full sample along a motion path at normalized progress (0..1).
 */
export function sampleMotionPath(
  definition: MotionPathDefinition,
  progress: number,
  options?: SampleOptions
): PathSample {
  const path = createMotionPath(definition);
  return path.sample(progress, options);
}
