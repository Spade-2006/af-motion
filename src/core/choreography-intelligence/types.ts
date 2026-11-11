/**
 * AF Motion Choreography Intelligence & Cross-System Synchronization Contracts
 *
 * Framework-independent contracts for coordinating animation across DOM, React,
 * Graphics Engine, and 3D scenes with deterministic progress synchronization.
 */

import type { AnimatableProperties } from "../animate.js";

export const CHOREOGRAPHY_INTELLIGENCE_VERSION = "1.0.0";

export type ChoreographySystemType = "dom" | "graphics" | "3d" | "react-state" | "custom";

export const CHOREOGRAPHY_SYSTEMS: readonly ChoreographySystemType[] = [
  "dom",
  "graphics",
  "3d",
  "react-state",
  "custom",
] as const;

export type ChoreographyPattern =
  | "multi-element-entrance"
  | "multi-element-exit"
  | "sequential"
  | "parallel"
  | "staggered"
  | "dom-graphics-sync"
  | "dom-3d-sync"
  | "graphics-3d-sync"
  | "full-cross-system"
  | "scroll-choreography"
  | "interaction-choreography"
  | "storytelling-sequence"
  | "loading-completion";

export const CHOREOGRAPHY_PATTERNS: readonly ChoreographyPattern[] = [
  "multi-element-entrance",
  "multi-element-exit",
  "sequential",
  "parallel",
  "staggered",
  "dom-graphics-sync",
  "dom-3d-sync",
  "graphics-3d-sync",
  "full-cross-system",
  "scroll-choreography",
  "interaction-choreography",
  "storytelling-sequence",
  "loading-completion",
] as const;

export interface ChoreographyParticipant {
  readonly id: string;
  readonly system: ChoreographySystemType;
  readonly name?: string;
  readonly target?: any; // DOM element, Three.js object/camera, graphics instance, etc.
  readonly startProgress: number; // 0 to 1
  readonly endProgress: number;   // 0 to 1
  readonly properties?: Readonly<AnimatableProperties>;
  readonly easing?: string;
  readonly weight?: number;
  readonly onUpdate?: (normalizedProgress: number, localProgress: number) => void;
  readonly onStart?: () => void;
  readonly onComplete?: () => void;
  readonly onCancel?: () => void;
}

export interface ChoreographyDependency {
  readonly participantId: string;
  readonly dependsOnId: string;
  readonly type?: "start-after-end" | "start-with-start" | "offset";
  readonly offsetProgress?: number;
}

export interface ChoreographyPlan {
  readonly id: string;
  readonly name: string;
  readonly pattern: ChoreographyPattern;
  readonly duration: number; // total duration in ms
  readonly participants: readonly ChoreographyParticipant[];
  readonly dependencies: readonly ChoreographyDependency[];
  readonly easing: string;
  readonly compatibilityScore: number;
  readonly explanation: string;
  readonly respectReducedMotion: boolean;
  readonly reducedMotionPlan?: ChoreographyPlan;
}

export interface ChoreographyIntelligenceContext {
  readonly intent?: string;
  readonly pattern?: ChoreographyPattern;
  readonly systems?: readonly ChoreographySystemType[];
  readonly participantCount?: number;
  readonly duration?: number;
  readonly visualStyle?: string;
  readonly motionDNA?: string;
  readonly reducedMotion?: boolean;
  readonly deviceTier?: "low" | "medium" | "high";
  readonly loop?: boolean;
}

export interface ChoreographyIntelligenceResult {
  readonly plan: ChoreographyPlan;
  readonly alternatives: readonly ChoreographyPlan[];
  readonly compatibilityScore: number;
  readonly warnings: readonly string[];
  readonly explanation: string;
  readonly context: ChoreographyIntelligenceContext;
}

export interface ClassifiedChoreographyIntent {
  readonly pattern: ChoreographyPattern;
  readonly detectedSystems: readonly ChoreographySystemType[];
  readonly confidence: number;
  readonly matchedKeywords: readonly string[];
}

export interface CrossSystemSyncBridgeControls {
  readonly getProgress: () => number;
  readonly isPlaying: () => boolean;
  readonly seek: (progress: number) => void;
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reverse: () => Promise<void>;
  readonly cancel: () => void;
  readonly destroy: () => void;
  readonly addParticipant: (participant: ChoreographyParticipant) => () => void;
  readonly removeParticipant: (id: string) => void;
  readonly getParticipants: () => readonly ChoreographyParticipant[];
  readonly subscribe: (listener: (progress: number) => void) => () => void;
}
