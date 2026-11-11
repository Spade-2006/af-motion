/**
 * AF Motion Shared Element Transition Controller & Engine
 *
 * FLIP-based geometry interpolation, crossfading, border-radius blending,
 * interruption handling, nested compensation, and RAF-driven lifecycle control.
 */

import { animateProgress, type AnimationControls } from "../animation.js";
import { getEasing } from "../../easing/easings.js";
import { prefersReducedMotion } from "../motion.js";
import { setTransformLayer, removeTransformLayer } from "../transform.js";
import { measureLayout } from "../layout/measure.js";
import { sharedElementRegistry, SharedElementRegistry } from "./shared-element.js";
import type {
  CreateSharedElementTransitionOptions,
  SharedElementRect,
  SharedElementSnapshot,
  SharedElementTransitionConfig,
  SharedElementTransitionController,
  SharedElementTransitionState,
} from "./types.js";

/**
 * Resolves an element reference from a selector or direct HTMLElement.
 */
function resolveElement(target: HTMLElement | string | undefined | null): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") {
    if (typeof document === "undefined") return null;
    return document.querySelector<HTMLElement>(target);
  }
  return target;
}

/**
 * Parses numeric pixel value from border-radius string (e.g. "16px", "8px 8px", "50%").
 */
function parseBorderRadius(radiusStr: string | undefined, elementWidth = 100): number {
  if (!radiusStr || radiusStr === "0px" || radiusStr === "none") return 0;
  if (radiusStr.endsWith("%")) {
    const pct = Number.parseFloat(radiusStr);
    return (pct / 100) * (elementWidth / 2);
  }
  const match = radiusStr.match(/([\d.]+)px/);
  return match && match[1] ? Number.parseFloat(match[1]) : 0;
}

export class SharedElementTransitionImpl implements SharedElementTransitionController {
  private _state: SharedElementTransitionState = "idle";
  private _progress = 0;
  private _isPlaying = false;
  private animControls: AnimationControls | null = null;
  private readonly layerOwner = {};

  private readonly id: string;
  private readonly config: SharedElementTransitionConfig;
  private readonly registry: SharedElementRegistry;

  private sourceEl: HTMLElement | null = null;
  private destEl: HTMLElement | null = null;
  private sourceSnapshot: SharedElementSnapshot | null = null;

  private sourceRect: SharedElementRect = { top: 0, left: 0, width: 0, height: 0 };
  private destRect: SharedElementRect = { top: 0, left: 0, width: 0, height: 0 };

  private deltaX = 0;
  private deltaY = 0;
  private scaleX = 1;
  private scaleY = 1;

  private startRadius = 0;
  private targetRadius = 0;

  private initialDestStyles: {
    transform?: string;
    transformOrigin?: string;
    borderRadius?: string;
    opacity?: string;
    transition?: string;
  } = {};

  private cloneOverlay: HTMLElement | null = null;
  private resolveStartPromise: (() => void) | null = null;

  constructor(options: CreateSharedElementTransitionOptions = {}) {
    this.id = options.id ?? `se-${Date.now().toString(36)}`;
    this.config = options.config ?? {};
    this.registry = options.registry ?? sharedElementRegistry;

    // Resolve source
    if (options.source && typeof options.source === "object" && "top" in options.source && "left" in options.source) {
      this.sourceRect = options.source as SharedElementRect;
    } else {
      this.sourceEl = resolveElement(options.source as HTMLElement | string | undefined);
    }

    // Resolve destination
    if (options.destination && typeof options.destination === "object" && "top" in options.destination && "left" in options.destination) {
      this.destRect = options.destination as SharedElementRect;
    } else {
      this.destEl = resolveElement(options.destination as HTMLElement | string | undefined);
    }

    // If not supplied directly, attempt resolution from registry
    if (!this.sourceEl && (!this.sourceRect || this.sourceRect.width === 0)) {
      this.sourceEl = this.registry.getElement(this.id, "source");
      this.sourceSnapshot = this.registry.getSnapshot(this.id, "source");
    }
    if (!this.destEl && (!this.destRect || this.destRect.width === 0)) {
      this.destEl = this.registry.getElement(this.id, "destination");
    }
  }

  public get state(): SharedElementTransitionState {
    return this._state;
  }

