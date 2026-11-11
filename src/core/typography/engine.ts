/**
 * AF Motion Kinetic Typography Engine
 *
 * Core engine providing text animation orchestrators, presets resolution,
 * multi-unit staggering, motion path synchronization, and choreography timelines.
 */

import { animateProgress } from "../animation.js";
import { prefersReducedMotion } from "../motion.js";
import { resolveEasing } from "../../easing/easings.js";
import { segmentText } from "./segmenter.js";
import { applyTypographyStyle, clearTypographyStyle, interpolateTypographyState } from "./properties.js";
import { getTypographyPreset } from "./presets.js";
import { computeUnitDelays } from "./stagger.js";
import { applyTextToMotionPath } from "./path-motion.js";
import type {
  SegmentationResult,
  TypographyAnimationControls,
  TypographyAnimationOptions,
  TypographyStyleState,
  TypographyTimeline,
} from "./types.js";

/**
 * Creates and runs a kinetic typography animation on a target element or selector.
 */
export function animateText(
  target: HTMLElement | string,
  options: TypographyAnimationOptions = {}
): TypographyAnimationControls {
  // 1. Resolve preset if specified
  let fromState: TypographyStyleState = options.from ?? {};
  let toState: TypographyStyleState = options.to ?? {};
  let duration = options.duration;
  let easingName = options.easing;
  let by = options.by;
  let stagger = options.stagger;

  if (options.preset) {
    const presetDef = getTypographyPreset(options.preset, options.presetOptions);
    fromState = { ...presetDef.from, ...options.from };
    toState = { ...presetDef.to, ...options.to };
    duration = duration ?? presetDef.defaultDuration;
    easingName = easingName ?? presetDef.defaultEasing;
    by = by ?? presetDef.defaultBy;
    stagger = stagger ?? presetDef.defaultStagger;
  } else {
    duration = duration ?? 700;
    easingName = easingName ?? "easeOutCubic";
    by = by ?? "words";
  }

  // 2. Segment text
  const segmentation: SegmentationResult = segmentText(target, { by, aria: true });
  const units = segmentation.units;
  const totalUnits = units.length;
  const owner = options.transformOwner ?? {};
  const easingFn = resolveEasing(easingName);

  // 3. Stagger calculations
  const unitDelays = computeUnitDelays(units, stagger);
  const baseUnitDuration = duration;
  const maxDelay = unitDelays.length > 0 ? Math.max(...unitDelays) : 0;
  const totalTimelineDuration = maxDelay + baseUnitDuration;

  let isCancelled = false;
  let isFinished = false;

  let resolveFinished!: () => void;
  let rejectFinished!: (reason?: unknown) => void;
  const finished = new Promise<void>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  // Check reduced motion
  const isReduced = options.respectReducedMotion !== false && prefersReducedMotion();

  function renderFrame(globalProgress: number): void {
    if (isCancelled) return;
    const currentElapsed = globalProgress * totalTimelineDuration;

    // Motion path integration if provided
    if (options.motionPath) {
      applyTextToMotionPath(units, options.motionPath, globalProgress, {
        pathOffset: options.pathOffset,
        autoRotate: options.autoRotate,
        transformOwner: owner,
      });
      options.onUpdate?.(globalProgress);
      return;
    }

    for (let i = 0; i < totalUnits; i++) {
      const unit = units[i]!;
      if (!unit.element) continue;

      if (isReduced) {
        applyTypographyStyle(unit.element, toState, owner);
        continue;
      }

      const delay = unitDelays[i] ?? 0;
      let unitProgress = 0;

      if (currentElapsed <= delay) {
        unitProgress = 0;
      } else if (currentElapsed >= delay + baseUnitDuration) {
        unitProgress = 1;
      } else {
        unitProgress = (currentElapsed - delay) / baseUnitDuration;
      }

      const easedProgress = easingFn(unitProgress);
      const state = interpolateTypographyState(fromState, toState, easedProgress);
      applyTypographyStyle(unit.element, state, owner);
      options.onProgress?.(easedProgress, i);
    }

    options.onUpdate?.(globalProgress);
  }

  // Initial render at progress 0
  renderFrame(0);

  const controls = animateProgress({
    duration: isReduced ? 0 : totalTimelineDuration,
    delay: options.delay ?? 0,
    easing: "linear", // Master timeline progresses linearly; easing applied per unit
    repeat: options.repeat ?? 0,
    yoyo: options.yoyo ?? false,
    respectReducedMotion: options.respectReducedMotion,
    onStart: () => {
      options.onStart?.();
    },
    onUpdate: (prog) => {
      if (isCancelled || isFinished) return;
      renderFrame(prog);
    },
    onComplete: () => {
      if (isCancelled || isFinished) return;
      isFinished = true;
      renderFrame(1);
      options.onComplete?.();
      resolveFinished();
    },
    onCancel: () => {
      if (isCancelled || isFinished) return;
      isCancelled = true;
      for (const unit of units) {
        if (unit.element) clearTypographyStyle(unit.element, owner);
      }
      options.onCancel?.();
      resolveFinished();
    },
  });

  return {
    seek: (progress: number) => {
      controls.seek(progress);
      renderFrame(progress);
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
        renderFrame(1);
        options.onComplete?.();
        resolveFinished();
      }
    },
    destroy: () => {
      controls.cancel();
      segmentation.destroy();
    },
    finished,
  };
}

/**
 * Alias for animateText.
 */
export function createTextAnimation(
  target: HTMLElement | string,
  options: TypographyAnimationOptions = {}
): TypographyAnimationControls {
  return animateText(target, options);
}

/**
 * Creates a kinetic typography timeline for choreographed multi-step text sequences.
 */
export function createTypographyTimeline(): TypographyTimeline {
  const steps: Array<{
    target: HTMLElement | string;
    options: TypographyAnimationOptions;
    offset: number;
    controls?: TypographyAnimationControls;
  }> = [];

  let accumulatedDuration = 0;
  let isCancelled = false;

  let resolveFinished!: () => void;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const timeline: TypographyTimeline = {
    add: (target, options, position) => {
      let offset = accumulatedDuration;
      if (typeof position === "number") {
        offset = position;
      } else if (typeof position === "string" && position.startsWith("+=")) {
        offset = accumulatedDuration + Number(position.slice(2));
      } else if (typeof position === "string" && position.startsWith("-=")) {
        offset = Math.max(0, accumulatedDuration - Number(position.slice(2)));
      }

      const stepDuration = options.duration ?? 700;
      accumulatedDuration = Math.max(accumulatedDuration, offset + stepDuration);
      steps.push({ target, options, offset });
      return timeline;
    },

    play: () => {
      if (steps.length === 0) {
        resolveFinished();
        return;
      }

      for (const step of steps) {
        step.controls = animateText(step.target, {
          ...step.options,
          delay: (step.options.delay ?? 0) + step.offset,
        });
      }

      // Track timeline completion
      Promise.all(steps.map((s) => s.controls?.finished)).then(() => {
        if (!isCancelled) resolveFinished();
      });
    },

    pause: () => {
      for (const step of steps) step.controls?.pause();
    },

    seek: (progress: number) => {
      for (const step of steps) step.controls?.seek(progress);
    },

    reverse: () => {
      for (const step of steps) step.controls?.reverse();
    },

    cancel: () => {
      isCancelled = true;
      for (const step of steps) step.controls?.cancel();
    },

    get duration() {
      return accumulatedDuration;
    },

    finished,
  };

  return timeline;
}
