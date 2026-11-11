/**
 * AF Motion — 3D Collision Shapes & Collider Factory
 *
 * Geometric representations for 3D collision bodies, layer filtering,
 * and precise world-space AABB bounding calculations.
 */

import type {
  Collider3D,
  ColliderShape3D,
  SphereColliderShape,
  BoxColliderShape,
  CapsuleColliderShape,
  PlaneColliderShape,
  ConvexColliderShape,
  HeightfieldColliderShape,
  Transform3D,
  AABB3D,
  Vector3,
} from "../types.js";
import {
  vec3,
  createTransform3D,
  localToWorldPoint,
  quatRotateVector,
  aabb3DFromMinMax,
  composeTransform3D,
  vec3Clone,
} from "../math.js";

/**
 * Creates a 3D Sphere shape.
 */
export function createSphereShape(radius: number): SphereColliderShape {
  return { type: "sphere", radius: Math.max(0.001, radius) };
}

/**
 * Creates a 3D Box shape from half-extents.
 */
export function createBoxShape(halfExtents: Vector3): BoxColliderShape {
  return {
    type: "box",
    halfExtents: {
      x: Math.max(0.001, Math.abs(halfExtents.x)),
      y: Math.max(0.001, Math.abs(halfExtents.y)),
      z: Math.max(0.001, Math.abs(halfExtents.z)),
    },
  };
}

/**
 * Creates a 3D Capsule shape.
 */
export function createCapsuleShape(
  radius: number,
  height: number,
  axis: "x" | "y" | "z" = "y"
): CapsuleColliderShape {
  return {
    type: "capsule",
    radius: Math.max(0.001, radius),
    height: Math.max(0.001, height),
    axis,
  };
}

/**
 * Creates an infinite 3D Plane shape (plane equation: dot(normal, x) - constant = 0).
 */
export function createPlaneShape(normal: Vector3, constant: number = 0): PlaneColliderShape {
  const len = Math.hypot(normal.x, normal.y, normal.z);
  const inv = len > 1e-6 ? 1 / len : 1;
  return {
    type: "plane",
    normal: { x: normal.x * inv, y: normal.y * inv, z: normal.z * inv },
    constant,
  };
}

/**
 * Creates a Convex Polyhedron shape.
 */
export function createConvexShape(
  vertices: Float32Array | readonly Vector3[],
  indices?: Uint32Array | Uint16Array
): ConvexColliderShape {
  return {
    type: "convex",
    vertices,
    indices,
  };
}

/**
 * Computes the world-space Axis-Aligned Bounding Box (AABB) for a 3D collider.
 */
