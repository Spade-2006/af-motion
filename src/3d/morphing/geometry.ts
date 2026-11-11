/**
 * AF Motion — 3D Morph Geometry Lifecycle & Target Management
 *
 * Manages morphable 3D geometry objects, target registrations, scratch buffer pools,
 * and seamless correspondence normalization.
 */

import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";
import type { MorphGeometry3D, MorphTarget3D } from "./types.js";
import { resampleGeometry, mapVertexCorrespondence } from "./correspondence.js";

type AnyMesh = Mesh3DData | GeometryBufferData;

/**
 * Creates a managed MorphGeometry3D container with pre-allocated scratch buffers.
 */
export function createMorphGeometry(
  base: AnyMesh,
  targets: Array<AnyMesh | MorphTarget3D> = []
): MorphGeometry3D {
  const vCount = Math.floor(base.positions.length / 3);
  const triCount = base.indices
    ? Math.floor(base.indices.length / 3)
    : Math.floor(vCount / 3);

  // Scratch buffers for allocation-free updates during animation
  const scratchPositions = new Float32Array(base.positions.length);
  scratchPositions.set(base.positions);

  const scratchNormals = base.normals ? new Float32Array(base.normals.length) : undefined;
  if (scratchNormals && base.normals) scratchNormals.set(base.normals);

  const scratchUvs = base.uvs ? new Float32Array(base.uvs.length) : undefined;
  if (scratchUvs && base.uvs) scratchUvs.set(base.uvs);

  const colors = "colors" in base && base.colors ? (base.colors as Float32Array) : undefined;
  const scratchColors = colors ? new Float32Array(colors.length) : undefined;
  if (scratchColors && colors) scratchColors.set(colors);

  const baseMesh: Mesh3DData = {
    id: "id" in base && base.id ? base.id : "morph-base",
    name: "name" in base && base.name ? base.name : "MorphBase",
    positions: new Float32Array(base.positions),
    normals: base.normals ? new Float32Array(base.normals) : undefined,
    uvs: base.uvs ? new Float32Array(base.uvs) : undefined,
    indices: base.indices ? ("slice" in base.indices ? base.indices.slice() : new Uint16Array(base.indices)) : undefined,
  };

  const currentMesh: Mesh3DData = {
    id: `${baseMesh.id}-current`,
    name: `${baseMesh.name}-Current`,
    positions: scratchPositions,
    normals: scratchNormals,
    uvs: scratchUvs,
    indices: baseMesh.indices,
  };

  const morphGeo: MorphGeometry3D = {
    id: `morph-${baseMesh.id}-${Date.now()}`,
    base: baseMesh,
    targets: [],
    indices: baseMesh.indices,
    vertexCount: vCount,
    triangleCount: triCount,
    currentMesh,
    scratchPositions,
    scratchNormals,
    scratchUvs,
    scratchColors,
  };

  for (let i = 0; i < targets.length; i++) {
    addMorphTarget(morphGeo, targets[i], `target-${i + 1}`);
  }

  return morphGeo;
}

/**
 * Registers an additional morph target into a MorphGeometry3D container.
 * Automatically aligns and resamples geometry if vertex counts do not match.
 */
export function addMorphTarget(
  morphGeometry: MorphGeometry3D,
  targetInput: AnyMesh | MorphTarget3D,
  fallbackId?: string
): MorphTarget3D {
  const baseVCount = morphGeometry.vertexCount;
  let targetPositions: Float32Array;
  let targetNormals: Float32Array | undefined;
  let targetUvs: Float32Array | undefined;
  let targetColors: Float32Array | undefined;

  let id = fallbackId ?? (("id" in targetInput && targetInput.id) ? targetInput.id : `target-${morphGeometry.targets.length + 1}`);
  let name: string | undefined;
  let weight = 0;
  let relative = false;

  if ("weight" in targetInput && typeof targetInput.weight === "number") {
    weight = targetInput.weight;
  }
  if ("relative" in targetInput && typeof targetInput.relative === "boolean") {
    relative = targetInput.relative;
  }
  if (!fallbackId && "id" in targetInput && targetInput.id) {
    id = targetInput.id;
  }
  if ("name" in targetInput && targetInput.name) {
    name = targetInput.name;
  }

  const rawPositions = targetInput.positions;
  const targetVCount = Math.floor(rawPositions.length / 3);

  if (targetVCount === baseVCount) {
    targetPositions = new Float32Array(rawPositions);
    targetNormals = targetInput.normals ? new Float32Array(targetInput.normals) : undefined;
    targetUvs = targetInput.uvs ? new Float32Array(targetInput.uvs) : undefined;
  } else {
    // Incompatible vertex count -> Resample to match base topology
    const resampled = resampleGeometry(targetInput, baseVCount);
    targetPositions = resampled.positions;
    targetNormals = resampled.normals;
    targetUvs = resampled.uvs;
  }

  const target: MorphTarget3D = {
    id,
    name: name ?? id,
    positions: targetPositions,
    normals: targetNormals,
    uvs: targetUvs,
    colors: targetColors,
    weight,
    relative,
  };

  morphGeometry.targets.push(target);
  return target;
}

/**
 * Removes a morph target by its identifier.
 */
export function removeMorphTarget(
  morphGeometry: MorphGeometry3D,
  targetId: string
): boolean {
  const idx = morphGeometry.targets.findIndex((t) => t.id === targetId);
  if (idx !== -1) {
    morphGeometry.targets.splice(idx, 1);
    return true;
  }
  return false;
}

/**
 * Finds a registered morph target by its identifier.
 */
export function getMorphTarget(
  morphGeometry: MorphGeometry3D,
  targetId: string
): MorphTarget3D | undefined {
  return morphGeometry.targets.find((t) => t.id === targetId);
}
