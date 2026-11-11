/**
 * AF Motion Studio — Choreography & Multi-System Builder Type Definitions
 *
 * Types for multi-track timeline editing, multi-system composition,
 * choreography intelligence, templates, and code export.
 */

import type {
  ChoreographyPattern,
  ChoreographySystemType,
  ChoreographyPlan,
} from "../../src/core/choreography-intelligence/types.js";
import type { ChoreographyDefinition } from "../../src/core/motion-choreography.js";

export type ChoreographyStudioViewMode =
  | "timeline"
  | "systems"
  | "intelligence"
  | "templates"
  | "export";

export interface ChoreographyTrackConfig {
  id: string;
  name: string;
  system: ChoreographySystemType;
  targetName: string;
  enabled: boolean;
  startMs: number;
  durationMs: number;
  easing: string;
  color: string;
  properties: {
    opacity?: [number, number];
    y?: [number, number];
    x?: [number, number];
    scale?: [number, number];
    rotate?: [number, number];
    blur?: [number, number];
  };
  dependencyTrackId?: string;
  dependencyType?: "start-after-end" | "start-with-start";
  offsetMs?: number;
}

export interface MultiSystemActiveSettings {
  dom: boolean;
  pageTransitions: boolean;
  scrollMotion: boolean;
  microinteractions: boolean;
  graphicsEffects: boolean;
  scene3d: boolean;
  ambientMotion: boolean;
}

export interface ChoreographyTimelineState {
  currentTimeMs: number;
  totalDurationMs: number;
  isPlaying: boolean;
  isReversed: boolean;
  isLooping: boolean;
  playbackRate: number; // 0.5, 1, 1.5, 2
  zoom: number; // 1, 1.5, 2
}

export interface ChoreographyTemplate {
  id: string;
  name: string;
  pattern: ChoreographyPattern;
  description: string;
  totalDurationMs: number;
  systems: ChoreographySystemType[];
  tracks: ChoreographyTrackConfig[];
  isCustom?: boolean;
}

export interface ChoreographyIntelligenceReport {
  pattern: ChoreographyPattern;
  score: number; // 0 to 100
  recommendedOrder: string[];
  timingRecommendations: string[];
  conflicts: string[];
  performanceWarnings: string[];
  accessibilityNotes: string[];
  rationale: string;
}

export interface ChoreographyExportBundle {
  choreographyJson: string;
  multiSystemJson: string;
  reactTsx: string;
  css: string;
}
