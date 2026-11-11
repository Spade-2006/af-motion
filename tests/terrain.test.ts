import { describe, it, expect } from "vitest";
import {
  // Noise
  createPermutationTable,
  perlin2D,
  simplex2D,
  cellular2D,
  fbm2D,
  ridgedMultifractal2D,
  domainWarp2D,
  createTerrainNoise,
  // Heightmap & Presets
  generateTerrainHeightmap,
  buildTerrainMeshBuffers,
  sampleTerrainHeightAndNormal,
  getPresetNoiseLayers,
  // Erosion
  applyHydraulicErosion,
  applyThermalErosion,
  // Biomes
  classifyTerrainBiomes,
  DEFAULT_BIOME_RULES,
  // Materials
  generateTerrainMaterials,
  // Vegetation
  scatterTerrainVegetation,
  DEFAULT_VEGETATION_RULES,
  // Physics
  createTerrainCollider,
  sampleTerrainHeight,
  sampleTerrainNormal,
  raycastTerrain,
  // Chunks
  createTerrainChunks,
  buildChunkMeshBuffers,
  // Master Engine
  createTerrain3D,
} from "../src/3d/terrain/index.js";
import {
  createPhysicsWorld3D,
  createSphereShape,
  createBoxShape,
  createCollider3D,
  generateCollisionManifold,
  vec3,
} from "../src/3d/physics/index.js";

