import type { AnimateTarget } from "../core/animate.js";
export type ShineTrigger = "hover" | "continuous" | "click";
export interface ShineOptions {
    /** CSS color of the glossy sweep. Defaults to translucent white. */
    color?: string;
    /** Direction angle of the diagonal sweep in degrees. Defaults to 120. */
    angle?: number;
    /** Duration of a sweep in milliseconds. Must be > 0. Defaults to 1200. */
    duration?: number;
    /** Overlay opacity between 0 and 1. Defaults to 0.7. */
    intensity?: number;
    /** Sweep continuously, on hover, or on click. Defaults to "hover". */
    trigger?: ShineTrigger;
}
export interface ShineControls {
    /** Cancels animations, removes listeners/overlays, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a diagonal glossy sweep using a pointer-transparent overlay.
 * Motion is driven by the Web Animations API, never a JavaScript animation loop.
 */
export declare function shine(target: AnimateTarget, options?: ShineOptions): ShineControls;
//# sourceMappingURL=shine.d.ts.map