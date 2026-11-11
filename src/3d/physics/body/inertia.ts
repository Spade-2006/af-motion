/**
 * AF Motion — 3D Rotational Inertia & Mass Properties
 *
 * Accurate analytical moment of inertia tensors for 3D primitive and compound
 * colliders, parallel axis theorem (Huygens-Steiner), and world-space tensor rotations.
 */

import type {
  Matrix3,
  Vector3,
  Quaternion,
  Collider3D,
  ColliderShape3D,
} from "../types.js";
import {
  mat3Identity,
  mat3Diagonal,
  mat3FromQuaternion,
  mat3Multiply,
  mat3Transpose,
  mat3Invert,
  vec3,
  vec3Clone,
  vec3Add,
  vec3Scale,
  vec3LengthSq,
  quatRotateVector,
  EPSILON,
} from "../math.js";

/**
 * Calculates geometric volume for 3D primitive collider shapes.
 */
export function computeShapeVolume(shape: ColliderShape3D): number {
  switch (shape.type) {
    case "sphere":
      return (4 / 3) * Math.PI * Math.pow(shape.radius, 3);

    case "box":
      // Volume = (2 * hx) * (2 * hy) * (2 * hz) = 8 * hx * hy * hz
      return 8 * shape.halfExtents.x * shape.halfExtents.y * shape.halfExtents.z;

    case "capsule": {
      const r = shape.radius;
      const h = shape.height;
      const cylVol = Math.PI * r * r * h;
      const sphereVol = (4 / 3) * Math.PI * Math.pow(r, 3);
      return cylVol + sphereVol;
    }

    case "plane":
    case "heightfield":
      // Infinite plane / terrain has arbitrary volume, treated as static
      return 1e6;

    case "convex": {
      // Approximate bounding box volume for convex mesh
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      if (shape.vertices instanceof Float32Array) {
        for (let i = 0; i < shape.vertices.length; i += 3) {
          const x = shape.vertices[i];
          const y = shape.vertices[i + 1];
          const z = shape.vertices[i + 2];
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (z < minZ) minZ = z;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (z > maxZ) maxZ = z;
        }
      } else {
        for (const pt of shape.vertices) {
          if (pt.x < minX) minX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.z < minZ) minZ = pt.z;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y > maxY) maxY = pt.y;
          if (pt.z > maxZ) maxZ = pt.z;
        }
      }

      const dx = Math.max(0.01, maxX - minX);
      const dy = Math.max(0.01, maxY - minY);
      const dz = Math.max(0.01, maxZ - minZ);
      return dx * dy * dz * 0.5; // Polyhedron volume approximation
    }
  }
}

/**
 * Calculates mass of a shape given its volume and density in kg/m^3.
 */
export function computeShapeMassFromDensity(
  shape: ColliderShape3D,
  density: number = 1000
): number {
  const vol = computeShapeVolume(shape);
  return Math.max(0.0001, vol * density);
}

/**
 * Computes the principal diagonal inertia tensor for a solid uniform sphere.
 * I = (2/5) * m * r^2
 */
export function computeSphereInertia(radius: number, mass: number): Matrix3 {
  const i = (2 / 5) * mass * radius * radius;
  return mat3Diagonal(i, i, i);
}

/**
 * Computes the principal diagonal inertia tensor for a solid uniform box.
 * I_xx = (1/12) * m * (width_y^2 + width_z^2) = (1/3) * m * (hy^2 + hz^2)
 */
export function computeBoxInertia(halfExtents: Vector3, mass: number): Matrix3 {
  const hx = halfExtents.x;
  const hy = halfExtents.y;
  const hz = halfExtents.z;

  const ix = (1 / 3) * mass * (hy * hy + hz * hz);
  const iy = (1 / 3) * mass * (hx * hx + hz * hz);
  const iz = (1 / 3) * mass * (hx * hx + hy * hy);

  return mat3Diagonal(ix, iy, iz);
}

