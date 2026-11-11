/**
 * AF Motion — Collision Detection Engine
 *
 * Implements 2D & 3D narrow-phase collision algorithms, point containment tests,
 * AABB bounding calculations, and broad-phase spatial filtering.
 */

import type {
  PhysicsVector,
  PhysicsValue,
} from "./types.js";
import type {
  CollisionBody,
  CollisionContact,
  AABB,
  CircleShape,
  RectangleShape,
  SphereShape,
  BoxShape,
} from "./collision-types.js";
import {
  createVector,
  magnitude,
  subVectors,
  addVectors,
  scaleVector,
  dot,
} from "./math.js";

/**
 * Tests if a point lies within a 2D circle.
 */
export function pointInCircle(
  point: PhysicsVector,
  center: PhysicsVector,
  radius: number
): boolean {
  const dx = point.x - center.x;
  const dy = (point.y ?? 0) - (center.y ?? 0);
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Tests if a point lies within an axis-aligned 2D rectangle.
 */
export function pointInRectangle(
  point: PhysicsVector,
  center: PhysicsVector,
  width: number,
  height: number
): boolean {
  const hx = width / 2;
  const hy = height / 2;
  const dx = Math.abs(point.x - center.x);
  const dy = Math.abs((point.y ?? 0) - (center.y ?? 0));
  return dx <= hx && dy <= hy;
}

/**
 * Tests if a point lies within a 3D sphere.
 */
export function pointInSphere(
  point: PhysicsVector,
  center: PhysicsVector,
  radius: number
): boolean {
  const dx = point.x - center.x;
  const dy = (point.y ?? 0) - (center.y ?? 0);
  const dz = (point.z ?? 0) - (center.z ?? 0);
  return dx * dx + dy * dy + dz * dz <= radius * radius;
}

/**
 * Tests if a point lies within a 3D axis-aligned bounding box.
 */
export function pointInBox(
  point: PhysicsVector,
  center: PhysicsVector,
  sizeX: number,
  sizeY: number,
  sizeZ: number
): boolean {
  const hx = sizeX / 2;
  const hy = sizeY / 2;
  const hz = sizeZ / 2;
  const dx = Math.abs(point.x - center.x);
  const dy = Math.abs((point.y ?? 0) - (center.y ?? 0));
  const dz = Math.abs((point.z ?? 0) - (center.z ?? 0));
  return dx <= hx && dy <= hy && dz <= hz;
}

/**
 * Computes an axis-aligned bounding box (AABB) enclosing a collision body.
 */
export function computeBodyAABB(body: CollisionBody): AABB {
  const p = body.position;
  const shape = body.shape;

  switch (shape.type) {
    case "circle": {
      const r = shape.radius;
      return {
        min: createVector(p.x - r, (p.y ?? 0) - r),
        max: createVector(p.x + r, (p.y ?? 0) + r),
      };
    }
    case "rectangle": {
      const hx = shape.width / 2;
      const hy = shape.height / 2;
      return {
        min: createVector(p.x - hx, (p.y ?? 0) - hy),
        max: createVector(p.x + hx, (p.y ?? 0) + hy),
      };
    }
    case "sphere": {
      const r = shape.radius;
      return {
        min: createVector(p.x - r, (p.y ?? 0) - r, (p.z ?? 0) - r),
        max: createVector(p.x + r, (p.y ?? 0) + r, (p.z ?? 0) + r),
      };
    }
    case "box": {
      const hx = shape.sizeX / 2;
      const hy = shape.sizeY / 2;
      const hz = shape.sizeZ / 2;
      return {
        min: createVector(p.x - hx, (p.y ?? 0) - hy, (p.z ?? 0) - hz),
        max: createVector(p.x + hx, (p.y ?? 0) + hy, (p.z ?? 0) + hz),
      };
    }
  }
}

/**
 * Checks whether two axis-aligned bounding boxes overlap in all dimensions.
 */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  if (a.max.x < b.min.x || a.min.x > b.max.x) return false;

  if (a.max.y !== undefined || b.max.y !== undefined) {
    const aMinY = a.min.y ?? 0;
    const aMaxY = a.max.y ?? 0;
    const bMinY = b.min.y ?? 0;
    const bMaxY = b.max.y ?? 0;
    if (aMaxY < bMinY || aMinY > bMaxY) return false;
  }

  if (a.max.z !== undefined || b.max.z !== undefined) {
    const aMinZ = a.min.z ?? 0;
    const aMaxZ = a.max.z ?? 0;
    const bMinZ = b.min.z ?? 0;
    const bMaxZ = b.max.z ?? 0;
    if (aMaxZ < bMinZ || aMinZ > bMaxZ) return false;
  }

  return true;
}

