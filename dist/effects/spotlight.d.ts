import type { AnimateTarget } from "../core/animate.js";
export interface SpotlightOptions {
    /** CSS color for the radial light. Defaults to translucent white. */
    color?: string;
    /** Spotlight radius in pixels. Must be > 0. Defaults to 180. */
    radius?: number;
    /** Glow opacity between 0 and 1. Defaults to 0.6. */
    intensity?: number;
    /** CSS transition smoothing in seconds. Must be between 0 and 1. Defaults to 0.12. */
    smoothing?: number;
}
export interface SpotlightControls {
    /** Removes pointer listeners and overlays and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a radial spotlight that follows pointer movement via CSS variables, without a JS animation loop.
 * Reduced motion disables tracking and displays a subtle centered glow.
 */
export declare function spotlight(target: AnimateTarget, options?: SpotlightOptions): SpotlightControls;
/** Alias for `spotlight()` with the same radial-glow options and cleanup behavior. */
export declare const pointerGlow: typeof spotlight;
export type PointerGlowOptions = SpotlightOptions;
export type PointerGlowControls = SpotlightControls;
//# sourceMappingURL=spotlight.d.ts.map