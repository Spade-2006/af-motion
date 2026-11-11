/**
 * AF Motion Automatic Layout Animation Engine Contracts
 *
 * Framework-independent contracts for automatic layout detection,
 * First-Last-Invert-Play (FLIP) pipeline, layout groups, and coordinated transitions.
 */

import type { AnimatableProperties } from "../animate.js";
import type { AnimationControls } from "../animation.js";
import type { EasingOption } from "../../easing/easings.js";

export const LAYOUT_SPEC_VERSION = "1.0.0";

/**
 * Geometric bounding box representation for layout calculations.
 */
export interface LayoutRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly right: number;
  readonly bottom: number;
  readonly scrollX?: number;
  readonly scrollY?: number;
}

/**
 * Delta values between First and Last layout states.
 */
export interface LayoutDelta {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly hasMoved: boolean;
  readonly hasResized: boolean;
  readonly first: LayoutRect;
  readonly last: LayoutRect;
}

/**
 * Animation modes for layout transitions.
 */
export type LayoutAnimationMode =
  | "position"
  | "size"
  | "both"
  | "scale"
  | "fade-through"
  | "none";

/**
 * Built-in layout transition presets.
 */
export type LayoutPreset =
  | "gentle"
  | "snappy"
  | "bouncy"
  | "smooth"
  | "subtle";

/**
 * Configurable options for an enter transition on newly inserted elements.
 */
export interface LayoutEnterAnimation {
  readonly opacity?: number;
  readonly scale?: number;
  readonly duration?: number;
  readonly easing?: EasingOption;
}

/**
 * Configurable options for an exit transition on removed elements.
 */
export interface LayoutExitAnimation {
  readonly opacity?: number;
  readonly scale?: number;
  readonly duration?: number;
  readonly easing?: EasingOption;
}

/**
 * Common configuration options for layout transitions.
 */
export interface LayoutTransitionOptions {
  /** Duration in milliseconds or seconds (values <= 10 are treated as seconds). Defaults to 300ms. */
  readonly duration?: number;
  /** Easing curve or preset name. Defaults to "cubic-bezier(0.25, 1, 0.5, 1)". */
  readonly easing?: EasingOption;
  /** Layout animation mode: "position", "size", "both", "scale", "fade-through", or "none". Defaults to "both". */
  readonly mode?: LayoutAnimationMode;
  /** Named layout preset: "gentle", "snappy", "bouncy", "smooth", or "subtle". */
  readonly preset?: LayoutPreset;
  /** Delay before animation starts (ms or s). Defaults to 0. */
  readonly delay?: number;
  /** CSS transform-origin. Defaults to "top left" for accurate FLIP scaling. */
  readonly transformOrigin?: string;
  /** Whether to respect user's reduced-motion preference. Defaults to true. */
  readonly respectReducedMotion?: boolean;
  /** Whether to animate cross-axis transitions smoothly. Defaults to true. */
  readonly crossAxis?: boolean;
  /** Compensate for parent element scale transformations. Defaults to false. */
  readonly compensateParentScale?: boolean;
  /** Optional enter animation if element was just added to layout. */
  readonly enterAnimation?: LayoutEnterAnimation;
  /** Optional exit animation before element is removed. */
  readonly exitAnimation?: LayoutExitAnimation;
  /** Lifecycle callback when layout transition begins. */
  readonly onStart?: (element: HTMLElement) => void;
  /** Lifecycle callback during animation progress (0 to 1). */
  readonly onUpdate?: (progress: number) => void;
  /** Lifecycle callback when layout transition finishes. */
  readonly onComplete?: (element: HTMLElement) => void;
  /** Lifecycle callback when layout transition is cancelled or retargeted. */
  readonly onCancel?: (element: HTMLElement) => void;
}

/**
 * Options for configuring a single layout controller.
 */
export interface LayoutControllerOptions extends LayoutTransitionOptions {
  /** Optional unique identifier for this element. */
  readonly id?: string;
  /** Whether to automatically observe resize and mutations using ResizeObserver / MutationObserver. Defaults to true. */
  readonly autoObserve?: boolean;
  /** Whether to observe parent container child mutations. Defaults to true. */
  readonly observeParent?: boolean;
  /** Debounce/batch delay in milliseconds for layout observation. Defaults to 0 (RAF batched). */
  readonly batchWaitMs?: number;
  /** Event callback fired whenever a layout change is detected. */
  readonly onLayoutChange?: (change: LayoutChangeEvent) => void;
}

/**
 * Detailed information about a detected layout change.
 */
export interface LayoutChangeEvent {
  readonly element: HTMLElement;
  readonly previousRect: LayoutRect;
  readonly currentRect: LayoutRect;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly hasMoved: boolean;
  readonly hasResized: boolean;
}

/**
 * Current runtime state of a layout controller.
 */
export interface LayoutControllerState {
  readonly id: string;
  readonly isAnimating: boolean;
  readonly isObserved: boolean;
  readonly bounds: LayoutRect | null;
  readonly lastDelta: LayoutDelta | null;
  readonly currentProgress: number;
}

/**
 * Primary interface for controlling automatic layout animations on a DOM element.
 */
export interface LayoutController {
  readonly id: string;
  readonly element: HTMLElement;
  getState(): LayoutControllerState;
  getBounds(): LayoutRect | null;
  isAnimating(): boolean;
  measure(): LayoutRect;
  record(): LayoutRect;
  animate(options?: Partial<LayoutTransitionOptions>): AnimationControls | null;
  retarget(newTargetRect?: LayoutRect): void;
  updateOptions(options: Partial<LayoutControllerOptions>): void;
  play(): void;
  pause(): void;
  cancel(): void;
  finish(): void;
  destroy(): void;
}

/**
 * Staggering sequence direction across layout group members.
 */
export type LayoutStaggerDirection = "forward" | "reverse" | "center" | "random";

/**
 * Options for coordinating a group of layout-animated elements.
 */
export interface LayoutGroupOptions extends LayoutTransitionOptions {
  /** Optional group ID. */
  readonly id?: string;
  /** Stagger delay between items in milliseconds (or seconds). */
  readonly stagger?: number;
  /** Staggering order direction. Defaults to "forward". */
  readonly staggerDirection?: LayoutStaggerDirection;
  /** Whether to synchronize animation durations across all members. Defaults to false. */
  readonly coordinated?: boolean;
}

/**
 * Group controller for coordinating multi-element layout transitions.
 */
export interface LayoutGroup {
  readonly id: string;
  add(element: HTMLElement | LayoutController, options?: Partial<LayoutControllerOptions>): LayoutController;
  remove(elementOrId: HTMLElement | string): void;
  get(elementOrId: HTMLElement | string): LayoutController | undefined;
  getAll(): readonly LayoutController[];
  measureAll(): Map<string, LayoutRect>;
  recordAll(): void;
  animateAll(options?: Partial<LayoutGroupOptions>): readonly AnimationControls[];
  updateOptions(options: Partial<LayoutGroupOptions>): void;
  cancelAll(): void;
  destroy(): void;
}
