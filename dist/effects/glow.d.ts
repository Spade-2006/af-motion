import type { AnimateTarget } from "../core/animate.js";
export type GlowMode = "static" | "pulse" | "hover";
export type GlowTrigger = "immediate" | "hover";
export interface GlowOptions {
    /** CSS glow color. Defaults to violet. */
    color?: string;
    /** Glow opacity between 0 and 1. Defaults to 0.7. */
    intensity?: number;
    /** Glow blur radius in pixels. Defaults to 24. */
    blur?: number;
    /** Static, pulsing, or pointer-hover glow. Defaults to "static". */
    mode?: GlowMode;
    /** Pulse period in milliseconds. Defaults to 2000. */
    duration?: number;
    /** Activate immediately or only while hovered. Defaults to "immediate". */
    trigger?: GlowTrigger;
}
export interface GlowControls {
    /** Cancels animations, removes pointer listeners, and restores original inline styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a static, pulsing, or hover-activated glow without replacing existing content or shadows.
 */
export declare function glow(target: AnimateTarget, options?: GlowOptions): GlowControls;
//# sourceMappingURL=glow.d.ts.map