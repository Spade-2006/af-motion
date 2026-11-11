/**
 * AF Motion Universal Gesture Recognizers
 *
 * Extensible, high-performance recognizers for Tap, Double Tap, Long Press,
 * Drag, Pan, Swipe, Pinch, and Rotation gestures.
 */

import { GestureConfigurationError } from "./errors.js";
import type { PointerTracker } from "./pointer-tracker.js";
import type {
  DoubleTapGesture,
  DoubleTapOptions,
  DragGesture,
  DragOptions,
  GestureStatus,
  GestureType,
  LongPressGesture,
  LongPressOptions,
  MultiPointerState,
  NormalizedInputEvent,
  PanGesture,
  PanOptions,
  PinchGesture,
  PinchOptions,
  Point2D,
  RotationGesture,
  RotationOptions,
  SwipeGesture,
  SwipeOptions,
  TapGesture,
  TapOptions,
  TrackedPointer,
} from "./types.js";

export interface GestureRecognizer {
  readonly type: GestureType;
  readonly status: GestureStatus;
  processDown(event: NormalizedInputEvent, pointer: TrackedPointer, tracker: PointerTracker): void;
  processMove(event: NormalizedInputEvent, pointer: TrackedPointer, tracker: PointerTracker): void;
  processUp(event: NormalizedInputEvent, pointer: TrackedPointer, tracker: PointerTracker): void;
  processCancel(event: NormalizedInputEvent, pointer: TrackedPointer | null, tracker: PointerTracker): void;
  cancel(): void;
  reset(): void;
}

// ---------------------------------------------------------------------------
// 1. TAP RECOGNIZER
// ---------------------------------------------------------------------------
export class TapRecognizer implements GestureRecognizer {
  public readonly type = "tap" as const;
  public status: GestureStatus = "possible";

  private readonly maxDelayMs: number;
  private readonly maxDistance: number;
  private readonly onTap?: (gesture: TapGesture) => void;
  private startPointerId: number | null = null;
  private startTime = 0;

  constructor(options: TapOptions = {}) {
    this.maxDelayMs = options.maxDelayMs ?? 300;
    this.maxDistance = options.maxDistance ?? 10;
    this.onTap = options.onTap;

    if (this.maxDelayMs < 0) throw new GestureConfigurationError("maxDelayMs must be >= 0");
    if (this.maxDistance < 0) throw new GestureConfigurationError("maxDistance must be >= 0");
  }

  public processDown(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.startPointerId === null) {
      this.startPointerId = pointer.id;
      this.startTime = event.timeStamp;
      this.status = "possible";
    }
  }

  public processMove(_event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.status !== "possible" || pointer.id !== this.startPointerId) return;

    if (pointer.distance > this.maxDistance) {
      this.status = "failed";
    }
  }

  public processUp(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.status !== "possible" || pointer.id !== this.startPointerId) return;

    const duration = event.timeStamp - this.startTime;
    if (duration <= this.maxDelayMs && pointer.distance <= this.maxDistance && event.point) {
      this.status = "recognized";
      const gesture: TapGesture = {
        type: "tap",
        point: event.point,
        duration,
        tapCount: 1,
        pointerType: pointer.pointerType,
      };
      this.onTap?.(gesture);
    } else {
      this.status = "failed";
    }
    this.reset();
  }

  public processCancel(): void {
    this.cancel();
  }

  public cancel(): void {
    this.status = "cancelled";
    this.reset();
  }

  public reset(): void {
    this.startPointerId = null;
    this.startTime = 0;
  }
}

// ---------------------------------------------------------------------------
// 2. DOUBLE TAP RECOGNIZER
// ---------------------------------------------------------------------------
export class DoubleTapRecognizer implements GestureRecognizer {
  public readonly type = "double-tap" as const;
  public status: GestureStatus = "possible";

  private readonly maxDelayMs: number;
  private readonly maxDistance: number;
  private readonly onDoubleTap?: (gesture: DoubleTapGesture) => void;

  private firstTapTime = 0;
  private firstTapPoint: Point2D | null = null;
  private timer: any = null;

