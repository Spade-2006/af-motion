/**
 * AF Motion Automatic Layout Controller
 *
 * Encapsulates automatic observation (ResizeObserver / MutationObserver),
 * FLIP delta calculations, retargeting, and lifecycle management for a DOM element.
 */

import type { AnimationControls } from "../animation.js";
import { prefersReducedMotion } from "../motion.js";
import { resolveLayoutConfig } from "./presets.js";
import { areRectsEqual, measureLayout } from "./measure.js";
import { animateLayoutChange, computeFLIPDelta } from "./flip.js";
import type {
  LayoutChangeEvent,
  LayoutController,
  LayoutControllerOptions,
  LayoutControllerState,
  LayoutDelta,
  LayoutRect,
  LayoutTransitionOptions,
} from "./types.js";

let nextControllerId = 0;

export class LayoutControllerImpl implements LayoutController {
  public readonly id: string;
  public readonly element: HTMLElement;

  private options: LayoutControllerOptions;
  private previousRect: LayoutRect | null = null;
  private currentControls: AnimationControls | null = null;
  private lastDelta: LayoutDelta | null = null;
  private isDestroyed = false;
  private isProcessingObservation = false;
  private animating = false;
  private currentProgress = 0;

  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private rafId: number | null = null;

  constructor(element: HTMLElement, options: LayoutControllerOptions = {}) {
    this.element = element;
    this.id = options.id ?? `layout-ctrl-${++nextControllerId}`;
    this.options = options;

    // Capture initial layout rect
    this.previousRect = measureLayout(this.element);

    if (this.options.autoObserve !== false) {
      this.setupObservers();
    }
  }

  public getState(): LayoutControllerState {
    return {
      id: this.id,
      isAnimating: this.isAnimating(),
      isObserved: this.resizeObserver !== null || this.mutationObserver !== null,
      bounds: this.previousRect,
      lastDelta: this.lastDelta,
      currentProgress: this.currentProgress,
    };
  }

  public getBounds(): LayoutRect | null {
    return this.previousRect;
  }

  public isAnimating(): boolean {
    return this.animating;
  }

  /**
   * Reads and updates the current layout measurement.
   */
  public measure(): LayoutRect {
    const rect = measureLayout(this.element);
    this.previousRect = rect;
    return rect;
  }

  /**
   * Records the "First" layout rectangle before a DOM or state change.
   */
  public record(): LayoutRect {
    const rect = measureLayout(this.element);
    this.previousRect = rect;
    return rect;
  }

  /**
   * Retargets an active animation to a new destination rectangle smoothly.
   */
  public retarget(newTargetRect?: LayoutRect): void {
    if (this.isDestroyed) return;

    // Use previous destination/state as the starting point for retargeting
    const fromRect = this.previousRect ?? measureLayout(this.element);

    // Cancel current animation
    if (this.currentControls) {
      this.currentControls.cancel();
      this.currentControls = null;
    }

    // Run FLIP from fromRect to current/new layout
    this.previousRect = fromRect;
    this.animate();
  }

