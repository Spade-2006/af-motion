/**
 * AF Motion Pointer Tracker
 *
 * Tracks single and multi-touch pointers, computes velocity, acceleration, movement delta,
 * distances, contact dimensions, and multi-pointer centroids/angles with pointer capture management.
 */

import { acquirePointerCapture, releasePointerCapture } from "../pointer-capture.js";
import type {
  InteractionPoint,
  MultiPointerState,
  NormalizedInputEvent,
  Point2D,
  TrackedPointer,
} from "./types.js";

const DEFAULT_SAMPLE_WINDOW_MS = 100;
const DEFAULT_MAX_HISTORY = 10;

export interface PointerTrackerOptions {
  sampleWindowMs?: number;
  maxHistory?: number;
}

export class PointerTracker {
  private readonly pointers = new Map<number, TrackedPointer>();
  private readonly capturedPointers = new Map<HTMLElement, Set<number>>();
  private readonly sampleWindowMs: number;
  private readonly maxHistory: number;

  constructor(options: PointerTrackerOptions = {}) {
    this.sampleWindowMs = options.sampleWindowMs ?? DEFAULT_SAMPLE_WINDOW_MS;
    this.maxHistory = options.maxHistory ?? DEFAULT_MAX_HISTORY;
  }

  public get activePointers(): ReadonlyMap<number, TrackedPointer> {
    return this.pointers;
  }

  public get pointerCount(): number {
    return this.pointers.size;
  }

  public getPointer(id: number): TrackedPointer | undefined {
    return this.pointers.get(id);
  }

  public getPrimaryPointer(): TrackedPointer | undefined {
    for (const pointer of this.pointers.values()) {
      if (pointer.isPrimary) return pointer;
    }
    return this.pointers.values().next().value;
  }

  public trackDown(event: NormalizedInputEvent): TrackedPointer | null {
    if (!event.point) return null;

    const id = event.pointerId ?? 1;
    const point = event.point;
    const time = event.timeStamp;

    const tracked: TrackedPointer = {
      id,
      pointerType: event.pointerType,
      isPrimary: event.isPrimary,
      startPoint: point,
      currentPoint: point,
      previousPoint: point,
      startTime: time,
      lastUpdateTime: time,
      distance: 0,
      deltaX: 0,
      deltaY: 0,
      velocityX: 0,
      velocityY: 0,
      accelerationX: 0,
      accelerationY: 0,
      width: event.width,
      height: event.height,
      history: [{ point: { x: point.x, y: point.y }, time }],
    };

    this.pointers.set(id, tracked);
    return tracked;
  }

  public trackMove(event: NormalizedInputEvent): TrackedPointer | null {
    if (!event.point) return null;

    const id = event.pointerId ?? 1;
    const existing = this.pointers.get(id);
    if (!existing) {
      return this.trackDown(event);
    }

    const currentPoint = event.point;
    const previousPoint = existing.currentPoint;
    const time = event.timeStamp;

    const deltaX = currentPoint.x - previousPoint.x;
    const deltaY = currentPoint.y - previousPoint.y;
    const totalDistance = Math.hypot(
      currentPoint.x - existing.startPoint.x,
      currentPoint.y - existing.startPoint.y
    );

    const history = [...existing.history, { point: { x: currentPoint.x, y: currentPoint.y }, time }];
    if (history.length > this.maxHistory) {
      history.shift();
    }

    // Velocity calculation based on history window
    const { velocityX, velocityY } = this.calculateVelocity(history, time);

    // Acceleration calculation
    const dt = (time - existing.lastUpdateTime) / 1000;
    let accelerationX = existing.accelerationX;
    let accelerationY = existing.accelerationY;
    if (dt > 0.001) {
      accelerationX = (velocityX - existing.velocityX) / dt;
      accelerationY = (velocityY - existing.velocityY) / dt;
    }

    const updated: TrackedPointer = {
      ...existing,
      previousPoint,
      currentPoint,
      lastUpdateTime: time,
      distance: totalDistance,
      deltaX,
      deltaY,
      velocityX,
      velocityY,
      accelerationX,
      accelerationY,
      width: event.width ?? existing.width,
      height: event.height ?? existing.height,
      history,
    };

    this.pointers.set(id, updated);
    return updated;
  }

