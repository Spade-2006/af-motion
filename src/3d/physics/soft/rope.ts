/**
 * AF Motion — 3D Rope & Flexible Cable Generator
 *
 * Generates discretized rope, chain, and cable structures with structural
 * stretch resistance, bending stiffness, endpoint pinning, and rigid-body coupling.
 */

import type { Vector3 } from "../types.js";
import type { SoftBodyState } from "../types.js";
import type { RopeConfig, PBDConstraint, PBDDistanceConstraint, PBDAttachmentConstraint } from "./types.js";
import { vec3, vec3Add, vec3Sub, vec3Scale, vec3Length, vec3SafeNormalize } from "../math.js";
import { computeSoftBodyAABB } from "./pbd.js";
import { createPhysicsMaterial } from "../material.js";

/**
 * Creates a 3D simulated rope or flexible cable.
 */
export function createRope3D(config: RopeConfig = {}): SoftBodyState {
  const id = config.id || `rope3d_${Math.random().toString(36).substring(2, 9)}`;
  const segments = Math.max(1, Math.round(config.segments ?? 20));
  const particleCount = segments + 1;
  const length = Math.max(0.1, config.length ?? 5.0);

  const startPos = config.startPosition ?? { x: 0, y: 5, z: 0 };
  let endPos: Vector3;

  if (config.endPosition) {
    endPos = config.endPosition;
  } else {
    const dir = vec3SafeNormalize(config.direction ?? { x: 0, y: -1, z: 0 });
    endPos = vec3Add(startPos, vec3Scale(dir, length));
  }

  const mass = Math.max(0.001, config.mass ?? 1.0);
  const particleMass = mass / particleCount;
  const invParticleMass = 1 / particleMass;

  const stiffness = Math.max(0, Math.min(1, config.stiffness ?? 0.98));
  const bendingStiffness = Math.max(0, Math.min(1, config.bendingStiffness ?? 0.4));
  const damping = Math.max(0, Math.min(1, config.damping ?? 0.02));

  const positions = new Float32Array(particleCount * 3);
  const restPositions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  const invMasses = new Float32Array(particleCount);
  const pinnedIndices = new Set<number>();

  const delta = vec3Sub(endPos, startPos);

  for (let i = 0; i < particleCount; i++) {
    const t = i / segments;
    const px = startPos.x + delta.x * t;
    const py = startPos.y + delta.y * t;
    const pz = startPos.z + delta.z * t;

    const idx = i * 3;
    positions[idx] = px;
    positions[idx + 1] = py;
    positions[idx + 2] = pz;

    restPositions[idx] = px;
    restPositions[idx + 1] = py;
    restPositions[idx + 2] = pz;

    invMasses[i] = invParticleMass;
  }

  // Pinning
  const pinnedStart = config.pinnedStart ?? true;
  if (pinnedStart) {
    pinnedIndices.add(0);
    invMasses[0] = 0;
  }

  const pinnedEnd = config.pinnedEnd ?? false;
  if (pinnedEnd) {
    pinnedIndices.add(segments);
    invMasses[segments] = 0;
  }

  const constraints: PBDConstraint[] = [];
  const tearable = config.tearable ?? false;
  const tearStrainThreshold = config.tearStrainThreshold ?? 0.8;

  // 1. Structural Distance Constraints between adjacent nodes (i <-> i + 1)
  for (let i = 0; i < segments; i++) {
    const i3 = i * 3;
    const next3 = (i + 1) * 3;
    const dx = restPositions[next3] - restPositions[i3];
    const dy = restPositions[next3 + 1] - restPositions[i3 + 1];
    const dz = restPositions[next3 + 2] - restPositions[i3 + 2];
    const restLen = Math.hypot(dx, dy, dz);

    constraints.push({
      type: "structural",
      particleA: i,
      particleB: i + 1,
      restLength: restLen,
      stiffness,
      tearable,
      tearStrainThreshold,
    } as PBDDistanceConstraint);
  }

  // 2. Bending / Straightness Resistance (2-hop: i <-> i + 2)
  for (let i = 0; i < segments - 1; i++) {
    const i3 = i * 3;
    const next23 = (i + 2) * 3;
    const dx = restPositions[next23] - restPositions[i3];
    const dy = restPositions[next23 + 1] - restPositions[i3 + 1];
    const dz = restPositions[next23 + 2] - restPositions[i3 + 2];
    const restLen = Math.hypot(dx, dy, dz);

    constraints.push({
      type: "bending",
      particleA: i,
      particleB: i + 2,
      restLength: restLen,
      stiffness: bendingStiffness,
    } as PBDDistanceConstraint);
  }

  // 3. Dynamic Rigid Body Attachments
  if (config.attachStartToBodyId) {
    constraints.push({
      type: "attachment",
      particleIndex: 0,
      targetBodyId: config.attachStartToBodyId,
      localPivot: config.attachStartPivot ?? vec3(0, 0, 0),
      stiffness: 1.0,
    } as PBDAttachmentConstraint);
  }

  if (config.attachEndToBodyId) {
    constraints.push({
      type: "attachment",
      particleIndex: segments,
      targetBodyId: config.attachEndToBodyId,
      localPivot: config.attachEndPivot ?? vec3(0, 0, 0),
      stiffness: 1.0,
    } as PBDAttachmentConstraint);
  }

  const aabb = computeSoftBodyAABB(positions, config.radius ?? 0.05);

  return {
    id,
    particleCount,
    positions,
    velocities,
    restPositions,
    invMasses,
    material: createPhysicsMaterial(config.material),
    stiffness,
    damping,
    aabb,
    constraints,
    pinnedIndices,
    tearable,
    tearStrainThreshold,
    useGPU: config.useGPU ?? false,
    userData: config.userData,
  };
}

/**
 * Creates an articulated physical chain with rigid links and heavy segments.
 */
export function createChain3D(config: RopeConfig = {}): SoftBodyState {
  return createRope3D({
    ...config,
    mass: (config.mass ?? 1.0) * 2.5,
    stiffness: 1.0, // Inelastic links
    bendingStiffness: config.bendingStiffness ?? 0.15, // High flexibility between links
    damping: config.damping ?? 0.05,
  });
}