  constructor(options: DoubleTapOptions = {}) {
    this.maxDelayMs = options.maxDelayMs ?? 300;
    this.maxDistance = options.maxDistance ?? 20;
    this.onDoubleTap = options.onDoubleTap;

    if (this.maxDelayMs < 0) throw new GestureConfigurationError("maxDelayMs must be >= 0");
    if (this.maxDistance < 0) throw new GestureConfigurationError("maxDistance must be >= 0");
  }

  public processDown(): void {}
  public processMove(): void {}

  public processUp(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (!event.point || pointer.distance > this.maxDistance) {
      return;
    }

    const now = event.timeStamp;
    const currentPoint = { x: event.point.x, y: event.point.y };

    if (this.firstTapPoint && this.firstTapTime > 0) {
      const interval = now - this.firstTapTime;
      const dist = Math.hypot(currentPoint.x - this.firstTapPoint.x, currentPoint.y - this.firstTapPoint.y);

      if (interval <= this.maxDelayMs && dist <= this.maxDistance) {
        this.clearTimer();
        this.status = "recognized";
        const gesture: DoubleTapGesture = {
          type: "double-tap",
          point: event.point,
          interval,
          pointerType: pointer.pointerType,
        };
        this.onDoubleTap?.(gesture);
        this.reset();
        return;
      }
    }

    // First tap recorded
    this.firstTapTime = now;
    this.firstTapPoint = currentPoint;
    this.clearTimer();

    this.timer = setTimeout(() => {
      this.reset();
    }, this.maxDelayMs);
  }

  public processCancel(): void {
    this.cancel();
  }

  public cancel(): void {
    this.status = "cancelled";
    this.reset();
  }

  public reset(): void {
    this.clearTimer();
    this.firstTapTime = 0;
    this.firstTapPoint = null;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// ---------------------------------------------------------------------------
// 3. LONG PRESS RECOGNIZER
// ---------------------------------------------------------------------------
export class LongPressRecognizer implements GestureRecognizer {
  public readonly type = "long-press" as const;
  public status: GestureStatus = "possible";

  private readonly minDurationMs: number;
  private readonly maxDistance: number;
  private readonly onLongPress?: (gesture: LongPressGesture) => void;

  private timer: any = null;
  private activePointerId: number | null = null;
  private startPoint: TrackedPointer | null = null;

  constructor(options: LongPressOptions = {}) {
    this.minDurationMs = options.minDurationMs ?? 500;
    this.maxDistance = options.maxDistance ?? 10;
    this.onLongPress = options.onLongPress;

    if (this.minDurationMs < 0) throw new GestureConfigurationError("minDurationMs must be >= 0");
    if (this.maxDistance < 0) throw new GestureConfigurationError("maxDistance must be >= 0");
  }

  public processDown(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.activePointerId !== null) return;

    this.activePointerId = pointer.id;
    this.startPoint = pointer;
    this.status = "possible";

    this.clearTimer();
    this.timer = setTimeout(() => {
      if (this.status === "possible" && this.startPoint && event.point) {
        this.status = "recognized";
        const gesture: LongPressGesture = {
          type: "long-press",
          point: event.point,
          duration: this.minDurationMs,
          pointerType: pointer.pointerType,
        };
        this.onLongPress?.(gesture);
      }
    }, this.minDurationMs);
  }

  public processMove(_event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.activePointerId !== pointer.id) return;

    if (pointer.distance > this.maxDistance) {
      this.cancel();
    }
  }

  public processUp(): void {
    this.cancel();
  }

  public processCancel(): void {
    this.cancel();
  }

  public cancel(): void {
    this.clearTimer();
    this.status = "failed";
    this.activePointerId = null;
    this.startPoint = null;
  }

