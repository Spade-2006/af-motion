/**
 * AF Motion 3D Interaction Engine Types
 *
 * Framework-independent definitions for pointer, touch, keyboard,
 * raycasting, selection, camera controls, and interaction state.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";
import type { BoundingBox3D } from "../schemas/types.js";

export type PointerInteractionType =
  | "pointerdown"
  | "pointermove"
  | "pointerup"
  | "click"
  | "pointerenter"
  | "pointerleave"
  | "dragstart"
  | "drag"
  | "dragend";

export interface RaycastHit3D {
  readonly objectId: string;
  readonly point: Vector3Tuple;
  readonly distance: number;
  readonly normal?: Vector3Tuple;
  readonly meshName?: string;
  readonly userData?: Record<string, unknown>;
}

export interface RaycastAdapter3D {
  readonly raycast: (
    ndcX: number,
    ndcY: number,
    objects?: readonly unknown[]
  ) => readonly RaycastHit3D[];
}

export interface InteractionState3D {
  readonly hoveredObjectId: string | null;
  readonly selectedObjectIds: readonly string[];
  readonly focusedObjectId: string | null;
  readonly isDragging: boolean;
  readonly pointerNdc: readonly [number, number];
  readonly dragDelta: readonly [number, number];
  readonly activeHits: readonly RaycastHit3D[];
}

export interface Interaction3DOptions {
  readonly dragThreshold?: number;
  readonly multiSelect?: boolean;
  readonly enableKeyboard?: boolean;
  readonly enableHighlight?: boolean;
  readonly highlightColor?: string;
  readonly reducedMotion?: boolean;
  readonly raycaster?: RaycastAdapter3D;
  readonly onHover?: (objectId: string | null, hit?: RaycastHit3D) => void;
  readonly onSelect?: (selectedIds: readonly string[]) => void;
  readonly onClick?: (objectId: string | null, hit?: RaycastHit3D) => void;
  readonly onDrag?: (delta: readonly [number, number], state: InteractionState3D) => void;
}

export type CameraControlMode = "orbit" | "pan" | "zoom" | "combined" | "none";

export interface CameraControlsConfig {
  readonly mode?: CameraControlMode;
  readonly enableOrbit?: boolean;
  readonly enablePan?: boolean;
  readonly enableZoom?: boolean;
  readonly enableDamping?: boolean;
  readonly dampingFactor?: number;
  readonly rotateSpeed?: number;
  readonly panSpeed?: number;
  readonly zoomSpeed?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minPolarAngle?: number;
  readonly maxPolarAngle?: number;
  readonly minAzimuthAngle?: number;
  readonly maxAzimuthAngle?: number;
  readonly target?: Vector3Tuple;
  readonly autoRotate?: boolean;
  readonly autoRotateSpeed?: number;
  readonly reducedMotion?: boolean;
}

export interface CameraControlsState {
  readonly azimuth: number;
  readonly polar: number;
  readonly distance: number;
  readonly target: Vector3Tuple;
  readonly position: Vector3Tuple;
  readonly isInteracting: boolean;
}

export type InteractionPresetName =
  | "product-showcase"
  | "portfolio"
  | "immersive-landing"
  | "spatial-story"
  | "object-display"
  | "scroll-narrative";

export interface InteractionEnvironmentPreset {
  readonly name: InteractionPresetName;
  readonly description: string;
  readonly cameraControls: CameraControlsConfig;
  readonly interactionOptions: Interaction3DOptions;
}
