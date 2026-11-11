/**
 * AF Motion 3D Infrastructure Module
 *
 * Dedicated framework-independent 3D scene engine, camera, lighting,
 * environment, material intelligence, asset management, procedural geometry,
 * interactive environment engine, scroll-driven scenes, AI compositions,
 * 3D physics architecture, procedural terrain, procedural world generation,
 * and 3D model intelligence & optimization.
 */

export * from "./types.js";
export * from "./capabilities.js";
export * from "./adapter.js";
export * from "./scene.js";
export * from "./schema.js";
export * from "./r3f.js";
export * from "./schemas/index.js";
export * from "./camera/index.js";
export * from "./lighting/index.js";
export * from "./environment/index.js";
export * from "./materials/index.js";
export * from "./assets/index.js";
export * from "./geometry/index.js";
export * from "./interaction/index.js";
export * from "./scroll/index.js";
export * from "./composition/index.js";
export * from "./physics/index.js";
export * from "./terrain/index.js";
export * from "./world/index.js";
export * from "./optimization/index.js";
export * from "./morphing/index.js";

// Disambiguate top-level 3D types between scene schema tuples and physics objects
export type { Vector3, Quaternion, Transform3D } from "./schemas/index.js";
export type { Vector3Tuple } from "./types.js";
