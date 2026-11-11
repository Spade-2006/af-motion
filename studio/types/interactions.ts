/**
 * AF Motion Studio — Interaction & Gesture Playground Type Definitions (Prompt 136)
 *
 * Types for the visual interactive gesture staging canvas, pointer & drag controls,
 * touch & multi-touch simulator, deterministic gesture recognizer, sequence builder,
 * cursor & magnetic physics, event timeline inspector, preset library, diagnostics, and code export.
 */

import type {
  PointerType,
  DragAxisMode,
  PinchDirection,
  GestureDirection,
  GestureEdge,
  ConflictPolicy,
  CursorMode,
  MagneticAxis,
  MagneticMode,
  MagneticFalloff,
  DeviceCapabilities,
} from "../../src/core/interactions/types.js";

export type InteractionStudioViewMode =
  | "playground"
  | "pointer-drag"
  | "touch-multitouch"
  | "gesture-recognition"
  | "gesture-sequences"
  | "cursor-magnetic"
  | "presets";

export type InteractiveElementKind =
  | "drag-card"
  | "action-button"
  | "resizable-box"
  | "magnetic-target"
  | "gesture-pad"
  | "nested-zone";

export interface InteractivePreviewElement {
  id: string;
  kind: InteractiveElementKind;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  isSelected: boolean;
  style: {
    background: string;
    border: string;
    color: string;
    borderRadius: number;
  };
}

export interface PointerDragConfig {
  pointerType: "all" | "mouse" | "touch" | "pen";
  capturePointer: boolean;
  axis: DragAxisMode;
  threshold: number;
  delayMs: number;
  directionLock: boolean;
  boundsEnabled: boolean;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  rubberband: boolean;
  resistance: number;
  gridSnapping: boolean;
  gridSize: number;
  snapPointsEnabled: boolean;
  snapPoints: { x: number; y: number }[];
  momentum: boolean;
  springBack: boolean;
  keyboardEnabled: boolean;
}

export interface TouchMultitouchConfig {
  touchAction: string;
  enablePan: boolean;
  enablePinch: boolean;
  enableRotation: boolean;
  twoFingerPan: boolean;
  minScale: number;
  maxScale: number;
  minRotation: number;
  maxRotation: number;
  panThreshold: number;
  pinchThreshold: number;
  rotationThreshold: number;
  simulatedTouchEnabled: boolean;
  simulatedDistance: number;
  simulatedAngle: number;
  simulatedCentroid: { x: number; y: number };
}

export interface GestureRecognitionConfig {
  enabledGestures: string[];
  minConfidence: number;
  tapMaxDelayMs: number;
  doubleTapIntervalMs: number;
  longPressMinDurationMs: number;
  swipeMinVelocity: number;
  swipeMinDistance: number;
  edgeThreshold: number;
  priorityPolicy: ConflictPolicy;
}

export interface GestureSequenceStageConfig {
  gestureId: string;
  optional?: boolean;
  timeoutMs?: number;
}

export interface GestureSequenceConfig {
  id: string;
  name: string;
  stages: GestureSequenceStageConfig[];
  sequenceTimeoutMs: number;
  currentStageIndex: number;
  matchedStages: string[];
  isMatched: boolean;
  isFailed: boolean;
}

export interface CursorMagneticConfig {
  cursorMode: CursorMode;
  smoothing: number;
  lagMs: number;
  magneticRadius: number;
  magneticStrength: number;
  magneticAxis: MagneticAxis;
  magneticMode: MagneticMode;
  magneticFalloff: MagneticFalloff;
  magneticGroupEnabled: boolean;
  respectReducedMotion: boolean;
}

export type InteractionEventCategory =
  | "pointer"
  | "drag"
  | "touch"
  | "gesture"
  | "sequence"
  | "magnetic"
  | "cursor";

export interface InteractionEventLogItem {
  id: string;
  timestamp: number;
  category: InteractionEventCategory;
  type: string;
  targetId?: string;
  pointerId?: number | null;
  x?: number;
  y?: number;
  velocity?: { vx: number; vy: number; speed: number };
  gestureName?: string;
  confidence?: number;
  details?: string;
}

export interface InteractionVisualFeedbackOptions {
  showPointers: boolean;
  showTrajectories: boolean;
  showDragBounds: boolean;
  showMagneticRadius: boolean;
  showCentroid: boolean;
}

export interface InteractionStudioDiagnostics {
  fps: number;
  eventProcessingDurationMs: number;
  activePointers: number;
  activeGestures: number;
  activeControllers: number;
  eventHistorySize: number;
  devicePrimaryInput: "mouse" | "touch" | "pen";
  hardwareTouchPoints: number;
  isSimulatingTouch: boolean;
  healthScore: number;
  healthStatus: string;
}

export interface InteractionPreset {
  id: string;
  name: string;
  category: "pointer-drag" | "touch" | "gestures" | "cursor-magnetic";
  description: string;
  apply: (state: InteractionStudioState) => InteractionStudioState;
}

export interface InteractionStudioState {
  viewMode: InteractionStudioViewMode;
  elements: InteractivePreviewElement[];
  selectedElementId: string | null;
  pointerDrag: PointerDragConfig;
  touchMultitouch: TouchMultitouchConfig;
  gestureRecognition: GestureRecognitionConfig;
  gestureSequences: GestureSequenceConfig[];
  activeSequenceIndex: number;
  cursorMagnetic: CursorMagneticConfig;
  eventStream: InteractionEventLogItem[];
  isEventCapturePaused: boolean;
  eventCategoryFilter: "all" | InteractionEventCategory;
  selectedEventId: string | null;
  visualFeedback: InteractionVisualFeedbackOptions;
  showExportModal: boolean;
}
