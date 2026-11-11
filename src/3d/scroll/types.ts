/**
 * AF Motion 3D Scroll-Driven Scene Types
 *
 * Framework-independent contracts for scroll-linked camera movement,
 * object transformation tracks, timeline stages, and section activations.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";

export interface ObjectTransformState {
  readonly position: Vector3Tuple;
  readonly rotation: Vector3Tuple;
  readonly scale: Vector3Tuple;
  readonly opacity: number;
  readonly visible: boolean;
}

export interface ScrollSceneKeyframe {
  readonly progress: number; // 0 to 1
  readonly camera?: Partial<Camera3DConfig>;
  readonly objects?: Record<
    string,
    {
      readonly position?: Vector3Tuple;
      readonly rotation?: Vector3Tuple;
      readonly scale?: Vector3Tuple;
      readonly opacity?: number;
      readonly visible?: boolean;
    }
  >;
  readonly easing?: string;
}

export interface ScrollSceneSection {
  readonly id: string;
  readonly start: number; // 0 to 1
  readonly end: number;   // 0 to 1
  readonly name?: string;
  readonly cameraPreset?: string;
}

export interface ScrollSceneTimeline {
  readonly id: string;
  readonly name?: string;
  readonly keyframes: readonly ScrollSceneKeyframe[];
  readonly sections?: readonly ScrollSceneSection[];
}

export interface ScrollSceneState {
  readonly progress: number;
  readonly activeSectionId?: string;
  readonly camera: Camera3DConfig;
  readonly objects: Record<string, ObjectTransformState>;
}

export interface ScrollSceneOptions {
  readonly timeline: ScrollSceneTimeline;
  readonly initialCamera?: Camera3DConfig;
  readonly container?: HTMLElement | Window | null;
  readonly onProgress?: (progress: number, state: ScrollSceneState) => void;
  readonly onSectionChange?: (sectionId: string) => void;
  readonly respectReducedMotion?: boolean;
}