/**
 * Computes the principal inertia tensor for a solid capsule composed of
 * a cylinder of radius r and height h, capped by two hemispheres.
 */
export function computeCapsuleInertia(
  radius: number,
  height: number,
  axis: "x" | "y" | "z" = "y",
  mass: number = 1
): Matrix3 {
  const r = radius;
  const h = height;

  const cylVol = Math.PI * r * r * h;
  const sphereVol = (4 / 3) * Math.PI * Math.pow(r, 3);
  const totalVol = cylVol + sphereVol;

  const cylMass = mass * (cylVol / totalVol);
  const sphereMass = mass * (sphereVol / totalVol);
  const hemiMass = sphereMass * 0.5;

  // Cylinder inertia about central axes (assuming Y is cylinder axis)
  const iCylY = 0.5 * cylMass * r * r;
  const iCylX = (1 / 12) * cylMass * (3 * r * r + h * h);
  const iCylZ = iCylX;

  // Hemispheres offset by h/2
  const d = 0.5 * h + (3 / 8) * r; // Distance to hemisphere center of mass
  const iHemiSpin = (2 / 5) * hemiMass * r * r;
  const iHemiTransverse = iHemiSpin + hemiMass * (d * d);

  let ix = iCylX + 2 * iHemiTransverse;
  let iy = iCylY + 2 * iHemiSpin;
  let iz = iCylZ + 2 * iHemiTransverse;

  if (axis === "x") {
    const tmp = iy;
    iy = ix;
    ix = tmp;
  } else if (axis === "z") {
    const tmp = iy;
    iy = iz;
    iz = tmp;
  }

  return mat3Diagonal(ix, iy, iz);
}

/**
 * Computes the local inertia tensor for an individual collider shape.
 */
export function computeColliderInertia(
  shape: ColliderShape3D,
  mass: number
): Matrix3 {
  switch (shape.type) {
    case "sphere":
      return computeSphereInertia(shape.radius, mass);
    case "box":
      return computeBoxInertia(shape.halfExtents, mass);
    case "capsule":
      return computeCapsuleInertia(shape.radius, shape.height, shape.axis ?? "y", mass);
    case "plane":
    case "heightfield":
      return mat3Diagonal(Infinity, Infinity, Infinity);
    case "convex": {
      // Approximate as bounding box inertia
      const vol = computeShapeVolume(shape);
      const approxH = Math.cbrt(vol) * 0.5;
      return computeBoxInertia({ x: approxH, y: approxH, z: approxH }, mass);
    }
  }
}

/**
 * Shifts an inertia tensor about an offset vector using the Parallel Axis Theorem:
 * I_offset = I_cm + m * (||d||^2 * I_3 - d * d^T)
 */
export function applyParallelAxisTheorem(
  inertia: Matrix3,
  offset: Vector3,
  mass: number
): Matrix3 {
  const d = offset;
  const dSq = vec3LengthSq(d);

  // m * (||d||^2 * I_3 - d * d^T)
  const shift: Matrix3 = [
    mass * (dSq - d.x * d.x), -mass * d.x * d.y,         -mass * d.x * d.z,
    -mass * d.y * d.x,        mass * (dSq - d.y * d.y),  -mass * d.y * d.z,
    -mass * d.z * d.x,        -mass * d.z * d.y,         mass * (dSq - d.z * d.z),
  ];

  return [
    inertia[0] + shift[0], inertia[1] + shift[1], inertia[2] + shift[2],
    inertia[3] + shift[3], inertia[4] + shift[4], inertia[5] + shift[5],
    inertia[6] + shift[6], inertia[7] + shift[7], inertia[8] + shift[8],
  ];
}

/**
 * Rotates a 3x3 inertia tensor by an orientation quaternion:
 * I_rot = R * I * R^T
 */
export function rotateInertiaTensor(inertia: Matrix3, rotation: Quaternion): Matrix3 {
  const R = mat3FromQuaternion(rotation);
  const RT = mat3Transpose(R);
  // R * inertia * R^T
  const R_I = mat3Multiply(R, inertia);
  return mat3Multiply(R_I, RT);
}

