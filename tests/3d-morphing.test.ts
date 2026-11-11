import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import {
  analyzeMorphCompatibility,
  validateMorphTargets,
  computeTopologyStats,
  compareTopology,
  alignGeometryCenter,
  normalizeGeometryBounds,
  mapVertexCorrespondence,
  resampleGeometry,
  lerp,
  smoothstep,
  cubicEaseInOut,
  resolveInterpolationFactor,
  interpolateBuffer,
  blendMultipleBuffers,
  createMorphGeometry,
  addMorphTarget,
  removeMorphTarget,
  getMorphTarget,
  evaluateMorph,
  computeMorphBoundingBox,
  morph3D,
  createMorphSequence,
  createSphereToBoxMorph,
  createCubeToSphereMorph,
  createTorusToSphereMorph,
  createCylinderToConeMorph,
  createPlaneToWaveMorph,
  listMorphPresets,
  // use3DMorph imported from react.js below
  type Mesh3DData,
} from "../src/3d/index.js"; import { use3DMorph } from "../src/react.js";

describe("3D Morphing Engine (Phase 15)", () => {
  beforeAll(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return setTimeout(() => cb(Date.now()), 16) as unknown as number;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      clearTimeout(id);
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });
  // Helper to create test geometries
  function createTestMesh(id: string, scale = 1.0, offset = 0): Mesh3DData {
    const positions = new Float32Array([
      -1 * scale + offset, -1 * scale,  1 * scale,
       1 * scale + offset, -1 * scale,  1 * scale,
       1 * scale + offset,  1 * scale,  1 * scale,
      -1 * scale + offset,  1 * scale,  1 * scale,
    ]);
    const normals = new Float32Array([
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ]);
    const uvs = new Float32Array([
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    return {
      id,
      name: id,
      positions,
      normals,
      uvs,
      indices,
    };
  }

  describe("1. Compatibility & Validation", () => {
    it("reports compatible for matching vertex counts and indices", () => {
      const meshA = createTestMesh("mesh-a", 1.0);
      const meshB = createTestMesh("mesh-b", 2.0);

      const report = analyzeMorphCompatibility(meshA, meshB);
      expect(report.isCompatible).toBe(true);
      expect(report.vertexCountMatch).toBe(true);
      expect(report.topologyMatch).toBe(true);
      expect(report.hasIndices).toBe(true);
      expect(report.errors.length).toBe(0);
    });

    it("detects and flags non-finite vertex coordinates", () => {
      const meshA = createTestMesh("mesh-a");
      const badMesh = createTestMesh("bad-mesh");
      badMesh.positions[0] = NaN;
      badMesh.positions[4] = Infinity;

      const report = analyzeMorphCompatibility(meshA, badMesh);
      expect(report.isCompatible).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]).toContain("non-finite");
    });

    it("warns when vertex counts differ but marks as resamplable", () => {
      const meshA = createTestMesh("mesh-a");
      const meshB: Mesh3DData = {
        id: "mesh-b",
        positions: new Float32Array([
          0, 0, 0,
          1, 0, 0,
          0, 1, 0,
          1, 1, 0,
          0, 0, 1,
          1, 1, 1,
        ]),
      };

      const report = analyzeMorphCompatibility(meshA, meshB);
      expect(report.vertexCountMatch).toBe(false);
      expect(report.canResample).toBe(true);
      expect(report.warnings.length).toBeGreaterThan(0);
    });

    it("validates multiple morph targets simultaneously", () => {
      const base = createTestMesh("base");
      const tgt1 = createTestMesh("tgt-1", 1.2);
      const tgt2 = createTestMesh("tgt-2", 1.5);

      const report = validateMorphTargets(base, [tgt1, tgt2]);
      expect(report.isCompatible).toBe(true);
      expect(report.vertexCountMatch).toBe(true);
    });
  });

  describe("2. Topology & Connectivity Analysis", () => {
    it("computes topological metrics for an indexed mesh", () => {
      const mesh = createTestMesh("cube-face");
      const stats = computeTopologyStats(mesh);

      expect(stats.vertexCount).toBe(4);
      expect(stats.triangleCount).toBe(2);
      expect(stats.indexed).toBe(true);
      expect(stats.indexCount).toBe(6);
      expect(stats.sharedEdgeCount).toBe(1); // shared diagonal edge
      expect(stats.boundaryEdgeCount).toBe(4); // 4 outer edges
      expect(stats.isClosedManifold).toBe(false);
    });

    it("compares topology between identical and divergent meshes", () => {
      const meshA = createTestMesh("mesh-a");
      const meshB = createTestMesh("mesh-b", 1.5);
      const meshC: Mesh3DData = {
        id: "mesh-c",
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      };

      const matchAB = compareTopology(meshA, meshB);
      expect(matchAB.identical).toBe(true);
      expect(matchAB.vertexCountMatch).toBe(true);
      expect(matchAB.triangleCountMatch).toBe(true);

      const matchAC = compareTopology(meshA, meshC);
      expect(matchAC.identical).toBe(false);
      expect(matchAC.vertexCountMatch).toBe(false);
    });
  });

  describe("3. Correspondence & Resampling", () => {
    it("aligns geometry center to origin", () => {
      const offMesh = createTestMesh("off-mesh", 1.0, 10.0);
      const centered = alignGeometryCenter(offMesh.positions);

      let sumX = 0;
      for (let i = 0; i < centered.length; i += 3) {
        sumX += centered[i];
      }
      expect(Math.abs(sumX)).toBeLessThan(1e-4);
    });

    it("normalizes geometry bounding box scale", () => {
      const mesh = createTestMesh("large-mesh", 10.0);
      const { normalized, scale } = normalizeGeometryBounds(mesh.positions, 1.0);

      expect(scale).toBeCloseTo(0.05, 3);
      for (let i = 0; i < normalized.length; i++) {
        expect(Math.abs(normalized[i])).toBeLessThanOrEqual(1.0001);
      }
    });

    it("maps vertex correspondence using nearest-neighbor strategy", () => {
      const base = createTestMesh("base");
      const target = createTestMesh("target", 1.1);

      const mapping = mapVertexCorrespondence(base, target, { strategy: "nearest-neighbor" });
      expect(mapping.sourceToTargetIndices.length).toBe(4);
      expect(mapping.confidence).toBeGreaterThan(0.5);
    });

    it("resamples an incompatible mesh to target vertex count", () => {
      const base = createTestMesh("base"); // 4 vertices, 2 triangles
      const resampled = resampleGeometry(base, 10);

      expect(resampled.positions.length / 3).toBe(10);
      expect(resampled.normals?.length).toBe(30);
      expect(resampled.uvs?.length).toBe(20);
    });
  });

  describe("4. Mathematical Interpolation", () => {
    it("interpolates scalar values and easing factors", () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(smoothstep(0)).toBe(0);
      expect(smoothstep(1)).toBe(1);
      expect(smoothstep(0.5)).toBe(0.5);
      expect(cubicEaseInOut(0)).toBe(0);
      expect(cubicEaseInOut(1)).toBe(1);
      expect(resolveInterpolationFactor(0.5, "linear")).toBe(0.5);
      expect(resolveInterpolationFactor(0.5, "smoothstep")).toBe(0.5);
    });

    it("interpolates vertex buffers in-place", () => {
      const base = new Float32Array([0, 0, 0, 10, 20, 30]);
      const target = new Float32Array([10, 20, 30, 20, 40, 60]);
      const out = new Float32Array(6);

      interpolateBuffer(base, target, 0.5, out);

      expect(out[0]).toBe(5);
      expect(out[1]).toBe(10);
      expect(out[2]).toBe(15);
      expect(out[3]).toBe(15);
      expect(out[4]).toBe(30);
      expect(out[5]).toBe(45);
    });

    it("normalizes interpolated normals to unit length", () => {
      const baseNorm = new Float32Array([1, 0, 0]);
      const targetNorm = new Float32Array([0, 1, 0]);
      const outNorm = new Float32Array(3);

      interpolateBuffer(baseNorm, targetNorm, 0.5, outNorm, { isNormal: true });

      const len = Math.hypot(outNorm[0], outNorm[1], outNorm[2]);
      expect(len).toBeCloseTo(1.0, 5);
      expect(outNorm[0]).toBeCloseTo(Math.SQRT1_2, 4);
      expect(outNorm[1]).toBeCloseTo(Math.SQRT1_2, 4);
    });

    it("blends multiple target buffers with relative and absolute weights", () => {
      const base = new Float32Array([0, 0, 0]);
      const tgt1 = new Float32Array([10, 0, 0]); // absolute
      const tgt2 = new Float32Array([0, 20, 0]); // absolute
      const out = new Float32Array(3);

      blendMultipleBuffers(
        base,
        [
          { buffer: tgt1, weight: 0.5 },
          { buffer: tgt2, weight: 0.5 },
        ],
        out
      );

      expect(out[0]).toBe(5);
      expect(out[1]).toBe(10);
      expect(out[2]).toBe(0);
    });
  });

  describe("5. Morph Geometry Management & Evaluation", () => {
    it("creates MorphGeometry3D container with pre-allocated scratch buffers", () => {
      const base = createTestMesh("base");
      const target = createTestMesh("target", 2.0);

      const morphGeo = createMorphGeometry(base, [target]);
      expect(morphGeo.vertexCount).toBe(4);
      expect(morphGeo.targets.length).toBe(1);
      expect(morphGeo.scratchPositions.length).toBe(12);

      // Add another target
      addMorphTarget(morphGeo, createTestMesh("target-2", 3.0), "tgt-2");
      expect(morphGeo.targets.length).toBe(2);

      // Retrieve target
      const retrieved = getMorphTarget(morphGeo, "tgt-2");
      expect(retrieved).toBeDefined();

      // Remove target
      const removed = removeMorphTarget(morphGeo, "tgt-2");
      expect(removed).toBe(true);
      expect(morphGeo.targets.length).toBe(1);
    });

    it("evaluates morph at progress 0, 0.5, and 1.0", () => {
      const base = createTestMesh("base", 1.0);
      const target = createTestMesh("target", 3.0);
      const morphGeo = createMorphGeometry(base, [target]);

      // At t = 0
      const mesh0 = evaluateMorph(morphGeo, 0.0);
      expect(mesh0.positions[0]).toBeCloseTo(-1);

      // At t = 0.5
      const meshHalf = evaluateMorph(morphGeo, 0.5);
      expect(meshHalf.positions[0]).toBeCloseTo(-2);

      // At t = 1.0
      const mesh1 = evaluateMorph(morphGeo, 1.0);
      expect(mesh1.positions[0]).toBeCloseTo(-3);
    });

    it("computes bounding box of morphed geometry", () => {
      const positions = new Float32Array([
        -2, -3, -4,
         2,  3,  4,
      ]);
      const bbox = computeMorphBoundingBox(positions);

      expect(bbox.min).toEqual([-2, -3, -4]);
      expect(bbox.max).toEqual([2, 3, 4]);
      expect(bbox.size).toEqual([4, 6, 8]);
      expect(bbox.center).toEqual([0, 0, 0]);
    });
  });

  describe("6. Animator & Morph Controller (morph3D)", () => {
    it("drives morph animation with seek, pause, resume, and reverse", () => {
      const base = createTestMesh("base", 1.0);
      const target = createTestMesh("target", 2.0);

      const onUpdate = vi.fn();
      const onGeometryChanged = vi.fn();

      const controller = morph3D(base, target, {
        duration: 500,
        onUpdate,
        onGeometryChanged,
      });

      // Seeking
      controller.seek(0.5);
      const state = controller.getState();
      expect(state.progress).toBe(0.5);
      expect(state.mesh.positions[0]).toBeCloseTo(-1.5);
      expect(onUpdate).toHaveBeenCalled();
      expect(onGeometryChanged).toHaveBeenCalled();

      // Pause & Resume
      controller.pause();
      expect(controller.getState().isPaused).toBe(true);
      controller.resume();
      expect(controller.getState().isPlaying).toBe(true);

      // Reverse
      expect(() => controller.reverse()).not.toThrow();

      // Cancel & Destroy
      controller.destroy();
    });

    it("supports setting explicit target weights", () => {
      const base = createTestMesh("base", 1.0);
      const target = createTestMesh("target", 2.0);
      target.id = "target-1";

      const controller = morph3D(base, target);
      controller.setTargetWeight("target-1", 0.7);

      const state = controller.getState();
      expect(state.targetWeights["target-1"]).toBe(0.7);
      controller.destroy();
    });

    it("supports dynamic retargeting mid-animation", () => {
      const base = createTestMesh("base", 1.0);
      const target1 = createTestMesh("target-1", 2.0);
      const target2 = createTestMesh("target-2", 4.0);

      const controller = morph3D(base, target1);
      controller.seek(0.5);

      // Retarget to target2
      expect(() => controller.retarget(target2)).not.toThrow();
      controller.destroy();
    });

    it("runs sequential morphs with createMorphSequence", () => {
      const base = createTestMesh("base", 1.0);
      const tgt1 = createTestMesh("tgt-1", 1.5);
      const tgt2 = createTestMesh("tgt-2", 2.0);

      const onStepComplete = vi.fn();
      const sequenceController = createMorphSequence(
        base,
        [
          { target: tgt1, duration: 200 },
          { target: tgt2, duration: 200 },
        ],
        { onStepComplete }
      );

      expect(sequenceController).toBeDefined();
      expect(sequenceController.getState()).toBeDefined();
      sequenceController.cancel();
    });
  });

  describe("7. Procedural Morph Presets", () => {
    it("creates Sphere to Box morph preset", () => {
      const morph = createSphereToBoxMorph(8);
      expect(morph.id).toBe("preset-sphere-to-box");
      expect(morph.targets.length).toBe(1);
      expect(morph.targets[0].positions.length).toBe(morph.base.positions.length);

      const evaluated = evaluateMorph(morph, 0.5);
      expect(evaluated.positions.length).toBe(morph.base.positions.length);
    });

    it("creates Cube to Sphere morph preset", () => {
      const morph = createCubeToSphereMorph(8);
      expect(morph.id).toBe("preset-cube-to-sphere");
      expect(morph.targets.length).toBe(1);
      expect(morph.targets[0].positions.length).toBe(morph.base.positions.length);
    });

    it("creates Torus to Sphere morph preset", () => {
      const morph = createTorusToSphereMorph(8, 8);
      expect(morph.id).toBe("preset-torus-to-sphere");
      expect(morph.targets.length).toBe(1);
    });

    it("creates Cylinder to Cone morph preset", () => {
      const morph = createCylinderToConeMorph(8);
      expect(morph.id).toBe("preset-cylinder-to-cone");
      expect(morph.targets.length).toBe(1);
    });

    it("creates Plane to Wave morph preset", () => {
      const morph = createPlaneToWaveMorph(8, 8, 0.5);
      expect(morph.id).toBe("preset-plane-to-wave");
      expect(morph.targets.length).toBe(1);
    });

    it("lists all available morph presets", () => {
      const presets = listMorphPresets();
      expect(presets).toContain("sphere-to-box");
      expect(presets).toContain("cube-to-sphere");
      expect(presets).toContain("torus-to-sphere");
      expect(presets).toContain("cylinder-to-cone");
      expect(presets).toContain("plane-to-wave");
    });

    it("exports use3DMorph hook", () => {
      expect(typeof use3DMorph).toBe("function");
    });
  });
});
