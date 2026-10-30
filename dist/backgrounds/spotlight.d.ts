import type { AnimateTarget } from "../core/animate.js";
export interface SpotlightBackgroundOptions {
    /** CSS color of the glow. Defaults to violet. */
    color?: string;
    /** Radius of the glow in pixels. Must be > 0. Defaults to 300. */
    radius?: number;
    /** Glow opacity between 0 and 1. Defaults to 0.35. */
    intensity?: number;
    /** Pointer-position transition duration in seconds, between 0 and 1. Defaults to 0.15. */
    smoothing?: number;
}
export interface SpotlightBackgroundControls {
    /** Removes pointer listeners and the glow layer, restoring temporary target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a radial glow that follows the pointer within each target. CSS transitions smooth
 * pointer changes without a JavaScript animation loop; reduced motion keeps it centered.
 */
export declare function spotlightBackground(target: AnimateTarget, options?: SpotlightBackgroundOptions): SpotlightBackgroundControls;
//# sourceMappingURL=spotlight.d.ts.map