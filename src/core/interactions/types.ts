/**
 * AF Motion Universal Interaction & Gestures — Type Contracts
 *
 * Framework-independent contracts for normalized input, pointer tracking,
 * multi-touch gestures, keyboard interactions, priority resolution, and lifecycle controls.
 */

export const INTERACTION_VERSION = "1.0.0";

export type InputSourceType = "pointer" | "mouse" | "touch" | "keyboard";

export type PointerType = "mouse" | "touch" | "pen" | "keyboard";

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface InteractionPoint {
  readonly x: number;
  readonly y: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly screenX: number;
  readonly screenY: number;
}

export interface Velocity2D {
  readonly vx: number;
  readonly vy: number;
  readonly speed: number;
}

export interface ModifierKeys {
  readonly alt: boolean;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
}

export interface NormalizedInputEvent {
  readonly source: InputSourceType;
  readonly type: string;
  readonly pointerId: number | null;
  readonly pointerType: PointerType;
  readonly isPrimary: boolean;
  readonly point: InteractionPoint | null;
  readonly movement: Point2D;
  readonly pressure: number;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly twist: number;
  readonly width?: number;
  readonly height?: number;
  readonly modifiers: ModifierKeys;
  readonly key: string | null;
  readonly code: string | null;
  readonly repeat: boolean;
  readonly timeStamp: number;
  readonly target: EventTarget | null;
  readonly originalEvent: Event;
  preventDefault(): void;
  stopPropagation(): void;
}

export interface TrackedPointer {
  readonly id: number;
  readonly pointerType: PointerType;
  readonly isPrimary: boolean;
  readonly startPoint: InteractionPoint;
  readonly currentPoint: InteractionPoint;
  readonly previousPoint: InteractionPoint;
  readonly startTime: number;
  readonly lastUpdateTime: number;
  readonly distance: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly accelerationX: number;
  readonly accelerationY: number;
  readonly width?: number;
  readonly height?: number;
  readonly history: readonly { readonly point: Point2D; readonly time: number }[];
}

export interface MultiPointerState {
  readonly count: number;
  readonly pointers: readonly TrackedPointer[];
  readonly center: Point2D;
  readonly distance: number;
  readonly angle: number; // Radians
  readonly angleDegrees: number;
}

export type GestureType =
  | "tap"
  | "double-tap"
  | "long-press"
  | "drag"
  | "pan"
  | "swipe"
  | "pinch"
  | "rotation";

export type GestureStatus =
  | "possible"
  | "recognized"
  | "began"
  | "changed"
  | "ended"
  | "cancelled"
  | "failed";

export interface TapGesture {
  readonly type: "tap";
  readonly point: InteractionPoint;
  readonly duration: number;
  readonly tapCount: number;
  readonly pointerType: PointerType;
}

export interface DoubleTapGesture {
  readonly type: "double-tap";
  readonly point: InteractionPoint;
  readonly interval: number;
  readonly pointerType: PointerType;
}

export interface LongPressGesture {
  readonly type: "long-press";
  readonly point: InteractionPoint;
  readonly duration: number;
  readonly pointerType: PointerType;
}

export interface DragGesture {
  readonly type: "drag";
  readonly status: GestureStatus;
  readonly point: InteractionPoint;
  readonly startPoint: InteractionPoint;
  readonly offset: Point2D;
  readonly delta: Point2D;
  readonly velocity: Velocity2D;
  readonly axis: "x" | "y" | "both";
  readonly cancelled: boolean;
}

export interface PanGesture {
  readonly type: "pan";
  readonly status: GestureStatus;
  readonly point: InteractionPoint;
  readonly offset: Point2D;
  readonly delta: Point2D;
  readonly velocity: Velocity2D;
  readonly pointerCount: number;
  readonly cancelled: boolean;
}

export interface SwipeGesture {
  readonly type: "swipe";
  readonly direction: "up" | "down" | "left" | "right";
  readonly distance: number;
  readonly duration: number;
  readonly velocity: number;
  readonly pointerType: PointerType;
}

export interface PinchGesture {
  readonly type: "pinch";
  readonly status: GestureStatus;
  readonly scale: number;
  readonly deltaScale: number;
  readonly distance: number;
  readonly initialDistance: number;
  readonly center: Point2D;
  readonly cancelled: boolean;
}

export interface RotationGesture {
  readonly type: "rotation";
  readonly status: GestureStatus;
  readonly rotation: number; // In degrees
  readonly deltaRotation: number; // In degrees
  readonly rotationRad: number; // In radians
  readonly center: Point2D;
  readonly cancelled: boolean;
}