export function computeColliderAABB(
  collider: Collider3D,
  bodyTransform?: Transform3D
): AABB3D {
  const worldTransform = bodyTransform
    ? composeTransform3D(bodyTransform, collider.offset)
    : collider.offset;

  const shape = collider.shape;

  switch (shape.type) {
    case "sphere": {
      const maxScale = Math.max(
        Math.abs(worldTransform.scale.x),
        Math.abs(worldTransform.scale.y),
        Math.abs(worldTransform.scale.z)
      );
      const r = shape.radius * maxScale;
      return {
        min: {
          x: worldTransform.position.x - r,
          y: worldTransform.position.y - r,
          z: worldTransform.position.z - r,
        },
        max: {
          x: worldTransform.position.x + r,
          y: worldTransform.position.y + r,
          z: worldTransform.position.z + r,
        },
      };
    }

    case "box": {
      const hx = shape.halfExtents.x * Math.abs(worldTransform.scale.x);
      const hy = shape.halfExtents.y * Math.abs(worldTransform.scale.y);
      const hz = shape.halfExtents.z * Math.abs(worldTransform.scale.z);

      // 8 local box vertices
      const corners: Vector3[] = [
        { x: -hx, y: -hy, z: -hz },
        { x: -hx, y: -hy, z: hz },
        { x: -hx, y: hy, z: -hz },
        { x: -hx, y: hy, z: hz },
        { x: hx, y: -hy, z: -hz },
        { x: hx, y: -hy, z: hz },
        { x: hx, y: hy, z: -hz },
        { x: hx, y: hy, z: hz },
      ];

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      for (let i = 0; i < 8; i++) {
        const rotated = quatRotateVector(worldTransform.rotation, corners[i]);
        const wx = worldTransform.position.x + rotated.x;
        const wy = worldTransform.position.y + rotated.y;
        const wz = worldTransform.position.z + rotated.z;

        if (wx < minX) minX = wx;
        if (wy < minY) minY = wy;
        if (wz < minZ) minZ = wz;
        if (wx > maxX) maxX = wx;
        if (wy > maxY) maxY = wy;
        if (wz > maxZ) maxZ = wz;
      }

      return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
      };
    }

    case "capsule": {
      const axis = shape.axis ?? "y";
      const halfH = shape.height * 0.5;
      const r = shape.radius;

      let p1Local: Vector3 = { x: 0, y: 0, z: 0 };
      let p2Local: Vector3 = { x: 0, y: 0, z: 0 };

      if (axis === "x") {
        p1Local = { x: -halfH, y: 0, z: 0 };
        p2Local = { x: halfH, y: 0, z: 0 };
      } else if (axis === "z") {
        p1Local = { x: 0, y: 0, z: -halfH };
        p2Local = { x: 0, y: 0, z: halfH };
      } else {
        // y
        p1Local = { x: 0, y: -halfH, z: 0 };
        p2Local = { x: 0, y: halfH, z: 0 };
      }

      const p1 = localToWorldPoint(worldTransform, p1Local);
      const p2 = localToWorldPoint(worldTransform, p2Local);

      const maxScale = Math.max(
        Math.abs(worldTransform.scale.x),
        Math.abs(worldTransform.scale.y),
        Math.abs(worldTransform.scale.z)
      );
      const effR = r * maxScale;

      return {
        min: {
          x: Math.min(p1.x, p2.x) - effR,
          y: Math.min(p1.y, p2.y) - effR,
          z: Math.min(p1.z, p2.z) - effR,
        },
        max: {
          x: Math.max(p1.x, p2.x) + effR,
          y: Math.max(p1.y, p2.y) + effR,
          z: Math.max(p1.z, p2.z) + effR,
        },
      };
    }

    case "plane": {
      // Infinite plane bounds approximated with broad bounds
      return {
        min: { x: -1e5, y: -1e5, z: -1e5 },
        max: { x: 1e5, y: 1e5, z: 1e5 },
      };
    }

    case "convex": {
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      if (shape.vertices instanceof Float32Array) {
        for (let i = 0; i < shape.vertices.length; i += 3) {
          const pt: Vector3 = {
            x: shape.vertices[i],
            y: shape.vertices[i + 1],
            z: shape.vertices[i + 2],
          };
          const wp = localToWorldPoint(worldTransform, pt);
          if (wp.x < minX) minX = wp.x;
          if (wp.y < minY) minY = wp.y;
          if (wp.z < minZ) minZ = wp.z;
          if (wp.x > maxX) maxX = wp.x;
          if (wp.y > maxY) maxY = wp.y;
          if (wp.z > maxZ) maxZ = wp.z;
        }
      } else {
        for (const pt of shape.vertices) {
          const wp = localToWorldPoint(worldTransform, pt);
          if (wp.x < minX) minX = wp.x;
          if (wp.y < minY) minY = wp.y;
          if (wp.z < minZ) minZ = wp.z;
          if (wp.x > maxX) maxX = wp.x;
          if (wp.y > maxY) maxY = wp.y;
          if (wp.z > maxZ) maxZ = wp.z;
        }
      }

      if (minX === Infinity) {
        return { min: vec3Clone(worldTransform.position), max: vec3Clone(worldTransform.position) };
      }

      return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
      };
    }

    case "heightfield": {
      const halfW = shape.width * 0.5 * Math.abs(worldTransform.scale.x);
      const halfL = shape.length * 0.5 * Math.abs(worldTransform.scale.z);
      const scaleY = worldTransform.scale.y;
      const minH = (scaleY >= 0 ? shape.minHeight : shape.maxHeight) * scaleY;
      const maxH = (scaleY >= 0 ? shape.maxHeight : shape.minHeight) * scaleY;

      return {
        min: {
          x: worldTransform.position.x - halfW,
          y: worldTransform.position.y + minH,
          z: worldTransform.position.z - halfL,
        },
        max: {
          x: worldTransform.position.x + halfW,
          y: worldTransform.position.y + maxH,
          z: worldTransform.position.z + halfL,
        },
      };
    }
  }
}

/**
 * Tests whether two colliders are eligible to collide based on layers and masks.
 */
export function canCollide(a: Collider3D, b: Collider3D): boolean {
  return (
    (a.collisionLayer & b.collisionMask) !== 0 &&
    (b.collisionLayer & a.collisionMask) !== 0
  );
}

export const canCollideCollider3D = canCollide;
export const canCollide3D = canCollide;

/**
 * Creates a fully validated 3D Collider instance.
 */
export function createCollider3D(
  shape: ColliderShape3D,
  options: Partial<Collider3D> = {}
): Collider3D {
  const offset = options.offset ? createTransform3D(options.offset.position, options.offset.rotation, options.offset.scale) : createTransform3D();
  const collider: Collider3D = {
    id: options.id || `col_${Math.random().toString(36).substring(2, 9)}`,
    shape,
    offset,
    isTrigger: options.isTrigger ?? false,
    collisionLayer: options.collisionLayer ?? 1,
    collisionMask: options.collisionMask ?? 0xffffffff,
    material: options.material,
    bodyId: options.bodyId,
    userData: options.userData,
    aabb: { min: vec3(0, 0, 0), max: vec3(0, 0, 0) },
  };

  collider.aabb = computeColliderAABB(collider);
  return collider;
}

/**
 * Creates a Heightfield collider shape.
 */
export function createHeightfieldShape(
  width: number,
  length: number,
  cols: number,
  rows: number,
  heights: Float32Array,
  minHeight: number,
  maxHeight: number
): HeightfieldColliderShape {
  return {
    type: "heightfield",
    width,
    length,
    cols,
    rows,
    heights,
    minHeight,
    maxHeight,
  };
}
