/**
 * AF Motion Path Follower
 *
 * Stateful path follower providing position/orientation tracking, distance-based stepping,
 * CSS transform generation, orientation smoothing, and dynamic path retargeting.
 */

import { createMotionPath } from "./engine.js";
import { lerp } from "./vector3.js";
import type {
  MotionPath,
  MotionPathDefinition,
  PathFollower,
  PathFollowerOptions,
  PathPoint3D,
  PathSample,
  PathTangent,
  RetargetOptions,
} from "./types.js";

export function createPathFollower(
  initialPath: MotionPathDefinition,
  options: PathFollowerOptions = {}
): PathFollower {
  let currentPath: MotionPath = createMotionPath(initialPath);
  let currentProgress = 0;
  let currentDistance = 0;
  let smoothedAngle = 0;
  let hasSmoothedAngle = false;

  const autoRotate = options.autoRotate ?? true;
  const rotationOffset = options.rotationOffset ?? 0;
  const loop = options.loop ?? currentPath.isClosed;
  const constantSpeed = options.constantSpeed ?? true;
  const smoothing = Math.max(0, Math.min(0.99, options.smoothing ?? 0));

  let latestSample: PathSample = currentPath.sample(0, {
    constantSpeed,
    overflow: loop ? "loop" : "clamp",
  });
  smoothedAngle = latestSample.angle + rotationOffset;
  hasSmoothedAngle = true;

  function updateSample(progress: number): PathSample {
    currentProgress = progress;
    const sample = currentPath.sample(progress, {
      constantSpeed,
      overflow: loop ? "loop" : "clamp",
    });

    const targetAngle = sample.angle + rotationOffset;
    if (!hasSmoothedAngle || smoothing <= 0) {
      smoothedAngle = targetAngle;
      hasSmoothedAngle = true;
    } else {
      // Angular shortest-path lerp
      let diff = (targetAngle - smoothedAngle) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      smoothedAngle += diff * (1 - smoothing);
    }

    currentDistance = sample.distance;
    latestSample = sample;
    return sample;
  }

  const follower: PathFollower = {
    seek: (progress: number) => {
      return updateSample(progress);
    },

    step: (deltaDistance: number) => {
      const total = currentPath.totalLength;
      if (total <= 0) return latestSample;

      let nextDistance = currentDistance + deltaDistance;
      if (loop) {
        nextDistance = ((nextDistance % total) + total) % total;
      } else {
        nextDistance = Math.max(0, Math.min(total, nextDistance));
      }

      const nextProgress = nextDistance / total;
      return updateSample(nextProgress);
    },

    getPosition: () => latestSample.position,

    getTangent: () => latestSample.tangent,

    getSample: () => latestSample,

    getTransform: (fmtOptions = {}) => {
      const pos = latestSample.position;
      const precision = fmtOptions.precision ?? 3;
      const translateZ = fmtOptions.translateZ ?? currentPath.is3D;

      const x = pos.x.toFixed(precision);
      const y = pos.y.toFixed(precision);
      const z = pos.z.toFixed(precision);

      const translate = translateZ
        ? `translate3d(${x}px, ${y}px, ${z}px)`
        : `translate(${x}px, ${y}px)`;

      if (!autoRotate) {
        return translate;
      }

      const rot = smoothedAngle.toFixed(2);
      return `${translate} rotate(${rot}deg)`;
    },

    retarget: (newPath: MotionPathDefinition, retargetOpts: RetargetOptions = {}) => {
      const nextPath = createMotionPath(newPath);
      const targetProgress = retargetOpts.targetProgress ?? 0;

      currentPath = nextPath;
      currentProgress = targetProgress;
      currentDistance = targetProgress * nextPath.totalLength;

      updateSample(targetProgress);
    },
  };

  return follower;
}