  public reset(): void {
    this.cancel();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// ---------------------------------------------------------------------------
// 4. DRAG RECOGNIZER
// ---------------------------------------------------------------------------
export class DragRecognizer implements GestureRecognizer {
  public readonly type = "drag" as const;
  public status: GestureStatus = "possible";

  private readonly axis: "x" | "y" | "both";
  private readonly threshold: number;
  private readonly bounds?: { minX?: number; maxX?: number; minY?: number; maxY?: number };
  private readonly onDragStart?: (gesture: DragGesture) => void;
  private readonly onDrag?: (gesture: DragGesture) => void;
  private readonly onDragEnd?: (gesture: DragGesture) => void;

  private activePointerId: number | null = null;
  private initialPoint: Point2D = { x: 0, y: 0 };
  private currentOffset: Point2D = { x: 0, y: 0 };

  constructor(options: DragOptions = {}) {
    this.axis = options.axis ?? "both";
    this.threshold = options.threshold ?? 5;
    this.bounds = options.bounds;
    this.onDragStart = options.onDragStart;
    this.onDrag = options.onDrag;
    this.onDragEnd = options.onDragEnd;

    if (this.threshold < 0) throw new GestureConfigurationError("threshold must be >= 0");
  }

  public processDown(_event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.activePointerId !== null) return;
    this.activePointerId = pointer.id;
    this.initialPoint = { x: pointer.startPoint.x, y: pointer.startPoint.y };
    this.status = "possible";
  }

  public processMove(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.activePointerId !== pointer.id || !event.point) return;

    if (this.status === "possible") {
      if (pointer.distance >= this.threshold) {
        this.status = "began";
        const gesture = this.createGesture(event, pointer, false);
        this.onDragStart?.(gesture);
        this.status = "changed";
      }
      return;
    }

    if (this.status === "changed") {
      const gesture = this.createGesture(event, pointer, false);
      this.onDrag?.(gesture);
    }
  }

  public processUp(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    if (this.activePointerId !== pointer.id) return;

    if (this.status === "changed" || this.status === "began") {
      this.status = "ended";
      const gesture = this.createGesture(event, pointer, false);
      this.onDragEnd?.(gesture);
    }
    this.reset();
  }

  public processCancel(event: NormalizedInputEvent, pointer: TrackedPointer | null): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "cancelled";
      if (pointer && event.point) {
        const gesture = this.createGesture(event, pointer, true);
        this.onDragEnd?.(gesture);
      }
    }
    this.reset();
  }

  public cancel(): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "cancelled";
    }
    this.reset();
  }

  public reset(): void {
    this.activePointerId = null;
    this.initialPoint = { x: 0, y: 0 };
    this.currentOffset = { x: 0, y: 0 };
    this.status = "possible";
  }

  private createGesture(
    event: NormalizedInputEvent,
    pointer: TrackedPointer,
    cancelled: boolean
  ): DragGesture {
    let rawOffsetX = pointer.currentPoint.x - pointer.startPoint.x;
    let rawOffsetY = pointer.currentPoint.y - pointer.startPoint.y;

    if (this.axis === "x") rawOffsetY = 0;
    if (this.axis === "y") rawOffsetX = 0;

    if (this.bounds) {
      if (this.bounds.minX !== undefined) rawOffsetX = Math.max(this.bounds.minX, rawOffsetX);
      if (this.bounds.maxX !== undefined) rawOffsetX = Math.min(this.bounds.maxX, rawOffsetX);
      if (this.bounds.minY !== undefined) rawOffsetY = Math.max(this.bounds.minY, rawOffsetY);
      if (this.bounds.maxY !== undefined) rawOffsetY = Math.min(this.bounds.maxY, rawOffsetY);
    }

    this.currentOffset = { x: rawOffsetX, y: rawOffsetY };

    return {
      type: "drag",
      status: this.status,
      point: event.point ?? pointer.currentPoint,
      startPoint: pointer.startPoint,
      offset: this.currentOffset,
      delta: { x: pointer.deltaX, y: pointer.deltaY },
      velocity: {
        vx: pointer.velocityX,
        vy: pointer.velocityY,
        speed: Math.hypot(pointer.velocityX, pointer.velocityY),
      },
      axis: this.axis,
      cancelled,
    };
  }
}

// ---------------------------------------------------------------------------
// 5. PAN RECOGNIZER
// ---------------------------------------------------------------------------
export class PanRecognizer implements GestureRecognizer {
  public readonly type = "pan" as const;
  public status: GestureStatus = "possible";

  private readonly threshold: number;
  private readonly lockAxis: boolean;
  private readonly onPanStart?: (gesture: PanGesture) => void;
  private readonly onPan?: (gesture: PanGesture) => void;
  private readonly onPanEnd?: (gesture: PanGesture) => void;