export interface TapOptions {
  readonly maxDelayMs?: number;
  readonly maxDistance?: number;
  readonly onTap?: (gesture: TapGesture) => void;
}

export interface DoubleTapOptions {
  readonly maxDelayMs?: number;
  readonly maxDistance?: number;
  readonly onDoubleTap?: (gesture: DoubleTapGesture) => void;
}

export interface LongPressOptions {
  readonly minDurationMs?: number;
  readonly maxDistance?: number;
  readonly onLongPress?: (gesture: LongPressGesture) => void;
}

export interface DragOptions {
  readonly axis?: "x" | "y" | "both";
  readonly threshold?: number;
  readonly bounds?: {
    readonly minX?: number;
    readonly maxX?: number;
    readonly minY?: number;
    readonly maxY?: number;
  };
  readonly inertia?: boolean;
  readonly friction?: number;
  readonly onDragStart?: (gesture: DragGesture) => void;
  readonly onDrag?: (gesture: DragGesture) => void;
  readonly onDragEnd?: (gesture: DragGesture) => void;
}

export interface PanOptions {
  readonly threshold?: number;
  readonly lockAxis?: boolean;
  readonly onPanStart?: (gesture: PanGesture) => void;
  readonly onPan?: (gesture: PanGesture) => void;
  readonly onPanEnd?: (gesture: PanGesture) => void;
}

export interface SwipeOptions {
  readonly minDistance?: number;
  readonly maxDuration?: number;
  readonly minVelocity?: number;
  readonly onSwipe?: (gesture: SwipeGesture) => void;
}

export interface PinchOptions {
  readonly minDistance?: number;
  readonly onPinchStart?: (gesture: PinchGesture) => void;
  readonly onPinch?: (gesture: PinchGesture) => void;
  readonly onPinchEnd?: (gesture: PinchGesture) => void;
}

export interface RotationOptions {
  readonly threshold?: number; // In degrees
  readonly onRotationStart?: (gesture: RotationGesture) => void;
  readonly onRotation?: (gesture: RotationGesture) => void;
  readonly onRotationEnd?: (gesture: RotationGesture) => void;
}

export interface KeyBinding {
  readonly key: string | readonly string[];
  readonly modifiers?: Partial<ModifierKeys>;
  readonly action: (event: NormalizedInputEvent) => void;
  readonly preventDefault?: boolean;
  readonly description?: string;
}

export interface KeyboardOptions {
  readonly enabled?: boolean;
  readonly bindings?: readonly KeyBinding[];
  readonly onKeyDown?: (event: NormalizedInputEvent) => void;
  readonly onKeyUp?: (event: NormalizedInputEvent) => void;
  readonly onActivate?: (event: NormalizedInputEvent) => void; // Enter or Space
  readonly onCancel?: (event: NormalizedInputEvent) => void; // Escape
}

export type InteractionPriority = "low" | "normal" | "high" | "critical" | number;

export type ConflictPolicy = "simultaneous" | "exclusive" | "require-failure";

export interface GesturePrioritizationRule {
  readonly gesture: GestureType;
  readonly priority: InteractionPriority;
  readonly policy?: ConflictPolicy;
  readonly blocks?: readonly GestureType[];
  readonly requiresFailureOf?: readonly GestureType[];
}

export interface InteractionOptions {
  readonly priority?: InteractionPriority;
  readonly capturePointer?: boolean;
  readonly passive?: boolean;
  readonly preventDefault?: boolean | ((event: NormalizedInputEvent) => boolean);
  readonly tap?: TapOptions | boolean;
  readonly doubleTap?: DoubleTapOptions | boolean;
  readonly longPress?: LongPressOptions | boolean;
  readonly drag?: DragOptions | boolean;
  readonly pan?: PanOptions | boolean;
  readonly swipe?: SwipeOptions | boolean;
  readonly pinch?: PinchOptions | boolean;
  readonly rotation?: RotationOptions | boolean;
  readonly keyboard?: KeyboardOptions | boolean;
  readonly prioritizationRules?: readonly GesturePrioritizationRule[];
  readonly onPointerDown?: (event: NormalizedInputEvent) => void;
  readonly onPointerMove?: (event: NormalizedInputEvent) => void;
  readonly onPointerUp?: (event: NormalizedInputEvent) => void;
  readonly onPointerEnter?: (event: NormalizedInputEvent) => void;
  readonly onPointerLeave?: (event: NormalizedInputEvent) => void;
  readonly onPointerCancel?: (event: NormalizedInputEvent) => void;
}

