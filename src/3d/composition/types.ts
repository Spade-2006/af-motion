/**
 * AF Motion 3D Scene Composition Types
 *
 * Framework-independent contracts for unified 3D scene composition,
 * hierarchical generation, AI generation intents, recipes, and performance controls.
 */

import type { Camera3DConfig, Vector3Tuple } from "../types.js";
import type { Scene3DSpecification, SceneObjectSpec } from "../schemas/types.js";
import type { AssetManager3D } from "../assets/manager.js";
import type { InteractionManager3D } from "../interaction/manager.js";
import type { CameraControls3D } from "../interaction/camera-controls.js";
import type { ScrollSceneController } from "../scroll/controller.js";
import type { CameraPresetName } from "../camera/types.js";
import type { LightingPresetName } from "../lighting/types.js";
import type { EnvironmentPresetName } from "../environment/types.js";
import type { Material3DPresetName } from "../materials/types.js";
import type { InteractionPresetName } from "../interaction/types.js";

export type Scene3DQualityLevel = "low" | "medium" | "high" | "ultra";

export interface Scene3DQualityProfile {
  readonly level: Scene3DQualityLevel;
  readonly maxDpr: number;
  readonly antialias: boolean;
  readonly shadows: boolean;
  readonly maxObjects: number;
  readonly targetFps: number;
}

export interface Scene3DPerformanceConfig {
  readonly qualityProfile?: Scene3DQualityLevel;
  readonly adaptiveDpr?: boolean;
  readonly minDpr?: number;
  readonly maxDpr?: number;
  readonly suspendWhenHidden?: boolean;
  readonly targetFps?: number;
  readonly maxObjects?: number;
  readonly cullingDistance?: number;
}

export interface Scene3DCompositionDefinition {
  readonly id: string;
  readonly name?: string;
  readonly spec: Scene3DSpecification;
  readonly recipe?: string;
  readonly performance?: Scene3DPerformanceConfig;
  readonly metadata?: Record<string, unknown>;
}

export interface Scene3DFallbackDecision {
  readonly originalSpec: Scene3DSpecification;
  readonly resolvedSpec: Scene3DSpecification;
  readonly modifications: readonly string[];
  readonly warnings: readonly string[];
  readonly degradedFeatures: readonly string[];
  readonly canRender: boolean;
}

export interface Scene3DIntent {
  readonly description?: string;
  readonly visualStyle?: string;
  readonly mood?: string;
  readonly cameraStaging?: CameraPresetName;
  readonly lightingPreset?: LightingPresetName;
  readonly environmentPreset?: EnvironmentPresetName;
  readonly materialPreset?: Material3DPresetName;
  readonly interactionMode?: InteractionPresetName;
  readonly scrollTimelinePreset?: string;
  readonly objects?: readonly {
    readonly id?: string;
    readonly name?: string;
    readonly type?: string;
    readonly primitive?: string;
    readonly modelUrl?: string;
    readonly materialPreset?: Material3DPresetName;
    readonly position?: Vector3Tuple;
    readonly scale?: Vector3Tuple;
  }[];
  readonly reducedMotion?: boolean;
}

export interface Scene3DCompositionInstance {
  readonly id: string;
  readonly definition: Scene3DCompositionDefinition;
  readonly spec: Scene3DSpecification;
  readonly assetManager: AssetManager3D;
  readonly interactionManager?: InteractionManager3D;
  readonly cameraControls?: CameraControls3D;
  readonly scrollController?: ScrollSceneController;
  readonly fallbackDecision?: Scene3DFallbackDecision;
  readonly updateSpec: (
    updater: (prev: Scene3DSpecification) => Scene3DSpecification
  ) => Scene3DSpecification;
  readonly updateObject: (id: string, partial: Partial<SceneObjectSpec>) => void;
  readonly setQuality: (quality: Scene3DQualityLevel) => void;
  readonly destroy: () => void;
}
