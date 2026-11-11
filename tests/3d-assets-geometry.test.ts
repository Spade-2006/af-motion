import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

// Assets module
import {
  inferAssetFormat,
  validateAssetDefinition,
  correctAssetDefinition,
  inspectModelGraph,
  deepDisposeModel,
  instantiateModel,
  createMockAssetLoader,
  AssetCache3D,
  AssetManager3D,
  getDefaultAssetManager,
  resetDefaultAssetManager,
  discoverSceneAssetReferences,
  preloadSceneAssets,
  type Asset3DDefinition,
} from "../src/3d/assets/index.js";

// Geometry module
import {
  generateBoxGeometry,
  generateSphereGeometry,
  generatePlaneGeometry,
  generateCylinderGeometry,
  generateConeGeometry,
  generateTorusGeometry,
  generateCapsuleGeometry,
  generateRingGeometry,
  generateRoundedBoxGeometry,
  generateExtrudeGeometry,
  generateParametricGeometry,
  generateProceduralGeometry,
  computeBoundingBoxFromPositions,
  validateGeometryDescriptor,
  correctGeometryDescriptor,
  computeGeometryHash,
  GeometryCache3D,
  getDefaultGeometryCache,
  toThreeGeometry,
  disposeThreeGeometry,
  type ProceduralGeometryDescriptor,
} from "../src/3d/geometry/index.js";

// AI Capabilities
import {
  ASSET_3D_MANAGEMENT_CAPABILITY,
  GEOMETRY_3D_PROCEDURAL_CAPABILITY,
  getAvailableGeometryTypes,
  getGeometryParameters,
  getSupportedModelFormats,
  register3DIntelligenceCapabilities,
} from "../src/3d/schema.js";

// React integration
import {
  useAsset3D,
  useModel3D,
  useGeometry3D,
  useAssetProgress,
  Model3DView,
  Geometry3DView,
} from "../src/react.js";

import type { Scene3DSpecification } from "../src/3d/schemas/types.js";

