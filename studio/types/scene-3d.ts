/**
 * AF Motion Studio — 3D Scene Studio Types
 *
 * Types for the 3D Scene Studio module: hierarchy, transforms, procedural
 * geometries, materials, camera, lighting, environment, intelligence, export,
 * and Advanced 3D & World Integration (Prompt 139).
 */

import type {
  BoundingBox3D,
  Camera3DConfig,
  Environment3DConfig,
  EulerRotation,
  GeometryPrimitiveType,
  Lighting3DConfig,
  MaterialSpec,
  ModelReferenceSpec,
  PrimitiveGeometrySpec,
  Renderer3DConfig,
  Scene3DSpecification,
  SceneObjectSpec,
  SceneObjectType,
  Transform3D,
  Vector3,
} from "../../src/3d/schemas/types.js";
import type { CameraPresetName } from "../../src/3d/camera/types.js";
import type { LightingPresetName } from "../../src/3d/lighting/types.js";
import type { EnvironmentPresetName } from "../../src/3d/environment/types.js";
import type { Material3DPresetName } from "../../src/3d/materials/types.js";
import type { Scene3DRecipeName } from "../../src/3d/composition/recipes.js";

export type Scene3DStudioViewMode =
  | "hierarchy"
  | "geometry"
  | "camera-lighting"
  | "materials"
  | "intelligence"
  | "templates"
  | "export"
  | "physics"
  | "rigid-bodies"
  | "soft-bodies"
  | "terrain"
  | "world"
  | "model-intelligence"
  | "morphing"
  | "composition";

export type QualityPreset = "low" | "medium" | "high";

export interface ProceduralGeometryDescriptor {
  readonly type: GeometryPrimitiveType;
  readonly name: string;
  readonly description: string;
  readonly defaultParameters: Record<string, number>;
}

export interface MaterialStudioConfig {
  readonly id: string;
  readonly name?: string;
  readonly type: "physical" | "standard" | "basic";
  readonly color: string;
  readonly roughness: number;
  readonly metalness: number;
  readonly opacity: number;
  readonly transmission?: number;
  readonly ior?: number;
  readonly clearcoat?: number;
  readonly clearcoatRoughness?: number;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly wireframe?: boolean;
  readonly transparent?: boolean;
  readonly preset?: Material3DPresetName;
}

export interface CameraStudioState {
  type: "perspective" | "orthographic";
  fov: number;
  near: number;
  far: number;
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  preset?: CameraPresetName;
}

export interface LightingStudioState {
  preset?: LightingPresetName;
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  castShadows: boolean;
  pointLightsCount: number;
  spotLightsCount: number;
}

export interface EnvironmentStudioState {
  preset?: EnvironmentPresetName;
  backgroundColor: string;
  transparent: boolean;
  groundEnabled: boolean;
  groundColor: string;
  groundSize: number;
  groundRoughness: number;
  groundReceiveShadow: boolean;
  fogEnabled: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

export interface Scene3DIntelligenceReport {
  readonly score: number; // 0 to 100
  readonly rationale: string;
  readonly objectCount: number;
  readonly estimatedPolyCount: number;
  readonly lightingEvaluation: string;
  readonly hierarchyValid: boolean;
  readonly performanceWarnings: readonly string[];
  readonly accessibilityNotes: readonly string[];
  readonly recommendations: readonly string[];
  readonly intentSummary?: string;
}

export interface Scene3DExportBundle {
  readonly json: string;
  readonly reactR3fCode: string;
  readonly vanillajsCode: string;
  readonly spec: Scene3DSpecification;
}

export * from "./advanced-3d.js";
