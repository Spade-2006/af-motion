/**
 * AF Motion — 3D Model Intelligence & Optimization Types
 *
 * Strongly-typed contracts for model inspection, geometry optimization,
 * LOD generation, material/texture analysis, hierarchy collapsing,
 * skeletal analysis, and automatic collider generation.
 */

import type { Vector3, AABB3D, Transform3D, Collider3D } from "../physics/types.js";
import type { GeometryBufferData } from "../geometry/types.js";
import type { AnimationClipMetadata } from "../assets/types.js";

// ============================================================================
// Core Model & Mesh Data Structures
// ============================================================================

export interface Mesh3DData {
  id?: string;
  name?: string;
  positions: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
  indices?: Uint16Array | Uint32Array;
  tangents?: Float32Array;
  colors?: Float32Array;
  materialId?: string;
}

export interface MaterialData3D {
  id: string;
  name?: string;
  color?: [number, number, number, number];
  roughness?: number;
  metalness?: number;
  albedoTextureId?: string;
  normalTextureId?: string;
  roughnessTextureId?: string;
  emissiveTextureId?: string;
  alphaMode?: "OPAQUE" | "MASK" | "BLEND";
}

export interface TextureData3D {
  id: string;
  name?: string;
  width: number;
  height: number;
  format?: "RGBA" | "RGB" | "GREYSCALE" | "COMPRESSED";
  byteLength?: number;
}

export interface ModelNode3D {
  id: string;
  name?: string;
  transform: Transform3D;
  meshIds?: string[];
  children?: ModelNode3D[];
  isAnimated?: boolean;
  isPhysicsTarget?: boolean;
}

export interface SkeletonBone3D {
  id: string;
  name: string;
  parentIndex: number; // -1 for root
  localTransform: Transform3D;
  inverseBindMatrix?: Float32Array;
}

export interface SkeletonData3D {
  bones: SkeletonBone3D[];
  skinWeights?: Float32Array;
  skinIndices?: Uint16Array | Uint32Array;
  maxInfluencesPerVertex?: number;
  animationClips?: AnimationClipMetadata[];
}



export interface Model3DData {
  id: string;
  name?: string;
  rootNode: ModelNode3D;
  meshes: Mesh3DData[];
  materials?: MaterialData3D[];
  textures?: TextureData3D[];
  skeleton?: SkeletonData3D;
}

// ============================================================================
// Model Analysis Engine
// ============================================================================

export interface TextureAnalysisMetrics {
  totalTextureCount: number;
  totalPixelCount: number;
  estimatedVRAMBytesUncompressed: number;
  estimatedVRAMBytesCompressed: number;
  maxDimension: number;
  nonPowerOfTwoCount: number;
}

export interface ModelAnalysisReport {
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
  materialCount: number;
  textureCount: number;
  drawCallEstimate: number;
  hierarchyDepth: number;
  nodeCount: number;

  bounds: {
    aabb: AABB3D;
    center: Vector3;
    dimensions: Vector3;
    boundingSphereRadius: number;
  };

  diagnostics: {
    degenerateTriangles: number;
    nonFiniteVertexCount: number;
    duplicateVertexCount: number;
    normalConsistency: number; // 0.0 to 1.0
    hasUVs: boolean;
    hasTangents: boolean;
    hasSkinning: boolean;
    unindexedMeshCount: number;
    unusedMaterials: string[];
    emptyNodesCount: number;
  };

  textureMetrics: TextureAnalysisMetrics;

  memoryEstimate: {
    geometryBytes: number;
    textureBytes: number;
    totalVRAMBytes: number;
  };

  inspectedAt: number;
}

// ============================================================================
// Geometry Optimization
// ============================================================================

export interface GeometryOptimizationConfig {
  /** Merge coincident vertices within distance tolerance. Default: true. */
  deduplicateVertices?: boolean;
  /** Spatial distance tolerance for vertex deduplication. Default: 1e-4. */
  deduplicationTolerance?: number;
  /** Remove zero-area or collinear triangles. Default: true. */
  removeDegenerateTriangles?: boolean;
  /** Recalculate smooth vertex normals from face area weighting. Default: false. */
  recalculateNormals?: boolean;
  /** Generate tangent vectors (and bitangent signs) from UVs. Default: false. */
  generateTangents?: boolean;
  /** Convert unindexed vertex streams into indexed triangle buffers. Default: true. */
  generateIndices?: boolean;
  /** Merge sub-meshes sharing identical materials. Default: false. */
  mergeGeometries?: boolean;
  /** Split large meshes exceeding vertex limits for 16-bit indices. Default: false. */
  splitLargeMeshes?: boolean;
  /** Maximum vertices threshold when splitting meshes. Default: 65535. */
  maxVerticesPerMesh?: number;
}

