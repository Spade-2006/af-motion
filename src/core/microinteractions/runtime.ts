/**
 * AF Motion Microinteraction Runtime Controller
 *
 * Framework-independent controller managing interaction states, DOM event listeners,
 * animation transitions, cancellation, and clean resource disposal.
 */

import { animate } from "../animate.js";
import type { AnimationControls } from "../animation.js";
import { generateMicrointeractionPlan } from "./generator.js";
import type {
  InteractionState,
  MicroComponentCategory,
  MicrointeractionContext,
  MicrointeractionPlan,
  MicrointeractionRuntimeControls,
} from "./types.js";

export interface MicrointeractionRuntimeOptions extends MicrointeractionContext {
  readonly onStateChange?: (state: InteractionState, plan: MicrointeractionPlan) => void;
}

export class MicrointeractionController implements MicrointeractionRuntimeControls {
  private element: HTMLElement | null = null;
  private currentState: InteractionState = "idle";
  private activeAnimation: AnimationControls | null = null;
  private options: MicrointeractionRuntimeOptions;
  private boundListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListener;
  }> = [];

  constructor(options: MicrointeractionRuntimeOptions = {}) {
    this.options = { ...options };
    this.currentState = options.fromState ?? "idle";
  }

  public getState(): InteractionState {
    return this.currentState;
  }

  public setState(nextState: InteractionState): void {
    if (this.currentState === nextState && nextState !== "press") return;

    const prevState = this.currentState;
    this.currentState = nextState;

    const result = generateMicrointeractionPlan({
      ...this.options,
      fromState: prevState,
      toState: nextState,
    });

    if (this.options.onStateChange) {
      this.options.onStateChange(nextState, result.plan);
    }

    this.runAnimation(result.plan);
  }

  public attach(element: HTMLElement): void {
    if (this.element === element) return;
    this.detach();

    this.element = element;
    if (typeof window === "undefined" || !element) return;

    const onPointerEnter = () => {
      if (this.currentState !== "disabled" && this.currentState !== "loading") {
        this.setState("hover");
      }
    };

    const onPointerLeave = () => {
      if (this.currentState !== "disabled" && this.currentState !== "loading") {
        this.setState("idle");
      }
    };

    const onPointerDown = () => {
      if (this.currentState !== "disabled" && this.currentState !== "loading") {
        this.setState("press");
      }
    };

    const onPointerUp = () => {
      if (this.currentState !== "disabled" && this.currentState !== "loading") {
        this.setState("hover");
      }
    };

    const onFocusIn = () => {
      if (this.currentState !== "disabled" && this.currentState !== "loading") {
        this.setState("focus-visible");
      }
    };

    const onFocusOut = () => {
      if (this.currentState !== "disabled" && this.currentState !== "loading") {
        this.setState("idle");
      }
    };

    const onKeyDown = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === "Enter" || ke.key === " ") {
        if (this.currentState !== "disabled" && this.currentState !== "loading") {
          this.setState("press");
        }
      }
    };

    const onKeyUp = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === "Enter" || ke.key === " ") {
        if (this.currentState !== "disabled" && this.currentState !== "loading") {
          this.setState("hover");
        }
      }
    };

    const add = (type: string, listener: EventListener) => {
      element.addEventListener(type, listener);
      this.boundListeners.push({ target: element, type, listener });
    };

    add("pointerenter", onPointerEnter);
    add("pointerleave", onPointerLeave);
    add("pointerdown", onPointerDown);
    add("pointerup", onPointerUp);
    add("focusin", onFocusIn);
    add("focusout", onFocusOut);
    add("keydown", onKeyDown);
    add("keyup", onKeyUp);
  }

  public detach(): void {
    for (const { target, type, listener } of this.boundListeners) {
      target.removeEventListener(type, listener);
    }
    this.boundListeners = [];
    if (this.activeAnimation) {
      try {
        this.activeAnimation.cancel();
      } catch {
        // no-op
      }
      this.activeAnimation = null;
    }
    this.element = null;
  }

  public destroy(): void {
    this.detach();
  }

  private runAnimation(plan: MicrointeractionPlan): void {
    if (!this.element) return;

    if (this.activeAnimation) {
      try {
        this.activeAnimation.cancel();
      } catch {
        // no-op
      }
      this.activeAnimation = null;
    }

    const { properties, duration, easing } = plan.config;
    try {
      this.activeAnimation = animate(this.element, properties, {
        duration,
        easing: easing as any,
      });
    } catch {
      // Fallback for simple style mutations if animate encounters non-interpolable properties
      if (this.element.style) {
        if (properties.opacity) {
          const ops = properties.opacity;
          const targetOp = Array.isArray(ops) ? ops[ops.length - 1] : ops;
          this.element.style.opacity = String(targetOp);
        }
        if (properties.transform) {
          const trs = properties.transform;
          const targetTr = Array.isArray(trs) ? trs[trs.length - 1] : trs;
          this.element.style.transform = String(targetTr);
        }
      }
    }
  }
}

export function createMicrointeractionController(
  options?: MicrointeractionRuntimeOptions
): MicrointeractionController {
  return new MicrointeractionController(options);
}
