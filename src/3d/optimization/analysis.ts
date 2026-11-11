/**
 * AF Motion — 3D Model Analysis & Inspection Engine
 *
 * Comprehensive inspection of 3D model geometry, bounds, hierarchy,
 * textures, materials, degenerate triangles, normal fidelity, and VRAM memory.
 */

import type { Vector3, AABB3D } from "../physics/types.js";
import type { GeometryBufferData } from "../geometry/types.js";
import type {
  Model3DData,
  Mesh3DData,
  ModelAnalysisReport,
  TextureAnalysisMetrics,
} from "./types.js";

/**
 * Inspects and analyzes a 3D model, mesh, or scene graph, producing an in-depth audit report.
 */
export function analyzeModel3D(
  model: unknown,
  options: { checkNormals?: boolean; checkDegenerates?: boolean } = {}
): ModelAnalysisReport {
  let vertexCount = 0;
  let triangleCount = 0;
  let meshCount = 0;
  let materialCount = 0;
  let textureCount = 0;
  let nodeCount = 0;
  let hierarchyDepth = 0;
  let unindexedMeshCount = 0;
  let hasUVs = false;
  let hasTangents = false;
  let hasSkinning = false;

  let degenerateTriangles = 0;
  let nonFiniteVertexCount = 0;
  let duplicateVertexCount = 0;
  let validNormalsCount = 0;
  let totalNormalsCount = 0;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  const usedMaterialIds = new Set<string>();
  const definedMaterialIds = new Set<string>();
  let emptyNodesCount = 0;

  // Textures metrics
  let totalPixelCount = 0;
  let uncompressedVRAM = 0;
  let compressedVRAM = 0;
  let maxTextureDim = 0;
  let nonPowerOfTwoCount = 0;

  const updateBounds = (x: number, y: number, z: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      nonFiniteVertexCount++;
      return;
    }
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  };

  const isPowerOfTwo = (v: number): boolean => (v & (v - 1)) === 0 && v > 0;

  // 1. Analyze Pure AF Motion Mesh3DData / GeometryBufferData
  const analyzeMesh = (mesh: Mesh3DData | GeometryBufferData): void => {
    meshCount++;
    const pos = mesh.positions;
    const vCount = Math.floor(pos.length / 3);
    vertexCount += vCount;

    // Bounds and finite check
    for (let i = 0; i < pos.length; i += 3) {
      updateBounds(pos[i], pos[i + 1], pos[i + 2]);
    }

    // Check duplicate vertices using quantized spatial hashing
    const vertexMap = new Set<string>();
    for (let i = 0; i < pos.length; i += 3) {
      const qx = Math.round(pos[i] * 1000);
      const qy = Math.round(pos[i + 1] * 1000);
      const qz = Math.round(pos[i + 2] * 1000);
      const key = `${qx}_${qy}_${qz}`;
      if (vertexMap.has(key)) {
        duplicateVertexCount++;
      } else {
        vertexMap.add(key);
      }
    }

    // Normals check
    if (mesh.normals && mesh.normals.length > 0) {
      const norm = mesh.normals;
      for (let i = 0; i < norm.length; i += 3) {
        totalNormalsCount++;
        const len = Math.hypot(norm[i], norm[i + 1], norm[i + 2]);
        if (len >= 0.95 && len <= 1.05) {
          validNormalsCount++;
        }
      }
    }

    // UVs & Tangents check
    if (mesh.uvs && mesh.uvs.length > 0) hasUVs = true;
    if ("tangents" in mesh && mesh.tangents && mesh.tangents.length > 0) hasTangents = true;

    // Material tracking
    if ("materialId" in mesh && mesh.materialId) {
      usedMaterialIds.add(mesh.materialId);
    }

    // Triangles & Degenerate Triangles
    const indices = mesh.indices;
    if (indices && indices.length > 0) {
      const triCount = Math.floor(indices.length / 3);
      triangleCount += triCount;

      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];

        if (i0 === i1 || i1 === i2 || i0 === i2) {
          degenerateTriangles++;
          continue;
        }

        // Area check
        const p0x = pos[i0 * 3], p0y = pos[i0 * 3 + 1], p0z = pos[i0 * 3 + 2];
        const p1x = pos[i1 * 3], p1y = pos[i1 * 3 + 1], p1z = pos[i1 * 3 + 2];
        const p2x = pos[i2 * 3], p2y = pos[i2 * 3 + 1], p2z = pos[i2 * 3 + 2];

        const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
        const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

        const cx = e1y * e2z - e1z * e2y;
        const cy = e1z * e2x - e1x * e2z;
        const cz = e1x * e2y - e1y * e2x;
        const areaSq = cx * cx + cy * cy + cz * cz;

        if (areaSq < 1e-12) {
          degenerateTriangles++;
        }
      }
    } else {
      unindexedMeshCount++;
      const triCount = Math.floor(vCount / 3);
      triangleCount += triCount;

      for (let i = 0; i < vCount - 2; i += 3) {
        const p0x = pos[i * 3], p0y = pos[i * 3 + 1], p0z = pos[i * 3 + 2];
        const p1x = pos[(i + 1) * 3], p1y = pos[(i + 1) * 3 + 1], p1z = pos[(i + 1) * 3 + 2];
        const p2x = pos[(i + 2) * 3], p2y = pos[(i + 2) * 3 + 1], p2z = pos[(i + 2) * 3 + 2];

        const e1x = p1x - p0x, e1y = p1y - p0y, e1z = p1z - p0z;
        const e2x = p2x - p0x, e2y = p2y - p0y, e2z = p2z - p0z;

        const cx = e1y * e2z - e1z * e2y;
        const cy = e1z * e2x - e1x * e2z;
        const cz = e1x * e2y - e1y * e2x;
        const areaSq = cx * cx + cy * cy + cz * cz;

        if (areaSq < 1e-12) {
          degenerateTriangles++;
        }
      }
    }
  };

  // Check if input is pure Model3DData
  if (model && typeof model === "object") {
    const m = model as any;

    if (Array.isArray(m.meshes)) {
      for (const mesh of m.meshes) {
        analyzeMesh(mesh);
      }
    } else if (m.positions instanceof Float32Array) {
      // Single Mesh or GeometryBufferData
      analyzeMesh(m);
    }

    // Material definitions
    if (Array.isArray(m.materials)) {
      materialCount = m.materials.length;
      for (const mat of m.materials) {
        if (mat.id) definedMaterialIds.add(mat.id);
      }
    }

    // Texture definitions
    if (Array.isArray(m.textures)) {
      textureCount = m.textures.length;
      for (const tex of m.textures) {
        const w = tex.width || 0;
        const h = tex.height || 0;
        const pixels = w * h;
        totalPixelCount += pixels;
        maxTextureDim = Math.max(maxTextureDim, w, h);
        if (!isPowerOfTwo(w) || !isPowerOfTwo(h)) {
          nonPowerOfTwoCount++;
        }
        const bpp = tex.format === "GREYSCALE" ? 1 : tex.format === "RGB" ? 3 : 4;
        const bytes = pixels * bpp;
        uncompressedVRAM += bytes;
        compressedVRAM += Math.ceil(bytes * 0.25); // ~4:1 compression ASTC/BC
      }
    }

    // Hierarchy Traversal
    const traverseNode = (node: any, depth: number): void => {
      if (!node || typeof node !== "object") return;
      nodeCount++;
      hierarchyDepth = Math.max(hierarchyDepth, depth);

      const hasMeshes = Array.isArray(node.meshIds) && node.meshIds.length > 0;
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;

      if (!hasMeshes && !hasChildren) {
        emptyNodesCount++;
      }

      if (hasChildren) {
        for (const child of node.children) {
          traverseNode(child, depth + 1);
        }
      }
    };

    if (m.rootNode) {
      traverseNode(m.rootNode, 1);
    } else {
      hierarchyDepth = 1;
      nodeCount = Math.max(1, meshCount);
    }

    // Skeleton check
    if (m.skeleton && Array.isArray(m.skeleton.bones)) {
      hasSkinning = true;
    }
  }

  // Handle fallback bounds if no vertices
  if (!Number.isFinite(minX)) {
    minX = 0; minY = 0; minZ = 0;
    maxX = 0; maxY = 0; maxZ = 0;
  }

  const dimX = maxX - minX;
  const dimY = maxY - minY;
  const dimZ = maxZ - minZ;
  const centerX = (minX + maxX) * 0.5;
  const centerY = (minY + maxY) * 0.5;
  const centerZ = (minZ + maxZ) * 0.5;
  const boundingSphereRadius = Math.hypot(dimX, dimY, dimZ) * 0.5;

  const normalConsistency = totalNormalsCount > 0 ? validNormalsCount / totalNormalsCount : 1.0;

  // Unused materials
  const unusedMaterials: string[] = [];
  for (const defId of definedMaterialIds) {
    if (!usedMaterialIds.has(defId)) {
      unusedMaterials.push(defId);
    }
  }

  // Geometry memory: positions(12B) + normals(12B) + uvs(8B) + indices(4B)
  const geomMemoryBytes = vertexCount * 32 + triangleCount * 12;
  const totalVRAMBytes = geomMemoryBytes + uncompressedVRAM;

  const textureMetrics: TextureAnalysisMetrics = {
    totalTextureCount: textureCount,
    totalPixelCount,
    estimatedVRAMBytesUncompressed: uncompressedVRAM,
    estimatedVRAMBytesCompressed: compressedVRAM,
    maxDimension: maxTextureDim,
    nonPowerOfTwoCount,
  };

  return {
    vertexCount,
    triangleCount,
    meshCount,
    materialCount: Math.max(materialCount, usedMaterialIds.size),
    textureCount,
    drawCallEstimate: Math.max(1, meshCount),
    hierarchyDepth,
    nodeCount,
    bounds: {
      aabb: {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
      },
      center: { x: centerX, y: centerY, z: centerZ },
      dimensions: { x: dimX, y: dimY, z: dimZ },
      boundingSphereRadius,
    },
    diagnostics: {
      degenerateTriangles,
      nonFiniteVertexCount,
      duplicateVertexCount,
      normalConsistency,
      hasUVs,
      hasTangents,
      hasSkinning,
      unindexedMeshCount,
      unusedMaterials,
      emptyNodesCount,
    },
    textureMetrics,
    memoryEstimate: {
      geometryBytes: geomMemoryBytes,
      textureBytes: uncompressedVRAM,
      totalVRAMBytes,
    },
    inspectedAt: Date.now(),
  };
}