export interface OptimizedGeometryResult {
  mesh: Mesh3DData;
  originalVertexCount: number;
  optimizedVertexCount: number;
  originalTriangleCount: number;
  optimizedTriangleCount: number;
  reductionPercentage: number;
  indicesGenerated: boolean;
  tangentsGenerated: boolean;
  degeneratesRemoved: number;
}

// ============================================================================
// Level of Detail (LOD) Generation
// ============================================================================

export interface LODLevelConfig {
  level: number;
  targetTriangleRatio: number; // 0.1 to 1.0 (e.g. 0.5 for 50%)
  distanceThreshold: number; // in world units
  maxError?: number;
}

export interface LODConfig {
  levels?: LODLevelConfig[];
  /** Preserve outer boundary edge vertices. Default: true. */
  preserveBoundaries?: boolean;
  /** Screen space error threshold in pixels. Default: 2.0. */
  screenSpaceError?: number;
}

export interface LODLevelData {
  level: number;
  mesh: Mesh3DData;
  vertexCount: number;
  triangleCount: number;
  reductionRatio: number;
  distanceThreshold: number;
}

export interface ModelLODResult {
  lods: LODLevelData[];
  baseTriangleCount: number;
  totalLevels: number;
}

// ============================================================================
// Material & Texture Intelligence
// ============================================================================

export interface MaterialOptimizationConfig {
  deduplicateMaterials?: boolean;
  recommendTextureDownscaling?: boolean;
  maxTextureDimension?: number;
}

export interface MaterialOptimizationReport {
  originalMaterialCount: number;
  deduplicatedMaterialCount: number;
  duplicatePairs: Array<{ duplicateId: string; canonicalId: string }>;
  textureRecommendations: Array<{
    textureId: string;
    currentResolution: [number, number];
    recommendedResolution: [number, number];
    savedVRAMBytes: number;
    reason: string;
  }>;
  totalVRAMSavingsBytes: number;
}

// ============================================================================
// Hierarchy Optimization
// ============================================================================

export interface HierarchyOptimizationConfig {
  removeEmptyGroups?: boolean;
  collapseRedundantNodes?: boolean;
  bakeStaticTransforms?: boolean;
  preserveAnimatedNodes?: boolean;
  preservePhysicsNodes?: boolean;
}

export interface HierarchyOptimizationReport {
  originalNodeCount: number;
  optimizedNodeCount: number;
  nodesRemoved: number;
  transformsBaked: number;
  maxDepthBefore: number;
  maxDepthAfter: number;
}

// ============================================================================
// Skeletal & Animation Intelligence
// ============================================================================

export interface SkeletonOptimizationConfig {
  maxInfluences?: number; // e.g. 4
  minWeightThreshold?: number; // e.g. 0.01
}

export interface SkeletonAnalysisReport {
  boneCount: number;
  hierarchyDepth: number;
  hasCycles: boolean;
  maxInfluencesPerVertex: number;
  unnormalizedWeightsCount: number;
  prunedInfluencesCount: number;
  animationClips: AnimationClipMetadata[];
}

// ============================================================================
// Collider Recommendation
// ============================================================================

export type RecommendedColliderType =
  | "box"
  | "sphere"
  | "capsule"
  | "convex"
  | "compound";

export interface ColliderRecommendation {
  type: RecommendedColliderType;
  collider: Collider3D;
  center?: Vector3;
  halfExtents?: Vector3;
  radius?: number;
  height?: number;
  vertices?: Float32Array;
  confidence: number; // 0.0 to 1.0
  accuracyEstimate: number; // 0.0 to 1.0
  computationalCost: "minimal" | "low" | "medium" | "high";
  reason: string;
}

// ============================================================================
// Optimization Recommendations
// ============================================================================

export type DeviceProfileTier = "mobile" | "standard" | "high-end";

export interface OptimizationRecommendationItem {
  category: "geometry" | "lod" | "materials" | "textures" | "hierarchy" | "physics";
  severity: "info" | "warning" | "critical";
  message: string;
  expectedImpact: string;
  action: string;
}

export interface OptimizationRecommendations {
  overallHealthScore: number; // 0 to 100
  tier: DeviceProfileTier;
  recommendations: OptimizationRecommendationItem[];
  estimatedDrawCallsBefore: number;
  estimatedDrawCallsAfter: number;
  estimatedVRAMBytesBefore: number;
  estimatedVRAMBytesAfter: number;
}
