/**
 * AF Motion — Automatic Performance Optimization Engine
 *
 * Framework-independent performance profiling, bottleneck detection,
 * strategy execution, memory/CPU/GPU/simulation optimizations, worker task manager,
 * and React integration.
 */

export * from "./types.js";
export * from "./profiler.js";
export * from "./bottlenecks.js";
export * from "./strategies.js";
export * from "./workers.js";
export * from "./optimizer.js";
// React hooks/components are exposed exclusively via af-motion/react (src/react.ts).