  /**
   * Executes FLIP layout animation from recorded previousRect to current DOM layout.
   */
  public animate(overrideOptions?: Partial<LayoutTransitionOptions>): AnimationControls | null {
    if (this.isDestroyed || !this.element) return null;

    const first = this.previousRect;
    const current = measureLayout(this.element);
    this.previousRect = current;

    if (!first) return null;

    const mergedOptions: LayoutTransitionOptions = {
      ...this.options,
      ...overrideOptions,
    };

    const delta = computeFLIPDelta(first, current, mergedOptions);
    this.lastDelta = delta;

    if (!delta.hasMoved && !delta.hasResized) {
      return null;
    }

    // Fire onLayoutChange event
    const changeEvent: LayoutChangeEvent = {
      element: this.element,
      previousRect: first,
      currentRect: current,
      deltaX: delta.deltaX,
      deltaY: delta.deltaY,
      scaleX: delta.scaleX,
      scaleY: delta.scaleY,
      hasMoved: delta.hasMoved,
      hasResized: delta.hasResized,
    };
    this.options.onLayoutChange?.(changeEvent);

    // Handle in-flight animation cancellation/continuation
    if (this.currentControls) {
      this.currentControls.cancel();
      this.currentControls = null;
    }

    this.isProcessingObservation = true;
    this.currentProgress = 0;

    const controls = animateLayoutChange(this.element, first, {
      ...mergedOptions,
      onStart: (el) => {
        this.animating = true;
        mergedOptions.onStart?.(el);
      },
      onUpdate: (prog) => {
        this.currentProgress = prog;
        mergedOptions.onUpdate?.(prog);
      },
      onComplete: (el) => {
        this.animating = false;
        this.currentControls = null;
        this.isProcessingObservation = false;
        this.currentProgress = 1;
        // Capture final resting bounds
        this.previousRect = measureLayout(this.element);
        mergedOptions.onComplete?.(el);
      },
      onCancel: (el) => {
        this.animating = false;
        this.currentControls = null;
        this.isProcessingObservation = false;
        mergedOptions.onCancel?.(el);
      },
    });

    if (!controls) return null;

    const wrappedControls: AnimationControls = {
      ...controls,
      cancel: () => {
        this.animating = false;
        this.currentControls = null;
        this.isProcessingObservation = false;
        controls.cancel();
      },
    };

    this.currentControls = wrappedControls;
    return wrappedControls;
  }

  public updateOptions(options: Partial<LayoutControllerOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.autoObserve === false) {
      this.teardownObservers();
    } else if (options.autoObserve === true && !this.resizeObserver) {
      this.setupObservers();
    }
  }

  public play(): void {
    this.currentControls?.resume();
  }

  public pause(): void {
    this.currentControls?.pause();
  }

  public cancel(): void {
    if (this.currentControls) {
      this.currentControls.cancel();
      this.currentControls = null;
      this.animating = false;
      this.isProcessingObservation = false;
    }
  }

  public finish(): void {
    if (this.currentControls) {
      this.currentControls.seek(1);
      this.currentControls = null;
      this.animating = false;
      this.isProcessingObservation = false;
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.cancel();
    this.teardownObservers();
    if (this.rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.previousRect = null;
    this.lastDelta = null;
  }

  private setupObservers(): void {
    if (typeof window === "undefined") return;

    // Setup ResizeObserver on target element
    if (typeof ResizeObserver !== "undefined") {
      try {
        this.resizeObserver = new ResizeObserver(() => {
          this.scheduleLayoutCheck();
        });
        this.resizeObserver.observe(this.element);
      } catch {
        // Silently ignore if unsupported
      }
    }

    // Setup MutationObserver on parent container
    if (
      this.options.observeParent !== false &&
      typeof MutationObserver !== "undefined" &&
      this.element.parentElement
    ) {
      try {
        this.mutationObserver = new MutationObserver(() => {
          this.scheduleLayoutCheck();
        });
        this.mutationObserver.observe(this.element.parentElement, {
          childList: true,
          subtree: false,
          attributes: false,
        });
      } catch {
        // Silently ignore if unsupported
      }
    }
  }

  private teardownObservers(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  private scheduleLayoutCheck(): void {
    if (this.isDestroyed || this.isProcessingObservation) return;

    if (this.rafId !== null) return;

    const runner = () => {
      this.rafId = null;
      if (this.isDestroyed || this.isProcessingObservation) return;

      const current = measureLayout(this.element);
      if (!areRectsEqual(this.previousRect, current)) {
        this.animate();
      }
    };

    if (typeof requestAnimationFrame !== "undefined") {
      this.rafId = requestAnimationFrame(runner);
    } else {
      runner();
    }
  }
}

/**
 * Creates and returns a production-grade layout controller for an element.
 */
export function createLayoutController(
  element: HTMLElement,
  options?: LayoutControllerOptions
): LayoutController {
  return new LayoutControllerImpl(element, options);
}
