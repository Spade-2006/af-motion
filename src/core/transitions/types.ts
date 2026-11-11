/**
 * AF Motion Automatic Transitions & Page Routing Contracts
 *
 * Framework-independent contracts for entrance, exit, page transitions,
 * shared-element motion, direction awareness, and transition coordination.
 */

import type { AnimatableProperties } from "../animate.js";
import type { ComponentCategory } from "../animation-intelligence/types.js";

export const TRANSITION_SPEC_VERSION = "1.0.0";

export type TransitionPattern =
  | "fade"
  | "slide"
  | "scale"
  | "reveal"
  | "clip-reveal"
  | "blur"
  | "shared-element"
  | "coordinated";

export const TRANSITION_PATTERNS: readonly TransitionPattern[] = [
  "fade",
  "slide",
  "scale",
  "reveal",
  "clip-reveal",
  "blur",
  "shared-element",
  "coordinated",
] as const;

export type TransitionDirection =
  | "in"
  | "out"
  | "up"
  | "down"
  | "left"
  | "right"
  | "forward"
  | "backward";

export const TRANSITION_DIRECTIONS: readonly TransitionDirection[] = [
  "in",
  "out",
  "up",
  "down",
  "left",
  "right",
  "forward",
  "backward",
] as const;

export type TransitionMode = "together" | "out-in" | "in-out";

export type TransitionState =
  | "unmounted"
  | "entering"
  | "entered"
  | "exiting"
  | "exited";

export interface SharedElementRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface TransitionConfig {
  readonly pattern?: TransitionPattern;
  readonly direction?: TransitionDirection;
  readonly duration?: number; // ms
  readonly delay?: number; // ms
  readonly easing?: string;
  readonly distance?: number | string; // e.g. 24 or "100%"
  readonly scale?: number; // e.g. 0.95
  readonly blur?: number | string; // e.g. 8 or "8px"
  readonly clipDirection?: "top" | "bottom" | "left" | "right" | "center";
  readonly stagger?: number; // ms offset for children
  readonly respectReducedMotion?: boolean;
  readonly sharedElementId?: string;
  readonly componentType?: ComponentCategory;
  readonly visualStyle?: string;
  readonly motionDNA?: string;
  readonly properties?: Readonly<AnimatableProperties>;
}

export interface PageTransitionConfig {
  readonly pattern?: TransitionPattern;
  readonly mode?: TransitionMode;
  readonly enter?: TransitionConfig;
  readonly exit?: TransitionConfig;
  readonly duration?: number;
  readonly easing?: string;
  readonly directionAware?: boolean;
}

export interface TransitionDefinition {
  readonly id: string;
  readonly name: string;
  readonly pattern: TransitionPattern;
  readonly properties: Readonly<AnimatableProperties>;
  readonly duration: number;
  readonly delay: number;
  readonly easing: string;
  readonly respectReducedMotion: boolean;
  readonly reducedMotionProperties?: Readonly<AnimatableProperties>;
  readonly stagger?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface PageTransitionDefinition {
  readonly mode: TransitionMode;
  readonly enter: TransitionDefinition;
  readonly exit: TransitionDefinition;
  readonly directionAware: boolean;
}

// ============================================================================
// PROMPT 115: SHARED ELEMENT & VIEW TRANSITIONS
// ============================================================================

export type SharedElementRole = "source" | "destination" | "auto";

export interface SharedElementStyles {
  opacity: number;
  borderRadius: string;
  transform: string;
  zIndex: string;
  boxShadow?: string;
  backgroundColor?: string;
}

export interface SharedElementSnapshot {
  id: string;
  role: SharedElementRole;
  element: HTMLElement | null;
  rect: SharedElementRect;
  styles: SharedElementStyles;
  timestamp: number;
  nestedUnder?: string;
}

export interface SharedElementRegistrationOptions {
  role?: SharedElementRole;
  nestedUnder?: string;
  zIndex?: number;
  keepMounted?: boolean;
  crossfade?: boolean;
  interpolateBorderRadius?: boolean;
}

export interface SharedElementTransitionConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  crossfade?: boolean;
  interpolateBorderRadius?: boolean;
  interpolateTransforms?: boolean;
  clipPath?: boolean | "inset" | "circle";
  respectReducedMotion?: boolean;
  overlayContainer?: HTMLElement;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export type SharedElementTransitionState =
  | "idle"
  | "measuring"
  | "animating"
  | "paused"
  | "completed"
  | "cancelled";

export interface SharedElementTransitionController {
  readonly state: SharedElementTransitionState;
  readonly progress: number;
  readonly isPlaying: boolean;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  reverse(): void;
  seek(progress: number): void;
  cancel(): void;
  finish(): void;
  retarget(newDestination: HTMLElement | SharedElementRect): void;
  getState(): SharedElementTransitionState;
}

export interface CreateSharedElementTransitionOptions {
  id?: string;
  source?: HTMLElement | string | SharedElementRect;
  destination?: HTMLElement | string | SharedElementRect;
  config?: SharedElementTransitionConfig;
  registry?: any; // SharedElementRegistry
}

export type ViewTransitionStrategy = "native-first" | "custom-only" | "shared-element";

export type ViewTransitionPresetName =
  | "fade"
  | "crossfade"
  | "slide"
  | "scale"
  | "zoom"
  | "shared-element"
  | "shared-element-crossfade"
  | "reveal"
  | "clip-path-reveal"
  | "directional-nav"
  | "morph";

export interface ViewTransitionOptions {
  strategy?: ViewTransitionStrategy;
  preset?: ViewTransitionPresetName;
  direction?: TransitionDirection;
  duration?: number;
  easing?: string;
  beforeTransition?: () => void | Promise<void>;
  afterTransition?: () => void | Promise<void>;
  onComplete?: () => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  sharedElements?: string[] | SharedElementTransitionConfig;
  respectReducedMotion?: boolean;
  types?: string[];
}

export type ViewTransitionStatus =
  | "idle"
  | "pending"
  | "ready"
  | "animating"
  | "finished"
  | "skipped"
  | "failed";

export interface ViewTransitionInstance {
  readonly ready: Promise<void>;
  readonly updateCallbackDone: Promise<void>;
  readonly finished: Promise<void>;
  readonly status: ViewTransitionStatus;
  skipTransition(): void;
}

export interface SharedElementGroupItem {
  id: string;
  source?: HTMLElement | SharedElementRect;
  destination?: HTMLElement | SharedElementRect;
  config?: SharedElementTransitionConfig;
  nestedUnder?: string;
}

export interface SharedElementGroupOptions {
  duration?: number;
  easing?: string;
  stagger?: number;
  order?: "forward" | "reverse" | "center-out";
  respectReducedMotion?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface SharedElementGroupController {
  readonly state: SharedElementTransitionState;
  readonly progress: number;
  readonly isPlaying: boolean;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  reverse(): void;
  seek(progress: number): void;
  cancel(): void;
  finish(): void;
  getState(): SharedElementTransitionState;
}
