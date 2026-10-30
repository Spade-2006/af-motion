import type { AnimateTarget } from "../core/animate.js";
export interface AuroraOptions {
    /** CSS colors used to create the aurora gradient. Defaults to a violet/cyan/pink palette. */
    colors?: readonly string[];
    /** Duration of one animation cycle, in seconds. Must be > 0. Defaults to 8. */
    speed?: number;
    /** Blur radius in pixels. Must be >= 0. Defaults to 60. */
    blur?: number;
    /** Overlay opacity between 0 and 1. Defaults to 0.7. */
    opacity?: number;
    /** Overlay corner radius in pixels. Must be >= 0. Defaults to 24. */
    borderRadius?: number;
    /** Number of flowing gradient ribbons from 1 to 8. Defaults to 3. */
    waveCount?: number;
}
export interface AuroraControls {
    /** Removes the background, injected keyframes and any temporary target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a softly blurred, animated gradient behind each target's content.
 * Reduced-motion preferences disable the keyframe animation while keeping the static gradient.
 */
export declare function aurora(target: AnimateTarget, options?: AuroraOptions): AuroraControls;
//# sourceMappingURL=aurora.d.ts.map