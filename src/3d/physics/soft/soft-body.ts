/**
 * AF Motion — Generic 3D Soft Body Generator
 *
 * Implements general volumetric deformable bodies, tetrahedral / polygonal
 * surface meshes, volume conservation, and shape-matching preservation.
 */

import type { Vector3 } from "../types.js";
import type { SoftBodyState } from "../types.js";
import type {
  SoftBodyConfig,
  ParticleConfig,
  PBDConstraint,
  PBDDistanceConstraint,
  PBDVolumeConstraint,
  PBDShapeMatchingConstraint,
} from "./types.js";
import { vec3, EPSILON } from "../math.js";
import { computeMeshVolume, computeSoftBodyAABB } from "./pbd.js";
import { createPhysicsMaterial } from "../material.js";

/**
 * Creates an independent 3D Soft Body instance.
 */
export function createSoftBody3D(config: SoftBodyConfig): SoftBodyState {
  const id = config.id || `softbody3d_${Math.random().toString(36).substring(2, 9)}`;

  let particleCount = 0;
  let positions: Float32Array;
  let restPositions: Float32Array;
  let velocities: Float32Array;
  let invMasses: Float32Array;
  const pinnedIndices = new Set<number>();

  if (config.particles instanceof Float32Array) {
    particleCount = config.particles.length / 3;
    positions = new Float32Array(config.particles);
    restPositions = new Float32Array(config.particles);
    velocities = new Float32Array(config.particles.length);
    invMasses = new Float32Array(particleCount);
    invMasses.fill(1.0);
  } else {
    const list = config.particles as ParticleConfig[];
    particleCount = list.length;
    positions = new Float32Array(particleCount * 3);
    restPositions = new Float32Array(particleCount * 3);
    velocities = new Float32Array(particleCount * 3);
    invMasses = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const p = list[i];
      const idx = i * 3;
      positions[idx] = p.position.x;
      positions[idx + 1] = p.position.y;
      positions[idx + 2] = p.position.z;

      restPositions[idx] = p.position.x;
      restPositions[idx + 1] = p.position.y;
      restPositions[idx + 2] = p.position.z;

      if (p.velocity) {
        velocities[idx] = p.velocity.x;
        velocities[idx + 1] = p.velocity.y;
        velocities[idx + 2] = p.velocity.z;
      }

      const m = Math.max(0, p.mass ?? 1.0);
      invMasses[i] = m > EPSILON && !p.pinned ? 1 / m : 0;
      if (p.pinned) pinnedIndices.add(i);
    }
  }

  const stiffness = Math.max(0, Math.min(1, config.stiffness ?? 0.9));
  const damping = Math.max(0, Math.min(1, config.damping ?? 0.05));
  const constraints: PBDConstraint[] = config.constraints ? [...config.constraints] : [];

  let triangleIndices: Uint32Array | undefined;
  if (config.indices) {
    triangleIndices = config.indices instanceof Uint32Array
      ? config.indices
      : new Uint32Array(config.indices);
  }

  let restVolume = 0;
  // If mesh is closed and volumeStiffness is specified, configure volume constraint
  if (triangleIndices && triangleIndices.length >= 12 && (config.volumeStiffness ?? 0) > 0) {
    restVolume = computeMeshVolume(positions, triangleIndices);
    if (Math.abs(restVolume) > EPSILON) {
      constraints.push({
        type: "volume",
        triangleIndices,
        restVolume,
        stiffness: config.volumeStiffness,
      } as PBDVolumeConstraint);
    }
  }

  // If no internal distance constraints are provided, generate linear shape-matching
  const hasStructural = constraints.some((c) => c.type === "distance" || c.type === "structural");
  if (!hasStructural && particleCount > 1) {
    // Compute rest center of mass
    let cmX = 0, cmY = 0, cmZ = 0, totalM = 0;
    for (let i = 0; i < particleCount; i++) {
      const m = invMasses[i] > EPSILON ? 1 / invMasses[i] : 1.0;
      totalM += m;
      cmX += restPositions[i * 3] * m;
      cmY += restPositions[i * 3 + 1] * m;
      cmZ += restPositions[i * 3 + 2] * m;
    }
    cmX /= totalM;
    cmY /= totalM;
    cmZ /= totalM;

    const restOffsets = new Float32Array(particleCount * 3);
    const particleIndices: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      particleIndices.push(i);
      restOffsets[i * 3] = restPositions[i * 3] - cmX;
      restOffsets[i * 3 + 1] = restPositions[i * 3 + 1] - cmY;
      restOffsets[i * 3 + 2] = restPositions[i * 3 + 2] - cmZ;
    }

    constraints.push({
      type: "shape-matching",
      particleIndices,
      restOffsets,
      restCenterOfMass: { x: cmX, y: cmY, z: cmZ },
      stiffness,
    } as PBDShapeMatchingConstraint);
  }

  const initialAABB = computeSoftBodyAABB(positions);

  return {
    id,
    particleCount,
    positions,
    velocities,
    restPositions,
    invMasses,
    indices: triangleIndices,
    material: createPhysicsMaterial(config.material),
    stiffness,
    damping,
    pressure: config.pressure,
    volumeStiffness: config.volumeStiffness,
    restVolume,
    aabb: initialAABB,
    constraints,
    pinnedIndices,
    tearable: config.tearable ?? false,
    tearStrainThreshold: config.tearStrainThreshold ?? 0.8,
    useGPU: config.useGPU ?? false,
    userData: config.userData,
  };
}
