import type { AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
export interface HoverMotionValues {
    /** Horizontal translation in pixels. Defaults to 0. */
    x?: number;
    /** Vertical translation in pixels. Defaults to 0. */
    y?: number;
    /** Scale multiplier. Defaults to 1. */
    scale?: number;
    /** Rotation in degrees. Defaults to 0. */
    rotate?: number;
}
export interface HoverMotionOptions {
    /** Transform layer applied while the pointer is over an element. */
    enter?: HoverMotionValues;
    /** Transform layer applied after leaving; a custom pose remains until re-entry or destroy. */
    leave?: HoverMotionValues;
    /** Transition duration in milliseconds. Defaults to 220. */
    duration?: number;
    /** Defaults to `easings.easeOutCubic`. */
    easing?: EasingFunction;
}
export interface HoverMotionControls {
    /** Removes listeners, cancels active transitions, and restores original transforms. */
    destroy(): void;
}
/**
 * Animates a composable transform layer on pointer enter/leave and keyboard focus/blur.
 * Mouse and pen pointers are supported; touch and reduced-motion preferences leave elements
 * at their resting state.
 */
export declare function hoverMotion(target: AnimateTarget, options?: HoverMotionOptions): HoverMotionControls;
//# sourceMappingURL=hover-motion.d.ts.map