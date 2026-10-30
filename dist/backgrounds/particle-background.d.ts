import type { AnimateTarget } from "../core/animate.js";
export type ParticleBackgroundMode = "floating" | "network" | "cursor" | "constellation";
export interface ParticleBackgroundOptions {
    /** Rendering style. Defaults to "floating". */
    mode?: ParticleBackgroundMode;
    /** Fixed number of particles per target; exclusive with density. Defaults to 60. */
    count?: number;
    /** Particles per 10,000 CSS square pixels; overrides the default count. Capped at 1,000 per target. */
    density?: number;
    /** CSS colors used when no palette is selected. Defaults to violet and cyan. */
    colors?: readonly string[];
    /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
    palette?: string;
    /** Particle movement multiplier. Set to 0 for a static background. Defaults to 1. */
    speed?: number;
    /** Particle radius in CSS pixels. Defaults to 2. */
    size?: number;
    /** Particle opacity from 0 to 1. Defaults to 0.8. */
    opacity?: number;
    /** Maximum distance in CSS pixels for network and constellation connections. Defaults to 120. */
    connectionDistance?: number;
    /** Enables pointer response. Defaults to true for cursor mode and false otherwise. */
    pointerInteraction?: boolean;
    /** Pointer response radius in CSS pixels. Defaults to 120. */
    pointerRadius?: number;
    /** Pointer acceleration in CSS pixels per second squared. Defaults to 180. */
    pointerStrength?: number;
}
export interface ParticleBackgroundControls {
    /** Stops animation, removes the canvas, and releases all resources. Safe to repeat. */
    destroy(): void;
}
/**
 * Draws a Canvas 2D particle background behind one or more elements. Network and
 * constellation modes use spatially bucketed connections to avoid all-pairs scans.
 */
export declare function particleBackground(target: AnimateTarget, options?: ParticleBackgroundOptions): ParticleBackgroundControls;
//# sourceMappingURL=particle-background.d.ts.map