export interface InteractionControls {
  readonly target: EventTarget;
  readonly activePointers: ReadonlyMap<number, TrackedPointer>;
  readonly isInteracting: boolean;
  updateOptions(options: Partial<InteractionOptions>): void;
  cancel(): void;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Advanced Pointer Engine (Prompt 106)
// ---------------------------------------------------------------------------

export interface DeviceCapabilities {
  readonly touchSupport: boolean;
  readonly pointerSupport: boolean;
  readonly maxTouchPoints: number;
  readonly primaryInput: "mouse" | "touch" | "pen";
  readonly hoverSupport: boolean;
}

export interface PointerControllerOptions {
  readonly sampleWindowMs?: number;
  readonly maxHistory?: number;
  readonly capturePointer?: boolean;
  readonly onPointerEnter?: (event: NormalizedInputEvent) => void;
  readonly onPointerLeave?: (event: NormalizedInputEvent) => void;
  readonly onHoverChange?: (isHovered: boolean, event: NormalizedInputEvent) => void;
  readonly onPointerDown?: (event: NormalizedInputEvent, pointer: TrackedPointer) => void;
  readonly onPointerMove?: (event: NormalizedInputEvent, pointer: TrackedPointer) => void;
  readonly onPointerUp?: (event: NormalizedInputEvent, pointer: TrackedPointer) => void;
  readonly onPointerCancel?: (event: NormalizedInputEvent, pointer: TrackedPointer | null) => void;
}

export interface PointerControllerState {
  readonly isHovered: boolean;
  readonly activePointers: ReadonlyMap<number, TrackedPointer>;
  readonly pointerCount: number;
  readonly primaryPointer: TrackedPointer | null;
  readonly deviceCapabilities: DeviceCapabilities;
}

export interface PointerController {
  readonly target: HTMLElement;
  getState(): PointerControllerState;
  isHovered(): boolean;
  getActivePointers(): ReadonlyMap<number, TrackedPointer>;
  getPrimaryPointer(): TrackedPointer | null;
  getDeviceCapabilities(): DeviceCapabilities;
  cancel(): void;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Advanced Drag Engine (Prompt 106)
// ---------------------------------------------------------------------------

export type DragAxisMode = "x" | "y" | "both" | "none";

export interface DragBounds {
  readonly minX?: number;
  readonly maxX?: number;
  readonly minY?: number;
  readonly maxY?: number;
}

export interface DragPosition {
  readonly x: number;
  readonly y: number;
}

export interface SnapPoint {
  readonly x: number;
  readonly y: number;
}

export interface AdvancedDragOptions {
  readonly axis?: DragAxisMode;
  readonly directionLock?: boolean;
  readonly threshold?: number;
  readonly delayMs?: number;
  readonly bounds?: DragBounds | HTMLElement | string;
  readonly grid?: number | readonly [number, number];
  readonly snapPoints?: readonly SnapPoint[];
  readonly snapRadius?: number;
  readonly elastic?: boolean | number;
  readonly resistance?: number;
  readonly transformCoordinate?: (point: DragPosition) => DragPosition;
  readonly inertia?: boolean;
  readonly friction?: number;
  readonly maxVelocity?: number;
  readonly springBack?: boolean;
  readonly applyTransform?: boolean;
  readonly isolate?: boolean;
  readonly canDrag?: (event: NormalizedInputEvent) => boolean;
  readonly buttons?: readonly number[];
  readonly shiftAxisLock?: boolean;
  readonly keyboardEnabled?: boolean;
  readonly keyboardStep?: number;
  readonly keyboardFastStep?: number;
  readonly onDragStart?: (state: AdvancedDragState) => void;
  readonly onDrag?: (state: AdvancedDragState) => void;
  readonly onDragEnd?: (state: AdvancedDragState) => void;
  readonly onSnap?: (point: SnapPoint, state: AdvancedDragState) => void;
}

export interface AdvancedDragState {
  readonly isDragging: boolean;
  readonly isSnapping: boolean;
  readonly position: DragPosition;
  readonly offset: DragPosition;
  readonly delta: DragPosition;
  readonly velocity: Velocity2D;
  readonly axis: DragAxisMode;
  readonly lockedAxis: "x" | "y" | null;
  readonly pointerId: number | null;
  readonly pointerType: PointerType;
  readonly cancelled: boolean;
}

export interface AdvancedDragControls {
  readonly target: HTMLElement;
  getState(): AdvancedDragState;
  getPosition(): DragPosition;
  setPosition(pos: Partial<DragPosition>): void;
  isDragging(): boolean;
  cancel(): void;
  reset(): void;
  destroy(): void;
}


// ---------------------------------------------------------------------------
// Touch & Multi-Touch Engine (Prompt 107)
// ---------------------------------------------------------------------------

export interface TouchControllerOptions {
  readonly touchAction?: string;
  readonly passive?: boolean;
  readonly preventDefault?: boolean | ((event: NormalizedInputEvent) => boolean);
  readonly isolate?: boolean;
  readonly onTouchStart?: (event: NormalizedInputEvent, pointer: TrackedPointer) => void;
  readonly onTouchMove?: (event: NormalizedInputEvent, pointer: TrackedPointer) => void;
  readonly onTouchEnd?: (event: NormalizedInputEvent, pointer: TrackedPointer) => void;
  readonly onTouchCancel?: (event: NormalizedInputEvent, pointer: TrackedPointer | null) => void;
  readonly onTouchesChange?: (touches: readonly TrackedPointer[]) => void;
}

export interface TouchControllerState {
  readonly touchCount: number;
  readonly activeTouches: readonly TrackedPointer[];
  readonly centroid: Point2D;
  readonly isTouching: boolean;
}

export interface TouchController {
  readonly target: HTMLElement;
  getState(): TouchControllerState;
  getActiveTouches(): readonly TrackedPointer[];
  cancel(): void;
  destroy(): void;
}

export interface TouchTransform {
  readonly translation: Point2D;
  readonly scale: number;
  readonly rotation: number; // degrees
  readonly rotationRad: number; // radians
  readonly center: Point2D;
}

export type PinchDirection = "in" | "out" | "none";

export interface MultiTouchState {
  readonly isActive: boolean;
  readonly touchCount: number;
  readonly pointers: readonly TrackedPointer[];
  readonly centroid: Point2D;
  readonly deltaCentroid: Point2D;
  readonly translation: Point2D;
  readonly scale: number;
  readonly deltaScale: number;
  readonly rotation: number; // degrees
  readonly deltaRotation: number; // degrees
  readonly pinchDirection: PinchDirection;
  readonly velocity: Velocity2D;
  readonly angularVelocity: number; // deg/s
  readonly scaleVelocity: number; // scale/s
}

export interface MultiTouchControllerOptions {
  readonly enablePan?: boolean;
  readonly enablePinch?: boolean;
  readonly enableRotation?: boolean;
  readonly singleFingerPan?: boolean;
  readonly twoFingerPan?: boolean;
  readonly panAxis?: "x" | "y" | "both" | "none";
  readonly minScale?: number;
  readonly maxScale?: number;
  readonly minRotation?: number;
  readonly maxRotation?: number;
  readonly bounds?: DragBounds;
  readonly elastic?: boolean | number;
  readonly panThreshold?: number;
  readonly pinchThreshold?: number;
  readonly rotationThreshold?: number;
  readonly touchAction?: string;
  readonly passive?: boolean;
  readonly preventDefault?: boolean | ((event: NormalizedInputEvent) => boolean);
  readonly isolate?: boolean;
  readonly inertia?: boolean;
  readonly friction?: number;
  readonly springBack?: boolean;
  readonly applyTransform?: boolean;
  readonly onStart?: (state: MultiTouchState) => void;
  readonly onMove?: (state: MultiTouchState) => void;
  readonly onEnd?: (state: MultiTouchState) => void;
  readonly onPinch?: (scale: number, state: MultiTouchState) => void;
  readonly onRotate?: (rotation: number, state: MultiTouchState) => void;
  readonly onPan?: (translation: Point2D, state: MultiTouchState) => void;
  readonly onTransform?: (transform: TouchTransform, state: MultiTouchState) => void;
  readonly onCancel?: (state: MultiTouchState) => void;
}

export interface MultiTouchController {
  readonly target: HTMLElement;
  getState(): MultiTouchState;
  getTransform(): TouchTransform;
  setTranslation(pos: Partial<Point2D>): void;
  setScale(scale: number): void;
  setRotation(rotation: number): void;
  isActive(): boolean;
  cancel(): void;
  reset(): void;
  destroy(): void;
}


// ---------------------------------------------------------------------------
// Gesture Recognition Intelligence (Prompt 108)
// ---------------------------------------------------------------------------

export type GestureDirection =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right"
  | "horizontal"
  | "vertical"
  | "any";

export type GestureEdge = "left" | "right" | "top" | "bottom";

export interface GestureSample {
  readonly id?: string;
  readonly pointerCount: number;
  readonly durationMs: number;
  readonly distance: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly speed: number;
  readonly accelerationX?: number;
  readonly accelerationY?: number;
  readonly startPoint: Point2D;
  readonly currentPoint: Point2D;
  readonly targetBounds?: DragBounds;
  readonly scaleChange?: number;
  readonly rotationChange?: number; // in degrees
  readonly pathLength?: number;
  readonly pointerType?: PointerType;
}

export interface GestureExplanation {
  readonly directionMatch: number; // 0..1
  readonly velocityMatch: number; // 0..1
  readonly distanceMatch: number; // 0..1
  readonly durationMatch: number; // 0..1
  readonly pointerCountMatch: number; // 0..1
  readonly linearity: number; // 0..1
  readonly edgeMatch?: number; // 0..1
  readonly scaleMatch?: number; // 0..1
  readonly rotationMatch?: number; // 0..1
  readonly summary: string;
}

export interface GestureClassificationResult {
  readonly gestureId: string;
  readonly name: string;
  readonly confidence: number; // 0..1
  readonly isMatch: boolean;
  readonly explanation: GestureExplanation;
  readonly sample: GestureSample;
  readonly recognizedAt: number;
}

export interface CustomGestureDefinition {
  readonly id: string;
  readonly name?: string;
  readonly pointerCount?: number | { readonly min?: number; readonly max?: number };
  readonly direction?: GestureDirection;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minDurationMs?: number;
  readonly maxDurationMs?: number;
  readonly minVelocity?: number;
  readonly maxVelocity?: number;
  readonly minLinearity?: number;
  readonly edge?: GestureEdge;
  readonly edgeThreshold?: number;
  readonly minScaleChange?: number;
  readonly minRotationChange?: number;
  readonly priority?: InteractionPriority;
  readonly conflictPolicy?: ConflictPolicy;
  readonly onRecognized?: (match: GestureClassificationResult) => void;
}

export interface GestureSequenceStage {
  readonly gestureId: string;
  readonly optional?: boolean;
  readonly timeoutMs?: number;
}

export interface GestureSequenceOptions {
  readonly id?: string;
  readonly name?: string;
  readonly stages: readonly GestureSequenceStage[];
  readonly sequenceTimeoutMs?: number;
  readonly onStageCompleted?: (stage: GestureSequenceStage, stageIndex: number) => void;
  readonly onSequenceCompleted?: (results: readonly GestureClassificationResult[]) => void;
  readonly onSequenceFailed?: (reason: string, stageIndex: number) => void;
  readonly onReset?: () => void;
}

export interface GestureSequenceState {
  readonly stageIndex: number;
  readonly totalStages: number;
  readonly completedStages: readonly string[];
  readonly completedResults: readonly GestureClassificationResult[];
  readonly isMatched: boolean;
  readonly isFailed: boolean;
  readonly timeRemainingMs: number;
}

export interface GestureSequenceController {
  readonly id: string;
  getState(): GestureSequenceState;
  feed(match: GestureClassificationResult): boolean;
  cancel(): void;
  reset(): void;
  destroy(): void;
}

export interface GestureRecognitionOptions {
  readonly edgeThreshold?: number;
  readonly minConfidence?: number;
  readonly sequences?: readonly GestureSequenceOptions[];
  readonly prioritizationRules?: readonly GesturePrioritizationRule[];
  readonly onGestureRecognized?: (result: GestureClassificationResult) => void;
  readonly onGestureCandidate?: (result: GestureClassificationResult) => void;
  readonly onSequenceCompleted?: (sequenceId: string, results: readonly GestureClassificationResult[]) => void;
}

export interface GestureRecognitionController {
  readonly target: HTMLElement;
  getActiveGestures(): readonly GestureClassificationResult[];
  getSequences(): readonly GestureSequenceController[];
  cancel(): void;
  destroy(): void;
}


// ---------------------------------------------------------------------------
// Cursor & Magnetic Interaction Engine (Prompt 109)
// ---------------------------------------------------------------------------

export type CursorMode =
  | "default"
  | "magnetic"
  | "follower"
  | "hover-reactive"
  | "proximity"
  | "repulsive"
  | "custom";

export interface CursorState {
  readonly x: number;
  readonly y: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly speed: number;
  readonly accelerationX: number;
  readonly accelerationY: number;
  readonly angle: number;
  readonly isVisible: boolean;
  readonly isHovering: boolean;
  readonly hoveredElement: HTMLElement | null;
  readonly mode: CursorMode;
  readonly customState: string | null;
  readonly scale: number;
  readonly opacity: number;
}

export interface CursorProximityTarget {
  readonly element: HTMLElement;
  readonly radius?: number;
  readonly onEnter?: (target: HTMLElement, distance: number) => void;
  readonly onLeave?: (target: HTMLElement) => void;
  readonly onProximity?: (target: HTMLElement, distance: number, normalizedDistance: number) => void;
}

export interface CursorControllerOptions {
  readonly smoothing?: number;
  readonly lagMs?: number;
  readonly mode?: CursorMode;
  readonly hideNativeCursor?: boolean;
  readonly hoverSelector?: string;
  readonly proximityRadius?: number;
  readonly proximityTargets?: readonly (HTMLElement | CursorProximityTarget)[];
  readonly snapToCenterOnHover?: boolean;
  readonly touchFallback?: "hide" | "ignore" | "follow";
  readonly respectReducedMotion?: boolean;
  readonly onPositionChange?: (state: CursorState) => void;
  readonly onStateChange?: (state: CursorState) => void;
  readonly onHoverStart?: (element: HTMLElement, state: CursorState) => void;
  readonly onHoverEnd?: (element: HTMLElement, state: CursorState) => void;
}

export interface CursorController {
  readonly element: HTMLElement | null;
  getState(): CursorState;
  setMode(mode: CursorMode): void;
  setCustomState(stateName: string | null): void;
  setVisibility(visible: boolean): void;
  setPosition(x: number, y: number, immediate?: boolean): void;
  addProximityTarget(target: HTMLElement | CursorProximityTarget): () => void;
  removeProximityTarget(element: HTMLElement): void;
  enable(): void;
  disable(): void;
  reset(): void;
  destroy(): void;
}

export type MagneticFalloff = "linear" | "exponential" | "smoothstep" | "inverse-square";
export type MagneticAxis = "x" | "y" | "both";
export type MagneticMode = "attract" | "repel";

export interface MagneticAnchor {
  readonly x: number;
  readonly y: number;
  readonly isFraction?: boolean;
}

export interface MagneticState {
  readonly isAttracted: boolean;
  readonly distance: number;
  readonly normalizedDistance: number;
  readonly angle: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly pointerX: number;
  readonly pointerY: number;
  readonly isRepelling: boolean;
}

export interface MagneticControllerOptions {
  readonly radius?: number;
  readonly strength?: number;
  readonly maxDisplacement?: number;
  readonly axis?: MagneticAxis;
  readonly mode?: MagneticMode;
  readonly falloff?: MagneticFalloff;
  readonly resistance?: number;
  readonly anchor?: MagneticAnchor;
  readonly springConfig?: {
    readonly stiffness?: number;
    readonly damping?: number;
    readonly mass?: number;
  };
  readonly easing?: (t: number) => number;
  readonly snapPoints?: readonly Point2D[];
  readonly snapDistance?: number;
  readonly container?: HTMLElement;
  readonly respectReducedMotion?: boolean;
  readonly onAttractStart?: (state: MagneticState) => void;
  readonly onAttractUpdate?: (state: MagneticState) => void;
  readonly onAttractEnd?: (state: MagneticState) => void;
  readonly onSnap?: (point: Point2D, state: MagneticState) => void;
}

export interface MagneticController {
  readonly target: HTMLElement;
  getState(): MagneticState;
  updateOptions(options: Partial<MagneticControllerOptions>): void;
  setMode(mode: MagneticMode): void;
  enable(): void;
  disable(): void;
  reset(): void;
  destroy(): void;
}

export interface MagneticGroupMember {
  readonly element: HTMLElement;
  readonly controller: MagneticController;
  readonly options?: MagneticControllerOptions;
}

export interface MagneticGroupOptions {
  readonly maxActiveMembers?: number;
  readonly prioritizeClosest?: boolean;
  readonly sharedRadius?: number;
  readonly onActiveMemberChange?: (activeMember: HTMLElement | null) => void;
}

export interface MagneticGroupController {
  readonly members: readonly MagneticGroupMember[];
  addMember(element: HTMLElement, options?: MagneticControllerOptions): MagneticController;
  removeMember(element: HTMLElement): void;
  getActiveMember(): HTMLElement | null;
  enable(): void;
  disable(): void;
  reset(): void;
  destroy(): void;
}
