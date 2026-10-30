import type { AnimateTarget } from "../core/animate.js";
export interface NoiseBackgroundOptions {
    /** Noise alpha amplitude between 0 and 1. Defaults to 0.15. */
    intensity?: number;
    /** Noise grain size in CSS pixels. Must be > 0. Defaults to 1. */
    scale?: number;
    /** Texture refreshes per second. Set to 0 for static noise. Defaults to 0. */
    speed?: number;
    /** Overlay opacity between 0 and 1. Defaults to 0.25. */
    opacity?: number;
}
export interface NoiseBackgroundControls {
    /** Stops rendering, disconnects resize observation, and removes the overlay. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a procedural canvas noise overlay behind target content. `speed` controls texture
 * refreshes per second; zero or reduced motion keeps the initial texture static.
 */
export declare function noiseBackground(target: AnimateTarget, options?: NoiseBackgroundOptions): NoiseBackgroundControls;
//# sourceMappingURL=noise.d.ts.map