  public trackUp(event: NormalizedInputEvent): TrackedPointer | null {
    const id = event.pointerId ?? 1;
    const existing = this.pointers.get(id);
    if (!existing) return null;

    if (event.point) {
      const currentPoint = event.point;
      const history = [...existing.history, { point: { x: currentPoint.x, y: currentPoint.y }, time: event.timeStamp }];
      const { velocityX, velocityY } = this.calculateVelocity(history, event.timeStamp);
      const dt = (event.timeStamp - existing.lastUpdateTime) / 1000;
      let accelerationX = existing.accelerationX;
      let accelerationY = existing.accelerationY;
      if (dt > 0.001) {
        accelerationX = (velocityX - existing.velocityX) / dt;
        accelerationY = (velocityY - existing.velocityY) / dt;
      }

      const finalPointer: TrackedPointer = {
        ...existing,
        previousPoint: existing.currentPoint,
        currentPoint,
        lastUpdateTime: event.timeStamp,
        distance: Math.hypot(currentPoint.x - existing.startPoint.x, currentPoint.y - existing.startPoint.y),
        velocityX,
        velocityY,
        accelerationX,
        accelerationY,
        width: event.width ?? existing.width,
        height: event.height ?? existing.height,
        history,
      };

      this.pointers.delete(id);
      return finalPointer;
    }

    this.pointers.delete(id);
    return existing;
  }

  public trackCancel(event: NormalizedInputEvent): TrackedPointer | null {
    const id = event.pointerId ?? 1;
    const existing = this.pointers.get(id);
    if (existing) {
      this.pointers.delete(id);
    }
    return existing ?? null;
  }

  public clear(): void {
    this.pointers.clear();
  }

  public getMultiPointerState(): MultiPointerState {
    const pointerList = Array.from(this.pointers.values());
    const count = pointerList.length;

    if (count === 0) {
      return {
        count: 0,
        pointers: [],
        center: { x: 0, y: 0 },
        distance: 0,
        angle: 0,
        angleDegrees: 0,
      };
    }

    if (count === 1) {
      const p = pointerList[0];
      return {
        count: 1,
        pointers: pointerList,
        center: { x: p.currentPoint.x, y: p.currentPoint.y },
        distance: 0,
        angle: 0,
        angleDegrees: 0,
      };
    }

    // Centroid calculation
    let sumX = 0;
    let sumY = 0;
    for (const p of pointerList) {
      sumX += p.currentPoint.x;
      sumY += p.currentPoint.y;
    }
    const center: Point2D = {
      x: sumX / count,
      y: sumY / count,
    };

    // For 2 pointers, calculate distance and angle between them
    const p1 = pointerList[0];
    const p2 = pointerList[1];
    const dx = p2.currentPoint.x - p1.currentPoint.x;
    const dy = p2.currentPoint.y - p1.currentPoint.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const angleDegrees = (angle * 180) / Math.PI;

    return {
      count,
      pointers: pointerList,
      center,
      distance,
      angle,
      angleDegrees,
    };
  }

  public capture(element: HTMLElement, pointerId: number): void {
    acquirePointerCapture(element, pointerId);
    let set = this.capturedPointers.get(element);
    if (!set) {
      set = new Set();
      this.capturedPointers.set(element, set);
    }
    set.add(pointerId);
  }

  public release(element: HTMLElement, pointerId: number): void {
    releasePointerCapture(element, pointerId);
    const set = this.capturedPointers.get(element);
    if (set) {
      set.delete(pointerId);
      if (set.size === 0) {
        this.capturedPointers.delete(element);
      }
    }
  }

  public releaseAll(): void {
    for (const [element, pointerIds] of this.capturedPointers.entries()) {
      for (const id of pointerIds) {
        releasePointerCapture(element, id);
      }
    }
    this.capturedPointers.clear();
  }

  private calculateVelocity(
    history: readonly { readonly point: Point2D; readonly time: number }[],
    currentTime: number
  ): { velocityX: number; velocityY: number } {
    if (history.length < 2) return { velocityX: 0, velocityY: 0 };

    // Find the oldest sample within the window
    const cutoff = currentTime - this.sampleWindowMs;
    let sample = history[0];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].time <= cutoff) {
        sample = history[i];
        break;
      }
    }

    const latest = history[history.length - 1];
    const dt = (latest.time - sample.time) / 1000;

    if (dt <= 0.001) return { velocityX: 0, velocityY: 0 };

    return {
      velocityX: (latest.point.x - sample.point.x) / dt,
      velocityY: (latest.point.y - sample.point.y) / dt,
    };
  }
}
