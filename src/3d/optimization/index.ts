/**
 * AF Motion — 3D Model Intelligence & Optimization Module
 *
 * Dedicated framework-independent 3D model analysis, geometry optimization,
 * LOD generation, material/texture intelligence, hierarchy collapsing,
 * skeletal inspection, and automatic physics collider generation.
 */

export * from "./types.js";
export * from "./analysis.js";
export * from "./geometry.js";
export * from "./lod.js";
export * from "./materials.js";
export * from "./hierarchy.js";
export * from "./skeleton.js";
export * from "./colliders.js";
export * from "./recommendations.js";

import type { ModelAnalysisReport } from "./types.js";
import { analyzeModel3D } from "./analysis.js";

/**
 * Validates a 3D model for runtime rendering integrity, checking for non-finite vertices,
 * empty meshes, or severe degenerate anomalies.
 */
export function validateModel3D(
  model: unknown
): {
  valid: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  issues: string[];
  report: ModelAnalysisReport;
} {
  const report = analyzeModel3D(model);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (report.diagnostics.nonFiniteVertexCount > 0) {
    errors.push(`Model contains ${report.diagnostics.nonFiniteVertexCount} NaN or Infinite vertex coordinates.`);
  }

  if (report.vertexCount === 0) {
    errors.push("Model contains zero vertices.");
  }

  if (report.diagnostics.degenerateTriangles > 0) {
    warnings.push(`Model contains ${report.diagnostics.degenerateTriangles} degenerate triangles.`);
  }

  if (report.diagnostics.unindexedMeshCount > 0) {
    warnings.push(`Model contains ${report.diagnostics.unindexedMeshCount} unindexed meshes.`);
  }

  if (report.textureMetrics.nonPowerOfTwoCount > 0) {
    warnings.push(`Model references ${report.textureMetrics.nonPowerOfTwoCount} non-power-of-two textures.`);
  }

  const isValid = errors.length === 0;
  const issues = [...errors, ...warnings];

  return {
    valid: isValid,
    isValid,
    errors,
    warnings,
    issues,
    report,
  };
}

/**
 * Cleanly releases any cached data or intermediate buffers created during analysis.
 */
export function disposeModelAnalysis(_report?: ModelAnalysisReport): void {
  // Stateless analysis - hook provided for memory manager consistency
}
