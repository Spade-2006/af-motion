import type { AnimateTarget } from "../core/animate.js";
import type { EasingFunction } from "../core/animation.js";
export interface FollowPointerOptions {
    /** Element or selector whose bounds constrain pointer-following movement. */
    container: AnimateTarget;
    /** Transition duration in seconds, from 0 (immediate) to 1. Defaults to 0.12. */
    smoothing?: number;
    /** Defaults to `easings.easeOutCubic`. */
    easing?: EasingFunction;
}
export interface FollowPointerControls {
    /** Removes listeners, cancels active transitions, and restores original transforms. */
    destroy(): void;
}
/**
 * Moves target elements to follow mouse or pen movement inside one container, constrained
 * so each target stays within the container. Transform contributions compose with other effects.
 */
export declare function followPointer(target: AnimateTarget, options: FollowPointerOptions): FollowPointerControls;
//# sourceMappingURL=follow-pointer.d.ts.map