import type { AnimateTarget } from "../core/animate.js";
export interface TextScrambleOptions {
    /** Animation duration in milliseconds. Must be >= 0. Defaults to 1000. */
    duration?: number;
    /** Unicode characters used for the scrambled suffix. Must not be empty. */
    characters?: string;
    /** Minimum interval between text updates, in milliseconds. Must be > 0. Defaults to 30. */
    speed?: number;
}
export interface TextScrambleControls {
    /** Stops the effect and restores each target's original text. Safe to repeat. */
    destroy(): void;
}
/**
 * Reveals each target's original text from randomized Unicode characters. The effect uses one
 * requestAnimationFrame loop for all targets and restores the exact original text on destroy.
 */
export declare function textScramble(target: AnimateTarget, options?: TextScrambleOptions): TextScrambleControls;
//# sourceMappingURL=text-scramble.d.ts.map