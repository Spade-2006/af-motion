/**
 * AF Motion Universal Interaction Manager
 *
 * Framework-independent controller coordinating normalized inputs, pointer tracking,
 * gestures, keyboard controls, prioritization, and leak-free lifecycle management.
 */

import {
  DoubleTapRecognizer,
  DragRecognizer,
  type GestureRecognizer,
  LongPressRecognizer,
  PanRecognizer,
  PinchRecognizer,
  RotationRecognizer,
  SwipeRecognizer,
  TapRecognizer,
} from "./gesture-recognizers.js";
import { normalizeInputEvent } from "./input-normalizer.js";
import { KeyboardManager } from "./keyboard-manager.js";
import { PointerTracker } from "./pointer-tracker.js";
import { InteractionPrioritizer } from "./prioritizer.js";
import type {
  DoubleTapOptions,
  DragOptions,
  InteractionControls,
  InteractionOptions,
  LongPressOptions,
  NormalizedInputEvent,
  PanOptions,
  PinchOptions,
  RotationOptions,
  SwipeOptions,
  TapOptions,
  TrackedPointer,
} from "./types.js";

interface DOMListener {
  target: EventTarget;
  type: string;
  listener: EventListener;
  options?: boolean | AddEventListenerOptions;
}

export class InteractionManager implements InteractionControls {
  public readonly target: EventTarget;
  private options: InteractionOptions;
  private readonly pointerTracker = new PointerTracker();
  private keyboardManager: KeyboardManager;
  private prioritizer: InteractionPrioritizer;
  private recognizers: GestureRecognizer[] = [];
  private boundListeners: DOMListener[] = [];
  private isDestroyed = false;

  constructor(target: EventTarget, options: InteractionOptions = {}) {
    this.target = target;
    this.options = { ...options };
    this.prioritizer = new InteractionPrioritizer(options.prioritizationRules ?? []);
    this.keyboardManager = new KeyboardManager(
      typeof options.keyboard === "object" ? options.keyboard : { enabled: options.keyboard !== false }
    );

    this.rebuildRecognizers();
    this.attachListeners();
  }

  public get activePointers(): ReadonlyMap<number, TrackedPointer> {
    return this.pointerTracker.activePointers;
  }

  public get isInteracting(): boolean {
    return this.pointerTracker.pointerCount > 0 || this.recognizers.some(
      (r) => r.status === "began" || r.status === "changed"
    );
  }

  public updateOptions(newOptions: Partial<InteractionOptions>): void {
    if (this.isDestroyed) return;

    this.options = { ...this.options, ...newOptions };
    this.prioritizer = new InteractionPrioritizer(this.options.prioritizationRules ?? []);
    this.keyboardManager = new KeyboardManager(
      typeof this.options.keyboard === "object"
        ? this.options.keyboard
        : { enabled: this.options.keyboard !== false }
    );

    this.rebuildRecognizers();
  }

  public cancel(): void {
    for (const recognizer of this.recognizers) {
      recognizer.cancel();
    }
    this.pointerTracker.releaseAll();
    this.pointerTracker.clear();
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
    this.boundListeners = [];
    this.recognizers = [];
  }

  private rebuildRecognizers(): void {
    // Cancel existing recognizers before rebuilding
    for (const recognizer of this.recognizers) {
      recognizer.cancel();
    }
    this.recognizers = [];

    // Tap
    if (this.options.tap) {
      const opts: TapOptions = typeof this.options.tap === "object" ? this.options.tap : {};
      this.recognizers.push(new TapRecognizer(opts));
    }

    // Double Tap
    if (this.options.doubleTap) {
      const opts: DoubleTapOptions = typeof this.options.doubleTap === "object" ? this.options.doubleTap : {};
      this.recognizers.push(new DoubleTapRecognizer(opts));
    }

    // Long Press
    if (this.options.longPress) {
      const opts: LongPressOptions = typeof this.options.longPress === "object" ? this.options.longPress : {};
      this.recognizers.push(new LongPressRecognizer(opts));
    }

    // Drag
    if (this.options.drag) {
      const opts: DragOptions = typeof this.options.drag === "object" ? this.options.drag : {};
      this.recognizers.push(new DragRecognizer(opts));
    }

    // Pan
    if (this.options.pan) {
      const opts: PanOptions = typeof this.options.pan === "object" ? this.options.pan : {};
      this.recognizers.push(new PanRecognizer(opts));
    }

    // Swipe
    if (this.options.swipe) {
      const opts: SwipeOptions = typeof this.options.swipe === "object" ? this.options.swipe : {};
      this.recognizers.push(new SwipeRecognizer(opts));
    }

    // Pinch
    if (this.options.pinch) {
      const opts: PinchOptions = typeof this.options.pinch === "object" ? this.options.pinch : {};
      this.recognizers.push(new PinchRecognizer(opts));
    }

    // Rotation
    if (this.options.rotation) {
      const opts: RotationOptions = typeof this.options.rotation === "object" ? this.options.rotation : {};
      this.recognizers.push(new RotationRecognizer(opts));
    }
  }

