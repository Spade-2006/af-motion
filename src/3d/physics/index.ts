/**
 * AF Motion — 3D Physics Architecture
 *
 * Dedicated framework-independent 3D physics engine foundation for rigid bodies,
 * soft bodies, colliders, contact manifolds, constraints, and spatial queries.
 */

// Core Contracts & Types
export * from "./types.js";

// Mathematics & Spatial Transforms
export * from "./math.js";

// Physics Materials & Presets
export * from "./material.js";

// Rotational Inertia & Compound Mass
export * from "./body/inertia.js";

// Collision Shapes, Narrowphase & Continuous Collision Detection (CCD)
export * from "./collision/shapes.js";
export * from "./collision/narrowphase.js";
export * from "./collision/ccd.js";

// Spatial Queries & Broad-phase Acceleration
export * from "./spatial/spatial-hash.js";

// Physics Events & Observability
export * from "./events.js";

// Solvers & Numerical Integrators
export * from "./solver/types.js";
export * from "./solver/integrators.js";

// Advanced Constraints & Articulated Assemblies
export * from "./constraints/types.js";
export * from "./constraints/advanced.js";
export * from "./constraints/solver.js";

// Soft Bodies, PBD Engine, Cloth & Ropes
export * from "./soft/types.js";
export * from "./soft/pbd.js";
export * from "./soft/soft-body.js";
export * from "./soft/cloth.js";
export * from "./soft/rope.js";
export * from "./soft/collision.js";
export * from "./soft/gpu.js";

// 3D Physics World & Simulation Coordinator Adapter
export * from "./world.js";

// Performance & Stability Benchmarks
export * from "./benchmark.js";
