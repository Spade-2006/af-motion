/**
 * AF Motion — 3D Morphing Engine Types
 *
 * Strongly-typed definitions for 3D geometric morphing, blend shapes,
 * vertex correspondence, multi-target interpolation, and cross-system orchestration.
 */

import type { EasingOption } from "../../easing/easings.js";
import type { BoundingBox3D } from "../schemas/types.js";
import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";

// ============================================================================
// Core Morph Target & Geometry Types
// ============================================================================

export type MorphableAttributeType = "positions" | "normals" | "uvs" | "colors" | "custom";

export interface MorphTarget3D {
  id: string;
  name?: string;
  positions: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  colors?: Float32Array;
  customAttributes?: Record<string, Float32Array>;
  /** Weight in range [0, 1] or arbitrary relative factor. Default: 0. */
  weight?: number;
  /** Whether the target offsets are relative to base or absolute world coordinates. Default: false (absolute). */
  relative?: boolean;
}

export interface MorphGeometry3D {
  id: string;
  name?: string;
  base: Mesh3DData;
  targets: MorphTarget3D[];
  indices?: Uint16Array | Uint32Array;
  vertexCount: number;
  triangleCount: number;
  /** Reusable current evaluated geometry buffer to prevent GC allocations. */
  currentMesh: Mesh3DData;
  /** Pre-allocated scratch buffers for zero-allocation blend evaluation. */
  scratchPositions: Float32Array;
  scratchNormals?: Float32Array;
  scratchUvs?: Float32Array;
  scratchColors?: Float32Array;
}

// ============================================================================
// Compatibility & Correspondence
// ============================================================================

export interface MorphCompatibilityReport {
  isCompatible: boolean;
  canResample: boolean;
  vertexCountMatch: boolean;
  baseVertexCount: number;
  targetVertexCount: number;
  topologyMatch: boolean;
  hasIndices: boolean;
  hasNormals: boolean;
  hasUVs: boolean;
  hasColors: boolean;
  missingAttributes: string[];
  warnings: string[];
  errors: string[];
}

export type CorrespondenceStrategy =
  | "index"
  | "nearest-neighbor"
  | "barycentric"
  | "polar"
  | "resample";

export interface CorrespondenceConfig {
  strategy?: CorrespondenceStrategy;
  tolerance?: number;
  normalizeBounds?: boolean;
  alignCenter?: boolean;
}

export interface VertexCorrespondenceMap {
  /** Array of length baseVertexCount mapping to target vertex indices or fractional weights */
  sourceToTargetIndices: Int32Array;
  weights?: Float32Array;
  strategyUsed: CorrespondenceStrategy;
  confidence: number;
}

// ============================================================================
// Interpolation & Evaluation
// ============================================================================

export type MorphInterpolationMode = "linear" | "smoothstep" | "cubic" | "spring";

export interface MorphState3D {
  progress: number;
  mesh: Mesh3DData;
  targetWeights: Record<string, number>;
  isPlaying: boolean;
  isPaused: boolean;
  boundingBox: BoundingBox3D;
  timestamp: number;
}

export interface MorphEvaluationOptions {
  normalizeNormals?: boolean;
  clampProgress?: boolean;
  interpolationMode?: MorphInterpolationMode;
  attributeWeights?: Partial<Record<MorphableAttributeType, number>>;
}

// ============================================================================
// Animation & Controller
// ============================================================================

export interface Morph3DAnimationOptions {
  duration?: number;
  delay?: number;
  easing?: EasingOption;
  interpolationMode?: MorphInterpolationMode;
  normalizeBounds?: boolean;
  alignCenter?: boolean;
  correspondenceStrategy?: CorrespondenceStrategy;
  repeat?: number;
  yoyo?: boolean;
  playbackRate?: number;
  respectReducedMotion?: boolean;
  /** Callback fired before first tick */
  onStart?: () => void;
  /** Callback on each frame update */
  onUpdate?: (progress: number, state: MorphState3D) => void;
  /** Callback on animation completion */
  onComplete?: () => void;
  /** Callback if animation is cancelled */
  onCancel?: () => void;
  /** Optional physics callback for refitting colliders / bounds */
  onGeometryChanged?: (mesh: Mesh3DData, bounds: BoundingBox3D) => void;
}

export type MorphAnimationOptions3D = Morph3DAnimationOptions;

export interface MorphController3D {
  seek(progress: number): void;
  pause(): void;
  resume(): void;
  reverse(): void;
  play(): void;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  setTargetWeight(targetId: string, weight: number): void;
  setTargetWeights(weights: Record<string, number>): void;
  retarget(newTarget: Mesh3DData | GeometryBufferData, transitionDuration?: number): void;
  cancel(): void;
  destroy(): void;
  getState(): MorphState3D;
  interpolate(progress: number): Mesh3DData;
}

export interface MorphSequenceItem {
  target: Mesh3DData | GeometryBufferData | string;
  duration?: number;
  delay?: number;
  easing?: EasingOption;
}

export interface MorphSequenceOptions {
  loop?: boolean;
  yoyo?: boolean;
  playbackRate?: number;
  onSequenceComplete?: () => void;
  onStepComplete?: (stepIndex: number) => void;
}
