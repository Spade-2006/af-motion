import { describe, it, expect } from "vitest";
import {
  analyzeModel3D,
  optimizeGeometry3D,
  mergeGeometries3D,
  splitMesh3D,
  generateModelLODs,
  analyzeMaterials3D,
  optimizeModelHierarchy,
  analyzeSkeleton3D,
  pruneSkinInfluences,
  generateModelCollider,
  recommendModelOptimizations,
  validateModel3D,
  disposeModelAnalysis,
  type Model3DData,
  type Mesh3DData,
  type ModelNode3D,
  type SkeletonData3D,
} from "../src/3d/index.js";

describe("3D Model Intelligence & Optimization Engine", () => {
  // Helper to create a basic test mesh
  function createTestCubeMesh(id = "cube-mesh"): Mesh3DData {
    const positions = new Float32Array([
      // Front face
      -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
      // Back face
      -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
    ]);
    const normals = new Float32Array([
      0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    ]);
    const uvs = new Float32Array([
      0, 0,  1, 0,  1, 1,  0, 1,
      1, 0,  1, 1,  0, 1,  0, 0,
    ]);
    const indices = new Uint32Array([
      0, 1, 2,  0, 2, 3, // front
      4, 5, 6,  4, 6, 7, // back
    ]);

    return {
      id,
      name: id,
      positions,
      normals,
      uvs,
      indices,
    };
  }

  function createTestModel(mesh?: Mesh3DData): Model3DData {
    const defaultMesh = mesh || createTestCubeMesh();
    const rootNode: ModelNode3D = {
      id: "root",
      name: "RootNode",
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      meshIds: [defaultMesh.id || "cube-mesh"],
      children: [],
    };

    return {
      id: "test-model-1",
      name: "TestModel",
      meshes: [defaultMesh],
      materials: [
        {
          id: "mat-1",
          name: "Material1",
          color: [0.8, 0.8, 0.8, 1.0],
          roughness: 0.5,
          metalness: 0.1,
        },
      ],
      rootNode,
    };
  }

  describe("1. Model Analysis (analyzeModel3D)", () => {
    it("analyzes vertex count, triangle count, and bounding box", () => {
      const model = createTestModel();
      const report = analyzeModel3D(model);

      expect(report.vertexCount).toBe(8);
      expect(report.triangleCount).toBe(4);
      expect(report.meshCount).toBe(1);
      expect(report.bounds.aabb.min).toEqual({ x: -1, y: -1, z: -1 });
      expect(report.bounds.aabb.max).toEqual({ x: 1, y: 1, z: 1 });
      expect(report.bounds.center).toEqual({ x: 0, y: 0, z: 0 });
      expect(report.bounds.boundingSphereRadius).toBeGreaterThan(0);
      expect(report.memoryEstimate.totalVRAMBytes).toBeGreaterThan(0);
    });

    it("detects degenerate triangles with zero area", () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        // Degenerate triangle (all identical points)
        2, 2, 2,
        2, 2, 2,
        2, 2, 2,
      ]);
      const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);
      const mesh: Mesh3DData = {
        id: "degen-mesh",
        name: "DegenerateMesh",
        positions,
        indices,
      };
      const model = createTestModel(mesh);
      const report = analyzeModel3D(model);

      expect(report.diagnostics.degenerateTriangles).toBe(1);
      expect(report.triangleCount).toBe(2);
    });

    it("flags non-finite coordinates (NaN or Infinity)", () => {
      const positions = new Float32Array([
        0, NaN, 0,
        1, 0, 0,
        0, 1, Infinity,
      ]);
      const mesh: Mesh3DData = {
        id: "nan-mesh",
        name: "NanMesh",
        positions,
        indices: new Uint32Array([0, 1, 2]),
      };
      const model = createTestModel(mesh);
      const report = analyzeModel3D(model);

      expect(report.diagnostics.nonFiniteVertexCount).toBe(2);
    });

    it("detects duplicate vertices in unindexed meshes", () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        0, 0, 0, // Duplicate of vertex 0
        1, 0, 0, // Duplicate of vertex 1
        1, 1, 0,
      ]);
      const mesh: Mesh3DData = {
        id: "dup-mesh",
        name: "DupMesh",
        positions,
      };
      const model = createTestModel(mesh);
      const report = analyzeModel3D(model);

      expect(report.diagnostics.duplicateVertexCount).toBe(2);
    });
  });

  describe("2. Geometry Optimization (optimizeGeometry3D)", () => {
    it("deduplicates vertices and generates index buffer for unindexed meshes", () => {
      // 2 triangles sharing 2 vertices: 6 vertices total, 4 unique
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,

        1, 0, 0, // duplicate
        1, 1, 0,
        0, 1, 0, // duplicate
      ]);

      const mesh: Mesh3DData = {
        id: "unindexed-quad",
        name: "UnindexedQuad",
        positions,
      };

      const result = optimizeGeometry3D(mesh, {
        deduplicateVertices: true,
        removeDegenerateTriangles: false,
      });

      expect(result.mesh.indices).toBeDefined();
      expect(result.mesh.indices!.length).toBe(6);
      expect(result.optimizedVertexCount).toBe(4);
    });

    it("removes degenerate triangles", () => {
      const positions = new Float32Array([
        // Valid triangle
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        // Degenerate triangle (colinear)
        2, 0, 0,
        3, 0, 0,
        4, 0, 0,
      ]);
      const indices = new Uint32Array([0, 1, 2, 3, 4, 5]);

      const mesh: Mesh3DData = {
        id: "degen-strip",
        name: "DegenStrip",
        positions,
        indices,
      };

      const result = optimizeGeometry3D(mesh, {
        deduplicateVertices: false,
        removeDegenerateTriangles: true,
      });

      expect(result.degeneratesRemoved).toBe(1);
      expect(result.mesh.indices!.length).toBe(3);
    });

    it("recalculates smooth vertex normals", () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        1, 1, 0,
      ]);
      const indices = new Uint32Array([0, 1, 2, 1, 3, 2]);

      const mesh: Mesh3DData = {
        id: "flat-quad",
        name: "FlatQuad",
        positions,
        indices,
      };

      const result = optimizeGeometry3D(mesh, {
        recalculateNormals: true,
      });

      expect(result.mesh.normals).toBeDefined();
      expect(result.mesh.normals!.length).toBe(12);
      // For a flat quad in XY, normal should point along +Z
      for (let i = 0; i < 4; i++) {
        expect(result.mesh.normals![i * 3 + 0]).toBeCloseTo(0);
        expect(result.mesh.normals![i * 3 + 1]).toBeCloseTo(0);
        expect(result.mesh.normals![i * 3 + 2]).toBeCloseTo(1);
      }
    });

    it("generates tangent vectors when UVs are available", () => {
      const mesh = createTestCubeMesh();
      const result = optimizeGeometry3D(mesh, {
        generateTangents: true,
      });

      expect(result.tangentsGenerated).toBe(true);
      expect(result.mesh.tangents).toBeDefined();
      expect(result.mesh.tangents!.length).toBe((result.mesh.positions.length / 3) * 4);
    });

    it("merges multiple meshes with identical materials", () => {
      const meshA = createTestCubeMesh("mesh-a");
      const meshB = createTestCubeMesh("mesh-b");
      meshA.materialId = "mat-common";
      meshB.materialId = "mat-common";

      const merged = mergeGeometries3D([meshA, meshB], "mat-common");
      expect(merged).not.toBeNull();
      expect(merged!.positions.length).toBe(meshA.positions.length + meshB.positions.length);
      expect(merged!.indices!.length).toBe(meshA.indices!.length + meshB.indices!.length);
      expect(merged!.materialId).toBe("mat-common");
    });

    it("splits mesh when triangle count exceeds limit", () => {
      const mesh = createTestCubeMesh("big-mesh");
      // Cube has 8 vertices and 4 triangles
      // If maxVertices = 4, it splits into 2 meshes with 2 triangles each
      const chunks = splitMesh3D(mesh, 4);

      expect(chunks.length).toBe(2);
      expect(chunks[0].indices!.length).toBe(6);
      expect(chunks[1].indices!.length).toBe(6);
    });
  });

  describe("3. Level of Detail - LOD Generation (generateModelLODs)", () => {
    it("generates 4 LOD levels with correct reduction targets", () => {
      // Build a grid plane mesh with 10x10 quads = 200 triangles
      const resolution = 10;
      const positions: number[] = [];
      const indices: number[] = [];

      for (let y = 0; y <= resolution; y++) {
        for (let x = 0; x <= resolution; x++) {
          positions.push(x / resolution, 0, y / resolution);
        }
      }

      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          const i00 = y * (resolution + 1) + x;
          const i10 = i00 + 1;
          const i01 = (y + 1) * (resolution + 1) + x;
          const i11 = i01 + 1;
          indices.push(i00, i01, i10);
          indices.push(i10, i01, i11);
        }
      }

      const planeMesh: Mesh3DData = {
        id: "plane-mesh",
        name: "PlaneMesh",
        positions: new Float32Array(positions),
        indices: new Uint32Array(indices),
      };

      const result = generateModelLODs(planeMesh);

      expect(result.lods.length).toBe(4);
      expect(result.lods[0].level).toBe(0);
      expect(result.lods[0].triangleCount).toBe(indices.length / 3);
      expect(result.lods[0].reductionRatio).toBe(1.0);

      // LOD1 target 50%
      expect(result.lods[1].level).toBe(1);
      expect(result.lods[1].triangleCount).toBeLessThanOrEqual(result.lods[0].triangleCount);

      // LOD2 target 25%
      expect(result.lods[2].level).toBe(2);
      expect(result.lods[2].triangleCount).toBeLessThanOrEqual(result.lods[1].triangleCount);

      // LOD3 target 10%
      expect(result.lods[3].level).toBe(3);
      expect(result.lods[3].triangleCount).toBeLessThanOrEqual(result.lods[2].triangleCount);

      // Distance thresholds should strictly increase
      expect(result.lods[0].distanceThreshold).toBe(0);
      expect(result.lods[1].distanceThreshold).toBeGreaterThan(result.lods[0].distanceThreshold);
      expect(result.lods[2].distanceThreshold).toBeGreaterThan(result.lods[1].distanceThreshold);
      expect(result.lods[3].distanceThreshold).toBeGreaterThan(result.lods[2].distanceThreshold);
    });
  });

  describe("4. Material & Texture Intelligence (analyzeMaterials3D)", () => {
    it("detects duplicate materials and recommends texture downscaling", () => {
      const model = createTestModel();
      model.materials = [
        {
          id: "mat-1",
          name: "Wood1",
          color: [0.5, 0.3, 0.1, 1],
          roughness: 0.8,
          metalness: 0.0,
        },
        {
          id: "mat-2", // Duplicate properties
          name: "Wood2",
          color: [0.5, 0.3, 0.1, 1],
          roughness: 0.8,
          metalness: 0.0,
        },
      ];
      model.textures = [
        {
          id: "tex-big",
          name: "LargeAlbedo",
          width: 4096,
          height: 4096,
          format: "RGBA",
          byteLength: 4096 * 4096 * 4,
        },
      ];

      const matAnalysis = analyzeMaterials3D(model, {
        maxTextureDimension: 2048,
        deduplicateMaterials: true,
      });

      expect(matAnalysis.duplicatePairs.length).toBe(1);
      expect(matAnalysis.duplicatePairs[0].duplicateId).toBe("mat-2");
      expect(matAnalysis.duplicatePairs[0].canonicalId).toBe("mat-1");

      expect(matAnalysis.textureRecommendations.length).toBe(1);
      expect(matAnalysis.textureRecommendations[0].recommendedResolution).toEqual([2048, 2048]);
      expect(matAnalysis.totalVRAMSavingsBytes).toBeGreaterThan(0);
    });
  });

  describe("5. Hierarchy Optimization (optimizeModelHierarchy)", () => {
    it("removes empty groups and collapses redundant identity nodes", () => {
      const rootNode: ModelNode3D = {
        id: "root",
        name: "Root",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        children: [
          {
            id: "empty-intermediate",
            name: "EmptyIntermediate",
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
            children: [
              {
                id: "child-mesh-node",
                name: "ChildMeshNode",
                transform: {
                  position: { x: 0, y: 0, z: 0 },
                  rotation: { x: 0, y: 0, z: 0, w: 1 },
                  scale: { x: 1, y: 1, z: 1 },
                },
                meshIds: ["cube-mesh"],
                children: [],
              },
            ],
          },
          {
            id: "useless-empty-leaf",
            name: "UselessLeaf",
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
            children: [],
          },
        ],
      };

      const { root: optimizedRoot, report } = optimizeModelHierarchy(rootNode, {
        removeEmptyGroups: true,
        collapseRedundantNodes: true,
      });

      expect(report.nodesRemoved).toBeGreaterThan(0);
      expect(report.optimizedNodeCount).toBeLessThan(report.originalNodeCount);
      // The useless leaf must not exist in children
      const childIds = optimizedRoot.children?.map((c) => c.id) || [];
      expect(childIds).not.toContain("useless-empty-leaf");
    });

    it("preserves animated nodes and physics nodes from removal", () => {
      const rootNode: ModelNode3D = {
        id: "root",
        name: "Root",
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        children: [
          {
            id: "animated-empty-node",
            name: "AnimatedPivot",
            isAnimated: true,
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              scale: { x: 1, y: 1, z: 1 },
            },
            children: [],
          },
        ],
      };

      const { root: optimizedRoot } = optimizeModelHierarchy(rootNode, {
        removeEmptyGroups: true,
        preserveAnimatedNodes: true,
      });

      const isPreserved =
        optimizedRoot.id === "animated-empty-node" ||
        (optimizedRoot.children?.some((n) => n.id === "animated-empty-node") ?? false);
      expect(isPreserved).toBe(true);
    });
  });

  describe("6. Skeletal Intelligence (analyzeSkeleton3D & pruneSkinInfluences)", () => {
    it("validates bone hierarchy and calculates max depth", () => {
      const skeleton: SkeletonData3D = {
        bones: [
          { id: "root", name: "Root", parentIndex: -1, localTransform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } },
          { id: "spine", name: "Spine", parentIndex: 0, localTransform: { position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } },
          { id: "head", name: "Head", parentIndex: 1, localTransform: { position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } },
        ],
      };

      const analysis = analyzeSkeleton3D(skeleton);
      expect(analysis.boneCount).toBe(3);
      expect(analysis.hierarchyDepth).toBe(3);
      expect(analysis.hasCycles).toBe(false);
    });

    it("detects cyclic parent references in skeleton", () => {
      const cyclicSkeleton: SkeletonData3D = {
        bones: [
          { id: "boneA", name: "A", parentIndex: 1, localTransform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } },
          { id: "boneB", name: "B", parentIndex: 0, localTransform: { position: { x: 0, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 1, y: 1, z: 1 } } },
        ],
      };

      const analysis = analyzeSkeleton3D(cyclicSkeleton);
      expect(analysis.hasCycles).toBe(true);
    });

    it("prunes excess skinning influences and renormalizes weights", () => {
      // 1 vertex with 6 bone influences
      const weights = new Float32Array([0.4, 0.3, 0.15, 0.08, 0.05, 0.02]);
      const indices = new Uint16Array([0, 1, 2, 3, 4, 5]);

      const pruned = pruneSkinInfluences(weights, indices, 4, 6);

      expect(pruned.prunedWeights.length).toBe(4);
      expect(pruned.prunedIndices.length).toBe(4);
      expect(pruned.maxInfluencesFound).toBe(6);

      // Check sum of weights equals 1.0
      let sum = 0;
      for (let i = 0; i < 4; i++) {
        sum += pruned.prunedWeights[i];
      }
      expect(sum).toBeCloseTo(1.0, 5);
    });
  });

  describe("7. Physics Collider Generation (generateModelCollider)", () => {
    it("generates an axis-aligned box collider fitting model bounds", () => {
      const model = createTestModel();
      const rec = generateModelCollider(model, { preferredType: "box" });

      expect(rec.type).toBe("box");
      expect(rec.center).toEqual({ x: 0, y: 0, z: 0 });
      expect(rec.halfExtents).toEqual({ x: 1, y: 1, z: 1 });
      expect(rec.collider).toBeDefined();
    });

    it("generates a bounding sphere collider", () => {
      const model = createTestModel();
      const rec = generateModelCollider(model, { preferredType: "sphere" });

      expect(rec.type).toBe("sphere");
      expect(rec.center).toEqual({ x: 0, y: 0, z: 0 });
      expect(rec.radius).toBeCloseTo(Math.sqrt(3), 3);
    });

    it("generates a capsule collider", () => {
      const model = createTestModel();
      const rec = generateModelCollider(model, { preferredType: "capsule" });

      expect(rec.type).toBe("capsule");
      expect(rec.radius).toBeGreaterThan(0);
      expect(rec.height).toBeGreaterThanOrEqual(0);
    });

    it("generates a convex hull collider", () => {
      const model = createTestModel();
      const rec = generateModelCollider(model, { preferredType: "convex" });

      expect(rec.type).toBe("convex");
      expect(rec.vertices).toBeDefined();
      expect(rec.vertices!.length).toBeGreaterThan(0);
    });
  });

  describe("8. Recommendations & Validation (recommendModelOptimizations & validateModel3D)", () => {
    it("produces mobile target recommendations for dense meshes", () => {
      // Create a dense model with 60,000 triangles to exceed mobile threshold of 50,000
      const bigPositions = new Float32Array(90000);
      const bigIndices = new Uint32Array(180000); // 60,000 triangles
      const denseMesh: Mesh3DData = {
        id: "dense-mesh",
        name: "DenseMesh",
        positions: bigPositions,
        indices: bigIndices,
      };

      const denseModel = createTestModel(denseMesh);
      const recommendations = recommendModelOptimizations(denseModel, { targetDeviceTier: "mobile" });

      expect(recommendations.tier).toBe("mobile");
      expect(recommendations.overallHealthScore).toBeLessThan(100);
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.recommendations.some((r) => r.category === "lod")).toBe(true);
    });

    it("validates model integrity with validateModel3D", () => {
      const model = createTestModel();
      const validation = validateModel3D(model);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);

      // Invalidate by adding non-finite vertex
      model.meshes[0].positions[0] = NaN;
      const invalidValidation = validateModel3D(model);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    it("cleans up resources cleanly with disposeModelAnalysis", () => {
      const model = createTestModel();
      const report = analyzeModel3D(model);
      expect(() => disposeModelAnalysis(report)).not.toThrow();
    });
  });
});
