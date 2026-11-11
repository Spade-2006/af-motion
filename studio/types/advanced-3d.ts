/**
 * AF Motion Studio — Advanced 3D & World Integration Types (Prompt 139)
 *
 * Types for 3D Physics, Rigid Bodies, Soft Bodies & Constraints, Procedural Terrain,
 * World Generation, Model Intelligence & Optimization, 3D Morphing, Unified Composition,
 * Presets, Performance Intelligence Diagnostics, and Code Export.
 */

import type { ColliderShapeType3D, ConstraintType3D } from "../../src/3d/physics/types.js";
import type { WorldPreset } from "../../src/3d/world/types.js";
import type { TerrainPreset } from "../../src/3d/terrain/types.js";

export type Advanced3DViewMode =
  | "physics"
  | "rigid-bodies"
  | "soft-bodies"
  | "terrain"
  | "world"
  | "model-intelligence"
  | "morphing"
  | "composition"
  | "presets";

export type Studio3DNavSection = "foundations" | "advanced" | "presets";

// ============================================================================
// 1. 3D Physics World
// ============================================================================

export interface Physics3DStudioConfig {
  gravity: [number, number, number];
  fixedDeltaTime: number;
  maxSubSteps: number;
  velocityIterations: number;
  positionIterations: number;
  enableSleeping: boolean;
  broadphaseType: "sap" | "bvh" | "grid";
  activeRigidBodiesCount: number;
  activeCollidersCount: number;
  simulating: boolean;
  contactsCount: number;
  lastStepDurationMs: number;
  raycastOrigin: [number, number, number];
  raycastDirection: [number, number, number];
  raycastHit: {
    bodyId: string;
    distance: number;
    point: [number, number, number];
    normal: [number, number, number];
  } | null;
}

// ============================================================================
// 2. Rigid Bodies & Constraints
// ============================================================================

export interface RigidBodyStudioItem {
  id: string;
  name: string;
  type: "dynamic" | "static" | "kinematic";
  mass: number;
  shape: ColliderShapeType3D;
  dimensions: [number, number, number];
  restitution: number;
  friction: number;
  linearDamping: number;
  angularDamping: number;
  collisionLayer: number;
  collisionMask: number;
  ccd: boolean;
  position: [number, number, number];
  rotation: [number, number, number, number];
  linearVelocity: [number, number, number];
  angularVelocity: [number, number, number];
  isSleeping: boolean;
}

export interface ConstraintStudioItem {
  id: string;
  name: string;
  type: ConstraintType3D;
  bodyAId: string;
  bodyBId: string;
  pivotA: [number, number, number];
  pivotB: [number, number, number];
  limits: { min: number; max: number };
  motor: { enabled: boolean; targetVelocity: number; maxForce: number };
  spring: { stiffness: number; damping: number };
  breakImpulse: number;
  enabled: boolean;
}

export interface RigidBodyStudioConfig {
  bodies: RigidBodyStudioItem[];
  constraints: ConstraintStudioItem[];
  selectedBodyId: string | null;
  selectedConstraintId: string | null;
}

// ============================================================================
// 3. Soft Bodies & Cloth
// ============================================================================

export interface SoftBodyStudioConfig {
  type: "cloth" | "rope" | "chain" | "volume";
  resolution: [number, number];
  particleCount: number;
  structuralStiffness: number;
  shearStiffness: number;
  bendingStiffness: number;
  compliance: number;
  damping: number;
  windInfluence: number;
  pinnedIndices: number[];
  tearable: boolean;
  tearStrainThreshold: number;
  coupledWithRigidBody: boolean;
  deformationScore: number;
}

// ============================================================================
// 4. Procedural Terrain
// ============================================================================

export type TerrainNoiseType =
  | "perlin"
  | "simplex"
  | "cellular"
  | "fbm"
  | "ridged"
  | "domain-warp";

export interface TerrainStudioConfig {
  preset: TerrainPreset | "custom";
  noiseType: TerrainNoiseType;
  seed: number;
  dimensions: [number, number];
  resolution: number;
  heightScale: number;
  frequency: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  hydraulicErosion: { enabled: boolean; dropletCount: number; erosionRate: number };
  thermalErosion: { enabled: boolean; iterations: number; talusAngle: number };
  biome: "alpine" | "tundra" | "desert" | "grassland" | "forest";
  vertexCount: number;
  triangleCount: number;
  generationTimeMs: number;
  materialPreset: "grass" | "rock" | "snow" | "sand" | "composite";
}

