/**
 * AF Motion — 3D Morph Animation Orchestrator
 *
 * Drives frame-scheduled 3D geometry transformations with RAF integration,
 * dynamic retargeting, reversible playback, and physics bounds synchronization.
 */

import { animateProgress } from "../../core/animation.js";
import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";
import type {
  Morph3DAnimationOptions,
  MorphController3D,
  MorphGeometry3D,
  MorphState3D,
  MorphTarget3D,
  MorphSequenceItem,
  MorphSequenceOptions,
} from "./types.js";
import { createMorphGeometry, addMorphTarget } from "./geometry.js";
import { evaluateMorph, computeMorphBoundingBox } from "./morph.js";

type AnyMesh = Mesh3DData | GeometryBufferData;

/**
 * Animates a 3D geometry from base shape to destination target(s).
 */
export function morph3D(
  base: AnyMesh | MorphGeometry3D,
  targetOrTargets: AnyMesh | MorphTarget3D | Array<AnyMesh | MorphTarget3D>,
  options: Morph3DAnimationOptions = {}
): MorphController3D {
  let morphGeo: MorphGeometry3D;

  if ("scratchPositions" in base && "targets" in base) {
    morphGeo = base as MorphGeometry3D;
    const targetList = Array.isArray(targetOrTargets) ? targetOrTargets : [targetOrTargets];
    for (const t of targetList) {
      addMorphTarget(morphGeo, t);
    }
  } else {
    const targetList = Array.isArray(targetOrTargets) ? targetOrTargets : [targetOrTargets];
    morphGeo = createMorphGeometry(base, targetList);
  }

  let isDestroyed = false;
  let isPlaying = false;
  let isPaused = false;
  let currentProgress = 0;
  const activeWeights: Record<string, number> = {};

  const buildState = (progress: number): MorphState3D => {
    const mesh = morphGeo.currentMesh;
    const boundingBox = computeMorphBoundingBox(mesh.positions);
    return {
      progress,
      mesh,
      targetWeights: { ...activeWeights },
      isPlaying,
      isPaused,
      boundingBox,
      timestamp: Date.now(),
    };
  };

  const updateFrame = (progress: number): void => {
    if (isDestroyed) return;
    currentProgress = progress;
    evaluateMorph(morphGeo, progress, {
      interpolationMode: options.interpolationMode,
    });

    const state = buildState(progress);
    options.onUpdate?.(progress, state);
    options.onGeometryChanged?.(state.mesh, state.boundingBox);
  };

  const controls = animateProgress({
    duration: options.duration ?? 1000,
    delay: options.delay ?? 0,
    easing: options.easing ?? "easeInOutCubic",
    repeat: options.repeat ?? 0,
    yoyo: options.yoyo ?? false,
    playbackRate: options.playbackRate ?? 1,
    respectReducedMotion: options.respectReducedMotion ?? true,
    onStart: () => {
      isPlaying = true;
      isPaused = false;
      options.onStart?.();
    },
    onUpdate: (progress) => {
      updateFrame(progress);
    },
    onComplete: () => {
      if (isDestroyed) return;
      isPlaying = false;
      isPaused = false;
      updateFrame(1.0);
      options.onComplete?.();
    },
    onCancel: () => {
      isPlaying = false;
      isPaused = false;
      options.onCancel?.();
    },
  });

  isPlaying = true;

  return {
    seek: (progress: number) => {
      controls.seek(progress);
      updateFrame(progress);
    },
    pause: () => {
      controls.pause();
      isPaused = true;
      isPlaying = false;
    },
    resume: () => {
      controls.resume();
      isPaused = false;
      isPlaying = true;
    },
    reverse: () => {
      controls.reverse();
    },
    play: () => {
      controls.seek(0);
      controls.resume();
      isPlaying = true;
      isPaused = false;
    },
    setPlaybackRate: (rate: number) => {
      controls.setPlaybackRate(rate);
    },
    getPlaybackRate: () => controls.getPlaybackRate(),
    setTargetWeight: (targetId: string, weight: number) => {
      activeWeights[targetId] = weight;
      evaluateMorph(morphGeo, activeWeights);
      const state = buildState(currentProgress);
      options.onUpdate?.(currentProgress, state);
      options.onGeometryChanged?.(state.mesh, state.boundingBox);
    },
    setTargetWeights: (weights: Record<string, number>) => {
      Object.assign(activeWeights, weights);
      evaluateMorph(morphGeo, activeWeights);
      const state = buildState(currentProgress);
      options.onUpdate?.(currentProgress, state);
      options.onGeometryChanged?.(state.mesh, state.boundingBox);
    },
    retarget: (newTarget: AnyMesh, transitionDuration: number = 300) => {
      // Dynamic retargeting: freeze current mesh as temporary base and animate to new target
      const currentMeshSnapshot: Mesh3DData = {
        positions: new Float32Array(morphGeo.currentMesh.positions),
        normals: morphGeo.currentMesh.normals ? new Float32Array(morphGeo.currentMesh.normals) : undefined,
        uvs: morphGeo.currentMesh.uvs ? new Float32Array(morphGeo.currentMesh.uvs) : undefined,
        indices: morphGeo.indices,
      };

      morphGeo.base = currentMeshSnapshot;
      morphGeo.targets = [];
      addMorphTarget(morphGeo, newTarget, "dynamic-target");

      controls.cancel();
      controls.setPlaybackRate(1.0);
      controls.seek(0);
      controls.resume();
    },
    cancel: () => {
      controls.cancel();
      isPlaying = false;
      isPaused = false;
    },
    destroy: () => {
      if (isDestroyed) return;
      isDestroyed = true;
      controls.cancel();
      isPlaying = false;
      isPaused = false;
    },
    getState: () => buildState(currentProgress),
    interpolate: (progress: number) => {
      return evaluateMorph(morphGeo, progress);
    },
  };
}