  private lockedAxis: "x" | "y" | null = null;

  constructor(options: PanOptions = {}) {
    this.threshold = options.threshold ?? 5;
    this.lockAxis = options.lockAxis ?? false;
    this.onPanStart = options.onPanStart;
    this.onPan = options.onPan;
    this.onPanEnd = options.onPanEnd;

    if (this.threshold < 0) throw new GestureConfigurationError("threshold must be >= 0");
  }

  public processDown(): void {
    if (this.status !== "changed") {
      this.status = "possible";
    }
  }

  public processMove(event: NormalizedInputEvent, pointer: TrackedPointer, tracker: PointerTracker): void {
    if (!event.point) return;

    if (this.status === "possible") {
      if (pointer.distance >= this.threshold) {
        if (this.lockAxis && !this.lockedAxis) {
          this.lockedAxis = Math.abs(pointer.deltaX) > Math.abs(pointer.deltaY) ? "x" : "y";
        }
        this.status = "began";
        const gesture = this.createGesture(event, pointer, tracker, false);
        this.onPanStart?.(gesture);
        this.status = "changed";
      }
      return;
    }

    if (this.status === "changed") {
      const gesture = this.createGesture(event, pointer, tracker, false);
      this.onPan?.(gesture);
    }
  }

  public processUp(event: NormalizedInputEvent, pointer: TrackedPointer, tracker: PointerTracker): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "ended";
      const gesture = this.createGesture(event, pointer, tracker, false);
      this.onPanEnd?.(gesture);
    }
    if (tracker.pointerCount <= 1) {
      this.reset();
    }
  }

  public processCancel(event: NormalizedInputEvent, pointer: TrackedPointer | null, tracker: PointerTracker): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "cancelled";
      if (pointer && event.point) {
        const gesture = this.createGesture(event, pointer, tracker, true);
        this.onPanEnd?.(gesture);
      }
    }
    this.reset();
  }

  public cancel(): void {
    this.status = "cancelled";
    this.reset();
  }

  public reset(): void {
    this.lockedAxis = null;
    this.status = "possible";
  }

  private createGesture(
    event: NormalizedInputEvent,
    pointer: TrackedPointer,
    tracker: PointerTracker,
    cancelled: boolean
  ): PanGesture {
    let deltaX = pointer.deltaX;
    let deltaY = pointer.deltaY;
    let offsetX = pointer.currentPoint.x - pointer.startPoint.x;
    let offsetY = pointer.currentPoint.y - pointer.startPoint.y;

    if (this.lockedAxis === "x") {
      deltaY = 0;
      offsetY = 0;
    } else if (this.lockedAxis === "y") {
      deltaX = 0;
      offsetX = 0;
    }

    return {
      type: "pan",
      status: this.status,
      point: event.point ?? pointer.currentPoint,
      offset: { x: offsetX, y: offsetY },
      delta: { x: deltaX, y: deltaY },
      velocity: {
        vx: pointer.velocityX,
        vy: pointer.velocityY,
        speed: Math.hypot(pointer.velocityX, pointer.velocityY),
      },
      pointerCount: tracker.pointerCount,
      cancelled,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. SWIPE RECOGNIZER
// ---------------------------------------------------------------------------
export class SwipeRecognizer implements GestureRecognizer {
  public readonly type = "swipe" as const;
  public status: GestureStatus = "possible";

  private readonly minDistance: number;
  private readonly maxDuration: number;
  private readonly minVelocity: number;
  private readonly onSwipe?: (gesture: SwipeGesture) => void;

  constructor(options: SwipeOptions = {}) {
    this.minDistance = options.minDistance ?? 40;
    this.maxDuration = options.maxDuration ?? 350;
    this.minVelocity = options.minVelocity ?? 150;
    this.onSwipe = options.onSwipe;

    if (this.minDistance < 0) throw new GestureConfigurationError("minDistance must be >= 0");
    if (this.maxDuration < 0) throw new GestureConfigurationError("maxDuration must be >= 0");
    if (this.minVelocity < 0) throw new GestureConfigurationError("minVelocity must be >= 0");
  }

  public processDown(): void {
    this.status = "possible";
  }

  public processMove(): void {}

  public processUp(event: NormalizedInputEvent, pointer: TrackedPointer): void {
    const duration = event.timeStamp - pointer.startTime;
    const distance = pointer.distance;
    const speed = Math.hypot(pointer.velocityX, pointer.velocityY);

    if (duration <= this.maxDuration && (distance >= this.minDistance || speed >= this.minVelocity)) {
      const dx = pointer.currentPoint.x - pointer.startPoint.x;
      const dy = pointer.currentPoint.y - pointer.startPoint.y;

      let direction: "up" | "down" | "left" | "right";
      if (Math.abs(dx) >= Math.abs(dy)) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }

      this.status = "recognized";
      const gesture: SwipeGesture = {
        type: "swipe",
        direction,
        distance,
        duration,
        velocity: speed,
        pointerType: pointer.pointerType,
      };
      this.onSwipe?.(gesture);
    } else {
      this.status = "failed";
    }
    this.reset();
  }

  public processCancel(): void {
    this.cancel();
  }

  public cancel(): void {
    this.status = "cancelled";
    this.reset();
  }

  public reset(): void {
    this.status = "possible";
  }
}

// ---------------------------------------------------------------------------
// 7. PINCH RECOGNIZER (MULTI-POINTER)
// ---------------------------------------------------------------------------
export class PinchRecognizer implements GestureRecognizer {
  public readonly type = "pinch" as const;
  public status: GestureStatus = "possible";

  private readonly minDistance: number;
  private readonly onPinchStart?: (gesture: PinchGesture) => void;
  private readonly onPinch?: (gesture: PinchGesture) => void;
  private readonly onPinchEnd?: (gesture: PinchGesture) => void;

  private initialDistance = 0;
  private previousScale = 1;

  constructor(options: PinchOptions = {}) {
    this.minDistance = options.minDistance ?? 10;
    this.onPinchStart = options.onPinchStart;
    this.onPinch = options.onPinch;
    this.onPinchEnd = options.onPinchEnd;

    if (this.minDistance < 0) throw new GestureConfigurationError("minDistance must be >= 0");
  }

  public processDown(_event: NormalizedInputEvent, _pointer: TrackedPointer, tracker: PointerTracker): void {
    if (tracker.pointerCount >= 2 && this.status === "possible") {
      const state = tracker.getMultiPointerState();
      if (state.distance >= this.minDistance) {
        this.initialDistance = state.distance;
        this.previousScale = 1;
        this.status = "began";
        const gesture = this.createGesture(state, false);
        this.onPinchStart?.(gesture);
        this.status = "changed";
      }
    }
  }

  public processMove(_event: NormalizedInputEvent, _pointer: TrackedPointer, tracker: PointerTracker): void {
    if (tracker.pointerCount < 2) return;

    const state = tracker.getMultiPointerState();
    if (this.status === "possible" && state.distance >= this.minDistance) {
      this.initialDistance = state.distance;
      this.previousScale = 1;
      this.status = "began";
      const gesture = this.createGesture(state, false);
      this.onPinchStart?.(gesture);
      this.status = "changed";
      return;
    }

    if (this.status === "changed" && this.initialDistance > 0) {
      const gesture = this.createGesture(state, false);
      this.onPinch?.(gesture);
    }
  }

  public processUp(_event: NormalizedInputEvent, _pointer: TrackedPointer, tracker: PointerTracker): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "ended";
      const state = tracker.getMultiPointerState();
      const gesture = this.createGesture(state, false);
      this.onPinchEnd?.(gesture);
    }
    if (tracker.pointerCount < 2) {
      this.reset();
    }
  }

  public processCancel(_event: NormalizedInputEvent, _pointer: TrackedPointer | null, tracker: PointerTracker): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "cancelled";
      const state = tracker.getMultiPointerState();
      const gesture = this.createGesture(state, true);
      this.onPinchEnd?.(gesture);
    }
    this.reset();
  }

  public cancel(): void {
    this.status = "cancelled";
    this.reset();
  }

  public reset(): void {
    this.initialDistance = 0;
    this.previousScale = 1;
    this.status = "possible";
  }

  private createGesture(state: MultiPointerState, cancelled: boolean): PinchGesture {
    const scale = this.initialDistance > 0 ? state.distance / this.initialDistance : 1;
    const deltaScale = scale - this.previousScale;
    this.previousScale = scale;

    return {
      type: "pinch",
      status: this.status,
      scale,
      deltaScale,
      distance: state.distance,
      initialDistance: this.initialDistance,
      center: state.center,
      cancelled,
    };
  }
}

