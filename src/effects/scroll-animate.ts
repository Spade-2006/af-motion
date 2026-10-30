import { animate } from "../core/animate.js";
import type { AnimatableProperties, AnimateTarget } from "../core/animate.js";
import type { EasingOption } from "../easing/easings.js";
import { scrollVelocity } from "./scroll-velocity.js";

export interface ScrollAnimateOptions {
  /** Window or scrollable element to track. Defaults to window. */
  scrollTarget?: Window | AnimateTarget;
  /** Maps scroll progress through the same easing registry used by `animate()`. */
  easing?: EasingOption;
  /** Reverses the mapping so scroll start applies the `to` values. Defaults to false. */
  reverse?: boolean;
  /** Called after the animated values are updated for a new scroll progress. */
  onUpdate?: (progress: number) => void;
}

export interface ScrollAnimateControls {
  /** Pauses scroll-driven writes while retaining the latest progress. */
  pause(): void;
  /** Resumes scroll-driven writes at the latest measured progress. */
  resume(): void;
  /** Returns the latest normalized scroll progress. */
  getProgress(): number;
  /** Removes scroll listeners and cancels pending work. Safe to repeat. */
  destroy(): void;
}

/**
 * Binds an animation's normalized progress to page or element scroll progress.
 * The existing animation interpolation and easing engine performs every property write.
 */
const MAX_SCRUB_PROGRESS = 1 - 1e-9;

export function scrollAnimate(
  target: AnimateTarget,
  properties: AnimatableProperties,
  options: ScrollAnimateOptions = {},
): ScrollAnimateControls {
  const {
    scrollTarget,
    easing,
    reverse = false,
    onUpdate,
  } = options;

  if (typeof reverse !== "boolean") {
    throw new TypeError(`reverse must be a boolean, received ${String(reverse)}`);
  }
  if (onUpdate !== undefined && typeof onUpdate !== "function") {
    throw new TypeError("onUpdate must be a function");
  }

  const animation = animate(target, properties, {
    duration: 0,
    respectReducedMotion: false,
    ...(easing === undefined ? {} : { easing }),
  });
  animation.pause();

  let latestProgress = 0;
  let paused = false;
  let destroyed = false;

  const apply = (progress: number): void => {
    latestProgress = progress;
    if (destroyed || paused) return;
    const mapped = reverse ? 1 - progress : progress;
    // seek(1) is terminal for the engine; stay just below it so scrubbing remains possible.
    animation.seek(Math.min(mapped, MAX_SCRUB_PROGRESS));
    animation.pause();
    onUpdate?.(progress);
  };

  let source: ReturnType<typeof scrollVelocity>;
  try {
    source = scrollVelocity({
      target: scrollTarget,
      onUpdate: ({ progress }) => apply(progress),
    });
  } catch (error) {
    animation.cancel();
    throw error;
  }

  return {
    pause: () => {
      paused = true;
    },
    resume: () => {
      if (destroyed || !paused) return;
      paused = false;
      apply(latestProgress);
    },
    getProgress: () => latestProgress,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      source.destroy();
      animation.cancel();
    },
  };
}