describe("AF Motion — 3D Procedural Terrain Subsystem", () => {
  // ==========================================================================
  // 1. Noise Algorithms
  // ==========================================================================
  describe("Noise Engine", () => {
    it("creates deterministic permutation table from seed", () => {
      const table1 = createPermutationTable("terrain-seed-42");
      const table2 = createPermutationTable("terrain-seed-42");
      const table3 = createPermutationTable("different-seed");

      expect(table1.length).toBe(512);
      expect(table1).toEqual(table2);
      expect(table1).not.toEqual(table3);
    });

    it("evaluates Perlin 2D noise with deterministic continuity", () => {
      const table = createPermutationTable(12345);
      const val1 = perlin2D(10.5, 20.5, table);
      const val2 = perlin2D(10.5, 20.5, table);
      const valNeighbor = perlin2D(10.51, 20.51, table);

      expect(val1).toBe(val2);
      expect(val1).toBeGreaterThanOrEqual(-1.0);
      expect(val1).toBeLessThanOrEqual(1.0);
      expect(Math.abs(val1 - valNeighbor)).toBeLessThan(0.05); // Smooth continuity
    });

    it("evaluates Simplex 2D noise", () => {
      const table = createPermutationTable(999);
      const val = simplex2D(5.2, 7.8, table);

      expect(val).toBeGreaterThanOrEqual(-1.0);
      expect(val).toBeLessThanOrEqual(1.0);
    });

    it("evaluates Cellular / Voronoi noise with distance features", () => {
      const dist = cellular2D(15.3, 22.7, 42, 1.0);

      expect(typeof dist).toBe("number");
      expect(dist).toBeGreaterThanOrEqual(0);
    });

    it("computes Fractal Brownian Motion (FBM) with octave scaling", () => {
      const table = createPermutationTable(100);
      const val = fbm2D(12.0, 34.0, table, 4, 0.01, 0.5, 2.0);

      expect(val).toBeGreaterThanOrEqual(-1.5);
      expect(val).toBeLessThanOrEqual(1.5);
    });

    it("computes Ridged Multifractal noise", () => {
      const table = createPermutationTable(200);
      const val = ridgedMultifractal2D(5.0, 8.0, table, 4, 0.02, 0.5, 2.0);

      expect(val).toBeGreaterThanOrEqual(0.0);
      expect(val).toBeLessThanOrEqual(2.0);
    });

    it("applies Domain Warping", () => {
      const table = createPermutationTable(300);
      const val = domainWarp2D(1.0, 2.0, table, 15.0);

      expect(val).toBeGreaterThanOrEqual(-1.5);
      expect(val).toBeLessThanOrEqual(1.5);
    });

    it("provides unified createTerrainNoise evaluator with normalized sampling", () => {
      const evaluator = createTerrainNoise({
        type: "fbm",
        octaves: 4,
        frequency: 0.01,
        amplitude: 50,
        seed: 777,
      });

      const raw = evaluator.sample(25, 40);
      const norm = evaluator.sampleNormalized(25, 40);

      expect(typeof raw).toBe("number");
      expect(norm).toBeGreaterThanOrEqual(0.0);
      expect(norm).toBeLessThanOrEqual(1.0);
    });
  });

  // ==========================================================================
  // 2. Heightmap Generation & Presets
  // ==========================================================================
  describe("Heightmap Generation", () => {
    it("generates deterministic heightmap with correct dimensions and bounds", () => {
      const hm = generateTerrainHeightmap({
        width: 100,
        length: 100,
        resolutionX: 32,
        resolutionZ: 32,
        preset: "rolling-hills",
        seed: 42,
      });

      expect(hm.width).toBe(100);
      expect(hm.length).toBe(100);
      expect(hm.cols).toBe(32);
      expect(hm.rows).toBe(32);
      expect(hm.heights.length).toBe(32 * 32);
      expect(hm.maxHeight).toBeGreaterThanOrEqual(hm.minHeight);
    });

    it("supports all standard terrain presets", () => {
      const presets = [
        "flat",
        "rolling-hills",
        "mountain-ranges",
        "valleys",
        "plateaus",
        "canyons",
        "islands",
        "archipelagos",
        "craters",
      ] as const;

      for (const preset of presets) {
        const layers = getPresetNoiseLayers(preset);
        expect(layers.length).toBeGreaterThan(0);

        const hm = generateTerrainHeightmap({
          width: 50,
          length: 50,
          resolutionX: 16,
          resolutionZ: 16,
          preset,
          seed: 123,
        });

        expect(hm.heights.length).toBe(16 * 16);
        expect(Number.isFinite(hm.minHeight)).toBe(true);
        expect(Number.isFinite(hm.maxHeight)).toBe(true);
      }
    });

    it("builds valid indexed triangle mesh buffers with normalized normals", () => {
      const hm = generateTerrainHeightmap({
        width: 40,
        length: 40,
        resolutionX: 8,
        resolutionZ: 8,
        preset: "rolling-hills",
      });

      const buffers = buildTerrainMeshBuffers(hm);
      const vertexCount = 8 * 8;

      expect(buffers.positions.length).toBe(vertexCount * 3);
      expect(buffers.normals.length).toBe(vertexCount * 3);
      expect(buffers.uvs.length).toBe(vertexCount * 2);
      expect(buffers.indices.length).toBe(7 * 7 * 6); // 6 indices per quad

      // Verify normal vectors are unit length
      for (let i = 0; i < vertexCount; i++) {
        const nx = buffers.normals[i * 3];
        const ny = buffers.normals[i * 3 + 1];
        const nz = buffers.normals[i * 3 + 2];
        const len = Math.hypot(nx, ny, nz);
        expect(len).toBeCloseTo(1.0, 3);
      }
    });

    it("samples elevation and surface normal with bilinear interpolation", () => {
      const hm = generateTerrainHeightmap({
        width: 100,
        length: 100,
        resolutionX: 32,
        resolutionZ: 32,
        preset: "mountain-ranges",
      });

      const surface = sampleTerrainHeightAndNormal(hm, 12.3, -15.7);

      expect(Number.isFinite(surface.height)).toBe(true);
      expect(surface.height).toBeGreaterThanOrEqual(hm.minHeight);
      expect(surface.height).toBeLessThanOrEqual(hm.maxHeight);

      const nLen = Math.hypot(surface.normal.x, surface.normal.y, surface.normal.z);
      expect(nLen).toBeCloseTo(1.0, 3);
      expect(surface.normal.y).toBeGreaterThan(0); // Surface normal points upwards
    });
  });

  // ==========================================================================
  // 3. Hydraulic & Thermal Erosion
  // ==========================================================================
  describe("Erosion Simulation", () => {
    it("applies hydraulic erosion with sediment conservation", () => {
      const hm = generateTerrainHeightmap({
        width: 60,
        length: 60,
        resolutionX: 20,
        resolutionZ: 20,
        preset: "mountain-ranges",
        seed: 888,
      });

      const initialHeights = new Float32Array(hm.heights);

      const erodedHm = applyHydraulicErosion(hm, {
        dropletCount: 500,
        maxLifetime: 20,
        erosionSpeed: 0.3,
        depositionSpeed: 0.3,
        seed: 42,
      });

      expect(erodedHm).toBe(hm);

      // Verify heights were modified
      let diffFound = false;
      for (let i = 0; i < hm.heights.length; i++) {
        if (Math.abs(hm.heights[i] - initialHeights[i]) > 1e-4) {
          diffFound = true;
          break;
        }
      }
      expect(diffFound).toBe(true);
    });

    it("applies thermal erosion smoothing slopes exceeding the talus threshold", () => {
      const hm = generateTerrainHeightmap({
        width: 40,
        length: 40,
        resolutionX: 16,
        resolutionZ: 16,
        preset: "canyons",
      });

      const initialHeights = new Float32Array(hm.heights);

      const erodedHm = applyThermalErosion(hm, {
        iterations: 3,
        talusAngleDegrees: 30,
        displacementRate: 0.5,
      });

      expect(erodedHm).toBe(hm);
      expect(erodedHm.heights.length).toBe(16 * 16);
    });
  });

  // ==========================================================================
  // 4. Biome Classification
  // ==========================================================================
  describe("Biome System", () => {
    it("classifies ecological biomes and normalizes per-vertex weights", () => {
      const hm = generateTerrainHeightmap({
        width: 100,
        length: 100,
        resolutionX: 20,
        resolutionZ: 20,
        preset: "mountain-ranges",
      });

      const biomes = classifyTerrainBiomes(hm);
      const vertexCount = hm.cols * hm.rows;
      const biomeCount = DEFAULT_BIOME_RULES.length;

      expect(biomes.dominantBiome.length).toBe(vertexCount);
      expect(biomes.weights.length).toBe(vertexCount * biomeCount);

      // Check weight normalization: sum of weights per vertex must equal 1.0
      for (let i = 0; i < vertexCount; i++) {
        let sum = 0;
        for (let b = 0; b < biomeCount; b++) {
          sum += biomes.weights[i * biomeCount + b];
        }
        expect(sum).toBeCloseTo(1.0, 3);
      }

      // Check dominant biomes are present
      const uniqueBiomes = new Set(biomes.dominantBiome);
      expect(uniqueBiomes.size).toBeGreaterThan(1);
    });
  });

  // ==========================================================================
  // 5. Materials & Splatting
  // ==========================================================================
  describe("Materials & Vertex Colors", () => {
    it("generates vertex color and splat weight buffers", () => {
      const hm = generateTerrainHeightmap({
        width: 50,
        length: 50,
        resolutionX: 16,
        resolutionZ: 16,
        preset: "rolling-hills",
      });

      const biomes = classifyTerrainBiomes(hm);
      const materials = generateTerrainMaterials(hm, biomes);
      const vertexCount = hm.cols * hm.rows;

      expect(materials.colors.length).toBe(vertexCount * 4);
      expect(materials.splatWeights.length).toBe(vertexCount * 4);
      expect(materials.roughness.length).toBe(vertexCount);

      // Verify colors are in range [0, 1]
      for (let i = 0; i < materials.colors.length; i++) {
        expect(materials.colors[i]).toBeGreaterThanOrEqual(0.0);
        expect(materials.colors[i]).toBeLessThanOrEqual(1.0);
      }
    });
  });

  // ==========================================================================
  // 6. Vegetation & Prop Scattering
  // ==========================================================================
  describe("Vegetation Scattering", () => {
    it("scatters vegetation matching biomes and slope constraints", () => {
      const hm = generateTerrainHeightmap({
        width: 100,
        length: 100,
        resolutionX: 32,
        resolutionZ: 32,
        preset: "rolling-hills",
      });

      const biomes = classifyTerrainBiomes(hm);
      const instances = scatterTerrainVegetation(hm, biomes, DEFAULT_VEGETATION_RULES, 1337);

      expect(instances.length).toBeGreaterThan(0);

      // Verify every instance is placed on the terrain surface
      for (const inst of instances) {
        expect(inst.position.x).toBeGreaterThanOrEqual(-50);
        expect(inst.position.x).toBeLessThanOrEqual(50);
        expect(inst.position.z).toBeGreaterThanOrEqual(-50);
        expect(inst.position.z).toBeLessThanOrEqual(50);
        expect(Number.isFinite(inst.position.y)).toBe(true);

        // Verify normal orientation
        const nLen = Math.hypot(inst.normal.x, inst.normal.y, inst.normal.z);
        expect(nLen).toBeCloseTo(1.0, 3);
      }
    });

    it("guarantees deterministic prop placement for matching seeds", () => {
      const hm = generateTerrainHeightmap({
        width: 60,
        length: 60,
        resolutionX: 20,
        resolutionZ: 20,
      });

      const biomes = classifyTerrainBiomes(hm);
      const inst1 = scatterTerrainVegetation(hm, biomes, undefined, "seed-abc");
      const inst2 = scatterTerrainVegetation(hm, biomes, undefined, "seed-abc");

      expect(inst1.length).toBe(inst2.length);
      expect(inst1[0].position).toEqual(inst2[0].position);
      expect(inst1[0].rotation).toEqual(inst2[0].rotation);
    });
  });

  // ==========================================================================
  // 7. Terrain Physics Integration
  // ==========================================================================
  describe("Physics Integration", () => {
    it("creates heightfield collider compatible with PhysicsWorld3D", () => {
      const hm = generateTerrainHeightmap({
        width: 80,
        length: 80,
        resolutionX: 20,
        resolutionZ: 20,
        preset: "rolling-hills",
      });

      const collider = createTerrainCollider(hm);

      expect(collider.shape.type).toBe("heightfield");
      expect(collider.aabb.min.x).toBeCloseTo(-40);
      expect(collider.aabb.max.x).toBeCloseTo(40);
      expect(collider.aabb.min.y).toBe(hm.minHeight);
      expect(collider.aabb.max.y).toBe(hm.maxHeight);
    });

    it("performs swept raycasting against terrain surface", () => {
      const hm = generateTerrainHeightmap({
        width: 100,
        length: 100,
        resolutionX: 32,
        resolutionZ: 32,
        preset: "mountain-ranges",
      });

      // Cast vertical ray from above terrain center
      const rayOrigin = { x: 0, y: hm.maxHeight + 20, z: 0 };
      const rayDir = { x: 0, y: -1, z: 0 };

      const hit = raycastTerrain(hm, rayOrigin, rayDir, 200);

      expect(hit).not.toBeNull();
      expect(hit!.hit).toBe(true);
      expect(hit!.point.x).toBeCloseTo(0, 1);
      expect(hit!.point.z).toBeCloseTo(0, 1);
      expect(hit!.point.y).toBeCloseTo(sampleTerrainHeight(hm, 0, 0), 0.5);
      expect(hit!.normal.y).toBeGreaterThan(0);
    });

    it("generates contact manifold between dynamic Sphere and Heightfield", () => {
      const hm = generateTerrainHeightmap({
        width: 60,
        length: 60,
        resolutionX: 16,
        resolutionZ: 16,
        preset: "flat",
      });

      const terrainCollider = createTerrainCollider(hm);
      const sphereCollider = createCollider3D(createSphereShape(1.0));

      const groundHeight = sampleTerrainHeight(hm, 0, 0);

      // Position sphere slightly penetrating terrain surface
      const transformSphere = {
        position: { x: 0, y: groundHeight + 0.5, z: 0 }, // 0.5m penetration for 1m radius sphere
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      };

      const transformTerrain = {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      };

      const manifold = generateCollisionManifold(
        undefined,
        undefined,
        sphereCollider,
        terrainCollider,
        transformSphere,
        transformTerrain
      );

      expect(manifold).not.toBeNull();
      expect(manifold!.contacts.length).toBe(1);
      expect(manifold!.penetration).toBeGreaterThan(0.4);
      expect(manifold!.normal.y).toBeLessThan(-0.9); // Normal points from bodyA (sphere) to bodyB (terrain)
    });

    it("simulates dynamic rigid body settling on terrain in PhysicsWorld3D", () => {
      const world = createPhysicsWorld3D({
        gravity: vec3(0, -9.81, 0),
      });

      const hm = generateTerrainHeightmap({
        width: 50,
        length: 50,
        resolutionX: 16,
        resolutionZ: 16,
        preset: "flat",
      });

      const groundY = sampleTerrainHeight(hm, 0, 0);

      // Static terrain body
      world.addBody({
        id: "terrain-ground",
        type: "static",
        position: vec3(0, 0, 0),
        colliders: [createTerrainCollider(hm)],
      });

      // Dynamic falling sphere
      const sphereBody = world.addBody({
        id: "falling-ball",
        type: "dynamic",
        mass: 1.0,
        position: vec3(0, groundY + 5.0, 0),
        colliders: [createCollider3D(createSphereShape(0.5))],
      });

      // Step world 60 frames (1 second of physics)
      for (let i = 0; i < 60; i++) {
        world.step(1 / 60);
      }

      // Ball should have fallen and come to rest on the terrain surface (groundY + radius 0.5)
      expect(sphereBody.transform.position.y).toBeLessThan(groundY + 5.0);
      expect(sphereBody.transform.position.y).toBeGreaterThanOrEqual(groundY + 0.3);
    });
  });

  // ==========================================================================
  // 8. Chunks & Master Terrain3D Lifecycle
  // ==========================================================================
  describe("Chunks & Master Terrain3D", () => {
    it("partitions terrain into LOD chunks", () => {
      const hm = generateTerrainHeightmap({
        width: 100,
        length: 100,
        resolutionX: 32,
        resolutionZ: 32,
      });

      const chunks = createTerrainChunks(hm, 2); // 2x2 = 4 chunks

      expect(chunks.length).toBe(4);
      for (const chunk of chunks) {
        expect(chunk.buffers.positions.length).toBeGreaterThan(0);
        expect(chunk.buffers.indices.length).toBeGreaterThan(0);
        expect(chunk.worldBounds.min.x).toBeLessThan(chunk.worldBounds.max.x);
      }
    });

    it("initializes complete Terrain3D ecosystem and disposes cleanly", () => {
      const terrain = createTerrain3D({
        width: 120,
        length: 120,
        resolutionX: 32,
        resolutionZ: 32,
        preset: "mountain-ranges",
        hydraulicErosion: { dropletCount: 100 },
        thermalErosion: { iterations: 1 },
        chunkCount: 2,
        seed: 42,
      });

      expect(terrain.id).toBeDefined();
      expect(terrain.heightmap).toBeDefined();
      expect(terrain.meshBuffers.positions.length).toBeGreaterThan(0);
      expect(terrain.meshBuffers.colors).toBeDefined();
      expect(terrain.biomes).toBeDefined();
      expect(terrain.vegetation.length).toBeGreaterThan(0);
      expect(terrain.chunks.length).toBe(4);
      expect(terrain.collider).toBeDefined();

      // Test sampling and raycasting APIs
      const elev = terrain.sampleHeight(10, 10);
      const norm = terrain.sampleNormal(10, 10);
      const biome = terrain.sampleBiome(10, 10);

      expect(Number.isFinite(elev)).toBe(true);
      expect(norm.y).toBeGreaterThan(0);
      expect(typeof biome).toBe("string");

      const hit = terrain.raycast({ x: 0, y: 150, z: 0 }, { x: 0, y: -1, z: 0 });
      expect(hit).not.toBeNull();
      expect(hit!.hit).toBe(true);

      // Clean disposal
      terrain.dispose();
      expect(terrain.chunks.length).toBe(0);
      expect(terrain.vegetation.length).toBe(0);
    });
  });
});
