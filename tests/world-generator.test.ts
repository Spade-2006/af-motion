import { describe, it, expect, vi } from "vitest";
import {
  createWorld3D,
  generateWorld3D,
  createWorldPreset,
  loadWorldChunk,
  unloadWorldChunk,
  updateWorldEnvironment,
  setWorldWeather,
  setWorldTime,
  getWorldBiome,
  sampleWorldHeight,
  sampleWorldWater,
  benchmarkWorldGeneration,
  disposeWorld3D,
  type World3D,
  type World3DConfig,
} from "../src/3d/world/index.js";
import {
  createWorldHydrology,
  createWorldPopulation,
  createWorldLighting,
  computeDayNightState,
  createWorldStreamingManager,
} from "../src/3d/world/index.js";
import { createPhysicsWorld3D, createCollider3D, createSphereShape, vec3 } from "../src/3d/physics/index.js";

describe("AF Motion — 3D Procedural World & Environment Generator", () => {
  // ==========================================================================
  // 1. World Generation & Pipeline Execution
  // ==========================================================================
  describe("World Generation Pipeline", () => {
    it("generates deterministic world with identical seed output", () => {
      const config: World3DConfig = {
        seed: "alpha-world-42",
        width: 120,
        length: 120,
        terrain: { resolutionX: 24, resolutionZ: 24, preset: "rolling-hills" },
      };

      const world1 = createWorld3D(config);
      const world2 = createWorld3D(config);

      expect(world1.id).toBeDefined();
      expect(world1.config.seed).toBe("alpha-world-42");
      expect(world1.sampleHeight(10, 10)).toBe(world2.sampleHeight(10, 10));
      expect(world1.sampleHeight(-20, 15)).toBe(world2.sampleHeight(-20, 15));
      expect(world1.population.instances.length).toBe(world2.population.instances.length);

      world1.dispose();
      world2.dispose();
    });

    it("tracks pipeline progress across all 12 stages", async () => {
      const stagesLogged: string[] = [];
      const onProgress = vi.fn((e) => {
        if (!stagesLogged.includes(e.stage)) {
          stagesLogged.push(e.stage);
        }
      });

      const world = await generateWorld3D(
        {
          width: 80,
          length: 80,
          terrain: { resolutionX: 16, resolutionZ: 16 },
        },
        { onProgress }
      );

      expect(onProgress).toHaveBeenCalled();
      expect(stagesLogged).toContain("seed-initialization");
      expect(stagesLogged).toContain("terrain-generation");
      expect(stagesLogged).toContain("biome-classification");
      expect(stagesLogged).toContain("hydrology-simulation");
      expect(stagesLogged).toContain("vegetation-population");
      expect(stagesLogged).toContain("lighting-atmosphere");
      expect(stagesLogged).toContain("scene-composition");

      world.dispose();
    });

    it("supports AbortSignal pipeline cancellation", async () => {
      const controller = new AbortController();
      controller.abort(); // Cancel immediately

      await expect(
        generateWorld3D(
          { width: 100, length: 100 },
          { signal: controller.signal }
        )
      ).rejects.toThrow("World generation pipeline cancelled");
    });
  });

  // ==========================================================================
  // 2. World Biomes & Environmental Variation
  // ==========================================================================
  describe("Biomes & Terrestrial Zones", () => {
    it("classifies biomes and exposes getWorldBiome helper", () => {
      const world = createWorld3D({
        width: 150,
        length: 150,
        terrain: { resolutionX: 32, resolutionZ: 32, preset: "mountain-ranges" },
      });

      const biomeCenter = getWorldBiome(world, 0, 0);
      expect(typeof biomeCenter).toBe("string");

      const biomeSample = world.sampleBiome(25, -25);
      expect(typeof biomeSample).toBe("string");

      world.dispose();
    });
  });

  // ==========================================================================
  // 3. Hydrology & Water Bodies
  // ==========================================================================
  describe("Hydrology & Water Systems", () => {
    it("simulates water bodies, rivers, and spatial water sampling", () => {
      const world = createWorld3D({
        width: 120,
        length: 120,
        hydrology: {
          seaLevel: 5.0,
          enableRivers: true,
          riverCount: 2,
        },
        terrain: { resolutionX: 24, resolutionZ: 24, preset: "mountain-ranges" },
      });

      expect(world.hydrology.waterBodies.length).toBeGreaterThan(0);
      expect(world.hydrology.meshBuffers.positions.length).toBeGreaterThan(0);
      expect(world.hydrology.meshBuffers.indices.length).toBeGreaterThan(0);

      const waterSample = sampleWorldWater(world, 0, 0);
      expect(typeof waterSample.inWater).toBe("boolean");
      expect(typeof waterSample.surfaceY).toBe("number");
      expect(typeof waterSample.depth).toBe("number");
      expect(waterSample.flow).toBeDefined();

      world.dispose();
    });
  });

  // ==========================================================================
  // 4. Clustered Population & Instanced GPU Batches
  // ==========================================================================
  describe("Vegetation & World Population", () => {
    it("populates clustered vegetation and generates packed 4x4 matrix buffers", () => {
      const world = createWorld3D({
        width: 100,
        length: 100,
        population: {
          autoClusterCount: 3,
        },
        terrain: { resolutionX: 20, resolutionZ: 20, preset: "rolling-hills" },
      });

      expect(world.population.instances.length).toBeGreaterThan(0);
      expect(world.population.clusters.length).toBe(3);

      // Verify instanced batches exist for GPU rendering
      const batches = world.population.instancedBatches;
      expect(batches.size).toBeGreaterThan(0);

      for (const [category, matrixBuffer] of batches.entries()) {
        expect(matrixBuffer.length % 16).toBe(0); // 16 floats per 4x4 matrix
      }

      world.dispose();
    });
  });

  // ==========================================================================
  // 5. World Lighting, Diurnal Arc & Atmosphere
  // ==========================================================================
  describe("Lighting & Day/Night Atmosphere", () => {
    it("computes solar tracking and daytime vs nighttime states", () => {
      const noon = computeDayNightState(12.0, 0.78, "clear");
      const midnight = computeDayNightState(0.0, 0.78, "clear");

      expect(noon.isDay).toBe(true);
      expect(noon.sunElevationDegrees).toBeGreaterThan(30);
      expect(noon.sunIntensity).toBeGreaterThan(0.8);

      expect(midnight.isDay).toBe(false);
      expect(midnight.sunElevationDegrees).toBeLessThan(0);
      expect(midnight.sunIntensity).toBeLessThan(0.2);
    });

    it("updates world lighting when time of day changes", () => {
      const world = createWorld3D({
        lighting: { initialTimeHours: 12.0 },
      });

      expect(world.timeOfDayHours).toBe(12.0);
      expect(world.lighting.dayNight.isDay).toBe(true);

      setWorldTime(world, 1.0); // 1:00 AM
      expect(world.timeOfDayHours).toBe(1.0);
      expect(world.lighting.dayNight.isDay).toBe(false);

      world.dispose();
    });

    it("reacts dynamically to weather state changes", () => {
      const world = createWorld3D();
      expect(world.environment.weather).toBe("clear");

      setWorldWeather(world, "rain");
      expect(world.environment.weather).toBe("rain");
      expect(world.lighting.dayNight.sunIntensity).toBeLessThan(1.0); // Rain clouds dim sunlight

      world.dispose();
    });
  });

  // ==========================================================================
  // 6. Physics Integration
  // ==========================================================================
  describe("Physics Integration", () => {
    it("attaches static heightfield collider to PhysicsWorld3D and simulates rigid body settling", () => {
      const physicsWorld = createPhysicsWorld3D({
        gravity: vec3(0, -9.81, 0),
      });

      const world = createWorld3D({
        width: 80,
        length: 80,
        terrain: { resolutionX: 16, resolutionZ: 16, preset: "flat" },
        physics: { world: physicsWorld },
      });

      expect(world.physicsWorld).toBe(physicsWorld);

      const groundY = sampleWorldHeight(world, 0, 0);

      // Add a dynamic sphere dropping onto procedural terrain
      const ball = physicsWorld.addBody({
        id: "test-ball",
        type: "dynamic",
        mass: 1.0,
        position: vec3(0, groundY + 4.0, 0),
        colliders: [createCollider3D(createSphereShape(0.5))],
      });

      // Step world simulation 60 frames (1 second)
      for (let i = 0; i < 60; i++) {
        world.update(1000 / 60);
      }

      // Ball falls and settles on terrain surface
      expect(ball.transform.position.y).toBeLessThan(groundY + 4.0);
      expect(ball.transform.position.y).toBeGreaterThanOrEqual(groundY + 0.3);

      world.dispose();
    });

    it("performs swept raycasting against procedural world", () => {
      const world = createWorld3D({
        width: 100,
        length: 100,
        terrain: { resolutionX: 20, resolutionZ: 20, preset: "rolling-hills" },
      });

      const hit = world.raycast(vec3(0, 100, 0), vec3(0, -1, 0), 200);

      expect(hit).not.toBeNull();
      expect(hit!.hit).toBe(true);
      expect(hit!.normal.y).toBeGreaterThan(0);

      world.dispose();
    });
  });

  // ==========================================================================
  // 7. World Chunking & Spatial Streaming
  // ==========================================================================
  describe("Streaming & Spatial Chunking", () => {
    it("lazily loads and unloads spatial chunks based on viewer distance", () => {
      const world = createWorld3D({
        width: 256,
        length: 256,
        streaming: { chunkSize: 64, viewRadiusChunks: 1, maxCachedChunks: 10 },
      });

      // Center chunk loading
      const chunk0 = loadWorldChunk(world, 0, 0);
      expect(chunk0).toBeDefined();
      expect(chunk0.cx).toBe(0);
      expect(chunk0.cz).toBe(0);
      expect(world.streaming.loadedChunks.has("0:0")).toBe(true);

      // Unload chunk
      unloadWorldChunk(world, 0, 0);
      expect(world.streaming.loadedChunks.has("0:0")).toBe(false);
      expect(world.streaming.cachedChunks.has("0:0")).toBe(true); // Moved to cache

      // Reloading retrieves from cache
      const reloaded = loadWorldChunk(world, 0, 0);
      expect(reloaded).toBe(chunk0);
      expect(world.streaming.loadedChunks.has("0:0")).toBe(true);

      // Update viewer position to stream surrounding chunks
      world.streaming.updateViewerPosition(vec3(128, 0, 128));
      expect(world.streaming.loadedChunks.size).toBeGreaterThan(0);

      world.dispose();
    });
  });

  // ==========================================================================
  // 8. World Presets
  // ==========================================================================
  describe("World Presets", () => {
    const presets = [
      "alpine-landscape",
      "dense-forest",
      "desert-world",
      "tropical-island",
      "snow-mountains",
      "rolling-grasslands",
      "volcanic-landscape",
      "fantasy-world",
    ] as const;

    for (const preset of presets) {
      it(`initializes preset "${preset}" cleanly`, () => {
        const config = createWorldPreset(preset, {
          width: 80,
          length: 80,
          terrain: { resolutionX: 16, resolutionZ: 16 },
        });

        const world = createWorld3D(config);

        expect(world.config.preset).toBe(preset);
        expect(world.terrain).toBeDefined();
        expect(world.hydrology).toBeDefined();
        expect(world.population).toBeDefined();
        expect(world.lighting).toBeDefined();
        expect(world.environment).toBeDefined();

        world.dispose();
      });
    }
  });

  // ==========================================================================
  // 9. Benchmarking & Lifecycle Management
  // ==========================================================================
  describe("Benchmarking & Lifecycle", () => {
    it("benchmarks world generation timing and geometry stats", () => {
      const benchmark = benchmarkWorldGeneration({
        width: 100,
        length: 100,
        terrain: { resolutionX: 20, resolutionZ: 20 },
      });

      expect(benchmark.totalGenerationTimeMs).toBeGreaterThan(0);
      expect(benchmark.totalVertices).toBeGreaterThan(0);
      expect(benchmark.totalTriangles).toBeGreaterThan(0);
      expect(Object.keys(benchmark.stageTimesMs).length).toBe(12);
    });

    it("handles multiple concurrent worlds and clean teardown", () => {
      const w1 = createWorld3D({ id: "w1", width: 60, length: 60, terrain: { resolutionX: 16, resolutionZ: 16 } });
      const w2 = createWorld3D({ id: "w2", width: 60, length: 60, terrain: { resolutionX: 16, resolutionZ: 16 } });

      expect(w1.id).toBe("w1");
      expect(w2.id).toBe("w2");

      w1.pause();
      w1.update(100); // Paused world skips update
      w1.resume();

      disposeWorld3D(w1);
      disposeWorld3D(w2);

      expect(w1.streaming.loadedChunks.size).toBe(0);
      expect(w2.streaming.loadedChunks.size).toBe(0);
    });
  });
});
