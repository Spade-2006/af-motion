import type { AnimatableProperties, AnimateTarget } from "../core/animate.js";
import type { EasingOption } from "../easing/easings.js";
export interface ScrollAnimateOptions {
    /** Window or scrollable element to track. Defaults to window. */
    scrollTarget?: Window | AnimateTarget;
    /** Maps scroll progress through the same easing registry used by `animate()`. */
    easing?: EasingOption;
    /** Reverses the mapping so scroll start applies the `to` values. Defaults to false. */
    reverse?: boolean;
    /** Called after the animated values are updated for a new scroll progress. */
    onUpdate?: (progress: number) => void;
}
export interface ScrollAnimateControls {
    /** Pauses scroll-driven writes while retaining the latest progress. */
    pause(): void;
    /** Resumes scroll-driven writes at the latest measured progress. */
    resume(): void;
    /** Returns the latest normalized scroll progress. */
    getProgress(): number;
    /** Removes scroll listeners and cancels pending work. Safe to repeat. */
    destroy(): void;
}
/**
 * Binds an animation's normalized progress to page or element scroll progress.
 * The existing animation interpolation and easing engine performs every property write.
 */
export declare function scrollAnimate(target: AnimateTarget, properties: AnimatableProperties, options?: ScrollAnimateOptions): ScrollAnimateControls;
//# sourceMappingURL=scroll-animate.d.ts.map