/**
 * Computes the world-space inverse inertia tensor from the body's local inverse tensor
 * and its current world orientation:
 * I_world^-1 = R * I_local^-1 * R^T
 */
export function computeWorldInvInertiaTensor(
  invInertiaLocal: Matrix3,
  rotation: Quaternion
): Matrix3 {
  return rotateInertiaTensor(invInertiaLocal, rotation);
}

/**
 * Computes compound mass, center of mass, and combined inertia tensor for a collection
 * of sub-colliders with local offsets and orientations.
 */
export function computeCompoundMassProperties(
  colliders: readonly Collider3D[],
  defaultDensity: number = 1000,
  explicitMass?: number
): {
  mass: number;
  invMass: number;
  centerOfMass: Vector3;
  inertiaTensor: Matrix3;
  invInertiaTensor: Matrix3;
} {
  if (colliders.length === 0) {
    const m = explicitMass ?? 1.0;
    const inertia = computeSphereInertia(1.0, m);
    return {
      mass: m,
      invMass: 1 / m,
      centerOfMass: vec3(0, 0, 0),
      inertiaTensor: inertia,
      invInertiaTensor: mat3Invert(inertia),
    };
  }

  // 1. Calculate mass and volume of each child collider
  const colliderMasses: number[] = [];
  let calculatedTotalMass = 0;
  let weightedPosSum = vec3(0, 0, 0);

  for (const col of colliders) {
    const density = col.material?.density ?? defaultDensity;
    const colMass = computeShapeMassFromDensity(col.shape, density);
    colliderMasses.push(colMass);
    calculatedTotalMass += colMass;
    weightedPosSum = vec3Add(weightedPosSum, vec3Scale(col.offset.position, colMass));
  }

  const finalMass = explicitMass !== undefined ? Math.max(0.0001, explicitMass) : calculatedTotalMass;
  const massScale = finalMass / calculatedTotalMass;

  // Scale sub-collider masses if explicit mass was specified
  for (let i = 0; i < colliderMasses.length; i++) {
    colliderMasses[i] *= massScale;
  }

  // 2. Center of Mass
  const centerOfMass = vec3Scale(weightedPosSum, 1 / calculatedTotalMass);

  // 3. Accumulate compound inertia tensor about center of mass
  let totalInertia: Matrix3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (let i = 0; i < colliders.length; i++) {
    const col = colliders[i];
    const m_i = colliderMasses[i];

    // Local shape inertia
    const localInertia = computeColliderInertia(col.shape, m_i);

    // Rotate inertia by collider local rotation: R_i * I_local * R_i^T
    const rotatedInertia = rotateInertiaTensor(localInertia, col.offset.rotation);

    // Offset from center of mass: d_i = col.position - CM
    const d = {
      x: col.offset.position.x - centerOfMass.x,
      y: col.offset.position.y - centerOfMass.y,
      z: col.offset.position.z - centerOfMass.z,
    };

    // Apply parallel axis theorem
    const shiftedInertia = applyParallelAxisTheorem(rotatedInertia, d, m_i);

    // Sum
    totalInertia = [
      totalInertia[0] + shiftedInertia[0], totalInertia[1] + shiftedInertia[1], totalInertia[2] + shiftedInertia[2],
      totalInertia[3] + shiftedInertia[3], totalInertia[4] + shiftedInertia[4], totalInertia[5] + shiftedInertia[5],
      totalInertia[6] + shiftedInertia[6], totalInertia[7] + shiftedInertia[7], totalInertia[8] + shiftedInertia[8],
    ];
  }

  const invInertia = mat3Invert(totalInertia);

  return {
    mass: finalMass,
    invMass: 1 / finalMass,
    centerOfMass,
    inertiaTensor: totalInertia,
    invInertiaTensor: invInertia,
  };
}