// ---------------------------------------------------------------------------
// 8. ROTATION RECOGNIZER (MULTI-POINTER)
// ---------------------------------------------------------------------------
export class RotationRecognizer implements GestureRecognizer {
  public readonly type = "rotation" as const;
  public status: GestureStatus = "possible";

  private readonly threshold: number; // In degrees
  private readonly onRotationStart?: (gesture: RotationGesture) => void;
  private readonly onRotation?: (gesture: RotationGesture) => void;
  private readonly onRotationEnd?: (gesture: RotationGesture) => void;

  private initialAngle = 0; // In radians
  private previousRotation = 0; // In degrees

  constructor(options: RotationOptions = {}) {
    this.threshold = options.threshold ?? 1;
    this.onRotationStart = options.onRotationStart;
    this.onRotation = options.onRotation;
    this.onRotationEnd = options.onRotationEnd;

    if (this.threshold < 0) throw new GestureConfigurationError("threshold must be >= 0");
  }

  public processDown(_event: NormalizedInputEvent, _pointer: TrackedPointer, tracker: PointerTracker): void {
    if (tracker.pointerCount >= 2 && this.status === "possible") {
      const state = tracker.getMultiPointerState();
      this.initialAngle = state.angle;
      this.previousRotation = 0;
    }
  }

