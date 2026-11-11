/**
 * AF Motion — Memory & Resource Intelligence Engine
 *
 * Framework-independent resource lifecycle tracking, hierarchical scopes,
 * memory budgeting, intelligent caching, pooling safety, leak detection,
 * GPU resilience, and React integration.
 */

export * from "./types.js";
export * from "./registry.js";
export * from "./memory.js";
export * from "./cache.js";
export * from "./pooling.js";
export * from "./leaks.js";
export * from "./gpu.js";
export * from "./pressure.js";
export * from "./reports.js";
// React hooks/components are exposed exclusively via af-motion/react (src/react.ts).