describe("3D Procedural Geometry Infrastructure", () => {
  it("generates deterministic Box geometry with vertices, normals, UVs, and indices", () => {
    const box = generateBoxGeometry({ type: "box", width: 2, height: 3, depth: 4 });
    expect(box.type).toBe("box");
    expect(box.positions.length).toBeGreaterThan(0);
    expect(box.normals.length).toBe(box.positions.length);
    expect(box.uvs.length).toBe((box.positions.length / 3) * 2);
    expect(box.indices).toBeDefined();
    expect(box.triangleCount).toBe(12); // 6 faces * 2 triangles
    expect(box.boundingBox.size[0]).toBeCloseTo(2);
    expect(box.boundingBox.size[1]).toBeCloseTo(3);
    expect(box.boundingBox.size[2]).toBeCloseTo(4);
  });

  it("generates Sphere geometry with spherical normal vectors", () => {
    const sphere = generateSphereGeometry({ type: "sphere", radius: 1, widthSegments: 16, heightSegments: 8 });
    expect(sphere.type).toBe("sphere");
    expect(sphere.vertexCount).toBeGreaterThan(0);
    expect(sphere.triangleCount).toBeGreaterThan(0);
    expect(sphere.boundingBox.size[0]).toBeCloseTo(2, 1);
    expect(sphere.boundingBox.size[1]).toBeCloseTo(2, 1);
    expect(sphere.boundingBox.size[2]).toBeCloseTo(2, 1);

    // Verify normals are unit length
    for (let i = 0; i < sphere.normals.length; i += 3) {
      const nx = sphere.normals[i];
      const ny = sphere.normals[i + 1];
      const nz = sphere.normals[i + 2];
      const len = Math.hypot(nx, ny, nz);
      expect(len).toBeCloseTo(1, 2);
    }
  });

  it("generates Plane geometry with uniform (0, 0, 1) normals", () => {
    const plane = generatePlaneGeometry({ type: "plane", width: 4, height: 2 });
    expect(plane.type).toBe("plane");
    expect(plane.boundingBox.size[0]).toBeCloseTo(4);
    expect(plane.boundingBox.size[1]).toBeCloseTo(2);
    expect(plane.boundingBox.size[2]).toBe(0);

    for (let i = 0; i < plane.normals.length; i += 3) {
      expect(plane.normals[i]).toBe(0);
      expect(plane.normals[i + 1]).toBe(0);
      expect(plane.normals[i + 2]).toBe(1);
    }
  });

  it("generates Cylinder and Cone geometries", () => {
    const cylinder = generateCylinderGeometry({ type: "cylinder", radiusTop: 1, radiusBottom: 1, height: 4 });
    expect(cylinder.type).toBe("cylinder");
    expect(cylinder.boundingBox.size[1]).toBeCloseTo(4);

    const cone = generateConeGeometry({ type: "cone", radius: 1, height: 3 });
    expect(cone.type).toBe("cone");
    expect(cone.boundingBox.size[1]).toBeCloseTo(3);
  });

  it("generates Torus, Capsule, and Ring geometries", () => {
    const torus = generateTorusGeometry({ type: "torus", radius: 2, tube: 0.5 });
    expect(torus.type).toBe("torus");
    expect(torus.triangleCount).toBeGreaterThan(0);

    const capsule = generateCapsuleGeometry({ type: "capsule", radius: 0.5, length: 2 });
    expect(capsule.type).toBe("capsule");
    expect(capsule.boundingBox.size[1]).toBeCloseTo(3); // length + 2 * radius = 2 + 1 = 3

    const ring = generateRingGeometry({ type: "ring", innerRadius: 1, outerRadius: 2 });
    expect(ring.type).toBe("ring");
    expect(ring.boundingBox.size[0]).toBeCloseTo(4);
    expect(ring.boundingBox.size[1]).toBeCloseTo(4);
  });

  it("generates Rounded Box and Extrude geometries", () => {
    const roundedBox = generateRoundedBoxGeometry({ type: "rounded-box", width: 2, height: 2, depth: 2, radius: 0.2 });
    expect(roundedBox.type).toBe("rounded-box");
    expect(roundedBox.vertexCount).toBeGreaterThan(0);

    const extrude = generateExtrudeGeometry({
      type: "extrude",
      points: [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ],
      depth: 1,
    });
    expect(extrude.type).toBe("extrude");
    expect(extrude.boundingBox.size[2]).toBeCloseTo(1);
  });

  it("generates Parametric geometries with custom evaluators", () => {
    const wave = generateParametricGeometry({ type: "parametric", evaluatorName: "wave", uSegments: 10, vSegments: 10 });
    expect(wave.type).toBe("parametric");
    expect(wave.vertexCount).toBe(121); // (10 + 1) * (10 + 1)
    expect(wave.triangleCount).toBe(200); // 10 * 10 * 2
  });

  it("dispatches all 11 geometry types through unified generateProceduralGeometry", () => {
    const types: ProceduralGeometryDescriptor["type"][] = [
      "box", "sphere", "plane", "cylinder", "cone",
      "torus", "capsule", "ring", "rounded-box", "extrude", "parametric"
    ];

    for (const t of types) {
      const desc = { type: t } as any;
      const geom = generateProceduralGeometry(desc);
      expect(geom.positions.length).toBeGreaterThan(0);
      expect(geom.normals.length).toBe(geom.positions.length);
    }
  });

  it("validates and auto-corrects malformed geometry descriptors", () => {
    const invalid = validateGeometryDescriptor({ type: "box", width: -5, height: 0 });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);

    const corrected = correctGeometryDescriptor({ type: "box", width: -5, height: -2 });
    expect(corrected.width).toBe(1);
    expect(corrected.height).toBe(1);

    const correctedRing = correctGeometryDescriptor({ type: "ring", innerRadius: 10, outerRadius: 2 });
    expect(correctedRing.innerRadius).toBeLessThan(correctedRing.outerRadius!);
  });

  it("computes deterministic geometry hashes and caches buffers", () => {
    const desc1: ProceduralGeometryDescriptor = { type: "sphere", radius: 2, widthSegments: 32 };
    const desc2: ProceduralGeometryDescriptor = { type: "sphere", widthSegments: 32, radius: 2 };

    const hash1 = computeGeometryHash(desc1);
    const hash2 = computeGeometryHash(desc2);
    expect(hash1).toBe(hash2);

    const cache = new GeometryCache3D({ maxEntries: 2 });
    const g1 = cache.getOrGenerate(desc1);
    expect(cache.has(desc1)).toBe(true);

    const g2 = cache.getOrGenerate(desc2);
    expect(g1).toBe(g2); // Same object reference from cache
  });

  it("converts procedural geometry to Three.js BufferGeometry with adapter", () => {
    const mockThree = {
      BufferGeometry: class {
        attributes: Record<string, any> = {};
        index: any = null;
        setAttribute(name: string, attr: any) { this.attributes[name] = attr; }
        setIndex(idx: any) { this.index = idx; }
        computeBoundingBox() {}
        computeBoundingSphere() {}
        dispose() {}
      },
      BufferAttribute: class {
        constructor(public array: any, public itemSize: number) {}
      },
    };

    const box = generateBoxGeometry();
    const threeGeom = toThreeGeometry(box, mockThree);
    expect(threeGeom).toBeDefined();
    expect(threeGeom.attributes.position).toBeDefined();
    expect(threeGeom.attributes.normal).toBeDefined();
    expect(threeGeom.attributes.uv).toBeDefined();
    expect(threeGeom.index).toBeDefined();

    expect(() => disposeThreeGeometry(threeGeom)).not.toThrow();
  });
});

