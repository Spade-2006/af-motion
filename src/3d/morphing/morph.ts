/**
 * AF Motion — 3D Morph Evaluation Engine
 *
 * Deterministic computation and evaluation of blend shape weights,
 * generating in-place mutated or cloned 3D meshes with updated bounding boxes.
 */

import type { BoundingBox3D } from "../schemas/types.js";
import type { Mesh3DData } from "../optimization/types.js";
import type { MorphGeometry3D, MorphEvaluationOptions } from "./types.js";
import {
  interpolateBuffer,
  blendMultipleBuffers,
  resolveInterpolationFactor,
} from "./interpolation.js";

/**
 * Computes bounding box dimensions from a flat positions buffer.
 */
export function computeMorphBoundingBox(positions: Float32Array): BoundingBox3D {
  if (positions.length === 0) {
    return {
      min: [0, 0, 0],
      max: [0, 0, 0],
      size: [0, 0, 0],
      center: [0, 0, 0],
    };
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    size: [sizeX, sizeY, sizeZ],
    center: [minX + sizeX / 2, minY + sizeY / 2, minZ + sizeZ / 2],
  };
}

/**
 * Evaluates the morph state at a given progress [0..1] or arbitrary target weights record.
 * Mutates morphGeometry.currentMesh in-place with zero memory allocation.
 */
export function evaluateMorph(
  morphGeometry: MorphGeometry3D,
  progressOrWeights: number | Record<string, number>,
  options: MorphEvaluationOptions = {}
): Mesh3DData {
  const base = morphGeometry.base;
  const targets = morphGeometry.targets;
  const outMesh = morphGeometry.currentMesh;

  if (targets.length === 0) {
    // No targets: base mesh remains
    return outMesh;
  }

  const mode = options.interpolationMode ?? "linear";

  if (typeof progressOrWeights === "number") {
    const rawProgress = options.clampProgress !== false
      ? Math.max(0, Math.min(1, progressOrWeights))
      : progressOrWeights;

    const progress = resolveInterpolationFactor(rawProgress, mode);

    if (targets.length === 1) {
      const tgt = targets[0];
      // 1 target: interpolate directly between base and target
      interpolateBuffer(base.positions, tgt.positions, progress, morphGeometry.scratchPositions, {
        isNormal: false,
      });

      if (base.normals && tgt.normals && morphGeometry.scratchNormals) {
        interpolateBuffer(base.normals, tgt.normals, progress, morphGeometry.scratchNormals, {
          isNormal: options.normalizeNormals !== false,
        });
      }

      if (base.uvs && tgt.uvs && morphGeometry.scratchUvs) {
        interpolateBuffer(base.uvs, tgt.uvs, progress, morphGeometry.scratchUvs, {
          isNormal: false,
        });
      }
    } else {
      // Multiple targets: distribute progress along targets sequence
      // e.g. 2 targets: [0..0.5] blends base -> target0, [0.5..1.0] blends target0 -> target1
      const numSegments = targets.length;
      const scaledProgress = progress * numSegments;
      const segmentIdx = Math.min(Math.floor(scaledProgress), numSegments - 1);
      const segmentT = scaledProgress - segmentIdx;

      const fromBuffer = segmentIdx === 0 ? base.positions : targets[segmentIdx - 1].positions;
      const toBuffer = targets[segmentIdx].positions;

      interpolateBuffer(fromBuffer, toBuffer, segmentT, morphGeometry.scratchPositions, {
        isNormal: false,
      });

      if (base.normals && morphGeometry.scratchNormals) {
        const fromNorm = segmentIdx === 0 ? base.normals : (targets[segmentIdx - 1].normals ?? base.normals);
        const toNorm = targets[segmentIdx].normals ?? base.normals;
        interpolateBuffer(fromNorm, toNorm, segmentT, morphGeometry.scratchNormals, {
          isNormal: options.normalizeNormals !== false,
        });
      }

      if (base.uvs && morphGeometry.scratchUvs) {
        const fromUv = segmentIdx === 0 ? base.uvs : (targets[segmentIdx - 1].uvs ?? base.uvs);
        const toUv = targets[segmentIdx].uvs ?? base.uvs;
        interpolateBuffer(fromUv, toUv, segmentT, morphGeometry.scratchUvs, {
          isNormal: false,
        });
      }
    }
  } else {
    // Record of target weights: weighted multi-target blend shapes
    const weightItems: Array<{ buffer: Float32Array; weight: number; relative?: boolean }> = [];
    const normalItems: Array<{ buffer: Float32Array; weight: number; relative?: boolean }> = [];
    const uvItems: Array<{ buffer: Float32Array; weight: number; relative?: boolean }> = [];

    for (const tgt of targets) {
      const w = progressOrWeights[tgt.id] ?? tgt.weight ?? 0;
      if (Math.abs(w) > 1e-6) {
        weightItems.push({ buffer: tgt.positions, weight: w, relative: tgt.relative });
        if (tgt.normals) {
          normalItems.push({ buffer: tgt.normals, weight: w, relative: tgt.relative });
        }
        if (tgt.uvs) {
          uvItems.push({ buffer: tgt.uvs, weight: w, relative: tgt.relative });
        }
      }
    }

    blendMultipleBuffers(base.positions, weightItems, morphGeometry.scratchPositions, {
      isNormal: false,
    });

    if (base.normals && morphGeometry.scratchNormals) {
      blendMultipleBuffers(base.normals, normalItems, morphGeometry.scratchNormals, {
        isNormal: options.normalizeNormals !== false,
      });
    }

    if (base.uvs && morphGeometry.scratchUvs) {
      blendMultipleBuffers(base.uvs, uvItems, morphGeometry.scratchUvs, {
        isNormal: false,
      });
    }
  }

  return outMesh;
}
