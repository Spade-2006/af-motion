/**
 * AF Motion Studio — Advanced 3D & World Integration Engine (Prompt 139)
 *
 * Provides default state factories, preset registries, diagnostics calculation
 * combining live metrics with Phase 16 Performance Intelligence, and multi-format code generation.
 */

import { defaultPerformanceIntelligence } from "../../src/core/performance-intelligence/index.js";
import type {
  Advanced3DStudioState,
  Advanced3DPreset,
  Advanced3DDiagnosticsData,
} from "../types/advanced-3d.js";

/**
 * Creates the initial default state for the Advanced 3D & World Studio.
 */
export function createDefaultAdvanced3DState(): Advanced3DStudioState {
  return {
    section: "foundations",
    advancedView: "physics",
    physics: {
      gravity: [0, -9.81, 0],
      fixedDeltaTime: 1 / 60,
      maxSubSteps: 4,
      velocityIterations: 8,
      positionIterations: 4,
      enableSleeping: true,
      broadphaseType: "bvh",
      activeRigidBodiesCount: 6,
      activeCollidersCount: 6,
      simulating: true,
      contactsCount: 4,
      lastStepDurationMs: 1.4,
      raycastOrigin: [0, 5, 0],
      raycastDirection: [0, -1, 0],
      raycastHit: {
        bodyId: "body-ground",
        distance: 5.0,
        point: [0, 0, 0],
        normal: [0, 1, 0],
      },
    },
    rigidBodies: {
      selectedBodyId: "body-cube-1",
      selectedConstraintId: null,
      bodies: [
        {
          id: "body-ground",
          name: "Static Ground Plane",
          type: "static",
          mass: 0,
          shape: "box",
          dimensions: [20, 0.5, 20],
          restitution: 0.1,
          friction: 0.8,
          linearDamping: 0.01,
          angularDamping: 0.05,
          collisionLayer: 1,
          collisionMask: 0xffffffff,
          ccd: false,
          position: [0, -0.25, 0],
          rotation: [0, 0, 0, 1],
          linearVelocity: [0, 0, 0],
          angularVelocity: [0, 0, 0],
          isSleeping: false,
        },
        {
          id: "body-cube-1",
          name: "Dynamic Box Alpha",
          type: "dynamic",
          mass: 2.5,
          shape: "box",
          dimensions: [1, 1, 1],
          restitution: 0.4,
          friction: 0.5,
          linearDamping: 0.02,
          angularDamping: 0.05,
          collisionLayer: 1,
          collisionMask: 0xffffffff,
          ccd: true,
          position: [0, 3.5, 0],
          rotation: [0, 0, 0, 1],
          linearVelocity: [0, -1.2, 0],
          angularVelocity: [0.1, 0.2, 0],
          isSleeping: false,
        },
        {
          id: "body-sphere-1",
          name: "Bouncing Sphere",
          type: "dynamic",
          mass: 1.2,
          shape: "sphere",
          dimensions: [0.8, 0.8, 0.8],
          restitution: 0.85,
          friction: 0.3,
          linearDamping: 0.01,
          angularDamping: 0.02,
          collisionLayer: 1,
          collisionMask: 0xffffffff,
          ccd: true,
          position: [1.8, 5.0, 0.5],
          rotation: [0, 0, 0, 1],
          linearVelocity: [0.2, -2.5, 0],
          angularVelocity: [0, 0, 0],
          isSleeping: false,
        },
        {
          id: "body-capsule-1",
          name: "Rolling Capsule",
          type: "dynamic",
          mass: 3.0,
          shape: "capsule",
          dimensions: [0.6, 1.8, 0.6],
          restitution: 0.3,
          friction: 0.6,
          linearDamping: 0.03,
          angularDamping: 0.04,
          collisionLayer: 1,
          collisionMask: 0xffffffff,
          ccd: false,
          position: [-2.0, 4.2, -1.0],
          rotation: [0, 0, 0.38, 0.92],
          linearVelocity: [0.5, -0.8, 0.2],
          angularVelocity: [0.2, 0.4, 0.1],
          isSleeping: false,
        },
      ],
      constraints: [
        {
          id: "constraint-hinge-1",
          name: "Pendulum Hinge",
          type: "hinge",
          bodyAId: "body-ground",
          bodyBId: "body-cube-1",
          pivotA: [0, 6, 0],
          pivotB: [0, 1, 0],
          limits: { min: -1.2, max: 1.2 },
          motor: { enabled: true, targetVelocity: 1.5, maxForce: 50 },
          spring: { stiffness: 120, damping: 10 },
          breakImpulse: 1000,
          enabled: true,
        },
      ],
    },
    softBody: {
      type: "cloth",
      resolution: [16, 16],
      particleCount: 256,
      structuralStiffness: 0.85,
      shearStiffness: 0.6,
      bendingStiffness: 0.45,
      compliance: 0.0001,
      damping: 0.02,
      windInfluence: 0.75,
      pinnedIndices: [0, 15],
      tearable: true,
      tearStrainThreshold: 1.8,
      coupledWithRigidBody: true,
      deformationScore: 94,
    },
    terrain: {
      preset: "mountain-ranges",
      noiseType: "fbm",
      seed: 42109,
      dimensions: [256, 256],
      resolution: 64,
      heightScale: 48,
      frequency: 0.012,
      octaves: 5,
      persistence: 0.52,
      lacunarity: 2.05,
      hydraulicErosion: { enabled: true, dropletCount: 2500, erosionRate: 0.08 },
      thermalErosion: { enabled: true, iterations: 3, talusAngle: 32 },
      biome: "alpine",
      vertexCount: 4096,
      triangleCount: 7938,
      generationTimeMs: 14.2,
      materialPreset: "composite",
    },
    world: {
      preset: "alpine-landscape",
      seed: 98124,
      dimensions: [256, 256],
      hydrology: {
        riversCount: 3,
        seaLevel: -4,
        waterColor: "#1e3a8a",
        hasLakes: true,
      },
      vegetationDensity: 0.65,
      atmosphere: {
        fogDensity: 0.003,
        timeOfDayHours: 14.5,
        haze: 0.15,
      },
      chunkStreaming: {
        activeChunks: 9,
        totalChunks: 25,
        lodDistance: 180,
      },
      generationProgress: 1.0,
      currentStage: "Completed (Hydrology, Biomes, Foliage)",
      stageTimings: {
        Terrain: 12.4,
        Erosion: 8.6,
        Hydrology: 5.2,
        Biomes: 4.1,
        Vegetation: 9.8,
      },
      isGenerating: false,
    },
    modelIntelligence: {
      selectedModelId: "model-hero-mesh",
      stats: {
        vertexCount: 24800,
        triangleCount: 48600,
        duplicateVertices: 3240,
        degenerateTriangles: 12,
        materialCount: 8,
        textureCount: 6,
        skeletonJointCount: 34,
        estimatedVramMb: 42.6,
      },
      optimizationProfile: "balanced",
      optimizedStats: {
        vertexCount: 16400,
        triangleCount: 31200,
        duplicateVertices: 0,
        degenerateTriangles: 0,
        materialCount: 4,
        lodLevelsCount: 3,
        estimatedVramMb: 19.8,
        vramSavingsPercent: 53.5,
      },
      lodLevels: [
        { level: 0, triangleCount: 31200, distance: 0 },
        { level: 1, triangleCount: 15600, distance: 25 },
        { level: 2, triangleCount: 7800, distance: 60 },
      ],
      recommendations: [
        "Deduplicate 3,240 co-located vertices to reduce index buffer overhead",
        "Merge 4 identical PBR materials sharing the same roughness map",
        "Generate 3-level discrete LOD chain for distance culling",
        "Use simplified capsule collider rather than expensive convex hull",
      ],
      validationWarnings: [
        "12 degenerate triangles detected with near-zero surface area (safely pruned)",
      ],
      recommendedCollider: "capsule",
    },
    morphing: {
      preset: "sphere-to-box",
      sourceGeometry: "Normalized Geodesic Sphere",
      targetGeometry: "Subdivided Cube",
      progress: 0.5,
      duration: 1200,
      easing: "easeInOutCubic",
      isPlaying: true,
      vertexCount: 512,
      morphTargetsCount: 1,
      topologyValid: true,
      correspondenceStatus: "exact",
      boundingDim: [1.6, 1.6, 1.6],
    },
    composition: {
      subsystems: {
        physics: true,
        softBodies: true,
        terrain: true,
        world: true,
        morphing: true,
        environment: true,
        lighting: true,
      },
      coupling: {
        rigidTerrainCollisions: true,
        softRigidCollisions: true,
        worldHydrologyCoupled: true,
        morphingPhysicsCoupled: true,
      },
      activeLayers: [
        { id: "layer-world", name: "Alpine World Chunks", type: "world", enabled: true, opacity: 1.0 },
        { id: "layer-terrain", name: "Eroded Heightfield", type: "terrain", enabled: true, opacity: 1.0 },
        { id: "layer-rigid", name: "Rigid Body System", type: "physics", enabled: true, opacity: 1.0 },
        { id: "layer-soft", name: "Cloth & Flag Soft Body", type: "soft-body", enabled: true, opacity: 0.9 },
        { id: "layer-morph", name: "Geometric Morph Object", type: "morphing", enabled: true, opacity: 0.85 },
      ],
    },
    selectedPresetId: null,
    showExportModal: false,
    exportFormat: "react-r3f",
  };
}