/**
 * Determines whether two bodies pass broad-phase collision layer/mask filtering.
 */
export function canCollide(bodyA: CollisionBody, bodyB: CollisionBody): boolean {
  // If both are static, they never collide
  if (bodyA.type === "static" && bodyB.type === "static") return false;
  // Bitmask layer and mask checks
  return (bodyA.mask & bodyB.layer) !== 0 && (bodyB.mask & bodyA.layer) !== 0;
}

/**
 * 2D Circle-to-Circle collision intersection test.
 */
export function intersectCircleCircle(
  posA: PhysicsVector,
  radiusA: number,
  posB: PhysicsVector,
  radiusB: number
): {
  collided: boolean;
  contactPoint: PhysicsVector;
  normal: PhysicsVector;
  penetration: number;
} {
  const dx = posB.x - posA.x;
  const dy = (posB.y ?? 0) - (posA.y ?? 0);
  const distSq = dx * dx + dy * dy;
  const radiusSum = radiusA + radiusB;

  if (distSq > radiusSum * radiusSum) {
    return {
      collided: false,
      contactPoint: createVector(0, 0),
      normal: createVector(0, 0),
      penetration: 0,
    };
  }

  const dist = Math.sqrt(distSq);

  if (dist < 1e-6) {
    // Concentric circles: separate arbitrarily along positive X
    return {
      collided: true,
      contactPoint: createVector(posA.x, posA.y ?? 0),
      normal: createVector(1, 0),
      penetration: radiusSum,
    };
  }

  // Normal points from body A to body B
  const nx = dx / dist;
  const ny = dy / dist;
  const penetration = radiusSum - dist;
  const contactPoint = createVector(
    posA.x + nx * (radiusA - penetration * 0.5),
    (posA.y ?? 0) + ny * (radiusA - penetration * 0.5)
  );

  return {
    collided: true,
    contactPoint,
    normal: createVector(nx, ny),
    penetration,
  };
}

/**
 * 2D Rectangle-to-Rectangle (AABB) collision intersection test.
 */
export function intersectRectangleRectangle(
  posA: PhysicsVector,
  widthA: number,
  heightA: number,
  posB: PhysicsVector,
  widthB: number,
  heightB: number
): {
  collided: boolean;
  contactPoint: PhysicsVector;
  normal: PhysicsVector;
  penetration: number;
} {
  const dx = posB.x - posA.x;
  const dy = (posB.y ?? 0) - (posA.y ?? 0);

  const halfWidthSum = (widthA + widthB) / 2;
  const halfHeightSum = (heightA + heightB) / 2;

  const overlapX = halfWidthSum - Math.abs(dx);
  const overlapY = halfHeightSum - Math.abs(dy);

  if (overlapX <= 0 || overlapY <= 0) {
    return {
      collided: false,
      contactPoint: createVector(0, 0),
      normal: createVector(0, 0),
      penetration: 0,
    };
  }

  // Resolve along axis of least penetration
  let nx = 0;
  let ny = 0;
  let penetration = 0;

  if (overlapX < overlapY) {
    nx = dx >= 0 ? 1 : -1;
    ny = 0;
    penetration = overlapX;
  } else {
    nx = 0;
    ny = dy >= 0 ? 1 : -1;
    penetration = overlapY;
  }

  const contactPoint = createVector(
    posA.x + (dx * 0.5),
    (posA.y ?? 0) + (dy * 0.5)
  );

  return {
    collided: true,
    contactPoint,
    normal: createVector(nx, ny),
    penetration,
  };
}

/**
 * 2D Circle-to-Rectangle collision intersection test.
 */