  public processMove(_event: NormalizedInputEvent, _pointer: TrackedPointer, tracker: PointerTracker): void {
    if (tracker.pointerCount < 2) return;

    const state = tracker.getMultiPointerState();
    const currentAngle = state.angle;
    let radDiff = currentAngle - this.initialAngle;

    // Normalize angle difference to [-PI, PI]
    while (radDiff > Math.PI) radDiff -= 2 * Math.PI;
    while (radDiff < -Math.PI) radDiff += 2 * Math.PI;

    const degDiff = (radDiff * 180) / Math.PI;

    if (this.status === "possible" && Math.abs(degDiff) >= this.threshold) {
      this.status = "began";
      const gesture = this.createGesture(state, degDiff, radDiff, false);
      this.onRotationStart?.(gesture);
      this.onRotation?.(gesture);
      this.status = "changed";
      return;
    }

    if (this.status === "changed") {
      const gesture = this.createGesture(state, degDiff, radDiff, false);
      this.onRotation?.(gesture);
    }
  }

  public processUp(_event: NormalizedInputEvent, _pointer: TrackedPointer, tracker: PointerTracker): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "ended";
      const state = tracker.getMultiPointerState();
      const gesture = this.createGesture(state, this.previousRotation, (this.previousRotation * Math.PI) / 180, false);
      this.onRotationEnd?.(gesture);
    }
    if (tracker.pointerCount < 2) {
      this.reset();
    }
  }

  public processCancel(_event: NormalizedInputEvent, _pointer: TrackedPointer | null, tracker: PointerTracker): void {
    if (this.status === "changed" || this.status === "began") {
      this.status = "cancelled";
      const state = tracker.getMultiPointerState();
      const gesture = this.createGesture(state, this.previousRotation, (this.previousRotation * Math.PI) / 180, true);
      this.onRotationEnd?.(gesture);
    }
    this.reset();
  }

  public cancel(): void {
    this.status = "cancelled";
    this.reset();
  }

  public reset(): void {
    this.initialAngle = 0;
    this.previousRotation = 0;
    this.status = "possible";
  }

  private createGesture(
    state: MultiPointerState,
    rotation: number,
    rotationRad: number,
    cancelled: boolean
  ): RotationGesture {
    const deltaRotation = rotation - this.previousRotation;
    this.previousRotation = rotation;

    return {
      type: "rotation",
      status: this.status,
      rotation,
      deltaRotation,
      rotationRad,
      center: state.center,
      cancelled,
    };
  }
}