// ============================================================================
// 5. Procedural World Generator
// ============================================================================

export interface WorldGeneratorStudioConfig {
  preset: WorldPreset;
  seed: number;
  dimensions: [number, number];
  hydrology: {
    riversCount: number;
    seaLevel: number;
    waterColor: string;
    hasLakes: boolean;
  };
  vegetationDensity: number;
  atmosphere: {
    fogDensity: number;
    timeOfDayHours: number;
    haze: number;
  };
  chunkStreaming: {
    activeChunks: number;
    totalChunks: number;
    lodDistance: number;
  };
  generationProgress: number;
  currentStage: string;
  stageTimings: Record<string, number>;
  isGenerating: boolean;
}

// ============================================================================
// 6. 3D Model Intelligence & Optimization
// ============================================================================

export interface ModelIntelligenceStudioConfig {
  selectedModelId: string;
  stats: {
    vertexCount: number;
    triangleCount: number;
    duplicateVertices: number;
    degenerateTriangles: number;
    materialCount: number;
    textureCount: number;
    skeletonJointCount: number;
    estimatedVramMb: number;
  };
  optimizationProfile: "mobile" | "balanced" | "high-end";
  optimizedStats: {
    vertexCount: number;
    triangleCount: number;
    duplicateVertices: number;
    degenerateTriangles: number;
    materialCount: number;
    lodLevelsCount: number;
    estimatedVramMb: number;
    vramSavingsPercent: number;
  };
  lodLevels: Array<{ level: number; triangleCount: number; distance: number }>;
  recommendations: string[];
  validationWarnings: string[];
  recommendedCollider: "box" | "sphere" | "capsule" | "compound";
}

// ============================================================================
// 7. 3D Morphing Playground
// ============================================================================

export type MorphPresetName =
  | "sphere-to-box"
  | "cube-to-sphere"
  | "torus-to-sphere"
  | "cylinder-to-cone"
  | "plane-to-wave";

export interface Morphing3DStudioConfig {
  preset: MorphPresetName;
  sourceGeometry: string;
  targetGeometry: string;
  progress: number;
  duration: number;
  easing: string;
  isPlaying: boolean;
  vertexCount: number;
  morphTargetsCount: number;
  topologyValid: boolean;
  correspondenceStatus: "exact" | "resampled" | "compatible";
  boundingDim: [number, number, number];
}

// ============================================================================
// 8. Unified Scene Composition
// ============================================================================

export interface SceneCompositionStudioConfig {
  subsystems: {
    physics: boolean;
    softBodies: boolean;
    terrain: boolean;
    world: boolean;
    morphing: boolean;
    environment: boolean;
    lighting: boolean;
  };
  coupling: {
    rigidTerrainCollisions: boolean;
    softRigidCollisions: boolean;
    worldHydrologyCoupled: boolean;
    morphingPhysicsCoupled: boolean;
  };
  activeLayers: Array<{
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    opacity: number;
  }>;
}

// ============================================================================
// Presets, Diagnostics, and Overall State
// ============================================================================

export interface Advanced3DPreset {
  id: string;
  name: string;
  category: "physics" | "soft-bodies" | "terrain" | "world" | "optimization" | "morphing";
  description: string;
  tags: string[];
  apply: (state: Advanced3DStudioState) => Advanced3DStudioState;
}

export interface Advanced3DDiagnosticsData {
  fps: number;
  frameTimeMs: number;
  activeObjects: number;
  triangleCount: number;
  physicsStepDurationMs: number;
  activeRigidBodies: number;
  softBodyNodes: number;
  terrainVertices: number;
  activeChunks: number;
  estimatedVramMb: number;
  healthScore: number;
  healthStatus: string;
  adaptiveQualityLevel: string;
}

export interface Advanced3DStudioState {
  section: Studio3DNavSection;
  advancedView: Advanced3DViewMode;
  physics: Physics3DStudioConfig;
  rigidBodies: RigidBodyStudioConfig;
  softBody: SoftBodyStudioConfig;
  terrain: TerrainStudioConfig;
  world: WorldGeneratorStudioConfig;
  modelIntelligence: ModelIntelligenceStudioConfig;
  morphing: Morphing3DStudioConfig;
  composition: SceneCompositionStudioConfig;
  selectedPresetId: string | null;
  showExportModal: boolean;
  exportFormat: "react-r3f" | "vanilla-ts" | "scene-json";
}