  private attachListeners(): void {
    if (typeof window === "undefined" || !this.target) return;

    const add = (target: EventTarget, type: string, handler: EventListener, passive = true) => {
      const options = { passive };
      target.addEventListener(type, handler, options);
      this.boundListeners.push({ target, type, listener: handler, options });
    };

    const isPassive = this.options.passive ?? false;

    // Pointer Events
    add(this.target, "pointerdown", this.handlePointerDown as EventListener, isPassive);
    add(this.target, "pointermove", this.handlePointerMove as EventListener, isPassive);
    add(this.target, "pointerup", this.handlePointerUp as EventListener, isPassive);
    add(this.target, "pointercancel", this.handlePointerCancel as EventListener, isPassive);
    add(this.target, "pointerenter", this.handlePointerEnter as EventListener, true);
    add(this.target, "pointerleave", this.handlePointerLeave as EventListener, true);

    // Keyboard Events
    add(this.target, "keydown", this.handleKeyDown as EventListener, isPassive);
    add(this.target, "keyup", this.handleKeyUp as EventListener, true);

    // Window blur safety
    if (typeof window !== "undefined") {
      add(window, "blur", this.handleWindowBlur as EventListener, true);
    }
  }

  private checkPreventDefault(normalized: NormalizedInputEvent): void {
    if (typeof this.options.preventDefault === "function") {
      if (this.options.preventDefault(normalized)) {
        normalized.preventDefault();
      }
    } else if (this.options.preventDefault === true) {
      normalized.preventDefault();
    }
  }

  private handlePointerDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.checkPreventDefault(normalized);

    const pointer = this.pointerTracker.trackDown(normalized);
    if (!pointer) return;

    if (
      this.options.capturePointer &&
      typeof HTMLElement !== "undefined" &&
      this.target instanceof HTMLElement &&
      normalized.pointerId !== null
    ) {
      this.pointerTracker.capture(this.target, normalized.pointerId);
    }

    this.options.onPointerDown?.(normalized);

    for (const recognizer of this.recognizers) {
      recognizer.processDown(normalized, pointer, this.pointerTracker);
      this.prioritizer.resolveConflicts(recognizer, this.recognizers);
    }
  };

  private handlePointerMove = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.checkPreventDefault(normalized);

    const pointer = this.pointerTracker.trackMove(normalized);
    if (!pointer) return;

    this.options.onPointerMove?.(normalized);

    for (const recognizer of this.recognizers) {
      recognizer.processMove(normalized, pointer, this.pointerTracker);
      this.prioritizer.resolveConflicts(recognizer, this.recognizers);
    }
  };

  private handlePointerUp = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.checkPreventDefault(normalized);

    const pointer = this.pointerTracker.trackUp(normalized);
    if (
      typeof HTMLElement !== "undefined" &&
      this.target instanceof HTMLElement &&
      normalized.pointerId !== null
    ) {
      this.pointerTracker.release(this.target, normalized.pointerId);
    }

    this.options.onPointerUp?.(normalized);

    if (pointer) {
      for (const recognizer of this.recognizers) {
        recognizer.processUp(normalized, pointer, this.pointerTracker);
      }
    }
  };

  private handlePointerCancel = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    const pointer = this.pointerTracker.trackCancel(normalized);

    if (
      typeof HTMLElement !== "undefined" &&
      this.target instanceof HTMLElement &&
      normalized.pointerId !== null
    ) {
      this.pointerTracker.release(this.target, normalized.pointerId);
    }

    this.options.onPointerCancel?.(normalized);

    for (const recognizer of this.recognizers) {
      recognizer.processCancel(normalized, pointer, this.pointerTracker);
    }
  };

  private handlePointerEnter = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.options.onPointerEnter?.(normalized);
  };

  private handlePointerLeave = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.options.onPointerLeave?.(normalized);
  };

  private handleKeyDown = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.checkPreventDefault(normalized);
    this.keyboardManager.handleKeyDown(normalized);
  };

  private handleKeyUp = (event: Event): void => {
    if (this.isDestroyed) return;
    const normalized = normalizeInputEvent(event, this.target);
    this.keyboardManager.handleKeyUp(normalized);
  };

  private handleWindowBlur = (): void => {
    this.cancel();
  };
}

/**
 * Creates and attaches a Universal Interaction Manager to a target element.
 */
export function createInteractionManager(
  target: EventTarget,
  options: InteractionOptions = {}
): InteractionControls {
  return new InteractionManager(target, options);
}

/**
 * Convenience alias for `createInteractionManager`.
 */
export const interact = createInteractionManager;
