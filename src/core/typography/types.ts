/**
 * AF Motion Kinetic Typography Engine Contracts & Types
 *
 * Framework-independent contracts for text segmentation, kinetic typographic
 * properties, presets, staggers, text transitions, and motion path integration.
 */

import type { EasingOption } from "../../easing/easings.js";
import type { MotionPathDefinition } from "../motion-path/types.js";

export type TypographySegmentationMode = "characters" | "words" | "lines" | "paragraphs" | "custom";

export interface TypographyUnit {
  readonly id: string;
  readonly text: string;
  readonly index: number;
  readonly total: number;
  readonly type: TypographySegmentationMode;
  readonly element?: HTMLElement;
  readonly parentIndex?: number;
  readonly isWhitespace: boolean;
}

export interface SegmentTextOptions {
  /** Segmentation granularity. Defaults to "words". */
  by?: TypographySegmentationMode;
  /** Base CSS class applied to each wrapper span. Defaults to "af-kinetic-unit". */
  className?: string;
  /** Whether to retain and wrap whitespace. Defaults to true. */
  preserveWhitespace?: boolean;
  /** BCP 47 language tag(s) for locale-aware segmentation. */
  locales?: string | string[];
  /** Custom splitter function when by is "custom". */
  customSegmenter?: (text: string) => string[];
  /** Preserves accessibility by applying aria-label to root and aria-hidden to units. Defaults to true. */
  aria?: boolean;
}

export interface SegmentationResult {
  readonly units: ReadonlyArray<TypographyUnit>;
  readonly rootElement?: HTMLElement;
  readonly originalText: string;
  restore(): void;
  destroy(): void;
}

export interface TypographyStyleState {
  opacity?: number;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  blur?: number;
  letterSpacing?: number | string;
  wordSpacing?: number | string;
  color?: string;
  transformOrigin?: string;
}

export type StaggerOrder = "forward" | "reverse" | "center-out" | "edges-in" | "random";

export interface StaggerConfig {
  /** Delay between consecutive units in milliseconds. */
  each?: number;
  /** Ordering strategy. Defaults to "forward". */
  from?: StaggerOrder | number;
  /** Easing applied across the stagger sequence. */
  ease?: EasingOption;
  /** Deterministic seed for random stagger order. Defaults to 42. */
  seed?: number;
  /** Custom calculation callback returning delay offset in milliseconds. */
  custom?: (index: number, total: number, unit: TypographyUnit) => number;
}

export type TypographyPresetName =
  | "fade-in"
  | "fade-up"
  | "fade-down"
  | "slide-in"
  | "scale-reveal"
  | "blur-reveal"
  | "rotate-reveal"
  | "character-wave"
  | "word-stagger"
  | "line-reveal"
  | "typewriter"
  | "text-scramble"
  | "split-reveal"
  | "bounce-characters"
  | "elastic-entrance"
  | "highlight-sweep";

export interface TypographyPresetOptions {
  duration?: number;
  delay?: number;
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  stagger?: number | StaggerConfig;
  scrambleCharset?: string;
  highlightColor?: string;
}

export interface TypographyPresetDefinition {
  name: TypographyPresetName;
  from: TypographyStyleState;
  to: TypographyStyleState;
  defaultDuration: number;
  defaultEasing: EasingOption;
  defaultBy: TypographySegmentationMode;
  defaultStagger?: StaggerConfig;
}

export interface TypographyAnimationOptions {
  by?: TypographySegmentationMode;
  preset?: TypographyPresetName;
  presetOptions?: TypographyPresetOptions;
  from?: TypographyStyleState;
  to?: TypographyStyleState;
  duration?: number;
  delay?: number;
  easing?: EasingOption;
  stagger?: number | StaggerConfig;
  motionPath?: MotionPathDefinition;
  pathOffset?: number;
  autoRotate?: boolean;
  repeat?: number;
  yoyo?: boolean;
  respectReducedMotion?: boolean;
  transformOwner?: object;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onProgress?: (progress: number, unitIndex: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface TypographyAnimationControls {
  seek(progress: number): void;
  pause(): void;
  resume(): void;
  reverse(): void;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  cancel(): void;
  finish(): void;
  destroy(): void;
  readonly finished: Promise<void>;
}

export type TypographyTransitionType =
  | "crossfade"
  | "character-replace"
  | "word-replace"
  | "line-replace"
  | "rolling-text"
  | "scramble-transition"
  | "sequential-replace";

export interface TypographyTransitionOptions {
  type?: TypographyTransitionType;
  duration?: number;
  delay?: number;
  easing?: EasingOption;
  stagger?: number | StaggerConfig;
  scrambleCharset?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface TypographyTimelineStep {
  target: HTMLElement | string;
  options: TypographyAnimationOptions;
  position?: number | string;
}

export interface TypographyTimeline {
  add(target: HTMLElement | string, options: TypographyAnimationOptions, position?: number | string): TypographyTimeline;
  play(): void;
  pause(): void;
  seek(progress: number): void;
  reverse(): void;
  cancel(): void;
  readonly duration: number;
  readonly finished: Promise<void>;
}
