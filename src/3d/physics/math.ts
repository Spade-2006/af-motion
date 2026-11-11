/**
 * AF Motion — 3D Physics Mathematics & Spatial Transformations
 *
 * Framework-independent vector, quaternion, matrix, and transform operations.
 * Designed with numerical precision safeguards, singularity protection, and zero runtime dependencies.
 */

import type {
  Vector3,
  Vector3Tuple,
  Quaternion,
  QuaternionTuple,
  Transform3D,
  Matrix3,
  Matrix4,
  AABB3D,
} from "./types.js";

// ============================================================================
// Numerical Stability & Safeguards
// ============================================================================

export const EPSILON = 1e-6;

export function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

export function isFiniteVector3(v: unknown): v is Vector3 {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isFiniteNumber(o.x) && isFiniteNumber(o.y) && isFiniteNumber(o.z);
}

export function isFiniteQuaternion(q: unknown): q is Quaternion {
  if (!q || typeof q !== "object") return false;
  const o = q as Record<string, unknown>;
  return (
    isFiniteNumber(o.x) &&
    isFiniteNumber(o.y) &&
    isFiniteNumber(o.z) &&
    isFiniteNumber(o.w)
  );
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function roundPrecision(val: number, precision: number = 1e-5): number {
  return Math.abs(val) <= precision ? 0 : val;
}

// ============================================================================
// Vector3 Operations
// ============================================================================

export function vec3(x: number = 0, y: number = 0, z: number = 0): Vector3 {
  return { x, y, z };
}

export function vec3Clone(v: Vector3): Vector3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function vec3ToTuple(v: Vector3): Vector3Tuple {
  return [v.x, v.y, v.z];
}

export function tupleToVec3(t: Vector3Tuple): Vector3 {
  return { x: t[0], y: t[1], z: t[2] };
}

export function vec3Add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vec3Sub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vec3Scale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vec3Dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vec3Cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vec3LengthSq(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

export function vec3Length(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vec3Normalize(v: Vector3): Vector3 {
  const len = vec3Length(v);
  if (len < EPSILON) return { x: 0, y: 0, z: 0 };
  const inv = 1 / len;
  return { x: v.x * inv, y: v.y * inv, z: v.z * inv };
}

export function vec3SafeNormalize(
  v: Vector3,
  fallback: Vector3 = { x: 0, y: 1, z: 0 }
): Vector3 {
  const len = vec3Length(v);
  if (len < EPSILON) return vec3Clone(fallback);
  const inv = 1 / len;
  return { x: v.x * inv, y: v.y * inv, z: v.z * inv };
}

export function vec3DistanceSq(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function vec3Distance(a: Vector3, b: Vector3): number {
  return Math.sqrt(vec3DistanceSq(a, b));
}

export function vec3Lerp(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function vec3Min(a: Vector3, b: Vector3): Vector3 {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    z: Math.min(a.z, b.z),
  };
}

export function vec3Max(a: Vector3, b: Vector3): Vector3 {
  return {
    x: Math.max(a.x, b.x),
    y: Math.max(a.y, b.y),
    z: Math.max(a.z, b.z),
  };
}

export function vec3Equals(a: Vector3, b: Vector3, epsilon: number = EPSILON): boolean {
  return (
    Math.abs(a.x - b.x) <= epsilon &&
    Math.abs(a.y - b.y) <= epsilon &&
    Math.abs(a.z - b.z) <= epsilon
  );
}

// ============================================================================
// Quaternion Operations
// ============================================================================

export function quat(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Quaternion {
  return { x, y, z, w };
}

export function quatIdentity(): Quaternion {
  return { x: 0, y: 0, z: 0, w: 1 };
}

export function quatClone(q: Quaternion): Quaternion {
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

export function quatLengthSq(q: Quaternion): number {
  return q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
}

export function quatLength(q: Quaternion): number {
  return Math.sqrt(quatLengthSq(q));
}

export function quatNormalize(q: Quaternion): Quaternion {
  const len = quatLength(q);
  if (len < EPSILON) return quatIdentity();
  const inv = 1 / len;
  return { x: q.x * inv, y: q.y * inv, z: q.z * inv, w: q.w * inv };
}

export function quatSafeNormalize(
  q: Quaternion,
  fallback: Quaternion = quatIdentity()
): Quaternion {
  const len = quatLength(q);
  if (len < EPSILON) return quatClone(fallback);
  const inv = 1 / len;
  return { x: q.x * inv, y: q.y * inv, z: q.z * inv, w: q.w * inv };
}

export function quatMultiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

export function quatConjugate(q: Quaternion): Quaternion {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

export function quatInverse(q: Quaternion): Quaternion {
  const lenSq = quatLengthSq(q);
  if (lenSq < EPSILON) return quatIdentity();
  const inv = 1 / lenSq;
  return { x: -q.x * inv, y: -q.y * inv, z: -q.z * inv, w: q.w * inv };
}

export function quatDot(a: Quaternion, b: Quaternion): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

export function quatRotateVector(q: Quaternion, v: Vector3): Vector3 {
  // v' = q * (0, v) * q^-1
  const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
  const ix = qw * v.x + qy * v.z - qz * v.y;
  const iy = qw * v.y + qz * v.x - qx * v.z;
  const iz = qw * v.z + qx * v.y - qy * v.x;
  const iw = -qx * v.x - qy * v.y - qz * v.z;

  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}

export function vec3TransformQuat(v: Vector3, q: Quaternion): Vector3 {
  return quatRotateVector(q, v);
}

export function quatFromAxisAngle(axis: Vector3, angle: number): Quaternion {
  const normAxis = vec3SafeNormalize(axis, { x: 0, y: 1, z: 0 });
  const halfAngle = angle * 0.5;
  const s = Math.sin(halfAngle);
  return {
    x: normAxis.x * s,
    y: normAxis.y * s,
    z: normAxis.z * s,
    w: Math.cos(halfAngle),
  };
}

export function quatToAxisAngle(q: Quaternion): { axis: Vector3; angle: number } {
  const nq = quatNormalize(q);
  const angle = 2 * Math.acos(clamp(nq.w, -1, 1));
  const s = Math.sqrt(Math.max(0, 1 - nq.w * nq.w));
  if (s < EPSILON) {
    return { axis: { x: 1, y: 0, z: 0 }, angle: 0 };
  }
  return {
    axis: { x: nq.x / s, y: nq.y / s, z: nq.z / s },
    angle,
  };
}

export function quatFromEuler(
  x: number,
  y: number,
  z: number,
  order: "XYZ" | "YXZ" | "ZXY" = "XYZ"
): Quaternion {
  const c1 = Math.cos(x * 0.5);
  const c2 = Math.cos(y * 0.5);
  const c3 = Math.cos(z * 0.5);
  const s1 = Math.sin(x * 0.5);
  const s2 = Math.sin(y * 0.5);
  const s3 = Math.sin(z * 0.5);

  if (order === "XYZ") {
    return {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 + s1 * s2 * c3,
      w: c1 * c2 * c3 - s1 * s2 * s3,
    };
  } else if (order === "YXZ") {
    return {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 - s1 * s2 * c3,
      w: c1 * c2 * c3 + s1 * s2 * s3,
    };
  } else {
    // ZXY
    return {
      x: s1 * c2 * c3 - c1 * s2 * s3,
      y: c1 * s2 * c3 + s1 * c2 * s3,
      z: c1 * c2 * s3 + s1 * s2 * c3,
      w: c1 * c2 * c3 - s1 * s2 * s3,
    };
  }
}

export function quatToEuler(
  q: Quaternion,
  _order: "XYZ" = "XYZ"
): Vector3 {
  const nq = quatNormalize(q);
  const sinr_cosp = 2 * (nq.w * nq.x + nq.y * nq.z);
  const cosr_cosp = 1 - 2 * (nq.x * nq.x + nq.y * nq.y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  const sinp = 2 * (nq.w * nq.y - nq.z * nq.x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = (Math.sign(sinp) * Math.PI) / 2;
  } else {
    pitch = Math.asin(sinp);
  }

  const siny_cosp = 2 * (nq.w * nq.z + nq.x * nq.y);
  const cosy_cosp = 1 - 2 * (nq.y * nq.y + nq.z * nq.z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { x: roll, y: pitch, z: yaw };
}

export function quatSlerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
  let cosHalfTheta = quatDot(a, b);
  let bx = b.x, by = b.y, bz = b.z, bw = b.w;

  if (cosHalfTheta < 0) {
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
    cosHalfTheta = -cosHalfTheta;
  }

  if (cosHalfTheta >= 1.0 - EPSILON) {
    // Linear interpolation fallback for very close orientations
    return quatNormalize({
      x: a.x + t * (bx - a.x),
      y: a.y + t * (by - a.y),
      z: a.z + t * (bz - a.z),
      w: a.w + t * (bw - a.w),
    });
  }

  const halfTheta = Math.acos(cosHalfTheta);
  const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

  if (Math.abs(sinHalfTheta) < EPSILON) {
    return {
      x: (a.x + bx) * 0.5,
      y: (a.y + by) * 0.5,
      z: (a.z + bz) * 0.5,
      w: (a.w + bw) * 0.5,
    };
  }

  const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
  const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

  return {
    x: a.x * ratioA + bx * ratioB,
    y: a.y * ratioA + by * ratioB,
    z: a.z * ratioA + bz * ratioB,
    w: a.w * ratioA + bw * ratioB,
  };
}

export function quatEquals(a: Quaternion, b: Quaternion, epsilon: number = EPSILON): boolean {
  // Note: q and -q represent identical 3D rotations
  const d = Math.abs(quatDot(a, b));
  return Math.abs(d - 1.0) <= epsilon;
}

// ============================================================================
// Matrix3 Operations
// ============================================================================

export function mat3Identity(): Matrix3 {
  return [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1,
  ];
}

export function mat3Diagonal(x: number, y: number, z: number): Matrix3 {
  return [
    x, 0, 0,
    0, y, 0,
    0, 0, z,
  ];
}

export function mat3FromQuaternion(q: Quaternion): Matrix3 {
  const nq = quatNormalize(q);
  const x = nq.x, y = nq.y, z = nq.z, w = nq.w;
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2;
  const yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;

  return [
    1 - (yy + zz), xy - wz,        xz + wy,
    xy + wz,        1 - (xx + zz), yz - wx,
    xz - wy,        yz + wx,        1 - (xx + yy),
  ];
}

export function mat3Multiply(a: Matrix3, b: Matrix3): Matrix3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],

    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],

    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

export function mat3Transpose(m: Matrix3): Matrix3 {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8],
  ];
}

export function mat3Invert(m: Matrix3): Matrix3 {
  const a00 = m[0], a01 = m[1], a02 = m[2];
  const a10 = m[3], a11 = m[4], a12 = m[5];
  const a20 = m[6], a21 = m[7], a22 = m[8];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let det = a00 * b01 + a01 * b11 + a02 * b21;
  if (Math.abs(det) < EPSILON) return mat3Identity();
  det = 1.0 / det;

  return [
    b01 * det,
    (-a22 * a01 + a02 * a21) * det,
    (a12 * a01 - a02 * a11) * det,
    b11 * det,
    (a22 * a00 - a02 * a20) * det,
    (-a12 * a00 + a02 * a10) * det,
    b21 * det,
    (-a21 * a00 + a01 * a20) * det,
    (a11 * a00 - a01 * a10) * det,
  ];
}

export function mat3TransformVector(m: Matrix3, v: Vector3): Vector3 {
  return {
    x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
    y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
    z: m[6] * v.x + m[7] * v.y + m[8] * v.z,
  };
}

// ============================================================================
// Matrix4 Operations
// ============================================================================

export function mat4Identity(): Matrix4 {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
}

export function mat4Compose(
  position: Vector3,
  rotation: Quaternion,
  scale: Vector3 = { x: 1, y: 1, z: 1 }
): Matrix4 {
  const m3 = mat3FromQuaternion(rotation);
  const sx = scale.x, sy = scale.y, sz = scale.z;

  return [
    m3[0] * sx, m3[1] * sy, m3[2] * sz, position.x,
    m3[3] * sx, m3[4] * sy, m3[5] * sz, position.y,
    m3[6] * sx, m3[7] * sy, m3[8] * sz, position.z,
    0,          0,          0,          1,
  ];
}

export function vec3TransformMat4(v: Vector3, m: Matrix4): Vector3 {
  const w = m[12] * v.x + m[13] * v.y + m[14] * v.z + m[15];
  const invW = Math.abs(w) > EPSILON ? 1 / w : 1;
  return {
    x: (m[0] * v.x + m[1] * v.y + m[2] * v.z + m[3]) * invW,
    y: (m[4] * v.x + m[5] * v.y + m[6] * v.z + m[7]) * invW,
    z: (m[8] * v.x + m[9] * v.y + m[10] * v.z + m[11]) * invW,
  };
}

// ============================================================================
// Transform3D Operations
// ============================================================================

export function createTransform3D(
  position: Vector3 = { x: 0, y: 0, z: 0 },
  rotation: Quaternion = quatIdentity(),
  scale: Vector3 = { x: 1, y: 1, z: 1 }
): Transform3D {
  return {
    position: vec3Clone(position),
    rotation: quatClone(rotation),
    scale: vec3Clone(scale),
  };
}

export function cloneTransform3D(t: Transform3D): Transform3D {
  return createTransform3D(t.position, t.rotation, t.scale);
}

export function composeTransform3D(parent: Transform3D, child: Transform3D): Transform3D {
  // child position scaled and rotated by parent
  const rotatedScaledChildPos = quatRotateVector(
    parent.rotation,
    {
      x: child.position.x * parent.scale.x,
      y: child.position.y * parent.scale.y,
      z: child.position.z * parent.scale.z,
    }
  );

  return {
    position: vec3Add(parent.position, rotatedScaledChildPos),
    rotation: quatNormalize(quatMultiply(parent.rotation, child.rotation)),
    scale: {
      x: parent.scale.x * child.scale.x,
      y: parent.scale.y * child.scale.y,
      z: parent.scale.z * child.scale.z,
    },
  };
}

export function invertTransform3D(t: Transform3D): Transform3D {
  const invRot = quatConjugate(quatNormalize(t.rotation));
  const invScale: Vector3 = {
    x: Math.abs(t.scale.x) > EPSILON ? 1 / t.scale.x : 0,
    y: Math.abs(t.scale.y) > EPSILON ? 1 / t.scale.y : 0,
    z: Math.abs(t.scale.z) > EPSILON ? 1 / t.scale.z : 0,
  };
  const negPos = vec3Scale(t.position, -1);
  const invRotPos = quatRotateVector(invRot, negPos);

  return {
    position: {
      x: invRotPos.x * invScale.x,
      y: invRotPos.y * invScale.y,
      z: invRotPos.z * invScale.z,
    },
    rotation: invRot,
    scale: invScale,
  };
}

export function localToWorldPoint(transform: Transform3D, localPoint: Vector3): Vector3 {
  const scaled = {
    x: localPoint.x * transform.scale.x,
    y: localPoint.y * transform.scale.y,
    z: localPoint.z * transform.scale.z,
  };
  const rotated = quatRotateVector(transform.rotation, scaled);
  return vec3Add(transform.position, rotated);
}

export function worldToLocalPoint(transform: Transform3D, worldPoint: Vector3): Vector3 {
  const rel = vec3Sub(worldPoint, transform.position);
  const invRot = quatConjugate(quatNormalize(transform.rotation));
  const unrotated = quatRotateVector(invRot, rel);
  return {
    x: Math.abs(transform.scale.x) > EPSILON ? unrotated.x / transform.scale.x : unrotated.x,
    y: Math.abs(transform.scale.y) > EPSILON ? unrotated.y / transform.scale.y : unrotated.y,
    z: Math.abs(transform.scale.z) > EPSILON ? unrotated.z / transform.scale.z : unrotated.z,
  };
}

export function localToWorldVector(transform: Transform3D, localVec: Vector3): Vector3 {
  const scaled = {
    x: localVec.x * transform.scale.x,
    y: localVec.y * transform.scale.y,
    z: localVec.z * transform.scale.z,
  };
  return quatRotateVector(transform.rotation, scaled);
}

export function worldToLocalVector(transform: Transform3D, worldVec: Vector3): Vector3 {
  const invRot = quatConjugate(quatNormalize(transform.rotation));
  const unrotated = quatRotateVector(invRot, worldVec);
  return {
    x: Math.abs(transform.scale.x) > EPSILON ? unrotated.x / transform.scale.x : unrotated.x,
    y: Math.abs(transform.scale.y) > EPSILON ? unrotated.y / transform.scale.y : unrotated.y,
    z: Math.abs(transform.scale.z) > EPSILON ? unrotated.z / transform.scale.z : unrotated.z,
  };
}

// ============================================================================
// AABB3D Operations
// ============================================================================

export function createAABB3D(
  min: Vector3 = { x: -Infinity, y: -Infinity, z: -Infinity },
  max: Vector3 = { x: Infinity, y: Infinity, z: Infinity }
): AABB3D {
  return { min: vec3Clone(min), max: vec3Clone(max) };
}

export function aabb3DFromMinMax(min: Vector3, max: Vector3): AABB3D {
  return {
    min: {
      x: Math.min(min.x, max.x),
      y: Math.min(min.y, max.y),
      z: Math.min(min.z, max.z),
    },
    max: {
      x: Math.max(min.x, max.x),
      y: Math.max(min.y, max.y),
      z: Math.max(min.z, max.z),
    },
  };
}

export function aabb3DContainsPoint(aabb: AABB3D, p: Vector3): boolean {
  return (
    p.x >= aabb.min.x && p.x <= aabb.max.x &&
    p.y >= aabb.min.y && p.y <= aabb.max.y &&
    p.z >= aabb.min.z && p.z <= aabb.max.z
  );
}

export function aabb3DIntersects(a: AABB3D, b: AABB3D): boolean {
  return (
    a.min.x <= b.max.x && a.max.x >= b.min.x &&
    a.min.y <= b.max.y && a.max.y >= b.min.y &&
    a.min.z <= b.max.z && a.max.z >= b.min.z
  );
}

export function aabb3DUnion(a: AABB3D, b: AABB3D): AABB3D {
  return {
    min: vec3Min(a.min, b.min),
    max: vec3Max(a.max, b.max),
  };
}

export function aabb3DEncapsulatePoint(aabb: AABB3D, p: Vector3): AABB3D {
  return {
    min: vec3Min(aabb.min, p),
    max: vec3Max(aabb.max, p),
  };
}

export function aabb3DTransform(aabb: AABB3D, transform: Transform3D): AABB3D {
  const corners: Vector3[] = [
    { x: aabb.min.x, y: aabb.min.y, z: aabb.min.z },
    { x: aabb.min.x, y: aabb.min.y, z: aabb.max.z },
    { x: aabb.min.x, y: aabb.max.y, z: aabb.min.z },
    { x: aabb.min.x, y: aabb.max.y, z: aabb.max.z },
    { x: aabb.max.x, y: aabb.min.y, z: aabb.min.z },
    { x: aabb.max.x, y: aabb.min.y, z: aabb.max.z },
    { x: aabb.max.x, y: aabb.max.y, z: aabb.min.z },
    { x: aabb.max.x, y: aabb.max.y, z: aabb.max.z },
  ];

  let min = localToWorldPoint(transform, corners[0]);
  let max = vec3Clone(min);

  for (let i = 1; i < 8; i++) {
    const worldPoint = localToWorldPoint(transform, corners[i]);
    min = vec3Min(min, worldPoint);
    max = vec3Max(max, worldPoint);
  }

  return { min, max };
}
