/**
 * AF Motion — 3D Morph Compatibility & Validation
 *
 * Diagnostics and compatibility analysis ensuring numerical stability,
 * topology consistency, and graceful fallback paths during 3D morphing.
 */

import type { GeometryBufferData } from "../geometry/types.js";
import type { Mesh3DData } from "../optimization/types.js";
import type { MorphCompatibilityReport } from "./types.js";

type AnyMesh = Mesh3DData | GeometryBufferData;

function getPositions(mesh: AnyMesh): Float32Array {
  return mesh.positions;
}

function getNormals(mesh: AnyMesh): Float32Array | undefined {
  return mesh.normals;
}

function getUvs(mesh: AnyMesh): Float32Array | undefined {
  return mesh.uvs;
}

function getIndices(mesh: AnyMesh): Uint16Array | Uint32Array | undefined {
  return mesh.indices;
}

/**
 * Checks for non-finite (NaN or Infinite) floating point numbers in buffer.
 */
function countNonFinite(buffer: Float32Array): number {
  let count = 0;
  for (let i = 0; i < buffer.length; i++) {
    if (!Number.isFinite(buffer[i])) {
      count++;
    }
  }
  return count;
}

/**
 * Analyzes compatibility between a base 3D geometry and a destination target.
 */
export function analyzeMorphCompatibility(
  base: AnyMesh,
  target: AnyMesh
): MorphCompatibilityReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const missingAttributes: string[] = [];

  const basePos = getPositions(base);
  const targetPos = getPositions(target);

  const baseVCount = Math.floor(basePos.length / 3);
  const targetVCount = Math.floor(targetPos.length / 3);
  const vertexCountMatch = baseVCount === targetVCount;

  // 1. Finite Coordinates Check
  const baseNonFinite = countNonFinite(basePos);
  if (baseNonFinite > 0) {
    errors.push(`Base geometry contains ${baseNonFinite} non-finite (NaN/Infinity) coordinate entries.`);
  }

  const targetNonFinite = countNonFinite(targetPos);
  if (targetNonFinite > 0) {
    errors.push(`Target geometry contains ${targetNonFinite} non-finite (NaN/Infinity) coordinate entries.`);
  }

  // 2. Vertex Count Check
  if (!vertexCountMatch) {
    warnings.push(
      `Vertex count mismatch: Base has ${baseVCount} vertices, Target has ${targetVCount} vertices. Resampling required.`
    );
  }

  // 3. Topology / Indices Check
  const baseIndices = getIndices(base);
  const targetIndices = getIndices(target);
  const hasIndices = !!(baseIndices && targetIndices);

  let topologyMatch = true;
  if (baseIndices && targetIndices) {
    if (baseIndices.length !== targetIndices.length) {
      topologyMatch = false;
      warnings.push(`Index count mismatch: Base has ${baseIndices.length} indices, Target has ${targetIndices.length}.`);
    }
  } else if ((baseIndices && !targetIndices) || (!baseIndices && targetIndices)) {
    topologyMatch = false;
    warnings.push("Indexed/Unindexed mismatch: One geometry uses index buffers while the other is an unindexed vertex stream.");
  }

  // 4. Normals & UVs
  const baseNorm = getNormals(base);
  const targetNorm = getNormals(target);
  const hasNormals = !!(baseNorm && targetNorm);

  if (baseNorm && !targetNorm) {
    missingAttributes.push("target.normals");
    warnings.push("Base has normals but Target lacks normals; normals will be automatically recalculated or blended.");
  } else if (!baseNorm && targetNorm) {
    missingAttributes.push("base.normals");
    warnings.push("Target has normals but Base lacks normals.");
  }

  const baseUv = getUvs(base);
  const targetUv = getUvs(target);
  const hasUVs = !!(baseUv && targetUv);

  if (baseUv && !targetUv) {
    missingAttributes.push("target.uvs");
    warnings.push("Base has UV coordinates but Target does not.");
  }

  const baseCol = "colors" in base ? (base.colors as Float32Array | undefined) : undefined;
  const targetCol = "colors" in target ? (target.colors as Float32Array | undefined) : undefined;
  const hasColors = !!(baseCol && targetCol);

  // Can resample if both have positions with at least 3 vertices
  const canResample = baseVCount >= 3 && targetVCount >= 3;
  const isCompatible = errors.length === 0 && (vertexCountMatch || canResample);

  return {
    isCompatible,
    canResample,
    vertexCountMatch,
    baseVertexCount: baseVCount,
    targetVertexCount: targetVCount,
    topologyMatch,
    hasIndices,
    hasNormals,
    hasUVs,
    hasColors,
    missingAttributes,
    warnings,
    errors,
  };
}

/**
 * Validates multiple morph targets against a base geometry.
 */
export function validateMorphTargets(
  base: AnyMesh,
  targets: AnyMesh[]
): MorphCompatibilityReport {
  if (targets.length === 0) {
    return {
      isCompatible: true,
      canResample: true,
      vertexCountMatch: true,
      baseVertexCount: Math.floor(base.positions.length / 3),
      targetVertexCount: Math.floor(base.positions.length / 3),
      topologyMatch: true,
      hasIndices: !!base.indices,
      hasNormals: !!base.normals,
      hasUVs: !!base.uvs,
      hasColors: false,
      missingAttributes: [],
      warnings: ["No morph targets provided; base geometry will evaluate as static."],
      errors: [],
    };
  }

  let aggregatedReport: MorphCompatibilityReport = {
    isCompatible: true,
    canResample: true,
    vertexCountMatch: true,
    baseVertexCount: Math.floor(base.positions.length / 3),
    targetVertexCount: 0,
    topologyMatch: true,
    hasIndices: true,
    hasNormals: true,
    hasUVs: true,
    hasColors: true,
    missingAttributes: [],
    warnings: [],
    errors: [],
  };

  for (let i = 0; i < targets.length; i++) {
    const report = analyzeMorphCompatibility(base, targets[i]);
    if (!report.isCompatible) aggregatedReport.isCompatible = false;
    if (!report.vertexCountMatch) aggregatedReport.vertexCountMatch = false;
    if (!report.topologyMatch) aggregatedReport.topologyMatch = false;
    if (!report.hasIndices) aggregatedReport.hasIndices = false;
    if (!report.hasNormals) aggregatedReport.hasNormals = false;
    if (!report.hasUVs) aggregatedReport.hasUVs = false;
    if (!report.hasColors) aggregatedReport.hasColors = false;

    for (const w of report.warnings) {
      aggregatedReport.warnings.push(`Target [${i}]: ${w}`);
    }
    for (const e of report.errors) {
      aggregatedReport.errors.push(`Target [${i}]: ${e}`);
    }
    for (const m of report.missingAttributes) {
      if (!aggregatedReport.missingAttributes.includes(m)) {
        aggregatedReport.missingAttributes.push(m);
      }
    }
  }

  return aggregatedReport;
}
