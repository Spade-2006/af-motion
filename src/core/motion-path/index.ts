/**
 * AF Motion Path Subsystem
 *
 * Framework-independent motion path engine for 2D and 3D paths, path sampling,
 * uniform arc-length parameterization, orientation calculation, path followers,
 * and element/callback path animation.
 */

export * from "./types.js";
export {
  toPoint3D,
  createPoint3D,
  clonePoint3D,
  angle2D,
  radians2D,
  normal2D,
  eulerFromTangent,
  computeOrientationFrame,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Lerp,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3LengthSq,
  vec3Distance,
  vec3DistanceSq,
  vec3Normalize,
} from "./vector3.js";
export * from "./segments.js";
export * from "./lut.js";
export * from "./parser.js";
export * from "./engine.js";
export * from "./follower.js";
export * from "./animator.js";
