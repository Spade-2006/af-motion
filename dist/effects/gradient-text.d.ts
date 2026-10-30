import type { AnimateTarget } from "../core/animate.js";
export interface GradientTextOptions {
    /** CSS colors used for the text gradient. Defaults to a violet/cyan pair. */
    colors?: readonly string[];
    /** Gradient angle in degrees. Defaults to 90. */
    angle?: number;
    /** Animation duration in milliseconds. Defaults to 4000. */
    duration?: number;
    /** Enables gradient movement. Defaults to false. */
    animated?: boolean;
    /** Repeats the animation indefinitely. Defaults to true. */
    loop?: boolean;
}
export interface GradientTextControls {
    /** Cancels animation and restores the original inline text styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Applies a CSS text gradient and optionally moves it with the Web Animations API.
 * Original inline styles are restored when destroyed.
 */
export declare function gradientText(target: AnimateTarget, options?: GradientTextOptions): GradientTextControls;
//# sourceMappingURL=gradient-text.d.ts.map