  public get progress(): number {
    return this._progress;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public getState(): SharedElementTransitionState {
    return this._state;
  }

  /**
   * Prepares and measures elements for the FLIP transition.
   */
  private measure(): boolean {
    this._state = "measuring";

    // Measure destination
    if (this.destEl && typeof this.destEl.getBoundingClientRect === "function") {
      const measured = measureLayout(this.destEl, false);
      this.destRect = {
        top: measured.top,
        left: measured.left,
        width: measured.width,
        height: measured.height,
      };
    }

    // Measure source
    if (this.sourceEl && typeof this.sourceEl.getBoundingClientRect === "function") {
      const measured = measureLayout(this.sourceEl, false);
      this.sourceRect = {
        top: measured.top,
        left: measured.left,
        width: measured.width,
        height: measured.height,
      };
    } else if (this.sourceSnapshot) {
      this.sourceRect = this.sourceSnapshot.rect;
    } else {
      const captured = this.registry.getCapturedRect(this.id);
      if (captured) {
        this.sourceRect = captured;
      }
    }

    // Validate geometry
    if (!this.destEl && (!this.destRect || this.destRect.width === 0)) {
      // Missing destination
      return false;
    }

    if (!this.sourceRect || this.sourceRect.width === 0) {
      // Source missing - fallback to simple entrance
      this.sourceRect = {
        top: this.destRect.top,
        left: this.destRect.left,
        width: this.destRect.width * 0.95,
        height: this.destRect.height * 0.95,
      };
    }

    // Compute FLIP deltas
    this.deltaX = this.sourceRect.left - this.destRect.left;
    this.deltaY = this.sourceRect.top - this.destRect.top;

    const destW = Math.max(1, this.destRect.width);
    const destH = Math.max(1, this.destRect.height);
    this.scaleX = this.sourceRect.width / destW;
    this.scaleY = this.sourceRect.height / destH;

    // Compensate for parent translation if nested
    const parentId = this.registry.getNestedUnder(this.id);
    if (parentId) {
      const parentSnap = this.registry.getSnapshot(parentId);
      const parentDestEl = this.registry.getElement(parentId, "destination");
      if (parentSnap && parentDestEl) {
        const parentDestRect = measureLayout(parentDestEl, false);
        const parentDeltaX = parentSnap.rect.left - parentDestRect.left;
        const parentDeltaY = parentSnap.rect.top - parentDestRect.top;
        this.deltaX -= parentDeltaX;
        this.deltaY -= parentDeltaY;
      }
    }

    // Border radius resolution
    if (this.config.interpolateBorderRadius !== false) {
      if (this.destEl && typeof window !== "undefined") {
        const destStyles = window.getComputedStyle(this.destEl);
        this.targetRadius = parseBorderRadius(destStyles.borderRadius, this.destRect.width);
      }
      if (this.sourceSnapshot) {
        this.startRadius = parseBorderRadius(this.sourceSnapshot.styles.borderRadius, this.sourceRect.width);
      } else if (this.sourceEl && typeof window !== "undefined") {
        const srcStyles = window.getComputedStyle(this.sourceEl);
        this.startRadius = parseBorderRadius(srcStyles.borderRadius, this.sourceRect.width);
      } else {
        this.startRadius = this.targetRadius;
      }
    }

    return true;
  }

  /**
   * Applies the initial inverted FLIP state before painting.
   */
  private applyInitialFLIP(): void {
    if (!this.destEl) return;

    // Snapshot destination inline styles for safe cleanup
    this.initialDestStyles = {
      transform: this.destEl.style.transform,
      transformOrigin: this.destEl.style.transformOrigin,
      borderRadius: this.destEl.style.borderRadius,
      opacity: this.destEl.style.opacity,
      transition: this.destEl.style.transition,
    };

    // Prevent CSS transitions from conflicting with JS animation
    this.destEl.style.transition = "none";
    this.destEl.style.transformOrigin = "top left";

    // If crossfade requested and source element exists, create clone overlay
    if (this.config.crossfade && this.sourceEl && typeof document !== "undefined") {
      try {
        const clone = this.sourceEl.cloneNode(true) as HTMLElement;
        clone.style.position = "fixed";
        clone.style.top = `${this.sourceRect.top}px`;
        clone.style.left = `${this.sourceRect.left}px`;
        clone.style.width = `${this.sourceRect.width}px`;
        clone.style.height = `${this.sourceRect.height}px`;
        clone.style.margin = "0";
        clone.style.pointerEvents = "none";
        clone.style.zIndex = "999999";
        clone.setAttribute("aria-hidden", "true");

        const container = this.config.overlayContainer ?? document.body;
        container.appendChild(clone);
        this.cloneOverlay = clone;
      } catch {
        // Clone fallback
      }
    }

    this.applyProgress(0);
  }

  /**
   * Applies interpolated position, scale, opacity, and border radius at given progress (0 to 1).
   */
  private applyProgress(rawProgress: number): void {
    this._progress = Math.max(0, Math.min(1, rawProgress));

    const resolvedEase = typeof this.config.easing === "string"
      ? getEasing(this.config.easing)
      : typeof this.config.easing === "function"
      ? this.config.easing
      : null;
    const easeFn = resolvedEase ?? getEasing("easeInOutCubic") ?? ((x: number) => x);

    const t = easeFn(this._progress);

    if (this.destEl) {
      // Invert transforms: at progress 0, offset by delta and scale; at progress 1, offset is 0 and scale is 1
      const currentX = this.deltaX * (1 - t);
      const currentY = this.deltaY * (1 - t);
      const currentScaleX = this.scaleX + (1 - this.scaleX) * t;
      const currentScaleY = this.scaleY + (1 - this.scaleY) * t;

      setTransformLayer(
        this.destEl,
        this.layerOwner,
        `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0px) scale(${currentScaleX.toFixed(4)}, ${currentScaleY.toFixed(4)})`
      );

      // Interpolate border radius
      if (this.config.interpolateBorderRadius !== false && (this.startRadius > 0 || this.targetRadius > 0)) {
        const r = this.startRadius + (this.targetRadius - this.startRadius) * t;
        this.destEl.style.borderRadius = `${r.toFixed(1)}px`;
      }

      // Crossfade opacity
      if (this.config.crossfade) {
        this.destEl.style.opacity = String(t);
        if (this.cloneOverlay) {
          this.cloneOverlay.style.opacity = String(1 - t);
          // Also translate clone toward destination
          const cloneX = (this.destRect.left - this.sourceRect.left) * t;
          const cloneY = (this.destRect.top - this.sourceRect.top) * t;
          const cloneScaleX = 1 + (1 / Math.max(0.001, this.scaleX) - 1) * t;
          const cloneScaleY = 1 + (1 / Math.max(0.001, this.scaleY) - 1) * t;
          this.cloneOverlay.style.transform = `translate3d(${cloneX.toFixed(2)}px, ${cloneY.toFixed(2)}px, 0px) scale(${cloneScaleX.toFixed(4)}, ${cloneScaleY.toFixed(4)})`;
        }
      }
    }

    this.config.onUpdate?.(this._progress);
  }

  /**
   * Cleans up all inline styles, transform layers, and clone overlays.
   */
  private cleanup(): void {
    if (this.animControls) {
      this.animControls.cancel();
      this.animControls = null;
    }

    if (this.cloneOverlay && this.cloneOverlay.parentNode) {
      this.cloneOverlay.parentNode.removeChild(this.cloneOverlay);
      this.cloneOverlay = null;
    }

    if (this.destEl) {
      removeTransformLayer(this.destEl, this.layerOwner);
      if (this.initialDestStyles.transform !== undefined) {
        this.destEl.style.transform = this.initialDestStyles.transform;
      }
      if (this.initialDestStyles.transformOrigin !== undefined) {
        this.destEl.style.transformOrigin = this.initialDestStyles.transformOrigin;
      }
      if (this.initialDestStyles.borderRadius !== undefined) {
        this.destEl.style.borderRadius = this.initialDestStyles.borderRadius;
      }
      if (this.initialDestStyles.opacity !== undefined) {
        this.destEl.style.opacity = this.initialDestStyles.opacity;
      }
      if (this.initialDestStyles.transition !== undefined) {
        this.destEl.style.transition = this.initialDestStyles.transition;
      }
    }

    this._isPlaying = false;
  }

  /**
   * Starts the shared element transition.
   */
  public start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.resolveStartPromise = resolve;

      // Handle reduced motion: instant settle or quick fade
      const isReduced = this.config.respectReducedMotion !== false && prefersReducedMotion();
      if (isReduced) {
        this._state = "completed";
        this._progress = 1;
        this.config.onComplete?.();
        resolve();
        return;
      }

      const measured = this.measure();
      if (!measured) {
        this._state = "completed";
        this._progress = 1;
        this.config.onComplete?.();
        resolve();
        return;
      }

      this.applyInitialFLIP();
      this._state = "animating";
      this._isPlaying = true;
      this.config.onStart?.();

      const duration = this.config.duration ?? 350;
      const delay = this.config.delay ?? 0;

      this.animControls = animateProgress({
        duration,
        delay,
        onUpdate: (p) => {
          this.applyProgress(p);
        },
        onComplete: () => {
          this._state = "completed";
          this.cleanup();
          this.config.onComplete?.();
          this.resolveStartPromise?.();
          this.resolveStartPromise = null;
        },
      });
    });
  }

  /**
   * Pauses the transition mid-flight.
   */
  public pause(): void {
    if (this._state === "animating") {
      this.animControls?.pause();
      this._state = "paused";
      this._isPlaying = false;
    }
  }

  /**
   * Resumes a paused transition.
   */
  public resume(): void {
    if (this._state === "paused") {
      this.animControls?.resume();
      this._state = "animating";
      this._isPlaying = true;
    }
  }

  /**
   * Reverses the transition direction back toward the source pose.
   */
  public reverse(): void {
    if (this.animControls) {
      this.animControls.reverse();
    }
  }

  /**
   * Seeks immediately to a normalized progress value (0 to 1).
   */
  public seek(progress: number): void {
    if (this._state === "idle") {
      this.measure();
      this.applyInitialFLIP();
    }
    this.applyProgress(progress);
  }

  /**
   * Cancels the transition immediately and resets element to initial state.
   */
  public cancel(): void {
    this._state = "cancelled";
    this.cleanup();
    this.config.onCancel?.();
    this.resolveStartPromise?.();
    this.resolveStartPromise = null;
  }

  /**
   * Fast-forwards the transition to the finished state (progress 1).
   */
  public finish(): void {
    this.applyProgress(1);
    this._state = "completed";
    this.cleanup();
    this.config.onComplete?.();
    this.resolveStartPromise?.();
    this.resolveStartPromise = null;
  }

  /**
   * Smoothly retargets an ongoing transition to a new destination rect or element.
   */
  public retarget(newDestination: HTMLElement | SharedElementRect): void {
    let newRect: SharedElementRect;
    if (newDestination && "top" in newDestination) {
      newRect = newDestination as SharedElementRect;
    } else {
      this.destEl = newDestination as HTMLElement;
      newRect = measureLayout(this.destEl, false);
    }

    // Capture current interpolated location as new source
    const currentT = this._progress;
    const currentX = this.destRect.left + this.deltaX * (1 - currentT);
    const currentY = this.destRect.top + this.deltaY * (1 - currentT);
    const currentW = this.destRect.width * (this.scaleX + (1 - this.scaleX) * currentT);
    const currentH = this.destRect.height * (this.scaleY + (1 - this.scaleY) * currentT);

    this.sourceRect = {
      top: currentY,
      left: currentX,
      width: currentW,
      height: currentH,
    };
    this.destRect = newRect;

    // Recalculate deltas from current point to new destination
    this.deltaX = this.sourceRect.left - this.destRect.left;
    this.deltaY = this.sourceRect.top - this.destRect.top;
    this.scaleX = this.sourceRect.width / Math.max(1, this.destRect.width);
    this.scaleY = this.sourceRect.height / Math.max(1, this.destRect.height);

    // Reset progress to 0 and continue to new destination smoothly
    this._progress = 0;
    this.applyProgress(0);
  }
}

/**
 * Creates a shared element transition controller between source and destination elements.
 */
export function createSharedElementTransition(
  options: CreateSharedElementTransitionOptions = {}
): SharedElementTransitionController {
  return new SharedElementTransitionImpl(options);
}
