/**
 * AF Motion SVG Morphing Engine Contracts
 *
 * Framework-independent contracts for SVG path parsing, normalization,
 * shape conversion, cubic Bézier alignment, interpolation, and animation.
 */

import type { AnimationControls, AnimationOptions } from "../animation.js";
import type { EasingOption } from "../../easing/easings.js";

export const SVG_MORPH_SPEC_VERSION = "1.0.0";

/**
 * Standard SVG Path Command Types.
 */
export type SVGCommandType =
  | "M" | "m"
  | "L" | "l"
  | "H" | "h"
  | "V" | "v"
  | "C" | "c"
  | "S" | "s"
  | "Q" | "q"
  | "T" | "t"
  | "A" | "a"
  | "Z" | "z";

/**
 * A parsed SVG command with its raw type and parameter numbers.
 */
export interface SVGPathCommand {
  readonly type: SVGCommandType;
  readonly params: readonly number[];
}

/**
 * A 2D point tuple [x, y].
 */
export type SVGPointTuple = readonly [number, number];

/**
 * A canonical cubic Bézier curve segment:
 * Start point is the endpoint of the previous segment (or M).
 * Control point 1: [cp1x, cp1y]
 * Control point 2: [cp2x, cp2y]
 * End point: [x, y]
 */
export interface CubicSegment {
  readonly type: "C";
  readonly cp1: SVGPointTuple;
  readonly cp2: SVGPointTuple;
  readonly end: SVGPointTuple;
}

/**
 * MoveTo segment starting a subpath.
 */
export interface MoveSegment {
  readonly type: "M";
  readonly point: SVGPointTuple;
}

/**
 * ClosePath segment closing the current subpath.
 */
export interface CloseSegment {
  readonly type: "Z";
}

/**
 * A canonical segment is either M, C, or Z.
 */
export type CanonicalSegment = MoveSegment | CubicSegment | CloseSegment;

/**
 * A subpath is a sequence of canonical segments beginning with M.
 */
export interface CanonicalSubpath {
  readonly segments: readonly CanonicalSegment[];
  readonly isClosed: boolean;
  readonly totalLength?: number;
}

/**
 * Fully normalized SVG path composed of canonical subpaths.
 */
export interface NormalizedPath {
  readonly subpaths: readonly CanonicalSubpath[];
  readonly totalSegments: number;
}

/**
 * Options for path normalization and segment alignment.
 */
export interface NormalizeOptions {
  /** Maximum number of segments to subdivide to (if aligning paths). */
  readonly targetSegmentCount?: number;
  /** Whether to align closed path start points to minimize morph rotation distance. Defaults to true. */
  readonly alignStartPoints?: boolean;
  /** Precision decimals for formatted output. Defaults to 3. */
  readonly precision?: number;
}

/**
 * Configuration for SVG shape conversion.
 */
export interface SVGCircleProps {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export interface SVGRectProps {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rx?: number;
  readonly ry?: number;
}

export interface SVGEllipseProps {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
}

export interface SVGPolygonProps {
  readonly points: string | readonly (readonly [number, number])[];
}

export interface SVGPolylineProps {
  readonly points: string | readonly (readonly [number, number])[];
}

/**
 * A compiled morph pairing between two normalized paths.
 */
export interface Morph {
  readonly from: NormalizedPath;
  readonly to: NormalizedPath;
  readonly precision: number;
}

/**
 * Options for compiling a morph between two paths.
 */
export interface MorphOptions {
  /** Number of decimal places in interpolated path strings. Defaults to 3. */
  readonly precision?: number;
  /** Whether to align closed path start points to minimize morph rotation. Defaults to true. */
  readonly alignStartPoints?: boolean;
}

/**
 * Options for animating an SVG morph.
 */
export interface MorphAnimationOptions extends AnimationOptions {
  /** Precision decimals in interpolated path string output. Defaults to 3. */
  readonly precision?: number;
  /** Whether to align start points on closed shapes. Defaults to true. */
  readonly alignStartPoints?: boolean;
  /** Custom progress update callback receiving interpolated path string and progress. */
  readonly onProgress?: (pathData: string, progress: number) => void;
}

/**
 * Controls for managing active SVG morph animations.
 */
export interface MorphAnimationControls extends AnimationControls {
  /** Interpolates and applies a specific progress value (0 to 1). */
  interpolate(progress: number): string;
  /** Cancels the animation and optionally restores the original path. */
  destroy(restoreOriginal?: boolean): void;
}
