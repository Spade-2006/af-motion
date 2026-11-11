/**
 * AF Motion — 3D Optimization Recommendation Intelligence
 *
 * Deterministic rule-based performance analysis matching model metrics against
 * device capability budgets (Mobile, Standard, High-End) with explainable actions.
 */

import type {
  ModelAnalysisReport,
  Model3DData,
  DeviceProfileTier,
  OptimizationRecommendations,
  OptimizationRecommendationItem,
} from "./types.js";
import { analyzeModel3D } from "./analysis.js";

interface DeviceBudget {
  maxTriangles: number;
  maxDrawCalls: number;
  maxTextureDim: number;
  maxVRAMBytes: number;
}

const TIER_BUDGETS: Record<DeviceProfileTier, DeviceBudget> = {
  mobile: {
    maxTriangles: 50000,
    maxDrawCalls: 30,
    maxTextureDim: 1024,
    maxVRAMBytes: 64 * 1024 * 1024, // 64 MB
  },
  standard: {
    maxTriangles: 250000,
    maxDrawCalls: 100,
    maxTextureDim: 2048,
    maxVRAMBytes: 256 * 1024 * 1024, // 256 MB
  },
  "high-end": {
    maxTriangles: 1000000,
    maxDrawCalls: 400,
    maxTextureDim: 4096,
    maxVRAMBytes: 1024 * 1024 * 1024, // 1 GB
  },
};

/**
 * Evaluates a model analysis report and generates structured, deterministic optimization recommendations.
 */
