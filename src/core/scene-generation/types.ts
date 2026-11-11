/**
 * AF Motion AI Scene & Animation Generation Types (Prompt 143)
 *
 * Data contracts for transforming natural-language scene descriptions and
 * structured scene specifications into complete, animated, multi-system AF Motion scenes.
 */

import type { MotionComposition } from "../composition.js";
import type { Scene3DSpecification } from "../../3d/schemas/types.js";
import type {
  AIMotionIntentType,
  QualityFinding,
  IntelligentMotionRecommendation,
  MotionQualityEvaluationResult,
} from "../ai-motion-intelligence/types.js";
import type { MotionDNAPersonalityOption } from "../design-to-motion/types.js";

export type { MotionDNAPersonalityOption } from "../design-to-motion/types.js";

export const SCENE_GENERATION_SPEC_VERSION = "1.0.0";

export type SceneCategory =
  | "hero"
  | "product-showcase"
  | "interactive-interface"
  | "portfolio"
  | "cinematic-sequence"
  | "physics-playground"
  | "particle-environment"
  | "3d-world"
  | "scroll-storytelling";

export type SceneObjectType =
  | "dom-element"
  | "text"
  | "card"
  | "shape"
  | "3d-object"
  | "particle-system"
  | "physics-body"
  | "camera"
  | "light";

export type SceneLayerId = "background" | "middleground" | "foreground" | "overlay";

export interface SceneObjectTransform {
  readonly position: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: readonly [number, number, number] | number;
}

export interface SceneObjectVisuals {
  readonly color?: string;
  readonly opacity?: number;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly geometryType?: "box" | "sphere" | "cylinder" | "torus" | "plane";
  readonly dimensions?: readonly [number, number, number?];
}

export interface SceneObjectAnimation {
  readonly entrance?: {
    readonly properties: readonly string[];
    readonly from: Record<string, unknown>;
    readonly to: Record<string, unknown>;
    readonly durationMs: number;
    readonly delayMs: number;
    readonly easing: string;
  };
  readonly ambient?: {
    readonly type: "float" | "rotate" | "pulse" | "drift" | "orbit";
    readonly amplitude?: number;
    readonly speed?: number;
    readonly axis?: "x" | "y" | "z" | "all";
  };
  readonly exit?: {
    readonly properties: readonly string[];
    readonly to: Record<string, unknown>;
    readonly durationMs: number;
    readonly easing: string;
  };
}

export interface SceneObjectInteraction {
  readonly hover?: {
    readonly scale?: number;
    readonly elevateZ?: number;
    readonly highlightColor?: string;
  };
  readonly clickOrPress?: {
    readonly triggerEffect?: "pulse" | "explode" | "modal" | "select";
    readonly recoil?: number;
  };
  readonly draggable?: boolean;
  readonly magnetic?: {
    readonly radius: number;
    readonly strength: number;
  };
}

export interface ScenePhysicsConfig {
  readonly mass: number;
  readonly restitution: number;
  readonly friction: number;
  readonly isStatic?: boolean;
  readonly colliderType?: "box" | "sphere" | "capsule" | "mesh";
}

export interface SceneParticleConfig {
  readonly count: number;
  readonly speed: number;
  readonly color: string;
  readonly size: number;
  readonly spread: number;
  readonly shape?: "points" | "stars" | "bubbles" | "glow-orbs";
}

export interface SceneObjectDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: SceneObjectType;
  readonly layer: SceneLayerId;
  readonly parentId?: string;
  readonly transform: SceneObjectTransform;
  readonly visuals?: SceneObjectVisuals;
  readonly animation?: SceneObjectAnimation;
  readonly interaction?: SceneObjectInteraction;
  readonly physics?: ScenePhysicsConfig;
  readonly particles?: SceneParticleConfig;
  readonly enabled?: boolean;
}

export interface SceneCameraDefinition {
  readonly type: "perspective" | "orthographic";
  readonly fov?: number;
  readonly position: readonly [number, number, number];
  readonly target?: readonly [number, number, number];
  readonly interactive?: boolean;
}

export interface SceneLightingDefinition {
  readonly ambientColor: string;
  readonly ambientIntensity: number;
  readonly directionalColor?: string;
  readonly directionalIntensity?: number;
  readonly directionalPosition?: readonly [number, number, number];
  readonly pointLightColor?: string;
  readonly pointLightPosition?: readonly [number, number, number];
}

