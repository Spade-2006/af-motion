/**
 * AF Motion — 3D Morphing & Cross-System Integration Module
 *
 * Dedicated framework-independent 3D morphing engine providing deterministic
 * geometry transitions, blend shapes, topology correspondence, procedural presets,
 * and animation lifecycle orchestration.
 */

export * from "./types.js";
export * from "./validation.js";
export * from "./geometry.js";
export * from "./topology.js";
export * from "./interpolation.js";
export * from "./correspondence.js";
export * from "./morph.js";
export * from "./animator.js";
export * from "./presets.js";
// React hooks (use3DMorph) are exposed exclusively via af-motion/react (src/react.ts).
