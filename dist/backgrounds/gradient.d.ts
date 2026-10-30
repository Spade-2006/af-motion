import type { AnimateTarget } from "../core/animate.js";
export interface GradientBackgroundOptions {
    /** CSS colors used in the gradient. Defaults to a violet/cyan/pink palette. */
    colors?: readonly string[];
    /** Gradient angle in degrees. Defaults to 135. */
    angle?: number;
    /** Duration of one animation cycle in seconds. Set to 0 for a static gradient. Defaults to 8. */
    speed?: number;
    /** Gradient opacity between 0 and 1. Defaults to 0.8. */
    opacity?: number;
}
export interface GradientBackgroundControls {
    /** Removes the gradient, keyframes and any temporary target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a smooth CSS gradient behind each target. A positive speed animates the gradient;
 * speed 0 or a reduced-motion preference displays it statically.
 */
export declare function gradientBackground(target: AnimateTarget, options?: GradientBackgroundOptions): GradientBackgroundControls;
//# sourceMappingURL=gradient.d.ts.map