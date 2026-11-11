/**
 * AF Motion — 3D Skeletal & Animation Intelligence
 *
 * Inspects bone hierarchies, checks acyclic graph validity, validates skin weight
 * normalization, prunes low-magnitude influences, and extracts animation metadata.
 */

import type {
  SkeletonData3D,
  SkeletonOptimizationConfig,
  SkeletonAnalysisReport,
} from "./types.js";

export interface PrunedSkinResult {
  prunedWeights: Float32Array;
  prunedIndices: Uint16Array | Uint32Array;
  maxInfluencesFound: number;
}

/**
 * Inspects, validates, and reports on a 3D skeletal hierarchy and vertex skinning weights.
 */
export function analyzeSkeleton3D(
  skeleton: SkeletonData3D,
  config: SkeletonOptimizationConfig = {}
): SkeletonAnalysisReport {
  const bones = skeleton.bones || [];
  const boneCount = bones.length;
  const minWeightTol = config.minWeightThreshold ?? 0.01;

  // Map bone ids to index for parent lookup if parentId is used
  const boneIdToIndex = new Map<string, number>();
  for (let i = 0; i < boneCount; i++) {
    const b = bones[i] as any;
    if (b.id) {
      boneIdToIndex.set(b.id, i);
    }
  }

  // 1. Hierarchy depth and cycle detection
  let maxDepth = 0;
  let hasCycles = false;

  for (let i = 0; i < boneCount; i++) {
    const visited = new Set<number>();
    let cur = i;
    let depth = 1;

    while (cur >= 0 && cur < boneCount) {
      if (visited.has(cur)) {
        hasCycles = true;
        break;
      }
      visited.add(cur);

      const b = bones[cur] as any;
      let pIdx = b.parentIndex;
      if (pIdx === undefined && b.parentId !== undefined) {
        if (b.parentId === null || b.parentId === "") {
          pIdx = -1;
        } else {
          pIdx = boneIdToIndex.get(b.parentId) ?? -1;
        }
      }

      cur = pIdx !== undefined ? pIdx : -1;
      if (cur >= 0) {
        depth++;
      }
      if (depth > 256) {
        hasCycles = true;
        break;
      }
    }

    maxDepth = Math.max(maxDepth, depth);
  }

  // 2. Skin Weights Validation & Pruning
  let unnormalizedWeightsCount = 0;
  let prunedInfluencesCount = 0;
  let maxInfluencesFound = 0;

  const weights = skeleton.skinWeights;
  const stride = skeleton.maxInfluencesPerVertex ?? 4;

  if (weights && weights.length > 0) {
    const vertexCount = Math.floor(weights.length / stride);

    for (let v = 0; v < vertexCount; v++) {
      let weightSum = 0;
      let activeCount = 0;

      for (let j = 0; j < stride; j++) {
        const w = weights[v * stride + j];
        if (w > 1e-4) {
          activeCount++;
          weightSum += w;
          if (w < minWeightTol) {
            prunedInfluencesCount++;
          }
        }
      }

      maxInfluencesFound = Math.max(maxInfluencesFound, activeCount);

      if (activeCount > 0 && Math.abs(weightSum - 1.0) > 0.02) {
        unnormalizedWeightsCount++;
      }
    }
  }

  return {
    boneCount,
    hierarchyDepth: maxDepth,
    hasCycles,
    maxInfluencesPerVertex: maxInfluencesFound,
    unnormalizedWeightsCount,
    prunedInfluencesCount,
    animationClips: skeleton.animationClips ? [...skeleton.animationClips] : [],
  };
}

/**
 * Prunes vertex bone skinning influences exceeding a target limit and renormalizes remaining weights to 1.0.
 */
export function pruneSkinInfluences(
  weights: Float32Array,
  indices: Uint16Array | Uint32Array,
  maxInfluences: number = 4,
  inputStride?: number
): PrunedSkinResult {
  const totalEntries = weights.length;
  if (totalEntries === 0) {
    return {
      prunedWeights: new Float32Array(0),
      prunedIndices: new Uint16Array(0),
      maxInfluencesFound: 0,
    };
  }

  const stride = inputStride ?? (totalEntries <= 16 ? totalEntries : 4);
  const vertexCount = Math.floor(totalEntries / stride);
  const outStride = maxInfluences;
  const outWeights = new Float32Array(vertexCount * outStride);
  const outIndices =
    indices instanceof Uint32Array
      ? new Uint32Array(vertexCount * outStride)
      : new Uint16Array(vertexCount * outStride);

  let maxFound = 0;

  for (let v = 0; v < vertexCount; v++) {
    const pairs: Array<{ w: number; idx: number }> = [];
    for (let j = 0; j < stride; j++) {
      const w = weights[v * stride + j];
      const idx = indices[v * stride + j];
      if (w > 0) {
        pairs.push({ w, idx });
      }
    }

    maxFound = Math.max(maxFound, pairs.length);

    // Sort descending by weight
    pairs.sort((a, b) => b.w - a.w);

    // Keep top maxInfluences
    const kept = pairs.slice(0, maxInfluences);
    let sum = 0;
    for (const k of kept) sum += k.w;

    for (let j = 0; j < outStride; j++) {
      if (j < kept.length) {
        outWeights[v * outStride + j] = sum > 0 ? kept[j].w / sum : 0;
        outIndices[v * outStride + j] = kept[j].idx;
      } else {
        outWeights[v * outStride + j] = 0;
        outIndices[v * outStride + j] = 0;
      }
    }
  }

  return {
    prunedWeights: outWeights,
    prunedIndices: outIndices,
    maxInfluencesFound: maxFound,
  };
}
