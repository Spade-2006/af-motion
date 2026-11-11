/**
 * AF Motion — React 3D Morph Hook
 *
 * Declarative React hook for driving 3D morph animations, managing RAF frame lifecycle,
 * and binding dynamic morph states to React Three Fiber or custom 3D canvases.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";
import type {
  Morph3DAnimationOptions,
  MorphController3D,
  MorphGeometry3D,
  MorphTarget3D,
} from "./types.js";
import { morph3D } from "./animator.js";

type AnyMesh = Mesh3DData | GeometryBufferData;

export interface Use3DMorphResult {
  mesh: Mesh3DData | null;
  progress: number;
  isPlaying: boolean;
  isPaused: boolean;
  controller: MorphController3D | null;
  seek: (progress: number) => void;
  pause: () => void;
  resume: () => void;
  reverse: () => void;
  play: () => void;
  retarget: (newTarget: AnyMesh, transitionDuration?: number) => void;
  setTargetWeight: (targetId: string, weight: number) => void;
}

/**
 * React hook to animate a 3D geometry between morph targets with lifecycle management.
 */
export function use3DMorph(
  base: AnyMesh | MorphGeometry3D,
  targetOrTargets: AnyMesh | MorphTarget3D | Array<AnyMesh | MorphTarget3D>,
  options: Morph3DAnimationOptions = {}
): Use3DMorphResult {
  const [mesh, setMesh] = useState<Mesh3DData | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const controllerRef = useRef<MorphController3D | null>(null);

  useEffect(() => {
    const ctrl = morph3D(base, targetOrTargets, {
      ...options,
      onUpdate: (prog, state) => {
        setProgress(prog);
        setMesh({ ...state.mesh });
        options.onUpdate?.(prog, state);
      },
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
        options.onStart?.();
      },
      onComplete: () => {
        setIsPlaying(false);
        setIsPaused(false);
        options.onComplete?.();
      },
    });

    controllerRef.current = ctrl;
    setMesh({ ...ctrl.getState().mesh });

    return () => {
      ctrl.destroy();
      controllerRef.current = null;
    };
  }, [base, targetOrTargets]);

  const seek = useCallback((prog: number) => {
    controllerRef.current?.seek(prog);
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    controllerRef.current?.resume();
    setIsPaused(false);
    setIsPlaying(true);
  }, []);

  const reverse = useCallback(() => {
    controllerRef.current?.reverse();
  }, []);

  const play = useCallback(() => {
    controllerRef.current?.play();
  }, []);

  const retarget = useCallback((newTarget: AnyMesh, transitionDuration?: number) => {
    controllerRef.current?.retarget(newTarget, transitionDuration);
  }, []);

  const setTargetWeight = useCallback((targetId: string, weight: number) => {
    controllerRef.current?.setTargetWeight(targetId, weight);
  }, []);

  return {
    mesh,
    progress,
    isPlaying,
    isPaused,
    controller: controllerRef.current,
    seek,
    pause,
    resume,
    reverse,
    play,
    retarget,
    setTargetWeight,
  };
}
