/**
 * AF Motion — 3D Cloth Simulation Generator
 *
 * Generates grid-based deformable cloth meshes with structural, shear,
 * and bending constraints, aerodynamic wind coupling, and tearable links.
 */

import type { Vector3, Quaternion } from "../types.js";
import type { SoftBodyState } from "../types.js";
import type { ClothConfig, PBDConstraint, PBDDistanceConstraint } from "./types.js";
import {
  vec3,
  quatIdentity,
  vec3TransformQuat,
  quatFromAxisAngle,
} from "../math.js";
import { computeSoftBodyAABB } from "./pbd.js";
import { createPhysicsMaterial } from "../material.js";

/**
 * Creates a production-grade 3D cloth simulation soft body.
 */
export function createCloth3D(config: ClothConfig = {}): SoftBodyState {
  const id = config.id || `cloth3d_${Math.random().toString(36).substring(2, 9)}`;
  const width = Math.max(0.1, config.width ?? 2.0);
  const height = Math.max(0.1, config.height ?? 2.0);
  const segX = Math.max(1, Math.round(config.segmentsX ?? 10));
  const segY = Math.max(1, Math.round(config.segmentsY ?? 10));

  const cols = segX + 1;
  const rows = segY + 1;
  const totalParticles = cols * rows;

  const center = config.position ?? { x: 0, y: 2, z: 0 };
  const mass = Math.max(0.001, config.mass ?? 1.0);
  const particleMass = mass / totalParticles;
  const invParticleMass = 1 / particleMass;

  const structuralStiffness = Math.max(0, Math.min(1, config.stiffness ?? 0.95));
  const shearStiffness = Math.max(0, Math.min(1, config.shearStiffness ?? 0.7));
  const bendingStiffness = Math.max(0, Math.min(1, config.bendingStiffness ?? 0.3));
  const damping = Math.max(0, Math.min(1, config.damping ?? 0.02));

  // Orientation quaternion
  let rot: Quaternion = quatIdentity();
  if (config.orientation === "xz") {
    rot = quatFromAxisAngle(vec3(1, 0, 0), -Math.PI / 2);
  } else if (config.orientation === "yz") {
    rot = quatFromAxisAngle(vec3(0, 1, 0), Math.PI / 2);
  } else if (typeof config.orientation === "object") {
    rot = config.orientation;
  }

  const positions = new Float32Array(totalParticles * 3);
  const restPositions = new Float32Array(totalParticles * 3);
  const velocities = new Float32Array(totalParticles * 3);
  const invMasses = new Float32Array(totalParticles);
  const pinnedIndices = new Set<number>(config.pinnedIndices ?? []);

  // Compute node coordinates
  for (let r = 0; r <= segY; r++) {
    for (let c = 0; c <= segX; c++) {
      const idx = r * cols + c;
      const idx3 = idx * 3;

      // Local plane coordinates centered around origin
      const lx = (c / segX - 0.5) * width;
      const ly = (1 - r / segY - 0.5) * height; // Top is r = 0
      const lz = 0;

      const rotated = vec3TransformQuat({ x: lx, y: ly, z: lz }, rot);
      const wx = center.x + rotated.x;
      const wy = center.y + rotated.y;
      const wz = center.z + rotated.z;

      positions[idx3] = wx;
      positions[idx3 + 1] = wy;
      positions[idx3 + 2] = wz;

      restPositions[idx3] = wx;
      restPositions[idx3 + 1] = wy;
      restPositions[idx3 + 2] = wz;

      invMasses[idx] = invParticleMass;
    }
  }

  // Handle pinning conveniences
  if (config.pinTopEdge) {
    for (let c = 0; c <= segX; c++) {
      pinnedIndices.add(c); // r = 0 is top edge
    }
  }

  if (config.pinCorners) {
    pinnedIndices.add(0); // top-left
    pinnedIndices.add(segX); // top-right
    pinnedIndices.add(segY * cols); // bottom-left
    pinnedIndices.add(segY * cols + segX); // bottom-right
  }

  for (const p of pinnedIndices) {
    if (p >= 0 && p < totalParticles) {
      invMasses[p] = 0;
    }
  }

  // Generate surface triangles
  const totalQuads = segX * segY;
  const triangleIndices = new Uint32Array(totalQuads * 6);
  let triIdx = 0;

  for (let r = 0; r < segY; r++) {
    for (let c = 0; c < segX; c++) {
      const p0 = r * cols + c;
      const p1 = p0 + 1;
      const p2 = (r + 1) * cols + c;
      const p3 = p2 + 1;

      // Triangle 1
      triangleIndices[triIdx++] = p0;
      triangleIndices[triIdx++] = p2;
      triangleIndices[triIdx++] = p1;

      // Triangle 2
      triangleIndices[triIdx++] = p1;
      triangleIndices[triIdx++] = p2;
      triangleIndices[triIdx++] = p3;
    }
  }

  // Helper to compute rest length between particles
  const getRestDist = (a: number, b: number): number => {
    const a3 = a * 3;
    const b3 = b * 3;
    const dx = restPositions[a3] - restPositions[b3];
    const dy = restPositions[a3 + 1] - restPositions[b3 + 1];
    const dz = restPositions[a3 + 2] - restPositions[b3 + 2];
    return Math.hypot(dx, dy, dz);
  };

  const constraints: PBDConstraint[] = [];
  const tearable = config.tearable ?? false;
  const tearStrainThreshold = config.tearStrainThreshold ?? 0.8;

  // 1. Structural Constraints (Horizontal & Vertical)
  for (let r = 0; r <= segY; r++) {
    for (let c = 0; c <= segX; c++) {
      const p = r * cols + c;

      // Horizontal edge (p <-> p + 1)
      if (c < segX) {
        const right = p + 1;
        constraints.push({
          type: "structural",
          particleA: p,
          particleB: right,
          restLength: getRestDist(p, right),
          stiffness: structuralStiffness,
          tearable,
          tearStrainThreshold,
        } as PBDDistanceConstraint);
      }

      // Vertical edge (p <-> p + cols)
      if (r < segY) {
        const bottom = p + cols;
        constraints.push({
          type: "structural",
          particleA: p,
          particleB: bottom,
          restLength: getRestDist(p, bottom),
          stiffness: structuralStiffness,
          tearable,
          tearStrainThreshold,
        } as PBDDistanceConstraint);
      }
    }
  }

  // 2. Shear Constraints (Diagonals)
  for (let r = 0; r < segY; r++) {
    for (let c = 0; c < segX; c++) {
      const p0 = r * cols + c;
      const p1 = p0 + 1;
      const p2 = (r + 1) * cols + c;
      const p3 = p2 + 1;

      // Diagonal 1 (p0 <-> p3)
      constraints.push({
        type: "shear",
        particleA: p0,
        particleB: p3,
        restLength: getRestDist(p0, p3),
        stiffness: shearStiffness,
        tearable,
        tearStrainThreshold,
      } as PBDDistanceConstraint);

      // Diagonal 2 (p1 <-> p2)
      constraints.push({
        type: "shear",
        particleA: p1,
        particleB: p2,
        restLength: getRestDist(p1, p2),
        stiffness: shearStiffness,
        tearable,
        tearStrainThreshold,
      } as PBDDistanceConstraint);
    }
  }

  // 3. Bending Constraints (2-Hop Horizontal & Vertical)
  for (let r = 0; r <= segY; r++) {
    for (let c = 0; c <= segX; c++) {
      const p = r * cols + c;

      // 2-hop Horizontal (p <-> p + 2)
      if (c + 2 <= segX) {
        const right2 = p + 2;
        constraints.push({
          type: "bending",
          particleA: p,
          particleB: right2,
          restLength: getRestDist(p, right2),
          stiffness: bendingStiffness,
        } as PBDDistanceConstraint);
      }

      // 2-hop Vertical (p <-> p + 2*cols)
      if (r + 2 <= segY) {
        const bottom2 = p + 2 * cols;
        constraints.push({
          type: "bending",
          particleA: p,
          particleB: bottom2,
          restLength: getRestDist(p, bottom2),
          stiffness: bendingStiffness,
        } as PBDDistanceConstraint);
      }
    }
  }

  const windConfig = typeof config.windInteraction === "object"
    ? { enabled: true, dragCoefficient: config.windInteraction.dragCoefficient ?? 0.5 }
    : config.windInteraction === true
    ? { enabled: true, dragCoefficient: 0.5 }
    : undefined;

  const initialAABB = computeSoftBodyAABB(positions);

  return {
    id,
    particleCount: totalParticles,
    positions,
    velocities,
    restPositions,
    invMasses,
    indices: triangleIndices,
    material: createPhysicsMaterial(config.material),
    stiffness: structuralStiffness,
    damping,
    aabb: initialAABB,
    constraints,
    pinnedIndices,
    tearable,
    tearStrainThreshold,
    useGPU: config.useGPU ?? false,
    windConfig,
    userData: config.userData,
  };
}