export function intersectCircleRectangle(
  posCircle: PhysicsVector,
  radius: number,
  posRect: PhysicsVector,
  width: number,
  height: number,
  circleIsA: boolean
): {
  collided: boolean;
  contactPoint: PhysicsVector;
  normal: PhysicsVector;
  penetration: number;
} {
  const cx = posCircle.x;
  const cy = posCircle.y ?? 0;
  const rx = posRect.x;
  const ry = posRect.y ?? 0;

  const hx = width / 2;
  const hy = height / 2;

  // Clamp circle center to rectangle bounds to find closest point
  const closestX = Math.min(Math.max(cx, rx - hx), rx + hx);
  const closestY = Math.min(Math.max(cy, ry - hy), ry + hy);

  let dx = cx - closestX;
  let dy = cy - closestY;
  let distSq = dx * dx + dy * dy;

  // Check if circle center is inside the rectangle
  if (distSq === 0) {
    // Circle center is inside rectangle: compute smallest distance to edge
    const distToLeft = cx - (rx - hx);
    const distToRight = (rx + hx) - cx;
    const distToBottom = cy - (ry - hy);
    const distToTop = (ry + hy) - cy;

    const minDist = Math.min(distToLeft, distToRight, distToBottom, distToTop);

    let nx = 0;
    let ny = 0;
    if (minDist === distToLeft) nx = -1;
    else if (minDist === distToRight) nx = 1;
    else if (minDist === distToBottom) ny = -1;
    else ny = 1;

    const penetration = radius + minDist;
    const contactPoint = createVector(closestX, closestY);

    // If circle is body A, normal points from circle (A) to rect (B)
    const finalNormal = circleIsA
      ? createVector(-nx, -ny)
      : createVector(nx, ny);

    return {
      collided: true,
      contactPoint,
      normal: finalNormal,
      penetration,
    };
  }

  if (distSq > radius * radius) {
    return {
      collided: false,
      contactPoint: createVector(0, 0),
      normal: createVector(0, 0),
      penetration: 0,
    };
  }

  const dist = Math.sqrt(distSq);
  // Vector pointing from closest point on rect toward circle center
  let nx = dx / dist;
  let ny = dy / dist;
  const penetration = radius - dist;
  const contactPoint = createVector(closestX, closestY);

  // If circle is body A, normal should point from A (circle) to B (rect)
  const finalNormal = circleIsA
    ? createVector(-nx, -ny)
    : createVector(nx, ny);

  return {
    collided: true,
    contactPoint,
    normal: finalNormal,
    penetration,
  };
}

/**
 * 3D Sphere-to-Sphere collision intersection test.
 */
export function intersectSphereSphere(
  posA: PhysicsVector,
  radiusA: number,
  posB: PhysicsVector,
  radiusB: number
): {
  collided: boolean;
  contactPoint: PhysicsVector;
  normal: PhysicsVector;
  penetration: number;
} {
  const dx = posB.x - posA.x;
  const dy = (posB.y ?? 0) - (posA.y ?? 0);
  const dz = (posB.z ?? 0) - (posA.z ?? 0);
  const distSq = dx * dx + dy * dy + dz * dz;
  const radiusSum = radiusA + radiusB;

  if (distSq > radiusSum * radiusSum) {
    return {
      collided: false,
      contactPoint: createVector(0, 0, 0),
      normal: createVector(0, 0, 0),
      penetration: 0,
    };
  }

  const dist = Math.sqrt(distSq);

  if (dist < 1e-6) {
    return {
      collided: true,
      contactPoint: createVector(posA.x, posA.y ?? 0, posA.z ?? 0),
      normal: createVector(1, 0, 0),
      penetration: radiusSum,
    };
  }

  const nx = dx / dist;
  const ny = dy / dist;
  const nz = dz / dist;
  const penetration = radiusSum - dist;
  const contactPoint = createVector(
    posA.x + nx * (radiusA - penetration * 0.5),
    (posA.y ?? 0) + ny * (radiusA - penetration * 0.5),
    (posA.z ?? 0) + nz * (radiusA - penetration * 0.5)
  );

  return {
    collided: true,
    contactPoint,
    normal: createVector(nx, ny, nz),
    penetration,
  };
}

/**
 * 3D Box-to-Box (AABB) collision intersection test.
 */
