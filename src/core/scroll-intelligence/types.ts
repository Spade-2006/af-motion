/**
 * AF Motion Scroll Intelligence Contracts
 *
 * Framework-independent contracts for intelligent scroll animation generation,
 * scroll intent classification, progress calculation modes, parallax, and 2D-to-3D synchronization.
 */

import type { AnimatableProperties } from "../animate.js";
import type { ComponentCategory } from "../animation-intelligence/types.js";
import type { ScrollSceneController } from "../../3d/scroll/controller.js";

export const SCROLL_INTELLIGENCE_VERSION = "1.0.0";

export type ScrollAnimationType =
  | "reveal"
  | "parallax"
  | "sticky-story"
  | "progress-indicator"
  | "stagger-sequence"
  | "horizontal-section"
  | "scroll-typography"
  | "scroll-3d-sync";

export const SCROLL_ANIMATION_TYPES: readonly ScrollAnimationType[] = [
  "reveal",
  "parallax",
  "sticky-story",
  "progress-indicator",
  "stagger-sequence",
  "horizontal-section",
  "scroll-typography",
  "scroll-3d-sync",
] as const;

export type ScrollProgressMode = "viewport" | "element" | "container";

export const SCROLL_PROGRESS_MODES: readonly ScrollProgressMode[] = [
  "viewport",
  "element",
  "container",
] as const;

export type ScrollDirection = "down" | "up" | "both";

export interface ScrollTriggerOffset {
  readonly start?: string | number; // e.g. "top bottom", "center center", 0.2, 100
  readonly end?: string | number; // e.g. "bottom top", 0.8, 500
}

export interface ScrollPlan {
  readonly id: string;
  readonly name: string;
  readonly type: ScrollAnimationType;
  readonly progressMode: ScrollProgressMode;
  readonly startOffset: string | number;
  readonly endOffset: string | number;
  readonly properties: Readonly<AnimatableProperties>;
  readonly easing?: string;
  readonly reversible: boolean;
  readonly clamp: boolean;
  readonly stagger?: number;
  readonly sync3DTimelineId?: string;
  readonly compatibilityScore: number;
  readonly explanation: string;
  readonly respectReducedMotion: boolean;
  readonly reducedMotionProperties?: Readonly<AnimatableProperties>;
}

export interface ScrollIntelligenceContext {
  readonly intent?: string;
  readonly type?: ScrollAnimationType;
  readonly componentType?: ComponentCategory;
  readonly visualStyle?: string;
  readonly motionDNA?: string;
  readonly container?: HTMLElement | Window;
  readonly direction?: ScrollDirection;
  readonly reversible?: boolean;
  readonly progressMode?: ScrollProgressMode;
  readonly startOffset?: string | number;
  readonly endOffset?: string | number;
  readonly stagger?: number;
  readonly deviceTier?: "low" | "medium" | "high";
  readonly reducedMotion?: boolean;
  readonly sync3DController?: ScrollSceneController;
}

export interface ScrollIntelligenceResult {
  readonly plan: ScrollPlan;
  readonly alternatives: readonly ScrollPlan[];
  readonly compatibilityScore: number;
  readonly warnings: readonly string[];
  readonly explanation: string;
  readonly context: ScrollIntelligenceContext;
}

export interface ClassifiedScrollIntent {
  readonly type: ScrollAnimationType;
  readonly confidence: number;
  readonly matchedKeywords: readonly string[];
}

export interface ScrollRuntimeProgressState {
  readonly progress: number; // 0 to 1
  readonly rawProgress: number; // un-clamped
  readonly direction: "down" | "up";
  readonly velocity: number;
  readonly inView: boolean;
}

export interface ScrollRuntimeControls {
  readonly destroy: () => void;
  readonly getState: () => ScrollRuntimeProgressState;
  readonly pause: () => void;
  readonly resume: () => void;
}

export interface ScrollRuntimeCallbacks {
  readonly onProgress?: (state: ScrollRuntimeProgressState) => void;
  readonly onEnter?: () => void;
  readonly onLeave?: () => void;
}
