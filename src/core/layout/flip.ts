/**
 * AF Motion FLIP (First, Last, Invert, Play) Engine
 *
 * Mathematically sound delta calculations, inverse transform generation,
 * and seamless layout transition execution.
 */

import { animate, type AnimatableProperties } from "../animate.js";
import type { AnimationControls } from "../animation.js";
import { prefersReducedMotion } from "../motion.js";
import { resolveLayoutConfig } from "./presets.js";
import { measureLayout } from "./measure.js";
import type { LayoutDelta, LayoutRect, LayoutTransitionOptions } from "./types.js";

/**
 * Computes the FLIP delta between First and Last layout geometries.
 */
export function computeFLIPDelta(
  first: LayoutRect,
  last: LayoutRect,
  options: LayoutTransitionOptions = {}
): LayoutDelta {
  const mode = options.mode ?? "both";

  let deltaX = Math.round((first.left - last.left) * 100) / 100;
  let deltaY = Math.round((first.top - last.top) * 100) / 100;

  // If cross-axis motion is disabled, lock to dominant axis
  if (options.crossAxis === false) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaY = 0;
    } else {
      deltaX = 0;
    }
  }

  // Calculate scaling ratios
  const targetWidth = Math.max(1, last.width);
  const targetHeight = Math.max(1, last.height);
  let scaleX = Number((first.width / targetWidth).toFixed(4));
  let scaleY = Number((first.height / targetHeight).toFixed(4));

  // In mode "position", no scaling is performed
  if (mode === "position") {
    scaleX = 1;
    scaleY = 1;
  }

  // In mode "size", no translation is performed
  if (mode === "size") {
    deltaX = 0;
    deltaY = 0;
  }

  const hasMoved = Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5;
  const hasResized = Math.abs(scaleX - 1) >= 0.005 || Math.abs(scaleY - 1) >= 0.005;

  return {
    deltaX,
    deltaY,
    scaleX,
    scaleY,
    hasMoved,
    hasResized,
    first,
    last,
  };
}

/**
 * Builds animatable CSS keyframes for the inverse FLIP transform.
 */
export function createFLIPKeyframes(
  delta: LayoutDelta,
  options: LayoutTransitionOptions = {}
): AnimatableProperties {
  const mode = options.mode ?? "both";
  const origin = options.transformOrigin ?? "top left";

  let startTransform = "";
  let endTransform = "translate3d(0px, 0px, 0px) scale(1, 1)";

  if (mode === "position") {
    startTransform = `translate3d(${delta.deltaX}px, ${delta.deltaY}px, 0px)`;
    endTransform = "translate3d(0px, 0px, 0px)";
  } else if (mode === "size") {
    startTransform = `scale(${delta.scaleX}, ${delta.scaleY})`;
    endTransform = "scale(1, 1)";
  } else {
    // "both", "scale", "fade-through"
    startTransform = `translate3d(${delta.deltaX}px, ${delta.deltaY}px, 0px) scale(${delta.scaleX}, ${delta.scaleY})`;
    endTransform = "translate3d(0px, 0px, 0px) scale(1, 1)";
  }

  const keyframes: Record<string, [any, any, ...any[]]> = {
    transform: [startTransform, endTransform],
    transformOrigin: [origin, origin],
  };

  if (mode === "fade-through") {
    keyframes.opacity = ["0.5", "1"];
  }

  return keyframes;
}

/**
 * Creates dummy controls for skipped or zero-duration transitions.
 */
function createCompletedControls(): AnimationControls {
  return {
    seek: () => {},
    pause: () => {},
    resume: () => {},
    reverse: () => {},
    setPlaybackRate: () => {},
    getPlaybackRate: () => 1,
    cancel: () => {},
  };
}

/**
 * Animates a layout change from a previously captured bounding rectangle to its current layout.
 */
export function animateLayoutChange(
  element: HTMLElement,
  fromRect: LayoutRect,
  options: LayoutTransitionOptions = {}
): AnimationControls | null {
  if (!element) return null;

  const currentRect = measureLayout(element);
  const delta = computeFLIPDelta(fromRect, currentRect, options);

  // If no perceptible movement or size change, return null
  if (!delta.hasMoved && !delta.hasResized) {
    return null;
  }

  const resolved = resolveLayoutConfig(options);

  // Check reduced motion
  if (resolved.respectReducedMotion && prefersReducedMotion()) {
    options.onStart?.(element);
    options.onComplete?.(element);
    return createCompletedControls();
  }

  const keyframes = createFLIPKeyframes(delta, {
    ...options,
    transformOrigin: resolved.transformOrigin,
  });

  options.onStart?.(element);

  const controls = animate(element, keyframes, {
    duration: resolved.duration,
    easing: resolved.easing,
    delay: options.delay,
    respectReducedMotion: resolved.respectReducedMotion,
    onUpdate: (prog) => {
      options.onUpdate?.(prog);
    },
    onComplete: () => {
      options.onComplete?.(element);
    },
    onCancel: () => {
      options.onCancel?.(element);
    },
  });

  return controls;
}