describe("3D Asset Management & Model Loading", () => {
  beforeEach(() => {
    resetDefaultAssetManager();
  });

  it("infers asset formats from URLs", () => {
    expect(inferAssetFormat("model.gltf")).toBe("gltf");
    expect(inferAssetFormat("model.glb?v=1")).toBe("glb");
    expect(inferAssetFormat("mesh.obj#anchor")).toBe("obj");
    expect(inferAssetFormat("anim.fbx")).toBe("fbx");
    expect(inferAssetFormat("scene.usdz")).toBe("usdz");
    expect(inferAssetFormat("texture.png")).toBe("texture");
    expect(inferAssetFormat("unknown.bin")).toBe("custom");
  });

  it("validates and corrects asset definitions", () => {
    const invalid = validateAssetDefinition({ id: "", url: "" });
    expect(invalid.valid).toBe(false);

    const corrected = correctAssetDefinition({ url: "https://example.com/models/character.glb" });
    expect(corrected.id).toBe("character.glb");
    expect(corrected.format).toBe("glb");
  });

  it("inspects model scene graph and computes metadata", () => {
    const mockModel = {
      scene: {
        children: [
          {
            isMesh: true,
            name: "HeadMesh",
            geometry: {
              attributes: {
                position: {
                  count: 100,
                  array: new Float32Array(300),
                },
              },
              index: { count: 150 },
            },
            material: { name: "SkinMat", dispose: vi.fn() },
          },
        ],
      },
      animations: [
        { name: "walk", duration: 1.2, tracks: [{}, {}] },
      ],
    };

    const metadata = inspectModelGraph(mockModel);
    expect(metadata.meshCount).toBe(1);
    expect(metadata.vertexCount).toBe(100);
    expect(metadata.triangleCount).toBe(50);
    expect(metadata.materialCount).toBe(1);
    expect(metadata.hasAnimations).toBe(true);
    expect(metadata.animationClips[0].name).toBe("walk");
  });

  it("deeply disposes model geometries, materials, and textures", () => {
    const disposeGeom = vi.fn();
    const disposeMat = vi.fn();
    const disposeTex = vi.fn();

    const mockModel = {
      scene: {
        children: [
          {
            isMesh: true,
            geometry: { dispose: disposeGeom },
            material: {
              dispose: disposeMat,
              map: { dispose: disposeTex },
            },
          },
        ],
      },
    };

    deepDisposeModel(mockModel);
    expect(disposeGeom).toHaveBeenCalledTimes(1);
    expect(disposeMat).toHaveBeenCalledTimes(1);
    expect(disposeTex).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent loading requests to the same URL", async () => {
    const loadSpy = vi.fn();
    const mockLoader = createMockAssetLoader({
      delayMs: 20,
      mockDataFactory: (def) => {
        loadSpy();
        return { loadedDef: def };
      },
    });

    const manager = new AssetManager3D();
    manager.registerLoader(mockLoader);

    // Trigger two concurrent loads for the same asset
    const [res1, res2] = await Promise.all([
      manager.load("models/hero.glb"),
      manager.load("models/hero.glb"),
    ]);

    expect(res1).toBe(res2);
    expect(loadSpy).toHaveBeenCalledTimes(1); // Loaded only once!
  });

  it("supports AbortSignal cancellation", async () => {
    const manager = new AssetManager3D();
    const controller = new AbortController();

    const promise = manager.load("models/heavy.glb", {
      signal: controller.signal,
    });

    controller.abort();

    await expect(promise).rejects.toThrow("Asset loading was aborted.");
  });

  it("handles LRU cache eviction and reference counting", () => {
    const cache = new AssetCache3D({ maxEntries: 2 });

    cache.set("a", { id: "a", url: "a.glb", format: "glb", status: "loaded", refCount: 0, lastAccessedAt: 10, progress: 1 });
    cache.set("b", { id: "b", url: "b.glb", format: "glb", status: "loaded", refCount: 1, lastAccessedAt: 20, progress: 1 });

    // Inserting "c" should evict "a" (refCount 0 and oldest)
    cache.set("c", { id: "c", url: "c.glb", format: "glb", status: "loaded", refCount: 0, lastAccessedAt: 30, progress: 1 });

    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
  });

  it("discovers and preloads assets referenced in Scene3DSpecification", async () => {
    const sceneSpec: Scene3DSpecification = {
      id: "test-scene",
      version: "1.0.0",
      objects: [
        {
          id: "hero-character",
          type: "model",
          model: {
            url: "https://example.com/assets/hero.glb",
            format: "glb",
          },
        },
        {
          id: "ground",
          type: "primitive",
          geometry: { type: "plane", width: 10, height: 10 },
          material: {
            type: "standard",
            mapUrl: "https://example.com/textures/grass.png",
          },
        },
      ],
    };

    const assets = discoverSceneAssetReferences(sceneSpec);
    expect(assets.length).toBe(2);
    expect(assets.some((a) => a.url.includes("hero.glb"))).toBe(true);
    expect(assets.some((a) => a.url.includes("grass.png"))).toBe(true);

    const manager = new AssetManager3D();
    const preloadResult = await preloadSceneAssets(sceneSpec, { manager });
    expect(preloadResult.total).toBe(2);
    expect(preloadResult.loaded).toBe(2);
  });
});

