import type { AnimateTarget } from "../core/animate.js";
export type CosmicBackgroundEffect = "starfield" | "nebula" | "shooting-stars" | "galaxy";
export interface CosmicBackgroundOptions {
    /** Visual treatment. Defaults to "starfield". */
    effect?: CosmicBackgroundEffect;
    /** Stars per 10,000 CSS square pixels. Capped at 2,400 stars per target. Defaults to 1.5. */
    density?: number;
    /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
    speed?: number;
    /** Star depth amount from 0 to 1; affects star size and parallax. Defaults to 1. */
    depth?: number;
    /** Overall visual intensity from 0 to 1. Defaults to 0.8. */
    intensity?: number;
    /** CSS colors for the stars/clouds, or a registered palette's primary, secondary, and accent colors. */
    colors?: readonly string[];
    /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
    palette?: string;
    /** Shooting-star events per minute when effect is "shooting-stars". Set to 0 to disable. Defaults to 6. */
    shootingFrequency?: number;
    /** Shooting-star trail length in CSS pixels. Defaults to 140. */
    trailLength?: number;
}
export interface CosmicBackgroundControls {
    /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Renders a Canvas-based cosmic scene behind target content. Starfield, nebula,
 * shooting-star, and spiral-galaxy treatments share responsive and motion-aware cleanup.
 */
export declare function cosmicBackground(target: AnimateTarget, options?: CosmicBackgroundOptions): CosmicBackgroundControls;
//# sourceMappingURL=cosmic-background.d.ts.map