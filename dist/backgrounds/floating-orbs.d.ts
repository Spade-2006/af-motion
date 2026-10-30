import type { AnimateTarget } from "../core/animate.js";
export interface FloatingOrbsOptions {
    /** CSS colors assigned to the orbs in order. Defaults to a violet/cyan/pink palette. */
    colors?: readonly string[];
    /** Number of orbs per target. Must be an integer from 1 to 100. Defaults to 5. */
    count?: number;
    /** Smallest orb diameter in pixels. Must be > 0. Defaults to 80. */
    minSize?: number;
    /** Largest orb diameter in pixels. Must be >= minSize. Defaults to 240. */
    maxSize?: number;
    /** Blur radius in pixels. Must be >= 0. Defaults to 40. */
    blur?: number;
    /** Duration of one animation cycle, in seconds. Must be > 0. Defaults to 12. */
    speed?: number;
    /** Orb opacity between 0 and 1. Defaults to 0.6. */
    opacity?: number;
}
export interface FloatingOrbsControls {
    /** Removes the orbs, keyframes and temporary target styles. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Adds softly glowing, CSS-animated orbs behind target content.
 * Reduced-motion preferences keep the orbs visible but disable their animation.
 */
export declare function floatingOrbs(target: AnimateTarget, options?: FloatingOrbsOptions): FloatingOrbsControls;
//# sourceMappingURL=floating-orbs.d.ts.map