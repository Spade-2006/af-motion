import type { AnimateTarget } from "../core/animate.js";
import type { EasingName } from "../easing/easings.js";
import type { EasingFunction } from "../core/animation.js";
export interface CountUpOptions {
    /** Starting number. Defaults to 0. */
    from?: number;
    /** Final number. Defaults to 100. */
    to?: number;
    /** Animation duration in milliseconds. Must be >= 0. Defaults to 1000. */
    duration?: number;
    /** Number of fractional digits to display. Must be an integer from 0 to 20. Defaults to 0. */
    decimals?: number;
    /** Text prepended to the formatted number. Defaults to an empty string. */
    prefix?: string;
    /** Text appended to the formatted number. Defaults to an empty string. */
    suffix?: string;
    /** Name of an easing in the public registry, or a custom easing function. Defaults to linear. */
    easing?: EasingName | EasingFunction;
}
export interface CountUpControls {
    /** Cancels pending frames and restores each target's original text. Safe to repeat. */
    destroy(): void;
}
/**
 * Animates formatted numeric values for every target using one shared requestAnimationFrame
 * loop. Destroying the effect cancels the frame and restores each element's original text.
 */
export declare function countUp(target: AnimateTarget, options?: CountUpOptions): CountUpControls;
//# sourceMappingURL=count-up.d.ts.map