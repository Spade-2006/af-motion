import type { AnimateTarget } from "../core/animate.js";
export interface ParticleFieldOptions {
    /** Colors used for particles and connection lines. Defaults to violet and cyan. */
    colors?: readonly string[];
    /** Number of particles per target. Must be an integer from 1 to 1000. Defaults to 60. */
    count?: number;
    /** Particle radius in CSS pixels. Must be > 0. Defaults to 2. */
    size?: number;
    /** Particle velocity multiplier. Must be >= 0. Defaults to 1. */
    speed?: number;
    /** Whether to draw lines between nearby particles. Defaults to false. */
    connections?: boolean;
}
export interface ParticleFieldControls {
    /** Stops rendering, disconnects observers, and removes the canvases. Safe to repeat. */
    destroy(): void;
}
/**
 * Draws a lightweight particle field behind target content using one shared animation frame
 * scheduler. Canvas rendering pauses when every target is outside the viewport.
 */
export declare function particleField(target: AnimateTarget, options?: ParticleFieldOptions): ParticleFieldControls;
//# sourceMappingURL=particle-field.d.ts.map