export interface SceneEnvironmentDefinition {
  readonly backgroundType: "color" | "gradient" | "particles" | "aurora" | "3d-skybox";
  readonly backgroundColor: string;
  readonly fogColor?: string;
  readonly fogDensity?: number;
  readonly particleField?: SceneParticleConfig;
}

export interface StructuredSceneSpecification {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: SceneCategory;
  readonly canvasDimensions: {
    readonly width: number;
    readonly height: number;
    readonly isResponsive: boolean;
  };
  readonly camera: SceneCameraDefinition;
  readonly lighting: SceneLightingDefinition;
  readonly environment: SceneEnvironmentDefinition;
  readonly objects: readonly SceneObjectDefinition[];
  readonly motionDNA: MotionDNAPersonalityOption;
  readonly paletteName: string;
  readonly timingMultiplier: number;
  readonly reducedMotion: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface SceneNaturalLanguageInput {
  readonly prompt: string;
  readonly categoryHint?: SceneCategory;
  readonly targetDNA?: MotionDNAPersonalityOption;
  readonly targetPalette?: string;
}

export interface AISceneGenerationInput {
  readonly naturalLanguage?: SceneNaturalLanguageInput | string;
  readonly specification?: Partial<StructuredSceneSpecification>;
  readonly paletteName?: string;
  readonly motionDNA?: MotionDNAPersonalityOption;
  readonly timingMultiplier?: number;
  readonly reducedMotion?: boolean;
}

export interface SceneUnderstandingResult {
  readonly category: SceneCategory;
  readonly primarySubject: string;
  readonly supportingElements: readonly string[];
  readonly requiredSystems: {
    readonly has3D: boolean;
    readonly hasParticles: boolean;
    readonly hasPhysics: boolean;
    readonly hasDOM: boolean;
    readonly hasInteractions: boolean;
  };
  readonly inferredIntent: AIMotionIntentType;
  readonly intentConfidence: number;
  readonly spatialComplexity: "minimal" | "moderate" | "rich";
  readonly evidence: readonly string[];
  readonly warnings: readonly string[];
}

export interface ScenePlan {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly category: SceneCategory;
  readonly layers: readonly SceneLayerId[];
  readonly durationMs: number;
  readonly matchedPatternIds: readonly string[];
  readonly objectCount: number;
  readonly systemParticipation: {
    readonly animation: boolean;
    readonly background: boolean;
    readonly scene3d: boolean;
    readonly physics: boolean;
    readonly interactions: boolean;
    readonly simulations: boolean;
  };
}

export interface AISceneExportArtifacts {
  readonly reactCode: string;
  readonly vanillaCode: string;
  readonly sceneJson: string;
  readonly compositionJson: string;
  readonly scene3dJson?: string;
  readonly cssTokens: Record<string, string>;
}

export interface GeneratedSceneResult {
  readonly id: string;
  readonly sourceInput: AISceneGenerationInput;
  readonly understanding: SceneUnderstandingResult;
  readonly plan: ScenePlan;
  readonly specification: StructuredSceneSpecification;
  readonly composition: MotionComposition;
  readonly scene3dSpec?: Scene3DSpecification;
  readonly validation: {
    readonly isValid: boolean;
    readonly qualityScore: number;
    readonly qualityGrade: string;
    readonly detailedScore: MotionQualityEvaluationResult;
    readonly findings: readonly QualityFinding[];
    readonly recommendations: readonly IntelligentMotionRecommendation[];
  };
  readonly exportArtifacts: AISceneExportArtifacts;
  readonly generatedAt: number;
}

export interface AIScenePreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: SceneCategory;
  readonly defaultDNA: MotionDNAPersonalityOption;
  readonly defaultPalette: string;
  readonly defaultInput: AISceneGenerationInput;
  readonly capabilities: readonly string[];
}

export interface AISceneGenerationOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly maxObjects?: number;
  readonly forceReducedMotion?: boolean;
}

export interface IAISceneGenerationProvider {
  readonly id: string;
  readonly name: string;
  generate(
    input: AISceneGenerationInput,
    options?: AISceneGenerationOptions
  ): Promise<GeneratedSceneResult>;
  generateSync(
    input: AISceneGenerationInput,
    options?: AISceneGenerationOptions
  ): GeneratedSceneResult;
}