export function intersectBoxBox(
  posA: PhysicsVector,
  sizeA: { sizeX: number; sizeY: number; sizeZ: number },
  posB: PhysicsVector,
  sizeB: { sizeX: number; sizeY: number; sizeZ: number }
): {
  collided: boolean;
  contactPoint: PhysicsVector;
  normal: PhysicsVector;
  penetration: number;
} {
  const dx = posB.x - posA.x;
  const dy = (posB.y ?? 0) - (posA.y ?? 0);
  const dz = (posB.z ?? 0) - (posA.z ?? 0);

  const halfXSum = (sizeA.sizeX + sizeB.sizeX) / 2;
  const halfYSum = (sizeA.sizeY + sizeB.sizeY) / 2;
  const halfZSum = (sizeA.sizeZ + sizeB.sizeZ) / 2;

  const overlapX = halfXSum - Math.abs(dx);
  const overlapY = halfYSum - Math.abs(dy);
  const overlapZ = halfZSum - Math.abs(dz);

  if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) {
    return {
      collided: false,
      contactPoint: createVector(0, 0, 0),
      normal: createVector(0, 0, 0),
      penetration: 0,
    };
  }

  // Find axis of minimum penetration
  let nx = 0;
  let ny = 0;
  let nz = 0;
  let penetration = 0;

  if (overlapX <= overlapY && overlapX <= overlapZ) {
    nx = dx >= 0 ? 1 : -1;
    penetration = overlapX;
  } else if (overlapY <= overlapX && overlapY <= overlapZ) {
    ny = dy >= 0 ? 1 : -1;
    penetration = overlapY;
  } else {
    nz = dz >= 0 ? 1 : -1;
    penetration = overlapZ;
  }

  const contactPoint = createVector(
    posA.x + dx * 0.5,
    (posA.y ?? 0) + dy * 0.5,
    (posA.z ?? 0) + dz * 0.5
  );

  return {
    collided: true,
    contactPoint,
    normal: createVector(nx, ny, nz),
    penetration,
  };
}

/**
 * Performs narrow-phase collision detection between two arbitrary rigid bodies.
 */
export function detectBodyCollision(
  bodyA: CollisionBody,
  bodyB: CollisionBody
): CollisionContact | null {
  if (!canCollide(bodyA, bodyB)) return null;

  const shapeA = bodyA.shape;
  const shapeB = bodyB.shape;

  let result: {
    collided: boolean;
    contactPoint: PhysicsVector;
    normal: PhysicsVector;
    penetration: number;
  };

  // 1. Circle - Circle
  if (shapeA.type === "circle" && shapeB.type === "circle") {
    result = intersectCircleCircle(
      bodyA.position,
      shapeA.radius,
      bodyB.position,
      shapeB.radius
    );
  }
  // 2. Rectangle - Rectangle
  else if (shapeA.type === "rectangle" && shapeB.type === "rectangle") {
    result = intersectRectangleRectangle(
      bodyA.position,
      shapeA.width,
      shapeA.height,
      bodyB.position,
      shapeB.width,
      shapeB.height
    );
  }
  // 3. Circle - Rectangle
  else if (shapeA.type === "circle" && shapeB.type === "rectangle") {
    result = intersectCircleRectangle(
      bodyA.position,
      shapeA.radius,
      bodyB.position,
      shapeB.width,
      shapeB.height,
      true
    );
  }
  // 4. Rectangle - Circle
  else if (shapeA.type === "rectangle" && shapeB.type === "circle") {
    const res = intersectCircleRectangle(
      bodyB.position,
      shapeB.radius,
      bodyA.position,
      shapeA.width,
      shapeA.height,
      false
    );
    // Invert normal so it points from bodyA to bodyB
    result = {
      collided: res.collided,
      contactPoint: res.contactPoint,
      normal: scaleVector(res.normal, -1),
      penetration: res.penetration,
    };
  }
  // 5. Sphere - Sphere
  else if (shapeA.type === "sphere" && shapeB.type === "sphere") {
    result = intersectSphereSphere(
      bodyA.position,
      shapeA.radius,
      bodyB.position,
      shapeB.radius
    );
  }
  // 6. Box - Box
  else if (shapeA.type === "box" && shapeB.type === "box") {
    result = intersectBoxBox(
      bodyA.position,
      shapeA,
      bodyB.position,
      shapeB
    );
  } else {
    // Unsupported mixed 2D/3D shape combination
    return null;
  }

  if (!result.collided) return null;

  return {
    collided: true,
    bodyA,
    bodyB,
    contactPoint: result.contactPoint,
    normal: result.normal,
    penetration: result.penetration,
  };
}
