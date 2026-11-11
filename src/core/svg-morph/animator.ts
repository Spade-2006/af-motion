/**
 * AF Motion SVG Morph Animation Orchestrator
 *
 * Drives SVG path morphing using the core animation engine and frame scheduler.
 */

import { animateProgress } from "../animation.js";
import { createMorph, interpolateMorph } from "./interpolate.js";
import { svgElementToPath } from "./shapes.js";
import type { MorphAnimationControls, MorphAnimationOptions } from "./types.js";

/**
 * Resolves a target SVG element from a selector or direct reference.
 */
function resolveSVGPathElement(target: SVGElement | string): SVGElement {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error(`Cannot resolve selector "${target}": document is not available`);
    }
    const element = document.querySelector(target);
    if (!element || !(element instanceof SVGElement)) {
      throw new Error(`Could not find SVG element matching selector "${target}"`);
    }
    return element;
  }
  return target;
}

/**
 * Morphs an SVG path element or shape to a new path geometry or SVG shape.
 */
export function morphPath(
  target: SVGElement | string,
  to: string | SVGElement,
  options: MorphAnimationOptions = {}
): MorphAnimationControls {
  const element = resolveSVGPathElement(target);
  const originalD = element.getAttribute("d") ?? svgElementToPath(element);

  const morph = createMorph(originalD, to, {
    precision: options.precision,
    alignStartPoints: options.alignStartPoints,
  });

  let isDestroyed = false;

  const controls = animateProgress({
    ...options,
    onStart: () => {
      options.onStart?.();
    },
    onUpdate: (progress) => {
      if (isDestroyed) return;
      const currentD = interpolateMorph(morph, progress);
      element.setAttribute("d", currentD);
      options.onProgress?.(currentD, progress);
      options.onUpdate?.(progress);
    },
    onComplete: () => {
      if (isDestroyed) return;
      // Set exact target path on complete
      const finalD = interpolateMorph(morph, 1);
      element.setAttribute("d", finalD);
      options.onComplete?.();
    },
    onCancel: () => {
      options.onCancel?.();
    },
  });

  return {
    seek: (progress: number) => {
      controls.seek(progress);
      const d = interpolateMorph(morph, progress);
      element.setAttribute("d", d);
      options.onProgress?.(d, progress);
    },
    pause: () => controls.pause(),
    resume: () => controls.resume(),
    reverse: () => controls.reverse(),
    setPlaybackRate: (rate: number) => controls.setPlaybackRate(rate),
    getPlaybackRate: () => controls.getPlaybackRate(),
    cancel: () => controls.cancel(),
    interpolate: (progress: number) => interpolateMorph(morph, progress),
    destroy: (restoreOriginal = true) => {
      if (isDestroyed) return;
      isDestroyed = true;
      controls.cancel();
      if (restoreOriginal) {
        element.setAttribute("d", originalD);
      }
    },
  };
}