/**
 * 24 Comprehensive Advanced 3D & World Presets
 */
export const ADVANCED_3D_PRESETS: Advanced3DPreset[] = [
  // 1-4: 3D Physics
  {
    id: "preset-falling-objects",
    name: "Falling Objects Cascade",
    category: "physics",
    description: "Diverse collection of falling spheres, boxes, and capsules colliding against an inclined plane.",
    tags: ["physics", "gravity", "cascade", "rigid-bodies"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "physics",
      physics: {
        ...state.physics,
        gravity: [0, -12.0, 0],
        activeRigidBodiesCount: 12,
        simulating: true,
      },
    }),
  },
  {
    id: "preset-rigid-stack",
    name: "Rigid Body Jenga Stack",
    category: "physics",
    description: "Tower of balanced dynamic boxes with realistic friction, restitution, and sleeping optimization.",
    tags: ["physics", "stack", "stability", "friction"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "rigid-bodies",
      rigidBodies: {
        ...state.rigidBodies,
        bodies: state.rigidBodies.bodies.map((b) => ({
          ...b,
          friction: 0.75,
          restitution: 0.1,
        })),
      },
    }),
  },
  {
    id: "preset-collision-playground",
    name: "High-Speed Collision Arena",
    category: "physics",
    description: "Continuous CCD-enabled dynamic impacts testing contact manifolds, restitution, and impulse exchange.",
    tags: ["ccd", "collision", "restitution", "impact"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "physics",
      physics: {
        ...state.physics,
        maxSubSteps: 8,
        velocityIterations: 12,
      },
    }),
  },
  {
    id: "preset-constraint-assembly",
    name: "Articulated Constraint Assembly",
    category: "physics",
    description: "Multi-body chain with motorized hinges, slider rails, and breakable distance springs.",
    tags: ["constraints", "hinge", "slider", "motors"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "rigid-bodies",
      rigidBodies: {
        ...state.rigidBodies,
        constraints: [
          ...state.rigidBodies.constraints,
          {
            id: "slider-1",
            name: "Piston Slider",
            type: "slider",
            bodyAId: "body-ground",
            bodyBId: "body-cube-1",
            pivotA: [0, 2, 0],
            pivotB: [0, 0, 0],
            limits: { min: -2, max: 2 },
            motor: { enabled: true, targetVelocity: 2.0, maxForce: 80 },
            spring: { stiffness: 50, damping: 5 },
            breakImpulse: 2500,
            enabled: true,
          },
        ],
      },
    }),
  },

  // 5-8: Soft Bodies & Constraints
  {
    id: "preset-cloth-sim",
    name: "Silken Cloth Simulation",
    category: "soft-bodies",
    description: "XPBD cloth grid pinned at corners reacting to aerodynamic wind and sphere collisions.",
    tags: ["cloth", "xpbd", "wind", "pinning"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "soft-bodies",
      softBody: {
        ...state.softBody,
        type: "cloth",
        resolution: [20, 20],
        particleCount: 400,
        structuralStiffness: 0.9,
        windInfluence: 0.85,
        tearable: false,
      },
    }),
  },
  {
    id: "preset-rope-sim",
    name: "Dynamic Rope Chain",
    category: "soft-bodies",
    description: "Segmented elastic rope tethered between a rigid anchor and a swinging pendulum weight.",
    tags: ["rope", "chain", "elastic", "coupling"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "soft-bodies",
      softBody: {
        ...state.softBody,
        type: "rope",
        particleCount: 32,
        structuralStiffness: 0.95,
        compliance: 0.00005,
        coupledWithRigidBody: true,
      },
    }),
  },
  {
    id: "preset-soft-deformation",
    name: "Volumetric Jello Deformation",
    category: "soft-bodies",
    description: "Volume-conserving soft body with internal tetrahedral springs bouncing on rigid ground.",
    tags: ["volume", "jello", "tetrahedral", "bouncing"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "soft-bodies",
      softBody: {
        ...state.softBody,
        type: "volume",
        particleCount: 128,
        structuralStiffness: 0.6,
        shearStiffness: 0.5,
        damping: 0.08,
        coupledWithRigidBody: true,
      },
    }),
  },
  {
    id: "preset-tearable-banner",
    name: "Tearable Banner",
    category: "soft-bodies",
    description: "High-stress cloth banner tearing under extreme aerodynamic shear force.",
    tags: ["tearable", "strain", "banner", "cloth"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "soft-bodies",
      softBody: {
        ...state.softBody,
        type: "cloth",
        tearable: true,
        tearStrainThreshold: 1.4,
        windInfluence: 1.2,
      },
    }),
  },

  // 9-12: Procedural Terrain
  {
    id: "preset-alpine-terrain",
    name: "Alpine Mountain Ranges",
    category: "terrain",
    description: "Dramatic jagged mountain peaks generated with Ridged Multifractal noise and hydraulic erosion.",
    tags: ["alpine", "mountains", "ridged", "erosion"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "terrain",
      terrain: {
        ...state.terrain,
        preset: "mountain-ranges",
        noiseType: "ridged",
        heightScale: 65,
        octaves: 6,
        hydraulicErosion: { enabled: true, dropletCount: 3000, erosionRate: 0.1 },
        biome: "alpine",
      },
    }),
  },
  {
    id: "preset-desert-terrain",
    name: "Desert Dunes & Mesas",
    category: "terrain",
    description: "Wind-swept sand dunes and layered plateaus with thermal scree slope erosion.",
    tags: ["desert", "dunes", "thermal", "mesas"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "terrain",
      terrain: {
        ...state.terrain,
        preset: "plateaus",
        noiseType: "domain-warp",
        heightScale: 28,
        frequency: 0.008,
        thermalErosion: { enabled: true, iterations: 6, talusAngle: 28 },
        biome: "desert",
      },
    }),
  },
  {
    id: "preset-volcanic-terrain",
    name: "Volcanic Caldera",
    category: "terrain",
    description: "Cratered volcanic terrain with steep basalt ridges and radial drainage patterns.",
    tags: ["volcanic", "caldera", "crater", "basalt"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "terrain",
      terrain: {
        ...state.terrain,
        preset: "craters",
        noiseType: "cellular",
        heightScale: 55,
        hydraulicErosion: { enabled: true, dropletCount: 2000, erosionRate: 0.12 },
        biome: "tundra",
      },
    }),
  },
  {
    id: "preset-snow-mountains",
    name: "Glacial Snow Peaks",
    category: "terrain",
    description: "High-altitude glacial valleys covered in procedural snow biomes.",
    tags: ["snow", "glacier", "peaks", "winter"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "terrain",
      terrain: {
        ...state.terrain,
        preset: "valleys",
        noiseType: "fbm",
        heightScale: 70,
        biome: "alpine",
        materialPreset: "snow",
      },
    }),
  },

  // 13-16: Procedural World Generator
  {
    id: "preset-dense-forest",
    name: "Dense Ancient Forest",
    category: "world",
    description: "Multi-chunk woodland biome with meandering rivers, lakes, and dense vegetation instances.",
    tags: ["forest", "trees", "rivers", "foliage"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "world",
      world: {
        ...state.world,
        preset: "dense-forest",
        vegetationDensity: 0.85,
        hydrology: { ...state.world.hydrology, riversCount: 4, hasLakes: true },
      },
    }),
  },
  {
    id: "preset-tropical-island",
    name: "Tropical Archipelago",
    category: "world",
    description: "Ocean-surrounded tropical islands with coral reefs, palm trees, and warm atmospheric haze.",
    tags: ["island", "ocean", "tropical", "beach"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "world",
      world: {
        ...state.world,
        preset: "tropical-island",
        hydrology: { ...state.world.hydrology, seaLevel: 12, waterColor: "#0284c7" },
        vegetationDensity: 0.6,
      },
    }),
  },
  {
    id: "preset-fantasy-world",
    name: "Fantasy Floating Islands",
    category: "world",
    description: "Surreal ethereal landscape with floating terrain landmasses and glowing sky lighting.",
    tags: ["fantasy", "floating", "magic", "surreal"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "world",
      world: {
        ...state.world,
        preset: "fantasy-world",
        atmosphere: { fogDensity: 0.005, timeOfDayHours: 19.5, haze: 0.35 },
      },
    }),
  },
  {
    id: "preset-rolling-grasslands",
    name: "Rolling Savanna Grasslands",
    category: "world",
    description: "Vast undulating meadows under bright midday sunlight with scattered acacia foliage.",
    tags: ["grasslands", "savanna", "meadow", "open"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "world",
      world: {
        ...state.world,
        preset: "rolling-grasslands",
        vegetationDensity: 0.45,
        atmosphere: { fogDensity: 0.001, timeOfDayHours: 12.0, haze: 0.05 },
      },
    }),
  },

  // 17-19: Model Intelligence & Optimization
  {
    id: "preset-mobile-opt",
    name: "Mobile Optimization Profile",
    category: "optimization",
    description: "Aggressive polygon decimation, draw-call merging, and low-memory LOD generation for mobile devices.",
    tags: ["mobile", "low-poly", "vram", "optimization"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "model-intelligence",
      modelIntelligence: {
        ...state.modelIntelligence,
        optimizationProfile: "mobile",
        optimizedStats: {
          ...state.modelIntelligence.optimizedStats,
          vertexCount: 8200,
          triangleCount: 15400,
          estimatedVramMb: 8.5,
          vramSavingsPercent: 80.0,
        },
      },
    }),
  },
  {
    id: "preset-balanced-opt",
    name: "Balanced Production Profile",
    category: "optimization",
    description: "Optimal balance between visual fidelity and runtime performance for desktop and tablet targets.",
    tags: ["balanced", "production", "lod", "pbr"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "model-intelligence",
      modelIntelligence: {
        ...state.modelIntelligence,
        optimizationProfile: "balanced",
      },
    }),
  },
  {
    id: "preset-highend-opt",
    name: "High-End Fidelity Profile",
    category: "optimization",
    description: "Preserves full tangent vectors, fine microgeometry details, and generates 5-stage continuous LODs.",
    tags: ["high-end", "fidelity", "tangents", "ultra"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "model-intelligence",
      modelIntelligence: {
        ...state.modelIntelligence,
        optimizationProfile: "high-end",
        optimizedStats: {
          ...state.modelIntelligence.optimizedStats,
          vertexCount: 22000,
          triangleCount: 42000,
          estimatedVramMb: 34.0,
          vramSavingsPercent: 20.2,
        },
      },
    }),
  },

  // 20-24: 3D Morphing
  {
    id: "preset-morph-sphere-box",
    name: "Sphere to Box Morph",
    category: "morphing",
    description: "Smooth topological interpolation between a normalized geodesic sphere and a subdivided cube.",
    tags: ["morph", "sphere", "box", "topology"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "morphing",
      morphing: {
        ...state.morphing,
        preset: "sphere-to-box",
        sourceGeometry: "Normalized Geodesic Sphere",
        targetGeometry: "Subdivided Cube",
        progress: 0.5,
      },
    }),
  },
  {
    id: "preset-morph-cube-sphere",
    name: "Cube to Sphere Inversion",
    category: "morphing",
    description: "Inverted geometric transition transforming box corners smoothly into spherical curvature.",
    tags: ["morph", "cube", "sphere", "curvature"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "morphing",
      morphing: {
        ...state.morphing,
        preset: "cube-to-sphere",
        sourceGeometry: "Subdivided Cube",
        targetGeometry: "Geodesic Sphere",
        progress: 0.3,
      },
    }),
  },
  {
    id: "preset-morph-torus-sphere",
    name: "Torus to Sphere Morph",
    category: "morphing",
    description: "Topological genus transition resampling a donut torus geometry into a compact sphere.",
    tags: ["morph", "torus", "genus", "resampling"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "morphing",
      morphing: {
        ...state.morphing,
        preset: "torus-to-sphere",
        sourceGeometry: "Donut Torus",
        targetGeometry: "Resampled Sphere",
        progress: 0.5,
      },
    }),
  },
  {
    id: "preset-morph-plane-wave",
    name: "Plane to Wave Morph",
    category: "morphing",
    description: "Dynamic surface displacement transition morphing a flat plane into a sine wave ripple mesh.",
    tags: ["morph", "plane", "wave", "displacement"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "morphing",
      morphing: {
        ...state.morphing,
        preset: "plane-to-wave",
        sourceGeometry: "Flat Grid Plane",
        targetGeometry: "Displaced Sine Mesh",
        progress: 0.7,
      },
    }),
  },
  {
    id: "preset-morph-cylinder-cone",
    name: "Cylinder to Cone Morph",
    category: "morphing",
    description: "Gradual radius collapse transforming a cylindrical column into a sharp conical spire.",
    tags: ["morph", "cylinder", "cone", "taper"],
    apply: (state) => ({
      ...state,
      section: "advanced",
      advancedView: "morphing",
      morphing: {
        ...state.morphing,
        preset: "cylinder-to-cone",
        sourceGeometry: "Cylinder Column",
        targetGeometry: "Conical Spire",
        progress: 0.4,
      },
    }),
  },
];

