/**
 * AF Motion Path Animation Orchestrator
 *
 * Drives DOM elements or custom callbacks along 2D/3D motion paths using AF Motion's
 * shared RAF scheduler, transform layering, and animation controls.
 */

import { animateProgress } from "../animation.js";
import { setTransformLayer } from "../transform.js";
import { createMotionPath } from "./engine.js";
import { createPathFollower } from "./follower.js";
import type {
  MotionPath,
  MotionPathDefinition,
  PathAnimationControls,
  PathAnimationOptions,
  PathFollower,
  PathSample,
  RetargetOptions,
} from "./types.js";

type PathTarget = HTMLElement | string | ((sample: PathSample) => void);

function resolveElement(target: HTMLElement | string): HTMLElement {
  if (typeof target === "string") {
    if (typeof document === "undefined") {
      throw new Error(`Cannot resolve selector "${target}": document is not available`);
    }
    const el = document.querySelector(target);
    if (!el || !(el instanceof HTMLElement)) {
      throw new Error(`Could not find HTMLElement matching selector "${target}"`);
    }
    return el;
  }
  return target;
}

/**
 * Animates a target DOM element or callback along an arbitrary 2D/3D motion path.
 */
export function animateAlongPath(
  target: PathTarget,
  pathDefinition: MotionPathDefinition,
  options: PathAnimationOptions = {}
): PathAnimationControls {
  let path: MotionPath = createMotionPath(pathDefinition);
  const follower: PathFollower = createPathFollower(path, {
    autoRotate: options.autoRotate ?? true,
    rotationOffset: options.rotationOffset ?? 0,
    constantSpeed: options.constantSpeed ?? true,
  });

  const isCallback = typeof target === "function";
  const element: HTMLElement | null = isCallback ? null : resolveElement(target as HTMLElement | string);
  const owner = options.transformOwner ?? {};

  // Compute duration from speed if not explicitly set
  let duration = options.duration;
  if (duration === undefined) {
    if (options.speed && options.speed > 0) {
      duration = Math.max(16, (path.totalLength / options.speed) * 1000);
    } else {
      duration = 1000;
    }
  }

  const startOffset = Math.max(0, Math.min(1, options.startOffset ?? 0));
  const endOffset = Math.max(0, Math.min(1, options.endOffset ?? 1));
  const isReverse = options.direction === "reverse";

  const rangeStart = isReverse ? endOffset : startOffset;
  const rangeEnd = isReverse ? startOffset : endOffset;

  let isCancelled = false;
  let isFinished = false;

  let resolveFinished!: () => void;
  let rejectFinished!: (reason?: unknown) => void;
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  function applyProgress(animProgress: number): PathSample {
    const p = rangeStart + animProgress * (rangeEnd - rangeStart);
    const sample = follower.seek(p);

    if (element) {
      const transform = follower.getTransform({ translateZ: path.is3D });
      setTransformLayer(element, owner, transform);
    } else if (isCallback) {
      (target as (sample: PathSample) => void)(sample);
    }

    options.onUpdate?.(sample);
    options.onProgress?.(animProgress, sample);
    return sample;
  }

  // Initial position
  applyProgress(0);

  const controls = animateProgress({
    duration,
    delay: options.delay ?? 0,
    easing: options.easing ?? "linear",
    repeat: options.repeat ?? 0,
    yoyo: options.yoyo ?? false,
    onStart: () => {
      options.onStart?.();
    },
    onUpdate: (animProgress) => {
      if (isCancelled || isFinished) return;
      applyProgress(animProgress);
    },
    onComplete: () => {
      if (isCancelled || isFinished) return;
      isFinished = true;
      options.onComplete?.();
      resolveFinished();
    },
    onCancel: () => {
      if (isCancelled || isFinished) return;
      isCancelled = true;
      if (element) {
        setTransformLayer(element, owner, "");
      }
      options.onCancel?.();
      resolveFinished();
    },
  });

  return {
    seek: (progress: number) => {
      controls.seek(progress);
      applyProgress(progress);
    },
    pause: () => controls.pause(),
    resume: () => controls.resume(),
    reverse: () => controls.reverse(),
    setPlaybackRate: (rate: number) => controls.setPlaybackRate(rate),
    getPlaybackRate: () => controls.getPlaybackRate(),
    cancel: () => controls.cancel(),
    finish: () => {
      controls.cancel();
      if (!isFinished && !isCancelled) {
        isFinished = true;
        applyProgress(1);
        options.onComplete?.();
        resolveFinished();
      }
    },
    retarget: (newPathDef: MotionPathDefinition, retargetOpts: RetargetOptions = {}) => {
      path = createMotionPath(newPathDef);
      follower.retarget(path, retargetOpts);
      applyProgress(0);
    },
    getCurrentSample: () => follower.getSample(),
    finished,
  };
}
