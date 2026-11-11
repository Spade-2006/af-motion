/**
 * AF Motion Transition Controller
 *
 * Framework-independent transition orchestration: state tracking, enter/exit
 * sequencing, interruption resolution, cleanup, and reduced-motion handling.
 */

import { animate } from "../animate.js";
import type { AnimationControls } from "../animation.js";
import { prefersReducedMotion } from "../motion.js";
import type {
  TransitionConfig,
  TransitionDefinition,
  TransitionState,
} from "./types.js";
import { createEntranceTransition, createExitTransition } from "./engine.js";

export interface TransitionControllerOptions {
  readonly enterConfig?: TransitionConfig;
  readonly exitConfig?: TransitionConfig;
  readonly onStateChange?: (state: TransitionState) => void;
  readonly onEntered?: () => void;
  readonly onExited?: () => void;
}

export class TransitionController {
  private state: TransitionState = "unmounted";
  private currentControls: AnimationControls | null = null;
  private readonly enterDef: TransitionDefinition;
  private readonly exitDef: TransitionDefinition;
  private readonly options: TransitionControllerOptions;

  constructor(options: TransitionControllerOptions = {}) {
    this.options = options;
    this.enterDef = createEntranceTransition(options.enterConfig);
    this.exitDef = createExitTransition(options.exitConfig);
  }

  public getState(): TransitionState {
    return this.state;
  }

  private setState(next: TransitionState): void {
    if (this.state === next) return;
    this.state = next;
    this.options.onStateChange?.(next);
  }

  /**
   * Executes the entrance animation on a target element.
   */
  public enter(
    target: HTMLElement | SVGElement,
    callbacks?: { onComplete?: () => void }
  ): AnimationControls | null {
    // Cancel any active animation cleanly
    this.cancel();

    this.setState("entering");

    const isReduced =
      this.enterDef.respectReducedMotion && prefersReducedMotion();

    const properties =
      isReduced && this.enterDef.reducedMotionProperties
        ? this.enterDef.reducedMotionProperties
        : this.enterDef.properties;

    const duration = isReduced ? 0 : this.enterDef.duration;

    const controls = animate(target, properties, {
      duration,
      delay: isReduced ? 0 : this.enterDef.delay,
      easing: this.enterDef.easing as any,
      fill: "both",
      onComplete: () => {
        this.currentControls = null;
        this.setState("entered");
        this.options.onEntered?.();
        callbacks?.onComplete?.();
      },
      onCancel: () => {
        this.currentControls = null;
      },
    });

    this.currentControls = controls;
    return controls;
  }

  /**
   * Executes the exit animation on a target element.
   */
  public exit(
    target: HTMLElement | SVGElement,
    callbacks?: { onComplete?: () => void }
  ): AnimationControls | null {
    // Cancel any active enter animation
    this.cancel();

    this.setState("exiting");

    const isReduced =
      this.exitDef.respectReducedMotion && prefersReducedMotion();

    const properties =
      isReduced && this.exitDef.reducedMotionProperties
        ? this.exitDef.reducedMotionProperties
        : this.exitDef.properties;

    const duration = isReduced ? 0 : this.exitDef.duration;

    const controls = animate(target, properties, {
      duration,
      delay: isReduced ? 0 : this.exitDef.delay,
      easing: this.exitDef.easing as any,
      fill: "both",
      onComplete: () => {
        this.currentControls = null;
        this.setState("exited");
        this.options.onExited?.();
        callbacks?.onComplete?.();
      },
      onCancel: () => {
        this.currentControls = null;
      },
    });

    this.currentControls = controls;
    return controls;
  }

  /**
   * Cancels any currently executing transition.
   */
  public cancel(): void {
    if (this.currentControls) {
      this.currentControls.cancel();
      this.currentControls = null;
    }
  }

  /**
   * Cleans up all resources and active animations.
   */
  public destroy(): void {
    this.cancel();
    this.setState("unmounted");
  }
}
