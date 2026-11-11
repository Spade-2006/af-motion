/**
 * AF Motion Advanced Pointer Controller
 *
 * Framework-independent controller providing multi-device pointer tracking,
 * hover management, pressure/tilt/twist, acceleration, and capture lifecycle.
 */

import { getDeviceCapabilities } from "./device-capabilities.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import { PointerTracker } from "./pointer-tracker.js";
import type {
  DeviceCapabilities,
  NormalizedInputEvent,
  PointerController,
  PointerControllerOptions,
  PointerControllerState,
  TrackedPointer,
} from "./types.js";

interface DOMListener {
  target: EventTarget;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

export class AdvancedPointerController implements PointerController {
  public readonly target: HTMLElement;
  private readonly options: PointerControllerOptions;
  private readonly tracker: PointerTracker;
  private readonly boundListeners: DOMListener[] = [];
  private hovered = false;
  private isDestroyed = false;

  constructor(target: HTMLElement, options: PointerControllerOptions = {}) {
    this.target = target;
    this.options = { ...options };
    this.tracker = new PointerTracker({
      sampleWindowMs: options.sampleWindowMs,
      maxHistory: options.maxHistory,
    });

    this.attach();
  }

  public getState(): PointerControllerState {
    return {
      isHovered: this.hovered,
      activePointers: this.tracker.activePointers,
      pointerCount: this.tracker.pointerCount,
      primaryPointer: this.tracker.getPrimaryPointer() ?? null,
      deviceCapabilities: this.getDeviceCapabilities(),
    };
  }

  public isHovered(): boolean {
    return this.hovered;
  }

  public getActivePointers(): ReadonlyMap<number, TrackedPointer> {
    return this.tracker.activePointers;
  }

  public getPrimaryPointer(): TrackedPointer | null {
    return this.tracker.getPrimaryPointer() ?? null;
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return getDeviceCapabilities();
  }

  public cancel(): void {
    this.tracker.releaseAll();
    this.tracker.clear();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.cancel();

    for (const { target, type, listener, options } of this.boundListeners) {
      try {
        target.removeEventListener(type, listener, options);
      } catch {
        // Safe disposal
      }
    }
    this.boundListeners.length = 0;
  }

  private attach(): void {
    if (typeof window === "undefined" || !this.target) return;

    const add = (target: EventTarget, type: string, handler: EventListener, passive = true) => {
      const options = { passive };
      target.addEventListener(type, handler, options);
      this.boundListeners.push({ target, type, listener: handler, options });
    };

    add(this.target, "pointerenter", this.handlePointerEnter as EventListener, true);
    add(this.target, "pointerleave", this.handlePointerLeave as EventListener, true);
    add(this.target, "pointerdown", this.handlePointerDown as EventListener, true);
    add(this.target, "pointermove", this.handlePointerMove as EventListener, true);
    add(this.target, "pointerup", this.handlePointerUp as EventListener, true);
    add(this.target, "pointercancel", this.handlePointerCancel as EventListener, true);
    add(this.target, "lostpointercapture", this.handlePointerCancel as EventListener, true);
  }

  private handlePointerEnter = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.hovered = true;
    this.options.onPointerEnter?.(normalized);
    this.options.onHoverChange?.(true, normalized);
  };

  private handlePointerLeave = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.hovered = false;
    this.options.onPointerLeave?.(normalized);
    this.options.onHoverChange?.(false, normalized);
  };

  private handlePointerDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const pointer = this.tracker.trackDown(normalized);
    if (!pointer) return;

    if (this.options.capturePointer && normalized.pointerId !== null) {
      this.tracker.capture(this.target, normalized.pointerId);
    }

    this.options.onPointerDown?.(normalized, pointer);
  };

  private handlePointerMove = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const pointer = this.tracker.trackMove(normalized);
    if (!pointer) return;

    this.options.onPointerMove?.(normalized, pointer);
  };

  private handlePointerUp = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const pointer = this.tracker.trackUp(normalized);

    if (normalized.pointerId !== null) {
      this.tracker.release(this.target, normalized.pointerId);
    }

    if (pointer) {
      this.options.onPointerUp?.(normalized, pointer);
    }
  };

  private handlePointerCancel = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const pointer = this.tracker.trackCancel(normalized);

    if (normalized.pointerId !== null) {
      this.tracker.release(this.target, normalized.pointerId);
    }

    this.options.onPointerCancel?.(normalized, pointer);
  };
}

/**
 * Creates and attaches an Advanced Pointer Controller to an element.
 */
export function createPointerController(
  target: HTMLElement,
  options: PointerControllerOptions = {}
): PointerController {
  return new AdvancedPointerController(target, options);
}