describe("React Integration (useModel3D, useGeometry3D, Components)", () => {
  it("renders Model3DView and Geometry3DView in SSR environments without error", () => {
    const modelHtml = renderToString(
      createElement(Model3DView, {
        asset: "model.glb",
        fallback: createElement("span", null, "Loading model..."),
      })
    );
    expect(modelHtml).toContain("Loading model...");

    const geomHtml = renderToString(
      createElement(Geometry3DView, {
        descriptor: { type: "box", width: 2, height: 2, depth: 2 },
      })
    );
    expect(geomHtml).toContain('data-geometry-type="box"');
    expect(geomHtml).toContain('data-vertex-count="24"');
  });
});

describe("AI Motion Registry Discovery Integration", () => {
  it("provides available geometry types and model formats for AI agents", () => {
    const types = getAvailableGeometryTypes();
    expect(types.length).toBe(11);
    expect(types.some((t) => t.type === "box")).toBe(true);
    expect(types.some((t) => t.type === "rounded-box")).toBe(true);
    expect(types.some((t) => t.type === "extrude")).toBe(true);

    const boxParams = getGeometryParameters("box");
    expect(boxParams.found).toBe(true);

    const formats = getSupportedModelFormats();
    expect(formats.length).toBeGreaterThanOrEqual(5);
    expect(formats.some((f) => f.format === "glb")).toBe(true);
  });

  it("registers ASSET_3D_MANAGEMENT_CAPABILITY and GEOMETRY_3D_PROCEDURAL_CAPABILITY dynamically", () => {
    const mockRegistry = {
      capabilities: new Map<string, any>(),
      registerCapability(cap: any) {
        this.capabilities.set(cap.id, cap);
      },
    };

    register3DIntelligenceCapabilities(mockRegistry as any);

    expect(mockRegistry.capabilities.has(ASSET_3D_MANAGEMENT_CAPABILITY.id)).toBe(true);
    expect(mockRegistry.capabilities.has(GEOMETRY_3D_PROCEDURAL_CAPABILITY.id)).toBe(true);
  });
});
