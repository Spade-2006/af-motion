import type { AnimateTarget } from "../core/animate.js";
export type RippleOrigin = "pointer" | "center";
export interface RippleOptions {
    /** CSS color of the expanding wave. Defaults to translucent white. */
    color?: string;
    /** Wave animation duration in milliseconds. Must be > 0. Defaults to 600. */
    duration?: number;
    /** Final scale relative to the calculated circle size. Must be > 0. Defaults to 2. */
    scale?: number;
    /** Center the wave or use the click position. Defaults to "pointer". */
    origin?: RippleOrigin;
}
export interface RippleControls {
    /** Cancels active waves, removes click listeners, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Creates expanding, fading click waves at the pointer or target center.
 * Click events are observed without preventing default behavior or stopping propagation.
 */
export declare function ripple(target: AnimateTarget, options?: RippleOptions): RippleControls;
//# sourceMappingURL=ripple.d.ts.map