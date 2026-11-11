/**
 * AF Motion Path Types & Contracts
 *
 * Framework-independent contracts for 2D and 3D motion paths, path sampling,
 * arc-length lookup tables, path followers, and path animations.
 */

import type { EasingOption } from "../../easing/easings.js";

export interface PathPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface PathPoint2D {
  x: number;
  y: number;
}

export type PathPointInput =
  | PathPoint3D
  | PathPoint2D
  | readonly [x: number, y: number]
  | readonly [x: number, y: number, z: number];

export interface PathTangent {
  x: number;
  y: number;
  z: number;
}

export type MotionPathSegmentType = "line" | "quadratic" | "cubic";

export interface MotionPathSegmentDefinition {
  type: MotionPathSegmentType;
  start: PathPointInput;
  end: PathPointInput;
  controlPoints?: PathPointInput[];
}

export interface MotionPathSegment {
  readonly type: MotionPathSegmentType;
  readonly start: PathPoint3D;
  readonly end: PathPoint3D;
  readonly controlPoints: readonly PathPoint3D[];
  readonly length: number;
  readonly startDistance: number;
  readonly endDistance: number;
}

export interface PathSample {
  readonly position: PathPoint3D;
  readonly tangent: PathTangent;
  readonly normal: PathPoint3D;
  readonly binormal: PathPoint3D;
  /** Rotation angle around z-axis in degrees (for 2D CSS rotate). */
  readonly angle: number;
  /** Rotation angle around z-axis in radians. */
  readonly radians: number;
  /** Euler pitch angle in degrees (rotation around x-axis). */
  readonly pitch: number;
  /** Euler yaw angle in degrees (rotation around y-axis). */
  readonly yaw: number;
  /** Euler roll angle in degrees (rotation around z-axis). */
  readonly roll: number;
  /** Signed curvature estimate at the sample point. */
  readonly curvature: number;
  /** Traversed arc distance from path start. */
  readonly distance: number;
  /** Normalized path progress (0..1). */
  readonly progress: number;
  /** Index of the containing segment. */
  readonly segmentIndex: number;
  /** Normalized progress within the containing segment (0..1). */
  readonly segmentProgress: number;
}

export interface MotionPathBounds {
  readonly min: PathPoint3D;
  readonly max: PathPoint3D;
}

export interface MotionPathOptions {
  /** Whether the path forms a closed loop. Defaults to false. */
  closed?: boolean;
  /** Catmull-Rom spline tension when converting waypoints to smooth curves. Defaults to 0.5. */
  tension?: number;
  /** Number of LUT samples per segment for arc-length approximation. Defaults to 64. */
  lutResolution?: number;
  /** Whether to force 3D interpretation. Inferred from points by default. */
  is3D?: boolean;
}

export interface SampleOptions {
  /** Whether to traverse at constant linear speed using arc-length parameterization. Defaults to true. */
  constantSpeed?: boolean;
  /** How to handle progress values outside 0..1: "clamp" | "loop" | "pingpong". Defaults to "clamp". */
  overflow?: "clamp" | "loop" | "pingpong";
}

export interface MotionPath {
  readonly id: string;
  readonly is3D: boolean;
  readonly isClosed: boolean;
  readonly totalLength: number;
  readonly segments: ReadonlyArray<MotionPathSegment>;
  readonly bounds: MotionPathBounds;
  sample(progress: number, options?: SampleOptions): PathSample;
  sampleAtDistance(distance: number, options?: SampleOptions): PathSample;
  getPoint(progress: number, options?: SampleOptions): PathPoint3D;
  getTangent(progress: number, options?: SampleOptions): PathTangent;
}

export type MotionPathDefinition =
  | string
  | ReadonlyArray<PathPointInput>
  | ReadonlyArray<MotionPathSegmentDefinition>
  | MotionPath;

export interface PathFollowerOptions {
  /** Automatically orient elements along the path tangent. Defaults to true. */
  autoRotate?: boolean;
  /** Angular offset in degrees added to the tangent rotation. Defaults to 0. */
  rotationOffset?: number;
  /** Loop continuously around closed paths. Defaults to false. */
  loop?: boolean;
  /** Constant-speed arc-length parameterization. Defaults to true. */
  constantSpeed?: boolean;
  /** Angular smoothing factor (0 = none, 0..1 = smoothed). Defaults to 0. */
  smoothing?: number;
}

export interface RetargetOptions {
  /** Duration in milliseconds to smoothly transition from current state to the new path. Defaults to 0 (immediate). */
  duration?: number;
  /** Target progress on the new path to transition towards. Defaults to 0 or nearest point. */
  targetProgress?: number;
}

export interface PathFollower {
  seek(progress: number): PathSample;
  step(deltaDistance: number): PathSample;
  getPosition(): PathPoint3D;
  getTangent(): PathTangent;
  getSample(): PathSample;
  getTransform(options?: { translateZ?: boolean; precision?: number }): string;
  retarget(newPath: MotionPathDefinition, options?: RetargetOptions): void;
}

export interface PathAnimationOptions {
  /** Total animation duration in milliseconds. If omitted, computed from `speed`. */
  duration?: number;
  /** Constant movement speed in distance units per second. Used if `duration` is not set. */
  speed?: number;
  /** Delay in milliseconds before movement starts. Defaults to 0. */
  delay?: number;
  /** Easing function or string identifier. Defaults to "linear". */
  easing?: EasingOption;
  /** Number of repeat iterations. Defaults to 0 (plays once). Use Infinity for endless. */
  repeat?: number;
  /** Reverse direction on alternate iterations. Defaults to false. */
  yoyo?: boolean;
  /** Use arc-length constant speed traversal. Defaults to true. */
  constantSpeed?: boolean;
  /** Automatically orient along path tangent. Defaults to true. */
  autoRotate?: boolean;
  /** Fixed rotation offset in degrees. Defaults to 0. */
  rotationOffset?: number;
  /** Normalized start offset on the path (0..1). Defaults to 0. */
  startOffset?: number;
  /** Normalized end offset on the path (0..1). Defaults to 1. */
  endOffset?: number;
  /** Direction of traversal. Defaults to "forward". */
  direction?: "forward" | "reverse";
  /** Unique owner token for setTransformLayer. Created automatically if not provided. */
  transformOwner?: object;
  /** Called once when animation begins. */
  onStart?: () => void;
  /** Called on every frame with the updated path sample. */
  onUpdate?: (sample: PathSample) => void;
  /** Called on every frame with progress (0..1) and sample. */
  onProgress?: (progress: number, sample: PathSample) => void;
  /** Called once when playback completes. */
  onComplete?: () => void;
  /** Called if playback is cancelled. */
  onCancel?: () => void;
}

export interface PathAnimationControls {
  seek(progress: number): void;
  pause(): void;
  resume(): void;
  reverse(): void;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  cancel(): void;
  finish(): void;
  retarget(newPath: MotionPathDefinition, options?: RetargetOptions): void;
  getCurrentSample(): PathSample;
  readonly finished: Promise<void>;
}
