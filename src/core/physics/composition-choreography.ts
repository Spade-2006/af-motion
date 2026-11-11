/**
 * AF Motion — Physics Composition Choreography Integration
 *
 * Adapts physics motion compositions into first-class participants in the
 * AF Motion choreography engine, supporting sequenced/parallel execution,
 * start offsets, cancellations, timeouts, and shared RAF integration.
 */

import type { MotionChoreographyControls } from "../motion-choreography.js";
import type {
  PhysicsCompositionControls,
  PhysicsChoreographyOptions,
} from "./composition-types.js";
import { animatePhysicsComposition } from "./composition-engine.js";

/**
 * Adapts a PhysicsCompositionControls instance into a choreography participant
 * complying with MotionChoreographyControls.
 */
export function asChoreographyParticipant(
  composition: PhysicsCompositionControls,
  options: PhysicsChoreographyOptions = {}
): MotionChoreographyControls {
  let animationHandle: { cancel(): void; dispose(): void } | null = null;
  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let settled = false;
  let canceled = false;

  let resolveFinished: () => void;
  let rejectFinished: (reason?: unknown) => void;

  const finishedPromise = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  const cleanup = (): void => {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (timeoutTimer !== null) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    if (animationHandle) {
      animationHandle.cancel();
      animationHandle = null;
    }
  };

  const startAnimation = (): void => {
    if (canceled || settled) return;

    animationHandle = animatePhysicsComposition({
      composition,
    });

    composition.onSettle(() => {
      if (!settled && !canceled) {
        settled = true;
        cleanup();
        resolveFinished();
      }
    });

    composition.onComplete(() => {
      if (!settled && !canceled) {
        settled = true;
        cleanup();
        resolveFinished();
      }
    });

    // Optional timeout protection
    if (options.timeout && options.timeout > 0) {
      timeoutTimer = setTimeout(() => {
        if (!settled && !canceled) {
          settled = true;
          cleanup();
          composition.stop();
          resolveFinished();
        }
      }, options.timeout);
    }
  };

  const delayMs = options.delay ?? 0;
  if (delayMs > 0) {
    delayTimer = setTimeout(() => {
      delayTimer = null;
      startAnimation();
    }, delayMs);
  } else {
    startAnimation();
  }

  const controls: MotionChoreographyControls = {
    finished: finishedPromise,

    pause(): void {
      composition.pause();
    },

    resume(): void {
      composition.resume();
    },

    cancel(): void {
      if (canceled || settled) return;
      canceled = true;
      cleanup();
      composition.stop();
      rejectFinished(new Error("Physics choreography canceled."));
    },

    destroy(): void {
      if (!canceled && !settled) {
        canceled = true;
        cleanup();
        rejectFinished(new Error("Physics choreography canceled."));
      }
      composition.dispose();
    },
  };

  return controls;
}
