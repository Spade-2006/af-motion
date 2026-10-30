import type { AnimateTarget } from "../core/animate.js";
export interface TypewriterOptions {
    /** Phrases to type in order. At least one non-empty phrase is required. */
    phrases: readonly string[];
    /** Delay between typed characters in milliseconds. Must be > 0. Defaults to 70. */
    typeSpeed?: number;
    /** Delay between deleted characters in milliseconds. Must be > 0. Defaults to 35. */
    deleteSpeed?: number;
    /** Pause after a phrase is fully typed, in milliseconds. Must be >= 0. Defaults to 1200. */
    pause?: number;
    /** Whether to restart from the first phrase after the last phrase. Defaults to true. */
    loop?: boolean;
    /** Cursor text appended while typing. Use an empty string to hide it. Defaults to "|". */
    cursor?: string;
}
export interface TypewriterControls {
    /** Cancels pending timers and restores each target's original text. Safe to repeat. */
    destroy(): void;
}
/**
 * Types and deletes phrases using one shared timer for every target. Phrase text is split into
 * Unicode code points, and destroying the effect restores each target's original text.
 */
export declare function typewriter(target: AnimateTarget, options: TypewriterOptions): TypewriterControls;
//# sourceMappingURL=typewriter.d.ts.map