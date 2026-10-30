import type { AnimateTarget } from "../core/animate.js";
export interface GridBackgroundOptions {
    /** CSS color used for the grid lines. Defaults to violet. */
    color?: string;
    /** Distance between grid lines in pixels. Must be > 0. Defaults to 40. */
    cellSize?: number;
    /** Grid line thickness in pixels. Must be > 0 and no larger than cellSize. Defaults to 1. */
    lineWidth?: number;
    /** Grid opacity between 0 and 1. Defaults to 0.25. */
    opacity?: number;
    /** Duration of one subtle animation cycle in seconds. Set to 0 for a static grid. Defaults to 0. */
    speed?: number;
}
export interface GridBackgroundControls {
    /** Removes the grid, keyframes and temporary target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Adds a responsive CSS grid overlay behind target content. Positive speed subtly shifts
 * the grid using CSS keyframes; zero speed or reduced motion keeps it static.
 */
export declare function gridBackground(target: AnimateTarget, options?: GridBackgroundOptions): GridBackgroundControls;
//# sourceMappingURL=grid.d.ts.map