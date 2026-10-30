import type { EasingFunction } from "../core/animation.js";
import type { AnimateTarget } from "../core/animate.js";
export type TextRevealMode = "characters" | "words";
export type TextRevealDirection = "up" | "down" | "left" | "right" | "none";
export type TextRevealTrigger = "scroll" | "immediate";
export interface TextRevealOptions {
    /** Units to reveal. Defaults to "words". */
    by?: TextRevealMode;
    /** Reveal duration in milliseconds. Defaults to 600. */
    duration?: number;
    /** Delay between units in milliseconds. Defaults to 50. */
    stagger?: number;
    /** CSS timing function or a progress easing function. Defaults to "ease". */
    easing?: string | EasingFunction;
    /** Direction units travel as they appear. Defaults to "up". */
    direction?: TextRevealDirection;
    /** Start immediately or when each target enters the viewport. Defaults to "immediate". */
    trigger?: TextRevealTrigger;
}
export interface TextRevealControls {
    /** Cancels pending starts, disconnects observers, and restores the original DOM. Safe to repeat. */
    destroy(): void;
}
/**
 * Reveals characters or words with CSS transitions, optionally when each target enters view.
 * Generated wrappers are removed and the original DOM tree restored on destroy.
 */
export declare function textReveal(target: AnimateTarget, options?: TextRevealOptions): TextRevealControls;
//# sourceMappingURL=text-reveal.d.ts.map