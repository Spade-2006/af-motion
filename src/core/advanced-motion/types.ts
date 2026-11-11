/**
 * AF Motion Unified Advanced Motion Composition Contracts
 *
 * Framework-independent contracts for orchestrating SVG morphing, motion paths,
 * kinetic typography, shared elements, view transitions, layout, and physics.
 */

import type { EasingFunction } from "../animation.js";
import type { MorphAnimationOptions } from "../svg-morph/types.js";
import type { PathAnimationOptions, MotionPathDefinition } from "../motion-path/types.js";
import type { TypographyAnimationOptions } from "../typography/types.js";
import type { SharedElementTransitionConfig, SharedElementRect } from "../transitions/types.js";

export const ADVANCED_MOTION_SPEC_VERSION = "1.0.0";

export type MotionParticipantSystem =
  | "svg-morph"
  | "motion-path"
  | "typography"
  | "shared-element"
  | "view-transition"
  | "animation"
  | "physics"
  | "custom";

export type MotionParticipantState =
  | "idle"
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

export type CompositionPlaybackState =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "cancelled"
  | "disposed";

export type CompositionFailurePolicy = "abort" | "continue" | "rollback";

// -----------------------------------------------------------------------------
// PARTICIPANT DEFINITIONS
// -----------------------------------------------------------------------------

export interface BaseParticipantConfig {
  /** Unique participant identifier within the composition. */
  readonly id: string;
  /** Motion system type. */
  readonly system: MotionParticipantSystem;
  /** Explicit list of participant IDs that must complete before this starts. */
  readonly dependsOn?: readonly string[];
  /** Absolute start time in ms or timeline label/offset (e.g., 200, "+=100", ">", "<", "labelName"). */
  readonly at?: number | string;
  /** Duration in milliseconds. If omitted, derived from system config. */
  readonly duration?: number;
  /** Initial delay before this participant runs once scheduled. */
  readonly delay?: number;
  /** Easing curve for progress distribution. */
  readonly easing?: string | EasingFunction;
  /** Optional human-readable label. */
  readonly label?: string;
  /** Whether this participant can be skipped if reduced-motion is preferred. */
  readonly respectReducedMotion?: boolean;
}

export interface SVGMorphParticipantConfig extends BaseParticipantConfig {
  readonly system: "svg-morph";
  readonly target: SVGPathElement | string;
  readonly to: string;
  readonly options?: MorphAnimationOptions;
}

export interface MotionPathParticipantConfig extends BaseParticipantConfig {
  readonly system: "motion-path";
  readonly target: HTMLElement | SVGElement | string;
  readonly path: MotionPathDefinition;
  readonly options?: PathAnimationOptions;
}

export interface TypographyParticipantConfig extends BaseParticipantConfig {
  readonly system: "typography";
  readonly target: HTMLElement | string;
  readonly options?: TypographyAnimationOptions;
}

export interface SharedElementParticipantConfig extends BaseParticipantConfig {
  readonly system: "shared-element";
  readonly source?: HTMLElement | string | SharedElementRect;
  readonly destination?: HTMLElement | string | SharedElementRect;
  readonly options?: SharedElementTransitionConfig;
}

export interface ViewTransitionParticipantConfig extends BaseParticipantConfig {
  readonly system: "view-transition";
  readonly update: () => void | Promise<void>;
  readonly options?: Record<string, unknown>;
}

export interface AnimationParticipantConfig extends BaseParticipantConfig {
  readonly system: "animation";
  readonly target: HTMLElement | SVGElement | string;
  readonly keyframes: Record<string, unknown>;
  readonly options?: Record<string, unknown>;
}

export interface PhysicsParticipantConfig extends BaseParticipantConfig {
  readonly system: "physics";
  readonly target: HTMLElement | string;
  readonly type?: "spring" | "inertia";
  readonly options?: Record<string, unknown>;
}

export interface CustomParticipantConfig extends BaseParticipantConfig {
  readonly system: "custom";
  readonly run: (progress: number, state: MotionParticipantState) => void | Promise<void>;
  readonly onCancel?: () => void;
  readonly onFinish?: () => void;
  readonly onDispose?: () => void;
}

