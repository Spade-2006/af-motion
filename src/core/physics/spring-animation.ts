/**
 * AF Motion — Shared RAF Animated Spring Integration
 *
 * Integrates Advanced Spring Physics with the library's shared animation frame
 * scheduler (subscribeAnimationFrames), honoring reduced-motion accessibility.
 */

import { subscribeAnimationFrames } from "../animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../motion.js";
import type {
  AdvancedSpringAnimationOptions,
  AdvancedSpringAnimationControls,
} from "./spring-types.js";
import { createSpringSimulation } from "./spring-simulation.js";
import { clonePhysicsValue } from "./math.js";

/**
 * Animates an advanced spring using the library's shared RAF frame scheduler.
 */
export function animateAdvancedSpring(
  options: AdvancedSpringAnimationOptions
): AdvancedSpringAnimationControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("animateAdvancedSpring() options must be an object");
  }
  if (typeof options.onUpdate !== "function") {
    throw new TypeError("onUpdate must be a function");
  }

  const simulation = createSpringSimulation(options);
  const respectReducedMotion = options.config && typeof options.config === "object"
    ? (options.config.respectReducedMotion !== false)
    : true;

  let active = true;
  let previousTime: number | null = null;
  let unsubscribeFrames: (() => void) | null = null;
  let unsubscribePreference = (): void => undefined;

  let reducedMotion = respectReducedMotion && prefersReducedMotion();

  const cleanup = (): void => {
    if (unsubscribeFrames) {
      unsubscribeFrames();
      unsubscribeFrames = null;
    }
    unsubscribePreference();
    unsubscribePreference = (): void => undefined;
  };

  const completeReducedMotion = (): void => {
    if (!active) return;
    active = false;
    cleanup();
    // Snap immediately to target
    const target = simulation.getState().target;
    simulation.setTarget(target, true);
    simulation.dispose();
  };

  const tick = (time: number): void => {
    if (!active) return;

    if (reducedMotion) {
      completeReducedMotion();
      return;
    }

    if (!Number.isFinite(time)) return;

    if (previousTime === null) {
      previousTime = time;
      simulation.step(0);
      if (simulation.isSettled()) {
        active = false;
        cleanup();
      }
      return;
    }

    const elapsedSeconds = Math.max(0, (time - previousTime) / 1000);
    previousTime = time;

    simulation.step(elapsedSeconds);

    if (simulation.isSettled() || simulation.isCompleted()) {
      active = false;
      cleanup();
    }
  };

  unsubscribePreference = respectReducedMotion
    ? onReducedMotionChange((reduced) => {
        if (!active) return;
        reducedMotion = reduced;
        if (reducedMotion) {
          completeReducedMotion();
        }
      })
    : (): void => undefined;

  if (reducedMotion) {
    completeReducedMotion();
  } else {
    simulation.start();
    unsubscribeFrames = subscribeAnimationFrames(tick);
  }

  const controls: AdvancedSpringAnimationControls = {
    ...simulation,
    cancel(): void {
      if (!active) return;
      active = false;
      cleanup();
      simulation.dispose();
    },
    dispose(): void {
      if (!active) return;
      active = false;
      cleanup();
      simulation.dispose();
    },
  };

  return controls;
}