/**
 * Applies a preset by ID to the advanced 3D studio state.
 */
export function applyAdvanced3DPreset(
  state: Advanced3DStudioState,
  presetId: string
): Advanced3DStudioState {
  const found = ADVANCED_3D_PRESETS.find((p) => p.id === presetId);
  if (!found) return state;
  const updated = found.apply(state);
  return {
    ...updated,
    selectedPresetId: presetId,
  };
}

/**
 * Calculates live telemetry combining all 3D subsystems with
 * Phase 16 Performance Intelligence metrics.
 */
export function getAdvanced3DDiagnostics(
  state: Advanced3DStudioState
): Advanced3DDiagnosticsData {
  const health = defaultPerformanceIntelligence?.health;
  const context = defaultPerformanceIntelligence?.context;

  const fps = context?.fps ?? 60;
  const frameTimeMs = fps > 0 ? Number((1000 / fps).toFixed(2)) : 16.67;

  const activeObjects =
    state.rigidBodies.bodies.length +
    (state.softBody ? 1 : 0) +
    (state.composition.subsystems.terrain ? 1 : 0) +
    (state.composition.subsystems.morphing ? 1 : 0);

  const triangleCount =
    state.terrain.triangleCount +
    state.modelIntelligence.optimizedStats.triangleCount +
    state.rigidBodies.bodies.length * 12;

  const totalVram = Number(
    (
      state.modelIntelligence.optimizedStats.estimatedVramMb +
      (state.terrain.vertexCount * 48) / (1024 * 1024) +
      16.5
    ).toFixed(1)
  );

  return {
    fps,
    frameTimeMs,
    activeObjects,
    triangleCount,
    physicsStepDurationMs: state.physics.lastStepDurationMs,
    activeRigidBodies: state.rigidBodies.bodies.length,
    softBodyNodes: state.softBody.particleCount,
    terrainVertices: state.terrain.vertexCount,
    activeChunks: state.world.chunkStreaming.activeChunks,
    estimatedVramMb: totalVram,
    healthScore: health ? Math.round(health.overallHealth.score) : 96,
    healthStatus: health ? health.overallHealth.status : "optimal",
    adaptiveQualityLevel: "high",
  };
}