export function recommendModelOptimizations(
  reportOrModel: ModelAnalysisReport | Model3DData,
  tierOrOptions: DeviceProfileTier | { targetDeviceTier?: DeviceProfileTier } = "standard"
): OptimizationRecommendations {
  let report: ModelAnalysisReport;
  if ("diagnostics" in reportOrModel && reportOrModel.diagnostics) {
    report = reportOrModel as ModelAnalysisReport;
  } else {
    report = analyzeModel3D(reportOrModel);
  }

  const tier: DeviceProfileTier =
    typeof tierOrOptions === "string"
      ? tierOrOptions
      : tierOrOptions?.targetDeviceTier ?? "standard";

  const budget = TIER_BUDGETS[tier];
  const items: OptimizationRecommendationItem[] = [];
  let scoreDeductions = 0;

  // 1. Degenerate Triangles Check
  if (report.diagnostics.degenerateTriangles > 0) {
    items.push({
      category: "geometry",
      severity: "warning",
      message: `Model contains ${report.diagnostics.degenerateTriangles} zero-area or collinear degenerate triangles.`,
      expectedImpact: "Eliminates rasterization artifacts and reduces index buffer size.",
      action: "Run optimizeGeometry3D with removeDegenerateTriangles: true.",
    });
    scoreDeductions += Math.min(15, report.diagnostics.degenerateTriangles);
  }

  // 2. Vertex Deduplication Check
  if (report.diagnostics.duplicateVertexCount > 0) {
    const savings = ((report.diagnostics.duplicateVertexCount / Math.max(1, report.vertexCount)) * 100).toFixed(1);
    items.push({
      category: "geometry",
      severity: "info",
      message: `Found ${report.diagnostics.duplicateVertexCount} redundant duplicate vertices (${savings}% of geometry).`,
      expectedImpact: "Reduces vertex shader invocations and shrinks buffer memory.",
      action: "Run optimizeGeometry3D with deduplicateVertices: true.",
    });
    scoreDeductions += 10;
  }

  // 3. Triangle Budget & LOD Check
  if (report.triangleCount > budget.maxTriangles) {
    items.push({
      category: "lod",
      severity: "critical",
      message: `Triangle count (${report.triangleCount.toLocaleString()}) exceeds ${tier} budget (${budget.maxTriangles.toLocaleString()}).`,
      expectedImpact: "Prevents vertex bottleneck and maintains 60fps on target hardware.",
      action: "Generate 3 LOD levels with generateModelLODs(mesh, { levels: [...] }).",
    });
    scoreDeductions += 25;
  } else if (report.triangleCount > 5000) {
    items.push({
      category: "lod",
      severity: "info",
      message: `Model has ${report.triangleCount.toLocaleString()} triangles; distant rendering will benefit from LODs.`,
      expectedImpact: "Saves GPU rasterization when viewed from a distance.",
      action: "Generate LODs using generateModelLODs().",
    });
  }

  // 4. Texture Dimensions Check
  if (report.textureMetrics.maxDimension > budget.maxTextureDim) {
    items.push({
      category: "textures",
      severity: "warning",
      message: `Maximum texture dimension (${report.textureMetrics.maxDimension}px) exceeds ${tier} target (${budget.maxTextureDim}px).`,
      expectedImpact: "Avoids memory pressure and texture cache trashing.",
      action: `Downsample textures to ${budget.maxTextureDim}x${budget.maxTextureDim} or use KTX2/Basis Universal.`,
    });
    scoreDeductions += 15;
  }

  // 5. Non-Power-of-Two Textures
  if (report.textureMetrics.nonPowerOfTwoCount > 0) {
    items.push({
      category: "textures",
      severity: "info",
      message: `${report.textureMetrics.nonPowerOfTwoCount} textures have non-power-of-two dimensions.`,
      expectedImpact: "Enables hardware mipmapping, anisotropic filtering, and texture compression.",
      action: "Resize textures to nearest power of two (e.g. 512, 1024, 2048).",
    });
    scoreDeductions += 5;
  }

  // 6. Draw Call / Mesh Count Check
  if (report.drawCallEstimate > budget.maxDrawCalls) {
    items.push({
      category: "hierarchy",
      severity: "warning",
      message: `Estimated draw calls (${report.drawCallEstimate}) exceed recommended target (${budget.maxDrawCalls}).`,
      expectedImpact: "Reduces CPU submission overhead and GPU state switching.",
      action: "Merge compatible meshes using mergeGeometries3D() or texture atlassing.",
    });
    scoreDeductions += 20;
  }

  // 7. Unindexed Meshes
  if (report.diagnostics.unindexedMeshCount > 0) {
    items.push({
      category: "geometry",
      severity: "warning",
      message: `${report.diagnostics.unindexedMeshCount} meshes are unindexed, inflating vertex buffer memory.`,
      expectedImpact: "Shrinks vertex buffer size by 30-50% via index cache utilization.",
      action: "Run optimizeGeometry3D with generateIndices: true.",
    });
    scoreDeductions += 10;
  }

  // 8. VRAM Footprint
  if (report.memoryEstimate.totalVRAMBytes > budget.maxVRAMBytes) {
    const currentMB = (report.memoryEstimate.totalVRAMBytes / (1024 * 1024)).toFixed(1);
    const targetMB = (budget.maxVRAMBytes / (1024 * 1024)).toFixed(0);
    items.push({
      category: "materials",
      severity: "critical",
      message: `Estimated VRAM footprint (${currentMB}MB) exceeds ${tier} memory budget (${targetMB}MB).`,
      expectedImpact: "Prevents GPU out-of-memory crashes and context loss on low-end devices.",
      action: "Compress textures with Basis/KTX2 and reduce geometry buffer precision.",
    });
    scoreDeductions += 30;
  }

  const overallHealthScore = Math.max(0, Math.min(100, 100 - scoreDeductions));

  // Compute estimated improvements
  const estimatedDrawCallsBefore = report.drawCallEstimate;
  const estimatedDrawCallsAfter = Math.min(budget.maxDrawCalls, Math.ceil(report.drawCallEstimate * 0.7));

  const estimatedVRAMBytesBefore = report.memoryEstimate.totalVRAMBytes;
  const estimatedVRAMBytesAfter = Math.min(
    budget.maxVRAMBytes,
    Math.round(report.memoryEstimate.totalVRAMBytes * 0.6)
  );

  return {
    overallHealthScore,
    tier,
    recommendations: items,
    estimatedDrawCallsBefore,
    estimatedDrawCallsAfter,
    estimatedVRAMBytesBefore,
    estimatedVRAMBytesAfter,
  };
}
