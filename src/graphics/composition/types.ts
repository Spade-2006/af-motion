/**
 * AF Motion Unified Graphics Composition Contracts
 *
 * Types for layer ordering, dependency resolution, quality management,
 * capability-aware fallback resolution, and unified graphics instances.
 */

import type {
  GraphicsCapabilities,
  GraphicsEffect,
  GraphicsEngine,
  RendererBackend,
} from "../types.js";
import type { LightingConfig, MaterialDefinition, SurfaceDefinition } from "../materials/types.js";
import type { ProceduralTextureConfig } from "../textures/types.js";

export type GraphicsQualityLevel = "low" | "medium" | "high" | "ultra";

export interface GraphicsQualityProfile {
  readonly level: GraphicsQualityLevel;
  readonly dprLimit: number;
  readonly particleMultiplier: number;
  readonly effectsQuality: "low" | "medium" | "high";
  readonly frameBudgetMs: number;
  readonly enablePostProcessing: boolean;
}

export interface GraphicsFallbackDecision {
  readonly targetBackend: RendererBackend;
  readonly qualityLevel: GraphicsQualityLevel;
  readonly degradedEffects: readonly string[];
  readonly isFallback: boolean;
  readonly reason: string;
}

export type GraphicsLayerType =
  | "effect"
  | "material"
  | "texture"
  | "particles"
  | "custom";

export interface GraphicsLayer {
  readonly id: string;
  readonly name: string;
  readonly type: GraphicsLayerType;
  readonly order: number;
  readonly enabled?: boolean;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly effect?: GraphicsEffect;
  readonly texture?: ProceduralTextureConfig;
  readonly surface?: SurfaceDefinition;
  readonly dependsOn?: readonly string[];
}

export interface GraphicsCompositionDefinition {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly layers: readonly GraphicsLayer[];
  readonly material?: MaterialDefinition;
  readonly lighting?: LightingConfig;
  readonly quality?: GraphicsQualityLevel;
  readonly autoAdaptQuality?: boolean;
  readonly respectReducedMotion?: boolean;
}

export interface GraphicsPerformanceStats {
  readonly fps: number;
  readonly avgFrameTimeMs: number;
  readonly activeLayersCount: number;
  readonly totalParticlesCount: number;
  readonly currentQuality: GraphicsQualityLevel;
}

export interface GraphicsCompositionInstance {
  readonly id: string;
  readonly definition: GraphicsCompositionDefinition;
  readonly engine: GraphicsEngine;
  readonly quality: GraphicsQualityProfile;
  readonly fallback: GraphicsFallbackDecision;
  readonly layers: readonly GraphicsLayer[];
  readonly isAttached: boolean;
  attach(canvas: HTMLCanvasElement): Promise<void> | void;
  detach(): void;
  updateLayer(layerId: string, partial: Partial<GraphicsLayer>): void;
  setQuality(quality: GraphicsQualityLevel): void;
  getPerformanceStats(): GraphicsPerformanceStats;
  destroy(): void;
}

export interface GraphicsInstanceOptions {
  readonly composition?: GraphicsCompositionDefinition;
  readonly quality?: GraphicsQualityLevel;
  readonly autoStart?: boolean;
  readonly dpr?: number | "auto";
  readonly backend?: RendererBackend | "auto";
  readonly respectReducedMotion?: boolean;
  readonly engine?: GraphicsEngine;
}