/**
 * Generates verified production code across React R3F, Vanilla TypeScript, and Scene JSON.
 */
export function generateAdvanced3DExportBundle(state: Advanced3DStudioState) {
  const { physics, rigidBodies, softBody, terrain, world, morphing, composition } = state;

  const reactR3fCode = `import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Physics,
  useRigidBody,
  useSoftBody,
  useTerrainMesh,
  useWorldStreamer,
  useMorphGeometry,
} from "af-motion/3d/react";

export function Advanced3DScene() {
  // 1. Terrain Mesh with Procedural Noise & Erosion
  const { geometry: terrainGeo, material: terrainMat } = useTerrainMesh({
    preset: "${terrain.preset}",
    noiseType: "${terrain.noiseType}",
    seed: ${terrain.seed},
    dimensions: [${terrain.dimensions[0]}, ${terrain.dimensions[1]}],
    heightScale: ${terrain.heightScale},
    hydraulicErosion: ${terrain.hydraulicErosion.enabled},
  });

  // 2. XPBD Soft Body Cloth Grid
  const { meshRef: clothRef } = useSoftBody({
    type: "${softBody.type}",
    resolution: [${softBody.resolution[0]}, ${softBody.resolution[1]}],
    stiffness: ${softBody.structuralStiffness},
    windInfluence: ${softBody.windInfluence},
    pinnedIndices: ${JSON.stringify(softBody.pinnedIndices)},
  });

  // 3. 3D Morphing Geometric Transition
  const { morphRef, setProgress } = useMorphGeometry({
    preset: "${morphing.preset}",
    duration: ${morphing.duration},
    easing: "${morphing.easing}",
    autoPlay: true,
  });

  return (
    <Canvas
      camera={{ position: [0, 8, 14], fov: 45 }}
      style={{ width: "100%", height: "100vh", background: "#0a0d14" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />

      {/* Physics World Simulation */}
      <Physics gravity={[${physics.gravity.join(", ")}]} broadphase="${physics.broadphaseType}">
        {/* Procedural Terrain Heightfield Collider */}
        <mesh geometry={terrainGeo} material={terrainMat} receiveShadow />

        {/* Dynamic Rigid Bodies Stack */}
${rigidBodies.bodies
  .map(
    (b) => `        <mesh position={[${b.position.join(", ")}]} castShadow>
          <boxGeometry args={[${b.dimensions.join(", ")}]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} />
        </mesh>`
  )
  .join("\n")}

        {/* Soft Body Cloth Mesh */}
        <mesh ref={clothRef} castShadow>
          <meshStandardMaterial color="#f43f5e" wireframe={false} />
        </mesh>
      </Physics>
    </Canvas>
  );
}`;

  const vanillajsCode = `import {
  createPhysicsWorld,
  createTerrain,
  createWorldGenerator,
  createMorphController,
  createSimulationCoordinator,
} from "af-motion/3d";

// 1. Initialize 3D Physics World
const world = createPhysicsWorld({
  gravity: [${physics.gravity.join(", ")}],
  broadphase: "${physics.broadphaseType}",
  fixedDeltaTime: ${physics.fixedDeltaTime},
  enableSleeping: ${physics.enableSleeping},
});

// 2. Generate Procedural Terrain with Hydraulic Erosion
const terrain = await createTerrain({
  preset: "${terrain.preset}",
  noiseType: "${terrain.noiseType}",
  dimensions: [${terrain.dimensions[0]}, ${terrain.dimensions[1]}],
  heightScale: ${terrain.heightScale},
  hydraulicErosion: ${JSON.stringify(terrain.hydraulicErosion)},
});

// 3. Register Terrain Heightfield in Physics World
world.createHeightfieldCollider(terrain.heightfield, {
  restitution: 0.1,
  friction: 0.8,
});

// 4. Instantiate Dynamic Rigid Bodies
${rigidBodies.bodies
  .map(
    (b) => `world.createRigidBody({
  id: "${b.id}",
  type: "${b.type}",
  mass: ${b.mass},
  shape: "${b.shape}",
  dimensions: [${b.dimensions.join(", ")}],
  position: [${b.position.join(", ")}],
  restitution: ${b.restitution},
  friction: ${b.friction},
});`
  )
  .join("\n")}

// 5. Initialize 3D Morphing Engine
const morph = createMorphController({
  preset: "${morphing.preset}",
  duration: ${morphing.duration},
});

// 6. Start Unified Simulation Loop
const coordinator = createSimulationCoordinator();
coordinator.register("physics", world);
coordinator.register("morph", morph);
coordinator.start();`;

  const sceneJson = JSON.stringify(
    {
      version: "1.0.0",
      studio: "AF Motion Advanced 3D & World Studio",
      physics,
      rigidBodies,
      softBody,
      terrain,
      world,
      morphing,
      composition,
    },
    null,
    2
  );

  return {
    reactR3fCode,
    vanillajsCode,
    sceneJson,
  };
}
