/**
 * AF Motion Studio — Unified Visual Playground Type Definitions (Prompt 140/141)
 *
 * Types for the Unified Creative Workspace, Multi-System Composition,
 * Cross-Subsystem Preset Hub, Design & Motion DNA Bridge, Unified Diagnostics,
 * AI Motion Intelligence Panel, and Multi-Target Code Export.
 */

import type { StudioTab } from "./index.js";
import type { MotionComposition } from "../../src/core/composition.js";

export type UnifiedPlaygroundTab =
  | "composition"
  | "presets"
  | "design-bridge"
  | "telemetry"
  | "intelligence"
  | "design-to-motion"
  | "scene-generator"
  | "ai-agents"
  | "export";

export type UnifiedSubsystemId =
  | "animation"
  | "background"
  | "styles"
  | "designSystem"
  | "choreography"
  | "scene3d"
  | "physics"
  | "interactions"
  | "advancedMotion"
  | "simulations";

export type UnifiedSystemParticipation = Record<UnifiedSubsystemId, boolean>;

export interface UnifiedDesignBridgeConfig {
  paletteName: string;
  paletteId: string;
  motionDNA: "precise" | "playful" | "elegant" | "energetic" | "editorial-flow";
  timingMultiplier: number;
  reducedMotion: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export interface UnifiedCrossCouplingConfig {
  magneticCursorCoupling: boolean;
  physicsCollisionTriggers: boolean;
  scrollWorldCoupling: boolean;
  fluidInteractionCoupling: boolean;
}

export interface UnifiedCompositionLayer {
  id: string;
  name: string;
  subsystem: UnifiedSubsystemId;
  enabled: boolean;
  zIndex: number;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "additive";
}

export interface UnifiedPlaybackState {
  currentTimeMs: number;
  durationMs: number;
  progress: number;
  isPlaying: boolean;
  speed: number;
  loop: boolean;
}

export interface UnifiedCompositionState {
  id: string;
  name: string;
  description: string;
  systems: UnifiedSystemParticipation;
  designBridge: UnifiedDesignBridgeConfig;
  crossCoupling: UnifiedCrossCouplingConfig;
  layers: UnifiedCompositionLayer[];
  playback: UnifiedPlaybackState;
}

export interface UnifiedPresetEntry {
  id: string;
  name: string;
  category:
    | "animation"
    | "background"
    | "styles"
    | "designSystem"
    | "choreography"
    | "3d"
    | "physics"
    | "interactions"
    | "advancedMotion"
    | "simulations";
  subsystem: UnifiedSubsystemId;
  description: string;
  tags: readonly string[];
  targetTab: StudioTab;
  configuration: Record<string, unknown>;
}

export interface UnifiedTelemetrySnapshot {
  fps: number;
  frameTimeMs: number;
  activeAnimations: number;
  activeSimulations: number;
  physicsBodies: number;
  particleCount: number;
  triangles3D: number;
  gpuBackend: string;
  vramEstimateMB: number;
  healthScore: number;
  adaptiveQuality: "low" | "medium" | "high" | "ultra";
  bottleneck: string | null;
  isEstimated: {
    fps: boolean;
    frameTime: boolean;
    vram: boolean;
    health: boolean;
    gpuBackend: boolean;
  };
}

export interface UnifiedExportBundle {
  title: string;
  reactCode: string;
  vanillaCode: string;
  compositionJson: string;
  cssTokens: Record<string, string>;
  compositionSpec?: MotionComposition;
  imports: Array<{ subpath: string; namedImports: string[] }>;
}