/**
 * Creates and executes a multi-step sequential morph animation across multiple targets.
 */
export function createMorphSequence(
  base: AnyMesh,
  sequence: MorphSequenceItem[],
  options: MorphSequenceOptions = {}
): MorphController3D {
  if (sequence.length === 0) {
    throw new Error("createMorphSequence requires at least one target in sequence.");
  }

  let currentStepIdx = 0;
  let activeController: MorphController3D | null = null;
  let isCancelled = false;

  const runStep = (stepIdx: number): void => {
    if (isCancelled || stepIdx >= sequence.length) {
      if (options.loop && !isCancelled) {
        currentStepIdx = 0;
        runStep(0);
      } else {
        options.onSequenceComplete?.();
      }
      return;
    }

    currentStepIdx = stepIdx;
    const step = sequence[stepIdx];
    const currentBase = activeController ? activeController.getState().mesh : base;

    activeController = morph3D(currentBase, step.target as AnyMesh, {
      duration: step.duration ?? 800,
      delay: step.delay ?? 0,
      easing: step.easing ?? "easeInOutCubic",
      playbackRate: options.playbackRate ?? 1,
      onComplete: () => {
        options.onStepComplete?.(stepIdx);
        runStep(stepIdx + 1);
      },
    });
  };

  runStep(0);

  return {
    seek: (progress: number) => activeController?.seek(progress),
    pause: () => activeController?.pause(),
    resume: () => activeController?.resume(),
    reverse: () => activeController?.reverse(),
    play: () => {
      isCancelled = false;
      runStep(0);
    },
    setPlaybackRate: (rate: number) => activeController?.setPlaybackRate(rate),
    getPlaybackRate: () => activeController?.getPlaybackRate() ?? 1,
    setTargetWeight: (id: string, w: number) => activeController?.setTargetWeight(id, w),
    setTargetWeights: (weights: Record<string, number>) => activeController?.setTargetWeights(weights),
    retarget: (newTarget: AnyMesh) => activeController?.retarget(newTarget),
    cancel: () => {
      isCancelled = true;
      activeController?.cancel();
    },
    destroy: () => {
      isCancelled = true;
      activeController?.destroy();
    },
    getState: () => activeController!.getState(),
    interpolate: (progress: number) => activeController!.interpolate(progress),
  };
}