export type MotionParticipantConfig =
  | SVGMorphParticipantConfig
  | MotionPathParticipantConfig
  | TypographyParticipantConfig
  | SharedElementParticipantConfig
  | ViewTransitionParticipantConfig
  | AnimationParticipantConfig
  | PhysicsParticipantConfig
  | CustomParticipantConfig;

// -----------------------------------------------------------------------------
// COMPOSITION DEFINITIONS
// -----------------------------------------------------------------------------

export interface AdvancedMotionCompositionDefinition {
  /** Unique composition identifier. */
  readonly id: string;
  /** Optional human-readable title. */
  readonly name?: string;
  /** Motion participants in this composition. */
  readonly participants: readonly MotionParticipantConfig[];
  /** Overall composition timing overrides. */
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string | EasingFunction;
  readonly iterations?: number;
  readonly playbackRate?: number;
  readonly respectReducedMotion?: boolean;
  readonly failurePolicy?: CompositionFailurePolicy;
  /** Named timeline markers mapping name to millisecond timestamp. */
  readonly labels?: Record<string, number>;
  /** Metadata and developer diagnostics. */
  readonly metadata?: Record<string, unknown>;
  /** Lifecycle callbacks. */
  readonly onStart?: () => void;
  readonly onUpdate?: (progress: number) => void;
  readonly onComplete?: () => void;
  readonly onError?: (error: Error) => void;
  readonly onCancel?: () => void;
}

// -----------------------------------------------------------------------------
// ADAPTER CONTRACTS
// -----------------------------------------------------------------------------

export interface MotionParticipantInstance {
  readonly id: string;
  readonly system: MotionParticipantSystem;
  start(): Promise<void> | void;
  pause(): void;
  resume(): void;
  reverse(): void;
  seek(progress: number): void;
  cancel(): void;
  finish(): void;
  dispose(): void;
  getProgress(): number;
  getState(): MotionParticipantState;
  readonly finished?: Promise<void>;
}

export interface MotionEngineAdapter {
  readonly system: MotionParticipantSystem;
  createInstance(config: MotionParticipantConfig): MotionParticipantInstance;
}

// -----------------------------------------------------------------------------
// CONTROLLER & TIMELINE CONTRACTS
// -----------------------------------------------------------------------------

export interface ScheduledTrack {
  readonly participant: MotionParticipantConfig;
  readonly instance: MotionParticipantInstance;
  readonly startTime: number; // ms from composition start
  readonly endTime: number;   // ms from composition start
  readonly duration: number;  // ms
  state: MotionParticipantState;
  progress: number;
}

export interface AdvancedMotionCompositionController {
  readonly id: string;
  readonly state: CompositionPlaybackState;
  readonly progress: number;
  readonly isPlaying: boolean;
  readonly duration: number;
  readonly activeParticipants: readonly string[];
  readonly error: Error | null;

  play(): Promise<void>;
  pause(): void;
  resume(): void;
  reverse(): void;
  seek(progressOrLabel: number | string): void;
  restart(): Promise<void>;
  cancel(): void;
  finish(): void;
  dispose(): void;

  getState(): CompositionPlaybackState;
  getParticipantProgress(id: string): number;
  getParticipantState(id: string): MotionParticipantState | undefined;
  getTracks(): readonly ScheduledTrack[];
}

// -----------------------------------------------------------------------------
// VALIDATION & PRESETS
// -----------------------------------------------------------------------------

export interface AdvancedCompositionValidationError {
  readonly participantId?: string;
  readonly field?: string;
  readonly code:
    | "DUPLICATE_ID"
    | "EMPTY_ID"
    | "UNKNOWN_SYSTEM"
    | "INVALID_TIMING"
    | "CIRCULAR_DEPENDENCY"
    | "MISSING_DEPENDENCY"
    | "ADAPTER_ERROR"
    | "INVALID_PARTICIPANT";
  readonly message: string;
}

export type CompositionValidationError = AdvancedCompositionValidationError;

export interface AdvancedCompositionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly AdvancedCompositionValidationError[];
  readonly warnings: readonly string[];
}

export type CompositionValidationResult = AdvancedCompositionValidationResult;

export type AdvancedCompositionPresetName =
  | "svg-morph-and-path"
  | "typography-and-path"
  | "shared-element-and-layout"
  | "typography-and-shared-element"
  | "multi-element-coordinated-reveal"
  | "morphing-scene-transition"
  | "cinematic-page-transition"
  | "physics-path-choreography";
