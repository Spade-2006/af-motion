/**
 * AF Motion — Shared RAF Animated Inertia Integration
 *
 * Integrates Advanced Inertia, Momentum, Friction & Gravity Physics with the library's
 * shared animation frame scheduler (subscribeAnimationFrames), honoring reduced-motion accessibility.
 */

import { subscribeAnimationFrames } from "../animation.js";
import { onReducedMotionChange, prefersReducedMotion } from "../motion.js";
import type {
  AdvancedInertiaAnimationOptions,
  AdvancedInertiaAnimationControls,
} from "./inertia-types.js";
import { createInertiaSimulation } from "./inertia-simulation.js";
import { isPhysicsVector } from "./math.js";
import type { PhysicsVector, PhysicsValue } from "./types.js";

/**
 * Animates an advanced inertia / momentum physics simulation using the shared RAF frame scheduler.
 */
export function animateAdvancedInertia(
  options: AdvancedInertiaAnimationOptions
): AdvancedInertiaAnimationControls {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("animateAdvancedInertia() options must be an object");
  }
  if (typeof options.onUpdate !== "function") {
    throw new TypeError("onUpdate must be a function");
  }

  const simulation = createInertiaSimulation(options);
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
    // In reduced motion mode, movement stops immediately
    const state = simulation.getState();
    let zeroVel: PhysicsValue = 0;
    if (isPhysicsVector(state.velocity)) {
      const v: PhysicsVector = { x: 0 };
      if (state.velocity.y !== undefined) v.y = 0;
      if (state.velocity.z !== undefined) v.z = 0;
      zeroVel = v;
    }
    simulation.setVelocity(zeroVel);
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

  const controls: AdvancedInertiaAnimationControls = {
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
